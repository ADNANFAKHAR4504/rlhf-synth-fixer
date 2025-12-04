import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { NetworkingConstruct } from './constructs/networking';
import { DatabaseConstruct } from './constructs/database';
import { StorageConstruct } from './constructs/storage';
import { ComputeConstruct } from './constructs/compute';
import { WorkflowConstruct } from './constructs/workflow';
import { EventingConstruct } from './constructs/eventing';
import { RoutingConstruct } from './constructs/routing';
import { BackupConstruct } from './constructs/backup';
import { MonitoringConstruct } from './constructs/monitoring';
import { ConfigurationConstruct } from './constructs/configuration';

export interface MultiRegionDRStackProps {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  domainName: string;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
}

export class MultiRegionDRStack extends Construct {
  constructor(scope: Construct, id: string, props: MultiRegionDRStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryRegion,
      secondaryRegion,
      domainName,
      primaryProvider,
      secondaryProvider,
    } = props;

    // 1. Networking - VPCs, subnets, security groups in both regions
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
    });

    // 2. Database - DynamoDB Global Tables + Aurora Global Database
    const database = new DatabaseConstruct(this, 'Database', {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
      primaryVpcId: networking.primaryVpcId,
      secondaryVpcId: networking.secondaryVpcId,
      primarySubnetIds: networking.primaryPrivateSubnetIds,
      secondarySubnetIds: networking.secondaryPrivateSubnetIds,
      primaryDbSecurityGroupId: networking.primaryDbSecurityGroupId,
      secondaryDbSecurityGroupId: networking.secondaryDbSecurityGroupId,
    });

    // 3. Storage - S3 cross-region replication with RTC
    const storage = new StorageConstruct(this, 'Storage', {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
    });

    // 4. Compute - Lambda functions in both regions
    const compute = new ComputeConstruct(this, 'Compute', {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
      primaryVpcId: networking.primaryVpcId,
      secondaryVpcId: networking.secondaryVpcId,
      primarySubnetIds: networking.primaryPrivateSubnetIds,
      secondarySubnetIds: networking.secondaryPrivateSubnetIds,
      primaryLambdaSecurityGroupId: networking.primaryLambdaSecurityGroupId,
      secondaryLambdaSecurityGroupId: networking.secondaryLambdaSecurityGroupId,
      dynamoTableName: database.dynamoTableName,
      primaryBucketName: storage.primaryBucketName,
      secondaryBucketName: storage.secondaryBucketName,
      auroraEndpointPrimary: database.auroraEndpointPrimary,
      auroraEndpointSecondary: database.auroraEndpointSecondary,
    });

    // 5. Workflow - Step Functions state machines in both regions
    const workflow = new WorkflowConstruct(this, 'Workflow', {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
      primaryLambdaArn: compute.primaryLambdaArn,
      secondaryLambdaArn: compute.secondaryLambdaArn,
    });

    // 6. Eventing - EventBridge global endpoints
    new EventingConstruct(this, 'Eventing', {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
      primaryStateMachineArn: workflow.primaryStateMachineArn,
      secondaryStateMachineArn: workflow.secondaryStateMachineArn,
    });

    // 7. Routing - Route 53 health checks and failover
    const routing = new RoutingConstruct(this, 'Routing', {
      environmentSuffix,
      primaryProvider,
      domainName,
      primaryLambdaUrl: compute.primaryLambdaUrl,
      secondaryLambdaUrl: compute.secondaryLambdaUrl,
    });

    // 8. Backup - AWS Backup cross-region
    new BackupConstruct(this, 'Backup', {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
      primaryRegion,
      secondaryRegion,
    });

    // 9. Monitoring - CloudWatch dashboards
    new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix,
      primaryProvider,
      primaryLambdaName: compute.primaryLambdaName,
      secondaryLambdaName: compute.secondaryLambdaName,
      primaryStateMachineName: workflow.primaryStateMachineName,
      secondaryStateMachineName: workflow.secondaryStateMachineName,
      dynamoTableName: database.dynamoTableName,
      healthCheckId: routing.healthCheckId,
    });

    // 10. Configuration - Parameter Store replication
    new ConfigurationConstruct(this, 'Configuration', {
      environmentSuffix,
      primaryProvider,
      secondaryProvider,
      primaryVpcId: networking.primaryVpcId,
      primarySubnetIds: networking.primaryPrivateSubnetIds,
      primaryLambdaSecurityGroupId: networking.primaryLambdaSecurityGroupId,
    });
  }
}
