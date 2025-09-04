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

### `index.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Configuration
const config = new pulumi.Config();
const alertEmail = config.require('alertEmail');
const allowedCidr = config.require('allowedCidr');
const region = 'us-west-2';

// Tags for all resources
const commonTags = {
  Project: 'SecureWebServer',
  Environment: 'Production',
  Owner: 'DevSecOps',
  Compliance: 'Required',
  CreatedBy: 'Pulumi',
};

// ============================================================================
// VPC INFRASTRUCTURE
// ============================================================================

// Create a new VPC for our secure infrastructure
const vpc = new aws.ec2.Vpc('secure-vpc', {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    ...commonTags,
    Name: 'SecureWebServer-VPC',
  },
});

// Internet Gateway for public subnet connectivity
const igw = new aws.ec2.InternetGateway('secure-igw', {
  vpcId: vpc.id,
  tags: {
    ...commonTags,
    Name: 'SecureWebServer-IGW',
  },
});

// Public subnet for the EC2 instance
const publicSubnet = new aws.ec2.Subnet('secure-public-subnet', {
  vpcId: vpc.id,
  cidrBlock: '10.0.1.0/24',
  availabilityZone: `${region}a`,
  mapPublicIpOnLaunch: true,
  tags: {
    ...commonTags,
    Name: 'SecureWebServer-PublicSubnet',
    Type: 'Public',
  },
});

// Route table for public subnet
const publicRouteTable = new aws.ec2.RouteTable('secure-public-rt', {
  vpcId: vpc.id,
  routes: [
    {
      cidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    },
  ],
  tags: {
    ...commonTags,
    Name: 'SecureWebServer-PublicRT',
  },
});

// Associate route table with public subnet
const publicRouteTableAssociation = new aws.ec2.RouteTableAssociation(
  'secure-public-rta',
  {
    subnetId: publicSubnet.id,
    routeTableId: publicRouteTable.id,
  }
);

// ============================================================================
// SNS NOTIFICATION SYSTEM
// ============================================================================

// SNS Topic for security alerts - The Alerting Endpoint
const securityAlertTopic = new aws.sns.Topic('security-alert-topic', {
  name: 'SecurityGroupChangeAlerts',
  displayName: 'Security Group Change Alerts',
  tags: {
    ...commonTags,
    Purpose: 'SecurityAlerting',
  },
});

// SNS Topic Subscription for email notifications
const emailSubscription = new aws.sns.TopicSubscription(
  'security-alert-email',
  {
    topicArn: securityAlertTopic.arn,
    protocol: 'email',
    endpoint: alertEmail,
  }
);

// ============================================================================
// SECURITY GROUP - THE NETWORK FIREWALL
// ============================================================================

// Dedicated Security Group with strict ingress rules
const webServerSecurityGroup = new aws.ec2.SecurityGroup('web-server-sg', {
  name: 'secure-web-server-sg',
  description:
    'Hardened security group for critical web server - HTTP/HTTPS only from specific CIDR',
  vpcId: vpc.id,

  // Ingress rules: ONLY HTTP and HTTPS from specified IP range
  ingress: [
    {
      description: 'HTTP from authorized IP range',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: [allowedCidr],
    },
    {
      description: 'HTTPS from authorized IP range',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: [allowedCidr],
    },
  ],

  // Egress rules: Allow all outbound (can be restricted further if needed)
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
    ...commonTags,
    Name: 'SecureWebServer-SG',
    SecurityLevel: 'Critical',
    MonitoringEnabled: 'true',
  },
});

// ============================================================================
// EVENT-DRIVEN MONITORING - THE CORE CONNECTION
// ============================================================================

// EventBridge Rule to detect Security Group changes
const securityGroupMonitoringRule = new aws.cloudwatch.EventRule(
  'sg-change-monitor',
  {
    name: 'SecurityGroupChangeDetector',
    description: 'Monitors changes to the critical web server security group',

    // Event pattern to capture security group modifications
    eventPattern: pulumi.jsonStringify({
      source: ['aws.ec2'],
      'detail-type': ['AWS API Call via CloudTrail'],
      detail: {
        eventName: [
          'AuthorizeSecurityGroupIngress',
          'AuthorizeSecurityGroupEgress',
          'RevokeSecurityGroupIngress',
          'RevokeSecurityGroupEgress',
        ],
        // Filter for changes to our specific security group
        requestParameters: {
          groupId: [webServerSecurityGroup.id],
        },
      },
    }),

    tags: {
      ...commonTags,
      Purpose: 'SecurityMonitoring',
      AlertLevel: 'Critical',
    },
  }
);

