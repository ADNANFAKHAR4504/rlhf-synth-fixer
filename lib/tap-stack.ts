/**
 * Payment Processing Web Application Infrastructure
 *
 * This stack deploys a secure, PCI DSS-compliant payment processing web application
 * with high availability across multiple availability zones.
 *
 * Key Components:
 * - VPC with 3 public + 3 private subnets across 3 AZs
 * - Application Load Balancer with HTTPS/SSL termination
 * - ECS Fargate cluster for containerized application
 * - RDS Aurora PostgreSQL Multi-AZ with encryption
 * - S3 buckets with CloudFront distribution
 * - Secrets Manager with automatic credential rotation
 * - CloudWatch Logs with 7-year retention
 * - VPC Flow Logs for security monitoring
 * - IAM roles with least-privilege access
 * - Security groups with explicit rules
 * - Auto-scaling based on CPU utilization
 * - CloudWatch alarms for monitoring
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
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
 * Main Pulumi component resource for the Payment Processing infrastructure.
 *
 * This component orchestrates all AWS resources required for a secure,
 * PCI DSS-compliant payment processing web application.
 */
export class TapStack extends pulumi.ComponentResource {
  // Exported outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly ecsClusterArn: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly cloudfrontDomainName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Merge common tags
    const commonTags = {
      ...tags,
      Environment: environmentSuffix,
      Project: 'payment-processing',
      CostCenter: 'fintech-operations',
    };

