import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { EcrRepository } from '@cdktf/provider-aws/lib/ecr-repository';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbListenerRule } from '@cdktf/provider-aws/lib/lb-listener-rule';
import { AcmCertificate } from '@cdktf/provider-aws/lib/acm-certificate';
import { AcmCertificateValidation } from '@cdktf/provider-aws/lib/acm-certificate-validation';
import { Route53Zone } from '@cdktf/provider-aws/lib/route53-zone';
import { Route53Record } from '@cdktf/provider-aws/lib/route53-record';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { AppautoscalingTarget } from '@cdktf/provider-aws/lib/appautoscaling-target';
import { AppautoscalingPolicy } from '@cdktf/provider-aws/lib/appautoscaling-policy';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  // SSL/TLS Configuration
  enableHttps?: boolean; // Set to false for testing without domain
  customDomain?: string; // e.g., "myapp.yourdomain.com" - if not provided, uses ALB DNS
  existingCertificateArn?: string; // Use existing ACM certificate instead of creating new one
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Fix: Only use AWS_REGION_OVERRIDE if it's actually set and not empty
    const AWS_REGION_OVERRIDE = process.env.AWS_REGION_OVERRIDE;
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // SSL/TLS Configuration
    const enableHttps = props?.enableHttps !== false; // Default to true for production
    const customDomain = props?.customDomain;
    const existingCertificateArn = props?.existingCertificateArn;

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'available', {
      state: 'available',
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // ========================================
    // VPC and Network Infrastructure
    // ========================================

    // Create VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `igw-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create Public Subnets (3 AZs)
    const publicSubnets: Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${i}-${environmentSuffix}`,
          Environment: 'production',
          Project: 'payment-app',
          Type: 'public',
        },
      });
      publicSubnets.push(subnet);
    }

    // Create Private Subnets (3 AZs)
    const privateSubnets: Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `private-subnet-${i}-${environmentSuffix}`,
          Environment: 'production',
          Project: 'payment-app',
          Type: 'private',
        },
      });
      privateSubnets.push(subnet);
    }

    // Create Elastic IPs for NAT Gateways
    const eips: Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `nat-eip-${i}-${environmentSuffix}`,
          Environment: 'production',
          Project: 'payment-app',
        },
      });
      eips.push(eip);
    }

    // Create NAT Gateways (one per AZ)
    const natGateways: NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const nat = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eips[i].id,
        subnetId: publicSubnets[i].id,
        tags: {
          Name: `nat-gateway-${i}-${environmentSuffix}`,
          Environment: 'production',
          Project: 'payment-app',
        },
      });
      natGateways.push(nat);
    }

    // Create Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `public-rt-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create Private Route Tables (one per AZ for NAT)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-route-table-${i}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `private-rt-${i}-${environmentSuffix}`,
            Environment: 'production',
            Project: 'payment-app',
          },
        }
      );

      // Create route to NAT Gateway
      new Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      });

      // Associate private subnet with private route table
      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // ========================================
    // Security Groups
    // ========================================

    // ALB Security Group
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      tags: {
        Name: `alb-sg-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Allow HTTPS from internet to ALB
    new SecurityGroupRule(this, 'alb-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTPS from internet',
    });

    // Allow HTTP from internet to ALB (for redirect)
    new SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTP from internet for redirect',
    });

    // Allow all outbound from ALB
    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // ECS Security Group
    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      name: `ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: vpc.id,
      tags: {
        Name: `ecs-sg-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Allow traffic from ALB to ECS on port 8080
    new SecurityGroupRule(this, 'ecs-alb-ingress', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow traffic from ALB to ECS on port 8080',
    });

    // Allow all outbound from ECS
    new SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // RDS Security Group
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS PostgreSQL',
      vpcId: vpc.id,
      tags: {
        Name: `rds-sg-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Allow traffic from ECS to RDS on port 5432
    new SecurityGroupRule(this, 'rds-ecs-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: rdsSecurityGroup.id,
      description: 'Allow traffic from ECS to RDS on port 5432',
    });

    // Allow all outbound from RDS
    new SecurityGroupRule(this, 'rds-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: rdsSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // ========================================
    // ECR Repository
    // ========================================

    const ecrRepository = new EcrRepository(this, 'ecr-repo', {
      name: `payment-app-${environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      imageTagMutability: 'MUTABLE',
      tags: {
        Name: `payment-app-ecr-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // ========================================
    // RDS PostgreSQL Database
    // ========================================

    // Create DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `db-subnet-group-${environmentSuffix}`,
      subnetIds: privateSubnets.map(s => s.id),
      description: 'Subnet group for RDS PostgreSQL',
      tags: {
        Name: `db-subnet-group-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create RDS PostgreSQL Instance
    const rdsInstance = new DbInstance(this, 'rds-instance', {
      identifier: `payment-db-${environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '16.4',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 20,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: 'paymentdb',
      username: 'dbadmin',
      password: 'TemporaryPassword123!',
      multiAz: true,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      deletionProtection: false,
      publiclyAccessible: false,
      enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
      tags: {
        Name: `payment-db-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create Secrets Manager Secret for database connection
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `payment-db-connection-${environmentSuffix}-v1`,
      description: 'Database connection string for payment application',
      tags: {
        Name: `db-secret-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Store database connection string in Secrets Manager
    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      secretString: `{"host":"${rdsInstance.address}","port":"${rdsInstance.port}","dbname":"${rdsInstance.dbName}","username":"${rdsInstance.username}","password":"${rdsInstance.password}","engine":"postgres"}`,
    });

    // ========================================
    // ECS Cluster and CloudWatch Logs
    // ========================================

    // Create CloudWatch Log Group for ECS
    const ecsLogGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/payment-app-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `ecs-logs-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create ECS Cluster with Container Insights
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `payment-cluster-${environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `payment-cluster-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // ========================================
    // IAM Roles for ECS
    // ========================================

    // ECS Task Execution Role
    const ecsTaskExecutionRole = new IamRole(this, 'ecs-task-execution-role', {
      name: `ecs-task-execution-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `ecs-task-execution-role-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Attach AWS managed policy for ECS task execution
    new IamRolePolicyAttachment(this, 'ecs-task-execution-policy-attachment', {
      role: ecsTaskExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Custom policy for Secrets Manager access
    const secretsPolicy = new IamPolicy(this, 'secrets-policy', {
      name: `ecs-secrets-policy-${environmentSuffix}`,
      description: 'Policy for ECS tasks to access Secrets Manager',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: dbSecret.arn,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `secrets-policy-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    new IamRolePolicyAttachment(this, 'secrets-policy-attachment', {
      role: ecsTaskExecutionRole.name,
      policyArn: secretsPolicy.arn,
    });

    // ECS Task Role (for application permissions)
    const ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      name: `ecs-task-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `ecs-task-role-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // ========================================
    // Route53 Hosted Zone and SSL Certificate (Conditional)
    // ========================================

    let hostedZone: Route53Zone | undefined;
    let certificate: AcmCertificate | undefined;
    let certValidation: AcmCertificateValidation | undefined;
    let certificateArn: string | undefined;

    if (enableHttps) {
      if (existingCertificateArn) {
        // Use existing certificate ARN (no validation needed)
        certificateArn = existingCertificateArn;
      } else if (customDomain) {
        // Create new certificate with custom domain and Route53 validation
        // Extract root domain for hosted zone (e.g., "yourdomain.com" from "myapp.yourdomain.com")
        const domainParts = customDomain.split('.');
        const rootDomain =
          domainParts.length >= 2
            ? domainParts.slice(-2).join('.')
            : customDomain;

        // Create Route53 hosted zone for domain
        hostedZone = new Route53Zone(this, 'hosted-zone', {
          name: rootDomain,
          tags: {
            Name: `payment-zone-${environmentSuffix}`,
            Environment: 'production',
            Project: 'payment-app',
          },
        });

        // Create ACM Certificate with DNS validation
        certificate = new AcmCertificate(this, 'alb-certificate', {
          domainName: customDomain,
          validationMethod: 'DNS',
          tags: {
            Name: `alb-cert-${environmentSuffix}`,
            Environment: 'production',
            Project: 'payment-app',
          },
          lifecycle: {
            createBeforeDestroy: true,
          },
        });

        // Create DNS validation record in Route53
        const certValidationRecord = new Route53Record(
          this,
          'cert-validation-record',
          {
            zoneId: hostedZone.zoneId,
            name: `\${tolist(${certificate.fqn}.domain_validation_options)[0].resource_record_name}`,
            type: `\${tolist(${certificate.fqn}.domain_validation_options)[0].resource_record_type}`,
            records: [
              `\${tolist(${certificate.fqn}.domain_validation_options)[0].resource_record_value}`,
            ],
            ttl: 60,
            allowOverwrite: true,
          }
        );

        // Wait for certificate validation to complete
        certValidation = new AcmCertificateValidation(this, 'cert-validation', {
          certificateArn: certificate.arn,
          validationRecordFqdns: [certValidationRecord.fqdn],
        });

        certificateArn = certificate.arn;
      }
    }

    // ========================================
    // Application Load Balancer
    // ========================================

    // Create Application Load Balancer
    const alb = new Lb(this, 'alb', {
      name: `payment-alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: publicSubnets.map(s => s.id),
      enableDeletionProtection: false,
      enableHttp2: true,
      tags: {
        Name: `payment-alb-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create Target Group for ECS
    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `payment-tg-${environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        matcher: '200',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      deregistrationDelay: '30',
      tags: {
        Name: `payment-tg-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create HTTPS Listener (only if HTTPS is enabled and certificate is available)
    let httpsListener: LbListener | undefined;
    if (enableHttps && certificateArn) {
      const listenerDependencies = certValidation
        ? [certValidation]
        : undefined;

      httpsListener = new LbListener(this, 'https-listener', {
        loadBalancerArn: alb.arn,
        port: 443,
        protocol: 'HTTPS',
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        certificateArn: certificateArn,
        defaultAction: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        tags: {
          Name: `https-listener-${environmentSuffix}`,
          Environment: 'production',
          Project: 'payment-app',
        },
        dependsOn: listenerDependencies,
      });
    }

    // Create path-based routing rules for /api/* and /admin/* (only if HTTPS listener exists)
    if (httpsListener) {
      new LbListenerRule(this, 'api-path-rule', {
        listenerArn: httpsListener.arn,
        priority: 100,
        action: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        condition: [
          {
            pathPattern: {
              values: ['/api/*'],
            },
          },
        ],
        tags: {
          Name: `api-path-rule-${environmentSuffix}`,
          Environment: 'production',
          Project: 'payment-app',
        },
      });

      new LbListenerRule(this, 'admin-path-rule', {
        listenerArn: httpsListener.arn,
        priority: 101,
        action: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
        condition: [
          {
            pathPattern: {
              values: ['/admin/*'],
            },
          },
        ],
        tags: {
          Name: `admin-path-rule-${environmentSuffix}`,
          Environment: 'production',
          Project: 'payment-app',
        },
      });
    }

    // Create HTTP Listener (redirect to HTTPS if enabled, otherwise forward to target group)
    new LbListener(this, 'http-listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: enableHttps
        ? [
            {
              type: 'redirect',
              redirect: {
                port: '443',
                protocol: 'HTTPS',
                statusCode: 'HTTP_301',
              },
            },
          ]
        : [
            {
              type: 'forward',
              targetGroupArn: targetGroup.arn,
            },
          ],
      tags: {
        Name: `http-listener-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create Route53 A record for ALB (only if custom domain is configured)
    if (hostedZone && customDomain) {
      new Route53Record(this, 'alb-alias-record', {
        zoneId: hostedZone.zoneId,
        name: customDomain,
        type: 'A',
        alias: {
          name: alb.dnsName,
          zoneId: alb.zoneId,
          evaluateTargetHealth: true,
        },
      });
    }

    // ========================================
    // ECS Task Definition and Service
    // ========================================

    // Create ECS Task Definition
    const taskDefinition = new EcsTaskDefinition(this, 'task-definition', {
      family: `payment-app-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '256',
      memory: '512',
      executionRoleArn: ecsTaskExecutionRole.arn,
      taskRoleArn: ecsTaskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'payment-app',
          image: `${ecrRepository.repositoryUrl}:latest`,
          essential: true,
          portMappings: [
            {
              containerPort: 8080,
              protocol: 'tcp',
            },
          ],
          environment: [
            {
              name: 'ENVIRONMENT',
              value: 'production',
            },
            {
              name: 'LOG_LEVEL',
              value: 'INFO',
            },
          ],
          secrets: [
            {
              name: 'DB_CONNECTION',
              valueFrom: dbSecret.arn,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': ecsLogGroup.name,
              'awslogs-region': awsRegion,
              'awslogs-stream-prefix': 'ecs',
            },
          },
          healthCheck: {
            command: [
              'CMD-SHELL',
              'curl -f http://localhost:8080/health || exit 1',
            ],
            interval: 30,
            timeout: 5,
            retries: 3,
            startPeriod: 60,
          },
        },
      ]),
      tags: {
        Name: `payment-task-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create ECS Service with Fargate Spot
    const ecsService = new EcsService(this, 'ecs-service', {
      name: `payment-service-${environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 3,
      platformVersion: 'LATEST',
      capacityProviderStrategy: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 100,
          base: 0,
        },
      ],
      networkConfiguration: {
        subnets: privateSubnets.map(s => s.id),
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'payment-app',
          containerPort: 8080,
        },
      ],
      healthCheckGracePeriodSeconds: 60,
      enableExecuteCommand: true,
      tags: {
        Name: `payment-service-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
      dependsOn: httpsListener ? [httpsListener] : undefined,
    });

    // ========================================
    // Auto Scaling Configuration
    // ========================================

    // Create Auto Scaling Target
    const autoScalingTarget = new AppautoscalingTarget(
      this,
      'ecs-autoscaling-target',
      {
        maxCapacity: 10,
        minCapacity: 3,
        resourceId: `service/${ecsCluster.name}/${ecsService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      }
    );

    // Create Auto Scaling Policy based on CPU utilization
    new AppautoscalingPolicy(this, 'ecs-cpu-scaling-policy', {
      name: `payment-cpu-scaling-${environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: autoScalingTarget.resourceId,
      scalableDimension: autoScalingTarget.scalableDimension,
      serviceNamespace: autoScalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70.0,
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    });

    // ========================================
    // Outputs
    // ========================================

    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: publicSubnets.map(s => s.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: privateSubnets.map(s => s.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'alb-arn', {
      value: alb.arn,
      description: 'Application Load Balancer ARN',
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecsCluster.name,
      description: 'ECS Cluster name',
    });

    new TerraformOutput(this, 'ecs-service-name', {
      value: ecsService.name,
      description: 'ECS Service name',
    });

    new TerraformOutput(this, 'ecr-repository-url', {
      value: ecrRepository.repositoryUrl,
      description: 'ECR Repository URL',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS PostgreSQL endpoint',
    });

    new TerraformOutput(this, 'db-secret-arn', {
      value: dbSecret.arn,
      description: 'Database secret ARN in Secrets Manager',
    });

    new TerraformOutput(this, 'cloudwatch-log-group', {
      value: ecsLogGroup.name,
      description: 'CloudWatch Log Group for ECS',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    new TerraformOutput(this, 'aws-region', {
      value: awsRegion,
      description: 'AWS Region',
    });

    // Conditional outputs based on configuration
    if (hostedZone) {
      new TerraformOutput(this, 'hosted-zone-id', {
        value: hostedZone.zoneId,
        description: 'Route53 Hosted Zone ID',
      });

      new TerraformOutput(this, 'hosted-zone-nameservers', {
        value: hostedZone.nameServers,
        description:
          'Route53 Hosted Zone Name Servers (delegate your domain to these)',
      });
    }

    if (customDomain) {
      new TerraformOutput(this, 'application-url', {
        value: enableHttps
          ? `https://${customDomain}`
          : `http://${customDomain}`,
        description: 'Application URL (custom domain)',
      });
    } else {
      new TerraformOutput(this, 'application-url', {
        value: enableHttps ? `https://${alb.dnsName}` : `http://${alb.dnsName}`,
        description: 'Application URL (ALB DNS name)',
      });
    }

    if (certificate) {
      new TerraformOutput(this, 'certificate-arn', {
        value: certificate.arn,
        description: 'ACM Certificate ARN',
      });
    }

    new TerraformOutput(this, 'https-enabled', {
      value: enableHttps ? 'true' : 'false',
      description: 'HTTPS is enabled',
    });
  }
}
