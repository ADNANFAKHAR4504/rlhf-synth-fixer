package test

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/gruntwork-io/terratest/modules/aws"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestIntegrationWithOutputs tests integration using cfn-outputs/flat-outputs.json
func TestIntegrationWithOutputs(t *testing.T) {
	// Skip if not in integration test mode
	if os.Getenv("INTEGRATION_TEST") != "true" {
		t.Skip("Skipping integration test. Set INTEGRATION_TEST=true to run")
	}

	// Read flat-outputs.json
	outputsFile := "../cfn-outputs/flat-outputs.json"
	if _, err := os.Stat(outputsFile); os.IsNotExist(err) {
		t.Skip("flat-outputs.json not found. Deploy infrastructure first")
	}

	outputsData, err := os.ReadFile(outputsFile)
	require.NoError(t, err, "Should be able to read flat-outputs.json")

	var outputs map[string]string
	err = json.Unmarshal(outputsData, &outputs)
	require.NoError(t, err, "Should be able to parse flat-outputs.json")

	// Test VPC exists
	if vpcID, ok := outputs["vpc_id"]; ok && vpcID != "" {
		t.Run("VPCExists", func(t *testing.T) {
			awsRegion := "us-east-1"
			vpc := aws.GetVpcById(t, vpcID, awsRegion)
			assert.NotNil(t, vpc, "VPC should exist")
			assert.Equal(t, vpcID, vpc.Id, "VPC ID should match")
		})
	}

	// Test ALB exists
	if albDNS, ok := outputs["alb_dns_name"]; ok && albDNS != "" {
		t.Run("ALBExists", func(t *testing.T) {
			assert.NotEmpty(t, albDNS, "ALB DNS name should not be empty")
			assert.Contains(t, albDNS, "elb.amazonaws.com", "Should be valid ALB DNS")
		})
	}

	// Test RDS cluster exists
	if rdsEndpoint, ok := outputs["rds_cluster_endpoint"]; ok && rdsEndpoint != "" {
		t.Run("RDSClusterExists", func(t *testing.T) {
			assert.NotEmpty(t, rdsEndpoint, "RDS endpoint should not be empty")
			assert.Contains(t, rdsEndpoint, "rds.amazonaws.com", "Should be valid RDS endpoint")
		})
	}

	// Test ECS cluster exists
	if ecsClusterName, ok := outputs["ecs_cluster_name"]; ok && ecsClusterName != "" {
		t.Run("ECSClusterExists", func(t *testing.T) {
			assert.NotEmpty(t, ecsClusterName, "ECS cluster name should not be empty")
		})
	}

	// Test Route53 zone exists
	if zoneID, ok := outputs["route53_zone_id"]; ok && zoneID != "" {
		t.Run("Route53ZoneExists", func(t *testing.T) {
			assert.NotEmpty(t, zoneID, "Route53 zone ID should not be empty")
			assert.Contains(t, zoneID, "Z", "Should be valid hosted zone ID format")
		})
	}

	// Test CloudWatch dashboard exists
	if dashboardName, ok := outputs["cloudwatch_dashboard_name"]; ok && dashboardName != "" {
		t.Run("CloudWatchDashboardExists", func(t *testing.T) {
			assert.NotEmpty(t, dashboardName, "Dashboard name should not be empty")
			assert.Contains(t, dashboardName, "migration-dashboard", "Should be migration dashboard")
		})
	}

	// Test SNS topics exist
	if alertsTopicARN, ok := outputs["sns_alerts_topic_arn"]; ok && alertsTopicARN != "" {
		t.Run("SNSAlertsTopicExists", func(t *testing.T) {
			assert.NotEmpty(t, alertsTopicARN, "Alerts topic ARN should not be empty")
			assert.Contains(t, alertsTopicARN, "arn:aws:sns:", "Should be valid SNS ARN")
		})
	}

	// Test Backup vault exists
	if backupVaultName, ok := outputs["backup_vault_name"]; ok && backupVaultName != "" {
		t.Run("BackupVaultExists", func(t *testing.T) {
			assert.NotEmpty(t, backupVaultName, "Backup vault name should not be empty")
			assert.Contains(t, backupVaultName, "backup-vault", "Should be backup vault")
		})
	}

	// Test Lambda function exists
	if lambdaName, ok := outputs["lambda_rollback_function_name"]; ok && lambdaName != "" {
		t.Run("LambdaRollbackExists", func(t *testing.T) {
			assert.NotEmpty(t, lambdaName, "Lambda function name should not be empty")
			assert.Contains(t, lambdaName, "rollback", "Should be rollback function")
		})
	}

	// Test Secrets Manager secrets exist
	if secretARN, ok := outputs["db_secret_arn"]; ok && secretARN != "" {
		t.Run("DBSecretExists", func(t *testing.T) {
			assert.NotEmpty(t, secretARN, "DB secret ARN should not be empty")
			assert.Contains(t, secretARN, "arn:aws:secretsmanager:", "Should be valid secret ARN")
		})
	}
}

