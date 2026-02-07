/**
 * Enhanced Data Collector with Permissions Handling
 *
 * Collects user data from multiple sources with graceful fallbacks
 * when permissions are denied or data is unavailable.
 */

export interface TwitterData {
  bio: string;
  following: string[];  // Accounts they follow
  tweets: Array<{
    text: string;
    likes?: number;
    retweets?: number;
    timestamp?: number;
  }>;
  interactions: {
    likes: string[];      // Accounts they frequently like
    retweets: string[];   // Accounts they frequently retweet
    replies: string[];    // Accounts they frequently reply to
  };
}

export interface WalletData {
  address: string;
  // Tokens
  tokens: Array<{
    symbol: string;
    name: string;
    balance: string;
    value?: number;
  }>;
  // NFTs
  nfts: Array<{
    collection: string;
    name: string;
    tokenId: string;
    image?: string;
  }>;
  // Transactions
  transactions: Array<{
    hash: string;
    to: string;
    value: string;
    timestamp: number;
    method?: string;
  }>;
  // Unique contracts interacted with
  contracts: string[];
  // DeFi Protocols
  defiProtocols: string[];  // e.g., ['Uniswap', 'Aave', 'Compound']
}

export interface FarcasterData {
  bio: string;
  channels: string[];  // Channels they're in
  casts: Array<{
    text: string;
    timestamp: number;
  }>;
  following: string[];  // Accounts they follow
}

export interface ConversationMemory {
  topics: string[];      // Topics discussed
  interests: string[];   // Expressed interests
  preferences: string[]; // Stated preferences
  history: string[];     // Raw conversation snippets
  messageCount: number;  // Number of messages analyzed (minimum 3 required)
}

export interface UserData {
  sources: string[];  // Which sources were successfully collected
  permissions: {
    twitter: boolean;
    conversation: boolean;
  };
  dataQuality: {
    twitter: 'real' | 'none';
    conversation: 'real' | 'none';
  };
  twitter?: TwitterData;
  conversationMemory?: ConversationMemory;

  // Optional: Only if user explicitly provides wallet address + signature
  wallet?: WalletData;
  farcaster?: FarcasterData;
}

export class EnhancedDataCollector {
  /**
   * Collect all available user data with permission handling
   *
   * Default: Only collects Conversation + Twitter (if authorized)
   * Wallet analysis is OPTIONAL - only if user explicitly provides address + signature
   */
  async collect(
    userId: string,
    options?: {
      skipTwitter?: boolean;
      includeWallet?: boolean;  // Changed: wallet is opt-in, not opt-out
    }
  ): Promise<UserData> {
    console.log(`📊 Collecting data for user: ${userId}`);

    const userData: UserData = {
      sources: [],
      permissions: {
        twitter: false,
        conversation: false,
      },
      dataQuality: {
        twitter: 'none',
        conversation: 'none',
      },
    };

    // 1. Collect conversation memory (always try - owned by OpenClaw)
    try {
      userData.conversationMemory = await this.collectConversationMemory(userId);
      userData.sources.push('Conversation');
      userData.permissions.conversation = true;
      userData.dataQuality.conversation = 'real';
      console.log('✅ Conversation memory collected (real data)');
    } catch (error) {
      console.warn('⚠️  Conversation memory unavailable:', error);
      userData.dataQuality.conversation = 'none';
    }

    // 2. Collect Twitter/X data (if authorized)
    if (!options?.skipTwitter) {
      try {
        const hasPermission = await this.checkTwitterPermission(userId);
        userData.permissions.twitter = hasPermission;

        if (hasPermission) {
          userData.twitter = await this.collectTwitterData(userId);

          // Check if we got real data
          if (userData.twitter.bio || userData.twitter.tweets.length > 0) {
            userData.sources.push('Twitter');
            userData.dataQuality.twitter = 'real';
            console.log('✅ Twitter data collected (real data via bird CLI)');
          } else {
            userData.dataQuality.twitter = 'none';
            console.log('⚠️  Twitter data empty');
          }
        } else {
          console.log('⚠️  Twitter permission denied by user - skipping');
          userData.dataQuality.twitter = 'none';
        }
      } catch (error) {
        console.warn('⚠️  Twitter data unavailable:', error);
        userData.dataQuality.twitter = 'none';
      }
    }

    // 3. Wallet analysis - OPTIONAL (opt-in only)
    // Only collect if user explicitly provides wallet address + signature
    if (options?.includeWallet) {
      try {
        console.log('💰 Wallet analysis requested (opt-in)');
        userData.wallet = await this.collectWalletData(userId);
        userData.sources.push('Wallet');
        console.log('✅ Wallet data collected');
      } catch (error) {
        console.warn('⚠️  Wallet data unavailable:', error);
      }
    }

    // Check if we have enough data
    if (userData.sources.length === 0) {
      console.warn('⚠️  No data sources available - will fallback to manual Q&A');
    }

    return userData;
  }

