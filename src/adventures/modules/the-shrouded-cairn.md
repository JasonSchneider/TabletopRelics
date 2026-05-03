---
id: the-shrouded-cairn
title: The Shrouded Cairn
relic: compass
kind: intro
level: 1-3
partySize: 3-5
duration: 1 session
tags: [introduction, dungeon, mystery, low-fantasy]
summary: A brass compass washes up on the beach, its needle pointing inland — toward a fog-bound hill that has not appeared on any map for a hundred years.
---

## Overview

This is a one-session adventure designed to introduce the **Magic Compass** to your players. The compass is found in the opening scene and learns its first "song" — a single quest-bearing pulse — by the end. After this adventure, the players will understand that the compass remembers, and can be taught.

The hook is portable: drop it into any seaside village, riverside town, or fishing camp where the party might find a strange object on the shore.

> Read aloud:
> The tide leaves more than driftwood this morning. Tangled in a coil of kelp at your feet, a brass instrument blinks back the dawn light — a compass, salt-crusted and old, its needle trembling against its glass with a vigor it should not have. As you watch, it stops. It points inland, toward the bluffs above the village, where a low hill rests beneath a quilt of unmoving fog.

*When the compass is first found, set it to ambient mode so the needle tracks north naturally.* [Ambient — needle tracks north](action:compass.setMode?mode=ambient)

## Hooks for the DM

The compass should feel **alive** but not communicative. It points. It pulses faintly when the bearer faces the right direction. That is the entire vocabulary it has, for now. Resist the urge to translate.

If the party hesitates to follow it, give them a local rumor: an old woman at the dock says her grandmother spoke of a hill that "comes back when something is owed."

## Scene 1 — The Bluffs

A path of crushed shell winds up from the village. As the party climbs, the fog refuses to lift — it parts only enough to admit them, then closes behind. The compass pulses twice, faintly, when they reach the cairn at the hill's crown. [Compass pulses faintly](action:compass.setMode?mode=pulse) [Set slow speed](action:compass.setSpeed?speed=18)

**The Cairn.** A waist-high spiral of mossy stones, undisturbed but for a single capstone tilted ajar. Beneath it, a narrow shaft drops straight into the earth.

| Skill check | DC | Reveals |
| --- | --- | --- |
| Investigation | 12 | Iron rungs, recently polished. Someone descends here regularly. |
| Perception | 14 | A child's wooden bead, fresh, caught in the moss. |
| History | 15 | The cairn-spiral pattern is older than any local memory; pre-imperial. |

## Scene 2 — The Long Stair

The shaft descends seventy feet to a flagged hall where the air is dry and warm despite the season. Sconces are lit but burn no fuel. The compass leads the party down the left passage; the right passage leads to a flooded chamber and is a red herring, useful only for tension.

*As the party descends, the compass needle swings purposefully left at every junction — switch to quest mode and point it down the correct passage.* [Point the way — left passage](action:compass.setTarget?bearing=270) [Switch to quest mode](action:compass.setMode?mode=quest)

> Read aloud (when they enter the hall):
> Your footsteps strike the stone, and somewhere far below, a single drop of water answers — once, then never again. The torches in the sconces burn straight up, untroubled by any draft, as though the air here has agreed to be still.

**Encounter — The Stewards.** Two animated brass figures the size of tall children stand at the first junction. They will not attack unless attacked, but they will not let the party past without **the right answer to a single question**: "What did you carry here?" The correct answer is *the compass* — speaking it, holding it up, or simply meeting their gaze with the compass exposed all suffice.

If the party fights, the stewards have **AC 15, HP 22, +4 to hit, 1d8+2 bludgeoning**, and resistance to non-magical weapons. Killing them seals the rest of the cairn for a generation; this is a story consequence, not a combat fail-state.

## Scene 3 — The Reliquary

The compass points to a chamber whose floor is one great inlay of rune-stone. At its center, a stone plinth holds a second compass — identical to the first, but its needle has rusted in place, pointing nowhere.

> Read aloud:
> The compass in your hand pulses, slow and steady, the way a sleeping animal breathes. The one on the plinth does nothing. Between them, the air grows briefly warm.

*Trigger a slow amber pulse as they enter the reliquary.* [Slow amber pulse](action:compass.setColor?r=212&g=160&b=40) [Begin pulsing](action:compass.setMode?mode=pulse) [Set slow speed](action:compass.setSpeed?speed=15)

**The Trade.** The compass on the plinth is the *original*. The party's compass is its child — or its echo. They can:

1. **Leave the original.** The party's compass takes one slow, deliberate pulse, and from now on it will faintly pulse whenever the party is within a mile of *something owed* (DM's discretion — a debt, an unfulfilled oath, a lost thing). [Slow single pulse, then ambient](action:compass.setMode?mode=ambient)

2. **Take the original.** The original crumbles to copper dust the moment it leaves the plinth. The party's compass goes still for one full day, then resumes — but it now points to whatever the bearer most regrets having lost. Useful, painful, and a stronger story hook. [Compass goes still](action:compass.setMode?mode=off)

3. **Leave both.** The hill releases them. The compass returns to the cairn. They can come back for it — but the hill may not. [Return to ambient](action:compass.setMode?mode=ambient)

## Aftermath

Whatever the party chose, when they return to the surface, the fog has lifted and the cairn has slumped. Locals will swear the hill was never bare; they remember it with the fog. Only the party remembers.

The compass is now bonded to the bearer. From here on, you can use the **`compass.setTarget`** command from the relic drawer to make the prop point wherever the story needs it to point — toward a clue, an enemy, a moral choice. The players will assume it is the compass speaking. You will know better.

*Seal the moment: give the compass a warm gold glow as the party emerges into sunlight.* [Gold glow — bonded](action:compass.setColor?r=212&g=175&b=55) [Switch to manual](action:compass.setMode?mode=manual)

## Adapting

- **Lower magic settings:** Replace the brass stewards with a single living guardian (a fox, a child, a mute monk) who tests the party with a riddle.
- **Higher magic settings:** The original compass is part of a set of seven; finding the others becomes a campaign arc.
- **Horror tone:** The cairn is a trap. The compass is bait. Whoever takes it owes a debt that comes due in three sessions.
