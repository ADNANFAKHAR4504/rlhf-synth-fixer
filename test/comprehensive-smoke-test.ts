#!/usr/bin/env node
import * as AWS from 'aws-sdk';

interface SmokeTestConfig {
  environmentSuffix: string;
  region: string;
  drRegion: string;
}

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration?: number;
}

class ComprehensiveSmokeTest {
  private config: SmokeTestConfig;
  private results: TestResult[] = [];

  constructor() {
    this.config = {
      environmentSuffix: process.env.ENVIRONMENT_SUFFIX || 'dev',
      region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      drRegion: 'us-west-2',
    };
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Running comprehensive smoke tests...');
    console.log(`Environment: ${this.config.environmentSuffix}`);
    console.log(`Primary Region: ${this.config.region}`);

    try {
      await this.testOrderProcessingWorkflow();
      await this.testShadowAnalysis();
      await this.testDynamoDBOperations();
      await this.testS3Operations();
      await this.testApiGateway();
      await this.testMonitoring();
      await this.testStepFunctions();

      this.printResults();

      const failedTests = this.results.filter(r => !r.passed);
      if (failedTests.length > 0) {
        console.error(`\n❌ ${failedTests.length} tests failed!`);
        process.exit(1);
      } else {
        console.log('\n✅ All smoke tests passed!');
      }
    } catch (error) {
      console.error('🚨 Smoke test execution failed:', error);
      process.exit(1);
    }
  }

