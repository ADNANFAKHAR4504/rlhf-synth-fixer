import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface SecureCompliantInfraArgs {
  projectName?: string;
  environment?: string;
  allowedSshCidr?: string;
  vpcCidr?: string;
  regions?: string[];
}

export class SecureCompliantInfra extends pulumi.ComponentResource {
  public readonly vpcIds: Array<{
    region: string;
    vpcId: pulumi.Output<string>;
  }>;
  public readonly ec2InstanceIds: Array<{
    region: string;
    instanceIds: pulumi.Output<string>[];
  }>;
  public readonly rdsEndpoints: Array<{
    region: string;
    endpoint: pulumi.Output<string>;
  }>;
  public readonly cloudtrailArn: pulumi.Output<string>;
  public readonly webAclArn: pulumi.Output<string>;
  public readonly cloudtrailBucketName: pulumi.Output<string>;
  public readonly kmsKeyArns: Array<{
    region: string;
    keyArn: pulumi.Output<string>;
  }>;

  constructor(
    name: string,
    args: SecureCompliantInfraArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:infra:SecureCompliantInfra', name, args, opts);

    // Configuration variables with defaults
    const projectName = args.projectName || 'webapp';
    const environment = args.environment || 'prod';
    const allowedSshCidr = args.allowedSshCidr || '203.0.113.0/24';
    const vpcCidr = args.vpcCidr || '10.0.0.0/16';
    const regions = args.regions || ['us-west-1', 'us-east-2'];

    // Common tags for all resources
    const commonTags = {
      Project: projectName,
      Environment: environment,
    };

    // Create providers for each region
    const providers = regions.map(region => ({
      region,
      provider: new aws.Provider(
        `provider-${region}`,
        { region },
        { parent: this }
      ),
    }));

    // KMS Key for encryption (per region)
    const kmsKeys = providers.map(({ region, provider }) => ({
      region,
      key: new aws.kms.Key(
        `${projectName}-${environment}-kms-${region}`,
        {
          description: `KMS key for ${projectName} ${environment} in ${region}`,
          tags: commonTags,
        },
        { provider, parent: this }
      ),
    }));

    // KMS Key Aliases (created but not exported)
    kmsKeys.map(({ region, key }) => ({
      region,
      alias: new aws.kms.Alias(
        `${projectName}-${environment}-kms-alias-${region}`,
        {
          name: `alias/${projectName}-${environment}-${region}`,
          targetKeyId: key.keyId,
        },
        {
          provider: providers.find(p => p.region === region)?.provider,
          parent: this,
        }
      ),
    }));

    // S3 bucket for CloudTrail logs (single bucket in us-east-2)
    const cloudtrailBucket = new aws.s3.Bucket(
      `${projectName}-${environment}-cloudtrail-logs`,
      {
        bucket: `${environment}-${projectName}-cloudtrail-logs`,
        forceDestroy: true,
        tags: commonTags,
      },
      {
        provider: providers.find(p => p.region === 'us-east-2')?.provider,
        parent: this,
      }
    );

    // Enable S3 bucket encryption for CloudTrail bucket
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${projectName}-${environment}-cloudtrail-encryption`,
      {
        bucket: cloudtrailBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      {
        provider: providers.find(p => p.region === 'us-east-2')?.provider,
        parent: this,
      }
    );

    // Block public access for CloudTrail bucket
    new aws.s3.BucketPublicAccessBlock(
      `${projectName}-${environment}-cloudtrail-public-block`,
      {
        bucket: cloudtrailBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      {
        provider: providers.find(p => p.region === 'us-east-2')?.provider,
        parent: this,
      }
    );

    // S3 bucket for access logs
    const accessLogsBucket = new aws.s3.Bucket(
      `${projectName}-${environment}-access-logs`,
      {
        bucket: `${environment}-${projectName}-access-logs`,
        tags: commonTags,
      },
      {
        provider: providers.find(p => p.region === 'us-east-2')?.provider,
        parent: this,
      }
    );

    // Enable S3 bucket encryption for access logs bucket
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${projectName}-${environment}-access-logs-encryption`,
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
      {
        provider: providers.find(p => p.region === 'us-east-2')?.provider,
        parent: this,
      }
    );

