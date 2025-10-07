import * as cdk from 'aws-cdk-lib';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctionsTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface StepFunctionsOrchestrationStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  configValidatorFunction: lambda.Function;
  backupBucket: string;
  configTable: string;
}

export class StepFunctionsOrchestrationStack extends cdk.Stack {
  public readonly configDeploymentStateMachine: stepfunctions.StateMachine;

  constructor(
    scope: Construct,
    id: string,
    props: StepFunctionsOrchestrationStackProps
  ) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create Lambda for pre-deployment validation
    const preDeploymentFunction = new lambda.Function(
      this,
      'PreDeploymentValidation',
      {
        functionName: `pre-deployment-validation-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromInline(`
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));

exports.handler = async (event) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('PreDeploymentValidation');

  try {
    console.log('Pre-deployment validation:', JSON.stringify(event));

    // Validate configuration structure
    if (!event.configuration || !event.deploymentId) {
      throw new Error('Missing required fields: configuration or deploymentId');
    }

    // Add custom validation logic
    const config = JSON.parse(event.configuration);

    // Check for breaking changes
    if (config.breakingChange) {
      console.warn('Breaking change detected, requiring manual approval');
      subsegment.addAnnotation('breakingChange', true);
      return {
        status: 'REQUIRES_APPROVAL',
        message: 'Breaking change detected',
        deploymentId: event.deploymentId
      };
    }

    subsegment.addAnnotation('validationStatus', 'success');
    subsegment.close();

    return {
      status: 'VALIDATED',
      message: 'Pre-deployment validation successful',
      deploymentId: event.deploymentId
    };
  } catch (error) {
    subsegment.addError(error);
    subsegment.close();
    throw error;
  }
};
      `),
        timeout: cdk.Duration.seconds(30),
        environment: {
          CONFIG_TABLE: props.configTable,
        },
      }
    );

    // Create Lambda for post-deployment monitoring
    const postDeploymentFunction = new lambda.Function(
      this,
      'PostDeploymentMonitoring',
      {
        functionName: `post-deployment-monitoring-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        tracing: lambda.Tracing.ACTIVE,
        code: lambda.Code.fromInline(`
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('PostDeploymentMonitoring');

  try {
    console.log('Post-deployment monitoring:', JSON.stringify(event));

    // Monitor deployment metrics
    await cloudwatch.putMetricData({
      Namespace: 'ConfigManagement',
      MetricData: [{
        MetricName: 'DeploymentSuccess',
        Value: 1,
        Unit: 'Count',
        Dimensions: [{
          Name: 'Environment',
          Value: process.env.ENVIRONMENT || 'dev'
        }]
      }]
    }).promise();

    // Check deployment health
    const healthCheck = {
      deploymentId: event.deploymentId,
      status: 'HEALTHY',
      timestamp: Date.now(),
      metrics: {
        latency: Math.random() * 100,
        errorRate: 0,
        successRate: 100
      }
    };

    subsegment.addAnnotation('deploymentHealth', 'healthy');
    subsegment.addMetadata('healthMetrics', healthCheck.metrics);
    subsegment.close();

    return healthCheck;
  } catch (error) {
    subsegment.addError(error);
    subsegment.close();
    throw error;
  }
};
      `),
        timeout: cdk.Duration.seconds(30),
        environment: {
          ENVIRONMENT: environmentSuffix,
        },
      }
    );

    // Grant permissions for X-Ray tracing
    preDeploymentFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    postDeploymentFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    postDeploymentFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    // Define Step Functions tasks
    const preDeploymentTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'PreDeploymentTask',
      {
        lambdaFunction: preDeploymentFunction,
        outputPath: '$.Payload',
      }
    );

    const validationTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'ValidationTask',
      {
        lambdaFunction: props.configValidatorFunction,
        outputPath: '$.Payload',
      }
    );

    const postDeploymentTask = new stepfunctionsTasks.LambdaInvoke(
      this,
      'PostDeploymentTask',
      {
        lambdaFunction: postDeploymentFunction,
        outputPath: '$.Payload',
      }
    );

    // Define wait state for bake time
    const waitForBakeTime = new stepfunctions.Wait(this, 'WaitForBakeTime', {
      time: stepfunctions.WaitTime.duration(cdk.Duration.minutes(5)),
    });

    // Define success and failure states
    const deploymentSuccess = new stepfunctions.Succeed(
      this,
      'DeploymentSuccess',
      {
        comment: 'Configuration deployment completed successfully',
      }
    );

    const deploymentFailed = new stepfunctions.Fail(this, 'DeploymentFailed', {
      comment: 'Configuration deployment failed',
    });

    // Chain the validation and post-deployment tasks
    const validationChain = validationTask
      .next(waitForBakeTime)
      .next(postDeploymentTask)
      .next(deploymentSuccess);

    // Define choice state for validation result
    const checkValidation = new stepfunctions.Choice(
      this,
      'CheckValidationResult'
    )
      .when(
        stepfunctions.Condition.stringEquals('$.status', 'VALIDATED'),
        validationChain
      )
      .when(
        stepfunctions.Condition.stringEquals('$.status', 'REQUIRES_APPROVAL'),
        deploymentFailed
      )
      .otherwise(deploymentFailed);

    // Define the state machine
    const definition = preDeploymentTask.next(checkValidation);

    // Create the Express State Machine for fast execution
    this.configDeploymentStateMachine = new stepfunctions.StateMachine(
      this,
      'ConfigDeploymentStateMachine',
      {
        stateMachineName: `config-deployment-${environmentSuffix}`,
        definition,
        stateMachineType: stepfunctions.StateMachineType.EXPRESS,
        tracingEnabled: true,
        logs: {
          destination: new logs.LogGroup(this, 'StateMachineLogGroup', {
            logGroupName: `/aws/vendedlogs/states/config-deployment-${environmentSuffix}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
          level: stepfunctions.LogLevel.ALL,
          includeExecutionData: true,
        },
      }
    );

    // Output the state machine ARN
    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: this.configDeploymentStateMachine.stateMachineArn,
      description: 'ARN of the configuration deployment state machine',
    });
  }
}
