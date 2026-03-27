import React from 'react';

export default function MahjongLoading({ text = "處理中..." }) {
  const tiles = ['🀄', '🀅', '🀆', '🀫'];
  
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      <div className="flex gap-3">
        {tiles.map((tile, i) => (
          <div 
            key={i} 
            className="text-4xl bg-white border-2 border-black rounded-md shadow-tile w-12 h-16 flex items-center justify-center animate-shuffle"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            {tile}
          </div>
        ))}
      </div>
      <span className="font-black tracking-widest text-black bg-white px-6 py-2 border-2 border-black rounded-md shadow-brutal-sm">
        {text}
      </span>
    </div>
  );
}