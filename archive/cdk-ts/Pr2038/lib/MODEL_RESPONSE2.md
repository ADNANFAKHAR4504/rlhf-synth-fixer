**bin/tap.ts**
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
new TapStack(app, 'TapStack', {
  env: { region: 'us-east-1' },
});
```

**lib/tap-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      enableKeyRotation: true,
      description: 'KMS key for TAP financial services app',
    });

    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 2,
      natGateways: 2,
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
          cidrMask: 28,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: false,
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(22),
      'SSH from VPC'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(8080),
      'Application port from VPC'
    );

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound'
    );

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP outbound'
    );

    const ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ec2/*`],
    }));

    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'kms:Decrypt',
        'kms:GenerateDataKey',
      ],
      resources: [kmsKey.keyArn],
    }));

    const launchTemplate = new ec2.LaunchTemplate(this, 'TapLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(20, {
          encrypted: true,
          kmsKey: kmsKey,
        }),
      }],
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'PostgreSQL from EC2'
    );

    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      publiclyAccessible: false,
      multiAz: false,
      allocatedStorage: 20,
      credentials: rds.Credentials.fromGeneratedSecret('tapdbuser', {
        encryptionKey: kmsKey,
      }),
    });

    const s3Bucket = new s3.Bucket(this, 'TapBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [s3Bucket.arnForObjects('*')],
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'kms:Decrypt',
        'kms:GenerateDataKey',
      ],
      resources: [kmsKey.keyArn],
    }));

    const lambdaFunction = new lambda.Function(this, 'TapFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info('Lambda function invoked')
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
      `),
      role: lambdaRole,
      environment: {
        BUCKET_NAME: s3Bucket.bucketName,
      },
    });

    const logGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/${lambdaFunction.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const webAcl = new wafv2.CfnWebACL(this, 'TapWebAcl', {
      scope: 'CLOUDFRONT',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'TapWebAclMetric',
      },
    });

    const distribution = new cloudfront.Distribution(this, 'TapDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(s3Bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      },
      webAclId: webAcl.attrArn,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    const userGroup = new iam.Group(this, 'TapUserGroup');
    
    userGroup.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ec2:DescribeInstances',
        'ec2:DescribeImages',
        'ec2:DescribeSnapshots',
      ],
      resources: ['*'],
    }));

    userGroup.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:ListBucket',
      ],
      resources: [
        s3Bucket.bucketArn,
        s3Bucket.arnForObjects('*'),
      ],
    }));

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront Distribution Domain',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda Function Name',
    });
  }
}
```

**cdk.json**
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
    "@aws-cdk/core:target": "aws-cdk-lib",
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
    "@aws-cdk/aws-nordicapis-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs-patterns:removeDefaultDesiredCount": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForSourceAction": true
  }
}
```