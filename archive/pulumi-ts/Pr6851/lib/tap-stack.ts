/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * Arguments for configuring the TapStack component.
 */
export interface TapStackArgs {
  environmentSuffix?: string;
  notificationEmail?: string;
  primaryRegion?: string;
  secondaryRegion?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * TapStack - Multi-region payment processing infrastructure with automatic failover
 *
 * Features:
 * - Dual-region deployment (us-east-1, us-east-2)
 * - DynamoDB Global Tables for transaction storage
 * - Lambda functions for payment processing
 * - Application Load Balancers with health checks
 * - API Gateway for Lambda invocation
 * - Cross-region S3 replication for audit logs
 * - CloudWatch monitoring and alarms
 * - Route53 health checks for ALB monitoring
 */
export class TapStack extends pulumi.ComponentResource {
  // Primary outputs
  public readonly primaryApiUrl: pulumi.Output<string>;
  public readonly secondaryApiUrl: pulumi.Output<string>;
  public readonly primaryAlbDnsName: pulumi.Output<string>;
  public readonly secondaryAlbDnsName: pulumi.Output<string>;
  public readonly transactionTableName: pulumi.Output<string>;
  public readonly primaryAuditBucketName: pulumi.Output<string>;
  public readonly secondaryAuditBucketName: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;
  public readonly primaryHealthCheckId: pulumi.Output<string>;
  public readonly secondaryHealthCheckId: pulumi.Output<string>;
  public readonly primarySnsTopicArn: pulumi.Output<string>;
  public readonly secondarySnsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const notificationEmail = args.notificationEmail || 'admin@example.com';
    const primaryRegion = args.primaryRegion || 'us-east-1';
    const secondaryRegion = args.secondaryRegion || 'us-east-2';

    // Create AWS providers for both regions
    const primaryProvider = new aws.Provider(
      `primary-provider-${environmentSuffix}`,
      { region: primaryRegion },
      { parent: this }
    );

    const secondaryProvider = new aws.Provider(
      `secondary-provider-${environmentSuffix}`,
      { region: secondaryRegion },
      { parent: this }
    );

    // ========================================
    // VPC Infrastructure - Primary Region
    // ========================================

