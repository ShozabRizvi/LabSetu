import React from 'react';

function comparisonLabel(comparison, language) {
  const labels = language === 'hi'
    ? { within_range: 'सीमा के भीतर', outside_range: 'सीमा से बाहर', not_comparable: 'तुलना उपलब्ध नहीं' }
    : { within_range: 'Within range', outside_range: 'Outside range', not_comparable: 'Not comparable' };
  return labels[comparison] || labels.not_comparable;
}

export default function ReportExplanation({ data, language = 'en' }) {
  const hi = language === 'hi';

  function downloadSummary() {
    const lines = [
      ...(data.synthetic ? ['SYNTHETIC DEMONSTRATION — not a clinical patient record'] : []),
      hi ? 'सरल भाषा में स्वीकृत रिपोर्ट' : 'Approved report in simple language',
      ...data.summary,
      '',
      ...(hi ? ['प्रयोगशाला मान'] : ['Laboratory values']),
      ...data.values.map((row) => `${row.testName} — ${row.name}: ${row.value} ${row.unit}; ${hi ? 'संदर्भ सीमा' : 'reference interval'}: ${row.referenceRange}; ${comparisonLabel(row.comparison, language)}. ${row.explanation}`),
      '',
      hi ? 'यह निदान नहीं है। चिकित्सक से चर्चा करें।' : 'This is not a diagnosis. Discuss the report with your clinician.'
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `LabSetu-easy-report-${data.id}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="labsetu-report-explanation" aria-label={hi ? 'सरल भाषा में रिपोर्ट' : 'Easy report explanation'}>
    {data.synthetic && <p className="labsetu-report-demo" role="note">SYNTHETIC DEMONSTRATION — not a clinical patient record</p>}
    <h3>{hi ? 'सरल भाषा में सारांश' : 'Easy-language summary'}</h3>
    <ul>{data.summary.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
    <div className="labsetu-report-table-wrap">
      <table>
        <caption>{hi ? 'स्वीकृत रिपोर्ट के मान और प्रयोगशाला संदर्भ सीमाएँ' : 'Approved report values and laboratory reference intervals'}</caption>
        <thead><tr>
          <th scope="col">{hi ? 'जाँच / माप' : 'Test / measure'}</th>
          <th scope="col">{hi ? 'दर्ज मान' : 'Recorded value'}</th>
          <th scope="col">{hi ? 'संदर्भ सीमा' : 'Reference interval'}</th>
          <th scope="col">{hi ? 'तुलना' : 'Comparison'}</th>
        </tr></thead>
        <tbody>{data.values.map((row, index) => <tr key={`${row.testName}-${row.name}-${index}`}>
          <th scope="row">{row.testName} — {row.name}<span>{row.explanation}</span></th>
          <td>{row.value} {row.unit}</td>
          <td>{row.referenceRange}</td>
          <td>{comparisonLabel(row.comparison, language)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <p className="labsetu-report-note">
      {hi
        ? 'सीमा के बाहर का मान अपने आप में निदान नहीं है। रिपोर्ट की समीक्षा चिकित्सक से करें।'
        : 'An out-of-range value is not a diagnosis. Review the report with your clinician.'}
    </p>
    <button type="button" className="labsetu-report-download" onClick={downloadSummary}>
      {hi ? 'सरल रिपोर्ट डाउनलोड करें' : 'Download easy-language summary'}
    </button>
  </section>;
}
