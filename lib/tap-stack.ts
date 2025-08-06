import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// Interface for stack configuration parameters
interface SecureInfraStackProps extends cdk.StackProps {
  readonly region: string;
  readonly environment: string;
  readonly projectName: string;
}

// Main CDK Stack implementing all security requirements
export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly s3Bucket: s3.Bucket;
  public readonly lambdaFunction: lambda.Function;
  public readonly rdsInstance: rds.DatabaseInstance;
  public readonly ec2Instance: ec2.Instance;

  constructor(scope: Construct, id: string, props: SecureInfraStackProps) {
    super(scope, id, props);

    // Create KMS Key for encryption across all services
    this.kmsKey = this.createKMSKey(props);

    // Create VPC with Flow Logs enabled
    this.vpc = this.createVPCWithFlowLogs(props);

    // Create S3 bucket with KMS encryption
    this.s3Bucket = this.createEncryptedS3Bucket(props);

    // Create Lambda function with restricted IAM role
    this.lambdaFunction = this.createLambdaWithRestrictedRole(props);

    // Create RDS instance in Multi-AZ configuration
    this.rdsInstance = this.createMultiAZRDSInstance(props);

    // Create EC2 instance with detailed CloudWatch logging
    this.ec2Instance = this.createEC2WithDetailedLogging(props);

    // Output important resource ARNs
    this.createOutputs(props);
  }

  private createKMSKey(props: SecureInfraStackProps): kms.Key {
    return new kms.Key(this, `${props.projectName}-KMSKey-${props.region}`, {
      description: `KMS Key for ${props.projectName} in ${props.region}`,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow use of the key for AWS services',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
    });
  }

  private createVPCWithFlowLogs(props: SecureInfraStackProps): ec2.Vpc {
    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogsGroup = new logs.LogGroup(this, `${props.projectName}-VPCFlowLogs-${props.region}`, {
      logGroupName: `/aws/vpc/flowlogs/${props.projectName}-${props.region}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for VPC Flow Logs
    const flowLogsRole = new iam.Role(this, `${props.projectName}-VPCFlowLogsRole-${props.region}`, {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogsDeliveryRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create VPC
    const vpc = new ec2.Vpc(this, `${props.projectName}-VPC-${props.region}`, {
      maxAzs: 3,
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

    // Enable VPC Flow Logs
    new ec2.FlowLog(this, `${props.projectName}-VPCFlowLog-${props.region}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogsGroup, flowLogsRole),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    return vpc;
  }

  private createEncryptedS3Bucket(props: SecureInfraStackProps): s3.Bucket {
    return new s3.Bucket(this, `${props.projectName}-S3Bucket-${props.region}`, {
      bucketName: `${props.projectName.toLowerCase()}-secure-bucket-${props.region}-${props.environment}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      bucketKeyEnabled: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
      ],
    });
  }

  private createLambdaWithRestrictedRole(props: SecureInfraStackProps): lambda.Function {
    // Create restricted IAM role for Lambda
    const lambdaRole = new iam.Role(this, `${props.projectName}-LambdaRole-${props.region}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        RestrictedS3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
              ],
              resources: [
                this.s3Bucket.bucketArn,
                `${this.s3Bucket.bucketArn}/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              resources: [this.kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    return new lambda.Function(this, `${props.projectName}-Lambda-${props.region}`, {
      functionName: `${props.projectName}-SecureFunction-${props.region}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Secure Lambda function executed');
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Hello from secure Lambda!',
              region: process.env.AWS_REGION
            })
          };
        };
      `),
      environment: {
        BUCKET_NAME: this.s3Bucket.bucketName,
        KMS_KEY_ID: this.kmsKey.keyId,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
    });
  }

  private createMultiAZRDSInstance(props: SecureInfraStackProps): rds.DatabaseInstance {
    // Create subnet group for RDS in isolated subnets
    const subnetGroup = new rds.SubnetGroup(this, `${props.projectName}-RDSSubnetGroup-${props.region}`, {
      description: `Subnet group for ${props.projectName} RDS instance`,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, `${props.projectName}-RDSSecurityGroup-${props.region}`, {
      vpc: this.vpc,
      description: 'Security group for RDS instance',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(3306),
      'Allow MySQL access from VPC'
    );

    return new rds.DatabaseInstance(this, `${props.projectName}-RDS-${props.region}`, {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `${props.projectName}-rds-credentials-${props.region}`,
      }),
      vpc: this.vpc,
      subnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true, // Enable Multi-AZ deployment
      storageEncrypted: true,
      storageEncryptionKey: this.kmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set to true for production
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
      enablePerformanceInsights: false, // Disabled for t3.micro compatibility
      cloudwatchLogsExports: ['error', 'general'],
    });
  }

  private createEC2WithDetailedLogging(props: SecureInfraStackProps): ec2.Instance {
    // Create IAM role for EC2 with CloudWatch permissions
    const ec2Role = new iam.Role(this, `${props.projectName}-EC2Role-${props.region}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // Create security group for EC2
    const ec2SecurityGroup = new ec2.SecurityGroup(this, `${props.projectName}-EC2SecurityGroup-${props.region}`, {
      vpc: this.vpc,
      description: 'Security group for EC2 instance',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH access from VPC'
    );

    // User data script to install and configure CloudWatch agent
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        agent: {
          metrics_collection_interval: 60,
          run_as_user: 'cwagent'
        },
        logs: {
          logs_collected: {
            files: {
              collect_list: [
                {
                  file_path: '/var/log/messages',
                  log_group_name: `/aws/ec2/${props.projectName}-${props.region}/var/log/messages`,
                  log_stream_name: '{instance_id}',
                  retention_in_days: 30
                },
                {
                  file_path: '/var/log/secure',
                  log_group_name: `/aws/ec2/${props.projectName}-${props.region}/var/log/secure`,
                  log_stream_name: '{instance_id}',
                  retention_in_days: 30
                }
              ]
            }
          }
        },
        metrics: {
          namespace: `${props.projectName}/EC2`,
          metrics_collected: {
            cpu: {
              measurement: ['cpu_usage_idle', 'cpu_usage_iowait', 'cpu_usage_user', 'cpu_usage_system'],
              metrics_collection_interval: 60,
              totalcpu: false
            },
            disk: {
              measurement: ['used_percent'],
              metrics_collection_interval: 60,
              resources: ['*']
            },
            diskio: {
              measurement: ['io_time'],
              metrics_collection_interval: 60,
              resources: ['*']
            },
            mem: {
              measurement: ['mem_used_percent'],
              metrics_collection_interval: 60
            },
            netstat: {
              measurement: ['tcp_established', 'tcp_time_wait'],
              metrics_collection_interval: 60
            },
            swap: {
              measurement: ['swap_used_percent'],
              metrics_collection_interval: 60
            }
          }
        }
      }, null, 2),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    return new ec2.Instance(this, `${props.projectName}-EC2-${props.region}`, {
      instanceName: `${props.projectName}-Instance-${props.region}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData,
      detailedMonitoring: true, // Enable detailed monitoring
    });
  }

  private createOutputs(props: SecureInfraStackProps): void {
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${props.projectName}-VPC-${props.region}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.s3Bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `${props.projectName}-S3Bucket-${props.region}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
      exportName: `${props.projectName}-Lambda-${props.region}`,
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: this.rdsInstance.instanceEndpoint.hostname,
      description: 'RDS Instance Endpoint',
      exportName: `${props.projectName}-RDS-${props.region}`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID',
      exportName: `${props.projectName}-KMS-${props.region}`,
    });
  }
}

// CDK App class for multi-region deployment
class SecureInfrastructureApp extends cdk.App {
  constructor() {
    super();

    const projectName = 'SecureInfra';
    const environment = 'dev';
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];

    // Deploy to multiple regions
    regions.forEach(region => {
      new TapStack(this, `${projectName}-Stack-${region}`, {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: region,
        },
        region: region,
        environment: environment,
        projectName: projectName,
        description: `Secure infrastructure stack for ${projectName} in ${region}`,
        tags: {
          Project: projectName,
          Environment: environment,
          Region: region,
          ManagedBy: 'CDK',
        },
      });
    });
  }
}

// Instantiate and run the app
new SecureInfrastructureApp();
