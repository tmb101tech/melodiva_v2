import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export const Cart: React.FC = () => {
  const { items, updateQuantity, removeFromCart, getSubtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-[#0B7A4E] mb-4">Your Cart is Empty</h1>
        <p className="text-gray-600 mb-8">Add some products to get started!</p>
        <Link
          to="/shop"
          className="inline-block bg-[#0B7A4E] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#095d3c]"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-[#0B7A4E] mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div
              key={item.sku.id}
              className="bg-white rounded-lg shadow-md p-4 flex gap-4"
            >
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0">
                {item.product.images[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg text-[#0B7A4E]">
                  {item.product.name}
                </h3>
                <p className="text-gray-600">{item.sku.size_label}</p>
                <p className="font-bold text-[#0B7A4E] mt-2">
                  ₦{item.sku.price.toLocaleString()}
                </p>

                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.sku.id, item.quantity - 1)}
                      className="p-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.sku.id, item.quantity + 1)}
                      className="p-1 rounded-lg bg-gray-200 hover:bg-gray-300"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.sku.id)}
                    className="ml-auto text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="text-right">
                <p className="font-bold text-lg text-[#0B7A4E]">
                  ₦{(item.sku.price * item.quantity).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
            <h2 className="text-xl font-bold text-[#0B7A4E] mb-4">Order Summary</h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">₦{getSubtotal().toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-500">
                Delivery fee will be calculated at checkout
              </p>
            </div>

            <div className="border-t pt-4 mb-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Subtotal</span>
                <span className="text-[#0B7A4E]">₦{getSubtotal().toLocaleString()}</span>
              </div>
            </div>

            {user ? (
              <Link
                to="/checkout"
                className="block w-full bg-[#0B7A4E] text-white py-3 rounded-lg font-bold text-center hover:bg-[#095d3c] transition-colors"
              >
                Proceed to Checkout
              </Link>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="block w-full bg-[#0B7A4E] text-white py-3 rounded-lg font-bold text-center hover:bg-[#095d3c] transition-colors"
                >
                  Login to Checkout
                </Link>
                <Link
                  to="/signup"
                  className="block w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-bold text-center hover:bg-gray-300 transition-colors"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
