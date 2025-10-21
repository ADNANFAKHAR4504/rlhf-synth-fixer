import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Comprehensive Cloud Environment', () => {
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
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    test('should create VPC with DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create VPC with correct tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;

      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'VPC-${EnvironmentSuffix}' });

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });

      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      expect(projectTag.Value).toBe('ComprehensiveCloudEnvironment');
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should create Internet Gateway with correct type', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should attach Internet Gateway to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Public Subnet Configuration', () => {
    test('should create public subnet 1 with correct CIDR and AZ', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnet 2 with correct CIDR and AZ', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet2CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnet 1 in VPC', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create public subnet 2 in VPC', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Private Subnet Configuration', () => {
    test('should create private subnet 1 with correct CIDR and AZ', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnet 2 with correct CIDR and AZ', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet2CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnet 1 in VPC', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private subnet 2 in VPC', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Dual NAT Gateway Configuration', () => {
    test('should create NAT Gateway 1 EIP with vpc domain', () => {
      const eip = template.Resources.NATGatewayEIP1;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should create NAT Gateway 2 EIP with vpc domain', () => {
      const eip = template.Resources.NATGatewayEIP2;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should create NAT Gateway 1 in public subnet 1', () => {
      const natGateway = template.Resources.NATGateway1;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP1', 'AllocationId']
      });
    });

    test('should create NAT Gateway 2 in public subnet 2', () => {
      const natGateway = template.Resources.NATGateway2;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP2', 'AllocationId']
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('should create public route table in VPC', () => {
      const routeTable = template.Resources.PublicRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create public route to internet gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('should associate public subnet 1 with public route table', () => {
      const association = template.Resources.PublicSubnet1RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('should associate public subnet 2 with public route table', () => {
      const association = template.Resources.PublicSubnet2RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('should create private route table 1 in VPC', () => {
      const routeTable = template.Resources.PrivateRouteTable1;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private route table 2 in VPC', () => {
      const routeTable = template.Resources.PrivateRouteTable2;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private route 1 to NAT gateway 1', () => {
      const route = template.Resources.PrivateRoute1;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
    });

    test('should create private route 2 to NAT gateway 2', () => {
      const route = template.Resources.PrivateRoute2;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway2' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
    });

    test('should associate private subnet 1 with private route table 1', () => {
      const association = template.Resources.PrivateSubnet1RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable1' });
    });

    test('should associate private subnet 2 with private route table 2', () => {
      const association = template.Resources.PrivateSubnet2RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable2' });
    });
  });

  describe('Web Server Security Group Configuration', () => {
    test('should create web server security group in VPC', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create web server security group with HTTP and HTTPS access', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const httpRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.Description).toBe('HTTP access from anywhere');

      const httpsRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.FromPort).toBe(443);
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.Description).toBe('HTTPS access from anywhere');
    });

    test('should create web server security group with all outbound traffic allowed', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const egressRule = sg.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe('-1');
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
      expect(egressRule.Description).toBe('Allow all outbound traffic');
    });
  });

  describe('RDS Security Group Configuration', () => {
    test('should create RDS security group in VPC', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create RDS security group allowing MySQL only from web servers', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const mysqlRule = sg.Properties.SecurityGroupIngress[0];
      expect(mysqlRule.IpProtocol).toBe('tcp');
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
      expect(mysqlRule.Description).toBe('MySQL access from web servers');
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should create DB secret for RDS credentials', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should create DB secret with auto-generated password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.SecretStringTemplate).toBe('{"username": "admin"}');
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBe('"@/\\');
      expect(secret.Properties.GenerateSecretString.RequireEachIncludedType).toBe(true);
    });

    test('should create DB secret with correct name and description', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.Name).toEqual({ 'Fn::Sub': 'RDS-Credentials-${EnvironmentSuffix}-${AWS::StackName}' });
      expect(secret.Properties.Description).toBe('RDS MySQL database master credentials');
    });
  });

  describe('IAM Role Configuration', () => {
    test('should create EC2 IAM role with correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create EC2 IAM role with CloudWatch and SSM managed policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toHaveLength(2);
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('should create EC2 IAM role with S3 and Secrets Manager access policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.Policies).toHaveLength(2);

      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3ReadWriteAccess');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Version).toBe('2012-10-17');
      expect(s3Policy.PolicyDocument.Statement).toHaveLength(1);

      const s3Statement = s3Policy.PolicyDocument.Statement[0];
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).toContain('s3:DeleteObject');
      expect(s3Statement.Action).toContain('s3:ListBucket');

      const smPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'SecretsManagerReadAccess');
      expect(smPolicy).toBeDefined();
      expect(smPolicy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
      expect(smPolicy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:DescribeSecret');
      expect(smPolicy.PolicyDocument.Statement[0].Resource).toEqual({ Ref: 'DBSecret' });
    });

    test('should create instance profile referencing EC2 role', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toHaveLength(1);
      expect(instanceProfile.Properties.Roles[0]).toEqual({ Ref: 'EC2InstanceRole' });
    });
  });

  describe('Launch Template Configuration', () => {
    test('should create launch template with correct AMI and instance type', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(launchTemplate.Properties.LaunchTemplateData.InstanceType).toEqual({ Ref: 'EC2InstanceType' });
    });

    test('should create launch template with IAM instance profile', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn']
      });
    });

    test('should create launch template with web server security group', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.SecurityGroupIds).toHaveLength(1);
      expect(launchTemplate.Properties.LaunchTemplateData.SecurityGroupIds[0]).toEqual({
        Ref: 'WebServerSecurityGroup'
      });
    });

    test('should create launch template with monitoring enabled', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.Monitoring.Enabled).toBe(true);
    });

    test('should create launch template with correct UserData script', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.UserData).toBeDefined();
      expect(launchTemplate.Properties.LaunchTemplateData.UserData['Fn::Base64']).toBeDefined();

      const userData = launchTemplate.Properties.LaunchTemplateData.UserData['Fn::Base64'];
      const userDataString = userData['Fn::Join'][1].join('');
      expect(userDataString).toContain('yum update -y');
      expect(userDataString).toContain('yum install -y httpd mysql jq amazon-cloudwatch-agent');
      expect(userDataString).toContain('systemctl start httpd');
      expect(userDataString).toContain('systemctl enable httpd');
    });
  });

  describe('Auto Scaling Group Configuration', () => {
    test('should create Auto Scaling Group with correct launch template', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
      expect(asg.Properties.LaunchTemplate.Version).toEqual({ 'Fn::GetAtt': ['LaunchTemplate', 'LatestVersionNumber'] });
    });

    test('should create Auto Scaling Group with correct size configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toEqual({ Ref: 'MinSize' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'MaxSize' });
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'MinSize' });
    });

    test('should create Auto Scaling Group spanning both public subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.VPCZoneIdentifier[0]).toEqual({ Ref: 'PublicSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier[1]).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should create Auto Scaling Group with EC2 health check', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('EC2');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });
  });

  describe('Auto Scaling Policies Configuration', () => {
    test('should create scale up policy with correct adjustment', () => {
      const policy = template.Resources.ScaleUpPolicy;
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.AdjustmentType).toBe('ChangeInCapacity');
      expect(policy.Properties.ScalingAdjustment).toBe(1);
      expect(policy.Properties.Cooldown).toBe(300);
      expect(policy.Properties.AutoScalingGroupName).toEqual({ Ref: 'AutoScalingGroup' });
    });

    test('should create scale down policy with correct adjustment', () => {
      const policy = template.Resources.ScaleDownPolicy;
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.AdjustmentType).toBe('ChangeInCapacity');
      expect(policy.Properties.ScalingAdjustment).toBe(-1);
      expect(policy.Properties.Cooldown).toBe(300);
      expect(policy.Properties.AutoScalingGroupName).toEqual({ Ref: 'AutoScalingGroup' });
    });
  });

  describe('CloudWatch Alarms for Auto Scaling', () => {
    test('should create CPU high alarm with correct configuration', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create CPU high alarm monitoring Auto Scaling Group', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('AutoScalingGroupName');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'AutoScalingGroup' });
      expect(alarm.Properties.AlarmActions).toHaveLength(1);
      expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'ScaleUpPolicy' });
    });

    test('should create CPU low alarm with correct configuration', () => {
      const alarm = template.Resources.CPUAlarmLow;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(30);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should create CPU low alarm monitoring Auto Scaling Group', () => {
      const alarm = template.Resources.CPUAlarmLow;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('AutoScalingGroupName');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'AutoScalingGroup' });
      expect(alarm.Properties.AlarmActions).toHaveLength(1);
      expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'ScaleDownPolicy' });
    });
  });

  describe('DB Subnet Group Configuration', () => {
    test('should create DB subnet group spanning both private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetGroup.Properties.SubnetIds[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should create DB subnet group with correct description', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.DBSubnetGroupDescription).toBe('Subnet group for RDS instance');
    });
  });

  describe('RDS Instance Configuration', () => {
    test('should create RDS instance with correct engine configuration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.43');
      expect(rds.Properties.DBInstanceClass).toEqual({ Ref: 'DBInstanceClass' });
    });

    test('should create RDS instance with credentials from Secrets Manager', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUsername).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      });
      expect(rds.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      });
      expect(rds.Properties.DBName).toEqual({ Ref: 'DBName' });
    });

    test('should create RDS instance with storage encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.StorageType).toBe('gp3');
      expect(rds.Properties.AllocatedStorage).toBe('20');
    });

    test('should create RDS instance with Multi-AZ deployment enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should create RDS instance not publicly accessible', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should create RDS instance with 7-day backup retention', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PreferredBackupWindow).toBe('03:00-04:00');
    });

    test('should create RDS instance with correct maintenance window', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PreferredMaintenanceWindow).toBe('mon:04:00-mon:05:00');
    });

    test('should create RDS instance in DB subnet group', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });

    test('should create RDS instance with RDS security group', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.VPCSecurityGroups).toHaveLength(1);
      expect(rds.Properties.VPCSecurityGroups[0]).toEqual({ Ref: 'RDSSecurityGroup' });
    });

    test('should create RDS instance with CloudWatch Logs exports enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.EnableCloudwatchLogsExports).toHaveLength(3);
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('should create RDS instance with enhanced monitoring enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MonitoringInterval).toBe(60);
      expect(rds.Properties.MonitoringRoleArn).toEqual({
        'Fn::GetAtt': ['RDSMonitoringRole', 'Arn']
      });
    });

    test('should create RDS instance with Delete deletion policy', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
    });
  });

  describe('RDS Monitoring Role Configuration', () => {
    test('should create RDS monitoring role with correct assume role policy', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('monitoring.rds.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create RDS monitoring role with enhanced monitoring managed policy', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role.Properties.ManagedPolicyArns).toHaveLength(1);
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });
  });

  describe('RDS CloudWatch Alarm Configuration', () => {
    test('should create RDS CPU alarm with correct configuration', () => {
      const alarm = template.Resources.RDSCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create RDS CPU alarm monitoring RDS instance', () => {
      const alarm = template.Resources.RDSCPUAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('DBInstanceIdentifier');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'RDSInstance' });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 website bucket with correct name format', () => {
      const bucket = template.Resources.S3WebsiteBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'website-${AWS::AccountId}-${EnvironmentSuffix}'
      });
    });

    test('should create S3 bucket with website configuration', () => {
      const bucket = template.Resources.S3WebsiteBucket;
      expect(bucket.Properties.WebsiteConfiguration).toBeDefined();
      expect(bucket.Properties.WebsiteConfiguration.IndexDocument).toBe('index.html');
      expect(bucket.Properties.WebsiteConfiguration.ErrorDocument).toBe('error.html');
    });

    test('should create S3 bucket with versioning enabled', () => {
      const bucket = template.Resources.S3WebsiteBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should create S3 bucket with public access allowed for website hosting', () => {
      const bucket = template.Resources.S3WebsiteBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(false);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(false);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(false);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(false);
    });

    test('should create S3 bucket with default deletion policy', () => {
      const bucket = template.Resources.S3WebsiteBucket;
      expect(bucket.DeletionPolicy).toBeUndefined();
      expect(bucket.UpdateReplacePolicy).toBeUndefined();
    });
  });

  describe('S3 Bucket Policy Configuration', () => {
    test('should create S3 bucket policy allowing public read access', () => {
      const policy = template.Resources.S3BucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toEqual({ Ref: 'S3WebsiteBucket' });

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Sid).toBe('PublicReadGetObject');
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal).toBe('*');
      expect(statement.Action).toBe('s3:GetObject');
      expect(statement.Resource).toEqual({ 'Fn::Sub': '${S3WebsiteBucket.Arn}/*' });
    });
  });

  describe('WAF WebACL Configuration', () => {
    test('should create WAF WebACL with Regional scope', () => {
      const webACL = template.Resources.WebACL;
      expect(webACL.Type).toBe('AWS::WAFv2::WebACL');
      expect(webACL.Properties.Scope).toBe('REGIONAL');
      expect(webACL.Properties.DefaultAction.Allow).toEqual({});
    });

    test('should create WAF WebACL with rate limiting rule', () => {
      const webACL = template.Resources.WebACL;
      const rateLimitRule = webACL.Properties.Rules.find((r: any) => r.Name === 'RateLimitRule');

      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Priority).toBe(1);
      expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
      expect(rateLimitRule.Statement.RateBasedStatement.AggregateKeyType).toBe('IP');
      expect(rateLimitRule.Action.Block).toEqual({});
      expect(rateLimitRule.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
    });

    test('should create WAF WebACL with AWS managed common rule set', () => {
      const webACL = template.Resources.WebACL;
      const managedRule = webACL.Properties.Rules.find((r: any) => r.Name === 'AWSManagedRulesCommonRuleSet');

      expect(managedRule).toBeDefined();
      expect(managedRule.Priority).toBe(2);
      expect(managedRule.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
      expect(managedRule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesCommonRuleSet');
      expect(managedRule.OverrideAction.None).toEqual({});
    });

    test('should create WAF WebACL with visibility config', () => {
      const webACL = template.Resources.WebACL;
      expect(webACL.Properties.VisibilityConfig.SampledRequestsEnabled).toBe(true);
      expect(webACL.Properties.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
    });
  });

  describe('Route 53 Configuration', () => {
    test('should create Route 53 hosted zone with correct domain name', () => {
      const hostedZone = template.Resources.Route53HostedZone;
      expect(hostedZone.Type).toBe('AWS::Route53::HostedZone');
      expect(hostedZone.Properties.Name).toEqual({ Ref: 'DomainName' });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('should create VPC Flow Log role with correct assume role policy', () => {
      const role = template.Resources.VPCFlowLogRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create VPC Flow Log role with CloudWatch Logs permissions', () => {
      const role = template.Resources.VPCFlowLogRole;
      const policy = role.Properties.Policies[0];

      expect(policy.PolicyName).toBe('CloudWatchLogPolicy');
      expect(policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('should create VPC Flow Log Group with 7-day retention', () => {
      const logGroup = template.Resources.VPCFlowLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/vpc/${EnvironmentSuffix}-${AWS::StackName}'
      });
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should create VPC Flow Log with correct configuration', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.DeliverLogsPermissionArn).toEqual({
        'Fn::GetAtt': ['VPCFlowLogRole', 'Arn']
      });
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.LogGroupName).toEqual({ Ref: 'VPCFlowLogGroup' });
      expect(flowLog.Properties.ResourceId).toEqual({ Ref: 'VPC' });
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });
  });

  describe('AWS Backup Configuration', () => {
    test('should create backup vault with correct name', () => {
      const vault = template.Resources.BackupVault;
      expect(vault.Type).toBe('AWS::Backup::BackupVault');
      expect(vault.Properties.BackupVaultName).toEqual({
        'Fn::Sub': 'BackupVault-${EnvironmentSuffix}-${AWS::StackName}'
      });
    });

    test('should create backup plan with daily backups', () => {
      const plan = template.Resources.BackupPlan;
      expect(plan.Type).toBe('AWS::Backup::BackupPlan');
      expect(plan.Properties.BackupPlan.BackupPlanName).toEqual({
        'Fn::Sub': 'BackupPlan-${EnvironmentSuffix}'
      });

      const rule = plan.Properties.BackupPlan.BackupPlanRule[0];
      expect(rule.RuleName).toBe('DailyBackups');
      expect(rule.TargetBackupVault).toEqual({ Ref: 'BackupVault' });
      expect(rule.ScheduleExpression).toBe('cron(0 5 ? * * *)');
      expect(rule.StartWindowMinutes).toBe(60);
      expect(rule.CompletionWindowMinutes).toBe(120);
      expect(rule.Lifecycle.DeleteAfterDays).toBe(30);
    });

    test('should create backup role with correct managed policies', () => {
      const role = template.Resources.BackupRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Statement[0].Principal.Service).toBe('backup.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');

      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores'
      );
    });

    test('should create backup selection targeting RDS instance', () => {
      const selection = template.Resources.BackupSelection;
      expect(selection.Type).toBe('AWS::Backup::BackupSelection');
      expect(selection.Properties.BackupPlanId).toEqual({ Ref: 'BackupPlan' });
      expect(selection.Properties.BackupSelection.SelectionName).toEqual({
        'Fn::Sub': 'BackupSelection-${EnvironmentSuffix}'
      });
      expect(selection.Properties.BackupSelection.IamRoleArn).toEqual({
        'Fn::GetAtt': ['BackupRole', 'Arn']
      });
      expect(selection.Properties.BackupSelection.Resources).toHaveLength(1);
      expect(selection.Properties.BackupSelection.Resources[0]).toEqual({
        'Fn::Sub': 'arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${RDSInstance}'
      });
    });
  });
});
