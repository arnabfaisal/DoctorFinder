import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function DoctorCard({ doctor, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer border border-blue-600 rounded p-4 shadow hover:shadow-lg transition"
      style={{ minWidth: 0 }}
    >
      <h3 className="font-semibold text-lg mb-1">
        {doctor.first_name} {doctor.last_name}
      </h3>
      <p className="text-gray-600 mb-1">{doctor.specialization || 'General'}</p>
      <p className="text-gray-600 mb-1">{doctor.city || 'Unknown city'}</p>
      <p className="font-semibold">
        Reputation: {doctor.reputation ?? '0.00'}
      </p>
    </div>
  );
}

function PatientU() {
  const { tokens, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchDoctors() {
      try {
        if (!tokens) return;

        const res = await fetch('http://localhost:3000/api/doctor', {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch doctors');

        const data = await res.json();
        setDoctors(data.doctors || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load doctors');
      }
    }

    if (isAuthenticated) {
      fetchDoctors();
    }
  }, [tokens, isAuthenticated]);

  if (!isAuthenticated) {
    return <p className="p-4">Please log in to view doctors.</p>;
  }

  if (error) {
    return <p className="p-4 text-red-600">{error}</p>;
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Our Doctors</h1>
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          }}
        >
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.user_id}
              doctor={doctor}
              onClick={() => navigate(`/doctor/${doctor.user_id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PatientU;
