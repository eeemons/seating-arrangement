"use client";

import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface ShowDetailsClientProps {
  show: {
    id: number;
    name: string;
    description: string;
    image: string;
    timings: string[];
  };
}

export default function ShowDetailsClient({ show }: ShowDetailsClientProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img src={show.image} alt={show.name} className="w-full h-auto object-cover rounded-lg" />
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-4">{show.name}</h1>
          <p className="text-lg text-gray-600 mb-8">{show.description}</p>
          <h2 className="text-2xl font-bold mb-4">Timings</h2>
          <div className="grid grid-cols-2 gap-4">
            {show.timings.map(timing => (
              <Link href="/seating-arrangement" key={timing}>
                <Card className="p-4 text-center transform hover:scale-105 transition-transform duration-300">
                  {timing}
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
