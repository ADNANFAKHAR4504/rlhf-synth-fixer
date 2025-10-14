import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export interface AlbConstructProps {
  vpc: ec2.Vpc;
  environmentSuffix: string;
}

export class AlbConstruct extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly httpListener: elbv2.ApplicationListener;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: AlbConstructProps) {
    super(scope, id);

    // Create a security group for the ALB
    this.securityGroup = new ec2.SecurityGroup(
      this,
      `AlbSecurityGroup-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        description:
          'Security group for the food delivery application load balancer',
        allowAllOutbound: true,
      }
    );

    // Allow inbound HTTP traffic
    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    // Create the ALB in the public subnets
    this.alb = new elbv2.ApplicationLoadBalancer(
      this,
      `FoodDeliveryALB-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: this.securityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Add an HTTP listener
    this.httpListener = this.alb.addListener('HttpListener', {
      port: 80,
      open: true,
    });

    // Add a default action that returns a 404
    this.httpListener.addAction('Default', {
      action: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Route not found',
      }),
    });

    // Output the ALB DNS name
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      description: 'The DNS name of the load balancer',
      exportName: `FoodDeliveryAlbDnsName-${props.environmentSuffix}`,
    });
  }
}
