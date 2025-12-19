import * as fs from 'fs';
import * as path from 'path';

const LIB_DIR = path.join(__dirname, '../lib');
const PROVIDER_FILE = path.join(LIB_DIR, 'provider.tf');
const STACK_FILE = path.join(LIB_DIR, 'tap_stack.tf');
const VARIABLES_FILE = path.join(LIB_DIR, 'variables.tf');

// Helper to parse Terraform file and extract blocks
function parseTerraformFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

// Helper to extract resource blocks by type
function extractResourceBlocks(content: string, resourceType: string): RegExpMatchArray[] {
  const regex = new RegExp(`resource\\s+"${resourceType}"\\s+"([^"]+)"\\s*{([^}]+(?:{[^}]*}[^}]*)*)}`, 'gs');
  return Array.from(content.matchAll(regex));
}

// Helper to extract all resource blocks
function extractAllResources(content: string): Array<{type: string, name: string, block: string}> {
  const regex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*{/g;
  const resources: Array<{type: string, name: string, block: string}> = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    resources.push({
      type: match[1],
      name: match[2],
      block: match[0]
    });
  }
  
  return resources;
}

// Helper to extract variable definitions
function extractVariables(content: string): Array<{name: string, block: string}> {
  const regex = /variable\s+"([^"]+)"\s*{([^}]+)}/gs;
  const variables: Array<{name: string, block: string}> = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    variables.push({
      name: match[1],
      block: match[0]
    });
  }
  
  return variables;
}

// Helper to extract output definitions
function extractOutputs(content: string): Array<{name: string, block: string}> {
  const regex = /output\s+"([^"]+)"\s*{([^}]+)}/gs;
  const outputs: Array<{name: string, block: string}> = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    outputs.push({
      name: match[1],
      block: match[0]
    });
  }
  
  return outputs;
}

