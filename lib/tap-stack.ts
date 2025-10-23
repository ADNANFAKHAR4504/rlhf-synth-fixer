/* Updated tap-stack.ts — main CDK application file
   - Fixes circular dependency by moving SNS subscription and remediation env wiring
     into LambdaStack and creating MessagingStack earlier.
*/
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dms from 'aws-cdk-lib/aws-dms';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as datasync from 'aws-cdk-lib/aws-datasync';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Duration } from 'aws-cdk-lib';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

// NetworkStack - VPC and Security Groups
class NetworkStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly dmsSecurityGroup: ec2.SecurityGroup;
  public readonly openSearchSecurityGroup: ec2.SecurityGroup;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;
  public readonly dataSyncSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'MigrationVPC', {
      maxAzs: 2,
      natGateways: 1,
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
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Database Security Group
    this.dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for Aurora database',
        allowAllOutbound: true,
      }
    );

    // DMS Security Group
    this.dmsSecurityGroup = new ec2.SecurityGroup(this, 'DMSSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for DMS replication instance',
      allowAllOutbound: true,
    });

    // Allow DMS to connect to Aurora
    this.dbSecurityGroup.addIngressRule(
      this.dmsSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow DMS to connect to Aurora'
    );

    // OpenSearch Security Group
    this.openSearchSecurityGroup = new ec2.SecurityGroup(
      this,
      'OpenSearchSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for OpenSearch domain',
        allowAllOutbound: true,
      }
    );

    this.openSearchSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC'
    );

    // Lambda Security Group
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // DataSync Security Group
    this.dataSyncSecurityGroup = new ec2.SecurityGroup(
      this,
      'DataSyncSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for DataSync agents',
        allowAllOutbound: true,
      }
    );

    // NEW: Allow HTTP for DataSync agent activation
    this.dataSyncSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(80),
      'Allow HTTP for DataSync agent activation'
    );
  }
}

// StorageStack - S3 Buckets ONLY
class StorageStack extends cdk.NestedStack {
  public readonly dataBucket: s3.Bucket;
  public readonly scriptBucket: s3.Bucket;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.NestedStackProps & { environmentSuffix: string }
  ) {
    super(scope, id, props);

    // Data bucket for incoming files
    this.dataBucket = new s3.Bucket(this, 'MigrationDataBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      eventBridgeEnabled: true, // Enable EventBridge for S3 events
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        props.environmentSuffix === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environmentSuffix !== 'prod',
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: Duration.days(90),
          enabled: true,
        },
      ],
    });

    // Script bucket for Glue scripts
    this.scriptBucket = new s3.Bucket(this, 'ScriptBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy:
        props.environmentSuffix === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environmentSuffix !== 'prod',
    });
  }
}

// DatabaseStack - Aurora Cluster
class DatabaseStack extends cdk.NestedStack {
  public readonly auroraCluster: rds.DatabaseCluster;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.NestedStackProps & {
      vpc: ec2.Vpc;
      dbSecurityGroup: ec2.SecurityGroup;
      environmentSuffix: string;
    }
  ) {
    super(scope, id, props);

    // Create Aurora MySQL cluster
    this.auroraCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_09_0,
      }),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `migration-aurora-secret-${props.environmentSuffix}`,
      }),
      writer: rds.ClusterInstance.provisioned('writer', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.LARGE
        ),
        publiclyAccessible: false,
      }),
      readers: [
        rds.ClusterInstance.provisioned('reader', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.LARGE
          ),
          publiclyAccessible: false,
        }),
      ],
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.dbSecurityGroup],
      storageEncrypted: true,
      backup: {
        retention: Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      cloudwatchLogsExports: ['error', 'general', 'slowquery', 'audit'],
      defaultDatabaseName: 'migrationdb',
    });
  }
}

