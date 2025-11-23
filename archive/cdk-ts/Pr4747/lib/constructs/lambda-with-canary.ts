import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface LambdaWithCanaryProps extends lambda.FunctionProps {
  canaryConfig: {
    deploymentConfig: codedeploy.ILambdaDeploymentConfig;
    alarmConfiguration?: {
      alarms: cloudwatch.IAlarm[];
      enabled: boolean;
    };
  };
}

export class LambdaWithCanary extends Construct {
  public readonly lambdaFunction: lambda.Function;
  private deploymentGroup: codedeploy.LambdaDeploymentGroup;

  constructor(scope: Construct, id: string, props: LambdaWithCanaryProps) {
    super(scope, id);

    // Extract logRetention and create log group instead of using deprecated property
    const { logRetention, ...lambdaProps } = props;

    // Create CloudWatch Log Group with retention
    const logGroup = logRetention
      ? new logs.LogGroup(this, 'LogGroup', {
          logGroupName: `/aws/lambda/${props.functionName}`,
          retention: logRetention,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        })
      : undefined;

    // Create Lambda function
    this.lambdaFunction = new lambda.Function(this, 'Function', {
      ...lambdaProps,
      logGroup,
      // Enable active tracing for X-Ray
      tracing: lambda.Tracing.ACTIVE,
    });

    // Create alias for canary deployment
    const alias = new lambda.Alias(this, 'LiveAlias', {
      aliasName: 'live',
      version: this.lambdaFunction.currentVersion,
    });

    // Create CodeDeploy application and deployment group
    const application = new codedeploy.LambdaApplication(
      this,
      'DeploymentApplication',
      {
        applicationName: `${props.functionName}-deployment`,
      }
    );

    this.deploymentGroup = new codedeploy.LambdaDeploymentGroup(
      this,
      'DeploymentGroup',
      {
        application,
        alias,
        deploymentConfig: props.canaryConfig.deploymentConfig,
        alarms: props.canaryConfig.alarmConfiguration?.alarms,
      }
    );
  }

  public updateCanaryAlarms(_alarms: cloudwatch.Alarm[]): void {
    // This method would update the deployment group with new alarms
    // In practice, you'd need to handle this through CDK updates
    // Note: CDK doesn't support updating alarms after deployment group creation
  }
}
