Here's the complete CI/CD pipeline infrastructure using CDK with TypeScript:

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CiCdPipelineStack } from './cicd-pipeline-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 
      this.node.tryGetContext('environmentSuffix') || 
      'dev';

    // Create the CI/CD pipeline stack
    new CiCdPipelineStack(this, 'CiCdPipelineStack', {
      environmentSuffix,
    });
  }
}
```

## lib/cicd-pipeline-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface CiCdPipelineStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class CiCdPipelineStack extends cdk.NestedStack {
  public readonly artifactsBucket: s3.Bucket;
  public readonly database: rds.DatabaseInstance;
  public readonly deploymentRole: iam.Role;
  public readonly logGroup: logs.LogGroup;

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
      bucketName: `cicd-artifacts-secure-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
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

    // VPC for RDS
    const vpc = new ec2.Vpc(this, 'CiCdVpc', {
      maxAzs: 2,
      natGateways: 1,
      vpcName: `cicd-vpc-${environmentSuffix}`,
    });

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for CI/CD PostgreSQL database',
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from VPC'
    );

    // RDS PostgreSQL instance
    this.database = new rds.DatabaseInstance(this, 'PostgreSQLDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
      databaseName: 'cicddb',
      credentials: rds.Credentials.fromGeneratedSecret('postgres', {
        secretName: `rds-credentials-${environmentSuffix}`,
      }),
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      deleteAutomatedBackups: true,
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch log group
    this.logGroup = new logs.LogGroup(this, 'CiCdLogGroup', {
      logGroupName: `/aws/cicd/secure-pipeline-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM role for CI/CD deployments
    this.deploymentRole = new iam.Role(this, 'CiCdDeploymentRole', {
      roleName: `CiCdSecureDeploymentRole-${environmentSuffix}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('codebuild.amazonaws.com'),
        new iam.ServicePrincipal('codepipeline.amazonaws.com'),
        new iam.FederatedPrincipal(
          'arn:aws:iam::${AWS::AccountId}:oidc-provider/token.actions.githubusercontent.com',
          {
            StringEquals: {
              'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
            },
          },
          'sts:AssumeRoleWithWebIdentity'
        )
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
        actions: [
          's3:ListBucket',
          's3:GetBucketVersioning',
        ],
        resources: [this.artifactsBucket.bucketArn],
      })
    );

    this.deploymentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [this.logGroup.logGroupArn + ':*'],
      })
    );

    this.deploymentRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'kms:Decrypt',
          'kms:GenerateDataKey',
        ],
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
    const codeCatalystRole = new iam.Role(this, 'CodeCatalystIntegrationRole', {
      roleName: `CodeCatalyst-Integration-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('codecatalyst.amazonaws.com'),
    });

    codeCatalystRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeCatalystDeveloperRole')
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

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL endpoint',
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
```

## .github/workflows/cicd.yml

```yaml
name: Secure CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  NODE_VERSION: '18'

permissions:
  id-token: write
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOYMENT_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Run integration tests
        run: npm run test:integration

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_DEPLOYMENT_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Build CDK application
        run: npm run build

      - name: Deploy infrastructure
        run: |
          npx cdk bootstrap --require-approval never
          npx cdk deploy --all --require-approval never --context environmentSuffix=prod

      - name: Upload artifacts to S3
        run: |
          BUCKET_NAME=$(aws cloudformation describe-stacks \
            --stack-name TapStackprod \
            --query 'Stacks[0].Outputs[?OutputKey==`ArtifactsBucketName`].OutputValue' \
            --output text)
          
          tar -czf deployment-artifacts.tar.gz lib/ bin/ package.json
          aws s3 cp deployment-artifacts.tar.gz s3://$BUCKET_NAME/deployments/$(date +%Y%m%d-%H%M%S)/

      - name: Log deployment status
        run: |
          LOG_GROUP=$(aws cloudformation describe-stacks \
            --stack-name TapStackprod \
            --query 'Stacks[0].Outputs[?OutputKey==`LogGroupName`].OutputValue' \
            --output text)
          
          aws logs put-log-events \
            --log-group-name $LOG_GROUP \
            --log-stream-name deployment-$(date +%Y%m%d) \
            --log-events timestamp=$(date +%s000),message="Deployment completed successfully for commit ${{ github.sha }}"
```

## package.json

```json
{
  "name": "cicd-secure-pipeline",
  "version": "1.0.0",
  "description": "Secure CI/CD pipeline infrastructure with CDK",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "test:unit": "jest test/unit",
    "test:integration": "jest test/integration",
    "cdk": "cdk",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.0.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^18.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^5.0.0",
    "aws-cdk": "^2.100.0"
  }
}
```

This infrastructure provides:
- Secure S3 bucket with versioning and KMS encryption for artifacts
- RDS PostgreSQL with proper security groups and backup retention
- IAM roles with least privilege for GitHub Actions and AWS CodeCatalyst
- CloudWatch logging with encryption
- GitHub Actions workflow with OIDC authentication
- Proper resource tagging and security practices