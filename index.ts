/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';

const config = new pulumi.Config();
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

// Read region from AWS_REGION file or use default
const regionFilePath = path.join(__dirname, 'lib', 'AWS_REGION');
let regionFromFile = 'us-east-2'; // Default region
try {
  if (fs.existsSync(regionFilePath)) {
    regionFromFile = fs.readFileSync(regionFilePath, 'utf-8').trim();
  }
} catch (error) {
  console.log('Using default region: us-east-2');
}
const region = regionFromFile || 'us-east-2';

// Get database password from config or use default for testing
const dbPassword =
  config.getSecret('dbPassword') || pulumi.secret('TempPassword123!');

// VPC Configuration
const vpc = new aws.ec2.Vpc(`vpc-${environmentSuffix}`, {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    Name: `vpc-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// Internet Gateway
const internetGateway = new aws.ec2.InternetGateway(
  `igw-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: {
      Name: `igw-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// VPN Gateway
const _vpnGateway = new aws.ec2.VpnGateway(`vpn-${environmentSuffix}`, {
  vpcId: vpc.id,
  amazonSideAsn: '64512',
  tags: {
    Name: `vpn-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// Availability Zones
const availabilityZones = aws.getAvailabilityZonesOutput({
  state: 'available',
});

// Public Subnets (3 AZs)
const publicSubnets = [0, 1, 2].map(i => {
  return new aws.ec2.Subnet(`public-subnet-${i}-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${i}.0/24`,
    availabilityZone: availabilityZones.names[i],
    mapPublicIpOnLaunch: true,
    tags: {
      Name: `public-subnet-${i}-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  });
});

// Private Subnets (3 AZs)
const privateSubnets = [0, 1, 2].map(i => {
  return new aws.ec2.Subnet(`private-subnet-${i}-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${10 + i}.0/24`,
    availabilityZone: availabilityZones.names[i],
    tags: {
      Name: `private-subnet-${i}-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  });
});

// FIXED: Single NAT Gateway for cost optimization
const natEip = new aws.ec2.Eip(`nat-eip-${environmentSuffix}`, {
  domain: 'vpc',
  tags: {
    Name: `nat-eip-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

const natGateway = new aws.ec2.NatGateway(`nat-gw-${environmentSuffix}`, {
  subnetId: publicSubnets[0].id,
  allocationId: natEip.id,
  tags: {
    Name: `nat-gw-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// Public Route Table
const publicRouteTable = new aws.ec2.RouteTable(
  `public-rt-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
    ],
    tags: {
      Name: `public-rt-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

publicSubnets.forEach((subnet, i) => {
  new aws.ec2.RouteTableAssociation(`public-rta-${i}-${environmentSuffix}`, {
    subnetId: subnet.id,
    routeTableId: publicRouteTable.id,
  });
});

// FIXED: Single private route table for all subnets
const privateRouteTable = new aws.ec2.RouteTable(
  `private-rt-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      },
    ],
    tags: {
      Name: `private-rt-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

privateSubnets.forEach((subnet, i) => {
  new aws.ec2.RouteTableAssociation(`private-rta-${i}-${environmentSuffix}`, {
    subnetId: subnet.id,
    routeTableId: privateRouteTable.id,
  });
});

// Security Groups
const albSecurityGroup = new aws.ec2.SecurityGroup(
  `alb-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for Application Load Balancer',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      Name: `alb-sg-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const ecsSecurityGroup = new aws.ec2.SecurityGroup(
  `ecs-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for ECS tasks',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
        securityGroups: [albSecurityGroup.id],
      },
    ],
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      Name: `ecs-sg-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const rdsSecurityGroup = new aws.ec2.SecurityGroup(
  `rds-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for RDS Aurora',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 5432,
        toPort: 5432,
        securityGroups: [ecsSecurityGroup.id],
      },
    ],
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      Name: `rds-sg-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const dmsSecurityGroup = new aws.ec2.SecurityGroup(
  `dms-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for DMS replication instance',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 5432,
        toPort: 5432,
        securityGroups: [rdsSecurityGroup.id],
      },
    ],
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      Name: `dms-sg-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// RDS Subnet Group
const dbSubnetGroup = new aws.rds.SubnetGroup(
  `db-subnet-group-${environmentSuffix}`,
  {
    subnetIds: privateSubnets.map(subnet => subnet.id),
    tags: {
      Name: `db-subnet-group-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// RDS Aurora PostgreSQL Cluster
const auroraCluster = new aws.rds.Cluster(
  `aurora-cluster-${environmentSuffix}`,
  {
    engine: 'aurora-postgresql',
    engineMode: 'provisioned',
    engineVersion: '15.3',
    databaseName: 'migrationdb',
    masterUsername: 'admin',
    masterPassword: dbPassword,
    dbSubnetGroupName: dbSubnetGroup.name,
    vpcSecurityGroupIds: [rdsSecurityGroup.id],
    skipFinalSnapshot: true,
    serverlessv2ScalingConfiguration: {
      minCapacity: 0.5,
      maxCapacity: 1.0,
    },
    tags: {
      Name: `aurora-cluster-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const _auroraInstance = new aws.rds.ClusterInstance(
  `aurora-instance-${environmentSuffix}`,
  {
    clusterIdentifier: auroraCluster.id,
    instanceClass: 'db.serverless',
    engine: 'aurora-postgresql',
    engineVersion: '15.3',
    tags: {
      Name: `aurora-instance-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// DMS Subnet Group
const dmsSubnetGroup = new aws.dms.ReplicationSubnetGroup(
  `dms-subnet-group-${environmentSuffix}`,
  {
    replicationSubnetGroupDescription: 'DMS subnet group',
    replicationSubnetGroupId: `dms-subnet-group-${environmentSuffix}`,
    subnetIds: privateSubnets.map(subnet => subnet.id),
    tags: {
      Name: `dms-subnet-group-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// DMS Replication Instance
const dmsReplicationInstance = new aws.dms.ReplicationInstance(
  `dms-instance-${environmentSuffix}`,
  {
    replicationInstanceId: `dms-instance-${environmentSuffix}`,
    replicationInstanceClass: 'dms.t3.micro',
    allocatedStorage: 20,
    vpcSecurityGroupIds: [dmsSecurityGroup.id],
    replicationSubnetGroupId: dmsSubnetGroup.id,
    publiclyAccessible: false,
    tags: {
      Name: `dms-instance-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// DMS Target Endpoint (Aurora)
const dmsTargetEndpoint = new aws.dms.Endpoint(
  `dms-target-${environmentSuffix}`,
  {
    endpointId: `dms-target-${environmentSuffix}`,
    endpointType: 'target',
    engineName: 'aurora-postgresql',
    serverName: auroraCluster.endpoint,
    port: 5432,
    databaseName: 'migrationdb',
    username: 'admin',
    password: dbPassword,
    tags: {
      Name: `dms-target-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// DMS Source Endpoint (On-premises)
const dmsSourceEndpoint = new aws.dms.Endpoint(
  `dms-source-${environmentSuffix}`,
  {
    endpointId: `dms-source-${environmentSuffix}`,
    endpointType: 'source',
    engineName: 'postgres',
    serverName: config.get('sourceDbHost') || 'localhost',
    port: 5432,
    databaseName: config.get('sourceDbName') || 'sourcedb',
    username: config.get('sourceDbUser') || 'postgres',
    password: config.getSecret('sourceDbPassword') || 'password',
    tags: {
      Name: `dms-source-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// DMS Replication Task
const dmsReplicationTask = new aws.dms.ReplicationTask(
  `dms-task-${environmentSuffix}`,
  {
    replicationTaskId: `dms-task-${environmentSuffix}`,
    migrationType: 'full-load-and-cdc',
    replicationInstanceArn: dmsReplicationInstance.replicationInstanceArn,
    sourceEndpointArn: dmsSourceEndpoint.endpointArn,
    targetEndpointArn: dmsTargetEndpoint.endpointArn,
    tableMappings: JSON.stringify({
      rules: [
        {
          'rule-type': 'selection',
          'rule-id': '1',
          'rule-name': '1',
          'object-locator': {
            'schema-name': '%',
            'table-name': '%',
          },
          'rule-action': 'include',
        },
      ],
    }),
    tags: {
      Name: `dms-task-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// ADDED: ECR Repository with vulnerability scanning
const ecrRepository = new aws.ecr.Repository(`ecr-repo-${environmentSuffix}`, {
  name: `app-${environmentSuffix}`,
  imageTagMutability: 'MUTABLE',
  imageScanningConfiguration: {
    scanOnPush: true,
  },
  forceDelete: true,
  tags: {
    Name: `ecr-repo-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// ECR Lifecycle Policy
const _lifecyclePolicy = new aws.ecr.LifecyclePolicy(
  `ecr-lifecycle-${environmentSuffix}`,
  {
    repository: ecrRepository.name,
    policy: JSON.stringify({
      rules: [
        {
          rulePriority: 1,
          description: 'Keep last 10 images',
          selection: {
            tagStatus: 'any',
            countType: 'imageCountMoreThan',
            countNumber: 10,
          },
          action: {
            type: 'expire',
          },
        },
      ],
    }),
  }
);

// ECS Cluster
const ecsCluster = new aws.ecs.Cluster(`ecs-cluster-${environmentSuffix}`, {
  tags: {
    Name: `ecs-cluster-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// Application Load Balancer
const alb = new aws.lb.LoadBalancer(`alb-${environmentSuffix}`, {
  internal: false,
  loadBalancerType: 'application',
  securityGroups: [albSecurityGroup.id],
  subnets: publicSubnets.map(subnet => subnet.id),
  tags: {
    Name: `alb-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// ADDED: Two target groups for blue-green deployment
const targetGroup = new aws.lb.TargetGroup(`tg-blue-${environmentSuffix}`, {
  port: 8080,
  protocol: 'HTTP',
  vpcId: vpc.id,
  targetType: 'ip',
  healthCheck: {
    enabled: true,
    path: '/health',
    interval: 30,
    timeout: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 2,
  },
  tags: {
    Name: `tg-blue-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

const targetGroupGreen = new aws.lb.TargetGroup(
  `tg-green-${environmentSuffix}`,
  {
    port: 8080,
    protocol: 'HTTP',
    vpcId: vpc.id,
    targetType: 'ip',
    healthCheck: {
      enabled: true,
      path: '/health',
      interval: 30,
      timeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 2,
    },
    tags: {
      Name: `tg-green-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Production Listener
const albListener = new aws.lb.Listener(`alb-listener-${environmentSuffix}`, {
  loadBalancerArn: alb.arn,
  port: 80,
  protocol: 'HTTP',
  defaultActions: [
    {
      type: 'forward',
      targetGroupArn: targetGroup.arn,
    },
  ],
});

// Test Listener for blue-green deployment
const albListenerTest = new aws.lb.Listener(
  `alb-listener-test-${environmentSuffix}`,
  {
    loadBalancerArn: alb.arn,
    port: 8080,
    protocol: 'HTTP',
    defaultActions: [
      {
        type: 'forward',
        targetGroupArn: targetGroupGreen.arn,
      },
    ],
  }
);

// ECS Task Execution Role
const ecsTaskExecutionRole = new aws.iam.Role(
  `ecs-task-execution-role-${environmentSuffix}`,
  {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'ecs-tasks.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    tags: {
      Name: `ecs-task-execution-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

new aws.iam.RolePolicyAttachment(
  `ecs-task-execution-policy-${environmentSuffix}`,
  {
    role: ecsTaskExecutionRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
  }
);

// ECS Task Role
const ecsTaskRole = new aws.iam.Role(`ecs-task-role-${environmentSuffix}`, {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          Service: 'ecs-tasks.amazonaws.com',
        },
        Action: 'sts:AssumeRole',
      },
    ],
  }),
  tags: {
    Name: `ecs-task-role-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// ECS Task Definition - FIXED: Uses ECR repository
const taskDefinition = new aws.ecs.TaskDefinition(
  `task-def-${environmentSuffix}`,
  {
    family: `app-${environmentSuffix}`,
    cpu: '256',
    memory: '512',
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    executionRoleArn: ecsTaskExecutionRole.arn,
    taskRoleArn: ecsTaskRole.arn,
    containerDefinitions: pulumi.interpolate`[
        {
            "name": "app",
            "image": "${ecrRepository.repositoryUrl}:latest",
            "portMappings": [
                {
                    "containerPort": 8080,
                    "protocol": "tcp"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/app-${environmentSuffix}",
                    "awslogs-region": "${region}",
                    "awslogs-stream-prefix": "ecs"
                }
            }
        }
    ]`,
    tags: {
      Name: `task-def-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// CloudWatch Log Group for ECS
const _ecsLogGroup = new aws.cloudwatch.LogGroup(
  `ecs-log-group-${environmentSuffix}`,
  {
    name: `/ecs/app-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Name: `ecs-log-group-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// ADDED: CodeDeploy IAM Role
const codeDeployRole = new aws.iam.Role(
  `codedeploy-role-${environmentSuffix}`,
  {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'codedeploy.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    tags: {
      Name: `codedeploy-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

new aws.iam.RolePolicyAttachment(`codedeploy-policy-${environmentSuffix}`, {
  role: codeDeployRole.name,
  policyArn: 'arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS',
});

// ADDED: CodeDeploy Application
const codeDeployApp = new aws.codedeploy.Application(
  `codedeploy-app-${environmentSuffix}`,
  {
    name: `app-${environmentSuffix}`,
    computePlatform: 'ECS',
    tags: {
      Name: `codedeploy-app-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// FIXED: ECS Service with CODE_DEPLOY deployment controller
const ecsService = new aws.ecs.Service(
  `ecs-service-${environmentSuffix}`,
  {
    cluster: ecsCluster.arn,
    taskDefinition: taskDefinition.arn,
    desiredCount: 2,
    launchType: 'FARGATE',
    deploymentController: {
      type: 'CODE_DEPLOY',
    },
    networkConfiguration: {
      subnets: privateSubnets.map(subnet => subnet.id),
      securityGroups: [ecsSecurityGroup.id],
      assignPublicIp: false,
    },
    loadBalancers: [
      {
        targetGroupArn: targetGroup.arn,
        containerName: 'app',
        containerPort: 8080,
      },
    ],
    tags: {
      Name: `ecs-service-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  {
    dependsOn: [albListener, albListenerTest],
    ignoreChanges: ['taskDefinition', 'loadBalancers'],
  }
);

// ADDED: CodeDeploy Deployment Group
const codeDeployDeploymentGroup = new aws.codedeploy.DeploymentGroup(
  `codedeploy-dg-${environmentSuffix}`,
  {
    appName: codeDeployApp.name,
    deploymentGroupName: `dg-${environmentSuffix}`,
    serviceRoleArn: codeDeployRole.arn,
    deploymentConfigName: 'CodeDeployDefault.ECSAllAtOnce',
    ecsService: {
      clusterName: ecsCluster.name,
      serviceName: ecsService.name,
    },
    loadBalancerInfo: {
      targetGroupPairInfo: {
        prodTrafficRoute: {
          listenerArns: [albListener.arn],
        },
        testTrafficRoute: {
          listenerArns: [albListenerTest.arn],
        },
        targetGroups: [
          {
            name: targetGroup.name,
          },
          {
            name: targetGroupGreen.name,
          },
        ],
      },
    },
    blueGreenDeploymentConfig: {
      deploymentReadyOption: {
        actionOnTimeout: 'CONTINUE_DEPLOYMENT',
      },
      terminateBlueInstancesOnDeploymentSuccess: {
        action: 'TERMINATE',
        terminationWaitTimeInMinutes: 5,
      },
    },
    deploymentStyle: {
      deploymentOption: 'WITH_TRAFFIC_CONTROL',
      deploymentType: 'BLUE_GREEN',
    },
    autoRollbackConfiguration: {
      enabled: true,
      events: ['DEPLOYMENT_FAILURE'],
    },
    tags: {
      Name: `codedeploy-dg-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// ADDED: Route53 Hosted Zone
const hostedZone = new aws.route53.Zone(`zone-${environmentSuffix}`, {
  name: config.get('domainName') || `example-${environmentSuffix}.com`,
  comment: `Hosted zone for ${environmentSuffix} environment`,
  forceDestroy: true,
  tags: {
    Name: `zone-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// ADDED: Route53 Weighted Routing Policies
const weights = [
  { name: '0-percent', weight: 0 },
  { name: '25-percent', weight: 25 },
  { name: '50-percent', weight: 50 },
  { name: '75-percent', weight: 75 },
  { name: '100-percent', weight: 100 },
];

weights.forEach(weightConfig => {
  new aws.route53.Record(
    `weighted-record-${weightConfig.name}-${environmentSuffix}`,
    {
      zoneId: hostedZone.zoneId,
      name: pulumi.interpolate`app-${weightConfig.name}.${hostedZone.name}`,
      type: 'A',
      aliases: [
        {
          name: alb.dnsName,
          zoneId: alb.zoneId,
          evaluateTargetHealth: true,
        },
      ],
      setIdentifier: `${weightConfig.name}-${environmentSuffix}`,
      weightedRoutingPolicies: [
        {
          weight: weightConfig.weight,
        },
      ],
    }
  );
});

// DynamoDB Table
const dynamoTable = new aws.dynamodb.Table(
  `dynamo-table-${environmentSuffix}`,
  {
    attributes: [
      {
        name: 'id',
        type: 'S',
      },
    ],
    hashKey: 'id',
    billingMode: 'PAY_PER_REQUEST',
    tags: {
      Name: `dynamo-table-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// S3 Bucket
const s3Bucket = new aws.s3.Bucket(`app-bucket-${environmentSuffix}`, {
  forceDestroy: true,
  tags: {
    Name: `app-bucket-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// Lambda Execution Role
const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
        Action: 'sts:AssumeRole',
      },
    ],
  }),
  tags: {
    Name: `lambda-role-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

new aws.iam.RolePolicyAttachment(`lambda-basic-policy-${environmentSuffix}`, {
  role: lambdaRole.name,
  policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
});

// ADDED: Enhanced Lambda IAM Policy
const lambdaPolicy = new aws.iam.Policy(`lambda-policy-${environmentSuffix}`, {
  policy: dynamoTable.arn.apply(arn =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['rds:DescribeDBClusters', 'rds:DescribeDBInstances'],
          Resource: '*',
        },
        {
          Effect: 'Allow',
          Action: [
            'cloudwatch:PutMetricData',
            'cloudwatch:GetMetricStatistics',
          ],
          Resource: '*',
        },
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
          ],
          Resource: arn,
        },
        {
          Effect: 'Allow',
          Action: [
            'dms:DescribeReplicationTasks',
            'dms:DescribeReplicationInstances',
          ],
          Resource: '*',
        },
      ],
    })
  ),
  tags: {
    Name: `lambda-policy-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

new aws.iam.RolePolicyAttachment(`lambda-custom-policy-${environmentSuffix}`, {
  role: lambdaRole.name,
  policyArn: lambdaPolicy.arn,
});

// Lambda for Migration Validation
const validationLambda = new aws.lambda.Function(
  `validation-lambda-${environmentSuffix}`,
  {
    runtime: 'python3.11',
    handler: 'index.handler',
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
      'index.py': new pulumi.asset.StringAsset(`
import json
import boto3
import os

rds_client = boto3.client('rds')
dms_client = boto3.client('dms')

def handler(event, context):
    try:
        # Check RDS cluster status
        cluster_id = os.environ.get('CLUSTER_ID', '')
        if cluster_id:
            response = rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            cluster_status = response['DBClusters'][0]['Status']

            # Check DMS task status
            task_arn = os.environ.get('DMS_TASK_ARN', '')
            if task_arn:
                dms_response = dms_client.describe_replication_tasks(
                    Filters=[{'Name': 'replication-task-arn', 'Values': [task_arn]}]
                )
                task_status = dms_response['ReplicationTasks'][0]['Status']

                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Validation check passed',
                        'cluster_status': cluster_status,
                        'dms_task_status': task_status
                    })
                }

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Validation check passed'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
`),
    }),
    environment: {
      variables: {
        CLUSTER_ID: auroraCluster.id,
        DMS_TASK_ARN: dmsReplicationTask.replicationTaskArn,
      },
    },
    timeout: 30,
    memorySize: 256,
    tags: {
      Name: `validation-lambda-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Lambda for Health Check
const healthCheckLambda = new aws.lambda.Function(
  `health-lambda-${environmentSuffix}`,
  {
    runtime: 'python3.11',
    handler: 'index.handler',
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
      'index.py': new pulumi.asset.StringAsset(`
import json
import boto3
import os

cloudwatch = boto3.client('cloudwatch')
ecs_client = boto3.client('ecs')

def handler(event, context):
    try:
        # Check ECS service health
        cluster_name = os.environ.get('CLUSTER_NAME', '')
        service_name = os.environ.get('SERVICE_NAME', '')

        if cluster_name and service_name:
            response = ecs_client.describe_services(
                cluster=cluster_name,
                services=[service_name]
            )

            if response['services']:
                service = response['services'][0]
                running_count = service['runningCount']
                desired_count = service['desiredCount']

                # Put custom metric to CloudWatch
                cloudwatch.put_metric_data(
                    Namespace='ECS/HealthCheck',
                    MetricData=[
                        {
                            'MetricName': 'ServiceHealth',
                            'Value': 1.0 if running_count == desired_count else 0.0,
                            'Unit': 'None'
                        }
                    ]
                )

                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'message': 'Health check passed',
                        'running_count': running_count,
                        'desired_count': desired_count
                    })
                }

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Health check passed'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
`),
    }),
    environment: {
      variables: {
        CLUSTER_NAME: ecsCluster.name,
        SERVICE_NAME: ecsService.name,
      },
    },
    timeout: 30,
    memorySize: 256,
    tags: {
      Name: `health-lambda-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// CloudWatch Log Groups for Lambda
const _validationLambdaLogGroup = new aws.cloudwatch.LogGroup(
  `validation-lambda-log-${environmentSuffix}`,
  {
    name: pulumi.interpolate`/aws/lambda/${validationLambda.name}`,
    retentionInDays: 7,
    tags: {
      Name: `validation-lambda-log-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const _healthLambdaLogGroup = new aws.cloudwatch.LogGroup(
  `health-lambda-log-${environmentSuffix}`,
  {
    name: pulumi.interpolate`/aws/lambda/${healthCheckLambda.name}`,
    retentionInDays: 7,
    tags: {
      Name: `health-lambda-log-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// ADDED: CloudWatch Log Group for DMS
const dmsLogGroup = new aws.cloudwatch.LogGroup(
  `dms-log-group-${environmentSuffix}`,
  {
    name: `/aws/dms/${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Name: `dms-log-group-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const _dmsLogStream = new aws.cloudwatch.LogStream(
  `dms-log-stream-${environmentSuffix}`,
  {
    name: 'replication-task-logs',
    logGroupName: dmsLogGroup.name,
  }
);

// CloudWatch Alarms - ENHANCED with additional alarms
const _cpuAlarm = new aws.cloudwatch.MetricAlarm(
  `cpu-alarm-${environmentSuffix}`,
  {
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'CPUUtilization',
    namespace: 'AWS/ECS',
    period: 300,
    statistic: 'Average',
    threshold: 80,
    dimensions: {
      ClusterName: ecsCluster.name,
      ServiceName: ecsService.name,
    },
    alarmDescription: 'ECS CPU utilization too high',
    tags: {
      Name: `cpu-alarm-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const _memoryAlarm = new aws.cloudwatch.MetricAlarm(
  `memory-alarm-${environmentSuffix}`,
  {
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'MemoryUtilization',
    namespace: 'AWS/ECS',
    period: 300,
    statistic: 'Average',
    threshold: 80,
    dimensions: {
      ClusterName: ecsCluster.name,
      ServiceName: ecsService.name,
    },
    alarmDescription: 'ECS memory utilization too high',
    tags: {
      Name: `memory-alarm-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const _rdsCpuAlarm = new aws.cloudwatch.MetricAlarm(
  `rds-cpu-alarm-${environmentSuffix}`,
  {
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'CPUUtilization',
    namespace: 'AWS/RDS',
    period: 300,
    statistic: 'Average',
    threshold: 80,
    dimensions: {
      DBClusterIdentifier: auroraCluster.id,
    },
    alarmDescription: 'RDS CPU utilization too high',
    tags: {
      Name: `rds-cpu-alarm-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const _albUnhealthyAlarm = new aws.cloudwatch.MetricAlarm(
  `alb-unhealthy-alarm-${environmentSuffix}`,
  {
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'UnHealthyHostCount',
    namespace: 'AWS/ApplicationELB',
    period: 300,
    statistic: 'Average',
    threshold: 0,
    dimensions: {
      LoadBalancer: alb.arnSuffix,
      TargetGroup: targetGroup.arnSuffix,
    },
    alarmDescription: 'ALB has unhealthy targets',
    tags: {
      Name: `alb-unhealthy-alarm-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// ADDED: CloudWatch Dashboard
const _dashboard = new aws.cloudwatch.Dashboard(
  `dashboard-${environmentSuffix}`,
  {
    dashboardName: `migration-dashboard-${environmentSuffix}`,
    dashboardBody: pulumi
      .all([ecsCluster.name, ecsService.name, auroraCluster.id, alb.arnSuffix])
      .apply(([_clusterName, _serviceName, _clusterId, _albArn]) =>
        JSON.stringify({
          widgets: [
            {
              type: 'metric',
              x: 0,
              y: 0,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  ['AWS/ECS', 'CPUUtilization', { stat: 'Average' }],
                  ['.', 'MemoryUtilization', { stat: 'Average' }],
                ],
                period: 300,
                stat: 'Average',
                region: region,
                title: 'ECS Metrics',
                yAxis: {
                  left: {
                    min: 0,
                    max: 100,
                  },
                },
              },
            },
            {
              type: 'metric',
              x: 12,
              y: 0,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  ['AWS/RDS', 'DatabaseConnections', { stat: 'Average' }],
                  ['.', 'CPUUtilization', { stat: 'Average' }],
                ],
                period: 300,
                stat: 'Average',
                region: region,
                title: 'RDS Metrics',
              },
            },
            {
              type: 'metric',
              x: 0,
              y: 6,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  [
                    'AWS/ApplicationELB',
                    'TargetResponseTime',
                    { stat: 'Average' },
                  ],
                  ['.', 'RequestCount', { stat: 'Sum' }],
                  ['.', 'UnHealthyHostCount', { stat: 'Average' }],
                ],
                period: 300,
                stat: 'Average',
                region: region,
                title: 'ALB Metrics',
              },
            },
            {
              type: 'metric',
              x: 12,
              y: 6,
              width: 12,
              height: 6,
              properties: {
                metrics: [
                  [
                    'AWS/DMS',
                    'FullLoadThroughputRowsTarget',
                    { stat: 'Average' },
                  ],
                ],
                period: 300,
                stat: 'Average',
                region: region,
                title: 'DMS Metrics',
              },
            },
          ],
        })
      ),
  }
);

// ENHANCED: Comprehensive Exports
export const vpcId = vpc.id;
export const albDnsName = alb.dnsName;
export const albArn = alb.arn;
export const auroraEndpoint = auroraCluster.endpoint;
export const auroraClusterId = auroraCluster.id;
export const ecsClusterName = ecsCluster.name;
export const ecsClusterArn = ecsCluster.arn;
export const ecsServiceName = ecsService.name;
export const dynamoTableName = dynamoTable.name;
export const s3BucketName = s3Bucket.id;
export const targetGroupArn = targetGroup.arn;
export const targetGroupGreenArn = targetGroupGreen.arn;
export const ecrRepositoryUrl = ecrRepository.repositoryUrl;
export const ecrRepositoryName = ecrRepository.name;
export const route53ZoneId = hostedZone.zoneId;
export const route53ZoneName = hostedZone.name;
export const codeDeployAppName = codeDeployApp.name;
export const codeDeployDeploymentGroupName =
  codeDeployDeploymentGroup.deploymentGroupName;
export const validationLambdaArn = validationLambda.arn;
export const healthCheckLambdaArn = healthCheckLambda.arn;
export const dmsReplicationInstanceArn =
  dmsReplicationInstance.replicationInstanceArn;
export const dmsReplicationTaskArn = dmsReplicationTask.replicationTaskArn;
