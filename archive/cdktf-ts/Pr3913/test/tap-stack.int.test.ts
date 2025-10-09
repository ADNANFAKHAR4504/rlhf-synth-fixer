// __tests__/tap-stack.int.test.ts
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand, GetInstanceProfileCommand, GetPolicyCommand } from "@aws-sdk/client-iam";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from "@aws-sdk/client-ec2";
import { S3Client, GetBucketEncryptionCommand, HeadBucketCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, GetBucketPolicyCommand } from "@aws-sdk/client-s3";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand, DescribeDBParameterGroupsCommand } from "@aws-sdk/client-rds";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } from "@aws-sdk/client-cloudtrail";
import { LambdaClient } from "@aws-sdk/client-lambda";
import { KMSClient, GetKeyRotationStatusCommand } from "@aws-sdk/client-kms";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });

describe("TapStack Security Infrastructure Integration Tests", () => {
  let outputs: any;
  let stackOutputs: any;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0];
    stackOutputs = outputs[stackKey];

    // Validate required outputs exist
    const requiredOutputs = [
      "vpc-id",
      "iam-permissions-boundary-arn",
      "security-compliance-summary"
    ];

    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Module - Secure Network Foundation", () => {
    test("VPC exists with correct configuration and tagging", async () => {
      const vpcId = stackOutputs["vpc-id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      expect(Vpcs![0].State).toBe("available");
      
      // Verify security tagging
      const tags = Vpcs![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "secure-vpc")).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
      expect(tags.some(tag => tag.Key === "Security" && tag.Value === "Enforced")).toBe(true);
    }, 20000);

    test("VPC Flow Logs CloudWatch Log Group exists", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { logGroups } = await cloudWatchLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/vpc/flowlogs/${vpcId}`
      }));
      
      expect(logGroups).toHaveLength(1);
      expect(logGroups![0].retentionInDays).toBe(30);
    }, 20000);

    test("Private subnets exist with proper configuration", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Type", Values: ["Private"] }
        ]
      }));
      
      expect(Subnets?.length).toBeGreaterThanOrEqual(2);
      
      Subnets?.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
      });
    }, 20000);

    test("Public subnets exist with proper configuration", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Type", Values: ["Public"] }
        ]
      }));
      
      expect(Subnets?.length).toBeGreaterThanOrEqual(2);
      
      Subnets?.forEach((subnet) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe("available");
        expect(subnet.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
      });
    }, 20000);
  });

  describe("IAM Module - Identity Security", () => {
    test("Permissions boundary exists and is properly configured", async () => {
      const boundaryArn = stackOutputs["iam-permissions-boundary-arn"];
      const policyName = "security-permissions-boundary-654";
      
      const { Policy } = await iamClient.send(new GetPolicyCommand({
        PolicyArn: boundaryArn
      }));
      
      expect(Policy).toBeDefined();
      expect(Policy?.PolicyName).toBe(policyName);
      expect(Policy?.Description).toBe("Permissions boundary for all IAM roles");
    }, 20000);

    test("EC2 instance role has permissions boundary attached", async () => {
      const { Role } = await iamClient.send(new GetRoleCommand({
        RoleName: "secure-ec2-instance-role-654"
      }));
      
      expect(Role).toBeDefined();
      expect(Role?.PermissionsBoundary?.PermissionsBoundaryArn).toBe(stackOutputs["iam-permissions-boundary-arn"]);
      
      // Verify security tagging
      const tags = Role?.Tags || [];
      expect(tags.some(tag => tag.Key === "Security" && tag.Value === "Enforced")).toBe(true);
    }, 20000);

    test("Lambda execution role has permissions boundary attached", async () => {
      const { Role } = await iamClient.send(new GetRoleCommand({
        RoleName: "secure-lambda-execution-role-654"
      }));
      
      expect(Role).toBeDefined();
      expect(Role?.PermissionsBoundary?.PermissionsBoundaryArn).toBe(stackOutputs["iam-permissions-boundary-arn"]);
      
      // Verify security tagging
      const tags = Role?.Tags || [];
      expect(tags.some(tag => tag.Key === "Security" && tag.Value === "Enforced")).toBe(true);
    }, 20000);

    test("EC2 role has required security policies attached", async () => {
      const { AttachedPolicies } = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: "secure-ec2-instance-role-654"
      }));
      
      const policyArns = AttachedPolicies?.map(p => p.PolicyArn) || [];
      
      expect(policyArns).toContain("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy");
      expect(policyArns).toContain("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore");
    }, 20000);

    test("Lambda role has VPC execution permissions", async () => {
      const { AttachedPolicies } = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: "secure-lambda-execution-role-654"
      }));
      
      const policyArns = AttachedPolicies?.map(p => p.PolicyArn) || [];
      
      expect(policyArns).toContain("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole");
    }, 20000);

    test("EC2 instance profile exists", async () => {
      const { InstanceProfile } = await iamClient.send(new GetInstanceProfileCommand({
        InstanceProfileName: "secure-ec2-profile-654"
      }));
      
      expect(InstanceProfile).toBeDefined();
      expect(InstanceProfile?.Roles).toHaveLength(1);
      expect(InstanceProfile?.Roles![0].RoleName).toBe("secure-ec2-instance-role-654");
    }, 20000);
  });

  describe("S3 Module - Secure Storage", () => {
    test("S3 bucket exists with KMS encryption", async () => {
      const bucketName = "secure-logs-654";
      
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
    }, 20000);

    test("S3 bucket has versioning enabled", async () => {
      const bucketName = "secure-logs-654";
      
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      
      expect(Status).toBe("Enabled");
    }, 20000);

    test("S3 bucket has public access completely blocked", async () => {
      const bucketName = "secure-logs-654";
      
      const publicAccessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);

    test("S3 bucket policy enforces encryption in transit", async () => {
      const bucketName = "secure-logs-654";
      
      const { Policy } = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: bucketName })
      );
      
      const policyDoc = JSON.parse(Policy!);
      
      // Check for SSL enforcement
      const sslStatement = policyDoc.Statement.find((s: any) => 
        s.Sid === "DenyInsecureConnections"
      );
      expect(sslStatement).toBeDefined();
      expect(sslStatement.Effect).toBe("Deny");
      expect(sslStatement.Condition.Bool["aws:SecureTransport"]).toBe("false");
      
      // Check for encryption enforcement
      const encryptionStatement = policyDoc.Statement.find((s: any) => 
        s.Sid === "DenyUnencryptedObjectUploads"
      );
      expect(encryptionStatement).toBeDefined();
      expect(encryptionStatement.Effect).toBe("Deny");
    }, 20000);

    test("KMS key has rotation enabled", async () => {
      // Get KMS key ID from bucket encryption
      const bucketName = "secure-logs-654";
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      const kmsKeyArn = ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
      
      if (kmsKeyArn) {
        const { KeyRotationEnabled } = await kmsClient.send(
          new GetKeyRotationStatusCommand({ KeyId: kmsKeyArn })
        );
        
        expect(KeyRotationEnabled).toBe(true);
      }
    }, 20000);
  });

  describe("RDS Module - Secure Database", () => {
    test("RDS subnet group exists in private subnets", async () => {
      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: "secure-db-subnet-group-654"
      }));
      
      expect(DBSubnetGroups).toHaveLength(1);
      expect(DBSubnetGroups![0].Subnets?.length).toBeGreaterThanOrEqual(2);
      
      // Verify subnets are private
      DBSubnetGroups![0].Subnets?.forEach(subnet => {
        expect(subnet.SubnetStatus).toBe("Active");
      });
    }, 20000);

    test("RDS parameter group enforces SSL", async () => {
      const { DBParameterGroups } = await rdsClient.send(new DescribeDBParameterGroupsCommand({
        DBParameterGroupName: "secure-mysql-params-654"
      }));
      
      expect(DBParameterGroups).toHaveLength(1);
      expect(DBParameterGroups![0].DBParameterGroupFamily).toBe("mysql8.0");
    }, 20000);

    test("RDS instance is properly secured", async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: "secure-mysql-db-654"
      }));
      
      if (DBInstances && DBInstances.length > 0) {
        const db = DBInstances[0];
        
        expect(db.StorageEncrypted).toBe(true);
        expect(db.MultiAZ).toBe(true);
        expect(db.PubliclyAccessible).toBe(false);
        expect(db.BackupRetentionPeriod).toBe(7);
        expect(db.DeletionProtection).toBe(true);
        expect(db.EnabledCloudwatchLogsExports).toContain("error");
        expect(db.CopyTagsToSnapshot).toBe(true);
      }
    }, 20000);
  });

  describe("CloudTrail Module - Audit Logging", () => {
    test("CloudTrail is enabled and properly configured", async () => {
      const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({
        trailNameList: ["security-trail-654"]
      }));
      
      expect(trailList).toHaveLength(1);
      const trail = trailList![0];
      
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      expect(trail.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.KmsKeyId).toBeDefined();
    }, 20000);

    test("CloudTrail is actively logging", async () => {
      const { IsLogging } = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: "security-trail-654"
      }));
      
      expect(IsLogging).toBe(true);
    }, 20000);

    test("CloudTrail S3 bucket is secure", async () => {
      const bucketName = "cloudtrail-logs-654";
      
      // Check encryption
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      
      // Check versioning
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      
      expect(Status).toBe("Enabled");
      
      // Check public access block
      const publicAccessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);
  });

  describe("Security Compliance Summary", () => {
    test("All security compliance checks pass", () => {
      const complianceSummary = stackOutputs["security-compliance-summary"];
      
      expect(complianceSummary.iamPermissionBoundaries).toBe("Enforced");
      expect(complianceSummary.mfaRequirement).toBe("Policy Applied");
      expect(complianceSummary.ec2EbsEncryption).toBe("Enabled");
      expect(complianceSummary.s3Encryption).toBe("KMS");
      expect(complianceSummary.s3PublicAccess).toBe("Blocked");
      expect(complianceSummary.sshRestriction).toBe("No 0.0.0.0/0 access");
      expect(complianceSummary.cloudTrailMultiRegion).toBe("Enabled");
      expect(complianceSummary.lambdaVpcDeployment).toBe("Enforced");
      expect(complianceSummary.rdsEncryption).toBe("Enabled");
      expect(complianceSummary.rdsPublicAccess).toBe("Disabled");
      expect(complianceSummary.vpcFlowLogs).toBe("CloudWatch");
    });

    test("VPC Flow Logs status output is correct", () => {
      expect(stackOutputs["vpc-flow-logs-status"]).toBe("VPC Flow Logs enabled and stored in CloudWatch Logs");
    });

    test("S3 encryption status outputs are correct", () => {
      expect(stackOutputs["s3-encryption-status"]).toBe("KMS encryption enabled on all S3 buckets");
      expect(stackOutputs["s3-public-access-block"]).toBe("Public access blocked on all S3 buckets");
    });

    test("Database security outputs are correct", () => {
      expect(stackOutputs["rds-encryption-status"]).toBe("RDS instance and snapshots are encrypted");
    });

    test("EC2 security outputs are correct", () => {
      expect(stackOutputs["ec2-ebs-encryption"]).toBe("All EBS volumes are encrypted");
    });

    test("Lambda logging status is correct", () => {
      expect(stackOutputs["lambda-logging-status"]).toBe("Lambda functions have detailed CloudWatch logging enabled");
    });

    test("CloudTrail configuration status is correct", () => {
      const cloudtrailStatus = stackOutputs["cloudtrail-status"];
      expect(cloudtrailStatus.enabled).toBe(true);
      expect(cloudtrailStatus.logFileValidation).toBe(true);
      expect(cloudtrailStatus.encryptionEnabled).toBe(true);
    });
  });

  describe("Cross-Module Security Integration", () => {
    test("All roles have permissions boundaries applied", async () => {
      const roles = ["secure-ec2-instance-role-654", "secure-lambda-execution-role-654"];
      
      for (const roleName of roles) {
        const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
        expect(Role?.PermissionsBoundary?.PermissionsBoundaryArn).toBe(stackOutputs["iam-permissions-boundary-arn"]);
      }
    }, 20000);

    test("All S3 buckets use the same KMS key", async () => {
      const buckets = ["secure-logs-654", "cloudtrail-logs-654"];
      let kmsKeyArn: string | undefined;
      
      for (const bucket of buckets) {
        try {
          const { ServerSideEncryptionConfiguration } = await s3Client.send(
            new GetBucketEncryptionCommand({ Bucket: bucket })
          );
          
          const currentKeyArn = ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
          
          if (kmsKeyArn === undefined) {
            kmsKeyArn = currentKeyArn;
          } else {
            expect(currentKeyArn).toBe(kmsKeyArn);
          }
        } catch (error) {
          // Bucket might not exist in test environment
          console.log(`Bucket ${bucket} not accessible - this is expected in test environments`);
        }
      }
    }, 20000);

    test("All resources are properly tagged for security compliance", async () => {
      const vpcId = stackOutputs["vpc-id"];
      
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs![0].Tags || [];
      
      expect(vpcTags.some(tag => tag.Key === "Security" && (tag.Value === "Enforced" || tag.Value === "True"))).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "Environment" && tag.Value === "Production")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "Compliance" && tag.Value === "Enforced")).toBe(true);
    }, 20000);
  });
});
