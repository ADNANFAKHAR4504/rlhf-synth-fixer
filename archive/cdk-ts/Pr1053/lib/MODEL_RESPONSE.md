I'll help you set up a cloud environment on AWS using CDK with TypeScript. Here's a comprehensive solution that meets all your requirements:

## lib/vpc-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface VpcStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly privateSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string, props?: VpcStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with 2 availability zones
    this.vpc = new ec2.Vpc(this, `CloudEnvVpc-${environmentSuffix}`, {
      maxAzs: 2,
      cidr: '10.0.0.0/16',
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
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Configure VPC Block Public Access for enhanced security
    new ec2.CfnVPCBlockPublicAccessOptions(this, `VpcBPA-${environmentSuffix}`, {
      vpcId: this.vpc.vpcId,
      internetGatewayBlockMode: 'block-bidirectional',
      restrictPublicDnsResolution: 'enabled',
    });

    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets;

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
    });
  }
}
```

## lib/compute-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  environmentSuffix?: string;
}

export class ComputeStack extends cdk.Stack {
  public readonly ec2Instance: ec2.Instance;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Security Group for EC2 instance
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, `Ec2SecurityGroup-${environmentSuffix}`, {
      vpc: props.vpc,
      description: 'Security group for EC2 instance',
      allowAllOutbound: true,
    });

    // Allow SSH access from anywhere (adjust as needed for production)
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'SSH access'
    );

    // Allow HTTP access
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );

    // Allow HTTPS access
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS access'
    );

    // Create IAM role for EC2 instance
    const ec2Role = new iam.Role(this, `Ec2Role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Create EC2 instance in public subnet
    this.ec2Instance = new ec2.Instance(this, `WebServer-${environmentSuffix}`, {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: this.ec2SecurityGroup,
      role: ec2Role,
      userData: ec2.UserData.forLinux(),
    });

    // User data script to install basic packages
    this.ec2Instance.addUserData(
      'yum update -y',
      'yum install -y postgresql15',
      'echo "EC2 instance setup complete" > /var/log/setup.log'
    );

    // Outputs
    new cdk.CfnOutput(this, 'Ec2InstanceId', {
      value: this.ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'Ec2PublicIp', {
      value: this.ec2Instance.instancePublicIp,
      description: 'EC2 Instance Public IP',
    });

    new cdk.CfnOutput(this, 'Ec2SecurityGroupId', {
      value: this.ec2SecurityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
    });
  }
}
```

## lib/database-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  ec2SecurityGroup: ec2.ISecurityGroup;
  environmentSuffix?: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly rdsInstance: rds.DatabaseInstance;
  public readonly dbCredentials: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create database credentials secret
    this.dbCredentials = new secretsmanager.Secret(this, `DbCredentials-${environmentSuffix}`, {
      description: 'RDS PostgreSQL database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // Security Group for RDS instance
    const rdsSecurityGroup = new ec2.SecurityGroup(this, `RdsSecurityGroup-${environmentSuffix}`, {
      vpc: props.vpc,
      description: 'Security group for RDS PostgreSQL instance',
      allowAllOutbound: false,
    });

    // Allow inbound PostgreSQL access only from EC2 security group
    rdsSecurityGroup.addIngressRule(
      props.ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'PostgreSQL access from EC2'
    );

    // Create DB subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, `DbSubnetGroup-${environmentSuffix}`, {
      vpc: props.vpc,
      description: 'DB subnet group for RDS instance',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Create RDS PostgreSQL instance
    this.rdsInstance = new rds.DatabaseInstance(this, `PostgreSqlDatabase-${environmentSuffix}`, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      credentials: rds.Credentials.fromSecret(this.dbCredentials),
      databaseName: 'appdb',
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      deleteAutomatedBackups: true,
      storageEncrypted: true,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
    });

    // Grant EC2 access to read the database credentials
    this.dbCredentials.grantRead(props.ec2SecurityGroup);

    // Outputs
    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: this.rdsInstance.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL Endpoint',
    });

    new cdk.CfnOutput(this, 'RdsPort', {
      value: this.rdsInstance.instanceEndpoint.port.toString(),
      description: 'RDS PostgreSQL Port',
    });

    new cdk.CfnOutput(this, 'DbCredentialsSecretArn', {
      value: this.dbCredentials.secretArn,
      description: 'Database Credentials Secret ARN',
    });
  }
}
```

## lib/tap-stack.ts

```ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC Stack
    const vpcStack = new VpcStack(this, `VpcStack-${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
    });

    // Create Compute Stack (depends on VPC)
    const computeStack = new ComputeStack(this, `ComputeStack-${environmentSuffix}`, {
      vpc: vpcStack.vpc,
      environmentSuffix,
      env: props?.env,
    });

    // Create Database Stack (depends on VPC and Compute)
    const databaseStack = new DatabaseStack(this, `DatabaseStack-${environmentSuffix}`, {
      vpc: vpcStack.vpc,
      ec2SecurityGroup: computeStack.ec2SecurityGroup,
      environmentSuffix,
      env: props?.env,
    });

    // Add dependencies
    computeStack.addDependency(vpcStack);
    databaseStack.addDependency(vpcStack);
    databaseStack.addDependency(computeStack);

    // Stack-level outputs
    new cdk.CfnOutput(this, 'InfrastructureDeployed', {
      value: 'true',
      description: 'Infrastructure deployment status',
    });

    new cdk.CfnOutput(this, 'Environment', {
      value: environmentSuffix,
      description: 'Environment suffix',
    });

    new cdk.CfnOutput(this, 'ConnectToEc2', {
      value: `aws ssm start-session --target ${computeStack.ec2Instance.instanceId}`,
      description: 'Command to connect to EC2 instance via SSM',
    });

    new cdk.CfnOutput(this, 'DatabaseConnectionString', {
      value: `postgresql://dbadmin:<password>@${databaseStack.rdsInstance.instanceEndpoint.hostname}:5432/appdb`,
      description: 'Database connection string template (replace <password> with actual password from secrets manager)',
    });
  }
}
```

This CDK TypeScript solution creates:

1. **VPC with 2 AZs**: Uses `maxAzs: 2` to ensure deployment across two availability zones
2. **Public and Private Subnets**: Configured automatically with `subnetConfiguration`
3. **EC2 Instance**: Deployed in public subnet with Amazon Linux 2023
4. **PostgreSQL RDS**: Deployed in private subnets with encryption enabled
5. **Security Groups**: EC2 allows SSH/HTTP/HTTPS, RDS only allows PostgreSQL from EC2
6. **Internet Gateway**: Automatically created with public subnets
7. **NAT Gateway**: Configured with `PRIVATE_WITH_EGRESS` subnet type
8. **VPC Block Public Access**: Latest AWS security feature for enhanced protection
9. **Secrets Manager**: Secure credential management for the database

The architecture follows AWS Well-Architected principles with proper separation of concerns, security groups, encrypted storage, and organized into separate stacks for better maintainability.