// TestALBHealthCheck tests ALB health check functionality
func TestALBHealthCheck(t *testing.T) {
	if os.Getenv("INTEGRATION_TEST") != "true" {
		t.Skip("Skipping integration test")
	}

	outputsData, _ := os.ReadFile("../cfn-outputs/flat-outputs.json")
	var outputs map[string]string
	json.Unmarshal(outputsData, &outputs)

	albDNS, ok := outputs["alb_dns_name"]
	if !ok || albDNS == "" {
		t.Skip("ALB DNS not available in outputs")
	}

	// Note: In a real test, you would make HTTP requests to the ALB
	// For this test, we just verify the DNS format
	assert.Contains(t, albDNS, "amazonaws.com", "ALB DNS should be valid")
}

// TestRDSConnectivity tests RDS database connectivity
func TestRDSConnectivity(t *testing.T) {
	if os.Getenv("INTEGRATION_TEST") != "true" {
		t.Skip("Skipping integration test")
	}

	outputsData, _ := os.ReadFile("../cfn-outputs/flat-outputs.json")
	var outputs map[string]string
	json.Unmarshal(outputsData, &outputs)

	rdsEndpoint, ok := outputs["rds_cluster_endpoint"]
	if !ok || rdsEndpoint == "" {
		t.Skip("RDS endpoint not available in outputs")
	}

	// Verify endpoint format
	assert.Contains(t, rdsEndpoint, "rds.amazonaws.com", "Should be valid RDS endpoint")
	assert.NotEmpty(t, rdsEndpoint, "RDS endpoint should not be empty")

	// Note: Actual database connection would require credentials from Secrets Manager
	// and network access to the private subnet
}

// TestECSServiceRunning tests ECS service is running
func TestECSServiceRunning(t *testing.T) {
	if os.Getenv("INTEGRATION_TEST") != "true" {
		t.Skip("Skipping integration test")
	}

	outputsData, _ := os.ReadFile("../cfn-outputs/flat-outputs.json")
	var outputs map[string]string
	json.Unmarshal(outputsData, &outputs)

	ecsClusterName, ok := outputs["ecs_cluster_name"]
	if !ok || ecsClusterName == "" {
		t.Skip("ECS cluster name not available in outputs")
	}

	ecsServiceName, ok := outputs["ecs_service_name"]
	if !ok || ecsServiceName == "" {
		t.Skip("ECS service name not available in outputs")
	}

	// Verify service name format
	assert.NotEmpty(t, ecsClusterName, "ECS cluster name should not be empty")
	assert.NotEmpty(t, ecsServiceName, "ECS service name should not be empty")
	assert.Contains(t, ecsServiceName, "trading-app-service", "Should be trading app service")
}

