//go:build !integration
// +build !integration

package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"
)

// synthStack synthesizes the stack to a temp outdir and returns the tf json path
func synthStack(t *testing.T, stackId string) string {
	t.Helper()

	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdktf.out")

	// Set AWS region for provider
	old := os.Getenv("AWS_REGION")
	t.Cleanup(func() { _ = os.Setenv("AWS_REGION", old) })
	_ = os.Setenv("AWS_REGION", "us-west-2")

	// Set environment suffix
	oldSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	t.Cleanup(func() { _ = os.Setenv("ENVIRONMENT_SUFFIX", oldSuffix) })
	_ = os.Setenv("ENVIRONMENT_SUFFIX", "test")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	NewTapStack(app, stackId, &TapStackProps{
		EnvironmentSuffix: "test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-west-2",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
	})
	app.Synth()

	tfPath := filepath.Join(outdir, "stacks", stackId, "cdk.tf.json")
	if _, err := os.Stat(tfPath); err != nil {
		t.Fatalf("expected synthesized file at %s: %v", tfPath, err)
	}
	return tfPath
}

// loadTerraformJSON loads and parses the synthesized Terraform JSON
func loadTerraformJSON(t *testing.T, path string) map[string]interface{} {
	t.Helper()

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read terraform json: %v", err)
	}

	var tfConfig map[string]interface{}
	if err := json.Unmarshal(data, &tfConfig); err != nil {
		t.Fatalf("failed to parse terraform json: %v", err)
	}

	return tfConfig
}

func TestStackSynthesis(t *testing.T) {
	tfPath := synthStack(t, "TapStack")

	if _, err := os.Stat(tfPath); err != nil {
		t.Errorf("Stack synthesis failed: terraform json not found at %s", tfPath)
	}
}

func TestVPCConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	// Check VPC exists
	resources, ok := tfConfig["resource"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found in terraform config")
	}

	awsVpc, ok := resources["aws_vpc"].(map[string]interface{})
	if !ok {
		t.Fatal("no VPC resource found")
	}

	secureNetwork, ok := awsVpc["secure-network"].(map[string]interface{})
	if !ok {
		t.Fatal("secure-network VPC not found")
	}

	// Verify VPC configuration
	if cidr := secureNetwork["cidr_block"]; cidr != "10.0.0.0/16" {
		t.Errorf("expected VPC CIDR block 10.0.0.0/16, got %v", cidr)
	}

	if enableDns := secureNetwork["enable_dns_hostnames"]; enableDns != true {
		t.Errorf("expected enable_dns_hostnames to be true, got %v", enableDns)
	}

	// Check tags
	tags, ok := secureNetwork["tags"].(map[string]interface{})
	if !ok {
		t.Fatal("VPC tags not found")
	}

	if name := tags["Name"]; name != "test-cdktf-secure-network" {
		t.Errorf("expected VPC Name tag 'test-cdktf-secure-network', got %v", name)
	}

	if env := tags["Environment"]; env != "Production" {
		t.Errorf("expected VPC Environment tag 'Production', got %v", env)
	}
}

func TestSubnetsConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	resources, _ := tfConfig["resource"].(map[string]interface{})
	awsSubnet, ok := resources["aws_subnet"].(map[string]interface{})
	if !ok {
		t.Fatal("no subnet resources found")
	}

	// Check we have 4 subnets (2 public, 2 private)
	if len(awsSubnet) != 4 {
		t.Errorf("expected 4 subnets, got %d", len(awsSubnet))
	}

	// Verify public subnet configuration
	publicSubnet1, ok := awsSubnet["public-subnet-1"].(map[string]interface{})
	if !ok {
		t.Fatal("public-subnet-1 not found")
	}

	if cidr := publicSubnet1["cidr_block"]; cidr != "10.0.1.0/24" {
		t.Errorf("expected public subnet 1 CIDR 10.0.1.0/24, got %v", cidr)
	}

	if mapPublicIp := publicSubnet1["map_public_ip_on_launch"]; mapPublicIp != true {
		t.Errorf("expected public subnet to map public IPs, got %v", mapPublicIp)
	}

	// Verify private subnet configuration
	privateSubnet1, ok := awsSubnet["private-subnet-1"].(map[string]interface{})
	if !ok {
		t.Fatal("private-subnet-1 not found")
	}

	if cidr := privateSubnet1["cidr_block"]; cidr != "10.0.10.0/24" {
		t.Errorf("expected private subnet 1 CIDR 10.0.10.0/24, got %v", cidr)
	}
}

func TestSecurityGroupConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	resources, _ := tfConfig["resource"].(map[string]interface{})

	// Check security group exists
	awsSg, ok := resources["aws_security_group"].(map[string]interface{})
	if !ok {
		t.Fatal("no security group resources found")
	}

	webSg, ok := awsSg["web-security-group"].(map[string]interface{})
	if !ok {
		t.Fatal("web-security-group not found")
	}

	if name := webSg["name"]; name != "test-cdktf-web-application-sg" {
		t.Errorf("expected security group name 'test-cdktf-web-application-sg', got %v", name)
	}

	// Check security group rules
	awsSgRule, ok := resources["aws_security_group_rule"].(map[string]interface{})
	if !ok {
		t.Fatal("no security group rules found")
	}

	// Verify HTTP rule
	httpRule, ok := awsSgRule["allow-http-inbound"].(map[string]interface{})
	if !ok {
		t.Fatal("allow-http-inbound rule not found")
	}

	if port := httpRule["from_port"]; port != float64(80) {
		t.Errorf("expected HTTP from_port 80, got %v", port)
	}

	if port := httpRule["to_port"]; port != float64(80) {
		t.Errorf("expected HTTP to_port 80, got %v", port)
	}

	// Verify HTTPS rule
	httpsRule, ok := awsSgRule["allow-https-inbound"].(map[string]interface{})
	if !ok {
		t.Fatal("allow-https-inbound rule not found")
	}

	if port := httpsRule["from_port"]; port != float64(443) {
		t.Errorf("expected HTTPS from_port 443, got %v", port)
	}
}

func TestS3BucketConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	resources, _ := tfConfig["resource"].(map[string]interface{})

	// Check S3 bucket exists
	awsS3, ok := resources["aws_s3_bucket"].(map[string]interface{})
	if !ok {
		t.Fatal("no S3 bucket resources found")
	}

	logsBucket, ok := awsS3["app-logs-bucket"].(map[string]interface{})
	if !ok {
		t.Fatal("app-logs-bucket not found")
	}

	if prefix := logsBucket["bucket_prefix"]; prefix != "test-cdktf-secure-web-app-logs-" {
		t.Errorf("expected bucket prefix 'test-cdktf-secure-web-app-logs-', got %v", prefix)
	}

	// Check encryption configuration
	awsS3Encryption, ok := resources["aws_s3_bucket_server_side_encryption_configuration"].(map[string]interface{})
	if !ok {
		t.Fatal("S3 encryption configuration not found")
	}

	if _, ok := awsS3Encryption["logs-bucket-encryption"]; !ok {
		t.Fatal("logs-bucket-encryption configuration not found")
	}

	// Check public access block
	awsS3Pab, ok := resources["aws_s3_bucket_public_access_block"].(map[string]interface{})
	if !ok {
		t.Fatal("S3 public access block not found")
	}

	pab, ok := awsS3Pab["logs-bucket-pab"].(map[string]interface{})
	if !ok {
		t.Fatal("logs-bucket-pab configuration not found")
	}

	if block := pab["block_public_acls"]; block != true {
		t.Errorf("expected block_public_acls to be true, got %v", block)
	}

	// Check versioning
	awsS3Versioning, ok := resources["aws_s3_bucket_versioning"].(map[string]interface{})
	if !ok {
		t.Fatal("S3 versioning configuration not found")
	}

	if _, ok := awsS3Versioning["logs-bucket-versioning"]; !ok {
		t.Fatal("logs-bucket-versioning configuration not found")
	}
}

func TestIAMConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	resources, _ := tfConfig["resource"].(map[string]interface{})

	// Check IAM role exists
	awsIamRole, ok := resources["aws_iam_role"].(map[string]interface{})
	if !ok {
		t.Fatal("no IAM role resources found")
	}

	webRole, ok := awsIamRole["web-app-role"].(map[string]interface{})
	if !ok {
		t.Fatal("web-app-role not found")
	}

	if name := webRole["name"]; name != "test-cdktf-WebAppEC2Role" {
		t.Errorf("expected IAM role name 'test-cdktf-WebAppEC2Role', got %v", name)
	}

	// Check IAM policy exists
	awsIamPolicy, ok := resources["aws_iam_policy"].(map[string]interface{})
	if !ok {
		t.Fatal("no IAM policy resources found")
	}

	logPolicy, ok := awsIamPolicy["s3-log-policy"].(map[string]interface{})
	if !ok {
		t.Fatal("s3-log-policy not found")
	}

	if name := logPolicy["name"]; name != "test-cdktf-S3LogWritePolicy" {
		t.Errorf("expected IAM policy name 'test-cdktf-S3LogWritePolicy', got %v", name)
	}

	// Check IAM instance profile
	awsIamProfile, ok := resources["aws_iam_instance_profile"].(map[string]interface{})
	if !ok {
		t.Fatal("no IAM instance profile resources found")
	}

	if _, ok := awsIamProfile["web-app-profile"]; !ok {
		t.Fatal("web-app-profile not found")
	}
}

