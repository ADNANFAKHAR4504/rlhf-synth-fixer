import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

// LocalStack detection - kept for future enhancements
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

export interface ElasticBeanstalkStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  instanceType?: string;
  keyPairName?: string;
  domainName?: string;
  certificateArn?: string;
}

export class ElasticBeanstalkStack extends cdk.Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly vpc: ec2.Vpc;

  constructor(
    scope: Construct,
    id: string,
    props?: ElasticBeanstalkStackProps
  ) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const instanceType = props?.instanceType || 't3.micro';

    // Create Secrets Manager secret for application configuration
    const appSecret = new secretsmanager.Secret(this, 'ApplicationSecret', {
      secretName: `web-app-secrets-${environmentSuffix}`,
      description: 'Application secrets for web application environment',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\\'',
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create VPC with public subnets in 2 AZs
    this.vpc = new ec2.Vpc(this, 'WebAppVpc', {
      vpcName: `web-app-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // IAM role for EC2 instances
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      roleName: `web-app-instance-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      inlinePolicies: {
        SecretsManagerAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              resources: [appSecret.secretArn],
            }),
          ],
        }),
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: ['*'],
            }),
          ],
        }),
        SSMAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ssm:GetParameter',
                'ssm:GetParameters',
                'ssm:GetParameterHistory',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `web-app-alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    // Security group for EC2 instances
    const instanceSecurityGroup = new ec2.SecurityGroup(
      this,
      'InstanceSecurityGroup',
      {
        vpc: this.vpc,
        securityGroupName: `web-app-instance-sg-${environmentSuffix}`,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    instanceSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from ALB'
    );

    // User data script for EC2 instances - simple Node.js web server
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'set -e',
      '',
      '# Update system',
      'yum update -y',
      '',
      '# Install Node.js 20',
      'curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -',
      'yum install -y nodejs',
      '',
      '# Create application directory',
      'mkdir -p /opt/webapp',
      'cd /opt/webapp',
      '',
      '# Create a simple Node.js web server',
      "cat > server.js << 'EOF'",
      'const http = require("http");',
      'const os = require("os");',
      '',
      'const PORT = 8080;',
      'const hostname = os.hostname();',
      '',
      'const server = http.createServer((req, res) => {',
      '  const uptime = process.uptime();',
      '  const response = {',
      '    status: "healthy",',
      '    hostname: hostname,',
      '    timestamp: new Date().toISOString(),',
      '    uptime: Math.floor(uptime) + "s",',
      `    environment: "${environmentSuffix}",`,
      '    nodeVersion: process.version,',
      '    message: "Web Application Running Successfully"',
      '  };',
      '',
      '  res.writeHead(200, { "Content-Type": "application/json" });',
      '  res.end(JSON.stringify(response, null, 2));',
      '});',
      '',
      'server.listen(PORT, () => {',
      '  console.log(`Server running on port ${PORT}`);',
      '});',
      'EOF',
      '',
      '# Create systemd service',
      'cat > /etc/systemd/system/webapp.service << EOF',
      '[Unit]',
      'Description=Web Application Service',
      'After=network.target',
      '',
      '[Service]',
      'Type=simple',
      'User=root',
      'WorkingDirectory=/opt/webapp',
      'ExecStart=/usr/bin/node server.js',
      'Restart=always',
      'RestartSec=10',
      'Environment="NODE_ENV=production"',
      `Environment="APP_SECRET_ARN=${appSecret.secretArn}"`,
      '',
      '[Install]',
      'WantedBy=multi-user.target',
      'EOF',
      '',
      '# Start the service',
      'systemctl daemon-reload',
      'systemctl enable webapp',
      'systemctl start webapp',
      '',
      '# Verify service is running',
      'sleep 5',
      'systemctl status webapp || true'
    );

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'LoadBalancer',
      {
        vpc: this.vpc,
        loadBalancerName: `web-app-alb-${environmentSuffix}`,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: this.vpc,
      targetGroupName: `web-app-tg-${environmentSuffix}`,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        enabled: true,
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        healthyHttpCodes: '200',
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Listener - attached to load balancer for HTTP traffic
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const listener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create LaunchTemplate with explicit version for LocalStack compatibility
    // LocalStack requires explicit version management
    const launchTemplate = new ec2.CfnLaunchTemplate(this, 'LaunchTemplate', {
      launchTemplateName: `web-app-lt-${environmentSuffix}`,
      launchTemplateData: {
        imageId: ec2.MachineImage.latestAmazonLinux2023({
          cpuType: ec2.AmazonLinuxCpuType.X86_64,
        }).getImage(this).imageId,
        instanceType: instanceType,
        iamInstanceProfile: {
          arn: instanceRole.roleArn,
        },
        securityGroupIds: [instanceSecurityGroup.securityGroupId],
        userData: cdk.Fn.base64(userData.render()),
      },
    });

    // Auto Scaling Group using L1 CfnAutoScalingGroup with explicit version
    // This approach avoids CDK's automatic LaunchTemplate versioning which LocalStack doesn't support
    new autoscaling.CfnAutoScalingGroup(this, 'ASG', {
      autoScalingGroupName: `web-app-asg-${environmentSuffix}`,
      minSize: '2',
      maxSize: '10',
      desiredCapacity: '2',
      vpcZoneIdentifier: this.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PUBLIC,
      }).subnetIds,
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        launchTemplateId: launchTemplate.ref,
        version: '$Latest', // Use $Latest instead of $Default for LocalStack
      },
      targetGroupArns: [targetGroup.targetGroupArn],
    });

    // Wrap CfnAutoScalingGroup in L2 construct for easier manipulation
    this.autoScalingGroup =
      autoscaling.AutoScalingGroup.fromAutoScalingGroupName(
        this,
        'AutoScalingGroup',
        `web-app-asg-${environmentSuffix}`
      ) as autoscaling.AutoScalingGroup;

    // Note: Target group already attached via targetGroupArns in CfnAutoScalingGroup

    // Scaling policies using CFN resources for LocalStack compatibility
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cpuScalingPolicy = new autoscaling.CfnScalingPolicy(
      this,
      'CpuScaling',
      {
        autoScalingGroupName: `web-app-asg-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        targetTrackingConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ASGAverageCPUUtilization',
          },
          targetValue: 50,
        },
      }
    );

    // Request count scaling policy
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const requestCountScaling = new autoscaling.CfnScalingPolicy(
      this,
      'RequestCountScaling',
      {
        autoScalingGroupName: `web-app-asg-${environmentSuffix}`,
        policyType: 'TargetTrackingScaling',
        targetTrackingConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: 'ALBRequestCountPerTarget',
            resourceLabel: `${this.loadBalancer.loadBalancerFullName}/${targetGroup.targetGroupFullName}`,
          },
          targetValue: 1000,
        },
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `WebAppVpc-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `WebAppALB-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerUrl', {
      value: `http://${this.loadBalancer.loadBalancerDnsName}`,
      description: 'Application URL',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: this.autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group Name',
    });

    new cdk.CfnOutput(this, 'SecretsManagerArn', {
      value: appSecret.secretArn,
      description: 'Secrets Manager ARN for application secrets',
    });

    if (props?.certificateArn) {
      // Add HTTPS listener if certificate is provided
      this.loadBalancer.addListener('HttpsListener', {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [elbv2.ListenerCertificate.fromArn(props.certificateArn)],
        defaultTargetGroups: [targetGroup],
      });

      new cdk.CfnOutput(this, 'HTTPSUrl', {
        value: `https://${this.loadBalancer.loadBalancerDnsName}`,
        description: 'Secure Application URL',
      });
    }

    // Tag all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Application', 'WebApp');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
