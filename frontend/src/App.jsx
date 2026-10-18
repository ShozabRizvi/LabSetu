import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/auth/ProtectedRoute';

import Home from './views/Home';
import Registration from './Registration';

// Authority Layout & Views
import MainLayout from './views/MainLayout';
import GettingStarted from './views/GettingStarted';
import DashboardHome from './views/DashboardHome';
import NewBill from './views/billing/NewBill';
import AppointmentWizard from './views/appointments/AppointmentWizard';

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
import AiReportViewer from './views/lab/AiReportViewer';

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

// Citizen Portal
import CitizenLayout from './views/citizen/CitizenLayout';
import CitizenDashboard from './views/citizen/CitizenDashboard';
import CitizenAppointments from './views/citizen/CitizenAppointments';
import CitizenReports from './views/citizen/CitizenReports';
import CitizenBills from './views/citizen/CitizenBills';
import CitizenTests from './views/citizen/CitizenTests';
import CitizenHomeCollection from './views/citizen/CitizenHomeCollection';
import CitizenReportExplainer from './views/citizen/CitizenReportExplainer';
import CitizenNearbyLabs from './views/citizen/CitizenNearbyLabs';
import CitizenReminders from './views/citizen/CitizenReminders';
import CitizenFamilyProfiles from './views/citizen/CitizenFamilyProfiles';
import CitizenSupport from './views/citizen/CitizenSupport';
import CitizenPrivacy from './views/citizen/CitizenPrivacy';
import CitizenProfile from './views/citizen/CitizenProfile';
import NotFound from './views/NotFound';
import SplashScreen from './components/common/SplashScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ErrorBoundary>
          <SplashScreen minDuration={1000} />
          <Router>
          <Routes>
            {/* Public Homepage with visible Login Button */}
            <Route path="/" element={<Home />} />

            {/* Direct Accessible Authentication Routes */}
            <Route 
              path="/login" 
              element={
                <PublicOnlyRoute>
                  <Registration initialMode="signin" />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicOnlyRoute>
                  <Registration initialMode="signup" />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicOnlyRoute>
                  <Registration initialMode="forgot" />
                </PublicOnlyRoute>
              } 
            />

            {/* Citizen / Patient Protected Routes */}
            <Route 
              path="/portal" 
              element={
                <ProtectedRoute allowedRoles={['citizen']}>
                  <ErrorBoundary>
                    <CitizenLayout />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            >
              <Route index element={<Navigate to="/portal/dashboard" replace />} />
              <Route path="dashboard" element={<CitizenDashboard />} />
              <Route path="appointments" element={<CitizenAppointments />} />
              <Route path="bookings" element={<CitizenAppointments />} />
              <Route path="appointments/book" element={<AppointmentWizard />} />
              <Route path="home-collection" element={<CitizenHomeCollection />} />
              <Route path="reports" element={<CitizenReports />} />
              <Route path="explainer" element={<CitizenReportExplainer />} />
              <Route path="ai-explainer" element={<CitizenReportExplainer />} />
              <Route path="labs" element={<CitizenNearbyLabs />} />
              <Route path="reminders" element={<CitizenReminders />} />
              <Route path="family" element={<CitizenFamilyProfiles />} />
              <Route path="bills" element={<CitizenBills />} />
              <Route path="tests" element={<CitizenTests />} />
              <Route path="support" element={<CitizenSupport />} />
              <Route path="privacy" element={<CitizenPrivacy />} />
              <Route path="profile" element={<CitizenProfile />} />
            </Route>

            {/* Authority Protected Routes */}
            <Route 
              path="/app" 
              element={
                <ProtectedRoute allowedRoles={['authority']}>
                  <ErrorBoundary>
                    <MainLayout />
                  </ErrorBoundary>
                </ProtectedRoute>
              } 
            >
              <Route index element={<Navigate to="/app/getting-started" replace />} />
              <Route path="getting-started" element={<GettingStarted />} />
              <Route path="dashboard" element={<DashboardHome />} />
            
            {/* Appointments route for staff */}
            <Route path="appointments/book" element={<AppointmentWizard />} />

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
            <Route path="lab/ai-report-viewer" element={<AiReportViewer />} />

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

          {/* Catch-all fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      </ErrorBoundary>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
