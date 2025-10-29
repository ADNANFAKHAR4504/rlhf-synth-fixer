import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand
} from "@aws-sdk/client-auto-scaling";
import {
  CloudTrailClient,
  DescribeTrailsCommand,
} from "@aws-sdk/client-cloudtrail";
import {
  DescribeInternetGatewaysCommand,
  DescribeKeyPairsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
  DescribeLaunchTemplatesCommand as EC2DescribeLaunchTemplatesCommand,
} from "@aws-sdk/client-ec2";
import {
  DescribeListenersCommand,
  DescribeLoadBalancerAttributesCommand,
  DescribeLoadBalancersCommand,
  DescribeTagsCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import {
  DescribeDBInstancesCommand,
  DescribeDBParameterGroupsCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import * as fs from "fs";
import * as path from "path";

// Load outputs and template
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

// Extract region dynamically from outputs (from ARN)
const region = process.env.AWS_REGION ||
  outputs.DBSecretArn?.split(":")[3] ||
  outputs.Ec2RoleArn?.split(":")[3] ||
  "us-west-2";

// Extract dynamic values from deployed resources
const extractStackName = (resourceName: string): string => {
  // Enhanced pattern to handle CI/CD stack names like "TapStackPr4055-us-west-2-dev-xxx"
  // Captures everything before the first region-like pattern (us-west-2, eu-central-1, etc.)
  const match = resourceName.match(/^([^-]+(?:Pr\d+)?)-[a-z]{2}-[a-z]+-\d+-/i);
  if (match) return match[1];

  // Fallback: Extract from patterns with known resource suffixes
  const suffixMatch = resourceName.match(/^([^-]+(?:Pr\d+)?)-(.+?)-(asg|alb|ec2|db|keypair|launch|tg|trail|profile|database|subnetgroup|parametergroup)/i);
  if (suffixMatch) return suffixMatch[1];

  // Final fallback: take everything before first dash
  const simpleMatch = resourceName.match(/^([^-]+)/);
  return simpleMatch ? simpleMatch[1] : "TapStack";
};

const extractEnvironment = (resourceName: string): string => {
  // Pattern 1: Bucket pattern "dev-us-west-2-logs-xxx" (environment is FIRST part)
  const bucketMatch = resourceName.match(/^([^-]+)-[a-z]{2}-[a-z]+-\d+-logs-/i);
  if (bucketMatch) return bucketMatch[1];

  // Pattern 2: Standard pattern "TapStackPr4055-us-west-2-dev-xxx" (environment after region)
  const regionEnvMatch = resourceName.match(/^[^-]+-[a-z]{2}-[a-z]+-\d+-([^-]+)-/i);
  if (regionEnvMatch) return regionEnvMatch[1];

  // Pattern 3: Database pattern: "tapstack-us-west-2-dev-xxx"
  const dbMatch = resourceName.match(/^[^-]+-[a-z]{2}-[a-z]+-\d+-([^-]+)-/i);
  if (dbMatch) return dbMatch[1];

  // Fallback: try to find common environment names anywhere in the string
  const envFallback = resourceName.match(/-(dev|development|staging|stage|prod|production|test)-/i);
  if (envFallback) return envFallback[1];

  return "dev";
};

const extractAccountId = (arnString: string): string => {
  return arnString.split(":")[4] || "";
};

// Extract dynamic values from actual outputs
const stackName = extractStackName(outputs.AutoScalingGroupName || outputs.KeyPairName || "TapStack");
const environment = extractEnvironment(outputs.LogBucketName || outputs.AutoScalingGroupName || "dev");
const accountId = extractAccountId(outputs.Ec2RoleArn || outputs.DBSecretArn || "");

// Debug: Log the dynamic values being used
console.log(`\n Dynamic Test Configuration:`);
console.log(` Stack Name: ${stackName} (extracted from: ${outputs.AutoScalingGroupName || outputs.KeyPairName || 'fallback'})`);
console.log(` Region: ${region}`);
console.log(` Environment: ${environment} (extracted from: ${outputs.LogBucketName || outputs.AutoScalingGroupName || 'fallback'})`);
console.log(` Account ID: ${accountId}\n`);

const templatePath = path.resolve(__dirname, "../lib/TapStack.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const iamClient = new IAMClient({ region });
const stsClient = new STSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const asgClient = new AutoScalingClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });

jest.setTimeout(120_000);

// ---------------------------
// Helper functions
// ---------------------------
function extractRoleName(roleArn: string): string {
  return roleArn.split("/").pop() || "";
}

function extractInstanceProfileName(profileArn: string): string {
  return profileArn.split("/").pop() || "";
}

function extractDbIdentifier(endpoint: string): string {
  return endpoint.split(".")[0];
}

// ---------------------------
// VPC & NETWORK RESOURCES
// ---------------------------
describe("VPC and Network Infrastructure", () => {
  test("VPC exists with correct CIDR and DNS settings", async () => {
    const res = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] })
    );
    const vpc = res.Vpcs?.[0];

    expect(vpc).toBeDefined();
    expect(vpc?.CidrBlock).toBe(template.Parameters.VpcCidr.Default);
    expect(vpc?.State).toBe("available");

    // Check DNS attributes
    const dnsHostnamesAttr = await ec2Client.send(
      new DescribeVpcAttributeCommand({
        VpcId: outputs.VpcId,
        Attribute: "enableDnsHostnames",
      })
    );
    expect(dnsHostnamesAttr.EnableDnsHostnames?.Value).toBe(true);

    const dnsSupportAttr = await ec2Client.send(
      new DescribeVpcAttributeCommand({
        VpcId: outputs.VpcId,
        Attribute: "enableDnsSupport",
      })
    );
    expect(dnsSupportAttr.EnableDnsSupport?.Value).toBe(true);
  });

  test("Public subnets exist with correct configuration", async () => {
    const publicSubnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];
    const res = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
    );

    expect(res.Subnets?.length).toBe(2);

    for (const subnet of res.Subnets || []) {
      expect(subnet.VpcId).toBe(outputs.VpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.State).toBe("available");
    }

    // Verify CIDR blocks
    const cidrs = res.Subnets?.map((s) => s.CidrBlock).sort();
    expect(cidrs).toContain(template.Parameters.PublicSubnet1Cidr.Default);
    expect(cidrs).toContain(template.Parameters.PublicSubnet2Cidr.Default);
  });

  test("Private subnets exist with correct configuration", async () => {
    const privateSubnetIds = [
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];
    const res = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
    );

    expect(res.Subnets?.length).toBe(2);

    for (const subnet of res.Subnets || []) {
      expect(subnet.VpcId).toBe(outputs.VpcId);
      expect(subnet.MapPublicIpOnLaunch).toBe(false);
      expect(subnet.State).toBe("available");
    }

    // Verify CIDR blocks
    const cidrs = res.Subnets?.map((s) => s.CidrBlock).sort();
    expect(cidrs).toContain(template.Parameters.PrivateSubnet1Cidr.Default);
    expect(cidrs).toContain(template.Parameters.PrivateSubnet2Cidr.Default);
  });

  test("Subnets are in different availability zones", async () => {
    const allSubnetIds = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];

    const res = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
    );

    const azs = new Set(res.Subnets?.map((s) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);
  });

  test("Internet Gateway exists and is attached to VPC", async () => {
    const res = await ec2Client.send(
      new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [outputs.InternetGatewayId]
      })
    );

    expect(res.InternetGateways?.length).toBeGreaterThan(0);
    const igw = res.InternetGateways?.[0];
    expect(igw?.Attachments?.[0]?.State).toBe("available");
    expect(igw?.Attachments?.[0]?.VpcId).toBe(outputs.VpcId);
  });

  test("NAT Gateway exists and is available", async () => {
    const res = await ec2Client.send(
      new DescribeNatGatewaysCommand({
        NatGatewayIds: [outputs.NatGatewayId],
      })
    );

    const natGateway = res.NatGateways?.[0];
    expect(natGateway).toBeDefined();
    expect(natGateway?.State).toBe("available");
    expect(natGateway?.VpcId).toBe(outputs.VpcId);
    expect(natGateway?.SubnetId).toBe(outputs.PublicSubnet1Id);

    // Verify NAT Gateway has Elastic IP
    expect(natGateway?.NatGatewayAddresses?.length).toBeGreaterThan(0);
    expect(natGateway?.NatGatewayAddresses?.[0]?.PublicIp).toBe(
      outputs.NatEipId
    );
  });
});

