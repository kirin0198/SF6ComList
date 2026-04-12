"use client";

/**
 * お気に入りトグルボタン
 */

import { Star } from "lucide-react";
import { useState } from "react";

interface FavoriteButtonProps {
  characterId: string;
  initialFavorited: boolean;
  onToggle?: (characterId: string, favorited: boolean) => void;
}

export default function FavoriteButton({
  characterId,
  initialFavorited,
  onToggle,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    setLoading(true);

    try {
      const method = favorited ? "DELETE" : "PUT";
      const res = await fetch(`/api/favorites/characters/${characterId}`, {
        method,
      });

      if (res.ok) {
        const next = !favorited;
        setFavorited(next);
        onToggle?.(characterId, next);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-full p-1 transition-colors ${
        favorited
          ? "text-yellow-400 hover:text-yellow-300"
          : "text-gray-600 hover:text-gray-400"
      }`}
      aria-label={favorited ? "お気に入り解除" : "お気に入りに追加"}
      aria-pressed={favorited}
    >
      <Star size={18} fill={favorited ? "currentColor" : "none"} />
    </button>
  );
}
