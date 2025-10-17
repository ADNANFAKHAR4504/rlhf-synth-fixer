import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface ServiceConnectConstructProps {
  vpc: ec2.Vpc;
  environmentSuffix: string;
}

export class ServiceConnectConstruct extends Construct {
  public readonly namespace: servicediscovery.PrivateDnsNamespace;

  constructor(
    scope: Construct,
    id: string,
    props: ServiceConnectConstructProps
  ) {
    super(scope, id);

    // Create a private Cloud Map namespace for service discovery
    this.namespace = new servicediscovery.PrivateDnsNamespace(
      this,
      `FoodDeliveryNamespace-${props.environmentSuffix}`,
      {
        name: `food-delivery-${props.environmentSuffix}.local`,
        vpc: props.vpc,
        description: 'Private namespace for Food Delivery microservices',
      }
    );

    // Output namespace details for reference
    new cdk.CfnOutput(this, 'NamespaceId', {
      value: this.namespace.namespaceId,
      description: 'The ID of the private DNS namespace',
      exportName: `FoodDeliveryNamespaceId-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NamespaceName', {
      value: this.namespace.namespaceName,
      description: 'The name of the private DNS namespace',
      exportName: `FoodDeliveryNamespaceName-${props.environmentSuffix}`,
    });
  }
}
