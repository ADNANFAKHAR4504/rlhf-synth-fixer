import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

// Explicit AWS Provider configuration
const awsProvider = new aws.Provider('aws-provider', {
  region: process.env.AWS_REGION || 'us-east-1',
});

export interface InfrastructureStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

// Function to get ELB service account for the region
export function getELBServiceAccount(region: string): string {
  const elbServiceAccounts: { [key: string]: string } = {
    'us-east-1': '127311923021',
    'us-east-2': '033677994240',
    'us-west-1': '027434742980',
    'us-west-2': '797873946194',
    'eu-west-1': '156460612806',
    'eu-central-1': '054676820928',
    'ap-southeast-1': '114774131450',
    'ap-northeast-1': '582318560864',
    'ap-south-1': '718504428378',
    'eu-north-1': '897822967062',
    'ca-central-1': '985666609251',
  };
  return elbServiceAccounts[region] || '127311923021';
}

// Function to validate availability zones
export function validateAvailabilityZones(
  azNames: string[],
  region?: string
): void {
  if (azNames.length < 2) {
    throw new Error(
      `Region ${region || process.env.AWS_REGION || 'us-east-1'} must have at least 2 availability zones. Found: ${azNames.length}`
    );
  }
}

export class InfrastructureStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albZoneId: pulumi.Output<string>;
  public readonly cloudFrontDomainName: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly webAclArn: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;
  public readonly albLogsBucketName: pulumi.Output<string>;
  public readonly cloudFrontLogsBucketName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly secondaryTargetGroupArn: pulumi.Output<string>;
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly secondaryAutoScalingGroupName: pulumi.Output<string>;
  public readonly launchTemplateName: pulumi.Output<string>;
  public readonly ec2RoleArn: pulumi.Output<string>;
  public readonly albSecurityGroupId: pulumi.Output<string>;
  public readonly ec2SecurityGroupId: pulumi.Output<string>;
  public readonly cloudFrontDistributionId: pulumi.Output<string>;
  public readonly environment: pulumi.Output<string>;
  public readonly sanitizedName: pulumi.Output<string>;

  constructor(
    name: string,
    args: InfrastructureStackArgs,
    opts?: ResourceOptions
  ) {
    super('tap:infrastructure:InfrastructureStack', name, args, {
      ...opts,
      providers: [awsProvider],
    });

    // Get current AWS region and account ID
    const current = aws.getCallerIdentity({});
    const region = aws.getRegion({});

    // Configuration
    const config = new pulumi.Config();
    const projectName = pulumi.getProject();
    const stackName = pulumi.getStack();
    const environment =
      args.environmentSuffix || config.get('environment') || stackName;

    // Create a sanitized name for resources (lowercase, no special chars)
    const sanitizedName = `${projectName}-${environment}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');

    // Availability Zones - ensure at least 2 are available
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Validate minimum AZ requirement
    const azValidation = availabilityZones.then(azs => {
      validateAvailabilityZones(azs.names);
      return azs;
    });

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key(
      'infrastructure-key',
      {
        description: `KMS key for ${projectName}-${environment} infrastructure encryption`,
        enableKeyRotation: true,
        policy: pulumi
          .all([current, region])
          .apply(([currentAccount, currentRegion]) =>
            JSON.stringify({
              Version: '2012-10-17',
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
                {
                  Sid: 'Allow CloudWatch Logs',
                  Effect: 'Allow',
                  Principal: {
                    Service: `logs.${currentRegion.name}.amazonaws.com`,
                  },
                  Action: [
                    'kms:Encrypt',
                    'kms:Decrypt',
                    'kms:ReEncrypt*',
                    'kms:GenerateDataKey*',
                    'kms:DescribeKey',
                  ],
                  Resource: '*',
                  Condition: {
                    ArnEquals: {
                      'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${currentRegion.name}:${currentAccount.accountId}:log-group:/aws/ec2/${sanitizedName}`,
                    },
                  },
                },
              ],
            })
          ),
        tags: {
          Name: `${sanitizedName}-kms-key`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `${sanitizedName}-infrastructure-key-alias`,
      {
        name: `alias/${sanitizedName}-key`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // VPC
    const vpc = new aws.ec2.Vpc(
      `${sanitizedName}-main-vpc`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${sanitizedName}-vpc`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `${sanitizedName}-main-igw`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `${sanitizedName}-igw`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // Public Subnets (one per AZ)
    const publicSubnets = [0, 1].map(
      i =>
        new aws.ec2.Subnet(
          `${sanitizedName}-public-subnet-${i}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${i + 1}.0/24`,
            availabilityZone: azValidation.then(azs => azs.names[i]),
            mapPublicIpOnLaunch: true,
            tags: {
              Name: `${sanitizedName}-public-subnet-${i}`,
              Environment: environment,
              Type: 'public',
            },
          },
          { parent: this }
        )
    );

    // Private Subnets (one per AZ)
    const privateSubnets = [0, 1].map(
      i =>
        new aws.ec2.Subnet(
          `${sanitizedName}-private-subnet-${i}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${i + 10}.0/24`,
            availabilityZone: azValidation.then(azs => azs.names[i]),
            tags: {
              Name: `${sanitizedName}-private-subnet-${i}`,
              Environment: environment,
              Type: 'private',
            },
          },
          { parent: this }
        )
    );

    // Elastic IPs for NAT Gateways
    const natEips = [0, 1].map(
      i =>
        new aws.ec2.Eip(
          `${sanitizedName}-nat-eip-${i}`,
          {
            domain: 'vpc',
            tags: {
              Name: `${sanitizedName}-nat-eip-${i}`,
              Environment: environment,
            },
          },
          { parent: this }
        )
    );

    // NAT Gateways (one per public subnet)
    const natGateways = [0, 1].map(
      i =>
        new aws.ec2.NatGateway(
          `${sanitizedName}-nat-gateway-${i}`,
          {
            allocationId: natEips[i].id,
            subnetId: publicSubnets[i].id,
            tags: {
              Name: `${sanitizedName}-nat-gateway-${i}`,
              Environment: environment,
            },
          },
          { dependsOn: [internetGateway], parent: this }
        )
    );

    // Route Tables
    const publicRouteTable = new aws.ec2.RouteTable(
      `${sanitizedName}-public-route-table`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `${sanitizedName}-public-rt`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    const privateRouteTables = [0, 1].map(
      i =>
        new aws.ec2.RouteTable(
          `${sanitizedName}-private-route-table-${i}`,
          {
            vpcId: vpc.id,
            tags: {
              Name: `${sanitizedName}-private-rt-${i}`,
              Environment: environment,
            },
          },
          { parent: this }
        )
    );

    // Routes
    new aws.ec2.Route(
      `${sanitizedName}-public-route`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    [0, 1].map(
      i =>
        new aws.ec2.Route(
          `${sanitizedName}-private-route-${i}`,
          {
            routeTableId: privateRouteTables[i].id,
            destinationCidrBlock: '0.0.0.0/0',
            natGatewayId: natGateways[i].id,
          },
          { parent: this }
        )
    );

    // Route Table Associations
    publicSubnets.map(
      (subnet, i) =>
        new aws.ec2.RouteTableAssociation(
          `${sanitizedName}-public-rta-${i}`,
          {
            subnetId: subnet.id,
            routeTableId: publicRouteTable.id,
          },
          { parent: this }
        )
    );

    privateSubnets.map(
      (subnet, i) =>
        new aws.ec2.RouteTableAssociation(
          `${sanitizedName}-private-rta-${i}`,
          {
            subnetId: subnet.id,
            routeTableId: privateRouteTables[i].id,
          },
          { parent: this }
        )
    );

    // Generate bucket names based on purpose with environment suffix
    const albBucketName = `${sanitizedName}-alb-access-logs`;
    const cloudFrontBucketName = `${sanitizedName}-cloudfront-logs`;

    // S3 Bucket for ALB Access Logs
    const albLogsBucket = new aws.s3.Bucket(
      `${sanitizedName}-alb-access-logs`,
      {
        bucket: albBucketName,
        forceDestroy: true,
        tags: {
          Name: `${sanitizedName}-alb-logs`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // ALB access logs use SSE-S3 by default (KMS not supported)

    // S3 Bucket Versioning for ALB logs
    new aws.s3.BucketVersioning(
      `${sanitizedName}-alb-logs-versioning`,
      {
        bucket: albLogsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // S3 Bucket Lifecycle for ALB logs with Glacier transition
    new aws.s3.BucketLifecycleConfiguration(
      `${sanitizedName}-alb-logs-lifecycle`,
      {
        bucket: albLogsBucket.id,
        rules: [
          {
            id: 'lifecycle-logs',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 60,
                storageClass: 'GLACIER',
              },
            ],
            expiration: {
              days: 365,
            },
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
      },
      { parent: this }
    );

    // S3 Bucket Public Access Block for ALB logs
    new aws.s3.BucketPublicAccessBlock(
      `${sanitizedName}-alb-logs-pab`,
      {
        bucket: albLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // S3 Bucket Policy for ALB Access Logs
    new aws.s3.BucketPolicy(
      `${sanitizedName}-alb-logs-bucket-policy`,
      {
        bucket: albLogsBucket.id,
        policy: pulumi
          .all([albLogsBucket.arn, region, current])
          .apply(([bucketArn, currentRegion, currentAccount]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
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
                  Effect: 'Allow',
                  Principal: {
                    AWS: `arn:aws:iam::${getELBServiceAccount(currentRegion.name)}:root`,
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/*`,
                  Condition: {
                    StringEquals: {
                      'aws:SourceAccount': currentAccount.accountId,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `${sanitizedName}-alb-security-group`,
      {
        name: `${sanitizedName}-alb-sg`,
        description: 'Security group for Application Load Balancer',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP access from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS access from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `${sanitizedName}-alb-sg`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `${sanitizedName}-ec2-security-group`,
      {
        name: `${sanitizedName}-ec2-sg`,
        description: 'Security group for EC2 instances',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'HTTP from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `${sanitizedName}-ec2-sg`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `${sanitizedName}-main-alb`,
      {
        name: `${sanitizedName}-alb`,
        loadBalancerType: 'application',
        subnets: publicSubnets.map(subnet => subnet.id),
        securityGroups: [albSecurityGroup.id],
        accessLogs: {
          bucket: albLogsBucket.bucket,
          enabled: true,
        },
        tags: {
          Name: `${sanitizedName}-alb`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // Primary Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `${sanitizedName}-primary-target-group`,
      {
        name: `${sanitizedName}-primary-tg`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: '/health',
          matcher: '200',
        },
        tags: {
          Name: `${sanitizedName}-primary-tg`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // Secondary Target Group
    const secondaryTargetGroup = new aws.lb.TargetGroup(
      `${sanitizedName}-secondary-target-group`,
      {
        name: `${sanitizedName}-secondary-tg`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: '/health',
          matcher: '200',
        },
        tags: {
          Name: `${sanitizedName}-secondary-tg`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // ALB Listener with weighted routing
    new aws.lb.Listener(
      `${sanitizedName}-main-alb-listener`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            forward: {
              targetGroups: [
                {
                  arn: targetGroup.arn,
                  weight: 50,
                },
                {
                  arn: secondaryTargetGroup.arn,
                  weight: 50,
                },
              ],
            },
          },
        ],
      },
      { parent: this }
    );

    // IAM Role for EC2 instances
    const ec2Role = new aws.iam.Role(
      `${sanitizedName}-ec2-role`,
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
          Name: `${sanitizedName}-ec2-role`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // IAM Instance Profile
    const ec2InstanceProfile = new aws.iam.InstanceProfile(
      `${sanitizedName}-ec2-instance-profile`,
      {
        role: ec2Role.name,
      },
      { parent: this }
    );

    // Custom policy for EC2 instances (least privilege)
    const ec2Policy = new aws.iam.Policy(
      `${sanitizedName}-ec2-policy`,
      {
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
              Resource: `arn:aws:logs:*:*:log-group:/aws/ec2/${sanitizedName}*`,
            },
          ],
        }),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `${sanitizedName}-ec2-role-policy`,
      {
        role: ec2Role.name,
        policyArn: ec2Policy.arn,
      },
      { parent: this }
    );

    // Launch Template
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `${sanitizedName}-main-launch-template`,
      {
        name: `${sanitizedName}-lt`,
        imageId: aws.ec2
          .getAmi({
            mostRecent: true,
            owners: ['amazon'],
            filters: [
              {
                name: 'name',
                values: ['amzn2-ami-hvm-*-x86_64-gp2'],
              },
            ],
          })
          .then(ami => ami.id),
        instanceType: 't3.micro',
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        iamInstanceProfile: {
          name: ec2InstanceProfile.name,
        },
        userData: Buffer.from(
          `#!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
            echo "OK" > /var/www/html/health
        `
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `${sanitizedName}-instance`,
              Environment: environment,
            },
          },
        ],
      },
      { parent: this }
    );

    // Primary Auto Scaling Group
    const autoScalingGroup = new aws.autoscaling.Group(
      `${sanitizedName}-primary-asg`,
      {
        name: `${sanitizedName}-primary-asg`,
        vpcZoneIdentifiers: privateSubnets.map(subnet => subnet.id),
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `${sanitizedName}-primary-asg`,
            propagateAtLaunch: false,
          },
          {
            key: 'Environment',
            value: environment,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // Primary DynamoDB Table
    const dynamoTable = new aws.dynamodb.Table(
      `${sanitizedName}-primary-table`,
      {
        name: `${sanitizedName}-primary-table`,
        billingMode: 'PROVISIONED',
        readCapacity: 5,
        writeCapacity: 5,
        hashKey: 'id',
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
        ],
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKey.arn,
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: {
          Name: `${sanitizedName}-primary-dynamodb`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // Secondary DynamoDB Table
    new aws.dynamodb.Table(
      `${sanitizedName}-secondary-table`,
      {
        name: `${sanitizedName}-secondary-table`,
        billingMode: 'PROVISIONED',
        readCapacity: 5,
        writeCapacity: 5,
        hashKey: 'id',
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
        ],
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKey.arn,
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: {
          Name: `${sanitizedName}-secondary-dynamodb`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // Secrets Manager Secret
    const appSecret = new aws.secretsmanager.Secret(
      `${sanitizedName}-app-secret`,
      {
        name: `${sanitizedName}-pulumi-app-secrets`,
        description: 'Application secrets',
        kmsKeyId: kmsKey.id,
        tags: {
          Name: `${sanitizedName}-secrets`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // Secrets Manager access controlled via IAM role policies

    new aws.secretsmanager.SecretVersion(
      `${sanitizedName}-app-secret-version`,
      {
        secretId: appSecret.id,
        secretString: JSON.stringify({
          database_url: pulumi.interpolate`dynamodb://${dynamoTable.name}`,
          api_key: pulumi.interpolate`${sanitizedName}-${Math.random().toString(36).substring(2, 15)}`,
          jwt_secret: pulumi.interpolate`${sanitizedName}-${Math.random().toString(36).substring(2, 15)}`,
        }),
      },
      { parent: this }
    );

    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `${sanitizedName}-main-log-group`,
      {
        name: `/aws/ec2/${sanitizedName}`,
        retentionInDays: 14,
        kmsKeyId: kmsKey.arn,
        tags: {
          Name: `${sanitizedName}-logs`,
          Environment: environment,
        },
      },
      { dependsOn: [kmsKey], parent: this }
    );

    // S3 Bucket for CloudFront logs
    const cloudFrontLogsBucket = new aws.s3.Bucket(
      `${sanitizedName}-cloudfront-logs`,
      {
        bucket: cloudFrontBucketName,
        forceDestroy: true,
        tags: {
          Name: `${sanitizedName}-cloudfront-logs`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // Enable ACLs for CloudFront logging
    const cloudFrontLogsBucketOwnership = new aws.s3.BucketOwnershipControls(
      `${sanitizedName}-cloudfront-logs-ownership`,
      {
        bucket: cloudFrontLogsBucket.id,
        rule: {
          objectOwnership: 'BucketOwnerPreferred',
        },
      },
      { parent: this }
    );

    const cloudFrontLogsBucketAcl = new aws.s3.BucketAcl(
      `${sanitizedName}-cloudfront-logs-acl`,
      {
        bucket: cloudFrontLogsBucket.id,
        acl: 'private',
      },
      { dependsOn: [cloudFrontLogsBucketOwnership], parent: this }
    );

    // S3 Bucket Server Side Encryption for CloudFront logs
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${sanitizedName}-cloudfront-logs-encryption`,
      {
        bucket: cloudFrontLogsBucket.id,
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
      { parent: this }
    );

    // S3 Bucket Public Access Block for CloudFront logs (allow ACLs for CloudFront)
    new aws.s3.BucketPublicAccessBlock(
      `${sanitizedName}-cloudfront-logs-pab`,
      {
        bucket: cloudFrontLogsBucket.id,
        blockPublicAcls: false,
        blockPublicPolicy: true,
        ignorePublicAcls: false,
        restrictPublicBuckets: true,
      },
      { dependsOn: [cloudFrontLogsBucketAcl], parent: this }
    );

    // S3 Bucket Versioning for CloudFront logs
    new aws.s3.BucketVersioning(
      `${sanitizedName}-cloudfront-logs-versioning`,
      {
        bucket: cloudFrontLogsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // CloudWatch Event Rule for S3 bucket monitoring
    const s3EventRule = new aws.cloudwatch.EventRule(
      `${sanitizedName}-s3-event-rule`,
      {
        description: 'Monitor S3 bucket events',
        eventPattern: JSON.stringify({
          source: ['aws.s3'],
          'detail-type': ['Object Created'],
          detail: {
            bucket: {
              name: [cloudFrontLogsBucket.bucket],
            },
          },
        }),
      },
      { parent: this }
    );

    // CloudWatch Event Target
    new aws.cloudwatch.EventTarget(
      `${sanitizedName}-s3-event-target`,
      {
        rule: s3EventRule.name,
        arn: logGroup.arn,
      },
      { parent: this }
    );

    // S3 Bucket Lifecycle for CloudFront logs with Glacier transition
    new aws.s3.BucketLifecycleConfiguration(
      `${sanitizedName}-cloudfront-logs-lifecycle`,
      {
        bucket: cloudFrontLogsBucket.id,
        rules: [
          {
            id: 'lifecycle-logs',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 60,
                storageClass: 'GLACIER',
              },
            ],
            expiration: {
              days: 365,
            },
            noncurrentVersionExpiration: {
              noncurrentDays: 30,
            },
          },
        ],
      },
      { parent: this }
    );

    // S3 Bucket Policy for CloudFront logs (SSL enforcement + CloudFront access)
    new aws.s3.BucketPolicy(
      `${sanitizedName}-cloudfront-logs-bucket-policy`,
      {
        bucket: cloudFrontLogsBucket.id,
        policy: pulumi
          .all([cloudFrontLogsBucket.arn, current])
          .apply(([bucketArn, currentAccount]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
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
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudfront.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${bucketArn}/cloudfront-logs/*`,
                  Condition: {
                    StringEquals: {
                      'aws:SourceAccount': currentAccount.accountId,
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // WAF Web ACL
    const webAcl = new aws.wafv2.WebAcl(
      `${sanitizedName}-main-web-acl`,
      {
        name: `${sanitizedName}-cloudfront-web-acl`,
        description: 'Web ACL for DDoS protection',
        scope: 'CLOUDFRONT',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 1,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesCommonRuleSet',
                vendorName: 'AWS',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
            },
          },
          {
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
            priority: 2,
            overrideAction: {
              none: {},
            },
            statement: {
              managedRuleGroupStatement: {
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
                vendorName: 'AWS',
              },
            },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudwatchMetricsEnabled: true,
              metricName: 'KnownBadInputsRuleSetMetric',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudwatchMetricsEnabled: true,
          metricName: `${sanitizedName.replace(/-/g, '')}WebAcl`,
        },
        tags: {
          Name: `${sanitizedName}-waf`,
          Environment: environment,
        },
      },
      { parent: this }
    );

    // CloudFront Distribution with WAF protection
    const cloudFrontDistribution = new aws.cloudfront.Distribution(
      `${sanitizedName}-main-distribution`,
      {
        origins: [
          {
            domainName: alb.dnsName,
            originId: 'ALB',
            customOriginConfig: {
              httpPort: 80,
              httpsPort: 443,
              originProtocolPolicy: 'http-only',
              originSslProtocols: ['TLSv1.2'],
            },
          },
        ],
        enabled: true,
        defaultCacheBehavior: {
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
          targetOriginId: 'ALB',
          compress: true,
          viewerProtocolPolicy: 'redirect-to-https',
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
        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },
        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },
        loggingConfig: {
          bucket: cloudFrontLogsBucket.bucketDomainName,
          includeCookies: false,
          prefix: 'cloudfront-logs/',
        },
        webAclId: webAcl.arn,
        tags: {
          Name: `${sanitizedName}-cloudfront`,
          Environment: environment,
        },
      },
      { parent: this, dependsOn: [webAcl] }
    );

    // Secondary Auto Scaling Group for redundancy
    const secondaryAutoScalingGroup = new aws.autoscaling.Group(
      `${sanitizedName}-secondary-asg`,
      {
        name: `${sanitizedName}-secondary-asg`,
        vpcZoneIdentifiers: privateSubnets.map(subnet => subnet.id),
        targetGroupArns: [secondaryTargetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 2,
        maxSize: 4,
        desiredCapacity: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `${sanitizedName}-secondary-asg`,
            propagateAtLaunch: false,
          },
          {
            key: 'Environment',
            value: environment,
            propagateAtLaunch: true,
          },
          {
            key: 'Service',
            value: 'secondary',
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // Set outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(
      publicSubnets.map(subnet => subnet.id)
    );
    this.privateSubnetIds = pulumi.output(
      privateSubnets.map(subnet => subnet.id)
    );
    this.albDnsName = alb.dnsName;
    this.albZoneId = alb.zoneId;
    this.cloudFrontDomainName = cloudFrontDistribution.domainName;
    this.dynamoTableName = dynamoTable.name;
    this.secretArn = appSecret.arn;
    this.kmsKeyId = kmsKey.keyId;
    this.kmsKeyArn = kmsKey.arn;
    this.webAclArn = webAcl.arn;
    this.logGroupName = logGroup.name;
    this.albLogsBucketName = albLogsBucket.bucket;
    this.cloudFrontLogsBucketName = cloudFrontLogsBucket.bucket;
    // Additional outputs for testing
    this.albArn = alb.arn;
    this.targetGroupArn = targetGroup.arn;
    this.secondaryTargetGroupArn = secondaryTargetGroup.arn;
    this.autoScalingGroupName = autoScalingGroup.name;
    this.secondaryAutoScalingGroupName = secondaryAutoScalingGroup.name;
    this.launchTemplateName = launchTemplate.name;
    this.ec2RoleArn = ec2Role.arn;
    this.albSecurityGroupId = albSecurityGroup.id;
    this.ec2SecurityGroupId = ec2SecurityGroup.id;
    this.cloudFrontDistributionId = cloudFrontDistribution.id;
    this.environment = pulumi.output(environment);
    this.sanitizedName = pulumi.output(sanitizedName);

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      albDnsName: this.albDnsName,
      albZoneId: this.albZoneId,
      cloudFrontDomainName: this.cloudFrontDomainName,
      dynamoTableName: this.dynamoTableName,
      secretArn: this.secretArn,
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      webAclArn: this.webAclArn,
      logGroupName: this.logGroupName,
      albLogsBucketName: this.albLogsBucketName,
      cloudFrontLogsBucketName: this.cloudFrontLogsBucketName,
      // Additional outputs for testing
      albArn: alb.arn,
      targetGroupArn: targetGroup.arn,
      secondaryTargetGroupArn: secondaryTargetGroup.arn,
      autoScalingGroupName: autoScalingGroup.name,
      secondaryAutoScalingGroupName: secondaryAutoScalingGroup.name,
      launchTemplateName: launchTemplate.name,
      ec2RoleArn: ec2Role.arn,
      albSecurityGroupId: albSecurityGroup.id,
      ec2SecurityGroupId: ec2SecurityGroup.id,
      cloudFrontDistributionId: cloudFrontDistribution.id,
      environment: environment,
      sanitizedName: sanitizedName,
    });
  }
}
