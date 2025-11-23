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

  describe('Unit Test Coverage', () => {
    test('Unit tests validate CloudFormation template structure', async () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Media Asset Processing Pipeline for StreamTech Japan - Multi-AZ Infrastructure'
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

    test('should have EnableRedisAuth parameter', () => {
      expect(template.Parameters.EnableRedisAuth).toBeDefined();
      const enableRedisAuthParam = template.Parameters.EnableRedisAuth;
      expect(enableRedisAuthParam.Type).toBe('String');
      expect(enableRedisAuthParam.Default).toBe('false');
      expect(enableRedisAuthParam.AllowedValues).toEqual(['true', 'false']);
    });

    test('should have VpcCidr parameter', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      const vpcCidrParam = template.Parameters.VpcCidr;
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.Default).toBe('10.0.0.0/16');
    });
  });

  describe('Conditions', () => {
    test('should have UseRedisAuth condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.UseRedisAuth).toBeDefined();
    });

    test('should have UseRDSSecrets condition', () => {
      expect(template.Conditions.UseRDSSecrets).toBeDefined();
    });

    test('should have HasTimestamp condition', () => {
      expect(template.Conditions.HasTimestamp).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have RDS database instance', () => {
      expect(template.Resources.RDSDBInstance).toBeDefined();
      expect(template.Resources.RDSDBInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have ElastiCache replication group', () => {
      expect(template.Resources.ElastiCacheReplicationGroup).toBeDefined();
      expect(template.Resources.ElastiCacheReplicationGroup.Type).toBe('AWS::ElastiCache::ReplicationGroup');
    });

    test('should have EFS file system', () => {
      expect(template.Resources.EFSFileSystem).toBeDefined();
      expect(template.Resources.EFSFileSystem.Type).toBe('AWS::EFS::FileSystem');
    });

    test('should have API Gateway', () => {
      expect(template.Resources.RestAPI).toBeDefined();
      expect(template.Resources.RestAPI.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have CodePipeline', () => {
      expect(template.Resources.MediaPipeline).toBeDefined();
      expect(template.Resources.MediaPipeline.Type).toBe('AWS::CodePipeline::Pipeline');
    });

    test('should have S3 artifacts bucket', () => {
      expect(template.Resources.ArtifactBucket).toBeDefined();
      expect(template.Resources.ArtifactBucket.Type).toBe('AWS::S3::Bucket');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'RDSEndpoint',
        'RedisEndpoint',
        'APIEndpoint',
        'EFSFileSystemId',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId',
      });
    });

    test('RDSEndpoint output should be correct', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBe('RDS PostgreSQL endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSDBInstance', 'Endpoint.Address'],
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('CloudFormation stack name');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
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

    test('should have multiple AWS resources for media processing', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Complex media processing pipeline
    });

    test('should have required parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(6); // EnvironmentSuffix, VpcCidr, EnableRedisAuth, EnableRDSSecrets, DefaultDBUsername, DefaultDBPassword, ResourceTimestamp
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.EnableRedisAuth).toBeDefined();
      expect(template.Parameters.EnableRDSSecrets).toBeDefined();
      expect(template.Parameters.DefaultDBUsername).toBeDefined();
      expect(template.Parameters.DefaultDBPassword).toBeDefined();
      expect(template.Parameters.ResourceTimestamp).toBeDefined();
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(10); // Media processing pipeline outputs
    });
  });

  describe('Resource Naming Convention', () => {
    test('S3 bucket name should support dynamic naming with timestamp', () => {
      const bucket = template.Resources.ArtifactBucket;
      const bucketName = bucket.Properties.BucketName;

      // Check that it uses conditional naming (Fn::If with HasTimestamp condition)
      expect(bucketName['Fn::If']).toBeDefined();
      expect(bucketName['Fn::If'][0]).toBe('HasTimestamp');
      expect(bucketName['Fn::If'][1]['Fn::Sub']).toBe('media-artifacts-${EnvironmentSuffix}-${AWS::AccountId}-${ResourceTimestamp}');
      expect(bucketName['Fn::If'][2]['Fn::Sub']).toBe('media-artifacts-${EnvironmentSuffix}-${AWS::AccountId}');
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});
