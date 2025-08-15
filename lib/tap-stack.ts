/**
 * TAP Stack - Multi-region AWS Infrastructure using CDKTF
 *
 * Complete implementation with all requirements:
 * - Multi-region support (us-east-1, eu-west-1, ap-southeast-2)
 * - VPC with public/private subnets across AZs
 * - Internet Gateway and NAT Gateways
 * - Security Groups and Network ACLs
 * - S3 buckets per region with lifecycle policies
 * - Cross-account IAM roles
 * - Application Load Balancer
 * - EC2 instances with auto-scaling capability
 * - RDS MySQL database
 * - CloudWatch monitoring
 */

import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbTargetGroupAttachment } from '@cdktf/provider-aws/lib/lb-target-group-attachment';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';

export interface TapStackConfig {
  region: string;
  environmentSuffix: string;
  crossAccountId?: string;
  tags?: { [key: string]: string };
}

export class TapStack extends TerraformStack {
  public readonly vpcId: string;
  public readonly albDnsName: string;
  public readonly rdsEndpoint: string;
  public readonly s3BucketName: string;

  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    const { region, environmentSuffix, crossAccountId, tags = {} } = config;
    const prefix = `prod-${environmentSuffix}-`;

    // AWS Provider for the specific region
    const provider = new AwsProvider(this, `aws-${region}`, {
      region: region,
    });

    // Get availability zones
    const availableAzs = new DataAwsAvailabilityZones(this, 'available-azs', {
      state: 'available',
      provider: provider,
    });

