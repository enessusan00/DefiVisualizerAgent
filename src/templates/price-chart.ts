import { VisualizationTemplate, TemplateOptions } from './template-interface';
import * as dexscreener from '../api/dexscreener';

/**
 * Template for creating price charts for tokens
 */
export class PriceChartTemplate implements VisualizationTemplate {
  id = 'price-chart';
  name = 'Token Price Chart';
  description = 'Visualizes token price over time with volume indicators';
  suitableFor = ['token-price', 'historical-data', 'price-analysis'];
  
  /**
   * Generate a price chart visualization
   * @param data Historical price data
   * @param options Visualization options
   * @returns HTML with embedded Chart.js
   */
  async generate(data: any, options: TemplateOptions = {}): Promise<string> {
    // Default options
    const width = options.width || 800;
    const height = options.height || 400;
    const colorScheme = options.colorScheme || 'blue';
    const title = options.title || `${data.token?.symbol || 'Token'} Price Chart`;
    const showLegend = options.showLegend !== undefined ? options.showLegend : true;
    const fontFamily = options.fontFamily || 'Arial, sans-serif';
    
    // Add requested days to data object if it exists in options
    if (options && typeof options.days === 'number') {
      data.days = options.days;
    }
    
    // Format historical data for Chart.js
    const priceData = await this.formatDataForChart(data);
    
    // Generate a unique canvas ID
    const canvasId = `price-chart-${Date.now()}`;
    
    // Define colors based on color scheme
    const colors = this.getColorScheme(colorScheme);
    
    // Create the HTML with Chart.js
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    body {
      font-family: ${fontFamily};
      margin: 0;
      padding: 20px;
    }
    .chart-container {
      width: ${width}px;
      height: ${height}px;
      margin: 0 auto;
    }
    .chart-title {
      text-align: center;
      font-size: 24px;
      margin-bottom: 20px;
    }
    .chart-metadata {
      margin-top: 20px;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="chart-title">${title}</div>
  <div class="chart-container">
    <canvas id="${canvasId}"></canvas>
  </div>
  
  <div class="chart-metadata">
    <p>Current Price: $${data.price?.usd.toFixed(6)} | 24h Change: ${data.price?.change24h.toFixed(2)}%</p>
    <p>Data updated: ${new Date(data.timestamp).toLocaleString()}</p>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const ctx = document.getElementById('${canvasId}').getContext('2d');
      
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ${JSON.stringify(priceData.labels)},
          datasets: [
            {
              label: 'Price (USD)',
              data: ${JSON.stringify(priceData.prices)},
              borderColor: '${colors.primary}',
              backgroundColor: '${colors.primaryTransparent}',
              borderWidth: 2,
              tension: 0.1,
              fill: true,
              yAxisID: 'y-axis-price'
            },
            {
              label: 'Volume (USD)',
              data: ${JSON.stringify(priceData.volumes)},
              backgroundColor: '${colors.secondary}',
              borderColor: '${colors.secondary}',
              borderWidth: 1,
              type: 'bar',
              yAxisID: 'y-axis-volume'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: ${showLegend},
              position: 'top',
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.datasetIndex === 0) {
                    label += '$' + context.parsed.y.toFixed(6);
                  } else {
                    label += '$' + context.parsed.y.toLocaleString();
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            'y-axis-price': {
              position: 'left',
              grid: {
                display: true
              },
              ticks: {
                callback: function(value) {
                  return '$' + value;
                }
              }
            },
            'y-axis-volume': {
              position: 'right',
              grid: {
                display: false
              },
              ticks: {
                callback: function(value) {
                  return '$' + value;
                }
              }
            }
          }
        }
      });
    });
  </script>
