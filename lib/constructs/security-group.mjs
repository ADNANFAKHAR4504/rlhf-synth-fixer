import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class SecurityGroupConstruct extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    const { vpc, sshCidrBlock, trustedOutboundCidrs } = props;

    this.securityGroup = new ec2.SecurityGroup(this, 'WebAppSecurityGroup', {
      vpc,
      description: 'Security group for secure web application instances',
      allowAllOutbound: false
    });

    this.securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
    this.securityGroup.addIngressRule(ec2.Peer.ipv4(sshCidrBlock), ec2.Port.tcp(22), 'Allow SSH from trusted');

    trustedOutboundCidrs.forEach((cidr, index) => {
      this.securityGroup.addEgressRule(ec2.Peer.ipv4(cidr), ec2.Port.allTraffic(), `Allow outbound ${index + 1}`);
    });

    this.securityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS');
    this.securityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');
    this.securityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.udp(53), 'Allow DNS');
  }
}

