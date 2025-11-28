import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('VPC Configuration', () => {
    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should reference VpcCIDR parameter', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('Internet Gateway should be properly attached to VPC', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  describe('Public Subnets Configuration', () => {
    test('PublicSubnet1 should be in first AZ and allow public IPs', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet1CIDR' });
    });

    test('PublicSubnet2 should be in second AZ and allow public IPs', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PublicSubnet2CIDR' });
    });
  });

  describe('Private Subnets Configuration', () => {
    test('PrivateSubnet1 should be in first AZ and not allow public IPs', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet1CIDR' });
    });

    test('PrivateSubnet2 should be in second AZ and not allow public IPs', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(subnet.Properties.CidrBlock).toEqual({ Ref: 'PrivateSubnet2CIDR' });
    });
  });

  describe('NAT Gateway Configuration', () => {
    test('NAT Gateway should be in PublicSubnet1', () => {
      const natGateway = template.Resources.NATGateway;
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP', 'AllocationId']
      });
    });

    test('NAT Gateway EIP should have vpc domain', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
      expect(eip.DependsOn).toBe('AttachGateway');
    });
  });

  describe('Route Tables Configuration', () => {
    test('Public route table should route 0.0.0.0/0 to Internet Gateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('Private route table should route 0.0.0.0/0 to NAT Gateway', () => {
      const route = template.Resources.PrivateRoute;
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
      expect(route.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    });

    test('Public subnets should be associated with public route table', () => {
      const assoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });

      const assoc2 = template.Resources.PublicSubnet2RouteTableAssociation;
      expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('Private subnets should be associated with private route table', () => {
      const assoc1 = template.Resources.PrivateSubnet1RouteTableAssociation;
      expect(assoc1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(assoc1.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });

      const assoc2 = template.Resources.PrivateSubnet2RouteTableAssociation;
      expect(assoc2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
      expect(assoc2.Properties.RouteTableId).toEqual({ Ref: 'PrivateRouteTable' });
    });
  });

  describe('ALB Security Group Configuration', () => {
    test('ALB Security Group should allow HTTP and HTTPS from anywhere', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');

      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('EC2 Security Group Configuration', () => {
    test('EC2 Security Group should only allow traffic from ALB', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);

      ingress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      });

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);

      const httpsRule = ingress.find((r: any) => r.FromPort === 443);
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.ToPort).toBe(443);
    });
  });

  describe('RDS Security Group Configuration', () => {
    test('RDS Security Group should only allow MySQL from EC2', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });

      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });
  });

  describe('Lambda Security Group Configuration', () => {
    test('Lambda Security Group should have no ingress rules (no public access)', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(sg.Properties.SecurityGroupIngress).toBeUndefined();

      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(1);
      expect(egress[0].IpProtocol).toBe('-1');
      expect(egress[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('KMS Key Configuration', () => {
    test('KMS Key should have key rotation enabled', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS Key policy should allow required services', () => {
      const kmsKey = template.Resources.KMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;

      const serviceStatement = statements.find((s: any) => s.Sid === 'Allow services to use the key');
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('lambda.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('logs.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('ec2.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('rds.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('cloudtrail.amazonaws.com');
      expect(serviceStatement.Action).toContain('kms:Decrypt');
      expect(serviceStatement.Action).toContain('kms:GenerateDataKey');
    });

    test('KMS Key alias should be properly configured', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
      expect(alias.Properties.AliasName).toEqual({ 'Fn::Sub': 'alias/secure-prod-${EnvironmentSuffix}' });
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('DBSecret should generate secure password', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');

      const generateConfig = secret.Properties.GenerateSecretString;
      expect(generateConfig.PasswordLength).toBe(32);
      expect(generateConfig.RequireEachIncludedType).toBe(true);
      expect(generateConfig.ExcludeCharacters).toBe('"@/\\');
      expect(generateConfig.SecretStringTemplate).toBe('{"username": "admin"}');
      expect(generateConfig.GenerateStringKey).toBe('password');
    });
  });

  describe('S3 Logging Bucket Configuration', () => {
    test('S3 Logging Bucket should have AES256 encryption', () => {
      const bucket = template.Resources.S3LoggingBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 Logging Bucket should block all public access', () => {
      const bucket = template.Resources.S3LoggingBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 Logging Bucket should have versioning enabled', () => {
      const bucket = template.Resources.S3LoggingBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 Logging Bucket should have lifecycle rule for 90 days expiration', () => {
      const bucket = template.Resources.S3LoggingBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;

      expect(rules).toHaveLength(1);
      expect(rules[0].Status).toBe('Enabled');
      expect(rules[0].ExpirationInDays).toBe(90);
    });

    test('S3 Logging Bucket policy should allow ELB logging for us-west-1', () => {
      const policy = template.Resources.S3LoggingBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      const elbStatement = statements.find((s: any) => s.Sid === 'AWSELBLogDelivery');
      expect(elbStatement).toBeDefined();
      expect(elbStatement.Principal.AWS).toBe('arn:aws:iam::027434742980:root');
      expect(elbStatement.Action).toBe('s3:PutObject');
    });
  });

  describe('S3 Data Bucket Configuration', () => {
    test('S3 Bucket should use KMS encryption with BucketKeyEnabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('S3 Bucket should block all public access', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 Bucket should log to logging bucket', () => {
      const bucket = template.Resources.S3Bucket;
      const logging = bucket.Properties.LoggingConfiguration;

      expect(logging.DestinationBucketName).toEqual({ Ref: 'S3LoggingBucket' });
      expect(logging.LogFilePrefix).toBe('s3-access-logs/');
    });

    test('S3 Bucket policy should deny insecure transport', () => {
      const policy = template.Resources.S3BucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      const denyStatement = statements.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
      expect(denyStatement.Principal).toBe('*');
      expect(denyStatement.Action).toBe('s3:*');
      expect(denyStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('RDS Configuration', () => {
    test('RDS should be MySQL 8.0.39 with encryption', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.39');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('RDS should have correct deletion policies', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('RDS should not be publicly accessible', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('RDS should use Secrets Manager for credentials', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUsername).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      });
      expect(rds.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      });
    });

    test('RDS should use private subnet group', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
      expect(rds.Properties.VPCSecurityGroups).toContainEqual({ Ref: 'RDSSecurityGroup' });
    });

    test('RDS should have backup and maintenance windows configured', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PreferredBackupWindow).toBe('03:00-04:00');
      expect(rds.Properties.PreferredMaintenanceWindow).toBe('mon:04:00-mon:05:00');
    });

    test('RDS should have CloudWatch logs export enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('general');
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('slowquery');
    });

    test('RDS DB Subnet Group should use private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetGroup.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('EC2 Instance Role Configuration', () => {
    test('EC2 Instance Role should have correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumeRole = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assumeRole.Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumeRole.Action).toBe('sts:AssumeRole');
    });

    test('EC2 Instance Role should have SSM and CloudWatch managed policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2 Instance Role should have S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'EC2S3AccessPolicy');

      expect(s3Policy).toBeDefined();
      const statement = s3Policy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('s3:GetObject');
      expect(statement.Action).toContain('s3:PutObject');
      expect(statement.Action).toContain('s3:ListBucket');
    });

    test('EC2 Instance Role should have Secrets Manager access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const secretsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'EC2SecretsManagerAccessPolicy');

      expect(secretsPolicy).toBeDefined();
      const statement = secretsPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('secretsmanager:GetSecretValue');
      expect(statement.Action).toContain('secretsmanager:DescribeSecret');
      expect(statement.Resource).toEqual({ Ref: 'DBSecret' });
    });

    test('EC2 Instance Role should have KMS access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const kmsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'EC2KMSAccessPolicy');

      expect(kmsPolicy).toBeDefined();
      const statement = kmsPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('kms:Decrypt');
      expect(statement.Action).toContain('kms:GenerateDataKey');
      expect(statement.Action).toContain('kms:DescribeKey');
      expect(statement.Resource).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });
  });

  describe('EC2 Instance Configuration', () => {
    test('EC2 should use SSM parameter for AMI', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Type).toBe('AWS::EC2::Instance');
      expect(ec2.Properties.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
    });

    test('EC2 should be in private subnet with correct security group', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(ec2.Properties.SecurityGroupIds).toContainEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('EC2 should have instance profile attached', () => {
      const ec2 = template.Resources.EC2Instance;
      expect(ec2.Properties.IamInstanceProfile).toEqual({ Ref: 'EC2InstanceProfile' });
    });

    test('EC2 Instance Profile should reference EC2 Instance Role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
    });
  });

  describe('Lambda Execution Role Configuration', () => {
    test('Lambda Execution Role should have correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumeRole = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assumeRole.Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumeRole.Action).toBe('sts:AssumeRole');
    });

    test('Lambda Execution Role should have VPC access managed policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    test('Lambda Execution Role should have CloudWatch Logs policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const logsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'LambdaCloudWatchLogsPolicy');

      expect(logsPolicy).toBeDefined();
      const statement = logsPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('logs:CreateLogGroup');
      expect(statement.Action).toContain('logs:CreateLogStream');
      expect(statement.Action).toContain('logs:PutLogEvents');
    });

    test('Lambda Execution Role should have Secrets Manager policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const secretsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'LambdaSecretsManagerPolicy');

      expect(secretsPolicy).toBeDefined();
      const statement = secretsPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('secretsmanager:GetSecretValue');
      expect(statement.Action).toContain('secretsmanager:DescribeSecret');
      expect(statement.Resource).toEqual({ Ref: 'DBSecret' });
    });

    test('Lambda Execution Role should have KMS decrypt policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const kmsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'LambdaKMSDecryptPolicy');

      expect(kmsPolicy).toBeDefined();
      const statement = kmsPolicy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('kms:Decrypt');
      expect(statement.Action).toContain('kms:DescribeKey');
      expect(statement.Resource).toEqual({ 'Fn::GetAtt': ['KMSKey', 'Arn'] });
    });
  });

  describe('Lambda Function Configuration', () => {
    test('Lambda should use Python 3.11 runtime', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('Lambda should be in VPC with correct configuration', () => {
      const lambda = template.Resources.LambdaFunction;
      const vpcConfig = lambda.Properties.VpcConfig;

      expect(vpcConfig.SecurityGroupIds).toContainEqual({ Ref: 'LambdaSecurityGroup' });
      expect(vpcConfig.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(vpcConfig.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('Lambda should have environment variables configured', () => {
      const lambda = template.Resources.LambdaFunction;
      const env = lambda.Properties.Environment.Variables;

      expect(env.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(env.SECRET_ARN).toEqual({ Ref: 'DBSecret' });
    });

    test('Lambda should reference execution role', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    });

    test('Lambda should have memory and timeout configured', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.MemorySize).toBe(128);
      expect(lambda.Properties.Timeout).toBe(30);
    });
  });

  describe('Lambda Log Group Configuration', () => {
    test('Lambda Log Group should have retention from parameter', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toEqual({ Ref: 'LogRetentionInDays' });
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/SecureProdFunction-${EnvironmentSuffix}'
      });
    });
  });

  describe('Application Load Balancer Configuration', () => {
    test('ALB should be internet-facing in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
      expect(alb.Properties.SecurityGroups).toContainEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('ALB should have access logging enabled to S3', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;

      const accessLogsEnabled = attributes.find((a: any) => a.Key === 'access_logs.s3.enabled');
      expect(accessLogsEnabled.Value).toBe('true');

      const accessLogsBucket = attributes.find((a: any) => a.Key === 'access_logs.s3.bucket');
      expect(accessLogsBucket.Value).toEqual({ Ref: 'S3LoggingBucket' });

      const accessLogsPrefix = attributes.find((a: any) => a.Key === 'access_logs.s3.prefix');
      expect(accessLogsPrefix.Value).toBe('alb-logs');
    });

    test('ALB should depend on S3 Logging Bucket Policy', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.DependsOn).toBe('S3LoggingBucketPolicy');
    });
  });

  describe('ALB Target Group Configuration', () => {
    test('Target Group should have correct health check settings', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckPort).toBe('80');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('Target Group should target EC2 instance', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.TargetType).toBe('instance');
      expect(tg.Properties.Targets).toContainEqual({
        Id: { Ref: 'EC2Instance' },
        Port: 80
      });
    });
  });

  describe('ALB Listener Configuration', () => {
    test('ALB Listener should forward to target group on port 80', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.LoadBalancerArn).toEqual({ Ref: 'ApplicationLoadBalancer' });

      const defaultAction = listener.Properties.DefaultActions[0];
      expect(defaultAction.Type).toBe('forward');
      expect(defaultAction.TargetGroupArn).toEqual({ Ref: 'ALBTargetGroup' });
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    test('VPC Flow Log should log all traffic to CloudWatch', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.ResourceId).toEqual({ Ref: 'VPC' });
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.LogGroupName).toEqual({ Ref: 'VPCFlowLogGroup' });
    });

    test('VPC Flow Log Role should have correct assume role policy', () => {
      const role = template.Resources.VPCFlowLogRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumeRole = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assumeRole.Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
      expect(assumeRole.Action).toBe('sts:AssumeRole');
    });

    test('VPC Flow Log Role should have CloudWatch Logs policy', () => {
      const role = template.Resources.VPCFlowLogRole;
      const policy = role.Properties.Policies[0];

      expect(policy.PolicyName).toBe('CloudWatchLogPolicy');
      const actions = policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('logs:CreateLogGroup');
      expect(actions).toContain('logs:CreateLogStream');
      expect(actions).toContain('logs:PutLogEvents');
      expect(actions).toContain('logs:DescribeLogGroups');
      expect(actions).toContain('logs:DescribeLogStreams');
    });

    test('VPC Flow Log Group should have retention from parameter', () => {
      const logGroup = template.Resources.VPCFlowLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toEqual({ Ref: 'LogRetentionInDays' });
    });
  });

  describe('CloudTrail Bucket Configuration', () => {
    test('CloudTrail Bucket should use KMS encryption', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Retain');
      expect(bucket.UpdateReplacePolicy).toBe('Retain');

      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        'Fn::GetAtt': ['KMSKey', 'Arn']
      });
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('CloudTrail Bucket should block all public access', () => {
      const bucket = template.Resources.CloudTrailBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('CloudTrail Bucket should have 365-day lifecycle', () => {
      const bucket = template.Resources.CloudTrailBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;

      expect(rules).toHaveLength(1);
      expect(rules[0].Status).toBe('Enabled');
      expect(rules[0].ExpirationInDays).toBe(365);
    });

    test('CloudTrail Bucket policy should allow CloudTrail service', () => {
      const policy = template.Resources.CloudTrailBucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      const aclCheck = statements.find((s: any) => s.Sid === 'AWSCloudTrailAclCheck');
      expect(aclCheck).toBeDefined();
      expect(aclCheck.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(aclCheck.Action).toBe('s3:GetBucketAcl');

      const writeCheck = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
      expect(writeCheck).toBeDefined();
      expect(writeCheck.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(writeCheck.Action).toBe('s3:PutObject');
      expect(writeCheck.Condition.StringEquals['s3:x-amz-acl']).toBe('bucket-owner-full-control');
    });
  });

  describe('CloudTrail Configuration', () => {
    test('CloudTrail should have multi-region and log validation enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrail should log to S3 and CloudWatch', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.S3BucketName).toEqual({ Ref: 'CloudTrailBucket' });
      expect(trail.Properties.CloudWatchLogsLogGroupArn).toEqual({
        'Fn::GetAtt': ['CloudTrailLogGroup', 'Arn']
      });
      expect(trail.Properties.CloudWatchLogsRoleArn).toEqual({
        'Fn::GetAtt': ['CloudTrailLogRole', 'Arn']
      });
    });

    test('CloudTrail should have management events enabled', () => {
      const trail = template.Resources.CloudTrail;
      const eventSelectors = trail.Properties.EventSelectors;

      expect(eventSelectors).toHaveLength(1);
      expect(eventSelectors[0].ReadWriteType).toBe('All');
      expect(eventSelectors[0].IncludeManagementEvents).toBe(true);
    });

    test('CloudTrail should depend on bucket policy', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toBe('CloudTrailBucketPolicy');
    });

    test('CloudTrail Log Role should have correct permissions', () => {
      const role = template.Resources.CloudTrailLogRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumeRole = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assumeRole.Principal.Service).toBe('cloudtrail.amazonaws.com');

      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('CloudTrailLogsPolicy');
      const actions = policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('logs:CreateLogStream');
      expect(actions).toContain('logs:PutLogEvents');
    });

    test('CloudTrail Log Group should have retention from parameter', () => {
      const logGroup = template.Resources.CloudTrailLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toEqual({ Ref: 'LogRetentionInDays' });
    });
  });

  describe('CloudWatch Alarms Configuration', () => {
    test('EC2 CPU Alarm should monitor CPUUtilization', () => {
      const alarm = template.Resources.EC2CPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');

      const dimension = alarm.Properties.Dimensions[0];
      expect(dimension.Name).toBe('InstanceId');
      expect(dimension.Value).toEqual({ Ref: 'EC2Instance' });
    });

    test('RDS CPU Alarm should monitor CPUUtilization', () => {
      const alarm = template.Resources.RDSCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(80);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');

      const dimension = alarm.Properties.Dimensions[0];
      expect(dimension.Name).toBe('DBInstanceIdentifier');
      expect(dimension.Value).toEqual({ Ref: 'RDSInstance' });
    });

    test('Lambda Error Alarm should monitor Errors', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');

      const dimension = alarm.Properties.Dimensions[0];
      expect(dimension.Name).toBe('FunctionName');
      expect(dimension.Value).toEqual({ Ref: 'LambdaFunction' });
    });
  });
});
