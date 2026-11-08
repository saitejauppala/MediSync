import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CompareProvider } from './context/CompareContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import HomePage from './pages/Home/HomePage';
import HospitalsPage from './pages/Hospitals/HospitalsPage';
import HospitalDetailPage from './pages/HospitalDetails/HospitalDetailPage';
import SpecialitiesPage from './pages/Specialities/SpecialitiesPage';
import EmergencyPage from './pages/Emergency/EmergencyPage';
import ComparePage from './pages/Hospitals/ComparePage';
import SavedHospitalsPage from './pages/Hospitals/SavedHospitalsPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import PatientDashboard from './pages/PatientDashboard/PatientDashboard';
import HospitalDashboard from './pages/HospitalDashboard/HospitalDashboard';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CompareProvider>
          <div className="min-h-screen bg-[#090909] text-white flex flex-col font-sans selection:bg-red-500 selection:text-white">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Discovery Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/hospitals" element={<HospitalsPage />} />
                <Route path="/hospitals/:id" element={<HospitalDetailPage />} />
                <Route path="/specialities" element={<SpecialitiesPage />} />
                <Route path="/emergency" element={<EmergencyPage />} />
                <Route path="/compare" element={<ComparePage />} />

                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Patient Routes */}
                <Route
                  path="/saved-hospitals"
                  element={
                    <ProtectedRoute allowedRoles={['patient', 'hospital_admin', 'platform_admin']}>
                      <SavedHospitalsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['patient', 'platform_admin']}>
                      <PatientDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Hospital Admin Routes */}
                <Route
                  path="/hospital-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['hospital_admin', 'platform_admin']}>
                      <HospitalDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Platform Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['platform_admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CompareProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
