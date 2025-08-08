import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;
  // Add declarations for the new variables
  let resources: any;
  let outputs: any;
  let parameters: any;

  // Replace the beforeAll block with the new schema and variable assignments
  beforeAll(() => {
    // This custom schema is required to correctly parse CloudFormation intrinsic functions
    const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: data => ({ Ref: data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: data => ({ 'Fn::GetAtt': data.split('.') }),
      }),
      // Add other intrinsic functions as needed for full coverage
      new yaml.Type('!Equals', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Equals': data }),
      }),
      new yaml.Type('!Not', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Not': data }),
      }),
      new yaml.Type('!If', {
        kind: 'sequence',
        construct: data => ({ 'Fn::If': data }),
      }),
      new yaml.Type('!Join', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Join': data }),
      }),
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Select': data }),
      }),
      // FIX: Add the missing !GetAZs function to the schema
      new yaml.Type('!GetAZs', {
        kind: 'scalar',
        construct: data => ({ 'Fn::GetAZs': data }),
      }),
    ]);
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
    resources = template.Resources;
    outputs = template.Outputs;
    parameters = template.Parameters;
  });

  // --- 1. Parameters and Conditions ---
  describe('Parameters and Conditions', () => {
    test('should define all required parameters', () => {
      expect(parameters.ProjectName).toBeDefined();
      expect(parameters.Environment).toBeDefined();
      expect(parameters.EnvironmentSuffix).toBeDefined();
      expect(parameters.AdminCidrIp).toBeDefined();
      expect(parameters.PeerVpcId).toBeDefined();
    });

    test('should have a valid regex pattern for AdminCidrIp', () => {
      const cidrPattern = parameters.AdminCidrIp.AllowedPattern;
      expect(cidrPattern).toBe(
        '(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(\\d{1,2})'
      );
    });

    test('should define the IsPrimaryRegion condition correctly', () => {
      const condition = template.Conditions.IsPrimaryRegion;
      expect(condition).toEqual({
        'Fn::Equals': [{ Ref: 'AWS::Region' }, 'us-east-1'],
      });
    });
  });

  // --- 2. Networking ---
  describe('Networking Resources', () => {
    test('VPC should have DNS support and hostnames enabled', () => {
      const vpc = resources.VPC;
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('PublicRouteTable should have a default route to the Internet Gateway', () => {
      const publicRoute = resources.PublicRoute;
      expect(publicRoute.Properties.RouteTableId).toEqual({
        Ref: 'PublicRouteTable',
      });
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({
        Ref: 'InternetGateway',
      });
    });

    test('PrivateRouteTable should have a default route to the NAT Gateway', () => {
      const privateRoute = resources.PrivateRoute;
      expect(privateRoute.Properties.RouteTableId).toEqual({
        Ref: 'PrivateRouteTable',
      });
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({
        Ref: 'NatGateway',
      });
    });
  });

  // --- 3. Security and Encryption ---
  describe('Security and Encryption', () => {
    test('KMSKey should have key rotation enabled', () => {
      const kmsKey = resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('RDSSecurityGroupIngress should only allow traffic from the EC2SecurityGroup', () => {
      const ingressRule = resources.RDSSecurityGroupIngress;
      expect(ingressRule.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ingressRule.Properties.GroupId).toEqual({
        Ref: 'RDSSecurityGroup',
      });
      expect(ingressRule.Properties.SourceSecurityGroupId).toEqual({
        Ref: 'EC2SecurityGroup',
      });
      expect(ingressRule.Properties.IpProtocol).toBe('tcp');
      expect(ingressRule.Properties.FromPort).toBe(5432);
    });

    test('BastionSecurityGroup should use the AdminCidrIp parameter for ingress', () => {
      const bastionSg = resources.BastionSecurityGroup;
      const ingressRule = bastionSg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.CidrIp).toEqual({ Ref: 'AdminCidrIp' });
      expect(ingressRule.FromPort).toBe(22);
    });
  });

  // --- 4. IAM Least Privilege ---
  describe('IAM Least Privilege', () => {
    test('EC2InstanceRole should trust the EC2 service', () => {
      const role = resources.EC2InstanceRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(trustPolicy.Effect).toBe('Allow');
      expect(trustPolicy.Principal.Service).toContain('ec2.amazonaws.com');
      expect(trustPolicy.Action).toContain('sts:AssumeRole');
    });

    test('EC2InstanceRole should contain a specific inline policy for S3 and KMS', () => {
      const role = resources.EC2InstanceRole;
      const inlinePolicy = role.Properties.Policies[0];
      expect(inlinePolicy.PolicyName).toBe('S3AndKMSAccess');
      expect(JSON.stringify(inlinePolicy.PolicyDocument)).toMatch(
        /s3:GetObject/
      );
      expect(JSON.stringify(inlinePolicy.PolicyDocument)).toMatch(
        /kms:Decrypt/
      );
    });

    test('EC2InstanceRole should attach the AmazonSSMManagedInstanceCore policy', () => {
      const role = resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });
  });

  // --- 5. Core Compute and Data Resources ---
  describe('Core Resources Configuration', () => {
    test('EC2 AppServerInstance should use an SSM parameter for its AMI and be encrypted', () => {
      const instance = resources.AppServerInstance;
      const ebs = instance.Properties.BlockDeviceMappings[0].Ebs;

      expect(instance.Properties.ImageId).toBe(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );
      expect(ebs.Encrypted).toBe(true);
      expect(ebs.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('RDS PrimaryDBInstance should have encryption and deletion protection enabled', () => {
      const db = resources.PrimaryDBInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.DeletionProtection).toBe(true);
      expect(db.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('RDS DBParameterGroup should force SSL connections', () => {
      const paramGroup = resources.DBParameterGroup;
      expect(paramGroup.Properties.Parameters['rds.force_ssl']).toBe('1');
    });

    test('RDS PrimaryDBInstance should have Performance Insights enabled with KMS', () => {
      const db = resources.PrimaryDBInstance;
      expect(db.Properties.EnablePerformanceInsights).toBe(true);
      expect(db.Properties.PerformanceInsightsKMSKeyId).toEqual({
        Ref: 'KMSKey',
      });
    });

    test('S3 DataBucket should enforce KMS encryption and block all public access', () => {
      const bucket = resources.DataBucket;
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'aws:kms'
      );
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
    });

    test('S3 DataBucket and CloudTrailLogBucket should have versioning enabled', () => {
      const dataBucket = resources.DataBucket;
      const trailBucket = resources.CloudTrailLogBucket;
      expect(dataBucket.Properties.VersioningConfiguration.Status).toBe(
        'Enabled'
      );
      expect(trailBucket.Properties.VersioningConfiguration.Status).toBe(
        'Enabled'
      );
    });
  });

  // --- 6. Logging and Monitoring ---
  describe('Logging and Monitoring', () => {
    test('CloudTrail should be a multi-region trail that includes global events', () => {
      const trail = resources.CloudTrail;
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    });

    test('CloudTrailLogBucket should enforce BucketOwnerEnforced ownership to disable ACLs', () => {
      const bucket = resources.CloudTrailLogBucket;
      expect(bucket.Properties.OwnershipControls.Rules[0].ObjectOwnership).toBe(
        'BucketOwnerEnforced'
      );
    });

    test('VPCFlowLogs should log all traffic to a CloudWatch Log Group', () => {
      const flowLog = resources.VPCFlowLogs;
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });
  });

  // --- 7. Outputs ---
  describe('Stack Outputs', () => {
    test('should define and export key infrastructure outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.EC2InstanceId).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.DataBucketName).toBeDefined();
    });

    test('should define and export the StackName and EnvironmentSuffix outputs', () => {
      const stackNameOutput = outputs.StackName;
      const envSuffixOutput = outputs.EnvironmentSuffix;

      expect(stackNameOutput).toBeDefined();
      expect(stackNameOutput.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });

      expect(envSuffixOutput).toBeDefined();
      expect(envSuffixOutput.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
      });
    });
  });
});
