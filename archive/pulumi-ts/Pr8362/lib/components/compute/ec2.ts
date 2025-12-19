import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface Ec2InstanceArgs {
  name: string;
  instanceType: string;
  amiId?: pulumi.Input<string>;
  subnetId: pulumi.Input<string>;
  securityGroupIds: pulumi.Input<string>[];
  keyName?: string;
  iamInstanceProfile?: pulumi.Input<string>;
  userData?: pulumi.Input<string>;
  ebsOptimized?: boolean;
  monitoring?: boolean;
  tags?: Record<string, string>;
  rootBlockDevice?: {
    volumeType?: string;
    volumeSize?: number;
    deleteOnTermination?: boolean;
    encrypted?: boolean;
    kmsKeyId?: pulumi.Input<string>;
  };
}

export interface Ec2InstanceResult {
  instance: aws.ec2.Instance;
  instanceId: pulumi.Output<string>;
  privateIp: pulumi.Output<string>;
  publicIp?: pulumi.Output<string>;
}

export interface AutoScalingGroupArgs {
  name: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  subnetIds: pulumi.Input<string>[];
  targetGroupArns?: pulumi.Input<string>[];
  healthCheckType?: string;
  healthCheckGracePeriod?: number;
  launchTemplate: {
    id: pulumi.Input<string>;
    version: pulumi.Input<string>;
  };
  tags?: Record<string, string>;
}

export interface LaunchTemplateArgs {
  name: string;
  instanceType: string;
  amiId?: pulumi.Input<string>;
  securityGroupIds: pulumi.Input<string>[];
  keyName?: string;
  iamInstanceProfile?: {
    name?: pulumi.Input<string>;
    arn?: pulumi.Input<string>;
  };
  userData?: pulumi.Input<string>;
  ebsOptimized?: boolean;
  monitoring?: boolean;
  tags?: Record<string, string>;
  blockDeviceMappings?: Array<{
    deviceName: string;
    ebs?: {
      volumeType?: string;
      volumeSize?: number;
      deleteOnTermination?: boolean;
      encrypted?: boolean;
      kmsKeyId?: pulumi.Input<string>;
    };
  }>;
}

export class Ec2InstanceComponent extends pulumi.ComponentResource {
  public readonly instance: aws.ec2.Instance;
  public readonly instanceId: pulumi.Output<string>;
  public readonly privateIp: pulumi.Output<string>;
  public readonly publicIp?: pulumi.Output<string>;

