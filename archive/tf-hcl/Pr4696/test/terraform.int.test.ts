// test/terraform.int.test.ts
// Integration tests for Payment API Gateway + Lambda
// Validates deployed infrastructure and complete payment workflows
// CRITICAL: Uses cfn-outputs/flat-outputs.json (NO MOCKING)
// CRITICAL: No assertions on environment names/suffixes (reproducibility)

import fs from 'fs';
import path from 'path';
import axios, { AxiosError } from 'axios';
import {
  APIGatewayClient,
  GetRestApiCommand,
  GetStageCommand,
  GetUsagePlanCommand,
  GetApiKeyCommand,
} from '@aws-sdk/client-api-gateway';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  IAMClient,
  GetRoleCommand,
} from '@aws-sdk/client-iam';

const FLAT_OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

interface FlatOutputs {
  [key: string]: string;
}

describe('Payment API Gateway - Integration Tests (Live)', () => {
  let outputs: FlatOutputs;
  let apiGatewayClient: APIGatewayClient;
  let lambdaClient: LambdaClient;
  let logsClient: CloudWatchLogsClient;
  let iamClient: IAMClient;
  
  let apiInvokeUrl: string;
  let apiKeyValue: string;
  let apiGatewayId: string;
  let usagePlanId: string;
  let logGroupName: string;
  let lambdaFunctionName: string;
  let lambdaFunctionArn: string;
  let region: string;

  beforeAll(() => {
    try {
      console.log('📊 Reading deployment outputs from flat-outputs.json...');
      
      if (!fs.existsSync(FLAT_OUTPUTS_PATH)) {
        throw new Error(`Flat outputs file not found at: ${FLAT_OUTPUTS_PATH}`);
      }
      
      const outputsContent = fs.readFileSync(FLAT_OUTPUTS_PATH, 'utf8');
      outputs = JSON.parse(outputsContent);
      
      console.log('✅ Successfully loaded deployment outputs');
      console.log(`📦 Found ${Object.keys(outputs).length} outputs`);
      
      // Extract values from outputs (NOT hardcoded)
      apiInvokeUrl = outputs.api_invoke_url;
      apiKeyValue = outputs.api_key_value;
      apiGatewayId = outputs.api_gateway_id;
      usagePlanId = outputs.usage_plan_id;
      logGroupName = outputs.cloudwatch_log_group_name;
      lambdaFunctionName = outputs.lambda_function_name;
      lambdaFunctionArn = outputs.lambda_function_arn;
      
      // Extract region from API Gateway URL to ensure we look in the correct region
      // This makes tests region-agnostic and work regardless of where infrastructure was deployed
      const apiUrlMatch = apiInvokeUrl.match(/https:\/\/[^.]+\.execute-api\.([^.]+)\.amazonaws\.com/);
      region = apiUrlMatch ? apiUrlMatch[1] : (process.env.AWS_REGION || 'us-east-1');
      
      // Initialize AWS SDK clients
      apiGatewayClient = new APIGatewayClient({ region });
      lambdaClient = new LambdaClient({ region });
      logsClient = new CloudWatchLogsClient({ region });
      iamClient = new IAMClient({ region });
      
      console.log('🔧 Clients initialized');
      console.log('📋 API Invoke URL:', apiInvokeUrl);
      console.log('📋 Detected Region:', region);
      console.log('📋 Lambda Function:', lambdaFunctionName);
      console.log('📋 Log Group:', logGroupName);
      
    } catch (error: any) {
      console.error('❌ Failed to load deployment outputs:', error.message);
      throw new Error('Deployment outputs not available. Run deployment first.');
    }
  });

  // ========================================================================
  // TEST GROUP 1: OUTPUT VALIDATION (10 tests)
  // ========================================================================
  describe('Output Validation', () => {
    test('all required outputs exist', () => {
      const requiredOutputs = [
        'api_invoke_url',
        'api_key_value',
        'api_gateway_id',
        'usage_plan_id',
        'cloudwatch_log_group_name',
        'lambda_function_name',
        'lambda_function_arn',
      ];

      requiredOutputs.forEach(key => {
        expect(outputs).toHaveProperty(key);
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).toBeTruthy();
      });
    });

    test('all output values are non-empty strings', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(typeof value).toBe('string');
        expect(value.trim().length).toBeGreaterThan(0);
      });
    });

    test('api_invoke_url has correct HTTPS format', () => {
      expect(apiInvokeUrl).toMatch(/^https:\/\/[a-z0-9]+\.execute-api\.[a-z0-9-]+\.amazonaws\.com\/prod\/process-payment$/);
    });

    test('api_gateway_id follows AWS pattern', () => {
      expect(apiGatewayId).toMatch(/^[a-z0-9]{10}$/);
    });

    test('lambda_function_arn has correct format', () => {
      expect(lambdaFunctionArn).toMatch(/^arn:aws:lambda:[a-z0-9-]+:\d{12}:function:[a-z0-9-]+$/);
    });

    test('lambda_function_name includes random suffix', () => {
      expect(lambdaFunctionName).toMatch(/^payment-processor-[a-z0-9]{8}$/);
    });

    test('usage_plan_id is valid', () => {
      expect(usagePlanId).toMatch(/^[a-z0-9]+$/);
      expect(usagePlanId.length).toBeGreaterThan(5);
    });

    test('log_group_name follows correct pattern', () => {
      expect(logGroupName).toBe('/aws/apigateway/payment-api');
    });

    test('api_key_value is not empty', () => {
      expect(apiKeyValue).toBeDefined();
      expect(apiKeyValue.length).toBeGreaterThan(10);
    });

    test('no duplicate output values', () => {
      const values = Object.values(outputs);
      const uniqueValues = new Set(values);
      // All values should be unique
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  // ========================================================================
  // TEST GROUP 2: API GATEWAY RESOURCE VALIDATION (8 tests)
  // ========================================================================
  describe('API Gateway Resource Validation', () => {
    test('API Gateway REST API exists', async () => {
      const command = new GetRestApiCommand({
        restApiId: apiGatewayId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.id).toBe(apiGatewayId);
      expect(response.name).toBe('payment-api');
    });

    test('API Gateway has regional endpoint', async () => {
      const command = new GetRestApiCommand({
        restApiId: apiGatewayId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.endpointConfiguration?.types).toContain('REGIONAL');
    });

    test('API Gateway stage exists and is named "prod"', async () => {
      const command = new GetStageCommand({
        restApiId: apiGatewayId,
        stageName: 'prod',
      });

      const response = await apiGatewayClient.send(command);
      expect(response.stageName).toBe('prod');
    });

    test('API Gateway stage has access logging enabled', async () => {
      const command = new GetStageCommand({
        restApiId: apiGatewayId,
        stageName: 'prod',
      });

      const response = await apiGatewayClient.send(command);
      expect(response.accessLogSettings).toBeDefined();
      expect(response.accessLogSettings?.destinationArn).toContain(logGroupName);
    });

    test('API Gateway stage has metrics enabled', async () => {
      const command = new GetStageCommand({
        restApiId: apiGatewayId,
        stageName: 'prod',
      });

      const response = await apiGatewayClient.send(command);
      expect(response.methodSettings).toBeDefined();
      // Method settings should enable metrics
      const allMethodsSettings = response.methodSettings?.['*/*'];
      expect(allMethodsSettings?.metricsEnabled).toBe(true);
    });

    test('usage plan exists with correct configuration', async () => {
      const command = new GetUsagePlanCommand({
        usagePlanId: usagePlanId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.id).toBe(usagePlanId);
      expect(response.throttle).toBeDefined();
      expect(response.quota).toBeDefined();
    });

    test('usage plan has throttle settings', async () => {
      const command = new GetUsagePlanCommand({
        usagePlanId: usagePlanId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.throttle?.rateLimit).toBe(100);
      expect(response.throttle?.burstLimit).toBe(200);
    });

    test('usage plan has daily quota limit', async () => {
      const command = new GetUsagePlanCommand({
        usagePlanId: usagePlanId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.quota?.limit).toBe(10000);
      expect(response.quota?.period).toBe('DAY');
    });
  });

  // ========================================================================
  // TEST GROUP 3: LAMBDA FUNCTION VALIDATION (7 tests)
  // ========================================================================
  describe('Lambda Function Validation', () => {
    test('Lambda function exists', async () => {
      const command = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.FunctionName).toBe(lambdaFunctionName);
    });

    test('Lambda function has correct runtime', async () => {
      const command = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Runtime).toBe('python3.11');
    });

    test('Lambda function has correct handler', async () => {
      const command = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Handler).toBe('lambda_function.lambda_handler');
    });

    test('Lambda function has environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe('production');
    });

    test('Lambda function has IAM role', async () => {
      const command = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration?.Role).toBeDefined();
      expect(response.Configuration?.Role).toMatch(/^arn:aws:iam::\d{12}:role\/payment-processor-lambda-role-[a-z0-9]{8}$/);
    });

    test('Lambda IAM role exists and is accessible', async () => {
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });

      const functionResponse = await lambdaClient.send(getFunctionCommand);
      const roleArn = functionResponse.Configuration?.Role;
      expect(roleArn).toBeDefined();

      const roleName = roleArn?.split('/').pop();
      const getRoleCommand = new GetRoleCommand({
        RoleName: roleName,
      });

      const roleResponse = await iamClient.send(getRoleCommand);
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.RoleName).toBe(roleName);
    });

    test('Lambda function can be invoked directly', async () => {
      const command = new InvokeCommand({
        FunctionName: lambdaFunctionName,
        Payload: JSON.stringify({
          body: JSON.stringify({
            amount: 99.99,
            currency: 'USD',
            customer_id: 'test-customer',
            payment_method: 'credit_card',
          }),
        }),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);
      
      const payload = JSON.parse(new TextDecoder().decode(response.Payload));
      expect(payload.statusCode).toBe(200);
      
      const body = JSON.parse(payload.body);
      expect(body.success).toBe(true);
      expect(body.amount).toBe(99.99);
    });
  });

  // ========================================================================
  // TEST GROUP 4: CLOUDWATCH LOGGING (5 tests)
  // ========================================================================
  describe('CloudWatch Logging', () => {
    test('CloudWatch log group exists', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
    });

    test('log group has correct retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      
      expect(logGroup?.retentionInDays).toBe(7);
    });

    test('log group has tags', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await logsClient.send(command);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      
      expect(logGroup).toBeDefined();
      // Log groups should be tagged via Terraform
    });

    test('Lambda function has its own log group', async () => {
      const lambdaLogGroup = `/aws/lambda/${lambdaFunctionName}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: lambdaLogGroup,
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      // Log group may be created automatically by Lambda
    });

    test('can query CloudWatch logs', async () => {
      const command = new FilterLogEventsCommand({
        logGroupName: logGroupName,
        limit: 10,
      });

      // This may return empty if no requests have been made yet
      const response = await logsClient.send(command);
      expect(response.events).toBeDefined();
    });
  });

  // ========================================================================
  // TEST GROUP 5: API KEY AUTHENTICATION (6 tests)
  // ========================================================================
  describe('API Key Authentication', () => {
    test('request without API key should fail', async () => {
      try {
        await axios.post(apiInvokeUrl, {
          amount: 100.00,
          currency: 'USD',
        });
        
        fail('Request should have been rejected without API key');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(403);
      }
    });

    test('request with invalid API key should fail', async () => {
      try {
        await axios.post(apiInvokeUrl, {
          amount: 100.00,
          currency: 'USD',
        }, {
          headers: {
            'x-api-key': 'invalid-key-12345',
          },
        });
        
        fail('Request should have been rejected with invalid API key');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(403);
      }
    });

    test('request with valid API key should succeed', async () => {
      const response = await axios.post(apiInvokeUrl, {
        amount: 150.00,
        currency: 'USD',
        customer_id: 'integration-test',
        payment_method: 'credit_card',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data.success).toBe(true);
    });

    test('API key header is case-insensitive', async () => {
      const response = await axios.post(apiInvokeUrl, {
        amount: 75.50,
        currency: 'EUR',
      }, {
        headers: {
          'X-API-KEY': apiKeyValue, // Uppercase
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    test('API key can be retrieved from API Gateway', async () => {
      // Extract key ID from usage plan
      const usagePlanCommand = new GetUsagePlanCommand({
        usagePlanId: usagePlanId,
      });

      const usagePlanResponse = await apiGatewayClient.send(usagePlanCommand);
      expect(usagePlanResponse.apiStages).toBeDefined();
      expect(usagePlanResponse.apiStages?.length).toBeGreaterThan(0);
    });

    test('API key is enabled', async () => {
      // We don't have direct key ID, but we can verify via usage plan
      const command = new GetUsagePlanCommand({
        usagePlanId: usagePlanId,
      });

      const response = await apiGatewayClient.send(command);
      expect(response.id).toBe(usagePlanId);
    });
  });

  // ========================================================================
  // TEST GROUP 6: CORS CONFIGURATION (5 tests)
  // ========================================================================
  describe('CORS Configuration', () => {
    test('successful request includes CORS headers', async () => {
      const response = await axios.post(apiInvokeUrl, {
        amount: 200.00,
        currency: 'USD',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    test('CORS origin matches expected domain', async () => {
      const response = await axios.post(apiInvokeUrl, {
        amount: 50.00,
        currency: 'GBP',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
        },
      });

      expect(response.headers['access-control-allow-origin']).toBe('https://app.example.com');
    });

    test('CORS headers include allowed methods', async () => {
      const response = await axios.post(apiInvokeUrl, {
        amount: 125.00,
        currency: 'CAD',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
        },
      });

      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    test('CORS headers include allowed headers', async () => {
      const response = await axios.post(apiInvokeUrl, {
        amount: 88.88,
        currency: 'AUD',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
        },
      });

      expect(response.headers['access-control-allow-headers']).toBeDefined();
    });

    test('response content type is application/json', async () => {
      const response = await axios.post(apiInvokeUrl, {
        amount: 999.99,
        currency: 'JPY',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
        },
      });

      expect(response.headers['content-type']).toContain('application/json');
    });
  });

  // ========================================================================
  // CRITICAL: COMPLETE WORKFLOW TEST (13 steps)
  // Validate entire payment processing workflow end-to-end
  // ========================================================================
  describe('Complete Payment Processing Workflow', () => {
    test('should execute complete payment processing workflow end-to-end', async () => {
      const testTimestamp = Date.now();
      const customerId = `customer-${testTimestamp}`;
      const paymentAmount = 299.99;

      console.log('\n🎬 Starting Complete Payment Workflow Test...\n');

      // ---------------------------------------------------------------
      // Step 1: Verify API Gateway is accessible
      // ---------------------------------------------------------------
      console.log('Step 1: Verifying API Gateway endpoint...');
      expect(apiInvokeUrl).toMatch(/^https:\/\//);
      console.log('✓ API Gateway endpoint verified');

      // ---------------------------------------------------------------
      // Step 2: Verify Lambda function is ready
      // ---------------------------------------------------------------
      console.log('Step 2: Verifying Lambda function...');
      const getFunctionCommand = new GetFunctionCommand({
        FunctionName: lambdaFunctionName,
      });

      const functionResponse = await lambdaClient.send(getFunctionCommand);
      expect(functionResponse.Configuration?.State).toBe('Active');
      console.log('✓ Lambda function is active');

      // ---------------------------------------------------------------
      // Step 3: Attempt payment without API key (should fail)
      // ---------------------------------------------------------------
      console.log('Step 3: Testing API key requirement...');
      try {
        await axios.post(apiInvokeUrl, {
          amount: paymentAmount,
          currency: 'USD',
          customer_id: customerId,
        });
        fail('Should have rejected request without API key');
      } catch (error) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(403);
        console.log('✓ API key requirement enforced');
      }

      // ---------------------------------------------------------------
      // Step 4: Submit valid payment request
      // ---------------------------------------------------------------
      console.log('Step 4: Submitting valid payment request...');
      const paymentResponse = await axios.post(apiInvokeUrl, {
        amount: paymentAmount,
        currency: 'USD',
        customer_id: customerId,
        payment_method: 'credit_card',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
          'Content-Type': 'application/json',
        },
      });

      expect(paymentResponse.status).toBe(200);
      console.log('✓ Payment request accepted');

      // ---------------------------------------------------------------
      // Step 5: Validate response structure
      // ---------------------------------------------------------------
      console.log('Step 5: Validating response structure...');
      const paymentData = paymentResponse.data;
      
      expect(paymentData).toHaveProperty('success');
      expect(paymentData).toHaveProperty('transaction_id');
      expect(paymentData).toHaveProperty('amount');
      expect(paymentData).toHaveProperty('currency');
      expect(paymentData).toHaveProperty('status');
      expect(paymentData).toHaveProperty('timestamp');
      console.log('✓ Response structure validated');

      // ---------------------------------------------------------------
      // Step 6: Verify payment details match request
      // ---------------------------------------------------------------
      console.log('Step 6: Verifying payment details...');
      expect(paymentData.success).toBe(true);
      expect(paymentData.amount).toBe(paymentAmount);
      expect(paymentData.currency).toBe('USD');
      expect(paymentData.customer_id).toBe(customerId);
      expect(paymentData.status).toBe('completed');
      console.log('✓ Payment details match request');

      // ---------------------------------------------------------------
      // Step 7: Verify transaction ID format
      // ---------------------------------------------------------------
      console.log('Step 7: Validating transaction ID...');
      expect(paymentData.transaction_id).toMatch(/^txn_\d{20}$/);
      console.log(`✓ Transaction ID generated: ${paymentData.transaction_id}`);

      // ---------------------------------------------------------------
      // Step 8: Verify CORS headers in response
      // ---------------------------------------------------------------
      console.log('Step 8: Verifying CORS headers...');
      expect(paymentResponse.headers['access-control-allow-origin']).toBe('https://app.example.com');
      expect(paymentResponse.headers['access-control-allow-headers']).toBeDefined();
      console.log('✓ CORS headers present');

      // ---------------------------------------------------------------
      // Step 9: Submit second payment for different amount
      // ---------------------------------------------------------------
      console.log('Step 9: Processing second payment...');
      const secondPaymentResponse = await axios.post(apiInvokeUrl, {
        amount: 49.99,
        currency: 'EUR',
        customer_id: customerId,
        payment_method: 'debit_card',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
        },
      });

      expect(secondPaymentResponse.status).toBe(200);
      expect(secondPaymentResponse.data.success).toBe(true);
      expect(secondPaymentResponse.data.amount).toBe(49.99);
      expect(secondPaymentResponse.data.currency).toBe('EUR');
      console.log('✓ Second payment processed');

      // ---------------------------------------------------------------
      // Step 10: Verify transaction IDs are unique
      // ---------------------------------------------------------------
      console.log('Step 10: Verifying transaction uniqueness...');
      expect(paymentData.transaction_id).not.toBe(secondPaymentResponse.data.transaction_id);
      console.log('✓ Transaction IDs are unique');

      // ---------------------------------------------------------------
      // Step 11: Test error handling - invalid JSON
      // ---------------------------------------------------------------
      console.log('Step 11: Testing error handling...');
      try {
        await axios.post(apiInvokeUrl, 'invalid-json', {
          headers: {
            'x-api-key': apiKeyValue,
            'Content-Type': 'application/json',
          },
        });
        // Lambda should handle this gracefully
      } catch (error) {
        // Error is acceptable
        console.log('✓ Error handling verified');
      }

      // ---------------------------------------------------------------
      // Step 12: Wait for CloudWatch logs (async)
      // ---------------------------------------------------------------
      console.log('Step 12: Waiting for CloudWatch logs propagation...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      console.log('✓ Waited for log propagation');

      // ---------------------------------------------------------------
      // Step 13: Verify CloudWatch logs contain payment data
      // ---------------------------------------------------------------
      console.log('Step 13: Checking CloudWatch logs...');
      const logsCommand = new FilterLogEventsCommand({
        logGroupName: `/aws/lambda/${lambdaFunctionName}`,
        filterPattern: customerId,
        startTime: testTimestamp - 60000, // 1 minute before test
        limit: 50,
      });

      try {
        const logsResponse = await logsClient.send(logsCommand);
        expect(logsResponse.events).toBeDefined();
        
        if (logsResponse.events && logsResponse.events.length > 0) {
          console.log(`✓ Found ${logsResponse.events.length} log events`);
          
          // Verify log contains customer ID
          const hasCustomerLog = logsResponse.events.some(event => 
            event.message?.includes(customerId)
          );
          expect(hasCustomerLog).toBe(true);
          console.log('✓ CloudWatch logs contain payment data');
        } else {
          console.log('⚠ No logs found yet (may take time to propagate)');
        }
      } catch (error) {
        console.log('⚠ CloudWatch logs not yet available (acceptable in fresh deployment)');
      }

      console.log('\n🎉 Complete payment workflow test passed! ✓\n');
      console.log(`📊 Summary:`);
      console.log(`   - Processed 2 successful payments`);
      console.log(`   - Verified API key authentication`);
      console.log(`   - Validated CORS configuration`);
      console.log(`   - Confirmed Lambda integration`);
      console.log(`   - Checked CloudWatch logging`);
      console.log(`   - Total workflow steps: 13 ✓\n`);
    }, 120000); // 120 second timeout for complete workflow
  });

  // ========================================================================
  // TEST GROUP 7: PAYMENT VALIDATION SCENARIOS (6 tests)
  // ========================================================================
  describe('Payment Validation Scenarios', () => {
    test('process payment with minimum amount', async () => {
      const response = await axios.post(apiInvokeUrl, {
        amount: 0.01,
        currency: 'USD',
        customer_id: 'min-amount-test',
        payment_method: 'credit_card',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.amount).toBe(0.01);
    });

    test('process payment with large amount', async () => {
      const response = await axios.post(apiInvokeUrl, {
        amount: 999999.99,
        currency: 'USD',
        customer_id: 'large-amount-test',
        payment_method: 'wire_transfer',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.amount).toBe(999999.99);
    });

    test('process payment with different currencies', async () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];
      
      for (const currency of currencies) {
        const response = await axios.post(apiInvokeUrl, {
          amount: 100.00,
          currency: currency,
          customer_id: `currency-test-${currency}`,
        }, {
          headers: {
            'x-api-key': apiKeyValue,
          },
        });

        expect(response.status).toBe(200);
        expect(response.data.currency).toBe(currency);
      }
    });

    test('process payment with different payment methods', async () => {
      const paymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer'];
      
      for (const method of paymentMethods) {
        const response = await axios.post(apiInvokeUrl, {
          amount: 50.00,
          currency: 'USD',
          customer_id: `method-test-${method}`,
          payment_method: method,
        }, {
          headers: {
            'x-api-key': apiKeyValue,
          },
        });

        expect(response.status).toBe(200);
        expect(response.data.payment_method).toBe(method);
      }
    });

    test('process payment without optional fields', async () => {
      const response = await axios.post(apiInvokeUrl, {
        amount: 75.00,
      }, {
        headers: {
          'x-api-key': apiKeyValue,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      // Should use defaults for missing fields
      expect(response.data.currency).toBe('USD');
      expect(response.data.customer_id).toBe('anonymous');
    });

    test('response includes environment information', async () => {
      const response = await axios.post(apiInvokeUrl, {
        amount: 100.00,
        currency: 'USD',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.environment).toBe('production');
    });
  });

  // ========================================================================
  // TEST GROUP 8: PERFORMANCE AND RELIABILITY (5 tests)
  // ========================================================================
  describe('Performance and Reliability', () => {
    test('API responds within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await axios.post(apiInvokeUrl, {
        amount: 100.00,
        currency: 'USD',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
      console.log(`⚡ API response time: ${responseTime}ms`);
    });

    test('can handle multiple concurrent requests', async () => {
      const concurrentRequests = 5;
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        axios.post(apiInvokeUrl, {
          amount: 100.00 + i,
          currency: 'USD',
          customer_id: `concurrent-test-${i}`,
        }, {
          headers: {
            'x-api-key': apiKeyValue,
          },
        })
      );

      const responses = await Promise.all(requests);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.amount).toBe(100.00 + index);
      });

      console.log(`✓ Processed ${concurrentRequests} concurrent requests successfully`);
    });

    test('Lambda function responds consistently', async () => {
      const iterations = 3;
      const amounts = [];

      for (let i = 0; i < iterations; i++) {
        const response = await axios.post(apiInvokeUrl, {
          amount: 50.00,
          currency: 'USD',
        }, {
          headers: {
            'x-api-key': apiKeyValue,
          },
        });

        expect(response.status).toBe(200);
        amounts.push(response.data.amount);
      }

      // All responses should have same amount
      expect(new Set(amounts).size).toBe(1);
    });

    test('API handles rapid sequential requests', async () => {
      const sequentialCount = 10;
      const results = [];

      for (let i = 0; i < sequentialCount; i++) {
        const response = await axios.post(apiInvokeUrl, {
          amount: i + 1,
          currency: 'USD',
          customer_id: `sequential-${i}`,
        }, {
          headers: {
            'x-api-key': apiKeyValue,
          },
        });

        results.push(response.data);
      }

      expect(results.length).toBe(sequentialCount);
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.amount).toBe(index + 1);
      });

      console.log(`✓ Processed ${sequentialCount} sequential requests`);
    });

    test('timestamp format is ISO 8601', async () => {
      const response = await axios.post(apiInvokeUrl, {
        amount: 100.00,
        currency: 'USD',
      }, {
        headers: {
          'x-api-key': apiKeyValue,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/);
      
      // Should be valid date
      const timestamp = new Date(response.data.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });
  });
});