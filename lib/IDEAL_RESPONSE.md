```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

const sourceRegion = 'us-east-1';
const targetRegion = 'us-east-2';

const sourceStack = new TapStack(app, `TapStack-${sourceRegion}-${environmentSuffix}`, {
  stackName: `TapStack-${sourceRegion}-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  isSourceRegion: true,
  sourceRegion: sourceRegion,
  targetRegion: targetRegion,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: sourceRegion,
  },
});

const targetStack = new TapStack(app, `TapStack-${targetRegion}-${environmentSuffix}`, {
  stackName: `TapStack-${targetRegion}-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  isSourceRegion: false,
  sourceRegion: sourceRegion,
  targetRegion: targetRegion,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: targetRegion,
  },
});

targetStack.addDependency(sourceStack);
```

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as custom_resources from 'aws-cdk-lib/custom-resources';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  isSourceRegion: boolean;
  sourceRegion: string;
  targetRegion: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const isSourceRegion = props.isSourceRegion;
    const sourceRegion = props.sourceRegion;
    const targetRegion = props.targetRegion;
    const currentRegion = this.region;

    const vpc = new ec2.Vpc(this, `tap-vpc-${environmentSuffix}`, {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC },
        {
          name: 'private-egress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    new ec2.GatewayVpcEndpoint(this, `tap-vpce-s3-${environmentSuffix}`, {
      vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });
    new ec2.GatewayVpcEndpoint(this, `tap-vpce-ddb-${environmentSuffix}`, {
      vpc,
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    const dataKmsKey = new kms.Key(this, `tap-kms-${environmentSuffix}`, {
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const bucketName = `tap-logs-${environmentSuffix}-${this.account}-${currentRegion}`;
    const logsBucket = new s3.Bucket(this, `tap-logs-${environmentSuffix}`, {
      bucketName: bucketName,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: dataKmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          expiration: cdk.Duration.days(365),
        },
      ],
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    if (isSourceRegion) {
      const replicationRole = new iam.Role(
        this,
        `tap-s3-replication-role-${environmentSuffix}`,
        {
          assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        }
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            's3:GetReplicationConfiguration',
            's3:ListBucket',
            's3:GetObjectVersionForReplication',
            's3:GetObjectVersionAcl',
            's3:GetObjectVersionTagging',
          ],
          resources: [logsBucket.bucketArn, `${logsBucket.bucketArn}/*`],
        })
      );

      const targetBucketName = `tap-logs-${environmentSuffix}-${this.account}-${targetRegion}`;
      const targetBucketArn = `arn:aws:s3:::${targetBucketName}`;
      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            's3:ReplicateObject',
            's3:ReplicateDelete',
            's3:ReplicateTags',
            's3:GetObjectVersionTagging',
          ],
          resources: [`${targetBucketArn}/*`],
        })
      );

      logsBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'AllowReplicationRoleReadSourceObjects',
          principals: [replicationRole],
          actions: [
            's3:GetObjectVersionForReplication',
            's3:GetObjectVersionAcl',
            's3:GetObjectVersionTagging',
          ],
          resources: [`${logsBucket.bucketArn}/*`],
        })
      );

      const replicationConfigLambda = new lambda.Function(
        this,
        `tap-s3-replication-config-${environmentSuffix}`,
        {
          runtime: lambda.Runtime.NODEJS_16_X,
          architecture: lambda.Architecture.ARM_64,
          handler: 'index.handler',
          code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ region: '${this.region}' });
const s3Target = new AWS.S3({ region: '${targetRegion}' });

