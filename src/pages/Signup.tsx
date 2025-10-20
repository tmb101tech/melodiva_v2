import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { StateCity } from '../types';

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
    securityQuestion: '',
    securityAnswer: '',
    address: '',
    state: '',
    city: ''
  });
  const [statesCities, setStatesCities] = useState<StateCity[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadStatesCities = async () => {
      try {
        const data = await api.getStatesCities();
        setStatesCities(data);
      } catch (error) {
        console.error('Failed to load states/cities:', error);
      }
    };
    loadStatesCities();
  }, []);

  useEffect(() => {
    const selectedState = statesCities.find(s => s.name === formData.state);
    setCities(selectedState?.cities || []);
    setFormData(prev => ({ ...prev, city: '' }));
  }, [formData.state, statesCities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await signup(formData);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-[#0B7A4E] mb-6 text-center">Create Account</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B7A4E]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B7A4E]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B7A4E]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">WhatsApp</label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B7A4E]"
                placeholder="Same as phone if empty"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B7A4E]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B7A4E]"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-semibold mb-2">Security Question *</label>
              <select
                value={formData.securityQuestion}
                onChange={(e) => setFormData({ ...formData, securityQuestion: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B7A4E]"
                required
              >
                <option value="">Select a question</option>
                <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                <option value="What was your first pet's name?">What was your first pet's name?</option>
                <option value="What city were you born in?">What city were you born in?</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-semibold mb-2">Security Answer *</label>
              <input
                type="text"
                value={formData.securityAnswer}
                onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B7A4E]"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 font-semibold mb-2">Address *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B7A4E]"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">State *</label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B7A4E]"
                required
              >
                <option value="">Select state</option>
                {statesCities.map(state => (
                  <option key={state.name} value={state.name}>{state.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">City *</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B7A4E]"
                required
                disabled={!formData.state}
              >
                <option value="">Select city</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0B7A4E] text-white py-3 rounded-lg font-bold hover:bg-[#095d3c] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-[#0B7A4E] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
