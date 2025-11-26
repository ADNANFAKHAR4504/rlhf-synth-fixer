/**
 * tap-stack.ts
 *
 * This module defines the TapStack class for the e-commerce infrastructure.
 * It creates a production-ready infrastructure with VPC, Aurora database, Lambda functions,
 * ALB, CloudFront, API Gateway, S3 buckets, DynamoDB tables, and comprehensive monitoring.
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
 * Represents the main Pulumi component resource for the TAP e-commerce infrastructure.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly auroraClusterEndpoint: pulumi.Output<string>;
  public readonly auroraReaderEndpoint: pulumi.Output<string>;
  public readonly rdsProxyEndpoint: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly cloudfrontDomainName: pulumi.Output<string>;
  public readonly apiGatewayUrl: pulumi.Output<string>;
  public readonly staticAssetsBucketName: pulumi.Output<string>;
  public readonly logsBucketName: pulumi.Output<string>;
  public readonly artifactsBucketName: pulumi.Output<string>;
  public readonly sessionsTableName: pulumi.Output<string>;
  public readonly cacheTableName: pulumi.Output<string>;
  public readonly lambdaFunctionName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;

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
    const baseEnvironmentSuffix =
      args.environmentSuffix || config.get('environmentSuffix') || 'dev';
    // Add "-ak" suffix to all resource names to avoid conflicts
    const environmentSuffix = `${baseEnvironmentSuffix}-ak`;
    const region = aws.config.region || 'us-east-1';

    // Database password - can be configured via Pulumi config or uses default for testing
    // For production, always use: pulumi config set --secret dbPassword <secure-password>
    const dbPassword =
      config.getSecret('dbPassword') ||
      pulumi.secret('ChangeMe123!TestPassword');

    // Availability zones
    const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    // VPC CIDR configuration
    const vpcCidr = '10.0.0.0/16';
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
    const privateSubnetCidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `ecommerce-vpc-${environmentSuffix}`,
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `ecommerce-vpc-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `ecommerce-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `ecommerce-igw-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Public Subnets
    const publicSubnets = availabilityZones.map(
      (az, index) =>
        new aws.ec2.Subnet(
          `ecommerce-public-subnet-${index + 1}-${environmentSuffix}`,
          {
            vpcId: vpc.id,
            cidrBlock: publicSubnetCidrs[index],
            availabilityZone: az,
            mapPublicIpOnLaunch: true,
            tags: {
              Name: `ecommerce-public-subnet-${index + 1}-${environmentSuffix}`,
              Environment: environmentSuffix,
              Type: 'Public',
            },
          },
          { parent: this }
        )
    );

    // Create Private Subnets
    const privateSubnets = availabilityZones.map(
      (az, index) =>
        new aws.ec2.Subnet(
          `ecommerce-private-subnet-${index + 1}-${environmentSuffix}`,
          {
            vpcId: vpc.id,
            cidrBlock: privateSubnetCidrs[index],
            availabilityZone: az,
            tags: {
              Name: `ecommerce-private-subnet-${index + 1}-${environmentSuffix}`,
              Environment: environmentSuffix,
              Type: 'Private',
            },
          },
          { parent: this }
        )
    );

    // Create Elastic IPs for NAT Gateways
    const natEips = availabilityZones.map(
      (az, index) =>
        new aws.ec2.Eip(
          `ecommerce-nat-eip-${index + 1}-${environmentSuffix}`,
          {
            domain: 'vpc',
            tags: {
              Name: `ecommerce-nat-eip-${index + 1}-${environmentSuffix}`,
              Environment: environmentSuffix,
            },
          },
          { parent: this }
        )
    );

    // Create NAT Gateways in each public subnet
    const natGateways = publicSubnets.map(
      (subnet, index) =>
        new aws.ec2.NatGateway(
          `ecommerce-nat-${index + 1}-${environmentSuffix}`,
          {
            allocationId: natEips[index].id,
            subnetId: subnet.id,
            tags: {
              Name: `ecommerce-nat-${index + 1}-${environmentSuffix}`,
              Environment: environmentSuffix,
            },
          },
          { parent: this }
        )
    );

    // Create Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `ecommerce-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `ecommerce-public-rt-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Add route to Internet Gateway
    new aws.ec2.Route(
      `ecommerce-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `ecommerce-public-rta-${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Private Route Tables (one per AZ for NAT Gateway)
    const privateRouteTables = natGateways.map((natGateway, index) => {
      const routeTable = new aws.ec2.RouteTable(
        `ecommerce-private-rt-${index + 1}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `ecommerce-private-rt-${index + 1}-${environmentSuffix}`,
            Environment: environmentSuffix,
          },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `ecommerce-private-route-${index + 1}-${environmentSuffix}`,
        {
          routeTableId: routeTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        },
        { parent: this }
      );

      return routeTable;
    });

    // Associate private subnets with private route tables
    privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `ecommerce-private-rta-${index + 1}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTables[index].id,
        },
        { parent: this }
      );
    });

    // Security Group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `ecommerce-alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS',
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
          Name: `ecommerce-alb-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Security Group for Lambda Functions
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `ecommerce-lambda-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Lambda functions',
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
          Name: `ecommerce-lambda-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Security Group for Aurora
    const auroraSecurityGroup = new aws.ec2.SecurityGroup(
      `ecommerce-aurora-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Aurora PostgreSQL',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [lambdaSecurityGroup.id],
            description: 'Allow PostgreSQL from Lambda',
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
          Name: `ecommerce-aurora-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // DB Subnet Group for Aurora
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `ecommerce-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: privateSubnets.map(s => s.id),
        tags: {
          Name: `ecommerce-db-subnet-group-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Aurora PostgreSQL Serverless v2 Cluster
    const auroraCluster = new aws.rds.Cluster(
      `ecommerce-aurora-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `ecommerce-aurora-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineMode: 'provisioned',
        engineVersion: '17.4',
        databaseName: 'ecommerce',
        masterUsername: 'dbadmin',
        masterPassword: dbPassword,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [auroraSecurityGroup.id],
        serverlessv2ScalingConfiguration: {
          minCapacity: 0.5,
          maxCapacity: 1.0,
        },
        skipFinalSnapshot: true,
        tags: {
          Name: `ecommerce-aurora-cluster-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Aurora Writer Instance
    void new aws.rds.ClusterInstance(
      `ecommerce-aurora-writer-${environmentSuffix}`,
      {
        identifier: `ecommerce-aurora-writer-${environmentSuffix}`,
        clusterIdentifier: auroraCluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql',
        engineVersion: '17.4',
        tags: {
          Name: `ecommerce-aurora-writer-${environmentSuffix}`,
          Environment: environmentSuffix,
          Role: 'Writer',
        },
      },
      { parent: this }
    );

    // Aurora Reader Instances
    void new aws.rds.ClusterInstance(
      `ecommerce-aurora-reader-1-${environmentSuffix}`,
      {
        identifier: `ecommerce-aurora-reader-1-${environmentSuffix}`,
        clusterIdentifier: auroraCluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql',
        engineVersion: '17.4',
        tags: {
          Name: `ecommerce-aurora-reader-1-${environmentSuffix}`,
          Environment: environmentSuffix,
          Role: 'Reader',
        },
      },
      { parent: this }
    );

    void new aws.rds.ClusterInstance(
      `ecommerce-aurora-reader-2-${environmentSuffix}`,
      {
        identifier: `ecommerce-aurora-reader-2-${environmentSuffix}`,
        clusterIdentifier: auroraCluster.id,
        instanceClass: 'db.serverless',
        engine: 'aurora-postgresql',
        engineVersion: '17.4',
        tags: {
          Name: `ecommerce-aurora-reader-2-${environmentSuffix}`,
          Environment: environmentSuffix,
          Role: 'Reader',
        },
      },
      { parent: this }
    );

    // RDS Proxy IAM Role
    const rdsProxyRole = new aws.iam.Role(
      `ecommerce-rds-proxy-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'rds.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `ecommerce-rds-proxy-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Secrets Manager for DB credentials
    const dbSecret = new aws.secretsmanager.Secret(
      `ecommerce-db-secret-${environmentSuffix}`,
      {
        name: `ecommerce-db-credentials-${environmentSuffix}`,
        description: 'Aurora database credentials',
        tags: {
          Name: `ecommerce-db-secret-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    void new aws.secretsmanager.SecretVersion(
      `ecommerce-db-secret-version-${environmentSuffix}`,
      {
        secretId: dbSecret.id,
        secretString: pulumi
          .all([auroraCluster.masterUsername, dbPassword])
          .apply(([username, password]: [string, string]) =>
            JSON.stringify({
              username: username,
              password: password,
            })
          ),
      },
      { parent: this }
    );

    // RDS Proxy policy for Secrets Manager
    void new aws.iam.RolePolicy(
      `ecommerce-rds-proxy-policy-${environmentSuffix}`,
      {
        role: rdsProxyRole.id,
        policy: dbSecret.arn.apply((arn: string) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'secretsmanager:GetSecretValue',
                  'secretsmanager:DescribeSecret',
                ],
                Resource: arn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // RDS Proxy
    const rdsProxy = new aws.rds.Proxy(
      `ecommerce-rds-proxy-${environmentSuffix}`,
      {
        name: `ecommerce-rds-proxy-${environmentSuffix}`,
        engineFamily: 'POSTGRESQL',
        auths: [
          {
            authScheme: 'SECRETS',
            secretArn: dbSecret.arn,
            iamAuth: 'REQUIRED',
          },
        ],
        roleArn: rdsProxyRole.arn,
        vpcSubnetIds: privateSubnets.map(s => s.id),
        requireTls: true,
        tags: {
          Name: `ecommerce-rds-proxy-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const rdsProxyTargetGroup = new aws.rds.ProxyDefaultTargetGroup(
      `ecommerce-rds-proxy-tg-${environmentSuffix}`,
      {
        dbProxyName: rdsProxy.name,
        connectionPoolConfig: {
          maxConnectionsPercent: 100,
          maxIdleConnectionsPercent: 50,
        },
      },
      { parent: this }
    );

    void new aws.rds.ProxyTarget(
      `ecommerce-rds-proxy-target-${environmentSuffix}`,
      {
        dbProxyName: rdsProxy.name,
        targetGroupName: rdsProxyTargetGroup.name,
        dbClusterIdentifier: auroraCluster.id,
      },
      { parent: this }
    );

    // S3 Bucket for Static Assets
    const staticAssetsBucket = new aws.s3.Bucket(
      `ecommerce-static-${environmentSuffix}`,
      {
        bucket: `ecommerce-static-assets-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            noncurrentVersionExpiration: {
              days: 30,
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
          Name: `ecommerce-static-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Block public access for static assets bucket
    new aws.s3.BucketPublicAccessBlock(
      `ecommerce-static-pab-${environmentSuffix}`,
      {
        bucket: staticAssetsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // S3 Bucket for Logs
    const logsBucket = new aws.s3.Bucket(
      `ecommerce-logs-${environmentSuffix}`,
      {
        bucket: `ecommerce-application-logs-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            expiration: {
              days: 30,
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
          Name: `ecommerce-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Block public access for logs bucket
    new aws.s3.BucketPublicAccessBlock(
      `ecommerce-logs-pab-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // S3 Bucket for Artifacts
    const artifactsBucket = new aws.s3.Bucket(
      `ecommerce-artifacts-${environmentSuffix}`,
      {
        bucket: `ecommerce-app-artifacts-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            noncurrentVersionExpiration: {
              days: 30,
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
          Name: `ecommerce-artifacts-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Block public access for artifacts bucket
    new aws.s3.BucketPublicAccessBlock(
      `ecommerce-artifacts-pab-${environmentSuffix}`,
      {
        bucket: artifactsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // DynamoDB Table for Sessions
    const sessionsTable = new aws.dynamodb.Table(
      `ecommerce-sessions-${environmentSuffix}`,
      {
        name: `ecommerce-sessions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'sessionId',
        attributes: [
          {
            name: 'sessionId',
            type: 'S',
          },
        ],
        ttl: {
          attributeName: 'expiresAt',
          enabled: true,
        },
        serverSideEncryption: {
          enabled: true,
        },
        tags: {
          Name: `ecommerce-sessions-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // DynamoDB Table for Cache
    const cacheTable = new aws.dynamodb.Table(
      `ecommerce-cache-${environmentSuffix}`,
      {
        name: `ecommerce-cache-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'cacheKey',
        attributes: [
          {
            name: 'cacheKey',
            type: 'S',
          },
        ],
        ttl: {
          attributeName: 'expiresAt',
          enabled: true,
        },
        serverSideEncryption: {
          enabled: true,
        },
        tags: {
          Name: `ecommerce-cache-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // IAM Role for Lambda
    const lambdaRole = new aws.iam.Role(
      `ecommerce-lambda-role-${environmentSuffix}`,
      {
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
        tags: {
          Name: `ecommerce-lambda-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Lambda basic execution policy
    new aws.iam.RolePolicyAttachment(
      `ecommerce-lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Lambda VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `ecommerce-lambda-vpc-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Lambda policy for DynamoDB and RDS
    void new aws.iam.RolePolicy(
      `ecommerce-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([sessionsTable.arn, cacheTable.arn, rdsProxy.arn])
          .apply(
            ([sessionsArn, cacheArn, proxyArn]: [string, string, string]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      'dynamodb:GetItem',
                      'dynamodb:PutItem',
                      'dynamodb:UpdateItem',
                      'dynamodb:DeleteItem',
                      'dynamodb:Query',
                      'dynamodb:Scan',
                    ],
                    Resource: [sessionsArn, cacheArn],
                  },
                  {
                    Effect: 'Allow',
                    Action: ['rds-db:connect'],
                    Resource: proxyArn,
                  },
                ],
              })
          ),
      },
      { parent: this }
    );

    // Lambda Function for API
    const apiLambda = new aws.lambda.Function(
      `ecommerce-api-lambda-${environmentSuffix}`,
      {
        name: `ecommerce-api-${environmentSuffix}`,
        role: lambdaRole.arn,
        architectures: ['arm64'],
        memorySize: 3072,
        timeout: 30,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(
            `
exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
            message: 'E-commerce API endpoint',
            timestamp: new Date().toISOString(),
            environment: process.env.ENVIRONMENT_SUFFIX,
        }),
    };
};
        `
          ),
        }),
        environment: {
          variables: {
            ENVIRONMENT_SUFFIX: environmentSuffix,
            DB_PROXY_ENDPOINT: rdsProxy.endpoint,
            SESSIONS_TABLE: sessionsTable.name,
            CACHE_TABLE: cacheTable.name,
          },
        },
        vpcConfig: {
          subnetIds: privateSubnets.map(s => s.id),
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        reservedConcurrentExecutions: 10,
        tags: {
          Name: `ecommerce-api-lambda-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch Log Group for Lambda
    void new aws.cloudwatch.LogGroup(
      `ecommerce-lambda-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/${apiLambda.name}`,
        retentionInDays: 7,
        tags: {
          Name: `ecommerce-lambda-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `ecommerce-alb-${environmentSuffix}`,
      {
        name: `ecommerce-alb-${environmentSuffix}`,
        loadBalancerType: 'application',
        subnets: publicSubnets.map(s => s.id),
        securityGroups: [albSecurityGroup.id],
        enableHttp2: true,
        tags: {
          Name: `ecommerce-alb-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Target Group for Lambda
    const lambdaTargetGroup = new aws.lb.TargetGroup(
      `ecommerce-lambda-tg-${environmentSuffix}`,
      {
        name: `ecommerce-lambda-tg-${environmentSuffix}`,
        targetType: 'lambda',
        healthCheck: {
          enabled: true,
          interval: 5,
          timeout: 2,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: {
          Name: `ecommerce-lambda-tg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Attach Lambda to Target Group
    const lambdaTargetGroupAttachment = new aws.lambda.Permission(
      `ecommerce-lambda-alb-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: apiLambda.name,
        principal: 'elasticloadbalancing.amazonaws.com',
        sourceArn: lambdaTargetGroup.arn,
      },
      { parent: this }
    );

    void new aws.lb.TargetGroupAttachment(
      `ecommerce-lambda-attachment-${environmentSuffix}`,
      {
        targetGroupArn: lambdaTargetGroup.arn,
        targetId: apiLambda.arn,
      },
      { parent: this, dependsOn: [lambdaTargetGroupAttachment] }
    );

    // ALB Listener
    const albListener = new aws.lb.Listener(
      `ecommerce-alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: lambdaTargetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // ALB Listener Rule for path-based routing
    void new aws.lb.ListenerRule(
      `ecommerce-alb-rule-${environmentSuffix}`,
      {
        listenerArn: albListener.arn,
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
            targetGroupArn: lambdaTargetGroup.arn,
            forward: {
              targetGroups: [
                {
                  arn: lambdaTargetGroup.arn,
                  weight: 100,
                },
              ],
              stickiness: {
                enabled: true,
                duration: 3600,
              },
            },
          },
        ],
      },
      { parent: this }
    );

    // CloudFront Origin Access Identity
    const originAccessIdentity = new aws.cloudfront.OriginAccessIdentity(
      `ecommerce-oai-${environmentSuffix}`,
      {
        comment: `OAI for ${environmentSuffix}`,
      },
      { parent: this }
    );

    // S3 Bucket Policy for CloudFront
    void new aws.s3.BucketPolicy(
      `ecommerce-static-policy-${environmentSuffix}`,
      {
        bucket: staticAssetsBucket.id,
        policy: pulumi
          .all([staticAssetsBucket.arn, originAccessIdentity.iamArn])
          .apply(([bucketArn, oaiArn]: [string, string]) =>
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

    // Lambda@Edge Role
    const lambdaEdgeRole = new aws.iam.Role(
      `ecommerce-lambda-edge-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
            {
              Effect: 'Allow',
              Principal: { Service: 'edgelambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `ecommerce-lambda-edge-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `ecommerce-lambda-edge-basic-${environmentSuffix}`,
      {
        role: lambdaEdgeRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Lambda@Edge Function (must be in us-east-1)
    const edgeLambda = new aws.lambda.Function(
      `ecommerce-edge-lambda-${environmentSuffix}`,
      {
        name: `ecommerce-edge-auth-${environmentSuffix}`,
        role: lambdaEdgeRole.arn,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        publish: true,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(
            `
exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // Add security headers
    headers['x-frame-options'] = [{ key: 'X-Frame-Options', value: 'DENY' }];
    headers['x-content-type-options'] = [{ key: 'X-Content-Type-Options', value: 'nosniff' }];
    headers['x-xss-protection'] = [{ key: 'X-XSS-Protection', value: '1; mode=block' }];
    headers['strict-transport-security'] = [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }];

    // Simple authentication check (in production, use real auth)
    const authHeader = headers['authorization'];
    if (!authHeader || !authHeader[0] || !authHeader[0].value) {
        return {
            status: '401',
            statusDescription: 'Unauthorized',
            body: 'Authentication required',
        };
    }

    return request;
};
        `
          ),
        }),
        timeout: 5,
        memorySize: 128,
        tags: {
          Name: `ecommerce-edge-lambda-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      {
        parent: this,
        provider: new aws.Provider('us-east-1', { region: 'us-east-1' }),
      }
    );

    // CloudFront Distribution
    const distribution = new aws.cloudfront.Distribution(
      `ecommerce-cdn-${environmentSuffix}`,
      {
        enabled: true,
        comment: `CDN for ${environmentSuffix}`,
        origins: [
          {
            originId: 's3-static',
            domainName: staticAssetsBucket.bucketRegionalDomainName,
            s3OriginConfig: {
              originAccessIdentity:
                originAccessIdentity.cloudfrontAccessIdentityPath,
            },
          },
          {
            originId: 'alb-api',
            domainName: alb.dnsName,
            customOriginConfig: {
              httpPort: 80,
              httpsPort: 443,
              originProtocolPolicy: 'http-only',
              originSslProtocols: ['TLSv1.2'],
            },
          },
        ],
        defaultCacheBehavior: {
          targetOriginId: 's3-static',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          forwardedValues: {
            queryString: false,
            cookies: { forward: 'none' },
          },
          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
          compress: true,
          lambdaFunctionAssociations: [
            {
              eventType: 'viewer-request',
              lambdaArn: edgeLambda.qualifiedArn,
            },
          ],
        },
        orderedCacheBehaviors: [
          {
            pathPattern: '/api/*',
            targetOriginId: 'alb-api',
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: [
              'DELETE',
              'GET',
              'HEAD',
              'OPTIONS',
              'PATCH',
              'POST',
              'PUT',
            ],
            cachedMethods: ['GET', 'HEAD'],
            forwardedValues: {
              queryString: true,
              headers: ['Authorization', 'Accept', 'Content-Type'],
              cookies: { forward: 'all' },
            },
            minTtl: 0,
            defaultTtl: 0,
            maxTtl: 0,
            compress: true,
          },
        ],
        customErrorResponses: [
          {
            errorCode: 404,
            responseCode: 404,
            responsePagePath: '/404.html',
            errorCachingMinTtl: 300,
          },
          {
            errorCode: 500,
            responseCode: 500,
            responsePagePath: '/500.html',
            errorCachingMinTtl: 60,
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
          Name: `ecommerce-cdn-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // API Gateway REST API
    const apiGateway = new aws.apigateway.RestApi(
      `ecommerce-api-gateway-${environmentSuffix}`,
      {
        name: `ecommerce-api-${environmentSuffix}`,
        description: 'API Gateway for e-commerce platform',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: {
          Name: `ecommerce-api-gateway-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // API Gateway Resource
    const apiResource = new aws.apigateway.Resource(
      `ecommerce-api-resource-${environmentSuffix}`,
      {
        restApi: apiGateway.id,
        parentId: apiGateway.rootResourceId,
        pathPart: 'products',
      },
      { parent: this }
    );

    // API Gateway Method
    const apiMethod = new aws.apigateway.Method(
      `ecommerce-api-method-${environmentSuffix}`,
      {
        restApi: apiGateway.id,
        resourceId: apiResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // API Gateway Integration
    const apiIntegration = new aws.apigateway.Integration(
      `ecommerce-api-integration-${environmentSuffix}`,
      {
        restApi: apiGateway.id,
        resourceId: apiResource.id,
        httpMethod: apiMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: apiLambda.invokeArn,
      },
      { parent: this }
    );

    // Lambda Permission for API Gateway
    void new aws.lambda.Permission(
      `ecommerce-api-gateway-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: apiLambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${apiGateway.executionArn}/*/*`,
      },
      { parent: this }
    );

    // API Gateway Deployment
    const apiDeployment = new aws.apigateway.Deployment(
      `ecommerce-api-deployment-${environmentSuffix}`,
      {
        restApi: apiGateway.id,
      },
      { parent: this, dependsOn: [apiIntegration] }
    );

    // API Gateway Stage
    const apiStage = new aws.apigateway.Stage(
      `ecommerce-api-stage-${environmentSuffix}`,
      {
        restApi: apiGateway.id,
        deployment: apiDeployment.id,
        stageName: 'prod',
      },
      { parent: this }
    );

    // API Gateway Usage Plan
    const usagePlan = new aws.apigateway.UsagePlan(
      `ecommerce-usage-plan-${environmentSuffix}`,
      {
        name: `ecommerce-usage-plan-${environmentSuffix}`,
        apiStages: [
          {
            apiId: apiGateway.id,
            stage: apiStage.stageName,
          },
        ],
        throttleSettings: {
          rateLimit: 10000,
          burstLimit: 20000,
        },
        quotaSettings: {
          limit: 1000000,
          period: 'MONTH',
        },
        tags: {
          Name: `ecommerce-usage-plan-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // API Gateway API Key
    const apiKey = new aws.apigateway.ApiKey(
      `ecommerce-api-key-${environmentSuffix}`,
      {
        name: `ecommerce-api-key-${environmentSuffix}`,
        enabled: true,
        tags: {
          Name: `ecommerce-api-key-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Associate API Key with Usage Plan
    void new aws.apigateway.UsagePlanKey(
      `ecommerce-usage-plan-key-${environmentSuffix}`,
      {
        keyId: apiKey.id,
        keyType: 'API_KEY',
        usagePlanId: usagePlan.id,
      },
      { parent: this }
    );

    // SNS Topic for Alarms
    const alarmTopic = new aws.sns.Topic(
      `ecommerce-alarms-${environmentSuffix}`,
      {
        name: `ecommerce-alarms-${environmentSuffix}`,
        tags: {
          Name: `ecommerce-alarms-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for ALB Target Health
    void new aws.cloudwatch.MetricAlarm(
      `ecommerce-alb-health-alarm-${environmentSuffix}`,
      {
        name: `ecommerce-alb-unhealthy-targets-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'Alert when ALB has unhealthy targets',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          LoadBalancer: alb.arnSuffix,
          TargetGroup: lambdaTargetGroup.arnSuffix,
        },
        tags: {
          Name: `ecommerce-alb-health-alarm-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for Lambda Errors
    void new aws.cloudwatch.MetricAlarm(
      `ecommerce-lambda-error-alarm-${environmentSuffix}`,
      {
        name: `ecommerce-lambda-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 60,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Alert when Lambda has high error rate',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          FunctionName: apiLambda.name,
        },
        tags: {
          Name: `ecommerce-lambda-error-alarm-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for Lambda Throttles
    void new aws.cloudwatch.MetricAlarm(
      `ecommerce-lambda-throttle-alarm-${environmentSuffix}`,
      {
        name: `ecommerce-lambda-throttles-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Throttles',
        namespace: 'AWS/Lambda',
        period: 60,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'Alert when Lambda is being throttled',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          FunctionName: apiLambda.name,
        },
        tags: {
          Name: `ecommerce-lambda-throttle-alarm-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarm for RDS Connections
    void new aws.cloudwatch.MetricAlarm(
      `ecommerce-rds-connection-alarm-${environmentSuffix}`,
      {
        name: `ecommerce-rds-high-connections-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 60,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when RDS connection count is high',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBClusterIdentifier: auroraCluster.clusterIdentifier,
        },
        tags: {
          Name: `ecommerce-rds-connection-alarm-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `ecommerce-dashboard-${environmentSuffix}`,
      {
        dashboardName: `ecommerce-metrics-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            apiLambda.name,
            alb.arnSuffix,
            lambdaTargetGroup.arnSuffix,
            auroraCluster.clusterIdentifier,
          ])
          .apply(
            ([_lambdaName, albArn, tgArn, clusterName]: [
              string,
              string,
              string,
              string,
            ]) =>
              JSON.stringify({
                widgets: [
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          'AWS/Lambda',
                          'Duration',
                          { stat: 'Average', label: 'Avg Latency' },
                        ],
                        ['...', { stat: 'p99', label: 'P99 Latency' }],
                      ],
                      period: 60,
                      stat: 'Average',
                      region: region,
                      title: 'API Latency (ms)',
                      yAxis: { left: { min: 0 } },
                    },
                  },
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          'AWS/Lambda',
                          'Errors',
                          { stat: 'Sum', label: 'Lambda Errors' },
                        ],
                        [
                          'AWS/Lambda',
                          'Throttles',
                          { stat: 'Sum', label: 'Lambda Throttles' },
                        ],
                      ],
                      period: 60,
                      stat: 'Sum',
                      region: region,
                      title: 'Error Rates',
                      yAxis: { left: { min: 0 } },
                    },
                  },
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        [
                          'AWS/ApplicationELB',
                          'TargetResponseTime',
                          'LoadBalancer',
                          albArn,
                          { stat: 'Average' },
                        ],
                        [
                          'AWS/ApplicationELB',
                          'HealthyHostCount',
                          'LoadBalancer',
                          albArn,
                          'TargetGroup',
                          tgArn,
                          { stat: 'Average' },
                        ],
                      ],
                      period: 60,
                      stat: 'Average',
                      region: region,
                      title: 'ALB Metrics',
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
                          clusterName,
                          { stat: 'Average' },
                        ],
                        [
                          'AWS/RDS',
                          'CPUUtilization',
                          'DBClusterIdentifier',
                          clusterName,
                          { stat: 'Average' },
                        ],
                      ],
                      period: 60,
                      stat: 'Average',
                      region: region,
                      title: 'Aurora Metrics',
                    },
                  },
                ],
              })
          ),
      },
      { parent: this }
    );

    // Note: Lambda functions auto-scale automatically based on incoming requests.
    // Provisioned concurrency auto-scaling would require a Lambda alias and provisioned concurrency configuration.
    // For this use case, Lambda's built-in auto-scaling is sufficient.

    // Set public outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = publicSubnets.map(s => s.id);
    this.privateSubnetIds = privateSubnets.map(s => s.id);
    this.auroraClusterEndpoint = auroraCluster.endpoint;
    this.auroraReaderEndpoint = auroraCluster.readerEndpoint;
    this.rdsProxyEndpoint = rdsProxy.endpoint;
    this.albDnsName = alb.dnsName;
    this.cloudfrontDomainName = distribution.domainName;
    this.apiGatewayUrl = pulumi.interpolate`${apiGateway.executionArn}/${apiStage.stageName}`;
    this.staticAssetsBucketName = staticAssetsBucket.bucket;
    this.logsBucketName = logsBucket.bucket;
    this.artifactsBucketName = artifactsBucket.bucket;
    this.sessionsTableName = sessionsTable.name;
    this.cacheTableName = cacheTable.name;
    this.lambdaFunctionName = apiLambda.name;
    this.snsTopicArn = alarmTopic.arn;
    this.dashboardName = dashboard.dashboardName;

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      auroraClusterEndpoint: this.auroraClusterEndpoint,
      auroraReaderEndpoint: this.auroraReaderEndpoint,
      rdsProxyEndpoint: this.rdsProxyEndpoint,
      albDnsName: this.albDnsName,
      cloudfrontDomainName: this.cloudfrontDomainName,
      apiGatewayUrl: this.apiGatewayUrl,
      staticAssetsBucketName: this.staticAssetsBucketName,
      logsBucketName: this.logsBucketName,
      artifactsBucketName: this.artifactsBucketName,
      sessionsTableName: this.sessionsTableName,
      cacheTableName: this.cacheTableName,
      lambdaFunctionName: this.lambdaFunctionName,
      snsTopicArn: this.snsTopicArn,
      dashboardName: this.dashboardName,
    });
  }
}
