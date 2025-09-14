"use client";

import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h1>
          <p className="text-gray-600">ขออภัย มีบางอย่างผิดพลาดในระหว่างการเข้าสู่ระบบ</p>
        </div>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">
              การยืนยันตัวตนล้มเหลว กรุณาลองใหม่อีกครั้ง
            </p>
          </div>
          
          <button
            onClick={() => router.back()}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>ลองใหม่อีกครั้ง</span>
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">หรือ</span>
            </div>
          </div>
          
          <Link href="/">
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200 border border-gray-300 flex items-center justify-center space-x-2">
              <Home className="w-5 h-5" />
              <span>กลับหน้าหลัก</span>
            </button>
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>หากปัญหายังคงอยู่ กรุณาติดต่อฝ่ายสนับสนุน</p>
            <p className="mt-1">GWALK Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}