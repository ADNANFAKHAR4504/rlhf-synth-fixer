package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
)

// synthStack synthesizes the stack to a temp outdir and returns the tf json path
func synthStack(t *testing.T, envSuffix string) (string, map[string]interface{}) {
	t.Helper()

	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set environment suffix
	old := os.Getenv("ENVIRONMENT_SUFFIX")
	t.Cleanup(func() { _ = os.Setenv("ENVIRONMENT_SUFFIX", old) })
	_ = os.Setenv("ENVIRONMENT_SUFFIX", envSuffix)

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	NewTapStack(app, "TapStack")
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "TapStack", "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}

	// Read and parse the synthesized JSON
	data, err := os.ReadFile(tfPath)
	if err != nil {
		t.Fatalf("failed to read synthesized file: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse synthesized JSON: %v", err)
	}

	return tfPath, tfConfig
}

func TestStackSynthesis(t *testing.T) {
	tfPath, _ := synthStack(t, "test123")
	if tfPath == "" {
		t.Fatal("expected non-empty terraform json path")
	}
}

func TestKMSKeyConfiguration(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})
	kmsKeys := resources["aws_kms_key"].(map[string]interface{})

	if len(kmsKeys) == 0 {
		t.Fatal("expected at least one KMS key")
	}

	for name, res := range kmsKeys {
		key := res.(map[string]interface{})

		// Check deletion window
		if dw, ok := key["deletion_window_in_days"]; ok {
			if dw.(float64) != 30 {
				t.Errorf("KMS key %s: expected deletion_window_in_days=30, got %v", name, dw)
			}
		}

		// Check description exists
		if desc, ok := key["description"]; !ok || desc == "" {
			t.Errorf("KMS key %s: missing description", name)
		}

		// Check policy exists
		if policy, ok := key["policy"]; !ok || policy == "" {
			t.Errorf("KMS key %s: missing policy", name)
		}
	}
}

func TestS3BucketConfiguration(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})
	buckets := resources["aws_s3_bucket"].(map[string]interface{})

	if len(buckets) < 3 {
		t.Fatalf("expected at least 3 S3 buckets (artifacts, source, replica), got %d", len(buckets))
	}

	for name, res := range buckets {
		bucket := res.(map[string]interface{})

		// Check force_destroy is set to false for data protection
		if fd, ok := bucket["force_destroy"]; ok && fd.(bool) {
			t.Errorf("S3 bucket %s: force_destroy should be false for data protection", name)
		}

		// Check bucket naming includes environment suffix
		if bucketName, ok := bucket["bucket"].(string); ok {
			if !strings.Contains(bucketName, "test123") {
				t.Errorf("S3 bucket %s: bucket name should include environment suffix", name)
			}
		}
	}
}

func TestS3BucketEncryption(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check for encryption configuration
	if encConfigs, ok := resources["aws_s3_bucket_server_side_encryption_configuration"]; ok {
		configs := encConfigs.(map[string]interface{})
		if len(configs) == 0 {
			t.Error("expected S3 bucket encryption configurations")
		}
	}
}

func TestS3BucketPublicAccessBlock(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if pabs, ok := resources["aws_s3_bucket_public_access_block"]; ok {
		blocks := pabs.(map[string]interface{})

		for name, res := range blocks {
			pab := res.(map[string]interface{})

			// All public access should be blocked
			checks := []string{
				"block_public_acls",
				"block_public_policy",
				"ignore_public_acls",
				"restrict_public_buckets",
			}

			for _, check := range checks {
				if val, ok := pab[check]; !ok || !val.(bool) {
					t.Errorf("S3 public access block %s: %s should be true", name, check)
				}
			}
		}
	} else {
		t.Error("expected S3 bucket public access blocks")
	}
}

func TestIAMRoles(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})
	roles := resources["aws_iam_role"].(map[string]interface{})

	expectedRoles := []string{
		"pipeline-role",
		"build-role",
		"staging-cfn-role",
		"prod-cfn-role",
	}

	if len(roles) < len(expectedRoles) {
		t.Fatalf("expected at least %d IAM roles, got %d", len(expectedRoles), len(roles))
	}

	for _, expectedRole := range expectedRoles {
		found := false
		for roleName := range roles {
			if strings.Contains(roleName, expectedRole) {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("expected to find IAM role containing %s", expectedRole)
		}
	}
}

func TestCodeBuildProject(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if projects, ok := resources["aws_codebuild_project"]; ok {
		buildProjects := projects.(map[string]interface{})

		if len(buildProjects) == 0 {
			t.Fatal("expected at least one CodeBuild project")
		}

		for name, res := range buildProjects {
			project := res.(map[string]interface{})

			// Check artifacts configuration
			if artifacts, ok := project["artifacts"].(map[string]interface{}); ok {
				if artifactType := artifacts["type"]; artifactType != "CODEPIPELINE" {
					t.Errorf("CodeBuild project %s: expected artifact type CODEPIPELINE, got %v", name, artifactType)
				}
			}

			// Check environment configuration
			if env, ok := project["environment"].(map[string]interface{}); ok {
				if computeType := env["compute_type"]; computeType != "BUILD_GENERAL1_MEDIUM" {
					t.Errorf("CodeBuild project %s: unexpected compute type %v", name, computeType)
				}

				if privMode, ok := env["privileged_mode"]; !ok || !privMode.(bool) {
					t.Errorf("CodeBuild project %s: privileged_mode should be true for Docker", name)
				}
			}

			// Check source configuration
			if source, ok := project["source"].(map[string]interface{}); ok {
				if sourceType := source["type"]; sourceType != "CODEPIPELINE" {
					t.Errorf("CodeBuild project %s: expected source type CODEPIPELINE, got %v", name, sourceType)
				}

				if buildspec, ok := source["buildspec"].(string); !ok || buildspec == "" {
					t.Errorf("CodeBuild project %s: missing buildspec", name)
				}
			}
		}
	} else {
		t.Error("expected CodeBuild projects")
	}
}

func TestCodePipeline(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if pipelines, ok := resources["aws_codepipeline"]; ok {
		pipelineResources := pipelines.(map[string]interface{})

		if len(pipelineResources) == 0 {
			t.Fatal("expected at least one CodePipeline")
		}

		for name, res := range pipelineResources {
			pipeline := res.(map[string]interface{})

			// Check artifact store configuration
			if artifactStore, ok := pipeline["artifact_store"].([]interface{}); ok && len(artifactStore) > 0 {
				store := artifactStore[0].(map[string]interface{})

				if storeType := store["type"]; storeType != "S3" {
					t.Errorf("CodePipeline %s: expected artifact store type S3, got %v", name, storeType)
				}

				// Check encryption key
				if encKey, ok := store["encryption_key"].(map[string]interface{}); ok {
					if keyType := encKey["type"]; keyType != "KMS" {
						t.Errorf("CodePipeline %s: expected encryption key type KMS, got %v", name, keyType)
					}
				} else {
					t.Errorf("CodePipeline %s: missing encryption key configuration", name)
				}
			}

			// Check stages
			if stages, ok := pipeline["stage"].([]interface{}); ok {
				expectedStages := []string{"Source", "Build", "DeployStaging", "ApprovalForProduction", "DeployProduction"}

				if len(stages) != len(expectedStages) {
					t.Errorf("CodePipeline %s: expected %d stages, got %d", name, len(expectedStages), len(stages))
				}

				for i, stage := range stages {
					if i < len(expectedStages) {
						stageMap := stage.(map[string]interface{})
						if stageName := stageMap["name"]; stageName != expectedStages[i] {
							t.Errorf("CodePipeline %s: expected stage %d to be %s, got %v", name, i, expectedStages[i], stageName)
						}
					}
				}
			}
		}
	} else {
		t.Error("expected CodePipeline resources")
	}
}

func TestSNSTopic(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if topics, ok := resources["aws_sns_topic"]; ok {
		snsTopics := topics.(map[string]interface{})

		if len(snsTopics) == 0 {
			t.Fatal("expected at least one SNS topic")
		}

		for name, res := range snsTopics {
			topic := res.(map[string]interface{})

			// Check KMS encryption
			if kmsKeyId, ok := topic["kms_master_key_id"]; !ok || kmsKeyId == "" {
				t.Errorf("SNS topic %s: missing KMS encryption", name)
			}
		}
	} else {
		t.Error("expected SNS topics")
	}
}

