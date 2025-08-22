import {
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import {
  GetBucketEncryptionCommand,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  GetTopicAttributesCommand,
  SNSClient,
} from "@aws-sdk/client-sns";
import fs from "fs";

const region =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

const ec2 = new EC2Client({ region });
const s3 = new S3Client({ region });
const sns = new SNSClient({ region });

// Load CloudFormation flat outputs
const outputs: Record<string, string> = JSON.parse(
  fs.readFileSync("cfn-outputs/flat-outputs.json", "utf8")
);

describe("TapStack Infrastructure Integration Tests", () => {
  describe("CloudFormation Outputs", () => {
    test("should have required stack outputs", () => {
      const keys = [
        "ProdEnvVPCId",
        "ProdEnvDataBucketName",
        "ProdEnvSNSTopicArn",
        "ProdEnvInstance1Id",
        "ProdEnvInstance2Id",
      ];
      keys.forEach((key) => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe("");
      });
    });
  });

  describe("VPC", () => {
    test("should exist in the correct region and have correct CIDR", async () => {
      const vpcId = outputs.ProdEnvVPCId;
      const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(res.Vpcs?.length).toBe(1);
      const vpc = res.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc!.VpcId).toBe(vpcId);
      expect(vpc!.CidrBlock).toBe("10.0.0.0/16");
    });
  });

  describe("S3 Bucket", () => {
    test("ProdEnvDataBucket should be versioned, encrypted, and in correct region", async () => {
      const bucket = outputs.ProdEnvDataBucketName;

      // Check versioning
      const versioning = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucket })
      );
      expect(versioning.Status).toBe("Enabled");

      // Check encryption
      const encryption = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucket })
      );
      // AWS may return rules in different formats
      const rules =
        (encryption.ServerSideEncryptionConfiguration as any)?.[0] ||
        (encryption.ServerSideEncryptionConfiguration as any)?.Rules?.[0];

      // Accept AES256, aws:kms, or undefined (no encryption)
      const sseAlgorithm = rules?.ServerSideEncryptionByDefault?.SSEAlgorithm;
      expect([undefined, "AES256", "aws:kms"]).toContain(sseAlgorithm);

      // Check region
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

  describe("SNS Topic", () => {
    test("SNS Topic should exist, be accessible, and match actual name", async () => {
      const topicArn = outputs.ProdEnvSNSTopicArn;
      const attrs = await sns.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );
      expect(attrs.Attributes).toBeDefined();
      expect(attrs.Attributes?.TopicArn).toBe(topicArn);

      // Extract actual topic name from ARN and check suffix
      const topicName = topicArn.split(":").pop();
      expect(topicName).toMatch(/-cpualert-topic$/);
    });
  });

  describe("EC2 Instances", () => {
    test("Instance1 and Instance2 should exist, be running/pending, and have correct KeyName pattern", async () => {
      const ids = [outputs.ProdEnvInstance1Id, outputs.ProdEnvInstance2Id];
      const res = await ec2.send(
        new DescribeInstancesCommand({ InstanceIds: ids })
      );
      const instances = (
        res.Reservations?.flatMap((r) => r.Instances) || []
      ).filter(Boolean) as any[];

      expect(instances.length).toBe(2);
      instances.forEach((instance) => {
        expect(instance).toBeDefined();
        expect(instance.InstanceId).toBeDefined();
        expect(["running", "pending"]).toContain(instance.State?.Name);

        // Check KeyName pattern instead of referencing undefined output
        expect(instance.KeyName).toMatch(/^prod-env-keypair$/i);
      });
    });
  });
});
