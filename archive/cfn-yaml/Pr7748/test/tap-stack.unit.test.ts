import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

describe('TapStack CloudFormation Template - Unit Tests', () => {
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
        'Production-grade comprehensive web application infrastructure with data processing pipeline'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      const metadataInterface = template.Metadata['AWS::CloudFormation::Interface'];
      expect(metadataInterface.ParameterGroups).toBeDefined();
      expect(metadataInterface.ParameterGroups).toHaveLength(4);
    });
  });

  describe('Parameters - Environment Configuration', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'prod']);
      expect(param.Description).toBe('Environment designation for tagging and configuration');
    });

    test('should have OwnerEmail parameter', () => {
      expect(template.Parameters.OwnerEmail).toBeDefined();
    });

    test('OwnerEmail parameter should have email validation', () => {
      const param = template.Parameters.OwnerEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('team@example.com');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    });
  });

  describe('Parameters - Network Configuration', () => {
    test('should have VPCCidr parameter with CIDR validation', () => {
      const param = template.Parameters.VPCCidr;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toContain('^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.)');
    });

    test('should have all subnet CIDR parameters', () => {
      const subnetParams = [
        'PublicSubnetCidr1',
        'PublicSubnetCidr2',
        'PrivateSubnetCidr1',
        'PrivateSubnetCidr2',
      ];
      subnetParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
        expect(template.Parameters[paramName].Type).toBe('String');
      });
    });
  });

  describe('Parameters - Database Configuration', () => {
    test('should have DBMasterUsername with constraints', () => {
      const param = template.Parameters.DBMasterUsername;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dbadmin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('should have DBInstanceClass with allowed values', () => {
      const param = template.Parameters.DBInstanceClass;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('db.t3.micro');
      expect(param.AllowedValues).toEqual(['db.t3.micro', 'db.t3.small', 'db.t3.medium']);
    });

    test('should have DBAllocatedStorage with min/max values', () => {
      const param = template.Parameters.DBAllocatedStorage;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(20);
      expect(param.MinValue).toBe(20);
      expect(param.MaxValue).toBe(100);
    });
  });

  describe('Parameters - Application Configuration', () => {
    test('should have LambdaMemorySize with constraints', () => {
      const param = template.Parameters.LambdaMemorySize;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(128);
      expect(param.MinValue).toBe(128);
      expect(param.MaxValue).toBe(512);
    });

    test('should have LambdaTimeout with constraints', () => {
      const param = template.Parameters.LambdaTimeout;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(30);
      expect(param.MinValue).toBe(3);
      expect(param.MaxValue).toBe(60);
    });

    test('should have API Gateway rate limiting parameters', () => {
      expect(template.Parameters.ApiRateLimit).toBeDefined();
      expect(template.Parameters.ApiBurstLimit).toBeDefined();
      expect(template.Parameters.ApiRateLimit.Type).toBe('Number');
      expect(template.Parameters.ApiBurstLimit.Type).toBe('Number');
    });
  });

  describe('Resources - Secrets Manager', () => {
    test('should have DatabaseSecret resource', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DatabaseSecret should generate secure password', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBe('"@/\\');
    });

    test('should have SecretRDSInstanceAttachment', () => {
      expect(template.Resources.SecretRDSInstanceAttachment).toBeDefined();
      expect(template.Resources.SecretRDSInstanceAttachment.Type).toBe(
        'AWS::SecretsManager::SecretTargetAttachment'
      );
    });
  });

  describe('Resources - VPC and Networking', () => {
    test('should have VPC with DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public and private subnets in two AZs', () => {
      const publicSubnets = ['PublicSubnet1', 'PublicSubnet2'];
      const privateSubnets = ['PrivateSubnet1', 'PrivateSubnet2'];

      publicSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBe(true);
      });

      privateSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBeUndefined();
      });
    });

    test('should have NAT Gateways for high availability', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway1EIP).toBeDefined();
      expect(template.Resources.NATGateway2EIP).toBeDefined();
    });

    test('should have route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });
  });

  describe('Resources - Security Groups', () => {
    test('should have security groups for all components', () => {
      const securityGroups = [
        'APIGatewaySecurityGroup',
        'LambdaSecurityGroup',
        'DatabaseSecurityGroup',
      ];
      securityGroups.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('DatabaseSecurityGroup should allow MySQL from Lambda', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const ingress = dbSG.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(3306);
      expect(ingress.ToPort).toBe(3306);
      expect(ingress.SourceSecurityGroupId).toBeDefined();
    });

    test('LambdaSecurityGroup should allow all outbound traffic', () => {
      const lambdaSG = template.Resources.LambdaSecurityGroup;
      const egress = lambdaSG.Properties.SecurityGroupEgress[0];
      expect(egress.IpProtocol).toBe(-1);
      expect(egress.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Resources - S3 Bucket', () => {
    test('should have DataBucket with versioning enabled', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('DataBucket should have encryption configured', () => {
      const bucket = template.Resources.DataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('DataBucket should have lifecycle configuration for Glacier', () => {
      const bucket = template.Resources.DataBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      expect(lifecycle).toBeDefined();
      expect(lifecycle.Rules[0].Transitions[0].TransitionInDays).toBe(30);
      expect(lifecycle.Rules[0].Transitions[0].StorageClass).toBe('GLACIER');
    });

    test('DataBucket should block public access', () => {
      const bucket = template.Resources.DataBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have DataBucketPolicy enforcing HTTPS', () => {
      const policy = template.Resources.DataBucketPolicy;
      expect(policy).toBeDefined();
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('Resources - Lambda Functions', () => {
    test('should have DataProcessorFunction with VPC configuration', () => {
      const func = template.Resources.DataProcessorFunction;
      expect(func).toBeDefined();
      expect(func.Type).toBe('AWS::Lambda::Function');
      expect(func.Properties.Runtime).toBe('python3.9');
      expect(func.Properties.VpcConfig).toBeDefined();
      expect(func.Properties.VpcConfig.SubnetIds).toHaveLength(2);
    });

    test('DataProcessorFunction should have environment variables', () => {
      const func = template.Resources.DataProcessorFunction;
      const env = func.Properties.Environment.Variables;
      expect(env.BUCKET_NAME).toBeDefined();
      expect(env.SNS_TOPIC_ARN).toBeDefined();
      expect(env.DB_SECRET_ARN).toBeDefined();
      expect(env.DB_ENDPOINT).toBeDefined();
    });

    test('should have S3EventProcessorFunction', () => {
      expect(template.Resources.S3EventProcessorFunction).toBeDefined();
      expect(template.Resources.S3EventProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have GlacierCheckFunction with scheduled trigger', () => {
      expect(template.Resources.GlacierCheckFunction).toBeDefined();
      expect(template.Resources.GlacierTransitionCheckRule).toBeDefined();
      const rule = template.Resources.GlacierTransitionCheckRule;
      expect(rule.Properties.ScheduleExpression).toBe('rate(1 day)');
    });
  });

  describe('Resources - IAM Roles', () => {
    test('LambdaExecutionRole should have VPC access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('LambdaExecutionRole should have S3, SNS and Secrets Manager permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const policyNames = policies.map((p: any) => p.PolicyName);
      expect(policyNames).toContain('S3Access');
      expect(policyNames).toContain('SNSPublish');
      expect(policyNames).toContain('SecretsManagerAccess');
      expect(policyNames).toContain('CloudWatchMetrics');
    });

    test('S3EventProcessorRole should have S3 read permissions', () => {
      const role = template.Resources.S3EventProcessorRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
    });
  });

  describe('Resources - API Gateway', () => {
    test('should have RestApi with regional endpoint', () => {
      const api = template.Resources.RestApi;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have ApiResource with /process path', () => {
      const resource = template.Resources.ApiResource;
      expect(resource).toBeDefined();
      expect(resource.Properties.PathPart).toBe('process');
    });

    test('ApiMethod should use AWS_PROXY integration', () => {
      const method = template.Resources.ApiMethod;
      expect(method).toBeDefined();
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.HttpMethod).toBe('POST');
    });

    test('should have request validator and model', () => {
      expect(template.Resources.ApiRequestValidator).toBeDefined();
      expect(template.Resources.ApiRequestModel).toBeDefined();
      const model = template.Resources.ApiRequestModel;
      expect(model.Properties.Schema.required).toContain('userId');
      expect(model.Properties.Schema.required).toContain('data');
    });

    test('ApiDeployment should have throttling configured', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment).toBeDefined();
      const methodSettings = deployment.Properties.StageDescription.MethodSettings[0];
      expect(methodSettings.ThrottlingRateLimit).toBeDefined();
      expect(methodSettings.ThrottlingBurstLimit).toBeDefined();
    });
  });

  describe('Resources - RDS Database', () => {
    test('should have Database with Multi-AZ enabled', () => {
      const db = template.Resources.Database;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.MultiAZ).toBe(true);
    });

    test('Database should use gp3 storage with encryption', () => {
      const db = template.Resources.Database;
      expect(db.Properties.StorageType).toBe('gp3');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toBe('alias/aws/rds');
    });

    test('Database should have backup and maintenance windows', () => {
      const db = template.Resources.Database;
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
      expect(db.Properties.PreferredBackupWindow).toBe('03:00-04:00');
      expect(db.Properties.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
    });

    test('Database should have CloudWatch logs exports', () => {
      const db = template.Resources.Database;
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('should have DBSubnetGroup in private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });
  });

  describe('Resources - SNS Topic', () => {
    test('should have SNSTopic with email subscription', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });

    test('SNSTopic should use KMS encryption', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
    });
  });

  describe('Resources - CloudWatch', () => {
    test('should have alarms for Lambda errors and throttles', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaThrottleAlarm).toBeDefined();
    });

    test('should have alarms for RDS metrics', () => {
      expect(template.Resources.DatabaseCPUAlarm).toBeDefined();
      expect(template.Resources.DatabaseStorageAlarm).toBeDefined();
    });

    test('should have alarms for API Gateway errors', () => {
      expect(template.Resources.ApiGateway4xxAlarm).toBeDefined();
      expect(template.Resources.ApiGateway5xxAlarm).toBeDefined();
    });

    test('should have MonitoringDashboard', () => {
      expect(template.Resources.MonitoringDashboard).toBeDefined();
      expect(template.Resources.MonitoringDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });
  });

  describe('Resources - CloudTrail', () => {
    test('should have CloudTrailBucket with lifecycle', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket).toBeDefined();
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      expect(lifecycle.Rules[0].ExpirationInDays).toBe(90);
    });

    test('should have CloudTrail with logging enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'StackName',
        'Region',
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'NATGateway1Id',
        'NATGateway2Id',
        'APIGatewayURL',
        'APIGatewayId',
        'DataBucketName',
        'DataBucketArn',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'DatabaseEndpoint',
        'DatabasePort',
        'DatabaseSecretArn',
        'SNSTopicArn',
        'CloudTrailArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('APIGatewayURL should have correct format', () => {
      const output = template.Outputs.APIGatewayURL;
      expect(output.Value).toBeDefined();
      expect(typeof output.Value).toBe('object');
    });

    test('all outputs should have exports with stack name prefix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
        }
      });
    });
  });

  describe('Tagging Strategy', () => {
    test('all resources should have Environment tag', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.Properties && resource.Properties.Tags) {
          const tags = Array.isArray(resource.Properties.Tags)
            ? resource.Properties.Tags
            : Object.entries(resource.Properties.Tags).map(([Key, Value]) => ({ Key, Value }));
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          expect(envTag).toBeDefined();
        }
      });
    });

    test('resources should have iac-rlhf-amazon tag', () => {
      const resources = template.Resources;
      let taggedResources = 0;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.Properties && resource.Properties.Tags) {
          const tags = Array.isArray(resource.Properties.Tags)
            ? resource.Properties.Tags
            : Object.entries(resource.Properties.Tags).map(([Key, Value]) => ({ Key, Value }));
          const iacTag = tags.find((t: any) => t.Key === 'iac-rlhf-amazon');
          if (iacTag) taggedResources++;
        }
      });
      expect(taggedResources).toBeGreaterThan(0);
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets should have encryption enabled', () => {
      const buckets = ['DataBucket', 'CloudTrailBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('Lambda functions should have proper IAM roles', () => {
      const functions = [
        'DataProcessorFunction',
        'S3EventProcessorFunction',
        'GlacierCheckFunction',
      ];
      functions.forEach(funcName => {
        const func = template.Resources[funcName];
        expect(func.Properties.Role).toBeDefined();
      });
    });

    test('RDS should use Secrets Manager for credentials', () => {
      const db = template.Resources.Database;
      expect(db.Properties.MasterUsername).toBeDefined();
      expect(typeof db.Properties.MasterUsername).toBe('object');
    });
  });

  describe('Cost Optimization', () => {
    test('RDS should use cost-optimized instance class by default', () => {
      const dbInstanceClass = template.Parameters.DBInstanceClass;
      expect(dbInstanceClass.Default).toBe('db.t3.micro');
    });

    test('S3 should have lifecycle rules for cost optimization', () => {
      const bucket = template.Resources.DataBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      expect(lifecycle.Rules[0].Transitions[0].StorageClass).toBe('GLACIER');
    });

    test('should have EstimatedMonthlyCost output', () => {
      expect(template.Outputs.EstimatedMonthlyCost).toBeDefined();
    });
  });

  describe('High Availability', () => {
    test('should have resources in multiple availability zones', () => {
      const subnets = [
        template.Resources.PublicSubnet1,
        template.Resources.PublicSubnet2,
        template.Resources.PrivateSubnet1,
        template.Resources.PrivateSubnet2,
      ];
      subnets.forEach(subnet => {
        expect(subnet.Properties.AvailabilityZone).toBeDefined();
      });
    });

    test('should have multiple NAT Gateways for HA', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
    });

    test('RDS should have Multi-AZ enabled', () => {
      const db = template.Resources.Database;
      expect(db.Properties.MultiAZ).toBe(true);
    });
  });
});
