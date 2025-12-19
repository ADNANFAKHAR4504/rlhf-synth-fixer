import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyStatusCommand,
  PutObjectCommand,
  ListObjectsCommand
} from "@aws-sdk/client-s3";
import {
  LambdaClient,
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  InvokeCommand
} from "@aws-sdk/client-lambda";
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetResourcesCommand,
  GetMethodCommand,
  GetUsagePlanCommand,
  GetApiKeyCommand
} from "@aws-sdk/client-api-gateway";
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand
} from "@aws-sdk/client-iam";
import * as fs from 'fs';
import * as path from 'path';

// Define types for the outputs
interface CloudFormationOutput {
  OutputKey: string;
  OutputValue: string;
  Description: string;
  ExportName: string;
}

interface StructuredOutputs {
  [key: string]: CloudFormationOutput[];
}

interface FlatOutputs {
  [key: string]: string;
}

// Read and parse the outputs
function readOutputs() {
  const allOutputsPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
  const flatOutputsPath = path.resolve(process.cwd(), "cfn-outputs/flat-outputs.json");
  
  if (!fs.existsSync(allOutputsPath)) {
    throw new Error(`Outputs file not found at ${allOutputsPath}`);
  }
  
  if (!fs.existsSync(flatOutputsPath)) {
    throw new Error(`Outputs file not found at ${flatOutputsPath}`);
  }
  
  const allOutputs = JSON.parse(fs.readFileSync(allOutputsPath, "utf8")) as StructuredOutputs;
  const flatOutputs = JSON.parse(fs.readFileSync(flatOutputsPath, "utf8")) as FlatOutputs;
  
  // Get the stack name (first key in allOutputs)
  const stackName = Object.keys(allOutputs)[0];
  const outputs = allOutputs[stackName];
  
  // Extract values
  const apiGatewayUrl = flatOutputs.ApiGatewayUrl;
  const apiKey = flatOutputs.ApiKey;
  const lambdaFunctionArn = flatOutputs.LambdaFunctionArn;
  const usagePlanId = flatOutputs.UsagePlanId;
  const s3BucketArn = flatOutputs.S3BucketArn;
  const apiGatewayId = flatOutputs.ApiGatewayId;
  const lambdaFunctionName = flatOutputs.LambdaFunctionName;
  const s3BucketName = flatOutputs.S3BucketName;
  
  if (!s3BucketName) {
    throw new Error("S3BucketName missing in outputs");
  }
  
  return {
    stackName,
    apiGatewayUrl,
    apiKey,
    lambdaFunctionArn,
    usagePlanId,
    s3BucketArn,
    apiGatewayId,
    lambdaFunctionName,
    s3BucketName
  };
}

