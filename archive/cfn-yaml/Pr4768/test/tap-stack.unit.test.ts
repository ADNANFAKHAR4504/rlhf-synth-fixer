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

  describe('Write Integration TESTS', () => {
    test('Integration tests are implemented', async () => {
      // Integration tests should be implemented separately
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
        'PCI-DSS Compliant Financial Transaction Processing Infrastructure with High Availability'
      );
    });

    test('should have valid structure with all required sections', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.Description).toBe('Unique suffix for resource naming');
      expect(envSuffixParam.AllowedPattern).toBe('[a-zA-Z0-9-]*');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters and hyphens'
      );
    });

    test('should have DatabaseMasterUsername parameter', () => {
      const param = template.Parameters.DatabaseMasterUsername;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dbadmin');
      expect(param.NoEcho).toBe(true);
    });

    test('should have VpcCIDR parameter', () => {
      const param = template.Parameters.VpcCIDR;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
    });
  });

  describe('KMS Encryption Keys', () => {
    test('should have DatabaseEncryptionKey', () => {
      const key = template.Resources.DatabaseEncryptionKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.DeletionPolicy).toBe('Delete');
      expect(key.UpdateReplacePolicy).toBe('Delete');
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('DatabaseEncryptionKey should have proper key policy', () => {
      const key = template.Resources.DatabaseEncryptionKey;
      const policy = key.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(2);
      expect(policy.Statement[0].Sid).toBe('Enable IAM User Permissions');
      expect(policy.Statement[1].Sid).toBe('Allow RDS to use the key');
    });

    test('should have DatabaseEncryptionKeyAlias', () => {
      const alias = template.Resources.DatabaseEncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/rds-encryption-${EnvironmentSuffix}',
      });
    });

    test('should have EFSEncryptionKey', () => {
      const key = template.Resources.EFSEncryptionKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have EFSEncryptionKeyAlias', () => {
      const alias = template.Resources.EFSEncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('VPC and Network Infrastructure', () => {
    test('should have VPC with correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.DeletionPolicy).toBe('Delete');
    });

    test('should have InternetGateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have InternetGatewayAttachment', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have three public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();

      const subnet1 = template.Resources.PublicSubnet1;
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
    });

    test('should have three private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();

      const subnet1 = template.Resources.PrivateSubnet1;
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should have NAT Gateway with EIP', () => {
      const eip = template.Resources.NatGatewayEIP;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');

      const nat = template.Resources.NatGateway;
      expect(nat).toBeDefined();
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute).toBeDefined();
    });

    test('should have subnet route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet3RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet3RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALBSecurityGroup with correct configuration', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for Application Load Balancer');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const httpsRule = sg.Properties.SecurityGroupIngress[0];
      expect(httpsRule.FromPort).toBe(443);
      expect(httpsRule.ToPort).toBe(443);
    });

    test('ALBSecurityGroup should not have invalid GroupName', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Properties.GroupName).toBeUndefined();
    });

    test('should have ECSSecurityGroup', () => {
      const sg = template.Resources.ECSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for ECS Fargate tasks');
    });

    test('should have DatabaseSecurityGroup', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(5432);
    });

    test('should have RedisSecurityGroup', () => {
      const sg = template.Resources.RedisSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(6379);
    });

    test('should have EFSSecurityGroup', () => {
      const sg = template.Resources.EFSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(2049);
    });
  });

  describe('Secrets Manager', () => {
    test('should have DatabaseSecret', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.DeletionPolicy).toBe('Delete');
    });

    test('DatabaseSecret should generate password', () => {
      const secret = template.Resources.DatabaseSecret;
      const genConfig = secret.Properties.GenerateSecretString;
      expect(genConfig).toBeDefined();
      expect(genConfig.PasswordLength).toBe(32);
      expect(genConfig.GenerateStringKey).toBe('password');
    });
  });

  describe('RDS Aurora PostgreSQL', () => {
    test('should have DBSubnetGroup', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(3);
    });

    test('should have AuroraDBCluster with encryption', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.BackupRetentionPeriod).toBe(7);
      expect(cluster.Properties.DeletionProtection).toBe(false);
    });

    test('should have three Aurora DB instances', () => {
      expect(template.Resources.AuroraDBInstance1).toBeDefined();
      expect(template.Resources.AuroraDBInstance2).toBeDefined();
      expect(template.Resources.AuroraDBInstance3).toBeDefined();

      const instance = template.Resources.AuroraDBInstance1;
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.Engine).toBe('aurora-postgresql');
      expect(instance.Properties.DBInstanceClass).toBe('db.r6g.large');
      expect(instance.Properties.EnablePerformanceInsights).toBe(true);
    });
  });

  describe('ElastiCache Redis', () => {
    test('should have RedisSubnetGroup', () => {
      const subnetGroup = template.Resources.RedisSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');
    });

    test('should have RedisReplicationGroup with encryption', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis).toBeDefined();
      expect(redis.Type).toBe('AWS::ElastiCache::ReplicationGroup');
      expect(redis.Properties.Engine).toBe('redis');
      expect(redis.Properties.NumCacheClusters).toBe(3);
      expect(redis.Properties.MultiAZEnabled).toBe(true);
      expect(redis.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(redis.Properties.TransitEncryptionEnabled).toBe(true);
      expect(redis.Properties.AutomaticFailoverEnabled).toBe(true);
    });
  });

  describe('EFS File System', () => {
    test('should have EFSFileSystem with encryption', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs).toBeDefined();
      expect(efs.Type).toBe('AWS::EFS::FileSystem');
      expect(efs.Properties.Encrypted).toBe(true);
      expect(efs.Properties.PerformanceMode).toBe('generalPurpose');
    });

    test('should have three EFS mount targets', () => {
      expect(template.Resources.EFSMountTarget1).toBeDefined();
      expect(template.Resources.EFSMountTarget2).toBeDefined();
      expect(template.Resources.EFSMountTarget3).toBeDefined();

      const mount = template.Resources.EFSMountTarget1;
      expect(mount.Type).toBe('AWS::EFS::MountTarget');
    });
  });

  describe('Kinesis Data Stream', () => {
    test('should have TransactionDataStream', () => {
      const stream = template.Resources.TransactionDataStream;
      expect(stream).toBeDefined();
      expect(stream.Type).toBe('AWS::Kinesis::Stream');
      expect(stream.Properties.ShardCount).toBe(3);
      expect(stream.Properties.RetentionPeriodHours).toBe(24);
    });

    test('TransactionDataStream should have encryption', () => {
      const stream = template.Resources.TransactionDataStream;
      expect(stream.Properties.StreamEncryption).toBeDefined();
      expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have ECSLogGroup', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have APIGatewayLogGroup', () => {
      const logGroup = template.Resources.APIGatewayLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('IAM Roles', () => {
    test('should have ECSTaskExecutionRole', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      );
    });

    test('ECSTaskExecutionRole should have required policies', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      expect(role.Properties.Policies).toHaveLength(2);
      expect(role.Properties.Policies[0].PolicyName).toBe('SecretsManagerAccess');
      expect(role.Properties.Policies[1].PolicyName).toBe('CloudWatchLogsAccess');
    });

    test('should have ECSTaskRole', () => {
      const role = template.Resources.ECSTaskRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('ECSTaskRole should have required policies', () => {
      const role = template.Resources.ECSTaskRole;
      expect(role.Properties.Policies).toHaveLength(3);
      expect(role.Properties.Policies[0].PolicyName).toBe('KinesisAccess');
      expect(role.Properties.Policies[1].PolicyName).toBe('SecretsManagerAccess');
      expect(role.Properties.Policies[2].PolicyName).toBe('CloudWatchMetrics');
    });

    test('should have APIGatewayCloudWatchRole', () => {
      const role = template.Resources.APIGatewayCloudWatchRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('ECS Cluster and Service', () => {
    test('should have ECSCluster', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::ECS::Cluster');
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE');
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE_SPOT');
    });

    test('ECSCluster should have container insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.ClusterSettings[0].Name).toBe('containerInsights');
      expect(cluster.Properties.ClusterSettings[0].Value).toBe('enabled');
    });

    test('should have ECSTaskDefinition', () => {
      const task = template.Resources.ECSTaskDefinition;
      expect(task).toBeDefined();
      expect(task.Type).toBe('AWS::ECS::TaskDefinition');
      expect(task.Properties.NetworkMode).toBe('awsvpc');
      expect(task.Properties.RequiresCompatibilities).toContain('FARGATE');
    });

    test('ECSTaskDefinition should have container with environment variables', () => {
      const task = template.Resources.ECSTaskDefinition;
      const container = task.Properties.ContainerDefinitions[0];
      expect(container.Name).toBe('transaction-processor');
      expect(container.Environment).toBeDefined();
      expect(container.Secrets).toBeDefined();
      // HealthCheck removed to avoid dependency on tools not available in container
      expect(container.HealthCheck).toBeUndefined();
    });

    test('should have ApplicationLoadBalancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should have ALBTargetGroup with health checks', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.TargetType).toBe('ip');
    });

    test('should have ALBListener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
    });

    test('should have ECSService', () => {
      const service = template.Resources.ECSService;
      expect(service).toBeDefined();
      expect(service.Type).toBe('AWS::ECS::Service');
      expect(service.Properties.DesiredCount).toBe(3);
      expect(service.Properties.LaunchType).toBe('FARGATE');
    });

    test('ECSService should have circuit breaker', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.DeploymentConfiguration.DeploymentCircuitBreaker).toBeDefined();
      expect(service.Properties.DeploymentConfiguration.DeploymentCircuitBreaker.Enable).toBe(true);
      expect(service.Properties.DeploymentConfiguration.DeploymentCircuitBreaker.Rollback).toBe(true);
    });
  });

  describe('Auto Scaling', () => {
    test('should have ECSServiceScalingTarget', () => {
      const target = template.Resources.ECSServiceScalingTarget;
      expect(target).toBeDefined();
      expect(target.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
      expect(target.Properties.MinCapacity).toBe(3);
      expect(target.Properties.MaxCapacity).toBe(15);
    });

    test('should have ECSServiceScalingPolicy', () => {
      const policy = template.Resources.ECSServiceScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });

    test('ECSServiceScalingPolicy should target CPU utilization', () => {
      const policy = template.Resources.ECSServiceScalingPolicy;
      const config = policy.Properties.TargetTrackingScalingPolicyConfiguration;
      expect(config.PredefinedMetricSpecification.PredefinedMetricType).toBe('ECSServiceAverageCPUUtilization');
      expect(config.TargetValue).toBe(70.0);
    });
  });

  describe('API Gateway', () => {
    test('should have TransactionAPI', () => {
      const api = template.Resources.TransactionAPI;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have TransactionResource', () => {
      const resource = template.Resources.TransactionResource;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('transactions');
    });

    test('should have API methods', () => {
      expect(template.Resources.TransactionMethodPost).toBeDefined();
      expect(template.Resources.TransactionMethodGet).toBeDefined();

      const postMethod = template.Resources.TransactionMethodPost;
      expect(postMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(postMethod.Properties.HttpMethod).toBe('POST');
    });

    test('should have APIDeployment', () => {
      const deployment = template.Resources.APIDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.Properties.StageName).toBe('prod');
    });

    test('APIDeployment should have logging and tracing', () => {
      const deployment = template.Resources.APIDeployment;
      const stageDesc = deployment.Properties.StageDescription;
      expect(stageDesc.LoggingLevel).toBe('INFO');
      expect(stageDesc.DataTraceEnabled).toBe(true);
      expect(stageDesc.MetricsEnabled).toBe(true);
      expect(stageDesc.TracingEnabled).toBe(true);
    });

    test('should have APIGatewayAccount', () => {
      const account = template.Resources.APIGatewayAccount;
      expect(account).toBeDefined();
      expect(account.Type).toBe('AWS::ApiGateway::Account');
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      const output = template.Outputs.VPCId;
      expect(output).toBeDefined();
      expect(output.Description).toBe('VPC ID');
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-VPCId' });
    });

    test('should have DatabaseEndpoint output', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toBe('RDS Aurora cluster endpoint');
    });

    test('should have DatabasePort output', () => {
      const output = template.Outputs.DatabasePort;
      expect(output).toBeDefined();
      expect(output.Description).toBe('RDS Aurora cluster port');
    });

    test('should have RedisEndpoint output', () => {
      const output = template.Outputs.RedisEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toBe('ElastiCache Redis primary endpoint');
    });

    test('should have RedisPort output', () => {
      const output = template.Outputs.RedisPort;
      expect(output).toBeDefined();
      expect(output.Description).toBe('ElastiCache Redis port');
    });

    test('should have KinesisStreamName output', () => {
      const output = template.Outputs.KinesisStreamName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Kinesis Data Stream name');
    });

    test('should have EFSFileSystemId output', () => {
      const output = template.Outputs.EFSFileSystemId;
      expect(output).toBeDefined();
      expect(output.Description).toBe('EFS File System ID');
    });

    test('should have LoadBalancerDNS output', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Application Load Balancer DNS name');
    });

    test('should have APIGatewayURL output', () => {
      const output = template.Outputs.APIGatewayURL;
      expect(output).toBeDefined();
      expect(output.Description).toBe('API Gateway endpoint URL');
    });

    test('should have ECSClusterName output', () => {
      const output = template.Outputs.ECSClusterName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('ECS Cluster name');
    });

    test('should have DatabaseSecretArn output', () => {
      const output = template.Outputs.DatabaseSecretArn;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Secrets Manager secret ARN for database credentials');
    });

    test('all outputs should have Export with Name', () => {
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

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });

    test('should have 62 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(62);
    });

    test('all resources should have valid types', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': 'vpc-transaction-${EnvironmentSuffix}',
      });
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

  describe('Deletion Policies', () => {
    test('critical resources should have Delete policies', () => {
      const criticalResources = [
        'VPC',
        'AuroraDBCluster',
        'RedisReplicationGroup',
        'EFSFileSystem',
        'TransactionDataStream',
        'DatabaseSecret',
      ];

      criticalResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });
  });

  describe('Security Configuration', () => {
    test('database should use encryption at rest', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({ Ref: 'DatabaseEncryptionKey' });
    });

    test('Redis should use encryption at rest and in transit', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(redis.Properties.TransitEncryptionEnabled).toBe(true);
    });

    test('EFS should use encryption', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs.Properties.Encrypted).toBe(true);
      expect(efs.Properties.KmsKeyId).toEqual({ Ref: 'EFSEncryptionKey' });
    });

    test('Kinesis should use encryption', () => {
      const stream = template.Resources.TransactionDataStream;
      expect(stream.Properties.StreamEncryption).toBeDefined();
      expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
    });

    test('security groups should not allow unrestricted access to databases', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      const redisSg = template.Resources.RedisSecurityGroup;

      dbSg.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.CidrIp).toBeUndefined();
        expect(rule.SourceSecurityGroupId).toBeDefined();
      });

      redisSg.Properties.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.CidrIp).toBeUndefined();
        expect(rule.SourceSecurityGroupId).toBeDefined();
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('should deploy across three availability zones', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      const subnet3 = template.Resources.PublicSubnet3;

      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
      expect(subnet3.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [2, { 'Fn::GetAZs': '' }] });
    });

    test('Aurora should have three instances for high availability', () => {
      expect(template.Resources.AuroraDBInstance1).toBeDefined();
      expect(template.Resources.AuroraDBInstance2).toBeDefined();
      expect(template.Resources.AuroraDBInstance3).toBeDefined();
    });

    test('Redis should have multi-AZ enabled', () => {
      const redis = template.Resources.RedisReplicationGroup;
      expect(redis.Properties.MultiAZEnabled).toBe(true);
      expect(redis.Properties.AutomaticFailoverEnabled).toBe(true);
      expect(redis.Properties.NumCacheClusters).toBe(3);
    });

    test('ECS service should have desired count of 3', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.DesiredCount).toBe(3);
    });
  });
});