// GlueStack - Glue ETL Jobs
class GlueStack extends cdk.NestedStack {
  public readonly validationJob: glue.CfnJob;
  public readonly glueDatabase: glue.CfnDatabase;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.NestedStackProps & {
      scriptBucket: s3.Bucket;
      dataBucket: s3.Bucket;
      environmentSuffix: string;
    }
  ) {
    super(scope, id, props);

    // Create Glue database
    this.glueDatabase = new glue.CfnDatabase(this, 'MigrationDatabase', {
      catalogId: this.account,
      databaseInput: {
        name: `migration_db_${props.environmentSuffix}`,
        description: 'Database for migration data catalog',
      },
    });

    // Create IAM role for Glue
    const glueRole = new iam.Role(this, 'GlueRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSGlueServiceRole'
        ),
      ],
    });

    // Grant Glue access to buckets
    props.scriptBucket.grantRead(glueRole);
    props.dataBucket.grantReadWrite(glueRole);

    // Create Glue validation job
    this.validationJob = new glue.CfnJob(this, 'DataValidationJob', {
      name: `migration-validation-${props.environmentSuffix}`,
      role: glueRole.roleArn,
      command: {
        name: 'glueetl',
        pythonVersion: '3',
        scriptLocation: `s3://${props.scriptBucket.bucketName}/scripts/validation.py`,
      },
      glueVersion: '4.0',
      maxRetries: 2,
      timeout: 60,
      maxCapacity: 2,
      defaultArguments: {
        '--job-language': 'python',
        '--enable-metrics': 'true',
        '--enable-continuous-cloudwatch-log': 'true',
        '--enable-spark-ui': 'true',
        '--spark-event-logs-path': `s3://${props.scriptBucket.bucketName}/spark-logs/`,
      },
    });
  }
}

// MessagingStack - SNS Topics (no Lambda function dependencies)
class MessagingStack extends cdk.NestedStack {
  public readonly validationTopic: sns.Topic;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.NestedStackProps & {
      environmentSuffix: string;
    }
  ) {
    super(scope, id, props);

    // Create SNS topic for validation results (only the topic)
    this.validationTopic = new sns.Topic(this, 'ValidationTopic', {
      topicName: `migration-validation-${props.environmentSuffix}`,
      displayName: 'Migration Validation Results',
    });

    // Grant SNS publish permission to Glue (service principal)
    this.validationTopic.grantPublish(
      new iam.ServicePrincipal('glue.amazonaws.com')
    );

    // Note: Subscriptions to this topic are created in LambdaStack to avoid nested stack cycles.
  }
}

