import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR block', () => {
      const vpc = template.Resources.VPC;
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
      expect(projectTag.Value).toBe('CloudEnvironmentSetup');
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should create Internet Gateway', () => {
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
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should create public subnet 2 with correct CIDR and AZ', () => {
      const subnet = template.Resources.PublicSubnet2;
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
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1CIDR' });
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should create private subnet 2 with correct CIDR and AZ', () => {
      const subnet = template.Resources.PrivateSubnet2;
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

  describe('NAT Gateway Configuration', () => {
    test('should create NAT Gateway EIP with vpc domain', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should create NAT Gateway in public subnet 1', () => {
      const natGateway = template.Resources.NATGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId']
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

    test('should create private route table in VPC', () => {
      const routeTable = template.Resources.PrivateRouteTable;
      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create private route to NAT gateway', () => {
      const route = template.Resources.PrivateRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    });

    test('should associate private subnet 1 with private route table', () => {
      const association = template.Resources.PrivateSubnet1RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    });

    test('should associate private subnet 2 with private route table', () => {
      const association = template.Resources.PrivateSubnet2RouteTableAssociation;
      expect(association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(association.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
      expect(association.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    });
  });

  describe('EC2 Security Group Configuration', () => {
    test('should create EC2 security group in VPC', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should create EC2 security group with SSH access from specific CIDR', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const sshRule = sg.Properties.SecurityGroupIngress[0];
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.ToPort).toBe(22);
      expect(sshRule.CidrIp).toEqual({ Ref: 'SSHAllowedCIDR' });
      expect(sshRule.Description).toBe('SSH access from specific IP range');
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

    test('should create RDS security group allowing MySQL only from EC2 security group', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const mysqlRule = sg.Properties.SecurityGroupIngress[0];
      expect(mysqlRule.IpProtocol).toBe('tcp');
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
      expect(mysqlRule.Description).toBe('MySQL access from EC2 instances');
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
      expect(secret.Properties.Name).toEqual({ 'Fn::Sub': 'RDS-Credentials-${EnvironmentSuffix}' });
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

    test('should create EC2 IAM role with S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.Policies).toHaveLength(2);

      const s3Policy = role.Properties.Policies[0];
      expect(s3Policy.PolicyName).toBe('S3AccessPolicy');
      expect(s3Policy.PolicyDocument.Version).toBe('2012-10-17');
      expect(s3Policy.PolicyDocument.Statement).toHaveLength(1);

      const statement = s3Policy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toEqual(['s3:GetObject', 's3:PutObject', 's3:ListBucket']);
      expect(statement.Resource).toHaveLength(2);
      expect(statement.Resource[0]).toEqual({ 'Fn::GetAtt': ['S3Bucket', 'Arn'] });
      expect(statement.Resource[1]).toEqual({ 'Fn::Sub': '${S3Bucket.Arn}/*' });

      const smPolicy = role.Properties.Policies[1];
      expect(smPolicy.PolicyName).toBe('SecretsManagerReadAccess');
      expect(smPolicy.PolicyDocument.Version).toBe('2012-10-17');
      expect(smPolicy.PolicyDocument.Statement).toHaveLength(1);

      const smStatement = smPolicy.PolicyDocument.Statement[0];
      expect(smStatement.Effect).toBe('Allow');
      expect(smStatement.Action).toEqual(['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret']);
      expect(smStatement.Resource).toEqual({ Ref: 'DBSecret' });
    });

    test('should create instance profile referencing EC2 role', () => {
      const instanceProfile = template.Resources.EC2InstanceProfile;
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toHaveLength(1);
      expect(instanceProfile.Properties.Roles[0]).toEqual({ Ref: 'EC2InstanceRole' });
    });
  });

  describe('EC2 Instance 1 Configuration', () => {
    test('should create EC2 instance 1 with correct instance type', () => {
      const instance = template.Resources.EC2Instance1;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toEqual({ Ref: 'EC2InstanceType' });
    });

    test('should create EC2 instance 1 with dynamic AMI resolution', () => {
      const instance = template.Resources.EC2Instance1;
      expect(instance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });

    test('should create EC2 instance 1 in public subnet 1', () => {
      const instance = template.Resources.EC2Instance1;
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('should create EC2 instance 1 with EC2 security group', () => {
      const instance = template.Resources.EC2Instance1;
      expect(instance.Properties.SecurityGroupIds).toHaveLength(1);
      expect(instance.Properties.SecurityGroupIds[0]).toEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('should create EC2 instance 1 with IAM instance profile', () => {
      const instance = template.Resources.EC2Instance1;
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    });

    test('should create EC2 instance 1 with monitoring enabled', () => {
      const instance = template.Resources.EC2Instance1;
      expect(instance.Properties.Monitoring).toBe(true);
    });

    test('should create EC2 instance 1 with correct UserData script', () => {
      const instance = template.Resources.EC2Instance1;
      expect(instance.Properties.UserData).toBeDefined();
      expect(instance.Properties.UserData['Fn::Base64']).toBeDefined();
      const userData = instance.Properties.UserData['Fn::Base64'];
      if (userData['Fn::Join']) {
        const userDataString = userData['Fn::Join'][1].join('');
        expect(userDataString).toContain('yum update -y');
        expect(userDataString).toContain('yum install -y mysql amazon-cloudwatch-agent');
        expect(userDataString).toContain('yum install -y amazon-ssm-agent');
        expect(userDataString).toContain('systemctl enable amazon-ssm-agent');
        expect(userDataString).toContain('systemctl start amazon-ssm-agent');
      } else {
        expect(userData).toContain('yum update -y');
        expect(userData).toContain('yum install -y mysql amazon-cloudwatch-agent');
      }
    });

    test('should create EC2 instance 1 with correct tags', () => {
      const instance = template.Resources.EC2Instance1;
      const tags = instance.Properties.Tags;

      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'EC2Instance1-${EnvironmentSuffix}' });

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });

      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      expect(projectTag.Value).toBe('CloudEnvironmentSetup');
    });
  });

  describe('EC2 Instance 2 Configuration', () => {
    test('should create EC2 instance 2 with correct instance type', () => {
      const instance = template.Resources.EC2Instance2;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toEqual({ Ref: 'EC2InstanceType' });
    });

    test('should create EC2 instance 2 with dynamic AMI resolution', () => {
      const instance = template.Resources.EC2Instance2;
      expect(instance.Properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });

    test('should create EC2 instance 2 in public subnet 2', () => {
      const instance = template.Resources.EC2Instance2;
      expect(instance.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should create EC2 instance 2 with EC2 security group', () => {
      const instance = template.Resources.EC2Instance2;
      expect(instance.Properties.SecurityGroupIds).toHaveLength(1);
      expect(instance.Properties.SecurityGroupIds[0]).toEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('should create EC2 instance 2 with IAM instance profile', () => {
      const instance = template.Resources.EC2Instance2;
      expect(instance.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    });

    test('should create EC2 instance 2 with monitoring enabled', () => {
      const instance = template.Resources.EC2Instance2;
      expect(instance.Properties.Monitoring).toBe(true);
    });

    test('should create EC2 instance 2 with correct UserData script', () => {
      const instance = template.Resources.EC2Instance2;
      expect(instance.Properties.UserData).toBeDefined();
      expect(instance.Properties.UserData['Fn::Base64']).toBeDefined();
      const userData = instance.Properties.UserData['Fn::Base64'];
      if (userData['Fn::Join']) {
        const userDataString = userData['Fn::Join'][1].join('');
        expect(userDataString).toContain('yum update -y');
        expect(userDataString).toContain('yum install -y mysql amazon-cloudwatch-agent');
        expect(userDataString).toContain('yum install -y amazon-ssm-agent');
        expect(userDataString).toContain('systemctl enable amazon-ssm-agent');
        expect(userDataString).toContain('systemctl start amazon-ssm-agent');
      } else {
        expect(userData).toContain('yum update -y');
        expect(userData).toContain('yum install -y mysql amazon-cloudwatch-agent');
      }
    });

    test('should create EC2 instance 2 with correct tags', () => {
      const instance = template.Resources.EC2Instance2;
      const tags = instance.Properties.Tags;

      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': 'EC2Instance2-${EnvironmentSuffix}' });

      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });

      const projectTag = tags.find((tag: any) => tag.Key === 'Project');
      expect(projectTag.Value).toBe('CloudEnvironmentSetup');
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
      expect(rds.Properties.StorageType).toBe('gp2');
      expect(rds.Properties.AllocatedStorage).toBe('20');
    });

    test('should create RDS instance with single-AZ deployment', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(false);
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

    test('should create RDS instance with Delete deletion policy', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with correct name format', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'cloud-env-bucket-${AWS::AccountId}-${EnvironmentSuffix}'
      });
    });

    test('should create S3 bucket with versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should create S3 bucket with encryption enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toHaveLength(1);
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should create S3 bucket with public access blocked', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should create S3 bucket with lifecycle policy', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);

      const rule = bucket.Properties.LifecycleConfiguration.Rules[0];
      expect(rule.Id).toBe('DeleteOldVersions');
      expect(rule.Status).toBe('Enabled');
      expect(rule.NoncurrentVersionExpirationInDays).toBe(90);
    });

    test('should create S3 bucket with Retain deletion policy', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.DeletionPolicy).toBe('Retain');
    });
  });

  describe('CloudWatch Alarm Configuration', () => {
    test('should create EC2 CPU alarm with correct configuration', () => {
      const alarm = template.Resources.EC2CPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should create EC2 CPU alarm monitoring EC2 instance 1', () => {
      const alarm = template.Resources.EC2CPUAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('InstanceId');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'EC2Instance1' });
    });

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

    test('should create RDS storage alarm with correct configuration', () => {
      const alarm = template.Resources.RDSStorageAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('FreeStorageSpace');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
      expect(alarm.Properties.Threshold).toBe(2000000000);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should create RDS storage alarm monitoring RDS instance', () => {
      const alarm = template.Resources.RDSStorageAlarm;
      expect(alarm.Properties.Dimensions).toHaveLength(1);
      expect(alarm.Properties.Dimensions[0].Name).toBe('DBInstanceIdentifier');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'RDSInstance' });
    });
  });
});
