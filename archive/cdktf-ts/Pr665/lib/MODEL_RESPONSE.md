# 🚀 AWS Scalable Web Application Infrastructure using CDKTF

I'll create a comprehensive, production-grade CDKTF infrastructure that meets all your requirements. This solution will be modular, secure, and scalable.

## 📁 Project Structure

```
aws-scalable-web-app/
├── src/
│   ├── main.ts
│   ├── constructs/
│   │   ├── networking.ts
│   │   ├── compute.ts
│   │   ├── database.ts
│   │   ├── storage.ts
│   │   ├── security.ts
│   │   ├── cdn.ts
│   │   └── monitoring.ts
│   └── config/
│       └── variables.ts
├── cdktf.json
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## 🔧 Configuration Files

### `package.json`

```json
{
  "name": "aws-scalable-web-app",
  "version": "1.0.0",
  "description": "Scalable web application infrastructure on AWS using CDKTF",
  "main": "main.js",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "compile": "tsc --pretty",
    "watch": "tsc -w",
    "test": "jest",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "^20.8.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.2.2"
  }
}
```

### `cdktf.json`

```json
{
  "language": "typescript",
  "app": "npx ts-node src/main.ts",
  "projectId": "aws-scalable-web-app",
  "sendCrashReports": "false",
  "terraformProviders": ["aws@~> 5.0"],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "exclude": ["cdktf.out"]
}
```

## 🏗️ Infrastructure Code

### `src/config/variables.ts`

```typescript
export interface AppConfig {
  projectName: string;
  environment: string;
  region: string;
  availabilityZones: string[];
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  dbSubnetCidrs: string[];
  instanceType: string;
  dbInstanceClass: string;
  domainName?: string;
  tags: Record<string, string>;
}

export const config: AppConfig = {
  projectName: 'scalable-web-app',
  environment: 'production',
  region: 'us-east-1',
  availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
  vpcCidr: '10.0.0.0/16',
  publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
  privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
  dbSubnetCidrs: ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24'],
  instanceType: 't3.medium',
  dbInstanceClass: 'db.t3.micro',
  domainName: 'example.com', // Optional: replace with your domain
  tags: {
    Project: 'scalable-web-app',
    Environment: 'production',
    Owner: 'DevOps Team',
    CostCenter: 'Engineering',
    ManagedBy: 'Terraform-CDKTF',
  },
};
```

### `src/constructs/networking.ts`

```typescript
import { Construct } from 'constructs';
import {
  Vpc,
  Subnet,
  InternetGateway,
  NatGateway,
  Eip,
  RouteTable,
  Route,
  RouteTableAssociation,
  FlowLog,
  CloudwatchLogGroup,
  IamRole,
  IamRolePolicy,
  DataAwsIamPolicyDocument,
} from '@cdktf/provider-aws';
import { AppConfig } from '../config/variables';

export interface NetworkingProps {
  config: AppConfig;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly dbSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[];

