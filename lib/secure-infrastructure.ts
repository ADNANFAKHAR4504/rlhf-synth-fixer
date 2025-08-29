import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export class SecureInfrastructure {
  private provider: aws.Provider;
  private region: string;
  private environment: string;
  private tags: Record<string, string>;
  private vpc: aws.ec2.Vpc;
  private privateSubnets: aws.ec2.Subnet[];
  private publicSubnets: aws.ec2.Subnet[];
  private internetGateway: aws.ec2.InternetGateway;
  private natGateway: aws.ec2.NatGateway;
  private dbSubnetGroup: aws.rds.SubnetGroup;
  private webSecurityGroup!: aws.ec2.SecurityGroup;
  private dbSecurityGroup!: aws.ec2.SecurityGroup;
  private ec2Role!: aws.iam.Role;
  private flowLogsRole!: aws.iam.Role;
  private instanceProfile!: aws.iam.InstanceProfile;
  private appBucket!: aws.s3.Bucket;
  private logsBucket!: aws.s3.Bucket;
  private masterKey!: aws.kms.Key;

  constructor(
    region: string,
    environment: string,
    tags: Record<string, string>
  ) {
    this.region = region;
    this.environment = environment;
    this.tags = {
      ...tags,
      Environment: environment,
      ManagedBy: 'Pulumi',
      Region: region,
    };

    // Create AWS Provider with explicit region
    this.provider = new aws.Provider(`aws-provider-${environment}`, {
      region: this.region,
    });

    // Initialize arrays
    this.privateSubnets = [];
    this.publicSubnets = [];

    // Initialize infrastructure components in correct order
    this.masterKey = this.createKMSKey();
    this.vpc = this.createVPC();
    this.internetGateway = this.createInternetGateway();
    this.createSubnets();
    this.natGateway = this.createNATGateway();
    this.createRouteTables();
    this.dbSubnetGroup = this.createDBSubnetGroup();
    const securityGroups = this.createSecurityGroups();
    this.webSecurityGroup = securityGroups.web;
    this.dbSecurityGroup = securityGroups.db;
    const buckets = this.createS3Buckets();
    this.appBucket = buckets.app;
    this.logsBucket = buckets.logs;
    const roles = this.createIAMRoles();
    this.ec2Role = roles.ec2;
    this.flowLogsRole = roles.flowLogs;
    this.instanceProfile = roles.instanceProfile;
    this.createSecretsManager();
    this.createRDSDatabase();
    this.createEC2Instances();
    this.createCloudFront();
    this.createVPCFlowLogs();
    this.createVPCEndpoints();
  }

  private createKMSKey(): aws.kms.Key {
    return new aws.kms.Key(
      `master-key-${this.environment}`,
      {
        description: `Master key for RDS and SecretsManager - ${this.environment}`,
        enableKeyRotation: true,
        tags: {
          ...this.tags,
          Name: `master-key-${this.environment}`,
          Purpose: 'Master encryption key for DB and secrets',
        },
      },
      { provider: this.provider }
    );
  }

  private createVPC(): aws.ec2.Vpc {
    return new aws.ec2.Vpc(
      `secure-vpc-${this.environment}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...this.tags,
          Name: `secure-vpc-${this.environment}`,
        },
      },
      { provider: this.provider }
    );
  }

  private createInternetGateway(): aws.ec2.InternetGateway {
    return new aws.ec2.InternetGateway(
      `igw-${this.environment}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...this.tags,
          Name: `igw-${this.environment}`,
        },
      },
      { provider: this.provider }
    );
  }

  private createSubnets(): void {
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24'];
    const privateSubnetCidrs = ['10.0.10.0/24', '10.0.11.0/24'];
    const availabilityZones = [`${this.region}a`, `${this.region}b`];

    // Public Subnets
    for (let i = 0; i < 2; i++) {
      const publicSubnet = new aws.ec2.Subnet(
        `public-subnet-${i + 1}-${this.environment}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: publicSubnetCidrs[i],
          availabilityZone: availabilityZones[i],
          mapPublicIpOnLaunch: true,
          tags: {
            ...this.tags,
            Name: `public-subnet-${i + 1}-${this.environment}`,
            Type: 'Public',
          },
        },
        { provider: this.provider }
      );
      this.publicSubnets.push(publicSubnet);
    }

    // Private Subnets
    for (let i = 0; i < 2; i++) {
      const privateSubnet = new aws.ec2.Subnet(
        `private-subnet-${i + 1}-${this.environment}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: privateSubnetCidrs[i],
          availabilityZone: availabilityZones[i],
          tags: {
            ...this.tags,
            Name: `private-subnet-${i + 1}-${this.environment}`,
            Type: 'Private',
          },
        },
        { provider: this.provider }
      );
      this.privateSubnets.push(privateSubnet);
    }
  }

  private createNATGateway(): aws.ec2.NatGateway {
    const eip = new aws.ec2.Eip(
      `nat-eip-${this.environment}`,
      {
        domain: 'vpc',
        tags: {
          ...this.tags,
          Name: `nat-eip-${this.environment}`,
        },
      },
      { provider: this.provider }
    );

    return new aws.ec2.NatGateway(
      `nat-gateway-${this.environment}`,
      {
        allocationId: eip.id,
        subnetId: this.publicSubnets[0].id,
        tags: {
          ...this.tags,
          Name: `nat-gateway-${this.environment}`,
        },
      },
      { provider: this.provider }
    );
  }

  private createRouteTables(): void {
    // Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${this.environment}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...this.tags,
          Name: `public-rt-${this.environment}`,
        },
      },
      { provider: this.provider }
    );

    new aws.ec2.Route(
      `public-route-${this.environment}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { provider: this.provider }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index + 1}-${this.environment}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { provider: this.provider }
      );
    });

    // Private Route Table
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${this.environment}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...this.tags,
          Name: `private-rt-${this.environment}`,
        },
      },
      { provider: this.provider }
    );

    new aws.ec2.Route(
      `private-route-${this.environment}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateway.id,
      },
      { provider: this.provider }
    );

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${index + 1}-${this.environment}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { provider: this.provider }
      );
    });
  }

  private createDBSubnetGroup(): aws.rds.SubnetGroup {
    return new aws.rds.SubnetGroup(
      `db-subnet-group-${this.environment}`,
      {
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        tags: {
          ...this.tags,
          Name: `db-subnet-group-${this.environment}`,
        },
      },
      { provider: this.provider }
    );
  }

  private createSecurityGroups(): {
    web: aws.ec2.SecurityGroup;
    db: aws.ec2.SecurityGroup;
  } {
    // Web Security Group
    const webSecurityGroup = new aws.ec2.SecurityGroup(
      `web-sg-${this.environment}`,
      {
        name: `web-sg-${this.environment}`,
        description: 'Security group for web servers',
        vpcId: this.vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP access',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS access',
          },
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'SSH access from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...this.tags,
          Name: `web-sg-${this.environment}`,
        },
      },
      { provider: this.provider }
    );

    // Database Security Group
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `db-sg-${this.environment}`,
      {
        name: `db-sg-${this.environment}`,
        description: 'Security group for database servers',
        vpcId: this.vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            securityGroups: [webSecurityGroup.id],
            description: 'MySQL access from web servers',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...this.tags,
          Name: `db-sg-${this.environment}`,
        },
      },
      { provider: this.provider }
    );

    return { web: webSecurityGroup, db: dbSecurityGroup };
  }

  private createS3Buckets(): { app: aws.s3.Bucket; logs: aws.s3.Bucket } {
    // Application Bucket
    const appBucket = new aws.s3.Bucket(
      `secure-app-bucket-${this.environment}`,
      {
        bucket: `secure-app-bucket-${this.environment}-${Math.random().toString(36).substring(7)}`,
        tags: {
          ...this.tags,
          Name: `secure-app-bucket-${this.environment}`,
          Purpose: 'Application Data',
        },
      },
      { provider: this.provider }
    );

    // Enable versioning
    new aws.s3.BucketVersioning(
      `app-bucket-versioning-${this.environment}`,
      {
        bucket: appBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider: this.provider }
    );

    // Enable server-side encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `app-bucket-encryption-${this.environment}`,
      {
        bucket: appBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { provider: this.provider }
    );

    // Block public access
    new aws.s3.BucketPublicAccessBlock(
      `app-bucket-pab-${this.environment}`,
      {
        bucket: appBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider: this.provider }
    );

    // CloudFront Logs Bucket
    const logsBucket = new aws.s3.Bucket(
      `cloudfront-logs-bucket-${this.environment}`,
      {
        bucket: `cloudfront-logs-bucket-${this.environment}-${Math.random().toString(36).substring(7)}`,

        tags: {
          ...this.tags,
          Name: `cloudfront-logs-bucket-${this.environment}`,
          Purpose: 'CloudFront Logs',
        },
      },
      { provider: this.provider }
    );

    new aws.s3.BucketVersioning(
      `logs-bucket-versioning-${this.environment}`,
      {
        bucket: logsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider: this.provider }
    );

    new aws.s3.BucketServerSideEncryptionConfiguration(
      `logs-bucket-encryption-${this.environment}`,
      {
        bucket: logsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { provider: this.provider }
    );

    new aws.s3.BucketPublicAccessBlock(
      `logs-bucket-pab-${this.environment}`,
      {
        bucket: logsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider: this.provider }
    );

    // Enable ACLs for CloudFront logging
    new aws.s3.BucketOwnershipControls(
      `logs-bucket-ownership-${this.environment}`,
      {
        bucket: logsBucket.id,
        rule: {
          objectOwnership: 'BucketOwnerPreferred',
        },
      },
      { provider: this.provider }
    );

    // Enable ACLs on the bucket
    new aws.s3.BucketAcl(
      `logs-bucket-acl-${this.environment}`,
      {
        bucket: logsBucket.id,
        acl: 'private',
      },
      { provider: this.provider }
    );

    // S3 Lifecycle Configuration for logs bucket
    new aws.s3.BucketLifecycleConfiguration(
      `logs-bucket-lifecycle-${this.environment}`,
      {
        bucket: logsBucket.id,
        rules: [
          {
            id: 'log-expiry',
            status: 'Enabled',
            filter: {
              prefix: 'cloudfront-logs/',
            },
            expiration: {
              days: 90,
            },
          },
        ],
      },
      { provider: this.provider }
    );

    // S3 Access Logging for App Bucket
    new aws.s3.BucketLogging(
      `app-bucket-logging-${this.environment}`,
      {
        bucket: appBucket.id,
        targetBucket: logsBucket.id,
        targetPrefix: `access-logs/${this.environment}/`,
      },
      { provider: this.provider }
    );

    return { app: appBucket, logs: logsBucket };
  }

  private createIAMRoles(): {
    ec2: aws.iam.Role;
    flowLogs: aws.iam.Role;
    instanceProfile: aws.iam.InstanceProfile;
  } {
    // EC2 Instance Role
    const ec2Role = new aws.iam.Role(
      `ec2-role-${this.environment}`,
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
        tags: {
          ...this.tags,
          Name: `ec2-role-${this.environment}`,
        },
      },
      { provider: this.provider }
    );

    // EC2 Instance Policy with minimal privileges
    const ec2Policy = new aws.iam.Policy(
      `ec2-policy-${this.environment}`,
      {
        description: 'Minimal policy for EC2 instances',
        policy: pulumi.all([this.appBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                Resource: `${bucketArn}/*`,
              },
              {
                Effect: 'Allow',
                Action: ['secretsmanager:GetSecretValue'],
                Resource: `arn:aws:secretsmanager:${this.region}:*:secret:app-secrets-${this.environment}-*`,
              },
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: {
          ...this.tags,
          Name: `ec2-policy-${this.environment}`,
        },
      },
      { provider: this.provider }
    );

    new aws.iam.RolePolicyAttachment(
      `ec2-policy-attachment-${this.environment}`,
      {
        role: ec2Role.name,
        policyArn: ec2Policy.arn,
      },
      { provider: this.provider }
    );

    // Instance Profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `ec2-instance-profile-${this.environment}`,
      {
        role: ec2Role.name,
        tags: {
          ...this.tags,
          Name: `ec2-instance-profile-${this.environment}`,
        },
      },
      { provider: this.provider }
    );

    // Get current AWS account ID
    const caller = aws.getCallerIdentity({}, { provider: this.provider });

    // VPC Flow Logs Role with proper trust policy
    const flowLogsRole = new aws.iam.Role(
      `flow-logs-role-${this.environment}`,
      {
        assumeRolePolicy: caller.then(c =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'vpc-flow-logs.amazonaws.com',
                },
                Action: 'sts:AssumeRole',
                Condition: {
                  StringEquals: {
                    'aws:SourceAccount': c.accountId,
                  },
                  ArnLike: {
                    'aws:SourceArn': `arn:aws:ec2:${this.region}:${c.accountId}:vpc-flow-log/*`,
                  },
                },
              },
            ],
          })
        ),
        tags: {
          ...this.tags,
          Name: `flow-logs-role-${this.environment}`,
        },
      },
      { provider: this.provider }
    );

    // Custom inline policy for VPC Flow Logs
    new aws.iam.RolePolicy(
      `flow-logs-policy-${this.environment}`,
      {
        role: flowLogsRole.id,
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
              Resource: `arn:aws:logs:${this.region}:*:log-group:/aws/vpc/flowlogs/${this.environment}*`,
            },
          ],
        }),
      },
      { provider: this.provider }
    );

    return { ec2: ec2Role, flowLogs: flowLogsRole, instanceProfile };
  }

  private createSecretsManager(): void {
    // Database credentials
    const dbSecret = new aws.secretsmanager.Secret(
      `db-credentials-${this.environment}`,
      {
        name: `app-secrets-${this.environment}`,
        description: 'Database credentials for the application',
        kmsKeyId: this.masterKey.arn,
        tags: {
          ...this.tags,
          Name: `db-credentials-${this.environment}`,
          Purpose: 'Database Credentials',
        },
      },
      { provider: this.provider }
    );

    new aws.secretsmanager.SecretVersion(
      `db-credentials-version-${this.environment}`,
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: 'ChangeMe123!',
          engine: 'mysql',
          host: 'localhost',
          port: 3306,
          dbname: `appdb_${this.environment}`,
        }),
      },
      { provider: this.provider }
    );

    // API Keys
    const apiSecret = new aws.secretsmanager.Secret(
      `api-keys-${this.environment}`,
      {
        name: `api-keys-${this.environment}`,
        description: 'API keys for external services',
        kmsKeyId: this.masterKey.arn,
        tags: {
          ...this.tags,
          Name: `api-keys-${this.environment}`,
          Purpose: 'API Keys',
        },
      },
      { provider: this.provider }
    );

    new aws.secretsmanager.SecretVersion(
      `api-keys-version-${this.environment}`,
      {
        secretId: apiSecret.id,
        secretString: JSON.stringify({
          stripe_key: 'sk_test_...',
          sendgrid_key: 'SG...',
          jwt_secret: 'your-jwt-secret-key',
        }),
      },
      { provider: this.provider }
    );
  }

  private createRDSDatabase(): void {
    // RDS Parameter Group
    const parameterGroup = new aws.rds.ParameterGroup(
      `mysql-params-${this.environment}`,
      {
        family: 'mysql8.0',
        description: 'MySQL parameter group',
        parameters: [
          {
            name: 'innodb_buffer_pool_size',
            value: '{DBInstanceClassMemory*3/4}',
          },
        ],
        tags: {
          ...this.tags,
          Name: `mysql-params-${this.environment}`,
        },
      },
      { provider: this.provider }
    );

    // RDS Instance
    const rdsInstance = new aws.rds.Instance(
      `mysql-db-${this.environment}`,
      {
        identifier: `mysql-db-${this.environment}`,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: this.masterKey.arn,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        dbName: `appdb${this.environment.replace(/[^a-zA-Z0-9]/g, '')}`,
        username: 'admin',
        password: 'ChangeMe123!',
        parameterGroupName: parameterGroup.name,
        dbSubnetGroupName: this.dbSubnetGroup.name,
        vpcSecurityGroupIds: [this.dbSecurityGroup.id],
        multiAz: true,
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        autoMinorVersionUpgrade: true,
        deletionProtection: true,
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `mysql-db-${this.environment}-final-snapshot`,
        tags: {
          ...this.tags,
          Name: `mysql-db-${this.environment}`,
          Purpose: 'Application Database',
        },
      },
      { provider: this.provider }
    );

    // Automated Backup using DB Snapshot
    new aws.rds.Snapshot(
      `db-snapshot-${this.environment}`,
      {
        dbInstanceIdentifier: rdsInstance.identifier,
        dbSnapshotIdentifier: `mysql-db-${this.environment}-snapshot-${Date.now()}`,
        tags: {
          ...this.tags,
          Name: `db-snapshot-${this.environment}`,
          Purpose: 'Automated Backup',
        },
      },
      { provider: this.provider }
    );
  }

  private createEC2Instances(): void {
    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi(
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
      { provider: this.provider }
    );

    // Launch Template
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `web-launch-template-${this.environment}`,
      {
        namePrefix: `web-launch-template-${this.environment}`,
        imageId: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        vpcSecurityGroupIds: [this.webSecurityGroup.id],
        monitoring: { enabled: true },
        iamInstanceProfile: {
          arn: this.instanceProfile.arn,
        },
        userData: Buffer.from(
          `#!/bin/bash
                yum update -y
                yum install -y httpd
                systemctl start httpd
                systemctl enable httpd
                echo "<h1>Secure Web Server - ${this.environment}</h1>" > /var/www/html/index.html
            `
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...this.tags,
              Name: `web-server-${this.environment}`,
              Purpose: 'Web Server',
            },
          },
        ],
      },
      { provider: this.provider }
    );

    // Auto Scaling Group
    new aws.autoscaling.Group(
      `web-asg-${this.environment}`,
      {
        name: `web-asg-${this.environment}`,
        vpcZoneIdentifiers: this.privateSubnets.map(subnet => subnet.id),
        healthCheckType: 'EC2',
        healthCheckGracePeriod: 300,
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `web-asg-${this.environment}`,
            propagateAtLaunch: true,
          },
          ...Object.entries(this.tags).map(([key, value]) => ({
            key,
            value,
            propagateAtLaunch: true,
          })),
        ],
      },
      { provider: this.provider }
    );
  }

  private createCloudFront(): void {
    // Origin Access Identity
    const oai = new aws.cloudfront.OriginAccessIdentity(
      `oai-${this.environment}`,
      {
        comment: `OAI for ${this.environment} environment`,
      },
      { provider: this.provider }
    );

    // S3 Bucket Policy for CloudFront OAI
    new aws.s3.BucketPolicy(
      `app-bucket-policy-${this.environment}`,
      {
        bucket: this.appBucket.id,
        policy: pulumi
          .all([this.appBucket.arn, oai.iamArn])
          .apply(([bucketArn, oaiArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowCloudFrontAccess',
                  Effect: 'Allow',
                  Principal: {
                    AWS: oaiArn,
                  },
                  Action: 's3:GetObject',
                  Resource: `${bucketArn}/*`,
                },
              ],
            })
          ),
      },
      { provider: this.provider }
    );

    // CloudFront Distribution
    new aws.cloudfront.Distribution(
      `cdn-${this.environment}`,
      {
        comment: `CDN for ${this.environment} environment`,
        defaultCacheBehavior: {
          targetOriginId: `S3-secure-app-bucket-${this.environment}`,
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: [
            'DELETE',
            'GET',
            'HEAD',
            'OPTIONS',
            'PATCH',
            'POST',
            'PUT',
          ],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
        },
        origins: [
          {
            domainName: this.appBucket.bucketDomainName,
            originId: `S3-secure-app-bucket-${this.environment}`,
            s3OriginConfig: {
              originAccessIdentity: oai.cloudfrontAccessIdentityPath,
            },
          },
        ],
        enabled: true,
        isIpv6Enabled: true,
        defaultRootObject: 'index.html',
        loggingConfig: {
          bucket: this.logsBucket.bucketDomainName,
          includeCookies: false,
          prefix: `cloudfront-logs-${this.environment}/`,
        },
        priceClass: 'PriceClass_100',
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        tags: {
          ...this.tags,
          Name: `cdn-${this.environment}`,
          Purpose: 'Content Delivery Network',
        },
      },
      { provider: this.provider }
    );
  }

  private createVPCFlowLogs(): void {
    // CloudWatch Log Group for VPC Flow Logs
    const logGroup = new aws.cloudwatch.LogGroup(
      `vpc-flow-logs-${this.environment}`,
      {
        name: `/aws/vpc/flowlogs/${this.environment}`,
        retentionInDays: 14,
        tags: {
          ...this.tags,
          Name: `vpc-flow-logs-${this.environment}`,
          Purpose: 'VPC Flow Logs',
        },
      },
      { provider: this.provider }
    );

    // VPC Flow Logs
    new aws.ec2.FlowLog(
      `vpc-flow-log-${this.environment}`,
      {
        iamRoleArn: this.flowLogsRole.arn,
        logDestination: logGroup.arn,
        logDestinationType: 'cloud-watch-logs',
        vpcId: this.vpc.id,
        trafficType: 'ALL',
        tags: {
          ...this.tags,
          Name: `vpc-flow-log-${this.environment}`,
          Purpose: 'Network Monitoring',
        },
      },
      { provider: this.provider }
    );
  }

  private createVPCEndpoints(): void {
    // S3 VPC Endpoint
    new aws.ec2.VpcEndpoint(
      `s3-endpoint-${this.environment}`,
      {
        vpcId: this.vpc.id,
        serviceName: `com.amazonaws.${this.region}.s3`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [],
        tags: {
          ...this.tags,
          Name: `s3-endpoint-${this.environment}`,
        },
      },
      { provider: this.provider }
    );

    // Secrets Manager VPC Endpoint
    new aws.ec2.VpcEndpoint(
      `secrets-endpoint-${this.environment}`,
      {
        vpcId: this.vpc.id,
        serviceName: `com.amazonaws.${this.region}.secretsmanager`,
        vpcEndpointType: 'Interface',
        subnetIds: this.privateSubnets.map(s => s.id),
        securityGroupIds: [this.webSecurityGroup.id],
        tags: {
          ...this.tags,
          Name: `secrets-endpoint-${this.environment}`,
        },
      },
      { provider: this.provider }
    );
  }
}
