import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly ecsClusterName: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly apiGatewayServiceName: pulumi.Output<string>;
  public readonly paymentProcessorServiceName: pulumi.Output<string>;
  public readonly fraudDetectorServiceName: pulumi.Output<string>;
  public readonly serviceDiscoveryNamespace: pulumi.Output<string>;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:stack:TapStack', name, {}, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get availability zones and current caller identity
    const availableAZs = aws.getAvailabilityZones({
      state: 'available',
    });

    const current = aws.getCallerIdentity({});

    // VPC
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `payment-vpc-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `payment-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...tags, Name: `payment-igw-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Public Subnets (3 AZs)
    const publicSubnets = [0, 1, 2].map(
      i =>
        new aws.ec2.Subnet(
          `payment-public-subnet-${i}-${environmentSuffix}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${i}.0/24`,
            availabilityZone: availableAZs.then(azs => azs.names[i]),
            mapPublicIpOnLaunch: true,
            tags: {
              ...tags,
              Name: `payment-public-subnet-${i}-${environmentSuffix}`,
            },
          },
          { parent: this }
        )
    );

    // Private Subnets (3 AZs)
    const privateSubnets = [0, 1, 2].map(
      i =>
        new aws.ec2.Subnet(
          `payment-private-subnet-${i}-${environmentSuffix}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${i + 10}.0/24`,
            availabilityZone: availableAZs.then(azs => azs.names[i]),
            tags: {
              ...tags,
              Name: `payment-private-subnet-${i}-${environmentSuffix}`,
            },
          },
          { parent: this }
        )
    );

    // Elastic IP for NAT Gateway (1 for cost optimization)
    const eip = new aws.ec2.Eip(
      `payment-nat-eip-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: { ...tags, Name: `payment-nat-eip-${environmentSuffix}` },
      },
      { parent: this }
    );

    // NAT Gateway (1 for cost optimization)
    const natGateway = new aws.ec2.NatGateway(
      `payment-nat-${environmentSuffix}`,
      {
        allocationId: eip.id,
        subnetId: publicSubnets[0].id,
        tags: { ...tags, Name: `payment-nat-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...tags, Name: `payment-public-rt-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `payment-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `payment-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Private Route Table
    const privateRouteTable = new aws.ec2.RouteTable(
      `payment-private-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...tags, Name: `payment-private-rt-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `payment-private-route-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      },
      { parent: this }
    );

    // Associate private subnets with private route table
    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `payment-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // CloudWatch Log KMS Key
    const logKmsKey = new aws.kms.Key(
      `payment-log-kms-${environmentSuffix}`,
      {
        description: `KMS key for CloudWatch Logs encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        policy: current.then(c =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: { AWS: `arn:aws:iam::${c.accountId}:root` },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow CloudWatch Logs',
                Effect: 'Allow',
                Principal: { Service: 'logs.us-east-1.amazonaws.com' },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:CreateGrant',
                  'kms:DescribeKey',
                ],
                Resource: '*',
                Condition: {
                  ArnLike: {
                    'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:us-east-1:${c.accountId}:log-group:*`,
                  },
                },
              },
            ],
          })
        ),
        tags: { ...tags, Name: `payment-log-kms-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `payment-log-kms-alias-${environmentSuffix}`,
      {
        name: `alias/payment-logs-${environmentSuffix}`,
        targetKeyId: logKmsKey.id,
      },
      { parent: this }
    );

    // CloudWatch Log Groups
    const services = ['api-gateway', 'payment-processor', 'fraud-detector'];
    const logGroups = services.map(
      service =>
        new aws.cloudwatch.LogGroup(
          `payment-${service}-logs-${environmentSuffix}`,
          {
            name: `/ecs/payment-${service}-${environmentSuffix}`,
            retentionInDays: 30,
            kmsKeyId: logKmsKey.arn,
            tags: {
              ...tags,
              Name: `payment-${service}-logs-${environmentSuffix}`,
            },
          },
          { parent: this }
        )
    );

    // ECR Repositories
    services.map(service => {
      const repo = new aws.ecr.Repository(
        `payment-${service}-ecr-${environmentSuffix}`,
        {
          name: `payment-${service}-${environmentSuffix}`,
          imageScanningConfiguration: {
            scanOnPush: true,
          },
          imageTagMutability: 'MUTABLE',
          tags: {
            ...tags,
            Name: `payment-${service}-ecr-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.ecr.LifecyclePolicy(
        `payment-${service}-ecr-lifecycle-${environmentSuffix}`,
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

      return repo;
    });

    // ECS Cluster
    const ecsCluster = new aws.ecs.Cluster(
      `payment-cluster-${environmentSuffix}`,
      {
        name: `payment-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: { ...tags, Name: `payment-cluster-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Service Discovery Namespace
    const serviceDiscovery = new aws.servicediscovery.PrivateDnsNamespace(
      `payment-sd-${environmentSuffix}`,
      {
        name: 'payment.local',
        vpc: vpc.id,
        description: 'Service discovery for payment processing microservices',
        tags: { ...tags, Name: `payment-sd-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Secrets Manager
    const dbSecret = new aws.secretsmanager.Secret(
      `payment-db-secret-${environmentSuffix}`,
      {
        name: `payment-db-credentials-${environmentSuffix}`,
        description: 'Database connection string for payment processing',
        tags: { ...tags, Name: `payment-db-secret-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `payment-db-secret-version-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'payment_user',
          password: 'change-me-after-deployment',
          host: 'database.payment.local',
          port: 5432,
          database: 'payments',
        }),
      },
      { parent: this }
    );

    const apiSecret = new aws.secretsmanager.Secret(
      `payment-api-secret-${environmentSuffix}`,
      {
        name: `payment-api-keys-${environmentSuffix}`,
        description: 'Third-party API keys for payment processing',
        tags: { ...tags, Name: `payment-api-secret-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `payment-api-secret-version-${environmentSuffix}`,
      {
        secretId: apiSecret.id,
        secretString: JSON.stringify({
          stripe_api_key: 'sk_test_changeme',
          fraud_detection_key: 'fd_api_changeme',
        }),
      },
      { parent: this }
    );

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-alb-sg-${environmentSuffix}`,
      {
        name: `payment-alb-sg-${environmentSuffix}`,
        description: 'Security group for payment processing ALB',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from internet',
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
        tags: { ...tags, Name: `payment-alb-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-ecs-sg-${environmentSuffix}`,
      {
        name: `payment-ecs-sg-${environmentSuffix}`,
        description: 'Security group for payment processing ECS tasks',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow traffic from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            self: true,
            description: 'Allow inter-service communication',
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
        tags: { ...tags, Name: `payment-ecs-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `payment-alb-${environmentSuffix}`,
      {
        name: `payment-alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnets.map(s => s.id),
        enableDeletionProtection: false,
        tags: { ...tags, Name: `payment-alb-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Target Group
    const apiTargetGroup = new aws.lb.TargetGroup(
      `payment-api-tg-${environmentSuffix}`,
      {
        name: `payment-api-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: vpc.id,
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
        tags: { ...tags, Name: `payment-api-tg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ALB Listener
    const albListener = new aws.lb.Listener(
      `payment-alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: apiTargetGroup.arn,
          },
        ],
        tags: { ...tags, Name: `payment-alb-listener-${environmentSuffix}` },
      },
      { parent: this }
    );

    // IAM Roles
    const taskExecutionRole = new aws.iam.Role(
      `payment-task-exec-role-${environmentSuffix}`,
      {
        name: `payment-task-exec-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: { ...tags, Name: `payment-task-exec-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `payment-task-exec-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `payment-task-exec-secrets-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.id,
        policy: pulumi
          .all([dbSecret.arn, apiSecret.arn, logKmsKey.arn])
          .apply(([dbArn, apiArn, kmsArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                  ],
                  Resource: [dbArn, apiArn],
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:DescribeKey'],
                  Resource: kmsArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Task Roles (one per service)
    const createTaskRole = (
      serviceName: string,
      secrets: pulumi.Output<string>[]
    ) => {
      const role = new aws.iam.Role(
        `payment-${serviceName}-role-${environmentSuffix}`,
        {
          name: `payment-${serviceName}-${environmentSuffix}`,
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { Service: 'ecs-tasks.amazonaws.com' },
                Action: 'sts:AssumeRole',
              },
            ],
          }),
          tags: {
            ...tags,
            Name: `payment-${serviceName}-role-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.iam.RolePolicy(
        `payment-${serviceName}-policy-${environmentSuffix}`,
        {
          role: role.id,
          policy: pulumi.all(secrets).apply(arns =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetSecretValue'],
                  Resource: arns,
                },
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: '*',
                },
              ],
            })
          ),
        },
        { parent: this }
      );

      return role;
    };

    const apiGatewayTaskRole = createTaskRole('api-gateway', [
      dbSecret.arn,
      apiSecret.arn,
    ]);
    const paymentProcessorTaskRole = createTaskRole('payment-processor', [
      dbSecret.arn,
      apiSecret.arn,
    ]);
    const fraudDetectorTaskRole = createTaskRole('fraud-detector', [
      dbSecret.arn,
    ]);

    // Service Discovery Services
    const serviceDiscoveryServices = services.map(
      service =>
        new aws.servicediscovery.Service(
          `payment-${service}-sd-${environmentSuffix}`,
          {
            name: service,
            dnsConfig: {
              namespaceId: serviceDiscovery.id,
              dnsRecords: [{ ttl: 10, type: 'A' }],
              routingPolicy: 'MULTIVALUE',
            },
            healthCheckCustomConfig: { failureThreshold: 1 },
            tags: {
              ...tags,
              Name: `payment-${service}-sd-${environmentSuffix}`,
            },
          },
          { parent: this }
        )
    );

    // Task Definitions
    const createTaskDefinition = (
      serviceName: string,
      index: number,
      taskRole: aws.iam.Role,
      secrets: { name: string; valueFrom: pulumi.Output<string> }[]
    ) => {
      return new aws.ecs.TaskDefinition(
        `payment-${serviceName}-task-${environmentSuffix}`,
        {
          family: `payment-${serviceName}-${environmentSuffix}`,
          cpu: '1024',
          memory: '2048',
          networkMode: 'awsvpc',
          requiresCompatibilities: ['FARGATE'],
          executionRoleArn: taskExecutionRole.arn,
          taskRoleArn: taskRole.arn,
          containerDefinitions: logGroups[index].name.apply(logGroupName => {
            // Map service names to appropriate placeholder images
            const imageMap: { [key: string]: string } = {
              'api-gateway': 'nginx:alpine',
              'payment-processor': 'busybox:latest',
              'fraud-detector': 'alpine:latest',
            };

            return JSON.stringify([
              {
                name: serviceName,
                image: imageMap[serviceName] || 'nginx:alpine',
                cpu: 1024,
                memory: 2048,
                essential: true,
                portMappings: [{ containerPort: 8080, protocol: 'tcp' }],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': 'us-east-1',
                    'awslogs-stream-prefix': serviceName,
                  },
                },
                secrets: secrets,
                environment: [
                  { name: 'SERVICE_NAME', value: serviceName },
                  {
                    name: 'PAYMENT_PROCESSOR_URL',
                    value: 'http://payment-processor.payment.local:8080',
                  },
                  {
                    name: 'FRAUD_DETECTOR_URL',
                    value: 'http://fraud-detector.payment.local:8080',
                  },
                ],
              },
            ]);
          }),
          tags: {
            ...tags,
            Name: `payment-${serviceName}-task-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
    };

    const apiGatewayTaskDef = createTaskDefinition(
      'api-gateway',
      0,
      apiGatewayTaskRole,
      []
    );

    const paymentProcessorTaskDef = createTaskDefinition(
      'payment-processor',
      1,
      paymentProcessorTaskRole,
      []
    );

    const fraudDetectorTaskDef = createTaskDefinition(
      'fraud-detector',
      2,
      fraudDetectorTaskRole,
      []
    );

    // ECS Services
    const apiGatewayService = new aws.ecs.Service(
      `payment-api-gateway-service-${environmentSuffix}`,
      {
        name: `payment-api-gateway-${environmentSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: apiGatewayTaskDef.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          assignPublicIp: false,
          subnets: privateSubnets.map(s => s.id),
          securityGroups: [ecsSecurityGroup.id],
        },
        loadBalancers: [
          {
            targetGroupArn: apiTargetGroup.arn,
            containerName: 'api-gateway',
            containerPort: 8080,
          },
        ],
        serviceRegistries: { registryArn: serviceDiscoveryServices[0].arn },
        deploymentMaximumPercent: 200,
        deploymentMinimumHealthyPercent: 100,
        deploymentCircuitBreaker: { enable: true, rollback: true },
        tags: {
          ...tags,
          Name: `payment-api-gateway-service-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [albListener] }
    );

    const paymentProcessorService = new aws.ecs.Service(
      `payment-processor-service-${environmentSuffix}`,
      {
        name: `payment-processor-${environmentSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: paymentProcessorTaskDef.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          assignPublicIp: false,
          subnets: privateSubnets.map(s => s.id),
          securityGroups: [ecsSecurityGroup.id],
        },
        serviceRegistries: { registryArn: serviceDiscoveryServices[1].arn },
        deploymentMaximumPercent: 200,
        deploymentMinimumHealthyPercent: 100,
        deploymentCircuitBreaker: { enable: true, rollback: true },
        tags: {
          ...tags,
          Name: `payment-processor-service-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const fraudDetectorService = new aws.ecs.Service(
      `payment-fraud-detector-service-${environmentSuffix}`,
      {
        name: `payment-fraud-detector-${environmentSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: fraudDetectorTaskDef.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          assignPublicIp: false,
          subnets: privateSubnets.map(s => s.id),
          securityGroups: [ecsSecurityGroup.id],
        },
        serviceRegistries: { registryArn: serviceDiscoveryServices[2].arn },
        deploymentMaximumPercent: 200,
        deploymentMinimumHealthyPercent: 100,
        deploymentCircuitBreaker: { enable: true, rollback: true },
        tags: {
          ...tags,
          Name: `payment-fraud-detector-service-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Auto Scaling
    const createAutoScaling = (
      service: aws.ecs.Service,
      serviceName: string
    ) => {
      const target = new aws.appautoscaling.Target(
        `payment-${serviceName}-scaling-target-${environmentSuffix}`,
        {
          maxCapacity: 10,
          minCapacity: 2,
          resourceId: pulumi.interpolate`service/${ecsCluster.name}/${service.name}`,
          scalableDimension: 'ecs:service:DesiredCount',
          serviceNamespace: 'ecs',
        },
        { parent: this }
      );

      new aws.appautoscaling.Policy(
        `payment-${serviceName}-cpu-policy-${environmentSuffix}`,
        {
          name: `payment-${serviceName}-cpu-${environmentSuffix}`,
          policyType: 'TargetTrackingScaling',
          resourceId: target.resourceId,
          scalableDimension: target.scalableDimension,
          serviceNamespace: target.serviceNamespace,
          targetTrackingScalingPolicyConfiguration: {
            predefinedMetricSpecification: {
              predefinedMetricType: 'ECSServiceAverageCPUUtilization',
            },
            targetValue: 70,
            scaleInCooldown: 300,
            scaleOutCooldown: 60,
          },
        },
        { parent: this }
      );

      new aws.appautoscaling.Policy(
        `payment-${serviceName}-memory-policy-${environmentSuffix}`,
        {
          name: `payment-${serviceName}-memory-${environmentSuffix}`,
          policyType: 'TargetTrackingScaling',
          resourceId: target.resourceId,
          scalableDimension: target.scalableDimension,
          serviceNamespace: target.serviceNamespace,
          targetTrackingScalingPolicyConfiguration: {
            predefinedMetricSpecification: {
              predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
            },
            targetValue: 70,
            scaleInCooldown: 300,
            scaleOutCooldown: 60,
          },
        },
        { parent: this }
      );
    };

    createAutoScaling(apiGatewayService, 'api-gateway');
    createAutoScaling(paymentProcessorService, 'payment-processor');
    createAutoScaling(fraudDetectorService, 'fraud-detector');

    // Outputs
    this.vpcId = vpc.id;
    this.ecsClusterName = ecsCluster.name;
    this.albDnsName = alb.dnsName;
    this.apiGatewayServiceName = apiGatewayService.name;
    this.paymentProcessorServiceName = paymentProcessorService.name;
    this.fraudDetectorServiceName = fraudDetectorService.name;
    this.serviceDiscoveryNamespace = pulumi.interpolate`${serviceDiscovery.name}`;

    this.registerOutputs({
      vpcId: this.vpcId,
      ecsClusterName: this.ecsClusterName,
      albDnsName: this.albDnsName,
      apiGatewayServiceName: this.apiGatewayServiceName,
      paymentProcessorServiceName: this.paymentProcessorServiceName,
      fraudDetectorServiceName: this.fraudDetectorServiceName,
      serviceDiscoveryNamespace: this.serviceDiscoveryNamespace,
    });
  }
}