// EventBridge Target to connect the rule to SNS
const eventBridgeTarget = new aws.cloudwatch.EventTarget('sg-alert-target', {
  rule: securityGroupMonitoringRule.name,
  targetId: 'SecurityGroupAlertTarget',
  arn: securityAlertTopic.arn,

  // Transform the CloudTrail event into a readable alert message
  inputTransformer: {
    inputPaths: {
      account: '$.account',
      region: '$.region',
      time: '$.time',
      user: '$.detail.userIdentity.type',
      userName: '$.detail.userIdentity.userName',
      eventName: '$.detail.eventName',
      sourceIP: '$.detail.sourceIPAddress',
      groupId: '$.detail.requestParameters.groupId',
    },
    inputTemplate: pulumi.interpolate`{
            "alert_type": "SECURITY_GROUP_CHANGE",
            "severity": "CRITICAL",
            "timestamp": "<time>",
            "account_id": "<account>",
            "region": "<region>",
            "event_name": "<eventName>",
            "security_group_id": "<groupId>",
            "user_type": "<user>",
            "user_name": "<userName>",
            "source_ip": "<sourceIP>",
            "message": "🚨 CRITICAL SECURITY ALERT 🚨\\n\\nUnauthorized change detected to security group ${webServerSecurityGroup.id}\\n\\nEvent: <eventName>\\nUser: <userName> (<user>)\\nSource IP: <sourceIP>\\nTime: <time>\\nAccount: <account>\\nRegion: <region>\\n\\nIMMEDIATE ACTION REQUIRED: Review and validate this change immediately."
        }`,
  },
});

// Grant SNS permission to EventBridge
const snsTopicPolicy = new aws.sns.TopicPolicy('security-alert-policy', {
  arn: securityAlertTopic.arn,
  policy: pulumi.all([securityAlertTopic.arn]).apply(([topicArn]) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AllowEventBridgePublish',
          Effect: 'Allow',
          Principal: {
            Service: 'events.amazonaws.com',
          },
          Action: 'SNS:Publish',
          Resource: topicArn,
        },
      ],
    })
  ),
});

// ============================================================================
// EC2 INSTANCE - THE HARDENED COMPUTE
// ============================================================================

// Get the latest Amazon Linux 2 AMI
const amiId = aws.ec2.getAmi({
  mostRecent: true,
  owners: ['amazon'],
  filters: [
    {
      name: 'name',
      values: ['amzn2-ami-hvm-*-x86_64-gp2'],
    },
    {
      name: 'virtualization-type',
      values: ['hvm'],
    },
  ],
});

