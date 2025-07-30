import fs from 'fs';
import path from 'path';

describe('Secure CloudFormation Stack Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Ensure the YAML template is converted to JSON before running tests.
    // Example command: cfn-flip < lib/tapstack.yml > lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        `Template file not found at ${templatePath}. Please convert the YAML template to JSON.`
      );
    }
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Metadata and Parameters', () => {
    test('should have correct CloudFormation format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain(
        'Secure multi-tier enterprise infrastructure'
      );
    });

    test('should define all required parameters with correct types and defaults', () => {
      const params = template.Parameters;
      expect(params.CompanyName).toBeDefined();
      expect(params.CompanyName.Type).toBe('String');

      expect(params.Environment).toBeDefined();
      expect(params.Environment.Type).toBe('String');
      expect(params.Environment.Default).toBe('production');

      expect(params.LatestAmiId).toBeDefined();
      expect(params.LatestAmiId.Type).toBe(
        'AWS::SSM::Parameter::Value<String>'
      );

      // Verify old parameters are removed
      expect(params.KeyPairName).toBeUndefined();
      expect(params.SSHAllowedCIDR).toBeUndefined();
      expect(params.NotificationEmail).toBeUndefined();
    });
  });

  describe('Networking Resources', () => {
    test('should create a VPC with correct CIDR block and tags', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should create two public and two private subnets', () => {
      const resources = template.Resources;
      const subnets = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::Subnet'
      );
      const publicSubnets = subnets.filter(
        (s: any) => s.Properties.MapPublicIpOnLaunch
      );
      const privateSubnets = subnets.filter(
        (s: any) => !s.Properties.MapPublicIpOnLaunch
      );

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);
    });

    test('should create an Internet Gateway and NAT Gateways', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });

    test('should configure route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();

      const defaultPublicRoute = template.Resources.DefaultPublicRoute;
      expect(defaultPublicRoute.Properties.GatewayId).toEqual({
        Ref: 'InternetGateway',
      });

      const defaultPrivateRoute1 = template.Resources.DefaultPrivateRoute1;
      expect(defaultPrivateRoute1.Properties.NatGatewayId).toEqual({
        Ref: 'NatGateway1',
      });
    });

    test('should have VPC Endpoints for SSM', () => {
      const resources = template.Resources;
      expect(resources.SSMEndpoint).toBeDefined();
      expect(resources.SSMMessagesEndpoint).toBeDefined();
      expect(resources.EC2MessagesEndpoint).toBeDefined();
      expect(resources.SSMEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });
  });

  describe('Security Configuration', () => {
    test('BastionSecurityGroup should not have any ingress rules', () => {
      const bastionSg = template.Resources.BastionSecurityGroup;
      expect(bastionSg).toBeDefined();
      expect(bastionSg.Properties.SecurityGroupIngress).toBeUndefined();
    });

    test('PrivateInstanceSecurityGroup should not have an SSH rule', () => {
      const privateSg = template.Resources.PrivateInstanceSecurityGroup;
      expect(privateSg).toBeDefined();
      const sshRule = privateSg.Properties.SecurityGroupIngress.find(
        (r: any) => r.FromPort === 22
      );
      expect(sshRule).toBeUndefined();
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create IAM roles with least-privilege policies', () => {
      const bastionRole = template.Resources.BastionHostRole;
      expect(bastionRole).toBeDefined();
      expect(bastionRole.Properties.ManagedPolicyArns).toHaveLength(2);

      const privateRole = template.Resources.PrivateInstanceRole;
      expect(privateRole).toBeDefined();
      expect(privateRole.Properties.Policies[0].PolicyName).toBe(
        'PrivateInstancePolicy'
      );
    });

    test('PrivateInstanceRole should have specific S3 permissions', () => {
      const privateRolePolicy =
        template.Resources.PrivateInstanceRole.Properties.Policies[0]
          .PolicyDocument.Statement;
      const s3Statement = privateRolePolicy.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      expect(s3Statement.Effect).toBe('Allow');
      expect(s3Statement.Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${ApplicationBucket}/*',
      });
    });
  });

  describe('Storage Resources', () => {
    test('should create S3 buckets with server-side encryption enabled', () => {
      const appBucket = template.Resources.ApplicationBucket;
      expect(appBucket).toBeDefined();
      const encryption =
        appBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );

      const loggingBucket = template.Resources.LoggingBucket;
      expect(loggingBucket).toBeDefined();
      const loggingEncryption =
        loggingBucket.Properties.BucketEncryption
          .ServerSideEncryptionConfiguration[0];
      expect(loggingEncryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    test('S3 buckets should block all public access', () => {
      const appBucketConfig =
        template.Resources.ApplicationBucket.Properties
          .PublicAccessBlockConfiguration;
      expect(appBucketConfig.BlockPublicAcls).toBe(true);
      expect(appBucketConfig.RestrictPublicBuckets).toBe(true);

      const loggingBucketConfig =
        template.Resources.LoggingBucket.Properties
          .PublicAccessBlockConfiguration;
      expect(loggingBucketConfig.BlockPublicAcls).toBe(true);
      expect(loggingBucketConfig.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Compute and Monitoring', () => {
    test('should create EC2 instances without a KeyName', () => {
      expect(template.Resources.BastionHost).toBeDefined();
      expect(template.Resources.BastionHost.Properties.KeyName).toBeUndefined();

      expect(template.Resources.PrivateInstance1).toBeDefined();
      expect(
        template.Resources.PrivateInstance1.Properties.KeyName
      ).toBeUndefined();
    });

    test('should create an SNS Topic for alarms', () => {
      expect(template.Resources.CPUAlarmTopic).toBeDefined();
      expect(template.Resources.CPUAlarmTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should create CloudWatch Alarms for CPU utilization on all instances', () => {
      const alarms = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBe(3);

      alarms.forEach((alarm: any) => {
        expect(alarm.Properties.MetricName).toBe('CPUUtilization');
        expect(alarm.Properties.Threshold).toBe(80);
        expect(alarm.Properties.ComparisonOperator).toBe(
          'GreaterThanThreshold'
        );
        expect(alarm.Properties.AlarmActions[0]).toEqual({
          Ref: 'CPUAlarmTopic',
        });
      });
    });
  });

  describe('Outputs', () => {
    test('should define all required stack outputs', () => {
      const outputs = template.Outputs;
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.BastionHostId).toBeDefined();
      expect(outputs.BastionHostPublicIP).toBeDefined();
      expect(outputs.ApplicationBucketName).toBeDefined();
      expect(outputs.LoggingBucketName).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
    });
  });
});
