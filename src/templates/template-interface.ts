/**
 * Interface for visualization templates
 * All templates must implement this interface
 */
export interface VisualizationTemplate {
  /**
   * Unique identifier for the template
   */
  id: string;
  
  /**
   * Display name for the template
   */
  name: string;
  
  /**
   * Description of what the template visualizes
   */
  description: string;
  
  /**
   * Categories of data this template is suitable for
   */
  suitableFor: string[];
  
  /**
   * Generate the visualization code based on the provided data
   * @param data The data to visualize
   * @param options Optional configuration options
   * @returns The HTML/SVG code for the visualization
   */
  generate(data: any, options?: TemplateOptions): Promise<string>;
  
  /**
   * Check if this template is suitable for the given data
   * @param data The data to check
   * @returns True if the template can visualize this data
   */
  isSuitableFor(data: any): boolean;
}

/**
 * Template options for customizing visualizations
 */
export interface TemplateOptions {
  /**
   * Width of the visualization
   */
  width?: number;
  
  /**
   * Height of the visualization
   */
  height?: number;
  
  /**
   * Color scheme or theme for the visualization
   */
  colorScheme?: string;
  
  /**
   * Title for the visualization
   */
  title?: string;
  
  /**
   * Include a legend (if applicable)
   */
  showLegend?: boolean;
  
  /**
   * Font family to use
   */
  fontFamily?: string;
  
  /**
   * Additional custom options
   */
  [key: string]: any;
}

/**
 * Formats for exporting visualizations
 */
export enum VisualizationFormat {
  SVG = 'svg',
  PNG = 'png',
  HTML = 'html',
  JSON = 'json'
}

/**
 * Types of visualizations that can be created
 */
export enum VisualizationType {
  PRICE_CHART = 'price-chart',
  VOLUME_CHART = 'volume-chart',
  PIE_CHART = 'pie-chart',
  BAR_CHART = 'bar-chart',
  LINE_CHART = 'line-chart',
  AREA_CHART = 'area-chart',
  SCATTER_PLOT = 'scatter-plot',
  MARKET_OVERVIEW = 'market-overview',
  TOKEN_COMPARISON = 'token-comparison',
  TVL_CHART = 'tvl-chart',
  CHAIN_COMPARISON = 'chain-comparison',
  PROTOCOL_COMPARISON = 'protocol-comparison'
}

/**
 * Registry for visualization templates
 */
export class TemplateRegistry {
  private templates: Map<string, VisualizationTemplate> = new Map();
  
  /**
   * Register a new template
   * @param template The template to register
   */
  register(template: VisualizationTemplate): void {
    this.templates.set(template.id, template);
  }
  
  /**
   * Get a template by ID
   * @param id Template ID
   * @returns The template or undefined if not found
   */
  get(id: string): VisualizationTemplate | undefined {
    return this.templates.get(id);
  }
  
  /**
   * Get all registered templates
   * @returns Array of templates
   */
  getAll(): VisualizationTemplate[] {
    return Array.from(this.templates.values());
  }
  
  /**
   * Find suitable templates for the given data
   * @param data The data to check templates against
   * @returns Array of suitable templates
   */
  findSuitableTemplates(data: any): VisualizationTemplate[] {
    return this.getAll().filter(template => template.isSuitableFor(data));
  }
  
  /**
   * Find the best template for the given data
   * @param data The data to visualize
   * @param preferredType Optional preferred visualization type
   * @returns The best matching template or undefined if none found
   */
  findBestTemplate(data: any, preferredType?: string): VisualizationTemplate | undefined {
    const suitableTemplates = this.findSuitableTemplates(data);
    
    if (suitableTemplates.length === 0) {
      return undefined;
    }
    
    // If there's a preferred type, try to find a template of that type
    if (preferredType) {
      const preferredTemplate = suitableTemplates.find(t => t.id.includes(preferredType));
      if (preferredTemplate) {
        return preferredTemplate;
      }
    }
    
    // Otherwise, return the first suitable template
    return suitableTemplates[0];
  }
}

// Create and export a singleton instance of the template registry
export const templateRegistry = new TemplateRegistry();