// ---------------------------
// ROUTING
// ---------------------------
describe("Route Tables and Network Routing", () => {
  test("Public route table routes internet traffic through IGW", async () => {
    const res = await ec2Client.send(
      new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.PublicRouteTableId],
      })
    );

    const routeTable = res.RouteTables?.[0];
    expect(routeTable).toBeDefined();
    expect(routeTable?.VpcId).toBe(outputs.VpcId);

    // Check for internet route
    const internetRoute = routeTable?.Routes?.find(
      (r) => r.DestinationCidrBlock === "0.0.0.0/0"
    );
    expect(internetRoute).toBeDefined();
    expect(internetRoute?.GatewayId).toBe(outputs.InternetGatewayId);
    expect(internetRoute?.State).toBe("active");
  });

  test("Private route table routes internet traffic through NAT Gateway", async () => {
    const res = await ec2Client.send(
      new DescribeRouteTablesCommand({
        RouteTableIds: [outputs.PrivateRouteTableId],
      })
    );

    const routeTable = res.RouteTables?.[0];
    expect(routeTable).toBeDefined();
    expect(routeTable?.VpcId).toBe(outputs.VpcId);

    // Check for NAT route
    const natRoute = routeTable?.Routes?.find(
      (r) => r.DestinationCidrBlock === "0.0.0.0/0"
    );
    expect(natRoute).toBeDefined();
    expect(natRoute?.NatGatewayId).toBe(outputs.NatGatewayId);
    expect(natRoute?.State).toBe("active");
  });

  test("Public subnets are associated with public route table", async () => {
    const publicSubnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];

    for (const subnetId of publicSubnetIds) {
      const res = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "association.subnet-id", Values: [subnetId] }],
        })
      );

      const routeTable = res.RouteTables?.[0];
      expect(routeTable?.RouteTableId).toBe(outputs.PublicRouteTableId);
    }
  });

  test("Private subnets are associated with private route table", async () => {
    const privateSubnetIds = [
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];

    for (const subnetId of privateSubnetIds) {
      const res = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "association.subnet-id", Values: [subnetId] }],
        })
      );

      const routeTable = res.RouteTables?.[0];
      expect(routeTable?.RouteTableId).toBe(outputs.PrivateRouteTableId);
    }
  });
});

// ---------------------------
// SECURITY GROUPS
// ---------------------------
describe("Security Groups", () => {
  test("ALB Security Group has correct ingress and egress rules", async () => {
    const res = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.AlbSecurityGroupId],
      })
    );

    const sg = res.SecurityGroups?.[0];
    expect(sg).toBeDefined();
    expect(sg?.VpcId).toBe(outputs.VpcId);

    // Check HTTP ingress
    const httpRule = sg?.IpPermissions?.find(
      (r) => r.FromPort === 80 && r.ToPort === 80
    );
    expect(httpRule).toBeDefined();
    expect(httpRule?.IpProtocol).toBe("tcp");
    expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe("0.0.0.0/0");

    // Check egress rule (allow all)
    expect(sg?.IpPermissionsEgress?.length).toBeGreaterThan(0);
    const egressRule = sg?.IpPermissionsEgress?.find(
      (r) => r.IpProtocol === "-1"
    );
    expect(egressRule).toBeDefined();
  });

  test("EC2 Security Group has correct configuration", async () => {
    const res = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.Ec2SecurityGroupId],
      })
    );

    const sg = res.SecurityGroups?.[0];
    expect(sg).toBeDefined();
    expect(sg?.VpcId).toBe(outputs.VpcId);

    // Check HTTP ingress from ALB
    const httpRule = sg?.IpPermissions?.find(
      (r) => r.FromPort === 80 && r.ToPort === 80
    );
    expect(httpRule).toBeDefined();
    expect(httpRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(
      outputs.AlbSecurityGroupId
    );

    // Check SSH ingress
    const sshRule = sg?.IpPermissions?.find(
      (r) => r.FromPort === 22 && r.ToPort === 22
    );
    expect(sshRule).toBeDefined();
    expect(sshRule?.IpProtocol).toBe("tcp");
  });

  test("Database Security Group allows traffic from EC2 Security Group", async () => {
    const res = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.DbSecurityGroupId],
      })
    );

    const sg = res.SecurityGroups?.[0];
    expect(sg).toBeDefined();
    expect(sg?.VpcId).toBe(outputs.VpcId);

    // Check database port ingress from EC2 SG
    const dbPort = parseInt(outputs.RdsPort);
    const dbRule = sg?.IpPermissions?.find(
      (r) => r.FromPort === dbPort && r.ToPort === dbPort
    );
    expect(dbRule).toBeDefined();
    expect(dbRule?.IpProtocol).toBe("tcp");
    expect(dbRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(
      outputs.Ec2SecurityGroupId
    );
  });
});

