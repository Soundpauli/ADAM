import React from 'react';
import { Star } from 'lucide-react';

interface QualityStarsProps {
  rating: number;
  size?: number;
}

const QualityStars: React.FC<QualityStarsProps> = ({ rating, size = 16 }) => {
  const filledStars = Math.round(rating / 20); // Convert 0-100 to 0-5
  
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          size={size} 
          className={i < filledStars ? "text-yellow-500 fill-yellow-500" : "text-gray-300"} 
        />
      ))}
      <span className="ml-2 text-sm font-medium text-gray-700">{rating}%</span>
    </div>
  );
};

export default QualityStars;