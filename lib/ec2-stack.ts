import {
  cloudwatchLogGroup,
  dataAwsAmi,
  instance,
  securityGroup,
} from '@cdktf/provider-aws';
import { Fn, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface Ec2StackConfig {
  environment: string;
  vpcId: string;
  subnetId: string;
  instanceType: string;
  keyName?: string;
  iamInstanceProfile: string;
  allowedCidrBlocks: string[];
  commonTags: { [key: string]: string };
}

export class Ec2Stack extends TerraformStack {
  public readonly instanceId: string;
  public readonly privateIp: string;
  public readonly publicIp: string;
  public readonly securityGroupId: string;

  constructor(scope: Construct, id: string, config: Ec2StackConfig) {
    super(scope, id);

    const ami = new dataAwsAmi.DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    const sg = new securityGroup.SecurityGroup(this, 'Ec2SG', {
      namePrefix: `${config.environment}-ec2-`,
      vpcId: config.vpcId,
      ingress: [
        ...config.allowedCidrBlocks.map(cidr => ({
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [cidr],
        })),
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/8'],
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/8'],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-ec2-sg`,
      },
    });

    const ec2 = new instance.Instance(this, 'WebServer', {
      ami: ami.id,
      instanceType: config.instanceType,
      subnetId: config.subnetId,
      vpcSecurityGroupIds: [sg.id],
      keyName: config.keyName || undefined,
      iamInstanceProfile: config.iamInstanceProfile,
      userData: Fn.base64encode(
        Fn.rawString(`#!/bin/bash
      yum update -y
      yum install -y amazon-cloudwatch-agent httpd
      systemctl start httpd
      systemctl enable httpd
      echo "<h1>${config.environment} server</h1>" > /var/www/html/index.html`)
      ),

      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: config.environment === 'production' ? 20 : 10,
        deleteOnTermination: true,
        encrypted: true,
      },
      tags: {
        ...config.commonTags,
        Name: `${config.environment}-web-server`,
        Type: 'WebServer',
      },
    });

    new cloudwatchLogGroup.CloudwatchLogGroup(this, 'Ec2LogGroup', {
      name: `/aws/ec2/${config.environment}`,
      retentionInDays: config.environment === 'production' ? 365 : 30,
      tags: config.commonTags,
    });

    this.instanceId = ec2.id;
    this.privateIp = ec2.privateIp;
    this.publicIp = ec2.publicIp;
    this.securityGroupId = sg.id;

    new TerraformOutput(this, 'instance_id', { value: this.instanceId });
    new TerraformOutput(this, 'instance_private_ip', { value: this.privateIp });
    new TerraformOutput(this, 'instance_public_ip', { value: this.publicIp });
    new TerraformOutput(this, 'security_group_id', {
      value: this.securityGroupId,
    });
  }
}