    // Block public access for access logs bucket
    new aws.s3.BucketPublicAccessBlock(
      `${projectName}-${environment}-access-logs-public-block`,
      {
        bucket: accessLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      {
        provider: providers.find(p => p.region === 'us-east-2')?.provider,
        parent: this,
      }
    );

    // Enable access logging on CloudTrail bucket (created but not exported)
    new aws.s3.BucketLogging(
      `${projectName}-${environment}-cloudtrail-logging`,
      {
        bucket: cloudtrailBucket.id,
        targetBucket: accessLogsBucket.id,
        targetPrefix: 'cloudtrail-access-logs/',
      },
      {
        provider: providers.find(p => p.region === 'us-east-2')?.provider,
        parent: this,
      }
    );

    // CloudTrail bucket policy
    const cloudtrailBucketPolicy = new aws.s3.BucketPolicy(
      `${projectName}-${environment}-cloudtrail-policy`,
      {
        bucket: cloudtrailBucket.id,
        policy: pulumi.all([cloudtrailBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AWSCloudTrailAclCheck',
                Effect: 'Allow',
                Principal: { Service: 'cloudtrail.amazonaws.com' },
                Action: 's3:GetBucketAcl',
                Resource: bucketArn,
              },
              {
                Sid: 'AWSCloudTrailWrite',
                Effect: 'Allow',
                Principal: { Service: 'cloudtrail.amazonaws.com' },
                Action: 's3:PutObject',
                Resource: `${bucketArn}/*`,
                Condition: {
                  StringEquals: {
                    's3:x-amz-acl': 'bucket-owner-full-control',
                  },
                },
              },
            ],
          })
        ),
      },
      {
        provider: providers.find(p => p.region === 'us-east-2')?.provider,
        parent: this,
      }
    );

    // CloudTrail
    const cloudtrail = new aws.cloudtrail.Trail(
      `${projectName}-${environment}-cloudtrail`,
      {
        name: `${projectName}-${environment}-cloudtrail`,
        s3BucketName: cloudtrailBucket.bucket,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableLogging: true,
        kmsKeyId: kmsKeys.find(k => k.region === 'us-east-2')?.key.arn,
        eventSelectors: [
          {
            readWriteType: 'All',
            includeManagementEvents: true,
            dataResources: [
              {
                type: 'AWS::S3::Object',
                values: ['arn:aws:s3:::*/*'],
              },
            ],
          },
        ],
        tags: commonTags,
      },
      {
        provider: providers.find(p => p.region === 'us-east-2')?.provider,
        dependsOn: [cloudtrailBucketPolicy],
        parent: this,
      }
    );

    // WAF Web ACL for SQL injection protection
    const webAcl = new aws.wafv2.WebAcl(
      `${projectName}-${environment}-waf`,
      {
        name: `${projectName}-${environment}-waf`,
        description: 'WAF for SQL injection protection',
        scope: 'REGIONAL',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'SQLInjectionRule',
            priority: 1,
            action: {
              block: {},
            },
            statement: {
              sqliMatchStatement: {
                fieldToMatch: {
                  body: {},
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                  {
                    priority: 1,
                    type: 'HTML_ENTITY_DECODE',
                  },
                ],
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'SQLInjectionRule',
              sampledRequestsEnabled: true,
            },
          },
        ],
        tags: commonTags,
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `${projectName}-${environment}-waf`,
          sampledRequestsEnabled: true,
        },
      },
      {
        provider: providers.find(p => p.region === 'us-east-2')?.provider,
        parent: this,
      }
    );

    // Create infrastructure for each region
    const regionalInfra = providers.map(({ region, provider }) => {
      // VPC
      const vpc = new aws.ec2.Vpc(
        `${projectName}-${environment}-vpc-${region}`,
        {
          cidrBlock: vpcCidr,
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-vpc-${region}`,
          },
        },
        { provider, parent: this }
      );

      // Internet Gateway
      const igw = new aws.ec2.InternetGateway(
        `${projectName}-${environment}-igw-${region}`,
        {
          vpcId: vpc.id,
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-igw-${region}`,
          },
        },
        { provider, parent: this }
      );

      // Get availability zones for this region
      const azs = pulumi.output(aws.getAvailabilityZones({}, { provider }));

      // Public Subnets
      const publicSubnets = [0, 1].map(
        i =>
          new aws.ec2.Subnet(
            `${projectName}-${environment}-public-subnet-${region}-${i}`,
            {
              vpcId: vpc.id,
              cidrBlock: `10.0.${i + 1}.0/24`,
              availabilityZone: azs.names[i],
              mapPublicIpOnLaunch: true,
              tags: {
                ...commonTags,
                Name: `${projectName}-${environment}-public-subnet-${region}-${i}`,
              },
            },
            { provider, parent: this }
          )
      );

      // Private Subnets
      const privateSubnets = [0, 1].map(
        i =>
          new aws.ec2.Subnet(
            `${projectName}-${environment}-private-subnet-${region}-${i}`,
            {
              vpcId: vpc.id,
              cidrBlock: `10.0.${i + 10}.0/24`,
              availabilityZone: azs.names[i],
              tags: {
                ...commonTags,
                Name: `${projectName}-${environment}-private-subnet-${region}-${i}`,
              },
            },
            { provider, parent: this }
          )
      );

      // Route Table for public subnets
      const publicRouteTable = new aws.ec2.RouteTable(
        `${projectName}-${environment}-public-rt-${region}`,
        {
          vpcId: vpc.id,
          routes: [
            {
              cidrBlock: '0.0.0.0/0',
              gatewayId: igw.id,
            },
          ],
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-public-rt-${region}`,
          },
        },
        { provider }
      );

      // Associate public subnets with route table (created but not exported)
      publicSubnets.map(
        (subnet, i) =>
          new aws.ec2.RouteTableAssociation(
            `${projectName}-${environment}-public-rta-${region}-${i}`,
            {
              subnetId: subnet.id,
              routeTableId: publicRouteTable.id,
            },
            { provider }
          )
      );

      // Security Group for EC2 instances (restricted SSH)
      const ec2SecurityGroup = new aws.ec2.SecurityGroup(
        `${projectName}-${environment}-ec2-sg-${region}`,
        {
          name: `${projectName}-${environment}-ec2-sg-${region}`,
          description: 'Security group for EC2 instances with restricted SSH',
          vpcId: vpc.id,
          ingress: [
            {
              description: 'SSH from allowed IP range',
              fromPort: 22,
              toPort: 22,
              protocol: 'tcp',
              cidrBlocks: [allowedSshCidr],
            },
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
            ...commonTags,
            Name: `${projectName}-${environment}-ec2-sg-${region}`,
          },
        },
        { provider }
      );

      // Security Group for RDS
      const rdsSecurityGroup = new aws.ec2.SecurityGroup(
        `${projectName}-${environment}-rds-sg-${region}`,
        {
          name: `${projectName}-${environment}-rds-sg-${region}`,
          description: 'Security group for RDS instances',
          vpcId: vpc.id,
          ingress: [
            {
              description: 'MySQL/Aurora',
              fromPort: 3306,
              toPort: 3306,
              protocol: 'tcp',
              securityGroups: [ec2SecurityGroup.id],
            },
          ],
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-rds-sg-${region}`,
          },
        },
        { provider }
      );

      // IAM Role for EC2 instances (least privilege)
      const ec2Role = new aws.iam.Role(
        `${projectName}-${environment}-ec2-role-${region}`,
        {
          name: `${projectName}-${environment}-ec2-role-${region}`,
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
          tags: commonTags,
        },
        { provider }
      );

      // IAM Policy for EC2 role (minimal permissions) - created but not exported
      new aws.iam.RolePolicy(
        `${projectName}-${environment}-ec2-policy-${region}`,
        {
          name: `${projectName}-${environment}-ec2-policy-${region}`,
          role: ec2Role.id,
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
                ],
                Resource: 'arn:aws:logs:*:*:*',
              },
            ],
          }),
        },
        { provider }
      );

      // IAM Instance Profile
      const ec2InstanceProfile = new aws.iam.InstanceProfile(
        `${projectName}-${environment}-ec2-profile-${region}`,
        {
          name: `${projectName}-${environment}-ec2-profile-${region}`,
          role: ec2Role.name,
        },
        { provider }
      );

      // Get latest Amazon Linux 2 AMI
      const ami = pulumi.output(
        aws.ec2.getAmi(
          {
            mostRecent: true,
            owners: ['amazon'],
            filters: [
              {
                name: 'name',
                values: ['amzn2-ami-hvm-*-x86_64-gp2'],
              },
            ],
          },
          { provider }
        )
      );

      // Create SSH Key Pair for EC2 access (as required by PROMPT.md)
      const keyPair = new aws.ec2.KeyPair(
        `${projectName}-${environment}-key-${region}`,
        {
          keyName: `${projectName}-${environment}-key-${region}`,
          publicKey:
            'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCfRo5a85SwGJL6c38HwiKzuCzIxOcY0WFnwSjFTr5Sfxc5UTHPP7tYtNzLyiLNFY8X7fKzBXWujXqLZHOFH7Yk9jKOsNh17b5kCv4VRx+IRNnG7CiBVK+Vgh0JMrmQWK2Wc5yaT9+ANucTMZ8aQhmRJbJ1tHPGylf71gAudWTlq+bEDiXECJWVfcI/Osqw3HmyC2GEA0tjJrt+rtR/9cpXeVXczEh8kVAoCAexvhWqJ1qEOcL//XDNVLvqrCpydDbjxiXJ2uwUuO8XGG0kSMD7iEOt9MLIwiSuj9JX6V4JBktYk0uOD+1U9PIVexovs2SrWuiWTdqGVVqXxcV18tfp test-key',
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-key-${region}`,
          },
        },
        { provider, parent: this }
      );

      // EC2 Instances with SSH access (as required by PROMPT.md)
      const ec2Instances = publicSubnets.map(
        (subnet, i) =>
          new aws.ec2.Instance(
            `${projectName}-${environment}-ec2-${region}-${i}`,
            {
              ami: ami.id,
              instanceType: 't3.micro',
              keyName: keyPair.keyName,
              vpcSecurityGroupIds: [ec2SecurityGroup.id],
              subnetId: subnet.id,
              iamInstanceProfile: ec2InstanceProfile.name,
              // Enable IMDSv2 for enhanced security
              metadataOptions: {
                httpEndpoint: 'enabled',
                httpTokens: 'required',
                httpPutResponseHopLimit: 1,
              },
              // Enable detailed monitoring
              monitoring: true,
              tags: {
                ...commonTags,
                Name: `${projectName}-${environment}-ec2-${region}-${i}`,
              },
            },
            { provider, parent: this }
          )
      );

      // RDS Subnet Group
      const rdsSubnetGroup = new aws.rds.SubnetGroup(
        `${projectName}-${environment}-rds-subnet-group-${region}`,
        {
          name: `${projectName}-${environment}-rds-subnet-group-${region}`,
          subnetIds: privateSubnets.map(subnet => subnet.id),
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-rds-subnet-group-${region}`,
          },
        },
        { provider }
      );

      // Get KMS key for this region
      const regionKmsKey = kmsKeys.find(k => k.region === region)?.key;

      // RDS Instance with encryption
      const rdsInstance = new aws.rds.Instance(
        `${projectName}-${environment}-rds-${region}`,
        {
          identifier: `${projectName}-${environment}-rds-${region}`,
          engine: 'mysql',
          engineVersion: '8.0',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          storageType: 'gp2',
          storageEncrypted: true,
          kmsKeyId: regionKmsKey?.arn,
          dbName: `${projectName}db`,
          username: 'admin',
          password: 'changeme123!', // In production, use AWS Secrets Manager
          vpcSecurityGroupIds: [rdsSecurityGroup.id],
          dbSubnetGroupName: rdsSubnetGroup.name,
          backupRetentionPeriod: 7,
          backupWindow: '03:00-04:00',
          maintenanceWindow: 'sun:04:00-sun:05:00',
          skipFinalSnapshot: true,
          tags: {
            ...commonTags,
            Name: `${projectName}-${environment}-rds-${region}`,
          },
        },
        { provider }
      );

      return {
        region,
        vpc,
        publicSubnets,
        privateSubnets,
        ec2Instances,
        rdsInstance,
        ec2SecurityGroup,
        rdsSecurityGroup,
      };
    });

    // Assign outputs to class properties
    this.vpcIds = regionalInfra.map(infra => ({
      region: infra.region,
      vpcId: infra.vpc.id,
    }));

    this.ec2InstanceIds = regionalInfra.map(infra => ({
      region: infra.region,
      instanceIds: infra.ec2Instances.map(instance => instance.id),
    }));

    this.rdsEndpoints = regionalInfra.map(infra => ({
      region: infra.region,
      endpoint: infra.rdsInstance.endpoint,
    }));

    this.cloudtrailArn = cloudtrail.arn;
    this.webAclArn = webAcl.arn;
    this.cloudtrailBucketName = cloudtrailBucket.bucket;

    // Assign KMS key ARNs
    this.kmsKeyArns = kmsKeys.map(({ region, key }) => ({
      region,
      keyArn: key.arn,
    }));

    // Register outputs
    this.registerOutputs({
      vpcIds: this.vpcIds,
      ec2InstanceIds: this.ec2InstanceIds,
      rdsEndpoints: this.rdsEndpoints,
      cloudtrailArn: this.cloudtrailArn,
      webAclArn: this.webAclArn,
      cloudtrailBucketName: this.cloudtrailBucketName,
      kmsKeyArns: this.kmsKeyArns,
    });
  }
}
