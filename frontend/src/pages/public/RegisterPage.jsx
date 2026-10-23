import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2)
      e.name = 'Name must be at least 2 characters';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Valid email is required';
    if (!form.password || form.password.length < 8)
      e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        role: 'civilian',      // Registration always creates Civilian
      });
      toast.success('Account created! Welcome to the platform.');
      navigate('/civilian/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (!err.response
          ? 'Cannot connect to server. Please ensure the backend is running on http://localhost:5001.'
          : 'Registration failed. Please try again.');
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-emergency/20 border border-emergency/30 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-emergency" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-200 uppercase tracking-wide">DISASTER RESPONSE</p>
            <p className="text-xs text-gray-600">Civilian Registration</p>
          </div>
        </div>

        {/* Card */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-100 mb-1">Create account</h2>
          <p className="text-xs text-gray-500 mb-6">
            Register to submit disaster reports and track incidents in your area.
          </p>

          {errors.general && (
            <div className="alert-critical mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="register-form" className="space-y-4">
            {/* Name */}
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">Full name</label>
              <input
                id="reg-name"
                type="text"
                className={`form-input ${errors.name ? 'border-emergency' : ''}`}
                placeholder="Your full name"
                value={form.name}
                onChange={update('name')}
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Email address</label>
              <input
                id="reg-email"
                type="email"
                className={`form-input ${errors.email ? 'border-emergency' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={update('email')}
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Password</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPwd ? 'text' : 'password'}
                  className={`form-input pr-9 ${errors.password ? 'border-emergency' : ''}`}
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={update('password')}
                />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>

            {/* Confirm */}
            <div className="form-group">
              <label htmlFor="reg-confirm" className="form-label">Confirm password</label>
              <input
                id="reg-confirm"
                type={showPwd ? 'text' : 'password'}
                className={`form-input ${errors.confirmPassword ? 'border-emergency' : ''}`}
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
              />
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
            </div>

            {/* Role notice */}
            <div className="alert-info-box text-xs">
              Account type: <strong>Civilian</strong> — to request Responder or higher access, contact your administrator.
            </div>

            <Button type="submit" variant="primary" loading={loading} className="w-full justify-center py-2">
              Create account
            </Button>
          </form>

          <p className="text-xs text-gray-600 text-center mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-info-light hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
