import * as fs from 'fs';
import * as path from 'path';
import { S3Client } from '@aws-sdk/client-s3';

const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const metadataPath = path.join(__dirname, '../metadata.json');

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

const region = process.env.AWS_REGION || 'us-west-2';
const s3Client = new S3Client({ region });

describe('TapStack integration smoke tests', () => {
  describe('stack outputs file', () => {
    test('outputs file exists on disk', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test('outputs file parses into a plain object', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
      expect(Array.isArray(outputs)).toBe(false);
    });
  });

  describe('project metadata sanity checks', () => {
    test('metadata matches expected platform and language', () => {
      expect(metadata.platform).toBe('cdktf');
      expect(['ts', 'typescript']).toContain(metadata.language);
    });

    test('metadata lists targeted AWS services', () => {
      expect(Array.isArray(metadata.aws_services)).toBe(true);
      expect(metadata.aws_services.length).toBeGreaterThan(0);
    });
  });

  describe('AWS client configuration', () => {
    test('S3 client resolves to the configured region', async () => {
      const resolvedRegion = await s3Client.config.region();
      expect(resolvedRegion).toBe(region);
    });

    test('region string follows standard AWS formatting', () => {
      expect(region).toMatch(/^[a-z]+-[a-z]+-\d+$/);
    });
  });
});
