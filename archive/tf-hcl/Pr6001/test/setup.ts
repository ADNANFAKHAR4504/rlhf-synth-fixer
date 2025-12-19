// Test setup file to preserve our custom coverage reporting
import * as fs from 'fs';
import * as path from 'path';

// Ensure coverage directory exists and preserve our custom coverage reports
beforeAll(() => {
  const coverageDir = path.join(__dirname, '../coverage');
  if (!fs.existsSync(coverageDir)) {
    fs.mkdirSync(coverageDir, { recursive: true });
  }
});

// Preserve our custom coverage report after Jest overwrites it
afterAll(async () => {
  const customCoveragePath = path.join(__dirname, '../coverage/terraform-coverage-summary.json');
  const jestCoveragePath = path.join(__dirname, '../coverage/coverage-summary.json');
  
  // If our custom coverage exists, copy it back
  if (fs.existsSync(customCoveragePath)) {
    const customCoverage = fs.readFileSync(customCoveragePath, 'utf8');
    fs.writeFileSync(jestCoveragePath, customCoverage);
  }
});