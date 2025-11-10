# EKS Cluster with Managed Node Groups - CDK TypeScript Implementation

This implementation creates a production-grade EKS cluster with all specified requirements including VPC, managed node groups, IRSA, EBS CSI driver, and AWS Load Balancer Controller support.

## File: lib/tap-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Tags to apply to all resources
    const commonTags = {
      Environment: 'production',
      ManagedBy: 'CDK',
      EnvironmentSuffix: environmentSuffix,
    };

    // 1. Create VPC with 3 public and 3 private subnets across 3 AZs
    const vpc = new ec2.Vpc(this, `EksVpc-${environmentSuffix}`, {
      vpcName: `eks-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Apply tags to VPC
    cdk.Tags.of(vpc).add('Environment', commonTags.Environment);
    cdk.Tags.of(vpc).add('ManagedBy', commonTags.ManagedBy);
    cdk.Tags.of(vpc).add('EnvironmentSuffix', commonTags.EnvironmentSuffix);

    // 2. Create EKS cluster version 1.28 with all control plane logging enabled
    const clusterName = `eks-cluster-${environmentSuffix}`;

    // Create cluster role
    const clusterRole = new iam.Role(this, `EksClusterRole-${environmentSuffix}`, {
      roleName: `eks-cluster-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
      ],
    });

    // Apply tags to cluster role
    cdk.Tags.of(clusterRole).add('Environment', commonTags.Environment);
    cdk.Tags.of(clusterRole).add('ManagedBy', commonTags.ManagedBy);

    const cluster = new eks.Cluster(this, `EksCluster-${environmentSuffix}`, {
      clusterName,
      version: eks.KubernetesVersion.V1_28,
      vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      role: clusterRole,
      defaultCapacity: 0, // We'll use managed node groups
      endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      clusterLogging: [
        eks.ClusterLoggingTypes.API,
        eks.ClusterLoggingTypes.AUDIT,
        eks.ClusterLoggingTypes.AUTHENTICATOR,
        eks.ClusterLoggingTypes.CONTROLLER_MANAGER,
        eks.ClusterLoggingTypes.SCHEDULER,
      ],
    });

    // Apply tags to cluster
    cdk.Tags.of(cluster).add('Environment', commonTags.Environment);
    cdk.Tags.of(cluster).add('ManagedBy', commonTags.ManagedBy);
    cdk.Tags.of(cluster).add('EnvironmentSuffix', commonTags.EnvironmentSuffix);

    // 3. OIDC provider is automatically created by the cluster construct
    // Access via cluster.openIdConnectProvider

    // 4-5. Create managed node group with t4g.medium (ARM64) instances
    // Auto-scale between 3 and 9 instances

    // Create node role
    const nodeRole = new iam.Role(this, `EksNodeRole-${environmentSuffix}`, {
      roleName: `eks-node-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Apply tags to node role
    cdk.Tags.of(nodeRole).add('Environment', commonTags.Environment);
    cdk.Tags.of(nodeRole).add('ManagedBy', commonTags.ManagedBy);

    // 8. Create launch template with IMDSv2 enforced and no SSH
    const launchTemplate = new ec2.CfnLaunchTemplate(this, `NodeLaunchTemplate-${environmentSuffix}`, {
      launchTemplateName: `eks-node-lt-${environmentSuffix}`,
      launchTemplateData: {
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 20,
              volumeType: 'gp3',
              deleteOnTermination: true,
              encrypted: true,
            },
          },
        ],
        metadataOptions: {
          httpTokens: 'required', // Enforce IMDSv2
          httpPutResponseHopLimit: 2,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: [
              { key: 'Environment', value: commonTags.Environment },
              { key: 'ManagedBy', value: commonTags.ManagedBy },
              { key: 'EnvironmentSuffix', value: commonTags.EnvironmentSuffix },
            ],
          },
          {
            resourceType: 'volume',
            tags: [
              { key: 'Environment', value: commonTags.Environment },
              { key: 'ManagedBy', value: commonTags.ManagedBy },
              { key: 'EnvironmentSuffix', value: commonTags.EnvironmentSuffix },
            ],
          },
        ],
      },
    });

    const nodeGroup = cluster.addNodegroupCapacity(`ManagedNodeGroup-${environmentSuffix}`, {
      nodegroupName: `managed-ng-${environmentSuffix}`,
      nodeRole,
      instanceTypes: [new ec2.InstanceType('t4g.medium')],
      minSize: 3,
      maxSize: 9,
      desiredSize: 3,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      capacityType: eks.CapacityType.ON_DEMAND,
      amiType: eks.NodegroupAmiType.AL2_ARM_64,
      launchTemplateSpec: {
        id: launchTemplate.ref,
        version: launchTemplate.attrLatestVersionNumber,
      },
      tags: {
        Environment: commonTags.Environment,
        ManagedBy: commonTags.ManagedBy,
        EnvironmentSuffix: commonTags.EnvironmentSuffix,
      },
    });

    // 6. Install EBS CSI driver as EKS add-on with IRSA role

    // Create IRSA role for EBS CSI driver
    const ebsCsiRole = new iam.Role(this, `EbsCsiRole-${environmentSuffix}`, {
      roleName: `eks-ebs-csi-role-${environmentSuffix}`,
      assumedBy: new iam.FederatedPrincipal(
        cluster.openIdConnectProvider.openIdConnectProviderArn,
        {
          StringEquals: new cdk.CfnJson(this, 'EbsCsiCondition', {
            value: {
              [`${cluster.clusterOpenIdConnectIssuer}:sub`]:
                'system:serviceaccount:kube-system:ebs-csi-controller-sa',
              [`${cluster.clusterOpenIdConnectIssuer}:aud`]:
                'sts.amazonaws.com',
            },
          }),
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEBSCSIDriverPolicy'),
      ],
    });

    // Apply tags to EBS CSI role
    cdk.Tags.of(ebsCsiRole).add('Environment', commonTags.Environment);
    cdk.Tags.of(ebsCsiRole).add('ManagedBy', commonTags.ManagedBy);

    // Add EBS CSI driver add-on
    const ebsCsiAddon = new eks.CfnAddon(this, `EbsCsiAddon-${environmentSuffix}`, {
      clusterName: cluster.clusterName,
      addonName: 'aws-ebs-csi-driver',
      addonVersion: 'v1.25.0-eksbuild.1',
      serviceAccountRoleArn: ebsCsiRole.roleArn,
      resolveConflicts: 'OVERWRITE',
      tags: [
        { key: 'Environment', value: commonTags.Environment },
        { key: 'ManagedBy', value: commonTags.ManagedBy },
        { key: 'EnvironmentSuffix', value: commonTags.EnvironmentSuffix },
      ],
    });

    ebsCsiAddon.node.addDependency(cluster);
    ebsCsiAddon.node.addDependency(nodeGroup);

    // 7. Create IRSA role for AWS Load Balancer Controller

    const albControllerRole = new iam.Role(this, `AlbControllerRole-${environmentSuffix}`, {
      roleName: `eks-alb-controller-role-${environmentSuffix}`,
      assumedBy: new iam.FederatedPrincipal(
        cluster.openIdConnectProvider.openIdConnectProviderArn,
        {
          StringEquals: new cdk.CfnJson(this, 'AlbControllerCondition', {
            value: {
              [`${cluster.clusterOpenIdConnectIssuer}:sub`]:
                'system:serviceaccount:kube-system:aws-load-balancer-controller',
              [`${cluster.clusterOpenIdConnectIssuer}:aud`]:
                'sts.amazonaws.com',
            },
          }),
        },
        'sts:AssumeRoleWithWebIdentity'
      ),
    });

    // Apply tags to ALB controller role
    cdk.Tags.of(albControllerRole).add('Environment', commonTags.Environment);
    cdk.Tags.of(albControllerRole).add('ManagedBy', commonTags.ManagedBy);

    // Add AWS Load Balancer Controller policy
    const albPolicy = new iam.Policy(this, `AlbControllerPolicy-${environmentSuffix}`, {
      policyName: `eks-alb-controller-policy-${environmentSuffix}`,
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:CreateServiceLinkedRole',
          ],
          resources: ['*'],
          conditions: {
            StringEquals: {
              'iam:AWSServiceName': 'elasticloadbalancing.amazonaws.com',
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ec2:DescribeAccountAttributes',
            'ec2:DescribeAddresses',
            'ec2:DescribeAvailabilityZones',
            'ec2:DescribeInternetGateways',
            'ec2:DescribeVpcs',
            'ec2:DescribeVpcPeeringConnections',
            'ec2:DescribeSubnets',
            'ec2:DescribeSecurityGroups',
            'ec2:DescribeInstances',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DescribeTags',
            'ec2:GetCoipPoolUsage',
            'ec2:DescribeCoipPools',
            'elasticloadbalancing:DescribeLoadBalancers',
            'elasticloadbalancing:DescribeLoadBalancerAttributes',
            'elasticloadbalancing:DescribeListeners',
            'elasticloadbalancing:DescribeListenerCertificates',
            'elasticloadbalancing:DescribeSSLPolicies',
            'elasticloadbalancing:DescribeRules',
            'elasticloadbalancing:DescribeTargetGroups',
            'elasticloadbalancing:DescribeTargetGroupAttributes',
            'elasticloadbalancing:DescribeTargetHealth',
            'elasticloadbalancing:DescribeTags',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'cognito-idp:DescribeUserPoolClient',
            'acm:ListCertificates',
            'acm:DescribeCertificate',
            'iam:ListServerCertificates',
            'iam:GetServerCertificate',
            'waf-regional:GetWebACL',
            'waf-regional:GetWebACLForResource',
            'waf-regional:AssociateWebACL',
            'waf-regional:DisassociateWebACL',
            'wafv2:GetWebACL',
            'wafv2:GetWebACLForResource',
            'wafv2:AssociateWebACL',
            'wafv2:DisassociateWebACL',
            'shield:GetSubscriptionState',
            'shield:DescribeProtection',
            'shield:CreateProtection',
            'shield:DeleteProtection',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ec2:AuthorizeSecurityGroupIngress',
            'ec2:RevokeSecurityGroupIngress',
            'ec2:CreateSecurityGroup',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ec2:CreateTags'],
          resources: ['arn:aws:ec2:*:*:security-group/*'],
          conditions: {
            StringEquals: {
              'ec2:CreateAction': 'CreateSecurityGroup',
            },
            Null: {
              'aws:RequestTag/elbv2.k8s.aws/cluster': 'false',
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['ec2:CreateTags', 'ec2:DeleteTags'],
          resources: ['arn:aws:ec2:*:*:security-group/*'],
          conditions: {
            Null: {
              'aws:RequestTag/elbv2.k8s.aws/cluster': 'true',
              'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ec2:AuthorizeSecurityGroupIngress',
            'ec2:RevokeSecurityGroupIngress',
            'ec2:DeleteSecurityGroup',
          ],
          resources: ['*'],
          conditions: {
            Null: {
              'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'elasticloadbalancing:CreateLoadBalancer',
            'elasticloadbalancing:CreateTargetGroup',
          ],
          resources: ['*'],
          conditions: {
            Null: {
              'aws:RequestTag/elbv2.k8s.aws/cluster': 'false',
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'elasticloadbalancing:CreateListener',
            'elasticloadbalancing:DeleteListener',
            'elasticloadbalancing:CreateRule',
            'elasticloadbalancing:DeleteRule',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'elasticloadbalancing:AddTags',
            'elasticloadbalancing:RemoveTags',
          ],
          resources: [
            'arn:aws:elasticloadbalancing:*:*:targetgroup/*/*',
            'arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*',
            'arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*',
          ],
          conditions: {
            Null: {
              'aws:RequestTag/elbv2.k8s.aws/cluster': 'true',
              'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'elasticloadbalancing:AddTags',
            'elasticloadbalancing:RemoveTags',
          ],
          resources: [
            'arn:aws:elasticloadbalancing:*:*:listener/net/*/*/*',
            'arn:aws:elasticloadbalancing:*:*:listener/app/*/*/*',
            'arn:aws:elasticloadbalancing:*:*:listener-rule/net/*/*/*',
            'arn:aws:elasticloadbalancing:*:*:listener-rule/app/*/*/*',
          ],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'elasticloadbalancing:ModifyLoadBalancerAttributes',
            'elasticloadbalancing:SetIpAddressType',
            'elasticloadbalancing:SetSecurityGroups',
            'elasticloadbalancing:SetSubnets',
            'elasticloadbalancing:DeleteLoadBalancer',
            'elasticloadbalancing:ModifyTargetGroup',
            'elasticloadbalancing:ModifyTargetGroupAttributes',
            'elasticloadbalancing:DeleteTargetGroup',
          ],
          resources: ['*'],
          conditions: {
            Null: {
              'aws:ResourceTag/elbv2.k8s.aws/cluster': 'false',
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['elasticloadbalancing:AddTags'],
          resources: [
            'arn:aws:elasticloadbalancing:*:*:targetgroup/*/*',
            'arn:aws:elasticloadbalancing:*:*:loadbalancer/net/*/*',
            'arn:aws:elasticloadbalancing:*:*:loadbalancer/app/*/*',
          ],
          conditions: {
            StringEquals: {
              'elasticloadbalancing:CreateAction': [
                'CreateTargetGroup',
                'CreateLoadBalancer',
              ],
            },
            Null: {
              'aws:RequestTag/elbv2.k8s.aws/cluster': 'false',
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'elasticloadbalancing:RegisterTargets',
            'elasticloadbalancing:DeregisterTargets',
          ],
          resources: ['arn:aws:elasticloadbalancing:*:*:targetgroup/*/*'],
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'elasticloadbalancing:SetWebAcl',
            'elasticloadbalancing:ModifyListener',
            'elasticloadbalancing:AddListenerCertificates',
            'elasticloadbalancing:RemoveListenerCertificates',
            'elasticloadbalancing:ModifyRule',
          ],
          resources: ['*'],
        }),
      ],
    });

    albPolicy.attachToRole(albControllerRole);

    // Apply tags to ALB policy
    cdk.Tags.of(albPolicy).add('Environment', commonTags.Environment);
    cdk.Tags.of(albPolicy).add('ManagedBy', commonTags.ManagedBy);

    // 10. CloudFormation Outputs
    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      description: 'EKS Cluster Name',
      exportName: `eks-cluster-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: cluster.clusterEndpoint,
      description: 'EKS Cluster Endpoint',
      exportName: `eks-cluster-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OidcProviderArn', {
      value: cluster.openIdConnectProvider.openIdConnectProviderArn,
      description: 'OIDC Provider ARN',
      exportName: `eks-oidc-provider-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KubectlConfigCommand', {
      value: `aws eks update-kubeconfig --region ${this.region} --name ${cluster.clusterName}`,
      description: 'Command to update kubeconfig',
      exportName: `eks-kubectl-command-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `eks-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NodeGroupName', {
      value: nodeGroup.nodegroupName,
      description: 'Managed Node Group Name',
      exportName: `eks-nodegroup-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EbsCsiRoleArn', {
      value: ebsCsiRole.roleArn,
      description: 'EBS CSI Driver IAM Role ARN',
      exportName: `eks-ebs-csi-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlbControllerRoleArn', {
      value: albControllerRole.roleArn,
      description: 'AWS Load Balancer Controller IAM Role ARN',
      exportName: `eks-alb-controller-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ClusterSecurityGroupId', {
      value: cluster.clusterSecurityGroupId,
      description: 'EKS Cluster Security Group ID',
      exportName: `eks-cluster-sg-id-${environmentSuffix}`,
    });
  }
}
```

## File: bin/tap.ts

```ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix = app.node.tryGetContext('environmentSuffix') ||
                         process.env.ENVIRONMENT_SUFFIX ||
                         'dev';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-southeast-1',
  },
  description: `EKS cluster with managed node groups for environment ${environmentSuffix}`,
  tags: {
    Environment: 'production',
    ManagedBy: 'CDK',
    EnvironmentSuffix: environmentSuffix,
  },
});

app.synth();
```

## File: package.json

```json
{
  "name": "tap",
  "version": "0.1.0",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "20.8.0",
    "aws-cdk": "2.100.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "~5.2.2"
  },
  "dependencies": {
    "aws-cdk-lib": "2.100.0",
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
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false
  }
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
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
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

# Coverage
coverage/
*.lcov

# IDE
.idea/
.vscode/
*.iml

# OS
.DS_Store

# Test outputs
cfn-outputs/
```

## File: lib/README.md

```markdown
# EKS Cluster with Managed Node Groups

This CDK stack deploys a production-grade Amazon EKS cluster with managed node groups, IRSA support, and essential add-ons.

## Architecture Overview

The infrastructure includes:

1. **VPC**: 3 public and 3 private subnets across 3 availability zones
2. **EKS Cluster**: Version 1.28 with full control plane logging
3. **OIDC Provider**: Automatically configured for IRSA
4. **Managed Node Group**: t4g.medium (ARM64) instances with auto-scaling (3-9 nodes)
5. **EBS CSI Driver**: Installed as EKS add-on with IRSA role
6. **AWS Load Balancer Controller**: IRSA role pre-configured
7. **Launch Templates**: IMDSv2 enforced, no SSH access
8. **Tags**: All resources tagged with Environment=production and ManagedBy=CDK

## Prerequisites

- Node.js 18.x or later
- AWS CDK CLI 2.100.0 or later
- AWS CLI v2 configured with appropriate credentials
- kubectl 1.28+ (for cluster access)
- IAM permissions to create EKS clusters, VPCs, IAM roles, and related resources

## Installation

```bash
npm install
```

## Configuration

The stack uses an `environmentSuffix` parameter to support multiple environments:

```bash
# Set via CDK context
cdk deploy -c environmentSuffix=prod

# Or via environment variable
export ENVIRONMENT_SUFFIX=prod
cdk deploy
```

## Deployment

### Synthesize CloudFormation template

```bash
npm run build
cdk synth
```

### Deploy the stack

```bash
cdk deploy
```

The deployment will:
- Create a VPC with public and private subnets
- Deploy an EKS cluster with version 1.28
- Configure OIDC provider for IRSA
- Create a managed node group with t4g.medium instances
- Install EBS CSI driver add-on
- Set up IAM roles for EBS CSI and ALB Controller

### Configure kubectl

After deployment, use the output command to configure kubectl:

```bash
aws eks update-kubeconfig --region ap-southeast-1 --name eks-cluster-<suffix>
```

## Stack Outputs

The stack provides the following outputs:

- **ClusterName**: EKS cluster name
- **ClusterEndpoint**: EKS cluster API endpoint
- **OidcProviderArn**: OIDC provider ARN for IRSA
- **KubectlConfigCommand**: Command to configure kubectl
- **VpcId**: VPC ID
- **NodeGroupName**: Managed node group name
- **EbsCsiRoleArn**: IAM role ARN for EBS CSI driver
- **AlbControllerRoleArn**: IAM role ARN for AWS Load Balancer Controller
- **ClusterSecurityGroupId**: EKS cluster security group ID

## Post-Deployment Steps

### Install AWS Load Balancer Controller

```bash
# Add the EKS Helm repository
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Install the controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=eks-cluster-<suffix> \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=<AlbControllerRoleArn>
```

### Verify EBS CSI Driver

```bash
kubectl get pods -n kube-system | grep ebs-csi
```

### Create a test PVC

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: ebs-claim
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: gp3
  resources:
    requests:
      storage: 4Gi
```

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

## Security Features

- **IMDSv2 Enforced**: All EC2 instances require IMDSv2
- **No SSH Access**: Launch templates configured without SSH keys
- **IRSA**: IAM roles for service accounts enabled
- **Control Plane Logging**: All log types enabled
- **Private Subnets**: Node groups run in private subnets
- **Systems Manager**: SSM agent enabled for secure node access

## Cost Optimization

- **Graviton Instances**: t4g.medium for better price-performance
- **Auto-scaling**: Scales between 3-9 nodes based on demand
- **Managed Node Groups**: Reduced operational overhead

## Cleanup

To avoid ongoing charges, destroy the stack when no longer needed:

```bash
cdk destroy
```

**Note**: Ensure all Kubernetes resources (LoadBalancers, PersistentVolumes) are deleted before destroying the stack to avoid orphaned AWS resources.

## Troubleshooting

### Node group not scaling

Check the Cluster Autoscaler logs:
```bash
kubectl logs -n kube-system deployment/cluster-autoscaler
```

### EBS CSI driver issues

Verify the IRSA role:
```bash
kubectl describe sa ebs-csi-controller-sa -n kube-system
```

### OIDC provider issues

Verify the OIDC provider exists:
```bash
aws iam list-open-id-connect-providers
```

## Architecture Decisions

1. **3 NAT Gateways**: High availability across all AZs (can be reduced to 1 for cost savings)
2. **t4g.medium**: ARM64 instances for cost optimization
3. **Managed Node Groups**: Simplified operations and updates
4. **EKS 1.28**: Stable version with long-term support
5. **Launch Templates**: Custom configurations for IMDSv2 and security

## License

This code is provided as-is for infrastructure deployment purposes.
```

## Requirements Checklist

✅ 1. VPC with 3 public and 3 private subnets across 3 availability zones
✅ 2. EKS cluster version 1.28 with all control plane logging enabled
✅ 3. OIDC provider configured automatically by EKS cluster construct
✅ 4. Managed node group with t4g.medium instances (Graviton/ARM64)
✅ 5. Node group auto-scaling between 3 and 9 instances
✅ 6. EBS CSI driver as EKS add-on with IRSA role
✅ 7. IRSA role for AWS Load Balancer Controller with required policies
✅ 8. Launch templates with IMDSv2 enforced and SSH disabled
✅ 9. Tags (Environment=production, ManagedBy=CDK) on all resources
✅ 10. CloudFormation outputs for cluster name, OIDC ARN, and kubectl command

## AWS Services Used

- Amazon EKS (Elastic Kubernetes Service)
- Amazon VPC (Virtual Private Cloud)
- Amazon EC2 (for managed node groups)
- AWS IAM (Identity and Access Management)
- Amazon EBS CSI Driver
- AWS Systems Manager (SSM agent for node access)
- CloudWatch (for logging and monitoring)

## Deployment Instructions

1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Deploy the stack: `cdk deploy -c environmentSuffix=<your-suffix>`
4. Configure kubectl: Use the output command from CloudFormation outputs
5. Install AWS Load Balancer Controller: Follow the Helm instructions in README.md
6. Verify EBS CSI driver: Check pods in kube-system namespace
7. Test deployments: Deploy sample applications with PVCs and ingress

## Notes

- All resource names include `environmentSuffix` for multi-environment support
- Infrastructure is fully destroyable (no Retain policies)
- IMDSv2 is enforced on all EC2 instances
- SSH access is disabled; use Systems Manager Session Manager for node access
- Control plane logs are sent to CloudWatch Logs
- Node groups use ON_DEMAND capacity for reliability
- EBS CSI driver version v1.25.0 is used (update as needed)
