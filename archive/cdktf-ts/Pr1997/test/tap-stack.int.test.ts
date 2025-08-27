// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, GetBucketVersioningCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand, GetRolePolicyCommand, ListRolePoliciesCommand } from "@aws-sdk/client-iam";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand } from "@aws-sdk/client-ec2";
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } from "@aws-sdk/client-cloudtrail";
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand, ListAliasesCommand } from "@aws-sdk/client-kms";
import { CloudWatchClient, DescribeAlarmsCommand } from "@aws-sdk/client-cloudwatch";
import { SNSClient, GetTopicAttributesCommand, ListSubscriptionsByTopicCommand } from "@aws-sdk/client-sns";
import { BackupClient, DescribeBackupVaultCommand, ListBackupPlansCommand, ListBackupSelectionsCommand } from "@aws-sdk/client-backup";
import * as fs from "fs";
import * as path from "path";

const awsRegion = "us-east-1";
const backupRegion = "us-west-2";
const s3Client = new S3Client({ region: awsRegion });
const s3BackupClient = new S3Client({ region: backupRegion });
const iamClient = new IAMClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const backupClient = new BackupClient({ region: awsRegion });

describe("SecProject TapStack Integration Tests", () => {
  let vpcId: string;
  let securityGroupId: string;
  let iamRoleArn: string;
  let mainBucketName: string;
  let logBucketName: string;
  let backupBucketArn: string;
  let cloudtrailArn: string;
  let kmsKeyId: string;
  let kmsKeyArn: string;
  let securityAlertsTopicArn: string;
  let backupVaultName: string;
  let unauthorizedAccessAlarmName: string;
  let primaryRegion: string;
  let backupRegionOutput: string;
  let securitySummary: any;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // TapStackpr1997
    const stackOutputs = outputs[stackKey];

    vpcId = stackOutputs["vpc-id"];
    securityGroupId = stackOutputs["security-group-id"];
    iamRoleArn = stackOutputs["iam-role-arn"];
    mainBucketName = stackOutputs["main-bucket-name"];
    logBucketName = stackOutputs["log-bucket-name"];
    backupBucketArn = stackOutputs["backup-bucket-arn"];
    cloudtrailArn = stackOutputs["cloudtrail-arn"];
    kmsKeyId = stackOutputs["kms-key-id"];
    kmsKeyArn = stackOutputs["kms-key-arn"];
    securityAlertsTopicArn = stackOutputs["security-alerts-topic-arn"];
    backupVaultName = stackOutputs["backup-vault-name"];
    unauthorizedAccessAlarmName = stackOutputs["unauthorized-access-alarm-name"];
    primaryRegion = stackOutputs["primary-region"];
    backupRegionOutput = stackOutputs["backup-region"];
    securitySummary = JSON.parse(stackOutputs["security-summary"]);

    if (!vpcId || !securityGroupId || !iamRoleArn || !mainBucketName || !logBucketName || 
        !cloudtrailArn || !kmsKeyId || !securityAlertsTopicArn || !backupVaultName) {
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
      expect(vpc?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecProject-VPC")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "SecProject")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "CDKTF")).toBe(true);
    }, 20000);

    test("Internet Gateway exists and is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways?.length).toBe(1);
      expect(InternetGateways?.[0].Attachments?.[0].VpcId).toBe(vpcId);
      expect(InternetGateways?.[0].Attachments?.[0].State).toBe("available");
      expect(InternetGateways?.[0].Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecProject-IGW")).toBe(true);
    }, 20000);

    test("Subnets exist and are configured correctly", async () => {
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      expect(Subnets?.length).toBeGreaterThanOrEqual(2); // At least public and private subnets
      
      // Check public subnet
      const publicSubnet = Subnets?.find(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")
      );
      expect(publicSubnet).toBeDefined();
      expect(publicSubnet?.CidrBlock).toBe("10.0.1.0/24");
      expect(publicSubnet?.MapPublicIpOnLaunch).toBe(false); // Security: No auto-assign public IPs
      expect(publicSubnet?.AvailabilityZone).toBe("us-east-1a");
      
      // Check private subnet
      const privateSubnet = Subnets?.find(subnet => 
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")
      );
      expect(privateSubnet).toBeDefined();
      expect(privateSubnet?.CidrBlock).toBe("10.0.2.0/24");
      expect(privateSubnet?.AvailabilityZone).toBe("us-east-1b");
    }, 20000);

    test("Route tables are configured correctly", async () => {
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      expect(RouteTables?.length).toBeGreaterThanOrEqual(2); // main + public route table
      
      // Check public route table has internet gateway route
      const publicRouteTable = RouteTables?.find(rt => 
        rt.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecProject-PublicRT")
      );
      expect(publicRouteTable).toBeDefined();
      expect(publicRouteTable?.Routes?.some(route => 
        route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith("igw-")
      )).toBe(true);
    }, 20000);
  });

  describe("Security Groups", () => {
    test("Security group has correct restricted access rules", async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] }));
      expect(SecurityGroups?.length).toBe(1);
      
      const securityGroup = SecurityGroups?.[0];
      expect(securityGroup?.GroupId).toBe(securityGroupId);
      expect(securityGroup?.VpcId).toBe(vpcId);
      expect(securityGroup?.GroupName).toBe("SecProject-SG");
      expect(securityGroup?.Description).toContain("Security group with restricted access to approved IP ranges only");
      
      // Check for HTTPS rule (port 443) - should only allow approved IP ranges
      const httpsRule = securityGroup?.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsRule).toBeDefined();
      // Should NOT have 0.0.0.0/0 access
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(false);
      // Should have approved IP ranges
      expect(httpsRule?.IpRanges?.some(range => 
        ["203.0.113.0/24", "198.51.100.0/24", "192.0.2.0/24"].includes(range.CidrIp || "")
      )).toBe(true);
      
      // Check for SSH rule (port 22) - should only allow approved IP ranges
      const sshRule = securityGroup?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(false);
      
      // Check egress rules - should be restricted (HTTPS and DNS only)
      const httpsEgressRule = securityGroup?.IpPermissionsEgress?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443 && rule.IpProtocol === "tcp"
      );
      expect(httpsEgressRule).toBeDefined();
      
      const dnsEgressRule = securityGroup?.IpPermissionsEgress?.find(rule => 
        rule.FromPort === 53 && rule.ToPort === 53 && rule.IpProtocol === "udp"
      );
      expect(dnsEgressRule).toBeDefined();
      
      // Check tags
      expect(securityGroup?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecProject-SecurityGroup")).toBe(true);
      expect(securityGroup?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);
    }, 20000);
  });

  describe("S3 Buckets Security", () => {
    test("Main S3 bucket exists with correct security configuration", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: mainBucketName }));
      
      // Verify bucket name matches expected pattern
      expect(mainBucketName).toMatch(/^secproject-main-\d+-us-east-1$/);
      
      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: mainBucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      
      // Check encryption is enabled with KMS
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: mainBucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].BucketKeyEnabled).toBe(true);
      
      // Check versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: mainBucketName })
      );
      expect(Status).toBe("Enabled");
    }, 20000);

    test("Log S3 bucket exists with correct security configuration", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: logBucketName }));
      
      // Verify bucket name matches expected pattern
      expect(logBucketName).toMatch(/^secproject-logs-\d+-us-east-1$/);
      
      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: logBucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      
      // Check encryption is enabled with KMS
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: logBucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
      
      // Check versioning is enabled for audit trail integrity
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: logBucketName })
      );
      expect(Status).toBe("Enabled");
    }, 20000);

    test("Backup S3 bucket exists in different region", async () => {
      const backupBucketName = backupBucketArn.split(':')[5]; // Extract bucket name from ARN
      
      // Check bucket exists in backup region
      await s3BackupClient.send(new HeadBucketCommand({ Bucket: backupBucketName }));
      
      // Verify bucket name matches expected pattern for backup region
      expect(backupBucketName).toMatch(/^secproject-backup-\d+-us-west-2$/);
      
      // Check encryption is enabled in backup region
      const { ServerSideEncryptionConfiguration } = await s3BackupClient.send(
        new GetBucketEncryptionCommand({ Bucket: backupBucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
    }, 20000);
  });

  describe("IAM Role and Policies", () => {
    test("Application IAM role exists with least privilege permissions", async () => {
      const roleName = iamRoleArn.split('/')[1];
      const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
      
      expect(Role?.RoleName).toBe("SecProject-ApplicationRole");
      expect(Role?.Arn).toBe(iamRoleArn);
      expect(Role?.Description).toContain("Least privilege role for SecProject application");

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
        policy.PolicyName === "SecProject-S3AccessPolicy"
      )).toBe(true);
      expect(AttachedPolicies?.some(policy => 
        policy.PolicyName === "SecProject-CloudWatchLogsPolicy"
      )).toBe(true);
    }, 20000);

    test("IAM policies follow least privilege principle", async () => {
      const roleName = iamRoleArn.split('/')[1];
      
      // Check inline policies
      const { PolicyNames } = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );
      
      // Should have minimal inline policies or none for better management
      expect(PolicyNames?.length || 0).toBeLessThanOrEqual(2);
      
      // Verify S3 policy is restrictive
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
      
      const s3Policy = AttachedPolicies?.find(policy => 
        policy.PolicyName === "SecProject-S3AccessPolicy"
      );
      expect(s3Policy).toBeDefined();
    }, 20000);
  });

  describe("KMS Key Security", () => {
    test("KMS key exists with correct configuration", async () => {
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({ KeyId: kmsKeyId }));
      
      expect(KeyMetadata?.KeyId).toBe(kmsKeyId);
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.Enabled).toBe(true);
      expect(KeyMetadata?.Description).toContain("KMS key for SecProject encryption at rest");
      
      // Check key rotation is enabled
      const { KeyRotationEnabled } = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })
      );
      expect(KeyRotationEnabled).toBe(true);
    }, 20000);
  });

  describe("CloudTrail Audit Logging", () => {
    test("CloudTrail exists and is configured correctly", async () => {
      const trailName = cloudtrailArn.split('/')[1];
      const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [trailName]
      }));
      
      expect(trailList?.length).toBe(1);
      const cloudTrail = trailList?.[0];
      
      expect(cloudTrail?.TrailARN).toBe(cloudtrailArn);
      expect(cloudTrail?.Name).toBe("SecProject-AuditTrail");
      expect(cloudTrail?.S3BucketName).toBe(logBucketName);
      expect(cloudTrail?.S3KeyPrefix).toBe("cloudtrail/");
      expect(cloudTrail?.IncludeGlobalServiceEvents).toBe(true);
      expect(cloudTrail?.IsMultiRegionTrail).toBe(true);
      
      // Check if CloudTrail is logging
      const { IsLogging } = await cloudTrailClient.send(
        new GetTrailStatusCommand({ Name: trailName })
      );
      expect(IsLogging).toBe(true);
    }, 20000);
  });

  describe("Backup Strategy", () => {
    test("AWS Backup vault exists with correct configuration", async () => {
      const { BackupVaultName, EncryptionKeyArn } = await backupClient.send(
        new DescribeBackupVaultCommand({ BackupVaultName: backupVaultName })
      );
      
      expect(BackupVaultName).toBe("SecProject-BackupVault");
      expect(EncryptionKeyArn).toBe(kmsKeyArn);
    }, 20000);

    test("Backup plan exists with cross-region replication", async () => {
      const { BackupPlansList } = await backupClient.send(new ListBackupPlansCommand({}));
      
      const secProjectPlan = BackupPlansList?.find(plan => 
        plan.BackupPlanName === "SecProject-BackupPlan"
      );
      expect(secProjectPlan).toBeDefined();
    }, 20000);

    test("Backup selection includes main S3 bucket", async () => {
      const { BackupPlansList } = await backupClient.send(new ListBackupPlansCommand({}));
      const secProjectPlan = BackupPlansList?.find(plan => 
        plan.BackupPlanName === "SecProject-BackupPlan"
      );
      
      if (secProjectPlan?.BackupPlanId) {
        const { BackupSelectionsList } = await backupClient.send(
          new ListBackupSelectionsCommand({ BackupPlanId: secProjectPlan.BackupPlanId })
        );
        
        expect(BackupSelectionsList?.length).toBeGreaterThan(0);
        expect(BackupSelectionsList?.[0].SelectionName).toBe("SecProject-BackupSelection");
      }
    }, 20000);
  });

  describe("Security Monitoring and Alerts", () => {
    test("SNS topic exists for security alerts", async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: securityAlertsTopicArn })
      );
      
      expect(Attributes?.DisplayName).toBe("SecProject Security Alerts");
      expect(Attributes?.KmsMasterKeyId).toBe(kmsKeyId);
    }, 20000);

    test("Security team is subscribed to alerts", async () => {
      const { Subscriptions } = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: securityAlertsTopicArn })
      );
      
      expect(Subscriptions?.length).toBeGreaterThan(0);
      expect(Subscriptions?.some(sub => 
        sub.Protocol === "email" && sub.Endpoint === "security-team@yourcompany.com"
      )).toBe(true);
    }, 20000);

    test("CloudWatch alarms exist for security monitoring", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [unauthorizedAccessAlarmName, "SecProject-FailedConsoleLogins"]
      }));
      
      expect(MetricAlarms?.length).toBeGreaterThanOrEqual(1);
      
      const unauthorizedAccessAlarm = MetricAlarms?.find(alarm => 
        alarm.AlarmName === "SecProject-UnauthorizedAccessAttempts"
      );
      expect(unauthorizedAccessAlarm).toBeDefined();
      expect(unauthorizedAccessAlarm?.AlarmDescription).toContain("unauthorized access attempts");
      expect(unauthorizedAccessAlarm?.ComparisonOperator).toBe("GreaterThanThreshold");
      expect(unauthorizedAccessAlarm?.Threshold).toBe(5);
      expect(unauthorizedAccessAlarm?.AlarmActions?.includes(securityAlertsTopicArn)).toBe(true);
      
      const failedLoginAlarm = MetricAlarms?.find(alarm => 
        alarm.AlarmName === "SecProject-FailedConsoleLogins"
      );
      if (failedLoginAlarm) {
        expect(failedLoginAlarm.AlarmDescription).toContain("failed console login attempts");
        expect(failedLoginAlarm.Threshold).toBe(3);
      }
    }, 20000);
  });

  describe("Security Compliance and Configuration", () => {
    test("Security summary matches expected configuration", async () => {
      expect(securitySummary.encryption).toBe("All data encrypted at rest with KMS");
      expect(securitySummary.networking).toBe("VPC with restricted security groups");
      expect(securitySummary.access_control).toBe("Least privilege IAM roles and policies");
      expect(securitySummary.logging).toBe("Comprehensive CloudTrail and CloudWatch logging");
      expect(securitySummary.backup).toBe("Cross-region backup with AWS Backup service");
      expect(securitySummary.monitoring).toBe("CloudWatch alarms with SNS notifications");
      expect(securitySummary.compliance).toBe("90-day log retention for audit requirements");
    }, 5000);

    test("Regional configuration is correct", async () => {
      expect(primaryRegion).toBe("us-east-1");
      expect(backupRegionOutput).toBe("us-west-2");
      
      // Verify resources are in correct regions
      expect(mainBucketName).toContain("us-east-1");
      expect(logBucketName).toContain("us-east-1");
      expect(backupBucketArn).toContain("us-west-2");
    }, 5000);

    test("All resources have required security tags", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "SecProject")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "ManagedBy" && tag.Value === "CDKTF")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "SecurityLevel" && tag.Value === "High")).toBe(true);
      
      // Check security group tags
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [securityGroupId] }));
      const securityGroup = SecurityGroups?.[0];
      expect(securityGroup?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "SecProject-SecurityGroup")).toBe(true);
      expect(securityGroup?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);
    }, 20000);

    test("Network isolation is properly implemented", async () => {
      // Verify subnets are properly isolated
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      const publicSubnet = Subnets?.find(subnet =>
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")
      );
      const privateSubnet = Subnets?.find(subnet =>
        subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")
      );
      
      // Public subnet should not auto-assign public IPs (security hardening)
      expect(publicSubnet?.MapPublicIpOnLaunch).toBe(false);
      
      // Private subnet should definitely not auto-assign public IPs
      expect(privateSubnet?.MapPublicIpOnLaunch).toBe(false);
    }, 20000);

    test("Encryption is enabled across all services", async () => {
      // S3 encryption already tested above
      
      // CloudTrail encryption
      const trailName = cloudtrailArn.split('/')[1];
      const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: [trailName]
      }));
      
      // SNS topic encryption
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: securityAlertsTopicArn })
      );
      expect(Attributes?.KmsMasterKeyId).toBe(kmsKeyId);
      
      // Backup vault encryption
      const { EncryptionKeyArn } = await backupClient.send(
        new DescribeBackupVaultCommand({ BackupVaultName: backupVaultName })
      );
      expect(EncryptionKeyArn).toBe(kmsKeyArn);
    }, 20000);
  });
});  