import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface BastionProps {
  readonly vpc: ec2.IVpc;
  readonly instanceType?: ec2.InstanceType;
  /** If provided, will create SecurityGroupIngress rules on this SG to allow DB access from bastion */
  readonly rdsSecurityGroupId?: string;
}

export class Bastion extends Construct {
  public readonly instanceId?: string;
  public readonly securityGroupId?: string;

  constructor(scope: Construct, id: string, props: BastionProps) {
    super(scope, id);

    const vpc = props.vpc;

    // IAM role for EC2 with SSM
    const role = new iam.Role(this, 'BastionRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    const sg = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc,
      description: 'SSM bastion security group for integration tests',
      allowAllOutbound: true,
    });

    // Instance
    const instance = new ec2.Instance(this, 'BastionInstance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType:
        props.instanceType ??
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux(),
      role,
      securityGroup: sg,
    });

    // Expose ids
    this.instanceId = instance.instanceId;
    this.securityGroupId = sg.securityGroupId;

    // If an RDS SG was provided, add ingress for common DB ports
    if (props.rdsSecurityGroupId) {
      // Allow MySQL and Postgres ports
      new ec2.CfnSecurityGroupIngress(this, 'RdsIngress3306', {
        groupId: props.rdsSecurityGroupId,
        ipProtocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        sourceSecurityGroupId: sg.securityGroupId,
      });
      new ec2.CfnSecurityGroupIngress(this, 'RdsIngress5432', {
        groupId: props.rdsSecurityGroupId,
        ipProtocol: 'tcp',
        fromPort: 5432,
        toPort: 5432,
        sourceSecurityGroupId: sg.securityGroupId,
      });
    }

    // Tag
    cdk.Tags.of(this).add('integration-bastion', 'true');
  }
}
