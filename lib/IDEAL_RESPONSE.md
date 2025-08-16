A secure and efficient AWS cloud environment using Pulumi with TypeScript. Here's the production-ready implementation:

## Project Structure

```
├── lib/
│   ├── infrastructure.ts
│   ├── vpc.ts
│   ├── security.ts
│   ├── compute.ts
│── └── security-monitoring.ts
```

**lib/infrastructure.ts**
```typescript
/**
 * infrastructure.ts
 *
 * This module orchestrates the creation of all AWS infrastructure components
 * including VPC, security groups, EC2 instances, and security monitoring.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { createEc2Instance } from './compute';
import { createSecurityGroup } from './security';
import { createSecurityMonitoring } from './security-monitoring';
import { createVpcResources } from './vpc';

export interface InfrastructureOutputs {
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
  internetGatewayId: pulumi.Output<string>;
  securityGroupId: pulumi.Output<string>;
  ec2InstanceId: pulumi.Output<string>;
  ec2InstancePublicIp: pulumi.Output<string>;
  ec2InstancePublicDns: pulumi.Output<string>;
  cloudTrailArn: pulumi.Output<string>;
  guardDutyDetectorId: pulumi.Output<string>;
}

export function createInfrastructure(
  environment: string,
  allowedSshCidrs: string[],
  instanceType: string = 't3.micro',
  region: string = 'ap-south-1'
): InfrastructureOutputs {
  // AWS Provider with explicit region configuration
  const provider = new aws.Provider(`aws-provider-${environment}`, {
    region: region,
  });

  // Create VPC and networking resources
  const vpcResources = createVpcResources(environment, provider);

  // Create security group
  const securityGroup = createSecurityGroup(
    environment,
    vpcResources.vpc.id,
    allowedSshCidrs,
    provider
  );

  // Create EC2 instance
  const ec2Instance = createEc2Instance(
    environment,
    vpcResources.publicSubnets[0].id,
    securityGroup.id,
    instanceType,
    provider
  );

  // Create security monitoring resources
  const securityMonitoring = createSecurityMonitoring(environment, provider);

  return {
    vpcId: vpcResources.vpc.id,
    publicSubnetIds: vpcResources.publicSubnets.map(subnet => subnet.id),
    privateSubnetIds: vpcResources.privateSubnets.map(subnet => subnet.id),
    internetGatewayId: vpcResources.internetGateway.id,
    securityGroupId: securityGroup.id,
    ec2InstanceId: ec2Instance.id,
    ec2InstancePublicIp: ec2Instance.publicIp,
    ec2InstancePublicDns: ec2Instance.publicDns,
    cloudTrailArn: securityMonitoring.cloudTrail.arn,
    guardDutyDetectorId: securityMonitoring.guardDutyDetectorId,
  };
}
```