func TestCloudWatchEventRule(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if rules, ok := resources["aws_cloudwatch_event_rule"]; ok {
		eventRules := rules.(map[string]interface{})

		if len(eventRules) == 0 {
			t.Fatal("expected at least one CloudWatch Event Rule")
		}

		for name, res := range eventRules {
			rule := res.(map[string]interface{})

			// Check event pattern exists
			if pattern, ok := rule["event_pattern"].(string); !ok || pattern == "" {
				t.Errorf("CloudWatch Event Rule %s: missing event pattern", name)
			}

			// Check description exists
			if desc, ok := rule["description"]; !ok || desc == "" {
				t.Errorf("CloudWatch Event Rule %s: missing description", name)
			}
		}
	} else {
		t.Error("expected CloudWatch Event Rules")
	}
}

func TestCloudTrail(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if trails, ok := resources["aws_cloudtrail"]; ok {
		cloudtrails := trails.(map[string]interface{})

		if len(cloudtrails) == 0 {
			t.Fatal("expected at least one CloudTrail")
		}

		for name, res := range cloudtrails {
			trail := res.(map[string]interface{})

			// Check multi-region trail
			if isMulti, ok := trail["is_multi_region_trail"]; !ok || !isMulti.(bool) {
				t.Errorf("CloudTrail %s: should be multi-region", name)
			}

			// Check log file validation
			if validation, ok := trail["enable_log_file_validation"]; !ok || !validation.(bool) {
				t.Errorf("CloudTrail %s: should have log file validation enabled", name)
			}

			// Check KMS encryption
			if kmsKeyId, ok := trail["kms_key_id"]; !ok || kmsKeyId == "" {
				t.Errorf("CloudTrail %s: missing KMS encryption", name)
			}
		}
	} else {
		t.Error("expected CloudTrail resources")
	}
}

func TestTerraformOutputs(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	outputs := tfConfig["output"].(map[string]interface{})

	expectedOutputs := []string{
		"pipeline-name",
		"source-bucket-name",
		"sns-topic-arn",
		"kms-key-arn",
	}

	for _, expected := range expectedOutputs {
		if _, ok := outputs[expected]; !ok {
			t.Errorf("missing expected output: %s", expected)
		}
	}
}

func TestTagging(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check that resources have proper tags
	resourceTypes := []string{"aws_s3_bucket", "aws_kms_key", "aws_iam_role", "aws_codebuild_project", "aws_codepipeline", "aws_sns_topic"}

	for _, resourceType := range resourceTypes {
		if resGroup, ok := resources[resourceType]; ok {
			group := resGroup.(map[string]interface{})

			for name, res := range group {
				resource := res.(map[string]interface{})

				if tags, ok := resource["tags"].(map[string]interface{}); ok {
					// Check for Name tag
					if nameTag, ok := tags["Name"]; !ok || nameTag == "" {
						t.Errorf("%s %s: missing Name tag", resourceType, name)
					}
				} else if resourceType != "aws_iam_role" { // IAM roles might not always have tags
					t.Errorf("%s %s: missing tags", resourceType, name)
				}
			}
		}
	}
}

func TestEnvironmentSuffixUsage(t *testing.T) {
	envSuffix := "testsuffix456"
	_, tfConfig := synthStack(t, envSuffix)

	resources := tfConfig["resource"].(map[string]interface{})

	// Check S3 buckets include environment suffix
	if buckets, ok := resources["aws_s3_bucket"]; ok {
		s3Buckets := buckets.(map[string]interface{})

		for name, res := range s3Buckets {
			bucket := res.(map[string]interface{})

			if bucketName, ok := bucket["bucket"].(string); ok {
				if !strings.Contains(bucketName, envSuffix) {
					t.Errorf("S3 bucket %s: name should include environment suffix %s", name, envSuffix)
				}
			}
		}
	}

	// Check KMS alias includes environment suffix
	if aliases, ok := resources["aws_kms_alias"]; ok {
		kmsAliases := aliases.(map[string]interface{})

		for name, res := range kmsAliases {
			alias := res.(map[string]interface{})

			if aliasName, ok := alias["name"].(string); ok {
				if !strings.Contains(aliasName, envSuffix) {
					t.Errorf("KMS alias %s: name should include environment suffix %s", name, envSuffix)
				}
			}
		}
	}
}

func TestProviderConfiguration(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	if provider, ok := tfConfig["provider"].(map[string]interface{}); ok {
		if awsSlice, ok := provider["aws"].([]interface{}); ok && len(awsSlice) > 0 {
			if aws, ok := awsSlice[0].(map[string]interface{}); ok {
				// Check region configuration
				if region, ok := aws["region"]; !ok || region == "" {
					t.Error("AWS provider missing region configuration")
				}

				// Check default tags
				if defaultTags, ok := aws["default_tags"].([]interface{}); ok && len(defaultTags) > 0 {
					tags := defaultTags[0].(map[string]interface{})["tags"].(map[string]interface{})

					expectedTags := []string{"Environment", "Project", "ManagedBy", "EnvironmentSuffix"}
					for _, tag := range expectedTags {
						if _, ok := tags[tag]; !ok {
							t.Errorf("AWS provider missing default tag: %s", tag)
						}
					}
				} else {
					t.Error("AWS provider missing default tags configuration")
				}
			} else {
				t.Error("AWS provider config not a map")
			}
		} else {
			t.Error("missing AWS provider configuration")
		}
	} else {
		t.Error("missing provider configuration")
	}
}

func getKeys(m map[string]interface{}) []string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

// Test 16: Validate CloudWatch Dashboard Configuration
func TestCloudWatchDashboard(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if dashboards, ok := resources["aws_cloudwatch_dashboard"]; ok {
		dashboardResources := dashboards.(map[string]interface{})

		if len(dashboardResources) == 0 {
			t.Fatal("expected at least one CloudWatch dashboard")
		}

		for name, res := range dashboardResources {
			dashboard := res.(map[string]interface{})

			// Check dashboard name
			if dashName, ok := dashboard["dashboard_name"].(string); !ok || !strings.Contains(dashName, "Corp-Nova-Pipeline-Dashboard") {
				t.Errorf("Dashboard %s: name should follow naming convention", name)
			}

			// Check dashboard body exists and is valid JSON
			if dashBody, ok := dashboard["dashboard_body"].(string); ok && dashBody != "" {
				var dashJSON map[string]interface{}
				if err := json.Unmarshal([]byte(dashBody), &dashJSON); err != nil {
					t.Errorf("Dashboard %s: dashboard body should be valid JSON", name)
				} else {
					// Check for widgets
					if widgets, ok := dashJSON["widgets"].([]interface{}); ok {
						if len(widgets) < 3 {
							t.Errorf("Dashboard %s: should have at least 3 widgets", name)
						}
					}
				}
			} else {
				t.Errorf("Dashboard %s: missing dashboard body", name)
			}
		}
	} else {
		t.Error("expected CloudWatch dashboard resources")
	}
}

// Test 17: Validate CloudWatch Alarms Configuration
func TestCloudWatchAlarms(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if alarms, ok := resources["aws_cloudwatch_metric_alarm"]; ok {
		alarmResources := alarms.(map[string]interface{})

		if len(alarmResources) < 2 {
			t.Fatal("expected at least 2 CloudWatch alarms (pipeline and build failure)")
		}

		for name, res := range alarmResources {
			alarm := res.(map[string]interface{})

			// Check alarm has proper configuration
			requiredFields := []string{"alarm_name", "comparison_operator", "evaluation_periods", "metric_name", "namespace", "threshold"}
			for _, field := range requiredFields {
				if _, ok := alarm[field]; !ok {
					t.Errorf("CloudWatch alarm %s: missing required field %s", name, field)
				}
			}

			// Check alarm actions (should notify SNS)
			if alarmActions, ok := alarm["alarm_actions"].([]interface{}); ok {
				if len(alarmActions) == 0 {
					t.Errorf("CloudWatch alarm %s: should have alarm actions configured", name)
				}
			}
		}
	} else {
		t.Error("expected CloudWatch alarm resources")
	}
}

// Test 18: Validate S3 Bucket Versioning
func TestS3BucketVersioning(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if versioning, ok := resources["aws_s3_bucket_versioning"]; ok {
		versioningConfigs := versioning.(map[string]interface{})

		if len(versioningConfigs) < 2 {
			t.Error("expected versioning configuration for multiple buckets")
		}

		for name, res := range versioningConfigs {
			versionConfig := res.(map[string]interface{})

			// Check versioning configuration
			if versioningConfig, ok := versionConfig["versioning_configuration"].(map[string]interface{}); ok {
				if status := versioningConfig["status"]; status != "Enabled" {
					t.Errorf("S3 bucket versioning %s: status should be Enabled", name)
				}
			} else {
				t.Errorf("S3 bucket versioning %s: missing versioning configuration", name)
			}
		}
	} else {
		t.Error("expected S3 bucket versioning configurations")
	}
}

