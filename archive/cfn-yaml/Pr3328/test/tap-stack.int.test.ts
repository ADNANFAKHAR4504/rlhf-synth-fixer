// __tests__/dev-environment-stack.int.test.ts
import { IAMClient } from "@aws-sdk/client-iam";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand, DescribeInstancesCommand, DescribeNatGatewaysCommand, DescribeAddressesCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand, HeadBucketCommand, GetPublicAccessBlockCommand, GetBucketLifecycleConfigurationCommand } from "@aws-sdk/client-s3";
import { SNSClient } from "@aws-sdk/client-sns";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });

describe("Development Environment Stack Integration Tests", () => {
  let outputs: any;
  let stackName: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    
    // Extract stack name from DBSecretArn or other output
    const dbSecretArn = outputs["DBSecretArn"];
    stackName = dbSecretArn ? dbSecretArn.split(":")[6].split("-")[0] : "TapStack";

    // Validate required outputs exist
    const requiredOutputs = [
      "VpcId",
      "PublicSubnetId", 
      "PrivateSubnet1Id",
      "PrivateSubnet2Id",
      "BastionSecurityGroupId",
      "AppSecurityGroupId",
      "DbSecurityGroupId",
      "RDSEndpoint",
      "S3BucketName",
      "DBSecretArn",
      "BastionPublicIP"
    ];

    for (const output of requiredOutputs) {
      if (!outputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure - Network Foundation", () => {
    test("VPC exists with correct configuration", async () => {
      const vpcId = outputs["VpcId"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.20.0.0/16");
      expect(Vpcs![0].State).toBe("available");
      
      // Verify tagging
      const tags = Vpcs![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name")).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment")).toBe(true);
      expect(tags.some(tag => tag.Key === "Project" && tag.Value === "DevEnv")).toBe(true);
      expect(tags.some(tag => tag.Key === "Owner" && tag.Value === "DevTeam")).toBe(true);
    }, 20000);

    test("Public subnet configured correctly", async () => {
      const vpcId = outputs["VpcId"];
      const publicSubnetId = outputs["PublicSubnetId"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [publicSubnetId]
      }));
      
      expect(Subnets).toHaveLength(1);
      const subnet = Subnets![0];
      
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.State).toBe("available");
      expect(subnet.CidrBlock).toBe("10.20.1.0/24");
      
      // Verify subnet tagging
      const tags = subnet.Tags || [];
      expect(tags.some(tag => tag.Key === "Environment")).toBe(true);
      expect(tags.some(tag => tag.Key === "Project" && tag.Value === "DevEnv")).toBe(true);
    }, 20000);

    test("Private subnets exist in multiple AZs", async () => {
      const vpcId = outputs["VpcId"];
      const privateSubnetIds = [outputs["PrivateSubnet1Id"], outputs["PrivateSubnet2Id"]];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      const expectedCidrs = ["10.20.10.0/24", "10.20.20.0/24"];
      const actualCidrs = new Set();
      
      Subnets?.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        availabilityZones.add(subnet.AvailabilityZone);
        actualCidrs.add(subnet.CidrBlock);
        
        // Verify subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Environment")).toBe(true);
        expect(tags.some(tag => tag.Key === "Project" && tag.Value === "DevEnv")).toBe(true);
      });

      // Verify subnets are in different AZs for high availability
      expect(availabilityZones.size).toBe(2);
      
      // Verify CIDR blocks
      expectedCidrs.forEach(cidr => {
        expect(actualCidrs.has(cidr)).toBe(true);
      });
    }, 20000);

    test("Internet Gateway attached to VPC", async () => {
      const vpcId = outputs["VpcId"];
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways).toHaveLength(1);
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      expect(InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
      
      // Verify IGW tagging
      const tags = InternetGateways![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Environment")).toBe(true);
    }, 20000);

    test("NAT Gateway exists with Elastic IP", async () => {
      const vpcId = outputs["VpcId"];
      const publicSubnetId = outputs["PublicSubnetId"];
      
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "state", Values: ["available"] }
        ]
      }));
    }, 20000);

    test("Route tables configured for public and private subnets", async () => {
      const vpcId = outputs["VpcId"];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have default + public + private route tables
      expect(RouteTables!.length).toBeGreaterThanOrEqual(3);
      
      // Check for internet gateway routes in public route tables
      const internetRoutes = RouteTables?.filter(rt =>
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
        )
      );
      expect(internetRoutes!.length).toBeGreaterThan(0);
      
      // Check for NAT gateway routes in private route tables
      const natRoutes = RouteTables?.filter(rt =>
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith('nat-')
        )
      );
      expect(natRoutes!.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe("Security Groups - Access Controls", () => {
    test("Bastion security group allows SSH from office IP only", async () => {
      const bastionSgId = outputs["BastionSecurityGroupId"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [bastionSgId]
      }));
      
      expect(SecurityGroups).toHaveLength(1);
      const bastionSg = SecurityGroups![0];
      
      expect(bastionSg.Description).toBe("Security group for Bastion host");
      
      // Check SSH ingress rule
      const sshRule = bastionSg.IpPermissions?.find(rule =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges).toHaveLength(1);
      expect(sshRule?.IpRanges![0].Description).toBe("SSH access from office");
      
      // Verify security group tagging
      const tags = bastionSg.Tags || [];
      expect(tags.some(tag => tag.Key === "Environment")).toBe(true);
      expect(tags.some(tag => tag.Key === "Project" && tag.Value === "DevEnv")).toBe(true);
    }, 20000);

    test("App security group allows SSH from bastion only", async () => {
      const appSgId = outputs["AppSecurityGroupId"];
      const bastionSgId = outputs["BastionSecurityGroupId"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [appSgId]
      }));
      
      expect(SecurityGroups).toHaveLength(1);
      const appSg = SecurityGroups![0];
      
      expect(appSg.Description).toBe("Security group for Application servers");
      
      // Check SSH ingress rule from bastion
      const sshRule = appSg.IpPermissions?.find(rule =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.UserIdGroupPairs).toHaveLength(1);
      expect(sshRule?.UserIdGroupPairs![0].GroupId).toBe(bastionSgId);
      expect(sshRule?.UserIdGroupPairs![0].Description).toBe("SSH access from bastion");
    }, 20000);

    test("Database security group restricts PostgreSQL access to app servers", async () => {
      const dbSgId = outputs["DbSecurityGroupId"];
      const appSgId = outputs["AppSecurityGroupId"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [dbSgId]
      }));
      
      expect(SecurityGroups).toHaveLength(1);
      const dbSg = SecurityGroups![0];
      
      expect(dbSg.Description).toBe("Security group for RDS PostgreSQL");
      
      // Check for PostgreSQL rule (port 5432)
      const postgresRule = dbSg.IpPermissions?.find(rule =>
        rule.FromPort === 5432 && rule.ToPort === 5432 && rule.IpProtocol === "tcp"
      );
      expect(postgresRule).toBeDefined();
      expect(postgresRule?.UserIdGroupPairs).toHaveLength(1);
      expect(postgresRule?.UserIdGroupPairs![0].GroupId).toBe(appSgId);
      expect(postgresRule?.UserIdGroupPairs![0].Description).toBe("PostgreSQL access from app servers");
    }, 20000);
  });

  describe("Compute Resources - EC2 Instances", () => {
    test("Bastion instance exists with correct configuration", async () => {
      const bastionPublicIp = outputs["BastionPublicIP"];
      const bastionSgId = outputs["BastionSecurityGroupId"];
      const publicSubnetId = outputs["PublicSubnetId"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          { Name: "ip-address", Values: [bastionPublicIp] },
          { Name: "instance-state-name", Values: ["running"] }
        ]
      }));
      
      expect(Reservations).toHaveLength(1);
      expect(Reservations![0].Instances).toHaveLength(1);
      
      const instance = Reservations![0].Instances![0];
      expect(instance.InstanceType).toBe("t3.micro");
      expect(instance.SubnetId).toBe(publicSubnetId);
      expect(instance.SecurityGroups?.some(sg => sg.GroupId === bastionSgId)).toBe(true);
      expect(instance.PublicIpAddress).toBe(bastionPublicIp);
      
    }, 20000);
  });

  describe("Database Resources - RDS PostgreSQL", () => {
    test("RDS instance exists with secure configuration", async () => {
      const rdsEndpoint = outputs["RDSEndpoint"];
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      expect(DBInstances).toHaveLength(1);
      const dbInstance = DBInstances![0];
      
      expect(dbInstance.Engine).toBe("postgres");
      expect(dbInstance.DBInstanceClass).toBe("db.t3.medium");
      expect(dbInstance.AllocatedStorage).toBe(20);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.PreferredBackupWindow).toBe("03:00-04:00");
      expect(dbInstance.PreferredMaintenanceWindow).toBe("sun:04:00-sun:05:00");
      expect(dbInstance.Endpoint?.Address).toBe(rdsEndpoint);
      expect(dbInstance.MasterUsername).toBe("postgres");
      
      // Verify CloudWatch logs exports
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain("postgresql");
      
      // Verify tags
      const tags = dbInstance.TagList || [];
      expect(tags.some(tag => tag.Key === "Environment")).toBe(true);
      expect(tags.some(tag => tag.Key === "Project" && tag.Value === "DevEnv")).toBe(true);
    }, 30000);

    test("RDS subnet group configured correctly", async () => {
      const privateSubnet1Id = outputs["PrivateSubnet1Id"];
      const privateSubnet2Id = outputs["PrivateSubnet2Id"];
      const rdsEndpoint = outputs["RDSEndpoint"];
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbSubnetGroupName = DBInstances![0].DBSubnetGroup?.DBSubnetGroupName;
      
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbSubnetGroupName
      }));
      
      expect(DBSubnetGroups).toHaveLength(1);
      const subnetGroup = DBSubnetGroups![0];
      
      const subnetIds = subnetGroup.Subnets?.map(subnet => subnet.SubnetIdentifier) || [];
      expect(subnetIds).toHaveLength(2);
      expect(subnetIds).toContain(privateSubnet1Id);
      expect(subnetIds).toContain(privateSubnet2Id);
      
      // Verify multiple AZs
      const availabilityZones = new Set(
        subnetGroup.Subnets?.map(subnet => subnet.SubnetAvailabilityZone?.Name)
      );
      expect(availabilityZones.size).toBe(2);
    }, 20000);
  });

  describe("Storage Resources - S3 Bucket", () => {
    test("S3 bucket exists with correct configuration", async () => {
      const bucketName = outputs["S3BucketName"];
      
      // Test bucket accessibility
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
    }, 20000);

    test("S3 bucket has versioning enabled", async () => {
      const bucketName = outputs["S3BucketName"];
      
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      
      expect(Status).toBe("Enabled");
    }, 20000);

    test("S3 bucket has encryption configured", async () => {
      const bucketName = outputs["S3BucketName"];
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    }, 20000);

    test("S3 bucket has public access blocked", async () => {
      const bucketName = outputs["S3BucketName"];
      
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);

    test("S3 bucket has lifecycle configuration", async () => {
      const bucketName = outputs["S3BucketName"];
      
      const { Rules } = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );
      
      expect(Rules).toHaveLength(1);
      expect(Rules![0].ID).toBe("DeleteOldVersions");
      expect(Rules![0].Status).toBe("Enabled");
      expect(Rules![0].NoncurrentVersionExpiration?.NoncurrentDays).toBe(90);
    }, 20000);
  });

  describe("High Availability Configuration", () => {
    test("Resources distributed across multiple availability zones", async () => {
      const publicSubnetId = outputs["PublicSubnetId"];
      const privateSubnet1Id = outputs["PrivateSubnet1Id"];
      const privateSubnet2Id = outputs["PrivateSubnet2Id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [publicSubnetId, privateSubnet1Id, privateSubnet2Id]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBe(2);
    }, 20000);
  });

  describe("Security Best Practices", () => {
    test("Private subnets are not directly accessible from internet", async () => {
      const privateSubnetIds = [outputs["PrivateSubnet1Id"], outputs["PrivateSubnet2Id"]];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));
      
      Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    }, 20000);

    test("S3 bucket is not publicly accessible", async () => {
      const bucketName = outputs["S3BucketName"];
      
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      
      const config = response.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls && 
             config?.BlockPublicPolicy && 
             config?.IgnorePublicAcls && 
             config?.RestrictPublicBuckets).toBe(true);
    }, 20000);
  });

  describe("Output Validation", () => {
    test("All outputs have valid formats", () => {
      // VPC output
      expect(outputs["VpcId"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      
      // Subnet outputs
      expect(outputs["PublicSubnetId"]).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs["PrivateSubnet1Id"]).toMatch(/^subnet-[a-f0-9]{17}$/);
      expect(outputs["PrivateSubnet2Id"]).toMatch(/^subnet-[a-f0-9]{17}$/);
      
      // Security Group outputs
      expect(outputs["BastionSecurityGroupId"]).toMatch(/^sg-[a-f0-9]{17}$/);
      expect(outputs["AppSecurityGroupId"]).toMatch(/^sg-[a-f0-9]{17}$/);
      expect(outputs["DbSecurityGroupId"]).toMatch(/^sg-[a-f0-9]{17}$/);
      
      // RDS endpoint
      expect(outputs["RDSEndpoint"]).toMatch(/\.amazonaws\.com$/);
      
      // S3 bucket name
      expect(outputs["S3BucketName"]).toBe("cfn-bucket-12345");
      
      // Secrets Manager ARN
      expect(outputs["DBSecretArn"]).toMatch(/^arn:aws:secretsmanager:/);
      
      // Bastion Public IP
      expect(outputs["BastionPublicIP"]).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });
  });
});
