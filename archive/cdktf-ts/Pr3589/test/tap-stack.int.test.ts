// __tests__/tap-stack.int.test.ts
import { IAMClient, GetRoleCommand, ListRolePoliciesCommand, GetRolePolicyCommand } from "@aws-sdk/client-iam";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeRouteTablesCommand, DescribeNatGatewaysCommand } from "@aws-sdk/client-ec2";
import { S3Client, GetBucketVersioningCommand, GetBucketEncryptionCommand, HeadBucketCommand, GetBucketLoggingCommand, GetBucketPolicyCommand } from "@aws-sdk/client-s3";
import { KMSClient, DescribeKeyCommand, ListAliasesCommand, GetKeyPolicyCommand } from "@aws-sdk/client-kms";
import { CloudTrailClient, GetTrailCommand, GetTrailStatusCommand } from "@aws-sdk/client-cloudtrail";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-2";
const ec2Client = new EC2Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const cloudTrailClient = new CloudTrailClient({ region: awsRegion });

describe("TapStack Secure Infrastructure Integration Tests", () => {
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
      "vpc_id",
      "public_subnet_ids", 
      "private_subnet_ids",
      "kms_key_arn",
      "secure_bucket_name",
      "log_bucket_name",
      "s3_access_role_arn",
      "cloudtrail_arn",
      "web_security_group_id"
    ];

    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required stack output: ${output}`);
      }
    }
  });

  describe("VPC Infrastructure - Secure Network Foundation", () => {
    test("VPC exists with correct CIDR and DNS settings", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(Vpcs).toHaveLength(1);
      expect(Vpcs![0].CidrBlock).toBe("10.0.0.0/16");
      expect(Vpcs![0].State).toBe("available");
      
      // Verify VPC tagging
      const tags = Vpcs![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "vpc-vpc")).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "SecureApp")).toBe(true);
      expect(tags.some(tag => tag.Key === "Project" && tag.Value === "TAP")).toBe(true);
    }, 20000);

    test("Public subnets exist with proper configuration in multiple AZs", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const publicSubnetIds = stackOutputs["public_subnet_ids"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      const expectedCidrs = ['10.0.1.0/24', '10.0.2.0/24'];
      const expectedAzs = ['us-east-2a', 'us-east-2b'];
      
      Subnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(expectedCidrs).toContain(subnet.CidrBlock);
        expect(expectedAzs).toContain(subnet.AvailabilityZone);
        
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify public subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("vpc-public-subnet"))).toBe(true);
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "SecureApp")).toBe(true);
      });

      // Verify subnets are in different AZs for high availability
      expect(availabilityZones.size).toBe(2);
    }, 20000);

    test("Private subnets exist for secure resource isolation", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const privateSubnetIds = stackOutputs["private_subnet_ids"];
      
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));
      
      expect(Subnets).toHaveLength(2);
      
      const availabilityZones = new Set();
      const expectedCidrs = ['10.0.3.0/24', '10.0.4.0/24'];
      const expectedAzs = ['us-east-2a', 'us-east-2b'];
      
      Subnets?.forEach((subnet, index) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.State).toBe("available");
        expect(expectedCidrs).toContain(subnet.CidrBlock);
        expect(expectedAzs).toContain(subnet.AvailabilityZone);
        
        availabilityZones.add(subnet.AvailabilityZone);
        
        // Verify private subnet tagging
        const tags = subnet.Tags || [];
        expect(tags.some(tag => tag.Key === "Name" && tag.Value?.includes("vpc-private-subnet"))).toBe(true);
        expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "SecureApp")).toBe(true);
      });

      // Verify subnets are in different AZs
      expect(availabilityZones.size).toBe(2);
    }, 20000);

    test("Internet Gateway is properly attached for public access", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
      }));
      
      expect(InternetGateways).toHaveLength(1);
      expect(InternetGateways![0].Attachments![0].State).toBe("available");
      expect(InternetGateways![0].Attachments![0].VpcId).toBe(vpcId);
      
      // Verify IGW tagging
      const tags = InternetGateways![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "vpc-igw")).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "SecureApp")).toBe(true);
    }, 20000);

    test("NAT Gateway exists with proper configuration", async () => {
      const vpcId = stackOutputs["vpc_id"];
      
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      expect(NatGateways).toHaveLength(1);
      expect(NatGateways![0].State).toBe("available");
      
      // Verify NAT Gateway is in public subnet
      const publicSubnetIds = stackOutputs["public_subnet_ids"];
      expect(publicSubnetIds).toContain(NatGateways![0].SubnetId);
      
      // Verify NAT Gateway tagging
      const tags = NatGateways![0].Tags || [];
      expect(tags.some(tag => tag.Key === "Name" && tag.Value === "vpc-nat")).toBe(true);
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "SecureApp")).toBe(true);
    }, 20000);

    test("Route tables are properly configured for network segmentation", async () => {
      const vpcId = stackOutputs["vpc_id"];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: "vpc-id", Values: [vpcId] }]
      }));
      
      // Should have default + public + private route tables
      expect(RouteTables!.length).toBeGreaterThanOrEqual(3);
      
      // Check for internet gateway routes in public route tables
      const internetRoutes = RouteTables?.filter(rt =>
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
        )
      );
      expect(internetRoutes!.length).toBeGreaterThan(0);
      
      // Check for NAT gateway routes in private route tables
      const natRoutes = RouteTables?.filter(rt =>
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith('nat-')
        )
      );
      expect(natRoutes!.length).toBeGreaterThan(0);
    }, 20000);
  });

  describe("IAM Module - Secure Role-Based Access Control", () => {
    test("S3 access role exists with proper assume role policy", async () => {
      const roleArn = stackOutputs["s3_access_role_arn"];
      const roleName = roleArn.split('/').pop();
      
      const { Role } = await iamClient.send(new GetRoleCommand({
        RoleName: roleName
      }));
      
      expect(Role).toBeDefined();
      expect(Role?.RoleName).toBe("tap-s3-access-role");
      
      // Verify assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role!.AssumeRolePolicyDocument!));
      expect(assumeRolePolicy.Statement[0].Effect).toBe("Allow");
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe("ec2.amazonaws.com");
      expect(assumeRolePolicy.Statement[0].Action).toBe("sts:AssumeRole");
      
      // Verify role tagging
      const tags = Role?.Tags || [];
      expect(tags.some(tag => tag.Key === "Environment" && tag.Value === "SecureApp")).toBe(true);
      expect(tags.some(tag => tag.Key === "Project" && tag.Value === "TAP")).toBe(true);
    }, 20000);

    test("S3 access role has correct inline policies", async () => {
      const roleArn = stackOutputs["s3_access_role_arn"];
      const roleName = roleArn.split('/').pop();
      
      const { PolicyNames } = await iamClient.send(new ListRolePoliciesCommand({
        RoleName: roleName
      }));
      
      expect(PolicyNames).toContain("s3-access");
      
      const { PolicyDocument } = await iamClient.send(new GetRolePolicyCommand({
        RoleName: roleName!,
        PolicyName: "s3-access"
      }));
      
      const policy = JSON.parse(decodeURIComponent(PolicyDocument!));
      
      // Check S3 permissions
      const s3Statement = policy.Statement.find((stmt: any) => 
        stmt.Action.some((action: string) => action.startsWith("s3:"))
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe("Allow");
      expect(s3Statement.Action).toContain("s3:GetObject");
      expect(s3Statement.Action).toContain("s3:PutObject");
      expect(s3Statement.Action).toContain("s3:ListBucket");
      
      // Check KMS permissions
      const kmsStatement = policy.Statement.find((stmt: any) =>
        stmt.Action.some((action: string) => action.startsWith("kms:"))
      );
      expect(kmsStatement).toBeDefined();
      expect(kmsStatement.Effect).toBe("Allow");
      expect(kmsStatement.Action).toContain("kms:Decrypt");
      expect(kmsStatement.Action).toContain("kms:GenerateDataKey");
    }, 20000);
  });

  describe("S3 Module - Secure Buckets with Encryption and Versioning", () => {
    test("Log bucket exists with proper configuration", async () => {
      const bucketName = stackOutputs["log_bucket_name"];
      expect(bucketName).toBe("tap-logs-bucket");
      
      // Test bucket accessibility
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
    }, 20000);

    test("Secure bucket exists with proper configuration", async () => {
      const bucketName = stackOutputs["secure_bucket_name"];
      expect(bucketName).toBe("tap-secure-bucket");
      
      // Test bucket accessibility
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: bucketName })))
        .resolves.toBeDefined();
    }, 20000);

    test("Secure bucket has server-side encryption enabled with KMS", async () => {
      const bucketName = stackOutputs["secure_bucket_name"];
      
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      
      expect(ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules![0].ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();
    }, 20000);

    test("Secure bucket has versioning enabled", async () => {
      const bucketName = stackOutputs["secure_bucket_name"];
      
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      
      expect(Status).toBe("Enabled");
    }, 20000);

    test("Secure bucket has access logging configured", async () => {
      const bucketName = stackOutputs["secure_bucket_name"];
      const logsBucketName = stackOutputs["log_bucket_name"];
      
      const { LoggingEnabled } = await s3Client.send(
        new GetBucketLoggingCommand({ Bucket: bucketName })
      );
      
      expect(LoggingEnabled?.TargetBucket).toBe(logsBucketName);
      expect(LoggingEnabled?.TargetPrefix).toBe("secure-bucket-logs/");
    }, 20000);

    test("Log bucket has versioning enabled", async () => {
      const bucketName = stackOutputs["log_bucket_name"];
      
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      
      expect(Status).toBe("Enabled");
    }, 20000);

    test("Secure bucket has proper bucket policy for IAM role access", async () => {
      const bucketName = stackOutputs["secure_bucket_name"];
      const roleArn = stackOutputs["s3_access_role_arn"];
      
      const { Policy } = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: bucketName })
      );
      
      const policyDoc = JSON.parse(Policy!);
      
      // Check for IAM role access statement
      const roleStatement = policyDoc.Statement.find((stmt: any) =>
        stmt.Principal?.AWS === roleArn
      );
      
      expect(roleStatement).toBeDefined();
      expect(roleStatement.Effect).toBe("Allow");
      expect(roleStatement.Action).toContain("s3:GetObject");
      expect(roleStatement.Action).toContain("s3:ListBucket");
    }, 20000);

    test("Log bucket has proper bucket policy for CloudTrail access", async () => {
      const bucketName = stackOutputs["log_bucket_name"];
      
      const { Policy } = await s3Client.send(
        new GetBucketPolicyCommand({ Bucket: bucketName })
      );
      
      const policyDoc = JSON.parse(Policy!);
      
      // Check for CloudTrail GetBucketAcl statement
      const aclStatement = policyDoc.Statement.find((stmt: any) =>
        stmt.Principal?.Service === "cloudtrail.amazonaws.com" &&
        stmt.Action === "s3:GetBucketAcl"
      );
      
      expect(aclStatement).toBeDefined();
      expect(aclStatement.Effect).toBe("Allow");
      
      // Check for CloudTrail PutObject statement
      const putStatement = policyDoc.Statement.find((stmt: any) =>
        stmt.Principal?.Service === "cloudtrail.amazonaws.com" &&
        stmt.Action === "s3:PutObject"
      );
      
      expect(putStatement).toBeDefined();
      expect(putStatement.Effect).toBe("Allow");
      expect(putStatement.Resource).toContain("cloudtrail-logs/*");
      expect(putStatement.Condition?.StringEquals?.["s3:x-amz-acl"]).toBe("bucket-owner-full-control");
    }, 20000);
  });

  describe("KMS Module - Encryption Key Management", () => {
    test("KMS key exists with proper configuration", async () => {
      const keyArn = stackOutputs["kms_key_arn"];
      const keyId = keyArn.split('/').pop();
      
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({
        KeyId: keyId!
      }));
      
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.KeySpec).toBe("SYMMETRIC_DEFAULT");
      expect(KeyMetadata?.KeyState).toBe("Enabled");
      expect(KeyMetadata?.Description).toBe("KMS key for TAP secure environment");
      expect(KeyMetadata?.KeyManager).toBe("CUSTOMER");
      expect(KeyMetadata?.Origin).toBe("AWS_KMS");
    
    }, 20000);

    test("KMS alias exists for the key", async () => {
      const { Aliases } = await kmsClient.send(new ListAliasesCommand({}));
      
      const keyAlias = Aliases?.find(alias => alias.AliasName === "alias/tap-encryption-key");
      expect(keyAlias).toBeDefined();
      expect(keyAlias?.AliasName).toBe("alias/tap-encryption-key");
    }, 20000);

    test("KMS key policy allows CloudTrail access", async () => {
      const keyArn = stackOutputs["kms_key_arn"];
      const keyId = keyArn.split('/').pop();
      
      const { Policy } = await kmsClient.send(new GetKeyPolicyCommand({
        KeyId: keyId!,
        PolicyName: "default"
      }));
      
      const policyDoc = JSON.parse(Policy!);
      
      // Check for CloudTrail permissions
      const cloudTrailStatement = policyDoc.Statement.find((stmt: any) =>
        stmt.Principal?.Service === "cloudtrail.amazonaws.com"
      );
      
      expect(cloudTrailStatement).toBeDefined();
      expect(cloudTrailStatement.Effect).toBe("Allow");
      expect(cloudTrailStatement.Action).toContain("kms:GenerateDataKey*");
      expect(cloudTrailStatement.Action).toContain("kms:Decrypt");
      expect(cloudTrailStatement.Action).toContain("kms:DescribeKey");
    }, 20000);
  });

  describe("CloudTrail Module - Security Monitoring and Auditing", () => {
    test("CloudTrail exists with proper configuration", async () => {
      const trailArn = stackOutputs["cloudtrail_arn"];
      const trailName = trailArn.split('/').pop();
      
      const { Trail } = await cloudTrailClient.send(new GetTrailCommand({
        Name: trailName!
      }));
      
      expect(Trail?.Name).toBe("tap-cloudtrail");
      expect(Trail?.S3BucketName).toBe(stackOutputs["log_bucket_name"]);
      expect(Trail?.S3KeyPrefix).toBe("cloudtrail-logs/");
      expect(Trail?.KmsKeyId).toBe(stackOutputs["kms_key_arn"]);
      
    }, 20000);

    test("CloudTrail is logging and active", async () => {
      const trailArn = stackOutputs["cloudtrail_arn"];
      const trailName = trailArn.split('/').pop();
      
      const { IsLogging } = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: trailName!
      }));
      
      expect(IsLogging).toBe(true);
    }, 20000);
  });

  describe("Output Validation - Infrastructure References", () => {
    test("All required outputs are present and properly formatted", () => {
      expect(stackOutputs["vpc_id"]).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(stackOutputs["secure_bucket_name"]).toBe("tap-secure-bucket");
      expect(stackOutputs["log_bucket_name"]).toBe("tap-logs-bucket");
      expect(stackOutputs["web_security_group_id"]).toMatch(/^sg-[a-f0-9]{17}$/);
      
      // Verify array outputs
      expect(Array.isArray(stackOutputs["public_subnet_ids"])).toBe(true);
      expect(stackOutputs["public_subnet_ids"]).toHaveLength(2);
      expect(Array.isArray(stackOutputs["private_subnet_ids"])).toBe(true);
      expect(stackOutputs["private_subnet_ids"]).toHaveLength(2);
      
      // Verify ARN formats
      expect(stackOutputs["kms_key_arn"]).toMatch(/^arn:aws:kms:/);
      expect(stackOutputs["s3_access_role_arn"]).toMatch(/^arn:aws:iam::/);
      expect(stackOutputs["cloudtrail_arn"]).toMatch(/^arn:aws:cloudtrail:/);
    });

    test("Subnet IDs follow AWS format", () => {
      const publicSubnets = stackOutputs["public_subnet_ids"];
      const privateSubnets = stackOutputs["private_subnet_ids"];
      
      [...publicSubnets, ...privateSubnets].forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
    });
  });

  describe("Security Best Practices Validation", () => {
    test("Encryption at rest is enabled for all data stores", async () => {
      // Verify S3 encryption for secure bucket
      const secureBucket = stackOutputs["secure_bucket_name"];
      const { ServerSideEncryptionConfiguration: secureConfig } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: secureBucket })
      );
      expect(secureConfig?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      
      // Verify S3 encryption for log bucket
      const logBucket = stackOutputs["log_bucket_name"];
      const { ServerSideEncryptionConfiguration: logConfig } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: logBucket })
      );
      expect(logConfig?.Rules![0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
    }, 20000);

    test("Private subnets have no direct internet access", async () => {
      const vpcId = stackOutputs["vpc_id"];
      const privateSubnetIds = stackOutputs["private_subnet_ids"];
      
      const { RouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "association.subnet-id", Values: privateSubnetIds }
        ]
      }));
      
      // Verify no direct internet gateway routes in private subnets
      RouteTables?.forEach(rt => {
        const internetGatewayRoute = rt.Routes?.find(route =>
          route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith('igw-')
        );
        expect(internetGatewayRoute).toBeUndefined();
        
        // Should have NAT gateway route instead
        const natGatewayRoute = rt.Routes?.find(route =>
          route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith('nat-')
        );
        expect(natGatewayRoute).toBeDefined();
      });
    }, 20000);
  });

  describe("High Availability and Resilience", () => {
    test("Resources are distributed across multiple availability zones", async () => {
      const publicSubnetIds = stackOutputs["public_subnet_ids"];
      const privateSubnetIds = stackOutputs["private_subnet_ids"];
      
      // Check subnet distribution
      const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [...publicSubnetIds, ...privateSubnetIds]
      }));
      
      const availabilityZones = new Set(Subnets?.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBe(2);
      expect(Array.from(availabilityZones)).toEqual(
        expect.arrayContaining(["us-east-2a", "us-east-2b"])
      );
    }, 20000);

    test("Backup and recovery mechanisms are in place", async () => {
      // Verify S3 versioning for both buckets
      const secureBucket = stackOutputs["secure_bucket_name"];
      const { Status: secureStatus } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: secureBucket })
      );
      expect(secureStatus).toBe("Enabled");
      
      const logBucket = stackOutputs["log_bucket_name"];
      const { Status: logStatus } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: logBucket })
      );
      expect(logStatus).toBe("Enabled");
    }, 20000);
  });

  describe("Compliance and Governance", () => {
    test("All resources have proper tagging for governance", async () => {
      const vpcId = stackOutputs["vpc_id"];
      
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const vpcTags = Vpcs![0].Tags || [];
      
      expect(vpcTags.some(tag => tag.Key === "Environment" && tag.Value === "SecureApp")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "Project" && tag.Value === "TAP")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "CreatedBy" && tag.Value === "CDKTF")).toBe(true);
      
      // Check Security Group tags
      const webSgId = stackOutputs["web_security_group_id"];
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [webSgId]
      }));
      
      const sgTags = SecurityGroups![0].Tags || [];
      expect(sgTags.some(tag => tag.Key === "Environment" && tag.Value === "SecureApp")).toBe(true);
      expect(sgTags.some(tag => tag.Key === "Project" && tag.Value === "TAP")).toBe(true);
    }, 20000);

    test("CloudTrail is enabled for audit logging", async () => {
      const trailArn = stackOutputs["cloudtrail_arn"];
      const trailName = trailArn.split('/').pop();
      
      const { IsLogging } = await cloudTrailClient.send(new GetTrailStatusCommand({
        Name: trailName!
      }));
      
      expect(IsLogging).toBe(true);
    }, 20000);
  });
});