// LambdaStack - Lambda Functions and subscribe to validationTopic
class LambdaStack extends cdk.NestedStack {
  public readonly glueTriggerFunction: lambda.Function;
  public readonly stepFunctionTriggerFunction: lambda.Function;
  public readonly remediationFunction: lambda.Function;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.NestedStackProps & {
      dataBucket: s3.Bucket;
      validationJob: glue.CfnJob;
      vpc: ec2.Vpc;
      lambdaSecurityGroup: ec2.SecurityGroup;
      environmentSuffix: string;
      validationTopic?: sns.Topic; // NEW: accept topic to create subscriptions
    }
  ) {
    super(scope, id, props);

    // Dead Letter Queue for Lambda functions
    const dlq = new sqs.Queue(this, 'LambdaDLQ', {
      queueName: `migration-lambda-dlq-${props.environmentSuffix}`,
      retentionPeriod: Duration.days(14),
    });

    // Lambda function to trigger Glue job
    this.glueTriggerFunction = new lambda.Function(
      this,
      'GlueTriggerFunction',
      {
        functionName: `migration-glue-trigger-${props.environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import os

glue = boto3.client('glue')

def handler(event, context):
    job_name = os.environ['GLUE_JOB_NAME']
    
    # Extract bucket and key from EventBridge event
    detail = event.get('detail', {})
    bucket_info = detail.get('bucket', {})
    object_info = detail.get('object', {})
    
    bucket = bucket_info.get('name', '')
    key = object_info.get('key', '')
    
    if not bucket or not key:
        return {
            'statusCode': 400,
            'body': json.dumps('Invalid event structure')
        }
    
    response = glue.start_job_run(
        JobName=job_name,
        Arguments={
            '--S3_BUCKET': bucket,
            '--S3_KEY': key
        }
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps(f"Started Glue job: {response['JobRunId']}")
    }
      `),
        environment: {
          GLUE_JOB_NAME: props.validationJob.name!,
        },
        timeout: Duration.seconds(300),
        deadLetterQueue: dlq,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [props.lambdaSecurityGroup],
      }
    );

    // Grant Lambda permission to start Glue jobs
    this.glueTriggerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['glue:StartJobRun', 'glue:GetJobRun'],
        resources: [
          `arn:aws:glue:${this.region}:${this.account}:job/${props.validationJob.name}`,
        ],
      })
    );

    // Grant S3 read permission
    props.dataBucket.grantRead(this.glueTriggerFunction);

    // Lambda function to trigger Step Functions
    this.stepFunctionTriggerFunction = new lambda.Function(
      this,
      'StepFunctionTriggerFunction',
      {
        functionName: `migration-stepfunction-trigger-${props.environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import os

stepfunctions = boto3.client('stepfunctions')

def handler(event, context):
    state_machine_arn = os.environ.get('STATE_MACHINE_ARN', '')
    
    # Parse SNS message
    message = json.loads(event['Records'][0]['Sns']['Message'])
    
    response = stepfunctions.start_execution(
        stateMachineArn=state_machine_arn,
        input=json.dumps(message)
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps(f"Started Step Function: {response['executionArn']}")
    }
      `),
        timeout: Duration.seconds(300),
        deadLetterQueue: dlq,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [props.lambdaSecurityGroup],
      }
    );

    // Lambda function for remediation
    this.remediationFunction = new lambda.Function(
      this,
      'RemediationFunction',
      {
        functionName: `migration-remediation-${props.environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import os

sns = boto3.client('sns')

def handler(event, context):
    alert_topic_arn = os.environ.get('ALERT_TOPIC_ARN', '')
    
    # Process the event and determine remediation action
    event_detail = event.get('detail', {})
    
    # Send alert
    if alert_topic_arn:
        sns.publish(
            TopicArn=alert_topic_arn,
            Subject='Migration Pipeline Alert',
            Message=json.dumps(event_detail, indent=2)
        )
    
    return {
        'statusCode': 200,
        'body': json.dumps('Remediation action completed')
    }
      `),
        timeout: Duration.seconds(300),
        deadLetterQueue: dlq,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [props.lambdaSecurityGroup],
      }
    );

    // If a validationTopic is supplied, create subscriptions here (breaks nested-stack cycle)
    if (props.validationTopic) {
      // Subscribe step function trigger and remediation lambda to validation topic
      props.validationTopic.addSubscription(
        new subscriptions.LambdaSubscription(this.stepFunctionTriggerFunction)
      );
      props.validationTopic.addSubscription(
        new subscriptions.LambdaSubscription(this.remediationFunction)
      );

      // Set environment variable for remediation function
      this.remediationFunction.addEnvironment(
        'ALERT_TOPIC_ARN',
        props.validationTopic.topicArn
      );

      // Grant publish from lambdas (if lambdas will publish) - not necessary for subscription but OK to grant
      props.validationTopic.grantPublish(this.remediationFunction);
      props.validationTopic.grantPublish(this.stepFunctionTriggerFunction);
    }
  }
}

// DMSStack - Database Migration Service
class DMSStack extends cdk.NestedStack {
  public readonly replicationInstance: dms.CfnReplicationInstance;
  public readonly replicationTask: dms.CfnReplicationTask;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.NestedStackProps & {
      vpc: ec2.Vpc;
      auroraCluster: rds.DatabaseCluster;
      dmsSecurityGroup: ec2.SecurityGroup;
      environmentSuffix: string;
    }
  ) {
    super(scope, id, props);

    // Create DMS subnet group
    const subnetGroup = new dms.CfnReplicationSubnetGroup(
      this,
      'DMSSubnetGroup',
      {
        replicationSubnetGroupDescription: 'Subnet group for DMS replication',
        subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
        replicationSubnetGroupIdentifier: `migration-dms-subnet-${props.environmentSuffix}`,
      }
    );

    // Create DMS replication instance
    this.replicationInstance = new dms.CfnReplicationInstance(
      this,
      'ReplicationInstance',
      {
        replicationInstanceClass: 'dms.t3.medium',
        replicationInstanceIdentifier: `migration-dms-${props.environmentSuffix}`,
        allocatedStorage: 100,
        vpcSecurityGroupIds: [props.dmsSecurityGroup.securityGroupId],
        replicationSubnetGroupIdentifier:
          subnetGroup.replicationSubnetGroupIdentifier,
        publiclyAccessible: false,
        multiAz: false,
        engineVersion: '3.5.1',
      }
    );

    // Source endpoint (on-premises MySQL - placeholder)
    const sourceEndpoint = new dms.CfnEndpoint(this, 'SourceEndpoint', {
      endpointType: 'source',
      engineName: 'mysql',
      endpointIdentifier: `migration-source-${props.environmentSuffix}`,
      serverName: 'source.example.com',
      port: 3306,
      username: 'admin',
      password: 'placeholder',
      databaseName: 'sourcedb',
    });

    // Target endpoint (Aurora MySQL)
    const targetEndpoint = new dms.CfnEndpoint(this, 'TargetEndpoint', {
      endpointType: 'target',
      engineName: 'aurora',
      endpointIdentifier: `migration-target-${props.environmentSuffix}`,
      serverName: props.auroraCluster.clusterEndpoint.hostname,
      port: 3306,
      username: 'admin',
      password: 'placeholder',
      databaseName: 'migrationdb',
    });

    // Create replication task
    this.replicationTask = new dms.CfnReplicationTask(this, 'ReplicationTask', {
      replicationTaskIdentifier: `migration-task-${props.environmentSuffix}`,
      sourceEndpointArn: sourceEndpoint.ref,
      targetEndpointArn: targetEndpoint.ref,
      replicationInstanceArn: this.replicationInstance.ref,
      migrationType: 'full-load-and-cdc',
      tableMappings: JSON.stringify({
        rules: [
          {
            'rule-type': 'selection',
            'rule-id': '1',
            'rule-name': '1',
            'object-locator': {
              'schema-name': '%',
              'table-name': '%',
            },
            'rule-action': 'include',
          },
        ],
      }),
    });
  }
}

