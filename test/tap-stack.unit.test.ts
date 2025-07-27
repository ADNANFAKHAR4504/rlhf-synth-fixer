import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

describe('Extended CloudFormation Template Tests', () => {
  let template: Template;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
    template = Template.fromJSON(templateContent);
  });

  // ✅ VPC Creation
  test('VPC is created with correct CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsSupport: true,
      EnableDnsHostnames: true,
    });
  });

  // ✅ S3 Bucket Security
  test('S3 bucket is encrypted and blocks public access', () => {
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
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  // ✅ IAM Group Name
  test('IAM Group name uses Fn::Sub with correct pattern', () => {
    Object.values(template.findResources('AWS::IAM::Group')).forEach((r: any) => {
      expect(r.Properties.GroupName).toEqual({
        'Fn::Sub': '${ProjectName}-s3-read-group',
      });
    });
  });

  // ✅ IAM Role Name
  test('IAM Role name uses Fn::Sub with correct pattern', () => {
    Object.values(template.findResources('AWS::IAM::Role')).forEach((r: any) => {
      expect(r.Properties.RoleName).toEqual({
        'Fn::Sub': '${ProjectName}-s3-read-role',
      });
    });
  });

  // ✅ IAM Role Policy
  test('IAM Role policy references correct S3 bucket ARNs', () => {
    Object.values(template.findResources('AWS::IAM::Role')).forEach((r: any) => {
      const statements = r.Properties.Policies[0].PolicyDocument.Statement;
      statements.forEach((stmt: any) => {
        expect(stmt.Resource).toEqual([
          { 'Fn::GetAtt': ['ProjectBucket', 'Arn'] },
          { 'Fn::Sub': '${ProjectBucket.Arn}/*' },
        ]);
      });
    });
  });

  // ✅ Tagging Consistency
  test('All resources have Environment and Project tags', () => {
    const resourceTypes = ['AWS::EC2::VPC', 'AWS::S3::Bucket', 'AWS::IAM::Role'];
    resourceTypes.forEach(type => {
      Object.values(template.findResources(type)).forEach((resource: any) => {
        expect(resource.Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Environment' }),
            expect.objectContaining({ Key: 'Project' }),
          ])
        );
      });
    });
  });

  // ✅ Outputs
  test('Outputs include VPCId, BucketName, S3ReadRoleARN, and S3AccessGroupName', () => {
    const outputs = template.toJSON().Outputs;
    expect(outputs).toHaveProperty('VPCId');
    expect(outputs).toHaveProperty('BucketName');
    expect(outputs).toHaveProperty('S3ReadRoleARN');
    expect(outputs).toHaveProperty('S3AccessGroupName');
  });

  // ✅ Output References
  test('Output values reference correct resources', () => {
    const outputs = template.toJSON().Outputs;
    expect(outputs.VPCId.Value).toMatchObject({ Ref: 'VPC' });
    expect(outputs.BucketName.Value).toMatchObject({ Ref: 'ProjectBucket' });
    expect(outputs.S3ReadRoleARN.Value).toMatchObject({ 'Fn::GetAtt': ['S3ReadRole', 'Arn'] });
    expect(outputs.S3AccessGroupName.Value).toMatchObject({ Ref: 'S3ReadAccessGroup' });
  });
});
