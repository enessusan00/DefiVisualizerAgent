import { Agent } from '@openserv-labs/sdk';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { templateRegistry } from './template-interface';
import { PriceChartTemplate } from './price-chart';
import { MarketOverviewTemplate } from './market-overview';
import { TvlChartTemplate } from './tvl-chart';
// API modüllerini import et
import * as dexscreener from '../api/dexscreener';
import * as defillama from '../api/defillama';

// Register all templates
templateRegistry.register(new PriceChartTemplate());
templateRegistry.register(new MarketOverviewTemplate());
templateRegistry.register(new TvlChartTemplate());

export function registerVisualizationCapabilities(agent: Agent) {
  // Generate visualization capability
  agent.addCapability({
    name: 'generateVisualization',
    description: 'Generates a visualization based on provided data',
    schema: z.object({
      data: z.any().describe('The data to visualize'),
      templateId: z.string().optional().describe('Specific template ID to use (optional)'),
      options: z.object({
        width: z.number().optional().describe('Width of the visualization in pixels'),
        height: z.number().optional().describe('Height of the visualization in pixels'),
        colorScheme: z.string().optional().describe('Color scheme to use (blue, green, red, purple)'),
        title: z.string().optional().describe('Title for the visualization'),
        showLegend: z.boolean().optional().describe('Whether to show a legend'),
        fontFamily: z.string().optional().describe('Font family to use')
      }).optional().describe('Visualization options')
    }),
    async run({ args }) {
      const { data, templateId, options } = args;
      
      // Parse the data if it's a string
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Find an appropriate template
      let template;
      if (templateId) {
        template = templateRegistry.get(templateId);
        if (!template) {
          throw new Error(`Template with ID "${templateId}" not found`);
        }
        
        if (!template.isSuitableFor(parsedData)) {
          throw new Error(`Template "${templateId}" is not suitable for the provided data`);
        }
      } else {
        template = templateRegistry.findBestTemplate(parsedData);
        if (!template) {
          throw new Error('No suitable template found for the provided data');
        }
      }
      
      // Generate the visualization
      const html = await template.generate(parsedData, options);
      
      return html;
    }
  });
  
  // Get available templates capability
  agent.addCapability({
    name: 'getAvailableTemplates',
    description: 'Gets a list of all available visualization templates',
    schema: z.object({}),
    async run() {
      const templates = templateRegistry.getAll().map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        suitableFor: template.suitableFor
      }));
      
      return JSON.stringify(templates);
    }
  });
  
  // Find suitable templates capability
  agent.addCapability({
    name: 'findSuitableTemplates',
    description: 'Finds templates suitable for the provided data',
    schema: z.object({
      data: z.any().describe('The data to check templates against')
    }),
    async run({ args }) {
      const { data } = args;
      
      // Parse the data if it's a string
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      const suitableTemplates = templateRegistry.findSuitableTemplates(parsedData).map(template => ({
        id: template.id,
        name: template.name,
        description: template.description
      }));
      
      return JSON.stringify(suitableTemplates);
    }
  });
  
  // Generate price chart capability
  agent.addCapability({
    name: 'generatePriceChart',
    description: 'Generates a price chart for a token',
    schema: z.object({
      tokenAddress: z.string().describe('The token address or name to create chart for'),
      chain: z.string().optional().describe('Optional blockchain to filter results by (ethereum, bsc, etc.)'),
      days: z.number().optional().describe('Number of days to show (default: 7)'),
      saveToWorkspace: z.boolean().optional().default(false).describe('Whether to save the visualization to the workspace'),
      options: z.object({
        width: z.number().optional(),
        height: z.number().optional(),
        colorScheme: z.string().optional(),
        title: z.string().optional(),
        showLegend: z.boolean().optional()
      }).optional().describe('Visualization options'),
      progressLogs: z.array(z.string()).optional().describe('Optional progress logs for tracking')
    }),
    async run({ args, action }) {
      try {
        // Import main agent instance
        const mainAgent = await import('../index').then(module => module.default);
        
        const { tokenAddress, chain, days = 7, saveToWorkspace = false, options, progressLogs = [] } = args;
        
        // Log progress
        const logProgress = async (message: string) => {
          console.log(message);
          
          // Add to progress logs if available
          if (Array.isArray(progressLogs)) {
            progressLogs.push(message);
          }
          
          // If this is part of a task, add log to task
          // Safely check if we're in a task action
          if (action && 'type' in action && action.type === 'do-task' && action.task && 'addLog' in action.task) {
            try {
              // @ts-ignore - TypeScript doesn't know about the internal structure
              await action.task.addLog({
                severity: 'info',
                type: 'text',
                body: message
              });
            } catch (err) {
              console.error('Error adding log to task:', err);
            }
          }
        };
        
        await logProgress(`Generating price chart for token: ${tokenAddress} on chain: ${chain || 'any'} for the past ${days} days`);
        
        // Add token identification logic
        let tokenSymbol = '';
        let tokenName = '';
        
        // Check if input appears to be a symbol or name rather than an address
        if (!tokenAddress.startsWith('0x') && !tokenAddress.includes('factory/')) {
          // If it looks like a symbol, try to normalize it
          tokenSymbol = tokenAddress.toUpperCase();
          tokenName = tokenAddress.charAt(0).toUpperCase() + tokenAddress.slice(1).toLowerCase();
          
          if (tokenSymbol === 'ETH' || tokenSymbol === 'ETHEREUM') {
            await logProgress('Identified Ethereum (ETH) token');
            tokenName = 'Ethereum';
            tokenSymbol = 'ETH';
          } else if (tokenSymbol === 'BTC' || tokenSymbol === 'BITCOIN') {
            await logProgress('Identified Bitcoin (BTC) token');
            tokenName = 'Bitcoin';
            tokenSymbol = 'BTC';
          } else if (tokenSymbol === 'SOL' || tokenSymbol === 'SOLANA') {
            await logProgress('Identified Solana (SOL) token');
            tokenName = 'Solana';
            tokenSymbol = 'SOL';
          }
        }
          
        // Make API call to fetch token data
        await logProgress('Fetching token data from API...');
        const tokenData = await dexscreener.fetchTokenData(tokenAddress, chain);
        await logProgress('Token data fetched successfully');
        
        // Process the data
        await logProgress('Processing token data...');
        const processedData = dexscreener.processTokenData(tokenData);
        await logProgress('Token data processed successfully');
        
        // If we identified a token symbol/name but it doesn't match the API result, update the data
        if (tokenSymbol && tokenName && processedData.token) {
          // Only override if we're confident in our identification (e.g. ETH, BTC)
          if (tokenSymbol === 'ETH' || tokenSymbol === 'BTC' || tokenSymbol === 'SOL') {
            processedData.token.symbol = tokenSymbol;
            processedData.token.name = tokenName;
          }
        }
        
        // Set title if not provided
        const chartOptions = options || {};
        if (!chartOptions.title && processedData.token?.symbol) {
          chartOptions.title = `${processedData.token.symbol} Price Chart (${days} Days)`;
        }
        
        // Get the template
        await logProgress('Preparing chart template...');
        const template = templateRegistry.get('price-chart');
        if (!template) {
          throw new Error('Price chart template not found');
        }
        
        // Generate the visualization
        await logProgress('Generating chart visualization...');
        const html = await template.generate(processedData, chartOptions);
        await logProgress('Chart visualization generated successfully');
        
        // Save to workspace if requested
        if (saveToWorkspace && action && action.workspace) {
          await logProgress('Saving chart to workspace...');
          try {
          const filename = `${processedData.token?.symbol || 'token'}_price_chart`;
          
          // Önce dosyayı disk üzerine kaydet
          const outputDir = path.resolve(process.cwd(), 'output');
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          
          const filePath = path.resolve(outputDir, `${filename}.html`);
          // Dosyayı diske yazalım
          fs.writeFileSync(filePath, html, 'utf8');
          
          await logProgress(`Chart saved locally to ${filePath}`);
          
          // OpenServ için basit bir tanımlayıcı metin oluştur
          // Değişkenleri artık kullanmıyoruz, doğrudan template string içinde kullanıyoruz

          const summaryText = `
# ${processedData.token?.name || 'Token'} (${processedData.token?.symbol || 'Unknown'}) Price Chart

This file contains a summary of price data for the last ${days} days.

## Price Summary

- Current Price: \${processedData.price?.usd.toFixed(2) || 'N/A'}
- 24h Change: ${processedData.price?.change24h.toFixed(2) || 'N/A'}%
- 24h Volume: \${(processedData.volume?.usd24h / 1000000).toFixed(2) || 'N/A'} million
- Market Cap: \${(processedData.marketCap / 1000000).toFixed(2) || 'N/A'} million

## Chart Information

This chart was generated on ${new Date().toLocaleString()} and includes:
- Price history with candlestick chart
- Volume indicators
- Moving averages

The HTML visualization is saved locally at: ${filePath}
`;
          
          // Dosyayı workspace'e yüklemeye çalışalım
          try {
          // Dosyayı diskten oku
          const fileContent = fs.readFileSync(filePath);
            
            // Upload to workspace - SDK yöntemini kullanalım
            let taskIds: number[] | undefined;
              if (action.type === 'do-task' && action.task) {
              taskIds = [action.task.id];
            }
              
                // Upload as a TEXT file with minimal content
                await mainAgent.uploadFile({
                  workspaceId: action.workspace.id,
                  path: `${filename}.txt`,  // Use simple text format
                  file: Buffer.from(`${processedData.token?.name || 'Token'} (${processedData.token?.symbol || 'Unknown'}) Price Chart\n\nPrice: ${processedData.price?.usd.toFixed(2) || 'N/A'} | Change: ${processedData.price?.change24h.toFixed(2) || 'N/A'}`),
                  skipSummarizer: true,
                });
                
                await logProgress(`Price data summary saved to workspace as ${filename}.txt`);
                
                // Ayrıca yerel dosya yolunu da belirtelim
                await logProgress(`The full interactive HTML visualization is available locally at: ${filePath}`);
                await logProgress(`You can open this HTML file in any web browser to view the interactive chart.`);
              } catch (uploadError) {
                console.error('Failed to upload to workspace:', uploadError);
                await logProgress(`Warning: Failed to save chart to workspace due to API error: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
                await logProgress(`Chart is still available locally at: ${filePath}`);
              }
            } catch (error) {
              console.error('Failed to save chart to workspace:', error);
              await logProgress('Warning: Failed to save chart to workspace, but chart generation was successful');
            }
        }
        
        return html;
      } catch (error) {
        console.error('Error generating price chart:', error);
        throw new Error(`Failed to generate price chart: ${error}`);
      }
    }
  });
  

  
  // Generate market overview capability
  agent.addCapability({
    name: 'generateMarketOverview',
    description: 'Generates a comprehensive market overview visualization',
    schema: z.object({
      topTokens: z.number().optional().describe('Number of top tokens to include (default: 5)'),
      topProtocols: z.number().optional().describe('Number of top protocols to include (default: 5)'),
      options: z.object({
        width: z.number().optional(),
        height: z.number().optional(),
        colorScheme: z.string().optional(),
        title: z.string().optional()
      }).optional().describe('Visualization options')
    }),
    async run({ args }) {
      const { topTokens: topTokenCount = 5, topProtocols: topProtocolsCount = 5, options } = args;
      
      // Gerçek API çağrıları ile market verilerini çek
      // Top tokens
      const topTokens = await dexscreener.getTopTokens('volume', undefined, topTokenCount);
      
      // Top protocols
      const topProtocols = await defillama.getTopProtocols(topProtocolsCount);
      
      // Chains TVL
      const chainsTvl = await defillama.fetchChainsTvl();
      
      // Category distribution
      const categoryDistribution = await defillama.getCategoryDistribution();
      
      // Combine data into a market overview
      const marketData = {
        topTokens,
        topProtocols,
        chainsTvl: chainsTvl.slice(0, 10),
        categoryDistribution: categoryDistribution.slice(0, 8),
        timestamp: new Date().toISOString()
      };
      
      // Use the market overview template
      const template = templateRegistry.get('market-overview');
      if (!template) {
        throw new Error('Market overview template not found');
      }
      
      // Generate the visualization
      const html = await template.generate(marketData, options);
      
      return html;
    }
  });
  
  // Generate TVL chart capability
  agent.addCapability({
    name: 'generateTvlChart',
    description: 'Generates a TVL chart for a DeFi protocol or chain',
    schema: z.object({
      name: z.string().describe('Protocol or chain name'),
      type: z.enum(['protocol', 'chain']).describe('Whether to fetch data for a protocol or chain'),
      options: z.object({
        width: z.number().optional(),
        height: z.number().optional(),
        colorScheme: z.string().optional(),
        title: z.string().optional(),
        showLegend: z.boolean().optional()
      }).optional().describe('Visualization options')
    }),
    async run({ args }) {
      const { name, type, options } = args;
      
      // Gerçek API çağrıları ile TVL verilerini çek
      let tvlData;
      
      if (type === 'protocol') {
        // Protocol data
        tvlData = await defillama.fetchProtocolData(name);
        tvlData = defillama.processProtocolData(tvlData);
        
        // Add historical TVL data if needed
        if (!tvlData.historicalTvl) {
          const historicalTvl = await defillama.fetchHistoricalTvl(name);
          tvlData.historicalTvl = defillama.processTvlData(historicalTvl);
        }
      } else {
        // Chain data with historical TVL
        const historicalTvl = await defillama.fetchChainHistoricalTvl(name);
        tvlData = {
          name,
          chain: name,
          category: 'Blockchain',
          historicalTvl: defillama.processTvlData(historicalTvl),
          timestamp: new Date().toISOString()
        };
      }
      
      // Use the TVL chart template
      const template = templateRegistry.get('tvl-chart');
      if (!template) {
        throw new Error('TVL chart template not found');
      }
      
      // Generate the visualization
      const html = await template.generate(tvlData, options);
      
      return html;
    }
  });
}