**lib/vpc.ts**
```typescript
/**
 * vpc.ts
 *
 * This module defines VPC-related resources including VPC, subnets, internet gateway,
 * and route tables for the secure AWS infrastructure.
 */
import * as aws from '@pulumi/aws';

export interface VpcResources {
  vpc: aws.ec2.Vpc;
  publicSubnets: aws.ec2.Subnet[];
  privateSubnets: aws.ec2.Subnet[];
  internetGateway: aws.ec2.InternetGateway;
  publicRouteTable: aws.ec2.RouteTable;
  privateRouteTables: aws.ec2.RouteTable[];
  natGateway: aws.ec2.NatGateway;
  vpcFlowLog: aws.ec2.FlowLog;
}

export function createVpcResources(
  environment: string,
  provider: aws.Provider
): VpcResources {
  // Get availability zones
  const availabilityZones = aws.getAvailabilityZones(
    {
      state: 'available',
    },
    { provider }
  );

  // Create VPC
  const vpc = new aws.ec2.Vpc(
    `vpc-${environment}`,
    {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create Internet Gateway
  const internetGateway = new aws.ec2.InternetGateway(
    `igw-${environment}`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `igw-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create public subnets
  const publicSubnets: aws.ec2.Subnet[] = [];
  const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24'];

  publicSubnetCidrs.forEach((cidr, index) => {
    const subnet = new aws.ec2.Subnet(
      `public-subnet-${index + 1}-${environment}`,
      {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones.then(
          azs => azs.names[index % azs.names.length]
        ),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${index + 1}-${environment}`,
          Environment: environment,
          Type: 'Public',
          ManagedBy: 'Pulumi',
        },
      },
      { provider }
    );

    publicSubnets.push(subnet);
  });

  // Create private subnets for best practices (even though not required)
  const privateSubnets: aws.ec2.Subnet[] = [];
  const privateSubnetCidrs = ['10.0.10.0/24', '10.0.20.0/24'];

  privateSubnetCidrs.forEach((cidr, index) => {
    const subnet = new aws.ec2.Subnet(
      `private-subnet-${index + 1}-${environment}`,
      {
        vpcId: vpc.id,
        cidrBlock: cidr,
        availabilityZone: availabilityZones.then(
          azs => azs.names[index % azs.names.length]
        ),
        tags: {
          Name: `private-subnet-${index + 1}-${environment}`,
          Environment: environment,
          Type: 'Private',
          ManagedBy: 'Pulumi',
        },
      },
      { provider }
    );

    privateSubnets.push(subnet);
  });

  // Create public route table
  const publicRouteTable = new aws.ec2.RouteTable(
    `public-rt-${environment}`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `public-rt-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create route to Internet Gateway
  new aws.ec2.Route(
    `public-route-${environment}`,
    {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    },
    { provider }
  );

  // Associate public subnets with public route table
  publicSubnets.forEach((subnet, index) => {
    new aws.ec2.RouteTableAssociation(
      `public-rta-${index + 1}-${environment}`,
      {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      },
      { provider }
    );
  });

  // Create Elastic IP for NAT Gateway
  const natEip = new aws.ec2.Eip(
    `nat-eip-${environment}`,
    {
      domain: 'vpc',
      tags: {
        Name: `nat-eip-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create NAT Gateway in first public subnet
  const natGateway = new aws.ec2.NatGateway(
    `nat-${environment}`,
    {
      allocationId: natEip.id,
      subnetId: publicSubnets[0].id,
      tags: {
        Name: `nat-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create private route tables and routes
  const privateRouteTables: aws.ec2.RouteTable[] = [];
  privateSubnets.forEach((subnet, index) => {
    const privateRouteTable = new aws.ec2.RouteTable(
      `private-rt-${index + 1}-${environment}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `private-rt-${index + 1}-${environment}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },
      { provider }
    );

    // Route to NAT Gateway for outbound internet access
    new aws.ec2.Route(
      `private-route-${index + 1}-${environment}`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      },
      { provider }
    );

    // Associate private subnet with private route table
    new aws.ec2.RouteTableAssociation(
      `private-rta-${index + 1}-${environment}`,
      {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      },
      { provider }
    );

    privateRouteTables.push(privateRouteTable);
  });

  // Create IAM role for VPC Flow Logs
  const flowLogRole = new aws.iam.Role(
    `vpc-flow-log-role-${environment}`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'vpc-flow-logs.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `vpc-flow-log-role-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create custom policy for VPC Flow Logs
  const flowLogPolicy = new aws.iam.Policy(
    `vpc-flow-log-policy-${environment}`,
    {
      name: `vpc-flow-log-policy-${environment}`,
      description: 'Policy for VPC Flow Logs to write to CloudWatch',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogGroups',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `vpc-flow-log-policy-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Attach custom policy for VPC Flow Logs
  new aws.iam.RolePolicyAttachment(
    `vpc-flow-log-policy-attachment-${environment}`,
    {
      role: flowLogRole.name,
      policyArn: flowLogPolicy.arn,
    },
    { provider }
  );

  // Create CloudWatch Log Group for VPC Flow Logs
  const flowLogGroup = new aws.cloudwatch.LogGroup(
    `vpc-flow-logs-${environment}`,
    {
      name: `/aws/vpc/flowlogs/${environment}`,
      retentionInDays: 30, // Retain logs for 30 days
      tags: {
        Name: `vpc-flow-logs-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Create VPC Flow Log
  const vpcFlowLog = new aws.ec2.FlowLog(
    `vpc-flow-log-${environment}`,
    {
      iamRoleArn: flowLogRole.arn,
      logDestination: flowLogGroup.arn,
      logDestinationType: 'cloud-watch-logs',
      vpcId: vpc.id,
      trafficType: 'ALL',
      tags: {
        Name: `vpc-flow-log-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

**lib/security.ts**
```typescript
/**
 * security.ts
 *
 * This module defines security-related resources including security groups
 * for the secure AWS infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createSecurityGroup(
  environment: string,
  vpcId: pulumi.Output<string>,
  allowedSshCidrs: string[],
  provider: aws.Provider
): aws.ec2.SecurityGroup {
  // Validate CIDR blocks
  const validatedCidrs = allowedSshCidrs.map(cidr => {
    if (!cidr.includes('/')) {
      throw new Error(
        `Invalid CIDR block: ${cidr}. Must include subnet mask (e.g., /32 for single IP)`
      );
    }
    return cidr;
  });

  const securityGroup = new aws.ec2.SecurityGroup(
    `sg-ssh-${environment}`,
    {
      name: `ssh-access-${environment}`,
      description: `Security group for SSH access - ${environment}`,
      vpcId: vpcId,

      // SSH ingress rules for trusted CIDR blocks only
      ingress: validatedCidrs.map(cidr => ({
        description: `SSH access from ${cidr}`,
        fromPort: 22,
        toPort: 22,
        protocol: 'tcp',
        cidrBlocks: [cidr],
      })),

      // Least privilege egress rules - only what's needed for updates and SSM
      egress: [
        {
          description: 'HTTPS for package updates and SSM communication',
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // Required for AWS services and package repos
        },
        {
          description: 'HTTP for package repositories (Amazon Linux repos)',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // Required for yum/dnf package updates
        },
        {
          description: 'DNS resolution',
          fromPort: 53,
          toPort: 53,
          protocol: 'udp',
          cidrBlocks: ['0.0.0.0/0'], // Required for DNS resolution
        },
        {
          description: 'NTP for time synchronization',
          fromPort: 123,
          toPort: 123,
          protocol: 'udp',
          cidrBlocks: ['0.0.0.0/0'], // Required for time sync
        },
      ],

      tags: {
        Name: `ssh-access-${environment}`,
        Environment: environment,
        Purpose: 'SSH-Access',
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  return securityGroup;
}
```

**lib/compute.ts**
```typescript
/**
 * compute.ts
 *
 * This module defines compute-related resources including EC2 instances
 * for the secure AWS infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export function createEc2Instance(
  environment: string,
  subnetId: pulumi.Output<string>,
  securityGroupId: pulumi.Output<string>,
  instanceType: string,
  provider: aws.Provider
): aws.ec2.Instance {
  // Get the latest Amazon Linux 2023 AMI (more secure and up-to-date)
  const amiId = aws.ec2
    .getAmi(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          {
            name: 'name',
            values: ['al2023-ami-*-x86_64'],
          },
          {
            name: 'virtualization-type',
            values: ['hvm'],
          },
        ],
      },
      { provider }
    )
    .then(ami => ami.id);

  // Create IAM role for SSM access with least privilege
  const ssmRole = new aws.iam.Role(
    `ssm-role-${environment}`,
    {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Condition: {
              StringEquals: {
                'aws:RequestedRegion': pulumi.output(provider.region),
              },
            },
          },
        ],
      }),
      tags: {
        Name: `ssm-role-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Attach SSM managed policy to the role
  new aws.iam.RolePolicyAttachment(
    `ssm-policy-attachment-${environment}`,
    {
      role: ssmRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    },
    { provider }
  );

  // Add CloudWatch agent policy for monitoring
  new aws.iam.RolePolicyAttachment(
    `cloudwatch-agent-policy-${environment}`,
    {
      role: ssmRole.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    },
    { provider }
  );

  // Create instance profile
  const instanceProfile = new aws.iam.InstanceProfile(
    `instance-profile-${environment}`,
    {
      role: ssmRole.name,
      tags: {
        Name: `instance-profile-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // User data script for basic hardening and setup with SSM agent
  const userData = `#!/bin/bash
set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Log all output
exec > >(tee /var/log/user-data.log)
exec 2>&1

# Update system packages
dnf update -y

# Install AWS CLI v2 (Amazon Linux 2023 uses dnf)
dnf install -y awscli2

# Install and start SSM agent (usually pre-installed on Amazon Linux 2023)
dnf install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install CloudWatch agent
dnf install -y amazon-cloudwatch-agent

# Basic security hardening
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/' /etc/ssh/sshd_config
sed -i 's/#ClientAliveInterval 0/ClientAliveInterval 300/' /etc/ssh/sshd_config
sed -i 's/#ClientAliveCountMax 3/ClientAliveCountMax 2/' /etc/ssh/sshd_config

# Disable unused services
systemctl disable postfix || true
systemctl stop postfix || true

# Configure automatic security updates
dnf install -y dnf-automatic
sed -i 's/apply_updates = no/apply_updates = yes/' /etc/dnf/automatic.conf
sed -i 's/upgrade_type = default/upgrade_type = security/' /etc/dnf/automatic.conf
systemctl enable dnf-automatic.timer
systemctl start dnf-automatic.timer

# Set up fail2ban for SSH protection
dnf install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Restart SSH with new configuration
systemctl restart sshd

# Create a non-root user with limited privileges
useradd -m -s /bin/bash -G wheel trainer
# Set up SSH directory for the user
mkdir -p /home/trainer/.ssh
chmod 700 /home/trainer/.ssh
chown trainer:trainer /home/trainer/.ssh

# Set proper file permissions
chmod 700 /home/trainer
chown trainer:trainer /home/trainer

# Configure sudo to require password
echo '%wheel ALL=(ALL) ALL' > /etc/sudoers.d/wheel

echo "Setup completed with SSM agent and security hardening" >> /var/log/user-data.log
`;

  // Create EC2 instance
  const instance = new aws.ec2.Instance(
    `ec2-${environment}`,
    {
      ami: amiId,
      instanceType: instanceType,
      iamInstanceProfile: instanceProfile.name,
      subnetId: subnetId,
      vpcSecurityGroupIds: [securityGroupId],

      userData: userData,

      // Enable detailed monitoring
      monitoring: true,

      // EBS optimization for better performance
      ebsOptimized: true,

      // Enforce IMDSv2 for better security
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'required', // Enforce IMDSv2
        httpPutResponseHopLimit: 1,
        instanceMetadataTags: 'enabled',
      },

      // Root block device configuration
      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 30,
        encrypted: true,
        deleteOnTermination: true,
        tags: {
          Name: `ebs-root-${environment}`,
          Environment: environment,
          ManagedBy: 'Pulumi',
        },
      },

      tags: {
        Name: `ec2-${environment}`,
        Environment: environment,
        Purpose: 'WebServer',
        ManagedBy: 'Pulumi',
        Backup: 'Required',
      },

      // Enable termination protection for production
      disableApiTermination: environment === 'prod',
    },
    {
      provider,
      // Ensure instance is created after instance profile
      dependsOn: [instanceProfile],
    }
  );

**lib/security-monitoring.ts**
```typescript
/**
 * security-monitoring.ts
 *
 * This module defines security monitoring resources including CloudTrail,
 * GuardDuty, and Config for comprehensive security monitoring.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface SecurityMonitoringResources {
  cloudTrail: aws.cloudtrail.Trail;
  cloudTrailBucket: aws.s3.Bucket;
  guardDutyDetectorId: pulumi.Output<string>;
  configRecorder: aws.cfg.Recorder;
  configDeliveryChannel: aws.cfg.DeliveryChannel;
}

export function createSecurityMonitoring(
  environment: string,
  provider: aws.Provider
): SecurityMonitoringResources {
  // Create S3 bucket for CloudTrail logs
  const cloudTrailBucket = new aws.s3.Bucket(
    `cloudtrail-logs-${environment}`,
    {
      bucket: `cloudtrail-logs-${environment}-${Date.now()}`,
      forceDestroy: environment !== 'prod', // Protect production logs
      tags: {
        Name: `cloudtrail-logs-${environment}`,
        Environment: environment,
        Purpose: 'CloudTrail-Logs',
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Enable versioning on CloudTrail bucket
  new aws.s3.BucketVersioning(
    `cloudtrail-bucket-versioning-${environment}`,
    {
      bucket: cloudTrailBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    },
    { provider }
  );

  // Enable server-side encryption for CloudTrail bucket
  new aws.s3.BucketServerSideEncryptionConfiguration(
    `cloudtrail-bucket-encryption-${environment}`,
    {
      bucket: cloudTrailBucket.id,
      rules: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    },
    { provider }
  );

  // Block public access to CloudTrail bucket
  new aws.s3.BucketPublicAccessBlock(
    `cloudtrail-bucket-pab-${environment}`,
    {
      bucket: cloudTrailBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    { provider }
  );

  // CloudTrail bucket policy
  const cloudTrailBucketPolicy = new aws.s3.BucketPolicy(
    `cloudtrail-bucket-policy-${environment}`,
    {
      bucket: cloudTrailBucket.id,
      policy: pulumi.all([cloudTrailBucket.arn]).apply(([bucketArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AWSCloudTrailAclCheck',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:GetBucketAcl',
              Resource: bucketArn,
            },
            {
              Sid: 'AWSCloudTrailWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: `${bucketArn}/*`,
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
    { provider }
  );

  // Create CloudTrail
  const cloudTrail = new aws.cloudtrail.Trail(
    `cloudtrail-${environment}`,
    {
      name: `cloudtrail-${environment}`,
      s3BucketName: cloudTrailBucket.bucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,

      eventSelectors: [
        {
          readWriteType: 'All',
          includeManagementEvents: true,
          dataResources: [
            {
              type: 'AWS::S3::Object',
              values: ['arn:aws:s3:::*/'],
            },
          ],
        },
      ],

      tags: {
        Name: `cloudtrail-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    {
      provider,
      dependsOn: [cloudTrailBucketPolicy],
    }
  );

  // Use a simpler approach to handle existing GuardDuty detector
  const guardDutyDetector = pulumi.output(
    aws.guardduty
      .getDetector({}, { provider })
      .then(result => {
        // If detector exists, reference it
        return aws.guardduty.Detector.get(
          'existing-detector',
          result.id,
          undefined,
          { provider }
        );
      })
      .catch(() => {
        // If detector doesn't exist, create one
        return new aws.guardduty.Detector(
          'main-detector',
          {
            enable: true,
            findingPublishingFrequency: 'FIFTEEN_MINUTES',
            tags: {
              Name: `guardduty-${environment}`,
              Environment: environment,
              ManagedBy: 'Pulumi',
            },
          },
          { provider }
        );
      })
  );

  // Get the detector ID as a Pulumi Output
  const guardDutyDetectorId = guardDutyDetector.apply(d => d.id);

  // Enable S3 protection for GuardDuty
  new aws.guardduty.DetectorFeature(
    `guardduty-s3-protection-${environment}`,
    {
      detectorId: guardDutyDetectorId,
      name: 'S3_DATA_EVENTS',
      status: 'ENABLED',
    },
    { provider }
  );

  // Enable EKS protection for GuardDuty
  new aws.guardduty.DetectorFeature(
    `guardduty-eks-protection-${environment}`,
    {
      detectorId: guardDutyDetectorId,
      name: 'EKS_AUDIT_LOGS',
      status: 'ENABLED',
    },
    { provider }
  );

  // Enable malware protection for GuardDuty
  new aws.guardduty.DetectorFeature(
    `guardduty-malware-protection-${environment}`,
    {
      detectorId: guardDutyDetectorId,
      name: 'EBS_MALWARE_PROTECTION',
      status: 'ENABLED',
    },
    { provider }
  );

  // Create S3 bucket for Config
  const configBucket = new aws.s3.Bucket(
    `config-logs-${environment}`,
    {
      bucket: `config-logs-${environment}-${Date.now()}`,
      forceDestroy: environment !== 'prod',
      tags: {
        Name: `config-logs-${environment}`,
        Environment: environment,
        Purpose: 'Config-Logs',
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Config bucket policy
  const configBucketPolicy = new aws.s3.BucketPolicy(
    `config-bucket-policy-${environment}`,
    {
      bucket: configBucket.id,
      policy: pulumi.all([configBucket.arn]).apply(([bucketArn]) =>
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
              Resource: bucketArn,
            },
            {
              Sid: 'AWSConfigBucketExistenceCheck',
              Effect: 'Allow',
              Principal: {
                Service: 'config.amazonaws.com',
              },
              Action: 's3:ListBucket',
              Resource: bucketArn,
            },
            {
              Sid: 'AWSConfigBucketDelivery',
              Effect: 'Allow',
              Principal: {
                Service: 'config.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: `${bucketArn}/*`,
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
    { provider }
  );

  // Config service role
  const configRole = new aws.iam.Role(
    `config-role-${environment}`,
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
      tags: {
        Name: `config-role-${environment}`,
        Environment: environment,
        ManagedBy: 'Pulumi',
      },
    },
    { provider }
  );

  // Attach Config service role policy
  new aws.iam.RolePolicyAttachment(
    `config-role-policy-${environment}`,
    {
      role: configRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
    },
    { provider }
  );

  // Config configuration recorder (must be created before delivery channel)
  const configRecorder = new aws.cfg.Recorder(
    `config-recorder-${environment}`,
    {
      name: `config-recorder-${environment}`,
      roleArn: configRole.arn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    },
    {
      provider,
      dependsOn: [configBucketPolicy],
    }
  );

  // Config delivery channel (depends on recorder)
  const configDeliveryChannel = new aws.cfg.DeliveryChannel(
    `config-delivery-channel-${environment}`,
    {
      name: `config-delivery-channel-${environment}`,
      s3BucketName: configBucket.bucket,
    },
    {
      provider,
      dependsOn: [configRecorder],
    }
  );

  return {
    cloudTrail,
    cloudTrailBucket,
    guardDutyDetectorId,
    configRecorder,
    configDeliveryChannel,
  };
}
```

## Package.json Dependencies

```json
{
  "name": "iac-test-automations",
  "version": "1.0.0",
  "description": "Secure AWS infrastructure with comprehensive testing",
  "main": "main.js",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=int",
    "pulumi:preview": "pulumi preview",
    "pulumi:up": "pulumi up",
    "pulumi:destroy": "pulumi destroy"
  },
  "devDependencies": {
    "@types/jest": "^29.0.0",
    "@types/node": "^18.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0",
    "typescript": "^4.7.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0",
    "@aws-sdk/client-ec2": "^3.0.0",
    "@aws-sdk/client-iam": "^3.0.0",
    "@aws-sdk/client-sts": "^3.0.0",
    "@aws-sdk/client-cloudtrail": "^3.0.0",
    "@aws-sdk/client-guardduty": "^3.0.0",
    "@aws-sdk/client-cloudwatch": "^3.0.0"
  }
}
```

## Key Security Features Implemented

1. **Network Security**: 
   - VPC with CIDR 10.0.0.0/16 as specified in PROMPT.md
   - Two public subnets (10.0.1.0/24, 10.0.2.0/24) in different AZs for redundancy
   - Private subnets (10.0.10.0/24, 10.0.20.0/24) with NAT Gateway for secure outbound access
   - Internet Gateway with proper routing for public subnets
   - VPC Flow Logs for comprehensive network monitoring

2. **Access Control**: 
   - Security group restricts SSH access to 203.26.56.90/32 as specified in PROMPT.md
   - IAM roles with least privilege principles
   - SSM access for secure instance management without SSH keys
   - IMDSv2 enforcement on EC2 instances

3. **Compute Security**: 
   - Latest Amazon Linux 2023 AMI (more secure than AL2)
   - EC2 instance deployed in public subnet as specified
   - Encrypted EBS volumes (30GB root volume, fixed from 20GB)
   - Comprehensive security hardening via user data
   - Detailed monitoring and EBS optimization enabled

4. **Security Monitoring**: 
   - CloudTrail for comprehensive audit logging with S3 storage
   - GuardDuty for threat detection with multiple protection features
   - AWS Config for compliance monitoring and configuration tracking
   - VPC Flow Logs for network traffic analysis

5. **Infrastructure Security**: 
   - All resources properly tagged with Environment, ManagedBy, Purpose
   - Resource naming follows <resource>-<environment> pattern as specified
   - Region-agnostic deployment (defaults to ap-south-1 as specified)
   - Production-ready with proper error handling and dependencies
   - Encrypted S3 buckets with versioning and public access blocking

## Deployment Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run unit tests
npm run test:unit

# Run integration tests (requires deployed infrastructure)
npm run test:integration

# Preview deployment
npm run pulumi:preview

# Deploy infrastructure
npm run pulumi:up

# Get outputs
pulumi stack output ec2InstancePublicIp
pulumi stack output vpcId
pulumi stack output securityGroupId
```
