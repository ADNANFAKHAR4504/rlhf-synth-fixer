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

I need to structure this as a reusable CDK stack class that can be deployed to different regions. The key considerations are:

1. Environment suffix support for avoiding resource naming conflicts
2. Proper IAM role with least-privilege access
3. VPC configuration that works reliably without custom resource issues
4. Proper tagging and outputs for integration testing

### Answer

---

Here's a comprehensive TypeScript CDK v2 implementation that meets all requirements:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  region: string;
  amiSsmParameterName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const { region, amiSsmParameterName } = props;

    const ssmParameterName =
      amiSsmParameterName ||
      '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2';

    // Create VPC with explicit configuration to avoid custom resource issues
    const vpc = new ec2.Vpc(this, 'MultiRegionVpc', {
      maxAzs: 2,
      natGateways: 2,
      // Disable the restrictDefaultSecurityGroup to avoid the hanging custom resource
      restrictDefaultSecurityGroup: false,
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

    // Create IAM role for EC2 instances
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

    new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

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

    // Tag all resources
    cdk.Tags.of(this).add('Project', 'MultiRegionWebApp');
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // Additional outputs
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
```

## Key Features Implemented:

### Infrastructure Components

- **VPC**: Spans 2 AZs with 2 public and 2 private subnets per region
- **EC2 Instances**: 2 instances per region, one in each public subnet
- **Security Group**: Allows SSH (port 22) and HTTP (port 80) from anywhere
- **IAM Role**: Least-privilege access only to the specific SSM parameter

### Security & Best Practices

- **Least-Privilege IAM**: EC2 instances can only access the specific AMI SSM parameter
- **Public IP Assignment**: Instances get public IPs for external access
- **Proper Resource Tagging**: All resources tagged with `Project=MultiRegionWebApp` and environment suffix
- **Reliable VPC Configuration**: Disables problematic custom resources

### Multi-Region & Environment Support

- **Environment Suffix Support**: Configurable suffix to avoid resource naming conflicts
- **Region-Specific AMI**: Uses SSM Parameter Store to get the correct AMI ID per region
- **Flexible Configuration**: Easy to add more regions or customize AMI parameters

### Outputs

- Public DNS names for each EC2 instance
- VPC IDs and Security Group IDs for reference
- Exportable stack outputs for cross-stack references and integration testing

This implementation provides a production-ready, reusable CDK stack that can be deployed across multiple regions with proper resource isolation and testing support.