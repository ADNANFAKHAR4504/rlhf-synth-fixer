import fs from 'fs';
import path from 'path';

describe('Credit Scoring CloudFormation Integration', () => {
  test('CloudFormation template file should exist', () => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    expect(fs.existsSync(templatePath)).toBe(true);
  });

  test('Template should be valid JSON', () => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const content = fs.readFileSync(templatePath, 'utf8');
    expect(() => JSON.parse(content)).not.toThrow();
  });

  test('PROMPT.md file should exist', () => {
    const promptPath = path.join(__dirname, '../lib/PROMPT.md');
    expect(fs.existsSync(promptPath)).toBe(true);
  });

  test('IDEAL_RESPONSE.md file should exist', () => {
    const idealPath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
    expect(fs.existsSync(idealPath)).toBe(true);
  });

  test('MODEL_FAILURES.md file should exist', () => {
    const failuresPath = path.join(__dirname, '../lib/MODEL_FAILURES.md');
    expect(fs.existsSync(failuresPath)).toBe(true);
  });

  test('metadata.json should exist and be valid', () => {
    const metadataPath = path.join(__dirname, '../metadata.json');
    expect(fs.existsSync(metadataPath)).toBe(true);
    const content = fs.readFileSync(metadataPath, 'utf8');
    const metadata = JSON.parse(content);
    expect(metadata.platform).toBe('cfn');
    expect(metadata.language).toBe('json');
  });
});
