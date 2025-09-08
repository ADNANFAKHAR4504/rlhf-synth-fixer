import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import {
  S3Backend,
  TerraformStack,
  TerraformOutput,
  TerraformVariable,
} from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  SecureVpcConstruct,
  SecurityGroupsConstruct,
  KmsConstruct,
  IamConstruct,
  S3Construct,
  LambdaConstruct,
  ApiGatewayConstruct,
  RdsConstruct,
  // ConfigConstruct,
  VpcFlowLogsConstruct,
  MonitoringConstruct,
  ShieldConstruct,
  SecureInfraConfig,
} from './modules';
// import { MyStack } from './my-stack';

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
    const vpcCidr = new TerraformVariable(this, 'vpc_cidr', {
      type: 'string',
      default: '10.0.0.0/16',
      description: 'CIDR block for the VPC',
    });

    const allowedSshCidr = new TerraformVariable(this, 'allowed_ssh_cidr', {
      type: 'string',
      default: '203.0.113.0/24',
      description:
        'Company IP range allowed for SSH access (e.g., 203.0.113.0/24)',
    });

    const dbUsername = new TerraformVariable(this, 'db_username', {
      type: 'string',
      default: 'admin',
      description: 'Database administrator username',
    });

    const dbName = new TerraformVariable(this, 'db_name', {
      type: 'string',
      default: 'appdb',
      description: 'Database name',
    });

    const companyName = new TerraformVariable(this, 'company_name', {
      type: 'string',
      default: 'acme',
      description: 'Company name for resource naming and tagging',
    });

    const environment = environmentSuffix;

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: `${companyName.stringValue}-secure-infrastructure`,
            Environment: environment,
            ManagedBy: 'CDKTF',
            Owner: 'DevOps Team',
            CostCenter: 'IT-Security',
            Compliance: 'SOC2-Required',
          },
        },
      ],
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

    // ? Add your stack instantiations here
    // Configuration object for all modules
    const config: SecureInfraConfig = {
      region: awsRegion,
      vpcCidr: vpcCidr.stringValue,
      allowedSshCidr: allowedSshCidr.stringValue,
      dbUsername: dbUsername.stringValue,
      dbName: dbName.stringValue,
      companyName: companyName.stringValue,
      environment: environment,
    };

    // 1. Create VPC and networking infrastructure
    const vpcConstruct = new SecureVpcConstruct(this, 'vpc', config);

    // 2. Create security groups for network access control
    const securityGroups = new SecurityGroupsConstruct(
      this,
      'security-groups',
      vpcConstruct.vpc,
      config
    );

    // 3. Create KMS key for encryption
    const kms = new KmsConstruct(this, 'kms', config);

    // 4. Create IAM roles with least privilege
    const iam = new IamConstruct(this, 'iam', config);

    // 5. Create S3 buckets with versioning and encryption
    const s3 = new S3Construct(this, 's3', kms.kmsKey, config);

    // 6. Create Lambda function with logging
    const lambda = new LambdaConstruct(
      this,
      'lambda',
      iam.lambdaRole,
      securityGroups.lambdaSecurityGroup,
      vpcConstruct.privateSubnets,
      config
    );

    // 7. Create API Gateway with WAF protection
    const apiGateway = new ApiGatewayConstruct(
      this,
      'api-gateway',
      lambda.lambdaFunction,
      config
    );

    // 8. Create RDS database with encryption and backups
    const rds = new RdsConstruct(
      this,
      'rds',
      securityGroups.dbSecurityGroup,
      vpcConstruct.privateSubnets,
      kms.kmsKey,
      config
    );

    // 9. Configure AWS Config for compliance tracking
    // const configConstruct = new ConfigConstruct(
    //   this,
    //   'config',
    //   iam.configRole,
    //   s3.configBucket,
    //   config
    // );

    // 10. Enable VPC Flow Logs for network monitoring
    // Update the flow logs instantiation
    const flowLogs = new VpcFlowLogsConstruct(
      this,
      'flow-logs',
      vpcConstruct.vpc,
      vpcConstruct.flowLogsRole, // Pass the flow logs role
      config
    );

    // 11. Set up CloudWatch monitoring and alarms
    const monitoring = new MonitoringConstruct(
      this,
      'monitoring',
      lambda.lambdaFunction,
      config
    );

    // 12. Enable AWS Shield protection for API Gateway
    new ShieldConstruct(
      this,
      'shield'
      // apiGateway.api, // Pass the API object, not a string
      // config
    );

    // Define outputs for important resource identifiers
    new TerraformOutput(this, 'vpc_id', {
      value: vpcConstruct.vpc.id,
      description: 'ID of the created VPC',
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpcConstruct.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: vpcConstruct.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    new TerraformOutput(this, 's3_bucket_name', {
      value: s3.bucket.bucket,
      description: 'Name of the main S3 bucket',
    });

    new TerraformOutput(this, 's3_config_bucket_name', {
      value: s3.configBucket.bucket,
      description: 'Name of the AWS Config S3 bucket',
    });

    new TerraformOutput(this, 'lambda_function_arn', {
      value: lambda.lambdaFunction.arn,
      description: 'ARN of the Lambda function',
    });

    new TerraformOutput(this, 'lambda_function_name', {
      value: lambda.lambdaFunction.functionName,
      description: 'Name of the Lambda function',
    });

    new TerraformOutput(this, 'api_gateway_url', {
      value: `https://${apiGateway.api.id}.execute-api.${config.region}.amazonaws.com/${config.environment}`,
      description: 'URL of the API Gateway endpoint',
    });

    new TerraformOutput(this, 'api_gateway_id', {
      value: apiGateway.api.id,
      description: 'ID of the API Gateway',
    });

    new TerraformOutput(this, 'rds_endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'RDS database endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'rds_database_name', {
      value: rds.dbInstance.dbName,
      description: 'RDS database name',
    });

    new TerraformOutput(this, 'kms_key_id', {
      value: kms.kmsKey.keyId,
      description: 'ID of the KMS key for encryption',
    });

    new TerraformOutput(this, 'kms_key_alias', {
      value: kms.kmsAlias.name,
      description: 'Alias of the KMS key',
    });

    new TerraformOutput(this, 'waf_acl_arn', {
      value: apiGateway.wafAcl.arn,
      description: 'ARN of the WAF Web ACL protecting the API',
    });

    new TerraformOutput(this, 'cloudwatch_alarm_arns', {
      value: [monitoring.cpuAlarm.arn, monitoring.errorAlarm.arn],
      description: 'ARNs of CloudWatch alarms',
    });

    new TerraformOutput(this, 'sns_topic_arn', {
      value: monitoring.snsTopic.arn,
      description: 'ARN of the SNS topic for alarms',
    });

    new TerraformOutput(this, 'vpc_flow_logs_group', {
      value: flowLogs.logGroup.name,
      description: 'CloudWatch Log Group for VPC Flow Logs',
    });

    new TerraformOutput(this, 'lambda_log_group', {
      value: lambda.logGroup.name,
      description: 'CloudWatch Log Group for Lambda function',
    });

    // new TerraformOutput(this, 'config_recorder_name', {
    //   value: configConstruct.configRecorder.name,
    //   description: 'Name of the AWS Config recorder'
    // });

    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
