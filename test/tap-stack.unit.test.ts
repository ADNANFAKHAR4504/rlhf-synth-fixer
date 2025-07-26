import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: Template;

  beforeAll(() => {
    const filePath = path.join(__dirname, '../lib/TapStack.json');
    const rawTemplate = fs.readFileSync(filePath, 'utf-8');
    const parsedTemplate = JSON.parse(rawTemplate);
    template = Template.fromJSON(parsedTemplate);
  });

  test('S3 Bucket blocks public access and enables versioning', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true,
      },
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    });
  });

  test('IAM Role includes AmazonS3ReadOnlyAccess managed policy', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      ManagedPolicyArns: [
        'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
      ]
    });
  });

  test('EC2 instance type is t2.micro', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't2.micro'
    });
  });
  test('EC2 instance has IAM Instance Profile attached', () => {
  const ec2 = Object.values(template.findResources('AWS::EC2::Instance'))[0];
  expect(ec2.Properties.IamInstanceProfile).toBeDefined();
});

  test('Security Group allows SSH using AllowedSSHIP parameter', () => {
  const resources = template.findResources('AWS::EC2::SecurityGroup');
  const sg = Object.values(resources)[0];

  expect(sg.Properties.SecurityGroupIngress).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22,
        CidrIp: { Ref: 'AllowedSSHIP' }
      })
    ])
  );
});


  test('Instance Profile contains a Roles array with non-empty value', () => {
    const profiles = template.findResources('AWS::IAM::InstanceProfile');
    const instanceProfile = Object.values(profiles)[0];
    expect(Array.isArray(instanceProfile.Properties.Roles)).toBe(true);
    expect(instanceProfile.Properties.Roles.length).toBeGreaterThan(0);
  });
  test('S3 Bucket has AES256 server-side encryption enabled', () => {
  const bucket = Object.values(template.findResources('AWS::S3::Bucket'))[0];
  const encryptionConfig = bucket?.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration;

  expect(Array.isArray(encryptionConfig)).toBe(true);
  expect(encryptionConfig).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        ServerSideEncryptionByDefault: expect.objectContaining({
          SSEAlgorithm: 'AES256'
        })
      })
    ])
  );
});


  test('Template outputs EC2 Public IP and S3 Bucket Name', () => {
    template.hasOutput('S3BucketName', {
      Description: 'Name of the secure S3 bucket'
    });

    template.hasOutput('EC2PublicIP', {
      Description: 'Public IP address of the EC2 instance'
    });
  });
});
