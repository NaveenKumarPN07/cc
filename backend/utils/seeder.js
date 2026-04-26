/**
 * Database Seeder
 * Run: npm run seed
 * To destroy: npm run seed -- -d
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config();

import connectDB from '../config/db.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';

const users = [
  {
    name: 'Admin User',
    email: 'admin@ajio.com',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Test User',
    email: 'user@ajio.com',
    password: 'User@123',
    role: 'user',
  },
];

const products = [
  {
    name: 'Slim Fit Casual Shirt',
    description: 'Premium cotton slim fit casual shirt perfect for everyday wear. Features a classic collar and button-down front with modern slim silhouette.',
    price: 1499,
    discountPrice: 899,
    category: 'Men',
    subCategory: 'Shirts',
    brand: 'Arrow',
    images: [
      { url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500', alt: 'Slim Fit Casual Shirt' },
    ],
    sizes: [
      { size: 'S', stock: 10 }, { size: 'M', stock: 15 },
      { size: 'L', stock: 12 }, { size: 'XL', stock: 8 },
    ],
    stock: 45,
    tags: ['shirt', 'casual', 'cotton', 'men'],
    isFeatured: true,
    rating: 4.3,
    numReviews: 124,
  },
  {
    name: 'Women Floral Maxi Dress',
    description: 'Elegant floral maxi dress with flowing silhouette. Perfect for summer outings, brunches, and casual parties. Made from breathable fabric.',
    price: 2499,
    discountPrice: 1499,
    category: 'Women',
    subCategory: 'Dresses',
    brand: 'W',
    images: [
      { url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500', alt: 'Floral Maxi Dress' },
    ],
    sizes: [
      { size: 'XS', stock: 5 }, { size: 'S', stock: 12 },
      { size: 'M', stock: 18 }, { size: 'L', stock: 10 },
    ],
    stock: 45,
    tags: ['dress', 'floral', 'maxi', 'women', 'summer'],
    isFeatured: true,
    rating: 4.6,
    numReviews: 89,
  },
  {
    name: 'Sports Running Shoes',
    description: 'High-performance running shoes with advanced cushioning technology. Lightweight mesh upper provides breathability while the rubber sole ensures excellent grip.',
    price: 3999,
    discountPrice: 2799,
    category: 'Footwear',
    subCategory: 'Running Shoes',
    brand: 'Nike',
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', alt: 'Running Shoes' },
    ],
    sizes: [
      { size: '6', stock: 8 }, { size: '7', stock: 10 },
      { size: '8', stock: 15 }, { size: '9', stock: 12 },
      { size: '10', stock: 6 }, { size: '11', stock: 4 },
    ],
    stock: 55,
    tags: ['shoes', 'running', 'sports', 'nike'],
    isFeatured: true,
    rating: 4.7,
    numReviews: 312,
  },
  {
    name: 'Classic Denim Jeans',
    description: 'Timeless classic fit denim jeans crafted from premium stretch denim. Features five-pocket styling and a versatile mid-rise waistband.',
    price: 2999,
    discountPrice: 1799,
    category: 'Men',
    subCategory: 'Jeans',
    brand: "Levi's",
    images: [
      { url: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=500', alt: 'Classic Denim Jeans' },
    ],
    sizes: [
      { size: '28', stock: 8 }, { size: '30', stock: 15 },
      { size: '32', stock: 20 }, { size: '34', stock: 12 },
      { size: '36', stock: 6 },
    ],
    stock: 61,
    tags: ['jeans', 'denim', 'casual', 'men'],
    isFeatured: false,
    rating: 4.4,
    numReviews: 215,
  },
  {
    name: 'Leather Tote Bag',
    description: 'Sophisticated faux leather tote bag with spacious compartments. Features gold-tone hardware, inner zipper pocket, and magnetic snap closure.',
    price: 1999,
    discountPrice: 1299,
    category: 'Accessories',
    subCategory: 'Bags',
    brand: 'Caprese',
    images: [
      { url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500', alt: 'Leather Tote Bag' },
    ],
    sizes: [{ size: 'One Size', stock: 30 }],
    stock: 30,
    tags: ['bag', 'tote', 'leather', 'women', 'accessories'],
    isFeatured: true,
    rating: 4.2,
    numReviews: 67,
  },
  {
    name: 'Kids Cartoon T-Shirt',
    description: 'Fun and vibrant cartoon print t-shirt for kids. Made from 100% soft cotton, this t-shirt is comfortable for all-day wear and easy to machine wash.',
    price: 599,
    discountPrice: 399,
    category: 'Kids',
    subCategory: 'T-Shirts',
    brand: 'H&M Kids',
    images: [
      { url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500', alt: 'Kids Cartoon T-Shirt' },
    ],
    sizes: [
      { size: '2-3Y', stock: 20 }, { size: '4-5Y', stock: 25 },
      { size: '6-7Y', stock: 18 }, { size: '8-9Y', stock: 15 },
    ],
    stock: 78,
    tags: ['kids', 't-shirt', 'cartoon', 'cotton'],
    isFeatured: false,
    rating: 4.5,
    numReviews: 43,
  },
  {
    name: 'Yoga & Fitness Leggings',
    description: 'High-waist compression leggings designed for yoga, gym, and running. Four-way stretch fabric with moisture-wicking technology for maximum comfort.',
    price: 1799,
    discountPrice: 999,
    category: 'Sports',
    subCategory: 'Activewear',
    brand: 'Puma',
    images: [
      { url: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500', alt: 'Yoga Leggings' },
    ],
    sizes: [
      { size: 'XS', stock: 12 }, { size: 'S', stock: 20 },
      { size: 'M', stock: 25 }, { size: 'L', stock: 18 },
      { size: 'XL', stock: 10 },
    ],
    stock: 85,
    tags: ['leggings', 'yoga', 'sports', 'women', 'fitness'],
    isFeatured: true,
    rating: 4.8,
    numReviews: 189,
  },
  {
    name: 'Wireless Bluetooth Earbuds',
    description: 'Premium true wireless earbuds with active noise cancellation, 30-hour battery life, and IPX5 water resistance. Crystal clear audio with deep bass.',
    price: 4999,
    discountPrice: 2999,
    category: 'Electronics',
    subCategory: 'Audio',
    brand: 'boAt',
    images: [
      { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500', alt: 'Wireless Earbuds' },
    ],
    sizes: [{ size: 'One Size', stock: 50 }],
    stock: 50,
    tags: ['earbuds', 'wireless', 'bluetooth', 'electronics', 'audio'],
    isFeatured: true,
    rating: 4.4,
    numReviews: 528,
  },
];

const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Cart.deleteMany();

    // Create users
    const createdUsers = await User.insertMany(users);
    const adminUser = createdUsers[0]._id;

    // Add admin ref to products
    const productsWithAdmin = products.map((p) => ({ ...p, createdBy: adminUser }));
    await Product.insertMany(productsWithAdmin);

    console.log('✅ Data seeded successfully!');
    console.log('\n📧 Test Credentials:');
    console.log('Admin: admin@ajio.com / Admin@123');
    console.log('User:  user@ajio.com / User@123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await User.deleteMany();
    await Product.deleteMany();
    await Order.deleteMany();
    await Cart.deleteMany();
    console.log('✅ Data destroyed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
