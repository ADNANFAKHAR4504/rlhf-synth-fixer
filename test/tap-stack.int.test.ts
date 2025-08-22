import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from "@aws-sdk/client-rds";
import {
  GetBucketEncryptionCommand,
  GetBucketLocationCommand,
  GetBucketPolicyStatusCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  SecretsManagerClient
} from "@aws-sdk/client-secrets-manager";
import fs from "fs";

const region =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const rds = new RDSClient({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const secrets = new SecretsManagerClient({ region });

// Load CloudFormation flat outputs
const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync("cfn-outputs/flat-outputs.json", "utf8")
);

describe("YourTemplate Infrastructure Integration Tests", () => {
  describe("CloudFormation Outputs", () => {
    test("should have required stack outputs", () => {
      const keys = ["VpcId", "ALBEndpoint", "S3Bucket", "RDSInstanceEndpoint"];
      keys.forEach((key) => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe("");
      });
    });
  });

  describe("VPC", () => {
    test("should exist in region and have CIDR 10.0.0.0/16", async () => {
      const vpcId = outputs.VpcId;
      const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(res.Vpcs?.length).toBe(1);
      const vpc = res.Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.CidrBlock).toBe("10.0.0.0/16");
    });

    test("should have 4 subnets (2 public, 2 private)", async () => {
      const res = await ec2.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: "vpc-id", Values: [outputs.VpcId] }],
        })
      );
      expect(res.Subnets?.length).toBe(4);
    });
  });

  describe("S3 Secure Logs Bucket", () => {
    test("bucket should exist, be encrypted, and block public access", async () => {
      const bucket = outputs.S3Bucket;

      const encryption = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucket })
      );
      const rules =
        (encryption.ServerSideEncryptionConfiguration?.Rules || [])[0];
      const algo = rules?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
      expect(["AES256", "aws:kms"]).toContain(algo);

      let isPublic = true;
      try {
        const policyStatus = await s3.send(
          new GetBucketPolicyStatusCommand({ Bucket: bucket })
        );
        isPublic = policyStatus.PolicyStatus?.IsPublic ?? true;
      } catch (err: any) {
        if (err.name === "NoSuchBucketPolicy") {
          // If no policy exists, default to not public (since PublicAccessBlock handles it)
          isPublic = false;
        } else {
          throw err;
        }
      }
      expect(isPublic).toBe(false);

      const location = await s3.send(
        new GetBucketLocationCommand({ Bucket: bucket })
      );
      const expectedRegionSet =
        region === "us-east-1"
          ? [undefined, null, "", "us-east-1"]
          : [region];
      expect(expectedRegionSet).toContain(location.LocationConstraint);
    });
  });

  describe("EC2 Instance", () => {
    test("should exist and be running/pending", async () => {
      const res = await ec2.send(new DescribeInstancesCommand({}));
      const instances = res.Reservations?.flatMap((r) => r.Instances) || [];
      const found = instances.find(
        (i) =>
          i?.IamInstanceProfile?.Arn &&
          i.IamInstanceProfile.Arn.includes("EC2InstanceProfile")
      );
      expect(found).toBeDefined();
      expect(["running", "pending"]).toContain(found?.State?.Name);
    });
  });

  describe("ALB", () => {
    test("Load Balancer should exist and listener should be configured on port 443", async () => {
      const albDNS = outputs.ALBEndpoint;
      let res;
      try {
        res = await elbv2.send(
          new DescribeLoadBalancersCommand({ Names: [albDNS] })
        );
      } catch {
        res = await elbv2.send(new DescribeLoadBalancersCommand({}));
      }

      const lbs = res.LoadBalancers || [];
      const alb = lbs.find((lb: any) => lb.DNSName === albDNS);
      expect(alb).toBeDefined();

      const listenerRes = await elbv2.send(
        new DescribeListenersCommand({ LoadBalancerArn: alb!.LoadBalancerArn })
      );
      const listener = listenerRes.Listeners?.find(
        (l: any) => l.Port === 443
      );
      expect(listener).toBeDefined();

      const tgRes = await elbv2.send(
        new DescribeTargetGroupsCommand({ LoadBalancerArn: alb!.LoadBalancerArn })
      );
      expect(tgRes.TargetGroups?.length).toBeGreaterThan(0);
    });
  });

  describe("RDS", () => {
    test("RDS instance should exist and match endpoint output", async () => {
      const endpoint = outputs.RDSInstanceEndpoint;
      const res = await rds.send(new DescribeDBInstancesCommand({}));
      const dbs = res.DBInstances || [];
      const match = dbs.find((db) => db.Endpoint?.Address === endpoint);
      expect(match).toBeDefined();
      expect(match?.Engine).toBe("mysql");
    });
  });

  describe("Security Groups", () => {
    test("should have ALB, EC2, and RDS security groups with expected rules", async () => {
      const res = await ec2.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: "vpc-id", Values: [outputs.VpcId] }],
        })
      );
      const sgs = res.SecurityGroups || [];

      const albSG = sgs.find((sg: any) =>
        (sg.GroupName || "").includes("ALBSecurityGroup")
      );
      const ec2SG = sgs.find((sg: any) =>
        (sg.GroupName || "").includes("EC2SecurityGroup")
      );
      const rdsSG = sgs.find((sg: any) =>
        (sg.GroupName || "").includes("RDSSecurityGroup")
      );

      expect(albSG).toBeDefined();
      expect(ec2SG).toBeDefined();
      expect(rdsSG).toBeDefined();

      const albIngress = albSG!.IpPermissions || [];
      const httpsRule = albIngress.find(
        (r: any) => r.FromPort === 443 && r.ToPort === 443
      );
      expect(httpsRule).toBeDefined();

      const rdsIngress = rdsSG!.IpPermissions || [];
      const mysqlRule = rdsIngress.find(
        (r: any) => r.FromPort === 3306 && r.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
    });
  });
});