// OrchestrationStack - Step Functions
class OrchestrationStack extends cdk.NestedStack {
  public readonly stateMachine: sfn.StateMachine;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.NestedStackProps & {
      replicationTask: dms.CfnReplicationTask;
      validationTopic: sns.Topic;
      environmentSuffix: string;
    }
  ) {
    super(scope, id, props);

    // Define Step Functions tasks
    const startDMSTask = new tasks.CallAwsService(this, 'StartDMSReplication', {
      service: 'databasemigrationservice',
      action: 'startReplicationTask',
      parameters: {
        ReplicationTaskArn: props.replicationTask.ref,
        StartReplicationTaskType: 'start-replication',
      },
      iamResources: [props.replicationTask.ref],
    });

    const waitForCompletion = new sfn.Wait(this, 'WaitForCompletion', {
      time: sfn.WaitTime.duration(Duration.minutes(5)),
    });

    const checkStatus = new tasks.CallAwsService(this, 'CheckDMSStatus', {
      service: 'databasemigrationservice',
      action: 'describeReplicationTasks',
      parameters: {
        Filters: [
          {
            Name: 'replication-task-arn',
            Values: [props.replicationTask.ref],
          },
        ],
      },
      iamResources: ['*'],
    });

    const notifySuccess = new tasks.SnsPublish(this, 'NotifySuccess', {
      topic: props.validationTopic,
      message: sfn.TaskInput.fromText('Migration completed successfully'),
    });

    const notifyFailure = new tasks.SnsPublish(this, 'NotifyFailure', {
      topic: props.validationTopic,
      message: sfn.TaskInput.fromText('Migration failed'),
    });

    // Define state machine
    const definition = startDMSTask
      .next(waitForCompletion)
      .next(checkStatus)
      .next(
        new sfn.Choice(this, 'CheckCompletion')
          .when(
            sfn.Condition.stringEquals(
              '$.ReplicationTasks[0].Status',
              'stopped'
            ),
            notifySuccess
          )
          .otherwise(notifyFailure)
      );

    // Create log group for Step Functions
    const logGroup = new logs.LogGroup(this, 'StateMachineLogGroup', {
      logGroupName: `/aws/vendedlogs/states/migration-orchestration-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create state machine
    this.stateMachine = new sfn.StateMachine(this, 'MigrationOrchestration', {
      stateMachineName: `migration-orchestration-${props.environmentSuffix}`,
      definitionBody: sfn.DefinitionBody.fromChainable(definition),
      timeout: Duration.hours(2),
      logs: {
        destination: logGroup,
        level: sfn.LogLevel.ALL,
      },
    });
  }
}

// DataSyncStack - AWS DataSync Configuration (FIXED)
class DataSyncStack extends cdk.NestedStack {
  public readonly dataSyncTask: datasync.CfnTask;
  public readonly agentArn: string; // NEW: To expose agent ARN

  constructor(
    scope: Construct,
    id: string,
    props: cdk.NestedStackProps & {
      vpc: ec2.Vpc;
      dataBucket: s3.Bucket;
      dataSyncSecurityGroup: ec2.SecurityGroup;
      environmentSuffix: string;
    }
  ) {
    super(scope, id, props);

    // NEW: Step 1 - Resolve DataSync AMI via SSM Parameter Store
    const dataSyncAmi = ec2.MachineImage.fromSsmParameter(
      '/aws/service/datasync/ami/us-west-2',
      { os: ec2.OperatingSystemType.LINUX }
    );

    // NEW: Step 2 - Launch EC2 Instance for DataSync Agent
    const agentInstance = new ec2.Instance(this, 'DataSyncAgentEC2', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.M5,
        ec2.InstanceSize.XLARGE
      ),
      machineImage: dataSyncAmi,
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: props.dataSyncSecurityGroup,
      keyName: `migration-keypair-${props.environmentSuffix}`, // REPLACE: Create in AWS Console
      role: new iam.Role(this, 'DataSyncEC2Role', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('AWSDataSyncFullAccess'),
        ],
      }),
    });
    const userData = ec2.UserData.forLinux({ shebang: '#!/bin/bash' });
    userData.addCommands(
      'yum update -y',
      'systemctl start datasync-agent',
      'systemctl enable datasync-agent'
    );
    agentInstance.addUserData(userData.render());

    // NEW: Step 3 - Custom Resource to Activate DataSync Agent
    const activationFunction = new lambda.Function(
      this,
      'AgentActivatorFunction',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
        const { DataSyncClient, CreateAgentCommand } = require('@aws-sdk/client-datasync');
        const https = require('https');
        exports.handler = async (event) => {
          if (event.RequestType === 'Delete') return { PhysicalResourceId: event.PhysicalResourceId };
          const instanceId = process.env.INSTANCE_ID;
          const ec2 = new EC2Client({ region: 'us-west-2' });
          const resp = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
          const privateIp = resp.Reservations[0].Instances[0].PrivateIpAddress;
          return new Promise((resolve, reject) => {
            https.get(\`http://\${privateIp}/activationkey\`, (res) => {
              let data = '';
              res.on('data', (chunk) => data += chunk);
              res.on('end', async () => {
                const activationKey = data.trim();
                const client = new DataSyncClient({ region: 'us-west-2' });
                try {
                  const command = new CreateAgentCommand({ 
                    ActivationKey: activationKey, 
                    AgentName: 'MigrationAgent-${props.environmentSuffix}' 
                  });
                  const result = await client.send(command);
                  resolve({ PhysicalResourceId: result.AgentArn, Data: { Arn: result.AgentArn } });
                } catch (err) { reject(err); }
              });
            }).on('error', reject);
          });
        };
      `),
        timeout: Duration.minutes(5),
        environment: { INSTANCE_ID: agentInstance.instanceId },
        vpc: props.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [props.dataSyncSecurityGroup],
      }
    );

    activationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['datasync:CreateAgent', 'ec2:DescribeInstances'],
        resources: ['*'],
      })
    );

    const activationCustomResource = new cr.AwsCustomResource(
      this,
      'DataSyncAgentActivator',
      {
        onCreate: {
          service: 'Lambda',
          action: 'invoke',
          parameters: { FunctionName: activationFunction.functionName },
          physicalResourceId: cr.PhysicalResourceId.of('DataSyncAgent'),
        },
        onUpdate: {
          service: 'Lambda',
          action: 'invoke',
          parameters: { FunctionName: activationFunction.functionName },
          physicalResourceId: cr.PhysicalResourceId.of('DataSyncAgent'),
        },
        onDelete: {
          service: 'DataSync',
          action: 'deleteAgent',
          parameters: {
            AgentArn: { 'Fn::GetAtt': ['DataSyncAgentActivator', 'Data.Arn'] },
          },
          physicalResourceId: cr.PhysicalResourceId.of('DataSyncAgent'),
        },
        policy: cr.AwsCustomResourcePolicy.fromStatements([
          new iam.PolicyStatement({
            actions: ['lambda:InvokeFunction'],
            resources: [activationFunction.functionArn],
          }),
        ]),
      }
    );

    this.agentArn = activationCustomResource
      .getResponseField('Data.Arn')
      .toString();

    // NEW: Step 4 - Monitor Agent Status
    new cdk.aws_cloudwatch.Alarm(this, 'AgentStatusAlarm', {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: 'AWS/DataSync',
        metricName: 'AgentStatus',
        dimensionsMap: { AgentArn: this.agentArn },
        statistic: 'Average',
        period: Duration.minutes(5),
      }),
      threshold: 1, // 1 = ONLINE
      evaluationPeriods: 3,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      alarmDescription: 'Alarm if DataSync agent is not ONLINE',
    });

    // Create DataSync S3 location
    const s3LocationRole = new iam.Role(this, 'DataSyncS3Role', {
      assumedBy: new iam.ServicePrincipal('datasync.amazonaws.com'),
    });

    props.dataBucket.grantReadWrite(s3LocationRole);

    const s3Location = new datasync.CfnLocationS3(this, 'S3Location', {
      s3BucketArn: props.dataBucket.bucketArn,
      s3Config: {
        bucketAccessRoleArn: s3LocationRole.roleArn,
      },
      subdirectory: '/datasync/',
    });

    // Create DataSync NFS location (FIXED: Use real agent ARN)
    const nfsLocation = new datasync.CfnLocationNFS(this, 'NFSLocation', {
      serverHostname: 'nfs.example.com', // REPLACE: Your NFS server hostname
      subdirectory: '/data/',
      onPremConfig: {
        agentArns: [this.agentArn], // FIXED: Use dynamically generated ARN
      },
      mountOptions: { version: 'NFS3' }, // Adjust if needed (NFS4_0, NFS4_1)
    });

    // Create DataSync task
    this.dataSyncTask = new datasync.CfnTask(this, 'DataSyncTask', {
      sourceLocationArn: nfsLocation.attrLocationArn,
      destinationLocationArn: s3Location.attrLocationArn,
      name: `migration-datasync-${props.environmentSuffix}`,
      options: {
        verifyMode: 'POINT_IN_TIME_CONSISTENT',
        overwriteMode: 'ALWAYS',
        transferMode: 'CHANGED',
        logLevel: 'TRANSFER',
      },
      schedule: {
        scheduleExpression: 'cron(0 2 * * ? *)',
      },
    });
    this.dataSyncTask.node.addDependency(activationCustomResource);

    // NEW: Alarm for task failures
    new cdk.aws_cloudwatch.Alarm(this, 'DataSyncTaskFailureAlarm', {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: 'AWS/DataSync',
        metricName: 'TaskExecutionFailed',
        dimensionsMap: { TaskArn: this.dataSyncTask.attrTaskArn },
        statistic: 'Sum',
        period: Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alarm when DataSync task fails',
    });
  }
}

