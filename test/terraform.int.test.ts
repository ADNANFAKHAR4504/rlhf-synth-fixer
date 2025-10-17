// test/terraform.int.test.ts
// Integration tests for Payment API Gateway Infrastructure
// CRITICAL: Works with existing CI/CD setup (no package.json changes needed)

import { 
  APIGatewayClient, 
  GetRestApiCommand, 
  GetStageCommand, 
  GetUsagePlanCommand 
} from '@aws-sdk/client-api-gateway';
import { 
  LambdaClient, 
  GetFunctionCommand, 
  InvokeCommand 
} from '@aws-sdk/client-lambda';
import { 
  CloudWatchLogsClient, 
  DescribeLogGroupsCommand 
} from '@aws-sdk/client-cloudwatch-logs';
import { 
  IAMClient, 
  GetRoleCommand, 
  ListAttachedRolePoliciesCommand 
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

describe('Payment API Gateway Infrastructure - Integration Tests', () => {
  let outputs: any;
  let region: string;

  beforeAll(() => {
    outputs = loadOutputs();
    region = process.env.AWS_REGION || 'us-east-1';
    
    console.log('✅ Using region:', region);
    console.log('✅ Loaded outputs:', JSON.stringify(outputs, null, 2));
    
    // Validate required outputs
    const required = [
      'api_invoke_url',
      'api_gateway_id', 
      'usage_plan_id',
      'cloudwatch_log_group_name',
      'lambda_function_name',
      'lambda_function_arn'
    ];
    
    const missing = required.filter(k => !outputs[k]);
    if (missing.length > 0) {
      throw new Error(`Missing outputs: ${missing.join(', ')}`);
    }
  });

  function loadOutputs(): any {
    console.log('🔍 Searching for output files...\n');

    // Path 1: lib/terraform-outputs.json (LOCAL - where you actually created it)
    const libPath = path.join(process.cwd(), 'lib', 'terraform-outputs.json');
    if (fs.existsSync(libPath)) {
      console.log('✅ FOUND: lib/terraform-outputs.json (LOCAL DEPLOYMENT)\n');
      
      // Read file and strip BOM if present (PowerShell creates files with BOM)
      let fileContent = fs.readFileSync(libPath, 'utf-8');
      
      // Remove BOM (Byte Order Mark) - common in PowerShell redirected output
      if (fileContent.charCodeAt(0) === 0xFEFF) {
        fileContent = fileContent.slice(1);
      }
      fileContent = fileContent.replace(/^\uFEFF/, '').trim();
      
      const raw = JSON.parse(fileContent);
      
      const flattened: any = {};
      for (const [key, data] of Object.entries(raw)) {
        flattened[key] = (data as any).value;
      }
      return flattened;
    }

    // Path 2: terraform-outputs.json (ROOT - alternative)
    const rootPath = path.join(process.cwd(), 'terraform-outputs.json');
    if (fs.existsSync(rootPath)) {
      console.log('✅ FOUND: terraform-outputs.json (ROOT)\n');
      
      let fileContent = fs.readFileSync(rootPath, 'utf-8');
      if (fileContent.charCodeAt(0) === 0xFEFF) {
        fileContent = fileContent.slice(1);
      }
      fileContent = fileContent.replace(/^\uFEFF/, '').trim();
      
      const raw = JSON.parse(fileContent);
      
      const flattened: any = {};
      for (const [key, data] of Object.entries(raw)) {
        flattened[key] = (data as any).value;
      }
      return flattened;
    }

    // Path 3: cfn-outputs/flat-outputs.json (CI/CD)
    const ciPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(ciPath)) {
      console.log('✅ FOUND: cfn-outputs/flat-outputs.json (GITHUB CI)\n');
      
      let fileContent = fs.readFileSync(ciPath, 'utf-8');
      if (fileContent.charCodeAt(0) === 0xFEFF) {
        fileContent = fileContent.slice(1);
      }
      fileContent = fileContent.replace(/^\uFEFF/, '').trim();
      
      return JSON.parse(fileContent);
    }

    throw new Error(
      '❌ ERROR: No output file found!\n\n' +
      'For LOCAL testing:\n' +
      '  1. cd lib\n' +
      '  2. terraform apply -auto-approve\n' +
      '  3. terraform output -json | Out-File -Encoding UTF8 terraform-outputs.json\n' +
      '  4. cd ..\n' +
      '  5. npm run test:integration\n\n' +
      'For CI/CD:\n' +
      '  - File cfn-outputs/flat-outputs.json will be auto-generated\n'
    );
  }

  // ========================================================================
  // TEST GROUP 1: OUTPUT VALIDATION (7 tests)
  // ========================================================================
  describe('Output Validation', () => {
    test('outputs file loaded successfully', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('has api_invoke_url output', () => {
      expect(outputs.api_invoke_url).toBeDefined();
      expect(outputs.api_invoke_url).toMatch(/https:\/\/.+\.execute-api\..+\.amazonaws\.com\/prod\/process-payment/);
    });

    test('has api_gateway_id output', () => {
      expect(outputs.api_gateway_id).toBeDefined();
      expect(typeof outputs.api_gateway_id).toBe('string');
      expect(outputs.api_gateway_id.length).toBeGreaterThan(0);
    });

    test('has usage_plan_id output', () => {
      expect(outputs.usage_plan_id).toBeDefined();
      expect(typeof outputs.usage_plan_id).toBe('string');
    });

    test('has cloudwatch_log_group_name output', () => {
      expect(outputs.cloudwatch_log_group_name).toBeDefined();
      expect(outputs.cloudwatch_log_group_name).toBe('/aws/apigateway/payment-api');
    });

    test('has lambda_function_name output', () => {
      expect(outputs.lambda_function_name).toBeDefined();
      expect(outputs.lambda_function_name).toMatch(/^payment-processor-/);
    });

    test('has lambda_function_arn output', () => {
      expect(outputs.lambda_function_arn).toBeDefined();
      expect(outputs.lambda_function_arn).toMatch(/^arn:aws:lambda:/);
    });
  });

  // ========================================================================
  // TEST GROUP 2: API GATEWAY REST API (4 tests)
  // ========================================================================
  describe('API Gateway REST API', () => {
    test('REST API exists', async () => {
      const client = new APIGatewayClient({ region });
      
      const response = await client.send(new GetRestApiCommand({
        restApiId: outputs.api_gateway_id
      }));

      expect(response.name).toBe('payment-api');
      expect(response.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('prod stage exists and is configured', async () => {
      const client = new APIGatewayClient({ region });
      
      const response = await client.send(new GetStageCommand({
        restApiId: outputs.api_gateway_id,
        stageName: 'prod'
      }));

      expect(response.stageName).toBe('prod');
      expect(response.accessLogSettings).toBeDefined();
    });

    test('stage has CloudWatch logging configured', async () => {
      const client = new APIGatewayClient({ region });
      
      const response = await client.send(new GetStageCommand({
        restApiId: outputs.api_gateway_id,
        stageName: 'prod'
      }));

      expect(response.accessLogSettings?.destinationArn).toBeDefined();
      expect(response.accessLogSettings?.format).toBeDefined();
    });

    test('method settings enable metrics and logging', async () => {
      const client = new APIGatewayClient({ region });
      
      const response = await client.send(new GetStageCommand({
        restApiId: outputs.api_gateway_id,
        stageName: 'prod'
      }));

      const methodSettings = response.methodSettings?.['*/*'];
      expect(methodSettings?.metricsEnabled).toBe(true);
      expect(methodSettings?.loggingLevel).toBe('INFO');
      expect(methodSettings?.dataTraceEnabled).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 3: USAGE PLAN AND API KEY (4 tests)
  // ========================================================================
  describe('Usage Plan and API Key', () => {
    test('usage plan exists', async () => {
      const client = new APIGatewayClient({ region });
      
      const response = await client.send(new GetUsagePlanCommand({
        usagePlanId: outputs.usage_plan_id
      }));

      expect(response.name).toMatch(/^payment-api-usage-plan-/);
    });

    test('usage plan has throttle settings', async () => {
      const client = new APIGatewayClient({ region });
      
      const response = await client.send(new GetUsagePlanCommand({
        usagePlanId: outputs.usage_plan_id
      }));

      expect(response.throttle).toBeDefined();
      expect(response.throttle?.rateLimit).toBe(100);
      expect(response.throttle?.burstLimit).toBe(200);
    });

    test('usage plan has quota settings', async () => {
      const client = new APIGatewayClient({ region });
      
      const response = await client.send(new GetUsagePlanCommand({
        usagePlanId: outputs.usage_plan_id
      }));

      expect(response.quota).toBeDefined();
      expect(response.quota?.limit).toBe(10000);
      expect(response.quota?.period).toBe('DAY');
    });

    test('usage plan is associated with prod stage', async () => {
      const client = new APIGatewayClient({ region });
      
      const response = await client.send(new GetUsagePlanCommand({
        usagePlanId: outputs.usage_plan_id
      }));

      const apiStages = response.apiStages || [];
      expect(apiStages.length).toBeGreaterThan(0);
      expect(apiStages[0].apiId).toBe(outputs.api_gateway_id);
      expect(apiStages[0].stage).toBe('prod');
    });
  });

  // ========================================================================
  // TEST GROUP 4: LAMBDA FUNCTION (5 tests)
  // ========================================================================
  describe('Lambda Function', () => {
    test('Lambda function exists', async () => {
      const client = new LambdaClient({ region });
      
      const response = await client.send(new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name
      }));

      expect(response.Configuration?.FunctionName).toBe(outputs.lambda_function_name);
      expect(response.Configuration?.Runtime).toBe('python3.11');
    });

    test('Lambda function has correct handler', async () => {
      const client = new LambdaClient({ region });
      
      const response = await client.send(new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name
      }));

      expect(response.Configuration?.Handler).toBe('lambda_function.lambda_handler');
    });

    test('Lambda function has environment variable', async () => {
      const client = new LambdaClient({ region });
      
      const response = await client.send(new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name
      }));

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe('production');
    });

    test('Lambda function has correct tags', async () => {
      const client = new LambdaClient({ region });
      
      const response = await client.send(new GetFunctionCommand({
        FunctionName: outputs.lambda_function_name
      }));

      const tags = response.Tags || {};
      expect(tags.Environment).toBe('production');
      expect(tags.ManagedBy).toBe('terraform');
      expect(tags.Service).toBe('payment-processing');
    });

    test('Lambda function can be invoked', async () => {
      const client = new LambdaClient({ region });
      
      const response = await client.send(new InvokeCommand({
        FunctionName: outputs.lambda_function_name,
        Payload: Buffer.from(JSON.stringify({
          body: JSON.stringify({ amount: 100, currency: 'USD' })
        }))
      }));

      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(payload.statusCode).toBe(200);
    });
  });

  // ========================================================================
  // TEST GROUP 5: IAM ROLES (4 tests)
  // ========================================================================
  describe('IAM Roles', () => {
    test('Lambda execution role exists', async () => {
      const client = new IAMClient({ region });
      
      const suffix = outputs.lambda_function_name.split('-').pop();
      const lambdaRoleName = `payment-processor-lambda-role-${suffix}`;
      
      const response = await client.send(new GetRoleCommand({
        RoleName: lambdaRoleName
      }));

      expect(response.Role?.RoleName).toBe(lambdaRoleName);
    });

    test('Lambda role has basic execution policy attached', async () => {
      const client = new IAMClient({ region });
      
      const suffix = outputs.lambda_function_name.split('-').pop();
      const lambdaRoleName = `payment-processor-lambda-role-${suffix}`;
      
      const response = await client.send(new ListAttachedRolePoliciesCommand({
        RoleName: lambdaRoleName
      }));

      const policies = response.AttachedPolicies || [];
      const hasBasicPolicy = policies.some(p => 
        p.PolicyName?.includes('AWSLambdaBasicExecutionRole')
      );
      
      expect(hasBasicPolicy).toBe(true);
    });

    test('API Gateway CloudWatch role exists', async () => {
      const client = new IAMClient({ region });
      
      const suffix = outputs.lambda_function_name.split('-').pop();
      const apiGatewayRoleName = `payment-api-gateway-cloudwatch-${suffix}`;
      
      const response = await client.send(new GetRoleCommand({
        RoleName: apiGatewayRoleName
      }));

      expect(response.Role?.RoleName).toBe(apiGatewayRoleName);
    });

    test('API Gateway role has CloudWatch logs policy attached', async () => {
      const client = new IAMClient({ region });
      
      const suffix = outputs.lambda_function_name.split('-').pop();
      const apiGatewayRoleName = `payment-api-gateway-cloudwatch-${suffix}`;
      
      const response = await client.send(new ListAttachedRolePoliciesCommand({
        RoleName: apiGatewayRoleName
      }));

      const policies = response.AttachedPolicies || [];
      const hasCloudWatchPolicy = policies.some(p => 
        p.PolicyName?.includes('AmazonAPIGatewayPushToCloudWatchLogs')
      );
      
      expect(hasCloudWatchPolicy).toBe(true);
    });
  });

  // ========================================================================
  // TEST GROUP 6: CLOUDWATCH LOGS (2 tests)
  // ========================================================================
  describe('CloudWatch Logs', () => {
    test('CloudWatch log group exists', async () => {
      const client = new CloudWatchLogsClient({ region });
      
      const response = await client.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group_name
      }));

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
      expect(response.logGroups![0].logGroupName).toBe(outputs.cloudwatch_log_group_name);
    });

    test('log group has retention policy set', async () => {
      const client = new CloudWatchLogsClient({ region });
      
      const response = await client.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.cloudwatch_log_group_name
      }));

      expect(response.logGroups![0].retentionInDays).toBe(7);
    });
  });

  // ========================================================================
  // TEST GROUP 7: END-TO-END WORKFLOW (2 tests)
  // ========================================================================
  describe('End-to-End Workflow', () => {
    test('complete deployment workflow verified', () => {
      expect(outputs.api_gateway_id).toBeDefined();
      expect(outputs.lambda_function_name).toBeDefined();
      expect(outputs.usage_plan_id).toBeDefined();
      expect(outputs.cloudwatch_log_group_name).toBeDefined();
      expect(outputs.api_invoke_url).toBeDefined();
      expect(outputs.lambda_function_arn).toBeDefined();
    });

    test('all resources use consistent naming with suffix', () => {
      const suffix = outputs.lambda_function_name.split('-').pop();
      expect(suffix).toBeDefined();
      expect(suffix?.length).toBe(8);
      
      // Verify suffix is alphanumeric lowercase
      expect(suffix).toMatch(/^[a-z0-9]{8}$/);
    });
  });
});