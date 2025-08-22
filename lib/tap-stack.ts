/* eslint-disable prettier/prettier */
/**
 * TapStack: A comprehensive multi-environment AWS infrastructure stack
 *
 * This stack implements AWS best practices for multi-environment deployments including:
 * - Nested stack organization through ComponentResources
 * - Multi-region deployment support
 * - Comprehensive security with IAM least privilege
 * - Monitoring and compliance through CloudWatch, CloudTrail, and VPC Flow Logs
 * - Environment-specific configuration management
 * - Consistent tagging strategies
 */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface TapStackArgs {
  tags: Record<string, string>;
  environment?: string;
  regions?: string[];
  enableMultiAccount?: boolean;
}

export class TapStack extends pulumi.ComponentResource {
  // Core Infrastructure Outputs
  public readonly vpc: aws.ec2.Vpc;
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly cloudTrailBucket: aws.s3.Bucket;
  public readonly parameterStorePrefix: pulumi.Output<string>;

  // Security Outputs
  public readonly cloudTrailRole: aws.iam.Role;
  public readonly deploymentRole: aws.iam.Role;

  // Monitoring Outputs
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly alarmTopic: aws.sns.Topic;
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly vpcFlowLogsRole: aws.iam.Role;
  public readonly vpcFlowLogs: aws.ec2.FlowLog;

  // StackSet Outputs
  public readonly stackSetExecutionRole?: aws.iam.Role;
  public readonly stackSetAdministrationRole?: aws.iam.Role;

  private readonly config: pulumi.Config;
  private readonly defaultTags: Record<string, string>;
  private readonly environment: string;
  private readonly regions: string[];

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    this.config = new pulumi.Config();
    this.environment = args.environment || this.config.get('env') || 'dev';
    this.regions = args.regions || ['us-east-1', 'eu-west-2'];

    // Enhanced tagging strategy
    this.defaultTags = {
      ...args.tags,
      Project: 'IaC-AWS-Nova-Model-Breaking',
      ManagedBy: 'Pulumi',
      Environment: this.environment,
      DeploymentTime: new Date().toISOString(),
      Version: this.config.get('version') || '1.0.0',
    };

    // 1. Core Networking Infrastructure
    const networkResources = this.createVPC();
    this.vpc = networkResources.vpc;
    this.internetGateway = networkResources.igw;

    const subnets = this.createSubnets();
    this.privateSubnets = subnets.private;
    this.publicSubnets = subnets.public;

    // 2. Security Infrastructure
    const securityResources = this.createSecurityInfrastructure();
    this.cloudTrailRole = securityResources.cloudTrailRole;
    this.deploymentRole = securityResources.deploymentRole;

    // 3. Storage Infrastructure
    const storageResources = this.createStorageInfrastructure();
    this.cloudTrailBucket = storageResources.cloudTrailBucket;

    // 4. Parameter Store Configuration
    this.parameterStorePrefix = this.createParameterStore();

    // 5. Monitoring and Compliance
    const monitoringResources = this.createMonitoringInfrastructure();
    this.logGroup = monitoringResources.logGroup;
    this.alarmTopic = monitoringResources.alarmTopic;
    this.dashboard = monitoringResources.dashboard;

    // 6. CloudTrail Implementation
    this.createCloudTrail();

    // 7. VPC Flow Logs for compliance monitoring (instead of AWS Config)
    const flowLogsResources = this.createVPCFlowLogs();
    this.vpcFlowLogsRole = flowLogsResources.role;
    this.vpcFlowLogs = flowLogsResources.flowLogs;

    // 8. StackSet Infrastructure (if multi-account enabled)
    if (args.enableMultiAccount) {
      const stackSetResources = this.createStackSetInfrastructure();
      this.stackSetExecutionRole = stackSetResources.executionRole;
      this.stackSetAdministrationRole = stackSetResources.administrationRole;
    }

    // 9. CloudWatch Alarms and Monitoring
    this.createCloudWatchAlarms();

    // 10. Enhanced Security Monitoring
    this.createSecurityMonitoring();

