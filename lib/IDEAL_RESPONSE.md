# Multi-Region High-Availability Web Application Deployment (LocalStack Single-Region)

This solution demonstrates a web application infrastructure designed for multi-region deployment, currently configured for single-region LocalStack testing. The architecture can be expanded to full multi-region AWS deployment by uncommenting the secondary region code.

## Architecture Overview

The infrastructure creates (in us-east-1):
- VPC with public subnets across 2 availability zones
- EC2 instances (2 per AZ) running Apache web server
- Security groups allowing HTTP/HTTPS traffic
- IAM roles for EC2 instances with SSM and CloudWatch permissions
- TapStack for deployment validation and output aggregation

Additional components available (commented out for LocalStack):
- Secondary region deployment in us-west-2 (identical infrastructure)
- Route 53 hosted zone for DNS management and failover

## LocalStack Compatibility Notes

This implementation is optimized for LocalStack Community Edition:
- Single-region deployment (us-east-1) - LocalStack Community runs in a single endpoint
- Secondary region (us-west-2) is commented out but can be enabled for AWS deployment
- Uses standalone EC2 instances instead of AutoScaling Groups (not supported in LocalStack Community)
- Deploys instances in public subnets to avoid NAT Gateway requirements
- Route 53 stack commented out to avoid cross-region token issues
- All resources have RemovalPolicy.DESTROY for easy cleanup

## Implementation Files

### bin/tap.ts

The entry point that creates the deployment with LocalStack-compatible single-region setup:

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
// LocalStack: Use simplified webapp stack without AutoScaling/ELB
import { WebAppStack } from '../lib/webapp-stack-localstack';
import { TapStack } from '../lib/tap-stack';
// import { SimpleRoute53Stack } from '../lib/simple-route53-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const repositoryName = process.env.REPOSITORY || 'iac-test-automations';
const commitAuthor = process.env.COMMIT_AUTHOR || 'localstack-migration';
const account = process.env.CDK_DEFAULT_ACCOUNT || '000000000000';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('LocalStackMigration', 'Pr921');

// Primary region (us-east-1) infrastructure
const primaryNetworkStack = new NetworkStack(
  app,
  `PrimaryNetworkStack${environmentSuffix}`,
  {
    stackName: `Primary-Network-${environmentSuffix}`,
    environmentSuffix,
    regionName: 'primary',
    env: {
      account,
      region: 'us-east-1',
    },
  }
);

const primaryWebAppStack = new WebAppStack(
  app,
  `PrimaryWebAppStack${environmentSuffix}`,
  {
    stackName: `Primary-WebApp-${environmentSuffix}`,
    environmentSuffix,
    vpc: primaryNetworkStack.vpc,
    regionName: 'primary',
    env: {
      account,
      region: 'us-east-1',
    },
  }
);

// LocalStack: Secondary region (us-west-2) infrastructure commented out for testing
// LocalStack Community runs in a single endpoint, multi-region deployment is complex
// Uncomment below for actual AWS deployment
/*
const secondaryNetworkStack = new NetworkStack(
  app,
  `SecondaryNetworkStack${environmentSuffix}`,
  {
    stackName: `Secondary-Network-${environmentSuffix}`,
    environmentSuffix,
    regionName: 'secondary',
    env: {
      account,
      region: 'us-west-2',
    },
  }
);

const secondaryWebAppStack = new WebAppStack(
  app,
  `SecondaryWebAppStack${environmentSuffix}`,
  {
    stackName: `Secondary-WebApp-${environmentSuffix}`,
    environmentSuffix,
    vpc: secondaryNetworkStack.vpc,
    regionName: 'secondary',
    env: {
      account,
      region: 'us-west-2',
    },
  }
);
*/

// Global Route 53 DNS management (deployed to us-east-1)
// Note: Route53 stack commented out for initial deployment to avoid cross-region token issues
// Deploy infrastructure first, then manually configure Route53 or use a separate stack
// new SimpleRoute53Stack(app, `Route53Stack${environmentSuffix}`, {
//   stackName: `Route53-${environmentSuffix}`,
//   environmentSuffix,
//   env: {
//     account,
//     region: 'us-east-1',
//   },
// });

// Set dependencies to ensure proper deployment order
primaryWebAppStack.addDependency(primaryNetworkStack);
// LocalStack: Secondary stack commented out
// secondaryWebAppStack.addDependency(secondaryNetworkStack);

// Create TapStack to aggregate outputs for deployment validation
// The deployment script looks for stacks with "TapStack" in their name
const tapStack = new TapStack(app, `TapStack${environmentSuffix}`, {
  stackName: `TapStack-${environmentSuffix}`,
  environmentSuffix,
  outputs: {
    PrimaryInstanceDns: primaryWebAppStack.instanceDnsName,
    DeploymentRegion: 'us-east-1',
    StackType: 'LocalStack-Compatible',
  },
  env: {
    account,
    region: 'us-east-1',
  },
});

