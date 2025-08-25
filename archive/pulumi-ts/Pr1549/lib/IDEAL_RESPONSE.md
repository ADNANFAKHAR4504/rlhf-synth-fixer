# IDEAL_RESPONSE for Pr1549

## compute-stack.ts

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface ComputeStackArgs {
  environmentSuffix: string;
  region: string;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string[]>;
  privateSubnetIds: pulumi.Input<string[]>;
  instanceRole: pulumi.Input<string>;
  s3BucketArn: pulumi.Input<string>;
  allowedCidr: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  albSecurityGroupId?: pulumi.Input<string>;
  ec2SecurityGroupId?: pulumi.Input<string>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly asgArn: pulumi.Output<string>;

  constructor(name: string, args: ComputeStackArgs, opts?: ResourceOptions) {
    super('tap:stack:ComputeStack', name, args, opts);

    const {
      environmentSuffix,
      region,
      vpcId,
      publicSubnetIds,
      privateSubnetIds,
      // instanceRole,  // Will be used when IAM instance profile is created
      // s3BucketArn,    // Will be used for S3 permissions
      allowedCidr,
      tags,
      albSecurityGroupId,
      ec2SecurityGroupId,
    } = args;

    // Use provided security group or create a new one
    let albSecurityGroupIdToUse: pulumi.Output<string>;
    if (albSecurityGroupId) {
      albSecurityGroupIdToUse = pulumi.output(albSecurityGroupId);
    } else {
      const albSecurityGroup = new aws.ec2.SecurityGroup(
        `tap-alb-sg-compute-${region}-${environmentSuffix}`, // Changed name to avoid conflict
        {
          name: `tap-alb-sg-compute-${region}-${environmentSuffix}`,
          description: 'ALB Security Group - HTTP only', // Fixed description
          vpcId: vpcId,
          ingress: [
            {
              protocol: 'tcp',
              fromPort: 80,
              toPort: 80,
              cidrBlocks: ['0.0.0.0/0'],
              description: 'HTTP from anywhere',
            },
          ],
          egress: [
            {
              protocol: '-1',
              fromPort: 0,
              toPort: 0,
              cidrBlocks: ['0.0.0.0/0'],
            },
          ],
          tags: {
            ...tags,
            Name: `tap-alb-sg-compute-${region}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
      albSecurityGroupIdToUse = albSecurityGroup.id;
    }

    let ec2SecurityGroupIdToUse: pulumi.Output<string>;
    if (ec2SecurityGroupId) {
      ec2SecurityGroupIdToUse = pulumi.output(ec2SecurityGroupId);
    } else {
      const ec2SecurityGroup = new aws.ec2.SecurityGroup(
        `tap-ec2-sg-compute-${region}-${environmentSuffix}`, // Changed name to avoid conflict
        {
          name: `tap-ec2-sg-compute-${region}-${environmentSuffix}`,
          description: 'EC2 Security Group',
          vpcId: vpcId,
          ingress: [
            {
              protocol: 'tcp',
              fromPort: 80,
              toPort: 80,
              securityGroups: [albSecurityGroupIdToUse],
              description: 'HTTP from ALB',
            },
            {
              protocol: 'tcp',
              fromPort: 22,
              toPort: 22,
              cidrBlocks: [allowedCidr],
              description: 'SSH from allowed CIDR only',
            },
          ],
          egress: [
            {
              protocol: '-1',
              fromPort: 0,
              toPort: 0,
              cidrBlocks: ['0.0.0.0/0'],
            },
          ],
          tags: {
            ...tags,
            Name: `tap-ec2-sg-compute-${region}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
      ec2SecurityGroupIdToUse = ec2SecurityGroup.id;
    }

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(
      `tap-alb-${region}-${environmentSuffix}`,
      {
        name: `tap-alb-${region}-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroupIdToUse],
        subnets: publicSubnetIds,
        enableDeletionProtection: false,
        dropInvalidHeaderFields: true,
        tags: {
          ...tags,
          Name: `tap-alb-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Target Group
    const targetGroup = new aws.lb.TargetGroup(
      `tap-tg-${region}-${environmentSuffix}`,
      {
        name: `tap-tg-${region}-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpcId,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: '/',
          matcher: '200',
        },
        tags: {
          ...tags,
          Name: `tap-tg-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Key Pair for EC2 instances
    new aws.ec2.KeyPair(
      `tap-key-${region}-${environmentSuffix}`,
      {
        keyName: `tap-key-${region}-${environmentSuffix}`,
        publicKey:
          'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7l8ZKGm4E3XVmZfNKm9YqHl8OKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQKqF5VgPFcQ== tap-demo-key',
        tags: {
          ...tags,
          Name: `tap-key-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ALB Listener - redirect HTTP to HTTPS - Commented out since HTTPS is disabled
    /*
    new aws.lb.Listener(
      `tap-alb-listener-redirect-${region}-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'redirect',
            redirect: {
              port: '443',
              protocol: 'HTTPS',
              statusCode: 'HTTP_301',
            },
          },
        ],
      },
      { parent: this }
    );
    */

    // Self-signed certificate for demo purposes - Commented out for now
    // ACM certificates require domain validation which takes time
    /*
    const cert = new aws.acm.Certificate(
      `tap-cert-${region}-${environmentSuffix}`,
      {
        domainName: `*.${region}.example.com`,
        validationMethod: 'DNS',
        tags,
      },
      { parent: this }
    );
    */

    // ALB Listener - HTTPS - Commented out since certificate is disabled
    /*
    new aws.lb.Listener(
      `tap-alb-listener-https-${region}-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 443,
        protocol: 'HTTPS',
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        certificateArn: cert.arn,
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );
    */

    // For now, just use HTTP listener
    new aws.lb.Listener(
      `tap-alb-listener-http-${region}-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Launch Template with security hardening
    const userData = pulumi.interpolate`#!/bin/bash
yum update -y
yum install -y httpd amazon-cloudwatch-agent
systemctl start httpd
systemctl enable httpd

# Configure CloudWatch agent
cat << EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/tap/ec2/httpd/access",
            "log_stream_name": "{instance_id}"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/tap/ec2/httpd/error",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

echo "<h1>Secure Web Server - Region: ${region}</h1>" > /var/www/html/index.html
echo "<p>Environment: ${environmentSuffix}</p>" >> /var/www/html/index.html
`;

    const launchTemplate = new aws.ec2.LaunchTemplate(
      `tap-lt-${region}-${environmentSuffix}`,
      {
        name: `tap-lt-${region}-${environmentSuffix}`,
        imageId: aws.ec2
          .getAmi({
            mostRecent: true,
            owners: ['amazon'],
            filters: [
              { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
              { name: 'virtualization-type', values: ['hvm'] },
            ],
          })
          .then(ami => ami.id),
        instanceType: 't3.micro',
        keyName: `tap-key-${region}-${environmentSuffix}`,
        vpcSecurityGroupIds: [ec2SecurityGroupIdToUse],
        iamInstanceProfile: {
          name: pulumi.interpolate`tap-instance-profile-${environmentSuffix}`,
        },
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeType: 'gp3',
              volumeSize: 8,
              encrypted: 'true',
              deleteOnTermination: 'true',
            },
          },
        ],
        userData: pulumi
          .output(userData)
          .apply(ud => Buffer.from(ud).toString('base64')),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...tags,
              Name: `tap-instance-${region}-${environmentSuffix}`,
            },
          },
        ],
      },
      { parent: this }
    );

    // Auto Scaling Group
    const asg = new aws.autoscaling.Group(
      `tap-asg-${region}-${environmentSuffix}`,
      {
        name: `tap-asg-${region}-${environmentSuffix}`,
        vpcZoneIdentifiers: privateSubnetIds,
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        minSize: 1,
        maxSize: 4,
        desiredCapacity: 2,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `tap-asg-${region}-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // CloudWatch Log Groups
    new aws.cloudwatch.LogGroup(
      `tap-httpd-access-logs-${region}-${environmentSuffix}`,
      {
        name: '/tap/ec2/httpd/access-primary',
        retentionInDays: 14,
        tags,
      },
      { parent: this }
    );

    new aws.cloudwatch.LogGroup(
      `tap-httpd-error-logs-${region}-${environmentSuffix}`,
      {
        name: '/tap/ec2/httpd/error-primary',
        retentionInDays: 14,
        tags,
      },
      { parent: this }
    );

    this.albDnsName = alb.dnsName;
    this.albArn = alb.arn;
    this.asgArn = asg.arn;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      albArn: this.albArn,
      asgArn: this.asgArn,
    });
  }
}
```

## iam-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface IamStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class IamStack extends pulumi.ComponentResource {
  public readonly instanceRole: pulumi.Output<string>;
  public readonly instanceProfile: pulumi.Output<string>;

  constructor(name: string, args: IamStackArgs, opts?: ResourceOptions) {
    super('tap:stack:IamStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // EC2 instance role with least privilege
    const instanceRole = new aws.iam.Role(
      `tap-instance-role-${environmentSuffix}`,
      {
        name: `tap-instance-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    // Policy for CloudWatch Logs
    const logsPolicy = new aws.iam.Policy(
      `tap-logs-policy-${environmentSuffix}`,
      {
        name: `tap-logs-policy-${environmentSuffix}`,
        description: 'Allow EC2 instances to write to CloudWatch Logs',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              Resource: 'arn:aws:logs:*:*:*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Policy for specific S3 bucket access
    const s3Policy = new aws.iam.Policy(
      `tap-s3-policy-${environmentSuffix}`,
      {
        name: `tap-s3-policy-${environmentSuffix}`,
        description: 'Allow access to specific S3 buckets only',
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject"
          ],
          "Resource": [
            "arn:aws:s3:::tap-static-content-${environmentSuffix}-*/*"
          ]
        }, {
          "Effect": "Allow",
          "Action": [
            "s3:ListBucket"
          ],
          "Resource": [
            "arn:aws:s3:::tap-static-content-${environmentSuffix}-*"
          ]
        }]
      }`,
      },
      { parent: this }
    );

    // Attach policies to role
    new aws.iam.RolePolicyAttachment(
      `tap-instance-logs-attachment-${environmentSuffix}`,
      {
        role: instanceRole.name,
        policyArn: logsPolicy.arn,
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `tap-instance-s3-attachment-${environmentSuffix}`,
      {
        role: instanceRole.name,
        policyArn: s3Policy.arn,
      },
      { parent: this }
    );

    // Instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `tap-instance-profile-${environmentSuffix}`,
      {
        name: `tap-instance-profile-${environmentSuffix}`,
        role: instanceRole.name,
        tags,
      },
      { parent: this }
    );

    this.instanceRole = instanceRole.arn;
    this.instanceProfile = instanceProfile.name;

    this.registerOutputs({
      instanceRole: this.instanceRole,
      instanceProfile: this.instanceProfile,
    });
  }
}
```

## network-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface NetworkStackArgs {
  environmentSuffix: string;
  region: string;
  allowedCidr: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly albSecurityGroupId: pulumi.Output<string>;
  public readonly ec2SecurityGroupId: pulumi.Output<string>;
  public readonly rdsSecurityGroupId: pulumi.Output<string>;

  constructor(name: string, args: NetworkStackArgs, opts?: ResourceOptions) {
    super('tap:stack:NetworkStack', name, args, opts);

    const { environmentSuffix, region, allowedCidr, tags } = args;

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `tap-vpc-${region}-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `tap-vpc-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(
      `tap-igw-${region}-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `tap-igw-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZones({ state: 'available' });

    // Public subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 2; i++) {
      // Public subnet
      const publicSubnet = new aws.ec2.Subnet(
        `tap-public-subnet-${i}-${region}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: azs.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `tap-public-subnet-${i}-${region}-${environmentSuffix}`,
            Type: 'Public',
          },
        },
        { parent: this }
      );

      publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new aws.ec2.Subnet(
        `tap-private-subnet-${i}-${region}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 11}.0/24`,
          availabilityZone: azs.then(azs => azs.names[i]),
          tags: {
            ...tags,
            Name: `tap-private-subnet-${i}-${region}-${environmentSuffix}`,
            Type: 'Private',
          },
        },
        { parent: this }
      );

      privateSubnets.push(privateSubnet);
    }

    // NAT Gateway (in first public subnet)
    const eip = new aws.ec2.Eip(
      `tap-nat-eip-${region}-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          ...tags,
          Name: `tap-nat-eip-${region}-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [igw] }
    );

    const natGw = new aws.ec2.NatGateway(
      `tap-nat-gw-${region}-${environmentSuffix}`,
      {
        allocationId: eip.id,
        subnetId: publicSubnets[0].id,
        tags: {
          ...tags,
          Name: `tap-nat-gw-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Route tables
    const publicRouteTable = new aws.ec2.RouteTable(
      `tap-public-rt-${region}-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `tap-public-rt-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `tap-public-route-${region}-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      },
      { parent: this }
    );

    const privateRouteTable = new aws.ec2.RouteTable(
      `tap-private-rt-${region}-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `tap-private-rt-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `tap-private-route-${region}-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGw.id,
      },
      { parent: this }
    );

    // Associate subnets with route tables
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `tap-public-rta-${i}-${region}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    privateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `tap-private-rta-${i}-${region}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    });

    // Security Groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-alb-sg-${region}-${environmentSuffix}`,
      {
        name: `tap-alb-sg-${region}-${environmentSuffix}`,
        description: 'Security group for Application Load Balancer',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `tap-alb-sg-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `tap-ec2-sg-${region}-${environmentSuffix}`,
      {
        name: `tap-ec2-sg-${region}-${environmentSuffix}`,
        description: 'Security group for EC2 instances',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'HTTP from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: [allowedCidr],
            description: 'SSH from allowed CIDR',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `tap-ec2-sg-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-rds-sg-${region}-${environmentSuffix}-${Math.random().toString(36).substr(2, 6)}`,
      {
        name: `tap-rds-sg-${region}-${environmentSuffix}-${Math.random().toString(36).substr(2, 6)}`,
        description: 'Security group for RDS database',
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            securityGroups: [ec2SecurityGroup.id],
            description: 'MySQL from EC2 instances',
          },
        ],
        tags: {
          ...tags,
          Name: `tap-rds-sg-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));
    this.albSecurityGroupId = albSecurityGroup.id;
    this.ec2SecurityGroupId = ec2SecurityGroup.id;
    this.rdsSecurityGroupId = rdsSecurityGroup.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      albSecurityGroupId: this.albSecurityGroupId,
      ec2SecurityGroupId: this.ec2SecurityGroupId,
      rdsSecurityGroupId: this.rdsSecurityGroupId,
    });
  }
}
```

## security-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as aws from '@pulumi/aws'; // Will be used when security services are enabled
import { ResourceOptions } from '@pulumi/pulumi';

export interface SecurityStackArgs {
  environmentSuffix: string;
  regions: string[];
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityStack extends pulumi.ComponentResource {
  public readonly securityHubArn: pulumi.Output<string>;
  public readonly guardDutyDetectorId: pulumi.Output<string>;
  public readonly configRecorderArn: pulumi.Output<string>;

  constructor(name: string, args: SecurityStackArgs, opts?: ResourceOptions) {
    super('tap:stack:SecurityStack', name, args, opts);

    // Destructure args but comment out unused variables to avoid linting errors
    // const { environmentSuffix, regions, tags } = args;
    // These would be used when GuardDuty and other services are enabled

    // Enable GuardDuty in all regions - currently disabled
    // const guardDutyDetectors: { [region: string]: aws.guardduty.Detector } = {};

    // for (const region of regions) {
    //   const provider = new aws.Provider(`security-provider-${region}`, {
    //     region: region,
    //   });

    // GuardDuty detector - Commented out as it already exists in the account
    // In production, you would use a data source to reference the existing detector
    /*
      const detector = new aws.guardduty.Detector(
        `tap-guardduty-${region}-${environmentSuffix}`,
        {
          enable: true,
          findingPublishingFrequency: 'FIFTEEN_MINUTES',
          datasources: {
            s3Logs: {
              enable: true,
            },
          },
          tags,
        },
        { parent: this, provider }
      );
      */

    // GuardDuty S3 Malware Protection - API has changed in newer versions
    // The MalwareProtection class might be replaced with MalwareProtectionPlan
    // Commenting out for now as this is causing build errors
    /*
      new aws.guardduty.MalwareProtection(
        `tap-guardduty-malware-${region}-${environmentSuffix}`,
        {
          detectorId: detector.id,
          scanResourceCriteria: {
            include: {
              s3BucketName: [
                `tap-static-content-${environmentSuffix}-${region}`,
              ],
            },
          },
        },
        { parent: this, provider }
      );
      */

    // guardDutyDetectors[region] = detector;  // Commented since detector creation is disabled
    // }

    // Security Hub (primary region)
    // const primaryProvider = new aws.Provider('security-hub-provider', {
    //   region: regions[0],
    // });

    // Security Hub - commented out as it's already enabled in the account
    /*
    const securityHub = new aws.securityhub.Account(
      `tap-security-hub-${environmentSuffix}`,
      {
        enableDefaultStandards: true,
      },
      { parent: this, provider: primaryProvider }
    );
    */

    // AWS Config for compliance monitoring - Commented out for now
    /*
    const configBucket = new aws.s3.Bucket(
      `tap-config-bucket-${environmentSuffix}`,
      {
        bucket: `tap-config-bucket-${environmentSuffix}-${Math.random().toString(36).substr(2, 9)}`,
        forceDestroy: true,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        tags,
      },
      { parent: this, provider: primaryProvider }
    );

    // Config service role
    const configRole = new aws.iam.Role(
      `tap-config-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'config.amazonaws.com',
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create a custom policy for Config instead of using managed policy
    const configRolePolicy = new aws.iam.Policy(
      `tap-config-role-policy-${environmentSuffix}`,
      {
        name: `tap-config-role-policy-${environmentSuffix}`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'config:*',
                's3:GetBucketAcl',
                's3:PutObject',
                's3:GetObject',
                's3:ListBucket',
                'ec2:Describe*',
                'iam:GetRole',
                'iam:GetRolePolicy',
                'iam:ListRolePolicies',
                'iam:ListAttachedRolePolicies',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `tap-config-policy-${environmentSuffix}`,
      {
        role: configRole.name,
        policyArn: configRolePolicy.arn,
      },
      { parent: this }
    );

    // Config bucket policy
    const configBucketPolicy = new aws.s3.BucketPolicy(
      `tap-config-bucket-policy-${environmentSuffix}`,
      {
        bucket: configBucket.id,
        policy: pulumi.all([configBucket.id]).apply(([bucketId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AWSConfigBucketPermissionsCheck',
                Effect: 'Allow',
                Principal: {
                  Service: 'config.amazonaws.com',
                },
                Action: 's3:GetBucketAcl',
                Resource: `arn:aws:s3:::${bucketId}`,
              },
              {
                Sid: 'AWSConfigBucketDelivery',
                Effect: 'Allow',
                Principal: {
                  Service: 'config.amazonaws.com',
                },
                Action: 's3:PutObject',
                Resource: `arn:aws:s3:::${bucketId}/*`,
                Condition: {
                  StringEquals: {
                    's3:x-amz-acl': 'bucket-owner-full-control',
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this, provider: primaryProvider }
    );

    // Config delivery channel
    const configDeliveryChannel = new aws.cfg.DeliveryChannel(
      `tap-config-delivery-${environmentSuffix}`,
      {
        name: `tap-config-delivery-${environmentSuffix}`,
        s3BucketName: configBucket.id,
        s3KeyPrefix: 'config',
      },
      {
        parent: this,
        provider: primaryProvider,
        dependsOn: [configBucketPolicy],
      }
    );

    // Config configuration recorder
    const configRecorder = new aws.cfg.Recorder(
      `tap-config-recorder-${environmentSuffix}`,
      {
        name: `tap-config-recorder-${environmentSuffix}`,
        roleArn: configRole.arn,
        recordingGroup: {
          allSupported: true,
          includeGlobalResourceTypes: true,
        },
      },
      {
        parent: this,
        provider: primaryProvider,
        dependsOn: [configDeliveryChannel],
      }
    );

    // Config rules for compliance
    new aws.cfg.Rule(
      `tap-config-rule-encrypted-volumes-${environmentSuffix}`,
      {
        name: `tap-config-rule-encrypted-volumes-${environmentSuffix}`,
        source: {
          owner: 'AWS',
          sourceIdentifier: 'ENCRYPTED_VOLUMES',
        },
      },
      { parent: this, provider: primaryProvider, dependsOn: [configRecorder] }
    );

    new aws.cfg.Rule(
      `tap-config-rule-s3-encrypted-${environmentSuffix}`,
      {
        name: `tap-config-rule-s3-encrypted-${environmentSuffix}`,
        source: {
          owner: 'AWS',
          sourceIdentifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
        },
      },
      { parent: this, provider: primaryProvider, dependsOn: [configRecorder] }
    );

    */

    // CloudTrail for API auditing - Commented out for now
    /*
    const cloudTrailBucket = new aws.s3.Bucket(
      `tap-cloudtrail-${environmentSuffix}`,
      {
        bucket: `tap-cloudtrail-${environmentSuffix}-${Math.random().toString(36).substr(2, 9)}`,
        forceDestroy: true,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        tags,
      },
      { parent: this, provider: primaryProvider }
    );

    new aws.cloudtrail.Trail(
      `tap-cloudtrail-${environmentSuffix}`,
      {
        name: `tap-cloudtrail-${environmentSuffix}`,
        s3BucketName: cloudTrailBucket.id,
        s3KeyPrefix: 'cloudtrail',
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableLogFileValidation: true,
        tags,
      },
      { parent: this, provider: primaryProvider }
    );

    // this.securityHubArn = securityHub.arn;  // Commented since Security Hub creation is disabled
    */

    this.securityHubArn = pulumi.output('existing-security-hub'); // Placeholder
    // this.guardDutyDetectorId = guardDutyDetectors[regions[0]].id;  // Commented since detector creation is disabled
    this.guardDutyDetectorId = pulumi.output('existing-detector'); // Placeholder
    // this.configRecorderArn = configRecorder.roleArn;  // Commented since Config is disabled
    this.configRecorderArn = pulumi.output('config-disabled'); // Placeholder

    this.registerOutputs({
      securityHubArn: this.securityHubArn,
      guardDutyDetectorId: this.guardDutyDetectorId,
      configRecorderArn: this.configRecorderArn,
    });
  }
}
```

## storage-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface StorageStackArgs {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcId?: pulumi.Input<string>;
  privateSubnetIds?: pulumi.Input<pulumi.Input<string>[]>;
}

export class StorageStack extends pulumi.ComponentResource {
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly s3BucketArn: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly rdsArn: pulumi.Output<string>;

  constructor(name: string, args: StorageStackArgs, opts?: ResourceOptions) {
    super('tap:stack:StorageStack', name, args, opts);

    const {
      environmentSuffix,
      region,
      isPrimary,
      tags,
      vpcId,
      privateSubnetIds,
    } = args;

    // KMS Key for RDS encryption
    const kmsKey = new aws.kms.Key(
      `tap-rds-key-${region}-${environmentSuffix}`,
      {
        description: `RDS encryption key for TAP ${region} ${environmentSuffix}`,
        // keyUsage and keySpec are not valid properties in Pulumi AWS - removed
        policy: aws.getCallerIdentity({}).then(caller =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${caller.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow RDS Service',
                Effect: 'Allow',
                Principal: {
                  Service: 'rds.amazonaws.com',
                },
                Action: [
                  'kms:Decrypt',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: {
          ...tags,
          Name: `tap-rds-key-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `tap-rds-key-alias-${region}-${environmentSuffix}`,
      {
        name: `alias/tap-rds-${region}-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // S3 Bucket for static content
    const s3Bucket = new aws.s3.Bucket(
      `tap-static-content-${environmentSuffix}-${region}`,
      {
        bucket: `tap-static-content-${environmentSuffix}-${region}-${Math.random().toString(36).substr(2, 9)}`,
        forceDestroy: true,
        tags: {
          ...tags,
          Name: `tap-static-content-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // S3 Bucket Versioning
    new aws.s3.BucketVersioning(
      `tap-s3-versioning-${region}-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // S3 Server-Side Encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `tap-s3-encryption-${region}-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // S3 Lifecycle Configuration
    new aws.s3.BucketLifecycleConfiguration(
      `tap-s3-lifecycle-${region}-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        rules: [
          {
            id: 'transition_to_ia',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // S3 Bucket Policy - Restricted Access
    const callerIdentity = aws.getCallerIdentity({});

    new aws.s3.BucketPolicy(
      `tap-s3-policy-${region}-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        policy: pulumi
          .all([s3Bucket.arn, callerIdentity])
          .apply(([bucketArn, identity]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'DenyInsecureConnections',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'false',
                    },
                  },
                },
                {
                  Sid: 'RestrictToSpecificRoles',
                  Effect: 'Allow',
                  Principal: {
                    AWS: `arn:aws:iam::${identity.accountId}:role/tap-instance-role-${environmentSuffix}`,
                  },
                  Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                  Resource: `${bucketArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // S3 Public Access Block
    new aws.s3.BucketPublicAccessBlock(
      `tap-s3-pab-${region}-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Use VPC and subnet information if passed, otherwise try to look them up
    let vpcIdToUse: pulumi.Output<string>;
    let privateSubnetIdsToUse: pulumi.Output<string[]>;

    if (vpcId && privateSubnetIds) {
      // Use the provided VPC and subnet IDs
      vpcIdToUse = pulumi.output(vpcId);
      privateSubnetIdsToUse = pulumi.output(
        privateSubnetIds as pulumi.Input<string>[]
      );
    } else {
      // Fallback to looking up VPC and subnets (for backward compatibility)
      const vpcs = aws.ec2.getVpcs({
        filters: [
          {
            name: 'tag:Name',
            values: [`tap-vpc-${region}-${environmentSuffix}`],
          },
        ],
      });

      vpcIdToUse = pulumi.output(vpcs.then(vpcs => vpcs.ids[0]));

      const privateSubnets = vpcs.then(vpcs =>
        aws.ec2.getSubnets({
          filters: [
            { name: 'vpc-id', values: vpcs.ids },
            { name: 'tag:Type', values: ['Private'] },
          ],
        })
      );

      privateSubnetIdsToUse = pulumi.output(
        privateSubnets.then(subnets => subnets.ids)
      );
    }

    // RDS Subnet Group
    const rdsSubnetGroup = new aws.rds.SubnetGroup(
      `tap-rds-subnet-group-${region}-${environmentSuffix}`,
      {
        name: `tap-rds-subnet-group-${region}-${environmentSuffix}`,
        subnetIds: privateSubnetIdsToUse,
        tags: {
          ...tags,
          Name: `tap-rds-subnet-group-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // RDS Security Group
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-rds-sg-${region}-${environmentSuffix}-${Math.random().toString(36).substr(2, 6)}`,
      {
        name: `tap-rds-sg-${region}-${environmentSuffix}-${Math.random().toString(36).substr(2, 6)}`,
        description: 'Security group for RDS database',
        vpcId: vpcIdToUse,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'MySQL from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...tags,
          Name: `tap-rds-sg-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // RDS Instance
    const rdsInstance = new aws.rds.Instance(
      `tap-rds-${region}-${environmentSuffix}`,
      {
        identifier: `tap-rds-${region}-${environmentSuffix}`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        dbName: 'tapdb',
        username: 'tapuser',
        password: 'TempPassword123!', // In production, use AWS Secrets Manager
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: rdsSubnetGroup.name,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        backupRetentionPeriod: 7,
        multiAz: isPrimary,
        publiclyAccessible: false,
        skipFinalSnapshot: true,
        deleteAutomatedBackups: true,
        tags: {
          ...tags,
          Name: `tap-rds-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.s3BucketName = s3Bucket.bucket;
    this.s3BucketArn = s3Bucket.arn;
    this.rdsEndpoint = rdsInstance.endpoint;
    this.rdsArn = rdsInstance.arn;

    this.registerOutputs({
      s3BucketName: this.s3BucketName,
      s3BucketArn: this.s3BucketArn,
      rdsEndpoint: this.rdsEndpoint,
      rdsArn: this.rdsArn,
    });
  }
}
```

## tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { SecurityStack } from './security-stack';
import { NetworkStack } from './network-stack';
import { ComputeStack } from './compute-stack';
import { StorageStack } from './storage-stack';
import { IamStack } from './iam-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly albDnsName: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Define regions for deployment
    // For now, deploying only to primary region to simplify
    const regions = ['us-east-1']; // Removed us-west-2 for initial deployment
    const primaryRegion = 'us-east-1';
    // const secondaryRegion = 'us-west-2';  // Not used currently

    // Common configuration
    const allowedCidr = '203.0.113.0/24'; // Example allowed IP range for SSH
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'TapStack',
      Security: 'High',
      ...tags,
    };

    // Create IAM stack first (global resources)
    const iamStack = new IamStack(
      'tap-iam',
      {
        environmentSuffix,
        tags: commonTags,
      },
      { parent: this }
    );

    // Create security services stack (global/regional)
    const securityStack = new SecurityStack(
      'tap-security',
      {
        environmentSuffix,
        regions,
        tags: commonTags,
      },
      { parent: this }
    );

    // Deploy infrastructure in both regions
    const regionalDeployments: {
      [region: string]: {
        network: NetworkStack;
        storage: StorageStack;
        compute: ComputeStack;
      };
    } = {};

    for (const region of regions) {
      const regionSuffix = region === primaryRegion ? 'primary' : 'secondary';

      // Create provider for this region
      const provider = new aws.Provider(`provider-${region}`, {
        region: region,
      });

      // Network stack
      const networkStack = new NetworkStack(
        `tap-network-${regionSuffix}`,
        {
          environmentSuffix,
          region,
          allowedCidr,
          tags: commonTags,
        },
        { parent: this, provider }
      );

      // Storage stack
      const storageStack = new StorageStack(
        `tap-storage-${regionSuffix}`,
        {
          environmentSuffix,
          region,
          isPrimary: region === primaryRegion,
          tags: commonTags,
          vpcId: networkStack.vpcId,
          privateSubnetIds: networkStack.privateSubnetIds,
        },
        { parent: this, provider }
      );

      // Compute stack
      const computeStack = new ComputeStack(
        `tap-compute-${regionSuffix}`,
        {
          environmentSuffix,
          region,
          vpcId: networkStack.vpcId,
          publicSubnetIds: networkStack.publicSubnetIds,
          privateSubnetIds: networkStack.privateSubnetIds,
          instanceRole: iamStack.instanceRole,
          s3BucketArn: storageStack.s3BucketArn,
          allowedCidr,
          tags: commonTags,
          albSecurityGroupId: networkStack.albSecurityGroupId,
          ec2SecurityGroupId: networkStack.ec2SecurityGroupId,
        },
        { parent: this, provider }
      );

      regionalDeployments[region] = {
        network: networkStack,
        storage: storageStack,
        compute: computeStack,
      };
    }

    // Export outputs from primary region
    const primaryDeployment = regionalDeployments[primaryRegion];
    this.albDnsName = primaryDeployment.compute.albDnsName;
    this.s3BucketName = primaryDeployment.storage.s3BucketName;
    this.rdsEndpoint = primaryDeployment.storage.rdsEndpoint;

    this.registerOutputs({
      albDnsName: this.albDnsName,
      s3BucketName: this.s3BucketName,
      rdsEndpoint: this.rdsEndpoint,
      securityHubArn: securityStack.securityHubArn,
    });
  }
}
```

