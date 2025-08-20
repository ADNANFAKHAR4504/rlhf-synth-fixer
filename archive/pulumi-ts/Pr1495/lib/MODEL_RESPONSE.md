I'll create a secure AWS infrastructure using Pulumi with TypeScript that follows all the specified requirements. Here's the complete implementation:

## Core Infrastructure Code

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Configuration
const projectName = 'webapp';
const region = 'us-west-2';

// Create AWS provider for explicit region control
const awsProvider = new aws.Provider('aws-provider', {
  region: region,
});

// Get availability zones for the region
const availabilityZones = aws.getAvailabilityZones(
  {
    state: 'available',
  },
  { provider: awsProvider }
);

// VPC Configuration
const vpc = new aws.ec2.Vpc(
  `${projectName}-vpc`,
  {
    cidrBlock: '10.0.0.0/16',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      Name: `${projectName}-vpc`,
      Environment: 'production',
    },
  },
  { provider: awsProvider }
);

// Internet Gateway
const internetGateway = new aws.ec2.InternetGateway(
  `${projectName}-igw`,
  {
    vpcId: vpc.id,
    tags: {
      Name: `${projectName}-igw`,
    },
  },
  { provider: awsProvider }
);

// Public Subnets (for application servers)
const publicSubnets = availabilityZones.then(azs =>
  azs.names.slice(0, 2).map(
    (az, index) =>
      new aws.ec2.Subnet(
        `${projectName}-public-subnet-${index + 1}`,
        {
          vpcId: vpc.id,
          availabilityZone: az,
          cidrBlock: `10.0.${index + 1}.0/24`,
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `${projectName}-public-subnet-${index + 1}`,
            Type: 'public',
          },
        },
        { provider: awsProvider }
      )
  )
);

// Private Subnets (for database services)
const privateSubnets = availabilityZones.then(azs =>
  azs.names.slice(0, 2).map(
    (az, index) =>
      new aws.ec2.Subnet(
        `${projectName}-private-subnet-${index + 1}`,
        {
          vpcId: vpc.id,
          availabilityZone: az,
          cidrBlock: `10.0.${index + 10}.0/24`,
          mapPublicIpOnLaunch: false,
          tags: {
            Name: `${projectName}-private-subnet-${index + 1}`,
            Type: 'private',
          },
        },
        { provider: awsProvider }
      )
  )
);

// NAT Gateway for private subnet internet access
const natEip = new aws.ec2.Eip(
  `${projectName}-nat-eip`,
  {
    domain: 'vpc',
    tags: {
      Name: `${projectName}-nat-eip`,
    },
  },
  {
    provider: awsProvider,
    dependsOn: [internetGateway],
  }
);

const natGateway = pulumi.all([publicSubnets, natEip.id]).apply(
  ([subnets, eipId]) =>
    new aws.ec2.NatGateway(
      `${projectName}-nat-gateway`,
      {
        allocationId: eipId,
        subnetId: subnets[0].id,
        tags: {
          Name: `${projectName}-nat-gateway`,
        },
      },
      { provider: awsProvider }
    )
);

// Route Tables
const publicRouteTable = new aws.ec2.RouteTable(
  `${projectName}-public-rt`,
  {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
    ],
    tags: {
      Name: `${projectName}-public-rt`,
    },
  },
  { provider: awsProvider }
);

const privateRouteTable = new aws.ec2.RouteTable(
  `${projectName}-private-rt`,
  {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      },
    ],
    tags: {
      Name: `${projectName}-private-rt`,
    },
  },
  { provider: awsProvider }
);

// Route Table Associations
const publicRouteTableAssociations = publicSubnets.then(subnets =>
  subnets.map(
    (subnet, index) =>
      new aws.ec2.RouteTableAssociation(
        `${projectName}-public-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { provider: awsProvider }
      )
  )
);

const privateRouteTableAssociations = privateSubnets.then(subnets =>
  subnets.map(
    (subnet, index) =>
      new aws.ec2.RouteTableAssociation(
        `${projectName}-private-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { provider: awsProvider }
      )
  )
);

// Security Groups
const webSecurityGroup = new aws.ec2.SecurityGroup(
  `${projectName}-web-sg`,
  {
    name: `${projectName}-web-sg`,
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
        description: 'SSH from VPC',
        fromPort: 22,
        toPort: 22,
        protocol: 'tcp',
        cidrBlocks: [vpc.cidrBlock],
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
      Name: `${projectName}-web-sg`,
    },
  },
  { provider: awsProvider }
);

const databaseSecurityGroup = new aws.ec2.SecurityGroup(
  `${projectName}-db-sg`,
  {
    name: `${projectName}-db-sg`,
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
        description: 'All outbound traffic',
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      Name: `${projectName}-db-sg`,
    },
  },
  { provider: awsProvider }
);

// S3 Buckets with AES-256 Encryption
const applicationDataBucket = new aws.s3.Bucket(
  `${projectName}-app-data`,
  {
    bucket: `${projectName}-app-data-${pulumi.getStack()}`,
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
        bucketKeyEnabled: true,
      },
    },
    publicAccessBlock: {
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    versioning: {
      enabled: true,
    },
    tags: {
      Name: `${projectName}-app-data`,
      Environment: 'production',
    },
  },
  { provider: awsProvider }
);

