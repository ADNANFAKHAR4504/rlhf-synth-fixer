import * as cdk from 'aws-cdk-lib';
import {
  CfnEIP,
  CfnEIPAssociation,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  IVpc,
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

interface ResourcesStackProps {
  environmentSuffix?: string;
}

export class ResourcesStack extends Construct {
  public readonly bucket: Bucket;
  public readonly instanceRole: Role;
  public readonly vpc: IVpc;
  public readonly securityGroup: SecurityGroup;
  public readonly instance: Instance;
  public readonly eip: CfnEIP;
  public readonly eipAssociation: CfnEIPAssociation;

  constructor(scope: Construct, id: string, props?: ResourcesStackProps) {
    super(scope, id);

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

    // Create a VPC (instead of using default VPC lookup)
    // VPC lookup requires AWS credentials during synth which causes CI/CD issues
    // Creating a simple VPC is more reliable for both LocalStack and AWS
    this.vpc = new Vpc(this, `${environmentSuffix}-TapStackVpc`, {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
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

    this.securityGroup.addIngressRule(
      Peer.ipv4(allowedSshIp.valueAsString),
      Port.tcp(22),
      'SSH access from specified IP range'
    );

    // EC2 Instance
    // Note: requireImdsv2 is removed for LocalStack compatibility
    // (creates Launch Template which LocalStack doesn't support properly)
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
      }
    );

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
  }
}
