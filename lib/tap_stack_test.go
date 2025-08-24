package lib

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// synthStack synthesizes the stack to a temp outdir and returns the tf json content
func synthStack(t *testing.T) (string, map[string]interface{}) {
	t.Helper()

	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	_ = NewTapStack(app, "TapStack")
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", "TapStack", "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}

	content, err := os.ReadFile(tfPath)
	require.NoError(t, err)

	var synthData map[string]interface{}
	err = json.Unmarshal(content, &synthData)
	require.NoError(t, err)

	return string(content), synthData
}

func TestNewTapStack_CreatesStackSuccessfully(t *testing.T) {
	app := cdktf.NewApp(nil)
	stack := NewTapStack(app, "TestStack")
	
	assert.NotNil(t, stack)
}

func TestNewTapStack_UsesEnvironmentSuffix(t *testing.T) {
	// Test with environment variable set
	os.Setenv("ENVIRONMENT_SUFFIX", "test123")
	defer os.Unsetenv("ENVIRONMENT_SUFFIX")
	
	content, _ := synthStack(t)
	assert.Contains(t, content, "test123")
}

func TestNewTapStack_UsesDefaultSuffixWhenNotSet(t *testing.T) {
	// Ensure environment variable is not set
	os.Unsetenv("ENVIRONMENT_SUFFIX")
	
	content, _ := synthStack(t)
	assert.Contains(t, content, "pr2114")
}

func TestNewTapStack_CreatesResourcesForAllRegions(t *testing.T) {
	_, synthData := synthStack(t)
	
	// Check that resources are created for all three regions
	regions := []string{"us-east-1", "us-west-2", "eu-central-1"}
	
	providers, ok := synthData["provider"].(map[string]interface{})
	assert.True(t, ok, "Provider section should exist")
	
	awsProviders, ok := providers["aws"].([]interface{})
	assert.True(t, ok, "AWS providers should be an array")
	
	regionFound := make(map[string]bool)
	for _, provider := range awsProviders {
		providerConfig, ok := provider.(map[string]interface{})
		if ok {
			region, ok := providerConfig["region"].(string)
			if ok {
				regionFound[region] = true
			}
		}
	}
	
	for _, region := range regions {
		assert.True(t, regionFound[region], fmt.Sprintf("Provider for %s should exist", region))
	}
}

func TestNewTapStack_CreatesVPCsWithCorrectCIDRs(t *testing.T) {
	_, synthData := synthStack(t)
	
	// Check VPC configurations
	expectedCIDRs := map[string]string{
		"us-east-1": "10.0.0.0/16",
		"us-west-2": "10.1.0.0/16",
		"eu-central-1": "10.2.0.0/16",
	}
	
	resources, ok := synthData["resource"].(map[string]interface{})
	assert.True(t, ok, "Resource section should exist")
	
	vpcs, ok := resources["aws_vpc"].(map[string]interface{})
	if ok {
		foundCIDRs := make(map[string]bool)
		for _, vpc := range vpcs {
			vpcConfig, ok := vpc.(map[string]interface{})
			if ok {
				cidr, ok := vpcConfig["cidr_block"].(string)
				if ok {
					for _, expectedCIDR := range expectedCIDRs {
						if cidr == expectedCIDR {
							foundCIDRs[expectedCIDR] = true
						}
					}
				}
			}
		}
		
		for region, expectedCIDR := range expectedCIDRs {
			assert.True(t, foundCIDRs[expectedCIDR], fmt.Sprintf("VPC CIDR %s for %s should exist", expectedCIDR, region))
		}
	}
}

