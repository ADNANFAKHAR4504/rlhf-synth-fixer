import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DynamoDBStack } from './dynamodb-stack';
import { ProcessingLambdaStack } from './processing-lambda-stack';
import { EventBusStack } from './event-bus-stack';
import { GlobalEndpointStack } from './global-endpoint-stack';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const primaryRegion = this.region || 'us-east-1';
    const secondaryRegion = 'us-west-2';

    // Create the DynamoDB Global Table stack
    const dynamoDBStack = new DynamoDBStack(this, 'DynamoDBStack', {
      environmentSuffix: environmentSuffix,
      env: { region: primaryRegion },
    });

    // Create the Processing Lambda stack
    const lambdaStack = new ProcessingLambdaStack(
      this,
      'ProcessingLambdaStack',
      {
        environmentSuffix: environmentSuffix,
        globalTable: dynamoDBStack.globalTable,
        env: { region: primaryRegion },
      }
    );

    // Create the Event Bus stack
    const eventBusStack = new EventBusStack(this, 'EventBusStack', {
      environmentSuffix: environmentSuffix,
      processingLambda: lambdaStack.processingLambda,
      env: { region: primaryRegion },
    });

    // Create the Global Endpoint stack
    const globalEndpointStack = new GlobalEndpointStack(
      this,
      'GlobalEndpointStack',
      {
        environmentSuffix: environmentSuffix,
        primaryRegion: primaryRegion,
        secondaryRegion: secondaryRegion,
        eventBusArn: eventBusStack.eventBus.eventBusArn,
        env: { region: primaryRegion },
      }
    );

    // Create the Monitoring stack
    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix: environmentSuffix,
      dlq: eventBusStack.dlq,
      env: { region: primaryRegion },
    });

    // Add dependencies to ensure proper deployment order
    lambdaStack.addDependency(dynamoDBStack);
    eventBusStack.addDependency(lambdaStack);
    globalEndpointStack.addDependency(eventBusStack);
    monitoringStack.addDependency(eventBusStack);
  }
}
