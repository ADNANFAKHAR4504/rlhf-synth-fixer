# Secure Production Environment Infrastructure Response

I'll help you create a comprehensive secure production environment on AWS using CDK TypeScript. This infrastructure includes EC2 instances (t3.medium), RDS databases, S3 storage buckets, Application Load Balancer, and all required security controls with AWS Application Signals monitoring, Lambda Powertools v2 for enhanced observability, Amazon VPC Lattice for service-to-service communication, and proper high availability across two availability zones.

## bin/tap.ts
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'synthtrainr239';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  environmentSuffix: environmentSuffix,
});
```

## lib/tap-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as applicationSignals from 'aws-cdk-lib/aws-applicationinsights';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props or environment variable
    const environmentSuffix =
      props?.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'synthtrainr239';

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'ProductionKMSKey', {
      description: 'KMS key for production environment encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    
    kmsKey.addAlias(`alias/production-key-${environmentSuffix}`);
    cdk.Tags.of(kmsKey).add('Environment', 'Production');

    // VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, 'ProductionVPC', {
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });
    cdk.Tags.of(vpc).add('Environment', 'Production');

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/ec2/production-app-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    cdk.Tags.of(logGroup).add('Environment', 'Production');

    // Application Load Balancer Security Group
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });
    
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // EC2 Security Group
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // RDS Security Group
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2 instances'
    );

    // Apply tags to security groups
    cdk.Tags.of(albSecurityGroup).add('Environment', 'Production');
    cdk.Tags.of(ec2SecurityGroup).add('Environment', 'Production');
    cdk.Tags.of(rdsSecurityGroup).add('Environment', 'Production');

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
              ],
              resources: [
                `arn:aws:s3:::production-app-bucket-${environmentSuffix}-*/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ],
              resources: [
                `arn:aws:ssm:${this.region}:${this.account}:parameter/production-${environmentSuffix}/*`,
              ],
            }),
          ],
        }),
      },
    });
    cdk.Tags.of(ec2Role).add('Environment', 'Production');

    // Instance Profile
    const instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // User Data Script
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Production Web Server</h1>" > /var/www/html/index.html',
      // CloudWatch Agent configuration
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        agent: {
          metrics_collection_interval: 60,
          run_as_user: "cwagent"
        },
        logs: {
          logs_collected: {
            files: {
              collect_list: [
                {
                  file_path: "/var/log/httpd/access_log",
                  log_group_name: logGroup.logGroupName,
                  log_stream_name: "{instance_id}/httpd/access_log"
                }
              ]
            }
          }
        },
        metrics: {
          namespace: "Production/Application",
          metrics_collected: {
            cpu: {
              measurement: ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
              metrics_collection_interval: 60
            },
            disk: {
              measurement: ["used_percent"],
              metrics_collection_interval: 60,
              resources: ["*"]
            },
            mem: {
              measurement: ["mem_used_percent"],
              metrics_collection_interval: 60
            }
          }
        }
      }, null, 2),
      'EOF',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Launch Template with encrypted EBS
    const launchTemplate = new ec2.LaunchTemplate(this, 'ProductionLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData,
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            kmsKey: kmsKey,
            deleteOnTermination: true,
          }),
        },
      ],
    });
    cdk.Tags.of(launchTemplate).add('Environment', 'Production');

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ProductionALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });
    cdk.Tags.of(alb).add('Environment', 'Production');

    // Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, 'ProductionASG', {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
    });

    // Auto Scaling Policy - Scale on CPU > 70%
    asg.scaleOnCpuUtilization('CPUScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(5),
    });
    
    cdk.Tags.of(asg).add('Environment', 'Production');

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'ProductionTargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [asg],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        path: '/index.html',
        protocol: elbv2.Protocol.HTTP,
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        timeout: cdk.Duration.seconds(10),
        interval: cdk.Duration.seconds(30),
      },
    });
    cdk.Tags.of(targetGroup).add('Environment', 'Production');

    // ALB Listener
    alb.addListener('HTTPListener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // Lambda Layer for Powertools
    const powertoolsLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      'PowertoolsLayer',
      `arn:aws:lambda:${this.region}:094274105915:layer:AWSLambdaPowertoolsTypeScriptV2:11`
    );

    // IAM Role for Lambda functions with enhanced permissions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
      inlinePolicies: {
        EnhancedObservability: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords',
                'ssm:GetParameter',
                'ssm:GetParameters',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
              ],
              resources: [
                `arn:aws:s3:::production-app-bucket-${environmentSuffix}-*/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'rds:DescribeDBInstances',
                'rds:Connect',
              ],
              resources: [
                `arn:aws:rds-db:${this.region}:${this.account}:dbuser:*/*`,
              ],
            }),
          ],
        }),
      },
    });
    cdk.Tags.of(lambdaRole).add('Environment', 'Production');

    // API Gateway Lambda Function with Powertools
    const apiFunction = new lambda.Function(this, 'ApiFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
const { Logger } = require('@aws-lambda-powertools/logger');
const { Tracer } = require('@aws-lambda-powertools/tracer');
const { Metrics } = require('@aws-lambda-powertools/metrics');

// Initialize Powertools
const logger = new Logger({ serviceName: 'api-service' });
const tracer = new Tracer({ serviceName: 'api-service' });
const metrics = new Metrics({ serviceName: 'api-service', namespace: 'Production/Lambda' });

exports.handler = tracer.captureAsyncLambdaHandler(async (event, context) => {
    // Add custom metrics
    metrics.addMetric('ApiInvocations', 'Count', 1);
    
    // Structured logging
    logger.info('Processing API request', {
        requestId: context.awsRequestId,
        method: event.httpMethod || 'GET',
        path: event.path || '/api',
        userAgent: event.headers?.['User-Agent'] || 'Unknown'
    });
    
    try {
        // Simulate processing
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'API Gateway with Lambda Powertools v2',
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                service: 'production-api'
            })
        };
        
        logger.info('API request processed successfully', { statusCode: 200 });
        metrics.addMetric('ApiSuccess', 'Count', 1);
        return response;
        
    } catch (error) {
        logger.error('API request failed', { error: error.message });
        metrics.addMetric('ApiErrors', 'Count', 1);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                timestamp: new Date().toISOString()
            })
        };
    } finally {
        // Publish metrics
        metrics.publishStoredMetrics();
    }
});
      `),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'api-service',
        POWERTOOLS_METRICS_NAMESPACE: 'Production/Lambda',
        LOG_LEVEL: 'INFO',
        _X_AMZN_TRACE_ID: 'Root=1-00000000-000000000000000000000000',
      },
      layers: [powertoolsLayer],
      tracing: lambda.Tracing.ACTIVE,
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ec2SecurityGroup],
    });
    cdk.Tags.of(apiFunction).add('Environment', 'Production');

    // Data Processing Lambda Function with Powertools
    const dataProcessorFunction = new lambda.Function(this, 'DataProcessorFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
const { Logger } = require('@aws-lambda-powertools/logger');
const { Tracer } = require('@aws-lambda-powertools/tracer');
const { Metrics } = require('@aws-lambda-powertools/metrics');

// Initialize Powertools with custom configuration
const logger = new Logger({ 
    serviceName: 'data-processor',
    logLevel: 'INFO'
});
const tracer = new Tracer({ serviceName: 'data-processor' });
const metrics = new Metrics({ 
    serviceName: 'data-processor', 
    namespace: 'Production/DataProcessing',
    defaultDimensions: {
        'Environment': 'Production'
    }
});

exports.handler = tracer.captureAsyncLambdaHandler(async (event, context) => {
    // Add processing metrics
    metrics.addMetric('ProcessingJobs', 'Count', 1);
    
    logger.info('Starting data processing job', {
        requestId: context.awsRequestId,
        eventType: event.eventType || 'batch-process',
        recordCount: event.records?.length || 0
    });
    
    try {
        // Create subsegment for database operations
        const subsegment = tracer.getSegment().addNewSubsegment('database-query');
        
        // Simulate data processing
        const startTime = Date.now();
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
        const processingTime = Date.now() - startTime;
        
        subsegment.close();
        
        // Log processing metrics
        logger.info('Data processing completed', {
            processingTimeMs: processingTime,
            status: 'success'
        });
        
        // Add custom metrics
        metrics.addMetric('ProcessingLatency', 'Milliseconds', processingTime);
        metrics.addMetric('ProcessingSuccess', 'Count', 1);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Data processing completed successfully',
                processingTimeMs: processingTime,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        logger.error('Data processing failed', { 
            error: error.message,
            stack: error.stack 
        });
        metrics.addMetric('ProcessingErrors', 'Count', 1);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Data processing failed',
                timestamp: new Date().toISOString()
            })
        };
    } finally {
        // Always publish metrics
        metrics.publishStoredMetrics();
    }
});
      `),
      environment: {
        POWERTOOLS_SERVICE_NAME: 'data-processor',
        POWERTOOLS_METRICS_NAMESPACE: 'Production/DataProcessing',
        LOG_LEVEL: 'INFO',
        _X_AMZN_TRACE_ID: 'Root=1-00000000-000000000000000000000000',
      },
      layers: [powertoolsLayer],
      tracing: lambda.Tracing.ACTIVE,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ec2SecurityGroup],
    });
    cdk.Tags.of(dataProcessorFunction).add('Environment', 'Production');

    // VPC Lattice Service Network
    const latticeServiceNetwork = new vpclattice.CfnServiceNetwork(this, 'ProductionServiceNetwork', {
      name: `production-service-network-${environmentSuffix}`,
      authType: 'AWS_IAM',
    });
    cdk.Tags.of(latticeServiceNetwork).add('Environment', 'Production');

    // VPC Lattice Service Network VPC Association
    const latticeVpcAssociation = new vpclattice.CfnServiceNetworkVpcAssociation(this, 'LatticeVpcAssociation', {
      serviceNetworkIdentifier: latticeServiceNetwork.attrArn,
      vpcIdentifier: vpc.vpcId,
    });

    // VPC Lattice Service for API Function
    const apiLatticeService = new vpclattice.CfnService(this, 'ApiLatticeService', {
      name: `api-service-${environmentSuffix}`,
      authType: 'AWS_IAM',
    });
    cdk.Tags.of(apiLatticeService).add('Environment', 'Production');

    // VPC Lattice Target Group for Lambda
    const apiTargetGroup = new vpclattice.CfnTargetGroup(this, 'ApiTargetGroup', {
      name: `api-targets-${environmentSuffix}`,
      type: 'LAMBDA',
      targets: [
        {
          id: apiFunction.functionArn,
        },
      ],
    });

    // VPC Lattice Service Association
    const apiServiceAssociation = new vpclattice.CfnServiceNetworkServiceAssociation(this, 'ApiServiceAssociation', {
      serviceIdentifier: apiLatticeService.attrArn,
      serviceNetworkIdentifier: latticeServiceNetwork.attrArn,
    });

    // VPC Lattice Listener for API Service
    const apiListener = new vpclattice.CfnListener(this, 'ApiListener', {
      serviceIdentifier: apiLatticeService.attrArn,
      protocol: 'HTTPS',
      port: 443,
      defaultAction: {
        forward: {
          targetGroups: [
            {
              targetGroupIdentifier: apiTargetGroup.attrArn,
              weight: 100,
            },
          ],
        },
      },
    });

    // Lambda Resource Policy for VPC Lattice
    apiFunction.addPermission('AllowVpcLatticeInvoke', {
      principal: new iam.ServicePrincipal('vpc-lattice.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });

    dataProcessorFunction.addPermission('AllowVpcLatticeInvokeProcessor', {
      principal: new iam.ServicePrincipal('vpc-lattice.amazonaws.com'),
      action: 'lambda:InvokeFunction',
    });

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });
    cdk.Tags.of(dbSubnetGroup).add('Environment', 'Production');

    // RDS Database Instance with Multi-AZ
    const database = new rds.DatabaseInstance(this, 'ProductionDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        secretName: `production-db-credentials-${environmentSuffix}`,
      }),
      vpc,
      securityGroups: [rdsSecurityGroup],
      subnetGroup: dbSubnetGroup,
      multiAz: true,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: true,
      autoMinorVersionUpgrade: true,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      allowMajorVersionUpgrade: false,
      deleteAutomatedBackups: false,
    });
    cdk.Tags.of(database).add('Environment', 'Production');

    // S3 Bucket with encryption
    const s3Bucket = new s3.Bucket(this, 'ProductionAppBucket', {
      bucketName: `production-app-bucket-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    cdk.Tags.of(s3Bucket).add('Environment', 'Production');

    // Systems Manager Parameters
    const dbEndpointParameter = new ssm.StringParameter(this, 'DBEndpointParameter', {
      parameterName: `/production-${environmentSuffix}/database/endpoint`,
      stringValue: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint for production environment',
    });

    const s3BucketParameter = new ssm.StringParameter(this, 'S3BucketParameter', {
      parameterName: `/production-${environmentSuffix}/s3bucket/name`,
      stringValue: s3Bucket.bucketName,
      description: 'S3 bucket name for production environment',
    });

    cdk.Tags.of(dbEndpointParameter).add('Environment', 'Production');
    cdk.Tags.of(s3BucketParameter).add('Environment', 'Production');

    // CloudWatch Alarms
    const cpuAlarm = new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      metric: asg.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    cdk.Tags.of(cpuAlarm).add('Environment', 'Production');

    const databaseCpuAlarm = new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      metric: database.metricCpuUtilization(),
      threshold: 75,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    cdk.Tags.of(databaseCpuAlarm).add('Environment', 'Production');

    // CloudWatch Synthetics Canary for endpoint monitoring
    const canaryRole = new iam.Role(this, 'CanaryRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchSyntheticsExecutionRolePolicy'),
      ],
    });

    const syntheticsCanary = new synthetics.Canary(this, 'ProductionCanary', {
      canaryName: `production-endpoint-canary-${environmentSuffix}`,
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(5)),
      test: synthetics.Test.custom({
        code: synthetics.Code.fromInline(`
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');
const syntheticsConfiguration = synthetics.getConfiguration();

const checkEndpoint = async function () {
    return await synthetics.executeStep('checkEndpoint', async function () {
        const options = {
            hostname: '${alb.loadBalancerDnsName}',
            method: 'GET',
            path: '/',
            port: 80
        };
        
        const response = await synthetics.makeRequest(options);
        log.info('Response status: ' + response.statusCode);
        
        if (response.statusCode !== 200) {
            throw new Error('Failed to load page');
        }
        
        return response;
    });
};

exports.handler = async () => {
    return await synthetics.executeStep('canary', async function () {
        await checkEndpoint();
    });
};
        `),
        handler: 'index.handler',
      }),
      runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_9,
      role: canaryRole,
    });
    cdk.Tags.of(syntheticsCanary).add('Environment', 'Production');

    // Application Signals - Application Insights
    const appInsights = new applicationSignals.CfnApplication(this, 'ProductionAppInsights', {
      resourceGroupName: `production-application-resources-${environmentSuffix}`,
      autoConfigurationEnabled: true,
      cweMonitorEnabled: true,
      autoCreate: true,
    });
    cdk.Tags.of(appInsights).add('Environment', 'Production');

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 bucket name for application storage',
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for the production environment',
    });

    new cdk.CfnOutput(this, 'ApiLambdaFunctionArn', {
      value: apiFunction.functionArn,
      description: 'ARN of the API Lambda function with Powertools',
    });

    new cdk.CfnOutput(this, 'DataProcessorFunctionArn', {
      value: dataProcessorFunction.functionArn,
      description: 'ARN of the data processor Lambda function with Powertools',
    });

    new cdk.CfnOutput(this, 'VpcLatticeServiceNetworkArn', {
      value: latticeServiceNetwork.attrArn,
      description: 'ARN of the VPC Lattice service network',
    });

    new cdk.CfnOutput(this, 'VpcLatticeServiceArn', {
      value: apiLatticeService.attrArn,
      description: 'ARN of the VPC Lattice API service',
    });
  }
}
```

## package.json
```json
{
  "name": "tap-stack",
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
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.121.1",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.121.1",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21",
    "@aws-lambda-powertools/logger": "^2.0.0",
    "@aws-lambda-powertools/tracer": "^2.0.0",
    "@aws-lambda-powertools/metrics": "^2.0.0"
  }
}
```

## cdk.json
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
    "@aws-cdk/core:target=aws-cdk-lib": true,
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:enableStackNameDuplicatesContext": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfiguration": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-s3:autoDeleteObjects": true,
    "@aws-cdk/aws-codebuild:isReportsGroupResourcePolicyRequired": true,
    "@aws-cdk/aws-s3:enforceSSL": true
  }
}
```

## tsconfig.json
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
    ]
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
```

This comprehensive infrastructure provides:

1. **Security**: KMS encryption, IAM roles with least privilege, security groups with restricted access, VPC Lattice IAM-based authentication
2. **High Availability**: Multi-AZ VPC, RDS Multi-AZ deployment, Auto Scaling across AZs
3. **Scalability**: Auto Scaling Group with CPU-based scaling at 70% threshold
4. **Monitoring**: CloudWatch Logs, Alarms, Application Signals, Synthetics canaries
5. **Storage**: Encrypted EBS volumes, encrypted S3 bucket, encrypted RDS storage
6. **Compliance**: All resources tagged with 'Environment:Production', secure parameter store
7. **Enhanced Observability**: AWS Lambda Powertools v2 for structured logging, distributed tracing, and custom metrics
8. **Service Communication**: Amazon VPC Lattice for secure service-to-service communication without traditional load balancers
9. **Latest Features**: Application Signals for automatic monitoring, CloudWatch Synthetics for endpoint monitoring, Lambda Powertools v2 for production-ready observability

The infrastructure follows AWS Well-Architected Framework principles and implements production-ready security best practices with cutting-edge AWS services from 2024.