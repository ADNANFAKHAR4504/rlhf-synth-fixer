import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from './vpc-construct';
import { EcsClusterConstruct } from './ecs-cluster-construct';
import { ServiceConnectConstruct } from './service-connect-construct';
import { AlbConstruct } from './alb-construct';
import { OrdersApiConstruct } from './orders-api-construct';
import { RestaurantsApiConstruct } from './restaurants-api-construct';

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

    // Create the VPC
    const vpcConstruct = new VpcConstruct(this, 'VpcConstruct', {
      environmentSuffix,
    });

    // Create the ECS cluster
    const ecsClusterConstruct = new EcsClusterConstruct(
      this,
      'EcsClusterConstruct',
      {
        vpc: vpcConstruct.vpc,
        environmentSuffix,
      }
    );

    // Create the Service Connect namespace
    const serviceConnectConstruct = new ServiceConnectConstruct(
      this,
      'ServiceConnectConstruct',
      {
        vpc: vpcConstruct.vpc,
        environmentSuffix,
      }
    );

    // Create the ALB
    const albConstruct = new AlbConstruct(this, 'AlbConstruct', {
      vpc: vpcConstruct.vpc,
      environmentSuffix,
    });

    // Create the Orders API
    const ordersApiConstruct = new OrdersApiConstruct(
      this,
      'OrdersApiConstruct',
      {
        vpc: vpcConstruct.vpc,
        cluster: ecsClusterConstruct.cluster,
        namespace: serviceConnectConstruct.namespace,
        alb: albConstruct.alb,
        httpListener: albConstruct.httpListener,
        environmentSuffix,
      }
    );

    // Create the Restaurants API
    const restaurantsApiConstruct = new RestaurantsApiConstruct(
      this,
      'RestaurantsApiConstruct',
      {
        vpc: vpcConstruct.vpc,
        cluster: ecsClusterConstruct.cluster,
        namespace: serviceConnectConstruct.namespace,
        ordersApiSecurityGroup: ordersApiConstruct.securityGroup,
        environmentSuffix,
      }
    );

    // Additional Stack Outputs for Integration and E2E Testing

    // VPC and Network Outputs
    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpcConstruct.vpc.vpcCidrBlock,
      description: 'CIDR block of the VPC',
      exportName: `FoodDeliveryVpcCidr-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AvailabilityZones', {
      value: cdk.Fn.join(',', vpcConstruct.vpc.availabilityZones),
      description: 'Availability zones used by the VPC',
      exportName: `FoodDeliveryAvailabilityZones-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: cdk.Fn.join(
        ',',
        vpcConstruct.vpc.publicSubnets.map(subnet => subnet.subnetId)
      ),
      description: 'IDs of the public subnets',
      exportName: `FoodDeliveryPublicSubnetIds-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: cdk.Fn.join(
        ',',
        vpcConstruct.vpc.privateSubnets.map(subnet => subnet.subnetId)
      ),
      description: 'IDs of the private subnets',
      exportName: `FoodDeliveryPrivateSubnetIds-${environmentSuffix}`,
    });

    // ECS Cluster Outputs
    new cdk.CfnOutput(this, 'ClusterArn', {
      value: ecsClusterConstruct.cluster.clusterArn,
      description: 'ARN of the ECS cluster',
      exportName: `FoodDeliveryClusterArn-${environmentSuffix}`,
    });

    // ALB Outputs
    new cdk.CfnOutput(this, 'AlbArn', {
      value: albConstruct.alb.loadBalancerArn,
      description: 'ARN of the Application Load Balancer',
      exportName: `FoodDeliveryAlbArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlbSecurityGroupId', {
      value: albConstruct.securityGroup.securityGroupId,
      description: 'Security group ID of the ALB',
      exportName: `FoodDeliveryAlbSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlbUrl', {
      value: `http://${albConstruct.alb.loadBalancerDnsName}`,
      description: 'Full HTTP URL of the Application Load Balancer',
      exportName: `FoodDeliveryAlbUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OrdersApiEndpoint', {
      value: `http://${albConstruct.alb.loadBalancerDnsName}/orders`,
      description: 'HTTP endpoint for the Orders API',
      exportName: `FoodDeliveryOrdersApiEndpoint-${environmentSuffix}`,
    });

    // Orders API Outputs
    new cdk.CfnOutput(this, 'OrdersApiServiceArn', {
      value: ordersApiConstruct.service.serviceArn,
      description: 'ARN of the Orders API ECS service',
      exportName: `OrdersApiServiceArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OrdersApiSecurityGroupId', {
      value: ordersApiConstruct.securityGroup.securityGroupId,
      description: 'Security group ID of the Orders API',
      exportName: `OrdersApiSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OrdersApiServiceConnectDns', {
      value: `orders-api-${environmentSuffix}`,
      description:
        'Service Connect DNS name for Orders API (internal communication)',
      exportName: `OrdersApiServiceConnectDns-${environmentSuffix}`,
    });

    // Restaurants API Outputs
    new cdk.CfnOutput(this, 'RestaurantsApiServiceArn', {
      value: restaurantsApiConstruct.service.serviceArn,
      description: 'ARN of the Restaurants API ECS service',
      exportName: `RestaurantsApiServiceArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RestaurantsApiSecurityGroupId', {
      value: restaurantsApiConstruct.securityGroup.securityGroupId,
      description: 'Security group ID of the Restaurants API',
      exportName: `RestaurantsApiSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RestaurantsApiServiceConnectDns', {
      value: `restaurants-api-${environmentSuffix}`,
      description:
        'Service Connect DNS name for Restaurants API (internal communication)',
      exportName: `RestaurantsApiServiceConnectDns-${environmentSuffix}`,
    });

    // Region Output
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region where the stack is deployed',
      exportName: `FoodDeliveryRegion-${environmentSuffix}`,
    });

    // Environment Suffix Output
    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
      exportName: `FoodDeliveryEnvironmentSuffix-${environmentSuffix}`,
    });
  }
}
