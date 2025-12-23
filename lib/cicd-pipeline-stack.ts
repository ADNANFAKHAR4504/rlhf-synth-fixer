import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

// LocalStack detection
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.AWS_ENDPOINT_URL_S3?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL_S3?.includes('4566');

interface CiCdPipelineStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class CiCdPipelineStack extends cdk.Stack {
  public readonly artifactsBucket: s3.Bucket;
  public readonly deploymentRole: iam.Role;
  public readonly logGroup: logs.LogGroup;
  public readonly dbConnectionParam: ssm.StringParameter;

  constructor(scope: Construct, id: string, props: CiCdPipelineStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // KMS key for encryption
    const encryptionKey = new kms.Key(this, 'CiCdEncryptionKey', {
      description: `CI/CD encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 bucket for build artifacts
    this.artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `cicd-artifacts-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'cleanup-old-versions',
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SSM Parameter to simulate database connection info
    // In a real scenario with VPC limits, we'd use an existing database or serverless option
    this.dbConnectionParam = new ssm.StringParameter(
      this,
      'DatabaseConnectionParam',
      {
        parameterName: `/cicd/${environmentSuffix}/db-connection`,
        stringValue: JSON.stringify({
          host: 'mock-rds-endpoint.region.rds.amazonaws.com',
          port: 5432,
          database: 'cicddb',
          engine: 'postgres',
          description: 'Simulated RDS connection for CI/CD pipeline',
        }),
        description: `Database connection parameters for ${environmentSuffix} environment`,
        tier: ssm.ParameterTier.STANDARD,
      }
    );

    // CloudWatch metric for monitoring (created for future use)
    new cloudwatch.Metric({
      namespace: 'CICDPipeline',
      metricName: 'DeploymentCount',
      dimensionsMap: {
        Environment: environmentSuffix,
      },
    });

    // CloudWatch log group - without KMS encryption to avoid dependency issues
    this.logGroup = new logs.LogGroup(this, 'CiCdLogGroup', {
      logGroupName: `/aws/cicd/secure-pipeline-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Note: GitHub OIDC integration removed for LocalStack compatibility
    // OpenIdConnectProvider custom resource not well supported in LocalStack Community

    // IAM role for CI/CD deployments
    this.deploymentRole = new iam.Role(this, 'CiCdDeploymentRole', {
      roleName: `CiCdSecureDeploymentRole-${environmentSuffix}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('codebuild.amazonaws.com'),
        new iam.ServicePrincipal('codepipeline.amazonaws.com')
        // WebIdentityPrincipal removed for LocalStack compatibility
      ),
    });

    // Policies for deployment role
    this.deploymentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:GetObjectVersion',
          's3:PutObject',
          's3:DeleteObject',
        ],
        resources: [this.artifactsBucket.bucketArn + '/*'],
      })
    );

    this.deploymentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:ListBucket', 's3:GetBucketVersioning'],
        resources: [this.artifactsBucket.bucketArn],
      })
    );

    this.deploymentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [this.logGroup.logGroupArn + ':*'],
      })
    );

    this.deploymentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: [encryptionKey.keyArn],
      })
    );

    this.deploymentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:CreateStack',
          'cloudformation:UpdateStack',
          'cloudformation:DeleteStack',
          'cloudformation:DescribeStacks',
          'cloudformation:DescribeStackEvents',
          'cloudformation:DescribeStackResources',
          'cloudformation:GetTemplate',
        ],
        resources: ['*'],
        conditions: {
          StringLike: {
            'cloudformation:StackName': `*${environmentSuffix}*`,
          },
        },
      })
    );

    // CodeCatalyst integration role
    new iam.Role(this, 'CodeCatalystIntegrationRole', {
      roleName: `CodeCatalyst-Integration-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codecatalyst.amazonaws.com'),
    });

    // Application Composer integration - SSM parameter for configuration
    new ssm.StringParameter(this, 'ApplicationComposerConfig', {
      parameterName: `/cicd/${environmentSuffix}/app-composer-config`,
      stringValue: JSON.stringify({
        enabled: true,
        visualizationEnabled: true,
        integrationPattern: 'event-driven',
      }),
      description: `Application Composer configuration for ${environmentSuffix}`,
    });

    // CloudWatch Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'CICDDashboard', {
      dashboardName: `cicd-dashboard-${environmentSuffix}`,
      defaultInterval: cdk.Duration.hours(1),
    });

    dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `# CI/CD Pipeline Dashboard - ${environmentSuffix}\n\nMonitoring deployment metrics and pipeline health`,
        width: 24,
        height: 2,
      })
    );

    // Tagging all resources
    const tags = {
      Environment: environmentSuffix,
      Project: 'CiCdSecurePipeline',
      ManagedBy: 'CDK',
      SecurityLevel: 'High',
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: this.artifactsBucket.bucketName,
      description: 'S3 bucket for storing build artifacts',
    });

    new cdk.CfnOutput(this, 'DatabaseConnectionParamOutput', {
      value: this.dbConnectionParam.parameterName,
      description: 'SSM Parameter containing database connection info',
    });

    new cdk.CfnOutput(this, 'DeploymentRoleArn', {
      value: this.deploymentRole.roleArn,
      description: 'IAM role ARN for CI/CD deployments',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: this.logGroup.logGroupName,
      description: 'CloudWatch log group for CI/CD pipeline',
    });
  }
}
