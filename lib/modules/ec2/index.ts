import { TerraformStack } from 'cdktf';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SubnetsModule } from '../subnets';
import { Construct } from 'constructs';

export class Ec2Module extends TerraformStack {
  constructor(scope: Construct, id: string, subnetsModule: SubnetsModule) {
    super(scope, id);

    // Create EC2 Instance
    new Instance(this, 'DevInstance', {
      ami: 'ami-0c55b159cbfafe1f0',
      instanceType: 't2.micro',
      subnetId: subnetsModule.publicSubnets[0].id,
      associatePublicIpAddress: true,
      tags: {
        Environment: 'Dev',
      },
    });
  }
}
