/**
 * test/tap-stack.unit.test.ts
 *
 * Comprehensive Jest tests for the "highly available, scalable web-application stack"
 * CloudFormation template (TapStack.json only).
 */

import fs from 'fs';
import path from 'path';

/* If the CI pipeline passes ENVIRONMENT, use it; else default to prod */
const environment = process.env.ENVIRONMENT || 'prod';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  /* -------------------------------------------------------------------- */
  /* Load the template (JSON only) once for all test blocks               */
  /* -------------------------------------------------------------------- */
  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');

    if (!fs.existsSync(templatePath)) {
      throw new Error(
        `Template file not found: ${templatePath}. Please ensure TapStack.json exists.`
      );
    }

    try {
      const raw = fs.readFileSync(templatePath, 'utf8');
      template = JSON.parse(raw);
    } catch (error: any) {
      throw new Error(`Failed to parse template JSON: ${error.message}`);
    }
  });

  /* -------------------------------------------------------------------- */
  /* Basic smoke tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('Basic Template Checks', () => {
    test('template is loaded successfully', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('description matches expected value', () => {
      expect(template.Description).toBe(
        'Highly available, scalable web-application stack'
      );
    });

    test('parameters Environment and KeyPairName exist', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.KeyPairName).toBeDefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* Parameter validation                                                  */
  /* -------------------------------------------------------------------- */
  describe('Parameters', () => {
    test('Environment parameter has correct schema', () => {
      const p = template.Parameters.Environment;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('prod');
      expect(p.Description).toBe('Environment name for resource tagging');
    });

    test('KeyPairName parameter has correct schema', () => {
      const p = template.Parameters.KeyPairName;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('');
      expect(p.Description).toBe(
        'Name of an existing EC2 KeyPair to enable SSH access to instances (leave empty to disable SSH access)'
      );
    });

    test('template defines exactly two parameters', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(2);
    });
  });

  /* -------------------------------------------------------------------- */
  /* Conditions validation                                                 */
  /* -------------------------------------------------------------------- */
  describe('Conditions', () => {
    test('HasKeyPair condition exists', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('HasKeyPair condition has correct logic', () => {
      const condition = template.Conditions.HasKeyPair;
      expect(condition).toEqual({
        'Fn::Not': [
          {
            'Fn::Equals': [{ Ref: 'KeyPairName' }, ''],
          },
        ],
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* VPC & Networking Tests                                               */
  /* -------------------------------------------------------------------- */
  describe('VPC & Networking', () => {
    test('VPC has correct configuration', () => {
      const vpc = template.Resources.ProdVpc;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('public subnets are configured correctly', () => {
      const subnet1 = template.Resources.ProdPublicSubnet1;
      const subnet2 = template.Resources.ProdPublicSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);

      // Consistent AZ indices: 0, 1
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
    });

    test('private subnets are configured correctly', () => {
      const subnet1 = template.Resources.ProdPrivateSubnet1;
      const subnet2 = template.Resources.ProdPrivateSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('Internet Gateway is properly configured', () => {
      const igw = template.Resources.ProdInternetGateway;
      const attachment = template.Resources.ProdVpcGatewayAttachment;

      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'ProdVpc' });
      expect(attachment.Properties.InternetGatewayId).toEqual({
        Ref: 'ProdInternetGateway',
      });
    });

    test('NAT Gateways have EIPs and correct subnet placement', () => {
      const natGw1 = template.Resources.ProdNatGateway1;
      const natGw2 = template.Resources.ProdNatGateway2;
      const eip1 = template.Resources.ProdNatGateway1Eip;
      const eip2 = template.Resources.ProdNatGateway2Eip;

      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip2.Type).toBe('AWS::EC2::EIP');
      expect(eip1.Properties.Domain).toBe('vpc');
      expect(eip2.Properties.Domain).toBe('vpc');

      expect(natGw1.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw2.Type).toBe('AWS::EC2::NatGateway');
      expect(natGw1.Properties.SubnetId).toEqual({ Ref: 'ProdPublicSubnet1' });
      expect(natGw2.Properties.SubnetId).toEqual({ Ref: 'ProdPublicSubnet2' });
    });

    test('route tables are properly configured', () => {
      const publicRoute = template.Resources.ProdPublicRoute;
      const privateRoute1 = template.Resources.ProdPrivateRoute1;
      const privateRoute2 = template.Resources.ProdPrivateRoute2;

      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({
        Ref: 'ProdInternetGateway',
      });

      expect(privateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute1.Properties.NatGatewayId).toEqual({
        Ref: 'ProdNatGateway1',
      });
      expect(privateRoute2.Properties.NatGatewayId).toEqual({
        Ref: 'ProdNatGateway2',
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Security Groups Tests                                                */
  /* -------------------------------------------------------------------- */
  describe('Security Groups', () => {
    test('web security group allows traffic from ALB and hardcoded SSH CIDR', () => {
      const webSG = template.Resources.ProdWebSecurityGroup;
      expect(webSG.Type).toBe('AWS::EC2::SecurityGroup');

      const httpRule = webSG.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );
      const sshRule = webSG.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22
      );

      expect(httpRule.SourceSecurityGroupId).toEqual({
        Ref: 'ProdAlbSecurityGroup',
      });
      expect(sshRule.CidrIp).toBe('10.0.0.0/16'); // Fixed to match CFT hardcoded value
    });

    test('ALB security group allows HTTP/HTTPS from internet', () => {
      const albSG = template.Resources.ProdAlbSecurityGroup;
      const ingress = albSG.Properties.SecurityGroupIngress;

      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);

      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('RDS security group restricts access to web servers only', () => {
      const rdsSG = template.Resources.ProdRdsSecurityGroup;
      const ingress = rdsSG.Properties.SecurityGroupIngress[0];

      expect(ingress.FromPort).toBe(3306);
      expect(ingress.ToPort).toBe(3306);
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.SourceSecurityGroupId).toEqual({
        Ref: 'ProdWebSecurityGroup',
      });
    });

    test('security groups have proper descriptions', () => {
      const webSG = template.Resources.ProdWebSecurityGroup;
      const albSG = template.Resources.ProdAlbSecurityGroup;
      const rdsSG = template.Resources.ProdRdsSecurityGroup;

      expect(webSG.Properties.GroupDescription).toBe(
        'Security group for web servers'
      );
      expect(albSG.Properties.GroupDescription).toBe(
        'Security group for Application Load Balancer'
      );
      expect(rdsSG.Properties.GroupDescription).toBe(
        'Security group for RDS MySQL instance'
      );
    });

    test('security groups do not have explicit names', () => {
      const webSG = template.Resources.ProdWebSecurityGroup;
      const albSG = template.Resources.ProdAlbSecurityGroup;
      const rdsSG = template.Resources.ProdRdsSecurityGroup;

      expect(webSG.Properties.GroupName).toBeUndefined();
      expect(albSG.Properties.GroupName).toBeUndefined();
      expect(rdsSG.Properties.GroupName).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* Auto Scaling Group Tests                                             */
  /* -------------------------------------------------------------------- */
  describe('Auto Scaling Group', () => {
    test('launch template has correct configuration', () => {
      const lt = template.Resources.ProdLaunchTemplate;
      const data = lt.Properties.LaunchTemplateData;

      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(data.ImageId).toBe('ami-03cf127a');
      expect(data.InstanceType).toBe('t3.micro');
      expect(data.SecurityGroupIds).toContainEqual({
        Ref: 'ProdWebSecurityGroup',
      });
      expect(data.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['ProdEc2InstanceProfile', 'Arn'],
      });
    });

    test('launch template uses conditional KeyName', () => {
      const lt = template.Resources.ProdLaunchTemplate;
      const keyName = lt.Properties.LaunchTemplateData.KeyName;

      expect(keyName).toEqual({
        'Fn::If': [
          'HasKeyPair',
          { Ref: 'KeyPairName' },
          { Ref: 'AWS::NoValue' },
        ],
      });
    });

    test('auto scaling group has proper capacity and placement', () => {
      const asg = template.Resources.ProdAutoScalingGroup;

      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'ProdPublicSubnet1' },
        { Ref: 'ProdPublicSubnet2' },
      ]);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('auto scaling group has creation policy', () => {
      const asg = template.Resources.ProdAutoScalingGroup;
      expect(asg.CreationPolicy.ResourceSignal.Count).toBe(2);
      expect(asg.CreationPolicy.ResourceSignal.Timeout).toBe('PT10M');
    });

    test('auto scaling group does not have explicit name', () => {
      const asg = template.Resources.ProdAutoScalingGroup;
      expect(asg.Properties.AutoScalingGroupName).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* Load Balancer Tests                                                  */
  /* -------------------------------------------------------------------- */
  describe('Load Balancer', () => {
    test('ALB is internet-facing with correct subnets', () => {
      const alb = template.Resources.ProdAlb;

      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'ProdPublicSubnet1' },
        { Ref: 'ProdPublicSubnet2' },
      ]);
      expect(alb.Properties.SecurityGroups).toContainEqual({
        Ref: 'ProdAlbSecurityGroup',
      });
    });

    test('ALB does not have explicit name', () => {
      const alb = template.Resources.ProdAlb;
      expect(alb.Properties.Name).toBeUndefined();
    });

    test('target group has proper health check configuration', () => {
      const tg = template.Resources.ProdTargetGroup;

      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('target group does not have explicit name', () => {
      const tg = template.Resources.ProdTargetGroup;
      expect(tg.Properties.Name).toBeUndefined();
    });

    test('listener forwards traffic to target group', () => {
      const listener = template.Resources.ProdListener;

      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({
        Ref: 'ProdTargetGroup',
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* RDS Instance Tests                                                   */
  /* -------------------------------------------------------------------- */
  describe('RDS Instance', () => {
    test('RDS has secure configuration', () => {
      const rds = template.Resources.ProdRdsInstance;

      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.DBInstanceClass).toBe('db.t3.small');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.42');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.EnablePerformanceInsights).toBe(false);
    });

    test('RDS uses Secrets Manager for credentials', () => {
      const rds = template.Resources.ProdRdsInstance;
      expect(rds.Properties.MasterUsername).toBe('admin');
      expect(rds.Properties.MasterUserPassword).toEqual({
        'Fn::Sub':
          '{{resolve:secretsmanager:${ProdRdsPassword}:SecretString:password}}',
      });
    });

    test('RDS subnet group spans private subnets', () => {
      const subnetGroup = template.Resources.ProdRdsSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'ProdPrivateSubnet1' },
        { Ref: 'ProdPrivateSubnet2' },
      ]);
    });

    test('RDS has deletion policy for snapshots', () => {
      const rds = template.Resources.ProdRdsInstance;
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('RDS does not have explicit names', () => {
      const rds = template.Resources.ProdRdsInstance;
      const subnetGroup = template.Resources.ProdRdsSubnetGroup;

      expect(rds.Properties.DBInstanceIdentifier).toBeUndefined();
      expect(subnetGroup.Properties.DBSubnetGroupName).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* S3 Bucket Tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('S3 Bucket', () => {
    test('S3 bucket has permissive public access configuration', () => {
      const s3 = template.Resources.ProdS3Bucket;
      const publicAccess = s3.Properties.PublicAccessBlockConfiguration;

      expect(s3.Type).toBe('AWS::S3::Bucket');
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(false);
      expect(publicAccess.RestrictPublicBuckets).toBe(false);
    });

    test('S3 bucket does not have explicit name', () => {
      const s3 = template.Resources.ProdS3Bucket;
      expect(s3.Properties.BucketName).toBeUndefined();
    });

    test('S3 bucket policy allows public read access with correct ARN format', () => {
      const policy = template.Resources.ProdS3BucketPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];

      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal).toBe('*');
      expect(statement.Action).toBe('s3:GetObject');
      expect(statement.Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${ProdS3Bucket}/*',
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* IAM Roles Tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('IAM Roles', () => {
    test('EC2 role has correct assume role policy', () => {
      const role = template.Resources.ProdEc2Role;
      const policy = role.Properties.AssumeRolePolicyDocument;

      expect(role.Type).toBe('AWS::IAM::Role');
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EC2 role has CloudWatch and S3 permissions', () => {
      const role = template.Resources.ProdEc2Role;

      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );

      const s3Policy = role.Properties.Policies[0];
      expect(s3Policy.PolicyName).toBe('prod-s3-access-policy');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain(
        's3:GetObject'
      );
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain(
        's3:PutObject'
      );
      expect(s3Policy.PolicyDocument.Statement[0].Resource).toBe('*');
    });

    test('RDS monitoring role has correct configuration', () => {
      const role = template.Resources.ProdRdsMonitoringRole;

      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('monitoring.rds.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });

    test('IAM roles do not have explicit names', () => {
      const ec2Role = template.Resources.ProdEc2Role;
      const rdsRole = template.Resources.ProdRdsMonitoringRole;

      expect(ec2Role.Properties.RoleName).toBeUndefined();
      expect(rdsRole.Properties.RoleName).toBeUndefined();
    });

    test('instance profile does not have explicit name', () => {
      const profile = template.Resources.ProdEc2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.InstanceProfileName).toBeUndefined();
      expect(profile.Properties.Roles).toEqual([{ Ref: 'ProdEc2Role' }]);
    });
  });

  /* -------------------------------------------------------------------- */
  /* CloudWatch Alarms Tests                                             */
  /* -------------------------------------------------------------------- */
  describe('CloudWatch Alarms', () => {
    test('ASG high CPU alarm triggers scale up', () => {
      const alarm = template.Resources.ProdAsgCpuAlarm;

      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.AlarmActions).toContainEqual({
        Ref: 'ProdScaleUpPolicy',
      });
    });

    test('ASG low CPU alarm triggers scale down', () => {
      const alarm = template.Resources.ProdAsgLowCpuAlarm;

      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Threshold).toBe(20);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm.Properties.AlarmActions).toContainEqual({
        Ref: 'ProdScaleDownPolicy',
      });
    });

    test('RDS CPU alarm monitors database performance', () => {
      const alarm = template.Resources.ProdRdsCpuAlarm;

      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Dimensions[0].Name).toBe('DBInstanceIdentifier');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({
        Ref: 'ProdRdsInstance',
      });
    });

    test('scaling policies have correct configuration', () => {
      const scaleUp = template.Resources.ProdScaleUpPolicy;
      const scaleDown = template.Resources.ProdScaleDownPolicy;

      expect(scaleUp.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleDown.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleUp.Properties.AdjustmentType).toBe('ChangeInCapacity');
      expect(scaleUp.Properties.ScalingAdjustment).toBe(1);
      expect(scaleUp.Properties.Cooldown).toBe(300);

      expect(scaleDown.Properties.ScalingAdjustment).toBe(-1);
      expect(scaleDown.Properties.Cooldown).toBe(300);
    });

    test('CloudWatch alarms do not have explicit names', () => {
      const asgCpuAlarm = template.Resources.ProdAsgCpuAlarm;
      const asgLowCpuAlarm = template.Resources.ProdAsgLowCpuAlarm;
      const rdsCpuAlarm = template.Resources.ProdRdsCpuAlarm;

      expect(asgCpuAlarm.Properties.AlarmName).toBeUndefined();
      expect(asgLowCpuAlarm.Properties.AlarmName).toBeUndefined();
      expect(rdsCpuAlarm.Properties.AlarmName).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* Secrets Manager Tests                                               */
  /* -------------------------------------------------------------------- */
  describe('Secrets Manager', () => {
    test('RDS password secret is properly configured', () => {
      const secret = template.Resources.ProdRdsPassword;

      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Description).toBe(
        'Password for RDS MySQL instance'
      );
      expect(secret.Properties.GenerateSecretString.SecretStringTemplate).toBe(
        '{"username": "admin"}'
      );
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe(
        'password'
      );
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(16);
    });

    test('secrets manager secret does not have explicit name', () => {
      const secret = template.Resources.ProdRdsPassword;
      expect(secret.Properties.Name).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* CloudWatch Log Groups Tests                                         */
  /* -------------------------------------------------------------------- */
  describe('CloudWatch Log Groups', () => {
    test('log groups have correct retention period', () => {
      const webLogGroup = template.Resources.ProdWebLogGroup;
      const rdsLogGroup = template.Resources.ProdRdsLogGroup;

      expect(webLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(rdsLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(webLogGroup.Properties.RetentionInDays).toBe(14);
      expect(rdsLogGroup.Properties.RetentionInDays).toBe(14);
    });

    test('log groups do not have explicit names', () => {
      const webLogGroup = template.Resources.ProdWebLogGroup;
      const rdsLogGroup = template.Resources.ProdRdsLogGroup;

      expect(webLogGroup.Properties.LogGroupName).toBeUndefined();
      expect(rdsLogGroup.Properties.LogGroupName).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* Critical resources present                                           */
  /* -------------------------------------------------------------------- */
  describe('Key Resources', () => {
    const criticalResources = [
      'ProdVpc',
      'ProdPublicSubnet1',
      'ProdPublicSubnet2',
      'ProdPrivateSubnet1',
      'ProdPrivateSubnet2',
      'ProdInternetGateway',
      'ProdVpcGatewayAttachment',
      'ProdNatGateway1',
      'ProdNatGateway2',
      'ProdNatGateway1Eip',
      'ProdNatGateway2Eip',
      'ProdAlb',
      'ProdTargetGroup',
      'ProdListener',
      'ProdAutoScalingGroup',
      'ProdLaunchTemplate',
      'ProdRdsInstance',
      'ProdRdsSubnetGroup',
      'ProdRdsPassword',
      'ProdS3Bucket',
      'ProdS3BucketPolicy',
      'ProdWebSecurityGroup',
      'ProdAlbSecurityGroup',
      'ProdRdsSecurityGroup',
      'ProdEc2Role',
      'ProdEc2InstanceProfile',
      'ProdRdsMonitoringRole',
      'ProdAsgCpuAlarm',
      'ProdAsgLowCpuAlarm',
      'ProdRdsCpuAlarm',
      'ProdScaleUpPolicy',
      'ProdScaleDownPolicy',
      'ProdWebLogGroup',
      'ProdRdsLogGroup',
    ];

    criticalResources.forEach(id =>
      test(`resource ${id} exists`, () => {
        expect(template.Resources[id]).toBeDefined();
      })
    );

    test('template has expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(criticalResources.length);
      expect(resourceCount).toBeLessThanOrEqual(50); // reasonable upper bound
    });
  });

  /* -------------------------------------------------------------------- */
  /* Outputs validation                                                   */
  /* -------------------------------------------------------------------- */
  describe('Outputs', () => {
    const outputKeys = [
      'VPCId',
      'LoadBalancerDNS',
      'RDSEndpoint',
      'S3BucketName',
    ];

    test('template exposes exactly four outputs', () => {
      expect(Object.keys(template.Outputs)).toHaveLength(4);
    });

    outputKeys.forEach(key => {
      test(`output ${key} is defined`, () => {
        expect(template.Outputs[key]).toBeDefined();
      });

      test(`output ${key} has description`, () => {
        expect(template.Outputs[key].Description).toBeDefined();
        expect(typeof template.Outputs[key].Description).toBe('string');
        expect(template.Outputs[key].Description.length).toBeGreaterThan(0);
      });

      test(`export name for ${key} follows AWS::StackName pattern`, () => {
        const exportName = template.Outputs[key].Export.Name;
        expect(exportName).toEqual({
          'Fn::Sub': expect.stringContaining('${AWS::StackName}'),
        });
      });
    });

    test('outputs have meaningful descriptions', () => {
      expect(template.Outputs.VPCId.Description).toContain('VPC');
      expect(template.Outputs.LoadBalancerDNS.Description).toContain('DNS');
      expect(template.Outputs.RDSEndpoint.Description).toContain('endpoint');
      expect(template.Outputs.S3BucketName.Description).toContain('bucket');
    });

    test('outputs reference correct resources', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'ProdVpc' });
      expect(template.Outputs.LoadBalancerDNS.Value).toEqual({
        'Fn::GetAtt': ['ProdAlb', 'DNSName'],
      });
      expect(template.Outputs.RDSEndpoint.Value).toEqual({
        'Fn::GetAtt': ['ProdRdsInstance', 'Endpoint.Address'],
      });
      expect(template.Outputs.S3BucketName.Value).toEqual({
        Ref: 'ProdS3Bucket',
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Overall structure sanity                                             */
  /* -------------------------------------------------------------------- */
  describe('Template Structure', () => {
    test('required top-level sections exist', () => {
      [
        'AWSTemplateFormatVersion',
        'Description',
        'Parameters',
        'Resources',
        'Outputs',
        'Conditions',
      ].forEach(section => expect(template[section]).toBeDefined());
    });

    test('format version is 2010-09-09', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('resource count is comprehensive', () => {
      expect(Object.keys(template.Resources).length).toBeGreaterThan(30);
      expect(Object.keys(template.Resources).length).toBeLessThan(50);
    });

    test('all resources have proper tagging', () => {
      const resourcesWithTags = [
        'ProdVpc',
        'ProdPublicSubnet1',
        'ProdPrivateSubnet1',
        'ProdWebSecurityGroup',
        'ProdAlbSecurityGroup',
        'ProdRdsSecurityGroup',
        'ProdS3Bucket',
        'ProdRdsInstance',
        'ProdEc2Role',
      ];

      resourcesWithTags.forEach(resourceId => {
        const resource = template.Resources[resourceId];
        expect(resource.Properties.Tags).toBeDefined();
        expect(Array.isArray(resource.Properties.Tags)).toBe(true);

        const nameTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Name'
        );
        const envTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Environment'
        );

        expect(nameTag).toBeDefined();
        expect(envTag).toBeDefined();
      });
    });

    test('no resources have explicit names that could cause conflicts', () => {
      const resourcesWithoutExplicitNames = [
        'ProdVpc',
        'ProdS3Bucket',
        'ProdRdsInstance',
        'ProdEc2Role',
        'ProdRdsMonitoringRole',
        'ProdAlb',
        'ProdAutoScalingGroup',
        'ProdWebSecurityGroup',
      ];

      resourcesWithoutExplicitNames.forEach(resourceId => {
        const resource = template.Resources[resourceId];

        // Check for common explicit name properties
        expect(resource.Properties.Name).toBeUndefined();
        expect(resource.Properties.GroupName).toBeUndefined();
        expect(resource.Properties.RoleName).toBeUndefined();
        expect(resource.Properties.BucketName).toBeUndefined();
        expect(resource.Properties.DBInstanceIdentifier).toBeUndefined();
        expect(resource.Properties.AutoScalingGroupName).toBeUndefined();
      });
    });
  });
});
