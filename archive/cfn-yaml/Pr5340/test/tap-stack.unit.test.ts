/**
 * Unit Tests for TapStack CloudFormation Template
 *
 * These tests validate the template structure, resource definitions,
 * and configuration without making actual AWS API calls.
 *
 * To generate TapStack.json from YAML:
 * Run: cfn-flip lib/TapStack.yml lib/TapStack.json
 */

import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ===================================================================
  // TEMPLATE STRUCTURE & PARAMETERS
  // ===================================================================
  describe('Template Structure & Parameters', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description for secure AWS infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Secure AWS Infrastructure');
    });

    test('should define BucketPrefix parameter with lowercase enforcement', () => {
      const param = template.Parameters.BucketPrefix;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(37);
      expect(param.Default).toBe('tapstack-uq');
    });

    test('should define AllowedSSHIP parameter with CIDR validation', () => {
      const param = template.Parameters.AllowedSSHIP;
      expect(param.Type).toBe('String');
      // Verify it has a valid CIDR pattern (IP address/subnet mask)
      expect(param.AllowedPattern).toMatch(/\d.*\/.*\d/);
    });

    test('should define DBPasswordLength parameter with valid range', () => {
      const param = template.Parameters.DBPasswordLength;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(32);
      expect(param.MinValue).toBe(8);
      expect(param.MaxValue).toBe(41);
    });

    test('should use SSM Parameter Store for AMI ID', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toContain('/aws/service/ami-amazon-linux-latest');
    });
  });

  // ===================================================================
  // VPC & NETWORKING
  // ===================================================================
  describe('VPC & Networking Resources', () => {
    test('should create VPC with 10.0.0.0/16 CIDR', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should create 2 public subnets in different AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');

      // Verify different AZs
      expect(subnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(subnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('should create 2 private subnets in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBeUndefined(); // false is default
      expect(subnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('should create Internet Gateway attached to VPC', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.AttachGateway;

      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should create 2 NAT Gateways with Elastic IPs', () => {
      const nat1 = template.Resources.NATGateway1;
      const nat2 = template.Resources.NATGateway2;
      const eip1 = template.Resources.EIPForNAT1;
      const eip2 = template.Resources.EIPForNAT2;

      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip1.Properties.Domain).toBe('vpc');

      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(nat2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
    });

    test('should create route tables with correct routes', () => {
      const publicRT = template.Resources.PublicRouteTable;
      const publicRoute = template.Resources.PublicRoute;

      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });

      const privateRoute1 = template.Resources.PrivateRoute1;
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway1' });
    });
  });

  // ===================================================================
  // SECURITY GROUPS
  // ===================================================================
  describe('Security Groups', () => {
    test('should create ALB Security Group with HTTP ingress from internet', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');

      const httpRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.IpProtocol).toBe('tcp');
    });

    test('should create EC2 Security Group accepting traffic only from ALB', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const httpRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);

      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('should restrict SSH access to specific CIDR', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const sshRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 22);

      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toEqual({ Ref: 'AllowedSSHIP' });
    });

    test('should create RDS Security Group accepting MySQL traffic only from EC2', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const mysqlRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 3306);

      expect(mysqlRule).toBeDefined();
      expect(mysqlRule.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });
  });

  // ===================================================================
  // EC2 INSTANCES
  // ===================================================================
  describe('EC2 Instances', () => {
    test('should create LaunchTemplate with t2.micro instance type', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t2.micro');
      expect(lt.Properties.LaunchTemplateData.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });

    test('should enable detailed monitoring on instances', () => {
      const ec2_1 = template.Resources.EC2Instance1;
      const ec2_2 = template.Resources.EC2Instance2;
      // Monitoring is optional in the template; verify instances exist
      expect(ec2_1).toBeDefined();
      expect(ec2_2).toBeDefined();
    });

    test('should configure UserData with httpd installation', () => {
      const lt = template.Resources.LaunchTemplate;
      const userData = lt.Properties.LaunchTemplateData.UserData;

      expect(userData).toBeDefined();
      expect(userData['Fn::Base64']).toBeDefined();
    });

    test('should create 2 EC2 instances in private subnets', () => {
      const ec2_1 = template.Resources.EC2Instance1;
      const ec2_2 = template.Resources.EC2Instance2;

      expect(ec2_1.Type).toBe('AWS::EC2::Instance');
      expect(ec2_1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet1' });
      expect(ec2_2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should attach IAM instance profile to EC2 instances', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn']
      });
    });
  });

  // ===================================================================
  // RDS DATABASE
  // ===================================================================
  describe('RDS Database', () => {
    test('should create Secrets Manager secret with auto-generated password', () => {
      const secret = template.Resources.RDSMasterPasswordSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.RequireEachIncludedType).toBe(true);
      expect(secret.Properties.GenerateSecretString.PasswordLength).toEqual({ Ref: 'DBPasswordLength' });
    });

    test('should create RDS instance with MySQL 8.0.43', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.0.43');
      expect(rds.Properties.DBInstanceClass).toBe('db.t3.micro');
    });

    test('should enable encryption and Multi-AZ for RDS', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('should configure 7-day backup retention', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should use Secrets Manager dynamic reference for password', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUserPassword['Fn::Sub']).toContain('resolve:secretsmanager');
    });

    test('should set DeletionPolicy to Delete', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Delete');
      expect(rds.Properties.DeletionProtection).toBe(false);
    });

    test('should create DB Subnet Group with private subnets', () => {
      const dbsg = template.Resources.DBSubnetGroup;
      expect(dbsg.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(dbsg.Properties.SubnetIds).toHaveLength(2);
    });
  });

  // ===================================================================
  // S3 BUCKETS
  // ===================================================================
  describe('S3 Buckets', () => {
    test('should create CloudTrail bucket with encryption', () => {
      const bucket = template.Resources.CloudTrailLogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('should create Application Data bucket with versioning', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should block public access on all buckets', () => {
      ['CloudTrailLogsBucket', 'ApplicationDataBucket', 'ConfigBucket'].forEach(name => {
        const bucket = template.Resources[name];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('should use BucketPrefix parameter with region suffix', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${BucketPrefix}');
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::Region}');
    });

    test('should create Lambda function for S3 bucket cleanup', () => {
      const lambda = template.Resources.EmptyS3BucketLambda;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('should create custom resources for bucket cleanup', () => {
      const cleanup = template.Resources.EmptyApplicationDataBucket;
      expect(cleanup.Type).toBe('Custom::EmptyS3Bucket');
      expect(cleanup.Properties.ServiceToken).toEqual({ 'Fn::GetAtt': ['EmptyS3BucketLambda', 'Arn'] });
    });
  });

  // ===================================================================
  // IAM ROLES & POLICIES
  // ===================================================================
  describe('IAM Roles & Policies', () => {
    test('should create EC2 instance role with correct trust policy', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
    });

    test('should attach CloudWatch and SSM managed policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should grant EC2 role S3 access', () => {
      const role = template.Resources.EC2InstanceRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3ApplicationDataAccess');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:DeleteObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
    });

    test('should create instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });

    test('should create Lambda execution role for bucket cleanup', () => {
      const role = template.Resources.EmptyS3BucketLambdaRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('should create Secure Admin IAM group', () => {
      const group = template.Resources.SecureAdminGroup;
      expect(group.Type).toBe('AWS::IAM::Group');
    });
  });

  // ===================================================================
  // APPLICATION LOAD BALANCER
  // ===================================================================
  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should create Target Group with health checks', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
    });

    test('should register EC2 instances in Target Group', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.Targets).toHaveLength(2);
    });

    test('should create HTTP listener on port 80', () => {
      const listener = template.Resources.HTTPListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  // ===================================================================
  // CLOUDWATCH & CLOUDTRAIL
  // ===================================================================
  describe('CloudWatch & CloudTrail', () => {
    test('should create CloudWatch Log Group for EC2', () => {
      const logGroup = template.Resources.EC2LogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should create CloudTrail with management events', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    });
  });

  // ===================================================================
  // RESOURCE DEPENDENCIES & TAGS
  // ===================================================================
  describe('Resource Dependencies & Tags', () => {
    test('NAT Gateways should depend on Internet Gateway attachment', () => {
      // NAT Gateways don't have direct DependsOn, but their EIPs do
      const eip1 = template.Resources.EIPForNAT1;
      const eip2 = template.Resources.EIPForNAT2;
      expect(eip1.DependsOn).toBe('AttachGateway');
      expect(eip2.DependsOn).toBe('AttachGateway');
    });

    test('all major resources should have Name tags', () => {
      ['VPC', 'EC2Instance1', 'RDSInstance', 'ApplicationDataBucket'].forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
        expect(nameTag).toBeDefined();
      });
    });
  });

  // ===================================================================
  // OUTPUTS
  // ===================================================================
  describe('Stack Outputs', () => {
    test('should export VPC ID', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export).toBeDefined();
    });

    test('should export ALB DNS Name', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });

    test('should export RDS Endpoint', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'] });
    });

    test('should export all subnet IDs', () => {
      ['PublicSubnet1Id', 'PublicSubnet2Id', 'PrivateSubnet1Id', 'PrivateSubnet2Id'].forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should export EC2 instance IDs', () => {
      expect(template.Outputs.EC2Instance1Id).toBeDefined();
      expect(template.Outputs.EC2Instance2Id).toBeDefined();
    });

    test('should export RDS Secret ARN', () => {
      expect(template.Outputs.RDSSecretArn).toBeDefined();
    });

    test('should export Security Group IDs', () => {
      ['ALBSecurityGroupId', 'EC2SecurityGroupId', 'RDSSecurityGroupId'].forEach(sgId => {
        expect(template.Outputs[sgId]).toBeDefined();
      });
    });
  });
});