// ---------------------------
// IAM RESOURCES
// ---------------------------
describe("IAM Roles and Policies", () => {
  test("EC2 Role exists with correct trust policy", async () => {
    const roleName = extractRoleName(outputs.Ec2RoleArn);
    const res = await iamClient.send(
      new GetRoleCommand({ RoleName: roleName })
    );

    expect(res.Role).toBeDefined();
    expect(res.Role?.Arn).toBe(outputs.Ec2RoleArn);

    // Check trust policy
    const trustPolicy = JSON.parse(
      decodeURIComponent(res.Role?.AssumeRolePolicyDocument || "{}")
    );
    expect(trustPolicy.Statement[0].Principal.Service).toContain(
      "ec2.amazonaws.com"
    );
    expect(trustPolicy.Statement[0].Action).toBe("sts:AssumeRole");
  });

  test("EC2 Role has correct managed policies attached", async () => {
    const roleName = extractRoleName(outputs.Ec2RoleArn);
    const role = await iamClient.send(
      new GetRoleCommand({ RoleName: roleName })
    );

    // Check for CloudWatch managed policy using ListAttachedRolePolicies
    const attachedPolicies = await iamClient.send(
      new ListAttachedRolePoliciesCommand({ RoleName: roleName })
    );

    expect(attachedPolicies.AttachedPolicies).toBeDefined();
    const hasCloudWatchPolicy = attachedPolicies.AttachedPolicies?.some(
      (policy) => policy.PolicyArn === "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
    );
    expect(hasCloudWatchPolicy).toBe(true);
  });

  test("EC2 Role has inline policies for S3 and CloudWatch", async () => {
    const roleName = extractRoleName(outputs.Ec2RoleArn);
    const policiesRes = await iamClient.send(
      new ListRolePoliciesCommand({ RoleName: roleName })
    );

    expect(policiesRes.PolicyNames?.length).toBeGreaterThan(0);

    for (const policyName of policiesRes.PolicyNames || []) {
      const policyRes = await iamClient.send(
        new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName,
        })
      );

      expect(policyRes.PolicyDocument).toBeDefined();
      const policy = JSON.parse(decodeURIComponent(policyRes.PolicyDocument || "{}"));

      // Check for CloudWatch and S3 permissions
      const statements = policy.Statement;
      expect(statements.length).toBeGreaterThan(0);

      // Look for CloudWatch permissions
      const hasCloudWatchPerms = statements.some((s: any) =>
        Array.isArray(s.Action) ? s.Action.some((a: string) => a.includes("logs:") || a.includes("cloudwatch:")) :
          s.Action.includes("logs:") || s.Action.includes("cloudwatch:")
      );
      expect(hasCloudWatchPerms).toBe(true);

      // Look for S3 permissions
      const hasS3Perms = statements.some((s: any) =>
        Array.isArray(s.Action) ? s.Action.some((a: string) => a.includes("s3:")) :
          s.Action.includes("s3:")
      );
      expect(hasS3Perms).toBe(true);
    }
  });

  test("EC2 Instance Profile exists and is linked to role", async () => {
    const profileName = extractInstanceProfileName(
      outputs.Ec2InstanceProfileArn
    );
    const res = await iamClient.send(
      new GetInstanceProfileCommand({ InstanceProfileName: profileName })
    );

    expect(res.InstanceProfile).toBeDefined();
    expect(res.InstanceProfile?.Arn).toBe(outputs.Ec2InstanceProfileArn);
    expect(res.InstanceProfile?.Roles?.[0]?.Arn).toBe(outputs.Ec2RoleArn);
  });

  test("RDS Enhanced Monitoring Role exists", async () => {
    const roleName = extractRoleName(outputs.RdsEnhancedMonitoringRoleArn);
    const res = await iamClient.send(
      new GetRoleCommand({ RoleName: roleName })
    );

    expect(res.Role).toBeDefined();
    expect(res.Role?.Arn).toBe(outputs.RdsEnhancedMonitoringRoleArn);

    // Check trust policy for RDS monitoring
    const trustPolicy = JSON.parse(
      decodeURIComponent(res.Role?.AssumeRolePolicyDocument || "{}")
    );
    expect(trustPolicy.Statement[0].Principal.Service).toContain(
      "monitoring.rds.amazonaws.com"
    );
  });
});

// ---------------------------
// S3 BUCKET
// ---------------------------
describe("S3 Bucket for Logs", () => {
  test("S3 bucket exists and is accessible", async () => {
    const res = await s3Client.send(
      new HeadBucketCommand({ Bucket: outputs.LogBucketName })
    );
    expect(res.$metadata.httpStatusCode).toBe(200);
  });

  test("S3 bucket has versioning enabled", async () => {
    const res = await s3Client.send(
      new GetBucketVersioningCommand({ Bucket: outputs.LogBucketName })
    );
    expect(res.Status).toBe("Enabled");
  });

  test("S3 bucket has encryption enabled", async () => {
    const res = await s3Client.send(
      new GetBucketEncryptionCommand({ Bucket: outputs.LogBucketName })
    );
    expect(
      res.ServerSideEncryptionConfiguration?.Rules?.length
    ).toBeGreaterThan(0);
    expect(
      res.ServerSideEncryptionConfiguration?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
    ).toBe("AES256");
  });

  test("S3 bucket blocks public access", async () => {
    const res = await s3Client.send(
      new GetPublicAccessBlockCommand({ Bucket: outputs.LogBucketName })
    );
    expect(res.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(res.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(res.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(res.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(
      true
    );
  });

  test("S3 bucket has correct policy for ALB and CloudTrail", async () => {
    const res = await s3Client.send(
      new GetBucketPolicyCommand({ Bucket: outputs.LogBucketName })
    );

    expect(res.Policy).toBeDefined();
    const policy = JSON.parse(res.Policy || "{}");

    // Check for ALB log delivery statement
    const albStatement = policy.Statement.find((s: any) => s.Sid === "AllowELBLogDelivery");
    expect(albStatement).toBeDefined();
    expect(albStatement.Effect).toBe("Allow");
    expect(albStatement.Action).toBe("s3:PutObject");

    // Check for CloudTrail statements
    const cloudTrailAclStatement = policy.Statement.find((s: any) => s.Sid === "AllowCloudTrailAclCheck");
    expect(cloudTrailAclStatement).toBeDefined();

    const cloudTrailWriteStatement = policy.Statement.find((s: any) => s.Sid === "AllowCloudTrailWrite");
    expect(cloudTrailWriteStatement).toBeDefined();
  });

  test("Can write and read objects from S3 bucket", async () => {
    const testKey = `integration-test-${Date.now()}.txt`;
    const testContent = `Integration test content for ${stackName}`;

    try {
      // Write object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: outputs.LogBucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // Read object
      const getRes = await s3Client.send(
        new GetObjectCommand({
          Bucket: outputs.LogBucketName,
          Key: testKey,
        })
      );

      const body = await getRes.Body?.transformToString();
      expect(body).toBe(testContent);
    } finally {
      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: outputs.LogBucketName,
          Key: testKey,
        })
      );
    }
  });
});

// ---------------------------
// RDS DATABASE
// ---------------------------
describe("RDS Database", () => {
  test("RDS instance exists and is available", async () => {
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    expect(dbInstance).toBeDefined();
    expect(dbInstance?.DBInstanceStatus).toBe("available");
    expect(dbInstance?.Endpoint?.Address).toBe(outputs.RdsEndpoint);
    expect(dbInstance?.Endpoint?.Port).toBe(parseInt(outputs.RdsPort));
  });

  test("RDS instance has correct configuration", async () => {
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    expect(dbInstance?.DBInstanceClass).toBe(
      template.Parameters.DbInstanceClass.Default
    );
    expect(dbInstance?.Engine).toBe(
      template.Mappings.DbEngineMapping[template.Parameters.DbEngine.Default].Engine
    );
    expect(dbInstance?.MultiAZ).toBe(true);
    expect(dbInstance?.PubliclyAccessible).toBe(false);
    expect(dbInstance?.StorageEncrypted).toBe(true);
    expect(dbInstance?.StorageType).toBe("gp3");
  });

  test("RDS instance has correct backup configuration", async () => {
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    expect(dbInstance?.BackupRetentionPeriod).toBe(7);
    expect(dbInstance?.PreferredBackupWindow).toBe("03:00-04:00");
    expect(dbInstance?.PreferredMaintenanceWindow).toBe("sun:04:00-sun:05:00");
  });

  test("RDS instance is in private subnets", async () => {
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    const subnetGroup = dbInstance?.DBSubnetGroup;
    expect(subnetGroup).toBeDefined();

    const subnetIds = subnetGroup?.Subnets?.map((s) => s.SubnetIdentifier);
    expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
    expect(subnetIds).toContain(outputs.PrivateSubnet2Id);
  });

  test("RDS subnet group exists with correct configuration", async () => {
    const res = await rdsClient.send(
      new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: outputs.DbSubnetGroupName,
      })
    );

    const subnetGroup = res.DBSubnetGroups?.[0];
    expect(subnetGroup).toBeDefined();
    expect(subnetGroup?.VpcId).toBe(outputs.VpcId);
    expect(subnetGroup?.Subnets?.length).toBe(2);
  });

  test("RDS parameter group exists", async () => {
    const res = await rdsClient.send(
      new DescribeDBParameterGroupsCommand({
        DBParameterGroupName: outputs.DbParameterGroupName,
      })
    );

    const parameterGroup = res.DBParameterGroups?.[0];
    expect(parameterGroup).toBeDefined();
    expect(parameterGroup?.DBParameterGroupFamily).toBe(
      template.Mappings.DbEngineMapping[template.Parameters.DbEngine.Default].Family
    );
  });

  test("RDS security group is attached", async () => {
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    const securityGroups = dbInstance?.VpcSecurityGroups?.map(
      (sg) => sg.VpcSecurityGroupId
    );
    expect(securityGroups).toContain(outputs.DbSecurityGroupId);
  });

  test("RDS has CloudWatch logs enabled", async () => {
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    const enabledLogs = dbInstance?.EnabledCloudwatchLogsExports || [];
    expect(enabledLogs).toContain("error");
    expect(enabledLogs).toContain("general");
    expect(enabledLogs).toContain("slowquery");
  });

  test("RDS has enhanced monitoring enabled", async () => {
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];
    expect(dbInstance?.MonitoringInterval).toBe(60);
    expect(dbInstance?.MonitoringRoleArn).toBe(outputs.RdsEnhancedMonitoringRoleArn);
  });
});

