import fs from 'fs';
import path from 'path';

describe('Payment Processing System CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure and Metadata', () => {
    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Payment Processing System');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toBeDefined();
      expect(envSuffixParam.MinLength).toBe(4);
      expect(envSuffixParam.MaxLength).toBe(20);
      expect(envSuffixParam.AllowedPattern).toBe('[a-z0-9-]+');
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have correct tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toContainEqual(
        expect.objectContaining({ Key: 'Environment', Value: 'Production' })
      );
      expect(tags).toContainEqual(
        expect.objectContaining({ Key: 'CostCenter', Value: 'FinancialServices' })
      );
      expect(tags).toContainEqual(
        expect.objectContaining({ Key: 'MigrationPhase', Value: 'Phase1' })
      );
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Subnets', () => {
    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('public subnets should map public IP on launch', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet3.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.13.0/24');
    });

    test('should have 3 database subnets', () => {
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet2).toBeDefined();
      expect(template.Resources.DatabaseSubnet3).toBeDefined();
    });

    test('database subnets should have correct CIDR blocks', () => {
      expect(template.Resources.DatabaseSubnet1.Properties.CidrBlock).toBe('10.0.21.0/24');
      expect(template.Resources.DatabaseSubnet2.Properties.CidrBlock).toBe('10.0.22.0/24');
      expect(template.Resources.DatabaseSubnet3.Properties.CidrBlock).toBe('10.0.23.0/24');
    });
  });

  describe('NAT Gateways', () => {
    test('should have 3 NAT Gateway EIPs', () => {
      expect(template.Resources.NATGateway1EIP).toBeDefined();
      expect(template.Resources.NATGateway2EIP).toBeDefined();
      expect(template.Resources.NATGateway3EIP).toBeDefined();
    });

    test('NAT Gateway EIPs should be in VPC domain', () => {
      expect(template.Resources.NATGateway1EIP.Properties.Domain).toBe('vpc');
      expect(template.Resources.NATGateway2EIP.Properties.Domain).toBe('vpc');
      expect(template.Resources.NATGateway3EIP.Properties.Domain).toBe('vpc');
    });

    test('should have 3 NAT Gateways', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.NATGateway3).toBeDefined();
    });
  });

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
    });

    test('should have 3 private route tables', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.PrivateRouteTable3).toBeDefined();
    });

    test('public route should point to Internet Gateway', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('private routes should point to NAT Gateways', () => {
      expect(template.Resources.PrivateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      expect(template.Resources.PrivateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
      expect(template.Resources.PrivateRoute3.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway3' });
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTPS from internet', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const ingressRule = albSG.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(443);
      expect(ingressRule.ToPort).toBe(443);
      expect(ingressRule.CidrIp).toBe('0.0.0.0/0');
      expect(ingressRule.IpProtocol).toBe('tcp');
    });

    test('should have EC2 security group', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
    });

    test('EC2 security group should allow HTTP from ALB only', () => {
      const ec2SG = template.Resources.EC2SecurityGroup;
      const ingressRule = ec2SG.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(80);
      expect(ingressRule.ToPort).toBe(80);
      expect(ingressRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('should have RDS security group', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
    });

    test('RDS security group should allow MySQL from EC2 only', () => {
      const rdsSG = template.Resources.RDSSecurityGroup;
      const ingressRule = rdsSG.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(3306);
      expect(ingressRule.ToPort).toBe(3306);
      expect(ingressRule.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });
  });

  describe('KMS Encryption', () => {
    test('should have KMS key for RDS encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have Delete deletion policy', () => {
      expect(template.Resources.KMSKey.DeletionPolicy).toBe('Delete');
    });

    test('KMS key should have 7-day pending window', () => {
      expect(template.Resources.KMSKey.Properties.PendingWindowInDays).toBe(7);
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB subnet group should include all 3 database subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(3);
    });

    test('should have Aurora cluster', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora cluster should have Delete deletion policy', () => {
      expect(template.Resources.AuroraCluster.DeletionPolicy).toBe('Delete');
    });

    test('Aurora cluster should be encrypted with KMS', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('Aurora cluster should have 7-day backup retention', () => {
      expect(template.Resources.AuroraCluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('Aurora cluster should use MySQL engine', () => {
      expect(template.Resources.AuroraCluster.Properties.Engine).toBe('aurora-mysql');
    });

    test('should have Aurora writer instance', () => {
      expect(template.Resources.AuroraInstanceWriter).toBeDefined();
      expect(template.Resources.AuroraInstanceWriter.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have Aurora reader instance', () => {
      expect(template.Resources.AuroraInstanceReader).toBeDefined();
      expect(template.Resources.AuroraInstanceReader.Type).toBe('AWS::RDS::DBInstance');
    });

    test('Aurora instances should not be publicly accessible', () => {
      expect(template.Resources.AuroraInstanceWriter.Properties.PubliclyAccessible).toBe(false);
      expect(template.Resources.AuroraInstanceReader.Properties.PubliclyAccessible).toBe(false);
    });

    test('Aurora instances should use t3.medium', () => {
      expect(template.Resources.AuroraInstanceWriter.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(template.Resources.AuroraInstanceReader.Properties.DBInstanceClass).toBe('db.t3.medium');
    });
  });

  describe('S3 Buckets', () => {
    test('should have artifacts bucket', () => {
      expect(template.Resources.ArtifactsBucket).toBeDefined();
      expect(template.Resources.ArtifactsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('artifacts bucket should have versioning enabled', () => {
      const bucket = template.Resources.ArtifactsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('artifacts bucket should be encrypted', () => {
      const bucket = template.Resources.ArtifactsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('artifacts bucket should block public access', () => {
      const bucket = template.Resources.ArtifactsBucket;
      const blockConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(blockConfig.BlockPublicAcls).toBe(true);
      expect(blockConfig.BlockPublicPolicy).toBe(true);
      expect(blockConfig.IgnorePublicAcls).toBe(true);
      expect(blockConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should have flow logs bucket', () => {
      expect(template.Resources.FlowLogsBucket).toBeDefined();
    });

    test('flow logs bucket should have 90-day lifecycle policy', () => {
      const bucket = template.Resources.FlowLogsBucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 instance role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 instance role should have CloudWatch policy attached', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2 instance role should have SSM parameter store access', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'ParameterStoreAccess');
      expect(policy).toBeDefined();
    });

    test('EC2 instance role should have S3 artifacts access', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3ArtifactsAccess');
      expect(policy).toBeDefined();
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have VPC Flow Logs role', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('ALB should be in all 3 public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(3);
    });

    test('should have ALB target group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('ALB target group should have health check enabled', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
    });

    test('should have HTTPS listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('HTTPS listener should use port 443 with TLS 1.2', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.Port).toBe(443);
      expect(listener.Properties.Protocol).toBe('HTTPS');
      expect(listener.Properties.SslPolicy).toBe('ELBSecurityPolicy-TLS-1-2-2017-01');
    });
  });

  describe('WAF Configuration', () => {
    test('should have WAF Web ACL', () => {
      expect(template.Resources.WebACL).toBeDefined();
      expect(template.Resources.WebACL.Type).toBe('AWS::WAFv2::WebACL');
    });

    test('WAF Web ACL should be regional', () => {
      expect(template.Resources.WebACL.Properties.Scope).toBe('REGIONAL');
    });

    test('WAF should have rate limiting rule', () => {
      const webACL = template.Resources.WebACL;
      const rateLimitRule = webACL.Properties.Rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
    });

    test('should have WAF association with ALB', () => {
      expect(template.Resources.WebACLAssociation).toBeDefined();
      expect(template.Resources.WebACLAssociation.Type).toBe('AWS::WAFv2::WebACLAssociation');
    });
  });

  describe('Auto Scaling', () => {
    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Launch Template should use t3.large instances', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.large');
    });

    test('Launch Template should have EBS volume with gp3 and 3000 IOPS', () => {
      const lt = template.Resources.LaunchTemplate;
      const blockDevice = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.VolumeSize).toBe(100);
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
      expect(blockDevice.Ebs.Iops).toBe(3000);
      expect(blockDevice.Ebs.Encrypted).toBe(true);
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('Auto Scaling Group should have min 2, max 6 instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('Auto Scaling Group should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(3);
    });

    test('should have Scaling Policy', () => {
      expect(template.Resources.ScalingPolicy).toBeDefined();
      expect(template.Resources.ScalingPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });

    test('Scaling Policy should target 70% CPU utilization', () => {
      const policy = template.Resources.ScalingPolicy;
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(70.0);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have Application Log Group', () => {
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Application Log Group should have 30-day retention', () => {
      expect(template.Resources.ApplicationLogGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have CPU high alarm', () => {
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.CPUAlarmHigh.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('CPU alarm should trigger at 80%', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
    });

    test('should have DB connections alarm', () => {
      expect(template.Resources.DBConnectionsAlarm).toBeDefined();
    });

    test('DB connections alarm should trigger at 100', () => {
      const alarm = template.Resources.DBConnectionsAlarm;
      expect(alarm.Properties.Threshold).toBe(100);
      expect(alarm.Properties.MetricName).toBe('DatabaseConnections');
    });

    test('should have VPC Flow Log', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    const resourcesToCheck = [
      'VPC', 'InternetGateway', 'ALBSecurityGroup', 'EC2SecurityGroup', 'RDSSecurityGroup',
      'ApplicationLoadBalancer', 'ALBTargetGroup', 'WebACL', 'LaunchTemplate', 'AutoScalingGroup',
      'AuroraCluster', 'AuroraInstanceWriter', 'AuroraInstanceReader', 'KMSKeyAlias',
      'ArtifactsBucket', 'FlowLogsBucket', 'EC2InstanceRole', 'ApplicationLogGroup'
    ];

    test.each(resourcesToCheck)('%s should include EnvironmentSuffix in name', (resourceName) => {
      const resource = template.Resources[resourceName];
      if (!resource) {
        fail(`Resource ${resourceName} not found`);
        return;
      }

      const nameProperty = resource.Properties.Name ||
                          resource.Properties.TableName ||
                          resource.Properties.BucketName ||
                          resource.Properties.RoleName ||
                          resource.Properties.LogGroupName ||
                          resource.Properties.DBClusterIdentifier ||
                          resource.Properties.DBInstanceIdentifier ||
                          resource.Properties.LaunchTemplateName ||
                          resource.Properties.AutoScalingGroupName ||
                          resource.Properties.AliasName ||
                          resource.Properties.GroupName;

      if (nameProperty && typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
        expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
      }
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have ALBDNSName output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
    });

    test('should have AuroraClusterEndpoint output', () => {
      expect(template.Outputs.AuroraClusterEndpoint).toBeDefined();
    });

    test('should have AuroraReaderEndpoint output', () => {
      expect(template.Outputs.AuroraReaderEndpoint).toBeDefined();
    });

    test('should have ArtifactsBucketName output', () => {
      expect(template.Outputs.ArtifactsBucketName).toBeDefined();
      expect(template.Outputs.ArtifactsBucketName.Value).toEqual({ Ref: 'ArtifactsBucket' });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('PCI DSS Compliance Checks', () => {
    test('RDS database should be encrypted', () => {
      expect(template.Resources.AuroraCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('S3 buckets should be encrypted', () => {
      expect(template.Resources.ArtifactsBucket.Properties.BucketEncryption).toBeDefined();
      expect(template.Resources.FlowLogsBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('EBS volumes should be encrypted', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });

    test('ALB should use HTTPS with TLS 1.2', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.Protocol).toBe('HTTPS');
      expect(listener.Properties.SslPolicy).toContain('TLS-1-2');
    });

    test('RDS should not be publicly accessible', () => {
      expect(template.Resources.AuroraInstanceWriter.Properties.PubliclyAccessible).toBe(false);
      expect(template.Resources.AuroraInstanceReader.Properties.PubliclyAccessible).toBe(false);
    });

    test('S3 buckets should block public access', () => {
      const artifacts = template.Resources.ArtifactsBucket.Properties.PublicAccessBlockConfiguration;
      const flowLogs = template.Resources.FlowLogsBucket.Properties.PublicAccessBlockConfiguration;

      [artifacts, flowLogs].forEach(config => {
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      });
    });
  });

  describe('Destroyability Requirements', () => {
    test('RDS cluster should have Delete deletion policy', () => {
      expect(template.Resources.AuroraCluster.DeletionPolicy).toBe('Delete');
    });

    test('KMS key should have Delete deletion policy with 7-day window', () => {
      expect(template.Resources.KMSKey.DeletionPolicy).toBe('Delete');
      expect(template.Resources.KMSKey.Properties.PendingWindowInDays).toBe(7);
    });

    test('S3 buckets should allow deletion', () => {
      // No DeletionPolicy: Retain means they can be deleted
      expect(template.Resources.ArtifactsBucket.DeletionPolicy).not.toBe('Retain');
      expect(template.Resources.FlowLogsBucket.DeletionPolicy).not.toBe('Retain');
    });
  });
});
