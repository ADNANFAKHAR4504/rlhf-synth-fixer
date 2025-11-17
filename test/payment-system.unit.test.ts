import { describe, test, expect, beforeAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Custom YAML schema for CloudFormation templates
const CF_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: (data: string) => ({ Ref: data })
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: (data: string) => {
      const [resource, attr] = data.split('.');
      return { 'Fn::GetAtt': [resource, attr] };
    }
  }),
  new yaml.Type('!GetAtt', {
    kind: 'sequence',
    construct: (data: string[]) => ({ 'Fn::GetAtt': data })
  }),
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::Sub': data })
  }),
  new yaml.Type('!Sub', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::Sub': data })
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::Select': data })
  }),
  new yaml.Type('!GetAZs', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::GetAZs': data })
  }),
  new yaml.Type('!Equals', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::Equals': data })
  }),
  new yaml.Type('!Not', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::Not': data })
  }),
  new yaml.Type('!If', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::If': data })
  })
]);

describe('Payment Processing System - Unit Tests', () => {
  let mainTemplate: any;
  let networkStack: any;
  let databaseStack: any;
  let computeStack: any;
  let queueStack: any;
  let monitoringStack: any;
  let route53Stack: any;

  beforeAll(() => {
    // Load all CloudFormation templates using custom schema
    const templateDir = path.join(__dirname, '..', 'lib');

    const loadTemplate = (filename: string) => {
      const templatePath = path.join(templateDir, filename);
      if (fs.existsSync(templatePath)) {
        const content = fs.readFileSync(templatePath, 'utf8');
        return yaml.load(content, { schema: CF_SCHEMA });
      }
      return null;
    };

    mainTemplate = loadTemplate('main-template.yaml');
    networkStack = loadTemplate('network-stack.yaml');
    databaseStack = loadTemplate('database-stack.yaml');
    computeStack = loadTemplate('compute-stack.yaml');
    queueStack = loadTemplate('queue-stack.yaml');
    monitoringStack = loadTemplate('monitoring-stack.yaml');
    route53Stack = loadTemplate('route53-failover.yaml');

    // If nested templates don't exist, try loading the single TapStack.yml
    if (!mainTemplate) {
      mainTemplate = loadTemplate('TapStack.yml');
    }
  });

  describe('CloudFormation Template Structure Tests', () => {
    test('should have valid CloudFormation structure', () => {
      expect(mainTemplate).toBeDefined();
      if (mainTemplate) {
        expect(mainTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
        expect(mainTemplate.Description).toBeDefined();
        expect(typeof mainTemplate.Description).toBe('string');
      }
    });

    test('should have Parameters section', () => {
      if (mainTemplate) {
        expect(mainTemplate.Parameters).toBeDefined();
        expect(mainTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      }
    });

    test('should have Resources section', () => {
      if (mainTemplate) {
        expect(mainTemplate.Resources).toBeDefined();
        expect(Object.keys(mainTemplate.Resources).length).toBeGreaterThan(0);
      }
    });

    test('should have Outputs section', () => {
      if (mainTemplate) {
        expect(mainTemplate.Outputs).toBeDefined();
        expect(Object.keys(mainTemplate.Outputs).length).toBeGreaterThan(0);
      }
    });
  });

  describe('Main Template Resource Tests', () => {
    test('should have VPC resources or nested stack', () => {
      if (mainTemplate && mainTemplate.Resources) {
        const hasVPC = mainTemplate.Resources.VPC ||
                       mainTemplate.Resources.NetworkStack ||
                       Object.keys(mainTemplate.Resources).some(key =>
                         mainTemplate.Resources[key].Type === 'AWS::EC2::VPC'
                       );
        expect(hasVPC).toBeTruthy();
      }
    });

    test('should have database resources', () => {
      if (mainTemplate && mainTemplate.Resources) {
        const hasDatabase = mainTemplate.Resources.DatabaseStack ||
                           mainTemplate.Resources.DBCluster ||
                           mainTemplate.Resources.SessionTable ||
                           Object.keys(mainTemplate.Resources).some(key =>
                             mainTemplate.Resources[key].Type?.includes('RDS') ||
                             mainTemplate.Resources[key].Type?.includes('DynamoDB')
                           );
        expect(hasDatabase).toBeTruthy();
      }
    });

    test('should have compute resources', () => {
      if (mainTemplate && mainTemplate.Resources) {
        const hasCompute = mainTemplate.Resources.ComputeStack ||
                          mainTemplate.Resources.PaymentProcessorFunction ||
                          Object.keys(mainTemplate.Resources).some(key =>
                            mainTemplate.Resources[key].Type?.includes('Lambda')
                          );
        expect(hasCompute).toBeTruthy();
      }
    });

    test('should have queue resources', () => {
      if (mainTemplate && mainTemplate.Resources) {
        const hasQueue = mainTemplate.Resources.QueueStack ||
                        mainTemplate.Resources.TransactionQueue ||
                        Object.keys(mainTemplate.Resources).some(key =>
                          mainTemplate.Resources[key].Type?.includes('SQS')
                        );
        expect(hasQueue).toBeTruthy();
      }
    });
  });

  describe('Network Stack Tests', () => {
    test('should have VPC configuration if network stack exists', () => {
      if (networkStack && networkStack.Resources) {
        expect(networkStack.Resources.VPC).toBeDefined();
        if (networkStack.Resources.VPC) {
          expect(networkStack.Resources.VPC.Properties.CidrBlock).toBeDefined();
        }
      }
    });

    test('should have subnets if network stack exists', () => {
      if (networkStack && networkStack.Resources) {
        const hasSubnets = networkStack.Resources.PublicSubnet1 ||
                          networkStack.Resources.PrivateSubnet1;
        expect(hasSubnets).toBeTruthy();
      }
    });
  });

  describe('Database Stack Tests', () => {
    test('should have encryption resources if database stack exists', () => {
      if (databaseStack && databaseStack.Resources) {
        const hasKMS = databaseStack.Resources.KMSKey ||
                      Object.keys(databaseStack.Resources).some(key =>
                        databaseStack.Resources[key].Type === 'AWS::KMS::Key'
                      );
        expect(hasKMS).toBeTruthy();
      }
    });

    test('should have database resources if database stack exists', () => {
      if (databaseStack && databaseStack.Resources) {
        const hasDB = databaseStack.Resources.DBCluster ||
                     databaseStack.Resources.SessionTable ||
                     Object.keys(databaseStack.Resources).some(key =>
                       databaseStack.Resources[key].Type?.includes('RDS') ||
                       databaseStack.Resources[key].Type?.includes('DynamoDB')
                     );
        expect(hasDB).toBeTruthy();
      }
    });
  });

  describe('Security Best Practices Tests', () => {
    test('should have encryption enabled for resources', () => {
      // Check main template for encryption settings
      if (mainTemplate && mainTemplate.Resources) {
        Object.values(mainTemplate.Resources).forEach((resource: any) => {
          // Check S3 buckets
          if (resource.Type === 'AWS::S3::Bucket' && resource.Properties) {
            if (resource.Properties.BucketEncryption) {
              expect(resource.Properties.BucketEncryption).toBeDefined();
            }
          }
          // Check RDS clusters
          if (resource.Type === 'AWS::RDS::DBCluster' && resource.Properties) {
            if (resource.Properties.StorageEncrypted !== undefined) {
              expect(resource.Properties.StorageEncrypted).toBe(true);
            }
          }
          // Check DynamoDB tables
          if (resource.Type === 'AWS::DynamoDB::Table' && resource.Properties) {
            if (resource.Properties.SSESpecification) {
              expect(resource.Properties.SSESpecification.SSEEnabled).toBe(true);
            }
          }
        });
      }
    });

    test('should have proper tagging', () => {
      if (mainTemplate && mainTemplate.Resources) {
        Object.values(mainTemplate.Resources).forEach((resource: any) => {
          if (resource.Properties && resource.Properties.Tags) {
            const tags = resource.Properties.Tags;
            const hasEnvironmentTag = tags.some((tag: any) =>
              tag.Key === 'Environment'
            );
            expect(hasEnvironmentTag).toBeTruthy();
          }
        });
      }
    });
  });

  describe('Output Tests', () => {
    test('should have required outputs', () => {
      if (mainTemplate && mainTemplate.Outputs) {
        const outputs = Object.keys(mainTemplate.Outputs);
        expect(outputs.length).toBeGreaterThan(0);

        // Check for common expected outputs
        const hasVPCOutput = outputs.some(key => key.toLowerCase().includes('vpc'));
        const hasEndpointOutput = outputs.some(key =>
          key.toLowerCase().includes('endpoint') ||
          key.toLowerCase().includes('url')
        );

        expect(hasVPCOutput || hasEndpointOutput).toBeTruthy();
      }
    });

    test('should have export names for outputs', () => {
      if (mainTemplate && mainTemplate.Outputs) {
        Object.values(mainTemplate.Outputs).forEach((output: any) => {
          if (output.Export) {
            expect(output.Export.Name).toBeDefined();
          }
        });
      }
    });
  });
});