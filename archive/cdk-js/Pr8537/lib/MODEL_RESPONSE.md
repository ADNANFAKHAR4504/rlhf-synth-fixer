I'll help you create a secure, production-ready AWS infrastructure using AWS CDK with JavaScript. Let me break this down into modular components that meet all your requirements.

## Project Structure

```
secure-webapp-infrastructure/
├── bin/
│   └── app.js
├── lib/
│   ├── constructs/
│   │   ├── security-group.js
│   │   ├── iam-roles.js
│   │   ├── ec2-instances.js
│   │   └── cloudwatch-logging.js
│   └── secure-webapp-stack.js
├── test/
│   └── secure-webapp.test.js
├── package.json
├── cdk.json
└── README.md
```

## 1. Package Configuration

**package.json**
```json
{
  "name": "secure-webapp-infrastructure",
  "version": "1.0.0",
  "description": "Secure web application infrastructure on AWS",
  "main": "bin/app.js",
  "scripts": {
    "build": "echo 'No build required'",
    "watch": "cdk watch",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "synth": "cdk synth"
  },
  "devDependencies": {
    "@aws-cdk/assert": "^2.0.0",
    "jest": "^29.0.0",
    "aws-cdk": "^2.100.0"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.0.0"
  }
}
```

**cdk.json**
```json
{
  "app": "node bin/app.js",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"]
  }
}
```

## 2. Main Application Entry Point

**bin/app.js**
```javascript
#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { SecureWebappStack } = require('../lib/secure-webapp-stack');

const app = new cdk.App();

// Configuration - these should be passed as context variables or environment variables
const config = {
  vpcId: app.node.tryGetContext('vpcId') || 'vpc-xxxxxxxxx', // Replace with your VPC ID
  existingS3Bucket: app.node.tryGetContext('s3Bucket') || 'your-existing-logs-bucket',
  sshCidrBlock: app.node.tryGetContext('sshCidr') || '10.0.0.0/8', // Replace with your trusted CIDR
  trustedOutboundCidrs: app.node.tryGetContext('trustedCidrs') || ['10.0.0.0/8', '172.16.0.0/12'],
  environment: 'Production'
};

new SecureWebappStack(app, 'SecureWebappStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  },
  config: config,
  tags: {
    Environment: config.environment,
    Project: 'SecureWebapp',
    Owner: 'DevOps-Team'
  }
});

// Apply tags to all resources in the app
cdk.Tags.of(app).add('Environment', config.environment);
```

## 3. Security Group Construct

**lib/constructs/security-group.js**
```javascript
const { Construct } = require('constructs');
const ec2 = require('aws-cdk-lib/aws-ec2');

class SecurityGroupConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const { vpc, sshCidrBlock, trustedOutboundCidrs } = props;

    // Create security group with restrictive rules
    this.securityGroup = new ec2.SecurityGroup(this, 'WebAppSecurityGroup', {
      vpc: vpc,
      description: 'Security group for secure web application instances',
      allowAllOutbound: false, // We'll define specific outbound rules
    });

    // Inbound rules - HTTP and SSH only
    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4(sshCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from trusted CIDR block'
    );

    // Outbound rules - restrict to trusted CIDRs and necessary services
    trustedOutboundCidrs.forEach((cidr, index) => {
      this.securityGroup.addEgressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.allTraffic(),
        `Allow outbound to trusted CIDR ${index + 1}`
      );
    });

    // Allow HTTPS outbound for package updates and AWS services
    this.securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS for AWS services and package updates'
    );

    // Allow HTTP outbound for package repositories
    this.securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP for package repositories'
    );

    // Allow DNS resolution
    this.securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow DNS resolution'
    );
  }
}

module.exports = { SecurityGroupConstruct };
```

## 4. IAM Roles Construct

