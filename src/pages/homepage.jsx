"use client";
import React from "react";
import Navbar from "@/components/navbar";
import Header from "@/components/header";
import ProjectCard from "@/components/projectCard";
import Footer from "@/components/footer";
import Graph3D from "@/components/graph3D";

const Homepage = () => {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <Header />
      <ProjectCard />
      <Footer />
    </div>
  );
};

export default Homepage;
