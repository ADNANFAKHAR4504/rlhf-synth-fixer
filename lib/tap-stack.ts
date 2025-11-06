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
  
  try {
    const response = await ssm.getParameter({ Name: ParameterName }).promise();
    
    return {
      PhysicalResourceId: ParameterName,
      Data: { Value: response.Parameter.Value },
    };
  } catch (error) {
    console.error('Error reading SSM parameter:', error);
    throw error;
  }
};
          `),
          timeout: cdk.Duration.seconds(30),
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
    transactionsTable.grantReadWriteData(lambdaRole);
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
      
      if (RequestType === 'Create') {
        const createResponse = await ec2Source.createVpcPeeringConnection({
          VpcId: SourceVpcId,
          PeerVpcId: TargetVpcId,
          PeerRegion: '${currentRegion}',
        }).promise();
        
        peeringId = createResponse.VpcPeeringConnection.VpcPeeringConnectionId;
        
        await ec2Target.acceptVpcPeeringConnection({
          VpcPeeringConnectionId: peeringId,
        }).promise();
        
        let attempts = 0;
        while (attempts < 30) {
          const describeResponse = await ec2Source.describeVpcPeeringConnections({
            VpcPeeringConnectionIds: [peeringId],
          }).promise();
          
          const status = describeResponse.VpcPeeringConnections[0].Status.Code;
          if (status === 'active') {
            break;
          }
          if (status === 'failed') {
            throw new Error('VPC peering connection failed');
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
        }
        
        if (attempts >= 30) {
          throw new Error('VPC peering connection did not become active');
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
            destinationCidrBlock: '10.0.0.0/16',
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
