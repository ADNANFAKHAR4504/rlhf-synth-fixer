import {
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import {
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  GetWebACLCommand,
  WAFV2Client,
} from "@aws-sdk/client-wafv2";
import fs from "fs";

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const alb = new ElasticLoadBalancingV2Client({ region });
const rds = new RDSClient({ region });
const waf = new WAFV2Client({ region });

// Load outputs
const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync("cfn-outputs/flat-outputs.json", "utf8")
);

describe("TapStack Infrastructure Integration Tests", () => {
  describe("CloudFormation Outputs", () => {
    test("should have required stack outputs", () => {
      const keys = [
        "VPCId",
        "LoadBalancerDNS",
        "RDSEndpoint",
        "S3BucketName",
        "CloudTrailBucketName",
        "WebACLId",
        "AutoScalingGroupName",
      ];
      keys.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe("");
      });
    });
  });

  describe("VPC", () => {
    test("should exist in the correct region", async () => {
      const vpcId = outputs.VPCId;
      const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(res.Vpcs?.length).toBe(1);
      expect(res.Vpcs?.[0].VpcId).toBe(vpcId);
      expect(res.Vpcs?.[0].CidrBlock).toBeDefined();
    });
  });

  describe("S3 Buckets", () => {
    test("App S3 bucket should be versioned", async () => {
      const bucket = outputs.S3BucketName;
      const versioning = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucket })
      );
      expect(versioning.Status).toBe("Enabled");
    });

    test("CloudTrail bucket should be in correct region", async () => {
      const bucket = outputs.CloudTrailBucketName;
      const location = await s3.send(
        new GetBucketLocationCommand({ Bucket: bucket })
      );
      // S3 returns undefined, null, or "" in us-east-1, depending on SDK versions
      const expectedRegionSet = region === "us-east-1"
        ? [undefined, null, "", "us-east-1"]
        : [region];
      expect(expectedRegionSet).toContain(location.LocationConstraint);
    });
  });

  describe("Application Load Balancer", () => {
    test("should exist and have HTTP listener", async () => {
      const albDns = outputs.LoadBalancerDNS;
      // Real ALB name used in CF
      const albName = `${process.env.PROJECT || "myproject"}-${process.env.ENVIRONMENT || "dev"}-ALB`;

      const res = await alb.send(
        new DescribeLoadBalancersCommand({ Names: [albName] })
      );
      expect(res.LoadBalancers?.[0].DNSName).toBe(albDns);

      const lbArn = res.LoadBalancers?.[0].LoadBalancerArn;
      const listeners = await alb.send(
        new DescribeListenersCommand({ LoadBalancerArn: lbArn })
      );
      const ports = listeners.Listeners?.map(l => l.Port);
      expect(ports).toContain(80);
    });
  });

  describe("RDS Instance", () => {
    test("should exist and be running", async () => {
      const endpoint = outputs.RDSEndpoint;
      const res = await rds.send(new DescribeDBInstancesCommand({}));
      const instance = res.DBInstances?.find(db =>
        db.Endpoint?.Address === endpoint
      );
      expect(instance).toBeDefined();
      expect(instance?.DBInstanceStatus).toBe("available");
      expect(instance?.Engine).toBe("postgres");
    });
  });

  describe("WAF Web ACL", () => {
    test("should exist with AWS managed rules", async () => {
      const webAclId = outputs.WebACLId;
      const res = await waf.send(
        new GetWebACLCommand({
          Id: webAclId,
          Name: `${process.env.PROJECT || "myproject"}-${process.env.ENVIRONMENT || "dev"}-WebACL`,
          Scope: "REGIONAL",
        })
      );
      expect(res.WebACL?.Id).toBe(webAclId);
      expect(res.WebACL?.Rules?.length).toBeGreaterThan(0);
    });
  });
});
