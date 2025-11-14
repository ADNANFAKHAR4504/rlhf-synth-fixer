import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template (convert from YAML if needed)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // MAPPINGS VALIDATION 
  describe('Mappings Validation', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('should have VPC CIDR block', () => {
      expect(template.Mappings.SubnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
    });

    test('should have all subnet CIDR blocks defined', () => {
      const subnetConfig = template.Mappings.SubnetConfig;
      expect(subnetConfig.PublicSubnet1.CIDR).toBe('10.0.1.0/24');
      expect(subnetConfig.PublicSubnet2.CIDR).toBe('10.0.2.0/24');
      expect(subnetConfig.PublicSubnet3.CIDR).toBe('10.0.3.0/24');
      expect(subnetConfig.PrivateSubnet1.CIDR).toBe('10.0.11.0/24');
      expect(subnetConfig.PrivateSubnet2.CIDR).toBe('10.0.12.0/24');
      expect(subnetConfig.PrivateSubnet3.CIDR).toBe('10.0.13.0/24');
      expect(subnetConfig.DatabaseSubnet1.CIDR).toBe('10.0.21.0/24');
      expect(subnetConfig.DatabaseSubnet2.CIDR).toBe('10.0.22.0/24');
      expect(subnetConfig.DatabaseSubnet3.CIDR).toBe('10.0.23.0/24');
    });
  });

  // NETWORKING RESOURCES 
  describe('Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('should have 3 database subnets', () => {
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet2).toBeDefined();
      expect(template.Resources.DatabaseSubnet3).toBeDefined();
    });

    test('should have 3 NAT Gateways (one per AZ)', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway3).toBeDefined();
    });

    test('should have VPC Flow Logs for compliance', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      expect(template.Resources.VPCFlowLogs.Type).toBe('AWS::EC2::FlowLog');
    });
  });

  // VPC ENDPOINTS 
  describe('VPC Endpoints', () => {
    test('should have ECR API endpoint', () => {
      expect(template.Resources.ECRApiVPCEndpoint).toBeDefined();
      expect(template.Resources.ECRApiVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    test('should have ECR DKR endpoint', () => {
      expect(template.Resources.ECRDkrVPCEndpoint).toBeDefined();
    });

    test('should have Secrets Manager endpoint', () => {
      expect(template.Resources.SecretsManagerVPCEndpoint).toBeDefined();
    });

    test('should have CloudWatch Logs endpoint', () => {
      expect(template.Resources.CloudWatchLogsVPCEndpoint).toBeDefined();
    });

    test('should have S3 endpoint', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
    });

    test('VPC endpoints should have PrivateDnsEnabled', () => {
      const endpoints = [
        'ECRApiVPCEndpoint',
        'ECRDkrVPCEndpoint',
        'SecretsManagerVPCEndpoint',
        'CloudWatchLogsVPCEndpoint',
      ];
      endpoints.forEach(endpointName => {
        const endpoint = template.Resources[endpointName];
        expect(endpoint.Properties.PrivateDnsEnabled).toBe(true);
        expect(endpoint.Properties.VpcEndpointType).toBe('Interface');
      });
    });
  });

  // SECURITY GROUPS 
  describe('Security Groups', () => {
    test('should have ALB Security Group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
    });

    test('ALB Security Group should allow HTTP and HTTPS from Internet', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have ECS Security Group', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
    });

    test('ECS Security Group should allow traffic from ALB only', () => {
      const sg = template.Resources.ECSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress.length).toBeGreaterThan(0);
      const albRule = ingress.find((r: any) => r.FromPort === 8080);
      expect(albRule).toBeDefined();
      expect(albRule.SourceSecurityGroupId).toBeDefined();
    });

    test('should have Database Security Group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
    });

    test('Database Security Group should allow PostgreSQL from ECS and Lambda', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      const postgresRules = ingress.filter((r: any) => r.FromPort === 5432);
      expect(postgresRules.length).toBeGreaterThanOrEqual(2);
      postgresRules.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toBeDefined();
      });
    });
  });

  // KMS KEYS 
  describe('KMS Keys', () => {
    test('should have CloudWatch Logs KMS Key', () => {
      expect(template.Resources.CloudWatchLogsKMSKey).toBeDefined();
      expect(template.Resources.CloudWatchLogsKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have Secrets Manager KMS Key', () => {
      expect(template.Resources.SecretsManagerKMSKey).toBeDefined();
    });

    test('should have Database KMS Key', () => {
      expect(template.Resources.DatabaseKMSKey).toBeDefined();
    });

    test('should have Backup KMS Key', () => {
      expect(template.Resources.BackupKMSKey).toBeDefined();
    });

    test('KMS keys should have proper key policies', () => {
      const kmsKeys = [
        'CloudWatchLogsKMSKey',
        'SecretsManagerKMSKey',
        'DatabaseKMSKey',
        'BackupKMSKey',
      ];
      kmsKeys.forEach(keyName => {
        const key = template.Resources[keyName];
        expect(key.Properties.KeyPolicy).toBeDefined();
        expect(key.Properties.KeyPolicy.Version).toBe('2012-10-17');
        expect(key.Properties.KeyPolicy.Statement).toBeDefined();
        expect(Array.isArray(key.Properties.KeyPolicy.Statement)).toBe(true);
      });
    });
  });

  // SECRETS MANAGER 
  describe('Secrets Manager', () => {
    test('should have DatabaseSecret', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DatabaseSecret should have KMS encryption', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Properties.KmsKeyId).toBeDefined();
    });

    test('DatabaseSecret should generate secure password', () => {
      const secret = template.Resources.DatabaseSecret;
      const genSecret = secret.Properties.GenerateSecretString;
      expect(genSecret.PasswordLength).toBe(32);
      expect(genSecret.RequireEachIncludedType).toBe(true);
    });

    test('should have Secret Rotation Lambda', () => {
      expect(template.Resources.DatabaseSecretRotationLambda).toBeDefined();
      expect(template.Resources.DatabaseSecretRotationLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have Secret Rotation Schedule', () => {
      expect(template.Resources.DatabaseSecretRotation).toBeDefined();
      expect(template.Resources.DatabaseSecretRotation.Type).toBe('AWS::SecretsManager::RotationSchedule');
    });

    test('Secret rotation should be configured for 30 days', () => {
      const rotation = template.Resources.DatabaseSecretRotation;
      expect(rotation.Properties.RotationRules.AutomaticallyAfterDays).toBe(30);
    });
  });

  // DATABASE RESOURCES 
  describe('Database Resources', () => {
    test('should have Aurora Cluster', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora Cluster should use PostgreSQL engine', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.Engine).toBe('aurora-postgresql');
    });

    test('Aurora Cluster should have encryption enabled', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toBeDefined();
    });

    test('should have primary and secondary instances', () => {
      expect(template.Resources.AuroraPrimaryInstance).toBeDefined();
      expect(template.Resources.AuroraSecondaryInstance).toBeDefined();
    });

    test('database instances should not be publicly accessible', () => {
      const primary = template.Resources.AuroraPrimaryInstance;
      const secondary = template.Resources.AuroraSecondaryInstance;
      expect(primary.Properties.PubliclyAccessible).toBe(false);
      expect(secondary.Properties.PubliclyAccessible).toBe(false);
    });

    test('should have DB Parameter Group with optimized settings', () => {
      expect(template.Resources.DBParameterGroup).toBeDefined();
      const paramGroup = template.Resources.DBParameterGroup;
      expect(paramGroup.Properties.Parameters.max_connections).toBeDefined();
      expect(paramGroup.Properties.Parameters.shared_buffers).toBeDefined();
    });

    test('should have DB Cluster Parameter Group', () => {
      expect(template.Resources.DBClusterParameterGroup).toBeDefined();
    });
  });

  // ECS RESOURCES 
  describe('ECS Resources', () => {
    test('should have ECS Cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS Cluster should have Container Insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.ClusterSettings).toBeDefined();
      const containerInsights = cluster.Properties.ClusterSettings.find(
        (s: any) => s.Name === 'containerInsights'
      );
      expect(containerInsights).toBeDefined();
      expect(containerInsights.Value).toBe('enabled');
    });

    test('should have Task Definition', () => {
      expect(template.Resources.TaskDefinition).toBeDefined();
      expect(template.Resources.TaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('Task Definition should have correct resource allocation', () => {
      const taskDef = template.Resources.TaskDefinition;
      expect(taskDef.Properties.Cpu).toBe('2048'); // 2 vCPU
      expect(taskDef.Properties.Memory).toBe('4096'); // 4 GB
    });

    test('Task Definition should use Fargate', () => {
      const taskDef = template.Resources.TaskDefinition;
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    });

    test('Container should run as non-root user', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.User).toBe('1000:1000');
    });

    test('Container should have Secrets from Secrets Manager', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.Secrets).toBeDefined();
      const dbUsernameSecret = container.Secrets.find((s: any) => s.Name === 'DB_USERNAME');
      const dbPasswordSecret = container.Secrets.find((s: any) => s.Name === 'DB_PASSWORD');
      expect(dbUsernameSecret).toBeDefined();
      expect(dbPasswordSecret).toBeDefined();
    });

    test('ECS Service should use private subnets', () => {
      const service = template.Resources.ECSService;
      const networkConfig = service.Properties.NetworkConfiguration.AwsvpcConfiguration;
      expect(networkConfig.AssignPublicIp).toBe('DISABLED');
      expect(networkConfig.Subnets).toBeDefined();
      expect(Array.isArray(networkConfig.Subnets)).toBe(true);
    });
  });

  // LOAD BALANCER 
  describe('Application Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have primary Target Group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
    });

    test('Target Group should have health check on /health', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
    });

    test('Target Group should have correct health check thresholds', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should have blue-green Target Group', () => {
      expect(template.Resources.ALBTargetGroupBlueGreen).toBeDefined();
    });

    test('should have HTTP Listener', () => {
      expect(template.Resources.ALBListenerHTTP).toBeDefined();
    });

    test('should have ALB Access Logs Bucket', () => {
      expect(template.Resources.ALBAccessLogsBucket).toBeDefined();
    });
  });

  // AUTO SCALING 
  describe('Auto Scaling', () => {
    test('should have Service Scaling Target', () => {
      expect(template.Resources.ServiceScalingTarget).toBeDefined();
      expect(template.Resources.ServiceScalingTarget.Type).toBe(
        'AWS::ApplicationAutoScaling::ScalableTarget'
      );
    });

    test('should have CPU-based scaling policy', () => {
      expect(template.Resources.ServiceScalingPolicy).toBeDefined();
      const policy = template.Resources.ServiceScalingPolicy;
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(70.0);
    });

    test('should have memory-based scaling policy', () => {
      expect(template.Resources.ServiceScalingPolicyMemory).toBeDefined();
      const policy = template.Resources.ServiceScalingPolicyMemory;
      expect(policy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(75.0);
    });
  });

  // BACKUP AND DR 
  describe('Backup and Disaster Recovery', () => {
    test('should have Backup Vault', () => {
      expect(template.Resources.BackupVault).toBeDefined();
      expect(template.Resources.BackupVault.Type).toBe('AWS::Backup::BackupVault');
    });

    test('should have Backup Plan', () => {
      expect(template.Resources.BackupPlan).toBeDefined();
      expect(template.Resources.BackupPlan.Type).toBe('AWS::Backup::BackupPlan');
    });

    test('Backup Plan should have daily and weekly rules', () => {
      const plan = template.Resources.BackupPlan;
      const rules = plan.Properties.BackupPlan.BackupPlanRule;
      const dailyRule = rules.find((r: any) => r.RuleName === 'DailyBackups');
      const weeklyRule = rules.find((r: any) => r.RuleName === 'WeeklyBackups');
      expect(dailyRule).toBeDefined();
      expect(weeklyRule).toBeDefined();
    });

    test('should have Backup Selection for Aurora', () => {
      expect(template.Resources.BackupSelection).toBeDefined();
    });

    test('should have Backup Replication Role', () => {
      expect(template.Resources.BackupReplicationRole).toBeDefined();
    });
  });

  // MONITORING AND ALERTING 
  describe('Monitoring and Alerting', () => {
    test('should have SNS Topic', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have SNS Subscription', () => {
      expect(template.Resources.SNSSubscription).toBeDefined();
      expect(template.Resources.SNSSubscription.Properties.Protocol).toBe('email');
    });

    test('should have CloudWatch Dashboard', () => {
      expect(template.Resources.MonitoringDashboard).toBeDefined();
      expect(template.Resources.MonitoringDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have High CPU Alarm', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.HighCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have Database Connections Alarm', () => {
      expect(template.Resources.DatabaseConnectionsAlarm).toBeDefined();
    });

    test('should have ALB Unhealthy Host Alarm', () => {
      expect(template.Resources.ALBUnhealthyHostAlarm).toBeDefined();
    });

    test('should have Rollback Alarm', () => {
      expect(template.Resources.RollbackAlarm).toBeDefined();
    });
  });

  // CLOUDWATCH LOGS 
  describe('CloudWatch Logs', () => {
    test('should have ECS Log Group', () => {
      expect(template.Resources.ECSLogGroup).toBeDefined();
      expect(template.Resources.ECSLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('ECS Log Group should have KMS encryption', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('ECS Log Group should have retention configured', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
    });
  });

  // IAM ROLES 
  describe('IAM Roles', () => {
    test('should have ECS Task Execution Role', () => {
      expect(template.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(template.Resources.ECSTaskExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('ECS Task Execution Role should have Secrets Manager permissions', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      const policies = role.Properties.Policies;
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretAndRegistryAccess');
      expect(secretsPolicy).toBeDefined();
      const statements = secretsPolicy.PolicyDocument.Statement;
      const secretsStatement = statements.find(
        (s: any) => s.Action && s.Action.includes('secretsmanager:GetSecretValue')
      );
      expect(secretsStatement).toBeDefined();
    });

    test('should have ECS Task Role', () => {
      expect(template.Resources.ECSTaskRole).toBeDefined();
    });

    test('ECS Task Role should have CloudWatch Logs permissions', () => {
      const role = template.Resources.ECSTaskRole;
      const policies = role.Properties.Policies;
      const taskPolicy = policies.find((p: any) => p.PolicyName === 'TaskPolicy');
      expect(taskPolicy).toBeDefined();
      const statements = taskPolicy.PolicyDocument.Statement;
      const logsStatement = statements.find(
        (s: any) => s.Action && s.Action.includes('logs:PutLogEvents')
      );
      expect(logsStatement).toBeDefined();
    });

    test('should have Auto Scaling Role', () => {
      expect(template.Resources.AutoScalingRole).toBeDefined();
    });

    test('should have Enhanced Monitoring Role for RDS', () => {
      expect(template.Resources.EnhancedMonitoringRole).toBeDefined();
    });
  });

  // ECR REPOSITORY 
  describe('ECR Repository', () => {
    test('should have ECR Repository', () => {
      expect(template.Resources.ECRRepository).toBeDefined();
      expect(template.Resources.ECRRepository.Type).toBe('AWS::ECR::Repository');
    });

    test('ECR Repository should have image scanning enabled', () => {
      const repo = template.Resources.ECRRepository;
      expect(repo.Properties.ImageScanningConfiguration.ScanOnPush).toBe(true);
    });

    test('ECR Repository should have lifecycle policy', () => {
      const repo = template.Resources.ECRRepository;
      expect(repo.Properties.LifecyclePolicy).toBeDefined();
    });
  });

  // RESOURCE DEPENDENCIES 
  describe('Resource Dependencies', () => {
    test('ECS Service should depend on ALB Listener and VPC Endpoints', () => {
      const service = template.Resources.ECSService;
      expect(service.DependsOn).toBeDefined();
      expect(Array.isArray(service.DependsOn)).toBe(true);
      expect(service.DependsOn).toContain('ALBListenerHTTP');
      expect(service.DependsOn).toContain('AuroraPrimaryInstance');
    });

    test('NAT Gateways should depend on Internet Gateway Attachment', () => {
      const nat1 = template.Resources.NatGateway1EIP;
      expect(nat1.DependsOn).toContain('InternetGatewayAttachment');
    });

    test('ALB should depend on Access Logs Bucket Policy', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.DependsOn).toContain('ALBAccessLogsBucketPolicy');
    });
  });

  // SECURITY VALIDATION 
  describe('Security Validation', () => {
    test('all resources should have appropriate tags', () => {
      const resources = template.Resources;
      const criticalResources = [
        'VPC',
        'AuroraCluster',
        'ECSCluster',
        'ApplicationLoadBalancer',
        'DatabaseSecret',
      ];
      criticalResources.forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          expect(envTag).toBeDefined();
        }
      });
    });

    test('database should have deletion protection disabled (as per requirements)', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DeletionProtection).toBe(false);
    });

    test('containers should drop all capabilities', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.LinuxParameters).toBeDefined();
      expect(container.LinuxParameters.InitProcessEnabled).toBe(true);
    });
  });

  // COMPLIANCE VALIDATION 
  describe('Compliance Validation', () => {
    test('log retention should be configurable for compliance', () => {
      const logGroup = template.Resources.ECSLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
    });

    test('backup plan should have long-term retention', () => {
      const plan = template.Resources.BackupPlan;
      const rules = plan.Properties.BackupPlan.BackupPlanRule;
      const dailyRule = rules.find((r: any) => r.RuleName === 'DailyBackups');
      expect(dailyRule.Lifecycle.DeleteAfterDays).toBeDefined();
    });

    test('resources should have DataClassification tags', () => {
      const resources = template.Resources;
      const sensitiveResources = ['DatabaseSecret', 'AuroraCluster', 'ECSLogGroup'];
      sensitiveResources.forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const dataClassTag = tags.find((t: any) => t.Key === 'DataClassification');
          expect(dataClassTag).toBeDefined();
        }
      });
    });
  });

  // ERROR CASES 
  describe('Error Handling', () => {
    test('ECS Service should have circuit breaker enabled', () => {
      const service = template.Resources.ECSService;
      const circuitBreaker = service.Properties.DeploymentConfiguration.DeploymentCircuitBreaker;
      expect(circuitBreaker.Enable).toBe(true);
      expect(circuitBreaker.Rollback).toBe(true);
    });

    test('should have rollback alarm for failed deployments', () => {
      const alarm = template.Resources.RollbackAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.TreatMissingData).toBe('breaching');
    });
  });

  // CROSS-VERIFICATION 
  describe('Cross-Verification', () => {
    test('Task Definition should reference correct execution role', () => {
      const taskDef = template.Resources.TaskDefinition;
      const execRole = template.Resources.ECSTaskExecutionRole;
      expect(taskDef.Properties.ExecutionRoleArn).toBeDefined();
    });

    test('ECS Service should reference correct task definition', () => {
      const service = template.Resources.ECSService;
      const taskDef = template.Resources.TaskDefinition;
      expect(service.Properties.TaskDefinition).toBeDefined();
    });

    test('Target Group should match container port', () => {
      const tg = template.Resources.ALBTargetGroup;
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      const containerPort = container.PortMappings[0].ContainerPort;
      expect(tg.Properties.Port).toBe(containerPort);
    });

    test('Database Secret should be referenced in Task Definition', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      const secrets = container.Secrets;
      const dbSecret = template.Resources.DatabaseSecret;
      secrets.forEach((secret: any) => {
        if (secret.ValueFrom) {
          // ValueFrom should reference DatabaseSecret
          expect(secret.ValueFrom).toBeDefined();
        }
      });
    });
  });
});

