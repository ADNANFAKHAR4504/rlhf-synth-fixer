import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { AlbConstruct } from './alb-construct';
import { CrossAccountRole } from './cross-account-role';
import { DatabaseConstruct } from './database-construct';
import { EcsConstruct } from './ecs-construct';
import { NetworkingStack } from './networking-stack';
import { S3AssetsConstruct } from './s3-assets-construct';

export interface EnvironmentStackProps {
  environment: string;
  environmentSuffix: string;
  cidrBlock: string;
  operationsAccountId: string;
  awsRegion: string;
}

export class EnvironmentStack extends Construct {
  constructor(scope: Construct, id: string, props: EnvironmentStackProps) {
    super(scope, id);

    const {
      environment,
      environmentSuffix,
      cidrBlock,
      operationsAccountId,
      awsRegion,
    } = props;

    // Create networking infrastructure
    const networking = new NetworkingStack(this, 'networking', {
      environment: `${environment}-${environmentSuffix}`,
      cidrBlock: cidrBlock,
      awsRegion: awsRegion,
    });

    // Create ALB
    const alb = new AlbConstruct(this, 'alb', {
      environment: `${environment}-${environmentSuffix}`,
      vpcId: networking.vpc.id,
      subnetIds: networking.publicSubnets.map(s => s.id),
      securityGroupIds: [networking.albSecurityGroup.id],
    });

    // Create RDS Database
    const database = new DatabaseConstruct(this, 'database', {
      environment: `${environment}-${environmentSuffix}`,
      subnetIds: networking.privateSubnets.map(s => s.id),
      securityGroupIds: [networking.rdsSecurityGroup.id],
    });

    // Create ECS Cluster and Service
    const ecs = new EcsConstruct(this, 'ecs', {
      environment: `${environment}-${environmentSuffix}`,
      subnetIds: networking.privateSubnets.map(s => s.id),
      securityGroupIds: [networking.ecsSecurityGroup.id],
      targetGroupArn: alb.targetGroup.arn,
      operationsAccountId: operationsAccountId,
      awsRegion: awsRegion,
    });

    // Create S3 Bucket for static assets
    const s3Assets = new S3AssetsConstruct(this, 's3-assets', {
      environment: `${environment}-${environmentSuffix}`,
    });

    // Create Cross-Account Role
    new CrossAccountRole(this, 'cross-account-role', {
      environment: `${environment}-${environmentSuffix}`,
      operationsAccountId: operationsAccountId,
    });

    // Terraform Outputs for integration testing
    new TerraformOutput(this, 'vpc-id', {
      value: networking.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: alb.alb.dnsName,
      description: 'ALB DNS Name',
    });

    new TerraformOutput(this, 'alb-arn', {
      value: alb.alb.arn,
      description: 'ALB ARN',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: database.instance.endpoint,
      description: 'RDS Endpoint',
    });

    new TerraformOutput(this, 'rds-db-name', {
      value: database.instance.dbName,
      description: 'RDS Database Name',
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecs.cluster.name,
      description: 'ECS Cluster Name',
    });

    new TerraformOutput(this, 'ecs-cluster-arn', {
      value: ecs.cluster.arn,
      description: 'ECS Cluster ARN',
    });

    new TerraformOutput(this, 'ecs-service-name', {
      value: ecs.service.name,
      description: 'ECS Service Name',
    });

    new TerraformOutput(this, 's3-assets-bucket-name', {
      value: s3Assets.bucket.bucket,
      description: 'S3 Assets Bucket Name',
    });

    new TerraformOutput(this, 's3-assets-bucket-arn', {
      value: s3Assets.bucket.arn,
      description: 'S3 Assets Bucket ARN',
    });
  }
}
