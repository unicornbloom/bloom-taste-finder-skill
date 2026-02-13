/**
 * Bloom Mission Skill
 *
 * OpenClaw skill that:
 * 1. Pings agent heartbeat (lottery eligibility)
 * 2. Fetches active missions from Bloom API
 * 3. Does light personalization from conversation context
 * 4. Returns formatted mission recommendations
 */

import 'dotenv/config';

const BLOOM_API_BASE = process.env.BLOOM_API_URL || 'https://api.bloomprotocol.ai';

interface Mission {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl?: string | null;
  missionType?: string | null;
  status: string;
  endTime: string;
  startTime: string;
  rewards: Array<{
    name: string;
    type: string;
    amount: number | null;
    icon: string | null;
  }>;
  taskCount: number;
  completedCount: number;
}

interface HeartbeatResponse {
  success: boolean;
  data: {
    registered: boolean;
    streak: number;
    lotteryEligible: boolean;
    nextHeartbeatBy: string;
  };
}

interface MissionsResponse {
  success: boolean;
  data: {
    missions: Mission[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface MissionSkillResult {
  success: boolean;
  heartbeat: {
    streak: number;
    lotteryEligible: boolean;
  } | null;
  missions: Mission[];
  formattedOutput: string;
  error?: string;
}

export class BloomMissionSkill {
  private apiBase: string;

  constructor(apiBase?: string) {
    this.apiBase = apiBase || BLOOM_API_BASE;
  }

  /**
   * Execute the mission skill
   * @param walletAddress - Agent wallet address for heartbeat
   * @param context - Optional conversation context for personalization
   */
  async execute(
    walletAddress: string,
    context?: string,
  ): Promise<MissionSkillResult> {
    // Run heartbeat and missions fetch in parallel
    const [heartbeatResult, missionsResult] = await Promise.allSettled([
      this.pingHeartbeat(walletAddress),
      this.fetchMissions(),
    ]);

    const heartbeat = heartbeatResult.status === 'fulfilled' ? heartbeatResult.value : null;
    const missions = missionsResult.status === 'fulfilled' ? missionsResult.value : [];

    if (heartbeatResult.status === 'rejected') {
      console.error('Heartbeat failed (non-blocking):', heartbeatResult.reason);
    }

    // Personalize if context provided
    const sorted = this.personalizeMissions(missions, context);

    // Format output
    const formattedOutput = this.formatOutput(sorted, heartbeat);

    return {
      success: true,
      heartbeat,
      missions: sorted,
      formattedOutput,
    };
  }

  /**
   * Ping the heartbeat endpoint
   */
  private async pingHeartbeat(walletAddress: string): Promise<{
    streak: number;
    lotteryEligible: boolean;
  }> {
    const res = await fetch(`${this.apiBase}/agent/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress }),
    });

    if (!res.ok) {
      throw new Error(`Heartbeat failed: ${res.status}`);
    }

    const data: HeartbeatResponse = await res.json();
    return {
      streak: data.data.streak,
      lotteryEligible: data.data.lotteryEligible,
    };
  }

  /**
   * Fetch active missions from public API
   */
  private async fetchMissions(): Promise<Mission[]> {
    const res = await fetch(`${this.apiBase}/public/missions?status=live&limit=10`);

    if (!res.ok) {
      throw new Error(`Failed to fetch missions: ${res.status}`);
    }

    const data: MissionsResponse = await res.json();
    return data.data.missions;
  }

  /**
   * Light personalization based on conversation context
   * Looks for keyword signals to prioritize relevant missions
   */
  private personalizeMissions(missions: Mission[], context?: string): Mission[] {
    if (!context || missions.length === 0) return missions;

    const contextLower = context.toLowerCase();

    // Extract interest signals from context
    const signals: string[] = [];
    const keywords: Record<string, string[]> = {
      'crypto': ['crypto', 'defi', 'blockchain', 'web3', 'token', 'nft', 'wallet'],
      'ai': ['ai', 'artificial intelligence', 'llm', 'agent', 'machine learning'],
      'social': ['twitter', 'x.com', 'social', 'community', 'engagement'],
      'development': ['code', 'develop', 'build', 'engineering', 'github'],
      'trading': ['trade', 'swap', 'dex', 'exchange', 'yield'],
    };

    for (const [category, terms] of Object.entries(keywords)) {
      if (terms.some(t => contextLower.includes(t))) {
        signals.push(category);
      }
    }

    if (signals.length === 0) return missions;

    // Score missions based on context relevance
    return [...missions].sort((a, b) => {
      const scoreA = this.scoreMission(a, signals);
      const scoreB = this.scoreMission(b, signals);
      return scoreB - scoreA;
    });
  }

  /**
   * Score a mission's relevance to detected interest signals
   */
  private scoreMission(mission: Mission, signals: string[]): number {
    const text = `${mission.title} ${mission.description || ''}`.toLowerCase();
    let score = 0;
    for (const signal of signals) {
      if (text.includes(signal)) score += 1;
    }
    // Boost social missions if social signal detected
    if (mission.missionType === 'social_mission' && signals.includes('social')) {
      score += 2;
    }
    return score;
  }

  /**
   * Format the output for CLI display
   */
  private formatOutput(
    missions: Mission[],
    heartbeat: { streak: number; lotteryEligible: boolean } | null,
  ): string {
    const lines: string[] = [];
    const baseUrl = process.env.BLOOM_DASHBOARD_URL || 'https://bloomprotocol.ai';

    lines.push('Bloom Missions');
    lines.push('==============');
    lines.push('');

    // Heartbeat status
    if (heartbeat) {
      const streakIcon = heartbeat.streak >= 2 ? 'fire' : 'check';
      lines.push(`Heartbeat: ${heartbeat.streak}-day streak${heartbeat.lotteryEligible ? ' (lottery eligible)' : ''}`);
      lines.push('');
    }

    // Missions list
    if (missions.length === 0) {
      lines.push('No active missions right now. Check back later!');
    } else {
      lines.push(`${missions.length} Active Mission${missions.length > 1 ? 's' : ''}:`);
      lines.push('');

      for (const mission of missions) {
        const rewards = mission.rewards
          .map(r => `${r.amount || ''} ${r.name}`.trim())
          .join(', ');

        const isSocial = mission.missionType === 'social_mission';
        const typeTag = isSocial ? ' [X Quest]' : '';
        const url = isSocial
          ? `${baseUrl}/social-missions/${mission.slug}`
          : `${baseUrl}/missions/${mission.slug}`;

        lines.push(`- ${mission.title}${typeTag}`);
        if (rewards) lines.push(`  Rewards: ${rewards}`);
        lines.push(`  Tasks: ${mission.taskCount}`);
        lines.push(`  ${url}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}
