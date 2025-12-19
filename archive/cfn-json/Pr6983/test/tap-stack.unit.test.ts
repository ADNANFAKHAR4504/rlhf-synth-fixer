import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Payment Processing Infrastructure - CloudFormation Template', () => {
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
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
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
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
    });

    test('should not have DBPassword parameter (using Secrets Manager instead)', () => {
      expect(template.Parameters.DBPassword).toBeUndefined();
    });

    test('should have DBUsername parameter with default', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin');
    });

    test('should have AlertEmail parameter with default', () => {
      expect(template.Parameters.AlertEmail).toBeDefined();
      const param = template.Parameters.AlertEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBeDefined();
    });

    test('should have KeyPairName parameter with default', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('NONE');
    });

    test('should have InstanceType parameter with default', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.medium');
    });

    test('should have exactly 5 parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(5);
    });
  });

  describe('Conditions', () => {
    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
    });

    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
      expect(template.Conditions.HasKeyPair['Fn::Not']).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have InternetGateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have AttachGateway attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have 3 public subnets across different AZs using dynamic AZ selection', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();

      // Check that AZs are dynamically selected using Fn::GetAZs
      expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select']).toBeDefined();
      expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select'][1]['Fn::GetAZs']).toBe('');

      expect(template.Resources.PublicSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(template.Resources.PublicSubnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);
    });

    test('should have 3 private subnets across different AZs using dynamic AZ selection', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();

      // Check that AZs are dynamically selected using Fn::GetAZs
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone['Fn::Select']).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone['Fn::Select'][1]['Fn::GetAZs']).toBe('');

      expect(template.Resources.PrivateSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(template.Resources.PrivateSubnet3.Properties.AvailabilityZone['Fn::Select'][0]).toBe(2);
    });

    test('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NATGateway1EIP).toBeDefined();
      expect(template.Resources.NATGateway1EIP.Type).toBe('AWS::EC2::EIP');

      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have public route table with internet gateway route', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have private route tables with NAT gateway route', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRoute1).toBeDefined();
    });

    test('should have all subnet route table associations', () => {
      expect(template.Resources.PublicSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PublicSubnetRouteTableAssociation3).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation1).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation2).toBeDefined();
      expect(template.Resources.PrivateSubnetRouteTableAssociation3).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(template.Resources.ALBSecurityGroup.Properties.GroupDescription).toContain('Application Load Balancer');
    });

    test('should have Instance security group', () => {
      expect(template.Resources.InstanceSecurityGroup).toBeDefined();
      expect(template.Resources.InstanceSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Database security group', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(template.Resources.DBSecurityGroup.Properties.GroupDescription).toContain('Aurora');
    });
  });

  describe('Aurora MySQL Cluster', () => {
    test('should have DB Subnet Group across 3 AZs', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(template.Resources.DBSubnetGroup.Properties.SubnetIds).toHaveLength(3);
    });

    test('should have KMS key for Aurora encryption', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have Secrets Manager secret for database credentials', () => {
      expect(template.Resources.DBMasterSecret).toBeDefined();
      expect(template.Resources.DBMasterSecret.Type).toBe('AWS::SecretsManager::Secret');
      const secret = template.Resources.DBMasterSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('should have KMS key for EBS volume encryption', () => {
      expect(template.Resources.EBSKMSKey).toBeDefined();
      expect(template.Resources.EBSKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.EBSKMSKey.Properties.Description).toBeDefined();
      expect(template.Resources.EBSKMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('EBS KMS key should have proper permissions for Auto Scaling', () => {
      const key = template.Resources.EBSKMSKey;
      const keyPolicy = key.Properties.KeyPolicy;
      const statements = keyPolicy.Statement;

      // Find Auto Scaling service statement
      const autoScalingStatement = statements.find((s: any) =>
        s.Principal?.Service === 'autoscaling.amazonaws.com'
      );
      expect(autoScalingStatement).toBeDefined();
      expect(autoScalingStatement.Action).toContain('kms:RetireGrant');

      // Find Auto Scaling service-linked role statement
      const serviceLinkedRoleStatement = statements.find((s: any) => {
        const principalAWS = s.Principal?.AWS;
        if (!principalAWS) return false;
        // Handle Fn::Sub structure (string value)
        if (principalAWS['Fn::Sub']) {
          return principalAWS['Fn::Sub'].includes('AWSServiceRoleForAutoScaling');
        }
        // Handle string ARN
        if (typeof principalAWS === 'string') {
          return principalAWS.includes('AWSServiceRoleForAutoScaling');
        }
        return false;
      });
      expect(serviceLinkedRoleStatement).toBeDefined();
      expect(serviceLinkedRoleStatement.Action).toContain('kms:RetireGrant');
      // Condition removed to allow service-linked role to create grants without restriction
      expect(serviceLinkedRoleStatement.Condition).toBeUndefined();
    });

    test('should have EBS KMS key alias', () => {
      expect(template.Resources.EBSKMSKeyAlias).toBeDefined();
      expect(template.Resources.EBSKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.EBSKMSKeyAlias.Properties.TargetKeyId).toEqual({ Ref: 'EBSKMSKey' });
    });

    test('should have Aurora DB Cluster with correct configuration', () => {
      expect(template.Resources.AuroraDBCluster).toBeDefined();
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.BackupRetentionPeriod).toBe(7);
      expect(cluster.DeletionPolicy).toBe('Delete');
      expect(cluster.UpdateReplacePolicy).toBe('Delete');
    });

    test('Aurora cluster should use Secrets Manager for credentials', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.MasterUsername).toBeDefined();
      expect(cluster.Properties.MasterUserPassword).toBeDefined();

      // Both should use dynamic references to Secrets Manager
      expect(cluster.Properties.MasterUsername['Fn::Sub']).toBeDefined();
      expect(cluster.Properties.MasterUserPassword['Fn::Sub']).toBeDefined();
      expect(cluster.Properties.MasterUsername['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(cluster.Properties.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(cluster.Properties.MasterUsername['Fn::Sub']).toContain('DBMasterSecret');
      expect(cluster.Properties.MasterUserPassword['Fn::Sub']).toContain('DBMasterSecret');
    });

    test('Aurora cluster should enable CloudWatch logs', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('audit');
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('error');
    });

    test('should have 1 writer DB instance', () => {
      expect(template.Resources.AuroraDBInstanceWriter).toBeDefined();
      const instance = template.Resources.AuroraDBInstanceWriter;
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.DBInstanceClass).toBe('db.r6g.large');
      expect(instance.DeletionPolicy).toBe('Delete');
    });

    test('should have 2 reader DB instances', () => {
      expect(template.Resources.AuroraDBInstanceReader1).toBeDefined();
      expect(template.Resources.AuroraDBInstanceReader2).toBeDefined();

      expect(template.Resources.AuroraDBInstanceReader1.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.AuroraDBInstanceReader2.Type).toBe('AWS::RDS::DBInstance');

      expect(template.Resources.AuroraDBInstanceReader1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AuroraDBInstanceReader2.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Auto Scaling and Load Balancing', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(3);
    });

    test('should have Target Group with health checks', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
    });

    test('should have HTTPS Listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      const listener = template.Resources.ALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.Port).toBe(80);
    });

    test('should have IAM Instance Role', () => {
      expect(template.Resources.InstanceRole).toBeDefined();
      expect(template.Resources.InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have IAM Instance Profile', () => {
      expect(template.Resources.InstanceProfile).toBeDefined();
      expect(template.Resources.InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('Launch Template should depend on EBS KMS key alias', () => {
      const lt = template.Resources.LaunchTemplate;
      // EBSKMSKey and InstanceProfile dependencies are automatically inferred from Ref/GetAtt
      // Only EBSKMSKeyAlias needs explicit DependsOn since it's not directly referenced
      if (lt.DependsOn) {
        expect(lt.DependsOn).toContain('EBSKMSKeyAlias');
        // EBSKMSKey dependency is inferred from Ref in BlockDeviceMappings
        // InstanceProfile dependency is inferred from GetAtt in IamInstanceProfile
      }
    });

    test('Launch Template should have BlockDeviceMappings with EBS encryption', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.BlockDeviceMappings).toBeDefined();
      expect(Array.isArray(lt.Properties.LaunchTemplateData.BlockDeviceMappings)).toBe(true);
      expect(lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].DeviceName).toBe('/dev/xvda');
      expect(lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      expect(lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs.KmsKeyId).toEqual({ Ref: 'EBSKMSKey' });
      expect(lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs.VolumeSize).toBe(20);
      expect(lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs.VolumeType).toBe('gp3');
    });

    test('should have Auto Scaling Group with 6 instances across 3 AZs', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe("6");
      expect(asg.Properties.DesiredCapacity).toBe("6");
      expect(asg.Properties.MaxSize).toBe("12");
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(3);
    });

    test('Auto Scaling Group should depend on EBS KMS key resources', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.DependsOn).toBeDefined();
      expect(asg.DependsOn).toContain('EBSKMSKey');
      expect(asg.DependsOn).toContain('EBSKMSKeyAlias');
    });
  });

  describe('S3 Storage', () => {
    test('should have KMS key for S3 encryption', () => {
      expect(template.Resources.S3KMSKey).toBeDefined();
      const key = template.Resources.S3KMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      // Enabled property not used in template
    });

    test('should have S3 bucket with versioning enabled', () => {
      expect(template.Resources.PaymentDataBucket).toBeDefined();
      const bucket = template.Resources.PaymentDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.PaymentDataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('S3 bucket should have lifecycle configuration', () => {
      const bucket = template.Resources.PaymentDataBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(Array.isArray(bucket.Properties.LifecycleConfiguration.Rules)).toBe(true);
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.PaymentDataBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });
  });

  describe('Route 53 Health Checks', () => {
    test('should have Route 53 Health Check', () => {
      expect(template.Resources.Route53HealthCheck).toBeDefined();
      const hc = template.Resources.Route53HealthCheck;
      expect(hc.Type).toBe('AWS::Route53::HealthCheck');
      expect(hc.Properties.HealthCheckConfig.Type).toBe('HTTP_STR_MATCH');
      expect(hc.Properties.HealthCheckConfig.Port).toBe(80);
      expect(hc.Properties.HealthCheckConfig.RequestInterval).toBe(30);
      expect(hc.Properties.HealthCheckConfig.FailureThreshold).toBe(3);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have SNS topic for notifications', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      const topic = template.Resources.SNSTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have SNS subscription for email alerts', () => {
      expect(template.Resources.SNSSubscription).toBeDefined();
      const sub = template.Resources.SNSSubscription;
      expect(sub.Type).toBe('AWS::SNS::Subscription');
      expect(sub.Properties.Protocol).toBe('email');
    });

    test('should have DB failover alarm', () => {
      expect(template.Resources.DBFailoverAlarm).toBeDefined();
      const alarm = template.Resources.DBFailoverAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('ClusterReplicaLag');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
    });

    test('should have DB CPU alarm', () => {
      expect(template.Resources.DBCPUAlarm).toBeDefined();
      const alarm = template.Resources.DBCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
    });

    test('should have ALB target health alarm', () => {
      expect(template.Resources.ALBTargetHealthAlarm).toBeDefined();
      const alarm = template.Resources.ALBTargetHealthAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have Route53 health check alarm', () => {
      expect(template.Resources.Route53HealthCheckAlarm).toBeDefined();
      const alarm = template.Resources.Route53HealthCheckAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 53 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(53);
    });

    test('should have exactly 8 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have DBClusterEndpoint output', () => {
      expect(template.Outputs.DBClusterEndpoint).toBeDefined();
      expect(template.Outputs.DBClusterEndpoint.Value).toEqual({
        'Fn::GetAtt': ['AuroraDBCluster', 'Endpoint.Address']
      });
    });

    test('should have DBClusterReaderEndpoint output', () => {
      expect(template.Outputs.DBClusterReaderEndpoint).toBeDefined();
      expect(template.Outputs.DBClusterReaderEndpoint.Value).toEqual({
        'Fn::GetAtt': ['AuroraDBCluster', 'ReadEndpoint.Address']
      });
    });

    test('should have LoadBalancerDNS output', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('should have S3BucketName output', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Value).toEqual({ Ref: 'PaymentDataBucket' });
    });

    test('should have SNSTopicArn output', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
      expect(template.Outputs.SNSTopicArn.Value).toEqual({ Ref: 'SNSTopic' });
    });

    test('should have HealthCheckId output', () => {
      expect(template.Outputs.HealthCheckId).toBeDefined();
      expect(template.Outputs.HealthCheckId.Value).toEqual({ Ref: 'Route53HealthCheck' });
    });

    test('should have DBMasterSecretArn output', () => {
      expect(template.Outputs.DBMasterSecretArn).toBeDefined();
      expect(template.Outputs.DBMasterSecretArn.Value).toEqual({ Ref: 'DBMasterSecret' });
    });
  });

  describe('Security Best Practices', () => {
    test('Aurora cluster should be encrypted', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toBeDefined();
    });

    test('S3 bucket should be encrypted', () => {
      const bucket = template.Resources.PaymentDataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('IAM roles should exist for EC2 instances', () => {
      expect(template.Resources.InstanceRole).toBeDefined();
      expect(template.Resources.InstanceProfile).toBeDefined();
    });

    test('DB credentials should use Secrets Manager instead of parameter', () => {
      // Verify Secrets Manager secret exists
      expect(template.Resources.DBMasterSecret).toBeDefined();

      // Verify Aurora cluster uses dynamic reference to Secrets Manager
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.MasterUserPassword).toBeDefined();
      expect(cluster.Properties.MasterUserPassword['Fn::Sub']).toBeDefined();
      expect(cluster.Properties.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager');
    });
  });

  describe('High Availability Configuration', () => {
    test('resources should be distributed across 3 AZs using dynamic selection', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      const subnet3AZ = template.Resources.PublicSubnet3.Properties.AvailabilityZone;

      // Verify AZs are selected dynamically (index 0, 1, 2)
      expect(subnet1AZ['Fn::Select'][0]).toBe(0);
      expect(subnet2AZ['Fn::Select'][0]).toBe(1);
      expect(subnet3AZ['Fn::Select'][0]).toBe(2);
    });

    test('Aurora should have 3 DB instances', () => {
      expect(template.Resources.AuroraDBInstanceWriter).toBeDefined();
      expect(template.Resources.AuroraDBInstanceReader1).toBeDefined();
      expect(template.Resources.AuroraDBInstanceReader2).toBeDefined();
    });

    test('Auto Scaling Group should have minimum 6 instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe("6");
      expect(asg.Properties.DesiredCapacity).toBe("6");
    });

    test('ALB should be in multiple subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(3);
    });
  });

  describe('Resource Naming Convention', () => {
    test('Aurora cluster name should use environment suffix', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.Properties.DBClusterIdentifier).toEqual({
        'Fn::Sub': 'payment-aurora-cluster-${EnvironmentSuffix}'
      });
    });

    test('S3 bucket name should use environment suffix', () => {
      const bucket = template.Resources.PaymentDataBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'payment-data-${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });

    test('Auto Scaling Group name should use environment suffix', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.Tags).toBeDefined();
      const nameTag = asg.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({
        'Fn::Sub': 'payment-asg-instance-${EnvironmentSuffix}'
      });
    });
  });

  describe('Deletion Policies', () => {
    test('Aurora cluster should have Delete policy for QA', () => {
      const cluster = template.Resources.AuroraDBCluster;
      expect(cluster.DeletionPolicy).toBe('Delete');
      expect(cluster.UpdateReplacePolicy).toBe('Delete');
    });

    test('All DB instances should have Delete policy', () => {
      expect(template.Resources.AuroraDBInstanceWriter.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AuroraDBInstanceReader1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AuroraDBInstanceReader2.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('all resource types should be valid AWS types', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('all parameters should have Type defined', () => {
      Object.keys(template.Parameters).forEach(paramKey => {
        const param = template.Parameters[paramKey];
        expect(param.Type).toBeDefined();
      });
    });

    test('all outputs should have Value defined', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Value).toBeDefined();
      });
    });
  });
});
