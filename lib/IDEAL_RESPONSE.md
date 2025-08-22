```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcCidr?: string;
  maxAzs?: number;
  instanceType?: ec2.InstanceType;
  allowAllOutbound?: boolean;
  enableVpcFlowLogs?: boolean;
  enableVpcEndpoints?: boolean;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly instance: ec2.Instance;
  public readonly keyPair: ec2.KeyPair;

  constructor(scope: Construct, id: string, props: TapStackProps = {}) {
    super(scope, id, props);

    // Validate and set default values with error handling
    const environmentSuffix = this.validateEnvironmentSuffix(
      props.environmentSuffix
    );
    const vpcCidr = this.validateVpcCidr(props.vpcCidr);
    const maxAzs = this.validateMaxAzs(props.maxAzs);
    const instanceType =
      props.instanceType ||
      ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO);
    const allowAllOutbound = props.allowAllOutbound ?? true;
    const enableVpcFlowLogs = props.enableVpcFlowLogs ?? false;
    const enableVpcEndpoints = props.enableVpcEndpoints ?? false;

    const resourceName = (name: string) => `${name}-${environmentSuffix}`;

    try {
      // Create VPC with error handling
      this.vpc = this.createVpc(
        resourceName,
        vpcCidr,
        maxAzs,
        enableVpcFlowLogs
      );

      // Create Security Group with error handling
      this.securityGroup = this.createSecurityGroup(
        resourceName,
        allowAllOutbound
      );

      // Create Key Pair with error handling
      this.keyPair = this.createKeyPair(resourceName);

      // Create EC2 instance with error handling
      this.instance = this.createEC2Instance(resourceName, instanceType);

      // Add VPC Endpoints if enabled
      if (enableVpcEndpoints) {
        this.createVpcEndpoints();
      }

      // Tag all resources for environment identification
      this.tagResources(environmentSuffix);

      // Create stack outputs with error handling
      this.createOutputs(resourceName);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create TapStack: ${errorMessage}`);
    }
  }

  private validateEnvironmentSuffix(suffix?: string): string {
    const defaultSuffix = 'dev';

    if (!suffix || suffix.trim() === '') {
      return defaultSuffix;
    }

    // Check if it's a PR number (starts with 'pr' followed by digits)
    if (
      suffix.toLowerCase().startsWith('pr') &&
      /^pr\d+$/.test(suffix.toLowerCase())
    ) {
      return suffix.toLowerCase();
    }

    // Validate environment suffix format for standard environments
    const validSuffixes = ['dev', 'staging', 'prod', 'test'];
    if (!validSuffixes.includes(suffix.toLowerCase())) {
      throw new Error(
        `Invalid environment suffix: ${suffix}. Must be one of: ${validSuffixes.join(', ')} or a PR number (prXXXX)`
      );
    }

    return suffix.toLowerCase();
  }

  private validateVpcCidr(cidr?: string): string {
    const defaultCidr = '10.0.0.0/16';

    if (!cidr) {
      return defaultCidr;
    }

    // Validate CIDR format
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    if (!cidrRegex.test(cidr)) {
      throw new Error(
        `Invalid VPC CIDR format: ${cidr}. Expected format: x.x.x.x/y`
      );
    }

    // Validate CIDR range
    const parts = cidr.split('/');
    const prefixLength = parseInt(parts[1], 10);

    if (prefixLength < 16 || prefixLength > 28) {
      throw new Error(
        `Invalid VPC CIDR prefix length: ${prefixLength}. Must be between 16 and 28`
      );
    }

    return cidr;
  }

  private validateMaxAzs(maxAzs?: number): number {
    const defaultMaxAzs = 2;

    if (!maxAzs || maxAzs <= 0) {
      return defaultMaxAzs;
    }

    if (maxAzs < 1 || maxAzs > 4) {
      throw new Error(`Invalid max AZs: ${maxAzs}. Must be between 1 and 4`);
    }

    return maxAzs;
  }

  private createVpc(
    resourceName: (name: string) => string,
    vpcCidr: string,
    maxAzs: number,
    enableFlowLogs: boolean
  ): ec2.Vpc {
    try {
      const vpc = new ec2.Vpc(this, 'VPC', {
        vpcName: resourceName('vpc'),
        ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
        enableDnsHostnames: true,
        enableDnsSupport: true,
        maxAzs,
        subnetConfiguration: [
          {
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 24,
          },
          {
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            cidrMask: 24,
          },
        ],
      });

      // Add VPC Flow Logs if enabled
      if (enableFlowLogs) {
        vpc.addFlowLog('FlowLog', {
          trafficType: ec2.FlowLogTrafficType.ALL,
        });
      }

      return vpc;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create VPC: ${errorMessage}`);
    }
  }

  private createSecurityGroup(
    resourceName: (name: string) => string,
    allowAllOutbound: boolean
  ): ec2.SecurityGroup {
    const securityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: this.vpc,
      securityGroupName: resourceName('ec2-sg'),
      description: 'Security group for EC2 instance',
      allowAllOutbound,
    });

    // Add inbound rules
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP inbound'
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH inbound'
    );

    return securityGroup;
  }

  private createKeyPair(resourceName: (name: string) => string): ec2.KeyPair {
    return new ec2.KeyPair(this, 'EC2KeyPair', {
      keyPairName: resourceName('key-pair'),
      type: ec2.KeyPairType.RSA,
      format: ec2.KeyPairFormat.PEM,
    });
  }

  private createEC2Instance(
    resourceName: (name: string) => string,
    instanceType: ec2.InstanceType
  ): ec2.Instance {
    return new ec2.Instance(this, 'EC2Instance', {
      vpc: this.vpc,
      instanceType,
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: this.securityGroup,
      keyPair: this.keyPair,
      associatePublicIpAddress: true,
      userData: this.createUserData(),
    });
  }

  private createUserData(): ec2.UserData {
    const userData = ec2.UserData.forLinux();

    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from AWS CDK TAP Stack!</h1>" > /var/www/html/index.html',
      'echo "<p>Environment: ${ENVIRONMENT_SUFFIX:-dev}</p>" >> /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html',
      'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html'
    );

    return userData;
  }

  private createVpcEndpoints(): void {
    // Add VPC Endpoints for AWS services
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.vpc.addInterfaceEndpoint('EC2MessagesEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
    });

    this.vpc.addInterfaceEndpoint('SSMEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
    });

    this.vpc.addInterfaceEndpoint('SSMMessagesEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
    });
  }

  private tagResources(environmentSuffix: string): void {
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'TAP');
    cdk.Tags.of(this).add('Owner', 'DevOps');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('CreatedAt', new Date().toISOString());
  }

  private createOutputs(resourceName: (name: string) => string): void {
    // Output the EC2 public IP
    new cdk.CfnOutput(this, 'EC2PublicIP', {
      value: this.instance.instancePublicIp,
      description: 'Public IP of the EC2 instance',
      exportName: resourceName('ec2-public-ip'),
    });

    // Output the VPC ID
    new cdk.CfnOutput(this, 'VPCID', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: resourceName('vpc-id'),
    });

    // Output the Security Group ID
    new cdk.CfnOutput(this, 'SecurityGroupID', {
      value: this.securityGroup.securityGroupId,
      description: 'Security Group ID',
      exportName: resourceName('security-group-id'),
    });

    // Output the Key Pair Name
    new cdk.CfnOutput(this, 'KeyPairName', {
      value: this.keyPair.keyPairName,
      description: 'Key Pair Name for SSH access',
      exportName: resourceName('key-pair-name'),
    });

    // Output the Instance ID
    new cdk.CfnOutput(this, 'InstanceID', {
      value: this.instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: resourceName('instance-id'),
    });

    // Output the Availability Zone
    new cdk.CfnOutput(this, 'AvailabilityZone', {
      value: this.instance.instanceAvailabilityZone,
      description: 'EC2 Instance Availability Zone',
      exportName: resourceName('availability-zone'),
    });
  }
}

```

```typescript 
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix,
  env: {
    region: 'us-east-1',
  },
  description: 'Production-ready VPC with EC2 instance in public subnet',
  tags: {
    Environment: environmentSuffix,
    Project: 'TAP',
    Owner: 'DevOps',
  },
});

```