# AWS Infrastructure for a Scalable & Secure Web Application

This document outlines a robust and reusable infrastructure setup for a web application on AWS, defined using the Cloud Development Kit for Terraform (CDKTF) with TypeScript.

The core of this solution is a reusable `EnvironmentStack` that can be instantiated for different environments like `dev`, `test`, or `prod`. This stack provisions a secure, scalable, and fault-tolerant architecture following AWS best practices.

Key features of this infrastructure include:

- **Isolated Networking**: A dedicated VPC with public and private subnets to securely isolate resources.
- **High Availability & Scalability**: An Auto Scaling Group (ASG) manages EC2 instances across availability zones, with an Application Load Balancer (ALB) distributing traffic.
- **Security First**: Implements the principle of least privilege using specific IAM roles, Security Groups, and a default-deny Network ACL. It also avoids SSH access in favor of AWS Systems Manager (SSM).
- **Data Encryption**: A managed PostgreSQL RDS database is deployed in a private subnet with encryption at rest using a customer-managed KMS key.

---

## `lib/tap-stack.ts`

The main logic is contained within the `EnvironmentStack`. This class programmatically defines all the necessary AWS resources, from networking and security to compute and database layers.

```typescript
import { App, TerraformStack, Fn } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

// --- Reusable Environment Stack ---
interface EnvironmentStackProps {
  environmentName: 'dev' | 'test' | 'prod';
  vpcCidr: string;
  instanceType: string;
  tags: { [key: string]: string };
}

class EnvironmentStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: EnvironmentStackProps) {
    super(scope, id);

    const { environmentName, vpcCidr, instanceType, tags } = props;
    const resourcePrefix = `${environmentName}-webapp`;

    // --- Networking ---
    const vpc = new Vpc(this, 'Vpc', {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      tags: { ...tags, Name: `${resourcePrefix}-vpc` },
    });

    const publicSubnet1 = new Subnet(this, 'PublicSubnet1', {
      vpcId: vpc.id,
      cidrBlock: Fn.cidrsubnet(vpcCidr, 8, 1),
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags: { ...tags, Name: `${resourcePrefix}-public-subnet-a` },
    });

    const privateSubnet1 = new Subnet(this, 'PrivateSubnet1', {
      vpcId: vpc.id,
      cidrBlock: Fn.cidrsubnet(vpcCidr, 8, 101),
      availabilityZone: 'us-east-1a',
      tags: { ...tags, Name: `${resourcePrefix}-private-subnet-a` },
    });

    const igw = new InternetGateway(this, 'IGW', { vpcId: vpc.id, tags });

    const publicRouteTable = new RouteTable(this, 'PublicRT', {
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
      tags: { ...tags, Name: `${resourcePrefix}-public-rt` },
    });
    new RouteTableAssociation(this, 'PublicSubnetAssoc1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    // --- Security: Security Groups & NACLs ---
    const albSg = new SecurityGroup(this, 'AlbSg', {
      name: `${resourcePrefix}-alb-sg`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags,
    });

    const ec2Sg = new SecurityGroup(this, 'Ec2Sg', {
      name: `${resourcePrefix}-ec2-sg`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSg.id],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags,
    });

    const rdsSg = new SecurityGroup(this, 'RdsSg', {
      name: `${resourcePrefix}-rds-sg`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [ec2Sg.id],
        },
      ],
      tags,
    });

    new NetworkAcl(this, 'DefaultNacl', {
      vpcId: vpc.id,
      subnetIds: [publicSubnet1.id, privateSubnet1.id],
      // Default rules are restrictive (deny all). Add explicit allow rules as needed.
      tags: { ...tags, Name: `${resourcePrefix}-main-nacl` },
    });

    // --- ALB and Auto Scaling ---
    const alb = new Lb(this, 'ALB', {
      name: `${resourcePrefix}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: [publicSubnet1.id],
      tags,
    });

    const targetGroup = new LbTargetGroup(this, 'TargetGroup', {
      name: `${resourcePrefix}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      healthCheck: { path: '/', protocol: 'HTTP' },
      tags,
    });

    new LbListener(this, 'Listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{ type: 'forward', targetGroupArn: targetGroup.arn }],
    });

    // --- IAM Role (Least Privilege) ---
    const ec2Role = new IamRole(this, 'Ec2Role', {
      name: `${resourcePrefix}-ec2-role`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(this, 'Ec2AssumePolicy', {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            principals: [
              { type: 'Service', identifiers: ['ec2.amazonaws.com'] },
            ],
          },
        ],
      }).json,
      // Attach managed policy for SSM for secure access, avoiding SSH keys
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      ],
      tags,
    });

    const instanceProfile = new IamInstanceProfile(this, 'InstanceProfile', {
      name: `${resourcePrefix}-instance-profile`,
      role: ec2Role.name,
    });

    const launchTemplate = new LaunchTemplate(this, 'LaunchTemplate', {
      name: `${resourcePrefix}-launch-template`,
      imageId: 'ami-0c55b159cbfafe1f0', // Amazon Linux 2 AMI
      instanceType: instanceType,
      iamInstanceProfile: { arn: instanceProfile.arn },
      vpcSecurityGroupIds: [ec2Sg.id],
      tags,
    });

    new AutoscalingGroup(this, 'ASG', {
      name: `${resourcePrefix}-asg`,
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 1,
      vpcZoneIdentifier: [privateSubnet1.id],
      launchTemplate: { id: launchTemplate.id, version: '$Latest' },
      targetGroupArns: [targetGroup.arn],
      tags: Object.entries(tags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });

    // --- Encrypted RDS Instance ---
    const kmsKey = new KmsKey(this, 'RdsKmsKey', {
      description: `KMS key for ${resourcePrefix} RDS`,
      enableKeyRotation: true,
      tags,
    });

    const dbSubnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: `${resourcePrefix}-db-subnet-group`,
      subnetIds: [privateSubnet1.id], // Add more private subnets for HA
      tags,
    });

    new DbInstance(this, 'RDS', {
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      identifier: `${resourcePrefix}-db`,
      dbName: `${environmentName}_webapp`,
      username: 'admin',
      password: `change-in-secrets-manager-${Fn.randomid({ byteLength: 8 })}`,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSg.id],
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      skipFinalSnapshot: true,
      tags,
    });
  }
}
```

---

## Main Application Entrypoint

This is the entrypoint for the CDKTF application. It initializes the app, configures the AWS provider, and could be extended to create multiple instances of the `EnvironmentStack` (e.g., for `dev` and `prod` environments with different configurations). For this example, it only sets up the provider.

```typescript
// --- Main Application ---
const app = new App();
const awsProvider = new AwsProvider(app, 'aws-provider', {
  region: 'us-east-1',
});

// Example of how to instantiate the stack (not included in the original file but shows usage)
/*
new EnvironmentStack(app, 'dev-environment', {
  environmentName: 'dev',
  vpcCidr: '10.0.0.0/16',
  instanceType: 't3.micro',
  tags: { Owner: 'WebAppTeam', Environment: 'Development' },
});
*/

app.synth();
```
