import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

describe('Turn Around Prompt API Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error('Deployment outputs not found. Please run deployment first.');
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  });

  describe('Deployment Validation', () => {
    test('should have CloudFront distribution domain', () => {
      expect(outputs.cloudfrontDomain).toBeDefined();
      expect(outputs.cloudfrontDomain).toMatch(/\.cloudfront\.net$/);
    });

    test('should have S3 bucket name', () => {
      expect(outputs.s3BucketName).toBeDefined();
      expect(outputs.s3BucketName).toContain('static-website');
      expect(outputs.s3BucketName).toContain('content');
    });

    test('should have website URL', () => {
      expect(outputs.websiteUrl).toBeDefined();
      expect(outputs.websiteUrl).toMatch(/^https:\/\/.+\.cloudfront\.net$/);
    });
  });

  describe('Website Accessibility', () => {
    test('CloudFront distribution should be accessible', async () => {
      const url = outputs.websiteUrl;

      return new Promise<void>((resolve, reject) => {
        https.get(url, (res) => {
          expect(res.statusCode).toBeLessThan(400);
          resolve();
        }).on('error', (err) => {
          reject(err);
        });
      });
    }, 30000);

    test('should serve index.html', async () => {
      const url = `${outputs.websiteUrl}/index.html`;

      return new Promise<void>((resolve, reject) => {
        https.get(url, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            expect(res.statusCode).toBeLessThan(400);
            expect(data).toContain('<!DOCTYPE html>');
            resolve();
          });
        }).on('error', (err) => {
          reject(err);
        });
      });
    }, 30000);
  });

  describe('Resource Configuration', () => {
    test('all outputs should be strings', () => {
      Object.values(outputs).forEach(value => {
        expect(typeof value).toBe('string');
      });
    });

    test('CloudFront URL should use HTTPS', () => {
      expect(outputs.websiteUrl).toMatch(/^https:\/\//);
    });
  });
});
