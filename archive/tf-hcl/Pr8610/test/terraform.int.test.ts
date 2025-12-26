import * as fs from 'fs';
import * as path from 'path';

interface CloudWatchLogGroups {
  api_gateway: string;
  lambda_logs: {
    health: string;
    notification: string;
    user: string;
  };
}

interface LambdaFunctionArns {
  health: string;
  notification: string;
  user: string;
}

interface LambdaFunctionNames {
  health: string;
  notification: string;
  user: string;
}

interface FlatOutputs {
  api_endpoints: {
    health: string;
    notifications: string;
    user_by_id: string;
    users: string;
  };
  api_gateway_id: string;
  api_gateway_stage_url: string;
  api_gateway_url: string;
  cloudwatch_log_groups: CloudWatchLogGroups;
  environment_suffix: string;
  lambda_function_arns: LambdaFunctionArns;
  lambda_function_names: LambdaFunctionNames;
  secrets_manager_secret_arn: string;
}

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: FlatOutputs;

  beforeAll(() => {
    // Load the flat outputs from the JSON file
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent) as FlatOutputs;
  });

  describe('Infrastructure Validation', () => {
    test('API Gateway ID should be valid', () => {
      expect(outputs.api_gateway_id).toBeDefined();
      expect(outputs.api_gateway_id.length).toBeGreaterThan(0);
      // API Gateway IDs are typically 10 characters
      expect(outputs.api_gateway_id.length).toBe(10);
    });

    test('API Gateway URLs should be properly formatted', () => {
      expect(outputs.api_gateway_stage_url).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/[a-z0-9]+$/);
      expect(outputs.api_gateway_url).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/[a-z0-9]+$/);
    });

    test('Lambda function names should be valid', () => {
      Object.values(outputs.lambda_function_names).forEach((name) => {
        expect(name).toBeDefined();
        expect(name.length).toBeGreaterThan(0);
        expect(name).toMatch(/^srvls-ms-[a-z-]+-service$/);
      });
    });

    test('Lambda function ARNs should be properly formatted', () => {
      Object.values(outputs.lambda_function_arns).forEach((arn) => {
        expect(arn).toBeDefined();
        expect(arn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d+:function:.+$/);
      });
    });

    test('CloudWatch log groups should be properly formatted', () => {
      expect(outputs.cloudwatch_log_groups.api_gateway).toMatch(/^\/aws\/apigateway\//);
      Object.values(outputs.cloudwatch_log_groups.lambda_logs).forEach((logGroup) => {
        expect(logGroup).toMatch(/^\/aws\/lambda\//);
      });
    });

    test('Secrets Manager ARN should be valid', () => {
      expect(outputs.secrets_manager_secret_arn).toMatch(/^arn:aws:secretsmanager:[a-z0-9-]+:\d+:secret:.+$/);
    });

    test('Environment suffix should be defined', () => {
      expect(outputs.environment_suffix).toBeDefined();
      // Environment suffix can be empty string or a valid suffix
      expect(typeof outputs.environment_suffix).toBe('string');
    });

    test('API endpoints should contain all required endpoints', () => {
      expect(outputs.api_endpoints).toBeDefined();
      expect(outputs.api_endpoints.health).toBeDefined();
      expect(outputs.api_endpoints.notifications).toBeDefined();
      expect(outputs.api_endpoints.user_by_id).toBeDefined();
      expect(outputs.api_endpoints.users).toBeDefined();

      // All endpoints should be valid URLs
      Object.values(outputs.api_endpoints).forEach((endpoint) => {
        expect(endpoint).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/[a-z0-9]+\/[a-zA-Z0-9\/{}]+$/);
      });
    });

    test('Lambda functions should have consistent naming', () => {
      const functionNames = Object.values(outputs.lambda_function_names);
      const functionArns = Object.values(outputs.lambda_function_arns);

      // Should have exactly 3 Lambda functions
      expect(functionNames).toHaveLength(3);
      expect(functionArns).toHaveLength(3);

      // All function names should be unique
      expect(new Set(functionNames).size).toBe(3);

      // Function ARNs should correspond to function names
      functionNames.forEach((name, index) => {
        expect(functionArns[index]).toContain(name);
      });
    });

    test('API Gateway stage should be consistent across URLs', () => {
      // Extract stage from API Gateway URLs
      const stageFromStageUrl = outputs.api_gateway_stage_url.split('/').pop();
      const stageFromUrl = outputs.api_gateway_url.split('/').pop();

      // Both URLs should have the same stage
      expect(stageFromStageUrl).toBe(stageFromUrl);

      // Stage should be a valid string (typically 'dev', 'prod', etc.)
      expect(stageFromStageUrl).toBeDefined();
      expect(stageFromStageUrl?.length).toBeGreaterThan(0);
    });
  });
});
