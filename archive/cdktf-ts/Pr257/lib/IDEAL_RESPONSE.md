# AWS CDKTF Secure VPC Infrastructure

This implementation provides a secure VPC infrastructure using AWS CDK for Terraform (CDKTF) with TypeScript, demonstrating best practices for network security and infrastructure as code.

## Implementation Code

### lib/secure-vpc-stack.ts

```typescript
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export class SecureVpcStack extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create VPC
    const vpc = new Vpc(this, 'main_vpc', {
      cidrBlock: '10.0.0.0/16',
    });

    // Get availability zones
    const availabilityZones = ['us-west-2a', 'us-west-2b'];

    // Create public subnets
    const publicSubnets = availabilityZones.map(
      (az, i) =>
        new Subnet(this, `public_subnet_${i}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
        })
    );

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
    });

    // Create Route Table
    const publicRouteTable = new RouteTable(this, 'public_route_table', {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: igw.id,
        },
      ],
    });

    // Associate Route Table with public subnets
    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public_rta_${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create Network ACL
    const networkAcl = new NetworkAcl(this, 'public_nacl', {
      vpcId: vpc.id,
      subnetIds: publicSubnets.map(subnet => subnet.id),
    });

    // Allow inbound HTTP/HTTPS
    new NetworkAclRule(this, 'allow_inbound_http', {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      egress: false,
      cidrBlock: '0.0.0.0/0',
      fromPort: 80,
      toPort: 80,
    });

    new NetworkAclRule(this, 'allow_inbound_https', {
      networkAclId: networkAcl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      egress: false,
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
    });

    // Deny all other inbound traffic
    new NetworkAclRule(this, 'deny_all_inbound', {
      networkAclId: networkAcl.id,
      ruleNumber: 120,
      protocol: '-1',
      ruleAction: 'deny',
      egress: false,
      cidrBlock: '0.0.0.0/0',
    });

    // Create Security Group
    const securityGroup = new SecurityGroup(this, 'web_sg', {
      vpcId: vpc.id,
    });

    // Allow inbound HTTP/HTTPS traffic in Security Group
    new SecurityGroupRule(this, 'allow_http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      securityGroupId: securityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    new SecurityGroupRule(this, 'allow_https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      securityGroupId: securityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    // allow all outbound traffic in Security Group
    new SecurityGroupRule(this, 'allow_all_outbound', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: securityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
    });

    // Output the VPC ID and Subnet IDs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.id,
      description: 'The ID of the VPC',
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: publicSubnets.map(subnet => subnet.id),
      description: 'The IDs of the public subnets',
    });
  }
}
```

### lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { SecureVpcStack } from './secure-vpc-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.
const AWS_REGION_OVERRIDE = 'us-west-2'; // hardcoded to us-west-2 as per task requirement

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

    // ? Add your stack instantiations here
    new SecureVpcStack(this, `secure-vpc-stack-${environmentSuffix}`);
  }
}
```

## Key Features

### Network Architecture

- **VPC with CIDR 10.0.0.0/16**: Provides a large address space for future expansion
- **Multi-AZ Deployment**: Resources spread across us-west-2a and us-west-2b for high availability
- **Public Subnets**: Two public subnets with automatic public IP assignment
- **Internet Gateway**: Enables internet connectivity for public subnets

### Security Layers

- **Network ACLs**: Stateless firewall at subnet level
  - Allows only HTTP (80) and HTTPS (443) inbound traffic
  - Explicit deny rule for all other inbound traffic
  - Rule numbers provide ordering for evaluation
- **Security Groups**: Stateful firewall at instance level
  - Allows HTTP and HTTPS inbound traffic
  - Allows all outbound traffic for internet access
  - Can be attached to EC2 instances and other resources

### Infrastructure as Code Benefits

- **Type Safety**: TypeScript provides compile-time type checking
- **Reusable Components**: Modular stack design for easy replication
- **State Management**: S3 backend with encryption and locking
- **Environment Isolation**: Environment suffix for multi-environment deployments

### Terraform Outputs

- **VPC ID**: For referencing in other stacks or modules
- **Public Subnet IDs**: For deploying resources in the public subnets
- **Structured Outputs**: Clear descriptions for each output value

### Best Practices Implemented

- **Least Privilege Access**: Security rules allow only necessary traffic
- **Defense in Depth**: Multiple security layers (NACLs and Security Groups)
- **High Availability**: Multi-AZ deployment for resilience
- **State Locking**: Prevents concurrent modifications to infrastructure
- **Encrypted State**: Terraform state encrypted at rest in S3

This implementation provides a secure foundation for AWS infrastructure, suitable for hosting web applications with proper network isolation and security controls.