import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { ElasticBeanstalkApplication } from '@cdktf/provider-aws/lib/elastic-beanstalk-application';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Fn, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface TapStackConfig {
  env: {
    region: string;
  };
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  defaultTags?: { tags: Record<string, string> };
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    const region = config.env.region || 'us-east-1';
    const randomSuffix = Fn.substr(Fn.uuid(), 0, 8);

    // AWS Provider
    new AwsProvider(this, 'aws', { region });

    // VPC
    const vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
    });

    new InternetGateway(this, 'main-igw', {
      vpcId: vpc.id,
    });

    // Subnets
    new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${region}a`,
      mapPublicIpOnLaunch: true,
    });

    new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${region}b`,
      mapPublicIpOnLaunch: true,
    });

    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: `${region}a`,
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.4.0/24',
      availabilityZone: `${region}b`,
    });

    // Security Groups
    const ebSecurityGroup = new SecurityGroup(this, 'eb-sg', {
      namePrefix: 'eb-sg',
      description: 'Security group for Elastic Beanstalk',
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
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
    });

    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      namePrefix: 'rds-sg',
      description: 'Security group for RDS',
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [ebSecurityGroup.id],
        },
      ],
    });

    // RDS Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `db-subnet-group-${randomSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
    });

    // RDS Instance with security features
    new DbInstance(this, 'postgres-db', {
      identifier: `rds-db-${randomSuffix}`,
      engine: 'postgres',
      engineVersion: '15.13',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'webapp',
      username: 'adminuser', // required field
      manageMasterUserPassword: true, // Security: Use AWS Secrets Manager
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      multiAz: true, // High availability
      storageEncrypted: true, // Security: Encrypt storage
      backupRetentionPeriod: 7,
      skipFinalSnapshot: true,
    });

    // Elastic Beanstalk Application
    new ElasticBeanstalkApplication(this, 'webapp', {
      name: `webapp-${randomSuffix}`,
      description: 'Web application with failover',
    });

    // Route 53 for DNS
    new Route53Zone(this, 'hosted-zone', {
      name: 'mytestapp-demo.com',
    });

    // S3 for failover
    new S3Bucket(this, 'failover-bucket', {
      bucket: `failover-bucket-${randomSuffix}`,
    });

    // SNS for monitoring
    new SnsTopic(this, 'alert-topic', {
      name: `alerts-${randomSuffix}`,
    });
  }
}
