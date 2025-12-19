import { Construct } from 'constructs';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';

// Fixed: Updated to WAFv2 imports
import { Wafv2WebAcl } from '@cdktf/provider-aws/lib/wafv2-web-acl';
import { Wafv2WebAclAssociation } from '@cdktf/provider-aws/lib/wafv2-web-acl-association';

import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';

import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';

import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

import { ShieldProtection } from '@cdktf/provider-aws/lib/shield-protection';

export interface SecureInfraConfig {
  region: string;
  vpcCidr: string;
  allowedSshCidr: string;
  dbUsername: string;
  dbName: string;
  companyName: string;
  environment: string;
}

// VPC Module - Multi-AZ network infrastructure
export class SecureVpcConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly flowLogsRole: IamRole;

  constructor(scope: Construct, id: string, config: SecureInfraConfig) {
    super(scope, id);

    // Get availability zones for multi-AZ deployment
    const azs = new DataAwsAvailabilityZones(this, 'availability-zones', {
      state: 'available',
    });

    // Create VPC with DNS support for secure communication
    this.vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.companyName}-${config.environment}-vpc`,
        Environment: config.environment,
        Purpose: 'Secure multi-AZ infrastructure',
      },
    });

    // Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.companyName}-${config.environment}-igw`,
      },
    });

    // Create flow logs role ONCE outside the loop
    this.flowLogsRole = new IamRole(this, 'flow-logs-role', {
      name: `${config.companyName}-${config.environment}-flow-logs-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${config.companyName}-${config.environment}-flow-logs-role`,
        Purpose: 'VPC Flow Logs CloudWatch delivery',
      },
    });

    new IamRolePolicy(this, 'flow-logs-custom-policy', {
      name: `${config.companyName}-${config.environment}-flow-logs-policy`,
      role: this.flowLogsRole.name,
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

    // new IamRolePolicyAttachment(this, 'flow-logs-policy', {
    //   role: this.flowLogsRole.name,
    //   policyArn:
    //     'arn:aws:iam::aws:policy/service-role/VPCFlowLogsDeliveryRolePolicy',
    // });

    // Create public and private subnets
    this.publicSubnets = [];
    this.privateSubnets = [];

    for (let i = 0; i < 2; i++) {
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.companyName}-${config.environment}-public-subnet-${i + 1}`,
          Type: 'Public',
          Tier: 'Web',
        },
      });

      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        tags: {
          Name: `${config.companyName}-${config.environment}-private-subnet-${i + 1}`,
          Type: 'Private',
          Tier: 'Application',
        },
      });

      this.publicSubnets.push(publicSubnet);
      this.privateSubnets.push(privateSubnet);

      // Route table for public subnet
      const publicRouteTable = new RouteTable(this, `public-rt-${i}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `${config.companyName}-${config.environment}-public-rt-${i + 1}`,
        },
      });

      new Route(this, `public-route-${i}`, {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      });

      new RouteTableAssociation(this, `public-rt-association-${i}`, {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      });
    }
  }
}

// Security Groups Module - Network access control
export class SecurityGroupsConstruct extends Construct {
  public readonly webSecurityGroup: SecurityGroup;
  public readonly dbSecurityGroup: SecurityGroup;
  public readonly lambdaSecurityGroup: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    vpc: Vpc,
    config: SecureInfraConfig
  ) {
    super(scope, id);

    this.webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      name: `${config.companyName}-${config.environment}-web-sg`,
      description: 'Security group for web tier with restricted SSH access',
      vpcId: vpc.id,
      tags: {
        Name: `${config.companyName}-${config.environment}-web-sg`,
        Purpose: 'Web tier access control',
      },
    });

    new SecurityGroupRule(this, 'ssh-rule', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [config.allowedSshCidr],
      securityGroupId: this.webSecurityGroup.id,
      description: 'SSH access from company network only',
    });

    new SecurityGroupRule(this, 'https-rule', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
      description: 'HTTPS access from internet',
    });

    this.dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `${config.companyName}-${config.environment}-db-sg`,
      description: 'Database security group - private access only',
      vpcId: vpc.id,
      tags: {
        Name: `${config.companyName}-${config.environment}-db-sg`,
        Purpose: 'Database access control',
      },
    });

    new SecurityGroupRule(this, 'db-rule', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.dbSecurityGroup.id,
      description: 'MySQL access from web tier only',
    });

    this.lambdaSecurityGroup = new SecurityGroup(this, 'lambda-sg', {
      name: `${config.companyName}-${config.environment}-lambda-sg`,
      description: 'Security group for Lambda functions',
      vpcId: vpc.id,
      tags: {
        Name: `${config.companyName}-${config.environment}-lambda-sg`,
        Purpose: 'Lambda function network access',
      },
    });

    new SecurityGroupRule(this, 'lambda-egress-rule', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.lambdaSecurityGroup.id,
      description: 'HTTPS outbound access for Lambda',
    });
  }
}

