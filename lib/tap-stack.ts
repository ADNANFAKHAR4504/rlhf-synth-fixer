import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const companyNameParam = new cdk.CfnParameter(this, 'CompanyName', {
      type: 'String',
      default: 'companyname',
      description:
        'Company name for resource naming (companyname-env-component)',
      allowedPattern: '^[a-z0-9-]+$',
    });

    // Up to 5 parameterized CIDR ranges for HTTPS ingress (CIDR #1 required, others optional)
    const allowedIngressCidr1Param = new cdk.CfnParameter(
      this,
      'AllowedHttpsIngressCidr1',
      {
        type: 'String',
        default: '10.0.0.0/8',
        description:
          'Required CIDR allowed for HTTPS (port 443) ingress (range 1)',
        allowedPattern:
          '^(?:\\d{1,3}\\.){3}\\d{1,3}/([0-9]|[1-2][0-9]|3[0-2])$',
      }
    );

    const companyName = companyNameParam.valueAsString;

    const nameFor = (component: string) =>
      `${companyName}-${environmentSuffix}-${component}`;

    // VPC with LocalStack compatibility (no NAT Gateway)
    const vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: nameFor('vpc'),
      maxAzs: 2,
      natGateways: 0, // LocalStack: NAT Gateway not fully supported
      subnetConfiguration: [
        { name: 'private', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC },
      ],
      restrictDefaultSecurityGroup: false, // LocalStack: Custom resource requires Lambda
    });

    // HTTPS Security Group
    const httpsSg = new ec2.SecurityGroup(this, 'HttpsSecurityGroup', {
      vpc,
      description: 'Allow ingress only on 443 from allowed CIDR',
      allowAllOutbound: true,
      securityGroupName: nameFor('sg-https'),
    });

    // Ingress for required CIDR #1
    new ec2.CfnSecurityGroupIngress(this, 'HttpsIngress1', {
      groupId: httpsSg.securityGroupId,
      ipProtocol: 'tcp',
      fromPort: 443,
      toPort: 443,
      cidrIp: allowedIngressCidr1Param.valueAsString,
      description: 'HTTPS from allowed range 1',
    });

    // S3 Data Bucket with encryption
    const s3Bucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: cdk.Fn.join('-', [
        nameFor('data-bucket'),
        cdk.Stack.of(this).account,
      ]),
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: false, // LocalStack: autoDeleteObjects requires Lambda
    });

    // VPC Flow Logs
    const flowLogsLogGroup = new logs.LogGroup(this, 'VpcFlowLogsGroup', {
      logGroupName: nameFor('vpc-flow-logs'),
      retention: logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const flowLogsRole = new iam.Role(this, 'VpcFlowLogsRole', {
      roleName: nameFor('vpc-flow-logs-role'),
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
    });

    flowLogsRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
        ],
        resources: [
          flowLogsLogGroup.logGroupArn,
          `${flowLogsLogGroup.logGroupArn}:*`,
        ],
      })
    );

    new ec2.FlowLog(this, 'VpcFlowLogs', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      trafficType: ec2.FlowLogTrafficType.ALL,
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogsLogGroup,
        flowLogsRole
      ),
    });

    // MFA Enforcement Policy
    const mfaDenyPolicy = new iam.ManagedPolicy(this, 'MfaEnforcementPolicy', {
      managedPolicyName: nameFor('mfa-enforce'),
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ListVirtualMFADevices',
            'iam:GetUser',
            'iam:ListUsers',
            'iam:ChangePassword',
            'iam:GetAccountPasswordPolicy',
            'iam:ListAccountAliases',
            'sts:GetCallerIdentity',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    const mfaGroup = new iam.Group(this, 'MfaEnforcedGroup', {
      groupName: nameFor('mfa-enforced'),
    });
    mfaGroup.addManagedPolicy(mfaDenyPolicy);

    // Stack Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(s => s.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `${this.stackName}-PublicSubnetIds`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.isolatedSubnets.map(s => s.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `${this.stackName}-PrivateSubnetIds`,
    });

    new cdk.CfnOutput(this, 'HttpsSecurityGroupId', {
      value: httpsSg.securityGroupId,
      description: 'HTTPS Security Group ID',
      exportName: `${this.stackName}-HttpsSecurityGroupId`,
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Data Bucket Name',
      exportName: `${this.stackName}-DataBucketName`,
    });

    new cdk.CfnOutput(this, 'DataBucketArn', {
      value: s3Bucket.bucketArn,
      description: 'S3 Data Bucket ARN',
      exportName: `${this.stackName}-DataBucketArn`,
    });

    new cdk.CfnOutput(this, 'VpcFlowLogsLogGroupName', {
      value: flowLogsLogGroup.logGroupName,
      description: 'VPC Flow Logs Log Group Name',
      exportName: `${this.stackName}-VpcFlowLogsLogGroupName`,
    });

    new cdk.CfnOutput(this, 'VpcFlowLogsRoleArn', {
      value: flowLogsRole.roleArn,
      description: 'VPC Flow Logs Role ARN',
      exportName: `${this.stackName}-VpcFlowLogsRoleArn`,
    });

    new cdk.CfnOutput(this, 'MfaEnforcementPolicyArn', {
      value: mfaDenyPolicy.managedPolicyArn,
      description: 'MFA Enforcement Policy ARN',
      exportName: `${this.stackName}-MfaEnforcementPolicyArn`,
    });

    new cdk.CfnOutput(this, 'MfaEnforcedGroupName', {
      value: mfaGroup.groupName,
      description: 'MFA Enforced Group Name',
      exportName: `${this.stackName}-MfaEnforcedGroupName`,
    });

    // Tags
    cdk.Tags.of(this).add('Project', companyName);
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
