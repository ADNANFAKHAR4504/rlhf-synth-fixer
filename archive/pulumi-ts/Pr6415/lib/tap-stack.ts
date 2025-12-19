import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly clusterArn: pulumi.Output<string>;
  public readonly ecrRepositories: pulumi.Output<string[]>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // VPC for ECS
    const vpc = new aws.ec2.Vpc(
      `ecs-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `ecs-vpc-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `ecs-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...tags, Name: `ecs-igw-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Public Subnets across 3 AZs
    const publicSubnet1 = new aws.ec2.Subnet(
      `ecs-public-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        mapPublicIpOnLaunch: true,
        tags: { ...tags, Name: `ecs-public-subnet-1-${environmentSuffix}` },
      },
      { parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `ecs-public-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-east-1b',
        mapPublicIpOnLaunch: true,
        tags: { ...tags, Name: `ecs-public-subnet-2-${environmentSuffix}` },
      },
      { parent: this }
    );

    const publicSubnet3 = new aws.ec2.Subnet(
      `ecs-public-subnet-3-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.3.0/24',
        availabilityZone: 'us-east-1c',
        mapPublicIpOnLaunch: true,
        tags: { ...tags, Name: `ecs-public-subnet-3-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Private Subnets across 3 AZs
    const privateSubnet1 = new aws.ec2.Subnet(
      `ecs-private-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: 'us-east-1a',
        tags: { ...tags, Name: `ecs-private-subnet-1-${environmentSuffix}` },
      },
      { parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `ecs-private-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.12.0/24',
        availabilityZone: 'us-east-1b',
        tags: { ...tags, Name: `ecs-private-subnet-2-${environmentSuffix}` },
      },
      { parent: this }
    );

    const privateSubnet3 = new aws.ec2.Subnet(
      `ecs-private-subnet-3-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.13.0/24',
        availabilityZone: 'us-east-1c',
        tags: { ...tags, Name: `ecs-private-subnet-3-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Elastic IPs for NAT Gateways
    const eip1 = new aws.ec2.Eip(
      `nat-eip-1-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: { ...tags, Name: `nat-eip-1-${environmentSuffix}` },
      },
      { parent: this, dependsOn: [internetGateway] }
    );

    const eip2 = new aws.ec2.Eip(
      `nat-eip-2-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: { ...tags, Name: `nat-eip-2-${environmentSuffix}` },
      },
      { parent: this, dependsOn: [internetGateway] }
    );

    const eip3 = new aws.ec2.Eip(
      `nat-eip-3-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: { ...tags, Name: `nat-eip-3-${environmentSuffix}` },
      },
      { parent: this, dependsOn: [internetGateway] }
    );

    // NAT Gateways in each public subnet
    const natGateway1 = new aws.ec2.NatGateway(
      `nat-gateway-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        allocationId: eip1.id,
        tags: { ...tags, Name: `nat-gateway-1-${environmentSuffix}` },
      },
      { parent: this }
    );

    const natGateway2 = new aws.ec2.NatGateway(
      `nat-gateway-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        allocationId: eip2.id,
        tags: { ...tags, Name: `nat-gateway-2-${environmentSuffix}` },
      },
      { parent: this }
    );

    const natGateway3 = new aws.ec2.NatGateway(
      `nat-gateway-3-${environmentSuffix}`,
      {
        subnetId: publicSubnet3.id,
        allocationId: eip3.id,
        tags: { ...tags, Name: `nat-gateway-3-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...tags, Name: `public-rt-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    new aws.ec2.RouteTableAssociation(
      `public-rta-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `public-rta-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `public-rta-3-${environmentSuffix}`,
      {
        subnetId: publicSubnet3.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    // Private Route Tables (one per AZ)
    const privateRouteTable1 = new aws.ec2.RouteTable(
      `private-rt-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...tags, Name: `private-rt-1-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `private-route-1-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable1.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway1.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-1-${environmentSuffix}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable1.id,
      },
      { parent: this }
    );

    const privateRouteTable2 = new aws.ec2.RouteTable(
      `private-rt-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...tags, Name: `private-rt-2-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `private-route-2-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable2.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway2.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-2-${environmentSuffix}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable2.id,
      },
      { parent: this }
    );

    const privateRouteTable3 = new aws.ec2.RouteTable(
      `private-rt-3-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...tags, Name: `private-rt-3-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `private-route-3-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable3.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway3.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-3-${environmentSuffix}`,
      {
        subnetId: privateSubnet3.id,
        routeTableId: privateRouteTable3.id,
      },
      { parent: this }
    );

    // ECR Repositories
    const frontendRepo = new aws.ecr.Repository(
      `frontend-repo-${environmentSuffix}`,
      {
        imageTagMutability: 'IMMUTABLE',
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        tags: { ...tags, Name: `frontend-repo-${environmentSuffix}` },
      },
      { parent: this }
    );

    // FIX 1: Added environmentSuffix to resource name
    const apiGatewayRepo = new aws.ecr.Repository(
      `api-gateway-repo-${environmentSuffix}`,
      {
        imageTagMutability: 'IMMUTABLE',
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        tags: { ...tags, Name: `api-gateway-repo-${environmentSuffix}` },
      },
      { parent: this }
    );

    const processingRepo = new aws.ecr.Repository(
      `processing-service-repo-${environmentSuffix}`,
      {
        imageTagMutability: 'IMMUTABLE',
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        tags: {
          ...tags,
          Name: `processing-service-repo-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ECR Lifecycle Policies
    new aws.ecr.LifecyclePolicy(
      `frontend-lifecycle-${environmentSuffix}`,
      {
        repository: frontendRepo.name,
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
      },
      { parent: this }
    );

    new aws.ecr.LifecyclePolicy(
      `api-lifecycle-${environmentSuffix}`,
      {
        repository: apiGatewayRepo.name,
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
      },
      { parent: this }
    );

    new aws.ecr.LifecyclePolicy(
      `processing-lifecycle-${environmentSuffix}`,
      {
        repository: processingRepo.name,
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
      },
      { parent: this }
    );

    // ECS Cluster
    const cluster = new aws.ecs.Cluster(
      `ecs-cluster-${environmentSuffix}`,
      {
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: { ...tags, Name: `ecs-cluster-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Capacity Providers
    const fargateCapacityProvider = new aws.ecs.ClusterCapacityProviders(
      `cluster-capacity-providers-${environmentSuffix}`,
      {
        clusterName: cluster.name,
        capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
        defaultCapacityProviderStrategies: [
          {
            capacityProvider: 'FARGATE',
            weight: 1,
            base: 1,
          },
          {
            capacityProvider: 'FARGATE_SPOT',
            weight: 3,
          },
        ],
      },
      { parent: this }
    );

    // CloudWatch Log Groups
    const frontendLogGroup = new aws.cloudwatch.LogGroup(
      `frontend-logs-${environmentSuffix}`,
      {
        retentionInDays: 30,
        tags: { ...tags, Name: `frontend-logs-${environmentSuffix}` },
      },
      { parent: this }
    );

    const apiLogGroup = new aws.cloudwatch.LogGroup(
      `api-gateway-logs-${environmentSuffix}`,
      {
        retentionInDays: 30,
        tags: { ...tags, Name: `api-gateway-logs-${environmentSuffix}` },
      },
      { parent: this }
    );

    const processingLogGroup = new aws.cloudwatch.LogGroup(
      `processing-service-logs-${environmentSuffix}`,
      {
        retentionInDays: 30,
        tags: {
          ...tags,
          Name: `processing-service-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Secrets Manager Secrets
    const dbSecret = new aws.secretsmanager.Secret(
      `db-credentials-${environmentSuffix}`,
      {
        description: 'Database connection credentials',
        tags: { ...tags, Name: `db-credentials-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `db-secret-version-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: 'changeme123',
          host: 'db.example.com',
          database: 'trading',
        }),
      },
      { parent: this }
    );

    const apiKeySecret = new aws.secretsmanager.Secret(
      `api-keys-${environmentSuffix}`,
      {
        description: 'Third-party API keys',
        tags: { ...tags, Name: `api-keys-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `api-key-version-${environmentSuffix}`,
      {
        secretId: apiKeySecret.id,
        secretString: JSON.stringify({
          marketDataApi: 'key-12345',
          paymentGateway: 'key-67890',
        }),
      },
      { parent: this }
    );

    const jwtSecret = new aws.secretsmanager.Secret(
      `jwt-signing-key-${environmentSuffix}`,
      {
        description: 'JWT signing key for authentication',
        tags: { ...tags, Name: `jwt-signing-key-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `jwt-secret-version-${environmentSuffix}`,
      {
        secretId: jwtSecret.id,
        secretString: JSON.stringify({
          signingKey: 'super-secret-key-change-in-production',
        }),
      },
      { parent: this }
    );

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
            description: 'Allow HTTP from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: { ...tags, Name: `alb-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // FIX 2: Added ingress security group rules for ECS tasks from ALB
    const ecsTaskSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-task-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3000,
            toPort: 3000,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow frontend traffic from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow API Gateway traffic from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 9090,
            toPort: 9090,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'Allow processing service traffic from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: { ...tags, Name: `ecs-task-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Task Execution Role (shared across all tasks)
    const taskExecutionRole = new aws.iam.Role(
      `ecs-task-execution-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `ecs-task-execution-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach AWS managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `ecs-task-execution-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Additional policy for Secrets Manager access
    new aws.iam.RolePolicy(
      `secrets-access-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.id,
        policy: pulumi
          .all([dbSecret.arn, apiKeySecret.arn, jwtSecret.arn])
          .apply(([dbArn, apiArn, jwtArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetSecretValue'],
                  Resource: [dbArn, apiArn, jwtArn],
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Frontend Task Role
    const frontendTaskRole = new aws.iam.Role(
      `frontend-task-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
        }),
        tags: { ...tags, Name: `frontend-task-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    // FIX 3: Changed to read-only S3 permissions (removed s3:*)
    new aws.iam.RolePolicy(
      `frontend-s3-policy-${environmentSuffix}`,
      {
        role: frontendTaskRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:ListBucket'],
              Resource: ['*'],
            },
          ],
        }),
      },
      { parent: this }
    );

    // API Gateway Task Role
    const apiGatewayTaskRole = new aws.iam.Role(
      `api-gateway-task-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
        }),
        tags: { ...tags, Name: `api-gateway-task-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `api-gateway-policy-${environmentSuffix}`,
      {
        role: apiGatewayTaskRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:GetItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'sqs:SendMessage',
                'sqs:ReceiveMessage',
                'sqs:DeleteMessage',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Processing Service Task Role
    const processingTaskRole = new aws.iam.Role(
      `processing-task-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            },
          ],
        }),
        tags: { ...tags, Name: `processing-task-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `processing-policy-${environmentSuffix}`,
      {
        role: processingTaskRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['dynamodb:*'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:PutObject', 's3:GetObject'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Cloud Map Namespace for Service Discovery
    const namespace = new aws.servicediscovery.PrivateDnsNamespace(
      `service-discovery-${environmentSuffix}`,
      {
        name: `trading.${environmentSuffix}.local`,
        vpc: vpc.id,
        description: 'Private DNS namespace for ECS service discovery',
        tags: { ...tags, Name: `service-discovery-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Task Definitions
    const frontendTaskDefinition = new aws.ecs.TaskDefinition(
      `frontend-task-${environmentSuffix}`,
      {
        family: `frontend-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512',
        memory: '1024',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: frontendTaskRole.arn,
        containerDefinitions: pulumi
          .all([
            frontendRepo.repositoryUrl,
            frontendLogGroup.name,
            dbSecret.arn,
            jwtSecret.arn,
          ])
          .apply(([repoUrl, logGroupName, _dbSecretArn, jwtSecretArn]) =>
            JSON.stringify([
              {
                name: 'frontend',
                image: `${repoUrl}:latest`,
                essential: true,
                portMappings: [
                  {
                    containerPort: 3000,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'NODE_ENV',
                    value: 'production',
                  },
                  {
                    name: 'API_GATEWAY_URL',
                    value: 'http://api-gateway.trading.dev.local:8080',
                  },
                ],
                secrets: [
                  {
                    name: 'JWT_SECRET',
                    valueFrom: `${jwtSecretArn}:signingKey::`,
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': 'us-east-1',
                    'awslogs-stream-prefix': 'frontend',
                  },
                },
              },
            ])
          ),
        tags: { ...tags, Name: `frontend-task-${environmentSuffix}` },
      },
      { parent: this }
    );

    const apiGatewayTaskDefinition = new aws.ecs.TaskDefinition(
      `api-gateway-task-${environmentSuffix}`,
      {
        family: `api-gateway-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '1024',
        memory: '2048',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: apiGatewayTaskRole.arn,
        containerDefinitions: pulumi
          .all([
            apiGatewayRepo.repositoryUrl,
            apiLogGroup.name,
            dbSecret.arn,
            apiKeySecret.arn,
          ])
          .apply(([repoUrl, logGroupName, dbSecretArn, apiSecretArn]) =>
            JSON.stringify([
              {
                name: 'api-gateway',
                image: `${repoUrl}:latest`,
                essential: true,
                portMappings: [
                  {
                    containerPort: 8080,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'NODE_ENV',
                    value: 'production',
                  },
                  {
                    name: 'PROCESSING_SERVICE_URL',
                    value: 'http://processing-service.trading.dev.local:9090',
                  },
                ],
                secrets: [
                  {
                    name: 'DB_CREDENTIALS',
                    valueFrom: dbSecretArn,
                  },
                  {
                    name: 'MARKET_DATA_API_KEY',
                    valueFrom: `${apiSecretArn}:marketDataApi::`,
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': 'us-east-1',
                    'awslogs-stream-prefix': 'api-gateway',
                  },
                },
              },
            ])
          ),
        tags: { ...tags, Name: `api-gateway-task-${environmentSuffix}` },
      },
      { parent: this }
    );

    // FIX 4: Corrected CPU/Memory to 2048/4096 for processing service
    const processingTaskDefinition = new aws.ecs.TaskDefinition(
      `processing-task-${environmentSuffix}`,
      {
        family: `processing-service-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '2048',
        memory: '4096',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: processingTaskRole.arn,
        containerDefinitions: pulumi
          .all([
            processingRepo.repositoryUrl,
            processingLogGroup.name,
            dbSecret.arn,
            apiKeySecret.arn,
          ])
          .apply(([repoUrl, logGroupName, dbSecretArn, apiSecretArn]) =>
            JSON.stringify([
              {
                name: 'processing-service',
                image: `${repoUrl}:latest`,
                essential: true,
                portMappings: [
                  {
                    containerPort: 9090,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'NODE_ENV',
                    value: 'production',
                  },
                ],
                secrets: [
                  {
                    name: 'DB_CREDENTIALS',
                    valueFrom: dbSecretArn,
                  },
                  {
                    name: 'PAYMENT_GATEWAY_KEY',
                    valueFrom: `${apiSecretArn}:paymentGateway::`,
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': 'us-east-1',
                    'awslogs-stream-prefix': 'processing',
                  },
                },
              },
            ])
          ),
        tags: { ...tags, Name: `processing-task-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `ecs-alb-${environmentSuffix}`,
      {
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: [publicSubnet1.id, publicSubnet2.id, publicSubnet3.id],
        tags: { ...tags, Name: `ecs-alb-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Target Group for Frontend
    const frontendTargetGroup = new aws.lb.TargetGroup(
      `fe-tg-${environmentSuffix}`,
      {
        port: 3000,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        tags: { ...tags, Name: `fe-tg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // FIX 5: Added target group for API Gateway service
    const apiGatewayTargetGroup = new aws.lb.TargetGroup(
      `api-tg-${environmentSuffix}`,
      {
        port: 8080,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        tags: { ...tags, Name: `api-tg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ALB Listener
    const albListener = new aws.lb.Listener(
      `alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: frontendTargetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // ALB Listener Rule for API Gateway
    new aws.lb.ListenerRule(
      `api-gateway-listener-rule-${environmentSuffix}`,
      {
        listenerArn: albListener.arn,
        priority: 100,
        actions: [
          {
            type: 'forward',
            targetGroupArn: apiGatewayTargetGroup.arn,
          },
        ],
        conditions: [
          {
            pathPattern: {
              values: ['/api/*'],
            },
          },
        ],
      },
      { parent: this }
    );

    // Service Discovery Services
    const frontendDiscoveryService = new aws.servicediscovery.Service(
      `frontend-discovery-${environmentSuffix}`,
      {
        name: 'frontend',
        dnsConfig: {
          namespaceId: namespace.id,
          dnsRecords: [
            {
              ttl: 10,
              type: 'A',
            },
          ],
          routingPolicy: 'MULTIVALUE',
        },
        healthCheckCustomConfig: {
          failureThreshold: 1,
        },
        tags: { ...tags, Name: `frontend-discovery-${environmentSuffix}` },
      },
      { parent: this }
    );

    const apiDiscoveryService = new aws.servicediscovery.Service(
      `api-gateway-discovery-${environmentSuffix}`,
      {
        name: 'api-gateway',
        dnsConfig: {
          namespaceId: namespace.id,
          dnsRecords: [
            {
              ttl: 10,
              type: 'A',
            },
          ],
          routingPolicy: 'MULTIVALUE',
        },
        healthCheckCustomConfig: {
          failureThreshold: 1,
        },
        tags: { ...tags, Name: `api-gateway-discovery-${environmentSuffix}` },
      },
      { parent: this }
    );

    const processingDiscoveryService = new aws.servicediscovery.Service(
      `processing-discovery-${environmentSuffix}`,
      {
        name: 'processing-service',
        dnsConfig: {
          namespaceId: namespace.id,
          dnsRecords: [
            {
              ttl: 10,
              type: 'A',
            },
          ],
          routingPolicy: 'MULTIVALUE',
        },
        healthCheckCustomConfig: {
          failureThreshold: 1,
        },
        tags: { ...tags, Name: `processing-discovery-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ECS Services
    const frontendService = new aws.ecs.Service(
      `frontend-service-${environmentSuffix}`,
      {
        cluster: cluster.arn,
        taskDefinition: frontendTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: [privateSubnet1.id, privateSubnet2.id, privateSubnet3.id],
          securityGroups: [ecsTaskSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: frontendTargetGroup.arn,
            containerName: 'frontend',
            containerPort: 3000,
          },
        ],
        serviceRegistries: {
          registryArn: frontendDiscoveryService.arn,
        },
        healthCheckGracePeriodSeconds: 60,
        tags: { ...tags, Name: `frontend-service-${environmentSuffix}` },
      },
      {
        parent: this,
        dependsOn: [
          albListener,
          fargateCapacityProvider,
          frontendDiscoveryService,
        ],
      }
    );

    // Frontend Auto Scaling
    const frontendScalingTarget = new aws.appautoscaling.Target(
      `frontend-scaling-target-${environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 2,
        resourceId: pulumi.interpolate`service/${cluster.name}/${frontendService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    new aws.appautoscaling.Policy(
      `frontend-scaling-policy-${environmentSuffix}`,
      {
        policyType: 'TargetTrackingScaling',
        resourceId: frontendScalingTarget.resourceId,
        scalableDimension: frontendScalingTarget.scalableDimension,
        serviceNamespace: frontendScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // API Gateway Service (with load balancer attachment)
    const apiGatewayService = new aws.ecs.Service(
      `api-gateway-service-${environmentSuffix}`,
      {
        cluster: cluster.arn,
        taskDefinition: apiGatewayTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: [privateSubnet1.id, privateSubnet2.id, privateSubnet3.id],
          securityGroups: [ecsTaskSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: apiGatewayTargetGroup.arn,
            containerName: 'api-gateway',
            containerPort: 8080,
          },
        ],
        serviceRegistries: {
          registryArn: apiDiscoveryService.arn,
        },
        healthCheckGracePeriodSeconds: 60,
        tags: { ...tags, Name: `api-gateway-service-${environmentSuffix}` },
      },
      {
        parent: this,
        dependsOn: [albListener, fargateCapacityProvider, apiDiscoveryService],
      }
    );

    // API Gateway Auto Scaling
    const apiScalingTarget = new aws.appautoscaling.Target(
      `api-scaling-target-${environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 2,
        resourceId: pulumi.interpolate`service/${cluster.name}/${apiGatewayService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    new aws.appautoscaling.Policy(
      `api-scaling-policy-${environmentSuffix}`,
      {
        policyType: 'TargetTrackingScaling',
        resourceId: apiScalingTarget.resourceId,
        scalableDimension: apiScalingTarget.scalableDimension,
        serviceNamespace: apiScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // Processing Service
    const processingService = new aws.ecs.Service(
      `processing-service-${environmentSuffix}`,
      {
        cluster: cluster.arn,
        taskDefinition: processingTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: [privateSubnet1.id, privateSubnet2.id, privateSubnet3.id],
          securityGroups: [ecsTaskSecurityGroup.id],
          assignPublicIp: false,
        },
        serviceRegistries: {
          registryArn: processingDiscoveryService.arn,
        },
        tags: { ...tags, Name: `processing-service-${environmentSuffix}` },
      },
      {
        parent: this,
        dependsOn: [fargateCapacityProvider, processingDiscoveryService],
      }
    );

    // Processing Service Auto Scaling
    const processingScalingTarget = new aws.appautoscaling.Target(
      `processing-scaling-target-${environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 2,
        resourceId: pulumi.interpolate`service/${cluster.name}/${processingService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    new aws.appautoscaling.Policy(
      `processing-scaling-policy-${environmentSuffix}`,
      {
        policyType: 'TargetTrackingScaling',
        resourceId: processingScalingTarget.resourceId,
        scalableDimension: processingScalingTarget.scalableDimension,
        serviceNamespace: processingScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70.0,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // Exports
    this.albDnsName = alb.dnsName;
    this.clusterArn = cluster.arn;
    this.ecrRepositories = pulumi.all([
      frontendRepo.repositoryUrl,
      apiGatewayRepo.repositoryUrl,
      processingRepo.repositoryUrl,
    ]);

    this.registerOutputs({
      albDnsName: this.albDnsName,
      clusterArn: this.clusterArn,
      ecrRepositories: this.ecrRepositories,
      frontendServiceArn: frontendService.id,
      apiGatewayServiceArn: apiGatewayService.id,
      processingServiceArn: processingService.id,
      namespaceId: namespace.id,
    });
  }
}
