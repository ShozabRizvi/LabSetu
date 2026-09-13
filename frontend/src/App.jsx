import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Registration from './Registration';
import MainLayout from './views/MainLayout';
import GettingStarted from './views/GettingStarted';
import DashboardHome from './views/DashboardHome';
import NewBill from './views/billing/NewBill';

import DailyBusiness from './views/business/DailyBusiness';
import Expenses from './views/business/Expenses';
import DueReports from './views/business/DueReports';
import Activities from './views/business/Activities';
import ReferralBusiness from './views/business/ReferralBusiness';
import CaseWiseReport from './views/business/CaseWiseReport';
import BusinessAnalysis from './views/business/BusinessAnalysis';
import DataExport from './views/business/DataExport';

import OutsourceCases from './views/cases/OutsourceCases';
import CtScanCases from './views/cases/CtScanCases';
import Patients from './views/cases/Patients';
import Transactions from './views/cases/Transactions';
import ReferralDoctors from './views/cases/ReferralDoctors';
import Agents from './views/cases/Agents';

import TodaysReports from './views/lab/TodaysReports';
import SearchReports from './views/lab/SearchReports';
import TestPackages from './views/lab/TestPackages';
import LabAnalytics from './views/lab/LabAnalytics';
import TestCategories from './views/lab/TestCategories';
import Interpretations from './views/lab/Interpretations';
import TestCounts from './views/lab/TestCounts';

// USG
import UsgTodaysCases from './views/usg/TodaysCases';
import UsgSearchCases from './views/usg/SearchCases';
import UsgReportTemplates from './views/usg/ReportTemplates';
import UsgSignatures from './views/usg/Signatures';

// X-Ray
import XrayTodaysCases from './views/xray/TodaysCases';
import XraySearchCases from './views/xray/SearchCases';
import XrayReportTemplates from './views/xray/ReportTemplates';
import XraySignatures from './views/xray/Signatures';

// Manage
import BrowserSecurity from './views/manage/BrowserSecurity';
import EmployeeLogin from './views/manage/EmployeeLogin';
import DoctorAccess from './views/manage/DoctorAccess';

// Setup
import SetupLayout from './views/setup/SetupLayout';
import KYC from './views/setup/KYC';
import CenterDetails from './views/setup/CenterDetails';
import Ratelist from './views/setup/Ratelist';
import Letterhead from './views/setup/Letterhead';
import GoogleReview from './views/setup/GoogleReview';
import SMSConfig from './views/setup/SMSConfig';
import CaseRegNo from './views/setup/CaseRegNo';
import Proofread from './views/setup/Proofread';
import TestPanels from './views/setup/TestPanels';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Registration />} />
        <Route path="/app" element={<MainLayout />}>
          <Route index element={<Navigate to="/app/getting-started" replace />} />
          <Route path="getting-started" element={<GettingStarted />} />
          <Route path="dashboard" element={<DashboardHome />} />
          
          {/* Setup Sub-routes */}
          <Route path="setup" element={<SetupLayout />}>
            <Route index element={<Navigate to="kyc" replace />} />
            <Route path="kyc" element={<KYC />} />
            <Route path="center-details" element={<CenterDetails />} />
            <Route path="ratelist" element={<Ratelist />} />
            <Route path="letterhead" element={<Letterhead />} />
            <Route path="google-review" element={<GoogleReview />} />
            <Route path="sms" element={<SMSConfig />} />
            <Route path="case-reg-no" element={<CaseRegNo />} />
            <Route path="panels" element={<TestPanels />} />
            <Route path="proofread" element={<Proofread />} />
          </Route>
          
          {/* Business Sub-routes */}

          <Route path="business/daily" element={<DailyBusiness />} />
          <Route path="business/expenses" element={<Expenses />} />
          <Route path="business/due-reports" element={<DueReports />} />
          <Route path="business/activities" element={<Activities />} />
          <Route path="business/referral" element={<ReferralBusiness />} />
          <Route path="business/case-wise" element={<CaseWiseReport />} />
          <Route path="business/analysis" element={<BusinessAnalysis />} />
          <Route path="business/data-export" element={<DataExport />} />
          
          {/* Cases Sub-routes */}
          <Route path="cases">
            <Route index element={<Navigate to="patients" replace />} />
            <Route path="new-bill" element={<NewBill />} />
            <Route path="outsource" element={<OutsourceCases />} />
            <Route path="ctscan" element={<CtScanCases />} />
            <Route path="patients" element={<Patients />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="referral-doctors" element={<ReferralDoctors />} />
            <Route path="agents" element={<Agents />} />
          </Route>

          {/* Lab Sub-routes */}
          <Route path="lab/todays-reports" element={<TodaysReports />} />
          <Route path="lab/search-reports" element={<SearchReports />} />
          <Route path="lab/test-packages" element={<TestPackages />} />
          <Route path="lab/analytics" element={<LabAnalytics />} />
          <Route path="lab/test-categories" element={<TestCategories />} />
          <Route path="lab/interpretations" element={<Interpretations />} />
          <Route path="lab/test-counts" element={<TestCounts />} />

          {/* USG Sub-routes */}
          <Route path="usg/todays-cases" element={<UsgTodaysCases />} />
          <Route path="usg/search-cases" element={<UsgSearchCases />} />
          <Route path="usg/report-templates" element={<UsgReportTemplates />} />
          <Route path="usg/signatures" element={<UsgSignatures />} />

          {/* X-Ray Sub-routes */}
          <Route path="xray/todays-cases" element={<XrayTodaysCases />} />
          <Route path="xray/search-cases" element={<XraySearchCases />} />
          <Route path="xray/report-templates" element={<XrayReportTemplates />} />
          <Route path="xray/signatures" element={<XraySignatures />} />

          {/* Manage Sub-routes */}
          <Route path="manage/browser-security" element={<BrowserSecurity />} />
          <Route path="manage/employee-login" element={<EmployeeLogin />} />
          <Route path="manage/doctor-access" element={<DoctorAccess />} />

        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
