import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from "@aws-sdk/client-ec2";
import {
  S3Client,
  HeadBucketCommand,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  GetBucketTaggingCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from "@aws-sdk/client-s3";
import { KMSClient, DescribeKeyCommand } from "@aws-sdk/client-kms";
import {
  DynamoDBClient,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";
import {
  IAMClient,
  GetInstanceProfileCommand,
  GetRoleCommand,
} from "@aws-sdk/client-iam";
import * as fs from "fs";
import * as path from "path";

type TfOutputValue<T> = {
  sensitive: boolean;
  type: any;
  value: T;
};
type StructuredOutputs = {
  vpc_id?: TfOutputValue<string>;
  public_subnet_id?: TfOutputValue<string>;
  private_subnet_ids?: TfOutputValue<string[]>;
  bastion_public_ip?: TfOutputValue<string>;
  app_instance_id?: TfOutputValue<string>;
  app_s3_bucket?: TfOutputValue<string>;
  kms_key_arn?: TfOutputValue<string>;
  ssh_key_name_effective?: TfOutputValue<string>;
};

function readStructuredOutputs(): StructuredOutputs {
  const p = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  if (!fs.existsSync(p)) {
    throw new Error(`Outputs file not found at ${p}`);
  }
  return JSON.parse(fs.readFileSync(p, "utf8")) as StructuredOutputs;
}

async function retry<T>(fn: () => Promise<T>, attempts = 8, baseMs = 800): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(1.7, i) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

const outputs = readStructuredOutputs();
const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

const ec2 = new EC2Client({ region: REGION });
const s3 = new S3Client({ region: REGION });
const kms = new KMSClient({ region: REGION });
const dynamo = new DynamoDBClient({ region: REGION });
const iam = new IAMClient({ region: REGION });

//
// TEST SUITE
//
describe("LIVE Integration Tests for tap_stack.tf", () => {
  // VPC Tests
  test("VPC exists", async () => {
    expect(outputs.vpc_id?.value).toBeDefined();
    const res = await retry(() =>
      ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id!.value] }))
    );
    expect(res.Vpcs?.length).toBe(1);
  });

  test("Public subnet exists", async () => {
    const res = await ec2.send(
      new DescribeSubnetsCommand({ SubnetIds: [outputs.public_subnet_id!.value] })
    );
    expect(res.Subnets?.length).toBe(1);
  });

  test("Private subnets exist", async () => {
    const res = await ec2.send(
      new DescribeSubnetsCommand({ SubnetIds: outputs.private_subnet_ids!.value })
    );
    expect(res.Subnets?.length).toBeGreaterThanOrEqual(2);
  });

  // EC2 Tests
  test("App instance exists", async () => {
    const res = await ec2.send(
      new DescribeInstancesCommand({ InstanceIds: [outputs.app_instance_id!.value] })
    );
    expect(res.Reservations?.[0].Instances?.length).toBe(1);
  });

  test("Bastion has valid public IP", () => {
    expect(outputs.bastion_public_ip?.value).toMatch(
      /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
    );
  });

  // S3 Tests
  describe("App S3 Bucket checks", () => {
    const bucket = outputs.app_s3_bucket?.value!;
    test("Bucket exists", async () => {
      await expect(retry(() => s3.send(new HeadBucketCommand({ Bucket: bucket })))).resolves.toBeTruthy();
    });

    test("Bucket has versioning enabled", async () => {
      const res = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
      expect(res.Status).toBe("Enabled");
    });

    test("Bucket has encryption enabled", async () => {
      const res = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
      expect(res.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
    });

    test("Bucket blocks public access", async () => {
      const res = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
      expect(res.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(res.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    });
  });

  // KMS
  test("KMS key is enabled", async () => {
    const res = await kms.send(new DescribeKeyCommand({ KeyId: outputs.kms_key_arn!.value }));
    expect(res.KeyMetadata?.Enabled).toBe(true);
  });

  // IAM
  test("IAM roles exist", async () => {
    const profile = await iam.send(new GetInstanceProfileCommand({ InstanceProfileName: "prod-app-profile" }));
    expect(profile.InstanceProfile?.Roles?.[0].RoleName).toBeDefined();

    const role = await iam.send(new GetRoleCommand({ RoleName: "prod-app-role" }));
    expect(role.Role?.Arn).toContain("prod-app-role");
  });

  // DynamoDB
  test("DynamoDB lock table exists", async () => {
    const res = await dynamo.send(new DescribeTableCommand({ TableName: "prod-terraform-locks" }));
    expect(res.Table?.TableStatus).toBe("ACTIVE");
  });

  //
  // Edge Cases
  //
  test("Invalid subnet lookup should fail", async () => {
    await expect(
      ec2.send(new DescribeSubnetsCommand({ SubnetIds: ["subnet-00000000000000000"] }))
    ).rejects.toBeTruthy();
  });

  test("Bucket lookup with random name fails", async () => {
    await expect(
      s3.send(new HeadBucketCommand({ Bucket: "nonexistent-random-bucket-xyz123" }))
    ).rejects.toBeTruthy();
  });
});
