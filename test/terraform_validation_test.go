package test

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestTerraformValidation validates the Terraform configuration syntax
func TestTerraformValidation(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-12345",
			"dms_source_endpoint":  "test-source.example.com",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	// Validate Terraform configuration
	terraform.Init(t, terraformOptions)
	err := terraform.ValidateE(t, terraformOptions)
	require.NoError(t, err, "Terraform validation should pass")
}

// TestTerraformPlan validates that terraform plan runs successfully
func TestTerraformPlan(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-67890",
			"dms_source_endpoint":  "test-source.example.com",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planExitCode := terraform.PlanExitCode(t, terraformOptions)
	
	// Plan should complete successfully (exit code 0 or 2)
	assert.Contains(t, []int{0, 2}, planExitCode, "Terraform plan should succeed")
}

// TestEnvironmentSuffixInResources validates that environment_suffix is used in resource names
func TestEnvironmentSuffixInResources(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-suffix-123",
			"dms_source_endpoint":  "test-source.example.com",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Check that environment_suffix appears in the plan
	assert.Contains(t, planOutput, "test-suffix-123", "Plan should contain environment_suffix value")
}

// TestVPCConfiguration validates VPC resource creation
func TestVPCConfiguration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-vpc-456",
			"dms_source_endpoint":  "test-source.example.com",
			"vpc_cidr":             "10.0.0.0/16",
			"availability_zones":   []string{"us-east-1a", "us-east-1b", "us-east-1c"},
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planJSON := terraform.Plan(t, terraformOptions)

	// Verify VPC resources in plan
	assert.Contains(t, planJSON, "aws_vpc.main", "VPC should be in plan")
	assert.Contains(t, planJSON, "aws_internet_gateway.main", "Internet Gateway should be in plan")
	assert.Contains(t, planJSON, "aws_subnet.public", "Public subnets should be in plan")
	assert.Contains(t, planJSON, "aws_subnet.private", "Private subnets should be in plan")
	assert.Contains(t, planJSON, "aws_nat_gateway.main", "NAT Gateway should be in plan")
}

// TestRDSConfiguration validates RDS Aurora resource creation
func TestRDSConfiguration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-rds-789",
			"dms_source_endpoint":  "test-source.example.com",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify RDS resources
	assert.Contains(t, planOutput, "aws_rds_cluster.main", "RDS cluster should be in plan")
	assert.Contains(t, planOutput, "aws_rds_cluster_instance.main", "RDS cluster instances should be in plan")
	assert.Contains(t, planOutput, "aurora-postgresql", "Should use Aurora PostgreSQL engine")
	assert.Contains(t, planOutput, "storage_encrypted", "Storage encryption should be configured")
}

// TestECSConfiguration validates ECS Fargate resource creation
func TestECSConfiguration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-ecs-321",
			"dms_source_endpoint":  "test-source.example.com",
			"container_image":      "nginx:latest",
			"ecs_task_cpu":         1024,
			"ecs_task_memory":      2048,
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify ECS resources
	assert.Contains(t, planOutput, "aws_ecs_cluster.main", "ECS cluster should be in plan")
	assert.Contains(t, planOutput, "aws_ecs_service.app", "ECS service should be in plan")
	assert.Contains(t, planOutput, "aws_ecs_task_definition.app", "ECS task definition should be in plan")
	assert.Contains(t, planOutput, "FARGATE", "Should use Fargate launch type")
	assert.Contains(t, planOutput, "ARM64", "Should use ARM64 architecture (Graviton2)")
}

// TestDMSConfiguration validates DMS resource creation
func TestDMSConfiguration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-dms-654",
			"dms_source_endpoint":  "test-source.example.com",
			"dms_source_db_name":   "trading_db",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify DMS resources
	assert.Contains(t, planOutput, "aws_dms_replication_instance.main", "DMS replication instance should be in plan")
	assert.Contains(t, planOutput, "aws_dms_endpoint.source", "DMS source endpoint should be in plan")
	assert.Contains(t, planOutput, "aws_dms_endpoint.target", "DMS target endpoint should be in plan")
	assert.Contains(t, planOutput, "aws_dms_replication_task.main", "DMS replication task should be in plan")
	assert.Contains(t, planOutput, "full-load-and-cdc", "Should use full-load-and-cdc migration type")
}

