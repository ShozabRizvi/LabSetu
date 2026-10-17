import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  SparklesIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  LanguageIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import './CitizenDashboard.css';

export default function CitizenReportExplainer({ lang: propLang }) {
  const { lang: contextLang } = useLanguage();
  const effectiveLang = propLang || contextLang || 'en';
  const [activeLang, setActiveLang] = useState(effectiveLang);

  useEffect(() => {
    setActiveLang(effectiveLang);
  }, [effectiveLang]);
  const [selectedParam, setSelectedParam] = useState('hba1c');
  const [customValue, setCustomValue] = useState('6.8');
  const [analyzed, setAnalyzed] = useState(true);

  const knowledgeBase = {
    hba1c: {
      name: 'HbA1c (Glycosylated Hemoglobin)',
      unit: '%',
      refRange: '< 5.7% (Normal), 5.7 - 6.4% (Prediabetes), >= 6.5% (Elevated)',
      sampleValue: '6.8',
      explanationEn: {
        whatIsIt: 'HbA1c measures the percentage of your red blood cells that have sugar-coated hemoglobin. Because red blood cells live for about 3 months, it reflects your average blood sugar level over the past 90 days, unlike a daily fasting finger-prick test.',
        whatValueMeans: 'A value of 6.8% is above the standard non-diabetic range (< 5.7%). In clinical guidelines, values of 6.5% or above indicate that blood glucose levels have been consistently higher than optimal over recent months.',
        commonFactors: 'Dietary habits, physical activity level, stress, medication adherence, or biological insulin resistance.',
        questionsForDoctor: [
          'What is my individualized target HbA1c level considering my age and lifestyle?',
          'Should we consider adjusting my diet plan, physical routine, or any medications?',
          'When should I schedule my next follow-up HbA1c checkup?'
        ]
      },
      explanationHi: {
        whatIsIt: 'HbA1c यह मापता है कि आपके लाल रक्त कोशिकाओं में हीमोग्लोबिन पर कितनी शर्करा (शुगर) चिपकी हुई है। यह पिछले 3 महीनों (90 दिनों) का औसत शुगर स्तर दर्शाता है, जो दैनिक टेस्ट से अधिक सटीक दीर्घकालिक तस्वीर देता है।',
        whatValueMeans: '6.8% का स्तर सामान्य सीमा (< 5.7%) से ऊपर है। मेडिकल दिशानिर्देशों के अनुसार, 6.5% या उससे अधिक का स्तर यह संकेत देता है कि हाल के महीनों में शरीर में शुगर का स्तर निर्धारित लक्ष्य से अधिक रहा है।',
        commonFactors: 'खानपान की आदतें, व्यायाम की कमी, तनाव, या शरीर में इंसुलिन का ठीक से काम न करना।',
        questionsForDoctor: [
          'मेरी उम्र और स्वास्थ्य के अनुसार मेरा व्यक्तिगत HbA1c लक्ष्य क्या होना चाहिए?',
          'क्या मुझे अपने आहार या दवाओं में किसी बदलाव की आवश्यकता है?',
          'मुझे अगला फॉलो-अप टेस्ट कब कराना चाहिए?'
        ]
      }
    },
    hb: {
      name: 'Hemoglobin (Hb)',
      unit: 'g/dL',
      refRange: '13.0 - 17.0 (Males), 12.0 - 15.0 (Females)',
      sampleValue: '10.8',
      explanationEn: {
        whatIsIt: 'Hemoglobin is the vital iron-rich protein inside red blood cells responsible for transporting oxygen from your lungs to all vital organs and muscle tissues throughout the body.',
        whatValueMeans: 'A value of 10.8 g/dL is mildly below standard reference thresholds. When hemoglobin is lower than optimal, body tissues receive slightly less oxygen, which can contribute to mild fatigue or low stamina.',
        commonFactors: 'Nutritional iron deficiency, vitamin B12 / folate levels, hydration, or minor blood loss (such as menstrual cycle).',
        questionsForDoctor: [
          'Is my lower hemoglobin linked to dietary iron or another underlying factor?',
          'Do you advise a Ferritin or Iron Studies panel to verify iron stores?',
          'Should I incorporate iron-rich foods or a mild nutritional supplement?'
        ]
      },
      explanationHi: {
        whatIsIt: 'हीमोग्लोबिन लाल रक्त कोशिकाओं में मौजूद आयरन युक्त प्रोटीन है जो फेफड़ों से शरीर के सभी अंगों तक ऑक्सीजन पहुंचाने का काम करता है।',
        whatValueMeans: '10.8 g/dL का मान सामान्य स्तर से थोड़ा कम है। हीमोग्लोबिन कम होने से शरीर को पर्याप्त ऑक्सीजन नहीं मिल पाती, जिससे सुस्ती, थकान या सांस फूलने का अहसास हो सकता है।',
        commonFactors: 'आयरन की कमी, विटामिन B12 की कमी, पौष्टिक आहार का अभाव या खून की कमी।',
        questionsForDoctor: [
          'क्या मेरा हीमोग्लोबिन सामान्य आहार सुधार से ठीक हो सकता है?',
          'क्या मुझे सीरम फेरिटिन या आयरन प्रोफाइल टेस्ट कराने की जरूरत है?',
          'मेरे लिए कौन से पौष्टिक खाद्य पदार्थ सबसे अच्छे रहेंगे?'
        ]
      }
    },
    cholesterol: {
      name: 'Total Cholesterol & Lipid Profile',
      unit: 'mg/dL',
      refRange: '< 200 mg/dL (Desirable), 200 - 239 (Borderline), >= 240 (High)',
      sampleValue: '228',
      explanationEn: {
        whatIsIt: 'Total cholesterol is an essential waxy fat synthesized by your liver and obtained through certain foods. While vital for building cells and hormones, excessive circulating levels can accumulate along artery walls over time.',
        whatValueMeans: 'At 228 mg/dL, this value falls in the borderline elevated tier. It is important to inspect the full lipid sub-fractions (LDL "bad" cholesterol, HDL "good" protective cholesterol, and Triglycerides) rather than total alone.',
        commonFactors: 'Saturated fat intake, lack of aerobic exercise, metabolic genetics, or thyroid function.',
        questionsForDoctor: [
          'How do my LDL and HDL fractions look relative to this total score?',
          'What lifestyle and heart-healthy dietary changes are recommended?',
          'Do my overall cardiovascular risk scores warrant routine monitoring?'
        ]
      },
      explanationHi: {
        whatIsIt: 'कोलेस्ट्रॉल एक प्रकार की वसा (फैट) है जो लिवर द्वारा बनाई जाती है। यह कोशिकाओं और हार्मोन्स के निर्माण के लिए जरूरी है, लेकिन अधिक मात्रा रक्त वाहिकाओं में जम सकती है।',
        whatValueMeans: '228 mg/dL का मान सीमा रेखा (बॉर्डरलाइन) से थोड़ा अधिक है। सिर्फ टोटल ही नहीं, बल्कि एलडीएल (खराब) और एचडीएल (अच्छा) कोलेस्ट्रॉल का अनुपात देखना जरूरी है।',
        commonFactors: 'तला-भुना या चिकनाई युक्त भोजन, शारीरिक सक्रियता की कमी, या आनुवंशिक प्रभाव।',
        questionsForDoctor: [
          'मेरा एलडीएल और एचडीएल स्तर कैसा है?',
          'मुझे अपने दिल की सेहत के लिए खानपान में क्या बदलाव करने चाहिए?',
          'अगला लिपिड प्रोफाइल टेस्ट कब कराना उचित रहेगा?'
        ]
      }
    },
    tsh: {
      name: 'Thyroid Stimulating Hormone (TSH)',
      unit: 'uIU/mL',
      refRange: '0.40 - 4.20 uIU/mL (Adult euthyroid range)',
      sampleValue: '5.6',
      explanationEn: {
        whatIsIt: 'TSH is produced by the pituitary gland in your brain to signal your thyroid gland how much T3 and T4 metabolism hormones to secrete.',
        whatValueMeans: 'A value of 5.6 uIU/mL is slightly above the upper normal limit. When the thyroid gland produces slightly less hormone than the body demands, the pituitary sends out more TSH to stimulate it (often termed mild subclinical hypothyroidism).',
        commonFactors: 'Stress, recovery from viral illness, autoimmune thyroid factors, or iodine balance.',
        questionsForDoctor: [
          'Does this slight elevation require treatment or simply repeat testing in 6 to 8 weeks?',
          'Should we test Free T3, Free T4, and anti-TPO antibodies?',
          'Could this explain any mild sluggishness, dry skin, or weight changes?'
        ]
      },
      explanationHi: {
        whatIsIt: 'TSH मस्तिष्क की पिट्यूटरी ग्रंथि द्वारा बनाया जाता है जो थायरॉइड ग्रंथि को थायरॉइड हार्मोन (T3, T4) बनाने का निर्देश देता है।',
        whatValueMeans: '5.6 uIU/mL का स्तर सामान्य सीमा से थोड़ा अधिक है। इसका मतलब है कि थायरॉइड ग्रंथि को सक्रिय करने के लिए शरीर को अधिक संकेत भेजना पड़ रहा है।',
        commonFactors: 'तनाव, हालिया वायरल संक्रमण, या थायरॉइड ग्रंथि की धीमी कार्यप्रणाली।',
        questionsForDoctor: [
          'क्या मुझे अभी दवा की जरूरत है या 2 महीने बाद दोबारा टेस्ट कराना ठीक रहेगा?',
          'क्या मुझे फ्री T3 और फ्री T4 टेस्ट भी कराना चाहिए?',
          'थायरॉइड स्वास्थ्य के लिए मुझे क्या सावधानियां बरतनी चाहिए?'
        ]
      }
    }
  };

  const current = knowledgeBase[selectedParam];
  const expl = activeLang === 'hi' ? current.explanationHi : current.explanationEn;

  return (
    <div className="citizen-page">
      <div className="citizen-page-header">
        <div>
          <h1 className="citizen-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SparklesIcon style={{ width: '28px', color: '#15803d' }} />
            {activeLang === 'hi' ? 'एआई लैब रिपोर्ट व्याख्याता (हेल्थ एक्सप्लेनर)' : 'AI Diagnostic Report Explainer'}
          </h1>
          <p className="citizen-page-subtitle">
            {activeLang === 'hi'
              ? 'जटिल मेडिकल रिपोर्ट और रक्त जांच के आंकड़ों को सरल और सहज भाषा में समझें'
              : 'Understand medical parameters and laboratory values in simple, non-jargon language'}
          </p>
        </div>

        {/* Language Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <LanguageIcon style={{ width: '18px', color: '#15803d' }} />
          <button
            onClick={() => setActiveLang('en')}
            style={{
              border: 'none',
              background: activeLang === 'en' ? '#15803d' : 'transparent',
              color: activeLang === 'en' ? 'white' : '#475569',
              padding: '0.25rem 0.6rem',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            English
          </button>
          <button
            onClick={() => setActiveLang('hi')}
            style={{
              border: 'none',
              background: activeLang === 'hi' ? '#15803d' : 'transparent',
              color: activeLang === 'hi' ? 'white' : '#475569',
              padding: '0.25rem 0.6rem',
              borderRadius: '4px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* MANDATORY MEDICAL DISCLAIMER BANNER */}
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '10px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '0.85rem',
        alignItems: 'flex-start'
      }}>
        <ExclamationTriangleIcon style={{ width: '26px', color: '#b45309', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: 1.55 }}>
          <strong>
            {activeLang === 'hi' 
              ? 'महत्वपूर्ण चिकित्सकीय अस्वीकरण (Medical Disclaimer):'
              : 'Important Clinical & Educational Disclaimer:'}
          </strong>{' '}
          {activeLang === 'hi'
            ? 'यह एआई रिपोर्ट व्याख्याता केवल स्वास्थ्य जागरूकता और शैक्षिक उद्देश्य के लिए है। यह किसी भी प्रकार की चिकित्सीय सलाह, रोग निदान या दवा की पर्ची (प्रिस्क्रिप्शन) नहीं है। किसी भी स्वास्थ्य निर्णय या दवा लेने से पहले हमेशा अपने योग्य चिकित्सक से परामर्श करें।'
            : 'This AI explanation is generated strictly for patient health literacy and educational understanding. It does NOT constitute medical diagnosis, clinical opinion, or pharmaceutical prescription. Always share your complete certified laboratory report with your qualified treating doctor.'}
        </div>
      </div>

      {/* Parameter Selector */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#334155' }}>
            {activeLang === 'hi' ? 'जांच चुनें:' : 'Select Parameter to Explain:'}
          </span>
          {[
            { id: 'hba1c', label: 'HbA1c (Diabetes)' },
            { id: 'hb', label: 'Hemoglobin (Anemia)' },
            { id: 'cholesterol', label: 'Cholesterol (Lipids)' },
            { id: 'tsh', label: 'TSH (Thyroid)' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedParam(p.id);
                setCustomValue(knowledgeBase[p.id].sampleValue);
              }}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '20px',
                border: selectedParam === p.id ? '1px solid #15803d' : '1px solid #cbd5e1',
                background: selectedParam === p.id ? '#f0fdf4' : '#ffffff',
                color: selectedParam === p.id ? '#15803d' : '#475569',
                fontWeight: selectedParam === p.id ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        {/* Main Card */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {activeLang === 'hi' ? 'बायोमार्कर जानकारी' : 'BIOMARKER OVERVIEW'}
              </span>
              <h2 style={{ margin: '0.25rem 0', fontSize: '1.4rem', color: '#0f172a' }}>{current.name}</h2>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                {activeLang === 'hi' ? 'मानक संदर्भ सीमा:' : 'Standard Reference Interval:'}{' '}
                <strong style={{ color: '#0f172a' }}>{current.refRange}</strong>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem 1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{activeLang === 'hi' ? 'सैंपल वैल्यू' : 'Observed Value'}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: '800', color: '#15803d' }}>
                {customValue} <small style={{ fontSize: '0.8rem', fontWeight: '600' }}>{current.unit}</small>
              </div>
            </div>
          </div>

          {/* Section 1: What is this test */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <InformationCircleIcon style={{ width: '20px', color: '#15803d' }} />
              {activeLang === 'hi' ? 'यह जांच क्या है और शरीर में क्या काम करती है?' : 'What is this test and what does it measure?'}
            </h3>
            <p style={{ margin: 0, color: '#334155', lineHeight: 1.65, fontSize: '0.95rem' }}>
              {expl.whatIsIt}
            </p>
          </div>

          {/* Section 2: What the number indicates */}
          <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid #15803d' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.5rem' }}>
              {activeLang === 'hi' ? 'इस आंकड़े का सामान्य अर्थ क्या है?' : 'What does this value generally indicate?'}
            </h3>
            <p style={{ margin: '0 0 0.75rem', color: '#334155', lineHeight: 1.65, fontSize: '0.95rem' }}>
              {expl.whatValueMeans}
            </p>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <strong>{activeLang === 'hi' ? 'संभावित कारक:' : 'Common contributing factors:'}</strong> {expl.commonFactors}
            </div>
          </div>

          {/* Section 3: Recommended questions to ask your doctor */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheckIcon style={{ width: '20px', color: '#2563eb' }} />
              {activeLang === 'hi' ? 'अपने डॉक्टर से पूछने के लिए अनुशंसित प्रश्न:' : 'Smart questions to ask your doctor at your consultation:'}
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#334155', lineHeight: 1.6, fontSize: '0.9rem' }}>
              {expl.questionsForDoctor.map((q, idx) => (
                <li key={idx} style={{ marginBottom: '0.4rem' }}>{q}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
