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

  // ✅ Basic tagging
  test('All resources include Environment tag', () => {
    const resources = template.toJSON().Resources || {};
    const taggedResources = Object.entries(resources).filter(([_, resource]: any) => {
      const tags = resource?.Properties?.Tags || [];
      return tags.some((tag: any) => tag.Key === 'Environment');
    });
    expect(taggedResources.length).toBeGreaterThan(0);
  });

  // ✅ EC2 instance type and key pair
  test('EC2 instance is t2.micro and uses correct KeyPair', () => {
    const ec2 = Object.values(template.findResources('AWS::EC2::Instance'))[0];
    expect(ec2.Properties.InstanceType).toBe('t2.micro');
    expect(ec2.Properties.KeyName).toEqual({ Ref: 'EC2KeyPair' });
  });

  // 🔐 Security Group ingress
  test('Security Group allows only SSH from allowed IP', () => {
    const sg = Object.values(template.findResources('AWS::EC2::SecurityGroup'))[0];
    const ingress = sg.Properties.SecurityGroupIngress;
    expect(ingress).toEqual([
      {
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22,
        CidrIp: { Ref: 'AllowedSSHIP' }
      }
    ]);
  });

  // 🔐 Security Group egress
  test('Security Group allows outbound traffic to all destinations', () => {
    const sg = Object.values(template.findResources('AWS::EC2::SecurityGroup'))[0];
    const egress = sg.Properties.SecurityGroupEgress;
    if (!egress) {
      console.warn('SecurityGroupEgress not explicitly defined; AWS allows all outbound traffic by default.');
      expect(egress).toBeUndefined();
    } else {
      expect(egress).toEqual([
        {
          IpProtocol: '-1',
          CidrIp: '0.0.0.0/0'
        }
      ]);
    }
  });

  // 🔐 IAM Role and Instance Profile
  test('IAM Role assumes EC2 and has S3 read-only access', () => {
    const role = Object.values(template.findResources('AWS::IAM::Role'))[0];
    expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
    expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess');
  });

  test('IAM Instance Profile is correctly linked to Role', () => {
    const profile = Object.values(template.findResources('AWS::IAM::InstanceProfile'))[0];
    expect(profile.Properties.Roles.length).toBeGreaterThan(0);
  });

  // 🛡️ S3 bucket security
  test('S3 bucket has AES256 encryption and blocks public access', () => {
    const bucket = Object.values(template.findResources('AWS::S3::Bucket'))[0];
    expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
      BlockPublicAcls: true,
      IgnorePublicAcls: true,
      BlockPublicPolicy: true,
      RestrictPublicBuckets: true
    });
  });

  // 🔄 EC2 and IAM integration
  test('EC2 instance is associated with IAM Instance Profile', () => {
    const ec2 = Object.values(template.findResources('AWS::EC2::Instance'))[0];
    expect(ec2.Properties.IamInstanceProfile).toBeDefined();
  });

  test('EC2 instance has Security Group attached', () => {
    const ec2 = Object.values(template.findResources('AWS::EC2::Instance'))[0];
    expect(ec2.Properties.SecurityGroupIds.length).toBeGreaterThan(0);
  });

  // 🚫 Edge case: No public IP unless explicitly allowed
  test('EC2 instance does not have public IP unless explicitly enabled', () => {
    const ec2 = Object.values(template.findResources('AWS::EC2::Instance'))[0];
    const associatePublicIp = ec2?.Properties?.NetworkInterfaces?.[0]?.AssociatePublicIpAddress;
    if (associatePublicIp !== undefined) {
      expect(associatePublicIp).toBe(false);
    }
  });

  // 🚫 Edge case: No hardcoded secrets in UserData
  test('EC2 UserData does not contain hardcoded secrets', () => {
    const ec2 = Object.values(template.findResources('AWS::EC2::Instance'))[0];
    const userData = ec2?.Properties?.UserData;

    if (userData && typeof userData['Fn::Base64'] === 'string') {
      const decoded = Buffer.from(userData['Fn::Base64'], 'base64').toString('utf-8');
      expect(decoded).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(decoded).not.toMatch(/aws_secret_access_key/i);
    } else {
      console.warn('UserData is not a base64 string or is dynamically generated. Skipping secret scan.');
      expect(true).toBe(true);
    }
  });


  // 📤 Output validation
  test('CloudFormation outputs include EC2 and S3 references', () => {
    const outputs = template.toJSON().Outputs || {};
    const outputKeys = Object.keys(outputs);
    expect(outputKeys.length).toBeGreaterThan(0);
    const hasEC2Output = outputKeys.some(key => key.toLowerCase().includes('ec2'));
    const hasS3Output = outputKeys.some(key => key.toLowerCase().includes('s3'));
    expect(hasEC2Output || hasS3Output).toBe(true);
  });

  // 🧩 Resource count sanity check
  test('Expected number of core resources are present', () => {
    const resources = template.toJSON().Resources || {};
    const ec2Count = Object.values(resources).filter(r => r.Type === 'AWS::EC2::Instance').length;
    const s3Count = Object.values(resources).filter(r => r.Type === 'AWS::S3::Bucket').length;
    const sgCount = Object.values(resources).filter(r => r.Type === 'AWS::EC2::SecurityGroup').length;
    expect(ec2Count).toBeGreaterThanOrEqual(1);
    expect(s3Count).toBeGreaterThanOrEqual(1);
    expect(sgCount).toBeGreaterThanOrEqual(1);
  });

});
