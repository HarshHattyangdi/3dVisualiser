import React from "react";

const InformationPanel = ({ node }) => {
  if (!node) {
    return (
      <>
        <h2 className="text-lg font-bold mb-2">Information Panel</h2>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-700">Select a node to see details.</p>
        </div>
      </>
    );
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-lg font-bold mb-2">Information Panel</h2>
      <p className="text-sm text-gray-700">
        <strong>ID:</strong> {node.id}
      </p>
      <p className="text-sm text-gray-700">
        <strong>Degree Centrality:</strong> {node.degree_centrality}
      </p>
      <p className="text-sm text-gray-700">
        <strong>Color:</strong> {node.color}
      </p>
      <p className="text-sm text-gray-700">
        <strong>Position:</strong> x: {node.x}, y: {node.y}, z: {node.z}
      </p>
    </div>
  );
};

export default InformationPanel;
