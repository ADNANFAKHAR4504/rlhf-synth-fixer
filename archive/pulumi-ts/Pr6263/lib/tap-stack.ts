/* eslint-disable prettier/prettier */
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const region = process.env.AWS_REGION || 'us-west-2';

// Tags for all resources
const tags = {
  Environment: `payment-${environmentSuffix}`,
  Project: 'PaymentProcessing',
  CostCenter: 'FinTech',
};

// VPC with public and private subnets across 3 AZs
const vpc = new awsx.ec2.Vpc(`payment-vpc-${environmentSuffix}`, {
  cidrBlock: '10.0.0.0/16',
  numberOfAvailabilityZones: 3,
  subnetSpecs: [
    {
      type: awsx.ec2.SubnetType.Public,
      name: 'public',
    },
    {
      type: awsx.ec2.SubnetType.Private,
      name: 'private',
    },
  ],
  natGateways: {
    strategy: awsx.ec2.NatGatewayStrategy.OnePerAz,
  },
  tags: tags,
});

// S3 bucket for VPC Flow Logs
const flowLogsBucket = new aws.s3.Bucket(`flow-logs-${environmentSuffix}`, {
  bucket: `payment-flow-logs-${environmentSuffix}`,
  versioning: {
    enabled: true,
  },
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'AES256',
      },
    },
  },
  lifecycleRules: [
    {
      enabled: true,
      transitions: [
        {
          days: 90,
          storageClass: 'GLACIER',
        },
      ],
    },
  ],
  tags: tags,
});

// VPC Flow Logs
const flowLogsRole = new aws.iam.Role(`flow-logs-role-${environmentSuffix}`, {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Principal: {
          Service: 'vpc-flow-logs.amazonaws.com',
        },
        Effect: 'Allow',
      },
    ],
  }),
  tags: tags,
});

