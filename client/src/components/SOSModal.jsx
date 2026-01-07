export default function SOSModal({ sos, onAccept, onClose }) {
  if (!sos) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-pulse">
        <h2 className="text-3xl font-bold text-red-600 mb-4">
          🚨 Emergency SOS
        </h2>

        <div className="space-y-2 text-gray-700">
          <p><b>Hospital:</b> {sos.hospital}</p>
          <p><b>Blood Type Needed:</b> {sos.bloodType}</p>
          <p><b>Time:</b> {new Date(sos.time).toLocaleString()}</p>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onAccept}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
          >
            Accept
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-gray-400 text-white py-2 rounded-lg font-semibold hover:bg-gray-500"
          >
            Ignore
          </button>
        </div>
      </div>
    </div>
  );
}
