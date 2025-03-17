/**
 * Twitter integration for social media distribution
 * This module would implement Twitter API integration using OpenServ's capabilities
 */

/**
 * Post a message with media to Twitter
 * @param message Tweet text
 * @param mediaPath Path to media file
 * @param tags Array of hashtags
 * @param action Action context for OpenServ integrations
 * @returns Post result
 */
export async function postToTwitter(
  message: string,
  mediaPath: string,
  tags: string[],
  action: any
): Promise<{ success: boolean; tweetId?: string; url?: string; error?: string }> {
  // In a real implementation, this would use Twitter API via OpenServ Social Media Poster
  console.log(`[Twitter] Would post message: ${message}`);
  console.log(`[Twitter] Would attach media: ${mediaPath}`);
  console.log(`[Twitter] With tags: ${tags.join(', ')}`);
  
  // This is a mock implementation for demonstration purposes
  try {
    if (action && action.agent) {
      // In a real implementation, we would use the Social Media Poster agent
      console.log(`[Twitter] Using OpenServ Social Media Poster agent`);
      
      // Mock successful post
      const mockTweetId = `tweet-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const mockUrl = `https://twitter.com/user/status/${mockTweetId}`;
      
      return {
        success: true,
        tweetId: mockTweetId,
        url: mockUrl
      };
    } else {
      return {
        success: false,
        error: 'No agent available for posting to Twitter'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Twitter posting failed: ${error.message}`
    };
  }
}

/**
 * Post a thread to Twitter
 * @param tweets Array of tweet texts
 * @param mediaPath Path to media for first tweet
 * @param tags Array of hashtags for last tweet
 * @param action Action context for OpenServ integrations
 * @returns Thread result
 */
export async function postTwitterThread(
  tweets: string[],
  mediaPath: string,
  tags: string[],
  action: any
): Promise<{ success: boolean; tweetIds?: string[]; urls?: string[]; error?: string }> {
  if (!tweets || tweets.length === 0) {
    return {
      success: false,
      error: 'No tweets provided for thread'
    };
  }
  
  // In a real implementation, this would post a thread using Twitter API
  console.log(`[Twitter] Would post thread with ${tweets.length} tweets`);
  console.log(`[Twitter] First tweet: ${tweets[0]}`);
  console.log(`[Twitter] Would attach media to first tweet: ${mediaPath}`);
  console.log(`[Twitter] With tags in last tweet: ${tags.join(', ')}`);
  
  // This is a mock implementation for demonstration purposes
  try {
    if (action && action.agent) {
      // Mock successful thread
      const tweetIds = [];
      const urls = [];
      
      for (let i = 0; i < tweets.length; i++) {
        const mockTweetId = `tweet-${Date.now()}-${Math.floor(Math.random() * 1000)}-${i}`;
        tweetIds.push(mockTweetId);
        urls.push(`https://twitter.com/user/status/${mockTweetId}`);
      }
      
      return {
        success: true,
        tweetIds,
        urls
      };
    } else {
      return {
        success: false,
        error: 'No agent available for posting to Twitter'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Twitter thread posting failed: ${error.message}`
    };
  }
}

/**
 * Format hashtags for Twitter
 * @param tags Array of tag strings
 * @returns Formatted hashtag string
 */
export function formatTwitterTags(tags: string[]): string {
  // Twitter best practices suggest using no more than 2-3 hashtags
  return tags
    .slice(0, 3)
    .map(tag => `#${tag.replace(/\s+/g, '')}`)
    .join(' ');
}

/**
 * Check if a message is within Twitter's character limit
 * @param message Message to check
 * @param tagCount Number of hashtags to account for
 * @returns Truncated message if needed
 */
export function ensureTwitterLength(message: string, tagCount: number = 0): string {
  // Twitter's character limit is 280
  // Estimate 15 characters per hashtag plus spaces
  const hashtagChars = tagCount * 15;
  const maxMessageLength = 280 - hashtagChars - 3; // 3 chars buffer
  
  if (message.length <= maxMessageLength) {
    return message;
  }
  
  // Truncate and add ellipsis
  return message.substring(0, maxMessageLength - 3) + '...';
}

/**
 * Generate content optimized for Twitter
 * @param data Visualization data
 * @param contentType Type of content (short, detailed, thread)
 * @returns Twitter-optimized content
 */
export function generateTwitterContent(data: any, contentType: 'short' | 'detailed' | 'thread'): {
  message: string;
  thread?: string[];
  tags: string[];
} {
  // Default tags
  const tags = ['DeFi', 'crypto', 'data', 'analysis'];
  
  // Add data-specific tags
  if (data.token?.symbol) {
    tags.push(data.token.symbol);
  }
  
  if (data.chain) {
    tags.push(data.chain);
  }
  
  // Generate appropriate content based on type
  if (contentType === 'short') {
    // Short tweet for quick updates
    let message = 'Check out our latest DeFi data visualization! ';
    
    if (data.token) {
      message = `${data.token.symbol} is trading at $${data.price.usd.toFixed(4)} (${data.price.change24h >= 0 ? '+' : ''}${data.price.change24h.toFixed(2)}%). Check out our analysis! `;
    } else if (data.topProtocols) {
      message = `DeFi Market Update: Top protocol ${data.topProtocols[0].name} has $${(data.topProtocols[0].tvl / 1e9).toFixed(2)}B TVL. See our full analysis! `;
    }
    
    return {
      message: ensureTwitterLength(message, 3),
      tags: tags.slice(0, 3)
    };
  } else if (contentType === 'detailed') {
    // More detailed single tweet
    let message = 'DeFi Market Insights 📊\n\n';
    
    if (data.token) {
      message += `${data.token.symbol} Analysis:\n• Price: $${data.price.usd.toFixed(6)}\n• 24h Change: ${data.price.change24h >= 0 ? '+' : ''}${data.price.change24h.toFixed(2)}%\n• Volume: $${(data.volume.usd24h / 1e6).toFixed(2)}M\n\n`;
    } else if (data.topProtocols) {
      message += `Top Protocols by TVL:\n• ${data.topProtocols[0].name}: $${(data.topProtocols[0].tvl / 1e9).toFixed(2)}B\n• ${data.topProtocols[1].name}: $${(data.topProtocols[1].tvl / 1e9).toFixed(2)}B\n\n`;
    }
    
    return {
      message: ensureTwitterLength(message, 3),
      tags: tags.slice(0, 3)
    };
  } else {
    // Thread for comprehensive analysis
    const thread = [];
    
    // First tweet is the hook
    thread.push('Just published our latest DeFi data visualization! Let\'s break down the key insights 🧵👇');
    
    if (data.token) {
      // Token-specific thread
      thread.push(`${data.token.symbol} is trading at $${data.price.usd.toFixed(6)} with ${data.price.change24h >= 0 ? '+' : ''}${data.price.change24h.toFixed(2)}% 24h change`);
      thread.push(`Trading volume: $${(data.volume.usd24h / 1e6).toFixed(2)}M in the last 24 hours`);
      thread.push(`Market cap: $${(data.marketCap / 1e6).toFixed(2)}M with $${(data.liquidity.usd / 1e6).toFixed(2)}M in liquidity`);
      thread.push(`Available on ${data.exchanges ? data.exchanges.length : 'multiple'} exchanges`);
    } else if (data.topProtocols) {
      // Market overview thread
      thread.push(`Top DeFi protocols by TVL:\n1. ${data.topProtocols[0].name}: $${(data.topProtocols[0].tvl / 1e9).toFixed(2)}B\n2. ${data.topProtocols[1].name}: $${(data.topProtocols[1].tvl / 1e9).toFixed(2)}B\n3. ${data.topProtocols[2].name}: $${(data.topProtocols[2].tvl / 1e9).toFixed(2)}B`);
      
      if (data.chainsTvl) {
        thread.push(`Blockchain TVL distribution:\n1. ${data.chainsTvl[0].name}: $${(data.chainsTvl[0].tvl / 1e9).toFixed(2)}B\n2. ${data.chainsTvl[1].name}: $${(data.chainsTvl[1].tvl / 1e9).toFixed(2)}B`);
      }
      
      if (data.categoryDistribution) {
        thread.push(`DeFi category breakdown:\n1. ${data.categoryDistribution[0].category}: $${(data.categoryDistribution[0].tvl / 1e9).toFixed(2)}B\n2. ${data.categoryDistribution[1].category}: $${(data.categoryDistribution[1].tvl / 1e9).toFixed(2)}B`);
      }
    }
    
    // Last tweet with call to action
    thread.push(`Want to see more detailed analytics? Check out our full visualization and follow for regular updates! ${formatTwitterTags(tags)}`);
    
    return {
      message: thread[0],
      thread,
      tags
    };
  }
}
