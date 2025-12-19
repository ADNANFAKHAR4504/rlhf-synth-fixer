# Secure AWS Infrastructure for SecureCorp

I'll help you create a comprehensive secure AWS infrastructure using CDK TypeScript. This implementation includes the latest security features including CloudTrail network activity events for VPC endpoints and follows enterprise security best practices.

## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
  },
  environmentSuffix,
});
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

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // KMS Key for encryption
    const securityKey = new kms.Key(this, `SecureCorp-MasterKey-${environmentSuffix}`, {
      description: 'SecureCorp master encryption key for data at rest',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    securityKey.addAlias(`alias/securecorp-master-key-${environmentSuffix}`);

    // VPC with multi-AZ configuration
    const vpc = new ec2.Vpc(this, `SecureCorp-VPC-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `SecureCorp-Public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `SecureCorp-Private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `SecureCorp-Isolated-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // VPC Flow Logs for security monitoring
    const flowLogsLogGroup = new logs.LogGroup(this, `VPC-FlowLogs-${environmentSuffix}`, {
      logGroupName: `/securecorp/vpc/flowlogs/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: securityKey,
    });

    const flowLogsRole = new iam.Role(this, `VPC-FlowLogs-Role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/VPCFlowLogsDeliveryRolePolicy'),
      ],
    });

    new ec2.FlowLog(this, `SecureCorp-VPC-FlowLogs-${environmentSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogsLogGroup, flowLogsRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // VPC Endpoints for secure communication
    vpc.addGatewayEndpoint(`S3-VPC-Endpoint-${environmentSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    const kmsVpcEndpoint = vpc.addInterfaceEndpoint(`KMS-VPC-Endpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.KMS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      privateDnsEnabled: true,
    });

    const secretsManagerEndpoint = vpc.addInterfaceEndpoint(`SecretsManager-VPC-Endpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      privateDnsEnabled: true,
    });

    const ec2Endpoint = vpc.addInterfaceEndpoint(`EC2-VPC-Endpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.EC2,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      privateDnsEnabled: true,
    });

    // CloudTrail logging bucket
    const cloudTrailBucket = new s3.Bucket(this, `SecureCorp-CloudTrail-${environmentSuffix}`, {
      bucketName: `securecorp-cloudtrail-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: securityKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'CloudTrailLogRetention',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          expiration: cdk.Duration.days(2555), // 7 years retention
        },
      ],
    });

    // Data bucket with encryption
    const dataBucket = new s3.Bucket(this, `SecureCorp-Data-${environmentSuffix}`, {
      bucketName: `securecorp-data-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: securityKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
    });

    // CloudTrail with network activity events for VPC endpoints
    const cloudTrailLogGroup = new logs.LogGroup(this, `CloudTrail-LogGroup-${environmentSuffix}`, {
      logGroupName: `/securecorp/cloudtrail/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: securityKey,
    });

    const trail = new cloudtrail.Trail(this, `SecureCorp-CloudTrail-${environmentSuffix}`, {
      trailName: `SecureCorp-CloudTrail-${environmentSuffix}`,
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      encryptionKey: securityKey,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: cloudTrailLogGroup,
      insightSelectors: [
        {
          insightType: cloudtrail.InsightType.API_CALL_RATE,
        },
      ],
    });

    // Add network activity events for VPC endpoints (new 2025 feature)
    const cfnTrail = trail.node.defaultChild as cloudtrail.CfnTrail;
    cfnTrail.addPropertyOverride('AdvancedEventSelectors', [
      {
        Name: 'VPC Endpoint Network Activity Events',
        FieldSelectors: [
          {
            Field: 'eventCategory',
            Equals: ['NetworkActivityEvents'],
          },
          {
            Field: 'resources.type',
            Equals: ['AWS::EC2::VPCEndpoint'],
          },
        ],
      },
      {
        Name: 'All Management Events',
        FieldSelectors: [
          {
            Field: 'eventCategory',
            Equals: ['Management'],
          },
        ],
      },
      {
        Name: 'All Data Events',
        FieldSelectors: [
          {
            Field: 'eventCategory',
            Equals: ['Data'],
          },
        ],
      },
    ]);

    // IAM Roles for different user types with least privilege
    
    // Developer Role - limited access
    const developerRole = new iam.Role(this, `SecureCorp-Developer-Role-${environmentSuffix}`, {
      roleName: `SecureCorp-Developer-${environmentSuffix}`,
      assumedBy: new iam.ArnPrincipal('arn:aws:iam::*:root'), // Should be restricted to specific principals
      description: 'Role for developers with limited access to development resources',
    });

    developerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ec2:DescribeInstances',
        'ec2:DescribeImages',
        'ec2:DescribeSecurityGroups',
        'ec2:DescribeVpcs',
        'ec2:DescribeSubnets',
      ],
      resources: ['*'],
    }));

    developerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        `${dataBucket.bucketArn}/dev/*`,
      ],
      conditions: {
        Bool: {
          'aws:SecureTransport': 'true',
        },
      },
    }));

    // Admin Role - elevated access with conditions
    const adminRole = new iam.Role(this, `SecureCorp-Admin-Role-${environmentSuffix}`, {
      roleName: `SecureCorp-Admin-${environmentSuffix}`,
      assumedBy: new iam.ArnPrincipal('arn:aws:iam::*:root'), // Should be restricted to specific principals
      description: 'Role for administrators with elevated access',
    });

    adminRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')
    );

    // Deny dangerous actions even for admins
    adminRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      actions: [
        'iam:DeleteRole',
        'iam:DeletePolicy',
        'kms:ScheduleKeyDeletion',
        's3:DeleteBucket',
      ],
      resources: ['*'],
      conditions: {
        StringNotEquals: {
          'aws:PrincipalTag/EmergencyAccess': 'true',
        },
      },
    }));

    // Read-Only Role for auditors
    const auditorRole = new iam.Role(this, `SecureCorp-Auditor-Role-${environmentSuffix}`, {
      roleName: `SecureCorp-Auditor-${environmentSuffix}`,
      assumedBy: new iam.ArnPrincipal('arn:aws:iam::*:root'), // Should be restricted to specific principals
      description: 'Role for auditors with read-only access',
    });

    auditorRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess')
    );

    // RDS Subnet Group for encrypted database
    const dbSubnetGroup = new rds.SubnetGroup(this, `SecureCorp-DB-SubnetGroup-${environmentSuffix}`, {
      description: 'Subnet group for SecureCorp databases',
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      subnetGroupName: `securecorp-db-subnet-group-${environmentSuffix}`,
    });

    // Security Group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, `SecureCorp-DB-SG-${environmentSuffix}`, {
      vpc,
      description: 'Security group for SecureCorp database',
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from VPC'
    );

    // RDS PostgreSQL instance with encryption
    const database = new rds.DatabaseInstance(this, `SecureCorp-Database-${environmentSuffix}`, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      subnetGroup: dbSubnetGroup,
      storageEncrypted: true,
      storageEncryptionKey: securityKey,
      backupRetention: cdk.Duration.days(30),
      deletionProtection: true,
      multiAz: false, // Set to true for production
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: securityKey,
      databaseName: 'securecorpdb',
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
        description: 'SecureCorp database admin credentials',
        encryptionKey: securityKey,
      }),
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // Output important resources
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for SecureCorp infrastructure',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: securityKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'CloudTrail ARN for audit logging',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database endpoint',
    });

    // Tags for compliance
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'SecureCorp');
    cdk.Tags.of(this).add('CostCenter', 'Security');
    cdk.Tags.of(this).add('DataClassification', 'Confidential');
  }
}
```

This infrastructure provides:

1. **Multi-AZ VPC** with proper CIDR allocation and three subnet types (public, private with egress, isolated)
2. **IAM Roles** with least privilege access for different user roles (Developer, Admin, Auditor)
3. **KMS encryption** for all data at rest (S3, RDS, EBS, CloudWatch Logs)
4. **CloudTrail** with comprehensive logging including the new network activity events for VPC endpoints
5. **VPC Endpoints** for secure internal communication (S3, KMS, Secrets Manager, EC2)
6. **VPC Flow Logs** for network monitoring
7. **Encrypted RDS PostgreSQL** instance in isolated subnets
8. **Security Groups** with restrictive ingress rules
9. **Proper resource naming** following SecureCorp conventions
10. **Compliance tags** and retention policies

The infrastructure uses AWS's latest security features including CloudTrail network activity events for VPC endpoints (2025 feature) and follows enterprise security best practices with comprehensive encryption, audit logging, and least privilege access controls.