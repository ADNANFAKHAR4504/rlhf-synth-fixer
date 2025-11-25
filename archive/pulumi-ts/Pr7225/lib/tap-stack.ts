import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

interface MultiRegionDRConfig {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  domainName: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly secondaryVpcId: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly primaryBucketName: pulumi.Output<string>;
  public readonly secondaryBucketName: pulumi.Output<string>;
  public readonly primaryLambdaArn: pulumi.Output<string>;
  public readonly secondaryLambdaArn: pulumi.Output<string>;
  public readonly primaryAlbDns: pulumi.Output<string>;
  public readonly secondaryAlbDns: pulumi.Output<string>;
  public readonly primaryAlbArn: pulumi.Output<string>;
  public readonly secondaryAlbArn: pulumi.Output<string>;
  public readonly primaryTargetGroupArn: pulumi.Output<string>;
  public readonly secondaryTargetGroupArn: pulumi.Output<string>;
  public readonly hostedZoneId: pulumi.Output<string>;
  public readonly healthCheckId: pulumi.Output<string>;
  public readonly primarySnsTopicArn: pulumi.Output<string>;
  public readonly secondarySnsTopicArn: pulumi.Output<string>;

  constructor(
    name: string,
    config: MultiRegionDRConfig,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:tap:MultiRegionDR', name, {}, opts);

    const defaultOpts = { parent: this };

    // Create primary region provider
    const primaryProvider = new aws.Provider(
      'primary-provider',
      {
        region: config.primaryRegion,
      },
      defaultOpts
    );

    // Create secondary region provider
    const secondaryProvider = new aws.Provider(
      'secondary-provider',
      {
        region: config.secondaryRegion,
      },
      defaultOpts
    );

    // Create VPC in primary region
    const primaryVpc = this.createVpc(
      'primary',
      config.primaryRegion,
      config.environmentSuffix,
      primaryProvider,
      defaultOpts
    );
    this.primaryVpcId = primaryVpc.vpc.id;

    // Create VPC in secondary region
    const secondaryVpc = this.createVpc(
      'secondary',
      config.secondaryRegion,
      config.environmentSuffix,
      secondaryProvider,
      defaultOpts
    );
    this.secondaryVpcId = secondaryVpc.vpc.id;

    // Create DynamoDB Global Table
    const dynamoTable = this.createDynamoDBGlobalTable(
      config.primaryRegion,
      config.secondaryRegion,
      config.environmentSuffix,
      primaryProvider,
      secondaryProvider,
      defaultOpts
    );
    this.dynamoTableName = dynamoTable.name;

    // Create S3 replication role
    const replicationRole = this.createS3ReplicationRole(
      config.environmentSuffix,
      primaryProvider,
      defaultOpts
    );

    // Create S3 buckets with cross-region replication
    const { primaryBucket, secondaryBucket } = this.createS3Buckets(
      config.primaryRegion,
      config.secondaryRegion,
      config.environmentSuffix,
      replicationRole,
      primaryProvider,
      secondaryProvider,
      defaultOpts
    );
    this.primaryBucketName = primaryBucket.id;
    this.secondaryBucketName = secondaryBucket.id;

    // Create Lambda execution role
    const lambdaRole = this.createLambdaRole(
      config.environmentSuffix,
      dynamoTable.arn,
      primaryProvider,
      defaultOpts
    );

    // Create Lambda functions in both regions
    const primaryLambda = this.createLambdaFunction(
      'primary',
      config.primaryRegion,
      config.environmentSuffix,
      lambdaRole,
      primaryProvider,
      defaultOpts
    );
    this.primaryLambdaArn = primaryLambda.arn;

    const secondaryLambda = this.createLambdaFunction(
      'secondary',
      config.secondaryRegion,
      config.environmentSuffix,
      lambdaRole,
      secondaryProvider,
      defaultOpts
    );
    this.secondaryLambdaArn = secondaryLambda.arn;

    // Create ALBs in both regions
    const primaryAlbResources = this.createApplicationLoadBalancer(
      'primary',
      config.primaryRegion,
      config.environmentSuffix,
      primaryVpc.vpc,
      primaryVpc.publicSubnets,
      primaryLambda,
      primaryProvider,
      defaultOpts
    );
    this.primaryAlbDns = primaryAlbResources.alb.dnsName;
    this.primaryAlbArn = primaryAlbResources.alb.arn;
    this.primaryTargetGroupArn = primaryAlbResources.targetGroup.arn;

    const secondaryAlbResources = this.createApplicationLoadBalancer(
      'secondary',
      config.secondaryRegion,
      config.environmentSuffix,
      secondaryVpc.vpc,
      secondaryVpc.publicSubnets,
      secondaryLambda,
      secondaryProvider,
      defaultOpts
    );
    this.secondaryAlbDns = secondaryAlbResources.alb.dnsName;
    this.secondaryAlbArn = secondaryAlbResources.alb.arn;
    this.secondaryTargetGroupArn = secondaryAlbResources.targetGroup.arn;

    // Create SNS topics for notifications
    const primarySnsTopic = this.createSnsTopic(
      'primary',
      config.primaryRegion,
      config.environmentSuffix,
      primaryProvider,
      defaultOpts
    );
    this.primarySnsTopicArn = primarySnsTopic.arn;

    const secondarySnsTopic = this.createSnsTopic(
      'secondary',
      config.secondaryRegion,
      config.environmentSuffix,
      secondaryProvider,
      defaultOpts
    );
    this.secondarySnsTopicArn = secondarySnsTopic.arn;

    // Create SSM parameters
    this.createSsmParameters(
      config.primaryRegion,
      config.environmentSuffix,
      primaryAlbResources.alb.dnsName,
      primaryProvider,
      defaultOpts
    );

    this.createSsmParameters(
      config.secondaryRegion,
      config.environmentSuffix,
      secondaryAlbResources.alb.dnsName,
      secondaryProvider,
      defaultOpts
    );

    // Create Route53 resources
    const hostedZone = new aws.route53.Zone(
      `dr-zone-${config.environmentSuffix}`,
      {
        name: config.domainName,
        tags: {
          Name: `dr-zone-${config.environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'global',
        },
      },
      defaultOpts
    );
    this.hostedZoneId = hostedZone.zoneId;

    // Create health check for primary ALB
    const healthCheck = new aws.route53.HealthCheck(
      `dr-health-check-${config.environmentSuffix}`,
      {
        type: 'HTTPS',
        resourcePath: '/health',
        fqdn: primaryAlbResources.alb.dnsName,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
        measureLatency: true,
        tags: {
          Name: `dr-health-check-${config.environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      defaultOpts
    );
    this.healthCheckId = healthCheck.id;

    // Create CloudWatch alarm for health check
    new aws.cloudwatch.MetricAlarm(
      `dr-health-alarm-${config.environmentSuffix}`,
      {
        name: `dr-health-alarm-${config.environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthCheckStatus',
        namespace: 'AWS/Route53',
        period: 60,
        statistic: 'Minimum',
        threshold: 1,
        alarmDescription: 'Alert when primary region health check fails',
        alarmActions: [primarySnsTopic.arn],
        dimensions: {
          HealthCheckId: healthCheck.id,
        },
        tags: {
          Name: `dr-health-alarm-${config.environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { ...defaultOpts, provider: primaryProvider }
    );

    // Create Route53 records with failover routing
    new aws.route53.Record(
      `dr-primary-record-${config.environmentSuffix}`,
      {
        zoneId: hostedZone.zoneId,
        name: config.domainName,
        type: 'A',
        setIdentifier: 'primary',
        failoverRoutingPolicies: [
          {
            type: 'PRIMARY',
          },
        ],
        aliases: [
          {
            name: primaryAlbResources.alb.dnsName,
            zoneId: primaryAlbResources.alb.zoneId,
            evaluateTargetHealth: true,
          },
        ],
        healthCheckId: healthCheck.id,
      },
      defaultOpts
    );

    new aws.route53.Record(
      `dr-secondary-record-${config.environmentSuffix}`,
      {
        zoneId: hostedZone.zoneId,
        name: config.domainName,
        type: 'A',
        setIdentifier: 'secondary',
        failoverRoutingPolicies: [
          {
            type: 'SECONDARY',
          },
        ],
        aliases: [
          {
            name: secondaryAlbResources.alb.dnsName,
            zoneId: secondaryAlbResources.alb.zoneId,
            evaluateTargetHealth: true,
          },
        ],
      },
      defaultOpts
    );

    this.registerOutputs({
      primaryVpcId: this.primaryVpcId,
      secondaryVpcId: this.secondaryVpcId,
      dynamoTableName: this.dynamoTableName,
      primaryBucketName: this.primaryBucketName,
      secondaryBucketName: this.secondaryBucketName,
      primaryLambdaArn: this.primaryLambdaArn,
      secondaryLambdaArn: this.secondaryLambdaArn,
      primaryAlbDns: this.primaryAlbDns,
      secondaryAlbDns: this.secondaryAlbDns,
      primaryAlbArn: this.primaryAlbArn,
      secondaryAlbArn: this.secondaryAlbArn,
      primaryTargetGroupArn: this.primaryTargetGroupArn,
      secondaryTargetGroupArn: this.secondaryTargetGroupArn,
      hostedZoneId: this.hostedZoneId,
      healthCheckId: this.healthCheckId,
      primarySnsTopicArn: this.primarySnsTopicArn,
      secondarySnsTopicArn: this.secondarySnsTopicArn,
      hostedZoneNameServers: hostedZone.nameServers,
    });
  }

  private createVpc(
    role: string,
    region: string,
    environmentSuffix: string,
    provider: aws.Provider,
    opts: pulumi.ResourceOptions
  ) {
    const vpc = new aws.ec2.Vpc(
      `dr-vpc-${role}-${environmentSuffix}`,
      {
        cidrBlock: role === 'primary' ? '10.0.0.0/16' : '10.1.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `dr-vpc-${region}-production-${role}`,
          Environment: 'production',
          'DR-Role': role,
        },
      },
      { ...opts, provider }
    );

    const igw = new aws.ec2.InternetGateway(
      `dr-igw-${role}-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `dr-igw-${region}-production-${role}`,
          Environment: 'production',
          'DR-Role': role,
        },
      },
      { ...opts, provider }
    );

    const publicSubnets: aws.ec2.Subnet[] = [];
    const azs = ['a', 'b', 'c'];

    azs.forEach((az, index) => {
      const publicSubnet = new aws.ec2.Subnet(
        `dr-public-subnet-${role}-${az}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock:
            role === 'primary' ? `10.0.${index}.0/24` : `10.1.${index}.0/24`,
          availabilityZone: `${region}${az}`,
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `dr-public-subnet-${region}${az}-production-${role}`,
            Environment: 'production',
            'DR-Role': role,
          },
        },
        { ...opts, provider }
      );
      publicSubnets.push(publicSubnet);
    });

    const publicRouteTable = new aws.ec2.RouteTable(
      `dr-public-rt-${role}-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `dr-public-rt-${region}-production-${role}`,
          Environment: 'production',
          'DR-Role': role,
        },
      },
      { ...opts, provider }
    );

    new aws.ec2.Route(
      `dr-public-route-${role}-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { ...opts, provider }
    );

    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `dr-public-rta-${role}-${index}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { ...opts, provider }
      );
    });

    return { vpc, publicSubnets };
  }

  private createDynamoDBGlobalTable(
    primaryRegion: string,
    secondaryRegion: string,
    environmentSuffix: string,
    primaryProvider: aws.Provider,
    secondaryProvider: aws.Provider,
    opts: pulumi.ResourceOptions
  ) {
    const tableName = `dr-transactions-${environmentSuffix}`;

    const table = new aws.dynamodb.Table(
      `dr-dynamodb-${environmentSuffix}`,
      {
        name: tableName,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        pointInTimeRecovery: {
          enabled: true,
        },
        attributes: [
          {
            name: 'transactionId',
            type: 'S',
          },
        ],
        replicas: [
          {
            regionName: secondaryRegion,
            pointInTimeRecovery: true,
          },
        ],
        tags: {
          Name: `dr-dynamodb-${primaryRegion}-production-global`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { ...opts, provider: primaryProvider }
    );

    return table;
  }

  private createS3ReplicationRole(
    environmentSuffix: string,
    provider: aws.Provider,
    opts: pulumi.ResourceOptions
  ) {
    const assumeRolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 's3.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    };

    const role = new aws.iam.Role(
      `dr-s3-replication-role-${environmentSuffix}`,
      {
        name: `dr-s3-replication-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify(assumeRolePolicy),
        tags: {
          Name: `dr-s3-replication-role-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'global',
        },
      },
      { ...opts, provider }
    );

    return role;
  }

  private createS3Buckets(
    primaryRegion: string,
    secondaryRegion: string,
    environmentSuffix: string,
    replicationRole: aws.iam.Role,
    primaryProvider: aws.Provider,
    secondaryProvider: aws.Provider,
    opts: pulumi.ResourceOptions
  ) {
    const primaryBucketName = `dr-storage-${primaryRegion}-${environmentSuffix}`;
    const secondaryBucketName = `dr-storage-${secondaryRegion}-${environmentSuffix}`;

    const secondaryBucket = new aws.s3.Bucket(
      `dr-bucket-secondary-${environmentSuffix}`,
      {
        bucket: secondaryBucketName,
        tags: {
          Name: `dr-storage-${secondaryRegion}-production-secondary`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      { ...opts, provider: secondaryProvider }
    );

    new aws.s3.BucketVersioning(
      `dr-bucket-versioning-secondary-${environmentSuffix}`,
      {
        bucket: secondaryBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { ...opts, provider: secondaryProvider }
    );

    const primaryBucket = new aws.s3.Bucket(
      `dr-bucket-primary-${environmentSuffix}`,
      {
        bucket: primaryBucketName,
        tags: {
          Name: `dr-storage-${primaryRegion}-production-primary`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { ...opts, provider: primaryProvider }
    );

    new aws.s3.BucketVersioning(
      `dr-bucket-versioning-primary-${environmentSuffix}`,
      {
        bucket: primaryBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { ...opts, provider: primaryProvider }
    );

    // Create replication policy
    const replicationPolicy = pulumi
      .all([primaryBucket.arn, secondaryBucket.arn])
      .apply(([sourceArn, destArn]) => ({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
            Resource: sourceArn,
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
              's3:GetObjectVersionTagging',
            ],
            Resource: `${sourceArn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              's3:ReplicateObject',
              's3:ReplicateDelete',
              's3:ReplicateTags',
            ],
            Resource: `${destArn}/*`,
          },
        ],
      }));

    new aws.iam.RolePolicy(
      `dr-replication-policy-${environmentSuffix}`,
      {
        role: replicationRole.id,
        policy: replicationPolicy.apply(p => JSON.stringify(p)),
      },
      { ...opts, provider: primaryProvider }
    );

    // Configure replication on primary bucket
    new aws.s3.BucketReplicationConfig(
      `dr-replication-config-${environmentSuffix}`,
      {
        bucket: primaryBucket.id,
        role: replicationRole.arn,
        rules: [
          {
            id: 'replicate-all',
            status: 'Enabled',
            priority: 1,
            deleteMarkerReplication: {
              status: 'Enabled',
            },
            filter: {},
            destination: {
              bucket: secondaryBucket.arn,
              replicationTime: {
                status: 'Enabled',
                time: {
                  minutes: 15,
                },
              },
              metrics: {
                status: 'Enabled',
                eventThreshold: {
                  minutes: 15,
                },
              },
            },
          },
        ],
      },
      {
        ...opts,
        provider: primaryProvider,
        dependsOn: [primaryBucket, secondaryBucket],
      }
    );

    return { primaryBucket, secondaryBucket };
  }

  private createLambdaRole(
    environmentSuffix: string,
    dynamoTableArn: pulumi.Output<string>,
    provider: aws.Provider,
    opts: pulumi.ResourceOptions
  ) {
    const assumeRolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    };

    const role = new aws.iam.Role(
      `dr-lambda-role-${environmentSuffix}`,
      {
        name: `dr-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify(assumeRolePolicy),
        tags: {
          Name: `dr-lambda-role-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'global',
        },
      },
      { ...opts, provider }
    );

    new aws.iam.RolePolicyAttachment(
      `dr-lambda-basic-${environmentSuffix}`,
      {
        role: role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { ...opts, provider }
    );

    const dynamoPolicy = dynamoTableArn.apply(arn => ({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:Query',
            'dynamodb:Scan',
          ],
          Resource: arn,
        },
      ],
    }));

    new aws.iam.RolePolicy(
      `dr-lambda-dynamo-policy-${environmentSuffix}`,
      {
        role: role.id,
        policy: dynamoPolicy.apply(p => JSON.stringify(p)),
      },
      { ...opts, provider }
    );

    return role;
  }

  private createLambdaFunction(
    role: string,
    region: string,
    environmentSuffix: string,
    lambdaRole: aws.iam.Role,
    provider: aws.Provider,
    opts: pulumi.ResourceOptions
  ) {
    const lambdaFunction = new aws.lambda.Function(
      `dr-function-${role}-${environmentSuffix}`,
      {
        name: `dr-function-${region}-production-${role}-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        handler: 'index.handler',
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: 10,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({});

exports.handler = async (event) => {
  console.log("Processing request in ${region}");

  try {
    const transactionId = \`txn-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;

    const command = new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        transactionId: { S: transactionId },
        timestamp: { N: Date.now().toString() },
        region: { S: "${region}" },
        status: { S: "processed" },
      },
    });

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Transaction processed successfully",
        transactionId: transactionId,
        region: "${region}",
      }),
    };
  } catch (error) {
    console.error("Error processing transaction:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing transaction",
        error: error.message,
      }),
    };
  }
};
          `),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'dr-lambda',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-dynamodb': '^3.600.0',
              },
            })
          ),
        }),
        environment: {
          variables: {
            TABLE_NAME: `dr-transactions-${environmentSuffix}`,
            REGION: region,
          },
        },
        tags: {
          Name: `dr-function-${region}-production-${role}`,
          Environment: 'production',
          'DR-Role': role,
        },
      },
      { ...opts, provider }
    );

    return lambdaFunction;
  }

  private createApplicationLoadBalancer(
    role: string,
    region: string,
    environmentSuffix: string,
    vpc: aws.ec2.Vpc,
    subnets: aws.ec2.Subnet[],
    lambdaFunction: aws.lambda.Function,
    provider: aws.Provider,
    opts: pulumi.ResourceOptions
  ) {
    const securityGroup = new aws.ec2.SecurityGroup(
      `dr-alb-sg-${role}-${environmentSuffix}`,
      {
        name: `dr-alb-sg-${region}-${role}-${environmentSuffix}`,
        vpcId: vpc.id,
        description: 'Security group for DR ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS traffic',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic',
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
          Name: `dr-alb-sg-${region}-production-${role}`,
          Environment: 'production',
          'DR-Role': role,
        },
      },
      { ...opts, provider }
    );

    const alb = new aws.lb.LoadBalancer(
      `alb-${role}-${environmentSuffix}`,
      {
        // ALB names are limited to 32 characters
        name: `alb-${role.substring(0, 3)}-${environmentSuffix.substring(0, 12)}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [securityGroup.id],
        subnets: subnets.map(s => s.id),
        enableDeletionProtection: false,
        tags: {
          Name: `dr-alb-${region}-production-${role}`,
          Environment: 'production',
          'DR-Role': role,
        },
      },
      { ...opts, provider }
    );

    const targetGroup = new aws.lb.TargetGroup(
      `tg-${role}-${environmentSuffix}`,
      {
        // Target group names are limited to 32 characters
        // Pulumi adds random suffix, so keep base name short
        name: `tg-${role.substring(0, 3)}-${environmentSuffix.substring(0, 10)}`,
        targetType: 'lambda',
        tags: {
          Name: `dr-tg-${region}-production-${role}`,
          Environment: 'production',
          'DR-Role': role,
        },
      },
      { ...opts, provider }
    );

    new aws.lb.TargetGroupAttachment(
      `dr-tg-attachment-${role}-${environmentSuffix}`,
      {
        targetGroupArn: targetGroup.arn,
        targetId: lambdaFunction.arn,
      },
      { ...opts, provider, dependsOn: [lambdaFunction] }
    );

    new aws.lambda.Permission(
      `dr-lambda-permission-${role}-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'elasticloadbalancing.amazonaws.com',
        sourceArn: targetGroup.arn,
      },
      { ...opts, provider }
    );

    new aws.lb.Listener(
      `dr-listener-${role}-${environmentSuffix}`,
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
        tags: {
          Name: `dr-listener-${region}-production-${role}`,
          Environment: 'production',
          'DR-Role': role,
        },
      },
      { ...opts, provider }
    );

    return { alb, targetGroup };
  }

  private createSnsTopic(
    role: string,
    region: string,
    environmentSuffix: string,
    provider: aws.Provider,
    opts: pulumi.ResourceOptions
  ) {
    const topic = new aws.sns.Topic(
      `dr-sns-${role}-${environmentSuffix}`,
      {
        name: `dr-notifications-${region}-${role}-${environmentSuffix}`,
        displayName: `DR Failover Notifications - ${role}`,
        tags: {
          Name: `dr-sns-${region}-production-${role}`,
          Environment: 'production',
          'DR-Role': role,
        },
      },
      { ...opts, provider }
    );

    return topic;
  }

  private createSsmParameters(
    region: string,
    environmentSuffix: string,
    albDns: pulumi.Output<string>,
    provider: aws.Provider,
    opts: pulumi.ResourceOptions
  ) {
    new aws.ssm.Parameter(
      `dr-ssm-endpoint-${region}-${environmentSuffix}`,
      {
        name: `/dr/${environmentSuffix}/${region}/endpoint`,
        type: 'SecureString',
        value: albDns,
        description: `ALB endpoint for ${region} region`,
        tags: {
          Name: `dr-ssm-${region}-production-endpoint`,
          Environment: 'production',
          'DR-Role': region === 'us-east-1' ? 'primary' : 'secondary',
        },
      },
      { ...opts, provider }
    );
  }
}