// KMS Module - Encryption key management
export class KmsConstruct extends Construct {
  public readonly kmsKey: KmsKey;
  public readonly kmsAlias: KmsAlias;

  constructor(scope: Construct, id: string, config: SecureInfraConfig) {
    super(scope, id);

    const currentAccount = new DataAwsCallerIdentity(this, 'current');

    this.kmsKey = new KmsKey(this, 'main-kms-key', {
      description: 'KMS key for encrypting sensitive data',
      keyUsage: 'ENCRYPT_DECRYPT',
      customerMasterKeySpec: 'SYMMETRIC_DEFAULT',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Id: 'key-policy-1',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${currentAccount.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${config.companyName}-${config.environment}-kms-key`,
        Purpose: 'Data encryption at rest',
      },
    });

    this.kmsAlias = new KmsAlias(this, 'kms-alias', {
      name: `alias/${config.companyName}-${config.environment}-key`,
      targetKeyId: this.kmsKey.keyId,
    });
  }
}

// IAM Module - Least privilege access control
export class IamConstruct extends Construct {
  public readonly lambdaRole: IamRole;
  public readonly ec2Role: IamRole;
  public readonly configRole: IamRole;

  constructor(scope: Construct, id: string, config: SecureInfraConfig) {
    super(scope, id);

    this.lambdaRole = new IamRole(this, 'lambda-role', {
      name: `${config.companyName}-${config.environment}-lambda-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${config.companyName}-${config.environment}-lambda-role`,
        Purpose: 'Lambda function execution with minimal permissions',
      },
    });

    new IamRolePolicyAttachment(this, 'lambda-basic-policy', {
      role: this.lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${config.companyName}-${config.environment}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${config.companyName}-${config.environment}-ec2-role`,
        Purpose: 'EC2 instance role with limited permissions',
      },
    });

    this.configRole = new IamRole(this, 'config-role', {
      name: `${config.companyName}-${config.environment}-config-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'config.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${config.companyName}-${config.environment}-config-role`,
        Purpose: 'AWS Config service role for compliance tracking',
      },
    });

    new IamRolePolicyAttachment(this, 'config-service-policy', {
      role: this.configRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole', // Fixed: Added AWS_ prefix
    });
  }
}

// S3 Module - Secure object storage
export class S3Construct extends Construct {
  public readonly bucket: S3Bucket;
  public readonly configBucket: S3Bucket;

