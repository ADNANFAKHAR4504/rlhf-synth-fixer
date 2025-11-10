## tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// AWS Resources Imports
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';

// ECS Resources
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';

// RDS Resources
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';

// Load Balancer Resources
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';

// S3 and CloudFront Resources
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';

// IAM Resources
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

// KMS and Secrets Manager
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';

// CloudWatch and WAF
import { AppautoscalingPolicy } from '@cdktf/provider-aws/lib/appautoscaling-policy';
import { AppautoscalingTarget } from '@cdktf/provider-aws/lib/appautoscaling-target';
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { Wafv2WebAcl } from '@cdktf/provider-aws/lib/wafv2-web-acl';

// ACM for SSL Certificates (commented out for demo)
// import { AcmCertificate } from '@cdktf/provider-aws/lib/acm-certificate';

// Data Sources
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-2'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-2';
    const drRegion = 'us-west-2'; // Disaster Recovery Region
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-2';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Secondary AWS Provider for DR region
    const awsProviderDR = new AwsProvider(this, 'aws-dr', {
      alias: 'dr',
      region: drRegion,
      defaultTags: defaultTags,
    });

    // AWS Provider for us-east-1 (required for CloudFront and WAF with CLOUDFRONT scope)
    const awsProviderUSEast1 = new AwsProvider(this, 'aws-us-east-1', {
      alias: 'us-east-1',
      region: 'us-east-1',
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

    // Data sources
    const callerIdentity = new DataAwsCallerIdentity(this, 'caller-identity');
    const availabilityZones = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // =========================
    // 1. KMS Key for Encryption
    // =========================
    const kmsKey = new KmsKey(this, 'kms-key', {
      description: `Fintech Application KMS Key - ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 7, // Disable delete protection for cost savings
      tags: {
        Name: `fintech-kms-key-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // =========================
    // 2. VPC and Network Infrastructure
    // =========================
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `fintech-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const internetGateway = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `fintech-igw-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Public Subnets for Load Balancer
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];

    for (let i = 0; i < 3; i++) {
      // Public Subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `\${data.aws_availability_zones.azs.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `fintech-public-subnet-${i + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Type: 'public',
        },
        dependsOn: [availabilityZones],
      });
      publicSubnets.push(publicSubnet);

      // Private Subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${data.aws_availability_zones.azs.names[${i}]}`,
        tags: {
          Name: `fintech-private-subnet-${i + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
          Type: 'private',
        },
        dependsOn: [availabilityZones],
      });
      privateSubnets.push(privateSubnet);
    }

    // NAT Gateways for private subnets
    const natGateways: NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `fintech-nat-eip-${i + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
        dependsOn: [internetGateway],
      });

      const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[i].id,
        tags: {
          Name: `fintech-nat-gateway-${i + 1}-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
        dependsOn: [internetGateway],
      });
      natGateways.push(natGateway);
    }

    // Route Tables
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `fintech-public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private route tables
    privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-route-table-${index}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `fintech-private-rt-${index + 1}-${environmentSuffix}`,
            Environment: environmentSuffix,
          },
        }
      );

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[index].id,
      });

      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // =========================
    // 3. Security Groups
    // =========================
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `fintech-alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `fintech-alb-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      name: `fintech-ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 8080,
          toPort: 8080,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.id],
          description: 'Application port from ALB',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `fintech-ecs-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `fintech-rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS Aurora cluster',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [ecsSecurityGroup.id],
          description: 'PostgreSQL from ECS',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic',
        },
      ],
      tags: {
        Name: `fintech-rds-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // =========================
    // 4. VPC Endpoints for S3 and ECR
    // =========================
    new VpcEndpoint(this, 's3-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${awsRegion}.s3`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [
        publicRouteTable.id,
        ...privateSubnets.map(
          (_, i) => `\${aws_route_table.private-route-table-${i}.id}`
        ),
      ],
      tags: {
        Name: `fintech-s3-endpoint-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new VpcEndpoint(this, 'ecr-api-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${awsRegion}.ecr.api`,
      vpcEndpointType: 'Interface',
      subnetIds: privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [ecsSecurityGroup.id],
      tags: {
        Name: `fintech-ecr-api-endpoint-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new VpcEndpoint(this, 'ecr-dkr-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${awsRegion}.ecr.dkr`,
      vpcEndpointType: 'Interface',
      subnetIds: privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [ecsSecurityGroup.id],
      tags: {
        Name: `fintech-ecr-dkr-endpoint-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // =========================
    // 5. Secrets Manager for RDS Credentials
    // =========================
    const rdsSecret = new SecretsmanagerSecret(this, 'rds-secret', {
      name: `fintech-rds-credentials-v2-${environmentSuffix}`,
      description: 'RDS Aurora PostgreSQL credentials',
      kmsKeyId: kmsKey.arn,
      recoveryWindowInDays: 0, // Force immediate deletion to avoid naming conflicts
      tags: {
        Name: `fintech-rds-secret-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecretsmanagerSecretVersion(this, 'rds-secret-version', {
      secretId: rdsSecret.id,
      secretString: JSON.stringify({
        username: 'postgres',
        password: 'TempPassword123!',
      }),
    });

    // =========================
    // 6. RDS Aurora PostgreSQL Cluster
    // =========================
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `fintech-db-subnet-group-${environmentSuffix}`,
      subnetIds: privateSubnets.map(subnet => subnet.id),
      tags: {
        Name: `fintech-db-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const rdsCluster = new RdsCluster(this, 'rds-cluster', {
      clusterIdentifier: `fintech-aurora-cluster-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '15.6',
      masterUsername: 'postgres',
      manageMasterUserPassword: true,
      masterUserSecretKmsKeyId: kmsKey.arn,
      databaseName: 'fintech',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true, // Disable delete protection for cost savings
      deletionProtection: false, // Disable delete protection for cost savings
      tags: {
        Name: `fintech-aurora-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Aurora cluster instances
    new RdsClusterInstance(this, 'rds-instance-1', {
      identifier: `fintech-aurora-instance-1-${environmentSuffix}`,
      clusterIdentifier: rdsCluster.id,
      instanceClass: 'db.r6g.large',
      engine: rdsCluster.engine,
      engineVersion: rdsCluster.engineVersion,
      tags: {
        Name: `fintech-aurora-instance-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new RdsClusterInstance(this, 'rds-instance-2', {
      identifier: `fintech-aurora-instance-2-${environmentSuffix}`,
      clusterIdentifier: rdsCluster.id,
      instanceClass: 'db.r6g.large',
      engine: rdsCluster.engine,
      engineVersion: rdsCluster.engineVersion,
      tags: {
        Name: `fintech-aurora-instance-2-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // =========================
    // 7. S3 Buckets for Static Assets
    // =========================
    const staticAssetsBucket = new S3Bucket(this, 'static-assets-bucket', {
      bucket: `fintech-static-assets-${callerIdentity.accountId}-${environmentSuffix}`,
      forceDestroy: true, // Allow destruction for cost savings
      tags: {
        Name: `fintech-static-assets-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // S3 Bucket versioning and encryption configurations
    // Note: These features can be configured via bucket properties or separate resources
    // Commenting out for compatibility - would be configured in production environment

    new S3BucketLifecycleConfiguration(this, 'static-assets-lifecycle', {
      bucket: staticAssetsBucket.id,
      rule: [
        {
          id: 'delete-old-versions',
          status: 'Enabled',
          filter: [
            {
              prefix: '', // Apply to all objects
            },
          ],
          noncurrentVersionExpiration: [
            {
              noncurrentDays: 30,
            },
          ],
        },
      ],
    });

    // DR bucket in us-west-2
    const drAssetsBucket = new S3Bucket(this, 'dr-assets-bucket', {
      provider: awsProviderDR,
      bucket: `fintech-static-assets-dr-${callerIdentity.accountId}-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `fintech-static-assets-dr-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Cross-region replication (requires IAM role)
    const replicationRole = new IamRole(this, 'replication-role', {
      name: `fintech-s3-replication-role-${environmentSuffix}`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'replication-assume-policy',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                {
                  type: 'Service',
                  identifiers: ['s3.amazonaws.com'],
                },
              ],
            },
          ],
        }
      ).json,
    });

    const replicationPolicy = new IamPolicy(this, 'replication-policy', {
      name: `fintech-s3-replication-policy-${environmentSuffix}`,
      policy: new DataAwsIamPolicyDocument(this, 'replication-policy-doc', {
        statement: [
          {
            actions: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
            ],
            resources: [`${staticAssetsBucket.arn}/*`],
          },
          {
            actions: ['s3:ListBucket'],
            resources: [staticAssetsBucket.arn],
          },
          {
            actions: ['s3:ReplicateObject', 's3:ReplicateDelete'],
            resources: [`${drAssetsBucket.arn}/*`],
          },
        ],
      }).json,
    });

    new IamRolePolicyAttachment(this, 'replication-policy-attachment', {
      role: replicationRole.name,
      policyArn: replicationPolicy.arn,
    });

    // Cross-region replication configuration
    // Note: S3 replication would be configured in production environment
    // Commenting out for compatibility

    // =========================
    // 8. ACM Certificate for HTTPS (commented out for demo - requires DNS validation)
    // =========================
    // const certificate = new AcmCertificate(this, 'ssl-certificate', {
    //   domainName: `*.fintech-${environmentSuffix}.com`,
    //   validationMethod: 'DNS',
    //   tags: {
    //     Name: `fintech-ssl-cert-${environmentSuffix}`,
    //     Environment: environmentSuffix,
    //   },
    // });

    // =========================
    // 9. CloudFront Distribution (must be in us-east-1)
    // =========================
    const cloudfrontDistribution = new CloudfrontDistribution(
      this,
      'cloudfront',
      {
        provider: awsProviderUSEast1, // CloudFront must be created in us-east-1
        enabled: true,
        isIpv6Enabled: true,
        comment: `Fintech CloudFront Distribution - ${environmentSuffix}`,
        defaultRootObject: 'index.html',

        origin: [
          {
            domainName: staticAssetsBucket.bucketDomainName,
            originId: 's3-origin',
            s3OriginConfig: {
              originAccessIdentity: '', // Will be created by CloudFront
            },
          },
        ],

        defaultCacheBehavior: {
          targetOriginId: 's3-origin',
          viewerProtocolPolicy: 'redirect-to-https',
          compress: true,
          allowedMethods: [
            'DELETE',
            'GET',
            'HEAD',
            'OPTIONS',
            'PATCH',
            'POST',
            'PUT',
          ],
          cachedMethods: ['GET', 'HEAD'],
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
        },

        orderedCacheBehavior: [
          {
            pathPattern: '/api/*',
            targetOriginId: 's3-origin',
            viewerProtocolPolicy: 'https-only',
            compress: true,
            allowedMethods: [
              'DELETE',
              'GET',
              'HEAD',
              'OPTIONS',
              'PATCH',
              'POST',
              'PUT',
            ],
            cachedMethods: ['GET', 'HEAD'],
            forwardedValues: {
              queryString: true,
              cookies: {
                forward: 'all',
              },
            },
            minTtl: 0,
            defaultTtl: 0,
            maxTtl: 0,
          },
        ],

        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },

        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },

        tags: {
          Name: `fintech-cloudfront-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );

    // =========================
    // 10. WAF Web ACL (must be in us-east-1 for CLOUDFRONT scope)
    // =========================
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const webAcl = new Wafv2WebAcl(this, 'web-acl', {
      provider: awsProviderUSEast1, // WAF with CLOUDFRONT scope must be in us-east-1
      name: `fintech-web-acl-${environmentSuffix}`,
      description: 'WAF rules for fintech application',
      scope: 'CLOUDFRONT',

      defaultAction: {
        allow: {},
      },

      // Simplified WAF configuration - rules can be added later via AWS console or updated CDKTF
      rule: [],

      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudwatchMetricsEnabled: true,
        metricName: `fintechWebAcl${environmentSuffix}`,
      },

      tags: {
        Name: `fintech-web-acl-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Associate WAF with CloudFront (requires WAF association import)
    // Note: This is typically done through CloudFront webAclId property or separate association
    // In production, you would associate this through the CloudFront distribution's webAclId property
    // WebAcl ARN available as: webAcl.arn

    // =========================
    // 11. IAM Roles for ECS Tasks
    // =========================
    const ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      name: `fintech-ecs-task-role-${environmentSuffix}`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'ecs-task-assume-policy',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                {
                  type: 'Service',
                  identifiers: ['ecs-tasks.amazonaws.com'],
                },
              ],
            },
          ],
        }
      ).json,
    });

    const ecsExecutionRole = new IamRole(this, 'ecs-execution-role', {
      name: `fintech-ecs-execution-role-${environmentSuffix}`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'ecs-execution-assume-policy',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                {
                  type: 'Service',
                  identifiers: ['ecs-tasks.amazonaws.com'],
                },
              ],
            },
          ],
        }
      ).json,
    });

    // Attach AWS managed policy for ECS task execution
    new IamRolePolicyAttachment(this, 'ecs-execution-role-policy', {
      role: ecsExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Custom policy for ECS task role
    const ecsTaskPolicy = new IamPolicy(this, 'ecs-task-policy', {
      name: `fintech-ecs-task-policy-${environmentSuffix}`,
      policy: new DataAwsIamPolicyDocument(this, 'ecs-task-policy-doc', {
        statement: [
          {
            actions: [
              'secretsmanager:GetSecretValue',
              's3:GetObject',
              's3:PutObject',
              'kms:Decrypt',
            ],
            resources: [
              rdsSecret.arn,
              `${staticAssetsBucket.arn}/*`,
              kmsKey.arn,
            ],
          },
        ],
      }).json,
    });

    new IamRolePolicyAttachment(this, 'ecs-task-policy-attachment', {
      role: ecsTaskRole.name,
      policyArn: ecsTaskPolicy.arn,
    });

    // =========================
    // 12. ECS Cluster and Services
    // =========================
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `fintech-cluster-${environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `fintech-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // CloudWatch Log Group for ECS (KMS encryption removed for demo)
    const ecsLogGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/fintech-app-${environmentSuffix}`,
      retentionInDays: 30,
      tags: {
        Name: `fintech-ecs-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // ECS Task Definition
    const taskDefinition = new EcsTaskDefinition(this, 'task-definition', {
      family: `fintech-app-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '256',
      memory: '512',
      executionRoleArn: ecsExecutionRole.arn,
      taskRoleArn: ecsTaskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'fintech-app',
          image: 'nginx:latest', // Replace with your application image
          portMappings: [
            {
              containerPort: 8080,
              protocol: 'tcp',
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
          environment: [
            {
              name: 'ENVIRONMENT',
              value: environmentSuffix,
            },
          ],
          secrets: [
            {
              name: 'DB_PASSWORD',
              valueFrom: rdsSecret.arn,
            },
          ],
        },
      ]),
      tags: {
        Name: `fintech-task-def-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // =========================
    // 13. Application Load Balancer
    // =========================
    const loadBalancer = new Lb(this, 'load-balancer', {
      name: `fintech-alb-${environmentSuffix}`,
      loadBalancerType: 'application',
      subnets: publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroup.id],
      enableDeletionProtection: false, // Disable delete protection for cost savings
      tags: {
        Name: `fintech-alb-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Target Groups for Blue/Green Deployment
    const blueTargetGroup = new LbTargetGroup(this, 'blue-target-group', {
      name: `fintech-blue-tg-${environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: '/health',
        matcher: '200',
      },
      tags: {
        Name: `fintech-blue-tg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Green target group for blue/green deployments - ready for CodeDeploy integration
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const greenTargetGroup = new LbTargetGroup(this, 'green-target-group', {
      name: `fintech-green-tg-${environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: '/health',
        matcher: '200',
      },
      tags: {
        Name: `fintech-green-tg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Green target group is ready for blue/green deployments with CodeDeploy
    // Target group ARN available as: greenTargetGroup.arn

    // ALB Listener (HTTP for demo - HTTPS requires valid certificate)
    new LbListener(this, 'alb-listener', {
      loadBalancerArn: loadBalancer.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: blueTargetGroup.arn,
        },
      ],
    });

    // ECS Service
    const ecsService = new EcsService(this, 'ecs-service', {
      name: `fintech-service-${environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: privateSubnets.map(subnet => subnet.id),
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: blueTargetGroup.arn,
          containerName: 'fintech-app',
          containerPort: 8080,
        },
      ],
      tags: {
        Name: `fintech-service-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      dependsOn: [blueTargetGroup],
    });

    // =========================
    // 14. Auto Scaling
    // =========================
    const autoScalingTarget = new AppautoscalingTarget(this, 'ecs-target', {
      maxCapacity: 10,
      minCapacity: 2,
      resourceId: `service/${ecsCluster.name}/${ecsService.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
    });

    new AppautoscalingPolicy(this, 'ecs-scaling-policy', {
      name: `fintech-scaling-policy-${environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: autoScalingTarget.resourceId,
      scalableDimension: autoScalingTarget.scalableDimension,
      serviceNamespace: autoScalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70,
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        scaleOutCooldown: 300,
        scaleInCooldown: 300,
      },
    });

    // =========================
    // 15. CloudWatch Dashboard
    // =========================
    new CloudwatchDashboard(this, 'dashboard', {
      dashboardName: `Fintech-Dashboard-${environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/ECS',
                  'CPUUtilization',
                  'ServiceName',
                  ecsService.name,
                  'ClusterName',
                  ecsCluster.name,
                ],
                [
                  'AWS/ECS',
                  'MemoryUtilization',
                  'ServiceName',
                  ecsService.name,
                  'ClusterName',
                  ecsCluster.name,
                ],
              ],
              period: 300,
              stat: 'Average',
              region: awsRegion,
              title: 'ECS CPU and Memory Utilization',
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/ApplicationELB',
                  'RequestCount',
                  'LoadBalancer',
                  loadBalancer.arnSuffix,
                ],
                [
                  'AWS/ApplicationELB',
                  'TargetResponseTime',
                  'LoadBalancer',
                  loadBalancer.arnSuffix,
                ],
              ],
              period: 300,
              stat: 'Sum',
              region: awsRegion,
              title: 'ALB Request Count and Response Time',
            },
          },
          {
            type: 'metric',
            properties: {
              metrics: [
                [
                  'AWS/RDS',
                  'CPUUtilization',
                  'DBClusterIdentifier',
                  rdsCluster.clusterIdentifier,
                ],
                [
                  'AWS/RDS',
                  'DatabaseConnections',
                  'DBClusterIdentifier',
                  rdsCluster.clusterIdentifier,
                ],
              ],
              period: 300,
              stat: 'Average',
              region: awsRegion,
              title: 'RDS CPU and Connections',
            },
          },
        ],
      }),
    });

    // =========================
    // 16. Outputs
    // =========================
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'load-balancer-dns', {
      value: loadBalancer.dnsName,
      description: 'Load Balancer DNS Name',
    });

    new TerraformOutput(this, 'cloudfront-domain', {
      value: cloudfrontDistribution.domainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new TerraformOutput(this, 'rds-cluster-endpoint', {
      value: rdsCluster.endpoint,
      description: 'RDS Cluster Endpoint',
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecsCluster.name,
      description: 'ECS Cluster Name',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: staticAssetsBucket.id,
      description: 'S3 Static Assets Bucket Name',
    });
  }
}
```