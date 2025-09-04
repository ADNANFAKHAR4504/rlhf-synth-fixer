import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  environmentSuffix?: string;
}

export class ComputeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix || 'dev';

    // CloudWatch Log Group for EC2 instances
    new logs.LogGroup(this, 'EC2LogGroup', {
      logGroupName: `/aws/ec2/secure-instances-${suffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: props.kmsKey,
    });

    // Create security groups for EC2 instances
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for web servers',
      allowAllOutbound: true,
    });

    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for application servers',
      allowAllOutbound: true,
    });

    // Allow HTTPS traffic from internet to web servers
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    // Allow HTTP traffic from web servers to app servers
    appSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow HTTP from web servers'
    );

    // Create IAM roles for EC2 instances with minimal privileges
    const webServerRole = new iam.Role(this, 'WebServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for web server instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    const appServerRole = new iam.Role(this, 'AppServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for application server instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add S3 read permissions for application servers
    appServerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          `arn:aws:s3:::secure-app-data-${suffix}-${cdk.Aws.ACCOUNT_ID}`,
          `arn:aws:s3:::secure-app-data-${suffix}-${cdk.Aws.ACCOUNT_ID}/*`,
        ],
      })
    );

    // Create launch templates with encrypted EBS volumes (not used directly, instances created inline)
    /* const webServerLaunchTemplate = new ec2.LaunchTemplate(
      this,
      'WebServerLaunchTemplate',
      {
        launchTemplateName: `secure-web-server-template-${suffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: webSecurityGroup,
        role: webServerRole,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
              kmsKey: props.kmsKey,
            }),
          },
        ],
        userData: ec2.UserData.forLinux(),
      }
    ); */

    /* const appServerLaunchTemplate = new ec2.LaunchTemplate(
      this,
      'AppServerLaunchTemplate',
      {
        launchTemplateName: `secure-app-server-template-${suffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: appSecurityGroup,
        role: appServerRole,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
              kmsKey: props.kmsKey,
            }),
          },
        ],
        userData: ec2.UserData.forLinux(),
      }
    ); */

    // Deploy EC2 instances across multiple AZs
    const webInstances = [];
    const appInstances = [];

    for (let i = 0; i < 2; i++) {
      // Web server instances
      const webInstance = new ec2.Instance(this, `WebServer${i}`, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          availabilityZones: [props.vpc.availabilityZones[i]],
        },
        securityGroup: webSecurityGroup,
        role: webServerRole,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
              kmsKey: props.kmsKey,
            }),
          },
        ],
        userData: ec2.UserData.forLinux(),
      });
      webInstances.push(webInstance);

      // Application server instances
      const appInstance = new ec2.Instance(this, `AppServer${i}`, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          availabilityZones: [props.vpc.availabilityZones[i]],
        },
        securityGroup: appSecurityGroup,
        role: appServerRole,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
              kmsKey: props.kmsKey,
            }),
          },
        ],
        userData: ec2.UserData.forLinux(),
      });
      appInstances.push(appInstance);
    }

    cdk.Tags.of(this).add('Component', 'Compute');
  }
}
