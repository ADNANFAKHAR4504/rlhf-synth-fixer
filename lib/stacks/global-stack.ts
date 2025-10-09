import * as cdk from 'aws-cdk-lib';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as globalaccelerator from 'aws-cdk-lib/aws-globalaccelerator';
import * as ga_endpoints from 'aws-cdk-lib/aws-globalaccelerator-endpoints';
import { Construct } from 'constructs';

interface GlobalStackProps {
  primaryAlb: elbv2.ApplicationLoadBalancer;
  environmentSuffix: string;
}

export class GlobalStack extends Construct {
  public readonly accelerator: globalaccelerator.Accelerator;

  constructor(scope: Construct, id: string, props: GlobalStackProps) {
    super(scope, id);

    // Create Global Accelerator
    this.accelerator = new globalaccelerator.Accelerator(
      this,
      `TradingAccelerator${props.environmentSuffix}`,
      {
        acceleratorName: `TradingPlatformAccelerator${props.environmentSuffix}`,
        enabled: true,
      }
    );

    // Create listener for HTTP
    const listener = this.accelerator.addListener(
      `WebListener${props.environmentSuffix}`,
      {
        portRanges: [
          {
            fromPort: 80,
            toPort: 80,
          },
        ],
      }
    );

    // Create endpoint group for primary region
    listener.addEndpointGroup(`USEndpointGroup${props.environmentSuffix}`, {
      trafficDialPercentage: 100,
      healthCheckPath: '/',
      healthCheckPort: 80,
      healthCheckProtocol: globalaccelerator.HealthCheckProtocol.HTTP,
      healthCheckInterval: cdk.Duration.seconds(30),
      endpoints: [
        new ga_endpoints.ApplicationLoadBalancerEndpoint(props.primaryAlb, {
          weight: 128,
        }),
      ],
    });

    // Output the Global Accelerator DNS name
    new cdk.CfnOutput(this, `GlobalAcceleratorDNS${props.environmentSuffix}`, {
      value: this.accelerator.dnsName,
      description: 'The DNS name of the Global Accelerator',
      exportName: `GlobalAcceleratorDNS${props.environmentSuffix}`,
    });
  }
}
