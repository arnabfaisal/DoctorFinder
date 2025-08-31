import React from 'react'
import { AuthProvider } from './contexts/AuthContext';
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Homepage from './pages/Homepage'
import About from './pages/About'
import Navbar from './pages/Navbar'
import Footer from './components/Footer'
import RegistrationForm from './components/RegistrationForm'
import PatientU from './pages/PatientU';
import DoctorU from './pages/DoctorU';
import Admin from './pages/Admin';
import LoginForm from './components/LoginForm';
import DoctorDetails from './pages/DoctorDetails';
import ReportDoctor from './pages/ReportDoctor';
import ChatPage from './pages/Chatpage';

function App() {

  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path='/' element={<Homepage />} />
          <Route path='/about' element={<About />} />
          <Route path="/register" element={<RegistrationForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/patient-dashboard" element={<PatientU />} />
          <Route path="/doctor-dashboard" element={<DoctorU />} />
          <Route path="/admin-dashboard" element={<Admin />} />
          <Route path="/doctor/:doctor_id" element={<DoctorDetails />} />
          <Route path="/report/:doctor_id" element={<ReportDoctor />} />
          <Route path="/chat/:doctor_id" element={<ChatPage />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
