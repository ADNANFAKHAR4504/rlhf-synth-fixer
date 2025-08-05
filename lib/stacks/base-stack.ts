import { Construct } from 'constructs';
import { TerraformStack, S3Backend } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { VpcConstruct } from '../constructs/vpc-construct';
import { SecurityConstruct } from '../constructs/security-construct';
import { EnvironmentConfig } from '../config/environments';
import { NamingConvention } from '../utils/naming';

export interface BaseStackProps {
  environment: string;
  config: EnvironmentConfig;
  region: string;
}

export class BaseStack extends TerraformStack {
  public vpc: VpcConstruct;
  public security: SecurityConstruct;
  public naming: NamingConvention;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id);

    const { environment, config, region } = props;
    this.naming = new NamingConvention(environment);

    // Configure remote backend
    new S3Backend(this, {
      bucket: `cdktf-terraform-state-${environment}`,
      key: `infrastructure/${environment}/terraform.tfstate`,
      region: region,
      dynamodbTable: `cdktf-terraform-locks-${environment}`,
      encrypt: true,
    });

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: region,
      defaultTags: [
        {
          tags: config.tags,
        },
      ],
    });

    // VPC
    this.vpc = new VpcConstruct(this, 'vpc', {
      config: config.network,
      naming: this.naming,
    });

    // Security
    this.security = new SecurityConstruct(this, 'security', {
      vpcId: this.vpc.vpc.id,
      environment: environment,
      naming: this.naming,
    });
  }
}
