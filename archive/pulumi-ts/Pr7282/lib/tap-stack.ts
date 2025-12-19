import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface TapStackProps {
  environmentSuffix: string;
  region: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly kmsKey: aws.kms.Key;
  public readonly bucket: aws.s3.Bucket;
  public readonly lambdaFunction: aws.lambda.Function;
  public readonly auditTable: aws.dynamodb.Table;
  public readonly logGroup: aws.cloudwatch.LogGroup;

  constructor(
    name: string,
    props: TapStackProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:TapStack', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Add unique suffix to all resource names to avoid conflicts
    const suffix = `${props.environmentSuffix}-aj`;

    // Get current AWS account
    const current = aws.getCallerIdentity({});
    const accountId = current.then(c => c.accountId);

    // KMS Key with rotation and proper policy
    this.kmsKey = new aws.kms.Key(
      'financialDataKey',
      {
        description: 'KMS key for financial data encryption',
        enableKeyRotation: true,
        policy: pulumi.all([accountId]).apply(([acctId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${acctId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow services to use the key',
                Effect: 'Allow',
                Principal: {
                  Service: [
                    's3.amazonaws.com',
                    'dynamodb.amazonaws.com',
                    'logs.amazonaws.com',
                    'lambda.amazonaws.com',
                    'config.amazonaws.com',
                  ],
                },
                Action: [
                  'kms:Decrypt',
                  'kms:Encrypt',
                  'kms:GenerateDataKey',
                  'kms:DescribeKey',
                  'kms:CreateGrant',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: {
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );

    new aws.kms.Alias(
      'financialDataKeyAlias',
      {
        name: `alias/financial-data-key-${suffix}`,
        targetKeyId: this.kmsKey.keyId,
      },
      defaultResourceOptions
    );

    // VPC Configuration
    this.vpc = new aws.ec2.Vpc(
      'secureVpc',
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `secure-vpc-${suffix}`,
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );

    // Get AZs
    const azs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create 3 private subnets
    const privateSubnets: aws.ec2.Subnet[] = [];
    const privateRouteTables: aws.ec2.RouteTable[] = [];

    for (let i = 0; i < 3; i++) {
      const subnet = new aws.ec2.Subnet(
        `privateSubnet${i + 1}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: azs.then(az => az.names[i]),
          tags: {
            Name: `private-subnet-${i + 1}-${suffix}`,
            Environment: suffix,
            DataClassification: 'PCI-DSS',
            Owner: 'SecurityTeam',
          },
        },
        defaultResourceOptions
      );
      privateSubnets.push(subnet);

      const routeTable = new aws.ec2.RouteTable(
        `privateRouteTable${i + 1}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `private-rt-${i + 1}-${suffix}`,
            Environment: suffix,
            DataClassification: 'PCI-DSS',
            Owner: 'SecurityTeam',
          },
        },
        defaultResourceOptions
      );
      privateRouteTables.push(routeTable);

      new aws.ec2.RouteTableAssociation(
        `privateRtAssoc${i + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        },
        defaultResourceOptions
      );
    }

    // Security Group for Lambda
    const lambdaSg = new aws.ec2.SecurityGroup(
      'lambdaSecurityGroup',
      {
        name: `lambda-sg-${suffix}`,
        vpcId: this.vpc.id,
        description: 'Security group for Lambda function',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['10.0.0.0/16'],
          },
        ],
        tags: {
          Name: `lambda-sg-${suffix}`,
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );

    // VPC Endpoints - COMMENTED OUT
    // AWS has a limit on VPC endpoints per region (typically 20-50).
    // In test/CI environments, this limit is often reached.
    // For production, ensure VPC endpoints are created for S3, DynamoDB, and KMS.
    /*
    new aws.ec2.VpcEndpoint(
      's3Endpoint',
      {
        vpcId: this.vpc.id,
        serviceName: `com.amazonaws.${props.region}.s3`,
        vpcEndpointType: 'Gateway',
        routeTableIds: privateRouteTables.map(rt => rt.id),
        tags: {
          Name: `s3-endpoint-${suffix}`,
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );

    new aws.ec2.VpcEndpoint(
      'dynamodbEndpoint',
      {
        vpcId: this.vpc.id,
        serviceName: `com.amazonaws.${props.region}.dynamodb`,
        vpcEndpointType: 'Gateway',
        routeTableIds: privateRouteTables.map(rt => rt.id),
        tags: {
          Name: `dynamodb-endpoint-${suffix}`,
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );

    const endpointSg = new aws.ec2.SecurityGroup(
      'endpointSecurityGroup',
      {
        name: `endpoint-sg-${suffix}`,
        vpcId: this.vpc.id,
        description: 'Security group for VPC endpoints',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['10.0.0.0/16'],
          },
        ],
        tags: {
          Name: `endpoint-sg-${suffix}`,
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );

    new aws.ec2.VpcEndpoint(
      'kmsEndpoint',
      {
        vpcId: this.vpc.id,
        serviceName: `com.amazonaws.${props.region}.kms`,
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [endpointSg.id],
        privateDnsEnabled: true,
        tags: {
          Name: `kms-endpoint-${suffix}`,
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );
    */

    // S3 Bucket
    this.bucket = new aws.s3.Bucket(
      'dataBucket',
      {
        bucket: `financial-data-${suffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.keyId,
            },
          },
        },
        tags: {
          Name: `financial-data-${suffix}`,
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      'dataBucketPublicAccessBlock',
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      defaultResourceOptions
    );

    // DynamoDB Table
    this.auditTable = new aws.dynamodb.Table(
      'auditLogsTable',
      {
        name: `audit-logs-${suffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'id',
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
        ],
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: this.kmsKey.arn,
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: {
          Name: `audit-logs-${suffix}`,
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );

    // CloudWatch Log Group
    this.logGroup = new aws.cloudwatch.LogGroup(
      'lambdaLogGroup',
      {
        name: `/aws/lambda/data-processor-${suffix}`,
        retentionInDays: 90,
        kmsKeyId: this.kmsKey.arn,
        tags: {
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );

    // Lambda IAM Role
    const lambdaRole = new aws.iam.Role(
      'lambdaRole',
      {
        name: `lambda-role-${suffix}`,
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
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );

    // Lambda IAM Policy
    const lambdaPolicy = new aws.iam.RolePolicy(
      'lambdaPolicy',
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([
            this.bucket.arn,
            this.auditTable.arn,
            this.kmsKey.arn,
            this.logGroup.arn,
          ])
          .apply(([bucketArn, tableArn, keyArn, logArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:PutItem',
                    'dynamodb:GetItem',
                    'dynamodb:Query',
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
                  Resource: keyArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: `${logArn}:*`,
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
              ],
            })
          ),
      },
      defaultResourceOptions
    );

    // Lambda Function
    this.lambdaFunction = new aws.lambda.Function(
      'dataProcessor',
      {
        name: `data-processor-${suffix}`,
        runtime: aws.lambda.Runtime.NodeJS18dX,
        handler: 'index.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('../lib/lambda'),
        }),
        memorySize: 1024,
        timeout: 300,
        vpcConfig: {
          subnetIds: privateSubnets.map(s => s.id),
          securityGroupIds: [lambdaSg.id],
        },
        environment: {
          variables: {
            BUCKET_NAME: this.bucket.bucket,
            AUDIT_TABLE: this.auditTable.name,
            KMS_KEY_ID: this.kmsKey.keyId,
          },
        },
        tags: {
          Name: `data-processor-${suffix}`,
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      { ...defaultResourceOptions, dependsOn: [this.logGroup, lambdaPolicy] }
    );

    // AWS Config Configuration - COMMENTED OUT
    // AWS Config allows only ONE recorder per AWS account/region.
    // If a recorder already exists in the account, creating another will fail.
    // For production use, ensure AWS Config is enabled manually at the account level.
    /*
    const configRole = new aws.iam.Role(
      'configRole',
      {
        name: `config-role-${suffix}`,
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
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
        ],
        tags: {
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );

    const configBucket = new aws.s3.Bucket(
      'configBucket',
      {
        bucket: `config-bucket-${suffix}`,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.keyId,
            },
          },
        },
        tags: {
          Name: `config-bucket-${suffix}`,
          Environment: suffix,
          DataClassification: 'PCI-DSS',
          Owner: 'SecurityTeam',
        },
      },
      defaultResourceOptions
    );

    new aws.s3.BucketPublicAccessBlock(
      'configBucketPublicAccessBlock',
      {
        bucket: configBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      defaultResourceOptions
    );

    const configRecorder = new aws.cfg.Recorder(
      'configRecorder',
      {
        name: `config-recorder-${suffix}`,
        roleArn: configRole.arn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      },
      defaultResourceOptions
    );

    const configDeliveryChannel = new aws.cfg.DeliveryChannel(
      'configDeliveryChannel',
      {
        name: `config-delivery-${suffix}`,
        s3BucketName: configBucket.bucket,
      },
      { ...defaultResourceOptions, dependsOn: [configRecorder] }
    );

    new aws.cfg.Rule(
      's3EncryptionRule',
      {
        name: `s3-encryption-rule-${suffix}`,
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
        },
      },
      { ...defaultResourceOptions, dependsOn: [configDeliveryChannel] }
    );

    new aws.cfg.Rule(
      'dynamoEncryptionRule',
      {
        name: `dynamo-encryption-rule-${suffix}`,
        source: {
          owner: 'AWS',
          sourceIdentifier: 'DYNAMODB_TABLE_ENCRYPTED_KMS',
        },
      },
      { ...defaultResourceOptions, dependsOn: [configDeliveryChannel] }
    );
    */

    this.registerOutputs({
      vpcId: this.vpc.id,
      kmsKeyArn: this.kmsKey.arn,
      bucketName: this.bucket.bucket,
      lambdaArn: this.lambdaFunction.arn,
      auditTableName: this.auditTable.name,
    });
  }
}
