-- =====================================================================================
-- LabSetu Migration: Security Question Bypass for Unauthenticated Password Reset (RPC)
-- File: supabase/migrations/20261102_security_question_rpc_bypass.sql
-- Fix: Resolved ambiguous column reference by prefixing RPC parameters (p_email, p_security_answer, p_new_password)
-- =====================================================================================

-- Enable pgcrypto extension for native Blowfish password encryption
create extension if not exists pgcrypto with schema extensions;

-- 1. Ensure security question and answer columns exist on profiles and patients
alter table public.profiles add column if not exists security_question text;
alter table public.profiles add column if not exists security_answer text;
alter table public.profiles add column if not exists security_question_1 text;
alter table public.profiles add column if not exists security_answer_1 text;

alter table public.patients add column if not exists security_question text;
alter table public.patients add column if not exists security_answer text;

-- 2. Remote Procedure Call (RPC): Get security question tied to an email
-- SECURITY DEFINER allows unauthenticated ('anon') users to query only the question (never the answer)
drop function if exists public.get_security_question_by_email(text);

create or replace function public.get_security_question_by_email(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
  v_question text;
  v_cleaned_email text;
begin
  v_cleaned_email := lower(trim(p_email));

  if v_cleaned_email is null or v_cleaned_email = '' then
    return jsonb_build_object('success', false, 'error', 'Please enter a valid email address.');
  end if;

  -- Check profiles table for patient or authority staff with explicit table alias
  select coalesce(p.security_question, p.security_question_1) into v_question
  from public.profiles p
  where lower(trim(p.email)) = v_cleaned_email
  order by (case when p.security_question is not null then 1 else 2 end)
  limit 1;

  -- Check patients table if not found
  if v_question is null or trim(v_question) = '' then
    select pt.security_question into v_question
    from public.patients pt
    where lower(trim(pt.email)) = v_cleaned_email
    limit 1;
  end if;

  -- If account exists in auth.users but has no custom question configured yet, supply fallback
  if v_question is null or trim(v_question) = '' then
    select u.id into v_user_id
    from auth.users u
    where lower(trim(u.email)) = v_cleaned_email
    limit 1;

    if v_user_id is not null then
      v_question := 'What is your childhood nickname?';
    else
      return jsonb_build_object('success', false, 'error', 'No account found with this email address.');
    end if;
  end if;

  return jsonb_build_object(
    'success', true,
    'question', v_question
  );
end;
$$;

grant execute on function public.get_security_question_by_email(text) to anon, authenticated, service_role;

-- 3. Remote Procedure Call (RPC): Reset Password via Security Question Verification
-- Executes with SECURITY DEFINER to bypass session requirement and update auth.users directly
-- Input parameters are explicitly prefixed (p_email, p_security_answer, p_new_password)
-- to prevent PostgreSQL ambiguous column reference collision with profiles.security_answer
drop function if exists public.reset_password_via_security_question(text, text, text);

create or replace function public.reset_password_via_security_question(
  p_email text,
  p_security_answer text,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
  v_stored_answer text;
  v_cleaned_email text;
  v_cleaned_answer text;
  v_hashed_password text;
begin
  v_cleaned_email := lower(trim(p_email));
  v_cleaned_answer := lower(trim(p_security_answer));

  -- Parameter validation
  if v_cleaned_email is null or v_cleaned_email = '' then
    return jsonb_build_object('success', false, 'error', 'Email address is required.');
  end if;

  if v_cleaned_answer is null or v_cleaned_answer = '' then
    return jsonb_build_object('success', false, 'error', 'Please provide an answer to your security question.');
  end if;

  if p_new_password is null or length(p_new_password) < 6 then
    return jsonb_build_object('success', false, 'error', 'Password must be at least 6 characters long.');
  end if;

  -- Step 1: Find user's unique ID in auth.users by email
  select u.id into v_user_id
  from auth.users u
  where lower(trim(u.email)) = v_cleaned_email
  limit 1;

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'No account found with this email address.');
  end if;

  -- Step 2: Fetch stored security answer from public.profiles using explicit alias
  select coalesce(p.security_answer, p.security_answer_1) into v_stored_answer
  from public.profiles p
  where p.id = v_user_id or lower(trim(p.email)) = v_cleaned_email
  order by (case when p.security_answer is not null then 1 else 2 end)
  limit 1;

  if v_stored_answer is null then
    select pt.security_answer into v_stored_answer
    from public.patients pt
    where pt.id = v_user_id or lower(trim(pt.email)) = v_cleaned_email
    limit 1;
  end if;

  if v_stored_answer is null or trim(v_stored_answer) = '' then
    return jsonb_build_object('success', false, 'error', 'No security question configured for this account. Please contact laboratory support.');
  end if;

  -- Step 3: Compare answers (case-insensitive and trimmed)
  if lower(trim(v_stored_answer)) <> v_cleaned_answer then
    return jsonb_build_object('success', false, 'error', 'Incorrect security answer. Please check your answer and try again.');
  end if;

  -- Step 4: Encrypt new password using Postgres pgcrypto Blowfish algorithm
  begin
    v_hashed_password := extensions.crypt(p_new_password, extensions.gen_salt('bf'));
  exception when others then
    v_hashed_password := crypt(p_new_password, gen_salt('bf'));
  end;

  -- Step 5: Directly overwrite the encrypted_password in auth.users
  update auth.users
  set 
    encrypted_password = v_hashed_password,
    updated_at = now()
  where auth.users.id = v_user_id;

  return jsonb_build_object('success', true, 'message', 'Password updated successfully! You may now sign in.');
end;
$$;

-- Grant execution to anon (unauthenticated) so users on Forgot Password screen can execute it
grant execute on function public.reset_password_via_security_question(text, text, text) to anon, authenticated, service_role;
