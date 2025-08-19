import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecurityConfig } from '../../config/security-config';

/**
 * Security Groups Construct implementing defense-in-depth network security
 * All rules follow the principle of least privilege with minimal required access
 */
export class SecurityGroupsConstruct extends Construct {
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly bastionSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);

    // ALB Security Group - Only allows HTTPS traffic from internet
    this.albSecurityGroup = new ec2.SecurityGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-ALB-SG`,
      {
        vpc,
        description:
          'Security group for Application Load Balancer - HTTPS only',
        allowAllOutbound: false, // Explicit outbound rules only
      }
    );

    // Allow HTTPS inbound from internet (443)
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Allow HTTP for health checks and redirects (will redirect to HTTPS)
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic for redirects to HTTPS'
    );

    // Web Tier Security Group - Only accepts traffic from ALB
    this.webSecurityGroup = new ec2.SecurityGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Web-SG`,
      {
        vpc,
        description:
          'Security group for web servers - accepts traffic only from ALB',
        allowAllOutbound: false,
      }
    );

    // Allow inbound HTTP from ALB only
    this.webSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // Allow inbound HTTPS from ALB only
    this.webSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(443),
      'Allow HTTPS from ALB'
    );

    // Allow outbound HTTPS for package updates and external API calls
    this.webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for updates and APIs'
    );

    // Allow outbound HTTP for package repositories
    this.webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound for package repositories'
    );

    // Application Tier Security Group - Only accepts traffic from Web tier
    this.appSecurityGroup = new ec2.SecurityGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-App-SG`,
      {
        vpc,
        description:
          'Security group for application servers - accepts traffic only from web tier',
        allowAllOutbound: false,
      }
    );

    // Allow inbound from web tier on application port
    this.appSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow application traffic from web tier'
    );

    // Allow outbound HTTPS for external services
    this.appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for external services'
    );

    // Database Security Group - Only accepts traffic from App tier
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-DB-SG`,
      {
        vpc,
        description:
          'Security group for database servers - accepts traffic only from app tier',
        allowAllOutbound: false,
      }
    );

    // Allow inbound MySQL/Aurora from app tier only
    this.databaseSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from application tier'
    );

    // Bastion Host Security Group - Highly restricted SSH access
    this.bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-Bastion-SG`,
      {
        vpc,
        description: 'Security group for bastion host - restricted SSH access',
        allowAllOutbound: false,
      }
    );

    // Allow SSH only from specific CIDR block (corporate network)
    this.bastionSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(SecurityConfig.ALLOWED_SSH_CIDR),
      ec2.Port.tcp(22),
      'Allow SSH from corporate network only'
    );

    // Allow outbound SSH to private subnets for administration
    this.bastionSecurityGroup.addEgressRule(
      ec2.Peer.ipv4(SecurityConfig.VPC_CIDR),
      ec2.Port.tcp(22),
      'Allow SSH to private instances'
    );

    // Allow outbound HTTPS for updates
    this.bastionSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for updates'
    );

    // Configure ALB outbound rules to web tier
    this.albSecurityGroup.addEgressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(80),
      'Allow outbound HTTP to web tier'
    );

    this.albSecurityGroup.addEgressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(443),
      'Allow outbound HTTPS to web tier'
    );

    // Configure App tier to Database tier communication
    this.appSecurityGroup.addEgressRule(
      this.databaseSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow outbound MySQL to database tier'
    );

    // Apply security tags to all security groups
    const securityGroups = [
      this.webSecurityGroup,
      this.appSecurityGroup,
      this.databaseSecurityGroup,
      this.bastionSecurityGroup,
      this.albSecurityGroup,
    ];

    securityGroups.forEach(sg => {
      Object.entries(SecurityConfig.STANDARD_TAGS).forEach(([key, value]) => {
        sg.node.addMetadata(key, value);
      });
    });
  }
}
