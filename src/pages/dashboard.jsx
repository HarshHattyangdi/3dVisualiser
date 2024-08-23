// pages/dashboard.js
import React, { useState } from 'react';
import "@/app/globals.css"
import Graph3D from '@/components/Graph3D';
import InformationPanel from '@/components/infoPanel';
import Button from '@/components/reusableButton';

const Dashboard = () => {
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  const handleFilterEdges = () => {
    // Add logic to filter edges
    console.log('Filter edges');
  };

  const handleSimplifyDiagram = () => {
    // Add logic to simplify the diagram
    console.log('Simplify diagram');
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex">
        <div className="w-3/4">
          <Graph3D onNodeClick={handleNodeClick} />
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
