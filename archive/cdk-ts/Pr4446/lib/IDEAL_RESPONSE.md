# Food Delivery Microservices Infrastructure Implementation

Here is the complete CDK TypeScript infrastructure code for the food delivery application with ECS Service Connect and secure microservices communication:

## Main Stack Implementation

```typescript
// lib/tap-stack.ts
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
```

## VPC Construct

```typescript
// lib/vpc-construct.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface VpcConstructProps {
  environmentSuffix: string;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    // Create VPC with 2 AZs, 2 public and 2 private subnets
    this.vpc = new ec2.Vpc(this, `FoodDeliveryVpc-${props.environmentSuffix}`, {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      // Ensure NAT Gateways for outbound internet access from private subnets
      natGateways: 2,
    });

    // Output VPC ID for reference
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'The ID of the VPC',
      exportName: `FoodDeliveryVpcId-${props.environmentSuffix}`,
    });
  }
}
```

## ECS Cluster Construct

```typescript
// lib/ecs-cluster-construct.ts
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
```

## Service Connect Construct

```typescript
// lib/service-connect-construct.ts
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
```

## Application Load Balancer Construct

```typescript
// lib/alb-construct.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export interface AlbConstructProps {
  vpc: ec2.Vpc;
  environmentSuffix: string;
}

export class AlbConstruct extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly httpListener: elbv2.ApplicationListener;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    // Create a security group for the ALB
    this.securityGroup = new ec2.SecurityGroup(
      this,
      `AlbSecurityGroup-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        description:
          'Security group for the food delivery application load balancer',
        allowAllOutbound: true,
      }
    );

    // Allow inbound HTTP traffic
    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    // Create the ALB in the public subnets
    this.alb = new elbv2.ApplicationLoadBalancer(
      this,
      `FoodDeliveryALB-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: this.securityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Add an HTTP listener
    this.httpListener = this.alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    // Add a default action that returns a 404
    this.httpListener.addAction('Default', {
      action: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Route not found',
      }),
    });

    // Output the ALB DNS name
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      description: 'The DNS name of the load balancer',
      exportName: `FoodDeliveryAlbDnsName-${props.environmentSuffix}`,
    });
  }
}
```

## Orders API Construct

```typescript
// lib/orders-api-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export interface OrdersApiConstructProps {
  vpc: ec2.Vpc;
  cluster: ecs.Cluster;
  namespace: servicediscovery.PrivateDnsNamespace;
  alb: elbv2.ApplicationLoadBalancer;
  httpListener: elbv2.ApplicationListener;
  environmentSuffix: string;
}

export class OrdersApiConstruct extends Construct {
  public readonly service: ecs.FargateService;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: OrdersApiConstructProps) {
    super(scope, id);

    // Create a security group for the Orders API service
    this.securityGroup = new ec2.SecurityGroup(
      this,
      `OrdersApiSecurityGroup-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        description: 'Security group for the Orders API service',
        allowAllOutbound: true,
      }
    );

    // Allow inbound traffic from the ALB
    this.securityGroup.addIngressRule(
      ec2.Peer.securityGroupId(
        props.alb.connections.securityGroups[0].securityGroupId
      ),
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // Create a task definition for the Orders API
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `OrdersApiTaskDef-${props.environmentSuffix}`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    // Add the Orders API container to the task definition
    taskDefinition.addContainer('OrdersApiContainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'orders-api' }),
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
      },
      portMappings: [
        {
          containerPort: 80,
          protocol: ecs.Protocol.TCP,
          name: 'http',
          appProtocol: ecs.AppProtocol.http,
        },
      ],
      environment: {
        SERVICE_NAME: 'orders-api',
      },
    });

    // Create the ECS Service
    this.service = new ecs.FargateService(
      this,
      `OrdersApiService-${props.environmentSuffix}`,
      {
        cluster: props.cluster,
        taskDefinition,
        desiredCount: 2,
        securityGroups: [this.securityGroup],
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        assignPublicIp: false,
        enableExecuteCommand: true,
        serviceConnectConfiguration: {
          namespace: props.namespace.namespaceName,
          services: [
            {
              portMappingName: 'http',
              discoveryName: `orders-api-${props.environmentSuffix}`,
              dnsName: `orders-api-${props.environmentSuffix}`,
              port: 80,
            },
          ],
        },
      }
    );

    // Ensure the namespace is created before the service
    this.service.node.addDependency(props.namespace);

    // Add IAM permissions for ECS Exec
    taskDefinition.taskRole.addManagedPolicy(
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonSSMManagedInstanceCore'
      )
    );

    // Add a target group for the Orders API to the ALB
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `OrdersApiTargetGroup-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(60),
          timeout: cdk.Duration.seconds(5),
        },
      }
    );

    // Register the service with the target group
    this.service.attachToApplicationTargetGroup(targetGroup);

    // Add a rule to the listener to route traffic to the Orders API
    props.httpListener.addTargetGroups('OrdersApiRoute', {
      targetGroups: [targetGroup],
      conditions: [elbv2.ListenerCondition.pathPatterns(['/orders*'])],
      priority: 10,
    });

    // Output the service name
    new cdk.CfnOutput(this, 'OrdersApiServiceName', {
      value: this.service.serviceName,
      description: 'The name of the Orders API service',
      exportName: `OrdersApiServiceName-${props.environmentSuffix}`,
    });
  }
}
```

