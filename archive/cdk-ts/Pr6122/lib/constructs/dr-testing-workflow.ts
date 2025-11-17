import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

export interface DrTestingWorkflowProps {
  readonly workflowName: string;
  readonly environmentSuffix: string;
  readonly timestamp: string;
  readonly dynamoTable: dynamodb.Table;
  readonly primaryBucket: s3.Bucket;
  readonly drBucket?: s3.Bucket;
  readonly drRegion: string;
}

export class DrTestingWorkflow extends Construct {
  public readonly stateMachine: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props: DrTestingWorkflowProps) {
    super(scope, id);

    // Create comprehensive DR testing Lambda function
    const drTestFunction = new lambda.Function(this, 'DrTestFunction', {
      functionName: `iac-rlhf-${props.environmentSuffix}-dr-test-${props.timestamp}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        exports.handler = async (event) => {
          const testType = event.testType;
          const drRegion = event.drRegion;
          
          console.log(\`Running DR test: \${testType}\`);
          
          try {
            switch (testType) {
              case 'DYNAMODB_REPLICATION':
                return await testDynamoDBReplication(event);
              case 'S3_REPLICATION':
                return await testS3Replication(event);
              case 'SNS_CONNECTIVITY':
                return await testSNSConnectivity(event);
              case 'LAMBDA_FAILOVER':
                return await testLambdaFailover(event);
              default:
                throw new Error(\`Unknown test type: \${testType}\`);
            }
          } catch (error) {
            console.error(\`DR test failed: \${error.message}\`);
            return {
              testType,
              status: 'FAILED',
              error: error.message,
              timestamp: new Date().toISOString()
            };
          }
        };
        
        async function testDynamoDBReplication(event) {
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const drDynamodb = new AWS.DynamoDB.DocumentClient({ region: event.drRegion });
          
          const testId = \`dr-test-\${Date.now()}\`;
          const testItem = {
            id: testId,
            timestamp: Date.now(),
            orderStatus: 'DR_TEST',
            testData: { drTest: true, region: process.env.AWS_REGION }
          };
          
          // Write to primary table
          await dynamodb.put({
            TableName: event.tableName,
            Item: testItem
          }).promise();
          
          // Wait and check replication
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const replicatedItem = await drDynamodb.get({
            TableName: event.tableName,
            Key: { id: testId, timestamp: testItem.timestamp }
          }).promise();
          
          // Cleanup
          await dynamodb.delete({
            TableName: event.tableName,
            Key: { id: testId, timestamp: testItem.timestamp }
          }).promise();
          
          return {
            testType: 'DYNAMODB_REPLICATION',
            status: replicatedItem.Item ? 'PASSED' : 'FAILED',
            replicationLatency: replicatedItem.Item ? '< 5 seconds' : 'N/A',
            timestamp: new Date().toISOString()
          };
        }
        
        async function testS3Replication(event) {
          const s3 = new AWS.S3();
          const drS3 = new AWS.S3({ region: event.drRegion });
          
          const testKey = \`dr-test/\${Date.now()}.txt\`;
          const testContent = 'DR replication test content';
          
          // Upload to primary bucket
          await s3.putObject({
            Bucket: event.primaryBucket,
            Key: testKey,
            Body: testContent
          }).promise();
          
          // Wait for replication
          await new Promise(resolve => setTimeout(resolve, 30000));
          
          let replicationStatus = 'FAILED';
          try {
            await drS3.headObject({
              Bucket: event.drBucket,
              Key: testKey
            }).promise();
            replicationStatus = 'PASSED';
          } catch (error) {
            console.log('Replication not yet complete:', error.message);
          }
          
          // Cleanup
          await s3.deleteObject({
            Bucket: event.primaryBucket,
            Key: testKey
          }).promise();
          
          return {
            testType: 'S3_REPLICATION',
            status: replicationStatus,
            testKey,
            timestamp: new Date().toISOString()
          };
        }
        
        async function testSNSConnectivity(event) {
          const sns = new AWS.SNS();
          
          const testMessage = {
            type: 'DR_TEST',
            testId: Date.now(),
            timestamp: new Date().toISOString()
          };
          
          await sns.publish({
            TopicArn: event.topicArn,
            Message: JSON.stringify(testMessage),
            Subject: 'DR Test Message'
          }).promise();
          
          return {
            testType: 'SNS_CONNECTIVITY',
            status: 'PASSED',
            message: 'Test message published successfully',
            timestamp: new Date().toISOString()
          };
        }
        
        async function testLambdaFailover(event) {
          const lambda = new AWS.Lambda({ region: event.drRegion });
          
          // Test DR Lambda function invocation
          const response = await lambda.invoke({
            FunctionName: event.drFunctionName,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({ test: true, drTest: true })
          }).promise();
          
          const result = JSON.parse(response.Payload);
          
          return {
            testType: 'LAMBDA_FAILOVER',
            status: response.StatusCode === 200 ? 'PASSED' : 'FAILED',
            drFunctionResponse: result,
            timestamp: new Date().toISOString()
          };
        }
      `),
      timeout: Duration.minutes(2),
      memorySize: 256,
    });

    // Grant necessary permissions
    drTestFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:DeleteItem',
          'dynamodb:DescribeTable',
        ],
        resources: [props.dynamoTable.tableArn],
      })
    );

    drTestFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:PutObject',
          's3:GetObject',
          's3:DeleteObject',
          's3:HeadObject',
        ],
        resources: [
          `${props.primaryBucket.bucketArn}/*`,
          ...(props.drBucket ? [`${props.drBucket.bucketArn}/*`] : []),
        ],
      })
    );

    drTestFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sns:Publish', 'lambda:InvokeFunction'],
        resources: ['*'],
      })
    );

    // Define Step Functions workflow
    const dynamodbTest = new stepfunctionsTasks.LambdaInvoke(
      this,
      'DynamoDBTest',
      {
        lambdaFunction: drTestFunction,
        payload: stepfunctions.TaskInput.fromObject({
          testType: 'DYNAMODB_REPLICATION',
          tableName: props.dynamoTable.tableName,
          drRegion: props.drRegion,
        }),
        outputPath: '$.Payload',
      }
    );

    const s3Test = new stepfunctionsTasks.LambdaInvoke(this, 'S3Test', {
      lambdaFunction: drTestFunction,
      payload: stepfunctions.TaskInput.fromObject({
        testType: 'S3_REPLICATION',
        primaryBucket: props.primaryBucket.bucketName,
        drBucket: props.drBucket?.bucketName || 'placeholder',
        drRegion: props.drRegion,
      }),
      outputPath: '$.Payload',
    });

    const snsTest = new stepfunctionsTasks.LambdaInvoke(this, 'SNSTest', {
      lambdaFunction: drTestFunction,
      payload: stepfunctions.TaskInput.fromObject({
        testType: 'SNS_CONNECTIVITY',
        topicArn: stepfunctions.JsonPath.stringAt('$.topicArn'),
        drRegion: props.drRegion,
      }),
      outputPath: '$.Payload',
    });

    // Wait states for eventual consistency
    const wait30Seconds = new stepfunctions.Wait(this, 'Wait30Seconds', {
      time: stepfunctions.WaitTime.duration(Duration.seconds(30)),
    });

    const wait60Seconds = new stepfunctions.Wait(this, 'Wait60Seconds', {
      time: stepfunctions.WaitTime.duration(Duration.seconds(60)),
    });

    // Parallel execution of tests
    const parallelTests = new stepfunctions.Parallel(this, 'ParallelDRTests', {
      comment: 'Run DR tests in parallel for efficiency',
    });

    parallelTests.branch(
      stepfunctions.Chain.start(dynamodbTest)
        .next(wait30Seconds)
        .next(dynamodbTest) // Retry to check replication
    );

    parallelTests.branch(
      stepfunctions.Chain.start(wait60Seconds) // S3 takes longer
        .next(s3Test)
    );

    parallelTests.branch(snsTest);

    // Aggregate results
    const aggregateResults = new stepfunctionsTasks.LambdaInvoke(
      this,
      'AggregateResults',
      {
        lambdaFunction: new lambda.Function(this, 'AggregateResultsFunction', {
          functionName: `iac-rlhf-${props.environmentSuffix}-dr-aggregate-${props.timestamp}`,
          runtime: lambda.Runtime.NODEJS_18_X,
          handler: 'index.handler',
          code: lambda.Code.fromInline(`
          exports.handler = async (event) => {
            console.log('Aggregating DR test results:', JSON.stringify(event));
            
            const testResults = event;
            let totalTests = 0;
            let passedTests = 0;
            const details = [];
            
            // Process parallel test results
            if (Array.isArray(testResults)) {
              testResults.forEach(result => {
                if (Array.isArray(result)) {
                  result.forEach(test => {
                    totalTests++;
                    if (test.status === 'PASSED') passedTests++;
                    details.push(test);
                  });
                } else {
                  totalTests++;
                  if (result.status === 'PASSED') passedTests++;
                  details.push(result);
                }
              });
            }
            
            const overallStatus = passedTests === totalTests ? 'ALL_PASSED' : 'SOME_FAILED';
            
            return {
              overallStatus,
              totalTests,
              passedTests,
              failedTests: totalTests - passedTests,
              successRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0,
              details,
              completedAt: new Date().toISOString()
            };
          };
        `),
          timeout: Duration.seconds(30),
        }),
        outputPath: '$.Payload',
      }
    );

    // Create state machine
    this.stateMachine = new stepfunctions.StateMachine(
      this,
      'DrTestStateMachine',
      {
        stateMachineName: props.workflowName,
        definitionBody: stepfunctions.DefinitionBody.fromChainable(
          stepfunctions.Chain.start(parallelTests).next(aggregateResults)
        ),
        timeout: Duration.minutes(15),
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    // Add tags
    const tags = {
      Project: 'iac-rlhf-amazon',
      Environment: props.environmentSuffix,
      Component: 'StepFunctions',
      Purpose: 'DR-Testing',
    };

    Object.entries(tags).forEach(([key, value]) => {
      this.stateMachine.node.addMetadata('aws:cdk:tagging', { [key]: value });
      drTestFunction.node.addMetadata('aws:cdk:tagging', { [key]: value });
    });
  }
}
