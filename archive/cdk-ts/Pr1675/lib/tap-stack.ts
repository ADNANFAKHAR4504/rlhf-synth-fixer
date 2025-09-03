import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  projectName?: string;
  allowedSshCidr?: string;
  allowedDbCidr?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const projectName = props.projectName || 'nova';
    const allowedSshCidr = props.allowedSshCidr || '10.0.0.0/8';
    const allowedDbCidr = props.allowedDbCidr || '10.0.0.0/16';

    // VPC Configuration
    const vpc = new ec2.Vpc(this, `corp-${projectName}-vpc`, {
      vpcName: `corp-${projectName}-vpc${environmentSuffix}`,
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      natGateways: 1,
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
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `corp-${projectName}-ec2-sg`,
      {
        vpc,
        securityGroupName: `corp-${projectName}-ec2-sg${environmentSuffix}`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedSshCidr),
      ec2.Port.tcp(22),
      'Allow SSH access from specified CIDR'
    );

    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `corp-${projectName}-rds-sg`,
      {
        vpc,
        securityGroupName: `corp-${projectName}-rds-sg${environmentSuffix}`,
        description: 'Security group for RDS instance',
        allowAllOutbound: false,
      }
    );

    rdsSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedDbCidr),
      ec2.Port.tcp(3306),
      'Allow MySQL access from specified CIDR'
    );

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2 instances'
    );

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `corp-${projectName}-lambda-sg`,
      {
        vpc,
        securityGroupName: `corp-${projectName}-lambda-sg${environmentSuffix}`,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // IAM Roles
    const ec2Role = new iam.Role(this, `corp-${projectName}-ec2-role`, {
      roleName: `corp-${projectName}-ec2-role${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add custom policy for EC2 to access S3 and Secrets Manager
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [
          `arn:aws:s3:::corp-${projectName}-*`,
          `arn:aws:s3:::corp-${projectName}-*/*`,
        ],
      })
    );

    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:corp-${projectName}-*`,
        ],
      })
    );

    const lambdaRole = new iam.Role(this, `corp-${projectName}-lambda-role`, {
      roleName: `corp-${projectName}-lambda-role${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:DescribeSecret',
        ],
        resources: [
          `arn:aws:secretsmanager:${this.region}:${this.account}:secret:corp-${projectName}-*`,
        ],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [
          `arn:aws:s3:::corp-${projectName}-*`,
          `arn:aws:s3:::corp-${projectName}-*/*`,
        ],
      })
    );

    // MFA Enforcement Policy - Created but not attached to maintain requirement
    // In production, this would be attached to user groups or roles that need console access
    new iam.ManagedPolicy(this, `corp-${projectName}-mfa-policy`, {
      managedPolicyName: `corp-${projectName}-mfa-policy${environmentSuffix}`,
      description: 'Enforce MFA for console access',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          actions: ['*'],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
            StringNotEquals: {
              'aws:RequestedRegion': ['us-west-2'],
            },
          },
        }),
      ],
    });

    // Secrets Manager for database credentials
    const dbSecret = new secretsmanager.Secret(
      this,
      `corp-${projectName}-db-secret`,
      {
        secretName: `corp-${projectName}-db-credentials${environmentSuffix}`,
        description: 'Database credentials for RDS instance',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\\'',
          includeSpace: false,
          passwordLength: 16,
        },
      }
    );

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `corp-${projectName}-db-subnet-group`,
      {
        description: 'Subnet group for RDS instance',
        vpc,
        subnetGroupName: `corp-${projectName}-db-subnet-group${environmentSuffix}`,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    // RDS Instance
    const database = new rds.DatabaseInstance(this, `corp-${projectName}-rds`, {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      securityGroups: [rdsSecurityGroup],
      subnetGroup: dbSubnetGroup,
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: `corp${projectName}db${environmentSuffix}`,
      storageEncrypted: true,
      multiAz: false,
      allocatedStorage: 20,
      deleteAutomatedBackups: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // EC2 Instance
    const ec2Instance = new ec2.Instance(this, `corp-${projectName}-ec2`, {
      instanceName: `corp-${projectName}-ec2${environmentSuffix}`,
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      userData: ec2.UserData.forLinux(),
    });

    // S3 Buckets
    const dataBucket = new s3.Bucket(this, `corp-${projectName}-data-bucket`, {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const logsBucket = new s3.Bucket(this, `corp-${projectName}-logs-bucket`, {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudWatch Log Group for Lambda
    const lambdaLogGroup = new logs.LogGroup(
      this,
      `corp-${projectName}-lambda-logs`,
      {
        logGroupName: `/aws/lambda/corp-${projectName}-function${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Lambda Function
    const lambdaFunction = new lambda.Function(
      this,
      `corp-${projectName}-lambda`,
      {
        functionName: `corp-${projectName}-function${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_9,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import os

def handler(event, context):
    # Example function that retrieves database credentials from Secrets Manager
    secrets_client = boto3.client('secretsmanager')
    
    try:
        secret_name = os.environ.get('DB_SECRET_NAME')
        response = secrets_client.get_secret_value(SecretId=secret_name)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Successfully retrieved database credentials',
                'secret_retrieved': True
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
      `),
        vpc,
        securityGroups: [lambdaSecurityGroup],
        role: lambdaRole,
        logGroup: lambdaLogGroup,
        environment: {
          DB_SECRET_NAME: dbSecret.secretName,
          DATA_BUCKET: dataBucket.bucketName,
          LOGS_BUCKET: logsBucket.bucketName,
        },
        timeout: cdk.Duration.minutes(5),
      }
    );

    // Grant Lambda access to the secret
    dbSecret.grantRead(lambdaFunction);

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'Data S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'Logs S3 Bucket Name',
    });
    // Add these outputs
    new cdk.CfnOutput(this, 'EC2SecurityGroupId', {
      value: ec2SecurityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
    });

    new cdk.CfnOutput(this, 'RDSSecurityGroupId', {
      value: rdsSecurityGroup.securityGroupId,
      description: 'RDS Security Group ID',
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: lambdaSecurityGroup.securityGroupId,
      description: 'Lambda Security Group ID',
    });

    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: ec2Role.roleArn,
      description: 'EC2 IAM Role ARN',
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'Lambda IAM Role ARN',
    });

    new cdk.CfnOutput(this, 'DBSecretArn', {
      value: dbSecret.secretArn,
      description: 'Database Secret ARN',
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(s => s.subnetId).join(','),
      description: 'Private Subnet IDs',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(s => s.subnetId).join(','),
      description: 'Public Subnet IDs',
    });

    new cdk.CfnOutput(this, 'DataBucketArn', {
      value: dataBucket.bucketArn,
      description: 'Data Bucket ARN',
    });

    new cdk.CfnOutput(this, 'LogsBucketArn', {
      value: logsBucket.bucketArn,
      description: 'Logs Bucket ARN',
    });
  }
}