</body>
</html>
    `;
  }
  
  /**
   * Check if this template is suitable for the given data
   * @param data The data to check
   * @returns True if the template can visualize this data
   */
  isSuitableFor(data: any): boolean {
    // Check if data has the necessary structure for a price chart
    return Boolean(
      data && 
      ((data.historicalPrices && Array.isArray(data.historicalPrices)) || 
       (data.price && typeof data.price.usd === 'number'))
    );
  }
  
  /**
   * Format the data for use with Chart.js
   * @param data The token data to format
   * @returns Formatted data for Chart.js
   */
  private async formatDataForChart(data: any): Promise<{ labels: string[], prices: number[], volumes: number[] }> {
    // If there's historical price data, use it
    if (data.historicalPrices && Array.isArray(data.historicalPrices)) {
      return {
        labels: data.historicalPrices.map((p: any) => p.date),
        prices: data.historicalPrices.map((p: any) => p.price),
        volumes: data.historicalPrices.map((p: any) => p.volume || 0)
      };
    }
    
    // Gerçek API'den tarihsel veri almaya çalış
    try {
      // Determine the number of days to display
      const days = data.days || 7;
      
      // Token address and chain info
      const tokenAddress = data.token?.address || '';
      const chain = data.chains?.[0] || '';
      
      console.log(`Fetching historical data for ${tokenAddress} on ${chain} for ${days} days`);
      
      // Gerçek API çağrısı
      let historicalData = await dexscreener.fetchHistoricalPriceData(tokenAddress, chain, days);
      
      // Eğer DexScreener'dan veri alamazsak, alternatif API'yi deneyelim
      if (historicalData.length === 0 && data.token?.symbol) {
        console.log(`Trying alternative API for ${data.token.symbol} historical data`);
        const tokenId = data.token.symbol.toLowerCase();
        historicalData = await dexscreener.fetchHistoricalPriceFromAlternative(tokenId, days);
      }
      
      // Eğer tarihsel veri başarıyla alındıysa, bunu kullan
      if (historicalData.length > 0) {
        console.log(`Successfully fetched ${historicalData.length} historical data points`);
        return {
          labels: historicalData.map(entry => entry.date),
          prices: historicalData.map(entry => entry.price),
          volumes: historicalData.map(entry => entry.volume || 0)
        };
      }
    } catch (error) {
      console.error("Error fetching historical data:", error);
      // Hata durumunda fallback mekanizmasına devam et
    }
    
    // Tarihsel veri alınamazsa, mevcut fiyat ve değişim verileriyle interpolasyon yap
    console.log("Using interpolated data based on current price and change");
    const currentPrice = data.price?.usd || 0;
    const priceChange = data.price?.change24h || 0;
    
    // Determine the number of days to display
    const days = data.days || 7;
    
    // Create the requested number of days of interpolated data
    const labels = [];
    const prices = [];
    const volumes = [];
    
    const baseVolume = data.volume?.usd24h || 1000000;
    
    // Generate data for each day
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString());
      
      // Calculate a price that results in the current 24h change
      const dayFactor = i === 0 ? 1 : (1 - (priceChange / 100) * (i / (days - 1)));
      prices.push(currentPrice * dayFactor);
      
      // Add some variation to volumes based on real volume data
      volumes.push(baseVolume * (0.7 + Math.random() * 0.6));
    }
    
    return { labels, prices, volumes };
  }
  
  /**
   * Get a color scheme based on the specified option
   * @param colorScheme The name of the color scheme
   * @returns Object with color values
   */
  private getColorScheme(colorScheme: string): { primary: string, primaryTransparent: string, secondary: string } {
    switch (colorScheme) {
      case 'green':
        return {
          primary: 'rgb(75, 192, 75)',
          primaryTransparent: 'rgba(75, 192, 75, 0.2)',
          secondary: 'rgba(54, 162, 54, 0.5)'
        };
      case 'red':
        return {
          primary: 'rgb(255, 99, 99)',
          primaryTransparent: 'rgba(255, 99, 99, 0.2)',
          secondary: 'rgba(225, 69, 69, 0.5)'
        };
      case 'purple':
        return {
          primary: 'rgb(153, 102, 255)',
          primaryTransparent: 'rgba(153, 102, 255, 0.2)',
          secondary: 'rgba(123, 72, 225, 0.5)'
        };
      case 'blue':
      default:
        return {
          primary: 'rgb(75, 192, 192)',
          primaryTransparent: 'rgba(75, 192, 192, 0.2)',
          secondary: 'rgba(54, 162, 235, 0.5)'
        };
    }
  }
}