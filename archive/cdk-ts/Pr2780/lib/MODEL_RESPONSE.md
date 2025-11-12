### Reasoning Trace

---

The user wants me to create a single TypeScript file using AWS CDK v2 that implements a multi-region setup. Let me break down the requirements:

1. Two stacks - one for us-east-1, one for us-west-2
2. Each stack needs:
   - VPC spanning 2 AZs (2 public + 2 private subnets)
   - EC2 instance in each public subnet (2 EC2s per region)
   - Security Group allowing SSH (22) and HTTP (80) from anywhere
   - Read AMI ID from SSM Parameter Store
   - Least-privilege IAM role for EC2 instances
   - Tag everything with Project=MultiRegionWebApp
   - Output public DNS names for each EC2 instance

Let me structure this:

1. Create a base stack class that contains all the common infrastructure
2. Create two instances of this stack for different regions
3. Handle the SSM parameter names for AMI IDs (they're usually region-specific)

For AMI IDs, the default Amazon Linux 2 SSM parameters are:

- /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

I'll need to import the necessary CDK constructs and create the infrastructure step by step.

### Answer

---

Here's a comprehensive TypeScript CDK v2 file that implements the multi-region setup you requested:

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface MultiRegionWebAppStackProps extends cdk.StackProps {
  region: string;
  amiSsmParameterName?: string;
}

class MultiRegionWebAppStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: MultiRegionWebAppStackProps
  ) {
    super(scope, id, props);

    const { region, amiSsmParameterName } = props;

    // Default to Amazon Linux 2 AMI SSM parameter if not provided
    const ssmParameterName =
      amiSsmParameterName ||
      '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2';

    // Create VPC with 2 AZs, 2 public subnets, 2 private subnets
    const vpc = new ec2.Vpc(this, 'MultiRegionVpc', {
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Create Security Group allowing SSH and HTTP from anywhere
    const securityGroup = new ec2.SecurityGroup(this, 'WebAppSecurityGroup', {
      vpc,
      description: 'Security group for multi-region web app',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access from anywhere'
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP access from anywhere'
    );

    // Create IAM role for EC2 instances with least-privilege access to SSM parameter
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances in multi-region web app',
      inlinePolicies: {
        SSMParameterAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['ssm:GetParameter', 'ssm:GetParameters'],
              resources: [
                `arn:aws:ssm:${region}:${this.account}:parameter${ssmParameterName}`,
              ],
            }),
          ],
        }),
      },
    });

    const instanceProfile = new iam.InstanceProfile(
      this,
      'EC2InstanceProfile',
      {
        role: ec2Role,
      }
    );

    // Get AMI ID from SSM Parameter Store
    const amiId = ssm.StringParameter.valueFromLookup(this, ssmParameterName);

    // Create EC2 instances in each public subnet
    const publicSubnets = vpc.publicSubnets;
    const instances: ec2.Instance[] = [];

    publicSubnets.forEach((subnet, index) => {
      const instance = new ec2.Instance(this, `WebAppInstance${index + 1}`, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.genericLinux({
          [region]: amiId,
        }),
        vpc,
        vpcSubnets: {
          subnets: [subnet],
        },
        securityGroup,
        role: ec2Role,
        associatePublicIpAddress: true,
        userData: ec2.UserData.forLinux(),
      });

      instances.push(instance);

      // Output public DNS name for each instance
      new cdk.CfnOutput(this, `Instance${index + 1}PublicDns`, {
        value: instance.instancePublicDnsName,
        description: `Public DNS name for EC2 instance ${index + 1} in ${region}`,
        exportName: `${this.stackName}-Instance${index + 1}-PublicDns`,
      });
    });

    // Tag all resources with Project=MultiRegionWebApp
    cdk.Tags.of(this).add('Project', 'MultiRegionWebApp');

    // Additional outputs for reference
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: `VPC ID for ${region}`,
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: securityGroup.securityGroupId,
      description: `Security Group ID for ${region}`,
      exportName: `${this.stackName}-SecurityGroupId`,
    });
  }
}

// CDK App
const app = new cdk.App();

// Create stack for us-east-1
new MultiRegionWebAppStack(app, 'MultiRegionWebApp-USEast1', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  region: 'us-east-1',
  // Optional: specify custom AMI SSM parameter name
  // amiSsmParameterName: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
});

// Create stack for us-west-2
new MultiRegionWebAppStack(app, 'MultiRegionWebApp-USWest2', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  region: 'us-west-2',
  // Optional: specify custom AMI SSM parameter name
  // amiSsmParameterName: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
});

app.synth();
```

## Key Features Implemented:

### 📋 **Infrastructure Components**

- **VPC**: Spans 2 AZs with 2 public and 2 private subnets per region
- **EC2 Instances**: 2 instances per region, one in each public subnet
- **Security Group**: Allows SSH (port 22) and HTTP (port 80) from anywhere
- **IAM Role**: Least-privilege access only to the specific SSM parameter

### 🔒 **Security & Best Practices**

- **Least-Privilege IAM**: EC2 instances can only access the specific AMI SSM parameter
- **Public IP Assignment**: Instances get public IPs for external access
- **Proper Resource Tagging**: All resources tagged with `Project=MultiRegionWebApp`

### 🌐 **Multi-Region Support**

- **Two Stacks**: `MultiRegionWebApp-USEast1` and `MultiRegionWebApp-USWest2`
- **Region-Specific AMI**: Uses SSM Parameter Store to get the correct AMI ID per region
- **Flexible Configuration**: Easy to add more regions or customize AMI parameters

### 📊 **Outputs**

- Public DNS names for each EC2 instance
- VPC IDs and Security Group IDs for reference
- Exportable stack outputs for cross-stack references

## Deployment Commands:

```bash
# Install dependencies
npm install aws-cdk-lib constructs

# Deploy both stacks
cdk deploy --all

# Deploy specific region
cdk deploy MultiRegionWebApp-USEast1
cdk deploy MultiRegionWebApp-USWest2

# Destroy all resources
cdk destroy --all
```

## Customization Options:

You can customize the AMI SSM parameter by modifying the `amiSsmParameterName` property when creating the stacks, or change instance types, add user data scripts, or modify security group rules as needed.
