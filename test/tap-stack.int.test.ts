import { CloudTrailClient, DescribeTrailsCommand } from "@aws-sdk/client-cloudtrail";
import type { Vpc as AwsVpc, Tag } from "@aws-sdk/client-ec2";
import { DescribeVpcsCommand, EC2Client } from "@aws-sdk/client-ec2";
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from "@aws-sdk/client-elastic-load-balancing-v2";
import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";
import { Bucket, GetBucketTaggingCommand, ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
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

// Validate required output keys
const requiredKeys = [
  "vpc_id",
  "s3_bucket_name",
  "rds_endpoint",
  "load_balancer_dns",
  "cloudtrail_bucket_name",
  "web_acl_arn"
];
for (const key of requiredKeys) {
  if (!(key in outputs)) {
    throw new Error(`Missing required output key: ${key}`);
  }
}

// Detect region from outputs or env
const region = process.env.AWS_REGION || outputs["region"] || outputs["aws_region"];
if (!region) {
  throw new Error("AWS region not set in environment or outputs.");
}

// Tag conventions
const environment = process.env.ENVIRONMENT || "prod";
const vpcTag = { Key: "Name", Value: "main-vpc" };
const s3Tag = { Key: "Environment", Value: environment };

interface Vpc {
  VpcId: string;
  Tags?: { Key: string; Value: string }[];
}

interface S3Bucket {
  Name: string;
}

interface DBInstance {
  DBInstanceIdentifier: string;
  Endpoint?: { Address: string };
  TagList?: { Key: string; Value: string }[];
}

interface LoadBalancer {
  LoadBalancerName?: string;
  DNSName?: string;
  Tags?: { Key: string; Value: string }[];
}

interface Trail {
  Name: string;
  S3BucketName: string;
  Tags?: { Key: string; Value: string }[];
}

interface WebACL {
  Name: string;
  ARN: string;
  Tags?: { Key: string; Value: string }[];
}

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
    const vpc = vpcList.find((v: AwsVpc) =>
      (v.Tags ?? []).some((t: Tag) => t.Key === vpcTag.Key && t.Value === vpcTag.Value)
    );
    // Defensive check for VpcId
    expect(vpc).toBeDefined();
    expect(vpc?.VpcId).toBe(outputs["vpc_id"]);
  });

  test("Main S3 bucket exists with correct tags", async () => {
    const s3 = new S3Client({ region });
    let buckets;
    try {
      buckets = await s3.send(new ListBucketsCommand({}));
    } catch (err) {
      console.error("Error listing S3 buckets:", err);
      throw err;
    }
    const mainBucketName = outputs["s3_bucket_name"];
    const mainBucket = (buckets.Buckets ?? []).find((b: Bucket) => b.Name === mainBucketName);
    if (!mainBucket) {
      console.error("Main S3 bucket", mainBucketName, "not found. Available:", buckets.Buckets?.map(b => b.Name));
    }
    expect(mainBucket).toBeDefined();

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
    const rdsEndpoint = outputs["rds_endpoint"];
    const db = (dbs.DBInstances ?? []).find(d =>
      d.Endpoint?.Address && rdsEndpoint.includes(d.Endpoint.Address)
    );
    if (!db) {
      console.error("RDS instance with endpoint", rdsEndpoint, "not found. Available:", dbs.DBInstances?.map(d => d.Endpoint?.Address));
    }
    expect(db).toBeDefined();
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
    const lbDns = outputs["load_balancer_dns"];
    const lb = (lbs.LoadBalancers ?? []).find((l: LoadBalancer) =>
      l.DNSName === lbDns
    );
    if (!lb) {
      console.error("ALB with DNS", lbDns, "not found. Available:", lbs.LoadBalancers?.map(l => l.DNSName));
    }
    expect(lb).toBeDefined();
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
    const trailBucket = outputs["cloudtrail_bucket_name"];
    const trail = (trails.trailList ?? []).find(t =>
      t.S3BucketName === trailBucket
    );
    if (!trail) {
      console.error("CloudTrail with bucket", trailBucket, "not found. Available:", trails.trailList?.map(t => t.S3BucketName));
    }
    expect(trail).toBeDefined();
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
    const webAclArn = outputs["web_acl_arn"];
    const acl = (acls.WebACLs ?? []).find((a: WebACLSummary) => a.ARN === webAclArn);
    if (!acl) {
      console.error("Web ACL with ARN", webAclArn, "not found. Available:", acls.WebACLs?.map(a => a.ARN));
    }
    expect(acl).toBeDefined();
  });
});