new aws.iam.RolePolicy(`flow-logs-policy-${environmentSuffix}`, {
  role: flowLogsRole.id,
  policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                "Resource": "*"
            }
        ]
    }`,
});

export const vpcFlowLog = new aws.ec2.FlowLog(
  `vpc-flow-log-${environmentSuffix}`,
  {
    vpcId: vpc.vpcId,
    trafficType: 'ALL',
    logDestinationType: 's3',
    logDestination: flowLogsBucket.arn,
    tags: tags,
  }
);

// KMS key for RDS encryption
const rdsKmsKey = new aws.kms.Key(`rds-kms-key-${environmentSuffix}`, {
  description: 'KMS key for RDS encryption',
  deletionWindowInDays: 10,
  tags: tags,
});

// Note: KMS Alias creation skipped to avoid conflicts with existing aliases
// The KMS key can be referenced directly via rdsKmsKey.arn or rdsKmsKey.keyId

// Security Group for RDS
const rdsSecurityGroup = new aws.ec2.SecurityGroup(
  `rds-sg-${environmentSuffix}`,
  {
    vpcId: vpc.vpcId,
    description: 'Security group for RDS Aurora PostgreSQL',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 5432,
        toPort: 5432,
        securityGroups: [], // Will be updated after ECS security group is created
        description: 'PostgreSQL access from ECS tasks',
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
    tags: tags,
  }
);

// DB Subnet Group
const dbSubnetGroup = new aws.rds.SubnetGroup(
  `db-subnet-group-${environmentSuffix}`,
  {
    subnetIds: vpc.privateSubnetIds,
    tags: tags,
  }
);

// Secrets Manager for database credentials
const dbSecret = new aws.secretsmanager.Secret(
  `db-secret-${environmentSuffix}`,
  {
    name: `payment-db-credentials-${environmentSuffix}`,
    description: 'Database credentials for payment processing',
    tags: tags,
  }
);

export const dbSecretVersion = new aws.secretsmanager.SecretVersion(
  `db-secret-version-${environmentSuffix}`,
  {
    secretId: dbSecret.id,
    secretString: JSON.stringify({
      username: 'paymentadmin',
      password: pulumi.secret('ChangeMe123456!'), // Will be rotated
      engine: 'postgres',
      host: '', // Will be updated after RDS creation
      port: 5432,
      dbname: 'paymentdb',
    }),
  }
);

// Secrets rotation Lambda execution role
const rotationLambdaRole = new aws.iam.Role(
  `rotation-lambda-role-${environmentSuffix}`,
  {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Effect: 'Allow',
        },
      ],
    }),
    managedPolicyArns: [
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    ],
    tags: tags,
  }
);

new aws.iam.RolePolicy(`rotation-lambda-policy-${environmentSuffix}`, {
  role: rotationLambdaRole.id,
  policy: dbSecret.arn.apply(arn =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'secretsmanager:DescribeSecret',
            'secretsmanager:GetSecretValue',
            'secretsmanager:PutSecretValue',
            'secretsmanager:UpdateSecretVersionStage',
          ],
          Resource: arn,
        },
        {
          Effect: 'Allow',
          Action: ['secretsmanager:GetRandomPassword'],
          Resource: '*',
        },
      ],
    })
  ),
});

// RDS Aurora PostgreSQL Cluster
const rdsCluster = new aws.rds.Cluster(
  `payment-db-cluster-${environmentSuffix}`,
  {
    clusterIdentifier: `payment-cluster-${environmentSuffix}`,
    engine: 'aurora-postgresql',
    engineMode: 'provisioned',
    engineVersion: '14.6',
    databaseName: 'paymentdb',
    masterUsername: 'paymentadmin',
    masterPassword: pulumi.secret('ChangeMe123456!'), // Initial password
    dbSubnetGroupName: dbSubnetGroup.name,
    vpcSecurityGroupIds: [rdsSecurityGroup.id],
    storageEncrypted: true,
    kmsKeyId: rdsKmsKey.arn,
    backupRetentionPeriod: 7,
    preferredBackupWindow: '03:00-04:00',
    preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
    skipFinalSnapshot: true,
    enabledCloudwatchLogsExports: ['postgresql'],
    tags: tags,
  }
);

export const rdsInstance1 = new aws.rds.ClusterInstance(
  `payment-db-instance-1-${environmentSuffix}`,
  {
    identifier: `payment-instance-1-${environmentSuffix}`,
    clusterIdentifier: rdsCluster.id,
    instanceClass: 'db.r6g.large',
    engine: 'aurora-postgresql',
    engineVersion: rdsCluster.engineVersion,
    publiclyAccessible: false,
    tags: tags,
  }
);

export const rdsInstance2 = new aws.rds.ClusterInstance(
  `payment-db-instance-2-${environmentSuffix}`,
  {
    identifier: `payment-instance-2-${environmentSuffix}`,
    clusterIdentifier: rdsCluster.id,
    instanceClass: 'db.r6g.large',
    engine: 'aurora-postgresql',
    engineVersion: rdsCluster.engineVersion,
    publiclyAccessible: false,
    tags: tags,
  }
);

// ECR Repository
const ecrRepository = new aws.ecr.Repository(
  `payment-app-repo-${environmentSuffix}`,
  {
    name: `payment-app-${environmentSuffix}`,
    imageTagMutability: 'MUTABLE',
    imageScanningConfiguration: {
      scanOnPush: true,
    },
    encryptionConfigurations: [
      {
        encryptionType: 'AES256',
      },
    ],
    tags: tags,
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
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'ecs-tasks.amazonaws.com',
          },
          Effect: 'Allow',
        },
      ],
    }),
    managedPolicyArns: [
      'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    ],
    tags: tags,
  }
);

new aws.iam.RolePolicy(`ecs-task-execution-policy-${environmentSuffix}`, {
  role: ecsTaskExecutionRole.id,
  policy: dbSecret.arn.apply(arn =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['secretsmanager:GetSecretValue'],
          Resource: arn,
        },
        {
          Effect: 'Allow',
          Action: ['kms:Decrypt'],
          Resource: '*',
        },
      ],
    })
  ),
});

// ECS Task Role
const ecsTaskRole = new aws.iam.Role(`ecs-task-role-${environmentSuffix}`, {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Principal: {
          Service: 'ecs-tasks.amazonaws.com',
        },
        Effect: 'Allow',
      },
    ],
  }),
  tags: tags,
});

new aws.iam.RolePolicy(`ecs-task-policy-${environmentSuffix}`, {
  role: ecsTaskRole.id,
  policy: dbSecret.arn.apply(arn =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['secretsmanager:GetSecretValue'],
          Resource: arn,
        },
      ],
    })
  ),
});

// CloudWatch Log Group for ECS
const ecsLogGroup = new aws.cloudwatch.LogGroup(
  `ecs-log-group-${environmentSuffix}`,
  {
    name: `/ecs/payment-app-${environmentSuffix}`,
    retentionInDays: 2557, // 7 years (AWS valid value)
    tags: tags,
  }
);

// Security Group for ECS Tasks
const ecsSecurityGroup = new aws.ec2.SecurityGroup(
  `ecs-sg-${environmentSuffix}`,
  {
    vpcId: vpc.vpcId,
    description: 'Security group for ECS tasks',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
        cidrBlocks: ['10.0.0.0/16'],
        description: 'Application port from VPC',
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
    tags: tags,
  }
);

// Update RDS security group to allow ECS access
new aws.ec2.SecurityGroupRule(`rds-from-ecs-${environmentSuffix}`, {
  type: 'ingress',
  fromPort: 5432,
  toPort: 5432,
  protocol: 'tcp',
  securityGroupId: rdsSecurityGroup.id,
  sourceSecurityGroupId: ecsSecurityGroup.id,
  description: 'PostgreSQL access from ECS tasks',
});

// ECS Cluster
const ecsCluster = new aws.ecs.Cluster(`payment-cluster-${environmentSuffix}`, {
  name: `payment-cluster-${environmentSuffix}`,
  settings: [
    {
      name: 'containerInsights',
      value: 'enabled',
    },
  ],
  tags: tags,
});

// Application Load Balancer
const albSecurityGroup = new aws.ec2.SecurityGroup(
  `alb-sg-${environmentSuffix}`,
  {
    vpcId: vpc.vpcId,
    description: 'Security group for ALB',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'HTTPS from internet',
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
    tags: tags,
  }
);

// Application Load Balancer
// Note: Name field omitted to allow AWS to auto-generate unique names
const alb = new aws.lb.LoadBalancer(`payment-alb-${environmentSuffix}`, {
  internal: false,
  loadBalancerType: 'application',
  securityGroups: [albSecurityGroup.id],
  subnets: vpc.publicSubnetIds,
  enableDeletionProtection: false,
  tags: tags,
});

// Target Group
// Note: Name field omitted to allow AWS to auto-generate unique names
const targetGroup = new aws.lb.TargetGroup(`payment-tg-${environmentSuffix}`, {
  port: 8080,
  protocol: 'HTTP',
  vpcId: vpc.vpcId,
  targetType: 'ip',
  healthCheck: {
    enabled: true,
    path: '/health',
    protocol: 'HTTP',
    healthyThreshold: 2,
    unhealthyThreshold: 3,
    timeout: 5,
    interval: 30,
  },
  deregistrationDelay: 30,
  tags: tags,
});

// ALB HTTP Listener
// Note: Using HTTP for simplicity. For production, use HTTPS with a valid ACM certificate
const httpListener = new aws.lb.Listener(
  `http-listener-${environmentSuffix}`,
  {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: 'HTTP',
    defaultActions: [
      {
        type: 'forward',
        targetGroupArn: targetGroup.arn,
      },
    ],
    tags: tags,
  }
);

// ECS Task Definition
const taskDefinition = new aws.ecs.TaskDefinition(
  `payment-task-${environmentSuffix}`,
  {
    family: `payment-task-${environmentSuffix}`,
    networkMode: 'awsvpc',
    requiresCompatibilities: ['FARGATE'],
    cpu: '1024',
    memory: '2048',
    executionRoleArn: ecsTaskExecutionRole.arn,
    taskRoleArn: ecsTaskRole.arn,
    containerDefinitions: pulumi
      .all([ecrRepository.repositoryUrl, dbSecret.arn, ecsLogGroup.name])
      .apply(([repoUrl, secretArn, logGroupName]: [string, string, string]) =>
        JSON.stringify([
          {
            name: 'payment-app',
            image: `${repoUrl}:v1.0.0`, // Specific version, not latest
            essential: true,
            portMappings: [
              {
                containerPort: 8080,
                protocol: 'tcp',
              },
            ],
            environment: [
              { name: 'APP_ENV', value: 'production' },
              { name: 'REGION', value: region },
            ],
            secrets: [
              {
                name: 'DB_CREDENTIALS',
                valueFrom: secretArn,
              },
            ],
            logConfiguration: {
              logDriver: 'awslogs',
              options: {
                'awslogs-group': logGroupName,
                'awslogs-region': region,
                'awslogs-stream-prefix': 'payment-app',
              },
            },
          },
        ])
      ),
    tags: tags,
  }
);

// ECS Service
// Note: Name field omitted to allow AWS to auto-generate unique names
const ecsService = new aws.ecs.Service(
  `payment-service-${environmentSuffix}`,
  {
    cluster: ecsCluster.id,
    taskDefinition: taskDefinition.arn,
    desiredCount: 2,
    launchType: 'FARGATE',
    networkConfiguration: {
      subnets: vpc.privateSubnetIds,
      securityGroups: [ecsSecurityGroup.id],
      assignPublicIp: false,
    },
    loadBalancers: [
      {
        targetGroupArn: targetGroup.arn,
        containerName: 'payment-app',
        containerPort: 8080,
      },
    ],
    healthCheckGracePeriodSeconds: 60,
    tags: tags,
  },
  { dependsOn: [httpListener] }
);

// Auto Scaling for ECS Service
const ecsTarget = new aws.appautoscaling.Target(
  `ecs-target-${environmentSuffix}`,
  {
    maxCapacity: 10,
    minCapacity: 2,
    resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`,
    scalableDimension: 'ecs:service:DesiredCount',
    serviceNamespace: 'ecs',
  }
);

