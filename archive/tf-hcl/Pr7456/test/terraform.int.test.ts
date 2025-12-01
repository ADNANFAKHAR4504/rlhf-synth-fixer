import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient,
  ListRolePoliciesCommand
} from "@aws-sdk/client-iam";
import {
  DescribeKeyCommand,
  KMSClient
} from "@aws-sdk/client-kms";
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient
} from "@aws-sdk/client-rds";
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

const outputFile = path.resolve("cfn-outputs/flat-outputs.json");

// Validation helper functions
const isNonEmptyString = (v: any): boolean => typeof v === "string" && v.trim().length > 0;
const isValidArn = (v: string): boolean =>
  /^arn:aws:[^:]+:[^:]*:[^:]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(v.trim()) ||
  /^arn:aws:[^:]+:[^:]*:[0-9]*:[^:]*[a-zA-Z0-9/_\-]*$/.test(v.trim());
const isValidVpcId = (v: string): boolean => /^vpc-[a-f0-9]+$/.test(v);
const isValidSubnetId = (v: string): boolean => /^subnet-[a-f0-9]+$/.test(v);
const isValidSecurityGroupId = (v: string): boolean => /^sg-[a-f0-9]+$/.test(v);
const isValidInstanceId = (v: string): boolean => /^i-[a-f0-9]+$/.test(v);
const isValidCidr = (v: string): boolean => /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/.test(v);
const isValidKmsKeyId = (v: string): boolean => /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(v);
const isValidDnsName = (v: string): boolean => /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v) && !v.includes(" ");
const isValidIpAddress = (v: string): boolean => /^(\d{1,3}\.){3}\d{1,3}$/.test(v);

// Parsing helpers for JSON string outputs
const parseJsonString = (v: any): any => {
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return v;
    }
  }
  return v;
};

const parseArray = (v: any): any[] => {
  const parsed = parseJsonString(v);
  return Array.isArray(parsed) ? parsed : [];
};

const parseObject = (v: any): Record<string, any> => {
  const parsed = parseJsonString(v);
  return typeof parsed === "object" && parsed !== null ? parsed : {};
};

// Helper to skip tests when outputs are missing
const skipIfMissing = (key: string, obj: any): boolean => {
  if (!(key in obj) || obj[key] === undefined || obj[key] === null) {
    console.warn(`Skipping tests for missing output: ${key}`);
    return true;
  }
  return false;
};

