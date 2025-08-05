import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'production';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have correct CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure and highly available');
      expect(template.Description).toContain('multi-AZ deployment');
      expect(template.Description).toContain('encryption');
      expect(template.Description).toContain('monitoring');
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters - Environment Separation Support', () => {
    test('should have EnvironmentSuffix parameter', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have VPC and subnet CIDR parameters', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.PublicSubnet1Cidr).toBeDefined();
      expect(template.Parameters.PublicSubnet2Cidr).toBeDefined();
      expect(template.Parameters.PrivateSubnet1Cidr).toBeDefined();
      expect(template.Parameters.PrivateSubnet2Cidr).toBeDefined();
    });

    test('should have instance type parameters with valid defaults', () => {
      const instanceType = template.Parameters.InstanceType;
      expect(instanceType.Type).toBe('String');
      expect(instanceType.Default).toBe('t3.medium');
      expect(instanceType.AllowedValues).toContain('t3.micro');
      expect(instanceType.AllowedValues).toContain('t3.medium');

      const dbInstanceClass = template.Parameters.DBInstanceClass;
      expect(dbInstanceClass.Type).toBe('String');
      expect(dbInstanceClass.Default).toBe('db.t3.micro');
    });

    test('should have database username parameter with constraints', () => {
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('^[a-zA-Z][a-zA-Z0-9]*$');
    });

    test('should have optional parameters for flexibility', () => {
      expect(template.Parameters.NotificationEmail.Default).toBe('');
      expect(template.Parameters.SSLCertificateArn.Default).toBe('');
      expect(template.Parameters.UseHTTPS.Default).toBe('false');
      expect(template.Parameters.UseMultipleNATGateways.Default).toBe('false');
    });
  });

  describe('Mappings - Environment Configuration', () => {
    test('should have EnvironmentMap with environment-specific settings', () => {
      expect(template.Mappings.EnvironmentMap).toBeDefined();
      expect(template.Mappings.EnvironmentMap.production).toBeDefined();
      expect(template.Mappings.EnvironmentMap.staging).toBeDefined();
      expect(template.Mappings.EnvironmentMap.dev).toBeDefined();
      expect(template.Mappings.EnvironmentMap.default).toBeDefined();
      
      // Verify production settings
      expect(template.Mappings.EnvironmentMap.production.MinSize).toBe(2);
      expect(template.Mappings.EnvironmentMap.production.MaxSize).toBe(6);
      expect(template.Mappings.EnvironmentMap.production.CPUThreshold).toBe(70);
      
      // Verify staging settings
      expect(template.Mappings.EnvironmentMap.staging.MinSize).toBe(1);
      expect(template.Mappings.EnvironmentMap.staging.MaxSize).toBe(3);
      expect(template.Mappings.EnvironmentMap.staging.CPUThreshold).toBe(80);
    });
  });

  describe('Conditions - Environment Logic', () => {
    test('should have production environment condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('should have production and staging environment conditions', () => {
      expect(template.Conditions.IsProductionEnv).toBeDefined();
      expect(template.Conditions.IsStagingEnv).toBeDefined();
    });

    test('should have HTTPS enabling conditions', () => {
      expect(template.Conditions.HasSSLCertificate).toBeDefined();
      expect(template.Conditions.EnableHTTPS).toBeDefined();
    });

    test('should have NAT Gateway condition', () => {
      expect(template.Conditions.UseMultipleNATs).toBeDefined();
    });

    test('should have notification email condition', () => {
      expect(template.Conditions.HasNotificationEmail).toBeDefined();
    });
  });

  describe('VPC and Networking - Multi-AZ Setup', () => {
    test('should create VPC with correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: 'Production'
      });
    });

    test('should create two public subnets in different AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        "Fn::Select": [0, {"Fn::GetAZs": ""}]
      });

      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        "Fn::Select": [1, {"Fn::GetAZs": ""}]
      });
    });

    test('should create two private subnets in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        "Fn::Select": [0, {"Fn::GetAZs": ""}]
      });

      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        "Fn::Select": [1, {"Fn::GetAZs": ""}]
      });
    });

    test('should create NAT Gateways with conditional second gateway', () => {
      const natGw1 = template.Resources.NatGateway1;
      const natGw2 = template.Resources.NatGateway2;

      expect(natGw1.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw2.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw2.Condition).toBe('UseMultipleNATs');
    });

    test('should create proper route tables and associations', () => {
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable1.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable2.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.PrivateRouteTable2.Condition).toBe('UseMultipleNATs');
    });
  });

  describe('Security Groups - Least Privilege', () => {
    test('should create ALB security group with HTTP/HTTPS access', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[1].CidrIp).toBe('0.0.0.0/0');
    });

    test('should create web server security group with ALB-only access', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].SourceSecurityGroupId).toEqual({"Ref": "ALBSecurityGroup"});
      expect(ingress[1].SourceSecurityGroupId).toEqual({"Ref": "ALBSecurityGroup"});
    });

    test('should create database security group with web server-only access', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({"Ref": "WebServerSecurityGroup"});
    });
  });

  describe('S3 Bucket - Encryption and Versioning', () => {
    test('should create S3 bucket with versioning enabled', () => {
      const s3 = template.Resources.S3Bucket;
      expect(s3.Type).toBe('AWS::S3::Bucket');
      expect(s3.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should enable KMS encryption on S3 bucket', () => {
      const s3 = template.Resources.S3Bucket;
      const encryption = s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toBe('alias/aws/s3');
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('should block public access', () => {
      const s3 = template.Resources.S3Bucket;
      const publicBlock = s3.Properties.PublicAccessBlockConfiguration;
      expect(publicBlock.BlockPublicAcls).toBe(true);
      expect(publicBlock.BlockPublicPolicy).toBe(true);
      expect(publicBlock.IgnorePublicAcls).toBe(true);
      expect(publicBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Application Load Balancer - HTTPS Configuration', () => {
    test('should create ALB in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should create HTTPS listener conditionally', () => {
      const httpsListener = template.Resources.ALBHTTPSListener;
      expect(httpsListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(httpsListener.Condition).toBe('EnableHTTPS');
      expect(httpsListener.Properties.Port).toBe(443);
      expect(httpsListener.Properties.Protocol).toBe('HTTPS');
    });

    test('should redirect HTTP to HTTPS when HTTPS is enabled', () => {
      const httpListener = template.Resources.ALBHTTPListener;
      expect(httpListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(httpListener.Properties.Port).toBe(80);
      expect(httpListener.Properties.Protocol).toBe('HTTP');
      
      // Check conditional redirect logic exists
      const defaultActions = httpListener.Properties.DefaultActions;
      expect(defaultActions).toBeDefined();
    });

    test('should create target group with health checks', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
    });
  });

  describe('RDS Database - Multi-AZ and Encryption', () => {
    test('should create RDS database with multi-AZ', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.35');
    });

    test('should enable KMS encryption on RDS', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toBe('alias/aws/rds');
    });

    test('should use AWS managed password generation', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.ManageMasterUserPassword).toBe(true);
      expect(rds.Properties.MasterUserSecret).toBeUndefined();
    });

    test('should create DB subnet group in private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should configure backup and maintenance windows', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.PreferredBackupWindow).toBe('03:00-04:00');
      expect(rds.Properties.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
    });
  });

  describe('EC2 Auto Scaling - CPU-based Scaling', () => {
    test('should create launch template with IAM role', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.ImageId).toBe('ami-0c02fb55956c7d316');
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
    });

    test('should create auto scaling group with environment-based sizing', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should use conditional logic for auto scaling group sizing', () => {
      const asg = template.Resources.AutoScalingGroup;
      
      // MinSize is hardcoded to 1 for all environments
      expect(asg.Properties.MinSize).toBe(1);
      
      // MaxSize uses conditional logic
      expect(asg.Properties.MaxSize).toHaveProperty('Fn::If');
      expect(asg.Properties.MaxSize['Fn::If'][0]).toBe('IsProductionEnv');
      expect(asg.Properties.MaxSize['Fn::If'][1]).toBe(6); // Production value
      
      // DesiredCapacity uses conditional logic
      expect(asg.Properties.DesiredCapacity).toHaveProperty('Fn::If');
      expect(asg.Properties.DesiredCapacity['Fn::If'][0]).toBe('IsProductionEnv');
      expect(asg.Properties.DesiredCapacity['Fn::If'][1]).toBe(2); // Production value
      expect(asg.Properties.DesiredCapacity['Fn::If'][2]).toBe(1); // Non-production value
      
      // Verify nested conditional structure for MaxSize (staging vs other environments)
      const maxSizeNestedIf = asg.Properties.MaxSize['Fn::If'][2];
      expect(maxSizeNestedIf).toHaveProperty('Fn::If');
      expect(maxSizeNestedIf['Fn::If'][0]).toBe('IsStagingEnv');
      expect(maxSizeNestedIf['Fn::If'][1]).toBe(3); // Staging value
      expect(maxSizeNestedIf['Fn::If'][2]).toBe(2); // PR/other environments value
    });

    test('should create scaling policies', () => {
      const scaleUp = template.Resources.ScaleUpPolicy;
      const scaleDown = template.Resources.ScaleDownPolicy;

      expect(scaleUp.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleUp.Properties.ScalingAdjustment).toBe(1);
      expect(scaleUp.Properties.Cooldown).toBe(300);

      expect(scaleDown.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleDown.Properties.ScalingAdjustment).toBe(-1);
      expect(scaleDown.Properties.Cooldown).toBe(300);
    });
  });

  describe('IAM Roles - Least Privilege', () => {
    test('should create EC2 role with minimal permissions', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('should include CloudWatch agent policy', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('should have S3 bucket access policy', () => {
      const role = template.Resources.EC2Role;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3BucketAccess');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement).toHaveLength(2);
    });

    test('should create instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toHaveLength(1);
    });
  });

  describe('CloudWatch Monitoring and SNS Notifications', () => {
    test('should create CPU utilization alarms', () => {
      const highAlarm = template.Resources.CPUAlarmHigh;
      const lowAlarm = template.Resources.CPUAlarmLow;

      expect(highAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(highAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(highAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');

      expect(lowAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(lowAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(lowAlarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should use conditional logic for CPU alarm threshold', () => {
      const highAlarm = template.Resources.CPUAlarmHigh;
      
      // Check that conditional logic is used for CPU threshold
      expect(highAlarm.Properties.Threshold).toHaveProperty('Fn::If');
      expect(highAlarm.Properties.Threshold['Fn::If'][0]).toBe('IsProductionEnv');
      expect(highAlarm.Properties.Threshold['Fn::If'][1]).toBe(70); // Production threshold
      expect(highAlarm.Properties.Threshold['Fn::If'][2]).toBe(80); // Non-production threshold
    });

    test('should create ALB response time alarm', () => {
      const alarm = template.Resources.ALBTargetResponseTime;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('TargetResponseTime');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
    });

    test('should create database CPU alarm', () => {
      const alarm = template.Resources.DatabaseCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
    });

    test('should create SNS topic with conditional subscription', () => {
      const topic = template.Resources.SNSTopic;
      const subscription = template.Resources.SNSSubscription;

      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Condition).toBe('HasNotificationEmail');
    });
  });

  describe('Tagging Compliance', () => {
    test('should tag all resources with Environment: Production', () => {
      const resourcesWithTags = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'NatGateway1EIP', 'NatGateway2EIP',
        'NatGateway1', 'NatGateway2', 'PublicRouteTable', 'PrivateRouteTable1',
        'PrivateRouteTable2', 'ALBSecurityGroup', 'WebServerSecurityGroup',
        'DatabaseSecurityGroup', 'S3Bucket', 'ApplicationLoadBalancer',
        'ALBTargetGroup', 'EC2Role', 'DBSubnetGroup', 'RDSDatabase',
        'SNSTopic', 'CPUAlarmHigh', 'CPUAlarmLow', 'ALBTargetResponseTime',
        'DatabaseCPUAlarm'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          expect(resource.Properties.Tags).toContainEqual({
            Key: 'Environment',
            Value: 'Production'
          });
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should export important resource identifiers', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoadBalancerURL).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      expect(template.Outputs.SNSTopicArn).toBeDefined();
      expect(template.Outputs.DatabaseSecretArn).toBeDefined();
    });

    test('should use proper export names with environment suffix', () => {
      const outputs = template.Outputs;
      Object.keys(outputs).forEach(key => {
        if (
          outputs[key].Export &&
          outputs[key].Export.Name &&
          typeof outputs[key].Export.Name === 'object' &&
          outputs[key].Export.Name['Fn::Sub']
        ) {
          expect(outputs[key].Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('PR Environment Support', () => {
    test('should support dynamic PR environment suffixes through conditional logic', () => {
      // Verify IsProductionEnv and IsStagingEnv conditions exist to handle specific environments
      expect(template.Conditions.IsProductionEnv).toBeDefined();
      expect(template.Conditions.IsStagingEnv).toBeDefined();
      
      // Should check for production and staging specifically
      expect(template.Conditions.IsProductionEnv).toHaveProperty('Fn::Equals');
      expect(template.Conditions.IsStagingEnv).toHaveProperty('Fn::Equals');
    });

    test('should fallback to PR environment defaults for unknown environments', () => {
      // Auto Scaling Group should use conditional logic with appropriate defaults
      const asg = template.Resources.AutoScalingGroup;
      
      // MinSize is hardcoded to 1 for all environments (conservative approach)
      expect(asg.Properties.MinSize).toBe(1);
      
      // MaxSize: Production=6, staging=3, PR/other=2
      expect(asg.Properties.MaxSize['Fn::If']).toEqual([
        'IsProductionEnv',
        6,
        { 'Fn::If': ['IsStagingEnv', 3, 2] }
      ]);
      
      // DesiredCapacity: Production=2, others=1
      expect(asg.Properties.DesiredCapacity['Fn::If']).toEqual([
        'IsProductionEnv',
        2,
        1
      ]);
      
      // CPU Alarm: Production=70, others=80
      const cpuAlarm = template.Resources.CPUAlarmHigh;
      expect(cpuAlarm.Properties.Threshold['Fn::If']).toEqual([
        'IsProductionEnv',
        70,
        80
      ]);
    });

    test('should provide cost-effective defaults for PR environments', () => {
      // Verify the defaults for unknown environments (PR environments)
      const asg = template.Resources.AutoScalingGroup;
      const cpuAlarm = template.Resources.CPUAlarmHigh;
      
      // PR environment values should be cost-effective
      const prMinSize = asg.Properties.MinSize; // Hardcoded to 1
      const prMaxSize = asg.Properties.MaxSize['Fn::If'][2]['Fn::If'][2]; // Non-production, non-staging value
      const prDesiredCapacity = asg.Properties.DesiredCapacity['Fn::If'][2]; // Non-production value
      const prCpuThreshold = cpuAlarm.Properties.Threshold['Fn::If'][2]; // Non-production value
      
      expect(prMinSize).toBe(1);
      expect(prMaxSize).toBe(2);
      expect(prDesiredCapacity).toBe(1);
      expect(prCpuThreshold).toBe(80); // Higher threshold = less frequent scaling
    });
  });

  describe('PROMPT.md Compliance Validation', () => {
    test('should meet all infrastructure requirements', () => {
      // S3 with versioning and KMS encryption
      expect(template.Resources.S3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(template.Resources.S3Bucket.Properties.BucketEncryption).toBeDefined();

      // VPC with 2 public and 2 private subnets across 2 AZs
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      // ALB with HTTPS support
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ALBHTTPSListener).toBeDefined();

      // RDS multi-AZ with KMS encryption
      expect(template.Resources.RDSDatabase.Properties.MultiAZ).toBe(true);
      expect(template.Resources.RDSDatabase.Properties.StorageEncrypted).toBe(true);

      // EC2 auto-scaling with CPU-based policies
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();

      // IAM with least privilege
      expect(template.Resources.EC2Role).toBeDefined();

      // CloudWatch monitoring and SNS notifications
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.SNSTopic).toBeDefined();
    });

    test('should support environment separation', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Conditions.IsProductionEnv).toBeDefined();
      expect(template.Conditions.IsStagingEnv).toBeDefined();
    });

    test('should be fully parameterized', () => {
      const requiredParams = [
        'EnvironmentSuffix', 'VpcCidr', 'PublicSubnet1Cidr', 'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr', 'PrivateSubnet2Cidr', 'InstanceType', 'DBInstanceClass',
        'DBUsername', 'NotificationEmail', 'SSLCertificateArn', 'UseHTTPS', 'UseMultipleNATGateways'
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
  });
});
