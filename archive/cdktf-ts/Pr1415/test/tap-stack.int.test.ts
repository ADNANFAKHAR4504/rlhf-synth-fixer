// __tests__/tap-stack.int.test.ts
import { S3Client, HeadBucketCommand, GetBucketAclCommand } from "@aws-sdk/client-s3";
import { IAMClient, GetRoleCommand } from "@aws-sdk/client-iam";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import * as fs from "fs";
import * as path from "path";

const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const s3Client = new S3Client({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });
const logsClient = new CloudWatchLogsClient({ region: awsRegion });

describe("TapStack Integration Tests", () => {
  let lambdaRoleArn: string;
  let lambdaFunctionName: string;
  let cloudwatchLogGroupName: string;
  let s3BucketName: string;

  beforeAll(() => {
    const outputFilePath = path.join(__dirname, "..", "cfn-outputs", "flat-outputs.json");
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, "utf-8"));
    const stackKey = Object.keys(outputs)[0]; // only one stack in your output
    const stackOutputs = outputs[stackKey];

    lambdaRoleArn = stackOutputs["lambdarole-arn"];
    lambdaFunctionName = stackOutputs["lambdafunction-name"];
    cloudwatchLogGroupName = stackOutputs["cloudwatchlog-group-name"];
    s3BucketName = stackOutputs["s3bucket-name"];

    if (!lambdaRoleArn || !lambdaFunctionName || !cloudwatchLogGroupName || !s3BucketName) {
      throw new Error("Missing required stack outputs for integration test.");
    }
  });

  test("S3 bucket exists and has public access blocked", async () => {
    await s3Client.send(new HeadBucketCommand({ Bucket: s3BucketName }));
    const { Grants } = await s3Client.send(new GetBucketAclCommand({ Bucket: s3BucketName }));
    const hasPublicRead = Grants?.some(
      grant => grant.Grantee?.URI === "http://acs.amazonaws.com/groups/global/AllUsers" && grant.Permission === "READ"
    );
    expect(hasPublicRead).toBe(false);
  }, 20000);

  test("IAM Lambda role exists and is assumable by Lambda service", async () => {
    const roleName = lambdaRoleArn.split('/')[1];
    const { Role } = await iamClient.send(new GetRoleCommand({ RoleName: roleName }));
    expect(Role?.RoleName).toBe(roleName);

    const assumeRolePolicy = JSON.parse(decodeURIComponent(Role?.AssumeRolePolicyDocument || ""));
    expect(
      assumeRolePolicy.Statement.some(
        (statement: any) =>
          statement.Effect === "Allow" &&
          statement.Principal.Service === "lambda.amazonaws.com"
      )
    ).toBe(true);
  }, 20000);

  test("CloudWatch log group exists for Lambda function", async () => {
    const { logGroups } = await logsClient.send(
      new DescribeLogGroupsCommand({ logGroupNamePrefix: cloudwatchLogGroupName })
    );
    expect(logGroups?.length).toBeGreaterThanOrEqual(1);
    expect(logGroups?.[0].logGroupName).toBe(cloudwatchLogGroupName);
  }, 20000);

});
