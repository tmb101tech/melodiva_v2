import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Sku } from '../types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, sku: Sku, quantity: number) => void;
  removeFromCart: (skuId: string) => void;
  updateQuantity: (skuId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, sku: Sku, quantity: number) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.sku.id === sku.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.sku.id === sku.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevItems, { product, sku, quantity }];
    });
  };

  const removeFromCart = (skuId: string) => {
    setItems(prevItems => prevItems.filter(item => item.sku.id !== skuId));
  };

  const updateQuantity = (skuId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(skuId);
      return;
    }
    setItems(prevItems =>
      prevItems.map(item =>
        item.sku.id === skuId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + item.sku.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getSubtotal
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
