```yaml
import * as cdk from 'aws-cdk-lib';
import {
  CfnEIP,
  CfnEIPAssociation,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  MachineImage,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from context or props
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') ||
      props?.environmentSuffix ||
      'dev';

    // Apply consistent tagging across all resources following CI/CD pipeline requirements
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Project', 'TapStack');
    cdk.Tags.of(this).add('Repository', process.env.REPOSITORY || 'unknown');
    cdk.Tags.of(this).add(
      'CommitAuthor',
      process.env.COMMIT_AUTHOR || 'unknown'
    );

    // Parameter for SSH IP address
    const allowedSshIp = new cdk.CfnParameter(this, 'AllowedSshIp', {
      type: 'String',
      description: 'IP address allowed for SSH access to EC2 instance',
      default: '0.0.0.0/0',
      allowedPattern: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$',
      constraintDescription:
        'Must be a valid IP address in CIDR format (e.g., 1.2.3.4/32)',
    });

    // 1. S3 Bucket Configuration
    const bucket = new Bucket(this, `TapStackBucket${environmentSuffix}`, {
      versioned: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 2. IAM Role and Permissions
    const instanceRole = new Role(
      this,
      `TapStackInstanceRole${environmentSuffix}`,
      {
        assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
        description: 'IAM role for TapStack EC2 instance',
      }
    );

    // Grant S3 read/write permissions to the IAM role
    bucket.grantReadWrite(instanceRole);

    // 3. Get default VPC
    const vpc = Vpc.fromLookup(this, 'DefaultVpc', {
      isDefault: true,
    });

    // 4. Security Group Configuration
    const securityGroup = new SecurityGroup(
      this,
      `TapStackSecurityGroup${environmentSuffix}`,
      {
        vpc: vpc,
        description: 'Security group for TapStack EC2 instance',
        allowAllOutbound: true,
      }
    );

    // Add SSH ingress rule with parameter-based IP restriction
    securityGroup.addIngressRule(
      Peer.ipv4(allowedSshIp.valueAsString),
      Port.tcp(22),
      'SSH access from specified IP'
    );

    // 5. EC2 Instance Setup
    const instance = new Instance(
      this,
      `TapStackInstance${environmentSuffix}`,
      {
        instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
        machineImage: MachineImage.latestAmazonLinux2(),
        vpc: vpc,
        securityGroup: securityGroup,
        role: instanceRole,
        vpcSubnets: {
          subnetType: SubnetType.PUBLIC,
        },
      }
    );

    // 6. Elastic IP Association
    const eip = new CfnEIP(this, `TapStackEIP${environmentSuffix}`, {
      domain: 'vpc',
    });

    // Associate Elastic IP with EC2 instance using proper association
    new CfnEIPAssociation(this, `TapStackEIPAssociation${environmentSuffix}`, {
      instanceId: instance.instanceId,
      allocationId: eip.attrAllocationId,
    });

    // CloudFormation Outputs for CI/CD pipeline consumption
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `TapStack${environmentSuffix}-S3BucketName`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
      exportName: `TapStack${environmentSuffix}-EC2InstanceId`,
    });

    new cdk.CfnOutput(this, 'ElasticIP', {
      value: eip.ref,
      description: 'Elastic IP Address',
      exportName: `TapStack${environmentSuffix}-ElasticIP`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: securityGroup.securityGroupId,
      description: 'Security Group ID',
      exportName: `TapStack${environmentSuffix}-SecurityGroupId`,
    });

    new cdk.CfnOutput(this, 'IAMRoleArn', {
      value: instanceRole.roleArn,
      description: 'IAM Role ARN',
      exportName: `TapStack${environmentSuffix}-IAMRoleArn`,
    });
  }
}

```
