import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SecurityStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Determine if this is the primary region
    const currentRegion = cdk.Stack.of(this).region;
    const isPrimaryRegion = currentRegion === 'us-east-1';

    // Multi-Region VPC with conditional CIDR
    this.vpc = new ec2.Vpc(this, 'FinancialServicesVPC', {
      ipAddresses: ec2.IpAddresses.cidr(
        isPrimaryRegion ? '10.0.0.0/16' : '10.1.0.0/16'
      ),
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      vpcName: `FinancialServices-VPC-${environmentSuffix}`,
    });

    // KMS Key for Financial Services with rotation
    this.kmsKey = new kms.Key(this, 'FinancialServicesKMSKey', {
      description: 'Customer-managed KMS key for Financial Services encryption',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
    });

    // KMS Key Alias
    new kms.Alias(this, 'FinancialServicesKMSKeyAlias', {
      aliasName: `alias/financial-services-${environmentSuffix}`,
      targetKey: this.kmsKey,
    });

    // Lambda Security Group
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc: this.vpc,
        description:
          'Security group for Lambda functions in Financial Services infrastructure',
        securityGroupName: `Lambda-SecurityGroup-${environmentSuffix}`,
      }
    );

    // Add ingress rule for HTTPS from VPC
    this.lambdaSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'HTTPS access from VPC'
    );

    // Add egress rule for HTTPS outbound
    this.lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound access'
    );

    // Tags for all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'FinancialServices');

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: this.vpc.vpcId,
      description: 'ID of the Financial Services VPC',
      exportName: `${cdk.Stack.of(this).stackName}-VPC-ID`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: this.kmsKey.keyId,
      description: 'ID of the Financial Services KMS Key',
      exportName: `${cdk.Stack.of(this).stackName}-KMS-Key-ID`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: this.lambdaSecurityGroup.securityGroupId,
      description: 'ID of the Lambda Security Group',
      exportName: `${cdk.Stack.of(this).stackName}-Lambda-SG-ID`,
    });
  }
}
