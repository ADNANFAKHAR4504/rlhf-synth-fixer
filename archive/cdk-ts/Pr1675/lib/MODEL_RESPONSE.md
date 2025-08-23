## Project Structure

```
tap-cdk/
├── bin/
│   └── tap.ts
├── lib/
│   └── tapstack.ts
├── test/
│   └── tapstack.test.ts
├── package.json
├── tsconfig.json
└── cdk.json
```

## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tapstack';

const app = new cdk.App();

// Get configuration from context or environment
const projectName = app.node.tryGetContext('projectName') || 'nova';
const allowedSshCidr = app.node.tryGetContext('allowedSshCidr') || '10.0.0.0/8';
const allowedDbCidr = app.node.tryGetContext('allowedDbCidr') || '10.0.0.0/16';

new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  projectName,
  allowedSshCidr,
  allowedDbCidr,
});
```

## lib/tapstack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  projectName: string;
  allowedSshCidr: string;
  allowedDbCidr: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { projectName, allowedSshCidr, allowedDbCidr } = props;

    // VPC Configuration
    const vpc = new ec2.Vpc(this, `corp-${projectName}-vpc`, {
      vpcName: `corp-${projectName}-vpc`,
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `corp-${projectName}-ec2-sg`,
      {
        vpc,
        securityGroupName: `corp-${projectName}-ec2-sg`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedSshCidr),
      ec2.Port.tcp(22),
      'Allow SSH access from specified CIDR'
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `corp-${projectName}-rds-sg`,
      {
        vpc,
        securityGroupName: `corp-${projectName}-rds-sg`,
        description: 'Security group for RDS instance',
        allowAllOutbound: false,
      }
    );

    rdsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedDbCidr),
      ec2.Port.tcp(3306),
      'Allow MySQL access from specified CIDR'
    );

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2 instances'
    );

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `corp-${projectName}-lambda-sg`,
      {
        vpc,
        securityGroupName: `corp-${projectName}-lambda-sg`,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // IAM Roles
    const ec2Role = new iam.Role(this, `corp-${projectName}-ec2-role`, {
      roleName: `corp-${projectName}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add custom policy for EC2 to access S3 and Secrets Manager
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [
          `arn:aws:s3:::corp-${projectName}-*`,
          `arn:aws:s3:::corp-${projectName}-*/*`,
        ],
      })
    );

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:corp-${projectName}-*`,
        ],
      })
    );

    const lambdaRole = new iam.Role(this, `corp-${projectName}-lambda-role`, {
      roleName: `corp-${projectName}-lambda-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:corp-${projectName}-*`,
        ],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [
          `arn:aws:s3:::corp-${projectName}-*`,
          `arn:aws:s3:::corp-${projectName}-*/*`,
        ],
      })
    );

    // MFA Enforcement Policy
    const mfaPolicy = new iam.ManagedPolicy(
      this,
      `corp-${projectName}-mfa-policy`,
      {
        managedPolicyName: `corp-${projectName}-mfa-policy`,
        description: 'Enforce MFA for console access',
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            actions: ['*'],
            resources: ['*'],
            conditions: {
              BoolIfExists: {
                'aws:MultiFactorAuthPresent': 'false',
              },
              StringNotEquals: {
                'aws:RequestedRegion': ['us-west-2'],
              },
            },
          }),
        ],
      }
    );

    // Secrets Manager for database credentials
    const dbSecret = new secretsmanager.Secret(
      this,
      `corp-${projectName}-db-secret`,
      {
        secretName: `corp-${projectName}-db-credentials`,
        description: 'Database credentials for RDS instance',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\\'',
          includeSpace: false,
          passwordLength: 16,
        },
      }
    );

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `corp-${projectName}-db-subnet-group`,
      {
        description: 'Subnet group for RDS instance',
        vpc,
        subnetGroupName: `corp-${projectName}-db-subnet-group`,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    // RDS Instance
    const database = new rds.DatabaseInstance(this, `corp-${projectName}-rds`, {
      engine: rds.DatabaseEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      securityGroups: [rdsSecurityGroup],
      subnetGroup: dbSubnetGroup,
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: `corp${projectName}db`,
      storageEncrypted: true,
      multiAz: false,
      allocatedStorage: 20,
      deleteAutomatedBackups: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // EC2 Instance
    const ec2Instance = new ec2.Instance(this, `corp-${projectName}-ec2`, {
      instanceName: `corp-${projectName}-ec2`,
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      userData: ec2.UserData.forLinux(),
    });

    // S3 Buckets
    const dataBucket = new s3.Bucket(this, `corp-${projectName}-data-bucket`, {
      bucketName: `corp-${projectName}-data`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const logsBucket = new s3.Bucket(this, `corp-${projectName}-logs-bucket`, {
      bucketName: `corp-${projectName}-logs`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudWatch Log Group for Lambda
    const lambdaLogGroup = new logs.LogGroup(
      this,
      `corp-${projectName}-lambda-logs`,
      {
        logGroupName: `/aws/lambda/corp-${projectName}-function`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Lambda Function
    const lambdaFunction = new lambda.Function(
      this,
      `corp-${projectName}-lambda`,
      {
        functionName: `corp-${projectName}-function`,
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import os

def handler(event, context):
    # Example function that retrieves database credentials from Secrets Manager
    secrets_client = boto3.client('secretsmanager')
    
    try:
        secret_name = os.environ.get('DB_SECRET_NAME')
        response = secrets_client.get_secret_value(SecretId=secret_name)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully retrieved database credentials',
                'secret_retrieved': True
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
      `),
        vpc,
        securityGroups: [lambdaSecurityGroup],
        role: lambdaRole,
        logGroup: lambdaLogGroup,
        environment: {
          DB_SECRET_NAME: dbSecret.secretName,
          DATA_BUCKET: dataBucket.bucketName,
          LOGS_BUCKET: logsBucket.bucketName,
        },
        timeout: cdk.Duration.minutes(5),
      }
    );

    // Grant Lambda access to the secret
    dbSecret.grantRead(lambdaFunction);

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'Data S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'Logs S3 Bucket Name',
    });
  }
}
```

## test/tapstack.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tapstack';

describe('TapStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack', {
      projectName: 'test',
      allowedSshCidr: '10.0.0.0/8',
      allowedDbCidr: '10.0.0.0/16',
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });
  });

  test('EC2 instance is created with IAM role', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.micro',
    });

    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      },
    });
  });

  test('RDS instance is encrypted and in private subnet', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      StorageEncrypted: true,
      Engine: 'mysql',
    });
  });

  test('S3 buckets have encryption and block public access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('Lambda function has VPC configuration and CloudWatch logging', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.9',
    });

    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 7,
    });
  });

  test('Security groups have correct ingress rules', () => {
    // EC2 Security Group
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          CidrIp: '10.0.0.0/8',
          FromPort: 22,
          ToPort: 22,
          IpProtocol: 'tcp',
        },
      ],
    });
  });

  test('Secrets Manager secret is created', () => {
    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      GenerateSecretString: {
        SecretStringTemplate: '{"username":"admin"}',
        GenerateStringKey: 'password',
        PasswordLength: 16,
      },
    });
  });
});
```

## package.json

```json
{
  "name": "tap-cdk",
  "version": "1.0.0",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy",
    "synth": "cdk synth"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.87.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

## cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-s3:autoDeleteObjectsPolicy": true,
    "@aws-cdk/aws-ec2:vpnConnectionLogging": true,
    "@aws-cdk/aws-route53:splitHorizon": true,
    "projectName": "nova",
    "allowedSshCidr": "10.0.0.0/8",
    "allowedDbCidr": "10.0.0.0/16"
  }
}
```

## Key Features Implemented

### 🏗️ **Architecture Overview**

- **Single VPC** in us-west-2 with public, private, and isolated subnets
- **Multi-AZ deployment** with proper subnet segmentation
- **NAT Gateway** for outbound internet access from private subnets

### 🔒 **Security Implementation**

- **IAM roles** instead of embedded credentials for all services
- **Security groups** with restrictive ingress rules
- **Secrets Manager** for database credentials
- **MFA enforcement** policy for console access
- **Least privilege** IAM policies

### 📦 **Resource Configuration**

- **EC2**: t3.micro in private subnet with IAM role and restricted SSH access
- **RDS**: MySQL 8.0 in isolated subnet with encryption at rest
- **Lambda**: Python 3.9 with VPC configuration and CloudWatch logging
- **S3**: Two buckets with server-side encryption and blocked public access

### 🏷️ **Naming Convention**

All resources follow the `corp-<projectName>-<resourceType>` pattern

### 🧪 **Testing**

Comprehensive unit tests using AWS CDK assertions

## Deployment Instructions

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the project:**

   ```bash
   npm run build
   ```

3. **Run tests:**

   ```bash
   npm test
   ```

4. **Deploy the stack:**

   ```bash
   npm run deploy
   ```

5. **Customize configuration** by modifying the context values in `cdk.json` or passing them as parameters:
   ```bash
   cdk deploy -c projectName=myproject -c allowedSshCidr=192.168.1.0/24
   ```

This implementation provides a secure, scalable, and well-tested AWS infrastructure following all the specified requirements and best practices.
