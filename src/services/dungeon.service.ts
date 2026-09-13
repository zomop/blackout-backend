// This file contains the ACTUAL COMBAT LOGIC.
// The client only ever says "I attack" or "I flee" — the server decides
// what happens (damage numbers, who wins) and that's the only truth.

import { prisma } from "../prisma/client";

export class DungeonError extends Error {}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getOrCreatePlayer(userId: string) {
  let player = await prisma.player.findUnique({ where: { user_id: userId } });
  if (!player) {
    player = await prisma.player.create({ data: { user_id: userId } });
  }
  return player;
}

export async function startDungeon(userId: string) {
  const player = await getOrCreatePlayer(userId);

  const existingRun = await prisma.dungeonRun.findFirst({
    where: { player_id: player.id, status: "IN_PROGRESS" },
  });
  if (existingRun) {
    throw new DungeonError("You are already in a dungeon run.");
  }

  const monster = await prisma.monster.findFirst();
  if (!monster) {
    throw new DungeonError("No monsters exist yet. Add one in Prisma Studio.");
  }

  const run = await prisma.dungeonRun.create({
    data: {
      player_id: player.id,
      monster_id: monster.id,
      player_hp: player.hp,
      monster_hp: monster.max_hp,
      status: "IN_PROGRESS",
    },
    include: { monster: true },
  });

  return {
    runId: run.id,
    monster: { name: run.monster.name, hp: run.monster_hp, maxHp: run.monster.max_hp },
    player: { hp: run.player_hp, maxHp: player.max_hp },
    log: [`A wild ${run.monster.name} appears!`],
  };
}

export async function performAction(userId: string, action: "attack" | "flee") {
  const player = await getOrCreatePlayer(userId);

  const run = await prisma.dungeonRun.findFirst({
    where: { player_id: player.id, status: "IN_PROGRESS" },
    include: { monster: true },
  });
  if (!run) {
    throw new DungeonError("No active dungeon run. Start one first.");
  }

  const log: string[] = [];
  let playerHp = run.player_hp;
  let monsterHp = run.monster_hp;
  let status: "IN_PROGRESS" | "WON" | "LOST" | "FLED" = "IN_PROGRESS";

  if (action === "flee") {
    const fleeSucceeds = Math.random() < 0.5;
    if (fleeSucceeds) {
      status = "FLED";
      log.push("You fled from the battle.");
    } else {
      log.push("You failed to flee!");
      const damage = randomInt(run.monster.attack_min, run.monster.attack_max);
      playerHp = Math.max(0, playerHp - damage);
      log.push(`${run.monster.name} hits you for ${damage} damage.`);
      if (playerHp === 0) {
        status = "LOST";
        log.push("You have been defeated...");
      }
    }
  } else {
    const playerDamage = randomInt(5, 15);
    monsterHp = Math.max(0, monsterHp - playerDamage);
    log.push(`You hit ${run.monster.name} for ${playerDamage} damage.`);

    if (monsterHp === 0) {
      status = "WON";
      log.push(`You defeated ${run.monster.name}!`);
    } else {
      const monsterDamage = randomInt(run.monster.attack_min, run.monster.attack_max);
      playerHp = Math.max(0, playerHp - monsterDamage);
      log.push(`${run.monster.name} hits you for ${monsterDamage} damage.`);
      if (playerHp === 0) {
        status = "LOST";
        log.push("You have been defeated...");
      }
    }
  }

  await prisma.dungeonRun.update({
    where: { id: run.id },
    data: { player_hp: playerHp, monster_hp: monsterHp, status },
  });

  let xpGained = 0;
  let leveledUp = false;
  let finalMaxHp = player.max_hp;
  let finalLevel = player.level;

  if (status === "WON") {
    xpGained = run.monster.xp_reward;
    let newXp = player.xp + xpGained;
    let newLevel = player.level;
    let newMaxHp = player.max_hp;

    while (newXp >= newLevel * 100) {
      newXp -= newLevel * 100;
      newLevel += 1;
      newMaxHp += 10;
      leveledUp = true;
    }

    await prisma.player.update({
      where: { id: player.id },
      data: { hp: newMaxHp, xp: newXp, level: newLevel, max_hp: newMaxHp },
    });

    log.push(`You gained ${xpGained} XP.`);
    if (leveledUp) {
      log.push(`Level up! You are now level ${newLevel}. Max HP increased to ${newMaxHp}.`);
    }

    playerHp = newMaxHp;
    finalMaxHp = newMaxHp;
    finalLevel = newLevel;
  } else if (status === "LOST" || status === "FLED") {
    await prisma.player.update({
      where: { id: player.id },
      data: { hp: playerHp },
    });
  }

  return {
    status,
    player: { hp: playerHp, maxHp: finalMaxHp, level: finalLevel },
    monster: { name: run.monster.name, hp: monsterHp, maxHp: run.monster.max_hp },
    xpGained,
    leveledUp,
    log,
  };
}