// MonitoringStack - EventBridge Rules
class MonitoringStack extends cdk.NestedStack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.NestedStackProps & {
      remediationFunction: lambda.Function;
      environmentSuffix: string;
    }
  ) {
    super(scope, id, props);

    // EventBridge rule for Glue job failures
    const glueFailureRule = new events.Rule(this, 'GlueJobFailureRule', {
      ruleName: `migration-glue-failure-${props.environmentSuffix}`,
      description: 'Trigger on Glue job failures',
      eventPattern: {
        source: ['aws.glue'],
        detailType: ['Glue Job State Change'],
        detail: {
          state: ['FAILED', 'TIMEOUT'],
        },
      },
    });

    glueFailureRule.addTarget(
      new targets.LambdaFunction(props.remediationFunction)
    );

    // EventBridge rule for DMS task failures
    const dmsFailureRule = new events.Rule(this, 'DMSTaskFailureRule', {
      ruleName: `migration-dms-failure-${props.environmentSuffix}`,
      description: 'Trigger on DMS task failures',
      eventPattern: {
        source: ['aws.dms'],
        detailType: ['DMS Replication Task State Change'],
        detail: {
          eventName: ['ReplicationTaskStopped'],
        },
      },
    });

    dmsFailureRule.addTarget(
      new targets.LambdaFunction(props.remediationFunction)
    );

    // EventBridge rule for Step Functions failures
    const stepFunctionFailureRule = new events.Rule(
      this,
      'StepFunctionFailureRule',
      {
        ruleName: `migration-stepfunction-failure-${props.environmentSuffix}`,
        description: 'Trigger on Step Functions failures',
        eventPattern: {
          source: ['aws.states'],
          detailType: ['Step Functions Execution Status Change'],
          detail: {
            status: ['FAILED', 'TIMED_OUT', 'ABORTED'],
          },
        },
      }
    );

    stepFunctionFailureRule.addTarget(
      new targets.LambdaFunction(props.remediationFunction)
    );

    // EventBridge rule for S3 events (for monitoring)
    const s3EventRule = new events.Rule(this, 'S3EventRule', {
      ruleName: `migration-s3-events-${props.environmentSuffix}`,
      description: 'Monitor S3 events',
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created', 'Object Deleted'],
      },
    });

    s3EventRule.addTarget(
      new targets.LambdaFunction(props.remediationFunction)
    );
  }
}

