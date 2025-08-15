import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';
import { S3Stack } from './s3-stack';
import { ValidationStack } from './validation-stack';
import { EnvironmentConfigs } from './environment-config';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Determine base environment from suffix (dev, staging, prod)
    let baseEnvironment = 'dev';
    if (environmentSuffix.includes('staging')) {
      baseEnvironment = 'staging';
    } else if (environmentSuffix.includes('prod')) {
      baseEnvironment = 'prod';
    }

    // Get environment configuration based on base environment
    const environmentConfig = EnvironmentConfigs.getConfig(baseEnvironment);

    // Create S3 Stack with parent stack reference
    const s3Stack = new S3Stack(this, 'S3Stack', {
      environmentConfig,
      environmentSuffix,
      env: props?.env,
    });

    // Create Lambda Stack with parent stack reference
    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      environmentConfig,
      environmentSuffix,
      env: props?.env,
    });

    // Create API Gateway Stack with parent stack reference
    const apiGatewayStack = new ApiGatewayStack(this, 'ApiGatewayStack', {
      environmentConfig,
      environmentSuffix,
      apiFunction: lambdaStack.apiFunction,
      processingFunction: lambdaStack.processingFunction,
      env: props?.env,
    });

    // Create Validation Stack with parent stack reference
    const validationStack = new ValidationStack(this, 'ValidationStack', {
      environmentConfig,
      environmentSuffix,
      env: props?.env,
    });

    // Stack dependencies
    apiGatewayStack.addDependency(lambdaStack);
    validationStack.addDependency(s3Stack);
    validationStack.addDependency(lambdaStack);
    validationStack.addDependency(apiGatewayStack);

    // Add cross-stack permissions
    s3Stack.dataBucket.grantReadWrite(lambdaStack.apiFunction);
    s3Stack.dataBucket.grantReadWrite(lambdaStack.processingFunction);
    s3Stack.logsBucket.grantWrite(lambdaStack.apiFunction);

    // Add global tags
    cdk.Tags.of(this).add('Project', 'MultiEnvironmentConsistency');
    cdk.Tags.of(this).add('Environment', baseEnvironment);
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Outputs
    new cdk.CfnOutput(this, 'EnvironmentName', {
      value: baseEnvironment,
      description: 'Environment name',
      exportName: `${id}-EnvironmentName`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix',
      exportName: `${id}-EnvironmentSuffix`,
    });

    new cdk.CfnOutput(this, 'DeploymentRegion', {
      value: cdk.Aws.REGION,
      description: 'AWS Region for deployment',
      exportName: `${id}-DeploymentRegion`,
    });
  }
}
