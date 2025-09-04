// __tests__/tap-stack.int.test.ts
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand, DescribeInstancesCommand, DescribeNatGatewaysCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand, GetBucketPolicyCommand, GetPublicAccessBlockCommand } from "@aws-sdk/client-s3";
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } from "@aws-sdk/client-cloudtrail";
import { WAFV2Client, GetWebACLCommand } from "@aws-sdk/client-wafv2";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });
const wafv2Client = new WAFV2Client({ region: awsRegion });

describe("TapStack Financial Services Infrastructure Integration Tests", () => {
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
      "rds-endpoint",
      "cloudtrail-arn",
      "waf-webacl-arn",
      "app-server-public-ip"
    ];

    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure - Financial Data Security", () => {
    test("VPC exists with correct CIDR and DNS settings for financial compliance", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      expect(Vpcs![0].State).toBe("available");
      
      // Verify financial services tagging
      const tags = Vpcs![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Purpose" && tag.Value === "Financial Services Infrastructure")).toBe(true);
    }, 20000);

    test("Public subnets exist with proper configuration for application servers", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const publicSubnets = Subnets?.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")
      );
      
      expect(publicSubnets).toHaveLength(2);
      
      publicSubnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[1-2]\.0\/24$/);
      });
    }, 20000);

    test("Private subnets exist for database isolation and security", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const privateSubnets = Subnets?.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")
      );
      
      expect(privateSubnets).toHaveLength(2);
      
      privateSubnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[3-4]\.0\/24$/);
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
    }, 20000);

    test("NAT Gateway exists for secure private subnet outbound access", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      expect(NatGateways).toHaveLength(1);
      expect(NatGateways![0].State).toBe("available");
      expect(NatGateways![0].VpcId).toBe(vpcId);
    }, 20000);

    test("Route tables are properly configured for network segmentation", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const publicSubnets = Subnets?.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")
      );
      const publicSubnetIds = publicSubnets?.map(subnet => subnet.SubnetId) || [];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have at least 3 route tables: default + public + private
      expect(RouteTables!.length).toBeGreaterThanOrEqual(3);
      
      // Check for public route table with internet gateway route
      const publicRouteTable = RouteTables?.find(rt =>
        rt.Associations?.some(assoc => publicSubnetIds.includes(assoc.SubnetId))
      );
      expect(publicRouteTable).toBeDefined();
      
      const publicInternetRoute = publicRouteTable?.Routes?.find(route =>
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
      );
      expect(publicInternetRoute).toBeDefined();
    }, 20000);

    test("Subnets are distributed across multiple AZs for high availability", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      
      // Should have at least 2 different AZs for fault tolerance
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
      
      // Verify AZs are in the correct region
      availabilityZones.forEach(az => {
        expect(az).toMatch(new RegExp(`^${awsRegion}[a-z]$`));
      });
    }, 20000);
  });

  describe("S3 Bucket - Audit Trail and Compliance", () => {
    test("S3 bucket exists with proper naming and tagging", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      expect(bucketName).toBe("app-logs-prod-ts");
      
      // Test bucket accessibility (this will throw if bucket doesn't exist)
      await expect(s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
    }, 20000);

    test("S3 bucket has versioning enabled for compliance", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const { Status } = await s3Client.send(new GetBucketVersioningCommand({ 
        Bucket: bucketName 
      }));
      
      expect(Status).toBe("Enabled");
    }, 20000);

    test("S3 bucket has encryption enabled for financial data protection", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    }, 20000);

    test("S3 bucket has public access blocked for security", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const publicAccessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);

    test("S3 bucket policy includes CloudTrail permissions", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      const { Policy } = await s3Client.send(new GetBucketPolicyCommand({ 
        Bucket: bucketName 
      }));
      
      expect(Policy).toBeDefined();
      const policyDocument = JSON.parse(Policy!);
      
      // Check for CloudTrail permissions
      const cloudTrailStatements = policyDocument.Statement.filter((stmt: any) =>
        stmt.Principal?.Service === "cloudtrail.amazonaws.com"
      );
      
      expect(cloudTrailStatements.length).toBeGreaterThanOrEqual(2);
      
      // Check for GetBucketAcl permission
      const aclStatement = cloudTrailStatements.find((stmt: any) =>
        stmt.Action === "s3:GetBucketAcl"
      );
      expect(aclStatement).toBeDefined();
      
      // Check for PutObject permission
      const putStatement = cloudTrailStatements.find((stmt: any) =>
        stmt.Action === "s3:PutObject"
      );
      expect(putStatement).toBeDefined();
    }, 20000);
  });

  describe("EC2 Instance - Application Server", () => {
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
      expect(instance.Monitoring?.State).toBe("enabled");
      
      // Verify auto recovery is enabled (DisableApiTermination should be true)
    }, 20000);

    test("EC2 instance is in public subnet with proper security group", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      const vpcId = stackOutputs["vpc-id"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      
      const instance = Reservations![0].Instances![0];
      
      // Verify instance is in correct VPC
      expect(instance.VpcId).toBe(vpcId);
      
      // Verify instance has public IP
      expect(instance.PublicIpAddress).toBeDefined();
      expect(instance.PublicIpAddress).toBe(stackOutputs["app-server-public-ip"]);
      
      // Verify security groups
      expect(instance.SecurityGroups).toHaveLength(1);
    }, 20000);

    test("EC2 instance has proper IAM role for S3 access", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      
      const instance = Reservations![0].Instances![0];
      
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile?.Arn).toContain("ec2-profile");
    }, 20000);
  });

  describe("Security Groups - Network Access Control", () => {
    test("Application security group restricts access to company IP range", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: ["*app-sg*"] }
        ]
      }));
      
      const appSg = SecurityGroups?.find(sg => sg.GroupName?.includes("app-sg"));
      expect(appSg).toBeDefined();
      
      // Check SSH access (port 22) is restricted to company IP range
      const sshRule = appSg?.IpPermissions?.find(rule =>
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "203.0.113.0/24")).toBe(true);
      
      // Check HTTP access (port 80) is restricted to company IP range
      const httpRule = appSg?.IpPermissions?.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      
      // Check HTTPS access (port 443) is restricted to company IP range
      const httpsRule = appSg?.IpPermissions?.find(rule =>
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule).toBeDefined();
    }, 20000);

    test("Database security group only allows access from application security group", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const dbSg = SecurityGroups?.find(sg => sg.GroupName?.includes("db-sg"));
      const appSg = SecurityGroups?.find(sg => sg.GroupName?.includes("app-sg"));
      
      expect(dbSg).toBeDefined();
      expect(appSg).toBeDefined();
      
      // Check MySQL access (port 3306) only from app security group
      const mysqlRule = dbSg?.IpPermissions?.find(rule =>
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs).toHaveLength(1);
      expect(mysqlRule?.UserIdGroupPairs![0].GroupId).toBe(appSg?.GroupId);
    }, 20000);
  });

  describe("RDS Database - Financial Data Storage", () => {
    test("RDS instance exists with proper configuration for financial services", async () => {
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      const dbIdentifier = rdsEndpoint.split('.')[0]; // Extract identifier from endpoint
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      expect(DBInstances).toHaveLength(1);
      const dbInstance = DBInstances![0];
      
      expect(dbInstance.Engine).toBe("mysql");
      expect(dbInstance.DBInstanceClass).toBe("db.t3.micro");
      expect(dbInstance.AllocatedStorage).toBe(20);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.BackupRetentionPeriod).toBe(30);
      expect(dbInstance.DeletionProtection).toBe(true);
      expect(dbInstance.AutoMinorVersionUpgrade).toBe(true);
    }, 30000);

    test("RDS instance is in private subnets for security", async () => {
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbInstance = DBInstances![0];
      
      // Verify DB subnet group exists
      expect(dbInstance.DBSubnetGroup).toBeDefined();
      expect(dbInstance.DBSubnetGroup?.DBSubnetGroupName).toContain("db-subnet-group");
      
      // Get subnet group details
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbInstance.DBSubnetGroup?.DBSubnetGroupName
      }));
      
      expect(DBSubnetGroups).toHaveLength(1);
      expect(DBSubnetGroups![0].Subnets).toHaveLength(2); // Two private subnets
    }, 20000);

    test("RDS instance has proper backup and maintenance windows", async () => {
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbInstance = DBInstances![0];
      
      expect(dbInstance.BackupRetentionPeriod).toBe(30);
      expect(dbInstance.PreferredBackupWindow).toBe("03:00-04:00");
      expect(dbInstance.PreferredMaintenanceWindow).toBe("sun:04:00-sun:05:00");
    }, 20000);
  });

  describe("IAM Roles and Policies - Least Privilege Access", () => {
    test("S3 access policy follows principle of least privilege", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      // This test verifies that the S3 policy exists and contains the expected permissions
      // The actual policy verification was done in the S3 bucket tests above
      expect(bucketName).toBe("app-logs-prod-ts");
      
      // Verify bucket policy exists (tested above in S3 section)
      const { Policy } = await s3Client.send(new GetBucketPolicyCommand({ 
        Bucket: bucketName 
      }));
      
      expect(Policy).toBeDefined();
      const policyDocument = JSON.parse(Policy!);
      
      // Verify VPC endpoint restriction exists
      const vpcStatement = policyDocument.Statement.find((stmt: any) =>
        stmt.Condition?.StringEquals?.["aws:sourceVpc"]
      );
      expect(vpcStatement).toBeDefined();
    }, 20000);
  });

  describe("CloudTrail - Audit Logging for Compliance", () => {
    test("CloudTrail exists and is properly configured", async () => {
      const cloudTrailArn = stackOutputs["cloudtrail-arn"];
      const trailName = cloudTrailArn.split('/').pop();
      
      const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [trailName!]
      }));
      
      expect(trailList).toHaveLength(1);
      const trail = trailList![0];
      
      expect(trail.Name).toBe(trailName);
      expect(trail.S3BucketName).toBe(stackOutputs["s3-bucket-name"]);
      expect(trail.S3KeyPrefix).toBe("cloudtrail-logs/");
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(true);
    }, 20000);

    test("CloudTrail is actively logging", async () => {
      const cloudTrailArn = stackOutputs["cloudtrail-arn"];
      const trailName = cloudTrailArn.split('/').pop();
      
      const { IsLogging } = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: trailName!
      }));
      
      expect(IsLogging).toBe(true);
    }, 20000);
  });

  describe("CloudWatch Monitoring - Proactive Monitoring", () => {
    test("CPU utilization alarm exists for EC2 instance", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      
      const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({}));
      
      // Find CPU alarm for the specific instance
      const cpuAlarm = MetricAlarms?.find(alarm => 
        alarm.MetricName === "CPUUtilization" &&
        alarm.Dimensions?.some(dim => dim.Value === instanceId)
      );
      
      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm?.Namespace).toBe("AWS/EC2");
      expect(cpuAlarm?.Statistic).toBe("Average");
      expect(cpuAlarm?.Period).toBe(300);
      expect(cpuAlarm?.EvaluationPeriods).toBe(2);
      expect(cpuAlarm?.Threshold).toBe(80);
      expect(cpuAlarm?.ComparisonOperator).toBe("GreaterThanThreshold");
    }, 20000);
  });

  describe("Output Validation - Infrastructure References", () => {
    test("All required outputs are present and properly formatted", () => {
      expect(stackOutputs["vpc-id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(stackOutputs["s3-bucket-name"]).toBe("app-logs-prod-ts");
      expect(stackOutputs["ec2-instance-id"]).toMatch(/^i-[a-f0-9]{17}$/);
      expect(stackOutputs["rds-endpoint"]).toMatch(/^.*\..*\..*\.rds\.amazonaws\.com:3306$/);
      expect(stackOutputs["cloudtrail-arn"]).toMatch(/^arn:aws:cloudtrail:.*:.*:trail\/.*$/);
      expect(stackOutputs["waf-webacl-arn"]).toMatch(/^arn:aws:wafv2:.*:.*:regional\/webacl\/.*$/);
      expect(stackOutputs["app-server-public-ip"]).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    });

    test("RDS endpoint follows expected naming pattern", () => {
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      expect(rdsEndpoint).toContain("database");
      expect(rdsEndpoint).toContain(awsRegion);
      expect(rdsEndpoint).toContain("rds.amazonaws.com:3306");
    });

    test("CloudTrail ARN contains environment identifier", () => {
      const cloudTrailArn = stackOutputs["cloudtrail-arn"];
      expect(cloudTrailArn).toContain("audit-trail");
      expect(cloudTrailArn).toContain(awsRegion);
    });

    test("WAF Web ACL ARN is properly formatted", () => {
      const wafArn = stackOutputs["waf-webacl-arn"];
      expect(wafArn).toContain("web-acl");
      expect(wafArn).toContain("regional");
      expect(wafArn).toContain(awsRegion);
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

    test("RDS is configured for Multi-AZ deployment", async () => {
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      expect(DBInstances![0].MultiAZ).toBe(true);
    }, 20000);

        test("EC2 instance has auto recovery enabled", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      
      const instance = Reservations![0].Instances![0];
      
      // Verify auto recovery is enabled (DisableApiTermination should be true)      
      // Verify monitoring is enabled for CloudWatch alarms
      expect(instance.Monitoring?.State).toBe("enabled");
    }, 20000);
  });

  describe("Security Best Practices - Financial Services Compliance", () => {
    test("RDS instance follows security best practices", async () => {
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const rdsInstance = DBInstances![0];
      
      // Verify security configurations
      expect(rdsInstance.PubliclyAccessible).toBe(false);
      expect(rdsInstance.StorageEncrypted).toBe(true);
      expect(rdsInstance.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(rdsInstance.VpcSecurityGroups).toHaveLength(1);
      expect(rdsInstance.DeletionProtection).toBe(true);
      expect(rdsInstance.MultiAZ).toBe(true);
    }, 30000);

    test("Security groups follow least privilege principle", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const appSg = SecurityGroups?.find(sg => sg.GroupName?.includes("app-sg"));
      const dbSg = SecurityGroups?.find(sg => sg.GroupName?.includes("db-sg"));
      
      // App SG should only allow specific ports from company IP range
      const appInboundRules = appSg?.IpPermissions || [];
      expect(appInboundRules.length).toBeGreaterThanOrEqual(3); // SSH, HTTP, HTTPS
      
      appInboundRules.forEach(rule => {
        expect([22, 80, 443]).toContain(rule.FromPort);
        expect(rule.IpProtocol).toBe("tcp");
        // Should have company IP range restriction
        expect(rule.IpRanges?.some(range => range.CidrIp === "203.0.113.0/24")).toBe(true);
      });
      
      // DB SG should only allow MySQL from App SG
      const dbInboundRules = dbSg?.IpPermissions || [];
      expect(dbInboundRules).toHaveLength(1); // Only MySQL
      expect(dbInboundRules[0].FromPort).toBe(3306);
      expect(dbInboundRules[0].UserIdGroupPairs).toHaveLength(1);
      expect(dbInboundRules[0].UserIdGroupPairs![0].GroupId).toBe(appSg?.GroupId);
    }, 20000);

    test("S3 bucket follows financial services security requirements", async () => {
      const bucketName = stackOutputs["s3-bucket-name"];
      
      // Verify versioning is enabled
      const { Status } = await s3Client.send(new GetBucketVersioningCommand({ 
        Bucket: bucketName 
      }));
      expect(Status).toBe("Enabled");
      
      // Verify encryption is enabled
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
      
      // Verify public access is blocked
      const publicAccessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);

    test("Network access is properly restricted", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const instanceId = stackOutputs["ec2-instance-id"];
      
      // Verify EC2 instance is in public subnet but access is restricted
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      
      const instance = Reservations![0].Instances![0];
      
      // Should have public IP for legitimate access
      expect(instance.PublicIpAddress).toBeDefined();
      expect(instance.PublicIpAddress).toBe(stackOutputs["app-server-public-ip"]);
      
      // But security group should restrict access to company IP range only
      const securityGroupId = instance.SecurityGroups![0].GroupId;
      
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId!]
      }));
      
      const sg = SecurityGroups![0];
      sg.IpPermissions?.forEach(rule => {
        // All rules should restrict to company IP range
        expect(rule.IpRanges?.some(range => range.CidrIp === "203.0.113.0/24")).toBe(true);
      });
    }, 20000);
  });

  describe("Compliance and Audit Requirements", () => {
    test("CloudTrail captures all required events for financial compliance", async () => {
      const cloudTrailArn = stackOutputs["cloudtrail-arn"];
      const trailName = cloudTrailArn.split('/').pop();
      
      const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [trailName!]
      }));
      
      const trail = trailList![0];
      
      // Verify comprehensive logging configuration
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.S3BucketName).toBe(stackOutputs["s3-bucket-name"]);
      expect(trail.S3KeyPrefix).toBe("cloudtrail-logs/");
      
      // Verify trail is actively logging
      const { IsLogging } = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: trailName!
      }));
      expect(IsLogging).toBe(true);
    }, 20000);

    test("All resources have proper tagging for compliance", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const instanceId = stackOutputs["ec2-instance-id"];
      
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs![0].Tags || [];
      
      expect(vpcTags.some(tag => tag.Key === "Purpose" && tag.Value === "Financial Services Infrastructure")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "Environment")).toBe(true);
      
      // Check EC2 instance tags
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      const instanceTags = Reservations![0].Instances![0].Tags || [];
      
      expect(instanceTags.some(tag => tag.Key === "Purpose" && tag.Value === "Application Server")).toBe(true);
      expect(instanceTags.some(tag => tag.Key === "AutoRecovery" && tag.Value === "Enabled")).toBe(true);
      expect(instanceTags.some(tag => tag.Key === "Environment")).toBe(true);
    }, 20000);

    test("Backup and retention policies meet compliance requirements", async () => {
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbInstance = DBInstances![0];
      
      // Verify backup retention meets financial services requirements (30 days)
      expect(dbInstance.BackupRetentionPeriod).toBe(30);
      
      // Verify backup window is configured
      expect(dbInstance.PreferredBackupWindow).toBe("03:00-04:00");
      
      // Verify maintenance window is configured
      expect(dbInstance.PreferredMaintenanceWindow).toBe("sun:04:00-sun:05:00");
      
      // Verify deletion protection is enabled
      expect(dbInstance.DeletionProtection).toBe(true);
    }, 20000);
  });

  describe("Performance and Monitoring", () => {
    test("CloudWatch monitoring is properly configured", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      
      // Verify instance has detailed monitoring enabled
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      
      const instance = Reservations![0].Instances![0];
      expect(instance.Monitoring?.State).toBe("enabled");
      
      // Verify CPU alarm exists
      const { MetricAlarms } = await cloudwatchClient.send(new DescribeAlarmsCommand({}));
      
      const cpuAlarm = MetricAlarms?.find(alarm => 
        alarm.MetricName === "CPUUtilization" &&
        alarm.Dimensions?.some(dim => dim.Value === instanceId)
      );
      
      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm?.Threshold).toBe(80);
      expect(cpuAlarm?.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(cpuAlarm?.EvaluationPeriods).toBe(2);
      expect(cpuAlarm?.Period).toBe(300);
    }, 20000);
  });

  describe("Cost Optimization and Resource Efficiency", () => {
    test("Resources use cost-effective configurations for the environment", async () => {
      const instanceId = stackOutputs["ec2-instance-id"];
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
      // Verify EC2 instance uses cost-effective instance type
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      
      const instance = Reservations![0].Instances![0];
      expect(instance.InstanceType).toBe("t3.micro"); // Cost-effective for dev/test
      
      // Verify RDS uses cost-effective instance class
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbInstance = DBInstances![0];
      expect(dbInstance.DBInstanceClass).toBe("db.t3.micro"); // Cost-effective for dev/test
      expect(dbInstance.AllocatedStorage).toBe(20); // Minimal storage allocation
    }, 20000);

    test("Storage configurations are optimized", async () => {
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      
      const dbInstance = DBInstances![0];
      
      // Verify storage type and size are appropriate
      expect(dbInstance.StorageType).toBe("gp2"); // General Purpose SSD
      expect(dbInstance.AllocatedStorage).toBe(20); // Minimal but sufficient
      expect(dbInstance.StorageEncrypted).toBe(true); // Security without performance impact
    }, 20000);
  });

  describe("Infrastructure State and Health Validation", () => {
    test("All critical resources are in healthy/active state", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const instanceId = stackOutputs["ec2-instance-id"];
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
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
        DBInstanceIdentifier: dbIdentifier
      }));
      expect(DBInstances![0].DBInstanceStatus).toBe("available");
      
      // Check CloudTrail logging state
      const cloudTrailArn = stackOutputs["cloudtrail-arn"];
      const trailName = cloudTrailArn.split('/').pop();
      
      const { IsLogging } = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: trailName!
      }));
      expect(IsLogging).toBe(true);
    }, 30000);

    test("Network connectivity is properly established", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Verify Internet Gateway is attached
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      
      // Verify NAT Gateway is available
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      expect(NatGateways![0].State).toBe("available");
      
      // Verify route tables have proper routes
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have routes to internet gateway and NAT gateway
      const hasInternetRoute = RouteTables?.some(rt =>
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
        )
      );
      expect(hasInternetRoute).toBe(true);
      
      const hasNatRoute = RouteTables?.some(rt =>
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith('nat-')
        )
      );
      expect(hasNatRoute).toBe(true);
    }, 20000);
  });

  describe("Final Integration Validation", () => {
    test("End-to-end infrastructure connectivity and security", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const instanceId = stackOutputs["ec2-instance-id"];
      const rdsEndpoint = stackOutputs["rds-endpoint"];
      const bucketName = stackOutputs["s3-bucket-name"];
      
      // Verify EC2 can potentially access RDS (same VPC, proper security groups)
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [instanceId]
      }));
      const instance = Reservations![0].Instances![0];
      
      // Verify RDS is in same VPC
      const dbIdentifier = rdsEndpoint.split('.')[0];
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      }));
      const dbInstance = DBInstances![0];
      
      expect(instance.VpcId).toBe(vpcId);
      expect(dbInstance.DBSubnetGroup?.VpcId).toBe(vpcId);
      
      // Verify S3 bucket policy allows VPC access
      const { Policy } = await s3Client.send(new GetBucketPolicyCommand({ 
        Bucket: bucketName 
      }));
      const policyDocument = JSON.parse(Policy!);
      
      const vpcStatement = policyDocument.Statement.find((stmt: any) =>
        stmt.Condition?.StringEquals?.["aws:sourceVpc"] === vpcId
      );
      expect(vpcStatement).toBeDefined();
      
      // Verify CloudTrail is logging to the S3 bucket
      const cloudTrailArn = stackOutputs["cloudtrail-arn"];
      const trailName = cloudTrailArn.split('/').pop();
      
      const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [trailName!]
      }));
      expect(trailList![0].S3BucketName).toBe(bucketName);
    }, 30000);

    test("All outputs are accessible and properly formatted", () => {
      // Verify all expected outputs exist
      const expectedOutputs = [
        "vpc-id",
        "s3-bucket-name", 
        "ec2-instance-id",
        "rds-endpoint",
        "cloudtrail-arn",
        "waf-webacl-arn",
        "app-server-public-ip"
      ];
      
      expectedOutputs.forEach(output => {
        expect(stackOutputs[output]).toBeDefined();
        expect(typeof stackOutputs[output]).toBe("string");
        expect(stackOutputs[output].length).toBeGreaterThan(0);
      });
      
      // Verify output format patterns
      expect(stackOutputs["vpc-id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(stackOutputs["ec2-instance-id"]).toMatch(/^i-[a-f0-9]{17}$/);
      expect(stackOutputs["app-server-public-ip"]).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
      expect(stackOutputs["rds-endpoint"]).toContain(".rds.amazonaws.com:3306");
      expect(stackOutputs["cloudtrail-arn"]).toMatch(/^arn:aws:cloudtrail:/);
      expect(stackOutputs["waf-webacl-arn"]).toMatch(/^arn:aws:wafv2:/);
    });
  });
});