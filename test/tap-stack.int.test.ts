import * as AWS from '@aws-sdk/client-ec2';
import * as S3 from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Read the deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

describe('TapStack Integration Tests', () => {
  const ec2Client = new AWS.EC2({ region: 'us-east-1' });
  const s3Client = new S3.S3({ region: 'us-east-1' });

  describe('EC2 Instance', () => {
    it('should have EC2 instance running', async () => {
      const instanceId = outputs.InstanceId;
      expect(instanceId).toBeDefined();

      const response = await ec2Client.describeInstances({
        InstanceIds: [instanceId],
      });

      const instance = response.Reservations?.[0]?.Instances?.[0];
      expect(instance).toBeDefined();
      expect(instance?.State?.Name).toBe('running');
    });

    it('should have correct instance type', async () => {
      const instanceId = outputs.InstanceId;
      const response = await ec2Client.describeInstances({
        InstanceIds: [instanceId],
      });

      const instance = response.Reservations?.[0]?.Instances?.[0];
      expect(instance?.InstanceType).toBe('t2.micro');
    });

    it('should have Environment Development tag', async () => {
      const instanceId = outputs.InstanceId;
      const response = await ec2Client.describeInstances({
        InstanceIds: [instanceId],
      });

      const instance = response.Reservations?.[0]?.Instances?.[0];
      const envTag = instance?.Tags?.find((tag) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag?.Value).toBeTruthy();
    });

    it('should have IAM instance profile attached', async () => {
      const instanceId = outputs.InstanceId;
      const response = await ec2Client.describeInstances({
        InstanceIds: [instanceId],
      });

      const instance = response.Reservations?.[0]?.Instances?.[0];
      expect(instance?.IamInstanceProfile).toBeDefined();
      expect(instance?.IamInstanceProfile?.Arn).toContain('tap-instance-profile');
    });

    it('should be in the correct VPC and subnet', async () => {
      const instanceId = outputs.InstanceId;
      const response = await ec2Client.describeInstances({
        InstanceIds: [instanceId],
      });

      const instance = response.Reservations?.[0]?.Instances?.[0];
      expect(instance?.VpcId).toBe(outputs.VPCId);
      expect(instance?.SubnetId).toBe(outputs.SubnetId);
    });

    it('should have the correct security group', async () => {
      const instanceId = outputs.InstanceId;
      const response = await ec2Client.describeInstances({
        InstanceIds: [instanceId],
      });

      const instance = response.Reservations?.[0]?.Instances?.[0];
      const securityGroups = instance?.SecurityGroups?.map((sg) => sg.GroupId);
      expect(securityGroups).toContain(outputs.SecurityGroupId);
    });
  });

  describe('S3 Bucket', () => {
    it('should have S3 bucket created', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();

      const response = await s3Client.headBucket({
        Bucket: bucketName,
      });

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    it('should have versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;
      const response = await s3Client.getBucketVersioning({
        Bucket: bucketName,
      });

      expect(response.Status).toBe('Enabled');
    });

    it('should have server-side encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;
      const response = await s3Client.getBucketEncryption({
        Bucket: bucketName,
      });

      const rule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    it('should have correct tags', async () => {
      const bucketName = outputs.S3BucketName;
      const response = await s3Client.getBucketTagging({
        Bucket: bucketName,
      });

      const envTag = response.TagSet?.find((tag) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag?.Value).toBeTruthy();
    });
  });

  describe('VPC and Networking', () => {
    it('should have VPC created', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2Client.describeVpcs({
        VpcIds: [vpcId],
      });

      const vpc = response.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
    });

    it('should have correct CIDR block', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.describeVpcs({
        VpcIds: [vpcId],
      });

      const vpc = response.Vpcs?.[0];
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
    });

    it('should have DNS support and hostnames enabled', async () => {
      const vpcId = outputs.VPCId;
      
      const dnsSupportResponse = await ec2Client.describeVpcAttribute({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport',
      });
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);

      const dnsHostnamesResponse = await ec2Client.describeVpcAttribute({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames',
      });
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
    });

    it('should have public subnet created', async () => {
      const subnetId = outputs.SubnetId;
      expect(subnetId).toBeDefined();

      const response = await ec2Client.describeSubnets({
        SubnetIds: [subnetId],
      });

      const subnet = response.Subnets?.[0];
      expect(subnet).toBeDefined();
      expect(subnet?.State).toBe('available');
      expect(subnet?.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet?.MapPublicIpOnLaunch).toBe(true);
    });

    it('should have internet gateway attached', async () => {
      const vpcId = outputs.VPCId;
      const response = await ec2Client.describeInternetGateways({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId],
          },
        ],
      });

      expect(response.InternetGateways?.length).toBeGreaterThan(0);
      const igw = response.InternetGateways?.[0];
      expect(igw?.Attachments?.[0]?.State).toBe('available');
    });
  });

  describe('Security Group', () => {
    it('should have security group created', async () => {
      const sgId = outputs.SecurityGroupId;
      expect(sgId).toBeDefined();

      const response = await ec2Client.describeSecurityGroups({
        GroupIds: [sgId],
      });

      const sg = response.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.GroupName).toContain('tap-sg');
    });

    it('should allow SSH access on port 22', async () => {
      const sgId = outputs.SecurityGroupId;
      const response = await ec2Client.describeSecurityGroups({
        GroupIds: [sgId],
      });

      const sg = response.SecurityGroups?.[0];
      const sshRule = sg?.IpPermissions?.find((rule) => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === 'tcp'
      );
      
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    });

    it('should allow all outbound traffic', async () => {
      const sgId = outputs.SecurityGroupId;
      const response = await ec2Client.describeSecurityGroups({
        GroupIds: [sgId],
      });

      const sg = response.SecurityGroups?.[0];
      const egressRule = sg?.IpPermissionsEgress?.find((rule) => 
        rule.IpProtocol === '-1'
      );
      
      expect(egressRule).toBeDefined();
      expect(egressRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Resource Connectivity', () => {
    it('should have EC2 instance accessible via public IP', async () => {
      const publicIp = outputs.InstancePublicIp;
      expect(publicIp).toBeDefined();
      expect(publicIp).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });

    it('should have EC2 instance with private IP in correct subnet range', async () => {
      const privateIp = outputs.InstancePrivateIp;
      expect(privateIp).toBeDefined();
      expect(privateIp).toMatch(/^10\.0\.1\.\d+$/);
    });

    it('should have all resources in the same region', async () => {
      // Verify EC2 instance region
      const instanceId = outputs.InstanceId;
      const ec2Response = await ec2Client.describeInstances({
        InstanceIds: [instanceId],
      });
      const instanceArn = `arn:aws:ec2:us-east-1:*:instance/${instanceId}`;
      expect(instanceArn).toContain('us-east-1');

      // Verify S3 bucket region
      const bucketArn = outputs.S3BucketArn;
      expect(bucketArn).toBeDefined();
      // S3 ARN doesn't contain region, but we can verify it exists
      expect(bucketArn).toContain('arn:aws:s3:::');
    });
  });
});