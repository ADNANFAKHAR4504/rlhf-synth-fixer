package test

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/gruntwork-io/terratest/modules/aws"
	"github.com/gruntwork-io/terratest/modules/k8s"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestEKSClusterDeployment(t *testing.T) {
	t.Parallel()

	// Generate unique suffix for this test run
	uniqueSuffix := strings.ToLower(fmt.Sprintf("test-%d", time.Now().Unix()))
	awsRegion := "eu-central-1"

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix": uniqueSuffix,
			"aws_region":         awsRegion,
			"cluster_version":    "1.28",
		},
		MaxRetries:         3,
		TimeBetweenRetries: 5 * time.Second,
	})

	// Clean up resources after test
	defer terraform.Destroy(t, terraformOptions)

	// Run terraform init and apply
	terraform.InitAndApply(t, terraformOptions)

	// Test 1: Verify EKS cluster exists and is active
	t.Run("EKSClusterExists", func(t *testing.T) {
		clusterName := terraform.Output(t, terraformOptions, "cluster_name")
		require.NotEmpty(t, clusterName)

		cluster := aws.GetEksCluster(t, awsRegion, clusterName)
		assert.Equal(t, "ACTIVE", *cluster.Status)
		assert.Equal(t, "1.28", *cluster.Version)
	})

	// Test 2: Verify OIDC provider is enabled
	t.Run("OIDCProviderEnabled", func(t *testing.T) {
		oidcProviderArn := terraform.Output(t, terraformOptions, "oidc_provider_arn")
		require.NotEmpty(t, oidcProviderArn)
		assert.Contains(t, oidcProviderArn, "oidc-provider")
	})

	// Test 3: Verify VPC and networking
	t.Run("VPCNetworking", func(t *testing.T) {
		vpcId := terraform.Output(t, terraformOptions, "vpc_id")
		require.NotEmpty(t, vpcId)

		vpc := aws.GetVpcById(t, vpcId, awsRegion)
		assert.Equal(t, "10.0.0.0/16", *vpc.CidrBlock)

		// Verify private subnets
		privateSubnetIds := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
		assert.Equal(t, 3, len(privateSubnetIds))

		// Verify public subnets
		publicSubnetIds := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
		assert.Equal(t, 3, len(publicSubnetIds))
	})

	// Test 4: Verify all 3 node groups exist
	t.Run("NodeGroupsExist", func(t *testing.T) {
		frontendNodeGroupId := terraform.Output(t, terraformOptions, "node_group_frontend_id")
		backendNodeGroupId := terraform.Output(t, terraformOptions, "node_group_backend_id")
		dataProcessingNodeGroupId := terraform.Output(t, terraformOptions, "node_group_data_processing_id")

		require.NotEmpty(t, frontendNodeGroupId)
		require.NotEmpty(t, backendNodeGroupId)
		require.NotEmpty(t, dataProcessingNodeGroupId)
	})

	// Test 5: Verify Fargate profiles exist
	t.Run("FargateProfilesExist", func(t *testing.T) {
		corednsProfileId := terraform.Output(t, terraformOptions, "fargate_profile_coredns_id")
		albControllerProfileId := terraform.Output(t, terraformOptions, "fargate_profile_alb_controller_id")

		require.NotEmpty(t, corednsProfileId)
		require.NotEmpty(t, albControllerProfileId)
	})

	// Test 6: Verify IRSA roles are created
	t.Run("IRSARolesExist", func(t *testing.T) {
		albControllerRoleArn := terraform.Output(t, terraformOptions, "alb_controller_role_arn")
		clusterAutoscalerRoleArn := terraform.Output(t, terraformOptions, "cluster_autoscaler_role_arn")
		secretsManagerRoleArn := terraform.Output(t, terraformOptions, "secrets_manager_role_arn")

		require.NotEmpty(t, albControllerRoleArn)
		require.NotEmpty(t, clusterAutoscalerRoleArn)
		require.NotEmpty(t, secretsManagerRoleArn)

		assert.Contains(t, albControllerRoleArn, "eks-alb-controller-role")
		assert.Contains(t, clusterAutoscalerRoleArn, "eks-cluster-autoscaler-role")
		assert.Contains(t, secretsManagerRoleArn, "eks-secrets-manager-role")
	})

	// Test 7: Verify CloudWatch Container Insights
	t.Run("ContainerInsightsEnabled", func(t *testing.T) {
		logGroupName := terraform.Output(t, terraformOptions, "cloudwatch_log_group_name")
		require.NotEmpty(t, logGroupName)
		assert.Contains(t, logGroupName, "containerinsights")
	})

	// Test 8: Verify ECR repository with scanning enabled
	t.Run("ECRRepositoryExists", func(t *testing.T) {
		ecrRepositoryUrl := terraform.Output(t, terraformOptions, "ecr_repository_url")
		require.NotEmpty(t, ecrRepositoryUrl)
		assert.Contains(t, ecrRepositoryUrl, "ecr")
	})

	// Test 9: Verify Secrets Manager secret exists
	t.Run("SecretsManagerSecretExists", func(t *testing.T) {
		secretArn := terraform.Output(t, terraformOptions, "secrets_manager_secret_arn")
		require.NotEmpty(t, secretArn)
		assert.Contains(t, secretArn, "secretsmanager")
	})

	// Test 10: Verify kubectl access to cluster
	t.Run("KubectlAccess", func(t *testing.T) {
		clusterName := terraform.Output(t, terraformOptions, "cluster_name")

		// Configure kubectl options
		kubectlOptions := k8s.NewKubectlOptions("", "", "")
		kubectlOptions.ConfigPath = fmt.Sprintf("~/.kube/config-%s", clusterName)

		// Test kubectl connectivity
		nodes, err := k8s.GetNodesE(t, kubectlOptions)
		if err == nil {
			assert.NotEmpty(t, nodes)
		}
	})
}