    this.registerOutputs({
      vpcId: this.vpc.id,
      internetGatewayId: this.internetGateway.id,
      privateSubnetIds: pulumi.all(this.privateSubnets.map(s => s.id)),
      publicSubnetIds: pulumi.all(this.publicSubnets.map(s => s.id)),
      cloudTrailBucketName: this.cloudTrailBucket.bucket,
      parameterStorePrefix: this.parameterStorePrefix,
      vpcFlowLogsId: this.vpcFlowLogs.id,
      environment: this.environment,
      regions: this.regions,
    });
  }

  private createVPC(): { vpc: aws.ec2.Vpc; igw: aws.ec2.InternetGateway } {
    const vpc = new aws.ec2.Vpc(
      `${this.environment}-vpc`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...this.defaultTags,
          Name: `${this.environment}-vpc`,
          Type: 'Network',
        },
      },
      { parent: this }
    );

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `${this.environment}-igw`,
      {
        vpcId: vpc.id,
        tags: {
          ...this.defaultTags,
          Name: `${this.environment}-igw`,
        },
      },
      { parent: this }
    );

    return { vpc, igw };
  }

  private createSubnets(): {
    private: aws.ec2.Subnet[];
    public: aws.ec2.Subnet[];
  } {
    const availabilityZones = aws.getAvailabilityZones({ state: 'available' });

    const privateSubnets: aws.ec2.Subnet[] = [];
    const publicSubnets: aws.ec2.Subnet[] = [];

    // Create subnets in first 3 AZs
    for (let i = 0; i < 3; i++) {
      // Public Subnet
      const publicSubnet = new aws.ec2.Subnet(
        `${this.environment}-public-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i * 2 + 1}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            ...this.defaultTags,
            Name: `${this.environment}-public-${i}`,
            Type: 'Public',
            Tier: 'Web',
          },
        },
        { parent: this }
      );

      // Private Subnet
      const privateSubnet = new aws.ec2.Subnet(
        `${this.environment}-private-${i}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i * 2 + 2}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          tags: {
            ...this.defaultTags,
            Name: `${this.environment}-private-${i}`,
            Type: 'Private',
            Tier: 'Application',
          },
        },
        { parent: this }
      );

      publicSubnets.push(publicSubnet);
      privateSubnets.push(privateSubnet);

      // NAT Gateway for private subnet internet access
      const eip = new aws.ec2.Eip(
        `${this.environment}-nat-eip-${i}`,
        {
          domain: 'vpc',
          tags: {
            ...this.defaultTags,
            Name: `${this.environment}-nat-eip-${i}`,
          },
        },
        { parent: this }
      );

      const natGateway = new aws.ec2.NatGateway(
        `${this.environment}-nat-${i}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnet.id,
          tags: {
            ...this.defaultTags,
            Name: `${this.environment}-nat-${i}`,
          },
        },
        { parent: this }
      );

      // Route tables
      const privateRouteTable = new aws.ec2.RouteTable(
        `${this.environment}-private-rt-${i}`,
        {
          vpcId: this.vpc.id,
          routes: [
            {
              cidrBlock: '0.0.0.0/0',
              natGatewayId: natGateway.id,
            },
          ],
          tags: {
            ...this.defaultTags,
            Name: `${this.environment}-private-rt-${i}`,
          },
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `${this.environment}-private-rta-${i}`,
        {
          subnetId: privateSubnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    }

    return { private: privateSubnets, public: publicSubnets };
  }

  private createSecurityInfrastructure() {
    // CloudTrail Service Role
    const cloudTrailRole = new aws.iam.Role(
      `${this.environment}-cloudtrail-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'cloudtrail.amazonaws.com' },
            },
          ],
        }),
        tags: this.defaultTags,
      },
      { parent: this }
    );

    // Deployment Role with least privilege
    const deploymentRole = new aws.iam.Role(
      `${this.environment}-deployment-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Condition: {
                StringEquals: {
                  'aws:RequestedRegion': this.regions,
                },
              },
            },
          ],
        }),
        tags: this.defaultTags,
      },
      { parent: this }
    );

    // Deployment policy with least privilege
    const deploymentPolicy = new aws.iam.Policy(
      `${this.environment}-deployment-policy`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParametersByPath',
              ],
              Resource: `arn:aws:ssm:*:*:parameter/${this.environment}/*`,
            },
            {
              Effect: 'Allow',
              Action: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: '*',
            },
          ],
        }),
        tags: this.defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${this.environment}-deployment-policy-attachment`,
      {
        role: deploymentRole.name,
        policyArn: deploymentPolicy.arn,
      },
      { parent: this }
    );

    return { cloudTrailRole, deploymentRole };
  }

  private createStorageInfrastructure() {
    // CloudTrail S3 Bucket with forceDestroy enabled
    const cloudTrailBucket = new aws.s3.Bucket(
      `${this.environment}-cloudtrail-logs`,
      {
        bucket: `${this.environment}-cloudtrail-logs-${Date.now()}`,
        forceDestroy: true, // This automatically deletes all objects and versions before deleting the bucket
        tags: this.defaultTags,
      },
      { parent: this }
    );

    // CloudTrail bucket policy
    new aws.s3.BucketPolicy(
      `${this.environment}-cloudtrail-bucket-policy`,
      {
        bucket: cloudTrailBucket.id,
        policy: pulumi.all([cloudTrailBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AWSCloudTrailAclCheck',
                Effect: 'Allow',
                Principal: { Service: 'cloudtrail.amazonaws.com' },
                Action: 's3:GetBucketAcl',
                Resource: bucketArn,
              },
              {
                Sid: 'AWSCloudTrailWrite',
                Effect: 'Allow',
                Principal: { Service: 'cloudtrail.amazonaws.com' },
                Action: 's3:PutObject',
                Resource: `${bucketArn}/*`,
                Condition: {
                  StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Enable bucket versioning and encryption
    new aws.s3.BucketVersioning(
      `${this.environment}-cloudtrail-versioning`,
      {
        bucket: cloudTrailBucket.id,
        versioningConfiguration: { status: 'Enabled' },
      },
      { parent: this }
    );

    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${this.environment}-cloudtrail-encryption`,
      {
        bucket: cloudTrailBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    // Block public access to ensure security
    new aws.s3.BucketPublicAccessBlock(
      `${this.environment}-cloudtrail-public-access-block`,
      {
        bucket: cloudTrailBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    return { cloudTrailBucket };
  }

  private createParameterStore(): pulumi.Output<string> {
    const prefix = `/${this.environment}`;

    // Environment-specific parameters
    const parameters = [
      { name: 'vpc-id', value: this.vpc.id },
      {
        name: 'region',
        value: pulumi.output(aws.getRegion().then(r => r.name)),
      },
      { name: 'environment', value: pulumi.output(this.environment) },
      {
        name: 'deployment-time',
        value: pulumi.output(new Date().toISOString()),
      },
    ];

    parameters.forEach(param => {
      new aws.ssm.Parameter(
        `${this.environment}-param-${param.name}`,
        {
          name: `${prefix}/${param.name}`,
          type: 'String',
          value: param.value,
          description: `${param.name} for ${this.environment} environment`,
          tags: this.defaultTags,
        },
        { parent: this }
      );
    });

    return pulumi.output(prefix);
  }

  private createMonitoringInfrastructure() {
    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `${this.environment}-logs`,
      {
        name: `/aws/infrastructure/${this.environment}`,
        retentionInDays: this.environment === 'prod' ? 90 : 30,
        tags: this.defaultTags,
      },
      { parent: this }
    );

    // SNS Topic for Alarms
    const alarmTopic = new aws.sns.Topic(
      `${this.environment}-alarms`,
      {
        name: `${this.environment}-infrastructure-alarms`,
        tags: this.defaultTags,
      },
      { parent: this }
    );

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `${this.environment}-dashboard`,
      {
        dashboardName: `${this.environment}-Infrastructure-Dashboard`,
        dashboardBody: pulumi.output(
          aws.getRegion().then(region =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  x: 0,
                  y: 0,
                  width: 12,
                  height: 6,
                  properties: {
                    metrics: [
                      ['AWS/VPC', 'PacketDropCount', 'VPC', this.vpc.id],
                      [
                        'AWS/CloudTrail',
                        'DataEvents',
                        'TrailName',
                        `${this.environment}-audit-trail`,
                      ],
                    ],
                    view: 'timeSeries',
                    stacked: false,
                    region: region.name,
                    title: 'Infrastructure Metrics',
                    period: 300,
                  },
                },
                {
                  type: 'log',
                  x: 0,
                  y: 6,
                  width: 24,
                  height: 6,
                  properties: {
                    query:
                      'SOURCE \'/aws/vpc/flowlogs\'\n| fields @timestamp, srcaddr, dstaddr, action\n| filter action = "REJECT"\n| stats count() by srcaddr\n| sort count desc\n| limit 20',
                    region: region.name,
                    title: 'Top Rejected IPs',
                    view: 'table',
                  },
                },
              ],
            })
          )
        ),
      },
      { parent: this }
    );

    return { logGroup, alarmTopic, dashboard };
  }

  private createCloudTrail() {
    new aws.cloudtrail.Trail(
      `${this.environment}-cloudtrail`,
      {
        name: `${this.environment}-audit-trail`,
        s3BucketName: this.cloudTrailBucket.bucket,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableLogging: true,
        // Remove eventSelectors completely - CloudTrail will log all management events by default
        tags: this.defaultTags,
      },
      { parent: this }
    );
  }

  private createVPCFlowLogs(): {
    role: aws.iam.Role;
    flowLogs: aws.ec2.FlowLog;
  } {
    // VPC Flow Logs Role
    const vpcFlowLogsRole = new aws.iam.Role(
      `${this.environment}-vpc-flow-logs-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
            },
          ],
        }),
        tags: this.defaultTags,
      },
      { parent: this }
    );

    // VPC Flow Logs Policy
    const vpcFlowLogsPolicy = new aws.iam.Policy(
      `${this.environment}-vpc-flow-logs-policy`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              Resource: '*',
            },
          ],
        }),
        tags: this.defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${this.environment}-vpc-flow-logs-policy-attachment`,
      {
        role: vpcFlowLogsRole.name,
        policyArn: vpcFlowLogsPolicy.arn,
      },
      { parent: this }
    );

    // VPC Flow Logs Log Group
    const flowLogsGroup = new aws.cloudwatch.LogGroup(
      `${this.environment}-vpc-flow-logs`,
      {
        name: '/aws/vpc/flowlogs',
        retentionInDays: this.environment === 'prod' ? 30 : 14,
        tags: this.defaultTags,
      },
      { parent: this }
    );

    const vpcFlowLogs = new aws.ec2.FlowLog(
      `${this.environment}-vpc-flow-logs`,
      {
        iamRoleArn: vpcFlowLogsRole.arn,
        logDestination: flowLogsGroup.arn,
        logDestinationType: 'cloud-watch-logs',
        trafficType: 'ALL',
        vpcId: this.vpc.id,
        tags: this.defaultTags,
      },
      { parent: this }
    );

    return { role: vpcFlowLogsRole, flowLogs: vpcFlowLogs };
  }

  private createStackSetInfrastructure() {
    // StackSet Administration Role
    const administrationRole = new aws.iam.Role(
      `${this.environment}-stackset-admin-role`,
      {
        name: `${this.environment}-AWSCloudFormationStackSetAdministrationRole`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'cloudformation.amazonaws.com' },
            },
          ],
        }),
        tags: this.defaultTags,
      },
      { parent: this }
    );

    // StackSet Execution Role
    const executionRole = new aws.iam.Role(
      `${this.environment}-stackset-exec-role`,
      {
        name: `${this.environment}-AWSCloudFormationStackSetExecutionRole`,
        assumeRolePolicy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Action": "sts:AssumeRole",
          "Effect": "Allow",
          "Principal": { "AWS": "${administrationRole.arn}" }
        }]
      }`,
        managedPolicyArns: ['arn:aws:iam::aws:policy/PowerUserAccess'],
        tags: this.defaultTags,
      },
      { parent: this }
    );

    // StackSet Administration Policy
    const adminPolicy = new aws.iam.Policy(
      `${this.environment}-stackset-admin-policy`,
      {
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['sts:AssumeRole', 'cloudformation:*', 'iam:PassRole'],
              Resource: '*',
            },
          ],
        }),
        tags: this.defaultTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${this.environment}-stackset-admin-attachment`,
      {
        role: administrationRole.name,
        policyArn: adminPolicy.arn,
      },
      { parent: this }
    );

    return { administrationRole, executionRole };
  }

  private createCloudWatchAlarms() {
    // VPC Flow Logs Alarm for security monitoring
    new aws.cloudwatch.MetricAlarm(
      `${this.environment}-vpc-reject-alarm`,
      {
        name: `${this.environment}-vpc-high-rejects`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'PacketDropCount',
        namespace: 'AWS/VPC',
        period: 300,
        statistic: 'Sum',
        threshold: 100,
        alarmDescription: 'High number of rejected packets in VPC',
        alarmActions: [this.alarmTopic.arn],
        dimensions: {
          VPC: this.vpc.id,
        },
        tags: this.defaultTags,
      },
      { parent: this }
    );

    // CloudTrail Error Alarm
    new aws.cloudwatch.MetricAlarm(
      `${this.environment}-cloudtrail-error-alarm`,
      {
        name: `${this.environment}-cloudtrail-errors`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'ErrorCount',
        namespace: 'AWS/CloudTrail',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'CloudTrail logging errors detected',
        alarmActions: [this.alarmTopic.arn],
        tags: this.defaultTags,
      },
      { parent: this }
    );

    // S3 Bucket Security Alarm
    new aws.cloudwatch.MetricAlarm(
      `${this.environment}-s3-public-access-alarm`,
      {
        name: `${this.environment}-s3-public-access-attempts`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: '4xxError',
        namespace: 'AWS/S3',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription:
          'High number of S3 access denied errors - potential security issue',
        alarmActions: [this.alarmTopic.arn],
        dimensions: {
          BucketName: this.cloudTrailBucket.bucket,
        },
        tags: this.defaultTags,
      },
      { parent: this }
    );
  }

  private createSecurityMonitoring() {
    // Custom CloudWatch Metric Filters for security monitoring
    new aws.cloudwatch.LogMetricFilter(
      `${this.environment}-root-login-filter`,
      {
        name: `${this.environment}-root-login-attempts`,
        logGroupName: this.logGroup.name,
        pattern:
          '{ ($.userIdentity.type = "Root") && ($.userIdentity.invokedBy NOT EXISTS) && ($.eventType != "AwsServiceEvent") }',
        metricTransformation: {
          name: 'RootLoginAttempts',
          namespace: `${this.environment}/Security`,
          value: '1',
          defaultValue: '0',
        },
      },
      { parent: this }
    );

    // Root Login Alarm
    new aws.cloudwatch.MetricAlarm(
      `${this.environment}-root-login-alarm`,
      {
        name: `${this.environment}-root-login-detected`,
        comparisonOperator: 'GreaterThanOrEqualToThreshold',
        evaluationPeriods: 1,
        metricName: 'RootLoginAttempts',
        namespace: `${this.environment}/Security`,
        period: 300,
        statistic: 'Sum',
        threshold: 1,
        alarmDescription: 'Root account login detected',
        alarmActions: [this.alarmTopic.arn],
        tags: this.defaultTags,
      },
      { parent: this }
    );

    // Unauthorized API Calls Filter
    new aws.cloudwatch.LogMetricFilter(
      `${this.environment}-unauthorized-api-filter`,
      {
        name: `${this.environment}-unauthorized-api-calls`,
        logGroupName: this.logGroup.name,
        pattern:
          '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }',
        metricTransformation: {
          name: 'UnauthorizedApiCalls',
          namespace: `${this.environment}/Security`,
          value: '1',
          defaultValue: '0',
        },
      },
      { parent: this }
    );

    // Unauthorized API Calls Alarm
    new aws.cloudwatch.MetricAlarm(
      `${this.environment}-unauthorized-api-alarm`,
      {
        name: `${this.environment}-unauthorized-api-calls`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'UnauthorizedApiCalls',
        namespace: `${this.environment}/Security`,
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'High number of unauthorized API calls detected',
        alarmActions: [this.alarmTopic.arn],
        tags: this.defaultTags,
      },
      { parent: this }
    );
  }
}

