import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from "react-router-dom";

function DoctorDetails() {
  const { doctor_id } = useParams();
  const { tokens } = useAuth(); 
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState('');
  const [commented, setCommented] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      if (!tokens) return;

      const doctorRes = await fetch(`http://localhost:3000/api/doctor/${doctor_id}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      const doctorData = await doctorRes.json();
      setDoctor(doctorData.doctors?.[0] || null);

      const reviewRes = await fetch(`http://localhost:3000/api/review/${doctor_id}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      const reviewData = await reviewRes.json();
      setReviews(reviewData.reviews || []);
    }
    fetchData();
  }, [doctor_id, tokens]);



  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const response = await fetch('http://localhost:3000/api/review', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify({ doctor_id, rating: Number(rating), commented }),
    });
    if (response.ok) {
      const data = await response.json();
      const updatedReviews = await fetch(`http://localhost:3000/api/review/${doctor_id}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }).then(res => res.json());
      setReviews(updatedReviews.reviews);
      setRating('');
      setCommented('');
      alert('Review added successfully with updated reputation: ' + data.reputation);
    } else {
      alert('you have already reviewed this doctor');
    }
  };

  if (!doctor) return <div>Loading...</div>;

  return (
    <div className='min-h-screen my-5'>
      <div className="mx-auto max-w-2xl p-6 bg-white shadow-md rounded-2xl flex flex-col justify-center border border-blue-600">

        <h2 className="text-2xl font-bold mb-2">
          {doctor.first_name} {doctor.last_name}
        </h2>
        <p className="text-gray-600">Specialization: {doctor.specialization || "N/A"}</p>
        <p className="text-gray-600">City: {doctor.city || "N/A"}</p>
        <p className="text-gray-800 font-medium mt-1">
          Reputation:{" "}
          {doctor.reputation ? doctor.reputation : "No rating yet"}
        </p>

        <h3 className="text-xl font-semibold mt-6 mb-3">Reviews</h3>
        {reviews.length ? (
          <div className="space-y-4">
            {reviews.map((rev, index) => (
              <div key={index} className="border-b pb-2">
                <p className="font-semibold text-gray-800 text-xs">
                  {rev.reviewer_first} {rev.reviewer_last}{" "}
                  <span className="text-sm text-yellow-600">rated {rev.rating}</span>
                </p>
                <p className="text-gray-700 font-bold">{rev.commented}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No reviews yet.</p>
        )}

        <h3 className="text-xl font-semibold mt-6 mb-3">Add a Review</h3>
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating (1 to 5)
            </label>
            <input
              type="number"
              value={rating}
              min="1"
              max="5"
              onChange={(e) => setRating(e.target.value)}
              required
              className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment
            </label>
            <textarea
              value={commented}
              onChange={(e) => setCommented(e.target.value)}
              rows="3"
              className="w-full border rounded-lg p-2 focus:ring focus:ring-blue-300 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Submit Review
          </button>
        </form>



        <button
        onClick={() => navigate(`/report/${doctor.user_id}`)}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
        Report Doctor
        </button>
        <button
        onClick={() => navigate(`/chat/${doctor.user_id}`)}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
        Chat with Doctor
        </button>
      </div>
    </div>
  );
}

export default DoctorDetails;
