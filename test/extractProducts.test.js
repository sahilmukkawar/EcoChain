// test/extractProducts.test.js
const fs = require('fs').promises;
const path = require('path');
const extractProducts = require('./extractProducts');

// Mock the database connection and Product model
jest.mock('../database/connection', () => jest.fn().mockResolvedValue());
jest.mock('../database/models', () => ({
  Product: {
    find: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          _id: '123',
          productId: 'P123',
          factoryId: 'F123',
          productInfo: {
            name: 'Test Product',
            category: 'home_decor',
            description: 'A test product'
          },
          pricing: {
            costPrice: 100,
            sellingPrice: 50
          }
        }
      ])
    })
  }
}));

// Mock mongoose connection close
jest.mock('mongoose', () => ({
  connection: {
    close: jest.fn().mockResolvedValue()
  }
}));

describe('extractProducts', () => {
  const outputDir = path.join(__dirname, 'output');
  const productsFile = path.join(outputDir, 'products.json');
  const summaryFile = path.join(outputDir, 'products_summary.json');

  beforeEach(async () => {
    // Clean up any existing output files
    try {
      await fs.rm(outputDir, { recursive: true });
    } catch (err) {
      // Ignore if directory doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up output files after each test
    try {
      await fs.rm(outputDir, { recursive: true });
    } catch (err) {
      // Ignore if directory doesn't exist
    }
  });

  it('should extract products and save them to JSON files', async () => {
    await extractProducts();

    // Check that output directory was created
    const dirExists = await fs.access(outputDir).then(() => true).catch(() => false);
    expect(dirExists).toBe(true);

    // Check that products.json was created
    const productsFileExists = await fs.access(productsFile).then(() => true).catch(() => false);
    expect(productsFileExists).toBe(true);

    // Check that products_summary.json was created
    const summaryFileExists = await fs.access(summaryFile).then(() => true).catch(() => false);
    expect(summaryFileExists).toBe(true);

    // Check content of products.json
    const productsContent = await fs.readFile(productsFile, 'utf8');
    const products = JSON.parse(productsContent);
    expect(products).toHaveLength(1);
    expect(products[0].productInfo.name).toBe('Test Product');

    // Check content of products_summary.json
    const summaryContent = await fs.readFile(summaryFile, 'utf8');
    const summary = JSON.parse(summaryContent);
    expect(summary.totalProducts).toBe(1);
    expect(summary.categories.home_decor).toBe(1);
  });
});