import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

import { config } from './config/variables';
import { NetworkingConstruct } from './constructs/networking';
import { SecurityConstruct } from './constructs/security';
import { StorageConstruct } from './constructs/storage';
import { DatabaseConstruct } from './constructs/database';
import { ComputeConstruct } from './constructs/compute';
import { CdnConstruct } from './constructs/cdn';
import { MonitoringConstruct } from './constructs/monitoring';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

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
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
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
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    const appConfig = {
      ...config,
      environment: environmentSuffix,
      region: awsRegion,
    };

    const networking = new NetworkingConstruct(this, 'networking', {
      config: appConfig,
    });

    const security = new SecurityConstruct(this, 'security', {
      config: appConfig,
      vpcId: networking.vpc.id,
    });

    const storage = new StorageConstruct(this, 'storage', {
      config: appConfig,
    });

    const database = new DatabaseConstruct(this, 'database', {
      config: appConfig,
      dbSubnetIds: networking.dbSubnets.map(subnet => subnet.id),
      securityGroupIds: [security.rdsSecurityGroup.id],
    });

    const compute = new ComputeConstruct(this, 'compute', {
      config: appConfig,
      vpcId: networking.vpc.id,
      publicSubnetIds: networking.publicSubnets.map(subnet => subnet.id),
      privateSubnetIds: networking.privateSubnets.map(subnet => subnet.id),
      albSecurityGroupId: security.albSecurityGroup.id,
      ec2SecurityGroupId: security.ec2SecurityGroup.id,
      instanceProfileName: security.ec2InstanceProfile.name,
      webAclArn: security.webAcl.arn,
      accessLogsBucket: storage.accessLogsBucket.bucket,
      accessLogsBucketPolicy: storage.accessLogsBucketPolicy,
    });

    const cdn = new CdnConstruct(this, 'cdn', {
      config: appConfig,
      albDnsName: compute.applicationLoadBalancer.dnsName,
      webAclArn: security.webAcl.arn,
      logsBucket: storage.logsBucket.bucket,
    });

    new MonitoringConstruct(this, 'monitoring', {
      config: appConfig,
      albArn: compute.applicationLoadBalancer.arn,
      asgName: compute.autoScalingGroup.name,
      rdsInstanceId: database.dbInstance.identifier,
      cloudfrontDistributionId: cdn.distribution.id,
    });
  }
}
