Here's the corrected Pulumi TypeScript implementation that fixes all the build errors:

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

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

    const kmsAlias = new aws.kms.Alias(
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
        },
      },
      { provider }
    );

    // Create route for public subnet to Internet Gateway
    const publicRoute = new aws.ec2.Route(
      `${environment}-public-route`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { provider }
    );

    // Associate public subnet with public route table
    const publicRouteTableAssociation = new aws.ec2.RouteTableAssociation(
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
        },
      },
      { provider }
    );

    // Create route for private subnet to NAT Gateway
    const privateRoute = new aws.ec2.Route(
      `${environment}-private-route`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateway.id,
      },
      { provider }
    );

    // Associate private subnets with private route table
    const privateRouteTableAssociation = new aws.ec2.RouteTableAssociation(
      `${environment}-private-rta`,
      {
        subnetId: this.privateSubnet.id,
        routeTableId: privateRouteTable.id,
      },
      { provider }
    );

    const privateRouteTableAssociation2 = new aws.ec2.RouteTableAssociation(
      `${environment}-private-rta-2`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      },
      { provider }
    );

    // Create Security Group for EC2
    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `${environment}-ec2-sg`,
      {
        name: `${environment}-ec2-sg`,
        description: 'Security group for EC2 instance',
        vpcId: this.vpc.id,
        ingress: [
          {
            description: 'SSH from specific IP',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['193.10.210.0/24'],
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
        },
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
        },
      },
      { provider }
    );

    // Enable S3 bucket versioning
    const s3BucketVersioning = new aws.s3.BucketVersioningV2(
      `${environment}-s3-versioning`,
      {
        bucket: this.s3Bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { provider }
    );

    // Enable S3 bucket encryption - Fixed configuration
    const s3BucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfigurationV2(
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

    // Create IAM policy for S3 access
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
                Action: [
                  's3:GetObject',
                  's3:PutObject',
                  's3:DeleteObject',
                  's3:ListBucket',
                ],
                Resource: [bucketArn, `${bucketArn}/*`],
              },
            ],
          })
        ),
      },
      { provider }
    );

    // Attach S3 policy to IAM role
    const rolePolicyAttachment = new aws.iam.RolePolicyAttachment(
      `${environment}-role-policy-attachment`,
      {
        role: this.iamRole.name,
        policyArn: s3Policy.arn,
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

    // Create EC2 instance
    this.ec2Instance = new aws.ec2.Instance(
      `${environment}-ec2-instance`,
      {
        ami: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        subnetId: this.publicSubnet.id,
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        iamInstanceProfile: instanceProfile.name,
        associatePublicIpAddress: true,
        tags: {
          Name: `${environment}-ec2-instance`,
          Environment: environment,
        },
      },
      { provider }
    );

    // Get latest MySQL engine version
    const mysqlVersion = aws.rds.getEngineVersion(
      {
        engine: 'mysql',
        preferredVersions: ['8.0.35', '8.0.34', '8.0.33'],
      },
      { provider }
    );

    // Create RDS instance
    this.rdsInstance = new aws.rds.Instance(
      `${environment}-rds-instance`,
      {
        identifier: `${environment}-mysql-db`,
        engine: 'mysql',
        engineVersion: mysqlVersion.then(v => v.version),
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        dbName: 'appdb',
        username: 'admin',
        password: 'SecurePassword123!',
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: dbSubnetGroup.name,
        multiAz: false,
        skipFinalSnapshot: true,
        tags: {
          Name: `${environment}-rds-instance`,
          Environment: environment,
        },
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
        },
      },
      { provider }
    );

    // Create CloudWatch Log Stream
    const cloudWatchLogStream = new aws.cloudwatch.LogStream(
      `${environment}-log-stream`,
      {
        name: `${environment}-log-stream`,
        logGroupName: this.cloudWatchLogGroup.name,
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
    };
  }
}

// Usage example with exports:
// const environment = new pulumi.Config().get("environment") || "dev";
// const infrastructure = new SecureCloudEnvironment(environment);
// const exports = infrastructure.getExports();
//
// // Export values at the top level
// export const vpcId = exports.vpcId;
// export const publicSubnetId = exports.publicSubnetId;
// export const privateSubnetId = exports.privateSubnetId;
// export const ec2InstanceId = exports.ec2InstanceId;
// export const ec2PublicIp = exports.ec2PublicIp;
// export const rdsEndpoint = exports.rdsEndpoint;
// export const s3BucketName = exports.s3BucketName;
// export const iamRoleArn = exports.iamRoleArn;
// export const cloudWatchLogGroup = exports.cloudWatchLogGroup;
```

## Key Fixes Applied:

### **1. S3 Bucket Encryption Configuration Fix:**

- Changed from `serverSideEncryptionConfiguration` to direct `rules` property
- Fixed the structure to match the correct `BucketServerSideEncryptionConfigurationV2Args` interface

### **2. Pulumi Export Fix:**

- Removed `pulumi.export()` calls from within the constructor (not recommended pattern)
- Added `getExports()` method that returns all the values
- Provided usage example showing how to properly export values at the top level

### **3. Better Structure:**

- The class now focuses on resource creation
- Exports are handled outside the class using the `getExports()` method
- This follows Pulumi best practices for class-based infrastructure

### **Usage Pattern:**

```typescript
// In your main index.ts file:
import { SecureCloudEnvironment } from './infrastructure';
import * as pulumi from '@pulumi/pulumi';

const environment = new pulumi.Config().get('environment') || 'dev';
const infrastructure = new SecureCloudEnvironment(environment);
const exports = infrastructure.getExports();

// Export at the top level
export const vpcId = exports.vpcId;
export const ec2PublicIp = exports.ec2PublicIp;
export const rdsEndpoint = exports.rdsEndpoint;
// ... other exports as needed
```

This implementation should now compile successfully without any TypeScript errors while maintaining all the required functionality and security features.
