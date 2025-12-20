import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class SecurityGroupConstruct extends Construct {
  securityGroup;

  constructor(scope, id, props) {
    super(scope, id);

    const { vpc, sshCidrBlock, trustedOutboundCidrs, isLocalStack } = props;

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

    // Skip VPC Endpoints and prefix lists in LocalStack/CI mode
    // These require a real VPC and won't work with mock VPC IDs
    if (isLocalStack) {
      // In LocalStack, just allow outbound HTTPS for testing
      this.securityGroup.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(443),
        'Allow HTTPS outbound (LocalStack mode)'
      );
      return; // Skip VPC endpoints
    }

    // ------------------
    // S3 outbound (prefix lists) - only in real AWS
    // ------------------
    const s3PrefixListIds = {
      "us-east-1": "pl-63a5400a",
      "us-east-2": "pl-7ba54012",
      "us-west-1": "pl-6ba54002",
      "us-west-2": "pl-68a54001",
      "af-south-1": "pl-01a5406a",
      "ap-east-1": "pl-7ea54017",
      "ap-south-1": "pl-78a54011",
      "ap-south-2": "pl-64a5400d",
      "ap-southeast-1": "pl-6fa54006",
      "ap-southeast-2": "pl-6ca54005",
      "ap-southeast-3": "pl-64a7420d",
      "ap-southeast-4": "pl-d0a84db9",
      "ap-northeast-1": "pl-61a54008",
      "ap-northeast-2": "pl-78a54011",
      "ap-northeast-3": "pl-a4a540cd",
      "ca-central-1": "pl-7da54014",
      "eu-central-1": "pl-6ea54007",
      "eu-central-2": "pl-64a5400d",
      "eu-north-1": "pl-c3aa4faa",
      "eu-south-1": "pl-64a5400d",
      "eu-south-2": "pl-64a5400d",
      "eu-west-1": "pl-6da54004",
      "eu-west-2": "pl-7ca54015",
      "eu-west-3": "pl-23ad484a",
      "me-south-1": "pl-64a5400d",
      "me-central-1": "pl-64a5400d",
      "sa-east-1": "pl-6aa54003",
    };

    const region = cdk.Stack.of(this).region;
    const prefixListId = s3PrefixListIds[region];
    if (!prefixListId) {
      throw new Error(`Unsupported region for S3 prefix list: ${region}`);
    }

    this.securityGroup.addEgressRule(
      ec2.Peer.prefixList(prefixListId),
      ec2.Port.tcp(443),
      'Allow HTTPS to S3',
    );

    // ------------------
    // CloudWatch outbound (Interface Endpoints) - only in real AWS
    // ------------------

    // CloudWatch (metrics)
    const cloudWatchEndpoint = vpc.addInterfaceEndpoint('CloudWatchEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_MONITORING,
      privateDnsEnabled: true,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.securityGroup.addEgressRule(
      cloudWatchEndpoint.connections.securityGroups[0],
      ec2.Port.tcp(443),
      'Allow HTTPS to CloudWatch via VPC endpoint'
    );

    // CloudWatch Logs
    const logsEndpoint = vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      privateDnsEnabled: true,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.securityGroup.addEgressRule(
      logsEndpoint.connections.securityGroups[0],
      ec2.Port.tcp(443),
      'Allow HTTPS to CloudWatch Logs via VPC endpoint'
    );

    // CloudWatch Events (a.k.a. EventBridge)
    const eventsEndpoint = vpc.addInterfaceEndpoint('CloudWatchEventsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.EVENTBRIDGE,
      privateDnsEnabled: true,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    this.securityGroup.addEgressRule(
      eventsEndpoint.connections.securityGroups[0],
      ec2.Port.tcp(443),
      'Allow HTTPS to CloudWatch Events via VPC endpoint'
    );
  }
}
