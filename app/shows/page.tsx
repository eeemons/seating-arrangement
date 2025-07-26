"use client";
import { shows } from '@/data/shows';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function ShowsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Currently Running Shows</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {shows.map(show => (
          <Link href={`/shows/${show.id}`} key={show.id}>
            <Card className="overflow-hidden transform hover:scale-105 transition-transform duration-300">
              <img src={show.image} alt={show.name} className="w-full h-64 object-cover" />
              <CardContent className="p-4">
                <h2 className="text-2xl font-bold mb-2">{show.name}</h2>
                <p className="text-gray-600">{show.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

