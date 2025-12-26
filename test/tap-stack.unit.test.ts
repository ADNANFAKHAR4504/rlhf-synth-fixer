import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

describe('TapStack CloudFormation Template - Secure Production Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Conditions Configuration', () => {
    test('should create HasKeyPair condition to check if KeyName is provided', () => {
      const conditions = template.Conditions;
      expect(conditions).toBeDefined();
      expect(conditions.HasKeyPair).toBeDefined();
      expect(conditions.HasKeyPair).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'KeyName' }, ''] }],
      });
    });
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
      expect(envTag.Value).toBe('Production');
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
    test('should create public subnet with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnetCIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnet in VPC', () => {
      const subnet = template.Resources.PublicSubnet;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create public subnet with correct tags', () => {
      const subnet = template.Resources.PublicSubnet;
      const tags = subnet.Properties.Tags;

      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'PublicSubnet-${EnvironmentSuffix}' });

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toBe('Production');
    });
  });

  describe('Private Subnet Configuration', () => {
    test('should create private subnet with correct CIDR and dynamic AZ', () => {
      const subnet = template.Resources.PrivateSubnet;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnetCIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnet in VPC', () => {
      const subnet = template.Resources.PrivateSubnet;
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private subnet with correct tags', () => {
      const subnet = template.Resources.PrivateSubnet;
      const tags = subnet.Properties.Tags;

      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'PrivateSubnet-${EnvironmentSuffix}' });

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toBe('Production');
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

    test('should associate public subnet with public route table', () => {
      const association = template.Resources.PublicSubnetRouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('should create private route table in VPC', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should associate private subnet with private route table', () => {
      const association = template.Resources.PrivateSubnetRouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    });
  });

  describe('EC2 Security Group Configuration', () => {
    test('should create EC2 security group in VPC', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create EC2 security group with HTTP, HTTPS, and SSH ingress rules', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(3);

      const httpRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.Description).toBe('Allow HTTP from internet');

      const httpsRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.FromPort).toBe(443);
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.Description).toBe('Allow HTTPS from internet');

      const sshRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 22);
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toEqual({ Ref: 'SSHAllowedCIDR' });
      expect(sshRule.Description).toBe('Allow SSH from specified IP range');
    });

    test('should create EC2 security group with all outbound traffic allowed', () => {
      const sg = template.Resources.EC2SecurityGroup;
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

    test('should create RDS security group allowing database access only from EC2 instances', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);

      const mysqlRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 3306);
      expect(mysqlRule.IpProtocol).toBe('tcp');
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
      expect(mysqlRule.Description).toBe('Allow MySQL/MariaDB from EC2 instances');

      const postgresRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 5432);
      expect(postgresRule.IpProtocol).toBe('tcp');
      expect(postgresRule.FromPort).toBe(5432);
      expect(postgresRule.ToPort).toBe(5432);
      expect(postgresRule.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
      expect(postgresRule.Description).toBe('Allow PostgreSQL from EC2 instances');
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should create Secrets Manager secret for RDS credentials', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Description).toBe('RDS database master credentials');
    });

    test('should create secret with automatic password generation', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBe('"@/\\');
      expect(secret.Properties.GenerateSecretString.RequireEachIncludedType).toBe(true);
      expect(secret.Properties.GenerateSecretString.SecretStringTemplate).toBe('{"username": "admin"}');
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
    });

    test('should create secret with correct naming', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.Name).toEqual({
        'Fn::Sub': 'RDS-Credentials-${EnvironmentSuffix}-${AWS::StackName}'
      });
    });
  });

  describe('IAM Role Configuration', () => {
    test('should create EC2 IAM role with correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
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

    test('should create EC2 IAM role with S3 read write access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const inlinePolicies = role.Properties.Policies;
      expect(inlinePolicies).toHaveLength(4);

      const s3Policy = inlinePolicies.find((p: any) => p.PolicyName === 'S3ReadWriteAccess');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:DeleteObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
    });

    test('should create EC2 IAM role with DynamoDB access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const inlinePolicies = role.Properties.Policies;

      const dynamoPolicy = inlinePolicies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:UpdateItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:DeleteItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:Query');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:Scan');
    });

    test('should create EC2 IAM role with Secrets Manager read access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const inlinePolicies = role.Properties.Policies;

      const secretsPolicy = inlinePolicies.find((p: any) => p.PolicyName === 'SecretsManagerReadAccess');
      expect(secretsPolicy).toBeDefined();
      expect(secretsPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
      expect(secretsPolicy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:DescribeSecret');
      expect(secretsPolicy.PolicyDocument.Statement[0].Resource).toEqual({ Ref: 'DBSecret' });
    });

    test('should create EC2 IAM role with CloudWatch Logs access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const inlinePolicies = role.Properties.Policies;

      const logsPolicy = inlinePolicies.find((p: any) => p.PolicyName === 'CloudWatchLogsAccess');
      expect(logsPolicy).toBeDefined();
      expect(logsPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
      expect(logsPolicy.PolicyDocument.Statement[0].Action).toContain('logs:DescribeLogStreams');
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

    test('should create launch template with optional SSH key pair', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.KeyName).toEqual({
        'Fn::If': ['HasKeyPair', { Ref: 'KeyName' }, { Ref: 'AWS::NoValue' }],
      });
    });

    test('should create launch template with IAM instance profile', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn']
      });
    });

    test('should create launch template with EC2 security group', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.SecurityGroupIds).toHaveLength(1);
      expect(launchTemplate.Properties.LaunchTemplateData.SecurityGroupIds[0]).toEqual({
        Ref: 'EC2SecurityGroup'
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
      expect(userDataString).toContain('amazon-ssm-agent');
      expect(userDataString).toContain('systemctl start httpd');
      expect(userDataString).toContain('systemctl enable httpd');
    });

    test('should create launch template with correct tag specifications', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const tagSpecs = launchTemplate.Properties.LaunchTemplateData.TagSpecifications;
      expect(tagSpecs).toHaveLength(1);
      expect(tagSpecs[0].ResourceType).toBe('instance');

      const nameTag = tagSpecs[0].Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'ASG-Instance-${EnvironmentSuffix}' });

      const envTag = tagSpecs[0].Tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toBe('Production');
    });
  });

  describe('Auto Scaling Group Configuration', () => {
    test('should create Auto Scaling Group with correct launch template', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
      expect(asg.Properties.LaunchTemplate.Version).toEqual({
        'Fn::GetAtt': ['LaunchTemplate', 'LatestVersionNumber']
      });
    });

    test('should create Auto Scaling Group with correct size configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toEqual({ Ref: 'MinSize' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'MaxSize' });
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'MinSize' });
    });

    test('should create Auto Scaling Group in public subnet', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(1);
      expect(asg.Properties.VPCZoneIdentifier[0]).toEqual({ Ref: 'PublicSubnet' });
    });

    test('should create Auto Scaling Group with EC2 health check', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('EC2');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should create Auto Scaling Group with correct tags', () => {
      const asg = template.Resources.AutoScalingGroup;
      const tags = asg.Properties.Tags;

      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'ASG-${EnvironmentSuffix}' });
      expect(nameTag.PropagateAtLaunch).toBe(false);

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toBe('Production');
      expect(envTag.PropagateAtLaunch).toBe(true);
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
    test('should create CPU high alarm with 70% threshold', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.AlarmDescription).toBe('Scale up when CPU exceeds 70%');
    });

    test('should create CPU high alarm monitoring Auto Scaling Group', () => {
      const alarm = template.Resources.CPUAlarmHigh;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('AutoScalingGroupName');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'AutoScalingGroup' });
      expect(alarm.Properties.AlarmActions).toHaveLength(1);
      expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'ScaleUpPolicy' });
    });

    test('should create CPU low alarm with 30% threshold', () => {
      const alarm = template.Resources.CPUAlarmLow;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(30);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm.Properties.AlarmDescription).toBe('Scale down when CPU is below 30%');
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

  describe('RDS Configuration', () => {
    test('should create RDS DB subnet group using both private subnets for Multi-AZ', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds[0]).toEqual({ Ref: 'PrivateSubnet' });
      expect(subnetGroup.Properties.SubnetIds[1]).toEqual({ Ref: 'PrivateSubnet2' });
      expect(subnetGroup.Properties.DBSubnetGroupDescription).toBe('Subnet group for RDS instance');
    });

    test('should create RDS database with dynamic engine version selection', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toEqual({ Ref: 'DBEngine' });
      expect(rds.Properties.EngineVersion).toBeDefined();
      expect(rds.Properties.EngineVersion['Fn::If']).toBeDefined();
    });

    test('should create RDS database with single-AZ configuration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(false);
    });

    test('should create RDS database with encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('should create RDS database with gp3 storage type', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageType).toBe('gp3');
      expect(rds.Properties.AllocatedStorage).toBe('20');
    });

    test('should create RDS database with Secrets Manager integration', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUsername).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      });
      expect(rds.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      });
    });

    test('should create RDS database with backup retention', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PreferredBackupWindow).toBe('03:00-04:00');
      expect(rds.Properties.PreferredMaintenanceWindow).toBe('mon:04:00-mon:05:00');
    });

    test('should create RDS database with deletion policy snapshot', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Snapshot');
    });

    test('should create RDS database with CloudWatch logs exports', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.EnableCloudwatchLogsExports).toHaveLength(3);
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('should create RDS database with public accessibility disabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should create RDS database with correct security group', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.VPCSecurityGroups).toHaveLength(1);
      expect(rds.Properties.VPCSecurityGroups[0]).toEqual({ Ref: 'RDSSecurityGroup' });
    });

    test('should create RDS database with correct DB subnet group', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with encryption enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should create S3 bucket with versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should create S3 bucket with public access blocked', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should create S3 bucket with correct naming convention', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': '${S3BucketPrefix}-${AWS::AccountId}-${EnvironmentSuffix}'
      });
    });
  });

  describe('DynamoDB Configuration', () => {
    test('should create DynamoDB table with on-demand billing', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should create DynamoDB table with encryption enabled', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('should create DynamoDB table with point-in-time recovery', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('should create DynamoDB table with composite key schema', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.KeySchema).toHaveLength(2);
      expect(table.Properties.KeySchema[0].AttributeName).toBe('id');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
      expect(table.Properties.KeySchema[1].AttributeName).toBe('timestamp');
      expect(table.Properties.KeySchema[1].KeyType).toBe('RANGE');
    });

    test('should create DynamoDB table with correct attribute definitions', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.AttributeDefinitions).toHaveLength(2);

      const idAttr = table.Properties.AttributeDefinitions.find((attr: any) => attr.AttributeName === 'id');
      expect(idAttr.AttributeType).toBe('S');

      const timestampAttr = table.Properties.AttributeDefinitions.find((attr: any) => attr.AttributeName === 'timestamp');
      expect(timestampAttr.AttributeType).toBe('N');
    });

    test('should create DynamoDB table with correct naming convention', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': '${DynamoDBTableName}-${EnvironmentSuffix}'
      });
    });
  });
});
