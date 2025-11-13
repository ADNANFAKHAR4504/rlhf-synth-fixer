import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at ${templatePath}. If your YAML is the source, run 'pipenv run cfn-flip lib/TapStack.yml >lib/TapStack.json' first.`);
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have the correct description', () => {
      expect(template.Description).toBe('Production-grade scalable web application infrastructure with security best practices');
    });

    test('should contain Parameters, Mappings, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have metadata section with CloudFormation interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define all required parameters', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.SSHAllowedIP).toBeDefined();
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.LatestAmiId).toBeDefined();
    });

    test('should have correct parameter types and defaults', () => {
      expect(template.Parameters.EnvironmentSuffix).toEqual(expect.objectContaining({ Type: 'String', Default: 'dev' }));
      expect(template.Parameters.SSHAllowedIP).toEqual(expect.objectContaining({ Type: 'String', Default: '10.0.0.0/32' }));
      expect(template.Parameters.DBUsername).toEqual(expect.objectContaining({ Type: 'String', Default: 'admin', NoEcho: true }));
    });

    test('EnvironmentSuffix should have proper constraints', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });
  });

  describe('Mappings', () => {
    test('should have SubnetConfig mapping with all subnet definitions', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
      expect(template.Mappings.SubnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
      expect(template.Mappings.SubnetConfig.PublicSubnet1.CIDR).toBe('10.0.3.0/24');
      expect(template.Mappings.SubnetConfig.PublicSubnet2.CIDR).toBe('10.0.4.0/24');
      expect(template.Mappings.SubnetConfig.PrivateSubnet1.CIDR).toBe('10.0.5.0/24');
      expect(template.Mappings.SubnetConfig.PrivateSubnet2.CIDR).toBe('10.0.6.0/24');
      expect(template.Mappings.SubnetConfig.DatabaseSubnet1.CIDR).toBe('10.0.7.0/24');
      expect(template.Mappings.SubnetConfig.DatabaseSubnet2.CIDR).toBe('10.0.8.0/24');
    });

    test('should have ELBAccountIds mapping for multiple regions', () => {
      expect(template.Mappings.ELBAccountIds).toBeDefined();
      expect(template.Mappings.ELBAccountIds['us-east-1'].AccountId).toBe('127311923021');
      expect(template.Mappings.ELBAccountIds['us-west-2'].AccountId).toBe('797873946194');
    });
  });

  describe('KMS Resources', () => {
    const kmsKey = 'EncryptionKey';

    test(`${kmsKey} should be defined with key rotation enabled`, () => {
      const resource = template.Resources[kmsKey];
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::KMS::Key');
      expect(resource.Properties.EnableKeyRotation).toBe(true);
      expect(resource.Properties.Description).toBe('KMS key for encrypting production resources');
    });

    test(`${kmsKey} policy should grant admin permissions to root`, () => {
      const policy = template.Resources[kmsKey].Properties.KeyPolicy;
      const rootStatement = policy.Statement.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Principal.AWS['Fn::Sub']).toBe('arn:aws:iam::${AWS::AccountId}:root');
      expect(rootStatement.Action).toBe('kms:*');
      expect(rootStatement.Resource).toBe('*');
    });

    test(`${kmsKey} policy should allow required services to use the key`, () => {
      const policy = template.Resources[kmsKey].Properties.KeyPolicy;
      const servicesStatement = policy.Statement.find((s: any) => s.Sid === 'Allow use of the key for encryption');
      expect(servicesStatement).toBeDefined();
      expect(servicesStatement.Effect).toBe('Allow');
      expect(servicesStatement.Principal.Service).toEqual(expect.arrayContaining([
        's3.amazonaws.com',
        'rds.amazonaws.com',
        'logs.amazonaws.com',
        'secretsmanager.amazonaws.com'
      ]));
      expect(servicesStatement.Action).toEqual(expect.arrayContaining([
        'kms:Decrypt',
        'kms:GenerateDataKey',
        'kms:CreateGrant'
      ]));
    });

    test('EncryptionKeyAlias should be defined with correct naming', () => {
      const alias = template.Resources.EncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({ 'Fn::Sub': 'alias/production-encryption-${AWS::StackName}-${EnvironmentSuffix}' });
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'EncryptionKey' });
    });
  });

  describe('Networking and Security', () => {
    test('should create a VPC with DNS support', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ 'Fn::FindInMap': ['SubnetConfig', 'VPC', 'CIDR'] });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create subnets in multiple availability zones', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet2).toBeDefined();
    });

    test('all subnets should reference the created VPC', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1.Properties;
      const privateSubnet1 = template.Resources.PrivateSubnet1.Properties;
      const databaseSubnet1 = template.Resources.DatabaseSubnet1.Properties;
      expect(publicSubnet1.VpcId).toEqual({ Ref: 'VPC' });
      expect(privateSubnet1.VpcId).toEqual({ Ref: 'VPC' });
      expect(databaseSubnet1.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1.Properties;
      const publicSubnet2 = template.Resources.PublicSubnet2.Properties;
      expect(publicSubnet1.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have Internet Gateway and NAT Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGatewayEIP).toBeDefined();
    });

    test('NAT Gateway should be in public subnet with EIP', () => {
      const natGateway = template.Resources.NATGateway.Properties;
      expect(natGateway.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGateway.AllocationId).toEqual({ 'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId'] });
    });

    test('should have separate route tables for public, private, and database subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.DatabaseRouteTable).toBeDefined();
    });

    test('all route tables should reference the created VPC', () => {
      const publicRT = template.Resources.PublicRouteTable.Properties;
      const privateRT = template.Resources.PrivateRouteTable.Properties;
      const databaseRT = template.Resources.DatabaseRouteTable.Properties;
      expect(publicRT.VpcId).toEqual({ Ref: 'VPC' });
      expect(privateRT.VpcId).toEqual({ Ref: 'VPC' });
      expect(databaseRT.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('public route table should route to Internet Gateway', () => {
      const publicRoute = template.Resources.PublicRoute.Properties;
      expect(publicRoute.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(publicRoute.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('private route table should route to NAT Gateway', () => {
      const privateRoute = template.Resources.PrivateRoute.Properties;
      expect(privateRoute.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
      expect(privateRoute.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });

    test('all security groups should reference the created VPC', () => {
      const albSG = template.Resources.ALBSecurityGroup.Properties;
      const webSG = template.Resources.WebServerSecurityGroup.Properties;
      const dbSG = template.Resources.DatabaseSecurityGroup.Properties;
      expect(albSG.VpcId).toEqual({ Ref: 'VPC' });
      expect(webSG.VpcId).toEqual({ Ref: 'VPC' });
      expect(dbSG.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('ALBSecurityGroup should allow HTTP/HTTPS from the internet', () => {
      const sg = template.Resources.ALBSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toEqual(expect.arrayContaining([
        expect.objectContaining({ CidrIp: '0.0.0.0/0', FromPort: 80, ToPort: 80 }),
        expect.objectContaining({ CidrIp: '0.0.0.0/0', FromPort: 443, ToPort: 443 })
      ]));
    });

    test('WebServerSecurityGroup should allow traffic from ALB and SSH from allowed IP', () => {
      const sg = template.Resources.WebServerSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toEqual(expect.arrayContaining([
        expect.objectContaining({ SourceSecurityGroupId: { Ref: 'ALBSecurityGroup' }, FromPort: 80 }),
        expect.objectContaining({ CidrIp: { Ref: 'SSHAllowedIP' }, FromPort: 22, ToPort: 22 })
      ]));
    });

    test('DatabaseSecurityGroup should only allow MySQL traffic from WebServerSecurityGroup', () => {
      const sg = template.Resources.DatabaseSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toEqual([
        expect.objectContaining({ SourceSecurityGroupId: { Ref: 'WebServerSecurityGroup' }, FromPort: 3306, ToPort: 3306 })
      ]);
    });
  });

  describe('S3 Buckets', () => {
    test('ApplicationBucket should have versioning and public access block', () => {
      const bucket = template.Resources.ApplicationBucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.PublicAccessBlockConfiguration).toEqual({
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      });
    });

    test('ApplicationBucket should use KMS encryption', () => {
      const bucket = template.Resources.ApplicationBucket.Properties;
      const encryption = bucket.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'EncryptionKey' });
    });

    test('ApplicationBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.ApplicationBucket.Properties;
      expect(bucket.LifecycleConfiguration).toBeDefined();
      expect(bucket.LifecycleConfiguration.Rules[0].Id).toBe('DeleteOldVersions');
      expect(bucket.LifecycleConfiguration.Rules[0].Status).toBe('Enabled');
      expect(bucket.LifecycleConfiguration.Rules[0].NoncurrentVersionExpirationInDays).toBe(30);
    });

    test('ELBLogsBucket should use AES256 encryption', () => {
      const bucket = template.Resources.ELBLogsBucket.Properties;
      const encryption = bucket.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('ELBLogsBucket should have lifecycle policy for log retention', () => {
      const bucket = template.Resources.ELBLogsBucket.Properties;
      expect(bucket.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });

    test('ELBLogsBucketPolicy should allow ELB service to write logs', () => {
      const policy = template.Resources.ELBLogsBucketPolicy.Properties;
      expect(policy.Bucket).toEqual({ Ref: 'ELBLogsBucket' });
      const statement = policy.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('AllowELBLogDelivery');
      expect(statement.Action).toBe('s3:PutObject');
    });
  });

  describe('RDS Database', () => {
    test('RDSDatabase should be Multi-AZ and encrypted', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.43');
    });

    test('RDSDatabase should have backup configuration', () => {
      const db = template.Resources.RDSDatabase.Properties;
      expect(db.BackupRetentionPeriod).toBe(7);
      expect(db.PreferredBackupWindow).toBe('03:00-04:00');
      expect(db.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
    });

    test('RDSDatabase should have CloudWatch Logs exports enabled', () => {
      const db = template.Resources.RDSDatabase.Properties;
      expect(db.EnableCloudwatchLogsExports).toEqual(expect.arrayContaining(['error', 'general', 'slowquery']));
    });

    test('RDSDatabase should not be publicly accessible', () => {
      const db = template.Resources.RDSDatabase.Properties;
      expect(db.PubliclyAccessible).toBe(false);
    });

    test('RDSDatabase should have deletion policies', () => {
      const db = template.Resources.RDSDatabase;
      expect(db.DeletionPolicy).toBe('Delete');
      expect(db.UpdateReplacePolicy).toBe('Delete');
    });

    test('DBSubnetGroup should use database subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup.Properties;
      expect(subnetGroup.SubnetIds).toEqual([
        { Ref: 'DatabaseSubnet1' },
        { Ref: 'DatabaseSubnet2' }
      ]);
    });

    test('DatabaseSecret should be defined with rotation', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.SecretRotationLambda).toBeDefined();
      expect(template.Resources.SecretRotationLambda.Properties.RotationRules.AutomaticallyAfterDays).toBe(30);
    });
  });

  describe('Load Balancer and Auto Scaling', () => {
    test('ApplicationLoadBalancer should be internet-facing in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' }
      ]);
    });

    test('ApplicationLoadBalancer should have access logs enabled', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      const accessLogsEnabled = alb.LoadBalancerAttributes.find((attr: any) => attr.Key === 'access_logs.s3.enabled');
      const bucket = alb.LoadBalancerAttributes.find((attr: any) => attr.Key === 'access_logs.s3.bucket');
      expect(accessLogsEnabled.Value).toBe('true');
      expect(bucket.Value).toEqual({ Ref: 'ELBLogsBucket' });
    });

    test('ALBTargetGroup should have health check configured', () => {
      const tg = template.Resources.ALBTargetGroup.Properties;
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(3);
    });

    test('EC2LaunchTemplate should use SSM parameter for AMI', () => {
      const lt = template.Resources.EC2LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(lt.InstanceType).toBe('t3.medium');
    });

    test('EC2LaunchTemplate should have IAM instance profile and security group', () => {
      const lt = template.Resources.EC2LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.IamInstanceProfile.Arn).toEqual({ 'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'] });
      expect(lt.SecurityGroupIds).toEqual([{ Ref: 'WebServerSecurityGroup' }]);
    });

    test('ALBTargetGroup should reference the created VPC', () => {
      const tg = template.Resources.ALBTargetGroup.Properties;
      expect(tg.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('AutoScalingGroup should use private subnets', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.VPCZoneIdentifier).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('AutoScalingGroup should have correct capacity configuration', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
    });

    test('should have scaling policies defined', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      expect(template.Resources.ScaleUpPolicy.Properties.ScalingAdjustment).toBe(1);
      expect(template.Resources.ScaleDownPolicy.Properties.ScalingAdjustment).toBe(-1);
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('EC2InstanceRole should have CloudWatch managed policy', () => {
      const role = template.Resources.EC2InstanceRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2InstanceRole should have S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole.Properties;
      const s3Policy = role.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      const statements = s3Policy.PolicyDocument.Statement;

      const s3GetPut = statements.find((s: any) => s.Action.includes('s3:GetObject'));
      expect(s3GetPut).toBeDefined();
      expect(s3GetPut.Action).toEqual(expect.arrayContaining(['s3:GetObject', 's3:PutObject']));
    });

    test('EC2InstanceRole should have CloudWatch logs permissions', () => {
      const role = template.Resources.EC2InstanceRole.Properties;
      const s3Policy = role.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      const cwStatement = s3Policy.PolicyDocument.Statement.find((s: any) =>
        s.Action && s.Action.includes && s.Action.includes('logs:CreateLogStream')
      );
      expect(cwStatement).toBeDefined();
      expect(cwStatement.Action).toEqual(expect.arrayContaining([
        'cloudwatch:PutMetricData',
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ]));
    });

    test('LambdaExecutionRole should have VPC access execution role', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('LambdaExecutionRole should have S3 and KMS permissions', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const policy = role.Policies.find((p: any) => p.PolicyName === 'LambdaS3Access');
      expect(policy).toBeDefined();
      const statements = policy.PolicyDocument.Statement;

      const s3Statement = statements.find((s: any) => s.Action.includes('s3:GetObject'));
      expect(s3Statement).toBeDefined();

      const kmsStatement = statements.find((s: any) => s.Action.includes('kms:Decrypt'));
      expect(kmsStatement).toBeDefined();
    });

    test('CrossAccountRole should exist with ReadOnly access', () => {
      const role = template.Resources.CrossAccountRole;
      expect(role).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/ReadOnlyAccess');
    });
  });

  describe('Lambda Function', () => {
    test('ProcessingLambda should be configured with VPC', () => {
      const lambda = template.Resources.ProcessingLambda.Properties;
      expect(lambda.Runtime).toBe('python3.9');
      expect(lambda.Handler).toBe('index.handler');
      expect(lambda.VpcConfig).toBeDefined();
      expect(lambda.VpcConfig.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });

    test('ProcessingLambda should have environment variables', () => {
      const lambda = template.Resources.ProcessingLambda.Properties;
      expect(lambda.Environment.Variables.BUCKET_NAME).toEqual({ Ref: 'ApplicationBucket' });
      expect(lambda.Environment.Variables.ENVIRONMENT).toBe('Production');
      expect(lambda.Environment.Variables.DB_ENDPOINT).toEqual({ 'Fn::GetAtt': ['RDSDatabase', 'Endpoint.Address'] });
    });

    test('ProcessingLambda should have invoke permission', () => {
      const permission = template.Resources.ProcessingLambdaInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('secretsmanager.amazonaws.com');
    });
  });

  describe('Monitoring and Alarms', () => {
    test('HighCPUAlarm should trigger at 85% CPU', () => {
      const alarm = template.Resources.HighCPUAlarm.Properties;
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(85);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.EvaluationPeriods).toBe(2);
    });

    test('HighCPUAlarm should trigger scale up and SNS notification', () => {
      const alarm = template.Resources.HighCPUAlarm.Properties;
      expect(alarm.AlarmActions).toEqual(expect.arrayContaining([
        { Ref: 'ScaleUpPolicy' },
        { Ref: 'SNSTopic' }
      ]));
    });

    test('LowCPUAlarm should trigger at 30% CPU', () => {
      const alarm = template.Resources.LowCPUAlarm.Properties;
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(30);
      expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('SNSTopic should be defined for alarms', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.DisplayName).toBe('Production Environment Alarms');
    });

    test('MonitoringDashboard should be defined', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('RDSLogGroup should have 30 day retention', () => {
      const logGroup = template.Resources.RDSLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('EC2 KeyPair', () => {
    test('EC2KeyPair should be defined with proper naming', () => {
      const keyPair = template.Resources.EC2KeyPair;
      expect(keyPair).toBeDefined();
      expect(keyPair.Type).toBe('AWS::EC2::KeyPair');
      expect(keyPair.Properties.KeyName).toEqual({ 'Fn::Sub': '${AWS::StackName}-${EnvironmentSuffix}-keypair' });
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ApplicationLoadBalancerDNS',
        'ApplicationDataBucketName',
        'DBEndpoint',
        'KMSKeyId',
        'CloudTrailName',
        'AlarmTopicArn',
        'LoadBalancerURL',
        'LambdaFunctionArn'
      ];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('VPCId should output VPC ID', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('ApplicationLoadBalancerDNS should output ALB DNS name', () => {
      const output = template.Outputs.ApplicationLoadBalancerDNS;
      expect(output.Description).toBe('Application Load Balancer DNS Name');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('ApplicationDataBucketName should reference ApplicationBucket', () => {
      const output = template.Outputs.ApplicationDataBucketName;
      expect(output.Description).toBe('Application Data S3 Bucket Name');
      expect(output.Value).toEqual({ Ref: 'ApplicationBucket' });
    });

    test('DBEndpoint should output database endpoint', () => {
      const output = template.Outputs.DBEndpoint;
      expect(output.Description).toBe('Database Endpoint');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['RDSDatabase', 'Endpoint.Address'] });
    });

    test('KMSKeyId should output encryption key ID', () => {
      const output = template.Outputs.KMSKeyId;
      expect(output.Description).toBe('KMS Key ID for encryption');
      expect(output.Value).toEqual({ Ref: 'EncryptionKey' });
    });

    test('CloudTrailName should be defined', () => {
      const output = template.Outputs.CloudTrailName;
      expect(output.Description).toContain('CloudTrail');
      expect(output.Value).toBeDefined();
    });

    test('AlarmTopicArn should output SNS topic ARN', () => {
      const output = template.Outputs.AlarmTopicArn;
      expect(output.Description).toBe('SNS Topic ARN for CloudWatch Alarms');
      expect(output.Value).toEqual({ Ref: 'SNSTopic' });
    });

    test('LoadBalancerURL should output ALB URL', () => {
      const output = template.Outputs.LoadBalancerURL;
      expect(output.Description).toBe('URL of the Application Load Balancer');
      expect(output.Value).toEqual({ 'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}' });
    });

    test('LambdaFunctionArn should output Lambda ARN', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('ARN of the Lambda function');
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ProcessingLambda', 'Arn'] });
    });
  });
});