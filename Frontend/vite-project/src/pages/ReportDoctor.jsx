import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function ReportDoctor() {
  const { doctor_id } = useParams();
  const { tokens } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Fetch doctor info
  useEffect(() => {
    async function fetchDoctor() {
      if (!tokens) return;

      const res = await fetch(`http://localhost:3000/api/doctor/${doctor_id}`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      const data = await res.json();
      setDoctor(data.doctors?.[0] || null);
    }

    fetchDoctor();
  }, [doctor_id, tokens]);

  const handleReport = async (e) => {
    e.preventDefault();

    if (!content.trim()) return;

    try {
      const res = await fetch("http://localhost:3000/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ doctor_id, content }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Report submitted successfully ");
        setTimeout(() => navigate(`/doctor/${doctor_id}`), 1000);
      } else {
        setMessage(data.message || "Failed to submit report ");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error ");
    }
  };

  if (!doctor) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-10">
      <div className="w-full max-w-xl p-6 bg-white shadow-md rounded-xl border border-red-400">
        <h2 className="text-2xl font-bold mb-4">Report Doctor</h2>
        <p className="mb-4">
          Reporting <span className="font-semibold">{doctor.first_name} {doctor.last_name}</span>
        </p>

        <form onSubmit={handleReport} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Content
            </label>
            <textarea
              rows="4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring focus:ring-red-300 focus:outline-none"
              placeholder="Describe the issue..."
              required
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Submit Report
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}
      </div>
    </div>
  );
}

export default ReportDoctor;
