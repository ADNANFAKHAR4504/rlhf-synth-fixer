import { Construct } from 'constructs';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SubnetsModule } from '../subnets';

export interface Ec2ModuleProps {
  subnetsModule: SubnetsModule;
  environment: string;
}

export class Ec2Module extends Construct {
  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);

    const { subnetsModule, environment } = props;

    new Instance(this, 'DevInstance', {
      ami: 'ami-083e865b97bdf1c1b',
      instanceType: 't2.micro',
      subnetId: subnetsModule.publicSubnets[0].id,
      associatePublicIpAddress: true,
      tags: {
        Environment: environment,
      },
    });
  }
}
