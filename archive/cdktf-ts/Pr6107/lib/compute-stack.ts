import { Construct } from 'constructs';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

export interface ComputeStackProps {
  environmentSuffix: string;
  vpcId: string;
  privateSubnetIds: string[];
  targetGroupArn: string;
  instanceProfileName: string;
  region: string;
  provider?: AwsProvider;
}

export interface ComputeStackOutputs {
  asgName: string;
  launchTemplateId: string;
}

export class ComputeStack extends Construct {
  public readonly outputs: ComputeStackOutputs;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpcId,
      privateSubnetIds,
      targetGroupArn,
      instanceProfileName,
      region,
      provider,
    } = props;

    const drRole = region === 'us-east-1' ? 'primary' : 'dr';

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      'DR-Role': drRole,
      ManagedBy: 'cdktf',
    };

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, `ami-${region}`, {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
      provider: provider,
    });

    // Security Group for EC2 instances
    const instanceSg = new SecurityGroup(this, `instance-sg-${region}`, {
      name: `payment-instance-sg-${environmentSuffix}-${region}`,
      description: 'Security group for payment processing instances',
      vpcId: vpcId,
      tags: {
        ...commonTags,
        Name: `payment-instance-sg-${environmentSuffix}-${region}`,
      },
      provider: provider,
    });

    new SecurityGroupRule(this, `instance-http-ingress-${region}`, {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: instanceSg.id,
      description: 'HTTP access from ALB',
      provider: provider,
    });

    new SecurityGroupRule(this, `instance-https-ingress-${region}`, {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: instanceSg.id,
      description: 'HTTPS access from ALB',
      provider: provider,
    });

    new SecurityGroupRule(this, `instance-egress-${region}`, {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: instanceSg.id,
      description: 'Allow all outbound traffic',
      provider: provider,
    });

    // User data script
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Payment Processing - ${region} - ${environmentSuffix}</h1>" > /var/www/html/index.html
echo "<p>Region: ${region}</p>" >> /var/www/html/index.html
echo "<p>DR Role: ${drRole}</p>" >> /var/www/html/index.html
`;

    // Launch Template
    const launchTemplate = new LaunchTemplate(
      this,
      `launch-template-${region}`,
      {
        name: `payment-lt-${environmentSuffix}-${region}`,
        imageId: ami.id,
        instanceType: 't3.large',
        iamInstanceProfile: {
          name: instanceProfileName,
        },
        vpcSecurityGroupIds: [instanceSg.id],
        userData: Buffer.from(userData).toString('base64'),
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 20,
              volumeType: 'gp3',
              encrypted: 'true',
              deleteOnTermination: 'true',
            },
          },
        ],
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required',
          httpPutResponseHopLimit: 1,
        },
        monitoring: {
          enabled: true,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...commonTags,
              Name: `payment-instance-${environmentSuffix}-${region}`,
            },
          },
          {
            resourceType: 'volume',
            tags: {
              ...commonTags,
              Name: `payment-volume-${environmentSuffix}-${region}`,
            },
          },
        ],
        provider: provider,
      }
    );

    // Auto Scaling Group
    const asg = new AutoscalingGroup(this, `asg-${region}`, {
      name: `payment-asg-${environmentSuffix}-${region}`,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      vpcZoneIdentifier: privateSubnetIds,
      targetGroupArns: [targetGroupArn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: `payment-instance-${environmentSuffix}-${region}`,
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: environmentSuffix,
          propagateAtLaunch: true,
        },
        {
          key: 'CostCenter',
          value: 'payment-processing',
          propagateAtLaunch: true,
        },
        {
          key: 'DR-Role',
          value: drRole,
          propagateAtLaunch: true,
        },
      ],
      provider: provider,
    });

    this.outputs = {
      asgName: asg.name,
      launchTemplateId: launchTemplate.id,
    };
  }
}
