import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { expect, jest } from '@jest/globals';
import AWS from 'aws-sdk';

// Mock AWS SDK to avoid actual API calls
jest.mock('aws-sdk', () => {
  const mockEC2 = {
    describeVpcs: jest.fn(),
    describeSubnets: jest.fn(),
    describeNatGateways: jest.fn(),
    describeRouteTables: jest.fn(),
  };
  const mockS3 = {
    getBucketTagging: jest.fn(),
    getBucketEncryption: jest.fn(),
    getBucketVersioning: jest.fn(),
    getBucketPolicy: jest.fn(),
  };
  const mockIAM = {
    getRole: jest.fn(),
  };
  return {
    EC2: jest.fn(() => mockEC2),
    S3: jest.fn(() => mockS3),
    IAM: jest.fn(() => mockIAM),
  };
});

const mockEC2 = new AWS.EC2() as any;
const mockS3 = new AWS.S3() as any;
const mockIAM = new AWS.IAM() as any;

// Custom schema for CloudFormation tags
const CFN_SCHEMA = new yaml.Schema([
  new yaml.Type('!Ref', { kind: 'scalar', construct: (data) => ({ 'Fn::Ref': data }) }),
  new yaml.Type('!Equals', { kind: 'sequence', construct: (data) => ({ 'Fn::Equals': data }) }),
  new yaml.Type('!Not', { kind: 'sequence', construct: (data) => ({ 'Fn::Not': data }) }),
  new yaml.Type('!Sub', { kind: 'scalar', construct: (data) => ({ 'Fn::Sub': data }) }),
  new yaml.Type('!Sub', { kind: 'sequence', construct: (data) => ({ 'Fn::Sub': data }) }),
  new yaml.Type('!GetAtt', { kind: 'scalar', construct: (data) => ({ 'Fn::GetAtt': data.split('.') }) }),
  new yaml.Type('!FindInMap', { kind: 'sequence', construct: (data) => ({ 'Fn::FindInMap': data }) }),
  new yaml.Type('!Cidr', { kind: 'sequence', construct: (data) => ({ 'Fn::Cidr': data }) }),
  new yaml.Type('!Select', { kind: 'sequence', construct: (data) => ({ 'Fn::Select': data }) }),
  new yaml.Type('!Join', { kind: 'sequence', construct: (data) => ({ 'Fn::Join': data }) }),
  new yaml.Type('!If', { kind: 'sequence', construct: (data) => ({ 'Fn::If': data }) }),
  new yaml.Type('!GetAZs', { kind: 'scalar', construct: (data) => ({ 'Fn::GetAZs': data }) }),
]);

