import axios from 'axios';

// Define types for DexScreener API responses
export interface TokenPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: {
      buys: number;
      sells: number;
    };
    h1: {
      buys: number;
      sells: number;
    };
    h6: {
      buys: number;
      sells: number;
    };
    h24: {
      buys: number;
      sells: number;
    };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  marketCap: number;
}

export interface DexScreenerTokenResponse {
  pairs: TokenPair[];
}

// Fetch token data from DexScreener API
/**
 * Resolve token address for DexScreener API
 * Handles special cases and ensures correct address format
 */
function resolveTokenAddress(tokenAddress: string, chain?: string): { address: string, resolvedChain: string } {
  // Normalize input
  const normalizedToken = tokenAddress.toLowerCase();
  const normalizedChain = chain?.toLowerCase() || '';
  
  // Special case for Ethereum (ETH)
  if (
    (normalizedToken.includes('eth') && !normalizedToken.startsWith('0x')) ||
    normalizedToken.includes('ethereum') ||
    normalizedToken.includes('ether')
  ) {
    console.log('Ethereum token detected, using WETH contract address');
    return {
      address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH contract
      resolvedChain: 'ethereum'
    };
  }
  
  // Special case for Bitcoin (BTC) on Ethereum
  if (
    (normalizedToken.includes('btc') || normalizedToken.includes('bitcoin')) &&
    !normalizedToken.startsWith('0x') &&
    (normalizedChain === 'ethereum' || normalizedChain === '')
  ) {
    console.log('Bitcoin on Ethereum detected, using WBTC contract address');
    return {
      address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC contract
      resolvedChain: 'ethereum'
    };
  }
  
  // Handle Osmosis chain format - convert to compatible format or use alternative
  if (normalizedChain === 'osmosis' && normalizedToken.includes('factory/')) {
    // For Osmosis tokens, we need a different approach as DexScreener might not support
    // this specific format. This could be integrating with a different API for Osmosis.
    console.log('Osmosis token format detected, not supported directly by DexScreener');
    // For now, we'll return the original values and handle fallback in the try/catch
    return { address: tokenAddress, resolvedChain: normalizedChain };
  }
  
  // Default case - return original values
  return { address: tokenAddress, resolvedChain: chain || '' };
}


export async function fetchTokenData(
  tokenAddress: string,
  chain?: string
): Promise<DexScreenerTokenResponse> {
  try {
    // Resolve token address based on input parameters
    const { address, resolvedChain } = resolveTokenAddress(tokenAddress, chain);
    
    console.log(`Fetching data for token: ${address} on chain: ${resolvedChain || 'any'}`);
    
    let url = `https://api.dexscreener.com/latest/dex/tokens/${address}`;
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`DexScreener API returned status ${response.status}`);
    }

    // If chain is specified, filter results by chain
    if (resolvedChain) {
      const filteredPairs = response.data.pairs.filter(
        (pair: TokenPair) => pair.chainId.toLowerCase() === resolvedChain.toLowerCase()
      );
      
      response.data.pairs = filteredPairs;
    }

    return response.data;
  } catch (error: any) {
    console.error('Error fetching token data from DexScreener:', error.message);
    throw new Error(`Failed to generate price chart: ${error}`);
  }
}

// Fetch recent pairs data from DexScreener API
export async function fetchRecentPairs(
  limit = 10,
  chainId?: string
): Promise<TokenPair[]> {
  try {
    let url = `https://api.dexscreener.com/latest/dex/pairs/`;
    if (chainId) {
      url += chainId;
    } else {
      url += 'ethereum'; // Default to Ethereum if no chain is specified
    }
    url += '/recent';

    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`DexScreener API returned status ${response.status}`);
    }

    return response.data.pairs.slice(0, limit);
  } catch (error: any) {
    console.error('Error fetching recent pairs from DexScreener:', error.message);
    throw new Error(`Failed to fetch recent pairs: ${error.message}`);
  }
}

// Search for tokens by name or symbol
export async function searchTokens(
  query: string,
  limit = 10
): Promise<TokenPair[]> {
  try {
    const url = `https://api.dexscreener.com/latest/dex/search?q=${query}`;
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`DexScreener API returned status ${response.status}`);
    }

    return response.data.pairs.slice(0, limit);
  } catch (error: any) {
    console.error('Error searching tokens on DexScreener:', error.message);
    throw new Error(`Failed to search tokens: ${error.message}`);
  }
}

// Get top tokens by volume, marketCap, or liquidity
export async function getTopTokens(
  metric: 'volume' | 'liquidity' | 'marketCap' = 'volume',
  chainId?: string,
  limit = 10
): Promise<TokenPair[]> {
  try {
    // In a real implementation, we would need to use a more sophisticated approach
    // since DexScreener doesn't have a direct API for top tokens.
    // For now, we'll fetch recent pairs and sort them based on the metric
    const recentPairs = await fetchRecentPairs(100, chainId);
    
    let sortedPairs: TokenPair[];
    
    switch (metric) {
      case 'volume':
        sortedPairs = recentPairs.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));
        break;
      case 'liquidity':
        sortedPairs = recentPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        break;
      case 'marketCap':
        sortedPairs = recentPairs.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
        break;
      default:
        sortedPairs = recentPairs;
    }
    
    return sortedPairs.slice(0, limit);
  } catch (error: any) {
    console.error('Error fetching top tokens from DexScreener:', error.message);
    throw new Error(`Failed to get top tokens: ${error.message}`);
  }
}

