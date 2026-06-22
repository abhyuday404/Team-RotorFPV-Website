import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase';
import './Admin.css';

const formatBoardYear = (year) => {
  if (typeof year === 'string' && year.length === 4 && !isNaN(parseInt(year))) {
    return `${year}-${parseInt(year) + 1}`;
  }
  return year;
};

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
  const [galleryHeroUrl, setGalleryHeroUrl] = useState('');
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const heroFileInputRef = useRef(null);
  
  // Team Space State
  const [teamYears, setTeamYears] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeamYear, setSelectedTeamYear] = useState('');
  const [newTeamYear, setNewTeamYear] = useState('');
  const [editingTeamMemberId, setEditingTeamMemberId] = useState(null);
  const teamMemberFileInputRef = useRef(null);
  const [teamMemberFormData, setTeamMemberFormData] = useState({
    name: '',
    role: '',
    image: '',
    linkedin: '',
    category: 'leaders',
    order: 0,
    isActive: true
  });
  
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

  // Sponsors State
  const [sponsors, setSponsors] = useState([]);
  const [editingSponsorId, setEditingSponsorId] = useState(null);
  const sponsorFileInputRef = useRef(null);
  const [sponsorFormData, setSponsorFormData] = useState({
    name: '',
    website: '',
    logo: '',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    let firestoreUnsubscribes = [];

    const clearFirestoreListeners = () => {
      firestoreUnsubscribes.forEach(unsub => unsub());
      firestoreUnsubscribes = [];
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      clearFirestoreListeners(); // Clear old listeners if auth state changes
      
      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Fetch custom claims to check if user is an admin
        const token = await currentUser.getIdTokenResult();
        const isAdmin = token.claims.admin === true;
        const isSuperAdmin = token.claims.superAdmin === true;
        
        setUser({
          ...currentUser,
          isAdmin,
          isSuperAdmin
        });

        if (isAdmin) {
          // Fetch achievements only if they are an admin
          const qAchievements = query(collection(db, 'achievements'), orderBy('order', 'desc'));
          firestoreUnsubscribes.push(onSnapshot(qAchievements, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setAchievements(data);
            setLoading(false);
          }, (error) => {
            console.error("Error fetching admin achievements:", error);
            setLoading(false);
          }));

          const qGallery = query(collection(db, 'gallery'), orderBy('order', 'desc'));
          firestoreUnsubscribes.push(onSnapshot(qGallery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setGalleryItems(data);
          }, (error) => {
            console.error("Error fetching admin gallery:", error);
            setLoading(false);
          }));

          const heroUnsubscribe = onSnapshot(doc(db, 'settings', 'gallery'), (docSnap) => {
            if (docSnap.exists() && docSnap.data().heroImageUrl) {
              setGalleryHeroUrl(docSnap.data().heroImageUrl);
            }
          });
          firestoreUnsubscribes.push(heroUnsubscribe);

          const qTeamYears = query(collection(db, 'team_years'), orderBy('year', 'desc'));
          firestoreUnsubscribes.push(onSnapshot(qTeamYears, (snapshot) => {
            const data = snapshot.docs.map(doc => doc.data().year);
            setTeamYears(data);
            if (data.length > 0) {
              setSelectedTeamYear(prev => prev || data[0]);
            }
          }, (error) => {
            console.error("Error fetching team years:", error);
          }));

          const qTeamMembers = query(collection(db, 'team_members'), orderBy('order', 'asc'));
          firestoreUnsubscribes.push(onSnapshot(qTeamMembers, (snapshot) => {
            const data = snapshot.docs.map(doc => {
              const d = doc.data();
              if (d.category === 'miscellaneous') d.category = 'essential';
              return {
                id: doc.id,
                ...d
              };
            });
            setTeamMembers(data);
          }, (error) => {
            console.error("Error fetching team members:", error);
          }));
          const qSponsors = query(collection(db, 'sponsors'), orderBy('order', 'asc'));
          firestoreUnsubscribes.push(onSnapshot(qSponsors, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setSponsors(data);
          }, (error) => {
            console.error("Error fetching admin sponsors:", error);
          }));
          
          fetchAdminsList();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking claims:", error);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      clearFirestoreListeners(); // Cleanup listeners when component unmounts
    };
  }, []);

  async function fetchAdminsList() {
    try {
      const idToken = await auth.currentUser.getIdToken();
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

  // Best-effort removal of an uploaded image from Cloudinary.
  // No-ops for externally pasted (non-Cloudinary) URLs; never blocks the Firestore delete.
  const deleteCloudinaryImage = async (url) => {
    if (!url || !url.includes('res.cloudinary.com')) return;
    try {
      const idToken = await auth.currentUser.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await fetch(`${apiUrl}/api/delete-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ url })
      });
    } catch (error) {
      console.error("Failed to delete Cloudinary image:", error);
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

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingHero(true);
    const data = new FormData();
    data.append("image", file);
    data.append("folder", "gallery");
    try {
      const idToken = await auth.currentUser.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: data,
      });
      const uploadedImage = await response.json();
      if (response.ok && uploadedImage.secure_url) {
        if (galleryHeroUrl) {
          await deleteCloudinaryImage(galleryHeroUrl);
        }
        await setDoc(doc(db, 'settings', 'gallery'), { heroImageUrl: uploadedImage.secure_url }, { merge: true });
        alert("Gallery Hero Image updated successfully!");
      } else {
        alert(uploadedImage.error || "Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image.");
    } finally {
      setIsUploadingHero(false);
      if (heroFileInputRef.current) heroFileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append("image", file);
    data.append("folder", "achievements");

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

  const handleDelete = async (item) => {
    if (window.confirm("Are you sure you want to delete this achievement?")) {
      try {
        await deleteDoc(doc(db, 'achievements', item.id));
        for (const url of item.images || []) {
          await deleteCloudinaryImage(url);
        }
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
        const oldItem = achievements.find(a => a.id === editingId);
        if (oldItem && oldItem.images && oldItem.images.length > 0) {
          const oldUrl = oldItem.images[0];
          if (oldUrl && oldUrl !== formData.imageUrl) {
            await deleteCloudinaryImage(oldUrl);
          }
        }
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
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);

    try {
      const idToken = await auth.currentUser.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      for (const file of files) {
        const data = new FormData();
        data.append("image", file);
        data.append("folder", "gallery");

        const response = await fetch(`${apiUrl}/api/upload`, {
          method: "POST",
          headers: {
            'Authorization': `Bearer ${idToken}`
          },
          body: data,
        });

        const uploadedImage = await response.json();

        if (response.ok && uploadedImage.secure_url) {
          if (files.length > 1) {
            // If multiple files, auto-add them because the form can only hold one
            const dataToSave = {
              img: uploadedImage.secure_url,
              order: Number(galleryFormData.order),
              originalWidth: uploadedImage.width || 600,
              originalHeight: uploadedImage.height || 400,
              url: "" 
            };
            await addDoc(collection(db, 'gallery'), dataToSave);
          } else {
            // For a single file, just populate the form so the user can submit manually
            setGalleryFormData(prev => ({ 
              ...prev, 
              imgUrl: uploadedImage.secure_url,
              originalWidth: uploadedImage.width,
              originalHeight: uploadedImage.height
            }));
          }
        } else {
          alert(`Upload failed for ${file.name}: ${uploadedImage.error || "Please try again."}`);
        }
      }
      
      if (files.length > 1) {
        alert(`Successfully uploaded ${files.length} images!`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image(s).");
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

  const handleGalleryDelete = async (item) => {
    if (window.confirm("Are you sure you want to delete this gallery image?")) {
      try {
        await deleteDoc(doc(db, 'gallery', item.id));
        await deleteCloudinaryImage(item.img);
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
        const oldItem = galleryItems.find(g => g.id === editingGalleryId);
        if (oldItem && oldItem.img && oldItem.img !== galleryFormData.imgUrl) {
          await deleteCloudinaryImage(oldItem.img);
        }
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
      const idToken = await auth.currentUser.getIdToken();
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
        fetchAdminsList(); // refresh list
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

    if (window.confirm(`Remove admin privileges from ${emailToRemove}?\n\nThis action cannot be undone automatically.`)) {
      try {
        const idToken = await auth.currentUser.getIdToken();
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
          fetchAdminsList(); // refresh list
        } else {
          alert("Failed to remove admin: " + data.error);
        }
      } catch (error) {
        console.error("Error removing admin:", error);
        alert("Failed to connect to backend server.");
      }
    }
  };

  const handlePromoteAdmin = async (emailToPromote) => {
    if (window.confirm(`Promote ${emailToPromote} to Super Admin?\n\nSuper Admins can manage admins, promote other users, and modify permissions.`)) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/api/setSuperAdmin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({ email: emailToPromote })
        });
        const data = await res.json();
        if (res.ok) {
          alert("Admin promoted successfully!");
          fetchAdminsList();
        } else {
          alert("Failed to promote: " + data.error);
        }
      } catch (error) {
        console.error("Error promoting:", error);
        alert("Failed to connect to backend server.");
      }
    }
  };

  const handleDemoteAdmin = async (emailToDemote) => {
    if (emailToDemote === user.email) {
      alert("You cannot demote yourself!");
      return;
    }
    if (window.confirm(`Remove Super Admin privileges from ${emailToDemote}?\n\nThey will remain an Admin but lose permission management capabilities.`)) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/api/removeSuperAdmin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify({ email: emailToDemote })
        });
        const data = await res.json();
        if (res.ok) {
          alert("Super Admin privileges revoked successfully!");
          fetchAdminsList();
        } else {
          alert("Failed to demote: " + data.error);
        }
      } catch (error) {
        console.error("Error demoting:", error);
        alert("Failed to connect to backend server.");
      }
    }
  };

  // --- Team Space Handlers ---
  const handleAddYear = async (e) => {
    e.preventDefault();
    if (!newTeamYear.trim()) return;
    try {
      await setDoc(doc(db, 'team_years', newTeamYear.trim()), {
        year: newTeamYear.trim(),
        createdAt: serverTimestamp()
      });
      setNewTeamYear('');
      setSelectedTeamYear(newTeamYear.trim());
    } catch (error) {
      console.error("Add Year Error:", error);
      alert("Failed to add year. " + error.message);
    }
  };

  const handleDeleteYear = async (year) => {
    if (window.confirm(`Are you sure you want to delete the year ${year}? This does NOT delete the members in this year automatically.`)) {
      try {
        await deleteDoc(doc(db, 'team_years', year));
        if (selectedTeamYear === year) {
           setSelectedTeamYear(teamYears.filter(y => y !== year)[0] || '');
        }
      } catch (error) {
        console.error("Delete Year Error:", error);
        alert("Failed to delete year.");
      }
    }
  };

  const handleTeamMemberInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTeamMemberFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetTeamMemberForm = () => {
    setTeamMemberFormData({ name: '', role: '', image: '', linkedin: '', category: 'leaders', order: 0, isActive: true });
    setEditingTeamMemberId(null);
  };

  const handleTeamMemberEdit = (item) => {
    setEditingTeamMemberId(item.id);
    setTeamMemberFormData({
      name: item.name || '',
      role: item.role || '',
      image: item.image || '',
      linkedin: item.linkedin || '',
      category: item.category || 'leaders',
      order: item.order || 0,
      isActive: item.isActive !== false // default to true if undefined
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTeamMemberDelete = async (member) => {
    if (window.confirm("Are you sure you want to delete this team member?")) {
      try {
        await deleteDoc(doc(db, 'team_members', member.id));
        await deleteCloudinaryImage(member.image);
      } catch (error) {
        console.error("Delete Error:", error);
        alert("Failed to delete team member.");
      }
    }
  };

  const handleTeamMemberSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeamYear) {
       alert("Please select a year first.");
       return;
    }
    const dataToSave = {
      year: selectedTeamYear,
      name: teamMemberFormData.name,
      role: teamMemberFormData.role,
      image: teamMemberFormData.image,
      linkedin: teamMemberFormData.linkedin,
      category: teamMemberFormData.category,
      order: Number(teamMemberFormData.order),
      isActive: teamMemberFormData.isActive,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingTeamMemberId) {
        const oldItem = teamMembers.find(t => t.id === editingTeamMemberId);
        if (oldItem && oldItem.image && oldItem.image !== teamMemberFormData.image) {
          await deleteCloudinaryImage(oldItem.image);
        }
        await updateDoc(doc(db, 'team_members', editingTeamMemberId), dataToSave);
      } else {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, 'team_members'), dataToSave);
      }
      resetTeamMemberForm();
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save team member.");
    }
  };

  const handleTeamMemberImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append("image", file);
    data.append("folder", "board");

    try {
      const idToken = await auth.currentUser.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: data,
      });
      const uploadedImage = await response.json();
      if (response.ok && uploadedImage.secure_url) {
        setTeamMemberFormData(prev => ({ ...prev, image: uploadedImage.secure_url }));
      } else {
        alert(uploadedImage.error || "Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image.");
    } finally {
      setIsUploading(false);
      if (teamMemberFileInputRef.current) teamMemberFileInputRef.current.value = '';
    }
  };

  // --- Sponsors Handlers ---
  const handleSponsorInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSponsorFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSponsorImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append("image", file);
    data.append("folder", "sponsors");

    try {
      const idToken = await auth.currentUser.getIdToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        headers: { 'Authorization': `Bearer ${idToken}` },
        body: data,
      });
      const uploadedImage = await response.json();
      if (response.ok && uploadedImage.secure_url) {
        setSponsorFormData(prev => ({ ...prev, logo: uploadedImage.secure_url }));
      } else {
        alert(uploadedImage.error || "Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading image.");
    } finally {
      setIsUploading(false);
      if (sponsorFileInputRef.current) sponsorFileInputRef.current.value = '';
    }
  };

  const resetSponsorForm = () => {
    setSponsorFormData({ name: '', website: '', logo: '', order: 0, isActive: true });
    setEditingSponsorId(null);
  };

  const handleSponsorEdit = (item) => {
    setEditingSponsorId(item.id);
    setSponsorFormData({
      name: item.name || '',
      website: item.website || '',
      logo: item.logo || '',
      order: item.order || 0,
      isActive: item.isActive !== false
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSponsorDelete = async (item) => {
    if (window.confirm("Are you sure you want to delete this sponsor?")) {
      try {
        await deleteDoc(doc(db, 'sponsors', item.id));
        await deleteCloudinaryImage(item.logo);
      } catch (error) {
        console.error("Delete Error:", error);
        alert("Failed to delete sponsor.");
      }
    }
  };

  const handleSponsorSubmit = async (e) => {
    e.preventDefault();
    if (!sponsorFormData.name || !sponsorFormData.logo) {
       alert("Name and Logo are required.");
       return;
    }
    const dataToSave = {
      name: sponsorFormData.name,
      website: sponsorFormData.website,
      logo: sponsorFormData.logo,
      order: Number(sponsorFormData.order),
      isActive: sponsorFormData.isActive,
      updatedAt: serverTimestamp(),
      updatedBy: user.email
    };

    try {
      if (editingSponsorId) {
        const oldItem = sponsors.find(s => s.id === editingSponsorId);
        if (oldItem && oldItem.logo && oldItem.logo !== sponsorFormData.logo) {
          await deleteCloudinaryImage(oldItem.logo);
        }
        await updateDoc(doc(db, 'sponsors', editingSponsorId), dataToSave);
      } else {
        dataToSave.createdAt = serverTimestamp();
        dataToSave.createdBy = user.email;
        await addDoc(collection(db, 'sponsors'), dataToSave);
      }
      resetSponsorForm();
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save sponsor.");
    }
  };

  if (loading) {
    return (
      <div className="admin-container flex-center">
        <div className="loading-spinner">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-container flex-center">
        <div className="admin-glass-panel login-panel">
          <h2>Admin Access</h2>
          <p>Please sign in to manage achievements, gallery, and admins.</p>
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
          <p>Your account (<strong>{user.email}</strong>) doesn't have admin privileges.</p>
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
          <span className="user-email">{user.email}</span>
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
          className={`admin-tab ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => { setActiveTab('team'); resetTeamMemberForm(); }}
        >
          Board
        </button>
        <button
          className={`admin-tab ${activeTab === 'sponsors' ? 'active' : ''}`}
          onClick={() => { setActiveTab('sponsors'); resetSponsorForm(); }}
        >
          Sponsors
        </button>
        {(user?.isSuperAdmin) && (
          <button
            className={`admin-tab ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            Manage Admins
          </button>
        )}
      </div>

      <div className="admin-content">
        {activeTab === 'achievements' && (
          <>
            <div className="admin-left-column">
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

                  <div className="form-row">
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
                      <label>Order</label>
                      <input
                        type="number"
                        name="order"
                        value={formData.order}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Image (Optional)</label>
                    <div className="file-upload">
                      <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                      {isUploading && <span className="upload-status">Uploading…</span>}
                    </div>
                    <div className="input-divider">or</div>
                    <input
                      type="text"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                      placeholder="Paste an image URL directly"
                    />
                    {formData.imageUrl && (
                      <div className="image-preview achievement">
                        <img src={formData.imageUrl} alt="Preview" />
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
                      placeholder="Detailed description of the achievement…"
                    ></textarea>
                  </div>

                  <div className="form-actions">
                    {editingId && (
                      <button type="button" onClick={resetForm} className="admin-btn cancel">
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="admin-btn primary">
                      {editingId ? 'Update Achievement' : 'Add Achievement'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="admin-right-column">
              <div className="admin-glass-panel list-panel">
                <h2>Current Achievements</h2>
                <div className="achievements-list">
                  {achievements.map((item) => (
                    <div key={item.id} className="admin-achievement-card">
                      <div className="card-info">
                        <h3>{item.title} <span className="year">({item.year})</span></h3>
                        <span className="order-badge">Order: {item.order}</span>
                        <p className="card-desc">{item.description}</p>
                      </div>
                      <div className="card-actions">
                        <button onClick={() => handleEdit(item)} className="admin-btn edit small">Edit</button>
                        <button onClick={() => handleDelete(item)} className="admin-btn delete small">Delete</button>
                      </div>
                    </div>
                  ))}
                  {achievements.length === 0 && <p className="empty-state">No achievements yet.</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'gallery' && (
          <>
            <div className="admin-left-column">
              <div className="admin-glass-panel form-panel">
                <h2>Gallery Scroll Animation Image</h2>
                <div className="hero-image-manager">
                  <span className="field-label">Current Image</span>
                  {galleryHeroUrl ? (
                    <div className="image-preview hero block">
                      <img src={galleryHeroUrl} alt="Gallery Hero" />
                    </div>
                  ) : (
                    <div className="image-preview-placeholder">Using default image</div>
                  )}

                  <div className="hero-upload">
                    <span className="field-label">Upload New Image</span>
                    <div className="file-upload">
                      <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        ref={heroFileInputRef}
                        onChange={handleHeroImageUpload}
                        disabled={isUploadingHero}
                      />
                      {isUploadingHero && <span className="upload-status">Uploading…</span>}
                    </div>
                  </div>
                </div>
              </div>

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
                    <div className="file-upload">
                      <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        multiple
                        ref={galleryFileInputRef}
                        onChange={handleGalleryImageUpload}
                        disabled={isUploading}
                      />
                      {isUploading && <span className="upload-status">Uploading…</span>}
                    </div>
                    <p className="field-hint">Tip: select multiple files to upload them all at once.</p>
                    <div className="input-divider">or</div>
                    <input
                      type="text"
                      name="imgUrl"
                      value={galleryFormData.imgUrl}
                      onChange={handleGalleryInputChange}
                      placeholder="Paste an image URL directly"
                    />
                    {galleryFormData.imgUrl && (
                      <div className="image-preview gallery">
                        <img src={galleryFormData.imgUrl} alt="Preview" />
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    {editingGalleryId && (
                      <button type="button" onClick={resetGalleryForm} className="admin-btn cancel">
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="admin-btn primary">
                      {editingGalleryId ? 'Update Image' : 'Add Image'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="admin-right-column">
              <div className="admin-glass-panel list-panel">
                <h2>Current Gallery</h2>
                <div className="achievements-list gallery-grid">
                  {galleryItems.map((item) => (
                    <div key={item.id} className="admin-achievement-card">
                      <img src={item.img} alt="Gallery" className="card-thumb" />
                      <div className="card-info">
                        <span className="order-badge">Order: {item.order}</span>
                        {item.originalWidth && item.originalHeight ? (
                           <p className="card-desc">{item.originalWidth} × {item.originalHeight}</p>
                        ) : (
                           <p className="card-desc">Legacy height: {item.height}px</p>
                        )}
                      </div>
                      <div className="card-actions">
                        <button onClick={() => handleGalleryEdit(item)} className="admin-btn edit small">Edit</button>
                        <button onClick={() => handleGalleryDelete(item)} className="admin-btn delete small">Delete</button>
                      </div>
                    </div>
                  ))}
                  {galleryItems.length === 0 && <p className="empty-state">No gallery images yet.</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'team' && (
          <>
            <div className="admin-left-column">
              <div className="admin-glass-panel form-panel">
                <h2>Manage Years</h2>
                <form onSubmit={handleAddYear} className="admin-form inline-form">
                  <input
                    type="text"
                    value={newTeamYear}
                    onChange={(e) => setNewTeamYear(e.target.value)}
                    placeholder="e.g. 2026 or 2026-2027"
                    required
                  />
                  <button type="submit" className="admin-btn primary small">Add Year</button>
                </form>
                <div className="year-pills">
                  {teamYears.map(year => (
                    <div key={year} className={`year-pill ${selectedTeamYear === year ? 'active' : ''}`}>
                      <span onClick={() => { setSelectedTeamYear(year); resetTeamMemberForm(); }}>{formatBoardYear(year)}</span>
                      <button onClick={() => handleDeleteYear(year)} className="delete-year-btn">×</button>
                    </div>
                  ))}
                  {teamYears.length === 0 && <span className="empty-text">No years created yet.</span>}
                </div>
              </div>

              {selectedTeamYear && (
                <div className="admin-glass-panel form-panel">
                  <h2>{editingTeamMemberId ? `Edit Member (${formatBoardYear(selectedTeamYear)})` : `Add Member (${formatBoardYear(selectedTeamYear)})`}</h2>
                  <form onSubmit={handleTeamMemberSubmit} className="admin-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Name</label>
                        <input
                          type="text"
                          name="name"
                          value={teamMemberFormData.name}
                          onChange={handleTeamMemberInputChange}
                          required
                          placeholder="e.g. John Doe"
                        />
                      </div>
                      <div className="form-group">
                        <label>Category</label>
                        <select
                          name="category"
                          value={teamMemberFormData.category}
                          onChange={handleTeamMemberInputChange}
                          required
                        >
                          <option value="leaders">Leaders</option>
                          <option value="technical">Technical</option>
                          <option value="essential">Essential</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Role</label>
                        <input
                          type="text"
                          name="role"
                          value={teamMemberFormData.role}
                          onChange={handleTeamMemberInputChange}
                          required
                          placeholder="e.g. CAPTAIN"
                        />
                      </div>
                      <div className="form-group">
                        <label>Order</label>
                        <input
                          type="number"
                          name="order"
                          value={teamMemberFormData.order}
                          onChange={handleTeamMemberInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>LinkedIn URL</label>
                      <input
                        type="url"
                        name="linkedin"
                        value={teamMemberFormData.linkedin}
                        onChange={handleTeamMemberInputChange}
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Image</label>
                      <div className="file-upload">
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          ref={teamMemberFileInputRef}
                          onChange={handleTeamMemberImageUpload}
                          disabled={isUploading}
                        />
                        {isUploading && <span className="upload-status">Uploading…</span>}
                      </div>
                      <div className="input-divider">or</div>
                      <input
                        type="text"
                        name="image"
                        value={teamMemberFormData.image}
                        onChange={handleTeamMemberInputChange}
                        placeholder="Paste an image URL directly"
                        required
                      />
                      {teamMemberFormData.image && (
                        <div className="image-preview achievement">
                          <img src={teamMemberFormData.image} alt="Preview" />
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={teamMemberFormData.isActive}
                          onChange={handleTeamMemberInputChange}
                        />
                        Active (visible on website)
                      </label>
                    </div>

                    <div className="form-actions">
                      {editingTeamMemberId && (
                        <button type="button" onClick={resetTeamMemberForm} className="admin-btn cancel">
                          Cancel
                        </button>
                      )}
                      <button type="submit" className="admin-btn primary">
                        {editingTeamMemberId ? 'Update Member' : 'Add Member'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="admin-right-column">
              <div className="admin-glass-panel list-panel">
                <h2>Members in {selectedTeamYear ? formatBoardYear(selectedTeamYear) : '...'}</h2>
                {['leaders', 'technical', 'essential'].map(category => {
                  const categoryMembers = teamMembers.filter(m => m.year === selectedTeamYear && m.category === category);
                  if (categoryMembers.length === 0) return null;
                  
                  return (
                    <div key={category} className="team-category-section">
                      <h3 className="category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                      <div className="achievements-list">
                        {categoryMembers.map(member => (
                          <div key={member.id} className={`admin-achievement-card ${!member.isActive ? 'inactive-member' : ''}`}>
                            <div className="card-info">
                              <h3>{member.name} <span className={`status-badge ${member.isActive ? 'active' : 'inactive'}`}>{member.isActive ? 'Active' : 'Inactive'}</span></h3>
                              <span className="order-badge">Role: {member.role} | Order: {member.order}</span>
                            </div>
                            <div className="card-actions">
                              <button onClick={() => handleTeamMemberEdit(member)} className="admin-btn edit small">Edit</button>
                              <button onClick={() => handleTeamMemberDelete(member)} className="admin-btn delete small">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {selectedTeamYear && teamMembers.filter(m => m.year === selectedTeamYear).length === 0 && (
                  <p className="empty-state">No members found for this year.</p>
                )}
                {!selectedTeamYear && (
                  <p className="empty-state">Select a year to view members.</p>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'sponsors' && (
          <>
            <div className="admin-left-column">
              <div className="admin-glass-panel form-panel">
                <h2>{editingSponsorId ? 'Edit Sponsor' : 'Add New Sponsor'}</h2>
                <form onSubmit={handleSponsorSubmit} className="admin-form">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={sponsorFormData.name}
                      onChange={handleSponsorInputChange}
                      required
                      placeholder="e.g. DJI"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Website URL</label>
                    <input
                      type="url"
                      name="website"
                      value={sponsorFormData.website}
                      onChange={handleSponsorInputChange}
                      required
                      placeholder="https://www.dji.com"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Order</label>
                      <input
                        type="number"
                        name="order"
                        value={sponsorFormData.order}
                        onChange={handleSponsorInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Logo</label>
                    <div className="file-upload">
                      <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        ref={sponsorFileInputRef}
                        onChange={handleSponsorImageUpload}
                        disabled={isUploading}
                      />
                      {isUploading && <span className="upload-status">Uploading...</span>}
                    </div>
                    <div className="input-divider">or</div>
                    <input
                      type="text"
                      name="logo"
                      value={sponsorFormData.logo}
                      onChange={handleSponsorInputChange}
                      placeholder="Paste an image URL directly"
                      required
                    />
                    {sponsorFormData.logo && (
                      <div className="image-preview achievement" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: '10px' }}>
                        <img src={sponsorFormData.logo} alt="Preview" style={{ objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={sponsorFormData.isActive}
                        onChange={handleSponsorInputChange}
                      />
                      Active (visible on website)
                    </label>
                  </div>

                  <div className="form-actions">
                    {editingSponsorId && (
                      <button type="button" onClick={resetSponsorForm} className="admin-btn cancel">
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="admin-btn primary">
                      {editingSponsorId ? 'Update Sponsor' : 'Add Sponsor'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="admin-right-column">
              <div className="admin-glass-panel list-panel">
                <h2>Current Sponsors</h2>
                <div className="achievements-list">
                  {sponsors.map((item) => (
                    <div key={item.id} className={`admin-achievement-card ${!item.isActive ? 'inactive-member' : ''}`}>
                      <div className="card-info">
                        <h3>{item.name} <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>{item.isActive ? 'Active' : 'Inactive'}</span></h3>
                        <span className="order-badge">Order: {item.order}</span>
                        <p className="card-desc"><a href={item.website} target="_blank" rel="noopener noreferrer" style={{color: 'inherit'}}>{item.website}</a></p>
                      </div>
                      <div className="card-actions">
                        <button onClick={() => handleSponsorEdit(item)} className="admin-btn edit small">Edit</button>
                        <button onClick={() => handleSponsorDelete(item)} className="admin-btn delete small">Delete</button>
                      </div>
                    </div>
                  ))}
                  {sponsors.length === 0 && <p className="empty-state">No sponsors yet.</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'admins' && (user?.isSuperAdmin) && (
          <>
            <div className="admin-left-column">
              <div className="admin-glass-panel form-panel">
                <h2>Grant Admin Access</h2>
                <p className="panel-desc">
                  User must sign in to the website at least once before they can be granted admin privileges.
                </p>
                <form onSubmit={handleAddAdmin} className="admin-form">
                  <div className="form-group">
                    <label>New Admin Email</label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="admin-btn primary">Grant Access</button>
                  </div>
                </form>
              </div>
            </div>

            <div className="admin-right-column">
              <div className="admin-glass-panel list-panel">
                <h2>Current Admins</h2>
                <div className="achievements-list">
                  {adminList.map(admin => (
                    <div key={admin.email} className="admin-achievement-card admin-user-card">
                      <div className="card-info">
                        <h3>{admin.email}</h3>
                        {admin.isRoot && (
                          <span className="role-badge root">Root Super Admin</span>
                        )}
                        {!admin.isRoot && admin.isSuperAdmin && (
                          <span className="role-badge super">Super Admin</span>
                        )}
                        {!admin.isSuperAdmin && !admin.isRoot && (
                          <span className="role-badge admin">Admin</span>
                        )}
                        {admin.email === user.email && (
                          <span className="role-badge you">You</span>
                        )}
                      </div>
                      <div className="card-actions">
                        {!admin.isRoot && admin.email !== user.email && !admin.isSuperAdmin && (
                          <button onClick={() => handlePromoteAdmin(admin.email)} className="admin-btn primary small">Promote</button>
                        )}
                        {!admin.isRoot && admin.email !== user.email && admin.isSuperAdmin && (
                          <button onClick={() => handleDemoteAdmin(admin.email)} className="admin-btn secondary small">Demote</button>
                        )}
                        {!admin.isRoot && admin.email !== user.email && (
                          <button onClick={() => handleRemoveAdmin(admin.email)} className="admin-btn delete small">Remove</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {adminList.length === 0 && <p className="empty-state">No admins found.</p>}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Admin;