## Restaurants API Construct

```typescript
// lib/restaurants-api-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

export interface RestaurantsApiConstructProps {
  vpc: ec2.Vpc;
  cluster: ecs.Cluster;
  namespace: servicediscovery.PrivateDnsNamespace;
  ordersApiSecurityGroup: ec2.SecurityGroup;
  environmentSuffix: string;
}

export class RestaurantsApiConstruct extends Construct {
  public readonly service: ecs.FargateService;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    props: RestaurantsApiConstructProps
  ) {
    super(scope, id);

    // Create a security group for the Restaurants API service
    this.securityGroup = new ec2.SecurityGroup(
      this,
      `RestaurantsApiSecurityGroup-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        description: 'Security group for the Restaurants API service',
        allowAllOutbound: true,
      }
    );

    // Only allow inbound traffic from the Orders API
    this.securityGroup.addIngressRule(
      ec2.Peer.securityGroupId(props.ordersApiSecurityGroup.securityGroupId),
      ec2.Port.tcp(80),
      'Allow traffic from Orders API'
    );

    // Create a task definition for the Restaurants API
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `RestaurantsApiTaskDef-${props.environmentSuffix}`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
      }
    );

    // Add the Restaurants API container to the task definition
    taskDefinition.addContainer('RestaurantsApiContainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'restaurants-api' }),
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
      },
      portMappings: [
        {
          containerPort: 80,
          protocol: ecs.Protocol.TCP,
          name: 'http',
          appProtocol: ecs.AppProtocol.http,
        },
      ],
      environment: {
        SERVICE_NAME: 'restaurants-api',
      },
    });

    // Create the ECS Service
    this.service = new ecs.FargateService(
      this,
      `RestaurantsApiService-${props.environmentSuffix}`,
      {
        cluster: props.cluster,
        taskDefinition,
        desiredCount: 2,
        securityGroups: [this.securityGroup],
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        assignPublicIp: false,
        enableExecuteCommand: true,
        serviceConnectConfiguration: {
          namespace: props.namespace.namespaceName,
          services: [
            {
              portMappingName: 'http',
              discoveryName: `restaurants-api-${props.environmentSuffix}`,
              dnsName: `restaurants-api-${props.environmentSuffix}`,
              port: 80,
            },
          ],
        },
      }
    );

    // Ensure the namespace is created before the service
    this.service.node.addDependency(props.namespace);

    // Add IAM permissions for ECS Exec
    taskDefinition.taskRole.addManagedPolicy(
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        'AmazonSSMManagedInstanceCore'
      )
    );

    // Output the service name
    new cdk.CfnOutput(this, 'RestaurantsApiServiceName', {
      value: this.service.serviceName,
      description: 'The name of the Restaurants API service',
      exportName: `RestaurantsApiServiceName-${props.environmentSuffix}`,
    });
  }
}
```

## Key Implementation Features

This implementation provides:

1. **High Availability VPC Infrastructure**
   - VPC with 10.0.0.0/16 CIDR block
   - 2 public subnets across 2 Availability Zones
   - 2 private subnets across 2 Availability Zones
   - 2 NAT Gateways for outbound internet access from private subnets

2. **ECS Fargate Cluster**
   - Container Insights enabled for monitoring
   - Services deployed only in private subnets
   - Secure microservices architecture

3. **ECS Service Connect & Cloud Map**
   - Private DNS namespace (`food-delivery-{env}.local`)
   - Service mesh for service-to-service communication
   - Simple DNS-based service discovery
   - Services can communicate using short names (e.g., `http://restaurants-api-{env}`)

4. **Application Load Balancer**
   - Internet-facing ALB in public subnets
   - HTTP listener on port 80
   - Path-based routing to Orders API (`/orders*`)
   - Default 404 response for unmatched routes

5. **Secure Microservices**
   - **Orders API**: Publicly accessible through ALB, can communicate with Restaurants API
   - **Restaurants API**: Only accessible from Orders API via Service Connect
   - Locked-down security groups following least privilege principle

6. **ECS Exec Support**
   - Both services have ECS Exec enabled for debugging
   - IAM permissions configured for SSM access
   - Interactive shell access to running containers

7. **Health Checks**
   - Container-level health checks using curl
   - ALB target group health checks
   - Automatic traffic routing to healthy tasks

8. **Comprehensive CloudFormation Outputs**
   - VPC details (ID, CIDR, subnets, AZs)
   - ECS cluster information
   - ALB endpoints and ARNs
   - Service ARNs and security groups
   - Service Connect DNS names
   - Environment configuration

9. **Modular Architecture**
   - Separate construct files for each component
   - Clean separation of concerns
   - Reusable and maintainable code structure
   - Environment suffix support for multi-environment deployments

10. **Production-Ready Configuration**
    - 2 tasks per service for high availability
    - CloudWatch Logs integration
    - Detailed monitoring and logging
    - Security best practices enforced
