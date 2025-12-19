import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { SecurityGroupsStack } from './security-groups-stack';
import { KmsStack } from './kms-stack';
import { SecretsStack } from './secrets-stack';
import { RdsStack } from './rds-stack';
import { ElastiCacheStack } from './elasticache-stack';
import { CloudWatchStack } from './cloudwatch-stack';
import { IamStack } from './iam-stack';
import { EcsStack } from './ecs-stack';

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

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Create VPC and Networking
    const vpcStack = new VpcStack(this, 'vpc', {
      environmentSuffix,
      region: awsRegion,
    });

    // Create Security Groups
    const securityGroupsStack = new SecurityGroupsStack(
      this,
      'security-groups',
      {
        environmentSuffix,
        vpc: vpcStack.vpc,
      }
    );

    // Create KMS Key
    const kmsStack = new KmsStack(this, 'kms', {
      environmentSuffix,
    });

    // Create Secrets Manager
    const secretsStack = new SecretsStack(this, 'secrets', {
      environmentSuffix,
      kmsKey: kmsStack.key,
    });

    // Create CloudWatch Log Groups
    const cloudwatchStack = new CloudWatchStack(this, 'cloudwatch', {
      environmentSuffix,
      kmsKey: kmsStack.key,
    });

    // Create RDS Aurora Serverless
    const rdsStack = new RdsStack(this, 'rds', {
      environmentSuffix,
      privateSubnet1: vpcStack.privateSubnet1,
      privateSubnet2: vpcStack.privateSubnet2,
      securityGroup: securityGroupsStack.rdsSecurityGroup,
      kmsKey: kmsStack.key,
      dbSecret: secretsStack.dbSecret,
      dbUsername: secretsStack.dbUsername,
      dbPassword: secretsStack.dbPassword,
    });

    // Create ElastiCache Redis
    const elasticacheStack = new ElastiCacheStack(this, 'elasticache', {
      environmentSuffix,
      privateSubnet1: vpcStack.privateSubnet1,
      privateSubnet2: vpcStack.privateSubnet2,
      securityGroup: securityGroupsStack.redisSecurityGroup,
      kmsKey: kmsStack.key,
    });

    // Create IAM Roles
    const iamStack = new IamStack(this, 'iam', {
      environmentSuffix,
      dbSecret: secretsStack.dbSecret,
      ecsLogGroup: cloudwatchStack.ecsLogGroup,
      auditLogGroup: cloudwatchStack.auditLogGroup,
    });

    // Create ECS Fargate Cluster and Service
    const ecsStack = new EcsStack(this, 'ecs', {
      environmentSuffix,
      region: awsRegion,
      publicSubnet1: vpcStack.publicSubnet1,
      publicSubnet2: vpcStack.publicSubnet2,
      securityGroup: securityGroupsStack.ecsSecurityGroup,
      taskRole: iamStack.taskRole,
      executionRole: iamStack.executionRole,
      ecsLogGroup: cloudwatchStack.ecsLogGroup,
      rdsCluster: rdsStack.cluster,
      redisCluster: elasticacheStack.replicationGroup,
      dbSecret: secretsStack.dbSecret,
    });

    // Outputs for integration testing
    new TerraformOutput(this, 'VpcId', {
      value: vpcStack.vpc.id,
    });
    new TerraformOutput(this, 'PublicSubnet1Id', {
      value: vpcStack.publicSubnet1.id,
    });
    new TerraformOutput(this, 'PublicSubnet2Id', {
      value: vpcStack.publicSubnet2.id,
    });
    new TerraformOutput(this, 'PrivateSubnet1Id', {
      value: vpcStack.privateSubnet1.id,
    });
    new TerraformOutput(this, 'PrivateSubnet2Id', {
      value: vpcStack.privateSubnet2.id,
    });
    new TerraformOutput(this, 'EcsSecurityGroupId', {
      value: securityGroupsStack.ecsSecurityGroup.id,
    });
    new TerraformOutput(this, 'RdsSecurityGroupId', {
      value: securityGroupsStack.rdsSecurityGroup.id,
    });
    new TerraformOutput(this, 'RedisSecurityGroupId', {
      value: securityGroupsStack.redisSecurityGroup.id,
    });
    new TerraformOutput(this, 'KmsKeyId', {
      value: kmsStack.key.id,
    });
    new TerraformOutput(this, 'DbSecretArn', {
      value: secretsStack.dbSecret.arn,
    });
    new TerraformOutput(this, 'EcsLogGroupName', {
      value: cloudwatchStack.ecsLogGroup.name,
    });
    new TerraformOutput(this, 'AuditLogGroupName', {
      value: cloudwatchStack.auditLogGroup.name,
    });
    new TerraformOutput(this, 'RdsClusterId', {
      value: rdsStack.cluster.id,
    });
    new TerraformOutput(this, 'RdsClusterEndpoint', {
      value: rdsStack.cluster.endpoint,
    });
    new TerraformOutput(this, 'RedisReplicationGroupId', {
      value: elasticacheStack.replicationGroup.id,
    });
    new TerraformOutput(this, 'RedisEndpoint', {
      value: elasticacheStack.replicationGroup.primaryEndpointAddress,
    });
    new TerraformOutput(this, 'EcsClusterArn', {
      value: ecsStack.cluster.arn,
    });
    new TerraformOutput(this, 'EcsServiceArn', {
      value: ecsStack.service.id,
    });
  }
}
