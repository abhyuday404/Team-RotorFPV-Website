import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import './Admin.css';

const Admin = () => {
  const [user, setUser] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  
  // List of current admins fetched from our backend
  const [adminList, setAdminList] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    year: '',
    description: '',
    imageUrl: '',
    order: 0
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch custom claims to check if user is an admin
        const token = await currentUser.getIdTokenResult();
        const isAdmin = token.claims.admin === true;
        
        setUser({
          ...currentUser,
          isAdmin
        });

        if (isAdmin) {
          // Fetch achievements only if they are an admin
          const q = query(collection(db, 'achievements'), orderBy('order', 'desc'));
          const unsubscribeDb = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setAchievements(data);
            setLoading(false);
          });
          
          fetchAdminsList(currentUser);

          return () => unsubscribeDb();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking claims:", error);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const fetchAdminsList = async (currentUser) => {
    try {
      const idToken = await currentUser.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/admins`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminList(data.admins);
      }
    } catch (error) {
      console.error("Failed to fetch admin list:", error);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
      alert("Failed to login: " + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ title: '', year: '', description: '', imageUrl: '', order: 0 });
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      year: item.year || '',
      description: item.description || '',
      imageUrl: item.images?.[0] || '',
      order: item.order || 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this achievement?")) {
      try {
        await deleteDoc(doc(db, 'achievements', id));
      } catch (error) {
        console.error("Delete Error:", error);
        alert("Failed to delete. You might not have permission.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const dataToSave = {
      title: formData.title,
      year: formData.year,
      description: formData.description,
      order: Number(formData.order)
    };
    
    if (formData.imageUrl) {
      dataToSave.images = [formData.imageUrl];
    } else {
      dataToSave.images = [];
    }

    try {
      if (editingId) {
        await updateDoc(doc(db, 'achievements', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'achievements'), dataToSave);
      }
      resetForm();
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save achievement. You might not have permission.");
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    
    try {
      const idToken = await user.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/api/setAdmin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ email: newAdminEmail })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        alert("Admin added successfully!");
        setNewAdminEmail('');
        fetchAdminsList(user); // refresh list
      } else {
        alert("Failed to add admin: " + data.error);
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      alert("Failed to connect to backend server.");
    }
  };

  const handleRemoveAdmin = async (emailToRemove) => {
    if (emailToRemove === user.email) {
      alert("You cannot remove yourself!");
      return;
    }

    if (window.confirm(`Are you sure you want to revoke admin access from ${emailToRemove}?`)) {
      try {
        const idToken = await user.getIdToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/api/removeAdmin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({ email: emailToRemove })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          alert("Admin access revoked successfully!");
          fetchAdminsList(user); // refresh list
        } else {
          alert("Failed to remove admin: " + data.error);
        }
      } catch (error) {
        console.error("Error removing admin:", error);
        alert("Failed to connect to backend server.");
      }
    }
  };

  if (loading) {
    return <div className="admin-container"><div className="loading-spinner">Loading...</div></div>;
  }

  if (!user) {
    return (
      <div className="admin-container flex-center">
        <div className="admin-glass-panel login-panel">
          <h2>Admin Access</h2>
          <p>Please sign in to manage achievements.</p>
          <button onClick={handleLogin} className="google-login-btn">
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // Security UX check based on custom claims
  if (!user.isAdmin) {
    return (
      <div className="admin-container flex-center">
        <div className="admin-glass-panel login-panel">
          <h2>Access Denied</h2>
          <p>Your email ({user.email}) does not have admin privileges.</p>
          <button onClick={handleLogout} className="admin-btn secondary">Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>{user.email}</span>
          <button onClick={handleLogout} className="admin-btn secondary">Sign Out</button>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-glass-panel form-panel">
          <h2>{editingId ? 'Edit Achievement' : 'Add New Achievement'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            
            <div className="form-group">
              <label>Title</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleInputChange} 
                required 
                placeholder="e.g. Aerothon 2024"
              />
            </div>

            <div className="form-group">
              <label>Year</label>
              <input 
                type="text" 
                name="year" 
                value={formData.year} 
                onChange={handleInputChange} 
                required 
                placeholder="e.g. 2024"
              />
            </div>

            <div className="form-group">
              <label>Order (Higher numbers appear first)</label>
              <input 
                type="number" 
                name="order" 
                value={formData.order} 
                onChange={handleInputChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Image URL (Optional)</label>
              <input 
                type="text" 
                name="imageUrl" 
                value={formData.imageUrl} 
                onChange={handleInputChange} 
                placeholder="https://i.imgur.com/your-image.jpg"
              />
              <small>Upload image to Imgur/Discord and paste link here.</small>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleInputChange} 
                required 
                rows="4"
                placeholder="Detailed description of the achievement..."
              ></textarea>
            </div>

            <div className="form-actions">
              {editingId && (
                <button type="button" onClick={resetForm} className="admin-btn cancel">
                  Cancel Edit
                </button>
              )}
              <button type="submit" className="admin-btn primary">
                {editingId ? 'Update Achievement' : 'Add Achievement'}
              </button>
            </div>
          </form>
        </div>

        <div className="admin-right-column">
          <div className="admin-glass-panel list-panel" style={{ marginBottom: '30px' }}>
            <h2>Current Achievements</h2>
            <div className="achievements-list">
              {achievements.map((item) => (
                <div key={item.id} className="admin-achievement-card">
                  <div className="card-info">
                    <h3>{item.title} <span>({item.year})</span></h3>
                    <p className="order-badge">Order: {item.order}</p>
                    <p className="card-desc">{item.description}</p>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => handleEdit(item)} className="admin-btn edit">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="admin-btn delete">Delete</button>
                  </div>
                </div>
              ))}
              {achievements.length === 0 && <p>No achievements found.</p>}
            </div>
          </div>

          <div className="admin-glass-panel admin-management-panel">
            <h2>Manage Admins</h2>
            <p style={{fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '15px'}}>
              User must sign in to the website at least once before they can be granted admin privileges.
            </p>
            <form onSubmit={handleAddAdmin} className="admin-form" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input 
                type="email" 
                value={newAdminEmail} 
                onChange={(e) => setNewAdminEmail(e.target.value)} 
                placeholder="New admin email..." 
                required 
                style={{ flex: 1, marginBottom: 0 }}
              />
              <button type="submit" className="admin-btn primary" style={{ flex: 'none' }}>Grant Access</button>
            </form>
            
            <div className="admin-users-list">
              {adminList.map(email => (
                <div key={email} className="admin-user-item">
                  <span>{email}</span>
                  {email !== user.email && (
                    <button onClick={() => handleRemoveAdmin(email)} className="remove-admin-btn" title="Revoke access">×</button>
                  )}
                  {email === user.email && (
                    <span className="you-badge">You</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
