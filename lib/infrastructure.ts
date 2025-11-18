import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface PaymentInfrastructureArgs {
  environmentSuffix: string;
  environment: string;
  region: string;
  rdsInstanceClass: string;
  rdsBackupRetentionDays: number;
  lambdaMemorySize: number;
  lambdaTimeout: number;
}

export class PaymentInfrastructure extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly apiGatewayEndpoint: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly auditLogsBucket: aws.s3.BucketV2;
  public readonly paymentQueue: aws.sqs.Queue;
  public readonly processPaymentLambda: PaymentLambda;
  public readonly verifyPaymentLambda: PaymentLambda;

  constructor(
    name: string,
    args: PaymentInfrastructureArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:PaymentInfrastructure', name, {}, opts);

    const defaultOpts = { parent: this };

    // Create VPC with public and private subnets across 2 AZs
    const vpcModule = new VpcModule(
      `vpc-${args.environmentSuffix}`,
      {
        environmentSuffix: args.environmentSuffix,
        cidrBlock: '10.0.0.0/16',
      },
      defaultOpts
    );

    this.vpc = vpcModule.vpc;
    this.privateSubnetIds = vpcModule.privateSubnetIds;
    this.publicSubnetIds = vpcModule.publicSubnetIds;

    // Create S3 bucket for audit logs
    this.auditLogsBucket = new aws.s3.BucketV2(
      `audit-logs-${args.environmentSuffix}`,
      {
        bucket: `payment-audit-logs-${args.environmentSuffix}`,
        forceDestroy: true,
      },
      defaultOpts
    );

    // Enable versioning on S3 bucket
    new aws.s3.BucketVersioningV2(
      `audit-logs-versioning-${args.environmentSuffix}`,
      {
        bucket: this.auditLogsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      defaultOpts
    );

    // Add lifecycle policy for intelligent tiering
    new aws.s3.BucketLifecycleConfigurationV2(
      `audit-logs-lifecycle-${args.environmentSuffix}`,
      {
        bucket: this.auditLogsBucket.id,
        rules: [
          {
            id: 'intelligent-tiering',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'INTELLIGENT_TIERING',
              },
            ],
          },
        ],
      },
      defaultOpts
    );

    // Create Dead Letter Queue
    const dlq = new aws.sqs.Queue(
      `payment-dlq-${args.environmentSuffix}`,
      {
        name: `payment-notifications-dlq-${args.environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
      },
      defaultOpts
    );

    // Create SQS queue for payment notifications
    this.paymentQueue = new aws.sqs.Queue(
      `payment-queue-${args.environmentSuffix}`,
      {
        name: `payment-notifications-${args.environmentSuffix}`,
        visibilityTimeoutSeconds: 300,
        redrivePolicy: pulumi.jsonStringify({
          deadLetterTargetArn: dlq.arn,
          maxReceiveCount: 3,
        }),
      },
      defaultOpts
    );

    // Create RDS subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-${args.environmentSuffix}`,
      {
        name: `payment-db-subnet-${args.environmentSuffix}`,
        subnetIds: vpcModule.privateSubnetIds,
        tags: {
          Name: `payment-db-subnet-${args.environmentSuffix}`,
        },
      },
      defaultOpts
    );

    // Create security group for RDS
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `db-sg-${args.environmentSuffix}`,
      {
        name: `payment-db-sg-${args.environmentSuffix}`,
        vpcId: this.vpc.id,
        description: 'Security group for payment processing RDS instance',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'PostgreSQL access from VPC',
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
      },
      defaultOpts
    );

    // Create RDS PostgreSQL instance
    const dbInstance = new aws.rds.Instance(
      `payment-db-${args.environmentSuffix}`,
      {
        identifier: `payment-db-${args.environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '15.8',
        instanceClass: args.rdsInstanceClass,
        allocatedStorage: 20,
        storageType: 'gp3',
        storageEncrypted: true,
        dbName: 'paymentdb',
        username: 'dbadmin',
        password: pulumi.secret('ChangeMe123!'),
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [dbSecurityGroup.id],
        backupRetentionPeriod: args.rdsBackupRetentionDays,
        skipFinalSnapshot: true,
        deletionProtection: false,
        publiclyAccessible: false,
        multiAz: false,
        tags: {
          Name: `payment-db-${args.environmentSuffix}`,
          Environment: args.environment,
        },
      },
      defaultOpts
    );

    this.rdsEndpoint = dbInstance.endpoint;

    // Create IAM role for Lambda functions
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${args.environmentSuffix}`,
      {
        name: `payment-lambda-role-${args.environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
      },
      defaultOpts
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${args.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      defaultOpts
    );

    // Attach VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-vpc-execution-${args.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      defaultOpts
    );

    // Create inline policy for S3, SQS, and RDS access
    new aws.iam.RolePolicy(
      `lambda-policy-${args.environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([this.auditLogsBucket.arn, this.paymentQueue.arn])
          .apply(([bucketArn, queueArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:PutObject', 's3:GetObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'sqs:SendMessage',
                    'sqs:ReceiveMessage',
                    'sqs:DeleteMessage',
                    'sqs:GetQueueAttributes',
                  ],
                  Resource: queueArn,
                },
              ],
            })
          ),
      },
      defaultOpts
    );

    // Create security group for Lambda functions
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${args.environmentSuffix}`,
      {
        name: `payment-lambda-sg-${args.environmentSuffix}`,
        vpcId: this.vpc.id,
        description: 'Security group for payment processing Lambda functions',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
      },
      defaultOpts
    );

    // Create process payment Lambda function
    this.processPaymentLambda = new PaymentLambda(
      `process-payment-${args.environmentSuffix}`,
      {
        environmentSuffix: args.environmentSuffix,
        functionName: 'process-payment',
        handler: 'index.processPayment',
        role: lambdaRole,
        rdsEndpoint: dbInstance.endpoint,
        rdsDbName: 'paymentdb',
        rdsUsername: 'dbadmin',
        rdsPassword: pulumi.secret('ChangeMe123!'),
        auditLogsBucket: this.auditLogsBucket.bucket,
        paymentQueueUrl: this.paymentQueue.url,
        subnetIds: vpcModule.privateSubnetIds,
        securityGroupIds: [lambdaSecurityGroup.id],
        memorySize: args.lambdaMemorySize,
        timeout: args.lambdaTimeout,
      },
      defaultOpts
    );

    // Create verify payment Lambda function
    this.verifyPaymentLambda = new PaymentLambda(
      `verify-payment-${args.environmentSuffix}`,
      {
        environmentSuffix: args.environmentSuffix,
        functionName: 'verify-payment',
        handler: 'index.verifyPayment',
        role: lambdaRole,
        rdsEndpoint: dbInstance.endpoint,
        rdsDbName: 'paymentdb',
        rdsUsername: 'dbadmin',
        rdsPassword: pulumi.secret('ChangeMe123!'),
        auditLogsBucket: this.auditLogsBucket.bucket,
        paymentQueueUrl: this.paymentQueue.url,
        subnetIds: vpcModule.privateSubnetIds,
        securityGroupIds: [lambdaSecurityGroup.id],
        memorySize: args.lambdaMemorySize,
        timeout: args.lambdaTimeout,
      },
      defaultOpts
    );

    // Create API Gateway
    const api = new aws.apigatewayv2.Api(
      `payment-api-${args.environmentSuffix}`,
      {
        name: `payment-api-${args.environmentSuffix}`,
        protocolType: 'HTTP',
      },
      defaultOpts
    );

    // Create CloudWatch log group for API Gateway
    const apiLogGroup = new aws.cloudwatch.LogGroup(
      `api-logs-${args.environmentSuffix}`,
      {
        name: `/aws/apigateway/payment-api-${args.environmentSuffix}`,
        retentionInDays: 7,
      },
      defaultOpts
    );

    // Create API Gateway stage with logging
    new aws.apigatewayv2.Stage(
      `payment-api-stage-${args.environmentSuffix}`,
      {
        apiId: api.id,
        name: '$default',
        autoDeploy: true,
        accessLogSettings: {
          destinationArn: apiLogGroup.arn,
          format: JSON.stringify({
            requestId: '$context.requestId',
            ip: '$context.identity.sourceIp',
            requestTime: '$context.requestTime',
            httpMethod: '$context.httpMethod',
            routeKey: '$context.routeKey',
            status: '$context.status',
            protocol: '$context.protocol',
            responseLength: '$context.responseLength',
          }),
        },
      },
      defaultOpts
    );

    // Create integrations and routes for process payment
    const processPaymentIntegration = new aws.apigatewayv2.Integration(
      `process-payment-integration-${args.environmentSuffix}`,
      {
        apiId: api.id,
        integrationType: 'AWS_PROXY',
        integrationUri: this.processPaymentLambda.lambda.arn,
        payloadFormatVersion: '2.0',
      },
      defaultOpts
    );

    new aws.apigatewayv2.Route(
      `process-payment-route-${args.environmentSuffix}`,
      {
        apiId: api.id,
        routeKey: 'POST /process-payment',
        target: pulumi.interpolate`integrations/${processPaymentIntegration.id}`,
      },
      defaultOpts
    );

    // Grant API Gateway permission to invoke process payment Lambda
    new aws.lambda.Permission(
      `api-invoke-process-${args.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: this.processPaymentLambda.lambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      defaultOpts
    );

    // Create integrations and routes for verify payment
    const verifyPaymentIntegration = new aws.apigatewayv2.Integration(
      `verify-payment-integration-${args.environmentSuffix}`,
      {
        apiId: api.id,
        integrationType: 'AWS_PROXY',
        integrationUri: this.verifyPaymentLambda.lambda.arn,
        payloadFormatVersion: '2.0',
      },
      defaultOpts
    );

    new aws.apigatewayv2.Route(
      `verify-payment-route-${args.environmentSuffix}`,
      {
        apiId: api.id,
        routeKey: 'POST /verify-payment',
        target: pulumi.interpolate`integrations/${verifyPaymentIntegration.id}`,
      },
      defaultOpts
    );

    // Grant API Gateway permission to invoke verify payment Lambda
    new aws.lambda.Permission(
      `api-invoke-verify-${args.environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: this.verifyPaymentLambda.lambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      defaultOpts
    );

    this.apiGatewayEndpoint = api.apiEndpoint;

    this.registerOutputs({
      vpcId: this.vpc.id,
      privateSubnetIds: this.privateSubnetIds,
      publicSubnetIds: this.publicSubnetIds,
      apiGatewayEndpoint: this.apiGatewayEndpoint,
      rdsEndpoint: this.rdsEndpoint,
      auditLogsBucket: this.auditLogsBucket.bucket,
      paymentQueueUrl: this.paymentQueue.url,
    });
  }
}

class VpcModule extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;

  constructor(
    name: string,
    args: { environmentSuffix: string; cidrBlock: string },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:VpcModule', name, {}, opts);

    const defaultOpts = { parent: this };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: args.cidrBlock,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `payment-vpc-${args.environmentSuffix}`,
        },
      },
      defaultOpts
    );

    // Get availability zones
    const azs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create public subnets
    const publicSubnet1 = new aws.ec2.Subnet(
      `public-subnet-1-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: azs.then(az => az.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-1-${args.environmentSuffix}`,
        },
      },
      defaultOpts
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `public-subnet-2-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: azs.then(az => az.names[1]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-2-${args.environmentSuffix}`,
        },
      },
      defaultOpts
    );

    // Create private subnets
    const privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: azs.then(az => az.names[0]),
        tags: {
          Name: `payment-private-subnet-1-${args.environmentSuffix}`,
        },
      },
      defaultOpts
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.12.0/24',
        availabilityZone: azs.then(az => az.names[1]),
        tags: {
          Name: `payment-private-subnet-2-${args.environmentSuffix}`,
        },
      },
      defaultOpts
    );

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `payment-igw-${args.environmentSuffix}`,
        },
      },
      defaultOpts
    );

    // Create Elastic IP for NAT Gateway
    const eip = new aws.ec2.Eip(
      `nat-eip-${args.environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `payment-nat-eip-${args.environmentSuffix}`,
        },
      },
      defaultOpts
    );

    // Create NAT Gateway in first public subnet
    const natGateway = new aws.ec2.NatGateway(
      `nat-${args.environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        allocationId: eip.id,
        tags: {
          Name: `payment-nat-${args.environmentSuffix}`,
        },
      },
      defaultOpts
    );

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
          },
        ],
        tags: {
          Name: `payment-public-rt-${args.environmentSuffix}`,
        },
      },
      defaultOpts
    );

    // Associate public subnets with public route table
    new aws.ec2.RouteTableAssociation(
      `public-rta-1-${args.environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      defaultOpts
    );

    new aws.ec2.RouteTableAssociation(
      `public-rta-2-${args.environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      defaultOpts
    );

    // Create route table for private subnets
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway.id,
          },
        ],
        tags: {
          Name: `payment-private-rt-${args.environmentSuffix}`,
        },
      },
      defaultOpts
    );

    // Associate private subnets with private route table
    new aws.ec2.RouteTableAssociation(
      `private-rta-1-${args.environmentSuffix}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable.id,
      },
      defaultOpts
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-2-${args.environmentSuffix}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      },
      defaultOpts
    );

    this.privateSubnetIds = pulumi.output([
      privateSubnet1.id,
      privateSubnet2.id,
    ]);
    this.publicSubnetIds = pulumi.output([publicSubnet1.id, publicSubnet2.id]);

    this.registerOutputs({
      vpcId: this.vpc.id,
      privateSubnetIds: this.privateSubnetIds,
      publicSubnetIds: this.publicSubnetIds,
    });
  }
}