  constructor(
    scope: Construct,
    id: string,
    kmsKey: KmsKey,
    config: SecureInfraConfig
  ) {
    super(scope, id);

    this.bucket = new S3Bucket(this, 'main-bucket', {
      bucket: `${config.companyName}-${config.environment}-main-bucket-1234`,
      tags: {
        Name: `${config.companyName}-${config.environment}-main-bucket`,
        Purpose: 'Application data storage with encryption',
      },
    });

    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    this.configBucket = new S3Bucket(this, 'config-bucket', {
      bucket: `${config.companyName}-${config.environment}-config-bucket-1234`,
      tags: {
        Name: `${config.companyName}-${config.environment}-config-bucket`,
        Purpose: 'AWS Config compliance tracking',
      },
    });

    new S3BucketVersioningA(this, 'config-bucket-versioning', {
      bucket: this.configBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'config-bucket-encryption',
      {
        bucket: this.configBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );
  }
}

// Lambda Module - Serverless compute with logging
export class LambdaConstruct extends Construct {
  public readonly lambdaFunction: LambdaFunction;
  public readonly logGroup: CloudwatchLogGroup;

  constructor(
    scope: Construct,
    id: string,
    role: IamRole,
    securityGroup: SecurityGroup,
    subnets: Subnet[],
    config: SecureInfraConfig
  ) {
    super(scope, id);

    this.logGroup = new CloudwatchLogGroup(this, 'lambda-log-group', {
      name: `/aws/lambda/${config.companyName}-${config.environment}-function`,
      retentionInDays: 14,
      tags: {
        Name: `${config.companyName}-${config.environment}-lambda-logs`,
        Purpose: 'Lambda function logging for security monitoring',
      },
    });

    this.lambdaFunction = new LambdaFunction(this, 'main-lambda', {
      functionName: `${config.companyName}-${config.environment}-function`,
      runtime: 'python3.9',
      handler: 'lambda_function.handler',
      role: role.arn,
      s3Bucket: 'lambda-ts-12345',
      s3Key: 'lambda.zip',
      sourceCodeHash: 'placeholder-hash',
      vpcConfig: {
        subnetIds: subnets.map(subnet => subnet.id),
        securityGroupIds: [securityGroup.id],
      },
      environment: {
        variables: {
          ENVIRONMENT: config.environment,
          LOG_LEVEL: 'INFO',
        },
      },
      dependsOn: [this.logGroup],
      tags: {
        Name: `${config.companyName}-${config.environment}-lambda`,
        Purpose: 'Secure serverless compute',
      },
    });
  }
}

// API Gateway with WAFv2 Module - Protected API endpoints
export class ApiGatewayConstruct extends Construct {
  public readonly api: ApiGatewayRestApi;
  public readonly wafAcl: Wafv2WebAcl;
  public readonly deployment: ApiGatewayDeployment;
  public readonly stage: ApiGatewayStage;

  constructor(
    scope: Construct,
    id: string,
    lambdaFunction: LambdaFunction,
    config: SecureInfraConfig
  ) {
    super(scope, id);

    this.api = new ApiGatewayRestApi(this, 'api', {
      name: `${config.companyName}-${config.environment}-api`,
      description: 'Secure API Gateway with WAF protection',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Name: `${config.companyName}-${config.environment}-api`,
        Purpose: 'Secure API endpoints with WAF protection',
      },
    });

    const apiResource = new ApiGatewayResource(this, 'api-resource', {
      restApiId: this.api.id,
      parentId: this.api.rootResourceId,
      pathPart: 'secure',
    });

    const apiMethod = new ApiGatewayMethod(this, 'api-method', {
      restApiId: this.api.id,
      resourceId: apiResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    });

    // Create only ONE integration
    const apiIntegration = new ApiGatewayIntegration(
      this,
      'lambda-integration',
      {
        restApiId: this.api.id,
        resourceId: apiResource.id,
        httpMethod: 'POST',
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambdaFunction.invokeArn,
      }
    );

    this.deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      dependsOn: [apiIntegration, apiMethod], // Depend on both method and integration
      restApiId: this.api.id,
    });

    this.stage = new ApiGatewayStage(this, 'api-stage', {
      stageName: config.environment,
      restApiId: this.api.id,
      deploymentId: this.deployment.id,
      tags: {
        Name: `${config.companyName}-${config.environment}-api-stage`,
        Purpose: 'API Gateway stage',
      },
    });

    // Fixed: Updated to WAFv2 with correct configuration
    this.wafAcl = new Wafv2WebAcl(this, 'waf-acl', {
      name: `${config.companyName}-${config.environment}-waf`,
      scope: 'REGIONAL',
      defaultAction: {
        allow: {},
      },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: `${config.companyName}WAF`,
      },
      tags: {
        Name: `${config.companyName}-${config.environment}-waf`,
        Purpose: 'API Gateway DDoS and attack protection',
      },
    });

    // Fixed: Updated to WAFv2 association
    new Wafv2WebAclAssociation(this, 'waf-association', {
      resourceArn: this.stage.arn,
      webAclArn: this.wafAcl.arn,
    });
  }
}

// RDS Module - Managed database with backups
export class RdsConstruct extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;

  constructor(
    scope: Construct,
    id: string,
    securityGroup: SecurityGroup,
    subnets: Subnet[],
    kmsKey: KmsKey,
    config: SecureInfraConfig
  ) {
    super(scope, id);

    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.companyName}-${config.environment}-db-subnet-group`,
      subnetIds: subnets.map(subnet => subnet.id),
      tags: {
        Name: `${config.companyName}-${config.environment}-db-subnet-group`,
        Purpose: 'Multi-AZ database subnet group',
      },
    });

    this.dbInstance = new DbInstance(this, 'database', {
      identifier: `${config.companyName}-${config.environment}-db`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      dbName: config.dbName,
      username: config.dbUsername,
      manageMasterUserPassword: true,
      vpcSecurityGroupIds: [securityGroup.id],
      dbSubnetGroupName: this.dbSubnetGroup.name,
      multiAz: true,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.companyName}-${config.environment}-final-snapshot`,
      tags: {
        Name: `${config.companyName}-${config.environment}-database`,
        Purpose: 'Encrypted database with automated backups',
      },
    });
  }
}