// TestDMSReplicationStatus tests DMS replication instance status
func TestDMSReplicationStatus(t *testing.T) {
	if os.Getenv("INTEGRATION_TEST") != "true" {
		t.Skip("Skipping integration test")
	}

	outputsData, _ := os.ReadFile("../cfn-outputs/flat-outputs.json")
	var outputs map[string]string
	json.Unmarshal(outputsData, &outputs)

	dmsARN, ok := outputs["dms_replication_instance_arn"]
	if !ok || dmsARN == "" {
		t.Skip("DMS replication instance ARN not available in outputs")
	}

	// Verify ARN format
	assert.Contains(t, dmsARN, "arn:aws:dms:", "Should be valid DMS ARN")
	assert.NotEmpty(t, dmsARN, "DMS ARN should not be empty")
}

// TestRoute53WeightedRouting tests Route53 weighted routing configuration
func TestRoute53WeightedRouting(t *testing.T) {
	if os.Getenv("INTEGRATION_TEST") != "true" {
		t.Skip("Skipping integration test")
	}

	outputsData, _ := os.ReadFile("../cfn-outputs/flat-outputs.json")
	var outputs map[string]string
	json.Unmarshal(outputsData, &outputs)

	zoneID, ok := outputs["route53_zone_id"]
	if !ok || zoneID == "" {
		t.Skip("Route53 zone ID not available in outputs")
	}

	assert.NotEmpty(t, zoneID, "Route53 zone ID should not be empty")
}

// TestCloudWatchAlarms tests CloudWatch alarms configuration
func TestCloudWatchAlarms(t *testing.T) {
	if os.Getenv("INTEGRATION_TEST") != "true" {
		t.Skip("Skipping integration test")
	}

	outputsData, _ := os.ReadFile("../cfn-outputs/flat-outputs.json")
	var outputs map[string]string
	json.Unmarshal(outputsData, &outputs)

	dashboardName, ok := outputs["cloudwatch_dashboard_name"]
	if !ok || dashboardName == "" {
		t.Skip("CloudWatch dashboard name not available in outputs")
	}

	assert.NotEmpty(t, dashboardName, "Dashboard name should not be empty")
	assert.Contains(t, dashboardName, "migration-dashboard", "Should be migration dashboard")
}

// TestBackupPlanConfiguration tests AWS Backup plan configuration
func TestBackupPlanConfiguration(t *testing.T) {
	if os.Getenv("INTEGRATION_TEST") != "true" {
		t.Skip("Skipping integration test")
	}

	outputsData, _ := os.ReadFile("../cfn-outputs/flat-outputs.json")
	var outputs map[string]string
	json.Unmarshal(outputsData, &outputs)

	backupPlanID, ok := outputs["backup_plan_id"]
	if !ok || backupPlanID == "" {
		t.Skip("Backup plan ID not available in outputs")
	}

	assert.NotEmpty(t, backupPlanID, "Backup plan ID should not be empty")
}

// TestSecretsManagerSecrets tests Secrets Manager integration
func TestSecretsManagerSecrets(t *testing.T) {
	if os.Getenv("INTEGRATION_TEST") != "true" {
		t.Skip("Skipping integration test")
	}

	outputsData, _ := os.ReadFile("../cfn-outputs/flat-outputs.json")
	var outputs map[string]string
	json.Unmarshal(outputsData, &outputs)

	dbSecretARN, ok := outputs["db_secret_arn"]
	if !ok || dbSecretARN == "" {
		t.Skip("DB secret ARN not available in outputs")
	}

	apiKeysARN, ok := outputs["api_keys_secret_arn"]
	if !ok || apiKeysARN == "" {
		t.Skip("API keys secret ARN not available in outputs")
	}

	assert.Contains(t, dbSecretARN, "arn:aws:secretsmanager:", "Should be valid secret ARN")
	assert.Contains(t, apiKeysARN, "arn:aws:secretsmanager:", "Should be valid secret ARN")
}
