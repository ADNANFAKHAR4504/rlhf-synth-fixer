import * as cdk from 'aws-cdk-lib';
import * as appconfig from 'aws-cdk-lib/aws-appconfig';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface AppConfigStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  validatorFunction: lambda.Function;
}

export class AppConfigStack extends cdk.Stack {
  public readonly application: appconfig.CfnApplication;
  public readonly appConfigEnvironment: appconfig.CfnEnvironment;
  public readonly deploymentStrategy: appconfig.CfnDeploymentStrategy;

  constructor(scope: Construct, id: string, props: AppConfigStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create AppConfig Application
    this.application = new appconfig.CfnApplication(
      this,
      'MobileAppConfigApplication',
      {
        name: `MobileApp-${environmentSuffix}`,
        description: 'Configuration management for mobile application',
        tags: [
          {
            key: 'Environment',
            value: environmentSuffix,
          },
        ],
      }
    );

    // Create Deployment Strategy with gradual rollout
    this.deploymentStrategy = new appconfig.CfnDeploymentStrategy(
      this,
      'GradualDeploymentStrategy',
      {
        name: `GradualRollout-${environmentSuffix}`,
        description:
          'Deploy configuration to 20% of targets at a time with 5 minute bake time',
        deploymentDurationInMinutes: 15,
        finalBakeTimeInMinutes: 5,
        growthFactor: 20,
        growthType: 'LINEAR',
        replicateTo: 'NONE',
        tags: [
          {
            key: 'Environment',
            value: environmentSuffix,
          },
        ],
      }
    );

    // Create Environment
    this.appConfigEnvironment = new appconfig.CfnEnvironment(
      this,
      'ProductionEnvironment',
      {
        applicationId: this.application.ref,
        name: `Production-${environmentSuffix}`,
        description: 'Production environment for mobile app configuration',
        tags: [
          {
            key: 'Environment',
            value: environmentSuffix,
          },
        ],
      }
    );

    // Create Configuration Profile for Feature Flags
    const featureFlagsProfile = new appconfig.CfnConfigurationProfile(
      this,
      'FeatureFlagsProfile',
      {
        applicationId: this.application.ref,
        name: 'FeatureFlags',
        locationUri: 'hosted',
        type: 'AWS.AppConfig.FeatureFlags',
        description:
          'Feature flags for mobile application with advanced targeting',
        validators: [
          {
            type: 'LAMBDA',
            content: props.validatorFunction.functionArn,
          },
        ],
        tags: [
          {
            key: 'Environment',
            value: environmentSuffix,
          },
        ],
      }
    );

    // Grant AppConfig permission to invoke the validator Lambda
    props.validatorFunction.grantInvoke(
      new iam.ServicePrincipal('appconfig.amazonaws.com')
    );

    // Note: Initial configuration would be deployed separately using AWS Console or CLI
    // AppConfig Feature Flags require specific format that varies based on validation

    // Stack outputs
    new cdk.CfnOutput(this, 'AppConfigApplicationId', {
      value: this.application.ref,
      description: 'AppConfig Application ID',
    });

    new cdk.CfnOutput(this, 'FeatureFlagsProfileId', {
      value: featureFlagsProfile.ref,
      description: 'Feature Flags Configuration Profile ID',
    });

    new cdk.CfnOutput(this, 'AppConfigEnvironmentId', {
      value: this.appConfigEnvironment.ref,
      description: 'AppConfig Environment ID',
    });

    new cdk.CfnOutput(this, 'DeploymentStrategyId', {
      value: this.deploymentStrategy.ref,
      description: 'AppConfig Deployment Strategy ID',
    });
  }
}
