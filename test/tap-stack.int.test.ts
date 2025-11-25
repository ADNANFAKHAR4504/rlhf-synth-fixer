import * as fs from 'fs';
import * as path from 'path';

describe('Integration - smoke tests', () => {
  it('should have an index.ts file with content', () => {
    const indexPath = path.join(__dirname, '../index.ts');
    const indexCode = fs.readFileSync(indexPath, 'utf-8');
    expect(indexCode).toBeTruthy();
  });
});
