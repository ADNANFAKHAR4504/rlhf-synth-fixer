import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

let template: Template;

beforeAll(() => {
  const templatePath = path.join(__dirname, '../lib/TapStack.json');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const parsedTemplate = JSON.parse(templateContent);
  template = Template.fromJSON(parsedTemplate);
});

describe('Production Infrastructure Stack Tests', () => {
  test('VPC has DNS support and hostnames enabled', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      EnableDnsSupport: true,
      EnableDnsHostnames: true,
    });
  });

  test('Creates 4 subnets (2 public, 2 private)', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 4);
  });

  test('Internet Gateway attached to VPC', () => {
    template.hasResource('AWS::EC2::VPCGatewayAttachment', {
      Properties: {
        InternetGatewayId: { Ref: 'InternetGateway' },
      },
    });
  });

  test('NAT Gateway created with Elastic IP', () => {
    template.hasResource('AWS::EC2::NatGateway', {
      Properties: {
        SubnetId: { Ref: 'PublicSubnet1' },
      },
    });
    template.hasResource('AWS::EC2::EIP', {});
  });

  test('Public route uses Internet Gateway', () => {
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      GatewayId: { Ref: 'InternetGateway' },
    });
  });

  test('Private route uses NAT Gateway', () => {
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      NatGatewayId: { Ref: 'NatGateway' },
    });
  });

  test('AppData bucket is secure and encrypted', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true,
      },
      OwnershipControls: {
        Rules: [{ ObjectOwnership: 'BucketOwnerEnforced' }],
      },
    });
  });

  test('CloudTrail bucket policy denies non-SSL access', () => {
    const templateJson = template.toJSON();
    const cloudTrailBucketPolicy = Object.values(templateJson.Resources).find(
      (res: any) =>
        (res as any).Type === 'AWS::S3::BucketPolicy' &&
        (res as any).Properties.Bucket.Ref === 'CloudTrailBucket'
    ) as any;

    expect(cloudTrailBucketPolicy).toBeDefined();

    const statements = cloudTrailBucketPolicy.Properties.PolicyDocument.Statement;
    const denyNonSSL = statements.find(
      (stmt: any) =>
        stmt.Effect === 'Deny' &&
        stmt.Condition?.Bool?.['aws:SecureTransport'] === false
    );

    expect(denyNonSSL).toBeDefined();
  });

  test('IAM Role includes expected S3 permissions', () => {
    const templateJson = template.toJSON();
    const iamRole = Object.values(templateJson.Resources).find(
      (res: any) => (res as any).Type === 'AWS::IAM::Role'
    ) as any;

    expect(iamRole).toBeDefined();

    const statements = iamRole.Properties.Policies?.[0]?.PolicyDocument?.Statement || [];

    const s3Access = statements.find((stmt: any) =>
      stmt.Effect === 'Allow' &&
      Array.isArray(stmt.Action) &&
      stmt.Action.includes('s3:GetObject') &&
      stmt.Action.includes('s3:PutObject') &&
      stmt.Action.includes('s3:ListBucket')
    );

    expect(s3Access).toBeDefined();
  });

  test('Security Group allows HTTPS from specific CIDR', () => {
    const templateJson = template.toJSON();
    const sg = Object.values(templateJson.Resources).find(
      (res: any) => (res as any).Type === 'AWS::EC2::SecurityGroup'
    ) as any;

    expect(sg).toBeDefined();

    const ingressRules = sg.Properties.SecurityGroupIngress || [];

    const httpsIngress = ingressRules.find((rule: any) =>
      rule.IpProtocol === 'tcp' &&
      rule.FromPort === 443 &&
      rule.ToPort === 443 &&
      rule.CidrIp === '203.0.113.0/24'
    );

    expect(httpsIngress).toBeDefined();
  });

  test('Security Group allows outbound on ports 80, 443, and 53', () => {
    const templateJson = template.toJSON();
    const sg = Object.values(templateJson.Resources).find(
      (res: any) => (res as any).Type === 'AWS::EC2::SecurityGroup'
    ) as any;

    expect(sg).toBeDefined();

    const egressRules = sg.Properties.SecurityGroupEgress || [];

    const ports = [80, 443, 53];

    ports.forEach(port => {
      const matchingRules = egressRules.filter(
        (rule: any) => rule.FromPort === port && rule.ToPort === port
      );
      expect(matchingRules.length).toBeGreaterThan(0);
    });
  });

  test('CloudTrail is enabled and configured', () => {
    template.hasResourceProperties('AWS::CloudTrail::Trail', {
      IsLogging: true,
      IsMultiRegionTrail: true,
      EnableLogFileValidation: true,
      IncludeGlobalServiceEvents: true,
    });
  });

  test('All expected outputs are present', () => {
    const outputs = template.toJSON().Outputs;
    const expectedOutputs = [
      'VPCId',
      'AppDataBucketName',
      'CloudTrailArn',
      'PublicSubnet1Id',
      'EC2SecurityGroupId',
    ];
    expectedOutputs.forEach(output => expect(outputs).toHaveProperty(output));
  });

  test('S3 buckets have Retain deletion policy', () => {
    const templateJson = template.toJSON();
    const s3Buckets = Object.entries(templateJson.Resources).filter(
      ([, res]) => (res as any).Type === 'AWS::S3::Bucket'
    );

    s3Buckets.forEach(([, resource]) => {
      const res = resource as any;
      expect(res.DeletionPolicy).toBe('Retain');
      expect(res.UpdateReplacePolicy).toBe('Retain');
    });
  });

  test('Environment parameter is correctly defined', () => {
    const parameters = template.toJSON().Parameters;
    expect(parameters['EnvironmentName']).toBeDefined();
    expect(parameters['EnvironmentName'].Type).toBe('String');
    expect(parameters['EnvironmentName'].AllowedValues).toEqual(
      expect.arrayContaining(['dev', 'stage', 'production'])
    );
  });
});