// Process and normalize token data for visualization
export function processTokenData(tokenData: DexScreenerTokenResponse): any {
  if (!tokenData.pairs || tokenData.pairs.length === 0) {
    throw new Error('No token pairs found');
  }

  // Use the first pair for token information
  const mainPair = tokenData.pairs[0];
  
  // Combine data from all pairs
  const allPairs = tokenData.pairs;
  
  // Calculate total volume and liquidity across all pairs
  const totalVolume24h = allPairs.reduce((sum, pair) => sum + (pair.volume?.h24 || 0), 0);
  const totalLiquidity = allPairs.reduce((sum, pair) => sum + (pair.liquidity?.usd || 0), 0);
  
  // Get average price change
  const avgPriceChange24h = allPairs.reduce((sum, pair) => sum + (pair.priceChange?.h24 || 0), 0) / allPairs.length;
  
  // Create a normalized data structure
  return {
    token: {
      name: mainPair.baseToken.name,
      symbol: mainPair.baseToken.symbol,
      address: mainPair.baseToken.address,
    },
    price: {
      usd: parseFloat(mainPair.priceUsd || '0'),
      change24h: avgPriceChange24h,
    },
    volume: {
      usd24h: totalVolume24h,
    },
    liquidity: {
      usd: totalLiquidity,
    },
    marketCap: mainPair.marketCap || 0,
    fdv: mainPair.fdv || 0,
    chains: [...new Set(allPairs.map(pair => pair.chainId))],
    exchanges: [...new Set(allPairs.map(pair => pair.dexId))],
    pairs: allPairs.length,
    transactions24h: allPairs.reduce(
      (sum, pair) => sum + ((pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0)), 
      0
    ),
    buyVsSell24h: {
      buys: allPairs.reduce((sum, pair) => sum + (pair.txns?.h24?.buys || 0), 0),
      sells: allPairs.reduce((sum, pair) => sum + (pair.txns?.h24?.sells || 0), 0),
    },
    timestamp: new Date().toISOString(),
  };
}


/**
 * Fetch historical price data for a token
 * @param tokenAddress Token address
 * @param chain Optional blockchain to filter by
 * @param days Number of days to fetch (default: 7)
 * @returns Historical price data
 */
export async function fetchHistoricalPriceData(
  tokenAddress: string,
  chain?: string,
  days: number = 7
): Promise<any[]> {
  try {
    // Resolve token address based on input parameters
    const { address, resolvedChain } = resolveTokenAddress(tokenAddress, chain);
    
    console.log(`Fetching historical data for token: ${address} on chain: ${resolvedChain || 'any'} for ${days} days`);
    
    // DexScreener API doğrudan tarihsel veri endpoint'i sağlamıyor, bu yüzden
    // önce token bilgilerini alıyoruz
    const tokenData = await fetchTokenData(address, resolvedChain);
    
    if (!tokenData.pairs || tokenData.pairs.length === 0) {
      throw new Error('No token pairs found');
    }
    
    // En likit olan pair'i bulalım (en yüksek hacimli olan)
    const mainPair = tokenData.pairs.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))[0];
    
    // DexScreener'in tarihsel verileri için endpoint
    // Not: Bu endpoint resmi dokümantasyonda yer almayabilir ya da farklı olabilir
    // Kullanılabilir bir API endpoint varsa kullanın, yoksa alternatif bir API kullanılabilir
    const url = `https://api.dexscreener.com/latest/dex/chart/${mainPair.chainId}/${mainPair.pairAddress}?from=${Math.floor(Date.now() / 1000) - days * 86400}`;
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`DexScreener API returned status ${response.status}`);
    }
    
    // API yanıtını işle ve formatlı veri döndür
    // Not: Gerçek API yanıtının yapısı farklı olabilir, buna göre uyarlanmalıdır
    const historicalData = response.data.data || [];
    
    // Veriyi formatlayarak döndür
    return historicalData.map((entry: any) => ({
      date: new Date(entry.time * 1000).toLocaleDateString(),
      price: parseFloat(entry.close || entry.priceUsd || 0),
      volume: parseFloat(entry.volume || 0),
      timestamp: entry.time
    }));
  } catch (error: any) {
    console.error('Error fetching historical price data from DexScreener:', error.message);
    
    // Hata durumunda boş dizi döndür, böylece uygulama çalışmaya devam edebilir
    // ve fallback mekanizması ile sahte veri oluşturabilir
    return [];
  }
}

// DexScreener'in desteklemediği durumlarda alternatif bir API kullanabiliriz
// Bu, CoinGecko API'si kullanılan örnek bir implementasyon
export async function fetchHistoricalPriceFromAlternative(
  tokenId: string,
  days: number = 7
): Promise<any[]> {
  try {
    // CoinGecko API endpoint'i - güncel API key gerektiren bir API kullanılmalıdır
    const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=usd&days=${days}`;
    
    const response = await axios.get(url);
    
    if (response.status !== 200) {
      throw new Error(`CoinGecko API returned status ${response.status}`);
    }
    
    // CoinGecko verilerini formatlayarak döndür
    const prices = response.data.prices || [];
    const volumes = response.data.total_volumes || [];
    
    return prices.map((price: any, index: number) => {
      const timestamp = price[0]; // Unix timestamp in milliseconds
      const priceValue = price[1];
      const volume = volumes[index] ? volumes[index][1] : 0;
      
      return {
        date: new Date(timestamp).toLocaleDateString(),
        price: priceValue,
        volume: volume,
        timestamp: Math.floor(timestamp / 1000)
      };
    });
  } catch (error: any) {
    console.error('Error fetching historical price data from alternative source:', error.message);
    return [];
  }
}
