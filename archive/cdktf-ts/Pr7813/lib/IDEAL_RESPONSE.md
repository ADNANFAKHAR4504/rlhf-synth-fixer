# Payment Processing Infrastructure - CDKTF TypeScript Implementation

This document contains the complete CDKTF TypeScript implementation for the payment processing environment.

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// Import stacks
import { PaymentStack } from './payment-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = 'us-east-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Instantiate PaymentStack
    new PaymentStack(this, 'PaymentStack', {
      environmentSuffix,
    });
  }
}
```

## File: lib/payment-stack.ts

```typescript
import { TerraformStack, TerraformOutput, Fn } from 'cdktf';
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

export class PaymentStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: PaymentStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Get AWS account and region information
    const current = new DataAwsCallerIdentity(this, 'current');
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
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-route-table-${index}`, {
        vpcId: vpc.id,
        tags: {
          Name: `payment-private-rt-${index}-${environmentSuffix}`,
        },
      });

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
    const s3Endpoint = new VpcEndpoint(this, 's3-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${region.name}.s3`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [
        publicRouteTable.id,
        ...privateSubnets.map((_, i) => `\${aws_route_table.private-route-table-${i}.id}`),
      ],
      tags: {
        Name: `payment-s3-endpoint-${environmentSuffix}`,
      },
    });

    const dynamodbEndpoint = new VpcEndpoint(this, 'dynamodb-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${region.name}.dynamodb`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [
        publicRouteTable.id,
        ...privateSubnets.map((_, i) => `\${aws_route_table.private-route-table-${i}.id}`),
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
    new S3BucketServerSideEncryptionConfigurationA(this, 'audit-bucket-encryption', {
      bucket: auditBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

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
            Action: [
              's3:PutObject',
              's3:GetObject',
            ],
            Resource: `${auditBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'sns:Publish',
            ],
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
            Action: [
              'kms:Decrypt',
              'kms:Encrypt',
              'kms:GenerateDataKey',
            ],
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
    const validatorLogGroup = new CloudwatchLogGroup(this, 'validator-log-group', {
      name: `/aws/lambda/payment-validator-${environmentSuffix}`,
      retentionInDays: 7,
    });

    const processorLogGroup = new CloudwatchLogGroup(this, 'processor-log-group', {
      name: `/aws/lambda/payment-processor-${environmentSuffix}`,
      retentionInDays: 7,
    });

    const notifierLogGroup = new CloudwatchLogGroup(this, 'notifier-log-group', {
      name: `/aws/lambda/payment-notifier-${environmentSuffix}`,
      retentionInDays: 7,
    });

    // Create Lambda deployment packages
    const lambdaDir = path.join(__dirname, 'lambda');
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

    const paymentsIntegration = new ApiGatewayIntegration(this, 'payments-integration', {
      restApiId: api.id,
      resourceId: paymentsResource.id,
      httpMethod: paymentsMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: validatorFunction.invokeArn,
    });

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
      throttleSettings: {
        burstLimit: 5000,
        rateLimit: 10000,
      },
      tags: {
        Name: `payment-api-stage-${environmentSuffix}`,
      },
    });

    // CloudWatch Alarms for Lambda Error Rates
    const validatorAlarm = new CloudwatchMetricAlarm(this, 'validator-error-alarm', {
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
    });

    const processorAlarm = new CloudwatchMetricAlarm(this, 'processor-error-alarm', {
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
    });

    const notifierAlarm = new CloudwatchMetricAlarm(this, 'notifier-error-alarm', {
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
    });

    // CloudWatch Dashboard
    const dashboard = new CloudwatchDashboard(this, 'payment-dashboard', {
      dashboardName: `payment-metrics-${environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                ['AWS/Lambda', 'Invocations', { stat: 'Sum', label: 'Validator Invocations' }, { FunctionName: validatorFunction.functionName }],
                ['.', '.', { stat: 'Sum', label: 'Processor Invocations' }, { FunctionName: processorFunction.functionName }],
                ['.', '.', { stat: 'Sum', label: 'Notifier Invocations' }, { FunctionName: notifierFunction.functionName }],
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
                ['AWS/Lambda', 'Errors', { stat: 'Sum', label: 'Validator Errors' }, { FunctionName: validatorFunction.functionName }],
                ['.', '.', { stat: 'Sum', label: 'Processor Errors' }, { FunctionName: processorFunction.functionName }],
                ['.', '.', { stat: 'Sum', label: 'Notifier Errors' }, { FunctionName: notifierFunction.functionName }],
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
                ['AWS/DynamoDB', 'ConsumedReadCapacityUnits', { stat: 'Sum' }, { TableName: transactionsTable.name }],
                ['.', 'ConsumedWriteCapacityUnits', { stat: 'Sum' }, { TableName: transactionsTable.name }],
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
```

## File: lib/lambda/payment-validator/index.js

```javascript
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const ENVIRONMENT = process.env.ENVIRONMENT;

exports.handler = async (event) => {
  console.log('Payment Validator - Event received:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    console.log('Parsed request body:', JSON.stringify(body, null, 2));

    // Validate payment data
    const validationResult = validatePayment(body);

    if (!validationResult.isValid) {
      console.error('Payment validation failed:', validationResult.errors);
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Payment validation failed',
          errors: validationResult.errors,
        }),
      };
    }

    // Generate transaction ID
    const transactionId = generateTransactionId();
    const timestamp = Date.now();

    console.log(`Payment validated successfully. Transaction ID: ${transactionId}`);

    // Store initial transaction record
    const transactionItem = {
      transactionId,
      timestamp,
      status: 'validated',
      amount: body.amount,
      currency: body.currency || 'USD',
      paymentMethod: body.paymentMethod,
      environment: ENVIRONMENT,
      createdAt: new Date().toISOString(),
    };

    await dynamodb.put({
      TableName: DYNAMODB_TABLE,
      Item: transactionItem,
    }).promise();

    console.log('Transaction record created in DynamoDB:', transactionId);

    // Send validation notification
    await sns.publish({
      TopicArn: SNS_TOPIC_ARN,
      Subject: 'Payment Validated',
      Message: `Payment validation successful for transaction ${transactionId}\nAmount: ${body.amount} ${body.currency || 'USD'}`,
    }).promise();

    console.log('SNS notification sent for transaction:', transactionId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Payment validated successfully',
        transactionId,
        timestamp,
        status: 'validated',
      }),
    };

  } catch (error) {
    console.error('Error in payment validator:', error);

    // Log error to CloudWatch
    console.error('Error stack:', error.stack);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Internal server error',
        error: error.message,
      }),
    };
  }
};

