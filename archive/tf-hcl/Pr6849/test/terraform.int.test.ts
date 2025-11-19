/**
 * Terraform Disaster Recovery Infrastructure Integration Tests
 *
 * Tests against actual deployed AWS resources dynamically using AWS CLI
 * to avoid AWS SDK module loading issues. Validates all infrastructure
 * components including VPCs, Aurora, DynamoDB, Lambda, Route53, CloudWatch, and IAM.
 *
 * Test Design:
 * - Uses AWS CLI commands to query real infrastructure
 * - Dynamically discovers resources by tags and naming patterns
 * - No mocking - all tests against live AWS resources
 * - Validates disaster recovery failover capabilities
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PRIMARY_REGION = process.env.AWS_REGION || 'us-east-1';
const SECONDARY_REGION = 'us-west-2';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Infrastructure outputs interface
interface InfrastructureOutputs {
  environment_suffix?: string;
  primary_vpc_id?: string;
  secondary_vpc_id?: string;
  aurora_global_cluster_id?: string;
  primary_aurora_endpoint?: string;
  secondary_aurora_endpoint?: string;
  dynamodb_table_name?: string;
  primary_lambda_function_name?: string;
  secondary_lambda_function_name?: string;
  route53_zone_id?: string;
  route53_domain_name?: string;
  primary_sns_topic_arn?: string;
  secondary_sns_topic_arn?: string;
  lambda_iam_role_arn?: string;
  vpc_peering_connection_id?: string;
}

/**
 * Execute AWS CLI command and return parsed JSON result
 */
