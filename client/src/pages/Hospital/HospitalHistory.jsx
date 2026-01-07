import { useEffect, useState } from "react";
import API from "../../api/axios";

export default function HospitalHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await API.get("/requests/history/hospital");
        setHistory(data.requests || []);
      } catch (err) {
        console.error("Failed to load hospital history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return <div className="p-6">Loading history...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-3xl font-bold text-red-600 mb-6">
          SOS History
        </h1>

        {history.length === 0 && (
          <p className="text-gray-600">No SOS requests found.</p>
        )}

        {history.map((req) => (
          <div
            key={req._id}
            className="border rounded p-4 mb-5 bg-gray-50"
          >
            <p><b>Blood Type:</b> {req.bloodType}</p>
            <p><b>Locked:</b> {req.isLocked ? "Yes" : "No"}</p>

            <p className="text-sm text-gray-500">
              Created at: {new Date(req.createdAt).toLocaleString()}
            </p>

            <h3 className="mt-3 font-semibold">Accepted Donors:</h3>

            {req.acceptedDonors.length === 0 && (
              <p className="text-gray-500">No donors accepted</p>
            )}

            {req.acceptedDonors.map((d) => (
              <div key={d.donor._id} className="ml-3 text-sm">
                • {d.donor.name} —{" "}
                <span
                  className={
                    d.status === "approved"
                      ? "text-green-600"
                      : d.status === "rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }
                >
                  {d.status}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