// LoggingStack - OpenSearch Domain
class LoggingStack extends cdk.NestedStack {
  public readonly openSearchDomain: opensearch.Domain;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.NestedStackProps & {
      vpc: ec2.Vpc;
      openSearchSecurityGroup: ec2.SecurityGroup;
      environmentSuffix: string;
    }
  ) {
    super(scope, id, props);

    // Create OpenSearch domain
    this.openSearchDomain = new opensearch.Domain(this, 'AuditLogDomain', {
      version: opensearch.EngineVersion.OPENSEARCH_2_11,
      capacity: {
        dataNodes: 2,
        dataNodeInstanceType: 'r6g.large.search',
        multiAzWithStandbyEnabled: false,
      },
      ebs: {
        volumeSize: 100,
        volumeType: ec2.EbsDeviceVolumeType.GP3,
      },
      vpc: props.vpc,
      vpcSubnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          availabilityZones: [props.vpc.availabilityZones[0]],
        },
      ],
      securityGroups: [props.openSearchSecurityGroup],
      enforceHttps: true,
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
      removalPolicy:
        props.environmentSuffix === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });

    this.openSearchDomain.addAccessPolicies(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ['es:*'],
        resources: [
          `${this.openSearchDomain.domainArn}/*`,
          this.openSearchDomain.domainArn,
        ],
      })
    );
    // Create log group for centralized logging
    new logs.LogGroup(this, 'CentralLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy:
        props.environmentSuffix === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
    });
  }
}