func TestEC2InstanceConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	resources, _ := tfConfig["resource"].(map[string]interface{})

	// Check EC2 instance exists
	awsInstance, ok := resources["aws_instance"].(map[string]interface{})
	if !ok {
		t.Fatal("no EC2 instance resources found")
	}

	webServer, ok := awsInstance["web-server"].(map[string]interface{})
	if !ok {
		t.Fatal("web-server instance not found")
	}

	if instanceType := webServer["instance_type"]; instanceType != "t3.micro" {
		t.Errorf("expected instance type 't3.micro', got %v", instanceType)
	}

	if monitoring := webServer["monitoring"]; monitoring != true {
		t.Errorf("expected monitoring to be enabled, got %v", monitoring)
	}

	// Check root block device encryption
	rootDevice, ok := webServer["root_block_device"].(map[string]interface{})
	if !ok {
		t.Fatal("root block device configuration not found")
	}

	if encrypted := rootDevice["encrypted"]; encrypted != true {
		t.Errorf("expected root block device to be encrypted, got %v", encrypted)
	}

	// Check metadata options for IMDSv2
	metadataOptions, ok := webServer["metadata_options"].(map[string]interface{})
	if !ok {
		t.Fatal("metadata options not found")
	}

	if tokens := metadataOptions["http_tokens"]; tokens != "required" {
		t.Errorf("expected http_tokens to be 'required' for IMDSv2, got %v", tokens)
	}
}

func TestNetworkACLConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	resources, _ := tfConfig["resource"].(map[string]interface{})

	// Check Network ACL exists
	awsNacl, ok := resources["aws_network_acl"].(map[string]interface{})
	if !ok {
		t.Fatal("no network ACL resources found")
	}

	if _, ok := awsNacl["secure-network-acl"]; !ok {
		t.Fatal("secure-network-acl not found")
	}

	// Check Network ACL rules
	awsNaclRule, ok := resources["aws_network_acl_rule"].(map[string]interface{})
	if !ok {
		t.Fatal("no network ACL rules found")
	}

	// Verify HTTP rule
	httpRule, ok := awsNaclRule["allow-http"].(map[string]interface{})
	if !ok {
		t.Fatal("allow-http ACL rule not found")
	}

	if port := httpRule["from_port"]; port != float64(80) {
		t.Errorf("expected HTTP ACL from_port 80, got %v", port)
	}

	// Verify HTTPS rule
	httpsRule, ok := awsNaclRule["allow-https"].(map[string]interface{})
	if !ok {
		t.Fatal("allow-https ACL rule not found")
	}

	if port := httpsRule["from_port"]; port != float64(443) {
		t.Errorf("expected HTTPS ACL from_port 443, got %v", port)
	}
}

func TestVPCEndpointConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	resources, _ := tfConfig["resource"].(map[string]interface{})

	// Check VPC Endpoint exists
	awsVpcEndpoint, ok := resources["aws_vpc_endpoint"].(map[string]interface{})
	if !ok {
		t.Fatal("no VPC endpoint resources found")
	}

	s3Endpoint, ok := awsVpcEndpoint["s3-vpc-endpoint"].(map[string]interface{})
	if !ok {
		t.Fatal("s3-vpc-endpoint not found")
	}

	if serviceName := s3Endpoint["service_name"]; serviceName != "com.amazonaws.us-west-2.s3" {
		t.Errorf("expected S3 endpoint service name 'com.amazonaws.us-west-2.s3', got %v", serviceName)
	}

	if endpointType := s3Endpoint["vpc_endpoint_type"]; endpointType != "Gateway" {
		t.Errorf("expected VPC endpoint type 'Gateway', got %v", endpointType)
	}
}

func TestEC2InstanceConnectEndpoint(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	resources, _ := tfConfig["resource"].(map[string]interface{})

	// Check EC2 Instance Connect Endpoint exists
	awsEice, ok := resources["aws_ec2_instance_connect_endpoint"].(map[string]interface{})
	if !ok {
		t.Fatal("no EC2 Instance Connect Endpoint resources found")
	}

	if _, ok := awsEice["eice"]; !ok {
		t.Fatal("EC2 Instance Connect Endpoint not found")
	}
}

func TestProviderConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	// Check provider configuration
	provider, ok := tfConfig["provider"].(map[string]interface{})
	if !ok {
		t.Fatal("no provider configuration found")
	}

	awsProvider, ok := provider["aws"].([]interface{})
	if !ok || len(awsProvider) == 0 {
		t.Fatal("AWS provider not configured")
	}

	awsConfig := awsProvider[0].(map[string]interface{})

	if region := awsConfig["region"]; region != "us-west-2" {
		t.Errorf("expected AWS region 'us-west-2', got %v", region)
	}

	// Check default tags
	defaultTags, ok := awsConfig["default_tags"].([]interface{})
	if !ok || len(defaultTags) == 0 {
		t.Fatal("default tags not configured")
	}

	tags := defaultTags[0].(map[string]interface{})["tags"].(map[string]interface{})
	if env := tags["Environment"]; env != "test" {
		t.Errorf("expected default Environment tag 'test', got %v", env)
	}
}

func TestOutputsConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	// Check outputs exist
	outputs, ok := tfConfig["output"].(map[string]interface{})
	if !ok {
		t.Fatal("no outputs found")
	}

	// Verify all required outputs
	requiredOutputs := []string{
		"vpc_id",
		"instance_id",
		"s3_bucket_name",
		"instance_connect_endpoint_id",
		"private_instance_ip",
	}

	for _, outputName := range requiredOutputs {
		if _, ok := outputs[outputName]; !ok {
			t.Errorf("required output '%s' not found", outputName)
		}
	}
}