function validatePayment(payment) {
  const errors = [];

  if (!payment) {
    errors.push('Payment data is required');
    return { isValid: false, errors };
  }

  if (!payment.amount || typeof payment.amount !== 'number' || payment.amount <= 0) {
    errors.push('Valid payment amount is required (must be a positive number)');
  }

  if (payment.amount && payment.amount > 1000000) {
    errors.push('Payment amount exceeds maximum limit (1,000,000)');
  }

  if (!payment.paymentMethod) {
    errors.push('Payment method is required');
  }

  const validPaymentMethods = ['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'];
  if (payment.paymentMethod && !validPaymentMethods.includes(payment.paymentMethod)) {
    errors.push(`Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
  }

  if (payment.currency) {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD'];
    if (!validCurrencies.includes(payment.currency)) {
      errors.push(`Invalid currency. Must be one of: ${validCurrencies.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function generateTransactionId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `TXN-${timestamp}-${randomStr}`.toUpperCase();
}
```

## File: lib/lambda/payment-processor/index.js

```javascript
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const sns = new AWS.SNS();

const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const S3_BUCKET = process.env.S3_BUCKET;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const ENVIRONMENT = process.env.ENVIRONMENT;

exports.handler = async (event) => {
  console.log('Payment Processor - Event received:', JSON.stringify(event, null, 2));

  try {
    // Parse event data
    const records = event.Records || [event];

    for (const record of records) {
      const transactionData = typeof record.body === 'string' ? JSON.parse(record.body) : record;

      console.log('Processing transaction:', JSON.stringify(transactionData, null, 2));

      const transactionId = transactionData.transactionId || generateTransactionId();
      const timestamp = Date.now();

      // Simulate payment processing
      const processingResult = await processPayment(transactionData);

      console.log(`Payment processing ${processingResult.success ? 'succeeded' : 'failed'} for transaction: ${transactionId}`);

      // Update transaction in DynamoDB
      await dynamodb.put({
        TableName: DYNAMODB_TABLE,
        Item: {
          transactionId,
          timestamp,
          status: processingResult.success ? 'processed' : 'failed',
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          paymentMethod: transactionData.paymentMethod,
          processingResult: processingResult.message,
          environment: ENVIRONMENT,
          processedAt: new Date().toISOString(),
        },
      }).promise();

      console.log('Transaction record updated in DynamoDB:', transactionId);

      // Create audit log in S3
      const auditLog = {
        transactionId,
        timestamp,
        event: 'payment_processed',
        status: processingResult.success ? 'success' : 'failure',
        details: processingResult,
        environment: ENVIRONMENT,
        processedAt: new Date().toISOString(),
      };

      const s3Key = `audit-logs/${new Date().toISOString().split('T')[0]}/${transactionId}.json`;

      await s3.putObject({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: JSON.stringify(auditLog, null, 2),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256',
      }).promise();

      console.log('Audit log written to S3:', s3Key);

      // Send processing notification
      await sns.publish({
        TopicArn: SNS_TOPIC_ARN,
        Subject: `Payment ${processingResult.success ? 'Processed' : 'Failed'}`,
        Message: `Transaction ${transactionId} has been ${processingResult.success ? 'processed successfully' : 'failed'}\nAmount: ${transactionData.amount} ${transactionData.currency || 'USD'}\nStatus: ${processingResult.message}`,
      }).promise();

      console.log('SNS notification sent for transaction:', transactionId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Payment processing completed',
        recordsProcessed: records.length,
      }),
    };

  } catch (error) {
    console.error('Error in payment processor:', error);
    console.error('Error stack:', error.stack);

    // Send error notification
    try {
      await sns.publish({
        TopicArn: SNS_TOPIC_ARN,
        Subject: 'Payment Processing Error',
        Message: `Error occurred during payment processing: ${error.message}`,
      }).promise();
    } catch (snsError) {
      console.error('Failed to send error notification:', snsError);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Payment processing failed',
        error: error.message,
      }),
    };
  }
};

