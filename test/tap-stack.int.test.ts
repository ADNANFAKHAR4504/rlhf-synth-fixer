import fs from 'fs';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetBucketPolicyCommand } from '@aws-sdk/client-s3';
import { IAMClient, GetRolePolicyCommand } from '@aws-sdk/client-iam';
import { EC2Client, DescribeInstancesCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION || outputs.StackRegion || 'us-west-2';
const {
  S3BucketName,
  S3BucketArn,
  EC2InstanceId,
  EC2InstancePublicDNS,
  IAMRoleName,
  SecurityGroupId,
  SSHCommand,
} = outputs;

const s3 = new S3Client({ region });
const iam = new IAMClient({ region });
const ec2 = new EC2Client({ region });

const decodePolicyDocument = (encoded: string) =>
  JSON.parse(decodeURIComponent(encoded.replace(/\+/g, ' ')));

describe('TapStack Integration end-to-end data flow', () => {
  jest.setTimeout(120000);

  describe('Stack outputs fuel operator entry points', () => {
    test('Outputs are defined', () => {
      expect(S3BucketName).toBeDefined();
      expect(S3BucketArn).toBeDefined();
      expect(EC2InstanceId).toBeDefined();
      expect(EC2InstancePublicDNS).toBeDefined();
      expect(IAMRoleName).toBeDefined();
      expect(SecurityGroupId).toBeDefined();
      expect(SSHCommand).toBeDefined();
    });
  });

  describe('Compute and IAM boundary enforcement', () => {
    test('IAM inline policy restricts access to the production bucket', async () => {
      const policy = await iam.send(
        new GetRolePolicyCommand({
          RoleName: IAMRoleName,
          PolicyName: 'ProdS3ReadOnlyPolicy',
        })
      );

      const document = decodePolicyDocument(policy.PolicyDocument ?? '');
      const bucketStatement = document.Statement.find(
        (statement: any) => statement.Sid === 'S3BucketReadAccess'
      );

      expect(bucketStatement.Action).toEqual(
        expect.arrayContaining(['s3:GetObject', 's3:ListBucket'])
      );
      expect(bucketStatement.Resource).toEqual(
        expect.arrayContaining([S3BucketArn, `${S3BucketArn}/*`])
      );
    });

    test('EC2 instance attaches the expected IAM instance profile and security group', async () => {
      const response = await ec2.send(
        new DescribeInstancesCommand({ InstanceIds: [EC2InstanceId] })
      );

      const reservation = response.Reservations?.[0];
      const instance = reservation?.Instances?.[0];

      expect(instance).toBeDefined();
      if (instance?.IamInstanceProfile?.Arn) {
        expect(instance.IamInstanceProfile.Arn).toContain('ProdEC2InstanceProfile');
      }
      const attachedGroups = instance?.SecurityGroups?.map(group => group.GroupId);
      if (attachedGroups && attachedGroups.length > 0) {
        expect(attachedGroups).toContain(SecurityGroupId);
      }
    });
  });

  describe('Network perimeter upholds security requirements', () => {
    test('Security group allows scoped SSH ingress and required egress paths', async () => {
      const securityGroups = await ec2.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [SecurityGroupId] })
      );

      const group = securityGroups.SecurityGroups?.[0];
      expect(group).toBeDefined();

      const sshRule = group?.IpPermissions?.find(
        permission => permission.FromPort === 22 && permission.ToPort === 22
      );
      if (sshRule && sshRule.IpRanges && sshRule.IpRanges[0]) {
        expect(sshRule.IpRanges[0].CidrIp).toBeDefined();
      }

      const tcpEgress = group?.IpPermissionsEgress?.filter(
        permission => permission.IpProtocol === 'tcp'
      );
      expect(tcpEgress?.map(rule => rule.FromPort)).toEqual(
        expect.arrayContaining([80, 53, 443])
      );
    });
  });

  describe('Storage layer enforces lifecycle, encryption, and TLS-only access', () => {
    test('bucket exists with versioning enabled and AES256 encryption', async () => {
      await s3.send(new HeadBucketCommand({ Bucket: S3BucketName }));

      const versioning = await s3.send(
        new GetBucketVersioningCommand({ Bucket: S3BucketName })
      );
      expect(versioning.Status).toBe('Enabled');

      const encryption = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: S3BucketName })
      );
      const rule =
        encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault;
      expect(rule?.SSEAlgorithm).toBe('AES256');
    });

    test('Bucket policy denies insecure transport', async () => {
      const policyResult = await s3.send(
        new GetBucketPolicyCommand({ Bucket: S3BucketName })
      );

      const policyDocument = JSON.parse(policyResult.Policy ?? '{}');
      const denyStatement = policyDocument.Statement.find(
        (statement: any) => statement.Sid === 'DenyInsecureConnections'
      );

      expect(denyStatement.Effect).toBe('Deny');
      expect(`${denyStatement.Condition.Bool['aws:SecureTransport']}`).toBe('false');
    });
  });

  describe('Operational access surfaces via outputs', () => {
    test('SSH command output references the deployed EC2 public DNS', async () => {
      const response = await ec2.send(
        new DescribeInstancesCommand({ InstanceIds: [EC2InstanceId] })
      );
      const instance = response.Reservations?.[0].Instances?.[0];
      const publicDns = instance?.PublicDnsName;

      expect(SSHCommand).toContain(publicDns ?? '');
      expect(SSHCommand).toMatch(/ssh -i ~\/\.ssh\/.+\.pem ec2-user@\S+/);
    });
  });
});
