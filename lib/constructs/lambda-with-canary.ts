import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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

    // Create Lambda function
    this.lambdaFunction = new lambda.Function(this, 'Function', {
      ...props,
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