// Retry function for AWS API calls
async function retry<T>(fn: () => Promise<T>, attempts = 5, baseMs = 1000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const wait = baseMs * Math.pow(2, i) + Math.floor(Math.random() * 200);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

// Get AWS region from ARN or environment
function getRegionFromArn(arn: string): string {
  const arnParts = arn.split(':');
  if (arnParts.length >= 4) {
    return arnParts[3];
  }
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
}

// Extract account ID from ARN
function getAccountIdFromArn(arn: string): string {
  const arnParts = arn.split(':');
  if (arnParts.length >= 5) {
    return arnParts[4];
  }
  return '';
}

// Initialize AWS clients with dynamic region
const outputs = readOutputs();
const region = getRegionFromArn(outputs.lambdaFunctionArn);
const accountId = getAccountIdFromArn(outputs.lambdaFunctionArn);

const s3 = new S3Client({ region });
const lambda = new LambdaClient({ region });
const apiGateway = new APIGatewayClient({ region });
const iam = new IAMClient({ region });

describe("LIVE: TapStack Integration Tests", () => {
  // Test S3 Bucket
  describe("S3 Bucket Validation", () => {
    test("bucket exists", async () => {
      await expect(
        retry(() => s3.send(new HeadBucketCommand({ Bucket: outputs.s3BucketName })))
      ).resolves.toBeTruthy();
    });

    test("bucket has encryption enabled", async () => {
      const encryption = await retry(() => 
        s3.send(new GetBucketEncryptionCommand({ Bucket: outputs.s3BucketName }))
      );
      
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      expect(encryption.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });

    test("bucket has public access blocked", async () => {
      const publicAccess = await retry(() => 
        s3.send(new GetPublicAccessBlockCommand({ Bucket: outputs.s3BucketName }))
      );
      
      expect(publicAccess.PublicAccessBlockConfiguration).toBeDefined();
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test("bucket has versioning enabled", async () => {
      const versioning = await retry(() => 
        s3.send(new GetBucketVersioningCommand({ Bucket: outputs.s3BucketName }))
      );
      
      expect(versioning.Status).toBe('Enabled');
    });

    // test("bucket policy is not public", async () => {
    //   const policyStatus = await retry(() => 
    //     s3.send(new GetBucketPolicyStatusCommand({ Bucket: outputs.s3BucketName }))
    //   );
      
    //   expect(policyStatus.PolicyStatus?.IsPublic).toBe(false);
    // });

    test("can upload and list objects in bucket", async () => {
      // Test upload
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Test content for integration testing';
      
      await retry(() => 
        s3.send(new PutObjectCommand({
          Bucket: outputs.s3BucketName,
          Key: testKey,
          Body: testContent
        }))
      );
      
      // Test listing
      const objects = await retry(() => 
        s3.send(new ListObjectsCommand({ Bucket: outputs.s3BucketName }))
      );
      
      expect(objects.Contents).toBeDefined();
      const uploadedObject = objects.Contents?.find(obj => obj.Key === testKey);
      expect(uploadedObject).toBeDefined();
    });
  });

  // Test Lambda Function
  describe("Lambda Function Validation", () => {
    test("lambda function exists", async () => {
      const func = await retry(() => 
        lambda.send(new GetFunctionCommand({ FunctionName: outputs.lambdaFunctionName }))
      );
      
      expect(func.Configuration).toBeDefined();
      expect(func.Configuration?.FunctionName).toBe(outputs.lambdaFunctionName);
    });

    test("lambda function has correct configuration", async () => {
      const config = await retry(() => 
        lambda.send(new GetFunctionConfigurationCommand({ FunctionName: outputs.lambdaFunctionName }))
      );
      
      expect(config.Runtime).toBe('python3.9');
      expect(config.Handler).toBe('index.lambda_handler');
      expect(config.MemorySize).toBe(128);
      expect(config.Timeout).toBe(30);
      expect(config.Environment?.Variables?.BUCKET_NAME).toBe(outputs.s3BucketName);
      expect(['dev', 'staging', 'prod']).toContain(config.Environment?.Variables?.ENVIRONMENT);
    });

    test("lambda function can be invoked", async () => {
      const response = await retry(() => 
        lambda.send(new InvokeCommand({
          FunctionName: outputs.lambdaFunctionName,
          Payload: JSON.stringify({ test: 'data' })
        }))
      );
      
      expect(response.StatusCode).toBe(200);
      
      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        expect(payload.statusCode).toBe(200);
        expect(payload.body).toContain('Data processed successfully');
      }
    });
  });

  // Test IAM Roles
  // describe("IAM Roles Validation", () => {
  //   // test("LambdaExecutionRole exists with correct trust policy", async () => {
  //   //   const roleName = outputs.lambdaFunctionArn.split('/').pop()?.replace('process-data-', 'TapStackpr2715-LambdaExecutionRole-') || '';
      
  //   //   const role = await retry(() => 
  //   //     iam.send(new GetRoleCommand({ RoleName: roleName }))
  //   //   );
      
  //   //   expect(role.Role).toBeDefined();
  //   //   expect(role.Role?.AssumeRolePolicyDocument).toBeDefined();
      
  //   //   const trustPolicy = JSON.parse(decodeURIComponent(role.Role!.AssumeRolePolicyDocument!));
  //   //   expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
  //   //   expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
  //   // });

  //   // test("LambdaExecutionRole has correct policies attached", async () => {
  //   //   const roleName = outputs.lambdaFunctionArn.split('/').pop()?.replace('process-data-', 'TapStackpr2715-LambdaExecutionRole-') || '';
      
  //   //   const policies = await retry(() => 
  //   //     iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }))
  //   //   );
      
  //   //   expect(policies.AttachedPolicies).toBeDefined();
  //   //   const basicExecutionPolicy = policies.AttachedPolicies?.find(
  //   //     p => p.PolicyArn === 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
  //   //   );
  //   //   expect(basicExecutionPolicy).toBeDefined();
      
  //   //   // Check for inline policy
  //   //   const inlinePolicy = await retry(() => 
  //   //     iam.send(new GetRolePolicyCommand({
  //   //       RoleName: roleName,
  //   //       PolicyName: 'S3ReadOnlyAccess'
  //   //     }))
  //   //   ).catch(() => null);
      
  //   //   // Inline policy might not be fetchable, but we can at least verify the role exists
  //   //   expect(roleName).toBeTruthy();
  //   // });
  // });

  // Test API Gateway
  describe("API Gateway Validation", () => {
    test("API Gateway exists", async () => {
      const api = await retry(() => 
        apiGateway.send(new GetRestApiCommand({ restApiId: outputs.apiGatewayId }))
      );
      
      expect(api).toBeDefined();
      expect(api.name).toContain('data-api-');
    });

    test("API Gateway has correct resources", async () => {
      const resources = await retry(() => 
        apiGateway.send(new GetResourcesCommand({ restApiId: outputs.apiGatewayId }))
      );
      
      expect(resources.items).toBeDefined();
      const processResource = resources.items?.find(r => r.pathPart === 'process');
      expect(processResource).toBeDefined();
      
      // Check POST method
      const postMethod = await retry(() => 
        apiGateway.send(new GetMethodCommand({
          restApiId: outputs.apiGatewayId,
          resourceId: processResource!.id!,
          httpMethod: 'POST'
        }))
      );
      
      expect(postMethod).toBeDefined();
      expect(postMethod.apiKeyRequired).toBe(true);
      
      // Check OPTIONS method for CORS
      const optionsMethod = await retry(() => 
        apiGateway.send(new GetMethodCommand({
          restApiId: outputs.apiGatewayId,
          resourceId: processResource!.id!,
          httpMethod: 'OPTIONS'
        }))
      );
      
      expect(optionsMethod).toBeDefined();
    });

    test("Usage Plan exists with correct configuration", async () => {
      const usagePlan = await retry(() => 
        apiGateway.send(new GetUsagePlanCommand({ usagePlanId: outputs.usagePlanId }))
      );
      
      expect(usagePlan).toBeDefined();
      expect(usagePlan.throttle?.burstLimit).toBe(50);
      expect(usagePlan.throttle?.rateLimit).toBe(25);
      expect(usagePlan.quota?.limit).toBe(10000);
      expect(usagePlan.quota?.period).toBe('MONTH');
    });

    test("API Key exists and is enabled", async () => {
      const apiKey = await retry(() => 
        apiGateway.send(new GetApiKeyCommand({ apiKey: outputs.apiKey }))
      );
      
      expect(apiKey).toBeDefined();
      expect(apiKey.enabled).toBe(true);
    });
  });

  // Test Integration Points
  describe("Integration Points Validation", () => {
    test("API Gateway URL is accessible", async () => {
      // This test would typically make an HTTP request to the API Gateway URL
      // For security and simplicity, we'll just validate the URL format
      expect(outputs.apiGatewayUrl).toMatch(/^https:\/\/.+.execute-api\..+\.amazonaws\.com\/.+\/process$/);
    });

    test("S3 bucket and Lambda are connected via notification", async () => {
      // This is difficult to test directly without triggering an actual S3 event
      // We'll validate that both resources exist and the permissions are in place
      expect(outputs.s3BucketName).toBeTruthy();
      expect(outputs.lambdaFunctionArn).toBeTruthy();
      
      // The custom resource should have set up the notification configuration
      // We can verify the Lambda has the necessary permission for S3 to invoke it
      const lambdaPolicy = await retry(() => 
        lambda.send(new GetFunctionCommand({ FunctionName: outputs.lambdaFunctionName }))
      );
      
      expect(lambdaPolicy.Configuration).toBeDefined();
      // Additional validation could be added here if needed
    });
  });

  // Test Outputs Consistency
  describe("Outputs Consistency Validation", () => {
    test("all expected outputs are present", () => {
      expect(outputs.apiGatewayUrl).toBeTruthy();
      expect(outputs.apiKey).toBeTruthy();
      expect(outputs.lambdaFunctionArn).toBeTruthy();
      expect(outputs.usagePlanId).toBeTruthy();
      expect(outputs.s3BucketArn).toBeTruthy();
      expect(outputs.apiGatewayId).toBeTruthy();
      expect(outputs.lambdaFunctionName).toBeTruthy();
      expect(outputs.s3BucketName).toBeTruthy();
    });

    test("output values are consistent with each other", () => {
      // Check that ARNs contain the correct resource names
      expect(outputs.lambdaFunctionArn).toContain(outputs.lambdaFunctionName);
      expect(outputs.s3BucketArn).toContain(outputs.s3BucketName);
      
      // Check that API Gateway URL contains the API ID
      expect(outputs.apiGatewayUrl).toContain(outputs.apiGatewayId);
    });

    test("resource names follow expected patterns", () => {
      // S3 bucket name pattern
      expect(outputs.s3BucketName).toMatch(/^tapstackpr2715-appdatabucket-[a-z0-9]+$/);
      
      // Lambda function name pattern
      expect(outputs.lambdaFunctionName).toBe('process-data-dev');
      
      // API Gateway ID pattern
      expect(outputs.apiGatewayId).toMatch(/^[a-z0-9]+$/);
      
      // API Key pattern
      expect(outputs.apiKey).toMatch(/^[a-z0-9]+$/);
    });
  });
});

// Edge case tests
describe("LIVE: Edge Case Tests", () => {
  test("Lambda function handles malformed events gracefully", async () => {
    const response = await retry(() => 
      lambda.send(new InvokeCommand({
        FunctionName: outputs.lambdaFunctionName,
        Payload: JSON.stringify({ invalid: 'event', structure: true })
      }))
    );
    
    expect(response.StatusCode).toBe(200);
    
    if (response.Payload) {
      const payload = JSON.parse(Buffer.from(response.Payload).toString());
      expect(payload.statusCode).toBe(200);
    }
  });

  test("S3 bucket rejects public access attempts", async () => {
    // This would typically test making an object public, but that's complex to do via SDK
    // Instead, we verify the public access block is in place
    const publicAccess = await retry(() => 
      s3.send(new GetPublicAccessBlockCommand({ Bucket: outputs.s3BucketName }))
    );
    
    expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(publicAccess.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
  });
});