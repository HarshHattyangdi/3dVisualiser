import React from "react";
import Navbar from "@/components/navbar";
import Header from "@/components/header";
import ProjectCard from "@/components/projectCard";
import Footer from "@/components/footer";

const Homepage = () => {
  return (
    <>
      <Navbar></Navbar>
      <Header></Header>
      <ProjectCard></ProjectCard>
      <Footer></Footer>
    </>
  );
};

export default Homepage;
