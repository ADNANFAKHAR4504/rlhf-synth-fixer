import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';

export class DriftDetectionStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    // Get environment suffix for resource naming
    const environmentSuffix = props.environmentSuffix || 'dev';

    // SNS topic for drift notifications
    const driftNotificationTopic = new sns.Topic(this, 'DriftNotificationTopic', {
      topicName: `drift-notif-${environmentSuffix}`,
      displayName: `CDK Drift Detection - ${environmentSuffix}`
    });

    // IAM role for drift detection
    const driftDetectionRole = new iam.Role(this, 'DriftDetectionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        DriftDetectionPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudformation:ListStacks',
                'cloudformation:DescribeStacks',
                'cloudformation:DescribeStackResources',
                'cloudformation:DescribeStackEvents',
                'cloudformation:DetectStackDrift',
                'cloudformation:DescribeStackDriftDetectionStatus',
                'cloudformation:DescribeStackResourceDrifts'
              ],
              resources: ['*']
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sns:Publish'
              ],
              resources: [driftNotificationTopic.topicArn]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'organizations:ListAccounts',
                'sts:AssumeRole'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    // Lambda function for drift detection
    const driftDetectionFunction = new lambda.Function(this, 'DriftDetectionFunction', {
      functionName: `drift-detector-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: driftDetectionRole,
      timeout: cdk.Duration.minutes(15),
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        async function getCloudFormationClient(accountId, region, roleArn) {
          if (roleArn && accountId !== process.env.AWS_ACCOUNT_ID) {
            const sts = new AWS.STS({ region: process.env.AWS_REGION });
            const assumeRoleResult = await sts.assumeRole({
              RoleArn: roleArn,
              RoleSessionName: 'DriftDetectionSession'
            }).promise();
            
            const credentials = assumeRoleResult.Credentials;
            
            return new AWS.CloudFormation({
              region: region,
              accessKeyId: credentials.AccessKeyId,
              secretAccessKey: credentials.SecretAccessKey,
              sessionToken: credentials.SessionToken
            });
          }
          
          return new AWS.CloudFormation({ region: region });
        }
        
        async function detectStackDrift(cfn, stackName) {
          try {
            const detectResult = await cfn.detectStackDrift({
              StackName: stackName
            }).promise();
            const detectionId = detectResult.StackDriftDetectionId;
            
            // Wait for drift detection to complete
            let status = 'DETECTION_IN_PROGRESS';
            let attempts = 0;
            const maxAttempts = 30;
            
            while (status === 'DETECTION_IN_PROGRESS' && attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
              
              const statusResult = await cfn.describeStackDriftDetectionStatus({
                StackDriftDetectionId: detectionId
              }).promise();
              status = statusResult.DetectionStatus;
              attempts++;
            }
            
            if (status === 'DETECTION_COMPLETE') {
              const statusResult = await cfn.describeStackDriftDetectionStatus({
                StackDriftDetectionId: detectionId
              }).promise();
              
              if (statusResult.StackDriftStatus === 'DRIFTED') {
                // Get detailed drift information
                const driftsResult = await cfn.describeStackResourceDrifts({
                  StackName: stackName
                }).promise();
                
                return {
                  stackName: stackName,
                  driftStatus: 'DRIFTED',
                  driftedResources: driftsResult.StackResourceDrifts.filter(
                    drift => drift.StackResourceDriftStatus === 'MODIFIED' || drift.StackResourceDriftStatus === 'DELETED'
                  )
                };
              }
              
              return {
                stackName: stackName,
                driftStatus: statusResult.StackDriftStatus
              };
            }
            
            return {
              stackName: stackName,
              driftStatus: 'DETECTION_TIMEOUT',
              error: 'Drift detection timed out'
            };
            
          } catch (error) {
            console.error(\`Error detecting drift for stack \${stackName}:\`, error);
            return {
              stackName: stackName,
              driftStatus: 'DETECTION_FAILED',
              error: error.message
            };
          }
        }
        
        exports.handler = async (event) => {
          console.log('Starting drift detection:', JSON.stringify(event, null, 2));
          
          const targetAccounts = event.targetAccounts || [process.env.AWS_ACCOUNT_ID];
          const targetRegions = event.targetRegions || [process.env.AWS_REGION];
          const crossAccountRoleTemplate = event.crossAccountRoleTemplate;
          
          const driftResults = [];
          
          for (const accountId of targetAccounts) {
            for (const region of targetRegions) {
              try {
                const roleArn = crossAccountRoleTemplate 
                  ? crossAccountRoleTemplate.replace('{account}', accountId)
                  : null;
                
                const cfn = await getCloudFormationClient(accountId, region, roleArn);
                
                // List all CDK stacks
                const stackList = await cfn.listStacks({
                  StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE']
                }).promise();
                const cdkStacks = stackList.StackSummaries.filter(
                  stack => stack.StackName.includes('CDK') || stack.StackName.includes('Tap')
                );
                
                // Check drift for each stack
                for (const stack of cdkStacks) {
                  const driftResult = await detectStackDrift(cfn, stack.StackName);
                  driftResults.push({
                    accountId: accountId,
                    region: region,
                    ...driftResult
                  });
                }
                
              } catch (error) {
                console.error(\`Error processing account \${accountId} in region \${region}:\`, error);
                driftResults.push({
                  accountId: accountId,
                  region: region,
                  driftStatus: 'ERROR',
                  error: error.message
                });
              }
            }
          }
          
          // Send notifications for drifted stacks
          const driftedStacks = driftResults.filter(result => result.driftStatus === 'DRIFTED');
          
          if (driftedStacks.length > 0) {
            const notificationMessage = {
              subject: 'CDK Stack Drift Detected',
              message: 'Drift has been detected in the following CDK stacks:',
              driftedStacks: driftedStacks,
              timestamp: new Date().toISOString(),
              totalStacks: driftResults.length,
              driftedCount: driftedStacks.length
            };
            
            const sns = new AWS.SNS({ region: process.env.AWS_REGION });
            await sns.publish({
              TopicArn: process.env.DRIFT_NOTIFICATION_TOPIC,
              Subject: notificationMessage.subject,
              Message: JSON.stringify(notificationMessage, null, 2)
            }).promise();
          }
          
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Drift detection completed',
              totalStacks: driftResults.length,
              driftedStacks: driftedStacks.length,
              results: driftResults
            })
          };
        };
      `),
      environment: {
        DRIFT_NOTIFICATION_TOPIC: driftNotificationTopic.topicArn
      }
    });

    // EventBridge rule for scheduled drift detection
    const scheduledDriftDetection = new events.Rule(this, 'ScheduledDriftDetection', {
      description: 'Scheduled CDK drift detection across accounts',
      schedule: events.Schedule.rate(cdk.Duration.hours(6))
    });

    scheduledDriftDetection.addTarget(new targets.LambdaFunction(driftDetectionFunction, {
      event: events.RuleTargetInput.fromObject({
        targetAccounts: props.targetAccounts || [],
        targetRegions: props.targetRegions || ['us-east-1'],
        crossAccountRoleTemplate: props.crossAccountRoleTemplate
      })
    }));

    // Log Group is auto-created by Lambda function, no need to create it explicitly

    // Outputs
    new cdk.CfnOutput(this, 'DriftNotificationTopicArn', {
      value: driftNotificationTopic.topicArn,
      description: 'ARN of the drift notification topic'
    });

    new cdk.CfnOutput(this, 'DriftDetectionFunctionArn', {
      value: driftDetectionFunction.functionArn,
      description: 'ARN of the drift detection function'
    });
  }
}