    const primaryVpc = new aws.ec2.Vpc(
      `payment-vpc-primary-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `payment-vpc-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryPrivateSubnet1 = new aws.ec2.Subnet(
      `payment-private-subnet-1a-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: `${primaryRegion}a`,
        tags: {
          Name: `payment-private-subnet-1a-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryPrivateSubnet2 = new aws.ec2.Subnet(
      `payment-private-subnet-1b-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: `${primaryRegion}b`,
        tags: {
          Name: `payment-private-subnet-1b-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryPrivateRt = new aws.ec2.RouteTable(
      `private-rt-primary-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: {
          Name: `private-rt-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `rta-private-1a-${environmentSuffix}`,
      {
        subnetId: primaryPrivateSubnet1.id,
        routeTableId: primaryPrivateRt.id,
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `rta-private-1b-${environmentSuffix}`,
      {
        subnetId: primaryPrivateSubnet2.id,
        routeTableId: primaryPrivateRt.id,
      },
      { provider: primaryProvider, parent: this }
    );

    // Public subnets for ALB
    const primaryPublicSubnet1 = new aws.ec2.Subnet(
      `payment-public-subnet-1a-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        cidrBlock: '10.0.10.0/24',
        availabilityZone: `${primaryRegion}a`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-1a-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryPublicSubnet2 = new aws.ec2.Subnet(
      `payment-public-subnet-1b-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: `${primaryRegion}b`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-1b-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Internet Gateway for public subnets
    const primaryIgw = new aws.ec2.InternetGateway(
      `payment-igw-primary-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: {
          Name: `payment-igw-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryPublicRt = new aws.ec2.RouteTable(
      `public-rt-primary-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: {
          Name: `public-rt-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.ec2.Route(
      `public-route-primary-${environmentSuffix}`,
      {
        routeTableId: primaryPublicRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: primaryIgw.id,
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `rta-public-1a-${environmentSuffix}`,
      {
        subnetId: primaryPublicSubnet1.id,
        routeTableId: primaryPublicRt.id,
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `rta-public-1b-${environmentSuffix}`,
      {
        subnetId: primaryPublicSubnet2.id,
        routeTableId: primaryPublicRt.id,
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryLambdaSg = new aws.ec2.SecurityGroup(
      `payment-lambda-sg-primary-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        description: 'Security group for payment Lambda functions',
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `payment-lambda-sg-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // VPC Endpoints for Lambda connectivity - Primary Region
    const primaryDynamodbEndpoint = new aws.ec2.VpcEndpoint(
      `dynamodb-endpoint-primary-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        serviceName: `com.amazonaws.${primaryRegion}.dynamodb`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [primaryPrivateRt.id],
        tags: {
          Name: `dynamodb-endpoint-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primarySecretsEndpoint = new aws.ec2.VpcEndpoint(
      `secrets-endpoint-primary-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        serviceName: `com.amazonaws.${primaryRegion}.secretsmanager`,
        vpcEndpointType: 'Interface',
        subnetIds: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
        securityGroupIds: [primaryLambdaSg.id],
        privateDnsEnabled: true,
        tags: {
          Name: `secrets-endpoint-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryLogsEndpoint = new aws.ec2.VpcEndpoint(
      `logs-endpoint-primary-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        serviceName: `com.amazonaws.${primaryRegion}.logs`,
        vpcEndpointType: 'Interface',
        subnetIds: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
        securityGroupIds: [primaryLambdaSg.id],
        privateDnsEnabled: true,
        tags: {
          Name: `logs-endpoint-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // ========================================
    // VPC Infrastructure - Secondary Region
    // ========================================

    const secondaryVpc = new aws.ec2.Vpc(
      `payment-vpc-secondary-${environmentSuffix}`,
      {
        cidrBlock: '10.1.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `payment-vpc-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryPrivateSubnet1 = new aws.ec2.Subnet(
      `payment-private-subnet-2a-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        cidrBlock: '10.1.1.0/24',
        availabilityZone: `${secondaryRegion}a`,
        tags: {
          Name: `payment-private-subnet-2a-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryPrivateSubnet2 = new aws.ec2.Subnet(
      `payment-private-subnet-2b-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        cidrBlock: '10.1.2.0/24',
        availabilityZone: `${secondaryRegion}b`,
        tags: {
          Name: `payment-private-subnet-2b-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryPrivateRt = new aws.ec2.RouteTable(
      `private-rt-secondary-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        tags: {
          Name: `private-rt-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `rta-private-2a-${environmentSuffix}`,
      {
        subnetId: secondaryPrivateSubnet1.id,
        routeTableId: secondaryPrivateRt.id,
      },
      { provider: secondaryProvider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `rta-private-2b-${environmentSuffix}`,
      {
        subnetId: secondaryPrivateSubnet2.id,
        routeTableId: secondaryPrivateRt.id,
      },
      { provider: secondaryProvider, parent: this }
    );

    // Public subnets for ALB
    const secondaryPublicSubnet1 = new aws.ec2.Subnet(
      `payment-public-subnet-2a-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        cidrBlock: '10.1.10.0/24',
        availabilityZone: `${secondaryRegion}a`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-2a-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryPublicSubnet2 = new aws.ec2.Subnet(
      `payment-public-subnet-2b-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        cidrBlock: '10.1.11.0/24',
        availabilityZone: `${secondaryRegion}b`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `payment-public-subnet-2b-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // Internet Gateway for public subnets
    const secondaryIgw = new aws.ec2.InternetGateway(
      `payment-igw-secondary-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        tags: {
          Name: `payment-igw-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryPublicRt = new aws.ec2.RouteTable(
      `public-rt-secondary-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        tags: {
          Name: `public-rt-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    new aws.ec2.Route(
      `public-route-secondary-${environmentSuffix}`,
      {
        routeTableId: secondaryPublicRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: secondaryIgw.id,
      },
      { provider: secondaryProvider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `rta-public-2a-${environmentSuffix}`,
      {
        subnetId: secondaryPublicSubnet1.id,
        routeTableId: secondaryPublicRt.id,
      },
      { provider: secondaryProvider, parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `rta-public-2b-${environmentSuffix}`,
      {
        subnetId: secondaryPublicSubnet2.id,
        routeTableId: secondaryPublicRt.id,
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryLambdaSg = new aws.ec2.SecurityGroup(
      `payment-lambda-sg-secondary-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        description: 'Security group for payment Lambda functions',
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `payment-lambda-sg-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // VPC Endpoints - Secondary Region
    const secondaryDynamodbEndpoint = new aws.ec2.VpcEndpoint(
      `dynamodb-endpoint-secondary-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        serviceName: `com.amazonaws.${secondaryRegion}.dynamodb`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [secondaryPrivateRt.id],
        tags: {
          Name: `dynamodb-endpoint-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondarySecretsEndpoint = new aws.ec2.VpcEndpoint(
      `secrets-endpoint-secondary-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        serviceName: `com.amazonaws.${secondaryRegion}.secretsmanager`,
        vpcEndpointType: 'Interface',
        subnetIds: [secondaryPrivateSubnet1.id, secondaryPrivateSubnet2.id],
        securityGroupIds: [secondaryLambdaSg.id],
        privateDnsEnabled: true,
        tags: {
          Name: `secrets-endpoint-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryLogsEndpoint = new aws.ec2.VpcEndpoint(
      `logs-endpoint-secondary-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        serviceName: `com.amazonaws.${secondaryRegion}.logs`,
        vpcEndpointType: 'Interface',
        subnetIds: [secondaryPrivateSubnet1.id, secondaryPrivateSubnet2.id],
        securityGroupIds: [secondaryLambdaSg.id],
        privateDnsEnabled: true,
        tags: {
          Name: `logs-endpoint-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // ========================================
    // DynamoDB Global Table
    // ========================================

    const transactionTable = new aws.dynamodb.Table(
      `payment-transactions-${environmentSuffix}`,
      {
        name: `payment-transactions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'transactionId', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        pointInTimeRecovery: {
          enabled: true,
        },
        replicas: [
          {
            regionName: secondaryRegion,
            pointInTimeRecovery: true,
          },
        ],
        tags: {
          Name: `payment-transactions-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // ========================================
    // S3 Buckets with Cross-Region Replication
    // ========================================

    const primaryAuditBucket = new aws.s3.Bucket(
      `payment-audit-logs-primary-${environmentSuffix}`,
      {
        bucket: `payment-audit-logs-primary-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            enabled: true,
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: {
          Name: `payment-audit-logs-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `primary-audit-public-access-block-${environmentSuffix}`,
      {
        bucket: primaryAuditBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider: primaryProvider, parent: this }
    );

    const secondaryAuditBucket = new aws.s3.Bucket(
      `payment-audit-logs-secondary-${environmentSuffix}`,
      {
        bucket: `payment-audit-logs-secondary-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        tags: {
          Name: `payment-audit-logs-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `secondary-audit-public-access-block-${environmentSuffix}`,
      {
        bucket: secondaryAuditBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider: secondaryProvider, parent: this }
    );

    // IAM role for S3 replication
    const s3ReplicationRole = new aws.iam.Role(
      `s3-replication-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 's3.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `s3-replication-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const s3ReplicationPolicy = new aws.iam.RolePolicy(
      `s3-replication-policy-${environmentSuffix}`,
      {
        role: s3ReplicationRole.id,
        policy: pulumi
          .all([primaryAuditBucket.arn, secondaryAuditBucket.arn])
          .apply(([sourceArn, destArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                  Resource: sourceArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObjectVersionForReplication',
                    's3:GetObjectVersionAcl',
                  ],
                  Resource: `${sourceArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:ReplicateObject', 's3:ReplicateDelete'],
                  Resource: `${destArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    new aws.s3.BucketReplicationConfig(
      `s3-replication-${environmentSuffix}`,
      {
        bucket: primaryAuditBucket.id,
        role: s3ReplicationRole.arn,
        rules: [
          {
            id: 'replicate-all',
            status: 'Enabled',
            destination: {
              bucket: secondaryAuditBucket.arn,
              storageClass: 'STANDARD',
            },
          },
        ],
      },
      { provider: primaryProvider, dependsOn: [s3ReplicationPolicy], parent: this }
    );

    // ========================================
    // Secrets Manager with Replication
    // ========================================

    const apiSecret = new aws.secretsmanager.Secret(
      `payment-api-secret-${environmentSuffix}`,
      {
        name: `payment-api-secret-${environmentSuffix}`,
        description: 'API keys and database credentials for payment processing',
        replicas: [
          {
            region: secondaryRegion,
          },
        ],
        tags: {
          Name: `payment-api-secret-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      `payment-api-secret-version-${environmentSuffix}`,
      {
        secretId: apiSecret.id,
        secretString: JSON.stringify({
          apiKey: pulumi.secret('default-api-key-change-after-deployment'),
          dbPassword: pulumi.secret('default-password-change-after-deployment'),
        }),
      },
      { provider: primaryProvider, parent: this }
    );

    // ========================================
    // Systems Manager Parameter Store
    // ========================================

    new aws.ssm.Parameter(
      `payment-config-${environmentSuffix}`,
      {
        name: `/payment-processing/${environmentSuffix}/config`,
        type: 'String',
        value: JSON.stringify({
          maxRetries: 3,
          timeout: 10000,
          region: primaryRegion,
        }),
        description: 'Payment processing configuration',
        tags: {
          Name: `payment-config-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.ssm.Parameter(
      `payment-config-secondary-${environmentSuffix}`,
      {
        name: `/payment-processing/${environmentSuffix}/config`,
        type: 'String',
        value: JSON.stringify({
          maxRetries: 3,
          timeout: 10000,
          region: secondaryRegion,
        }),
        description: 'Payment processing configuration',
        tags: {
          Name: `payment-config-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // ========================================
    // IAM Roles for Lambda
    // ========================================

    const lambdaRole = new aws.iam.Role(
      `payment-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `payment-lambda-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const lambdaVpcPolicy = new aws.iam.RolePolicyAttachment(
      `lambda-vpc-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
      `lambda-basic-policy-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    const lambdaDynamoPolicy = new aws.iam.RolePolicy(
      `lambda-dynamodb-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: transactionTable.arn.apply(tableArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:GetItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                ],
                Resource: [tableArn, `${tableArn}/*`],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    const lambdaSecretsPolicy = new aws.iam.RolePolicy(
      `lambda-secrets-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: apiSecret.arn.apply(secretArn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['secretsmanager:GetSecretValue'],
                Resource: [secretArn, `${secretArn}-*`],
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `lambda-ssm-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['ssm:GetParameter', 'ssm:GetParameters'],
              Resource: `arn:aws:ssm:*:*:parameter/payment-processing/${environmentSuffix}/*`,
            },
          ],
        }),
      },
      { parent: this }
    );

    // CloudWatch Log Groups for Lambda functions
    const primaryPaymentLogGroup = new aws.cloudwatch.LogGroup(
      `payment-processor-primary-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/payment-processor-primary-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `payment-processor-primary-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryHealthLogGroup = new aws.cloudwatch.LogGroup(
      `health-check-primary-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/health-check-primary-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `health-check-primary-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const secondaryPaymentLogGroup = new aws.cloudwatch.LogGroup(
      `payment-processor-secondary-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/payment-processor-secondary-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `payment-processor-secondary-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryHealthLogGroup = new aws.cloudwatch.LogGroup(
      `health-check-secondary-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/health-check-secondary-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `health-check-secondary-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // ========================================
    // Lambda Functions - Primary Region
    // ========================================

    const primaryPaymentLambda = new aws.lambda.Function(
      `payment-processor-primary-${environmentSuffix}`,
      {
        name: `payment-processor-primary-${environmentSuffix}`,
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 10,
        memorySize: 256,
        environment: {
          variables: {
            TABLE_NAME: transactionTable.name,
            SECRET_ARN: apiSecret.arn,
            REGION: primaryRegion,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
          securityGroupIds: [primaryLambdaSg.id],
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const secretsClient = new SecretsManagerClient({ region: process.env.REGION });

exports.handler = async (event) => {
    console.log('Processing payment request:', JSON.stringify(event));

    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { amount, currency, customerId } = body;

        if (!amount || !currency) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: amount, currency' })
            };
        }

        const secretResponse = await secretsClient.send(new GetSecretValueCommand({
            SecretId: process.env.SECRET_ARN
        }));
        const secrets = JSON.parse(secretResponse.SecretString);

        const transactionId = \`txn-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
        const timestamp = Date.now();

        await dynamoClient.send(new PutItemCommand({
            TableName: process.env.TABLE_NAME,
            Item: {
                transactionId: { S: transactionId },
                timestamp: { N: timestamp.toString() },
                amount: { N: amount.toString() },
                currency: { S: currency },
                customerId: { S: customerId || 'anonymous' },
                status: { S: 'completed' },
                region: { S: process.env.REGION },
                processedAt: { S: new Date().toISOString() }
            }
        }));

        console.log(\`Payment processed successfully: \${transactionId}\`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                status: 'success',
                transactionId: transactionId,
                amount: amount,
                currency: currency,
                region: process.env.REGION,
                timestamp: timestamp
            })
        };
    } catch (error) {
        console.error('Payment processing error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Payment processing failed',
                message: error.message
            })
        };
    }
};
        `),
        }),
        tags: {
          Name: `payment-processor-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      {
        provider: primaryProvider,
        parent: this,
        dependsOn: [
          lambdaVpcPolicy,
          lambdaBasicPolicy,
          lambdaDynamoPolicy,
          lambdaSecretsPolicy,
          primaryPaymentLogGroup,
          primaryDynamodbEndpoint,
          primarySecretsEndpoint,
          primaryLogsEndpoint,
        ],
      }
    );

    const primaryHealthLambda = new aws.lambda.Function(
      `health-check-primary-${environmentSuffix}`,
      {
        name: `health-check-primary-${environmentSuffix}`,
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 1,
        memorySize: 128,
        environment: {
          variables: {
            REGION: primaryRegion,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    const healthStatus = {
        status: 'healthy',
        region: process.env.REGION,
        timestamp: Date.now(),
        service: 'payment-api'
    };

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(healthStatus)
    };
};
        `),
        }),
        tags: {
          Name: `health-check-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      {
        provider: primaryProvider,
        parent: this,
        dependsOn: [lambdaBasicPolicy, primaryHealthLogGroup],
      }
    );

    // ========================================
    // Lambda Functions - Secondary Region
    // ========================================

    const secondaryPaymentLambda = new aws.lambda.Function(
      `payment-processor-secondary-${environmentSuffix}`,
      {
        name: `payment-processor-secondary-${environmentSuffix}`,
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 10,
        memorySize: 256,
        environment: {
          variables: {
            TABLE_NAME: transactionTable.name,
            SECRET_ARN: apiSecret.arn,
            REGION: secondaryRegion,
            ENVIRONMENT_SUFFIX: environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: [secondaryPrivateSubnet1.id, secondaryPrivateSubnet2.id],
          securityGroupIds: [secondaryLambdaSg.id],
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const secretsClient = new SecretsManagerClient({ region: process.env.REGION });

exports.handler = async (event) => {
    console.log('Processing payment request:', JSON.stringify(event));

    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { amount, currency, customerId } = body;

        if (!amount || !currency) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: amount, currency' })
            };
        }

        const secretResponse = await secretsClient.send(new GetSecretValueCommand({
            SecretId: process.env.SECRET_ARN
        }));
        const secrets = JSON.parse(secretResponse.SecretString);

        const transactionId = \`txn-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
        const timestamp = Date.now();

        await dynamoClient.send(new PutItemCommand({
            TableName: process.env.TABLE_NAME,
            Item: {
                transactionId: { S: transactionId },
                timestamp: { N: timestamp.toString() },
                amount: { N: amount.toString() },
                currency: { S: currency },
                customerId: { S: customerId || 'anonymous' },
                status: { S: 'completed' },
                region: { S: process.env.REGION },
                processedAt: { S: new Date().toISOString() }
            }
        }));

        console.log(\`Payment processed successfully: \${transactionId}\`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                status: 'success',
                transactionId: transactionId,
                amount: amount,
                currency: currency,
                region: process.env.REGION,
                timestamp: timestamp
            })
        };
    } catch (error) {
        console.error('Payment processing error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Payment processing failed',
                message: error.message
            })
        };
    }
};
        `),
        }),
        tags: {
          Name: `payment-processor-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      {
        provider: secondaryProvider,
        parent: this,
        dependsOn: [
          lambdaVpcPolicy,
          lambdaBasicPolicy,
          lambdaDynamoPolicy,
          lambdaSecretsPolicy,
          secondaryPaymentLogGroup,
          secondaryDynamodbEndpoint,
          secondarySecretsEndpoint,
          secondaryLogsEndpoint,
        ],
      }
    );

    const secondaryHealthLambda = new aws.lambda.Function(
      `health-check-secondary-${environmentSuffix}`,
      {
        name: `health-check-secondary-${environmentSuffix}`,
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 1,
        memorySize: 128,
        environment: {
          variables: {
            REGION: secondaryRegion,
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    const healthStatus = {
        status: 'healthy',
        region: process.env.REGION,
        timestamp: Date.now(),
        service: 'payment-api'
    };

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(healthStatus)
    };
};
        `),
        }),
        tags: {
          Name: `health-check-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      {
        provider: secondaryProvider,
        parent: this,
        dependsOn: [lambdaBasicPolicy, secondaryHealthLogGroup],
      }
    );

    // ========================================
    // API Gateway - Primary Region
    // ========================================

    const primaryApi = new aws.apigateway.RestApi(
      `payment-api-primary-${environmentSuffix}`,
      {
        name: `payment-api-primary-${environmentSuffix}`,
        description: 'Payment processing API - Primary Region',
        tags: {
          Name: `payment-api-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryPaymentResource = new aws.apigateway.Resource(
      `payment-resource-primary-${environmentSuffix}`,
      {
        restApi: primaryApi.id,
        parentId: primaryApi.rootResourceId,
        pathPart: 'payment',
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryPaymentMethod = new aws.apigateway.Method(
      `payment-method-primary-${environmentSuffix}`,
      {
        restApi: primaryApi.id,
        resourceId: primaryPaymentResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryPaymentIntegration = new aws.apigateway.Integration(
      `payment-integration-primary-${environmentSuffix}`,
      {
        restApi: primaryApi.id,
        resourceId: primaryPaymentResource.id,
        httpMethod: primaryPaymentMethod.httpMethod,
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: primaryPaymentLambda.invokeArn,
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryHealthResource = new aws.apigateway.Resource(
      `health-resource-primary-${environmentSuffix}`,
      {
        restApi: primaryApi.id,
        parentId: primaryApi.rootResourceId,
        pathPart: 'health',
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryHealthMethod = new aws.apigateway.Method(
      `health-method-primary-${environmentSuffix}`,
      {
        restApi: primaryApi.id,
        resourceId: primaryHealthResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryHealthIntegration = new aws.apigateway.Integration(
      `health-integration-primary-${environmentSuffix}`,
      {
        restApi: primaryApi.id,
        resourceId: primaryHealthResource.id,
        httpMethod: primaryHealthMethod.httpMethod,
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: primaryHealthLambda.invokeArn,
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryDeployment = new aws.apigateway.Deployment(
      `api-deployment-primary-${environmentSuffix}`,
      {
        restApi: primaryApi.id,
        triggers: {
          redeployment: pulumi
            .all([primaryPaymentIntegration.id, primaryHealthIntegration.id])
            .apply(([p, h]) => JSON.stringify({ payment: p, health: h })),
        },
      },
      {
        provider: primaryProvider,
        parent: this,
        dependsOn: [primaryPaymentIntegration, primaryHealthIntegration],
      }
    );

    const primaryApiLogGroup = new aws.cloudwatch.LogGroup(
      `api-gateway-primary-logs-${environmentSuffix}`,
      {
        name: `/aws/apigateway/payment-api-primary-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `api-gateway-primary-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    const primaryStage = new aws.apigateway.Stage(
      `api-stage-primary-${environmentSuffix}`,
      {
        deployment: primaryDeployment.id,
        restApi: primaryApi.id,
        stageName: 'prod',
        xrayTracingEnabled: true,
        tags: {
          Name: `api-stage-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this, dependsOn: [primaryApiLogGroup] }
    );

    new aws.lambda.Permission(
      `payment-lambda-permission-primary-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: primaryPaymentLambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${primaryApi.executionArn}/*/*`,
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.lambda.Permission(
      `health-lambda-permission-primary-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: primaryHealthLambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${primaryApi.executionArn}/*/*`,
      },
      { provider: primaryProvider, parent: this }
    );

    // ========================================
    // API Gateway - Secondary Region
    // ========================================

    const secondaryApi = new aws.apigateway.RestApi(
      `payment-api-secondary-${environmentSuffix}`,
      {
        name: `payment-api-secondary-${environmentSuffix}`,
        description: 'Payment processing API - Secondary Region',
        tags: {
          Name: `payment-api-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryPaymentResource = new aws.apigateway.Resource(
      `payment-resource-secondary-${environmentSuffix}`,
      {
        restApi: secondaryApi.id,
        parentId: secondaryApi.rootResourceId,
        pathPart: 'payment',
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryPaymentMethod = new aws.apigateway.Method(
      `payment-method-secondary-${environmentSuffix}`,
      {
        restApi: secondaryApi.id,
        resourceId: secondaryPaymentResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryPaymentIntegration = new aws.apigateway.Integration(
      `payment-integration-secondary-${environmentSuffix}`,
      {
        restApi: secondaryApi.id,
        resourceId: secondaryPaymentResource.id,
        httpMethod: secondaryPaymentMethod.httpMethod,
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: secondaryPaymentLambda.invokeArn,
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryHealthResource = new aws.apigateway.Resource(
      `health-resource-secondary-${environmentSuffix}`,
      {
        restApi: secondaryApi.id,
        parentId: secondaryApi.rootResourceId,
        pathPart: 'health',
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryHealthMethod = new aws.apigateway.Method(
      `health-method-secondary-${environmentSuffix}`,
      {
        restApi: secondaryApi.id,
        resourceId: secondaryHealthResource.id,
        httpMethod: 'GET',
        authorization: 'NONE',
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryHealthIntegration = new aws.apigateway.Integration(
      `health-integration-secondary-${environmentSuffix}`,
      {
        restApi: secondaryApi.id,
        resourceId: secondaryHealthResource.id,
        httpMethod: secondaryHealthMethod.httpMethod,
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: secondaryHealthLambda.invokeArn,
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryDeployment = new aws.apigateway.Deployment(
      `api-deployment-secondary-${environmentSuffix}`,
      {
        restApi: secondaryApi.id,
        triggers: {
          redeployment: pulumi
            .all([secondaryPaymentIntegration.id, secondaryHealthIntegration.id])
            .apply(([p, h]) => JSON.stringify({ payment: p, health: h })),
        },
      },
      {
        provider: secondaryProvider,
        parent: this,
        dependsOn: [secondaryPaymentIntegration, secondaryHealthIntegration],
      }
    );

    const secondaryApiLogGroup = new aws.cloudwatch.LogGroup(
      `api-gateway-secondary-logs-${environmentSuffix}`,
      {
        name: `/aws/apigateway/payment-api-secondary-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `api-gateway-secondary-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    const secondaryStage = new aws.apigateway.Stage(
      `api-stage-secondary-${environmentSuffix}`,
      {
        deployment: secondaryDeployment.id,
        restApi: secondaryApi.id,
        stageName: 'prod',
        xrayTracingEnabled: true,
        tags: {
          Name: `api-stage-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this, dependsOn: [secondaryApiLogGroup] }
    );

    new aws.lambda.Permission(
      `payment-lambda-permission-secondary-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: secondaryPaymentLambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${secondaryApi.executionArn}/*/*`,
      },
      { provider: secondaryProvider, parent: this }
    );

    new aws.lambda.Permission(
      `health-lambda-permission-secondary-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: secondaryHealthLambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${secondaryApi.executionArn}/*/*`,
      },
      { provider: secondaryProvider, parent: this }
    );

    // ========================================
    // SNS Topics and Subscriptions
    // ========================================

    const primarySnsTopic = new aws.sns.Topic(
      `payment-failover-topic-primary-${environmentSuffix}`,
      {
        name: `payment-failover-topic-primary-${environmentSuffix}`,
        displayName: 'Payment API Failover Notifications - Primary',
        tags: {
          Name: `payment-failover-topic-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.sns.TopicSubscription(
      `payment-sns-subscription-primary-${environmentSuffix}`,
      {
        topic: primarySnsTopic.arn,
        protocol: 'email',
        endpoint: notificationEmail,
      },
      { provider: primaryProvider, parent: this }
    );

    const secondarySnsTopic = new aws.sns.Topic(
      `payment-failover-topic-secondary-${environmentSuffix}`,
      {
        name: `payment-failover-topic-secondary-${environmentSuffix}`,
        displayName: 'Payment API Failover Notifications - Secondary',
        tags: {
          Name: `payment-failover-topic-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    new aws.sns.TopicSubscription(
      `payment-sns-subscription-secondary-${environmentSuffix}`,
      {
        topic: secondarySnsTopic.arn,
        protocol: 'email',
        endpoint: notificationEmail,
      },
      { provider: secondaryProvider, parent: this }
    );

    // ========================================
    // Application Load Balancer Infrastructure
    // ========================================

    // Security group for Primary ALB
    const primaryAlbSg = new aws.ec2.SecurityGroup(
      `payment-alb-sg-primary-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        description: 'Security group for payment ALB - Primary',
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from internet',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from internet',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `payment-alb-sg-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Security group for Secondary ALB
    const secondaryAlbSg = new aws.ec2.SecurityGroup(
      `payment-alb-sg-secondary-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        description: 'Security group for payment ALB - Secondary',
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from internet',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from internet',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `payment-alb-sg-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // Primary ALB
    const primaryAlb = new aws.lb.LoadBalancer(
      `payment-alb-primary-${environmentSuffix}`,
      {
        name: `payment-alb-pri-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [primaryAlbSg.id],
        subnets: [primaryPublicSubnet1.id, primaryPublicSubnet2.id],
        enableDeletionProtection: false,
        tags: {
          Name: `payment-alb-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Primary ALB Target Group
    const primaryAlbTargetGroup = new aws.lb.TargetGroup(
      `payment-alb-tg-primary-${environmentSuffix}`,
      {
        name: `payment-alb-tg-pri-${environmentSuffix}`,
        targetType: 'lambda',
        tags: {
          Name: `payment-alb-tg-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Lambda permission for Primary ALB
    const primaryAlbLambdaPermission = new aws.lambda.Permission(
      `payment-lambda-alb-permission-primary-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: primaryPaymentLambda.name,
        principal: 'elasticloadbalancing.amazonaws.com',
        sourceArn: primaryAlbTargetGroup.arn,
      },
      { provider: primaryProvider, parent: this }
    );

    // Attach Lambda to Primary Target Group
    new aws.lb.TargetGroupAttachment(
      `payment-alb-tg-attach-primary-${environmentSuffix}`,
      {
        targetGroupArn: primaryAlbTargetGroup.arn,
        targetId: primaryPaymentLambda.arn,
      },
      { provider: primaryProvider, parent: this, dependsOn: [primaryPaymentLambda, primaryAlbLambdaPermission] }
    );

    // Primary ALB Listener
    new aws.lb.Listener(
      `payment-alb-listener-primary-${environmentSuffix}`,
      {
        loadBalancerArn: primaryAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: primaryAlbTargetGroup.arn,
          },
        ],
      },
      { provider: primaryProvider, parent: this }
    );

    // Secondary ALB
    const secondaryAlb = new aws.lb.LoadBalancer(
      `payment-alb-secondary-${environmentSuffix}`,
      {
        name: `payment-alb-sec-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [secondaryAlbSg.id],
        subnets: [secondaryPublicSubnet1.id, secondaryPublicSubnet2.id],
        enableDeletionProtection: false,
        tags: {
          Name: `payment-alb-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // Secondary ALB Target Group
    const secondaryAlbTargetGroup = new aws.lb.TargetGroup(
      `payment-alb-tg-secondary-${environmentSuffix}`,
      {
        name: `payment-alb-tg-sec-${environmentSuffix}`,
        targetType: 'lambda',
        tags: {
          Name: `payment-alb-tg-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // Lambda permission for Secondary ALB
    const secondaryAlbLambdaPermission = new aws.lambda.Permission(
      `payment-lambda-alb-permission-secondary-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: secondaryPaymentLambda.name,
        principal: 'elasticloadbalancing.amazonaws.com',
        sourceArn: secondaryAlbTargetGroup.arn,
      },
      { provider: secondaryProvider, parent: this }
    );

    // Attach Lambda to Secondary Target Group
    new aws.lb.TargetGroupAttachment(
      `payment-alb-tg-attach-secondary-${environmentSuffix}`,
      {
        targetGroupArn: secondaryAlbTargetGroup.arn,
        targetId: secondaryPaymentLambda.arn,
      },
      { provider: secondaryProvider, parent: this, dependsOn: [secondaryPaymentLambda, secondaryAlbLambdaPermission] }
    );

    // Secondary ALB Listener
    new aws.lb.Listener(
      `payment-alb-listener-secondary-${environmentSuffix}`,
      {
        loadBalancerArn: secondaryAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: secondaryAlbTargetGroup.arn,
          },
        ],
      },
      { provider: secondaryProvider, parent: this }
    );

    // ========================================
    // Route53 Health Checks for ALB Monitoring
    // ========================================

    const primaryHealthCheck = new aws.route53.HealthCheck(
      `payment-health-check-primary-${environmentSuffix}`,
      {
        type: 'HTTP',
        resourcePath: '/',
        fqdn: primaryAlb.dnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        measureLatency: true,
        tags: {
          Name: `payment-health-check-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const secondaryHealthCheck = new aws.route53.HealthCheck(
      `payment-health-check-secondary-${environmentSuffix}`,
      {
        type: 'HTTP',
        resourcePath: '/',
        fqdn: secondaryAlb.dnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        measureLatency: true,
        tags: {
          Name: `payment-health-check-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // ========================================
    // CloudWatch Alarms
    // ========================================

    new aws.cloudwatch.MetricAlarm(
      `payment-health-alarm-primary-${environmentSuffix}`,
      {
        name: `payment-health-alarm-primary-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthCheckStatus',
        namespace: 'AWS/Route53',
        period: 60,
        statistic: 'Minimum',
        threshold: 1,
        alarmDescription: 'Alert when primary API health check fails',
        alarmActions: [primarySnsTopic.arn],
        dimensions: {
          HealthCheckId: primaryHealthCheck.id,
        },
        tags: {
          Name: `payment-health-alarm-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `payment-health-alarm-secondary-${environmentSuffix}`,
      {
        name: `payment-health-alarm-secondary-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthCheckStatus',
        namespace: 'AWS/Route53',
        period: 60,
        statistic: 'Minimum',
        threshold: 1,
        alarmDescription: 'Alert when secondary API health check fails',
        alarmActions: [secondarySnsTopic.arn],
        dimensions: {
          HealthCheckId: secondaryHealthCheck.id,
        },
        tags: {
          Name: `payment-health-alarm-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      `payment-latency-alarm-primary-${environmentSuffix}`,
      {
        name: `payment-latency-alarm-primary-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Latency',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Average',
        threshold: 500,
        alarmDescription: 'Alert when API latency exceeds 500ms',
        alarmActions: [primarySnsTopic.arn],
        dimensions: {
          ApiId: primaryApi.id,
          Stage: 'prod',
        },
        tags: {
          Name: `payment-latency-alarm-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this, dependsOn: [primaryStage] }
    );

    new aws.cloudwatch.MetricAlarm(
      `payment-latency-alarm-secondary-${environmentSuffix}`,
      {
        name: `payment-latency-alarm-secondary-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Latency',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Average',
        threshold: 500,
        alarmDescription: 'Alert when API latency exceeds 500ms',
        alarmActions: [secondarySnsTopic.arn],
        dimensions: {
          ApiId: secondaryApi.id,
          Stage: 'prod',
        },
        tags: {
          Name: `payment-latency-alarm-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this, dependsOn: [secondaryStage] }
    );

    new aws.cloudwatch.MetricAlarm(
      `payment-error-alarm-primary-${environmentSuffix}`,
      {
        name: `payment-error-alarm-primary-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '5XXError',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Alert when API error count exceeds threshold',
        alarmActions: [primarySnsTopic.arn],
        dimensions: {
          ApiId: primaryApi.id,
          Stage: 'prod',
        },
        tags: {
          Name: `payment-error-alarm-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this, dependsOn: [primaryStage] }
    );

    new aws.cloudwatch.MetricAlarm(
      `payment-error-alarm-secondary-${environmentSuffix}`,
      {
        name: `payment-error-alarm-secondary-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '5XXError',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Alert when API error count exceeds threshold',
        alarmActions: [secondarySnsTopic.arn],
        dimensions: {
          ApiId: secondaryApi.id,
          Stage: 'prod',
        },
        tags: {
          Name: `payment-error-alarm-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this, dependsOn: [secondaryStage] }
    );

    // Set output properties
    this.primaryApiUrl = pulumi.interpolate`https://${primaryApi.id}.execute-api.${primaryRegion}.amazonaws.com/prod`;
    this.secondaryApiUrl = pulumi.interpolate`https://${secondaryApi.id}.execute-api.${secondaryRegion}.amazonaws.com/prod`;
    this.primaryAlbDnsName = primaryAlb.dnsName;
    this.secondaryAlbDnsName = secondaryAlb.dnsName;
    this.transactionTableName = transactionTable.name;
    this.primaryAuditBucketName = primaryAuditBucket.bucket;
    this.secondaryAuditBucketName = secondaryAuditBucket.bucket;
    this.secretArn = apiSecret.arn;
    this.primaryHealthCheckId = primaryHealthCheck.id;
    this.secondaryHealthCheckId = secondaryHealthCheck.id;
    this.primarySnsTopicArn = primarySnsTopic.arn;
    this.secondarySnsTopicArn = secondarySnsTopic.arn;

    this.registerOutputs({
      primaryApiUrl: this.primaryApiUrl,
      secondaryApiUrl: this.secondaryApiUrl,
      primaryAlbDnsName: this.primaryAlbDnsName,
      secondaryAlbDnsName: this.secondaryAlbDnsName,
      transactionTableName: this.transactionTableName,
      primaryAuditBucketName: this.primaryAuditBucketName,
      secondaryAuditBucketName: this.secondaryAuditBucketName,
      secretArn: this.secretArn,
      primaryHealthCheckId: this.primaryHealthCheckId,
      secondaryHealthCheckId: this.secondaryHealthCheckId,
      primarySnsTopicArn: this.primarySnsTopicArn,
      secondarySnsTopicArn: this.secondarySnsTopicArn,
    });
  }
}
