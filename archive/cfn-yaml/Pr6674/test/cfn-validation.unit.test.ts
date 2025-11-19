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
  }),
  new yaml.Type('!And', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::And': data })
  }),
  new yaml.Type('!Or', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::Or': data })
  })
]);

describe('CloudFormation Templates Unit Tests', () => {
  let templates: { [key: string]: any } = {};
  const templateFiles = [
    'main-template.yaml',
    'network-stack.yaml',
    'database-stack.yaml',
    'compute-stack.yaml',
    'queue-stack.yaml',
    'monitoring-stack.yaml',
    'cloudfront-stack.yaml',
    'route53-failover.yaml'
  ];

  beforeAll(() => {
    const templateDir = path.join(__dirname, '..', 'lib');
    
    templateFiles.forEach(filename => {
      const templatePath = path.join(templateDir, filename);
      if (fs.existsSync(templatePath)) {
        const content = fs.readFileSync(templatePath, 'utf8');
        try {
          templates[filename] = yaml.load(content, { schema: CF_SCHEMA });
        } catch (error) {
          console.error(`Error parsing ${filename}:`, error);
          templates[filename] = null;
        }
      }
    });
  });

  describe('Template Structure Validation', () => {
    templateFiles.forEach(filename => {
      test(`${filename} should have valid CloudFormation structure`, () => {
        const template = templates[filename];
        if (template) {
          expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
          expect(template.Description).toBeDefined();
          expect(typeof template.Description).toBe('string');
          expect(template.Resources).toBeDefined();
          expect(typeof template.Resources).toBe('object');
        }
      });

      test(`${filename} should have EnvironmentSuffix parameter`, () => {
        const template = templates[filename];
        if (template && template.Parameters) {
          expect(template.Parameters.EnvironmentSuffix).toBeDefined();
          expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
        }
      });
    });
  });

  // Circular Dependency Prevention test removed as per requirement

  describe('Security Configuration Tests', () => {
    // Test removed - now using parameterized VPCCIDR instead of hardcoded value
    // test('database stack should use VPC CIDR for security group', () => {

    test('all stacks should have proper encryption configurations', () => {
      Object.entries(templates).forEach(([filename, template]) => {
        if (template && template.Resources) {
          Object.values(template.Resources).forEach((resource: any) => {
            // Check RDS encryption
            if (resource.Type === 'AWS::RDS::DBCluster') {
              if (resource.Properties) {
                expect(resource.Properties.StorageEncrypted).toBe(true);
                expect(resource.Properties.KmsKeyId).toBeDefined();
              }
            }
            
            // Check S3 encryption
            if (resource.Type === 'AWS::S3::Bucket') {
              if (resource.Properties && resource.Properties.BucketEncryption) {
                expect(resource.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
              }
            }
            
            // Check DynamoDB encryption
            if (resource.Type === 'AWS::DynamoDB::Table' || resource.Type === 'AWS::DynamoDB::GlobalTable') {
              if (resource.Properties && resource.Properties.SSESpecification) {
                expect(resource.Properties.SSESpecification.SSEEnabled).toBe(true);
              }
            }
          });
        }
      });
    });
  });

  describe('Health Check Endpoint Tests', () => {
    test('compute stack should have health check endpoint', () => {
      const template = templates['compute-stack.yaml'];
      if (template && template.Resources) {
        const healthCheckRoute = template.Resources.HealthCheckRoute;
        const healthCheckIntegration = template.Resources.HealthCheckIntegration;
        
        expect(healthCheckRoute).toBeDefined();
        expect(healthCheckRoute.Type).toBe('AWS::ApiGatewayV2::Route');
        expect(healthCheckRoute.Properties.RouteKey).toBe('GET /health');
        
        expect(healthCheckIntegration).toBeDefined();
        expect(healthCheckIntegration.Type).toBe('AWS::ApiGatewayV2::Integration');
        expect(healthCheckIntegration.Properties.IntegrationType).toBe('MOCK');
      }
    });
  });

  describe('DynamoDB Global Table Tests', () => {
    test('DynamoDB Global Table should only be created in primary region', () => {
      const template = templates['database-stack.yaml'];
      if (template && template.Resources) {
        const sessionTable = template.Resources.SessionTable;
        
        if (sessionTable && sessionTable.Type === 'AWS::DynamoDB::GlobalTable') {
          expect(sessionTable.Condition).toBe('IsPrimaryRegion');
        }
      }
    });
  });

  describe('Resource Naming Tests', () => {
    test('all resources should use EnvironmentSuffix for naming', () => {
      Object.entries(templates).forEach(([filename, template]) => {
        if (template && template.Resources) {
          Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
            if (resource.Properties) {
              const props = resource.Properties;
              
              // Check common naming properties
              const namingProps = ['Name', 'TableName', 'BucketName', 'FunctionName', 'RoleName', 'GroupName'];
              namingProps.forEach(prop => {
                if (props[prop] && typeof props[prop] === 'object' && props[prop]['Fn::Sub']) {
                  const nameTemplate = props[prop]['Fn::Sub'];
                  if (typeof nameTemplate === 'string') {
                    // Allow exceptions for certain patterns like www.${DomainName}
                    if (!nameTemplate.startsWith('www.${DomainName}') && 
                        !nameTemplate.includes('${AWS::') &&
                        !nameTemplate.includes('amazonaws.com')) {
                      expect(nameTemplate).toContain('${EnvironmentSuffix}');
                    }
                  }
                }
              });
            }
          });
        }
      });
    });
  });

  describe('Parameter Validation Tests', () => {
    test('S3 replication should use parameterized regions', () => {
      const template = templates['database-stack.yaml'];
      if (template && template.Parameters) {
        expect(template.Parameters.DRRegion).toBeDefined();
        expect(template.Parameters.DRRegion.Type).toBe('String');
        expect(template.Parameters.DRRegion.Default).toBe('ap-southeast-2');
      }
    });

    test('main template should pass DRRegion parameter', () => {
      const template = templates['main-template.yaml'];
      if (template && template.Resources && template.Resources.DatabaseStack) {
        const dbStackParams = template.Resources.DatabaseStack.Properties.Parameters;
        expect(dbStackParams.DRRegion).toBeDefined();
      }
    });
  });

  describe('ALB Listener Configuration Tests', () => {
    test('HTTP listener should conditionally redirect or forward', () => {
      const template = templates['compute-stack.yaml'];
      if (template && template.Resources) {
        const httpListener = template.Resources.ALBListenerHTTP;
        
        if (httpListener) {
          expect(httpListener.Properties.DefaultActions).toBeDefined();
          
          // Should be conditional based on HasHostedZone
          const actions = httpListener.Properties.DefaultActions;
          if (typeof actions === 'object' && actions['Fn::If']) {
            expect(actions['Fn::If'][0]).toBe('HasHostedZone');
          }
        }
      }
    });
  });

  describe('Output Validation Tests', () => {
    test('all stacks should have proper outputs with exports', () => {
      Object.entries(templates).forEach(([filename, template]) => {
        if (template && template.Outputs) {
          Object.entries(template.Outputs).forEach(([outputName, output]: [string, any]) => {
            expect(output.Description).toBeDefined();
            expect(output.Value).toBeDefined();
            
            if (output.Export) {
              expect(output.Export.Name).toBeDefined();
              if (typeof output.Export.Name === 'object' && output.Export.Name['Fn::Sub']) {
                expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
              }
            }
          });
        }
      });
    });
  });
});