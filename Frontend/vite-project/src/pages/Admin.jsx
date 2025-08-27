import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

function Admin() {
  const { tokens } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function fetchReports() {
      if (!tokens) return;

      try {
        const res = await fetch("http://localhost:3000/api/report", {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        const data = await res.json();
        if (res.ok) setReports(data.reports || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    fetchReports();
  }, [tokens]);

  const handleSolve = async (report_id) => {
    try {
      const res = await fetch(`http://localhost:3000/api/report/${report_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ is_solved: true }),
      });

      if (res.ok) {
        setReports((prev) =>
          prev.map((r) =>
            r.report_id === report_id ? { ...r, is_solved: true } : r
          )
        );
      } else {
        alert("Failed to update report");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard - Reports</h1>

        {reports.length === 0 ? (
          <p>No reports submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.report_id}
                className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800 mb-1">
                    Patient: {report.patient_first} {report.patient_last} | Doctor:{" "}
                    {report.doctor_first} {report.doctor_last}
                  </p>
                  <p className="text-gray-700 mb-1">{report.content}</p>
                  <p className="text-sm text-gray-500">
                    Date: {new Date(report.report_date).toLocaleString()} |{" "}
                    Status:{" "}
                    {report.is_solved ? (
                      <span className="text-green-600 font-semibold">Solved</span>
                    ) : (
                      <span className="text-red-600 font-semibold">Pending</span>
                    )}
                  </p>
                </div>

                {!report.is_solved && (
                  <button
                    onClick={() => handleSolve(report.report_id)}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                  >
                    Mark as Solved
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        </div>

    </div>
  );
}

export default Admin;
