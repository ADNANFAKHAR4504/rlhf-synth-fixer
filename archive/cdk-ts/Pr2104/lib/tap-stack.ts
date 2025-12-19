import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const commonTags = {
      Environment: 'production',
      Project: 'tap',
      Owner: 'devops-team',
    };

    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      description: 'KMS key for TAP stack encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Enable complete cleanup
    });

    cdk.Tags.of(kmsKey).add('Environment', commonTags.Environment);
    cdk.Tags.of(kmsKey).add('Project', commonTags.Project);
    cdk.Tags.of(kmsKey).add('Owner', commonTags.Owner);

    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 2,
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
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

    cdk.Tags.of(vpc).add('Environment', commonTags.Environment);
    cdk.Tags.of(vpc).add('Project', commonTags.Project);
    cdk.Tags.of(vpc).add('Owner', commonTags.Owner);

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: false,
    });

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

    cdk.Tags.of(ec2SecurityGroup).add('Environment', commonTags.Environment);
    cdk.Tags.of(ec2SecurityGroup).add('Project', commonTags.Project);
    cdk.Tags.of(ec2SecurityGroup).add('Owner', commonTags.Owner);

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from EC2'
    );

    cdk.Tags.of(rdsSecurityGroup).add('Environment', commonTags.Environment);
    cdk.Tags.of(rdsSecurityGroup).add('Project', commonTags.Project);
    cdk.Tags.of(rdsSecurityGroup).add('Owner', commonTags.Owner);

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: false,
      }
    );

    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound'
    );

    cdk.Tags.of(lambdaSecurityGroup).add('Environment', commonTags.Environment);
    cdk.Tags.of(lambdaSecurityGroup).add('Project', commonTags.Project);
    cdk.Tags.of(lambdaSecurityGroup).add('Owner', commonTags.Owner);

    const ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject'],
              resources: ['arn:aws:s3:::tap-bucket-*/*'],
            }),
          ],
        }),
      },
    });

    cdk.Tags.of(ec2Role).add('Environment', commonTags.Environment);
    cdk.Tags.of(ec2Role).add('Project', commonTags.Project);
    cdk.Tags.of(ec2Role).add('Owner', commonTags.Owner);

    // Auto Scaling Group for EC2 capacity management
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'TapAutoScalingGroup',
      {
        vpc,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        minCapacity: 1,
        maxCapacity: 3,
        desiredCapacity: 1,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: autoscaling.BlockDeviceVolume.ebs(20, {
              encrypted: true,
            }),
          },
        ],
      }
    );

    cdk.Tags.of(autoScalingGroup).add('Environment', commonTags.Environment);
    cdk.Tags.of(autoScalingGroup).add('Project', commonTags.Project);
    cdk.Tags.of(autoScalingGroup).add('Owner', commonTags.Owner);

    const dbSubnetGroup = new rds.SubnetGroup(this, 'TapDbSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    cdk.Tags.of(dbSubnetGroup).add('Environment', commonTags.Environment);
    cdk.Tags.of(dbSubnetGroup).add('Project', commonTags.Project);
    cdk.Tags.of(dbSubnetGroup).add('Owner', commonTags.Owner);

    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_39,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Allow deletion for CI/CD cleanup
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Enable complete cleanup
    });

    cdk.Tags.of(database).add('Environment', commonTags.Environment);
    cdk.Tags.of(database).add('Project', commonTags.Project);
    cdk.Tags.of(database).add('Owner', commonTags.Owner);

    const bucket = new s3.Bucket(this, 'TapBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Enable complete cleanup
      autoDeleteObjects: true, // Automatically delete objects during stack deletion
    });

    cdk.Tags.of(bucket).add('Environment', commonTags.Environment);
    cdk.Tags.of(bucket).add('Project', commonTags.Project);
    cdk.Tags.of(bucket).add('Owner', commonTags.Owner);

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: ['arn:aws:logs:*:*:*'],
            }),
          ],
        }),
      },
    });

    cdk.Tags.of(lambdaRole).add('Environment', commonTags.Environment);
    cdk.Tags.of(lambdaRole).add('Project', commonTags.Project);
    cdk.Tags.of(lambdaRole).add('Owner', commonTags.Owner);

    const lambdaFunction = new lambda.Function(this, 'TapLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event));
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Hello from Lambda!' }),
          };
        };
      `),
      role: lambdaRole,
      vpc,
      securityGroups: [lambdaSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      logGroup: new logs.LogGroup(this, 'TapLambdaLogGroup', {
        retention: logs.RetentionDays.TWO_WEEKS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    cdk.Tags.of(lambdaFunction).add('Environment', commonTags.Environment);
    cdk.Tags.of(lambdaFunction).add('Project', commonTags.Project);
    cdk.Tags.of(lambdaFunction).add('Owner', commonTags.Owner);

    const webAcl = new wafv2.CfnWebACL(this, 'TapWebAcl', {
      scope: 'REGIONAL',
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

    const api = new apigateway.RestApi(this, 'TapApi', {
      restApiName: 'TAP API',
      description: 'API for TAP application',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    cdk.Tags.of(api).add('Environment', commonTags.Environment);
    cdk.Tags.of(api).add('Project', commonTags.Project);
    cdk.Tags.of(api).add('Owner', commonTags.Owner);

    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction);
    api.root.addMethod('GET', lambdaIntegration);

    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: api.deploymentStage.stageArn,
      webAclArn: webAcl.attrArn,
    });

    // CloudWatch Logs and Metrics for monitoring
    new logs.LogGroup(this, 'TapVpcFlowLogs', {
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket Lifecycle Policy for cost optimization
    bucket.addLifecycleRule({
      id: 'TransitionToIA',
      enabled: true,
      transitions: [
        {
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30),
        },
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90),
        },
      ],
    });

    // Enhanced API Gateway with throttling
    api.addUsagePlan('TapUsagePlan', {
      name: 'TAP API Usage Plan',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    // Output API endpoint for integration tests
    new cdk.CfnOutput(this, 'TapApiEndpoint', {
      value: api.url,
      description: 'TAP API Gateway endpoint URL',
      exportName: `TapApiEndpoint${props?.environmentSuffix || ''}`,
    });
  }
}
