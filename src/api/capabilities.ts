import { Agent } from '@openserv-labs/sdk';
import { z } from 'zod';
import * as dexscreener from './dexscreener';
import * as defillama from './defillama';

export function registerDataCapabilities(agent: Agent) {
  // DexScreener capabilities
  agent.addCapability({
    name: 'fetchTokenData',
    description: 'Fetches token data from DexScreener API',
    schema: z.object({
      tokenAddress: z.string().describe('The token address to fetch data for'),
      chain: z.string().optional().describe('Optional blockchain to filter results by (e.g., ethereum, bsc)')
    }),
    async run({ args }) {
      const { tokenAddress, chain } = args;
      const tokenData = await dexscreener.fetchTokenData(tokenAddress, chain);
      const processedData = dexscreener.processTokenData(tokenData);
      return JSON.stringify(processedData);
    }
  });

  agent.addCapability({
    name: 'searchTokens',
    description: 'Searches for tokens by name or symbol using DexScreener API',
    schema: z.object({
      query: z.string().describe('Search query (token name or symbol)'),
      limit: z.number().optional().describe('Maximum number of results to return')
    }),
    async run({ args }) {
      const { query, limit } = args;
      const results = await dexscreener.searchTokens(query, limit);
      return JSON.stringify(results);
    }
  });

  agent.addCapability({
    name: 'getTopTokens',
    description: 'Gets top tokens by volume, liquidity, or market cap',
    schema: z.object({
      metric: z.enum(['volume', 'liquidity', 'marketCap']).describe('Metric to sort by'),
      chainId: z.string().optional().describe('Optional blockchain to filter results by'),
      limit: z.number().optional().describe('Maximum number of results to return')
    }),
    async run({ args }) {
      const { metric, chainId, limit } = args;
      const topTokens = await dexscreener.getTopTokens(metric, chainId, limit);
      return JSON.stringify(topTokens);
    }
  });

  // DefiLlama capabilities
  agent.addCapability({
    name: 'fetchProtocolData',
    description: 'Fetches protocol data from DefiLlama API',
    schema: z.object({
      protocolName: z.string().describe('The name of the protocol to fetch data for')
    }),
    async run({ args }) {
      const { protocolName } = args;
      const protocolData = await defillama.fetchProtocolData(protocolName);
      const processedData = defillama.processProtocolData(protocolData);
      return JSON.stringify(processedData);
    }
  });

  agent.addCapability({
    name: 'getTopProtocols',
    description: 'Gets top DeFi protocols by TVL',
    schema: z.object({
      limit: z.number().optional().describe('Maximum number of results to return'),
      category: z.string().optional().describe('Optional category to filter by')
    }),
    async run({ args }) {
      const { limit, category } = args;
      const topProtocols = await defillama.getTopProtocols(limit, category);
      return JSON.stringify(topProtocols);
    }
  });

  agent.addCapability({
    name: 'getCategoryDistribution',
    description: 'Gets DeFi protocol distribution by category',
    schema: z.object({}),
    async run() {
      const distribution = await defillama.getCategoryDistribution();
      return JSON.stringify(distribution);
    }
  });

  agent.addCapability({
    name: 'fetchChainsTvl',
    description: 'Fetches TVL data for all chains',
    schema: z.object({}),
    async run() {
      const chainsTvl = await defillama.fetchChainsTvl();
      return JSON.stringify(chainsTvl);
    }
  });

  agent.addCapability({
    name: 'fetchHistoricalTvl',
    description: 'Fetches historical TVL data for a protocol or chain',
    schema: z.object({
      name: z.string().describe('Protocol or chain name'),
      type: z.enum(['protocol', 'chain']).describe('Whether to fetch data for a protocol or chain')
    }),
    async run({ args }) {
      const { name, type } = args;
      
      if (type === 'protocol') {
        const historicalTvl = await defillama.fetchHistoricalTvl(name);
        const processedData = defillama.processTvlData(historicalTvl);
        return JSON.stringify(processedData);
      } else {
        const historicalTvl = await defillama.fetchChainHistoricalTvl(name);
        const processedData = defillama.processTvlData(historicalTvl);
        return JSON.stringify(processedData);
      }
    }
  });

  // Combined data capabilities
  agent.addCapability({
    name: 'getMarketOverview',
    description: 'Gets a comprehensive market overview combining token and protocol data',
    schema: z.object({
      tokens: z.number().optional().describe('Number of top tokens to include'),
      protocols: z.number().optional().describe('Number of top protocols to include')
    }),
    async run({ args }) {
      const { tokens = 5, protocols = 5 } = args;
      
      // Fetch top tokens by volume
      const topTokens = await dexscreener.getTopTokens('volume', undefined, tokens);
      
      // Fetch top protocols by TVL
      const topProtocols = await defillama.getTopProtocols(protocols);
      
      // Fetch chains TVL
      const chainsTvl = await defillama.fetchChainsTvl();
      
      // Get category distribution
      const categoryDistribution = await defillama.getCategoryDistribution();
      
      // Combine data into a market overview
      const marketOverview = {
        topTokens,
        topProtocols,
        chainsTvl: chainsTvl.slice(0, 10), // Top 10 chains
        categoryDistribution: categoryDistribution.slice(0, 8), // Top 8 categories
        timestamp: new Date().toISOString()
      };
      
      return JSON.stringify(marketOverview);
    }
  });
}
