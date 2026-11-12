import { emptyInput } from '../shared/combatEngine.ts';
import { AIDifficulty, FighterInput, MatchState } from '../shared/types.ts';

export class AIController {
  private decisionTimer = 0;
  private strafeDir = 1;
  private burstTicks = 0;
  private burstAction: keyof FighterInput | null = null;

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
    const reactSpeed =
      difficulty === 'hard' ? 0.16 : difficulty === 'normal' ? 0.28 : 0.45;
    const aggression =
      difficulty === 'hard' ? 0.78 : difficulty === 'normal' ? 0.56 : 0.34;

    // Ground fighting AI
    if (ai.posture === 'ground_top') {
      if (ai.activeMove === 'submission_attempt') {
        inp.takedown = true;
        return inp;
      }
      if (this.decisionTimer <= 0) {
        this.decisionTimer = reactSpeed * 1.4;
        if (opp.health < 35 && Math.random() < 0.45) {
          inp.takedown = true; // Submission attempt
        } else {
          inp.punch = true; // Ground & Pound
        }
      }
      return inp;
    }

    if (ai.posture === 'ground_bottom') {
      if (opp.activeMove === 'submission_attempt') {
        // Struggle to escape submission
        inp.dodge = Math.random() < 0.5;
        inp.moveX = Math.sin(state.tickCount * 0.4);
        inp.moveZ = Math.cos(state.tickCount * 0.4);
        return inp;
      }
      inp.block = Math.random() < 0.55;
      if (this.decisionTimer <= 0) {
        this.decisionTimer = reactSpeed * 2.0;
        if (Math.random() < 0.55) {
          inp.dodge = true; // Stand up scramble
        }
      }
      return inp;
    }

    // Clinch AI
    if (ai.posture === 'clinch') {
      if (this.decisionTimer <= 0) {
        this.decisionTimer = reactSpeed * 1.3;
        const r = Math.random();
        if (r < 0.4) inp.kick = true; // Knee
        else if (r < 0.7) inp.heavyPunch = true; // Elbow
        else if (r < 0.88) inp.takedown = true; // Takedown from clinch
        else inp.dodge = true; // Break clinch
      }
      return inp;
    }

    // Standing AI: Check incoming opponent strike to block or slip
    const oppAttacking =
      opp.activeMove !== 'none' &&
      opp.activeMove !== 'dodge_left' &&
      opp.activeMove !== 'dodge_right' &&
      opp.activeMove !== 'dodge_back';

    if (oppAttacking && dist < 1.75) {
      const defChance =
        difficulty === 'hard' ? 0.72 : difficulty === 'normal' ? 0.48 : 0.25;
      if (Math.random() < defChance) {
        if (Math.random() < 0.28 && ai.stamina > 25) {
          inp.dodge = true;
          inp.moveX = this.strafeDir;
        } else {
          inp.block = true;
          inp.moveX = -nx * 0.4;
          inp.moveZ = -nz * 0.4;
        }
        return inp;
      }
    }

    // Execute queued burst attack
    if (this.burstTicks > 0 && this.burstAction) {
      this.burstTicks -= 1;
      (inp[this.burstAction] as boolean) = true;
      inp.moveX = nx * 0.6;
      inp.moveZ = nz * 0.6;
      return inp;
    }

    // Spacing & Footwork
    const desiredDist = ai.stamina < 25 ? 2.1 : 1.18;
    if (dist > desiredDist + 0.2) {
      inp.moveX = nx * 0.9 + latX * this.strafeDir * 0.35;
      inp.moveZ = nz * 0.9 + latZ * this.strafeDir * 0.35;
    } else if (dist < desiredDist - 0.25) {
      inp.moveX = -nx * 0.75 + latX * this.strafeDir * 0.55;
      inp.moveZ = -nz * 0.75 + latZ * this.strafeDir * 0.55;
    } else {
      inp.moveX = latX * this.strafeDir * 0.65;
      inp.moveZ = latZ * this.strafeDir * 0.65;
    }

    // Tactical offense decisions
    if (this.decisionTimer <= 0) {
      this.decisionTimer = reactSpeed * (0.8 + Math.random() * 0.7);
      if (Math.random() < 0.35) this.strafeDir *= -1;

      if (ai.stamina > 18 && dist < 1.62 && Math.random() < aggression) {
        const r = Math.random();
        if (dist < 1.05 && r < 0.16) {
          inp.clinch = true;
        } else if (dist < 1.35 && r < 0.28 && ai.profileId === 'charles') {
          inp.takedown = true;
        } else if (r < 0.52) {
          inp.punch = true;
          this.burstTicks = difficulty === 'hard' ? 2 : 1;
          this.burstAction = Math.random() < 0.5 ? 'punch' : 'kick';
        } else if (r < 0.72) {
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
