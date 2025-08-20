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

describe("TapStack Integration Tests", () => {
  let awsRegion: string;
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
    // Get AWS region from environment or default to us-east-1
    awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
    
    // Initialize AWS clients with the correct region
    s3Client = new S3Client({ region: awsRegion });
    ec2Client = new EC2Client({ region: awsRegion });
    rdsClient = new RDSClient({ region: awsRegion });
    cloudTrailClient = new CloudTrailClient({ region: awsRegion });
    kmsClient = new KMSClient({ region: awsRegion });

    // Load outputs from file
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
    kmsKeyArn = stackOutputs["kms-key-arn"];

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

    console.log(`Running tests in region: ${awsRegion}`);
    console.log(`Stack outputs loaded for: ${stackKey}`);
  });

  // Test 1: VPC Configuration
  test("VPC exists with correct CIDR block and DNS settings", async () => {
    const result = await resourceExists(
      () => ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] })),
      `VPC ${vpcId}`
    );

    if (!result) {
      throw new Error(`VPC ${vpcId} does not exist or is not accessible. Please check if infrastructure is deployed in region ${awsRegion}.`);
    }

    const { Vpcs } = result;
    expect(Vpcs?.length).toBe(1);

    const vpc = Vpcs?.[0];
    expect(vpc?.VpcId).toBe(vpcId);
    expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
    expect(vpc?.State).toBe("available");
    expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
  }, 30000);

  // Test 2: Public Subnets Configuration
  test("Public subnets are properly configured", async () => {
    const publicResult = await resourceExists(
      () => ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })),
      `Public subnets ${publicSubnetIds.join(', ')}`
    );

    if (!publicResult) {
      throw new Error(`Public subnets ${publicSubnetIds.join(', ')} do not exist or are not accessible.`);
    }

    const { Subnets: publicSubnets } = publicResult;
    expect(publicSubnets?.length).toBe(2);
    
    publicSubnets?.forEach((subnet) => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.State).toBe("available");
      expect(subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")).toBe(true);
      expect(subnet.CidrBlock).toMatch(/^10\.0\.[13]\.0\/24$/);
    });
  }, 30000);

  // Test 3: Private Subnets Configuration
  test("Private subnets are properly configured", async () => {
    const privateResult = await resourceExists(
      () => ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })),
      `Private subnets ${privateSubnetIds.join(', ')}`
    );

    if (!privateResult) {
      throw new Error(`Private subnets ${privateSubnetIds.join(', ')} do not exist or are not accessible.`);
    }

    const { Subnets: privateSubnets } = privateResult;
    expect(privateSubnets?.length).toBe(2);
    
    privateSubnets?.forEach((subnet) => {
      expect(subnet.VpcId).toBe(vpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.State).toBe("available");
      expect(subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")).toBe(true);
      expect(subnet.CidrBlock).toMatch(/^10\.0\.[24]\.0\/24$/);
    });
  }, 30000);

  // Test 4: EC2 Security Group Configuration
  test("EC2 security group has correct SSH access rules", async () => {
    const result = await resourceExists(
      () => ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })),
      `EC2 Security Group ${ec2SecurityGroupId}`
    );

    if (!result) {
      throw new Error(`EC2 Security Group ${ec2SecurityGroupId} does not exist or is not accessible.`);
    }

    const { SecurityGroups } = result;
    expect(SecurityGroups?.length).toBe(1);

    const sg = SecurityGroups?.[0];
    expect(sg?.GroupId).toBe(ec2SecurityGroupId);
    expect(sg?.VpcId).toBe(vpcId);
    
    // Check SSH ingress rule (port 22)
    const sshRule = sg?.IpPermissions?.find(rule => 
      rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
    );
    expect(sshRule).toBeDefined();
    expect(sshRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
  }, 30000);

  // Test 5: RDS Security Group Configuration
  test("RDS security group allows MySQL traffic only from EC2", async () => {
    const result = await resourceExists(
      () => ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })),
      `RDS Security Group ${rdsSecurityGroupId}`
    );

    if (!result) {
      throw new Error(`RDS Security Group ${rdsSecurityGroupId} does not exist or is not accessible.`);
    }

    const { SecurityGroups } = result;
    const sg = SecurityGroups?.[0];
    
    // Check MySQL rule from EC2 security group
    const mysqlRule = sg?.IpPermissions?.find(rule => 
      rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
    );
    expect(mysqlRule).toBeDefined();
    expect(mysqlRule?.UserIdGroupPairs?.some(pair => pair.GroupId === ec2SecurityGroupId)).toBe(true);
  }, 30000);

  // Test 6: EC2 Instance Configuration
  test("EC2 instance is running in private subnet with correct configuration", async () => {
    const result = await resourceExists(
      () => ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })),
      `EC2 Instance ${ec2InstanceId}`
    );

    if (!result) {
      throw new Error(`EC2 Instance ${ec2InstanceId} does not exist or is not accessible.`);
    }

    const { Reservations } = result;
    const instance = Reservations?.[0]?.Instances?.[0];
    
    expect(instance?.InstanceId).toBe(ec2InstanceId);
    expect(instance?.State?.Name).toMatch(/^(running|pending)$/);
    expect(instance?.InstanceType).toBe("t3.micro");
    expect(instance?.PrivateIpAddress).toBe(ec2PrivateIp);
    expect(privateSubnetIds).toContain(instance?.SubnetId);
    expect(instance?.PublicIpAddress).toBeUndefined();
    expect(instance?.SecurityGroups?.some(sg => sg.GroupId === ec2SecurityGroupId)).toBe(true);
  }, 30000);

  // Test 7: RDS Database Configuration
  test("RDS instance has correct configuration and security settings", async () => {
    const dbIdentifier = rdsEndpoint.split('.')[0];
    
    const result = await resourceExists(
      () => rdsClient.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })),
      `RDS Instance ${dbIdentifier}`
    );

    if (!result) {
      throw new Error(`RDS Instance ${dbIdentifier} does not exist or is not accessible.`);
    }

    const { DBInstances } = result;
    const dbInstance = DBInstances?.[0];
    
    expect(dbInstance?.Engine).toBe("mysql");
    expect(dbInstance?.EngineVersion).toBe("8.0");
    expect(dbInstance?.DBInstanceClass).toBe("db.t3.micro");
    expect(dbInstance?.StorageEncrypted).toBe(true);
    expect(dbInstance?.KmsKeyId).toBe(kmsKeyArn);
    expect(dbInstance?.PubliclyAccessible).toBe(false);
    expect(dbInstance?.DeletionProtection).toBe(true);
    expect(dbInstance?.BackupRetentionPeriod).toBe(7);
  }, 30000);

  // Test 8: Application S3 Bucket Security
  test("Application S3 bucket has proper encryption and access controls", async () => {
    const headResult = await resourceExists(
      () => s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName })),
      `S3 Bucket ${s3BucketName}`
    );

    if (!headResult) {
      throw new Error(`S3 Bucket ${s3BucketName} does not exist or is not accessible.`);
    }

    // Check encryption
    const { ServerSideEncryptionConfiguration } = await s3Client.send(
      new GetBucketEncryptionCommand({ Bucket: s3BucketName })
    );
    expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
    expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);

    // Check versioning
    const { Status } = await s3Client.send(
      new GetBucketVersioningCommand({ Bucket: s3BucketName })
    );
    expect(Status).toBe("Enabled");
  }, 30000);

  // Test 9: CloudTrail S3 Bucket Security
  test("CloudTrail S3 bucket has proper security configuration", async () => {
    const headResult = await resourceExists(
      () => s3Client.send(new HeadBucketCommand({ Bucket: cloudtrailS3BucketName })),
      `CloudTrail S3 Bucket ${cloudtrailS3BucketName}`
    );

    if (!headResult) {
      throw new Error(`CloudTrail S3 Bucket ${cloudtrailS3BucketName} does not exist or is not accessible.`);
    }

    // Check public access is blocked
    const { PublicAccessBlockConfiguration } = await s3Client.send(
      new GetPublicAccessBlockCommand({ Bucket: cloudtrailS3BucketName })
    );
    expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

    // Check encryption
    const { ServerSideEncryptionConfiguration } = await s3Client.send(
      new GetBucketEncryptionCommand({ Bucket: cloudtrailS3BucketName })
    );
    expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
  }, 30000);

  // Test 10: CloudTrail Configuration
  test("CloudTrail is properly configured for multi-region logging", async () => {
    const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({}));
    const cloudTrail = trailList?.find(trail => 
      trail.S3BucketName === cloudtrailS3BucketName
    );

    expect(cloudTrail).toBeDefined();
    expect(cloudTrail?.S3BucketName).toBe(cloudtrailS3BucketName);
    expect(cloudTrail?.IncludeGlobalServiceEvents).toBe(true);
    expect(cloudTrail?.IsMultiRegionTrail).toBe(true);
    expect(cloudTrail?.LogFileValidationEnabled).toBe(true);
  }, 30000);

  // Test 11: KMS Key Configuration
  test("KMS key is properly configured with rotation enabled", async () => {
    const result = await resourceExists(
      () => kmsClient.send(new DescribeKeyCommand({ KeyId: kmsKeyId })),
      `KMS Key ${kmsKeyId}`
    );

    if (!result) {
      throw new Error(`KMS Key ${kmsKeyId} does not exist or is not accessible.`);
    }

    const { KeyMetadata } = result;
    expect(KeyMetadata?.KeyId).toBe(kmsKeyId);
    expect(KeyMetadata?.Arn).toBe(kmsKeyArn);
    expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
    expect(KeyMetadata?.Enabled).toBe(true);

    // Check rotation
    const rotationResult = await kmsClient.send(new GetKeyRotationStatusCommand({ KeyId: kmsKeyId }));
    expect(rotationResult.KeyRotationEnabled).toBe(true);
  }, 30000);

  // Test 12: High Availability Configuration
  test("Infrastructure is deployed across multiple availability zones", async () => {
    // Check private subnets are in different AZs
    const { Subnets: privateSubnets } = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
    );
    
    const privateAZs = privateSubnets?.map(subnet => subnet.AvailabilityZone);
    const uniquePrivateAZs = [...new Set(privateAZs)];
    expect(uniquePrivateAZs.length).toBe(2);

    // Check public subnets are in different AZs
    const { Subnets: publicSubnets } = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
    );
    
    const publicAZs = publicSubnets?.map(subnet => subnet.AvailabilityZone);
    const uniquePublicAZs = [...new Set(publicAZs)];
    expect(uniquePublicAZs.length).toBe(2);
    
    // Verify all AZs start with the correct region
    expect(uniquePrivateAZs.every(az => az?.startsWith(awsRegion))).toBe(true);
    expect(uniquePublicAZs.every(az => az?.startsWith(awsRegion))).toBe(true);
  }, 30000);

  // Test 13: Security Compliance - Resource Isolation and Tagging
  test("All resources have proper tags and security isolation", async () => {
    // Check EC2 instance is isolated in private subnet with no public IP
    const { Reservations } = await ec2Client.send(
      new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
    );
    const instance = Reservations?.[0]?.Instances?.[0];
    
    expect(privateSubnetIds).toContain(instance?.SubnetId);
    expect(instance?.PublicIpAddress).toBeUndefined();
    expect(instance?.PrivateIpAddress).toMatch(/^10\.0\.[24]\.\d+$/);
    expect(instance?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);

    // Check RDS is properly secured
    const dbIdentifier = rdsEndpoint.split('.')[0];
    const { DBInstances } = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );
    const dbInstance = DBInstances?.[0];
    
    expect(dbInstance?.PubliclyAccessible).toBe(false);
    expect(dbInstance?.StorageEncrypted).toBe(true);
    expect(dbInstance?.TagList?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);

    // Check S3 buckets block public access
    const buckets = [s3BucketName, cloudtrailS3BucketName];
    
    for (const bucket of buckets) {
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucket })
      );
      
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }
  }, 30000);
});