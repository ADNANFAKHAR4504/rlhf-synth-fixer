I'll create a secure AWS infrastructure environment using CDK TypeScript with the components you've specified. Here's the complete implementation:

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
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true
  }
}
```

## bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Environment: environmentSuffix,
    Project: 'SecureInfrastructure',
    ManagedBy: 'CDK',
  },
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as accessanalyzer from 'aws-cdk-lib/aws-accessanalyzer';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets across 3 AZs
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      natGateways: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      restrictDefaultSecurityGroup: true,
    });

    // Create S3 VPC Endpoint for secure private access
    const s3VpcEndpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Create secure S3 bucket with versioning
    const dataBucket = new s3.Bucket(this, 'SecureDataBucket', {
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadsAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create a logs bucket for access logging
    const logsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Configure server access logging for the main bucket
    dataBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowAccessLogging',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('logging.s3.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${logsBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
    );

    // Create IAM role with least privilege permissions for S3 access
    const s3AccessRole = new iam.Role(this, 'S3AccessRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for secure S3 access with least privilege',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Add specific permissions without wildcards
    s3AccessRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowS3BucketAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:GetObjectVersion',
          's3:ListBucket',
        ],
        resources: [
          dataBucket.bucketArn,
          `${dataBucket.bucketArn}/*`,
        ],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'true',
          },
        },
      })
    );

    // Create IAM role for VPC operations with specific permissions
    const vpcRole = new iam.Role(this, 'VPCOperationsRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for VPC operations with specific permissions',
    });

    vpcRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowVPCReadAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:DescribeVpcs',
          'ec2:DescribeSubnets',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeNetworkAcls',
          'ec2:DescribeRouteTables',
        ],
        resources: ['*'], // These describe actions require wildcard
        conditions: {
          StringEquals: {
            'ec2:Region': this.region,
          },
        },
      })
    );

    vpcRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowVPCSpecificAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:CreateTags',
          'ec2:DeleteTags',
        ],
        resources: [
          `arn:aws:ec2:${this.region}:${this.account}:vpc/${vpc.vpcId}`,
          `arn:aws:ec2:${this.region}:${this.account}:subnet/*`,
        ],
        conditions: {
          StringEquals: {
            'ec2:ResourceTag/ManagedBy': 'CDK',
          },
        },
      })
    );

    // Create IAM Access Analyzer
    const accessAnalyzer = new accessanalyzer.CfnAnalyzer(this, 'SecurityAccessAnalyzer', {
      type: 'ACCOUNT',
      analyzerName: 'SecurityAccessAnalyzer',
      tags: [
        {
          key: 'Purpose',
          value: 'SecurityMonitoring',
        },
        {
          key: 'Environment',
          value: this.node.tryGetContext('environmentSuffix') || 'dev',
        },
      ],
    });

    // Create Security Group for future EC2 instances with minimal access
    const securityGroup = new ec2.SecurityGroup(this, 'SecureInstanceSG', {
      vpc,
      description: 'Security group for secure EC2 instances',
      allowAllOutbound: false,
    });

    // Allow HTTPS outbound for secure communications
    securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for secure communications'
    );

    // Allow HTTP outbound for package updates (restricted)
    securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP for package updates'
    );

    // VPC Flow Logs for monitoring
    const flowLogsRole = new iam.Role(this, 'FlowLogsRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/VPCFlowLogsDeliveryRolePolicy'),
      ],
    });

    const flowLogsGroup = new cdk.aws_logs.LogGroup(this, 'VPCFlowLogs', {
      retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogsGroup, flowLogsRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VPCId`,
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'Secure Data Bucket Name',
      exportName: `${this.stackName}-DataBucketName`,
    });

    new cdk.CfnOutput(this, 'S3AccessRoleArn', {
      value: s3AccessRole.roleArn,
      description: 'S3 Access Role ARN',
      exportName: `${this.stackName}-S3AccessRoleArn`,
    });

    new cdk.CfnOutput(this, 'AccessAnalyzerArn', {
      value: accessAnalyzer.attrArn,
      description: 'Access Analyzer ARN',
      exportName: `${this.stackName}-AccessAnalyzerArn`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `${this.stackName}-PrivateSubnetIds`,
    });
  }
}
```

This infrastructure creates:

1. **Secure S3 Buckets**: Two S3 buckets with versioning enabled, encryption, block public access, and SSL enforcement. Includes lifecycle rules for cost optimization.

2. **IAM Roles with Least Privilege**: Two specific roles - one for S3 access and one for VPC operations. Both avoid wildcard permissions where possible and use specific resource ARNs and conditions.

3. **VPC with NAT Gateway**: A VPC spanning 3 availability zones with public and private subnets. Each private subnet has NAT gateway access for secure internet connectivity.

4. **IAM Access Analyzer**: Configured to monitor and analyze access patterns to critical resources.

5. **VPC Endpoints**: S3 gateway endpoint for private connectivity without internet gateway dependency.

6. **Security Groups**: Restrictive security group with minimal outbound access.

7. **VPC Flow Logs**: CloudWatch logs for network monitoring and security analysis.

All resources follow AWS security best practices with proper tagging, encryption, and monitoring capabilities.