export const cpuScalingPolicy = new aws.appautoscaling.Policy(
  `cpu-scaling-${environmentSuffix}`,
  {
    name: `cpu-scaling-${environmentSuffix}`,
    policyType: 'TargetTrackingScaling',
    resourceId: ecsTarget.resourceId,
    scalableDimension: ecsTarget.scalableDimension,
    serviceNamespace: ecsTarget.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
      targetValue: 70.0,
      predefinedMetricSpecification: {
        predefinedMetricType: 'ECSServiceAverageCPUUtilization',
      },
      scaleInCooldown: 300,
      scaleOutCooldown: 60,
    },
  }
);

// S3 Bucket for Static Assets
const staticAssetsBucket = new aws.s3.Bucket(
  `static-assets-${environmentSuffix}`,
  {
    bucket: `payment-static-assets-${environmentSuffix}`,
    versioning: {
      enabled: true,
    },
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      },
    },
    lifecycleRules: [
      {
        enabled: true,
        noncurrentVersionTransitions: [
          {
            days: 30,
            storageClass: 'STANDARD_IA',
          },
        ],
        noncurrentVersionExpiration: {
          days: 90,
        },
      },
    ],
    tags: tags,
  }
);

// CloudFront OAI
const oai = new aws.cloudfront.OriginAccessIdentity(
  `oai-${environmentSuffix}`,
  {
    comment: `OAI for payment static assets ${environmentSuffix}`,
  }
);

