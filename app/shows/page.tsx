"use client";
import { shows } from '@/data/shows';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

export default function ShowsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-10 text-gray-800">Now Showing</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {shows.map(show => (
          <Link href={`/shows/${show.id}`} key={show.id} className="block">
            <Card className="overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1">
              <div className="relative w-full h-48">
                <Image
                  src={show.image}
                  alt={show.name}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-t-lg"
                />
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-semibold text-gray-900 truncate">{show.name}</CardTitle>
                <CardDescription className="text-sm text-gray-600 line-clamp-2">{show.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2 mt-2">
                  {show.timings.map(timing => (
                    <Badge key={timing} variant="secondary" className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {timing}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}