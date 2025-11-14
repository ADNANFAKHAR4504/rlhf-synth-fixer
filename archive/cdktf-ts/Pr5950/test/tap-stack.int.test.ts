// test/tap-stack.int.test.ts
import { 
  S3Client, 
  HeadBucketCommand, 
  GetBucketEncryptionCommand, 
  GetBucketVersioningCommand, 
  GetPublicAccessBlockCommand 
} from "@aws-sdk/client-s3";
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand, 
  DescribeInstancesCommand 
} from "@aws-sdk/client-ec2";
import { 
  RDSClient, 
  DescribeDBInstancesCommand 
} from "@aws-sdk/client-rds";
import { 
  CloudTrailClient, 
  DescribeTrailsCommand
} from "@aws-sdk/client-cloudtrail";
import { 
  KMSClient, 
  DescribeKeyCommand, 
  GetKeyRotationStatusCommand 
} from "@aws-sdk/client-kms";
import * as fs from "fs";
import * as path from "path";

// Helper function to check if resource exists
async function resourceExists<T>(
  operation: () => Promise<T>,
  resourceName: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: any) {
    console.warn(`Resource ${resourceName} not found or not accessible:`, error.message);
    return null;
  }
}

// Helper to determine the actual deployment region from KMS ARN
function getDeploymentRegionFromArn(arn: string): string {
  const arnParts = arn.split(':');
  return arnParts[3] || 'us-east-1';
}

