import { CloudTrailClient, DescribeTrailsCommand } from "@aws-sdk/client-cloudtrail";
import { DescribeVpcsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from "@aws-sdk/client-elastic-load-balancing-v2";
import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";
import { GetBucketLocationCommand, GetBucketTaggingCommand, ListBucketsCommand, ListBucketsOutput, S3Client } from "@aws-sdk/client-s3";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { ListWebACLsCommand, WAFV2Client, WebACLSummary } from "@aws-sdk/client-wafv2";
import fs from "fs";
import path from "path";

// Load Terraform outputs from the correct location
const outputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
if (!fs.existsSync(outputsPath)) {
  throw new Error(`Terraform outputs file not found at: ${outputsPath}`);
}
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

// Helper to unwrap Terraform output values
function getOutputValue(key: string) {
  const val = outputs[key];
  if (val && typeof val === "object" && "value" in val) return val.value;
  return val;
}

// Always use region from Terraform outputs, never from environment
const region = getOutputValue("region") || getOutputValue("aws_region") || "us-west-2";
const vpcId = getOutputValue("vpc_id");
const mainBucketName = getOutputValue("s3_bucket_name");
const rdsEndpoint = getOutputValue("rds_endpoint");
const lbDns = getOutputValue("load_balancer_dns");
const trailBucket = getOutputValue("cloudtrail_bucket_name");
const webAclArn = getOutputValue("web_acl_arn");

// Tag conventions
const environment = process.env.ENVIRONMENT || "prod";
const vpcTag = { Key: "Name", Value: "main-vpc" };
const s3Tag = { Key: "Environment", Value: environment };

describe("Terraform AWS Infrastructure Integration", () => {
  let actualAccount: string;

  beforeAll(async () => {
    const sts = new STSClient({ region });
    let identity;
    try {
      identity = await sts.send(new GetCallerIdentityCommand({}));
    } catch (err) {
      console.error("Error getting AWS caller identity:", err);
      throw err;
    }
    actualAccount = identity.Account!;
    console.log(`Running integration tests in AWS account: ${actualAccount}, region: ${region}`);
  });

  test("VPC exists with correct tags", async () => {
    const ec2 = new EC2Client({ region });
    let vpcs;
    try {
      vpcs = await ec2.send(new DescribeVpcsCommand({}));
    } catch (err) {
      console.error("Error describing VPCs:", err);
      throw err;
    }
    const vpcList = vpcs.Vpcs ?? [];
    const vpc = vpcList.find((v) =>
      v.VpcId === vpcId &&
      (v.Tags ?? []).some((t) => t.Key === vpcTag.Key && t.Value === vpcTag.Value)
    );
    if (!vpc) {
      console.error("VPC with ID", vpcId, "and tag", vpcTag, "not found. Available:", vpcList.map(v => v.VpcId));
    }
    expect(vpc).toBeDefined();
  });

  test("Main S3 bucket exists with correct tags and region", async () => {
    const s3 = new S3Client({ region });
    // Defensive: check bucket exists in list
    let buckets;
    try {
      buckets = await s3.send(new ListBucketsCommand({})) as ListBucketsOutput;
    } catch (err) {
      console.error("Error listing S3 buckets:", err);
      throw err;
    }
    const mainBucket = (buckets.Buckets ?? []).find((b: { Name?: string }) => b.Name === mainBucketName);
    if (!mainBucket) {
      console.error("Main S3 bucket", mainBucketName, "not found. Available:", buckets.Buckets?.map((b: { Name?: string }) => b.Name));
    }
    expect(mainBucket).toBeDefined();

    // Check region
    try {
      const location = await s3.send(new GetBucketLocationCommand({ Bucket: mainBucketName }));
      // AWS returns "EU" for Europe (Ireland), "us-west-2" for Oregon, etc.
      // If region is null or "US", it's us-east-1.
      let bucketRegion = location.LocationConstraint;
      // Normalize for comparison
      const normalizedBucketRegion =
        !bucketRegion || String(bucketRegion) === "US"
          ? "us-east-1"
          : bucketRegion;
      expect(normalizedBucketRegion).toBe(region);
    } catch (err) {
      console.error("Error getting bucket location for", mainBucketName, err);
      throw err;
    }

    // Check tags
    try {
      const tagging = await s3.send(new GetBucketTaggingCommand({ Bucket: mainBucketName }));
      const envTag = (tagging.TagSet ?? []).find(t => t.Key === s3Tag.Key && t.Value === s3Tag.Value);
      if (!envTag) {
        console.error("Environment tag", s3Tag, "not found on bucket. Tags:", tagging.TagSet);
      }
      expect(envTag).toBeDefined();
    } catch (err) {
      console.error("Could not get tags for bucket", mainBucketName, err);
      throw err;
    }
  });

  test("RDS instance exists and endpoint matches output", async () => {
    const rds = new RDSClient({ region });
    let dbs;
    try {
      dbs = await rds.send(new DescribeDBInstancesCommand({}));
    } catch (err) {
      console.error("Error describing RDS instances:", err);
      throw err;
    }
    const rdsEndpointHost = rdsEndpoint.split(":")[0]; // Remove port if present

    const db = (dbs.DBInstances ?? []).find(d =>
      d.Endpoint?.Address && rdsEndpointHost === d.Endpoint.Address
    );
    if (!db) {
      console.error("RDS instance with endpoint", rdsEndpoint, "not found. Available:", dbs.DBInstances?.map(d => d.Endpoint?.Address));
    }
    expect(db).toBeDefined();
    // Optionally check region via AvailabilityZone
    if (db?.AvailabilityZone) {
      expect(db.AvailabilityZone.startsWith(region)).toBe(true);
    }
  });

  test("Application Load Balancer exists and DNS matches output", async () => {
    const elbv2 = new ElasticLoadBalancingV2Client({ region });
    let lbs;
    try {
      lbs = await elbv2.send(new DescribeLoadBalancersCommand({}));
    } catch (err) {
      console.error("Error describing load balancers:", err);
      throw err;
    }
    const lb = (lbs.LoadBalancers ?? []).find((l) => l.DNSName === lbDns);
    if (!lb) {
      console.error("ALB with DNS", lbDns, "not found. Available:", lbs.LoadBalancers?.map(l => l.DNSName));
    }
    expect(lb).toBeDefined();
    // Optionally check region via AvailabilityZones
    if (lb?.AvailabilityZones) {
      expect(lb.AvailabilityZones.some(z => z.ZoneName?.startsWith(region))).toBe(true);
    }
  });

  test("CloudTrail exists and bucket matches output", async () => {
    const cloudtrail = new CloudTrailClient({ region });
    let trails;
    try {
      trails = await cloudtrail.send(new DescribeTrailsCommand({}));
    } catch (err) {
      console.error("Error describing CloudTrails:", err);
      throw err;
    }
    const trail = (trails.trailList ?? []).find(t =>
      t.S3BucketName === trailBucket
    );
    if (!trail) {
      console.error("CloudTrail with bucket", trailBucket, "not found. Available:", trails.trailList?.map(t => t.S3BucketName));
    }
    expect(trail).toBeDefined();
    // Optionally check region
    if (trail?.HomeRegion) {
      expect(trail.HomeRegion).toBe(region);
    }
  });

  test("WAF Web ACL exists and ARN matches output", async () => {
    const waf = new WAFV2Client({ region });
    let acls;
    try {
      acls = await waf.send(new ListWebACLsCommand({ Scope: "REGIONAL" }));
    } catch (err) {
      console.error("Error listing WAF Web ACLs:", err);
      throw err;
    }
    const acl = (acls.WebACLs ?? []).find((a: WebACLSummary) => a.ARN === webAclArn);
    if (!acl) {
      console.error("Web ACL with ARN", webAclArn, "not found. Available:", acls.WebACLs?.map(a => a.ARN));
    }
    expect(acl).toBeDefined();
    // Optionally, check association with the ALB using ListResourcesForWebACLCommand if needed
  });
});
