import React, { useState } from 'react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    queryType: '',
    name: '',
    organization: '',
    phone: '',
    email: '',
    message: '',
    honeypot: ''
  });
  
  const [status, setStatus] = useState({ loading: false, success: false, error: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: '' });

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus({ loading: false, success: true, error: '' });
        setFormData({
          queryType: '', name: '', organization: '', phone: '', email: '', message: '', honeypot: ''
        });
        setTimeout(() => setStatus(prev => ({ ...prev, success: false })), 5000);
      } else {
        setStatus({ loading: false, success: false, error: data.error || 'Failed to send message.' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus({ loading: false, success: false, error: 'Network error. Please try again later.' });
    }
  };

  return (
    <div className="contact-page-wrapper fade-in">
      {/* Left Side */}
      <div className="contact-left">
        <div className="contact-left-content">
          <span className="subtitle-small">GET IN TOUCH</span>
          <h1 className="contact-heading">
            Connect <br />
            <span className="italic-text">with us.</span>
          </h1>
          <p className="contact-description">
            Want to join, sponsor us, or send a meme?<br />
            Write to us.
          </p>

          <hr className="contact-divider" />

          <div className="contact-info-row">
            <span className="info-label">EMAIL</span>
            <a href="mailto:teamrotorfpv@vit.ac.in" className="info-value">
              teamrotorfpv@vit.ac.in
            </a>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="contact-right">
        <div className="contact-right-content glass-form-card">
          <form className="contact-form" onSubmit={handleSubmit}>
            
            {/* Honeypot field - hidden from users but bots will fill it */}
            <div style={{ display: 'none' }}>
              <label>Leave this field blank</label>
              <input type="text" name="honeypot" value={formData.honeypot} onChange={handleChange} tabIndex="-1" autoComplete="off" />
            </div>

            <div className="form-group">
              <label>Query Type <span className="required">*</span></label>
              <select name="queryType" value={formData.queryType} onChange={handleChange} required>
                <option value="" disabled>Select a query type</option>
                <option value="General Query">General Query</option>
                <option value="Partnership">Partnership</option>
                <option value="Feedback">Feedback</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>Name <span className="required">*</span></label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" required />
            </div>

            {formData.queryType === 'Partnership' && (
              <div className="form-group">
                <label>Organization Name</label>
                <input type="text" name="organization" value={formData.organization} onChange={handleChange} placeholder="Your Organization" />
              </div>
            )}

            <div className="form-group">
              <label>Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Your Phone Number" />
            </div>

            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Your Email" required />
            </div>

            <div className="form-group">
              <label>Additional Details <span className="required">*</span></label>
              <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Enter details here..." rows="4" required maxLength="2000"></textarea>
            </div>

            {status.error && <div className="form-error-message" style={{ color: '#ff4d4d', marginBottom: '1rem', fontSize: '0.9rem' }}>{status.error}</div>}
            {status.success && <div className="form-success-message" style={{ color: '#4caf50', marginBottom: '1rem', fontSize: '0.9rem' }}>Message sent successfully! We'll get back to you soon.</div>}

            <button type="submit" className="submit-btn" disabled={status.loading}>
              {status.loading ? 'Sending...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