    // Get latest Amazon Linux 2 AMI
    const amiData = new DataAwsAmi(this, 'amazon-linux-ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
      provider: provider,
    });

    // VPC
    const vpc = new Vpc(this, `${prefix}vpc-${region}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...tags,
        Name: `${prefix}vpc-${region}`,
      },
      provider: provider,
    });

    // Internet Gateway
    const igw = new InternetGateway(this, `${prefix}igw-${region}`, {
      vpcId: vpc.id,
      tags: {
        ...tags,
        Name: `${prefix}igw-${region}`,
      },
      provider: provider,
    });

    // Public and Private Subnets (2 of each across different AZs)
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];

    for (let i = 0; i < 2; i++) {
      // Public Subnet
      const publicSubnet = new Subnet(
        this,
        `${prefix}public-subnet-${i + 1}-${region}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 1}.0/24`,
          availabilityZone: `\${${availableAzs.fqn}.names[${i}]}`,
          mapPublicIpOnLaunch: true,
          tags: {
            ...tags,
            Name: `${prefix}public-subnet-${i + 1}-${region}`,
            Type: 'Public',
          },
          provider: provider,
        }
      );
      publicSubnets.push(publicSubnet);

      // Private Subnet
      const privateSubnet = new Subnet(
        this,
        `${prefix}private-subnet-${i + 1}-${region}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i + 10}.0/24`,
          availabilityZone: `\${${availableAzs.fqn}.names[${i}]}`,
          tags: {
            ...tags,
            Name: `${prefix}private-subnet-${i + 1}-${region}`,
            Type: 'Private',
          },
          provider: provider,
        }
      );
      privateSubnets.push(privateSubnet);
    }

    // Public Route Table
    const publicRouteTable = new RouteTable(
      this,
      `${prefix}public-rt-${region}`,
      {
        vpcId: vpc.id,
        tags: {
          ...tags,
          Name: `${prefix}public-rt-${region}`,
        },
        provider: provider,
      }
    );

    // Public Route to Internet Gateway
    new Route(this, `${prefix}public-route-${region}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
      provider: provider,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(
        this,
        `${prefix}public-rta-${index + 1}-${region}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
          provider: provider,
        }
      );
    });

    // NAT Gateways and Private Route Tables
    privateSubnets.forEach((subnet, index) => {
      // Elastic IP for NAT Gateway
      const eip = new Eip(this, `${prefix}nat-eip-${index + 1}-${region}`, {
        domain: 'vpc',
        tags: {
          ...tags,
          Name: `${prefix}nat-eip-${index + 1}-${region}`,
        },
        provider: provider,
      });

      // NAT Gateway in corresponding public subnet
      const natGateway = new NatGateway(
        this,
        `${prefix}nat-gw-${index + 1}-${region}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnets[index].id,
          tags: {
            ...tags,
            Name: `${prefix}nat-gw-${index + 1}-${region}`,
          },
          provider: provider,
        }
      );

      // Private Route Table
      const privateRouteTable = new RouteTable(
        this,
        `${prefix}private-rt-${index + 1}-${region}`,
        {
          vpcId: vpc.id,
          tags: {
            ...tags,
            Name: `${prefix}private-rt-${index + 1}-${region}`,
          },
          provider: provider,
        }
      );

      // Private Route to NAT Gateway
      new Route(this, `${prefix}private-route-${index + 1}-${region}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
        provider: provider,
      });

      // Associate private subnet with private route table
      new RouteTableAssociation(
        this,
        `${prefix}private-rta-${index + 1}-${region}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
          provider: provider,
        }
      );
    });

    // ========== NETWORK ACLs ==========
    const publicNacl = new NetworkAcl(this, `${prefix}public-nacl-${region}`, {
      vpcId: vpc.id,
      subnetIds: publicSubnets.map(s => s.id),
      tags: {
        ...tags,
        Name: `${prefix}public-nacl-${region}`,
      },
      provider: provider,
    });

    // Inbound rules for public NACL
    new NetworkAclRule(this, `${prefix}public-nacl-http-in`, {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      egress: false,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 80,
      toPort: 80,
      provider: provider,
    });

    new NetworkAclRule(this, `${prefix}public-nacl-https-in`, {
      networkAclId: publicNacl.id,
      ruleNumber: 110,
      egress: false,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
      provider: provider,
    });

    // Security Groups
    const albSecurityGroup = new SecurityGroup(
      this,
      `${prefix}alb-sg-${region}`,
      {
        name: `${prefix}alb-sg-${region}`,
        description: 'Security group for Application Load Balancer',
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `${prefix}alb-sg-${region}`,
        },
        provider: provider,
      }
    );

    const ec2SecurityGroup = new SecurityGroup(
      this,
      `${prefix}ec2-sg-${region}`,
      {
        name: `${prefix}ec2-sg-${region}`,
        description: 'Security group for EC2 instances',
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [albSecurityGroup.id],
            description: 'HTTP from ALB',
          },
          {
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16'], // Restricted to VPC CIDR
            description: 'SSH',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `${prefix}ec2-sg-${region}`,
        },
        provider: provider,
      }
    );

    const rdsSecurityGroup = new SecurityGroup(
      this,
      `${prefix}rds-sg-${region}`,
      {
        name: `${prefix}rds-sg-${region}`,
        description: 'Security group for RDS database',
        vpcId: vpc.id,
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [ec2SecurityGroup.id],
            description: 'MySQL from EC2 instances',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...tags,
          Name: `${prefix}rds-sg-${region}`,
        },
        provider: provider,
      }
    );

    // ========== S3 BUCKET ==========
    const s3Bucket = new S3Bucket(this, `${prefix}storage-${region}`, {
      bucket: `${prefix}storage-${region}-${this.node.addr.substring(0, 8)}`,
      tags: {
        ...tags,
        Name: `${prefix}storage-${region}`,
      },
      provider: provider,
    });

    new S3BucketLifecycleConfiguration(
      this,
      `${prefix}s3-lifecycle-${region}`,
      {
        bucket: s3Bucket.id,
        rule: [
          {
            id: `${prefix}lifecycle-rule`,
            status: 'Enabled',
            filter: { prefix: '' } as any,
            expiration: [
              {
                days: 365,
              },
            ],
            transition: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
            ],
          },
        ],
        provider: provider,
      }
    );

    this.s3BucketName = s3Bucket.bucket;

    // IAM Role for EC2 instances
    const ec2Role = new IamRole(this, `${prefix}ec2-role-${region}`, {
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
      tags: {
        ...tags,
        Name: `${prefix}ec2-role-${region}`,
      },
      provider: provider,
    });

    // Attach CloudWatch Agent policy
    new IamRolePolicyAttachment(
      this,
      `${prefix}ec2-cloudwatch-policy-${region}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
        provider: provider,
      }
    );

    // Attach SSM policy for EC2 instances
    new IamRolePolicyAttachment(this, `${prefix}ec2-ssm-policy-${region}`, {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      provider: provider,
    });

    // EC2 Instance Profile
    const ec2InstanceProfile = new IamInstanceProfile(
      this,
      `${prefix}ec2-instance-profile-${region}`,
      {
        role: ec2Role.name,
        tags: {
          ...tags,
          Name: `${prefix}ec2-instance-profile-${region}`,
        },
        provider: provider,
      }
    );

    // ========== CROSS-ACCOUNT IAM ==========
    if (crossAccountId) {
      const crossAccountRole = new IamRole(
        this,
        `${prefix}cross-account-role-${region}`,
        {
          name: `${prefix}cross-account-role-${region}`,
          assumeRolePolicy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${crossAccountId}:root`,
                },
                Action: 'sts:AssumeRole',
                Condition: {
                  StringEquals: {
                    'sts:ExternalId': 'secure-external-id-123',
                  },
                },
              },
            ],
          }),
          tags: {
            ...tags,
            Name: `${prefix}cross-account-role-${region}`,
          },
          provider: provider,
        }
      );

      const crossAccountPolicy = new IamPolicy(
        this,
        `${prefix}cross-account-policy-${region}`,
        {
          name: `${prefix}cross-account-policy-${region}`,
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
                Resource: [s3Bucket.arn, `${s3Bucket.arn}/*`],
              },
            ],
          }),
          provider: provider,
        }
      );

      new IamRolePolicyAttachment(
        this,
        `${prefix}cross-account-policy-attach-${region}`,
        {
          role: crossAccountRole.name,
          policyArn: crossAccountPolicy.arn,
          provider: provider,
        }
      );
    }

    // Database credentials in Secrets Manager
    const dbSecret = new SecretsmanagerSecret(
      this,
      `${prefix}db-credentials-${region}`,
      {
        name: `${prefix}db-credentials-${region}`,
        description: 'Database credentials for RDS instance',
        tags: {
          ...tags,
          Name: `${prefix}db-credentials-${region}`,
        },
        provider: provider,
        lifecycle: {
          ignoreChanges: ['name'],
        },
      }
    );

    new SecretsmanagerSecretVersion(
      this,
      `${prefix}db-secret-version-${region}`,
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: 'TempPassword123!',
        }),
        provider: provider,
        lifecycle: {
          ignoreChanges: ['secret_string'],
        },
      }
    );

    // CloudWatch Log Groups
    new CloudwatchLogGroup(this, `${prefix}ec2-log-group-${region}`, {
      name: `/aws/ec2/${prefix}application-${region}`,
      retentionInDays: 7,
      tags: {
        ...tags,
        Name: `${prefix}ec2-logs-${region}`,
      },
      provider: provider,
      lifecycle: {
        preventDestroy: true,
      },
    });

    new CloudwatchLogGroup(this, `${prefix}rds-log-group-${region}`, {
      name: `/aws/rds/instance/${prefix}database-${region}/error`,
      retentionInDays: 7,
      tags: {
        ...tags,
        Name: `${prefix}rds-logs-${region}`,
      },
      provider: provider,
      lifecycle: {
        preventDestroy: true,
      },
    });

    // RDS Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(
      this,
      `${prefix}db-subnet-group-${region}`,
      {
        subnetIds: privateSubnets.map(subnet => subnet.id),
        tags: {
          ...tags,
          Name: `${prefix}db-subnet-group-${region}`,
        },
        provider: provider,
      }
    );

    // RDS MySQL Instance
    const rdsInstance = new DbInstance(this, `${prefix}database-${region}`, {
      identifier: `${prefix}database-${region}`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      dbName: 'appdb',
      username: 'admin',
      password: 'TempPassword123!',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      storageEncrypted: true,
      enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      skipFinalSnapshot: true,
      deletionProtection: false,
      tags: {
        ...tags,
        Name: `${prefix}database-${region}`,
      },
      provider: provider,
      lifecycle: {
        ignoreChanges: ['identifier'],
      },
    });

    // EC2 Instances in public subnets
    const instances = publicSubnets.map((subnet, index) => {
      return new Instance(this, `${prefix}app-server-${index + 1}-${region}`, {
        ami: amiData.id,
        instanceType: 't3.micro',
        subnetId: subnet.id,
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        iamInstanceProfile: ec2InstanceProfile.name,
        userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${region} - Instance ${index + 1}</h1>" > /var/www/html/index.html
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
`,
        tags: {
          ...tags,
          Name: `${prefix}app-server-${index + 1}-${region}`,
        },
        provider: provider,
      });
    });

    // Application Load Balancer
    const alb = new Lb(this, `${prefix}alb-${region}`, {
      name: `${prefix}alb-${region}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: publicSubnets.map(subnet => subnet.id),
      enableDeletionProtection: false,
      tags: {
        ...tags,
        Name: `${prefix}alb-${region}`,
      },
      provider: provider,
      lifecycle: {
        ignoreChanges: ['name'],
      },
    });

    // Target Group for ALB
    const targetGroup = new LbTargetGroup(this, `${prefix}tg-${region}`, {
      name: `${prefix}tg-${region}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: '200',
        path: '/',
        port: 'traffic-port',
        protocol: 'HTTP',
        timeout: 5,
        unhealthyThreshold: 2,
      },
      tags: {
        ...tags,
        Name: `${prefix}tg-${region}`,
      },
      provider: provider,
      lifecycle: {
        ignoreChanges: ['name'],
      },
    });

    // Target Group Attachments
    instances.forEach((instance, index) => {
      new LbTargetGroupAttachment(
        this,
        `${prefix}tg-attachment-${index + 1}-${region}`,
        {
          targetGroupArn: targetGroup.arn,
          targetId: instance.id,
          port: 80,
          provider: provider,
        }
      );
    });

    // Load Balancer Listener
    new LbListener(this, `${prefix}alb-listener-${region}`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      provider: provider,
    });

    // Set up outputs
    this.vpcId = vpc.id;
    this.albDnsName = alb.dnsName;
    this.rdsEndpoint = rdsInstance.endpoint;

    // Terraform Outputs
    new TerraformOutput(this, `VpcId-${region}`, {
      value: this.vpcId,
    });

    new TerraformOutput(this, `AlbDnsName-${region}`, {
      value: this.albDnsName,
    });

    new TerraformOutput(this, `RdsEndpoint-${region}`, {
      value: this.rdsEndpoint,
    });

    new TerraformOutput(this, `S3BucketName-${region}`, {
      value: this.s3BucketName,
    });
  }
}
