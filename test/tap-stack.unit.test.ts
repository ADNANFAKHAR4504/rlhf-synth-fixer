import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should enable DNS hostnames and support in VPC', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should tag VPC with Name and Environment', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': 'ProductionVPC-${EnvironmentSuffix}' },
      });
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: 'Production',
      });
    });
  });

  describe('Subnet Configuration', () => {
    test('should create public subnet 1 with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }],
      });
    });

    test('should create public subnet 2 with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }],
      });
    });

    test('should create private subnet 1 with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }],
      });
    });

    test('should create private subnet 2 with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toBe('10.0.4.0/24');
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }],
      });
    });

    test('should enable auto-assign public IP on public subnets', () => {
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('should not enable auto-assign public IP on private subnets', () => {
      expect(
        template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
      expect(
        template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
    });
  });

  describe('Internet Gateway and NAT Gateway Configuration', () => {
    test('should create Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    test('should create Elastic IP for NAT Gateway', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should create NAT Gateway in public subnet', () => {
      const natGateway = template.Resources.NATGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({
        Ref: 'PublicSubnet1',
      });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId'],
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('should create public route table', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create public route to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('should create private route table', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private route to NAT Gateway with dependencies', () => {
      const route = template.Resources.PrivateRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId).toEqual({
        Ref: 'PrivateRouteTable',
      });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
      expect(route.DependsOn).toBe('NATGatewayEIP');
    });

    test('should associate public subnets with public route table', () => {
      const assoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PublicSubnet2RouteTableAssociation;
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(assoc1.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });
      expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(assoc2.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });
    });

    test('should associate private subnets with private route table', () => {
      const assoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(assoc1.Properties.RouteTableId).toEqual({
        Ref: 'PrivateRouteTable',
      });
      expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
      expect(assoc2.Properties.RouteTableId).toEqual({
        Ref: 'PrivateRouteTable',
      });
    });
  });

  describe('Security Groups Configuration', () => {
    test('should create ALB security group with HTTP and HTTPS ingress', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(sg.Properties.SecurityGroupIngress[0]).toEqual({
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        CidrIp: '0.0.0.0/0',
      });
      expect(sg.Properties.SecurityGroupIngress[1]).toEqual({
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
        CidrIp: '0.0.0.0/0',
      });
    });

    test('should create web server security group with no inline ingress rules', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(sg.Properties.SecurityGroupIngress).toBeUndefined();
    });

    test('should create separate ingress rule for web server from ALB', () => {
      const ingress = template.Resources.WebServerSecurityGroupIngressFromALB;
      expect(ingress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ingress.Properties.GroupId).toEqual({
        Ref: 'WebServerSecurityGroup',
      });
      expect(ingress.Properties.IpProtocol).toBe('tcp');
      expect(ingress.Properties.FromPort).toBe(80);
      expect(ingress.Properties.ToPort).toBe(80);
      expect(ingress.Properties.SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });
    });

    test('should create RDS security group allowing MySQL from web servers', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupIngress[0]).toEqual({
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        SourceSecurityGroupId: { Ref: 'WebServerSecurityGroup' },
      });
    });

    test('should configure egress rules for all security groups', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const webSG = template.Resources.WebServerSecurityGroup;
      const rdsSG = template.Resources.RDSSecurityGroup;

      expect(albSG.Properties.SecurityGroupEgress).toEqual([
        { IpProtocol: '-1', CidrIp: '0.0.0.0/0' },
      ]);
      expect(webSG.Properties.SecurityGroupEgress).toEqual([
        { IpProtocol: '-1', CidrIp: '0.0.0.0/0' },
      ]);
      expect(rdsSG.Properties.SecurityGroupEgress).toEqual([
        { IpProtocol: '-1', CidrIp: '0.0.0.0/0' },
      ]);
    });
  });

  describe('IAM Role and Instance Profile Configuration', () => {
    test('should create EC2 instance role with correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0]).toEqual({
        Effect: 'Allow',
        Principal: { Service: 'ec2.amazonaws.com' },
        Action: 'sts:AssumeRole',
      });
    });

    test('should attach CloudWatch and SSM managed policies to EC2 role', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('should create instance profile referencing EC2 role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });
  });

  describe('Launch Template Configuration', () => {
    test('should create launch template with correct instance type', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.micro');
    });

    test('should use SSM parameter for dynamic AMI resolution', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.ImageId).toBe(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64}}'
      );
    });

    test('should attach IAM instance profile to launch template', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toEqual({
        Arn: { 'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'] },
      });
    });

    test('should attach web server security group to launch template', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.SecurityGroupIds).toEqual([
        { Ref: 'WebServerSecurityGroup' },
      ]);
    });

    test('should configure encrypted EBS volume in launch template', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      const blockDevice = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      expect(blockDevice.DeviceName).toBe('/dev/xvda');
      expect(blockDevice.Ebs.VolumeSize).toBe(8);
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
      expect(blockDevice.Ebs.Encrypted).toBe(true);
      expect(blockDevice.Ebs.DeleteOnTermination).toBe(true);
    });

    test('should include user data for Apache installation', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.UserData['Fn::Base64']).toBeDefined();
    });

    test('should configure instance tags in launch template', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      const tagSpec = lt.Properties.LaunchTemplateData.TagSpecifications[0];
      expect(tagSpec.ResourceType).toBe('instance');
      expect(tagSpec.Tags).toContainEqual({
        Key: 'Environment',
        Value: 'Production',
      });
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('should create internet-facing ALB in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' },
      ]);
    });

    test('should attach ALB security group to load balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.SecurityGroups).toEqual([
        { Ref: 'ALBSecurityGroup' },
      ]);
    });

    test('should configure ALB with IPv4 address type', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.IpAddressType).toBe('ipv4');
    });
  });

  describe('Target Group Configuration', () => {
    test('should create target group with HTTP protocol on port 80', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should enable health checks on target group', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckPath).toBe('/');
    });

    test('should configure health check thresholds', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should configure deregistration delay', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.TargetGroupAttributes).toContainEqual({
        Key: 'deregistration_delay.timeout_seconds',
        Value: '30',
      });
    });
  });

  describe('ALB Listener Configuration', () => {
    test('should create HTTP listener on port 80', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('should forward traffic to target group', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.DefaultActions).toHaveLength(1);
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({
        Ref: 'ALBTargetGroup',
      });
    });
  });

  describe('Auto Scaling Group Configuration', () => {
    test('should create ASG with launch template', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({
        Ref: 'WebServerLaunchTemplate',
      });
      expect(asg.Properties.LaunchTemplate.Version).toEqual({
        'Fn::GetAtt': ['WebServerLaunchTemplate', 'LatestVersionNumber'],
      });
    });

    test('should configure ASG capacity settings', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Properties.MinSize).toBe('2');
      expect(asg.Properties.MaxSize).toBe('4');
      expect(asg.Properties.DesiredCapacity).toBe('2');
    });

    test('should deploy ASG across both public subnets', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' },
      ]);
    });

    test('should configure ELB health checks with grace period', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should attach target group to ASG', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Properties.TargetGroupARNs).toEqual([
        { Ref: 'ALBTargetGroup' },
      ]);
    });

    test('should configure ASG tags with propagation', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: 'Production',
        PropagateAtLaunch: true,
      });
    });
  });

  describe('Auto Scaling Policies Configuration', () => {
    test('should create scale up policy with cooldown', () => {
      const policy = template.Resources.ScaleUpPolicy;
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.AdjustmentType).toBe('ChangeInCapacity');
      expect(policy.Properties.ScalingAdjustment).toBe('1');
      expect(policy.Properties.Cooldown).toBe('300');
    });

    test('should create scale down policy with cooldown', () => {
      const policy = template.Resources.ScaleDownPolicy;
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.AdjustmentType).toBe('ChangeInCapacity');
      expect(policy.Properties.ScalingAdjustment).toBe('-1');
      expect(policy.Properties.Cooldown).toBe('300');
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('should create high CPU alarm with correct threshold', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Threshold).toBe('70');
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should configure high CPU alarm to trigger scale up', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Properties.AlarmActions).toEqual([
        { Ref: 'ScaleUpPolicy' },
      ]);
    });

    test('should create low CPU alarm with correct threshold', () => {
      const alarm = template.Resources.CPUAlarmLow;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe('30');
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should configure low CPU alarm to trigger scale down', () => {
      const alarm = template.Resources.CPUAlarmLow;
      expect(alarm.Properties.AlarmActions).toEqual([
        { Ref: 'ScaleDownPolicy' },
      ]);
    });

    test('should configure alarm evaluation period and statistic', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Properties.Period).toBe('300');
      expect(alarm.Properties.EvaluationPeriods).toBe('1');
      expect(alarm.Properties.Statistic).toBe('Average');
    });
  });

  describe('RDS Configuration', () => {
    test('should create DB subnet group across private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
      ]);
    });

    test('should create RDS instance with MySQL engine', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.43');
    });

    test('should configure RDS instance class and storage', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(rds.Properties.AllocatedStorage).toBe('20');
      expect(rds.Properties.StorageType).toBe('gp3');
    });

    test('should enable storage encryption on RDS', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('should enable Multi-AZ for RDS', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should configure RDS as not publicly accessible', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should attach RDS to DB subnet group', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DBSubnetGroupName).toEqual({
        Ref: 'DBSubnetGroup',
      });
    });

    test('should attach RDS security group', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.VPCSecurityGroups).toEqual([
        { Ref: 'RDSSecurityGroup' },
      ]);
    });

    test('should configure backup retention period', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should configure backup and maintenance windows', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PreferredBackupWindow).toBe('03:00-04:00');
      expect(rds.Properties.PreferredMaintenanceWindow).toBe(
        'sun:04:00-sun:05:00'
      );
    });

    test('should enable CloudWatch logs exports', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.EnableCloudwatchLogsExports).toEqual([
        'error',
        'general',
        'slowquery',
      ]);
    });

    test('should use parameter reference for username and Secrets Manager for password', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUsername).toEqual({ Ref: 'DBUsername' });
      expect(rds.Properties.MasterUserPassword).toEqual({
        'Fn::Sub':
          '{{resolve:secretsmanager:prod-db-password-${EnvironmentSuffix}:SecretString:password}}',
      });
    });

    test('should configure deletion policy for RDS', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('should have RDS depend on DBSecret', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DependsOn).toBe('DBSecret');
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should create Secrets Manager secret for database password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should configure secret with environment-specific name', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.Name).toEqual({
        'Fn::Sub': 'prod-db-password-${EnvironmentSuffix}',
      });
    });

    test('should generate random password in secret', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(
        secret.Properties.GenerateSecretString.PasswordLength
      ).toBe(32);
      expect(
        secret.Properties.GenerateSecretString.GenerateStringKey
      ).toBe('password');
    });

    test('should tag secret appropriately', () => {
      const secret = template.Resources.DBSecret;
      const tags = secret.Properties.Tags;
      expect(tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': 'DBSecret-${EnvironmentSuffix}' },
      });
      expect(tags).toContainEqual({
        Key: 'Environment',
        Value: 'Production',
      });
    });
  });

  describe('Parameters Configuration', () => {
    test('should configure DBUsername parameter with validation', () => {
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
      expect(param.MinLength).toBe('1');
      expect(param.MaxLength).toBe('16');
    });

    test('should configure EnvironmentSuffix parameter', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('Outputs Configuration', () => {
    test('should export DBSecretArn output', () => {
      const output = template.Outputs.DBSecretArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'DBSecret' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DBSecretArn',
      });
    });
  });
});
