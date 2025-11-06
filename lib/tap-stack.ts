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
import * as ssm from 'aws-cdk-lib/aws-ssm';

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

    // Use different CIDR blocks for source and target regions to avoid overlap
    // Source region (us-east-1): 10.0.0.0/16
    // Target region (us-east-2): 10.1.0.0/16
    const vpcCidr = isSourceRegion ? '10.0.0.0/16' : '10.1.0.0/16';
    const vpc = new ec2.Vpc(this, `tap-vpc-${environmentSuffix}`, {
      maxAzs: 2,
      natGateways: 1,
      cidr: vpcCidr,
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
                Bucket: 'arn:aws:s3:::' + TargetBucket,
                StorageClass: 'STANDARD_IA',
                EncryptionConfiguration: {
                  ReplicaKmsKeyId: 'arn:aws:kms:' + TargetRegion + ':' + AccountId + ':alias/aws/s3',
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

      new cdk.CustomResource(
        this,
        `tap-s3-replication-resource-${environmentSuffix}`,
        {
          serviceToken: replicationProvider.serviceToken,
          properties: {
            SourceBucket: logsBucket.bucketName,
            TargetBucket: targetBucketName,
            ReplicationRoleArn: replicationRole.roleArn,
            TargetRegion: targetRegion,
            AccountId: this.account,
          },
        }
      );
    }

    let transactionsTable: dynamodb.ITable;
    let ssmProvider: custom_resources.Provider | undefined;
    let tableNameResource: cdk.CustomResource | undefined;
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
      const getSsmParamLambda = new lambda.Function(
        this,
        `tap-ssm-reader-${environmentSuffix}`,
        {
          runtime: lambda.Runtime.NODEJS_16_X,
          architecture: lambda.Architecture.ARM_64,
          handler: 'index.handler',
          code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const ssm = new AWS.SSM({ region: '${sourceRegion}' });

exports.handler = async (event) => {
  const { RequestType, ResourceProperties } = event;
  const { ParameterName } = ResourceProperties;
  
  if (RequestType === 'Delete') {
    return { PhysicalResourceId: ParameterName };
  }
  
  // Retry logic to wait for SSM parameter to be created by source stack
  let attempts = 0;
  const maxAttempts = 30;
  const waitTime = 5000; // 5 seconds
  
  while (attempts < maxAttempts) {
    try {
      const response = await ssm.getParameter({ Name: ParameterName }).promise();
      
      return {
        PhysicalResourceId: ParameterName,
        Data: { Value: response.Parameter.Value },
      };
    } catch (error) {
      if (error.code === 'ParameterNotFound') {
        attempts++;
        if (attempts >= maxAttempts) {
          console.error('SSM parameter not found after ' + maxAttempts + ' attempts: ' + ParameterName);
          throw new Error('SSM parameter not found: ' + ParameterName + '. Source stack may not have deployed yet.');
        }
        console.log('SSM parameter not found yet, waiting... (attempt ' + attempts + '/' + maxAttempts + ')');
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        console.error('Error reading SSM parameter:', error);
        throw error;
      }
    }
  }
};
          `),
          timeout: cdk.Duration.minutes(3),
        }
      );

      getSsmParamLambda.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['ssm:GetParameter'],
          resources: [
            `arn:aws:ssm:${sourceRegion}:${this.account}:parameter/tap/${environmentSuffix}/*`,
          ],
        })
      );

      const ssmProviderLocal = new custom_resources.Provider(
        this,
        `tap-ssm-provider-${environmentSuffix}`,
        {
          onEventHandler: getSsmParamLambda,
        }
      );
      ssmProvider = ssmProviderLocal;

      tableNameResource = new cdk.CustomResource(
        this,
        `tap-ddb-name-resource-${environmentSuffix}`,
        {
          serviceToken: ssmProviderLocal.serviceToken,
          properties: {
            ParameterName: `/tap/${environmentSuffix}/dynamodb/table-name`,
          },
        }
      );

      transactionsTable = dynamodb.Table.fromTableName(
        this,
        `tap-ddb-${environmentSuffix}`,
        tableNameResource.getAttString('Value')
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

    // Grant DynamoDB permissions
    if (isSourceRegion) {
      // Source region: grant on the actual table
      transactionsTable.grantReadWriteData(lambdaRole);
    } else {
      // Target region: For Global Tables, grant permissions to the regional replica
      // The table name is the same, but we need to grant to the table in this region
      const tableName = tableNameResource?.getAttString('Value') || '';
      if (tableName) {
        lambdaRole.addToPolicy(
          new iam.PolicyStatement({
            actions: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:BatchGetItem',
              'dynamodb:BatchWriteItem',
            ],
            resources: [
              `arn:aws:dynamodb:${currentRegion}:${this.account}:table/${tableName}`,
              `arn:aws:dynamodb:${currentRegion}:${this.account}:table/${tableName}/index/*`,
            ],
          })
        );
      }
    }

    logsBucket.grantReadWrite(lambdaRole);
    dataKmsKey.grantEncryptDecrypt(lambdaRole);

    if (!isSourceRegion) {
      lambdaRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ['ssm:GetParameter', 'ssm:GetParameters'],
          resources: [
            `arn:aws:ssm:${sourceRegion}:${this.account}:parameter/tap/${environmentSuffix}/*`,
          ],
        })
      );
    }

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
            : tableNameResource?.getAttString('Value') || '',
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
            : tableNameResource?.getAttString('Value') || '',
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
      new ssm.StringParameter(this, `tap-ddb-name-param-${environmentSuffix}`, {
        parameterName: `/tap/${environmentSuffix}/dynamodb/table-name`,
        stringValue: transactionsTable.tableName,
        description: `DynamoDB table name for ${environmentSuffix} environment`,
      });
      new ssm.StringParameter(this, `tap-vpc-id-param-${environmentSuffix}`, {
        parameterName: `/tap/${environmentSuffix}/vpc/id`,
        stringValue: vpc.vpcId,
        description: `VPC ID for ${environmentSuffix} environment`,
      });
      new cdk.CfnOutput(this, `tap-ddb-name-${environmentSuffix}`, {
        value: transactionsTable.tableName,
        exportName: `tap-ddb-name-${environmentSuffix}`,
      });
      new cdk.CfnOutput(this, `tap-vpc-id-${environmentSuffix}`, {
        value: vpc.vpcId,
        exportName: `tap-vpc-id-${environmentSuffix}`,
      });
    } else {
      const vpcIdResource = new cdk.CustomResource(
        this,
        `tap-vpc-id-resource-${environmentSuffix}`,
        {
          serviceToken: ssmProvider!.serviceToken,
          properties: {
            ParameterName: `/tap/${environmentSuffix}/vpc/id`,
          },
        }
      );
      const sourceVpcId = vpcIdResource.getAttString('Value');

      const peeringLambda = new lambda.Function(
        this,
        `tap-vpc-peering-manager-${environmentSuffix}`,
        {
          runtime: lambda.Runtime.NODEJS_16_X,
          architecture: lambda.Architecture.ARM_64,
          handler: 'index.handler',
          code: lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const ec2Source = new AWS.EC2({ region: '${sourceRegion}' });
const ec2Target = new AWS.EC2({ region: '${currentRegion}' });

exports.handler = async (event) => {
  const { RequestType, ResourceProperties } = event;
  const { SourceVpcId, TargetVpcId } = ResourceProperties;
  
  if (RequestType === 'Delete') {
    const peeringId = event.PhysicalResourceId;
    if (peeringId && peeringId !== 'none') {
      try {
        await ec2Source.deleteVpcPeeringConnection({
          VpcPeeringConnectionId: peeringId,
        }).promise();
      } catch (err) {
        if (err.code !== 'InvalidVpcPeeringConnectionID.NotFound') {
          console.error('Error deleting peering:', err);
        }
      }
    }
    return { PhysicalResourceId: peeringId || 'none' };
  }
  
  try {
    if (RequestType === 'Create' || RequestType === 'Update') {
      let peeringId = event.PhysicalResourceId;
      
      // For Update, check if the existing connection is still valid
      if (RequestType === 'Update' && peeringId && peeringId !== 'none') {
        try {
          const existingCheck = await ec2Source.describeVpcPeeringConnections({
            VpcPeeringConnectionIds: [peeringId],
          }).promise();
          
          if (existingCheck.VpcPeeringConnections && existingCheck.VpcPeeringConnections.length > 0) {
            const status = existingCheck.VpcPeeringConnections[0].Status.Code;
            if (status === 'active') {
              console.log('Existing peering connection is active, no update needed');
              return {
                PhysicalResourceId: peeringId,
                Data: { VpcPeeringConnectionId: peeringId },
              };
            } else if (status === 'failed' || status === 'rejected' || status === 'expired') {
              console.log('Existing connection is ' + status + ', deleting and creating new one');
              try {
                await ec2Source.deleteVpcPeeringConnection({
                  VpcPeeringConnectionId: peeringId,
                }).promise();
                await new Promise(resolve => setTimeout(resolve, 5000));
              } catch (deleteErr) {
                console.log('Error deleting ' + status + ' connection: ' + deleteErr.code);
              }
              peeringId = null;
            }
          }
        } catch (checkErr) {
          console.log('Could not check existing connection: ' + checkErr.code);
          peeringId = null;
        }
      }
      
      if (RequestType === 'Create' || !peeringId || peeringId === 'none') {
        // Check for existing peering connections between these VPCs
        // For cross-region, we need to check both directions (requester and accepter)
        const existingPeerings = await ec2Source.describeVpcPeeringConnections({
          Filters: [
            {
              Name: 'requester-vpc-info.vpc-id',
              Values: [SourceVpcId],
            },
          ],
        }).promise();
        
        // Filter to find connections where target VPC is the accepter
        const matchingPeerings = existingPeerings.VpcPeeringConnections
          ? existingPeerings.VpcPeeringConnections.filter((conn) => {
              const accepterVpcId = conn.AccepterVpcInfo?.VpcId;
              const accepterRegion = conn.AccepterVpcInfo?.Region;
              return (
                accepterVpcId === TargetVpcId &&
                accepterRegion === '${currentRegion}'
              );
            })
          : [];
        
        // Clean up any failed, rejected, expired, or deleted connections
        // Also check for any connections in any state to avoid conflicts
        if (matchingPeerings.length > 0) {
          for (const existing of matchingPeerings) {
            const status = existing.Status.Code;
            if (status === 'failed' || status === 'rejected' || status === 'expired') {
              console.log('Deleting existing ' + status + ' peering connection: ' + existing.VpcPeeringConnectionId);
              try {
                await ec2Source.deleteVpcPeeringConnection({
                  VpcPeeringConnectionId: existing.VpcPeeringConnectionId,
                }).promise();
                // Wait for deletion to complete and verify it's gone
                // AWS requires failed connections to be fully deleted before creating new ones
                let deleteWaitAttempts = 0;
                const maxDeleteWaitAttempts = 30; // 30 attempts * 5 seconds = 2.5 minutes
                let deletionConfirmed = false;
                
                while (deleteWaitAttempts < maxDeleteWaitAttempts) {
                  await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
                  try {
                    const verifyDelete = await ec2Source.describeVpcPeeringConnections({
                      VpcPeeringConnectionIds: [existing.VpcPeeringConnectionId],
                    }).promise();
                    if (!verifyDelete.VpcPeeringConnections || verifyDelete.VpcPeeringConnections.length === 0) {
                      console.log('Failed connection successfully deleted');
                      deletionConfirmed = true;
                      break;
                    } else {
                      const currentStatus = verifyDelete.VpcPeeringConnections[0].Status.Code;
                      console.log('Connection still exists with status: ' + currentStatus);
                      if (currentStatus === 'deleted') {
                        console.log('Connection marked as deleted');
                        deletionConfirmed = true;
                        break;
                      }
                    }
                  } catch (verifyErr) {
                    if (verifyErr.code === 'InvalidVpcPeeringConnectionID.NotFound') {
                      console.log('Failed connection successfully deleted (not found)');
                      deletionConfirmed = true;
                      break;
                    } else {
                      console.log('Error verifying deletion: ' + verifyErr.code);
                    }
                  }
                  deleteWaitAttempts++;
                }
                
                if (!deletionConfirmed) {
                  throw new Error('Failed to delete and verify removal of failed peering connection after ' + maxDeleteWaitAttempts + ' attempts. Cannot create new connection.');
                }
                
                // Additional wait after deletion confirmation to ensure AWS has fully processed it
                console.log('Waiting additional 10 seconds after deletion confirmation...');
                await new Promise(resolve => setTimeout(resolve, 10000));
              } catch (deleteErr) {
                if (deleteErr.code === 'InvalidVpcPeeringConnectionID.NotFound') {
                  console.log('Connection already deleted');
                } else {
                  console.log('Error deleting ' + status + ' connection: ' + deleteErr.code);
                  // If deletion fails, we should not create a new connection
                  throw new Error('Cannot delete failed peering connection: ' + deleteErr.message);
                }
              }
            } else if (status === 'active') {
              console.log('Found existing active peering connection: ' + existing.VpcPeeringConnectionId);
              peeringId = existing.VpcPeeringConnectionId;
              return {
                PhysicalResourceId: peeringId,
                Data: { VpcPeeringConnectionId: peeringId },
              };
            } else if (status === 'pending-acceptance') {
              console.log('Found existing pending peering connection: ' + existing.VpcPeeringConnectionId + ', accepting...');
              peeringId = existing.VpcPeeringConnectionId;
              try {
                await ec2Target.acceptVpcPeeringConnection({
                  VpcPeeringConnectionId: peeringId,
                }).promise();
                console.log('Accepted existing pending connection, will wait for active status');
                // Don't break here - continue to wait for active status below
              } catch (acceptErr) {
                console.log('Error accepting existing connection: ' + acceptErr.code);
                // Continue to create new one if accept fails
                peeringId = null;
              }
            } else if (status === 'provisioning' || status === 'deleting') {
              console.log('Found connection in ' + status + ' state: ' + existing.VpcPeeringConnectionId);
              // Wait for it to complete before proceeding
              let waitAttempts = 0;
              while (waitAttempts < 20) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                try {
                  const statusCheck = await ec2Source.describeVpcPeeringConnections({
                    VpcPeeringConnectionIds: [existing.VpcPeeringConnectionId],
                  }).promise();
                  if (statusCheck.VpcPeeringConnections && statusCheck.VpcPeeringConnections.length > 0) {
                    const newStatus = statusCheck.VpcPeeringConnections[0].Status.Code;
                    if (newStatus === 'active') {
                      peeringId = existing.VpcPeeringConnectionId;
                      return {
                        PhysicalResourceId: peeringId,
                        Data: { VpcPeeringConnectionId: peeringId },
                      };
                    } else if (newStatus === 'failed' || newStatus === 'rejected' || newStatus === 'expired') {
                      // Now it's failed, delete it
                      break;
                    } else if (newStatus !== status) {
                      console.log('Connection status changed from ' + status + ' to ' + newStatus);
                      break;
                    }
                  }
                } catch (checkErr) {
                  if (checkErr.code === 'InvalidVpcPeeringConnectionID.NotFound') {
                    console.log('Connection no longer exists');
                    break;
                  }
                }
                waitAttempts++;
              }
              // If still in transition state, throw error
              throw new Error('Cannot proceed: existing peering connection is in ' + status + ' state');
            }
          }
        }
        
        // Only create new connection if we don't have an active one
        if (!peeringId) {
          // Final check: ensure no existing connections remain before creating new one
          const finalCheck = await ec2Source.describeVpcPeeringConnections({
            Filters: [
              {
                Name: 'requester-vpc-info.vpc-id',
                Values: [SourceVpcId],
              },
            ],
          }).promise();
          
          const remainingConnections = finalCheck.VpcPeeringConnections
            ? finalCheck.VpcPeeringConnections.filter((conn) => {
                const accepterVpcId = conn.AccepterVpcInfo?.VpcId;
                const accepterRegion = conn.AccepterVpcInfo?.Region;
                return (
                  accepterVpcId === TargetVpcId &&
                  accepterRegion === '${currentRegion}'
                );
              })
            : [];
          
          if (remainingConnections.length > 0) {
            const remainingStatuses = remainingConnections.map(c => c.Status.Code).join(', ');
            throw new Error('Cannot create new peering connection: existing connections still present with statuses: ' + remainingStatuses);
          }
          
          // Final wait before creating to ensure AWS has fully processed any deletions
          console.log('Waiting 5 seconds before creating new peering connection...');
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const createResponse = await ec2Source.createVpcPeeringConnection({
            VpcId: SourceVpcId,
            PeerVpcId: TargetVpcId,
            PeerRegion: '${currentRegion}',
          }).promise();
          
          peeringId = createResponse.VpcPeeringConnection.VpcPeeringConnectionId;
          console.log('Created new VPC peering connection:', peeringId);
        }
        
        // Check if already accepted before trying to accept (for both new and existing connections)
        let needsAcceptance = true;
        try {
          const currentStatus = await ec2Source.describeVpcPeeringConnections({
            VpcPeeringConnectionIds: [peeringId],
          }).promise();
          
          if (currentStatus.VpcPeeringConnections && currentStatus.VpcPeeringConnections.length > 0) {
            const status = currentStatus.VpcPeeringConnections[0].Status.Code;
            if (status === 'active') {
              console.log('Peering connection already active');
              needsAcceptance = false;
            } else if (status === 'pending-acceptance') {
              console.log('Peering connection pending acceptance');
            } else {
              console.log('Peering connection status: ' + status);
            }
          }
        } catch (checkErr) {
          console.log('Could not check status, will attempt acceptance');
        }
        
        if (needsAcceptance) {
          let acceptAttempts = 0;
          while (acceptAttempts < 10) {
            try {
              await ec2Target.acceptVpcPeeringConnection({
                VpcPeeringConnectionId: peeringId,
              }).promise();
              console.log('Accepted VPC peering connection:', peeringId);
              break;
            } catch (acceptErr) {
              if (acceptErr.code === 'InvalidVpcPeeringConnectionID.NotFound') {
                console.log('Peering connection not yet available, waiting...');
                await new Promise(resolve => setTimeout(resolve, 3000));
                acceptAttempts++;
              } else if (acceptErr.code === 'InvalidStateTransition') {
                console.log('Invalid state transition, connection may already be accepted or failed');
                // Check status to see if it's actually active
                try {
                  const statusCheck = await ec2Source.describeVpcPeeringConnections({
                    VpcPeeringConnectionIds: [peeringId],
                  }).promise();
                  if (statusCheck.VpcPeeringConnections && statusCheck.VpcPeeringConnections.length > 0) {
                    const status = statusCheck.VpcPeeringConnections[0].Status.Code;
                    if (status === 'active') {
                      console.log('Connection is already active');
                      break;
                    } else if (status === 'failed' || status === 'rejected') {
                      throw new Error('Peering connection is ' + status);
                    }
                  }
                } catch (statusErr) {
                  throw acceptErr;
                }
                break;
              } else {
                throw acceptErr;
              }
            }
          }
          
          if (acceptAttempts >= 10) {
            throw new Error('Failed to accept VPC peering connection after retries');
          }
        }
        
        let describeAttempts = 0;
        while (describeAttempts < 30) {
          try {
            const describeResponse = await ec2Source.describeVpcPeeringConnections({
              VpcPeeringConnectionIds: [peeringId],
            }).promise();
            
            if (describeResponse.VpcPeeringConnections && describeResponse.VpcPeeringConnections.length > 0) {
              const status = describeResponse.VpcPeeringConnections[0].Status.Code;
              console.log('Peering connection status:', status);
              if (status === 'active') {
                break;
              }
              if (status === 'failed' || status === 'rejected') {
                throw new Error('VPC peering connection ' + status);
              }
            }
          } catch (describeErr) {
            if (describeErr.code === 'InvalidVpcPeeringConnectionID.NotFound') {
              console.log('Peering connection not yet visible, waiting...');
            } else {
              throw describeErr;
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          describeAttempts++;
        }
        
        if (describeAttempts >= 30) {
          throw new Error('VPC peering connection did not become active within timeout');
        }
      }
      
      return {
        PhysicalResourceId: peeringId,
        Data: { VpcPeeringConnectionId: peeringId },
      };
    }
    
    return { PhysicalResourceId: event.PhysicalResourceId || 'none' };
  } catch (error) {
    console.error('Error managing VPC peering:', error);
    throw error;
  }
};
          `),
          timeout: cdk.Duration.minutes(5),
        }
      );

      peeringLambda.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            'ec2:CreateVpcPeeringConnection',
            'ec2:DescribeVpcPeeringConnections',
            'ec2:DeleteVpcPeeringConnection',
            'ec2:AcceptVpcPeeringConnection',
          ],
          resources: ['*'],
        })
      );

      const peeringProvider = new custom_resources.Provider(
        this,
        `tap-vpc-peering-provider-${environmentSuffix}`,
        {
          onEventHandler: peeringLambda,
        }
      );

      const peeringResource = new cdk.CustomResource(
        this,
        `tap-vpc-peering-resource-${environmentSuffix}`,
        {
          serviceToken: peeringProvider.serviceToken,
          properties: {
            SourceVpcId: sourceVpcId,
            TargetVpcId: vpc.vpcId,
          },
        }
      );

      const peeringConnectionId = peeringResource.getAttString(
        'VpcPeeringConnectionId'
      );

      vpc.privateSubnets.forEach((subnet, index) => {
        const route = new ec2.CfnRoute(
          this,
          `tap-peering-route-${index}-${environmentSuffix}`,
          {
            routeTableId: subnet.routeTable.routeTableId,
            destinationCidrBlock: '10.0.0.0/16', // Source VPC CIDR (hardcoded since source is always 10.0.0.0/16)
            vpcPeeringConnectionId: peeringConnectionId,
          }
        );
        route.node.addDependency(peeringResource);
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
