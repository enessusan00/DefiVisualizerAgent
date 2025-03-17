import { Agent } from '@openserv-labs/sdk';
import { z } from 'zod';
import * as fileDistributor from './file-distributor';
import * as socialDistributor from './social-distributor';
import * as fs from 'fs';
import * as path from 'path';

export function registerDistributionCapabilities(agent: Agent) {
  // Save visualization to file
  agent.addCapability({
    name: 'saveVisualization',
    description: 'Saves a visualization to a file',
    schema: z.object({
      html: z.string().describe('The HTML content of the visualization'),
      filename: z.string().describe('Filename to save as'),
      format: z.enum(['html', 'png', 'svg']).describe('File format to save as')
    }),
    async run({ args, action }) {
      const { html, filename, format } = args;
      
      try {
        const result = await fileDistributor.saveVisualization(html, filename, format, action);
        return JSON.stringify(result);
      } catch (error) {
        throw new Error(`Failed to save visualization: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
  
  // Distribute visualization to social media
  agent.addCapability({
    name: 'distributeToSocial',
    description: 'Distributes a visualization to social media platforms',
    schema: z.object({
      html: z.string().describe('The HTML content of the visualization'),
      platforms: z.array(z.enum(['twitter', 'linkedin', 'telegram'])).describe('Social media platforms to post to'),
      message: z.string().describe('Accompanying message for the post'),
      tags: z.array(z.string()).optional().describe('Tags/hashtags to include'),
      format: z.enum(['png', 'svg']).default('png').describe('Image format to use')
    }),
    async run({ args, action }) {
      const { html, platforms, message, tags, format } = args;
      
      try {
        // First save the visualization as an image
        const imageResult = await fileDistributor.saveVisualization(html, 'temp-visualization', format, action);
        
        // Then distribute to each platform
        const results = await socialDistributor.distributeToSocial(
          imageResult.filePath,
          platforms,
          message,
          tags || [],
          action
        );
        
        return JSON.stringify(results);
      } catch (error) {
        throw new Error(`Failed to distribute visualization: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
  
  // Generate social media content
  agent.addCapability({
    name: 'generateSocialContent',
    description: 'Generates social media content based on visualization data',
    schema: z.object({
      data: z.any().describe('The data used for the visualization'),
      platform: z.enum(['twitter', 'linkedin', 'telegram']).describe('Target social media platform'),
      contentType: z.enum(['short', 'detailed', 'thread']).describe('Type of content to generate')
    }),
    async run({ args, action }) {
      const { data, platform, contentType } = args;
      
      // Parse the data if it's a string
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      try {
        // Gerçek uygulamada, bu kısım socialDistributor ile yanıt üretir
        const content = await socialDistributor.generateSocialContent(parsedData, platform, contentType, action);
        return JSON.stringify(content);
      } catch (error) {
        throw new Error(`Failed to generate social content: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });
  
  // Create full social media campaign
  agent.addCapability({
    name: 'createSocialCampaign',
    description: 'Creates a complete social media campaign with visualizations and content',
    schema: z.object({
      topic: z.string().describe('The DeFi topic to create a campaign for (e.g., "Ethereum TVL trends", "Top DeFi tokens")'),
      platforms: z.array(z.enum(['twitter', 'linkedin', 'telegram'])).describe('Target social media platforms'),
      visualizationTypes: z.array(z.string()).describe('Types of visualizations to include'),
      postCount: z.number().optional().default(3).describe('Number of posts to create'),
      includeThread: z.boolean().optional().default(false).describe('Whether to create a thread format for Twitter')
    }),
    async run({ args , action }) {
      const { topic, platforms, visualizationTypes, postCount, includeThread } = args;
      
      try {
        // API istemcilerini yükle
        const dexscreener = await import('../api/dexscreener');
        const defillama = await import('../api/defillama');
        const templateRegistry = (await import('../templates/template-interface')).templateRegistry;
        
        // Kampanya için veri topla
        console.log(`Creating campaign for topic: ${topic}`);
        
        // Konu ile ilgili verileri çek
        let campaignData: any = {
          topic,
          timestamp: new Date().toISOString()
        };
        
        // Konu ile ilgili token veya protokol verileri çek
        if (topic.toLowerCase().includes('token') || topic.toLowerCase().includes('price')) {
          // Token verileri için DexScreener API kullan
          const topTokens = await dexscreener.getTopTokens('volume', undefined, 5);
          campaignData.tokens = topTokens;
          campaignData.primaryType = 'tokens';
          
          // Eğer spesifik bir token adı geçiyorsa, onu da çek
          const tokenMatch = topic.match(/([A-Z]{2,5})/); // ETH, BTC, SOL gibi token sembolleri
          if (tokenMatch && tokenMatch[1]) {
            const tokenSymbol = tokenMatch[1];
            try {
              const tokenData = await dexscreener.searchTokens(tokenSymbol, 1);
              if (tokenData && tokenData.length > 0) {
                campaignData.focusToken = dexscreener.processTokenData({ pairs: [tokenData[0]] });
              }
            } catch (error) {
              console.error(`Error fetching focus token (${tokenSymbol}) data:`, error);
            }
          }
        } else if (topic.toLowerCase().includes('protocol') || topic.toLowerCase().includes('tvl')) {
          // Protokol verileri için DefiLlama API kullan
          const topProtocols = await defillama.getTopProtocols(5);
          campaignData.protocols = topProtocols;
          campaignData.chainsTvl = await defillama.fetchChainsTvl();
          campaignData.categoryDistribution = await defillama.getCategoryDistribution();
          campaignData.primaryType = 'protocols';
          
          // Eğer spesifik bir protokol adı geçiyorsa, onu da çek
          const protocolMatch = topic.match(/\b([A-Za-z0-9]+(?:\s[A-Za-z0-9]+)*)\b/g);
          if (protocolMatch) {
            for (const potentialProtocol of protocolMatch) {
              if (potentialProtocol.length > 3 && !['the', 'and', 'for', 'with', 'top', 'best'].includes(potentialProtocol.toLowerCase())) {
                try {
                  const protocolData = await defillama.fetchProtocolData(potentialProtocol);
                  campaignData.focusProtocol = defillama.processProtocolData(protocolData);
                  break;
                } catch (error) {
                  // Protokol bulunamadıysa sonrakini dene
                  continue;
                }
              }
            }
          }
        } else {
          // Genel market verileri
          campaignData.tokens = await dexscreener.getTopTokens('volume', undefined, 5);
          campaignData.protocols = await defillama.getTopProtocols(5);
          campaignData.chainsTvl = await defillama.fetchChainsTvl();
          campaignData.categoryDistribution = await defillama.getCategoryDistribution();
          campaignData.primaryType = 'market';
        }
        
        // Görselleştirmeler oluştur
        const visualizations = [];
        const outputDir = path.resolve(process.cwd(), 'output');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Her vizualizasyon tipi için uygun template'i bul ve görselleştirme oluştur
        for (const vizType of visualizationTypes) {
          let template = templateRegistry.get(vizType);
          if (!template) {
            console.warn(`Template ${vizType} not found, looking for best match`);
            
            // Veri tipine göre en uygun template'i bul
            if (campaignData.primaryType === 'tokens' && vizType.includes('price')) {
              template = templateRegistry.get('price-chart');
            } else if (campaignData.primaryType === 'protocols' && vizType.includes('tvl')) {
              template = templateRegistry.get('tvl-chart');
            } else {
              template = templateRegistry.get('market-overview');
            }
          }
          
          if (!template) {
            console.error(`No suitable template found for visualization type: ${vizType}`);
            continue;
          }
          
          // Seçilen template için uygun veriyi hazırla
          let dataForTemplate, options: any = {};
          
          if (template.id === 'price-chart') {
            dataForTemplate = campaignData.focusToken || (campaignData.tokens && campaignData.tokens.length > 0 
              ? dexscreener.processTokenData({ pairs: [campaignData.tokens[0]] }) 
              : null);
            
            options = {
              title: `${dataForTemplate?.token?.symbol || 'Token'} Price Chart`,
              days: 7,
              colorScheme: 'blue'
            };
          } else if (template.id === 'tvl-chart') {
            dataForTemplate = campaignData.focusProtocol || campaignData.protocols?.[0];
            
            options = {
              title: `${dataForTemplate?.name || 'Protocol'} TVL Chart`,
              colorScheme: 'purple'
            };
          } else {
            // Market overview için
            dataForTemplate = {
              topTokens: campaignData.tokens || [],
              topProtocols: campaignData.protocols || [],
              chainsTvl: campaignData.chainsTvl || [],
              categoryDistribution: campaignData.categoryDistribution || [],
              timestamp: campaignData.timestamp
            };
            
            options = {
              title: 'DeFi Market Overview',
              colorScheme: 'blue'
            };
          }
          
          // Görselleştirmeyi oluştur
          const html = await template.generate(dataForTemplate, options);
          
          // Benzersiz bir dosya adı oluştur
          const filename = `${template.id}_${Date.now()}`;
          const filePath = path.resolve(outputDir, `${filename}.html`);
          
          // HTML dosyasını kaydet
          fs.writeFileSync(filePath, html, 'utf8');
          
          // PNG versiyonunu da oluştur
          const fileDistributor = await import('./file-distributor');
          const pngResult = await fileDistributor.convertVisualization(filePath, 'png');
          
          visualizations.push({
            type: template.id,
            title: options.title,
            htmlPath: filePath,
            pngPath: pngResult,
            data: dataForTemplate
          });
        }
        
        // Her platform için içerik oluştur
        const platformContent: Record<string, any> = {};
        
        for (const platform of platforms) {
          // Her görselleştirme için içerik oluştur
          const contents = [];
          
          for (const viz of visualizations) {
            const contentType = includeThread && platform === 'twitter' ? 'thread' : 'detailed';
            const content = await socialDistributor.generateSocialContent(
              viz.data,
              platform as 'twitter' | 'linkedin' | 'telegram',
              contentType,
              action
            );
            
            contents.push({
              visualization: viz.title,
              imagePath: viz.pngPath,
              message: content.message,
              tags: content.tags,
              thread: content.thread
            });
          }
          
          platformContent[platform] = contents;
        }
        
        // Kampanyayı oluştur
        const campaign = {
          topic,
          visualizations: visualizations.map(v => ({
            type: v.type,
            title: v.title,
            htmlPath: v.htmlPath,
            pngPath: v.pngPath
          })),
          platformContent,
          suggestedSchedule: socialDistributor.generatePostSchedule(postCount)
        };
        
        return JSON.stringify(campaign);
      } catch (error) {
        throw new Error(`Failed to create social campaign: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });

  // Get supported social platforms
  agent.addCapability({
    name: 'getSupportedSocialPlatforms',
    description: 'Gets a list of supported social media platforms',
    schema: z.object({}),
    async run() {
      return JSON.stringify({
        platforms: [
          {
            id: 'twitter',
            name: 'Twitter',
            supportedContentTypes: ['short', 'detailed', 'thread'],
            characterLimits: {
              post: 280,
              mediaDescriptions: 1000
            },
            mediaSupport: ['png', 'jpg', 'gif', 'mp4']
          },
          {
            id: 'linkedin',
            name: 'LinkedIn',
            supportedContentTypes: ['short', 'detailed'],
            characterLimits: {
              post: 3000,
              comments: 1250
            },
            mediaSupport: ['png', 'jpg', 'gif', 'mp4', 'pdf']
          },
          {
            id: 'telegram',
            name: 'Telegram',
            supportedContentTypes: ['short', 'detailed'],
            characterLimits: {
              message: 4096
            },
            mediaSupport: ['png', 'jpg', 'gif', 'mp4', 'pdf', 'audio']
          }
        ]
      });
    }
  });
}
