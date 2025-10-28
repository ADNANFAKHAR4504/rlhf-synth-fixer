import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
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
        'FedRAMP-Compliant API Infrastructure for Government Data Distribution'
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
        'Environment suffix for resource naming (e.g., dev, staging, prod123)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('should have VPC and network configuration parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
    });

    test('should have cache configuration parameters', () => {
      expect(template.Parameters.CacheNodeType).toBeDefined();
      expect(template.Parameters.CacheTTL).toBeDefined();
      expect(template.Parameters.CacheTTL.Default).toBe(3600);
    });

    test('should have API throttling parameters', () => {
      expect(template.Parameters.ThrottleBurstLimit).toBeDefined();
      expect(template.Parameters.ThrottleRateLimit).toBeDefined();
      expect(template.Parameters.ThrottleBurstLimit.Default).toBe(1000);
      expect(template.Parameters.ThrottleRateLimit.Default).toBe(1000);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have FedRAMPVPC resource', () => {
      expect(template.Resources.FedRAMPVPC).toBeDefined();
      expect(template.Resources.FedRAMPVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.FedRAMPVPC;
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });
  });

  describe('Encryption - KMS Resources', () => {
    test('should have KMS encryption key', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have automatic rotation enabled', () => {
      const key = template.Resources.EncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('ElastiCache Redis Resources', () => {
    test('should have Redis replication group', () => {
      expect(template.Resources.RedisReplicationGroup).toBeDefined();
      expect(template.Resources.RedisReplicationGroup.Type).toBe(
        'AWS::ElastiCache::ReplicationGroup'
      );
    });

    test('Redis should have encryption enabled', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(redis.Properties.TransitEncryptionEnabled).toBe(true);
    });

    test('Redis should have Multi-AZ and automatic failover enabled', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis.Properties.MultiAZEnabled).toBe(true);
      expect(redis.Properties.AutomaticFailoverEnabled).toBe(true);
    });

    test('should have cache subnet group', () => {
      expect(template.Resources.CacheSubnetGroup).toBeDefined();
      expect(template.Resources.CacheSubnetGroup.Type).toBe(
        'AWS::ElastiCache::SubnetGroup'
      );
    });

    test('should have cache security group', () => {
      expect(template.Resources.CacheSecurityGroup).toBeDefined();
      expect(template.Resources.CacheSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });
  });

  describe('Kinesis Data Streams Resources', () => {
    test('should have audit log stream', () => {
      expect(template.Resources.AuditLogStream).toBeDefined();
      expect(template.Resources.AuditLogStream.Type).toBe('AWS::Kinesis::Stream');
    });

    test('Kinesis stream should have encryption enabled', () => {
      const stream = template.Resources.AuditLogStream;
      expect(stream.Properties.StreamEncryption).toBeDefined();
      expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
    });

    test('Kinesis stream should have 7-day retention', () => {
      const stream = template.Resources.AuditLogStream;
      expect(stream.Properties.RetentionPeriodHours).toBe(168);
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have API key secret', () => {
      expect(template.Resources.APIKeySecret).toBeDefined();
      expect(template.Resources.APIKeySecret.Type).toBe(
        'AWS::SecretsManager::Secret'
      );
    });

    test('Secret should be encrypted with KMS', () => {
      const secret = template.Resources.APIKeySecret;
      expect(secret.Properties.KmsKeyId).toBeDefined();
    });
  });

  describe('API Gateway Resources', () => {
    test('should have REST API', () => {
      expect(template.Resources.FedRAMPRestAPI).toBeDefined();
      expect(template.Resources.FedRAMPRestAPI.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have API resources and methods', () => {
      expect(template.Resources.DataResource).toBeDefined();
      expect(template.Resources.DataResource.Type).toBe(
        'AWS::ApiGateway::Resource'
      );
      expect(template.Resources.DataMethodGet).toBeDefined();
      expect(template.Resources.DataMethodGet.Type).toBe('AWS::ApiGateway::Method');
    });

    test('should have API deployment and stage', () => {
      expect(template.Resources.APIDeployment).toBeDefined();
      expect(template.Resources.APIDeployment.Type).toBe(
        'AWS::ApiGateway::Deployment'
      );
      expect(template.Resources.APIStage).toBeDefined();
      expect(template.Resources.APIStage.Type).toBe('AWS::ApiGateway::Stage');
    });

    test('API Stage should have caching enabled', () => {
      const stage = template.Resources.APIStage;
      expect(stage.Properties.CacheClusterEnabled).toBe(true);
    });

    test('API Stage should have tracing enabled', () => {
      const stage = template.Resources.APIStage;
      expect(stage.Properties.TracingEnabled).toBe(true);
    });

    test('should have usage plan with throttling', () => {
      expect(template.Resources.APIUsagePlan).toBeDefined();
      expect(template.Resources.APIUsagePlan.Type).toBe(
        'AWS::ApiGateway::UsagePlan'
      );
      const usagePlan = template.Resources.APIUsagePlan;
      expect(usagePlan.Properties.Throttle).toBeDefined();
    });

    test('should have API key', () => {
      expect(template.Resources.APIKey).toBeDefined();
      expect(template.Resources.APIKey.Type).toBe('AWS::ApiGateway::ApiKey');
    });

    test('should have API security group', () => {
      expect(template.Resources.APIGatewaySecurityGroup).toBeDefined();
      expect(template.Resources.APIGatewaySecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });
  });

  describe('CloudWatch Monitoring Resources', () => {
    test('should have API log group', () => {
      expect(template.Resources.APILogGroup).toBeDefined();
      expect(template.Resources.APILogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Log group should have encryption enabled', () => {
      const logGroup = template.Resources.APILogGroup;
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('Log group should have 90-day retention', () => {
      const logGroup = template.Resources.APILogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(90);
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.ThrottlingAlarm).toBeDefined();
      expect(template.Resources.ThrottlingAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.CacheHitRateAlarm).toBeDefined();
      expect(template.Resources.CacheHitRateAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('should have API Gateway CloudWatch role', () => {
      expect(template.Resources.APIGatewayCloudWatchRole).toBeDefined();
      expect(template.Resources.APIGatewayCloudWatchRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have API Gateway account configuration', () => {
      expect(template.Resources.APIGatewayAccount).toBeDefined();
      expect(template.Resources.APIGatewayAccount.Type).toBe(
        'AWS::ApiGateway::Account'
      );
    });
  });

  describe('Outputs', () => {
    test('should have VPC and networking outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have KMS outputs', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyArn).toBeDefined();
    });

    test('should have Redis outputs', () => {
      expect(template.Outputs.RedisEndpoint).toBeDefined();
      expect(template.Outputs.RedisPort).toBeDefined();
    });

    test('should have Kinesis outputs', () => {
      expect(template.Outputs.KinesisStreamName).toBeDefined();
      expect(template.Outputs.KinesisStreamArn).toBeDefined();
    });

    test('should have Secrets Manager output', () => {
      expect(template.Outputs.SecretsManagerArn).toBeDefined();
    });

    test('should have API Gateway outputs', () => {
      expect(template.Outputs.RestAPIId).toBeDefined();
      expect(template.Outputs.RestAPIEndpoint).toBeDefined();
      expect(template.Outputs.APIKeyId).toBeDefined();
      expect(template.Outputs.UsagePlanId).toBeDefined();
    });

    test('should have CloudWatch output', () => {
      expect(template.Outputs.CloudWatchLogGroupName).toBeDefined();
    });

    test('should have EnvironmentSuffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix.Description).toBe(
        'Environment suffix used for this deployment'
      );
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
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

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8);
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(24);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(16);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use environment suffix in naming', () => {
      const vpcTags = template.Resources.FedRAMPVPC.Properties.Tags;
      const nameTag = vpcTags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual(
        expect.objectContaining({
          'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
        })
      );
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

  describe('Security and Compliance', () => {
    test('all encryption should use KMS key', () => {
      const redis = template.Resources.RedisReplicationGroup;
      const kinesis = template.Resources.AuditLogStream;
      const secret = template.Resources.APIKeySecret;
      const logGroup = template.Resources.APILogGroup;

      expect(redis.Properties.KmsKeyId).toBeDefined();
      expect(kinesis.Properties.StreamEncryption.KeyId).toBeDefined();
      expect(secret.Properties.KmsKeyId).toBeDefined();
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('API method should require API key', () => {
      const method = template.Resources.DataMethodGet;
      expect(method.Properties.ApiKeyRequired).toBe(true);
    });

    test('subnets should not have public IP on launch', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });
  });
});
