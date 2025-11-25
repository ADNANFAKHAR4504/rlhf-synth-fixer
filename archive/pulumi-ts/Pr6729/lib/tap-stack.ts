/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource for VPC Peering Infrastructure
 * Orchestrates VPC peering connection between payment and audit VPCs
 * with comprehensive security controls and monitoring
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component
 */
export interface TapStackArgs {
  /**
   * Environment suffix for resource naming (e.g., 'dev', 'prod')
   */
  environmentSuffix: string;

  /**
   * VPC ID for payment processing VPC
   */
  paymentVpcId: string;

  /**
   * VPC ID for audit logging VPC
   */
  auditVpcId: string;

  /**
   * CIDR block for payment VPC (e.g., 10.100.0.0/16)
   */
  paymentVpcCidr: string;

  /**
   * CIDR block for audit VPC (e.g., 10.200.0.0/16)
   */
  auditVpcCidr: string;

  /**
   * AWS account ID for payment account
   */
  paymentAccountId: string;

  /**
   * AWS account ID for audit account
   */
  auditAccountId: string;

  /**
   * Environment name (dev/staging/prod)
   */
  environment: string;

  /**
   * Data classification tag (default: Sensitive)
   */
  dataClassification?: string;

  /**
   * S3 lifecycle retention for flow logs (default: 90 days)
   */
  flowLogsRetentionDays?: number;