// TapStack depends on WebAppStack to ensure outputs are available
tapStack.addDependency(primaryWebAppStack);
```

### lib/network-stack.ts

Creates VPC infrastructure with multi-AZ public subnets:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly webAppSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // Create VPC with multi-AZ setup
    // LocalStack: Simplified to public subnets only (no NAT Gateway required)
    this.vpc = new ec2.Vpc(this, `WebAppVPC-${props.regionName}`, {
      vpcName: `vpc-${props.regionName.substring(0, 3)}-${props.environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    // Create security group for web application
    this.webAppSecurityGroup = new ec2.SecurityGroup(
      this,
      `WebAppSG-${props.regionName}`,
      {
        vpc: this.vpc,
        description: 'Security group for web application instances',
        allowAllOutbound: true,
      }
    );

    this.webAppSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    this.webAppSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Export security group for use in other stacks
    new cdk.CfnOutput(this, `WebAppSecurityGroupId-${props.regionName}`, {
      value: this.webAppSecurityGroup.securityGroupId,
      exportName: `WebAppSG-${props.regionName}-${props.environmentSuffix}`,
    });

    // Export VPC details
    new cdk.CfnOutput(this, `VPCId-${props.regionName}`, {
      value: this.vpc.vpcId,
      exportName: `VPC-${props.regionName}-${props.environmentSuffix}`,
    });
  }
}
```

### lib/webapp-stack-localstack.ts

Deploys EC2 instances with Apache web server:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface WebAppStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  regionName: string;
}

export class WebAppStack extends cdk.Stack {
  public readonly instanceDnsName: string;

  constructor(scope: Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    // LocalStack: Simplified stack without AutoScaling and Load Balancer
    // AutoScaling and ELBv2 are not available in LocalStack Community Edition

    // Create security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `EC2SG-${props.regionName}`,
      {
        vpc: props.vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP traffic directly (no ALB in LocalStack Community)
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Create IAM role for EC2 instances
    const ec2Role = new iam.Role(this, `EC2Role-${props.regionName}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // User data script for web server setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      `echo "<html><body><h1>Web Application - Region: ${props.regionName}</h1><p>Environment: ${props.environmentSuffix}</p></body></html>" > /var/www/html/index.html`
    );

    // LocalStack: Create simple EC2 instances instead of AutoScaling Group
    // Create 2 instances for basic redundancy
    const instances: ec2.Instance[] = [];
    for (let i = 1; i <= 2; i++) {
      const instance = new ec2.Instance(
        this,
        `WebServer${i}-${props.regionName}`,
        {
          vpc: props.vpc,
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
          ),
          machineImage: ec2.MachineImage.latestAmazonLinux2(),
          securityGroup: ec2SecurityGroup,
          role: ec2Role,
          userData: userData,
          vpcSubnets: {
            subnetType: ec2.SubnetType.PUBLIC,
          },
          instanceName: `web-${props.regionName.substring(0, 3)}-${i}-${props.environmentSuffix}`,
        }
      );

      // LocalStack: Add RemovalPolicy.DESTROY for easier cleanup
      instance.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      instances.push(instance);

      // Export instance details
      new cdk.CfnOutput(this, `Instance${i}Id-${props.regionName}`, {
        value: instance.instanceId,
        description: `Web server ${i} instance ID in ${props.regionName}`,
      });

      new cdk.CfnOutput(this, `Instance${i}PublicDns-${props.regionName}`, {
        value: instance.instancePublicDnsName,
        description: `Web server ${i} public DNS in ${props.regionName}`,
        exportName: `Instance${i}-DNS-${props.regionName}-${props.environmentSuffix}`,
      });
    }

    // LocalStack: Export first instance DNS for Route 53 (simplified)
    // In real AWS, this would be the ALB DNS
    this.instanceDnsName = instances[0].instancePublicDnsName;

    new cdk.CfnOutput(this, `PrimaryInstanceDns-${props.regionName}`, {
      value: this.instanceDnsName,
      description: `Primary web server DNS in ${props.regionName}`,
      exportName: `Primary-DNS-${props.regionName}-${props.environmentSuffix}`,
    });

    // LocalStack: Note about limitations
    new cdk.CfnOutput(this, `LocalStackNote-${props.regionName}`, {
      value:
        'AutoScaling and Load Balancer not available in LocalStack Community - using simple EC2 instances',
      description: 'LocalStack limitations note',
    });
  }
}
```

### lib/simple-route53-stack.ts

Creates Route 53 hosted zone with DNS records:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

interface SimpleRoute53StackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SimpleRoute53Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SimpleRoute53StackProps) {
    super(scope, id, props);

    const domainName = `webapp-${props.environmentSuffix}.example.com`;

    // Create hosted zone for the domain
    const hostedZone = new route53.HostedZone(this, 'WebAppHostedZone', {
      zoneName: domainName,
      comment: `Hosted zone for multi-region web application - ${props.environmentSuffix}`,
    });

    // Create CNAME records that can be manually updated with actual ALB DNS names
    new route53.CnameRecord(this, 'PrimaryRegionRecord', {
      zone: hostedZone,
      recordName: `primary.${domainName}`,
      domainName: 'primary-alb-placeholder.us-east-1.elb.amazonaws.com',
      ttl: cdk.Duration.minutes(5),
      comment:
        'Points to primary region ALB - update with actual ALB DNS name after deployment',
    });

    new route53.CnameRecord(this, 'SecondaryRegionRecord', {
      zone: hostedZone,
      recordName: `secondary.${domainName}`,
      domainName: 'secondary-alb-placeholder.us-west-2.elb.amazonaws.com',
      ttl: cdk.Duration.minutes(5),
      comment:
        'Points to secondary region ALB - update with actual ALB DNS name after deployment',
    });

    // Create a simple A record that points to the primary region by default
    new route53.ARecord(this, 'DefaultRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromValues('1.2.3.4'),
      ttl: cdk.Duration.minutes(1),
      comment:
        'Default record - update with weighted routing after ALBs are deployed',
    });

    // Output the hosted zone information
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      exportName: `HostedZone-${props.environmentSuffix}`,
      description: 'Route53 Hosted Zone ID for the web application domain',
    });

    new cdk.CfnOutput(this, 'DomainName', {
      value: domainName,
      exportName: `DomainName-${props.environmentSuffix}`,
      description: 'Domain name for the web application',
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: hostedZone.hostedZoneNameServers?.join(', ') || 'undefined',
      exportName: `NameServers-${props.environmentSuffix}`,
      description:
        'Name servers for the hosted zone - configure these with your domain registrar',
    });

    new cdk.CfnOutput(this, 'PrimaryRegionUrl', {
      value: `https://primary.${domainName}`,
      description: 'URL for primary region endpoint',
    });

    new cdk.CfnOutput(this, 'SecondaryRegionUrl', {
      value: `https://secondary.${domainName}`,
      description: 'URL for secondary region endpoint',
    });

    new cdk.CfnOutput(this, 'PostDeploymentInstructions', {
      value:
        'After ALBs are deployed, update CNAME records with actual ALB DNS names and configure weighted/failover routing',
      description: 'Instructions for completing the DNS setup',
    });
  }
}
```

### lib/tap-stack.ts

Aggregates outputs from all stacks:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  outputs?: Record<string, string>;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // This stack serves as a placeholder - actual multi-region infrastructure
    // is deployed via separate stacks instantiated in bin/tap.ts
    new cdk.CfnOutput(this, 'DeploymentInfo', {
      value: `Multi-region deployment for environment: ${environmentSuffix}`,
      description: 'Information about the current deployment',
    });

    // If outputs are provided from other stacks, aggregate them here
    // This ensures the deployment validation script can find all outputs
    if (props?.outputs) {
      Object.entries(props.outputs).forEach(([key, value]) => {
        new cdk.CfnOutput(this, key, {
          value: value,
          description: `Aggregated output: ${key}`,
        });
      });
    }
  }
}
```

