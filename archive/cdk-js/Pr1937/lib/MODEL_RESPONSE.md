I'll create a comprehensive AWS CDK application for a service discovery system. Here's the complete project structure and implementation:

## Project Structure

```
service-discovery-cdk/
├── package.json
├── cdk.json
├── app.js
├── lib/
│   └── service-discovery-stack.js
└── README.md
```

## package.json

```json
{
  "name": "service-discovery-cdk",
  "version": "1.0.0",
  "description": "AWS CDK Service Discovery System",
  "main": "app.js",
  "scripts": {
    "build": "echo 'No build required'",
    "watch": "cdk watch",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy",
    "synth": "cdk synth",
    "diff": "cdk diff"
  },
  "devDependencies": {
    "aws-cdk": "^2.100.0",
    "jest": "^29.5.0"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.3.0"
  }
}
```

## cdk.json

```json
{
  "app": "node app.js",
  "watch": {
    "include": ["**"],
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
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:baseEnvironmentVariables": true,
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "appName": "service-discovery",
    "vpcCidrBlock": "10.0.0.0/16",
    "enableHttps": false,
    "domainName": null
  }
}
```

## app.js

```javascript
#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { ServiceDiscoveryStack } = require('./lib/service-discovery-stack');

const app = new cdk.App();

// Read context values with defaults
const appName = app.node.tryGetContext('appName') || 'service-discovery';
const vpcCidrBlock = app.node.tryGetContext('vpcCidrBlock') || '10.0.0.0/16';
const enableHttps = app.node.tryGetContext('enableHttps') || false;
const domainName = app.node.tryGetContext('domainName') || null;

// Validate context
if (enableHttps && !domainName) {
  throw new Error('domainName must be provided when enableHttps is true');
}

new ServiceDiscoveryStack(app, `${appName}-stack`, {
  appName,
  vpcCidrBlock,
  enableHttps,
  domainName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Service Discovery System with AWS Cloud Map and ALB',
});

app.synth();
```

## lib/service-discovery-stack.js

