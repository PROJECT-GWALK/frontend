"use client";

import React from 'react';
import { Star, Check, Mail, Laptop } from 'lucide-react';
import { Navbar } from '@/components/user/landingnav';
import Link from 'next/link';
import Image from 'next/image';
// import { Navbar } from '@/components/user/navbar';


const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      
      {/* <Navbar /> */}
      <Navbar />

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Connect, Explore, and Experience with{' '}
                <span className="text-orange-500">Gwalk</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Create your own events and join the events that interest you. 
                Discover new experiences, meet like-minded people, and build 
                lasting connections in your community.
              </p>
              <Link href="/sign-in">
              <button className="inline-flex items-center px-8 py-4 bg-green-500 text-white text-lg font-semibold rounded-xl hover:bg-green-600 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                Get Started
              </button>
              </Link>
            </div>

            {/* Right Content - Image Area */}
            <div className="relative">
              {/* Main Image Container */}
              
                {/* Placeholder for your image */}
                <div className="aspect-[4/3] bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <div className="text-center text-white">
                    <Image
                    src="/gwalk-icon.svg" 
                    alt="Gwalk App"
                    width={300}  
                    height={225} 
                    className="w-full h-auto object-contain" 
                  />
                  </div>
                </div>
              

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 z-20">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-bounce">
                  <Star className="h-8 w-8" />
                </div>
              </div>

              <div className="absolute top-1/2 -right-6 z-20">
                <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Check className="h-7 w-7" />
                </div>
              </div>

              <div className="absolute -bottom-6 left-8 z-20">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg animate-bounce [animation-delay:1s]">
                  <Mail className="h-6 w-6" />
                </div>
              </div>

              {/* Background Decorative Elements */}
              <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute bottom-16 right-16 w-16 h-16 bg-pink-400 rounded-full opacity-20 animate-pulse [animation-delay:2s]"></div>
              <div className="absolute top-1/3 left-0 w-8 h-8 bg-purple-400 rounded-full opacity-30 animate-bounce [animation-delay:1.5s]"></div>
            </div>
          </div>
        </div>
      </main>

      

      
      
    </div>
  );
};

export default LandingPage;