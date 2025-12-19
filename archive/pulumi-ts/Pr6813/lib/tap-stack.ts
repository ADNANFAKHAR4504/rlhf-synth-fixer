/**
 * tap-stack.ts
 *
 * Complete ECS Fargate multi-service containerized platform implementation.
 * Implements all 12 core infrastructure requirements for production-grade deployment.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly clusterName: pulumi.Output<string>;
  public readonly clusterArn: pulumi.Output<string>;
  public readonly frontendServiceArn: pulumi.Output<string>;
  public readonly apiGatewayServiceArn: pulumi.Output<string>;
  public readonly processingServiceArn: pulumi.Output<string>;
  public readonly frontendEcrUrl: pulumi.Output<string>;
  public readonly apiGatewayEcrUrl: pulumi.Output<string>;
  public readonly processingServiceEcrUrl: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get 3 availability zones
    const availabilityZones = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // 1. VPC with 3 AZs
    const vpc = new aws.ec2.Vpc(
      `tap-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `tap-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `tap-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `tap-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Public Subnets (3 AZs)
    const publicSubnets = [0, 1, 2].map(i => {
      return new aws.ec2.Subnet(
        `tap-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: availabilityZones.names[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `tap-public-subnet-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });

    // Private Subnets (3 AZs)
    const privateSubnets = [0, 1, 2].map(i => {
      return new aws.ec2.Subnet(
        `tap-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${10 + i}.0/24`,
          availabilityZone: availabilityZones.names[i],
          mapPublicIpOnLaunch: false,
          tags: {
            ...tags,
            Name: `tap-private-subnet-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });

    // Elastic IPs for NAT Gateways
    const eips = [0, 1, 2].map(i => {
      return new aws.ec2.Eip(
        `tap-eip-${i}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...tags,
            Name: `tap-eip-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });

    // NAT Gateways (3 AZs)
    const natGateways = [0, 1, 2].map(i => {
      return new aws.ec2.NatGateway(
        `tap-nat-${i}-${environmentSuffix}`,
        {
          subnetId: publicSubnets[i].id,
          allocationId: eips[i].id,
          tags: {
            ...tags,
            Name: `tap-nat-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `tap-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
          },
        ],
        tags: {
          ...tags,
          Name: `tap-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `tap-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Private Route Tables (one per AZ)
    [0, 1, 2].map(i => {
      const routeTable = new aws.ec2.RouteTable(
        `tap-private-rt-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          routes: [
            {
              cidrBlock: '0.0.0.0/0',
              natGatewayId: natGateways[i].id,
            },
          ],
          tags: {
            ...tags,
            Name: `tap-private-rt-${i}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `tap-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: privateSubnets[i].id,
          routeTableId: routeTable.id,
        },
        { parent: this }
      );

      return routeTable;
    });

    // 2. ECR Repositories
    const repositories = ['frontend', 'api-gateway', 'processing-service'].map(
      serviceName => {
        return new aws.ecr.Repository(
          `tap-ecr-${serviceName}-${environmentSuffix}`,
          {
            name: `tap-${serviceName}-${environmentSuffix}`,
            imageTagMutability: 'IMMUTABLE',
            imageScanningConfiguration: {
              scanOnPush: true,
            },
            tags: {
              ...tags,
              Name: `tap-ecr-${serviceName}-${environmentSuffix}`,
            },
          },
          { parent: this }
        );
      }
    );

    // ECR Lifecycle Policies
    repositories.forEach((repo, i) => {
      const serviceNames = ['frontend', 'api-gateway', 'processing-service'];
      new aws.ecr.LifecyclePolicy(
        `tap-ecr-lifecycle-${serviceNames[i]}-${environmentSuffix}`,
        {
          repository: repo.name,
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
    });

    // 3. ECS Cluster with Capacity Providers
    const cluster = new aws.ecs.Cluster(
      `tap-cluster-${environmentSuffix}`,
      {
        name: `tap-cluster-${environmentSuffix}`,
        tags: {
          ...tags,
          Name: `tap-cluster-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.ecs.ClusterCapacityProviders(
      `tap-cluster-capacity-${environmentSuffix}`,
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
            weight: 4,
          },
        ],
      },
      { parent: this }
    );

    // 7. IAM Roles - Task Execution Role
    const taskExecutionRole = new aws.iam.Role(
      `tap-task-execution-role-${environmentSuffix}`,
      {
        name: `tap-task-execution-${environmentSuffix}`,
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
          ...tags,
          Name: `tap-task-execution-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `tap-task-execution-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Additional permissions for Secrets Manager
    new aws.iam.RolePolicy(
      `tap-task-execution-secrets-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['ecr:GetAuthorizationToken'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Task Roles for each service
    const frontendTaskRole = new aws.iam.Role(
      `tap-frontend-task-role-${environmentSuffix}`,
      {
        name: `tap-frontend-task-${environmentSuffix}`,
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
          ...tags,
          Name: `tap-frontend-task-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `tap-frontend-task-policy-${environmentSuffix}`,
      {
        role: frontendTaskRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    const apiGatewayTaskRole = new aws.iam.Role(
      `tap-api-gateway-task-role-${environmentSuffix}`,
      {
        name: `tap-api-gateway-task-${environmentSuffix}`,
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
          ...tags,
          Name: `tap-api-gateway-task-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `tap-api-gateway-task-policy-${environmentSuffix}`,
      {
        role: apiGatewayTaskRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['servicediscovery:DiscoverInstances'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    const processingTaskRole = new aws.iam.Role(
      `tap-processing-task-role-${environmentSuffix}`,
      {
        name: `tap-processing-task-${environmentSuffix}`,
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
          ...tags,
          Name: `tap-processing-task-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `tap-processing-task-policy-${environmentSuffix}`,
      {
        role: processingTaskRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:PutObject', 's3:GetObject', 's3:ListBucket'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // 8. CloudWatch Log Groups
    const logGroups = ['frontend', 'api-gateway', 'processing-service'].map(
      serviceName => {
        return new aws.cloudwatch.LogGroup(
          `tap-logs-${serviceName}-${environmentSuffix}`,
          {
            name: `/ecs/tap-${serviceName}-${environmentSuffix}`,
            retentionInDays: 30,
            tags: {
              ...tags,
              Name: `tap-logs-${serviceName}-${environmentSuffix}`,
            },
          },
          { parent: this }
        );
      }
    );

    // 9. Secrets Manager Secrets
    const dbSecret = new aws.secretsmanager.Secret(
      `tap-db-secret-${environmentSuffix}`,
      {
        name: `tap-db-credentials-${environmentSuffix}`,
        description: 'Database credentials for trading application',
        tags: {
          ...tags,
          Name: `tap-db-secret-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `tap-db-secret-version-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: 'changeme123',
          engine: 'postgres',
          host: 'localhost',
          port: 5432,
          dbname: 'trading',
        }),
      },
      { parent: this }
    );

    const apiKeySecret = new aws.secretsmanager.Secret(
      `tap-api-key-secret-${environmentSuffix}`,
      {
        name: `tap-api-keys-${environmentSuffix}`,
        description: 'API keys for external services',
        tags: {
          ...tags,
          Name: `tap-api-key-secret-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `tap-api-key-secret-version-${environmentSuffix}`,
      {
        secretId: apiKeySecret.id,
        secretString: JSON.stringify({
          marketDataApiKey: 'sample-key-123',
          tradingPlatformApiKey: 'sample-key-456',
        }),
      },
      { parent: this }
    );

    // 10. Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-alb-sg-${environmentSuffix}`,
      {
        name: `tap-alb-sg-${environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        vpcId: vpc.id,
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
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `tap-alb-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const frontendSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-frontend-sg-${environmentSuffix}`,
      {
        name: `tap-frontend-sg-${environmentSuffix}`,
        description: 'Security group for frontend containers',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3000,
            toPort: 3000,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `tap-frontend-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const apiGatewaySecurityGroup = new aws.ec2.SecurityGroup(
      `tap-api-gateway-sg-${environmentSuffix}`,
      {
        name: `tap-api-gateway-sg-${environmentSuffix}`,
        description: 'Security group for API gateway containers',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `tap-api-gateway-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const processingSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-processing-sg-${environmentSuffix}`,
      {
        name: `tap-processing-sg-${environmentSuffix}`,
        description: 'Security group for processing service containers',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 9000,
            toPort: 9000,
            securityGroups: [apiGatewaySecurityGroup.id],
            description: 'Allow traffic from API gateway',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `tap-processing-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // 5. Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `tap-alb-${environmentSuffix}`,
      {
        name: `tap-alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnets.map(s => s.id),
        enableCrossZoneLoadBalancing: true,
        tags: {
          ...tags,
          Name: `tap-alb-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Target Groups
    const frontendTargetGroup = new aws.lb.TargetGroup(
      `tap-frontend-tg-${environmentSuffix}`,
      {
        name: `tap-frontend-tg-${environmentSuffix}`,
        port: 3000,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        deregistrationDelay: 30,
        tags: {
          ...tags,
          Name: `tap-frontend-tg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const apiGatewayTargetGroup = new aws.lb.TargetGroup(
      `tap-api-gateway-tg-${environmentSuffix}`,
      {
        name: `tap-api-gw-tg-${environmentSuffix}`,
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
        deregistrationDelay: 30,
        tags: {
          ...tags,
          Name: `tap-api-gateway-tg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ALB Listeners
    const httpListener = new aws.lb.Listener(
      `tap-alb-listener-${environmentSuffix}`,
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
        tags: {
          ...tags,
          Name: `tap-alb-listener-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.lb.ListenerRule(
      `tap-api-listener-rule-${environmentSuffix}`,
      {
        listenerArn: httpListener.arn,
        priority: 100,
        conditions: [
          {
            pathPattern: {
              values: ['/api/*'],
            },
          },
        ],
        actions: [
          {
            type: 'forward',
            targetGroupArn: apiGatewayTargetGroup.arn,
          },
        ],
        tags: {
          ...tags,
          Name: `tap-api-listener-rule-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // 6. Service Discovery
    const serviceDiscoveryNamespace =
      new aws.servicediscovery.PrivateDnsNamespace(
        `tap-sd-namespace-${environmentSuffix}`,
        {
          name: `tap-${environmentSuffix}.local`,
          description: 'Service discovery namespace for TAP services',
          vpc: vpc.id,
          tags: {
            ...tags,
            Name: `tap-sd-namespace-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

    const processingServiceDiscovery = new aws.servicediscovery.Service(
      `tap-processing-sd-${environmentSuffix}`,
      {
        name: 'processing-service',
        dnsConfig: {
          namespaceId: serviceDiscoveryNamespace.id,
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
        tags: {
          ...tags,
          Name: `tap-processing-sd-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // 4. Task Definitions
    const frontendTaskDefinition = new aws.ecs.TaskDefinition(
      `tap-frontend-task-${environmentSuffix}`,
      {
        family: `tap-frontend-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512',
        memory: '1024',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: frontendTaskRole.arn,
        containerDefinitions: pulumi
          .all([repositories[0].repositoryUrl, alb.dnsName, logGroups[0].name])
          .apply(([repoUrl, albDns, logGroup]) =>
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
                    name: 'API_ENDPOINT',
                    value: `http://${albDns}/api`,
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroup,
                    'awslogs-region': aws.config.region!,
                    'awslogs-stream-prefix': 'frontend',
                  },
                },
              },
            ])
          ),
        tags: {
          ...tags,
          Name: `tap-frontend-task-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const apiGatewayTaskDefinition = new aws.ecs.TaskDefinition(
      `tap-api-gateway-task-${environmentSuffix}`,
      {
        family: `tap-api-gateway-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '1024',
        memory: '2048',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: apiGatewayTaskRole.arn,
        containerDefinitions: pulumi
          .all([
            repositories[1].repositoryUrl,
            logGroups[1].name,
            dbSecret.arn,
            apiKeySecret.arn,
          ])
          .apply(([repoUrl, logGroup, dbSecretArn, apiSecretArn]) =>
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
                    value: `http://processing-service.tap-${environmentSuffix}.local:9000`,
                  },
                ],
                secrets: [
                  {
                    name: 'DB_CREDENTIALS',
                    valueFrom: dbSecretArn,
                  },
                  {
                    name: 'API_KEYS',
                    valueFrom: apiSecretArn,
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroup,
                    'awslogs-region': aws.config.region!,
                    'awslogs-stream-prefix': 'api-gateway',
                  },
                },
              },
            ])
          ),
        tags: {
          ...tags,
          Name: `tap-api-gateway-task-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const processingTaskDefinition = new aws.ecs.TaskDefinition(
      `tap-processing-task-${environmentSuffix}`,
      {
        family: `tap-processing-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '2048',
        memory: '4096',
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: processingTaskRole.arn,
        containerDefinitions: pulumi
          .all([repositories[2].repositoryUrl, logGroups[2].name, dbSecret.arn])
          .apply(([repoUrl, logGroup, dbSecretArn]) =>
            JSON.stringify([
              {
                name: 'processing-service',
                image: `${repoUrl}:latest`,
                essential: true,
                portMappings: [
                  {
                    containerPort: 9000,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'NODE_ENV',
                    value: 'production',
                  },
                  {
                    name: 'WORKER_THREADS',
                    value: '4',
                  },
                ],
                secrets: [
                  {
                    name: 'DB_CREDENTIALS',
                    valueFrom: dbSecretArn,
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroup,
                    'awslogs-region': aws.config.region!,
                    'awslogs-stream-prefix': 'processing',
                  },
                },
              },
            ])
          ),
        tags: {
          ...tags,
          Name: `tap-processing-task-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ECS Services
    const frontendService = new aws.ecs.Service(
      `tap-frontend-service-${environmentSuffix}`,
      {
        name: `tap-frontend-${environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: frontendTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: privateSubnets.map(s => s.id),
          securityGroups: [frontendSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: frontendTargetGroup.arn,
            containerName: 'frontend',
            containerPort: 3000,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          ...tags,
          Name: `tap-frontend-service-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [httpListener] }
    );

    const apiGatewayService = new aws.ecs.Service(
      `tap-api-gateway-service-${environmentSuffix}`,
      {
        name: `tap-api-gateway-${environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: apiGatewayTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: privateSubnets.map(s => s.id),
          securityGroups: [apiGatewaySecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: apiGatewayTargetGroup.arn,
            containerName: 'api-gateway',
            containerPort: 8080,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: {
          ...tags,
          Name: `tap-api-gateway-service-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [httpListener] }
    );

    const processingService = new aws.ecs.Service(
      `tap-processing-service-${environmentSuffix}`,
      {
        name: `tap-processing-${environmentSuffix}`,
        cluster: cluster.arn,
        taskDefinition: processingTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: privateSubnets.map(s => s.id),
          securityGroups: [processingSecurityGroup.id],
          assignPublicIp: false,
        },
        serviceRegistries: {
          registryArn: processingServiceDiscovery.arn,
        },
        healthCheckGracePeriodSeconds: 60,
        tags: {
          ...tags,
          Name: `tap-processing-service-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Auto-scaling for all services
    const frontendTarget = new aws.appautoscaling.Target(
      `tap-frontend-autoscaling-target-${environmentSuffix}`,
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
      `tap-frontend-autoscaling-policy-${environmentSuffix}`,
      {
        name: `tap-frontend-cpu-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: frontendTarget.resourceId,
        scalableDimension: frontendTarget.scalableDimension,
        serviceNamespace: frontendTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70,
          scaleInCooldown: 60,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    const apiGatewayTarget = new aws.appautoscaling.Target(
      `tap-api-gateway-autoscaling-target-${environmentSuffix}`,
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
      `tap-api-gateway-autoscaling-policy-${environmentSuffix}`,
      {
        name: `tap-api-gateway-cpu-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: apiGatewayTarget.resourceId,
        scalableDimension: apiGatewayTarget.scalableDimension,
        serviceNamespace: apiGatewayTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70,
          scaleInCooldown: 60,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    const processingTarget = new aws.appautoscaling.Target(
      `tap-processing-autoscaling-target-${environmentSuffix}`,
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
      `tap-processing-autoscaling-policy-${environmentSuffix}`,
      {
        name: `tap-processing-cpu-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: processingTarget.resourceId,
        scalableDimension: processingTarget.scalableDimension,
        serviceNamespace: processingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70,
          scaleInCooldown: 60,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // Expose outputs
    this.vpcId = vpc.id;
    this.albDnsName = alb.dnsName;
    this.clusterName = cluster.name;
    this.clusterArn = cluster.arn;
    this.frontendServiceArn = frontendService.id;
    this.apiGatewayServiceArn = apiGatewayService.id;
    this.processingServiceArn = processingService.id;
    this.frontendEcrUrl = repositories[0].repositoryUrl;
    this.apiGatewayEcrUrl = repositories[1].repositoryUrl;
    this.processingServiceEcrUrl = repositories[2].repositoryUrl;
    this.publicSubnetIds = pulumi.all(publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.all(privateSubnets.map(s => s.id));

    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      clusterName: this.clusterName,
      clusterArn: this.clusterArn,
      frontendServiceArn: this.frontendServiceArn,
      apiGatewayServiceArn: this.apiGatewayServiceArn,
      processingServiceArn: this.processingServiceArn,
      frontendEcrUrl: this.frontendEcrUrl,
      apiGatewayEcrUrl: this.apiGatewayEcrUrl,
      processingServiceEcrUrl: this.processingServiceEcrUrl,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
