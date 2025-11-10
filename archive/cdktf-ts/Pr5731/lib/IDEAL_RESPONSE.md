## modules.ts

```typescript
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

// Environment configuration interface
export interface EnvironmentConfig {
  name: string;
  cidrBlock: string;
  dbInstanceClass: string;
  flowLogRetentionDays: number;
  tags: Record<string, string>;
  awsRegion?: string;
}

// Networking Module
export class NetworkingModule extends Construct {
  public vpc: aws.vpc.Vpc;
  public publicSubnets: aws.subnet.Subnet[] = [];
  public privateSubnets: aws.subnet.Subnet[] = [];
  public databaseSubnets: aws.subnet.Subnet[] = [];
  public internetGateway: aws.internetGateway.InternetGateway;
  public natGateways: aws.natGateway.NatGateway[] = [];
  public vpcEndpoints: Record<string, aws.vpcEndpoint.VpcEndpoint> = {};
  public publicRouteTable: aws.routeTable.RouteTable;
  public privateRouteTables: aws.routeTable.RouteTable[] = [];
  public databaseRouteTable: aws.routeTable.RouteTable;

  constructor(scope: Construct, id: string, config: EnvironmentConfig) {
    super(scope, id);

    const awsRegion = config.awsRegion || 'us-east-1';

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.name}-vpc`,
      },
    });

    // Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.name}-igw`,
        },
      }
    );

    // Create subnets across 3 AZs
    const azs = ['a', 'b', 'c'];

    azs.forEach((az, index) => {
      // Public subnet
      const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${az}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${config.cidrBlock.split('.')[0]}.${config.cidrBlock.split('.')[1]}.${index * 10}.0/24`,
        availabilityZone: `${awsRegion}${az}`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.name}-public-${az}`,
          Type: 'public',
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new aws.subnet.Subnet(
        this,
        `private-subnet-${az}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `${config.cidrBlock.split('.')[0]}.${config.cidrBlock.split('.')[1]}.${100 + index * 10}.0/24`,
          availabilityZone: `${awsRegion}${az}`,
          tags: {
            ...config.tags,
            Name: `${config.name}-private-${az}`,
            Type: 'private',
          },
        }
      );
      this.privateSubnets.push(privateSubnet);

      // Database subnet
      const dbSubnet = new aws.subnet.Subnet(this, `db-subnet-${az}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${config.cidrBlock.split('.')[0]}.${config.cidrBlock.split('.')[1]}.${200 + index * 10}.0/24`,
        availabilityZone: `${awsRegion}${az}`,
        tags: {
          ...config.tags,
          Name: `${config.name}-db-${az}`,
          Type: 'database',
        },
      });
      this.databaseSubnets.push(dbSubnet);

      // Create NAT Gateway for each public subnet
      const eip = new aws.eip.Eip(this, `nat-eip-${az}`, {
        domain: 'vpc',
        tags: {
          ...config.tags,
          Name: `${config.name}-nat-eip-${az}`,
        },
      });

      const natGateway = new aws.natGateway.NatGateway(this, `nat-${az}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          ...config.tags,
          Name: `${config.name}-nat-${az}`,
        },
      });
      this.natGateways.push(natGateway);
    });

    // Route tables
    this.publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.name}-public-rt`,
      },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        }
      );
    });

    // Private route tables (one per AZ for NAT Gateway)
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-rt-${index}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...config.tags,
            Name: `${config.name}-private-rt-${index}`,
          },
        }
      );
      this.privateRouteTables.push(privateRouteTable);

      new aws.route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    // Database route tables
    this.databaseRouteTable = new aws.routeTable.RouteTable(this, 'db-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.name}-db-rt`,
      },
    });

    this.databaseSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `db-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: this.databaseRouteTable.id,
        }
      );
    });

    // VPC Endpoints
    const endpoints = [
      's3',
      'ecr.dkr',
      'ecr.api',
      'ssm',
      'ssmmessages',
      'ec2messages',
    ];

    endpoints.forEach(endpoint => {
      const endpointType = endpoint === 's3' ? 'Gateway' : 'Interface';

      this.vpcEndpoints[endpoint] = new aws.vpcEndpoint.VpcEndpoint(
        this,
        `endpoint-${endpoint.replace('.', '-')}`,
        {
          vpcId: this.vpc.id,
          serviceName: `com.amazonaws.${awsRegion}.${endpoint}`,
          vpcEndpointType: endpointType,
          ...(endpointType === 'Gateway'
            ? {
                routeTableIds: [
                  this.publicRouteTable.id,
                  this.databaseRouteTable.id,
                ],
              }
            : {
                subnetIds: this.privateSubnets.map(s => s.id),
                privateDnsEnabled: true,
              }),
          tags: {
            ...config.tags,
            Name: `${config.name}-endpoint-${endpoint}`,
          },
        }
      );
    });

    // VPC Flow Logs
    const flowLogRole = new aws.iamRole.IamRole(this, 'flow-log-role', {
      name: `${config.name}-vpc-flow-log-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
            Effect: 'Allow',
          },
        ],
      }),
      tags: config.tags,
    });

    new aws.iamRolePolicy.IamRolePolicy(this, 'flow-log-policy', {
      name: 'flow-log-policy',
      role: flowLogRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    const logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'flow-log-group',
      {
        name: `/aws/vpc/flowlogs/${config.name}`,
        retentionInDays: config.flowLogRetentionDays,
        tags: config.tags,
      }
    );

    new aws.flowLog.FlowLog(this, 'flow-log', {
      iamRoleArn: flowLogRole.arn,
      logDestinationType: 'cloud-watch-logs',
      logDestination: logGroup.arn,
      trafficType: 'ALL',
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.name}-flow-log`,
      },
    });
  }
}

// VPC Peering Module
export class VPCPeeringModule extends Construct {
  public peeringConnection: aws.vpcPeeringConnection.VpcPeeringConnection;
  private routeCounter = 0;

  constructor(
    scope: Construct,
    id: string,
    sourceVpc: aws.vpc.Vpc,
    targetVpc: aws.vpc.Vpc,
    config: { name: string; tags: Record<string, string> }
  ) {
    super(scope, id);

    // Create VPC Peering Connection
    this.peeringConnection = new aws.vpcPeeringConnection.VpcPeeringConnection(
      this,
      'peering',
      {
        vpcId: sourceVpc.id,
        peerVpcId: targetVpc.id,
        autoAccept: true,
        accepter: {
          allowRemoteVpcDnsResolution: true,
        },
        requester: {
          allowRemoteVpcDnsResolution: true,
        },
        tags: {
          ...config.tags,
          Name: config.name,
        },
      }
    );
  }

  public addPeeringRoutes(
    sourceRouteTable: aws.routeTable.RouteTable,
    targetCidr: string,
    targetRouteTable?: aws.routeTable.RouteTable,
    sourceCidr?: string
  ) {
    // Add route from source to target
    new aws.route.Route(this, `route-to-target-${++this.routeCounter}`, {
      routeTableId: sourceRouteTable.id,
      destinationCidrBlock: targetCidr,
      vpcPeeringConnectionId: this.peeringConnection.id,
    });

    // Add reverse route if target route table provided
    if (targetRouteTable && sourceCidr) {
      new aws.route.Route(this, `route-to-source-${++this.routeCounter}`, {
        routeTableId: targetRouteTable.id,
        destinationCidrBlock: sourceCidr,
        vpcPeeringConnectionId: this.peeringConnection.id,
      });
    }
  }
}

// Database Module
export class DatabaseModule extends Construct {
  public cluster: aws.rdsCluster.RdsCluster;
  public passwordParameter: aws.ssmParameter.SsmParameter;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    network: NetworkingModule
  ) {
    super(scope, id);

    // KMS key for encryption
    const kmsKey = new aws.kmsKey.KmsKey(this, 'db-kms-key', {
      description: `${config.name} RDS encryption key`,
      tags: config.tags,
    });

    new aws.kmsAlias.KmsAlias(this, 'db-kms-alias', {
      name: `alias/${config.name}-rds`,
      targetKeyId: kmsKey.id,
    });

    // Generate random password
    const password =
      new aws.dataAwsSecretsmanagerRandomPassword.DataAwsSecretsmanagerRandomPassword(
        this,
        'db-password',
        {
          passwordLength: 32,
          includeSpace: false,
        }
      );

    // Store password in SSM
    this.passwordParameter = new aws.ssmParameter.SsmParameter(
      this,
      'db-password-param',
      {
        name: `/${config.name}/rds/password`,
        type: 'SecureString',
        value: password.randomPassword,
        keyId: kmsKey.id,
        tags: config.tags,
      }
    );

    // DB subnet group
    const subnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'subnet-group',
      {
        name: `${config.name}-db-subnet-group`,
        subnetIds: network.databaseSubnets.map(s => s.id),
        tags: config.tags,
      }
    );

    // Security group for RDS
    const securityGroup = new aws.securityGroup.SecurityGroup(this, 'db-sg', {
      name: `${config.name}-rds-sg`,
      description: 'Security group for RDS Aurora PostgreSQL',
      vpcId: network.vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          cidrBlocks: [network.vpc.cidrBlock],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: config.tags,
    });

    // RDS Aurora cluster
    this.cluster = new aws.rdsCluster.RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: `${config.name}-aurora-cluster`,
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      databaseName: 'appdb',
      masterUsername: 'dbadmin',
      manageMasterUserPassword: true,
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: [securityGroup.id],
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: false,
      skipFinalSnapshot: true,
      tags: config.tags,
    });

    // Aurora instances
    ['instance-1', 'instance-2'].forEach((instanceId, _index) => {
      new aws.rdsClusterInstance.RdsClusterInstance(this, instanceId, {
        identifier: `${config.name}-aurora-${instanceId}`,
        clusterIdentifier: this.cluster.id,
        instanceClass: config.dbInstanceClass,
        engine: this.cluster.engine,
        engineVersion: this.cluster.engineVersion,
        performanceInsightsEnabled: false,
        tags: config.tags,
      });
    });
  }
}

// IAM Module
export class IAMModule extends Construct {
  public ecsTaskRole: aws.iamRole.IamRole;
  public ecsExecutionRole: aws.iamRole.IamRole;

  constructor(scope: Construct, id: string, config: EnvironmentConfig) {
    super(scope, id);

    // ECS Task Execution Role
    this.ecsExecutionRole = new aws.iamRole.IamRole(
      this,
      'ecs-execution-role',
      {
        name: `${config.name}-ecs-execution-role`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
              Effect: 'Allow',
            },
          ],
        }),
        tags: config.tags,
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ecs-execution-policy',
      {
        role: this.ecsExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      }
    );

    // ECS Task Role
    this.ecsTaskRole = new aws.iamRole.IamRole(this, 'ecs-task-role', {
      name: `${config.name}-ecs-task-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: { Service: 'ecs-tasks.amazonaws.com' },
            Effect: 'Allow',
          },
        ],
      }),
      tags: config.tags,
    });

    // Task role policy for SSM parameter access
    new aws.iamRolePolicy.IamRolePolicy(this, 'ecs-task-policy', {
      name: 'ecs-task-policy',
      role: this.ecsTaskRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ssm:GetParameter',
              'ssm:GetParameters',
              'ssm:GetParameterHistory',
              'ssm:GetParametersByPath',
            ],
            Resource: `arn:aws:ssm:*:*:parameter/${config.name}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: '*',
          },
        ],
      }),
    });
  }
}

// Compute Module (ECS)
export class ComputeModule extends Construct {
  public cluster: aws.ecsCluster.EcsCluster;
  public service: aws.ecsService.EcsService;
  public taskDefinition: aws.ecsTaskDefinition.EcsTaskDefinition;
  public targetGroup: aws.albTargetGroup.AlbTargetGroup;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    network: NetworkingModule,
    iam: IAMModule,
    albSecurityGroupId: string,
    database?: DatabaseModule
  ) {
    super(scope, id);

    const awsRegion = config.awsRegion || 'us-east-1';

    // ECS Cluster
    this.cluster = new aws.ecsCluster.EcsCluster(this, 'cluster', {
      name: `${config.name}-ecs-cluster`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: config.tags,
    });

    // Capacity Provider
    const capacityProvider =
      new aws.ecsClusterCapacityProviders.EcsClusterCapacityProviders(
        this,
        'capacity-providers',
        {
          clusterName: this.cluster.name,
          capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
          defaultCapacityProviderStrategy: [
            {
              base: 1,
              weight: 1,
              capacityProvider: 'FARGATE',
            },
          ],
        }
      );

    // Target Group
    this.targetGroup = new aws.albTargetGroup.AlbTargetGroup(this, 'tg', {
      name: `${config.name}-ecs-tg`,
      port: 80,
      protocol: 'HTTP',
      targetType: 'ip',
      vpcId: network.vpc.id,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: '200,404', // Accept 404 as nginx default page returns 404 for /
        path: '/', // Change from /health to /
        port: 'traffic-port',
        protocol: 'HTTP',
        timeout: 5,
        unhealthyThreshold: 3,
      },
      tags: config.tags,
    });

    // Task Definition
    // In ComputeModule class, update the task definition:
    this.taskDefinition = new aws.ecsTaskDefinition.EcsTaskDefinition(
      this,
      'task-def',
      {
        family: `${config.name}-app`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '256',
        memory: '512',
        executionRoleArn: iam.ecsExecutionRole.arn,
        taskRoleArn: iam.ecsTaskRole.arn,
        containerDefinitions: JSON.stringify([
          {
            name: 'app',
            // Use a simple web server with health check support
            image: 'public.ecr.aws/nginx/nginx:stable-alpine',
            cpu: 256,
            memory: 512,
            essential: true,
            portMappings: [
              {
                containerPort: 80,
                protocol: 'tcp',
              },
            ],
            // Add health check command
            healthCheck: {
              command: [
                'CMD-SHELL',
                'wget --no-verbose --tries=1 --spider http://localhost/ || exit 1',
              ],
              interval: 30,
              timeout: 5,
              retries: 3,
              startPeriod: 60,
            },
            // Add environment variables for database connection if needed
            environment: database
              ? [
                  {
                    name: 'DB_ENDPOINT',
                    value: database.cluster.endpoint,
                  },
                  {
                    name: 'DB_NAME',
                    value: 'appdb',
                  },
                ]
              : [],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': `/ecs/${config.name}-app`,
                'awslogs-region': awsRegion,
                'awslogs-stream-prefix': 'ecs',
                'awslogs-create-group': 'true',
              },
            },
          },
        ]),
        tags: config.tags,
      }
    );

    // CloudWatch Log Group
    new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'ecs-logs', {
      name: `/ecs/${config.name}-app`,
      retentionInDays: 7,
      tags: config.tags,
    });

    // Security Group for ECS Service
    const serviceSecurityGroup = new aws.securityGroup.SecurityGroup(
      this,
      'service-sg',
      {
        name: `${config.name}-ecs-service-sg`,
        description: 'Security group for ECS service',
        vpcId: network.vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [albSecurityGroupId],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: config.tags,
      }
    );

    // ECS Service
    this.service = new aws.ecsService.EcsService(this, 'service', {
      name: `${config.name}-app-service`,
      cluster: this.cluster.id,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: network.privateSubnets.map(s => s.id),
        securityGroups: [serviceSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: this.targetGroup.arn,
          containerName: 'app',
          containerPort: 80,
        },
      ],
      tags: config.tags,
      dependsOn: database ? [database.cluster] : [capacityProvider],
    });

    // Auto Scaling
    const scalingTarget = new aws.appautoscalingTarget.AppautoscalingTarget(
      this,
      'scaling-target',
      {
        maxCapacity: 10,
        minCapacity: 2,
        resourceId: `service/${this.cluster.name}/${this.service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      }
    );

    new aws.appautoscalingPolicy.AppautoscalingPolicy(
      this,
      'scaling-policy-cpu',
      {
        name: `${config.name}-cpu-scaling`,
        policyType: 'TargetTrackingScaling',
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70,
        },
      }
    );
  }
}

