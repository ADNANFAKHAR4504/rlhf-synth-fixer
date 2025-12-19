bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC with specified CIDR block
    const vpc = new ec2.CfnVPC(this, `${environmentSuffix}-vpc`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: [
        { key: 'Name', value: `${environmentSuffix}-vpc` },
        { key: 'Environment', value: environmentSuffix },
      ],
    });

    // Create Internet Gateway
    const igw = new ec2.CfnInternetGateway(this, `${environmentSuffix}-igw`, {
      tags: [
        { key: 'Name', value: `${environmentSuffix}-igw` },
        { key: 'Environment', value: environmentSuffix },
      ],
    });

    // Attach Internet Gateway to VPC
    new ec2.CfnVPCGatewayAttachment(this, `${environmentSuffix}-igw-attach`, {
      vpcId: vpc.ref,
      internetGatewayId: igw.ref,
    });

    // Create public subnet with exact CIDR 10.0.1.0/24
    const publicSubnet = new ec2.CfnSubnet(
      this,
      `${environmentSuffix}-public-subnet`,
      {
        vpcId: vpc.ref,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: cdk.Stack.of(this).availabilityZones[0],
        mapPublicIpOnLaunch: true,
        tags: [
          { key: 'Name', value: `${environmentSuffix}-public-subnet` },
          { key: 'Environment', value: environmentSuffix },
          { key: 'aws-cdk:subnet-type', value: 'Public' },
        ],
      }
    );

    // Create private subnet with exact CIDR 10.0.2.0/24
    const privateSubnet = new ec2.CfnSubnet(
      this,
      `${environmentSuffix}-private-subnet`,
      {
        vpcId: vpc.ref,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: cdk.Stack.of(this).availabilityZones[0],
        mapPublicIpOnLaunch: false,
        tags: [
          { key: 'Name', value: `${environmentSuffix}-private-subnet` },
          { key: 'Environment', value: environmentSuffix },
          { key: 'aws-cdk:subnet-type', value: 'Isolated' },
        ],
      }
    );

    // Create route table for public subnet
    const publicRouteTable = new ec2.CfnRouteTable(
      this,
      `${environmentSuffix}-public-rt`,
      {
        vpcId: vpc.ref,
        tags: [
          { key: 'Name', value: `${environmentSuffix}-public-rt` },
          { key: 'Environment', value: environmentSuffix },
        ],
      }
    );

    // Create route table for private subnet
    const privateRouteTable = new ec2.CfnRouteTable(
      this,
      `${environmentSuffix}-private-rt`,
      {
        vpcId: vpc.ref,
        tags: [
          { key: 'Name', value: `${environmentSuffix}-private-rt` },
          { key: 'Environment', value: environmentSuffix },
        ],
      }
    );

    // Associate public subnet with public route table
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      `${environmentSuffix}-public-rta`,
      {
        subnetId: publicSubnet.ref,
        routeTableId: publicRouteTable.ref,
      }
    );

    // Associate private subnet with private route table
    new ec2.CfnSubnetRouteTableAssociation(
      this,
      `${environmentSuffix}-private-rta`,
      {
        subnetId: privateSubnet.ref,
        routeTableId: privateRouteTable.ref,
      }
    );

    // Add route to Internet Gateway for public subnet
    new ec2.CfnRoute(this, `${environmentSuffix}-public-route`, {
      routeTableId: publicRouteTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.ref,
    });

    // Output important information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.ref,
      description: 'VPC ID',
      exportName: `${environmentSuffix}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetId', {
      value: publicSubnet.ref,
      description: 'Public Subnet ID',
      exportName: `${environmentSuffix}-public-subnet-id`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetId', {
      value: privateSubnet.ref,
      description: 'Private Subnet ID',
      exportName: `${environmentSuffix}-private-subnet-id`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetCidr', {
      value: '10.0.1.0/24',
      description: 'Public Subnet CIDR Block',
      exportName: `${environmentSuffix}-public-subnet-cidr`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetCidr', {
      value: '10.0.2.0/24',
      description: 'Private Subnet CIDR Block',
      exportName: `${environmentSuffix}-private-subnet-cidr`,
    });

    new cdk.CfnOutput(this, 'InternetGatewayId', {
      value: igw.ref,
      description: 'Internet Gateway ID',
      exportName: `${environmentSuffix}-igw-id`,
    });
  }
}

```

cdk.json

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