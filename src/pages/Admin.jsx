import React, { useState, useEffect, useRef } from 'react';
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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const galleryFileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('achievements');
  
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

  const [galleryItems, setGalleryItems] = useState([]);
  const [editingGalleryId, setEditingGalleryId] = useState(null);
  const [galleryFormData, setGalleryFormData] = useState({
    imgUrl: '',
    height: 400,
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
          const unsubscribes = [];
          
          // Fetch achievements only if they are an admin
          const qAchievements = query(collection(db, 'achievements'), orderBy('order', 'desc'));
          unsubscribes.push(onSnapshot(qAchievements, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setAchievements(data);
            setLoading(false);
          }));

          const qGallery = query(collection(db, 'gallery'), orderBy('order', 'desc'));
          unsubscribes.push(onSnapshot(qGallery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setGalleryItems(data);
          }));
          
          fetchAdminsList(currentUser);

          return () => {
            unsubscribes.forEach(unsub => unsub());
          };
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

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append("image", file);

    try {
      const idToken = await auth.currentUser.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: data,
      });
      const uploadedImage = await response.json();
      if (response.ok && uploadedImage.secure_url) {
        setFormData(prev => ({ ...prev, imageUrl: uploadedImage.secure_url }));
      } else {
        alert(uploadedImage.error || "Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input to allow re-selecting same file
      }
    }
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

  const getImageDimensions = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const handleGalleryInputChange = (e) => {
    const { name, value } = e.target;
    setGalleryFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGalleryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append("image", file);

    try {
      const idToken = await auth.currentUser.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
        body: data,
      });
      const uploadedImage = await response.json();
      if (response.ok && uploadedImage.secure_url) {
        setGalleryFormData(prev => ({ 
          ...prev, 
          imgUrl: uploadedImage.secure_url,
          originalWidth: uploadedImage.width,
          originalHeight: uploadedImage.height
        }));
      } else {
        alert(uploadedImage.error || "Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image.");
    } finally {
      setIsUploading(false);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = ''; // Reset input
      }
    }
  };

  const resetGalleryForm = () => {
    setGalleryFormData({ imgUrl: '', order: 0, originalWidth: null, originalHeight: null });
    setEditingGalleryId(null);
  };

  const handleGalleryEdit = (item) => {
    setEditingGalleryId(item.id);
    setGalleryFormData({
      imgUrl: item.img || '',
      order: item.order || 0,
      originalWidth: item.originalWidth || null,
      originalHeight: item.originalHeight || null
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGalleryDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this gallery image?")) {
      try {
        await deleteDoc(doc(db, 'gallery', id));
      } catch (error) {
        console.error("Delete Error:", error);
        alert("Failed to delete. You might not have permission.");
      }
    }
  };

  const handleGallerySubmit = async (e) => {
    e.preventDefault();
    if (!galleryFormData.imgUrl) {
      alert("Please provide an image URL or upload an image.");
      return;
    }
    
    // Auto-detect dimensions if not already fetched
    let width = galleryFormData.originalWidth;
    let height = galleryFormData.originalHeight;
    
    if (!width || !height) {
        const dims = await getImageDimensions(galleryFormData.imgUrl);
        if (dims) {
            width = dims.width;
            height = dims.height;
        }
    }

    const dataToSave = {
      img: galleryFormData.imgUrl,
      order: Number(galleryFormData.order),
      originalWidth: width || 600,
      originalHeight: height || 400,
      url: "" 
    };

    try {
      if (editingGalleryId) {
        await updateDoc(doc(db, 'gallery', editingGalleryId), dataToSave);
      } else {
        await addDoc(collection(db, 'gallery'), dataToSave);
      }
      resetGalleryForm();
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save gallery image. You might not have permission.");
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

      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
        </button>
        <button 
          className={`admin-tab ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Gallery
        </button>
        <button 
          className={`admin-tab ${activeTab === 'admins' ? 'active' : ''}`}
          onClick={() => setActiveTab('admins')}
        >
          Manage Admins
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'achievements' && (
          <>
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
                  <label>Image (Optional)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef}
                      onChange={handleImageUpload} 
                      disabled={isUploading}
                      style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}
                    />
                    {isUploading && <span style={{ color: '#00fff5', fontSize: '0.9rem' }}>Uploading...</span>}
                  </div>
                  <input 
                    type="text" 
                    name="imageUrl" 
                    value={formData.imageUrl} 
                    onChange={handleInputChange} 
                    placeholder="Or paste an image URL directly here..."
                  />
                  {formData.imageUrl && (
                    <div style={{ marginTop: '10px', border: '1px solid rgba(255,255,255,0.1)', padding: '5px', borderRadius: '5px', display: 'inline-block' }}>
                      <img src={formData.imageUrl} alt="Preview" style={{ height: '80px', borderRadius: '4px', objectFit: 'cover' }} />
                    </div>
                  )}
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
              <div className="admin-glass-panel list-panel" style={{ marginBottom: '30px', height: '100%' }}>
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
            </div>
          </>
        )}

        {activeTab === 'gallery' && (
          <>
            <div className="admin-glass-panel form-panel">
              <h2>{editingGalleryId ? 'Edit Gallery Image' : 'Add New Gallery Image'}</h2>
              <form onSubmit={handleGallerySubmit} className="admin-form">
                
                <div className="form-group">
                  <label>Order (Higher numbers appear first)</label>
                  <input 
                    type="number" 
                    name="order" 
                    value={galleryFormData.order} 
                    onChange={handleGalleryInputChange} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Image</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={galleryFileInputRef}
                      onChange={handleGalleryImageUpload} 
                      disabled={isUploading}
                      style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}
                    />
                    {isUploading && <span style={{ color: '#00fff5', fontSize: '0.9rem' }}>Uploading...</span>}
                  </div>
                  <input 
                    type="text" 
                    name="imgUrl" 
                    value={galleryFormData.imgUrl} 
                    onChange={handleGalleryInputChange} 
                    placeholder="Or paste an image URL directly here..."
                  />
                  {galleryFormData.imgUrl && (
                    <div style={{ marginTop: '10px', border: '1px solid rgba(255,255,255,0.1)', padding: '5px', borderRadius: '5px', display: 'inline-block' }}>
                      <img src={galleryFormData.imgUrl} alt="Preview" style={{ height: '120px', borderRadius: '4px', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  {editingGalleryId && (
                    <button type="button" onClick={resetGalleryForm} className="admin-btn cancel">
                      Cancel Edit
                    </button>
                  )}
                  <button type="submit" className="admin-btn primary">
                    {editingGalleryId ? 'Update Image' : 'Add Image'}
                  </button>
                </div>
              </form>
            </div>

            <div className="admin-right-column">
              <div className="admin-glass-panel list-panel" style={{ marginBottom: '30px', height: '100%' }}>
                <h2>Current Gallery</h2>
                <div className="achievements-list">
                  {galleryItems.map((item) => (
                    <div key={item.id} className="admin-achievement-card" style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <img src={item.img} alt="Gallery" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                      <div className="card-info" style={{ flex: 1, marginLeft: '15px' }}>
                        <p className="order-badge">Order: {item.order}</p>
                        {item.originalWidth && item.originalHeight ? (
                           <p className="card-desc">Dims: {item.originalWidth}x{item.originalHeight}</p>
                        ) : (
                           <p className="card-desc">Legacy Height: {item.height}px</p>
                        )}
                      </div>
                      <div className="card-actions" style={{ flexDirection: 'column', marginTop: 0 }}>
                        <button onClick={() => handleGalleryEdit(item)} className="admin-btn edit">Edit</button>
                        <button onClick={() => handleGalleryDelete(item.id)} className="admin-btn delete">Delete</button>
                      </div>
                    </div>
                  ))}
                  {galleryItems.length === 0 && <p>No gallery images found.</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'admins' && (
          <div className="admin-glass-panel admin-management-panel" style={{ gridColumn: '1 / -1' }}>
            <h2>Manage Admins</h2>
            <p style={{fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '20px'}}>
              User must sign in to the website at least once before they can be granted admin privileges.
            </p>
            <form onSubmit={handleAddAdmin} className="admin-form" style={{ display: 'flex', gap: '15px', marginBottom: '30px', maxWidth: '500px' }}>
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
            
            <div className="admin-users-list" style={{ maxWidth: '800px' }}>
              {adminList.map(email => (
                <div key={email} className="admin-user-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>{email}</span>
                    {email === user.email && (
                      <span className="you-badge">You</span>
                    )}
                  </div>
                  {email !== user.email && (
                    <button onClick={() => handleRemoveAdmin(email)} className="admin-btn delete" style={{ padding: '6px 12px', fontSize: '0.85rem' }} title="Revoke access">Revoke</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
