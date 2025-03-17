import { VisualizationTemplate, TemplateOptions } from './template-interface';

/**
 * Template for creating TVL (Total Value Locked) charts for DeFi protocols
 */
export class TvlChartTemplate implements VisualizationTemplate {
  id = 'tvl-chart';
  name = 'TVL Chart';
  description = 'Visualizes Total Value Locked in a DeFi protocol or chain over time';
  suitableFor = ['tvl-data', 'protocol-analysis', 'historical-tvl'];
  
  /**
   * Generate a TVL chart visualization
   * @param data Historical TVL data
   * @param options Visualization options
   * @returns HTML with embedded Chart.js
   */
  async generate(data: any, options: TemplateOptions = {}): Promise<string> {
    // Default options
    const width = options.width || 800;
    const height = options.height || 400;
    const colorScheme = options.colorScheme || 'blue';
    const title = options.title || `${data.name || 'Protocol'} TVL Chart`;
    const showLegend = options.showLegend !== undefined ? options.showLegend : true;
    const fontFamily = options.fontFamily || 'Arial, sans-serif';
    
    // Format TVL data for Chart.js
    const tvlData = this.formatDataForChart(data);
    
    // Generate a unique canvas ID
    const canvasId = `tvl-chart-${Date.now()}`;
    
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
    .chart-subtitle {
      text-align: center;
      font-size: 16px;
      color: #666;
      margin-bottom: 30px;
    }
    .chart-metadata {
      margin-top: 20px;
      font-size: 14px;
      color: #666;
      text-align: center;
    }
    .tvl-stats {
      display: flex;
      justify-content: center;
      margin-top: 20px;
      gap: 30px;
    }
    .tvl-stat-box {
      padding: 15px;
      background-color: #f9f9f9;
      border-radius: 8px;
      text-align: center;
      min-width: 150px;
    }
    .stat-value {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .positive {
      color: #4caf50;
    }
    .negative {
      color: #f44336;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="chart-title">${title}</div>
  <div class="chart-subtitle">${data.category || 'DeFi Protocol'} | ${data.chain || 'Multiple Chains'}</div>
  
  <div class="chart-container">
    <canvas id="${canvasId}"></canvas>
  </div>
  
  <div class="tvl-stats">
    <div class="tvl-stat-box">
      <div class="stat-value">$${this.formatNumber(data.tvl?.current || 0)}</div>
      <div class="stat-label">Current TVL</div>
    </div>
    
    <div class="tvl-stat-box">
      <div class="stat-value ${data.tvl?.change1d >= 0 ? 'positive' : 'negative'}">
        ${data.tvl?.change1d >= 0 ? '+' : ''}${data.tvl?.change1d?.toFixed(2) || '0.00'}%
      </div>
      <div class="stat-label">24h Change</div>
    </div>
    
    <div class="tvl-stat-box">
      <div class="stat-value ${data.tvl?.change7d >= 0 ? 'positive' : 'negative'}">
        ${data.tvl?.change7d >= 0 ? '+' : ''}${data.tvl?.change7d?.toFixed(2) || '0.00'}%
      </div>
      <div class="stat-label">7d Change</div>
    </div>
  </div>
  
  <div class="chart-metadata">
    <p>Data updated: ${new Date(data.timestamp || Date.now()).toLocaleString()}</p>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const ctx = document.getElementById('${canvasId}').getContext('2d');
      
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ${JSON.stringify(tvlData.labels)},
          datasets: [
            {
              label: 'TVL (USD)',
              data: ${JSON.stringify(tvlData.values)},
              borderColor: '${colors.primary}',
              backgroundColor: '${colors.primaryTransparent}',
              borderWidth: 2,
              tension: 0.1,
              fill: true
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
                  label += '$' + context.parsed.y.toLocaleString();
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
            y: {
              grid: {
                display: true
              },
              ticks: {
                callback: function(value) {
                  return '$' + value.toLocaleString();
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
    // Check if data has the necessary structure for a TVL chart
    return Boolean(
      data && 
      ((data.tvl && typeof data.tvl === 'object') || 
       (data.historicalTvl && Array.isArray(data.historicalTvl)))
    );
  }
  
  /**
   * Format the data for use with Chart.js
   * @param data The protocol data to format
   * @returns Formatted data for Chart.js
   */
  private formatDataForChart(data: any): { labels: string[], values: number[] } {
    // If there's historical TVL data, use it
    if (data.historicalTvl && Array.isArray(data.historicalTvl)) {
      return {
        labels: data.historicalTvl.map((entry: any) => entry.date),
        values: data.historicalTvl.map((entry: any) => entry.tvl)
      };
    }
    
    // Otherwise, generate mock data based on current TVL and changes
    const currentTvl = data.tvl?.current || 1000000;
    const change7d = data.tvl?.change7d || 0;
    
    // Create 30 days of mock data
    const labels = [];
    const values = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString());
      
      // Calculate a TVL value that results in the current 7d change
      const dayFactor = 1 + (change7d / 100) * (Math.sin(i / 5) * 0.3 + 0.7) * (i < 7 ? (7 - i) / 7 : 0);
      const value = currentTvl / dayFactor;
      
      values.push(value);
    }
    
    return { labels, values };
  }
  
  /**
   * Format a number for display (e.g., 1,234,567)
   * @param num The number to format
   * @returns Formatted number string
   */
  private formatNumber(num: number): string {
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
