// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, GetBucketVersioningCommand } from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand } from "@aws-sdk/client-ec2";
import { IAMClient, GetInstanceProfileCommand, GetRoleCommand, ListRolePoliciesCommand, GetRolePolicyCommand } from "@aws-sdk/client-iam";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-1";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const stsClient = new STSClient({ region: awsRegion });
const logsClient = new CloudWatchLogsClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let awsAccountId: string;
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let ec2InstanceId: string;
  let ec2PrivateIp: string;
  let ec2PublicIp: string;
  let securityGroupId: string;
  let s3BucketName: string;
  let s3BucketArn: string;
  let internetGatewayId: string;
  let natGatewayId: string;
  let iamRoleArn: string;

  beforeAll(async () => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackKey];

    // Get AWS account ID
    const { Account } = await stsClient.send(new GetCallerIdentityCommand({}));
    awsAccountId = Account!;

    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = stackOutputs["public-subnet-ids"];
    privateSubnetIds = stackOutputs["private-subnet-ids"];
    ec2InstanceId = stackOutputs["ec2-instance-id"];
    ec2PrivateIp = stackOutputs["ec2-private-ip"];
    ec2PublicIp = stackOutputs["ec2-public-ip"];
    securityGroupId = stackOutputs["ec2-security-group-id"];
    s3BucketName = stackOutputs["s3-bucket-name"];
    s3BucketArn = stackOutputs["s3-bucket-arn"];
    internetGatewayId = stackOutputs["internet-gateway-id"];
    natGatewayId = stackOutputs["nat-gateway-id"];
    iamRoleArn = stackOutputs["ec2-iam-role-arn"];

    if (!vpcId || !publicSubnetIds || !privateSubnetIds || !ec2InstanceId || 
        !securityGroupId || !s3BucketName || !awsAccountId || !internetGatewayId || !natGatewayId) {
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
      expect(vpc?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("tap-"))).toBe(true);
    }, 20000);

    test("Public subnets exist with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(Subnets?.length).toBe(2);

      const expectedCidrs = ["10.0.1.0/24", "10.0.2.0/24"];
      Subnets?.forEach((subnet, index) => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(expectedCidrs).toContain(subnet?.CidrBlock);
        expect(subnet?.MapPublicIpOnLaunch).toBe(true);
        expect(subnet?.State).toBe("available");
        expect(subnet?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("PublicSubnet"))).toBe(true);
        expect(subnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")).toBe(true);
      });
    }, 20000);

    test("Private subnets exist with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      expect(Subnets?.length).toBe(2);

      const expectedCidrs = ["10.0.10.0/24", "10.0.20.0/24"];
      Subnets?.forEach((subnet, index) => {
        expect(subnet?.VpcId).toBe(vpcId);
        expect(expectedCidrs).toContain(subnet?.CidrBlock);
        expect(subnet?.MapPublicIpOnLaunch).toBe(false);
        expect(subnet?.State).toBe("available");
        expect(subnet?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("PrivateSubnet"))).toBe(true);
        expect(subnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")).toBe(true);
      });
    }, 20000);

    test("Internet Gateway exists and is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [internetGatewayId] })
      );
      expect(InternetGateways?.length).toBe(1);

      const igw = InternetGateways?.[0];
      expect(igw?.InternetGatewayId).toBe(internetGatewayId);
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Attachments?.[0]?.State).toBe("available");
      expect(igw?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("IGW"))).toBe(true);
    }, 20000);

    test("NAT Gateway exists in public subnet", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] })
      );
      expect(NatGateways?.length).toBe(1);

      const natGw = NatGateways?.[0];
      expect(natGw?.NatGatewayId).toBe(natGatewayId);
      expect(publicSubnetIds).toContain(natGw?.SubnetId);
      expect(natGw?.State).toBe("available");
      expect(natGw?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("NAT-Gateway"))).toBe(true);
    }, 20000);

    test("Route tables are configured correctly", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );

      // Should have at least 3 route tables (default + public + private)
      expect(RouteTables?.length).toBeGreaterThanOrEqual(3);

      // Check for public route table with IGW route
      const publicRouteTable = RouteTables?.find(rt => 
        rt.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("PublicRouteTable"))
      );
      expect(publicRouteTable).toBeDefined();
      expect(publicRouteTable?.Routes?.some(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId === internetGatewayId
      )).toBe(true);

      // Check for private route table with NAT Gateway route
      const privateRouteTable = RouteTables?.find(rt => 
        rt.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("PrivateRouteTable"))
      );
      expect(privateRouteTable).toBeDefined();
      expect(privateRouteTable?.Routes?.some(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId === natGatewayId
      )).toBe(true);
    }, 20000);
  });

  describe("VPC Flow Logs", () => {
    test("VPC Flow Logs CloudWatch Log Group exists", async () => {
      const { logGroups } = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: "/aws/vpc/flowlogs/tap-"
        })
      );

      expect(logGroups?.length).toBeGreaterThan(0);
      const logGroup = logGroups?.[0];
      expect(logGroup?.logGroupName).toMatch(/\/aws\/vpc\/flowlogs\/tap-.*/);
      expect(logGroup?.retentionInDays).toBe(14);
    }, 20000);
  });

  describe("Security Groups", () => {
    test("Security group has correct ingress and egress rules", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(securityGroupId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName?.includes("EC2-SecurityGroup")).toBe(true);
      expect(sg?.Description).toBe("Security group for EC2 instance with minimal required access");

      // Check SSH ingress rule (port 22 from specific IP)
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "106.213.84.109/32")).toBe(true);

      // Check HTTP ingress rule (port 80)
      const httpRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);

      // Check HTTPS ingress rule (port 443)
      const httpsRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);

      // Check egress rules
      expect(sg?.IpPermissionsEgress?.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe("EC2 Instance", () => {
    test("EC2 instance exists and is running in public subnet", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      expect(Reservations?.length).toBe(1);

      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.InstanceId).toBe(ec2InstanceId);
      expect(instance?.State?.Name).toBe("running");
      expect(publicSubnetIds).toContain(instance?.SubnetId);
      expect(instance?.PrivateIpAddress).toBe(ec2PrivateIp);
      expect(instance?.PublicIpAddress).toBe(ec2PublicIp);
      expect(instance?.InstanceType).toBe("t3.micro");
      expect(instance?.SecurityGroups?.[0]?.GroupId).toBe(securityGroupId);
      expect(instance?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("EC2Instance"))).toBe(true);

      // Check AMI ID for Amazon Linux 2023
      expect(instance?.ImageId).toBe("ami-00202c81ad9ce0b39");
    }, 20000);

    test("EC2 instance has correct IAM instance profile", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];

      expect(instance?.IamInstanceProfile?.Arn).toContain("EC2InstanceProfile");

      // Extract instance profile name from ARN
      const instanceProfileName = instance?.IamInstanceProfile?.Arn?.split("/").pop();
      expect(instanceProfileName).toBeDefined();

      // Verify instance profile exists
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: instanceProfileName! })
      );
      expect(InstanceProfile?.InstanceProfileName).toBe(instanceProfileName);
      expect(InstanceProfile?.Roles?.[0]?.RoleName?.includes("EC2Role")).toBe(true);
    }, 20000);
  });

  describe("IAM Configuration", () => {
    test("IAM role exists with correct S3 policies", async () => {
      // Extract role name from ARN
      const roleName = iamRoleArn.split("/").pop()!;
      
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      expect(Role?.RoleName).toBe(roleName);
      expect(Role?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("EC2Role"))).toBe(true);

      // Check inline policies
      const { PolicyNames } = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );

      // Should have custom S3 policy
      expect(PolicyNames?.some(policyName => policyName.includes("EC2S3Policy"))).toBe(true);

      // Check S3 policy content
      const s3PolicyName = PolicyNames?.find(name => name.includes("EC2S3Policy"));
      if (s3PolicyName) {
        const { PolicyDocument } = await iamClient.send(
          new GetRolePolicyCommand({ RoleName: roleName, PolicyName: s3PolicyName })
        );
        
        const policyDoc = JSON.parse(decodeURIComponent(PolicyDocument!));
        expect(policyDoc.Statement).toBeDefined();
        
        // Check for S3 permissions
        const s3Statement = policyDoc.Statement.find((stmt: any) => 
          stmt.Action.some((action: string) => action.startsWith("s3:"))
        );
        expect(s3Statement).toBeDefined();
        expect(s3Statement.Resource).toContain(s3BucketArn);
      }
    }, 20000);
  });

  describe("S3 Bucket", () => {
    test("S3 bucket exists with correct security configuration", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));

      // Verify bucket name pattern
      expect(s3BucketName).toMatch(/^tap-.*-app-data-\d+$/);

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

      // Check versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe("Enabled");
    }, 20000);
  });

  describe("Security Compliance", () => {
    test("EC2 instance has public IP for application access", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];

      // Instance should be in public subnet for this architecture
      expect(publicSubnetIds).toContain(instance?.SubnetId);

      // Instance should have public IP for application access
      expect(instance?.PublicIpAddress).toBeDefined();
      expect(instance?.PublicIpAddress).toBe(ec2PublicIp);

      // Instance should have private IP in correct range
      expect(instance?.PrivateIpAddress).toMatch(/^10\.0\.[12]\.\d+$/);
    }, 20000);

    test("Security group follows principle of least privilege for SSH", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] })
      );
      const sg = SecurityGroups?.[0];

      // SSH should only be allowed from specific IP (not 0.0.0.0/0)
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "106.213.84.109/32")).toBe(true);
      expect(sshRule?.IpRanges?.every(range => range.CidrIp !== "0.0.0.0/0")).toBe(true);
    }, 20000);

    test("All resources have consistent naming and tagging", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      expect(vpc?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("tap-"))).toBe(true);

      // Check EC2 instance tags
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.Tags?.some(tag => tag.Key === "Name" && tag.Value?.includes("EC2Instance"))).toBe(true);

      // Check S3 bucket name follows pattern
      expect(s3BucketName).toMatch(/^tap-.*-app-data-\d+$/);
    }, 20000);
  });

  describe("Network Connectivity", () => {
    test("NAT Gateway provides internet access for private subnets", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] })
      );

      expect(NatGateways?.length).toBe(1);
      expect(NatGateways?.[0]?.State).toBe("available");
      expect(NatGateways?.[0]?.ConnectivityType).toBe("public");
      expect(publicSubnetIds).toContain(NatGateways?.[0]?.SubnetId);
    }, 20000);

    test("Internet Gateway provides internet access for public subnets", async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [internetGatewayId] })
      );

      expect(InternetGateways?.length).toBe(1);
      expect(InternetGateways?.[0]?.Attachments?.[0]?.State).toBe("available");
      expect(InternetGateways?.[0]?.Attachments?.[0]?.VpcId).toBe(vpcId);
    }, 20000);
  });

  describe("Storage Security", () => {
    test("S3 bucket has proper encryption and versioning", async () => {
      // Test encryption
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3BucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");

      // Test versioning
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe("Enabled");

      // Test public access block
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);
  });
});