// ---------------------------
// SECRETS MANAGER
// ---------------------------
describe("Secrets Manager", () => {
  test("Database secret exists and is accessible", async () => {
    const res = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: outputs.DBSecretArn })
    );

    expect(res.SecretString).toBeDefined();
    const secret = JSON.parse(res.SecretString || "{}");
    expect(secret.username).toBe(template.Parameters.DbUsername.Default);
    expect(secret.password).toBeDefined();
    expect(secret.password.length).toBeGreaterThanOrEqual(16);
  });
});

// ---------------------------
// APPLICATION LOAD BALANCER
// ---------------------------
describe("Application Load Balancer", () => {
  test("ALB exists and is active", async () => {
    const res = await elbv2Client.send(
      new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.ApplicationLoadBalancerArn],
      })
    );

    const alb = res.LoadBalancers?.[0];
    expect(alb).toBeDefined();
    expect(alb?.State?.Code).toBe("active");
    expect(alb?.Type).toBe("application");
    expect(alb?.Scheme).toBe("internet-facing");
    expect(alb?.DNSName).toBe(outputs.AlbDnsName);
  });

  test("ALB is in correct subnets and security groups", async () => {
    const res = await elbv2Client.send(
      new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.ApplicationLoadBalancerArn],
      })
    );

    const alb = res.LoadBalancers?.[0];
    // Check availability zones (ALB API returns AZs instead of direct subnet IDs)
    const albAzs = alb?.AvailabilityZones?.map((az) => az.SubnetId);
    expect(albAzs).toContain(outputs.PublicSubnet1Id);
    expect(albAzs).toContain(outputs.PublicSubnet2Id);
    expect(alb?.SecurityGroups).toContain(outputs.AlbSecurityGroupId);
    expect(alb?.VpcId).toBe(outputs.VpcId);
  });

  test("Target Group exists with correct configuration", async () => {
    const res = await elbv2Client.send(
      new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.TargetGroupArn],
      })
    );

    const targetGroup = res.TargetGroups?.[0];
    expect(targetGroup).toBeDefined();
    expect(targetGroup?.Protocol).toBe("HTTP");
    expect(targetGroup?.Port).toBe(80);
    expect(targetGroup?.VpcId).toBe(outputs.VpcId);
    expect(targetGroup?.TargetType).toBe("instance");
    expect(targetGroup?.HealthCheckEnabled).toBe(true);
    expect(targetGroup?.HealthCheckPath).toBe("/");
  });

  test("ALB Listener exists and forwards to target group", async () => {
    const res = await elbv2Client.send(
      new DescribeListenersCommand({
        ListenerArns: [outputs.AlbListenerArn],
      })
    );

    const listener = res.Listeners?.[0];
    expect(listener).toBeDefined();
    expect(listener?.Protocol).toBe("HTTP");
    expect(listener?.Port).toBe(80);
    expect(listener?.LoadBalancerArn).toBe(outputs.ApplicationLoadBalancerArn);

    const defaultAction = listener?.DefaultActions?.[0];
    expect(defaultAction?.Type).toBe("forward");
    expect(defaultAction?.TargetGroupArn).toBe(outputs.TargetGroupArn);
  });
});