// Test 19: Validate S3 Bucket Policy for CloudTrail
func TestS3BucketPolicyCloudTrail(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if policies, ok := resources["aws_s3_bucket_policy"]; ok {
		bucketPolicies := policies.(map[string]interface{})

		for name, res := range bucketPolicies {
			policy := res.(map[string]interface{})

			if policyDoc, ok := policy["policy"].(string); ok {
				var policyJSON map[string]interface{}
				if err := json.Unmarshal([]byte(policyDoc), &policyJSON); err != nil {
					t.Errorf("S3 bucket policy %s: should be valid JSON", name)
				} else {
					// Check for CloudTrail-specific statements
					if statements, ok := policyJSON["Statement"].([]interface{}); ok {
						foundCloudTrail := false
						for _, stmt := range statements {
							statement := stmt.(map[string]interface{})
							if principal, ok := statement["Principal"].(map[string]interface{}); ok {
								if service, ok := principal["Service"]; ok && service == "cloudtrail.amazonaws.com" {
									foundCloudTrail = true
									break
								}
							}
						}
						if !foundCloudTrail {
							t.Errorf("S3 bucket policy %s: should contain CloudTrail permissions", name)
						}
					}
				}
			}
		}
	}
}

// Test 20: Validate KMS Key Policy Structure
func TestKMSKeyPolicyStructure(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})
	kmsKeys := resources["aws_kms_key"].(map[string]interface{})

	for name, res := range kmsKeys {
		key := res.(map[string]interface{})

		if policyStr, ok := key["policy"].(string); ok {
			var policy map[string]interface{}
			if err := json.Unmarshal([]byte(policyStr), &policy); err != nil {
				t.Errorf("KMS key %s: policy should be valid JSON", name)
				continue
			}

			// Check policy version
			if version := policy["Version"]; version != "2012-10-17" {
				t.Errorf("KMS key %s: policy should use version 2012-10-17", name)
			}

			// Check for required statements
			if statements, ok := policy["Statement"].([]interface{}); ok {
				foundRoot := false
				foundCodePipeline := false
				foundCloudTrail := false

				for _, stmt := range statements {
					statement := stmt.(map[string]interface{})
					if sid, ok := statement["Sid"]; ok {
						switch sid {
						case "Enable IAM User Permissions":
							foundRoot = true
						case "Allow CodePipeline Service":
							foundCodePipeline = true
						case "Allow CloudTrail Service":
							foundCloudTrail = true
						}
					}
				}

				if !foundRoot || !foundCodePipeline || !foundCloudTrail {
					t.Errorf("KMS key %s: policy missing required statements", name)
				}
			}
		}
	}
}

// Test 21: Validate KMS Alias Configuration
func TestKMSAlias(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if aliases, ok := resources["aws_kms_alias"]; ok {
		aliasResources := aliases.(map[string]interface{})

		if len(aliasResources) == 0 {
			t.Fatal("expected at least one KMS alias")
		}

		for name, res := range aliasResources {
			alias := res.(map[string]interface{})

			// Check alias name format
			if aliasName, ok := alias["name"].(string); ok {
				if !strings.HasPrefix(aliasName, "alias/") {
					t.Errorf("KMS alias %s: name should start with 'alias/'", name)
				}
				if !strings.Contains(aliasName, "corp-nova-pipeline") {
					t.Errorf("KMS alias %s: should follow naming convention", name)
				}
			}

			// Check target key ID is set
			if _, ok := alias["target_key_id"]; !ok {
				t.Errorf("KMS alias %s: missing target_key_id", name)
			}
		}
	} else {
		t.Error("expected KMS alias resources")
	}
}

// Test 22: Validate IAM Role Trust Policies
func TestIAMRoleTrustPolicies(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})
	roles := resources["aws_iam_role"].(map[string]interface{})

	expectedTrustedServices := map[string]string{
		"pipeline-role":    "codepipeline.amazonaws.com",
		"build-role":       "codebuild.amazonaws.com",
		"staging-cfn-role": "cloudformation.amazonaws.com",
		"prod-cfn-role":    "cloudformation.amazonaws.com",
	}

	for roleName, res := range roles {
		role := res.(map[string]interface{})

		if trustPolicy, ok := role["assume_role_policy"].(string); ok {
			var policy map[string]interface{}
			if err := json.Unmarshal([]byte(trustPolicy), &policy); err != nil {
				t.Errorf("IAM role %s: assume role policy should be valid JSON", roleName)
				continue
			}

			// Find expected service for this role
			var expectedService string
			for roleType, service := range expectedTrustedServices {
				if strings.Contains(roleName, roleType) {
					expectedService = service
					break
				}
			}

			if expectedService != "" {
				// Check statements for trusted service
				if statements, ok := policy["Statement"].([]interface{}); ok {
					foundService := false
					for _, stmt := range statements {
						statement := stmt.(map[string]interface{})
						if principal, ok := statement["Principal"].(map[string]interface{}); ok {
							if service, ok := principal["Service"]; ok && service == expectedService {
								foundService = true
								break
							}
						}
					}
					if !foundService {
						t.Errorf("IAM role %s: should trust service %s", roleName, expectedService)
					}
				}
			}
		}
	}
}

// Test 23: Validate IAM Role Inline Policies
func TestIAMRoleInlinePolicies(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})
	roles := resources["aws_iam_role"].(map[string]interface{})

	for roleName, res := range roles {
		role := res.(map[string]interface{})

		if inlinePolicies, ok := role["inline_policy"].([]interface{}); ok && len(inlinePolicies) > 0 {
			for _, policyInterface := range inlinePolicies {
				inlinePolicy := policyInterface.(map[string]interface{})

				// Check policy name
				if policyName, ok := inlinePolicy["name"]; !ok || policyName == "" {
					t.Errorf("IAM role %s: inline policy missing name", roleName)
				}

				// Check policy document
				if policyDoc, ok := inlinePolicy["policy"].(string); ok {
					var policy map[string]interface{}
					if err := json.Unmarshal([]byte(policyDoc), &policy); err != nil {
						t.Errorf("IAM role %s: inline policy should be valid JSON", roleName)
					} else {
						// Check for statements
						if statements, ok := policy["Statement"].([]interface{}); ok {
							if len(statements) == 0 {
								t.Errorf("IAM role %s: inline policy should have statements", roleName)
							}
						}
					}
				}
			}
		} else if strings.Contains(roleName, "role") {
			t.Errorf("IAM role %s: should have inline policies", roleName)
		}
	}
}

