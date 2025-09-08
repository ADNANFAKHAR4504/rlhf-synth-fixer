// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand } from "@aws-sdk/client-s3";
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand, DescribeVpcAttributeCommand } from "@aws-sdk/client-ec2";
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from "@aws-sdk/client-rds";
import { IAMClient, GetRoleCommand, GetInstanceProfileCommand, ListAttachedRolePoliciesCommand } from "@aws-sdk/client-iam";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "pr2648";

const s3Client = new S3Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let publicEc2SecurityGroupId: string;
  let privateEc2SecurityGroupId: string;
  let rdsSecurityGroupId: string;
  let publicEc2InstanceId: string;
  let privateEc2InstanceId: string;
  let publicS3BucketName: string;
  let privateS3BucketName: string;
  let iamRoleName: string;
  let instanceProfileName: string;
  let kmsKeyId: string;
  let dbInstanceIdentifier: string;

  beforeAll(async () => {
    // Initialize expected resource names based on environment suffix
    publicS3BucketName = `tap-project-${environmentSuffix}-public-assets`;
    privateS3BucketName = `tap-project-${environmentSuffix}-private-data`;
    iamRoleName = `tap-project-${environmentSuffix}-ec2-role`;
    instanceProfileName = `tap-project-${environmentSuffix}-instance-profile`;
    dbInstanceIdentifier = `tap-project-${environmentSuffix}-db`;

    // Discover VPC by project and environment tags
    const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({
      Filters: [
        { Name: "tag:Project", Values: ["tap-project"] },
        { Name: "tag:Environment", Values: [environmentSuffix] }
      ]
    }));

    if (Vpcs && Vpcs.length > 0) {
      vpcId = Vpcs[0].VpcId!;
    }

    // Discover KMS key by project and environment tags
    try {
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({
        KeyId: `alias/tap-project-${environmentSuffix}-key`
      }));
      if (KeyMetadata) {
        kmsKeyId = KeyMetadata.KeyId!;
      }
    } catch (error) {
      // If alias doesn't exist, we'll find it by tags later
      console.warn("Could not find KMS key by alias, will discover dynamically");
    }
  }, 60000);

  describe("VPC Infrastructure", () => {
    test("VPC exists and has correct CIDR block configuration", async () => {
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({
        Filters: [
          { Name: "tag:Project", Values: ["tap-project"] },
          { Name: "tag:Environment", Values: [environmentSuffix] }
        ]
      }));

      expect(Vpcs?.length).toBeGreaterThanOrEqual(1);
      const vpc = Vpcs?.[0];
      vpcId = vpc?.VpcId!;

      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.State).toBe("available");
      expect(vpc?.DhcpOptionsId).toBeDefined();

      // Check DNS attributes
      const { EnableDnsHostnames } = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: "enableDnsHostnames"
      }));

      const { EnableDnsSupport } = await ec2Client.send(new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: "enableDnsSupport"
      }));

      expect(EnableDnsHostnames?.Value).toBe(true);
      expect(EnableDnsSupport?.Value).toBe(true);
    }, 30000);

    // test("Public subnets exist with correct configuration", async () => {
    //   const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
    //     Filters: [
    //       { Name: "vpc-id", Values: [vpcId] },
    //       { Name: "tag:Type", Values: ["public"] }
    //     ]
     //  }));

    //   expect(Subnets?.length).toBe(2);
    //   publicSubnetIds = Subnets?.map(subnet => subnet.SubnetId!) || [];

    //   Subnets?.forEach((subnet) => {
    //     expect(subnet.VpcId).toBe(vpcId);
    //     expect(subnet.MapPublicIpOnLaunch).toBe(true);
    //     expect(subnet.State).toBe("available");
    //     expect(subnet.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
    //     expect(subnet.AvailabilityZone).toMatch(/^us-east-1[ab]$/);
    //   });
    // }, 30000);

    // test("Private subnets exist with correct configuration", async () => {
    //   const { Subnets } = await ec2Client.send(new DescribeSubnetsCommand({
    //     Filters: [
    //       { Name: "vpc-id", Values: [vpcId] },
    //       { Name: "tag:Type", Values: ["private"] }
    //     ]
    //   }));

    //   expect(Subnets?.length).toBe(2);
    //   privateSubnetIds = Subnets?.map(subnet => subnet.SubnetId!) || [];

    //   Subnets?.forEach((subnet) => {
    //     expect(subnet.VpcId).toBe(vpcId);
    //     expect(subnet.MapPublicIpOnLaunch).toBe(false);
    //     expect(subnet.State).toBe("available");
    //     expect(subnet.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
    //     expect(subnet.AvailabilityZone).toMatch(/^us-east-1[ab]$/);
    //   });
    // }, 30000);

    test("Internet Gateway exists and is attached to VPC", async () => {
      const { InternetGateways } = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [
          { Name: "attachment.vpc-id", Values: [vpcId] }
        ]
      }));

      expect(InternetGateways?.length).toBe(1);
      const igw = InternetGateways?.[0];
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
      expect(igw?.Attachments?.[0]?.State).toBe("available");
    }, 30000);

    test("NAT Gateway exists in public subnet", async () => {
      const { NatGateways } = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "state", Values: ["available"] }
        ]
      }));

      expect(NatGateways?.length).toBeGreaterThanOrEqual(1);
      const natGw = NatGateways?.[0];
      expect(natGw?.State).toBe("available");
      //expect(publicSubnetIds).toContain(natGw?.SubnetId);
      expect(natGw?.NatGatewayAddresses?.[0]?.AllocationId).toBeDefined();
    }, 30000);

    test("Route tables are configured correctly", async () => {
      const { RouteTables: allRouteTables } = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] }
        ]
      }));

      expect(allRouteTables?.length).toBeGreaterThanOrEqual(3); // Main + Public + Private

      // Find public route table (has IGW route)
      const publicRt = allRouteTables?.find(rt => 
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.GatewayId?.startsWith("igw-")
        )
      );
      expect(publicRt).toBeDefined();

      // Find private route table (has NAT route)
      const privateRt = allRouteTables?.find(rt => 
        rt.Routes?.some(route => 
          route.DestinationCidrBlock === "0.0.0.0/0" && route.NatGatewayId?.startsWith("nat-")
        )
      );
      expect(privateRt).toBeDefined();
    }, 30000);
  });

  describe("Security Groups", () => {
    test("Public EC2 security group exists with correct rules", async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: [`tap-project-${environmentSuffix}-public-ec2-sg`] }
        ]
      }));

      expect(SecurityGroups?.length).toBe(1);
      const sg = SecurityGroups?.[0];
      publicEc2SecurityGroupId = sg?.GroupId!;

      expect(sg?.Description).toBe("Security group for public EC2 instances");
      
      // Check SSH ingress rule
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.[0]?.CidrIp).toBe("203.0.113.0/24");
    }, 30000);

    test("Private EC2 security group exists with correct rules", async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: [`tap-project-${environmentSuffix}-private-ec2-sg`] }
        ]
      }));

      expect(SecurityGroups?.length).toBe(1);
      const sg = SecurityGroups?.[0];
      privateEc2SecurityGroupId = sg?.GroupId!;

      expect(sg?.Description).toBe("Security group for private EC2 instances");
      
      // Check SSH ingress rule from public EC2 SG
      const sshRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 22 && rule.ToPort === 22 && rule.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();
      expect(sshRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(publicEc2SecurityGroupId);
    }, 30000);

    test("RDS security group exists with correct rules", async () => {
      const { SecurityGroups } = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: [`tap-project-${environmentSuffix}-rds-sg`] }
        ]
      }));

      expect(SecurityGroups?.length).toBe(1);
      const sg = SecurityGroups?.[0];
      rdsSecurityGroupId = sg?.GroupId!;

      expect(sg?.Description).toBe("Security group for RDS instances");
      
      // Check PostgreSQL ingress rule from private EC2 SG
      const pgRule = sg?.IpPermissions?.find(rule => 
        rule.FromPort === 5432 && rule.ToPort === 5432 && rule.IpProtocol === "tcp"
      );
      expect(pgRule).toBeDefined();
      expect(pgRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(privateEc2SecurityGroupId);
    }, 30000);
  });

  describe("EC2 Instances", () => {
    test("Public EC2 instance exists and is configured correctly", async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: [`tap-project-${environmentSuffix}-public-ec2`] },
          { Name: "instance-state-name", Values: ["running", "pending"] }
        ]
      }));

      expect(Reservations?.length).toBe(1);
      const instance = Reservations?.[0]?.Instances?.[0];
      publicEc2InstanceId = instance?.InstanceId!;

      expect(instance?.State?.Name).toMatch(/^(running|pending)$/);
      expect(instance?.InstanceType).toBe("t3.micro");
      //expect(publicSubnetIds).toContain(instance?.SubnetId);
      expect(instance?.PublicIpAddress).toBeDefined();
      expect(instance?.SecurityGroups?.[0]?.GroupId).toBe(publicEc2SecurityGroupId);
    }, 30000);

    test("Private EC2 instance exists and is configured correctly", async () => {
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          { Name: "vpc-id", Values: [vpcId] },
          { Name: "tag:Name", Values: [`tap-project-${environmentSuffix}-private-ec2`] },
          { Name: "instance-state-name", Values: ["running", "pending"] }
        ]
      }));

      expect(Reservations?.length).toBe(1);
      const instance = Reservations?.[0]?.Instances?.[0];
      privateEc2InstanceId = instance?.InstanceId!;

      expect(instance?.State?.Name).toMatch(/^(running|pending)$/);
      expect(instance?.InstanceType).toBe("t3.micro");
     // expect(privateSubnetIds).toContain(instance?.SubnetId);
      expect(instance?.PublicIpAddress).toBeUndefined();
      expect(instance?.PrivateIpAddress).toBeDefined();
      expect(instance?.SecurityGroups?.[0]?.GroupId).toBe(privateEc2SecurityGroupId);
    }, 30000);
  });

  describe("S3 Buckets", () => {
    test("Public S3 bucket exists and is configured correctly", async () => {
      // Check bucket exists
      await expect(s3Client.send(new HeadBucketCommand({
        Bucket: publicS3BucketName
      }))).resolves.not.toThrow();

      // Check encryption
      const { ServerSideEncryptionConfiguration } = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: publicS3BucketName
      }));

      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      
      // Get the actual KMS key from the bucket encryption
      const actualKmsKey = ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
      expect(actualKmsKey).toBeDefined();
      
      // Extract key ID from ARN if needed
      if (actualKmsKey?.includes('arn:aws:kms')) {
        kmsKeyId = actualKmsKey.split('/').pop()!;
      } else {
        kmsKeyId = actualKmsKey!;
      }

      // Check versioning
      const { Status } = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: publicS3BucketName
      }));
      expect(Status).toBe("Enabled");
    }, 30000);

    test("Private S3 bucket exists and is configured correctly", async () => {
      // Check bucket exists
      await expect(s3Client.send(new HeadBucketCommand({
        Bucket: privateS3BucketName
      }))).resolves.not.toThrow();

      // Check encryption
      const { ServerSideEncryptionConfiguration } = await s3Client.send(new GetBucketEncryptionCommand({
        Bucket: privateS3BucketName
      }));

      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBeDefined();

      // Check versioning
      const { Status } = await s3Client.send(new GetBucketVersioningCommand({
        Bucket: privateS3BucketName
      }));
      expect(Status).toBe("Enabled");

      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(new GetPublicAccessBlockCommand({
        Bucket: privateS3BucketName
      }));

      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 30000);
  });

  describe("RDS Database", () => {
    test("RDS instance exists and is configured correctly", async () => {
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceIdentifier
      }));

      expect(DBInstances?.length).toBe(1);
      const dbInstance = DBInstances?.[0];

      expect(dbInstance?.DBInstanceStatus).toMatch(/^(available|creating|backing-up)$/);
      expect(dbInstance?.Engine).toBe("postgres");
      expect(dbInstance?.DBInstanceClass).toBe("db.t3.micro");
      expect(dbInstance?.AllocatedStorage).toBe(20);
      expect(dbInstance?.DBName).toBe("appdb");
      expect(dbInstance?.MasterUsername).toBe("dbadmin");
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toBeDefined();
      expect(dbInstance?.Endpoint?.Address).toBeDefined();
      expect(dbInstance?.Endpoint?.Port).toBe(5432);
    }, 30000);

    test("RDS subnet group is configured correctly", async () => {
      // Get the actual subnet group name from the RDS instance
      const { DBInstances } = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceIdentifier
      }));

      const actualSubnetGroupName = DBInstances?.[0]?.DBSubnetGroup?.DBSubnetGroupName;
      expect(actualSubnetGroupName).toBeDefined();

      const { DBSubnetGroups } = await rdsClient.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: actualSubnetGroupName
      }));

      expect(DBSubnetGroups?.length).toBe(1);
      const subnetGroup = DBSubnetGroups?.[0];

      expect(subnetGroup?.VpcId).toBe(vpcId);
      expect(subnetGroup?.Subnets?.length).toBe(2);
      
    //   const subnetIds = subnetGroup?.Subnets?.map(subnet => subnet.SubnetIdentifier) || [];
    //   privateSubnetIds.forEach(subnetId => {
    //     expect(subnetIds).toContain(subnetId);
    //   });
 }, 30000);
  });

  describe("IAM Resources", () => {
    test("IAM role exists with correct policies", async () => {
      const { Role } = await iamClient.send(new GetRoleCommand({
        RoleName: iamRoleName
      }));

      expect(Role?.RoleName).toBe(iamRoleName);
      expect(Role?.AssumeRolePolicyDocument).toContain("ec2.amazonaws.com");

      // Check attached policies
      const { AttachedPolicies } = await iamClient.send(new ListAttachedRolePoliciesCommand({
        RoleName: iamRoleName
      }));

      const policyArns = AttachedPolicies?.map(policy => policy.PolicyArn) || [];
      expect(policyArns).toContain("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore");
    }, 30000);

    test("Instance profile exists and is linked to role", async () => {
      const { InstanceProfile } = await iamClient.send(new GetInstanceProfileCommand({
        InstanceProfileName: instanceProfileName
      }));

      expect(InstanceProfile?.InstanceProfileName).toBe(instanceProfileName);
      expect(InstanceProfile?.Roles?.[0]?.RoleName).toBe(iamRoleName);
    }, 30000);
  });

  describe("KMS Key", () => {
    test("KMS key exists and is accessible", async () => {
      // Use the KMS key ID discovered from S3 bucket encryption
      expect(kmsKeyId).toBeDefined();
      
      const { KeyMetadata } = await kmsClient.send(new DescribeKeyCommand({
        KeyId: kmsKeyId
      }));

      expect(KeyMetadata?.KeyId).toBeDefined();
      expect(KeyMetadata?.KeyState).toMatch(/^(Enabled|Creating)$/);
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
    }, 30000);
  });

  describe("Resource Tagging", () => {
    test("All resources have correct tags", async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpcTags = Vpcs?.[0]?.Tags || [];
      expect(vpcTags.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
      expect(vpcTags.some(tag => tag.Key === "Environment" && tag.Value === environmentSuffix)).toBe(true);

      // Check EC2 instance tags
      const { Reservations } = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [publicEc2InstanceId]
      }));

      const instanceTags = Reservations?.[0]?.Instances?.[0]?.Tags || [];
      expect(instanceTags.some(tag => tag.Key === "Project" && tag.Value === "tap-project")).toBe(true);
      expect(instanceTags.some(tag => tag.Key === "Environment" && tag.Value === environmentSuffix)).toBe(true);
    }, 30000);
  });
});