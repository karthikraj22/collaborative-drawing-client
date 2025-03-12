import React from "react";
import { Navbar, Container, Nav } from "react-bootstrap";
import { FaPaintBrush } from "react-icons/fa";
import "../styles/NavBar.css";

const NavBar = () => {
    return (
        <Navbar expand="lg" className="ultra-navbar">
            <Container>
              
                <Navbar.Brand  className="brand-logo w-100">
                    <div className="d-flex align-items-center justify-content-center">
                    <FaPaintBrush className="logo-icon" />
                    <div>
                    Collaborative Drawing App
                    </div>
                    </div>
                   
                </Navbar.Brand>
            </Container>
        </Navbar>
    );
};

export default NavBar;
