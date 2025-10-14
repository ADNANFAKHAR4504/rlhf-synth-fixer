import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { VpcStack } from './stacks/vpc-stack';
import { StorageStack } from './stacks/storage-stack';
import { SecretsStack } from './stacks/secrets-stack';
import { LambdaStack } from './stacks/lambda-stack';
import { ApiGatewayStack } from './stacks/api-gateway-stack';
import { SecurityStack } from './stacks/security-stack';
import { MonitoringStack } from './stacks/monitoring-stack';

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

    // Get region from environment or use default
    const region =
      process.env.AWS_REGION ||
      this.node.tryGetContext('region') ||
      'ap-northeast-1';

    // Stack instantiations with proper dependency management

    // 1. VPC Stack - Foundation for network isolation
    const vpcStack = new VpcStack(scope, `VpcStack-${environmentSuffix}`, {
      environmentSuffix,
      env: { region },
    });

    // 2. Secrets Stack - Manage sensitive data
    const secretsStack = new SecretsStack(
      scope,
      `SecretsStack-${environmentSuffix}`,
      {
        environmentSuffix,
        env: { region },
      }
    );

    // 3. Storage Stack - S3 and DynamoDB
    const storageStack = new StorageStack(
      scope,
      `StorageStack-${environmentSuffix}`,
      {
        environmentSuffix,
        env: { region },
      }
    );

    // 4. Lambda Stack - Processing functions
    const lambdaStack = new LambdaStack(
      scope,
      `LambdaStack-${environmentSuffix}`,
      {
        environmentSuffix,
        vpc: vpcStack.vpc,
        dataTable: storageStack.dataTable,
        dataBucket: storageStack.dataBucket,
        apiSecret: secretsStack.apiSecret,
        env: { region },
      }
    );
    lambdaStack.addDependency(vpcStack);
    lambdaStack.addDependency(storageStack);
    lambdaStack.addDependency(secretsStack);

    // 5. API Gateway Stack - REST API endpoints
    const apiGatewayStack = new ApiGatewayStack(
      scope,
      `ApiGatewayStack-${environmentSuffix}`,
      {
        environmentSuffix,
        dataProcessorFunction: lambdaStack.dataProcessorFunction,
        env: { region },
      }
    );
    apiGatewayStack.addDependency(lambdaStack);

    // 6. Security Stack - WAF for API Gateway
    const securityStack = new SecurityStack(
      scope,
      `SecurityStack-${environmentSuffix}`,
      {
        environmentSuffix,
        apiGateway: apiGatewayStack.api,
        env: { region },
      }
    );
    securityStack.addDependency(apiGatewayStack);

    // 7. Monitoring Stack - CloudWatch alarms and logging
    const monitoringStack = new MonitoringStack(
      scope,
      `MonitoringStack-${environmentSuffix}`,
      {
        environmentSuffix,
        lambdaFunction: lambdaStack.dataProcessorFunction,
        apiGateway: apiGatewayStack.api,
        dataTable: storageStack.dataTable,
        env: { region },
      }
    );
    monitoringStack.addDependency(lambdaStack);
    monitoringStack.addDependency(apiGatewayStack);
    monitoringStack.addDependency(storageStack);

    // Outputs - Import from other stacks and re-export for integration tests
    new cdk.CfnOutput(this, 'BucketName', {
      value: cdk.Fn.importValue(`DataBucketName-${environmentSuffix}`),
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: cdk.Fn.importValue(`DataTableName-${environmentSuffix}`),
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: cdk.Fn.importValue(`ApiEndpoint-${environmentSuffix}`),
      description: 'API Gateway Endpoint URL',
    });

    new cdk.CfnOutput(this, 'FunctionArn', {
      value: cdk.Fn.importValue(`DataProcessorArn-${environmentSuffix}`),
      description: 'Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: cdk.Fn.importValue(`VpcId-${environmentSuffix}`),
      description: 'VPC ID',
    });
  }
}
