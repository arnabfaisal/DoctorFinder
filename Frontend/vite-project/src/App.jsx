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
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App
