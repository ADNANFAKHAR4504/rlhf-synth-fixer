import {
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

/* ----------------------------- Utilities ----------------------------- */

type TerraformOutput = {
  sensitive: boolean;
  type: string;
  value: any;
};

type TerraformOutputs = {
  vpc_id?: TerraformOutput;
  public_subnet_ids?: TerraformOutput;
  private_subnet_ids?: TerraformOutput;
  ec2_instance_id?: TerraformOutput;
  ec2_public_ip?: TerraformOutput;
  ec2_public_dns?: TerraformOutput;
  rds_endpoint?: TerraformOutput;
  rds_port?: TerraformOutput;
  s3_bucket_name?: TerraformOutput;
  private_key_pem?: TerraformOutput;
};

function readTerraformOutputs(): TerraformOutputs {
  // Try multiple possible locations for outputs
  const possiblePaths = [
    path.resolve(process.cwd(), "terraform.tfstate"),
    path.resolve(process.cwd(), "lib/terraform.tfstate"),
    path.resolve(process.cwd(), "outputs.json"),
    path.resolve(process.cwd(), "cfn-outputs/all-outputs.json"),
  ];

  for (const outputPath of possiblePaths) {
    if (fs.existsSync(outputPath)) {
      try {
        const content = fs.readFileSync(outputPath, "utf8");
        if (outputPath.endsWith(".tfstate")) {
          const state = JSON.parse(content);
          // Extract outputs from Terraform state
          return state.outputs || {};
        } else {
          // Assume JSON outputs format
          return JSON.parse(content);
        }
      } catch (error) {
        console.warn(`Failed to parse outputs from ${outputPath}:`, error);
      }
    }
  }

  throw new Error(
    `No Terraform outputs found. Looked in: ${possiblePaths.join(", ")}. ` +
    `Run 'terraform output -json > outputs.json' first, or ensure terraform.tfstate exists.`
  );
}

async function retry<T>(fn: () => Promise<T>, attempts = 5, baseMs = 1000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(2, i) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

function assertDefined<T>(v: T | undefined | null, msg: string): T {
  if (v === undefined || v === null) throw new Error(msg);
  return v;
}

/* ----------------------------- Tests ----------------------------- */

describe("LIVE: Terraform-provisioned foundational infrastructure", () => {
  const TEST_TIMEOUT = 120_000; // 120s per test
  let outputs: TerraformOutputs;
  let ec2Client: EC2Client;
  let rdsClient: RDSClient;
  let s3Client: S3Client;
  let region: string;

  beforeAll(async () => {
    // Skip integration tests if running in CI without proper setup
    if (process.env.CI && !process.env.RUN_INTEGRATION_TESTS) {
      console.log("Skipping integration tests in CI environment");
      return;
    }

    try {
      outputs = readTerraformOutputs();
      console.info("Loaded Terraform outputs successfully");
      
      // Use AWS_REGION from environment or default to us-east-2
      region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-2";
      
      ec2Client = new EC2Client({ region });
      rdsClient = new RDSClient({ region });
      s3Client = new S3Client({ region });
      
      console.info(`Using AWS region: ${region}`);
    } catch (error) {
      console.error("Failed to setup integration tests:", error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      ec2Client?.destroy();
      rdsClient?.destroy();
      s3Client?.destroy();
    } catch (error) {
      console.warn("Error destroying clients:", error);
    }
  });

  test(
    "VPC exists and has proper configuration",
    async () => {
      if (process.env.CI && !process.env.RUN_INTEGRATION_TESTS) {
        expect(true).toBe(true);
        return;
      }

      const vpcId = outputs.vpc_id?.value;
      expect(vpcId).toBeDefined();

      const vpcRes = await retry(() =>
        ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }))
      );

      const vpc = vpcRes.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.State).toBe("available");
    },
    TEST_TIMEOUT
  );

  test(
    "Public and private subnets exist in different AZs",
    async () => {
      if (process.env.CI && !process.env.RUN_INTEGRATION_TESTS) {
        expect(true).toBe(true);
        return;
      }

      const publicSubnetIds = outputs.public_subnet_ids?.value || [];
      const privateSubnetIds = outputs.private_subnet_ids?.value || [];

      expect(publicSubnetIds.length).toBe(2);
      expect(privateSubnetIds.length).toBe(2);

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const subnetsRes = await retry(() =>
        ec2Client.send(new DescribeSubnetsCommand({ SubnetIds: allSubnetIds }))
      );

      const subnets = subnetsRes.Subnets || [];
      expect(subnets.length).toBe(4);

      // Check public subnets have map_public_ip_on_launch enabled
      const publicSubnets = subnets.filter(s => publicSubnetIds.includes(s.SubnetId!));
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      // Check private subnets don't have map_public_ip_on_launch enabled
      const privateSubnets = subnets.filter(s => privateSubnetIds.includes(s.SubnetId!));
      privateSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });

      // Ensure subnets are in different availability zones
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThan(1);
    },
    TEST_TIMEOUT
  );

  test(
    "EC2 instance exists and is properly configured",
    async () => {
      if (process.env.CI && !process.env.RUN_INTEGRATION_TESTS) {
        expect(true).toBe(true);
        return;
      }

      const instanceId = outputs.ec2_instance_id?.value;
      const publicIp = outputs.ec2_public_ip?.value;

      expect(instanceId).toBeDefined();
      expect(publicIp).toBeDefined();

      const instanceRes = await retry(() =>
        ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }))
      );

      const instances = instanceRes.Reservations?.flatMap(r => r.Instances || []) || [];
      expect(instances.length).toBe(1);

      const instance = instances[0];
      expect(instance.State?.Name).toMatch(/running|pending|stopping|stopped/);
      expect(instance.InstanceType).toBe("t3.micro");
      expect(instance.PublicIpAddress).toBe(publicIp);

      // Check that instance has proper tags
      const tags = instance.Tags || [];
      const nameTag = tags.find(t => t.Key === "Name");
      const envTag = tags.find(t => t.Key === "Environment");
      expect(nameTag?.Value).toMatch(/foundational-env/);
      expect(envTag?.Value).toBe("dev");
    },
    TEST_TIMEOUT
  );

  test(
    "RDS MySQL instance exists and is properly configured",
    async () => {
      if (process.env.CI && !process.env.RUN_INTEGRATION_TESTS) {
        expect(true).toBe(true);
        return;
      }

      const rdsEndpoint = outputs.rds_endpoint?.value;
      const rdsPort = outputs.rds_port?.value;

      expect(rdsEndpoint).toBeDefined();
      expect(rdsPort).toBe(3306);

      // Extract DB identifier from endpoint
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const dbRes = await retry(() =>
        rdsClient.send(new DescribeDBInstancesCommand({ 
          DBInstanceIdentifier: dbIdentifier 
        }))
      );

      const dbInstance = dbRes.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.Engine).toBe("mysql");
      expect(dbInstance?.EngineVersion).toMatch(/^8\.0/);
      expect(dbInstance?.DBInstanceClass).toBe("db.t3.micro");
      expect(dbInstance?.AllocatedStorage).toBe(20);
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.PubliclyAccessible).toBe(false);
    },
    TEST_TIMEOUT
  );

  test(
    "S3 bucket for Terraform state exists and is secure",
    async () => {
      if (process.env.CI && !process.env.RUN_INTEGRATION_TESTS) {
        expect(true).toBe(true);
        return;
      }

      const bucketName = outputs.s3_bucket_name?.value;
      expect(bucketName).toBeDefined();

      // Check if bucket exists
      await retry(() =>
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      );

      // If we reach here, bucket exists and we have access
      expect(true).toBe(true);
    },
    TEST_TIMEOUT
  );

  test(
    "Internet Gateway exists and is attached to VPC",
    async () => {
      if (process.env.CI && !process.env.RUN_INTEGRATION_TESTS) {
        expect(true).toBe(true);
        return;
      }

      const vpcId = outputs.vpc_id?.value;
      
      const igwRes = await retry(() =>
        ec2Client.send(new DescribeInternetGatewaysCommand({
          Filters: [{ Name: "attachment.vpc-id", Values: [vpcId] }]
        }))
      );

      const igws = igwRes.InternetGateways || [];
      expect(igws.length).toBeGreaterThan(0);

      const igw = igws[0];
      const attachment = igw.Attachments?.find(a => a.VpcId === vpcId);
      expect(attachment?.State).toBe("available");
    },
    TEST_TIMEOUT
  );

  test(
    "Security groups have proper ingress and egress rules",
    async () => {
      if (process.env.CI && !process.env.RUN_INTEGRATION_TESTS) {
        expect(true).toBe(true);
        return;
      }

      const vpcId = outputs.vpc_id?.value;
      
      const sgRes = await retry(() =>
        ec2Client.send(new DescribeSecurityGroupsCommand({
          Filters: [{ Name: "vpc-id", Values: [vpcId] }]
        }))
      );

      const securityGroups = sgRes.SecurityGroups || [];
      expect(securityGroups.length).toBeGreaterThan(2); // At least EC2 SG, RDS SG, and default

      // Find EC2 security group
      const ec2Sg = securityGroups.find(sg => 
        sg.GroupName?.includes("ec2") || sg.Description?.includes("EC2")
      );
      expect(ec2Sg).toBeDefined();

      // Check SSH ingress rule exists
      const sshRule = ec2Sg?.IpPermissions?.find(p => 
        p.FromPort === 22 && p.ToPort === 22 && p.IpProtocol === "tcp"
      );
      expect(sshRule).toBeDefined();

      // Find RDS security group  
      const rdsSg = securityGroups.find(sg => 
        sg.GroupName?.includes("rds") || sg.Description?.includes("RDS")
      );
      expect(rdsSg).toBeDefined();

      // Check MySQL ingress rule exists
      const mysqlRule = rdsSg?.IpPermissions?.find(p => 
        p.FromPort === 3306 && p.ToPort === 3306 && p.IpProtocol === "tcp"
      );
      expect(mysqlRule).toBeDefined();
    },
    TEST_TIMEOUT
  );

  test(
    "Private key PEM has RSA header/footer when generated (or appropriate message when using existing key)",
    () => {
      if (process.env.CI && !process.env.RUN_INTEGRATION_TESTS) {
        expect(true).toBe(true);
        return;
      }

      const privateKeyPem = outputs.private_key_pem?.value;
      expect(privateKeyPem).toBeDefined();
      
      if (privateKeyPem.startsWith("-----BEGIN RSA PRIVATE KEY-----")) {
        // Generated key case
        expect(privateKeyPem.trim().endsWith("-----END RSA PRIVATE KEY-----")).toBe(true);
        expect(Buffer.from(privateKeyPem, "utf8").length).toBeGreaterThan(1200);
      } else {
        // Existing key case
        expect(privateKeyPem).toBe("Using existing SSH key - private key not available");
      }
    },
    10_000
  );
});