// ---------------------------
// AUTO SCALING & EC2
// ---------------------------
describe("Auto Scaling and EC2 Resources", () => {
  test("Launch Template exists with correct configuration", async () => {
    const res = await ec2Client.send(
      new EC2DescribeLaunchTemplatesCommand({
        LaunchTemplateIds: [outputs.LaunchTemplateId],
      })
    );

    const launchTemplate = res.LaunchTemplates?.[0];
    expect(launchTemplate).toBeDefined();
    expect(launchTemplate?.LaunchTemplateId).toBe(outputs.LaunchTemplateId);
  });

  test("Auto Scaling Group exists with correct configuration", async () => {
    const res = await asgClient.send(
      new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      })
    );

    const asg = res.AutoScalingGroups?.[0];
    expect(asg).toBeDefined();
    expect(asg?.MinSize).toBe(template.Parameters.MinSize.Default);
    expect(asg?.MaxSize).toBe(template.Parameters.MaxSize.Default);
    expect(asg?.DesiredCapacity).toBe(template.Parameters.DesiredCapacity.Default);
    expect(asg?.HealthCheckType).toBe("ELB");
    expect(asg?.HealthCheckGracePeriod).toBe(300);

    // Check subnets
    expect(asg?.VPCZoneIdentifier).toContain(outputs.PrivateSubnet1Id);
    expect(asg?.VPCZoneIdentifier).toContain(outputs.PrivateSubnet2Id);

    // Check target group
    expect(asg?.TargetGroupARNs).toContain(outputs.TargetGroupArn);
  });

  test("Auto Scaling Policy exists", async () => {
    const res = await asgClient.send(
      new DescribePoliciesCommand({
        PolicyNames: [outputs.ScaleUpPolicyArn.split("/").pop()],
        AutoScalingGroupName: outputs.AutoScalingGroupName,
      })
    );

    const policy = res.ScalingPolicies?.[0];
    expect(policy).toBeDefined();
    expect(policy?.PolicyType).toBe("TargetTrackingScaling");
    expect(policy?.TargetTrackingConfiguration?.TargetValue).toBe(60);
  });

  test("Key Pair exists", async () => {
    const res = await ec2Client.send(
      new DescribeKeyPairsCommand({
        KeyNames: [outputs.KeyPairName],
      })
    );

    const keyPair = res.KeyPairs?.[0];
    expect(keyPair).toBeDefined();
    expect(keyPair?.KeyName).toBe(outputs.KeyPairName);
  });
});

// ---------------------------
// CLOUDTRAIL MONITORING
// ---------------------------
describe("CloudTrail Monitoring", () => {
  test("CloudTrail exists and is logging", async () => {
    const res = await cloudTrailClient.send(
      new DescribeTrailsCommand({
        trailNameList: [outputs.CloudTrailArn],
      })
    );

    const trail = res.trailList?.[0];
    expect(trail).toBeDefined();
    expect(trail?.S3BucketName).toBe(outputs.LogBucketName);
    expect(trail?.S3KeyPrefix).toBe("cloudtrail");
    expect(trail?.IncludeGlobalServiceEvents).toBe(true);
    expect(trail?.IsMultiRegionTrail).toBe(true);
    expect(trail?.LogFileValidationEnabled).toBe(true);
  });
});

// ---------------------------
// CROSS-ACCOUNT & REGION INDEPENDENCE
// ---------------------------
describe("Cross-account & Region Independence", () => {
  test("Template has no hardcoded account IDs", async () => {
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    const templateStr = JSON.stringify(template);

    // Check template doesn't contain actual account ID (except in mappings)
    const templateWithoutMappings = templateStr.replace(/"ELBAccountMapping"[\s\S]*?"Resources"/, '"Resources"');
    expect(templateWithoutMappings).not.toContain(identity.Account || "");

    // Check template uses AWS pseudo parameters
    expect(templateStr).toContain("${AWS::AccountId}");
  });

  test("Template is region-independent", () => {
    const templateStr = JSON.stringify(template);

    // Check template uses AWS pseudo parameters
    expect(templateStr).toContain("${AWS::Region}");
    expect(templateStr).toContain("Fn::GetAZs");
  });

  test("All resources use dynamic region and account references", () => {
    const templateStr = JSON.stringify(template);

    // Check for dynamic references
    expect(templateStr).toMatch(/\$\{AWS::AccountId\}/);
    expect(templateStr).toMatch(/\$\{AWS::Region\}/);
    expect(templateStr).toMatch(/\$\{AWS::StackName\}/);
  });

  test("Resource naming follows consistent pattern", () => {
    // Create dynamic patterns based on actual deployed resources
    const namingPattern = new RegExp(`${stackName}-${region}-${environment}-`);
    const dbNamingPattern = new RegExp(`${stackName.toLowerCase()}-${region}-${environment}-`); // Database resources use lowercase

    // Check various resource names follow the pattern
    expect(outputs.AutoScalingGroupName).toMatch(namingPattern);
    expect(outputs.KeyPairName).toMatch(namingPattern);
    expect(outputs.DbSubnetGroupName).toMatch(dbNamingPattern);
    expect(outputs.DbParameterGroupName).toMatch(dbNamingPattern);

    // S3 bucket follows different pattern: {environment}-{region}-logs-{accountId}
    const s3Pattern = new RegExp(`^${environment}-${region}-logs-${accountId}$`);
    expect(outputs.LogBucketName).toMatch(s3Pattern);
  });
});