describe("Multi-Environment Payment Platform Infrastructure - Integration Tests", () => {
  let outputs: Record<string, any>;
  let region: string;
  let ec2Client: EC2Client;
  let elbClient: ElasticLoadBalancingV2Client;
  let rdsClient: RDSClient;
  let s3Client: S3Client;
  let kmsClient: KMSClient;
  let iamClient: IAMClient;


  beforeAll(() => {
    if (!fs.existsSync(outputFile)) {
      throw new Error(`Output file not found: ${outputFile}. Ensure infrastructure is deployed.`);
    }

    const data = fs.readFileSync(outputFile, "utf8");
    outputs = JSON.parse(data);

    // Extract region from ARN outputs
    const arnOutput = Object.values(outputs).find((v: any) =>
      typeof v === "string" && v.startsWith("arn:aws:")
    ) as string;

    if (arnOutput) {
      region = arnOutput.split(":")[3];
    } else {
      throw new Error("Could not determine AWS region from outputs");
    }

    // Initialize AWS SDK clients
    ec2Client = new EC2Client({ region });
    elbClient = new ElasticLoadBalancingV2Client({ region });
    rdsClient = new RDSClient({ region });
    s3Client = new S3Client({ region });
    kmsClient = new KMSClient({ region });
    iamClient = new IAMClient({ region });
  });

  describe("Output Structure Validation", () => {
    test("should have all essential infrastructure outputs", () => {
      const requiredOutputs = [
        "rds_endpoint",
        "alb_dns_name",
        "s3_bucket_name",
        "environment_summary",
        "security_group_ids",
        "kms_key_arns"
      ];

      requiredOutputs.forEach(output => {
        expect(outputs).toHaveProperty(output);
        expect(outputs[output]).toBeDefined();
      });
    });

    test("should not expose sensitive information", () => {
      const sensitivePatterns = [
        /password/i, /secret/i, /private_key/i, /access_key/i,
        /session_token/i, /credentials/i
      ];

      const sensitiveKeys = Object.keys(outputs).filter(key =>
        sensitivePatterns.some(pattern => pattern.test(key))
      );

      expect(sensitiveKeys).toHaveLength(0);
    });

    test("should have valid environment summary structure", () => {
      if (skipIfMissing("environment_summary", outputs)) return;

      const summary = parseObject(outputs.environment_summary);
      expect(summary).toHaveProperty("environment");
      expect(summary).toHaveProperty("project_name");
      expect(summary).toHaveProperty("region");
      expect(summary).toHaveProperty("vpc_id");
      expect(summary).toHaveProperty("database_endpoint");
      expect(summary).toHaveProperty("alb_dns_name");
      expect(summary).toHaveProperty("s3_bucket_name");
    });
  });

  describe("VPC and Networking Infrastructure", () => {
    test("validates VPC configuration", async () => {
      const summary = parseObject(outputs.environment_summary);
      if (!summary.vpc_id) return;

      expect(isValidVpcId(summary.vpc_id)).toBe(true);

      const command = new DescribeVpcsCommand({
        VpcIds: [summary.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe("available");

      // Check VPC DNS attributes using DescribeVpcAttributeCommand
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsHostnames'
      });
      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsSupport'
      });

      const [dnsHostnamesResponse, dnsSupportResponse] = await Promise.all([
        ec2Client.send(dnsHostnamesCommand),
        ec2Client.send(dnsSupportCommand)
      ]);

      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);

      if (summary.vpc_cidr) {
        expect(isValidCidr(summary.vpc_cidr)).toBe(true);
        expect(vpc.CidrBlock).toBe(summary.vpc_cidr);
      }
    });

    test("validates subnet configuration", async () => {
      if (skipIfMissing("subnet_ids", outputs)) return;

      const subnetIds = parseObject(outputs.subnet_ids);
      expect(subnetIds).toHaveProperty("public_subnets");
      expect(subnetIds).toHaveProperty("private_subnets");
      expect(subnetIds).toHaveProperty("database_subnets");

      const allSubnets = [
        ...subnetIds.public_subnets,
        ...subnetIds.private_subnets,
        ...subnetIds.database_subnets
      ];

      allSubnets.forEach((id: string) => {
        expect(isValidSubnetId(id)).toBe(true);
      });

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnets
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(allSubnets.length);

      // Validate public subnets
      const publicSubnets = response.Subnets!.filter(subnet =>
        subnetIds.public_subnets.includes(subnet.SubnetId!)
      );
      publicSubnets.forEach(subnet => {
        expect(subnet.State).toBe("available");
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      // Validate private subnets
      const privateSubnets = response.Subnets!.filter(subnet =>
        subnetIds.private_subnets.includes(subnet.SubnetId!)
      );
      privateSubnets.forEach(subnet => {
        expect(subnet.State).toBe("available");
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });

      // Validate database subnets
      const dbSubnets = response.Subnets!.filter(subnet =>
        subnetIds.database_subnets.includes(subnet.SubnetId!)
      );
      expect(dbSubnets.length).toBeGreaterThanOrEqual(2);
      dbSubnets.forEach(subnet => {
        expect(subnet.State).toBe("available");
      });
    });

    test("validates NAT Gateway configuration", async () => {
      if (skipIfMissing("nat_gateway_ips", outputs)) return;

      const natIps = parseArray(outputs.nat_gateway_ips);
      expect(natIps.length).toBeGreaterThan(0);

      natIps.forEach((ip: string) => {
        expect(isValidIpAddress(ip)).toBe(true);
      });

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: "state",
            Values: ["available"]
          }
        ]
      });

      const response = await ec2Client.send(command);
      const deployedNatGateways = response.NatGateways?.filter(ng =>
        natIps.includes(ng.NatGatewayAddresses?.[0]?.PublicIp || "")
      );

      expect(deployedNatGateways?.length).toBe(natIps.length);
    });

    test("validates security groups configuration", async () => {
      if (skipIfMissing("security_group_ids", outputs)) return;

      const sgIds = parseObject(outputs.security_group_ids);
      expect(sgIds).toHaveProperty("alb_sg");
      expect(sgIds).toHaveProperty("application_sg");
      expect(sgIds).toHaveProperty("rds_sg");

      const allSgIds = Object.values(sgIds) as string[];
      allSgIds.forEach(id => {
        expect(isValidSecurityGroupId(id)).toBe(true);
      });

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: allSgIds
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(allSgIds.length);

      // Validate ALB security group rules
      const albSg = response.SecurityGroups!.find(sg => sg.GroupId === sgIds.alb_sg);
      expect(albSg).toBeDefined();

      const httpRule = albSg!.IpPermissions!.find(rule => rule.FromPort === 80);
      const httpsRule = albSg!.IpPermissions!.find(rule => rule.FromPort === 443);
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();

      // Validate RDS security group rules
      const rdsSg = response.SecurityGroups!.find(sg => sg.GroupId === sgIds.rds_sg);
      expect(rdsSg).toBeDefined();

      const postgresRule = rdsSg!.IpPermissions!.find(rule => rule.FromPort === 5432);
      expect(postgresRule).toBeDefined();
    });
  });

  describe("RDS Database Infrastructure", () => {
    test("validates RDS instance configuration", async () => {
      if (skipIfMissing("rds_identifier", outputs)) return;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.rds_identifier
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe("available");
      expect(dbInstance.Engine).toBe("postgres");
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.DeletionProtection).toBeDefined();
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    test("validates RDS endpoint accessibility", () => {
      if (skipIfMissing("rds_endpoint", outputs)) return;

      expect(isNonEmptyString(outputs.rds_endpoint)).toBe(true);
      expect(outputs.rds_endpoint).toContain(".rds.amazonaws.com:");
      expect(outputs.rds_endpoint).toContain(":5432");
    });

    test("validates RDS subnet group", async () => {
      if (skipIfMissing("rds_identifier", outputs)) return;

      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.rds_identifier
      });

      const dbResponse = await rdsClient.send(dbCommand);
      const dbInstance = dbResponse.DBInstances![0];

      expect(dbInstance.DBSubnetGroup).toBeDefined();

      const subnetCommand = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: dbInstance.DBSubnetGroup!.DBSubnetGroupName
      });

      const subnetResponse = await rdsClient.send(subnetCommand);
      expect(subnetResponse.DBSubnetGroups).toHaveLength(1);

      const subnetGroup = subnetResponse.DBSubnetGroups![0];
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Application Load Balancer Infrastructure", () => {
    test("validates ALB configuration", async () => {
      if (skipIfMissing("alb_arn", outputs)) return;

      expect(isValidArn(outputs.alb_arn)).toBe(true);

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.alb_arn]
      });

      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toHaveLength(1);

      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe("active");
      expect(alb.Type).toBe("application");
      expect(alb.Scheme).toBe("internet-facing");
      expect(alb.SecurityGroups!.length).toBeGreaterThan(0);
    });

    test("validates ALB DNS name", () => {
      if (skipIfMissing("alb_dns_name", outputs)) return;

      expect(isValidDnsName(outputs.alb_dns_name)).toBe(true);
      expect(outputs.alb_dns_name).toContain(".elb.amazonaws.com");
    });

    test("validates target group configuration", async () => {
      if (skipIfMissing("alb_arn", outputs)) return;

      const listenersCommand = new DescribeListenersCommand({
        LoadBalancerArn: outputs.alb_arn
      });

      const listenersResponse = await elbClient.send(listenersCommand);
      expect(listenersResponse.Listeners!.length).toBeGreaterThan(0);

      const listener = listenersResponse.Listeners![0];
      expect(listener.Port).toBe(80);
      expect(listener.Protocol).toBe("HTTP");

      const targetGroupArn = listener.DefaultActions![0].TargetGroupArn;
      expect(targetGroupArn).toBeDefined();

      const tgCommand = new DescribeTargetGroupsCommand({
        TargetGroupArns: [targetGroupArn!]
      });

      const tgResponse = await elbClient.send(tgCommand);
      const targetGroup = tgResponse.TargetGroups![0];

      expect(targetGroup.Port).toBe(8080);
      expect(targetGroup.Protocol).toBe("HTTP");
      expect(targetGroup.HealthCheckPath).toBe("/health");
    });
  });

  describe("S3 Storage Infrastructure", () => {
    test("validates S3 bucket existence and accessibility", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const command = new HeadBucketCommand({
        Bucket: outputs.s3_bucket_name
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test("validates S3 bucket versioning", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe("Enabled");
    });

    test("validates S3 bucket encryption", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();

      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe("aws:kms");
      expect(rule.ApplyServerSideEncryptionByDefault!.KMSMasterKeyID).toBeDefined();
    });

    test("validates S3 bucket public access block", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration!.RestrictPublicBuckets).toBe(true);
    });

    test("validates S3 bucket lifecycle configuration", async () => {
      if (skipIfMissing("s3_bucket_name", outputs)) return;

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.s3_bucket_name
      });

      const response = await s3Client.send(command);
      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const rule = response.Rules![0];
      expect(rule.Status).toBe("Enabled");
      expect(rule.Transitions).toBeDefined();
      expect(rule.Transitions!.length).toBeGreaterThan(0);

      // Check for proper storage class transitions
      const storageClasses = rule.Transitions!.map(t => t.StorageClass);
      expect(storageClasses).toContain("STANDARD_IA");
      expect(storageClasses).toContain("GLACIER");
      expect(storageClasses).toContain("DEEP_ARCHIVE");
    });
  });

  describe("KMS Encryption Infrastructure", () => {
    test("validates KMS key configuration", async () => {
      if (skipIfMissing("kms_key_arns", outputs)) return;

      const kmsKeys = parseObject(outputs.kms_key_arns);
      expect(kmsKeys).toHaveProperty("rds_kms_key");
      expect(kmsKeys).toHaveProperty("s3_kms_key");

      const keyArns = Object.values(kmsKeys) as string[];

      for (const keyArn of keyArns) {
        expect(isValidArn(keyArn)).toBe(true);

        const keyId = keyArn.split("/").pop();
        const command = new DescribeKeyCommand({
          KeyId: keyId
        });

        const response = await kmsClient.send(command);
        expect(response.KeyMetadata!.KeyState).toBe("Enabled");
        expect(response.KeyMetadata!.KeyUsage).toBe("ENCRYPT_DECRYPT");
        expect(response.KeyMetadata!.Origin).toBe("AWS_KMS");
      }
    });
  });

  describe("IAM Resources", () => {
    test("validates IAM role configuration", async () => {
      if (skipIfMissing("iam_role_arn", outputs)) return;

      expect(isValidArn(outputs.iam_role_arn)).toBe(true);

      const roleName = outputs.iam_role_arn.split("/").pop();
      const command = new GetRoleCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();

      // Check assume role policy for EC2
      const assumePolicy = JSON.parse(decodeURIComponent(response.Role!.AssumeRolePolicyDocument!));
      const ec2Statement = assumePolicy.Statement.find((stmt: any) =>
        stmt.Principal?.Service?.includes("ec2.amazonaws.com")
      );
      expect(ec2Statement).toBeDefined();
    });

    test("validates IAM instance profile", async () => {
      if (skipIfMissing("instance_profile_name", outputs)) return;

      const command = new GetInstanceProfileCommand({
        InstanceProfileName: outputs.instance_profile_name
      });

      const response = await iamClient.send(command);
      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile!.Roles.length).toBeGreaterThan(0);
    });

    test("validates IAM role policies", async () => {
      if (skipIfMissing("iam_role_arn", outputs)) return;

      const roleName = outputs.iam_role_arn.split("/").pop();
      const command = new ListRolePoliciesCommand({
        RoleName: roleName
      });

      const response = await iamClient.send(command);
      expect(response.PolicyNames).toBeDefined();

      // Should have S3 access policy
      const s3Policy = response.PolicyNames!.find(name =>
        name.toLowerCase().includes("s3")
      );
      expect(s3Policy).toBeDefined();
    });
  });

  describe("Environment-Specific Configuration", () => {
    test("validates environment-specific settings", () => {
      const summary = parseObject(outputs.environment_summary);

      expect(["dev", "staging", "prod"]).toContain(summary.environment);
      expect(summary.project_name).toBe("payment-platform");
      expect(isNonEmptyString(summary.region)).toBe(true);

      // Validate region matches environment expectations
      const expectedRegions = {
        "dev": "eu-west-1",
        "staging": "us-west-2",
        "prod": "us-east-1"
      };

      if (summary.environment in expectedRegions) {
        expect(summary.region).toBe(expectedRegions[summary.environment as keyof typeof expectedRegions]);
      }
    });

    test("validates resource naming convention", () => {
      const summary = parseObject(outputs.environment_summary);
      const expectedPrefix = `${summary.environment}-${summary.project_name}`;

      expect(outputs.s3_bucket_name).toContain(expectedPrefix);

      if (outputs.rds_identifier) {
        expect(outputs.rds_identifier).toContain(expectedPrefix);
      }
    });

    test("validates backup retention based on environment", async () => {
      if (skipIfMissing("rds_identifier", outputs)) return;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.rds_identifier
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];
      const summary = parseObject(outputs.environment_summary);

      // Expected retention periods per environment
      const expectedRetention = {
        "dev": 7,
        "staging": 14,
        "prod": 30
      };

      if (summary.environment in expectedRetention) {
        expect(dbInstance.BackupRetentionPeriod).toBe(
          expectedRetention[summary.environment as keyof typeof expectedRetention]
        );
      }
    });
  });

  describe("Security and Compliance", () => {
    test("validates encryption at rest", async () => {
      if (skipIfMissing("rds_identifier", outputs)) return;

      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.rds_identifier
      });

      const rdsResponse = await rdsClient.send(rdsCommand);
      const dbInstance = rdsResponse.DBInstances![0];

      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.KmsKeyId).toBeDefined();

      // S3 encryption already validated in S3 tests
    });

    test("validates network security", async () => {
      if (skipIfMissing("security_group_ids", outputs)) return;

      const sgIds = parseObject(outputs.security_group_ids);
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: Object.values(sgIds) as string[]
      });

      const response = await ec2Client.send(command);

      // RDS security group should only allow access from application security group
      const rdsSg = response.SecurityGroups!.find(sg => sg.GroupId === sgIds.rds_sg);
      const rdsIngressRules = rdsSg!.IpPermissions!.filter(rule => rule.FromPort === 5432);

      rdsIngressRules.forEach(rule => {
        const hasApplicationSgAccess = rule.UserIdGroupPairs!.some(pair =>
          pair.GroupId === sgIds.application_sg
        );
        expect(hasApplicationSgAccess).toBe(true);
      });
    });

    test("validates deletion protection for production", async () => {
      const summary = parseObject(outputs.environment_summary);

      if (summary.environment === "prod") {
        if (outputs.rds_identifier) {
          const rdsCommand = new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.rds_identifier
          });

          const rdsResponse = await rdsClient.send(rdsCommand);
          const dbInstance = rdsResponse.DBInstances![0];
          expect(dbInstance.DeletionProtection).toBe(true);
        }

        if (outputs.alb_arn) {
          const albCommand = new DescribeLoadBalancersCommand({
            LoadBalancerArns: [outputs.alb_arn]
          });

          const albResponse = await elbClient.send(albCommand);
          const alb = albResponse.LoadBalancers![0];

          const deletionProtection = alb.Attributes!.find(attr =>
            attr.Key === "deletion_protection.enabled"
          );
          expect(deletionProtection?.Value).toBe("true");
        }
      }
    });
  });
});