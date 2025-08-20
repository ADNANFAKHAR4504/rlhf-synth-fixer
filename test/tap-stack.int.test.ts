// __tests__/tap-stack.int.test.ts
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

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
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
    // Updated path to match the reference pattern
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // Should be "TapStackpr1759" or similar
    const stackOutputs = outputs[stackKey];

    // Extract outputs based on your deployment structure
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
    if (!vpcId || !publicSubnetIds || !privateSubnetIds || !ec2InstanceId || 
        !s3BucketName || !cloudtrailS3BucketName || !kmsKeyId || !rdsEndpoint) {
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
      
      // Check for project tags
      expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "Name")).toBe(true);
    }, 20000);

    test("Public and private subnets exist with correct configuration", async () => {
      // Test public subnets
      const { Subnets: publicSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(publicSubnets?.length).toBe(2);
      
      publicSubnets?.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe("available");
        expect(subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Public")).toBe(true);
        expect(subnet.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
        // Check CIDR blocks follow pattern 10.0.{odd}.0/24
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[13]\.0\/24$/);
      });

      // Test private subnets
      const { Subnets: privateSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      expect(privateSubnets?.length).toBe(2);
      
      privateSubnets?.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe("available");
        expect(subnet.Tags?.some(tag => tag.Key === "Type" && tag.Value === "Private")).toBe(true);
        expect(subnet.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
        // Check CIDR blocks follow pattern 10.0.{even}.0/24
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[24]\.0\/24$/);
      });
    }, 20000);
  });

  describe("Security Groups", () => {
    test("EC2 security group has correct SSH access configuration", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })
      );
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

      // Check egress rule (all traffic outbound)
      const egressRule = sg?.IpPermissionsEgress?.find(rule => 
        rule.FromPort === 0 && rule.ToPort === 65535 && rule.IpProtocol === "tcp"
      );
      expect(egressRule).toBeDefined();
    }, 20000);

    test("RDS security group allows traffic only from EC2", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })
      );
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
    }, 20000);
  });

  describe("EC2 Instance", () => {
    test("EC2 instance exists and is running in private subnet", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      expect(Reservations?.length).toBe(1);

      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.InstanceId).toBe(ec2InstanceId);
      expect(instance?.State?.Name).toBe("running");
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
    }, 20000);

    test("EC2 instance has correct IAM instance profile", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.IamInstanceProfile).toBeDefined();
      expect(instance?.IamInstanceProfile?.Arn).toContain("ec2-profile");
    }, 20000);
  });

  describe("RDS Database", () => {
    test("RDS instance exists with correct configuration", async () => {
      // Extract DB identifier from endpoint
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
      );
      expect(DBInstances?.length).toBe(1);

      const dbInstance = DBInstances?.[0];
      expect(dbInstance?.DBInstanceIdentifier).toBe(dbIdentifier);
      expect(dbInstance?.DBInstanceStatus).toBe("available");
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
    }, 20000);
  });

  describe("S3 Buckets", () => {
    test("Application S3 bucket exists with correct security configuration", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));

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
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.BucketKeyEnabled).toBe(true);

      // Check versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe("Enabled");
    }, 20000);

    test("CloudTrail S3 bucket exists with correct security configuration", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: cloudtrailS3BucketName }));

      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: cloudtrailS3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check encryption is enabled with KMS
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: cloudtrailS3BucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
    }, 20000);
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
    }, 20000);
  });

  describe("KMS Key", () => {
    test("KMS key exists and has correct configuration", async () => {
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );

      expect(KeyMetadata?.KeyId).toBe(kmsKeyId);
      expect(KeyMetadata?.Arn).toBe(kmsKeyArn);
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.KeySpec).toBe("SYMMETRIC_DEFAULT");
      expect(KeyMetadata?.Enabled).toBe(true);
      expect(KeyMetadata?.Description).toContain("KMS key for tap-project");
      expect(KeyMetadata?.DeletionDate).toBeUndefined(); // Not scheduled for deletion
    }, 20000);

    test("KMS key has rotation enabled", async () => {
      const { KeyRotationEnabled } = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })
      );
      expect(KeyRotationEnabled).toBe(true);
    }, 20000);
  });

  describe("Security Compliance", () => {
    test("All major resources have required tags", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      expect(vpc?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);

      // Check EC2 instance tags
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.Tags?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);

      // Check RDS tags
      const dbIdentifier = rdsEndpoint.split('.')[0];
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
      );
      const dbInstance = DBInstances?.[0];
      expect(dbInstance?.TagList?.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
    }, 20000);

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
    }, 20000);

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
    }, 20000);

    test("All S3 buckets block public access", async () => {
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
    }, 20000);
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
    }, 20000);

    test("Public subnets have different availability zones for high availability", async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      
      const availabilityZones = Subnets?.map(subnet => subnet.AvailabilityZone);
      const uniqueAZs = [...new Set(availabilityZones)];
      
      expect(uniqueAZs.length).toBe(2); // Should be in 2 different AZs
      expect(uniqueAZs.every(az => az?.startsWith(awsRegion))).toBe(true);
    }, 20000);
  });
});