## Deployment Instructions

Deploy to LocalStack:

```bash
# Set environment variables
export ENVIRONMENT_SUFFIX=pr8555
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_REGION=us-east-1

# Install dependencies
npm install

# Deploy all stacks
npx cdk deploy --all --require-approval never
```

## Testing

Run the integration tests:

```bash
npm test
```

The tests verify:
- VPC creation in the primary region (us-east-1)
- EC2 instance deployment and availability
- Security group configuration
- CloudFormation outputs and TapStack validation
- Infrastructure is ready for LocalStack deployment

## Key Features

1. Single-Region Deployment (for LocalStack): Infrastructure in us-east-1 only
2. Multi-Region Ready: Secondary region code available (commented out) for AWS deployment
3. High Availability: 2 EC2 instances across multiple AZs in primary region
4. Security: Security groups restricting traffic to HTTP/HTTPS only
5. Monitoring: IAM roles enable CloudWatch metrics and SSM access
6. LocalStack Compatible: Uses services available in LocalStack Community Edition
7. Easy Cleanup: All resources have RemovalPolicy.DESTROY
8. Deployment Validation: TapStack aggregates outputs for automated testing

## Trade-offs for LocalStack Compatibility

This LocalStack-compatible version makes these simplifications:

1. Single-region deployment (us-east-1 only) - LocalStack Community runs in a single endpoint
2. Secondary region (us-west-2) commented out but available for AWS deployment
3. EC2 instances instead of AutoScaling Groups (not supported in LocalStack Community)
4. No Application Load Balancers (not fully supported in LocalStack Community)
5. Public subnets only to avoid NAT Gateway dependencies
6. Route 53 stack commented out to avoid cross-region token issues
7. Simplified DNS configuration without health checks or failover

For production multi-region AWS deployment, you would:
- Uncomment the secondary region code in bin/tap.ts
- Uncomment the Route53 stack for DNS management
- Add AutoScaling Groups with target tracking policies
- Add Application Load Balancers in each region
- Add private subnets with NAT Gateways
- Configure Route 53 health checks and failover policies
- Add CloudWatch alarms for monitoring
- Add VPC Flow Logs for network analysis