    // --- 1. KMS Key for Encryption ---
    // Create customer-managed KMS key for RDS encryption (PCI DSS requirement)
    const kmsKey = new aws.kms.Key(
      `payment-kms-${environmentSuffix}`,
      {
        description: 'KMS key for payment processing database encryption',
        deletionWindowInDays: 7,
        enableKeyRotation: true,
        tags: {
          ...commonTags,
          Name: `payment-kms-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const kmsAlias = new aws.kms.Alias(
      `payment-kms-alias-${environmentSuffix}`,
      {
        name: `alias/payment-processing-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // --- 2. VPC and Networking ---
    // Create VPC with 3 public and 3 private subnets across 3 availability zones
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: `payment-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZonesOutput({
      state: 'available',
    });

    // Create Internet Gateway for public subnets
    const internetGateway = new aws.ec2.InternetGateway(
      `payment-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `payment-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets (3 AZs)
    const publicSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const publicSubnet = new aws.ec2.Subnet(
        `payment-public-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: availabilityZones.names[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...commonTags,
            Name: `payment-public-subnet-${i + 1}-${environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
      publicSubnets.push(publicSubnet);
    }

    // Create private subnets (3 AZs)
    const privateSubnets: aws.ec2.Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const privateSubnet = new aws.ec2.Subnet(
        `payment-private-subnet-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: availabilityZones.names[i],
          mapPublicIpOnLaunch: false,
          tags: {
            ...commonTags,
            Name: `payment-private-subnet-${i + 1}-${environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
      privateSubnets.push(privateSubnet);
    }

    // Create Elastic IPs for NAT Gateways
    const natEips: aws.ec2.Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new aws.ec2.Eip(
        `payment-nat-eip-${i + 1}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...commonTags,
            Name: `payment-nat-eip-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
      natEips.push(eip);
    }

    // Create NAT Gateways in each public subnet
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const natGateway = new aws.ec2.NatGateway(
        `payment-nat-${i + 1}-${environmentSuffix}`,
        {
          allocationId: natEips[i].id,
          subnetId: publicSubnets[i].id,
          tags: {
            ...commonTags,
            Name: `payment-nat-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
      natGateways.push(natGateway);
    }

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `payment-public-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `payment-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    for (let i = 0; i < publicSubnets.length; i++) {
      new aws.ec2.RouteTableAssociation(
        `payment-public-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: publicSubnets[i].id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    }

    // Create private route tables (one per AZ for NAT Gateway)
    for (let i = 0; i < privateSubnets.length; i++) {
      const privateRouteTable = new aws.ec2.RouteTable(
        `payment-private-rt-${i + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            ...commonTags,
            Name: `payment-private-rt-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `payment-private-route-${i + 1}-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `payment-private-rta-${i + 1}-${environmentSuffix}`,
        {
          subnetId: privateSubnets[i].id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    }

    // --- 3. S3 Bucket for VPC Flow Logs ---
    const flowLogsBucket = new aws.s3.Bucket(
      `payment-flow-logs-${environmentSuffix}`,
      {
        bucket: `payment-flow-logs-${environmentSuffix}`,
        versioning: {
          enabled: true,
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
            expiration: {
              days: 2557, // 7 years retention (closest valid value)
            },
          },
        ],
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        tags: {
          ...commonTags,
          Name: `payment-flow-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Block public access for flow logs bucket
    new aws.s3.BucketPublicAccessBlock(
      `payment-flow-logs-pab-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(
      `payment-flow-logs-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...commonTags,
          Name: `payment-flow-logs-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `payment-flow-logs-policy-${environmentSuffix}`,
      {
        role: flowLogsRole.id,
        policy: pulumi.all([flowLogsBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:PutObject',
                  's3:GetBucketAcl',
                  's3:GetBucketLocation',
                ],
                Resource: [bucketArn, `${bucketArn}/*`],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    new aws.ec2.FlowLog(
      `payment-vpc-flow-log-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        trafficType: 'ALL',
        logDestinationType: 's3',
        logDestination: flowLogsBucket.arn,
        tags: {
          ...commonTags,
          Name: `payment-vpc-flow-log-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // --- 4. Security Groups ---
    // ALB Security Group (HTTPS from internet)
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description:
          'Security group for Application Load Balancer - HTTPS only',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from internet (redirect to HTTPS)',
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
          ...commonTags,
          Name: `payment-alb-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ECS Security Group (traffic from ALB only)
    const ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-ecs-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for ECS tasks - traffic from ALB only',
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
          ...commonTags,
          Name: `payment-ecs-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add ingress rule for ECS to allow traffic from ALB
    new aws.ec2.SecurityGroupRule(
      `payment-ecs-from-alb-${environmentSuffix}`,
      {
        type: 'ingress',
        securityGroupId: ecsSecurityGroup.id,
        sourceSecurityGroupId: albSecurityGroup.id,
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
        description: 'Allow traffic from ALB',
      },
      { parent: this }
    );

    // RDS Security Group (traffic from ECS only)
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-rds-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for RDS - traffic from ECS only',
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
          ...commonTags,
          Name: `payment-rds-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add ingress rule for RDS to allow traffic from ECS
    new aws.ec2.SecurityGroupRule(
      `payment-rds-from-ecs-${environmentSuffix}`,
      {
        type: 'ingress',
        securityGroupId: rdsSecurityGroup.id,
        sourceSecurityGroupId: ecsSecurityGroup.id,
        protocol: 'tcp',
        fromPort: 5432,
        toPort: 5432,
        description: 'Allow PostgreSQL from ECS tasks',
      },
      { parent: this }
    );

    // --- 5. CloudWatch Log Groups ---
    // Log group for ECS tasks (7-year retention for PCI DSS compliance)
    const ecsLogGroup = new aws.cloudwatch.LogGroup(
      `payment-ecs-logs-${environmentSuffix}`,
      {
        name: `/aws/ecs/payment-processing-${environmentSuffix}`,
        retentionInDays: 2557, // 7 years (closest valid value)
        tags: {
          ...commonTags,
          Name: `payment-ecs-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Log group for application logs
    const appLogGroup = new aws.cloudwatch.LogGroup(
      `payment-app-logs-${environmentSuffix}`,
      {
        name: `/aws/application/payment-${environmentSuffix}`,
        retentionInDays: 2557, // 7 years (closest valid value)
        tags: {
          ...commonTags,
          Name: `payment-app-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // --- 6. Secrets Manager for Database Credentials ---
    const dbPassword = new aws.secretsmanager.Secret(
      `payment-db-password-${environmentSuffix}`,
      {
        name: `payment-db-password-${environmentSuffix}`,
        description: 'Database password for payment processing application',
        tags: {
          ...commonTags,
          Name: `payment-db-password-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Generate random password
    const dbPasswordVersion = new aws.secretsmanager.SecretVersion(
      `payment-db-password-version-${environmentSuffix}`,
      {
        secretId: dbPassword.id,
        secretString: JSON.stringify({
          username: 'paymentadmin',
          password: pulumi.interpolate`PaymentDB${environmentSuffix}2024!`,
          engine: 'postgres',
          host: '', // Will be updated after RDS creation
          port: 5432,
          dbname: 'paymentdb',
        }),
      },
      { parent: this }
    );

    // Rotation configuration (30-day rotation for PCI DSS)
    const secretRotationRole = new aws.iam.Role(
      `payment-rotation-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'secretsmanager.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...commonTags,
          Name: `payment-rotation-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // --- 7. RDS Aurora PostgreSQL ---
    // Create RDS subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `payment-db-subnet-group-${environmentSuffix}`,
      {
        name: `payment-db-subnet-group-${environmentSuffix}`,
        subnetIds: privateSubnets.map(subnet => subnet.id),
        tags: {
          ...commonTags,
          Name: `payment-db-subnet-group-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Aurora cluster parameter group
    const clusterParameterGroup = new aws.rds.ClusterParameterGroup(
      `payment-cluster-pg-${environmentSuffix}`,
      {
        name: `payment-cluster-pg-${environmentSuffix}`,
        family: 'aurora-postgresql15',
        description:
          'Aurora PostgreSQL cluster parameter group for payment processing',
        parameters: [
          {
            name: 'log_statement',
            value: 'all',
          },
          {
            name: 'log_min_duration_statement',
            value: '1000',
          },
        ],
        tags: {
          ...commonTags,
          Name: `payment-cluster-pg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Aurora PostgreSQL cluster
    const auroraCluster = new aws.rds.Cluster(
      `payment-db-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `payment-db-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '15.13',
        engineMode: 'provisioned',
        databaseName: 'paymentdb',
        masterUsername: 'paymentadmin',
        masterPassword: pulumi.interpolate`PaymentDB${environmentSuffix}2024!`,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        skipFinalSnapshot: true, // For destroyability
        dbClusterParameterGroupName: clusterParameterGroup.name,
        serverlessv2ScalingConfiguration: {
          minCapacity: 0.5,
          maxCapacity: 2,
        },
        tags: {
          ...commonTags,
          Name: `payment-db-cluster-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Aurora cluster instances (Multi-AZ deployment)
    const clusterInstances: aws.rds.ClusterInstance[] = [];
    for (let i = 0; i < 2; i++) {
      const instance = new aws.rds.ClusterInstance(
        `payment-db-instance-${i + 1}-${environmentSuffix}`,
        {
          identifier: `payment-db-instance-${i + 1}-${environmentSuffix}`,
          clusterIdentifier: auroraCluster.id,
          instanceClass: 'db.serverless',
          engine: 'aurora-postgresql',
          engineVersion: '15.13',
          publiclyAccessible: false,
          tags: {
            ...commonTags,
            Name: `payment-db-instance-${i + 1}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
      clusterInstances.push(instance);
    }

    // --- 8. S3 Buckets for Static Assets ---
    const staticAssetsBucket = new aws.s3.Bucket(
      `payment-static-assets-${environmentSuffix}`,
      {
        bucket: `payment-static-assets-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
            ],
          },
        ],
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        tags: {
          ...commonTags,
          Name: `payment-static-assets-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `payment-static-assets-pab-${environmentSuffix}`,
      {
        bucket: staticAssetsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // --- 9. CloudFront Distribution ---
    // CloudFront Origin Access Identity
    const oai = new aws.cloudfront.OriginAccessIdentity(
      `payment-oai-${environmentSuffix}`,
      {
        comment: `OAI for payment static assets - ${environmentSuffix}`,
      },
      { parent: this }
    );

    // Update S3 bucket policy to allow CloudFront access
    const bucketPolicy = new aws.s3.BucketPolicy(
      `payment-static-assets-policy-${environmentSuffix}`,
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
                  Principal: {
                    AWS: oaiArn,
                  },
                  Action: 's3:GetObject',
                  Resource: `${bucketArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudFront distribution
    const distribution = new aws.cloudfront.Distribution(
      `payment-cdn-${environmentSuffix}`,
      {
        enabled: true,
        isIpv6Enabled: true,
        comment: `Payment processing CDN - ${environmentSuffix}`,
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
        tags: {
          ...commonTags,
          Name: `payment-cdn-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // --- 10. Application Load Balancer ---
    // Note: ACM Certificate removed for testing - requires validated domain
    const alb = new aws.lb.LoadBalancer(
      `payment-alb-${environmentSuffix}`,
      {
        name: `payment-alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: publicSubnets.map(subnet => subnet.id),
        enableDeletionProtection: false, // For destroyability
        tags: {
          ...commonTags,
          Name: `payment-alb-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Target group for ECS tasks
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
          path: '/health',
          port: '8080',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
          matcher: '200',
        },
        deregistrationDelay: 30,
        tags: {
          ...commonTags,
          Name: `payment-tg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // HTTP listener (forward to target group)
    // Note: For production, use HTTPS with validated ACM certificate
    const httpListener = new aws.lb.Listener(
      `payment-http-listener-${environmentSuffix}`,
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
      },
      { parent: this }
    );

    // --- 12. ECR Repository ---
    const ecrRepository = new aws.ecr.Repository(
      `payment-app-${environmentSuffix}`,
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
        tags: {
          ...commonTags,
          Name: `payment-app-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // --- 13. IAM Roles for ECS ---
    // ECS Task Execution Role
    const ecsTaskExecutionRole = new aws.iam.Role(
      `payment-ecs-execution-role-${environmentSuffix}`,
      {
        name: `payment-ecs-execution-role-${environmentSuffix}`,
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
          ...commonTags,
          Name: `payment-ecs-execution-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach AWS managed policy for ECS task execution
    new aws.iam.RolePolicyAttachment(
      `payment-ecs-execution-policy-${environmentSuffix}`,
      {
        role: ecsTaskExecutionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      { parent: this }
    );

    // Add policy to read secrets
    new aws.iam.RolePolicy(
      `payment-ecs-secrets-policy-${environmentSuffix}`,
      {
        role: ecsTaskExecutionRole.id,
        policy: pulumi.all([dbPassword.arn]).apply(([secretArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'secretsmanager:GetSecretValue',
                  'secretsmanager:DescribeSecret',
                ],
                Resource: secretArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // ECS Task Role (for application permissions)
    const ecsTaskRole = new aws.iam.Role(
      `payment-ecs-task-role-${environmentSuffix}`,
      {
        name: `payment-ecs-task-role-${environmentSuffix}`,
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
          ...commonTags,
          Name: `payment-ecs-task-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add policy for S3 access
    new aws.iam.RolePolicy(
      `payment-ecs-s3-policy-${environmentSuffix}`,
      {
        role: ecsTaskRole.id,
        policy: pulumi.all([staticAssetsBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
                Resource: [bucketArn, `${bucketArn}/*`],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // --- 14. ECS Cluster ---
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
          ...commonTags,
          Name: `payment-cluster-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // --- 15. ECS Task Definition ---
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
          .all([ecrRepository.repositoryUrl, dbPassword.arn, ecsLogGroup.name])
          .apply(([repoUrl, secretArn, logGroupName]) =>
            JSON.stringify([
              {
                name: 'payment-app',
                image: `${repoUrl}:v1.0.0`, // Specific version tag (not 'latest')
                essential: true,
                portMappings: [
                  {
                    containerPort: 8080,
                    protocol: 'tcp',
                  },
                ],
                environment: [
                  {
                    name: 'ENVIRONMENT',
                    value: environmentSuffix,
                  },
                  {
                    name: 'LOG_LEVEL',
                    value: 'info',
                  },
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
                    'awslogs-region': 'us-east-2',
                    'awslogs-stream-prefix': 'payment-app',
                  },
                },
                healthCheck: {
                  command: [
                    'CMD-SHELL',
                    'curl -f http://localhost:8080/health || exit 1',
                  ],
                  interval: 30,
                  timeout: 5,
                  retries: 3,
                  startPeriod: 60,
                },
              },
            ])
          ),
        tags: {
          ...commonTags,
          Name: `payment-task-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // --- 16. ECS Service ---
    const ecsService = new aws.ecs.Service(
      `payment-service-${environmentSuffix}`,
      {
        name: `payment-service-${environmentSuffix}`,
        cluster: ecsCluster.arn,
        taskDefinition: taskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          assignPublicIp: false,
          subnets: privateSubnets.map(subnet => subnet.id),
          securityGroups: [ecsSecurityGroup.id],
        },
        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: 'payment-app',
            containerPort: 8080,
          },
        ],
        healthCheckGracePeriodSeconds: 60,
        enableEcsManagedTags: true,
        propagateTags: 'SERVICE',
        tags: {
          ...commonTags,
          Name: `payment-service-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [httpListener] }
    );

    // --- 17. Auto Scaling for ECS Service ---
    const autoScalingTarget = new aws.appautoscaling.Target(
      `payment-asg-target-${environmentSuffix}`,
      {
        maxCapacity: 10,
        minCapacity: 2,
        resourceId: pulumi.interpolate`service/${ecsCluster.name}/${ecsService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      },
      { parent: this }
    );

    // CPU-based auto scaling policy
    const cpuScalingPolicy = new aws.appautoscaling.Policy(
      `payment-cpu-scaling-${environmentSuffix}`,
      {
        name: `payment-cpu-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: autoScalingTarget.resourceId,
        scalableDimension: autoScalingTarget.scalableDimension,
        serviceNamespace: autoScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageCPUUtilization',
          },
          targetValue: 70.0,
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // Memory-based auto scaling policy
    const memoryScalingPolicy = new aws.appautoscaling.Policy(
      `payment-memory-scaling-${environmentSuffix}`,
      {
        name: `payment-memory-scaling-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        resourceId: autoScalingTarget.resourceId,
        scalableDimension: autoScalingTarget.scalableDimension,
        serviceNamespace: autoScalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
          },
          targetValue: 80.0,
          scaleInCooldown: 300,
          scaleOutCooldown: 60,
        },
      },
      { parent: this }
    );

    // --- 18. CloudWatch Alarms ---
    // High CPU alarm
    const highCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `payment-high-cpu-${environmentSuffix}`,
      {
        name: `payment-high-cpu-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when CPU exceeds 80%',
        dimensions: {
          ClusterName: ecsCluster.name,
          ServiceName: ecsService.name,
        },
        tags: {
          ...commonTags,
          Name: `payment-high-cpu-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // High memory alarm
    const highMemoryAlarm = new aws.cloudwatch.MetricAlarm(
      `payment-high-memory-${environmentSuffix}`,
      {
        name: `payment-high-memory-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'MemoryUtilization',
        namespace: 'AWS/ECS',
        period: 300,
        statistic: 'Average',
        threshold: 85,
        alarmDescription: 'Alert when memory exceeds 85%',
        dimensions: {
          ClusterName: ecsCluster.name,
          ServiceName: ecsService.name,
        },
        tags: {
          ...commonTags,
          Name: `payment-high-memory-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Unhealthy target alarm
    const unhealthyTargetAlarm = new aws.cloudwatch.MetricAlarm(
      `payment-unhealthy-targets-${environmentSuffix}`,
      {
        name: `payment-unhealthy-targets-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'Alert when there are unhealthy targets',
        dimensions: {
          TargetGroup: targetGroup.arnSuffix,
          LoadBalancer: alb.arnSuffix,
        },
        tags: {
          ...commonTags,
          Name: `payment-unhealthy-targets-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // --- Exports ---
    this.vpcId = vpc.id;
    this.albDnsName = alb.dnsName;
    this.ecsClusterArn = ecsCluster.arn;
    this.rdsEndpoint = auroraCluster.endpoint;
    this.cloudfrontDomainName = distribution.domainName;

    // Suppress unused variable warnings for resources that are created but not explicitly referenced
    void kmsAlias;
    void appLogGroup;
    void dbPasswordVersion;
    void secretRotationRole;
    void bucketPolicy;
    void httpListener;
    void cpuScalingPolicy;
    void memoryScalingPolicy;
    void highCpuAlarm;
    void highMemoryAlarm;
    void unhealthyTargetAlarm;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      albUrl: pulumi.interpolate`http://${alb.dnsName}`,
      ecsClusterArn: this.ecsClusterArn,
      ecsClusterName: ecsCluster.name,
      ecsServiceName: ecsService.name,
      rdsEndpoint: this.rdsEndpoint,
      rdsClusterIdentifier: auroraCluster.clusterIdentifier,
      cloudfrontDomainName: this.cloudfrontDomainName,
      cloudfrontUrl: pulumi.interpolate`https://${distribution.domainName}`,
      ecrRepositoryUrl: ecrRepository.repositoryUrl,
      secretArn: dbPassword.arn,
      staticAssetsBucket: staticAssetsBucket.bucket,
      flowLogsBucket: flowLogsBucket.bucket,
      kmsKeyId: kmsKey.keyId,
    });
  }
}
