import axios from 'axios';

// Define types for DefiLlama API responses
export interface Protocol {
  id: string;
  name: string;
  address?: string;
  symbol: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  tvl: number;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  category: string;
}

export interface ChainTvl {
  name: string;
  tvl: number;
  tokenSymbol: string;
  change_1h: number;
  change_1d: number;
  change_7d: number;
}

export interface HistoricalTvl {
  date: number;
  tvl: number;
}

// Fetch protocol data from DefiLlama API
export async function fetchProtocolData(protocolName: string): Promise<Protocol> {
  try {
    const url = `https://api.llama.fi/protocol/${protocolName}`;
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`DefiLlama API returned status ${response.status}`);
    }

    return response.data;
  } catch (error: any) {
    console.error('Error fetching protocol data from DefiLlama:', error.message);
    throw new Error(`Failed to fetch protocol data: ${error.message}`);
  }
}

// Fetch TVL data for all protocols from DefiLlama API
export async function fetchAllProtocols(): Promise<Protocol[]> {
  try {
    const url = 'https://api.llama.fi/protocols';
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`DefiLlama API returned status ${response.status}`);
    }

    return response.data;
  } catch (error: any) {
    console.error('Error fetching all protocols from DefiLlama:', error.message);
    throw new Error(`Failed to fetch all protocols: ${error.message}`);
  }
}

// Fetch TVL data for all chains from DefiLlama API
export async function fetchChainsTvl(): Promise<ChainTvl[]> {
  try {
    const url = 'https://api.llama.fi/chains';
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`DefiLlama API returned status ${response.status}`);
    }

    return response.data;
  } catch (error: any) {
    console.error('Error fetching chains TVL from DefiLlama:', error.message);
    throw new Error(`Failed to fetch chains TVL: ${error.message}`);
  }
}

// Fetch historical TVL data for a protocol from DefiLlama API
export async function fetchHistoricalTvl(protocolName: string): Promise<HistoricalTvl[]> {
  try {
    const url = `https://api.llama.fi/protocol/${protocolName}/chart`;
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`DefiLlama API returned status ${response.status}`);
    }

    return response.data;
  } catch (error: any) {
    console.error('Error fetching historical TVL from DefiLlama:', error.message);
    throw new Error(`Failed to fetch historical TVL: ${error.message}`);
  }
}

// Fetch historical TVL data for a specific chain from DefiLlama API
export async function fetchChainHistoricalTvl(chainName: string): Promise<HistoricalTvl[]> {
  try {
    const url = `https://api.llama.fi/charts/${chainName}`;
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`DefiLlama API returned status ${response.status}`);
    }

    return response.data;
  } catch (error: any) {
    console.error('Error fetching chain historical TVL from DefiLlama:', error.message);
    throw new Error(`Failed to fetch chain historical TVL: ${error.message}`);
  }
}

// Process and normalize protocol data for visualization
export function processProtocolData(protocolData: Protocol): any {
  return {
    name: protocolData.name,
    symbol: protocolData.symbol,
    category: protocolData.category,
    chain: protocolData.chain,
    tvl: {
      current: protocolData.tvl,
      change1h: protocolData.change_1h,
      change1d: protocolData.change_1d,
      change7d: protocolData.change_7d,
    },
    logo: protocolData.logo,
    url: protocolData.url,
    description: protocolData.description,
    timestamp: new Date().toISOString(),
  };
}

// Process and normalize TVL data for visualization
export function processTvlData(tvlData: HistoricalTvl[]): any {
  // Convert timestamp to date string and format TVL value
  return tvlData.map(entry => ({
    date: new Date(entry.date * 1000).toISOString().split('T')[0], // Convert to YYYY-MM-DD
    tvl: entry.tvl ? parseFloat(entry.tvl.toFixed(2)) : 0,
  }));
}

// Get top protocols by TVL
export async function getTopProtocols(limit = 10, category?: string): Promise<Protocol[]> {
  const allProtocols = await fetchAllProtocols();
  
  // Filter by category if specified
  let filteredProtocols = category 
    ? allProtocols.filter(p => p.category.toLowerCase() === category.toLowerCase())
    : allProtocols;
  
  // Sort by TVL (descending)
  const sortedProtocols = filteredProtocols.sort((a, b) => b.tvl - a.tvl);
  
  // Return top N protocols
  return sortedProtocols.slice(0, limit);
}

// Get category distribution
export async function getCategoryDistribution(): Promise<{ category: string; tvl: number }[]> {
  const allProtocols = await fetchAllProtocols();
  
  // Group protocols by category and sum TVL
  const categoryMap = new Map<string, number>();
  
  allProtocols.forEach(protocol => {
    const currentTvl = categoryMap.get(protocol.category) || 0;
    categoryMap.set(protocol.category, currentTvl + protocol.tvl);
  });
  
  // Convert map to array and sort by TVL
  const categoryDistribution = Array.from(categoryMap.entries())
    .map(([category, tvl]) => ({ category, tvl }))
    .sort((a, b) => b.tvl - a.tvl);
  
  return categoryDistribution;
}
