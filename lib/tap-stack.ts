import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { ComputeConstruct } from './compute-construct';
import { DatabaseConstruct } from './database-construct';
import { DynamoDbConstruct } from './dynamodb-construct';
import { SecurityConstruct } from './security-construct';
import { StorageConstruct } from './storage-construct';
import { VpcConstruct } from './vpc-construct';
import { readFileSync } from 'fs';

// Add other imports as needed for modular constructs

const region = readFileSync('./lib/AWS_REGION', 'utf-8').trim();

export class TapStack extends TerraformStack {
  constructor(
    scope: Construct,
    id: string,
    _options?: Record<string, unknown>
  ) {
    super(scope, id);
    // You can now use options?.environmentSuffix, options?.defaultTags, etc.

    // VPC setup (multi-region, public/private subnets)
    const vpc = new VpcConstruct(this, 'SecureEnvVpc', {
      prefix: 'secure-env',
      regions: [region],
    });

    // Security (IAM, KMS, least privilege, etc.)
    const security = new SecurityConstruct(this, 'SecureEnvSecurity', {
      prefix: 'secure-env',
      vpc,
    });

    // Compute (EC2, Lambda, logging, public access restrictions)
    new ComputeConstruct(this, 'SecureEnvCompute', {
      prefix: 'secure-env',
      vpc,
      security,
    });

    new DatabaseConstruct(this, 'SecureEnvDatabase', {
      prefix: 'secure-env',
      vpc,
      security,
    });

    new StorageConstruct(this, 'SecureEnvStorage', {
      prefix: 'secure-env',
      security,
    });

    new DynamoDbConstruct(this, 'SecureEnvDynamoDb', {
      prefix: 'secure-env',
      security,
    });

    // Add monitoring, alerting, and other constructs as needed
  }
}
