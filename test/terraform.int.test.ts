// Integration tests for Terraform serverless infrastructure
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand
} from "@aws-sdk/client-api-gateway";
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient
} from "@aws-sdk/client-lambda";
import {
  GetSecretValueCommand,
  SecretsManagerClient
} from "@aws-sdk/client-secrets-manager";
import fs from "fs";
import path from "path";

// Load deployment outputs
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  
  // Parse the structured outputs to match expected format
  const apiEndpoints = JSON.parse(rawOutputs.api_endpoints || "{}");
  const lambdaNames = JSON.parse(rawOutputs.lambda_function_names || "{}");
  
  outputs = {
    ApiGatewayUrl: rawOutputs.api_gateway_url,
    ApiGatewayId: rawOutputs.api_gateway_id,
    HealthEndpoint: apiEndpoints.health,
    UsersEndpoint: apiEndpoints.users,
    NotificationsEndpoint: apiEndpoints.notifications,
    HealthLambdaName: lambdaNames.health,
    UserLambdaName: lambdaNames.user,
    NotificationLambdaName: lambdaNames.notification,
    SecretsManagerArn: rawOutputs.secrets_manager_secret_arn
  };
}

// Configure AWS clients
const region = "us-east-1";
const lambdaClient = new LambdaClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });
const secretsClient = new SecretsManagerClient({ region });

// Check if AWS credentials are available
const hasAwsCredentials = () => {
  return process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
};

