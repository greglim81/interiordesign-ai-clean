"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchTransformationHistory, TransformationHistoryItem } from "@/lib/firestore";

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<TransformationHistoryItem[]>([]);
  const [selected, setSelected] = useState<TransformationHistoryItem | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (user) {
      setFetching(true);
      fetchTransformationHistory(user.uid)
        .then(setHistory)
        .finally(() => setFetching(false));
    }
  }, [user]);

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your history.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Transformation History</h1>
        {history.length === 0 ? (
          <p className="text-center text-gray-500">No transformations yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {history.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelected(item)}
                className="group bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden border border-gray-100"
              >
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={item.transformedImage}
                    alt="Transformed room"
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-3 text-left">
                  <div className="text-xs text-gray-500 mb-1">{new Date(item.date).toLocaleString()}</div>
                  <div className="text-sm font-medium capitalize">{item.style}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Modal for details */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 relative">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
                aria-label="Close"
              >
                &times;
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Original</div>
                  <img src={selected.originalImage} alt="Original room" className="rounded w-full object-cover" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Transformed</div>
                  <img src={selected.transformedImage} alt="Transformed room" className="rounded w-full object-cover" />
                </div>
              </div>
              <div className="mt-4 text-sm">
                <div><span className="font-medium">Style:</span> {selected.style}</div>
                <div><span className="font-medium">Date:</span> {new Date(selected.date).toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 