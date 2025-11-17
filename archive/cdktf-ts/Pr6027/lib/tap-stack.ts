import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './networking-construct';
import { SecurityConstruct } from './security-construct';
import { EndpointsConstruct } from './endpoints-construct';
import { TransitGatewayConstruct } from './transit-gateway-construct';
import { FlowLogsConstruct } from './flow-logs-construct';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Create networking infrastructure (VPC, subnets, routing, NAT instances)
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
      region: awsRegion,
    });

    // Create security groups with strict ingress/egress rules
    new SecurityConstruct(this, 'Security', {
      environmentSuffix,
      vpcId: networking.vpcId,
    });

    // Create VPC endpoints for S3 and DynamoDB
    new EndpointsConstruct(this, 'Endpoints', {
      environmentSuffix,
      vpcId: networking.vpcId,
      routeTableIds: networking.privateRouteTableIds,
    });

    // Create Transit Gateway for multi-region connectivity
    // Note: Transit Gateway attachments require exactly one subnet per AZ
    new TransitGatewayConstruct(this, 'TransitGateway', {
      environmentSuffix,
      vpcId: networking.vpcId,
      subnetIds: networking.appSubnetIds,
    });

    // Enable VPC Flow Logs with S3 storage
    const flowLogs = new FlowLogsConstruct(this, 'FlowLogs', {
      environmentSuffix,
      vpcId: networking.vpcId,
    });

    // Output key resource identifiers for integration tests
    new TerraformOutput(this, 'VpcId', {
      value: networking.vpcId,
      description: 'The ID of the VPC',
    });

    new TerraformOutput(this, 'Region', {
      value: awsRegion,
      description: 'The AWS region',
    });

    new TerraformOutput(this, 'FlowLogsBucketName', {
      value: flowLogs.flowLogsBucketName,
      description: 'The name of the S3 bucket for VPC Flow Logs',
    });
  }
}