  constructor(scope: Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    const { config } = props;

    // VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-vpc`,
      },
    });

    // Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-igw`,
      },
    });

    // Public Subnets
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-public-subnet-${index + 1}`,
          Type: 'Public',
        },
      });
    });

    // Private Subnets
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          ...config.tags,
          Name: `${config.projectName}-private-subnet-${index + 1}`,
          Type: 'Private',
        },
      });
    });

    // Database Subnets
    this.dbSubnets = config.dbSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `db-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          ...config.tags,
          Name: `${config.projectName}-db-subnet-${index + 1}`,
          Type: 'Database',
        },
      });
    });

    // Elastic IPs for NAT Gateways
    const eips = this.publicSubnets.map((_, index) => {
      return new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          ...config.tags,
          Name: `${config.projectName}-nat-eip-${index + 1}`,
        },
      });
    });

    // NAT Gateways
    this.natGateways = this.publicSubnets.map((subnet, index) => {
      return new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eips[index].id,
        subnetId: subnet.id,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-nat-gateway-${index + 1}`,
        },
      });
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-public-rt`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Private Route Tables (one per AZ for high availability)
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.projectName}-private-rt-${index + 1}`,
        },
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id,
      });

      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Database Route Table
    const dbRouteTable = new RouteTable(this, 'db-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-db-rt`,
      },
    });

    this.dbSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `db-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: dbRouteTable.id,
      });
    });

    // VPC Flow Logs
    const flowLogGroup = new CloudwatchLogGroup(this, 'vpc-flow-log-group', {
      name: `/aws/vpc/flowlogs/${config.projectName}`,
      retentionInDays: 30,
      tags: config.tags,
    });

    const flowLogRole = new IamRole(this, 'vpc-flow-log-role', {
      name: `${config.projectName}-vpc-flow-log-role`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'vpc-flow-log-assume-role-policy',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                {
                  type: 'Service',
                  identifiers: ['vpc-flow-logs.amazonaws.com'],
                },
              ],
            },
          ],
        }
      ).json,
      tags: config.tags,
    });

    new IamRolePolicy(this, 'vpc-flow-log-policy', {
      name: `${config.projectName}-vpc-flow-log-policy`,
      role: flowLogRole.id,
      policy: new DataAwsIamPolicyDocument(
        this,
        'vpc-flow-log-policy-document',
        {
          statement: [
            {
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: ['*'],
            },
          ],
        }
      ).json,
    });

    new FlowLog(this, 'vpc-flow-log', {
      iamRoleArn: flowLogRole.arn,
      logDestination: flowLogGroup.arn,
      resourceId: this.vpc.id,
      resourceType: 'VPC',
      trafficType: 'ALL',
      tags: config.tags,
    });
  }
}
```

### `src/constructs/security.ts`