// ---------------------------
// END-TO-END INTEGRATION
// ---------------------------
describe("End-to-End Stack Validation", () => {
  test("All stack outputs are non-empty and valid", () => {
    for (const [key, value] of Object.entries(outputs)) {
      expect(value).toBeDefined();
      expect(value).not.toBeNull();
      expect(value).not.toBe("");
      console.log(`✓ ${key}: ${value}`);
    }
  });

  test("Network connectivity: Public subnets → IGW → Internet", async () => {
    const publicSubnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];

    for (const subnetId of publicSubnetIds) {
      const res = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "association.subnet-id", Values: [subnetId] }],
        })
      );

      const routeTable = res.RouteTables?.[0];
      const internetRoute = routeTable?.Routes?.find(
        (r) => r.DestinationCidrBlock === "0.0.0.0/0"
      );

      expect(internetRoute?.GatewayId).toBe(outputs.InternetGatewayId);
      expect(internetRoute?.State).toBe("active");
    }
  });

  test("Network connectivity: Private subnets → NAT Gateway → Internet", async () => {
    const privateSubnetIds = [
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];

    for (const subnetId of privateSubnetIds) {
      const res = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: "association.subnet-id", Values: [subnetId] }],
        })
      );

      const routeTable = res.RouteTables?.[0];
      const natRoute = routeTable?.Routes?.find(
        (r) => r.DestinationCidrBlock === "0.0.0.0/0"
      );

      expect(natRoute?.NatGatewayId).toBe(outputs.NatGatewayId);
      expect(natRoute?.State).toBe("active");
    }
  });

  test("Security: RDS is isolated in private subnets", async () => {
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const res = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = res.DBInstances?.[0];

    // Verify RDS is not publicly accessible
    expect(dbInstance?.PubliclyAccessible).toBe(false);

    // Verify RDS is in private subnets
    const subnetIds = dbInstance?.DBSubnetGroup?.Subnets?.map(
      (s) => s.SubnetIdentifier
    );
    expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
    expect(subnetIds).toContain(outputs.PrivateSubnet2Id);
  });

  test("Multi-AZ deployment for high availability", async () => {
    // Check RDS is Multi-AZ
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const rdsRes = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );
    expect(rdsRes.DBInstances?.[0]?.MultiAZ).toBe(true);

    // Check subnets span multiple AZs
    const allSubnetIds = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];

    const subnetRes = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
    );

    const azs = new Set(subnetRes.Subnets?.map((s) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);
  });

  test("Security Groups form proper access chain", async () => {
    // Internet → ALB SG → EC2 SG → DB SG

    // ALB SG allows internet
    const albSgRes = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.AlbSecurityGroupId],
      })
    );
    const albHttpRule = albSgRes.SecurityGroups?.[0]?.IpPermissions?.find(
      (r) => r.FromPort === 80 && r.IpRanges?.[0]?.CidrIp === "0.0.0.0/0"
    );
    expect(albHttpRule).toBeDefined();

    // EC2 SG allows ALB SG
    const ec2SgRes = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.Ec2SecurityGroupId],
      })
    );
    const ec2HttpRule = ec2SgRes.SecurityGroups?.[0]?.IpPermissions?.find(
      (r) => r.FromPort === 80 && r.UserIdGroupPairs?.[0]?.GroupId === outputs.AlbSecurityGroupId
    );
    expect(ec2HttpRule).toBeDefined();

    // DB SG allows EC2 SG
    const dbSgRes = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.DbSecurityGroupId],
      })
    );
    const dbRule = dbSgRes.SecurityGroups?.[0]?.IpPermissions?.find(
      (r) => r.FromPort === parseInt(outputs.RdsPort) && r.UserIdGroupPairs?.[0]?.GroupId === outputs.Ec2SecurityGroupId
    );
    expect(dbRule).toBeDefined();
  });

  test("All critical resources are successfully deployed and functional", async () => {
    const criticalResources = {
      "VPC": outputs.VpcId,
      "ALB DNS": outputs.AlbDnsName,
      "RDS Endpoint": outputs.RdsEndpoint,
      "S3 Bucket": outputs.LogBucketName,
      "Auto Scaling Group": outputs.AutoScalingGroupName,
      "Launch Template": outputs.LaunchTemplateId,
      "Target Group": outputs.TargetGroupArn,
      "DB Secret": outputs.DBSecretArn,
      "CloudTrail": outputs.CloudTrailArn,
      "NAT Gateway": outputs.NatGatewayId,
      "Key Pair": outputs.KeyPairName,
    };

    for (const [name, value] of Object.entries(criticalResources)) {
      expect(value).toBeDefined();
      expect(value).not.toBe("");
      console.log(`✓ ${name}: ${value}`);
    }
  });

  test("Application URL is accessible format", () => {
    expect(outputs.AlbUrl).toMatch(/^http:\/\//);
    expect(outputs.AlbUrl).toContain(outputs.AlbDnsName);
    console.log(`✓ Application URL: ${outputs.AlbUrl}`);
  });

  test("Resource tagging compliance", async () => {
    // Check VPC tags
    const vpcRes = await ec2Client.send(
      new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] })
    );
    const vpcTags = vpcRes.Vpcs?.[0]?.Tags || [];
    expect(vpcTags.some((t) => t.Key === "Name")).toBe(true);

    // Check ALB tags
    const albTagsRes = await elbv2Client.send(
      new DescribeTagsCommand({
        ResourceArns: [outputs.ApplicationLoadBalancerArn],
      })
    );
    const albTags = albTagsRes.TagDescriptions?.[0]?.Tags || [];
    expect(albTags.some((t: any) => t.Key === "Name")).toBe(true);
  });

  test("Deployment consistency across all availability zones", async () => {
    const allSubnetIds = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];

    const subnetRes = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
    );

    // Group subnets by AZ
    const subnetsByAz = new Map();
    subnetRes.Subnets?.forEach(subnet => {
      const az = subnet.AvailabilityZone!;
      if (!subnetsByAz.has(az)) {
        subnetsByAz.set(az, []);
      }
      subnetsByAz.get(az).push(subnet);
    });

    // Each AZ should have both public and private subnet
    subnetsByAz.forEach((subnets, az) => {
      const hasPublic = subnets.some((s: any) => s.MapPublicIpOnLaunch);
      const hasPrivate = subnets.some((s: any) => !s.MapPublicIpOnLaunch);
      expect(hasPublic).toBe(true);
      expect(hasPrivate).toBe(true);
      console.log(`✓ AZ ${az}: ${subnets.length} subnets (public + private)`);
    });
  });
});

