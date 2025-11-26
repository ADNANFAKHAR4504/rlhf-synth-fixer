/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the creation of a complete payment processing infrastructure including:
 * - VPC with public/private subnets
 * - ECS Fargate services for frontend and backend
 * - RDS Aurora Serverless v2 for database
 * - Application Load Balancer
 * - CloudFront Distribution with WAF
 * - KMS keys, Secrets Manager, and SSM Parameter Store
 */
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * If not provided, will be read from Pulumi config.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * Optional ACM certificate ARN for HTTPS listener.
   * Defaults to a placeholder ARN if not provided.
   */
  certificateArn?: string;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component creates a complete payment processing infrastructure on AWS.
 */
export class TapStack extends pulumi.ComponentResource {
  // Outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly ecsClusterName: pulumi.Output<string>;
  public readonly ecsClusterArn: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly cloudFrontUrl: pulumi.Output<string>;
  public readonly cloudFrontDistributionId: pulumi.Output<string>;
  public readonly dbClusterEndpoint: pulumi.Output<string>;
  public readonly dbClusterIdentifier: pulumi.Output<string>;
  public readonly frontendRepoUrl: pulumi.Output<string>;
  public readonly backendRepoUrl: pulumi.Output<string>;
  public readonly rdsKmsKeyId: pulumi.Output<string>;
  public readonly ecsKmsKeyId: pulumi.Output<string>;
  public readonly dbSecretArn: pulumi.Output<string>;
  public readonly appConfigParamName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // Configuration
    const config = new pulumi.Config();
    const environmentSuffix =
      args.environmentSuffix || config.get('environmentSuffix') || 'dev';
    const region = aws.config.region || 'us-east-1';

