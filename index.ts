import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const region = aws.config.region || 'us-east-1';

// Define availability zones
const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

// Common tags
const commonTags = {
  Environment: 'production',
  Project: 'payment-platform',
  CostCenter: 'engineering',
};

// Create VPC
const vpc = new aws.ec2.Vpc(`payment-vpc-${environmentSuffix}`, {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    ...commonTags,
    Name: `payment-vpc-${environmentSuffix}`,
  },
});

// Create Internet Gateway
const internetGateway = new aws.ec2.InternetGateway(
  `payment-igw-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: `payment-igw-${environmentSuffix}`,
    },
  }
);

// Create Public Subnets
const publicSubnets = availabilityZones.map((az, index) => {
  return new aws.ec2.Subnet(`public-subnet-${az}-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${index + 1}.0/24`,
    availabilityZone: az,
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: `public-subnet-${az}-${environmentSuffix}`,
      Tier: 'public',
    },
  });
});

// Create Private Subnets
const privateSubnets = availabilityZones.map((az, index) => {
  return new aws.ec2.Subnet(`private-subnet-${az}-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${10 + index * 2}.0/23`,
    availabilityZone: az,
    tags: {
      ...commonTags,
      Name: `private-subnet-${az}-${environmentSuffix}`,
      Tier: 'private',
    },
  });
});

// Create Database Subnets
const databaseSubnets = availabilityZones.map((az, index) => {
  return new aws.ec2.Subnet(`database-subnet-${az}-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: `10.0.${20 + index}.0/24`,
    availabilityZone: az,
    tags: {
      ...commonTags,
      Name: `database-subnet-${az}-${environmentSuffix}`,
      Tier: 'database',
    },
  });
});

// Get latest Ubuntu 20.04 AMI
const ubuntuAmi = aws.ec2.getAmi({
  mostRecent: true,
  filters: [
    {
      name: 'name',
      values: ['ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*'],
    },
    {
      name: 'virtualization-type',
      values: ['hvm'],
    },
  ],
  owners: ['099720109477'], // Canonical
});

// Create Security Group for NAT Instances
const natSecurityGroup = new aws.ec2.SecurityGroup(
  `nat-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for NAT instances',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ['10.0.0.0/16'],
      },
      {
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['10.0.0.0/16'],
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
      ...commonTags,
      Name: `nat-sg-${environmentSuffix}`,
    },
  }
);

// Create NAT Instances
const natInstances = publicSubnets.map((subnet, index) => {
  return new aws.ec2.Instance(
    `nat-instance-${availabilityZones[index]}-${environmentSuffix}`,
    {
      ami: ubuntuAmi.then(ami => ami.id),
      instanceType: 't3.micro',
      subnetId: subnet.id,
      vpcSecurityGroupIds: [natSecurityGroup.id],
      sourceDestCheck: false,
      userData: `#!/bin/bash
echo 1 > /proc/sys/net/ipv4/ip_forward
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables-save > /etc/iptables.rules
echo "iptables-restore < /etc/iptables.rules" >> /etc/rc.local
`,
      tags: {
        ...commonTags,
        Name: `nat-instance-${availabilityZones[index]}-${environmentSuffix}`,
      },
    }
  );
});

// Create Public Route Table
const publicRouteTable = new aws.ec2.RouteTable(
  `production-public-main-rt-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: `production-public-main-rt-${environmentSuffix}`,
    },
  }
);

// Add route to Internet Gateway
void new aws.ec2.Route(`public-route-${environmentSuffix}`, {
  routeTableId: publicRouteTable.id,
  destinationCidrBlock: '0.0.0.0/0',
  gatewayId: internetGateway.id,
});

// Associate Public Subnets with Public Route Table
publicSubnets.forEach((subnet, _index) => {
  new aws.ec2.RouteTableAssociation(
    `public-rta-${availabilityZones[_index]}-${environmentSuffix}`,
    {
      subnetId: subnet.id,
      routeTableId: publicRouteTable.id,
    }
  );
});

