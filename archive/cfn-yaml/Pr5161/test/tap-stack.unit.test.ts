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

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'StreamFlix High Availability Database Infrastructure - Multi-AZ Aurora, ElastiCache, ECS Fargate, and Real-time Analytics'
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
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('Resources', () => {
    test('should have core StreamFlix resources', () => {
      // Check a representative set of resources expected in this template
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');

      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');

      expect(template.Resources.ElastiCacheReplicationGroup).toBeDefined();
      expect(template.Resources.ElastiCacheReplicationGroup.Type).toBe(
        'AWS::ElastiCache::ReplicationGroup'
      );

      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');

      expect(template.Resources.EFSFileSystem).toBeDefined();
      expect(template.Resources.EFSFileSystem.Type).toBe('AWS::EFS::FileSystem');

      expect(template.Resources.KinesisStream).toBeDefined();
      expect(template.Resources.KinesisStream.Type).toBe('AWS::Kinesis::Stream');

      expect(template.Resources.APIGatewayRestAPI).toBeDefined();
      expect(template.Resources.APIGatewayRestAPI.Type).toBe(
        'AWS::ApiGateway::RestApi'
      );

      expect(template.Resources.DBSecret).toBeDefined();
      // DBSecret can be AWS::SecretsManager::Secret
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });
  });

  describe('Outputs', () => {
    test('should have required outputs (VPC, Aurora endpoints, Redis, EFS, ECS, Kinesis, API, DBSecret, EnvironmentSuffix)', () => {
      const expectedOutputs = [
        'VPCId',
        'AuroraClusterEndpoint',
        'AuroraClusterReadEndpoint',
        'RedisEndpoint',
        'RedisPort',
        'EFSFileSystemId',
        'ECSClusterName',
        'KinesisStreamName',
        'KinesisStreamARN',
        'APIGatewayURL',
        'DBSecretArn',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('AuroraClusterEndpoint output should reference the Aurora cluster', () => {
      const output = template.Outputs.AuroraClusterEndpoint;
      expect(output.Description).toBe('Aurora PostgreSQL cluster endpoint');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['AuroraCluster', 'Endpoint.Address'] });
      expect(output.Export.Name['Fn::Sub']).toMatch(/^\$\{AWS::StackName\}-/);
    });

    test('EnvironmentSuffix output should export with hyphenated suffix', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe('Environment suffix used for this deployment');
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-Environment-Suffix' });
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

    test('should have expected resource/parameter/output counts for StreamFlix', () => {
      const resourceCount = Object.keys(template.Resources).length;
      const parameterCount = Object.keys(template.Parameters).length;
      const outputCount = Object.keys(template.Outputs).length;

      // These counts reflect the generated StreamFlix template in lib/TapStack.json
      expect(resourceCount).toBe(53);
      expect(parameterCount).toBe(8);
      expect(outputCount).toBe(12);
    });
  });

  describe('Resource Naming Convention', () => {
    test('no TAP-specific DynamoDB table present', () => {
      // This template is StreamFlix infra and should not include TurnAroundPromptTable
      expect(template.Resources.TurnAroundPromptTable).toBeUndefined();
    });

    test('export names should start with stack name prefix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        const sub = output.Export.Name['Fn::Sub'];
        expect(typeof sub).toBe('string');
        expect(sub.startsWith('${AWS::StackName}-')).toBe(true);
      });
    });
  });
});
