import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Button from "../components/common/Button";
import { useEstimateContext } from "../context/EstimateContext";

const API_URL = "http://localhost:5000"; // Adjust to your backend URL

const Home: React.FC = () => {
  const { generateNewEstimate, setCurrentEstimate } = useEstimateContext();
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch estimates from API
  useEffect(() => {
    const fetchEstimates = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/estimates`);
        if (response.ok) {
          const data = await response.json();
          setEstimates(data);
        } else {
          setError("Failed to fetch estimates");
        }
      } catch (error) {
        console.error("Error fetching estimates:", error);
        setError("Error connecting to the server");
      } finally {
        setLoading(false);
      }
    };

    fetchEstimates();
  }, []);

  const handleCreateEstimate = () => {
    const newEstimate = generateNewEstimate();
    setCurrentEstimate(newEstimate);
    navigate(`/estimate/${newEstimate.id}`);
  };

  const handleViewEstimate = (id: string) => {
    navigate(`/estimate/${id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading estimates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">{error}</div>
        <div className="text-center mt-4">
          <Button onClick={() => window.location.reload()} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Estimate Manager</h1>
        <Button onClick={handleCreateEstimate} variant="primary">
          Create New Estimate
        </Button>
      </div>

      {estimates.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-xl font-medium mb-4">No Estimates Yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first estimate to get started
          </p>
          <Button onClick={handleCreateEstimate} variant="primary">
            Create New Estimate
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {estimates.map((estimate) => (
            <div
              key={estimate.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewEstimate(estimate.id)}
            >
              <h3 className="font-bold text-lg truncate">
                {estimate.project_name || "Untitled Project"}
              </h3>
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <span>
                  Start: {format(new Date(estimate.start_date), "MMM d, yyyy")}
                </span>
                <span>
                  Created:{" "}
                  {format(new Date(estimate.created_at), "MMM d, yyyy")}
                </span>
              </div>
              <div className="mt-4">
                <span className="text-sm">
                  {estimate.epics.length} Epic
                  {estimate.epics.length !== 1 ? "s" : ""}
                </span>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{
                      width: `${estimate.epics.length > 0 ? "100%" : "0%"}`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
