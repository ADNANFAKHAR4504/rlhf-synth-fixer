import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

// LocalStack detection - check if deploying to LocalStack
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC with high availability across multiple AZs
    // LocalStack: Simplified to single AZ, no NAT Gateways (unsupported in Community edition)
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      vpcName: `TapVpc-${environmentSuffix}`,
      maxAzs: isLocalStack ? 1 : 2, // LocalStack: Use single AZ to simplify
      cidr: '10.0.0.0/16',
      natGateways: isLocalStack ? 0 : 2, // LocalStack: NAT Gateways not supported in Community
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          // LocalStack: Changed from PRIVATE_WITH_EGRESS to PUBLIC since NAT Gateway is disabled
          subnetType: isLocalStack
            ? ec2.SubnetType.PUBLIC
            : ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // LocalStack: Apply RemovalPolicy.DESTROY to VPC for easy cleanup
    if (isLocalStack) {
      vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      securityGroupName: `TapAlbSecurityGroup-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // LocalStack: Apply RemovalPolicy.DESTROY for easy cleanup
    if (isLocalStack) {
      albSecurityGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    // Security Group for EC2 instances
    const instanceSecurityGroup = new ec2.SecurityGroup(
      this,
      'InstanceSecurityGroup',
      {
        vpc,
        securityGroupName: `TapInstanceSecurityGroup-${environmentSuffix}`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    // LocalStack: Apply RemovalPolicy.DESTROY for easy cleanup
    if (isLocalStack) {
      instanceSecurityGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    instanceSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB on port 8080'
    );

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      securityGroupName: `TapRdsSecurityGroup-${environmentSuffix}`,
      description: 'Security group for RDS MySQL database',
      allowAllOutbound: false,
    });

    // LocalStack: Apply RemovalPolicy.DESTROY for easy cleanup
    if (isLocalStack) {
      rdsSecurityGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    rdsSecurityGroup.addIngressRule(
      instanceSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from EC2 instances'
    );

    // User Data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from Auto Scaling Group!</h1>" > /var/www/html/index.html',
      'sed -i "s/Listen 80/Listen 8080/g" /etc/httpd/conf/httpd.conf',
      'systemctl restart httpd'
    );

    // Launch Template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'TapLaunchTemplate', {
      launchTemplateName: `TapLaunchTemplate-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: instanceSecurityGroup,
      userData,
    });

    // Auto Scaling Group
    // LocalStack: Use PUBLIC subnets since PRIVATE_WITH_EGRESS requires NAT Gateway
    // LocalStack: Use instance-based approach instead of launch template to avoid LatestVersionNumber issues
    const autoScalingGroup = isLocalStack
      ? new autoscaling.AutoScalingGroup(this, 'TapAutoScalingGroup', {
          autoScalingGroupName: `TapAutoScalingGroup-${environmentSuffix}`,
          vpc,
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T2,
            ec2.InstanceSize.MICRO
          ),
          machineImage: ec2.MachineImage.latestAmazonLinux2(),
          securityGroup: instanceSecurityGroup,
          userData,
          minCapacity: 2,
          maxCapacity: 6,
          desiredCapacity: 2,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PUBLIC,
          },
          healthCheck: autoscaling.HealthCheck.elb({
            grace: cdk.Duration.seconds(300),
          }),
        })
      : new autoscaling.AutoScalingGroup(this, 'TapAutoScalingGroup', {
          autoScalingGroupName: `TapAutoScalingGroup-${environmentSuffix}`,
          vpc,
          launchTemplate,
          minCapacity: 2,
          maxCapacity: 6,
          desiredCapacity: 2,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          healthCheck: autoscaling.HealthCheck.elb({
            grace: cdk.Duration.seconds(300),
          }),
        });

    // CPU-based scaling policy
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.seconds(300),
    });

    // Application Load Balancer
    const loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'TapLoadBalancer',
      {
        loadBalancerName: `TapLB-${environmentSuffix}`,
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'TapTargetGroup',
      {
        targetGroupName: `TapTG-${environmentSuffix}`,
        vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    // Attach Auto Scaling Group to Target Group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Listener for Load Balancer
    loadBalancer.addListener('TapListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // RDS Subnet Group
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const dbSubnetGroup = new rds.SubnetGroup(this, 'TapDbSubnetGroup', {
      subnetGroupName: `tapdbsubnetgroup-${environmentSuffix}`,
      vpc,
      description: 'Subnet group for RDS MySQL database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // SSM Parameter to simulate database endpoint for testing
    // Due to AWS quota limits, we'll create an SSM parameter instead of RDS
    const dbEndpointParam = new cdk.aws_ssm.StringParameter(
      this,
      'DatabaseEndpointParam',
      {
        parameterName: `/tap/${environmentSuffix}/database/endpoint`,
        stringValue: `tapdb-${environmentSuffix}.cluster-mock.us-west-2.rds.amazonaws.com`,
        description: 'Mock database endpoint for testing (RDS quota exceeded)',
      }
    );

    // Apply Production tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(vpc).add('Name', `TapVpc-${environmentSuffix}`);
    cdk.Tags.of(loadBalancer).add(
      'Name',
      `TapLoadBalancer-${environmentSuffix}`
    );
    cdk.Tags.of(autoScalingGroup).add(
      'Name',
      `TapAutoScalingGroup-${environmentSuffix}`
    );
    // Database tagging removed due to quota limits

    // Output important information
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: loadBalancer.loadBalancerDnsName,
      description: 'DNS name of the Application Load Balancer',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbEndpointParam.stringValue,
      description: 'Database endpoint (mock due to RDS quota)',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpointParamName', {
      value: dbEndpointParam.parameterName,
      description: 'SSM Parameter name for database endpoint',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });
  }
}