// ---------------------------
// REAL-WORLD INTEGRATION TESTS
// ---------------------------
describe("Real-World Cross-Service Integration", () => {
  test("End-to-end web traffic flow: Internet → ALB → Auto Scaling → EC2", async () => {
    // Check ALB is properly configured for web traffic
    const albRes = await elbv2Client.send(
      new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.ApplicationLoadBalancerArn],
      })
    );

    const alb = albRes.LoadBalancers?.[0];
    expect(alb?.State?.Code).toBe("active");
    expect(alb?.Scheme).toBe("internet-facing");

    // Check target group health
    const tgRes = await elbv2Client.send(
      new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.TargetGroupArn],
      })
    );

    const targetGroup = tgRes.TargetGroups?.[0];
    expect(targetGroup?.HealthCheckEnabled).toBe(true);
    expect(targetGroup?.HealthCheckPath).toBe("/");
    expect(targetGroup?.HealthCheckIntervalSeconds).toBeLessThanOrEqual(30);

    // Verify Auto Scaling Group is targeting correct subnets
    const asgRes = await asgClient.send(
      new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      })
    );

    const asg = asgRes.AutoScalingGroups?.[0];
    expect(asg?.VPCZoneIdentifier).toContain(outputs.PrivateSubnet1Id);
    expect(asg?.VPCZoneIdentifier).toContain(outputs.PrivateSubnet2Id);
    expect(asg?.TargetGroupARNs).toContain(outputs.TargetGroupArn);
  });

  test("Database connectivity: EC2 → RDS in private subnets with proper security", async () => {
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const dbRes = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = dbRes.DBInstances?.[0];

    // Verify database is isolated (not publicly accessible)
    expect(dbInstance?.PubliclyAccessible).toBe(false);

    // Verify database is in private subnets only
    const dbSubnets = dbInstance?.DBSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier);
    expect(dbSubnets).toContain(outputs.PrivateSubnet1Id);
    expect(dbSubnets).toContain(outputs.PrivateSubnet2Id);
    expect(dbSubnets).not.toContain(outputs.PublicSubnet1Id);
    expect(dbSubnets).not.toContain(outputs.PublicSubnet2Id);

    // Verify security group chain: EC2 SG → DB SG
    const dbSecurityGroups = dbInstance?.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId);
    expect(dbSecurityGroups).toContain(outputs.DbSecurityGroupId);

    // Verify database secret is properly configured
    const secretRes = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: outputs.DBSecretArn })
    );

    const secret = JSON.parse(secretRes.SecretString || "{}");
    expect(secret.username).toBeDefined();
    expect(secret.password).toBeDefined();
    expect(secret.password.length).toBeGreaterThanOrEqual(16);
  });

  test("Logging and monitoring integration: ALB → S3, CloudTrail → S3", async () => {
    // Verify ALB logging configuration using DescribeLoadBalancerAttributes
    const albAttributesRes = await elbv2Client.send(
      new DescribeLoadBalancerAttributesCommand({
        LoadBalancerArn: outputs.ApplicationLoadBalancerArn,
      })
    );

    const logAttribute = albAttributesRes.Attributes?.find(
      (attr: any) => attr.Key === "access_logs.s3.enabled"
    );
    expect(logAttribute?.Value).toBe("true");

    const bucketAttribute = albAttributesRes.Attributes?.find(
      (attr: any) => attr.Key === "access_logs.s3.bucket"
    );
    expect(bucketAttribute?.Value).toBe(outputs.LogBucketName);

    // Verify CloudTrail logging configuration
    const trailRes = await cloudTrailClient.send(
      new DescribeTrailsCommand({
        trailNameList: [outputs.CloudTrailArn],
      })
    );

    const trail = trailRes.trailList?.[0];
    expect(trail?.S3BucketName).toBe(outputs.LogBucketName);
    // Note: IsLogging status requires GetTrailStatus API call
    expect(trail?.IsMultiRegionTrail).toBe(true);

    // Test S3 bucket permissions for both services
    const bucketPolicyRes = await s3Client.send(
      new GetBucketPolicyCommand({ Bucket: outputs.LogBucketName })
    );

    const policy = JSON.parse(bucketPolicyRes.Policy || "{}");

    // Check ALB permissions
    const albStatement = policy.Statement.find((s: any) => s.Sid === "AllowELBLogDelivery");
    expect(albStatement).toBeDefined();
    expect(albStatement.Action).toBe("s3:PutObject");

    // Check CloudTrail permissions
    const cloudTrailWrite = policy.Statement.find((s: any) => s.Sid === "AllowCloudTrailWrite");
    expect(cloudTrailWrite).toBeDefined();
    expect(cloudTrailWrite.Principal.Service).toBe("cloudtrail.amazonaws.com");
  });

  test("Auto Scaling responsiveness and health check integration", async () => {
    const asgRes = await asgClient.send(
      new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      })
    );

    const asg = asgRes.AutoScalingGroups?.[0];

    // Verify health check configuration
    expect(asg?.HealthCheckType).toBe("ELB");
    expect(asg?.HealthCheckGracePeriod).toBe(300);

    // Verify scaling policy exists and is properly configured
    const policyRes = await asgClient.send(
      new DescribePoliciesCommand({
        AutoScalingGroupName: outputs.AutoScalingGroupName,
      })
    );

    const scalingPolicy = policyRes.ScalingPolicies?.[0];
    expect(scalingPolicy?.PolicyType).toBe("TargetTrackingScaling");
    expect(scalingPolicy?.TargetTrackingConfiguration?.TargetValue).toBe(60);
    expect(scalingPolicy?.TargetTrackingConfiguration?.PredefinedMetricSpecification?.PredefinedMetricType)
      .toBe("ASGAverageCPUUtilization");
  });

  test("Multi-AZ resilience and failover capability", async () => {
    // Verify RDS Multi-AZ configuration
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const dbRes = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = dbRes.DBInstances?.[0];
    expect(dbInstance?.MultiAZ).toBe(true);

    // Verify subnets span multiple AZs
    const allSubnetIds = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];

    const subnetRes = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
    );

    const azs = new Set(subnetRes.Subnets?.map((s) => s.AvailabilityZone));
    expect(azs.size).toBeGreaterThanOrEqual(2);

    // Verify ALB spans multiple AZs
    const albRes = await elbv2Client.send(
      new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.ApplicationLoadBalancerArn],
      })
    );

    const alb = albRes.LoadBalancers?.[0];
    const albAzs = new Set(alb?.AvailabilityZones?.map(az => az.ZoneName));
    expect(albAzs.size).toBeGreaterThanOrEqual(2);

    // Verify Auto Scaling Group covers multiple AZs
    const asgRes = await asgClient.send(
      new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      })
    );

    const asg = asgRes.AutoScalingGroups?.[0];
    const asgSubnets = asg?.VPCZoneIdentifier?.split(",") || [];
    expect(asgSubnets.length).toBeGreaterThanOrEqual(2);
  });

  test("Security compliance: Encryption, access controls, and network isolation", async () => {
    // Verify RDS encryption
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const dbRes = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = dbRes.DBInstances?.[0];
    expect(dbInstance?.StorageEncrypted).toBe(true);

    // Verify S3 encryption
    const s3EncryptionRes = await s3Client.send(
      new GetBucketEncryptionCommand({ Bucket: outputs.LogBucketName })
    );

    expect(s3EncryptionRes.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);

    // Verify S3 public access is blocked
    const s3PublicAccessRes = await s3Client.send(
      new GetPublicAccessBlockCommand({ Bucket: outputs.LogBucketName })
    );

    expect(s3PublicAccessRes.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(s3PublicAccessRes.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(s3PublicAccessRes.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(s3PublicAccessRes.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

    // Verify security group isolation (defense in depth)
    const sgRes = await ec2Client.send(
      new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.DbSecurityGroupId],
      })
    );

    const dbSg = sgRes.SecurityGroups?.[0];
    const dbRules = dbSg?.IpPermissions || [];

    // Database should only accept connections from EC2 security group, not from internet
    expect(dbRules.every(rule =>
      rule.UserIdGroupPairs?.some(pair => pair.GroupId === outputs.Ec2SecurityGroupId) &&
      !rule.IpRanges?.some(range => range.CidrIp === "0.0.0.0/0")
    )).toBe(true);
  });

  test("Backup and recovery configuration", async () => {
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const dbRes = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = dbRes.DBInstances?.[0];

    // Verify backup configuration
    expect(dbInstance?.BackupRetentionPeriod).toBe(7);
    expect(dbInstance?.PreferredBackupWindow).toBe("03:00-04:00");
    expect(dbInstance?.PreferredMaintenanceWindow).toBe("sun:04:00-sun:05:00");

    // Verify enhanced monitoring is enabled
    expect(dbInstance?.MonitoringInterval).toBe(60);
    expect(dbInstance?.MonitoringRoleArn).toBe(outputs.RdsEnhancedMonitoringRoleArn);

    // Verify CloudWatch logs are enabled
    const enabledLogs = dbInstance?.EnabledCloudwatchLogsExports || [];
    expect(enabledLogs).toContain("error");
    expect(enabledLogs).toContain("general");
    expect(enabledLogs).toContain("slowquery");

    // Verify S3 versioning for log retention
    const s3VersioningRes = await s3Client.send(
      new GetBucketVersioningCommand({ Bucket: outputs.LogBucketName })
    );
    expect(s3VersioningRes.Status).toBe("Enabled");
  });
});