// Test 24: Validate CodeBuild Environment Variables
func TestCodeBuildEnvironmentVariables(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if pipelines, ok := resources["aws_codepipeline"]; ok {
		pipelineResources := pipelines.(map[string]interface{})

		for pipelineName, res := range pipelineResources {
			pipeline := res.(map[string]interface{})

			if stages, ok := pipeline["stage"].([]interface{}); ok {
				for _, stageInterface := range stages {
					stage := stageInterface.(map[string]interface{})
					if stageName := stage["name"]; stageName == "Build" {
						if actions, ok := stage["action"].([]interface{}); ok {
							for _, actionInterface := range actions {
								action := actionInterface.(map[string]interface{})
								if config, ok := action["configuration"].(map[string]interface{}); ok {
									if envVars, ok := config["EnvironmentVariables"].(string); ok {
										// Validate environment variables JSON
										var envVarsList []map[string]interface{}
										if err := json.Unmarshal([]byte(envVars), &envVarsList); err != nil {
											t.Errorf("Pipeline %s: EnvironmentVariables should be valid JSON", pipelineName)
										} else {
											// Check for required environment variables
											requiredVars := []string{"RETRY_COUNT", "TIMEOUT_IN_MINUTES"}
											for _, requiredVar := range requiredVars {
												found := false
												for _, envVar := range envVarsList {
													if envVar["name"] == requiredVar {
														found = true
														break
													}
												}
												if !found {
													t.Errorf("Pipeline %s: missing required environment variable %s", pipelineName, requiredVar)
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

// Test 25: Validate CodeBuild Buildspec Content
func TestCodeBuildBuildspecContent(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if projects, ok := resources["aws_codebuild_project"]; ok {
		buildProjects := projects.(map[string]interface{})

		for name, res := range buildProjects {
			project := res.(map[string]interface{})

			if source, ok := project["source"].(map[string]interface{}); ok {
				if buildspec, ok := source["buildspec"].(string); ok {
					// Check for required phases
					requiredPhases := []string{"install:", "pre_build:", "build:", "post_build:"}
					for _, phase := range requiredPhases {
						if !strings.Contains(buildspec, phase) {
							t.Errorf("CodeBuild project %s: buildspec missing phase %s", name, strings.TrimSuffix(phase, ":"))
						}
					}

					// Check for required commands
					requiredCommands := []string{"npm ci", "npm run test:unit", "npm run test:integration", "docker build"}
					for _, cmd := range requiredCommands {
						if !strings.Contains(buildspec, cmd) {
							t.Errorf("CodeBuild project %s: buildspec missing command %s", name, cmd)
						}
					}

					// Check for cache configuration
					if !strings.Contains(buildspec, "cache:") {
						t.Errorf("CodeBuild project %s: buildspec should have cache configuration", name)
					}

					// Check for artifacts section
					if !strings.Contains(buildspec, "artifacts:") {
						t.Errorf("CodeBuild project %s: buildspec should have artifacts section", name)
					}
				}
			}
		}
	}
}

// Test 26: Validate CodePipeline Stage Actions
func TestCodePipelineStageActions(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if pipelines, ok := resources["aws_codepipeline"]; ok {
		pipelineResources := pipelines.(map[string]interface{})

		for name, res := range pipelineResources {
			pipeline := res.(map[string]interface{})

			if stages, ok := pipeline["stage"].([]interface{}); ok {
				for _, stageInterface := range stages {
					stage := stageInterface.(map[string]interface{})
					stageName := stage["name"].(string)

					if actions, ok := stage["action"].([]interface{}); ok {
						if len(actions) == 0 {
							t.Errorf("Pipeline %s stage %s: should have at least one action", name, stageName)
							continue
						}

						for _, actionInterface := range actions {
							action := actionInterface.(map[string]interface{})

							// Check required action fields
							requiredFields := []string{"name", "category", "owner", "provider", "version"}
							for _, field := range requiredFields {
								if _, ok := action[field]; !ok {
									t.Errorf("Pipeline %s stage %s: action missing field %s", name, stageName, field)
								}
							}

							// Validate specific stage configurations
							category := action["category"].(string)
							switch stageName {
							case "Source":
								if category != "Source" {
									t.Errorf("Pipeline %s: Source stage should have Source category", name)
								}
							case "Build":
								if category != "Build" {
									t.Errorf("Pipeline %s: Build stage should have Build category", name)
								}
							case "ApprovalForProduction":
								if category != "Approval" {
									t.Errorf("Pipeline %s: Approval stage should have Approval category", name)
								}
							}
						}
					}
				}
			}
		}
	}
}

// Test 27: Validate CloudWatch Event Target Configuration
func TestCloudWatchEventTargets(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if targets, ok := resources["aws_cloudwatch_event_target"]; ok {
		eventTargets := targets.(map[string]interface{})

		if len(eventTargets) == 0 {
			t.Fatal("expected at least one CloudWatch event target")
		}

		for name, res := range eventTargets {
			target := res.(map[string]interface{})

			// Check required fields
			requiredFields := []string{"rule", "target_id", "arn"}
			for _, field := range requiredFields {
				if _, ok := target[field]; !ok {
					t.Errorf("CloudWatch event target %s: missing field %s", name, field)
				}
			}

			// Check for input transformer
			if transformer, ok := target["input_transformer"].(map[string]interface{}); ok {
				// Check input paths
				if inputPaths, ok := transformer["input_paths"].(map[string]interface{}); ok {
					expectedPaths := []string{"pipeline", "state", "time"}
					for _, expectedPath := range expectedPaths {
						if _, exists := inputPaths[expectedPath]; !exists {
							t.Errorf("CloudWatch event target %s: missing input path %s", name, expectedPath)
						}
					}
				}

				// Check input template
				if inputTemplate, ok := transformer["input_template"].(string); !ok || inputTemplate == "" {
					t.Errorf("CloudWatch event target %s: missing input template", name)
				}
			}
		}
	} else {
		t.Error("expected CloudWatch event target resources")
	}
}

// Test 28: Validate CloudFormation Deployment Configuration
func TestCloudFormationDeploymentConfig(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if pipelines, ok := resources["aws_codepipeline"]; ok {
		pipelineResources := pipelines.(map[string]interface{})

		for name, res := range pipelineResources {
			pipeline := res.(map[string]interface{})

			if stages, ok := pipeline["stage"].([]interface{}); ok {
				for _, stageInterface := range stages {
					stage := stageInterface.(map[string]interface{})
					stageName := stage["name"].(string)

					if strings.HasPrefix(stageName, "Deploy") {
						if actions, ok := stage["action"].([]interface{}); ok {
							for _, actionInterface := range actions {
								action := actionInterface.(map[string]interface{})

								if provider := action["provider"]; provider == "CloudFormation" {
									if config, ok := action["configuration"].(map[string]interface{}); ok {
										// Check required CloudFormation configuration
										requiredConfigs := []string{"ActionMode", "Capabilities", "StackName"}
										for _, configKey := range requiredConfigs {
											if _, exists := config[configKey]; !exists {
												t.Errorf("Pipeline %s CloudFormation action: missing configuration %s", name, configKey)
											}
										}

										// Check capabilities include required permissions
										if capabilities, ok := config["Capabilities"].(string); ok {
											if !strings.Contains(capabilities, "CAPABILITY_IAM") {
												t.Errorf("Pipeline %s: CloudFormation should have CAPABILITY_IAM", name)
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

// Test 29: Validate Backend Configuration
func TestBackendConfiguration(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	// Check for S3 backend configuration
	if terraform, ok := tfConfig["terraform"].(map[string]interface{}); ok {
		if backend, ok := terraform["backend"].(map[string]interface{}); ok {
			if s3Backend, ok := backend["s3"].(map[string]interface{}); ok {
				// Check required S3 backend fields
				requiredFields := []string{"bucket", "key", "region", "encrypt"}
				for _, field := range requiredFields {
					if _, exists := s3Backend[field]; !exists {
						t.Errorf("S3 backend: missing required field %s", field)
					}
				}

				// Check encryption is enabled
				if encrypt, ok := s3Backend["encrypt"]; !ok || !encrypt.(bool) {
					t.Error("S3 backend: encryption should be enabled")
				}

				// Check key includes environment suffix
				if key, ok := s3Backend["key"].(string); ok {
					if !strings.Contains(key, "test123") {
						t.Error("S3 backend key should include environment suffix")
					}
				}
			} else {
				t.Error("expected S3 backend configuration")
			}
		} else {
			t.Error("expected backend configuration")
		}
	} else {
		t.Error("expected terraform configuration")
	}
}

// Test 30: Validate Resource Naming Consistency
func TestResourceNamingConsistency(t *testing.T) {
	envSuffix := "testenv789"
	_, tfConfig := synthStack(t, envSuffix)

	resources := tfConfig["resource"].(map[string]interface{})

	namingPatterns := map[string]string{
		"aws_s3_bucket":             envSuffix,
		"aws_kms_alias":             envSuffix,
		"aws_iam_role":              envSuffix,
		"aws_codebuild_project":     envSuffix,
		"aws_codepipeline":          envSuffix,
		"aws_sns_topic":             envSuffix,
		"aws_cloudtrail":            envSuffix,
		"aws_cloudwatch_event_rule": envSuffix,
	}

	for resourceType, expectedPattern := range namingPatterns {
		if resourceGroup, ok := resources[resourceType]; ok {
			group := resourceGroup.(map[string]interface{})

			for name, res := range group {
				resource := res.(map[string]interface{})
				found := false

				// Check different name fields depending on resource type
				nameFields := []string{"name", "bucket", "alarm_name", "dashboard_name"}
				for _, nameField := range nameFields {
					if nameValue, ok := resource[nameField].(string); ok {
						if strings.Contains(nameValue, expectedPattern) {
							found = true
							break
						}
					}
				}

				if !found {
					t.Errorf("%s %s: should include environment suffix %s in name", resourceType, name, expectedPattern)
				}
			}
		}
	}
}

// Test 31: Validate Log Configuration
func TestLogConfiguration(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	if projects, ok := resources["aws_codebuild_project"]; ok {
		buildProjects := projects.(map[string]interface{})

		for name, res := range buildProjects {
			project := res.(map[string]interface{})

			// Check logs configuration
			if logsConfig, ok := project["logs_config"].(map[string]interface{}); ok {
				if cwLogs, ok := logsConfig["cloudwatch_logs"].(map[string]interface{}); ok {
					// Check CloudWatch logs are enabled
					if status := cwLogs["status"]; status != "ENABLED" {
						t.Errorf("CodeBuild project %s: CloudWatch logs should be enabled", name)
					}

					// Check log group name
					if groupName, ok := cwLogs["group_name"].(string); ok {
						if !strings.Contains(groupName, "/aws/codebuild/") {
							t.Errorf("CodeBuild project %s: log group should use standard prefix", name)
						}
						if !strings.Contains(groupName, "test123") {
							t.Errorf("CodeBuild project %s: log group should include environment suffix", name)
						}
					}
				} else {
					t.Errorf("CodeBuild project %s: should have CloudWatch logs configuration", name)
				}
			} else {
				t.Errorf("CodeBuild project %s: should have logs configuration", name)
			}
		}
	}
}

// Test 32: Validate Security Best Practices
func TestSecurityBestPractices(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check S3 bucket encryption
	if buckets, ok := resources["aws_s3_bucket"]; ok {
		if encConfigs, ok := resources["aws_s3_bucket_server_side_encryption_configuration"]; ok {
			encConfigsMap := encConfigs.(map[string]interface{})
			bucketMap := buckets.(map[string]interface{})

			if len(encConfigsMap) < len(bucketMap) {
				t.Error("all S3 buckets should have encryption configuration")
			}
		} else {
			t.Error("S3 buckets should have encryption configurations")
		}
	}

	// Check SNS topic encryption
	if topics, ok := resources["aws_sns_topic"]; ok {
		snsTopics := topics.(map[string]interface{})

		for name, res := range snsTopics {
			topic := res.(map[string]interface{})

			if _, ok := topic["kms_master_key_id"]; !ok {
				t.Errorf("SNS topic %s: should be encrypted with KMS", name)
			}
		}
	}

	// Check CloudTrail encryption
	if trails, ok := resources["aws_cloudtrail"]; ok {
		cloudtrails := trails.(map[string]interface{})

		for name, res := range cloudtrails {
			trail := res.(map[string]interface{})

			if _, ok := trail["kms_key_id"]; !ok {
				t.Errorf("CloudTrail %s: should be encrypted with KMS", name)
			}
		}
	}
}

// Test 33: Validate High Availability Configuration
func TestHighAvailabilityConfiguration(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check for multi-region CloudTrail
	if trails, ok := resources["aws_cloudtrail"]; ok {
		cloudtrails := trails.(map[string]interface{})

		for name, res := range cloudtrails {
			trail := res.(map[string]interface{})

			if multiRegion, ok := trail["is_multi_region_trail"]; !ok || !multiRegion.(bool) {
				t.Errorf("CloudTrail %s: should be configured for multi-region", name)
			}
		}
	}

	// Check for S3 bucket versioning (backup capability)
	if versioning, ok := resources["aws_s3_bucket_versioning"]; ok {
		versioningConfigs := versioning.(map[string]interface{})

		if len(versioningConfigs) == 0 {
			t.Error("S3 buckets should have versioning enabled for backup")
		}
	}

	// Check for multiple S3 buckets (including replica)
	if buckets, ok := resources["aws_s3_bucket"]; ok {
		bucketMap := buckets.(map[string]interface{})

		if len(bucketMap) < 3 {
			t.Error("should have multiple S3 buckets including replica bucket")
		}

		// Look for replica bucket
		foundReplica := false
		for bucketName := range bucketMap {
			if strings.Contains(bucketName, "replica") {
				foundReplica = true
				break
			}
		}

		if !foundReplica {
			t.Error("should have replica bucket for high availability")
		}
	}
}

// Test 34: Validate Cost Optimization Features
func TestCostOptimizationFeatures(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check S3 bucket key enabled for cost optimization
	if encConfigs, ok := resources["aws_s3_bucket_server_side_encryption_configuration"]; ok {
		encConfigsMap := encConfigs.(map[string]interface{})

		for name, res := range encConfigsMap {
			encConfig := res.(map[string]interface{})

			if rules, ok := encConfig["rule"].([]interface{}); ok && len(rules) > 0 {
				rule := rules[0].(map[string]interface{})
				if defaultConfig, ok := rule["apply_server_side_encryption_by_default"].(map[string]interface{}); ok {
					if bucketKeyEnabled, ok := rule["bucket_key_enabled"]; !ok || !bucketKeyEnabled.(bool) {
						t.Errorf("S3 encryption config %s: bucket key should be enabled for cost optimization", name)
					}
					_ = defaultConfig // Suppress unused variable warning
				}
			}
		}
	}

	// Check CodeBuild compute type is appropriate
	if projects, ok := resources["aws_codebuild_project"]; ok {
		buildProjects := projects.(map[string]interface{})

		for name, res := range buildProjects {
			project := res.(map[string]interface{})

			if env, ok := project["environment"].(map[string]interface{}); ok {
				if computeType := env["compute_type"]; computeType != "BUILD_GENERAL1_MEDIUM" {
					t.Errorf("CodeBuild project %s: using compute type %v (consider cost implications)", name, computeType)
				}
			}
		}
	}
}

// Test 35: Validate Disaster Recovery Capabilities
func TestDisasterRecoveryCapabilities(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check for cross-region replication capability (replica bucket)
	foundArtifactsBucket := false
	foundReplicaBucket := false

	if buckets, ok := resources["aws_s3_bucket"]; ok {
		bucketMap := buckets.(map[string]interface{})

		for bucketName := range bucketMap {
			if strings.Contains(bucketName, "artifacts") {
				foundArtifactsBucket = true
			}
			if strings.Contains(bucketName, "replica") {
				foundReplicaBucket = true
			}
		}
	}

	if !foundArtifactsBucket {
		t.Error("should have artifacts bucket for DR")
	}
	if !foundReplicaBucket {
		t.Error("should have replica bucket for cross-region DR")
	}

	// Check CloudTrail is configured for global service events
	if trails, ok := resources["aws_cloudtrail"]; ok {
		cloudtrails := trails.(map[string]interface{})

		for name, res := range cloudtrails {
			trail := res.(map[string]interface{})

			if globalEvents, ok := trail["include_global_service_events"]; !ok || !globalEvents.(bool) {
				t.Errorf("CloudTrail %s: should include global service events", name)
			}
		}
	}
}

// Test 36: Validate Compliance and Auditing
func TestComplianceAndAuditing(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check CloudTrail log file validation
	if trails, ok := resources["aws_cloudtrail"]; ok {
		cloudtrails := trails.(map[string]interface{})

		for name, res := range cloudtrails {
			trail := res.(map[string]interface{})

			if logValidation, ok := trail["enable_log_file_validation"]; !ok || !logValidation.(bool) {
				t.Errorf("CloudTrail %s: should have log file validation enabled", name)
			}
		}
	}

	// Check CloudTrail event selector configuration
	if trails, ok := resources["aws_cloudtrail"]; ok {
		cloudtrails := trails.(map[string]interface{})

		for name, res := range cloudtrails {
			trail := res.(map[string]interface{})

			if eventSelectors, ok := trail["event_selector"].([]interface{}); ok && len(eventSelectors) > 0 {
				selector := eventSelectors[0].(map[string]interface{})

				if readWriteType := selector["read_write_type"]; readWriteType != "All" {
					t.Errorf("CloudTrail %s: should capture all read/write events", name)
				}

				if managementEvents, ok := selector["include_management_events"]; !ok || !managementEvents.(bool) {
					t.Errorf("CloudTrail %s: should include management events", name)
				}
			}
		}
	}
}

// Test 37: Validate Monitoring Completeness
func TestMonitoringCompleteness(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check for CloudWatch dashboard
	if dashboards, ok := resources["aws_cloudwatch_dashboard"]; ok {
		dashboardResources := dashboards.(map[string]interface{})
		if len(dashboardResources) == 0 {
			t.Error("should have CloudWatch dashboard for monitoring")
		}
	} else {
		t.Error("should have CloudWatch dashboard")
	}

	// Check for CloudWatch alarms
	if alarms, ok := resources["aws_cloudwatch_metric_alarm"]; ok {
		alarmResources := alarms.(map[string]interface{})
		if len(alarmResources) < 2 {
			t.Error("should have multiple CloudWatch alarms for comprehensive monitoring")
		}
	} else {
		t.Error("should have CloudWatch alarms")
	}

	// Check for CloudWatch event rules
	if rules, ok := resources["aws_cloudwatch_event_rule"]; ok {
		ruleResources := rules.(map[string]interface{})
		if len(ruleResources) == 0 {
			t.Error("should have CloudWatch event rules for event-driven monitoring")
		}
	} else {
		t.Error("should have CloudWatch event rules")
	}

	// Check for SNS topic for notifications
	if topics, ok := resources["aws_sns_topic"]; ok {
		topicResources := topics.(map[string]interface{})
		if len(topicResources) == 0 {
			t.Error("should have SNS topic for notifications")
		}
	} else {
		t.Error("should have SNS topic")
	}
}

// Test 38: Validate Performance Optimization
func TestPerformanceOptimization(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check CodeBuild cache configuration in buildspec
	if projects, ok := resources["aws_codebuild_project"]; ok {
		buildProjects := projects.(map[string]interface{})

		for name, res := range buildProjects {
			project := res.(map[string]interface{})

			if source, ok := project["source"].(map[string]interface{}); ok {
				if buildspec, ok := source["buildspec"].(string); ok {
					if !strings.Contains(buildspec, "cache:") {
						t.Errorf("CodeBuild project %s: should have cache configuration for performance", name)
					}
				}
			}
		}
	}

	// Check for appropriate instance sizes
	if projects, ok := resources["aws_codebuild_project"]; ok {
		buildProjects := projects.(map[string]interface{})

		for name, res := range buildProjects {
			project := res.(map[string]interface{})

			if env, ok := project["environment"].(map[string]interface{}); ok {
				computeType := env["compute_type"].(string)
				validComputeTypes := []string{"BUILD_GENERAL1_SMALL", "BUILD_GENERAL1_MEDIUM", "BUILD_GENERAL1_LARGE"}

				found := false
				for _, validType := range validComputeTypes {
					if computeType == validType {
						found = true
						break
					}
				}

				if !found {
					t.Errorf("CodeBuild project %s: using invalid compute type %s", name, computeType)
				}
			}
		}
	}
}

// Test 39: Validate Error Handling and Retry Logic
func TestErrorHandlingAndRetryLogic(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check for retry environment variables in CodeBuild
	if pipelines, ok := resources["aws_codepipeline"]; ok {
		pipelineResources := pipelines.(map[string]interface{})

		for name, res := range pipelineResources {
			pipeline := res.(map[string]interface{})

			if stages, ok := pipeline["stage"].([]interface{}); ok {
				for _, stageInterface := range stages {
					stage := stageInterface.(map[string]interface{})
					if stageName := stage["name"]; stageName == "Build" {
						if actions, ok := stage["action"].([]interface{}); ok {
							for _, actionInterface := range actions {
								action := actionInterface.(map[string]interface{})
								if config, ok := action["configuration"].(map[string]interface{}); ok {
									if envVars, ok := config["EnvironmentVariables"].(string); ok {
										if !strings.Contains(envVars, "RETRY_COUNT") {
											t.Errorf("Pipeline %s: should have RETRY_COUNT configuration", name)
										}
										if !strings.Contains(envVars, "TIMEOUT_IN_MINUTES") {
											t.Errorf("Pipeline %s: should have TIMEOUT_IN_MINUTES configuration", name)
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}

	// Check for CloudWatch alarms for failure detection
	if alarms, ok := resources["aws_cloudwatch_metric_alarm"]; ok {
		alarmResources := alarms.(map[string]interface{})

		foundPipelineAlarm := false
		foundBuildAlarm := false

		for name, res := range alarmResources {
			alarm := res.(map[string]interface{})

			if metricName := alarm["metric_name"]; metricName == "PipelineExecutionFailure" {
				foundPipelineAlarm = true
			} else if metricName == "FailedBuilds" {
				foundBuildAlarm = true
			}

			// Check alarm actions are configured
			if alarmActions, ok := alarm["alarm_actions"].([]interface{}); ok {
				if len(alarmActions) == 0 {
					t.Errorf("CloudWatch alarm %s: should have alarm actions for error handling", name)
				}
			}
		}

		if !foundPipelineAlarm {
			t.Error("should have CloudWatch alarm for pipeline failures")
		}
		if !foundBuildAlarm {
			t.Error("should have CloudWatch alarm for build failures")
		}
	}
}

// Test 40: Validate Data Protection Measures
func TestDataProtectionMeasures(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check S3 bucket force_destroy is disabled
	if buckets, ok := resources["aws_s3_bucket"]; ok {
		bucketMap := buckets.(map[string]interface{})

		for name, res := range bucketMap {
			bucket := res.(map[string]interface{})

			if forceDestroy, ok := bucket["force_destroy"]; ok && forceDestroy.(bool) {
				t.Errorf("S3 bucket %s: force_destroy should be false for data protection", name)
			}
		}
	}

	// Check S3 bucket versioning is enabled
	if versioning, ok := resources["aws_s3_bucket_versioning"]; ok {
		versioningConfigs := versioning.(map[string]interface{})

		for name, res := range versioningConfigs {
			versionConfig := res.(map[string]interface{})

			if versioningConfig, ok := versionConfig["versioning_configuration"].(map[string]interface{}); ok {
				if status := versioningConfig["status"]; status != "Enabled" {
					t.Errorf("S3 bucket versioning %s: should be enabled for data protection", name)
				}
			}
		}
	}

	// Check public access is blocked
	if pabs, ok := resources["aws_s3_bucket_public_access_block"]; ok {
		blocks := pabs.(map[string]interface{})

		for name, res := range blocks {
			pab := res.(map[string]interface{})

			publicAccessBlocks := []string{
				"block_public_acls",
				"block_public_policy",
				"ignore_public_acls",
				"restrict_public_buckets",
			}

			for _, block := range publicAccessBlocks {
				if val, ok := pab[block]; !ok || !val.(bool) {
					t.Errorf("S3 bucket public access block %s: %s should be enabled", name, block)
				}
			}
		}
	}
}

// Test 41: Validate Infrastructure Scaling Readiness
func TestInfrastructureScalingReadiness(t *testing.T) {
	envSuffix1 := "scale1"
	envSuffix2 := "scale2"

	_, tfConfig1 := synthStack(t, envSuffix1)
	_, tfConfig2 := synthStack(t, envSuffix2)

	// Validate that different environment suffixes create isolated resources
	resources1 := tfConfig1["resource"].(map[string]interface{})
	resources2 := tfConfig2["resource"].(map[string]interface{})

	// Check S3 buckets are isolated
	buckets1 := resources1["aws_s3_bucket"].(map[string]interface{})
	buckets2 := resources2["aws_s3_bucket"].(map[string]interface{})

	for name, res := range buckets1 {
		bucket := res.(map[string]interface{})
		if bucketName, ok := bucket["bucket"].(string); ok {
			if !strings.Contains(bucketName, envSuffix1) {
				t.Errorf("Environment %s S3 bucket %s: should contain environment suffix", envSuffix1, name)
			}
		}
	}

	for name, res := range buckets2 {
		bucket := res.(map[string]interface{})
		if bucketName, ok := bucket["bucket"].(string); ok {
			if !strings.Contains(bucketName, envSuffix2) {
				t.Errorf("Environment %s S3 bucket %s: should contain environment suffix", envSuffix2, name)
			}
			// Ensure no cross-contamination
			if strings.Contains(bucketName, envSuffix1) {
				t.Errorf("Environment %s S3 bucket %s: should not contain other environment suffix", envSuffix2, name)
			}
		}
	}

	// Check IAM roles are isolated
	roles1 := resources1["aws_iam_role"].(map[string]interface{})
	roles2 := resources2["aws_iam_role"].(map[string]interface{})

	if len(roles1) != len(roles2) {
		t.Error("different environments should have same number of IAM roles")
	}
}

// Test 42: Validate Network Configuration Readiness
func TestNetworkConfigurationReadiness(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// While this stack doesn't create VPC resources directly,
	// validate that IAM permissions support VPC operations for future CloudFormation deployments
	if roles, ok := resources["aws_iam_role"]; ok {
		roleMap := roles.(map[string]interface{})

		for roleName, res := range roleMap {
			role := res.(map[string]interface{})

			// Check CloudFormation roles have VPC permissions
			if strings.Contains(roleName, "cfn-role") {
				if inlinePolicies, ok := role["inline_policy"].([]interface{}); ok {
					for _, policyInterface := range inlinePolicies {
						inlinePolicy := policyInterface.(map[string]interface{})
						if policyDoc, ok := inlinePolicy["policy"].(string); ok {
							// Check for EC2/VPC permissions
							if !strings.Contains(policyDoc, "ec2:CreateVpc") {
								t.Errorf("CloudFormation role %s: should have VPC creation permissions", roleName)
							}
							if !strings.Contains(policyDoc, "ec2:CreateSubnet") {
								t.Errorf("CloudFormation role %s: should have subnet creation permissions", roleName)
							}
							if !strings.Contains(policyDoc, "ec2:CreateSecurityGroup") {
								t.Errorf("CloudFormation role %s: should have security group permissions", roleName)
							}
						}
					}
				}
			}
		}
	}
}

// Test 43: Validate Container Registry Integration
func TestContainerRegistryIntegration(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check build role has ECR permissions
	if roles, ok := resources["aws_iam_role"]; ok {
		roleMap := roles.(map[string]interface{})

		for roleName, res := range roleMap {
			role := res.(map[string]interface{})

			if strings.Contains(roleName, "build-role") {
				if inlinePolicies, ok := role["inline_policy"].([]interface{}); ok {
					for _, policyInterface := range inlinePolicies {
						inlinePolicy := policyInterface.(map[string]interface{})
						if policyDoc, ok := inlinePolicy["policy"].(string); ok {
							requiredECRActions := []string{
								"ecr:BatchCheckLayerAvailability",
								"ecr:GetDownloadUrlForLayer",
								"ecr:BatchGetImage",
								"ecr:GetAuthorizationToken",
								"ecr:PutImage",
							}

							for _, action := range requiredECRActions {
								if !strings.Contains(policyDoc, action) {
									t.Errorf("Build role %s: missing ECR permission %s", roleName, action)
								}
							}
						}
					}
				}
			}
		}
	}

	// Check buildspec contains ECR login
	if projects, ok := resources["aws_codebuild_project"]; ok {
		buildProjects := projects.(map[string]interface{})

		for name, res := range buildProjects {
			project := res.(map[string]interface{})

			if source, ok := project["source"].(map[string]interface{}); ok {
				if buildspec, ok := source["buildspec"].(string); ok {
					if !strings.Contains(buildspec, "ecr get-login-password") {
						t.Errorf("CodeBuild project %s: buildspec should contain ECR login", name)
					}
					if !strings.Contains(buildspec, "docker push") {
						t.Errorf("CodeBuild project %s: buildspec should contain docker push commands", name)
					}
				}
			}
		}
	}
}

// Test 44: Validate Multi-Environment Support
func TestMultiEnvironmentSupport(t *testing.T) {
	environments := []string{"dev", "staging", "prod", "test"}

	for _, env := range environments {
		t.Run(env, func(t *testing.T) {
			_, tfConfig := synthStack(t, env)

			resources := tfConfig["resource"].(map[string]interface{})

			// Check that all resource types exist for each environment
			expectedResourceTypes := []string{
				"aws_s3_bucket",
				"aws_kms_key",
				"aws_kms_alias",
				"aws_iam_role",
				"aws_codebuild_project",
				"aws_codepipeline",
				"aws_sns_topic",
				"aws_cloudtrail",
			}

			for _, resourceType := range expectedResourceTypes {
				if _, ok := resources[resourceType]; !ok {
					t.Errorf("Environment %s: missing resource type %s", env, resourceType)
				}
			}

			// Check environment-specific naming
			if buckets, ok := resources["aws_s3_bucket"]; ok {
				bucketMap := buckets.(map[string]interface{})
				for _, res := range bucketMap {
					bucket := res.(map[string]interface{})
					if bucketName, ok := bucket["bucket"].(string); ok {
						if !strings.Contains(bucketName, env) {
							t.Errorf("Environment %s: bucket name should contain environment", env)
						}
					}
				}
			}
		})
	}
}

// Test 45: Validate Secrets Management Readiness
func TestSecretsManagementReadiness(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check that KMS key exists for encryption
	if kmsKeys, ok := resources["aws_kms_key"]; ok {
		keyMap := kmsKeys.(map[string]interface{})
		if len(keyMap) == 0 {
			t.Error("should have KMS key for secrets encryption")
		}

		for name, res := range keyMap {
			key := res.(map[string]interface{})

			// Check key policy allows secrets manager
			if policy, ok := key["policy"].(string); ok {
				// While not explicitly configured for Secrets Manager,
				// the key should have proper structure for extensibility
				var policyDoc map[string]interface{}
				if err := json.Unmarshal([]byte(policy), &policyDoc); err != nil {
					t.Errorf("KMS key %s: policy should be valid JSON for secrets management readiness", name)
				}
			}
		}
	} else {
		t.Error("should have KMS key for encryption capabilities")
	}

	// Check IAM roles have proper structure for secrets access
	if roles, ok := resources["aws_iam_role"]; ok {
		roleMap := roles.(map[string]interface{})

		for roleName, res := range roleMap {
			role := res.(map[string]interface{})

			// Check role has inline policies (extensible for secrets permissions)
			if inlinePolicies, ok := role["inline_policy"].([]interface{}); ok {
				if len(inlinePolicies) == 0 {
					t.Errorf("IAM role %s: should have inline policies for extensibility", roleName)
				}
			}
		}
	}
}

// Test 46: Validate API Gateway Integration Preparation
func TestAPIGatewayIntegrationPreparation(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check CloudFormation roles have permissions for API Gateway deployment
	if roles, ok := resources["aws_iam_role"]; ok {
		roleMap := roles.(map[string]interface{})

		for roleName, res := range roleMap {
			role := res.(map[string]interface{})

			if strings.Contains(roleName, "cfn-role") {
				if inlinePolicies, ok := role["inline_policy"].([]interface{}); ok {
					for _, policyInterface := range inlinePolicies {
						inlinePolicy := policyInterface.(map[string]interface{})
						if policyDoc, ok := inlinePolicy["policy"].(string); ok {
							// Check for Lambda permissions (commonly used with API Gateway)
							if !strings.Contains(policyDoc, "logs:CreateLogGroup") {
								t.Errorf("CloudFormation role %s: should have log management permissions for API Gateway integration", roleName)
							}
						}
					}
				}
			}
		}
	}

	// Check that deployment pipeline supports template-based deployment
	if pipelines, ok := resources["aws_codepipeline"]; ok {
		pipelineMap := pipelines.(map[string]interface{})

		for name, res := range pipelineMap {
			pipeline := res.(map[string]interface{})

			if stages, ok := pipeline["stage"].([]interface{}); ok {
				foundCloudFormation := false
				for _, stageInterface := range stages {
					stage := stageInterface.(map[string]interface{})
					if actions, ok := stage["action"].([]interface{}); ok {
						for _, actionInterface := range actions {
							action := actionInterface.(map[string]interface{})
							if provider := action["provider"]; provider == "CloudFormation" {
								foundCloudFormation = true
								break
							}
						}
					}
				}

				if !foundCloudFormation {
					t.Errorf("Pipeline %s: should support CloudFormation deployment for API Gateway", name)
				}
			}
		}
	}
}

// Test 47: Validate Database Integration Readiness
func TestDatabaseIntegrationReadiness(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check CloudFormation roles for database permissions
	if roles, ok := resources["aws_iam_role"]; ok {
		roleMap := roles.(map[string]interface{})

		stagingPermissions := false
		productionPermissions := false

		for roleName, res := range roleMap {
			role := res.(map[string]interface{})

			if strings.Contains(roleName, "staging-cfn-role") || strings.Contains(roleName, "prod-cfn-role") {
				if inlinePolicies, ok := role["inline_policy"].([]interface{}); ok {
					for _, policyInterface := range inlinePolicies {
						inlinePolicy := policyInterface.(map[string]interface{})
						if policyDoc, ok := inlinePolicy["policy"].(string); ok {
							// Check for IAM permissions (needed for database role creation)
							if strings.Contains(policyDoc, "iam:CreateRole") {
								if strings.Contains(roleName, "staging") {
									stagingPermissions = true
								} else if strings.Contains(roleName, "prod") {
									productionPermissions = true
								}
							}
						}
					}
				}
			}
		}

		if !stagingPermissions {
			t.Error("should have CloudFormation role with IAM permissions for staging database integration")
		}
		if !productionPermissions {
			t.Error("should have CloudFormation role with IAM permissions for production database integration")
		}
	}

	// Check KMS key can be used for database encryption
	if kmsKeys, ok := resources["aws_kms_key"]; ok {
		keyMap := kmsKeys.(map[string]interface{})

		for name, res := range keyMap {
			key := res.(map[string]interface{})

			if policy, ok := key["policy"].(string); ok {
				// Check policy allows root account (necessary for database encryption)
				if !strings.Contains(policy, ":root") {
					t.Errorf("KMS key %s: should allow root account for database encryption capability", name)
				}
			}
		}
	}
}

// Test 48: Validate Compliance Framework Support
func TestComplianceFrameworkSupport(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check encryption at rest (SOC 2, PCI DSS requirement)
	encryptionCompliance := true

	// S3 encryption
	if buckets, ok := resources["aws_s3_bucket"]; ok {
		if encConfigs, ok := resources["aws_s3_bucket_server_side_encryption_configuration"]; ok {
			bucketCount := len(buckets.(map[string]interface{}))
			encConfigCount := len(encConfigs.(map[string]interface{}))
			if encConfigCount < bucketCount {
				encryptionCompliance = false
				t.Error("all S3 buckets should be encrypted for compliance")
			}
		} else {
			encryptionCompliance = false
			t.Error("S3 buckets should have encryption configuration for compliance")
		}
	}

	// SNS encryption
	if topics, ok := resources["aws_sns_topic"]; ok {
		topicMap := topics.(map[string]interface{})
		for name, res := range topicMap {
			topic := res.(map[string]interface{})
			if _, ok := topic["kms_master_key_id"]; !ok {
				encryptionCompliance = false
				t.Errorf("SNS topic %s: should be encrypted for compliance", name)
			}
		}
	}

	// CloudTrail encryption
	if trails, ok := resources["aws_cloudtrail"]; ok {
		trailMap := trails.(map[string]interface{})
		for name, res := range trailMap {
			trail := res.(map[string]interface{})
			if _, ok := trail["kms_key_id"]; !ok {
				encryptionCompliance = false
				t.Errorf("CloudTrail %s: should be encrypted for compliance", name)
			}
		}
	}

	if encryptionCompliance {
		t.Log("✓ Encryption at rest compliance: PASSED")
	}

	// Check access logging (SOC 2 requirement)
	if trails, ok := resources["aws_cloudtrail"]; ok {
		trailMap := trails.(map[string]interface{})
		if len(trailMap) == 0 {
			t.Error("should have CloudTrail for access logging compliance")
		}
	} else {
		t.Error("should have CloudTrail for compliance")
	}

	// Check data retention capabilities (various compliance frameworks)
	if versioning, ok := resources["aws_s3_bucket_versioning"]; ok {
		versioningMap := versioning.(map[string]interface{})
		if len(versioningMap) == 0 {
			t.Error("should have S3 versioning for data retention compliance")
		}
	}
}

// Test 49: Validate DevOps Best Practices Implementation
func TestDevOpsBestPracticesImplementation(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Check Infrastructure as Code
	if terraform, ok := tfConfig["terraform"]; ok {
		if backend, ok := terraform.(map[string]interface{})["backend"]; ok {
			if s3Backend, ok := backend.(map[string]interface{})["s3"]; ok {
				if bucket, ok := s3Backend.(map[string]interface{})["bucket"]; !ok || bucket == "" {
					t.Error("should use remote state backend for IaC best practices")
				}
			}
		}
	}

	// Check CI/CD pipeline implementation
	if pipelines, ok := resources["aws_codepipeline"]; ok {
		pipelineMap := pipelines.(map[string]interface{})
		if len(pipelineMap) == 0 {
			t.Error("should implement CI/CD pipeline")
		}

		for name, res := range pipelineMap {
			pipeline := res.(map[string]interface{})

			if stages, ok := pipeline["stage"].([]interface{}); ok {
				stageNames := make([]string, len(stages))
				for i, stageInterface := range stages {
					stage := stageInterface.(map[string]interface{})
					stageNames[i] = stage["name"].(string)
				}

				// Check for proper CI/CD flow
				expectedFlow := []string{"Source", "Build", "DeployStaging", "ApprovalForProduction", "DeployProduction"}
				for i, expectedStage := range expectedFlow {
					if i < len(stageNames) && stageNames[i] != expectedStage {
						t.Errorf("Pipeline %s: stage %d should be %s, got %s", name, i, expectedStage, stageNames[i])
					}
				}
			}
		}
	}

	// Check automated testing in pipeline
	if projects, ok := resources["aws_codebuild_project"]; ok {
		projectMap := projects.(map[string]interface{})

		for name, res := range projectMap {
			project := res.(map[string]interface{})

			if source, ok := project["source"].(map[string]interface{}); ok {
				if buildspec, ok := source["buildspec"].(string); ok {
					if !strings.Contains(buildspec, "test:unit") || !strings.Contains(buildspec, "test:integration") {
						t.Errorf("CodeBuild project %s: should include automated testing", name)
					}
				}
			}
		}
	}

	// Check monitoring and alerting
	if alarms, ok := resources["aws_cloudwatch_metric_alarm"]; ok {
		alarmMap := alarms.(map[string]interface{})
		if len(alarmMap) < 2 {
			t.Error("should have comprehensive monitoring and alerting")
		}
	}

	// Check security scanning readiness (privileged mode for container scanning)
	if projects, ok := resources["aws_codebuild_project"]; ok {
		projectMap := projects.(map[string]interface{})

		for name, res := range projectMap {
			project := res.(map[string]interface{})

			if env, ok := project["environment"].(map[string]interface{}); ok {
				if privileged, ok := env["privileged_mode"]; !ok || !privileged.(bool) {
					t.Errorf("CodeBuild project %s: should have privileged mode for container operations", name)
				}
			}
		}
	}
}

// Test 50: Validate Overall Architecture Quality and Completeness
func TestOverallArchitectureQualityAndCompleteness(t *testing.T) {
	_, tfConfig := synthStack(t, "test123")

	resources := tfConfig["resource"].(map[string]interface{})

	// Comprehensive architecture validation
	requiredComponents := map[string]int{
		"aws_s3_bucket":               3, // artifacts, source, replica
		"aws_kms_key":                 1, // encryption key
		"aws_kms_alias":               1, // key alias
		"aws_iam_role":                4, // pipeline, build, staging-cfn, prod-cfn
		"aws_codebuild_project":       1, // build project
		"aws_codepipeline":            1, // main pipeline
		"aws_sns_topic":               1, // notifications
		"aws_cloudtrail":              1, // audit logging
		"aws_cloudwatch_event_rule":   2, // pipeline events, rollback triggers
		"aws_cloudwatch_event_target": 2, // event targets
		"aws_cloudwatch_dashboard":    1, // monitoring dashboard
		"aws_cloudwatch_metric_alarm": 2, // pipeline and build alarms
		"aws_s3_bucket_server_side_encryption_configuration": 2, // encryption for main buckets
		"aws_s3_bucket_public_access_block":                  1, // security
		"aws_s3_bucket_versioning":                           2, // data protection
		"aws_s3_bucket_policy":                               1, // CloudTrail access
	}

	// Check all required components exist with minimum counts
	for componentType, minCount := range requiredComponents {
		if componentGroup, ok := resources[componentType]; ok {
			actualCount := len(componentGroup.(map[string]interface{}))
			if actualCount < minCount {
				t.Errorf("Architecture: %s should have at least %d instances, got %d", componentType, minCount, actualCount)
			}
		} else {
			t.Errorf("Architecture: missing required component type %s", componentType)
		}
	}

	// Check outputs are defined
	if outputs, ok := tfConfig["output"]; ok {
		outputMap := outputs.(map[string]interface{})
		expectedOutputs := []string{"pipeline-name", "source-bucket-name", "sns-topic-arn", "kms-key-arn"}

		if len(outputMap) < len(expectedOutputs) {
			t.Error("Architecture: should define all required outputs")
		}

		for _, expectedOutput := range expectedOutputs {
			if _, exists := outputMap[expectedOutput]; !exists {
				t.Errorf("Architecture: missing required output %s", expectedOutput)
			}
		}
	} else {
		t.Error("Architecture: should define outputs")
	}

	// Check provider configuration
	if provider, ok := tfConfig["provider"]; ok {
		if awsProvider, ok := provider.(map[string]interface{})["aws"]; ok {
			awsConfig := awsProvider.([]interface{})[0].(map[string]interface{})

			// Check region is configured
			if _, ok := awsConfig["region"]; !ok {
				t.Error("Architecture: AWS provider should have region configured")
			}

			// Check default tags
			if defaultTags, ok := awsConfig["default_tags"]; ok {
				tags := defaultTags.([]interface{})[0].(map[string]interface{})["tags"].(map[string]interface{})
				expectedTags := []string{"Environment", "Project", "ManagedBy", "EnvironmentSuffix"}

				for _, expectedTag := range expectedTags {
					if _, exists := tags[expectedTag]; !exists {
						t.Errorf("Architecture: missing default tag %s", expectedTag)
					}
				}
			} else {
				t.Error("Architecture: AWS provider should have default tags")
			}
		} else {
			t.Error("Architecture: should have AWS provider configuration")
		}
	} else {
		t.Error("Architecture: should have provider configuration")
	}

	// Final comprehensive validation
	totalResourceCount := 0
	for _, resourceGroup := range resources {
		totalResourceCount += len(resourceGroup.(map[string]interface{}))
	}

	if totalResourceCount < 25 {
		t.Errorf("Architecture: should have comprehensive resource coverage, got %d total resources", totalResourceCount)
	}

	// Check backend configuration
	if terraform, ok := tfConfig["terraform"].(map[string]interface{}); ok {
		if backend, ok := terraform["backend"].(map[string]interface{}); ok {
			if s3Backend, ok := backend["s3"].(map[string]interface{}); ok {
				requiredBackendFields := []string{"bucket", "key", "region", "encrypt"}
				for _, field := range requiredBackendFields {
					if _, exists := s3Backend[field]; !exists {
						t.Errorf("Architecture: S3 backend missing required field %s", field)
					}
				}
			} else {
				t.Error("Architecture: should use S3 backend")
			}
		} else {
			t.Error("Architecture: should have backend configuration")
		}
	} else {
		t.Error("Architecture: should have terraform configuration")
	}

	t.Logf("✓ Architecture Quality Assessment: Comprehensive validation completed with %d total resources", totalResourceCount)
}
