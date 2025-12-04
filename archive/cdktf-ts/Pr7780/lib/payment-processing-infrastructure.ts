import { AppautoscalingPolicy } from '@cdktf/provider-aws/lib/appautoscaling-policy';
import { AppautoscalingTarget } from '@cdktf/provider-aws/lib/appautoscaling-target';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CloudfrontOriginAccessIdentity } from '@cdktf/provider-aws/lib/cloudfront-origin-access-identity';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { EcrRepository } from '@cdktf/provider-aws/lib/ecr-repository';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

interface PaymentProcessingInfrastructureProps {
  environmentSuffix: string;
  awsRegion: string;
}

export class PaymentProcessingInfrastructure extends Construct {
  public readonly vpcId: string;
  public readonly albDnsName: string;
  public readonly ecsClusterName: string;
  public readonly rdsEndpoint: string;
  public readonly cloudfrontDomain: string;
  public readonly ecrRepositoryUrl: string;

  constructor(
    scope: Construct,
    id: string,
    props: PaymentProcessingInfrastructureProps
  ) {
    super(scope, id);

    const { environmentSuffix, awsRegion } = props;

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // ===========================
    // 1. KMS Keys for Encryption
    // ===========================
    const kmsKey = new KmsKey(this, 'kms-key', {
      description: `Customer-managed key for payment processing ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      tags: {
        Name: `payment-kms-${environmentSuffix}`,
      },
    });

    new KmsAlias(this, 'kms-alias', {
      name: `alias/payment-processing-${environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    });

    // ===========================
    // 2. VPC and Networking
    // ===========================
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-vpc-${environmentSuffix}`,
      },
    });

    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-igw-${environmentSuffix}`,
      },
    });

    // Create 3 public subnets and 3 private subnets across 3 AZs
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];
    const natGateways: NatGateway[] = [];

    for (let i = 0; i < 3; i++) {
      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-${i}-${environmentSuffix}`,
          Type: 'public',
        },
      });
      publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        tags: {
          Name: `payment-private-subnet-${i}-${environmentSuffix}`,
          Type: 'private',
        },
      });
      privateSubnets.push(privateSubnet);

      // Elastic IP for NAT Gateway
      const eip = new Eip(this, `eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `payment-eip-${i}-${environmentSuffix}`,
        },
      });

      // NAT Gateway
      const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `payment-nat-${i}-${environmentSuffix}`,
        },
      });
      natGateways.push(natGateway);
    }

    // Public route table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-public-rt-${environmentSuffix}`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private route tables (one per AZ for NAT gateway routing)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-route-table-${i}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `payment-private-rt-${i}-${environmentSuffix}`,
          },
        }
      );

      new Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      });

      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // ===========================
    // 3. S3 Bucket for VPC Flow Logs
    // ===========================
    const flowLogsBucket = new S3Bucket(this, 'flow-logs-bucket', {
      bucket: `payment-flow-logs-${environmentSuffix}-${awsRegion}`,
      forceDestroy: true,
      tags: {
        Name: `payment-flow-logs-${environmentSuffix}`,
      },
    });

    new S3BucketVersioningA(this, 'flow-logs-versioning', {
      bucket: flowLogsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketLifecycleConfiguration(this, 'flow-logs-lifecycle', {
      bucket: flowLogsBucket.id,
      rule: [
        {
          id: 'transition-old-logs',
          status: 'Enabled',
          transition: [
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
          expiration: [
            {
              days: 2557, // 7 years
            },
          ],
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 'flow-logs-public-access-block', {
      bucket: flowLogsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable VPC Flow Logs
    new FlowLog(this, 'vpc-flow-log', {
      trafficType: 'ALL',
      vpcId: vpc.id,
      logDestinationType: 's3',
      logDestination: `arn:aws:s3:::${flowLogsBucket.bucket}`,
      tags: {
        Name: `payment-flow-log-${environmentSuffix}`,
      },
    });

    // ===========================
    // 4. S3 Bucket for Static Assets
    // ===========================
    const staticAssetsBucket = new S3Bucket(this, 'static-assets-bucket', {
      bucket: `payment-static-assets-${environmentSuffix}-${awsRegion}`,
      forceDestroy: true,
      tags: {
        Name: `payment-static-assets-${environmentSuffix}`,
      },
    });

    new S3BucketVersioningA(this, 'static-assets-versioning', {
      bucket: staticAssetsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketLifecycleConfiguration(this, 'static-assets-lifecycle', {
      bucket: staticAssetsBucket.id,
      rule: [
        {
          id: 'cleanup-old-versions',
          status: 'Enabled',
          noncurrentVersionExpiration: [
            {
              noncurrentDays: 90,
            },
          ],
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 'static-assets-public-access-block', {
      bucket: staticAssetsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // ===========================
    // 5. CloudFront Distribution
    // ===========================
    const oai = new CloudfrontOriginAccessIdentity(this, 'oai', {
      comment: `OAI for payment processing ${environmentSuffix}`,
    });

    // S3 bucket policy for CloudFront
    new S3BucketPolicy(this, 'static-assets-policy', {
      bucket: staticAssetsBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontOAI',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${oai.id}`,
            },
            Action: 's3:GetObject',
            Resource: `${staticAssetsBucket.arn}/*`,
          },
        ],
      }),
    });

    const cloudfront = new CloudfrontDistribution(this, 'cloudfront', {
      enabled: true,
      comment: `Payment processing CDN ${environmentSuffix}`,
      defaultCacheBehavior: {
        allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
        cachedMethods: ['GET', 'HEAD'],
        targetOriginId: 'S3-static-assets',
        viewerProtocolPolicy: 'redirect-to-https',
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
      origin: [
        {
          originId: 'S3-static-assets',
          domainName: staticAssetsBucket.bucketRegionalDomainName,
          s3OriginConfig: {
            originAccessIdentity: oai.cloudfrontAccessIdentityPath,
          },
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
      tags: {
        Name: `payment-cloudfront-${environmentSuffix}`,
      },
    });

    this.cloudfrontDomain = cloudfront.domainName;

    // ===========================
    // 6. Security Groups
    // ===========================
    // ALB Security Group
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `payment-alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      tags: {
        Name: `payment-alb-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTP from internet',
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow all outbound',
    });

    // ECS Security Group
    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      name: `payment-ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: vpc.id,
      tags: {
        Name: `payment-ecs-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'ecs-ingress-alb', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow traffic from ALB',
    });

    new SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow all outbound',
    });

    // RDS Security Group
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `payment-rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS Aurora',
      vpcId: vpc.id,
      tags: {
        Name: `payment-rds-sg-${environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'rds-ingress-ecs', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: rdsSecurityGroup.id,
      description: 'Allow PostgreSQL from ECS tasks only',
    });

    // ===========================
    // 7. IAM Roles
    // ===========================
    // ECS Task Execution Role
    const ecsTaskExecutionRole = new IamRole(this, 'ecs-task-execution-role', {
      name: `payment-ecs-execution-${environmentSuffix}`,
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
        Name: `payment-ecs-execution-role-${environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'ecs-task-execution-policy', {
      role: ecsTaskExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // ECS Task Role (minimal permissions)
    const ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      name: `payment-ecs-task-${environmentSuffix}`,
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
        Name: `payment-ecs-task-role-${environmentSuffix}`,
      },
    });

    const ecsTaskPolicy = new IamPolicy(this, 'ecs-task-policy', {
      name: `payment-ecs-task-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: `arn:aws:secretsmanager:${awsRegion}:*:secret:payment-db-credentials-${environmentSuffix}-*`,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: kmsKey.arn,
          },
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `arn:aws:logs:${awsRegion}:*:log-group:/ecs/payment-*`,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'ecs-task-policy-attachment', {
      role: ecsTaskRole.name,
      policyArn: ecsTaskPolicy.arn,
    });

    // ===========================
    // 8. CloudWatch Log Groups
    // ===========================
    const ecsLogGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/payment-processing-${environmentSuffix}`,
      retentionInDays: 2557, // 7 years for PCI DSS compliance
      tags: {
        Name: `payment-ecs-logs-${environmentSuffix}`,
      },
    });

    // ALB log group for future use
    new CloudwatchLogGroup(this, 'alb-log-group', {
      name: `/alb/payment-processing-${environmentSuffix}`,
      retentionInDays: 2557, // 7 years for PCI DSS compliance
      tags: {
        Name: `payment-alb-logs-${environmentSuffix}`,
      },
    });

    // ===========================
    // 9. ECR Repository
    // ===========================
    const ecrRepository = new EcrRepository(this, 'ecr-repository', {
      name: `payment-processing-${environmentSuffix}`,
      imageTagMutability: 'IMMUTABLE',
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      encryptionConfiguration: [
        {
          encryptionType: 'KMS',
          kmsKey: kmsKey.arn,
        },
      ],
      forceDelete: true,
      tags: {
        Name: `payment-ecr-${environmentSuffix}`,
      },
    });

    this.ecrRepositoryUrl = ecrRepository.repositoryUrl;

    // ===========================
    // 10. Secrets Manager
    // ===========================
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `payment-db-credentials-${environmentSuffix}`,
      description: 'Database credentials for payment processing application',
      kmsKeyId: kmsKey.id,
      recoveryWindowInDays: 7,
      tags: {
        Name: `payment-db-secret-${environmentSuffix}`,
      },
    });

    const dbPassword = 'ChangeMe123!'; // This would be auto-generated in production

    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: 'paymentadmin',
        password: dbPassword,
        engine: 'postgres',
        host: '', // Will be updated after RDS creation
        port: 5432,
        dbname: 'paymentdb',
      }),
    });

    // Note: Rotation requires Lambda function, simplified for this implementation
    // In production, implement rotation with Lambda function
    // new SecretsmanagerSecretRotation(this, 'db-secret-rotation', {
    //   secretId: dbSecret.id,
    //   rotationRules: {
    //     automaticallyAfterDays: 30,
    //   },
    //   rotationLambdaArn: `arn:aws:lambda:${awsRegion}:123456789012:function:placeholder`, // Placeholder
    // });

    // ===========================
    // 11. RDS Aurora PostgreSQL
    // ===========================
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `payment-db-subnet-${environmentSuffix}`,
      subnetIds: privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: `payment-db-subnet-${environmentSuffix}`,
      },
    });

    const rdsCluster = new RdsCluster(this, 'rds-cluster', {
      clusterIdentifier: `payment-db-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      databaseName: 'paymentdb',
      masterUsername: 'paymentadmin',
      masterPassword: dbPassword,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: false, // Must be false for synthetic tasks
      skipFinalSnapshot: true,
      enabledCloudwatchLogsExports: ['postgresql'],
      tags: {
        Name: `payment-rds-cluster-${environmentSuffix}`,
      },
    });

    // Create 2 instances for Multi-AZ
    for (let i = 0; i < 2; i++) {
      new RdsClusterInstance(this, `rds-instance-${i}`, {
        identifier: `payment-db-${environmentSuffix}-${i}`,
        clusterIdentifier: rdsCluster.id,
        instanceClass: 'db.t4g.medium',
        engine: 'aurora-postgresql',
        publiclyAccessible: false,
        tags: {
          Name: `payment-rds-instance-${i}-${environmentSuffix}`,
        },
      });
    }

    this.rdsEndpoint = rdsCluster.endpoint;

    // ===========================
    // 12. ACM Certificate (Removed for demo - using HTTP)
    // ===========================
    // const certificate = new AcmCertificate(this, 'certificate', {
    //   domainName: `payment-${environmentSuffix}.example.com`,
    //   validationMethod: 'EMAIL',
    //   tags: {
    //     Name: `payment-cert-${environmentSuffix}`,
    //   },
    //   lifecycle: {
    //     createBeforeDestroy: true,
    //   },
    // });

    // ===========================
    // 13. Application Load Balancer
    // ===========================
    const alb = new Lb(this, 'alb', {
      name: `payment-alb-${environmentSuffix}`,
      loadBalancerType: 'application',
      subnets: publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],
      enableDeletionProtection: false,
      tags: {
        Name: `payment-alb-${environmentSuffix}`,
      },
    });

    this.albDnsName = alb.dnsName;

    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `payment-tg-${environmentSuffix}`,
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
      deregistrationDelay: '30',
      tags: {
        Name: `payment-tg-${environmentSuffix}`,
      },
    });

    new LbListener(this, 'alb-listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // ===========================
    // 14. ECS Cluster and Service
    // ===========================
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `payment-cluster-${environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `payment-ecs-cluster-${environmentSuffix}`,
      },
    });

    this.ecsClusterName = ecsCluster.name;

    const taskDefinition = new EcsTaskDefinition(this, 'task-definition', {
      family: `payment-task-${environmentSuffix}`,
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: '512',
      memory: '1024',
      executionRoleArn: ecsTaskExecutionRole.arn,
      taskRoleArn: ecsTaskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'payment-app',
          image: `${ecrRepository.repositoryUrl}:v1.0.0`, // Specific tag, not 'latest'
          essential: true,
          portMappings: [
            {
              containerPort: 8080,
              protocol: 'tcp',
            },
          ],
          environment: [
            {
              name: 'AWS_REGION',
              value: awsRegion,
            },
            {
              name: 'ENVIRONMENT',
              value: environmentSuffix,
            },
          ],
          secrets: [
            {
              name: 'DB_CREDENTIALS',
              valueFrom: dbSecret.arn,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': ecsLogGroup.name,
              'awslogs-region': awsRegion,
              'awslogs-stream-prefix': 'payment',
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
      ]),
      tags: {
        Name: `payment-task-${environmentSuffix}`,
      },
    });

    const ecsService = new EcsService(this, 'ecs-service', {
      name: `payment-service-${environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: privateSubnets.map(subnet => subnet.id),
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'payment-app',
          containerPort: 8080,
        },
      ],
      healthCheckGracePeriodSeconds: 60,
      tags: {
        Name: `payment-ecs-service-${environmentSuffix}`,
      },
      lifecycle: {
        ignoreChanges: ['desired_count'], // Allow auto-scaling to manage
      },
    });

    // ===========================
    // 15. Auto Scaling
    // ===========================
    const scalingTarget = new AppautoscalingTarget(this, 'scaling-target', {
      maxCapacity: 10,
      minCapacity: 2,
      resourceId: `service/${ecsCluster.name}/${ecsService.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
    });

    new AppautoscalingPolicy(this, 'cpu-scaling-policy', {
      name: `payment-cpu-scaling-${environmentSuffix}`,
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
    });

    // ===========================
    // 16. CloudWatch Alarms
    // ===========================
    new CloudwatchMetricAlarm(this, 'high-cpu-alarm', {
      alarmName: `payment-high-cpu-${environmentSuffix}`,
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
      alarmDescription: 'Alert when CPU exceeds 80%',
      tags: {
        Name: `payment-cpu-alarm-${environmentSuffix}`,
      },
    });

    new CloudwatchMetricAlarm(this, 'high-memory-alarm', {
      alarmName: `payment-high-memory-${environmentSuffix}`,
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
      alarmDescription: 'Alert when memory exceeds 80%',
      tags: {
        Name: `payment-memory-alarm-${environmentSuffix}`,
      },
    });

    new CloudwatchMetricAlarm(this, 'unhealthy-targets-alarm', {
      alarmName: `payment-unhealthy-targets-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 0,
      dimensions: {
        LoadBalancer: alb.arnSuffix,
        TargetGroup: targetGroup.arnSuffix,
      },
      alarmDescription: 'Alert when targets are unhealthy',
      tags: {
        Name: `payment-unhealthy-alarm-${environmentSuffix}`,
      },
    });
  }
}
