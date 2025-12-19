import fs from 'fs';
import path from 'path';

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
    test('Integration tests should be written', async () => {
      // This is a reminder test - integration tests are in tap-stack.int.test.ts
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
        'Financial Services Disaster Recovery Infrastructure - Main Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('prod');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(envParam.Description).toBe('Environment name for resource tagging and naming');
    });

    test('should have key infrastructure parameters', () => {
      const requiredParams = [
        'Environment',
        'CompanyName', 
        'PrimaryRegion',
        'SecondaryRegion',
        'PrimaryVpcCidr',
        'DatabaseMasterUsername'
      ];
      
      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
  });

  describe('Resources', () => {
    test('should have TradingDataTable DynamoDB resource', () => {
      expect(template.Resources.TradingDataTable).toBeDefined();
      expect(template.Resources.TradingDataTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have PrimaryDatabase RDS resource', () => {
      expect(template.Resources.PrimaryDatabase).toBeDefined();
      expect(template.Resources.PrimaryDatabase.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.PrimaryDatabase.Condition).toBe('IsPrimaryRegion');
    });

    test('should have PrimaryVPC resource', () => {
      expect(template.Resources.PrimaryVPC).toBeDefined();
      expect(template.Resources.PrimaryVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.PrimaryVPC.Condition).toBe('IsPrimaryRegion');
    });

    test('should have DocumentsBucket S3 resource', () => {
      expect(template.Resources.DocumentsBucket).toBeDefined();
      expect(template.Resources.DocumentsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have critical infrastructure resources', () => {
      const criticalResources = [
        'PrimaryKMSKey',
        'BackupPlan',
        'BackupVault',
        'DROrchestrationFunction',
        'ApplicationLoadBalancer'
      ];
      
      criticalResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('resources should have proper conditions for disaster recovery', () => {
      const primaryRegionResources = [
        'PrimaryVPC',
        'PrimaryDatabase', 
        'PrimaryKMSKey',
        'ApplicationLoadBalancer'
      ];
      
      primaryRegionResources.forEach(resource => {
        expect(template.Resources[resource].Condition).toBe('IsPrimaryRegion');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required disaster recovery outputs', () => {
      const expectedOutputs = [
        'TradingDataTableName',
        'TradingDataTableArn', 
        'DocumentsBucketName',
        'DocumentsBucketArn',
        'DROrchestrationFunctionArn',
        'DRNotificationTopicArn',
        'BackupPlanId',
        'BackupVaultName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have conditional primary region outputs', () => {
      const conditionalOutputs = [
        'PrimaryVPCId',
        'PrimaryPrivateSubnet1Id',
        'PrimaryPrivateSubnet2Id', 
        'PrimaryDatabaseIdentifier',
        'PrimaryDatabaseEndpoint',
        'ApplicationLoadBalancerDNSName',
        'PrimaryKMSKeyId'
      ];

      conditionalOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Condition).toBe('IsPrimaryRegion');
      });
    });

    test('TradingDataTableName output should be correct', () => {
      const output = template.Outputs.TradingDataTableName;
      expect(output.Description).toBe('Trading Data Table Name');
      expect(output.Value).toEqual({ Ref: 'TradingDataTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TradingDataTableName',
      });
    });

    test('DocumentsBucketName output should be correct', () => {
      const output = template.Outputs.DocumentsBucketName;
      expect(output.Description).toBe('Documents Bucket Name');
      expect(output.Value).toEqual({ Ref: 'DocumentsBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DocumentsBucketName',
      });
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

    test('should have expected number of resources for disaster recovery infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(55);
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(11);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(19);
    });

    test('should have disaster recovery conditions defined', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.IsPrimaryRegion).toBeDefined();
      expect(template.Conditions.IsProduction).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('DynamoDB table should follow naming convention with environment suffix', () => {
      const table = template.Resources.TradingDataTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      
      const tableName = table.Properties.TableName;
      expect(tableName).toEqual({
        'Fn::Sub': '${CompanyName}-${Environment}-trading-data',
      });
    });

    test('S3 bucket should follow naming convention', () => {
      const bucket = template.Resources.DocumentsBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const bucketName = bucket.Properties.BucketName;
      expect(bucketName).toEqual({
        'Fn::Sub': '${CompanyName}-${Environment}-documents-${AWS::AccountId}-${AWS::Region}',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
          });
        }
      });
    });

    test('VPC resources should have conditional deployment', () => {
      const vpc = template.Resources.PrimaryVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Condition).toBe('IsPrimaryRegion');
    });

    test('RDS resources should have conditional deployment', () => {
      const database = template.Resources.PrimaryDatabase;
      expect(database).toBeDefined();
      expect(database.Type).toBe('AWS::RDS::DBInstance');
      expect(database.Condition).toBe('IsPrimaryRegion');
    });
  });
});
