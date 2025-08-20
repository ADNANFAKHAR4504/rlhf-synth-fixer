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
  DescribeTrailsCommand, 
  GetTrailStatusCommand 
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

  describe("VPC Infrastructure", () => {
    test("VPC exists and has correct configuration", async () => {
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
      
      // Check for project tags
      expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "Name")).toBe(true);
    }, 30000);

    test("Public and private subnets exist with correct configuration", async () => {
      // Test public subnets
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
        expect(subnet.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
        // Check CIDR blocks follow pattern 10.0.{odd}.0/24
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[13]\.0\/24$/);
      });

      // Test private subnets
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
        expect(subnet.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
        // Check CIDR blocks follow pattern 10.0.{even}.0/24
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[24]\.0\/24$/);
      });
    }, 30000);
  });

  describe("Security Groups", () => {
    test("EC2 security group has correct SSH access configuration", async () => {
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
      expect(sg?.GroupName).toContain("ec2-sg");
      expect(sg?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);

      // Check SSH ingress rule (port 22)
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")).toBe(true);
    }, 30000);

    test("RDS security group allows traffic only from EC2", async () => {
      const result = await resourceExists(
        () => ec2Client.send(new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })),
        `RDS Security Group ${rdsSecurityGroupId}`
      );

      if (!result) {
        throw new Error(`RDS Security Group ${rdsSecurityGroupId} does not exist or is not accessible.`);
      }

      const { SecurityGroups } = result;
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(rdsSecurityGroupId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toContain("rds-sg");
      expect(sg?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);

      // Check MySQL rule from EC2 security group
      const mysqlRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.some(pair => pair.GroupId === ec2SecurityGroupId)).toBe(true);
    }, 30000);
  });

  describe("EC2 Instance", () => {
    test("EC2 instance exists and is running in private subnet", async () => {
      const result = await resourceExists(
        () => ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })),
        `EC2 Instance ${ec2InstanceId}`
      );

      if (!result) {
        throw new Error(`EC2 Instance ${ec2InstanceId} does not exist or is not accessible.`);
      }

      const { Reservations } = result;
      expect(Reservations?.length).toBe(1);

      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.InstanceId).toBe(ec2InstanceId);
      expect(instance?.State?.Name).toMatch(/^(running|pending)$/); // Allow pending state
      expect(instance?.InstanceType).toBe("t3.micro");
      expect(instance?.PrivateIpAddress).toBe(ec2PrivateIp);
      
      // Verify it's in a private subnet
      expect(privateSubnetIds).toContain(instance?.SubnetId);
      
      // Verify no public IP
      expect(instance?.PublicIpAddress).toBeUndefined();
      
      // Check security group assignment
      expect(instance?.SecurityGroups?.some(sg => sg.GroupId === ec2SecurityGroupId)).toBe(true);
      
      // Check tags
      expect(instance?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
      expect(instance?.Tags?.some(tag => tag.Key === "Name")).toBe(true);
    }, 30000);

    test("EC2 instance has correct IAM instance profile", async () => {
      const result = await resourceExists(
        () => ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })),
        `EC2 Instance ${ec2InstanceId}`
      );

      if (!result) {
        throw new Error(`EC2 Instance ${ec2InstanceId} does not exist or is not accessible.`);
      }
      
      const { Reservations } = result;
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.IamInstanceProfile).toBeDefined();
      expect(instance?.IamInstanceProfile?.Arn).toContain("ec2-profile");
    }, 30000);
  });

  describe("RDS Database", () => {
    test("RDS instance exists with correct configuration", async () => {
      // Extract DB identifier from endpoint
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
      const result = await resourceExists(
        () => rdsClient.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })),
        `RDS Instance ${dbIdentifier}`
      );

      if (!result) {
        throw new Error(`RDS Instance ${dbIdentifier} does not exist or is not accessible.`);
      }

      const { DBInstances } = result;
      expect(DBInstances?.length).toBe(1);

      const dbInstance = DBInstances?.[0];
      expect(dbInstance?.DBInstanceIdentifier).toBe(dbIdentifier);
      expect(dbInstance?.DBInstanceStatus).toMatch(/^(available|creating|modifying)$/); // Allow transitional states
      expect(dbInstance?.Engine).toBe("mysql");
      expect(dbInstance?.EngineVersion).toBe("8.0");
      expect(dbInstance?.DBInstanceClass).toBe("db.t3.micro");
      expect(dbInstance?.AllocatedStorage).toBe(20);
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toBe(kmsKeyArn);
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      expect(dbInstance?.DeletionProtection).toBe(true);
      expect(dbInstance?.BackupRetentionPeriod).toBe(7);
      
      // Check it's in private subnets
      expect(dbInstance?.DBSubnetGroup?.Subnets?.every(subnet => 
        privateSubnetIds.includes(subnet.SubnetIdentifier || "")
      )).toBe(true);
      
      // Check security group
      expect(dbInstance?.VpcSecurityGroups?.some(sg => 
        sg.VpcSecurityGroupId === rdsSecurityGroupId && sg.Status === "active"
      )).toBe(true);
    }, 30000);
  });

  describe("S3 Buckets", () => {
    test("Application S3 bucket exists with correct security configuration", async () => {
      // Use region-specific S3 client for bucket operations
      const bucketRegion = awsRegion === 'us-east-1' ? awsRegion : awsRegion;
      const regionalS3Client = new S3Client({ region: bucketRegion });

      const headResult = await resourceExists(
        () => regionalS3Client.send(new HeadBucketCommand({ Bucket: s3BucketName })),
        `S3 Bucket ${s3BucketName}`
      );

      if (!headResult) {
        throw new Error(`S3 Bucket ${s3BucketName} does not exist or is not accessible.`);
      }

      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await regionalS3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check encryption is enabled with KMS
      const { ServerSideEncryptionConfiguration } = await regionalS3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3BucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.BucketKeyEnabled).toBe(true);

      // Check versioning is enabled
      const { Status } = await regionalS3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe("Enabled");
    }, 30000);

    test("CloudTrail S3 bucket exists with correct security configuration", async () => {
      // Use region-specific S3 client for bucket operations
      const bucketRegion = awsRegion === 'us-east-1' ? awsRegion : awsRegion;
      const regionalS3Client = new S3Client({ region: bucketRegion });

      const headResult = await resourceExists(
        () => regionalS3Client.send(new HeadBucketCommand({ Bucket: cloudtrailS3BucketName })),
        `CloudTrail S3 Bucket ${cloudtrailS3BucketName}`
      );

      if (!headResult) {
        throw new Error(`CloudTrail S3 Bucket ${cloudtrailS3BucketName} does not exist or is not accessible.`);
      }

      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await regionalS3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: cloudtrailS3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check encryption is enabled with KMS
      const { ServerSideEncryptionConfiguration } = await regionalS3Client.send(
        new GetBucketEncryptionCommand({ Bucket: cloudtrailS3BucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
    }, 30000);
  });

  describe("CloudTrail", () => {
    test("CloudTrail exists and is configured correctly", async () => {
      const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({}));
      const cloudTrail = trailList?.find(trail => 
        trail.S3BucketName === cloudtrailS3BucketName
      );

      expect(cloudTrail).toBeDefined();
      expect(cloudTrail?.S3BucketName).toBe(cloudtrailS3BucketName);
      expect(cloudTrail?.IncludeGlobalServiceEvents).toBe(true);
      expect(cloudTrail?.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail?.LogFileValidationEnabled).toBe(true);
      expect(cloudTrail?.Name).toContain("trail");
    }, 30000);
  });

  describe("KMS Key", () => {
    test("KMS key exists and has correct configuration", async () => {
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
      expect(KeyMetadata?.KeySpec).toBe("SYMMETRIC_DEFAULT");
      expect(KeyMetadata?.Enabled).toBe(true);
      expect(KeyMetadata?.Description).toContain("KMS key for tap-project");
      expect(KeyMetadata?.DeletionDate).toBeUndefined(); // Not scheduled for deletion
    }, 30000);

    test("KMS key has rotation enabled", async () => {
      const result = await resourceExists(
        () => kmsClient.send(new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })),
        `KMS Key rotation status for ${kmsKeyId}`
      );

      if (!result) {
        throw new Error(`Cannot check KMS Key rotation status for ${kmsKeyId}.`);
      }

      const { KeyRotationEnabled } = result;
      expect(KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe("Security Compliance", () => {
    test("All major resources have required tags", async () => {
      // Check VPC tags
      const vpcResult = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = vpcResult.Vpcs?.[0];
      expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);

      // Check EC2 instance tags
      const ec2Result = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = ec2Result.Reservations?.[0]?.Instances?.[0];
      expect(instance?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);

      // Check RDS tags
      const dbIdentifier = rdsEndpoint.split('.')[0];
      const rdsResult = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
      );
      const dbInstance = rdsResult.DBInstances?.[0];
      expect(dbInstance?.TagList?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
    }, 30000);

    test("EC2 instance is properly isolated in private subnet", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );

      const instance = Reservations?.[0]?.Instances?.[0];
      
      // Must be in private subnet
      expect(privateSubnetIds).toContain(instance?.SubnetId);
      
      // Must not have public IP
      expect(instance?.PublicIpAddress).toBeUndefined();
      
      // Must have private IP in expected range
      expect(instance?.PrivateIpAddress).toMatch(/^10\.0\.[24]\.\d+$/);
    }, 30000);

    test("RDS instance is properly secured", async () => {
      const dbIdentifier = rdsEndpoint.split('.')[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
      );
      
      const dbInstance = DBInstances?.[0];
      
      // Must not be publicly accessible
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      
      // Must be encrypted
      expect(dbInstance?.StorageEncrypted).toBe(true);
      
      // Must have deletion protection
      expect(dbInstance?.DeletionProtection).toBe(true);
      
      // Must have automated backups
      expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThan(0);
    }, 30000);

    test("All S3 buckets block public access", async () => {
      const buckets = [s3BucketName, cloudtrailS3BucketName];
      const regionalS3Client = new S3Client({ region: awsRegion });
      
      for (const bucket of buckets) {
        const { PublicAccessBlockConfiguration } = await regionalS3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucket })
        );
        
        expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
        expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
        expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
        expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
      }
    }, 30000);
  });

  describe("Network Connectivity", () => {
    test("Private subnets have different availability zones for high availability", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      
      const availabilityZones = Subnets?.map(subnet => subnet.AvailabilityZone);
      const uniqueAZs = [...new Set(availabilityZones)];
      
      expect(uniqueAZs.length).toBe(2); // Should be in 2 different AZs
      expect(uniqueAZs.every(az => az?.startsWith(awsRegion))).toBe(true);
    }, 30000);

    test("Public subnets have different availability zones for high availability", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      
      const availabilityZones = Subnets?.map(subnet => subnet.AvailabilityZone);
      const uniqueAZs = [...new Set(availabilityZones)];
      
      expect(uniqueAZs.length).toBe(2); // Should be in 2 different AZs
      expect(uniqueAZs.every(az => az?.startsWith(awsRegion))).toBe(true);
    }, 30000);
  });
});