import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-8 border-t border-gray-200 bg-white">
      <div className="container flex flex-col items-center justify-between gap-4 px-6 mx-auto md:flex-row">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 font-bold text-white bg-green-600 rounded-md text-xs">
            M
          </div>
          <span className="text-sm font-semibold text-gray-900">Membrane</span>
        </div>
        
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Membrane. All rights reserved.
        </p>
        
        <nav className="flex gap-6">
          <Link href="/docs" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Documentation
          </Link>
          <Link href="/console" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            Console
          </Link>
        </nav>
      </div>
    </footer>
  );
}