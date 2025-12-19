import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';

export interface SecondaryEventBusStackProps extends cdk.StackProps {
  eventBusName: string;
}

export class SecondaryEventBusStack extends cdk.Stack {
  public readonly eventBus: events.EventBus;

  constructor(
    scope: Construct,
    id: string,
    props: SecondaryEventBusStackProps
  ) {
    super(scope, id, props);

    // Create the secondary event bus with the same name as primary
    this.eventBus = new events.EventBus(this, 'SecondaryEventBus', {
      eventBusName: props.eventBusName,
    });

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'SecondaryEventBusArn', {
      value: this.eventBus.eventBusArn,
      description: 'ARN of the Secondary Event Bus in us-west-2',
      exportName: `trading-secondary-event-bus-arn-${props.eventBusName}`,
    });

    new cdk.CfnOutput(this, 'SecondaryEventBusName', {
      value: this.eventBus.eventBusName,
      description: 'Name of the Secondary Event Bus in us-west-2',
      exportName: `trading-secondary-event-bus-name-${props.eventBusName}`,
    });

    new cdk.CfnOutput(this, 'SecondaryRegion', {
      value: this.region,
      description: 'AWS region for the secondary event bus',
      exportName: `trading-secondary-region-${props.eventBusName}`,
    });

    new cdk.CfnOutput(this, 'SecondaryEventBusAccount', {
      value: this.account,
      description: 'AWS account ID for the secondary event bus',
      exportName: `trading-secondary-account-${props.eventBusName}`,
    });
  }
}