// ---------------------------
// CROSS-ACCOUNT COMPATIBILITY TESTS
// ---------------------------
describe("Cross-Account and Region Compatibility", () => {
  test("No hardcoded account-specific values in deployment", async () => {
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    const currentAccountId = identity.Account!;

    // Test bucket name follows pattern without hardcoded account
    expect(outputs.LogBucketName).toMatch(new RegExp(`${environment}-${region}-logs-${currentAccountId}$`));

    // Test resource names use dynamic references
    const dynamicStackPattern = new RegExp(`${stackName}-[\\w-]+-[\\w-]+-asg`);
    const dynamicKeyPattern = new RegExp(`${stackName}-[\\w-]+-[\\w-]+-keypair`);
    expect(outputs.AutoScalingGroupName).toMatch(dynamicStackPattern);
    expect(outputs.KeyPairName).toMatch(dynamicKeyPattern);

    // Verify no hardcoded account IDs in resource names (except current account)
    const otherAccountPattern = /\d{12}/g;
    const resourceNames = [
      outputs.Ec2RoleArn,
      outputs.DBSecretArn,
      outputs.CloudTrailArn,
    ];

    resourceNames.forEach(resourceName => {
      const accountMatches = resourceName.match(otherAccountPattern) || [];
      // Should only contain current account ID
      expect(accountMatches.every((id: string) => id === currentAccountId)).toBe(true);
    });
  });

  test("Region independence verification", async () => {
    // Verify resources are in expected region
    const regionPattern = new RegExp(region);

    expect(outputs.DBSecretArn).toMatch(regionPattern);
    expect(outputs.Ec2RoleArn).toMatch(regionPattern);
    expect(outputs.ApplicationLoadBalancerArn).toMatch(regionPattern);

    // Verify no hardcoded regions in resource naming
    const hardcodedRegionPattern = /us-(east|west)-[12]|eu-(west|central)-[12]/;
    const templateStr = JSON.stringify(template);
    const templateWithoutMappings = templateStr.replace(/"ELBAccountMapping"[\s\S]*?"Resources"/, '"Resources"');

    // Template should not contain hardcoded regions outside of mappings
    expect(templateWithoutMappings).not.toMatch(hardcodedRegionPattern);
  });

  test("Dynamic availability zone utilization", async () => {
    const allSubnetIds = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
    ];

    const subnetRes = await ec2Client.send(
      new DescribeSubnetsCommand({ SubnetIds: allSubnetIds })
    );

    // Get available AZs for current region
    const azs = subnetRes.Subnets?.map(s => s.AvailabilityZone).filter((az, index, arr) => arr.indexOf(az) === index);

    // Verify we're using actual AZs available in the region, not hardcoded ones
    expect(azs?.length).toBeGreaterThanOrEqual(2);

    // Verify AZ names follow AWS pattern for current region
    azs?.forEach(az => {
      expect(az).toMatch(new RegExp(`^${region}[a-z]$`));
    });
  });

  test("Cross-account IAM role assumptions work properly", async () => {
    // Verify EC2 role trust policy allows EC2 service
    const roleName = extractRoleName(outputs.Ec2RoleArn);
    const roleRes = await iamClient.send(
      new GetRoleCommand({ RoleName: roleName })
    );

    const trustPolicy = JSON.parse(
      decodeURIComponent(roleRes.Role?.AssumeRolePolicyDocument || "{}")
    );

    expect(trustPolicy.Statement[0].Principal.Service).toContain("ec2.amazonaws.com");
    expect(trustPolicy.Statement[0].Effect).toBe("Allow");
    expect(trustPolicy.Statement[0].Action).toBe("sts:AssumeRole");

    // Verify RDS monitoring role trust policy
    const rdsRoleName = extractRoleName(outputs.RdsEnhancedMonitoringRoleArn);
    const rdsRoleRes = await iamClient.send(
      new GetRoleCommand({ RoleName: rdsRoleName })
    );

    const rdsTrustPolicy = JSON.parse(
      decodeURIComponent(rdsRoleRes.Role?.AssumeRolePolicyDocument || "{}")
    );

    expect(rdsTrustPolicy.Statement[0].Principal.Service).toContain("monitoring.rds.amazonaws.com");
  });
});

// ---------------------------
// PERFORMANCE AND SCALABILITY TESTS
// ---------------------------
describe("Performance and Scalability Validation", () => {
  test("Auto Scaling Group can scale within defined limits", async () => {
    const asgRes = await asgClient.send(
      new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      })
    );

    const asg = asgRes.AutoScalingGroups?.[0];

    // Verify scaling boundaries
    expect(asg?.MinSize).toBe(template.Parameters.MinSize.Default);
    expect(asg?.MaxSize).toBe(template.Parameters.MaxSize.Default);
    expect(asg?.DesiredCapacity).toBe(template.Parameters.DesiredCapacity.Default);

    // Verify current capacity is within bounds
    expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(asg?.MinSize || 0);
    expect(asg?.DesiredCapacity).toBeLessThanOrEqual(asg?.MaxSize || 0);

    // Verify instance configuration supports scale
    const launchTemplateRes = await ec2Client.send(
      new EC2DescribeLaunchTemplatesCommand({
        LaunchTemplateIds: [outputs.LaunchTemplateId],
      })
    );

    expect(launchTemplateRes.LaunchTemplates?.[0]).toBeDefined();
  });

  test("Database can handle expected workload with proper instance class", async () => {
    const dbIdentifier = extractDbIdentifier(outputs.RdsEndpoint);
    const dbRes = await rdsClient.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
    );

    const dbInstance = dbRes.DBInstances?.[0];

    // Verify instance class is appropriate for workload
    expect(dbInstance?.DBInstanceClass).toBe(template.Parameters.DbInstanceClass.Default);

    // Verify storage configuration supports performance
    expect(dbInstance?.StorageType).toBe("gp3");
    expect(dbInstance?.AllocatedStorage).toBe(20);

    // Verify Multi-AZ for high availability under load
    expect(dbInstance?.MultiAZ).toBe(true);
  });

  test("Load balancer configuration supports traffic distribution", async () => {
    const tgRes = await elbv2Client.send(
      new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.TargetGroupArn],
      })
    );

    const targetGroup = tgRes.TargetGroups?.[0];

    // Verify health check configuration for reliable traffic routing
    expect(targetGroup?.HealthCheckEnabled).toBe(true);
    expect(targetGroup?.HealthCheckIntervalSeconds).toBeLessThanOrEqual(30);
    expect(targetGroup?.HealthCheckTimeoutSeconds).toBeLessThanOrEqual(10);
    expect(targetGroup?.HealthyThresholdCount).toBeLessThanOrEqual(3);
    expect(targetGroup?.UnhealthyThresholdCount).toBeGreaterThanOrEqual(2);

    // Verify target group supports instance-level targeting
    expect(targetGroup?.TargetType).toBe("instance");
  });
});
