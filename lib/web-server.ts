import * as cdk from 'aws-cdk-lib';
import {
  InstanceType,
  InstanceClass,
  InstanceSize,
  Vpc,
  SubnetType,
  Peer,
  Port,
  SecurityGroup,
} from 'aws-cdk-lib/aws-ec2';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  MysqlEngineVersion,
} from 'aws-cdk-lib/aws-rds';
import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Effect,
} from 'aws-cdk-lib/aws-iam';
import { SubnetGroup } from 'aws-cdk-lib/aws-rds';
import { Tags } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface WebServerProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcId: string;
  allowedSshCidr?: string;
}

function generateUniqueBucketName(): string {
  const timestamp = Date.now().toString(36); // base36 for compactness
  const random = Math.random().toString(36).substring(2, 8); // 6-char random string
  return `webserver-assets-${timestamp}-${random}`;
}

export class WebServerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: WebServerProps) {
    super(scope, id, props);
    Tags.of(this).add('Environment', 'Dev');

    // Use existing VPC
    const vpc = Vpc.fromLookup(this, 'ExistingVPC', {
      vpcId: props?.vpcId, //'vpc-xxxxxxxx', // Replace with your VPC ID
    });
    const sshCidr = props?.allowedSshCidr ?? '10.0.0.0/16';
    // Security Group
    const securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Allow SSH and HTTP access',
    });
    securityGroup.addIngressRule(
      Peer.ipv4(sshCidr),
      Port.tcp(22),
      `Secure SSH access from ${sshCidr}`
    );
    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'Allow HTTP access from anywhere'
    );

    // S3 Bucket
    const bucketID = generateUniqueBucketName();
    const s3Bucket = new Bucket(this, 'S3Bucket', {
      bucketName: `webserver-assets-${bucketID}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // EC2 Instance Role
    const ec2Role = new Role(this, 'EC2Role', {
      roleName: `ec2-instance-role-${props?.environmentSuffix}`,
      assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
      inlinePolicies: {
        S3ReadOnlyAccess: new PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ['s3:GetObject', 's3:ListBucket'],
              resources: [s3Bucket.bucketArn, `${s3Bucket.bucketArn}/*`],
            }),
          ],
        }),
      },
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSReadOnlyAccess'),
      ],
    });

    // EC2 Instance
    const instanceName = `webserver-${props?.environmentSuffix}`;
    const ec2Instance = new cdk.aws_ec2.Instance(this, 'EC2Instance', {
      instanceName,
      vpc,
      instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
      machineImage: new cdk.aws_ec2.AmazonLinuxImage({
        generation: cdk.aws_ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      securityGroup,
      role: ec2Role,
      userData: cdk.aws_ec2.UserData.forLinux({ shebang: '#!/bin/bash' }),
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
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

    // Create RDS Subnet Group
    const rdsSubnetGroup = new SubnetGroup(this, 'RdsSubnetGroup', {
      description: 'Subnet group for RDS',
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_NAT }, // PRIVATE_WITH_NAT, PRIVATE_WITH_EGRESS it should be private but available type for cicd is public
      removalPolicy: cdk.RemovalPolicy.DESTROY, // optional
      subnetGroupName: 'rds-subnet-group',
    });

    // RDS Instance
    const rdsInstance = new DatabaseInstance(this, 'RDSInstance', {
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0,
      }),
      vpc,
      multiAz: true,
      allocatedStorage: 20,
      instanceType: cdk.aws_ec2.InstanceType.of(
        cdk.aws_ec2.InstanceClass.BURSTABLE3,
        cdk.aws_ec2.InstanceSize.MICRO
      ),
      databaseName: 'MyDatabase',
      credentials: cdk.aws_rds.Credentials.fromGeneratedSecret('admin'),
      publiclyAccessible: false,
      subnetGroup: rdsSubnetGroup,
    });

    new cdk.CfnOutput(this, 'EC2InstanceName', {
      value: instanceName,
      description: 'EC2 instance name',
    });

    new cdk.CfnOutput(this, 'EC2RoleName', {
      value: ec2Role.roleName,
      description: 'EC2RoleName use to acess s3 and rds',
    });
    new cdk.CfnOutput(this, 'ElasticIP', {
      value: eip.ref,
      description: 'Elastic IP address of the instance',
    });

    new cdk.CfnOutput(this, 'RDSADDRESS', {
      value: rdsInstance.dbInstanceEndpointAddress,
      description: 'RDS DATABASE ENDPOINT ADDRESS',
    });

    new cdk.CfnOutput(this, 'RDSPORT', {
      value: rdsInstance.dbInstanceEndpointPort,
      description: 'RDS DATABASE PORT',
    });

    new cdk.CfnOutput(this, 'S3', {
      value: s3Bucket.bucketName,
      description: 'S3 BUCKET NAME',
    });
  }
}
