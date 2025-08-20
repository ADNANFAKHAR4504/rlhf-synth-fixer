import { CloudWatchClient, GetDashboardCommand } from "@aws-sdk/client-cloudwatch";
import { DescribeTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DescribeInstancesCommand, DescribeNetworkAclsCommand, DescribeVpcsCommand, EC2Client } from "@aws-sdk/client-ec2";
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
  Listener,
  TargetGroup
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { GetRoleCommand, IAMClient, ListAttachedRolePoliciesCommand } from "@aws-sdk/client-iam";
import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";
import { GetBucketEncryptionCommand, GetBucketLocationCommand, GetBucketTaggingCommand, GetBucketVersioningCommand, S3Client } from "@aws-sdk/client-s3";
import { DescribeSecretCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import * as fs from "fs";
import * as path from "path";

// Helper to load deployment outputs
function loadOutputs(): any {
  const paths = [
    path.join(__dirname, "../cfn-outputs.json"),
    path.join(__dirname, "../cfn-outputs/flat-outputs.json"),
    path.join(__dirname, "../lib/flat-outputs.json"),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, "utf8");
      if (raw.trim() !== "") return JSON.parse(raw);
    }
  }
  throw new Error("Deployment outputs not found");
}

describe("Terraform E2E Integration Tests", () => {

  let outputs: any;
  let bucketName: string;
  let bucketTags: any;
  let environment: string;
  let bucketRegion: string;
  let testRegion: string;

  // Additional outputs for direct resource lookup
  let vpcId: string;
  let naclId: string;
  let ec2RoleName: string;
  let rdsSecretName: string;
  let cloudwatchDashboardName: string;

  // Newly added outputs for new resources
  let autoscalingGroupName: string;
  let albDnsName: string;
  let albTargetGroupArn: string;
  let rdsInstanceEndpoint: string;
  let dynamodbTableName: string;
  let dynamodbTableArn: string;

  beforeAll(() => {
    outputs = loadOutputs();
    bucketName = outputs.bucket_name?.value || outputs.bucket_name;
    bucketTags = typeof outputs.bucket_tags?.value === "object"
      ? outputs.bucket_tags.value
      : JSON.parse(outputs.bucket_tags?.value || "{}");
    environment = process.env.ENVIRONMENT_SUFFIX || bucketTags.Environment || "prod";
    bucketRegion = outputs.bucket_region?.value || outputs.bucket_region || process.env.AWS_REGION || "us-west-2";
    testRegion = outputs.aws_region?.value || outputs.aws_region || bucketRegion;

    // Load resource ids/names from outputs
    vpcId = outputs.vpc_id?.value || outputs.vpc_id;
    naclId = outputs.network_acl_id?.value || outputs.network_acl_id;
    ec2RoleName = outputs.ec2_role_name?.value || outputs.ec2_role_name;
    rdsSecretName = outputs.rds_secret_name?.value || outputs.rds_secret_name;
    cloudwatchDashboardName = outputs.cloudwatch_dashboard_name?.value || outputs.cloudwatch_dashboard_name;

    // New outputs
    autoscalingGroupName = outputs.autoscaling_group_name?.value || outputs.autoscaling_group_name;
    albDnsName = outputs.alb_dns_name?.value || outputs.alb_dns_name;
    albTargetGroupArn = outputs.alb_target_group_arn?.value || outputs.alb_target_group_arn;
    rdsInstanceEndpoint = outputs.rds_instance_endpoint?.value || outputs.rds_instance_endpoint;
    dynamodbTableName = outputs.dynamodb_table_name?.value || outputs.dynamodb_table_name;
    dynamodbTableArn = outputs.dynamodb_table_arn?.value || outputs.dynamodb_table_arn;
  });

  // --- Existing tests (unaltered) ---
  describe("S3 Bucket", () => {
    let s3: S3Client;
    beforeAll(() => {
      s3 = new S3Client({ region: bucketRegion });
    });

    test("bucket exists in expected region", async () => {
      const loc = await s3.send(new GetBucketLocationCommand({ Bucket: bucketName }));
      const location = loc.LocationConstraint as string | undefined;
      const actualRegion =
        location === undefined || location === "" || location === "US"
          ? "us-west-2"
          : location;
      expect(actualRegion).toBe(bucketRegion);
    });

    test("bucket has versioning enabled", async () => {
      const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(ver.Status).toBe("Enabled");
    });

    test("bucket is encrypted with AES256", async () => {
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      const rules = enc.ServerSideEncryptionConfiguration?.Rules || [];
      expect(rules.some(r => r.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === "AES256")).toBe(true);
    });

    test("bucket tags include environment, managedBy, project", async () => {
      const tagRes = await s3.send(new GetBucketTaggingCommand({ Bucket: bucketName }));
      const tags = Object.fromEntries((tagRes.TagSet ?? []).map(t => [t.Key, t.Value]));
      expect(tags.Environment).toBe(outputs.bucket_tags?.Environment || "prod");
      expect(tags.ManagedBy).toBe("terraform");
      expect(tags.Project).toBe("ExampleProject");
    });
  });

  describe("Secrets Manager", () => {
    let secrets: SecretsManagerClient;
    beforeAll(() => {
      secrets = new SecretsManagerClient({ region: testRegion });
    });

    test("RDS secret exists", async () => {
      const secretName = rdsSecretName || `secure-rds-password-${environment}`;
      const res = await secrets.send(new DescribeSecretCommand({ SecretId: secretName }));
      expect(res.Name).toBe(secretName);
      expect(res.Description).toMatch(/RDS instance password/);
    });
  });

  describe("VPC", () => {
    let ec2: EC2Client;
    beforeAll(() => {
      ec2 = new EC2Client({ region: testRegion });
    });

    test("VPC exists", async () => {
      if (vpcId) {
        const vpcs = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
        expect(vpcs.Vpcs?.length).toBe(1);
        const vpc = vpcs.Vpcs?.[0];
        expect(vpc).toBeDefined();
        expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
        expect(vpc?.Tags?.some(t => t.Key === "ManagedBy" && t.Value === "terraform")).toBe(true);
      } else {
        const vpcs = await ec2.send(new DescribeVpcsCommand({ Filters: [{ Name: "tag:Name", Values: ["secure-prod-vpc"] }] }));
        expect(vpcs.Vpcs?.length).toBeGreaterThan(0);
        const vpc = vpcs.Vpcs && vpcs.Vpcs[0];
        expect(vpc).toBeDefined();
        expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
        expect(vpc?.Tags?.some(t => t.Key === "ManagedBy" && t.Value === "terraform")).toBe(true);
      }
    });
  });

  describe("Network ACL", () => {
    let ec2: EC2Client;
    beforeAll(() => {
      ec2 = new EC2Client({ region: testRegion });
    });

    test("NACL exists and has correct rules", async () => {
      let nacl;
      if (naclId) {
        const nacls = await ec2.send(new DescribeNetworkAclsCommand({ NetworkAclIds: [naclId] }));
        nacl = nacls.NetworkAcls?.[0];
      } else {
        const nacls = await ec2.send(new DescribeNetworkAclsCommand({}));
        nacl = nacls.NetworkAcls?.find(nacl =>
          nacl.Tags?.some(t => t.Key === "Environment" && t.Value === environment)
        );
      }
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

  describe("IAM Role and Policies", () => {
    let iam: IAMClient;
    beforeAll(() => {
      iam = new IAMClient({ region: testRegion });
    });

    test("EC2 role exists, policies attached", async () => {
      const roleName = ec2RoleName || `secure-ec2-role-${environment}`;
      const roleRes = await iam.send(new GetRoleCommand({ RoleName: roleName }));
      expect(roleRes.Role).toBeDefined();
      expect(roleRes.Role?.RoleName).toBe(roleName);
      expect(roleRes.Role?.Tags?.some(t => t.Key === "ManagedBy" && t.Value === "terraform")).toBe(true);

      const attachedPoliciesRes = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
      const policyNames = attachedPoliciesRes.AttachedPolicies?.map(p => p.PolicyName) || [];

      expect(policyNames).toEqual(
        expect.arrayContaining([
          outputs.cloudwatch_logs_policy_name,
          outputs.s3_access_policy_name
        ])
      );
    });
  });

  describe("CloudWatch Dashboard", () => {
    let cw: CloudWatchClient;
    beforeAll(() => {
      cw = new CloudWatchClient({ region: testRegion });
    });

    test("dashboard exists", async () => {
      const dashboardName = cloudwatchDashboardName || `secure-dashboard-${environment}`;
      const res = await cw.send(new GetDashboardCommand({ DashboardName: dashboardName }));
      expect(res.DashboardName).toBe(dashboardName);
      expect(res.DashboardBody).toBeDefined();
      expect(JSON.parse(res.DashboardBody!).widgets.length).toBeGreaterThan(0);
    });
  });

  // --- New tests for new resources ---

  describe("EC2 Auto Scaling Group", () => {
    let ec2: EC2Client;
    beforeAll(() => {
      ec2 = new EC2Client({ region: testRegion });
    });

    test("Auto Scaling Group exists and has at least 3 t3.micro instances", async () => {
      expect(autoscalingGroupName).toBeDefined();
      const describeInstancesRes = await ec2.send(new DescribeInstancesCommand({
        Filters: [
          { Name: "tag:aws:autoscaling:groupName", Values: [autoscalingGroupName] }
        ]
      }));
      const instances = describeInstancesRes.Reservations?.flatMap(r => r.Instances ?? []) ?? [];
      expect(instances.length).toBeGreaterThanOrEqual(3);
      instances.forEach(instance => {
        expect(instance.InstanceType).toBe("t3.micro");
        expect(instance.State?.Name).toBe("running");
      });
    });
  });

  describe("Application Load Balancer", () => {
    let elbv2: ElasticLoadBalancingV2Client;
    beforeAll(() => {
      elbv2 = new ElasticLoadBalancingV2Client({ region: testRegion });
    });

    test("ALB exists and is accessible", async () => {
      expect(albDnsName).toBeDefined();
      const lbRes = await elbv2.send(new DescribeLoadBalancersCommand({ Names: [albDnsName] }));
      expect(lbRes.LoadBalancers?.length).toBeGreaterThan(0);
      const alb = lbRes.LoadBalancers![0];
      expect(alb.DNSName).toBe(albDnsName);
      expect(alb.Scheme).toBe("internet-facing");
      expect(alb.Type).toBe("application");
    });

    test("ALB has HTTPS listener on port 443", async () => {
      const lbRes = await elbv2.send(new DescribeLoadBalancersCommand({ Names: [albDnsName] }));
      const albArn = lbRes.LoadBalancers![0].LoadBalancerArn;
      const listenersRes = await elbv2.send(new DescribeListenersCommand({ LoadBalancerArn: albArn }));
      expect(listenersRes.Listeners?.some((l: Listener) => l.Port === 443 && l.Protocol === "HTTPS")).toBe(true);
    });

    test("ALB forwards to the correct target group", async () => {
      const lbRes = await elbv2.send(new DescribeLoadBalancersCommand({ Names: [albDnsName] }));
      const albArn = lbRes.LoadBalancers![0].LoadBalancerArn;
      const tgRes = await elbv2.send(new DescribeTargetGroupsCommand({ LoadBalancerArn: albArn }));
      expect(tgRes.TargetGroups?.some((tg: TargetGroup) => tg.TargetGroupArn === albTargetGroupArn)).toBe(true);
    });
  });

  describe("RDS Multi-AZ Instance", () => {
    let rds: RDSClient;
    beforeAll(() => {
      rds = new RDSClient({ region: testRegion });
    });

    test("RDS DB instance is provisioned, Multi-AZ, and healthy", async () => {
      expect(rdsInstanceEndpoint).toBeDefined();
      const dbRes = await rds.send(new DescribeDBInstancesCommand({}));
      const dbInstance = dbRes.DBInstances?.find(db => db.Endpoint?.Address === rdsInstanceEndpoint);
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(["available", "backing-up"]).toContain(dbInstance?.DBInstanceStatus);
      expect(dbInstance?.Engine).toMatch(/mysql|postgres/i);
    });
  });

  describe("DynamoDB Table with Auto Scaling", () => {
    let dynamodb: DynamoDBClient;
    beforeAll(() => {
      dynamodb = new DynamoDBClient({ region: testRegion });
    });

    test("DynamoDB table exists and is active", async () => {
      expect(dynamodbTableName).toBeDefined();
      const tableRes = await dynamodb.send(new DescribeTableCommand({ TableName: dynamodbTableName }));
      expect(tableRes.Table?.TableStatus).toBe("ACTIVE");
      expect(tableRes.Table?.TableArn).toBe(dynamodbTableArn);
    });
  });
});