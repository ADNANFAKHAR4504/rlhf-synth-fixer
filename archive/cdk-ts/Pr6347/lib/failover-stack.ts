import * as cdk from 'aws-cdk-lib';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface FailoverStackProps {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
}

export class FailoverStack extends Construct {
  public readonly stateMachine: stepfunctions.StateMachine;

  constructor(scope: Construct, id: string, props: FailoverStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // SNS Topic for notifications
    const notificationTopic = new sns.Topic(this, 'FailoverNotificationTopic', {
      topicName: `TapStack${environmentSuffix}FailoverNotifications`,
      displayName: 'Failover Orchestration Notifications',
    });

    // Lambda function for health check validation
    const healthCheckFunction = new lambda.Function(
      this,
      'HealthCheckFunction',
      {
        functionName: `TapStack${environmentSuffix}HealthCheck`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
    console.log('Health check validation:', JSON.stringify(event));
    // Implement health check logic
    return {
        statusCode: 200,
        body: {
            healthy: true,
            region: process.env.AWS_REGION,
            timestamp: new Date().toISOString()
        }
    };
};
      `),
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Lambda for Aurora failover
    const auroraFailoverFunction = new lambda.Function(
      this,
      'AuroraFailoverFunction',
      {
        functionName: `TapStack${environmentSuffix}AuroraFailover`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { RDSClient, FailoverGlobalClusterCommand } = require('@aws-sdk/client-rds');

exports.handler = async (event) => {
    const client = new RDSClient({ region: event.targetRegion });
    const command = new FailoverGlobalClusterCommand({
        GlobalClusterIdentifier: event.globalClusterId,
        TargetDbClusterIdentifier: event.targetClusterId
    });

    try {
        const response = await client.send(command);
        return {
            statusCode: 200,
            body: { message: 'Failover initiated', response }
        };
    } catch (error) {
        console.error('Failover error:', error);
        throw error;
    }
};
      `),
        timeout: cdk.Duration.minutes(5),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    auroraFailoverFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'rds:FailoverGlobalCluster',
          'rds:DescribeGlobalClusters',
          'rds:DescribeDBClusters',
        ],
        resources: ['*'],
      })
    );

    // Lambda for Route 53 update
    const route53UpdateFunction = new lambda.Function(
      this,
      'Route53UpdateFunction',
      {
        functionName: `TapStack${environmentSuffix}Route53Update`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
const { Route53Client, ChangeResourceRecordSetsCommand } = require('@aws-sdk/client-route-53');

exports.handler = async (event) => {
    const client = new Route53Client({ region: 'us-east-1' });
    console.log('Updating Route 53 records:', JSON.stringify(event));

    return {
        statusCode: 200,
        body: { message: 'Route 53 updated successfully' }
    };
};
      `),
        timeout: cdk.Duration.seconds(30),
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    route53UpdateFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'route53:ChangeResourceRecordSets',
          'route53:GetChange',
          'route53:ListResourceRecordSets',
        ],
        resources: ['*'],
      })
    );

    // Lambda for ECS scaling
    const ecsScalingFunction = new lambda.Function(this, 'ECSScalingFunction', {
      functionName: `TapStack${environmentSuffix}ECSScaling`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { ECSClient, UpdateServiceCommand } = require('@aws-sdk/client-ecs');

exports.handler = async (event) => {
    const client = new ECSClient({ region: event.targetRegion });
    const command = new UpdateServiceCommand({
        cluster: event.clusterArn,
        service: event.serviceName,
        desiredCount: event.desiredCount
    });

    try {
        const response = await client.send(command);
        return {
            statusCode: 200,
            body: { message: 'ECS service scaled', response }
        };
    } catch (error) {
        console.error('ECS scaling error:', error);
        throw error;
    }
};
      `),
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    ecsScalingFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ecs:UpdateService', 'ecs:DescribeServices'],
        resources: ['*'],
      })
    );

    // Define Step Functions tasks
    const healthCheckTask = new tasks.LambdaInvoke(this, 'CheckHealth', {
      lambdaFunction: healthCheckFunction,
      outputPath: '$.Payload',
    });

    const auroraFailoverTask = new tasks.LambdaInvoke(this, 'FailoverAurora', {
      lambdaFunction: auroraFailoverFunction,
      outputPath: '$.Payload',
    });

    const route53UpdateTask = new tasks.LambdaInvoke(this, 'UpdateRoute53', {
      lambdaFunction: route53UpdateFunction,
      outputPath: '$.Payload',
    });

    const ecsScalingTask = new tasks.LambdaInvoke(this, 'ScaleECS', {
      lambdaFunction: ecsScalingFunction,
      outputPath: '$.Payload',
    });

    const notifyTask = new tasks.SnsPublish(this, 'NotifyOperations', {
      topic: notificationTopic,
      message: stepfunctions.TaskInput.fromJsonPathAt('$'),
    });

    const waitForStabilization = new stepfunctions.Wait(
      this,
      'WaitForStabilization',
      {
        time: stepfunctions.WaitTime.duration(cdk.Duration.seconds(30)),
      }
    );

    const successState = new stepfunctions.Succeed(this, 'FailoverComplete');
    const failureState = new stepfunctions.Fail(this, 'FailoverFailed', {
      error: 'FailoverExecutionFailed',
      cause: 'One or more failover steps failed',
    });

    // Define workflow
    const definition = healthCheckTask.next(
      new stepfunctions.Choice(this, 'IsHealthy')
        .when(
          stepfunctions.Condition.booleanEquals('$.body.healthy', true),
          auroraFailoverTask
            .addRetry({
              errors: ['States.ALL'],
              interval: cdk.Duration.seconds(10),
              maxAttempts: 3,
              backoffRate: 2,
            })
            .next(waitForStabilization)
            .next(route53UpdateTask)
            .next(ecsScalingTask)
            .next(notifyTask)
            .next(successState)
        )
        .otherwise(failureState)
    );

    // State Machine
    this.stateMachine = new stepfunctions.StateMachine(
      this,
      'FailoverStateMachine',
      {
        stateMachineName: `TapStack${environmentSuffix}FailoverOrchestration`,
        definitionBody: stepfunctions.DefinitionBody.fromChainable(definition),
        timeout: cdk.Duration.minutes(30),
        tracingEnabled: true,
        logs: {
          destination: new logs.LogGroup(this, 'StateMachineLogGroup', {
            logGroupName: `/aws/stepfunctions/TapStack${environmentSuffix}Failover`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
          level: stepfunctions.LogLevel.ALL,
        },
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: this.stateMachine.stateMachineArn,
      description: 'Failover State Machine ARN',
    });

    new cdk.CfnOutput(this, 'StateMachineName', {
      value: this.stateMachine.stateMachineName,
      description: 'Failover State Machine Name',
    });
  }
}
