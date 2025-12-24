To set up the infrastructure using AWS CDK in TypeScript, follow these steps:

1. **Install AWS CDK and Initialize a Project**:
   ```bash
   npm install -g aws-cdk
   cdk init app --language typescript
   cd your-project-name
   npm install @aws-cdk/aws-ec2 @aws-cdk/aws-s3 @aws-cdk/aws-rds @aws-cdk/aws-iam
   ```

2. **Modify `lib/your-project-name-stack.ts`**:

```typescript
import * as cdk from 'aws-cdk-lib';
import { InstanceType, InstanceClass, InstanceSize, Vpc, SubnetType, Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { DatabaseInstance, DatabaseInstanceEngine, MysqlEngineVersion } from 'aws-cdk-lib/aws-rds';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';

export class YourProjectNameStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Use existing VPC
    const vpc = Vpc.fromLookup(this, 'ExistingVPC', {
      vpcId: 'vpc-xxxxxxxx', // Replace with your VPC ID
    });

    // Security Group
    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Allow SSH and HTTP access',
    });
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'Allow SSH access from anywhere');
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'Allow HTTP access from anywhere');

    // EC2 Instance Role
    const ec2Role = new Role(this, 'EC2Role', {
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSReadOnlyAccess'),
      ],
    });

    // EC2 Instance
    const ec2Instance = new cdk.aws_ec2.Instance(this, 'EC2Instance', {
      vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: new cdk.aws_ec2.AmazonLinuxImage({ generation: cdk.aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      securityGroup,
      role: ec2Role,
      userData: cdk.aws_ec2.UserData.forLinux({ shebang: '#!/bin/bash' }),
    });

    // User Data script
    ec2Instance.userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<html><body><h1>Hello, World!</h1></body></html>" > /var/www/html/index.html'
    );

    // Elastic IP
    const eip = new cdk.aws_ec2.CfnEIP(this, 'EIP', {
      domain: 'vpc',
      instanceId: ec2Instance.instanceId,
    });

    // S3 Bucket
    const s3Bucket = new Bucket(this, 'S3Bucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // RDS Subnet Group
    const rdsSubnetGroup = new cdk.aws_rds.CfnDBSubnetGroup(this, 'RDSSubnetGroup', {
      dbSubnetGroupDescription: 'Subnet group for RDS',
      subnetIds: vpc.selectSubnets({ subnetType: SubnetType.PRIVATE }).subnetIds,
      dbSubnetGroupName: 'rds-subnet-group',
    });

    // RDS Instance
    const rdsInstance = new DatabaseInstance(this, 'RDSInstance', {
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0,
      }),
      vpc,
      multiAz: true,
      allocatedStorage: 20,
      instanceType: cdk.aws_ec2.InstanceType.of(cdk.aws_ec2.InstanceClass.T2, cdk.aws_ec2.InstanceSize.MICRO),
      databaseName: 'MyDatabase',
      vpcSubnets: { subnetType: SubnetType.PRIVATE },
      credentials: cdk.aws_rds.Credentials.fromGeneratedSecret('admin'),
      publiclyAccessible: false,
      dbSubnetGroupName: rdsSubnetGroup.ref,
    });

    // Tagging all resources
    cdk.Tags.of(this).add('Environment', 'Dev');
  }
}
```

3. **Deploy the Stack**:
   ```bash
   cdk bootstrap aws://your-account-id/us-east-1
   cdk deploy
   ```

**Explanation**:
- **VPC**: The script uses an existing VPC by looking it up using its ID.
- **Security Group**: Allows inbound SSH and HTTP traffic.
- **EC2 Instance**: Uses the latest Amazon Linux 2 AMI, includes user data to set up a simple HTTP server, and is tagged with `Environment: Dev`.
- **Elastic IP**: Allocates a static IP to the EC2 instance.
- **S3 Bucket**: Configured with block public access and versioning.
- **RDS Instance**: Uses MySQL engine, is set up for multi-AZ deployment, and is tagged appropriately.
- **IAM Role**: Grants the EC2 instance full access to S3 and read-only access to RDS.

Make sure to replace placeholder values like `vpc-xxxxxxxx` with actual values from your AWS environment.