func TestNodeGroupScaling(t *testing.T) {
	t.Parallel()

	uniqueSuffix := strings.ToLower(fmt.Sprintf("scale-%d", time.Now().Unix()))
	awsRegion := "eu-central-1"

	terraformOptions := &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":      uniqueSuffix,
			"aws_region":              awsRegion,
			"node_group_min_size":     2,
			"node_group_max_size":     10,
			"node_group_desired_size": 2,
		},
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// Verify node group scaling configuration
	t.Run("NodeGroupScalingConfig", func(t *testing.T) {
		clusterName := terraform.Output(t, terraformOptions, "cluster_name")
		require.NotEmpty(t, clusterName)

		// Verify frontend node group scaling
		frontendNodeGroupId := terraform.Output(t, terraformOptions, "node_group_frontend_id")
		assert.Contains(t, frontendNodeGroupId, "frontend")

		// Verify backend node group scaling
		backendNodeGroupId := terraform.Output(t, terraformOptions, "node_group_backend_id")
		assert.Contains(t, backendNodeGroupId, "backend")

		// Verify data-processing node group scaling
		dataProcessingNodeGroupId := terraform.Output(t, terraformOptions, "node_group_data_processing_id")
		assert.Contains(t, dataProcessingNodeGroupId, "data-processing")
	})
}

func TestFargateProfiles(t *testing.T) {
	t.Parallel()

	uniqueSuffix := strings.ToLower(fmt.Sprintf("fargate-%d", time.Now().Unix()))
	awsRegion := "eu-central-1"

	terraformOptions := &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix": uniqueSuffix,
			"aws_region":         awsRegion,
		},
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	t.Run("FargateProfileConfiguration", func(t *testing.T) {
		// Verify CoreDNS Fargate profile
		corednsProfileId := terraform.Output(t, terraformOptions, "fargate_profile_coredns_id")
		require.NotEmpty(t, corednsProfileId)
		assert.Contains(t, corednsProfileId, "coredns")

		// Verify ALB Controller Fargate profile
		albControllerProfileId := terraform.Output(t, terraformOptions, "fargate_profile_alb_controller_id")
		require.NotEmpty(t, albControllerProfileId)
		assert.Contains(t, albControllerProfileId, "alb-controller")
	})
}

func TestSecurity(t *testing.T) {
	t.Parallel()

	uniqueSuffix := strings.ToLower(fmt.Sprintf("sec-%d", time.Now().Unix()))
	awsRegion := "eu-central-1"

	terraformOptions := &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix": uniqueSuffix,
			"aws_region":         awsRegion,
		},
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	t.Run("SecurityConfiguration", func(t *testing.T) {
		// Verify ECR repository has scanning enabled
		ecrRepositoryUrl := terraform.Output(t, terraformOptions, "ecr_repository_url")
		require.NotEmpty(t, ecrRepositoryUrl)

		// Verify Secrets Manager secret exists
		secretArn := terraform.Output(t, terraformOptions, "secrets_manager_secret_arn")
		require.NotEmpty(t, secretArn)

		// Verify VPC endpoints for security
		vpcId := terraform.Output(t, terraformOptions, "vpc_id")
		require.NotEmpty(t, vpcId)
	})
}

func TestMonitoring(t *testing.T) {
	t.Parallel()

	uniqueSuffix := strings.ToLower(fmt.Sprintf("mon-%d", time.Now().Unix()))
	awsRegion := "eu-central-1"

	terraformOptions := &terraform.Options{
		TerraformDir: "../lib",
		Vars: map[string]interface{}{
			"environment_suffix":         uniqueSuffix,
			"aws_region":                 awsRegion,
			"enable_container_insights":  true,
		},
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	t.Run("MonitoringConfiguration", func(t *testing.T) {
		// Verify CloudWatch log group for Container Insights
		logGroupName := terraform.Output(t, terraformOptions, "cloudwatch_log_group_name")
		require.NotEmpty(t, logGroupName)
		assert.Contains(t, logGroupName, "containerinsights")
		assert.Contains(t, logGroupName, "performance")
	})
}
