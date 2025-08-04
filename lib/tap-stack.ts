import { TerraformStack, S3Backend } from 'cdktf';
import { Construct } from 'constructs';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  keyName?: string; // added to allow EC2 key pair injection
}

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // S3 Backend for remote state
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // AMI Lookup
    const amiData = new DataAwsAmi(this, 'ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // VPC
    const vpc = new Vpc(this, 'dev-vpc', {
      cidrBlock: '10.0.0.0/16',
      tags: {
        Environment: 'Development',
      },
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, 'dev-subnet-public-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${awsRegion}a`,
      mapPublicIpOnLaunch: true,
      tags: {
        Environment: 'Development',
      },
    });

    const publicSubnet2 = new Subnet(this, 'dev-subnet-public-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${awsRegion}b`,
      mapPublicIpOnLaunch: true,
      tags: {
        Environment: 'Development',
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'dev-igw', {
      vpcId: vpc.id,
      tags: {
        Environment: 'Development',
      },
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'dev-route-table-public', {
      vpcId: vpc.id,
      tags: {
        Environment: 'Development',
      },
    });

    new Route(this, 'dev-route-public', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'dev-rta-public-1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'dev-rta-public-2', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // Network ACL
    const networkAcl = new NetworkAcl(this, 'dev-nacl', {
      vpcId: vpc.id,
      subnetIds: [publicSubnet1.id, publicSubnet2.id],
      tags: {
        Environment: 'Development',
      },
    });

    new NetworkAclRule(this, 'dev-nacl-rule-inbound-http', {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      egress: false,
      cidrBlock: '0.0.0.0/0',
      fromPort: 80,
      toPort: 80,
    });

    new NetworkAclRule(this, 'dev-nacl-rule-inbound-https', {
      networkAclId: networkAcl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      egress: false,
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
    });

    // Security Group
    const securityGroup = new SecurityGroup(this, 'dev-sg', {
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: {
        Environment: 'Development',
      },
    });

    // EC2 Instances
    const instance1 = new Instance(this, 'dev-instance-1', {
      ami: amiData.id,
      instanceType: 't2.micro',
      subnetId: publicSubnet1.id,
      vpcSecurityGroupIds: [securityGroup.id],
      keyName: props.keyName,
      tags: {
        Environment: 'Development',
      },
      monitoring: true,
    });

    const instance2 = new Instance(this, 'dev-instance-2', {
      ami: amiData.id,
      instanceType: 't2.micro',
      subnetId: publicSubnet2.id,
      vpcSecurityGroupIds: [securityGroup.id],
      keyName: props.keyName,
      tags: {
        Environment: 'Development',
      },
      monitoring: true,
    });

    // Elastic IPs
    new Eip(this, 'dev-eip-1', {
      instance: instance1.id,
      tags: {
        Environment: 'Development',
      },
    });

    new Eip(this, 'dev-eip-2', {
      instance: instance2.id,
      tags: {
        Environment: 'Development',
      },
    });
  }
}
