import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { TerraformOutput } from 'cdktf';
import { LocalBackend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// LocalStack detection
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

interface MigrationStackProps {
  environmentSuffix: string;
  awsRegion: string;
  defaultTags?: AwsProviderDefaultTags;
}

class MigrationStack extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly routeTable: RouteTable;
  public readonly securityGroup: SecurityGroup;
  public readonly backupBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: MigrationStackProps) {
    super(scope, id);

    const { environmentSuffix, defaultTags } = props;

    const callerIdentity = new DataAwsCallerIdentity(this, 'current');
    const availabilityZones = new DataAwsAvailabilityZones(
      this,
      'availability-zones',
      { state: 'available' }
    );

    const commonTags = {
      ...defaultTags?.tags,
      Project: 'Migration',
      Environment: 'Production',
    };

    this.vpc = new Vpc(this, 'migration-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: `migration-vpc-${environmentSuffix}`,
      },
    });

    this.internetGateway = new InternetGateway(this, 'migration-igw', {
      vpcId: this.vpc.id,
      tags: {
        ...commonTags,
        Name: `migration-igw-${environmentSuffix}`,
      },
    });

    this.routeTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        ...commonTags,
        Name: `public-route-table-${environmentSuffix}`,
      },
      dependsOn: [this.vpc],
    });

    new Route(this, 'public-route', {
      routeTableId: this.routeTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    this.publicSubnets = [0, 1].map(index => {
      const subnet = new Subnet(this, `public-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: `\${${availabilityZones.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `public-subnet-${index + 1}-${environmentSuffix}`,
        },
        dependsOn: [this.vpc],
      });

      // Associate subnet with route table
      new RouteTableAssociation(
        this,
        `public-subnet-${index + 1}-association`,
        {
          subnetId: subnet.id,
          routeTableId: this.routeTable.id,
          dependsOn: [subnet, this.routeTable],
        }
      );

      return subnet;
    });

    this.securityGroup = new SecurityGroup(this, 'ssh-security-group', {
      name: `ssh-security-group-${environmentSuffix}`,
      description:
        'Security group allowing SSH access from anywhere (temporary)',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'SSH access from anywhere',
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
        ...commonTags,
        Name: `ssh-security-group-${environmentSuffix}`,
      },
    });

    const randomSuffix = Math.random().toString(36).substring(2, 8);

    this.backupBucket = new S3Bucket(this, 'migration-backup-bucket', {
      bucket: `migration-backup-${environmentSuffix}-${callerIdentity.accountId}-${randomSuffix}`,
      tags: {
        ...commonTags,
        Name: `migration-backup-${environmentSuffix}-${callerIdentity.accountId}-${randomSuffix}`,
      },
    });

    new TerraformOutput(this, 'vpc-id', {
      value: this.vpc.id,
    }).overrideLogicalId('vpc-id');
    new TerraformOutput(this, 'public-subnet-ids', {
      value: this.publicSubnets.map(s => s.id),
    }).overrideLogicalId('public-subnet-ids');
    new TerraformOutput(this, 'internet-gateway-id', {
      value: this.internetGateway.id,
    }).overrideLogicalId('internet-gateway-id');
    new TerraformOutput(this, 'route-table-id', {
      value: this.routeTable.id,
    }).overrideLogicalId('route-table-id');
    new TerraformOutput(this, 'security-group-id', {
      value: this.securityGroup.id,
    }).overrideLogicalId('security-group-id');
    new TerraformOutput(this, 'backup-bucket-name', {
      value: this.backupBucket.bucket,
    }).overrideLogicalId('backup-bucket-name');
    new TerraformOutput(this, 'backup-bucket-arn', {
      value: this.backupBucket.arn,
    }).overrideLogicalId('backup-bucket-arn');
  }
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = props?.awsRegion || 'us-west-2';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider with LocalStack support
    const providerConfig: any = {
      region: awsRegion,
      defaultTags: defaultTags,
    };

    // Add LocalStack-specific configuration
    if (isLocalStack) {
      providerConfig.accessKey = 'test';
      providerConfig.secretKey = 'test';
      providerConfig.skipCredentialsValidation = true;
      providerConfig.skipMetadataApiCheck = true;
      providerConfig.skipRequestingAccountId = true;
      providerConfig.s3UsePathStyle = true;
      providerConfig.endpoints = [
        {
          s3: 'http://localhost:4566',
          ec2: 'http://localhost:4566',
          iam: 'http://localhost:4566',
          sts: 'http://localhost:4566',
        },
      ];
    }

    new AwsProvider(this, 'aws', providerConfig);

    // Use LocalBackend for LocalStack compatibility instead of S3Backend
    // This avoids the "S3 bucket does not exist" error in LocalStack
    new LocalBackend(this, {
      path: `terraform.${environmentSuffix}.tfstate`,
    });

    // Add Migration Stack instantiation here
    new MigrationStack(this, 'migration', {
      environmentSuffix,
      awsRegion,
      defaultTags: props?.defaultTags,
    });
  }
}
