import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import {
  createVpcWithInternetAccess,
  createEc2InstanceWithEip,
  SecurityGroupConfig,
} from './modules';

export interface TapStackProps {
  environmentSuffix: string;
  stateBucket: string;
  stateBucketRegion: string;
  awsRegion: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    console.log('Environment:', props.environmentSuffix);

    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
    });

    const namePrefix = `iacProject-${props.environmentSuffix}`;

    // ✅ Create VPC and related networking resources
    const vpcResources = createVpcWithInternetAccess(this, namePrefix);
    const vpc = vpcResources.vpc;
    const igw = vpcResources.igw;
    const routeTable = vpcResources.routeTable;
    const publicSubnets = vpcResources.publicSubnets;

    // ✅ Create security group
    const sg = new SecurityGroupConfig(this, `${namePrefix}-sg`, {
      vpcId: vpc.id,
      allowedCidr: '203.0.113.0/24',
    });

    // ✅ Arrays to collect EC2 and EIP output IDs
    const instanceIds: string[] = [];
    const allocationIds: string[] = [];

    // ✅ Launch EC2 instances + EIP
    publicSubnets.forEach((subnet, index) => {
      const name = `${namePrefix}-ec2-${index + 1}`;
      const result = createEc2InstanceWithEip(this, name, {
        subnetId: subnet.id,
        ami: 'ami-084a7d336e816906b',
        instanceType: 't2.micro',
        sgId: sg.securityGroup.id,
        availabilityZone: subnet.availabilityZone,
      });

      instanceIds.push(result.instance.id);
      allocationIds.push(result.eip.id);
    });

    // ✅ Terraform Outputs for Integration Tests
    new TerraformOutput(this, 'VpcId', {
      value: vpc.id,
    });

    new TerraformOutput(this, 'SubnetIds', {
      value: publicSubnets.map(s => s.id),
    });

    new TerraformOutput(this, 'InternetGatewayId', {
      value: igw.id,
    });

    new TerraformOutput(this, 'RouteTableId', {
      value: routeTable.id,
    });

    new TerraformOutput(this, 'SecurityGroupId', {
      value: sg.securityGroup.id,
    });

    new TerraformOutput(this, 'InstanceIds', {
      value: instanceIds,
    });

    new TerraformOutput(this, 'ElasticIpAllocationIds', {
      value: allocationIds,
    });
  }
}
