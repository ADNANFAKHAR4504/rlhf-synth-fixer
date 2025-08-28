//go:build !integration
// +build !integration

package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// synthStack synthesizes the stack to a temp outdir and returns the tf json path
func synthStack(t *testing.T, stackName string, region string) string {
	t.Helper()

	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set AWS region for provider
	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() {
		if old == "" {
			os.Unsetenv("AWS_REGION")
		} else {
			os.Setenv("AWS_REGION", old)
		}
	})
	os.Setenv("AWS_REGION", region)

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})

	NewTapStack(app, jsii.String(stackName), &TapStackConfig{
		Region:          jsii.String(region),
		Environment:     jsii.String("test"),
		Project:         jsii.String("security-test"),
		Owner:           jsii.String("test-team"),
		CostCenter:      jsii.String("test-center"),
		VpcCidr:         jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{jsii.String("203.0.113.0/24")},
	})

	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", stackName, "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}
	return tfPath
}

func loadSynthesizedStack(t *testing.T, tfPath string) map[string]interface{} {
	t.Helper()

	data, err := os.ReadFile(tfPath)
	require.NoError(t, err)

	var tfConfig map[string]interface{}
	err = json.Unmarshal(data, &tfConfig)
	require.NoError(t, err)

	return tfConfig
}

func TestTapStackCreation(t *testing.T) {
	tfPath := synthStack(t, "TapStackTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Verify basic structure
	assert.Contains(t, tfConfig, "provider")
	assert.Contains(t, tfConfig, "resource")
	assert.Contains(t, tfConfig, "terraform")
}

func TestVPCConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStackVPCTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	resources := tfConfig["resource"].(map[string]interface{})
	require.Contains(t, resources, "aws_vpc")

	vpcResources := resources["aws_vpc"].(map[string]interface{})
	require.NotEmpty(t, vpcResources)

	// Get first VPC
	for _, v := range vpcResources {
		vpc := v.(map[string]interface{})
		assert.Equal(t, "10.0.0.0/16", vpc["cidr_block"])

		if tags, exists := vpc["tags"]; exists {
			tagMap := tags.(map[string]interface{})
			assert.Equal(t, "Development", tagMap["Environment"])
		}
		break
	}
}

func TestSubnetConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStackSubnetTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	resources := tfConfig["resource"].(map[string]interface{})
	require.Contains(t, resources, "aws_subnet")

	subnetResources := resources["aws_subnet"].(map[string]interface{})

	// Should have 2 subnets
	assert.Len(t, subnetResources, 2)

	cidrBlocks := make([]string, 0)
	for _, subnet := range subnetResources {
		subnetConfig := subnet.(map[string]interface{})
		cidrBlocks = append(cidrBlocks, subnetConfig["cidr_block"].(string))
	}

	// Check CIDR blocks
	assert.Contains(t, cidrBlocks, "10.0.0.0/24")
	assert.Contains(t, cidrBlocks, "10.0.1.0/24")
}

func TestInternetGatewayConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStackIGWTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	resources := tfConfig["resource"].(map[string]interface{})
	require.Contains(t, resources, "aws_internet_gateway")

	igwResources := resources["aws_internet_gateway"].(map[string]interface{})
	assert.Len(t, igwResources, 1)

	// Check IGW tags
	for _, v := range igwResources {
		igw := v.(map[string]interface{})
		if tags, exists := igw["tags"]; exists {
			tagMap := tags.(map[string]interface{})
			assert.Equal(t, "dev-igw", tagMap["Name"])
		}
		break
	}
}

func TestRouteTableConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStackRouteTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	resources := tfConfig["resource"].(map[string]interface{})

	// Should have route tables
	require.Contains(t, resources, "aws_route_table")
	routeTables := resources["aws_route_table"].(map[string]interface{})
	assert.Len(t, routeTables, 2)

	// Should have route table associations
	require.Contains(t, resources, "aws_route_table_association")
	associations := resources["aws_route_table_association"].(map[string]interface{})
	assert.Len(t, associations, 2)

	// Check route configuration
	for _, rt := range routeTables {
		routeTable := rt.(map[string]interface{})
		if routes, exists := routeTable["route"]; exists {
			routeList := routes.([]interface{})
			assert.Len(t, routeList, 1)

			route := routeList[0].(map[string]interface{})
			assert.Equal(t, "0.0.0.0/0", route["cidr_block"])
		}
	}
}

func TestNetworkACLConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStackNACLTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	resources := tfConfig["resource"].(map[string]interface{})
	require.Contains(t, resources, "aws_network_acl")

	naclResources := resources["aws_network_acl"].(map[string]interface{})
	assert.Len(t, naclResources, 1)

	// Get the NACL
	for _, v := range naclResources {
		nacl := v.(map[string]interface{})

		// Check ingress rules
		if ingress, exists := nacl["ingress"]; exists {
			ingressRules := ingress.([]interface{})
			assert.Len(t, ingressRules, 2)

			// Verify HTTP and HTTPS rules exist
			ports := make([]float64, 0)
			for _, rule := range ingressRules {
				ruleMap := rule.(map[string]interface{})
				ports = append(ports, ruleMap["from_port"].(float64))
			}
			assert.Contains(t, ports, float64(80))
			assert.Contains(t, ports, float64(443))
		}

		// Check egress rules
		if egress, exists := nacl["egress"]; exists {
			egressRules := egress.([]interface{})
			assert.Len(t, egressRules, 2)
		}
		break
	}
}

func TestSecurityGroupConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStackSGTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	resources := tfConfig["resource"].(map[string]interface{})
	require.Contains(t, resources, "aws_security_group")

	sgResources := resources["aws_security_group"].(map[string]interface{})
	assert.Len(t, sgResources, 1)

	// Get the security group
	for _, v := range sgResources {
		sg := v.(map[string]interface{})

		if ingress, exists := sg["ingress"]; exists {
			ingressRules := ingress.([]interface{})
			assert.Len(t, ingressRules, 3) // SSH, HTTP, HTTPS

			// Check for expected ports
			ports := make([]float64, 0)
			for _, rule := range ingressRules {
				ruleMap := rule.(map[string]interface{})
				ports = append(ports, ruleMap["from_port"].(float64))
			}
			assert.Contains(t, ports, float64(22))  // SSH
			assert.Contains(t, ports, float64(80))  // HTTP
			assert.Contains(t, ports, float64(443)) // HTTPS
		}
		break
	}
}

func TestEC2InstanceConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStackEC2Test", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	resources := tfConfig["resource"].(map[string]interface{})
	require.Contains(t, resources, "aws_instance")

	instanceResources := resources["aws_instance"].(map[string]interface{})
	assert.Len(t, instanceResources, 2)

	// Check instance configuration
	for _, inst := range instanceResources {
		instance := inst.(map[string]interface{})
		assert.Equal(t, "t2.micro", instance["instance_type"])
		assert.Equal(t, "rlhf-iac-team2-key", instance["key_name"])
		assert.Equal(t, true, instance["monitoring"])
		assert.Equal(t, true, instance["associate_public_ip_address"])

		// Check tags
		if tags, exists := instance["tags"]; exists {
			tagMap := tags.(map[string]interface{})
			assert.Contains(t, tagMap["Name"].(string), "dev-ec2-")
		}
	}
}

func TestDataSourceConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStackDataTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	require.Contains(t, tfConfig, "data")
	dataSources := tfConfig["data"].(map[string]interface{})
	require.Contains(t, dataSources, "aws_ami")

	amiData := dataSources["aws_ami"].(map[string]interface{})
	assert.Len(t, amiData, 1)

	// Get the AMI data source
	for _, v := range amiData {
		ami := v.(map[string]interface{})
		assert.Equal(t, true, ami["most_recent"])

		owners := ami["owners"].([]interface{})
		assert.Contains(t, owners, "amazon")

		filters := ami["filter"].([]interface{})
		assert.Len(t, filters, 1)
		break
	}
}

func TestStackOutputs(t *testing.T) {
	tfPath := synthStack(t, "TapStackOutputTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	require.Contains(t, tfConfig, "output")
	outputs := tfConfig["output"].(map[string]interface{})

	// Check for expected outputs
	assert.Contains(t, outputs, "vpcId")
	assert.Contains(t, outputs, "subnetIds")
}

func TestProviderConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStackProviderTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	require.Contains(t, tfConfig, "provider")
	provider := tfConfig["provider"].(map[string]interface{})
	require.Contains(t, provider, "aws")

	awsProvider := provider["aws"].([]interface{})
	require.NotEmpty(t, awsProvider)

	awsConfig := awsProvider[0].(map[string]interface{})
	assert.Equal(t, "us-west-2", awsConfig["region"])

	// Check default tags
	if defaultTags, exists := awsConfig["default_tags"]; exists {
		tagsList := defaultTags.([]interface{})
		if len(tagsList) > 0 {
			tags := tagsList[0].(map[string]interface{})["tags"].(map[string]interface{})
			assert.Equal(t, "test", tags["Environment"])
			assert.Equal(t, "cdktf", tags["ManagedBy"])
		}
	}
}

func TestBackendConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStackBackendTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	require.Contains(t, tfConfig, "terraform")
	terraform := tfConfig["terraform"].(map[string]interface{})
	require.Contains(t, terraform, "backend")

	backend := terraform["backend"].(map[string]interface{})
	require.Contains(t, backend, "s3")

	s3Backend := backend["s3"].(map[string]interface{})
	assert.Equal(t, true, s3Backend["encrypt"])
	assert.Equal(t, "iac-rlhf-tf-states", s3Backend["bucket"])
	assert.Equal(t, "us-east-1", s3Backend["region"])
}

func TestEnvironmentSuffixHandling(t *testing.T) {
	// Test with custom environment suffix
	oldEnvSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	os.Setenv("ENVIRONMENT_SUFFIX", "customtest123")
	defer func() {
		if oldEnvSuffix == "" {
			os.Unsetenv("ENVIRONMENT_SUFFIX")
		} else {
			os.Setenv("ENVIRONMENT_SUFFIX", oldEnvSuffix)
		}
	}()

	tfPath := synthStack(t, "TapStackEnvTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Verify resources are created
	require.Contains(t, tfConfig, "resource")
	resources := tfConfig["resource"].(map[string]interface{})
	assert.NotEmpty(t, resources)

	// Check backend key contains custom suffix
	terraform := tfConfig["terraform"].(map[string]interface{})
	backend := terraform["backend"].(map[string]interface{})
	s3Backend := backend["s3"].(map[string]interface{})
	key := s3Backend["key"].(string)
	assert.Contains(t, key, "cdktf-customtest123")
}

func TestCustomStateBucketConfiguration(t *testing.T) {
	oldBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	oldRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")

	os.Setenv("TERRAFORM_STATE_BUCKET", "custom-state-bucket")
	os.Setenv("TERRAFORM_STATE_BUCKET_REGION", "us-west-1")

	defer func() {
		if oldBucket == "" {
			os.Unsetenv("TERRAFORM_STATE_BUCKET")
		} else {
			os.Setenv("TERRAFORM_STATE_BUCKET", oldBucket)
		}
		if oldRegion == "" {
			os.Unsetenv("TERRAFORM_STATE_BUCKET_REGION")
		} else {
			os.Setenv("TERRAFORM_STATE_BUCKET_REGION", oldRegion)
		}
	}()

	tfPath := synthStack(t, "TapStackCustomBackendTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	terraform := tfConfig["terraform"].(map[string]interface{})
	backend := terraform["backend"].(map[string]interface{})
	s3Backend := backend["s3"].(map[string]interface{})

	assert.Equal(t, "custom-state-bucket", s3Backend["bucket"])
	assert.Equal(t, "us-west-1", s3Backend["region"])
}

func TestResourceTagging(t *testing.T) {
	tfPath := synthStack(t, "TapStackTagTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	// Check provider default tags
	provider := tfConfig["provider"].(map[string]interface{})
	awsProvider := provider["aws"].([]interface{})[0].(map[string]interface{})

	require.Contains(t, awsProvider, "default_tags")
	defaultTags := awsProvider["default_tags"].([]interface{})[0].(map[string]interface{})
	tags := defaultTags["tags"].(map[string]interface{})

	// Check required tags
	assert.Equal(t, "test", tags["Environment"])
	assert.Equal(t, "security-test", tags["Project"])
	assert.Equal(t, "test-team", tags["Owner"])
	assert.Equal(t, "test-center", tags["CostCenter"])
	assert.Equal(t, "cdktf", tags["ManagedBy"])
}

func TestResourceCounts(t *testing.T) {
	tfPath := synthStack(t, "TapStackCountTest", "us-west-2")
	tfConfig := loadSynthesizedStack(t, tfPath)

	resources := tfConfig["resource"].(map[string]interface{})

	// Verify expected resource counts
	expectedCounts := map[string]int{
		"aws_vpc":                     1,
		"aws_subnet":                  2,
		"aws_internet_gateway":        1,
		"aws_route_table":             2,
		"aws_route_table_association": 2,
		"aws_network_acl":             1,
		"aws_security_group":          1,
		"aws_instance":                2,
	}

	for resourceType, expectedCount := range expectedCounts {
		if resourceMap, exists := resources[resourceType]; exists {
			actualCount := len(resourceMap.(map[string]interface{}))
			assert.Equal(t, expectedCount, actualCount,
				"Expected %d %s resources, got %d", expectedCount, resourceType, actualCount)
		} else {
			t.Errorf("Resource type %s not found", resourceType)
		}
	}
}
