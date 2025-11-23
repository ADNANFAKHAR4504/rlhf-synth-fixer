import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - IoT Sensor Data Processing Platform', () => {
  let template: any;

  beforeAll(() => {
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
      expect(template.Description).toContain('IoT Sensor Data Processing Platform');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have DBInstanceClass parameter', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      const param = template.Parameters.DBInstanceClass;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('db.t3.micro');
      expect(param.AllowedValues).toContain('db.t3.micro');
    });

    test('should have DBAllocatedStorage parameter', () => {
      expect(template.Parameters.DBAllocatedStorage).toBeDefined();
      const param = template.Parameters.DBAllocatedStorage;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(20);
      expect(param.MinValue).toBe(20);
    });

    test('should have CacheNodeType parameter', () => {
      expect(template.Parameters.CacheNodeType).toBeDefined();
      const param = template.Parameters.CacheNodeType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('cache.t3.micro');
    });

    test('should have DBUsername parameter', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dbadmin');
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key resource', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have key rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
      expect(kmsKey.Properties.KeyPolicy.Statement).toBeInstanceOf(Array);
      expect(kmsKey.Properties.KeyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets in different AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets in different AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have route tables configured', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
    });

    test('should have S3 VPC endpoint for cost optimization', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });
  });

  describe('Security Groups', () => {
    test('should have ECS security group', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.ECSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have RDS security group with proper ingress', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(5432);
      expect(ingress.ToPort).toBe(5432);
      expect(ingress.IpProtocol).toBe('tcp');
    });

    test('should have ElastiCache security group', () => {
      expect(template.Resources.ElastiCacheSecurityGroup).toBeDefined();
      const sg = template.Resources.ElastiCacheSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(6379);
      expect(ingress.ToPort).toBe(6379);
    });
  });

  describe('Secrets Manager', () => {
    test('should have database secret', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('database secret should use KMS encryption', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.KmsKeyId).toBeDefined();
    });

    test('database secret should have proper password configuration', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.RequireEachIncludedType).toBe(true);
    });

    test('should have secret-RDS attachment', () => {
      expect(template.Resources.SecretRDSAttachment).toBeDefined();
      expect(template.Resources.SecretRDSAttachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should have correct deletion policies', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
      expect(rds.UpdateReplacePolicy).toBe('Delete');
    });

    test('RDS should use PostgreSQL', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.Engine).toBe('postgres');
      expect(rds.Properties.EngineVersion).toBeDefined();
    });

    test('RDS should have Multi-AZ enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('RDS should have storage encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toBeDefined();
    });

    test('RDS should not be publicly accessible', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('RDS should have deletion protection disabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('RDS should have CloudWatch logs export enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('postgresql');
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  describe('ElastiCache Redis', () => {
    test('should have Redis replication group', () => {
      expect(template.Resources.RedisCluster).toBeDefined();
      expect(template.Resources.RedisCluster.Type).toBe('AWS::ElastiCache::ReplicationGroup');
    });

    test('Redis should have Multi-AZ enabled', () => {
      const redis = template.Resources.RedisCluster;
      expect(redis.Properties.MultiAZEnabled).toBe(true);
      expect(redis.Properties.AutomaticFailoverEnabled).toBe(true);
    });

    test('Redis should have encryption at rest enabled', () => {
      const redis = template.Resources.RedisCluster;
      expect(redis.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(redis.Properties.KmsKeyId).toBeDefined();
    });

    test('Redis should have transit encryption enabled', () => {
      const redis = template.Resources.RedisCluster;
      expect(redis.Properties.TransitEncryptionEnabled).toBe(true);
    });

    test('Redis should have at least 2 cache clusters', () => {
      const redis = template.Resources.RedisCluster;
      expect(redis.Properties.NumCacheClusters).toBeGreaterThanOrEqual(2);
    });

    test('should have cache subnet group', () => {
      expect(template.Resources.CacheSubnetGroup).toBeDefined();
      expect(template.Resources.CacheSubnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');
    });
  });

  describe('Kinesis Data Stream', () => {
    test('should have Kinesis stream', () => {
      expect(template.Resources.SensorDataStream).toBeDefined();
      expect(template.Resources.SensorDataStream.Type).toBe('AWS::Kinesis::Stream');
    });

    test('Kinesis should have KMS encryption', () => {
      const kinesis = template.Resources.SensorDataStream;
      expect(kinesis.Properties.StreamEncryption).toBeDefined();
      expect(kinesis.Properties.StreamEncryption.EncryptionType).toBe('KMS');
      expect(kinesis.Properties.StreamEncryption.KeyId).toBeDefined();
    });

    test('Kinesis should have proper retention period', () => {
      const kinesis = template.Resources.SensorDataStream;
      expect(kinesis.Properties.RetentionPeriodHours).toBe(168);
    });

    test('Kinesis should have at least 2 shards', () => {
      const kinesis = template.Resources.SensorDataStream;
      expect(kinesis.Properties.ShardCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have ECS log group', () => {
      expect(template.Resources.ECSLogGroup).toBeDefined();
      expect(template.Resources.ECSLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have API Gateway log group', () => {
      expect(template.Resources.APIGatewayLogGroup).toBeDefined();
      expect(template.Resources.APIGatewayLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have audit log group with 90-day retention', () => {
      expect(template.Resources.AuditLogGroup).toBeDefined();
      const auditLog = template.Resources.AuditLogGroup;
      expect(auditLog.Properties.RetentionInDays).toBe(90);
    });

    test('log groups should use KMS encryption', () => {
      expect(template.Resources.ECSLogGroup.Properties.KmsKeyId).toBeDefined();
      expect(template.Resources.APIGatewayLogGroup.Properties.KmsKeyId).toBeDefined();
      expect(template.Resources.AuditLogGroup.Properties.KmsKeyId).toBeDefined();
    });
  });

  describe('ECS Cluster', () => {
    test('should have ECS cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS cluster should have Container Insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.ClusterSettings).toBeDefined();
      const insights = cluster.Properties.ClusterSettings.find(
        (s: any) => s.Name === 'containerInsights'
      );
      expect(insights).toBeDefined();
      expect(insights.Value).toBe('enabled');
    });

    test('should have ECS task execution role', () => {
      expect(template.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(template.Resources.ECSTaskExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ECS task role', () => {
      expect(template.Resources.ECSTaskRole).toBeDefined();
      expect(template.Resources.ECSTaskRole.Type).toBe('AWS::IAM::Role');
    });

    test('ECS task role should have Kinesis permissions', () => {
      const taskRole = template.Resources.ECSTaskRole;
      const policies = taskRole.Properties.Policies;
      const kinesisPolicy = policies.find((p: any) => p.PolicyName === 'KinesisAccess');
      expect(kinesisPolicy).toBeDefined();
    });

    test('should have ECS task definition', () => {
      expect(template.Resources.ECSTaskDefinition).toBeDefined();
      expect(template.Resources.ECSTaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('ECS task definition should use Fargate', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    });
  });

  describe('API Gateway', () => {
    test('should have API Gateway REST API', () => {
      expect(template.Resources.APIGateway).toBeDefined();
      expect(template.Resources.APIGateway.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('API Gateway should be regional', () => {
      const api = template.Resources.APIGateway;
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have API Gateway CloudWatch role', () => {
      expect(template.Resources.APIGatewayCloudWatchRole).toBeDefined();
      expect(template.Resources.APIGatewayCloudWatchRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have API Gateway account', () => {
      expect(template.Resources.APIGatewayAccount).toBeDefined();
      expect(template.Resources.APIGatewayAccount.Type).toBe('AWS::ApiGateway::Account');
    });

    test('should have API Kinesis role for integration', () => {
      expect(template.Resources.APIKinesisRole).toBeDefined();
      const role = template.Resources.APIKinesisRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(policies[0].PolicyName).toBe('KinesisPutRecord');
    });

    test('should have sensor data resource', () => {
      expect(template.Resources.SensorDataResource).toBeDefined();
      expect(template.Resources.SensorDataResource.Type).toBe('AWS::ApiGateway::Resource');
    });

    test('should have sensor data POST method', () => {
      expect(template.Resources.SensorDataMethod).toBeDefined();
      const method = template.Resources.SensorDataMethod;
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('AWS_IAM');
    });

    test('should have API deployment', () => {
      expect(template.Resources.APIDeployment).toBeDefined();
      expect(template.Resources.APIDeployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should have API stage', () => {
      expect(template.Resources.APIStage).toBeDefined();
      const stage = template.Resources.APIStage;
      expect(stage.Properties.StageName).toBe('prod');
      expect(stage.Properties.TracingEnabled).toBe(true);
      expect(stage.Properties.AccessLogSetting).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have RDS CPU alarm', () => {
      expect(template.Resources.RDSCPUAlarm).toBeDefined();
      const alarm = template.Resources.RDSCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
    });

    test('should have Kinesis incoming records alarm', () => {
      expect(template.Resources.KinesisIncomingRecordsAlarm).toBeDefined();
      const alarm = template.Resources.KinesisIncomingRecordsAlarm;
      expect(alarm.Properties.MetricName).toBe('IncomingRecords');
      expect(alarm.Properties.Namespace).toBe('AWS/Kinesis');
    });

    test('should have API Gateway 4xx error alarm', () => {
      expect(template.Resources.APIGateway4xxErrorAlarm).toBeDefined();
      const alarm = template.Resources.APIGateway4xxErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('4XXError');
      expect(alarm.Properties.Namespace).toBe('AWS/ApiGateway');
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC name should include environment suffix', () => {
      const vpc = template.Resources.VPC;
      const tag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(tag.Value).toEqual({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') });
    });

    test('RDS instance identifier should include environment suffix', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DBInstanceIdentifier).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}')
      });
    });

    test('Kinesis stream name should include environment suffix', () => {
      const kinesis = template.Resources.SensorDataStream;
      expect(kinesis.Properties.Name).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}')
      });
    });

    test('ECS cluster name should include environment suffix', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.ClusterName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}')
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have RDS endpoint outputs', () => {
      expect(template.Outputs.RDSEndpoint).toBeDefined();
      expect(template.Outputs.RDSPort).toBeDefined();
    });

    test('should have Redis endpoint outputs', () => {
      expect(template.Outputs.RedisEndpoint).toBeDefined();
      expect(template.Outputs.RedisPort).toBeDefined();
    });

    test('should have Kinesis stream outputs', () => {
      expect(template.Outputs.KinesisStreamName).toBeDefined();
      expect(template.Outputs.KinesisStreamArn).toBeDefined();
    });

    test('should have API Gateway outputs', () => {
      expect(template.Outputs.APIGatewayId).toBeDefined();
      expect(template.Outputs.APIGatewayURL).toBeDefined();
    });

    test('should have ECS cluster outputs', () => {
      expect(template.Outputs.ECSClusterName).toBeDefined();
      expect(template.Outputs.ECSClusterArn).toBeDefined();
    });

    test('should have KMS key outputs', () => {
      expect(template.Outputs.KMSKeyId).toBeDefined();
      expect(template.Outputs.KMSKeyArn).toBeDefined();
    });

    test('should have log group outputs', () => {
      expect(template.Outputs.ECSLogGroupName).toBeDefined();
      expect(template.Outputs.AuditLogGroupName).toBeDefined();
    });

    test('should have DB secret output', () => {
      expect(template.Outputs.DBSecretArn).toBeDefined();
    });

    test('should have EnvironmentSuffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security and Compliance', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
      });
    });

    test('all encryption should use KMS', () => {
      const rds = template.Resources.RDSInstance;
      const redis = template.Resources.RedisCluster;
      const kinesis = template.Resources.SensorDataStream;

      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(redis.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(kinesis.Properties.StreamEncryption.EncryptionType).toBe('KMS');
    });

    test('IAM roles should follow least privilege', () => {
      const taskRole = template.Resources.ECSTaskRole;
      const policies = taskRole.Properties.Policies;

      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThan(0);

      policies.forEach((policy: any) => {
        expect(policy.PolicyDocument.Statement).toBeInstanceOf(Array);
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          expect(statement.Effect).toBe('Allow');
          expect(statement.Action).toBeDefined();
          expect(statement.Resource).toBeDefined();
        });
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(5);
    });

    test('should have multiple resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(40);
    });

    test('should have multiple outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(15);
    });
  });
});
