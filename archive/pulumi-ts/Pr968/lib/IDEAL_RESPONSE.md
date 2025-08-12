# Secure, Self-Auditing EC2 Infrastructure with Pulumi & TypeScript

I'll create a complete Pulumi TypeScript project that provisions a hardened EC2 instance with comprehensive security monitoring and alerting capabilities.

## Project Structure

```
secure-ec2-infrastructure/
├── package.json
├── tsconfig.json
├── Pulumi.yaml
├── Pulumi.dev.yaml
└── index.ts
```

### `Pulumi.yaml`

```yaml
name: secure-ec2-infrastructure
runtime: nodejs
description: Secure, self-auditing EC2 infrastructure with real-time security monitoring
```

### `Pulumi.dev.yaml`

```yaml
config:
  aws:region: us-west-2
  secure-ec2-infrastructure:alertEmail: paul.s@turing.com
  secure-ec2-infrastructure:allowedCidr: 203.0.113.0/24
```

## Main Infrastructure Code

### `tap-stack.ts`

```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

// Import nested stacks
import { Ec2Stack } from './stacks/ec2-stack';
import { EventBridgeStack } from './stacks/eventbridge-stack';
import { SecurityGroupStack } from './stacks/security-group-stack';
import { SnsStack } from './stacks/sns-stack';
import { VpcStack } from './stacks/vpc-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * CIDR block allowed to access the web server (HTTP/HTTPS)
   * Defaults to '203.0.113.0/24' as per requirements
   */
  allowedCidr?: string;

  /**
   * EC2 instance type for the web server
   * Defaults to 't3.micro'
   */
  instanceType?: string;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 *
 * Note:
 * - DO NOT create resources directly here unless they are truly global.
 * - Use other components (e.g., VpcStack, Ec2Stack) for AWS resource definitions.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly instanceId: pulumi.Output<string>;
  public readonly instancePublicIp: pulumi.Output<string>;
  public readonly instancePrivateIp: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly eventBridgeRuleArn: pulumi.Output<string>;
  public readonly webServerUrl: pulumi.Output<string>;
  public readonly secureWebServerUrl: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args?: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'dev';
    const allowedCidr = args?.allowedCidr || '203.0.113.0/24';
    const instanceType = args?.instanceType || 't3.micro';
    const tags = args?.tags || {};

    // --- Instantiate Nested Components ---

    // 1. Create VPC infrastructure
    const vpcStack = new VpcStack(
      'tap-vpc',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 2. Create SNS for security alerts
    const snsStack = new SnsStack(
      'tap-sns',
      {
        environmentSuffix,
        tags,
        alertEmail: 'paul.s@turing.com',
      },
      { parent: this }
    );

    // 3. Create Security Group with restrictive rules
    const securityGroupStack = new SecurityGroupStack(
      'tap-security-group',
      {
        environmentSuffix,
        tags,
        vpcId: vpcStack.vpcId,
        allowedCidr,
      },
      { parent: this }
    );

    // 4. Create EventBridge monitoring for security group changes
    const eventBridgeStack = new EventBridgeStack(
      'tap-eventbridge',
      {
        environmentSuffix,
        tags,
        securityGroupId: securityGroupStack.securityGroupId,
        snsTopicArn: snsStack.topicArn,
      },
      { parent: this }
    );

    // 5. Create EC2 instance with encrypted storage
    const ec2Stack = new Ec2Stack(
      'tap-ec2',
      {
        environmentSuffix,
        tags,
        vpcId: vpcStack.vpcId,
        subnetId: vpcStack.publicSubnetId,
        securityGroupId: securityGroupStack.securityGroupId,
        instanceType,
      },
      { parent: this }
    );

    // --- Expose Outputs from Nested Components ---
    this.vpcId = vpcStack.vpcId;
    this.securityGroupId = securityGroupStack.securityGroupId;
    this.instanceId = ec2Stack.instanceId;
    this.instancePublicIp = ec2Stack.publicIp;
    this.instancePrivateIp = ec2Stack.privateIp;
    this.snsTopicArn = snsStack.topicArn;
    this.eventBridgeRuleArn = eventBridgeStack.ruleArn;
    this.webServerUrl = pulumi.interpolate`http://${ec2Stack.publicIp}`;
    this.secureWebServerUrl = pulumi.interpolate`https://${ec2Stack.publicIp}`;

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcId,
      securityGroupId: this.securityGroupId,
      instanceId: this.instanceId,
      instancePublicIp: this.instancePublicIp,
      instancePrivateIp: this.instancePrivateIp,
      snsTopicArn: this.snsTopicArn,
      eventBridgeRuleArn: this.eventBridgeRuleArn,
      webServerUrl: this.webServerUrl,
      secureWebServerUrl: this.secureWebServerUrl,
    });
  }
}
```

### `stacks/ec2-stack.ts`

```typescript
/**
 * ec2-stack.ts
 *
 * This module defines the EC2 stack for the hardened web server.
 * Creates a secure EC2 instance with encrypted storage and proper security configurations.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface Ec2StackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  subnetId: pulumi.Input<string>;
  securityGroupId: pulumi.Input<string>;
  instanceType?: string;
}

export interface Ec2StackOutputs {
  instanceId: pulumi.Output<string>;
  instanceArn: pulumi.Output<string>;
  publicIp: pulumi.Output<string>;
  privateIp: pulumi.Output<string>;
}

export class Ec2Stack extends pulumi.ComponentResource {
  public readonly instanceId: pulumi.Output<string>;
  public readonly instanceArn: pulumi.Output<string>;
  public readonly publicIp: pulumi.Output<string>;
  public readonly privateIp: pulumi.Output<string>;

  constructor(name: string, args: Ec2StackArgs, opts?: ResourceOptions) {
    super('tap:ec2:Ec2Stack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const instanceType = args.instanceType || 't3.micro';
    const tags = args.tags || {};

    // Get the latest Amazon Linux 2023 AMI
    const amiData = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['al2023-ami-*-x86_64'],
        },
        {
          name: 'architecture',
          values: ['x86_64'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
        {
          name: 'state',
          values: ['available'],
        },
      ],
    });

    // Create IAM role for EC2 instance (following principle of least privilege)
    const ec2Role = new aws.iam.Role(
      `tap-ec2-role-${environmentSuffix}`,
      {
        name: `tap-ec2-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `tap-ec2-role-${environmentSuffix}`,
          Purpose: 'EC2InstanceExecution',
          ...tags,
        },
      },
      { parent: this }
    );

    // Attach minimal required policies (CloudWatch for monitoring)
    new aws.iam.RolePolicyAttachment(
      `tap-ec2-cloudwatch-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `tap-ec2-profile-${environmentSuffix}`,
      {
        name: `tap-ec2-profile-${environmentSuffix}`,
        role: ec2Role.name,
        tags: {
          Name: `tap-ec2-profile-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // User data script for basic security hardening
    const userData = `#!/bin/bash
# Update system
yum update -y

# Install and configure CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Install security updates automatically
yum install -y yum-cron
systemctl enable yum-cron
systemctl start yum-cron

# Configure basic firewall (iptables backup)
yum install -y iptables-services
systemctl enable iptables

# Disable unnecessary services
systemctl disable postfix
systemctl stop postfix

# Set up basic security configurations
echo "net.ipv4.conf.all.send_redirects = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.send_redirects = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.all.accept_source_route = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.accept_source_route = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.all.accept_redirects = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.accept_redirects = 0" >> /etc/sysctl.conf
sysctl -p

# Install and start httpd for web server functionality
yum install -y httpd
systemctl enable httpd
systemctl start httpd

# Create a simple index page
echo "<html><body><h1>TAP Secure Web Server - ${environmentSuffix}</h1><p>Server is running securely.</p></body></html>" > /var/www/html/index.html

# Set proper permissions
chmod 644 /var/www/html/index.html
chown apache:apache /var/www/html/index.html
`;

    // Create the EC2 instance with security best practices
    const webServerInstance = new aws.ec2.Instance(
      `tap-web-server-${environmentSuffix}`,
      {
        ami: amiData.then(ami => ami.id),
        instanceType: instanceType,
        subnetId: args.subnetId,
        vpcSecurityGroupIds: [args.securityGroupId],
        iamInstanceProfile: instanceProfile.name,
        userData: Buffer.from(userData).toString('base64'),

        // Enable detailed monitoring
        monitoring: true,

        // Disable instance metadata service v1 (security best practice)
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required', // Require IMDSv2
          httpPutResponseHopLimit: 1,
        },

        // Root block device with encryption
        rootBlockDevice: {
          volumeType: 'gp3',
          volumeSize: 20,
          encrypted: true,
          deleteOnTermination: true,
          tags: {
            Name: `tap-web-server-root-${environmentSuffix}`,
            VolumeType: 'root',
            ...tags,
          },
        },

        // Additional EBS block device (example of encrypted additional storage)
        ebsBlockDevices: [
          {
            deviceName: '/dev/sdf',
            volumeType: 'gp3',
            volumeSize: 10,
            encrypted: true,
            deleteOnTermination: true,
            tags: {
              Name: `tap-web-server-data-${environmentSuffix}`,
              VolumeType: 'data',
              ...tags,
            },
          },
        ],

        tags: {
          Name: `tap-web-server-${environmentSuffix}`,
          Purpose: 'SecureWebServer',
          Environment: environmentSuffix,
          AutoStartStop: 'true', // For cost optimization
          BackupRequired: 'true',
          ...tags,
        },

        // Enable termination protection for production
        disableApiTermination: environmentSuffix === 'prod',
      },
      { parent: this }
    );

    this.instanceId = webServerInstance.id;
    this.instanceArn = webServerInstance.arn;
    this.publicIp = webServerInstance.publicIp;
    this.privateIp = webServerInstance.privateIp;

    this.registerOutputs({
      instanceId: this.instanceId,
      instanceArn: this.instanceArn,
      publicIp: this.publicIp,
      privateIp: this.privateIp,
    });
  }
}
```

### `stacks/vpc-stack.ts`

```typescript
/**
 * vpc-stack.ts
 *
 * This module defines the VpcStack component for creating a secure VPC
 * with public subnet for the EC2 infrastructure.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface VpcStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export interface VpcStackOutputs {
  vpcId: pulumi.Output<string>;
  publicSubnetId: pulumi.Output<string>;
  internetGatewayId: pulumi.Output<string>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetId: pulumi.Output<string>;
  public readonly internetGatewayId: pulumi.Output<string>;

  constructor(name: string, args: VpcStackArgs, opts?: ResourceOptions) {
    super('tap:vpc:VpcStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `tap-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `tap-vpc-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `tap-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `tap-igw-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create public subnet
    const publicSubnet = new aws.ec2.Subnet(
      `tap-public-subnet-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `tap-public-subnet-${environmentSuffix}`,
          Type: 'public',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create route table for public subnet
    const publicRouteTable = new aws.ec2.RouteTable(
      `tap-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `tap-public-rt-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Create route to internet gateway
    new aws.ec2.Route(
      `tap-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate route table with public subnet
    new aws.ec2.RouteTableAssociation(
      `tap-public-rta-${environmentSuffix}`,
      {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    this.vpcId = vpc.id;
    this.publicSubnetId = publicSubnet.id;
    this.internetGatewayId = internetGateway.id;

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetId: this.publicSubnetId,
      internetGatewayId: this.internetGatewayId,
    });
  }
}
```

### `stacks/eventbridge-stack.ts`

```typescript
/**
 * eventbridge-stack.ts
 *
 * This module defines the EventBridge stack for monitoring security group changes.
 * Creates EventBridge rules and targets to detect security group modifications.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface EventBridgeStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  securityGroupId: pulumi.Input<string>;
  snsTopicArn: pulumi.Input<string>;
}

export interface EventBridgeStackOutputs {
  ruleArn: pulumi.Output<string>;
  targetId: pulumi.Output<string>;
}

export class EventBridgeStack extends pulumi.ComponentResource {
  public readonly ruleArn: pulumi.Output<string>;
  public readonly targetId: pulumi.Output<string>;

  constructor(
    name: string,
    args: EventBridgeStackArgs,
    opts?: ResourceOptions
  ) {
    super('tap:eventbridge:EventBridgeStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create EventBridge rule to monitor security group changes
    const securityGroupMonitorRule = new aws.cloudwatch.EventRule(
      `tap-sg-monitor-rule-${environmentSuffix}`,
      {
        name: `tap-sg-monitor-rule-${environmentSuffix}`,
        description: `Monitor security group changes for TAP - ${environmentSuffix}`,

        // Event pattern to detect security group modifications
        eventPattern: pulumi.interpolate`{
        "source": ["aws.ec2"],
        "detail-type": ["AWS API Call via CloudTrail"],
        "detail": {
          "eventName": [
            "AuthorizeSecurityGroupIngress",
            "AuthorizeSecurityGroupEgress", 
            "RevokeSecurityGroupIngress",
            "RevokeSecurityGroupEgress"
          ],
          "requestParameters": {
            "groupId": ["${args.securityGroupId}"]
          }
        }
      }`,

        tags: {
          Name: `tap-sg-monitor-rule-${environmentSuffix}`,
          Purpose: 'SecurityGroupMonitoring',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create IAM role for EventBridge to publish to SNS
    const eventBridgeRole = new aws.iam.Role(
      `tap-eventbridge-role-${environmentSuffix}`,
      {
        name: `tap-eventbridge-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'events.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `tap-eventbridge-role-${environmentSuffix}`,
          Purpose: 'EventBridgeExecution',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create IAM policy for SNS publishing
    const snsPublishPolicy = new aws.iam.RolePolicy(
      `tap-eventbridge-sns-policy-${environmentSuffix}`,
      {
        name: `tap-eventbridge-sns-policy-${environmentSuffix}`,
        role: eventBridgeRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "sns:Publish"
            ],
            "Resource": "${args.snsTopicArn}"
          }
        ]
      }`,
      },
      { parent: this }
    );

    // Create EventBridge target to send alerts to SNS
    const snsTarget = new aws.cloudwatch.EventTarget(
      `tap-sg-monitor-target-${environmentSuffix}`,
      {
        rule: securityGroupMonitorRule.name,
        targetId: `tap-sg-monitor-target-${environmentSuffix}`,
        arn: args.snsTopicArn,
        roleArn: eventBridgeRole.arn,

        // Custom message for the alert
        inputTransformer: {
          inputPaths: {
            eventName: '$.detail.eventName',
            sourceIpAddress: '$.detail.sourceIPAddress',
            userIdentity: '$.detail.userIdentity.type',
            userName: '$.detail.userIdentity.userName',
            eventTime: '$.detail.eventTime',
            securityGroupId: '$.detail.requestParameters.groupId',
          },
          inputTemplate: pulumi.interpolate`{
          "alert": "SECURITY ALERT: Security Group Modified",
          "environment": "${environmentSuffix}",
          "event": "<eventName>",
          "securityGroupId": "<securityGroupId>",
          "sourceIP": "<sourceIpAddress>",
          "userType": "<userIdentity>",
          "userName": "<userName>",
          "timestamp": "<eventTime>",
          "message": "The monitored security group has been modified. Please review the changes immediately.",
          "actionRequired": "Verify if this change was authorized and complies with security policies."
        }`,
        },
      },
      { parent: this, dependsOn: [snsPublishPolicy] }
    );

    this.ruleArn = securityGroupMonitorRule.arn;
    this.targetId = snsTarget.targetId;

    this.registerOutputs({
      ruleArn: this.ruleArn,
      targetId: this.targetId,
    });
  }
}
```

### `stacks/security-group-stack.ts`

```typescript
/**
 * security-group-stack.ts
 *
 * This module defines the Security Group stack for EC2 network security.
 * Creates a restrictive security group allowing only HTTP/HTTPS from specific IP range.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface SecurityGroupStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
  allowedCidr: string;
}

export interface SecurityGroupStackOutputs {
  securityGroupId: pulumi.Output<string>;
  securityGroupArn: pulumi.Output<string>;
}

export class SecurityGroupStack extends pulumi.ComponentResource {
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly securityGroupArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecurityGroupStackArgs,
    opts?: ResourceOptions
  ) {
    super('tap:security:SecurityGroupStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create security group with restrictive rules
    const webServerSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-web-server-sg-${environmentSuffix}`,
      {
        name: `tap-web-server-sg-${environmentSuffix}`,
        description: `Security group for TAP web server - ${environmentSuffix} environment`,
        vpcId: args.vpcId,

        // Ingress rules - only allow HTTP and HTTPS from specific IP range
        ingress: [
          {
            description: 'HTTP access from restricted IP range',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: [args.allowedCidr],
          },
          {
            description: 'HTTPS access from restricted IP range',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: [args.allowedCidr],
          },
        ],

        // Egress rules - allow all outbound traffic (common practice for updates, etc.)
        egress: [
          {
            description: 'All outbound traffic',
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],

        tags: {
          Name: `tap-web-server-sg-${environmentSuffix}`,
          Purpose: 'WebServerSecurity',
          AllowedCIDR: args.allowedCidr,
          ...tags,
        },
      },
      { parent: this }
    );

    this.securityGroupId = webServerSecurityGroup.id;
    this.securityGroupArn = webServerSecurityGroup.arn;

    this.registerOutputs({
      securityGroupId: this.securityGroupId,
      securityGroupArn: this.securityGroupArn,
    });
  }
}
```

### `stacks/sns-stack.ts`

```typescript
/**
 * sns-stack.ts
 *
 * This module defines the SNS stack for security notifications.
 * Creates SNS topic and email subscription for security alerts.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface SnsStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  alertEmail: string;
}

export interface SnsStackOutputs {
  topicArn: pulumi.Output<string>;
  topicName: pulumi.Output<string>;
}

export class SnsStack extends pulumi.ComponentResource {
  public readonly topicArn: pulumi.Output<string>;
  public readonly topicName: pulumi.Output<string>;

  constructor(name: string, args: SnsStackArgs, opts?: ResourceOptions) {
    super('tap:sns:SnsStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create SNS topic for security alerts
    const securityAlertsTopic = new aws.sns.Topic(
      `tap-security-alerts-${environmentSuffix}`,
      {
        name: `tap-security-alerts-${environmentSuffix}`,
        displayName: `TAP Security Alerts - ${environmentSuffix}`,
        tags: {
          Name: `tap-security-alerts-${environmentSuffix}`,
          Purpose: 'SecurityAlerts',
          ...tags,
        },
      },
      { parent: this }
    );

    // Create email subscription
    new aws.sns.TopicSubscription(
      `tap-security-alerts-subscription-${environmentSuffix}`,
      {
        topic: securityAlertsTopic.arn,
        protocol: 'email',
        endpoint: args.alertEmail,
      },
      { parent: this }
    );

    this.topicArn = securityAlertsTopic.arn;
    this.topicName = securityAlertsTopic.name;

    this.registerOutputs({
      topicArn: this.topicArn,
      topicName: this.topicName,
    });
  }
}
```