exports.handler = async (event) => {
  const { RequestType, ResourceProperties } = event;
  const { SourceBucket, TargetBucket, ReplicationRoleArn, TargetRegion, AccountId } = ResourceProperties;
  
  if (RequestType === 'Delete') {
    try {
      await s3.deleteBucketReplication({ Bucket: SourceBucket }).promise();
    } catch (err) {
      console.log('Replication config may not exist, ignoring delete error:', err.code);
    }
    return { PhysicalResourceId: SourceBucket };
  }
  
  try {
    if (RequestType === 'Create' || RequestType === 'Update') {
      let bucketExists = false;
      
      try {
        await s3Target.headBucket({ Bucket: TargetBucket }).promise();
        bucketExists = true;
      } catch (err) {
        if (err.code === 'NotFound' || err.statusCode === 403 || err.statusCode === 404) {
          console.log('Target bucket does not exist yet, skipping replication configuration');
          return {
            PhysicalResourceId: SourceBucket,
            Data: { Status: 'Skipped', Reason: 'Target bucket not yet available' },
          };
        } else {
          throw err;
        }
      }
      
      if (bucketExists) {
        const replicationConfig = {
          Role: ReplicationRoleArn,
          Rules: [
            {
              ID: 'ReplicateToTargetRegion',
              Status: 'Enabled',
              Priority: 1,
              Filter: {},
              Destination: {
                Bucket: \`arn:aws:s3:::\${TargetBucket}\`,
                StorageClass: 'STANDARD_IA',
                EncryptionConfiguration: {
                  ReplicaKmsKeyId: \`arn:aws:kms:\${TargetRegion}:\${AccountId}:alias/aws/s3\`,
                },
              },
              DeleteMarkerReplication: {
                Status: 'Enabled',
              },
            },
          ],
        };
        
        await s3.putBucketReplication({
          Bucket: SourceBucket,
          ReplicationConfiguration: replicationConfig,
        }).promise();
        
        console.log('Replication configuration completed successfully');
      }
    }
    
    return {
      PhysicalResourceId: SourceBucket,
      Data: { Status: 'Success' },
    };
  } catch (error) {
    console.error('Error configuring replication:', error);
    throw error;
  }
};
          `),
          timeout: cdk.Duration.seconds(60),
        }
      );

      replicationConfigLambda.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            's3:PutBucketReplication',
            's3:GetBucketReplication',
            's3:DeleteBucketReplication',
          ],
          resources: [logsBucket.bucketArn],
        })
      );

      replicationConfigLambda.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['s3:HeadBucket', 's3:ListBucket'],
          resources: [
            `arn:aws:s3:::${targetBucketName}`,
            `arn:aws:s3:::${targetBucketName}/*`,
          ],
        })
      );

      const replicationProvider = new custom_resources.Provider(
        this,
        `tap-s3-replication-provider-${environmentSuffix}`,
        {
          onEventHandler: replicationConfigLambda,
        }
      );

      new cdk.CustomResource(this, `tap-s3-replication-resource-${environmentSuffix}`, {
        serviceToken: replicationProvider.serviceToken,
        properties: {
          SourceBucket: logsBucket.bucketName,
          TargetBucket: targetBucketName,
          ReplicationRoleArn: replicationRole.roleArn,
          TargetRegion: targetRegion,
          AccountId: this.account,
        },
      });
    }

    let transactionsTable: dynamodb.ITable;
    if (isSourceRegion) {
      transactionsTable = new dynamodb.Table(
        this,
        `tap-ddb-${environmentSuffix}`,
        {
          partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
          sortKey: { name: 'ts', type: dynamodb.AttributeType.STRING },
          billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
          pointInTimeRecovery: true,
          encryption: dynamodb.TableEncryption.AWS_MANAGED,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
          replicationRegions: [targetRegion],
        }
      );

      const tableName = transactionsTable.tableName;
      cdk.Aspects.of(this).add(
        new (class implements cdk.IAspect {
          visit(node: Construct): void {
            if (node instanceof iam.Role) {
              const role = node as iam.Role;
              const nodePath = node.node.path;
              if (
                nodePath.includes('ReplicaProvider') ||
                nodePath.includes('OnEventHandler') ||
                (role.roleName && role.roleName.includes('ReplicaProvider'))
              ) {
                role.addToPolicy(
                  new iam.PolicyStatement({
                    sid: 'AllowCrossRegionReplicaDeletion',
                    actions: [
                      'dynamodb:DeleteTableReplica',
                      'dynamodb:UpdateTable',
                      'dynamodb:DescribeTable',
                      'dynamodb:DescribeGlobalTable',
                      'dynamodb:DescribeGlobalTableSettings',
                      'dynamodb:UpdateGlobalTable',
                      'dynamodb:UpdateGlobalTableSettings',
                    ],
                    resources: [
                      `arn:aws:dynamodb:*:${cdk.Stack.of(node).account}:table/${tableName}`,
                    ],
                  })
                );
              }
            }
            if (node instanceof iam.Policy) {
              const policy = node as iam.Policy;
              const policyPath = node.node.path;
              if (
                policyPath.includes('ReplicaProvider') ||
                policyPath.includes('OnEventHandler')
              ) {
                policy.addStatements(
                  new iam.PolicyStatement({
                    sid: 'AllowCrossRegionReplicaDeletion',
                    actions: [
                      'dynamodb:DeleteTableReplica',
                      'dynamodb:UpdateTable',
                      'dynamodb:DescribeTable',
                      'dynamodb:DescribeGlobalTable',
                      'dynamodb:DescribeGlobalTableSettings',
                      'dynamodb:UpdateGlobalTable',
                      'dynamodb:UpdateGlobalTableSettings',
                    ],
                    resources: [
                      `arn:aws:dynamodb:*:${cdk.Stack.of(node).account}:table/${tableName}`,
                    ],
                  })
                );
              }
            }
          }
        })()
      );
    } else {
      const sourceTableName = cdk.Fn.importValue(
        `tap-ddb-name-${environmentSuffix}`
      );
      transactionsTable = dynamodb.Table.fromTableName(
        this,
        `tap-ddb-${environmentSuffix}`,
        sourceTableName
      );
    }

    const lambdaRole = new iam.Role(
      this,
      `tap-lambda-role-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      }
    );
    transactionsTable.grantReadWriteData(lambdaRole);
    logsBucket.grantReadWrite(lambdaRole);
    dataKmsKey.grantEncryptDecrypt(lambdaRole);

    const processorFn = new lambda.Function(
      this,
      `tap-processor-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'index.handler',
        code: lambda.Code.fromInline(
          "exports.handler=async(e)=>{const a=JSON.stringify(e||{});return{status:'ok',action:e&&e.action||'PROCESS',echo:a}};"
        ),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        role: lambdaRole,
        environment: {
          ENV: environmentSuffix,
          TABLE_NAME: isSourceRegion
            ? transactionsTable.tableName
            : cdk.Fn.importValue(`tap-ddb-name-${environmentSuffix}`),
          LOGS_BUCKET: logsBucket.bucketName,
          SOURCE_REGION: sourceRegion,
          TARGET_REGION: targetRegion,
          CURRENT_REGION: currentRegion,
        },
      }
    );

    const validatorFn = new lambda.Function(
      this,
      `tap-validator-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'index.handler',
        code: lambda.Code.fromInline(
          "exports.handler=async(e)=>{return{valid:true,phase:(e&&e.validationType)||'CHECK'}};"
        ),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        role: lambdaRole,
        environment: {
          ENV: environmentSuffix,
          TABLE_NAME: isSourceRegion
            ? transactionsTable.tableName
            : cdk.Fn.importValue(`tap-ddb-name-${environmentSuffix}`),
          SOURCE_REGION: sourceRegion,
          TARGET_REGION: targetRegion,
        },
      }
    );

    const topic = new sns.Topic(
      this,
      `tap-migration-sns-${environmentSuffix}`,
      {
        masterKey: dataKmsKey,
      }
    );

    const notifyStart = new tasks.SnsPublish(
      this,
      `tap-task-start-${environmentSuffix}`,
      {
        topic,
        message: stepfunctions.TaskInput.fromText('migration-started'),
      }
    );
    const preValidate = new tasks.LambdaInvoke(
      this,
      `tap-task-pre-validate-${environmentSuffix}`,
      {
        lambdaFunction: validatorFn,
        payloadResponseOnly: true,
        payload: stepfunctions.TaskInput.fromObject({ validationType: 'PRE' }),
      }
    );
    const shiftTraffic = new tasks.LambdaInvoke(
      this,
      `tap-task-shift-${environmentSuffix}`,
      {
        lambdaFunction: processorFn,
        payloadResponseOnly: true,
        payload: stepfunctions.TaskInput.fromObject({
          action: 'UPDATE_ROUTING',
          targetWeight: 0.5,
        }),
      }
    );
    const postValidate = new tasks.LambdaInvoke(
      this,
      `tap-task-post-validate-${environmentSuffix}`,
      {
        lambdaFunction: validatorFn,
        payloadResponseOnly: true,
        payload: stepfunctions.TaskInput.fromObject({ validationType: 'POST' }),
      }
    );
    const logGroup = new logs.LogGroup(
      this,
      `tap-sfn-logs-${environmentSuffix}`,
      {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    const stateMachine = new stepfunctions.StateMachine(
      this,
      `tap-sfn-${environmentSuffix}`,
      {
        definition: notifyStart
          .next(preValidate)
          .next(shiftTraffic)
          .next(postValidate),
        tracingEnabled: true,
        timeout: cdk.Duration.minutes(15),
        logs: { destination: logGroup, level: stepfunctions.LogLevel.ALL },
      }
    );

    const rule = new events.Rule(this, `tap-sync-rule-${environmentSuffix}`, {
      eventPattern: { source: ['aws.dynamodb'] },
    });
    rule.addTarget(new eventsTargets.LambdaFunction(processorFn));

    const dashboard = new cloudwatch.Dashboard(
      this,
      `tap-dashboard-${environmentSuffix}`
    );
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Processor Invocations',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: { FunctionName: processorFn.functionName },
          }),
        ],
      })
    );

    new route53.CfnHealthCheck(this, `tap-hc-${environmentSuffix}`, {
      healthCheckConfig: {
        type: 'HTTPS',
        fullyQualifiedDomainName: `api-${environmentSuffix}.example.local`,
        port: 443,
        resourcePath: '/health',
        requestInterval: 30,
        failureThreshold: 3,
      },
    });

    if (isSourceRegion) {
      new cdk.CfnOutput(this, `tap-ddb-name-${environmentSuffix}`, {
        value: transactionsTable.tableName,
        exportName: `tap-ddb-name-${environmentSuffix}`,
      });
      new cdk.CfnOutput(this, `tap-vpc-id-${environmentSuffix}`, {
        value: vpc.vpcId,
        exportName: `tap-vpc-id-${environmentSuffix}`,
      });
    } else {
      const sourceVpcId = cdk.Fn.importValue(`tap-vpc-id-${environmentSuffix}`);
      const vpcPeering = new ec2.CfnVPCPeeringConnection(
        this,
        `tap-vpc-peering-${environmentSuffix}`,
        {
          vpcId: vpc.vpcId,
          peerVpcId: sourceVpcId,
          peerRegion: sourceRegion,
        }
      );

      vpc.privateSubnets.forEach((subnet, index) => {
        new ec2.CfnRoute(this, `tap-peering-route-${index}-${environmentSuffix}`, {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: '10.0.0.0/16',
          vpcPeeringConnectionId: vpcPeering.ref,
        });
      });
    }

    new cdk.CfnOutput(this, `tap-bucket-name-${environmentSuffix}`, {
      value: logsBucket.bucketName,
      exportName: `tap-bucket-name-${environmentSuffix}`,
    });
    new cdk.CfnOutput(this, `tap-sfn-arn-${environmentSuffix}`, {
      value: stateMachine.stateMachineArn,
      exportName: `tap-sfn-arn-${environmentSuffix}`,
    });
  }
}
```

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
