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
    test('should create VPC with correct CIDR block and DNS settings', () => {
      const vpc = template.Resources.MyVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });
  });

  describe('Subnet Configuration', () => {
    test('should create public subnet 1 with correct configuration', () => {
      const subnet = template.Resources.MyPublicSubnet1;
      expect(subnet.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
    });

    test('should create public subnet 2 with correct configuration', () => {
      const subnet = template.Resources.MyPublicSubnet2;
      expect(subnet.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('should create private subnet 1 with correct configuration', () => {
      const subnet = template.Resources.MyPrivateSubnet1;
      expect(subnet.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should create private subnet 2 with correct configuration', () => {
      const subnet = template.Resources.MyPrivateSubnet2;
      expect(subnet.Properties.CidrBlock).toBe('10.0.20.0/24');
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('should create NAT Gateway EIP with vpc domain', () => {
      const eip = template.Resources.MyNATGatewayEIP;
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('MyVPCGatewayAttachment');
    });

    test('should create NAT Gateway in public subnet 1', () => {
      const natGateway = template.Resources.MyNATGateway;
      expect(natGateway.Properties.SubnetId).toEqual({
        Ref: 'MyPublicSubnet1'
      });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['MyNATGatewayEIP', 'AllocationId']
      });
    });
  });

  describe('Route Table Configuration', () => {
    test('should create public route with internet gateway', () => {
      const route = template.Resources.MyPublicRoute;
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({
        Ref: 'MyInternetGateway'
      });
      expect(route.DependsOn).toBe('MyVPCGatewayAttachment');
    });

    test('should create private route with NAT gateway', () => {
      const route = template.Resources.MyPrivateRoute;
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({
        Ref: 'MyNATGateway'
      });
    });

    test('should associate both public subnets with public route table', () => {
      const assoc1 = template.Resources.MyPublicSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.MyPublicSubnet2RouteTableAssociation;

      expect(assoc1.Properties.RouteTableId).toEqual({
        Ref: 'MyPublicRouteTable'
      });
      expect(assoc1.Properties.SubnetId).toEqual({
        Ref: 'MyPublicSubnet1'
      });

      expect(assoc2.Properties.RouteTableId).toEqual({
        Ref: 'MyPublicRouteTable'
      });
      expect(assoc2.Properties.SubnetId).toEqual({
        Ref: 'MyPublicSubnet2'
      });
    });

    test('should associate both private subnets with private route table', () => {
      const assoc1 = template.Resources.MyPrivateSubnet1RouteTableAssociation;
      const assoc2 = template.Resources.MyPrivateSubnet2RouteTableAssociation;

      expect(assoc1.Properties.RouteTableId).toEqual({
        Ref: 'MyPrivateRouteTable'
      });
      expect(assoc1.Properties.SubnetId).toEqual({
        Ref: 'MyPrivateSubnet1'
      });

      expect(assoc2.Properties.RouteTableId).toEqual({
        Ref: 'MyPrivateRouteTable'
      });
      expect(assoc2.Properties.SubnetId).toEqual({
        Ref: 'MyPrivateSubnet2'
      });
    });
  });

  describe('EC2 Security Group Configuration', () => {
    test('should create EC2 security group with SSH access only from specific IP', () => {
      const sg = template.Resources.MyEC2SecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const sshRule = sg.Properties.SecurityGroupIngress[0];
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toEqual({ Ref: 'MySSHAllowedIP' });
      expect(sshRule.Description).toBe('SSH access from specified IP');
    });

    test('should create EC2 security group with all outbound traffic allowed', () => {
      const sg = template.Resources.MyEC2SecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);

      const egressRule = sg.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe('-1');
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
      expect(egressRule.Description).toBe('Allow all outbound traffic');
    });
  });

  describe('RDS Security Group Configuration', () => {
    test('should create RDS security group allowing MySQL only from EC2 security group', () => {
      const sg = template.Resources.MyRDSSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const mysqlRule = sg.Properties.SecurityGroupIngress[0];
      expect(mysqlRule.IpProtocol).toBe('tcp');
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({
        Ref: 'MyEC2SecurityGroup'
      });
      expect(mysqlRule.Description).toBe('MySQL access from EC2 security group only');
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('should create secret with auto-generated password', () => {
      const secret = template.Resources.MyDBSecret;
      expect(secret.Properties.Name).toBe('Production-RDS-Credentials');
      expect(secret.Properties.Description).toBe('RDS MySQL database master credentials');

      const generateConfig = secret.Properties.GenerateSecretString;
      expect(generateConfig.SecretStringTemplate).toBe('{"username": "admin"}');
      expect(generateConfig.GenerateStringKey).toBe('password');
      expect(generateConfig.PasswordLength).toBe(32);
      expect(generateConfig.ExcludeCharacters).toBe('"@/\\');
      expect(generateConfig.RequireEachIncludedType).toBe(true);
    });

    test('should create secret target attachment for RDS', () => {
      const attachment = template.Resources.MySecretRDSAttachment;
      expect(attachment.Properties.SecretId).toEqual({
        Ref: 'MyDBSecret'
      });
      expect(attachment.Properties.TargetId).toEqual({
        Ref: 'MyRDSInstance'
      });
      expect(attachment.Properties.TargetType).toBe('AWS::RDS::DBInstance');
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('should create EC2 instance with dynamic AMI resolution', () => {
      const instance = template.Resources.MyEC2Instance;
      expect(instance.Properties.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
    });

    test('should create EC2 instance in public subnet 1', () => {
      const instance = template.Resources.MyEC2Instance;
      expect(instance.Properties.SubnetId).toEqual({
        Ref: 'MyPublicSubnet1'
      });
    });

    test('should create EC2 instance with IAM instance profile', () => {
      const instance = template.Resources.MyEC2Instance;
      expect(instance.Properties.IamInstanceProfile).toEqual({
        Ref: 'MyEC2InstanceProfile'
      });
    });

    test('should create EC2 instance with monitoring enabled', () => {
      const instance = template.Resources.MyEC2Instance;
      expect(instance.Properties.Monitoring).toBe(true);
    });

    test('should create EC2 instance with Environment Production tag', () => {
      const instance = template.Resources.MyEC2Instance;
      const envTag = instance.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
    });

    test('should create EC2 instance with correct UserData script', () => {
      const instance = template.Resources.MyEC2Instance;
      expect(instance.Properties.UserData).toBeDefined();
      expect(instance.Properties.UserData['Fn::Base64']).toBeDefined();
    });
  });

  describe('IAM Role Configuration', () => {
    test('should create EC2 IAM role with CloudWatch and SSM policies', () => {
      const role = template.Resources.MyEC2Role;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('should create EC2 IAM role with Secrets Manager read access', () => {
      const role = template.Resources.MyEC2Role;
      const policy = role.Properties.Policies[0];

      expect(policy.PolicyName).toBe('SecretsManagerReadAccess');
      expect(policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(policy.PolicyDocument.Statement[0].Action).toEqual([
        'secretsmanager:GetSecretValue',
        'secretsmanager:DescribeSecret'
      ]);
      expect(policy.PolicyDocument.Statement[0].Resource).toEqual({
        Ref: 'MyDBSecret'
      });
    });

    test('should create EC2 IAM role with correct assume role policy', () => {
      const role = template.Resources.MyEC2Role;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should create instance profile referencing EC2 role', () => {
      const instanceProfile = template.Resources.MyEC2InstanceProfile;
      expect(instanceProfile.Properties.Roles).toHaveLength(1);
      expect(instanceProfile.Properties.Roles[0]).toEqual({
        Ref: 'MyEC2Role'
      });
    });
  });

  describe('RDS Configuration', () => {
    test('should create RDS instance with correct engine configuration', () => {
      const rds = template.Resources.MyRDSInstance;
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.43');
      expect(rds.Properties.DBInstanceClass).toEqual({
        Ref: 'MyRDSInstanceType'
      });
    });

    test('should create RDS instance with Secrets Manager integration', () => {
      const rds = template.Resources.MyRDSInstance;
      expect(rds.Properties.MasterUsername).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${MyDBSecret}:SecretString:username}}'
      });
      expect(rds.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${MyDBSecret}:SecretString:password}}'
      });
    });

    test('should create RDS instance with storage encryption enabled', () => {
      const rds = template.Resources.MyRDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.StorageType).toBe('gp3');
      expect(rds.Properties.AllocatedStorage).toBe('20');
    });

    test('should create RDS instance with single-AZ deployment', () => {
      const rds = template.Resources.MyRDSInstance;
      expect(rds.Properties.MultiAZ).toBe(false);
    });

    test('should create RDS instance not publicly accessible', () => {
      const rds = template.Resources.MyRDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should create RDS instance with 7-day backup retention', () => {
      const rds = template.Resources.MyRDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PreferredBackupWindow).toBe('03:00-04:00');
    });

    test('should create RDS instance with automatic minor version upgrades', () => {
      const rds = template.Resources.MyRDSInstance;
      expect(rds.Properties.AutoMinorVersionUpgrade).toBe(true);
    });

    test('should create RDS instance with correct maintenance window', () => {
      const rds = template.Resources.MyRDSInstance;
      expect(rds.Properties.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
    });

    test('should create RDS instance in DB subnet group', () => {
      const rds = template.Resources.MyRDSInstance;
      expect(rds.Properties.DBSubnetGroupName).toEqual({
        Ref: 'MyDBSubnetGroup'
      });
    });

    test('should create RDS instance with RDS security group', () => {
      const rds = template.Resources.MyRDSInstance;
      expect(rds.Properties.VPCSecurityGroups).toHaveLength(1);
      expect(rds.Properties.VPCSecurityGroups[0]).toEqual({
        Ref: 'MyRDSSecurityGroup'
      });
    });
  });

  describe('DB Subnet Group Configuration', () => {
    test('should create DB subnet group spanning both private subnets', () => {
      const subnetGroup = template.Resources.MyDBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds[0]).toEqual({
        Ref: 'MyPrivateSubnet1'
      });
      expect(subnetGroup.Properties.SubnetIds[1]).toEqual({
        Ref: 'MyPrivateSubnet2'
      });
    });

    test('should create DB subnet group with correct description', () => {
      const subnetGroup = template.Resources.MyDBSubnetGroup;
      expect(subnetGroup.Properties.DBSubnetGroupDescription).toBe(
        'Subnet group for RDS database spanning two AZs'
      );
    });
  });

  describe('CloudWatch Alarm Configuration', () => {
    test('should create CPU alarm with correct threshold and metric', () => {
      const alarm = template.Resources.MyCPUAlarm;
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create CPU alarm with correct evaluation periods', () => {
      const alarm = template.Resources.MyCPUAlarm;
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
    });

    test('should create CPU alarm with correct missing data treatment', () => {
      const alarm = template.Resources.MyCPUAlarm;
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    test('should create CPU alarm monitoring EC2 instance', () => {
      const alarm = template.Resources.MyCPUAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('InstanceId');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({
        Ref: 'MyEC2Instance'
      });
    });
  });
});
