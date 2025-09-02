import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function DoctorCard({ doctor, onClick }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer border border-blue-600 rounded p-4 shadow hover:shadow-lg transition bg-white"
    >
      <h3 className="font-semibold text-lg mb-1">
        {doctor.first_name} {doctor.last_name}
      </h3>
      <p className="text-gray-600 mb-1">
        {doctor.specialization || "General Practitioner"}
      </p>
      <p className="text-gray-600 mb-1">{doctor.city || "Unknown city"}</p>
      <p className="font-semibold">
        Reputation: {doctor.reputation ?? "0.00"}
      </p>
    </div>
  );
}

function BookingCard({ booking }) {
  return (
    <div className="border border-green-600 rounded p-4 shadow hover:shadow-lg transition bg-white">
      <h3 className="font-semibold text-lg mb-1">
        Appointment with Dr. {booking.doctor_first_name} {booking.doctor_last_name}
      </h3>
      <p className="text-gray-600 mb-1">
        Specialization: {booking.specialization}
      </p>
      <p className="text-gray-600 mb-1">
        {new Date(booking.start_time).toLocaleString()} –{" "}
        {new Date(booking.end_time).toLocaleString()}
      </p>
      <p className="font-semibold text-blue-600">Cost: ${booking.cost}</p>
      <p className="text-gray-500 text-sm mt-1">
        Centre: {booking.centre_name}, {booking.city || booking.district},{" "}
        {booking.country}
      </p>
    </div>
  );
}

function PatientU() {
  const { tokens, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);           // all doctors
  const [filteredDoctors, setFilteredDoctors] = useState([]); // filtered doctors
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");

  const [specialization, setSpecialization] = useState("");

  // Fetch all doctors
  const fetchAllDoctors = async () => {
    try {
      if (!tokens) return;
      const res = await fetch("http://localhost:3000/api/doctor", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch doctors");
      const data = await res.json();
      setDoctors(data.doctors || []);
      setFilteredDoctors([]); // reset filtered when fetching all
    } catch (err) {
      console.error(err);
      setError("Failed to load doctors");
    }
  };

  // Fetch filtered doctors (slots API)
  const fetchFilteredDoctors = async () => {
    try {
      if (!tokens) return;
      
      const query = specialization ? `specialization=${encodeURIComponent(specialization)}` : '';

      const res = await fetch(`http://localhost:3000/api/filterSp?${query}`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch filtered doctors");
      const data = await res.json();
      console.log(data)
      setFilteredDoctors(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch filtered doctors");
    }
  };

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      if (!tokens) return;
      const res = await fetch(
        "http://localhost:3000/api/slots/patient/bookings",
        { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      setBookings(data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load bookings");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllDoctors();
      fetchBookings();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <p className="p-4">Please log in to view doctors and bookings.</p>;
  }

  if (error) {
    return <p className="p-4 text-red-600">{error}</p>;
  }

  const displayedDoctors = filteredDoctors.length > 0 ? filteredDoctors : doctors;

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {/* Doctors Section */}
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Our Doctors</h1>

        {/* Filter */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Specialization (e.g., Cardiology, Neurology)"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="border p-2 rounded flex-1 max-w-md"
          />
          <button
            onClick={fetchFilteredDoctors}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Filter by Specialization
          </button>
          <button
            onClick={() => {
              setSpecialization("");
              setFilteredDoctors([]);
            }}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Filter
          </button>
        </div>

        {/* Doctors List */}
        <div
          className="grid gap-6 mb-12"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
        >
          {displayedDoctors.length ? (
            displayedDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.user_id || doctor.doctor_id}
                doctor={doctor}
                onClick={() => navigate(`/doctor/${doctor.user_id || doctor.doctor_id}`)}
              />
            ))
          ) : (
            <p className="text-gray-500 italic">No doctors available.</p>
          )}
        </div>

        {/* Bookings Section */}
        <h2 className="text-2xl font-bold mb-6 text-gray-800">My Bookings</h2>
        {bookings.length ? (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
          >
            {bookings.map((booking) => (
              <BookingCard key={booking.booking_id} booking={booking} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            You haven't booked any slots yet.
          </p>
        )}
      </div>
    </div>
  );
}

export default PatientU;
