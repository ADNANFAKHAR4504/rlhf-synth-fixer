import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as events from 'aws-cdk-lib/aws-events';

export interface GlobalEndpointStackProps extends cdk.StackProps {
  primaryRegion: string;
  secondaryRegion: string;
  eventBusArn: string;
  environmentSuffix: string;
}

export class GlobalEndpointStack extends cdk.Stack {
  public readonly globalEndpoint: events.CfnEndpoint;

  constructor(scope: Construct, id: string, props: GlobalEndpointStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create an EventBridge Global Endpoint
    this.globalEndpoint = new events.CfnEndpoint(
      this,
      'TradingGlobalEndpoint',
      {
        name: `trading-global-endpoint-${suffix}`,
        routingConfig: {
          failoverConfig: {
            primary: {
              healthCheck: props.eventBusArn,
            },
            secondary: {
              route: props.secondaryRegion,
            },
          },
        },
        eventBuses: [
          {
            eventBusArn: props.eventBusArn,
          },
        ],
      }
    );

    new cdk.CfnOutput(this, 'GlobalEndpointUrl', {
      value: this.globalEndpoint.attrEndpointUrl,
      description: 'URL for the EventBridge Global Endpoint',
      exportName: `trading-global-endpoint-url-${suffix}`,
    });

    new cdk.CfnOutput(this, 'GlobalEndpointArn', {
      value: this.globalEndpoint.attrArn,
      description: 'ARN for the EventBridge Global Endpoint',
      exportName: `trading-global-endpoint-arn-${suffix}`,
    });
  }
}
