import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class SecurityGroupsStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const { vpc } = props;

    // ALB Security Group - allows HTTP/HTTPS from internet
    this.albSecurityGroup = new ec2.SecurityGroup(this, `ALBSecurityGroup${environmentSuffix}`, {
      vpc,
      description: `Security group for Application Load Balancer - ${environmentSuffix}`,
      allowAllOutbound: true,
      securityGroupName: `ALBSecurityGroup${environmentSuffix}`,
    });

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Application Security Group - allows traffic from ALB only
    this.appSecurityGroup = new ec2.SecurityGroup(this, `AppSecurityGroup${environmentSuffix}`, {
      vpc,
      description: `Security group for Application Tier EC2 instances - ${environmentSuffix}`,
      allowAllOutbound: true,
      securityGroupName: `AppSecurityGroup${environmentSuffix}`,
    });

    this.appSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // Database Security Group - allows traffic from app tier only
    this.dbSecurityGroup = new ec2.SecurityGroup(this, `DBSecurityGroup${environmentSuffix}`, {
      vpc,
      description: `Security group for RDS Database - ${environmentSuffix}`,
      allowAllOutbound: false,
      securityGroupName: `DBSecurityGroup${environmentSuffix}`,
    });

    this.dbSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL traffic from application tier'
    );

    // Apply environment tags
    cdk.Tags.of(this.albSecurityGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(this.appSecurityGroup).add('Environment', environmentSuffix);
    cdk.Tags.of(this.dbSecurityGroup).add('Environment', environmentSuffix);

    // Outputs for other stacks
    new cdk.CfnOutput(this, `ALBSecurityGroupId${environmentSuffix}`, {
      value: this.albSecurityGroup.securityGroupId,
      exportName: `WebAppALBSecurityGroupId${environmentSuffix}`,
      description: 'ALB Security Group ID',
    });

    new cdk.CfnOutput(this, `AppSecurityGroupId${environmentSuffix}`, {
      value: this.appSecurityGroup.securityGroupId,
      exportName: `WebAppAppSecurityGroupId${environmentSuffix}`,
      description: 'Application Security Group ID',
    });

    new cdk.CfnOutput(this, `DBSecurityGroupId${environmentSuffix}`, {
      value: this.dbSecurityGroup.securityGroupId,
      exportName: `WebAppDBSecurityGroupId${environmentSuffix}`,
      description: 'Database Security Group ID',
    });
  }
}