import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environment: string;
  owner: string;
  project: string;
  bucketNames: string[];
  enableCloudTrail?: boolean;
  vpcCidr?: string;
}

export class TapStack extends cdk.Stack {
  private readonly commonTags: { [key: string]: string };
  private readonly kmsKey: kms.Key;
  private readonly securityTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Initialize common tags for all resources
    this.commonTags = {
      Environment: props.environment,
      Owner: props.owner,
      Project: props.project,
    };

    // Create KMS key for encryption
    this.kmsKey = this.createKmsKey();

    // Create SNS topic for security notifications
    this.securityTopic = this.createSecurityTopic();

    // Create CloudWatch Log Groups with AWS default encryption
    const flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs/${this.commonTags.Project}-${this.commonTags.Environment}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // LocalStack: Allow cleanup
      // Using AWS default encryption to avoid dependency issues
    });

    const cloudTrailLogGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      logGroupName: `/aws/cloudtrail/${this.commonTags.Project}-${this.commonTags.Environment}`,
      retention: logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // LocalStack: Allow cleanup
      // Using AWS default encryption to avoid dependency issues
    });

    // Create VPC with security best practices
    const vpc = this.createVpc(props.vpcCidr || '10.0.0.0/16', flowLogGroup);

    // Create IAM roles with least privilege
    const roles = this.createIamRoles();

    // Create S3 buckets with KMS encryption
    const buckets = this.createS3Buckets(props.bucketNames);

    // Enable CloudTrail for API logging (skipped in LocalStack Community Edition - Pro only)
    // CloudTrail is a Pro feature in LocalStack, disabled by default for Community Edition compatibility
    if (
      props.enableCloudTrail === true &&
      process.env.AWS_ENDPOINT_URL === undefined
    ) {
      this.createCloudTrail(cloudTrailLogGroup);
    }

    // Apply tags to all resources in the stack
    this.applyTagsToStack();

    // Output important resource information
    this.createOutputs(vpc, roles, buckets);
  }

  private createKmsKey(): kms.Key {
    const key = new kms.Key(this, 'TapStackKmsKey', {
      description: `KMS key for ${this.commonTags.Project} ${this.commonTags.Environment} encryption`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // LocalStack: Allow cleanup
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
            sid: 'Allow CloudTrail to encrypt logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Add alias for easier management
    new kms.Alias(this, 'TapStackKmsKeyAlias', {
      aliasName: `alias/${this.commonTags.Project.toLowerCase()}-${this.commonTags.Environment.toLowerCase()}-key`,
      targetKey: key,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // LocalStack: Allow cleanup
    });

    return key;
  }

  private createSecurityTopic(): sns.Topic {
    const topic = new sns.Topic(this, 'SecurityNotificationsTopic', {
      topicName: `${this.commonTags.Project}-${this.commonTags.Environment}-security-notifications`,
      displayName: `${this.commonTags.Project} ${this.commonTags.Environment} Security Notifications`,
      masterKey: this.kmsKey,
    });

    // Add topic policy for CloudWatch Alarms and other AWS services
    topic.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudWatchAlarms',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudwatch.amazonaws.com')],
        actions: ['sns:Publish'],
        resources: [topic.topicArn],
      })
    );

    return topic;
  }

  private createVpc(cidrBlock: string, flowLogGroup: logs.LogGroup): ec2.Vpc {
    const vpc = new ec2.Vpc(this, 'TapStackVpc', {
      ipAddresses: ec2.IpAddresses.cidr(cidrBlock),
      maxAzs: 3,
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
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      gatewayEndpoints: {
        S3: {
          service: ec2.GatewayVpcEndpointAwsService.S3,
        },
        DynamoDB: {
          service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        },
      },
    });

    // Create VPC Flow Logs for security monitoring
    const flowLogRole = new iam.Role(this, 'VpcFlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        CloudWatchLogsDelivery: new iam.PolicyDocument({
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
              resources: [flowLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogGroup,
        flowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    return vpc;
  }

  private createIamRoles(): { [key: string]: iam.Role } {
    const roles: { [key: string]: iam.Role } = {};

    // Application role with minimal S3 permissions
    roles.applicationRole = new iam.Role(this, 'ApplicationRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for application instances with least privilege access',
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
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [
                `arn:aws:s3:::${this.commonTags.Project.toLowerCase()}-${this.commonTags.Environment.toLowerCase()}-*/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [
                `arn:aws:s3:::${this.commonTags.Project.toLowerCase()}-${this.commonTags.Environment.toLowerCase()}-*`,
              ],
            }),
          ],
        }),
        KMSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [this.kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Lambda execution role for serverless functions
    roles.lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role for Lambda functions with VPC and logging access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // CloudTrail role
    roles.cloudTrailRole = new iam.Role(this, 'CloudTrailRole', {
      assumedBy: new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
      description: 'Role for CloudTrail to write logs to CloudWatch',
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
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/cloudtrail/*`,
              ],
            }),
          ],
        }),
      },
    });

    return roles;
  }

  private createS3Buckets(bucketNames: string[]): s3.Bucket[] {
    const buckets: s3.Bucket[] = [];

    bucketNames.forEach((bucketName, index) => {
      const fullBucketName = `${this.commonTags.Project.toLowerCase()}-${this.commonTags.Environment.toLowerCase()}-${bucketName.toLowerCase()}`;

      const bucket = new s3.Bucket(this, `S3Bucket${index}`, {
        bucketName: fullBucketName,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: this.kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        enforceSSL: true,
        serverAccessLogsPrefix: 'access-logs/',
        removalPolicy: cdk.RemovalPolicy.DESTROY, // LocalStack: Allow cleanup
        autoDeleteObjects: true, // LocalStack: Clean up objects on delete
        lifecycleRules: [
          {
            id: 'DeleteIncompleteMultipartUploads',
            abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
            enabled: true,
          },
          {
            id: 'TransitionToIA',
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
            enabled: true,
          },
        ],
        publicReadAccess: false,
      });

      // Add bucket notification for security monitoring
      // Only add OBJECT_CREATED notification to avoid overlapping configurations
      bucket.addEventNotification(
        s3.EventType.OBJECT_CREATED,
        new s3n.SnsDestination(this.securityTopic)
      );

      buckets.push(bucket);
    });

    return buckets;
  }

  private createCloudTrail(
    cloudTrailLogGroup: logs.LogGroup
  ): cloudtrail.Trail {
    // Create S3 bucket for CloudTrail logs
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `${this.commonTags.Project.toLowerCase()}-${this.commonTags.Environment.toLowerCase()}-cloudtrail-logs`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // LocalStack: Allow cleanup
      autoDeleteObjects: true, // LocalStack: Clean up objects on delete
      lifecycleRules: [
        {
          id: 'CloudTrailLogRetention',
          expiration: cdk.Duration.days(2555), // 7 years
          enabled: true,
        },
      ],
    });

    // Create CloudTrail
    const trail = new cloudtrail.Trail(this, 'CloudTrail', {
      trailName: `${this.commonTags.Project}-${this.commonTags.Environment}-trail`,
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      encryptionKey: this.kmsKey,
      cloudWatchLogGroup: cloudTrailLogGroup,
      sendToCloudWatchLogs: true,
    });

    // Add data events for S3 buckets
    trail.addS3EventSelector([
      {
        bucket: cloudTrailBucket,
        objectPrefix: '',
      },
    ]);

    return trail;
  }

  private applyTagsToStack(): void {
    Object.entries(this.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Add additional metadata tags
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('StackName', this.stackName);
    cdk.Tags.of(this).add('Region', this.region);
  }

  private createOutputs(
    vpc: ec2.Vpc,
    roles: { [key: string]: iam.Role },
    buckets: s3.Bucket[]
  ): void {
    // VPC Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: `${this.stackName}-VpcCidr`,
    });

    // Private Subnet IDs
    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `${this.stackName}-PrivateSubnetIds`,
    });

    // Public Subnet IDs
    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `${this.stackName}-PublicSubnetIds`,
    });

    // KMS Key Output
    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `${this.stackName}-KmsKeyId`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'KMS Key ARN for encryption',
      exportName: `${this.stackName}-KmsKeyArn`,
    });

    // SNS Topic Output
    new cdk.CfnOutput(this, 'SecurityTopicArn', {
      value: this.securityTopic.topicArn,
      description: 'SNS Topic ARN for security notifications',
      exportName: `${this.stackName}-SecurityTopicArn`,
    });

    new cdk.CfnOutput(this, 'SecurityTopicName', {
      value: this.securityTopic.topicName,
      description: 'SNS Topic Name for security notifications',
      exportName: `${this.stackName}-SecurityTopicName`,
    });

    // IAM Role Outputs
    Object.entries(roles).forEach(([roleName, role]) => {
      new cdk.CfnOutput(this, `${roleName}Arn`, {
        value: role.roleArn,
        description: `${roleName} ARN`,
        exportName: `${this.stackName}-${roleName}Arn`,
      });
    });

    // S3 Bucket Outputs
    buckets.forEach((bucket, index) => {
      new cdk.CfnOutput(this, `S3Bucket${index}Name`, {
        value: bucket.bucketName,
        description: `S3 Bucket ${index} Name`,
        exportName: `${this.stackName}-S3Bucket${index}Name`,
      });

      new cdk.CfnOutput(this, `S3Bucket${index}Arn`, {
        value: bucket.bucketArn,
        description: `S3 Bucket ${index} ARN`,
        exportName: `${this.stackName}-S3Bucket${index}Arn`,
      });
    });
  }
}

// Example usage and deployment configuration
export interface DeploymentConfig {
  accounts: {
    [environment: string]: {
      accountId: string;
      region: string;
    };
  };
  bucketNames: string[];
  owner: string;
  project: string;
}

// Example deployment function
export function deployToMultipleEnvironments(
  app: cdk.App,
  config: DeploymentConfig
): void {
  Object.entries(config.accounts).forEach(([environment, accountConfig]) => {
    new TapStack(app, `TapStack-${environment}`, {
      env: {
        account: accountConfig.accountId,
        region: accountConfig.region,
      },
      environment,
      owner: config.owner,
      project: config.project,
      bucketNames: config.bucketNames,
      enableCloudTrail: true,
      vpcCidr: '10.0.0.0/16',
      stackName: `${config.project}-${environment}-stack`,
      description: `${config.project} infrastructure for ${environment} environment`,
    });
  });
}