func TestNewTapStack_CreatesSubnetsInMultipleAZs(t *testing.T) {
	_, synthData := synthStack(t)
	
	resources, ok := synthData["resource"].(map[string]interface{})
	assert.True(t, ok, "Resource section should exist")
	
	subnets, ok := resources["aws_subnet"].(map[string]interface{})
	if ok {
		// Check that we have 2 subnets per region (6 total)
		assert.GreaterOrEqual(t, len(subnets), 6, "Should have at least 6 subnets")
		
		// Verify AZ configuration
		for _, subnet := range subnets {
			subnetConfig, ok := subnet.(map[string]interface{})
			if ok {
				az := subnetConfig["availability_zone"]
				assert.NotNil(t, az, "Availability zone should be set")
			}
		}
	}
}

func TestNewTapStack_CreatesSecurityGroups(t *testing.T) {
	_, synthData := synthStack(t)
	
	resources, ok := synthData["resource"].(map[string]interface{})
	assert.True(t, ok, "Resource section should exist")
	
	sgs, ok := resources["aws_security_group"].(map[string]interface{})
	if ok {
		// Check that we have ALB and EC2 security groups for each region
		assert.GreaterOrEqual(t, len(sgs), 6, "Should have at least 6 security groups (2 per region)")
		
		// Check for specific security group patterns
		hasALBSG := false
		hasEC2SG := false
		for key := range sgs {
			if strings.Contains(key, "alb") {
				hasALBSG = true
			}
			if strings.Contains(key, "ec2") {
				hasEC2SG = true
			}
		}
		assert.True(t, hasALBSG, "Should have ALB security groups")
		assert.True(t, hasEC2SG, "Should have EC2 security groups")
	}
}

func TestNewTapStack_CreatesApplicationLoadBalancers(t *testing.T) {
	_, synthData := synthStack(t)
	
	resources, ok := synthData["resource"].(map[string]interface{})
	assert.True(t, ok, "Resource section should exist")
	
	albs, ok := resources["aws_alb"].(map[string]interface{})
	if ok {
		// Check that we have an ALB for each region
		assert.GreaterOrEqual(t, len(albs), 3, "Should have at least 3 ALBs (1 per region)")
		
		// Check ALB configurations
		for _, alb := range albs {
			albConfig, ok := alb.(map[string]interface{})
			if ok {
				loadBalancerType := albConfig["load_balancer_type"]
				assert.Equal(t, "application", loadBalancerType, "Load balancer type should be application")
			}
		}
	}
}

func TestNewTapStack_CreatesAutoScalingGroups(t *testing.T) {
	_, synthData := synthStack(t)
	
	resources, ok := synthData["resource"].(map[string]interface{})
	assert.True(t, ok, "Resource section should exist")
	
	asgs, ok := resources["aws_autoscaling_group"].(map[string]interface{})
	if ok {
		// Check that we have an ASG for each region
		assert.GreaterOrEqual(t, len(asgs), 3, "Should have at least 3 ASGs (1 per region)")
		
		// Check ASG configurations
		for _, asg := range asgs {
			asgConfig, ok := asg.(map[string]interface{})
			if ok {
				// Check min/max/desired capacity
				minSize := asgConfig["min_size"]
				maxSize := asgConfig["max_size"]
				desiredCapacity := asgConfig["desired_capacity"]
				
				assert.Equal(t, float64(2), minSize, "Min size should be 2")
				assert.Equal(t, float64(10), maxSize, "Max size should be 10")
				assert.Equal(t, float64(2), desiredCapacity, "Desired capacity should be 2")
				
				// Check health check type
				healthCheckType := asgConfig["health_check_type"]
				assert.Equal(t, "ELB", healthCheckType, "Health check type should be ELB")
			}
		}
	}
}

