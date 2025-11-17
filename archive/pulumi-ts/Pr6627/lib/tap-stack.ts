import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcComponent } from './vpc-component';
import { getEnvironmentConfig } from './config';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'staging', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main Pulumi ComponentResource for multi-environment infrastructure.
 *
 * This component orchestrates the creation of:
 * - VPC with public and private subnets
 * - RDS PostgreSQL database
 * - S3 buckets with lifecycle policies
 * - Lambda functions
 * - API Gateway
 * - CloudWatch log groups and alarms
 * - IAM roles and policies
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly apiGatewayUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const config = getEnvironmentConfig(environmentSuffix);
    const tags = args.tags || config.tags;

    // Create VPC using the reusable component
    const vpc = new VpcComponent(
      'vpc',
      {
        vpcCidr: config.vpcCidr,
        availabilityZones: config.availabilityZones,
        environmentSuffix: environmentSuffix,
        tags: tags,
      },
      { parent: this }
    );

    // Create security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${environmentSuffix}`,
      {
        vpcId: vpc.vpcId,
        description: `Security group for RDS PostgreSQL - ${environmentSuffix}`,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: [config.vpcCidr],
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
        tags: pulumi.all([tags]).apply(([t]) => ({
          Name: `rds-sg-${environmentSuffix}`,
          ...t,
        })),
      },
      { parent: this }
    );

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: vpc.privateSubnetIds,
        tags: pulumi.all([tags]).apply(([t]) => ({
          Name: `db-subnet-group-${environmentSuffix}`,
          ...t,
        })),
      },
      { parent: this }
    );

    // Create RDS PostgreSQL instance
    const rdsInstance = new aws.rds.Instance(
      `postgres-${environmentSuffix}`,
      {
        identifier: `postgres-${environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '15',
        instanceClass: config.rdsInstanceClass,
        allocatedStorage: config.rdsAllocatedStorage,
        storageType: 'gp3',
        dbName: `appdb${environmentSuffix}`,
        username: 'dbadmin',
        password: pulumi.secret('ChangeMe123!'), // In production, use AWS Secrets Manager
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        multiAz: config.rdsMultiAz,
        backupRetentionPeriod: config.rdsBackupRetentionDays,
        skipFinalSnapshot: true,
        storageEncrypted: true,
        publiclyAccessible: false,
        deletionProtection: false,
        tags: pulumi.all([tags]).apply(([t]) => ({
          Name: `postgres-${environmentSuffix}`,
          ...t,
        })),
      },
      { parent: this }
    );

    // Get AWS account ID for unique bucket naming
    const accountId = aws.getCallerIdentityOutput().accountId;

    // Create S3 bucket with lifecycle policy
    const bucket = new aws.s3.BucketV2(
      `app-data-${environmentSuffix}`,
      {
        bucket: pulumi.interpolate`app-data-${environmentSuffix}-${accountId}`,
        tags: pulumi.all([tags]).apply(([t]) => ({
          Name: `app-data-${environmentSuffix}`,
          ...t,
        })),
      },
      { parent: this }
    );

    // Enable versioning
    new aws.s3.BucketVersioningV2(
      `bucket-versioning-${environmentSuffix}`,
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Enable encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `bucket-encryption-${environmentSuffix}`,
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
      { parent: this }
    );

    // Configure lifecycle policy
    new aws.s3.BucketLifecycleConfigurationV2(
      `bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [
          {
            id: `delete-old-versions-${environmentSuffix}`,
            status: 'Enabled',
            noncurrentVersionExpiration: {
              noncurrentDays: config.s3LifecycleRetentionDays,
            },
          },
        ],
      },
      { parent: this }
    );

    // Create IAM role for Lambda
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
      {
        name: `lambda-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
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
        }),
        tags: pulumi.all([tags]).apply(([t]) => t),
      },
      { parent: this }
    );

    // Attach basic execution policy
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create custom policy for S3 access
    const lambdaS3Policy = new aws.iam.Policy(
      `lambda-s3-policy-${environmentSuffix}`,
      {
        name: `lambda-s3-policy-${environmentSuffix}`,
        description: `Policy for Lambda to access S3 bucket - ${environmentSuffix}`,
        policy: bucket.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
                Resource: [arn, `${arn}/*`],
              },
            ],
          })
        ),
        tags: pulumi.all([tags]).apply(([t]) => t),
      },
      { parent: this }
    );

    // Attach S3 policy to Lambda role
    new aws.iam.RolePolicyAttachment(
      `lambda-s3-policy-attachment-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn: lambdaS3Policy.arn,
      },
      { parent: this }
    );

    // Create CloudWatch log group for Lambda
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(
      `lambda-log-group-${environmentSuffix}`,
      {
        name: `/aws/lambda/data-processor-${environmentSuffix}`,
        retentionInDays: config.logRetentionDays,
        tags: pulumi.all([tags]).apply(([t]) => t),
      },
      { parent: this }
    );

    // Create Lambda function with proper error handling
    const lambdaFunction = new aws.lambda.Function(
      `data-processor-${environmentSuffix}`,
      {
        name: `data-processor-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        memorySize: config.lambdaMemorySize,
        timeout: config.lambdaTimeout,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  try {
    console.log('Processing event:', JSON.stringify(event, null, 2));

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data processed successfully',
        environment: '${environmentSuffix}',
        timestamp: new Date().toISOString(),
        event: event
      }),
    };

    return response;
  } catch (error) {
    console.error('Error processing event:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing data',
        error: error.message,
        environment: '${environmentSuffix}',
        timestamp: new Date().toISOString()
      }),
    };
  }
};
          `),
        }),
        environment: {
          variables: {
            ENVIRONMENT: environmentSuffix,
            S3_BUCKET: bucket.bucket,
            RDS_ENDPOINT: rdsInstance.endpoint,
          },
        },
        tags: pulumi.all([tags]).apply(([t]) => ({
          Name: `data-processor-${environmentSuffix}`,
          ...t,
        })),
      },
      { parent: this, dependsOn: [lambdaLogGroup] }
    );

    // Create API Gateway REST API
    const api = new aws.apigateway.RestApi(
      `api-${environmentSuffix}`,
      {
        name: `data-api-${environmentSuffix}`,
        description: `API Gateway for data processing - ${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => t),
      },
      { parent: this }
    );

    // Create API Gateway resource
    const apiResource = new aws.apigateway.Resource(
      `api-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'process',
      },
      { parent: this }
    );

    // Create API Gateway method
    const apiMethod = new aws.apigateway.Method(
      `api-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: apiResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { parent: this }
    );

    // Create API Gateway integration with Lambda
    const apiIntegration = new aws.apigateway.Integration(
      `api-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: apiResource.id,
        httpMethod: apiMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambdaFunction.invokeArn,
      },
      { parent: this }
    );

    // Grant API Gateway permission to invoke Lambda
    new aws.lambda.Permission(
      `api-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaFunction.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    // Create API Gateway deployment
    const apiDeployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
      },
      { parent: this, dependsOn: [apiIntegration] }
    );

    // Create API Gateway stage
    new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        restApi: api.id,
        deployment: apiDeployment.id,
        stageName: environmentSuffix,
      },
      { parent: this }
    );

    // Create SNS topic for CloudWatch alarms
    const snsTopicForAlarms = new aws.sns.Topic(
      `rds-alarms-${environmentSuffix}`,
      {
        name: `rds-alarms-${environmentSuffix}`,
        tags: pulumi.all([tags]).apply(([t]) => t),
      },
      { parent: this }
    );

    // Create CloudWatch alarm for RDS CPU utilization
    new aws.cloudwatch.MetricAlarm(
      `rds-cpu-alarm-${environmentSuffix}`,
      {
        name: `rds-cpu-high-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: config.rdsCpuAlarmThreshold,
        alarmDescription: `RDS CPU utilization is above ${config.rdsCpuAlarmThreshold}%`,
        dimensions: {
          DBInstanceIdentifier: rdsInstance.identifier,
        },
        alarmActions: [snsTopicForAlarms.arn],
        tags: pulumi.all([tags]).apply(([t]) => t),
      },
      { parent: this }
    );

    // Store outputs
    this.vpcId = vpc.vpcId;
    this.rdsEndpoint = rdsInstance.endpoint;
    this.s3BucketName = bucket.bucket;
    this.lambdaFunctionArn = lambdaFunction.arn;
    this.apiGatewayUrl = pulumi.interpolate`https://${api.id}.execute-api.${aws.getRegionOutput().name}.amazonaws.com/${environmentSuffix}/process`;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: vpc.publicSubnetIds,
      privateSubnetIds: vpc.privateSubnetIds,
      rdsEndpoint: this.rdsEndpoint,
      rdsInstanceId: rdsInstance.id,
      s3BucketName: this.s3BucketName,
      s3BucketArn: bucket.arn,
      lambdaFunctionName: lambdaFunction.name,
      lambdaFunctionArn: this.lambdaFunctionArn,
      apiGatewayId: api.id,
      apiGatewayUrl: this.apiGatewayUrl,
      snsTopicArn: snsTopicForAlarms.arn,
    });
  }
}
