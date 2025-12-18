# LocalStack Integration Test Execution Output

**Execution Date:** 2025-12-18 13:13:49

---

🧪 Running Integration Tests against LocalStack...
✅ LocalStack is running
✅ Infrastructure outputs found
✅ Infrastructure outputs validated
📦 Installing npm dependencies...

> tap@0.1.0 preinstall
> echo 'Skipping version checks for CI/CD'

Skipping version checks for CI/CD

> tap@0.1.0 prepare
> husky


added 208 packages, removed 1029 packages, changed 377 packages, and audited 2336 packages in 2m

308 packages are looking for funding
  run `npm fund` for details

17 vulnerabilities (5 low, 1 moderate, 11 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
✅ Dependencies installed successfully
🔧 Setting up LocalStack environment...
🌐 Environment configured for LocalStack:
  • AWS_ENDPOINT_URL: http://localhost:4566
  • AWS_REGION: us-east-1
  • SSL Verification: Disabled
🚀 Starting integration tests...

> tap@0.1.0 test:integration
> jest --testPathPattern=\.int\.test\.ts$ --testTimeout=30000

ts-jest[ts-jest-transformer] (WARN) Define `ts-jest` config under `globals` is deprecated. Please do
transform: {
    <transform_regex>: ['ts-jest', { /* ts-jest config goes here in Jest */ }],
},
See more at https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#advanced
ts-jest[config] (WARN) 
    The "ts-jest" config option "isolatedModules" is deprecated and will be removed in v30.0.0. Please use "isolatedModules: true" in /home/chris/turing_work/new_synth/IAC-synth-54729183/iac-test-automations/tsconfig.json instead, see https://www.typescriptlang.org/tsconfig/#isolatedModules
  
FAIL test/tap-stack.int.test.ts (13.452 s)
  Weather Monitoring System Integration Tests
    API Gateway Integration
      ✕ API endpoint should be accessible (6 ms)
      ✕ POST request with valid sensor data should succeed (15 ms)
      ✕ POST request without sensorId should return 400 (3 ms)
      ✕ POST request with extreme values should trigger anomaly detection (2 ms)
      ✕ API should handle malformed JSON (3 ms)
    DynamoDB Integration
      ✕ DynamoDB table should exist and be accessible (2 ms)
      ✕ Data should be stored in DynamoDB after API call (1 ms)
      ✕ DynamoDB table should have proper capacity settings (279 ms)
    Lambda Function Integration
      ✕ Lambda function should exist and be configured correctly (2 ms)
      ✕ Lambda environment variables should be set correctly (1 ms)
    SNS Topic Integration
      ✕ SNS topic should exist and be accessible (1 ms)
    S3 Bucket Integration
      ✕ Failed events S3 bucket should exist (934 ms)
    EventBridge Scheduler Integration
      ✕ Hourly aggregation schedule should exist and be enabled (1 ms)
      ✕ Daily report schedule should exist and be enabled (24 ms)
      ✕ Lambda should handle EventBridge aggregation event (1 ms)
      ✕ Lambda should handle EventBridge daily report event (1 ms)
    CloudWatch Alarms Integration
      ✓ Lambda error alarm should exist (31 ms)
      ✓ API Gateway 4xx alarm should exist (16 ms)
      ✓ DynamoDB throttle alarm should exist (13 ms)
    End-to-End Workflow
      ✕ Complete sensor data processing workflow (1 ms)
      ✕ Rate limiting should work as configured (7 ms)
    Error Handling
      ✕ API should handle server errors gracefully (1 ms)
      ✕ System should handle missing optional fields

  ● Weather Monitoring System Integration Tests › API Gateway Integration › API endpoint should be accessible

    expect(received).toBeDefined()

    Received: undefined

      25 |   describe('API Gateway Integration', () => {
      26 |     test('API endpoint should be accessible', async () => {
    > 27 |       expect(outputs.APIEndpoint).toBeDefined();
         |                                   ^
      28 |       expect(outputs.APIEndpoint).toContain('execute-api');
      29 |       expect(outputs.APIEndpoint).toContain('/prod/sensor-data');
      30 |     });

      at Object.<anonymous> (test/tap-stack.int.test.ts:27:35)

  ● Weather Monitoring System Integration Tests › API Gateway Integration › POST request with valid sensor data should succeed

    TypeError: Invalid URL

      39 |       };
      40 |
    > 41 |       const response = await axios.post(outputs.APIEndpoint, sensorData, {
         |                                    ^
      42 |         headers: {
      43 |           'Content-Type': 'application/json'
      44 |         }

      at dispatchHttpRequest (node_modules/axios/lib/adapters/http.js:408:20)
      at node_modules/axios/lib/adapters/http.js:249:5
      at wrapAsync (node_modules/axios/lib/adapters/http.js:229:10)
      at http (node_modules/axios/lib/adapters/http.js:314:10)
      at Axios.dispatchRequest (node_modules/axios/lib/core/dispatchRequest.js:51:10)
      at Axios._request (node_modules/axios/lib/core/Axios.js:185:33)
      at Axios.request (node_modules/axios/lib/core/Axios.js:40:25)
      at Axios.httpMethod [as post] (node_modules/axios/lib/core/Axios.js:224:19)
      at Function.wrap (node_modules/axios/lib/helpers/bind.js:12:15)
      at Object.<anonymous> (test/tap-stack.int.test.ts:41:36)

  ● Weather Monitoring System Integration Tests › API Gateway Integration › POST request without sensorId should return 400

    TypeError: Cannot read properties of undefined (reading 'status')

      65 |         fail('Request should have failed');
      66 |       } catch (error: any) {
    > 67 |         expect(error.response.status).toBe(400);
         |                               ^
      68 |         expect(error.response.data.error).toContain('sensorId is required');
      69 |       }
      70 |     });

      at Object.<anonymous> (test/tap-stack.int.test.ts:67:31)

  ● Weather Monitoring System Integration Tests › API Gateway Integration › POST request with extreme values should trigger anomaly detection

    TypeError: Invalid URL

      79 |       };
      80 |
    > 81 |       const response = await axios.post(outputs.APIEndpoint, extremeData, {
         |                                    ^
      82 |         headers: {
      83 |           'Content-Type': 'application/json'
      84 |         }

      at dispatchHttpRequest (node_modules/axios/lib/adapters/http.js:408:20)
      at node_modules/axios/lib/adapters/http.js:249:5
      at wrapAsync (node_modules/axios/lib/adapters/http.js:229:10)
      at http (node_modules/axios/lib/adapters/http.js:314:10)
      at Axios.dispatchRequest (node_modules/axios/lib/core/dispatchRequest.js:51:10)
      at Axios._request (node_modules/axios/lib/core/Axios.js:185:33)
      at Axios.request (node_modules/axios/lib/core/Axios.js:40:25)
      at Axios.httpMethod [as post] (node_modules/axios/lib/core/Axios.js:224:19)
      at Function.wrap (node_modules/axios/lib/helpers/bind.js:12:15)
      at Object.<anonymous> (test/tap-stack.int.test.ts:81:36)

  ● Weather Monitoring System Integration Tests › API Gateway Integration › API should handle malformed JSON

    TypeError: Cannot read properties of undefined (reading 'status')

       99 |         fail('Request should have failed');
      100 |       } catch (error: any) {
    > 101 |         expect(error.response.status).toBe(400);
          |                               ^
      102 |         expect(error.response.data.error).toContain('Invalid JSON');
      103 |       }
      104 |     });

      at Object.<anonymous> (test/tap-stack.int.test.ts:101:31)

  ● Weather Monitoring System Integration Tests › DynamoDB Integration › DynamoDB table should exist and be accessible

    expect(received).toBeDefined()

    Received: undefined

      107 |   describe('DynamoDB Integration', () => {
      108 |     test('DynamoDB table should exist and be accessible', async () => {
    > 109 |       expect(outputs.DynamoDBTableName).toBeDefined();
          |                                         ^
      110 |       expect(outputs.DynamoDBTableName).toContain('WeatherReadings');
      111 |
      112 |       const scanCommand = new ScanCommand({

      at Object.<anonymous> (test/tap-stack.int.test.ts:109:41)

  ● Weather Monitoring System Integration Tests › DynamoDB Integration › Data should be stored in DynamoDB after API call

    TypeError: Invalid URL

      130 |
      131 |       // Send data through API
    > 132 |       const response = await axios.post(outputs.APIEndpoint, sensorData);
          |                                    ^
      133 |       const timestamp = response.data.timestamp;
      134 |
      135 |       // Wait a bit for data to be written

      at dispatchHttpRequest (node_modules/axios/lib/adapters/http.js:408:20)
      at node_modules/axios/lib/adapters/http.js:249:5
      at wrapAsync (node_modules/axios/lib/adapters/http.js:229:10)
      at http (node_modules/axios/lib/adapters/http.js:314:10)
      at Axios.dispatchRequest (node_modules/axios/lib/core/dispatchRequest.js:51:10)
      at Axios._request (node_modules/axios/lib/core/Axios.js:185:33)
      at Axios.request (node_modules/axios/lib/core/Axios.js:40:25)
      at Axios.httpMethod [as post] (node_modules/axios/lib/core/Axios.js:224:19)
      at Function.wrap (node_modules/axios/lib/helpers/bind.js:12:15)
      at Object.<anonymous> (test/tap-stack.int.test.ts:132:36)

  ● Weather Monitoring System Integration Tests › DynamoDB Integration › DynamoDB table should have proper capacity settings

    ValidationException: Value null at 'tableName' failed to satisfy constraint: Member must not be null

      160 |       });
      161 |
    > 162 |       const result = await dynamoDBClient.send(scanCommand);
          |                      ^
      163 |       expect(result.$metadata.httpStatusCode).toBe(200);
      164 |       // The actual auto-scaling is handled by AWS and tested through CloudWatch metrics
      165 |     });

      at ProtocolLib.getErrorSchemaOrThrowBaseException (node_modules/@aws-sdk/core/dist-cjs/submodules/protocols/index.js:69:67)
      at AwsJson1_0Protocol.getErrorSchemaOrThrowBaseException [as handleError] (node_modules/@aws-sdk/core/dist-cjs/submodules/protocols/index.js:678:65)
      at AwsJson1_0Protocol.handleError [as deserializeResponse] (node_modules/@smithy/core/dist-cjs/submodules/protocols/index.js:473:24)
      at node_modules/@smithy/core/dist-cjs/submodules/schema/index.js:26:24
      at node_modules/@smithy/core/dist-cjs/index.js:121:20
      at node_modules/@smithy/middleware-retry/dist-cjs/index.js:254:46
      at node_modules/@aws-sdk/middleware-logger/dist-cjs/index.js:5:26
      at Object.<anonymous> (test/tap-stack.int.test.ts:162:22)

  ● Weather Monitoring System Integration Tests › Lambda Function Integration › Lambda function should exist and be configured correctly

    expect(received).toBeDefined()

    Received: undefined

      168 |   describe('Lambda Function Integration', () => {
      169 |     test('Lambda function should exist and be configured correctly', async () => {
    > 170 |       expect(outputs.LambdaFunctionArn).toBeDefined();
          |                                         ^
      171 |       expect(outputs.LambdaFunctionArn).toContain(':function:WeatherDataAggregation');
      172 |
      173 |       const functionName = outputs.LambdaFunctionArn.split(':').pop();

      at Object.<anonymous> (test/tap-stack.int.test.ts:170:41)

  ● Weather Monitoring System Integration Tests › Lambda Function Integration › Lambda environment variables should be set correctly

    TypeError: Cannot read properties of undefined (reading 'split')

      185 |
      186 |     test('Lambda environment variables should be set correctly', async () => {
    > 187 |       const functionName = outputs.LambdaFunctionArn.split(':').pop();
          |                                                      ^
      188 |       const getFunctionCommand = new GetFunctionCommand({
      189 |         FunctionName: functionName
      190 |       });

      at Object.<anonymous> (test/tap-stack.int.test.ts:187:54)

  ● Weather Monitoring System Integration Tests › SNS Topic Integration › SNS topic should exist and be accessible

    expect(received).toBeDefined()

    Received: undefined

      200 |   describe('SNS Topic Integration', () => {
      201 |     test('SNS topic should exist and be accessible', async () => {
    > 202 |       expect(outputs.SNSTopicArn).toBeDefined();
          |                                   ^
      203 |       expect(outputs.SNSTopicArn).toContain(':WeatherAnomalies');
      204 |
      205 |       const listSubscriptionsCommand = new ListSubscriptionsByTopicCommand({

      at Object.<anonymous> (test/tap-stack.int.test.ts:202:35)

  ● Weather Monitoring System Integration Tests › S3 Bucket Integration › Failed events S3 bucket should exist

    AWS SDK error wrapper for Error: getaddrinfo ENOTFOUND weather-failed-events-dev-000000000000.localhost

      221 |       });
      222 |
    > 223 |       const result = await s3Client.send(headBucketCommand);
          |                      ^
      224 |       expect(result.$metadata.httpStatusCode).toBe(200);
      225 |     });
      226 |   });

      at asSdkError (node_modules/@smithy/middleware-retry/dist-cjs/index.js:54:12)
      at asSdkError (node_modules/@smithy/middleware-retry/dist-cjs/index.js:262:29)
      at node_modules/@aws-sdk/middleware-sdk-s3/dist-cjs/index.js:63:28
      at node_modules/@aws-sdk/middleware-sdk-s3/dist-cjs/index.js:90:20
      at node_modules/@aws-sdk/middleware-logger/dist-cjs/index.js:5:26
      at Object.<anonymous> (test/tap-stack.int.test.ts:223:22)

  ● Weather Monitoring System Integration Tests › EventBridge Scheduler Integration › Hourly aggregation schedule should exist and be enabled

    expect(received).toBeDefined()

    Received: undefined

      228 |   describe('EventBridge Scheduler Integration', () => {
      229 |     test('Hourly aggregation schedule should exist and be enabled', async () => {
    > 230 |       expect(outputs.HourlyScheduleArn).toBeDefined();
          |                                         ^
      231 |       const scheduleName = outputs.HourlyScheduleArn.split('/').pop();
      232 |
      233 |       const getScheduleCommand = new GetScheduleCommand({

      at Object.<anonymous> (test/tap-stack.int.test.ts:230:41)

  ● Weather Monitoring System Integration Tests › EventBridge Scheduler Integration › Daily report schedule should exist and be enabled

    ResourceNotFoundException: Schedule DailyWeatherReport-synth19283746 does not exist.

      248 |       });
      249 |
    > 250 |       const result = await schedulerClient.send(getScheduleCommand);
          |                      ^
      251 |       expect(result.State).toBe('ENABLED');
      252 |       expect(result.ScheduleExpression).toBe('cron(0 2 * * ? *)');
      253 |       expect(result.ScheduleExpressionTimezone).toBe('UTC');

      at AwsRestJsonProtocol.handleError (node_modules/@aws-sdk/core/dist-cjs/submodules/protocols/index.js:797:27)
      at AwsRestJsonProtocol.deserializeResponse (node_modules/@smithy/core/dist-cjs/submodules/protocols/index.js:301:13)
      at AwsRestJsonProtocol.deserializeResponse (node_modules/@aws-sdk/core/dist-cjs/submodules/protocols/index.js:782:24)
      at node_modules/@smithy/core/dist-cjs/submodules/schema/index.js:26:24
      at node_modules/@smithy/core/dist-cjs/index.js:121:20
      at node_modules/@smithy/middleware-retry/dist-cjs/index.js:254:46
      at node_modules/@aws-sdk/middleware-logger/dist-cjs/index.js:5:26
      at Object.<anonymous> (test/tap-stack.int.test.ts:250:22)

  ● Weather Monitoring System Integration Tests › EventBridge Scheduler Integration › Lambda should handle EventBridge aggregation event

    TypeError: Cannot read properties of undefined (reading 'split')

      255 |
      256 |     test('Lambda should handle EventBridge aggregation event', async () => {
    > 257 |       const functionName = outputs.LambdaFunctionArn.split(':').pop();
          |                                                      ^
      258 |
      259 |       const invokeCommand = new InvokeCommand({
      260 |         FunctionName: functionName,

      at Object.<anonymous> (test/tap-stack.int.test.ts:257:54)

  ● Weather Monitoring System Integration Tests › EventBridge Scheduler Integration › Lambda should handle EventBridge daily report event

    TypeError: Cannot read properties of undefined (reading 'split')

      271 |
      272 |     test('Lambda should handle EventBridge daily report event', async () => {
    > 273 |       const functionName = outputs.LambdaFunctionArn.split(':').pop();
          |                                                      ^
      274 |
      275 |       const invokeCommand = new InvokeCommand({
      276 |         FunctionName: functionName,

      at Object.<anonymous> (test/tap-stack.int.test.ts:273:54)

  ● Weather Monitoring System Integration Tests › End-to-End Workflow › Complete sensor data processing workflow

    TypeError: Invalid URL

      344 |       };
      345 |
    > 346 |       const normalResponse = await axios.post(outputs.APIEndpoint, normalData);
          |                                          ^
      347 |       expect(normalResponse.status).toBe(200);
      348 |       const timestamp1 = normalResponse.data.timestamp;
      349 |

      at dispatchHttpRequest (node_modules/axios/lib/adapters/http.js:408:20)
      at node_modules/axios/lib/adapters/http.js:249:5
      at wrapAsync (node_modules/axios/lib/adapters/http.js:229:10)
      at http (node_modules/axios/lib/adapters/http.js:314:10)
      at Axios.dispatchRequest (node_modules/axios/lib/core/dispatchRequest.js:51:10)
      at Axios._request (node_modules/axios/lib/core/Axios.js:185:33)
      at Axios.request (node_modules/axios/lib/core/Axios.js:40:25)
      at Axios.httpMethod [as post] (node_modules/axios/lib/core/Axios.js:224:19)
      at Function.wrap (node_modules/axios/lib/helpers/bind.js:12:15)
      at Object.<anonymous> (test/tap-stack.int.test.ts:346:42)

  ● Weather Monitoring System Integration Tests › End-to-End Workflow › Rate limiting should work as configured

    expect(received).toBe(expected) // Object.is equality

    Expected: 5
    Received: 0

      512 |
      513 |       // All 5 requests should succeed as we're well under the 100 req/sec limit
    > 514 |       expect(successCount).toBe(5);
          |                            ^
      515 |     });
      516 |   });
      517 |

      at Object.<anonymous> (test/tap-stack.int.test.ts:514:28)

  ● Weather Monitoring System Integration Tests › Error Handling › API should handle server errors gracefully

    TypeError: Cannot read properties of undefined (reading 'status')

      530 |       } catch (error: any) {
      531 |         // If it fails, it should return a proper error response
    > 532 |         expect(error.response.status).toBeGreaterThanOrEqual(400);
          |                               ^
      533 |         expect(error.response.status).toBeLessThan(600);
      534 |       }
      535 |     });

      at Object.<anonymous> (test/tap-stack.int.test.ts:532:31)

  ● Weather Monitoring System Integration Tests › Error Handling › System should handle missing optional fields

    TypeError: Invalid URL

      541 |       };
      542 |
    > 543 |       const response = await axios.post(outputs.APIEndpoint, minimalData);
          |                                    ^
      544 |       expect(response.status).toBe(200);
      545 |       expect(response.data.sensorId).toBe(minimalData.sensorId);
      546 |     });

      at dispatchHttpRequest (node_modules/axios/lib/adapters/http.js:408:20)
      at node_modules/axios/lib/adapters/http.js:249:5
      at wrapAsync (node_modules/axios/lib/adapters/http.js:229:10)
      at http (node_modules/axios/lib/adapters/http.js:314:10)
      at Axios.dispatchRequest (node_modules/axios/lib/core/dispatchRequest.js:51:10)
      at Axios._request (node_modules/axios/lib/core/Axios.js:185:33)
      at Axios.request (node_modules/axios/lib/core/Axios.js:40:25)
      at Axios.httpMethod [as post] (node_modules/axios/lib/core/Axios.js:224:19)
      at Function.wrap (node_modules/axios/lib/helpers/bind.js:12:15)
      at Object.<anonymous> (test/tap-stack.int.test.ts:543:36)

Test Suites: 1 failed, 1 total
Tests:       20 failed, 3 passed, 23 total
Snapshots:   0 total
Time:        16.709 s
Ran all test suites matching /.int.test.ts$/i.
❌ Integration tests failed!
🔍 Troubleshooting:
  1. Check LocalStack status: curl http://localhost:4566/_localstack/health
  2. Verify infrastructure: npm run localstack:cfn:deploy
  3. Check outputs file: cat cfn-outputs/flat-outputs.json
  4. Review LocalStack logs: localstack logs
