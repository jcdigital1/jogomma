import { emptyInput } from '../shared/combatEngine.ts';
import { AIDifficulty, FighterInput, MatchState } from '../shared/types.ts';

export class AIController {
  private decisionTimer = 0;
  private strafeDir = 1;
  private burstTicks = 0;
  private burstAction: keyof FighterInput | null = null;
  private counterCooldown = 0;

  public computeInput(
    state: MatchState,
    aiSlot: 0 | 1,
    difficulty: AIDifficulty,
    dt: number,
  ): FighterInput {
    const inp = emptyInput();
    if (state.phase !== 'fighting') return inp;

    const ai = state.fighters[aiSlot];
    const opp = state.fighters[aiSlot === 0 ? 1 : 0];
    const dx = opp.x - ai.x;
    const dz = opp.z - ai.z;
    const dist = Math.hypot(dx, dz) || 0.001;
    const nx = dx / dist;
    const nz = dz / dist;
    const latX = -nz;
    const latZ = nx;

    this.decisionTimer -= dt;
    this.counterCooldown = Math.max(0, this.counterCooldown - dt);

    const reactSpeed =
      difficulty === 'hard' ? 0.13 : difficulty === 'normal' ? 0.21 : 0.36;
    const aggression =
      difficulty === 'hard' ? 0.86 : difficulty === 'normal' ? 0.68 : 0.42;

    // Ground fighting AI
    if (ai.posture === 'ground_top') {
      if (ai.activeMove === 'submission_attempt') {
        inp.takedown = true;
        return inp;
      }
      if (this.decisionTimer <= 0) {
        this.decisionTimer = reactSpeed * 1.3;
        if ((opp.health < 45 || opp.stamina < 30) && Math.random() < 0.5) {
          inp.takedown = true; // Submission attempt
        } else {
          inp.punch = true; // Ground & Pound
        }
      }
      return inp;
    }

    if (ai.posture === 'ground_bottom') {
      if (opp.activeMove === 'submission_attempt') {
        inp.dodge = Math.random() < 0.65;
        inp.moveX = Math.sin(state.tickCount * 0.45);
        inp.moveZ = Math.cos(state.tickCount * 0.45);
        return inp;
      }
      inp.block = Math.random() < 0.72;
      if (this.decisionTimer <= 0) {
        this.decisionTimer = reactSpeed * 1.8;
        if (Math.random() < 0.6) {
          inp.dodge = true; // Stand up scramble
        }
      }
      return inp;
    }

    // Clinch AI
    if (ai.posture === 'clinch') {
      if (this.decisionTimer <= 0) {
        this.decisionTimer = reactSpeed * 1.2;
        const r = Math.random();
        if (r < 0.38) inp.kick = true; // Knee
        else if (r < 0.68) inp.heavyPunch = true; // Elbow
        else if (r < 0.86) inp.takedown = true; // Takedown from clinch
        else inp.dodge = true; // Break clinch
      }
      return inp;
    }

    // Standing AI: Active Counter-Strike immediately when counterWindow opens
    if (
      ai.counterWindow > 0.08 &&
      this.counterCooldown <= 0 &&
      dist < 1.55 &&
      ai.stamina > 12 &&
      ai.activeMove === 'none'
    ) {
      const counterProb =
        difficulty === 'hard' ? 0.88 : difficulty === 'normal' ? 0.6 : 0.25;
      this.counterCooldown = 0.45;
      if (Math.random() < counterProb) {
        if (Math.random() < 0.48) {
          inp.heavyPunch = true;
        } else {
          inp.punch = true;
          this.burstTicks = 1;
          this.burstAction = 'heavyPunch';
        }
        inp.moveX = nx * 0.65;
        inp.moveZ = nz * 0.65;
        return inp;
      }
    }

    // Standing AI: Check incoming opponent strike to block or slip
    const oppAttacking =
      opp.activeMove !== 'none' &&
      opp.activeMove !== 'dodge_left' &&
      opp.activeMove !== 'dodge_right' &&
      opp.activeMove !== 'dodge_back';

    if (oppAttacking && dist < 1.8) {
      const defChance =
        difficulty === 'hard' ? 0.84 : difficulty === 'normal' ? 0.64 : 0.36;
      if (Math.random() < defChance) {
        const slipChance =
          difficulty === 'hard' ? 0.38 : difficulty === 'normal' ? 0.26 : 0.12;
        if (Math.random() < slipChance && ai.stamina > 22) {
          inp.dodge = true;
          inp.moveX = this.strafeDir;
        } else {
          inp.block = true;
          // Hold back for low kicks / takedowns
          if (opp.activeMove === 'low_kick' || opp.activeMove === 'takedown_attempt') {
            inp.moveX = -nx * 0.55;
            inp.moveZ = -nz * 0.55;
          }
        }
        return inp;
      }
    }

    // Execute queued burst combo
    if (this.burstTicks > 0 && this.burstAction) {
      this.burstTicks -= 1;
      (inp[this.burstAction] as boolean) = true;
      inp.moveX = nx * 0.7;
      inp.moveZ = nz * 0.7;
      return inp;
    }

    // Spacing & Footwork
    const desiredDist = ai.stamina < 24 ? 2.15 : 1.18;
    if (dist > desiredDist + 0.2) {
      inp.moveX = nx * 0.92 + latX * this.strafeDir * 0.35;
      inp.moveZ = nz * 0.92 + latZ * this.strafeDir * 0.35;
    } else if (dist < desiredDist - 0.22) {
      inp.moveX = -nx * 0.75 + latX * this.strafeDir * 0.55;
      inp.moveZ = -nz * 0.75 + latZ * this.strafeDir * 0.55;
    } else {
      inp.moveX = latX * this.strafeDir * 0.72;
      inp.moveZ = latZ * this.strafeDir * 0.72;
    }

    // Tactical offense decisions
    if (this.decisionTimer <= 0) {
      this.decisionTimer = reactSpeed * (0.75 + Math.random() * 0.65);
      if (Math.random() < 0.38) this.strafeDir *= -1;

      if (ai.stamina > 16 && dist < 1.65 && Math.random() < aggression) {
        const r = Math.random();
        if (dist < 1.05 && r < 0.14) {
          inp.clinch = true;
        } else if (
          dist < 1.38 &&
          ((opp.stamina < 30 && r < 0.32) ||
            (ai.profileId === 'charles' && r < 0.25))
        ) {
          inp.takedown = true;
        } else if (r < 0.5) {
          inp.punch = true;
          this.burstTicks = difficulty === 'hard' ? 2 : 1;
          this.burstAction = Math.random() < 0.55 ? 'heavyPunch' : 'kick';
        } else if (r < 0.7) {
          inp.kick = true;
        } else if (r < 0.88) {
          inp.heavyPunch = true;
        } else {
          inp.highKick = true;
        }
      }
    }

    return inp;
  }
}
