import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';

export class AutoScalingStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const { vpc, appSecurityGroup } = props;

    // IAM Role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, `EC2InstanceRole${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'), // For Systems Manager
      ],
      inlinePolicies: {
        S3AccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                `arn:aws:s3:::webapp-storage-${environmentSuffix}-*`,
                `arn:aws:s3:::webapp-storage-${environmentSuffix}-*/*`,
              ],
            }),
          ],
        }),
      },
      roleName: `EC2InstanceRole${environmentSuffix}`,
    });

    // User data script for web server setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd amazon-cloudwatch-agent',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Application Server - ' + environmentSuffix + '</h1>" > /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
      'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html',
      // Simple health check endpoint
      'echo "OK" > /var/www/html/health',
      // Configure CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s'
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, `WebAppLaunchTemplate${environmentSuffix}`, {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      userData,
      securityGroup: appSecurityGroup,
      role: ec2Role,
      launchTemplateName: `WebAppLaunchTemplate${environmentSuffix}`,
      requireImdsv2: true, // Security best practice
    });

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, `WebAppASG${environmentSuffix}`, {
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheckType: 'ELB',
      healthCheckGracePeriod: cdk.Duration.minutes(5),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 1,
        pauseTime: cdk.Duration.minutes(5),
      }),
      autoScalingGroupName: `WebAppASG${environmentSuffix}`,
    });

    // Create Target Group for the Auto Scaling Group
    this.targetGroup = new elbv2.ApplicationTargetGroup(this, `WebAppTargetGroup${environmentSuffix}`, {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.autoScalingGroup],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/health', // Custom health check endpoint
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 3,
        healthyThresholdCount: 2,
      },
      targetGroupName: `WebAppTG${environmentSuffix}`,
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // CPU-based scaling policies with proper thresholds as per requirements
    // Use the simplified scaleOnCpuUtilization method
    this.autoScalingGroup.scaleOnCpuUtilization(`CPUScaling${environmentSuffix}`, {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(5),
    });

    // Apply environment tags
    cdk.Tags.of(this.autoScalingGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(this.autoScalingGroup).add('Service', 'WebApp');
    cdk.Tags.of(this.targetGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(ec2Role).add('Environment', environmentSuffix);
    cdk.Tags.of(launchTemplate).add('Environment', environmentSuffix);

    // Outputs
    new cdk.CfnOutput(this, `AutoScalingGroupName${environmentSuffix}`, {
      value: this.autoScalingGroup.autoScalingGroupName,
      exportName: `WebAppAutoScalingGroupName${environmentSuffix}`,
      description: 'Auto Scaling Group name',
    });

    new cdk.CfnOutput(this, `AutoScalingGroupArn${environmentSuffix}`, {
      value: this.autoScalingGroup.autoScalingGroupArn,
      exportName: `WebAppAutoScalingGroupArn${environmentSuffix}`,
      description: 'Auto Scaling Group ARN',
    });

    new cdk.CfnOutput(this, `LaunchTemplateId${environmentSuffix}`, {
      value: launchTemplate.launchTemplateId || 'N/A',
      exportName: `WebAppLaunchTemplateId${environmentSuffix}`,
      description: 'Launch Template ID',
    });

    new cdk.CfnOutput(this, `EC2RoleArn${environmentSuffix}`, {
      value: ec2Role.roleArn,
      exportName: `WebAppEC2RoleArn${environmentSuffix}`,
      description: 'EC2 Instance Role ARN',
    });

    new cdk.CfnOutput(this, `TargetGroupArn${environmentSuffix}`, {
      value: this.targetGroup.targetGroupArn,
      exportName: `WebAppTargetGroupArn${environmentSuffix}`,
      description: 'Target Group ARN',
    });
  }
}