import Link from 'next/link';
import { Users } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-slate-800 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/shows" className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-7 w-7" />
          ShowBooker
        </Link>
        <ul className="flex space-x-4">
          <li>
            <Link href="/shows" className="hover:text-blue-300 transition-colors">
              Shows
            </Link>
          </li>
          <li>
            <Link href="/seating-arrangement" className="hover:text-blue-300 transition-colors">
              Seating Designer
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
