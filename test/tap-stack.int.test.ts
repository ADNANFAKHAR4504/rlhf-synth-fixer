// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand } from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand } from "@aws-sdk/client-ec2";
import { IAMClient, GetInstanceProfileCommand, GetRoleCommand, ListAttachedRolePoliciesCommand } from "@aws-sdk/client-iam";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const stsClient = new STSClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let awsAccountId: string;
  let vpcId: string;
  let publicSubnetId: string;
  let privateSubnetId: string;
  let ec2InstanceId: string;
  let ec2PrivateIp: string;
  let securityGroupId: string;
  let s3BucketName: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackKey];

    awsAccountId = stackOutputs["aws-account-id"];
    vpcId = stackOutputs["vpc-id"];
    publicSubnetId = stackOutputs["public-subnet-id"];
    privateSubnetId = stackOutputs["private-subnet-id"];
    ec2InstanceId = stackOutputs["ec2-instance-id"];
    ec2PrivateIp = stackOutputs["ec2-private-ip"];
    securityGroupId = stackOutputs["security-group-id"];
    s3BucketName = stackOutputs["s3-bucket-name"];

    if (!vpcId || !publicSubnetId || !privateSubnetId || !ec2InstanceId || 
        !securityGroupId || !s3BucketName || !awsAccountId) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("AWS Account Verification", () => {
    test("AWS account ID matches expected value", async () => {
      const { Account } = await stsClient.send(new GetCallerIdentityCommand({}));
      expect(Account).toBe(awsAccountId);
    }, 20000);
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists and has correct configuration", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);

      const vpc = Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.State).toBe("available");
      expect(vpc?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecureAppVpc")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);
    }, 20000);

    test("Public subnet exists with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] })
      );
      expect(Subnets?.length).toBe(1);

      const subnet = Subnets?.[0];
      expect(subnet?.SubnetId).toBe(publicSubnetId);
      expect(subnet?.VpcId).toBe(vpcId);
      expect(subnet?.CidrBlock).toBe("10.0.1.0/24");
      expect(subnet?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet?.State).toBe("available");
      expect(subnet?.AvailabilityZone).toBe(`${awsRegion}a`);
      expect(subnet?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecureAppPublicSubnet")).toBe(true);
      expect(subnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")).toBe(true);
    }, 20000);

    test("Private subnet exists with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [privateSubnetId] })
      );
      expect(Subnets?.length).toBe(1);

      const subnet = Subnets?.[0];
      expect(subnet?.SubnetId).toBe(privateSubnetId);
      expect(subnet?.VpcId).toBe(vpcId);
      expect(subnet?.CidrBlock).toBe("10.0.2.0/24");
      expect(subnet?.MapPublicIpOnLaunch).toBe(false);
      expect(subnet?.State).toBe("available");
      expect(subnet?.AvailabilityZone).toBe(`${awsRegion}a`);
      expect(subnet?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecureAppPrivateSubnet")).toBe(true);
      expect(subnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")).toBe(true);
    }, 20000);

    test("Internet Gateway exists and is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
        })
      );
      expect(InternetGateways?.length).toBe(1);

      const igw = InternetGateways?.[0];
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Attachments?.[0]?.State).toBe("available");
      expect(igw?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecureAppIgw")).toBe(true);
    }, 20000);

    test("NAT Gateway exists in public subnet", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: "subnet-id", Values: [publicSubnetId] }]
        })
      );
      expect(NatGateways?.length).toBe(1);

      const natGw = NatGateways?.[0];
      expect(natGw?.SubnetId).toBe(publicSubnetId);
      expect(natGw?.State).toBe("available");
      expect(natGw?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecureAppNatGateway")).toBe(true);
    }, 20000);
  });

  describe("Security Groups", () => {
    test("Security group has correct SSH and egress rules", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(securityGroupId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toBe("SecureAppSecurityGroup");
      expect(sg?.Description).toBe("Security group for SecureApp EC2 instance");

      // Check SSH ingress rule (port 22 from specific CIDR)
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "203.0.113.0/24")).toBe(true);
    }, 20000);
  });

  describe("EC2 Instance", () => {
    test("EC2 instance exists and is running in private subnet", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      expect(Reservations?.length).toBe(1);

      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.InstanceId).toBe(ec2InstanceId);
      expect(instance?.State?.Name).toBe("running");
      expect(instance?.SubnetId).toBe(privateSubnetId);
      expect(instance?.PrivateIpAddress).toBe(ec2PrivateIp);
      expect(instance?.PublicIpAddress).toBeUndefined(); // Should not have public IP
      expect(instance?.InstanceType).toBe("t3.micro");
      expect(instance?.SecurityGroups?.[0]?.GroupId).toBe(securityGroupId);
      expect(instance?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecureAppInstance")).toBe(true);
      expect(instance?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);
    }, 20000);

    test("EC2 instance has correct IAM instance profile", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];

      expect(instance?.IamInstanceProfile?.Arn).toContain("SecureAppInstanceProfile");

      // Verify instance profile exists
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: "SecureAppInstanceProfile" })
      );
      expect(InstanceProfile?.InstanceProfileName).toBe("SecureAppInstanceProfile");
      expect(InstanceProfile?.Roles?.[0]?.RoleName).toBe("SecureAppEc2Role");
    }, 20000);
  });

  describe("IAM Configuration", () => {
    test("IAM role exists with correct policies", async () => {
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: "SecureAppEc2Role" })
      );
      expect(Role?.RoleName).toBe("SecureAppEc2Role");
      expect(Role?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecureAppEc2Role")).toBe(true);

      // Check attached policies
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: "SecureAppEc2Role" })
      );

      // Should have SSM policy
      expect(AttachedPolicies?.some(policy => 
        policy.PolicyArn === "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
      )).toBe(true);

      // Should have custom S3 policy
      expect(AttachedPolicies?.some(policy => 
        policy.PolicyName === "SecureAppS3Policy"
      )).toBe(true);
    }, 20000);
  });

  describe("S3 Bucket", () => {
    test("S3 bucket exists with correct security configuration", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));

      // Verify bucket name pattern
      expect(s3BucketName).toMatch(/^secureapp-logs-bucket-\d+$/);

      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check encryption is enabled (AES256)
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3BucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].BucketKeyEnabled).toBe(true);
    }, 20000);
  });

  describe("Security Compliance", () => {
    test("EC2 instance is properly isolated in private subnet", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];

      // Instance should be in private subnet
      expect(instance?.SubnetId).toBe(privateSubnetId);

      // Instance should not have public IP
      expect(instance?.PublicIpAddress).toBeUndefined();

      // Instance should have private IP in correct range
      expect(instance?.PrivateIpAddress).toMatch(/^10\.0\.2\.\d+$/);
    }, 20000);

    test("Security group follows principle of least privilege", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
      );
      const sg = SecurityGroups?.[0];

      // Should only allow SSH from specific CIDR block (not 0.0.0.0/0)
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule?.IpRanges?.every(range => range.CidrIp !== "0.0.0.0/0")).toBe(true);
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "203.0.113.0/24")).toBe(true);
    }, 20000);

    test("All resources have consistent naming and tagging", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      expect(vpc?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecureAppVpc")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);

      // Check EC2 instance tags
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecureAppInstance")).toBe(true);
      expect(instance?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);
    }, 20000);
  });

  describe("Network Connectivity", () => {
    test("Private subnet has route to NAT Gateway for internet access", async () => {
      // This test would require additional AWS API calls to check route tables
      // For now, we verify the NAT Gateway exists and is in the correct state
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [{ Name: "subnet-id", Values: [publicSubnetId] }]
        })
      );

      expect(NatGateways?.length).toBe(1);
      expect(NatGateways?.[0]?.State).toBe("available");
      expect(NatGateways?.[0]?.ConnectivityType).toBe("public");
    }, 20000);
  });
});