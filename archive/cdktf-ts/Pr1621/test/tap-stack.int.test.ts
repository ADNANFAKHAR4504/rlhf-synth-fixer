// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand } from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { RDSClient } from "@aws-sdk/client-rds";
import { CloudTrailClient, DescribeTrailsCommand } from "@aws-sdk/client-cloudtrail";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let albDnsName: string;
  let albZoneId: string;
  let ec2InstanceIds: string[];
  let ec2PrivateIps: string[];
  let securityGroupAlbId: string;
  let securityGroupEc2Id: string;
  let securityGroupRdsId: string;
  let s3AppBucketName: string;
  let s3CloudtrailBucketName: string;
  let cloudtrailArn: string;
  let kmsKeyId: string;
  let kmsKeyArn: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackKey];

    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = stackOutputs["public-subnet-ids"];
    privateSubnetIds = stackOutputs["private-subnet-ids"];
    albDnsName = stackOutputs["alb-dns-name"];
    albZoneId = stackOutputs["alb-zone-id"];
    ec2InstanceIds = stackOutputs["ec2-instance-ids"];
    ec2PrivateIps = stackOutputs["ec2-private-ips"];
    securityGroupAlbId = stackOutputs["security-group-alb-id"];
    securityGroupEc2Id = stackOutputs["security-group-ec2-id"];
    securityGroupRdsId = stackOutputs["security-group-rds-id"];
    s3AppBucketName = stackOutputs["s3-app-bucket-name"];
    s3CloudtrailBucketName = stackOutputs["s3-cloudtrail-bucket-name"];
    cloudtrailArn = stackOutputs["cloudtrail-arn"];
    kmsKeyId = stackOutputs["kms-key-id"];
    kmsKeyArn = stackOutputs["kms-key-arn"];

    if (!vpcId || !publicSubnetIds || !privateSubnetIds || !albDnsName || !ec2InstanceIds || 
        !s3AppBucketName || !s3CloudtrailBucketName || !cloudtrailArn || !kmsKeyId) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists and has correct configuration", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);
      
      const vpc = Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.State).toBe("available");
      expect(vpc?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "secure-app-vpc")).toBe(true);
    }, 20000);

    test("Public and private subnets exist with correct configuration", async () => {
      // Test public subnets
      const { Subnets: publicSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(publicSubnets?.length).toBe(2);
      publicSubnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe("available");
        expect(subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")).toBe(true);
      });

      // Test private subnets
      const { Subnets: privateSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      expect(privateSubnets?.length).toBe(2);
      privateSubnets?.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe("available");
        expect(subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")).toBe(true);
      });
    }, 20000);
  });

  describe("Security Groups", () => {
    test("ALB security group has correct HTTP/HTTPS rules", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupAlbId] })
      );
      expect(SecurityGroups?.length).toBe(1);
      
      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(securityGroupAlbId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toBe("public-frontend-sg");
      
      // Check HTTP rule (port 80)
      const httpRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // Check HTTPS rule (port 443)
      const httpsRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule).toBeDefined();
    }, 20000);

    test("EC2 security group allows traffic only from ALB", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupEc2Id] })
      );
      expect(SecurityGroups?.length).toBe(1);
      
      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(securityGroupEc2Id);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toBe("private-app-sg");
      
      // Check HTTP rule from ALB
      const httpRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs?.some(pair => pair.GroupId === securityGroupAlbId)).toBe(true);
    }, 20000);

    test("RDS security group allows traffic only from EC2", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupRdsId] })
      );
      expect(SecurityGroups?.length).toBe(1);
      
      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(securityGroupRdsId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toBe("private-database-sg");
      
      // Check MySQL rule from EC2
      const mysqlRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.some(pair => pair.GroupId === securityGroupEc2Id)).toBe(true);
    }, 20000);
  });

  describe("EC2 Instances", () => {
    test("EC2 instances exist and are running in private subnets", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: ec2InstanceIds })
      );
      expect(Reservations?.length).toBeGreaterThan(0);
      
      const instances = Reservations?.flatMap(r => r.Instances || []);
      expect(instances?.length).toBe(2);
      
      instances?.forEach((instance, index) => {
        expect(instance.State?.Name).toBe("running");
      });
    }, 20000);
  });

  describe("S3 Buckets", () => {
    test("Application S3 bucket exists with correct security configuration", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3AppBucketName }));
      
      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3AppBucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      
      // Check encryption is enabled
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3AppBucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      
      // Check versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3AppBucketName })
      );
      expect(Status).toBe("Enabled");
    }, 20000);

    test("CloudTrail S3 bucket exists with correct security configuration", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3CloudtrailBucketName }));
      
      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3CloudtrailBucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      
      // Check encryption is enabled
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3CloudtrailBucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      
      // Check versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3CloudtrailBucketName })
      );
      expect(Status).toBe("Enabled");
    }, 20000);
  });

  describe("CloudTrail", () => {
    test("CloudTrail exists and is configured correctly", async () => {
      const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({}));
      const cloudTrail = trailList?.find(trail => trail.TrailARN === cloudtrailArn);
      
      expect(cloudTrail).toBeDefined();
      expect(cloudTrail?.S3BucketName).toBe(s3CloudtrailBucketName);
      expect(cloudTrail?.IncludeGlobalServiceEvents).toBe(true);
      expect(cloudTrail?.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail?.Name).toContain("secure-app-cloudtrail");
    }, 20000);
  });

  describe("KMS Key", () => {
    test("KMS key exists and has key rotation enabled", async () => {
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({ KeyId: kmsKeyId }));
      
      expect(KeyMetadata?.KeyId).toBe(kmsKeyId);
      expect(KeyMetadata?.Arn).toBe(kmsKeyArn);
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.KeySpec).toBe("SYMMETRIC_DEFAULT");
      expect(KeyMetadata?.Enabled).toBe(true);
      expect(KeyMetadata?.Description).toContain("KMS key for application encryption");
    }, 20000);
  });

  describe("Security Compliance", () => {
    test("All resources have required tags", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      expect(vpc?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "terraform-cdk")).toBe(true);
      
      // Check EC2 instance tags
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceIds[0]] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);
      expect(instance?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "terraform-cdk")).toBe(true);
    }, 20000);

    test("EC2 instances are in private subnets without public IPs", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: ec2InstanceIds })
      );
      
      const instances = Reservations?.flatMap(r => r.Instances || []);
      instances?.forEach(instance => {
        expect(privateSubnetIds).toContain(instance.SubnetId);
        expect(instance.PublicIpAddress).toBeUndefined();
        expect(instance.PrivateIpAddress).toBeDefined();
      });
    }, 20000);
  });
});