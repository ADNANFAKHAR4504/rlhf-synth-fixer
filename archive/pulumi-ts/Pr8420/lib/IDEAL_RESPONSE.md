## Core Infrastructure Code

```typescript
/\*\*

- webapp-infrastructure.ts
-
- This module defines the WebAppInfrastructure class, a Pulumi ComponentResource
- that creates a secure AWS infrastructure for a web application following
- security best practices and the principle of least privilege.
  _/
  import _ as aws from '@pulumi/aws';
  import \* as pulumi from '@pulumi/pulumi';
  import { ResourceOptions } from '@pulumi/pulumi';

/\*\*

- WebAppInfrastructureArgs defines the input arguments for the WebAppInfrastructure component.
  \*/
  export interface WebAppInfrastructureArgs {
  /\*\*
  - Environment suffix for resource naming (e.g., 'dev', 'prod').
    \*/
    environmentSuffix: string;

/\*\*

- AWS region for deployment.
  \*/
  region?: string;

/\*\*

- Optional tags to apply to resources.
  \*/
  tags?: pulumi.Input<{ [key: string]: string }>;
  }

/\*\*

- WebAppInfrastructure creates a secure AWS infrastructure for a web application
- including VPC, subnets, security groups, S3 buckets, and IAM roles.
  \*/
  export class WebAppInfrastructure extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly databaseSecurityGroupId: pulumi.Output<string>;
  public readonly webServerInstanceProfileName: pulumi.Output<string>;
  public readonly databaseSubnetGroupName: pulumi.Output<string>;
  public readonly applicationDataBucketName: pulumi.Output<string>;
  public readonly backupBucketName: pulumi.Output<string>;
  public readonly region: string;
  public readonly webServerRoleName: pulumi.Output<string>;

constructor(
name: string,
args: WebAppInfrastructureArgs,
opts?: ResourceOptions
) {
super('tap:webapp:WebAppInfrastructure', name, args, opts);

    // Configuration
    const projectName = 'webapp';
    const region = args.region || 'us-west-2';
    const environmentSuffix = args.environmentSuffix;
    const tags = args.tags || {};

    this.region = region;

    // Create AWS provider for explicit region control
    const awsProvider = new aws.Provider(
      'aws-provider',
      {
        region: region,
      },
      { parent: this }
    );

    // Get availability zones for the region
    const availabilityZones = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider: awsProvider }
    );

    // VPC Configuration
    const vpc = new aws.ec2.Vpc(
      `${projectName}-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${projectName}-vpc-${environmentSuffix}`,
          Environment: environmentSuffix,
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `${projectName}-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `${projectName}-igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // Public Subnets (for application servers)
    const publicSubnet1 = new aws.ec2.Subnet(
      `${projectName}-public-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        availabilityZone: availabilityZones?.then
          ? availabilityZones.then(azs => azs.names[0])
          : `${region}a`,
        cidrBlock: '10.0.1.0/24',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${projectName}-public-subnet-1-${environmentSuffix}`,
          Type: 'public',
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `${projectName}-public-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        availabilityZone: availabilityZones?.then
          ? availabilityZones.then(azs => azs.names[1])
          : `${region}b`,
        cidrBlock: '10.0.2.0/24',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${projectName}-public-subnet-2-${environmentSuffix}`,
          Type: 'public',
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // Private Subnets (for database services)
    const privateSubnet1 = new aws.ec2.Subnet(
      `${projectName}-private-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        availabilityZone: availabilityZones?.then
          ? availabilityZones.then(azs => azs.names[0])
          : `${region}a`,
        cidrBlock: '10.0.10.0/24',
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `${projectName}-private-subnet-1-${environmentSuffix}`,
          Type: 'private',
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `${projectName}-private-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        availabilityZone: availabilityZones?.then
          ? availabilityZones.then(azs => azs.names[1])
          : `${region}b`,
        cidrBlock: '10.0.11.0/24',
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `${projectName}-private-subnet-2-${environmentSuffix}`,
          Type: 'private',
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // NAT Gateway for private subnet internet access
    const natEip = new aws.ec2.Eip(
      `${projectName}-nat-eip-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `${projectName}-nat-eip-${environmentSuffix}`,
          ...tags,
        },
      },
      {
        provider: awsProvider,
        parent: this,
        dependsOn: [internetGateway],
      }
    );

    const natGateway = new aws.ec2.NatGateway(
      `${projectName}-nat-gateway-${environmentSuffix}`,
      {
        allocationId: natEip.id,
        subnetId: publicSubnet1.id,
        tags: {
          Name: `${projectName}-nat-gateway-${environmentSuffix}`,
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // Route Tables
    const publicRouteTable = new aws.ec2.RouteTable(
      `${projectName}-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
          },
        ],
        tags: {
          Name: `${projectName}-public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    const privateRouteTable = new aws.ec2.RouteTable(
      `${projectName}-private-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway.id,
          },
        ],
        tags: {
          Name: `${projectName}-private-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // Route Table Associations
    const publicRouteTableAssociation1 = new aws.ec2.RouteTableAssociation(
      `${projectName}-public-rta-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { provider: awsProvider, parent: this }
    );

    const publicRouteTableAssociation2 = new aws.ec2.RouteTableAssociation(
      `${projectName}-public-rta-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { provider: awsProvider, parent: this }
    );

    const privateRouteTableAssociation1 = new aws.ec2.RouteTableAssociation(
      `${projectName}-private-rta-1-${environmentSuffix}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable.id,
      },
      { provider: awsProvider, parent: this }
    );

    const privateRouteTableAssociation2 = new aws.ec2.RouteTableAssociation(
      `${projectName}-private-rta-2-${environmentSuffix}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      },
      { provider: awsProvider, parent: this }
    );

    // Security Groups
    const webSecurityGroup = new aws.ec2.SecurityGroup(
      `${projectName}-web-sg-${environmentSuffix}`,
      {
        name: `${projectName}-web-sg-${environmentSuffix}`,
        description: 'Security group for web servers in public subnets',
        vpcId: vpc.id,
        ingress: [
          {
            description: 'HTTP',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'HTTPS',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'SSH from VPC only (consider removing for production)',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: [vpc.cidrBlock],
          },
        ],
        egress: [
          {
            description: 'HTTPS to internet for updates and API calls',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'HTTP to internet for package updates',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'DNS queries',
            fromPort: 53,
            toPort: 53,
            protocol: 'udp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'Database access to private subnets',
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            cidrBlocks: ['10.0.10.0/24', '10.0.11.0/24'],
          },
          {
            description: 'PostgreSQL access to private subnets',
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            cidrBlocks: ['10.0.10.0/24', '10.0.11.0/24'],
          },
        ],
        tags: {
          Name: `${projectName}-web-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    const databaseSecurityGroup = new aws.ec2.SecurityGroup(
      `${projectName}-db-sg-${environmentSuffix}`,
      {
        name: `${projectName}-db-sg-${environmentSuffix}`,
        description: 'Security group for database servers in private subnets',
        vpcId: vpc.id,
        ingress: [
          {
            description: 'MySQL/Aurora from web servers',
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [webSecurityGroup.id],
          },
          {
            description: 'PostgreSQL from web servers',
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            securityGroups: [webSecurityGroup.id],
          },
        ],
        egress: [
          {
            description: 'HTTPS for software updates and patches',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'HTTP for software updates and patches',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'DNS queries',
            fromPort: 53,
            toPort: 53,
            protocol: 'udp',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `${projectName}-db-sg-${environmentSuffix}`,
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // S3 Buckets with modern configuration approach
    const applicationDataBucket = new aws.s3.Bucket(
      `${projectName}-app-data-${environmentSuffix}`,
      {
        bucket: `${projectName}-app-data-${environmentSuffix}-${(pulumi.getStack() || 'test').toLowerCase()}`,
        tags: {
          Name: `${projectName}-app-data-${environmentSuffix}`,
          Environment: environmentSuffix,
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // S3 Bucket Server Side Encryption Configuration
    const applicationDataBucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfiguration(
        `${projectName}-app-data-encryption-${environmentSuffix}`,
        {
          bucket: applicationDataBucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
              bucketKeyEnabled: true,
            },
          ],
        },
        { provider: awsProvider, parent: this }
      );

    // S3 Bucket Versioning Configuration
    const applicationDataBucketVersioning = new aws.s3.BucketVersioning(
      `${projectName}-app-data-versioning-${environmentSuffix}`,
      {
        bucket: applicationDataBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider: awsProvider, parent: this }
    );

    // S3 Bucket Public Access Block for application data bucket
    const applicationDataBucketPublicAccessBlock =
      new aws.s3.BucketPublicAccessBlock(
        `${projectName}-app-data-pab-${environmentSuffix}`,
        {
          bucket: applicationDataBucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        },
        { provider: awsProvider, parent: this }
      );

    // S3 Bucket Policy for application data bucket - enforce HTTPS
    const applicationDataBucketPolicy = new aws.s3.BucketPolicy(
      `${projectName}-app-data-policy-${environmentSuffix}`,
      {
        bucket: applicationDataBucket.id,
        policy: applicationDataBucket.arn
          ? pulumi.all([applicationDataBucket.arn]).apply(([bucketArn]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Sid: 'DenyInsecureConnections',
                    Effect: 'Deny',
                    Principal: '*',
                    Action: 's3:*',
                    Resource: [`${bucketArn}`, `${bucketArn}/*`],
                    Condition: {
                      Bool: {
                        'aws:SecureTransport': 'false',
                      },
                    },
                  },
                ],
              })
            )
          : JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'DenyInsecureConnections',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [
                    'arn:aws:s3:::test-bucket',
                    'arn:aws:s3:::test-bucket/*',
                  ],
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'false',
                    },
                  },
                },
              ],
            }),
      },
      {
        provider: awsProvider,
        parent: this,
        dependsOn: [applicationDataBucketPublicAccessBlock],
      }
    );

    const backupBucket = new aws.s3.Bucket(
      `${projectName}-backups-${environmentSuffix}`,
      {
        bucket: `${projectName}-backups-${environmentSuffix}-${(pulumi.getStack() || 'test').toLowerCase()}`,
        tags: {
          Name: `${projectName}-backups-${environmentSuffix}`,
          Environment: environmentSuffix,
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // S3 Bucket Server Side Encryption Configuration for backup bucket
    const backupBucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfiguration(
        `${projectName}-backups-encryption-${environmentSuffix}`,
        {
          bucket: backupBucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
              bucketKeyEnabled: true,
            },
          ],
        },
        { provider: awsProvider, parent: this }
      );

    // S3 Bucket Versioning Configuration for backup bucket
    const backupBucketVersioning = new aws.s3.BucketVersioning(
      `${projectName}-backups-versioning-${environmentSuffix}`,
      {
        bucket: backupBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider: awsProvider, parent: this }
    );

    // S3 Bucket Lifecycle Configuration for backup bucket
    const backupBucketLifecycle = new aws.s3.BucketLifecycleConfiguration(
      `${projectName}-backups-lifecycle-${environmentSuffix}`,
      {
        bucket: backupBucket.id,
        rules: [
          {
            id: 'backup-lifecycle',
            status: 'Enabled',
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
      },
      { provider: awsProvider, parent: this }
    );

    // S3 Bucket Public Access Block for backup bucket
    const backupBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `${projectName}-backups-pab-${environmentSuffix}`,
      {
        bucket: backupBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider: awsProvider, parent: this }
    );

    // S3 Bucket Policy for backup bucket - enforce HTTPS and restrict access
    const backupBucketPolicy = new aws.s3.BucketPolicy(
      `${projectName}-backups-policy-${environmentSuffix}`,
      {
        bucket: backupBucket.id,
        policy: backupBucket.arn
          ? pulumi.all([backupBucket.arn]).apply(([bucketArn]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Sid: 'DenyInsecureConnections',
                    Effect: 'Deny',
                    Principal: '*',
                    Action: 's3:*',
                    Resource: [`${bucketArn}`, `${bucketArn}/*`],
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
                        's3:x-amz-server-side-encryption': 'AES256',
                      },
                    },
                  },
                ],
              })
            )
          : JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'DenyInsecureConnections',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [
                    'arn:aws:s3:::test-backup-bucket',
                    'arn:aws:s3:::test-backup-bucket/*',
                  ],
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'false',
                    },
                  },
                },
              ],
            }),
      },
      {
        provider: awsProvider,
        parent: this,
        dependsOn: [backupBucketPublicAccessBlock],
      }
    );

    // S3 Access Logging Bucket for security monitoring
    const accessLogsBucket = new aws.s3.Bucket(
      `${projectName}-access-logs-${environmentSuffix}`,
      {
        bucket: `${projectName}-access-logs-${environmentSuffix}-${(pulumi.getStack() || 'test').toLowerCase()}`,
        tags: {
          Name: `${projectName}-access-logs-${environmentSuffix}`,
          Environment: environmentSuffix,
          Purpose: 'AccessLogging',
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // S3 Bucket Server Side Encryption Configuration for access logs bucket
    const accessLogsBucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfiguration(
        `${projectName}-access-logs-encryption-${environmentSuffix}`,
        {
          bucket: accessLogsBucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
              bucketKeyEnabled: true,
            },
          ],
        },
        { provider: awsProvider, parent: this }
      );

    // S3 Bucket Versioning Configuration for access logs bucket
    const accessLogsBucketVersioning = new aws.s3.BucketVersioning(
      `${projectName}-access-logs-versioning-${environmentSuffix}`,
      {
        bucket: accessLogsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider: awsProvider, parent: this }
    );

    // S3 Bucket Lifecycle Configuration for access logs bucket
    const accessLogsBucketLifecycle = new aws.s3.BucketLifecycleConfiguration(
      `${projectName}-access-logs-lifecycle-${environmentSuffix}`,
      {
        bucket: accessLogsBucket.id,
        rules: [
          {
            id: 'access-logs-lifecycle',
            status: 'Enabled',
            expiration: {
              days: 90, // Delete access logs after 90 days
            },
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
            ],
          },
        ],
      },
      { provider: awsProvider, parent: this }
    );

    // S3 Bucket Public Access Block for access logs bucket
    const accessLogsBucketPublicAccessBlock =
      new aws.s3.BucketPublicAccessBlock(
        `${projectName}-access-logs-pab-${environmentSuffix}`,
        {
          bucket: accessLogsBucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        },
        { provider: awsProvider, parent: this }
      );

    // Enable S3 access logging on application data bucket
    const applicationDataBucketLogging = new aws.s3.BucketLogging(
      `${projectName}-app-data-logging-${environmentSuffix}`,
      {
        bucket: applicationDataBucket.id,
        targetBucket: accessLogsBucket.id,
        targetPrefix: 'app-data-access-logs/',
      },
      {
        provider: awsProvider,
        parent: this,
        dependsOn: [accessLogsBucketPublicAccessBlock],
      }
    );

    // Enable S3 access logging on backup bucket
    const backupBucketLogging = new aws.s3.BucketLogging(
      `${projectName}-backups-logging-${environmentSuffix}`,
      {
        bucket: backupBucket.id,
        targetBucket: accessLogsBucket.id,
        targetPrefix: 'backup-access-logs/',
      },
      {
        provider: awsProvider,
        parent: this,
        dependsOn: [accessLogsBucketPublicAccessBlock],
      }
    );

    // IAM Roles following principle of least privilege
    const ec2AssumeRolePolicy = aws.iam.getPolicyDocument(
      {
        statements: [
          {
            actions: ['sts:AssumeRole'],
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['ec2.amazonaws.com'],
              },
            ],
          },
        ],
      },
      { provider: awsProvider }
    );

    // Web Server IAM Role
    const webServerRole = new aws.iam.Role(
      `${projectName}-web-server-role-${environmentSuffix}`,
      {
        name: `${projectName}-web-server-role-${environmentSuffix}`,
        assumeRolePolicy: ec2AssumeRolePolicy?.then
          ? ec2AssumeRolePolicy.then(policy => policy.json)
          : JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { Service: 'ec2.amazonaws.com' },
                  Action: 'sts:AssumeRole',
                },
              ],
            }),
        tags: {
          Name: `${projectName}-web-server-role-${environmentSuffix}`,
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // Policy for web servers to access application data bucket
    const webServerS3Policy = new aws.iam.Policy(
      `${projectName}-web-server-s3-policy-${environmentSuffix}`,
      {
        name: `${projectName}-web-server-s3-policy-${environmentSuffix}`,
        description: 'Policy for web servers to access application data bucket',
        policy: applicationDataBucket.arn
          ? pulumi.all([applicationDataBucket.arn]).apply(([bucketArn]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                    Resource: `${bucketArn}/*`,
                    Condition: {
                      Bool: {
                        'aws:SecureTransport': 'true',
                      },
                    },
                  },
                  {
                    Effect: 'Allow',
                    Action: ['s3:ListBucket'],
                    Resource: bucketArn,
                    Condition: {
                      Bool: {
                        'aws:SecureTransport': 'true',
                      },
                    },
                  },
                ],
              })
            )
          : JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                  Resource: 'arn:aws:s3:::test-bucket/*',
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'true',
                    },
                  },
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:ListBucket'],
                  Resource: 'arn:aws:s3:::test-bucket',
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'true',
                    },
                  },
                },
              ],
            }),
      },
      { provider: awsProvider, parent: this }
    );

    // CloudWatch logs policy for web servers
    const webServerLogsPolicy = new aws.iam.Policy(
      `${projectName}-web-server-logs-policy-${environmentSuffix}`,
      {
        name: `${projectName}-web-server-logs-policy-${environmentSuffix}`,
        description: 'Policy for web servers to write CloudWatch logs',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
                'logs:DescribeLogGroups',
              ],
              Resource: [
                `arn:aws:logs:${region}:*:log-group:/aws/ec2/${projectName}-${environmentSuffix}*`,
                `arn:aws:logs:${region}:*:log-group:/aws/ec2/${projectName}-${environmentSuffix}*:*`,
              ],
            },
          ],
        }),
      },
      { provider: awsProvider, parent: this }
    );

    // Attach policies to web server role
    const webServerS3PolicyAttachment = new aws.iam.RolePolicyAttachment(
      `${projectName}-web-server-s3-attachment-${environmentSuffix}`,
      {
        role: webServerRole.name,
        policyArn: webServerS3Policy.arn,
      },
      { provider: awsProvider, parent: this }
    );

    const webServerLogsAttachment = new aws.iam.RolePolicyAttachment(
      `${projectName}-web-server-logs-attachment-${environmentSuffix}`,
      {
        role: webServerRole.name,
        policyArn: webServerLogsPolicy.arn,
      },
      { provider: awsProvider, parent: this }
    );

    // Instance profile for EC2 instances
    const webServerInstanceProfile = new aws.iam.InstanceProfile(
      `${projectName}-web-server-profile-${environmentSuffix}`,
      {
        name: `${projectName}-web-server-profile-${environmentSuffix}`,
        role: webServerRole.name,
      },
      { provider: awsProvider, parent: this }
    );

    // Database IAM Role (for RDS enhanced monitoring, etc.)
    const databaseAssumeRolePolicy = aws.iam.getPolicyDocument(
      {
        statements: [
          {
            actions: ['sts:AssumeRole'],
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['monitoring.rds.amazonaws.com'],
              },
            ],
          },
        ],
      },
      { provider: awsProvider }
    );

    const databaseRole = new aws.iam.Role(
      `${projectName}-database-role-${environmentSuffix}`,
      {
        name: `${projectName}-database-role-${environmentSuffix}`,
        assumeRolePolicy: databaseAssumeRolePolicy?.then
          ? databaseAssumeRolePolicy.then(policy => policy.json)
          : JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { Service: 'monitoring.rds.amazonaws.com' },
                  Action: 'sts:AssumeRole',
                },
              ],
            }),
        tags: {
          Name: `${projectName}-database-role-${environmentSuffix}`,
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // Attach RDS enhanced monitoring policy
    const databaseMonitoringAttachment = new aws.iam.RolePolicyAttachment(
      `${projectName}-db-monitoring-attachment-${environmentSuffix}`,
      {
        role: databaseRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
      },
      { provider: awsProvider, parent: this }
    );

    // Database Subnet Group
    const databaseSubnetGroup = new aws.rds.SubnetGroup(
      `${projectName}-db-subnet-group-${environmentSuffix}`,
      {
        name: `${projectName}-db-subnet-group-${environmentSuffix}`,
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        tags: {
          Name: `${projectName}-db-subnet-group-${environmentSuffix}`,
          ...tags,
        },
      },
      { provider: awsProvider, parent: this }
    );

    // Set outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output([publicSubnet1.id, publicSubnet2.id]);
    this.privateSubnetIds = pulumi.output([
      privateSubnet1.id,
      privateSubnet2.id,
    ]);
    this.webSecurityGroupId = webSecurityGroup.id;
    this.databaseSecurityGroupId = databaseSecurityGroup.id;
    this.webServerInstanceProfileName = webServerInstanceProfile.name;
    this.databaseSubnetGroupName = databaseSubnetGroup.name;
    this.applicationDataBucketName = applicationDataBucket.bucket;
    this.backupBucketName = backupBucket.bucket;
    this.webServerRoleName = webServerRole.name;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      webSecurityGroupId: this.webSecurityGroupId,
      databaseSecurityGroupId: this.databaseSecurityGroupId,
      webServerInstanceProfileName: this.webServerInstanceProfileName,
      databaseSubnetGroupName: this.databaseSubnetGroupName,
      applicationDataBucketName: this.applicationDataBucketName,
      backupBucketName: this.backupBucketName,
      region: this.region,
      webServerRoleName: this.webServerRoleName,
      // Include dependencies to ensure proper resource creation order
      _applicationDataBucketEncryption: applicationDataBucketEncryption.id,
      _applicationDataBucketVersioning: applicationDataBucketVersioning.id,
      _backupBucketEncryption: backupBucketEncryption.id,
      _backupBucketVersioning: backupBucketVersioning.id,
      _backupBucketLifecycle: backupBucketLifecycle.id,
      _accessLogsBucketEncryption: accessLogsBucketEncryption.id,
      _accessLogsBucketVersioning: accessLogsBucketVersioning.id,
      _accessLogsBucketLifecycle: accessLogsBucketLifecycle.id,
      _applicationDataBucketPublicAccessBlock:
        applicationDataBucketPublicAccessBlock.id,
      _backupBucketPublicAccessBlock: backupBucketPublicAccessBlock.id,
      _applicationDataBucketPolicy: applicationDataBucketPolicy.id,
      _backupBucketPolicy: backupBucketPolicy.id,
      _accessLogsBucketPublicAccessBlock: accessLogsBucketPublicAccessBlock.id,
      _applicationDataBucketLogging: applicationDataBucketLogging.id,
      _backupBucketLogging: backupBucketLogging.id,
      _webServerS3PolicyAttachment: webServerS3PolicyAttachment.id,
      _webServerLogsAttachment: webServerLogsAttachment.id,
      _databaseMonitoringAttachment: databaseMonitoringAttachment.id,
      _publicRouteTableAssociation1: publicRouteTableAssociation1.id,
      _publicRouteTableAssociation2: publicRouteTableAssociation2.id,
      _privateRouteTableAssociation1: privateRouteTableAssociation1.id,
      _privateRouteTableAssociation2: privateRouteTableAssociation2.id,
    });
  }
}
```
