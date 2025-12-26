import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ComputeConstructProps {
  environmentSuffix: string;
  region: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  instanceRole: iam.Role;
}

export class ComputeConstruct extends Construct {
  public readonly instance: ec2.Instance;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    const { environmentSuffix, region, vpc, securityGroup, instanceRole } =
      props;

    // Create instance profile for the EC2 role
    new iam.CfnInstanceProfile(this, 'InstanceProfile', {
      roles: [instanceRole.roleName],
    });

    // Get the latest Amazon Linux 2023 AMI
    const machineImage = ec2.MachineImage.latestAmazonLinux2023();

    // Create EC2 instance
    this.instance = new ec2.Instance(this, 'Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage,
      securityGroup,
      role: instanceRole,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      userData: ec2.UserData.forLinux(),
      keyName: undefined, // Consider creating or referencing a key pair for SSH access
    });

    // Add user data for basic setup
    this.instance.addUserData(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Multi-Region Dev Environment</h1>" > /var/www/html/index.html',
      `echo "<p>Region: ${region}</p>" >> /var/www/html/index.html`,
      `echo "<p>Environment: ${environmentSuffix}</p>" >> /var/www/html/index.html`,
      'echo "<p>Instance started at: $(date)</p>" >> /var/www/html/index.html'
    );

    // Tag the instance
    cdk.Tags.of(this.instance).add(
      'Name',
      `ec2-instance-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.instance).add('Purpose', 'DevEnvironment');
    cdk.Tags.of(this.instance).add('Environment', environmentSuffix);
    cdk.Tags.of(this.instance).add('Region', region);
  }
}
