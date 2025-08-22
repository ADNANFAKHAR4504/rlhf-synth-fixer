import {
  CloudWatchClient, GetDashboardCommand,
} from "@aws-sdk/client-cloudwatch";
import {
  DescribeTableCommand, DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DescribeInstancesCommand, DescribeNetworkAclsCommand, DescribeVpcsCommand, EC2Client,
} from "@aws-sdk/client-ec2";
import {
  DescribeListenersCommand, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client, Listener, TargetGroup,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  GetRoleCommand, IAMClient, ListAttachedRolePoliciesCommand,
} from "@aws-sdk/client-iam";
import {
  DescribeDBInstancesCommand, RDSClient,
} from "@aws-sdk/client-rds";
import {
  GetBucketEncryptionCommand, GetBucketLocationCommand, GetBucketTaggingCommand, GetBucketVersioningCommand, S3Client,
} from "@aws-sdk/client-s3";
import {
  DescribeSecretCommand, SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import * as fs from "fs";
import * as path from "path";

// --------- Output loading logic (reference aligned) ----------

const allOutputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
const flatPath = path.resolve(process.cwd(), "cfn-outputs.json");

let deploymentOutputs: any = {};
let outputFormat: "flat" | "all" = "all";

if (fs.existsSync(allOutputsPath)) {
  deploymentOutputs = JSON.parse(fs.readFileSync(allOutputsPath, "utf8"));
  outputFormat = "all";
} else if (fs.existsSync(flatPath)) {
  deploymentOutputs = JSON.parse(fs.readFileSync(flatPath, "utf8"));
  outputFormat = "flat";
} else {
  throw new Error("No Terraform outputs file found at cfn-outputs/all-outputs.json or cfn-outputs.json.");
}

function getOutput(key: string): any {
  if (!deploymentOutputs[key]) return undefined;
  if (outputFormat === "flat") {
    return deploymentOutputs[key];
  } else if (outputFormat === "all") {
    return deploymentOutputs[key].value !== undefined ? deploymentOutputs[key].value : deploymentOutputs[key];
  }
  return undefined;
}

// --------- Test setup ---------

describe("Terraform High Availability Web App E2E Deployment Outputs", () => {
  // Dynamic region/environment
  const bucketRegion = getOutput("bucket_region") || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || (getOutput("bucket_tags")?.Environment ?? "prod");
  const testRegion = getOutput("aws_region") || bucketRegion;

  // Resource outputs
  const outputs = {
    albDnsName: getOutput("alb_dns_name"),
    albTargetGroupArn: getOutput("alb_target_group_arn"),
    autoscalingGroupName: getOutput("autoscaling_group_name"),
    bucketName: getOutput("bucket_name"),
    bucketTags: typeof getOutput("bucket_tags") === "string"
      ? JSON.parse(getOutput("bucket_tags"))
      : getOutput("bucket_tags") || {},
    cloudwatchDashboardName: getOutput("cloudwatch_dashboard_name"),
    cloudwatchLogsPolicyName: getOutput("cloudwatch_logs_policy_name"),
    dynamodbTableArn: getOutput("dynamodb_table_arn"),
    dynamodbTableName: getOutput("dynamodb_table_name"),
    ec2RoleName: getOutput("ec2_role_name"),
    naclId: getOutput("network_acl_id"),
    rdsInstanceEndpoint: getOutput("rds_instance_endpoint"),
    rdsSecretName: getOutput("rds_secret_name"),
    s3AccessPolicyName: getOutput("s3_access_policy_name"),
    vpcId: getOutput("vpc_id"),
  };

  // --------- Output keys presence and formats ---------
  it("should include all expected output keys", () => {
    const expectedKeys = [
      "alb_dns_name",
      "alb_target_group_arn",
      "autoscaling_group_name",
      "bucket_name",
      "bucket_region",
      "bucket_tags",
      "cloudwatch_dashboard_name",
      "cloudwatch_logs_policy_name",
      "dynamodb_table_arn",
      "dynamodb_table_name",
      "ec2_role_name",
      "network_acl_id",
      "rds_instance_endpoint",
      "rds_secret_name",
      "s3_access_policy_name",
      "vpc_id",
    ];
    expectedKeys.forEach((key) => {
      expect(deploymentOutputs).toHaveProperty(key);
      expect(getOutput(key)).toBeDefined();
    });
  });

  it("should have valid ID/ARN formats", () => {
    expect(outputs.vpcId).toMatch(/^vpc-[a-z0-9]+$/);
    expect(outputs.naclId).toMatch(/^acl-[a-z0-9]+$/);
    expect(outputs.dynamodbTableArn).toMatch(/^arn:aws:dynamodb:/);
    expect(outputs.albTargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:/);
    expect(outputs.bucketName).toMatch(/^[a-z0-9\-\.]+$/);
  });

  // --------- S3 Bucket tests ---------
  describe("S3 Bucket", () => {
    let s3: S3Client;
    beforeAll(() => {
      s3 = new S3Client({ region: bucketRegion });
    });

    test("bucket exists in expected region", async () => {
      const loc = await s3.send(new GetBucketLocationCommand({ Bucket: outputs.bucketName }));
      const location = loc.LocationConstraint as string | undefined;
      const actualRegion =
        location === undefined || location === "" || location === "US"
          ? "us-east-1"
          : location;
      expect(actualRegion).toBe(bucketRegion);
    });

    test("bucket has versioning enabled", async () => {
      const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: outputs.bucketName }));
      expect(ver.Status).toBe("Enabled");
    });

    test("bucket is encrypted with AES256", async () => {
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: outputs.bucketName }));
      const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
      expect(rules.some(r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "AES256")).toBe(true);
    });

    test("bucket tags include environment, managedBy, and project", async () => {
      const tagRes = await s3.send(new GetBucketTaggingCommand({ Bucket: outputs.bucketName }));
      const tags = Object.fromEntries((tagRes.TagSet ?? []).map(t => [t.Key, t.Value]));
      expect(tags.Environment).toBe(outputs.bucketTags.Environment || "prod");
      expect(tags.ManagedBy).toBe("terraform");
      expect(tags.Project).toBe("ExampleProject");
    });
  });

  // --------- Secrets Manager ---------
  describe("Secrets Manager", () => {
    let secrets: SecretsManagerClient;
    beforeAll(() => {
      secrets = new SecretsManagerClient({ region: testRegion });
    });

    test("RDS secret exists", async () => {
      const secretName = outputs.rdsSecretName;
      const res = await secrets.send(new DescribeSecretCommand({ SecretId: secretName }));
      expect(res.Name).toBe(secretName);
    });
  });

  // --------- VPC ---------
  describe("VPC", () => {
    let ec2: EC2Client;
    beforeAll(() => {
      ec2 = new EC2Client({ region: testRegion });
    });

    test("VPC exists", async () => {
      const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.vpcId] }));
      expect(vpcs.Vpcs?.length).toBe(1);
      const vpc = vpcs.Vpcs?.[0];
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
      expect(vpc?.Tags?.some(t => t.Key === "ManagedBy" && t.Value === "terraform")).toBe(true);
    });
  });

  // --------- Network ACL ---------
  describe("Network ACL", () => {
    let ec2: EC2Client;
    beforeAll(() => {
      ec2 = new EC2Client({ region: testRegion });
    });

  test("NACL exists and has correct rules", async () => {
      const nacls = await ec2.send(new DescribeNetworkAclsCommand({ NetworkAclIds: [outputs.naclId] }));
      const nacl = nacls.NetworkAcls?.[0];
      expect(nacl).toBeTruthy();
      const ingressRules = nacl?.Entries?.filter(e => e.Egress === false) || [];
      expect(ingressRules.some(
        e => e.RuleAction === "allow" &&
          (Number(e.Protocol) === 6) &&
          e.PortRange?.From === 443
      )).toBe(true);
      expect(ingressRules.some(
        e => e.RuleAction === "allow" &&
          (Number(e.Protocol) === 6) &&
          e.PortRange?.From === 22
      )).toBe(true);
      expect(ingressRules.some(e => e.RuleAction === "deny")).toBe(true);
    });
  });

  // --------- IAM Role and Policies ---------
  describe("IAM Role and Policies", () => {
    let iam: IAMClient;
    beforeAll(() => {
      iam = new IAMClient({ region: testRegion });
    });

    test("EC2 role exists and has required policies", async () => {
      const roleName = outputs.ec2RoleName;
      const roleRes = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(roleRes.Role?.RoleName).toBe(roleName);
      expect(roleRes.Role?.Tags?.some(t => t.Key === "ManagedBy" && t.Value === "terraform")).toBe(true);

      const attachedPoliciesRes = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
      const policyNames = attachedPoliciesRes.AttachedPolicies?.map(p => p.PolicyName) || [];

      expect(policyNames).toEqual(
        expect.arrayContaining([
          outputs.cloudwatchLogsPolicyName,
          outputs.s3AccessPolicyName,
        ])
      );
    });
  });

  // --------- CloudWatch Dashboard ---------
  describe("CloudWatch Dashboard", () => {
    let cw: CloudWatchClient;
    beforeAll(() => {
      cw = new CloudWatchClient({ region: testRegion });
    });

    test("dashboard exists and is valid", async () => {
      const dashboardName = outputs.cloudwatchDashboardName;
      const res = await cw.send(new GetDashboardCommand({ DashboardName: dashboardName }));
      expect(res.DashboardName).toBe(dashboardName);
      expect(res.DashboardBody).toBeDefined();
      expect(JSON.parse(res.DashboardBody!).widgets.length).toBeGreaterThan(0);
    });
  });

  // --------- EC2 Auto Scaling Group ---------
  describe("EC2 Auto Scaling Group", () => {
    let ec2: EC2Client;
    beforeAll(() => {
      ec2 = new EC2Client({ region: testRegion });
    });

    test("Auto Scaling Group exists and has at least 3 t3.micro instances", async () => {
      expect(outputs.autoscalingGroupName).toBeDefined();
      const describeInstancesRes = await ec2.send(new DescribeInstancesCommand({
        Filters: [
          { Name: "tag:aws:autoscaling:groupName", Values: [outputs.autoscalingGroupName] },
        ],
      }));
      const instances = describeInstancesRes.Reservations?.flatMap(r => r.Instances ?? []) ?? [];
      expect(instances.length).toBeGreaterThanOrEqual(3);
      instances.forEach(instance => {
        expect(instance.InstanceType).toBe("t3.micro");
        expect(instance.State?.Name).toBe("running");
      });
    });
  });

  // --------- Application Load Balancer ---------
  describe("Application Load Balancer", () => {
    let elbv2: ElasticLoadBalancingV2Client;
    beforeAll(() => {
      elbv2 = new ElasticLoadBalancingV2Client({ region: testRegion });
    });

    test("ALB exists and is accessible", async () => {
      expect(outputs.albDnsName).toBeDefined();
      // Find by DNS name
      const lbRes = await elbv2.send(new DescribeLoadBalancersCommand({}));
      const alb = lbRes.LoadBalancers?.find(lb => lb.DNSName === outputs.albDnsName);
      expect(alb).toBeDefined();
      expect(alb?.Scheme).toBe("internet-facing");
      expect(alb?.Type).toBe("application");
    });

    test.skip("ALB has HTTPS listener on port 443", async () => {
      const lbRes = await elbv2.send(new DescribeLoadBalancersCommand({}));
      const alb = lbRes.LoadBalancers?.find(lb => lb.DNSName === outputs.albDnsName);
      expect(alb).toBeDefined();
      const listenersRes = await elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: alb!.LoadBalancerArn }));
      expect(listenersRes.Listeners?.some((l: Listener) => l.Port === 443 && l.Protocol === "HTTPS")).toBe(true);
    });

    test("ALB forwards to the correct target group", async () => {
      const lbRes = await elbv2.send(new DescribeLoadBalancersCommand({}));
      const alb = lbRes.LoadBalancers?.find(lb => lb.DNSName === outputs.albDnsName);
      expect(alb).toBeDefined();
      const tgRes = await elbv2.send(new DescribeTargetGroupsCommand({ LoadBalancerArn: alb!.LoadBalancerArn }));
      expect(tgRes.TargetGroups?.some((tg: TargetGroup) => tg.TargetGroupArn === outputs.albTargetGroupArn)).toBe(true);
    });
  });

  // --------- RDS Multi-AZ Instance ---------
  describe("RDS Multi-AZ Instance", () => {
    let rds: RDSClient;
    beforeAll(() => {
      rds = new RDSClient({ region: testRegion });
    });

    test("RDS DB instance is provisioned, Multi-AZ, and healthy", async () => {
      expect(outputs.rdsInstanceEndpoint).toBeDefined();
      const dbRes = await rds.send(new DescribeDBInstancesCommand({}));
      const dbInstance = dbRes.DBInstances?.find(db => db.Endpoint?.Address === outputs.rdsInstanceEndpoint.split(":")[0]);
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(["available", "backing-up"]).toContain(dbInstance?.DBInstanceStatus);
      expect(dbInstance?.Engine).toMatch(/mysql|postgres/i);
    });
  });

  // --------- DynamoDB Table with Auto Scaling ---------
  describe("DynamoDB Table with Auto Scaling", () => {
    let dynamodb: DynamoDBClient;
    beforeAll(() => {
      dynamodb = new DynamoDBClient({ region: testRegion });
    });

    test("DynamoDB table exists and is active", async () => {
      expect(outputs.dynamodbTableName).toBeDefined();
      const tableRes = await dynamodb.send(new DescribeTableCommand({ TableName: outputs.dynamodbTableName }));
      expect(tableRes.Table?.TableStatus).toBe("ACTIVE");
      expect(tableRes.Table?.TableArn).toBe(outputs.dynamodbTableArn);
    });
  });
});
