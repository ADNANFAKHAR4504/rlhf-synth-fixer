import * as cdk from 'aws-cdk-lib';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';

export class DeploymentStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { environmentSuffix, deployRole } = props;

    // Create VPC for deployment targets
    const vpc = new ec2.Vpc(this, 'DeploymentVpc', {
      vpcName: `cicd-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
    // Apply removal policy to VPC
    vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Auto Scaling Group for deployment targets
    const asg = new autoscaling.AutoScalingGroup(this, 'DeploymentASG', {
      autoScalingGroupName: `cicd-asg-${environmentSuffix}`,
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      minCapacity: 1,
      maxCapacity: 3,
      desiredCapacity: 2,
      userData: ec2.UserData.forLinux(),
    });

    // Install CodeDeploy agent
    asg.userData.addCommands(
      'yum update -y',
      'yum install -y ruby wget',
      'cd /home/ec2-user',
      'wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install',
      'chmod +x ./install',
      './install auto',
      'service codedeploy-agent start'
    );

    // CodeDeploy application
    this.application = new codedeploy.ServerApplication(this, 'Application', {
      applicationName: `cicd-app-${environmentSuffix}`,
    });

    // CodeDeploy deployment group with blue-green deployment
    this.deploymentGroup = new codedeploy.ServerDeploymentGroup(this, 'DeploymentGroup', {
      application: this.application,
      deploymentGroupName: `cicd-dg-${environmentSuffix}`,
      role: deployRole,
      autoScalingGroups: [asg],
      deploymentConfig: codedeploy.ServerDeploymentConfig.ALL_AT_ONCE,
      autoRollback: {
        failedDeployment: true,
        stoppedDeployment: true,
      },
    });

    // Tags
    cdk.Tags.of(this.application).add('Purpose', 'Deployment');
    cdk.Tags.of(this.deploymentGroup).add('Purpose', 'Deployment');
    cdk.Tags.of(asg).add('Purpose', 'DeploymentTarget');
  }
}