```javascript
const { Stack, Duration, RemovalPolicy, CfnOutput } = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const elbv2 = require('aws-cdk-lib/aws-elasticloadbalancingv2');
const s3 = require('aws-cdk-lib/aws-s3');
const kms = require('aws-cdk-lib/aws-kms');
const ssm = require('aws-cdk-lib/aws-ssm');
const iam = require('aws-cdk-lib/aws-iam');
const servicediscovery = require('aws-cdk-lib/aws-servicediscovery');
const acm = require('aws-cdk-lib/aws-certificatemanager');
const route53 = require('aws-cdk-lib/aws-route53');

class ServiceDiscoveryStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { appName, vpcCidrBlock, enableHttps, domainName } = props;

    // ======================
    // Security Foundation
    // ======================

    // AWS Managed KMS Key for encryption
    const kmsKey = new kms.Key(this, 'ServiceDiscoveryKey', {
      description: `KMS Key for ${appName} service discovery encryption`,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY, // Use RETAIN for production
    });

    // KMS Key Alias for easier reference
    const kmsKeyAlias = new kms.Alias(this, 'ServiceDiscoveryKeyAlias', {
      aliasName: `alias/${appName}-service-discovery`,
      targetKey: kmsKey,
    });

    // Parameter Store SecureString
    const secureParameter = new ssm.StringParameter(
      this,
      'ServiceDiscoveryConfig',
      {
        parameterName: `/${appName}/service-discovery/config`,
        stringValue: JSON.stringify({
          environment: 'production',
          serviceDiscoveryEnabled: true,
          healthCheckInterval: 30,
          maxRetries: 3,
        }),
        type: ssm.ParameterType.SECURE_STRING,
        keyId: kmsKey,
        description: 'Service discovery configuration parameters',
      }
    );

    // ======================
    // VPC and Networking
    // ======================

    // Create VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'ServiceDiscoveryVPC', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidrBlock),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // S3 bucket for VPC Flow Logs (encrypted)
    const flowLogsBucket = new s3.Bucket(this, 'VPCFlowLogsBucket', {
      bucketName: `${appName}-vpc-flow-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: Duration.days(90),
          noncurrentVersionExpiration: Duration.days(30),
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY, // Use RETAIN for production
    });

    // VPC Flow Logs
    new ec2.FlowLog(this, 'VPCFlowLogs', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toS3(flowLogsBucket),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Default Network ACL with restrictive rules
    const networkAcl = new ec2.NetworkAcl(this, 'RestrictiveNetworkAcl', {
      vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Allow HTTP traffic within VPC
    networkAcl.addEntry('AllowInboundHTTP', {
      ruleNumber: 100,
      cidr: ec2.AclCidr.ipv4(vpcCidrBlock),
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow HTTPS traffic within VPC
    networkAcl.addEntry('AllowInboundHTTPS', {
      ruleNumber: 110,
      cidr: ec2.AclCidr.ipv4(vpcCidrBlock),
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow outbound traffic
    networkAcl.addEntry('AllowOutboundAll', {
      ruleNumber: 100,
      cidr: ec2.AclCidr.anyIpv4(),
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow ephemeral ports for return traffic
    networkAcl.addEntry('AllowInboundEphemeral', {
      ruleNumber: 120,
      cidr: ec2.AclCidr.anyIpv4(),
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // ======================
    // Load Balancer Setup
    // ======================

    // S3 bucket for ALB access logs (encrypted)
    const albLogsBucket = new s3.Bucket(this, 'ALBAccessLogsBucket', {
      bucketName: `${appName}-alb-access-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: Duration.days(30),
          noncurrentVersionExpiration: Duration.days(7),
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY, // Use RETAIN for production
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for internal ALB',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic from within VPC
    albSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpcCidrBlock),
      ec2.Port.tcp(80),
      'Allow HTTP from VPC'
    );

    // Allow HTTPS traffic from within VPC if enabled
    if (enableHttps) {
      albSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(vpcCidrBlock),
        ec2.Port.tcp(443),
        'Allow HTTPS from VPC'
      );
    }

    // Internal Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'InternalALB', {
      vpc,
      internetFacing: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroup: albSecurityGroup,
      loadBalancerName: `${appName}-internal-alb`,
    });

    // Enable ALB access logging
    alb.logAccessLogs(albLogsBucket, `${appName}-alb-logs`);

    // Default target group (placeholder)
    const defaultTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'DefaultTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: Duration.seconds(30),
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          timeout: Duration.seconds(5),
          unhealthyThresholdCount: 3,
        },
      }
    );

    // HTTP Listener
    const httpListener = alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [defaultTargetGroup],
    });

    let certificate;
    let httpsListener;

    // HTTPS Setup (conditional)
    if (enableHttps && domainName) {
      // Create ACM Certificate with DNS validation
      certificate = new acm.Certificate(this, 'ALBCertificate', {
        domainName: domainName,
        validation: acm.CertificateValidation.fromDns(),
      });

      // HTTPS Listener
      httpsListener = alb.addListener('HTTPSListener', {
        port: 443,
        protocol: elbv2.ApplicationProtocol.HTTPS,
        certificates: [certificate],
        defaultTargetGroups: [defaultTargetGroup],
        sslPolicy: elbv2.SslPolicy.TLS12_EXT,
      });
    }

    // ======================
    // Service Discovery with AWS Cloud Map
    // ======================

    // Private DNS Namespace
    const privateNamespace = new servicediscovery.PrivateDnsNamespace(
      this,
      'ServiceDiscoveryNamespace',
      {
        name: `${appName}.local`,
        vpc,
        description: `Private DNS namespace for ${appName} service discovery`,
      }
    );

    // Cloud Map Service
    const cloudMapService = new servicediscovery.Service(
      this,
      'CloudMapService',
      {
        namespace: privateNamespace,
        name: 'api-gateway',
        description: 'Service discovery for internal API gateway',
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: Duration.seconds(60),
        healthCheckConfig: {
          type: servicediscovery.HealthCheckType.HTTP,
          resourcePath: '/health',
          failureThreshold: 3,
        },
        healthCheckGracePeriod: Duration.seconds(30),
      }
    );

    // Register ALB as an instance in Cloud Map
    cloudMapService.registerNonIpInstance('ALBInstance', {
      customAttributes: {
        AWS_ALIAS_DNS_NAME: alb.loadBalancerDnsName,
      },
    });

    // ======================
    // IAM Roles and Policies
    // ======================

    // IAM Role for service instances
    const serviceInstanceRole = new iam.Role(this, 'ServiceInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for service instances to access Parameter Store',
      roleName: `${appName}-service-instance-role`,
    });

    // Policy to read specific SecureString from Parameter Store
    const parameterStorePolicy = new iam.Policy(
      this,
      'ParameterStoreReadPolicy',
      {
        policyName: `${appName}-parameter-store-read`,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['ssm:GetParameter', 'ssm:GetParameters'],
            resources: [secureParameter.parameterArn],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['kms:Decrypt'],
            resources: [kmsKey.keyArn],
            conditions: {
              StringEquals: {
                'kms:ViaService': `ssm.${this.region}.amazonaws.com`,
              },
            },
          }),
        ],
      }
    );

    serviceInstanceRole.attachInlinePolicy(parameterStorePolicy);

    // Policy for service discovery operations
    const serviceDiscoveryPolicy = new iam.Policy(
      this,
      'ServiceDiscoveryPolicy',
      {
        policyName: `${appName}-service-discovery`,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'servicediscovery:DiscoverInstances',
              'servicediscovery:GetService',
              'servicediscovery:ListServices',
            ],
            resources: [
              cloudMapService.serviceArn,
              privateNamespace.namespaceArn,
            ],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['route53:GetHealthCheck', 'route53:ListHealthChecks'],
            resources: ['*'],
          }),
        ],
      }
    );

    serviceInstanceRole.attachInlinePolicy(serviceDiscoveryPolicy);

    // Instance Profile for EC2 instances
    const instanceProfile = new iam.InstanceProfile(
      this,
      'ServiceInstanceProfile',
      {
        role: serviceInstanceRole,
        instanceProfileName: `${appName}-service-instance-profile`,
      }
    );

    // ======================
    // Outputs
    // ======================

    new CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for the service discovery system',
      exportName: `${appName}-vpc-id`,
    });

    new CfnOutput(this, 'ALBDNSName', {
      value: alb.loadBalancerDnsName,
      description: 'Internal ALB DNS Name',
      exportName: `${appName}-alb-dns-name`,
    });

    new CfnOutput(this, 'ALBHostedZoneId', {
      value: alb.loadBalancerCanonicalHostedZoneId,
      description: 'ALB Canonical Hosted Zone ID',
      exportName: `${appName}-alb-hosted-zone-id`,
    });

    new CfnOutput(this, 'ServiceDiscoveryNamespace', {
      value: privateNamespace.namespaceName,
      description: 'Service Discovery Private DNS Namespace',
      exportName: `${appName}-service-discovery-namespace`,
    });

    new CfnOutput(this, 'ServiceDiscoveryServiceName', {
      value: cloudMapService.serviceName,
      description: 'Cloud Map Service Name',
      exportName: `${appName}-cloud-map-service-name`,
    });

    new CfnOutput(this, 'ServiceInstanceRoleArn', {
      value: serviceInstanceRole.roleArn,
      description: 'IAM Role ARN for service instances',
      exportName: `${appName}-service-instance-role-arn`,
    });

    new CfnOutput(this, 'InstanceProfileArn', {
      value: instanceProfile.attrArn,
      description: 'Instance Profile ARN for EC2 instances',
      exportName: `${appName}-instance-profile-arn`,
    });

    new CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `${appName}-kms-key-id`,
    });

    new CfnOutput(this, 'KMSKeyAlias', {
      value: kmsKeyAlias.aliasName,
      description: 'KMS Key Alias',
      exportName: `${appName}-kms-key-alias`,
    });

    new CfnOutput(this, 'ParameterStoreArn', {
      value: secureParameter.parameterArn,
      description: 'Parameter Store SecureString ARN',
      exportName: `${appName}-parameter-store-arn`,
    });

    if (enableHttps && certificate) {
      new CfnOutput(this, 'CertificateArn', {
        value: certificate.certificateArn,
        description: 'ACM Certificate ARN',
        exportName: `${appName}-certificate-arn`,
      });
    }

    // Private subnet IDs for service deployment
    new CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs for service deployment',
      exportName: `${appName}-private-subnet-ids`,
    });

    new CfnOutput(this, 'ALBSecurityGroupId', {
      value: albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
      exportName: `${appName}-alb-security-group-id`,
    });
  }
}

module.exports = { ServiceDiscoveryStack };
```

## README.md

````markdown
# Service Discovery System with AWS CDK

This AWS CDK application creates a comprehensive service discovery system using AWS Cloud Map, Application Load Balancer, and other AWS services for secure microservices communication within a VPC.

## Architecture Overview

- **VPC**: Custom VPC with public and private subnets across 2 AZs
- **Security**: KMS encryption, Parameter Store, restrictive NACLs
- **Load Balancing**: Internal ALB with optional HTTPS support
- **Service Discovery**: AWS Cloud Map with health checks
- **Logging**: VPC Flow Logs and ALB access logs to encrypted S3
- **IAM**: Least privilege roles for service instances

## Prerequisites

- Node.js 16.x or later
- AWS CLI configured
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Installation

```bash
# Clone or create the project directory
mkdir service-discovery-cdk && cd service-discovery-cdk

# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap
```
````

## Configuration

The application reads configuration from CDK context. You can set these values in `cdk.json` or pass them via command line:

### Context Parameters

- **appName** (string): Resource naming prefix (default: "service-discovery")
- **vpcCidrBlock** (string): VPC CIDR block (default: "10.0.0.0/16")
- **enableHttps** (boolean): Enable HTTPS listener (default: false)
- **domainName** (string): Domain name for HTTPS certificate (required if enableHttps is true)

### Example Configurations

#### HTTP Only (Default)

```bash
cdk deploy
```

#### With HTTPS

```bash
cdk deploy -c enableHttps=true -c domainName=api.example.com
```

#### Custom Configuration

```bash
cdk deploy -c appName=my-services -c vpcCidrBlock=172.16.0.0/16 -c enableHttps=true -c domainName=internal.mycompany.com
```

## Deployment

```bash
# Synthesize CloudFormation template
cdk synth

# Deploy the stack
cdk deploy

# Deploy with confirmation skip
cdk deploy --require-approval never
```

## Usage

### Service Discovery

Services can discover the ALB endpoint using AWS Cloud Map:

```javascript
const AWS = require('aws-sdk');
const servicediscovery = new AWS.ServiceDiscovery();

// Discover service instances
const params = {
  NamespaceName: 'service-discovery.local',
  ServiceName: 'api-gateway',
};

servicediscovery.discoverInstances(params, (err, data) => {
  if (err) console.log(err);
  else {
    const instances = data.Instances;
    // Use the ALB DNS name from custom attributes
    const albDnsName = instances[0].Attributes.AWS_ALIAS_DNS_NAME;
    console.log('ALB DNS Name:', albDnsName);
  }
});
```

### Parameter Store Access

Service instances can read configuration using the provided IAM role:

```javascript
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();

const params = {
  Name: '/service-discovery/service-discovery/config',
  WithDecryption: true,
};

ssm.getParameter(params, (err, data) => {
  if (err) console.log(err);
  else {
    const config = JSON.parse(data.Parameter.Value);
    console.log('Service Config:', config);
  }
});
```

## Security Features

1. **Encryption**: KMS key encrypts Parameter Store values and S3 buckets
2. **Network Security**: Restrictive NACLs and security groups
3. **IAM**: Least privilege roles with specific resource access
4. **Private Communication**: All service traffic stays within VPC
5. **Logging**: Comprehensive logging with encryption

## Monitoring and Troubleshooting

### Health Checks

The Cloud Map service includes health checks that monitor the ALB health endpoint at `/health`. Ensure your services implement this endpoint.

### Logs

- **VPC Flow Logs**: Available in the created S3 bucket
- **ALB Access Logs**: Available in the ALB access logs S3 bucket
- **CloudWatch**: ALB and service metrics available in CloudWatch

### Common Issues

1. **Certificate Validation**: If using HTTPS, ensure DNS validation completes
2. **Health Check Failures**: Implement `/health` endpoint in your services
3. **Parameter Store Access**: Ensure EC2 instances use the provided instance profile

## Cleanup

```bash
# Destroy the stack
cdk destroy

# Confirm deletion
cdk destroy --force
```

## Cost Optimization

- S3 lifecycle policies automatically delete old logs
- KMS key rotation is enabled for security
- Use appropriate removal policies for production (change to RETAIN)

## Production Considerations

1. Change `RemovalPolicy.DESTROY` to `RemovalPolicy.RETAIN` for critical resources
2. Implement proper backup strategies for Parameter Store values
3. Set up CloudWatch alarms for ALB and service health
4. Consider using AWS WAF for additional security
5. Implement proper certificate management for HTTPS

## Extending the System

This stack provides the foundation for service discovery. You can extend it by:

1. Adding more Cloud Map services for different microservices
2. Implementing auto-scaling groups with the provided instance profile
3. Adding API Gateway for external access
4. Implementing service mesh with AWS App Mesh
5. Adding container orchestration with ECS or EKS

```

## Key Features Implemented

### 🔒 **Security Foundation**
- AWS managed KMS key with automatic rotation
- Parameter Store SecureString with KMS encryption
- Least privilege IAM roles and policies

### 🌐 **VPC and Networking**
- Custom VPC with public/private subnets across 2 AZs
- VPC Flow Logs to encrypted S3 bucket
- Restrictive Network ACLs for enhanced security

### ⚖️ **Load Balancing**
- Internal ALB in private subnets
- Conditional HTTPS support with ACM certificate
- ALB access logging to encrypted S3

### 🔍 **Service Discovery**
- AWS Cloud Map private DNS namespace
- Automatic service registration and health checks
- ALB integration with Cloud Map

### 📊 **Monitoring and Compliance**
- Comprehensive logging with encryption
- Health check configuration
- CloudFormation outputs for integration

This implementation provides a production-ready service discovery system that enables secure, scalable microservices communication within your AWS infrastructure.
```
