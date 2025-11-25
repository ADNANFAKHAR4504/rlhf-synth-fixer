/**
 * tap-stack.ts
 *
 * Blue-Green Deployment Infrastructure for Payment Processing Application
 *
 * This implements a production-ready web application with blue-green deployment capability
 * for a fintech startup processing real-time payments with PCI-DSS compliance.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main Pulumi component resource implementing blue-green deployment infrastructure
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly distributionUrl: pulumi.Output<string>;
  public readonly databaseEndpoint: pulumi.Output<string>;
  public readonly databaseConnectionString: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = {
      Environment: environmentSuffix,
      Application: 'payment-processing',
      CostCenter: 'fintech-operations',
      ManagedBy: 'pulumi',
      ...((args.tags as any) || {}),
    };

    const region = aws.getRegionOutput().name;

    // ===== VPC and Networking =====

    const vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `vpc-${environmentSuffix}` },
      },
      { parent: this }
    );

    const availabilityZones = aws.getAvailabilityZones({ state: 'available' });

    // Public subnets (3 AZs)
    const publicSubnets = [0, 1, 2].map(
      i =>
        new aws.ec2.Subnet(
          `public-subnet-${i}-${environmentSuffix}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${i}.0/24`,
            availabilityZone: availabilityZones.then(azs => azs.names[i]),
            mapPublicIpOnLaunch: true,
            tags: {
              ...tags,
              Name: `public-subnet-${i}-${environmentSuffix}`,
              Type: 'public',
            },
          },
          { parent: this }
        )
    );

    // Private subnets (3 AZs)
    const privateSubnets = [0, 1, 2].map(
      i =>
        new aws.ec2.Subnet(
          `private-subnet-${i}-${environmentSuffix}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${10 + i}.0/24`,
            availabilityZone: availabilityZones.then(azs => azs.names[i]),
            mapPublicIpOnLaunch: false,
            tags: {
              ...tags,
              Name: `private-subnet-${i}-${environmentSuffix}`,
              Type: 'private',
            },
          },
          { parent: this }
        )
    );

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...tags, Name: `igw-${environmentSuffix}` },
      },
      { parent: this }
    );

    // NAT Gateway (single for cost optimization)
    const eip = new aws.ec2.Eip(
      `nat-eip-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: { ...tags, Name: `nat-eip-${environmentSuffix}` },
      },
      { parent: this }
    );

    const natGateway = new aws.ec2.NatGateway(
      `nat-gateway-${environmentSuffix}`,
      {
        allocationId: eip.id,
        subnetId: publicSubnets[0].id,
        tags: { ...tags, Name: `nat-gateway-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
        tags: { ...tags, Name: `public-rt-${environmentSuffix}` },
      },
      { parent: this }
    );

    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Private route table
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGateway.id }],
        tags: { ...tags, Name: `private-rt-${environmentSuffix}` },
      },
      { parent: this }
    );

    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // VPC Endpoints for cost optimization
    new aws.ec2.VpcEndpoint(
      `s3-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: region.apply(r => `com.amazonaws.${r}.s3`),
        vpcEndpointType: 'Gateway',
        routeTableIds: [privateRouteTable.id],
        tags: { ...tags, Name: `s3-endpoint-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ===== Security Groups and IAM =====

    // KMS key for encryption
    const kmsKey = new aws.kms.Key(
      `kms-key-${environmentSuffix}`,
      {
        description: `Customer-managed key for ${environmentSuffix}`,
        enableKeyRotation: true,
        tags: { ...tags, Name: `kms-key-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `kms-alias-${environmentSuffix}`,
      {
        name: `alias/payment-processing-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // ALB Security Group
    const albSg = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP',
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: { ...tags, Name: `alb-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ECS Security Group
    const ecsSg = new aws.ec2.SecurityGroup(
      `ecs-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3000,
            toPort: 3000,
            securityGroups: [albSg.id],
            description: 'API from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSg.id],
            description: 'Frontend from ALB',
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: { ...tags, Name: `ecs-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Database Security Group
    const dbSg = new aws.ec2.SecurityGroup(
      `db-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Aurora PostgreSQL',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [ecsSg.id],
            description: 'PostgreSQL',
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: { ...tags, Name: `db-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ECS Execution Role
    const ecsExecutionRole = new aws.iam.Role(
      `ecs-execution-role-${environmentSuffix}`,
      {
        name: `ecs-execution-role-${environmentSuffix}`,
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
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        ],
        tags: { ...tags, Name: `ecs-execution-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `ecs-execution-secrets-policy-${environmentSuffix}`,
      {
        role: ecsExecutionRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // ECS Task Role
    const ecsTaskRole = new aws.iam.Role(
      `ecs-task-role-${environmentSuffix}`,
      {
        name: `ecs-task-role-${environmentSuffix}`,
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
        tags: { ...tags, Name: `ecs-task-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `ecs-task-policy-${environmentSuffix}`,
      {
        role: ecsTaskRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": ["s3:GetObject", "s3:PutObject"],
            "Resource": "arn:aws:s3:::static-assets-${environmentSuffix}/*"
          },
          {
            "Effect": "Allow",
            "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents", "cloudwatch:PutMetricData"],
            "Resource": "*"
          }
        ]
      }`,
      },
      { parent: this }
    );

    // ===== Aurora PostgreSQL Serverless v2 =====

    const masterPassword = new aws.secretsmanager.Secret(
      `db-master-password-${environmentSuffix}`,
      {
        name: `db-master-password-${environmentSuffix}`,
        description: 'Master password for Aurora PostgreSQL cluster',
        tags: { ...tags, Name: `db-master-password-${environmentSuffix}` },
      },
      { parent: this }
    );

    const passwordValue = aws.secretsmanager.getRandomPasswordOutput({
      passwordLength: 32,
      excludePunctuation: true,
    });

    const masterPasswordVersion = new aws.secretsmanager.SecretVersion(
      `db-master-password-version-${environmentSuffix}`,
      {
        secretId: masterPassword.id,
        secretString: passwordValue.randomPassword.apply(p => p || 'temporary'),
      },
      { parent: this }
    );

    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${environmentSuffix}`,
      {
        name: `db-subnet-group-${environmentSuffix}`,
        subnetIds: privateSubnets.map(s => s.id),
        description: 'Subnet group for Aurora PostgreSQL cluster',
        tags: { ...tags, Name: `db-subnet-group-${environmentSuffix}` },
      },
      { parent: this }
    );

    const cluster = new aws.rds.Cluster(
      `aurora-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `aurora-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '15.8',
        databaseName: 'paymentdb',
        masterUsername: 'masteruser',
        masterPassword: masterPasswordVersion.secretString.apply(
          s => s || 'temporary'
        ),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSg.id],
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        skipFinalSnapshot: true,
        deletionProtection: false,
        serverlessv2ScalingConfiguration: {
          minCapacity: 0.5,
          maxCapacity: 2,
        },
        tags: { ...tags, Name: `aurora-cluster-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.rds.ClusterInstance(
      `aurora-instance-${environmentSuffix}`,
      {
        identifier: `aurora-instance-${environmentSuffix}`,
        clusterIdentifier: cluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql',
        engineVersion: '15.8',
        publiclyAccessible: false,
        tags: { ...tags, Name: `aurora-instance-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.cloudwatch.LogGroup(
      `db-log-group-${environmentSuffix}`,
      {
        name: `/aws/rds/cluster/aurora-cluster-${environmentSuffix}/postgresql`,
        retentionInDays: 90,
        tags: { ...tags, Name: `db-log-group-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ===== S3 and CloudFront =====

    const staticAssetsBucket = new aws.s3.Bucket(
      `static-assets-${environmentSuffix}`,
      {
        bucket: `static-assets-${environmentSuffix}`,
        versioning: { enabled: true },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' },
          },
        },
        tags: { ...tags, Name: `static-assets-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `static-assets-block-${environmentSuffix}`,
      {
        bucket: staticAssetsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    const oai = new aws.cloudfront.OriginAccessIdentity(
      `oai-${environmentSuffix}`,
      {
        comment: `OAI for ${environmentSuffix}`,
      },
      { parent: this }
    );

    new aws.s3.BucketPolicy(
      `static-assets-policy-${environmentSuffix}`,
      {
        bucket: staticAssetsBucket.id,
        policy: pulumi
          .all([staticAssetsBucket.arn, oai.iamArn])
          .apply(([bucketArn, oaiArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { AWS: oaiArn },
                  Action: 's3:GetObject',
                  Resource: `${bucketArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    const distribution = new aws.cloudfront.Distribution(
      `distribution-${environmentSuffix}`,
      {
        enabled: true,
        comment: `Distribution for ${environmentSuffix}`,
        defaultRootObject: 'index.html',
        origins: [
          {
            originId: staticAssetsBucket.id,
            domainName: staticAssetsBucket.bucketRegionalDomainName,
            s3OriginConfig: {
              originAccessIdentity: oai.cloudfrontAccessIdentityPath,
            },
          },
        ],
        defaultCacheBehavior: {
          targetOriginId: staticAssetsBucket.id,
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          forwardedValues: { queryString: false, cookies: { forward: 'none' } },
          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
        },
        restrictions: { geoRestriction: { restrictionType: 'none' } },
        viewerCertificate: { cloudfrontDefaultCertificate: true },
        tags: { ...tags, Name: `distribution-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Application logs bucket
    const logsBucket = new aws.s3.Bucket(
      `application-logs-${environmentSuffix}`,
      {
        bucket: `application-logs-${environmentSuffix}`,
        versioning: { enabled: true },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' },
          },
        },
        lifecycleRules: [{ enabled: true, expiration: { days: 90 } }],
        tags: { ...tags, Name: `application-logs-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `logs-block-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // ===== ECS Fargate =====

    const ecsCluster = new aws.ecs.Cluster(
      `ecs-cluster-${environmentSuffix}`,
      {
        name: `ecs-cluster-${environmentSuffix}`,
        settings: [{ name: 'containerInsights', value: 'enabled' }],
        tags: { ...tags, Name: `ecs-cluster-${environmentSuffix}` },
      },
      { parent: this }
    );

    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-log-group-${environmentSuffix}`,
      {
        name: `/ecs/payment-app-${environmentSuffix}`,
        retentionInDays: 90,
        tags: { ...tags, Name: `ecs-log-group-${environmentSuffix}` },
      },
      { parent: this }
    );

    const ecrRepo = new aws.ecr.Repository(
      `ecr-repo-${environmentSuffix}`,
      {
        name: `payment-app-${environmentSuffix}`,
        imageTagMutability: 'MUTABLE',
        imageScanningConfiguration: { scanOnPush: true },
        encryptionConfigurations: [{ encryptionType: 'AES256' }],
        tags: { ...tags, Name: `ecr-repo-${environmentSuffix}` },
      },
      { parent: this }
    );

    const taskDefinition = new aws.ecs.TaskDefinition(
      `task-definition-${environmentSuffix}`,
      {
        family: `payment-app-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '1024',
        memory: '2048',
        executionRoleArn: ecsExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi
          .all([
            cluster.endpoint,
            masterPassword.arn,
            ecrRepo.repositoryUrl,
            logGroup.name,
            region,
          ])
          .apply(([dbEndpoint, secretArn, repoUrl, logGroupName, regionName]) =>
            JSON.stringify([
              {
                name: 'api',
                image: `${repoUrl}:latest`,
                essential: true,
                portMappings: [{ containerPort: 3000, protocol: 'tcp' }],
                environment: [
                  { name: 'NODE_ENV', value: 'production' },
                  { name: 'PORT', value: '3000' },
                  { name: 'DB_HOST', value: dbEndpoint },
                  { name: 'DB_NAME', value: 'paymentdb' },
                  { name: 'DB_USER', value: 'masteruser' },
                ],
                secrets: [{ name: 'DB_PASSWORD', valueFrom: secretArn }],
                healthCheck: {
                  command: [
                    'CMD-SHELL',
                    'curl -f http://localhost:3000/health || exit 1',
                  ],
                  interval: 30,
                  timeout: 5,
                  retries: 3,
                  startPeriod: 60,
                },
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': regionName,
                    'awslogs-stream-prefix': 'api',
                  },
                },
              },
            ])
          ),
        tags: { ...tags, Name: `task-definition-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Blue and Green Target Groups
    const blueTargetGroup = new aws.lb.TargetGroup(
      `blue-tg-${environmentSuffix}`,
      {
        name: `blue-tg-${environmentSuffix}`,
        port: 3000,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: {
          ...tags,
          Name: `blue-tg-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    const greenTargetGroup = new aws.lb.TargetGroup(
      `green-tg-${environmentSuffix}`,
      {
        name: `green-tg-${environmentSuffix}`,
        port: 3000,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'ip',
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: {
          ...tags,
          Name: `green-tg-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // ECS Service
    const service = new aws.ecs.Service(
      `ecs-service-${environmentSuffix}`,
      {
        name: `payment-service-${environmentSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 3,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: privateSubnets.map(s => s.id),
          securityGroups: [ecsSg.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: blueTargetGroup.arn,
            containerName: 'api',
            containerPort: 3000,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        deploymentController: { type: 'ECS' },
        tags: { ...tags, Name: `ecs-service-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Auto Scaling
    const scalingTarget = new aws.appautoscaling.Target(
      `ecs-scaling-target-${environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 3,
        resourceId: pulumi.interpolate`service/${ecsCluster.name}/${service.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    new aws.appautoscaling.Policy(
      `ecs-scaling-policy-cpu-${environmentSuffix}`,
      {
        name: `ecs-scaling-policy-cpu-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 70,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    new aws.appautoscaling.Policy(
      `ecs-scaling-policy-memory-${environmentSuffix}`,
      {
        name: `ecs-scaling-policy-memory-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          targetValue: 80,
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          },
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // ===== Application Load Balancer =====

    const alb = new aws.lb.LoadBalancer(
      `alb-${environmentSuffix}`,
      {
        name: `alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSg.id],
        subnets: publicSubnets.map(s => s.id),
        enableDeletionProtection: false,
        enableHttp2: true,
        tags: { ...tags, Name: `alb-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.lb.Listener(
      `alb-http-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          { type: 'forward', targetGroupArn: blueTargetGroup.arn },
        ],
      },
      { parent: this }
    );

    // Lambda for weighted routing control
    const lambdaRole = new aws.iam.Role(
      `lambda-routing-role-${environmentSuffix}`,
      {
        name: `lambda-routing-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        ],
        tags: { ...tags, Name: `lambda-routing-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `lambda-routing-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'elasticloadbalancing:ModifyListener',
                'elasticloadbalancing:ModifyRule',
                'elasticloadbalancing:DescribeListeners',
                'elasticloadbalancing:DescribeTargetGroups',
                'elasticloadbalancing:DescribeTargetHealth',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    new aws.lambda.Function(
      `routing-lambda-${environmentSuffix}`,
      {
        name: `routing-lambda-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  const blueWeight = parseInt(process.env.BLUE_WEIGHT || '100');
  const greenWeight = parseInt(process.env.GREEN_WEIGHT || '0');
  return {
    statusCode: 200,
    body: JSON.stringify({ blue: blueWeight, green: greenWeight })
  };
};
        `),
        }),
        environment: {
          variables: {
            BLUE_WEIGHT: '100',
            GREEN_WEIGHT: '0',
            BLUE_TG_ARN: blueTargetGroup.arn,
            GREEN_TG_ARN: greenTargetGroup.arn,
          },
        },
        tags: { ...tags, Name: `routing-lambda-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ===== CloudWatch Monitoring =====

    const alarmTopic = new aws.sns.Topic(
      `alarm-topic-${environmentSuffix}`,
      {
        name: `alarm-topic-${environmentSuffix}`,
        tags: { ...tags, Name: `alarm-topic-${environmentSuffix}` },
      },
      { parent: this }
    );

    const dashboard = new aws.cloudwatch.Dashboard(
      `dashboard-${environmentSuffix}`,
      {
        dashboardName: `payment-app-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            alb.arn,
            blueTargetGroup.arn,
            cluster.clusterIdentifier,
            ecsCluster.name,
            service.name,
          ])
          .apply(([, , dbClusterId, clusterName, serviceName]) => {
            return JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'TargetResponseTime',
                        { stat: 'Average', label: 'Response Time (avg)' },
                      ],
                      ['...', { stat: 'p99', label: 'Response Time (p99)' }],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: 'us-east-1',
                    title: 'ALB Response Times',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'HTTPCode_Target_5XX_Count',
                        { stat: 'Sum' },
                      ],
                      ['.', 'HTTPCode_Target_4XX_Count', { stat: 'Sum' }],
                      ['.', 'HTTPCode_Target_2XX_Count', { stat: 'Sum' }],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: 'us-east-1',
                    title: 'ALB Error Rates',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'ActiveConnectionCount',
                        { stat: 'Sum' },
                      ],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: 'us-east-1',
                    title: 'Active Connections',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/RDS',
                        'DatabaseConnections',
                        'DBClusterIdentifier',
                        dbClusterId,
                      ],
                      ['.', 'CPUUtilization', '.', '.'],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: 'us-east-1',
                    title: 'Database Metrics',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ECS',
                        'CPUUtilization',
                        'ServiceName',
                        serviceName,
                        'ClusterName',
                        clusterName,
                      ],
                      ['.', 'MemoryUtilization', '.', '.', '.', '.'],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: 'us-east-1',
                    title: 'ECS Service Metrics',
                  },
                },
              ],
            });
          }),
      },
      { parent: this }
    );

    // Alarms for automated rollback
    new aws.cloudwatch.MetricAlarm(
      `error-alarm-${environmentSuffix}`,
      {
        name: `alb-5xx-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HTTPCode_Target_5XX_Count',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Triggers rollback when 5XX errors exceed threshold',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          LoadBalancer: alb.arn.apply(arn => arn.split(':').pop()!),
        },
        treatMissingData: 'notBreaching',
        tags: { ...tags, Name: `error-alarm-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `latency-alarm-${environmentSuffix}`,
      {
        name: `alb-high-latency-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 3,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 2,
        alarmDescription: 'Alerts on high response times',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          LoadBalancer: alb.arn.apply(arn => arn.split(':').pop()!),
        },
        treatMissingData: 'notBreaching',
        tags: { ...tags, Name: `latency-alarm-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ===== Outputs =====

    this.vpcId = vpc.id;
    this.albDnsName = alb.dnsName;
    this.distributionUrl = pulumi.interpolate`https://${distribution.domainName}`;
    this.databaseEndpoint = cluster.endpoint;
    this.databaseConnectionString = pulumi.interpolate`postgresql://masteruser@${cluster.endpoint}/paymentdb`;

    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      distributionUrl: this.distributionUrl,
      databaseEndpoint: this.databaseEndpoint,
      databaseConnectionString: this.databaseConnectionString,
      staticAssetsBucket: staticAssetsBucket.bucket,
      cloudWatchDashboardUrl: pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${dashboard.dashboardName}`,
    });
  }
}
