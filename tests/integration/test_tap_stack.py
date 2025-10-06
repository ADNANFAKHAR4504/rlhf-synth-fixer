import {
  EC2Client,
  DescribeVpcsCommand
} from "@aws-sdk/client-ec2";
import {
  ELBv2Client,
  DescribeLoadBalancersCommand
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  RDSClient,
  DescribeDBInstancesCommand
} from "@aws-sdk/client-rds";
import {
  S3Client,
  HeadBucketCommand
} from "@aws-sdk/client-s3";
import {
  LambdaClient,
  GetFunctionCommand
} from "@aws-sdk/client-lambda";
import fs from "fs";
import path from "path";

describe("TapStack Integration Tests (Environment Aware)", () => {
  const baseDir = path.join(__dirname, "..", "..", "cfn-outputs");
  const outputsPath = path.join(baseDir, "flat-outputs.json");

  let outputs: Record<string, string> = {};
  const envSuffix = process.env.ENVIRONMENT_SUFFIX || "";
  const region = process.env.AWS_REGION || "us-east-2";

  // AWS Clients
  const ec2 = new EC2Client({ region });
  const alb = new ELBv2Client({ region });
  const rds = new RDSClient({ region });
  const s3 = new S3Client({ region });
  const lambda = new LambdaClient({ region });

  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`❌ Missing outputs file: ${outputsPath}`);
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  });

  function getOutput(keyBase: string): string {
    const key = `${keyBase}${envSuffix}`;
    const value = outputs[key];
    if (!value) {
      throw new Error(`Missing key ${key} in outputs`);
    }
    return value;
  }

  test("VPC exists in AWS", async () => {
    const vpcId = getOutput("VPCId");
    expect(vpcId).toMatch(/^vpc-/);

    const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
    expect(res.Vpcs?.[0]?.VpcId).toBe(vpcId);
  });

  test("Application Load Balancer is active and reachable", async () => {
    const albDNS = getOutput("LoadBalancerDNS");
    expect(albDNS).toContain("elb.amazonaws.com");

    const lbName = albDNS.split(".")[0];
    const res = await alb.send(new DescribeLoadBalancersCommand({ Names: [lbName] }));
    expect(res.LoadBalancers?.[0]?.DNSName).toBe(albDNS);
  });

  test("RDS database endpoint is valid", async () => {
    const dbEndpoint = getOutput("DatabaseEndpoint");
    expect(dbEndpoint).toContain("rds.amazonaws.com");

    const res = await rds.send(new DescribeDBInstancesCommand({}));
    const found = res.DBInstances?.some(db => db.Endpoint?.Address === dbEndpoint);
    expect(found).toBeTruthy();
  });

  test("S3 bucket is accessible", async () => {
    const bucket = getOutput("S3BucketName");
    expect(bucket).toBeDefined();

    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (err: any) {
      throw new Error(`❌ S3 bucket not accessible: ${err.message}`);
    }
  });

  test("Lambda function is deployed and active", async () => {
    const lambdaFn = getOutput("LambdaFunctionName");
    expect(lambdaFn).toBeDefined();

    const res = await lambda.send(new GetFunctionCommand({ FunctionName: lambdaFn }));
    expect(res.Configuration?.FunctionName).toBe(lambdaFn);
  });
});
