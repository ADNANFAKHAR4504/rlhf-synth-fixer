```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import the separate stacks
import { ApiStack } from './api-stack';
import { DatabaseStack } from './database-stack';
import { ProcessingStack } from './processing-stack';
import { MonitoringStack } from './monitoring-stack';
import { VpcStack } from './vpc-stack';

// Import validation aspects
import { ResourceValidationAspect, IamValidationAspect } from './validation-aspects';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  domainName?: string;
  certificateArn?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Apply validation aspects across all stacks
    cdk.Aspects.of(this).add(new ResourceValidationAspect(), { priority: 100 });
    cdk.Aspects.of(this).add(new IamValidationAspect(), { priority: 100 });

    // Create the VPC stack first (foundation)
    const vpcStack = new VpcStack(this, `VpcStack${environmentSuffix}`, {
      environmentSuffix,
    });

    // Create the database stack
    const databaseStack = new DatabaseStack(this, `DatabaseStack${environmentSuffix}`, {
      environmentSuffix,
      vpc: vpcStack.vpc,
    });

    // Create the API stack
    const apiStack = new ApiStack(this, `ApiStack${environmentSuffix}`, {
      environmentSuffix,
      domainName: props?.domainName,
      certificateArn: props?.certificateArn,
    });

    // Create the processing stack
    const processingStack = new ProcessingStack(this, `ProcessingStack${environmentSuffix}`, {
      environmentSuffix,
      vpc: vpcStack.vpc,
      databaseSecurityGroup: databaseStack.databaseSecurityGroup,
      apiGateway: apiStack.apiGateway,
      databaseCluster: databaseStack.cluster,
    });

    // Create the monitoring stack
    const monitoringStack = new MonitoringStack(this, `MonitoringStack${environmentSuffix}`, {
      environmentSuffix,
      apiGateway: apiStack.apiGateway,
      paymentValidationFunction: processingStack.paymentValidationFunction,
      paymentProcessingFunction: processingStack.paymentProcessingFunction,
      databaseCluster: databaseStack.cluster,
      paymentQueue: processingStack.paymentQueue,
      paymentDlq: processingStack.paymentDlq,
    });

    // Cross-stack outputs for testing and integration
    new cdk.CfnOutput(this, `EnvironmentSuffix${environmentSuffix}`, {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    new cdk.CfnOutput(this, `ApiUrl${environmentSuffix}`, {
      value: apiStack.apiGateway.url,
      description: 'Payment API Gateway URL',
    });

    new cdk.CfnOutput(this, `VpcId${environmentSuffix}`, {
      value: vpcStack.vpc.vpcId,
      description: 'VPC ID for payment processing infrastructure',
    });

    new cdk.CfnOutput(this, `DatabaseEndpoint${environmentSuffix}`, {
      value: databaseStack.cluster.clusterEndpoint.hostname,
      description: 'Aurora PostgreSQL cluster endpoint',
    });

    new cdk.CfnOutput(this, `PaymentQueueUrl${environmentSuffix}`, {
      value: processingStack.paymentQueue.queueUrl,
      description: 'SQS queue URL for payment processing',
    });
  }
}
```