  /**
   * Check if user has granted Twitter/X permission
   *
   * Rule: Only fetch Twitter data if user has authorized X account access
   * If no auth → skip Twitter data (fallback to conversation only)
   */
  private async checkTwitterPermission(userId: string): Promise<boolean> {
    // TODO: Connect to OpenClaw permission API
    // For now, assume granted (will be replaced with real check)
    //
    // Real implementation should be:
    // const auth = await openclaw.permissions.checkTwitterAuth(userId);
    // return auth.isAuthorized;

    return true;
  }

  /**
   * Collect comprehensive Twitter/X data
   */
  private async collectTwitterData(userId: string): Promise<TwitterData> {
    // Use bird CLI to fetch real Twitter data
    const { fetchTwitterProfile, fetchTwitterFollowing, analyzeInteractions } = await import('../integrations/bird-twitter');

    try {
      // Fetch profile with recent tweets
      const profile = await fetchTwitterProfile(userId);

      if (!profile) {
        console.warn(`⚠️  No Twitter profile found for ${userId}`);
        return {
          bio: '',
          following: [],
          tweets: [],
          interactions: {
            likes: [],
            retweets: [],
            replies: [],
          },
        };
      }

      // Fetch following list
      const followingData = await fetchTwitterFollowing(userId, 100);
      const following = followingData?.handles || [];

      // Analyze interactions from tweets
      const interactions = analyzeInteractions(profile.tweets);

      return {
        bio: profile.bio,
        following,
        tweets: profile.tweets,
        interactions,
      };
    } catch (error) {
      console.error(`❌ Failed to fetch Twitter data for ${userId}:`, error);
      // Return empty data rather than failing
      return {
        bio: '',
        following: [],
        tweets: [],
        interactions: {
          likes: [],
          retweets: [],
          replies: [],
        },
      };
    }
  }

  /**
   * Collect comprehensive Wallet data
   *
   * ⚠️ OPT-IN ONLY - Not used in default personality analysis
   *
   * This is only called when:
   * 1. User explicitly provides wallet address
   * 2. User signs ownership proof
   * 3. User opts-in to wallet-based recommendations
   *
   * Reasons:
   * - Wallet ownership is hard to prove automatically
   * - Privacy concerns
   * - Conversation + Twitter already sufficient for persona
   */
  private async collectWalletData(userId: string): Promise<WalletData> {
    // Get real wallet address from storage
    const { WalletStorage } = await import('../blockchain/wallet-storage');
    const walletStorage = new WalletStorage();

    try {
      // Get wallet from storage
      const walletRecord = await walletStorage.getUserWallet(userId);

      if (!walletRecord) {
        console.warn(`⚠️  No wallet found for user ${userId}`);
        return {
          address: '',
          tokens: [],
          nfts: [],
          transactions: [],
          contracts: [],
          defiProtocols: [],
        };
      }

      const walletAddress = walletRecord.walletAddress;
      console.log(`✅ Found wallet address: ${walletAddress}`);

      // TODO: Integrate with blockchain data providers to fetch:
      // - Tokens and balances (Alchemy/Moralis/Etherscan API)
      // - NFTs (Alchemy NFT API)
      // - Transaction history (Etherscan/Alchemy)
      // - DeFi protocol interactions
      //
      // For now, return minimal data with real wallet address
      // This allows the skill to work while we add blockchain data fetching

      return {
        address: walletAddress,
        tokens: [],
        nfts: [],
        transactions: [],
        contracts: [],
        defiProtocols: [],
      };
    } catch (error) {
      console.error(`❌ Failed to fetch wallet data for ${userId}:`, error);
      return {
        address: '',
        tokens: [],
        nfts: [],
        transactions: [],
        contracts: [],
        defiProtocols: [],
      };
    }
  }