// VPC Flow Logs Module - Network traffic monitoring
export class VpcFlowLogsConstruct extends Construct {
  public readonly flowLogs: FlowLog;
  public readonly logGroup: CloudwatchLogGroup;

  constructor(
    scope: Construct,
    id: string,
    vpc: Vpc,
    flowLogsRole: IamRole, // Add this parameter
    config: SecureInfraConfig
  ) {
    super(scope, id);

    this.logGroup = new CloudwatchLogGroup(this, 'vpc-flow-logs', {
      name: `/aws/vpc/flowlogs/${config.companyName}-${config.environment}`,
      retentionInDays: 30,
      tags: {
        Name: `${config.companyName}-${config.environment}-vpc-flow-logs`,
        Purpose: 'Network traffic monitoring and security analysis',
      },
    });

    // Fixed: Use correct property name
    this.flowLogs = new FlowLog(this, 'vpc-flow-logs-config', {
      vpcId: vpc.id,
      trafficType: 'ALL',
      logDestination: this.logGroup.arn,
      logDestinationType: 'cloud-watch-logs',
      iamRoleArn: flowLogsRole.arn, // Use iamRoleArn instead of deliverLogsPermissionArn
      tags: {
        Name: `${config.companyName}-${config.environment}-flow-logs`,
        Purpose: 'Network security monitoring',
      },
    });
  }
}

// CloudWatch Monitoring Module - Detailed monitoring and alerting
export class MonitoringConstruct extends Construct {
  public readonly snsTopic: SnsTopic;
  public readonly cpuAlarm: CloudwatchMetricAlarm;
  public readonly errorAlarm: CloudwatchMetricAlarm;

  constructor(
    scope: Construct,
    id: string,
    lambdaFunction: LambdaFunction,
    config: SecureInfraConfig
  ) {
    super(scope, id);

    this.snsTopic = new SnsTopic(this, 'alarm-topic', {
      name: `${config.companyName}-${config.environment}-alarms`,
      displayName: 'Infrastructure Alarms',
      tags: {
        Name: `${config.companyName}-${config.environment}-alarm-topic`,
        Purpose: 'Critical infrastructure alerting',
      },
    });

    this.errorAlarm = new CloudwatchMetricAlarm(this, 'lambda-error-alarm', {
      alarmName: `${config.companyName}-${config.environment}-lambda-errors`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 5,
      alarmDescription: 'Lambda function error rate is high',
      alarmActions: [this.snsTopic.arn],
      dimensions: {
        FunctionName: lambdaFunction.functionName,
      },
      treatMissingData: 'notBreaching',
      tags: {
        Name: `${config.companyName}-${config.environment}-lambda-error-alarm`,
        Purpose: 'Lambda function error monitoring',
      },
    });

    this.cpuAlarm = new CloudwatchMetricAlarm(this, 'cpu-alarm', {
      alarmName: `${config.companyName}-${config.environment}-high-cpu`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'EC2 CPU utilization is high',
      alarmActions: [this.snsTopic.arn],
      treatMissingData: 'notBreaching',
      tags: {
        Name: `${config.companyName}-${config.environment}-cpu-alarm`,
        Purpose: 'EC2 instance performance monitoring',
      },
    });
  }
}

// AWS Shield Module - DDoS protection
export class ShieldConstruct extends Construct {
  public readonly shieldProtection?: ShieldProtection;

  constructor(
    scope: Construct,
    id: string
    // api: ApiGatewayRestApi,
    // config: SecureInfraConfig
  ) {
    super(scope, id);

    // Note: Shield Advanced only protects certain resource types:
    // - CloudFront distributions
    // - Route 53 hosted zones
    // - Elastic Load Balancers
    // - EC2 Elastic IP addresses

    // For API Gateway protection, you would typically:
    // 1. Put CloudFront in front of API Gateway
    // 2. Protect the CloudFront distribution with Shield

    // Example (if you have a CloudFront distribution):
    // this.shieldProtection = new ShieldProtection(this, 'shield-protection', {
    //   name: `${config.companyName}-${config.environment}-shield`,
    //   resourceArn: `arn:aws:cloudfront::${accountId}:distribution/${cloudfrontId}`,
    //   tags: {
    //     Name: `${config.companyName}-${config.environment}-shield`,
    //     Purpose: 'DDoS protection for CloudFront distribution',
    //   },
    // });
  }
}
