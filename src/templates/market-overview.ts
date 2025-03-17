import { VisualizationTemplate, TemplateOptions } from './template-interface';

/**
 * Template for creating a comprehensive market overview
 */
export class MarketOverviewTemplate implements VisualizationTemplate {
  id = 'market-overview';
  name = 'DeFi Market Overview';
  description = 'Comprehensive overview of the DeFi market with multiple visualizations';
  suitableFor = ['market-data', 'defi-overview', 'multi-metric'];
  
  /**
   * Generate a market overview visualization
   * @param data Market overview data
   * @param options Visualization options
   * @returns HTML with embedded visualizations
   */
  async generate(data: any, options: TemplateOptions = {}): Promise<string> {
    // Default options
    const width = options.width || 1200;
    const height = options.height || 800;
    const colorScheme = options.colorScheme || 'blue';
    const title = options.title || 'DeFi Market Overview';
    const fontFamily = options.fontFamily || 'Arial, sans-serif';
    
    // Generate unique IDs for the charts
    const topTokensChartId = `top-tokens-chart-${Date.now()}`;
    const topProtocolsChartId = `top-protocols-chart-${Date.now()}`;
    const chainsTvlChartId = `chains-tvl-chart-${Date.now()}`;
    const categoryDistributionChartId = `category-distribution-chart-${Date.now()}`;
    
    // Format the data for the charts
    const formattedData = this.formatDataForCharts(data);
    
    // Define colors based on color scheme
    const colors = this.getColorScheme(colorScheme);
    
    // Create the HTML with multiple Chart.js visualizations
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
      background-color: #f9f9f9;
    }
    .dashboard {
      max-width: ${width}px;
      margin: 0 auto;
    }
    .dashboard-title {
      text-align: center;
      font-size: 28px;
      margin-bottom: 30px;
      color: #333;
    }
    .dashboard-timestamp {
      text-align: center;
      font-size: 14px;
      color: #666;
      margin-bottom: 30px;
    }
    .row {
      display: flex;
      margin-bottom: 30px;
    }
    .chart-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
      margin: 0 15px;
      flex: 1;
    }
    .chart-title {
      text-align: center;
      font-size: 18px;
      margin-bottom: 15px;
      color: #333;
    }
    canvas {
      width: 100% !important;
      height: 250px !important;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .positive {
      color: #4caf50;
    }
    .negative {
      color: #f44336;
    }
  </style>
</head>
<body>
  <div class="dashboard">
    <div class="dashboard-title">${title}</div>
    <div class="dashboard-timestamp">Data updated: ${new Date(data.timestamp).toLocaleString()}</div>
    
    <!-- First row: Top Tokens and Top Protocols -->
    <div class="row">
      <div class="chart-container">
        <div class="chart-title">Top Tokens by Volume</div>
        <canvas id="${topTokensChartId}"></canvas>
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Price (USD)</th>
              <th>24h Change</th>
              <th>24h Volume</th>
            </tr>
          </thead>
          <tbody>
            ${this.generateTopTokensTable(data.topTokens)}
          </tbody>
        </table>
      </div>
      
      <div class="chart-container">
        <div class="chart-title">Top Protocols by TVL</div>
        <canvas id="${topProtocolsChartId}"></canvas>
        <table>
          <thead>
            <tr>
              <th>Protocol</th>
              <th>TVL (USD)</th>
              <th>24h Change</th>
              <th>Category</th>
            </tr>
          </thead>
          <tbody>
            ${this.generateTopProtocolsTable(data.topProtocols)}
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Second row: Chains TVL and Category Distribution -->
    <div class="row">
      <div class="chart-container">
        <div class="chart-title">Chains by TVL</div>
        <canvas id="${chainsTvlChartId}"></canvas>
      </div>
      
      <div class="chart-container">
        <div class="chart-title">DeFi Category Distribution</div>
        <canvas id="${categoryDistributionChartId}"></canvas>
      </div>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Top Tokens Chart
      new Chart(document.getElementById('${topTokensChartId}').getContext('2d'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(formattedData.topTokens.labels)},
          datasets: [{
            label: '24h Volume (USD)',
            data: ${JSON.stringify(formattedData.topTokens.values)},
            backgroundColor: ${JSON.stringify(formattedData.topTokens.colors)},
            borderColor: ${JSON.stringify(formattedData.topTokens.borderColors)},
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return 'Volume: $' + context.parsed.y.toLocaleString();
                }
              }
            }
          }
        }
      });
      
      // Top Protocols Chart
      new Chart(document.getElementById('${topProtocolsChartId}').getContext('2d'), {
        type: 'bar',
        data: {
          labels: ${JSON.stringify(formattedData.topProtocols.labels)},
          datasets: [{
            label: 'TVL (USD)',
            data: ${JSON.stringify(formattedData.topProtocols.values)},
            backgroundColor: ${JSON.stringify(formattedData.topProtocols.colors)},
            borderColor: ${JSON.stringify(formattedData.topProtocols.borderColors)},
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return 'TVL: $' + context.parsed.y.toLocaleString();
                }
              }
            }
          }
        }
      });
      
      // Chains TVL Chart
      new Chart(document.getElementById('${chainsTvlChartId}').getContext('2d'), {
        type: 'pie',
        data: {
          labels: ${JSON.stringify(formattedData.chainsTvl.labels)},
          datasets: [{
            data: ${JSON.stringify(formattedData.chainsTvl.values)},
            backgroundColor: ${JSON.stringify(formattedData.chainsTvl.colors)},
            borderColor: ${JSON.stringify(formattedData.chainsTvl.borderColors)},
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value * 100) / total).toFixed(1);
                  return context.label + ': $' + value.toLocaleString() + ' (' + percentage + '%)';
                }
              }
            }
          }
        }
      });
      
      // Category Distribution Chart
      new Chart(document.getElementById('${categoryDistributionChartId}').getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ${JSON.stringify(formattedData.categoryDistribution.labels)},
          datasets: [{
            data: ${JSON.stringify(formattedData.categoryDistribution.values)},
            backgroundColor: ${JSON.stringify(formattedData.categoryDistribution.colors)},
            borderColor: ${JSON.stringify(formattedData.categoryDistribution.borderColors)},
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value * 100) / total).toFixed(1);
                  return context.label + ': $' + value.toLocaleString() + ' (' + percentage + '%)';
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
    // Check if data has the necessary structure for a market overview
    return Boolean(
      data && 
      ((data.topTokens && Array.isArray(data.topTokens)) || 
       (data.topProtocols && Array.isArray(data.topProtocols)))
    );
  }
  
  /**
   * Format the data for use with Chart.js
   * @param data The market data to format
   * @returns Formatted data for Chart.js
   */
  private formatDataForCharts(data: any): any {
    // Format data for top tokens chart
    const topTokens: {
      labels: string[];
      values: number[];
      colors: string[];
      borderColors: string[];
    } = {
      labels: data.topTokens?.map((token: any) => token.baseToken?.symbol || 'Unknown') || [],
      values: data.topTokens?.map((token: any) => token.volume?.h24 || 0) || [],
      colors: [],
      borderColors: []
    };
    
    // Format data for top protocols chart
    const topProtocols: {
      labels: string[];
      values: number[];
      colors: string[];
      borderColors: string[];
    } = {
      labels: data.topProtocols?.map((protocol: any) => protocol.name || 'Unknown') || [],
      values: data.topProtocols?.map((protocol: any) => protocol.tvl || 0) || [],
      colors: [],
      borderColors: []
    };
    
    // Format data for chains TVL chart
    const chainsTvl: {
      labels: string[];
      values: number[];
      colors: string[];
      borderColors: string[];
    } = {
      labels: data.chainsTvl?.map((chain: any) => chain.name || 'Unknown') || [],
      values: data.chainsTvl?.map((chain: any) => chain.tvl || 0) || [],
      colors: [],
      borderColors: []
    };
    
    // Format data for category distribution chart
    const categoryDistribution: {
      labels: string[];
      values: number[];
      colors: string[];
      borderColors: string[];
    } = {
      labels: data.categoryDistribution?.map((category: any) => category.category || 'Unknown') || [],
      values: data.categoryDistribution?.map((category: any) => category.tvl || 0) || [],
      colors: [],
      borderColors: []
    };
    
    // Generate colors for all charts
    const baseColors = this.generateChartColors(Math.max(
      topTokens.labels.length,
      topProtocols.labels.length,
      chainsTvl.labels.length,
      categoryDistribution.labels.length
    ));
    
    // Assign colors to each chart
    topTokens.colors = baseColors.slice(0, topTokens.labels.length);
    topTokens.borderColors = topTokens.colors.map(color => color.replace('0.7', '1'));
    
    topProtocols.colors = baseColors.slice(0, topProtocols.labels.length);
    topProtocols.borderColors = topProtocols.colors.map(color => color.replace('0.7', '1'));
    
    chainsTvl.colors = baseColors.slice(0, chainsTvl.labels.length);
    chainsTvl.borderColors = chainsTvl.colors.map(color => color.replace('0.7', '1'));
    
    categoryDistribution.colors = baseColors.slice(0, categoryDistribution.labels.length);
    categoryDistribution.borderColors = categoryDistribution.colors.map(color => color.replace('0.7', '1'));
    
    return { topTokens, topProtocols, chainsTvl, categoryDistribution };
  }
  
  /**
   * Generate HTML table rows for top tokens
   * @param tokens Array of token data
   * @returns HTML table rows
   */
  private generateTopTokensTable(tokens: any[]): string {
    if (!tokens || !Array.isArray(tokens)) {
      return '<tr><td colspan="4">No data available</td></tr>';
    }
    
    return tokens.map(token => {
      const priceUsd = parseFloat(token.priceUsd || '0');
      const priceChange = token.priceChange?.h24 || 0;
      const volume = token.volume?.h24 || 0;
      
      const changeClass = priceChange >= 0 ? 'positive' : 'negative';
      const changeSign = priceChange >= 0 ? '+' : '';
      
      return `
        <tr>
          <td>${token.baseToken?.symbol || 'Unknown'}</td>
          <td>$${priceUsd.toFixed(6)}</td>
          <td class="${changeClass}">${changeSign}${priceChange.toFixed(2)}%</td>
          <td>$${volume.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
  }
  
  /**
   * Generate HTML table rows for top protocols
   * @param protocols Array of protocol data
   * @returns HTML table rows
   */
  private generateTopProtocolsTable(protocols: any[]): string {
    if (!protocols || !Array.isArray(protocols)) {
      return '<tr><td colspan="4">No data available</td></tr>';
    }
    
    return protocols.map(protocol => {
      const tvl = protocol.tvl || 0;
      const change = protocol.change_1d || 0;
      
      const changeClass = change >= 0 ? 'positive' : 'negative';
      const changeSign = change >= 0 ? '+' : '';
      
      return `
        <tr>
          <td>${protocol.name || 'Unknown'}</td>
          <td>$${tvl.toLocaleString()}</td>
          <td class="${changeClass}">${changeSign}${change.toFixed(2)}%</td>
          <td>${protocol.category || 'Unknown'}</td>
        </tr>
      `;
    }).join('');
  }
  
  /**
   * Generate colors for charts
   * @param count Number of colors to generate
   * @returns Array of colors
   */
  private generateChartColors(count: number): string[] {
    // Predefined set of colors for consistency
    const colors = [
      'rgba(75, 192, 192, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(255, 99, 132, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(231, 233, 237, 0.7)',
      'rgba(75, 192, 150, 0.7)',
      'rgba(54, 135, 235, 0.7)',
      'rgba(153, 155, 255, 0.7)',
      'rgba(255, 120, 64, 0.7)',
      'rgba(230, 99, 132, 0.7)',
      'rgba(255, 180, 86, 0.7)',
      'rgba(200, 233, 237, 0.7)',
      'rgba(120, 192, 192, 0.7)',
      'rgba(100, 162, 235, 0.7)'
    ];
    
    // If we need more colors than available, repeat the array
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    
    return result;
  }
  
  /**
   * Get a color scheme based on the specified option
   * @param colorScheme The name of the color scheme
   * @returns Object with color values
   */
  private getColorScheme(colorScheme: string): { primary: string, secondary: string, accent: string } {
    switch (colorScheme) {
      case 'green':
        return {
          primary: 'rgb(75, 192, 75)',
          secondary: 'rgb(54, 162, 54)',
          accent: 'rgb(153, 255, 153)'
        };
      case 'red':
        return {
          primary: 'rgb(255, 99, 99)',
          secondary: 'rgb(225, 69, 69)',
          accent: 'rgb(255, 153, 153)'
        };
      case 'purple':
        return {
          primary: 'rgb(153, 102, 255)',
          secondary: 'rgb(123, 72, 225)',
          accent: 'rgb(180, 153, 255)'
        };
      case 'blue':
      default:
        return {
          primary: 'rgb(75, 192, 192)',
          secondary: 'rgb(54, 162, 235)',
          accent: 'rgb(153, 225, 255)'
        };
    }
  }
}
