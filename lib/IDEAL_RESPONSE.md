Here's a complete Pulumi TypeScript implementation that creates a secure and monitorable AWS cloud environment:

## File: infrastructure.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export class SecureCloudEnvironment {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnet: aws.ec2.Subnet;
  public readonly privateSubnet: aws.ec2.Subnet;
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateway: aws.ec2.NatGateway;
  public readonly ec2Instance: aws.ec2.Instance;
  public readonly rdsInstance: aws.rds.Instance;
  public readonly s3Bucket: aws.s3.Bucket;
  public readonly iamRole: aws.iam.Role;
  public readonly cloudWatchLogGroup: aws.cloudwatch.LogGroup;

  constructor(environment: string) {
    // Configure AWS Provider for ap-south-1 region
    const provider = new aws.Provider('aws-provider', {
      region: 'ap-south-1',
    });

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones(
      {
        state: 'available',
      },
      { provider }
    );

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key(
      `${environment}-kms-key`,
      {
        description: 'KMS key for encryption',
        enableKeyRotation: true,
      },
      { provider }
    );

    new aws.kms.Alias(
      `${environment}-kms-alias`,
      {
        name: `alias/${environment}-encryption-key`,
        targetKeyId: kmsKey.keyId,
      },
      { provider }
    );

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `${environment}-vpc`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `${environment}-vpc`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `${environment}-igw`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${environment}-igw`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );

    // Create public subnet
    this.publicSubnet = new aws.ec2.Subnet(
      `${environment}-public-subnet`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.then(az => az.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${environment}-public-subnet`,
          Environment: environment,
          Department: 'IT',
          Type: 'Public',
        },
      },
      { provider }
    );

    // Create private subnet
    this.privateSubnet = new aws.ec2.Subnet(
      `${environment}-private-subnet`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: availabilityZones.then(az => az.names[1]),
        tags: {
          Name: `${environment}-private-subnet`,
          Environment: environment,
          Department: 'IT',
          Type: 'Private',
        },
      },
      { provider }
    );

    // Create additional private subnet for RDS (Multi-AZ requirement)
    const privateSubnet2 = new aws.ec2.Subnet(
      `${environment}-private-subnet-2`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.3.0/24',
        availabilityZone: availabilityZones.then(
          az => az.names[2] || az.names[0]
        ),
        tags: {
          Name: `${environment}-private-subnet-2`,
          Environment: environment,
          Department: 'IT',
          Type: 'Private',
        },
      },
      { provider }
    );

    // Create Elastic IP for NAT Gateway
    const natEip = new aws.ec2.Eip(
      `${environment}-nat-eip`,
      {
        domain: 'vpc',
        tags: {
          Name: `${environment}-nat-eip`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider, dependsOn: [this.internetGateway] }
    );

    // Create NAT Gateway
    this.natGateway = new aws.ec2.NatGateway(
      `${environment}-nat-gateway`,
      {
        allocationId: natEip.id,
        subnetId: this.publicSubnet.id,
        tags: {
          Name: `${environment}-nat-gateway`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );

    // Create route table for public subnet
    const publicRouteTable = new aws.ec2.RouteTable(
      `${environment}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${environment}-public-rt`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );

    // Create route for public subnet to Internet Gateway
    new aws.ec2.Route(
      `${environment}-public-route`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { provider }
    );

    // Associate public subnet with public route table
    new aws.ec2.RouteTableAssociation(
      `${environment}-public-rta`,
      {
        subnetId: this.publicSubnet.id,
        routeTableId: publicRouteTable.id,
      },
      { provider }
    );

    // Create route table for private subnet
    const privateRouteTable = new aws.ec2.RouteTable(
      `${environment}-private-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `${environment}-private-rt`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );

    // Create route for private subnet to NAT Gateway
    new aws.ec2.Route(
      `${environment}-private-route`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateway.id,
      },
      { provider }
    );

    // Associate private subnets with private route table
    new aws.ec2.RouteTableAssociation(
      `${environment}-private-rta`,
      {
        subnetId: this.privateSubnet.id,
        routeTableId: privateRouteTable.id,
      },
      { provider }
    );

    new aws.ec2.RouteTableAssociation(
      `${environment}-private-rta-2`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      },
      { provider }
    );

    // Create Security Group for EC2 with SSH access from 193.10.210.0
    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `${environment}-ec2-sg`,
      {
        name: `${environment}-ec2-sg`,
        description: 'Security group for EC2 instance',
        vpcId: this.vpc.id,
        ingress: [
          {
            description: 'SSH from 193.10.210.0',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['193.10.210.0/32'],
          },
        ],
        egress: [
          {
            description: 'All outbound traffic',
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          Name: `${environment}-ec2-sg`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );

    // Create Security Group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `${environment}-rds-sg`,
      {
        name: `${environment}-rds-sg`,
        description: 'Security group for RDS instance',
        vpcId: this.vpc.id,
        ingress: [
          {
            description: 'MySQL from EC2',
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [ec2SecurityGroup.id],
          },
        ],
        tags: {
          Name: `${environment}-rds-sg`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );

    // Create DB Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `${environment}-db-subnet-group`,
      {
        name: `${environment}-db-subnet-group`,
        subnetIds: [this.privateSubnet.id, privateSubnet2.id],
        tags: {
          Name: `${environment}-db-subnet-group`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );

    // Get latest MySQL engine version
    const engineVersion = aws.rds.getEngineVersion(
      {
        engine: 'mysql',
        defaultOnly: true,
      },
      { provider }
    );

    // Create CloudWatch Log Group
    this.cloudWatchLogGroup = new aws.cloudwatch.LogGroup(
      `${environment}-log-group`,
      {
        name: `/aws/ec2/${environment}`,
        retentionInDays: 14,
        tags: {
          Name: `${environment}-log-group`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );

    // Create CloudWatch Log Stream
    new aws.cloudwatch.LogStream(
      `${environment}-log-stream`,
      {
        name: `${environment}-log-stream`,
        logGroupName: this.cloudWatchLogGroup.name,
      },
      { provider }
    );

    // Create IAM Role for EC2
    this.iamRole = new aws.iam.Role(
      `${environment}-ec2-role`,
      {
        name: `${environment}-ec2-role`,
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
          Name: `${environment}-ec2-role`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );

    // Create S3 bucket
    this.s3Bucket = new aws.s3.Bucket(
      `${environment}-s3-bucket`,
      {
        bucket: `${environment}-secure-bucket-${Date.now()}`,
        tags: {
          Name: `${environment}-s3-bucket`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );

    // Enable S3 bucket versioning - Fixed to use non-deprecated version
    new aws.s3.BucketVersioning(
      `${environment}-s3-versioning`,
      {
        bucket: this.s3Bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider }
    );

    // Enable S3 bucket encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${environment}-s3-encryption`,
      {
        bucket: this.s3Bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              kmsMasterKeyId: kmsKey.arn,
              sseAlgorithm: 'aws:kms',
            },
          },
        ],
      },
      { provider }
    );

    // Block S3 public access
    new aws.s3.BucketPublicAccessBlock(
      `${environment}-block-public-access`,
      {
        bucket: this.s3Bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { provider }
    );

    // Create IAM policy for S3 access (scoped to PutObject only)
    const s3Policy = new aws.iam.Policy(
      `${environment}-s3-policy`,
      {
        name: `${environment}-s3-policy`,
        description: 'Policy for S3 bucket access',
        policy: pulumi.all([this.s3Bucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:PutObject'],
                Resource: `${bucketArn}/*`,
              },
            ],
          })
        ),
      },
      { provider }
    );

    // Create IAM policy for CloudWatch Logs
    const cloudWatchPolicy = new aws.iam.Policy(
      `${environment}-cloudwatch-policy`,
      {
        name: `${environment}-cloudwatch-policy`,
        description: 'Policy for CloudWatch Logs access',
        policy: pulumi
          .all([this.cloudWatchLogGroup.arn])
          .apply(([logGroupArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                  Resource: `${logGroupArn}:*`,
                },
              ],
            })
          ),
      },
      { provider }
    );

    // Attach S3 policy to IAM role
    new aws.iam.RolePolicyAttachment(
      `${environment}-s3-policy-attachment`,
      {
        role: this.iamRole.name,
        policyArn: s3Policy.arn,
      },
      { provider }
    );

    // Attach CloudWatch policy to IAM role
    new aws.iam.RolePolicyAttachment(
      `${environment}-cloudwatch-policy-attachment`,
      {
        role: this.iamRole.name,
        policyArn: cloudWatchPolicy.arn,
      },
      { provider }
    );

    // Attach Session Manager policy to IAM role
    new aws.iam.RolePolicyAttachment(
      `${environment}-ssm-policy-attachment`,
      {
        role: this.iamRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { provider }
    );

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `${environment}-instance-profile`,
      {
        name: `${environment}-instance-profile`,
        role: this.iamRole.name,
      },
      { provider }
    );

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
      { provider }
    );

    // Create EC2 instance with CloudWatch agent user data
    this.ec2Instance = new aws.ec2.Instance(
      `${environment}-ec2-instance`,
      {
        ami: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        subnetId: this.publicSubnet.id,
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        iamInstanceProfile: instanceProfile.name,
        associatePublicIpAddress: true,
        userData: pulumi
          .all([this.cloudWatchLogGroup.name])
          .apply(([logGroupName]) =>
            Buffer.from(
              `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
echo '{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "${logGroupName}",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}' > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
`
            ).toString('base64')
          ),
        tags: {
          Name: `${environment}-ec2-instance`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );

    // Create RDS instance with managed password and CloudWatch logs
    this.rdsInstance = new aws.rds.Instance(
      `${environment}-rds-instance`,
      {
        identifier: `${environment}-mysql-db`,
        engine: 'mysql',
        engineVersion: engineVersion.then(e => e.version),
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        dbName: 'appdb',
        username: 'admin',
        manageMasterUserPassword: true,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: dbSubnetGroup.name,
        multiAz: false,
        skipFinalSnapshot: true,
        enabledCloudwatchLogsExports: ['error', 'slowquery'],
        tags: {
          Name: `${environment}-rds-instance`,
          Environment: environment,
          Department: 'IT',
        },
      },
      { provider }
    );
  }

  // Method to get exported values (instead of using pulumi.export in constructor)
  public getExports() {
    return {
      vpcId: this.vpc.id,
      publicSubnetId: this.publicSubnet.id,
      privateSubnetId: this.privateSubnet.id,
      ec2InstanceId: this.ec2Instance.id,
      ec2PublicIp: this.ec2Instance.publicIp,
      rdsEndpoint: this.rdsInstance.endpoint,
      s3BucketName: this.s3Bucket.bucket,
      iamRoleArn: this.iamRole.arn,
      cloudWatchLogGroup: this.cloudWatchLogGroup.name,
      internetGatewayId: this.internetGateway.id,
      natGatewayId: this.natGateway.id,
    };
  }
}
```

## File: tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

// Import your nested stacks here. For example:
// import { DynamoDBStack } from "./dynamodb-stack";
import { SecureCloudEnvironment } from './infrastructure';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 *
 * Note:
 * - DO NOT create resources directly here unless they are truly global.
 * - Use other components (e.g., DynamoDBStack) for AWS resource definitions.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly infrastructure: SecureCloudEnvironment;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    this.infrastructure = new SecureCloudEnvironment(environmentSuffix);

    // Register the outputs of this component.
    this.registerOutputs({
      infrastructure: this.infrastructure,
    });
  }
}
```
