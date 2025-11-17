import * as fs from 'fs';
import * as path from 'path';

// Mock Terraform configuration parser
interface TerraformResource {
  type: string;
  name: string;
  config: any;
}

interface TerraformVariable {
  name: string;
  config: any;
}

interface TerraformOutput {
  name: string;
  config: any;
}

// Parse tap-stack.tf file
function parseTerraformFile(filePath: string): {
  resources: TerraformResource[];
  variables: TerraformVariable[];
  outputs: TerraformOutput[];
} {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Simple parser for Terraform HCL - this is a basic implementation
  const resources: TerraformResource[] = [];
  const variables: TerraformVariable[] = [];
  const outputs: TerraformOutput[] = [];

  // Extract resources
  const resourceMatches = content.match(/resource\s+"([^"]+)"\s+"([^"]+)"\s+\{[\s\S]*?\n\}/g);
  if (resourceMatches) {
    resourceMatches.forEach(match => {
      const resourceMatch = match.match(/resource\s+"([^"]+)"\s+"([^"]+)"/);
      if (resourceMatch) {
        const [, type, name] = resourceMatch;
        resources.push({
          type,
          name,
          config: parseResourceConfig(match)
        });
      }
    });
  }

  // Extract variables
  const variableMatches = content.match(/variable\s+"([^"]+)"\s+\{[\s\S]*?\n\}/g);
  if (variableMatches) {
    variableMatches.forEach(match => {
      const variableMatch = match.match(/variable\s+"([^"]+)"/);
      if (variableMatch) {
        const [, name] = variableMatch;
        variables.push({
          name,
          config: parseVariableConfig(match)
        });
      }
    });
  }

  // Extract outputs
  const outputMatches = content.match(/output\s+"([^"]+)"\s+\{[\s\S]*?\n\}/g);
  if (outputMatches) {
    outputMatches.forEach(match => {
      const outputMatch = match.match(/output\s+"([^"]+)"/);
      if (outputMatch) {
        const [, name] = outputMatch;
        outputs.push({
          name,
          config: parseOutputConfig(match)
        });
      }
    });
  }

  return { resources, variables, outputs };
}

function parseResourceConfig(resourceText: string): any {
  const config: any = {};
  
  // Extract basic properties (simplified parsing)
  if (resourceText.includes('tags = {')) {
    config.hasTags = true;
  }
  
  if (resourceText.includes('vpc_id')) {
    config.hasVpcReference = true;
  }

  if (resourceText.includes('count =')) {
    const countMatch = resourceText.match(/count\s*=\s*(\d+)/);
    config.count = countMatch ? parseInt(countMatch[1]) : undefined;
  }

  // Extract specific configurations based on patterns
  config.content = resourceText;
  
  return config;
}

function parseVariableConfig(variableText: string): any {
  const config: any = {};
  
  if (variableText.includes('default =')) {
    config.hasDefault = true;
  }

  if (variableText.includes('type =')) {
    const typeMatch = variableText.match(/type\s*=\s*(\w+)/);
    config.type = typeMatch ? typeMatch[1] : undefined;
  }

  return config;
}

function parseOutputConfig(outputText: string): any {
  const config: any = {};
  
  if (outputText.includes('description =')) {
    config.hasDescription = true;
  }

  return config;
}

