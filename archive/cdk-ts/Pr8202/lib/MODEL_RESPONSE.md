# CDK TypeScript VPC Infrastructure Response

I'll help you create a complete VPC infrastructure using CDK TypeScript. Here's the implementation with all required components:

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
    "@aws-cdk/aws-norths:useNewStyleStackSynthesis": true,
    "@aws-cdk/aws-lambda:codeBucketPrefix": "code",
    "@aws-cdk/aws-gamelift:FleetIpPermissions": false,
    "@aws-cdk/aws-ec2:vpnConnectionLogging": false,
    "@aws-cdk/aws-lambda:architecture": "x86_64"
  }
}
```

## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or use default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-east-1' 
  },
  environmentSuffix: environmentSuffix,
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create VPC with specified CIDR block
    const vpc = new ec2.Vpc(this, 'VPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${environmentSuffix}-PublicSubnet`,
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ],
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 0, // No NAT gateways for public-only setup
    });

    // Add tags to VPC
    cdk.Tags.of(vpc).add('Name', `${environmentSuffix}-VPC-Main`);
    cdk.Tags.of(vpc).add('Environment', environmentSuffix);

    // Get the public subnets
    const publicSubnets = vpc.publicSubnets;

    // Tag the public subnets with proper naming
    publicSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add('Name', `${environmentSuffix}-PublicSubnet-${index + 1}`);
      cdk.Tags.of(subnet).add('Environment', environmentSuffix);
    });

    // Get the Internet Gateway (automatically created by CDK)
    const internetGateway = vpc.internetGatewayId;

    // Create VPC endpoints for enhanced private connectivity (future VPC Lattice preparation)
    const s3VpcEndpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnets: publicSubnets
        }
      ]
    });

    cdk.Tags.of(s3VpcEndpoint).add('Name', `${environmentSuffix}-S3-VPCEndpoint`);
    cdk.Tags.of(s3VpcEndpoint).add('Environment', environmentSuffix);

    // Create DynamoDB VPC endpoint for enhanced connectivity
    const dynamoDBVpcEndpoint = vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [
        {
          subnets: publicSubnets
        }
      ]
    });

    cdk.Tags.of(dynamoDBVpcEndpoint).add('Name', `${environmentSuffix}-DynamoDB-VPCEndpoint`);
    cdk.Tags.of(dynamoDBVpcEndpoint).add('Environment', environmentSuffix);

    // Output important resources
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${environmentSuffix}-VPC-ID`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: `${environmentSuffix}-VPC-CIDR`,
    });

    publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Public Subnet ${index + 1} ID`,
        exportName: `${environmentSuffix}-PublicSubnet-${index + 1}-ID`,
      });

      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Az`, {
        value: subnet.availabilityZone,
        description: `Public Subnet ${index + 1} Availability Zone`,
        exportName: `${environmentSuffix}-PublicSubnet-${index + 1}-AZ`,
      });
    });

    new cdk.CfnOutput(this, 'InternetGatewayId', {
      value: internetGateway!,
      description: 'Internet Gateway ID',
      exportName: `${environmentSuffix}-IGW-ID`,
    });
  }
}