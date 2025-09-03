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
  const [slots, setSlots] = useState([]); // All slots for this doctor
  const [filteredSlots, setFilteredSlots] = useState([]); // Filtered slots
  const [centres, setCentres] = useState([]); // Available centres for this doctor
  const navigate = useNavigate();

  // Filter states
  const [filters, setFilters] = useState({
    minCost: '',
    maxCost: '',
    centre_id: '', // Filter by specific centre
  });

  useEffect(() => {
    async function fetchData() {
      if (!tokens) return;

      // Fetch doctor details
      const doctorRes = await fetch(`http://localhost:3000/api/doctor/${doctor_id}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      const doctorData = await doctorRes.json();
      setDoctor(doctorData.doctors?.[0] || null);

      // Fetch reviews
      const reviewRes = await fetch(`http://localhost:3000/api/review/${doctor_id}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      const reviewData = await reviewRes.json();
      setReviews(reviewData.reviews || []);

      // Fetch all slots with full details using the new API
      const slotRes = await fetch(`http://localhost:3000/api/filter/doctor/${doctor_id}/all-slots`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      const slotData = await slotRes.json();
      console.log("Fetched slots:", slotData);
      setSlots(slotData || []);

      // Fetch available centres for this doctor
      const centreRes = await fetch(`http://localhost:3000/api/filterSp/doctor/${doctor_id}/centres`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      const centreData = await centreRes.json();
      setCentres(centreData || []);
    }
    fetchData();
  }, [doctor_id, tokens]);

  // Filter slots using the backend API
  const filterSlots = async () => {
    try {
      if (!tokens) return;
      
      const query = new URLSearchParams(
        Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        )
      ).toString();

      const res = await fetch(`http://localhost:3000/api/filter/doctor/${doctor_id}/slots?${query}`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      
      if (!res.ok) throw new Error("Failed to fetch filtered slots");
      const data = await res.json();
      console.log("Filtered slots:", data);
      setFilteredSlots(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to filter slots");
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      minCost: '',
      maxCost: '',
      centre_id: '',
    });
    setFilteredSlots([]);
  };

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

  // Handle slots booking
  const handleBookSlot = async (booking_id) => {
    const res = await fetch(`http://localhost:3000/api/slots/book/${booking_id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    if (res.ok) {
      alert("Slot booked successfully!");
      // Remove booked slots from both arrays
      setSlots(slots.filter(s => s.booking_id !== booking_id));
      setFilteredSlots(filteredSlots.filter(s => s.booking_id !== booking_id));
    } else {
      const err = await res.json();
      alert(err.message || "Failed to book slots");
    }
  };
  if (!tokens) return <div>not authorized</div>
  if (!doctor) return <div>Loading...</div>;

  const displayedSlots = filteredSlots.length > 0 ? filteredSlots : slots; // most important part of the search filter . if there is filtered sets, it retunrns just the set

  return (
    <div className='min-h-screen my-5'>
      <div className="mx-auto max-w-4xl p-6 bg-white shadow-md rounded-2xl flex flex-col justify-center border border-blue-600">

        <h2 className="text-2xl font-bold mb-2">
          {doctor.first_name} {doctor.last_name}
        </h2>
        <p className="text-gray-600">Specialization: {doctor.specialization || "N/A"}</p>
        <p className="text-gray-600">City: {doctor.city || "N/A"}</p>
        <p className="text-gray-800 font-medium mt-1">
          Reputation:{" "}
          {doctor.reputation ? doctor.reputation : "No rating yet"}
        </p>

        {/* Slot Filters */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Filter Available Slots</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="number"
              placeholder="Min Cost ($)"
              value={filters.minCost}
              onChange={(e) => setFilters({ ...filters, minCost: e.target.value })}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Max Cost ($)"
              value={filters.maxCost}
              onChange={(e) => setFilters({ ...filters, maxCost: e.target.value })}
              className="border p-2 rounded"
            />
            <select
              value={filters.centre_id}
              onChange={(e) => setFilters({ ...filters, centre_id: e.target.value })}
              className="border p-2 rounded"
            >
              <option value="">All Centres</option>
              {centres.map((centre) => (
                <option key={centre.centre_id} value={centre.centre_id}>
                  {centre.centre_name} - {centre.city}
                  {centre.division && `, ${centre.division}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={filterSlots}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Available slots section */}
        <h3 className="text-xl font-semibold mt-6 mb-3">
          Available Slots 
          {filteredSlots.length > 0 && (
            <span className="text-sm text-blue-600 ml-2">
              (Showing {filteredSlots.length} filtered results)
            </span>
          )}
        </h3>
        {displayedSlots && displayedSlots.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedSlots.map((slot) => (
              <div
                key={slot.booking_id}
                className="border p-4 rounded-lg bg-gray-50"
              >
                <div className="mb-3">
                  <p className="text-sm text-gray-700">
                    <strong>Time:</strong> {new Date(slot.start_time).toLocaleString()} -{" "}
                    {new Date(slot.end_time).toLocaleString()}
                  </p>
                  <p className="text-sm font-bold text-blue-600">
                    <strong>Cost:</strong> ${slot.cost}
                  </p>
                  {slot.centre_name && (
                    <p className="text-sm text-gray-600">
                      <strong>Centre:</strong> {slot.centre_name}
                    </p>
                  )}
                  {slot.city && (
                    <p className="text-sm text-gray-600">
                      <strong>Location:</strong> {slot.city}
                      {slot.division && `, ${slot.division}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleBookSlot(slot.booking_id)}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Book This Slot
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">
            {filteredSlots.length === 0 && (filters.minCost || filters.maxCost || filters.centre_id) 
              ? "No slots match your filter criteria." 
              : "No available slots right now."}
          </p>
        )}

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