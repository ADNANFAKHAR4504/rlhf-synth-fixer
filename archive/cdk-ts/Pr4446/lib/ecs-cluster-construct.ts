import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface EcsClusterConstructProps {
  vpc: ec2.Vpc;
  environmentSuffix: string;
}

export class EcsClusterConstruct extends Construct {
  public readonly cluster: ecs.Cluster;

  constructor(scope: Construct, id: string, props: EcsClusterConstructProps) {
    super(scope, id);

    // Create ECS cluster in the provided VPC
    this.cluster = new ecs.Cluster(
      this,
      `FoodDeliveryCluster-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        containerInsights: true,
      }
    );

    // Output the cluster name for reference
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'The name of the ECS cluster',
      exportName: `FoodDeliveryClusterName-${props.environmentSuffix}`,
    });
  }
}
