import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-[#0B7A4E] text-white sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-bold">
              Melodiva Skincare
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="hover:text-[#7FC97F] transition-colors">
                Home
              </Link>
              <Link to="/shop" className="hover:text-[#7FC97F] transition-colors">
                Shop
              </Link>
              {user?.isAffiliate && (
                <Link to="/affiliate" className="hover:text-[#7FC97F] transition-colors">
                  Affiliate
                </Link>
              )}
              <Link to="/cart" className="relative hover:text-[#7FC97F] transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#7FC97F] text-[#0B7A4E] w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">
                    {getTotalItems()}
                  </span>
                )}
              </Link>
              {user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 hover:text-[#7FC97F] transition-colors">
                    <User className="w-6 h-6" />
                    <span>{user.fullName.split(' ')[0]}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link to="/profile" className="block px-4 py-2 hover:bg-gray-100">
                      My Profile
                    </Link>
                    <Link to="/orders" className="block px-4 py-2 hover:bg-gray-100">
                      My Orders
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="hover:text-[#7FC97F] transition-colors">
                  Login
                </Link>
              )}
            </nav>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 space-y-2">
              <Link to="/" className="block py-2 hover:text-[#7FC97F]" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/shop" className="block py-2 hover:text-[#7FC97F]" onClick={() => setMobileMenuOpen(false)}>
                Shop
              </Link>
              {user?.isAffiliate && (
                <Link to="/affiliate" className="block py-2 hover:text-[#7FC97F]" onClick={() => setMobileMenuOpen(false)}>
                  Affiliate
                </Link>
              )}
              <Link to="/cart" className="block py-2 hover:text-[#7FC97F]" onClick={() => setMobileMenuOpen(false)}>
                Cart ({getTotalItems()})
              </Link>
              {user ? (
                <>
                  <Link to="/profile" className="block py-2 hover:text-[#7FC97F]" onClick={() => setMobileMenuOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/orders" className="block py-2 hover:text-[#7FC97F]" onClick={() => setMobileMenuOpen(false)}>
                    Orders
                  </Link>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-red-300">
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="block py-2 hover:text-[#7FC97F]" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#0B7A4E] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Melodiva Skincare</h3>
              <p className="text-[#7FC97F]">
                Premium natural skincare products for healthy, glowing skin.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/shop" className="hover:text-[#7FC97F] transition-colors">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link to="/affiliate-info" className="hover:text-[#7FC97F] transition-colors">
                    Become an Affiliate
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7FC97F] transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#7FC97F] transition-colors">
                    Terms & Conditions
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-[#7FC97F] transition-colors">
                  Facebook
                </a>
                <a href="#" className="hover:text-[#7FC97F] transition-colors">
                  Instagram
                </a>
                <a href="#" className="hover:text-[#7FC97F] transition-colors">
                  TikTok
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-[#7FC97F] text-center text-sm">
            <p>&copy; 2024 Melodiva Skincare. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <a
        href="https://wa.me/234"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all hover:scale-110 z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
};