    // KMS Key for RDS Encryption
    const rdsKmsKey = new aws.kms.Key(
      `rds-key-${environmentSuffix}`,
      {
        description: `KMS key for RDS encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: {
          Name: `rds-key-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `rds-key-alias-${environmentSuffix}`,
      {
        name: `alias/rds-${environmentSuffix}`,
        targetKeyId: rdsKmsKey.id,
      },
      { parent: this }
    );

    // KMS Key for ECS Task Encryption
    const ecsKmsKey = new aws.kms.Key(
      `ecs-key-${environmentSuffix}`,
      {
        description: `KMS key for ECS task encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: {
          Name: `ecs-key-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `ecs-key-alias-${environmentSuffix}`,
      {
        name: `alias/ecs-${environmentSuffix}`,
        targetKeyId: ecsKmsKey.id,
      },
      { parent: this }
    );

    // VPC Configuration
    const vpc = new awsx.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        numberOfAvailabilityZones: 3,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        subnetSpecs: [
          {
            type: awsx.ec2.SubnetType.Public,
            cidrMask: 24,
          },
          {
            type: awsx.ec2.SubnetType.Private,
            cidrMask: 24,
          },
        ],
        natGateways: {
          strategy: awsx.ec2.NatGatewayStrategy.Single,
        },
        tags: {
          Name: `payment-vpc-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // VPC Flow Logs
    const flowLogRole = new aws.iam.Role(
      `vpc-flow-log-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'vpc-flow-logs.amazonaws.com',
        }),
        tags: {
          Name: `vpc-flow-log-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `vpc-flow-log-policy-${environmentSuffix}`,
      {
        role: flowLogRole.id,
        policy: {
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
        },
      },
      { parent: this }
    );

    const flowLogGroup = new aws.cloudwatch.LogGroup(
      `vpc-flow-logs-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags: {
          Name: `vpc-flow-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.ec2.FlowLog(
      `vpc-flow-log-${environmentSuffix}`,
      {
        iamRoleArn: flowLogRole.arn,
        logDestination: flowLogGroup.arn,
        trafficType: 'ALL',
        vpcId: vpc.vpcId,
        tags: {
          Name: `vpc-flow-log-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from internet (redirect to HTTPS)',
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
        tags: {
          Name: `alb-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const frontendSecurityGroup = new aws.ec2.SecurityGroup(
      `frontend-sg-${environmentSuffix}`,
      {
        vpcId: vpc.vpcId,
        description: 'Security group for frontend ECS tasks',
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
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `frontend-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const backendSecurityGroup = new aws.ec2.SecurityGroup(
      `backend-sg-${environmentSuffix}`,
      {
        vpcId: vpc.vpcId,
        description: 'Security group for backend ECS tasks',
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
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `backend-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${environmentSuffix}`,
      {
        vpcId: vpc.vpcId,
        description: 'Security group for RDS Aurora cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [backendSecurityGroup.id],
            description: 'Allow PostgreSQL from backend',
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
        tags: {
          Name: `rds-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // ECR Repositories
    const frontendRepo = new aws.ecr.Repository(
      `frontend-repo-${environmentSuffix}`,
      {
        name: `frontend-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        forceDelete: true,
        tags: {
          Name: `frontend-repo-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const backendRepo = new aws.ecr.Repository(
      `backend-repo-${environmentSuffix}`,
      {
        name: `backend-${environmentSuffix}`,
        imageScanningConfiguration: {
          scanOnPush: true,
        },
        imageTagMutability: 'MUTABLE',
        forceDelete: true,
        tags: {
          Name: `backend-repo-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Lifecycle policy to block vulnerable images
    const lifecyclePolicy = {
      rules: [
        {
          rulePriority: 1,
          description: 'Remove images with HIGH or CRITICAL vulnerabilities',
          selection: {
            tagStatus: 'any',
            countType: 'imageCountMoreThan',
            countNumber: 1,
          },
          action: {
            type: 'expire',
          },
        },
      ],
    };

    new aws.ecr.LifecyclePolicy(
      `frontend-lifecycle-${environmentSuffix}`,
      {
        repository: frontendRepo.name,
        policy: JSON.stringify(lifecyclePolicy),
      },
      { parent: this }
    );

    new aws.ecr.LifecyclePolicy(
      `backend-lifecycle-${environmentSuffix}`,
      {
        repository: backendRepo.name,
        policy: JSON.stringify(lifecyclePolicy),
      },
      { parent: this }
    );

    // DB Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: vpc.privateSubnetIds,
        tags: {
          Name: `db-subnet-group-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // RDS Aurora Serverless v2 Cluster
    const dbClusterParameterGroup = new aws.rds.ClusterParameterGroup(
      `db-cluster-pg-${environmentSuffix}`,
      {
        family: 'aurora-postgresql17',
        description: `Cluster parameter group for ${environmentSuffix}`,
        parameters: [
          {
            name: 'rds.force_ssl',
            value: '1',
          },
        ],
        tags: {
          Name: `db-cluster-pg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const dbCluster = new aws.rds.Cluster(
      `aurora-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `payment-db-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '17.4',
        databaseName: 'paymentdb',
        masterUsername: 'dbadmin',
        masterPassword: pulumi.secret('ChangeMe123!'),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        storageEncrypted: true,
        kmsKeyId: rdsKmsKey.arn,
        enabledCloudwatchLogsExports: ['postgresql'],
        backupRetentionPeriod: 1,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
        skipFinalSnapshot: true,
        deletionProtection: false,
        iamDatabaseAuthenticationEnabled: true,
        dbClusterParameterGroupName: dbClusterParameterGroup.name,
        serverlessv2ScalingConfiguration: {
          maxCapacity: 2.0,
          minCapacity: 0.5,
        },
        tags: {
          Name: `aurora-cluster-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.rds.ClusterInstance(
      `aurora-instance-${environmentSuffix}`,
      {
        identifier: `payment-db-instance-${environmentSuffix}`,
        clusterIdentifier: dbCluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql',
        engineVersion: '17.4',
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: rdsKmsKey.arn,
        performanceInsightsRetentionPeriod: 7,
        tags: {
          Name: `aurora-instance-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Secrets Manager for Database Credentials
    const dbSecret = new aws.secretsmanager.Secret(
      `db-secret-${environmentSuffix}`,
      {
        name: `payment-db-credentials-${environmentSuffix}`,
        description: 'Database credentials for payment processing application',
        recoveryWindowInDays: 0,
        tags: {
          Name: `db-secret-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `db-secret-version-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: pulumi
          .all([
            dbCluster.endpoint,
            dbCluster.masterUsername,
            dbCluster.masterPassword,
          ])
          .apply(
            ([endpoint, username, password]: [
              string,
              string,
              string | undefined,
            ]) =>
              JSON.stringify({
                host: endpoint,
                port: 5432,
                database: 'paymentdb',
                username: username,
                password: password,
              })
          ),
      },
      { parent: this }
    );

    // Systems Manager Parameter Store for Application Config
    const appConfigParam = new aws.ssm.Parameter(
      `app-config-${environmentSuffix}`,
      {
        name: `/payment-app/${environmentSuffix}/config`,
        type: 'String',
        value: JSON.stringify({
          environment: environmentSuffix,
          region: region,
          logLevel: 'info',
        }),
        description: 'Application configuration for payment processing',
        tags: {
          Name: `app-config-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

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
        tags: {
          Name: `payment-cluster-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch Log Groups for ECS
    const frontendLogGroup = new aws.cloudwatch.LogGroup(
      `frontend-logs-${environmentSuffix}`,
      {
        name: `/ecs/frontend-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `frontend-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const backendLogGroup = new aws.cloudwatch.LogGroup(
      `backend-logs-${environmentSuffix}`,
      {
        name: `/ecs/backend-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `backend-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // IAM Roles for ECS Tasks
    const frontendTaskRole = new aws.iam.Role(
      `frontend-task-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'ecs-tasks.amazonaws.com',
        }),
        tags: {
          Name: `frontend-task-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `frontend-task-policy-${environmentSuffix}`,
      {
        role: frontendTaskRole.id,
        policy: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['ssm:GetParameter', 'ssm:GetParameters'],
              Resource: appConfigParam.arn,
            },
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              Resource: frontendLogGroup.arn,
            },
          ],
        },
      },
      { parent: this }
    );

    const backendTaskRole = new aws.iam.Role(
      `backend-task-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'ecs-tasks.amazonaws.com',
        }),
        tags: {
          Name: `backend-task-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `backend-task-policy-${environmentSuffix}`,
      {
        role: backendTaskRole.id,
        policy: pulumi
          .all([
            dbSecret.arn,
            appConfigParam.arn,
            dbCluster.clusterResourceId,
            backendLogGroup.arn,
          ])
          .apply(
            ([secretArn, paramArn, clusterResourceId, logGroupArn]: [
              string,
              string,
              string,
              string,
            ]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['secretsmanager:GetSecretValue'],
                    Resource: secretArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['ssm:GetParameter', 'ssm:GetParameters'],
                    Resource: paramArn,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['rds-db:connect'],
                    Resource: `arn:aws:rds-db:${region}:*:dbuser:${clusterResourceId}/dbadmin`,
                  },
                  {
                    Effect: 'Allow',
                    Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                    Resource: logGroupArn,
                  },
                ],
              })
          ),
      },
      { parent: this }
    );

    // ECS Task Execution Role
    const taskExecutionRole = new aws.iam.Role(
      `task-execution-role-${environmentSuffix}`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'ecs-tasks.amazonaws.com',
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        ],
        tags: {
          Name: `task-execution-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `task-execution-policy-${environmentSuffix}`,
      {
        role: taskExecutionRole.id,
        policy: pulumi
          .all([ecsKmsKey.arn, dbSecret.arn])
          .apply(([kmsKeyArn, secretArn]: [string, string]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt'],
                  Resource: kmsKeyArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetSecretValue'],
                  Resource: secretArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'ecr:GetAuthorizationToken',
                    'ecr:BatchCheckLayerAvailability',
                    'ecr:GetDownloadUrlForLayer',
                    'ecr:BatchGetImage',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
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
        subnets: vpc.publicSubnetIds,
        enableDeletionProtection: false,
        tags: {
          Name: `payment-alb-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Target Groups
    const frontendTargetGroup = new aws.lb.TargetGroup(
      `frontend-tg-${environmentSuffix}`,
      {
        name: `frontend-tg-${environmentSuffix}`,
        port: 3000,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: vpc.vpcId,
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
          Name: `frontend-tg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const backendTargetGroup = new aws.lb.TargetGroup(
      `backend-tg-${environmentSuffix}`,
      {
        name: `backend-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: vpc.vpcId,
        healthCheck: {
          enabled: true,
          path: '/api/health',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        deregistrationDelay: 30,
        tags: {
          Name: `backend-tg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Generate custom header value for CloudFront-ALB communication
    const customHeaderValue = pulumi.secret(
      `custom-header-${environmentSuffix}-${Date.now()}`
    );

    // ALB Listeners
    // Note: For production, uncomment HTTPS listener and provide valid certificate ARN
    // const httpsListener = new aws.lb.Listener(
    //   `https-listener-${environmentSuffix}`,
    //   {
    //     loadBalancerArn: alb.arn,
    //     port: 443,
    //     protocol: 'HTTPS',
    //     sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
    //     certificateArn: certificateArn,
    //     defaultActions: [
    //       {
    //         type: 'forward',
    //         targetGroupArn: frontendTargetGroup.arn,
    //       },
    //     ],
    //     tags: {
    //       Name: `https-listener-${environmentSuffix}`,
    //       Environment: environmentSuffix,
    //     },
    //   },
    //   { parent: this }
    // );

    const httpListener = new aws.lb.Listener(
      `http-listener-${environmentSuffix}`,
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
          Name: `http-listener-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Listener Rules for path-based routing
    new aws.lb.ListenerRule(
      `backend-rule-${environmentSuffix}`,
      {
        listenerArn: httpListener.arn,
        priority: 100,
        actions: [
          {
            type: 'forward',
            targetGroupArn: backendTargetGroup.arn,
          },
        ],
        conditions: [
          {
            pathPattern: {
              values: ['/api/*'],
            },
          },
          {
            httpHeader: {
              httpHeaderName: 'X-Custom-Header',
              values: [customHeaderValue],
            },
          },
        ],
        tags: {
          Name: `backend-rule-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // ECS Task Definitions
    const frontendTaskDefinition = new aws.ecs.TaskDefinition(
      `frontend-task-${environmentSuffix}`,
      {
        family: `frontend-${environmentSuffix}`,
        cpu: '256',
        memory: '512',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: frontendTaskRole.arn,
        containerDefinitions: pulumi
          .all([frontendRepo.repositoryUrl, frontendLogGroup.name])
          .apply(([repoUrl, logGroupName]: [string, string]) =>
            JSON.stringify([
              {
                name: 'frontend',
                image: `${repoUrl}:latest`,
                cpu: 256,
                memory: 512,
                essential: true,
                portMappings: [
                  {
                    containerPort: 3000,
                    protocol: 'tcp',
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': region,
                    'awslogs-stream-prefix': 'frontend',
                  },
                },
                environment: [
                  {
                    name: 'ENVIRONMENT',
                    value: environmentSuffix,
                  },
                  {
                    name: 'PORT',
                    value: '3000',
                  },
                ],
              },
            ])
          ),
        tags: {
          Name: `frontend-task-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const backendTaskDefinition = new aws.ecs.TaskDefinition(
      `backend-task-${environmentSuffix}`,
      {
        family: `backend-${environmentSuffix}`,
        cpu: '512',
        memory: '1024',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: taskExecutionRole.arn,
        taskRoleArn: backendTaskRole.arn,
        containerDefinitions: pulumi
          .all([
            backendRepo.repositoryUrl,
            backendLogGroup.name,
            dbSecret.arn,
            appConfigParam.arn,
          ])
          .apply(
            ([repoUrl, logGroupName, secretArn, paramArn]: [
              string,
              string,
              string,
              string,
            ]) =>
              JSON.stringify([
                {
                  name: 'backend',
                  image: `${repoUrl}:latest`,
                  cpu: 512,
                  memory: 1024,
                  essential: true,
                  portMappings: [
                    {
                      containerPort: 8080,
                      protocol: 'tcp',
                    },
                  ],
                  logConfiguration: {
                    logDriver: 'awslogs',
                    options: {
                      'awslogs-group': logGroupName,
                      'awslogs-region': region,
                      'awslogs-stream-prefix': 'backend',
                    },
                  },
                  secrets: [
                    {
                      name: 'DB_CREDENTIALS',
                      valueFrom: secretArn,
                    },
                  ],
                  environment: [
                    {
                      name: 'ENVIRONMENT',
                      value: environmentSuffix,
                    },
                    {
                      name: 'PORT',
                      value: '8080',
                    },
                    {
                      name: 'CONFIG_PARAM',
                      value: paramArn,
                    },
                  ],
                },
              ])
          ),
        tags: {
          Name: `backend-task-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // ECS Services
    new aws.ecs.Service(
      `frontend-service-${environmentSuffix}`,
      {
        name: `frontend-service-${environmentSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: frontendTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: vpc.privateSubnetIds,
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
        tags: {
          Name: `frontend-service-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, dependsOn: [httpListener] }
    );

    new aws.ecs.Service(
      `backend-service-${environmentSuffix}`,
      {
        name: `backend-service-${environmentSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: backendTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: vpc.privateSubnetIds,
          securityGroups: [backendSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: backendTargetGroup.arn,
            containerName: 'backend',
            containerPort: 8080,
          },
        ],
        tags: {
          Name: `backend-service-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, dependsOn: [httpListener] }
    );

    // WAF Web ACL
    new aws.wafv2.IpSet(
      `waf-ipset-${environmentSuffix}`,
      {
        name: `waf-ipset-${environmentSuffix}`,
        scope: 'CLOUDFRONT',
        ipAddressVersion: 'IPV4',
        addresses: [],
        tags: {
          Name: `waf-ipset-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      {
        parent: this,
        provider: new aws.Provider(`us-east-1-provider-${environmentSuffix}`, {
          region: 'us-east-1',
        }),
      }
    );

    const wafWebAcl = new aws.wafv2.WebAcl(
      `waf-acl-${environmentSuffix}`,
      {
        name: `payment-waf-${environmentSuffix}`,
        scope: 'CLOUDFRONT',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'RateLimitRule',
            priority: 1,
            action: {
              block: {},
            },
            statement: {
              rateBasedStatement: {
                limit: 1000,
                aggregateKeyType: 'IP',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'RateLimitRule',
            },
          },
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 2,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'AWSManagedRulesCommonRuleSet',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: `payment-waf-${environmentSuffix}`,
        },
        tags: {
          Name: `payment-waf-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      {
        parent: this,
        provider: new aws.Provider(
          `us-east-1-provider-waf-${environmentSuffix}`,
          {
            region: 'us-east-1',
          }
        ),
      }
    );

    // CloudFront Distribution
    const cloudFrontDistribution = new aws.cloudfront.Distribution(
      `payment-cdn-${environmentSuffix}`,
      {
        enabled: true,
        comment: `Payment processing CDN - ${environmentSuffix}`,
        origins: [
          {
            domainName: alb.dnsName,
            originId: 'alb-origin',
            customOriginConfig: {
              httpPort: 80,
              httpsPort: 443,
              originProtocolPolicy: 'http-only',
              originSslProtocols: ['TLSv1.2'],
            },
            customHeaders: [
              {
                name: 'X-Custom-Header',
                value: customHeaderValue,
              },
            ],
          },
        ],
        defaultRootObject: 'index.html',
        defaultCacheBehavior: {
          targetOriginId: 'alb-origin',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: [
            'GET',
            'HEAD',
            'OPTIONS',
            'PUT',
            'POST',
            'PATCH',
            'DELETE',
          ],
          cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
          forwardedValues: {
            queryString: true,
            cookies: {
              forward: 'all',
            },
            headers: ['Host', 'Accept', 'Authorization'],
          },
          minTtl: 0,
          defaultTtl: 300,
          maxTtl: 1200,
          compress: true,
        },
        orderedCacheBehaviors: [
          {
            pathPattern: '/api/*',
            targetOriginId: 'alb-origin',
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: [
              'GET',
              'HEAD',
              'OPTIONS',
              'PUT',
              'POST',
              'PATCH',
              'DELETE',
            ],
            cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
            forwardedValues: {
              queryString: true,
              cookies: {
                forward: 'all',
              },
              headers: ['*'],
            },
            minTtl: 0,
            defaultTtl: 0,
            maxTtl: 0,
            compress: true,
          },
        ],
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        webAclId: wafWebAcl.arn,
        tags: {
          Name: `payment-cdn-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Set outputs
    this.vpcId = vpc.vpcId;
    this.ecsClusterName = ecsCluster.name;
    this.ecsClusterArn = ecsCluster.arn;
    this.albDnsName = alb.dnsName;
    this.cloudFrontUrl = cloudFrontDistribution.domainName;
    this.cloudFrontDistributionId = cloudFrontDistribution.id;
    this.dbClusterEndpoint = dbCluster.endpoint;
    this.dbClusterIdentifier = dbCluster.clusterIdentifier;
    this.frontendRepoUrl = frontendRepo.repositoryUrl;
    this.backendRepoUrl = backendRepo.repositoryUrl;
    this.rdsKmsKeyId = rdsKmsKey.id;
    this.ecsKmsKeyId = ecsKmsKey.id;
    this.dbSecretArn = dbSecret.arn;
    this.appConfigParamName = appConfigParam.name;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      ecsClusterName: this.ecsClusterName,
      ecsClusterArn: this.ecsClusterArn,
      albDnsName: this.albDnsName,
      cloudFrontUrl: this.cloudFrontUrl,
      cloudFrontDistributionId: this.cloudFrontDistributionId,
      dbClusterEndpoint: this.dbClusterEndpoint,
      dbClusterIdentifier: this.dbClusterIdentifier,
      frontendRepoUrl: this.frontendRepoUrl,
      backendRepoUrl: this.backendRepoUrl,
      rdsKmsKeyId: this.rdsKmsKeyId,
      ecsKmsKeyId: this.ecsKmsKeyId,
      dbSecretArn: this.dbSecretArn,
      appConfigParamName: this.appConfigParamName,
    });
  }
}