// TestALBConfiguration validates Application Load Balancer configuration
func TestALBConfiguration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-alb-987",
			"dms_source_endpoint":  "test-source.example.com",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify ALB resources
	assert.Contains(t, planOutput, "aws_lb.main", "Load balancer should be in plan")
	assert.Contains(t, planOutput, "aws_lb_target_group.app", "Target group should be in plan")
	assert.Contains(t, planOutput, "aws_lb_listener.https", "HTTPS listener should be in plan")
	assert.Contains(t, planOutput, "aws_lb_listener.http", "HTTP listener should be in plan")
	assert.Contains(t, planOutput, "application", "Should be application load balancer type")
}

// TestRoute53Configuration validates Route53 weighted routing
func TestRoute53Configuration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":            "test-r53-246",
			"dms_source_endpoint":           "test-source.example.com",
			"route53_zone_name":             "example.com",
			"onpremises_endpoint":           "onprem.example.com",
			"aws_weighted_routing_weight":   0,
			"container_image":               "nginx:latest",
			"alb_certificate_arn":           "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify Route53 resources
	assert.Contains(t, planOutput, "aws_route53_zone.main", "Route53 zone should be in plan")
	assert.Contains(t, planOutput, "aws_route53_record.app_aws", "Route53 AWS record should be in plan")
	assert.Contains(t, planOutput, "aws_route53_record.app_onprem", "Route53 on-prem record should be in plan")
	assert.Contains(t, planOutput, "weighted_routing_policy", "Should have weighted routing policy")
}

// TestSecurityGroups validates security group configuration
func TestSecurityGroups(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-sg-135",
			"dms_source_endpoint":  "test-source.example.com",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify security groups
	assert.Contains(t, planOutput, "aws_security_group.alb", "ALB security group should be in plan")
	assert.Contains(t, planOutput, "aws_security_group.ecs", "ECS security group should be in plan")
	assert.Contains(t, planOutput, "aws_security_group.rds", "RDS security group should be in plan")
	assert.Contains(t, planOutput, "aws_security_group.dms", "DMS security group should be in plan")
}

// TestSecretsManager validates Secrets Manager configuration
func TestSecretsManager(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-secrets-579",
			"dms_source_endpoint":  "test-source.example.com",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify Secrets Manager resources
	assert.Contains(t, planOutput, "aws_secretsmanager_secret.db_master_password", "DB password secret should be in plan")
	assert.Contains(t, planOutput, "aws_secretsmanager_secret.dms_source_credentials", "DMS credentials secret should be in plan")
	assert.Contains(t, planOutput, "aws_secretsmanager_secret.api_keys", "API keys secret should be in plan")
}

// TestSSMParameters validates SSM Parameter Store configuration
func TestSSMParameters(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-ssm-802",
			"dms_source_endpoint":  "test-source.example.com",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify SSM parameters
	assert.Contains(t, planOutput, "aws_ssm_parameter.app_config_database_host", "SSM DB host parameter should be in plan")
	assert.Contains(t, planOutput, "aws_ssm_parameter.app_config_database_port", "SSM DB port parameter should be in plan")
	assert.Contains(t, planOutput, "aws_ssm_parameter.app_config_log_level", "SSM log level parameter should be in plan")
}

// TestCloudWatchDashboard validates CloudWatch dashboard configuration
func TestCloudWatchDashboard(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-cw-913",
			"dms_source_endpoint":  "test-source.example.com",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify CloudWatch resources
	assert.Contains(t, planOutput, "aws_cloudwatch_dashboard.migration", "CloudWatch dashboard should be in plan")
	assert.Contains(t, planOutput, "aws_cloudwatch_metric_alarm.dms_lag", "DMS lag alarm should be in plan")
	assert.Contains(t, planOutput, "aws_cloudwatch_metric_alarm.ecs_cpu_high", "ECS CPU alarm should be in plan")
	assert.Contains(t, planOutput, "aws_cloudwatch_metric_alarm.alb_unhealthy_targets", "ALB unhealthy alarm should be in plan")
}