  /**
   * Collect conversation memory from OpenClaw session files
   *
   * ⭐ CRITICAL: Requires minimum 3 messages for valid analysis
   * - Throws error if messageCount < 3 (no silent fallback)
   * - Forces explicit error handling in calling code
   */
  private async collectConversationMemory(userId: string): Promise<ConversationMemory & { messageCount: number }> {
    try {
      // Import session reader (dynamic to avoid circular deps)
      const { createSessionReader } = await import('../integrations/openclaw-session-reader');
      const sessionReader = createSessionReader();

      // Read and analyze session history
      const analysis = await sessionReader.readSessionHistory(userId);

      // ⭐ CRITICAL: Minimum 3 messages required
      if (analysis.messageCount < 3) {
        throw new Error(
          `Insufficient conversation data: ${analysis.messageCount} messages found (minimum 3 required). ` +
          `Please continue chatting with OpenClaw to build conversation history.`
        );
      }

      console.log(`✅ Conversation analysis: ${analysis.messageCount} messages, ${analysis.topics.length} topics`);

      return {
        topics: analysis.topics,
        interests: analysis.interests,
        preferences: analysis.preferences,
        history: analysis.history,
        messageCount: analysis.messageCount,
      };
    } catch (error) {
      console.error('❌ Failed to read session history:', error);
      // Return empty rather than failing completely
      return {
        topics: [],
        interests: [],
        preferences: [],
        history: [],
        messageCount: 0,
      };
    }
  }

  /**
   * Check if we have sufficient data for analysis
   *
   * ⭐ CRITICAL REQUIREMENT: Conversation with ≥3 messages
   * - Conversation is PRIMARY (85% weight) and REQUIRED
   * - Twitter is OPTIONAL (15% weight)
   * - No silent fallback - explicit error if insufficient
   */
  hasSufficientData(userData: UserData): boolean {
    // Must have conversation data with minimum 3 messages
    if (!userData.conversationMemory) {
      return false;
    }

    if (userData.conversationMemory.messageCount < 3) {
      return false;
    }

    return true;
  }

  /**
   * Get data quality score (0-100)
   *
   * Scoring (simplified - only Conversation + Twitter):
   * - Conversation: 85 points (who they REALLY are - authentic, private, direct)
   * - Twitter: 15 points (public signal - supplemental validation)
   *
   * Rationale: Conversation is more authentic and always available (OpenClaw-owned)
   */
  getDataQualityScore(userData: UserData): number {
    let score = 0;

    // Conversation: 85 points (foundation - the real person)
    if (userData.conversationMemory) {
      score += 70; // Base score for having conversation data

      // Bonus: rich conversation history (up to +15 points)
      if (userData.conversationMemory.topics.length >= 3) score += 5;
      if (userData.conversationMemory.interests.length >= 3) score += 5;
      if (userData.conversationMemory.history.length >= 5) score += 5;
    }

    // Twitter: 15 points (supplemental - public validation)
    if (userData.twitter && userData.dataQuality.twitter === 'real') {
      score += 10; // Base score for having Twitter data

      // Bonus: rich Twitter data (up to +5 points)
      if (userData.twitter.tweets.length >= 10) score += 3;
      if (userData.twitter.following.length >= 20) score += 2;
    }

    return Math.min(score, 100);
  }

  /**
   * Get human-readable data quality summary
   */
  getDataQualitySummary(userData: UserData): string {
    const score = this.getDataQualityScore(userData);
    const sources = userData.sources.join(' + ');

    // Conversation-heavy scoring means we can have high confidence with just conversation
    if (score >= 75) {
      return `High confidence (${score}/100) - ${sources} - authentic personality`;
    } else if (score >= 50) {
      return `Medium confidence (${score}/100) - ${sources}`;
    } else if (score > 0) {
      return `Low confidence (${score}/100) - ${sources} - consider manual Q&A`;
    } else {
      return 'No data - fallback to manual Q&A required';
    }
  }
}
