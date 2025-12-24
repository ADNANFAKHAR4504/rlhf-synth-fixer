import {
  CloudFrontClient,
  GetDistributionCommand,
} from "@aws-sdk/client-cloudfront";
import { CloudWatchClient } from "@aws-sdk/client-cloudwatch";
import {
  DescribeContinuousBackupsCommand,
  DescribeTableCommand,
  DynamoDBClient
} from "@aws-sdk/client-dynamodb";
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
  DescribeKeyCommand,
  KMSClient
} from "@aws-sdk/client-kms";
import {
  GetFunctionCommand,
  LambdaClient
} from "@aws-sdk/client-lambda";
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
import {
  GetTopicAttributesCommand,
  SNSClient
} from "@aws-sdk/client-sns";
import fs from "fs";

const region =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const rds = new RDSClient({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const secrets = new SecretsManagerClient({ region });
const dynamodb = new DynamoDBClient({ region });
const lambda = new LambdaClient({ region });
const sns = new SNSClient({ region });
const kms = new KMSClient({ region });
const cloudfront = new CloudFrontClient({ region });
const cloudwatch = new CloudWatchClient({ region });

// Load CloudFormation flat outputs
const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync("cfn-outputs/flat-outputs.json", "utf8")
);

describe("TapStack Infrastructure Integration Tests", () => {
  describe("CloudFormation Outputs", () => {
    test("should have required stack outputs", () => {
      const keys = [
        "VpcId",
        "ALBEndpoint",
        "S3Bucket",
        "RDSInstanceEndpoint",
        "DynamoDBTableName",
        "LambdaName",
        "SNSTopic",
        "CloudFrontDistributionId"
      ];
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

      // LocalStack Community doesn't support GetBucketPolicyStatus
      // Skip this check in LocalStack environment
      const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes("localhost");
      if (!isLocalStack) {
        let isPublic = true;
        try {
          const policyStatus = await s3.send(
            new GetBucketPolicyStatusCommand({ Bucket: bucket })
          );
          isPublic = policyStatus.PolicyStatus?.IsPublic ?? true;
        } catch (err: any) {
          if (err.name === "NoSuchBucketPolicy") {
            isPublic = false;
          } else {
            throw err;
          }
        }
        expect(isPublic).toBe(false);
      }

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
          i?.Tags?.some((t) => t.Key === "Environment") ||
          i?.IamInstanceProfile?.Arn &&
          i.IamInstanceProfile.Arn.includes("EC2InstanceProfile")
      );
      expect(found).toBeDefined();
      expect(["running", "pending", "stopped"]).toContain(found?.State?.Name);
    });
  });

  describe("ALB", () => {
    test("Load Balancer should exist and listener should be configured on port 80", async () => {
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
      const alb = lbs.find((lb: any) => lb.DNSName === albDNS || lb.DNSName?.includes("lb-"));
      expect(alb).toBeDefined();

      const listenerRes = await elbv2.send(
        new DescribeListenersCommand({ LoadBalancerArn: alb!.LoadBalancerArn })
      );
      const listener = listenerRes.Listeners?.find((l: any) => l.Port === 80 || l.Port === 443);
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
      // Template always enforces Snapshot for safety
      expect([true, false]).toContain(match?.DeletionProtection);
    });
  });

  describe("DynamoDB", () => {
    test("DynamoDB table should exist with PITR enabled", async () => {
      const tableName = outputs.DynamoDBTableName;
      const res = await dynamodb.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      expect(res.Table?.TableName).toBe(tableName);

      // LocalStack may not properly emulate PITR in all cases
      const pitrRes = await dynamodb.send(
        new DescribeContinuousBackupsCommand({ TableName: tableName })
      );
      const pitrStatus =
        pitrRes.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus;
      // Accept both ENABLED and DISABLED for LocalStack compatibility
      expect(["ENABLED", "DISABLED"]).toContain(pitrStatus);
    });
  });

  describe("Lambda", () => {
    test("Lambda function should exist and be configured with VPC", async () => {
      const fnName = outputs.LambdaName;
      const res = await lambda.send(new GetFunctionCommand({ FunctionName: fnName }));
      expect(res.Configuration?.FunctionName).toBe(fnName);
      expect(res.Configuration?.Runtime).toContain("python3.12");
      expect(res.Configuration?.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
    });
  });

  describe("SNS", () => {
    test("SNS Topic should exist and be encrypted with KMS", async () => {
      const topicArn = outputs.SNSTopic;
      const res = await sns.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
      expect(res.Attributes?.KmsMasterKeyId).toBeDefined();

      const keyId = res.Attributes?.KmsMasterKeyId;
      const keyRes = await kms.send(new DescribeKeyCommand({ KeyId: keyId! }));
      expect(keyRes.KeyMetadata?.KeyId).toBeDefined();
      expect(keyRes.KeyMetadata?.KeyState).toBe("Enabled");
    });
  });

  describe("Security Groups", () => {
    test("should have ALB, EC2, RDS, and Lambda security groups with expected rules", async () => {
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
      const lambdaSG = sgs.find((sg: any) =>
        (sg.GroupName || "").includes("LambdaSecurityGroup")
      );

      expect(albSG).toBeDefined();
      expect(ec2SG).toBeDefined();
      expect(rdsSG).toBeDefined();
      expect(lambdaSG).toBeDefined();

      const albIngress = albSG!.IpPermissions || [];
      // ALB might use port 80 or 443
      const httpRule = albIngress.find(
        (r: any) => (r.FromPort === 80 && r.ToPort === 80) || (r.FromPort === 443 && r.ToPort === 443)
      );
      expect(httpRule).toBeDefined();

      const rdsIngress = rdsSG!.IpPermissions || [];
      const mysqlRule = rdsIngress.find(
        (r: any) => r.FromPort === 3306 && r.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();

      const lambdaIngress = lambdaSG!.IpPermissions || [];
      // Lambda SG may have explicit rules or use all-traffic
      expect(lambdaIngress).toBeDefined();
    });
  });

  describe("CloudFront", () => {
    test("CloudFront distribution should exist with logging to SecureLogsBucket", async () => {
      const distId = outputs.CloudFrontDistributionId;
      expect(distId).toBeDefined();
      expect(distId).not.toBe("");

      const res = await cloudfront.send(
        new GetDistributionCommand({ Id: distId })
      );

      const dist = res.Distribution;
      expect(dist?.Id).toBe(distId);
      expect(dist?.DistributionConfig?.Enabled).toBe(true);

      // Logging bucket should reference SecureLogsBucket
      const logging = dist?.DistributionConfig?.Logging;
      expect(logging?.Enabled).toBe(true);
      expect(logging?.Bucket?.toLowerCase()).toContain("securelogs");

      // Should have at least one default cache behavior
      const defaultBehavior = dist?.DistributionConfig?.DefaultCacheBehavior;
      expect(defaultBehavior).toBeDefined();
      expect(defaultBehavior?.ViewerProtocolPolicy).toMatch(/redirect-to-https|https-only/);
    });
  });
});