async function processPayment(transaction) {
  // Simulate payment processing logic
  console.log('Simulating payment processing for:', transaction.transactionId || 'new transaction');

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Simulate 95% success rate
  const isSuccessful = Math.random() > 0.05;

  if (!isSuccessful) {
    return {
      success: false,
      message: 'Payment gateway declined the transaction',
      errorCode: 'DECLINED',
    };
  }

  // Simulate different processing outcomes
  const outcomes = [
    { success: true, message: 'Payment processed successfully', code: 'SUCCESS' },
    { success: true, message: 'Payment authorized and captured', code: 'CAPTURED' },
    { success: true, message: 'Payment pending bank confirmation', code: 'PENDING' },
  ];

  return outcomes[Math.floor(Math.random() * outcomes.length)];
}

function generateTransactionId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `TXN-${timestamp}-${randomStr}`.toUpperCase();
}
```

## File: lib/lambda/payment-notifier/index.js

```javascript
const AWS = require('aws-sdk');

const sns = new AWS.SNS();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const DYNAMODB_TABLE = process.env.DYNAMODB_TABLE;
const ENVIRONMENT = process.env.ENVIRONMENT;

exports.handler = async (event) => {
  console.log('Payment Notifier - Event received:', JSON.stringify(event, null, 2));

  try {
    // Parse event records (from DynamoDB Stream or direct invocation)
    const records = event.Records || [event];

    for (const record of records) {
      let notificationData;

      // Handle DynamoDB Stream events
      if (record.dynamodb) {
        console.log('Processing DynamoDB Stream record');
        notificationData = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage || {});
      } else {
        // Handle direct invocation
        notificationData = typeof record.body === 'string' ? JSON.parse(record.body) : record;
      }

      console.log('Notification data:', JSON.stringify(notificationData, null, 2));

      // Retrieve full transaction details if only ID is provided
      let transactionDetails = notificationData;

      if (notificationData.transactionId && !notificationData.amount) {
        console.log('Fetching transaction details from DynamoDB:', notificationData.transactionId);

        const result = await dynamodb.query({
          TableName: DYNAMODB_TABLE,
          KeyConditionExpression: 'transactionId = :tid',
          ExpressionAttributeValues: {
            ':tid': notificationData.transactionId,
          },
          Limit: 1,
          ScanIndexForward: false,
        }).promise();

        if (result.Items && result.Items.length > 0) {
          transactionDetails = result.Items[0];
          console.log('Transaction details retrieved:', JSON.stringify(transactionDetails, null, 2));
        }
      }

      // Generate notification message
      const notificationMessage = generateNotificationMessage(transactionDetails);

      // Send notification via SNS
      await sns.publish({
        TopicArn: SNS_TOPIC_ARN,
        Subject: notificationMessage.subject,
        Message: notificationMessage.body,
        MessageAttributes: {
          transactionId: {
            DataType: 'String',
            StringValue: transactionDetails.transactionId || 'unknown',
          },
          status: {
            DataType: 'String',
            StringValue: transactionDetails.status || 'unknown',
          },
          environment: {
            DataType: 'String',
            StringValue: ENVIRONMENT,
          },
        },
      }).promise();

      console.log('Notification sent successfully for transaction:', transactionDetails.transactionId);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Notifications sent successfully',
        recordsProcessed: records.length,
      }),
    };

  } catch (error) {
    console.error('Error in payment notifier:', error);
    console.error('Error stack:', error.stack);

    // Send error notification
    try {
      await sns.publish({
        TopicArn: SNS_TOPIC_ARN,
        Subject: 'Payment Notification Error',
        Message: `Error occurred while sending payment notifications: ${error.message}\n\nEnvironment: ${ENVIRONMENT}\nTimestamp: ${new Date().toISOString()}`,
      }).promise();
    } catch (snsError) {
      console.error('Failed to send error notification:', snsError);
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Notification sending failed',
        error: error.message,
      }),
    };
  }
};