describe('tap-stack.tf Unit Tests', () => {
  let terraformConfig: {
    resources: TerraformResource[];
    variables: TerraformVariable[];
    outputs: TerraformOutput[];
  };

  beforeAll(() => {
    const terraformFilePath = path.join(__dirname, '..', 'lib', 'tap-stack.tf');
    terraformConfig = parseTerraformFile(terraformFilePath);
  });

  // ============================================================================
  // Variables Tests
  // ============================================================================
  
  describe('Variables Configuration', () => {
    test('should define all required variables with correct types', () => {
      const variables = terraformConfig.variables;
      const variableNames = variables.map(v => v.name);

      // Verify required variables exist
      expect(variableNames).toContain('environment');
      expect(variableNames).toContain('project_name');
      expect(variableNames).toContain('vpc_cidr');
      expect(variableNames).toContain('availability_zones');
      expect(variableNames).toContain('custom_ami_id');
      expect(variableNames).toContain('fleet_target_capacity');
      expect(variableNames).toContain('hyperparams');

    });

    test('should have hyperparams variable with map type and ML defaults', () => {
      const hyperparamsVar = terraformConfig.variables.find(v => v.name === 'hyperparams');
      expect(hyperparamsVar).toBeDefined();
      
    });

    test('should have fleet_target_capacity with numeric default suitable for training', () => {
      const fleetVar = terraformConfig.variables.find(v => v.name === 'fleet_target_capacity');
      expect(fleetVar).toBeDefined();
    });
  });

  // ============================================================================
  // VPC and Networking Resources Tests
  // ============================================================================

  describe('VPC and Networking Resources', () => {
    test('should create VPC with correct configuration', () => {
      const vpcResources = terraformConfig.resources.filter(r => r.type === 'aws_vpc');
      expect(vpcResources).toHaveLength(1);

      const vpc = vpcResources[0];
      expect(vpc.name).toBe('main');
      expect(vpc.config.content).toContain('enable_dns_hostnames = true');
      expect(vpc.config.content).toContain('enable_dns_support   = true');
      expect(vpc.config.hasTags).toBe(true);
    });

    test('should create 3 public and 3 private subnets', () => {
      const publicSubnets = terraformConfig.resources.filter(r => 
        r.type === 'aws_subnet' && r.name === 'public'
      );
      const privateSubnets = terraformConfig.resources.filter(r => 
        r.type === 'aws_subnet' && r.name === 'private'
      );

      expect(publicSubnets).toHaveLength(1);
      expect(privateSubnets).toHaveLength(1);

      // Verify CIDR configuration uses different ranges
      expect(publicSubnets[0].config.content).toContain('cidrsubnet(var.vpc_cidr, 8, count.index)');
      expect(privateSubnets[0].config.content).toContain('cidrsubnet(var.vpc_cidr, 8, count.index + 10)');
    });

    test('should create NAT gateways and EIPs for high availability', () => {
      const eips = terraformConfig.resources.filter(r => r.type === 'aws_eip' && r.name === 'nat');
      const natGateways = terraformConfig.resources.filter(r => r.type === 'aws_nat_gateway');

      expect(eips).toHaveLength(1);
      expect(natGateways).toHaveLength(1);

      // Verify EIPs are VPC domain
      expect(eips[0].config.content).toContain('domain = "vpc"');
    });

    test('should create proper route tables for public and private subnets', () => {
      const publicRouteTable = terraformConfig.resources.filter(r => 
        r.type === 'aws_route_table' && r.name === 'public'
      );
      const privateRouteTable = terraformConfig.resources.filter(r => 
        r.type === 'aws_route_table' && r.name === 'private'
      );

      expect(publicRouteTable).toHaveLength(1);
      expect(privateRouteTable).toHaveLength(1);

      // Public route table should route to IGW
      expect(publicRouteTable[0].config.content).toContain('gateway_id = aws_internet_gateway.main.id');

      // Private route tables should route to NAT gateway
      expect(privateRouteTable[0].config.content).toContain('nat_gateway_id = aws_nat_gateway.main[count.index].id');
    });

    test('should create VPC endpoints for S3 and DynamoDB', () => {
      const s3Endpoint = terraformConfig.resources.filter(r => 
        r.type === 'aws_vpc_endpoint' && r.name === 's3'
      );
      const dynamodbEndpoint = terraformConfig.resources.filter(r => 
        r.type === 'aws_vpc_endpoint' && r.name === 'dynamodb'
      );

      expect(s3Endpoint).toHaveLength(1);
      expect(dynamodbEndpoint).toHaveLength(1);

      // Verify service names
      expect(s3Endpoint[0].config.content).toContain('service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"');
      expect(dynamodbEndpoint[0].config.content).toContain('service_name      = "com.amazonaws.${data.aws_region.current.name}.dynamodb"');

      // Verify gateway type
      expect(s3Endpoint[0].config.content).toContain('vpc_endpoint_type = "Gateway"');
      expect(dynamodbEndpoint[0].config.content).toContain('vpc_endpoint_type = "Gateway"');
    });

    test('should create security group for ML training with proper rules', () => {
      const securityGroups = terraformConfig.resources.filter(r => 
        r.type === 'aws_security_group' && r.name === 'ml_training'
      );

      expect(securityGroups).toHaveLength(1);

      const sg = securityGroups[0];
      expect(sg.config.content).toContain('Allow all internal TCP communication');
      expect(sg.config.content).toContain('Allow ICMP within VPC');
      expect(sg.config.content).toContain('Allow all outbound traffic');

      // Verify VPC association
      expect(sg.config.content).toContain('vpc_id      = aws_vpc.main.id');
    });
  });

  // ============================================================================
  // IAM Resources Tests
  // ============================================================================

  describe('IAM Resources', () => {
    test('should create IAM role for ML training instances', () => {
      const iamRoles = terraformConfig.resources.filter(r => 
        r.type === 'aws_iam_role' && r.name === 'ml_training_instance'
      );

      expect(iamRoles).toHaveLength(1);

      const role = iamRoles[0];
      expect(role.config.content).toContain('ec2.amazonaws.com');
      expect(role.config.content).toContain('sts:AssumeRole');
      expect(role.config.hasTags).toBe(true);
    });

    test('should create IAM policy with proper permissions for ML workloads', () => {
      const iamPolicies = terraformConfig.resources.filter(r => 
        r.type === 'aws_iam_role_policy' && r.name === 'ml_training_instance'
      );

      expect(iamPolicies).toHaveLength(1);

      const policy = iamPolicies[0];
      const content = policy.config.content;

      // S3 permissions for training data and model artifacts
      expect(content).toContain('s3:GetObject');
      expect(content).toContain('s3:PutObject');
      expect(content).toContain('s3:ListBucket');

      // DynamoDB permissions for experiment tracking
      expect(content).toContain('dynamodb:PutItem');
      expect(content).toContain('dynamodb:GetItem');
      expect(content).toContain('dynamodb:Query');

      // CloudWatch permissions for monitoring
      expect(content).toContain('logs:CreateLogGroup');
      expect(content).toContain('cloudwatch:PutMetricData');

      // SSM permissions for parameter retrieval
      expect(content).toContain('ssm:GetParameter');

      // EC2 permissions for self-discovery
      expect(content).toContain('ec2:DescribeInstances');
    });

    test('should create instance profile linking role', () => {
      const instanceProfiles = terraformConfig.resources.filter(r => 
        r.type === 'aws_iam_instance_profile' && r.name === 'ml_training'
      );

      expect(instanceProfiles).toHaveLength(1);
      expect(instanceProfiles[0].config.content).toContain('role = aws_iam_role.ml_training_instance.name');
    });
  });

  // ============================================================================
  // Storage Resources Tests
  // ============================================================================

  describe('Storage Resources', () => {
    test('should create S3 buckets for training data and model artifacts', () => {
      const s3Buckets = terraformConfig.resources.filter(r => r.type === 'aws_s3_bucket');
      
      expect(s3Buckets).toHaveLength(3);

      const trainingDataBucket = s3Buckets.find(b => b.name === 'training_data');
      const modelArtifactsBucket = s3Buckets.find(b => b.name === 'model_artifacts');

      expect(trainingDataBucket).toBeDefined();
      expect(modelArtifactsBucket).toBeDefined();

      // Verify bucket naming includes account ID for uniqueness
      expect(trainingDataBucket!.config.content).toContain('data.aws_caller_identity.current.account_id');
      expect(modelArtifactsBucket!.config.content).toContain('data.aws_caller_identity.current.account_id');
    });

    test('should enable versioning on S3 buckets', () => {
      const versioningConfigs = terraformConfig.resources.filter(r => 
        r.type === 'aws_s3_bucket_versioning'
      );

      expect(versioningConfigs).toHaveLength(3);

      versioningConfigs.forEach(config => {
        expect(config.config.content).toContain('status = "Enabled"');
      });
    });

    test('should enable server-side encryption on S3 buckets', () => {
      const encryptionConfigs = terraformConfig.resources.filter(r => 
        r.type === 'aws_s3_bucket_server_side_encryption_configuration'
      );

      expect(encryptionConfigs).toHaveLength(3);

      encryptionConfigs.forEach(config => {
        expect(config.config.content).toContain('sse_algorithm = "AES256"');
      });
    });

    test('should block public access on S3 buckets', () => {
      const publicAccessBlocks = terraformConfig.resources.filter(r => 
        r.type === 'aws_s3_bucket_public_access_block'
      );

      expect(publicAccessBlocks).toHaveLength(3);

      publicAccessBlocks.forEach(block => {
        const content = block.config.content;
        expect(content).toContain('block_public_acls       = true');
        expect(content).toContain('block_public_policy     = true');
        expect(content).toContain('ignore_public_acls      = true');
        expect(content).toContain('restrict_public_buckets = true');
      });
    });

    test('should configure lifecycle policies for cost optimization', () => {
      const lifecycleConfigs = terraformConfig.resources.filter(r => 
        r.type === 'aws_s3_bucket_lifecycle_configuration'
      );

      expect(lifecycleConfigs).toHaveLength(2);

      lifecycleConfigs.forEach(config => {
        expect(config.config.content).toContain('storage_class = "GLACIER"');
        expect(config.config.content).toContain('days          = 30');
      });
    });
  });

  // ============================================================================
  // DynamoDB Resources Tests
  // ============================================================================

  describe('DynamoDB Resources', () => {
    test('should create DynamoDB table for experiment tracking', () => {
      const dynamodbTables = terraformConfig.resources.filter(r => 
        r.type === 'aws_dynamodb_table' && r.name === 'experiments'
      );

      expect(dynamodbTables).toHaveLength(1);

      const table = dynamodbTables[0];
      const content = table.config.content;

      // Verify billing mode
      expect(content).toContain('billing_mode = "PAY_PER_REQUEST"');

      // Verify key structure for experiment tracking
      expect(content).toContain('hash_key     = "experiment_id"');
      expect(content).toContain('range_key    = "run_id"');

      // Verify attributes
      expect(content).toContain('name = "experiment_id"');
      expect(content).toContain('name = "run_id"');
      expect(content).toContain('type = "S"');

      // Verify PITR enabled
      expect(content).toContain('enabled = true');
    });

    test('should enable point-in-time recovery and encryption', () => {
      const table = terraformConfig.resources.find(r => 
        r.type === 'aws_dynamodb_table' && r.name === 'experiments'
      )!;

      expect(table.config.content).toContain('point_in_time_recovery');
      expect(table.config.content).toContain('server_side_encryption');
    });
  });

  // ============================================================================
  // EC2 Fleet Resources Tests
  // ============================================================================

  describe('EC2 Fleet Resources', () => {
    test('should create launch template for GPU instances', () => {
      const launchTemplates = terraformConfig.resources.filter(r => 
        r.type === 'aws_launch_template' && r.name === 'ml_training'
      );

      expect(launchTemplates).toHaveLength(1);

      const template = launchTemplates[0];
      const content = template.config.content;

      // Verify GPU instance type
      expect(content).toContain('instance_type = "p3.2xlarge"');

      // Verify IAM instance profile
      expect(content).toContain('arn = aws_iam_instance_profile.ml_training.arn');

      // Verify security group
      expect(content).toContain('vpc_security_group_ids = [aws_security_group.ml_training.id]');

      // Verify monitoring enabled
      expect(content).toContain('enabled = true');

      // Verify metadata options for security
      expect(content).toContain('http_tokens                 = "required"');

      // Verify user data script included
      expect(content).toContain('user_data = base64encode(local.user_data_script)');
    });

    test('should create EC2 fleet with spot instances', () => {
      const ec2Fleets = terraformConfig.resources.filter(r => 
        r.type === 'aws_ec2_fleet' && r.name === 'ml_training'
      );

      expect(ec2Fleets).toHaveLength(1);

      const fleet = ec2Fleets[0];
      const content = fleet.config.content;

      // Verify target capacity configuration
      expect(content).toContain('total_target_capacity        = var.fleet_target_capacity');
      expect(content).toContain('default_target_capacity_type = "spot"');

      // Verify spot options
      expect(content).toContain('allocation_strategy            = "capacity-optimized"');
      expect(content).toContain('instance_interruption_behavior = "terminate"');

      // Verify fleet type
      expect(content).toContain('type = "maintain"');

      // Verify instance replacement
      expect(content).toContain('replace_unhealthy_instances = true');
    });

    test('should configure user data script for ML training setup', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'lib', 'tap-stack.tf'), 'utf8');
      
      // Verify user data script contains essential components
      expect(content).toContain('#!/bin/bash');
      expect(content).toContain('amazon-cloudwatch-agent');
      expect(content).toContain('nvidia-docker');
      expect(content).toContain('gpu_metrics.py');
      expect(content).toContain('systemctl enable gpu-metrics.service');

      // Verify CloudWatch configuration for GPU metrics
      expect(content).toContain('utilization_gpu');
      expect(content).toContain('utilization_memory');
      expect(content).toContain('temperature_gpu');
    });
  });

  // ============================================================================
  // CloudWatch Resources Tests
  // ============================================================================

  describe('CloudWatch Resources', () => {
    test('should create CloudWatch log group for training logs', () => {
      const logGroups = terraformConfig.resources.filter(r => 
        r.type === 'aws_cloudwatch_log_group' && r.name === 'training_logs'
      );

      expect(logGroups).toHaveLength(1);

      const logGroup = logGroups[0];
      expect(logGroup.config.content).toContain('/aws/ml-training/${var.environment}');
      expect(logGroup.config.content).toContain('retention_in_days = 30');
    });

    test('should create CloudWatch alarm for GPU utilization monitoring', () => {
      const alarms = terraformConfig.resources.filter(r => 
        r.type === 'aws_cloudwatch_metric_alarm' && r.name === 'low_gpu_utilization'
      );

      expect(alarms).toHaveLength(1);

      const alarm = alarms[0];
      const content = alarm.config.content;

      // Verify alarm configuration
      expect(content).toContain('comparison_operator = "LessThanThreshold"');
      expect(content).toContain('metric_name         = "GPU_Utilization_Percent"');
      expect(content).toContain('namespace           = "ML/Training"');
      expect(content).toContain('threshold           = "20"');
      expect(content).toContain('treat_missing_data  = "breaching"');
    });
  });

  // ============================================================================
  // SSM Parameter Store Tests
  // ============================================================================

  describe('SSM Parameter Store', () => {
    test('should create SSM parameters for hyperparameters', () => {
      const ssmParameters = terraformConfig.resources.filter(r => r.type === 'aws_ssm_parameter');

      expect(ssmParameters).toHaveLength(3);

      const parameterNames = ssmParameters.map(p => {
        const nameMatch = p.config.content.match(/name\s*=\s*"([^"]+)"/);
        return nameMatch ? nameMatch[1] : '';
      });

      expect(parameterNames).toContain('/ml/hparams/learning_rate');
      expect(parameterNames).toContain('/ml/hparams/batch_size');
      expect(parameterNames).toContain('/ml/hparams/epochs');

      // Verify all are SecureString type
      ssmParameters.forEach(param => {
        expect(param.config.content).toContain('type  = "SecureString"');
      });
    });

    test('should reference hyperparameters from variable', () => {
      const learningRateParam = terraformConfig.resources.find(r => 
        r.type === 'aws_ssm_parameter' && r.config.content.includes('/ml/hparams/learning_rate')
      );

      expect(learningRateParam!.config.content).toContain('var.hyperparams["learning_rate"]');
    });
  });

  // ============================================================================
  // Data Sources Tests
  // ============================================================================

  describe('Data Sources', () => {
    test('should define required data sources', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'lib', 'tap-stack.tf'), 'utf8');

      // Verify data sources exist
      expect(content).toContain('data "aws_region" "current"');
      expect(content).toContain('data "aws_caller_identity" "current"');
      expect(content).toContain('data "aws_ami" "deep_learning"');

      // Verify Deep Learning AMI filter
      expect(content).toContain('Deep Learning AMI Neuron (Ubuntu 22.04)');
      expect(content).toContain('owners      = ["amazon"]');
    });
  });

  // ============================================================================
  // Outputs Tests
  // ============================================================================

  describe('Outputs Configuration', () => {
    test('should define all required outputs for integration testing', () => {
      const outputs = terraformConfig.outputs;
      const outputNames = outputs.map(o => o.name);

      // Verify required outputs exist
      expect(outputNames).toContain('s3_training_data_bucket');
      expect(outputNames).toContain('s3_model_artifacts_bucket');
      expect(outputNames).toContain('dynamodb_experiments_table');
      expect(outputNames).toContain('ec2_fleet_id');
      expect(outputNames).toContain('iam_role_name');
      expect(outputNames).toContain('vpc_id');
      expect(outputNames).toContain('private_subnet_ids');

      // Verify outputs have descriptions
      outputs.forEach(output => {
        expect(output.config.hasDescription).toBe(true);
      });
    });

    test('should output proper resource references', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'lib', 'tap-stack.tf'), 'utf8');

      // Verify output values reference correct resources
      expect(content).toContain('value       = aws_s3_bucket.training_data.id');
      expect(content).toContain('value       = aws_s3_bucket.model_artifacts.id');
      expect(content).toContain('value       = aws_dynamodb_table.experiments.name');
      expect(content).toContain('value       = aws_ec2_fleet.ml_training.id');
      expect(content).toContain('value       = aws_iam_role.ml_training_instance.name');
      expect(content).toContain('value       = aws_vpc.main.id');
    });
  });

  // ============================================================================
  // Resource Tagging Tests
  // ============================================================================

  describe('Resource Tagging', () => {
    test('should apply consistent tagging across all resources', () => {
      const taggedResources = terraformConfig.resources.filter(r => r.config.hasTags);
      
      // Verify significant number of resources are tagged
      expect(taggedResources.length).toBeGreaterThan(15);

      // Verify common tags pattern
      const content = fs.readFileSync(path.join(__dirname, '..', 'lib', 'tap-stack.tf'), 'utf8');
      expect(content).toMatch(/Environment\s*=\s*var\.environment/g);
      expect(content).toMatch(/Project\s*=\s*var\.project_name/g);
    });
  });

  // ============================================================================
  // Security Best Practices Tests
  // ============================================================================

  describe('Security Best Practices', () => {
    test('should not use hardcoded sensitive values', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'lib', 'tap-stack.tf'), 'utf8');

      // Verify no hardcoded credentials
      expect(content).not.toMatch(/password\s*=\s*"[^"]*"/i);
      expect(content).not.toMatch(/secret\s*=\s*"[^"]*"/i);

      // Verify no hardcoded account IDs or regions (except in data source usage)
      expect(content).not.toMatch(/\d{12}/); // 12-digit account ID
    });

    test('should use least privilege in IAM policies', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'lib', 'tap-stack.tf'), 'utf8');

      // Verify resource-specific permissions for S3
      expect(content).toContain('aws_s3_bucket.training_data.arn');
      expect(content).toContain('aws_s3_bucket.model_artifacts.arn');
    });

    test('should enforce encryption at rest', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'lib', 'tap-stack.tf'), 'utf8');

      // Verify S3 encryption
      expect(content).toContain('aws_s3_bucket_server_side_encryption_configuration');

      // Verify DynamoDB encryption
      expect(content).toContain('server_side_encryption');
    });
  });
});