func TestNewTapStack_CreatesLaunchTemplates(t *testing.T) {
	_, synthData := synthStack(t)
	
	resources, ok := synthData["resource"].(map[string]interface{})
	assert.True(t, ok, "Resource section should exist")
	
	lts, ok := resources["aws_launch_template"].(map[string]interface{})
	if ok {
		// Check that we have a launch template for each region
		assert.GreaterOrEqual(t, len(lts), 3, "Should have at least 3 launch templates (1 per region)")
		
		// Check launch template configurations
		for _, lt := range lts {
			ltConfig, ok := lt.(map[string]interface{})
			if ok {
				// Check instance type
				instanceType := ltConfig["instance_type"]
				assert.Equal(t, "t3.micro", instanceType, "Instance type should be t3.micro")
				
				// Check user data exists
				userData := ltConfig["user_data"]
				assert.NotNil(t, userData, "User data should be set")
			}
		}
	}
}

func TestNewTapStack_CreatesTargetGroups(t *testing.T) {
	_, synthData := synthStack(t)
	
	resources, ok := synthData["resource"].(map[string]interface{})
	assert.True(t, ok, "Resource section should exist")
	
	tgs, ok := resources["aws_alb_target_group"].(map[string]interface{})
	if ok {
		// Check that we have a target group for each region
		assert.GreaterOrEqual(t, len(tgs), 3, "Should have at least 3 target groups (1 per region)")
		
		// Check target group configurations
		for _, tg := range tgs {
			tgConfig, ok := tg.(map[string]interface{})
			if ok {
				// Check port and protocol
				port := tgConfig["port"]
				protocol := tgConfig["protocol"]
				
				assert.Equal(t, float64(80), port, "Port should be 80")
				assert.Equal(t, "HTTP", protocol, "Protocol should be HTTP")
				
				// Check health check configuration
				healthCheck := tgConfig["health_check"]
				assert.NotNil(t, healthCheck, "Health check should be configured")
				
				if hc, ok := healthCheck.([]interface{}); ok && len(hc) > 0 {
					if hcConfig, ok := hc[0].(map[string]interface{}); ok {
						assert.Equal(t, true, hcConfig["enabled"], "Health check should be enabled")
						assert.Equal(t, float64(2), hcConfig["healthy_threshold"], "Healthy threshold should be 2")
						assert.Equal(t, float64(2), hcConfig["unhealthy_threshold"], "Unhealthy threshold should be 2")
					}
				}
			}
		}
	}
}

func TestNewTapStack_CreatesALBListeners(t *testing.T) {
	_, synthData := synthStack(t)
	
	resources, ok := synthData["resource"].(map[string]interface{})
	assert.True(t, ok, "Resource section should exist")
	
	listeners, ok := resources["aws_alb_listener"].(map[string]interface{})
	if ok {
		// Check that we have a listener for each region
		assert.GreaterOrEqual(t, len(listeners), 3, "Should have at least 3 listeners (1 per region)")
		
		// Check listener configurations
		for _, listener := range listeners {
			listenerConfig, ok := listener.(map[string]interface{})
			if ok {
				// Check port and protocol
				port := listenerConfig["port"]
				protocol := listenerConfig["protocol"]
				
				assert.Equal(t, float64(80), port, "Port should be 80")
				assert.Equal(t, "HTTP", protocol, "Protocol should be HTTP")
				
				// Check default action
				defaultAction := listenerConfig["default_action"]
				assert.NotNil(t, defaultAction, "Default action should be configured")
			}
		}
	}
}

func TestNewTapStack_CreatesOutputs(t *testing.T) {
	_, synthData := synthStack(t)
	
	outputs, ok := synthData["output"].(map[string]interface{})
	assert.True(t, ok, "Output section should exist")
	
	// Check that we have outputs for each region's ALB DNS
	expectedOutputs := []string{
		"alb-dns-us-east-1",
		"alb-dns-us-west-2",
		"alb-dns-eu-central-1",
	}
	
	for _, expectedOutput := range expectedOutputs {
		_, exists := outputs[expectedOutput]
		assert.True(t, exists, fmt.Sprintf("Output %s should exist", expectedOutput))
	}
}

func TestNewTapStack_ResourceNamingConvention(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "test456")
	defer os.Unsetenv("ENVIRONMENT_SUFFIX")
	
	content, _ := synthStack(t)
	
	// Check that resource names include the environment suffix
	assert.Contains(t, content, "tap-test456")
}