// S3 Bucket Policy for CloudFront
new aws.s3.BucketPolicy(`static-assets-policy-${environmentSuffix}`, {
  bucket: staticAssetsBucket.id,
  policy: pulumi
    .all([staticAssetsBucket.arn, oai.iamArn])
    .apply(([bucketArn, oaiArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: oaiArn,
            },
            Action: 's3:GetObject',
            Resource: `${bucketArn}/*`,
          },
        ],
      })
    ),
});

// CloudFront Distribution
const cloudfront = new aws.cloudfront.Distribution(
  `payment-cdn-${environmentSuffix}`,
  {
    enabled: true,
    origins: [
      {
        originId: staticAssetsBucket.id,
        domainName: staticAssetsBucket.bucketRegionalDomainName,
        s3OriginConfig: {
          originAccessIdentity: oai.cloudfrontAccessIdentityPath,
        },
      },
    ],
    defaultRootObject: 'index.html',
    defaultCacheBehavior: {
      targetOriginId: staticAssetsBucket.id,
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      forwardedValues: {
        queryString: false,
        cookies: {
          forward: 'none',
        },
      },
      minTtl: 0,
      defaultTtl: 3600,
      maxTtl: 86400,
      compress: true,
    },
    restrictions: {
      geoRestriction: {
        restrictionType: 'none',
      },
    },
    viewerCertificate: {
      cloudfrontDefaultCertificate: true,
    },
    priceClass: 'PriceClass_100',
    tags: tags,
  }
);

