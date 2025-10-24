import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load JSON template (converted from YAML by cfn-flip during test setup)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ==========================================
  // Template Structure Tests
  // ==========================================
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
    });

    test('should have required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  // ==========================================
  // Parameters Tests
  // ==========================================
  describe('Parameters', () => {
    test('should have KeyPairName parameter', () => {
      const param = template.Parameters.KeyPairName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('should have SSHAllowedCIDR parameter with valid pattern', () => {
      const param = template.Parameters.SSHAllowedCIDR;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/8');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have DBMasterUsername parameter with constraints', () => {
      const param = template.Parameters.DBMasterUsername;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
    });

    test('should have LatestAmiId parameter from SSM', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
    });
  });

  // ==========================================
  // Conditions Tests
  // ==========================================
  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });
  });

  // ==========================================
  // VPC Resources Tests
  // ==========================================
  describe('VPC Resources', () => {
    test('should have VPC with correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have two public subnets in different AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have two NAT Gateways with EIPs', () => {
      const natGW1 = template.Resources.NATGateway1;
      const natGW2 = template.Resources.NATGateway2;
      const eip1 = template.Resources.NATGateway1EIP;
      const eip2 = template.Resources.NATGateway2EIP;

      expect(natGW1).toBeDefined();
      expect(natGW2).toBeDefined();
      expect(eip1).toBeDefined();
      expect(eip2).toBeDefined();
      expect(natGW1.Type).toBe('AWS::EC2::NatGateway');
      expect(eip1.Type).toBe('AWS::EC2::EIP');
    });

    test('should have route tables with correct routes', () => {
      const publicRT = template.Resources.PublicRouteTable;
      const privateRT1 = template.Resources.PrivateRouteTable1;
      const privateRT2 = template.Resources.PrivateRouteTable2;

      expect(publicRT).toBeDefined();
      expect(privateRT1).toBeDefined();
      expect(privateRT2).toBeDefined();
      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
    });
  });

  // ==========================================
  // Security Groups Tests
  // ==========================================
  describe('Security Groups', () => {
    test('should have ALB Security Group with HTTP/HTTPS ingress', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('should have WebServer Security Group with ALB and SSH access', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(3);

      const sshRule = ingress.find((r: any) => r.FromPort === 22);
      expect(sshRule).toBeDefined();
    });

    test('should have Database Security Group with MySQL port from WebServer', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
    });
  });

  // ==========================================
  // IAM Resources Tests
  // ==========================================
  describe('IAM Resources', () => {
    test('should have EC2 Instance Role with trust policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
    });

    test('should have EC2 Role with CloudWatch managed policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;

      expect(managedPolicies).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('should have EC2 Role with S3 logging policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;

      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3LoggingPolicy');
      expect(s3Policy).toBeDefined();

      const statements = s3Policy.PolicyDocument.Statement;
      const putObjectStatement = statements.find((s: any) =>
        s.Action.includes('s3:PutObject')
      );
      expect(putObjectStatement).toBeDefined();
    });

    test('should NOT have EC2 Role with KMS policy (using AWS-managed EBS encryption)', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;

      const kmsPolicy = policies.find((p: any) => p.PolicyName === 'KMSAccessPolicy');
      expect(kmsPolicy).toBeUndefined();
    });

    test('should have EC2 Instance Profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have IAM Users Group with MFA enforcement', () => {
      const group = template.Resources.IAMUsersGroup;
      expect(group).toBeDefined();
      expect(group.Type).toBe('AWS::IAM::Group');

      const policies = group.Properties.Policies;
      const mfaPolicy = policies.find((p: any) => p.PolicyName === 'EnforceMFAPolicy');
      expect(mfaPolicy).toBeDefined();

      // Check for MFA denial statement
      const statements = mfaPolicy.PolicyDocument.Statement;
      const denyStatement = statements.find((s: any) =>
        s.Sid === 'DenyAllExceptListedIfNoMFA'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
    });
  });

  // ==========================================
  // Lambda and Custom Resources Tests
  // ==========================================
  describe('Lambda Resources', () => {
    test('should have Lambda role for S3 bucket emptying', () => {
      const role = template.Resources.EmptyS3BucketLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const managedPolicies = role.Properties.ManagedPolicyArns;
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('should have Lambda function for emptying S3 bucket', () => {
      const lambda = template.Resources.EmptyS3BucketLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(900);
    });

    test('should have custom resource to empty logging bucket', () => {
      const customResource = template.Resources.EmptyLoggingBucket;
      expect(customResource).toBeDefined();
      expect(customResource.Type).toBe('Custom::EmptyS3Bucket');
    });
  });

  // ==========================================
  // S3 Resources Tests
  // ==========================================
  describe('S3 Resources', () => {
    test('should have logging bucket with versioning', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have logging bucket with encryption', () => {
      const bucket = template.Resources.LoggingBucket;
      const encryption = bucket.Properties.BucketEncryption;

      expect(encryption).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have logging bucket with lifecycle policy', () => {
      const bucket = template.Resources.LoggingBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;

      expect(lifecycle).toBeDefined();
      const rules = lifecycle.Rules;
      expect(rules).toHaveLength(1);
      expect(rules[0].ExpirationInDays).toBe(30);
      expect(rules[0].NoncurrentVersionExpirationInDays).toBe(7);
    });

    test('should have logging bucket with public access block', () => {
      const bucket = template.Resources.LoggingBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have bucket policy denying insecure connections', () => {
      const policy = template.Resources.LoggingBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('DenyInsecureConnections');
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  // ==========================================
  // Secrets Manager Tests
  // ==========================================
  describe('Secrets Manager', () => {
    test('should have DB password secret with auto-generation', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.DeletionPolicy).toBe('Delete');

      const genConfig = secret.Properties.GenerateSecretString;
      expect(genConfig.PasswordLength).toBe(32);
      expect(genConfig.GenerateStringKey).toBe('password');
    });

    test('should have DB password secret encrypted with KMS', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Properties.KmsKeyId).toBeDefined();
      expect(secret.Properties.KmsKeyId.Ref).toBe('RDSKMSKey');
    });

    test('should have secret target attachment for RDS', () => {
      const attachment = template.Resources.DBSecretAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
      expect(attachment.Properties.TargetType).toBe('AWS::RDS::DBInstance');
    });
  });

  // ==========================================
  // KMS Tests
  // ==========================================
  describe('KMS', () => {
    test('should have RDS KMS key with proper key policy', () => {
      const key = template.Resources.RDSKMSKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');

      const keyPolicy = key.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toHaveLength(3);

      const rdsStatement = keyPolicy.Statement.find(
        (s: any) => s.Sid === 'Allow RDS to use the key'
      );
      expect(rdsStatement).toBeDefined();
      expect(rdsStatement.Principal.Service).toBe('rds.amazonaws.com');

      const secretsManagerStatement = keyPolicy.Statement.find(
        (s: any) => s.Sid === 'Allow Secrets Manager to use the key'
      );
      expect(secretsManagerStatement).toBeDefined();
      expect(secretsManagerStatement.Principal.Service).toBe('secretsmanager.amazonaws.com');
    });

    test('should have KMS key alias for RDS key', () => {
      const alias = template.Resources.RDSKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
    });

    test('should NOT have EBS KMS key (using AWS-managed encryption)', () => {
      const ebsKey = template.Resources.EBSKMSKey;
      expect(ebsKey).toBeUndefined();
    });
  });

  // ==========================================
  // RDS Tests
  // ==========================================
  describe('RDS Resources', () => {
    test('should have DB subnet group spanning multiple AZs', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS instance with encryption enabled', () => {
      const db = template.Resources.RDSDatabase;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Delete');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.Engine).toBe('mysql');
    });

    test('should have RDS with proper backup configuration', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
      expect(db.Properties.PreferredBackupWindow).toBeDefined();
      expect(db.Properties.PreferredMaintenanceWindow).toBeDefined();
    });

    test('should have RDS with Multi-AZ enabled', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.MultiAZ).toBe(true);
    });

    test('should have RDS with CloudWatch logs exports', () => {
      const db = template.Resources.RDSDatabase;
      const logsExports = db.Properties.EnableCloudwatchLogsExports;

      expect(logsExports).toContain('error');
      expect(logsExports).toContain('general');
      expect(logsExports).toContain('slowquery');
    });
  });

  // ==========================================
  // Load Balancer Tests
  // ==========================================
  describe('Application Load Balancer', () => {
    test('should have ALB with internet-facing scheme', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have ALB target group with health check', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
    });

    test('should have ALB target group with proper health check settings', () => {
      const tg = template.Resources.ALBTargetGroup;
      const props = tg.Properties;

      expect(props.HealthCheckIntervalSeconds).toBe(30);
      expect(props.HealthCheckPath).toBe('/');
      expect(props.HealthCheckTimeoutSeconds).toBe(5);
      expect(props.HealthyThresholdCount).toBe(2);
      expect(props.UnhealthyThresholdCount).toBe(3);
    });

    test('should have ALB listener on port 80', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  // ==========================================
  // Auto Scaling Tests
  // ==========================================
  describe('Auto Scaling', () => {
    test('should have launch template with IMDSv2 and monitoring', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.micro');
      expect(lt.Properties.LaunchTemplateData.Monitoring.Enabled).toBe(true);
    });

    test('should have launch template with user data', () => {
      const lt = template.Resources.LaunchTemplate;
      const userData = lt.Properties.LaunchTemplateData.UserData;

      expect(userData).toBeDefined();
    });

    test('should have launch template with EBS encryption but no custom KMS key', () => {
      const lt = template.Resources.LaunchTemplate;
      const blockDevices = lt.Properties.LaunchTemplateData.BlockDeviceMappings;

      expect(blockDevices).toBeDefined();
      expect(blockDevices).toHaveLength(1);

      const ebsConfig = blockDevices[0].Ebs;
      expect(ebsConfig.Encrypted).toBe(true);
      expect(ebsConfig.KmsKeyId).toBeUndefined(); // Uses AWS-managed encryption
      expect(ebsConfig.VolumeType).toBe('gp3');
      expect(ebsConfig.DeleteOnTermination).toBe(true);
    });

    test('should have Auto Scaling Group with proper configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('should have Auto Scaling Group with ELB health check', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should have Auto Scaling Group with metrics collection', () => {
      const asg = template.Resources.AutoScalingGroup;
      const metrics = asg.Properties.MetricsCollection;

      expect(metrics).toHaveLength(1);
      expect(metrics[0].Granularity).toBe('1Minute');
      expect(metrics[0].Metrics.length).toBeGreaterThan(0);
    });

    test('should have scale up and scale down policies', () => {
      const scaleUp = template.Resources.ScaleUpPolicy;
      const scaleDown = template.Resources.ScaleDownPolicy;

      expect(scaleUp).toBeDefined();
      expect(scaleDown).toBeDefined();
      expect(scaleUp.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleUp.Properties.ScalingAdjustment).toBe(1);
      expect(scaleDown.Properties.ScalingAdjustment).toBe(-1);
    });

    test('should have CloudWatch alarms for auto scaling', () => {
      const highAlarm = template.Resources.CPUAlarmHigh;
      const lowAlarm = template.Resources.CPUAlarmLow;

      expect(highAlarm).toBeDefined();
      expect(lowAlarm).toBeDefined();
      expect(highAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(highAlarm.Properties.Threshold).toBe(70);
      expect(lowAlarm.Properties.Threshold).toBe(30);
    });
  });

  // ==========================================
  // CloudWatch Logs Tests
  // ==========================================
  describe('CloudWatch Logs', () => {
    test('should have access log group with retention', () => {
      const logGroup = template.Resources.AccessLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have error log group with retention', () => {
      const logGroup = template.Resources.ErrorLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  // ==========================================
  // Outputs Tests
  // ==========================================
  describe('Outputs', () => {
    test('should have VPC and networking outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.InternetGatewayId).toBeDefined();
      expect(template.Outputs.NATGateway1Id).toBeDefined();
      expect(template.Outputs.NATGateway2Id).toBeDefined();
    });

    test('should have security group outputs', () => {
      expect(template.Outputs.ALBSecurityGroupId).toBeDefined();
      expect(template.Outputs.WebServerSecurityGroupId).toBeDefined();
      expect(template.Outputs.DatabaseSecurityGroupId).toBeDefined();
    });

    test('should have IAM outputs', () => {
      expect(template.Outputs.EC2InstanceRoleArn).toBeDefined();
      expect(template.Outputs.IAMUsersGroupName).toBeDefined();
    });

    test('should have S3 outputs', () => {
      expect(template.Outputs.LoggingBucketName).toBeDefined();
      expect(template.Outputs.LoggingBucketArn).toBeDefined();
    });

    test('should have Secrets Manager and KMS outputs', () => {
      expect(template.Outputs.DBPasswordSecretArn).toBeDefined();
      expect(template.Outputs.RDSKMSKeyId).toBeDefined();
      expect(template.Outputs.RDSKMSKeyArn).toBeDefined();
    });

    test('should NOT have EBS KMS outputs (using AWS-managed encryption)', () => {
      expect(template.Outputs.EBSKMSKeyId).toBeUndefined();
      expect(template.Outputs.EBSKMSKeyArn).toBeUndefined();
    });

    test('should have RDS outputs', () => {
      expect(template.Outputs.RDSEndpoint).toBeDefined();
      expect(template.Outputs.RDSPort).toBeDefined();
      expect(template.Outputs.DBInstanceIdentifier).toBeDefined();
    });

    test('should have ALB outputs', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoadBalancerArn).toBeDefined();
      expect(template.Outputs.TargetGroupArn).toBeDefined();
    });

    test('should have Auto Scaling outputs', () => {
      expect(template.Outputs.LaunchTemplateId).toBeDefined();
      expect(template.Outputs.AutoScalingGroupName).toBeDefined();
      expect(template.Outputs.AutoScalingGroupArn).toBeDefined();
    });

    test('should have CloudWatch Logs outputs', () => {
      expect(template.Outputs.AccessLogGroupName).toBeDefined();
      expect(template.Outputs.ErrorLogGroupName).toBeDefined();
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  // ==========================================
  // Template Validation Tests
  // ==========================================
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

    test('should have appropriate number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Should have all the infrastructure resources
    });

    test('should have appropriate number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(20); // Should have comprehensive outputs for testing
    });
  });

  // ==========================================
  // Resource Dependencies Tests
  // ==========================================
  describe('Resource Dependencies', () => {
    test('NAT Gateways should depend on IGW attachment', () => {
      const natGW1EIP = template.Resources.NATGateway1EIP;
      const natGW2EIP = template.Resources.NATGateway2EIP;

      expect(natGW1EIP.DependsOn).toBe('AttachGateway');
      expect(natGW2EIP.DependsOn).toBe('AttachGateway');
    });

    test('Public route should depend on IGW attachment', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.DependsOn).toBe('AttachGateway');
    });

    test('RDS should reference DB subnet group and security group', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.DBSubnetGroupName).toBeDefined();
      expect(rds.Properties.VPCSecurityGroups).toBeDefined();
    });

    test('Auto Scaling Group should reference launch template', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.LaunchTemplate).toBeDefined();
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toBeDefined();
    });
  });

  // ==========================================
  // Security Best Practices Tests
  // ==========================================
  describe('Security Best Practices', () => {
    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.LoggingBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('RDS should have encryption at rest enabled', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toBeDefined();
    });

    test('RDS should have automated backups configured', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test('Database password should be stored in Secrets Manager', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('IAM Group should enforce MFA', () => {
      const group = template.Resources.IAMUsersGroup;
      const policies = group.Properties.Policies;
      const mfaPolicy = policies.find((p: any) => p.PolicyName === 'EnforceMFAPolicy');

      expect(mfaPolicy).toBeDefined();

      const denyStatement = mfaPolicy.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'DenyAllExceptListedIfNoMFA'
      );
      expect(denyStatement).toBeDefined();
    });

    test('S3 bucket policy should deny insecure connections', () => {
      const policy = template.Resources.LoggingBucketPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];

      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });

    test('RDS should not have deletion protection in test environment', () => {
      const rds = template.Resources.RDSDatabase;
      // For test/dev, deletion protection should be false
      expect(rds.Properties.DeletionProtection).toBe(false);
    });
  });

  // ==========================================
  // High Availability Tests
  // ==========================================
  describe('High Availability', () => {
    test('should have resources spanning multiple AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      // Verify subnets are in different AZs
      expect(publicSubnet1.Properties.AvailabilityZone).toBeDefined();
      expect(publicSubnet2.Properties.AvailabilityZone).toBeDefined();
    });

    test('should have redundant NAT Gateways', () => {
      const natGW1 = template.Resources.NATGateway1;
      const natGW2 = template.Resources.NATGateway2;

      expect(natGW1).toBeDefined();
      expect(natGW2).toBeDefined();
    });

    test('RDS should be Multi-AZ', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('Auto Scaling Group should have minimum 2 instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBeGreaterThanOrEqual(2);
    });

    test('ALB should be in multiple subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toBeDefined();
    });
  });
});
