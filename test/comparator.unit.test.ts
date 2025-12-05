import * as fs from 'fs';
import * as path from 'path';
import { StackComparator } from '../lib/comparator/stack-comparator';

describe('Stack Comparator Unit Tests', () => {
  const testDir = path.join(__dirname, 'test-templates');

  beforeAll(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.readdirSync(testDir).forEach(file => {
        fs.unlinkSync(path.join(testDir, file));
      });
      fs.rmdirSync(testDir);
    }
  });

  describe('Template Comparison', () => {
    test('detects added resources', () => {
      const template1 = {
        Resources: {
          Bucket1: {
            Type: 'AWS::S3::Bucket',
            Properties: { BucketName: 'test-bucket-1' }
          }
        }
      };

      const template2 = {
        Resources: {
          Bucket1: {
            Type: 'AWS::S3::Bucket',
            Properties: { BucketName: 'test-bucket-1' }
          },
          Bucket2: {
            Type: 'AWS::S3::Bucket',
            Properties: { BucketName: 'test-bucket-2' }
          }
        }
      };

      const file1 = path.join(testDir, 'template1.json');
      const file2 = path.join(testDir, 'template2.json');

      fs.writeFileSync(file1, JSON.stringify(template1));
      fs.writeFileSync(file2, JSON.stringify(template2));

      const differences = StackComparator.compareTemplates(file1, file2);
      const addedResources = differences.filter(d => d.type === 'added');

      expect(addedResources.length).toBeGreaterThan(0);
      expect(addedResources[0].path).toContain('Bucket2');
      expect(addedResources[0].description).toContain('was added');
    });

    test('detects removed resources', () => {
      const template1 = {
        Resources: {
          Bucket1: { Type: 'AWS::S3::Bucket' },
          Bucket2: { Type: 'AWS::S3::Bucket' }
        }
      };

      const template2 = {
        Resources: {
          Bucket1: { Type: 'AWS::S3::Bucket' }
        }
      };

      const file1 = path.join(testDir, 'removed1.json');
      const file2 = path.join(testDir, 'removed2.json');

      fs.writeFileSync(file1, JSON.stringify(template1));
      fs.writeFileSync(file2, JSON.stringify(template2));

      const differences = StackComparator.compareTemplates(file1, file2);
      const removedResources = differences.filter(d => d.type === 'removed');

      expect(removedResources.length).toBeGreaterThan(0);
      expect(removedResources[0].path).toContain('Bucket2');
      expect(removedResources[0].description).toContain('was removed');
    });

    test('detects modified resource properties', () => {
      const template1 = {
        Resources: {
          Bucket1: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: 'old-name',
              Versioning: { Status: 'Enabled' }
            }
          }
        }
      };

      const template2 = {
        Resources: {
          Bucket1: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketName: 'new-name',
              Versioning: { Status: 'Enabled' }
            }
          }
        }
      };

      const file1 = path.join(testDir, 'modified1.json');
      const file2 = path.join(testDir, 'modified2.json');

      fs.writeFileSync(file1, JSON.stringify(template1));
      fs.writeFileSync(file2, JSON.stringify(template2));

      const differences = StackComparator.compareTemplates(file1, file2);
      const modifiedProps = differences.filter(d => d.type === 'modified');

      expect(modifiedProps.length).toBeGreaterThan(0);
      expect(modifiedProps[0].path).toContain('BucketName');
      expect(modifiedProps[0].oldValue).toBe('old-name');
      expect(modifiedProps[0].newValue).toBe('new-name');
    });

    test('handles identical templates', () => {
      const template = {
        Resources: {
          Bucket1: { Type: 'AWS::S3::Bucket' }
        }
      };

      const file1 = path.join(testDir, 'identical1.json');
      const file2 = path.join(testDir, 'identical2.json');

      fs.writeFileSync(file1, JSON.stringify(template));
      fs.writeFileSync(file2, JSON.stringify(template));

      const differences = StackComparator.compareTemplates(file1, file2);

      expect(differences.length).toBe(0);
    });

    test('compares outputs', () => {
      const template1 = {
        Resources: {},
        Outputs: {
          BucketName: { Value: 'bucket-1' }
        }
      };

      const template2 = {
        Resources: {},
        Outputs: {
          BucketName: { Value: 'bucket-2' }
        }
      };

      const file1 = path.join(testDir, 'outputs1.json');
      const file2 = path.join(testDir, 'outputs2.json');

      fs.writeFileSync(file1, JSON.stringify(template1));
      fs.writeFileSync(file2, JSON.stringify(template2));

      const differences = StackComparator.compareTemplates(file1, file2);

      expect(differences.some(d => d.path.includes('Outputs'))).toBe(true);
    });

    test('compares parameters', () => {
      const template1 = {
        Resources: {},
        Parameters: {
          EnvType: { Type: 'String', Default: 'dev' }
        }
      };

      const template2 = {
        Resources: {},
        Parameters: {
          EnvType: { Type: 'String', Default: 'prod' }
        }
      };

      const file1 = path.join(testDir, 'params1.json');
      const file2 = path.join(testDir, 'params2.json');

      fs.writeFileSync(file1, JSON.stringify(template1));
      fs.writeFileSync(file2, JSON.stringify(template2));

      const differences = StackComparator.compareTemplates(file1, file2);

      expect(differences.some(d => d.path.includes('Parameters'))).toBe(true);
    });
  });

  describe('Report Generation', () => {
    test('generates report for no differences', () => {
      const differences: any[] = [];
      const report = StackComparator.generateReport(differences);

      expect(report).toContain('No differences found');
    });

    test('generates report with differences summary', () => {
      const differences = [
        {
          type: 'added' as const,
          path: 'Resources.Bucket1',
          newValue: {},
          description: 'Resource added'
        },
        {
          type: 'removed' as const,
          path: 'Resources.Bucket2',
          oldValue: {},
          description: 'Resource removed'
        },
        {
          type: 'modified' as const,
          path: 'Resources.Bucket3.Properties.Name',
          oldValue: 'old',
          newValue: 'new',
          description: 'Property modified'
        }
      ];

      const report = StackComparator.generateReport(differences);

      expect(report).toContain('3 difference(s)');
      expect(report).toContain('Added (1)');
      expect(report).toContain('Removed (1)');
      expect(report).toContain('Modified (1)');
      expect(report).toContain('Resources.Bucket1');
      expect(report).toContain('Resources.Bucket2');
      expect(report).toContain('Resources.Bucket3');
    });

    test('formats differences with correct symbols', () => {
      const differences = [
        {
          type: 'added' as const,
          path: 'Resources.NewResource',
          newValue: {},
          description: 'Added'
        },
        {
          type: 'removed' as const,
          path: 'Resources.OldResource',
          oldValue: {},
          description: 'Removed'
        },
        {
          type: 'modified' as const,
          path: 'Resources.ChangedResource',
          oldValue: 'old',
          newValue: 'new',
          description: 'Modified'
        }
      ];

      const report = StackComparator.generateReport(differences);

      expect(report).toContain('+ Resources.NewResource');
      expect(report).toContain('- Resources.OldResource');
      expect(report).toContain('~ Resources.ChangedResource');
    });
  });

  describe('Complex Resource Comparison', () => {
    test('handles nested property changes', () => {
      const template1 = {
        Resources: {
          Bucket1: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [{
                  ServerSideEncryptionByDefault: {
                    SSEAlgorithm: 'AES256'
                  }
                }]
              }
            }
          }
        }
      };

      const template2 = {
        Resources: {
          Bucket1: {
            Type: 'AWS::S3::Bucket',
            Properties: {
              BucketEncryption: {
                ServerSideEncryptionConfiguration: [{
                  ServerSideEncryptionByDefault: {
                    SSEAlgorithm: 'aws:kms'
                  }
                }]
              }
            }
          }
        }
      };

      const file1 = path.join(testDir, 'nested1.json');
      const file2 = path.join(testDir, 'nested2.json');

      fs.writeFileSync(file1, JSON.stringify(template1));
      fs.writeFileSync(file2, JSON.stringify(template2));

      const differences = StackComparator.compareTemplates(file1, file2);

      expect(differences.length).toBeGreaterThan(0);
      expect(differences.some(d => d.type === 'modified')).toBe(true);
    });

    test('handles multiple resource types', () => {
      const template1 = {
        Resources: {
          Bucket1: { Type: 'AWS::S3::Bucket' },
          Function1: { Type: 'AWS::Lambda::Function' }
        }
      };

      const template2 = {
        Resources: {
          Bucket1: { Type: 'AWS::S3::Bucket' },
          Function2: { Type: 'AWS::Lambda::Function' }
        }
      };

      const file1 = path.join(testDir, 'multi1.json');
      const file2 = path.join(testDir, 'multi2.json');

      fs.writeFileSync(file1, JSON.stringify(template1));
      fs.writeFileSync(file2, JSON.stringify(template2));

      const differences = StackComparator.compareTemplates(file1, file2);

      expect(differences.filter(d => d.type === 'removed').length).toBe(1);
      expect(differences.filter(d => d.type === 'added').length).toBe(1);
    });
  });
});
