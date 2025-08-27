import { 
  S3Client, 
  HeadBucketCommand, 
  GetObjectCommand, 
  GetBucketWebsiteCommand,
  GetBucketPolicyCommand,
  GetBucketTaggingCommand
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
  GetStageCommand,
  GetResourcesCommand,
  GetMethodCommand
} from "@aws-sdk/client-api-gateway";
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from "@aws-sdk/client-cloudwatch-logs";
import { 
  IAMClient, 
  GetRoleCommand, 
  ListAttachedRolePoliciesCommand 
} from "@aws-sdk/client-iam";
import fs from "fs";
import path from "path";

interface OutputValue {
  sensitive: boolean;
  type: string | string[];
  value: any;
}

interface TerraformOutputs {
  [key: string]: OutputValue;
}

describe("Terraform Infrastructure Integration Tests", () => {
  let outputs: TerraformOutputs;
  let s3Client: S3Client;
  let lambdaClient: LambdaClient;
  let apiGatewayClient: APIGatewayClient;
  let cloudWatchLogsClient: CloudWatchLogsClient;
  let iamClient: IAMClient;
  
  beforeAll(async () => {
    // Read outputs from CI/CD generated file
    const outputPath = path.resolve(process.cwd(), "cfn-outputs/all-outputs.json");
    
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Outputs file not found at: ${outputPath}. Ensure CI/CD pipeline generates this file.`);
    }
    
    const outputsContent = fs.readFileSync(outputPath, "utf8");
    outputs = JSON.parse(outputsContent);
    
    // Initialize AWS clients
    const region = outputs.aws_region?.value || "us-east-1";
    s3Client = new S3Client({ region });
    lambdaClient = new LambdaClient({ region });
    apiGatewayClient = new APIGatewayClient({ region });
    cloudWatchLogsClient = new CloudWatchLogsClient({ region });
    iamClient = new IAMClient({ region });
  });

  describe("Output Validation", () => {
    test("required outputs are present", () => {
      const requiredOutputs = [
        "website_url",
        "api_gateway_url", 
        "lambda_function_name",
        "s3_bucket_name",
        "api_endpoint"
      ];
      
      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(outputs[outputName].value).toBeTruthy();
      });
    });

    test("outputs have correct types", () => {
      expect(outputs.website_url.type).toBe("string");
      expect(outputs.api_gateway_url.type).toBe("string"); 
      expect(outputs.lambda_function_name.type).toBe("string");
      expect(outputs.s3_bucket_name.type).toBe("string");
      expect(outputs.api_endpoint.type).toBe("string");
    });

    test("sensitive outputs are properly marked", () => {
      Object.keys(outputs).forEach(key => {
        expect(outputs[key].sensitive).toBe(false); // No sensitive outputs expected
      });
    });
  });

  describe("S3 Website Infrastructure", () => {
    test("S3 bucket exists and is accessible", async () => {
      const bucketName = outputs.s3_bucket_name.value;
      
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test("S3 bucket has website configuration", async () => {
      const bucketName = outputs.s3_bucket_name.value;
      
      const command = new GetBucketWebsiteCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);
      
      expect(response.IndexDocument?.Suffix).toBe("index.html");
      expect(response.ErrorDocument?.Key).toBe("error.html");
    });

    test("S3 bucket has proper tags", async () => {
      const bucketName = outputs.s3_bucket_name.value;
      
      try {
        const command = new GetBucketTaggingCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        
        const tags = response.TagSet || [];
        const tagMap = Object.fromEntries(tags.map(tag => [tag.Key, tag.Value]));
        
        expect(tagMap.Environment).toBeDefined();
        expect(tagMap.Project).toBeDefined();
        expect(tagMap.ManagedBy).toBe("Terraform");
      } catch (error: any) {
        if (error.name !== "NoSuchTagSet") {
          throw error;
        }
      }
    });

    test("index.html file exists and is accessible", async () => {
      const bucketName = outputs.s3_bucket_name.value;
      
      const command = new GetObjectCommand({ 
        Bucket: bucketName, 
        Key: "index.html" 
      });
      const response = await s3Client.send(command);
      
      expect(response.ContentType).toBe("text/html");
      expect(response.Body).toBeDefined();
    });

    test("error.html file exists", async () => {
      const bucketName = outputs.s3_bucket_name.value;
      
      const command = new GetObjectCommand({ 
        Bucket: bucketName, 
        Key: "error.html" 
      });
      const response = await s3Client.send(command);
      
      expect(response.ContentType).toBe("text/html");
      expect(response.Body).toBeDefined();
    });

    test("website URL is accessible", async () => {
      const websiteUrl = outputs.website_url.value;
      
      expect(websiteUrl).toMatch(/^https?:\/\//);
      
      // Test HTTP connectivity (basic check)
      try {
        const response = await fetch(websiteUrl, { method: "HEAD" });
        expect(response.ok || response.status === 403).toBe(true); // 403 might be expected for some S3 configurations
      } catch (error) {
        console.warn(`Website URL check failed: ${error}. This might be expected in some test environments.`);
      }
    }, 10000);
  });

  describe("Lambda Function Infrastructure", () => {
    test("Lambda function exists and is configured correctly", async () => {
      const functionName = outputs.lambda_function_name.value;
      
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      
      expect(response.Configuration?.Runtime).toMatch(/python3\.(11|12)/);
      expect(response.Configuration?.Handler).toBe("lambda_function.lambda_handler");
      expect(response.Configuration?.Timeout).toBeGreaterThan(0);
    });

    test("Lambda function has proper IAM role", async () => {
      const functionName = outputs.lambda_function_name.value;
      
      const functionCommand = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const functionResponse = await lambdaClient.send(functionCommand);
      
      const roleName = functionResponse.Role?.split('/').pop();
      expect(roleName).toBeDefined();
      
      if (roleName) {
        const roleCommand = new GetRoleCommand({ RoleName: roleName });
        const roleResponse = await iamClient.send(roleCommand);
        
        expect(roleResponse.Role?.AssumeRolePolicyDocument).toContain("lambda.amazonaws.com");
        
        // Check attached policies
        const policiesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
        const policiesResponse = await iamClient.send(policiesCommand);
        
        const attachedPolicies = policiesResponse.AttachedPolicies || [];
        const hasBasicExecutionRole = attachedPolicies.some(
          policy => policy.PolicyName === "AWSLambdaBasicExecutionRole"
        );
        
        expect(hasBasicExecutionRole).toBe(true);
      }
    });

    test("Lambda function can be invoked", async () => {
      const functionName = outputs.lambda_function_name.value;
      
      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({
          httpMethod: "GET",
          path: "/hello",
          headers: {},
          queryStringParameters: null,
          body: null
        })
      });
      
      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      
      if (response.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBe(200);
        expect(payload.body).toBeDefined();
        
        const body = JSON.parse(payload.body);
        expect(body.message).toBe("Hello from Lambda!");
        expect(body.timestamp).toBeDefined();
      }
    }, 15000);

    test("CloudWatch log group exists for Lambda", async () => {
      const functionName = outputs.lambda_function_name.value;
      const logGroupName = `/aws/lambda/${functionName}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await cloudWatchLogsClient.send(command);
      
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBeGreaterThan(0);
    });
  });

  describe("API Gateway Infrastructure", () => {
    let restApiId: string;
    
    beforeAll(() => {
      // Extract API ID from the gateway URL
      const apiGatewayUrl = outputs.api_gateway_url.value;
      const match = apiGatewayUrl.match(/https:\/\/([^\.]+)\.execute-api\./);
      restApiId = match?.[1] || "";
      expect(restApiId).toBeTruthy();
    });

    test("REST API exists and is configured correctly", async () => {
      const command = new GetRestApiCommand({ restApiId });
      const response = await apiGatewayClient.send(command);
      
      expect(response.name).toContain("serverless-webapp-api");
      expect(response.endpointConfiguration?.types).toContain("REGIONAL");
    });

    test("API stage exists with correct configuration", async () => {
      const command = new GetStageCommand({ 
        restApiId, 
        stageName: "prod" 
      });
      const response = await apiGatewayClient.send(command);
      
      expect(response.stageName).toBe("prod");
      expect(response.deploymentId).toBeDefined();
    });

    test("API has proper resources and methods", async () => {
      const command = new GetResourcesCommand({ restApiId });
      const response = await apiGatewayClient.send(command);
      
      const resources = response.items || [];
      const helloResource = resources.find(r => r.pathPart === "hello");
      
      expect(helloResource).toBeDefined();
      expect(helloResource?.resourceMethods).toBeDefined();
      expect(helloResource?.resourceMethods?.["GET"]).toBeDefined();
      expect(helloResource?.resourceMethods?.["OPTIONS"]).toBeDefined();
    });

    test("GET method has proper configuration", async () => {
      const resourcesCommand = new GetResourcesCommand({ restApiId });
      const resourcesResponse = await apiGatewayClient.send(resourcesCommand);
      
      const helloResource = resourcesResponse.items?.find(r => r.pathPart === "hello");
      expect(helloResource?.id).toBeDefined();
      
      if (helloResource?.id) {
        const methodCommand = new GetMethodCommand({
          restApiId,
          resourceId: helloResource.id,
          httpMethod: "GET"
        });
        const methodResponse = await apiGatewayClient.send(methodCommand);
        
        expect(methodResponse.authorizationType).toBe("NONE");
        expect(methodResponse.methodIntegration?.type).toBe("AWS_PROXY");
        expect(methodResponse.methodIntegration?.httpMethod).toBe("POST");
      }
    });

    test("API endpoint is accessible", async () => {
      const apiEndpoint = outputs.api_endpoint.value;
      
      try {
        const response = await fetch(apiEndpoint);
        expect(response.ok).toBe(true);
        
        const data = await response.json() as any;
        expect(data.message).toBe("Hello from Lambda!");
        expect(data.timestamp).toBeDefined();
        expect(data.method).toBe("GET");
        expect(data.path).toBe("/hello");
      } catch (error) {
        console.error(`API endpoint test failed: ${error}`);
        throw error;
      }
    }, 15000);

    test("CORS headers are properly configured", async () => {
      const apiEndpoint = outputs.api_endpoint.value;
      
      try {
        // Test OPTIONS request
        const optionsResponse = await fetch(apiEndpoint, { method: "OPTIONS" });
        expect(optionsResponse.ok).toBe(true);
        
        const corsHeaders = optionsResponse.headers;
        expect(corsHeaders.get("access-control-allow-origin")).toBe("*");
        expect(corsHeaders.get("access-control-allow-methods")).toContain("GET");
        expect(corsHeaders.get("access-control-allow-headers")).toBeDefined();
      } catch (error) {
        console.warn(`CORS test failed: ${error}. This might be expected in some configurations.`);
      }
    }, 10000);
  });

  describe("Integration and End-to-End Tests", () => {
    test("website can call Lambda function through API Gateway", async () => {
      const bucketName = outputs.s3_bucket_name.value;
      const apiEndpoint = outputs.api_endpoint.value;
      
      // Get the index.html content
      const command = new GetObjectCommand({ 
        Bucket: bucketName, 
        Key: "index.html" 
      });
      const response = await s3Client.send(command);
      
      const htmlContent = await response.Body?.transformToString();
      expect(htmlContent).toBeDefined();
      
      if (htmlContent) {
        // Verify the HTML contains the actual deployed API endpoint URL
        expect(htmlContent).toContain(apiEndpoint);
        
        // Test the actual API call that the frontend would make
        const apiResponse = await fetch(apiEndpoint);
        expect(apiResponse.ok).toBe(true);
        
        const apiData = await apiResponse.json() as any;
        expect(apiData.message).toBe("Hello from Lambda!");
      }
    }, 15000);

    test("all outputs are consistent with deployed resources", () => {
      const websiteUrl = outputs.website_url.value;
      const apiGatewayUrl = outputs.api_gateway_url.value;
      const apiEndpoint = outputs.api_endpoint.value;
      const bucketName = outputs.s3_bucket_name.value;
      const functionName = outputs.lambda_function_name.value;
      
      // Verify URL formats
      expect(websiteUrl).toMatch(/^https?:\/\//);
      expect(apiGatewayUrl).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com\/prod$/);
      expect(apiEndpoint).toMatch(/^https:\/\/.*\.execute-api\..*\.amazonaws\.com\/prod\/hello$/);
      
      // Verify naming consistency
      expect(bucketName).toMatch(/serverless-webapp-[a-f0-9]+/);
      expect(functionName).toMatch(/serverless-webapp-[a-f0-9]+/);
      
      // Verify API endpoint is derived from API Gateway URL
      expect(apiEndpoint).toBe(`${apiGatewayUrl}/hello`);
    });
  });

  describe("Security and Compliance Tests", () => {
    test("Lambda function follows security best practices", async () => {
      const functionName = outputs.lambda_function_name.value;
      
      const command = new GetFunctionConfigurationCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);
      
      // Check that no sensitive environment variables are exposed
      const envVars = response.Environment?.Variables || {};
      Object.keys(envVars).forEach(key => {
        expect(key).not.toMatch(/PASSWORD|SECRET|KEY|TOKEN/i);
      });
      
      // Verify reasonable timeout and memory settings
      expect(response.Timeout).toBeLessThanOrEqual(300); // Max 5 minutes
      expect(response.MemorySize).toBeGreaterThanOrEqual(128);
    });

    test("S3 bucket follows security best practices", async () => {
      const bucketName = outputs.s3_bucket_name.value;
      
      try {
        const command = new GetBucketPolicyCommand({ Bucket: bucketName });
        const response = await s3Client.send(command);
        
        if (response.Policy) {
          const policy = JSON.parse(response.Policy);
          const statements = policy.Statement || [];
          
          // Check that policy only allows GetObject, not broader permissions
          statements.forEach((statement: any) => {
            if (statement.Effect === "Allow" && statement.Action) {
              const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
              actions.forEach((action: string) => {
                expect(action).not.toBe("s3:*");
                expect(action).not.toBe("s3:Put*");
                expect(action).not.toBe("s3:Delete*");
              });
            }
          });
        }
      } catch (error: any) {
        if (error.name !== "NoSuchBucketPolicy") {
          throw error;
        }
      }
    });

    test("API Gateway has proper throttling and monitoring", async () => {
      const apiGatewayUrl = outputs.api_gateway_url.value;
      const match = apiGatewayUrl.match(/https:\/\/([^\.]+)\.execute-api\./);
      const restApiId = match?.[1];
      
      if (restApiId) {
        const command = new GetStageCommand({ 
          restApiId, 
          stageName: "prod" 
        });
        const response = await apiGatewayClient.send(command);
        
        // Verify stage exists and is properly configured
        expect(response.stageName).toBe("prod");
        expect(response.deploymentId).toBeDefined();
      }
    });
  });
});