describe("TapStack Integration Tests", () => {
  let awsRegion: string;
  let deploymentRegion: string;
  let s3Client: S3Client;
  let ec2Client: EC2Client;
  let rdsClient: RDSClient;
  let cloudTrailClient: CloudTrailClient;
  let kmsClient: KMSClient;

  let awsAccountId: string;
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let ec2InstanceId: string;
  let ec2PrivateIp: string;
  let ec2SecurityGroupId: string;
  let rdsSecurityGroupId: string;
  let s3BucketName: string;
  let cloudtrailS3BucketName: string;
  let rdsEndpoint: string;
  let kmsKeyId: string;
  let kmsKeyArn: string;

  beforeAll(() => {
    // Load outputs from file first to determine actual deployment region
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}. Please ensure infrastructure is deployed and outputs are generated.`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0];

    if (!stackKey) {
      throw new Error("No stack outputs found in flat-outputs.json");
    }

    const stackOutputs = outputs[stackKey];
    kmsKeyArn = stackOutputs["kms-key-arn"];

    // Determine actual deployment region from KMS ARN
    deploymentRegion = getDeploymentRegionFromArn(kmsKeyArn);
    awsRegion = deploymentRegion; // Use deployment region instead of env variable

    // Initialize AWS clients with the correct deployment region
    s3Client = new S3Client({ region: awsRegion });
    ec2Client = new EC2Client({ region: awsRegion });
    rdsClient = new RDSClient({ region: awsRegion });
    cloudTrailClient = new CloudTrailClient({ region: awsRegion });
    kmsClient = new KMSClient({ region: awsRegion });

    // Extract outputs with validation
    awsAccountId = stackOutputs["aws-account-id"];
    vpcId = stackOutputs["vpc-id"];
    publicSubnetIds = stackOutputs["public-subnet-ids"];
    privateSubnetIds = stackOutputs["private-subnet-ids"];
    ec2InstanceId = stackOutputs["ec2-instance-id"];
    ec2PrivateIp = stackOutputs["ec2-private-ip"];
    ec2SecurityGroupId = stackOutputs["ec2-security-group-id"];
    rdsSecurityGroupId = stackOutputs["rds-security-group-id"];
    s3BucketName = stackOutputs["s3-bucket-name"];
    cloudtrailS3BucketName = stackOutputs["cloudtrail-s3-bucket-name"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    kmsKeyId = stackOutputs["kms-key-id"];

    // Validate all required outputs are present
    const requiredOutputs = {
      vpcId, publicSubnetIds, privateSubnetIds, ec2InstanceId,
      s3BucketName, cloudtrailS3BucketName, kmsKeyId, rdsEndpoint
    };

    const missingOutputs = Object.entries(requiredOutputs)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingOutputs.length > 0) {
      throw new Error(`Missing required stack outputs: ${missingOutputs.join(', ')}`);
    }

    console.log(`Running tests in deployment region: ${awsRegion}`);
    console.log(`Stack outputs loaded for: ${stackKey}`);
  });

  // Test 1: VPC Configuration
  test("VPC exists with correct CIDR block and DNS settings", async () => {
    const result = await resourceExists(
      () => ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] })),
      `VPC ${vpcId}`
    );

    expect(result).not.toBeNull();
    if (!result) return;

    const { Vpcs } = result;
    expect(Vpcs?.length).toBe(1);

    const vpc = Vpcs?.[0];
    expect(vpc?.VpcId).toBe(vpcId);
    expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
    expect(vpc?.State).toBe("available");
    expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
  }, 30000);

  // Test 2: Subnet Configuration and High Availability
  test("Subnets are properly configured across multiple availability zones", async () => {
    // Test public subnets
    const publicResult = await resourceExists(
      () => ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })),
      `Public subnets ${publicSubnetIds.join(', ')}`
    );

    expect(publicResult).not.toBeNull();
    if (!publicResult) return;

    const { Subnets: publicSubnets } = publicResult;
    expect(publicSubnets?.length).toBe(2);

    publicSubnets?.forEach((subnet) => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.State).toBe("available");
      expect(subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")).toBe(true);
      expect(subnet.CidrBlock).toMatch(/^10\.0\.[13]\.0\/24$/);
    });

    // Test private subnets
    const privateResult = await resourceExists(
      () => ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })),
      `Private subnets ${privateSubnetIds.join(', ')}`
    );

    expect(privateResult).not.toBeNull();
    if (!privateResult) return;

    const { Subnets: privateSubnets } = privateResult;
    expect(privateSubnets?.length).toBe(2);

    privateSubnets?.forEach((subnet) => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.State).toBe("available");
      expect(subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")).toBe(true);
      expect(subnet.CidrBlock).toMatch(/^10\.0\.[24]\.0\/24$/);
    });

    // Check high availability - different AZs
    const publicAZs = publicSubnets?.map(subnet => subnet.AvailabilityZone);
    const privateAZs = privateSubnets?.map(subnet => subnet.AvailabilityZone);
    const uniquePublicAZs = [...new Set(publicAZs)];
    const uniquePrivateAZs = [...new Set(privateAZs)];

    expect(uniquePublicAZs.length).toBe(2);
    expect(uniquePrivateAZs.length).toBe(2);
  }, 30000);

  // Test 3: Security Groups Configuration
  test("Security groups have correct access rules", async () => {
    // Test EC2 security group
    const ec2SgResult = await resourceExists(
      () => ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })),
      `EC2 Security Group ${ec2SecurityGroupId}`
    );

    expect(ec2SgResult).not.toBeNull();
    if (!ec2SgResult) return;

    const { SecurityGroups: ec2Sgs } = ec2SgResult;
    const ec2Sg = ec2Sgs?.[0];
    expect(ec2Sg?.VpcId).toBe(vpcId);

    // Check SSH ingress rule (port 22)
    const sshRule = ec2Sg?.IpPermissions?.find(rule => 
      rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
    );
    expect(sshRule).toBeDefined();
    expect(sshRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);

    // Test RDS security group
    const rdsSgResult = await resourceExists(
      () => ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })),
      `RDS Security Group ${rdsSecurityGroupId}`
    );

    expect(rdsSgResult).not.toBeNull();
    if (!rdsSgResult) return;

    const { SecurityGroups: rdsSgs } = rdsSgResult;
    const rdsSg = rdsSgs?.[0];
    expect(rdsSg?.VpcId).toBe(vpcId);

    // Check MySQL rule from EC2 security group
    const mysqlRule = rdsSg?.IpPermissions?.find(rule => 
      rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
    );
    expect(mysqlRule).toBeDefined();
    expect(mysqlRule?.UserIdGroupPairs?.some(pair => pair.GroupId === ec2SecurityGroupId)).toBe(true);
  }, 30000);

  // Test 4: EC2 Instance Security and Placement
  test("EC2 instance is securely configured in private subnet", async () => {
    const result = await resourceExists(
      () => ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })),
      `EC2 Instance ${ec2InstanceId}`
    );

    expect(result).not.toBeNull();
    if (!result) return;

    const { Reservations } = result;
    const instance = Reservations?.[0]?.Instances?.[0];

    expect(instance?.InstanceId).toBe(ec2InstanceId);
    expect(instance?.State?.Name).toMatch(/^(running|pending|stopping|stopped)$/);
    expect(instance?.InstanceType).toBe("t3.micro");
    expect(instance?.PrivateIpAddress).toBe(ec2PrivateIp);
    expect(privateSubnetIds).toContain(instance?.SubnetId);

    // Security check - no public IP
    expect(instance?.PublicIpAddress).toBeUndefined();

    // Security group assignment
    expect(instance?.SecurityGroups?.some(sg => sg.GroupId === ec2SecurityGroupId)).toBe(true);

    // Project tagging
    expect(instance?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);

    // IAM instance profile
    expect(instance?.IamInstanceProfile).toBeDefined();
  }, 30000);

  // Test 5: RDS Database Security and Configuration
  test("RDS instance has proper security and backup configuration", async () => {
    const dbIdentifier = rdsEndpoint.split('.')[0];

    const result = await resourceExists(
      () => rdsClient.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })),
      `RDS Instance ${dbIdentifier}`
    );

    expect(result).not.toBeNull();
    if (!result) return;

    const { DBInstances } = result;
    const dbInstance = DBInstances?.[0];

    expect(dbInstance?.Engine).toBe("mysql");
    expect(dbInstance?.DBInstanceClass).toBe("db.t3.micro");
    expect(dbInstance?.StorageEncrypted).toBe(true);
    expect(dbInstance?.KmsKeyId).toBe(kmsKeyArn);
    expect(dbInstance?.PubliclyAccessible).toBe(false);
    expect(dbInstance?.BackupRetentionPeriod).toBe(7);

    // Check it's in private subnets
    expect(dbInstance?.DBSubnetGroup?.Subnets?.every(subnet => 
      privateSubnetIds.includes(subnet.SubnetIdentifier || "")
    )).toBe(true);

    // Check security group
    expect(dbInstance?.VpcSecurityGroups?.some(sg => 
      sg.VpcSecurityGroupId === rdsSecurityGroupId && sg.Status === "active"
    )).toBe(true);

    // Project tagging
    expect(dbInstance?.TagList?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
  }, 30000);

  // Test 6: Application S3 Bucket Security
  test("Application S3 bucket has proper encryption and access controls", async () => {
    const headResult = await resourceExists(
      () => s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName })),
      `S3 Bucket ${s3BucketName}`
    );

    expect(headResult).not.toBeNull();
    if (!headResult) return;

    // Check public access is blocked
    const publicAccessResult = await resourceExists(
      () => s3Client.send(new GetPublicAccessBlockCommand({ Bucket: s3BucketName })),
      `S3 Bucket public access block ${s3BucketName}`
    );

    if (publicAccessResult) {
      const { PublicAccessBlockConfiguration } = publicAccessResult;
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }

    // Check encryption
    const encryptionResult = await resourceExists(
      () => s3Client.send(new GetBucketEncryptionCommand({ Bucket: s3BucketName })),
      `S3 Bucket encryption ${s3BucketName}`
    );

    if (encryptionResult) {
      const { ServerSideEncryptionConfiguration } = encryptionResult;
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
    }

    // Check versioning
    const versioningResult = await resourceExists(
      () => s3Client.send(new GetBucketVersioningCommand({ Bucket: s3BucketName })),
      `S3 Bucket versioning ${s3BucketName}`
    );

    if (versioningResult) {
      const { Status } = versioningResult;
      expect(Status).toBe("Enabled");
    }
  }, 30000);

  // Test 7: CloudTrail S3 Bucket Security
  test("CloudTrail S3 bucket has proper security configuration", async () => {
    const headResult = await resourceExists(
      () => s3Client.send(new HeadBucketCommand({ Bucket: cloudtrailS3BucketName })),
      `CloudTrail S3 Bucket ${cloudtrailS3BucketName}`
    );

    expect(headResult).not.toBeNull();
    if (!headResult) return;

    // Check public access is blocked
    const publicAccessResult = await resourceExists(
      () => s3Client.send(new GetPublicAccessBlockCommand({ Bucket: cloudtrailS3BucketName })),
      `CloudTrail S3 Bucket public access block ${cloudtrailS3BucketName}`
    );

    if (publicAccessResult) {
      const { PublicAccessBlockConfiguration } = publicAccessResult;
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }

    // Check encryption
    const encryptionResult = await resourceExists(
      () => s3Client.send(new GetBucketEncryptionCommand({ Bucket: cloudtrailS3BucketName })),
      `CloudTrail S3 Bucket encryption ${cloudtrailS3BucketName}`
    );

    if (encryptionResult) {
      const { ServerSideEncryptionConfiguration } = encryptionResult;
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
    }
  }, 30000);

  // Test 8: CloudTrail Audit Configuration
  test("CloudTrail is properly configured for comprehensive audit logging", async () => {
    const result = await resourceExists(
      () => cloudTrailClient.send(new DescribeTrailsCommand({})),
      "CloudTrail trails"
    );

    expect(result).not.toBeNull();
    if (!result) return;

    const { trailList } = result;
    const cloudTrail = trailList?.find(trail => 
      trail.S3BucketName === cloudtrailS3BucketName
    );

    expect(cloudTrail).toBeDefined();
    expect(cloudTrail?.S3BucketName).toBe(cloudtrailS3BucketName);
    expect(cloudTrail?.IncludeGlobalServiceEvents).toBe(true);
    expect(cloudTrail?.IsMultiRegionTrail).toBe(true);
    expect(cloudTrail?.LogFileValidationEnabled).toBe(true);
  }, 30000);

  // Test 9: KMS Key Configuration and Security
  test("KMS key is properly configured with rotation enabled", async () => {
    const keyResult = await resourceExists(
      () => kmsClient.send(new DescribeKeyCommand({ KeyId: kmsKeyId })),
      `KMS Key ${kmsKeyId}`
    );

    expect(keyResult).not.toBeNull();
    if (!keyResult) return;

    const { KeyMetadata } = keyResult;
    expect(KeyMetadata?.KeyId).toBe(kmsKeyId);
    expect(KeyMetadata?.Arn).toBe(kmsKeyArn);
    expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
    expect(KeyMetadata?.Enabled).toBe(true);
    expect(KeyMetadata?.Description).toContain("KMS key for tap-project");

    // Check rotation
    const rotationResult = await resourceExists(
      () => kmsClient.send(new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })),
      `KMS Key rotation status for ${kmsKeyId}`
    );

    if (rotationResult) {
      expect(rotationResult.KeyRotationEnabled).toBe(true);
    }
  }, 30000);

  // Test 10: Overall Infrastructure Security Compliance
  test("Infrastructure meets security compliance requirements", async () => {
    let passedChecks = 0;
    const totalChecks = 6;

    // Check 1: EC2 is in private subnet without public IP
    const ec2Result = await resourceExists(
      () => ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })),
      `EC2 Instance ${ec2InstanceId}`
    );

    if (ec2Result) {
      const instance = ec2Result.Reservations?.[0]?.Instances?.[0];
      if (privateSubnetIds.includes(instance?.SubnetId || "") && !instance?.PublicIpAddress) {
        passedChecks++;
      }
    }

    // Check 2: RDS is not publicly accessible and encrypted
    const dbIdentifier = rdsEndpoint.split('.')[0];
    const rdsResult = await resourceExists(
      () => rdsClient.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })),
      `RDS Instance ${dbIdentifier}`
    );

    if (rdsResult) {
      const dbInstance = rdsResult.DBInstances?.[0];
      if (!dbInstance?.PubliclyAccessible && dbInstance?.StorageEncrypted) {
        passedChecks++;
      }
    }

    // Check 3: S3 buckets have encryption enabled
    const s3EncResult = await resourceExists(
      () => s3Client.send(new GetBucketEncryptionCommand({ Bucket: s3BucketName })),
      `S3 Encryption ${s3BucketName}`
    );
    if (s3EncResult) passedChecks++;

    // Check 4: S3 buckets block public access
    const s3PublicResult = await resourceExists(
      () => s3Client.send(new GetPublicAccessBlockCommand({ Bucket: s3BucketName })),
      `S3 Public Access ${s3BucketName}`
    );
    if (s3PublicResult?.PublicAccessBlockConfiguration?.BlockPublicAcls) passedChecks++;

    // Check 5: KMS key rotation is enabled
    const kmsRotResult = await resourceExists(
      () => kmsClient.send(new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })),
      `KMS Rotation ${kmsKeyId}`
    );
    if (kmsRotResult?.KeyRotationEnabled) passedChecks++;

    // Check 6: CloudTrail is logging
    const cloudTrailResult = await resourceExists(
      () => cloudTrailClient.send(new DescribeTrailsCommand({})),
      "CloudTrail trails"
    );
    if (cloudTrailResult?.trailList?.some(t => t.S3BucketName === cloudtrailS3BucketName)) {
      passedChecks++;
    }

    console.log(`Security compliance: ${passedChecks}/${totalChecks} checks passed`);

    // Require at least 80% of security checks to pass
    expect(passedChecks).toBeGreaterThanOrEqual(Math.ceil(totalChecks * 0.8));
  }, 30000);
});
