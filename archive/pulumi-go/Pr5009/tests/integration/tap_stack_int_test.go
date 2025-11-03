package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

var outputs map[string]interface{}

func TestMain(m *testing.M) {
	outputsPath := filepath.Join("..", "cfn-outputs", "flat-outputs.json")
	if _, err := os.Stat(outputsPath); err == nil {
		data, err := os.ReadFile(outputsPath)
		if err == nil {
			json.Unmarshal(data, &outputs)
		}
	}
	os.Exit(m.Run())
}

//
// ──────────────────────────────────────────────
//   BASE INFRASTRUCTURE VALIDATION
// ──────────────────────────────────────────────
//

func TestOutputsFileExists(t *testing.T) {
	outputsPath := filepath.Join("..", "cfn-outputs", "flat-outputs.json")
	if _, err := os.Stat(outputsPath); os.IsNotExist(err) {
		t.Fatalf("Outputs file not found: %s", outputsPath)
	}
}

func TestOutputsLoaded(t *testing.T) {
	if outputs == nil {
		t.Fatal("Outputs not loaded or invalid JSON")
	}
}

//
// ──────────────────────────────────────────────
//   NETWORKING (VPC + SUBNETS)
// ──────────────────────────────────────────────
//

func TestVpcAndSubnetsExist(t *testing.T) {
	for k, v := range outputs {
		if strings.Contains(k, "vpc_id") {
			if v.(string) == "" {
				t.Fatal("VPC ID is empty")
			}
		}
		if strings.Contains(k, "subnet") && strings.Contains(k, "id") {
			if v.(string) == "" {
				t.Fatalf("Subnet ID (%s) is empty", k)
			}
		}
	}
}

//
// ──────────────────────────────────────────────
//   DATABASE (RDS PostgreSQL)
// ──────────────────────────────────────────────
//

func TestRdsInstanceAvailable(t *testing.T) {
	for k, v := range outputs {
		if strings.Contains(k, "rds_instance_status") {
			if v.(string) != "available" {
				t.Fatalf("Expected RDS to be 'available', got '%s'", v)
			}
		}
	}
}

func TestRdsEndpointAndArn(t *testing.T) {
	for k, v := range outputs {
		if strings.Contains(k, "rds_endpoint") {
			endpoint := v.(string)
			if endpoint == "" {
				t.Fatal("RDS endpoint missing")
			}
		}
		if strings.Contains(k, "rds_arn") {
			arn := v.(string)
			if !strings.HasPrefix(arn, "arn:aws:rds:") {
				t.Fatalf("Invalid RDS ARN: %s", arn)
			}
		}
	}
}

func TestRdsEncryptionAndKmsKey(t *testing.T) {
	for k, v := range outputs {
		if strings.Contains(k, "rds_encryption_enabled") {
			if encrypted, ok := v.(bool); ok && !encrypted {
				t.Fatal("RDS encryption must be enabled")
			}
		}
		if strings.Contains(k, "rds_kms_key_id") {
			if v.(string) == "" {
				t.Fatal("RDS KMS Key ID missing")
			}
		}
	}
}

//
// ──────────────────────────────────────────────
//   ELASTICACHE (REDIS)
// ──────────────────────────────────────────────
//

func TestElastiCacheEndpointArnAndStatus(t *testing.T) {
	for k, v := range outputs {
		if strings.Contains(k, "redis_endpoint") && v.(string) == "" {
			t.Fatal("Redis endpoint missing")
		}
		if strings.Contains(k, "redis_status") {
			status := v.(string)
			if status != "available" && status != "creating" {
				t.Fatalf("Unexpected Redis status: %s", status)
			}
		}
		if strings.Contains(k, "redis_arn") {
			arn := v.(string)
			if !strings.HasPrefix(arn, "arn:aws:elasticache:") {
				t.Fatalf("Invalid Redis ARN: %s", arn)
			}
		}
	}
}

//
// ──────────────────────────────────────────────
//   EFS VALIDATION
// ──────────────────────────────────────────────
//

func TestEfsArnAndLifecycle(t *testing.T) {
	for k, v := range outputs {
		if strings.Contains(k, "efs_arn") {
			arn := v.(string)
			if !strings.HasPrefix(arn, "arn:aws:elasticfilesystem:") {
				t.Fatalf("Invalid EFS ARN: %s", arn)
			}
		}
		if strings.Contains(k, "efs_lifecycle_policy") && v.(string) == "" {
			t.Fatal("EFS lifecycle policy not set")
		}
	}
}

//
// ──────────────────────────────────────────────
//   ECS + ALB VALIDATION
// ──────────────────────────────────────────────
//

func TestEcsClusterAndService(t *testing.T) {
	for k, v := range outputs {
		if strings.Contains(k, "ecs_cluster_arn") {
			if !strings.HasPrefix(v.(string), "arn:aws:ecs:") {
				t.Fatalf("Invalid ECS cluster ARN: %s", v)
			}
		}
		if strings.Contains(k, "ecs_service_name") && v.(string) == "" {
			t.Fatal("ECS service name missing")
		}
	}
}

func TestAlbAndListener(t *testing.T) {
	for k, v := range outputs {
		if strings.Contains(k, "alb_arn") {
			if !strings.HasPrefix(v.(string), "arn:aws:elasticloadbalancing:") {
				t.Fatalf("Invalid ALB ARN: %s", v)
			}
		}
		if strings.Contains(k, "alb_dns_name") && v.(string) == "" {
			t.Fatal("ALB DNS name missing")
		}
	}
}

//
// ──────────────────────────────────────────────
//   KINESIS + SECURITY
// ──────────────────────────────────────────────
//

func TestKinesisStreamAndArn(t *testing.T) {
	for k, v := range outputs {
		if strings.Contains(k, "kinesis_stream_arn") {
			if !strings.HasPrefix(v.(string), "arn:aws:kinesis:") {
				t.Fatalf("Invalid Kinesis ARN: %s", v)
			}
		}
	}
}

func TestSecurityGroupsValid(t *testing.T) {
	for k, v := range outputs {
		if strings.Contains(k, "security_group") && strings.Contains(k, "id") {
			if !strings.HasPrefix(v.(string), "sg-") {
				t.Fatalf("Invalid Security Group ID: %s", v)
			}
		}
	}
}

//
// ──────────────────────────────────────────────
//   MONITORING, BACKUP, COMPLIANCE
// ──────────────────────────────────────────────
//

func TestBackupRetentionAndMonitoring(t *testing.T) {
	for k, v := range outputs {
		if strings.Contains(k, "backup_retention_period") {
			if retention, ok := v.(float64); ok && retention <= 0 {
				t.Fatal("Backup retention period must be > 0")
			}
		}
		if strings.Contains(k, "performance_insights_enabled") {
			if enabled, ok := v.(bool); ok && !enabled {
				t.Fatal("Performance Insights should be enabled")
			}
		}
	}
}

//
// ──────────────────────────────────────────────
//   KMS + SECRETS MANAGER
// ──────────────────────────────────────────────
//

func TestKmsAndSecretsArnsValid(t *testing.T) {
	for k, v := range outputs {
		if strings.Contains(k, "kms_key") && strings.Contains(k, "arn") {
			if !strings.HasPrefix(v.(string), "arn:aws:kms:") {
				t.Fatalf("Invalid KMS ARN: %s", v)
			}
		}
		if strings.Contains(k, "secretsmanager_secret") && strings.Contains(k, "arn") {
			if !strings.HasPrefix(v.(string), "arn:aws:secretsmanager:") {
				t.Fatalf("Invalid Secrets Manager ARN: %s", v)
			}
		}
	}
}