describe("Terraform Infrastructure Integration Tests", () => {
  
  describe("Deployment Outputs", () => {
    test("required outputs are present", () => {
      expect(outputs.ApiGatewayUrl).toBeDefined();
      expect(outputs.ApiGatewayId).toBeDefined();
      expect(outputs.HealthEndpoint).toBeDefined();
      expect(outputs.UsersEndpoint).toBeDefined();
      expect(outputs.NotificationsEndpoint).toBeDefined();
      expect(outputs.HealthLambdaName).toBeDefined();
      expect(outputs.UserLambdaName).toBeDefined();
      expect(outputs.NotificationLambdaName).toBeDefined();
      expect(outputs.SecretsManagerArn).toBeDefined();
    });

    test("API Gateway URL is valid", () => {
      expect(outputs.ApiGatewayUrl).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\//);
    });

    test("Lambda function names follow naming convention", () => {
      expect(outputs.HealthLambdaName).toMatch(/^srvls-ms(-.*)?-health-service$/);
      expect(outputs.UserLambdaName).toMatch(/^srvls-ms(-.*)?-user-service$/);
      expect(outputs.NotificationLambdaName).toMatch(/^srvls-ms(-.*)?-notification-service$/);
    });
  });

  describe("Lambda Functions", () => {
    test("health Lambda function exists and is configured", async () => {
      if (!hasAwsCredentials()) {
        console.warn("⚠️ Skipping AWS SDK test - no credentials available");
        return;
      }
      
      const command = new GetFunctionCommand({
        FunctionName: outputs.HealthLambdaName
      });
      
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(outputs.HealthLambdaName);
      expect(response.Configuration?.Runtime).toBe("python3.8");
      expect(response.Configuration?.Handler).toBe("health_service.lambda_handler");
      expect(response.Configuration?.Timeout).toBe(30);
    });

    test("user Lambda function exists and is configured", async () => {
      if (!hasAwsCredentials()) {
        console.warn("⚠️ Skipping AWS SDK test - no credentials available");
        return;
      }
      
      const command = new GetFunctionCommand({
        FunctionName: outputs.UserLambdaName
      });
      
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(outputs.UserLambdaName);
      expect(response.Configuration?.Runtime).toBe("python3.8");
      expect(response.Configuration?.Handler).toBe("user_service.lambda_handler");
    });

    test("notification Lambda function exists and is configured", async () => {
      if (!hasAwsCredentials()) {
        console.warn("⚠️ Skipping AWS SDK test - no credentials available");
        return;
      }
      
      const command = new GetFunctionCommand({
        FunctionName: outputs.NotificationLambdaName
      });
      
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(outputs.NotificationLambdaName);
      expect(response.Configuration?.Runtime).toBe("python3.8");
      expect(response.Configuration?.Handler).toBe("notification_service.lambda_handler");
    });

    test("Lambda functions have environment variables", async () => {
      if (!hasAwsCredentials()) {
        console.warn("⚠️ Skipping AWS SDK test - no credentials available");
        return;
      }
      
      const command = new GetFunctionCommand({
        FunctionName: outputs.HealthLambdaName
      });
      
      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe("dev");
      expect(response.Configuration?.Environment?.Variables?.SECRETS_ARN).toBeDefined();
    });
  });

  describe("API Gateway", () => {
    test("REST API exists and is configured", async () => {
      if (!hasAwsCredentials()) {
        console.warn("⚠️ Skipping AWS SDK test - no credentials available");
        return;
      }
      
      const command = new GetRestApiCommand({
        restApiId: outputs.ApiGatewayId
      });
      
      const response = await apiGatewayClient.send(command);
      expect(response.name).toMatch(/srvls-ms(-.*)?-api/);
      expect(response.endpointConfiguration?.types).toContain("REGIONAL");
    });

    test("API Gateway stage is deployed", async () => {
      if (!hasAwsCredentials()) {
        console.warn("⚠️ Skipping AWS SDK test - no credentials available");
        return;
      }
      
      const command = new GetStageCommand({
        restApiId: outputs.ApiGatewayId,
        stageName: "dev"
      });
      
      const response = await apiGatewayClient.send(command);
      expect(response.stageName).toBe("dev");
      expect(response.deploymentId).toBeDefined();
    });
  });

  describe("Secrets Manager", () => {
    test("API keys secret exists", async () => {
      if (!hasAwsCredentials()) {
        console.warn("⚠️ Skipping AWS SDK test - no credentials available");
        return;
      }
      
      const command = new GetSecretValueCommand({
        SecretId: outputs.SecretsManagerArn
      });
      
      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();
      
      const secretData = JSON.parse(response.SecretString!);
      expect(secretData.api_key).toBeDefined();
      expect(secretData.notification_service_key).toBeDefined();
    });
  });

  describe("API Endpoints", () => {
    test("health endpoint returns successful response", async () => {
      const response = await fetch(outputs.HealthEndpoint);
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.status).toBe("healthy");
      expect(data.service).toBe("health-check");
      expect(data.version).toBe("1.0.0");
      expect(data.timestamp).toBeDefined();
    });

    test("users GET endpoint returns list of users", async () => {
      const response = await fetch(outputs.UsersEndpoint);
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.users).toBeDefined();
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.total).toBeDefined();
    });

    test("users POST endpoint creates a user", async () => {
      const response = await fetch(outputs.UsersEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com'
        })
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.user_id).toBeDefined();
      expect(data.name).toBe('Test User');
      expect(data.email).toBe('test@example.com');
      expect(data.message).toBe('User created successfully');
    });

    test("users GET by ID endpoint returns specific user", async () => {
      const response = await fetch(`${outputs.UsersEndpoint}/123`);
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.user_id).toBe('123');
      expect(data.name).toBeDefined();
      expect(data.email).toBeDefined();
    });

    test("users PUT endpoint updates a user", async () => {
      const response = await fetch(`${outputs.UsersEndpoint}/123`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Updated User',
          email: 'updated@example.com'
        })
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.user_id).toBe('123');
      expect(data.name).toBe('Updated User');
      expect(data.email).toBe('updated@example.com');
      expect(data.message).toBe('User updated successfully');
    });

    test("users DELETE endpoint deletes a user", async () => {
      const response = await fetch(`${outputs.UsersEndpoint}/123`, {
        method: 'DELETE'
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.user_id).toBe('123');
      expect(data.message).toBe('User deleted successfully');
      expect(data.deleted_at).toBeDefined();
    });

    test("notifications POST endpoint sends notification", async () => {
      const response = await fetch(outputs.NotificationsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'email',
          recipient: 'user@example.com',
          message: 'Test notification message'
        })
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.notification_id).toBeDefined();
      expect(data.type).toBe('email');
      expect(data.recipient).toBe('user@example.com');
      expect(data.message).toBe('Test notification message');
      expect(data.status).toBe('sent');
      expect(data.sent_at).toBeDefined();
    });

    test("API endpoints handle CORS properly", async () => {
      const response = await fetch(outputs.HealthEndpoint);
      
      const headers = response.headers;
      expect(headers.get('access-control-allow-origin')).toBe('*');
      expect(headers.get('content-type')).toContain('application/json');
    });
  });

  describe("Lambda Invocation", () => {
    test("can directly invoke health Lambda function", async () => {
      if (!hasAwsCredentials()) {
        console.warn("⚠️ Skipping AWS SDK test - no credentials available");
        return;
      }
      
      const command = new InvokeCommand({
        FunctionName: outputs.HealthLambdaName,
        Payload: JSON.stringify({
          httpMethod: 'GET',
          path: '/health'
        })
      });
      
      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      
      expect(payload.statusCode).toBe(200);
      const body = JSON.parse(payload.body);
      expect(body.status).toBe('healthy');
    });

    test("can directly invoke user Lambda with different methods", async () => {
      if (!hasAwsCredentials()) {
        console.warn("⚠️ Skipping AWS SDK test - no credentials available");
        return;
      }
      
      // Test GET all users
      const getCommand = new InvokeCommand({
        FunctionName: outputs.UserLambdaName,
        Payload: JSON.stringify({
          httpMethod: 'GET',
          pathParameters: null
        })
      });
      
      const getResponse = await lambdaClient.send(getCommand);
      const getPayload = JSON.parse(new TextDecoder().decode(getResponse.Payload));
      expect(getPayload.statusCode).toBe(200);
      
      // Test POST to create user
      const postCommand = new InvokeCommand({
        FunctionName: outputs.UserLambdaName,
        Payload: JSON.stringify({
          httpMethod: 'POST',
          body: JSON.stringify({
            name: 'Lambda Test User',
            email: 'lambda@test.com'
          })
        })
      });
      
      const postResponse = await lambdaClient.send(postCommand);
      const postPayload = JSON.parse(new TextDecoder().decode(postResponse.Payload));
      expect(postPayload.statusCode).toBe(200);
    });

    test("can directly invoke notification Lambda", async () => {
      if (!hasAwsCredentials()) {
        console.warn("⚠️ Skipping AWS SDK test - no credentials available");
        return;
      }
      
      const command = new InvokeCommand({
        FunctionName: outputs.NotificationLambdaName,
        Payload: JSON.stringify({
          httpMethod: 'POST',
          body: JSON.stringify({
            type: 'sms',
            recipient: '+1234567890',
            message: 'Test SMS notification'
          })
        })
      });
      
      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      
      expect(payload.statusCode).toBe(200);
      const body = JSON.parse(payload.body);
      expect(body.notification_id).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    test("API returns 500 for malformed requests", async () => {
      // Send malformed JSON to trigger error
      const response = await fetch(outputs.NotificationsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json'
      });
      
      // Should return error status
      expect([400, 500].includes(response.status)).toBe(true);
    });

    test("Lambda functions handle exceptions gracefully", async () => {
      if (!hasAwsCredentials()) {
        console.warn("⚠️ Skipping AWS SDK test - no credentials available");
        return;
      }
      
      // Send invalid method to trigger error handling
      const command = new InvokeCommand({
        FunctionName: outputs.UserLambdaName,
        Payload: JSON.stringify({
          httpMethod: 'INVALID_METHOD',
          pathParameters: null
        })
      });
      
      const response = await lambdaClient.send(command);
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      
      // Should still return a response even with invalid method
      expect(payload.statusCode).toBeDefined();
      expect([400, 405, 500].includes(payload.statusCode)).toBe(true);
    });
  });
});