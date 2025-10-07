import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

/**
 * CDK stack that provisions the email notification infrastructure described in IAC-349955.
 * Configuration is driven by CloudFormation parameters and environment variables to avoid hard-coded values.
 */
export class IaCNovaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environmentIdParam = new cdk.CfnParameter(this, 'EnvironmentId', {
      type: 'String',
      description:
        'Lowercase identifier for the deployment environment (used in resource names).',
      default: 'development',
    });

    const stringSuffixParam = new cdk.CfnParameter(this, 'StringSuffix', {
      type: 'String',
      description:
        'Unique suffix appended to resource names to prevent collisions.',
    });

    const vpcCidrParam = new cdk.CfnParameter(this, 'VpcCidr', {
      type: 'String',
      description: 'CIDR block for the workload VPC.',
      default: '10.0.0.0/16',
    });

    const maxAzsParam = new cdk.CfnParameter(this, 'MaxAzs', {
      type: 'Number',
      description: 'Number of availability zones to span.',
      default: 2,
      minValue: 2,
      maxValue: 3,
    });

    const natGatewayCountParam = new cdk.CfnParameter(this, 'NatGatewayCount', {
      type: 'Number',
      description: 'Number of NAT gateways to provision for the VPC.',
      default: 1,
      minValue: 1,
      maxValue: 2,
    });

    const lambdaMemoryParam = new cdk.CfnParameter(this, 'LambdaMemorySize', {
      type: 'Number',
      description: 'Memory size for the Lambda function (MB).',
      default: 512,
      minValue: 128,
      maxValue: 10240,
    });

    const lambdaTimeoutParam = new cdk.CfnParameter(
      this,
      'LambdaTimeoutSeconds',
      {
        type: 'Number',
        description: 'Timeout for the Lambda function in seconds.',
        default: 60,
        minValue: 10,
        maxValue: 900,
      }
    );

    const lambdaRuntimeParam = new cdk.CfnParameter(this, 'LambdaRuntime', {
      type: 'String',
      description: 'Runtime for the Lambda function.',
      allowedValues: ['NODEJS_18_X', 'PYTHON_3_11'],
      default: 'NODEJS_18_X',
    });

    const rdsInstanceTypeParam = new cdk.CfnParameter(this, 'RdsInstanceType', {
      type: 'String',
      description: 'Instance type for the RDS MySQL instance, e.g., t3.medium.',
      default: 't3.medium',
    });

    const rdsAllocatedStorageParam = new cdk.CfnParameter(
      this,
      'RdsAllocatedStorageGb',
      {
        type: 'Number',
        description: 'Allocated storage for the RDS instance in GiB.',
        default: 100,
        minValue: 20,
        maxValue: 16384,
      }
    );

    const rdsBackupRetentionParam = new cdk.CfnParameter(
      this,
      'RdsBackupRetentionDays',
      {
        type: 'Number',
        description: 'Number of days to retain automated RDS backups.',
        default: 7,
        minValue: 1,
        maxValue: 35,
      }
    );

    const rdsDatabaseNameParam = new cdk.CfnParameter(this, 'RdsDatabaseName', {
      type: 'String',
      description: 'Database name for the MySQL instance.',
      default: 'emailservice',
    });

    const rdsCredentialsSecretArnParam = new cdk.CfnParameter(
      this,
      'RdsCredentialsSecretArn',
      {
        type: 'String',
        description:
          'ARN of an AWS Secrets Manager secret containing the username and password for the RDS instance. The secret must include the keys username and password.',
      }
    );

    const emailEventPrefixParam = new cdk.CfnParameter(
      this,
      'EmailEventPrefix',
      {
        type: 'String',
        description:
          'Optional S3 object prefix that identifies email event payloads the Lambda should process.',
        default: 'email-events/',
      }
    );

    const environmentId = environmentIdParam.valueAsString;
    const stringSuffix = stringSuffixParam.valueAsString;

    const formatResourceName = (purpose: string, lowercase = false): string => {
      const composed = `app-${purpose}-${environmentId}-${stringSuffix}`;
      return lowercase ? composed.toLowerCase() : composed;
    };

    const applyCommonTags = (resource: cdk.IConstruct, name?: string): void => {
      if (name) {
        cdk.Tags.of(resource).add('Name', name);
      }
      cdk.Tags.of(resource).add('Environment', 'Development');
      cdk.Tags.of(resource).add('iac-rlhf-amazon', 'true');
    };

    const lambdaRuntime = this.resolveRuntime(lambdaRuntimeParam.valueAsString);
    const lambdaCodePath = this.resolveLambdaCodePath();

    const vpc = new ec2.Vpc(this, 'NotificationVpc', {
      cidr: vpcCidrParam.valueAsString,
      maxAzs: maxAzsParam.valueAsNumber,
      natGatewayProvider: ec2.NatProvider.gateway(),
      natGateways: natGatewayCountParam.valueAsNumber,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-app',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'private-db',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    applyCommonTags(vpc, formatResourceName('vpc'));

    vpc.publicSubnets.forEach((subnet, index) => {
      applyCommonTags(
        subnet,
        formatResourceName(`public-subnet-${String.fromCharCode(97 + index)}`)
      );
    });

    vpc.privateSubnets.forEach((subnet, index) => {
      applyCommonTags(
        subnet,
        formatResourceName(`private-subnet-${String.fromCharCode(97 + index)}`)
      );
    });

    vpc.isolatedSubnets.forEach((subnet, index) => {
      applyCommonTags(
        subnet,
        formatResourceName(`database-subnet-${String.fromCharCode(97 + index)}`)
      );
    });

    vpc.node
      .findAll()
      .filter(
        (child): child is ec2.CfnNatGateway =>
          child instanceof ec2.CfnNatGateway
      )
      .forEach((natGateway, index) => {
        applyCommonTags(
          natGateway,
          formatResourceName(`nat-gateway-${index + 1}`)
        );
      });

    const sharedSecurityGroup = new ec2.SecurityGroup(
      this,
      'SharedSecurityGroup',
      {
        vpc,
        securityGroupName: formatResourceName('sg'),
        description:
          'Restricts ingress to HTTP and SSH as required by the architecture specification.',
        allowAllOutbound: true,
      }
    );
    sharedSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );
    sharedSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'SSH access'
    );
    applyCommonTags(sharedSecurityGroup, formatResourceName('sg'));

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      securityGroupName: formatResourceName('rds-sg'),
      description:
        'Controls database connectivity for the email notification service.',
      allowAllOutbound: false,
    });
    applyCommonTags(rdsSecurityGroup, formatResourceName('rds-sg'));

    rdsSecurityGroup.addIngressRule(
      sharedSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow database traffic from application security group'
    );

    const bucket = new s3.Bucket(this, 'EmailEventsBucket', {
      bucketName: formatResourceName('email-events', true),
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
    });
    applyCommonTags(bucket, formatResourceName('email-events', true));

    const lambdaRole = new iam.Role(this, 'EmailProcessorRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: formatResourceName('lambda-role'),
      description: 'IAM role for the email event processor Lambda function.',
    });
    applyCommonTags(lambdaRole, formatResourceName('lambda-role'));

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:log-group:/aws/lambda/${formatResourceName(
            'email-processor'
          )}:*`,
        ],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:CreateNetworkInterface',
          'ec2:DeleteNetworkInterface',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeSubnets',
          'ec2:DescribeVpcs',
        ],
        resources: ['*'],
      })
    );

    const rdsCredentialsSecret = secretsmanager.Secret.fromSecretCompleteArn(
      this,
      'RdsCredentialsSecret',
      rdsCredentialsSecretArnParam.valueAsString
    );

    const lambdaSecurityGroup = sharedSecurityGroup;

    const emailProcessorFunction = new lambda.Function(
      this,
      'EmailProcessorFunction',
      {
        runtime: lambdaRuntime,
        code: lambda.Code.fromAsset(path.resolve(lambdaCodePath)),
        handler: this.selectLambdaHandler(lambdaRuntime),
        memorySize: lambdaMemoryParam.valueAsNumber,
        timeout: cdk.Duration.seconds(lambdaTimeoutParam.valueAsNumber),
        role: lambdaRole,
        functionName: formatResourceName('email-processor'),
        description:
          'Processes stored email delivery events from S3, normalizes metadata, and writes tracking data into the RDS backend.',
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          EMAIL_EVENTS_BUCKET: bucket.bucketName,
          EMAIL_EVENT_PREFIX: emailEventPrefixParam.valueAsString,
          RDS_SECRET_ARN: rdsCredentialsSecretArnParam.valueAsString,
          RDS_DATABASE_NAME: rdsDatabaseNameParam.valueAsString,
        },
      }
    );
    applyCommonTags(emailProcessorFunction, formatResourceName('lambda'));

    bucket.grantRead(emailProcessorFunction);
    rdsCredentialsSecret.grantRead(emailProcessorFunction);

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(emailProcessorFunction),
      { prefix: emailEventPrefixParam.valueAsString }
    );

    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      'NotificationDbSubnetGroup',
      {
        description:
          'Subnet group for the email notification relational store.',
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        subnetGroupName: formatResourceName('db-subnet-group'),
      }
    );
    applyCommonTags(dbSubnetGroup, formatResourceName('db-subnet-group'));

    const databaseInstance = new rds.DatabaseInstance(
      this,
      'EmailNotificationDatabase',
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: new ec2.InstanceType(rdsInstanceTypeParam.valueAsString),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        multiAz: true,
        allocatedStorage: rdsAllocatedStorageParam.valueAsNumber,
        databaseName: rdsDatabaseNameParam.valueAsString,
        credentials: rds.Credentials.fromSecret(rdsCredentialsSecret),
        securityGroups: [rdsSecurityGroup],
        backupRetention: cdk.Duration.days(
          rdsBackupRetentionParam.valueAsNumber
        ),
        cloudwatchLogsExports: ['error', 'slowquery'],
        removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
        deletionProtection: true,
        subnetGroup: dbSubnetGroup,
        instanceIdentifier: formatResourceName('rds'),
        storageEncrypted: true,
        publiclyAccessible: false,
        preferredMaintenanceWindow: 'Sun:01:00-Sun:03:00',
      }
    );
    applyCommonTags(databaseInstance, formatResourceName('rds-instance'));

    emailProcessorFunction.connections.allowTo(
      databaseInstance,
      ec2.Port.tcp(3306),
      'Lambda to RDS connectivity'
    );

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      exportName: formatResourceName('vpc-id'),
      description: 'Identifier for the provisioned VPC.',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: sharedSecurityGroup.securityGroupId,
      exportName: formatResourceName('sg-id'),
      description: 'Security group that restricts ingress to HTTP and SSH.',
    });

    vpc.publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        exportName: formatResourceName(`public-subnet-${index + 1}-id`),
        description: `Public subnet ${index + 1} ID.`,
      });
    });

    vpc.privateSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PrivateSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        exportName: formatResourceName(`private-subnet-${index + 1}-id`),
        description: `Private subnet ${index + 1} ID.`,
      });
    });

    new cdk.CfnOutput(this, 'EmailEventsBucketName', {
      value: bucket.bucketName,
      exportName: formatResourceName('email-events-bucket-name'),
      description: 'S3 bucket that stores email delivery event payloads.',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: emailProcessorFunction.functionName,
      exportName: formatResourceName('lambda-name'),
      description:
        'Name of the Lambda function that processes email delivery events.',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: databaseInstance.instanceEndpoint.hostname,
      exportName: formatResourceName('rds-endpoint'),
      description: 'Endpoint for the RDS MySQL instance.',
    });
  }

  private resolveRuntime(value: string): lambda.Runtime {
    switch (value) {
      case 'NODEJS_18_X':
        return lambda.Runtime.NODEJS_18_X;
      case 'PYTHON_3_11':
        return lambda.Runtime.PYTHON_3_11;
      default:
        throw new Error(`Unsupported Lambda runtime: ${value}`);
    }
  }

  private resolveLambdaCodePath(): string {
    const fromEnv = process.env.LAMBDA_CODE_PATH;
    const fromContext = this.node.tryGetContext('lambdaCodePath');

    const selected = fromEnv ?? fromContext;
    if (!selected) {
      throw new Error(
        'Set the LAMBDA_CODE_PATH environment variable or provide the "lambdaCodePath" context value before synthesizing the stack.'
      );
    }

    return selected.startsWith('.') ? path.resolve(selected) : selected;
  }

  private selectLambdaHandler(runtime: lambda.Runtime): string {
    if (runtime === lambda.Runtime.PYTHON_3_11) {
      return 'app.handler';
    }

    return 'index.handler';
  }
}
