import { Construct } from 'constructs';
import { Fn } from 'cdktf';
import * as aws from '@cdktf/provider-aws';

const availabilityZones = ['us-west-2a', 'us-west-2b'];

// =============================================================================
// ## Networking Module
// =============================================================================
export interface NetworkModuleProps {
  vpcCidr: string;
  projectName: string;
}

export class NetworkModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[] = [];
  public readonly privateSubnets: aws.subnet.Subnet[] = [];

  constructor(scope: Construct, id: string, props: NetworkModuleProps) {
    super(scope, id);

    this.vpc = new aws.vpc.Vpc(this, 'Vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { Name: `${props.projectName}-vpc` },
    });

    const igw = new aws.internetGateway.InternetGateway(this, 'Igw', {
      vpcId: this.vpc.id,
      tags: { Name: `${props.projectName}-igw` },
    });

    const publicRouteTable = new aws.routeTable.RouteTable(this, 'PublicRT', {
      vpcId: this.vpc.id,
      tags: { Name: `${props.projectName}-public-rt` },
    });

    new aws.route.Route(this, 'PublicRouteToIgw', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    availabilityZones.forEach((az, i) => {
      const publicSubnet = new aws.subnet.Subnet(this, `PublicSubnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: { Name: `${props.projectName}-public-${az}` },
      });
      this.publicSubnets.push(publicSubnet);

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `PublicRTA-${i}`,
        {
          subnetId: publicSubnet.id,
          routeTableId: publicRouteTable.id,
        }
      );

      const privateSubnet = new aws.subnet.Subnet(this, `PrivateSubnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 1}.0/24`,
        availabilityZone: az,
        tags: { Name: `${props.projectName}-private-${az}` },
      });
      this.privateSubnets.push(privateSubnet);

      const eip = new aws.eip.Eip(this, `NatEip-${i}`, {
        domain: 'vpc',
        tags: { Name: `${props.projectName}-nateip-${az}` },
      });

      const natGw = new aws.natGateway.NatGateway(this, `NatGateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: { Name: `${props.projectName}-natgw-${az}` },
      });

      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `PrivateRT-${i}`,
        {
          vpcId: this.vpc.id,
          tags: { Name: `${props.projectName}-private-rt-${az}` },
        }
      );

      new aws.route.Route(this, `PrivateRouteToNat-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGw.id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `PrivateRTA-${i}`,
        {
          subnetId: privateSubnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });
  }
}

// =============================================================================
// ## Security Module
// =============================================================================
export interface SecurityModuleProps {
  vpcId: string;
  projectName: string;
}

export class SecurityModule extends Construct {
  public readonly albSg: aws.securityGroup.SecurityGroup;
  public readonly ec2Sg: aws.securityGroup.SecurityGroup;
  public readonly kmsKey: aws.kmsKey.KmsKey;
  public readonly instanceProfile: aws.iamInstanceProfile.IamInstanceProfile;

  constructor(scope: Construct, id: string, props: SecurityModuleProps) {
    super(scope, id);

    this.kmsKey = new aws.kmsKey.KmsKey(this, 'EbsKmsKey', {
      description: `KMS key for ${props.projectName} EBS volumes`,
      enableKeyRotation: true,
      tags: { Name: `${props.projectName}-ebs-key` },
    });

    this.albSg = new aws.securityGroup.SecurityGroup(this, 'AlbSG', {
      name: `${props.projectName}-alb-sg`,
      vpcId: props.vpcId,
      description: 'Allow web traffic to ALB',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP',
        },
      ],
      tags: { Name: `${props.projectName}-alb-sg` },
    });

    this.ec2Sg = new aws.securityGroup.SecurityGroup(this, 'Ec2SG', {
      name: `${props.projectName}-ec2-sg`,
      vpcId: props.vpcId,
      description: 'Allow traffic from ALB and allow outbound for updates',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          securityGroups: [this.albSg.id],
          description: 'Allow inbound from ALB',
        },
      ],
      egress: [
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow outbound HTTPS for updates',
        },
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow outbound HTTP for updates',
        },
      ],
      tags: { Name: `${props.projectName}-ec2-sg` },
    });

    // CORRECTED: This rule allows the ALB to send health check traffic to the EC2 instances.
    new aws.securityGroupRule.SecurityGroupRule(this, 'AlbEgressToEc2', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1', // Allow all protocols
      securityGroupId: this.albSg.id,
      sourceSecurityGroupId: this.ec2Sg.id,
      description:
        'Allow all outbound traffic from ALB to EC2 SG for health checks',
    });

    const ec2Role = new aws.iamRole.IamRole(this, 'Ec2Role', {
      name: `${props.projectName}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
      tags: { Name: `${props.projectName}-ec2-role` },
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'SsmManagedInstance',
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      }
    );

    this.instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'Ec2InstanceProfile',
      {
        name: `${props.projectName}-ec2-profile`,
        role: ec2Role.name,
      }
    );
  }
}

