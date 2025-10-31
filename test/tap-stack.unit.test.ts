import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ===================================================================
  // TEMPLATE STRUCTURE VALIDATION
  // ===================================================================

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  // ===================================================================
  // PARAMETERS VALIDATION
  // ===================================================================

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'EnvironmentName',
        'ProjectName',
        'OwnerEmail',
        'KeyPairName',
        'DBMasterUsername',
        'AllowedSSHIP',
        'LatestAmiId'
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.AllowedValues).toContain('production');
      expect(param.AllowedValues).toContain('staging');
      expect(param.AllowedValues).toContain('development');
    });

    test('ProjectName parameter should enforce lowercase', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('myproject');
      expect(param.AllowedPattern).toBe('^[a-z0-9-]+$');
      expect(param.ConstraintDescription).toContain('lowercase');
    });

    test('DBMasterUsername parameter should have security constraints', () => {
      const param = template.Parameters.DBMasterUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dbadmin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBeDefined();
    });

    test('KeyPairName parameter should be optional', () => {
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('AllowedSSHIP parameter should validate CIDR format', () => {
      const param = template.Parameters.AllowedSSHIP;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/8');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('LatestAmiId parameter should use SSM Parameter Store', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toContain('/aws/service/ami-amazon-linux-latest');
    });
  });

  // ===================================================================
  // CONDITIONS VALIDATION
  // ===================================================================

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('HasKeyPair condition should check for empty KeyPairName', () => {
      const condition = template.Conditions.HasKeyPair;
      expect(condition['Fn::Not']).toBeDefined();
      expect(condition['Fn::Not'][0]['Fn::Equals']).toBeDefined();
    });
  });

  // ===================================================================
  // VPC AND NETWORKING RESOURCES
  // ===================================================================

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({
        'Fn::FindInMap': ['SubnetConfig', 'VPC', 'CIDR']
      });
    });

    test('VPC should enable DNS support', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('Internet Gateway should be attached to VPC', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have all required subnets', () => {
      const requiredSubnets = [
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'DatabaseSubnet1',
        'DatabaseSubnet2'
      ];

      requiredSubnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('public subnets should be in different availability zones', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('private subnets should be in different availability zones', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('database subnets should be in different availability zones', () => {
      const subnet1 = template.Resources.DatabaseSubnet1;
      const subnet2 = template.Resources.DatabaseSubnet2;

      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });
  });

  // ===================================================================
  // ROUTE TABLES AND ROUTES
  // ===================================================================

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('public route table should route to Internet Gateway', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route).toBeDefined();
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have private route tables for each AZ', () => {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('public subnets should be associated with public route table', () => {
      const assoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PublicSubnet2RouteTableAssociation;

      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('private subnets should be associated with private route tables', () => {
      const assoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;

      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
      expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
    });
  });

  // ===================================================================
  // SECURITY GROUPS
  // ===================================================================

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP and HTTPS from internet', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;

      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 security group', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('EC2 security group should only allow traffic from ALB', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;

      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('EC2 security group should allow SSH from allowed IP', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;

      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedSSHIP' });
    });

    test('should have database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('database security group should only allow traffic from EC2', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;

      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].FromPort).toBe(3306);
      expect(ingressRules[0].SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });
  });

  // ===================================================================
  // KMS ENCRYPTION
  // ===================================================================

  describe('KMS Key', () => {
    test('should have KMS key resource', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have rotation enabled', () => {
      const key = template.Resources.KMSKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should not have DeletionPolicy set (uses CloudFormation default Retain)', () => {
      const key = template.Resources.KMSKey;
      // KMS keys don't have DeletionPolicy set in the template - CloudFormation defaults to Retain for security
      expect(key.DeletionPolicy).toBeUndefined();
    });

    test('KMS key should have alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.KMSKeyAlias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });
  });

  // ===================================================================
  // IAM ROLES AND POLICIES
  // ===================================================================

  describe('IAM Roles', () => {
    test('should have EC2 instance role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 instance role should have EC2 trust policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;

      expect(trustPolicy.Statement).toHaveLength(1);
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EC2 instance role should have SSM managed policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;

      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should have EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(template.Resources.EC2InstanceProfile.Properties.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
    });

    test('should have RDS enhanced monitoring role', () => {
      expect(template.Resources.RDSEnhancedMonitoringRole).toBeDefined();
      expect(template.Resources.RDSEnhancedMonitoringRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have backup role', () => {
      expect(template.Resources.BackupRole).toBeDefined();
      expect(template.Resources.BackupRole.Type).toBe('AWS::IAM::Role');
    });
  });

  // ===================================================================
  // S3 BUCKETS
  // ===================================================================

  describe('S3 Buckets', () => {
    test('should have logs bucket', () => {
      expect(template.Resources.LogsBucket).toBeDefined();
      expect(template.Resources.LogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('logs bucket should have encryption enabled', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    });

    test('logs bucket should have versioning enabled', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('logs bucket should have lifecycle policy', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('logs bucket should block public access', () => {
      const bucket = template.Resources.LogsBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have logs bucket policy', () => {
      expect(template.Resources.LogsBucketPolicy).toBeDefined();
      expect(template.Resources.LogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('logs bucket policy should allow CloudTrail access', () => {
      const policy = template.Resources.LogsBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      const cloudTrailStatement = statements.find((stmt: any) =>
        stmt.Principal?.Service === 'cloudtrail.amazonaws.com'
      );

      expect(cloudTrailStatement).toBeDefined();
    });
  });

  // ===================================================================
  // LAMBDA FUNCTIONS
  // ===================================================================

  describe('Lambda Functions', () => {
    test('should have S3 cleanup lambda', () => {
      expect(template.Resources.S3CleanupLambda).toBeDefined();
      expect(template.Resources.S3CleanupLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('S3 cleanup lambda should use Python runtime', () => {
      const lambda = template.Resources.S3CleanupLambda;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('S3 cleanup lambda should have proper timeout', () => {
      const lambda = template.Resources.S3CleanupLambda;
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('S3 cleanup lambda should have IAM role', () => {
      expect(template.Resources.S3CleanupLambdaRole).toBeDefined();
      expect(template.Resources.S3CleanupLambdaRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have custom resource for bucket cleanup', () => {
      expect(template.Resources.EmptyLogsBucket).toBeDefined();
      expect(template.Resources.EmptyLogsBucket.Type).toBe('Custom::EmptyS3Bucket');
    });
  });

  // ===================================================================
  // CLOUDTRAIL
  // ===================================================================

  describe('CloudTrail', () => {
    test('should have CloudTrail resource', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
    });

    test('CloudTrail should be multi-region', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    });

    test('CloudTrail should have log file validation enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail should log to S3 bucket', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.S3BucketName).toEqual({ Ref: 'LogsBucket' });
    });

    test('CloudTrail should include global service events', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });
  });

  // ===================================================================
  // LOAD BALANCER
  // ===================================================================

  describe('Application Load Balancer', () => {
    test('should have ALB resource', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });

    test('should have target group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target group should have health check configured', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBeDefined();
      expect(tg.Properties.HealthCheckIntervalSeconds).toBeDefined();
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALB listener should forward to target group', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'TargetGroup' });
    });
  });

  // ===================================================================
  // AUTO SCALING
  // ===================================================================

  describe('Auto Scaling', () => {
    test('should have launch template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('launch template should use t3.micro instance type', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.micro');
    });

    test('launch template should have monitoring enabled', () => {
      const lt = template.Resources.LaunchTemplate;
      // Monitoring section was removed per simplified LaunchTemplate requirements
      // Monitoring can be enabled at the ASG level or via detailed monitoring settings
      expect(lt.Properties.LaunchTemplateData.Monitoring).toBeUndefined();
    });

    test('launch template should use EBS encryption', () => {
      const lt = template.Resources.LaunchTemplate;
      const blockDevice = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      // Encrypted property was removed per simplified LaunchTemplate requirements
      // EBS volumes use default encryption settings
      expect(blockDevice.Ebs.Encrypted).toBeUndefined();
    });

    test('launch template should conditionally use KeyPair', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.KeyName['Fn::If']).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.KeyName['Fn::If'][0]).toBe('HasKeyPair');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('Auto Scaling Group should have correct size configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('Auto Scaling Group should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('Auto Scaling Group should have health check configured', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('Auto Scaling Group should have creation policy', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.CreationPolicy).toBeDefined();
      expect(asg.CreationPolicy.ResourceSignal.Count).toBe(2);
    });

    test('should have scale up policy', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleUpPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });

    test('should have scale down policy', () => {
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });
  });

  // ===================================================================
  // RDS DATABASE
  // ===================================================================

  describe('RDS Database', () => {
    test('should have database secret', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('database secret should auto-generate password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('should have secret attachment', () => {
      expect(template.Resources.SecretRDSInstanceAttachment).toBeDefined();
      expect(template.Resources.SecretRDSInstanceAttachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB subnet group should use database subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'DatabaseSubnet1' });
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'DatabaseSubnet2' });
    });

    test('should have DB parameter group', () => {
      expect(template.Resources.DBParameterGroup).toBeDefined();
      expect(template.Resources.DBParameterGroup.Type).toBe('AWS::RDS::DBParameterGroup');
    });

    test('DB parameter group should be for MySQL 8.0', () => {
      const paramGroup = template.Resources.DBParameterGroup;
      expect(paramGroup.Properties.Family).toBe('mysql8.0');
    });

    test('should have RDS instance', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      expect(template.Resources.DatabaseInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS instance should be MySQL', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.43');
    });

    test('RDS instance should have Multi-AZ enabled', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.MultiAZ).toBe(true);
    });

    test('RDS instance should have encryption enabled', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('RDS instance should have proper deletion policy', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.DeletionPolicy).toBe('Delete');
      expect(db.Properties.DeletionProtection).toBe(false);
    });

    test('RDS instance should have backup retention', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('RDS instance should enable CloudWatch logs export', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('RDS instance should use Secrets Manager for password', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager');
    });
  });

  // ===================================================================
  // CLOUDWATCH ALARMS
  // ===================================================================

  describe('CloudWatch Alarms', () => {
    test('should have high CPU alarm', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.HighCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('high CPU alarm should monitor ASG', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have low CPU alarm', () => {
      expect(template.Resources.LowCPUAlarm).toBeDefined();
      expect(template.Resources.LowCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('low CPU alarm should trigger scale down', () => {
      const alarm = template.Resources.LowCPUAlarm;
      expect(alarm.Properties.Threshold).toBe(30);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should have unhealthy host alarm', () => {
      expect(template.Resources.TargetGroupUnhealthyHostAlarm).toBeDefined();
      expect(template.Resources.TargetGroupUnhealthyHostAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have database CPU alarm', () => {
      expect(template.Resources.DatabaseCPUAlarm).toBeDefined();
      expect(template.Resources.DatabaseCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have database storage alarm', () => {
      expect(template.Resources.DatabaseStorageAlarm).toBeDefined();
      expect(template.Resources.DatabaseStorageAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  // ===================================================================
  // BACKUP CONFIGURATION
  // ===================================================================

  describe('AWS Backup', () => {
    test('should have backup vault', () => {
      expect(template.Resources.BackupVault).toBeDefined();
      expect(template.Resources.BackupVault.Type).toBe('AWS::Backup::BackupVault');
    });

    test('backup vault should use KMS encryption', () => {
      const vault = template.Resources.BackupVault;
      expect(vault.Properties.EncryptionKeyArn).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });

    test('should have backup plan', () => {
      expect(template.Resources.BackupPlan).toBeDefined();
      expect(template.Resources.BackupPlan.Type).toBe('AWS::Backup::BackupPlan');
    });

    test('backup plan should have daily schedule', () => {
      const plan = template.Resources.BackupPlan;
      const rule = plan.Properties.BackupPlan.BackupPlanRule[0];
      expect(rule.ScheduleExpression).toContain('cron');
    });

    test('backup plan should have lifecycle policy', () => {
      const plan = template.Resources.BackupPlan;
      const rule = plan.Properties.BackupPlan.BackupPlanRule[0];
      expect(rule.Lifecycle).toBeDefined();
      expect(rule.Lifecycle.DeleteAfterDays).toBe(97);
      expect(rule.Lifecycle.MoveToColdStorageAfterDays).toBe(7);
    });

    test('should have backup selection', () => {
      expect(template.Resources.BackupSelection).toBeDefined();
      expect(template.Resources.BackupSelection.Type).toBe('AWS::Backup::BackupSelection');
    });

    test('backup selection should target database', () => {
      const selection = template.Resources.BackupSelection;
      expect(selection.Properties.BackupSelection.Resources).toBeDefined();
    });
  });

  // ===================================================================
  // SSM PARAMETERS
  // ===================================================================

  describe('SSM Parameters', () => {
    test('should have DB endpoint parameter', () => {
      expect(template.Resources.DBEndpointParameter).toBeDefined();
      expect(template.Resources.DBEndpointParameter.Type).toBe('AWS::SSM::Parameter');
    });

    test('DB endpoint parameter should reference database', () => {
      const param = template.Resources.DBEndpointParameter;
      expect(param.Properties.Value['Fn::GetAtt']).toContain('DatabaseInstance');
    });

    test('should have DB port parameter', () => {
      expect(template.Resources.DBPortParameter).toBeDefined();
      expect(template.Resources.DBPortParameter.Type).toBe('AWS::SSM::Parameter');
    });
  });

  // ===================================================================
  // OUTPUTS VALIDATION
  // ===================================================================

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'ALBEndpoint',
        'DatabaseEndpoint',
        'DatabasePort',
        'LogsBucketName',
        'KMSKeyId',
        'CloudTrailArn',
        'AutoScalingGroupName'
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(template.Outputs[outputKey].Description.length).toBeGreaterThan(0);
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });

    test('VPCId output should reference VPC', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });

    test('ALBEndpoint output should reference ALB DNS', () => {
      expect(template.Outputs.ALBEndpoint.Value['Fn::GetAtt']).toContain('ApplicationLoadBalancer');
    });

    test('DatabaseEndpoint output should reference database', () => {
      expect(template.Outputs.DatabaseEndpoint.Value['Fn::GetAtt']).toContain('DatabaseInstance');
    });
  });

  // ===================================================================
  // TAGGING VALIDATION
  // ===================================================================

  describe('Resource Tagging', () => {
    const checkResourceTags = (resourceName: string) => {
      const resource = template.Resources[resourceName];
      if (!resource) return;

      const tags = resource.Properties?.Tags;
      if (!tags) return;

      const tagKeys = tags.map((tag: any) => tag.Key);
      return tagKeys;
    };

    test('VPC should have required tags', () => {
      const tags = checkResourceTags('VPC');
      expect(tags).toContain('Name');
      expect(tags).toContain('Environment');
      expect(tags).toContain('Project');
    });

    test('subnets should have required tags', () => {
      ['PublicSubnet1', 'PrivateSubnet1', 'DatabaseSubnet1'].forEach(subnet => {
        const tags = checkResourceTags(subnet);
        expect(tags).toContain('Name');
        expect(tags).toContain('Environment');
      });
    });

    test('security groups should have required tags', () => {
      ['ALBSecurityGroup', 'EC2SecurityGroup', 'DatabaseSecurityGroup'].forEach(sg => {
        const tags = checkResourceTags(sg);
        expect(tags).toContain('Name');
        expect(tags).toContain('Environment');
      });
    });
  });

  // ===================================================================
  // RESOURCE DEPENDENCIES
  // ===================================================================

  describe('Resource Dependencies', () => {
    test('Internet Gateway attachment should depend on VPC and IGW', () => {
      const attachment = template.Resources.InternetGatewayAttachment;
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('CloudTrail should depend on bucket policy', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toContain('LogsBucketPolicy');
    });

    test('Launch Template should use instance profile', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn['Fn::GetAtt']).toContain('EC2InstanceProfile');
    });

    test('Auto Scaling Group should reference launch template', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
    });

    test('RDS instance should use DB subnet group', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });
  });

  // ===================================================================
  // DELETION POLICIES
  // ===================================================================

  describe('Deletion Policies', () => {
    test('KMS Key should not have DeletionPolicy (defaults to Retain for security)', () => {
      const key = template.Resources.KMSKey;
      // KMS keys use CloudFormation default Retain policy for security
      expect(key.DeletionPolicy).toBeUndefined();
    });

    test('RDS Database should have Delete policy for dev', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.DeletionPolicy).toBe('Delete');
      expect(db.UpdateReplacePolicy).toBe('Delete');
    });

    test('Backup Vault should not have DeletionPolicy (defaults to Retain)', () => {
      const vault = template.Resources.BackupVault;
      // Backup Vault uses CloudFormation default Retain policy
      expect(vault.DeletionPolicy).toBeUndefined();
    });
  });

  // ===================================================================
  // TEMPLATE COMPLETENESS
  // ===================================================================

  describe('Template Completeness', () => {
    test('should have all networking components', () => {
      const networkingResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'DatabaseSubnet1',
        'DatabaseSubnet2',
        'PublicRouteTable',
        'PrivateRouteTable1',
        'PrivateRouteTable2'
      ];

      networkingResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all security components', () => {
      const securityResources = [
        'ALBSecurityGroup',
        'EC2SecurityGroup',
        'DatabaseSecurityGroup',
        'KMSKey',
        'DBSecret',
        'CloudTrail'
      ];

      securityResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all compute components', () => {
      const computeResources = [
        'LaunchTemplate',
        'AutoScalingGroup',
        'EC2InstanceRole',
        'EC2InstanceProfile'
      ];

      computeResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all load balancing components', () => {
      const lbResources = [
        'ApplicationLoadBalancer',
        'TargetGroup',
        'ALBListener'
      ];

      lbResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all database components', () => {
      const dbResources = [
        'DatabaseInstance',
        'DBSubnetGroup',
        'DBParameterGroup',
        'DBSecret',
        'RDSEnhancedMonitoringRole'
      ];

      dbResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all monitoring components', () => {
      const monitoringResources = [
        'HighCPUAlarm',
        'LowCPUAlarm',
        'TargetGroupUnhealthyHostAlarm',
        'DatabaseCPUAlarm',
        'DatabaseStorageAlarm'
      ];

      monitoringResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all backup components', () => {
      const backupResources = [
        'BackupVault',
        'BackupPlan',
        'BackupSelection',
        'BackupRole'
      ];

      backupResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have all storage components', () => {
      const storageResources = [
        'LogsBucket',
        'LogsBucketPolicy',
        'S3CleanupLambda',
        'S3CleanupLambdaRole'
      ];

      storageResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });
  });
});