// Load Balancer Module
export class LoadBalancerModule extends Construct {
  public alb: aws.alb.Alb;
  public securityGroup: aws.securityGroup.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    network: NetworkingModule
  ) {
    super(scope, id);

    // ALB Security Group
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'alb-sg', {
      name: `${config.name}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: network.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: config.tags,
    });

    // Application Load Balancer
    this.alb = new aws.alb.Alb(this, 'alb', {
      name: `${config.name}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [this.securityGroup.id],
      subnets: network.publicSubnets.map(s => s.id),
      enableDeletionProtection: false,
      enableHttp2: true,
      tags: config.tags,
    });
  }

  public createListener(targetGroup: aws.albTargetGroup.AlbTargetGroup) {
    return new aws.albListener.AlbListener(this, 'http-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });
  }
}

// DNS Module
export class DNSModule extends Construct {
  public record: aws.route53Record.Route53Record;

  constructor(
    scope: Construct,
    id: string,
    config: EnvironmentConfig,
    alb: aws.alb.Alb,
    hostedZoneId: string
  ) {
    super(scope, id);

    this.record = new aws.route53Record.Route53Record(this, 'dns-record', {
      zoneId: hostedZoneId,
      name: `${config.name}.mytszone.com`,
      type: 'A',
      alias: {
        name: alb.dnsName,
        zoneId: alb.zoneId,
        evaluateTargetHealth: true,
      },
    });
  }
}
```

## tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import {
  NetworkingModule,
  DatabaseModule,
  IAMModule,
  ComputeModule,
  LoadBalancerModule,
  DNSModule,
  VPCPeeringModule,
  EnvironmentConfig,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with DynamoDB locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Environment configurations
    const environments: EnvironmentConfig[] = [
      {
        name: `dev${environmentSuffix ? `-${environmentSuffix}` : ''}`,
        cidrBlock: '10.0.0.0/16',
        dbInstanceClass: 'db.r5.large',
        flowLogRetentionDays: 7,
        awsRegion: awsRegion,
        tags: {
          Environment: 'dev',
          Project: 'fintech-app',
          CostCenter: 'development',
          CreatedBy: 'CDKTF',
          ...(environmentSuffix && { EnvironmentSuffix: environmentSuffix }),
        },
      },
      {
        name: `staging${environmentSuffix ? `-${environmentSuffix}` : ''}`,
        cidrBlock: '10.1.0.0/16',
        dbInstanceClass: 'db.r5.large',
        flowLogRetentionDays: 30,
        awsRegion: awsRegion,
        tags: {
          Environment: 'staging',
          Project: 'fintech-app',
          CostCenter: 'staging',
          CreatedBy: 'CDKTF',
          ...(environmentSuffix && { EnvironmentSuffix: environmentSuffix }),
        },
      },
      {
        name: `prod${environmentSuffix ? `-${environmentSuffix}` : ''}`,
        cidrBlock: '10.2.0.0/16',
        dbInstanceClass: 'db.r5.large',
        flowLogRetentionDays: 90,
        awsRegion: awsRegion,
        tags: {
          Environment: 'prod',
          Project: 'fintech-app',
          CostCenter: 'production',
          CreatedBy: 'CDKTF',
          ...(environmentSuffix && { EnvironmentSuffix: environmentSuffix }),
        },
      },
    ];

    // Create Route53 hosted zone for DNS records
    const hostedZone = new aws.route53Zone.Route53Zone(this, 'hosted-zone', {
      name: 'mytszone.com',
      tags: {
        Name: 'mytszone.com',
        Project: 'fintech-app',
        ...(environmentSuffix && { EnvironmentSuffix: environmentSuffix }),
      },
    });

    // Store networking modules for VPC peering
    const networkingModules: { [key: string]: NetworkingModule } = {};
    const databases: { [key: string]: DatabaseModule } = {};

    // Create all environments
    environments.forEach(envConfig => {
      // 1. Networking
      const networking = new NetworkingModule(
        this,
        `${envConfig.name}-networking`,
        envConfig
      );
      networkingModules[envConfig.name] = networking;

      // 2. IAM Roles
      const iam = new IAMModule(this, `${envConfig.name}-iam`, envConfig);

      // 3. Load Balancer
      const loadBalancer = new LoadBalancerModule(
        this,
        `${envConfig.name}-alb`,
        envConfig,
        networking
      );

      // 4. Database (with dependency on networking)
      const database = new DatabaseModule(
        this,
        `${envConfig.name}-database`,
        envConfig,
        networking
      );
      databases[envConfig.name] = database;

      // 5. Compute (ECS) - depends on database being ready
      const compute = new ComputeModule(
        this,
        `${envConfig.name}-compute`,
        envConfig,
        networking,
        iam,
        loadBalancer.securityGroup.id,
        database
      );

      // 6. ALB Listener
      loadBalancer.createListener(compute.targetGroup);

      // 7. DNS
      const dns = new DNSModule(
        this,
        `${envConfig.name}-dns`,
        envConfig,
        loadBalancer.alb,
        hostedZone.zoneId
      );

      // Stack dependencies - ECS depends on RDS
      // compute.service.addOverride('depends_on', [
      //   `\${${database.cluster.terraformResourceType}.${database.cluster.friendlyUniqueId}}`,
      // ]);

      // Output critical endpoints
      new TerraformOutput(this, `${envConfig.name}-vpc-id`, {
        value: networking.vpc.id,
        description: `VPC ID for ${envConfig.name}`,
      });

      new TerraformOutput(this, `${envConfig.name}-alb-dns`, {
        value: loadBalancer.alb.dnsName,
        description: `ALB DNS name for ${envConfig.name}`,
      });

      new TerraformOutput(this, `${envConfig.name}-alb-zone-id`, {
        value: loadBalancer.alb.zoneId,
        description: `ALB Zone ID for ${envConfig.name}`,
      });

      new TerraformOutput(this, `${envConfig.name}-rds-endpoint`, {
        value: database.cluster.endpoint,
        description: `RDS endpoint for ${envConfig.name}`,
        sensitive: true,
      });

      new TerraformOutput(this, `${envConfig.name}-ecs-cluster`, {
        value: compute.cluster.name,
        description: `ECS cluster name for ${envConfig.name}`,
      });

      new TerraformOutput(this, `${envConfig.name}-dns-record`, {
        value: dns.record.fqdn,
        description: `DNS FQDN for ${envConfig.name}`,
      });
    });

    // Setup VPC Peering between staging and prod
    const stagingEnv = `staging${environmentSuffix ? `-${environmentSuffix}` : ''}`;
    const prodEnv = `prod${environmentSuffix ? `-${environmentSuffix}` : ''}`;

    if (networkingModules[stagingEnv] && networkingModules[prodEnv]) {
      const vpcPeering = new VPCPeeringModule(
        this,
        'staging-prod-peering',
        networkingModules[stagingEnv].vpc,
        networkingModules[prodEnv].vpc,
        {
          name: `${stagingEnv}-to-${prodEnv}-peering`,
          tags: {
            Name: `${stagingEnv}-to-${prodEnv}-peering`,
            Project: 'fintech-app',
            Purpose: 'data-migration',
            ...(environmentSuffix && { EnvironmentSuffix: environmentSuffix }),
          },
        }
      );

      // Add peering routes to all route tables for both environments
      const stagingNetwork = networkingModules[stagingEnv];
      const prodNetwork = networkingModules[prodEnv];

      // Staging to Prod routes
      vpcPeering.addPeeringRoutes(
        stagingNetwork.publicRouteTable,
        prodNetwork.vpc.cidrBlock
      );
      vpcPeering.addPeeringRoutes(
        stagingNetwork.databaseRouteTable,
        prodNetwork.vpc.cidrBlock
      );
      stagingNetwork.privateRouteTables.forEach(rt => {
        vpcPeering.addPeeringRoutes(rt, prodNetwork.vpc.cidrBlock);
      });

      // Prod to Staging routes
      vpcPeering.addPeeringRoutes(
        prodNetwork.publicRouteTable,
        stagingNetwork.vpc.cidrBlock
      );
      vpcPeering.addPeeringRoutes(
        prodNetwork.databaseRouteTable,
        stagingNetwork.vpc.cidrBlock
      );
      prodNetwork.privateRouteTables.forEach(rt => {
        vpcPeering.addPeeringRoutes(rt, stagingNetwork.vpc.cidrBlock);
      });

      new TerraformOutput(this, 'vpc-peering-connection-id', {
        value: vpcPeering.peeringConnection.id,
        description: 'VPC Peering Connection ID between staging and prod',
      });
    }

    // Output Route53 Hosted Zone
    new TerraformOutput(this, 'route53-zone-id', {
      value: hostedZone.zoneId,
      description: 'Route53 hosted zone ID for mytszone.com',
    });

    new TerraformOutput(this, 'route53-name-servers', {
      value: hostedZone.nameServers,
      description: 'Route53 name servers for mytszone.com',
    });
  }
}
```