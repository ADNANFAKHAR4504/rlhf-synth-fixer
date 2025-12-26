import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface InfrastructureConfig {
  region: string;
  availabilityZones: string[];
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  rdsConfig: {
    instanceClass: string;
    allocatedStorage: number;
    engine: string;
    engineVersion: string;
    dbName: string;
    username: string;
  };
  s3Config: {
    lifecyclePolicies: {
      transitionToIa: number;
      transitionToGlacier: number;
      expiration: number;
    };
  };
  tags: Record<string, string>;
}

export function createResourceName(
  baseName: string,
  region: string,
  environment: string
): string {
  return `${baseName}-${environment}-${region}`;
}

export function createTags(
  baseTags: Record<string, string>,
  region: string
): Record<string, string> {
  return {
    ...baseTags,
    Region: region,
    ManagedBy: 'Pulumi',
  };
}

export class Infrastructure extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly applicationRoleArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly instanceProfileArn: pulumi.Output<string>;
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly appSecurityGroupId: pulumi.Output<string>;
  public readonly securityAlertsTopicArn: pulumi.Output<string>;
  // public readonly webAclArn: pulumi.Output<string>;

  constructor(
    name: string,
    config: InfrastructureConfig,
    environment: string,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:Infrastructure', name, {}, opts);

    const { region } = config;
    const resourceTags = createTags(config.tags, region);

    // Detect LocalStack environment
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('127.0.0.1') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566');

    // Get current AWS account ID
    const current = aws.getCallerIdentity();

    // Create region-specific provider with LocalStack configuration
    const providerConfig: aws.ProviderArgs = {
      region: region,
      defaultTags: {
        tags: resourceTags,
      },
    };

    // Add LocalStack-specific configuration
    if (isLocalStack) {
      const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
      providerConfig.skipCredentialsValidation = true;
      providerConfig.skipMetadataApiCheck = true;
      providerConfig.s3UsePathStyle = true;
      providerConfig.skipRequestingAccountId = true;
      providerConfig.endpoints = [
        { ec2: endpoint },
        { s3: endpoint },
        { rds: endpoint },
        { iam: endpoint },
        { kms: endpoint },
        { cloudwatch: endpoint },
        { secretsmanager: endpoint },
        { sns: endpoint },
        { sts: endpoint },
        { cloudwatchlogs: endpoint },
      ];
    }

    const provider = new aws.Provider('regional-provider', providerConfig);

    // KMS Key for encryption
    const kmsKey = new aws.kms.Key(
      createResourceName('app-key', region, environment),
      {
        description: `KMS key for ${environment} environment in ${region}`,
        enableKeyRotation: true,
        policy: current.then(account =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${account.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow CloudWatch Logs',
                Effect: 'Allow',
                Principal: {
                  Service: `logs.${region}.amazonaws.com`,
                },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
              {
                Sid: 'Allow CloudTrail to encrypt logs',
                Effect: 'Allow',
                Principal: {
                  Service: 'cloudtrail.amazonaws.com',
                },
                Action: [
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                  'kms:Encrypt',
                  'kms:ReEncrypt*',
                  'kms:Decrypt',
                ],
                Resource: '*',
              },
              {
                Sid: 'Allow SNS service',
                Effect: 'Allow',
                Principal: {
                  Service: 'sns.amazonaws.com',
                },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // CloudWatch Log Group for application logs
    const logGroup = new aws.cloudwatch.LogGroup(
      createResourceName('app-logs', region, environment),
      {
        name: `/aws/application/${environment}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // VPC Flow Logs for network monitoring
    const vpcFlowLogRole = new aws.iam.Role(
      createResourceName('vpc-flow-log-role', region, environment),
      {
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
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    const vpcFlowLogGroup = new aws.cloudwatch.LogGroup(
      createResourceName('vpc-flow-logs', region, environment),
      {
        name: `/aws/vpc/flowlogs/${environment}`,
        retentionInDays: 14,
        kmsKeyId: kmsKey.arn,
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    const vpcFlowLogPolicy = new aws.iam.Policy(
      createResourceName('vpc-flow-log-policy', region, environment),
      {
        policy: pulumi.all([vpcFlowLogGroup.arn]).apply(([logGroupArn]) =>
          JSON.stringify({
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
                Resource: [logGroupArn, `${logGroupArn}:*`],
              },
            ],
          })
        ),
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      createResourceName('vpc-flow-log-policy-attachment', region, environment),
      {
        role: vpcFlowLogRole.name,
        policyArn: vpcFlowLogPolicy.arn,
      },
      { provider, parent: this }
    );
    // VPC
    const vpc = new aws.ec2.Vpc(
      createResourceName('vpc', region, environment),
      {
        cidrBlock: config.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...resourceTags,
          Name: createResourceName('vpc', region, environment),
        },
      },
      { provider, parent: this }
    );

    // VPC Flow Logs (now that VPC is created)
    new aws.ec2.FlowLog(
      createResourceName('vpc-flow-log', region, environment),
      {
        iamRoleArn: vpcFlowLogRole.arn,
        logDestination: vpcFlowLogGroup.arn,
        vpcId: vpc.id,
        trafficType: 'ALL',
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      createResourceName('igw', region, environment),
      {
        vpcId: vpc.id,
        tags: {
          ...resourceTags,
          Name: createResourceName('igw', region, environment),
        },
      },
      { provider, parent: this }
    );

    // Public Subnets
    const publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new aws.ec2.Subnet(
        createResourceName(`public-subnet-${index + 1}`, region, environment),
        {
          vpcId: vpc.id,
          cidrBlock: cidr,
          availabilityZone: config.availabilityZones[index],
          mapPublicIpOnLaunch: true,
          tags: {
            ...resourceTags,
            Name: createResourceName(
              `public-subnet-${index + 1}`,
              region,
              environment
            ),
            Type: 'Public',
          },
        },
        { provider, parent: this }
      );
    });

    // Private Subnets
    const privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new aws.ec2.Subnet(
        createResourceName(`private-subnet-${index + 1}`, region, environment),
        {
          vpcId: vpc.id,
          cidrBlock: cidr,
          availabilityZone: config.availabilityZones[index],
          tags: {
            ...resourceTags,
            Name: createResourceName(
              `private-subnet-${index + 1}`,
              region,
              environment
            ),
            Type: 'Private',
          },
        },
        { provider, parent: this }
      );
    });

    // NAT Gateways - Conditional for LocalStack
    const eips = isLocalStack
      ? []
      : publicSubnets.map((_, index) => {
          return new aws.ec2.Eip(
            createResourceName(`nat-eip-${index + 1}`, region, environment),
            {
              domain: 'vpc',
              tags: {
                ...resourceTags,
                Name: createResourceName(
                  `nat-eip-${index + 1}`,
                  region,
                  environment
                ),
              },
            },
            { provider, parent: this, dependsOn: [internetGateway] }
          );
        });

    const natGateways = isLocalStack
      ? []
      : publicSubnets.map((subnet, index) => {
          return new aws.ec2.NatGateway(
            createResourceName(`nat-gateway-${index + 1}`, region, environment),
            {
              allocationId: eips[index].id,
              subnetId: subnet.id,
              tags: {
                ...resourceTags,
                Name: createResourceName(
                  `nat-gateway-${index + 1}`,
                  region,
                  environment
                ),
              },
            },
            { provider, parent: this, dependsOn: [internetGateway] }
          );
        });

    // Route Tables
    const publicRouteTable = new aws.ec2.RouteTable(
      createResourceName('public-rt', region, environment),
      {
        vpcId: vpc.id,
        tags: {
          ...resourceTags,
          Name: createResourceName('public-rt', region, environment),
        },
      },
      { provider, parent: this }
    );

    new aws.ec2.Route(
      createResourceName('public-route', region, environment),
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { provider, parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        createResourceName(`public-rta-${index + 1}`, region, environment),
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { provider, parent: this }
      );
    });

    // Private Route Tables - Skip NAT Gateway routes in LocalStack
    privateSubnets.forEach((subnet, index) => {
      const routeTable = new aws.ec2.RouteTable(
        createResourceName(`private-rt-${index + 1}`, region, environment),
        {
          vpcId: vpc.id,
          tags: {
            ...resourceTags,
            Name: createResourceName(
              `private-rt-${index + 1}`,
              region,
              environment
            ),
          },
        },
        { provider, parent: this }
      );

      // Only create NAT Gateway routes if not in LocalStack
      if (!isLocalStack && natGateways.length > 0) {
        new aws.ec2.Route(
          createResourceName(`private-route-${index + 1}`, region, environment),
          {
            routeTableId: routeTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGateways[index].id,
          },
          { provider, parent: this }
        );
      }

      new aws.ec2.RouteTableAssociation(
        createResourceName(`private-rta-${index + 1}`, region, environment),
        {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        },
        { provider, parent: this }
      );
    });

    // Network ACLs for additional security
    const privateNetworkAcl = new aws.ec2.NetworkAcl(
      createResourceName('private-nacl', region, environment),
      {
        vpcId: vpc.id,
        tags: {
          ...resourceTags,
          Name: createResourceName('private-nacl', region, environment),
        },
      },
      { provider, parent: this }
    );

    // Allow inbound traffic from VPC CIDR
    new aws.ec2.NetworkAclRule(
      createResourceName('private-nacl-inbound', region, environment),
      {
        networkAclId: privateNetworkAcl.id,
        ruleNumber: 100,
        protocol: '-1',
        ruleAction: 'allow',
        cidrBlock: config.vpcCidr,
      },
      { provider, parent: this }
    );

    // Allow outbound traffic
    new aws.ec2.NetworkAclRule(
      createResourceName('private-nacl-outbound', region, environment),
      {
        networkAclId: privateNetworkAcl.id,
        ruleNumber: 100,
        protocol: '-1',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        egress: true,
      },
      { provider, parent: this }
    );

    // Associate private subnets with private NACL
    privateSubnets.forEach((subnet, index) => {
      new aws.ec2.NetworkAclAssociation(
        createResourceName(
          `private-nacl-assoc-${index + 1}`,
          region,
          environment
        ),
        {
          networkAclId: privateNetworkAcl.id,
          subnetId: subnet.id,
        },
        { provider, parent: this }
      );
    });

    // Application Security Groups with proper tier separation
    const webSecurityGroup = new aws.ec2.SecurityGroup(
      createResourceName('web-sg', region, environment),
      {
        namePrefix: createResourceName('web-sg', region, environment),
        vpcId: vpc.id,
        description: 'Security group for web tier - public facing',
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from internet',
          },
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP redirect to HTTPS',
          },
        ],
        egress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS outbound for updates',
          },
          {
            fromPort: 8080,
            toPort: 8080,
            protocol: 'tcp',
            cidrBlocks: config.privateSubnetCidrs,
            description: 'To application tier',
          },
        ],
        tags: {
          ...resourceTags,
          Name: createResourceName('web-sg', region, environment),
          Tier: 'Web',
        },
      },
      { provider, parent: this }
    );

    const appSecurityGroup = new aws.ec2.SecurityGroup(
      createResourceName('app-sg', region, environment),
      {
        namePrefix: createResourceName('app-sg', region, environment),
        vpcId: vpc.id,
        description: 'Security group for application tier',
        ingress: [
          {
            fromPort: 8080,
            toPort: 8080,
            protocol: 'tcp',
            securityGroups: [webSecurityGroup.id],
            description: 'From web tier only',
          },
        ],
        egress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS for external APIs',
          },
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            cidrBlocks: config.privateSubnetCidrs,
            description: 'To database tier',
          },
        ],
        tags: {
          ...resourceTags,
          Name: createResourceName('app-sg', region, environment),
          Tier: 'Application',
        },
      },
      { provider, parent: this }
    );

    // RDS Security Group with enhanced security
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      createResourceName('rds-sg', region, environment),
      {
        namePrefix: createResourceName('rds-sg', region, environment),
        vpcId: vpc.id,
        description: 'Security group for RDS instance - restricted access',
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            cidrBlocks: config.privateSubnetCidrs, // Only from private subnets
            description: 'MySQL access from private subnets only',
          },
        ],
        egress: [], // No outbound traffic needed for RDS
        tags: {
          ...resourceTags,
          Name: createResourceName('rds-sg', region, environment),
        },
      },
      { provider, parent: this }
    );

    // Update RDS security group to reference app security group
    new aws.ec2.SecurityGroupRule(
      createResourceName('rds-sg-rule', region, environment),
      {
        type: 'ingress',
        fromPort: 3306,
        toPort: 3306,
        protocol: 'tcp',
        sourceSecurityGroupId: appSecurityGroup.id,
        securityGroupId: rdsSecurityGroup.id,
        description: 'MySQL access from application tier',
      },
      { provider, parent: this }
    );
    // DB Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      createResourceName('db-subnet-group', region, environment),
      {
        subnetIds: privateSubnets.map(subnet => subnet.id),
        tags: {
          ...resourceTags,
          Name: createResourceName('db-subnet-group', region, environment),
        },
      },
      { provider, parent: this }
    );

    // S3 Bucket Access Logging
    const accessLogsBucket = new aws.s3.Bucket(
      createResourceName('access-logs', region, environment),
      {
        bucket: createResourceName('access-logs', region, environment),
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      createResourceName('access-logs-pab', region, environment),
      {
        bucket: accessLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider, parent: this }
    );

    new aws.s3.BucketServerSideEncryptionConfiguration(
      createResourceName('access-logs-encryption', region, environment),
      {
        bucket: accessLogsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { provider, parent: this }
    );

    // S3 Bucket with enhanced security
    const bucketName = createResourceName('app-logs', region, environment);
    const bucket = new aws.s3.Bucket(
      bucketName,
      {
        bucket: bucketName,
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // S3 Bucket Logging (using separate resource as recommended)
    new aws.s3.BucketLogging(
      createResourceName('bucket-logging', region, environment),
      {
        bucket: bucket.id,
        targetBucket: accessLogsBucket.id,
        targetPrefix: 'access-logs/',
      },
      { provider, parent: this }
    );

    // Remove the S3 bucket notification as it's not properly supported in this format
    // S3 Bucket Notification would need to be configured separately

    new aws.s3.BucketPublicAccessBlock(
      createResourceName('bucket-pab', region, environment),
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider, parent: this }
    );

    new aws.s3.BucketServerSideEncryptionConfiguration(
      createResourceName('bucket-encryption', region, environment),
      {
        bucket: bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { provider, parent: this }
    );

    new aws.s3.BucketLifecycleConfiguration(
      createResourceName('bucket-lifecycle', region, environment),
      {
        bucket: bucket.id,
        rules: [
          {
            id: 'log-lifecycle',
            status: 'Enabled',
            transitions: [
              {
                days: config.s3Config.lifecyclePolicies.transitionToIa,
                storageClass: 'STANDARD_IA',
              },
              {
                days: config.s3Config.lifecyclePolicies.transitionToGlacier,
                storageClass: 'GLACIER',
              },
            ],
            expiration: {
              days: config.s3Config.lifecyclePolicies.expiration,
            },
          },
        ],
      },
      { provider, parent: this }
    );

    // S3 Bucket Versioning
    new aws.s3.BucketVersioning(
      createResourceName('bucket-versioning', region, environment),
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider, parent: this }
    );

    // IAM Role
    const applicationRole = new aws.iam.Role(
      createResourceName('app-role', region, environment),
      {
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
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // S3 Bucket Policy for additional security
    new aws.s3.BucketPolicy(
      createResourceName('bucket-policy', region, environment),
      {
        bucket: bucket.id,
        policy: pulumi
          .all([bucket.arn, applicationRole.arn])
          .apply(([bucketArn, roleArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'DenyInsecureConnections',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'false',
                    },
                  },
                },
                {
                  Sid: 'DenyUnencryptedObjectUploads',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringNotEquals: {
                      's3:x-amz-server-side-encryption': 'aws:kms',
                    },
                  },
                },
                {
                  Sid: 'AllowApplicationRoleObjectAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: roleArn,
                  },
                  Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Sid: 'AllowApplicationRoleBucketAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: roleArn,
                  },
                  Action: ['s3:ListBucket', 's3:GetBucketLocation'],
                  Resource: bucketArn,
                },
              ],
            })
          ),
      },
      { provider, parent: this }
    );

    // RDS Parameter Group for optimization
    const dbParameterGroup = new aws.rds.ParameterGroup(
      createResourceName('db-params', region, environment),
      {
        family: `${config.rdsConfig.engine}${config.rdsConfig.engineVersion.split('.')[0]}.${
          config.rdsConfig.engineVersion.split('.')[1]
        }`,
        description: `Parameter group for ${config.rdsConfig.engine}`,
        parameters: [
          {
            name: 'innodb_buffer_pool_size',
            value: '{DBInstanceClassMemory*3/4}',
          },
          {
            name: 'slow_query_log',
            value: '1',
          },
          {
            name: 'general_log',
            value: '1',
          },
          {
            name: 'log_queries_not_using_indexes',
            value: '1',
          },
        ],
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // RDS Enhanced Monitoring Role
    const rdsMonitoringRole = new aws.iam.Role(
      createResourceName('rds-monitoring-role', region, environment),
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'monitoring.rds.amazonaws.com',
              },
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
        ],
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // RDS Instance - Use AWS Secrets Manager for password
    const dbSecret = new aws.secretsmanager.Secret(
      createResourceName('db-secret', region, environment),
      {
        name: createResourceName('db-credentials', region, environment),
        description: 'Database credentials for RDS instance',
        kmsKeyId: kmsKey.arn,
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    new aws.secretsmanager.SecretVersion(
      createResourceName('db-secret-version', region, environment),
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: config.rdsConfig.username,
          password: pulumi.secret('GeneratedSecurePassword123!@#'),
        }),
      },
      { provider, parent: this }
    );

    // RDS Instance - Simplified for LocalStack compatibility
    const rdsInstanceConfig: aws.rds.InstanceArgs = {
      identifier: createResourceName('db-instance', region, environment),
      engine: config.rdsConfig.engine,
      engineVersion: config.rdsConfig.engineVersion,
      instanceClass: config.rdsConfig.instanceClass,
      allocatedStorage: config.rdsConfig.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      dbName: config.rdsConfig.dbName,
      username: config.rdsConfig.username,
      manageMasterUserPassword: !isLocalStack, // Disable for LocalStack
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      parameterGroupName: dbParameterGroup.name,
      backupRetentionPeriod: isLocalStack ? 0 : 30,
      backupWindow: '03:00-04:00',
      copyTagsToSnapshot: true,
      maintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      deletionProtection: !isLocalStack,
      skipFinalSnapshot: isLocalStack,
      monitoringInterval: isLocalStack ? 0 : 60,
      performanceInsightsEnabled: false,
      enabledCloudwatchLogsExports: isLocalStack ? [] : ['error', 'general', 'slowquery'],
      multiAz: !isLocalStack,
      tags: {
        ...resourceTags,
        Name: createResourceName('db-instance', region, environment),
      },
    };

    // Add conditional fields for production
    if (!isLocalStack) {
      rdsInstanceConfig.maxAllocatedStorage = config.rdsConfig.allocatedStorage * 2;
      rdsInstanceConfig.monitoringRoleArn = rdsMonitoringRole.arn;
      rdsInstanceConfig.finalSnapshotIdentifier = pulumi.interpolate`${createResourceName(
        'db-final-snapshot',
        region,
        environment
      )}-${Date.now()}`;
      rdsInstanceConfig.caCertIdentifier = 'rds-ca-rsa2048-g1';
    }

    const rdsInstance = new aws.rds.Instance(
      createResourceName('db-instance', region, environment),
      rdsInstanceConfig,
      { provider, parent: this }
    );

    // Enhanced IAM policies with least privilege
    const s3Policy = new aws.iam.Policy(
      createResourceName('s3-access-policy', region, environment),
      {
        policy: pulumi.all([bucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'S3ObjectAccess',
                Effect: 'Allow',
                Action: [
                  's3:GetObject',
                  's3:PutObject',
                  's3:DeleteObject',
                  's3:GetObjectVersion',
                ],
                Resource: `${bucketArn}/*`,
                Condition: {
                  StringEquals: {
                    's3:x-amz-server-side-encryption': 'aws:kms',
                  },
                },
              },
              {
                Sid: 'S3BucketAccess',
                Effect: 'Allow',
                Action: [
                  's3:ListBucket',
                  's3:GetBucketLocation',
                  's3:GetBucketVersioning',
                ],
                Resource: bucketArn,
              },
            ],
          })
        ),
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    const kmsPolicy = new aws.iam.Policy(
      createResourceName('kms-access-policy', region, environment),
      {
        policy: pulumi.all([kmsKey.arn]).apply(([keyArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'KMSAccess',
                Effect: 'Allow',
                Action: [
                  'kms:Decrypt',
                  'kms:DescribeKey',
                  'kms:Encrypt',
                  'kms:GenerateDataKey',
                  'kms:ReEncrypt*',
                ],
                Resource: keyArn,
              },
            ],
          })
        ),
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    const cloudWatchPolicy = new aws.iam.Policy(
      createResourceName('cloudwatch-policy', region, environment),
      {
        policy: pulumi.all([logGroup.arn]).apply(([logGroupArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'CloudWatchLogsAccess',
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogStreams',
                ],
                Resource: [logGroupArn, `${logGroupArn}:*`],
              },
              {
                Sid: 'CloudWatchMetrics',
                Effect: 'Allow',
                Action: ['cloudwatch:PutMetricData'],
                Resource: '*',
                Condition: {
                  StringEquals: {
                    'cloudwatch:namespace': `Application/${environment}`,
                  },
                },
              },
              {
                Sid: 'CloudWatchMetricsRead',
                Effect: 'Allow',
                Action: [
                  'cloudwatch:GetMetricStatistics',
                  'cloudwatch:ListMetrics',
                ],
                Resource: '*',
                Condition: {
                  StringLike: {
                    'cloudwatch:namespace': [
                      `Application/${environment}`,
                      'AWS/EC2',
                      'AWS/RDS',
                    ],
                  },
                },
              },
            ],
          })
        ),
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    const rdsPolicy = new aws.iam.Policy(
      createResourceName('rds-access-policy', region, environment),
      {
        policy: pulumi.all([rdsInstance.arn]).apply(([rdsArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'RDSConnect',
                Effect: 'Allow',
                Action: ['rds-db:connect'],
                Resource: `${rdsArn}/*`,
                Condition: {
                  StringEquals: {
                    'rds-db:db-user-name': config.rdsConfig.username,
                  },
                },
              },
            ],
          })
        ),
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // Attach policies to role
    new aws.iam.RolePolicyAttachment(
      createResourceName('s3-policy-attachment', region, environment),
      {
        role: applicationRole.name,
        policyArn: s3Policy.arn,
      },
      { provider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      createResourceName('kms-policy-attachment', region, environment),
      {
        role: applicationRole.name,
        policyArn: kmsPolicy.arn,
      },
      { provider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      createResourceName('cloudwatch-policy-attachment', region, environment),
      {
        role: applicationRole.name,
        policyArn: cloudWatchPolicy.arn,
      },
      { provider, parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      createResourceName('rds-policy-attachment', region, environment),
      {
        role: applicationRole.name,
        policyArn: rdsPolicy.arn,
      },
      { provider, parent: this }
    );

    // Instance Profile for EC2 instances
    const instanceProfile = new aws.iam.InstanceProfile(
      createResourceName('app-instance-profile', region, environment),
      {
        role: applicationRole.name,
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // SNS Topic for Security Alerts
    const securityAlertsTopic = new aws.sns.Topic(
      createResourceName('security-alerts', region, environment),
      {
        name: createResourceName('security-alerts', region, environment),
        displayName: 'Security Alerts',
        kmsMasterKeyId: kmsKey.arn,
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // CloudWatch Alarms for Security Monitoring
    new aws.cloudwatch.MetricAlarm(
      createResourceName('failed-login-alarm', region, environment),
      {
        name: createResourceName('failed-login-alarm', region, environment),
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'FailedLoginAttempts',
        namespace: `Application/${environment}`,
        period: 300,
        statistic: 'Sum',
        threshold: 5,
        alarmDescription: 'Alert on multiple failed login attempts',
        alarmActions: [securityAlertsTopic.arn],
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      createResourceName('rds-cpu-alarm', region, environment),
      {
        name: createResourceName('rds-cpu-alarm', region, environment),
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert on high RDS CPU utilization',
        alarmActions: [securityAlertsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: rdsInstance.id,
        },
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // RDS Database Insights - Additional Monitoring Alarms
    new aws.cloudwatch.MetricAlarm(
      createResourceName('rds-connections-alarm', region, environment),
      {
        name: createResourceName('rds-connections-alarm', region, environment),
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 40, // 80% of max connections for db.t3.micro
        alarmDescription: 'Alert on high database connection count',
        alarmActions: [securityAlertsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: rdsInstance.id,
        },
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      createResourceName('rds-read-latency-alarm', region, environment),
      {
        name: createResourceName('rds-read-latency-alarm', region, environment),
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ReadLatency',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 0.2, // 200ms
        alarmDescription: 'Alert on high database read latency',
        alarmActions: [securityAlertsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: rdsInstance.id,
        },
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      createResourceName('rds-write-latency-alarm', region, environment),
      {
        name: createResourceName(
          'rds-write-latency-alarm',
          region,
          environment
        ),
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'WriteLatency',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 0.2, // 200ms
        alarmDescription: 'Alert on high database write latency',
        alarmActions: [securityAlertsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: rdsInstance.id,
        },
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      createResourceName('rds-storage-alarm', region, environment),
      {
        name: createResourceName('rds-storage-alarm', region, environment),
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FreeStorageSpace',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 2000000000, // 2GB in bytes
        alarmDescription: 'Alert when free storage space is low',
        alarmActions: [securityAlertsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: rdsInstance.id,
        },
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    new aws.cloudwatch.MetricAlarm(
      createResourceName('rds-memory-alarm', region, environment),
      {
        name: createResourceName('rds-memory-alarm', region, environment),
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'FreeableMemory',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 100000000, // 100MB in bytes
        alarmDescription: 'Alert when freeable memory is low',
        alarmActions: [securityAlertsTopic.arn],
        dimensions: {
          DBInstanceIdentifier: rdsInstance.id,
        },
        tags: resourceTags,
      },
      { provider, parent: this }
    );

    // CloudWatch Dashboard for Database Insights
    new aws.cloudwatch.Dashboard(
      createResourceName('db-insights-dashboard', region, environment),
      {
        dashboardName: createResourceName(
          'db-insights-dashboard',
          region,
          environment
        ),
        dashboardBody: pulumi.all([rdsInstance.id]).apply(([dbInstanceId]) =>
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
                    [
                      'AWS/RDS',
                      'CPUUtilization',
                      'DBInstanceIdentifier',
                      dbInstanceId,
                    ],
                    ['.', 'DatabaseConnections', '.', '.'],
                    ['.', 'FreeableMemory', '.', '.'],
                    ['.', 'FreeStorageSpace', '.', '.'],
                  ],
                  view: 'timeSeries',
                  stacked: false,
                  region: region,
                  title: 'RDS Performance Metrics',
                  period: 300,
                },
              },
              {
                type: 'metric',
                x: 0,
                y: 6,
                width: 12,
                height: 6,
                properties: {
                  metrics: [
                    [
                      'AWS/RDS',
                      'ReadLatency',
                      'DBInstanceIdentifier',
                      dbInstanceId,
                    ],
                    ['.', 'WriteLatency', '.', '.'],
                    ['.', 'ReadIOPS', '.', '.'],
                    ['.', 'WriteIOPS', '.', '.'],
                  ],
                  view: 'timeSeries',
                  stacked: false,
                  region: region,
                  title: 'RDS I/O Performance',
                  period: 300,
                },
              },
              {
                type: 'metric',
                x: 0,
                y: 12,
                width: 12,
                height: 6,
                properties: {
                  metrics: [
                    [
                      'AWS/RDS',
                      'BinLogDiskUsage',
                      'DBInstanceIdentifier',
                      dbInstanceId,
                    ],
                    ['.', 'NetworkReceiveThroughput', '.', '.'],
                    ['.', 'NetworkTransmitThroughput', '.', '.'],
                  ],
                  view: 'timeSeries',
                  stacked: false,
                  region: region,
                  title: 'RDS Network and Storage',
                  period: 300,
                },
              },
            ],
          })
        ),
      },
      { provider, parent: this }
    );

    // WAF Web ACL for additional protection (commented out for initial deployment)
    // const webAcl = new aws.wafv2.WebAcl(
    //   createResourceName('web-acl', region, environment),
    //   {
    //     name: createResourceName('web-acl', region, environment),
    //     description: 'WAF rules for application protection',
    //     scope: 'REGIONAL',
    //     defaultAction: {
    //       allow: {},
    //     },
    //     rules: [
    //       {
    //         name: 'AWSManagedRulesCommonRuleSet',
    //         priority: 1,
    //         overrideAction: {
    //           none: {},
    //         },
    //         statement: {
    //           managedRuleGroupStatement: {
    //             name: 'AWSManagedRulesCommonRuleSet',
    //             vendorName: 'AWS',
    //           },
    //         },
    //         visibilityConfig: {
    //           sampledRequestsEnabled: true,
    //           cloudwatchMetricsEnabled: true,
    //           metricName: 'CommonRuleSetMetric',
    //         },
    //       },
    //       {
    //         name: 'AWSManagedRulesKnownBadInputsRuleSet',
    //         priority: 2,
    //         overrideAction: {
    //           none: {},
    //         },
    //         statement: {
    //           managedRuleGroupStatement: {
    //             name: 'AWSManagedRulesKnownBadInputsRuleSet',
    //             vendorName: 'AWS',
    //           },
    //         },
    //         visibilityConfig: {
    //           sampledRequestsEnabled: true,
    //           cloudwatchMetricsEnabled: true,
    //           metricName: 'KnownBadInputsMetric',
    //         },
    //       },
    //       {
    //         name: 'RateLimitRule',
    //         priority: 3,
    //         action: {
    //           block: {},
    //         },
    //         statement: {
    //           rateBasedStatement: {
    //             limit: 2000,
    //             aggregateKeyType: 'IP',
    //           },
    //         },
    //         visibilityConfig: {
    //           sampledRequestsEnabled: true,
    //           cloudwatchMetricsEnabled: true,
    //           metricName: 'RateLimitMetric',
    //         },
    //       },
    //     ],
    //     visibilityConfig: {
    //       sampledRequestsEnabled: true,
    //       cloudwatchMetricsEnabled: true,
    //       metricName: createResourceName('web-acl-metric', region, environment),
    //     },
    //     tags: resourceTags,
    //   },
    //   { provider, parent: this }
    // );

    // Exports
    this.vpcId = vpc.id;
    this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);
    this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);
    this.rdsEndpoint = rdsInstance.endpoint;
    this.s3BucketName = bucket.bucket;
    this.applicationRoleArn = applicationRole.arn;
    this.kmsKeyId = kmsKey.keyId;
    this.instanceProfileArn = instanceProfile.arn;
    this.webSecurityGroupId = webSecurityGroup.id;
    this.appSecurityGroupId = appSecurityGroup.id;
    this.securityAlertsTopicArn = securityAlertsTopic.arn;
    // this.webAclArn = webAcl.arn;
  }
}