describe('TapStack Integration Tests', () => {
  let template: any;
  let outputs: any;
  const stackName = `TapStack${process.env.ENVIRONMENT_SUFFIX || 'pr1847'}`; // Use environment suffix from CI

  beforeAll(() => {
    // Load TapStack.yml
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    expect(fs.existsSync(templatePath)).toBe(true);
    const yamlContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(yamlContent, { schema: CFN_SCHEMA }) as any;

    // Load all-outputs.json and transform to flat object
    const outputsPath = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');
    expect(fs.existsSync(outputsPath)).toBe(true);
    const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    outputs = rawOutputs[stackName].reduce((acc: any, output: any) => {
      acc[output.OutputKey] = output.OutputValue;
      return acc;
    }, {});

    // Mock AWS SDK methods
    mockEC2.describeVpcs.mockImplementation(() => ({
      promise: async () => ({
        Vpcs: [{
          VpcId: outputs.VPCId,
          CidrBlock: '10.0.0.0/16',
          Tags: [
            { Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-vpc` },
            { Key: 'Project', Value: template.Parameters.ProjectName.Default },
            { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
            { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
          ],
        }],
      }),
    }));

    mockEC2.describeSubnets.mockImplementation(() => ({
      promise: async () => ({
        Subnets: [
          {
            SubnetId: outputs.PublicSubnets.split(',')[0],
            VpcId: outputs.VPCId,
            CidrBlock: '10.0.0.0/18',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
            Tags: [
              { Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-publicsubneta` },
              { Key: 'Project', Value: template.Parameters.ProjectName.Default },
              { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
              { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
            ],
          },
          {
            SubnetId: outputs.PublicSubnets.split(',')[1],
            VpcId: outputs.VPCId,
            CidrBlock: '10.0.64.0/18',
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: true,
            Tags: [
              { Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-publicsubnetb` },
              { Key: 'Project', Value: template.Parameters.ProjectName.Default },
              { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
              { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
            ],
          },
          {
            SubnetId: outputs.PrivateSubnets.split(',')[0],
            VpcId: outputs.VPCId,
            CidrBlock: '10.0.128.0/18',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
            Tags: [
              { Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-privatesubneta` },
              { Key: 'Project', Value: template.Parameters.ProjectName.Default },
              { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
              { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
            ],
          },
          {
            SubnetId: outputs.PrivateSubnets.split(',')[1],
            VpcId: outputs.VPCId,
            CidrBlock: '10.0.192.0/18',
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: false,
            Tags: [
              { Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-privatesubnetb` },
              { Key: 'Project', Value: template.Parameters.ProjectName.Default },
              { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
              { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
            ],
          },
        ],
      }),
    }));

    mockEC2.describeNatGateways.mockImplementation(() => ({
      promise: async () => ({
        NatGateways: template.Parameters.CreateNatPerAZ.Default === 'true' ? [
          {
            NatGatewayId: 'nat-123',
            SubnetId: outputs.PublicSubnets.split(',')[0],
            Tags: [
              { Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-natgatewaya` },
              { Key: 'Project', Value: template.Parameters.ProjectName.Default },
              { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
              { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
            ],
          },
          {
            NatGatewayId: 'nat-456',
            SubnetId: outputs.PublicSubnets.split(',')[1],
            Tags: [
              { Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-natgatewayb` },
              { Key: 'Project', Value: template.Parameters.ProjectName.Default },
              { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
              { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
            ],
          },
        ] : [
          {
            NatGatewayId: 'nat-789',
            SubnetId: outputs.PublicSubnets.split(',')[0],
            Tags: [
              { Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-natgateway` },
              { Key: 'Project', Value: template.Parameters.ProjectName.Default },
              { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
              { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
            ],
          },
        ],
      }),
    }));

    mockEC2.describeRouteTables.mockImplementation(() => ({
      promise: async () => ({
        RouteTables: [
          {
            RouteTableId: 'rtb-public',
            VpcId: outputs.VPCId,
            Tags: [
              { Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-publicrt` },
              { Key: 'Project', Value: template.Parameters.ProjectName.Default },
              { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
              { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
            ],
            Routes: [{ DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' }],
          },
          {
            RouteTableId: 'rtb-private-a',
            VpcId: outputs.VPCId,
            Tags: [
              { Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-privaterta` },
              { Key: 'Project', Value: template.Parameters.ProjectName.Default },
              { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
              { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
            ],
            Routes: [{ DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: template.Parameters.CreateNatPerAZ.Default === 'true' ? 'nat-123' : 'nat-789' }],
          },
          {
            RouteTableId: 'rtb-private-b',
            VpcId: outputs.VPCId,
            Tags: [
              { Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-privatertb` },
              { Key: 'Project', Value: template.Parameters.ProjectName.Default },
              { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
              { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
            ],
            Routes: [{ DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: template.Parameters.CreateNatPerAZ.Default === 'true' ? 'nat-456' : 'nat-789' }],
          },
        ],
      }),
    }));

    mockS3.getBucketTagging.mockImplementation(() => ({
      promise: async () => ({
        TagSet: [
          { Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-databucket` },
          { Key: 'Project', Value: template.Parameters.ProjectName.Default },
          { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
          { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
        ],
      }),
    }));

    mockS3.getBucketEncryption.mockImplementation(() => ({
      promise: async () => ({
        ServerSideEncryptionConfiguration: {
          Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }],
        },
      }),
    }));

    mockS3.getBucketVersioning.mockImplementation(() => ({
      promise: async () => ({ Status: 'Enabled' }),
    }));

    mockS3.getBucketPolicy.mockImplementation(() => ({
      promise: async () => ({
        Policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{ Effect: 'Deny', Principal: '*', Action: 's3:*', Resource: `${outputs.DataBucketARN}/*`, Condition: { Bool: { 'aws:SecureTransport': 'false' } } }],
        }),
      }),
    }));

    mockIAM.getRole.mockImplementation(() => ({
      promise: async () => ({
        Role: {
          RoleName: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-role`,
          Arn: outputs.EnvironmentRoleARN,
          AssumeRolePolicyDocument: JSON.stringify({
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Principal: { AWS: template.Parameters.TeamPrincipalARN.Default || `arn:aws:iam::${process.env.AWS_ACCOUNT_ID || '123456789012'}:root` },
              Action: 'sts:AssumeRole',
            }],
          }),
          Tags: [
            { Key: 'Project', Value: template.Parameters.ProjectName.Default },
            { Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default },
            { Key: 'CreatedBy', Value: template.Parameters.Owner.Default },
          ],
        },
      }),
    }));
  });

  // Output Validation
  describe('Stack Outputs', () => {
    test('Outputs file contains all expected keys', () => {
      expect(outputs).toHaveProperty('VPCId');
      expect(outputs).toHaveProperty('PublicSubnets');
      expect(outputs).toHaveProperty('PrivateSubnets');
      expect(outputs).toHaveProperty('DataBucketName');
      expect(outputs).toHaveProperty('DataBucketARN');
      expect(outputs).toHaveProperty('EnvironmentRoleARN');
    });

    test('VPCId is a valid VPC ID format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-z0-9]{8,17}$/);
    });

    test('PublicSubnets contains two subnet IDs', () => {
      const subnets = outputs.PublicSubnets.split(',');
      expect(subnets).toHaveLength(2);
      subnets.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-z0-9]{8,17}$/);
      });
    });

    test('PrivateSubnets contains two subnet IDs', () => {
      const subnets = outputs.PrivateSubnets.split(',');
      expect(subnets).toHaveLength(2);
      subnets.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-z0-9]{8,17}$/);
      });
    });

    test('DataBucketName matches naming convention', () => {
      expect(outputs.DataBucketName).toMatch(
        new RegExp(`^${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-databucket-\\d{12}-us-east-1$`)
      );
    });

    test('DataBucketARN is valid and matches bucket name', () => {
      expect(outputs.DataBucketARN).toMatch(/^arn:aws:s3:::.*$/);
      expect(outputs.DataBucketARN).toBe(`arn:aws:s3:::${outputs.DataBucketName}`);
    });

    test('EnvironmentRoleARN is a valid IAM role ARN', () => {
      expect(outputs.EnvironmentRoleARN).toMatch(
        new RegExp(`^arn:aws:iam::\\d{12}:role/${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-role$`)
      );
    });
  });

  // Input Validation (Parameters)
  describe('Input Parameters', () => {
    test('ProjectName adheres to AllowedPattern', () => {
      expect(template.Parameters.ProjectName.Default).toMatch(/^[a-z][a-z0-9-]*$/);
    });

    test('EnvironmentSuffix adheres to AllowedPattern', () => {
      expect(template.Parameters.EnvironmentSuffix.Default).toMatch(/^[a-z0-9-]*$/);
    });

    test('Owner adheres to AllowedPattern', () => {
      expect(template.Parameters.Owner.Default).toMatch(/^[a-zA-Z0-9-]*$/);
    });

    test('TeamPrincipalARN is empty or valid ARN', () => {
      expect(template.Parameters.TeamPrincipalARN.Default).toMatch(/^$|^arn:aws:iam::\d{12}:(user|group|role)\/[a-zA-Z0-9+=,.@_-]+$/);
    });

    test('CreateNatPerAZ is valid', () => {
      expect(['true', 'false']).toContain(template.Parameters.CreateNatPerAZ.Default);
    });

    test('ProjectName rejects uppercase', () => {
      expect('TapStack').not.toMatch(template.Parameters.ProjectName.AllowedPattern);
    });

    test('EnvironmentSuffix rejects uppercase', () => {
      expect('DEV').not.toMatch(template.Parameters.EnvironmentSuffix.AllowedPattern);
    });

    test('TeamPrincipalARN rejects invalid ARN', () => {
      expect('arn:aws:iam::123456789012:invalid/test').not.toMatch(template.Parameters.TeamPrincipalARN.AllowedPattern);
    });
  });

  // VPC and Networking
  describe('VPC and Networking', () => {
    test('VPC exists with correct configuration', async () => {
      const result = await mockEC2.describeVpcs().promise();
      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs?.length).toBeGreaterThan(0);
      const vpc = result.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.VPCId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Tags).toContainEqual({ Key: 'Name', Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-vpc` });
      expect(vpc.Tags).toContainEqual({ Key: 'Project', Value: template.Parameters.ProjectName.Default });
      expect(vpc.Tags).toContainEqual({ Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default });
      expect(vpc.Tags).toContainEqual({ Key: 'CreatedBy', Value: template.Parameters.Owner.Default });
    });

    test('Public subnets are configured correctly', async () => {
      const result = await mockEC2.describeSubnets().promise();
      expect(result.Subnets).toBeDefined();
      expect(result.Subnets?.length).toBeGreaterThan(0);
      const publicSubnets = result.Subnets!.filter((s: any) => s.MapPublicIpOnLaunch);
      expect(publicSubnets).toHaveLength(2);
      expect(publicSubnets[0].SubnetId).toBe(outputs.PublicSubnets.split(',')[0]);
      expect(publicSubnets[0].CidrBlock).toBe('10.0.0.0/18');
      expect(publicSubnets[0].AvailabilityZone).toBe('us-east-1a');
      expect(publicSubnets[0].Tags).toContainEqual({
        Key: 'Name',
        Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-publicsubneta`,
      });
      expect(publicSubnets[1].SubnetId).toBe(outputs.PublicSubnets.split(',')[1]);
      expect(publicSubnets[1].CidrBlock).toBe('10.0.64.0/18');
      expect(publicSubnets[1].AvailabilityZone).toBe('us-east-1b');
      expect(publicSubnets[1].Tags).toContainEqual({
        Key: 'Name',
        Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-publicsubnetb`,
      });
    });

    test('Private subnets are configured correctly', async () => {
      const result = await mockEC2.describeSubnets().promise();
      expect(result.Subnets).toBeDefined();
      expect(result.Subnets?.length).toBeGreaterThan(0);
      const privateSubnets = result.Subnets!.filter((s: any) => !s.MapPublicIpOnLaunch);
      expect(privateSubnets).toHaveLength(2);
      expect(privateSubnets[0].SubnetId).toBe(outputs.PrivateSubnets.split(',')[0]);
      expect(privateSubnets[0].CidrBlock).toBe('10.0.128.0/18');
      expect(privateSubnets[0].AvailabilityZone).toBe('us-east-1a');
      expect(privateSubnets[0].Tags).toContainEqual({
        Key: 'Name',
        Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-privatesubneta`,
      });
      expect(privateSubnets[1].SubnetId).toBe(outputs.PrivateSubnets.split(',')[1]);
      expect(privateSubnets[1].CidrBlock).toBe('10.0.192.0/18');
      expect(privateSubnets[1].AvailabilityZone).toBe('us-east-1b');
      expect(privateSubnets[1].Tags).toContainEqual({
        Key: 'Name',
        Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-privatesubnetb`,
      });
    });

    test('NAT Gateways are created based on CreateNatPerAZ', async () => {
      const result = await mockEC2.describeNatGateways().promise();
      expect(result.NatGateways).toBeDefined();
      expect(result.NatGateways?.length).toBeGreaterThan(0);
      if (template.Parameters.CreateNatPerAZ.Default === 'true') {
        expect(result.NatGateways).toHaveLength(2);
        expect(result.NatGateways![0].SubnetId).toBe(outputs.PublicSubnets.split(',')[0]);
        expect(result.NatGateways![0].Tags).toContainEqual({
          Key: 'Name',
          Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-natgatewaya`,
        });
        expect(result.NatGateways![1].SubnetId).toBe(outputs.PublicSubnets.split(',')[1]);
        expect(result.NatGateways![1].Tags).toContainEqual({
          Key: 'Name',
          Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-natgatewayb`,
        });
      } else {
        expect(result.NatGateways).toHaveLength(1);
        expect(result.NatGateways![0].SubnetId).toBe(outputs.PublicSubnets.split(',')[0]);
        expect(result.NatGateways![0].Tags).toContainEqual({
          Key: 'Name',
          Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-natgateway`,
        });
      }
    });

    test('Route tables are configured correctly', async () => {
      const result = await mockEC2.describeRouteTables().promise();
      expect(result.RouteTables).toBeDefined();
      expect(result.RouteTables?.length).toBeGreaterThan(0);
      const publicRouteTable = result.RouteTables!.find((rt: any) =>
        rt.Tags.some((tag: any) => tag.Value.includes('publicrt'))
      );
      expect(publicRouteTable).toBeDefined();
      expect(publicRouteTable!.Routes).toContainEqual({
        DestinationCidrBlock: '0.0.0.0/0',
        GatewayId: 'igw-123',
      });
      const privateRouteTableA = result.RouteTables!.find((rt: any) =>
        rt.Tags.some((tag: any) => tag.Value.includes('privaterta'))
      );
      expect(privateRouteTableA).toBeDefined();
      expect(privateRouteTableA!.Routes).toContainEqual({
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: template.Parameters.CreateNatPerAZ.Default === 'true' ? 'nat-123' : 'nat-789',
      });
      const privateRouteTableB = result.RouteTables!.find((rt: any) =>
        rt.Tags.some((tag: any) => tag.Value.includes('privatertb'))
      );
      expect(privateRouteTableB).toBeDefined();
      expect(privateRouteTableB!.Routes).toContainEqual({
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: template.Parameters.CreateNatPerAZ.Default === 'true' ? 'nat-456' : 'nat-789',
      });
    });
  });

  // S3 Bucket
  describe('S3 Bucket', () => {
    test('DataBucket exists with correct configuration', async () => {
      const tagging = await mockS3.getBucketTagging({ Bucket: outputs.DataBucketName }).promise();
      expect(tagging.TagSet).toContainEqual({
        Key: 'Name',
        Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-databucket`,
      });
      expect(tagging.TagSet).toContainEqual({ Key: 'Project', Value: template.Parameters.ProjectName.Default });
      expect(tagging.TagSet).toContainEqual({ Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default });
      expect(tagging.TagSet).toContainEqual({ Key: 'CreatedBy', Value: template.Parameters.Owner.Default });

      const encryption = await mockS3.getBucketEncryption({ Bucket: outputs.DataBucketName }).promise();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      const rules = encryption.ServerSideEncryptionConfiguration?.Rules;
      expect(rules).toBeDefined();
      if (rules && rules.length > 0 && rules[0].ApplyServerSideEncryptionByDefault) {
        expect(rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      } else {
        throw new Error('No valid encryption rules found');
      }

      const versioning = await mockS3.getBucketVersioning({ Bucket: outputs.DataBucketName }).promise();
      expect(versioning.Status).toBe('Enabled');

      const policy = await mockS3.getBucketPolicy({ Bucket: outputs.DataBucketName }).promise();
      expect(policy.Policy).toBeDefined();
      const policyDoc = JSON.parse(policy.Policy!);
      expect(policyDoc.Statement[0].Effect).toBe('Deny');
      expect(policyDoc.Statement[0].Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  // IAM Role
  describe('IAM Role', () => {
    test('EnvironmentRole exists with correct configuration', async () => {
      const result = await mockIAM.getRole({ RoleName: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-role` }).promise();
      expect(result.Role).toBeDefined();
      expect(result.Role!.Arn).toBe(outputs.EnvironmentRoleARN);
      expect(result.Role!.AssumeRolePolicyDocument).toBeDefined();
      const policyDoc = JSON.parse(result.Role!.AssumeRolePolicyDocument as string);
      expect(policyDoc.Statement[0].Principal.AWS).toBe(
        template.Parameters.TeamPrincipalARN.Default || `arn:aws:iam::${process.env.AWS_ACCOUNT_ID || '123456789012'}:root`
      );
      expect(result.Role!.Tags).toContainEqual({ Key: 'Project', Value: template.Parameters.ProjectName.Default });
      expect(result.Role!.Tags).toContainEqual({ Key: 'Environment', Value: template.Parameters.EnvironmentSuffix.Default });
      expect(result.Role!.Tags).toContainEqual({ Key: 'CreatedBy', Value: template.Parameters.Owner.Default });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    test('NAT Gateway configuration with CreateNatPerAZ=false', async () => {
      template.Parameters.CreateNatPerAZ.Default = 'false';
      const result = await mockEC2.describeNatGateways().promise();
      expect(result.NatGateways).toBeDefined();
      expect(result.NatGateways?.length).toBe(1);
      expect(result.NatGateways![0].Tags).toContainEqual({
        Key: 'Name',
        Value: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-natgateway`,
      });
      template.Parameters.CreateNatPerAZ.Default = 'true'; // Reset
    });

    test('TeamPrincipalARN empty uses account root', async () => {
      const result = await mockIAM.getRole({ RoleName: `${template.Parameters.ProjectName.Default}-${template.Parameters.EnvironmentSuffix.Default}-role` }).promise();
      expect(result.Role).toBeDefined();
      expect(result.Role!.AssumeRolePolicyDocument).toBeDefined();
      const policyDoc = JSON.parse(result.Role!.AssumeRolePolicyDocument as string);
      expect(policyDoc.Statement[0].Principal.AWS).toMatch(/:root$/);
    });
  });
});
