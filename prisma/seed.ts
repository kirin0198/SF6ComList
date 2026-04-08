/**
 * Prisma シードスクリプト
 * プリセットタグ12種を DB に初期投入する
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// プリセットタグ定義（ARCHITECTURE.md 準拠）
const PRESET_TAGS = [
  { id: "preset-bnb", name: "BnB" },
  { id: "preset-corner", name: "画面端" },
  { id: "preset-midscreen", name: "画面中央" },
  { id: "preset-drive-rush", name: "DR" },
  { id: "preset-punish-counter", name: "パニカン始動" },
  { id: "preset-counter-hit", name: "CH始動" },
  { id: "preset-anti-air", name: "対空" },
  { id: "preset-sa1", name: "SA1" },
  { id: "preset-sa2", name: "SA2" },
  { id: "preset-sa3", name: "SA3" },
  { id: "preset-throw", name: "投げ" },
  { id: "preset-od", name: "OD使用" },
] as const;

async function main() {
  console.log("シードデータの投入を開始します...");

  // プリセットタグを upsert（冪等性を確保）
  for (const tag of PRESET_TAGS) {
    await prisma.tag.upsert({
      where: { id: tag.id },
      update: { name: tag.name, isPreset: true },
      create: {
        id: tag.id,
        name: tag.name,
        isPreset: true,
        userId: null,
      },
    });
    console.log(`タグを投入しました: ${tag.name} (${tag.id})`);
  }

  console.log(
    `\nシード完了: プリセットタグ ${PRESET_TAGS.length} 件を投入しました`,
  );
}

main()
  .catch((e) => {
    console.error("シードエラー:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
