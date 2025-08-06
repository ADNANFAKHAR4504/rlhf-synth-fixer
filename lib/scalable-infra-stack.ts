import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export interface ScalableInfrastructureProps {
  provider: AwsProvider;
  allowedCidr: string;
  dbUsername: string;
}

export class ScalableInfrastructure extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: ScalableInfrastructureProps
  ) {
    super(scope, id);

    // Data sources for AZs and AMI
    const availabilityZones = new DataAwsAvailabilityZones(this, 'available', {
      provider: props.provider,
      state: 'available',
    });

    new DataAwsAmi(this, 'amazon-linux', {
      provider: props.provider,
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // VPC Configuration
    const vpc = new Vpc(this, 'main-vpc', {
      provider: props.provider,
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${id}-vpc`,
        Environment: 'production',
      },
    });

    // Internet Gateway for public subnet internet access
    const internetGateway = new InternetGateway(this, 'igw', {
      provider: props.provider,
      vpcId: vpc.id,
      tags: {
        Name: `${id}-igw`,
        Environment: 'production',
      },
    });

    // Public Subnets across multiple AZs for high availability
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];
    const natGateways: NatGateway[] = [];

    for (let i = 0; i < 3; i++) {
      // Public subnet for each AZ
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        provider: props.provider,
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `\${${availabilityZones.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${id}-public-subnet-${i + 1}`,
          Type: 'Public',
        },
      });
      publicSubnets.push(publicSubnet);

      // Private subnet for each AZ
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        provider: props.provider,
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${availabilityZones.fqn}.names[${i}]}`,
        tags: {
          Name: `${id}-private-subnet-${i + 1}`,
          Type: 'Private',
        },
      });
      privateSubnets.push(privateSubnet);

      // Elastic IP for NAT Gateway
      const natEip = new Eip(this, `nat-eip-${i}`, {
        provider: props.provider,
        domain: 'vpc',
        tags: {
          Name: `${id}-nat-eip-${i + 1}`,
        },
      });

      // NAT Gateway for private subnet internet access
      const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
        provider: props.provider,
        allocationId: natEip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `${id}-nat-gateway-${i + 1}`,
        },
      });
      natGateways.push(natGateway);
    }

    // Route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      provider: props.provider,
      vpcId: vpc.id,
      tags: {
        Name: `${id}-public-rt`,
      },
    });

    // Route to internet gateway for public subnets
    new Route(this, 'public-route', {
      provider: props.provider,
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        provider: props.provider,
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Route tables and routes for private subnets
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        provider: props.provider,
        vpcId: vpc.id,
        tags: {
          Name: `${id}-private-rt-${index + 1}`,
          Environment: 'production',
        },
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
        provider: props.provider,
      });

      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        provider: props.provider,
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Security Groups
    // ALB Security Group - allows HTTP traffic from specified CIDR
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      provider: props.provider,
      name: `${id}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: [props.allowedCidr],
          description: 'HTTP access from allowed CIDR',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `${id}-alb-sg`,
        Environment: 'production',
      },
    });

    // EC2 Security Group - allows traffic from ALB and SSH from specified CIDR
    const ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      provider: props.provider,
      name: `${id}-ec2-sg`,
      description: 'Security group for EC2 instances',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.id],
          description: 'HTTP from ALB',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `${id}-ec2-sg`,
        Environment: 'production',
      },
    });

    // RDS Security Group - allows MySQL access from EC2 instances
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${id}-rds-sg`,
      description: 'Security group for RDS MySQL instance',
      vpcId: vpc.id,
      provider: props.provider,
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [ec2SecurityGroup.id],
          description: 'MySQL access from EC2 instances',
        },
      ],
      tags: {
        Name: `${id}-rds-sg`,
        Environment: 'production',
      },
    });

    // S3 Bucket with server-side encryption
    const s3Bucket = new S3Bucket(this, 'app-bucket', {
      provider: props.provider,
      bucketPrefix: `${process.env.COMMIT_AUTHOR || 'unknown'}-${id}-app-bucket`,
      tags: {
        Name: `${id}-app-bucket`,
        Environment: 'production',
      },
    });

    // Enable server-side encryption for S3 bucket
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      provider: props.provider,
      bucket: s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    // Block public access to S3 bucket
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      provider: props.provider,
      bucket: s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // DynamoDB Table with primary key
    const dynamoTable = new DynamodbTable(this, 'app-table', {
      provider: props.provider,
      name: `${id}-app-table`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'id',
      attribute: [
        {
          name: 'id',
          type: 'S',
        },
      ],
      tags: {
        Name: `${id}-app-table`,
        Environment: 'production',
      },
    });

    // IAM Role for EC2 instances with least privilege access
    const ec2Role = new IamRole(this, 'ec2-role', {
      provider: props.provider,
      name: `${id}-ec2-role`,
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
        Name: `${id}-ec2-role`,
        Environment: 'production',
      },
    });

    // IAM Policy for S3 access (scoped to specific bucket)
    const s3Policy = new IamPolicy(this, 's3-policy', {
      provider: props.provider,
      name: `${id}-s3-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `${s3Bucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: s3Bucket.arn,
          },
        ],
      }),
      tags: {
        Name: `${id}-s3-policy`,
        Environment: 'production',
      },
    });

    // IAM Policy for DynamoDB access (scoped to specific table)
    const dynamoPolicy = new IamPolicy(this, 'dynamo-policy', {
      provider: props.provider,
      name: `${id}-dynamo-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: dynamoTable.arn,
          },
        ],
      }),
      tags: {
        Name: `${id}-dynamo-policy`,
        Environment: 'production',
      },
    });

    // IAM Policy for CloudWatch logging
    const cloudwatchPolicy = new IamPolicy(this, 'cloudwatch-policy', {
      provider: props.provider,
      name: `${id}-cloudwatch-policy`,
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
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${id}-cloudwatch-policy`,
        Environment: 'production',
      },
    });

    // Attach policies to EC2 role
    new IamRolePolicyAttachment(this, 'ec2-s3-policy-attachment', {
      provider: props.provider,
      role: ec2Role.name,
      policyArn: s3Policy.arn,
    });

    new IamRolePolicyAttachment(this, 'ec2-dynamo-policy-attachment', {
      provider: props.provider,
      role: ec2Role.name,
      policyArn: dynamoPolicy.arn,
    });

    new IamRolePolicyAttachment(this, 'ec2-cloudwatch-policy-attachment', {
      provider: props.provider,
      role: ec2Role.name,
      policyArn: cloudwatchPolicy.arn,
    });

    // Instance profile for EC2 instances
    new IamInstanceProfile(this, 'ec2-instance-profile', {
      provider: props.provider,
      name: `${id}-ec2-instance-profile`,
      role: ec2Role.name,
      tags: {
        Name: `${id}-ec2-instance-profile`,
        Environment: 'production',
      },
    });

    // S3 Bucket Policy - restrict access to EC2 role only
    new S3BucketPolicy(this, 'bucket-policy', {
      provider: props.provider,
      bucket: s3Bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowEC2RoleAccess',
            Effect: 'Allow',
            Principal: {
              AWS: ec2Role.arn,
            },
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `${s3Bucket.arn}/*`,
          },
          {
            Sid: 'AllowEC2RoleListBucket',
            Effect: 'Allow',
            Principal: {
              AWS: ec2Role.arn,
            },
            Action: 's3:ListBucket',
            Resource: s3Bucket.arn,
          },
        ],
      }),
    });

    // CloudWatch Log Group for VPC Flow Logs
    new CloudwatchLogGroup(this, 'vpc-flow-logs', {
      provider: props.provider,
      name: `/aws/vpc/flowlogs/${id.replace(/\s+/g, '-')}`,
      retentionInDays: 14,
      tags: {
        Name: `${id}-vpc-flow-logs`,
        Environment: 'production',
      },
    });

    // IAM Role for VPC Flow Logs
    new IamRole(this, 'flow-log-role', {
      provider: props.provider,
      name: `${id.replace(/\s+/g, '-')}-flow-log-role`,
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
        Name: `${id}-flow-log-role`,
        Environment: 'production',
      },
    });

    // IAM Policy for VPC Flow Logs
    new IamPolicy(this, 'flow-log-policy', {
      provider: props.provider,
      name: `${id.replace(/\s+/g, '-')}-flow-log-policy`,
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
      tags: {
        Name: `${id}-flow-log-policy`,
        Environment: 'production',
      },
    });

    // RDS Subnet Group for multi-AZ deployment
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      provider: props.provider,
      name: `${id.replace(/\s+/g, '-')}-db-subnet-group`,
      subnetIds: privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: `${id}-db-subnet-group`,
        Environment: 'production',
      },
    });

    // RDS MySQL Instance with Multi-AZ and encryption, using the secret for master password
    const rdsInstance = new DbInstance(this, 'rds-mysql', {
      provider: props.provider,
      identifier: `${id}-mysql`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      dbName: 'appdb',
      username: props.dbUsername,
      manageMasterUserPassword: true,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      multiAz: true,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      tags: {
        Name: `${id}-rds-mysql`,
        Environment: 'production',
      },
      lifecycle: {
        ignoreChanges: ['username'], // Ignore changes to master username
      },
    });

    // Application Load Balancer
    const alb = new Lb(this, 'alb', {
      provider: props.provider,
      name: `${id}-alb`,
      loadBalancerType: 'application',
      subnets: publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],
      tags: {
        Name: `${id}-alb`,
        Environment: 'production',
      },
    });

    // Outputs for important resource information
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Bucket.bucket,
      description: 'S3 Bucket name',
    });

    new TerraformOutput(this, 'dynamodb-table-name', {
      value: dynamoTable.name,
      description: 'DynamoDB table name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS MySQL endpoint',
    });

    new TerraformOutput(this, 'rds-username', {
      value: props.dbUsername,
      description: 'RDS MySQL username',
    });
    new TerraformOutput(this, 'rds-master-password-secret', {
      value: rdsInstance.masterUserSecret,
      description: 'RDS MySQL master password',
      sensitive: true,
    });
  }
}
