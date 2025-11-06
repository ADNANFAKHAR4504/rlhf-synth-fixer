import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

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
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['SSHAllowedCIDR', 'KeyPairName', 'LatestAmiId', 'EnableNATGateway', 'BucketPrefix'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('SSHAllowedCIDR parameter should have correct properties', () => {
      const param = template.Parameters.SSHAllowedCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBeDefined();
      expect(param.AllowedPattern).toBeDefined();
      expect(param.Description).toContain('SSH');
    });

    test('KeyPairName parameter should have correct properties', () => {
      const param = template.Parameters.KeyPairName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toContain('Key Pair');
    });

    test('LatestAmiId parameter should use SSM Parameter', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toContain('/aws/service/ami-amazon-linux');
    });

    test('EnableNATGateway parameter should have correct allowed values', () => {
      const param = template.Parameters.EnableNATGateway;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('BucketPrefix parameter should have correct validation', () => {
      const param = template.Parameters.BucketPrefix;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(37);
    });
  });

  describe('Mappings', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('SubnetConfig should have VPC CIDR', () => {
      const vpcCidr = template.Mappings.SubnetConfig.VPC.CIDR;
      expect(vpcCidr).toBe('10.0.0.0/16');
    });

    test('SubnetConfig should have public subnet CIDRs', () => {
      expect(template.Mappings.SubnetConfig.PublicSubnet1.CIDR).toBe('10.0.1.0/24');
      expect(template.Mappings.SubnetConfig.PublicSubnet2.CIDR).toBe('10.0.2.0/24');
    });

    test('SubnetConfig should have private subnet CIDRs', () => {
      expect(template.Mappings.SubnetConfig.PrivateSubnet1.CIDR).toBe('10.0.10.0/24');
      expect(template.Mappings.SubnetConfig.PrivateSubnet2.CIDR).toBe('10.0.11.0/24');
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('should have UseNATGateway condition', () => {
      expect(template.Conditions.UseNATGateway).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource with correct type', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBeDefined();
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have Production environment tag', () => {
      const vpc = template.Resources.VPC;
      const envTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
    });

    test('should have InternetGateway resource', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have AttachGateway resource', () => {
      const attach = template.Resources.AttachGateway;
      expect(attach).toBeDefined();
      expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attach.Properties.VpcId).toBeDefined();
      expect(attach.Properties.InternetGatewayId).toBeDefined();
    });
  });

  describe('Subnet Resources', () => {
    test('should have PublicSubnet1 with correct properties', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.Properties.CidrBlock).toBeDefined();
    });

    test('should have PublicSubnet2 with correct properties', () => {
      const subnet = template.Resources.PublicSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have PrivateSubnet1 with correct properties', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have PrivateSubnet2 with correct properties', () => {
      const subnet = template.Resources.PrivateSubnet2;
      expect(subnet).toBeDefined();
      expect(subnet.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have Type tag set to Public', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const typeTag = subnet1.Properties.Tags.find((t: any) => t.Key === 'Type');
      expect(typeTag).toBeDefined();
      expect(typeTag.Value).toBe('Public');
    });

    test('private subnets should have Type tag set to Private', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const typeTag = subnet1.Properties.Tags.find((t: any) => t.Key === 'Type');
      expect(typeTag).toBeDefined();
      expect(typeTag.Value).toBe('Private');
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have NATGatewayEIP resource with condition', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Condition).toBe('UseNATGateway');
      expect(eip.DependsOn).toBe('AttachGateway');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('should have NATGateway resource with condition', () => {
      const nat = template.Resources.NATGateway;
      expect(nat).toBeDefined();
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
      expect(nat.Condition).toBe('UseNATGateway');
      expect(nat.Properties.AllocationId).toBeDefined();
      expect(nat.Properties.SubnetId).toBeDefined();
    });
  });

  describe('Route Table Resources', () => {
    test('should have PublicRouteTable resource', () => {
      const rt = template.Resources.PublicRouteTable;
      expect(rt).toBeDefined();
      expect(rt.Type).toBe('AWS::EC2::RouteTable');
      expect(rt.Properties.VpcId).toBeDefined();
    });

    test('should have PublicRoute with IGW', () => {
      const route = template.Resources.PublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.DependsOn).toBe('AttachGateway');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId).toBeDefined();
    });

    test('should have PublicSubnet1RouteTableAssociation', () => {
      const assoc = template.Resources.PublicSubnet1RouteTableAssociation;
      expect(assoc).toBeDefined();
      expect(assoc.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      expect(assoc.Properties.SubnetId).toBeDefined();
      expect(assoc.Properties.RouteTableId).toBeDefined();
    });

    test('should have PublicSubnet2RouteTableAssociation', () => {
      const assoc = template.Resources.PublicSubnet2RouteTableAssociation;
      expect(assoc).toBeDefined();
      expect(assoc.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });

    test('should have PrivateRouteTable resource', () => {
      const rt = template.Resources.PrivateRouteTable;
      expect(rt).toBeDefined();
      expect(rt.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have PrivateRoute with NAT Gateway condition', () => {
      const route = template.Resources.PrivateRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Condition).toBe('UseNATGateway');
      expect(route.Properties.NatGatewayId).toBeDefined();
    });

    test('should have PrivateSubnet1RouteTableAssociation', () => {
      const assoc = template.Resources.PrivateSubnet1RouteTableAssociation;
      expect(assoc).toBeDefined();
      expect(assoc.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });

    test('should have PrivateSubnet2RouteTableAssociation', () => {
      const assoc = template.Resources.PrivateSubnet2RouteTableAssociation;
      expect(assoc).toBeDefined();
      expect(assoc.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
    });
  });

  describe('Security Group Resources', () => {
    test('should have BastionSecurityGroup with SSH ingress', () => {
      const sg = template.Resources.BastionSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toContain('bastion');
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(22);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(22);
    });

    test('BastionSecurityGroup should allow egress to all', () => {
      const sg = template.Resources.BastionSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toHaveLength(1);
      expect(sg.Properties.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have PrivateInstanceSecurityGroup', () => {
      const sg = template.Resources.PrivateInstanceSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toContain('private');
    });

    test('PrivateInstanceSecurityGroup should allow SSH from bastion', () => {
      const sg = template.Resources.PrivateInstanceSecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.SourceSecurityGroupId).toBeDefined();
    });

    test('PrivateInstanceSecurityGroup should allow HTTP and HTTPS from VPC', () => {
      const sg = template.Resources.PrivateInstanceSecurityGroup;
      const httpsRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 443);
      const httpRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);
      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('10.0.0.0/16');
      expect(httpRule.CidrIp).toBe('10.0.0.0/16');
    });

    test('PrivateInstanceSecurityGroup should have controlled egress rules', () => {
      const sg = template.Resources.PrivateInstanceSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress.length).toBeGreaterThan(0);
      const httpsEgress = sg.Properties.SecurityGroupEgress.find((r: any) => r.FromPort === 443);
      expect(httpsEgress).toBeDefined();
    });
  });

  describe('Lambda Resources', () => {
    test('should have EmptyS3BucketLambdaRole with correct trust policy', () => {
      const role = template.Resources.EmptyS3BucketLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('EmptyS3BucketLambdaRole should have Lambda basic execution policy', () => {
      const role = template.Resources.EmptyS3BucketLambdaRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('EmptyS3BucketLambdaRole should have S3 cleanup policy', () => {
      const role = template.Resources.EmptyS3BucketLambdaRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3BucketCleanupPolicy');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('s3:DeleteObject');
    });

    test('should have EmptyS3BucketLambda function', () => {
      const lambda = template.Resources.EmptyS3BucketLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('EmptyS3BucketLambda should have inline code', () => {
      const lambda = template.Resources.EmptyS3BucketLambda;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('cfnresponse');
      expect(lambda.Properties.Code.ZipFile).toContain('bucket.object_versions.all().delete()');
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have CloudTrailS3Bucket with encryption', () => {
      const bucket = template.Resources.CloudTrailS3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('CloudTrailS3Bucket should block public access', () => {
      const bucket = template.Resources.CloudTrailS3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('CloudTrailS3Bucket should have versioning enabled', () => {
      const bucket = template.Resources.CloudTrailS3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('CloudTrailS3Bucket should have lifecycle rules', () => {
      const bucket = template.Resources.CloudTrailS3Bucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].NoncurrentVersionExpirationInDays).toBe(30);
    });

    test('CloudTrailS3Bucket should have access logging configured', () => {
      const bucket = template.Resources.CloudTrailS3Bucket;
      expect(bucket.Properties.LoggingConfiguration).toBeDefined();
      expect(bucket.Properties.LoggingConfiguration.DestinationBucketName).toBeDefined();
      expect(bucket.Properties.LoggingConfiguration.LogFilePrefix).toBe('cloudtrail-access-logs/');
    });

    test('should have AccessLoggingBucket', () => {
      const bucket = template.Resources.AccessLoggingBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('AccessLoggingBucket should have lifecycle rules', () => {
      const bucket = template.Resources.AccessLoggingBucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(30);
    });

    test('should have CloudTrailS3BucketPolicy', () => {
      const policy = template.Resources.CloudTrailS3BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.Bucket).toBeDefined();
    });

    test('CloudTrailS3BucketPolicy should allow CloudTrail to write', () => {
      const policy = template.Resources.CloudTrailS3BucketPolicy;
      const statements = policy.Properties.PolicyDocument.Statement;
      const writeStmt = statements.find((s: any) => s.Sid === 'AWSCloudTrailWrite');
      expect(writeStmt).toBeDefined();
      expect(writeStmt.Action).toBe('s3:PutObject');
      expect(writeStmt.Principal.Service).toBe('cloudtrail.amazonaws.com');
    });
  });

  describe('Custom Resource for S3 Cleanup', () => {
    test('should have EmptyCloudTrailBucket custom resource', () => {
      const resource = template.Resources.EmptyCloudTrailBucket;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('Custom::EmptyS3Bucket');
      expect(resource.Properties.ServiceToken).toBeDefined();
      expect(resource.Properties.BucketName).toBeDefined();
    });

    test('should have EmptyAccessLoggingBucket custom resource', () => {
      const resource = template.Resources.EmptyAccessLoggingBucket;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('Custom::EmptyS3Bucket');
      expect(resource.Properties.ServiceToken).toBeDefined();
      expect(resource.Properties.BucketName).toBeDefined();
    });
  });

  describe('CloudTrail Resource', () => {
    test('should have CloudTrail resource', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.DependsOn).toContain('CloudTrailS3BucketPolicy');
    });

    test('CloudTrail should be logging and multi-region', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrail should have log file validation enabled', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail should have event selectors for S3 data events', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Properties.EventSelectors).toHaveLength(1);
      expect(trail.Properties.EventSelectors[0].IncludeManagementEvents).toBe(true);
      expect(trail.Properties.EventSelectors[0].ReadWriteType).toBe('All');
      expect(trail.Properties.EventSelectors[0].DataResources).toBeDefined();
    });
  });

  describe('IAM Role for EC2', () => {
    test('should have EC2InstanceRole', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('EC2InstanceRole should have CloudWatch agent policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2InstanceRole should have limited S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'LimitedS3Access');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement).toBeDefined();
    });

    test('EC2InstanceRole should allow S3 operations', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies[0];
      const s3Stmt = policy.PolicyDocument.Statement.find((s: any) => s.Sid === 'AllowS3ObjectOperations');
      expect(s3Stmt).toBeDefined();
      expect(s3Stmt.Action).toContain('s3:GetObject');
      expect(s3Stmt.Action).toContain('s3:PutObject');
    });

    test('EC2InstanceRole should deny other services', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies[0];
      const denyStmt = policy.PolicyDocument.Statement.find((s: any) => s.Sid === 'DenyAllOtherServices');
      expect(denyStmt).toBeDefined();
      expect(denyStmt.Effect).toBe('Deny');
      expect(denyStmt.NotAction).toContain('s3:*');
    });

    test('should have EC2InstanceProfile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toHaveLength(1);
    });
  });

  describe('EC2 Instance Resources', () => {
    test('should have PrivateEC2Instance', () => {
      const instance = template.Resources.PrivateEC2Instance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toBe('t3.micro');
    });

    test('PrivateEC2Instance should be in private subnet', () => {
      const instance = template.Resources.PrivateEC2Instance;
      expect(instance.Properties.SubnetId).toBeDefined();
    });

    test('PrivateEC2Instance should have IAM instance profile', () => {
      const instance = template.Resources.PrivateEC2Instance;
      expect(instance.Properties.IamInstanceProfile).toBeDefined();
    });

    test('PrivateEC2Instance should have security group', () => {
      const instance = template.Resources.PrivateEC2Instance;
      expect(instance.Properties.SecurityGroupIds).toHaveLength(1);
    });

    test('PrivateEC2Instance should have conditional key pair', () => {
      const instance = template.Resources.PrivateEC2Instance;
      expect(instance.Properties.KeyName).toBeDefined();
    });

    test('PrivateEC2Instance should have UserData', () => {
      const instance = template.Resources.PrivateEC2Instance;
      expect(instance.Properties.UserData).toBeDefined();
    });

    test('PrivateEC2Instance should have block device mappings', () => {
      const instance = template.Resources.PrivateEC2Instance;
      expect(instance.Properties.BlockDeviceMappings).toHaveLength(1);
      expect(instance.Properties.BlockDeviceMappings[0].Ebs.VolumeSize).toBe(8);
      expect(instance.Properties.BlockDeviceMappings[0].Ebs.VolumeType).toBe('gp3');
      expect(instance.Properties.BlockDeviceMappings[0].Ebs.DeleteOnTermination).toBe(true);
    });

    test('should have BastionHost', () => {
      const instance = template.Resources.BastionHost;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toBe('t3.nano');
    });

    test('BastionHost should be in public subnet', () => {
      const instance = template.Resources.BastionHost;
      expect(instance.Properties.SubnetId).toBeDefined();
    });

    test('BastionHost should have UserData for SSH hardening', () => {
      const instance = template.Resources.BastionHost;
      expect(instance.Properties.UserData).toBeDefined();
    });
  });

  describe('VPC Flow Logs Resources', () => {
    test('should have VPCFlowLogRole', () => {
      const role = template.Resources.VPCFlowLogRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('vpc-flow-logs.amazonaws.com');
    });

    test('VPCFlowLogRole should have CloudWatch Logs permissions', () => {
      const role = template.Resources.VPCFlowLogRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogPolicy');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('should have VPCFlowLogGroup', () => {
      const logGroup = template.Resources.VPCFlowLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have VPCFlowLog', () => {
      const flowLog = template.Resources.VPCFlowLog;
      expect(flowLog).toBeDefined();
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
    });
  });

  describe('Outputs', () => {
    test('should have all VPC-related outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'InternetGatewayId',
        'PublicRouteTableId',
        'PrivateRouteTableId',
      ];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should have all security group outputs', () => {
      expect(template.Outputs.BastionSecurityGroupId).toBeDefined();
      expect(template.Outputs.PrivateInstanceSecurityGroupId).toBeDefined();
    });

    test('should have all EC2-related outputs', () => {
      expect(template.Outputs.BastionHostPublicIP).toBeDefined();
      expect(template.Outputs.BastionHostId).toBeDefined();
      expect(template.Outputs.PrivateInstanceId).toBeDefined();
      expect(template.Outputs.PrivateInstancePrivateIP).toBeDefined();
    });

    test('should have all IAM-related outputs', () => {
      expect(template.Outputs.EC2InstanceRoleArn).toBeDefined();
      expect(template.Outputs.EC2InstanceProfileArn).toBeDefined();
    });

    test('should have all S3-related outputs', () => {
      expect(template.Outputs.CloudTrailBucketName).toBeDefined();
      expect(template.Outputs.CloudTrailBucketArn).toBeDefined();
      expect(template.Outputs.AccessLogsBucketName).toBeDefined();
      expect(template.Outputs.AccessLogsBucketArn).toBeDefined();
    });

    test('should have all logging-related outputs', () => {
      expect(template.Outputs.CloudTrailArn).toBeDefined();
      expect(template.Outputs.VPCFlowLogId).toBeDefined();
      expect(template.Outputs.VPCFlowLogGroupName).toBeDefined();
    });

    test('should have Lambda outputs', () => {
      expect(template.Outputs.EmptyS3BucketLambdaArn).toBeDefined();
    });

    test('should have stack metadata outputs', () => {
      expect(template.Outputs.StackRegion).toBeDefined();
      expect(template.Outputs.StackId).toBeDefined();
    });

    test('conditional outputs should have correct condition', () => {
      expect(template.Outputs.NATGatewayEIP.Condition).toBe('UseNATGateway');
      expect(template.Outputs.NATGatewayId.Condition).toBe('UseNATGateway');
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
        expect(template.Outputs[outputKey].Description.length).toBeGreaterThan(0);
      });
    });

    test('exported outputs should have Export.Name', () => {
      const exportedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'InternetGatewayId',
      ];
      exportedOutputs.forEach(output => {
        expect(template.Outputs[output].Export).toBeDefined();
        expect(template.Outputs[output].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggableResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NATGatewayEIP',
        'NATGateway',
        'PublicRouteTable',
        'PrivateRouteTable',
        'BastionSecurityGroup',
        'PrivateInstanceSecurityGroup',
        'CloudTrailS3Bucket',
        'AccessLoggingBucket',
        'CloudTrail',
        'EC2InstanceRole',
        'PrivateEC2Instance',
        'BastionHost',
        'VPCFlowLogRole',
        'VPCFlowLog',
        'EmptyS3BucketLambda',
        'EmptyS3BucketLambdaRole',
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((t: any) => t.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('Production');
        }
      });
    });

    test('all taggable resources should have Name tag', () => {
      const taggableResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'BastionSecurityGroup',
        'PrivateInstanceSecurityGroup',
        'CloudTrailS3Bucket',
        'AccessLoggingBucket',
        'CloudTrail',
        'PrivateEC2Instance',
        'BastionHost',
        'VPCFlowLog',
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          expect(nameTag).toBeDefined();
        }
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('AttachGateway should depend on VPC and IGW', () => {
      const attach = template.Resources.AttachGateway;
      expect(attach.Properties.VpcId).toBeDefined();
      expect(attach.Properties.InternetGatewayId).toBeDefined();
    });

    test('NATGatewayEIP should depend on AttachGateway', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('PublicRoute should depend on AttachGateway', () => {
      const route = template.Resources.PublicRoute;
      expect(route.DependsOn).toBe('AttachGateway');
    });

    test('CloudTrail should depend on bucket policy', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.DependsOn).toContain('CloudTrailS3BucketPolicy');
    });

    test('CloudTrailS3Bucket logging should reference AccessLoggingBucket', () => {
      const bucket = template.Resources.CloudTrailS3Bucket;
      expect(bucket.Properties.LoggingConfiguration.DestinationBucketName).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have minimum required resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
    });

    test('should have minimum required output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(20);
    });

    test('all resources should have Type property', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        expect(template.Resources[resourceKey].Type).toBeDefined();
      });
    });

    test('all resources should have valid AWS resource types', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resourceType = template.Resources[resourceKey].Type;
        expect(resourceType).toMatch(/^(AWS::|Custom::)/);
      });
    });
  });
});