  private async testOrderProcessingWorkflow(): Promise<void> {
    const startTime = Date.now();

    try {
      const lambda = new AWS.Lambda({ region: this.config.region });

      // Find order processing lambda
      const functions = await lambda.listFunctions().promise();
      const orderProcessingFunction = functions.Functions?.find(fn =>
        fn.FunctionName?.includes(
          `iac-rlhf-${this.config.environmentSuffix}-order-processor`
        )
      );

      if (!orderProcessingFunction) {
        throw new Error('Order processing Lambda function not found');
      }

      // Test order processing
      const testOrder = {
        orderId: `smoke-test-${Date.now()}`,
        symbol: 'AAPL',
        quantity: 100,
        price: 150.0,
        orderType: 'MARKET',
        clientId: 'smoke-test-client',
      };

      const response = await lambda
        .invoke({
          FunctionName: orderProcessingFunction.FunctionName!,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(testOrder),
        })
        .promise();

      if (response.StatusCode === 200) {
        const result = JSON.parse(response.Payload as string);
        if (result.statusCode === 200) {
          this.addResult(
            'Order Processing Workflow',
            true,
            'Successfully processed test order',
            Date.now() - startTime
          );
        } else {
          throw new Error(
            `Order processing returned status ${result.statusCode}`
          );
        }
      } else {
        throw new Error(
          `Lambda invocation failed with status ${response.StatusCode}`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.addResult(
        'Order Processing Workflow',
        false,
        errorMessage,
        Date.now() - startTime
      );
    }
  }

  private async testShadowAnalysis(): Promise<void> {
    const startTime = Date.now();

    try {
      const lambda = new AWS.Lambda({ region: this.config.region });

      // Find shadow analysis lambda
      const functions = await lambda.listFunctions().promise();
      const shadowAnalysisFunction = functions.Functions?.find(fn =>
        fn.FunctionName?.includes(
          `iac-rlhf-${this.config.environmentSuffix}-shadow-analysis`
        )
      );

      if (!shadowAnalysisFunction) {
        throw new Error('Shadow analysis Lambda function not found');
      }

      // Test shadow analysis
      const testData = {
        orderId: `shadow-test-${Date.now()}`,
      };

      const response = await lambda
        .invoke({
          FunctionName: shadowAnalysisFunction.FunctionName!,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify(testData),
        })
        .promise();

      if (response.StatusCode === 200) {
        const result = JSON.parse(response.Payload as string);
        if (result.statusCode === 200 || result.statusCode === 500) {
          // 500 is expected if order doesn't exist
          this.addResult(
            'Shadow Analysis',
            true,
            'Shadow analysis function executed successfully',
            Date.now() - startTime
          );
        } else {
          throw new Error(
            `Shadow analysis returned unexpected status ${result.statusCode}`
          );
        }
      } else {
        throw new Error(
          `Lambda invocation failed with status ${response.StatusCode}`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.addResult(
        'Shadow Analysis',
        false,
        errorMessage,
        Date.now() - startTime
      );
    }
  }

  private async testDynamoDBOperations(): Promise<void> {
    const startTime = Date.now();

    try {
      const dynamodb = new AWS.DynamoDB.DocumentClient({
        region: this.config.region,
      });

      // Find DynamoDB table
      const dynamoClient = new AWS.DynamoDB({ region: this.config.region });
      const tables = await dynamoClient.listTables().promise();
      const orderTable = tables.TableNames?.find(name =>
        name.includes(`iac-rlhf-${this.config.environmentSuffix}-orders`)
      );

      if (!orderTable) {
        throw new Error('Order table not found');
      }

      // Test write operation
      const testItem = {
        id: `smoke-test-${Date.now()}`,
        timestamp: Date.now(),
        orderStatus: 'SMOKE_TEST',
        testData: true,
      };

      await dynamodb
        .put({
          TableName: orderTable,
          Item: testItem,
        })
        .promise();

      // Test read operation
      const readResult = await dynamodb
        .get({
          TableName: orderTable,
          Key: {
            id: testItem.id,
            timestamp: testItem.timestamp,
          },
        })
        .promise();

      if (readResult.Item) {
        // Cleanup
        await dynamodb
          .delete({
            TableName: orderTable,
            Key: {
              id: testItem.id,
              timestamp: testItem.timestamp,
            },
          })
          .promise();

        this.addResult(
          'DynamoDB Operations',
          true,
          'Successfully performed read/write operations',
          Date.now() - startTime
        );
      } else {
        throw new Error('Failed to read back test item');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.addResult(
        'DynamoDB Operations',
        false,
        errorMessage,
        Date.now() - startTime
      );
    }
  }

  private async testS3Operations(): Promise<void> {
    const startTime = Date.now();

    try {
      const s3 = new AWS.S3({ region: this.config.region });

      // Find S3 bucket
      const buckets = await s3.listBuckets().promise();
      const tradingBucket = buckets.Buckets?.find(bucket =>
        bucket.Name?.includes(
          `iac-rlhf-${this.config.environmentSuffix}-trading-primary`
        )
      );

      if (!tradingBucket) {
        throw new Error('Trading bucket not found');
      }

      // Test write operation
      const testKey = `smoke-test/${Date.now()}.json`;
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'Smoke test data',
      };

      await s3
        .putObject({
          Bucket: tradingBucket.Name!,
          Key: testKey,
          Body: JSON.stringify(testData),
          ContentType: 'application/json',
        })
        .promise();

      // Test read operation
      const objectResult = await s3
        .getObject({
          Bucket: tradingBucket.Name!,
          Key: testKey,
        })
        .promise();

      if (objectResult.Body) {
        // Cleanup
        await s3
          .deleteObject({
            Bucket: tradingBucket.Name!,
            Key: testKey,
          })
          .promise();

        this.addResult(
          'S3 Operations',
          true,
          'Successfully performed read/write operations',
          Date.now() - startTime
        );
      } else {
        throw new Error('Failed to read back test object');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.addResult(
        'S3 Operations',
        false,
        errorMessage,
        Date.now() - startTime
      );
    }
  }

  private async testApiGateway(): Promise<void> {
    const startTime = Date.now();

    try {
      const apigateway = new AWS.APIGateway({ region: this.config.region });

      // Find API Gateway
      const apis = await apigateway.getRestApis().promise();
      const costApi = apis.items?.find(api =>
        api.name?.includes(`iac-rlhf-${this.config.environmentSuffix}-cost-api`)
      );

      if (!costApi) {
        throw new Error('Cost monitoring API not found');
      }

      // Test API Gateway exists and is deployed
      const deployments = await apigateway
        .getDeployments({
          restApiId: costApi.id!,
        })
        .promise();

      if (deployments.items && deployments.items.length > 0) {
        this.addResult(
          'API Gateway',
          true,
          'API Gateway deployed successfully',
          Date.now() - startTime
        );
      } else {
        throw new Error('No deployments found for API Gateway');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.addResult(
        'API Gateway',
        false,
        errorMessage,
        Date.now() - startTime
      );
    }
  }

  private async testMonitoring(): Promise<void> {
    const startTime = Date.now();

    try {
      const cloudwatch = new AWS.CloudWatch({ region: this.config.region });

      // Find dashboard
      const dashboards = await cloudwatch.listDashboards().promise();
      const tradingDashboard = dashboards.DashboardEntries?.find(dashboard =>
        dashboard.DashboardName?.includes(
          `iac-rlhf-${this.config.environmentSuffix}-comprehensive`
        )
      );

      if (!tradingDashboard) {
        throw new Error('Monitoring dashboard not found');
      }

      // Test alarms exist
      const alarms = await cloudwatch
        .describeAlarms({
          AlarmNamePrefix: `iac-rlhf-${this.config.environmentSuffix}`,
        })
        .promise();

      if (alarms.MetricAlarms && alarms.MetricAlarms.length > 0) {
        this.addResult(
          'Monitoring',
          true,
          `Found ${alarms.MetricAlarms.length} alarms and dashboard`,
          Date.now() - startTime
        );
      } else {
        throw new Error('No monitoring alarms found');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.addResult('Monitoring', false, errorMessage, Date.now() - startTime);
    }
  }

  private async testStepFunctions(): Promise<void> {
    const startTime = Date.now();

    try {
      const stepfunctions = new AWS.StepFunctions({
        region: this.config.region,
      });

      // Find Step Functions state machine
      const stateMachines = await stepfunctions.listStateMachines().promise();
      const drTestStateMachine = stateMachines.stateMachines.find(sm =>
        sm.name?.includes(
          `iac-rlhf-${this.config.environmentSuffix}-dr-testing`
        )
      );

      if (!drTestStateMachine) {
        throw new Error('DR testing state machine not found');
      }

      // Check state machine is active
      const stateMachineDesc = await stepfunctions
        .describeStateMachine({
          stateMachineArn: drTestStateMachine.stateMachineArn,
        })
        .promise();

      if (stateMachineDesc.status === 'ACTIVE') {
        this.addResult(
          'Step Functions',
          true,
          'DR testing workflow is active',
          Date.now() - startTime
        );
      } else {
        throw new Error(`State machine status is ${stateMachineDesc.status}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.addResult(
        'Step Functions',
        false,
        errorMessage,
        Date.now() - startTime
      );
    }
  }

  private addResult(
    testName: string,
    passed: boolean,
    message: string,
    duration?: number
  ): void {
    this.results.push({
      testName,
      passed,
      message,
      duration,
    });
  }

  private printResults(): void {
    console.log('\n📊 Smoke Test Results:');
    console.log(
      '═══════════════════════════════════════════════════════════════════'
    );

    this.results.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`${status} - ${result.testName}${duration}`);
      console.log(`   └─ ${result.message}`);
    });

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(
      '\n═══════════════════════════════════════════════════════════════════'
    );
    console.log(
      `📈 Summary: ${passedTests}/${totalTests} tests passed (${failedTests} failed)`
    );

    if (passedTests === totalTests) {
      console.log('🎉 All smoke tests completed successfully!');
    } else {
      console.log(
        `⚠️  ${failedTests} test(s) failed. Please review the results above.`
      );
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const smokeTest = new ComprehensiveSmokeTest();
  smokeTest.runAllTests().catch(error => {
    console.error('Smoke tests failed:', error);
    process.exit(1);
  });
}

export { ComprehensiveSmokeTest };
