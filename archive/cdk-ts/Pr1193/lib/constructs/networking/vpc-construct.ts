import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { SecurityConfig } from '../../config/security-config';

/**
 * VPC Construct that creates a highly secure, multi-AZ VPC with proper subnet isolation
 * Implements network segmentation with private subnets for sensitive workloads
 */
export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly privateSubnets: ec2.ISubnet[];
  public readonly publicSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create VPC with strict network isolation
    this.vpc = new ec2.Vpc(this, `${SecurityConfig.RESOURCE_PREFIX}-VPC`, {
      ipAddresses: ec2.IpAddresses.cidr(SecurityConfig.VPC_CIDR),
      maxAzs: 2, // Multi-AZ for high availability

      // Define subnet configuration with proper isolation
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${SecurityConfig.RESOURCE_PREFIX}-Private`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `${SecurityConfig.RESOURCE_PREFIX}-Public`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],

      // Enable DNS resolution and hostnames for secure internal communication
      enableDnsHostnames: true,
      enableDnsSupport: true,

      // NAT Gateway configuration for secure outbound internet access from private subnets
      natGateways: 1, // Single NAT gateway for cost optimization
    });

    // Store subnet references for use by other constructs
    this.privateSubnets = this.vpc.privateSubnets;
    this.publicSubnets = this.vpc.publicSubnets;

    // Create VPC Flow Logs for comprehensive network monitoring and security auditing
    const flowLogsGroup = new logs.LogGroup(
      this,
      `${SecurityConfig.RESOURCE_PREFIX}-VPCFlowLogs`,
      {
        logGroupName: `/aws/vpc/${SecurityConfig.RESOURCE_PREFIX.toLowerCase()}-flowlogs-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`,
        retention: logs.RetentionDays.ONE_YEAR, // Long retention for compliance
      }
    );

    // Enable VPC Flow Logs to capture all network traffic for security analysis
    new ec2.FlowLog(this, `${SecurityConfig.RESOURCE_PREFIX}-VPCFlowLog`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogsGroup),
      trafficType: ec2.FlowLogTrafficType.ALL, // Capture all traffic (accepted, rejected, all)
    });

    // Apply security tags to all VPC resources
    Object.entries(SecurityConfig.STANDARD_TAGS).forEach(([key, value]) => {
      this.vpc.node.addMetadata(key, value);
    });
  }
}
