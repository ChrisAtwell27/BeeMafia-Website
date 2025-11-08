import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './AdminPage.css';

function AdminPage() {
    const navigate = useNavigate();
    const [adminKey, setAdminKey] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        content: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check if already authenticated
        const storedKey = localStorage.getItem('adminKey');
        if (storedKey) {
            setAdminKey(storedKey);
            setIsAuthenticated(true);
            fetchAllAnnouncements(storedKey);
        }
    }, []);

    const handleAuth = (e) => {
        e.preventDefault();
        if (adminKey) {
            localStorage.setItem('adminKey', adminKey);
            setIsAuthenticated(true);
            fetchAllAnnouncements(adminKey);
        }
    };

    const fetchAllAnnouncements = async (key) => {
        try {
            const response = await fetch('http://localhost:3001/api/announcements/all', {
                headers: {
                    'x-admin-key': key || adminKey
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    toast.error('Invalid admin key');
                    setIsAuthenticated(false);
                    localStorage.removeItem('adminKey');
                    return;
                }
                throw new Error('Failed to fetch announcements');
            }

            const data = await response.json();
            setAnnouncements(data);
        } catch (err) {
            console.error('Error fetching announcements:', err);
            toast.error('Failed to load announcements');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newAnnouncement.title || !newAnnouncement.content) {
            toast.error('Title and content are required');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3001/api/announcements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify(newAnnouncement)
            });

            if (!response.ok) {
                throw new Error('Failed to create announcement');
            }

            const created = await response.json();
            setAnnouncements([created, ...announcements]);
            setNewAnnouncement({ title: '', content: '' });
            toast.success('Announcement created successfully!');
        } catch (err) {
            console.error('Error creating announcement:', err);
            toast.error('Failed to create announcement');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id) => {
        const announcement = announcements.find(a => a.id === id);
        if (!announcement) return;

        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/announcements/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify(announcement)
            });

            if (!response.ok) {
                throw new Error('Failed to update announcement');
            }

            toast.success('Announcement updated successfully!');
            setEditingId(null);
        } catch (err) {
            console.error('Error updating announcement:', err);
            toast.error('Failed to update announcement');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id) => {
        const announcement = announcements.find(a => a.id === id);
        if (!announcement) return;

        const updatedAnnouncement = { ...announcement, active: !announcement.active };

        try {
            const response = await fetch(`http://localhost:3001/api/announcements/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify(updatedAnnouncement)
            });

            if (!response.ok) {
                throw new Error('Failed to update announcement');
            }

            setAnnouncements(announcements.map(a =>
                a.id === id ? updatedAnnouncement : a
            ));
            toast.success(`Announcement ${updatedAnnouncement.active ? 'activated' : 'deactivated'}`);
        } catch (err) {
            console.error('Error updating announcement:', err);
            toast.error('Failed to update announcement');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/api/announcements/${id}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-key': adminKey
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete announcement');
            }

            setAnnouncements(announcements.filter(a => a.id !== id));
            toast.success('Announcement deleted successfully!');
        } catch (err) {
            console.error('Error deleting announcement:', err);
            toast.error('Failed to delete announcement');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('adminKey');
        setIsAuthenticated(false);
        setAdminKey('');
        setAnnouncements([]);
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-page">
                <div className="admin-auth-container">
                    <h1>Admin Panel</h1>
                    <form onSubmit={handleAuth} className="admin-auth-form">
                        <label>Enter Admin Key:</label>
                        <input
                            type="password"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            placeholder="Enter admin key"
                            className="admin-input"
                            autoFocus
                        />
                        <div className="admin-actions">
                            <button type="submit" className="btn-admin-primary">
                                Authenticate
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/lobby')}
                                className="btn-admin-secondary"
                            >
                                Back to Lobby
                            </button>
                        </div>
                    </form>
                    <p className="admin-hint">Default key: admin123</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>📢 Announcement Manager</h1>
                <div className="admin-header-actions">
                    <button onClick={() => navigate('/lobby')} className="btn-admin-secondary">
                        Back to Lobby
                    </button>
                    <button onClick={handleLogout} className="btn-admin-danger">
                        Logout
                    </button>
                </div>
            </div>

            <div className="admin-content">
                {/* Create New Announcement */}
                <div className="admin-section">
                    <h2>Create New Announcement</h2>
                    <form onSubmit={handleCreate} className="announcement-form">
                        <input
                            type="text"
                            placeholder="Announcement Title"
                            value={newAnnouncement.title}
                            onChange={(e) => setNewAnnouncement({
                                ...newAnnouncement,
                                title: e.target.value
                            })}
                            className="admin-input"
                            maxLength={200}
                        />
                        <textarea
                            placeholder="Announcement Content"
                            value={newAnnouncement.content}
                            onChange={(e) => setNewAnnouncement({
                                ...newAnnouncement,
                                content: e.target.value
                            })}
                            className="admin-textarea"
                            maxLength={1000}
                            rows={4}
                        />
                        <button
                            type="submit"
                            className="btn-admin-primary"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Announcement'}
                        </button>
                    </form>
                </div>

                {/* Existing Announcements */}
                <div className="admin-section">
                    <h2>Manage Announcements</h2>
                    <div className="announcements-list">
                        {announcements.length === 0 ? (
                            <p className="no-announcements">No announcements found.</p>
                        ) : (
                            announcements.map(announcement => (
                                <div key={announcement.id} className={`announcement-card ${!announcement.active ? 'inactive' : ''}`}>
                                    {editingId === announcement.id ? (
                                        <div className="announcement-edit">
                                            <input
                                                type="text"
                                                value={announcement.title}
                                                onChange={(e) => setAnnouncements(announcements.map(a =>
                                                    a.id === announcement.id
                                                        ? { ...a, title: e.target.value }
                                                        : a
                                                ))}
                                                className="admin-input"
                                            />
                                            <textarea
                                                value={announcement.content}
                                                onChange={(e) => setAnnouncements(announcements.map(a =>
                                                    a.id === announcement.id
                                                        ? { ...a, content: e.target.value }
                                                        : a
                                                ))}
                                                className="admin-textarea"
                                                rows={3}
                                            />
                                            <div className="edit-actions">
                                                <button
                                                    onClick={() => handleUpdate(announcement.id)}
                                                    className="btn-admin-success"
                                                    disabled={loading}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="btn-admin-secondary"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="announcement-view">
                                            <div className="announcement-header">
                                                <h3>{announcement.title}</h3>
                                                <span className={`status-badge ${announcement.active ? 'active' : 'inactive'}`}>
                                                    {announcement.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <p>{announcement.content}</p>
                                            <div className="announcement-meta">
                                                <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                                                <span>Priority: {announcement.priority || 0}</span>
                                            </div>
                                            <div className="announcement-actions">
                                                <button
                                                    onClick={() => setEditingId(announcement.id)}
                                                    className="btn-admin-edit"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(announcement.id)}
                                                    className={announcement.active ? 'btn-admin-warning' : 'btn-admin-success'}
                                                >
                                                    {announcement.active ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(announcement.id)}
                                                    className="btn-admin-danger"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPage;