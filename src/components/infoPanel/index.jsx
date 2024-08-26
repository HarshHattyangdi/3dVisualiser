import React from "react";

const InformationPanel = ({ node,className }) => {
  if (!node) {
    return (
      <div className={`${className}`}>
        <h2 className="text-lg font-bold mb-2">Information Panel</h2>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-700">Select a node to see details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 rounded shadow ${className}`}>
      <h2 className="text-lg font-bold mb-2">Information Panel</h2>
      <p className="text-sm text-gray-700">
        <strong>ID:</strong> {node.id}
      </p>
      <p className="text-sm text-gray-700">
        <strong>Betweenness Centrality:</strong> {node.degree_centrality}
      </p>
      <p className="text-sm text-gray-700">
        <strong>Color:</strong> {node.color}
      </p>
      <p className="text-sm text-gray-700">
        <strong>Total Connections:</strong> {node.degree}
      </p>
      <p className="text-sm text-gray-700">
        <strong>Spokes:</strong> {node.spokes}
      </p>
    </div>
  );
};

export default InformationPanel;
