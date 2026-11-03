/**
 * LabSetu Authentication Service - Supabase Database Auth Integration
 * 
 * Strict Database-Only Authentication:
 * All authentications, registrations, and session verifications are strictly
 * executed against Supabase Database Auth (auth.users and public.profiles).
 * Zero mock users, zero mock tokens, zero local bypasses.
 */

import { supabase } from '../lib/supabase';
import apiClient from './apiClient';

export const authService = {
  /**
   * Log in user exclusively using Supabase Auth signInWithPassword
   * @param {string} identifier - User email
   * @param {string} password - User password
   * @param {'citizen' | 'authority'} role - Intended portal role
   */
  async login(identifier, password, role) {
    const cleanEmail = (identifier || '').trim().toLowerCase();

    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address.' };
    }
    if (!password) {
      return { success: false, error: 'Please enter your password.' };
    }

    try {
      // 1. Mathematically authenticate with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error || !data?.session || !data?.user) {
        return {
          success: false,
          error: error?.message || 'Invalid login credentials. Please check your email and password.'
        };
      }

      const authUser = data.user;
      const session = data.session;

      // 2. Query user profile from profiles table strictly by authenticated user ID
      let profile = null;
      try {
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
        if (pData) profile = pData;
      } catch (dbErr) {
        console.warn('[authService.login] Profile lookup notice:', dbErr);
      }

      // 3. Query patients table if citizen
      let patientRow = null;
      try {
        const { data: ptData } = await supabase
          .from('patients')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
        if (ptData) patientRow = ptData;
      } catch (ptErr) {
        console.warn('[authService.login] Patient lookup notice:', ptErr);
      }

      const resolvedRole = ['authority', 'admin', 'staff'].includes(authUser.app_metadata?.role) ? 'authority' : 'citizen';

      // Role boundary validation: warn if logging into citizen portal with authority account or vice versa
      if (role && role !== resolvedRole) {
        await supabase.auth.signOut({ scope: 'local' });
        return {
          success: false,
          error: `This account is registered as ${resolvedRole === 'authority' ? 'Authority / Staff' : 'Patient / Citizen'}. Please select the ${resolvedRole === 'authority' ? 'Authority' : 'Patient'} tab.`
        };
      }

      const resolvedName = profile?.display_name || profile?.full_name || patientRow?.full_name || authUser.user_metadata?.full_name || 'Patient';
      const resolvedUhid = profile?.uhid || patientRow?.patient_code || 'Pending';

      const user = {
        id: authUser.id,
        email: authUser.email,
        name: resolvedName,
        role: resolvedRole,
        phone: profile?.phone || patientRow?.phone || '',
        uhid: resolvedRole === 'citizen' ? resolvedUhid : undefined,
        centerName: 'LabSetu Diagnostics',
        labId: '61326885'
      };

      if (session.access_token) {
        apiClient.setToken(session.access_token);
      }

      return {
        success: true,
        user,
        session
      };
    } catch (err) {
      console.error('[authService.login] Authentication exception:', err);
      return {
        success: false,
        error: err.message || 'Unable to connect to authentication server. Please try again.'
      };
    }
  },

  /**
   * Register a new user in Supabase auth.users with metadata and database profile
   */
  async register(userData) {
    const cleanEmail = (userData.email || '').trim().toLowerCase();
    const fullName = (userData.name || '').trim();
    const cleanPhone = (userData.phone || '').replace(/\D/g, '');

    if (!cleanEmail) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!userData.password || userData.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      // 1. Create real record in Supabase auth.users with full_name in metadata payload
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: userData.password,
        options: {
          data: {
            full_name: fullName,
            role: userData.role
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'Registration failed with Supabase.'
        };
      }

      const authUser = data?.user;
      if (!authUser?.id) {
        return {
          success: false,
          error: 'User creation failed. No user object returned by database.'
        };
      }

      const assignedUhid = userData.role === 'citizen'
        ? (userData.uhid || `UHID-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
        : undefined;

      // 2. Persist to public.profiles table (and patients if citizen)
      try {
        await supabase.from('profiles').upsert({
          id: authUser.id,
          email: cleanEmail,
          full_name: fullName,
          phone: cleanPhone || null,
          role: userData.role === 'authority' ? 'admin' : 'citizen',
          uhid: assignedUhid,
          is_active: true
        });

        if (userData.role === 'citizen') {
          await supabase.from('patients').upsert({
            id: authUser.id,
            patient_code: assignedUhid,
            full_name: fullName,
            phone: cleanPhone || null,
            email: cleanEmail,
            is_active: true
          });
        }
      } catch (dbErr) {
        console.warn('[authService.register] Direct profile persist note:', dbErr);
      }

      return {
        success: true,
        user: {
          id: authUser.id,
          email: cleanEmail,
          name: fullName,
          role: userData.role,
          uhid: assignedUhid
        },
        session: data.session
      };
    } catch (err) {
      console.error('[authService.register] Registration exception:', err);
      return {
        success: false,
        error: err.message || 'Registration failed. Please check network connectivity.'
      };
    }
  },

  /**
   * Get current authenticated user profile from active Supabase session
   */
  async getCurrentUser() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        return { success: false, user: null };
      }

      const authUser = session.user;
      let profile = null;
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
        if (data) profile = data;
      } catch {}

      return {
        success: true,
        user: {
          id: authUser.id,
          email: authUser.email,
          name: profile?.full_name || authUser.user_metadata?.full_name || 'Patient',
          role: profile?.role === 'admin' ? 'authority' : (authUser.user_metadata?.role || 'citizen'),
          uhid: profile?.uhid || 'Pending'
        }
      };
    } catch {
      return { success: false, user: null };
    }
  },

  /**
   * Invalidate session and sign out from Supabase
   */
  async logout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[authService.logout] Supabase signOut note:', err);
    } finally {
      apiClient.setToken(null);
    }
    return { success: true };
  },

  /**
   * Reset password via Supabase
   */
  async resetPassword(email, newPassword) {
    try {
      if (newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) return { success: false, error: error.message };
        return { success: true, message: 'Password updated successfully' };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) return { success: false, error: error.message };
      return { success: true, message: 'Password reset link sent to your email.' };
    } catch (err) {
      return { success: false, error: err.message || 'Password reset request failed.' };
    }
  }
};

export default authService;