const backupBucket = new aws.s3.Bucket(
  `${projectName}-backups`,
  {
    bucket: `${projectName}-backups-${pulumi.getStack()}`,
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
        bucketKeyEnabled: true,
      },
    },
    publicAccessBlock: {
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    versioning: {
      enabled: true,
    },
    lifecycleRules: [
      {
        id: 'backup-lifecycle',
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
      Name: `${projectName}-backups`,
      Environment: 'production',
    },
  },
  { provider: awsProvider }
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
  `${projectName}-web-server-role`,
  {
    name: `${projectName}-web-server-role`,
    assumeRolePolicy: ec2AssumeRolePolicy.then(policy => policy.json),
    tags: {
      Name: `${projectName}-web-server-role`,
    },
  },
  { provider: awsProvider }
);

// Policy for web servers to access application data bucket
const webServerS3Policy = new aws.iam.Policy(
  `${projectName}-web-server-s3-policy`,
  {
    name: `${projectName}-web-server-s3-policy`,
    description: 'Policy for web servers to access application data bucket',
    policy: pulumi.all([applicationDataBucket.arn]).apply(([bucketArn]) =>
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
            Action: ['s3:ListBucket'],
            Resource: bucketArn,
          },
        ],
      })
    ),
  },
  { provider: awsProvider }
);

// CloudWatch logs policy for web servers
const webServerLogsPolicy = new aws.iam.Policy(
  `${projectName}-web-server-logs-policy`,
  {
    name: `${projectName}-web-server-logs-policy`,
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
          ],
          Resource: `arn:aws:logs:${region}:*:*`,
        },
      ],
    }),
  },
  { provider: awsProvider }
);

// Attach policies to web server role
const webServerS3PolicyAttachment = new aws.iam.RolePolicyAttachment(
  `${projectName}-web-server-s3-attachment`,
  {
    role: webServerRole.name,
    policyArn: webServerS3Policy.arn,
  },
  { provider: awsProvider }
);

const webServerLogsAttachment = new aws.iam.RolePolicyAttachment(
  `${projectName}-web-server-logs-attachment`,
  {
    role: webServerRole.name,
    policyArn: webServerLogsPolicy.arn,
  },
  { provider: awsProvider }
);

// Instance profile for EC2 instances
const webServerInstanceProfile = new aws.iam.InstanceProfile(
  `${projectName}-web-server-profile`,
  {
    name: `${projectName}-web-server-profile`,
    role: webServerRole.name,
  },
  { provider: awsProvider }
);

// Database IAM Role (for RDS enhanced monitoring, etc.)
const databaseRole = new aws.iam.Role(
  `${projectName}-database-role`,
  {
    name: `${projectName}-database-role`,
    assumeRolePolicy: aws.iam
      .getPolicyDocument({
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
      })
      .then(policy => policy.json),
    tags: {
      Name: `${projectName}-database-role`,
    },
  },
  { provider: awsProvider }
);

// Attach RDS enhanced monitoring policy
const databaseMonitoringAttachment = new aws.iam.RolePolicyAttachment(
  `${projectName}-db-monitoring-attachment`,
  {
    role: databaseRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
  },
  { provider: awsProvider }
);

// Database Subnet Group
const databaseSubnetGroup = new aws.rds.SubnetGroup(
  `${projectName}-db-subnet-group`,
  {
    name: `${projectName}-db-subnet-group`,
    subnetIds: privateSubnets.then(subnets => subnets.map(subnet => subnet.id)),
    tags: {
      Name: `${projectName}-db-subnet-group`,
    },
  },
  { provider: awsProvider }
);

// Export important resource IDs and ARNs
export const vpcId = vpc.id;
export const publicSubnetIds = publicSubnets.then(subnets =>
  subnets.map(subnet => subnet.id)
);
export const privateSubnetIds = privateSubnets.then(subnets =>
  subnets.map(subnet => subnet.id)
);
export const webSecurityGroupId = webSecurityGroup.id;
export const databaseSecurityGroupId = databaseSecurityGroup.id;
export const webServerInstanceProfileName = webServerInstanceProfile.name;
export const databaseSubnetGroupName = databaseSubnetGroup.name;
export const applicationDataBucketName = applicationDataBucket.bucket;
export const backupBucketName = backupBucket.bucket;
export const region = region;
```

## Key Security Features Implemented

### 1. **Network Segmentation**

- **Public subnets** (10.0.1.0/24, 10.0.2.0/24) for web servers with internet access
- **Private subnets** (10.0.10.0/24, 10.0.11.0/24) for databases with no direct internet access
- **NAT Gateway** for private subnet outbound internet access (updates, patches)

### 2. **Security Groups with Least Privilege**

- **Web Security Group**: Only allows HTTP/HTTPS from internet, SSH from VPC
- **Database Security Group**: Only allows database ports (3306, 5432) from web security group

### 3. **S3 Security**

- **AES-256 server-side encryption** enabled on all buckets
- **Public access blocked** on all buckets
- **Versioning enabled** for data protection
- **Lifecycle policies** for cost optimization on backup bucket

### 4. **IAM Best Practices**

- **Instance profiles** instead of long-lived access keys
- **Principle of least privilege** - web servers only access specific S3 resources
- **Separate roles** for different service types
- **CloudWatch logging permissions** for monitoring

### 5. **Infrastructure Security**

- **Consistent naming convention**: `projectname-resource-type`
- **Explicit AWS provider** for region control and portability
- **Multi-AZ deployment** for high availability
- **Database subnet group** restricting database placement to private subnets

## Usage Example

To deploy this infrastructure:

```bash
# Initialize Pulumi project
pulumi new typescript

# Install dependencies
npm install @pulumi/aws @pulumi/pulumi

# Deploy infrastructure
pulumi up
```

The infrastructure creates a secure, production-ready environment where:

- Web servers in public subnets can serve HTTP/HTTPS traffic
- Databases in private subnets are isolated from internet access
- All components follow AWS security best practices
- Resources are properly tagged and organized for management
