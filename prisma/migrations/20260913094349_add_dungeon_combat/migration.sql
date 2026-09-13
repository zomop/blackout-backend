-- CreateEnum
CREATE TYPE "DungeonStatus" AS ENUM ('IN_PROGRESS', 'WON', 'LOST', 'FLED');

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hp" INTEGER NOT NULL DEFAULT 100,
    "max_hp" INTEGER NOT NULL DEFAULT 100,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "max_hp" INTEGER NOT NULL,
    "attack_min" INTEGER NOT NULL,
    "attack_max" INTEGER NOT NULL,
    "xp_reward" INTEGER NOT NULL,

    CONSTRAINT "Monster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DungeonRun" (
    "id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "monster_id" TEXT NOT NULL,
    "player_hp" INTEGER NOT NULL,
    "monster_hp" INTEGER NOT NULL,
    "status" "DungeonStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DungeonRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_user_id_key" ON "Player"("user_id");

-- CreateIndex
CREATE INDEX "DungeonRun_player_id_status_idx" ON "DungeonRun"("player_id", "status");

-- AddForeignKey
ALTER TABLE "DungeonRun" ADD CONSTRAINT "DungeonRun_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DungeonRun" ADD CONSTRAINT "DungeonRun_monster_id_fkey" FOREIGN KEY ("monster_id") REFERENCES "Monster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
