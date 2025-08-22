import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import dns from "dns";
import AWS from "aws-sdk";
import yaml from 'js-yaml'

// Read AWS region from ../lib/AWS_REGION file
const awsRegionFile = path.resolve(__dirname, "../lib/AWS_REGION");
const AWS_REGION = fs.readFileSync(awsRegionFile, "utf8").trim();

// Read deployed stack outputs
const outputs = JSON.parse(
  fs.readFileSync("cfn-outputs/flat-outputs.json", "utf8")
);

const templatePathYaml = path.resolve(__dirname, '../lib/TapStack.yml');

let template: Record<string, any>;
if (fs.existsSync(templatePathYaml)) {
  template = yaml.load(fs.readFileSync(templatePathYaml, 'utf8'))  as Record<string, any>;
} else {
  throw new Error('CloudFormation template not found in JSON or YAML format.');
}

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "dev";

// Extract CloudFormation outputs
const kmsKeyId = outputs["KMSKeyId"];
const secureDataBucketName = outputs["SecureDataBucketName"];
const dbEndpoint = outputs["DatabaseEndpoint"];
const LambdaFunctionArn = outputs["LambdaFunctionArn"];
const vpcId = outputs["VPCId"];

describe("Security Stack Integration Tests", () => {
  //
  // CloudFormation Outputs Validation
  //
  describe("CloudFormation Outputs", () => {
    test("KMS Key ID should exist", () => {
      expect(kmsKeyId).toBeDefined();
      expect(kmsKeyId).toMatch(/^[0-9a-fA-F-]{36}$/);
      });

    test("Secure Data S3 bucket name should exist", () => {
      expect(secureDataBucketName).toBeDefined();
      expect(secureDataBucketName).toMatch(/^[a-z0-9.-]+$/);
    });

    test("Database Endpoint should exist", () => {
      expect(dbEndpoint).toBeDefined();
      expect(dbEndpoint).toContain(".");
    });

    test("Lambda Function ARN should exist", () => {
      expect(LambdaFunctionArn).toBeDefined();
      expect(LambdaFunctionArn).toMatch(/^arn:aws:lambda:/);
    });

    test("VPC ID should exist", () => {
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);
    });
  });

  //
  // S3 Bucket Existence Check
  //
  describe("S3 Bucket Existence", () => {
    test(
      "Secure Data S3 bucket should exist in AWS",
      async () => {
        const s3 = new AWS.S3({ region: AWS_REGION });

        try {
          const res = await s3.headBucket({ Bucket: secureDataBucketName }).promise();
          expect(res).toBeDefined();
        } catch (err: any) {
          console.error(`S3 bucket check failed: ${err.message}`);
          throw err;
        }
      },
      15000 // 15s timeout
    );
  });

  //
  // Database Endpoint Health Check (basic DNS)
  //
  describe("Database Endpoint Availability", () => {
    test("should resolve DNS for DB endpoint", async () => {
      const records = await dns.promises.lookup(dbEndpoint);
      expect(records).toHaveProperty("address");
    });
  });

  //
  // Lambda Health Check (invocation)
  //
  describe("Lambda Function Invocation", () => {
    test(
      "should successfully invoke Lambda function",
      async () => {
        const lambda = new AWS.Lambda({ region: AWS_REGION });

        const res = await lambda
          .invoke({
            FunctionName: LambdaFunctionArn,
            Payload: JSON.stringify({ test: true })
          })
          .promise();

        expect(res.StatusCode).toBe(200);
      },
      20000 // 20s timeout
    );
  });

  describe('RestrictedSecurityGroup Ingress Rules', () => {
    test('should only allow access from AllowedIPRange for all ingress rules', () => {
      const sgResource = template.Resources?.RestrictedSecurityGroup;

      expect(sgResource).toBeDefined();
      expect(sgResource.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = sgResource.Properties?.SecurityGroupIngress || [];
      expect(ingressRules.length).toBeGreaterThan(0);

      ingressRules.forEach((rule: any, idx: number) => {
        expect(rule.CidrIp).toBeDefined();
        expect(rule.CidrIp).toEqual({ Ref: 'AllowedIPRange' });
        expect([22, 80, 443]).toContain(rule.FromPort);
        expect(rule.FromPort).toBe(rule.ToPort);
        expect(rule.IpProtocol).toBe('tcp');
      });
    });
  });
});