// Create Private Route Tables (one per AZ)
const privateRouteTables = availabilityZones.map((az, index) => {
  const routeTable = new aws.ec2.RouteTable(
    `production-private-${az}-rt-${environmentSuffix}`,
    {
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: `production-private-${az}-rt-${environmentSuffix}`,
      },
    }
  );

  // Add route to NAT instance
  new aws.ec2.Route(`private-route-${az}-${environmentSuffix}`, {
    routeTableId: routeTable.id,
    destinationCidrBlock: '0.0.0.0/0',
    networkInterfaceId: natInstances[index].primaryNetworkInterfaceId,
  });

  return routeTable;
});

// Associate Private Subnets with Private Route Tables
privateSubnets.forEach((subnet, index) => {
  new aws.ec2.RouteTableAssociation(
    `private-rta-${availabilityZones[index]}-${environmentSuffix}`,
    {
      subnetId: subnet.id,
      routeTableId: privateRouteTables[index].id,
    }
  );
});

// Create Database Route Tables (one per AZ, no internet access)
const databaseRouteTables = availabilityZones.map(az => {
  const routeTable = new aws.ec2.RouteTable(
    `production-database-${az}-rt-${environmentSuffix}`,
    {
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: `production-database-${az}-rt-${environmentSuffix}`,
      },
    }
  );

  return routeTable;
});

// Associate Database Subnets with Database Route Tables
databaseSubnets.forEach((subnet, index) => {
  new aws.ec2.RouteTableAssociation(
    `database-rta-${availabilityZones[index]}-${environmentSuffix}`,
    {
      subnetId: subnet.id,
      routeTableId: databaseRouteTables[index].id,
    }
  );
});

// Create Security Group for Web Tier
const webSecurityGroup = new aws.ec2.SecurityGroup(
  `web-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description:
      'Security group for web tier - allows HTTP/HTTPS from internet',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTP from internet',
      },
      {
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTPS from internet',
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
      ...commonTags,
      Name: `web-sg-${environmentSuffix}`,
    },
  }
);

// Create Security Group for App Tier
const appSecurityGroup = new aws.ec2.SecurityGroup(
  `app-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description:
      'Security group for app tier - allows port 8080 from web tier only',
    tags: {
      ...commonTags,
      Name: `app-sg-${environmentSuffix}`,
    },
  }
);

// Add ingress rule for app tier (must reference web SG after creation)
void new aws.ec2.SecurityGroupRule(`app-ingress-${environmentSuffix}`, {
  type: 'ingress',
  securityGroupId: appSecurityGroup.id,
  protocol: 'tcp',
  fromPort: 8080,
  toPort: 8080,
  sourceSecurityGroupId: webSecurityGroup.id,
  description: 'Allow port 8080 from web tier',
});

// Add egress rule for app tier
void new aws.ec2.SecurityGroupRule(`app-egress-${environmentSuffix}`, {
  type: 'egress',
  securityGroupId: appSecurityGroup.id,
  protocol: '-1',
  fromPort: 0,
  toPort: 0,
  cidrBlocks: ['0.0.0.0/0'],
});

// Create Security Group for Database Tier
const databaseSecurityGroup = new aws.ec2.SecurityGroup(
  `database-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description:
      'Security group for database tier - allows port 5432 from app tier only',
    tags: {
      ...commonTags,
      Name: `database-sg-${environmentSuffix}`,
    },
  }
);

// Add ingress rule for database tier
void new aws.ec2.SecurityGroupRule(`database-ingress-${environmentSuffix}`, {
  type: 'ingress',
  securityGroupId: databaseSecurityGroup.id,
  protocol: 'tcp',
  fromPort: 5432,
  toPort: 5432,
  sourceSecurityGroupId: appSecurityGroup.id,
  description: 'Allow port 5432 from app tier',
});

// Add egress rule for database tier
void new aws.ec2.SecurityGroupRule(`database-egress-${environmentSuffix}`, {
  type: 'egress',
  securityGroupId: databaseSecurityGroup.id,
  protocol: '-1',
  fromPort: 0,
  toPort: 0,
  cidrBlocks: ['0.0.0.0/0'],
});

// Create Network ACL for Public Subnets
const publicNetworkAcl = new aws.ec2.NetworkAcl(
  `public-nacl-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: `public-nacl-${environmentSuffix}`,
    },
  }
);

