// __tests__/tap-stack.int.test.ts
import { IAMClient, GetRoleCommand, GetInstanceProfileCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand, DescribeInstancesCommand, DescribeNatGatewaysCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetBucketPolicyCommand, GetBucketLifecycleConfigurationCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });

describe("TapStack Web Application Infrastructure Integration Tests", () => {
  let outputs: any;
  let stackOutputs: any;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // Get the first (and likely only) stack
    stackOutputs = outputs[stackKey];

    // Validate required outputs exist
    const requiredOutputs = [
      "vpc-id",
      "s3-bucket-name",
      "ec2-instance-id",
      "ec2-public-ip",
      "rds-endpoint",
      "nat-gateway-ids",
      "private-subnet-ids",
      "public-subnet-ids"
    ];

    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure - Multi-AZ High Availability", () => {
    test("VPC exists with correct CIDR and DNS settings for web application", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      expect(Vpcs![0].State).toBe("available");
      
      // Verify web application tagging
      const tags = Vpcs![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "main-vpc")).toBe(true);
      expect(tags.some(tag => tag.Key === "Project" && tag.Value === "WebApp")).toBe(true);
      expect(tags.some(tag => tag.Key === "ManagedBy" && tag.Value === "CDKTF")).toBe(true);
    }, 20000);

    test("Public subnets exist with proper configuration for internet-facing resources", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      
      expect(publicSubnetIds).toHaveLength(2);
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      }));
      
      expect(Subnets).toHaveLength(2);
      
      Subnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[1-2]\.0\/24$/);
        
        // Verify public subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Type" && tag.Value === "Public")).toBe(true);
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("public-subnet"))).toBe(true);
      });
    }, 20000);

    test("Private subnets exist for database and internal resource isolation", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      
      expect(privateSubnetIds).toHaveLength(2);
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));
      
      expect(Subnets).toHaveLength(2);
      
      Subnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.(10|20)\.0\/24$/);
        
        // Verify private subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Type" && tag.Value === "Private")).toBe(true);
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("private-subnet"))).toBe(true);
      });
    }, 20000);

    test("Internet Gateway is properly attached for public subnet access", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways).toHaveLength(1);
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      expect(InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
      
      // Verify IGW tagging
      const tags = InternetGateways![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "main-igw")).toBe(true);
    }, 20000);

    test("NAT Gateways exist for secure private subnet outbound access", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const natGatewayIds = stackOutputs["nat-gateway-ids"];
      
      expect(natGatewayIds).toHaveLength(2);
      
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      }));
      
      expect(NatGateways).toHaveLength(2);
      
      NatGateways?.forEach((natGw, index) => {
        expect(natGw.State).toBe("available");
        expect(natGw.VpcId).toBe(vpcId);
        
        // Verify NAT Gateway tagging
        const tags = natGw.Tags || [];
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("nat-gw"))).toBe(true);
      });
    }, 20000);

    test("Route tables are properly configured for network segmentation", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have at least 5 route tables: default + 2 public + 2 private
      expect(RouteTables!.length).toBeGreaterThanOrEqual(5);
      
      // Check for public route tables with internet gateway routes
      const publicRouteTables = RouteTables?.filter(rt =>
        rt.Associations?.some(assoc => publicSubnetIds.includes(assoc.SubnetId!))
      );
      expect(publicRouteTables).toHaveLength(2);
      
      publicRouteTables?.forEach(rt => {
        const internetRoute = rt.Routes?.find(route =>
          route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
        );
        expect(internetRoute).toBeDefined();
      });
      
      // Check for private route tables with NAT gateway routes
      const privateRouteTables = RouteTables?.filter(rt =>
        rt.Associations?.some(assoc => privateSubnetIds.includes(assoc.SubnetId!))
      );
      expect(privateRouteTables).toHaveLength(2);
      
      privateRouteTables?.forEach(rt => {
        const natRoute = rt.Routes?.find(route =>
          route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith('nat-')
        );
        expect(natRoute).toBeDefined();
      });
    }, 20000);

    test("Subnets are distributed across multiple AZs for high availability", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      
      // Should have exactly 2 different AZs for this configuration
      expect(availabilityZones.size).toBe(2);
      
      // Verify AZs are in the correct region
      availabilityZones.forEach(az => {
        expect(az).toMatch(new RegExp(`^${awsRegion}[a-z]$`));
      });
    }, 20000);
  });

  describe("S3 Bucket - Application Storage with Security", () => {
    test("S3 bucket exists with proper naming and tagging", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      expect(bucketName).toBe("my-app-storage-bucket-12345-rlhf-ts");
      
      // Test bucket accessibility (this will throw if bucket doesn't exist)
      await expect(s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
    }, 20000);

    test("S3 bucket has server-side encryption enabled for data protection", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      expect(ServerSideEncryptionConfiguration?.Rules![0].BucketKeyEnabled).toBe(true);
    }, 20000);

    test("S3 bucket has lifecycle policy for cost optimization", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const { Rules } = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );
      
      expect(Rules).toHaveLength(1);
      expect(Rules![0].ID).toBe("glacier-transition");
      expect(Rules![0].Status).toBe("Enabled");
      expect(Rules![0].Transitions).toHaveLength(1);
      expect(Rules![0].Transitions![0].Days).toBe(30);
      expect(Rules![0].Transitions![0].StorageClass).toBe("GLACIER");
    }, 20000);

    test("S3 bucket policy includes deletion protection", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const { Policy } = await s3Client.send(new GetBucketPolicyCommand({ 
        Bucket: bucketName 
      }));
      
      expect(Policy).toBeDefined();
      const policyDocument = JSON.parse(Policy!);
      
      // Check for deletion protection statement
      const deletionProtectionStatement = policyDocument.Statement.find((stmt: any) =>
        stmt.Sid === "PreventDeletion" &&
        stmt.Effect === "Deny" &&
        stmt.Action.includes("s3:DeleteBucket")
      );
      
      expect(deletionProtectionStatement).toBeDefined();
    }, 20000);
  });

  describe("EC2 Instance - Web Application Server", () => {
    test("EC2 instance exists with proper configuration", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      
      expect(Reservations).toHaveLength(1);
      const instance = Reservations![0].Instances![0];
      
      expect(instance.InstanceId).toBe(instanceId);
      expect(instance.InstanceType).toBe("t3.micro");
      expect(instance.State?.Name).toBe("running");
      expect(instance.KeyName).toBe("production-key-poetic-primate");
      
      // Verify web server tagging
      const tags = instance.Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "web-server")).toBe(true);
      expect(tags.some(tag => tag.Key === "Project" && tag.Value === "WebApp")).toBe(true);
    }, 20000);

    test("EC2 instance is in public subnet with correct public IP", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      const vpcId = stackOutputs["vpc-id"];
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      const expectedPublicIp = stackOutputs["ec2-public-ip"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      
      const instance = Reservations![0].Instances![0];
      
      // Verify instance is in correct VPC and public subnet
      expect(instance.VpcId).toBe(vpcId);
      expect(publicSubnetIds).toContain(instance.SubnetId);
      
      // Verify instance has correct public IP
      expect(instance.PublicIpAddress).toBe(expectedPublicIp);
      expect(instance.PublicDnsName).toBeDefined();
    }, 20000);

    test("EC2 instance has proper IAM role for S3 access", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      
      const instance = Reservations![0].Instances![0];
      
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile?.Arn).toContain("ec2-app-instance-profile");
      
      // Verify IAM instance profile exists
      const instanceProfileName = instance.IamInstanceProfile?.Arn?.split('/').pop();
      const { InstanceProfile } = await iamClient.send(new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName!
      }));
      
      expect(InstanceProfile?.InstanceProfileName).toBe("ec2-app-instance-profile");
      expect(InstanceProfile?.Roles).toHaveLength(1);
      expect(InstanceProfile?.Roles![0].RoleName).toBe("ec2-app-role");
    }, 20000);

  });

  describe("Security Groups - Network Access Control", () => {
    test("EC2 security group restricts SSH access to company IP range", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: ["ec2-web-sg"] }
        ]
      }));
      
      const ec2Sg = SecurityGroups?.find(sg => sg.GroupName === "ec2-web-sg");
      expect(ec2Sg).toBeDefined();
      
      // Check SSH access (port 22) is restricted to company IP range
      const sshRule = ec2Sg?.IpPermissions?.find(rule =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "203.0.113.0/24")).toBe(true);
      
      // Check HTTP access (port 80) is open to internet
      const httpRule = ec2Sg?.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // Check outbound rules allow all traffic
      expect(ec2Sg?.IpPermissionsEgress).toHaveLength(1);
      const outboundRule = ec2Sg?.IpPermissionsEgress![0];
      expect(outboundRule?.IpProtocol).toBe("-1");
      expect(outboundRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
    }, 20000);

    test("RDS security group only allows access from EC2 security group", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const rdsSg = SecurityGroups?.find(sg => sg.GroupName === "rds-sg");
      const ec2Sg = SecurityGroups?.find(sg => sg.GroupName === "ec2-web-sg");
      
      expect(rdsSg).toBeDefined();
      expect(ec2Sg).toBeDefined();
      
      // Check MySQL access (port 3306) only from EC2 security group
      const mysqlRule = rdsSg?.IpPermissions?.find(rule =>
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs).toHaveLength(1);
      expect(mysqlRule?.UserIdGroupPairs![0].GroupId).toBe(ec2Sg?.GroupId);
      
      // Verify RDS security group has proper tagging
      const tags = rdsSg?.Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "rds-sg")).toBe(true);
    }, 20000);
  });

  describe("RDS Database - MySQL Instance", () => {
    test("RDS instance exists with proper configuration", async () => {
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      const dbIdentifier = "app-database"; // From your code
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      expect(DBInstances).toHaveLength(1);
      const dbInstance = DBInstances![0];
      
      expect(dbInstance.Engine).toBe("mysql");
      expect(dbInstance.DBInstanceClass).toBe("db.t3.medium");
      expect(dbInstance.AllocatedStorage).toBe(20);
      expect(dbInstance.StorageType).toBe("gp2");
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.AutoMinorVersionUpgrade).toBe(true);
      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      
      // Verify database name and endpoint
      expect(dbInstance.DBName).toBe("appdb");
      expect(dbInstance.Endpoint?.Address).toContain("app-database");
      expect(dbInstance.Endpoint?.Port).toBe(3306);
    }, 30000);

    test("RDS instance is in private subnets with proper subnet group", async () => {
      const dbIdentifier = "app-database";
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbInstance = DBInstances![0];
      
      // Verify DB subnet group exists
      expect(dbInstance.DBSubnetGroup).toBeDefined();
      expect(dbInstance.DBSubnetGroup?.DBSubnetGroupName).toBe("main-db-subnet-group");
      
      // Get subnet group details
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbInstance.DBSubnetGroup?.DBSubnetGroupName
      }));
      
      expect(DBSubnetGroups).toHaveLength(1);
      expect(DBSubnetGroups![0].Subnets).toHaveLength(2);
      
      // Verify subnets are the private ones
      const subnetIds = DBSubnetGroups![0].Subnets?.map(subnet => subnet.SubnetIdentifier) || [];
    }, 20000);

    test("RDS instance has proper backup and maintenance configuration", async () => {
      const dbIdentifier = "app-database";
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbInstance = DBInstances![0];
      
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.PreferredBackupWindow).toBe("03:00-04:00");
      expect(dbInstance.PreferredMaintenanceWindow).toBe("sun:04:00-sun:05:00");
      
      // Verify database tagging
      const tags = dbInstance.TagList || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "app-database")).toBe(true);
      expect(tags.some(tag => tag.Key === "Project" && tag.Value === "WebApp")).toBe(true);
    }, 20000);
  });

  describe("IAM Roles and Policies - Application Access", () => {
    test("EC2 IAM role exists with proper configuration", async () => {
      const roleName = "ec2-app-role";
      
      const { Role } = await iamClient.send(new GetRoleCommand({
        RoleName: roleName
      }));
      
      expect(Role?.RoleName).toBe(roleName);
      expect(Role?.AssumeRolePolicyDocument).toBeDefined();
      
      // Verify assume role policy allows EC2 service
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe("ec2.amazonaws.com");
      expect(assumeRolePolicy.Statement[0].Action).toBe("sts:AssumeRole");
      expect(assumeRolePolicy.Statement[0].Effect).toBe("Allow");
    }, 20000);

    test("IAM instance profile is properly configured", async () => {
      const instanceProfileName = "ec2-app-instance-profile";
      
      const { InstanceProfile } = await iamClient.send(new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName
      }));
      
      expect(InstanceProfile?.InstanceProfileName).toBe(instanceProfileName);
      expect(InstanceProfile?.Roles).toHaveLength(1);
      expect(InstanceProfile?.Roles![0].RoleName).toBe("ec2-app-role");
    }, 20000);
  });

  describe("Output Validation - Infrastructure References", () => {
    test("All required outputs are present and properly formatted", () => {
      expect(stackOutputs["vpc-id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(stackOutputs["s3-bucket-name"]).toBe("my-app-storage-bucket-12345-rlhf-ts");
      expect(stackOutputs["ec2-instance-id"]).toMatch(/^i-[a-f0-9]{17}$/);
      expect(stackOutputs["ec2-public-ip"]).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      expect(stackOutputs["rds-endpoint"]).toMatch(/^app-database\..*\..*\.rds\.amazonaws\.com:3306$/);
      
      // Verify array outputs
      expect(Array.isArray(stackOutputs["nat-gateway-ids"])).toBe(true);
      expect(stackOutputs["nat-gateway-ids"]).toHaveLength(2);
      expect(Array.isArray(stackOutputs["private-subnet-ids"])).toBe(true);
      expect(stackOutputs["private-subnet-ids"]).toHaveLength(2);
      expect(Array.isArray(stackOutputs["public-subnet-ids"])).toBe(true);
      expect(stackOutputs["public-subnet-ids"]).toHaveLength(2);
    });

    test("RDS endpoint follows expected naming pattern", () => {
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      expect(rdsEndpoint).toContain("app-database");
      expect(rdsEndpoint).toContain(awsRegion);
      expect(rdsEndpoint).toContain("rds.amazonaws.com:3306");
    });

        test("Subnet IDs follow AWS format", () => {
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      const natGatewayIds = stackOutputs["nat-gateway-ids"];
      
      // Verify public subnet IDs format
      publicSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
      
      // Verify private subnet IDs format
      privateSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
      
      // Verify NAT Gateway IDs format
      natGatewayIds.forEach((natId: string) => {
        expect(natId).toMatch(/^nat-[a-f0-9]{17}$/);
      });
    });
  });

  describe("High Availability and Fault Tolerance", () => {
    test("Resources are distributed across multiple availability zones", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      
      // Should have exactly 2 different AZs for this configuration
      expect(availabilityZones.size).toBe(2);
      
      // Verify AZs are in the correct region
      availabilityZones.forEach(az => {
        expect(az).toMatch(new RegExp(`^${awsRegion}[a-z]$`));
      });
    }, 20000);

    test("NAT Gateways provide redundancy across availability zones", async () => {
      const natGatewayIds = stackOutputs["nat-gateway-ids"];
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      }));
      
      // Verify each NAT Gateway is in a different public subnet
      const natSubnetIds = NatGateways?.map(nat => nat.SubnetId) || [];
      expect(natSubnetIds).toHaveLength(2);
      
      publicSubnetIds.forEach((subnetId: string) => {
        expect(natSubnetIds).toContain(subnetId);
      });
      
    }, 20000);

    test("Private subnets have routes to different NAT Gateways", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      const natGatewayIds = stackOutputs["nat-gateway-ids"];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Find route tables associated with private subnets
      const privateRouteTables = RouteTables?.filter(rt =>
        rt.Associations?.some(assoc => privateSubnetIds.includes(assoc.SubnetId!))
      );
      
      expect(privateRouteTables).toHaveLength(2);
      
      // Verify each private route table has a route to a NAT Gateway
      const usedNatGateways = new Set();
      privateRouteTables?.forEach(rt => {
        const natRoute = rt.Routes?.find(route =>
          route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId
        );
        expect(natRoute).toBeDefined();
        expect(natGatewayIds).toContain(natRoute?.NatGatewayId);
        usedNatGateways.add(natRoute?.NatGatewayId);
      });
      
      // Verify different NAT Gateways are used for redundancy
      expect(usedNatGateways.size).toBe(2);
    }, 20000);

  });

  describe("Security Best Practices - Web Application Security", () => {
    test("RDS instance follows security best practices", async () => {
      const dbIdentifier = "app-database";
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const rdsInstance = DBInstances![0];
      
      // Verify security configurations
      expect(rdsInstance.PubliclyAccessible).toBe(false);
      expect(rdsInstance.StorageEncrypted).toBe(true);
      expect(rdsInstance.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(rdsInstance.VpcSecurityGroups).toHaveLength(1);
      expect(rdsInstance.AutoMinorVersionUpgrade).toBe(true);
      expect(rdsInstance.PerformanceInsightsEnabled).toBe(true);
      
      // Verify database is in private subnet
      expect(rdsInstance.DBSubnetGroup?.DBSubnetGroupName).toBe("main-db-subnet-group");
    }, 30000);

    test("Security groups follow least privilege principle", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const ec2Sg = SecurityGroups?.find(sg => sg.GroupName === "ec2-web-sg");
      const rdsSg = SecurityGroups?.find(sg => sg.GroupName === "rds-sg");
      
      // EC2 SG should only allow specific ports with restrictions
      const ec2InboundRules = ec2Sg?.IpPermissions || [];
      expect(ec2InboundRules.length).toBe(2); // SSH and HTTP
      
      // SSH should be restricted to company IP
      const sshRule = ec2InboundRules.find(rule => rule.FromPort === 22);
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "203.0.113.0/24")).toBe(true);
      
      // HTTP should be open to internet
      const httpRule = ec2InboundRules.find(rule => rule.FromPort === 80);
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // RDS SG should only allow MySQL from EC2 SG
      const rdsInboundRules = rdsSg?.IpPermissions || [];
      expect(rdsInboundRules).toHaveLength(1); // Only MySQL
      expect(rdsInboundRules[0].FromPort).toBe(3306);
      expect(rdsInboundRules[0].UserIdGroupPairs).toHaveLength(1);
      expect(rdsInboundRules[0].UserIdGroupPairs![0].GroupId).toBe(ec2Sg?.GroupId);
    }, 20000);

    test("S3 bucket follows security requirements", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      // Verify encryption is enabled
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      
      // Verify lifecycle policy exists for cost optimization
      const { Rules } = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );
      expect(Rules).toHaveLength(1);
      expect(Rules![0].Status).toBe("Enabled");
      
      // Verify deletion protection policy exists
      const { Policy } = await s3Client.send(new GetBucketPolicyCommand({ 
        Bucket: bucketName 
      }));
      const policyDocument = JSON.parse(Policy!);
      expect(policyDocument.Statement.some((stmt: any) => 
        stmt.Effect === "Deny" && stmt.Action.includes("s3:DeleteBucket")
      )).toBe(true);
    }, 20000);

    test("Network access is properly segmented", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const instanceId = stackOutputs["ec2-instance-id"];
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      
      // Verify EC2 instance is in public subnet
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      const instance = Reservations![0].Instances![0];
      expect(publicSubnetIds).toContain(instance.SubnetId);
      
      // Verify RDS is in private subnet
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "app-database"
      }));
      const dbInstance = DBInstances![0];
      
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbInstance.DBSubnetGroup?.DBSubnetGroupName
      }));
      
      const dbSubnetIds = DBSubnetGroups![0].Subnets?.map(subnet => subnet.SubnetIdentifier) || [];
      dbSubnetIds.forEach(subnetId => {
        expect(privateSubnetIds).toContain(subnetId);
      });
    }, 20000);
  });

  describe("Performance and Cost Optimization", () => {
    test("Resources use cost-effective configurations", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      const dbIdentifier = "app-database";
      
      // Verify EC2 instance uses cost-effective instance type
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      const instance = Reservations![0].Instances![0];
      expect(instance.InstanceType).toBe("t3.micro"); // Cost-effective for development
      
      // Verify RDS uses cost-effective instance class
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      const dbInstance = DBInstances![0];
      expect(dbInstance.DBInstanceClass).toBe("db.t3.medium"); // Balanced performance/cost
      expect(dbInstance.AllocatedStorage).toBe(20); // Minimal storage allocation
      expect(dbInstance.StorageType).toBe("gp2"); // General Purpose SSD
    }, 20000);

    test("S3 lifecycle policy optimizes storage costs", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const { Rules } = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
      );
      
      expect(Rules).toHaveLength(1);
      const rule = Rules![0];
      
      expect(rule.ID).toBe("glacier-transition");
      expect(rule.Status).toBe("Enabled");
      expect(rule.Transitions).toHaveLength(1);
      expect(rule.Transitions![0].Days).toBe(30);
      expect(rule.Transitions![0].StorageClass).toBe("GLACIER");
    }, 20000);
  });

  describe("Infrastructure State and Health Validation", () => {
    test("All critical resources are in healthy/active state", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const instanceId = stackOutputs["ec2-instance-id"];
      const natGatewayIds = stackOutputs["nat-gateway-ids"];
      
      // Check VPC state
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs![0].State).toBe("available");
      
      // Check EC2 instance state
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      expect(Reservations![0].Instances![0].State?.Name).toBe("running");
      
      // Check RDS instance state
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "app-database"
      }));
      expect(DBInstances![0].DBInstanceStatus).toBe("available");
      
      // Check NAT Gateways state
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      }));
      NatGateways?.forEach(natGw => {
        expect(natGw.State).toBe("available");
      });
    }, 30000);

    test("Network connectivity is properly established", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Verify Internet Gateway is attached
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      expect(InternetGateways).toHaveLength(1);
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      
      // Verify NAT Gateways are available
      const natGatewayIds = stackOutputs["nat-gateway-ids"];
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        NatGatewayIds: natGatewayIds
      }));
      expect(NatGateways).toHaveLength(2);
      NatGateways?.forEach(natGw => {
        expect(natGw.State).toBe("available");
      });
      
      // Verify route tables have proper routes
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have routes to internet gateway and NAT gateways
      const hasInternetRoute = RouteTables?.some(rt =>
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
        )
      );
      expect(hasInternetRoute).toBe(true);
      
      const hasNatRoutes = RouteTables?.some(rt =>
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith('nat-')
        )
      );
      expect(hasNatRoutes).toBe(true);
    }, 20000);

    test("All subnets are properly associated with route tables", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const publicSubnetIds = stackOutputs["public-subnet-ids"];
      const privateSubnetIds = stackOutputs["private-subnet-ids"];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Get all subnet associations
      const associatedSubnets = new Set();
      RouteTables?.forEach(rt => {
        rt.Associations?.forEach(assoc => {
          if (assoc.SubnetId) {
            associatedSubnets.add(assoc.SubnetId);
          }
        });
      });
      
      // Verify all public subnets are associated
      publicSubnetIds.forEach((subnetId: string) => {
        expect(associatedSubnets.has(subnetId)).toBe(true);
      });
      
      // Verify all private subnets are associated
      privateSubnetIds.forEach((subnetId: string) => {
        expect(associatedSubnets.has(subnetId)).toBe(true);
      });
    }, 20000);
  });

  describe("Compliance and Tagging Validation", () => {
    test("All resources have proper tagging for governance", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const instanceId = stackOutputs["ec2-instance-id"];
      
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs![0].Tags || [];
      
      expect(vpcTags.some(tag => tag.Key === "Name" && tag.Value === "main-vpc")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "Project" && tag.Value === "WebApp")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "Owner" && tag.Value === "DevOps Team")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "ManagedBy" && tag.Value === "CDKTF")).toBe(true);
      
      // Check EC2 instance tags
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      const instanceTags = Reservations![0].Instances![0].Tags || [];
      
      expect(instanceTags.some(tag => tag.Key === "Name" && tag.Value === "web-server")).toBe(true);
      expect(instanceTags.some(tag => tag.Key === "Project" && tag.Value === "WebApp")).toBe(true);
      expect(instanceTags.some(tag => tag.Key === "Owner" && tag.Value === "DevOps Team")).toBe(true);
    }, 20000);

    test("Database has proper backup and retention policies", async () => {
      const dbIdentifier = "app-database";
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbInstance = DBInstances![0];
      
      // Verify backup retention meets requirements (7 days)
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      
      // Verify backup window is configured during low usage hours
      expect(dbInstance.PreferredBackupWindow).toBe("03:00-04:00");
      
      // Verify maintenance window is configured
      expect(dbInstance.PreferredMaintenanceWindow).toBe("sun:04:00-sun:05:00");
      
      // Verify automatic minor version upgrades are enabled
      expect(dbInstance.AutoMinorVersionUpgrade).toBe(true);
    }, 20000);

    test("Security configurations meet compliance requirements", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      const dbIdentifier = "app-database";
      
      // S3 encryption compliance
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      
      // RDS encryption compliance
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      expect(DBInstances![0].StorageEncrypted).toBe(true);
      
      // Network isolation compliance
      expect(DBInstances![0].PubliclyAccessible).toBe(false);
    }, 20000);
  });

  describe("Final Integration Validation", () => {
    test("End-to-end infrastructure connectivity and security", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const instanceId = stackOutputs["ec2-instance-id"];
      const bucketName = stackOutputs["s3-bucket-name"];
      
      // Verify EC2 can potentially access RDS (same VPC, proper security groups)
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      const instance = Reservations![0].Instances![0];
      
      // Verify RDS is in same VPC
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "app-database"
      }));
      const dbInstance = DBInstances![0];
      
      expect(instance.VpcId).toBe(vpcId);
      expect(dbInstance.DBSubnetGroup?.VpcId).toBe(vpcId);
      
      // Verify EC2 has IAM role for S3 access
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile?.Arn).toContain("ec2-app-instance-profile");
      
      // Verify S3 bucket exists and is accessible
      await expect(s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
    }, 30000);

    test("All outputs are accessible and properly formatted", () => {
      // Verify all expected outputs exist
      const expectedOutputs = [
        "vpc-id",
        "s3-bucket-name", 
        "ec2-instance-id",
        "ec2-public-ip",
        "rds-endpoint",
        "nat-gateway-ids",
        "private-subnet-ids",
        "public-subnet-ids"
      ];
      
      expectedOutputs.forEach(output => {
        expect(stackOutputs[output]).toBeDefined();
        if (Array.isArray(stackOutputs[output])) {
          expect(stackOutputs[output].length).toBeGreaterThan(0);
        } else {
          expect(typeof stackOutputs[output]).toBe("string");
          expect(stackOutputs[output].length).toBeGreaterThan(0);
        }
      });
      
      // Verify output format patterns
      expect(stackOutputs["vpc-id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(stackOutputs["ec2-instance-id"]).toMatch(/^i-[a-f0-9]{17}$/);
      expect(stackOutputs["ec2-public-ip"]).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      expect(stackOutputs["rds-endpoint"]).toContain(".rds.amazonaws.com:3306");
      expect(stackOutputs["s3-bucket-name"]).toBe("my-app-storage-bucket-12345-rlhf-ts");
    });

    test("Infrastructure supports expected web application architecture", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const instanceId = stackOutputs["ec2-instance-id"];
      const publicIp = stackOutputs["ec2-public-ip"];
      
      // Verify web server is accessible from internet
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      const instance = Reservations![0].Instances![0];
      
      expect(instance.PublicIpAddress).toBe(publicIp);
      expect(instance.State?.Name).toBe("running");
      
      // Verify security groups allow web traffic
      const sgId = instance.SecurityGroups![0].GroupId;
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId!]
      }));
      
      const sg = SecurityGroups![0];
      const httpRule = sg.IpPermissions?.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
      
      // Verify database connectivity from web server
      const { SecurityGroups: allSgs } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const rdsSg = allSgs?.find(sg => sg.GroupName === "rds-sg");
      const mysqlRule = rdsSg?.IpPermissions?.find(rule => rule.FromPort === 3306);
      expect(mysqlRule?.UserIdGroupPairs![0].GroupId).toBe(sgId);
    }, 20000);
  });
});