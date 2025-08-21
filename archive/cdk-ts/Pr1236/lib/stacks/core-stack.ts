import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface CoreStackProps extends cdk.StackProps {
  vpcCidr?: string;
}

export class CoreStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dataKey: kms.Key;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly appInstanceRole?: iam.Role;

  constructor(scope: Construct, id: string, props: CoreStackProps = {}) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'AppVpc', {
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr || '10.0.0.0/16'),
      maxAzs: 2,
    });

    this.dataKey = new kms.Key(this, 'DataKey', {
      enableKeyRotation: true,
    });

    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSg', {
      vpc: this.vpc,
      allowAllOutbound: true,
      description: 'App SG',
    });

    // appInstanceRole will be set from DatabaseStack after creation
  }
}
