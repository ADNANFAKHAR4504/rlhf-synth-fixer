import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class SecurityGroupConstruct extends Construct {
  /** @type {ec2.SecurityGroup} */
  securityGroup;

  /**
   * @param {Construct} scope
   * @param {string} id
   * @param {{ vpc: ec2.IVpc, sshCidrBlock: string, trustedOutboundCidrs: string[] }} props
   */
  constructor(scope, id, props) {
    super(scope, id);

    const { vpc, sshCidrBlock, trustedOutboundCidrs } = props;

    this.securityGroup = new ec2.SecurityGroup(this, 'WebAppSecurityGroup', {
      vpc,
      description: 'Security group for secure web application instances',
      allowAllOutbound: false, // enforce explicit outbound
    });

    // ------------------
    // Ingress rules
    // ------------------
    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4(sshCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from trusted CIDR'
    );

    // ------------------
    // Outbound rules
    // ------------------
    trustedOutboundCidrs.forEach((cidr, index) => {
      this.securityGroup.addEgressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.allTraffic(),
        `Allow outbound traffic to trusted CIDR [${index + 1}]: ${cidr}`
      );
    });

    const s3PrefixList = ec2.PrefixList.fromLookup(this, 'S3PrefixList', `com.amazonaws.${this.region}.s3`);

    this.securityGroup.addEgressRule(
      ec2.Peer.prefixList(s3PrefixList.prefixListId),
      ec2.Port.tcp(443),
      'Allow HTTPS to S3',
    );

    this.securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS to AWS services (SSM, CloudWatch)'
    );
  }
}
