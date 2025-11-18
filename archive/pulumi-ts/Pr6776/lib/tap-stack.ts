/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for the payment processing web application infrastructure.
 * This stack creates a complete multi-tier architecture with VPC, ECS Fargate, RDS Aurora,
 * Application Load Balancer, and comprehensive monitoring and logging.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as tls from '@pulumi/tls';
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
 * Main Pulumi component resource for the payment processing infrastructure.
 *
 * Creates:
 * - VPC with 3 public and 3 private subnets across 3 AZs
 * - NAT Gateways for outbound connectivity
 * - ECS Fargate cluster and service
 * - RDS Aurora MySQL cluster (multi-AZ, encrypted)
 * - Application Load Balancer with HTTPS
 * - S3 bucket for VPC flow logs
 * - CloudWatch log groups and monitoring
 * - KMS keys for encryption
 * - IAM roles and security groups
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly rdsClusterEndpoint: pulumi.Output<string>;
  public readonly flowLogsBucketName: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const currentRegion =
      process.env.AWS_REGION || aws.config.region || 'us-east-2';
    const region = aws.getRegionOutput({}, { parent: this });

    const defaultTags = {
      Environment: 'production',
      Application: 'payment-processor',
      CostCenter: 'fintech-payments',
      ...(typeof args.tags === 'object' && args.tags !== null ? args.tags : {}),
    };

    // ===== VPC and Networking =====

    // Get available AZs for the region
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...defaultTags,
          Name: `payment-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `payment-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `payment-igw-${environmentSuffix}`,
        },
      },
      { parent: vpc }
    );

    // Create 3 public subnets in different AZs
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `payment-public-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            ...defaultTags,
            Name: `payment-public-subnet-${i + 1}-${environmentSuffix}`,
            Tier: 'Public',
          },
        },
        { parent: vpc }
      );
      publicSubnets.push(subnet);
    }

    // Create 3 private subnets in different AZs
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `payment-private-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: false,
          tags: {
            ...defaultTags,
            Name: `payment-private-subnet-${i + 1}-${environmentSuffix}`,
            Tier: 'Private',
          },
        },
        { parent: vpc }
      );
      privateSubnets.push(subnet);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `payment-public-rt-${environmentSuffix}`,
        },
      },
      { parent: vpc }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `payment-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: publicRouteTable }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `payment-public-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: publicRouteTable }
      );
    });

    // Create Elastic IPs and NAT Gateways for each AZ
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(
        `payment-nat-eip-${i + 1}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...defaultTags,
            Name: `payment-nat-eip-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: vpc }
      );

      const natGateway = new aws.ec2.NatGateway(
        `payment-nat-${i + 1}-${environmentSuffix}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnets[i].id,
          tags: {
            ...defaultTags,
            Name: `payment-nat-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: publicSubnets[i], dependsOn: [internetGateway] }
      );
      natGateways.push(natGateway);
    }

    // Create private route tables (one per AZ for HA)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `payment-private-rt-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            ...defaultTags,
            Name: `payment-private-rt-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: vpc }
      );

      // Route to NAT Gateway
      new aws.ec2.Route(
        `payment-private-route-${i + 1}-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: privateRouteTable }
      );

      // Associate private subnet with route table
      new aws.ec2.RouteTableAssociation(
        `payment-private-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: privateRouteTable }
      );
    });

    // ===== S3 Bucket for VPC Flow Logs =====

    const flowLogsBucket = new aws.s3.Bucket(
      `payment-flow-logs-${environmentSuffix}`,
      {
        bucket: `payment-flow-logs-${environmentSuffix}-${currentRegion}`,
        forceDestroy: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Enable versioning
    new aws.s3.BucketVersioning(
      `payment-flow-logs-versioning-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: flowLogsBucket }
    );

    // Enable server-side encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `payment-flow-logs-encryption-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: flowLogsBucket }
    );

    // Lifecycle rule to transition to Glacier after 90 days
    new aws.s3.BucketLifecycleConfiguration(
      `payment-flow-logs-lifecycle-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        rules: [
          {
            id: 'transition-to-glacier',
            status: 'Enabled',
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      },
      { parent: flowLogsBucket }
    );

    // Bucket policy for VPC Flow Logs
    const flowLogsBucketPolicy = new aws.s3.BucketPolicy(
      `payment-flow-logs-policy-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        policy: pulumi.all([flowLogsBucket.arn, region.name]).apply(([arn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AWSLogDeliveryWrite',
                Effect: 'Allow',
                Principal: {
                  Service: 'delivery.logs.amazonaws.com',
                },
                Action: 's3:PutObject',
                Resource: `${arn}/*`,
                Condition: {
                  StringEquals: {
                    's3:x-amz-acl': 'bucket-owner-full-control',
                  },
                },
              },
              {
                Sid: 'AWSLogDeliveryAclCheck',
                Effect: 'Allow',
                Principal: {
                  Service: 'delivery.logs.amazonaws.com',
                },
                Action: 's3:GetBucketAcl',
                Resource: arn,
              },
            ],
          })
        ),
      },
      { parent: flowLogsBucket }
    );

    // Enable VPC Flow Logs
    new aws.ec2.FlowLog(
      `payment-vpc-flow-log-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        trafficType: 'ALL',
        logDestinationType: 's3',
        logDestination: flowLogsBucket.arn,
        tags: defaultTags,
      },
      { parent: vpc, dependsOn: [flowLogsBucketPolicy] }
    );

    // ===== KMS Key for RDS Encryption =====

    const rdsKmsKey = new aws.kms.Key(
      `payment-rds-kms-${environmentSuffix}`,
      {
        description: `KMS key for RDS encryption (${environmentSuffix})`,
        enableKeyRotation: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `payment-rds-kms-alias-${environmentSuffix}`,
      {
        name: `alias/payment-rds-${environmentSuffix}`,
        targetKeyId: rdsKmsKey.id,
      },
      { parent: rdsKmsKey }
    );

    // ===== Security Groups =====

    // ALB Security Group
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for payment processing ALB',
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
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...defaultTags,
          Name: `payment-alb-sg-${environmentSuffix}`,
        },
      },
      { parent: vpc }
    );

    // ECS Security Group
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-ecs-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for payment processing ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [albSecurityGroup.id],
            description: 'Traffic from ALB',
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
          ...defaultTags,
          Name: `payment-ecs-sg-${environmentSuffix}`,
        },
      },
      { parent: vpc }
    );

    // RDS Security Group
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-rds-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for payment processing RDS Aurora',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            securityGroups: [ecsSecurityGroup.id],
            description: 'MySQL from ECS tasks',
          },
        ],
        egress: [],
        tags: {
          ...defaultTags,
          Name: `payment-rds-sg-${environmentSuffix}`,
        },
      },
      { parent: vpc }
    );

    // ===== CloudWatch Log Groups =====

    const ecsLogGroup = new aws.cloudwatch.LogGroup(
      `payment-ecs-logs-${environmentSuffix}`,
      {
        name: `/ecs/payment-processor-${environmentSuffix}`,
        retentionInDays: 2557, // 7 years (closest valid value)
        tags: defaultTags,
      },
      { parent: this }
    );

    // RDS Log Group - Aurora exports slow query logs to CloudWatch automatically
    new aws.cloudwatch.LogGroup(
      `payment-rds-logs-${environmentSuffix}`,
      {
        name: `/aws/rds/cluster/payment-aurora-${environmentSuffix}/slowquery`,
        retentionInDays: 2557, // 7 years (closest valid value)
        tags: defaultTags,
      },
      { parent: this }
    );

    // ===== RDS Aurora MySQL Cluster =====

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `payment-db-subnet-group-${environmentSuffix}`,
      {
        name: `payment-db-subnet-group-${environmentSuffix}`,
        subnetIds: privateSubnets.map(s => s.id),
        tags: {
          ...defaultTags,
          Name: `payment-db-subnet-group-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create DB cluster parameter group
    const dbClusterParameterGroup = new aws.rds.ClusterParameterGroup(
      `payment-db-cluster-pg-${environmentSuffix}`,
      {
        name: `payment-aurora-cluster-pg-${environmentSuffix}`,
        family: 'aurora-mysql8.0',
        description: 'Cluster parameter group for payment processing Aurora',
        parameters: [
          {
            name: 'slow_query_log',
            value: '1',
          },
          {
            name: 'long_query_time',
            value: '2',
          },
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create Aurora cluster
    const auroraCluster = new aws.rds.Cluster(
      `payment-aurora-${environmentSuffix}`,
      {
        clusterIdentifier: `payment-aurora-${environmentSuffix}`,
        engine: 'aurora-mysql',
        engineVersion: '8.0.mysql_aurora.3.04.0',
        engineMode: 'provisioned',
        databaseName: 'payments',
        masterUsername: 'admin',
        masterPassword: pulumi.secret('ChangeThisPassword123!'),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbClusterParameterGroupName: dbClusterParameterGroup.name,
        backupRetentionPeriod: 35,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        storageEncrypted: true,
        kmsKeyId: rdsKmsKey.arn,
        enabledCloudwatchLogsExports: ['slowquery'],
        skipFinalSnapshot: true,
        applyImmediately: true,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create Aurora cluster instances (multi-AZ)
    const auroraInstances = [];
    for (let i = 0; i < 2; i++) {
      const instance = new aws.rds.ClusterInstance(
        `payment-aurora-instance-${i + 1}-${environmentSuffix}`,
        {
          clusterIdentifier: auroraCluster.id,
          identifier: `payment-aurora-instance-${i + 1}-${environmentSuffix}`,
          instanceClass: 'db.t3.medium',
          engine: 'aurora-mysql',
          engineVersion: '8.0.mysql_aurora.3.04.0',
          publiclyAccessible: false,
          tags: defaultTags,
        },
        { parent: auroraCluster }
      );
      auroraInstances.push(instance);
    }

    // ===== IAM Roles =====

    // ECS Task Execution Role
    const ecsTaskExecutionRole = new aws.iam.Role(
      `payment-ecs-exec-role-${environmentSuffix}`,
      {
        name: `payment-ecs-exec-role-${environmentSuffix}`,
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // Attach managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `payment-ecs-exec-policy-${environmentSuffix}`,
      {
        role: ecsTaskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: ecsTaskExecutionRole }
    );

    // ECS Task Role with specific S3 and Secrets Manager permissions
    const ecsTaskRole = new aws.iam.Role(
      `payment-ecs-task-role-${environmentSuffix}`,
      {
        name: `payment-ecs-task-role-${environmentSuffix}`,
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
        tags: defaultTags,
      },
      { parent: this }
    );

    // Task role policy for S3 (specific permissions, no wildcards)
    const ecsTaskS3Policy = new aws.iam.Policy(
      `payment-ecs-task-s3-policy-${environmentSuffix}`,
      {
        name: `payment-ecs-task-s3-policy-${environmentSuffix}`,
        description: 'S3 permissions for ECS tasks',
        policy: flowLogsBucket.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject'],
                Resource: `${arn}/application-data/*`,
              },
              {
                Effect: 'Allow',
                Action: ['s3:ListBucket'],
                Resource: arn,
                Condition: {
                  StringLike: {
                    's3:prefix': ['application-data/*'],
                  },
                },
              },
            ],
          })
        ),
        tags: defaultTags,
      },
      { parent: ecsTaskRole }
    );

    new aws.iam.RolePolicyAttachment(
      `payment-ecs-task-s3-attach-${environmentSuffix}`,
      {
        role: ecsTaskRole.name,
        policyArn: ecsTaskS3Policy.arn,
      },
      { parent: ecsTaskRole }
    );

    // Task role policy for Secrets Manager (specific permissions)
    const ecsTaskSecretsPolicy = new aws.iam.Policy(
      `payment-ecs-task-secrets-policy-${environmentSuffix}`,
      {
        name: `payment-ecs-task-secrets-policy-${environmentSuffix}`,
        description: 'Secrets Manager permissions for ECS tasks',
        policy: region.name.apply(regionName =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['secretsmanager:GetSecretValue'],
                Resource: `arn:aws:secretsmanager:${regionName}:*:secret:payment-*`,
              },
            ],
          })
        ),
        tags: defaultTags,
      },
      { parent: ecsTaskRole }
    );

    new aws.iam.RolePolicyAttachment(
      `payment-ecs-task-secrets-attach-${environmentSuffix}`,
      {
        role: ecsTaskRole.name,
        policyArn: ecsTaskSecretsPolicy.arn,
      },
      { parent: ecsTaskRole }
    );

    // ===== ECS Cluster =====

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
        tags: defaultTags,
      },
      { parent: this }
    );

    // ===== Application Load Balancer =====

    const alb = new aws.lb.LoadBalancer(
      `payment-alb-${environmentSuffix}`,
      {
        name: `payment-alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnets.map(s => s.id),
        enableDeletionProtection: false,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Target Group for ECS tasks
    const targetGroup = new aws.lb.TargetGroup(
      `payment-tg-${environmentSuffix}`,
      {
        name: `payment-tg-${environmentSuffix}`,
        port: 8080,
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
        tags: defaultTags,
      },
      { parent: alb }
    );

    // Create self-signed certificate for HTTPS
    // In production, you would use ACM with a real domain
    const privateKey = new tls.PrivateKey(
      `payment-cert-key-${environmentSuffix}`,
      {
        algorithm: 'RSA',
        rsaBits: 2048,
      },
      { parent: this }
    );

    const selfSignedCert = new tls.SelfSignedCert(
      `payment-cert-${environmentSuffix}`,
      {
        privateKeyPem: privateKey.privateKeyPem,
        subject: {
          commonName: 'payment-processor.local',
          organization: 'Payment Processing Inc',
        },
        validityPeriodHours: 8760, // 1 year
        allowedUses: ['key_encipherment', 'digital_signature', 'server_auth'],
      },
      { parent: privateKey }
    );

    const acmCertificate = new aws.acm.Certificate(
      `payment-cert-${environmentSuffix}`,
      {
        privateKey: privateKey.privateKeyPem,
        certificateBody: selfSignedCert.certPem,
        tags: defaultTags,
      },
      { parent: this }
    );

    // HTTPS Listener
    const httpsListener = new aws.lb.Listener(
      `payment-https-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 443,
        protocol: 'HTTPS',
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        certificateArn: acmCertificate.arn,
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        tags: defaultTags,
      },
      { parent: alb }
    );

    // ===== ECS Task Definition and Service =====

    const taskDefinition = new aws.ecs.TaskDefinition(
      `payment-task-${environmentSuffix}`,
      {
        family: `payment-task-${environmentSuffix}`,
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '512',
        memory: '1024',
        executionRoleArn: ecsTaskExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi
          .all([
            ecsLogGroup.name,
            region.name,
            auroraCluster.endpoint,
            flowLogsBucket.bucket,
          ])
          .apply(([logGroupName, regionName, dbEndpoint, bucketName]) =>
            JSON.stringify([
              {
                name: 'payment-processor',
                image: 'hashicorp/http-echo:latest', // Simple HTTP server that responds on any path
                cpu: 512,
                memory: 1024,
                essential: true,
                command: ['-text=Payment Processor Service', '-listen=:8080'],
                portMappings: [
                  {
                    containerPort: 8080,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'DB_ENDPOINT',
                    value: dbEndpoint,
                  },
                  {
                    name: 'S3_BUCKET',
                    value: bucketName,
                  },
                  {
                    name: 'AWS_REGION',
                    value: regionName,
                  },
                ],
                logConfiguration: {
                  logDriver: 'awslogs',
                  options: {
                    'awslogs-group': logGroupName,
                    'awslogs-region': regionName,
                    'awslogs-stream-prefix': 'ecs',
                  },
                },
              },
            ])
          ),
        tags: defaultTags,
      },
      { parent: ecsCluster }
    );

    // ECS Service - runs tasks in private subnets behind ALB
    new aws.ecs.Service(
      `payment-service-${environmentSuffix}`,
      {
        name: `payment-service-${environmentSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          assignPublicIp: false,
          subnets: privateSubnets.map(s => s.id),
          securityGroups: [ecsSecurityGroup.id],
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: 'payment-processor',
            containerPort: 8080,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        tags: defaultTags,
      },
      { parent: ecsCluster, dependsOn: [httpsListener] }
    );

    // ===== Exports =====

    this.albDnsName = alb.dnsName;
    this.rdsClusterEndpoint = auroraCluster.endpoint;
    this.flowLogsBucketName = flowLogsBucket.bucket;
    this.vpcId = vpc.id;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      rdsClusterEndpoint: this.rdsClusterEndpoint,
      flowLogsBucketName: this.flowLogsBucketName,
      vpcId: this.vpcId,
    });
  }
}
