import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface SecurityConstructProps {
  vpc: ec2.Vpc;
  allowedSshIpRange: string;
  environment: string;
}

export class SecurityConstruct extends Construct {
  public readonly bastionSecurityGroup: ec2.SecurityGroup;
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly certificate?: acm.Certificate;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // Bastion host security group with restricted SSH access
    this.bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      'BastionSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for bastion hosts',
        allowAllOutbound: false,
      }
    );

    // Only allow SSH from specified IP range
    this.bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.allowedSshIpRange),
      ec2.Port.tcp(22),
      'Allow SSH from specified IP range only'
    );

    // Allow outbound HTTPS for updates
    this.bastionSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for updates'
    );

    // Web server security group
    this.webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for web servers',
    });

    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );

    // Lambda security group
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for Lambda functions',
      }
    );

    // Database security group
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for RDS databases',
        allowAllOutbound: false,
      }
    );

    // Allow Lambda to connect to database
    this.databaseSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(5432), // PostgreSQL port
      'Allow Lambda functions to connect to database'
    );

    // Allow bastion to connect to database for maintenance
    this.databaseSecurityGroup.addIngressRule(
      this.bastionSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow bastion host to connect to database'
    );

    // Create ACM certificate if domain is provided
    // Note: This requires a Route 53 hosted zone
    // Uncomment and configure if you have a domain
    /*
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'example.com',
    });

    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: `${props.environment}.example.com`,
      subjectAlternativeNames: [`*.${props.environment}.example.com`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });
    */
  }
}
