import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface VpcConstructProps {
  environmentSuffix: string;
  vpcCidr: string;
  maxAzs: number;
  enableLogging: boolean;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly flowLogGroup?: logs.LogGroup;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    // Create VPC with consistent configuration
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr),
      maxAzs: props.maxAzs,
      natGateways: props.environmentSuffix === 'prod' ? props.maxAzs : 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `Public-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `Private-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: `Isolated-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Add VPC Flow Logs for monitoring
    if (props.enableLogging) {
      this.flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
        logGroupName: `/aws/vpc/flowlogs/${props.environmentSuffix}`,
        retention:
          props.environmentSuffix === 'prod'
            ? logs.RetentionDays.THREE_MONTHS
            : logs.RetentionDays.ONE_MONTH,
      });

      new ec2.FlowLog(this, 'VpcFlowLog', {
        resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
        destination: ec2.FlowLogDestination.toCloudWatchLogs(this.flowLogGroup),
      });
    }

    // Add tags for consistency
    this.vpc.node.addMetadata('Environment', props.environmentSuffix);
    this.vpc.node.addMetadata('Component', 'VPC');
  }
}
