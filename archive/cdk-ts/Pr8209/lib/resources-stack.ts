import * as cdk from 'aws-cdk-lib';
import {
  CfnEIP,
  CfnEIPAssociation,
  CfnInstance,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  IVpc,
  MachineImage,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface ResourcesStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class ResourcesStack extends cdk.Stack {
  public readonly bucket: Bucket;
  public readonly instanceRole: Role;
  public readonly vpc: IVpc;
  public readonly securityGroup: SecurityGroup;
  public readonly instance: Instance;
  public readonly eip: CfnEIP;
  public readonly eipAssociation: CfnEIPAssociation;

  constructor(scope: Construct, id: string, props?: ResourcesStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // S3 Bucket with security
    this.bucket = new Bucket(this, `${environmentSuffix}-TapStackBucket`, {
      versioned: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
    });

    // IAM Role for EC2
    this.instanceRole = new Role(
      this,
      `${environmentSuffix}-TapStackInstanceRole`,
      {
        assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
        description: 'IAM role for TapStack EC2 instance',
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'CloudWatchAgentServerPolicy'
          ),
        ],
      }
    );

    this.bucket.grantReadWrite(this.instanceRole);

    // Create new VPC
    this.vpc = new Vpc(this, `${environmentSuffix}-TapStackVpc`, {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security Group
    this.securityGroup = new SecurityGroup(
      this,
      `${environmentSuffix}-TapStackSecurityGroup`,
      {
        vpc: this.vpc,
        description: 'Security group for TapStack EC2 instance',
        allowAllOutbound: true,
      }
    );

    // SSH Parameter
    const allowedSshIp = new cdk.CfnParameter(
      this,
      `${environmentSuffix}-AllowedSshIp`,
      {
        type: 'String',
        description: 'IP address range allowed for SSH access (CIDR format)',
        default: '10.0.0.0/8',
      }
    );

    // LocalStack compatibility: Create separate ingress rule instead of inline
    // addIngressRule creates inline rules which LocalStack doesn't apply properly
    new cdk.aws_ec2.CfnSecurityGroupIngress(
      this,
      `${environmentSuffix}-SSHIngressRule`,
      {
        groupId: this.securityGroup.securityGroupId,
        ipProtocol: 'tcp',
        fromPort: 22,
        toPort: 22,
        cidrIp: allowedSshIp.valueAsString,
        description: 'SSH access from specified IP range',
      }
    );

    // EC2 Instance
    this.instance = new Instance(
      this,
      `${environmentSuffix}-TapStackInstance`,
      {
        instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
        machineImage: MachineImage.latestAmazonLinux2(),
        vpc: this.vpc,
        securityGroup: this.securityGroup,
        role: this.instanceRole,
        vpcSubnets: {
          subnetType: SubnetType.PUBLIC,
        },
        requireImdsv2: true,
      }
    );

    // LocalStack compatibility: Override LaunchTemplate version reference
    // CDK's Instance construct creates a LaunchTemplate behind the scenes
    // and tries to use Fn::GetAtt for LatestVersionNumber, which doesn't work in LocalStack
    const cfnInstance = this.instance.node.defaultChild as CfnInstance;
    // Use addOverride to directly modify the CloudFormation template
    cfnInstance.addOverride('Properties.LaunchTemplate.Version', '$Latest');

    // Elastic IP
    this.eip = new CfnEIP(this, `${environmentSuffix}-TapStackEIP`, {
      domain: 'vpc',
    });

    this.eipAssociation = new CfnEIPAssociation(
      this,
      `${environmentSuffix}-TapStackEIPAssociation`,
      {
        instanceId: this.instance.instanceId,
        allocationId: this.eip.attrAllocationId,
      }
    );

    // Ensure EIP association happens after instance and EIP are created
    this.eipAssociation.node.addDependency(this.instance);
    this.eipAssociation.node.addDependency(this.eip);

    // Outputs
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: this.bucket.bucketArn,
      description: 'S3 Bucket ARN',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: this.instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'EC2InstancePrivateIp', {
      value: this.instance.instancePrivateIp,
      description: 'EC2 Instance Private IP',
    });

    new cdk.CfnOutput(this, 'ElasticIP', {
      value: this.eip.attrPublicIp,
      description: 'Elastic IP Address',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.securityGroup.securityGroupId,
      description: 'Security Group ID',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'InstanceRoleArn', {
      value: this.instanceRole.roleArn,
      description: 'EC2 Instance IAM Role ARN',
    });
  }
}
