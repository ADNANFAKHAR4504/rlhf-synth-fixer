import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import { Construct } from 'constructs';

interface SecurityConstructProps {
  environmentSuffix: string;
  commonTags: Record<string, string>;
  vpc: ec2.Vpc;
}

export class SecurityConstruct extends Construct {
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // Web tier security group - only allow HTTPS traffic
    this.webSecurityGroup = new ec2.SecurityGroup(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-web-sg`,
      {
        vpc: props.vpc,
        description: 'Security group for web tier',
        allowAllOutbound: false,
      }
    );

    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic for redirect to HTTPS'
    );

    this.webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS'
    );

    // Application tier security group
    this.appSecurityGroup = new ec2.SecurityGroup(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-app-sg`,
      {
        vpc: props.vpc,
        description: 'Security group for application tier',
        allowAllOutbound: false,
      }
    );

    this.appSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from web tier'
    );

    this.appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS for AWS services'
    );

    // Database security group
    this.dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-db-sg`,
      {
        vpc: props.vpc,
        description: 'Security group for database tier',
        allowAllOutbound: false,
      }
    );

    this.dbSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from app tier'
    );

    // Network ACLs for additional security
    const privateNacl = new ec2.NetworkAcl(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-private-nacl`,
      {
        vpc: props.vpc,
        subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    privateNacl.addEntry(
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-allow-inbound-app`,
      {
        ruleNumber: 100,
        cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
        traffic: ec2.AclTraffic.tcpPort(8080),
        direction: ec2.TrafficDirection.INGRESS,
        ruleAction: ec2.Action.ALLOW,
      }
    );

    privateNacl.addEntry(
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-allow-outbound-https`,
      {
        ruleNumber: 100,
        cidr: ec2.AclCidr.anyIpv4(),
        traffic: ec2.AclTraffic.tcpPort(443),
        direction: ec2.TrafficDirection.EGRESS,
        ruleAction: ec2.Action.ALLOW,
      }
    );

    // IAM role for EC2 instances with least privilege
    this.ec2Role = new iam.Role(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-ec2-role`,
      {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'CloudWatchAgentServerPolicy'
          ),
        ],
      }
    );

    // Custom policy for specific S3 access
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [
          `arn:aws:s3:::${props.commonTags.ProjectName}-${props.environmentSuffix}-*/*`,
        ],
      })
    );

    // GuardDuty Extended Threat Detection
    new guardduty.CfnDetector(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-guardduty`,
      {
        enable: true,
        features: [
          {
            name: 'S3_DATA_EVENTS',
            status: 'ENABLED',
          },
          {
            name: 'EKS_AUDIT_LOGS',
            status: 'ENABLED',
          },
          {
            name: 'RDS_LOGIN_EVENTS',
            status: 'ENABLED',
          },
          {
            name: 'EBS_MALWARE_PROTECTION',
            status: 'ENABLED',
          },
        ],
      }
    );

    // Apply tags
    Object.entries(props.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this.webSecurityGroup).add(key, value);
      cdk.Tags.of(this.appSecurityGroup).add(key, value);
      cdk.Tags.of(this.dbSecurityGroup).add(key, value);
      cdk.Tags.of(this.ec2Role).add(key, value);
    });
  }
}
