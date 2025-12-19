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
