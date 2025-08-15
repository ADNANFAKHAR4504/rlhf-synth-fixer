import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export interface ComputeStackProps {
  subnetIds: string[];
  securityGroupIds: string[];
  amiId?: string;
  instanceType: string;
  instanceCount: number;
  // Removed keyName and keyMaterial
}

export class ComputeStack extends Construct {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    const environment = 'dev';
    const projectName = 'myproject';

    const { subnetIds, securityGroupIds, amiId, instanceType, instanceCount } =
      props;

    if (!subnetIds || subnetIds.length === 0) {
      throw new Error('ComputeStack: subnetIds must be provided and non-empty');
    }

    const commonTags = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'Terraform',
    };

    const latestAmi = new DataAwsAmi(this, 'LatestAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
    });

    const resolvedAmi = amiId ?? latestAmi.id;

    const userDataScript = `#!/bin/bash
echo "Hello from instance!" > /var/www/html/index.html
`;

    const ec2Instances: Instance[] = [];

    for (let i = 0; i < instanceCount; i++) {
      const ec2 = new Instance(this, `ec2-instance-${i + 1}`, {
        ami: resolvedAmi,
        instanceType,
        subnetId: subnetIds[i % subnetIds.length],
        vpcSecurityGroupIds: securityGroupIds,
        userData: userDataScript,
        monitoring: false,
        rootBlockDevice: {
          volumeType: 'gp3',
          volumeSize: 20,
          encrypted: true,
        },
        tags: {
          ...commonTags,
          Name: `${projectName}-${environment}-instance-${i + 1}`,
        },
        lifecycle: {
          createBeforeDestroy: true,
        },
      });

      ec2Instances.push(ec2);
    }

    new TerraformOutput(this, 'instance_ids', {
      value: ec2Instances.map(ec2 => ec2.id),
    });

    new TerraformOutput(this, 'public_ips', {
      value: ec2Instances.map(ec2 => ec2.publicIp),
    });

    new TerraformOutput(this, 'private_ips', {
      value: ec2Instances.map(ec2 => ec2.privateIp),
    });
  }
}
