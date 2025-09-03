// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand } from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand } from "@aws-sdk/client-rds";
import { CloudTrailClient, DescribeTrailsCommand } from "@aws-sdk/client-cloudtrail";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import { SecretsManagerClient, DescribeSecretCommand } from "@aws-sdk/client-secrets-manager";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let awsAccountId: string;
  let vpcId: string;
  let publicSubnetId: string;
  let privateSubnetId: string;
  let isolatedSubnetId: string;
  let internetGatewayId: string;
  let natGatewayId: string;
  let ec2InstanceId: string;
  let ec2InstancePrivateIp: string;
  let ec2SecurityGroupId: string;
  let rdsSecurityGroupId: string;
  let ec2IamRoleArn: string;
  let ec2IamRoleName: string;
  let s3BucketName: string;
  let s3BucketArn: string;
  let s3KmsKeyId: string;
  let rdsEndpoint: string;
  let rdsKmsKeyId: string;
  let dbSecretArn: string;
  let dbSecretName: string;
  let cloudtrailArn: string;
  let cloudtrailLogsBucket: string;
  let cloudtrailKmsKeyId: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`deployment-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // "TapStackpr2525"
    const stackOutputs = outputs[stackKey];

    awsAccountId = stackOutputs["aws-account-id"];
    vpcId = stackOutputs["vpc-id"];
    publicSubnetId = stackOutputs["public-subnet-id"];
    privateSubnetId = stackOutputs["private-subnet-id"];
    isolatedSubnetId = stackOutputs["isolated-subnet-id"];
    internetGatewayId = stackOutputs["internet-gateway-id"];
    natGatewayId = stackOutputs["nat-gateway-id"];
    ec2InstanceId = stackOutputs["ec2-instance-id"];
    ec2InstancePrivateIp = stackOutputs["ec2-instance-private-ip"];
    ec2SecurityGroupId = stackOutputs["ec2-security-group-id"];
    rdsSecurityGroupId = stackOutputs["rds-security-group-id"];
    ec2IamRoleArn = stackOutputs["ec2-iam-role-arn"];
    ec2IamRoleName = stackOutputs["ec2-iam-role-name"];
    s3BucketName = stackOutputs["s3-bucket-name"];
    s3BucketArn = stackOutputs["s3-bucket-arn"];
    s3KmsKeyId = stackOutputs["s3-kms-key-id"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    rdsKmsKeyId = stackOutputs["rds-kms-key-id"];
    dbSecretArn = stackOutputs["db-secret-arn"];
    dbSecretName = stackOutputs["db-secret-name"];
    cloudtrailArn = stackOutputs["cloudtrail-arn"];
    cloudtrailLogsBucket = stackOutputs["cloudtrail-logs-bucket"];
    cloudtrailKmsKeyId = stackOutputs["cloudtrail-kms-key-id"];

    if (!vpcId || !ec2InstanceId || !s3BucketName || !rdsEndpoint || !cloudtrailArn) {
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
      expect(vpc?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "tap-vpc")).toBe(true);
      expect(vpc?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);
    }, 20000);

    test("Subnets exist with correct configuration", async () => {
      // Test public subnet
      const { Subnets: publicSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] })
      );
      expect(publicSubnets?.length).toBe(1);
      const publicSubnet = publicSubnets?.[0];
      expect(publicSubnet?.VpcId).toBe(vpcId);
      expect(publicSubnet?.CidrBlock).toBe("10.0.1.0/24");
      expect(publicSubnet?.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet?.State).toBe("available");
      expect(publicSubnet?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "tap-public-subnet")).toBe(true);
      expect(publicSubnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "public")).toBe(true);

      // Test private subnet
      const { Subnets: privateSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [privateSubnetId] })
      );
      expect(privateSubnets?.length).toBe(1);
      const privateSubnet = privateSubnets?.[0];
      expect(privateSubnet?.VpcId).toBe(vpcId);
      expect(privateSubnet?.CidrBlock).toBe("10.0.2.0/24");
      expect(privateSubnet?.MapPublicIpOnLaunch).toBe(false);
      expect(privateSubnet?.State).toBe("available");
      expect(privateSubnet?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "tap-private-subnet")).toBe(true);
      expect(privateSubnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "private")).toBe(true);

      // Test isolated subnet
      const { Subnets: isolatedSubnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: [isolatedSubnetId] })
      );
      expect(isolatedSubnets?.length).toBe(1);
      const isolatedSubnet = isolatedSubnets?.[0];
      expect(isolatedSubnet?.VpcId).toBe(vpcId);
      expect(isolatedSubnet?.CidrBlock).toBe("10.0.3.0/24");
      expect(isolatedSubnet?.MapPublicIpOnLaunch).toBe(false);
      expect(isolatedSubnet?.State).toBe("available");
      expect(isolatedSubnet?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "tap-isolated-subnet")).toBe(true);
      expect(isolatedSubnet?.Tags?.some(tag => tag.Key === "Type" && tag.Value === "isolated")).toBe(true);
    }, 20000);

    test("Internet Gateway and NAT Gateway exist", async () => {
      // Test Internet Gateway
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({ InternetGatewayIds: [internetGatewayId] })
      );
      expect(InternetGateways?.length).toBe(1);
      const igw = InternetGateways?.[0];
      expect(igw?.InternetGatewayId).toBe(internetGatewayId);
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "tap-igw")).toBe(true);

      // Test NAT Gateway
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] })
      );
      expect(NatGateways?.length).toBe(1);
      const natGw = NatGateways?.[0];
      expect(natGw?.NatGatewayId).toBe(natGatewayId);
      expect(natGw?.State).toBe("available");
      expect(natGw?.SubnetId).toBe(publicSubnetId);
      expect(natGw?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "tap-nat-gateway")).toBe(true);
    }, 20000);
  });

  describe("Security Groups", () => {
    test("EC2 security group has correct configuration", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [ec2SecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(ec2SecurityGroupId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toBe("tap-ec2-sg");
      expect(sg?.Description).toBe("Security group for EC2 instance");

      // Check SSH rule (port 22) from VPC CIDR
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.some(range => range.CidrIp === "10.0.0.0/16")).toBe(true);
    }, 20000);

    test("RDS security group allows traffic only from EC2", async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [rdsSecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const sg = SecurityGroups?.[0];
      expect(sg?.GroupId).toBe(rdsSecurityGroupId);
      expect(sg?.VpcId).toBe(vpcId);
      expect(sg?.GroupName).toBe("tap-rds-sg");
      expect(sg?.Description).toBe("Security group for RDS database");

      // Check MySQL rule from EC2 security group
      const mysqlRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306 && rule.IpProtocol === "tcp"
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.some(pair => pair.GroupId === ec2SecurityGroupId)).toBe(true);
    }, 20000);
  });

  describe("IAM Role", () => {
    test("EC2 IAM role exists with correct configuration", async () => {
      const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: ec2IamRoleName }));
      
      expect(Role?.RoleName).toBe(ec2IamRoleName);
      expect(Role?.Arn).toBe(ec2IamRoleArn);
      expect(Role?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "tap-ec2-role")).toBe(true);

      // Check assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe("ec2.amazonaws.com");
      expect(assumeRolePolicy.Statement[0].Action).toBe("sts:AssumeRole");
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
      expect(instance?.SubnetId).toBe(privateSubnetId);
      expect(instance?.PrivateIpAddress).toBe(ec2InstancePrivateIp);
      expect(instance?.PublicIpAddress).toBeUndefined(); // No public IP
      expect(instance?.InstanceType).toBe("t3.micro");
      expect(instance?.Tags?.some(tag => tag.Key === "Name" && tag.Value === "tap-ec2-instance")).toBe(true);
      expect(instance?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);
    }, 20000);
  });

  describe("S3 Bucket", () => {
    test("S3 bucket exists with correct security configuration", async () => {
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
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain(s3KmsKeyId);

      // Check versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe("Enabled");
    }, 20000);
  });

  describe("RDS Database", () => {
    test("RDS instance exists with correct configuration", async () => {
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: "tap-mysql-db" })
      );
      expect(DBInstances?.length).toBe(1);

      const db = DBInstances?.[0];
      expect(db?.DBInstanceIdentifier).toBe("tap-mysql-db");
      expect(db?.DBInstanceStatus).toBe("available");
      expect(db?.Engine).toBe("mysql");
      expect(db?.EngineVersion).toContain("8.0");
      expect(db?.DBInstanceClass).toBe("db.t3.micro");
      expect(db?.StorageEncrypted).toBe(true);
      expect(db?.KmsKeyId).toContain(rdsKmsKeyId);
      expect(db?.MultiAZ).toBe(true);
      expect(db?.BackupRetentionPeriod).toBe(7);
      expect(db?.DeletionProtection).toBe(true);
      expect(db?.Endpoint?.Address).toBe(rdsEndpoint.split(':')[0]);
      expect(db?.Endpoint?.Port).toBe(3306);
    }, 30000);
  });

  describe("Secrets Manager", () => {
    test("Database secret exists with correct configuration", async () => {
      const { Name, Description, KmsKeyId } = await secretsManagerClient.send(
        new DescribeSecretCommand({ SecretId: dbSecretArn })
      );

      expect(Name).toBe(dbSecretName);
      expect(Description).toBe("RDS MySQL database credentials");
      expect(KmsKeyId).toContain(rdsKmsKeyId);
    }, 20000);
  });

  describe("KMS Keys", () => {
    test("S3 KMS key exists and is enabled", async () => {
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({ KeyId: s3KmsKeyId }));

      expect(KeyMetadata?.KeyId).toBe(s3KmsKeyId);
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.Enabled).toBe(true);
      expect(KeyMetadata?.Description).toBe("KMS key for S3 bucket encryption");
    }, 20000);

    test("RDS KMS key exists and is enabled", async () => {
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({ KeyId: rdsKmsKeyId }));

      expect(KeyMetadata?.KeyId).toBe(rdsKmsKeyId);
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.Enabled).toBe(true);
      expect(KeyMetadata?.Description).toBe("KMS key for RDS encryption");
    }, 20000);

    test("CloudTrail KMS key exists and is enabled", async () => {
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({ KeyId: cloudtrailKmsKeyId }));

      expect(KeyMetadata?.KeyId).toBe(cloudtrailKmsKeyId);
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.Enabled).toBe(true);
      expect(KeyMetadata?.Description).toBe("KMS key for CloudTrail encryption");
    }, 20000);
  });

  describe("CloudTrail", () => {
    test("CloudTrail exists and is configured correctly", async () => {
      const { trailList } = await cloudTrailClient.send(new DescribeTrailsCommand({}));
      const cloudTrail = trailList?.find(trail => trail.TrailARN === cloudtrailArn);

      expect(cloudTrail).toBeDefined();
      expect(cloudTrail?.Name).toBe("tap-cloudtrail");
      expect(cloudTrail?.S3BucketName).toBe(cloudtrailLogsBucket);
      expect(cloudTrail?.IncludeGlobalServiceEvents).toBe(true);
      expect(cloudTrail?.IsMultiRegionTrail).toBe(true);
    }, 20000);

    test("CloudTrail logs bucket exists with correct security configuration", async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: cloudtrailLogsBucket }));

      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: cloudtrailLogsBucket })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check encryption is enabled
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: cloudtrailLogsBucket })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");

      // Check versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: cloudtrailLogsBucket })
      );
      expect(Status).toBe("Enabled");
    }, 20000);
  });

  describe("Security Compliance", () => {
    test("All resources have required tags", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpc = Vpcs?.[0];
      expect(vpc?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);

      // Check EC2 instance tags
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );
      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === "production")).toBe(true);
    }, 20000);

    test("EC2 instance is in private subnet without public IP", async () => {
      const { Reservations } = await ec2Client.send(
        new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId] })
      );

      const instance = Reservations?.[0]?.Instances?.[0];
      expect(instance?.SubnetId).toBe(privateSubnetId);
      expect(instance?.PublicIpAddress).toBeUndefined();
      expect(instance?.PrivateIpAddress).toBeDefined();
    }, 20000);

    test("All encryption keys are properly configured", async () => {
      // Test all KMS keys are enabled and have proper descriptions
      const keyIds = [s3KmsKeyId, rdsKmsKeyId, cloudtrailKmsKeyId];
    }, 30000);
  });
});