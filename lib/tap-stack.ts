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
      bucketName: `migration-data-${props.environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      eventBridgeEnabled: true, // Enable EventBridge for S3 events
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
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
      bucketName: `migration-scripts-${props.environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
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
        version: rds.AuroraMysqlEngineVersion.VER_3_05_2,
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
      clusterIdentifier: `migration-aurora-${props.environmentSuffix}`,
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

// LambdaStack - Lambda Functions (NO S3 NOTIFICATIONS HERE!)
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
  }
}

// MessagingStack - SNS Topics
class MessagingStack extends cdk.NestedStack {
  public readonly validationTopic: sns.Topic;

  constructor(
    scope: Construct,
    id: string,
    props: cdk.NestedStackProps & {
      stepFunctionTriggerFunction: lambda.Function;
      environmentSuffix: string;
    }
  ) {
    super(scope, id, props);

    // Create SNS topic for validation results
    this.validationTopic = new sns.Topic(this, 'ValidationTopic', {
      topicName: `migration-validation-${props.environmentSuffix}`,
      displayName: 'Migration Validation Results',
    });

    // Subscribe Lambda function to SNS topic
    this.validationTopic.addSubscription(
      new subscriptions.LambdaSubscription(props.stepFunctionTriggerFunction)
    );

    // Grant SNS publish permission to Glue (via resource policy)
    this.validationTopic.grantPublish(
      new iam.ServicePrincipal('glue.amazonaws.com')
    );
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

// DataSyncStack - AWS DataSync Configuration
class DataSyncStack extends cdk.NestedStack {
  public readonly dataSyncTask: datasync.CfnTask;

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

    // Create DataSync NFS location (placeholder for on-premises)
    const nfsLocation = new datasync.CfnLocationNFS(this, 'NFSLocation', {
      serverHostname: 'nfs.example.com',
      subdirectory: '/data/',
      onPremConfig: {
        agentArns: [
          'arn:aws:datasync:us-west-2:123456789012:agent/agent-placeholder',
        ],
      },
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
      domainName: `migration-audit-logs-${props.environmentSuffix}`,
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
      accessPolicies: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          principals: [new iam.AnyPrincipal()],
          actions: ['es:*'],
          resources: [
            `arn:aws:es:${this.region}:${this.account}:domain/migration-audit-logs-${props.environmentSuffix}/*`,
          ],
        }),
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create log group for centralized logging
    new logs.LogGroup(this, 'CentralLogGroup', {
      logGroupName: `/aws/migration/pipeline-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}

// Main TapStack - Orchestrates all nested stacks
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const stackProps: cdk.NestedStackProps = {};

    // ========================================
    // LAYER 1: Foundation - No dependencies
    // ========================================
    const networkStack = new NetworkStack(
      this,
      'MigrationNetworkStack',
      stackProps
    );

    // ========================================
    // LAYER 2: Storage - No dependencies
    // ========================================
    const storageStack = new StorageStack(this, 'MigrationStorageStack', {
      ...stackProps,
      environmentSuffix,
    });

    // ========================================
    // LAYER 3: Database - Depends on Network
    // ========================================
    const databaseStack = new DatabaseStack(this, 'MigrationDatabaseStack', {
      ...stackProps,
      vpc: networkStack.vpc,
      dbSecurityGroup: networkStack.dbSecurityGroup,
      environmentSuffix,
    });

    // ========================================
    // LAYER 4: Glue - Depends on Storage
    // ========================================
    const glueStack = new GlueStack(this, 'MigrationGlueStack', {
      ...stackProps,
      scriptBucket: storageStack.scriptBucket,
      dataBucket: storageStack.dataBucket,
      environmentSuffix,
    });

    // ========================================
    // LAYER 5: Lambda - Depends on Storage, Glue, Network
    // NO S3 NOTIFICATIONS CONFIGURED HERE!
    // ========================================
    const lambdaStack = new LambdaStack(this, 'MigrationLambdaStack', {
      ...stackProps,
      dataBucket: storageStack.dataBucket,
      validationJob: glueStack.validationJob,
      vpc: networkStack.vpc,
      lambdaSecurityGroup: networkStack.lambdaSecurityGroup,
      environmentSuffix,
    });

    // ========================================
    // LAYER 6: Messaging - Depends on Lambda
    // ========================================
    const messagingStack = new MessagingStack(this, 'MigrationMessagingStack', {
      ...stackProps,
      stepFunctionTriggerFunction: lambdaStack.stepFunctionTriggerFunction,
      environmentSuffix,
    });

    // ========================================
    // LAYER 7: DMS - Depends on Network and Database
    // ========================================
    const dmsStack = new DMSStack(this, 'MigrationDMSStack', {
      ...stackProps,
      vpc: networkStack.vpc,
      auroraCluster: databaseStack.auroraCluster,
      dmsSecurityGroup: networkStack.dmsSecurityGroup,
      environmentSuffix,
    });

    // ========================================
    // LAYER 8: Orchestration - Depends on DMS and Messaging
    // ========================================
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

    // ========================================
    // LAYER 9: Post-orchestration configuration
    // ========================================
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

    // ========================================
    // LAYER 10: DataSync - Depends on Network and Storage
    // ========================================
    const dataSyncStack = new DataSyncStack(this, 'MigrationDataSyncStack', {
      ...stackProps,
      vpc: networkStack.vpc,
      dataBucket: storageStack.dataBucket,
      dataSyncSecurityGroup: networkStack.dataSyncSecurityGroup,
      environmentSuffix,
    });

    // ========================================
    // LAYER 11: Monitoring - Depends on Lambda
    // ========================================
    new MonitoringStack(this, 'MigrationMonitoringStack', {
      ...stackProps,
      remediationFunction: lambdaStack.remediationFunction,
      environmentSuffix,
    });

    lambdaStack.remediationFunction.addEnvironment(
      'ALERT_TOPIC_ARN',
      messagingStack.validationTopic.topicArn
    );

    messagingStack.validationTopic.grantPublish(
      lambdaStack.remediationFunction
    );

    // ========================================
    // LAYER 12: Logging - Depends on Network
    // ========================================
    const loggingStack = new LoggingStack(this, 'MigrationLoggingStack', {
      ...stackProps,
      vpc: networkStack.vpc,
      openSearchSecurityGroup: networkStack.openSearchSecurityGroup,
      environmentSuffix,
    });

    // ========================================
    // CRITICAL FIX: S3 EventBridge Rule configured HERE in main stack
    // This breaks the circular dependency!
    // ========================================
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

    // ========================================
    // STACK OUTPUTS
    // ========================================

    // Network outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: networkStack.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: networkStack.vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: `${this.stackName}-VpcCidr`,
    });

    // Storage outputs
    new cdk.CfnOutput(this, 'DataBucketName', {
      value: storageStack.dataBucket.bucketName,
      description: 'Data Bucket Name',
      exportName: `${this.stackName}-DataBucketName`,
    });

    new cdk.CfnOutput(this, 'DataBucketArn', {
      value: storageStack.dataBucket.bucketArn,
      description: 'Data Bucket ARN',
      exportName: `${this.stackName}-DataBucketArn`,
    });

    new cdk.CfnOutput(this, 'ScriptBucketName', {
      value: storageStack.scriptBucket.bucketName,
      description: 'Script Bucket Name',
      exportName: `${this.stackName}-ScriptBucketName`,
    });

    new cdk.CfnOutput(this, 'ScriptBucketArn', {
      value: storageStack.scriptBucket.bucketArn,
      description: 'Script Bucket ARN',
      exportName: `${this.stackName}-ScriptBucketArn`,
    });

    // Database outputs
    new cdk.CfnOutput(this, 'AuroraClusterEndpoint', {
      value: databaseStack.auroraCluster.clusterEndpoint.hostname,
      description: 'Aurora Cluster Endpoint',
      exportName: `${this.stackName}-ClusterEndpoint`,
    });

    new cdk.CfnOutput(this, 'AuroraClusterArn', {
      value: databaseStack.auroraCluster.clusterArn,
      description: 'Aurora Cluster ARN',
      exportName: `${this.stackName}-ClusterArn`,
    });

    // Glue outputs
    new cdk.CfnOutput(this, 'GlueDatabaseName', {
      value: glueStack.glueDatabase.ref,
      description: 'Glue Database Name',
      exportName: `${this.stackName}-GlueDatabaseName`,
    });

    new cdk.CfnOutput(this, 'ValidationJobName', {
      value: glueStack.validationJob.name!,
      description: 'Glue Validation Job Name',
      exportName: `${this.stackName}-ValidationJobName`,
    });

    // Lambda outputs
    new cdk.CfnOutput(this, 'GlueTriggerFunctionArn', {
      value: lambdaStack.glueTriggerFunction.functionArn,
      description: 'Glue Trigger Lambda Function ARN',
      exportName: `${this.stackName}-GlueTriggerFunctionArn`,
    });

    new cdk.CfnOutput(this, 'GlueTriggerFunctionName', {
      value: lambdaStack.glueTriggerFunction.functionName,
      description: 'Glue Trigger Lambda Function Name',
      exportName: `${this.stackName}-GlueTriggerFunctionName`,
    });

    new cdk.CfnOutput(this, 'StepFunctionTriggerFunctionArn', {
      value: lambdaStack.stepFunctionTriggerFunction.functionArn,
      description: 'Step Function Trigger Lambda Function ARN',
      exportName: `${this.stackName}-StepFunctionTriggerFunctionArn`,
    });

    new cdk.CfnOutput(this, 'StepFunctionTriggerFunctionName', {
      value: lambdaStack.stepFunctionTriggerFunction.functionName,
      description: 'Step Function Trigger Lambda Function Name',
      exportName: `${this.stackName}-StepFunctionTriggerFunctionName`,
    });

    new cdk.CfnOutput(this, 'RemediationFunctionArn', {
      value: lambdaStack.remediationFunction.functionArn,
      description: 'Remediation Lambda Function ARN',
      exportName: `${this.stackName}-RemediationFunctionArn`,
    });

    new cdk.CfnOutput(this, 'RemediationFunctionName', {
      value: lambdaStack.remediationFunction.functionName,
      description: 'Remediation Lambda Function Name',
      exportName: `${this.stackName}-RemediationFunctionName`,
    });

    // Messaging outputs
    new cdk.CfnOutput(this, 'ValidationTopicArn', {
      value: messagingStack.validationTopic.topicArn,
      description: 'Validation SNS Topic ARN',
      exportName: `${this.stackName}-ValidationTopicArn`,
    });

    new cdk.CfnOutput(this, 'ValidationTopicName', {
      value: messagingStack.validationTopic.topicName,
      description: 'Validation SNS Topic Name',
      exportName: `${this.stackName}-ValidationTopicName`,
    });

    // DMS outputs
    new cdk.CfnOutput(this, 'DMSReplicationInstanceArn', {
      value: dmsStack.replicationInstance.ref,
      description: 'DMS Replication Instance ARN',
      exportName: `${this.stackName}-ReplicationInstanceArn`,
    });

    new cdk.CfnOutput(this, 'DMSReplicationTaskArn', {
      value: dmsStack.replicationTask.ref,
      description: 'DMS Replication Task ARN',
      exportName: `${this.stackName}-ReplicationTaskArn`,
    });

    // Orchestration outputs
    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: orchestrationStack.stateMachine.stateMachineArn,
      description: 'Step Functions State Machine ARN',
      exportName: `${this.stackName}-StateMachineArn`,
    });

    new cdk.CfnOutput(this, 'StateMachineName', {
      value: orchestrationStack.stateMachine.stateMachineName,
      description: 'Step Functions State Machine Name',
      exportName: `${this.stackName}-StateMachineName`,
    });

    // DataSync outputs
    new cdk.CfnOutput(this, 'DataSyncTaskArn', {
      value: dataSyncStack.dataSyncTask.attrTaskArn,
      description: 'DataSync Task ARN',
      exportName: `${this.stackName}-DataSyncTaskArn`,
    });

    // Logging outputs
    new cdk.CfnOutput(this, 'OpenSearchDomainEndpoint', {
      value: loggingStack.openSearchDomain.domainEndpoint,
      description: 'OpenSearch Domain Endpoint',
      exportName: `${this.stackName}-OpenSearchDomainEndpoint`,
    });

    new cdk.CfnOutput(this, 'OpenSearchDomainArn', {
      value: loggingStack.openSearchDomain.domainArn,
      description: 'OpenSearch Domain ARN',
      exportName: `${this.stackName}-OpenSearchDomainArn`,
    });

    // Main stack metadata outputs
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
