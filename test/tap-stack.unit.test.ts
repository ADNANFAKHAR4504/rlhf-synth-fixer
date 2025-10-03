import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Hotel Booking Platform CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template generated from YAML
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a proper description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Hotel Booking Platform Infrastructure - Handles 4,800 daily reservations');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe('[a-zA-Z0-9-]*');
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(template.Parameters.LatestAmiId.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('should have database credentials parameters', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      expect(template.Parameters.DBMasterUsername.Type).toBe('String');
      expect(template.Parameters.DBMasterUsername.Default).toBe('admin');
      // DBMasterPassword parameter removed - now using Secrets Manager
      expect(template.Parameters.DBMasterPassword).toBeUndefined();
    });
  });

  describe('Network Resources', () => {
    test('should have VPC with correct CIDR', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.170.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnets in multiple AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.170.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.170.2.0/24');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets in multiple AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.170.10.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.170.11.0/24');
    });

    test('should have database subnets', () => {
      expect(template.Resources.DBSubnet1).toBeDefined();
      expect(template.Resources.DBSubnet2).toBeDefined();
      expect(template.Resources.DBSubnet1.Properties.CidrBlock).toBe('10.170.20.0/24');
      expect(template.Resources.DBSubnet2.Properties.CidrBlock).toBe('10.170.21.0/24');
    });

    test('should have NAT Gateways for outbound traffic', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway1EIP).toBeDefined();
      expect(template.Resources.NATGateway2EIP).toBeDefined();
      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NATGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have route tables properly configured', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.DBRouteTable).toBeDefined();

      // Check public route to Internet Gateway
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');

      // Check private routes to NAT Gateways
      expect(template.Resources.PrivateRoute1).toBeDefined();
      expect(template.Resources.PrivateRoute2).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with proper ingress rules', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toContainEqual(expect.objectContaining({
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        CidrIp: '0.0.0.0/0'
      }));
      expect(ingress).toContainEqual(expect.objectContaining({
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
        CidrIp: '0.0.0.0/0'
      }));
    });

    test('should have App security group allowing traffic from ALB only', () => {
      expect(template.Resources.AppSecurityGroup).toBeDefined();
      const ingress = template.Resources.AppSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
    });

    test('should have DB security group allowing traffic from App tier only', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      const ingress = template.Resources.DBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'AppSecurityGroup' });
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
    });

    test('should have Cache security group allowing traffic from App tier only', () => {
      expect(template.Resources.CacheSecurityGroup).toBeDefined();
      const ingress = template.Resources.CacheSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'AppSecurityGroup' });
      expect(ingress[0].FromPort).toBe(6379);
      expect(ingress[0].ToPort).toBe(6379);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB configured correctly', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Name['Fn::Sub']).toBe('BP-ALB-${EnvironmentSuffix}');
    });

    test('should have target group with sticky sessions', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      const tg = template.Resources.ALBTargetGroup.Properties;
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/health');

      // Check sticky sessions
      const attrs = tg.TargetGroupAttributes;
      expect(attrs).toContainEqual({ Key: 'stickiness.enabled', Value: true });
      expect(attrs).toContainEqual({ Key: 'stickiness.type', Value: 'lb_cookie' });
      expect(attrs).toContainEqual({ Key: 'stickiness.lb_cookie.duration_seconds', Value: 86400 });
    });

    test('should have ALB listener configured', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(template.Resources.ALBListener.Properties.Port).toBe(80);
      expect(template.Resources.ALBListener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('Auto Scaling', () => {
    test('should have launch template with t3.medium instances', () => {
      expect(template.Resources.EC2LaunchTemplate).toBeDefined();
      expect(template.Resources.EC2LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      const lt = template.Resources.EC2LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.InstanceType).toBe('t3.medium');
      expect(lt.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(lt.IamInstanceProfile.Arn['Fn::GetAtt']).toEqual(['EC2InstanceProfile', 'Arn']);
    });

    test('should have Auto Scaling group with correct capacity', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(8);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.AutoScalingGroupName['Fn::Sub']).toBe('BookingPlatform-ASG-${EnvironmentSuffix}');
    });

    test('should have CPU-based scaling policy at 60% target', () => {
      expect(template.Resources.CPUTargetTrackingScalingPolicy).toBeDefined();
      expect(template.Resources.CPUTargetTrackingScalingPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      const policy = template.Resources.CPUTargetTrackingScalingPolicy.Properties;
      expect(policy.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.TargetTrackingConfiguration.TargetValue).toBe(60);
      expect(policy.TargetTrackingConfiguration.PredefinedMetricSpecification.PredefinedMetricType)
        .toBe('ASGAverageCPUUtilization');
    });
  });

  describe('Database Layer', () => {
    test('should have Secrets Manager secret for database password', () => {
      expect(template.Resources.DBMasterPasswordSecret).toBeDefined();
      expect(template.Resources.DBMasterPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
      const secret = template.Resources.DBMasterPasswordSecret.Properties;
      expect(secret.Name['Fn::Sub']).toBe('BookingPlatform-DB-Password-${EnvironmentSuffix}');
      expect(secret.Description).toBe('Master password for Aurora MySQL cluster');
      expect(secret.GenerateSecretString).toBeDefined();
      expect(secret.GenerateSecretString.PasswordLength).toBe(16);
      expect(secret.GenerateSecretString.GenerateStringKey).toBe('password');
    });

    test('should have Aurora MySQL cluster configured', () => {
      expect(template.Resources.AuroraDBCluster).toBeDefined();
      expect(template.Resources.AuroraDBCluster.Type).toBe('AWS::RDS::DBCluster');
      const cluster = template.Resources.AuroraDBCluster.Properties;
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.EngineMode).toBe('provisioned');
      expect(cluster.EngineVersion).toBe('8.0.mysql_aurora.3.04.0');
      expect(cluster.BackupRetentionPeriod).toBe(7);
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.DBClusterIdentifier['Fn::Sub']).toBe('bookingplatform-aurora-cluster-${EnvironmentSuffix}');
      // Verify using Secrets Manager for password
      expect(cluster.MasterUserPassword['Fn::Sub']).toBe('{{resolve:secretsmanager:${DBMasterPasswordSecret}:SecretString:password}}');
    });

    test('should have Multi-AZ Aurora instances', () => {
      expect(template.Resources.AuroraDBInstance1).toBeDefined();
      expect(template.Resources.AuroraDBInstance2).toBeDefined();
      expect(template.Resources.AuroraDBInstance1.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(template.Resources.AuroraDBInstance2.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(template.Resources.AuroraDBInstance1.Properties.PubliclyAccessible).toBe(false);
      expect(template.Resources.AuroraDBInstance2.Properties.PubliclyAccessible).toBe(false);
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      const subnetIds = template.Resources.DBSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toHaveLength(2);
      expect(subnetIds).toContainEqual({ Ref: 'DBSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'DBSubnet2' });
    });
  });

  describe('Caching Layer', () => {
    test('should have ElastiCache Redis configured', () => {
      expect(template.Resources.RedisCache).toBeDefined();
      expect(template.Resources.RedisCache.Type).toBe('AWS::ElastiCache::CacheCluster');
      const cache = template.Resources.RedisCache.Properties;
      expect(cache.Engine).toBe('redis');
      expect(cache.CacheNodeType).toBe('cache.t3.micro');
      expect(cache.NumCacheNodes).toBe(1);
    });

    test('should have cache subnet group', () => {
      expect(template.Resources.CacheSubnetGroup).toBeDefined();
      expect(template.Resources.CacheSubnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');
      const subnetIds = template.Resources.CacheSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toHaveLength(2);
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have cache parameter group with TTL support', () => {
      expect(template.Resources.CacheParameterGroup).toBeDefined();
      expect(template.Resources.CacheParameterGroup.Type).toBe('AWS::ElastiCache::ParameterGroup');
      expect(template.Resources.CacheParameterGroup.Properties.CacheParameterGroupFamily).toBe('redis7');
      const props = template.Resources.CacheParameterGroup.Properties.Properties;
      expect(props.timeout).toBe(300);
      expect(props['maxmemory-policy']).toBe('allkeys-lru');
    });
  });

  describe('Storage', () => {
    test('should have S3 bucket with versioning and encryption', () => {
      expect(template.Resources.BookingConfirmationsBucket).toBeDefined();
      expect(template.Resources.BookingConfirmationsBucket.Type).toBe('AWS::S3::Bucket');
      const bucket = template.Resources.BookingConfirmationsBucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 instance role with required permissions', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
      const role = template.Resources.EC2InstanceRole.Properties;

      // Check managed policies
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');

      // Check inline policies
      const policies = role.Policies;
      expect(policies).toHaveLength(2);
      expect(policies[0].PolicyName).toBe('S3Access');
      expect(policies[1].PolicyName).toBe('CloudWatchMetrics');
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(template.Resources.EC2InstanceProfile.Properties.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
    });

    test('should have VPC Flow Logs role', () => {
      expect(template.Resources.VPCFlowLogRole).toBeDefined();
      expect(template.Resources.VPCFlowLogRole.Type).toBe('AWS::IAM::Role');
      const role = template.Resources.VPCFlowLogRole.Properties;
      expect(role.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('vpc-flow-logs.amazonaws.com');
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have VPC Flow Logs enabled', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
      const flowLog = template.Resources.VPCFlowLog.Properties;
      expect(flowLog.ResourceType).toBe('VPC');
      expect(flowLog.TrafficType).toBe('ALL');
      expect(flowLog.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('should have VPC Flow Log Group', () => {
      expect(template.Resources.VPCFlowLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.VPCFlowLogGroup.Properties.RetentionInDays).toBe(7);
      expect(template.Resources.VPCFlowLogGroup.Properties.LogGroupName['Fn::Sub'])
        .toBe('/aws/vpc/bookingplatform-${EnvironmentSuffix}');
    });

    test('should have CloudWatch Dashboard', () => {
      expect(template.Resources.CloudWatchDashboard).toBeDefined();
      expect(template.Resources.CloudWatchDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(template.Resources.CloudWatchDashboard.Properties.DashboardName['Fn::Sub'])
        .toBe('BookingPlatform-Dashboard-${EnvironmentSuffix}');
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Environment and Project tags', () => {
      const taggableResources = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'DBSubnet1', 'DBSubnet2',
        'ALBSecurityGroup', 'AppSecurityGroup', 'DBSecurityGroup', 'CacheSecurityGroup',
        'ApplicationLoadBalancer', 'ALBTargetGroup', 'AuroraDBCluster',
        'BookingConfirmationsBucket'
      ];

      taggableResources.forEach(resourceName => {
        if (template.Resources[resourceName] && template.Resources[resourceName].Properties.Tags) {
          const tags = template.Resources[resourceName].Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          const projectTag = tags.find((t: any) => t.Key === 'Project');

          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('Production');
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toBe('BookingPlatform');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have essential outputs', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      expect(template.Outputs.RedisEndpoint).toBeDefined();

      // WAF outputs
      expect(template.Outputs.WAFWebACLId).toBeDefined();
      expect(template.Outputs.WAFWebACLArn).toBeDefined();

      // Backup outputs
      expect(template.Outputs.BackupVaultArn).toBeDefined();
      expect(template.Outputs.BackupPlanId).toBeDefined();
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('WAF Resources', () => {
    test('should have WAF Web ACL configured', () => {
      expect(template.Resources.WAFWebACL).toBeDefined();
      expect(template.Resources.WAFWebACL.Type).toBe('AWS::WAFv2::WebACL');
      const waf = template.Resources.WAFWebACL.Properties;
      expect(waf.Scope).toBe('REGIONAL');
      expect(waf.DefaultAction.Allow).toBeDefined();
    });

    test('should have AWS Managed Core Rule Set', () => {
      const waf = template.Resources.WAFWebACL.Properties;
      const coreRuleSet = waf.Rules.find((r: any) => r.Name === 'AWSManagedRulesCommonRuleSet');
      expect(coreRuleSet).toBeDefined();
      expect(coreRuleSet.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
      expect(coreRuleSet.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesCommonRuleSet');
    });

    test('should have rate-based rule configured', () => {
      const waf = template.Resources.WAFWebACL.Properties;
      const rateLimitRule = waf.Rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
      expect(rateLimitRule.Statement.RateBasedStatement.EvaluationWindowSec).toBe(300);
      expect(rateLimitRule.Action.Block).toBeDefined();
    });

    test('should have geo-blocking rule configured', () => {
      const waf = template.Resources.WAFWebACL.Properties;
      const geoBlockRule = waf.Rules.find((r: any) => r.Name === 'GeoBlockingRule');
      expect(geoBlockRule).toBeDefined();
      expect(geoBlockRule.Statement.GeoMatchStatement).toBeDefined();
      expect(geoBlockRule.Statement.GeoMatchStatement.CountryCodes).toContain('CN');
      expect(geoBlockRule.Statement.GeoMatchStatement.CountryCodes).toContain('RU');
      expect(geoBlockRule.Statement.GeoMatchStatement.CountryCodes).toContain('KP');
    });

    test('should have WAF logging configuration', () => {
      expect(template.Resources.WAFLogGroup).toBeDefined();
      expect(template.Resources.WAFLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.WAFLogGroup.Properties.RetentionInDays).toBe(30);

      expect(template.Resources.WAFLogConfig).toBeDefined();
      expect(template.Resources.WAFLogConfig.Type).toBe('AWS::WAFv2::LoggingConfiguration');
    });

    test('should have WAF associated with ALB', () => {
      expect(template.Resources.WAFAssociation).toBeDefined();
      expect(template.Resources.WAFAssociation.Type).toBe('AWS::WAFv2::WebACLAssociation');
      const association = template.Resources.WAFAssociation.Properties;
      expect(association.ResourceArn.Ref).toBe('ApplicationLoadBalancer');
    });
  });

  describe('AWS Backup Resources', () => {
    test('should have KMS key for backup encryption', () => {
      expect(template.Resources.BackupKMSKey).toBeDefined();
      expect(template.Resources.BackupKMSKey.Type).toBe('AWS::KMS::Key');
      const key = template.Resources.BackupKMSKey.Properties;
      expect(key.Description).toBe('KMS key for AWS Backup encryption');
      expect(key.EnableKeyRotation).toBe(true);
    });

    test('should have backup vault configured', () => {
      expect(template.Resources.BackupVault).toBeDefined();
      expect(template.Resources.BackupVault.Type).toBe('AWS::Backup::BackupVault');
      const vault = template.Resources.BackupVault.Properties;
      expect(vault.EncryptionKeyArn['Fn::GetAtt']).toEqual(['BackupKMSKey', 'Arn']);
    });

    test('should have backup plan with correct schedule', () => {
      expect(template.Resources.BackupPlan).toBeDefined();
      expect(template.Resources.BackupPlan.Type).toBe('AWS::Backup::BackupPlan');
      const plan = template.Resources.BackupPlan.Properties.BackupPlan;
      expect(plan.BackupPlanRule).toHaveLength(1);

      const rule = plan.BackupPlanRule[0];
      expect(rule.RuleName).toBe('DailyBackupRule');
      expect(rule.ScheduleExpression).toBe('cron(0 2 * * ? *)');
      expect(rule.StartWindowMinutes).toBe(60);
      expect(rule.CompletionWindowMinutes).toBe(120);
    });

    test('should have lifecycle policy configured correctly', () => {
      const rule = template.Resources.BackupPlan.Properties.BackupPlan.BackupPlanRule[0];
      expect(rule.Lifecycle.DeleteAfterDays).toBe(97);
      expect(rule.Lifecycle.MoveToColdStorageAfterDays).toBe(7);
    });

    test('should have cross-region backup configured', () => {
      const rule = template.Resources.BackupPlan.Properties.BackupPlan.BackupPlanRule[0];
      expect(rule.CopyActions).toHaveLength(1);
      const copyAction = rule.CopyActions[0];
      expect(copyAction.DestinationBackupVaultArn['Fn::Sub']).toContain('us-west-2');
      expect(copyAction.Lifecycle.DeleteAfterDays).toBe(97);
      expect(copyAction.Lifecycle.MoveToColdStorageAfterDays).toBe(7);
    });

    test('should have backup selection for Aurora cluster', () => {
      expect(template.Resources.BackupSelection).toBeDefined();
      expect(template.Resources.BackupSelection.Type).toBe('AWS::Backup::BackupSelection');
      const selection = template.Resources.BackupSelection.Properties.BackupSelection;
      expect(selection.Resources).toHaveLength(1);
      expect(selection.Resources[0]['Fn::Sub']).toContain(':cluster:${AuroraDBCluster}');
    });

    test('should have backup IAM role with correct policies', () => {
      expect(template.Resources.BackupRole).toBeDefined();
      expect(template.Resources.BackupRole.Type).toBe('AWS::IAM::Role');
      const role = template.Resources.BackupRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup');
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores');
    });
  });

  describe('Resource Dependencies', () => {
    test('NAT Gateways should depend on Internet Gateway attachment', () => {
      expect(template.Resources.NATGateway1EIP.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NATGateway2EIP.DependsOn).toBe('AttachGateway');
    });

    test('Public route should depend on Internet Gateway attachment', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('AttachGateway');
    });
  });

  describe('Template Completeness', () => {
    test('should have all required resource types', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);

      // Network resources
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::InternetGateway');
      expect(resourceTypes).toContain('AWS::EC2::NatGateway');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::EC2::RouteTable');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');

      // Application resources
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(resourceTypes).toContain('AWS::EC2::LaunchTemplate');
      expect(resourceTypes).toContain('AWS::AutoScaling::AutoScalingGroup');
      expect(resourceTypes).toContain('AWS::AutoScaling::ScalingPolicy');

      // Database resources
      expect(resourceTypes).toContain('AWS::RDS::DBCluster');
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
      expect(resourceTypes).toContain('AWS::RDS::DBSubnetGroup');

      // Cache resources
      expect(resourceTypes).toContain('AWS::ElastiCache::CacheCluster');
      expect(resourceTypes).toContain('AWS::ElastiCache::SubnetGroup');
      expect(resourceTypes).toContain('AWS::ElastiCache::ParameterGroup');

      // Storage resources
      expect(resourceTypes).toContain('AWS::S3::Bucket');

      // IAM resources
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::IAM::InstanceProfile');

      // Monitoring resources
      expect(resourceTypes).toContain('AWS::EC2::FlowLog');
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');
      expect(resourceTypes).toContain('AWS::CloudWatch::Dashboard');

      // WAF resources
      expect(resourceTypes).toContain('AWS::WAFv2::WebACL');
      expect(resourceTypes).toContain('AWS::WAFv2::LoggingConfiguration');
      expect(resourceTypes).toContain('AWS::WAFv2::WebACLAssociation');

      // Backup resources
      expect(resourceTypes).toContain('AWS::Backup::BackupVault');
      expect(resourceTypes).toContain('AWS::Backup::BackupPlan');
      expect(resourceTypes).toContain('AWS::Backup::BackupSelection');
      expect(resourceTypes).toContain('AWS::KMS::Key');
      expect(resourceTypes).toContain('AWS::KMS::Alias');
    });

    test('should have minimum required resource counts', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(60); // Expecting at least 60 resources with WAF and Backup
    });
  });
});