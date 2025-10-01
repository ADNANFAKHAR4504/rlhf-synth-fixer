// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, GetBucketPolicyCommand } from "@aws-sdk/client-s3";
import { KMSClient, DescribeKeyCommand, GetKeyPolicyCommand, GetKeyRotationStatusCommand } from "@aws-sdk/client-kms";
import { SNSClient, GetTopicAttributesCommand, ListSubscriptionsByTopicCommand } from "@aws-sdk/client-sns";
import { SQSClient, GetQueueAttributesCommand } from "@aws-sdk/client-sqs";
import { IAMClient, GetRoleCommand, GetRolePolicyCommand, ListRolePoliciesCommand } from "@aws-sdk/client-iam";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-west-2";
const s3Client = new S3Client({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const sqsClient = new SQSClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let kmsKeyId: string;
  let kmsKeyArn: string;
  let s3BucketName: string;
  let s3BucketArn: string;
  let snsTopicArn: string;
  let sqsQueueUrl: string;
  let sqsDlqUrl: string;
  let s3IamRoleArn: string;
  let sqsIamRoleArn: string;
  let awsAccountId: string;
  let environmentSuffix: string = "pr2999";

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0];
    const stackOutputs = outputs[stackKey];

    kmsKeyId = stackOutputs["kms-key-id"];
    kmsKeyArn = stackOutputs["kms-key-arn"];
    s3BucketName = stackOutputs["s3-bucket-name"];
    s3BucketArn = stackOutputs["s3-bucket-arn"];
    snsTopicArn = stackOutputs["sns-topic-arn"];
    sqsQueueUrl = stackOutputs["sqs-queue-url"];
    sqsDlqUrl = stackOutputs["sqs-dlq-url"];
    s3IamRoleArn = stackOutputs["s3-iam-role-arn"];
    sqsIamRoleArn = stackOutputs["sqs-iam-role-arn"];
    awsAccountId = stackOutputs["aws-account-id"];

    if (!kmsKeyId || !s3BucketName || !snsTopicArn || !sqsQueueUrl || !sqsDlqUrl) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  describe("KMS Key Configuration", () => {
    test("KMS key exists and is configured correctly", async () => {
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );

      expect(KeyMetadata?.KeyId).toBe(kmsKeyId);
      expect(KeyMetadata?.Arn).toBe(kmsKeyArn);
      expect(KeyMetadata?.KeyUsage).toBe("ENCRYPT_DECRYPT");
      expect(KeyMetadata?.KeySpec).toBe("SYMMETRIC_DEFAULT");
      expect(KeyMetadata?.Enabled).toBe(true);
      expect(KeyMetadata?.Description).toBe(`TAP Stack KMS key for ${environmentSuffix} environment`);
      expect(KeyMetadata?.DeletionDate).toBeUndefined();
    }, 20000);

    test("KMS key has rotation enabled", async () => {
      const { KeyRotationEnabled } = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })
      );
      expect(KeyRotationEnabled).toBe(true);
    }, 20000);

    test("KMS key has correct key policy", async () => {
      const { Policy } = await kmsClient.send(
        new GetKeyPolicyCommand({ KeyId: kmsKeyId, PolicyName: "default" })
      );
      
      const policyDoc = JSON.parse(Policy || "{}");
      const rootStatement = policyDoc.Statement?.find((s: any) => s.Sid === "Enable Root Permissions");
      expect(rootStatement?.Principal?.AWS).toContain(`arn:aws:iam::${awsAccountId}:root`);
      expect(rootStatement?.Action).toContain("kms:*");

      const encryptionStatement = policyDoc.Statement?.find((s: any) => s.Sid === "Allow use of the key for encryption/decryption");
      expect(encryptionStatement?.Action).toContain("kms:Encrypt");
      expect(encryptionStatement?.Action).toContain("kms:Decrypt");
    }, 20000);
  });

  describe("S3 Bucket Configuration", () => {
    test("S3 bucket exists with correct name", async () => {
      await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));
      expect(s3BucketName).toBe(`tap-data-bucket-tss-${environmentSuffix}-${awsAccountId}`);
    }, 20000);

    test("S3 bucket has versioning enabled", async () => {
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: s3BucketName })
      );
      expect(Status).toBe("Enabled");
    }, 20000);

    test("S3 bucket has KMS encryption configured", async () => {
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3BucketName })
      );
      
      const rule = ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe("aws:kms");
      expect(rule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);
      expect(rule?.BucketKeyEnabled).toBe(true);
    }, 20000);

    test("S3 bucket has public access blocked", async () => {
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);
  });

  describe("SNS Topic Configuration", () => {
    test("SNS topic exists with correct configuration", async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: snsTopicArn })
      );
      
      expect(Attributes?.TopicArn).toBe(snsTopicArn);
      expect(snsTopicArn).toContain(`tap-notifications-${environmentSuffix}`);
    }, 20000);

    test("SNS topic has correct policy", async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: snsTopicArn })
      );
      
      const policy = JSON.parse(Attributes?.Policy || "{}");
      const ownerStatement = policy.Statement?.find((s: any) => s.Sid === "AllowOwnerFullControl");
      expect(ownerStatement?.Principal?.AWS).toBe(`arn:aws:iam::${awsAccountId}:root`);
      expect(ownerStatement?.Action).toContain("SNS:Publish");
      expect(ownerStatement?.Action).toContain("SNS:Subscribe");

      const publishStatement = policy.Statement?.find((s: any) => s.Sid === "AllowPublishFromAllowedAccounts");
      expect(publishStatement?.Action).toContain("SNS:Publish");
    }, 20000);

    test("SNS topic has SQS subscription", async () => {
      const { Subscriptions } = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: snsTopicArn })
      );
      
      const sqsSubscription = Subscriptions?.find(sub => sub.Protocol === "sqs");
      expect(sqsSubscription).toBeDefined();
      expect(sqsSubscription?.Endpoint).toContain(`tap-processing-queue-${environmentSuffix}`);
    }, 20000);
  });

  describe("SQS Queue Configuration", () => {
    test("Main SQS queue exists with correct configuration", async () => {
      const { Attributes } = await sqsClient.send(
        new GetQueueAttributesCommand({ 
          QueueUrl: sqsQueueUrl,
          AttributeNames: ["All"]
        })
      );
      
      expect(Attributes?.QueueArn).toContain(`tap-processing-queue-${environmentSuffix}`);
      expect(Attributes?.KmsMasterKeyId).toBe(kmsKeyArn);
      expect(Number(Attributes?.KmsDataKeyReusePeriodSeconds)).toBe(300);
      
      // Check DLQ configuration
      const redrivePolicy = JSON.parse(Attributes?.RedrivePolicy || "{}");
      expect(redrivePolicy.deadLetterTargetArn).toContain(`tap-processing-dlq-${environmentSuffix}`);
      expect(redrivePolicy.maxReceiveCount).toBe(3);
    }, 20000);

    test("Dead letter queue exists with correct configuration", async () => {
      const { Attributes } = await sqsClient.send(
        new GetQueueAttributesCommand({ 
          QueueUrl: sqsDlqUrl,
          AttributeNames: ["All"]
        })
      );
      
      expect(Attributes?.QueueArn).toContain(`tap-processing-dlq-${environmentSuffix}`);
      expect(Attributes?.KmsMasterKeyId).toBe(kmsKeyArn);
      expect(Number(Attributes?.KmsDataKeyReusePeriodSeconds)).toBe(300);
    }, 20000);

    test("Main queue has correct policy allowing SNS to send messages", async () => {
      const { Attributes } = await sqsClient.send(
        new GetQueueAttributesCommand({ 
          QueueUrl: sqsQueueUrl,
          AttributeNames: ["Policy"]
        })
      );
      
      const policy = JSON.parse(Attributes?.Policy || "{}");
      const snsStatement = policy.Statement?.find((s: any) => s.Sid === "AllowSNSToSendMessage");
      expect(snsStatement?.Principal?.Service).toBe("sns.amazonaws.com");
      expect(snsStatement?.Action).toContain("sqs:SendMessage");
      expect(snsStatement?.Condition?.ArnEquals?.["aws:SourceArn"]).toBe(snsTopicArn);
    }, 20000);
  });

  describe("IAM Roles Configuration", () => {
    test("S3 access role exists with correct permissions", async () => {
      const roleName = s3IamRoleArn.split('/').pop();
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      
      expect(Role?.RoleName).toBe(`tap-${environmentSuffix}-s3-access-role`);
      expect(Role?.Tags?.some(tag => tag.Key === "Environment" && tag.Value === environmentSuffix)).toBe(true);
      
      // Check assume role policy
      const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain("ec2.amazonaws.com");
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain("lambda.amazonaws.com");
    }, 20000);

    test("S3 role has correct policies attached", async () => {
      const roleName = s3IamRoleArn.split('/').pop();
      const { PolicyNames } = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );
      
      expect(PolicyNames).toContain("S3AccessPolicy");
      
      const { PolicyDocument } = await iamClient.send(
        new GetRolePolicyCommand({ 
          RoleName: roleName || "",
          PolicyName: "S3AccessPolicy"
        })
      );
      
      const policy = JSON.parse(decodeURIComponent(PolicyDocument || ""));
      const s3Statement = policy.Statement?.find((s: any) => 
        s.Actions?.includes("s3:GetObject") || s.Action?.includes("s3:GetObject")
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement?.Resource || s3Statement?.Resources).toContain(`${s3BucketArn}/*`);
      
      const kmsStatement = policy.Statement?.find((s: any) => 
        s.Actions?.includes("kms:Decrypt") || s.Action?.includes("kms:Decrypt")
      );
      expect(kmsStatement).toBeDefined();
    }, 20000);

    test("SQS access role exists with correct permissions", async () => {
      const roleName = sqsIamRoleArn.split('/').pop();
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      
      expect(Role?.RoleName).toBe(`tap-${environmentSuffix}-sqs-access-role`);
    }, 20000);

    test("SQS role has correct policies attached", async () => {
      const roleName = sqsIamRoleArn.split('/').pop();
      const { PolicyNames } = await iamClient.send(
        new ListRolePoliciesCommand({ RoleName: roleName })
      );
      
      expect(PolicyNames).toContain("SQSAccessPolicy");
      
      const { PolicyDocument } = await iamClient.send(
        new GetRolePolicyCommand({ 
          RoleName: roleName || "",
          PolicyName: "SQSAccessPolicy"
        })
      );
      
      const policy = JSON.parse(decodeURIComponent(PolicyDocument || ""));
      const sqsStatement = policy.Statement?.find((s: any) => 
        s.Actions?.includes("sqs:ReceiveMessage") || s.Action?.includes("sqs:ReceiveMessage")
      );
      expect(sqsStatement).toBeDefined();
    }, 20000);
  });

  describe("Security and Compliance", () => {
    test("All resources use KMS encryption", async () => {
      // Test KMS key is active
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );
      expect(KeyMetadata?.Enabled).toBe(true);

      // Test S3 bucket encryption
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: s3BucketName })
      );
      expect(ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toBe(kmsKeyArn);

      // Test SQS queue encryption
      const mainQueueAttrs = await sqsClient.send(
        new GetQueueAttributesCommand({ 
          QueueUrl: sqsQueueUrl,
          AttributeNames: ["KmsMasterKeyId"]
        })
      );
      expect(mainQueueAttrs.Attributes?.KmsMasterKeyId).toBe(kmsKeyArn);

      const dlqAttrs = await sqsClient.send(
        new GetQueueAttributesCommand({ 
          QueueUrl: sqsDlqUrl,
          AttributeNames: ["KmsMasterKeyId"]
        })
      );
      expect(dlqAttrs.Attributes?.KmsMasterKeyId).toBe(kmsKeyArn);
    }, 20000);

    test("All resources have proper tagging", async () => {
      // Check KMS key tags
      const { KeyMetadata } = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );
      expect(KeyMetadata?.Description).toContain(environmentSuffix);

      // Check S3 bucket name contains environment suffix
      expect(s3BucketName).toContain(environmentSuffix);

      // Check SNS topic name contains environment suffix
      expect(snsTopicArn).toContain(environmentSuffix);

      // Check SQS queue names contain environment suffix
      expect(sqsQueueUrl).toContain(environmentSuffix);
      expect(sqsDlqUrl).toContain(environmentSuffix);

      // Check IAM role names contain environment suffix
      expect(s3IamRoleArn).toContain(environmentSuffix);
      expect(sqsIamRoleArn).toContain(environmentSuffix);
    }, 20000);

    test("Resources follow least privilege principle", async () => {
      // Check S3 bucket blocks public access
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: s3BucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);

      // Check IAM roles have specific service principals
      const s3RoleName = s3IamRoleArn.split('/').pop();
      const { Role: s3Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: s3RoleName })
      );
      const s3AssumePolicy = JSON.parse(decodeURIComponent(s3Role?.AssumeRolePolicyDocument || ""));
      expect(s3AssumePolicy.Statement[0].Principal.Service).toBeDefined();
      expect(s3AssumePolicy.Statement[0].Action).toBe("sts:AssumeRole");
    }, 20000);

    test("Resource naming follows conventions", async () => {
      expect(s3BucketName).toMatch(/^tap-data-bucket-tss-[a-z0-9]+-\d+$/);
      expect(snsTopicArn).toMatch(/tap-notifications-[a-z0-9]+$/);
      expect(sqsQueueUrl).toMatch(/tap-processing-queue-[a-z0-9]+$/);
      expect(sqsDlqUrl).toMatch(/tap-processing-dlq-[a-z0-9]+$/);
    }, 20000);
  });

  describe("Integration Points", () => {
    test("SNS topic can deliver messages to SQS queue", async () => {
      // Verify subscription exists
      const { Subscriptions } = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: snsTopicArn })
      );
      
      const sqsSubscription = Subscriptions?.find(sub => 
        sub.Protocol === "sqs" && sub.Endpoint?.includes(sqsQueueUrl.split('/').pop() || "")
      );
      expect(sqsSubscription).toBeDefined();
      expect(sqsSubscription?.SubscriptionArn).not.toBe("PendingConfirmation");
    }, 20000);

    test("IAM roles have access to all required resources", async () => {
      // Test S3 role has access to bucket and KMS key
      const s3RoleName = s3IamRoleArn.split('/').pop();
      const { PolicyDocument: s3PolicyDoc } = await iamClient.send(
        new GetRolePolicyCommand({ 
          RoleName: s3RoleName || "",
          PolicyName: "S3AccessPolicy"
        })
      );
      
      const s3Policy = JSON.parse(decodeURIComponent(s3PolicyDoc || ""));
      const hasS3Access = s3Policy.Statement?.some((s: any) => 
        (s.Action?.includes("s3:GetObject") || s.Actions?.includes("s3:GetObject")) &&
        (s.Resource?.includes(s3BucketArn) || s.Resources?.includes(s3BucketArn))
      );
      expect(hasS3Access).toBe(true);

      const hasKmsAccess = s3Policy.Statement?.some((s: any) => 
        (s.Action?.includes("kms:Decrypt") || s.Actions?.includes("kms:Decrypt")) &&
        (s.Resource?.includes(kmsKeyArn) || s.Resources?.includes(kmsKeyArn))
      );
      expect(hasKmsAccess).toBe(true);
    }, 20000);
  });
});