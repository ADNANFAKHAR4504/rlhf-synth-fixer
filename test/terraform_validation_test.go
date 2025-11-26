package test

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

func TestTerraformValidation(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		NoColor:      true,
	})

	// Validate Terraform configuration
	terraform.Init(t, terraformOptions)
	terraform.Validate(t, terraformOptions)
}

func TestTerraformFormat(t *testing.T) {
	t.Parallel()

	terraformOptions := &terraform.Options{
		TerraformDir: "../lib",
		NoColor:      true,
	}

	// Check if Terraform files are properly formatted
	output := terraform.RunTerraformCommand(t, terraformOptions, "fmt", "-check", "-recursive")
	assert.Empty(t, output, "Terraform files should be properly formatted")
}

func TestVPCConfiguration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test",
			"aws_region":           "eu-central-1",
			"domain_name":          "test.example.com",
			"alert_email":          "test@example.com",
			"blue_account_id":      "123456789012",
			"green_account_id":     "234567890123",
			"transit_gateway_id":   "tgw-test123",
			"onprem_db_endpoint":   "192.168.1.100",
			"onprem_db_name":       "testdb",
			"onprem_db_username":   "testuser",
			"onprem_db_password":   "testpassword",
			"aurora_master_password": "testpassword123",
		},
		NoColor: true,
	})

	defer terraform.Destroy(t, terraformOptions)

	// Plan only test - do not apply
	planOutput := terraform.InitAndPlan(t, terraformOptions)

	// Verify VPC is in plan
	assert.Contains(t, planOutput, "aws_vpc.main")

	// Verify subnets are in plan
	assert.Contains(t, planOutput, "aws_subnet.public")
	assert.Contains(t, planOutput, "aws_subnet.private")
	assert.Contains(t, planOutput, "aws_subnet.database")
}

func TestAuroraConfiguration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test",
			"aws_region":           "eu-central-1",
			"domain_name":          "test.example.com",
			"alert_email":          "test@example.com",
			"blue_account_id":      "123456789012",
			"green_account_id":     "234567890123",
			"transit_gateway_id":   "tgw-test123",
			"onprem_db_endpoint":   "192.168.1.100",
			"onprem_db_name":       "testdb",
			"onprem_db_username":   "testuser",
			"onprem_db_password":   "testpassword",
			"aurora_master_password": "testpassword123",
			"aurora_engine_version": "14.6",
			"aurora_backup_retention_days": 35,
		},
		NoColor: true,
	})

	defer terraform.Destroy(t, terraformOptions)

	// Plan only test
	planOutput := terraform.InitAndPlan(t, terraformOptions)

	// Verify Aurora cluster is in plan
	assert.Contains(t, planOutput, "aws_rds_cluster.aurora")
	assert.Contains(t, planOutput, "aurora-postgresql")
	assert.Contains(t, planOutput, "14.6")

	// Verify encryption is enabled
	assert.Contains(t, planOutput, "storage_encrypted")

	// Verify backup retention
	assert.Contains(t, planOutput, "backup_retention_period")
}

func TestDMSConfiguration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test",
			"aws_region":           "eu-central-1",
			"domain_name":          "test.example.com",
			"alert_email":          "test@example.com",
			"blue_account_id":      "123456789012",
			"green_account_id":     "234567890123",
			"transit_gateway_id":   "tgw-test123",
			"onprem_db_endpoint":   "192.168.1.100",
			"onprem_db_name":       "testdb",
			"onprem_db_username":   "testuser",
			"onprem_db_password":   "testpassword",
			"aurora_master_password": "testpassword123",
		},
		NoColor: true,
	})

	defer terraform.Destroy(t, terraformOptions)

	// Plan only test
	planOutput := terraform.InitAndPlan(t, terraformOptions)

	// Verify DMS resources are in plan
	assert.Contains(t, planOutput, "aws_dms_replication_instance.main")
	assert.Contains(t, planOutput, "aws_dms_endpoint.source")
	assert.Contains(t, planOutput, "aws_dms_endpoint.target")
	assert.Contains(t, planOutput, "aws_dms_replication_task.migration")

	// Verify multi-AZ is enabled
	assert.Contains(t, planOutput, "multi_az")
}

