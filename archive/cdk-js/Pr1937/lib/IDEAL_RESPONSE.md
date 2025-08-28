# # # bin/tap.mjs

```javascript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

# # # lib/tap-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import { ServiceDiscoveryStack } from './service-discovery-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the Service Discovery Stack
    new ServiceDiscoveryStack(
      scope,
      `ServiceDiscoveryStack${environmentSuffix}`,
      {
        ...props,
        environmentSuffix,
        description: 'Service Discovery System with AWS Cloud Map and ALB',
      }
    );
  }
}

export { TapStack };
```

# # # lib/service-discovery-stack.mjs

```javascript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cr from 'aws-cdk-lib/custom-resources';

const { Stack, Duration, RemovalPolicy, CfnOutput } = cdk;

class ServiceDiscoveryStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Read context values with defaults
    const appName = this.node.tryGetContext('appName') || 'service-discovery';
    const vpcCidrBlock =
      this.node.tryGetContext('vpcCidrBlock') || '10.0.0.0/16';
    const enableHttps = this.node.tryGetContext('enableHttps') || false;
    const domainName = this.node.tryGetContext('domainName') || null;

    // Validate context
    if (enableHttps && !domainName) {
      throw new Error('domainName must be provided when enableHttps is true');
    }

    const resourcePrefix = `${appName}-${environmentSuffix}`;

    // ======================
    // Security Foundation
    // ======================

    // AWS Managed KMS Key for encryption
    const kmsKey = new kms.Key(this, 'ServiceDiscoveryKey', {
      description: `KMS Key for ${resourcePrefix} service discovery encryption`,
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // KMS Key Alias for easier reference
    const kmsKeyAlias = new kms.Alias(this, 'ServiceDiscoveryKeyAlias', {
      aliasName: `alias/${resourcePrefix}-service-discovery`,
      targetKey: kmsKey,
    });

    // Parameter Store Standard String
    const standardParameter = new ssm.StringParameter(
      this,
      'ServiceDiscoveryConfig',
      {
        parameterName: `/${resourcePrefix}/service-discovery/config`,
        stringValue: JSON.stringify({
          environment: environmentSuffix,
          serviceDiscoveryEnabled: true,
          healthCheckInterval: 30,
          maxRetries: 3,
          namespace: `${resourcePrefix}.local`,
        }),
        // Use secure parameter with KMS encryption
        tier: ssm.ParameterTier.STANDARD,
        description: 'Service discovery configuration parameters',
      }
    );

    // Create SecureString parameter using Custom Resource
    const secureParameterName = `/${resourcePrefix}/service-discovery/secure-config`;
    const secureParameter = new cr.AwsCustomResource(
      this,
      'ServiceDiscoverySecureConfig',
      {
        onCreate: {
          service: 'SSM',
          action: 'putParameter',
          parameters: {
            Name: secureParameterName,
            Value: JSON.stringify({
              environment: environmentSuffix,
              serviceDiscoveryEnabled: true,
              healthCheckInterval: 30,
              maxRetries: 3,
              namespace: `${resourcePrefix}.local`,
              kmsKeyId: kmsKey.keyId,
            }),
            Type: 'SecureString',
            KeyId: kmsKey.keyId,
            Description: 'Secure service discovery configuration parameters',
            Overwrite: true,
          },
          physicalResourceId: cr.PhysicalResourceId.of(
            `secure-param-${resourcePrefix}`
          ),
        },
        onUpdate: {
          service: 'SSM',
          action: 'putParameter',
          parameters: {
            Name: secureParameterName,
            Value: JSON.stringify({
              environment: environmentSuffix,
              serviceDiscoveryEnabled: true,
              healthCheckInterval: 30,
              maxRetries: 3,
              namespace: `${resourcePrefix}.local`,
              kmsKeyId: kmsKey.keyId,
            }),
            Type: 'SecureString',
            KeyId: kmsKey.keyId,
            Description: 'Secure service discovery configuration parameters',
            Overwrite: true,
          },
          physicalResourceId: cr.PhysicalResourceId.of(
            `secure-param-${resourcePrefix}`
          ),
        },
        onDelete: {
          service: 'SSM',
          action: 'deleteParameter',
          parameters: {
            Name: secureParameterName,
          },
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
        }),
      }
    );

    // Make sure the Custom Resource can access KMS
    secureParameter.grantPrincipal.addToPrincipalPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:GenerateDataKey'],
        resources: [kmsKey.keyArn],
      })
    );

    const secureParameterArn = `arn:aws:ssm:${this.region}:${this.account}:parameter${secureParameterName}`;

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
      vpcName: `${resourcePrefix}-vpc`,
    });

    // S3 bucket for VPC Flow Logs (encrypted)
    const flowLogsBucket = new s3.Bucket(this, 'VPCFlowLogsBucket', {
      bucketName: `${resourcePrefix}-vpc-flow-logs-${this.account}-${this.region}`,
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
      removalPolicy: RemovalPolicy.DESTROY,
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
      networkAclName: `${resourcePrefix}-restrictive-nacl`,
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

    // S3 bucket for ALB access logs (server-side encryption with S3 managed keys)
    const albLogsBucket = new s3.Bucket(this, 'ALBAccessLogsBucket', {
      bucketName: `${resourcePrefix}-alb-access-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: Duration.days(30),
          noncurrentVersionExpiration: Duration.days(7),
        },
      ],
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for internal ALB',
      allowAllOutbound: true,
      securityGroupName: `${resourcePrefix}-sg`.substring(0, 32),
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
      loadBalancerName: `${resourcePrefix}-alb`.substring(0, 32),
    });

    // Enable ALB access logging
    alb.logAccessLogs(albLogsBucket, `${resourcePrefix}-alb-logs`);

    // Default target group (placeholder)
    const defaultTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'DefaultTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        targetGroupName: `${resourcePrefix}-tg`.substring(0, 32),
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
        certificateName: `${resourcePrefix}-alb-cert`,
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
        name: `${resourcePrefix}.local`,
        vpc,
        description: `Private DNS namespace for ${resourcePrefix} service discovery`,
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

    // Note: ALB registration with Cloud Map will be handled by the application services
    // that register themselves. The Cloud Map service is configured to accept registrations.

    // ======================
    // IAM Roles and Policies
    // ======================

    // IAM Role for service instances
    const serviceInstanceRole = new iam.Role(this, 'ServiceInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for service instances to access Parameter Store',
      roleName: `${resourcePrefix}-service-instance-role`,
    });

    // Policy to read specific SecureString from Parameter Store
    const parameterStorePolicy = new iam.Policy(
      this,
      'ParameterStoreReadPolicy',
      {
        policyName: `${resourcePrefix}-parameter-store-read`,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['ssm:GetParameter', 'ssm:GetParameters'],
            resources: [standardParameter.parameterArn, secureParameterArn],
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
        policyName: `${resourcePrefix}-service-discovery`,
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
        instanceProfileName: `${resourcePrefix}-service-instance-profile`,
      }
    );

    // ======================
    // Outputs
    // ======================

    new CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for the service discovery system',
      exportName: `${resourcePrefix}-vpc-id`,
    });

    new CfnOutput(this, 'ALBDNSName', {
      value: alb.loadBalancerDnsName,
      description: 'Internal ALB DNS Name',
      exportName: `${resourcePrefix}-alb-dns-name`,
    });

    new CfnOutput(this, 'ALBHostedZoneId', {
      value: alb.loadBalancerCanonicalHostedZoneId,
      description: 'ALB Canonical Hosted Zone ID',
      exportName: `${resourcePrefix}-alb-hosted-zone-id`,
    });

    new CfnOutput(this, 'ServiceDiscoveryNamespaceName', {
      value: privateNamespace.namespaceName,
      description: 'Service Discovery Private DNS Namespace',
      exportName: `${resourcePrefix}-service-discovery-namespace`,
    });

    new CfnOutput(this, 'ServiceDiscoveryNamespaceId', {
      value: privateNamespace.namespaceId,
      description: 'Service Discovery Private DNS Namespace ID',
      exportName: `${resourcePrefix}-service-discovery-namespace-id`,
    });

    new CfnOutput(this, 'CloudMapServiceName', {
      value: cloudMapService.serviceName,
      description: 'Cloud Map Service Name',
      exportName: `${resourcePrefix}-cloud-map-service-name`,
    });

    new CfnOutput(this, 'CloudMapServiceId', {
      value: cloudMapService.serviceId,
      description: 'Cloud Map Service ID',
      exportName: `${resourcePrefix}-cloud-map-service-id`,
    });

    new CfnOutput(this, 'ServiceInstanceRoleArn', {
      value: serviceInstanceRole.roleArn,
      description: 'IAM Role ARN for service instances',
      exportName: `${resourcePrefix}-service-instance-role-arn`,
    });

    new CfnOutput(this, 'InstanceProfileArn', {
      value: instanceProfile.instanceProfileArn,
      description: 'Instance Profile ARN for EC2 instances',
      exportName: `${resourcePrefix}-instance-profile-arn`,
    });

    new CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `${resourcePrefix}-kms-key-id`,
    });

    new CfnOutput(this, 'KMSKeyAlias', {
      value: kmsKeyAlias.aliasName,
      description: 'KMS Key Alias',
      exportName: `${resourcePrefix}-kms-key-alias`,
    });

    new CfnOutput(this, 'StandardParameterArn', {
      value: standardParameter.parameterArn,
      description: 'Parameter Store Standard String ARN',
      exportName: `${resourcePrefix}-parameter-store-arn`,
    });

    new CfnOutput(this, 'SecureParameterArn', {
      value: secureParameterArn,
      description: 'Parameter Store SecureString ARN (create post-deployment)',
      exportName: `${resourcePrefix}-secure-parameter-arn`,
    });

    if (enableHttps && certificate) {
      new CfnOutput(this, 'CertificateArn', {
        value: certificate.certificateArn,
        description: 'ACM Certificate ARN',
        exportName: `${resourcePrefix}-certificate-arn`,
      });
    }

    // Private subnet IDs for service deployment
    new CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs for service deployment',
      exportName: `${resourcePrefix}-private-subnet-ids`,
    });

    new CfnOutput(this, 'ALBSecurityGroupId', {
      value: albSecurityGroup.securityGroupId,
      description: 'ALB Security Group ID',
      exportName: `${resourcePrefix}-alb-security-group-id`,
    });
  }
}

export { ServiceDiscoveryStack };
```