```typescript
import { Construct } from 'constructs';
import {
  SecurityGroup,
  SecurityGroupRule,
  IamRole,
  IamRolePolicy,
  IamInstanceProfile,
  DataAwsIamPolicyDocument,
  SsmParameter,
  WafWebAcl,
  WafRuleGroup,
  WafRule,
  WafIpSet,
} from '@cdktf/provider-aws';
import { AppConfig } from '../config/variables';

export interface SecurityProps {
  config: AppConfig;
  vpcId: string;
}

export class SecurityConstruct extends Construct {
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;
  public readonly webAcl: WafWebAcl;

  constructor(scope: Construct, id: string, props: SecurityProps) {
    super(scope, id);

    const { config, vpcId } = props;

    // ALB Security Group
    this.albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `${config.projectName}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-alb-sg`,
      },
    });

    new SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'Allow HTTP traffic from internet',
    });

    new SecurityGroupRule(this, 'alb-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'Allow HTTPS traffic from internet',
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: `${config.projectName}-ec2-sg`,
      description: 'Security group for EC2 instances',
      vpcId: vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-ec2-sg`,
      },
    });

    new SecurityGroupRule(this, 'ec2-alb-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow HTTP traffic from ALB',
    });

    new SecurityGroupRule(this, 'ec2-ssh-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow SSH from VPC',
    });

    new SecurityGroupRule(this, 'ec2-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // RDS Security Group
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${config.projectName}-rds-sg`,
      description: 'Security group for RDS database',
      vpcId: vpcId,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-rds-sg`,
      },
    });

    new SecurityGroupRule(this, 'rds-ec2-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'Allow PostgreSQL access from EC2 instances',
    });

    // IAM Role for EC2 instances
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${config.projectName}-ec2-role`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'ec2-assume-role-policy',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                {
                  type: 'Service',
                  identifiers: ['ec2.amazonaws.com'],
                },
              ],
            },
          ],
        }
      ).json,
      tags: config.tags,
    });

    // IAM Policy for EC2 instances
    new IamRolePolicy(this, 'ec2-policy', {
      name: `${config.projectName}-ec2-policy`,
      role: this.ec2Role.id,
      policy: new DataAwsIamPolicyDocument(this, 'ec2-policy-document', {
        statement: [
          {
            actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            resources: [`arn:aws:s3:::${config.projectName}-logs-*/*`],
          },
          {
            actions: ['s3:ListBucket'],
            resources: [`arn:aws:s3:::${config.projectName}-logs-*`],
          },
          {
            actions: [
              'ssm:GetParameter',
              'ssm:GetParameters',
              'ssm:GetParametersByPath',
            ],
            resources: [
              `arn:aws:ssm:${config.region}:*:parameter/${config.projectName}/*`,
            ],
          },
          {
            actions: [
              'cloudwatch:PutMetricData',
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
            ],
            resources: ['*'],
          },
        ],
      }).json,
    });

    // Instance Profile
    this.ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${config.projectName}-ec2-instance-profile`,
        role: this.ec2Role.name,
        tags: config.tags,
      }
    );

    // SSM Parameters for application configuration
    new SsmParameter(this, 'db-host', {
      name: `/${config.projectName}/database/host`,
      type: 'String',
      value: 'placeholder', // Will be updated after RDS creation
      description: 'Database host endpoint',
      tags: config.tags,
    });

    new SsmParameter(this, 'db-name', {
      name: `/${config.projectName}/database/name`,
      type: 'String',
      value: 'webapp',
      description: 'Database name',
      tags: config.tags,
    });

    new SsmParameter(this, 'db-username', {
      name: `/${config.projectName}/database/username`,
      type: 'SecureString',
      value: 'webapp_user',
      description: 'Database username',
      tags: config.tags,
    });

    new SsmParameter(this, 'db-password', {
      name: `/${config.projectName}/database/password`,
      type: 'SecureString',
      value: 'ChangeMe123!', // Should be generated or provided securely
      description: 'Database password',
      tags: config.tags,
    });

    // WAF Web ACL
    const ipSet = new WafIpSet(this, 'blocked-ips', {
      name: `${config.projectName}-blocked-ips`,
      ipSetDescriptors: [
        {
          type: 'IPV4',
          value: '192.0.2.44/32', // Example blocked IP
        },
      ],
    });

    const sqlInjectionRule = new WafRule(this, 'sql-injection-rule', {
      name: `${config.projectName}-sql-injection-rule`,
      metricName: `${config.projectName}SqlInjectionRule`,
      predicates: [
        {
          dataId: 'SqlInjectionDetection',
          negated: false,
          type: 'SqlInjectionMatch',
        },
      ],
    });

    this.webAcl = new WafWebAcl(this, 'web-acl', {
      name: `${config.projectName}-web-acl`,
      metricName: `${config.projectName}WebAcl`,
      defaultAction: {
        type: 'ALLOW',
      },
      rules: [
        {
          action: {
            type: 'BLOCK',
          },
          priority: 1,
          ruleId: sqlInjectionRule.id,
          type: 'REGULAR',
        },
      ],
      tags: config.tags,
    });
  }
}
```

### `src/constructs/storage.ts`

```typescript
import { Construct } from 'constructs';
import {
  S3Bucket,
  S3BucketPublicAccessBlock,
  S3BucketServerSideEncryptionConfiguration,
  S3BucketLifecycleConfiguration,
  S3BucketVersioning,
  S3BucketLogging,
} from '@cdktf/provider-aws';
import { AppConfig } from '../config/variables';

export interface StorageProps {
  config: AppConfig;
}

export class StorageConstruct extends Construct {
  public readonly logsBucket: S3Bucket;
  public readonly accessLogsBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: StorageProps) {
    super(scope, id);

    const { config } = props;

    // Access Logs Bucket (for S3 access logging)
    this.accessLogsBucket = new S3Bucket(this, 'access-logs-bucket', {
      bucket: `${config.projectName}-access-logs-${Date.now()}`,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-access-logs-bucket`,
        Purpose: 'S3AccessLogs',
      },
    });

    // Block public access for access logs bucket
    new S3BucketPublicAccessBlock(this, 'access-logs-bucket-pab', {
      bucket: this.accessLogsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Server-side encryption for access logs bucket
    new S3BucketServerSideEncryptionConfiguration(
      this,
      'access-logs-bucket-encryption',
      {
        bucket: this.accessLogsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Main Application Logs Bucket
    this.logsBucket = new S3Bucket(this, 'logs-bucket', {
      bucket: `${config.projectName}-logs-${Date.now()}`,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-logs-bucket`,
        Purpose: 'ApplicationLogs',
      },
    });

    // Block public access for logs bucket
    new S3BucketPublicAccessBlock(this, 'logs-bucket-pab', {
      bucket: this.logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Server-side encryption for logs bucket
    new S3BucketServerSideEncryptionConfiguration(
      this,
      'logs-bucket-encryption',
      {
        bucket: this.logsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Versioning for logs bucket
    new S3BucketVersioning(this, 'logs-bucket-versioning', {
      bucket: this.logsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Access logging for logs bucket
    new S3BucketLogging(this, 'logs-bucket-logging', {
      bucket: this.logsBucket.id,
      targetBucket: this.accessLogsBucket.id,
      targetPrefix: 'access-logs/',
    });

    // Lifecycle configuration for cost optimization
    new S3BucketLifecycleConfiguration(this, 'logs-bucket-lifecycle', {
      bucket: this.logsBucket.id,
      rule: [
        {
          id: 'log-lifecycle-rule',
          status: 'Enabled',
          expiration: {
            days: 2555, // 7 years retention
          },
          noncurrentVersionExpiration: {
            noncurrentDays: 90,
          },
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
            {
              days: 90,
              storageClass: 'GLACIER',
            },
            {
              days: 365,
              storageClass: 'DEEP_ARCHIVE',
            },
          ],
          noncurrentVersionTransition: [
            {
              noncurrentDays: 30,
              storageClass: 'STANDARD_IA',
            },
            {
              noncurrentDays: 60,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    // Lifecycle configuration for access logs bucket
    new S3BucketLifecycleConfiguration(this, 'access-logs-bucket-lifecycle', {
      bucket: this.accessLogsBucket.id,
      rule: [
        {
          id: 'access-log-lifecycle-rule',
          status: 'Enabled',
          expiration: {
            days: 90, // Keep access logs for 90 days
          },
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
          ],
        },
      ],
    });
  }
}
```

### `src/constructs/database.ts`

```typescript
import { Construct } from "constructs";
import {
  DbSubnetGroup,
  DbInstance,
  DbParameterGroup,
  DataAwsRdsEngineVersion
} from "@cdktf/provider-aws";
import { AppConfig } from "../config/variables";

export interface DatabaseProps {
  config: AppConfig;
  dbSubnetIds: string[];
  securityGroupIds: string[];
}

export class DatabaseConstruct extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const { config, dbSubnetIds, securityGroupIds } = props;

    // Get the latest PostgreSQL engine version
    const engineVersion = new DataAwsRdsEngineVersion(this, "postgres-version", {
      engine: "postgres",
      preferredVersions: ["15.4", "15.3", "15.2"]
    });

    // DB Subnet Group
    this.dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `${config.projectName}-db-subnet-group`,
      subnetIds: dbSubnetIds,
      description: `Database subnet group for ${config.projectName}`,
      tags: {
        ...config.tags,
        Name: `${config.projectName}-db-subnet-group`
      }
    });

    // DB Parameter Group
    const dbParameterGroup = new DbParameterGroup(this, "db-parameter-group", {
      name: `${config.projectName}-postgres-params`,
      family: "postgres15",
      description: `PostgreSQL parameter group for ${config.projectName}`,
      parameter: [
        {
          name: "shared_preload_libraries",
          value: "pg_stat_statements"
        },
        {
          name: "log_statement",
          value: "all"
        },
        {
          name: "log_min_duration_statement",
          value: "1000"
        },
        {
          name: "log_connections",
          value: "1"
        },
        {
          name: "log_disconnections",
          value: "1"
        }
      ],
      tags: config.tags
    });

    // RDS Instance
    this.dbInstance = new DbInstance(this, "db-instance", {
      identifier: `${config.projectName}-postgres`,
      engine: "postgres",
      engineVersion: engineVersion.version,
      instanceClass: config.dbInstanceClass,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: "gp2",
      storageEncrypted: true,

      dbName: "webapp",
      username: "webapp_user",

```
