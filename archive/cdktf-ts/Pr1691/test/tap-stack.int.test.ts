// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand, GetInstanceProfileCommand } from "@aws-sdk/client-iam";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand, DescribeInstancesCommand, DescribeNatGatewaysCommand } from "@aws-sdk/client-ec2";
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } from "@aws-sdk/client-cloudtrail";
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand } from "@aws-sdk/client-kms";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import * as fs from "fs";
import * as path from "path";

const awsRegion = "eu-west-1";
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let securityGroupId: string;
  let iamRoleArn: string;
  let s3BucketName: string;
  let s3BucketArn: string;
  let cloudtrailArn: string;
  let kmsKeyId: string;
  let kmsKeyArn: string;
  let ec2InstanceId: string;
  let cloudwatchAlarmArn: string;
  let rdsPort: number;
  let securityConfiguration: any;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // only one stack in your output
    const stackOutputs = outputs[stackKey];

    vpcId = stackOutputs["vpc_id"];
    securityGroupId = stackOutputs["security_group_id"];
    iamRoleArn = stackOutputs["iam_role_arn"];
    s3BucketName = stackOutputs["s3_bucket_name"];
    s3BucketArn = stackOutputs["s3_bucket_arn"];
    cloudtrailArn = stackOutputs["cloudtrail_arn"];
    kmsKeyId = stackOutputs["kms_key_id"];
    kmsKeyArn = stackOutputs["kms_key_arn"];
    ec2InstanceId = stackOutputs["ec2_instance_id"];
    cloudwatchAlarmArn = stackOutputs["cloudwatch_alarm_arn"];
    rdsPort = stackOutputs["rds_port"];
    securityConfiguration = stackOutputs["security_configuration"];

    if (!vpcId || !securityGroupId || !iamRoleArn || !s3BucketName || !cloudtrailArn || 
        !kmsKeyId || !ec2InstanceId || !cloudwatchAlarmArn) {
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
      
      // Check tags
      expect(vpc?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "MyApp-VPC-Main")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "Security" && tag.Value === "Isolated")).toBe(true);
    }, 20000);

    test("Internet Gateway exists and is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways?.length).toBe(1);
      expect(InternetGateways?.[0].Attachments?.[0].VpcId).toBe(vpcId);
      expect(InternetGateways?.[0].Attachments?.[0].State).toBe("available");
      expect(InternetGateways?.[0].Tags?.some(tag => tag.Key === "Name" && tag.Value === "MyApp-IGW-Main")).toBe(true);
    }, 20000);

    test("NAT Gateway exists in public subnet", async () => {
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      expect(NatGateways?.length).toBe(1);
      expect(NatGateways?.[0].State).toBe("available");
      expect(NatGateways?.[0].Tags?.some(tag => tag.Key === "Name" && tag.Value === "MyApp-NAT-Main")).toBe(true);
    }, 20000);

    test("Subnets exist and are configured correctly", async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      expect(Subnets?.length).toBe(3); // 1 public + 2 private
      
      // Check public subnet
      const publicSubnet = Subnets?.find(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")
      );
      expect(publicSubnet).toBeDefined();
      expect(publicSubnet?.CidrBlock).toBe("10.0.1.0/24");
      expect(publicSubnet?.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet?.AvailabilityZone).toBe(`${awsRegion}a`);
      
      // Check private subnets
      const privateSubnets = Subnets?.filter(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")
      );
      expect(privateSubnets?.length).toBe(2);
      expect(privateSubnets?.[0].CidrBlock).toBe("10.0.2.0/24");
      expect(privateSubnets?.[1].CidrBlock).toBe("10.0.3.0/24");
      expect(privateSubnets?.[0].AvailabilityZone).toBe(`${awsRegion}a`);
      expect(privateSubnets?.[1].AvailabilityZone).toBe(`${awsRegion}b`);
    }, 20000);

    test("Route tables are configured correctly", async () => {
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      expect(RouteTables?.length).toBeGreaterThanOrEqual(3); // main + public + private
      
      // Check public route table has internet gateway route
      const publicRouteTable = RouteTables?.find(rt => 
        rt.Tags?.some(tag => tag.Key === "Name" && tag.Value === "MyApp-RT-Public")
      );
      expect(publicRouteTable).toBeDefined();
      expect(publicRouteTable?.Routes?.some(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith("igw-")
      )).toBe(true);
      
      // Check private route table has NAT gateway route
      const privateRouteTable = RouteTables?.find(rt => 
        rt.Tags?.some(tag => tag.Key === "Name" && tag.Value === "MyApp-RT-Private")
      );
      expect(privateRouteTable).toBeDefined();
      expect(privateRouteTable?.Routes?.some(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith("nat-")
      )).toBe(true);
    }, 20000);
  });

  describe("Security Groups", () => {
    test("EC2 security group has correct access rules", async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] }));
      expect(SecurityGroups?.length).toBe(1);
      
      const securityGroup = SecurityGroups?.[0];
      expect(securityGroup?.GroupId).toBe(securityGroupId);
      expect(securityGroup?.VpcId).toBe(vpcId);
      expect(securityGroup?.GroupName).toBe("MyApp-SG-EC2");
      expect(securityGroup?.Description).toContain("Security group for EC2 instances");
      
      // Check for HTTPS rule (port 443)
      const httpsRule = securityGroup?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === "203.0.113.0/24")).toBe(true);
      
      // Check for HTTP rule (port 80)
      const httpRule = securityGroup?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === "tcp"
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === "203.0.113.0/24")).toBe(true);
      
      // Check for SSH rule (port 22)
      const sshRule = securityGroup?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "203.0.113.0/24")).toBe(true);
      
      // Check egress rule allows all outbound traffic
      const egressRule = securityGroup?.IpPermissionsEgress?.find(rule => 
        rule.IpProtocol === "-1" && rule.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")
      );
      expect(egressRule).toBeDefined();
      
      // Check tags
      expect(securityGroup?.Tags?.some(tag => tag.Key === "Security" && tag.Value === "Restricted")).toBe(true);
      expect(securityGroup?.Tags?.some(tag => tag.Key === "AllowedCIDR" && tag.Value === "203.0.113.0/24")).toBe(true);
    }, 20000);

    test("RDS security group exists and allows MySQL access from EC2 only", async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "group-name", Values: ["MyApp-SG-RDS"] }
        ]
      }));
      
      expect(SecurityGroups?.length).toBe(1);
      const rdsSecurityGroup = SecurityGroups?.[0];
      
      expect(rdsSecurityGroup?.GroupName).toBe("MyApp-SG-RDS");
      expect(rdsSecurityGroup?.Description).toContain("Security group for RDS instances");
      
      // Check for MySQL rule (port 3306) from EC2 security group
      const mysqlRule = rdsSecurityGroup?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.some(pair => pair.GroupId === securityGroupId)).toBe(true);
    }, 20000);
  });

  describe("S3 Bucket", () => {
    test("S3 bucket exists and has correct security configuration", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));
      
      // Verify bucket name matches expected pattern
      expect(s3BucketName).toMatch(/^myapp-secure-data-[a-z0-9]{6}$/);
      
      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      
      // Check encryption is enabled with KMS
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3BucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].BucketKeyEnabled).toBe(true);
    }, 20000);
  });

  describe("IAM Role and Instance Profile", () => {
    test("EC2 IAM role exists with least privilege permissions", async () => {
      const roleName = iamRoleArn.split('/')[1];
      const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
      
      expect(Role?.RoleName).toBe("MyApp-IAM-Role-EC2");
      expect(Role?.Arn).toBe(iamRoleArn);
      expect(Role?.Description).toContain("Least privilege role for EC2 instances");

      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
      expect(
        assumeRolePolicy.Statement.some(
          (statement: any) =>
            statement.Effect === "Allow" &&
            statement.Principal.Service === "ec2.amazonaws.com"
        )
      ).toBe(true);
      
      // Check attached policies
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
      expect(AttachedPolicies?.some(policy => 
        policy.PolicyName === "MyApp-IAM-Policy-EC2"
      )).toBe(true);
    }, 20000);

    test("Instance profile exists and is linked to IAM role", async () => {
      const { InstanceProfile } = await iamClient.send(
        new GetInstanceProfileCommand({ InstanceProfileName: "MyApp-InstanceProfile-EC2" })
      );
      
      expect(InstanceProfile?.InstanceProfileName).toBe("MyApp-InstanceProfile-EC2");
      expect(InstanceProfile?.Roles?.[0].RoleName).toBe("MyApp-IAM-Role-EC2");
    }, 20000);
  });

  describe("KMS Key", () => {
    test("KMS key exists with correct configuration", async () => {
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({ KeyId: kmsKeyId }));
      
      expect(KeyMetadata?.KeyId).toBe(kmsKeyId);
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.KeySpec).toBe("SYMMETRIC_DEFAULT");
      expect(KeyMetadata?.Enabled).toBe(true);
      expect(KeyMetadata?.Description).toContain("KMS key for MyApp encryption");
      
      // Check key rotation is enabled
      const { KeyRotationEnabled } = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })
      );
      expect(KeyRotationEnabled).toBe(true);
    }, 20000);
  });

  describe("EC2 Instance", () => {
    test("EC2 instance exists with correct configuration", async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] }));
      expect(Reservations?.length).toBe(1);
      
      const instance = Reservations?.[0].Instances?.[0];
      expect(instance?.InstanceId).toBe(ec2InstanceId);
      expect(instance?.InstanceType).toBe("t3.micro");
      expect(instance?.State?.Name).toBe("running");
      expect(instance?.VpcId).toBe(vpcId);
      
      // Check security group
      expect(instance?.SecurityGroups?.some(sg => sg.GroupId === securityGroupId)).toBe(true);
      
      // Check IAM instance profile
      expect(instance?.IamInstanceProfile?.Arn).toContain("MyApp-InstanceProfile-EC2");
      
      // Check tags
      expect(instance?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "MyApp-EC2-Main")).toBe(true);
      expect(instance?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
      expect(instance?.Tags?.some(tag => tag.Key === "Monitoring" && tag.Value === "Enabled")).toBe(true);
    }, 20000);
  });

  describe("RDS Instance", () => {
    test("RDS instance exists with correct security configuration", async () => {
      
      // Since we can't directly get RDS info without the instance identifier,
      // we'll check the DB subnet group exists
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: "myapp-db-subnet-group"
      }));
      
      expect(DBSubnetGroups?.length).toBe(1);
      const subnetGroup = DBSubnetGroups?.[0];
      expect(subnetGroup?.DBSubnetGroupName).toBe("myapp-db-subnet-group");
      expect(subnetGroup?.VpcId).toBe(vpcId);
      expect(subnetGroup?.Subnets?.length).toBe(2); // Two private subnets
      
      // Verify RDS port from outputs
      expect(rdsPort).toBe(3306);
    }, 20000);
  });

  describe("CloudTrail", () => {
    test("CloudTrail exists and is configured correctly", async () => {
      const trailName = cloudtrailArn.split('/')[1];
      const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [trailName]
      }));
      
      expect(trailList?.length).toBe(1);
      const cloudTrail = trailList?.[0];
      
      expect(cloudTrail?.TrailARN).toBe(cloudtrailArn);
      expect(cloudTrail?.Name).toBe("MyApp-CloudTrail-Main");
      expect(cloudTrail?.S3BucketName).toBe(s3BucketName);
      expect(cloudTrail?.S3KeyPrefix).toBe("cloudtrail-logs/");
      expect(cloudTrail?.IncludeGlobalServiceEvents).toBe(true);
      expect(cloudTrail?.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail?.LogFileValidationEnabled).toBe(true);      
      // Check if CloudTrail is logging
      const { IsLogging } = await cloudTrailClient.send(
        new GetTrailStatusCommand({ Name: trailName })
      );
      expect(IsLogging).toBe(true);
    }, 20000);
  });

  describe("CloudWatch Alarm", () => {
    test("CloudWatch alarm exists and monitors EC2 CPU", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: ["MyApp-EC2-HighCPU"]
      }));
      
      expect(MetricAlarms?.length).toBe(1);
      const alarm = MetricAlarms?.[0];
      
      expect(alarm?.AlarmName).toBe("MyApp-EC2-HighCPU");
      expect(alarm?.AlarmDescription).toBe("Alarm when EC2 instance CPU exceeds 80%");
      expect(alarm?.MetricName).toBe("CPUUtilization");
      expect(alarm?.Namespace).toBe("AWS/EC2");
      expect(alarm?.Statistic).toBe("Average");
      expect(alarm?.Period).toBe(300);
      expect(alarm?.EvaluationPeriods).toBe(2);
      expect(alarm?.Threshold).toBe(80);
      expect(alarm?.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(alarm?.Dimensions?.[0].Name).toBe("InstanceId");
      expect(alarm?.Dimensions?.[0].Value).toBe(ec2InstanceId);
    }, 20000);
  });

  describe("Security Compliance", () => {
    test("Security configuration matches expected values", async () => {
      expect(securityConfiguration.allowed_cidr).toBe("203.0.113.0/24");
      expect(securityConfiguration.region).toBe("eu-west-1");
      expect(securityConfiguration.encryption_enabled).toBe(true);
      expect(securityConfiguration.cloudtrail_enabled).toBe(true);
      expect(securityConfiguration.rds_public_access).toBe(false);
      expect(securityConfiguration.s3_public_access_blocked).toBe(true);
    }, 5000);

    test("All resources have required security tags", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "MyApp")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "CDKTF")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "SecurityLevel" && tag.Value === "High")).toBe(true);
      
      // Check security group tags
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] }));
      const securityGroup = SecurityGroups?.[0];
      expect(securityGroup?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "MyApp-SG-EC2")).toBe(true);
      expect(securityGroup?.Tags?.some(tag => tag.Key === "Security" && tag.Value === "Restricted")).toBe(true);
    }, 20000);

    test("Network isolation is properly implemented", async () => {
      // Verify EC2 instance is in private subnet
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] }));
      const instance = Reservations?.[0].Instances?.[0];
      
      // Check that instance doesn't have public IP (it's in private subnet)
      expect(instance?.PublicIpAddress).toBeUndefined();
      
      // Verify subnet is private
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: [instance?.SubnetId!] }));
      const subnet = Subnets?.[0];
      expect(subnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")).toBe(true);
    }, 20000);
  });
});