  constructor(
    name: string,
    args: Ec2InstanceArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:compute:Ec2InstanceComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Get latest Amazon Linux 2 AMI if not specified
    const amiId =
      args.amiId ||
      aws.ec2
        .getAmi(
          {
            mostRecent: true,
            owners: ['amazon'],
            filters: [
              {
                name: 'name',
                values: ['amzn2-ami-hvm-*-x86_64-gp2'],
              },
              {
                name: 'virtualization-type',
                values: ['hvm'],
              },
            ],
          },
          { provider: opts?.provider }
        )
        .then(ami => ami.id);

    // Default user data for security hardening
    const defaultUserData = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y awslogs

# Configure CloudWatch agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/system-logs",
                        "log_stream_name": "{instance_id}/messages"
                    },
                    {
                        "file_path": "/var/log/secure",
                        "log_group_name": "/aws/ec2/security-logs",
                        "log_stream_name": "{instance_id}/secure"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Security hardening
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Install security updates
yum update -y --security
`;

    this.instance = new aws.ec2.Instance(
      `${name}-instance`,
      {
        ami: amiId,
        instanceType: args.instanceType,
        subnetId: args.subnetId,
        vpcSecurityGroupIds: args.securityGroupIds,
        keyName: args.keyName,
        iamInstanceProfile: args.iamInstanceProfile,
        userData: args.userData || defaultUserData,
        ebsOptimized: args.ebsOptimized ?? true,
        monitoring: args.monitoring ?? true,
        rootBlockDevice: args.rootBlockDevice
          ? {
              volumeType: args.rootBlockDevice.volumeType || 'gp3',
              volumeSize: args.rootBlockDevice.volumeSize || 20,
              deleteOnTermination:
                args.rootBlockDevice.deleteOnTermination ?? true,
              encrypted: args.rootBlockDevice.encrypted ?? true,
              kmsKeyId: args.rootBlockDevice.kmsKeyId,
            }
          : {
              volumeType: 'gp3',
              volumeSize: 20,
              deleteOnTermination: true,
              encrypted: true,
            },
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.instanceId = this.instance.id;
    this.privateIp = this.instance.privateIp;
    this.publicIp = this.instance.publicIp;

    this.registerOutputs({
      instance: this.instance,
      instanceId: this.instanceId,
      privateIp: this.privateIp,
      publicIp: this.publicIp,
    });
  }
}

export class LaunchTemplateComponent extends pulumi.ComponentResource {
  public readonly launchTemplate: aws.ec2.LaunchTemplate;
  public readonly launchTemplateId: pulumi.Output<string>;
  public readonly latestVersion: pulumi.Output<string>;

  constructor(
    name: string,
    args: LaunchTemplateArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:compute:LaunchTemplateComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Get latest Amazon Linux 2 AMI if not specified
    const amiId =
      args.amiId ||
      aws.ec2
        .getAmi(
          {
            mostRecent: true,
            owners: ['amazon'],
            filters: [
              {
                name: 'name',
                values: ['amzn2-ami-hvm-*-x86_64-gp2'],
              },
              {
                name: 'virtualization-type',
                values: ['hvm'],
              },
            ],
          },
          { provider: opts?.provider }
        )
        .then(ami => ami.id);

    // Default user data for security hardening
    const defaultUserData = Buffer.from(
      `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y awslogs

# Configure CloudWatch agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/system-logs",
                        "log_stream_name": "{instance_id}/messages"
                    },
                    {
                        "file_path": "/var/log/secure",
                        "log_group_name": "/aws/ec2/security-logs",
                        "log_stream_name": "{instance_id}/secure"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Security hardening
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Install security updates
yum update -y --security
`
    ).toString('base64');

    // Fixed blockDeviceMappings type issues
    const defaultBlockDeviceMappings = args.blockDeviceMappings?.map(
      mapping => ({
        deviceName: mapping.deviceName,
        ebs: mapping.ebs
          ? {
              volumeType: mapping.ebs.volumeType,
              volumeSize: mapping.ebs.volumeSize,
              deleteOnTermination: mapping.ebs.deleteOnTermination?.toString(), // Convert boolean to string
              encrypted: mapping.ebs.encrypted?.toString(), // Convert boolean to string
              kmsKeyId: mapping.ebs.kmsKeyId,
            }
          : undefined,
      })
    ) || [
      {
        deviceName: '/dev/xvda',
        ebs: {
          volumeType: 'gp3',
          volumeSize: 20,
          deleteOnTermination: 'true', // Use string instead of boolean
          encrypted: 'true', // Use string instead of boolean
        },
      },
    ];

    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `${name}-lt`,
      {
        namePrefix: `${args.name}-`,
        imageId: amiId,
        instanceType: args.instanceType,
        keyName: args.keyName,
        vpcSecurityGroupIds: args.securityGroupIds,
        iamInstanceProfile: args.iamInstanceProfile,
        userData: args.userData || defaultUserData,
        ebsOptimized: (args.ebsOptimized ?? true).toString(), // Convert boolean to string
        monitoring: {
          enabled: args.monitoring ?? true,
        },
        blockDeviceMappings: defaultBlockDeviceMappings,
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: defaultTags,
          },
          {
            resourceType: 'volume',
            tags: defaultTags,
          },
        ],
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.launchTemplateId = this.launchTemplate.id;

    // Handle both mock (string) and real Pulumi output (number) cases
    const rawLatestVersion = this.launchTemplate.latestVersion;
    if (typeof rawLatestVersion === 'string') {
      // Mock case: already a string
      this.latestVersion = pulumi.output(rawLatestVersion);
    } else if (
      rawLatestVersion &&
      typeof rawLatestVersion === 'object' &&
      'apply' in rawLatestVersion
    ) {
      // Real Pulumi output case: has apply method
      this.latestVersion = (rawLatestVersion as pulumi.Output<number>).apply(
        (v: number) => v.toString()
      );
    } else {
      // Fallback case: convert to string
      this.latestVersion = pulumi.output(String(rawLatestVersion));
    }

    this.registerOutputs({
      launchTemplate: this.launchTemplate,
      launchTemplateId: this.launchTemplateId,
      latestVersion: this.latestVersion,
    });
  }
}

export class AutoScalingGroupComponent extends pulumi.ComponentResource {
  public readonly autoScalingGroup: aws.autoscaling.Group;
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly autoScalingGroupArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: AutoScalingGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:compute:AutoScalingGroupComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Convert tags to ASG tag format
    const asgTags = Object.entries(defaultTags).map(([key, value]) => ({
      key: key,
      value: value,
      propagateAtLaunch: true,
    }));

    this.autoScalingGroup = new aws.autoscaling.Group(
      `${name}-asg`,
      {
        name: args.name,
        minSize: args.minSize,
        maxSize: args.maxSize,
        desiredCapacity: args.desiredCapacity,
        vpcZoneIdentifiers: args.subnetIds,
        targetGroupArns: args.targetGroupArns,
        healthCheckType: args.healthCheckType || 'ELB',
        healthCheckGracePeriod: args.healthCheckGracePeriod || 300,
        launchTemplate: {
          id: args.launchTemplate.id,
          version: args.launchTemplate.version,
        },
        tags: asgTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.autoScalingGroupName = this.autoScalingGroup.name;
    this.autoScalingGroupArn = this.autoScalingGroup.arn;

    this.registerOutputs({
      autoScalingGroup: this.autoScalingGroup,
      autoScalingGroupName: this.autoScalingGroupName,
      autoScalingGroupArn: this.autoScalingGroupArn,
    });
  }
}

export function createEc2Instance(
  name: string,
  args: Ec2InstanceArgs,
  opts?: pulumi.ComponentResourceOptions
): Ec2InstanceResult {
  const ec2Component = new Ec2InstanceComponent(name, args, opts);
  return {
    instance: ec2Component.instance,
    instanceId: ec2Component.instanceId,
    privateIp: ec2Component.privateIp,
    publicIp: ec2Component.publicIp,
  };
}

export function createLaunchTemplate(
  name: string,
  args: LaunchTemplateArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const launchTemplateComponent = new LaunchTemplateComponent(name, args, opts);
  return {
    launchTemplate: launchTemplateComponent.launchTemplate,
    launchTemplateId: launchTemplateComponent.launchTemplateId,
    latestVersion: launchTemplateComponent.latestVersion,
  };
}

export function createAutoScalingGroup(
  name: string,
  args: AutoScalingGroupArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const asgComponent = new AutoScalingGroupComponent(name, args, opts);
  return {
    autoScalingGroup: asgComponent.autoScalingGroup,
    autoScalingGroupName: asgComponent.autoScalingGroupName,
    autoScalingGroupArn: asgComponent.autoScalingGroupArn,
  };
}