// Public NACL Rules - Inbound
new aws.ec2.NetworkAclRule(`public-nacl-ingress-http-${environmentSuffix}`, {
  networkAclId: publicNetworkAcl.id,
  ruleNumber: 100,
  protocol: 'tcp',
  ruleAction: 'allow',
  cidrBlock: '0.0.0.0/0',
  fromPort: 80,
  toPort: 80,
  egress: false,
});

new aws.ec2.NetworkAclRule(`public-nacl-ingress-https-${environmentSuffix}`, {
  networkAclId: publicNetworkAcl.id,
  ruleNumber: 110,
  protocol: 'tcp',
  ruleAction: 'allow',
  cidrBlock: '0.0.0.0/0',
  fromPort: 443,
  toPort: 443,
  egress: false,
});

new aws.ec2.NetworkAclRule(
  `public-nacl-ingress-ephemeral-${environmentSuffix}`,
  {
    networkAclId: publicNetworkAcl.id,
    ruleNumber: 120,
    protocol: 'tcp',
    ruleAction: 'allow',
    cidrBlock: '0.0.0.0/0',
    fromPort: 32768,
    toPort: 65535,
    egress: false,
  }
);

// Public NACL Rules - Outbound
new aws.ec2.NetworkAclRule(`public-nacl-egress-http-${environmentSuffix}`, {
  networkAclId: publicNetworkAcl.id,
  ruleNumber: 100,
  protocol: 'tcp',
  ruleAction: 'allow',
  cidrBlock: '0.0.0.0/0',
  fromPort: 80,
  toPort: 80,
  egress: true,
});

new aws.ec2.NetworkAclRule(`public-nacl-egress-https-${environmentSuffix}`, {
  networkAclId: publicNetworkAcl.id,
  ruleNumber: 110,
  protocol: 'tcp',
  ruleAction: 'allow',
  cidrBlock: '0.0.0.0/0',
  fromPort: 443,
  toPort: 443,
  egress: true,
});

new aws.ec2.NetworkAclRule(
  `public-nacl-egress-ephemeral-${environmentSuffix}`,
  {
    networkAclId: publicNetworkAcl.id,
    ruleNumber: 120,
    protocol: 'tcp',
    ruleAction: 'allow',
    cidrBlock: '0.0.0.0/0',
    fromPort: 32768,
    toPort: 65535,
    egress: true,
  }
);

// Associate Public Subnets with Public NACL
publicSubnets.forEach((subnet, index) => {
  new aws.ec2.NetworkAclAssociation(
    `public-nacl-assoc-${availabilityZones[index]}-${environmentSuffix}`,
    {
      networkAclId: publicNetworkAcl.id,
      subnetId: subnet.id,
    }
  );
});

// Create S3 Bucket for VPC Flow Logs
const flowLogsBucket = new aws.s3.Bucket(`vpc-flow-logs-${environmentSuffix}`, {
  bucket: `vpc-flow-logs-${environmentSuffix}`,
  acl: 'private',
  serverSideEncryptionConfiguration: {
    rule: {
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'AES256',
      },
    },
  },
  lifecycleRules: [
    {
      enabled: true,
      expiration: {
        days: 7,
      },
    },
  ],
  tags: {
    ...commonTags,
    Name: `vpc-flow-logs-${environmentSuffix}`,
  },
});

// Block public access to S3 bucket
new aws.s3.BucketPublicAccessBlock(
  `flow-logs-bucket-public-access-block-${environmentSuffix}`,
  {
    bucket: flowLogsBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }
);

// Create IAM role for VPC Flow Logs
const flowLogsRole = new aws.iam.Role(
  `vpc-flow-logs-role-${environmentSuffix}`,
  {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'vpc-flow-logs.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    tags: {
      ...commonTags,
      Name: `vpc-flow-logs-role-${environmentSuffix}`,
    },
  }
);