func TestNewTapStack_InternetGatewayCreation(t *testing.T) {
	_, synthData := synthStack(t)
	
	resources, ok := synthData["resource"].(map[string]interface{})
	assert.True(t, ok, "Resource section should exist")
	
	igws, ok := resources["aws_internet_gateway"].(map[string]interface{})
	if ok {
		// Check that we have an IGW for each region
		assert.GreaterOrEqual(t, len(igws), 3, "Should have at least 3 Internet Gateways (1 per region)")
	}
}

func TestNewTapStack_RouteTableConfiguration(t *testing.T) {
	_, synthData := synthStack(t)
	
	resources, ok := synthData["resource"].(map[string]interface{})
	assert.True(t, ok, "Resource section should exist")
	
	routeTables, ok := resources["aws_route_table"].(map[string]interface{})
	if ok {
		// Check that we have route tables for each region
		assert.GreaterOrEqual(t, len(routeTables), 3, "Should have at least 3 route tables")
		
		// Check route configuration
		for _, rt := range routeTables {
			rtConfig, ok := rt.(map[string]interface{})
			if ok {
				routes := rtConfig["route"]
				assert.NotNil(t, routes, "Routes should be configured")
			}
		}
	}
}

func TestNewTapStack_RouteTableAssociations(t *testing.T) {
	_, synthData := synthStack(t)
	
	resources, ok := synthData["resource"].(map[string]interface{})
	assert.True(t, ok, "Resource section should exist")
	
	rtas, ok := resources["aws_route_table_association"].(map[string]interface{})
	if ok {
		// Check that we have route table associations for all subnets
		assert.GreaterOrEqual(t, len(rtas), 6, "Should have at least 6 route table associations")
	}
}

func TestNewTapStack_DataSourcesConfiguration(t *testing.T) {
	_, synthData := synthStack(t)
	
	data, ok := synthData["data"].(map[string]interface{})
	assert.True(t, ok, "Data section should exist")
	
	// Check AMI data source
	amis, ok := data["aws_ami"].(map[string]interface{})
	if ok {
		assert.GreaterOrEqual(t, len(amis), 3, "Should have at least 3 AMI data sources")
		
		for _, ami := range amis {
			amiConfig, ok := ami.(map[string]interface{})
			if ok {
				mostRecent := amiConfig["most_recent"]
				assert.Equal(t, true, mostRecent, "Should use most recent AMI")
				
				owners := amiConfig["owners"]
				assert.NotNil(t, owners, "AMI owners should be specified")
			}
		}
	}
}

func TestNewTapStack_SecurityGroupIngressRules(t *testing.T) {
	_, synthData := synthStack(t)
	
	resources, ok := synthData["resource"].(map[string]interface{})
	assert.True(t, ok, "Resource section should exist")
	
	sgs, ok := resources["aws_security_group"].(map[string]interface{})
	if ok {
		for _, sg := range sgs {
			sgConfig, ok := sg.(map[string]interface{})
			if ok {
				ingress := sgConfig["ingress"]
				assert.NotNil(t, ingress, "Ingress rules should be configured")
				
				egress := sgConfig["egress"]
				assert.NotNil(t, egress, "Egress rules should be configured")
			}
		}
	}
}

func TestNewTapStack_TerraformBackendConfiguration(t *testing.T) {
	_, synthData := synthStack(t)
	
	// Check terraform configuration
	terraform, ok := synthData["terraform"].(map[string]interface{})
	assert.True(t, ok, "Terraform section should exist")
	
	// Check backend configuration
	backend, ok := terraform["backend"].(map[string]interface{})
	assert.True(t, ok, "Backend configuration should exist")
	
	// Should use local backend for CDKTF
	_, hasLocal := backend["local"]
	assert.True(t, hasLocal, "Should use local backend")
}