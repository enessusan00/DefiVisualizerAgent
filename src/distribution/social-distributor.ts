import * as fs from 'fs';
import * as path from 'path';



/**
 * Distribute visualization to social media platforms
 * @param imagePath Path to the image to distribute
 * @param platforms Platforms to distribute to
 * @param message Accompanying message for the post
 * @param tags Tags/hashtags to include
 * @param action Action context for using OpenServ integrations
 * @returns Results of the distribution
 */
export async function distributeToSocial(
  imagePath: string,
  platforms: ('twitter' | 'linkedin' | 'telegram')[],
  message: string,
  tags: string[],
  action: any
): Promise<{ [platform: string]: { success: boolean; postId?: string; url?: string; error?: string } }> {
  const results: { [platform: string]: { success: boolean; postId?: string; url?: string; error?: string } } = {};
  
  // Prepare the formatted message with tags
  const formattedTags = formatTagsForPlatforms(tags, platforms);
  
  // Process each platform
  for (const platform of platforms) {
    try {
      // Check if image exists
      if (!fs.existsSync(imagePath)) {
        results[platform] = {
          success: false,
          error: `Image file not found: ${imagePath}`
        };
        continue;
      }
      
      // Format message for this specific platform
      const platformMessage = formatMessageForPlatform(message, platform);
      
      // Add tags for this platform
      const fullMessage = `${platformMessage}\n\n${formattedTags[platform] || ''}`;
      
      // Use the Social Media Poster agent if available through OpenServ
      if (action && action.workspace) {
        try {
          console.log(`Distributing to ${platform} with message: ${fullMessage}`);
          
          // OpenServ API entegrasyonuyla sosyal medya paylaşımı
          // Önce image'i base64'e çevirelim
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Image = imageBuffer.toString('base64');
          
          // Uygun integrasyon ID'sini belirleyelim
          let integrationId: string;
          
          switch (platform) {
            case 'twitter':
              integrationId = 'twitter-v2';
              break;
            case 'linkedin':
              integrationId = 'linkedin-v2';
              break;
            case 'telegram':
              integrationId = 'telegram';
              break;
            default:
              throw new Error(`Unsupported platform: ${platform}`);
          }
          
          // Platform-specific değişkenler
          let endpoint: string;
          let method: string;
          let data: any = {};
          
          // Her platform için özel yapılandırma
          switch (platform) {
            case 'twitter':
              endpoint = '/2/tweets';
              method = 'POST';
              data = {
                text: fullMessage,
                media: {
                  media_data: base64Image,
                  media_type: path.extname(imagePath) === '.png' ? 'image/png' : 'image/jpeg'
                }
              };
              break;
              
            case 'linkedin':
              endpoint = '/v2/ugcPosts';
              method = 'POST';
              data = {
                author: "urn:li:person:me",
                lifecycleState: "PUBLISHED",
                specificContent: {
                  "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                      text: fullMessage
                    },
                    shareMediaCategory: "IMAGE",
                    media: [
                      {
                        status: "READY",
                        description: {
                          text: "DeFi Visualization"
                        },
                        media: base64Image,
                        title: {
                          text: "DeFi Data Visualization"
                        }
                      }
                    ]
                  }
                },
                visibility: {
                  "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
              };
              break;
              
            case 'telegram':
              endpoint = '/sendPhoto';
              method = 'POST';
              data = {
                chat_id: "@your_channel_here", // Gerçek bir kanal ID'si girilmeli
                caption: fullMessage,
                photo: base64Image
              };
              break;
          }
          
          // OpenServ entegrasyonu üzerinden API çağrısı
          const postResponse = await action.callIntegration({
            workspaceId: action.workspace.id,
            integrationId: integrationId,
            details: {
              endpoint: endpoint,
              method: method,
              data: data
            }
          });
          
          // Yanıtı işle
          let postId, url;
          
          switch (platform) {
            case 'twitter':
              postId = postResponse.data?.id;
              url = postId ? `https://twitter.com/user/status/${postId}` : undefined;
              break;
              
            case 'linkedin':
              postId = postResponse.data?.id;
              url = postId ? `https://www.linkedin.com/feed/update/${postId}` : undefined;
              break;
              
            case 'telegram':
              postId = postResponse.data?.message_id;
              url = undefined; // Telegram posts typically don't have public URLs
              break;
          }
          
          results[platform] = {
            success: true,
            postId,
            url
          };
          
          console.log(`Successfully posted to ${platform}: ${url || postId}`);
        } catch (error) {
          results[platform] = {
            success: false,
            error: `Failed to post to ${platform}: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      } else {
        // No agent available, just log what would happen
        console.log(`Would post to ${platform} with message: ${fullMessage}`);
        console.log(`Would attach image: ${imagePath}`);
        
        results[platform] = {
          success: false,
          error: 'No workspace available for posting to social media'
        };
      }
    } catch (error) {
      results[platform] = {
        success: false,
        error: `Error posting to ${platform}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
  
  return results;
}
/**
 * Format tags for different platforms
 * @param tags Array of tags
 * @param platforms Platforms to format tags for
 * @returns Object with formatted tags for each platform
 */
function formatTagsForPlatforms(
  tags: string[],
  platforms: ('twitter' | 'linkedin' | 'telegram')[]
): { [platform: string]: string } {
  const formattedTags: { [platform: string]: string } = {};
  
  for (const platform of platforms) {
    switch (platform) {
      case 'twitter':
        // Twitter hashtags without spaces, limited to relevant ones
        formattedTags[platform] = tags
          .slice(0, 5) // Limit to 5 hashtags for Twitter
          .map(tag => `#${tag.replace(/\s+/g, '')}`)
          .join(' ');
        break;
        
      case 'linkedin':
        // LinkedIn hashtags without spaces
        formattedTags[platform] = tags
          .slice(0, 8) // LinkedIn works well with more hashtags
          .map(tag => `#${tag.replace(/\s+/g, '')}`)
          .join(' ');
        break;
        
      case 'telegram':
        // Telegram can use hashtags like Twitter
        formattedTags[platform] = tags
          .map(tag => `#${tag.replace(/\s+/g, '')}`)
          .join(' ');
        break;
    }
  }
  
  return formattedTags;
}

/**
 * Format message for specific platform
 * @param message Original message
 * @param platform Target platform
 * @returns Formatted message
 */
function formatMessageForPlatform(message: string, platform: 'twitter' | 'linkedin' | 'telegram'): string {
  switch (platform) {
    case 'twitter':
      // Twitter has a 280 character limit
      return message.length > 250 ? message.substring(0, 247) + '...' : message;
      
    case 'linkedin':
      // LinkedIn allows longer posts
      return message;
      
    case 'telegram':
      // Telegram allows long messages too
      return message;
      
    default:
      return message;
  }
}

/**
 * Generate social media content based on visualization data
 * @param data Data used for the visualization
 * @param platform Target social media platform
 * @param contentType Type of content to generate
 * @param action Action context
 * @returns Generated content
 */
export async function generateSocialContent(
  data: any,
  platform: 'twitter' | 'linkedin' | 'telegram',
  contentType: 'short' | 'detailed' | 'thread',
  action: any
): Promise<{ message: string; tags: string[]; thread?: string[] }> {
  // Extract default tags from the data
  const tags = extractDefaultTags(data);
  
  // Default message
  let message = '';

  // If we have token data, generate content based on that
  if (data.token) {
    const tokenSymbol = data.token.symbol || 'Token';
    const priceUsd = data.price?.usd || 0;
    const priceChange = data.price?.change24h || 0;
    const volume24h = data.volume?.usd24h || 0;
    
    if (contentType === 'short') {
      message = `${tokenSymbol} is trading at $${priceUsd.toFixed(6)} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}% 24h) with $${formatNumber(volume24h)} 24h volume.`;
    } else if (contentType === 'detailed') {
      message = `${tokenSymbol} Market Update 📊\n\nCurrent Price: $${priceUsd.toFixed(6)}\n24h Change: ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%\n24h Volume: $${formatNumber(volume24h)}\n\nLiquidity: $${formatNumber(data.liquidity?.usd || 0)}\nMarket Cap: $${formatNumber(data.marketCap || 0)}\n\nTrades in last 24h: ${formatNumber(data.transactions24h || 0)} (${data.buyVsSell24h?.buys || 0} buys, ${data.buyVsSell24h?.sells || 0} sells)`;
    } else if (contentType === 'thread') {
      return {
        message: `${tokenSymbol} is currently trading at $${priceUsd.toFixed(6)} with a 24h change of ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%. Let's dive into the key metrics 🧵👇`,
        tags,
        thread: [
          `${tokenSymbol} is trading at $${priceUsd.toFixed(6)} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}% 24h)`,
          `Trading volume in the last 24 hours: $${formatNumber(volume24h)}`,
          `Market cap: $${formatNumber(data.marketCap || 0)} with $${formatNumber(data.liquidity?.usd || 0)} in liquidity`,
          `${data.transactions24h || 0} trades in last 24h (${data.buyVsSell24h?.buys || 0} buys, ${data.buyVsSell24h?.sells || 0} sells)`,
          `${tokenSymbol} is available on ${data.exchanges?.length || 0} exchanges across ${data.chains?.length || 0} chains.`
        ]
      };
    }
  } 
  // If we have protocol data
  else if (data.topProtocols || data.chainsTvl) {
    // Generic DeFi market content
    if (contentType === 'short') {
      message = `Check out our latest DeFi market visualization with key insights on tokens, protocols, and trends.`;
    } else if (contentType === 'detailed') {
      message = `DeFi Market Insights 📊\n\nOur latest data visualization provides an in-depth look at the current state of decentralized finance.\n\nThe visualization highlights key metrics, trending tokens, and protocol performance to help you make informed decisions.\n\nSwipe to see the full analysis and discover the latest trends in the DeFi ecosystem.`;
    } else if (contentType === 'thread') {
      return {
        message: `We've just published our latest DeFi market visualization! Let's explore the key insights 🧵👇`,
        tags,
        thread: [
          `Our latest DeFi visualization provides a comprehensive overview of the market`,
          `Key metrics covered include token prices, trading volume, TVL, and distribution across protocols`,
          `The data reveals important trends in user activity and capital flows in the DeFi ecosystem`,
          `This analysis can help you make better-informed decisions about your DeFi investments and activities`,
          `Follow us for regular updates and more detailed breakdowns of the DeFi landscape!`
        ]
      };
    }
  } 
  // Default content if we don't have specific data
  else {
    if (contentType === 'short') {
      message = 'Check out our latest DeFi data visualization!';
    } else if (contentType === 'detailed') {
      message = 'Our latest DeFi data visualization provides insights on market trends, token performance, and protocol growth. Swipe to explore the data and discover the latest developments in the decentralized finance ecosystem.';
    } else if (contentType === 'thread') {
      return {
        message: 'We\'ve published a new DeFi visualization! Let\'s explore what the data shows 🧵👇',
        tags,
        thread: [
          'Our latest DeFi data visualization is now available!',
          'The visualization covers key metrics across the decentralized finance ecosystem',
          'This data helps highlight emerging trends and opportunities in the market',
          'Follow us for more insights and regular updates on the DeFi landscape!'
        ]
      };
    }
  }
  
  return {
    message,
    tags,
    thread: contentType === 'thread' as any ? [message] : undefined
  };
}

/**
 * Extract default tags from visualization data
 * @param data Visualization data
 * @returns Array of tags
 */
function extractDefaultTags(data: any): string[] {
  const tags = ['DeFi', 'crypto', 'blockchain', 'visualization', 'data'];
  
  // Add data-specific tags
  if (data.token?.symbol) {
    tags.push(data.token.symbol);
  }
  
  if (data.token?.name) {
    tags.push(data.token.name.replace(/\s+/g, ''));
  }
  
  if (data.chain || (data.token && data.token.chain)) {
    const chain = data.chain || data.token.chain;
    tags.push(chain);
    
    // Add network-specific tags
    if (chain.toLowerCase() === 'ethereum') {
      tags.push('ETH');
    } else if (chain.toLowerCase() === 'binance-smart-chain' || chain.toLowerCase() === 'bsc') {
      tags.push('BSC', 'BNB');
    } else if (chain.toLowerCase() === 'solana') {
      tags.push('SOL');
    }
  }
  
  if (data.category) {
    tags.push(data.category.replace(/\s+/g, ''));
  }
  
  if (data.topTokens) {
    tags.push('TokenAnalysis');
  }
  
  if (data.tvl || data.historicalTvl) {
    tags.push('TVL', 'TotalValueLocked');
  }
  
  // Remove duplicates and limit to 10 tags
  return [...new Set(tags)].slice(0, 10);
}

/**
 * Format a number for display
 * @param num Number to format
 * @returns Formatted number string
 */
function formatNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  } else {
    return num.toFixed(2);
  }
}

/**
 * Generate a posting schedule for social media campaign
 * @param postCount Number of posts to schedule
 * @returns Array of scheduled post times
 */
export function generatePostSchedule(postCount: number): { platform: string; scheduledTime: string }[] {
  const schedule = [];
  const now = new Date();
  const platforms = ['twitter', 'linkedin', 'telegram'];
  
  for (let i = 0; i < postCount; i++) {
    // Add hours to current time
    const scheduledTime = new Date(now);
    scheduledTime.setHours(scheduledTime.getHours() + (i * 4) + Math.floor(Math.random() * 2));
    
    // Cycle through platforms
    const platform = platforms[i % platforms.length];
    
    schedule.push({
      platform,
      scheduledTime: scheduledTime.toISOString()
    });
  }
  
  return schedule;
}
