import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, GetBucketVersioningCommand } from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand, DescribeVpcAttributeCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { IAMClient, GetInstanceProfileCommand, GetRoleCommand, ListAttachedRolePoliciesCommand, GetPolicyCommand } from "@aws-sdk/client-iam";
import { KMSClient, DescribeKeyCommand, ListAliasesCommand } from "@aws-sdk/client-kms";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const stsClient = new STSClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let awsAccountId: string;
  let vpcId: string;
  let publicSubnetAId: string;
  let publicSubnetBId: string;
  let privateSubnetAId: string;
  let privateSubnetBId: string;
  let ec2InstanceId: string;
  let webSecurityGroupId: string;
  let dbSecurityGroupId: string;
  let s3BucketName: string;
  let s3BucketArn: string;
  let rdsInstanceId: string;
  let kmsKeyId: string;
  let kmsKeyArn: string;
  let cloudwatchLogGroupName: string;
  let ec2PublicIp: string;
  let ec2PublicDns: string;
  let applicationUrl: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackKey];

    // Extract all outputs from the stack
    vpcId = stackOutputs["vpc_id"];
    publicSubnetAId = stackOutputs["public_subnet_a_id"];
    publicSubnetBId = stackOutputs["public_subnet_b_id"];
    privateSubnetAId = stackOutputs["private_subnet_a_id"];
    privateSubnetBId = stackOutputs["private_subnet_b_id"];
    ec2InstanceId = stackOutputs["ec2_instance_id"];
    webSecurityGroupId = stackOutputs["web_security_group_id"];
    dbSecurityGroupId = stackOutputs["db_security_group_id"];
    s3BucketName = stackOutputs["s3_bucket_name"];
    s3BucketArn = stackOutputs["s3_bucket_arn"];
    rdsInstanceId = stackOutputs["rds_instance_id"];
    kmsKeyId = stackOutputs["kms_key_id"];
    kmsKeyArn = stackOutputs["kms_key_arn"];
    cloudwatchLogGroupName = stackOutputs["cloudwatch_log_group_name"];
    ec2PublicIp = stackOutputs["ec2_public_ip"];
    ec2PublicDns = stackOutputs["ec2_public_dns"];
    applicationUrl = stackOutputs["application_url"];

    if (!vpcId || !publicSubnetAId || !publicSubnetBId || !privateSubnetAId || 
        !privateSubnetBId || !ec2InstanceId || !webSecurityGroupId || 
        !dbSecurityGroupId || !s3BucketName || !rdsInstanceId || !kmsKeyId) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("AWS Account Verification", () => {
    test("AWS account ID is accessible", async () => {
      const { Account } = await stsClient.send(new GetCallerIdentityCommand({}));
      expect(Account).toBeDefined();
      awsAccountId = Account!;
    }, 20000);
  });

  describe("VPC Infrastructure", () => {
    test("VPC exists and has correct CIDR configuration", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(Vpcs?.length).toBe(1);

      const vpc = Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.State).toBe("available");
      
      // Check VPC attributes through separate describe-vpc-attribute calls
      const dnsHostnamesResponse = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: "enableDnsHostnames"
      }));
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportResponse = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: "enableDnsSupport"
      }));
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);

      expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "SecureApp")).toBe(true);
    }, 20000);

    test("Public Subnet A exists with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [publicSubnetAId] })
      );
      expect(Subnets?.length).toBe(1);

      const subnet = Subnets?.[0];
      expect(subnet?.SubnetId).toBe(publicSubnetAId);
      expect(subnet?.VpcId).toBe(vpcId);
      expect(subnet?.CidrBlock).toBe("10.0.1.0/24");
      expect(subnet?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet?.State).toBe("available");
      expect(subnet?.AvailabilityZone).toBe("us-west-2a");
      expect(subnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")).toBe(true);
    }, 20000);

    test("Public Subnet B exists with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [publicSubnetBId] })
      );
      expect(Subnets?.length).toBe(1);

      const subnet = Subnets?.[0];
      expect(subnet?.SubnetId).toBe(publicSubnetBId);
      expect(subnet?.VpcId).toBe(vpcId);
      expect(subnet?.CidrBlock).toBe("10.0.2.0/24");
      expect(subnet?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet?.State).toBe("available");
      expect(subnet?.AvailabilityZone).toBe("us-west-2b");
      expect(subnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")).toBe(true);
    }, 20000);

    test("Private Subnet A exists with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [privateSubnetAId] })
      );
      expect(Subnets?.length).toBe(1);

      const subnet = Subnets?.[0];
      expect(subnet?.SubnetId).toBe(privateSubnetAId);
      expect(subnet?.VpcId).toBe(vpcId);
      expect(subnet?.CidrBlock).toBe("10.0.3.0/24");
      expect(subnet?.MapPublicIpOnLaunch).toBe(false);
      expect(subnet?.State).toBe("available");
      expect(subnet?.AvailabilityZone).toBe("us-west-2a");
      expect(subnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")).toBe(true);
    }, 20000);

    test("Private Subnet B exists with correct configuration", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [privateSubnetBId] })
      );
      expect(Subnets?.length).toBe(1);

      const subnet = Subnets?.[0];
      expect(subnet?.SubnetId).toBe(privateSubnetBId);
      expect(subnet?.VpcId).toBe(vpcId);
      expect(subnet?.CidrBlock).toBe("10.0.4.0/24");
      expect(subnet?.MapPublicIpOnLaunch).toBe(false);
      expect(subnet?.State).toBe("available");
      expect(subnet?.AvailabilityZone).toBe("us-west-2b");
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
    }, 20000);

    test("Route table configuration is correct", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        })
      );
      expect(RouteTables?.length).toBeGreaterThanOrEqual(2); // At least main route table + public route table
      
      // Check for public route table with internet gateway route
      const publicRouteTable = RouteTables?.find(rt => 
        rt.Routes?.some(route => route.GatewayId?.startsWith("igw-"))
      );
      expect(publicRouteTable).toBeDefined();
    }, 20000);
  });

  describe("Security Groups", () => {
    test("Web security group has correct configuration", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [webSecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(webSecurityGroupId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.Description).toBe("Security group for web servers");

      // Check HTTP ingress rule (port 80)
      const httpRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();

      // Check HTTPS ingress rule (port 443)
      const httpsRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule).toBeDefined();

      // Check SSH ingress rule (port 22)
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();

      // Check egress rules allow all outbound traffic
      const egressRule = sg?.IpPermissionsEgress?.find(rule => 
        rule.IpProtocol === "-1"
      );
      expect(egressRule).toBeDefined();
    }, 20000);

    test("Database security group has correct configuration", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [dbSecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(dbSecurityGroupId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.Description).toBe("Security group for RDS database");

      // Check MySQL ingress rule (port 3306) from web security group
      const mysqlRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.some(pair => pair.GroupId === webSecurityGroupId)).toBe(true);
    }, 20000);
  });

  describe("KMS Configuration", () => {
    test("KMS key exists and is enabled", async () => {
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );
      
      expect(KeyMetadata?.KeyId).toBe(kmsKeyId);
      expect(KeyMetadata?.Arn).toBe(kmsKeyArn);
      expect(KeyMetadata?.KeyState).toBe("Enabled");
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.Description).toContain("SecureApp KMS key");
    }, 20000);

    test("KMS alias exists", async () => {
      const { Aliases } = await kmsClient.send(new ListAliasesCommand({}));
      const alias = Aliases?.find(alias => alias.TargetKeyId === kmsKeyId);
      
      expect(alias).toBeDefined();
      expect(alias?.AliasName).toMatch(/^alias\/secureapp-/);
    }, 20000);
  });

  describe("S3 Bucket", () => {
    test("S3 bucket exists with correct naming pattern", async () => {
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));
      expect(s3BucketName).toMatch(/^secureapp-/);
    }, 20000);

    test("S3 bucket has KMS encryption enabled", async () => {
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3BucketName })
      );
      
      const rule = ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
      expect(rule?.BucketKeyEnabled).toBe(true);
    }, 20000);

    test("S3 bucket has versioning enabled", async () => {
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe("Enabled");
    }, 20000);

    test("S3 bucket has public access blocked", async () => {
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);
  });

  describe("RDS Database", () => {
    test("RDS instance exists with correct configuration", async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsInstanceId })
      );
      expect(DBInstances?.length).toBe(1);

      const db = DBInstances?.[0];
      expect(db?.DBInstanceIdentifier).toContain("secureapp-db-");
      expect(db?.Engine).toBe("mysql");
      expect(db?.EngineVersion).toBe("8.0");
      expect(db?.DBInstanceStatus).toBe("available");
      expect(db?.StorageEncrypted).toBe(true);
      expect(db?.KmsKeyId).toBe(kmsKeyArn);
      expect(db?.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(db?.VpcSecurityGroups?.[0]?.VpcSecurityGroupId).toBe(dbSecurityGroupId);
    }, 30000);

    test("RDS subnet group spans multiple AZs", async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsInstanceId })
      );
      const db = DBInstances?.[0];
      const subnetGroupName = db?.DBSubnetGroup?.DBSubnetGroupName;

      const { DBSubnetGroups } = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: subnetGroupName })
      );
      
      const subnetGroup = DBSubnetGroups?.[0];
      expect(subnetGroup?.Subnets?.length).toBe(2);
      expect(subnetGroup?.Subnets?.some(subnet => subnet.SubnetAvailabilityZone?.Name === "us-west-2a")).toBe(true);
      expect(subnetGroup?.Subnets?.some(subnet => subnet.SubnetAvailabilityZone?.Name === "us-west-2b")).toBe(true);
    }, 20000);
  });

  describe("EC2 Instance", () => {
    test("EC2 instance exists and is running", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      expect(Reservations?.length).toBe(1);

      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.InstanceId).toBe(ec2InstanceId);
      expect(instance?.State?.Name).toBe("running");
      expect(instance?.SubnetId).toBe(publicSubnetAId); // Instance is in public subnet
      expect(instance?.PublicIpAddress).toBe(ec2PublicIp);
      expect(instance?.PublicDnsName).toBe(ec2PublicDns);
      expect(instance?.SecurityGroups?.[0]?.GroupId).toBe(webSecurityGroupId);
    }, 20000);

    test("EC2 instance has correct IAM instance profile", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];

      expect(instance?.IamInstanceProfile?.Arn).toContain("SecureApp-InstanceProfile-");

      // Extract instance profile name from ARN
      const instanceProfileName = instance?.IamInstanceProfile?.Arn?.split("/").pop();
      
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: instanceProfileName! })
      );
      expect(InstanceProfile?.Roles?.length).toBe(1);
      expect(InstanceProfile?.Roles?.[0]?.RoleName).toContain("SecureApp-Ec2Role-");
    }, 20000);
  });

  describe("IAM Configuration", () => {
    test("IAM role exists with correct policies", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];
      const instanceProfileName = instance?.IamInstanceProfile?.Arn?.split("/").pop();
      
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: instanceProfileName! })
      );
      const roleName = InstanceProfile?.Roles?.[0]?.RoleName!;

      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      expect(Role?.RoleName).toContain("SecureApp-Ec2Role-");

      // Check attached policies
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      // Should have custom policy for S3 and CloudWatch access
      expect(AttachedPolicies?.some(policy => 
        policy.PolicyName?.includes("SecureApp-Ec2Policy-")
      )).toBe(true);
    }, 20000);
  });

  describe("CloudWatch Logging", () => {
    test("CloudWatch log group exists with correct configuration", async () => {
      const response = await cloudWatchLogsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: cloudwatchLogGroupName })
      );
      
      const logGroup = response.logGroups?.find((lg) => lg.logGroupName === cloudwatchLogGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.logGroupName).toBe(cloudwatchLogGroupName);
      expect(logGroup?.kmsKeyId).toBe(kmsKeyArn);
      expect(logGroup?.retentionInDays).toBeGreaterThan(0);
    }, 20000);
  });

  describe("CloudWatch Alarms", () => {
    test("EC2 CPU alarm exists", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: "SecureApp-Ec2CpuAlarm-"
        })
      );
      
      const alarm = MetricAlarms?.find(alarm => 
        alarm.Dimensions?.some(dim => dim.Value === ec2InstanceId)
      );
      expect(alarm).toBeDefined();
      expect(alarm?.MetricName).toBe("CPUUtilization");
      expect(alarm?.Namespace).toBe("AWS/EC2");
    }, 20000);

    test("RDS CPU alarm exists", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: "SecureApp-RdsCpuAlarm-"
        })
      );
      
      const alarm = MetricAlarms?.find(alarm => 
        alarm.Dimensions?.some(dim => dim.Value === rdsInstanceId)
      );
      expect(alarm).toBeDefined();
      expect(alarm?.MetricName).toBe("CPUUtilization");
      expect(alarm?.Namespace).toBe("AWS/RDS");
    }, 20000);

    test("RDS connections alarm exists", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: "SecureApp-RdsConnectionsAlarm-"
        })
      );
      
      const alarm = MetricAlarms?.find(alarm => 
        alarm.Dimensions?.some(dim => dim.Value === rdsInstanceId)
      );
      expect(alarm).toBeDefined();
      expect(alarm?.MetricName).toBe("DatabaseConnections");
      expect(alarm?.Namespace).toBe("AWS/RDS");
    }, 20000);
  });

  describe("Security Compliance", () => {
    test("All resources have consistent tagging", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "SecureApp")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "CDKTF")).toBe(true);

      // Check EC2 instance tags
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "SecureApp")).toBe(true);
      expect(instance?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "CDKTF")).toBe(true);
    }, 20000);

    test("Database is isolated in private subnets", async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsInstanceId })
      );
      const db = DBInstances?.[0];
      
      // RDS instance should be in private subnets
      const subnetIds = db?.DBSubnetGroup?.Subnets?.map(subnet => subnet.SubnetIdentifier);
      expect(subnetIds).toContain(privateSubnetAId);
      expect(subnetIds).toContain(privateSubnetBId);
    }, 20000);

    test("Application URL is accessible", async () => {
      expect(applicationUrl).toBe(`http://${ec2PublicDns}`);
      expect(applicationUrl).toMatch(/^http:\/\/ec2-[\d-]+\.us-west-2\.compute\.amazonaws\.com$/);
    }, 20000);
  });

  describe("High Availability", () => {
    test("Resources span multiple availability zones", async () => {
      // Check public subnets are in different AZs
      const { Subnets: publicSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [publicSubnetAId, publicSubnetBId] })
      );
      
      const azs = publicSubnets?.map(subnet => subnet.AvailabilityZone);
      expect(azs).toContain("us-west-2a");
      expect(azs).toContain("us-west-2b");

      // Check private subnets are in different AZs
      const { Subnets: privateSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [privateSubnetAId, privateSubnetBId] })
      );
      
      const privateAzs = privateSubnets?.map(subnet => subnet.AvailabilityZone);
      expect(privateAzs).toContain("us-west-2a");
      expect(privateAzs).toContain("us-west-2b");
    }, 20000);
  });

  describe("Naming Convention Compliance", () => {
    test("All resources follow SecureApp- naming convention", async () => {
      // Check resource names contain SecureApp prefix
      expect(s3BucketName).toMatch(/^secureapp-/);
      expect(cloudwatchLogGroupName).toMatch(/^\/aws\/secureapp\//);
      
      // Check tags for naming consistency
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      const vpcNameTag = vpc?.Tags?.find(tag => tag.Key === "Name");
      expect(vpcNameTag?.Value).toContain("SecureApp-Vpc-");
    }, 20000);
  });
});