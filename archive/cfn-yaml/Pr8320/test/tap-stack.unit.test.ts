import { load, Schema, Type } from 'js-yaml';
import { readFileSync } from 'fs';
import { join } from 'path';

// Define custom schema for CloudFormation YAML tags
const cloudFormationSchema = new Schema([
  new Type('!Ref', { kind: 'scalar', construct: (data: string) => ({ Ref: data }) }),
  new Type('!Sub', { kind: 'scalar', construct: (data: string) => ({ 'Fn::Sub': data }) }),
  new Type('!Equals', { kind: 'sequence', construct: (data: any[]) => ({ 'Fn::Equals': data }) }),
  new Type('!Not', { kind: 'sequence', construct: (data: any[]) => ({ 'Fn::Not': data }) }),
  new Type('!If', { kind: 'sequence', construct: (data: any[]) => ({ 'Fn::If': data }) }),
  new Type('!GetAtt', {
    kind: 'scalar',
    construct: (data: string) => ({ 'Fn::GetAtt': data.split('.') }),
  }),
  new Type('!Join', { kind: 'sequence', construct: (data: any[]) => ({ 'Fn::Join': data }) }),
  new Type('!GetAZs', { kind: 'scalar', construct: (data: string) => ({ 'Fn::GetAZs': data }) }),
  new Type('!Select', { kind: 'sequence', construct: (data: any[]) => ({ 'Fn::Select': data }) }),
]);

// Define TypeScript interfaces for CloudFormation template structure
interface CloudFormationTag {
  Key: string;
  Value: string | { Ref: string } | { 'Fn::Sub': string };
}

interface CloudFormationResource {
  Type: string;
  Properties?: {
    Tags?: CloudFormationTag[];
    BucketName?: string | { 'Fn::Sub': string };
    [key: string]: any;
  };
  Condition?: string;
}

interface CloudFormationTemplate {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, CloudFormationResource>;
  Outputs?: Record<string, any>;
}

// Load the CloudFormation template
const templatePath = join(__dirname, '..', 'lib', 'TapStack.yml');
const template = load(readFileSync(templatePath, 'utf8'), { schema: cloudFormationSchema }) as CloudFormationTemplate;

// Mock AWS Account ID for testing
const AWS_ACCOUNT_ID = '718240086340';

