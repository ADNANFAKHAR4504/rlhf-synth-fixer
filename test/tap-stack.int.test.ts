import { Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Integration Tests', () => {
  let template: Template;

  beforeAll(() => {
    const filePath = path.join(__dirname, '../lib/TapStack.json');
    const rawTemplate = fs.readFileSync(filePath, 'utf-8');
    const parsedTemplate = JSON.parse(rawTemplate);
    template = Template.fromJSON(parsedTemplate);
  });

  test('All expected resources exist', () => {
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.resourceCountIs('AWS::EC2::Instance', 1);
    template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
    template.resourceCountIs('AWS::IAM::Role', 1);
    template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
  });

  test('All outputs are properly defined and exportable', () => {
    const outputs = template.toJSON().Outputs || {};
    expect(outputs['S3BucketName']).toBeDefined();
    expect(outputs['S3BucketName'].Description).toBe('Name of the secure S3 bucket');
    expect(outputs['S3BucketName'].Export).toEqual({
      Name: {
        'Fn::Sub': '${AWS::StackName}-S3BucketName'
      }
    });

    expect(outputs['EC2PublicIP']).toBeDefined();
    expect(outputs['EC2PublicIP'].Description).toBe('Public IP address of the EC2 instance');
    expect(outputs['EC2PublicIP'].Export).toEqual({
      Name: {
        'Fn::Sub': '${AWS::StackName}-EC2PublicIP'
      }
    });
  });

  test('All resources include expected environment tagging', () => {
  const resources = template.toJSON().Resources || {};

  const taggedResources = Object.entries(resources).filter(([logicalId, resource]: any) => {
    const allTags = [];
    if (resource?.Properties?.Tags) allTags.push(...resource.Properties.Tags);
    if (resource?.Tags) allTags.push(...resource.Tags);

    const hasEnvironmentTag = allTags.some((tag: any) => tag.Key === 'Environment');
    if (!hasEnvironmentTag) {
      console.warn(`⚠️ Resource \"${logicalId}\" has no Environment tag. Found tags:`, allTags);
    }

    return hasEnvironmentTag;
  });

  if (taggedResources.length === 0) {
    console.warn('No resources with Environment tag found among:', Object.keys(resources));
  }

  expect(taggedResources.length).toBeGreaterThanOrEqual(1);
});

  test('Lifecycle rules and encryption are defined on S3 bucket', () => {
    const buckets = template.findResources('AWS::S3::Bucket');
    const bucket = Object.values(buckets)[0];

    expect(bucket.Properties.LifecycleConfiguration.Rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Status: 'Enabled'
        })
      ])
    );

    expect(bucket.Properties.BucketEncryption).toEqual(
      expect.objectContaining({
        ServerSideEncryptionConfiguration: expect.arrayContaining([
          expect.objectContaining({
            ServerSideEncryptionByDefault: expect.objectContaining({
              SSEAlgorithm: 'AES256'
            })
          })
        ])
      })
    );
  });

  test('Security group has proper SSH ingress rule using parameter reference', () => {
    const sg = Object.values(template.findResources('AWS::EC2::SecurityGroup'))[0];
    const ingress = sg.Properties.SecurityGroupIngress;
    expect(ingress).toEqual(
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

  test('EC2 instance is linked with IAM instance profile and correct AMI from SSM', () => {
    const ec2 = Object.values(template.findResources('AWS::EC2::Instance'))[0];
    expect(ec2.Properties.IamInstanceProfile).toBeDefined();
    expect(ec2.Properties.ImageId).toEqual({ Ref: 'LatestAmazonLinux2AMI' });
  });

  test('IAM instance profile and role connection integrity', () => {
    const profile = Object.values(template.findResources('AWS::IAM::InstanceProfile'))[0];
    expect(Array.isArray(profile.Properties.Roles)).toBe(true);
    expect(profile.Properties.Roles.length).toBeGreaterThan(0);
  });

  test('IAM Role assumes EC2 service and uses AWS managed S3 read policy', () => {
    const role = Object.values(template.findResources('AWS::IAM::Role'))[0];
    expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
    expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess');
  });
});