// =============================================================================
// ## Compute Module
// =============================================================================
export interface ComputeModuleProps {
  vpcId: string;
  privateSubnets: aws.subnet.Subnet[];
  publicSubnets: aws.subnet.Subnet[];
  ec2Sg: aws.securityGroup.SecurityGroup;
  albSg: aws.securityGroup.SecurityGroup;
  instanceProfile: aws.iamInstanceProfile.IamInstanceProfile;
  kmsKey: aws.kmsKey.KmsKey;
  projectName: string;
}

export class ComputeModule extends Construct {
  public readonly alb: aws.lb.Lb;

  constructor(scope: Construct, id: string, props: ComputeModuleProps) {
    super(scope, id);

    this.alb = new aws.lb.Lb(this, 'AppALB', {
      name: `${props.projectName}-alb`,
      loadBalancerType: 'application',
      internal: false,
      securityGroups: [props.albSg.id],
      subnets: props.publicSubnets.map(s => s.id),
      tags: { Name: `${props.projectName}-alb` },
    });

    const targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, 'AppTG', {
      name: `${props.projectName}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        // IMPROVED: Better health check settings
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      tags: { Name: `${props.projectName}-tg` },
    });

    new aws.lbListener.LbListener(this, 'HttpListener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    const ami = new aws.dataAwsAmi.DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
    });

    const launchTemplate = new aws.launchTemplate.LaunchTemplate(
      this,
      'WebLT',
      {
        namePrefix: `${props.projectName}-lt-`,
        imageId: ami.id,
        instanceType: 't3.micro',
        vpcSecurityGroupIds: [props.ec2Sg.id],
        iamInstanceProfile: { name: props.instanceProfile.name },
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 8,
              volumeType: 'gp3',
              encrypted: 'true',
              kmsKeyId: props.kmsKey.arn,
            },
          },
        ],
        // IMPROVED: Enhanced user data script with better error handling and logging
        userData: Fn.base64encode(`#!/bin/bash
# Log all output to a file for debugging
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting user data script execution at $(date)"

# Update the system
echo "Updating system packages..."
yum update -y
if [ $? -ne 0 ]; then
  echo "Failed to update packages"
  exit 1
fi

# Install httpd
echo "Installing httpd..."
yum install -y httpd
if [ $? -ne 0 ]; then
  echo "Failed to install httpd"
  exit 1
fi

# Start and enable httpd
echo "Starting and enabling httpd..."
systemctl start httpd
systemctl enable httpd

# Create a simple index page
echo "Creating index.html..."
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>CDKTF Webapp</title>
    <meta http-equiv="refresh" content="5">
</head>
<body>
    <h1>🚀 Deployed via CDKTF</h1>
    <p>Instance ID: <span id="instance-id">Loading...</span></p>
    <p>Current Time: <span id="time"></span></p>
    <script>
        // Get instance metadata
        fetch('/latest/meta-data/instance-id')
            .then(response => response.text())
            .then(data => document.getElementById('instance-id').textContent = data)
            .catch(err => document.getElementById('instance-id').textContent = 'Unable to fetch');
        
        // Update time
        document.getElementById('time').textContent = new Date().toLocaleString();
    </script>
</body>
</html>
EOF

# Create a health check endpoint
echo "Creating health check endpoint..."
echo "OK" > /var/www/html/health

# Ensure httpd is running
systemctl status httpd
if [ $? -eq 0 ]; then
  echo "User data script completed successfully at $(date)"
else
  echo "HTTP service is not running properly"
  exit 1
fi`),
      }
    );

    new aws.autoscalingGroup.AutoscalingGroup(this, 'WebASG', {
      name: `${props.projectName}-asg`,
      desiredCapacity: 2,
      maxSize: 4,
      minSize: 2,
      vpcZoneIdentifier: props.privateSubnets.map(s => s.id),
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      // IMPROVED: Longer grace period to allow user data script to complete
      healthCheckGracePeriod: 600, // 10 minutes instead of 5
      tag: [
        {
          key: 'Name',
          value: `${props.projectName}-instance`,
          propagateAtLaunch: true,
        },
      ],
    });
  }
}
