import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  environment: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
}

export class ComputeConstruct extends Construct {
  public readonly webServer: ec2.Instance;
  public readonly appServer: ec2.Instance;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    const { environment, vpc, securityGroup } = props;

    // Create IAM role for EC2 instances with SSM permissions
    const ec2Role = new iam.Role(this, `EC2Role-${environment}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        EC2CustomPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:DescribeAssociation',
                'ssm:GetDeployablePatchSnapshotForInstance',
                'ssm:GetDocument',
                'ssm:DescribeDocument',
                'ssm:GetManifest',
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:ListAssociations',
                'ssm:ListInstanceAssociations',
                'ssm:PutInventory',
                'ssm:PutComplianceItems',
                'ssm:PutConfigurePackageResult',
                'ssm:UpdateAssociationStatus',
                'ssm:UpdateInstanceAssociationStatus',
                'ssm:UpdateInstanceInformation',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create instance profile (not used directly but required for EC2 instances with IAM roles)
    new iam.CfnInstanceProfile(this, `EC2InstanceProfile-${environment}`, {
      roles: [ec2Role.roleName],
    });

    // Create user data script for instance initialization
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent',
      // Install SSM agent (usually pre-installed on Amazon Linux 2)
      'yum install -y amazon-ssm-agent',
      'systemctl enable amazon-ssm-agent',
      'systemctl start amazon-ssm-agent'
    );

    // Create Web Server instance
    this.webServer = new ec2.Instance(this, `WebServer-${environment}`, {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup,
      role: ec2Role,
      userData,
      keyName: environment === 'prod' ? undefined : 'default', // Use key pair for non-prod
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            deleteOnTermination: true,
          }),
        },
      ],
    });

    // Create Application Server instance
    this.appServer = new ec2.Instance(this, `AppServer-${environment}`, {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup,
      role: ec2Role,
      userData,
      keyName: environment === 'prod' ? undefined : 'default', // Use key pair for non-prod
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            deleteOnTermination: true,
          }),
        },
      ],
    });

    // Tag instances for Patch Manager integration
    cdk.Tags.of(this.webServer).add('Name', `WebServer-${environment}`);
    cdk.Tags.of(this.webServer).add('Component', 'Compute');
    cdk.Tags.of(this.webServer).add('Environment', environment);
    cdk.Tags.of(this.webServer).add('PatchGroup', `${environment}-servers`);
    cdk.Tags.of(this.webServer).add('ServerType', 'web');

    cdk.Tags.of(this.appServer).add('Name', `AppServer-${environment}`);
    cdk.Tags.of(this.appServer).add('Component', 'Compute');
    cdk.Tags.of(this.appServer).add('Environment', environment);
    cdk.Tags.of(this.appServer).add('PatchGroup', `${environment}-servers`);
    cdk.Tags.of(this.appServer).add('ServerType', 'application');

    // Store instance information in SSM Parameter Store
    new ssm.StringParameter(this, `WebServerIPParameter-${environment}`, {
      parameterName: `/app/${environment}/compute/web-server/private-ip`,
      stringValue: this.webServer.instancePrivateIp,
      description: 'Web Server Private IP Address',
    });

    new ssm.StringParameter(this, `AppServerIPParameter-${environment}`, {
      parameterName: `/app/${environment}/compute/app-server/private-ip`,
      stringValue: this.appServer.instancePrivateIp,
      description: 'Application Server Private IP Address',
    });

    // Tag IAM role
    cdk.Tags.of(ec2Role).add('Name', `EC2Role-${environment}`);
    cdk.Tags.of(ec2Role).add('Component', 'Compute');
    cdk.Tags.of(ec2Role).add('Environment', environment);
  }
}