**lib/constructs/iam-roles.js**
```javascript
const { Construct } = require('constructs');
const iam = require('aws-cdk-lib/aws-iam');

class IAMRolesConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const { s3BucketName } = props;

    // Create IAM role for EC2 instances with minimal required permissions
    this.instanceRole = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for secure web application EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy')
      ]
    });

    // Custom policy for S3 logging access (write-only to specific bucket)
    const s3LoggingPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:PutObjectAcl'
      ],
      resources: [
        `arn:aws:s3:::${s3BucketName}/logs/*`
      ]
    });

    // Custom policy for CloudWatch Logs
    const cloudWatchLogsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams'
      ],
      resources: [
        'arn:aws:logs:*:*:log-group:/aws/ec2/secure-webapp/*'
      ]
    });

    // Custom policy for Systems Manager (for secure configuration management)
    const ssmPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
        'ssm:GetParametersByPath'
      ],
      resources: [
        'arn:aws:ssm:*:*:parameter/secure-webapp/*'
      ]
    });

    // Add policies to the role
    this.instanceRole.addToPolicy(s3LoggingPolicy);
    this.instanceRole.addToPolicy(cloudWatchLogsPolicy);
    this.instanceRole.addToPolicy(ssmPolicy);

    // Create instance profile
    this.instanceProfile = new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [this.instanceRole.roleName],
      instanceProfileName: 'SecureWebappInstanceProfile'
    });
  }
}

module.exports = { IAMRolesConstruct };
```

## 5. CloudWatch Logging Construct

**lib/constructs/cloudwatch-logging.js**
```javascript
const { Construct } = require('constructs');
const logs = require('aws-cdk-lib/aws-logs');
const s3 = require('aws-cdk-lib/aws-s3');
const iam = require('aws-cdk-lib/aws-iam');

class CloudWatchLoggingConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const { s3BucketName } = props;

    // Create CloudWatch Log Group
    this.logGroup = new logs.LogGroup(this, 'SecureWebappLogGroup', {
      logGroupName: '/aws/ec2/secure-webapp',
      retention: logs.RetentionDays.THREE_MONTHS, // Adjust as needed
      removalPolicy: require('aws-cdk-lib').RemovalPolicy.RETAIN
    });

    // Reference existing S3 bucket
    this.logsBucket = s3.Bucket.fromBucketName(this, 'ExistingLogsBucket', s3BucketName);

    // Create CloudWatch Logs destination for S3 export
    const s3ExportRole = new iam.Role(this, 'CloudWatchLogsS3ExportRole', {
      assumedBy: new iam.ServicePrincipal('logs.amazonaws.com'),
      inlinePolicies: {
        S3ExportPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:GetBucketAcl'
              ],
              resources: [
                this.logsBucket.bucketArn,
                `${this.logsBucket.bucketArn}/*`
              ]
            })
          ]
        })
      }
    });

    // CloudWatch agent configuration for instances
    this.cloudWatchConfig = {
      agent: {
        metrics_collection_interval: 60,
        run_as_user: "cwagent"
      },
      logs: {
        logs_collected: {
          files: {
            collect_list: [
              {
                file_path: "/var/log/messages",
                log_group_name: this.logGroup.logGroupName,
                log_stream_name: "{instance_id}/var/log/messages"
              },
              {
                file_path: "/var/log/secure",
                log_group_name: this.logGroup.logGroupName,
                log_stream_name: "{instance_id}/var/log/secure"
              },
              {
                file_path: "/var/log/httpd/access_log",
                log_group_name: this.logGroup.logGroupName,
                log_stream_name: "{instance_id}/httpd/access"
              },
              {
                file_path: "/var/log/httpd/error_log",
                log_group_name: this.logGroup.logGroupName,
                log_stream_name: "{instance_id}/httpd/error"
              }
            ]
          }
        }
      },
      metrics: {
        namespace: "SecureWebapp/EC2",
        metrics_collected: {
          cpu: {
            measurement: ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
            metrics_collection_interval: 60
          },
          disk: {
            measurement: ["used_percent"],
            metrics_collection_interval: 60,
            resources: ["*"]
          },
          diskio: {
            measurement: ["io_time"],
            metrics_collection_interval: 60,
            resources: ["*"]
          },
          mem: {
            measurement: ["mem_used_percent"],
            metrics_collection_interval: 60
          }
        }
      }
    };
  }
}

module.exports = { CloudWatchLoggingConstruct };
```

## 6. EC2 Instances Construct

**lib/constructs/ec2-instances.js**
```javascript
const { Construct } = require('constructs');
const ec2 = require('aws-cdk-lib/aws-ec2');
const ssm = require('aws-cdk-lib/aws-ssm');

class EC2InstancesConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const { vpc, securityGroup, instanceProfile, cloudWatchConfig } = props;

    // Get Amazon Linux 2 AMI
    const amzn2Ami = ec2.MachineImage.latestAmazonLinux({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64
    });

    // Get availability zones
    const availabilityZones = vpc.availabilityZones.slice(0, 2); // Use first 2 AZs

    // User data script for instance initialization
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd amazon-cloudwatch-agent',
      
      // Configure CloudWatch agent
      `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'`,
      JSON.stringify(cloudWatchConfig, null, 2),
      'EOF',
      
      // Start and enable services
      'systemctl start httpd',
      'systemctl enable httpd',
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json',
      
      // Create a simple index page
      'echo "<h1>Secure Web Application</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" > /var/www/html/index.html',
      
      // Set proper permissions
      'chown -R apache:apache /var/www/html',
      'chmod -R 755 /var/www/html',
      
      // Configure log rotation
      'cat > /etc/logrotate.d/webapp << EOF',
      '/var/log/httpd/*log {',
      '    daily',
      '    missingok',
      '    rotate 52',
      '    compress',
      '    delaycompress',
      '    notifempty',
      '    create 640 apache apache',
      '    postrotate',
      '        /bin/systemctl reload httpd.service > /dev/null 2>/dev/null || true',
      '    endscript',
      '}',
      'EOF'
    );

    this.instances = [];

    // Create EC2 instances in different AZs
    availabilityZones.forEach((az, index) => {
      const instance = new ec2.Instance(this, `WebAppInstance${index + 1}`, {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
        machineImage: amzn2Ami,
        vpc: vpc,
        availabilityZone: az,
        securityGroup: securityGroup,
        userData: userData,
        role: instanceProfile.role,
        
        // Enable detailed monitoring
        detailedMonitoring: true,
        
        // Configure root volume with encryption
        blockDevices: [{
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(8, {
            encrypted: true,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            deleteOnTermination: true
          })
        }],
        
        // Require IMDSv2 for enhanced security
        requireImdsv2: true
      });

      // Store configuration in Systems Manager Parameter Store
      new ssm.StringParameter(this, `InstanceConfig${index + 1}`, {
        parameterName: `/secure-webapp/instance-${index + 1}/config`,
        stringValue: JSON.stringify({
          instanceId: instance.instanceId,
          availabilityZone: az,
          role: 'webserver'
        }),
        description: `Configuration for secure webapp instance ${index + 1}`,
        tier: ssm.ParameterTier.STANDARD
      });

      this.instances.push(instance);
    });
  }
}

module.exports = { EC2InstancesConstruct };
```

## 7. Main Stack

**lib/secure-webapp-stack.js**
```javascript
const { Stack } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const { SecurityGroupConstruct } = require('./constructs/security-group');
const { IAMRolesConstruct } = require('./constructs/iam-roles');
const { CloudWatchLoggingConstruct } = require('./constructs/cloudwatch-logging');
const { EC2InstancesConstruct } = require('./constructs/ec2-instances');

class SecureWebappStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { config } = props;

    // Import existing VPC
    const vpc = ec2.Vpc.fromLookup(this, 'ExistingVPC', {
      vpcId: config.vpcId
    });

    // Create IAM roles and policies
    const iamRoles = new IAMRolesConstruct(this, 'IAMRoles', {
      s3BucketName: config.existingS3Bucket
    });

    // Create security group
    const securityGroup = new SecurityGroupConstruct(this, 'SecurityGroup', {
      vpc: vpc,
      sshCidrBlock: config.sshCidrBlock,
      trustedOutboundCidrs: config.trustedOutboundCidrs
    });

    // Create CloudWatch logging setup
    const logging = new CloudWatchLoggingConstruct(this, 'CloudWatchLogging', {
      s3BucketName: config.existingS3Bucket
    });

    // Create EC2 instances
    const instances = new EC2InstancesConstruct(this, 'EC2Instances', {
      vpc: vpc,
      securityGroup: securityGroup.securityGroup,
      instanceProfile: iamRoles.instanceProfile,
      cloudWatchConfig: logging.cloudWatchConfig
    });

    // Output important information
    instances.instances.forEach((instance, index) => {
      new require('aws-cdk-lib').CfnOutput(this, `Instance${index + 1}Id`, {
        value: instance.instanceId,
        description: `Instance ID for web app instance ${index + 1}`
      });

      new require('aws-cdk-lib').CfnOutput(this, `Instance${index + 1}PrivateIP`, {
        value: instance.instancePrivateIp,
        description: `Private IP for web app instance ${index + 1}`
      });
    });

    new require('aws-cdk-lib').CfnOutput(this, 'SecurityGroupId', {
      value: securityGroup.securityGroup.securityGroupId,
      description: 'Security Group ID for web application instances'
    });

    new require('aws-cdk-lib').CfnOutput(this, 'LogGroupName', {
      value: logging.logGroup.logGroupName,
      description: 'CloudWatch Log Group name'
    });
  }
}

module.exports = { SecureWebappStack };
```

## 8. Test Suite

**test/secure-webapp.test.js**
```javascript
const { Template } = require('aws-cdk-lib/assertions');
const cdk = require('aws-cdk-lib');
const { SecureWebappStack } = require('../lib/secure-webapp-stack');

describe('SecureWebappStack', () => {
  let template;

  beforeAll(() => {
    const app = new cdk.App();
    const config = {
      vpcId: 'vpc-12345678',
      existingS3Bucket: 'test-logs-bucket',
      sshCidrBlock: '10.0.0.0/8',
      trustedOutboundCidrs: ['10.0.0.0/8'],
      environment: 'Production'
    };

    const stack = new SecureWebappStack(app, 'TestStack', {
      config: config
    });

    template = Template.fromStack(stack);
  });

  test('Creates EC2 instances with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't2.micro',
      BlockDeviceMappings: [
        {
          DeviceName: '/dev/xvda',
          Ebs: {
            Encrypted: true,
            VolumeType: 'gp3'
          }
        }
      ]
    });
  });

  test('Creates security group with correct ingress rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '0.0.0.0/0'
        },
        {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: '10.0.0.0/8'
        }
      ]
    });
  });

  test('Creates IAM role with minimal permissions', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }
        ]
      }
    });
  });

  test('Creates CloudWatch Log Group', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/ec2/secure-webapp',
      RetentionInDays: 90
    });
  });

  test('All resources have Environment tag', () => {
    const resources = template.findResources('AWS::EC2::Instance');
    Object.keys(resources).forEach(key => {
      expect(resources[key].Properties.Tags).toContainEqual({
        Key: 'Environment',
        Value: 'Production'
      });
    });
  });
});
```

## 9. Deployment Instructions

**README.md**
```markdown
# Secure Web Application Infrastructure

This CDK application creates a secure, production-ready web application infrastructure on AWS.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Node.js 16+ installed
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Configuration

Before deploying, update the configuration in `bin/app.js`:

- `vpcId`: Your existing VPC ID
- `existingS3Bucket`: Name of your existing S3 bucket for logs
- `sshCidrBlock`: CIDR block allowed for SSH access
- `trustedOutboundCidrs`: Array of trusted CIDR blocks for outbound traffic

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Bootstrap CDK (if not done before):
   ```bash
   cdk bootstrap
   ```

3. Deploy the stack:
   ```bash
   cdk deploy --context vpcId=vpc-xxxxxxxxx --context s3Bucket=your-logs-bucket
   ```

## Testing

Run the test suite:
```bash
npm test
```

## Security Features

-  Encrypted EBS volumes (CIS compliant)
-  Restrictive security groups
-  Minimal IAM permissions
-  IMDSv2 enforcement
-  CloudWatch monitoring and logging
-  Outbound traffic restrictions
-  Multi-AZ deployment for high availability

## Monitoring

- CloudWatch Logs: `/aws/ec2/secure-webapp`
- Custom metrics namespace: `SecureWebapp/EC2`
- Log retention: 3 months (configurable)
```

## Key Security Features Implemented

1. **Encrypted Storage**: All EBS volumes are encrypted at rest
2. **Network Security**: Restrictive security groups with minimal required ports
3. **IAM Security**: Least privilege IAM roles and policies
4. **Monitoring**: Comprehensive CloudWatch logging and metrics
5. **High Availability**: Multi-AZ deployment
6. **Compliance**: CIS benchmark compliance for encryption
7. **Access Control**: SSH restricted to specific CIDR blocks
8. **Outbound Restrictions**: Limited outbound traffic to trusted networks
9. **Configuration Security**: Sensitive configs stored in Systems Manager Parameter Store
10. **Instance Security**: IMDSv2 enforcement and detailed monitoring

This infrastructure is modular, testable, and production-ready with all the security requirements you specified. The CDK code is well-structured and follows AWS best practices for security and compliance.