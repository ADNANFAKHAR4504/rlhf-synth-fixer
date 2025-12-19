## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { WebAppStack } from './webapp';

// ? Import your stacks here
// import { MyStack } from './my-stack';

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

    // Instantiate WebApp stack as nested construct within this stack
    new WebAppStack(this, `WebAppStack-${environmentSuffix}`, {
      ...props,
      environmentSuffix,
    });
  }
}
```

## lib/webapp.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { Construct } from 'constructs';

interface WebAppStackProps {
  environmentSuffix?: string;
}

export class WebAppStack extends Construct {
  constructor(scope: Construct, id: string, props?: WebAppStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with specified CIDR
    const vpc = new ec2.Vpc(this, `WebAppVpc-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create Internet Gateway
    const igw = new ec2.CfnInternetGateway(this, 'InternetGateway');
    new ec2.CfnVPCGatewayAttachment(this, 'IGWAttachment', {
      vpcId: vpc.vpcId,
      internetGatewayId: igw.ref,
    });

    // Create Public Subnet 1
    const publicSubnet1 = new ec2.PublicSubnet(this, 'PublicSubnet1', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: cdk.Stack.of(this).availabilityZones[0],
      mapPublicIpOnLaunch: true,
    });

    // Create Public Subnet 2
    const publicSubnet2 = new ec2.PublicSubnet(this, 'PublicSubnet2', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: cdk.Stack.of(this).availabilityZones[1],
      mapPublicIpOnLaunch: true,
    });

    // Create Private Subnet
    const privateSubnet = new ec2.PrivateSubnet(this, 'PrivateSubnet', {
      vpcId: vpc.vpcId,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: cdk.Stack.of(this).availabilityZones[0],
    });

    // Add routes to public subnets
    publicSubnet1.addRoute('PublicRoute1', {
      routerId: igw.ref,
      routerType: ec2.RouterType.GATEWAY,
      destinationCidrBlock: '0.0.0.0/0',
    });

    publicSubnet2.addRoute('PublicRoute2', {
      routerId: igw.ref,
      routerType: ec2.RouterType.GATEWAY,
      destinationCidrBlock: '0.0.0.0/0',
    });

    // Create EC2 Instance Connect Endpoint for secure access
    const eiceSecurityGroup = new ec2.SecurityGroup(this, 'EICESecurityGroup', {
      vpc,
      description: 'Security group for EC2 Instance Connect Endpoint',
      allowAllOutbound: true,
    });

    const instanceConnectEndpoint = new ec2.CfnInstanceConnectEndpoint(
      this,
      'EC2InstanceConnectEndpoint',
      {
        subnetId: privateSubnet.subnetId,
        securityGroupIds: [eiceSecurityGroup.securityGroupId],
      }
    );

    // Create security group for Application Load Balancer
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic from internet to ALB
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    // Create security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    // Allow EC2 Instance Connect Endpoint to access EC2 instances
    ec2SecurityGroup.addIngressRule(
      eiceSecurityGroup,
      ec2.Port.tcp(22),
      'Allow SSH from EC2 Instance Connect Endpoint'
    );

    // Allow ALB to access EC2 instances on port 5000 (Flask app)
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(5000),
      'Allow HTTP traffic from ALB to web application'
    );

    // Create IAM role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Minimal IAM role for EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add minimal inline policy for EC2 instance
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ec2:DescribeInstances', 'ec2:DescribeTags'],
        resources: ['*'],
      })
    );

    // Add permissions for Systems Manager Session Manager
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:UpdateInstanceInformation',
          'ssmmessages:CreateControlChannel',
          'ssmmessages:CreateDataChannel',
          'ssmmessages:OpenControlChannel',
          'ssmmessages:OpenDataChannel',
        ],
        resources: ['*'],
      })
    );

    // Placeholder for UserData - will be configured after database creation
    const userData = ec2.UserData.forLinux();

    // Create EC2 instance in public subnet (for internet access to download packages)
    const instance = new ec2.Instance(this, 'WebAppInstance', {
      vpc,
      vpcSubnets: { subnets: [publicSubnet1] },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      userData: userData,
      detailedMonitoring: true,
      requireImdsv2: true,
    });

    // Create security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS instance',
      allowAllOutbound: false,
    });

    // Allow inbound traffic from EC2 security group to RDS
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow database connections from EC2 instances'
    );

    // Create subnet group for RDS
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      description: 'Subnet group for RDS instance',
      vpc,
      vpcSubnets: {
        subnets: [privateSubnet, publicSubnet2],
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create RDS instance with Multi-AZ and Blue/Green deployment compatibility
    const database = new rds.DatabaseInstance(this, 'WebAppDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      databaseName: `webappdb${environmentSuffix}`,
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      enablePerformanceInsights: false,
      monitoringInterval: cdk.Duration.seconds(60),
      monitoringRole: new iam.Role(this, 'RDSMonitoringRole', {
        assumedBy: new iam.ServicePrincipal('monitoring.rds.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonRDSEnhancedMonitoringRole'
          ),
        ],
      }),
      autoMinorVersionUpgrade: false,
      copyTagsToSnapshot: true,
    });

    // Grant EC2 role permissions to read database secret
    database.secret!.grantRead(ec2Role);

    // Configure UserData with Flask web application
    userData.addCommands(
      '#!/bin/bash',
      'set -e',
      'exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1',
      '',
      '# Install required packages',
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent mariadb105 jq python3 python3-pip',
      'pip3 install flask mysql-connector-python boto3',
      '',
      '# Start CloudWatch agent',
      'systemctl start amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent',
      '',
      '# Create Flask web application',
      'cat > /home/ec2-user/app.py << "PYEOF"',
      'from flask import Flask, jsonify',
      'import mysql.connector',
      'import boto3',
      'import json',
      'import os',
      '',
      'app = Flask(__name__)',
      '',
      'def get_db_connection():',
      '    secret_arn = os.environ.get("DB_SECRET_ARN")',
      '    region = os.environ.get("AWS_REGION", "us-east-1")',
      '    client = boto3.client("secretsmanager", region_name=region)',
      '    response = client.get_secret_value(SecretId=secret_arn)',
      '    secret = json.loads(response["SecretString"])',
      '    return mysql.connector.connect(',
      '        host=secret["host"],',
      '        user=secret["username"],',
      '        password=secret["password"],',
      '        database=secret.get("dbname", os.environ.get("DB_NAME"))',
      '    )',
      '',
      '@app.route("/health")',
      'def health():',
      '    try:',
      '        conn = get_db_connection()',
      '        cursor = conn.cursor()',
      '        cursor.execute("SELECT 1")',
      '        result = cursor.fetchone()',
      '        cursor.close()',
      '        conn.close()',
      '        return jsonify({"status": "healthy", "database": "connected"}), 200',
      '    except Exception as e:',
      '        return jsonify({"status": "unhealthy", "error": str(e)}), 500',
      '',
      '@app.route("/")',
      'def index():',
      '    return jsonify({"message": "Web Application Running", "endpoints": ["/health", "/"]})',
      '',
      'if __name__ == "__main__":',
      '    app.run(host="0.0.0.0", port=5000)',
      'PYEOF',
      '',
      '# Set ownership',
      'chown ec2-user:ec2-user /home/ec2-user/app.py',
      '',
      '# Create systemd service',
      'cat > /etc/systemd/system/webapp.service << "EOF"',
      '[Unit]',
      'Description=Flask Web Application',
      'After=network.target',
      '',
      '[Service]',
      'Type=simple',
      'User=ec2-user',
      'WorkingDirectory=/home/ec2-user',
      `Environment="DB_SECRET_ARN=${database.secret!.secretArn}"`,
      'Environment="AWS_REGION=us-east-1"',
      `Environment="DB_NAME=${database.instanceIdentifier}"`,
      'ExecStart=/usr/bin/python3 /home/ec2-user/app.py',
      'Restart=always',
      'RestartSec=5',
      '',
      '[Install]',
      'WantedBy=multi-user.target',
      'EOF',
      '',
      '# Start the application',
      'systemctl daemon-reload',
      'systemctl enable webapp',
      'systemctl start webapp',
      '',
      'echo "Web application installation completed successfully"'
    );

    // Create Application Load Balancer in public subnets
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc,
      internetFacing: true,
      vpcSubnets: {
        subnets: [publicSubnet1, publicSubnet2],
      },
      securityGroup: albSecurityGroup,
      deletionProtection: false,
    });

    // Create target group for EC2 instances
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebAppTargetGroup',
      {
        vpc,
        port: 5000,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          healthyHttpCodes: '200',
        },
        deregistrationDelay: cdk.Duration.seconds(30),
      }
    );

    // Add EC2 instance to target group
    targetGroup.addTarget(new targets.InstanceTarget(instance, 5000));

    // Create ALB listener on port 80
    alb.addListener('WebAppListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create CloudWatch Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'WebAppDashboard', {
      dashboardName: `SecureWebAppFoundation-${environmentSuffix}`,
    });

    // Add EC2 CPU utilization widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
        ],
        width: 12,
      })
    );

    // Add RDS CPU utilization widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [database.metricCPUUtilization()],
        width: 12,
      })
    );

    // Add ALB request count widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [alb.metricRequestCount()],
        width: 12,
      })
    );

    // Add Target Group health widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Target Health',
        left: [
          targetGroup.metricHealthyHostCount(),
          targetGroup.metricUnhealthyHostCount(),
        ],
        width: 12,
      })
    );

    // Outputs - Use parent stack for CfnOutput
    const stack = cdk.Stack.of(this);

    // Primary public access URL
    new cdk.CfnOutput(stack, 'WebAppURL', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Public URL to access the web application',
      exportName: `WebAppURL-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `LoadBalancerDNS-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'LoadBalancerArn', {
      value: alb.loadBalancerArn,
      description: 'Application Load Balancer ARN',
      exportName: `LoadBalancerArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'TargetGroupArn', {
      value: targetGroup.targetGroupArn,
      description: 'Target Group ARN',
      exportName: `TargetGroupArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VPCId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'PublicSubnet1Id', {
      value: publicSubnet1.subnetId,
      description: 'Public Subnet 1 ID',
      exportName: `PublicSubnet1Id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'PublicSubnet2Id', {
      value: publicSubnet2.subnetId,
      description: 'Public Subnet 2 ID',
      exportName: `PublicSubnet2Id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'PrivateSubnetId', {
      value: privateSubnet.subnetId,
      description: 'Private Subnet ID',
      exportName: `PrivateSubnetId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'EC2InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: `EC2InstanceId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'EC2SecurityGroupId', {
      value: ec2SecurityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
      exportName: `EC2SecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'ALBSecurityGroupId', {
      value: albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
      exportName: `ALBSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'InstanceConnectEndpointId', {
      value: instanceConnectEndpoint.ref,
      description: 'EC2 Instance Connect Endpoint ID',
      exportName: `InstanceConnectEndpointId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'RDSEndpoint', {
      value: database.dbInstanceEndpointAddress,
      description: 'RDS Instance Endpoint',
      exportName: `RDSEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'RDSInstanceId', {
      value: database.instanceIdentifier,
      description: 'RDS Instance Identifier',
      exportName: `RDSInstanceId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'RDSSecurityGroupId', {
      value: rdsSecurityGroup.securityGroupId,
      description: 'RDS Security Group ID',
      exportName: `RDSSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'DatabaseSecretArn', {
      value: database.secret!.secretArn,
      description: 'ARN of the secret containing database credentials',
      exportName: `DatabaseSecretArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(stack, 'CloudWatchDashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch Dashboard Name',
      exportName: `CloudWatchDashboardName-${environmentSuffix}`,
    });
  }
}
```