// Main TapStack - Orchestrates all nested stacks
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      env: { region: 'us-west-2', account: process.env.CDK_DEFAULT_ACCOUNT },
    });

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const stackProps: cdk.NestedStackProps = {};

    // LAYER 1: Foundation
    const networkStack = new NetworkStack(
      this,
      'MigrationNetworkStack',
      stackProps
    );

    // LAYER 2: Storage
    const storageStack = new StorageStack(this, 'MigrationStorageStack', {
      ...stackProps,
      environmentSuffix,
    });

    // LAYER 3: Database
    const databaseStack = new DatabaseStack(this, 'MigrationDatabaseStack', {
      ...stackProps,
      vpc: networkStack.vpc,
      dbSecurityGroup: networkStack.dbSecurityGroup,
      environmentSuffix,
    });

    // LAYER 4: Glue
    const glueStack = new GlueStack(this, 'MigrationGlueStack', {
      ...stackProps,
      scriptBucket: storageStack.scriptBucket,
      dataBucket: storageStack.dataBucket,
      environmentSuffix,
    });

    // LAYER 5: Messaging (create topic early; no lambda refs)
    const messagingStack = new MessagingStack(this, 'MigrationMessagingStack', {
      ...stackProps,
      environmentSuffix,
    });

    // LAYER 6: DMS (depends on network & db)
    const dmsStack = new DMSStack(this, 'MigrationDMSStack', {
      ...stackProps,
      vpc: networkStack.vpc,
      auroraCluster: databaseStack.auroraCluster,
      dmsSecurityGroup: networkStack.dmsSecurityGroup,
      environmentSuffix,
    });

    // LAYER 7: Orchestration (needs topic & dms)
    const orchestrationStack = new OrchestrationStack(
      this,
      'MigrationOrchestrationStack',
      {
        ...stackProps,
        replicationTask: dmsStack.replicationTask,
        validationTopic: messagingStack.validationTopic,
        environmentSuffix,
      }
    );

    // LAMBDA created after orchestration to allow wiring of STATE_MACHINE_ARN afterwards
    const lambdaStack = new LambdaStack(this, 'MigrationLambdaStack', {
      ...stackProps,
      dataBucket: storageStack.dataBucket,
      validationJob: glueStack.validationJob,
      vpc: networkStack.vpc,
      lambdaSecurityGroup: networkStack.lambdaSecurityGroup,
      environmentSuffix,
      validationTopic: messagingStack.validationTopic, // NEW: subscribe lambdas to topic inside LambdaStack
    });

    // Wire state machine ARN into lambda (still ok to set after creation)
    lambdaStack.stepFunctionTriggerFunction.addEnvironment(
      'STATE_MACHINE_ARN',
      orchestrationStack.stateMachine.stateMachineArn
    );

    lambdaStack.stepFunctionTriggerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['states:StartExecution'],
        resources: [orchestrationStack.stateMachine.stateMachineArn],
      })
    );

    // LAYER 8: DataSync
    const dataSyncStack = new DataSyncStack(this, 'MigrationDataSyncStack', {
      ...stackProps,
      vpc: networkStack.vpc,
      dataBucket: storageStack.dataBucket,
      dataSyncSecurityGroup: networkStack.dataSyncSecurityGroup,
      environmentSuffix,
    });

    // LAYER 9: Monitoring
    new MonitoringStack(this, 'MigrationMonitoringStack', {
      ...stackProps,
      remediationFunction: lambdaStack.remediationFunction,
      environmentSuffix,
    });

    // LAYER 10: Logging
    const loggingStack = new LoggingStack(this, 'MigrationLoggingStack', {
      ...stackProps,
      vpc: networkStack.vpc,
      openSearchSecurityGroup: networkStack.openSearchSecurityGroup,
      environmentSuffix,
    });

    // S3 -> Lambda EventBridge rule (main stack) — avoids S3 bucket nested-stack notifications causing cross-nesting references
    const s3ToLambdaRule = new events.Rule(this, 'S3ObjectCreatedRule', {
      ruleName: `migration-s3-to-lambda-${environmentSuffix}`,
      description: 'Trigger Glue Lambda when objects are created in S3',
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [storageStack.dataBucket.bucketName],
          },
          object: {
            key: [{ prefix: 'incoming/' }],
          },
        },
      },
    });

    s3ToLambdaRule.addTarget(
      new targets.LambdaFunction(lambdaStack.glueTriggerFunction)
    );

    // Explicit Dependencies
    storageStack.addDependency(networkStack);
    databaseStack.addDependency(networkStack);
    glueStack.addDependency(storageStack);
    messagingStack.addDependency(glueStack);
    dmsStack.addDependency(networkStack);
    dmsStack.addDependency(databaseStack);
    orchestrationStack.addDependency(dmsStack);
    orchestrationStack.addDependency(messagingStack);
    lambdaStack.addDependency(storageStack);
    lambdaStack.addDependency(glueStack);
    lambdaStack.addDependency(orchestrationStack);
    dataSyncStack.addDependency(networkStack);
    dataSyncStack.addDependency(storageStack);

    // Stack outputs (unchanged)
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkStack.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });
    new cdk.CfnOutput(this, 'DataBucketName', {
      value: storageStack.dataBucket.bucketName,
      description: 'Data Bucket Name',
      exportName: `${this.stackName}-DataBucketName`,
    });
    new cdk.CfnOutput(this, 'ValidationJobName', {
      value: glueStack.validationJob.name!,
      description: 'Glue Validation Job Name',
      exportName: `${this.stackName}-ValidationJobName`,
    });
    new cdk.CfnOutput(this, 'GlueTriggerFunctionArn', {
      value: lambdaStack.glueTriggerFunction.functionArn,
      description: 'Glue Trigger Lambda Function ARN',
      exportName: `${this.stackName}-GlueTriggerFunctionArn`,
    });
    new cdk.CfnOutput(this, 'ValidationTopicArn', {
      value: messagingStack.validationTopic.topicArn,
      description: 'Validation SNS Topic ARN',
      exportName: `${this.stackName}-ValidationTopicArn`,
    });
    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: orchestrationStack.stateMachine.stateMachineArn,
      description: 'Step Functions State Machine ARN',
      exportName: `${this.stackName}-StateMachineArn`,
    });
    new cdk.CfnOutput(this, 'OpenSearchDomainEndpoint', {
      value: loggingStack.openSearchDomain.domainEndpoint,
      description: 'OpenSearch Domain Endpoint',
      exportName: `${this.stackName}-OpenSearchDomainEndpoint`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix for all resources',
    });
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'Deployment region',
    });
    new cdk.CfnOutput(this, 'AccountId', {
      value: this.account,
      description: 'AWS Account ID',
    });
    new cdk.CfnOutput(this, 'PipelineStatus', {
      value: 'DEPLOYED',
      description: 'Migration pipeline deployment status',
    });
    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'CloudFormation Stack Name',
    });
  }
}