// CloudWatch Alarms
export const cpuAlarmHigh = new aws.cloudwatch.MetricAlarm(
  `ecs-cpu-high-${environmentSuffix}`,
  {
    name: `ecs-cpu-high-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'CPUUtilization',
    namespace: 'AWS/ECS',
    period: 300,
    statistic: 'Average',
    threshold: 80,
    alarmDescription: 'ECS CPU utilization is too high',
    dimensions: {
      ClusterName: ecsCluster.name,
      ServiceName: ecsService.name,
    },
    tags: tags,
  }
);

export const memoryAlarmHigh = new aws.cloudwatch.MetricAlarm(
  `ecs-memory-high-${environmentSuffix}`,
  {
    name: `ecs-memory-high-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'MemoryUtilization',
    namespace: 'AWS/ECS',
    period: 300,
    statistic: 'Average',
    threshold: 80,
    alarmDescription: 'ECS memory utilization is too high',
    dimensions: {
      ClusterName: ecsCluster.name,
      ServiceName: ecsService.name,
    },
    tags: tags,
  }
);

export const unhealthyHostAlarm = new aws.cloudwatch.MetricAlarm(
  `alb-unhealthy-hosts-${environmentSuffix}`,
  {
    name: `alb-unhealthy-hosts-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'UnHealthyHostCount',
    namespace: 'AWS/ApplicationELB',
    period: 300,
    statistic: 'Average',
    threshold: 0,
    alarmDescription: 'ALB has unhealthy targets',
    dimensions: {
      LoadBalancer: alb.arnSuffix,
      TargetGroup: targetGroup.arnSuffix,
    },
    tags: tags,
  }
);

// Stack Outputs
// These exports become Pulumi stack outputs when re-exported from index.ts
export const vpcId = vpc.vpcId;
export const publicSubnetIds = vpc.publicSubnetIds;
export const privateSubnetIds = vpc.privateSubnetIds;
export const albDnsName = alb.dnsName;
export const albArn = alb.arn;
export const ecsClusterArn = ecsCluster.arn;
export const ecsServiceName = ecsService.name;
export const rdsClusterEndpoint = rdsCluster.endpoint;
export const rdsClusterReadEndpoint = rdsCluster.readerEndpoint;
export const dbSecretArn = dbSecret.arn;
export const ecrRepositoryUrl = ecrRepository.repositoryUrl;
export const cloudfrontDomainName = cloudfront.domainName;
export const staticAssetsBucketName = staticAssetsBucket.bucket;
export const flowLogsBucketName = flowLogsBucket.bucket;
