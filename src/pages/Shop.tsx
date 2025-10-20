import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Product } from '../types';

export const Shop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await api.products.getAll();
        setProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (category === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === category));
    }
  }, [category, products]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-[#0B7A4E] mb-8">Shop Our Products</h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setCategory('all')}
          className={`px-6 py-2 rounded-full font-semibold transition-colors ${
            category === 'all'
              ? 'bg-[#0B7A4E] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Products
        </button>
        <button
          onClick={() => setCategory('BLACK_SOAP')}
          className={`px-6 py-2 rounded-full font-semibold transition-colors ${
            category === 'BLACK_SOAP'
              ? 'bg-[#0B7A4E] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Black Soap
        </button>
        <button
          onClick={() => setCategory('KERNEL_OIL')}
          className={`px-6 py-2 rounded-full font-semibold transition-colors ${
            category === 'KERNEL_OIL'
              ? 'bg-[#0B7A4E] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Kernel Oil
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
              <div className="bg-gray-300 h-4 w-3/4 mb-2 rounded"></div>
              <div className="bg-gray-300 h-4 w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all transform hover:scale-105"
            >
              <div className="aspect-square bg-gray-200 relative">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2 text-[#0B7A4E]">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
                {product.skus && product.skus.length > 0 && (
                  <p className="text-[#0B7A4E] font-bold">
                    From ₦{Math.min(...product.skus.map(s => s.price)).toLocaleString()}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found in this category.</p>
        </div>
      )}
    </div>
  );
};