// TestSNSTopics validates SNS topic configuration
func TestSNSTopics(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-sns-147",
			"dms_source_endpoint":  "test-source.example.com",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify SNS topics
	assert.Contains(t, planOutput, "aws_sns_topic.migration_alerts", "Migration alerts topic should be in plan")
	assert.Contains(t, planOutput, "aws_sns_topic.migration_status", "Migration status topic should be in plan")
}

// TestLambdaRollback validates Lambda rollback function
func TestLambdaRollback(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-lambda-258",
			"dms_source_endpoint":  "test-source.example.com",
			"onpremises_endpoint":  "onprem.example.com",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify Lambda resources
	assert.Contains(t, planOutput, "aws_lambda_function.rollback", "Lambda rollback function should be in plan")
	assert.Contains(t, planOutput, "aws_iam_role.lambda_rollback", "Lambda IAM role should be in plan")
	assert.Contains(t, planOutput, "python3.11", "Should use Python 3.11 runtime")
}

// TestAWSBackup validates AWS Backup configuration
func TestAWSBackup(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-backup-369",
			"dms_source_endpoint":  "test-source.example.com",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify AWS Backup resources
	assert.Contains(t, planOutput, "aws_backup_vault.main", "Backup vault should be in plan")
	assert.Contains(t, planOutput, "aws_backup_plan.main", "Backup plan should be in plan")
	assert.Contains(t, planOutput, "aws_backup_selection.rds", "RDS backup selection should be in plan")
	assert.Contains(t, planOutput, "delete_after = 30", "Should have 30-day retention")
}

// TestOutputs validates that all required outputs are defined
func TestOutputs(t *testing.T) {
	t.Parallel()

	// Read outputs.tf file
	outputsContent, err := os.ReadFile("../lib/outputs.tf")
	require.NoError(t, err, "Should be able to read outputs.tf")

	outputsStr := string(outputsContent)

	// Verify critical outputs
	requiredOutputs := []string{
		"vpc_id",
		"alb_dns_name",
		"rds_cluster_endpoint",
		"ecs_cluster_name",
		"route53_zone_id",
		"cloudwatch_dashboard_name",
		"sns_alerts_topic_arn",
		"backup_vault_name",
		"lambda_rollback_function_name",
		"db_secret_arn",
	}

	for _, output := range requiredOutputs {
		assert.Contains(t, outputsStr, fmt.Sprintf("output \"%s\"", output),
			fmt.Sprintf("Output %s should be defined", output))
	}
}

// TestResourceTags validates that resources have proper tagging
func TestResourceTags(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test-tags-741",
			"dms_source_endpoint":  "test-source.example.com",
			"project_name":         "trading-migration",
			"migration_phase":      "preparation",
			"container_image":      "nginx:latest",
			"alb_certificate_arn":  "arn:aws:acm:us-east-1:123456789012:certificate/test",
		},
		NoColor: true,
	})

	terraform.Init(t, terraformOptions)
	planOutput := terraform.Plan(t, terraformOptions)

	// Verify default tags are applied
	assert.Contains(t, planOutput, "Environment", "Environment tag should be present")
	assert.Contains(t, planOutput, "Project", "Project tag should be present")
	assert.Contains(t, planOutput, "MigrationPhase", "MigrationPhase tag should be present")
	assert.Contains(t, planOutput, "trading-migration", "Project name should be in tags")
}

// TestNoHardcodedValues validates that no hardcoded values are present
func TestNoHardcodedValues(t *testing.T) {
	t.Parallel()

	// List of files to check
	files := []string{
		"../lib/vpc.tf",
		"../lib/rds_aurora.tf",
		"../lib/ecs.tf",
		"../lib/alb.tf",
		"../lib/dms.tf",
	}

	for _, file := range files {
		content, err := os.ReadFile(file)
		require.NoError(t, err, fmt.Sprintf("Should be able to read %s", file))

		contentStr := string(content)

		// Check for environment_suffix variable usage (not hardcoded)
		if strings.Contains(contentStr, "resource \"") {
			// Should use var.environment_suffix, not hardcoded values
			assert.Contains(t, contentStr, "var.environment_suffix",
				fmt.Sprintf("%s should use var.environment_suffix", file))
		}
	}
}
