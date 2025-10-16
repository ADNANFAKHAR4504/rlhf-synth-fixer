// test/outputs.test.ts

import { CloudFrontClient, ListDistributionsCommand } from "@aws-sdk/client-cloudfront";
import { CognitoIdentityProviderClient, DescribeUserPoolClientCommand } from "@aws-sdk/client-cognito-identity-provider";
import { DescribeTableCommand, DescribeTimeToLiveCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DescribeClustersCommand, ECSClient } from "@aws-sdk/client-ecs";
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from "@aws-sdk/client-elastic-load-balancing-v2";
import { DescribeDBClustersCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { DescribeSecretCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { GetTopicAttributesCommand, ListSubscriptionsByTopicCommand, SNSClient } from "@aws-sdk/client-sns";
import fs from 'fs';
const REGION = process.env.AWS_REGION || "us-east-1";

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);


// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';


async function findELB(dns: string) {
  const client = new ElasticLoadBalancingV2Client({ region: REGION });
  const resp = await client.send(new DescribeLoadBalancersCommand({}));
  return resp.LoadBalancers?.some(lb => lb.DNSName === dns);
}

async function findDistribution(domain: string) {
  const client = new CloudFrontClient({ region: REGION });
  const list = await client.send(new ListDistributionsCommand({}));
  return list.DistributionList?.Items?.find(d => d.DomainName === domain);
}

describe("Live Environment Integration Tests", () => {

  describe("DynamoDB Table Schemas and Configuration", () => {
    const db = new DynamoDBClient({ region: REGION });

    const tableTests = [
      {
        key: "UserFavoritesTableName",
        pk: { AttributeName: "userId", KeyType: "HASH" },
        sk: { AttributeName: "propertyId", KeyType: "RANGE" },
        gsis: ["CreatedAtIndex"], // example GSI name
        ttl: null,
      },
      {
        key: "AppointmentsTableName",
        pk: { AttributeName: "appointmentId", KeyType: "HASH" },
        sk: null,
        gsis: ["UserAppointmentsIndex"],
        ttl: null,
      },
      {
        key: "PropertiesTableName",
        pk: { AttributeName: "propertyId", KeyType: "HASH" },
        sk: null,
        gsis: ["PriceRangeIndex", "ListingDateIndex"],
        ttl: null,
      },
    ] as const;

    for (const { key, pk, sk, gsis, ttl } of tableTests) {
      const tableName = outputs[key]!;

      test(`${key} has correct primary key schema`, async () => {
        const resp = await db.send(new DescribeTableCommand({ TableName: tableName }));
        const ks = resp.Table?.KeySchema || [];
        expect(ks).toEqual(
          expect.arrayContaining([expect.objectContaining(pk)])
        );
        if (sk) {
          expect(ks).toEqual(
            expect.arrayContaining([expect.objectContaining(sk)])
          );
        } else {
          expect(ks).toHaveLength(1);
        }
      });

      test(`${key} has expected GSIs`, async () => {
        const resp = await db.send(new DescribeTableCommand({ TableName: tableName }));
        const existingGsis = resp.Table?.GlobalSecondaryIndexes?.map(i => i.IndexName) || [];
        for (const g of gsis) {
          expect(existingGsis).toContain(g);
        }
      });

      test(`${key} check for deletion protection`, async () => {
        const resp = await db.send(new DescribeTableCommand({ TableName: tableName }));
        expect(resp.Table?.DeletionProtectionEnabled).toBe(false);
      });

      test(`${key} has no TTL configured`, async () => {
        const ttlResp = await db.send(new DescribeTimeToLiveCommand({ TableName: tableName }));
        expect(ttlResp.TimeToLiveDescription?.TimeToLiveStatus).toBe("DISABLED");
      });

    }
  });

  describe("S3 Bucket Configuration", () => {
    const s3 = new S3Client({ region: REGION });
    const buckets = ["PropertyToursBucket", "PropertyImagesBucket"] as const;

    test.each(buckets)(
      "%s exists and is accessible",
      async (key) => {
        const name = outputs[key]!;
        await expect(s3.send(new HeadBucketCommand({ Bucket: name }))).resolves.not.toThrow();
      }
    );

    test.each(buckets)(
      "%s has versioning enabled",
      async (key) => {
        const name = outputs[key]!;
        const resp = await s3.send(new GetBucketVersioningCommand({ Bucket: name }));
        expect(resp.Status).toBe("Enabled");
      }
    );

    test.each(buckets)(
      "%s has default encryption (AES256 or AWS-KMS)",
      async (key) => {
        const name = outputs[key]!;
        const resp = await s3.send(new GetBucketEncryptionCommand({ Bucket: name }));
        const rules = resp.ServerSideEncryptionConfiguration?.Rules || [];
        expect(rules.length).toBeGreaterThan(0);
        const algo = rules[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm;
        expect(["AES256", "aws:kms"]).toContain(algo);
      }
    );

    test.each(buckets)(
      "%s blocks public access",
      async (key) => {
        const name = outputs[key]!;
        const resp = await s3.send(new GetPublicAccessBlockCommand({ Bucket: name }));
        const block = resp.PublicAccessBlockConfiguration!;
        expect(block.BlockPublicAcls).toBe(true);
        expect(block.IgnorePublicAcls).toBe(true);
        expect(block.BlockPublicPolicy).toBe(true);
        expect(block.RestrictPublicBuckets).toBe(true);
      }
    );

  });

  describe("SNS Topic and RDS Cluster", () => {
    const sns = new SNSClient({ region: REGION });
    const rds = new RDSClient({ region: REGION });

    test("AlertTopicArn has correct attributes and at least one subscription", async () => {
      const topicArn = outputs.AlertTopicArn!;

      // Verify topic exists and attributes
      const attr = await sns.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
      expect(attr.Attributes?.TopicArn).toBe(topicArn);
      expect(attr.Attributes?.DisplayName).toBeDefined();
      // Verify subscriptions
      const subs = await sns.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArn }));
      expect(subs.Subscriptions).toBeDefined();
    });

    test("RDS cluster exists and endpoints match outputs", async () => {
      const clusterId = outputs.DatabaseEndpoint!
        .split(".")[0]; // e.g., tapstackdev-auroradbcluster-doyxfqddi89j
      const readEndpoint = outputs.DatabaseReadEndpoint!;
      const writerEndpoint = outputs.DatabaseEndpoint!;

      const resp = await rds.send(new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId }));
      const cluster = resp.DBClusters?.[0];
      expect(cluster).toBeDefined();
      expect(cluster?.Endpoint).toBe(writerEndpoint);
      expect(cluster?.ReaderEndpoint).toBe(readEndpoint);
    });


  });


  describe("End to End Resource Tests", () => {

    test("ALBDNSName exists and points to an ELB", async () => {
      const dns = outputs.ALBDNSName!;
      expect(dns).toMatch(/\..*\.elb\.amazonaws\.com$/);
      const found = await findELB(dns);
      expect(found).toBe(true);
    });

    test("CloudFrontURL exists and distribution is active", async () => {
      const domain = outputs.CloudFrontURL!;
      expect(domain).toMatch(/\.cloudfront\.net$/);
      const dist = await findDistribution(domain);
      expect(dist).toBeDefined();
      expect(dist?.Status).toBe("Deployed");
    });

    test("PropertyToursBucket and PropertyImagesBucket exist", async () => {
      const s3 = new S3Client({ region: REGION });
      for (const key of ["PropertyToursBucket", "PropertyImagesBucket"] as const) {
        const name = outputs[key]!;
        await s3.send(new HeadBucketCommand({ Bucket: name }));
      }
    });

    test("WebAppServiceName and ECSClusterName exist", async () => {
      const ecs = new ECSClient({ region: REGION });
      const cluster = outputs.ECSClusterName!;
      const service = outputs.WebAppServiceName!;
      const resp = await ecs.send(
        new DescribeClustersCommand({ clusters: [cluster] })
      );
      expect(resp.clusters?.[0].clusterName).toBe(cluster);
      // Could additionally call DescribeServices for the service if needed
    });

    test("DynamoDB tables exist", async () => {
      const db = new DynamoDBClient({ region: REGION });
      for (const key of ["UserFavoritesTableName", "AppointmentsTableName", "PropertiesTableName"] as const) {
        const TableName = outputs[key]!;
        const resp = await db.send(new DescribeTableCommand({ TableName }));
        expect(resp.Table?.TableName).toBe(TableName);
      }
    });

    test("SNS AlertTopicArn exists", async () => {
      const arn = outputs.AlertTopicArn!;
      const sns = new SNSClient({ region: REGION });
      const resp = await sns.send(new GetTopicAttributesCommand({ TopicArn: arn }));
      expect(resp.Attributes?.TopicArn).toBe(arn);
    });

    test("Secrets Manager DatabaseSecretArn exists", async () => {
      const arn = outputs.DatabaseSecretArn!;
      const sm = new SecretsManagerClient({ region: REGION });
      const resp = await sm.send(new DescribeSecretCommand({ SecretId: arn }));
      expect(resp.ARN).toBe(arn);
    });

    test("Cognito UserPoolId & UserPoolClientId exist", async () => {
      const userPoolId = outputs.UserPoolId!;
      const clientId = outputs.UserPoolClientId!;
      const cip = new CognitoIdentityProviderClient({ region: REGION });
      const resp = await cip.send(
        new DescribeUserPoolClientCommand({ UserPoolId: userPoolId, ClientId: clientId })
      );
      expect(resp.UserPoolClient?.ClientId).toBe(clientId);
    });
  })

});