// User data script for basic web server setup
const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple secure landing page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Secure Web Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { color: #28a745; font-weight: bold; }
        .security { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔒 Secure Web Server</h1>
        <p class="status">✅ Server Status: Online and Secure</p>
        <p class="security">🛡️ Security Features Active:</p>
        <ul>
            <li>Encrypted storage volumes</li>
            <li>Restricted network access (203.0.113.0/24 only)</li>
            <li>Real-time security monitoring</li>
            <li>Automated change detection and alerting</li>
        </ul>
        <p><small>Deployed with Pulumi + TypeScript | Infrastructure as Code</small></p>
    </div>
</body>
</html>
EOF

# Set proper permissions
chown apache:apache /var/www/html/index.html
chmod 644 /var/www/html/index.html
`;

// Hardened EC2 Instance with encryption and security monitoring
const secureWebServer = new aws.ec2.Instance('secure-web-server', {
  ami: amiId.then(ami => ami.id),
  instanceType: 't3.micro',
  subnetId: publicSubnet.id,
  vpcSecurityGroupIds: [webServerSecurityGroup.id],
  userData: Buffer.from(userData).toString('base64'),

  // Root block device with mandatory encryption
  rootBlockDevice: {
    volumeType: 'gp3',
    volumeSize: 20,
    encrypted: true, // Explicit encryption for compliance
    deleteOnTermination: true,
    tags: {
      ...commonTags,
      Name: 'SecureWebServer-RootVolume',
      Encrypted: 'true',
    },
  },

  // Additional EBS block device (if needed) - also encrypted
  ebsBlockDevices: [
    {
      deviceName: '/dev/sdf',
      volumeType: 'gp3',
      volumeSize: 10,
      encrypted: true, // Explicit encryption for compliance
      deleteOnTermination: true,
      tags: {
        ...commonTags,
        Name: 'SecureWebServer-DataVolume',
        Encrypted: 'true',
      },
    },
  ],

  // Instance metadata service configuration (IMDSv2 only for security)
  metadataOptions: {
    httpEndpoint: 'enabled',
    httpTokens: 'required', // Require IMDSv2
    httpPutResponseHopLimit: 1,
  },

  tags: {
    ...commonTags,
    Name: 'SecureWebServer-Instance',
    Role: 'WebServer',
    SecurityLevel: 'Critical',
    MonitoringEnabled: 'true',
    EncryptionEnabled: 'true',
  },
});

// ============================================================================
// OUTPUTS
// ============================================================================

export const vpcId = vpc.id;
export const subnetId = publicSubnet.id;
export const securityGroupId = webServerSecurityGroup.id;
export const instanceId = secureWebServer.id;
export const instancePublicIp = secureWebServer.publicIp;
export const instancePublicDns = secureWebServer.publicDns;
export const snsTopicArn = securityAlertTopic.arn;
export const eventRuleName = securityGroupMonitoringRule.name;

// Security summary
export const securitySummary = pulumi.interpolate`
🔒 SECURITY CONFIGURATION SUMMARY:

✅ Network Security:
   - Security Group: ${securityGroupId}
   - Allowed Traffic: HTTP/HTTPS from ${allowedCidr} only
   - All other inbound traffic: DENIED

✅ Storage Security:
   - Root volume encryption: ENABLED
   - Data volume encryption: ENABLED
   - Volume type: GP3 (latest generation)

✅ Monitoring & Alerting:
   - EventBridge monitoring: ACTIVE
   - SNS alerts to: ${alertEmail}
   - Real-time change detection: ENABLED

✅ Instance Security:
   - IMDSv2 required: ENABLED
   - Security group changes monitored: YES
   - Automated alerting: CONFIGURED

🌐 Access Information:
   - Public IP: ${secureWebServer.publicIp}
   - Public DNS: ${secureWebServer.publicDns}
   - Access URLs: 
     * http://${secureWebServer.publicDns}
     * https://${secureWebServer.publicDns}

⚠️  IMPORTANT SECURITY NOTES:
   - Only IP range ${allowedCidr} can access this server
   - Any security group changes will trigger email alerts
   - All storage volumes are encrypted at rest
   - CloudTrail must be enabled for change detection to work
`;

// Best practice note about EBS encryption
export const encryptionBestPractice = `
💡 ENCRYPTION BEST PRACTICE NOTE:

While this infrastructure explicitly configures encrypted: true for all EBS volumes,
the modern best practice is to enable EBS encryption by default at the AWS account/region level.

This can be done via:
- AWS Console: EC2 > Account Attributes > EBS encryption
- AWS CLI: aws ec2 enable-ebs-encryption-by-default --region us-west-2
- Terraform/Pulumi: aws.ebs.EncryptionByDefault resource

When enabled at the account level, all new EBS volumes are automatically encrypted,
providing defense-in-depth without requiring explicit configuration in each resource.
`;
```

## Deployment Instructions

1. **Initialize the project:**

```bash
mkdir secure-ec2-infrastructure
cd secure-ec2-infrastructure
npm install
```

2. **Configure Pulumi:**

```bash
pulumi stack init dev
pulumi config set aws:region us-west-2
pulumi config set secure-ec2-infrastructure:alertEmail paul.s@turing.com
pulumi config set secure-ec2-infrastructure:allowedCidr 203.0.113.0/24
```

3. **Deploy the infrastructure:**

```bash
pulumi up
```

## Key Security Features Implemented

### ✅ **Security Group Lockdown**

- Ingress rules restricted to HTTP (80) and HTTPS (443) only
- Traffic allowed exclusively from `203.0.113.0/24` CIDR range
- All other inbound traffic explicitly denied

### ✅ **Mandatory Volume Encryption**

- Root block device: `encrypted: true`
- Additional EBS volumes: `encrypted: true`
- GP3 volume type for latest performance and security

### ✅ **Real-time Change Auditing**

- EventBridge rule monitors specific security group changes
- Filters for: `AuthorizeSecurityGroupIngress`, `AuthorizeSecurityGroupEgress`, `RevokeSecurityGroupIngress`, `RevokeSecurityGroupEgress`
- Event pattern includes specific security group ID for precise monitoring

### ✅ **Automated Email Notification**

- SNS topic with email subscription to `paul.s@turing.com`
- EventBridge target transforms CloudTrail events into readable alerts
- Comprehensive alert message includes user, IP, timestamp, and action details

## Architecture Benefits

1. **Defense in Depth**: Multiple security layers from network to storage
2. **Immutable Infrastructure**: All resources defined as code
3. **Continuous Monitoring**: Real-time detection of security changes
4. **Automated Response**: Immediate alerting for unauthorized modifications
5. **Compliance Ready**: Encrypted storage and audit trails
6. **Production Hardened**: IMDSv2, minimal attack surface, comprehensive tagging

This infrastructure provides enterprise-grade security with automated monitoring and alerting, ensuring any unauthorized changes to the security posture are immediately detected and reported.
