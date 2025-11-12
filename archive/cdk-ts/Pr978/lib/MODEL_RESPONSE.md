# Security Configuration as Code CDK TypeScript Implementation

I'll create a comprehensive security-focused CDK TypeScript implementation that addresses all your requirements. Here's the infrastructure code:

## bin/tap.ts

```ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', 'Production');
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
});
```

## lib/tap-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as macie from 'aws-cdk-lib/aws-macie';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const uniqueId = 'trainr640';

    // Create VPC for secure access control
    const vpc = new ec2.Vpc(this, `SecurityVPC-${environmentSuffix}`, {
      vpcName: `SecurityVPC-${uniqueId}-${environmentSuffix}`,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet-${uniqueId}-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet-${uniqueId}-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    cdk.Tags.of(vpc).add('Environment', 'Production');

    // Create KMS key for DynamoDB encryption
    const dynamoKmsKey = new kms.Key(this, `DynamoKMSKey-${environmentSuffix}`, {
      alias: `dynamodb-key-${uniqueId}-${environmentSuffix}`,
      description: 'KMS key for DynamoDB table encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    cdk.Tags.of(dynamoKmsKey).add('Environment', 'Production');

    // Create IAM role for secure S3 and DynamoDB access
    const securityRole = new iam.Role(this, `SecurityAccessRole-${environmentSuffix}`, {
      roleName: `SecurityAccessRole-${uniqueId}-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role with secure access to S3 and DynamoDB',
    });

    cdk.Tags.of(securityRole).add('Environment', 'Production');

    // Create S3 bucket with security configurations
    const secureS3Bucket = new s3.Bucket(this, `SecureS3Bucket-${environmentSuffix}`, {
      bucketName: `secure-s3-bucket-${uniqueId}-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    cdk.Tags.of(secureS3Bucket).add('Environment', 'Production');

    // Create bucket policy to restrict access to specific VPC and IAM role
    const bucketPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: 'RestrictToVPCAndRole',
          effect: iam.Effect.ALLOW,
          principals: [new iam.ArnPrincipal(securityRole.roleArn)],
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
          ],
          resources: [
            secureS3Bucket.bucketArn,
            secureS3Bucket.arnForObjects('*'),
          ],
          conditions: {
            StringEquals: {
              'aws:SourceVpc': vpc.vpcId,
            },
            Bool: {
              'aws:SecureTransport': 'true',
            },
          },
        }),
        new iam.PolicyStatement({
          sid: 'DenyInsecureConnections',
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ['s3:*'],
          resources: [
            secureS3Bucket.bucketArn,
            secureS3Bucket.arnForObjects('*'),
          ],
          conditions: {
            Bool: {
              'aws:SecureTransport': 'false',
            },
          },
        }),
      ],
    });

    secureS3Bucket.addToResourcePolicy(bucketPolicy.statements[0]);
    secureS3Bucket.addToResourcePolicy(bucketPolicy.statements[1]);

    // Create DynamoDB table with KMS encryption
    const secureTable = new dynamodb.Table(this, `SecureDynamoTable-${environmentSuffix}`, {
      tableName: `SecureTable-${uniqueId}-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: dynamoKmsKey,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    cdk.Tags.of(secureTable).add('Environment', 'Production');

    // Grant limited DynamoDB permissions to security role
    secureTable.grantReadWriteData(securityRole);

    // Create IAM policy for DynamoDB access with least privilege
    const dynamoPolicy = new iam.Policy(this, `DynamoSecurityPolicy-${environmentSuffix}`, {
      policyName: `DynamoSecurityPolicy-${uniqueId}-${environmentSuffix}`,
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:Query',
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
          ],
          resources: [secureTable.tableArn],
          conditions: {
            Bool: {
              'aws:SecureTransport': 'true',
            },
          },
        }),
      ],
    });

    dynamoPolicy.attachToRole(securityRole);
    cdk.Tags.of(dynamoPolicy).add('Environment', 'Production');

    // Create S3 bucket for CloudTrail logs
    const cloudTrailBucket = new s3.Bucket(this, `CloudTrailLogsBucket-${environmentSuffix}`, {
      bucketName: `cloudtrail-logs-${uniqueId}-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    cdk.Tags.of(cloudTrailBucket).add('Environment', 'Production');

    // Create CloudTrail for comprehensive logging
    const trail = new cloudtrail.Trail(this, `SecurityAuditTrail-${environmentSuffix}`, {
      trailName: `SecurityAuditTrail-${uniqueId}-${environmentSuffix}`,
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
    });

    // Add event selectors for S3 and DynamoDB
    trail.addS3EventSelector([{
      bucket: secureS3Bucket,
      objectPrefix: '',
    }]);

    trail.addEventSelector(cloudtrail.DataResourceType.DYNAMO_DB_TABLE, [secureTable.tableArn]);

    cdk.Tags.of(trail).add('Environment', 'Production');

    // Enable GuardDuty for threat detection
    const guardDuty = new guardduty.CfnDetector(this, `GuardDutyDetector-${environmentSuffix}`, {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
      dataSources: {
        s3Logs: {
          enable: true,
        },
        kubernetesAuditLogs: {
          enable: true,
        },
        malwareProtection: {
          scanEc2InstanceWithFindings: {
            ebsVolumes: true,
          },
        },
      },
    });

    cdk.Tags.of(guardDuty).add('Environment', 'Production');

    // Enable Macie for data security and classification
    const macieSession = new macie.CfnSession(this, `MacieSession-${environmentSuffix}`, {
      status: 'ENABLED',
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
    });

    cdk.Tags.of(macieSession).add('Environment', 'Production');

    // Create Macie classification job for S3 bucket
    const classificationJob = new macie.CfnClassificationJob(this, `S3ClassificationJob-${environmentSuffix}`, {
      jobType: 'SCHEDULED',
      name: `S3SecurityClassification-${uniqueId}-${environmentSuffix}`,
      s3JobDefinition: {
        bucketDefinitions: [{
          accountId: this.account,
          buckets: [secureS3Bucket.bucketName],
        }],
      },
      scheduleFrequency: {
        scheduleExpression: 'cron(0 2 ? * SUN *)', // Weekly on Sunday at 2 AM
      },
    });

    classificationJob.addDependency(macieSession);
    cdk.Tags.of(classificationJob).add('Environment', 'Production');

    // VPC Endpoint for S3 to ensure secure access
    const s3Endpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    cdk.Tags.of(s3Endpoint).add('Environment', 'Production');

    // VPC Endpoint for DynamoDB
    const dynamoEndpoint = vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    cdk.Tags.of(dynamoEndpoint).add('Environment', 'Production');

    // Outputs
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: secureS3Bucket.bucketName,
      description: 'Name of the secure S3 bucket',
      exportName: `S3BucketName-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableArn', {
      value: secureTable.tableArn,
      description: 'ARN of the secure DynamoDB table',
      exportName: `DynamoDBTableArn-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecurityRoleArn', {
      value: securityRole.roleArn,
      description: 'ARN of the security access role',
      exportName: `SecurityRoleArn-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'ARN of the CloudTrail for audit logging',
      exportName: `CloudTrailArn-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for secure network access',
      exportName: `VPCId-${uniqueId}-${environmentSuffix}`,
    });
  }
}
```

## cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
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
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
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
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```

This implementation provides:

1. **S3 Security**: Server-side encryption with SSE-S3, versioning enabled, VPC and IAM role restricted access, public access blocked, and HTTPS enforcement
2. **DynamoDB Security**: Customer-managed KMS encryption, limited IAM role access, and TLS enforcement
3. **Comprehensive Logging**: CloudTrail with S3 and DynamoDB event tracking, file validation enabled
4. **Latest Security Features**: AWS Macie for data classification and Amazon GuardDuty for threat detection
5. **Network Security**: VPC endpoints for secure service access
6. **Production Tagging**: All resources tagged with Environment = Production
7. **Required Outputs**: S3 bucket name and DynamoDB table ARN as specified

The code follows AWS CDK best practices and implements defense-in-depth security measures.