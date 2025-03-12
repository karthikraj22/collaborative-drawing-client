import React, { useEffect, useState } from "react";
import { Card, ListGroup, Badge, Alert } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import "../styles/UsersList.css";

const UserList = ({ users }) => {
    const currentUser = localStorage.getItem("username");
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (users.length === 0) return;

        
        const lastUser = users[users.length - 1];

        if (lastUser && lastUser.username !== currentUser) {
            setNotifications((prev) => [
                ...prev,
                { message: `${lastUser.username} has joined`, type: "join" },
            ]);
        }

        
        const timer = setTimeout(() => {
            setNotifications((prev) => prev.slice(1));
        }, 2000);

        return () => clearTimeout(timer);
    }, [users, currentUser]); 

    return (
        <div className="user-list-container">
            <h4 className="user-list-title">🔵 Online Users</h4>

            
            {notifications.map((notification, index) => (
                <Alert key={index} variant="success" className="user-notification">
                    {notification.message}
                </Alert>
            ))}

{users.find((user) => user.username === currentUser) && (
    <Card className="user-highlight-card mb-3">
        <Card.Body className="d-flex align-items-center">
            <FaUserCircle className="user-icon me-2" />
            <div>
                <strong>{currentUser}</strong>
                <Badge bg="warning" text="dark" className="ms-2">You</Badge>
                <div className="join-time">Joined at {localStorage.getItem("joinTime") || "Just now"}</div>
            </div>
        </Card.Body>
    </Card>
)}

            {users.length > 1 && (
                <Card className="user-card">
                    <ListGroup variant="flush">
                        {users
                            .filter((user) => user.username !== currentUser)
                            .map((user, index) => (
                                <ListGroup.Item key={index} className="user-list-item d-flex align-items-center">
                                    <FaUserCircle className="user-icon me-2" />
                                    <div>
                                        <strong>{user.username}</strong>
                                        <div className="join-time">Joined at {user.joinTime}</div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                    </ListGroup>
                </Card>
            )}
        </div>
    );
};

export default UserList;
