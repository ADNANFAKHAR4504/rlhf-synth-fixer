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
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

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
    const stateBucketRegion = props?.stateBucketRegion || 'us-west-2';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/migration-${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Add Migration Stack instantiation here
    new MigrationStack(this, 'migration', {
      environmentSuffix,
      awsRegion,
      defaultTags: props?.defaultTags,
    });
  }
}
