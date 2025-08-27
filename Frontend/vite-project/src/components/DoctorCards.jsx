import React from 'react';
import { useNavigate } from 'react-router-dom';

function DoctorCards({ doctors }) {
  const navigate = useNavigate();

  const handleCardClick = (id) => {
    navigate(`/doctor/${id}`);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '20px'
    }}>
      {doctors.map((doc) => (
        <div 
          key={doc.user_id} 
          onClick={() => handleCardClick(doc.user_id)} 
          style={{
            border: '1px solid #ddd', 
            padding: '1rem', 
            cursor: 'pointer', 
            borderRadius: '8px'
          }}
        >
          <h3>{doc.first_name} {doc.last_name}</h3>
          <p>Specialization: {doc.specialization}</p>
          <p>City: {doc.city}</p>
          <p>Reputation: {doc.reputation.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}

export default DoctorCards;