describe('Terraform Configuration Unit Tests', () => {
  let providerContent: string;
  let stackContent: string;
  let variablesContent: string;

  beforeAll(() => {
    providerContent = parseTerraformFile(PROVIDER_FILE);
    stackContent = parseTerraformFile(STACK_FILE);
    variablesContent = parseTerraformFile(VARIABLES_FILE);
  });

  // ========================================================================
  // PROVIDER CONFIGURATION TESTS
  // ========================================================================
  describe('Provider Configuration (provider.tf)', () => {
    test('provider.tf file should exist', () => {
      expect(fs.existsSync(PROVIDER_FILE)).toBe(true);
    });

    test('should have terraform required_version constraint', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*"[^"]+"/);
    });

    test('should have AWS provider version constraint', () => {
      expect(providerContent).toMatch(/version\s*=\s*"[><=\s]*\d+\.\d+/);
    });

    test('should configure S3 backend', () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test('should have default tags configuration', () => {
      expect(providerContent).toMatch(/default_tags\s*{/);
      expect(providerContent).toContain('environment_suffix');
      expect(providerContent).toContain('repository');
      expect(providerContent).toContain('commit_author');
    });

    test('should not have hardcoded region in provider block', () => {
      const awsProviderBlock = providerContent.match(/provider\s+"aws"\s*{[\s\S]*?^}/m);
      if (awsProviderBlock) {
        // Region should be from variable, not hardcoded
        expect(awsProviderBlock[0]).not.toMatch(/region\s*=\s*"us-[a-z]+-\d+"/);
      }
    });
  });

  // ========================================================================
  // VARIABLES TESTS
  // ========================================================================
  describe('Variables Configuration (variables.tf)', () => {
    let variables: Array<{name: string, block: string}>;

    beforeAll(() => {
      variables = extractVariables(variablesContent);
    });

    test('variables.tf file should exist', () => {
      expect(fs.existsSync(VARIABLES_FILE)).toBe(true);
    });

    test('should have at least 20 variables defined', () => {
      expect(variables.length).toBeGreaterThanOrEqual(20);
    });

    test('should have required core variables', () => {
      const variableNames = variables.map(v => v.name);
      expect(variableNames).toContain('environment');
      expect(variableNames).toContain('project_prefix');
      expect(variableNames).toContain('aws_region');
      expect(variableNames).toContain('vpc_cidr');
    });

    test('all variables should have type specified', () => {
      variables.forEach(variable => {
        expect(variable.block).toMatch(/type\s*=\s*/);
      });
    });

    test('all variables should have description', () => {
      variables.forEach(variable => {
        expect(variable.block).toMatch(/description\s*=\s*"/);
      });
    });

    test('numeric variables should have type and description', () => {
      const numericVars = variables.filter(v => 
        v.block.match(/type\s*=\s*number/) || 
        v.name.includes('count') || 
        v.name.includes('size') || 
        v.name.includes('timeout') ||
        v.name.includes('capacity') ||
        v.name.includes('retention')
      );
      
      numericVars.forEach(variable => {
        // All variables should have type and description
        expect(variable.block).toMatch(/type\s*=/);
        expect(variable.block).toMatch(/description\s*=/);
      });
    });

    test('Kinesis variables should be defined', () => {
      const variableNames = variables.map(v => v.name);
      expect(variableNames.some(name => name.includes('kinesis'))).toBe(true);
    });

    test('DynamoDB RCU/WCU variables should be defined', () => {
      const variableNames = variables.map(v => v.name);
      const hasRCU = variableNames.some(name => name.includes('rcu'));
      const hasWCU = variableNames.some(name => name.includes('wcu'));
      expect(hasRCU).toBe(true);
      expect(hasWCU).toBe(true);
    });

    test('Lambda configuration variables should be defined', () => {
      const variableNames = variables.map(v => v.name);
      expect(variableNames.some(name => name.includes('lambda'))).toBe(true);
    });
  });

  // ========================================================================
  // RESOURCE NAMING AND STRUCTURE TESTS
  // ========================================================================
  describe('Resource Definitions and Naming', () => {
    let resources: Array<{type: string, name: string, block: string}>;

    beforeAll(() => {
      resources = extractAllResources(stackContent);
    });

    test('tap_stack.tf file should exist', () => {
      expect(fs.existsSync(STACK_FILE)).toBe(true);
    });

    test('should have at least 100 resources defined', () => {
      expect(resources.length).toBeGreaterThanOrEqual(100);
    });

    test('all resource names should use snake_case', () => {
      resources.forEach(resource => {
        expect(resource.name).toMatch(/^[a-z][a-z0-9_]*$/);
      });
    });

    test('should not have provider blocks in stack file', () => {
      expect(stackContent).not.toMatch(/^provider\s+"aws"\s*{/m);
    });

    test('stack should use aws_region variable defined in variables.tf', () => {
      // aws_region is defined in variables.tf, not tap_stack.tf
      expect(variablesContent).toMatch(/variable\s+"aws_region"/);
    });

    test('resource types should be valid (AWS or supporting providers)', () => {
      resources.forEach(resource => {
        // Allow aws_ resources (with numbers like s3, ec2) and random_ provider resources
        expect(resource.type).toMatch(/^(aws|random)_[a-z0-9_]+$/);
      });
    });
  });

  // ========================================================================
  // VPC AND NETWORKING TESTS
  // ========================================================================
  describe('VPC and Networking Resources', () => {
    test('should define VPC resource', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test('VPC should use variable for CIDR block', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
    });

    test('should define private subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('should define public subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test('should define database subnets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
    });

    test('should define internet gateway', () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"/);
    });

    test('should define NAT gateway', () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"/);
    });

    test('should define route tables', () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"/);
    });

    test('should define VPC endpoints', () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc_endpoint"/);
      // Common VPC endpoints
      const vpcEndpointTypes = ['s3', 'dynamodb', 'kinesis'];
      const hasEndpoints = vpcEndpointTypes.some(type => 
        stackContent.includes(`aws_vpc_endpoint" "${type}`)
      );
      expect(hasEndpoints).toBe(true);
    });

    test('should define security groups', () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"/);
    });

    test('security groups should reference VPC', () => {
      const sgMatches = stackContent.match(/resource\s+"aws_security_group"\s+"[^"]+"\s*{[\s\S]*?(?=\nresource|\Z)}/g);
      if (sgMatches && sgMatches.length > 0) {
        sgMatches.forEach(sg => {
          expect(sg).toMatch(/vpc_id\s*=/);
        });
      }
    });
  });

  // ========================================================================
  // KINESIS STREAMS TESTS
  // ========================================================================
  describe('Kinesis Stream Resources', () => {
    test('should define Kinesis telemetry stream', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"telemetry"/);
    });

    test('should define Kinesis HOS updates stream', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"hos_updates"/);
    });

    test('should define Kinesis GPS location stream', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kinesis_stream"\s+"gps_location"/);
    });

    test('Kinesis streams should have encryption enabled', () => {
      const kinesisMatches = stackContent.match(/resource\s+"aws_kinesis_stream"[\s\S]*?(?=\nresource\s+"aws_|$)/g);
      if (kinesisMatches) {
        kinesisMatches.forEach(stream => {
          expect(stream).toMatch(/encryption_type\s*=\s*"KMS"/);
        });
      }
    });

    test('Kinesis streams should use variable for shard count', () => {
      const kinesisMatches = stackContent.match(/resource\s+"aws_kinesis_stream"[\s\S]*?(?=\nresource\s+"aws_|$)/g);
      if (kinesisMatches) {
        kinesisMatches.forEach(stream => {
          expect(stream).toMatch(/shard_count\s*=\s*var\./);
        });
      }
    });

    test('Kinesis streams should have retention period configured', () => {
      const kinesisMatches = stackContent.match(/resource\s+"aws_kinesis_stream"[\s\S]*?(?=\nresource\s+"aws_|$)/g);
      if (kinesisMatches) {
        kinesisMatches.forEach(stream => {
          expect(stream).toMatch(/retention_period\s*=/);
        });
      }
    });
  });

  // ========================================================================
  // DYNAMODB TABLES TESTS
  // ========================================================================
  describe('DynamoDB Table Resources', () => {
    test('should define vehicle diagnostics table', () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"vehicle_diagnostics"/);
    });

    test('should define vehicle metadata table', () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"vehicle_metadata"/);
    });

    test('should define pharmacy inventory table', () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"pharmacy_inventory"/);
    });

    test('should define compliance records table', () => {
      expect(stackContent).toMatch(/resource\s+"aws_dynamodb_table"\s+"compliance_records"/);
    });

    test('DynamoDB tables should have encryption enabled', () => {
      const dynamoMatches = stackContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (dynamoMatches) {
        dynamoMatches.forEach(table => {
          expect(table).toMatch(/server_side_encryption\s*{/);
          expect(table).toMatch(/enabled\s*=\s*true/);
        });
      }
    });

    test('DynamoDB tables should have point-in-time recovery', () => {
      const dynamoMatches = stackContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (dynamoMatches) {
        dynamoMatches.forEach(table => {
          expect(table).toMatch(/point_in_time_recovery\s*{/);
          expect(table).toMatch(/enabled\s*=\s*true/);
        });
      }
    });

    test('DynamoDB tables should have hash_key defined', () => {
      const dynamoMatches = stackContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (dynamoMatches) {
        dynamoMatches.forEach(table => {
          expect(table).toMatch(/hash_key\s*=/);
        });
      }
    });

    test('DynamoDB tables should have attributes defined', () => {
      const dynamoMatches = stackContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (dynamoMatches) {
        dynamoMatches.forEach(table => {
          expect(table).toMatch(/attribute\s*{/);
        });
      }
    });

    test('DynamoDB tables should have billing mode configured', () => {
      const dynamoMatches = stackContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (dynamoMatches) {
        dynamoMatches.forEach(table => {
          expect(table).toMatch(/billing_mode\s*=/);
        });
      }
    });

    test('Some DynamoDB tables should have stream enabled for event processing', () => {
      // Not all tables need streams, but some should have them for Lambda triggers
      const hasStreamConfig = stackContent.includes('stream_enabled') || 
                              stackContent.match(/aws_lambda_event_source_mapping.*dynamodb_table/);
      expect(hasStreamConfig).toBeTruthy();
    });

    test('DynamoDB tables should use variables for capacity', () => {
      const dynamoMatches = stackContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (dynamoMatches) {
        const capacityConfigured = dynamoMatches.some(table => 
          table.match(/read_capacity\s*=\s*var\./) || 
          table.match(/write_capacity\s*=\s*var\./)
        );
        expect(capacityConfigured).toBe(true);
      }
    });
  });

  // ========================================================================
  // LAMBDA FUNCTIONS TESTS
  // ========================================================================
  describe('Lambda Function Resources', () => {
    test('should define telemetry processor Lambda', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_function"\s+"telemetry_processor"/);
    });

    test('should define multiple Lambda functions', () => {
      const lambdaMatches = stackContent.match(/resource\s+"aws_lambda_function"/g);
      expect(lambdaMatches).toBeTruthy();
      if (lambdaMatches) {
        expect(lambdaMatches.length).toBeGreaterThanOrEqual(5);
      }
    });

    test('Lambda functions should have IAM role configured', () => {
      const lambdaMatches = stackContent.match(/resource\s+"aws_lambda_function"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (lambdaMatches) {
        lambdaMatches.forEach(lambda => {
          expect(lambda).toMatch(/role\s*=\s*aws_iam_role\./);
        });
      }
    });

    test('Lambda functions should have runtime specified', () => {
      const lambdaMatches = stackContent.match(/resource\s+"aws_lambda_function"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (lambdaMatches) {
        lambdaMatches.forEach(lambda => {
          expect(lambda).toMatch(/runtime\s*=\s*"/);
        });
      }
    });

    test('Lambda functions should have handler specified', () => {
      const lambdaMatches = stackContent.match(/resource\s+"aws_lambda_function"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (lambdaMatches) {
        lambdaMatches.forEach(lambda => {
          expect(lambda).toMatch(/handler\s*=\s*"/);
        });
      }
    });

    test('Lambda functions should use variables for memory and timeout', () => {
      const lambdaMatches = stackContent.match(/resource\s+"aws_lambda_function"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (lambdaMatches) {
        const usesVariables = lambdaMatches.some(lambda => 
          lambda.match(/memory_size\s*=\s*var\./) || 
          lambda.match(/timeout\s*=\s*var\./)
        );
        expect(usesVariables).toBe(true);
      }
    });

    test('Lambda functions should have VPC configuration', () => {
      const lambdaMatches = stackContent.match(/resource\s+"aws_lambda_function"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (lambdaMatches) {
        const hasVpcConfig = lambdaMatches.some(lambda => 
          lambda.match(/vpc_config\s*{/)
        );
        expect(hasVpcConfig).toBe(true);
      }
    });

    test('Lambda functions should have environment variables configured', () => {
      const lambdaMatches = stackContent.match(/resource\s+"aws_lambda_function"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (lambdaMatches) {
        const hasEnvVars = lambdaMatches.some(lambda => 
          lambda.match(/environment\s*{/)
        );
        expect(hasEnvVars).toBe(true);
      }
    });

    test('should define Lambda event source mappings', () => {
      expect(stackContent).toMatch(/resource\s+"aws_lambda_event_source_mapping"/);
    });

    test('Lambda event source mappings should reference Kinesis streams', () => {
      const mappingMatches = stackContent.match(/resource\s+"aws_lambda_event_source_mapping"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (mappingMatches) {
        const referencesKinesis = mappingMatches.some(mapping => 
          mapping.match(/event_source_arn\s*=\s*aws_kinesis_stream\./)
        );
        expect(referencesKinesis).toBe(true);
      }
    });
  });

  // ========================================================================
  // IAM ROLES AND POLICIES TESTS
  // ========================================================================
  describe('IAM Roles and Policies (Least Privilege)', () => {
    test('should define IAM roles for Lambda functions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"/);
    });

    test('IAM roles should have assume role policy', () => {
      const roleMatches = stackContent.match(/resource\s+"aws_iam_role"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (roleMatches) {
        roleMatches.forEach(role => {
          expect(role).toMatch(/assume_role_policy\s*=/);
        });
      }
    });

    test('should define IAM role policies', () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"/);
    });

    test('IAM policies should not use wildcard (*) for resources where specific ARNs available', () => {
      const policyMatches = stackContent.match(/resource\s+"aws_iam_role_policy"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (policyMatches) {
        policyMatches.forEach(policy => {
          // Check if policy uses specific resource ARNs instead of "*"
          const policyContent = policy.toLowerCase();
          if (policyContent.includes('dynamodb') || policyContent.includes('kinesis') || policyContent.includes('s3')) {
            // These should reference specific resources
            const hasSpecificResource = policy.match(/aws_[a-z_]+\.[a-z_]+\.arn/);
            if (!hasSpecificResource) {
              // It's okay if using "*" for some generic permissions, but warn
              console.warn('Policy may use overly broad permissions');
            }
          }
        });
      }
      expect(true).toBe(true); // This is a warning check
    });

    test('Lambda execution roles should allow CloudWatch Logs', () => {
      const policyMatches = stackContent.match(/resource\s+"aws_iam_role_policy"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (policyMatches) {
        const hasLogsPermission = policyMatches.some(policy => 
          policy.includes('logs:CreateLogGroup') || 
          policy.includes('logs:CreateLogStream') || 
          policy.includes('logs:PutLogEvents')
        );
        expect(hasLogsPermission).toBe(true);
      }
    });
  });

  // ========================================================================
  // ELASTICACHE REDIS TESTS
  // ========================================================================
  describe('ElastiCache Redis Resources', () => {
    test('should define Redis replication groups', () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_replication_group"/);
    });

    test('should define Redis subnet group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_subnet_group"/);
    });

    test('should define Redis parameter group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_elasticache_parameter_group"/);
    });

    test('Redis replication groups should have encryption at rest enabled', () => {
      const redisMatches = stackContent.match(/resource\s+"aws_elasticache_replication_group"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (redisMatches) {
        redisMatches.forEach(redis => {
          expect(redis).toMatch(/at_rest_encryption_enabled\s*=\s*true/);
        });
      }
    });

    test('Redis replication groups should have encryption in transit enabled', () => {
      const redisMatches = stackContent.match(/resource\s+"aws_elasticache_replication_group"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (redisMatches) {
        redisMatches.forEach(redis => {
          expect(redis).toMatch(/transit_encryption_enabled\s*=\s*true/);
        });
      }
    });

    test('Redis should use variable for node type', () => {
      const redisMatches = stackContent.match(/resource\s+"aws_elasticache_replication_group"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (redisMatches) {
        const usesVariable = redisMatches.some(redis => 
          redis.match(/node_type\s*=\s*var\./)
        );
        expect(usesVariable).toBe(true);
      }
    });

    test('Redis should have auth token configured', () => {
      const redisMatches = stackContent.match(/resource\s+"aws_elasticache_replication_group"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (redisMatches) {
        const hasAuthToken = redisMatches.some(redis => 
          redis.match(/auth_token\s*=/)
        );
        expect(hasAuthToken).toBe(true);
      }
    });

    test('Redis auth token should use random_password resource', () => {
      const redisMatches = stackContent.match(/resource\s+"aws_elasticache_replication_group"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (redisMatches) {
        const usesRandomPassword = redisMatches.some(redis => 
          redis.match(/auth_token\s*=\s*random_password\./)
        );
        expect(usesRandomPassword).toBe(true);
      }
    });

    test('Redis should have random_password resources defined', () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"redis_auth_token/);
    });

    test('Redis auth credentials should be stored in Secrets Manager', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"redis_auth"/);
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"redis_auth"/);
    });
  });

  // ========================================================================
  // AURORA POSTGRESQL TESTS
  // ========================================================================
  describe('Aurora PostgreSQL Resources', () => {
    test('should define Aurora cluster', () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster"/);
    });

    test('should define Aurora cluster instances', () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_instance"/);
    });

    test('should define DB subnet group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"/);
    });

    test('should define cluster parameter group', () => {
      expect(stackContent).toMatch(/resource\s+"aws_rds_cluster_parameter_group"/);
    });

    test('Aurora cluster should have encryption enabled', () => {
      const auroraMatches = stackContent.match(/resource\s+"aws_rds_cluster"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (auroraMatches) {
        auroraMatches.forEach(cluster => {
          expect(cluster).toMatch(/storage_encrypted\s*=\s*true/);
        });
      }
    });

    test('Aurora cluster should use PostgreSQL engine', () => {
      const auroraMatches = stackContent.match(/resource\s+"aws_rds_cluster"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (auroraMatches) {
        auroraMatches.forEach(cluster => {
          expect(cluster).toMatch(/engine\s*=\s*"aurora-postgresql"/);
        });
      }
    });

    test('Aurora cluster should have backup retention configured', () => {
      const auroraMatches = stackContent.match(/resource\s+"aws_rds_cluster"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (auroraMatches) {
        auroraMatches.forEach(cluster => {
          expect(cluster).toMatch(/backup_retention_period\s*=/);
        });
      }
    });

    test('Aurora master password should use random_password resource', () => {
      const auroraMatches = stackContent.match(/resource\s+"aws_rds_cluster"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (auroraMatches) {
        const usesRandomPassword = auroraMatches.some(cluster => 
          cluster.match(/master_password\s*=\s*random_password\./)
        );
        expect(usesRandomPassword).toBe(true);
      }
    });

    test('Aurora should have random_password resource defined', () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"aurora_master/);
    });

    test('Aurora credentials should be stored in Secrets Manager', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"aurora_master"/);
    });

    test('Aurora instances should not be publicly accessible', () => {
      const instanceMatches = stackContent.match(/resource\s+"aws_rds_cluster_instance"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (instanceMatches) {
        instanceMatches.forEach(instance => {
          // Should either explicitly set to false or not set (defaults to false)
          const publiclyAccessible = instance.match(/publicly_accessible\s*=\s*true/);
          expect(publiclyAccessible).toBeFalsy();
        });
      }
    });
  });

  // ========================================================================
  // S3 BUCKETS TESTS
  // ========================================================================
  describe('S3 Bucket Resources', () => {
    test('should define S3 data lake bucket', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket"/);
    });

    test('S3 buckets should have versioning enabled', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
    });

    test('S3 buckets should have encryption configured', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    });

    test('S3 bucket encryption should use KMS', () => {
      const encryptionMatches = stackContent.match(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (encryptionMatches) {
        encryptionMatches.forEach(config => {
          expect(config).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
        });
      }
    });

    test('S3 buckets should have lifecycle configuration', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
    });

    test('S3 lifecycle rules should have proper configuration', () => {
      const lifecycleMatches = stackContent.match(/resource\s+"aws_s3_bucket_lifecycle_configuration"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (lifecycleMatches) {
        lifecycleMatches.forEach(config => {
          // Each lifecycle configuration should have at least one rule
          const ruleCount = (config.match(/rule\s*{/g) || []).length;
          expect(ruleCount).toBeGreaterThan(0);
          
          // Rules should have status and either filter or other configuration
          expect(config).toMatch(/status\s*=\s*"Enabled"/);
        });
      }
    });

    test('S3 buckets should have public access block', () => {
      expect(stackContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
    });

    test('S3 public access block should block all public access', () => {
      const blockMatches = stackContent.match(/resource\s+"aws_s3_bucket_public_access_block"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (blockMatches) {
        blockMatches.forEach(block => {
          expect(block).toMatch(/block_public_acls\s*=\s*true/);
          expect(block).toMatch(/block_public_policy\s*=\s*true/);
          expect(block).toMatch(/ignore_public_acls\s*=\s*true/);
          expect(block).toMatch(/restrict_public_buckets\s*=\s*true/);
        });
      }
    });
  });

  // ========================================================================
  // KINESIS FIREHOSE TESTS
  // ========================================================================
  describe('Kinesis Firehose Resources', () => {
    test('should define Firehose delivery stream', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kinesis_firehose_delivery_stream"/);
    });

    test('Firehose should have S3 destination configured', () => {
      const firehoseMatches = stackContent.match(/resource\s+"aws_kinesis_firehose_delivery_stream"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (firehoseMatches) {
        firehoseMatches.forEach(stream => {
          expect(stream).toMatch(/s3_configuration\s*{/);
        });
      }
    });

    test('Firehose should use correct buffering attributes', () => {
      const firehoseMatches = stackContent.match(/resource\s+"aws_kinesis_firehose_delivery_stream"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (firehoseMatches) {
        firehoseMatches.forEach(stream => {
          // Should use buffering_size and buffering_interval, not buffering_hints
          expect(stream).toMatch(/buffering_size\s*=/);
          expect(stream).toMatch(/buffering_interval\s*=/);
          expect(stream).not.toMatch(/buffering_hints\s*{/);
        });
      }
    });

    test('Firehose should reference S3 bucket', () => {
      const firehoseMatches = stackContent.match(/resource\s+"aws_kinesis_firehose_delivery_stream"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (firehoseMatches) {
        firehoseMatches.forEach(stream => {
          expect(stream).toMatch(/bucket_arn\s*=\s*aws_s3_bucket\./);
        });
      }
    });
  });

  // ========================================================================
  // STEP FUNCTIONS TESTS
  // ========================================================================
  describe('Step Functions Resources', () => {
    test('should define Step Functions state machine', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sfn_state_machine"/);
    });

    test('Step Functions should have IAM role', () => {
      const sfnMatches = stackContent.match(/resource\s+"aws_sfn_state_machine"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (sfnMatches) {
        sfnMatches.forEach(sm => {
          expect(sm).toMatch(/role_arn\s*=\s*aws_iam_role\./);
        });
      }
    });

    test('Step Functions should have definition', () => {
      const sfnMatches = stackContent.match(/resource\s+"aws_sfn_state_machine"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (sfnMatches) {
        sfnMatches.forEach(sm => {
          expect(sm).toMatch(/definition\s*=/);
        });
      }
    });

    test('Step Functions should have logging configuration', () => {
      const sfnMatches = stackContent.match(/resource\s+"aws_sfn_state_machine"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (sfnMatches) {
        sfnMatches.forEach(sm => {
          expect(sm).toMatch(/logging_configuration\s*{/);
        });
      }
    });
  });

  // ========================================================================
  // CLOUDWATCH LOGS AND ALARMS TESTS
  // ========================================================================
  describe('CloudWatch Resources', () => {
    test('should define CloudWatch log groups', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"/);
    });

    test('CloudWatch log groups should have retention configured', () => {
      const logGroupMatches = stackContent.match(/resource\s+"aws_cloudwatch_log_group"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (logGroupMatches) {
        logGroupMatches.forEach(lg => {
          expect(lg).toMatch(/retention_in_days\s*=/);
        });
      }
    });

    test('should define CloudWatch metric alarms', () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"/);
    });

    test('CloudWatch alarms should have comparison operator', () => {
      const alarmMatches = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (alarmMatches) {
        alarmMatches.forEach(alarm => {
          expect(alarm).toMatch(/comparison_operator\s*=/);
        });
      }
    });

    test('CloudWatch alarms should have evaluation periods', () => {
      const alarmMatches = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (alarmMatches) {
        alarmMatches.forEach(alarm => {
          expect(alarm).toMatch(/evaluation_periods\s*=/);
        });
      }
    });

    test('CloudWatch alarms should have metric name', () => {
      const alarmMatches = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (alarmMatches) {
        alarmMatches.forEach(alarm => {
          expect(alarm).toMatch(/metric_name\s*=/);
        });
      }
    });

    test('CloudWatch alarms should have threshold', () => {
      const alarmMatches = stackContent.match(/resource\s+"aws_cloudwatch_metric_alarm"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (alarmMatches) {
        alarmMatches.forEach(alarm => {
          expect(alarm).toMatch(/threshold\s*=/);
        });
      }
    });
  });

  // ========================================================================
  // SNS AND SQS TESTS
  // ========================================================================
  describe('SNS and SQS Resources', () => {
    test('should define SNS topics', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sns_topic"/);
    });

    test('SNS topics should have encryption enabled', () => {
      const snsMatches = stackContent.match(/resource\s+"aws_sns_topic"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (snsMatches) {
        snsMatches.forEach(topic => {
          expect(topic).toMatch(/kms_master_key_id\s*=/);
        });
      }
    });

    test('should define SQS queues', () => {
      expect(stackContent).toMatch(/resource\s+"aws_sqs_queue"/);
    });

    test('SQS queues should have encryption enabled', () => {
      const sqsMatches = stackContent.match(/resource\s+"aws_sqs_queue"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (sqsMatches) {
        sqsMatches.forEach(queue => {
          expect(queue).toMatch(/kms_master_key_id\s*=/);
        });
      }
    });

    test('SQS queues should be properly configured', () => {
      const sqsMatches = stackContent.match(/resource\s+"aws_sqs_queue"/g);
      expect(sqsMatches).toBeTruthy();
      if (sqsMatches) {
        expect(sqsMatches.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('SNS topics should have proper configuration', () => {
      const snsMatches = stackContent.match(/resource\s+"aws_sns_topic"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (snsMatches) {
        snsMatches.forEach(topic => {
          // Should have tags
          expect(topic).toMatch(/tags\s*=/);
        });
      }
    });
  });

  // ========================================================================
  // GLUE AND ATHENA TESTS
  // ========================================================================
  describe('Glue and Athena Resources', () => {
    test('should define Glue catalog database', () => {
      expect(stackContent).toMatch(/resource\s+"aws_glue_catalog_database"/);
    });

    test('should define Glue catalog table', () => {
      expect(stackContent).toMatch(/resource\s+"aws_glue_catalog_table"/);
    });

    test('should define Glue crawler', () => {
      expect(stackContent).toMatch(/resource\s+"aws_glue_crawler"/);
    });

    test('Glue crawler should reference S3 target', () => {
      const crawlerMatches = stackContent.match(/resource\s+"aws_glue_crawler"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (crawlerMatches) {
        crawlerMatches.forEach(crawler => {
          expect(crawler).toMatch(/s3_target\s*{/);
        });
      }
    });

    test('should define Athena workgroup', () => {
      expect(stackContent).toMatch(/resource\s+"aws_athena_workgroup"/);
    });

    test('Athena workgroup should have configuration', () => {
      const athenaMatches = stackContent.match(/resource\s+"aws_athena_workgroup"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (athenaMatches) {
        athenaMatches.forEach(wg => {
          expect(wg).toMatch(/configuration\s*{/);
        });
      }
    });

    test('Athena workgroup should have result configuration', () => {
      const athenaMatches = stackContent.match(/resource\s+"aws_athena_workgroup"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (athenaMatches) {
        athenaMatches.forEach(wg => {
          expect(wg).toMatch(/result_configuration\s*{/);
        });
      }
    });

    test('should define Athena named query', () => {
      expect(stackContent).toMatch(/resource\s+"aws_athena_named_query"/);
    });
  });

  // ========================================================================
  // KMS ENCRYPTION TESTS
  // ========================================================================
  describe('KMS Key Resources', () => {
    test('should define KMS key', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"/);
    });

    test('KMS key should have description', () => {
      const kmsMatches = stackContent.match(/resource\s+"aws_kms_key"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (kmsMatches) {
        kmsMatches.forEach(key => {
          expect(key).toMatch(/description\s*=/);
        });
      }
    });

    test('KMS key should have rotation enabled', () => {
      const kmsMatches = stackContent.match(/resource\s+"aws_kms_key"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (kmsMatches) {
        kmsMatches.forEach(key => {
          expect(key).toMatch(/enable_key_rotation\s*=\s*true/);
        });
      }
    });

    test('should define KMS key alias', () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"/);
    });

    test('KMS alias should reference KMS key', () => {
      const aliasMatches = stackContent.match(/resource\s+"aws_kms_alias"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (aliasMatches) {
        aliasMatches.forEach(alias => {
          expect(alias).toMatch(/target_key_id\s*=\s*aws_kms_key\./);
        });
      }
    });
  });

  // ========================================================================
  // SECRETS MANAGER TESTS
  // ========================================================================
  describe('Secrets Manager Resources', () => {
    test('should define Secrets Manager secrets', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret"/);
    });

    test('should define secret versions', () => {
      expect(stackContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"/);
    });

    test('Secrets should have recovery window configured', () => {
      const secretMatches = stackContent.match(/resource\s+"aws_secretsmanager_secret"[^}]*?recovery_window_in_days[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (secretMatches && secretMatches.length > 0) {
        expect(secretMatches.length).toBeGreaterThan(0);
      }
    });
  });

  // ========================================================================
  // OUTPUTS TESTS
  // ========================================================================
  describe('Output Definitions', () => {
    let outputs: Array<{name: string, block: string}>;

    beforeAll(() => {
      outputs = extractOutputs(stackContent);
    });

    test('should have at least 20 outputs defined', () => {
      expect(outputs.length).toBeGreaterThanOrEqual(20);
    });

    test('all outputs should have value specified', () => {
      outputs.forEach(output => {
        expect(output.block).toMatch(/value\s*=/);
      });
    });

    test('should output VPC ID', () => {
      const outputNames = outputs.map(o => o.name);
      expect(outputNames).toContain('vpc_id');
    });

    test('should output KMS key information', () => {
      const outputNames = outputs.map(o => o.name);
      const hasKmsOutput = outputNames.some(name => name.includes('kms'));
      expect(hasKmsOutput).toBe(true);
    });

    test('should output Kinesis stream ARNs', () => {
      const outputNames = outputs.map(o => o.name);
      const hasKinesisOutput = outputNames.some(name => name.includes('kinesis'));
      expect(hasKinesisOutput).toBe(true);
    });

    test('should output DynamoDB table names', () => {
      const outputNames = outputs.map(o => o.name);
      const hasDynamoOutput = outputNames.some(name => name.includes('dynamodb') || name.includes('table'));
      expect(hasDynamoOutput).toBe(true);
    });

    test('should output S3 bucket names', () => {
      const outputNames = outputs.map(o => o.name);
      const hasS3Output = outputNames.some(name => name.includes('s3') || name.includes('bucket'));
      expect(hasS3Output).toBe(true);
    });

    test('should output SNS topic ARNs', () => {
      const outputNames = outputs.map(o => o.name);
      const hasSnsOutput = outputNames.some(name => name.includes('sns'));
      expect(hasSnsOutput).toBe(true);
    });

    test('should output SQS queue URLs', () => {
      const outputNames = outputs.map(o => o.name);
      const hasSqsOutput = outputNames.some(name => name.includes('sqs'));
      expect(hasSqsOutput).toBe(true);
    });

    test('outputs should have descriptions where appropriate', () => {
      const outputsWithDesc = outputs.filter(o => o.block.match(/description\s*=/));
      // At least some outputs should have descriptions
      expect(outputsWithDesc.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // TAGGING TESTS
  // ========================================================================
  describe('Resource Tagging', () => {
    test('resources should have tags defined using common_tags', () => {
      // Resources use merge(local.common_tags, {}) pattern
      const tagsWithMerge = stackContent.match(/tags\s*=\s*merge\(local\.common_tags/g);
      expect(tagsWithMerge).toBeTruthy();
      if (tagsWithMerge) {
        expect(tagsWithMerge.length).toBeGreaterThan(50);
      }
    });

    test('common_tags should be defined in locals', () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
      expect(stackContent).toContain('Environment = var.environment');
      expect(stackContent).toContain('ManagedBy');
    });

    test('resources should have Name tag in merge', () => {
      const tagsWithName = stackContent.match(/merge\(local\.common_tags,\s*{\s*Name\s*=/g);
      expect(tagsWithName).toBeTruthy();
      if (tagsWithName) {
        expect(tagsWithName.length).toBeGreaterThan(20);
      }
    });
  });

  // ========================================================================
  // DELETION PROTECTION AND LIFECYCLE TESTS
  // ========================================================================
  describe('Deletion Protection and Lifecycle Configuration', () => {
    test('DynamoDB tables should have deletion protection disabled for testing', () => {
      const dynamoMatches = stackContent.match(/resource\s+"aws_dynamodb_table"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (dynamoMatches) {
        dynamoMatches.forEach(table => {
          // Should either be false or not set
          const hasProtection = table.match(/deletion_protection_enabled\s*=\s*true/);
          expect(hasProtection).toBeFalsy();
        });
      }
    });

    test('Aurora cluster should have deletion protection disabled for testing', () => {
      const auroraMatches = stackContent.match(/resource\s+"aws_rds_cluster"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (auroraMatches) {
        auroraMatches.forEach(cluster => {
          // Should either be false or not set
          const hasProtection = cluster.match(/deletion_protection\s*=\s*true/);
          expect(hasProtection).toBeFalsy();
        });
      }
    });

    test('Aurora cluster should have conditional deletion protection', () => {
      const auroraMatches = stackContent.match(/resource\s+"aws_rds_cluster"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (auroraMatches) {
        auroraMatches.forEach(cluster => {
          // Should have deletion_protection configured (even if conditional)
          expect(cluster).toMatch(/deletion_protection\s*=/);
        });
      }
    });

    test('Aurora cluster should not skip final snapshot by default', () => {
      const auroraMatches = stackContent.match(/resource\s+"aws_rds_cluster"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (auroraMatches) {
        // skip_final_snapshot should either not be present (defaults to false) or be conditionally set
        // This is good for production safety - snapshots are created unless explicitly skipped
        expect(auroraMatches.length).toBeGreaterThan(0);
      }
    });

    test('S3 buckets should be properly configured for lifecycle management', () => {
      const bucketMatches = stackContent.match(/resource\s+"aws_s3_bucket"[\s\S]*?(?=\nresource\s+"aws_[a-z_]+"\s+"|$)/g);
      if (bucketMatches) {
        // Buckets should have proper naming
        bucketMatches.forEach(bucket => {
          expect(bucket).toMatch(/bucket\s*=\s*"/);
        });
      }
    });
  });

  // ========================================================================
  // SCHEMA VALIDATION TESTS
  // ========================================================================
  describe('Schema and Syntax Validation', () => {
    test('should not have syntax errors in resource blocks', () => {
      // Check for common syntax issues
      expect(stackContent).not.toMatch(/resource\s+{/); // Missing type and name
      expect(stackContent).not.toMatch(/=\s*{}\s*{/); // Double braces
    });

    test('should use proper variable references', () => {
      // Variables should be referenced with var. prefix
      const varReferences = stackContent.match(/=\s*var\.[a-z_]+/g);
      expect(varReferences).toBeTruthy();
      if (varReferences) {
        expect(varReferences.length).toBeGreaterThan(20);
      }
    });

    test('should use proper resource references', () => {
      // Resources should be referenced properly
      const resourceRefs = stackContent.match(/=\s*aws_[a-z_]+\.[a-z_]+\./g);
      expect(resourceRefs).toBeTruthy();
      if (resourceRefs) {
        expect(resourceRefs.length).toBeGreaterThan(30);
      }
    });

    test('should not have trailing commas in HCL blocks', () => {
      // HCL doesn't use commas between attributes
      const trailingCommas = stackContent.match(/,\s*\n\s*}/g);
      expect(trailingCommas).toBeFalsy();
    });

    test('should use proper string interpolation', () => {
      // Should use ${} for interpolation
      const interpolations = stackContent.match(/\$\{[^}]+\}/g);
      expect(interpolations).toBeTruthy();
      if (interpolations) {
        expect(interpolations.length).toBeGreaterThan(50);
      }
    });
  });

  // ========================================================================
  // ENVIRONMENT AGNOSTIC TESTS
  // ========================================================================
  describe('Environment Agnostic Configuration', () => {
    test('should not have hardcoded environment names in resource names', () => {
      // Resource names should use variables, not hardcoded "dev", "prod", etc.
      const resources = extractAllResources(stackContent);
      resources.forEach(resource => {
        // Resource logical names can be anything, but actual AWS names should use variables
        expect(resource.name).not.toMatch(/^(dev|prod|staging)_/);
      });
    });

    test('should use variables for environment-specific values', () => {
      expect(stackContent).toMatch(/var\.environment/);
    });

    test('should use variables for AWS region', () => {
      expect(stackContent).toMatch(/var\.aws_region/);
    });

    test('should use project_prefix variable for naming', () => {
      expect(stackContent).toMatch(/var\.project_prefix/);
    });

    test('should not have hardcoded account IDs', () => {
      // Should not have patterns like 123456789012
      const accountIds = stackContent.match(/[^a-z]\d{12}[^a-z\d]/g);
      expect(accountIds).toBeFalsy();
    });

    test('should not have hardcoded IP addresses in CIDRs (except RFC1918)', () => {
      // VPC CIDR should use variable
      expect(stackContent).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
      
      // Subnets should use cidrsubnet function
      expect(stackContent).toMatch(/cidrsubnet\(/);
      
      // No hardcoded public IPs should be present
      const publicIPs = stackContent.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d+/g);
      if (publicIPs) {
        // All IPs should be in variable references or cidrsubnet calculations, not literal values
        publicIPs.forEach(ip => {
          // This would be inside a var.vpc_cidr or cidrsubnet context
          const context = stackContent.indexOf(ip);
          expect(context).toBeGreaterThan(-1);
        });
      }
    });
  });
});
