"use client";

/**
 * キャラクター一覧のクライアント側コンポーネント
 * 表示切替・ソート・お気に入り状態を管理する
 */

import { useState, useMemo, useCallback, useSyncExternalStore } from "react";
import type { Character } from "@/lib/characters";
import CharacterCard from "./CharacterCard";
import ViewToggle, { type ViewMode } from "./ViewToggle";
import SortSelector, { type SortKey } from "./SortSelector";

interface CharacterListClientProps {
  characters: Character[];
  comboCountMap: Record<string, number>;
  initialFavoriteIds: string[];
  isLoggedIn: boolean;
}

const VIEW_MODE_KEY = "sf6combo-view-mode";
const SORT_KEY_KEY = "sf6combo-sort-key";

function useLocalStorage<T extends string>(key: string, fallback: T, validate: (v: string) => v is T): T {
  const subscribe = useCallback(
    (cb: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key) cb();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    [key],
  );
  const getSnapshot = useCallback(() => {
    const v = localStorage.getItem(key);
    return v !== null && validate(v) ? v : fallback;
  }, [key, fallback, validate]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const isViewMode = (v: string): v is ViewMode => v === "grid" || v === "list";
const isSortKey = (v: string): v is SortKey => v === "default" || v === "name" || v === "comboCount";

export default function CharacterListClient({
  characters,
  comboCountMap,
  initialFavoriteIds,
  isLoggedIn,
}: CharacterListClientProps) {
  const viewMode = useLocalStorage<ViewMode>(VIEW_MODE_KEY, "grid", isViewMode);
  const sortKey = useLocalStorage<SortKey>(SORT_KEY_KEY, "default", isSortKey);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(
    () => new Set(initialFavoriteIds),
  );

  // 設定変更時に localStorage へ保存（useSyncExternalStore が変更を検知）
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    localStorage.setItem(VIEW_MODE_KEY, mode);
    window.dispatchEvent(new StorageEvent("storage", { key: VIEW_MODE_KEY }));
  }, []);

  const handleSortKeyChange = useCallback((key: SortKey) => {
    localStorage.setItem(SORT_KEY_KEY, key);
    window.dispatchEvent(new StorageEvent("storage", { key: SORT_KEY_KEY }));
  }, []);

  const handleFavoriteToggle = useCallback(
    (characterId: string, favorited: boolean) => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (favorited) {
          next.add(characterId);
        } else {
          next.delete(characterId);
        }
        return next;
      });
    },
    [],
  );

  // ソート済みキャラクターリスト
  const sortedCharacters = useMemo(() => {
    const sorted = [...characters];

    // ソート条件に基づいて並び替え
    if (sortKey === "name") {
      sorted.sort((a, b) => a.displayName.localeCompare(b.displayName, "ja"));
    } else if (sortKey === "comboCount") {
      sorted.sort(
        (a, b) => (comboCountMap[b.id] ?? 0) - (comboCountMap[a.id] ?? 0),
      );
    }

    // お気に入りを先頭に固定
    if (favoriteIds.size > 0) {
      sorted.sort((a, b) => {
        const aFav = favoriteIds.has(a.id) ? 0 : 1;
        const bFav = favoriteIds.has(b.id) ? 0 : 1;
        return aFav - bFav;
      });
    }

    return sorted;
  }, [characters, comboCountMap, sortKey, favoriteIds]);

  return (
    <div>
      {/* ツールバー */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">キャラクター一覧</h1>
        <div className="flex items-center gap-3">
          <SortSelector sortKey={sortKey} onChange={handleSortKeyChange} />
          <ViewToggle mode={viewMode} onChange={handleViewModeChange} />
        </div>
      </div>

      {/* キャラクターグリッド / リスト */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {sortedCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              comboCount={comboCountMap[character.id] ?? 0}
              viewMode="grid"
              favorited={favoriteIds.has(character.id)}
              onFavoriteToggle={isLoggedIn ? handleFavoriteToggle : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedCharacters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              comboCount={comboCountMap[character.id] ?? 0}
              viewMode="list"
              favorited={favoriteIds.has(character.id)}
              onFavoriteToggle={isLoggedIn ? handleFavoriteToggle : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