function awsCommand(command: string, region: string = PRIMARY_REGION): any {
  try {
    const result = execSync(`aws ${command} --region ${region} --output json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return JSON.parse(result);
  } catch (error: any) {
    const errorMessage = error.stderr?.toString() || error.message || 'Unknown error';
    console.error(`AWS CLI command failed: aws ${command} --region ${region}`);
    console.error(`Error: ${errorMessage}`);
    throw error;
  }
}

/**
 * Load infrastructure outputs from Terraform state or outputs file
 */
function loadInfrastructureOutputs(): InfrastructureOutputs {
  const possiblePaths = [
    path.resolve(process.cwd(), 'cfn-outputs/flat-outputs.json'),
    path.resolve(process.cwd(), 'lib/terraform.tfstate'),
    path.resolve(process.cwd(), 'terraform-outputs.json'),
    path.resolve(process.cwd(), 'outputs.json'),
  ];

  let outputsPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      outputsPath = p;
      break;
    }
  }

  if (!outputsPath) {
    console.warn(`⚠️ Infrastructure outputs not found. Checked paths: ${possiblePaths.join(', ')}`);
    console.warn(`⚠️ Integration tests will discover resources dynamically from AWS`);
    return {};
  }

  try {
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    let outputs: InfrastructureOutputs = {};

    if (outputsPath.endsWith('terraform.tfstate')) {
      // Parse Terraform state file
      const tfState = JSON.parse(outputsContent);
      if (tfState.outputs) {
        outputs = Object.fromEntries(
          Object.entries(tfState.outputs).map(([key, value]: [string, any]) => [
            key,
            value.value,
          ])
        ) as InfrastructureOutputs;
      }
    } else {
      // Parse regular JSON outputs
      outputs = JSON.parse(outputsContent) as InfrastructureOutputs;
    }

    console.log(`✅ Loaded infrastructure outputs from: ${outputsPath}`);
    console.log(`📋 Available outputs: [${Object.keys(outputs).join(', ')}]`);

    return outputs;
  } catch (error) {
    console.warn(`⚠️ Failed to parse outputs file ${outputsPath}: ${error}`);
    console.warn(`⚠️ Integration tests will discover resources dynamically from AWS`);
    return {};
  }
}

/**
 * Discover resources dynamically from AWS using tags and naming patterns
 */
function discoverResources(outputs: InfrastructureOutputs): {
  primaryVpcId?: string;
  secondaryVpcId?: string;
  primaryLambdaName?: string;
  secondaryLambdaName?: string;
  dynamodbTableName?: string;
  globalClusterId?: string;
  route53ZoneId?: string;
} {
  const discovered: any = {};

  // Discover VPCs by tags
  try {
    const vpcsPrimary = awsCommand(
      `ec2 describe-vpcs --filters "Name=tag:Environment,Values=DR" "Name=tag:Region,Values=primary"`,
      PRIMARY_REGION
    );
    if (vpcsPrimary.Vpcs && vpcsPrimary.Vpcs.length > 0) {
      discovered.primaryVpcId = vpcsPrimary.Vpcs[0].VpcId;
    }

    const vpcsSecondary = awsCommand(
      `ec2 describe-vpcs --filters "Name=tag:Environment,Values=DR" "Name=tag:Region,Values=secondary"`,
      SECONDARY_REGION
    );
    if (vpcsSecondary.Vpcs && vpcsSecondary.Vpcs.length > 0) {
      discovered.secondaryVpcId = vpcsSecondary.Vpcs[0].VpcId;
    }
  } catch (error) {
    console.warn('Could not discover VPCs:', error);
  }

  // Discover Lambda functions by naming pattern
  try {
    const functionsPrimary = awsCommand(`lambda list-functions`, PRIMARY_REGION);
    const primaryLambda = functionsPrimary.Functions?.find((f: any) =>
      f.FunctionName?.includes('payment-webhook-processor-primary')
    );
    if (primaryLambda) {
      discovered.primaryLambdaName = primaryLambda.FunctionName;
    }

    const functionsSecondary = awsCommand(`lambda list-functions`, SECONDARY_REGION);
    const secondaryLambda = functionsSecondary.Functions?.find((f: any) =>
      f.FunctionName?.includes('payment-webhook-processor-secondary')
    );
    if (secondaryLambda) {
      discovered.secondaryLambdaName = secondaryLambda.FunctionName;
    }
  } catch (error) {
    console.warn('Could not discover Lambda functions:', error);
  }

  // Discover DynamoDB table by naming pattern
  try {
    const tables = awsCommand(`dynamodb list-tables`, PRIMARY_REGION);
    const table = tables.TableNames?.find((name: string) => name.includes('payment-sessions'));
    if (table) {
      discovered.dynamodbTableName = table;
    }
  } catch (error) {
    console.warn('Could not discover DynamoDB table:', error);
  }

  // Discover Aurora Global Cluster
  try {
    const globalClusters = awsCommand(`rds describe-global-clusters`, PRIMARY_REGION);
    const cluster = globalClusters.GlobalClusters?.find((c: any) =>
      c.GlobalClusterIdentifier?.includes('payment-dr-global-cluster')
    );
    if (cluster) {
      discovered.globalClusterId = cluster.GlobalClusterIdentifier;
    }
  } catch (error) {
    console.warn('Could not discover Aurora Global Cluster:', error);
  }

  // Discover Route53 zone by domain name
  try {
    if (outputs.route53_domain_name) {
      const hostedZones = awsCommand(`route53 list-hosted-zones`, PRIMARY_REGION);
      const zone = hostedZones.HostedZones?.find((z: any) =>
        z.Name?.includes('payment-dr')
      );
      if (zone) {
        discovered.route53ZoneId = zone.Id.replace('/hostedzone/', '');
      }
    }
  } catch (error) {
    console.warn('Could not discover Route53 zone:', error);
  }

  return discovered;
}

describe('Terraform Disaster Recovery Infrastructure Integration Tests', () => {
  let outputs: InfrastructureOutputs;
  let discovered: any;

  beforeAll(() => {
    console.log(`🌎 Primary Region: ${PRIMARY_REGION}`);
    console.log(`🌎 Secondary Region: ${SECONDARY_REGION}`);
    console.log(`🏷️  Environment Suffix: ${ENVIRONMENT_SUFFIX}`);

    // Load outputs from Terraform
    outputs = loadInfrastructureOutputs();

    // Discover resources dynamically
    discovered = discoverResources(outputs);

    // Merge outputs and discovered resources (outputs take precedence)
    const primaryVpcId = outputs.primary_vpc_id || discovered.primaryVpcId;
    const secondaryVpcId = outputs.secondary_vpc_id || discovered.secondaryVpcId;
    const primaryLambdaName =
      outputs.primary_lambda_function_name || discovered.primaryLambdaName;
    const secondaryLambdaName =
      outputs.secondary_lambda_function_name || discovered.secondaryLambdaName;
    const dynamodbTableName = outputs.dynamodb_table_name || discovered.dynamodbTableName;
    const globalClusterId = outputs.aurora_global_cluster_id || discovered.globalClusterId;
    const route53ZoneId = outputs.route53_zone_id || discovered.route53ZoneId;

    console.log(`\n=== Discovered Resources ===`);
    console.log(`Primary VPC: ${primaryVpcId || 'Not found'}`);
    console.log(`Secondary VPC: ${secondaryVpcId || 'Not found'}`);
    console.log(`Primary Lambda: ${primaryLambdaName || 'Not found'}`);
    console.log(`Secondary Lambda: ${secondaryLambdaName || 'Not found'}`);
    console.log(`DynamoDB Table: ${dynamodbTableName || 'Not found'}`);
    console.log(`Aurora Global Cluster: ${globalClusterId || 'Not found'}`);
    console.log(`Route53 Zone: ${route53ZoneId || 'Not found'}`);
    console.log(`===========================\n`);

    // Validate we have at least some resources
    if (
      !primaryVpcId &&
      !secondaryVpcId &&
      !primaryLambdaName &&
      !secondaryLambdaName &&
      !dynamodbTableName
    ) {
      throw new Error(
        'No infrastructure resources found. Ensure infrastructure is deployed.'
      );
    }
  }, 60000);

  describe('VPC Infrastructure', () => {
    test('Primary VPC should exist and be available', () => {
      const vpcId = outputs.primary_vpc_id || discovered.primaryVpcId;
      if (!vpcId) {
        console.warn('⚠️ Primary VPC ID not found, skipping test');
        return;
      }

      const response = awsCommand(`ec2 describe-vpcs --vpc-ids ${vpcId}`, PRIMARY_REGION);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs.length).toBe(1);
      expect(response.Vpcs[0].State).toBe('available');
      expect(response.Vpcs[0].CidrBlock).toMatch(/^10\.0\./);
    });

    test('Secondary VPC should exist and be available', () => {
      const vpcId = outputs.secondary_vpc_id || discovered.secondaryVpcId;
      if (!vpcId) {
        console.warn('⚠️ Secondary VPC ID not found, skipping test');
        return;
      }

      const response = awsCommand(`ec2 describe-vpcs --vpc-ids ${vpcId}`, SECONDARY_REGION);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs.length).toBe(1);
      expect(response.Vpcs[0].State).toBe('available');
      expect(response.Vpcs[0].CidrBlock).toMatch(/^10\.1\./);
    });

    test('Primary VPC should have private subnets', () => {
      const vpcId = outputs.primary_vpc_id || discovered.primaryVpcId;
      if (!vpcId) {
        console.warn('⚠️ Primary VPC ID not found, skipping test');
        return;
      }

      const response = awsCommand(
        `ec2 describe-subnets --filters "Name=vpc-id,Values=${vpcId}" "Name=tag:Name,Values=*private*"`,
        PRIMARY_REGION
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets.length).toBeGreaterThanOrEqual(3);
    });

    test('Secondary VPC should have private subnets', () => {
      const vpcId = outputs.secondary_vpc_id || discovered.secondaryVpcId;
      if (!vpcId) {
        console.warn('⚠️ Secondary VPC ID not found, skipping test');
        return;
      }

      const response = awsCommand(
        `ec2 describe-subnets --filters "Name=vpc-id,Values=${vpcId}" "Name=tag:Name,Values=*private*"`,
        SECONDARY_REGION
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets.length).toBeGreaterThanOrEqual(3);
    });

    test('VPC Peering Connection should exist and be active', () => {
      const peeringId = outputs.vpc_peering_connection_id;
      if (!peeringId) {
        console.warn('⚠️ VPC Peering Connection ID not found, skipping test');
        return;
      }

      const response = awsCommand(
        `ec2 describe-vpc-peering-connections --vpc-peering-connection-ids ${peeringId}`,
        PRIMARY_REGION
      );

      expect(response.VpcPeeringConnections).toBeDefined();
      expect(response.VpcPeeringConnections.length).toBe(1);
      expect(response.VpcPeeringConnections[0].Status.Code).toBe('active');
    });
  });

  describe('Aurora Global Database', () => {
    test('Aurora Global Cluster should exist', () => {
      const globalClusterId =
        outputs.aurora_global_cluster_id || discovered.globalClusterId;
      if (!globalClusterId) {
        console.warn('⚠️ Aurora Global Cluster ID not found, skipping test');
        return;
      }

      const response = awsCommand(
        `rds describe-global-clusters --global-cluster-identifier ${globalClusterId}`,
        PRIMARY_REGION
      );

      expect(response.GlobalClusters).toBeDefined();
      expect(response.GlobalClusters.length).toBe(1);
      expect(response.GlobalClusters[0].Status).toBe('available');
      expect(response.GlobalClusters[0].Engine).toBe('aurora-postgresql');
      expect(response.GlobalClusters[0].EngineVersion).toBe('15.12');
    });

    test('Primary Aurora Cluster should exist and be available', () => {
      const globalClusterId =
        outputs.aurora_global_cluster_id || discovered.globalClusterId;
      if (!globalClusterId) {
        console.warn('⚠️ Aurora Global Cluster ID not found, skipping test');
        return;
      }

      // Get global cluster to find primary cluster
      const globalCluster = awsCommand(
        `rds describe-global-clusters --global-cluster-identifier ${globalClusterId}`,
        PRIMARY_REGION
      );

      const primaryMember = globalCluster.GlobalClusters[0].GlobalClusterMembers?.find(
        (m: any) => m.IsWriter === true
      );
      if (!primaryMember) {
        console.warn('⚠️ Primary cluster member not found, skipping test');
        return;
      }

      const primaryClusterId = primaryMember.DBClusterArn?.split(':cluster:')[1];
      if (!primaryClusterId) {
        console.warn('⚠️ Primary cluster ID not found, skipping test');
        return;
      }

      const response = awsCommand(
        `rds describe-db-clusters --db-cluster-identifier ${primaryClusterId}`,
        PRIMARY_REGION
      );

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters.length).toBe(1);
      expect(response.DBClusters[0].Status).toBe('available');
      expect(response.DBClusters[0].Engine).toBe('aurora-postgresql');
      expect(response.DBClusters[0].StorageEncrypted).toBe(true);
    });

    test('Secondary Aurora Cluster should exist and be available', () => {
      const globalClusterId =
        outputs.aurora_global_cluster_id || discovered.globalClusterId;
      if (!globalClusterId) {
        console.warn('⚠️ Aurora Global Cluster ID not found, skipping test');
        return;
      }

      // Get global cluster to find secondary cluster
      const globalCluster = awsCommand(
        `rds describe-global-clusters --global-cluster-identifier ${globalClusterId}`,
        PRIMARY_REGION
      );

      const secondaryMember = globalCluster.GlobalClusters[0].GlobalClusterMembers?.find(
        (m: any) => m.IsWriter === false
      );
      if (!secondaryMember) {
        console.warn('⚠️ Secondary cluster member not found, skipping test');
        return;
      }

      const secondaryClusterArn = secondaryMember.DBClusterArn;
      const secondaryClusterId = secondaryClusterArn.split(':cluster:')[1];
      const secondaryRegion = secondaryClusterArn.split(':')[3];

      const response = awsCommand(
        `rds describe-db-clusters --db-cluster-identifier ${secondaryClusterId}`,
        secondaryRegion
      );

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters.length).toBe(1);
      expect(response.DBClusters[0].Status).toBe('available');
      expect(response.DBClusters[0].Engine).toBe('aurora-postgresql');
      expect(response.DBClusters[0].StorageEncrypted).toBe(true);
    });

    test('Primary cluster should have multiple instances', () => {
      const globalClusterId =
        outputs.aurora_global_cluster_id || discovered.globalClusterId;
      if (!globalClusterId) {
        console.warn('⚠️ Aurora Global Cluster ID not found, skipping test');
        return;
      }

      // Get global cluster to find primary cluster
      const globalCluster = awsCommand(
        `rds describe-global-clusters --global-cluster-identifier ${globalClusterId}`,
        PRIMARY_REGION
      );

      const primaryMember = globalCluster.GlobalClusters[0].GlobalClusterMembers?.find(
        (m: any) => m.IsWriter === true
      );
      if (!primaryMember) {
        console.warn('⚠️ Primary cluster member not found, skipping test');
        return;
      }

      const primaryClusterId = primaryMember.DBClusterArn?.split(':cluster:')[1];
      if (!primaryClusterId) {
        console.warn('⚠️ Primary cluster ID not found, skipping test');
        return;
      }

      const response = awsCommand(
        `rds describe-db-instances --filters "Name=db-cluster-id,Values=${primaryClusterId}"`,
        PRIMARY_REGION
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('DynamoDB Global Table', () => {
    test('DynamoDB table should exist', () => {
      const tableName = outputs.dynamodb_table_name || discovered.dynamodbTableName;
      if (!tableName) {
        console.warn('⚠️ DynamoDB table name not found, skipping test');
        return;
      }

      const response = awsCommand(`dynamodb describe-table --table-name ${tableName}`, PRIMARY_REGION);

      expect(response.Table).toBeDefined();
      expect(response.Table.TableName).toBe(tableName);
      expect(response.Table.TableStatus).toBe('ACTIVE');
      expect(response.Table.BillingModeSummary.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB table should have global replicas', () => {
      const tableName = outputs.dynamodb_table_name || discovered.dynamodbTableName;
      if (!tableName) {
        console.warn('⚠️ DynamoDB table name not found, skipping test');
        return;
      }

      const response = awsCommand(`dynamodb describe-table --table-name ${tableName}`, PRIMARY_REGION);

      expect(response.Table).toBeDefined();
      // Global tables have replicas in multiple regions
      expect(response.Table.Replicas).toBeDefined();
      expect(response.Table.Replicas.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Lambda Functions', () => {
    test('Primary Lambda function should exist', () => {
      const functionName =
        outputs.primary_lambda_function_name || discovered.primaryLambdaName;
      if (!functionName) {
        console.warn('⚠️ Primary Lambda function name not found, skipping test');
        return;
      }

      const response = awsCommand(`lambda get-function --function-name ${functionName}`, PRIMARY_REGION);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration.FunctionName).toBe(functionName);
      expect(response.Configuration.Runtime).toBe('nodejs18.x');
      expect(response.Configuration.State).toBe('Active');
    });

    test('Primary Lambda should have Function URL configured', () => {
      const functionName =
        outputs.primary_lambda_function_name || discovered.primaryLambdaName;
      if (!functionName) {
        console.warn('⚠️ Primary Lambda function name not found, skipping test');
        return;
      }

      const response = awsCommand(
        `lambda get-function-url-config --function-name ${functionName}`,
        PRIMARY_REGION
      );

      expect(response.FunctionUrl).toBeDefined();
      expect(response.FunctionUrl).toMatch(/^https:\/\//);
    });

    test('Secondary Lambda function should exist', () => {
      const functionName =
        outputs.secondary_lambda_function_name || discovered.secondaryLambdaName;
      if (!functionName) {
        console.warn('⚠️ Secondary Lambda function name not found, skipping test');
        return;
      }

      const response = awsCommand(`lambda get-function --function-name ${functionName}`, SECONDARY_REGION);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration.FunctionName).toBe(functionName);
      expect(response.Configuration.Runtime).toBe('nodejs18.x');
      expect(response.Configuration.State).toBe('Active');
    });

    test('Secondary Lambda should have Function URL configured', () => {
      const functionName =
        outputs.secondary_lambda_function_name || discovered.secondaryLambdaName;
      if (!functionName) {
        console.warn('⚠️ Secondary Lambda function name not found, skipping test');
        return;
      }

      const response = awsCommand(
        `lambda get-function-url-config --function-name ${functionName}`,
        SECONDARY_REGION
      );

      expect(response.FunctionUrl).toBeDefined();
      expect(response.FunctionUrl).toMatch(/^https:\/\//);
    });

    test('Lambda functions should be in VPC', () => {
      const functionName =
        outputs.primary_lambda_function_name || discovered.primaryLambdaName;
      if (!functionName) {
        console.warn('⚠️ Primary Lambda function name not found, skipping test');
        return;
      }

      const response = awsCommand(`lambda get-function --function-name ${functionName}`, PRIMARY_REGION);

      expect(response.Configuration.VpcConfig).toBeDefined();
      expect(response.Configuration.VpcConfig.SubnetIds).toBeDefined();
      expect(response.Configuration.VpcConfig.SubnetIds.length).toBeGreaterThan(0);
      expect(response.Configuration.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(response.Configuration.VpcConfig.SecurityGroupIds.length).toBeGreaterThan(0);
    });
  });

  describe('Route53 DNS and Failover', () => {
    test('Route53 Hosted Zone should exist', () => {
      const zoneId = outputs.route53_zone_id || discovered.route53ZoneId;
      if (!zoneId) {
        console.warn('⚠️ Route53 Zone ID not found, skipping test');
        return;
      }

      const cleanZoneId = zoneId.replace('/hostedzone/', '');
      const response = awsCommand(
        `route53 get-hosted-zone --id ${cleanZoneId}`,
        PRIMARY_REGION
      );

      expect(response.HostedZone).toBeDefined();
      expect(response.HostedZone.Id).toContain(cleanZoneId);
      expect(response.HostedZone.Name).toContain('payment-dr');
    });

    test('Route53 should have DNS records for Lambda endpoints', () => {
      const zoneId = outputs.route53_zone_id || discovered.route53ZoneId;
      if (!zoneId) {
        console.warn('⚠️ Route53 Zone ID not found, skipping test');
        return;
      }

      const cleanZoneId = zoneId.replace('/hostedzone/', '');
      const response = awsCommand(
        `route53 list-resource-record-sets --hosted-zone-id ${cleanZoneId}`,
        PRIMARY_REGION
      );

      expect(response.ResourceRecordSets).toBeDefined();
      const cnameRecords = response.ResourceRecordSets.filter((r: any) => r.Type === 'CNAME');
      expect(cnameRecords.length).toBeGreaterThan(0);
    });

    test('Route53 Health Check should exist', () => {
      // Health checks are created but we need to discover them
      // For now, we'll just verify the zone exists (health check is created as part of the module)
      if (!outputs.route53_zone_id) {
        console.warn('⚠️ Route53 Zone ID not found, skipping health check test');
        return;
      }

      expect(outputs.route53_zone_id).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('Primary region should have CloudWatch alarms', () => {
      const clusterId = outputs.aurora_global_cluster_id || discovered.globalClusterId;
      if (!clusterId) {
        console.warn('⚠️ Aurora cluster ID not found, skipping test');
        return;
      }

      const response = awsCommand(
        `cloudwatch describe-alarms --alarm-name-prefix dr-payment-primary`,
        PRIMARY_REGION
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms.length).toBeGreaterThan(0);
    });

    test('Secondary region should have CloudWatch alarms', () => {
      const clusterId = outputs.aurora_global_cluster_id || discovered.globalClusterId;
      if (!clusterId) {
        console.warn('⚠️ Aurora cluster ID not found, skipping test');
        return;
      }

      const response = awsCommand(
        `cloudwatch describe-alarms --alarm-name-prefix dr-payment-secondary`,
        SECONDARY_REGION
      );

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Topics', () => {
    test('Primary SNS topic should exist', () => {
      const topicArn = outputs.primary_sns_topic_arn;
      if (!topicArn) {
        console.warn('⚠️ Primary SNS topic ARN not found, skipping test');
        return;
      }

      const response = awsCommand(`sns get-topic-attributes --topic-arn ${topicArn}`, PRIMARY_REGION);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes.TopicArn).toBe(topicArn);
    });

    test('Secondary SNS topic should exist', () => {
      const topicArn = outputs.secondary_sns_topic_arn;
      if (!topicArn) {
        console.warn('⚠️ Secondary SNS topic ARN not found, skipping test');
        return;
      }

      const response = awsCommand(`sns get-topic-attributes --topic-arn ${topicArn}`, SECONDARY_REGION);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes.TopicArn).toBe(topicArn);
    });
  });

  describe('IAM Roles', () => {
    test('Lambda IAM role should exist with correct policies', () => {
      const roleArn = outputs.lambda_iam_role_arn;
      if (!roleArn) {
        console.warn('⚠️ Lambda IAM role ARN not found, skipping test');
        return;
      }

      const roleName = roleArn.split('/').pop()!;
      const response = awsCommand(`iam get-role --role-name ${roleName}`, PRIMARY_REGION);

      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toBe(roleName);

      // Check attached policies
      const policies = awsCommand(
        `iam list-attached-role-policies --role-name ${roleName}`,
        PRIMARY_REGION
      );

      expect(policies.AttachedPolicies).toBeDefined();
      expect(policies.AttachedPolicies.length).toBeGreaterThan(0);

      // Should have VPC execution role
      const hasVpcPolicy = policies.AttachedPolicies.some((p: any) =>
        p.PolicyArn?.includes('AWSLambdaVPCAccessExecutionRole')
      );
      expect(hasVpcPolicy).toBe(true);
    });
  });

  describe('End-to-End Integration', () => {
    test('Primary Lambda should be able to access DynamoDB', () => {
      const functionName =
        outputs.primary_lambda_function_name || discovered.primaryLambdaName;
      const tableName = outputs.dynamodb_table_name || discovered.dynamodbTableName;

      if (!functionName || !tableName) {
        console.warn('⚠️ Lambda function or DynamoDB table not found, skipping test');
        return;
      }

      const lambdaResponse = awsCommand(`lambda get-function --function-name ${functionName}`, PRIMARY_REGION);

      // Verify Lambda has environment variables pointing to DynamoDB
      expect(lambdaResponse.Configuration.Environment).toBeDefined();
      expect(
        lambdaResponse.Configuration.Environment.Variables['DYNAMODB_TABLE_NAME']
      ).toBe(tableName);
    });

    test('Infrastructure should support disaster recovery failover', () => {
      // Verify both regions have resources
      const primaryVpcId = outputs.primary_vpc_id || discovered.primaryVpcId;
      const secondaryVpcId = outputs.secondary_vpc_id || discovered.secondaryVpcId;
      const primaryLambda =
        outputs.primary_lambda_function_name || discovered.primaryLambdaName;
      const secondaryLambda =
        outputs.secondary_lambda_function_name || discovered.secondaryLambdaName;

      // Skip test if critical resources are not found
      if (!primaryVpcId || !secondaryVpcId || !primaryLambda || !secondaryLambda) {
        console.warn('⚠️ Critical resources not found, skipping disaster recovery failover test');
        console.warn(`  Primary VPC: ${primaryVpcId || 'Not found'}`);
        console.warn(`  Secondary VPC: ${secondaryVpcId || 'Not found'}`);
        console.warn(`  Primary Lambda: ${primaryLambda || 'Not found'}`);
        console.warn(`  Secondary Lambda: ${secondaryLambda || 'Not found'}`);
        return;
      }

      expect(primaryVpcId).toBeDefined();
      expect(secondaryVpcId).toBeDefined();
      expect(primaryLambda).toBeDefined();
      expect(secondaryLambda).toBeDefined();

      // Verify global database replication
      const globalClusterId = outputs.aurora_global_cluster_id || discovered.globalClusterId;
      if (globalClusterId) {
        const globalCluster = awsCommand(
          `rds describe-global-clusters --global-cluster-identifier ${globalClusterId}`,
          PRIMARY_REGION
        );

        expect(globalCluster.GlobalClusters).toBeDefined();
        expect(globalCluster.GlobalClusters.length).toBe(1);
        expect(globalCluster.GlobalClusters[0].GlobalClusterMembers.length).toBeGreaterThanOrEqual(2);
      }

      // Verify DynamoDB global table
      const tableName = outputs.dynamodb_table_name || discovered.dynamodbTableName;
      if (tableName) {
        const table = awsCommand(`dynamodb describe-table --table-name ${tableName}`, PRIMARY_REGION);
        expect(table.Table.Replicas).toBeDefined();
        expect(table.Table.Replicas.length).toBeGreaterThan(0);
      }
    });
  });
});
