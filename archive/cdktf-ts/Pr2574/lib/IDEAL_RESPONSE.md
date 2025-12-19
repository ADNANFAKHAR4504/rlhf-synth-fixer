## lib/modules.ts

```typescript
import { Construct } from 'constructs';

// VPC & Networking
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';

// Security Groups
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

// EC2 & AutoScaling
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

// Load Balancer
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';

// RDS
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

// S3
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

// IAM
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

// Secrets Manager
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';

// Random provider for password generation
import { Password } from '@cdktf/provider-random/lib/password';

// Network Module
export interface NetworkModuleProps {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}

export interface NetworkModuleOutputs {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  internetGatewayId: string;
}

export class NetworkModule extends Construct {
  public readonly outputs: NetworkModuleOutputs;

  constructor(scope: Construct, id: string, props: NetworkModuleProps) {
    super(scope, id);

    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { Name: 'main-vpc' },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: { Name: 'main-igw' },
    });

    // Public Subnets
    const publicSubnets = props.publicSubnetCidrs.map(
      (cidr, index) =>
        new Subnet(this, `public-subnet-${index}`, {
          vpcId: vpc.id,
          cidrBlock: cidr,
          availabilityZone: `\${${azs.fqn}.names[${index}]}`,
          mapPublicIpOnLaunch: true,
          tags: { Name: `public-subnet-${index + 1}` },
        })
    );

    // Private Subnets
    const privateSubnets = props.privateSubnetCidrs.map(
      (cidr, index) =>
        new Subnet(this, `private-subnet-${index}`, {
          vpcId: vpc.id,
          cidrBlock: cidr,
          availabilityZone: `\${${azs.fqn}.names[${index}]}`,
          tags: { Name: `private-subnet-${index + 1}` },
        })
    );

    // NAT Gateways
    const natGateways = publicSubnets.map((subnet, index) => {
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: { Name: `nat-eip-${index + 1}` },
      });

      return new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eip.id,
        subnetId: subnet.id,
        tags: { Name: `nat-gateway-${index + 1}` },
      });
    });

    // Route Tables
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: { Name: 'public-route-table' },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private Route Tables
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: vpc.id,
        tags: { Name: `private-route-table-${index + 1}` },
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    this.outputs = {
      vpcId: vpc.id,
      publicSubnetIds: publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: privateSubnets.map(subnet => subnet.id),
      internetGatewayId: igw.id,
    };
  }
}

// Security Module
export interface SecurityModuleProps {
  vpcId: string;
}

export interface SecurityModuleOutputs {
  albSecurityGroupId: string;
  ec2SecurityGroupId: string;
  rdsSecurityGroupId: string;
}

export class SecurityModule extends Construct {
  public readonly outputs: SecurityModuleOutputs;

  constructor(scope: Construct, id: string, props: SecurityModuleProps) {
    super(scope, id);

    // ALB Security Group
    const albSg = new SecurityGroup(this, 'alb-sg', {
      name: 'alb-security-group',
      description: 'Security group for Application Load Balancer',
      vpcId: props.vpcId,
      tags: { Name: 'alb-sg' },
    });

    // Changed to HTTP (port 80)
    new SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
    });

    // EC2 Security Group
    const ec2Sg = new SecurityGroup(this, 'ec2-sg', {
      name: 'ec2-security-group',
      description: 'Security group for EC2 instances',
      vpcId: props.vpcId,
      tags: { Name: 'ec2-sg' },
    });

    new SecurityGroupRule(this, 'ec2-ssh-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: ec2Sg.id,
    });

    // Changed to HTTP (port 80)
    new SecurityGroupRule(this, 'ec2-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: albSg.id,
      securityGroupId: ec2Sg.id,
    });

    new SecurityGroupRule(this, 'ec2-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ec2Sg.id,
    });

    // RDS Security Group (unchanged)
    const rdsSg = new SecurityGroup(this, 'rds-sg', {
      name: 'rds-security-group',
      description: 'Security group for RDS instance',
      vpcId: props.vpcId,
      tags: { Name: 'rds-sg' },
    });

    new SecurityGroupRule(this, 'rds-mysql-ingress', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: ec2Sg.id,
      securityGroupId: rdsSg.id,
    });

    this.outputs = {
      albSecurityGroupId: albSg.id,
      ec2SecurityGroupId: ec2Sg.id,
      rdsSecurityGroupId: rdsSg.id,
    };
  }
}

// Compute Module
export interface ComputeModuleProps {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  ec2SecurityGroupId: string;
  albSecurityGroupId: string;
  instanceProfileName: string;
}

export interface ComputeModuleOutputs {
  albDnsName: string;
  asgName: string;
}

export class ComputeModule extends Construct {
  public readonly outputs: ComputeModuleOutputs;

  constructor(scope: Construct, id: string, props: ComputeModuleProps) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // Launch Template
    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: 'web-server-template',
      imageId: ami.id,
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [props.ec2SecurityGroupId],
      iamInstanceProfile: {
        name: props.instanceProfileName,
      },
      userData: Buffer.from(
        `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
