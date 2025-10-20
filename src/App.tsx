import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Cart } from './pages/Cart';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#0B7A4E] text-xl">Loading...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/cart" element={<Cart />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-3xl font-bold text-[#0B7A4E]">Checkout Coming Soon</h1>
              <p className="text-gray-600 mt-4">This feature is under development</p>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-3xl font-bold text-[#0B7A4E]">Profile Page Coming Soon</h1>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-3xl font-bold text-[#0B7A4E]">Orders Page Coming Soon</h1>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/affiliate"
        element={
          <ProtectedRoute>
            <div className="container mx-auto px-4 py-16 text-center">
              <h1 className="text-3xl font-bold text-[#0B7A4E]">Affiliate Dashboard Coming Soon</h1>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/affiliate-info"
        element={
          <div className="container mx-auto px-4 py-16">
            <h1 className="text-4xl font-bold text-[#0B7A4E] mb-8 text-center">
              Become an Affiliate
            </h1>
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
              <p className="text-gray-700 mb-4">
                Join our affiliate program and earn commission on every sale you refer!
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Earn ₦1,000 per 2kg of Black Soap sold</li>
                <li>Earn ₦1,000 per 1L of Kernel Oil sold</li>
                <li>Get 5% discount for your customers with your code</li>
                <li>Withdraw earnings to your bank account</li>
              </ul>
            </div>
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Layout>
            <AppRoutes />
          </Layout>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