  /**
   * Optional default tags to apply to resources
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * TapStack outputs for verification and downstream use
 */
export interface TapStackOutputs {
  peeringConnectionId: pulumi.Output<string>;
  paymentRouteTableIds: pulumi.Output<string[]>;
  auditRouteTableIds: pulumi.Output<string[]>;
  flowLogsBucketName: pulumi.Output<string>;
  peeringStatusAlarmArn: pulumi.Output<string>;
  securityGroupIds: pulumi.Output<{
    paymentSecurityGroupId: string;
    auditSecurityGroupId: string;
  }>;
}

/**
 * Main TapStack component for VPC Peering Infrastructure
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly peeringConnectionId: pulumi.Output<string>;
  public readonly paymentRouteTableIds: pulumi.Output<string[]>;
  public readonly auditRouteTableIds: pulumi.Output<string[]>;
  public readonly flowLogsBucketName: pulumi.Output<string>;
  public readonly peeringStatusAlarmArn: pulumi.Output<string>;
  public readonly securityGroupIds: pulumi.Output<{
    paymentSecurityGroupId: string;
    auditSecurityGroupId: string;
  }>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix;
    const dataClassification = args.dataClassification || 'Sensitive';
    const flowLogsRetentionDays = args.flowLogsRetentionDays || 90;

    // Merge default tags with provided tags
    const defaultTags = pulumi.output(args.tags || {}).apply(tags => ({
      ...tags,
      Environment: args.environment,
      DataClassification: dataClassification,
      ManagedBy: 'Pulumi',
    }));

    // =======================
    // 1. VPC Peering Connection
    // =======================

    const peeringConnection = new aws.ec2.VpcPeeringConnection(
      `vpc-peering-${environmentSuffix}`,
      {
        vpcId: args.paymentVpcId,
        peerVpcId: args.auditVpcId,
        peerOwnerId: args.auditAccountId,
        autoAccept: args.paymentAccountId === args.auditAccountId,
        tags: defaultTags.apply(tags => ({
          ...tags,
          Name: `vpc-peering-payment-audit-${environmentSuffix}`,
          BusinessUnit: 'Payment',
        })),
      },
      { parent: this }
    );

    // Configure DNS resolution options for the peering connection
    new aws.ec2.PeeringConnectionOptions(
      `vpc-peering-options-${environmentSuffix}`,
      {
        vpcPeeringConnectionId: peeringConnection.id,
        requester: {
          allowRemoteVpcDnsResolution: true,
        },
        accepter: {
          allowRemoteVpcDnsResolution: true,
        },
      },
      { parent: this, dependsOn: [peeringConnection] }
    );

    // =======================
    // 2. Route Table Configuration
    // =======================

    // Get all route tables for payment VPC
    const paymentRouteTables = aws.ec2.getRouteTablesOutput({
      filters: [
        {
          name: 'vpc-id',
          values: [args.paymentVpcId],
        },
      ],
    });

    // Get all route tables for audit VPC
    const auditRouteTables = aws.ec2.getRouteTablesOutput({
      filters: [
        {
          name: 'vpc-id',
          values: [args.auditVpcId],
        },
      ],
    });

    // Create routes from payment VPC to audit VPC
    paymentRouteTables.ids.apply(ids =>
      ids.map((routeTableId, index) => {
        return new aws.ec2.Route(
          `payment-to-audit-route-${index}-${environmentSuffix}`,
          {
            routeTableId: routeTableId,
            destinationCidrBlock: args.auditVpcCidr,
            vpcPeeringConnectionId: peeringConnection.id,
          },
          { parent: this, dependsOn: [peeringConnection] }
        );
      })
    );

    // Create routes from audit VPC to payment VPC
    auditRouteTables.ids.apply(ids =>
      ids.map((routeTableId, index) => {
        return new aws.ec2.Route(
          `audit-to-payment-route-${index}-${environmentSuffix}`,
          {
            routeTableId: routeTableId,
            destinationCidrBlock: args.paymentVpcCidr,
            vpcPeeringConnectionId: peeringConnection.id,
          },
          { parent: this, dependsOn: [peeringConnection] }
        );
      })
    );

    // =======================
    // 3. Security Groups
    // =======================

    // Security group for payment VPC
    const paymentSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-vpc-sg-${environmentSuffix}`,
      {
        name: `payment-vpc-peering-sg-${environmentSuffix}`,
        description: 'Security group for VPC peering - Payment VPC',
        vpcId: args.paymentVpcId,
        tags: defaultTags.apply(tags => ({
          ...tags,
          Name: `payment-vpc-peering-sg-${environmentSuffix}`,
          BusinessUnit: 'Payment',
        })),
      },
      { parent: this }
    );

    // Allow HTTPS ingress from audit VPC
    new aws.ec2.SecurityGroupRule(
      `payment-sg-https-ingress-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: [args.auditVpcCidr],
        securityGroupId: paymentSecurityGroup.id,
        description: 'Allow HTTPS from audit VPC',
      },
      { parent: this }
    );

    // Allow PostgreSQL ingress from audit VPC
    new aws.ec2.SecurityGroupRule(
      `payment-sg-postgres-ingress-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        cidrBlocks: [args.auditVpcCidr],
        securityGroupId: paymentSecurityGroup.id,
        description: 'Allow PostgreSQL from audit VPC',
      },
      { parent: this }
    );

    // Allow HTTPS egress to audit VPC
    new aws.ec2.SecurityGroupRule(
      `payment-sg-https-egress-${environmentSuffix}`,
      {
        type: 'egress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: [args.auditVpcCidr],
        securityGroupId: paymentSecurityGroup.id,
        description: 'Allow HTTPS to audit VPC',
      },
      { parent: this }
    );

    // Allow PostgreSQL egress to audit VPC
    new aws.ec2.SecurityGroupRule(
      `payment-sg-postgres-egress-${environmentSuffix}`,
      {
        type: 'egress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        cidrBlocks: [args.auditVpcCidr],
        securityGroupId: paymentSecurityGroup.id,
        description: 'Allow PostgreSQL to audit VPC',
      },
      { parent: this }
    );

    // Security group for audit VPC
    const auditSecurityGroup = new aws.ec2.SecurityGroup(
      `audit-vpc-sg-${environmentSuffix}`,
      {
        name: `audit-vpc-peering-sg-${environmentSuffix}`,
        description: 'Security group for VPC peering - Audit VPC',
        vpcId: args.auditVpcId,
        tags: defaultTags.apply(tags => ({
          ...tags,
          Name: `audit-vpc-peering-sg-${environmentSuffix}`,
          BusinessUnit: 'Audit',
        })),
      },
      { parent: this }
    );

    // Allow HTTPS ingress from payment VPC
    new aws.ec2.SecurityGroupRule(
      `audit-sg-https-ingress-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: [args.paymentVpcCidr],
        securityGroupId: auditSecurityGroup.id,
        description: 'Allow HTTPS from payment VPC',
      },
      { parent: this }
    );

    // Allow PostgreSQL ingress from payment VPC
    new aws.ec2.SecurityGroupRule(
      `audit-sg-postgres-ingress-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        cidrBlocks: [args.paymentVpcCidr],
        securityGroupId: auditSecurityGroup.id,
        description: 'Allow PostgreSQL from payment VPC',
      },
      { parent: this }
    );

    // Allow HTTPS egress to payment VPC
    new aws.ec2.SecurityGroupRule(
      `audit-sg-https-egress-${environmentSuffix}`,
      {
        type: 'egress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: [args.paymentVpcCidr],
        securityGroupId: auditSecurityGroup.id,
        description: 'Allow HTTPS to payment VPC',
      },
      { parent: this }
    );

    // Allow PostgreSQL egress to payment VPC
    new aws.ec2.SecurityGroupRule(
      `audit-sg-postgres-egress-${environmentSuffix}`,
      {
        type: 'egress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        cidrBlocks: [args.paymentVpcCidr],
        securityGroupId: auditSecurityGroup.id,
        description: 'Allow PostgreSQL to payment VPC',
      },
      { parent: this }
    );

    // =======================
    // 4. Network ACLs
    // =======================

    // Get default network ACL for payment VPC
    const paymentNetworkAcl = aws.ec2.getNetworkAclsOutput({
      vpcId: args.paymentVpcId,
      filters: [
        {
          name: 'default',
          values: ['true'],
        },
      ],
    });

    // Add inbound rule for HTTPS from audit VPC
    new aws.ec2.NetworkAclRule(
      `payment-nacl-https-inbound-${environmentSuffix}`,
      {
        networkAclId: paymentNetworkAcl.ids[0],
        ruleNumber: 200,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: args.auditVpcCidr,
        fromPort: 443,
        toPort: 443,
        egress: false,
      },
      { parent: this }
    );

    // Add inbound rule for PostgreSQL from audit VPC
    new aws.ec2.NetworkAclRule(
      `payment-nacl-postgres-inbound-${environmentSuffix}`,
      {
        networkAclId: paymentNetworkAcl.ids[0],
        ruleNumber: 201,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: args.auditVpcCidr,
        fromPort: 5432,
        toPort: 5432,
        egress: false,
      },
      { parent: this }
    );

    // Add outbound rule for HTTPS to audit VPC
    new aws.ec2.NetworkAclRule(
      `payment-nacl-https-outbound-${environmentSuffix}`,
      {
        networkAclId: paymentNetworkAcl.ids[0],
        ruleNumber: 200,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: args.auditVpcCidr,
        fromPort: 443,
        toPort: 443,
        egress: true,
      },
      { parent: this }
    );

    // Add outbound rule for PostgreSQL to audit VPC
    new aws.ec2.NetworkAclRule(
      `payment-nacl-postgres-outbound-${environmentSuffix}`,
      {
        networkAclId: paymentNetworkAcl.ids[0],
        ruleNumber: 201,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: args.auditVpcCidr,
        fromPort: 5432,
        toPort: 5432,
        egress: true,
      },
      { parent: this }
    );

    // Get default network ACL for audit VPC
    const auditNetworkAcl = aws.ec2.getNetworkAclsOutput({
      vpcId: args.auditVpcId,
      filters: [
        {
          name: 'default',
          values: ['true'],
        },
      ],
    });

    // Add inbound rule for HTTPS from payment VPC
    new aws.ec2.NetworkAclRule(
      `audit-nacl-https-inbound-${environmentSuffix}`,
      {
        networkAclId: auditNetworkAcl.ids[0],
        ruleNumber: 200,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: args.paymentVpcCidr,
        fromPort: 443,
        toPort: 443,
        egress: false,
      },
      { parent: this }
    );

    // Add inbound rule for PostgreSQL from payment VPC
    new aws.ec2.NetworkAclRule(
      `audit-nacl-postgres-inbound-${environmentSuffix}`,
      {
        networkAclId: auditNetworkAcl.ids[0],
        ruleNumber: 201,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: args.paymentVpcCidr,
        fromPort: 5432,
        toPort: 5432,
        egress: false,
      },
      { parent: this }
    );

    // Add outbound rule for HTTPS to payment VPC
    new aws.ec2.NetworkAclRule(
      `audit-nacl-https-outbound-${environmentSuffix}`,
      {
        networkAclId: auditNetworkAcl.ids[0],
        ruleNumber: 200,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: args.paymentVpcCidr,
        fromPort: 443,
        toPort: 443,
        egress: true,
      },
      { parent: this }
    );

    // Add outbound rule for PostgreSQL to payment VPC
    new aws.ec2.NetworkAclRule(
      `audit-nacl-postgres-outbound-${environmentSuffix}`,
      {
        networkAclId: auditNetworkAcl.ids[0],
        ruleNumber: 201,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: args.paymentVpcCidr,
        fromPort: 5432,
        toPort: 5432,
        egress: true,
      },
      { parent: this }
    );

    // =======================
    // 5. VPC Flow Logs
    // =======================

    // Create S3 bucket for VPC flow logs
    const flowLogsBucket = new aws.s3.Bucket(
      `vpc-flow-logs-${environmentSuffix}`,
      {
        bucket: `vpc-flow-logs-peering-${environmentSuffix}`,
        tags: defaultTags.apply(tags => ({
          ...tags,
          Name: `vpc-flow-logs-peering-${environmentSuffix}`,
          Purpose: 'VPC Flow Logs Storage',
        })),
      },
      { parent: this }
    );

    // Enable versioning on the bucket
    new aws.s3.BucketVersioningV2(
      `flow-logs-versioning-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Configure lifecycle policy for flow logs
    new aws.s3.BucketLifecycleConfigurationV2(
      `flow-logs-lifecycle-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        rules: [
          {
            id: `expire-after-${flowLogsRetentionDays}-days`,
            status: 'Enabled',
            expiration: {
              days: flowLogsRetentionDays,
            },
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 60,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // Block public access to the bucket
    new aws.s3.BucketPublicAccessBlock(
      `flow-logs-public-access-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Enable server-side encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `flow-logs-encryption-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Create IAM role for VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(
      `flow-logs-role-${environmentSuffix}`,
      {
        name: `vpc-flow-logs-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: defaultTags,
      },
      { parent: this }
    );

    // Attach policy to the role
    new aws.iam.RolePolicy(
      `flow-logs-policy-${environmentSuffix}`,
      {
        role: flowLogsRole.id,
        policy: pulumi.all([flowLogsBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:PutObject',
                  's3:GetObject',
                  's3:ListBucket',
                  's3:GetBucketLocation',
                ],
                Resource: [bucketArn, `${bucketArn}/*`],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create VPC flow logs for payment VPC
    new aws.ec2.FlowLog(
      `payment-vpc-flow-log-${environmentSuffix}`,
      {
        vpcId: args.paymentVpcId,
        trafficType: 'ALL',
        logDestinationType: 's3',
        logDestination: flowLogsBucket.arn,
        tags: defaultTags.apply(tags => ({
          ...tags,
          Name: `payment-vpc-flow-log-${environmentSuffix}`,
          BusinessUnit: 'Payment',
        })),
      },
      { parent: this, dependsOn: [flowLogsBucket] }
    );

    // Create VPC flow logs for audit VPC
    new aws.ec2.FlowLog(
      `audit-vpc-flow-log-${environmentSuffix}`,
      {
        vpcId: args.auditVpcId,
        trafficType: 'ALL',
        logDestinationType: 's3',
        logDestination: flowLogsBucket.arn,
        tags: defaultTags.apply(tags => ({
          ...tags,
          Name: `audit-vpc-flow-log-${environmentSuffix}`,
          BusinessUnit: 'Audit',
        })),
      },
      { parent: this, dependsOn: [flowLogsBucket] }
    );

    // =======================
    // 6. CloudWatch Monitoring
    // =======================

    // Create SNS topic for alarm notifications
    const alarmTopic = new aws.sns.Topic(
      `peering-alarms-topic-${environmentSuffix}`,
      {
        name: `vpc-peering-alarms-${environmentSuffix}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create CloudWatch alarm for peering connection status
    const peeringStatusAlarm = new aws.cloudwatch.MetricAlarm(
      `peering-status-alarm-${environmentSuffix}`,
      {
        name: `vpc-peering-status-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'StatusCheckFailed',
        namespace: 'AWS/VPCPeering',
        period: 300,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'Alerts when VPC peering connection status changes',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          VpcPeeringConnectionId: peeringConnection.id,
        },
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for metrics
    new aws.cloudwatch.LogGroup(
      `peering-metrics-log-${environmentSuffix}`,
      {
        name: `/aws/vpc-peering/${environmentSuffix}`,
        retentionInDays: 30,
        tags: defaultTags,
      },
      { parent: this }
    );

    // Create CloudWatch Dashboard
    new aws.cloudwatch.Dashboard(
      `peering-dashboard-${environmentSuffix}`,
      {
        dashboardName: `vpc-peering-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([peeringConnection.id, args.paymentVpcId, args.auditVpcId])
          .apply(([_peeringId, _paymentVpcId, _auditVpcId]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/VPC',
                        'BytesIn',
                        {
                          stat: 'Sum',
                          label: 'Bytes In',
                        },
                      ],
                      ['.', 'BytesOut', { stat: 'Sum', label: 'Bytes Out' }],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: 'us-east-1',
                    title: 'VPC Peering Traffic',
                    yAxis: {
                      left: {
                        label: 'Bytes',
                      },
                    },
                  },
                },
                {
                  type: 'log',
                  properties: {
                    query: `SOURCE '/aws/vpc-peering/${environmentSuffix}'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 20`,
                    region: 'us-east-1',
                    title: 'Recent Peering Events',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // =======================
    // 7. Resource Tagging
    // =======================
    // All resources above already include comprehensive tagging with:
    // - DataClassification (Sensitive)
    // - BusinessUnit (Payment/Audit)
    // - Environment (from args)
    // - ManagedBy (Pulumi)
    // - Name (descriptive resource name)

    // =======================
    // 8. Cross-Account Permissions
    // =======================

    // Create IAM role for cross-account VPC peering (if accounts differ)
    const crossAccountRole = pulumi
      .all([args.paymentAccountId, args.auditAccountId])
      .apply(([paymentId, auditId]) => {
        if (paymentId !== auditId) {
          return new aws.iam.Role(
            `cross-account-peering-role-${environmentSuffix}`,
            {
              name: `vpc-peering-cross-account-${environmentSuffix}`,
              assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Principal: {
                      AWS: `arn:aws:iam::${auditId}:root`,
                    },
                    Action: 'sts:AssumeRole',
                    Condition: {
                      StringEquals: {
                        'sts:ExternalId': `vpc-peering-${environmentSuffix}`,
                      },
                    },
                  },
                ],
              }),
              tags: defaultTags,
            },
            { parent: this }
          );
        }
        return undefined;
      });

    // Attach policy for cross-account peering permissions
    pulumi
      .all([crossAccountRole, args.paymentAccountId, args.auditAccountId])
      .apply(([role, paymentId, auditId]) => {
        if (role && paymentId !== auditId) {
          return new aws.iam.RolePolicy(
            `cross-account-peering-policy-${environmentSuffix}`,
            {
              role: role.id,
              policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: [
                      'ec2:AcceptVpcPeeringConnection',
                      'ec2:DescribeVpcPeeringConnections',
                      'ec2:CreateRoute',
                      'ec2:DeleteRoute',
                      'ec2:DescribeRouteTables',
                    ],
                    Resource: '*',
                  },
                ],
              }),
            },
            { parent: this }
          );
        }
        return undefined;
      });

    // =======================
    // Outputs
    // =======================

    this.peeringConnectionId = peeringConnection.id;
    this.paymentRouteTableIds = paymentRouteTables.ids;
    this.auditRouteTableIds = auditRouteTables.ids;
    this.flowLogsBucketName = flowLogsBucket.bucket;
    this.peeringStatusAlarmArn = peeringStatusAlarm.arn;
    this.securityGroupIds = pulumi.output({
      paymentSecurityGroupId: paymentSecurityGroup.id,
      auditSecurityGroupId: auditSecurityGroup.id,
    });

    this.registerOutputs({
      peeringConnectionId: this.peeringConnectionId,
      paymentRouteTableIds: this.paymentRouteTableIds,
      auditRouteTableIds: this.auditRouteTableIds,
      flowLogsBucketName: this.flowLogsBucketName,
      peeringStatusAlarmArn: this.peeringStatusAlarmArn,
      securityGroupIds: this.securityGroupIds,
    });
  }
}
