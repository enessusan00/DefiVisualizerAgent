# DeFiVisualizer: Automatic Infographic and Analysis Visual Generator

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Dependencies](https://img.shields.io/badge/dependencies-up%20to%20date-brightgreen)

A powerful DeFi analytics agent built with [OpenServ Labs SDK](https://github.com/openserv-labs/sdk) that transforms complex blockchain data into beautiful visualizations. DeFiVisualizer automatically fetches, processes, and visualizes critical DeFi metrics, delivering comprehensive infographics and dashboards with minimal effort.

## Features

- 📊 Automatically fetches real-time data from DexScreener and DefiLlama APIs
- 📈 Transforms complex DeFi data into beautiful, interactive visualizations
- 🖼️ Provides multiple templates for different data types and use cases
- 📱 Creates social media-ready graphics for market updates
- 🔄 Supports customizable parameters and time frames
- 🤖 Works as a standalone tool or as part of OpenServ agent workflows
- 🎨 Features customizable styling and branding options

## Prerequisites

### 1. Required API Key
- OpenServ API key (Get it from [OpenServ Platform](https://platform.openserv.ai))

### 2. System Requirements
- Node.js 18 or higher
- NPM or Yarn

## Setup

1. Clone this repository:
```bash
git clone https://github.com/enessusan00/DefiVisualizerAgent.git
cd defi-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Create and configure environment variables:
```bash
cp .env.example .env
```

4. Update the `.env` file with your API key:
```env
OPENSERV_API_KEY=your_openserv_api_key
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

## Usage on OpenServ Platform

1. Create an Agent:
   - Go to Developer -> Add Agent
   - Name: "DeFiVisualizer"
   - Add comprehensive capabilities description
   - Set endpoint URL to your deployed instance

2. Create a Project:
   - Go to Projects -> Create New Project
   - Add your DeFi analysis requirements
   - Add DeFiVisualizer to the project
   - Example project detail:
      ```
      Create a price chart for Ethereum (ETH) for the last 7 days. The chart should use a green color scheme and show volume information along with the price change.
      ```
   - Run the project

3. The agent will generate:
   - Token price history visualizations
   - Market comparison dashboards
   - Holder distribution graphics
   - Custom infographics based on parameters


### Local Deployment

For local development with tunneling:
```bash
# Using ngrok
ngrok http <port>
```

## Project Structure

```
├-- output/                 # Output directory for generated visualizations
├── src/
│   ├── index.ts            # Main entry point
│   ├── api/                # API client code for data sources
│   ├── templates/          # Visualization templates
│   ├── generators/         # Visualization generation code  
│   ├── distribution/       # Social media distribution utilities
└── package.json
```

## Available Visualization Types

- `price-chart`: Token price history with volume
- `market-overview`: Multi-token comparison dashboard
- `social-distribution`: Token holder and social metrics

## Build

Create production build:
```bash
npm run build
npm start
```

## Technical Details

- **Framework**: OpenServ Labs SDK
- **Language**: TypeScript
- **Visualization Libraries**: Chart.js, D3.js
- **Data Sources**:
  - DexScreener API
  - DefiLlama API
  - Blockchain node providers
## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenServ Labs SDK for the agent framework
- Chart.js and D3.js for visualization capabilities
- DexScreener and DefiLlama for DeFi data

## Support

For support, please visit:
- [OpenServ Documentation](https://docs.openserv.ai)
- [GitHub Issues](https://github.com/yourusername/defi-visualizer/issues)