interface PaymentLambdaArgs {
  environmentSuffix: string;
  functionName: string;
  handler: string;
  role: aws.iam.Role;
  rdsEndpoint: pulumi.Output<string>;
  rdsDbName: string;
  rdsUsername: string;
  rdsPassword: pulumi.Output<string>;
  auditLogsBucket: pulumi.Output<string>;
  paymentQueueUrl: pulumi.Output<string>;
  subnetIds: pulumi.Output<string[]>;
  securityGroupIds: pulumi.Input<string>[];
  memorySize: number;
  timeout: number;
}

class PaymentLambda extends pulumi.ComponentResource {
  public readonly lambda: aws.lambda.Function;
  public readonly lambdaArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: PaymentLambdaArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:compute:PaymentLambda', name, {}, opts);

    const defaultOpts = { parent: this };

    // Create Lambda function
    this.lambda = new aws.lambda.Function(
      `${args.functionName}-${args.environmentSuffix}`,
      {
        name: `${args.functionName}-${args.environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: args.handler,
        role: args.role.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.processPayment = async (event) => {
    console.log('Processing payment:', JSON.stringify(event));
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Payment processed successfully' })
    };
};

exports.verifyPayment = async (event) => {
    console.log('Verifying payment:', JSON.stringify(event));
    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Payment verified successfully' })
    };
};
                `),
        }),
        environment: {
          variables: {
            RDS_ENDPOINT: args.rdsEndpoint,
            RDS_DB_NAME: args.rdsDbName,
            RDS_USERNAME: args.rdsUsername,
            RDS_PASSWORD: args.rdsPassword,
            AUDIT_LOGS_BUCKET: args.auditLogsBucket,
            PAYMENT_QUEUE_URL: args.paymentQueueUrl,
          },
        },
        vpcConfig: {
          subnetIds: args.subnetIds,
          securityGroupIds: args.securityGroupIds,
        },
        memorySize: args.memorySize,
        timeout: args.timeout,
      },
      defaultOpts
    );

    this.lambdaArn = this.lambda.arn;

    // Create CloudWatch alarm for Lambda errors
    new aws.cloudwatch.MetricAlarm(
      `${args.functionName}-errors-${args.environmentSuffix}`,
      {
        name: `${args.functionName}-errors-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: `Alarm when ${args.functionName} has more than 5 errors in 5 minutes`,
        dimensions: {
          FunctionName: this.lambda.name,
        },
      },
      defaultOpts
    );

    this.registerOutputs({
      lambdaArn: this.lambdaArn,
    });
  }
}
