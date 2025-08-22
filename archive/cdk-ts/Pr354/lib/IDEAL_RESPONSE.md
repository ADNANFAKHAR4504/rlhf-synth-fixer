# CDK TypeScript Infrastructure Code


## iot-data-processor-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export interface IoTDataProcessorConstructProps {
  environmentSuffix: string;
}

export class IoTDataProcessorConstruct extends Construct {
  public readonly s3Bucket: s3.Bucket;
  public readonly dynamoTable: dynamodb.Table;
  public readonly lambdaFunction: lambda.Function;
  public readonly lambdaRole: iam.Role;
  public readonly logGroup: logs.LogGroup;

  constructor(
    scope: Construct,
    id: string,
    props: IoTDataProcessorConstructProps
  ) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Create S3 bucket for IoT data uploads
    this.s3Bucket = new s3.Bucket(this, 'IoTDataBucket', {
      bucketName: `iot-data-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Create DynamoDB table for processed data with high-traffic configuration
    this.dynamoTable = new dynamodb.Table(this, 'IoTProcessedDataTable', {
      tableName: `iot-processed-data-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      partitionKey: {
        name: 'deviceId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Better for unpredictable traffic
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Create CloudWatch Log Group - let CDK generate unique name to avoid conflicts
    this.logGroup = new logs.LogGroup(this, 'IoTDataProcessorLogGroup', {
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for Lambda with least privilege access
    this.lambdaRole = new iam.Role(this, 'IoTDataProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add specific permissions to the role
    this.lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:GetObjectVersion'],
        resources: [this.s3Bucket.arnForObjects('*')],
      })
    );

    this.lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:GetItem',
        ],
        resources: [this.dynamoTable.tableArn],
      })
    );

    this.lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [this.logGroup.logGroupArn],
      })
    );

    // Create Lambda function for IoT data processing
    this.lambdaFunction = new lambda.Function(this, 'IoTDataProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: this.lambdaRole,
      code: lambda.Code.fromInline(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const dynamodb = new DynamoDBClient({ region: 'us-west-2' });
const s3 = new S3Client({ region: 'us-west-2' });

exports.handler = async (event) => {
    console.log('Processing IoT data upload event:', JSON.stringify(event, null, 2));
    
    try {
        for (const record of event.Records) {
            const bucketName = record.s3.bucket.name;
            const objectKey = record.s3.object.key;
            
            console.log(\`Processing file: \${objectKey} from bucket: \${bucketName}\`);
            
            // Get object from S3
            const getObjectCommand = new GetObjectCommand({
                Bucket: bucketName,
                Key: objectKey,
            });
            
            const s3Response = await s3.send(getObjectCommand);
            const fileContent = await s3Response.Body.transformToString();
            
            console.log('File content retrieved, length:', fileContent.length);
            
            // Parse and process the data (assuming JSON format)
            let data;
            try {
                data = JSON.parse(fileContent);
            } catch (parseError) {
                console.error('Error parsing JSON:', parseError);
                // For non-JSON files, create a basic structure
                data = {
                    deviceId: objectKey.split('/')[0] || 'unknown',
                    rawData: fileContent,
                    processedAt: new Date().toISOString(),
                };
            }
            
            // Ensure required fields exist
            if (!data.deviceId) {
                data.deviceId = objectKey.split('/')[0] || 'unknown';
            }
            
            const timestamp = data.timestamp || new Date().toISOString();
            const processedData = {
                ...data,
                processedAt: new Date().toISOString(),
                sourceFile: objectKey,
                sourceBucket: bucketName,
            };
            
            // Store processed data in DynamoDB
            const putItemCommand = new PutItemCommand({
                TableName: process.env.DYNAMODB_TABLE_NAME,
                Item: {
                    deviceId: { S: data.deviceId },
                    timestamp: { S: timestamp },
                    processedData: { S: JSON.stringify(processedData) },
                    processedAt: { S: processedData.processedAt },
                    sourceFile: { S: objectKey },
                    sourceBucket: { S: bucketName },
                },
            });
            
            await dynamodb.send(putItemCommand);
            console.log(\`Successfully processed and stored data for device: \${data.deviceId}\`);
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Successfully processed IoT data',
                processedRecords: event.Records.length,
            }),
        };
        
    } catch (error) {
        console.error('Error processing IoT data:', error);
        throw error;
    }
};
      `),
      environment: {
        DYNAMODB_TABLE_NAME: this.dynamoTable.tableName,
        LOG_GROUP_NAME: this.logGroup.logGroupName,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      // Reserved concurrency configuration has been removed to avoid account limits.
      // For details on configuring reserved concurrency, refer to the project configuration guide.
      logGroup: this.logGroup,
    });

    // Add S3 bucket notification to trigger Lambda
    this.s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(this.lambdaFunction)
    );
  }
}
```


## secure-cloud-environment-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as config from 'aws-cdk-lib/aws-config';

export interface SecureCloudEnvironmentConstructProps {
  environmentSuffix: string;
}

export class SecureCloudEnvironmentConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly asg: autoscaling.AutoScalingGroup;
  public readonly database: rds.DatabaseInstance;
  public readonly bastionHost: ec2.BastionHostLinux;
  public readonly logBucket: s3.Bucket;

  constructor(
    scope: Construct,
    id: string,
    props: SecureCloudEnvironmentConstructProps
  ) {
    super(scope, id);

    const { environmentSuffix } = props;

    // --- Tagging Strategy ---
    const tags = {
      Project: 'SecureCloudEnvironment',
      Environment: environmentSuffix,
    };
    for (const [key, value] of Object.entries(tags)) {
      cdk.Tags.of(this).add(key, value);
    }

    // --- VPC with Multi-AZ and Logging ---
    this.vpc = new ec2.Vpc(this, 'AppVPC', {
      maxAzs: 2,
      natGateways: 1, // For cost-effectiveness in non-prod environments
      subnetConfiguration: [
        {
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private-app-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'private-db-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // --- VPC Flow Logs ---
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });

    // --- Bastion Host for Secure Access ---
    const bastionSg = new ec2.SecurityGroup(this, 'BastionSG', {
      vpc: this.vpc,
      description: 'Security group for bastion host',
    });
    // Restrict SSH access to a specific IP range for better security
    bastionSg.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(22),
      'Allow SSH access from trusted IP range'
    );

    this.bastionHost = new ec2.BastionHostLinux(this, 'BastionHost', {
      vpc: this.vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: bastionSg,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.NANO
      ),
    });

    // --- S3 Bucket for Logs ---
    this.logBucket = new s3.Bucket(this, 'LogBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // For easy cleanup in non-prod
    });

    // --- Application Load Balancer ---
    const albSg = new ec2.SecurityGroup(this, 'AlbSG', {
      vpc: this.vpc,
      description: 'Security group for ALB',
    });
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    this.alb = new elbv2.ApplicationLoadBalancer(this, 'AppALB', {
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
    this.alb.logAccessLogs(this.logBucket, 'alb-logs');

    // --- Application Tier (Auto Scaling Group) ---
    const appSg = new ec2.SecurityGroup(this, 'AppSG', {
      vpc: this.vpc,
      description: 'Security group for application instances',
    });
    appSg.addIngressRule(albSg, ec2.Port.tcp(80), 'Allow traffic from ALB');

    const appRole = new iam.Role(this, 'AppInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // For Systems Manager access
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ), // For CloudWatch agent
      ],
    });

    // User data script to install and configure CloudWatch agent
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        metrics: {
          namespace: 'CWAgent',
          metrics_collected: {
            cpu: {
              measurement: [
                'cpu_usage_idle',
                'cpu_usage_iowait',
                'cpu_usage_user',
                'cpu_usage_system',
              ],
              metrics_collection_interval: 60,
            },
            disk: {
              measurement: ['used_percent'],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            diskio: {
              measurement: ['io_time'],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            mem: {
              measurement: ['mem_used_percent'],
              metrics_collection_interval: 60,
            },
            netstat: {
              measurement: ['tcp_established', 'tcp_time_wait'],
              metrics_collection_interval: 60,
            },
            swap: {
              measurement: ['swap_used_percent'],
              metrics_collection_interval: 60,
            },
          },
        },
      }),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    this.asg = new autoscaling.AutoScalingGroup(this, 'AppASG', {
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: appSg,
      role: appRole,
      userData: userData,
      minCapacity: 2,
      maxCapacity: 5,
    });
    this.asg.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    const listener = this.alb.addListener('HttpListener', { port: 80 });
    listener.addTargets('AppTargets', {
      port: 80,
      targets: [this.asg],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
      },
    });

    // --- Database Tier (RDS MySQL) ---
    const dbSg = new ec2.SecurityGroup(this, 'DbSG', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
    });
    dbSg.addIngressRule(
      appSg,
      ec2.Port.tcp(3306),
      'Allow traffic from application instances'
    );

    this.database = new rds.DatabaseInstance(this, 'MySQLDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE4_GRAVITON,
        ec2.InstanceSize.SMALL
      ),
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      multiAz: true,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // --- Monitoring (CloudWatch Alarms) ---
    new cloudwatch.Alarm(this, 'HighCpuAlarmASG', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName: this.asg.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      threshold: 85,
      evaluationPeriods: 2,
      alarmDescription:
        'High CPU utilization on the application Auto Scaling Group.',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Memory usage alarm using CloudWatch agent metrics
    new cloudwatch.Alarm(this, 'HighMemoryAlarmASG', {
      metric: new cloudwatch.Metric({
        namespace: 'CWAgent',
        metricName: 'mem_used_percent',
        dimensionsMap: {
          AutoScalingGroupName: this.asg.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      threshold: 80,
      evaluationPeriods: 2,
      alarmDescription:
        'High memory utilization on the application Auto Scaling Group.',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // --- Compliance (AWS Config Rules) ---
    // AWS Config requires a configuration recorder and delivery channel
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const configRole = new iam.Role(this, 'ConfigRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWS_ConfigRole'
        ),
      ],
    });

    configBucket.grantWrite(configRole);

    const configurationRecorder = new config.CfnConfigurationRecorder(
      this,
      'ConfigRecorder',
      {
        name: 'default',
        roleArn: configRole.roleArn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      }
    );

    const deliveryChannel = new config.CfnDeliveryChannel(
      this,
      'ConfigDeliveryChannel',
      {
        name: 'default',
        s3BucketName: configBucket.bucketName,
      }
    );

    // Config rules
    const s3VersioningRule = new config.ManagedRule(
      this,
      'S3VersioningEnabledRule',
      {
        identifier: config.ManagedRuleIdentifiers.S3_BUCKET_VERSIONING_ENABLED,
      }
    );

    const ec2NoPublicIpRule = new config.ManagedRule(
      this,
      'Ec2NoPublicIpRule',
      {
        identifier: config.ManagedRuleIdentifiers.EC2_INSTANCE_NO_PUBLIC_IP,
      }
    );

    // Ensure Config rules depend on the recorder and delivery channel
    s3VersioningRule.node.addDependency(configurationRecorder);
    s3VersioningRule.node.addDependency(deliveryChannel);
    ec2NoPublicIpRule.node.addDependency(configurationRecorder);
    ec2NoPublicIpRule.node.addDependency(deliveryChannel);
  }
}
```


## tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureCloudEnvironmentConstruct } from './secure-cloud-environment-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly secureEnvironment: SecureCloudEnvironmentConstruct;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-west-2',
        ...props?.env,
      },
    });

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Instantiate the Secure Cloud Environment construct
    this.secureEnvironment = new SecureCloudEnvironmentConstruct(
      this,
      'SecureEnvironment',
      {
        environmentSuffix,
      }
    );

    // Output important values
    new cdk.CfnOutput(this, 'ALBDNS', {
      value: this.secureEnvironment.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'BastionHostId', {
      value: this.secureEnvironment.bastionHost.instanceId,
      description: 'Bastion host instance ID for secure access',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.secureEnvironment.database.instanceEndpoint.hostname,
      description: 'RDS MySQL database endpoint',
    });

    new cdk.CfnOutput(this, 'LogBucketName', {
      value: this.secureEnvironment.logBucket.bucketName,
      description: 'S3 bucket for infrastructure logs',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.secureEnvironment.vpc.vpcId,
      description: 'VPC ID for the secure environment',
    });
  }
}
```
