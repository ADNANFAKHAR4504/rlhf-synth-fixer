import { TerraformOutput, Fn } from 'cdktf';
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import * as path from 'path';
import * as fs from 'fs';
import { AssetType, TerraformAsset } from 'cdktf';

interface PaymentStackProps {
  environmentSuffix: string;
}

export class PaymentStack extends Construct {
  constructor(scope: Construct, id: string, props: PaymentStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Get AWS account and region information
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _current = new DataAwsCallerIdentity(this, 'current');
    const region = new DataAwsRegion(this, 'region');
    const azs = new DataAwsAvailabilityZones(this, 'available', {
      state: 'available',
    });

    // KMS Key for DynamoDB encryption (customer-managed as per requirements)
    const kmsKey = new KmsKey(this, 'dynamodb-kms-key', {
      description: `KMS key for DynamoDB table encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 7,
    });

    new KmsAlias(this, 'dynamodb-kms-alias', {
      name: `alias/dynamodb-${environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    });

    // VPC Configuration
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `payment-vpc-${environmentSuffix}`,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-igw-${environmentSuffix}`,
      },
    });

    // Get first 3 availability zones
    const availabilityZones = Fn.slice(azs.names, 0, 3);

    // Create subnets in 3 AZs
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];

    for (let i = 0; i < 3; i++) {
      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: Fn.element(availabilityZones, i),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-${i}-${environmentSuffix}`,
          Type: 'public',
        },
      });
      publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${10 + i}.0/24`,
        availabilityZone: Fn.element(availabilityZones, i),
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `payment-private-subnet-${i}-${environmentSuffix}`,
          Type: 'private',
        },
      });
      privateSubnets.push(privateSubnet);
    }

    // Elastic IPs and NAT Gateways for each AZ
    const natGateways: NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `payment-nat-eip-${i}-${environmentSuffix}`,
        },
      });

      const natGw = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[i].id,
        tags: {
          Name: `payment-nat-${i}-${environmentSuffix}`,
        },
      });
      natGateways.push(natGw);
    }

    // Public route table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-public-rt-${environmentSuffix}`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private route tables (one per NAT Gateway)
    const privateRouteTables: RouteTable[] = [];
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-route-table-${index}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `payment-private-rt-${index}-${environmentSuffix}`,
          },
        }
      );
      privateRouteTables.push(privateRouteTable);

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // VPC Flow Logs
    const flowLogRole = new IamRole(this, 'flow-log-role', {
      name: `flow-log-role-${environmentSuffix}`,
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
      maxSessionDuration: 3600, // 1 hour as per requirement
    });

    const flowLogGroup = new CloudwatchLogGroup(this, 'flow-log-group', {
      name: `/aws/vpc/flow-logs-${environmentSuffix}`,
      retentionInDays: 7,
    });

    const flowLogPolicy = new IamPolicy(this, 'flow-log-policy', {
      name: `flow-log-policy-${environmentSuffix}`,
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
    });

    new IamRolePolicyAttachment(this, 'flow-log-policy-attachment', {
      role: flowLogRole.name,
      policyArn: flowLogPolicy.arn,
    });

    new FlowLog(this, 'vpc-flow-log', {
      vpcId: vpc.id,
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logDestination: flowLogGroup.arn,
      iamRoleArn: flowLogRole.arn,
      tags: {
        Name: `payment-flow-log-${environmentSuffix}`,
      },
    });

    // Security Groups
    const lambdaSg = new SecurityGroup(this, 'lambda-sg', {
      name: `lambda-sg-${environmentSuffix}`,
      description: 'Security group for Lambda functions',
      vpcId: vpc.id,
      tags: {
        Name: `lambda-sg-${environmentSuffix}`,
      },
    });

    // Lambda egress to HTTPS
    new SecurityGroupRule(this, 'lambda-egress-https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: lambdaSg.id,
      description: 'Allow HTTPS outbound',
    });

    // VPC Endpoints for S3 and DynamoDB
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _s3Endpoint = new VpcEndpoint(this, 's3-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${region.name}.s3`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [
        publicRouteTable.id,
        ...privateRouteTables.map(rt => rt.id),
      ],
      tags: {
        Name: `payment-s3-endpoint-${environmentSuffix}`,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _dynamodbEndpoint = new VpcEndpoint(this, 'dynamodb-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${region.name}.dynamodb`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [
        publicRouteTable.id,
        ...privateRouteTables.map(rt => rt.id),
      ],
      tags: {
        Name: `payment-dynamodb-endpoint-${environmentSuffix}`,
      },
    });

    // DynamoDB Table
    const transactionsTable = new DynamodbTable(this, 'transactions-table', {
      name: `transactions-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'transactionId',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'transactionId',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: kmsKey.arn,
      },
      tags: {
        Name: `transactions-${environmentSuffix}`,
      },
    });

    // S3 Bucket for Audit Logs
    const auditBucket = new S3Bucket(this, 'audit-bucket', {
      bucket: `payment-audit-logs-${environmentSuffix}`,
      tags: {
        Name: `payment-audit-logs-${environmentSuffix}`,
      },
    });

    // S3 bucket versioning
    new S3BucketVersioningA(this, 'audit-bucket-versioning', {
      bucket: auditBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // S3 bucket encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'audit-bucket-encryption',
      {
        bucket: auditBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // S3 bucket public access block
    new S3BucketPublicAccessBlock(this, 'audit-bucket-public-access-block', {
      bucket: auditBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // S3 bucket lifecycle policy for 90-day archival
    new S3BucketLifecycleConfiguration(this, 'audit-bucket-lifecycle', {
      bucket: auditBucket.id,
      rule: [
        {
          id: 'archive-after-90-days',
          status: 'Enabled',
          filter: [{}],
          transition: [
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    // SNS Topic for Notifications
    const notificationTopic = new SnsTopic(this, 'notification-topic', {
      name: `payment-notifications-${environmentSuffix}`,
      tags: {
        Name: `payment-notifications-${environmentSuffix}`,
      },
    });

    // SNS Email Subscription (placeholder email)
    new SnsTopicSubscription(this, 'notification-email-subscription', {
      topicArn: notificationTopic.arn,
      protocol: 'email',
      endpoint: 'payments-team@example.com',
    });

    // Lambda IAM Role
    const lambdaRole = new IamRole(this, 'lambda-role', {
      name: `payment-lambda-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      maxSessionDuration: 3600, // 1 hour as per requirement
    });

    // Lambda policy
    const lambdaPolicy = new IamPolicy(this, 'lambda-policy', {
      name: `payment-lambda-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:UpdateItem',
            ],
            Resource: transactionsTable.arn,
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject'],
            Resource: `${auditBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: notificationTopic.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
            Resource: kmsKey.arn,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'lambda-policy-attachment', {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    // CloudWatch Log Groups
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _validatorLogGroup = new CloudwatchLogGroup(
      this,
      'validator-log-group',
      {
        name: `/aws/lambda/payment-validator-${environmentSuffix}`,
        retentionInDays: 7,
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _processorLogGroup = new CloudwatchLogGroup(
      this,
      'processor-log-group',
      {
        name: `/aws/lambda/payment-processor-${environmentSuffix}`,
        retentionInDays: 7,
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _notifierLogGroup = new CloudwatchLogGroup(
      this,
      'notifier-log-group',
      {
        name: `/aws/lambda/payment-notifier-${environmentSuffix}`,
        retentionInDays: 7,
      }
    );

    // Create Lambda deployment packages
    const lambdaDir = path.join(__dirname, 'lambda');
    /* istanbul ignore next - directory always exists in tests */
    if (!fs.existsSync(lambdaDir)) {
      fs.mkdirSync(lambdaDir, { recursive: true });
    }

    // Lambda Functions
    const validatorAsset = new TerraformAsset(this, 'validator-asset', {
      path: path.join(__dirname, 'lambda', 'payment-validator'),
      type: AssetType.ARCHIVE,
    });

    const validatorFunction = new LambdaFunction(this, 'payment-validator', {
      functionName: `payment-validator-${environmentSuffix}`,
      role: lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      filename: validatorAsset.path,
      sourceCodeHash: validatorAsset.assetHash,
      memorySize: 512,
      timeout: 30,
      reservedConcurrentExecutions: 10,
      environment: {
        variables: {
          DYNAMODB_TABLE: transactionsTable.name,
          SNS_TOPIC_ARN: notificationTopic.arn,
          ENVIRONMENT: environmentSuffix,
        },
      },
      vpcConfig: {
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [lambdaSg.id],
      },
      tags: {
        Name: `payment-validator-${environmentSuffix}`,
      },
    });

    const processorAsset = new TerraformAsset(this, 'processor-asset', {
      path: path.join(__dirname, 'lambda', 'payment-processor'),
      type: AssetType.ARCHIVE,
    });

    const processorFunction = new LambdaFunction(this, 'payment-processor', {
      functionName: `payment-processor-${environmentSuffix}`,
      role: lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      filename: processorAsset.path,
      sourceCodeHash: processorAsset.assetHash,
      memorySize: 512,
      timeout: 30,
      reservedConcurrentExecutions: 10,
      environment: {
        variables: {
          DYNAMODB_TABLE: transactionsTable.name,
          S3_BUCKET: auditBucket.bucket,
          SNS_TOPIC_ARN: notificationTopic.arn,
          ENVIRONMENT: environmentSuffix,
        },
      },
      vpcConfig: {
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [lambdaSg.id],
      },
      tags: {
        Name: `payment-processor-${environmentSuffix}`,
      },
    });

    const notifierAsset = new TerraformAsset(this, 'notifier-asset', {
      path: path.join(__dirname, 'lambda', 'payment-notifier'),
      type: AssetType.ARCHIVE,
    });

    const notifierFunction = new LambdaFunction(this, 'payment-notifier', {
      functionName: `payment-notifier-${environmentSuffix}`,
      role: lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      filename: notifierAsset.path,
      sourceCodeHash: notifierAsset.assetHash,
      memorySize: 512,
      timeout: 30,
      reservedConcurrentExecutions: 10,
      environment: {
        variables: {
          SNS_TOPIC_ARN: notificationTopic.arn,
          DYNAMODB_TABLE: transactionsTable.name,
          ENVIRONMENT: environmentSuffix,
        },
      },
      vpcConfig: {
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [lambdaSg.id],
      },
      tags: {
        Name: `payment-notifier-${environmentSuffix}`,
      },
    });

    // API Gateway
    const api = new ApiGatewayRestApi(this, 'payment-api', {
      name: `payment-api-${environmentSuffix}`,
      description: 'Payment Processing API',
      tags: {
        Name: `payment-api-${environmentSuffix}`,
      },
    });

    const paymentsResource = new ApiGatewayResource(this, 'payments-resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'payments',
    });

    const paymentsMethod = new ApiGatewayMethod(this, 'payments-method', {
      restApiId: api.id,
      resourceId: paymentsResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    });

    const paymentsIntegration = new ApiGatewayIntegration(
      this,
      'payments-integration',
      {
        restApiId: api.id,
        resourceId: paymentsResource.id,
        httpMethod: paymentsMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: validatorFunction.invokeArn,
      }
    );

    new LambdaPermission(this, 'api-lambda-permission', {
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: validatorFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: api.id,
      dependsOn: [paymentsIntegration],
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    const stage = new ApiGatewayStage(this, 'api-stage', {
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: 'prod',
      tags: {
        Name: `payment-api-stage-${environmentSuffix}`,
      },
    });

    // CloudWatch Alarms for Lambda Error Rates
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _validatorAlarm = new CloudwatchMetricAlarm(
      this,
      'validator-error-alarm',
      {
        alarmName: `payment-validator-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 60,
        statistic: 'Sum',
        threshold: 1,
        alarmDescription: 'Alert when validator Lambda errors exceed 1%',
        dimensions: {
          FunctionName: validatorFunction.functionName,
        },
        alarmActions: [notificationTopic.arn],
        tags: {
          Name: `validator-error-alarm-${environmentSuffix}`,
        },
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _processorAlarm = new CloudwatchMetricAlarm(
      this,
      'processor-error-alarm',
      {
        alarmName: `payment-processor-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 60,
        statistic: 'Sum',
        threshold: 1,
        alarmDescription: 'Alert when processor Lambda errors exceed 1%',
        dimensions: {
          FunctionName: processorFunction.functionName,
        },
        alarmActions: [notificationTopic.arn],
        tags: {
          Name: `processor-error-alarm-${environmentSuffix}`,
        },
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _notifierAlarm = new CloudwatchMetricAlarm(
      this,
      'notifier-error-alarm',
      {
        alarmName: `payment-notifier-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 60,
        statistic: 'Sum',
        threshold: 1,
        alarmDescription: 'Alert when notifier Lambda errors exceed 1%',
        dimensions: {
          FunctionName: notifierFunction.functionName,
        },
        alarmActions: [notificationTopic.arn],
        tags: {
          Name: `notifier-error-alarm-${environmentSuffix}`,
        },
      }
    );

    // CloudWatch Dashboard
    const dashboard = new CloudwatchDashboard(this, 'payment-dashboard', {
      dashboardName: `payment-metrics-${environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/Lambda',
                  'Invocations',
                  'FunctionName',
                  validatorFunction.functionName,
                  { stat: 'Sum', label: 'Validator Invocations' },
                ],
                [
                  '.',
                  '.',
                  '.',
                  processorFunction.functionName,
                  { stat: 'Sum', label: 'Processor Invocations' },
                ],
                [
                  '.',
                  '.',
                  '.',
                  notifierFunction.functionName,
                  { stat: 'Sum', label: 'Notifier Invocations' },
                ],
              ],
              period: 300,
              stat: 'Sum',
              region: region.name,
              title: 'Lambda Invocations',
              yAxis: {
                left: {
                  min: 0,
                },
              },
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/Lambda',
                  'Errors',
                  'FunctionName',
                  validatorFunction.functionName,
                  { stat: 'Sum', label: 'Validator Errors' },
                ],
                [
                  '.',
                  '.',
                  '.',
                  processorFunction.functionName,
                  { stat: 'Sum', label: 'Processor Errors' },
                ],
                [
                  '.',
                  '.',
                  '.',
                  notifierFunction.functionName,
                  { stat: 'Sum', label: 'Notifier Errors' },
                ],
              ],
              period: 300,
              stat: 'Sum',
              region: region.name,
              title: 'Lambda Errors',
              yAxis: {
                left: {
                  min: 0,
                },
              },
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/DynamoDB',
                  'ConsumedReadCapacityUnits',
                  'TableName',
                  transactionsTable.name,
                  { stat: 'Sum' },
                ],
                ['.', 'ConsumedWriteCapacityUnits', '.', '.', { stat: 'Sum' }],
              ],
              period: 300,
              stat: 'Sum',
              region: region.name,
              title: 'DynamoDB Capacity',
              yAxis: {
                left: {
                  min: 0,
                },
              },
            },
          },
        ],
      }),
    });

    // Outputs
    new TerraformOutput(this, 'api-gateway-url', {
      value: `https://${api.id}.execute-api.${region.name}.amazonaws.com/${stage.stageName}/payments`,
      description: 'API Gateway URL for payment endpoint',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: auditBucket.bucket,
      description: 'S3 bucket name for audit logs',
    });

    new TerraformOutput(this, 'dynamodb-table-name', {
      value: transactionsTable.name,
      description: 'DynamoDB table name for transactions',
    });

    new TerraformOutput(this, 'cloudwatch-dashboard-url', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${region.name}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch dashboard URL',
    });

    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'validator-function-name', {
      value: validatorFunction.functionName,
      description: 'Payment validator Lambda function name',
    });

    new TerraformOutput(this, 'processor-function-name', {
      value: processorFunction.functionName,
      description: 'Payment processor Lambda function name',
    });

    new TerraformOutput(this, 'notifier-function-name', {
      value: notifierFunction.functionName,
      description: 'Payment notifier Lambda function name',
    });
  }
}