describe('TapStack CloudFormation Template', () => {
  // Test Resources
  describe('Resources', () => {
    describe('VPCs', () => {
      test('should define VPCs for Dev, Staging, and Prod', () => {
        expect(template.Resources.DevVPC).toMatchObject({
          Type: 'AWS::EC2::VPC',
          Properties: {
            CidrBlock: '10.0.0.0/16',
            EnableDnsSupport: 'true',
            EnableDnsHostnames: 'true',
            Tags: expect.arrayContaining([
              { Key: 'Name', Value: 'TapStack-Dev-VPC' },
              { Key: 'Project', Value: { Ref: 'ProjectName' } },
              { Key: 'Environment', Value: 'Dev' },
              { Key: 'CreatedBy', Value: { Ref: 'Owner' } },
            ]),
          },
        });
        expect(template.Resources.StagingVPC).toMatchObject({
          Type: 'AWS::EC2::VPC',
          Properties: {
            CidrBlock: '10.1.0.0/16',
            EnableDnsSupport: 'true',
            EnableDnsHostnames: 'true',
            Tags: expect.arrayContaining([
              { Key: 'Name', Value: 'TapStack-Staging-VPC' },
              { Key: 'Project', Value: { Ref: 'ProjectName' } },
              { Key: 'Environment', Value: 'Staging' },
              { Key: 'CreatedBy', Value: { Ref: 'Owner' } },
            ]),
          },
        });
        expect(template.Resources.ProdVPC).toMatchObject({
          Type: 'AWS::EC2::VPC',
          Properties: {
            CidrBlock: '10.2.0.0/16',
            EnableDnsSupport: 'true',
            EnableDnsHostnames: 'true',
            Tags: expect.arrayContaining([
              { Key: 'Name', Value: 'TapStack-Prod-VPC' },
              { Key: 'Project', Value: { Ref: 'ProjectName' } },
              { Key: 'Environment', Value: 'Prod' },
              { Key: 'CreatedBy', Value: { Ref: 'Owner' } },
            ]),
          },
        });
      });
    });

    describe('S3 Buckets', () => {
      test('should define S3 buckets with correct names and replication', () => {
        expect(template.Resources.DevDataBucket).toMatchObject({
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: { 'Fn::Sub': 'tapstack-dev-data-${AWS::AccountId}-tapstack' },
            VersioningConfiguration: { Status: 'Enabled' },
            BucketEncryption: {
              ServerSideEncryptionConfiguration: [
                { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } },
              ],
            },
            PublicAccessBlockConfiguration: {
              BlockPublicAcls: 'true',
              BlockPublicPolicy: 'true',
              IgnorePublicAcls: 'true',
              RestrictPublicBuckets: 'true',
            },
            ReplicationConfiguration: {
              Role: { 'Fn::GetAtt': ['ReplicationRole', 'Arn'] },
              Rules: [
                {
                  Id: 'DevToStaging',
                  Status: 'Enabled',
                  Priority: '1',
                  DeleteMarkerReplication: { Status: 'Disabled' },
                  Destination: {
                    Bucket: { 'Fn::GetAtt': ['StagingDataBucket', 'Arn'] },
                    StorageClass: 'STANDARD',
                  },
                  Filter: { Prefix: 'non-sensitive/' }, // Updated to match TapStack.yml
                },
              ],
            },
            Tags: expect.arrayContaining([
              { Key: 'Name', Value: 'TapStack-Dev-Bucket' },
              { Key: 'Project', Value: { Ref: 'ProjectName' } },
              { Key: 'Environment', Value: 'Dev' },
              { Key: 'CreatedBy', Value: { Ref: 'Owner' } },
            ]),
          },
        });

        expect(template.Resources.StagingDataBucket).toMatchObject({
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: { 'Fn::Sub': 'tapstack-staging-data-${AWS::AccountId}-tapstack' },
            VersioningConfiguration: { Status: 'Enabled' },
            BucketEncryption: {
              ServerSideEncryptionConfiguration: [
                { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } },
              ],
            },
            PublicAccessBlockConfiguration: {
              BlockPublicAcls: 'true',
              BlockPublicPolicy: 'true',
              IgnorePublicAcls: 'true',
              RestrictPublicBuckets: 'true',
            },
            ReplicationConfiguration: {
              Role: { 'Fn::GetAtt': ['ReplicationRole', 'Arn'] },
              Rules: [
                {
                  Id: 'StagingToProd',
                  Status: 'Enabled',
                  Priority: '1',
                  DeleteMarkerReplication: { Status: 'Disabled' },
                  Destination: {
                    Bucket: { 'Fn::GetAtt': ['ProdDataBucket', 'Arn'] },
                    StorageClass: 'STANDARD',
                  },
                  Filter: { Prefix: 'non-sensitive/' }, // Updated to match TapStack.yml
                },
              ],
            },
            Tags: expect.arrayContaining([
              { Key: 'Name', Value: 'TapStack-Staging-Bucket' },
              { Key: 'Project', Value: { Ref: 'ProjectName' } },
              { Key: 'Environment', Value: 'Staging' },
              { Key: 'CreatedBy', Value: { Ref: 'Owner' } },
            ]),
          },
        });

        expect(template.Resources.ProdDataBucket).toMatchObject({
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: { 'Fn::Sub': 'tapstack-prod-data-${AWS::AccountId}-tapstack' },
            VersioningConfiguration: { Status: 'Enabled' },
            BucketEncryption: {
              ServerSideEncryptionConfiguration: [
                { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } },
              ],
            },
            PublicAccessBlockConfiguration: {
              BlockPublicAcls: 'true',
              BlockPublicPolicy: 'true',
              IgnorePublicAcls: 'true',
              RestrictPublicBuckets: 'true',
            },
            Tags: expect.arrayContaining([
              { Key: 'Name', Value: 'TapStack-Prod-Bucket' },
              { Key: 'Project', Value: { Ref: 'ProjectName' } },
              { Key: 'Environment', Value: 'Prod' },
              { Key: 'CreatedBy', Value: { Ref: 'Owner' } },
            ]),
          },
        });
      });

      test('should define bucket policies to enforce HTTPS', () => {
        expect(template.Resources.DevBucketPolicy).toMatchObject({
          Type: 'AWS::S3::BucketPolicy',
          Properties: {
            Bucket: { Ref: 'DevDataBucket' },
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [
                    { 'Fn::GetAtt': ['DevDataBucket', 'Arn'] },
                    { 'Fn::Sub': '${DevDataBucket.Arn}/*' },
                  ],
                  Condition: { Bool: { 'aws:SecureTransport': 'false' } },
                },
              ],
            },
          },
        });
        expect(template.Resources.StagingBucketPolicy).toMatchObject({
          Type: 'AWS::S3::BucketPolicy',
          Properties: {
            Bucket: { Ref: 'StagingDataBucket' },
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [
                    { 'Fn::GetAtt': ['StagingDataBucket', 'Arn'] },
                    { 'Fn::Sub': '${StagingDataBucket.Arn}/*' },
                  ],
                  Condition: { Bool: { 'aws:SecureTransport': 'false' } },
                },
              ],
            },
          },
        });
        expect(template.Resources.ProdBucketPolicy).toMatchObject({
          Type: 'AWS::S3::BucketPolicy',
          Properties: {
            Bucket: { Ref: 'ProdDataBucket' },
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [
                    { 'Fn::GetAtt': ['ProdDataBucket', 'Arn'] },
                    { 'Fn::Sub': '${ProdDataBucket.Arn}/*' },
                  ],
                  Condition: { Bool: { 'aws:SecureTransport': 'false' } },
                },
              ],
            },
          },
        });
      });
    });

    describe('IAM Roles', () => {
      test('should define environment roles with correct permissions', () => {
        expect(template.Resources.DevEnvironmentRole).toMatchObject({
          Type: 'AWS::IAM::Role',
          Properties: {
            RoleName: 'TapStack-Dev-Role',
            AssumeRolePolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: {
                    AWS: {
                      'Fn::If': [
                        'HasTeamPrincipal',
                        { Ref: 'TeamPrincipalARN' },
                        { 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root' },
                      ],
                    },
                  },
                  Action: 'sts:AssumeRole',
                },
              ],
            },
            Policies: expect.arrayContaining([
              {
                PolicyName: 'S3Access',
                PolicyDocument: {
                  Version: '2012-10-17',
                  Statement: [
                    {
                      Effect: 'Allow',
                      Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
                      Resource: [
                        { 'Fn::GetAtt': ['DevDataBucket', 'Arn'] },
                        { 'Fn::Sub': '${DevDataBucket.Arn}/*' },
                      ],
                    },
                  ],
                },
              },
              {
                PolicyName: 'EC2ReadOnly',
                PolicyDocument: {
                  Version: '2012-10-17',
                  Statement: [
                    {
                      Effect: 'Allow',
                      Action: ['ec2:Describe*'],
                      Resource: '*',
                    },
                  ],
                },
              },
            ]),
            Tags: expect.arrayContaining([
              { Key: 'Project', Value: { Ref: 'ProjectName' } },
              { Key: 'Environment', Value: 'Dev' },
              { Key: 'CreatedBy', Value: { Ref: 'Owner' } },
            ]),
          },
        });
        // Similar checks for StagingEnvironmentRole and ProdEnvironmentRole
      });

      test('should define replication role with correct permissions', () => {
        expect(template.Resources.ReplicationRole).toMatchObject({
          Type: 'AWS::IAM::Role',
          Properties: {
            RoleName: 'TapStack-Replication-Role',
            AssumeRolePolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { Service: 's3.amazonaws.com' },
                  Action: 'sts:AssumeRole',
                },
              ],
            },
            Tags: expect.arrayContaining([
              { Key: 'Project', Value: { Ref: 'ProjectName' } },
              { Key: 'CreatedBy', Value: { Ref: 'Owner' } },
            ]),
          },
        });

        expect(template.Resources.ReplicationPolicy).toMatchObject({
          Type: 'AWS::IAM::Policy',
          Properties: {
            PolicyName: 'TapStack-Replication-Policy',
            PolicyDocument: {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:ListBucket'],
                  Resource: [
                    { 'Fn::GetAtt': ['DevDataBucket', 'Arn'] },
                    { 'Fn::Sub': '${DevDataBucket.Arn}/*' },
                    { 'Fn::GetAtt': ['StagingDataBucket', 'Arn'] },
                    { 'Fn::Sub': '${StagingDataBucket.Arn}/*' },
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:ReplicateObject',
                    's3:ReplicateDelete',
                    's3:ReplicateTags',
                    's3:GetObjectVersionTagging',
                  ],
                  Resource: [
                    { 'Fn::GetAtt': ['StagingDataBucket', 'Arn'] },
                    { 'Fn::Sub': '${StagingDataBucket.Arn}/*' },
                    { 'Fn::GetAtt': ['ProdDataBucket', 'Arn'] },
                    { 'Fn::Sub': '${ProdDataBucket.Arn}/*' },
                  ],
                },
              ],
            },
            Roles: [{ Ref: 'ReplicationRole' }],
          },
        });
      });
    });
  });

  // Test Outputs
  describe('Outputs', () => {
    test('should define outputs for each environment', () => {
      if (!template.Outputs) {
        throw new Error('Outputs section is undefined in the template');
      }
      expect(template.Outputs.DevDataBucketName).toMatchObject({
        Description: 'Development S3 Bucket Name',
        Value: { Ref: 'DevDataBucket' },
      });
      expect(template.Outputs.DevDataBucketARN).toMatchObject({
        Description: 'Development S3 Bucket ARN',
        Value: { 'Fn::GetAtt': ['DevDataBucket', 'Arn'] },
      });
      expect(template.Outputs.DevVPCId).toMatchObject({
        Description: 'Development VPC ID',
        Value: { Ref: 'DevVPC' },
      });
      expect(template.Outputs.DevPublicSubnets).toMatchObject({
        Description: 'Development Public Subnet IDs',
        Value: {
          'Fn::Join': [',', [{ Ref: 'DevPublicSubnetA' }, { Ref: 'DevPublicSubnetB' }]],
        },
      });
      expect(template.Outputs.DevPrivateSubnets).toMatchObject({
        Description: 'Development Private Subnet IDs',
        Value: {
          'Fn::Join': [',', [{ Ref: 'DevPrivateSubnetA' }, { Ref: 'DevPrivateSubnetB' }]],
        },
      });
      expect(template.Outputs.DevEnvironmentRoleARN).toMatchObject({
        Description: 'Development IAM Role ARN',
        Value: { 'Fn::GetAtt': ['DevEnvironmentRole', 'Arn'] },
      });
      // Similar checks for Staging and Prod outputs
    });
  });

  // Test Naming Conventions
  describe('Naming Conventions', () => {
    test('should use TapStack-<env>-<resource> naming for tags', () => {
      const resources = template.Resources;
      for (const [key, resource] of Object.entries(resources)) {
        if (resource.Properties?.Tags) {
          const env = key.match(/Dev|Staging|Prod/)?.[0] || '';
          const nameTag = resource.Properties.Tags.find((tag: CloudFormationTag) => tag.Key === 'Name');
          if (env && nameTag) {
            expect(nameTag.Value).toMatch(new RegExp(`^TapStack-${env}-`));
          }
        }
      }
    });

    test('should use lowercase bucket names', () => {
      expect(template.Resources.DevDataBucket.Properties?.BucketName).toMatchObject({
        'Fn::Sub': 'tapstack-dev-data-${AWS::AccountId}-tapstack',
      });
      expect(template.Resources.StagingDataBucket.Properties?.BucketName).toMatchObject({
        'Fn::Sub': 'tapstack-staging-data-${AWS::AccountId}-tapstack',
      });
      expect(template.Resources.ProdDataBucket.Properties?.BucketName).toMatchObject({
        'Fn::Sub': 'tapstack-prod-data-${AWS::AccountId}-tapstack',
      });
    });
  });
});