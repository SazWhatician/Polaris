import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-black text-white">
      <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center border border-white/20 mb-6 font-black text-2xl">
        ✦
      </div>
      <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-2">404</h1>
      <p className="text-slate-400 text-sm sm:text-base max-w-md mb-8">
        The academic coordinate you are looking for does not exist or has been shifted in the vector mesh.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-full bg-white text-black font-bold text-xs flex items-center gap-2 hover:bg-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Orbit</span>
      </Link>
    </div>
  );
}
