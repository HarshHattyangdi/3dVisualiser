import React from "react";
import Navbar from "@/components/navbar";
import Header from "@/components/header";
import ProjectCard from "@/components/projectCard";
import Footer from "@/components/footer";
import Graph3D from "@/components/graph3D";

const Homepage = () => {
  return (
    <>
      <Navbar></Navbar>
      <Header></Header>
      <ProjectCard></ProjectCard>
      <Graph3D></Graph3D>
      <Footer></Footer>
    </>
  );
};

export default Homepage;
