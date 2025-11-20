import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Configuration interface for environment-specific settings
interface EnvironmentConfig {
  environment: string;
  vpcCidr: string;
  rdsInstanceClass: string;
  lambdaMemory: number;
  lambdaTimeout: number;
  s3RetentionDays: number;
  logRetentionDays: number;
  rdsAlarmThreshold: number;
  multiAz: boolean;
}

// Custom ComponentResource for VPC infrastructure
class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly internetGateway: aws.ec2.InternetGateway;

  constructor(
    name: string,
    args: {
      cidrBlock: string;
      environmentSuffix: string;
      tags: { [key: string]: string };
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:network:VpcComponent', name, {}, opts);

    const defaultOpts = { parent: this };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: args.cidrBlock,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      defaultOpts
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `igw-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      defaultOpts
    );

    // Create public subnets (2 AZs)
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `public-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: pulumi.interpolate`${args.cidrBlock.split('/')[0].split('.').slice(0, 2).join('.')}.${i * 2}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${i}-${args.environmentSuffix}`,
            Type: 'public',
            ...args.tags,
          },
        },
        defaultOpts
      );
      this.publicSubnets.push(subnet);
    }

    // Create private subnets (2 AZs)
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new aws.ec2.Subnet(
        `private-subnet-${i}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: pulumi.interpolate`${args.cidrBlock.split('/')[0].split('.').slice(0, 2).join('.')}.${i * 2 + 1}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          tags: {
            Name: `private-subnet-${i}-${args.environmentSuffix}`,
            Type: 'private',
            ...args.tags,
          },
        },
        defaultOpts
      );
      this.privateSubnets.push(subnet);
    }

    // Create Elastic IPs for NAT Gateways
    const eips = this.publicSubnets.map(
      (subnet, i) =>
        new aws.ec2.Eip(
          `nat-eip-${i}-${args.environmentSuffix}`,
          {
            domain: 'vpc',
            tags: {
              Name: `nat-eip-${i}-${args.environmentSuffix}`,
              ...args.tags,
            },
          },
          defaultOpts
        )
    );

    // Create NAT Gateways in public subnets
    this.natGateways = this.publicSubnets.map(
      (subnet, i) =>
        new aws.ec2.NatGateway(
          `nat-${i}-${args.environmentSuffix}`,
          {
            subnetId: subnet.id,
            allocationId: eips[i].id,
            tags: {
              Name: `nat-${i}-${args.environmentSuffix}`,
              ...args.tags,
            },
          },
          defaultOpts
        )
    );

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `public-rt-${args.environmentSuffix}`,
          ...args.tags,
        },
      },
      defaultOpts
    );

    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      defaultOpts
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        defaultOpts
      );
    });

    // Create private route tables (one per AZ)
    this.privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `private-rt-${i}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `private-rt-${i}-${args.environmentSuffix}`,
            ...args.tags,
          },
        },
        defaultOpts
      );

      new aws.ec2.Route(
        `private-route-${i}-${args.environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[i].id,
        },
        defaultOpts
      );

      new aws.ec2.RouteTableAssociation(
        `private-rta-${i}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        defaultOpts
      );
    });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(s => s.id),
      privateSubnetIds: this.privateSubnets.map(s => s.id),
    });
  }
}

// Configuration validation function
function validateConfig(config: EnvironmentConfig): void {
  const requiredFields: (keyof EnvironmentConfig)[] = [
    'environment',
    'vpcCidr',
    'rdsInstanceClass',
    'lambdaMemory',
    'lambdaTimeout',
    's3RetentionDays',
    'logRetentionDays',
    'rdsAlarmThreshold',
  ];

  for (const field of requiredFields) {
    if (
      config[field] === undefined ||
      config[field] === null ||
      config[field] === ''
    ) {
      throw new Error(`Missing required configuration value: ${field}`);
    }
  }

  // Validate CIDR format
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(config.vpcCidr)) {
    throw new Error(`Invalid CIDR block format: ${config.vpcCidr}`);
  }
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly lambdaArn: pulumi.Output<string>;
  public readonly apiUrl: pulumi.Output<string>;

  constructor(name: string, opts?: pulumi.ComponentResourceOptions) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    const config = new pulumi.Config();

    // Get environmentSuffix from config, environment variable, or use default
    const environmentSuffix =
      config.get('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      process.env.PR_NUMBER ||
      'dev';

    // Load environment-specific configuration with defaults
    const environment = config.get('environment') || environmentSuffix;

    // Determine environment-specific defaults based on environmentSuffix or environment
    const envType = environment.toLowerCase();
    const isDev = envType.includes('dev') || envType === 'dev';
    const isStaging = envType.includes('staging') || envType === 'staging';

    const envConfig: EnvironmentConfig = {
      environment: environment,
      vpcCidr:
        config.get('vpcCidr') ||
        (isDev ? '10.0.0.0/16' : isStaging ? '10.1.0.0/16' : '10.2.0.0/16'),
      rdsInstanceClass:
        config.get('rdsInstanceClass') ||
        (isDev ? 'db.t3.micro' : isStaging ? 'db.t3.small' : 'db.t3.medium'),
      lambdaMemory:
        config.getNumber('lambdaMemory') ||
        (isDev ? 128 : isStaging ? 256 : 512),
      lambdaTimeout:
        config.getNumber('lambdaTimeout') ||
        (isDev ? 30 : isStaging ? 60 : 120),
      s3RetentionDays:
        config.getNumber('s3RetentionDays') ||
        (isDev ? 7 : isStaging ? 30 : 90),
      logRetentionDays:
        config.getNumber('logRetentionDays') ||
        (isDev ? 7 : isStaging ? 14 : 30),
      rdsAlarmThreshold:
        config.getNumber('rdsAlarmThreshold') ||
        (isDev ? 80 : isStaging ? 75 : 70),
      multiAz:
        config.getBoolean('multiAz') !== undefined
          ? config.getBoolean('multiAz')!
          : !isDev,
    };

    // Validate configuration
    validateConfig(envConfig);

    const defaultOpts = { parent: this };
    const region = aws.getRegion();

    // Common tags for all resources
    const commonTags = {
      Environment: envConfig.environment,
      ManagedBy: 'Pulumi',
      CostCenter: 'Engineering',
    };

    // Create VPC using custom component
    const vpcComponent = new VpcComponent(
      `vpc-component-${environmentSuffix}`,
      {
        cidrBlock: envConfig.vpcCidr,
        environmentSuffix: environmentSuffix,
        tags: commonTags,
      },
      defaultOpts
    );

    this.vpcId = vpcComponent.vpc.id;

    // Security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${environmentSuffix}`,
      {
        vpcId: vpcComponent.vpc.id,
        description: 'Security group for RDS PostgreSQL',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [envConfig.vpcCidr],
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
        tags: {
          Name: `rds-sg-${environmentSuffix}`,
          ...commonTags,
        },
      },
      defaultOpts
    );

    // Security group for Lambda
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${environmentSuffix}`,
      {
        vpcId: vpcComponent.vpc.id,
        description: 'Security group for Lambda functions',
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
          Name: `lambda-sg-${environmentSuffix}`,
          ...commonTags,
        },
      },
      defaultOpts
    );

    // RDS subnet group
    const rdsSubnetGroup = new aws.rds.SubnetGroup(
      `rds-subnet-group-${environmentSuffix}`,
      {
        subnetIds: vpcComponent.privateSubnets.map(s => s.id),
        tags: {
          Name: `rds-subnet-group-${environmentSuffix}`,
          ...commonTags,
        },
      },
      defaultOpts
    );

    // RDS PostgreSQL instance
    const rdsInstance = new aws.rds.Instance(
      `rds-${environmentSuffix}`,
      {
        identifier: `rds-${environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '16.4',
        instanceClass: envConfig.rdsInstanceClass,
        allocatedStorage: 20,
        storageType: 'gp3',
        storageEncrypted: true,
        dbSubnetGroupName: rdsSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        multiAz: envConfig.multiAz,
        backupRetentionPeriod: 1,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'mon:04:00-mon:05:00',
        skipFinalSnapshot: true,
        deleteAutomatedBackups: true,
        deletionProtection: false,
        username: 'dbadmin',
        password:
          config.getSecret('dbPassword') || pulumi.secret('TempPassword123!'),
        tags: {
          Name: `rds-${environmentSuffix}`,
          ...commonTags,
        },
      },
      defaultOpts
    );

    this.rdsEndpoint = rdsInstance.endpoint;

    // CloudWatch alarm for RDS CPU utilization
    new aws.cloudwatch.MetricAlarm(
      `rds-cpu-alarm-${environmentSuffix}`,
      {
        name: `rds-cpu-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: envConfig.rdsAlarmThreshold,
        dimensions: {
          DBInstanceIdentifier: rdsInstance.identifier,
        },
        alarmDescription: `RDS CPU utilization exceeds ${envConfig.rdsAlarmThreshold}%`,
        tags: commonTags,
      },
      defaultOpts
    );

    // S3 bucket for application data
    // Generate unique bucket name using random suffix
    const bucketNamePrefix = `app-data-${environmentSuffix}`;

    const bucket = new aws.s3.Bucket(
      `app-data-${environmentSuffix}`,
      {
        // Let AWS generate unique bucket name with prefix
        bucketPrefix: bucketNamePrefix + '-',
        forceDestroy: true,
        tags: {
          Name: `app-data-${environmentSuffix}`,
          ...commonTags,
        },
      },
      defaultOpts
    );

    // S3 bucket versioning configuration (separate resource)
    new aws.s3.BucketVersioningV2(
      `app-data-versioning-${environmentSuffix}`,
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      defaultOpts
    );

    // S3 bucket server-side encryption configuration (separate resource)
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `app-data-encryption-${environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      defaultOpts
    );

    // S3 bucket lifecycle configuration (separate resource)
    new aws.s3.BucketLifecycleConfigurationV2(
      `app-data-lifecycle-${environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [
          {
            id: 'cleanup-old-versions',
            status: 'Enabled',
            noncurrentVersionExpiration: {
              noncurrentDays: envConfig.s3RetentionDays,
            },
          },
        ],
      },
      defaultOpts
    );

    this.bucketName = bucket.bucket;

    // IAM role for Lambda execution
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
      {
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
        tags: {
          Name: `lambda-role-${environmentSuffix}`,
          ...commonTags,
        },
      },
      defaultOpts
    );

    // Attach VPC execution policy to Lambda role
    new aws.iam.RolePolicyAttachment(
      `lambda-vpc-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      defaultOpts
    );

    // Lambda policy for S3 and CloudWatch
    const lambdaPolicy = new aws.iam.Policy(
      `lambda-policy-${environmentSuffix}`,
      {
        policy: pulumi.all([bucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject'],
                Resource: `${bucketArn}/*`,
              },
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Resource: 'arn:aws:logs:*:*:*',
              },
            ],
          })
        ),
        tags: commonTags,
      },
      defaultOpts
    );

    new aws.iam.RolePolicyAttachment(
      `lambda-custom-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: lambdaPolicy.arn,
      },
      defaultOpts
    );

    // CloudWatch log group for Lambda
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `lambda-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/data-processor-${environmentSuffix}`,
        retentionInDays: envConfig.logRetentionDays,
        tags: {
          Name: `lambda-logs-${environmentSuffix}`,
          ...commonTags,
        },
      },
      defaultOpts
    );

    // Lambda function for data processing
    const lambdaFunction = new aws.lambda.Function(
      `data-processor-${environmentSuffix}`,
      {
        name: `data-processor-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS20dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Data processed successfully',
      environment: '${envConfig.environment}',
      timestamp: new Date().toISOString(),
    }),
  };
};
        `),
        }),
        memorySize: envConfig.lambdaMemory,
        timeout: envConfig.lambdaTimeout,
        vpcConfig: {
          subnetIds: vpcComponent.privateSubnets.map(s => s.id),
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        environment: {
          variables: {
            ENVIRONMENT: envConfig.environment,
            RDS_ENDPOINT: rdsInstance.endpoint,
            S3_BUCKET: bucket.bucket,
          },
        },
        tags: {
          Name: `data-processor-${environmentSuffix}`,
          ...commonTags,
        },
      },
      { parent: this, dependsOn: [lambdaLogGroup] }
    );

    this.lambdaArn = lambdaFunction.arn;

    // IAM role for API Gateway
    const apiGatewayRole = new aws.iam.Role(
      `api-gateway-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'apigateway.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `api-gateway-role-${environmentSuffix}`,
          ...commonTags,
        },
      },
      defaultOpts
    );

    // API Gateway policy for Lambda invocation
    const apiGatewayPolicy = new aws.iam.Policy(
      `api-gateway-policy-${environmentSuffix}`,
      {
        policy: pulumi.all([lambdaFunction.arn]).apply(([lambdaArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'lambda:InvokeFunction',
                Resource: lambdaArn,
              },
            ],
          })
        ),
        tags: commonTags,
      },
      defaultOpts
    );

    new aws.iam.RolePolicyAttachment(
      `api-gateway-policy-attachment-${environmentSuffix}`,
      {
        role: apiGatewayRole.name,
        policyArn: apiGatewayPolicy.arn,
      },
      defaultOpts
    );

    // API Gateway REST API
    const api = new aws.apigateway.RestApi(
      `api-${environmentSuffix}`,
      {
        name: `api-${environmentSuffix}`,
        description: `API Gateway for ${envConfig.environment} environment`,
        tags: {
          Name: `api-${environmentSuffix}`,
          ...commonTags,
        },
      },
      defaultOpts
    );

    // API Gateway resource
    const apiResource = new aws.apigateway.Resource(
      `api-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'process',
      },
      defaultOpts
    );

    // API Gateway method
    const apiMethod = new aws.apigateway.Method(
      `api-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: apiResource.id,
        httpMethod: 'POST',
        authorization: 'AWS_IAM',
      },
      defaultOpts
    );

    // API Gateway integration
    const apiIntegration = new aws.apigateway.Integration(
      `api-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: apiResource.id,
        httpMethod: apiMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambdaFunction.invokeArn,
        credentials: apiGatewayRole.arn,
      },
      defaultOpts
    );

    // Lambda permission for API Gateway
    new aws.lambda.Permission(
      `api-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      defaultOpts
    );

    // API Gateway deployment
    const apiDeployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
      },
      { parent: this, dependsOn: [apiIntegration] }
    );

    // API Gateway stage
    const apiStage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: apiDeployment.id,
        stageName: envConfig.environment,
        tags: {
          Name: `api-stage-${environmentSuffix}`,
          ...commonTags,
        },
      },
      { parent: this }
    );

    // CloudWatch log group for API Gateway
    new aws.cloudwatch.LogGroup(
      `api-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/apigateway/${api.name}`,
        retentionInDays: envConfig.logRetentionDays,
        tags: {
          Name: `api-logs-${environmentSuffix}`,
          ...commonTags,
        },
      },
      defaultOpts
    );

    this.apiUrl = pulumi.interpolate`${api.id}.execute-api.${region.then(r => r.name)}.amazonaws.com/${apiStage.stageName}`;

    // Export stack outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      rdsEndpoint: this.rdsEndpoint,
      bucketName: this.bucketName,
      lambdaArn: this.lambdaArn,
      apiUrl: this.apiUrl,
    });
  }
}
