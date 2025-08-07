I'll create a comprehensive CDK TypeScript infrastructure that meets all your security requirements across two AWS regions. Here's the complete solution:

## bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Project', 'SecureInfrastructure');
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Deploy to primary region (us-west-1)
new TapStack(app, `TapStack-Primary-${environmentSuffix}`, {
  stackName: `TapStack-Primary-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  isPrimaryRegion: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-1',
  },
});

// Deploy to secondary region (us-east-1)  
new TapStack(app, `TapStack-Secondary-${environmentSuffix}`, {
  stackName: `TapStack-Secondary-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  isPrimaryRegion: false,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as inspector2 from 'aws-cdk-lib/aws-inspector2';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  isPrimaryRegion: boolean;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';
    const region = this.region;

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: `Encryption key for ${region}`,
      enableKeyRotation: true,
    });

    // VPC with secure configuration
    const vpc = new ec2.Vpc(this, 'SecureVpc', {
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group for EC2 with restricted SSH access
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: false,
    });

    // Only allow SSH from specific IP range
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(22),
      'SSH access from allowed IP range only'
    );

    // Allow HTTP/HTTPS outbound
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP outbound'
    );
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound'
    );

    // IAM Role for EC2 with least privilege
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
      inlinePolicies: {
        InspectorPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'inspector2:BatchGetAccountStatus',
                'inspector2:GetConfiguration',
                'inspector2:ListUsageTotals',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // EC2 Instance
    const instance = new ec2.Instance(this, 'SecureInstance', {
      vpc,
      securityGroup: ec2SecurityGroup,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: ec2Role,
      userData: ec2.UserData.forLinux(),
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            kmsKey,
          }),
        },
      ],
    });

    // Database Security Group
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.securityGroupId(ec2SecurityGroup.securityGroupId),
      ec2.Port.tcp(3306),
      'MySQL access from EC2'
    );

    // RDS Database with encryption
    const database = new rds.DatabaseInstance(this, 'SecureDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      securityGroups: [dbSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        encryptionKey: kmsKey,
      }),
    });

    // S3 Bucket for CloudTrail logs with access logging
    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `cloudtrail-access-logs-${region}-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
    });

    const cloudtrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `cloudtrail-logs-${region}-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsBucket: accessLogsBucket,
      serverAccessLogsPrefix: 'access-logs/',
    });

    // CloudTrail for API logging
    new cloudtrail.Trail(this, 'SecurityTrail', {
      bucket: cloudtrailBucket,
      includeGlobalServiceEvents: props.isPrimaryRegion,
      isMultiRegionTrail: props.isPrimaryRegion,
      enableFileValidation: true,
      encryptionKey: kmsKey,
    });

    // Lambda function for web application
    const webAppFunction = new lambda.Function(this, 'WebAppFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Secure Web Application',
              region: '${region}',
              timestamp: new Date().toISOString()
            })
          };
        };
      `),
      role: new iam.Role(this, 'LambdaRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ],
      }),
    });

    // API Gateway for web application
    const api = new apigateway.RestApi(this, 'SecureApi', {
      restApiName: `Secure API ${region}`,
      description: 'Secure API protected by WAF',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(webAppFunction);
    api.root.addMethod('GET', lambdaIntegration);

    // WAF with SQL injection protection
    const webAcl = new wafv2.CfnWebACL(this, 'WebACL', {
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'SQLInjectionRule',
          priority: 1,
          statement: {
            sqliMatchStatement: {
              fieldToMatch: { body: {} },
              textTransformations: [
                {
                  priority: 0,
                  type: 'URL_DECODE',
                },
                {
                  priority: 1,
                  type: 'HTML_ENTITY_DECODE',
                },
              ],
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLInjectionRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
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
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'WebACLMetric',
      },
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebACLAssociation', {
      resourceArn: api.deploymentStage.stageArn,
      webAclArn: webAcl.attrArn,
    });

    // Enable AWS Security Hub (only in primary region)
    if (props.isPrimaryRegion) {
      new securityhub.CfnHub(this, 'SecurityHub', {
        controlFindingFormat: 'SECURITY_FINDING_FORMAT_ASFF',
      });
    }

    // Enable Amazon Inspector v2 (only in primary region)
    if (props.isPrimaryRegion) {
      new inspector2.CfnEnabler(this, 'InspectorEnabler', {
        accountIds: [this.account],
        resourceTypes: ['ECR', 'EC2'],
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'WAFWebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });
  }
}
```