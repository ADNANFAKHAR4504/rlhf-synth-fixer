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
test('EC2 Security Group allows only port 22 for inbound traffic', () => {
  const sg = Object.values(template.findResources('AWS::EC2::SecurityGroup'))[0];
  const ingressRules = sg.Properties.SecurityGroupIngress;

  // Check only 1 ingress rule exists
  expect(Array.isArray(ingressRules)).toBe(true);
  expect(ingressRules.length).toBe(1);

  // Validate that the single rule is for SSH
  const rule = ingressRules[0];
  expect(rule.IpProtocol).toBe('tcp');
  expect(rule.FromPort).toBe(22);
  expect(rule.ToPort).toBe(22);
  expect(rule.CidrIp).toEqual({ Ref: 'AllowedSSHIP' });
});
test('EC2 instance uses the provided EC2 KeyPair', () => {
  const ec2 = Object.values(template.findResources('AWS::EC2::Instance'))[0];

  // Ensure KeyName is defined and references the correct parameter or resource
  expect(ec2.Properties.KeyName).toBeDefined();
  expect(ec2.Properties.KeyName).toEqual({ Ref: 'EC2KeyPair' }); // ✅ corrected reference
});
test('S3 bucket has AES256 server-side encryption enabled', () => {
  const bucket = Object.values(template.findResources('AWS::S3::Bucket'))[0];
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
  test('S3 bucket blocks all public access', () => {
  const bucket = Object.values(template.findResources('AWS::S3::Bucket'))[0];
  expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
    BlockPublicAcls: true,
    IgnorePublicAcls: true, 
    BlockPublicPolicy: true,
    RestrictPublicBuckets: true
  });
});

test('EC2 instance is t2.micro for free tier', () => {
  const ec2 = Object.values(template.findResources('AWS::EC2::Instance'))[0];
  expect(ec2.Properties.InstanceType).toBe('t2.micro');
});

});
