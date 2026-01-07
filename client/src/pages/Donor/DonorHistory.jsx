import { useEffect, useState } from "react";
import API from "../../api/axios";

export default function DonorHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await API.get("/requests/history/donor");
        setHistory(data.requests || []);
      } catch (err) {
        console.error("Failed to load donor history", err);
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
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-3xl font-bold text-red-600 mb-6">
          My SOS History
        </h1>

        {history.length === 0 && (
          <p className="text-gray-600">No SOS history found.</p>
        )}

        {history.map((req) => {
          const myEntry = req.acceptedDonors.find(
            (d) => d.donor === profile?.user?._id || d.donor?._id === profile?.user?._id
          );

          return (
            <div
              key={req._id}
              className="border rounded p-4 mb-4 bg-gray-50"
            >
              <p><b>Blood Type:</b> {req.bloodType}</p>

              <p>
                <b>My Status:</b>{" "}
                <span
                  className={
                    myEntry?.status === "approved"
                      ? "text-green-600"
                      : myEntry?.status === "rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }
                >
                  {myEntry?.status || "pending"}
                </span>
              </p>

              <p className="text-sm text-gray-500">
                {new Date(req.createdAt).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