// Create CloudWatch Log Group
const flowLogsLogGroup = new aws.cloudwatch.LogGroup(
  `vpc-flow-logs-${environmentSuffix}`,
  {
    name: `/aws/vpc/flow-logs-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      ...commonTags,
      Name: `vpc-flow-logs-${environmentSuffix}`,
    },
  }
);

// IAM Policy for Flow Logs to CloudWatch
const flowLogsPolicy = new aws.iam.RolePolicy(
  `vpc-flow-logs-policy-${environmentSuffix}`,
  {
    role: flowLogsRole.id,
    policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                "Resource": "${flowLogsLogGroup.arn}:*"
            }
        ]
    }`,
  }
);

// S3 Bucket Policy for VPC Flow Logs
void new aws.s3.BucketPolicy(`flow-logs-bucket-policy-${environmentSuffix}`, {
  bucket: flowLogsBucket.id,
  policy: pulumi.all([flowLogsBucket.arn]).apply(([bucketArn]) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AWSLogDeliveryWrite',
          Effect: 'Allow',
          Principal: {
            Service: 'delivery.logs.amazonaws.com',
          },
          Action: 's3:PutObject',
          Resource: `${bucketArn}/*`,
          Condition: {
            StringEquals: {
              's3:x-amz-acl': 'bucket-owner-full-control',
            },
          },
        },
        {
          Sid: 'AWSLogDeliveryAclCheck',
          Effect: 'Allow',
          Principal: {
            Service: 'delivery.logs.amazonaws.com',
          },
          Action: 's3:GetBucketAcl',
          Resource: bucketArn,
        },
      ],
    })
  ),
});

// Create VPC Flow Logs to S3
void new aws.ec2.FlowLog(`vpc-flow-log-s3-${environmentSuffix}`, {
  vpcId: vpc.id,
  trafficType: 'ALL',
  logDestinationType: 's3',
  logDestination: flowLogsBucket.arn,
  tags: {
    ...commonTags,
    Name: `vpc-flow-log-s3-${environmentSuffix}`,
  },
});

// Create VPC Flow Logs to CloudWatch
void new aws.ec2.FlowLog(
  `vpc-flow-log-cloudwatch-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    trafficType: 'ALL',
    logDestinationType: 'cloud-watch-logs',
    logDestination: flowLogsLogGroup.arn,
    iamRoleArn: flowLogsRole.arn,
    tags: {
      ...commonTags,
      Name: `vpc-flow-log-cloudwatch-${environmentSuffix}`,
    },
  },
  { dependsOn: [flowLogsPolicy] }
);

// Create S3 VPC Endpoint
const s3Endpoint = new aws.ec2.VpcEndpoint(`s3-endpoint-${environmentSuffix}`, {
  vpcId: vpc.id,
  serviceName: `com.amazonaws.${region}.s3`,
  vpcEndpointType: 'Gateway',
  routeTableIds: privateRouteTables.map(rt => rt.id),
  tags: {
    ...commonTags,
    Name: `s3-endpoint-${environmentSuffix}`,
  },
});

// Exports
export const vpcId = vpc.id;
export const vpcCidr = vpc.cidrBlock;
export const internetGatewayId = internetGateway.id;

export const publicSubnetIds = publicSubnets.map(subnet => subnet.id);
export const privateSubnetIds = privateSubnets.map(subnet => subnet.id);
export const databaseSubnetIds = databaseSubnets.map(subnet => subnet.id);

export const natInstanceIds = natInstances.map(instance => instance.id);
export const natInstancePrivateIps = natInstances.map(
  instance => instance.privateIp
);

export const webSecurityGroupId = webSecurityGroup.id;
export const appSecurityGroupId = appSecurityGroup.id;
export const databaseSecurityGroupId = databaseSecurityGroup.id;

export const flowLogsBucketName = flowLogsBucket.id;
export const flowLogsLogGroupName = flowLogsLogGroup.name;
export const s3EndpointId = s3Endpoint.id;
