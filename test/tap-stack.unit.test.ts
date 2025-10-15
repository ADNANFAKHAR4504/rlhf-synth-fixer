import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // unit-tests.sh converts YAML → JSON via: pipenv run cfn-flip-to-json > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('has valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('has description and metadata', () => {
      expect(template.Description).toBe('TAP Stack - Task Assignment Platform CloudFormation Template');
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('includes EnvironmentSuffix parameter with defaults', () => {
      expect(template.Parameters).toBeDefined();
      const p = template.Parameters.EnvironmentSuffix;
      expect(p).toBeDefined();
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('dev');
      expect(p.Description).toBe('Environment suffix for resource naming (e.g., dev, staging, prod)');
    });
  });

  describe('Key Resources', () => {
    test('creates an Application Load Balancer', () => {
      const alb = template.Resources['ApplicationLoadBalancer'];
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('creates an Auto Scaling Group', () => {
      const asg = template.Resources['AutoScalingGroup'];
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('creates S3 buckets for assets and logs', () => {
      const assets = template.Resources['AppAssetsBucket'];
      const logs = template.Resources['LogsBucket'];
      expect(assets).toBeDefined();
      expect(logs).toBeDefined();
      expect(assets.Type).toBe('AWS::S3::Bucket');
      expect(logs.Type).toBe('AWS::S3::Bucket');
    });

    test('creates DynamoDB session table', () => {
      const table = template.Resources['SessionTable'];
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });
  });

  describe('Outputs', () => {
    test('includes key outputs', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs['LoadBalancerDNS']).toBeDefined();
      expect(template.Outputs['S3AssetsBucket']).toBeDefined();
      expect(template.Outputs['S3LogsBucket']).toBeDefined();
    });
  });
});


const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
    });
  });

  describe('Resources', () => {
    test('should have SessionTable resource', () => {
      expect(template.Resources.SessionTable).toBeDefined();
    });

    test('SessionTable should be a DynamoDB table', () => {
      const table = template.Resources.SessionTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('SessionTable should have correct properties', () => {
      const table = template.Resources.SessionTable;
      const properties = table.Properties;

      // Validate billing mode and encryption/TTL features
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.SSESpecification.SSEEnabled).toBe(true);
      expect(properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(properties.TimeToLiveSpecification.Enabled).toBe(true);
    });

    test('SessionTable should have correct attribute definitions', () => {
      const table = template.Resources.SessionTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ AttributeName: 'SessionId', AttributeType: 'S' }),
          expect.objectContaining({ AttributeName: 'UserId', AttributeType: 'S' }),
        ])
      );
    });

    test('SessionTable should have correct key schema', () => {
      const table = template.Resources.SessionTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('SessionId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('SessionTable should define GSI for UserId', () => {
      const table = template.Resources.SessionTable;
      const gsis = table.Properties.GlobalSecondaryIndexes || [];
      const userIdIndex = gsis.find((gsi: any) => gsi.IndexName === 'UserIdIndex');
      expect(userIdIndex).toBeDefined();
      expect(userIdIndex.KeySchema[0]).toEqual({ AttributeName: 'UserId', KeyType: 'HASH' });
    });
  });

  describe('Outputs', () => {
    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('DynamoDB table name for sessions');
      expect(output.Value).toEqual({ Ref: 'SessionTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Session-Table',
      });
    });

    test('LoadBalancerDNS export name should match', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-ALB-DNS' });
    });

    test('S3 outputs should exist and have export names', () => {
      const assets = template.Outputs.S3AssetsBucket;
      const logs = template.Outputs.S3LogsBucket;
      expect(assets).toBeDefined();
      expect(logs).toBeDefined();
      expect(assets.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-Assets-Bucket' });
      expect(logs.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-Logs-Bucket' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should define multiple resources and parameters', () => {
      expect(Object.keys(template.Resources).length).toBeGreaterThan(1);
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(1);
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(3);
    });
  });

  describe('Resource Naming Convention', () => {
    test('SessionTable name should include team and environment suffix', () => {
      const table = template.Resources.SessionTable;
      const tableName = table.Properties.TableName;
      expect(tableName).toEqual({ 'Fn::Sub': '${Team}-${EnvironmentSuffix}-sessions' });
    });
  });
});
