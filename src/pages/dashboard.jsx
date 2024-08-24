// pages/dashboard.js
import React, { useState,useEffect } from "react";
import "@/app/globals.css";
import Graph3D from "@/components/Graph3D";
import InformationPanel from "@/components/infoPanel";
import Button from "@/components/reusableButton";
import axios from "axios";


const Dashboard = () => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [threshold, setThreshold] = useState(0.1); // Default threshold value
  const [graphData, setGraphData] = useState(null);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleFilterEdges = () => {
    // Add logic to filter edges
    console.log("Filter edges");
  };

  const handleSimplifyDiagram = () => {
    // Add logic to simplify the diagram
    console.log("Simplify diagram");
  };

  useEffect(() => {
    // Initial data fetch
    const fetchGraphData = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/process_graph");
        if (response.status === 200) {
          setGraphData(response.data);
        } else {
          console.error("Error fetching graph data", response.statusText);
        }
      } catch (error) {
        console.error("Error connecting to backend:", error);
      }
    };

    fetchGraphData();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex">
        <div className="w-3/4">
          <Graph3D graphData={graphData} onNodeClick={handleNodeClick} />
        </div>
        <div className="w-1/4 h-full bg-gray-100 p-4">
          <InformationPanel node={selectedNode} />
          <div className="mb-4">
            <Button
              label="Filter Edges"
              onClick={handleFilterEdges}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 w-full"
            />
            <Button
              label="Simplify Diagram"
              onClick={handleSimplifyDiagram}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
