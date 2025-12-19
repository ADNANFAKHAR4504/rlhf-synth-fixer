import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import {
  VpcModule,
  S3Module,
  LambdaModule,
  CloudFrontModule,
  SecretsModule,
  ApiGatewayModule,
  MonitoringModule,
} from './modules';
import * as aws from '@cdktf/provider-aws';
import { TerraformOutput } from 'cdktf';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.
const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  // Expose modules for cross-stack references if needed
  public readonly vpc: VpcModule;
  public readonly storage: S3Module;
  public readonly lambda: LambdaModule;
  public readonly cdn: CloudFrontModule;
  public readonly api: ApiGatewayModule;
  public readonly secrets: SecretsModule;
  public readonly monitoring: MonitoringModule;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags
      ? [props.defaultTags]
      : [
          {
            tags: {
              Environment: environmentSuffix,
              ManagedBy: 'CDKTF',
              Stack: id,
              Project: 'ServerlessApp',
            },
          },
        ];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ========================================
    // STACK INSTANTIATIONS
    // ========================================

    // 1. VPC Module - Network foundation for Lambda
    this.vpc = new VpcModule(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      azCount: 2, // Use 2 AZs for HA
      region: awsRegion,
      environment: environmentSuffix,
    });

    // 2. Secrets Module - Store application secrets
    this.secrets = new SecretsModule(this, 'secrets', {
      secretName: `${environmentSuffix}-new-app-secrets`,
      description: 'Application secrets for serverless app',
      environment: environmentSuffix,
      secretData: {
        apiKey: 'YOUR_API_KEY_HERE',
        dbConnectionString: 'YOUR_CONNECTION_STRING_HERE',
        jwtSecret: 'YOUR_JWT_SECRET_HERE',
      },
      rotationDays: 90,
    });

    // 3. S3 Module - Content storage bucket
    // FIXED: Changed lifecycle rule format to use 'status' field
    this.storage = new S3Module(this, 'content-storage', {
      bucketName: `${environmentSuffix}-serverless-content-${Date.now()}`,
      environment: environmentSuffix,
      enableCors: true,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          status: 'Enabled', // FIXED: Changed from 'enabled: true' to 'status: "Enabled"'
          prefix: 'logs/',
          expiration: {
            days: 30,
          },
        },
        {
          id: 'transition-to-ia',
          status: 'Enabled', // FIXED: Changed from 'enabled: true' to 'status: "Enabled"'
          prefix: 'archives/',
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    // 4. Lambda Module - Serverless compute
    this.lambda = new LambdaModule(this, 'api-lambda', {
      functionName: `${environmentSuffix}-api-handler`,
      handler: 'index.handler',
      runtime: 'python3.9',
      memorySize: 1024, // Optimized for performance
      timeout: 30,
      sourceBucket: 'lambda-zip-b',
      sourceKey: 'security-lambda.zip', // You'll need to upload your code here
      environment: environmentSuffix,
      vpcConfig: {
        subnetIds: this.vpc.privateSubnets.map(subnet => subnet.id),
        securityGroupIds: [this.vpc.securityGroup.id],
      },
      environmentVariables: {
        ENVIRONMENT: environmentSuffix,
        SECRET_ARN: this.secrets.secret.arn,
        S3_BUCKET: this.storage.bucket.id,
        REGION: awsRegion,
      },
      reservedConcurrentExecutions: environmentSuffix === 'prod' ? 200 : 50,
    });

    // Grant Lambda permissions to access S3 and Secrets
    this.addLambdaPermissions();

    // 5. API Gateway Module - HTTP API endpoint
    this.api = new ApiGatewayModule(this, 'http-api', {
      apiName: `${environmentSuffix}-serverless-api`,
      environment: environmentSuffix,
      lambdaFunctionArn: this.lambda.function.arn,
      lambdaFunctionName: this.lambda.function.functionName,
      throttleSettings: {
        rateLimit: environmentSuffix === 'prod' ? 10000 : 1000,
        burstLimit: environmentSuffix === 'prod' ? 5000 : 500,
      },
    });

    // 6. CloudFront Module - CDN for content delivery
    this.cdn = new CloudFrontModule(this, 'cdn', {
      s3BucketDomainName: this.storage.bucket.bucketRegionalDomainName,
      s3BucketId: this.storage.bucket.id,
      environment: environmentSuffix,
      priceClass:
        environmentSuffix === 'prod' ? 'PriceClass_All' : 'PriceClass_100',
      // Uncomment if you have a custom domain and certificate
      // customDomain: 'app.example.com',
      // certificateArn: 'arn:aws:acm:us-east-1:...',
    });

    // Update S3 bucket policy to allow CloudFront access
    this.updateS3BucketPolicyForCloudFront();

    // 7. Monitoring Module - Observability
    this.monitoring = new MonitoringModule(this, 'monitoring', {
      environment: environmentSuffix,
      lambdaFunctionName: this.lambda.function.functionName,
      apiId: this.api.api.id,
      // Create SNS topic for alarms if needed
      // snsTopicArn: this.createSnsAlarmTopic().arn,
    });

    // ========================================
    // OUTPUT IMPORTANT VALUES
    // ========================================
    this.createOutputs();
  }

  /**
   * Add necessary IAM permissions for Lambda
   */
  private addLambdaPermissions(): void {
    // S3 access policy
    new aws.iamRolePolicy.IamRolePolicy(this, 'lambda-s3-policy', {
      name: `${this.lambda.function.functionName}-s3-access`,
      role: this.lambda.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [this.storage.bucket.arn, `${this.storage.bucket.arn}/*`],
          },
        ],
      }),
    });

    // Secrets Manager access policy
    new aws.iamRolePolicy.IamRolePolicy(this, 'lambda-secrets-policy', {
      name: `${this.lambda.function.functionName}-secrets-access`,
      role: this.lambda.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: this.secrets.secret.arn,
          },
        ],
      }),
    });

    // X-Ray tracing policy
    new aws.iamRolePolicy.IamRolePolicy(this, 'lambda-xray-policy', {
      name: `${this.lambda.function.functionName}-xray-access`,
      role: this.lambda.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
            Resource: '*',
          },
        ],
      }),
    });
  }

  /**
   * Update S3 bucket policy to allow CloudFront OAC access
   */
  private updateS3BucketPolicyForCloudFront(): void {
    new aws.s3BucketPolicy.S3BucketPolicy(this, 's3-cloudfront-policy', {
      bucket: this.storage.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontOAC',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: 's3:GetObject',
            Resource: `${this.storage.bucket.arn}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': this.cdn.distribution.arn,
              },
            },
          },
        ],
      }),
    });
  }

  /**
   * Create Terraform outputs for important values
   */
  private createOutputs(): void {
    new TerraformOutput(this, 'api-endpoint', {
      value: this.api.stage.invokeUrl,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'cloudfront-domain', {
      value: this.cdn.distribution.domainName,
      description: 'CloudFront distribution domain name',
    });

    new TerraformOutput(this, 'cloudfront-distribution-id', {
      value: this.cdn.distribution.id,
      description: 'CloudFront distribution ID',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: this.storage.bucket.id,
      description: 'S3 bucket name',
    });

    new TerraformOutput(this, 'lambda-function-name', {
      value: this.lambda.function.functionName,
      description: 'Lambda function name',
    });

    new TerraformOutput(this, 'lambda-function-arn', {
      value: this.lambda.function.arn,
      description: 'Lambda function ARN',
    });

    new TerraformOutput(this, 'vpc-id', {
      value: this.vpc.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'monitoring-dashboard-url', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${this.monitoring.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
