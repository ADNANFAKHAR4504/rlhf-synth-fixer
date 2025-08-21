# CDKTF TypeScript Infrastructure Solution

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput, App } from 'cdktf';
import { Construct } from 'constructs';

// Import your modules
import { S3LoggingBucketModule, VpcModule, Ec2InstanceModule } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    // Corrected: By placing 'Environment: Production' after the spread operator,
    // we ensure it will always take precedence and cannot be overridden by props.
    const providerDefaultTags: AwsProviderDefaultTags = {
      tags: {
        ...(props?.defaultTags?.tags || {}),
        Environment: 'Production',
      },
    };

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [providerDefaultTags],
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // -------------------------
    // MODULE INSTANTIATIONS
    // -------------------------

    const loggingBucket = new S3LoggingBucketModule(
      this,
      'LoggingBucketModule',
      {
        bucketName: `logging-bucket-${environmentSuffix}-${Date.now()}`,
      }
    );

    const vpcModule = new VpcModule(this, 'VpcModule');

    const ec2Instance = new Ec2InstanceModule(this, 'Ec2InstanceModule', {
      vpcId: vpcModule.vpc.id,
      subnetId: vpcModule.publicSubnets[0].id,
      // Corrected: Pass the SSH CIDR block to the module.
      // IMPORTANT: You must replace this placeholder with your actual IP address.
      sshCidrBlock: '0.0.0.0/0',
    });

    // -------------------------
    // OUTPUTS
    // -------------------------
    new TerraformOutput(this, 'LoggingBucketName', {
      value: loggingBucket.bucket.bucket,
    });

    new TerraformOutput(this, 'VpcId', {
      value: vpcModule.vpc.id,
    });

    new TerraformOutput(this, 'Ec2InstanceId', {
      value: ec2Instance.instance.id,
    });
  }
}

const app = new App();
new TapStack(app, 'tap-aws-stack');
app.synth();
```

## lib/modules.ts

```typescript
import { Construct } from 'constructs';

// Corrected: Import each resource from its specific file path to resolve module errors.
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

export interface S3LoggingBucketModuleProps {
  bucketName: string;
}

export class S3LoggingBucketModule extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3LoggingBucketModuleProps) {
    super(scope, id);

    this.bucket = new S3Bucket(this, 'LoggingBucket', {
      bucket: props.bucketName,
      // The deprecated 'acl' property has been removed.
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'BucketEncryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 'PublicAccessBlock', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new Vpc(this, 'MainVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    const internetGateway = new InternetGateway(this, 'InternetGateway', {
      vpcId: this.vpc.id,
    });

    const availabilityZones = ['us-west-2a', 'us-west-2b'];

    this.publicSubnets = availabilityZones.map(
      (zone, index) =>
        new Subnet(this, `PublicSubnet-${index}`, {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index * 2}.0/24`,
          availabilityZone: zone,
          mapPublicIpOnLaunch: true,
        })
    );

    this.privateSubnets = availabilityZones.map(
      (zone, index) =>
        new Subnet(this, `PrivateSubnet-${index}`, {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index * 2 + 1}.0/24`,
          availabilityZone: zone,
        })
    );

    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: this.vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: internetGateway.id }],
    });

    this.publicSubnets.forEach(
      (subnet, index) =>
        new RouteTableAssociation(this, `PublicRouteTableAssoc-${index}`, {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        })
    );

    availabilityZones.forEach((_, index) => {
      const eip = new Eip(this, `NatEip-${index}`, { domain: 'vpc' });

      const natGateway = new NatGateway(this, `NatGateway-${index}`, {
        allocationId: eip.id,
        subnetId: this.publicSubnets[index].id,
        dependsOn: [internetGateway],
      });

      const privateRouteTable = new RouteTable(
        this,
        `PrivateRouteTable-${index}`,
        {
          vpcId: this.vpc.id,
          route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGateway.id }],
        }
      );

      new RouteTableAssociation(this, `PrivateRouteTableAssoc-${index}`, {
        subnetId: this.privateSubnets[index].id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}

// Corrected: Add the sshCidrBlock property to the interface.
export interface Ec2InstanceModuleProps {
  vpcId: string;
  subnetId: string;
  sshCidrBlock: string;
}

export class Ec2InstanceModule extends Construct {
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, props: Ec2InstanceModuleProps) {
    super(scope, id);

    const ami = new DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
    });

    const securityGroup = new SecurityGroup(this, 'WebSecurityGroup', {
      vpcId: props.vpcId,
      description: 'Allow HTTP, HTTPS, and SSH traffic',
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS',
        },
        // Corrected: Use the property from the constructor instead of a hardcoded placeholder.
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [props.sshCidrBlock],
          description: 'Allow SSH',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
    });

    this.instance = new Instance(this, 'WebServer', {
      ami: ami.id,
      instanceType: 't2.micro',
      subnetId: props.subnetId,
      vpcSecurityGroupIds: [securityGroup.id],
      associatePublicIpAddress: true,
    });
  }
}
```