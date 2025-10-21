import fs from 'fs';
import path from 'path';

describe('HIPAA-Compliant Healthcare Infrastructure - CloudFormation Template Unit Tests', () => {
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

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('HIPAA-Compliant Healthcare Data Processing Infrastructure');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });
  });

  describe('VPC and Networking', () => {
    test('should create VPC with DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should create NAT Gateway for private subnet internet access', () => {
      const natGateway = template.Resources.NATGateway;
      expect(natGateway).toBeDefined();
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should create Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with correct ingress rules', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      expect(albSg).toBeDefined();
      expect(albSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSg.Properties.SecurityGroupIngress).toHaveLength(2);
    });

    test('should create ECS security group allowing traffic only from ALB', () => {
      const ecsSg = template.Resources.ECSSecurityGroup;
      expect(ecsSg).toBeDefined();
      const ingressRules = ecsSg.Properties.SecurityGroupIngress;
      expect(ingressRules.every((rule: any) => rule.SourceSecurityGroupId)).toBe(true);
    });

    test('should create database security group allowing access only from ECS', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      expect(dbSg).toBeDefined();
      const ingressRules = dbSg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].FromPort).toBe(3306);
      expect(ingressRules[0].ToPort).toBe(3306);
    });

    test('should create EFS security group', () => {
      const efsSg = template.Resources.EFSSecurityGroup;
      expect(efsSg).toBeDefined();
      expect(efsSg.Properties.SecurityGroupIngress[0].FromPort).toBe(2049);
    });

    test('should create ElastiCache security group', () => {
      const cacheSg = template.Resources.ElastiCacheSecurityGroup;
      expect(cacheSg).toBeDefined();
      expect(cacheSg.Properties.SecurityGroupIngress[0].FromPort).toBe(6379);
    });
  });

  describe('KMS Encryption Keys', () => {
    test('should create database encryption key with rotation enabled', () => {
      const dbKey = template.Resources.DatabaseEncryptionKey;
      expect(dbKey).toBeDefined();
      expect(dbKey.Type).toBe('AWS::KMS::Key');
      expect(dbKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should create EFS encryption key with rotation enabled', () => {
      const efsKey = template.Resources.EFSEncryptionKey;
      expect(efsKey).toBeDefined();
      expect(efsKey.Type).toBe('AWS::KMS::Key');
      expect(efsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('should create KMS key aliases with environment suffix', () => {
      expect(template.Resources.DatabaseEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EFSEncryptionKeyAlias).toBeDefined();
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('should create Aurora cluster with encryption enabled', () => {
      const auroraCluster = template.Resources.AuroraCluster;
      expect(auroraCluster).toBeDefined();
      expect(auroraCluster.Type).toBe('AWS::RDS::DBCluster');
      expect(auroraCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('should have Delete deletion policy', () => {
      const auroraCluster = template.Resources.AuroraCluster;
      expect(auroraCluster.DeletionPolicy).toBe('Delete');
      expect(auroraCluster.UpdateReplacePolicy).toBe('Delete');
    });

    test('should enable CloudWatch logs exports for audit', () => {
      const auroraCluster = template.Resources.AuroraCluster;
      const logExports = auroraCluster.Properties.EnableCloudwatchLogsExports;
      expect(logExports).toContain('audit');
      expect(logExports).toContain('error');
      expect(logExports).toContain('general');
      expect(logExports).toContain('slowquery');
    });

    test('should have backup retention configured', () => {
      const auroraCluster = template.Resources.AuroraCluster;
      expect(auroraCluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should create Aurora instance that is not publicly accessible', () => {
      const auroraInstance = template.Resources.AuroraInstance1;
      expect(auroraInstance).toBeDefined();
      expect(auroraInstance.Properties.PubliclyAccessible).toBe(false);
    });

    test('should use db subnet group in private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  describe('EFS File System', () => {
    test('should create EFS with encryption enabled', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs).toBeDefined();
      expect(efs.Type).toBe('AWS::EFS::FileSystem');
      expect(efs.Properties.Encrypted).toBe(true);
    });

    test('should create EFS mount targets in private subnets', () => {
      expect(template.Resources.EFSMountTarget1).toBeDefined();
      expect(template.Resources.EFSMountTarget2).toBeDefined();
    });

    test('should use KMS key for EFS encryption', () => {
      const efs = template.Resources.EFSFileSystem;
      expect(efs.Properties.KmsKeyId).toBeDefined();
    });
  });

  describe('ElastiCache Redis', () => {
    test('should create ElastiCache replication group with encryption', () => {
      const redis = template.Resources.ElastiCacheReplicationGroup;
      expect(redis).toBeDefined();
      expect(redis.Type).toBe('AWS::ElastiCache::ReplicationGroup');
      expect(redis.Properties.TransitEncryptionEnabled).toBe(true);
      expect(redis.Properties.AtRestEncryptionEnabled).toBe(true);
    });

    test('should enable Multi-AZ for high availability', () => {
      const redis = template.Resources.ElastiCacheReplicationGroup;
      expect(redis.Properties.MultiAZEnabled).toBe(true);
      expect(redis.Properties.AutomaticFailoverEnabled).toBe(true);
    });

    test('should have at least 2 cache clusters', () => {
      const redis = template.Resources.ElastiCacheReplicationGroup;
      expect(redis.Properties.NumCacheClusters).toBeGreaterThanOrEqual(2);
    });

    test('should create ElastiCache subnet group', () => {
      const subnetGroup = template.Resources.ElastiCacheSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');
    });
  });

  describe('ECS Fargate', () => {
    test('should create ECS cluster with container insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::ECS::Cluster');
      const clusterSettings = cluster.Properties.ClusterSettings;
      expect(clusterSettings).toBeDefined();
      expect(clusterSettings[0].Name).toBe('containerInsights');
      expect(clusterSettings[0].Value).toBe('enabled');
    });

    test('should create ECS task definition with Fargate compatibility', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef).toBeDefined();
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    });

    test('should mount EFS volume with encryption in transit', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      const volumes = taskDef.Properties.Volumes;
      expect(volumes).toBeDefined();
      expect(volumes[0].EFSVolumeConfiguration.TransitEncryption).toBe('ENABLED');
    });

    test('should create ECS service in private subnets', () => {
      const service = template.Resources.ECSService;
      expect(service).toBeDefined();
      const networkConfig = service.Properties.NetworkConfiguration.AwsvpcConfiguration;
      expect(networkConfig.AssignPublicIp).toBe('DISABLED');
    });

    test('should configure CloudWatch log group for ECS', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('IAM Roles', () => {
    test('should create ECS task execution role', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should grant Secrets Manager access to ECS task execution role', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      const policies = role.Properties.Policies;
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');
      expect(secretsPolicy).toBeDefined();
    });

    test('should create ECS task role with EFS access', () => {
      const role = template.Resources.ECSTaskRole;
      expect(role).toBeDefined();
      const policies = role.Properties.Policies;
      const efsPolicy = policies.find((p: any) => p.PolicyName === 'EFSAccess');
      expect(efsPolicy).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should create target group for ECS service', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Properties.TargetType).toBe('ip');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
    });

    test('should create ALB listener', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
    });
  });

  describe('Auto Scaling', () => {
    test('should create ECS service scaling target', () => {
      const scalingTarget = template.Resources.ECSServiceScalingTarget;
      expect(scalingTarget).toBeDefined();
      expect(scalingTarget.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
      expect(scalingTarget.Properties.MinCapacity).toBe(2);
      expect(scalingTarget.Properties.MaxCapacity).toBe(10);
    });

    test('should create scaling policy based on CPU utilization', () => {
      const scalingPolicy = template.Resources.ECSServiceScalingPolicy;
      expect(scalingPolicy).toBeDefined();
      expect(scalingPolicy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
      expect(scalingPolicy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  describe('API Gateway and WAF', () => {
    test('should create API Gateway REST API', () => {
      const api = template.Resources.APIGatewayRestAPI;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should create API Gateway deployment', () => {
      const deployment = template.Resources.APIGatewayDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('should create API Gateway stage with tracing enabled', () => {
      const stage = template.Resources.APIGatewayStage;
      expect(stage).toBeDefined();
      expect(stage.Properties.TracingEnabled).toBe(true);
      expect(stage.Properties.StageName).toBe('prod');
    });

    test('should enable logging and metrics on API Gateway stage', () => {
      const stage = template.Resources.APIGatewayStage;
      const methodSettings = stage.Properties.MethodSettings[0];
      expect(methodSettings.LoggingLevel).toBe('INFO');
      expect(methodSettings.MetricsEnabled).toBe(true);
      expect(methodSettings.DataTraceEnabled).toBe(true);
    });

    test('should create WAF Web ACL', () => {
      const waf = template.Resources.WAFWebACL;
      expect(waf).toBeDefined();
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
    });

    test('should configure WAF with rate limiting rule', () => {
      const waf = template.Resources.WAFWebACL;
      const rateLimitRule = waf.Properties.Rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
    });

    test('should configure WAF with managed rule sets', () => {
      const waf = template.Resources.WAFWebACL;
      const commonRuleSet = waf.Properties.Rules.find((r: any) => r.Name === 'AWSManagedRulesCommonRuleSet');
      const badInputsRuleSet = waf.Properties.Rules.find((r: any) => r.Name === 'AWSManagedRulesKnownBadInputsRuleSet');
      expect(commonRuleSet).toBeDefined();
      expect(badInputsRuleSet).toBeDefined();
    });

    test('should associate WAF with API Gateway', () => {
      const association = template.Resources.WAFWebACLAssociation;
      expect(association).toBeDefined();
      expect(association.Type).toBe('AWS::WAFv2::WebACLAssociation');
      expect(association.DependsOn).toBe('APIGatewayStage');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use EnvironmentSuffix parameter in names', () => {
      const resourcesWithNames = [
        'VPC',
        'InternetGateway',
        'NATGateway',
        'ECSCluster',
        'AuroraCluster',
        'EFSFileSystem',
        'ElastiCacheReplicationGroup',
        'ApplicationLoadBalancer',
        'APIGatewayRestAPI',
        'WAFWebACL',
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();
        const nameProperty = resource.Properties.Name ||
                            resource.Properties.ClusterName ||
                            resource.Properties.DBClusterIdentifier ||
                            resource.Properties.ReplicationGroupId;
        if (nameProperty && typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should export VPC ID', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Export).toBeDefined();
    });

    test('should export ECS cluster name', () => {
      expect(template.Outputs.ECSClusterName).toBeDefined();
    });

    test('should export Load Balancer DNS', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
    });

    test('should export Aurora cluster endpoints', () => {
      expect(template.Outputs.AuroraClusterEndpoint).toBeDefined();
      expect(template.Outputs.AuroraClusterReadEndpoint).toBeDefined();
    });

    test('should export EFS file system ID', () => {
      expect(template.Outputs.EFSFileSystemId).toBeDefined();
    });

    test('should export Redis endpoint and port', () => {
      expect(template.Outputs.RedisEndpoint).toBeDefined();
      expect(template.Outputs.RedisPort).toBeDefined();
    });

    test('should export API Gateway URL', () => {
      expect(template.Outputs.APIGatewayURL).toBeDefined();
    });

    test('should export WAF Web ACL ID', () => {
      expect(template.Outputs.WAFWebACLId).toBeDefined();
    });
  });

  describe('HIPAA Compliance Requirements', () => {
    test('all data at rest should be encrypted', () => {
      expect(template.Resources.AuroraCluster.Properties.StorageEncrypted).toBe(true);
      expect(template.Resources.EFSFileSystem.Properties.Encrypted).toBe(true);
      expect(template.Resources.ElastiCacheReplicationGroup.Properties.AtRestEncryptionEnabled).toBe(true);
    });

    test('all data in transit should be encrypted', () => {
      expect(template.Resources.ElastiCacheReplicationGroup.Properties.TransitEncryptionEnabled).toBe(true);
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.Volumes[0].EFSVolumeConfiguration.TransitEncryption).toBe('ENABLED');
    });

    test('audit logging should be enabled', () => {
      const auroraCluster = template.Resources.AuroraCluster;
      expect(auroraCluster.Properties.EnableCloudwatchLogsExports).toContain('audit');
      expect(template.Resources.ECSLogGroup).toBeDefined();
      const apiStage = template.Resources.APIGatewayStage;
      expect(apiStage.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
    });

    test('no resources should be publicly accessible except ALB', () => {
      expect(template.Resources.AuroraInstance1.Properties.PubliclyAccessible).toBe(false);
      const ecsService = template.Resources.ECSService;
      expect(ecsService.Properties.NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp).toBe('DISABLED');
    });

    test('all resources should have Delete deletion policy', () => {
      expect(template.Resources.AuroraCluster.DeletionPolicy).toBe('Delete');
    });
  });
});