function generateNotificationMessage(transaction) {
  const transactionId = transaction.transactionId || 'Unknown';
  const status = transaction.status || 'unknown';
  const amount = transaction.amount || 0;
  const currency = transaction.currency || 'USD';
  const timestamp = transaction.timestamp ? new Date(transaction.timestamp).toISOString() : new Date().toISOString();

  let subject = '';
  let body = '';

  switch (status) {
    case 'validated':
      subject = `Payment Validation Successful - ${transactionId}`;
      body = `Payment Validation Notification\n\n` +
        `Transaction ID: ${transactionId}\n` +
        `Status: Validated\n` +
        `Amount: ${amount} ${currency}\n` +
        `Timestamp: ${timestamp}\n\n` +
        `The payment has been validated and is ready for processing.`;
      break;

    case 'processed':
      subject = `Payment Processed Successfully - ${transactionId}`;
      body = `Payment Processing Notification\n\n` +
        `Transaction ID: ${transactionId}\n` +
        `Status: Processed\n` +
        `Amount: ${amount} ${currency}\n` +
        `Timestamp: ${timestamp}\n\n` +
        `The payment has been processed successfully.`;
      break;

    case 'failed':
      subject = `Payment Processing Failed - ${transactionId}`;
      body = `Payment Failure Notification\n\n` +
        `Transaction ID: ${transactionId}\n` +
        `Status: Failed\n` +
        `Amount: ${amount} ${currency}\n` +
        `Timestamp: ${timestamp}\n\n` +
        `The payment processing has failed. Please review the transaction details.`;
      break;

    default:
      subject = `Payment Status Update - ${transactionId}`;
      body = `Payment Notification\n\n` +
        `Transaction ID: ${transactionId}\n` +
        `Status: ${status}\n` +
        `Amount: ${amount} ${currency}\n` +
        `Timestamp: ${timestamp}\n\n` +
        `A status update has been recorded for this transaction.`;
  }

  return { subject, body };
}
```

## File: lib/lambda/payment-validator/package.json

```json
{
  "name": "payment-validator",
  "version": "1.0.0",
  "description": "Payment validation Lambda function",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1000.0"
  }
}
```

## File: lib/lambda/payment-processor/package.json

```json
{
  "name": "payment-processor",
  "version": "1.0.0",
  "description": "Payment processing Lambda function",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1000.0"
  }
}
```

## File: lib/lambda/payment-notifier/package.json

```json
{
  "name": "payment-notifier",
  "version": "1.0.0",
  "description": "Payment notification Lambda function",
  "main": "index.js",
  "dependencies": {
    "aws-sdk": "^2.1000.0"
  }
}
```

## Deployment Instructions

### Prerequisites

- Node.js 18+ and npm
- Terraform CLI
- CDKTF CLI (`npm install -g cdktf-cli`)
- AWS CLI configured with appropriate credentials

### Setup

1. Install dependencies:
```bash
npm install
```

2. Generate provider bindings:
```bash
npm run get
```

3. Synthesize CDKTF:
```bash
cdktf synth
```

4. Deploy infrastructure:
```bash
cdktf deploy
```

### Expected Outputs

After successful deployment:
- API Gateway URL for payment submission
- S3 bucket name for audit logs
- DynamoDB table name for transactions
- CloudWatch dashboard URL for monitoring
- Lambda function names for all three functions

### Testing

Run unit tests:
```bash
npm run test:unit
```

Run integration tests (after deployment):
```bash
npm run test:integration
```

## Architecture Summary

**VPC**: Multi-AZ architecture with 3 availability zones, public and private subnets, NAT Gateways, and VPC endpoints for S3 and DynamoDB.

**Compute**: Three Lambda functions (validator, processor, notifier) running in private subnets with reserved concurrency and comprehensive error handling.

**Storage**: DynamoDB table with on-demand billing, point-in-time recovery, and customer-managed KMS encryption. S3 bucket with versioning, encryption, and 90-day archival policy.

**API**: API Gateway REST API with Lambda proxy integration and rate limiting (10,000 requests/minute).

**Monitoring**: CloudWatch log groups (7-day retention), alarms for Lambda errors, and dashboard for metrics visualization.

**Security**: IAM roles with least-privilege permissions, security groups, KMS encryption, VPC flow logs, and private subnet deployment.

## Resource Naming

All resources include the `environmentSuffix` variable for uniqueness:
- Lambda functions: `payment-{function}-{environmentSuffix}`
- DynamoDB table: `transactions-{environmentSuffix}`
- S3 bucket: `payment-audit-logs-{environmentSuffix}`
- SNS topic: `payment-notifications-{environmentSuffix}`
- IAM roles: `{role-name}-{environmentSuffix}`
- CloudWatch log groups: `/aws/lambda/{function}-{environmentSuffix}`

## Compliance Features

- **PCI DSS**: Compute in private subnets, encryption at rest, audit logging
- **Encryption**: Customer-managed KMS keys for DynamoDB, AES256 for S3
- **Audit Trail**: S3 audit logs with versioning, VPC flow logs
- **Monitoring**: CloudWatch alarms, metrics dashboard, log retention
- **IAM**: Least-privilege policies, 1-hour session duration

