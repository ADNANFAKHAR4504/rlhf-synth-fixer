# AWS VPC Network Infrastructure with CDK TypeScript

I'll help you create a basic network infrastructure in AWS using CDK TypeScript. This solution includes a VPC with public subnets, internet gateway, and the latest AWS networking features.

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
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    region: 'us-east-1',
  },
});
```

## lib/tap-stack.ts
```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';

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

    // Create VPC infrastructure
    new VpcStack(this, 'VpcStack', {
      environmentSuffix: environmentSuffix,
    });
  }
}
```

## lib/vpc-stack.ts
```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import { Construct } from 'constructs';

interface VpcStackProps {
  environmentSuffix?: string;
}

export class VpcStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly serviceNetwork: vpclattice.CfnServiceNetwork;

  constructor(scope: Construct, id: string, props?: VpcStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with CIDR block 10.0.0.0/16
    this.vpc = new ec2.Vpc(this, `NetworkVpc${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
      },
    });

    // Create VPC Lattice Service Network for future service-to-service connectivity
    this.serviceNetwork = new vpclattice.CfnServiceNetwork(this, `ServiceNetwork${environmentSuffix}`, {
      name: `service-network-${environmentSuffix}`,
      authType: 'NONE',
    });

    // Associate VPC with VPC Lattice Service Network
    new vpclattice.CfnServiceNetworkVpcAssociation(this, `ServiceNetworkVpcAssociation${environmentSuffix}`, {
      serviceNetworkIdentifier: this.serviceNetwork.attrId,
      vpcIdentifier: this.vpc.vpcId,
    });

    // Create VPC Endpoints for AWS services (PrivateLink)
    const s3VpcEndpoint = new ec2.InterfaceVpcEndpoint(this, `S3VpcEndpoint${environmentSuffix}`, {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.S3,
      subnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      privateDnsEnabled: true,
    });

    const ec2VpcEndpoint = new ec2.InterfaceVpcEndpoint(this, `Ec2VpcEndpoint${environmentSuffix}`, {
      vpc: this.vpc,
      service: ec2.InterfaceVpcEndpointAwsService.EC2,
      subnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      privateDnsEnabled: true,
    });

    // Add tags to resources
    cdk.Tags.of(this.vpc).add('Name', `NetworkVpc${environmentSuffix}`);
    cdk.Tags.of(this.serviceNetwork).add('Name', `ServiceNetwork${environmentSuffix}`);
    cdk.Tags.of(s3VpcEndpoint).add('Name', `S3VpcEndpoint${environmentSuffix}`);
    cdk.Tags.of(ec2VpcEndpoint).add('Name', `Ec2VpcEndpoint${environmentSuffix}`);

    // Output important values
    new cdk.CfnOutput(this, `VpcId${environmentSuffix}`, {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `PublicSubnetIds${environmentSuffix}`, {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `PublicSubnetIds${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `ServiceNetworkId${environmentSuffix}`, {
      value: this.serviceNetwork.attrId,
      description: 'VPC Lattice Service Network ID',
      exportName: `ServiceNetworkId${environmentSuffix}`,
    });
  }
}
```

## test/tap-stack.unit.test.ts
```ts
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('creates VPC with correct CIDR', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('creates two public subnets', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 2);
    
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });
  });

  test('creates Internet Gateway', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
  });

  test('creates route tables and associations', () => {
    template.resourceCountIs('AWS::EC2::RouteTable', 1);
    template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 2);
  });

  test('creates VPC Lattice Service Network', () => {
    template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
      Name: 'service-network-test',
      AuthType: 'NONE',
    });
  });

  test('creates VPC endpoints for AWS services', () => {
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 3); // Gateway + 2 Interface endpoints
  });

  test('outputs VPC and subnet information', () => {
    template.hasOutput('VpcIdtest', {});
    template.hasOutput('PublicSubnetIdstest', {});
    template.hasOutput('ServiceNetworkIdtest', {});
  });
});
```

This infrastructure code provides:

1. **VPC**: A Virtual Private Cloud with CIDR block 10.0.0.0/16 in us-east-1 region
2. **Public Subnets**: Two public subnets distributed across different availability zones
3. **Internet Gateway**: Configured with proper routing for internet access
4. **VPC Lattice**: Service network for modern service-to-service connectivity
5. **PrivateLink VPC Endpoints**: Interface endpoints for S3 and EC2 services for enhanced security
6. **Proper Tagging**: All resources are tagged appropriately
7. **CloudFormation Outputs**: Key infrastructure information is exported
8. **Unit Tests**: Comprehensive test coverage for all infrastructure components

The solution follows CDK TypeScript best practices with proper separation of concerns, reusable constructs, and comprehensive testing.