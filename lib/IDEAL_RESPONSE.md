```bash

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EC2Client, DescribeVpcsCommand } from "@aws-sdk/client-ec2";

import { WebServerStack } from './secure-web-server';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  vpcId: string
}

export async function findVpcByCidr(cidr: string): Promise<string | undefined> {
  const client = new EC2Client({ region: 'us-east-1' });
  const result = await client.send(new DescribeVpcsCommand({}));

  const vpc = result.Vpcs?.find(v => v.CidrBlock === cidr);
  return vpc?.VpcId;
}

// async function to run before synthesis
async function main() {
  const app = new cdk.App();
  const cidr = "10.0.0.0/16";
  const vpcId = await findVpcByCidr(cidr);
  if (!vpcId) {
    throw new Error("VPC with given CIDR not found");
  }

  const stack = new cdk.Stack(app, "MyStack");

  new TapStack(stack, 'FindVpcStack', {
    vpcId,
  });
}

main();

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    new WebServerStack(this, 'WebServerStack', {
      environmentSuffix, vpcId: props.vpcId, env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    })
  }
}


```


``` bash

import * as cdk from 'aws-cdk-lib';
import { InstanceType, InstanceClass, InstanceSize, Vpc, SubnetType, Peer, Port, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { DatabaseInstance, DatabaseInstanceEngine, MysqlEngineVersion } from 'aws-cdk-lib/aws-rds';
import { Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { SubnetGroup } from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';



export interface WebServerProps extends cdk.StackProps {
    environmentSuffix?: string;
    vpcId: string
}

export class WebServerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: WebServerProps) {
        super(scope, id, props);

        // Use existing VPC
        const vpc = Vpc.fromLookup(this, 'ExistingVPC', {
            vpcId: props?.vpcId, //'vpc-xxxxxxxx', // Replace with your VPC ID
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
            vpcSubnets: { subnetType: SubnetType.PUBLIC }
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


        // Create RDS Subnet Group using L2
        const rdsSubnetGroup = new SubnetGroup(this, 'RdsSubnetGroup', {
            description: 'Subnet group for RDS',
            vpc,
            vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
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
            instanceType: cdk.aws_ec2.InstanceType.of(cdk.aws_ec2.InstanceClass.BURSTABLE3, cdk.aws_ec2.InstanceSize.MICRO),
            databaseName: 'MyDatabase',
            credentials: cdk.aws_rds.Credentials.fromGeneratedSecret('admin'),
            publiclyAccessible: false,
            subnetGroup: rdsSubnetGroup
        });

    }
}
```
