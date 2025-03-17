import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import puppeteer from 'puppeteer';

/**
 * Save a visualization to a file
 * @param html HTML content of the visualization
 * @param filename Filename to save as (without extension)
 * @param format File format (html, png, svg)
 * @param action Action context for accessing workspace
 * @returns Object with file information
 */
export async function saveVisualization(
  html: string,
  filename: string,
  format: 'html' | 'png' | 'svg',
  action: any
): Promise<{ success: boolean; filePath: string; fileUrl?: string }> {
  // Ensure output directory exists
  const outputDir = path.resolve(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Determine file extension
  const extension = format.toLowerCase();
  const fullFilename = `${filename}.${extension}`;
  const outputPath = path.resolve(outputDir, fullFilename);
  
  try {
    if (format === 'html') {
      // Directly save HTML
      fs.writeFileSync(outputPath, html, 'utf8');
    } else if (format === 'svg') {
      // Extract SVG content from HTML
      const svgMatch = html.match(/<svg[^>]*>[\s\S]*?<\/svg>/i);
      if (!svgMatch) {
        throw new Error('No SVG content found in the HTML');
      }
      
      fs.writeFileSync(outputPath, svgMatch[0], 'utf8');
    } else if (format === 'png') {
      // First save the HTML to use with puppeteer
      const htmlPath = path.resolve(outputDir, `${filename}.html`);
      fs.writeFileSync(htmlPath, html, 'utf8');
      
      // Use puppeteer to convert HTML to PNG
      const browser = await puppeteer.launch({
        headless: true, // Use the new headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      try {
        const page = await browser.newPage();
        
        // Load the HTML file
        await page.goto(`file://${htmlPath}`, {
          waitUntil: 'networkidle0',
        });
        
        // Get content size or set default
        const contentSize = await page.evaluate(() => {
          const element = document.querySelector('.chart-container') || document.body;
          const { width, height } = element.getBoundingClientRect();
          return { width, height };
        });
        
        // Set viewport and screenshot settings
        await page.setViewport({
          width: Math.ceil(contentSize.width) || 1920,
          height: Math.ceil(contentSize.height) || 1080,
          deviceScaleFactor: 2, // Higher quality image
        });
        
        // Take the screenshot
        await page.screenshot({
          path: outputPath,
          fullPage: false,
          type: 'png',
          omitBackground: false,
        });
        
        console.log(`Successfully converted HTML to PNG: ${outputPath}`);
      } finally {
        await browser.close();
      }
      
      // Optionally remove the temporary HTML file
      // fs.unlinkSync(htmlPath);
    }
    
    // If we have an action with a workspace, upload to the OpenServ platform
    if (action && action.workspace) {
      try {
        // Read the file
        const fileContent = fs.readFileSync(outputPath);
        
        // Upload to OpenServ
        // Check if agent exists on action or import it
        const agentToUse = action.agent || (action.me ? await import('../index').then(module => module.default) : null);
        
        if (!agentToUse) {
          throw new Error('No agent available for file upload');
        }
        
        const uploadResponse = await agentToUse.uploadFile({
          workspaceId: action.workspace.id,
          path: fullFilename,
          file: fileContent,
          skipSummarizer: true,
        });
        
        return {
          success: true,
          filePath: outputPath,
          fileUrl: uploadResponse.url
        };
      } catch (error) {
        console.error('Failed to upload file to workspace:', error);
        // Continue with local file even if upload fails
      }
    }
    
    return {
      success: true,
      filePath: outputPath
    };
  } catch (error) {
    console.error('Failed to save visualization:', error);
    throw new Error(`Failed to save as ${format}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert a visualization from one format to another
 * @param inputPath Path to input file
 * @param outputFormat Output format
 * @returns Path to converted file
 */
export async function convertVisualization(
  inputPath: string,
  outputFormat: 'html' | 'png' | 'svg'
): Promise<string> {
  const inputExt = path.extname(inputPath).slice(1).toLowerCase();
  const outputPath = inputPath.replace(new RegExp(`\\.${inputExt}$`), `.${outputFormat}`);
  
  // Check if conversion is needed
  if (inputExt === outputFormat) {
    return inputPath;
  }
  
  try {
    // Handle different conversion scenarios
    if (inputExt === 'html' && outputFormat === 'svg') {
      // Extract SVG from HTML
      const html = fs.readFileSync(inputPath, 'utf8');
      const svgMatch = html.match(/<svg[^>]*>[\s\S]*?<\/svg>/i);
      
      if (!svgMatch) {
        throw new Error('No SVG content found in the HTML');
      }
      
      fs.writeFileSync(outputPath, svgMatch[0], 'utf8');
    } else if (inputExt === 'html' && outputFormat === 'png') {
      // Use puppeteer to convert HTML to PNG
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      try {
        const page = await browser.newPage();
        
        // Load the HTML file
        await page.goto(`file://${inputPath}`, {
          waitUntil: 'networkidle0',
        });
        
        // Get content size or set default
        const contentSize = await page.evaluate(() => {
          const element = document.querySelector('.chart-container') || document.body;
          const { width, height } = element.getBoundingClientRect();
          return { width, height };
        });
        
        // Set viewport and screenshot settings
        await page.setViewport({
          width: Math.ceil(contentSize.width) || 800,
          height: Math.ceil(contentSize.height) || 600,
          deviceScaleFactor: 2,
        });
        
        // Take the screenshot
        await page.screenshot({
          path: outputPath,
          fullPage: false,
          type: 'png',
          omitBackground: false,
        });
      } finally {
        await browser.close();
      }
    } else if (inputExt === 'svg' && outputFormat === 'png') {
      // Create a simple HTML wrapper for the SVG
      const svg = fs.readFileSync(inputPath, 'utf8');
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>SVG Conversion</title>
          <style>
            body { margin: 0; padding: 0; }
            svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          ${svg}
        </body>
        </html>
      `;
      
      // Save HTML temporarily
      const htmlPath = inputPath.replace(/\.svg$/, '.temp.html');
      fs.writeFileSync(htmlPath, html, 'utf8');
      
      // Convert HTML to PNG
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      try {
        const page = await browser.newPage();
        
        // Load the HTML file
        await page.goto(`file://${htmlPath}`, {
          waitUntil: 'networkidle0',
        });
        
        // Get SVG dimensions
        const dimensions = await page.evaluate(() => {
          const svg = document.querySelector('svg');
          if (!svg) return { width: 1920 , height: 1080 };
          
          const { width, height } = svg.getBoundingClientRect();
          return { width, height };
        });
        
        // Set viewport and screenshot settings
        await page.setViewport({
          width: Math.ceil(dimensions.width) || 1920,
          height: Math.ceil(dimensions.height) || 1080,
          deviceScaleFactor: 2,
        });
        
        // Take the screenshot
        await page.screenshot({
          path: outputPath,
          fullPage: false,
          type: 'png',
          omitBackground: false,
        });
      } finally {
        await browser.close();
        
        // Remove temporary HTML file
        fs.unlinkSync(htmlPath);
      }
    } else {
      throw new Error(`Unsupported conversion: ${inputExt} to ${outputFormat}`);
    }
    
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to convert visualization: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load a visualization from a file
 * @param filePath Path to the file
 * @returns File content
 */
export function loadVisualization(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to load visualization: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Clean up temporary visualization files
 * @param filePaths Paths to files to delete
 */
export function cleanupFiles(filePaths: string[]): void {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }
}