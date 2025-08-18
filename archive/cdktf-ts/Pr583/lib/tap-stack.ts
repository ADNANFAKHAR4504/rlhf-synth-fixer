import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsSsmParameter } from '@cdktf/provider-aws/lib/data-aws-ssm-parameter';
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
      region: props.awsRegion,
    });

    const namePrefix = `iacProject-${props.environmentSuffix}`;

    const vpcResources = createVpcWithInternetAccess(this, namePrefix);
    const vpc = vpcResources.vpc;
    const igw = vpcResources.igw;
    const routeTable = vpcResources.routeTable;
    const publicSubnets = vpcResources.publicSubnets;

    const sg = new SecurityGroupConfig(this, `${namePrefix}-sg`, {
      vpcId: vpc.id,
      allowedCidr: '203.0.113.0/24',
    });

    const instanceIds = [] as string[];
    const allocationIds = [] as string[];
    const amiParam = new DataAwsSsmParameter(this, `${namePrefix}-ami-param`, {
      name: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
    });
    publicSubnets.forEach((subnet, index) => {
      const name = `${namePrefix}-ec2-${index + 1}`;

      const result = createEc2InstanceWithEip(this, name, {
        subnetId: subnet.id,
        ami: amiParam.value,
        instanceType: 't3.micro',
        sgId: sg.securityGroup.id,
        availabilityZone: subnet.availabilityZone,
      });

      instanceIds.push(result.instance.id);
      allocationIds.push(result.eip.id);
    });

    new TerraformOutput(this, 'VpcId', {
      value: vpc.id,
      description: 'ID of the created VPC',
    });

    new TerraformOutput(this, 'SubnetIds', {
      value: publicSubnets.map(s => s.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'InternetGatewayId', {
      value: igw.id,
      description: 'ID of the attached Internet Gateway',
    });

    new TerraformOutput(this, 'RouteTableId', {
      value: routeTable.id,
      description: 'ID of the public route table with IGW route',
    });

    new TerraformOutput(this, 'SecurityGroupId', {
      value: sg.securityGroup.id,
      description: 'ID of the security group allowing SSH and HTTP',
    });

    new TerraformOutput(this, 'InstanceIds', {
      value: instanceIds,
      description: 'IDs of the EC2 instances launched',
    });

    new TerraformOutput(this, 'ElasticIpAllocationIds', {
      value: allocationIds,
      description: 'Elastic IP allocation IDs associated with EC2 instances',
    });
  }
}
