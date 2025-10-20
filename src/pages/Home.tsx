import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { Product } from '../types';

export const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const products = await api.products.getAll();
        setFeaturedProducts(products.slice(0, 4));
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-r from-[#0B7A4E] to-[#7FC97F] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Welcome to Melodiva Skincare
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Experience the power of nature with our premium black soap and palm kernel oil.
            Healthy skin, naturally.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center bg-white text-[#0B7A4E] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Shop Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#0B7A4E] mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Discover our premium range of natural skincare products
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-300 h-4 w-3/4 mb-2 rounded"></div>
                  <div className="bg-gray-300 h-4 w-1/2 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(product => (
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
                    <h3 className="font-bold text-lg mb-2 text-[#0B7A4E]">
                      {product.name}
                    </h3>
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

          <div className="text-center mt-12">
            <Link
              to="/shop"
              className="inline-flex items-center text-[#0B7A4E] font-bold hover:text-[#7FC97F] transition-colors"
            >
              View All Products
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#0B7A4E] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">
            Become an Affiliate Partner
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-[#7FC97F]">
            Earn commission by sharing Melodiva Skincare with your network.
            Join our affiliate program today!
          </p>
          <Link
            to="/affiliate-info"
            className="inline-block bg-white text-[#0B7A4E] px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-all"
          >
            Learn More
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-[#0B7A4E] mb-12">
            Customer Testimonials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 border-2 border-[#7FC97F]">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#7FC97F] rounded-full mr-4"></div>
                  <div>
                    <h4 className="font-bold text-[#0B7A4E]">Customer Name</h4>
                    <p className="text-sm text-gray-600">Lagos</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700">
                  Amazing products! My skin has never looked better. Highly recommend Melodiva!
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