`
      ).toString('base64'),
      tags: { Name: 'web-server-template' },
    });

    // Target Group
    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: 'web-servers-tg',
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 2,
      },
      tags: { Name: 'web-servers-tg' },
    });

    // Auto Scaling Group
    const asg = new AutoscalingGroup(this, 'asg', {
      name: 'web-servers-asg',
      vpcZoneIdentifier: props.privateSubnetIds,
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 4,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: 'web-server-asg',
          propagateAtLaunch: true,
        },
      ],
    });

    // Application Load Balancer
    const alb = new Lb(this, 'alb', {
      name: 'web-servers-alb',
      loadBalancerType: 'application',
      subnets: props.publicSubnetIds,
      securityGroups: [props.albSecurityGroupId],
      tags: { Name: 'web-servers-alb' },
    });

    // ALB Listener
    new LbListener(this, 'alb-listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    this.outputs = {
      albDnsName: alb.dnsName,
      asgName: asg.name,
    };
  }
}

// Database Module
export interface DatabaseModuleProps {
  privateSubnetIds: string[];
  rdsSecurityGroupId: string;
}

export interface DatabaseModuleOutputs {
  rdsEndpoint: string;
  rdsPort: string;
  secretArn: string;
  secretName: string;
}

export class DatabaseModule extends Construct {
  public readonly outputs: DatabaseModuleOutputs;

  constructor(scope: Construct, id: string, props: DatabaseModuleProps) {
    super(scope, id);

    // Generate a random password using the Random provider
    const dbPassword = new Password(this, 'db-password', {
      length: 16,
      special: true,
      upper: true,
      lower: true,
      numeric: true,
      minUpper: 1,
      minLower: 1,
      minNumeric: 1,
      minSpecial: 1,
      // Exclude characters that might cause issues in JSON or database connections
      overrideSpecial: '!@#$%^&*()-_=+[]{}|;:,.<>?',
    });

    // Create Secrets Manager Secret for RDS password
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: 'rds-admin-password',
      description: 'RDS Admin Password',
      tags: { Name: 'rds-admin-password' },
    });

    // Generate a random password for the secret using the generated password
    const dbSecretVersion = new SecretsmanagerSecretVersion(
      this,
      'db-secret-version',
      {
        secretId: dbSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: dbPassword.result, // Use the generated random password
        }),
      }
    );

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: 'main-db-subnet-group',
      subnetIds: props.privateSubnetIds,
      tags: { Name: 'main-db-subnet-group' },
    });

    // RDS Instance using the generated password
    const rds = new DbInstance(this, 'rds', {
      identifier: 'main-database',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: 'gp2',
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      dbName: 'maindb',
      username: 'admin',
      // Use the generated password from the random provider
      password: dbPassword.result,
      vpcSecurityGroupIds: [props.rdsSecurityGroupId],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: 7,
      multiAz: true,
      storageEncrypted: true,
      skipFinalSnapshot: true,
      tags: { Name: 'main-database' },
      dependsOn: [dbSecretVersion],
    });

    this.outputs = {
      rdsEndpoint: rds.endpoint,
      rdsPort: rds.port.toString(),
      secretArn: dbSecret.arn,
      secretName: dbSecret.name,
    };
  }
}

// Storage Module
export interface StorageModuleProps {
  // Empty interface but keeping it for future extensibility
}

export interface StorageModuleOutputs {
  s3BucketName: string;
  instanceProfileName: string;
}

export class StorageModule extends Construct {
  public readonly outputs: StorageModuleOutputs;

  constructor(scope: Construct, id: string, _props: StorageModuleProps) {
    super(scope, id);

    // S3 Bucket
    const bucket = new S3Bucket(this, 'backup-bucket', {
      bucket: `app-backups-${Math.random().toString(36).substring(7)}`,
      tags: { Name: 'backup-bucket' },
    });

    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // IAM Role for EC2
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: 'ec2-s3-access-role',
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
      tags: { Name: 'ec2-s3-access-role' },
    });

    // Attach policies
    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    new IamRolePolicyAttachment(this, 'ec2-s3-policy', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
    });

    // Instance Profile
    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: 'ec2-s3-instance-profile',
        role: ec2Role.name,
      }
    );

    this.outputs = {
      s3BucketName: bucket.bucket,
      instanceProfileName: instanceProfile.name,
    };
  }
}

```

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import your stacks here
import {
  NetworkModule,
  SecurityModule,
  ComputeModule,
  DatabaseModule,
  StorageModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Random Provider for password generation
    new RandomProvider(this, 'random');

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Add your stack instantiations here
    // Do NOT create resources directly in this stack.
    // Instead, create separate stacks for each resource type.

    // Network Module
    const networkModule = new NetworkModule(this, 'network', {
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
    });

    // Security Module
    const securityModule = new SecurityModule(this, 'security', {
      vpcId: networkModule.outputs.vpcId,
    });

    // Storage Module (needs to be created before Compute for instance profile)
    const storageModule = new StorageModule(this, 'storage', {});

    // Compute Module
    const computeModule = new ComputeModule(this, 'compute', {
      vpcId: networkModule.outputs.vpcId,
      publicSubnetIds: networkModule.outputs.publicSubnetIds,
      privateSubnetIds: networkModule.outputs.privateSubnetIds,
      ec2SecurityGroupId: securityModule.outputs.ec2SecurityGroupId,
      albSecurityGroupId: securityModule.outputs.albSecurityGroupId,
      instanceProfileName: storageModule.outputs.instanceProfileName,
    });

    // Database Module
    const databaseModule = new DatabaseModule(this, 'database', {
      privateSubnetIds: networkModule.outputs.privateSubnetIds,
      rdsSecurityGroupId: securityModule.outputs.rdsSecurityGroupId,
    });

    // Terraform Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: networkModule.outputs.vpcId,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: JSON.stringify(networkModule.outputs.publicSubnetIds),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: JSON.stringify(networkModule.outputs.privateSubnetIds),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: networkModule.outputs.internetGatewayId,
      description: 'Internet Gateway ID',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: storageModule.outputs.s3BucketName,
      description: 'S3 bucket name',
    });

    new TerraformOutput(this, 'ec2-instance-profile-name', {
      value: storageModule.outputs.instanceProfileName,
      description: 'EC2 instance profile name',
    });

    new TerraformOutput(this, 'alb-security-group-id', {
      value: securityModule.outputs.albSecurityGroupId,
      description: 'ALB Security Group ID',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: securityModule.outputs.ec2SecurityGroupId,
      description: 'EC2 Security Group ID',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: securityModule.outputs.rdsSecurityGroupId,
      description: 'RDS Security Group ID',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: computeModule.outputs.albDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'asg-name', {
      value: computeModule.outputs.asgName,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: databaseModule.outputs.rdsEndpoint,
      description: 'RDS database endpoint',
    });

    new TerraformOutput(this, 'rds-port', {
      value: databaseModule.outputs.rdsPort,
      description: 'RDS database port',
    });

    // Add these outputs after your existing outputs
    new TerraformOutput(this, 'rds-secret-arn', {
      value: databaseModule.outputs.secretArn,
      description: 'RDS password secret ARN',
      sensitive: true, // Mark as sensitive to avoid displaying in logs
    });

    new TerraformOutput(this, 'rds-secret-name', {
      value: databaseModule.outputs.secretName,
      description: 'RDS password secret name',
    });
  }
}

```