import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as accessanalyzer from 'aws-cdk-lib/aws-accessanalyzer';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    // LocalStack compatibility: Determine if running in LocalStack
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('localstack');

    // Create VPC with public and private subnets (reduce complexity for LocalStack)
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: isLocalStack ? 2 : 3, // Reduce to 2 AZs for LocalStack
      subnetConfiguration: isLocalStack
        ? [
            // For LocalStack: Use only public subnets (NAT Gateway not fully supported)
            {
              name: 'PublicSubnet',
              subnetType: ec2.SubnetType.PUBLIC,
              cidrMask: 24,
            },
          ]
        : [
            {
              name: 'PublicSubnet',
              subnetType: ec2.SubnetType.PUBLIC,
              cidrMask: 24,
            },
            {
              name: 'PrivateSubnet',
              subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
              cidrMask: 24,
            },
          ],
      natGateways: isLocalStack ? 0 : 3, // No NAT gateways for LocalStack (EIP issues)
      enableDnsHostnames: true,
      enableDnsSupport: true,
      restrictDefaultSecurityGroup: true,
    });

    // Create S3 VPC Endpoint for secure private access (if private subnets exist)
    if (!isLocalStack) {
      vpc.addGatewayEndpoint('S3Endpoint', {
        service: ec2.GatewayVpcEndpointAwsService.S3,
        subnets: [
          {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
        ],
      });
    }

    // Create a logs bucket for access logging first
    const logsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `access-logs-bucket-${environmentSuffix}-${this.account}-${this.region}`,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create secure S3 bucket with versioning and server access logging
    const dataBucket = new s3.Bucket(this, 'SecureDataBucket', {
      bucketName: `secure-data-bucket-${environmentSuffix}-${this.account}-${this.region}`,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      serverAccessLogsBucket: logsBucket,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create IAM role with least privilege permissions for S3 access
    const s3AccessRole = new iam.Role(this, 'S3AccessRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for secure S3 access with least privilege',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add specific permissions without wildcards
    s3AccessRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowS3BucketAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:GetObjectVersion',
          's3:ListBucket',
        ],
        resources: [dataBucket.bucketArn, `${dataBucket.bucketArn}/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'true',
          },
        },
      })
    );

    // Create IAM role for VPC operations with specific permissions
    const vpcRole = new iam.Role(this, 'VPCOperationsRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for VPC operations with specific permissions',
    });

    vpcRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowVPCReadAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:DescribeVpcs',
          'ec2:DescribeSubnets',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeNetworkAcls',
          'ec2:DescribeRouteTables',
        ],
        resources: ['*'], // These describe actions require wildcard
        conditions: {
          StringEquals: {
            'ec2:Region': this.region,
          },
        },
      })
    );

    vpcRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowVPCSpecificAccess',
        effect: iam.Effect.ALLOW,
        actions: ['ec2:CreateTags', 'ec2:DeleteTags'],
        resources: [
          `arn:aws:ec2:${this.region}:${this.account}:vpc/${vpc.vpcId}`,
          `arn:aws:ec2:${this.region}:${this.account}:subnet/*`,
        ],
        conditions: {
          StringEquals: {
            'ec2:ResourceTag/ManagedBy': 'CDK',
          },
        },
      })
    );

    // Create IAM Access Analyzer (conditional for LocalStack - not fully supported)
    let accessAnalyzerArn = '';
    if (!isLocalStack) {
      const accessAnalyzer = new accessanalyzer.CfnAnalyzer(
        this,
        'SecurityAccessAnalyzer',
        {
          type: 'ACCOUNT',
          analyzerName: `SecurityAccessAnalyzer-${environmentSuffix}`,
          tags: [
            {
              key: 'Purpose',
              value: 'SecurityMonitoring',
            },
            {
              key: 'Environment',
              value: environmentSuffix,
            },
          ],
        }
      );
      accessAnalyzerArn = accessAnalyzer.attrArn;
    } else {
      // Mock ARN for LocalStack (Access Analyzer not fully supported)
      accessAnalyzerArn = `arn:aws:access-analyzer:${this.region}:${this.account}:analyzer/SecurityAccessAnalyzer-${environmentSuffix}`;
    }

    // Create Security Group for future EC2 instances with minimal access
    const securityGroup = new ec2.SecurityGroup(this, 'SecureInstanceSG', {
      vpc,
      description: 'Security group for secure EC2 instances',
      allowAllOutbound: false,
    });

    // Allow HTTPS outbound for secure communications
    securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for secure communications'
    );

    // Allow HTTP outbound for package updates (restricted)
    securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP for package updates'
    );

    // VPC Flow Logs for monitoring - Create log group first to scope permissions
    const flowLogsGroup = new logs.LogGroup(this, 'VPCFlowLogs', {
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const flowLogsRole = new iam.Role(this, 'FlowLogsRole', {
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
              resources: [
                flowLogsGroup.logGroupArn,
                `${flowLogsGroup.logGroupArn}:*`,
              ],
            }),
          ],
        }),
      },
    });

    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogsGroup,
        flowLogsRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VPCId`,
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'Secure Data Bucket Name',
      exportName: `${this.stackName}-DataBucketName`,
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'Access Logs Bucket Name',
      exportName: `${this.stackName}-LogsBucketName`,
    });

    new cdk.CfnOutput(this, 'S3AccessRoleArn', {
      value: s3AccessRole.roleArn,
      description: 'S3 Access Role ARN',
      exportName: `${this.stackName}-S3AccessRoleArn`,
    });

    new cdk.CfnOutput(this, 'AccessAnalyzerArn', {
      value: accessAnalyzerArn,
      description: 'Access Analyzer ARN',
      exportName: `${this.stackName}-AccessAnalyzerArn`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value:
        vpc.privateSubnets.length > 0
          ? vpc.privateSubnets.map(subnet => subnet.subnetId).join(',')
          : 'none',
      description: 'Private Subnet IDs',
      exportName: `${this.stackName}-PrivateSubnetIds`,
    });
  }
}
