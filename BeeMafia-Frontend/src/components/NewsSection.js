import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import './NewsSection.css';

function NewsSection() {
    const { socket } = useSocket();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch announcements from API
        fetchAnnouncements();

        // Listen for real-time updates if socket is connected
        if (socket) {
            socket.on('announcement_created', handleNewAnnouncement);
            socket.on('announcement_updated', handleUpdatedAnnouncement);
            socket.on('announcement_deleted', handleDeletedAnnouncement);

            return () => {
                socket.off('announcement_created');
                socket.off('announcement_updated');
                socket.off('announcement_deleted');
            };
        }
    }, [socket]);

    const fetchAnnouncements = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/announcements');
            if (!response.ok) {
                throw new Error('Failed to fetch announcements');
            }
            const data = await response.json();
            setAnnouncements(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching announcements:', err);
            setError('Failed to load announcements');
            setLoading(false);
            // Set default announcement if fetch fails
            setAnnouncements([
                {
                    id: 1,
                    title: "Welcome to BeeMafia!",
                    content: "Experience the ultimate game of deception and strategy.",
                    createdAt: new Date().toISOString()
                }
            ]);
        }
    };

    const handleNewAnnouncement = (announcement) => {
        setAnnouncements(prev => [announcement, ...prev].slice(0, 5));
    };

    const handleUpdatedAnnouncement = (updatedAnnouncement) => {
        setAnnouncements(prev =>
            prev.map(a => a.id === updatedAnnouncement.id ? updatedAnnouncement : a)
        );
    };

    const handleDeletedAnnouncement = ({ id }) => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { month: 'long', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    if (loading) {
        return (
            <div className="news-section">
                <div className="news-header">
                    <span className="news-icon">⭐</span>
                    <h2>NEWS</h2>
                </div>
                <div className="news-loading">Loading announcements...</div>
            </div>
        );
    }

    return (
        <div className="news-section">
            <div className="news-header">
                <span className="news-icon">⭐</span>
                <h2>NEWS</h2>
            </div>
            <div className="news-list">
                {announcements.length === 0 ? (
                    <div className="news-empty">
                        <p>No announcements at this time.</p>
                    </div>
                ) : (
                    announcements.map(announcement => (
                        <div key={announcement.id} className="news-item">
                            <h3>{announcement.title}</h3>
                            <p>{announcement.content}</p>
                            <div className="news-date">
                                {formatDate(announcement.createdAt)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default NewsSection;