func TestLambdaConfiguration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test",
			"aws_region":           "eu-central-1",
			"domain_name":          "test.example.com",
			"alert_email":          "test@example.com",
			"blue_account_id":      "123456789012",
			"green_account_id":     "234567890123",
			"transit_gateway_id":   "tgw-test123",
			"onprem_db_endpoint":   "192.168.1.100",
			"onprem_db_name":       "testdb",
			"onprem_db_username":   "testuser",
			"onprem_db_password":   "testpassword",
			"aurora_master_password": "testpassword123",
			"lambda_memory_size":    1024,
			"lambda_reserved_concurrency": 10,
		},
		NoColor: true,
	})

	defer terraform.Destroy(t, terraformOptions)

	// Plan only test
	planOutput := terraform.InitAndPlan(t, terraformOptions)

	// Verify Lambda function is in plan
	assert.Contains(t, planOutput, "aws_lambda_function.data_transformation")

	// Verify memory size
	assert.Contains(t, planOutput, "1024")

	// Verify reserved concurrency
	assert.Contains(t, planOutput, "reserved_concurrent_executions")
}

func TestALBConfiguration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test",
			"aws_region":           "eu-central-1",
			"domain_name":          "test.example.com",
			"alert_email":          "test@example.com",
			"blue_account_id":      "123456789012",
			"green_account_id":     "234567890123",
			"transit_gateway_id":   "tgw-test123",
			"onprem_db_endpoint":   "192.168.1.100",
			"onprem_db_name":       "testdb",
			"onprem_db_username":   "testuser",
			"onprem_db_password":   "testpassword",
			"aurora_master_password": "testpassword123",
			"alb_target_weight_blue":  50,
			"alb_target_weight_green": 50,
		},
		NoColor: true,
	})

	defer terraform.Destroy(t, terraformOptions)

	// Plan only test
	planOutput := terraform.InitAndPlan(t, terraformOptions)

	// Verify ALB is in plan
	assert.Contains(t, planOutput, "aws_lb.main")
	assert.Contains(t, planOutput, "aws_lb_target_group.blue")
	assert.Contains(t, planOutput, "aws_lb_target_group.green")

	// Verify weighted target groups
	assert.Contains(t, planOutput, "forward")
}

func TestSecurityGroupConfiguration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test",
			"aws_region":           "eu-central-1",
			"domain_name":          "test.example.com",
			"alert_email":          "test@example.com",
			"blue_account_id":      "123456789012",
			"green_account_id":     "234567890123",
			"transit_gateway_id":   "tgw-test123",
			"onprem_db_endpoint":   "192.168.1.100",
			"onprem_db_name":       "testdb",
			"onprem_db_username":   "testuser",
			"onprem_db_password":   "testpassword",
			"aurora_master_password": "testpassword123",
		},
		NoColor: true,
	})

	defer terraform.Destroy(t, terraformOptions)

	// Plan only test
	planOutput := terraform.InitAndPlan(t, terraformOptions)

	// Verify security groups are in plan
	assert.Contains(t, planOutput, "aws_security_group.alb")
	assert.Contains(t, planOutput, "aws_security_group.lambda")
	assert.Contains(t, planOutput, "aws_security_group.aurora")
	assert.Contains(t, planOutput, "aws_security_group.dms")
}

func TestCloudWatchConfiguration(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":   "test",
			"aws_region":           "eu-central-1",
			"domain_name":          "test.example.com",
			"alert_email":          "test@example.com",
			"blue_account_id":      "123456789012",
			"green_account_id":     "234567890123",
			"transit_gateway_id":   "tgw-test123",
			"onprem_db_endpoint":   "192.168.1.100",
			"onprem_db_name":       "testdb",
			"onprem_db_username":   "testuser",
			"onprem_db_password":   "testpassword",
			"aurora_master_password": "testpassword123",
		},
		NoColor: true,
	})

	defer terraform.Destroy(t, terraformOptions)

	// Plan only test
	planOutput := terraform.InitAndPlan(t, terraformOptions)

	// Verify CloudWatch resources are in plan
	assert.Contains(t, planOutput, "aws_cloudwatch_dashboard.migration")
	assert.Contains(t, planOutput, "aws_sns_topic.alerts")
	assert.Contains(t, planOutput, "aws_cloudwatch_metric_alarm")
}
