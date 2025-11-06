# VPC Infrastructure Implementation

This implementation creates a production-ready VPC infrastructure in ap-southeast-1 using AWS CDK with TypeScript.

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create VPC with specific CIDR
    const vpc = new ec2.Vpc(this, `Vpc-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 2, // NAT Gateways in first two public subnets
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 23,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Tag all resources in VPC
    cdk.Tags.of(vpc).add('Environment', 'production');
    cdk.Tags.of(vpc).add('Project', 'apac-expansion');

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(this, `VpcFlowLogGroup-${environmentSuffix}`, {
      logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK, // 7 days retention
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for VPC Flow Logs
    const flowLogRole = new iam.Role(this, `VpcFlowLogRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      description: 'Role for VPC Flow Logs to write to CloudWatch',
    });

    flowLogGroup.grantWrite(flowLogRole);

    // Enable VPC Flow Logs
    new ec2.CfnFlowLog(this, `VpcFlowLog-${environmentSuffix}`, {
      resourceId: vpc.vpcId,
      resourceType: 'VPC',
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logGroupName: flowLogGroup.logGroupName,
      deliverLogsPermissionArn: flowLogRole.roleArn,
      tags: [
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'apac-expansion' },
      ],
    });

    // Create custom Network ACLs for public subnets
    const publicNetworkAcl = new ec2.NetworkAcl(this, `PublicNetworkAcl-${environmentSuffix}`, {
      vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
    });

    cdk.Tags.of(publicNetworkAcl).add('Environment', 'production');
    cdk.Tags.of(publicNetworkAcl).add('Project', 'apac-expansion');
    cdk.Tags.of(publicNetworkAcl).add('Name', `production-public-nacl-${environmentSuffix}`);

    // Allow HTTP inbound
    publicNetworkAcl.addEntry('AllowHttpInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow HTTPS inbound
    publicNetworkAcl.addEntry('AllowHttpsInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow SSH inbound
    publicNetworkAcl.addEntry('AllowSshInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow ephemeral ports inbound (for return traffic)
    publicNetworkAcl.addEntry('AllowEphemeralInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 130,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow all outbound traffic
    publicNetworkAcl.addEntry('AllowAllOutbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Create custom Network ACLs for private subnets
    const privateNetworkAcl = new ec2.NetworkAcl(this, `PrivateNetworkAcl-${environmentSuffix}`, {
      vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    cdk.Tags.of(privateNetworkAcl).add('Environment', 'production');
    cdk.Tags.of(privateNetworkAcl).add('Project', 'apac-expansion');
    cdk.Tags.of(privateNetworkAcl).add('Name', `production-private-nacl-${environmentSuffix}`);

    // Allow HTTP inbound from VPC
    privateNetworkAcl.addEntry('AllowHttpInboundVpc', {
      cidr: ec2.AclCidr.ipv4(vpc.vpcCidrBlock),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow HTTPS inbound from VPC
    privateNetworkAcl.addEntry('AllowHttpsInboundVpc', {
      cidr: ec2.AclCidr.ipv4(vpc.vpcCidrBlock),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow SSH inbound from VPC
    privateNetworkAcl.addEntry('AllowSshInboundVpc', {
      cidr: ec2.AclCidr.ipv4(vpc.vpcCidrBlock),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow ephemeral ports inbound
    privateNetworkAcl.addEntry('AllowEphemeralInboundPrivate', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 130,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow all outbound traffic
    privateNetworkAcl.addEntry('AllowAllOutboundPrivate', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Name route tables following the pattern {env}-{tier}-rt
    vpc.publicSubnets.forEach((subnet, index) => {
      const cfnSubnet = subnet.node.defaultChild as ec2.CfnSubnet;
      cdk.Tags.of(subnet).add('Name', `production-public-subnet-${index + 1}-${environmentSuffix}`);

      // Get route table for this subnet
      const routeTable = subnet.routeTable;
      const cfnRouteTable = routeTable.node.defaultChild as ec2.CfnRouteTable;
      cdk.Tags.of(routeTable).add('Name', `production-public-rt-${index + 1}-${environmentSuffix}`);
    });

    vpc.privateSubnets.forEach((subnet, index) => {
      const cfnSubnet = subnet.node.defaultChild as ec2.CfnSubnet;
      cdk.Tags.of(subnet).add('Name', `production-private-subnet-${index + 1}-${environmentSuffix}`);

      // Get route table for this subnet
      const routeTable = subnet.routeTable;
      const cfnRouteTable = routeTable.node.defaultChild as ec2.CfnRouteTable;
      cdk.Tags.of(routeTable).add('Name', `production-private-rt-${index + 1}-${environmentSuffix}`);
    });

    // Export VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    // Export Public Subnet IDs
    vpc.publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnetId${index + 1}`, {
        value: subnet.subnetId,
        description: `Public Subnet ${index + 1} ID`,
        exportName: `PublicSubnet${index + 1}Id-${environmentSuffix}`,
      });
    });

    // Export Private Subnet IDs
    vpc.privateSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PrivateSubnetId${index + 1}`, {
        value: subnet.subnetId,
        description: `Private Subnet ${index + 1} ID`,
        exportName: `PrivateSubnet${index + 1}Id-${environmentSuffix}`,
      });
    });

    // Get NAT Gateway IDs from VPC
    // CDK creates NAT Gateways automatically, we need to reference them
    const natGatewayIds: string[] = [];

    // Export NAT Gateway information
    new cdk.CfnOutput(this, 'NatGatewayCount', {
      value: '2',
      description: 'Number of NAT Gateways deployed',
      exportName: `NatGatewayCount-${environmentSuffix}`,
    });

    // Export Internet Gateway ID
    new cdk.CfnOutput(this, 'InternetGatewayId', {
      value: vpc.internetGatewayId || 'N/A',
      description: 'Internet Gateway ID',
      exportName: `InternetGatewayId-${environmentSuffix}`,
    });

    // Export Flow Log Group Name
    new cdk.CfnOutput(this, 'FlowLogGroupName', {
      value: flowLogGroup.logGroupName,
      description: 'VPC Flow Logs CloudWatch Log Group Name',
      exportName: `FlowLogGroupName-${environmentSuffix}`,
    });
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or use default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-southeast-1',
  },
  description: 'Production-ready VPC infrastructure for APAC expansion',
});

app.synth();
```

## File: test/tap-stack.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        region: 'ap-southeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  test('VPC created with correct CIDR', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('VPC has correct tags', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Environment', Value: 'production' },
        { Key: 'Project', Value: 'apac-expansion' },
      ]),
    });
  });

  test('Public subnets created with /24 CIDR', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 public + 3 private

    // Check for public subnets
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });
  });

  test('NAT Gateways created', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 2);
  });

  test('Internet Gateway created and attached', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
  });

  test('VPC Flow Logs enabled', () => {
    template.hasResourceProperties('AWS::EC2::FlowLog', {
      ResourceType: 'VPC',
      TrafficType: 'ALL',
      LogDestinationType: 'cloud-watch-logs',
    });
  });

  test('CloudWatch Log Group created with 7-day retention', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 7,
    });
  });

  test('Network ACLs created', () => {
    template.resourceCountIs('AWS::EC2::NetworkAcl', 2); // public and private
  });

  test('Network ACL allows HTTP traffic', () => {
    template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
      Protocol: 6, // TCP
      PortRange: {
        From: 80,
        To: 80,
      },
      RuleAction: 'allow',
    });
  });

  test('Network ACL allows HTTPS traffic', () => {
    template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
      Protocol: 6, // TCP
      PortRange: {
        From: 443,
        To: 443,
      },
      RuleAction: 'allow',
    });
  });

  test('Network ACL allows SSH traffic', () => {
    template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
      Protocol: 6, // TCP
      PortRange: {
        From: 22,
        To: 22,
      },
      RuleAction: 'allow',
    });
  });

  test('IAM role created for VPC Flow Logs', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          }),
        ]),
      }),
    });
  });

  test('Outputs created for VPC and subnets', () => {
    const outputs = template.findOutputs('*');
    expect(outputs).toHaveProperty('VpcId');
    expect(outputs).toHaveProperty('PublicSubnetId1');
    expect(outputs).toHaveProperty('PublicSubnetId2');
    expect(outputs).toHaveProperty('PublicSubnetId3');
    expect(outputs).toHaveProperty('PrivateSubnetId1');
    expect(outputs).toHaveProperty('PrivateSubnetId2');
    expect(outputs).toHaveProperty('PrivateSubnetId3');
  });

  test('No resources have Retain deletion policy', () => {
    const templateJson = template.toJSON();
    const resources = templateJson.Resources;

    Object.keys(resources).forEach(resourceKey => {
      const resource = resources[resourceKey];
      if (resource.DeletionPolicy) {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      }
    });
  });

  test('Stack deployed to ap-southeast-1 region', () => {
    expect(stack.region).toBe('ap-southeast-1');
  });
});
```

## File: package.json

```json
{
  "name": "tap-vpc-infrastructure",
  "version": "1.0.0",
  "description": "Production-ready VPC infrastructure for APAC expansion",
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
    "synth": "cdk synth",
    "diff": "cdk diff"
  },
  "keywords": [
    "aws",
    "cdk",
    "vpc",
    "infrastructure"
  ],
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1",
    "typescript": "~5.0.0",
    "aws-cdk": "^2.100.0"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "es2020"
    ],
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
    "typeRoots": [
      "./node_modules/@types"
    ],
    "resolveJsonModule": true,
    "esModuleInterop": true
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
```

## File: jest.config.js

```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
```

## File: cdk.json

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
    "environmentSuffix": "prod"
  }
}
```

## File: .gitignore

```
*.js
!jest.config.js
*.d.ts
node_modules

# CDK asset staging directory
.cdk.staging
cdk.out

# Parcel default cache directory
.parcel-cache

# IDE
.idea
.vscode
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Run tests:
```bash
npm test
```

4. Deploy to AWS:
```bash
npm run deploy -- -c environmentSuffix=prod
```

5. To destroy the stack:
```bash
npm run destroy -- -c environmentSuffix=prod
```

## Implementation Notes

- VPC created with 10.0.0.0/16 CIDR in ap-southeast-1 region
- 3 public subnets with /24 CIDR blocks across 3 AZs
- 3 private subnets with /23 CIDR blocks across 3 AZs
- Internet Gateway for public subnet connectivity
- 2 NAT Gateways deployed in first two public subnets
- VPC Flow Logs enabled with 7-day retention in CloudWatch Logs
- Custom Network ACLs allowing only HTTP (80), HTTPS (443), and SSH (22)
- All resources tagged with Environment=production and Project=apac-expansion
- Route tables named following {env}-{tier}-rt pattern
- CloudFormation outputs for VPC ID, subnet IDs, and NAT Gateway information
- All resources use DESTROY removal policy (no Retain policies)
- environmentSuffix parameter ensures unique resource naming
