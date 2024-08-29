import React, { useState, useEffect } from "react";
import axios from "axios";
import "@/app/globals.css";
import Graph3D from "@/components/Graph3D";
import InformationPanel from "@/components/infoPanel";
import Button from "@/components/reusableButton";

const Dashboard = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [threshold, setThreshold] = useState(0.1); // Default threshold value
  const [graphData, setGraphData] = useState(null);
  const [originalGraphData, setOriginalGraphData] = useState(null); // For revert functionality
  const [loading, setLoading] = useState(false); // Loading state
  const [isSimplified, setIsSimplified] = useState(false); // State to control simplification

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleFilterEdges = async (strategy) => {
    setLoading(true); // Start loading
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/filter_edges",
        {
          strategy,
          threshold,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        const data = response.data;
        setGraphData(data);
        console.log("Updated values received", data);
      } else {
        console.error("Error filtering edges", response.statusText);
      }
    } catch (error) {
      console.error("Error connecting to backend:", error);
    } finally {
      setLoading(false); // End loading
    }
  };

  const toggleSimplifyDiagram = () => {
    setIsSimplified((prev) => !prev);
  };

  const fetchGraphData = async () => {
    setLoading(true); // Start loading
    try {
      const response = await axios.get("http://127.0.0.1:5000/process_graph");
      if (response.status === 200) {
        const data = response.data;
        setGraphData(data);
        setOriginalGraphData(data); // Save original data
      } else {
        console.error("Error fetching graph data", response.statusText);
      }
    } catch (error) {
      console.error("Error connecting to backend:", error);
    } finally {
      setLoading(false); // End loading
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchGraphData();
  }, []); // Empty dependency array to run once on mount

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex">
        <div className="w-3/4">
          <Graph3D
            graphData={graphData}
            onNodeClick={handleNodeClick}
            simplified={isSimplified}  // Pass the isSimplified state
          />
        </div>
        <div className="w-1/4 h-full bg-gray-100 p-4">
          <InformationPanel node={selectedNode} className="mb-4" />
          <div className="mb-4">
            {/* Threshold input */}
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Threshold:
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="mt-2 p-2 border rounded w-full"
              />
            </label>
            {/* Filter buttons */}
            <Button
              label="Reload Data"
              onClick={() => fetchGraphData()}
              className={`${
                loading ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-700"
              } text-white font-bold py-2 px-4 rounded mb-4 w-full`}
              disabled={loading}
            />
            <Button
              label="Reduce Betweenness"
              onClick={() => handleFilterEdges("betweenness")}
              className={`${
                loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700"
              } text-white font-bold py-2 px-4 rounded mb-4 w-full`}
              disabled={loading}
            />
            <Button
              label="Increase Frequency"
              onClick={() => handleFilterEdges("frequency")}
              className={`${
                loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700"
              } text-white font-bold py-2 px-4 rounded mb-4 w-full`}
              disabled={loading}
            />
            <Button
              label="Increase Information"
              onClick={() => handleFilterEdges("information")}
              className={`${
                loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700"
              } text-white font-bold py-2 px-4 rounded mb-4 w-full`}
              disabled={loading}
            />
            <Button
              label="Random"
              onClick={() => handleFilterEdges("random")}
              className={`${
                loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-700"
              } text-white font-bold py-2 px-4 rounded mb-4 w-full`}
              disabled={loading}
            />
            <Button
              label={isSimplified ? "Show Full Diagram" : "Simplify Diagram"}
              onClick={toggleSimplifyDiagram}
              className={`${
                loading ? "bg-green-300 cursor-not-allowed" : "bg-green-500 hover:bg-green-700"
              } text-white font-bold py-2 px-4 rounded w-full`}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
