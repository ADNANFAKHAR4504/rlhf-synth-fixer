//go:build !integration
// +build !integration

package lib

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

	// Set DB credentials for testing
	oldDBUser := os.Getenv("DB_USERNAME")
	oldDBPass := os.Getenv("DB_PASSWORD")
	t.Cleanup(func() {
		_ = os.Setenv("DB_USERNAME", oldDBUser)
		_ = os.Setenv("DB_PASSWORD", oldDBPass)
	})
	_ = os.Setenv("DB_USERNAME", "testuser")
	_ = os.Setenv("DB_PASSWORD", "testpass123!")

	app := cdktf.NewApp(&cdktf.AppConfig{Outdir: jsii.String(outdir)})
	NewTapStack(app, stackId, &TapStackProps{
		EnvironmentSuffix: "test",
		StateBucket:       "test-bucket",
		StateBucketRegion: "us-east-1",
		AwsRegion:         "us-west-2",
		RepositoryName:    "test-repo",
		CommitAuthor:      "test-author",
		OfficeIP:          "203.0.113.0/32",
		InstanceType:      "t3.micro",
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

	mainVpc, ok := awsVpc["main"].(map[string]interface{})
	if !ok {
		t.Fatal("main VPC not found")
	}

	// Verify VPC configuration
	if cidr := mainVpc["cidr_block"]; cidr != "10.0.0.0/16" {
		t.Errorf("expected VPC CIDR block 10.0.0.0/16, got %v", cidr)
	}

	if enableDns := mainVpc["enable_dns_hostnames"]; enableDns != true {
		t.Errorf("expected enable_dns_hostnames to be true, got %v", enableDns)
	}

	if enableDnsSupport := mainVpc["enable_dns_support"]; enableDnsSupport != true {
		t.Errorf("expected enable_dns_support to be true, got %v", enableDnsSupport)
	}

	// Check tags
	tags, ok := mainVpc["tags"].(map[string]interface{})
	if !ok {
		t.Fatal("VPC tags not found")
	}

	if name := tags["Name"]; name != "test-webapp-vpc" {
		t.Errorf("expected VPC Name tag 'test-webapp-vpc', got %v", name)
	}

	if env := tags["Environment"]; env != "test" {
		t.Errorf("expected VPC Environment tag 'test', got %v", env)
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

	// Check we have 3 subnets (1 public, 2 private)
	if len(awsSubnet) != 3 {
		t.Errorf("expected 3 subnets, got %d", len(awsSubnet))
	}

	// Verify public subnet configuration
	publicSubnet, ok := awsSubnet["public"].(map[string]interface{})
	if !ok {
		t.Fatal("public subnet not found")
	}

	if cidr := publicSubnet["cidr_block"]; cidr != "10.0.1.0/24" {
		t.Errorf("expected public subnet CIDR 10.0.1.0/24, got %v", cidr)
	}

	if mapPublicIp := publicSubnet["map_public_ip_on_launch"]; mapPublicIp != true {
		t.Errorf("expected public subnet to map public IPs, got %v", mapPublicIp)
	}

	// Verify private subnet 1 configuration
	privateSubnet1, ok := awsSubnet["private_1"].(map[string]interface{})
	if !ok {
		t.Fatal("private_1 subnet not found")
	}

	if cidr := privateSubnet1["cidr_block"]; cidr != "10.0.2.0/24" {
		t.Errorf("expected private subnet 1 CIDR 10.0.2.0/24, got %v", cidr)
	}

	// Verify private subnet 2 configuration
	privateSubnet2, ok := awsSubnet["private_2"].(map[string]interface{})
	if !ok {
		t.Fatal("private_2 subnet not found")
	}

	if cidr := privateSubnet2["cidr_block"]; cidr != "10.0.3.0/24" {
		t.Errorf("expected private subnet 2 CIDR 10.0.3.0/24, got %v", cidr)
	}
}

func TestInternetGatewayConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	resources, _ := tfConfig["resource"].(map[string]interface{})

	// Check Internet Gateway exists
	awsIgw, ok := resources["aws_internet_gateway"].(map[string]interface{})
	if !ok {
		t.Fatal("no internet gateway resources found")
	}

	mainIgw, ok := awsIgw["main"].(map[string]interface{})
	if !ok {
		t.Fatal("main internet gateway not found")
	}

	if vpcId := mainIgw["vpc_id"]; vpcId != "${aws_vpc.main.id}" {
		t.Errorf("expected IGW vpc_id to reference VPC, got %v", vpcId)
	}

	// Check tags
	tags, ok := mainIgw["tags"].(map[string]interface{})
	if !ok {
		t.Fatal("IGW tags not found")
	}

	if name := tags["Name"]; name != "test-webapp-igw" {
		t.Errorf("expected IGW Name tag 'test-webapp-igw', got %v", name)
	}
}

func TestSecurityGroupConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	resources, _ := tfConfig["resource"].(map[string]interface{})

	// Check security groups exist
	awsSg, ok := resources["aws_security_group"].(map[string]interface{})
	if !ok {
		t.Fatal("no security group resources found")
	}

	// Check EC2 security group
	ec2Sg, ok := awsSg["ec2"].(map[string]interface{})
	if !ok {
		t.Fatal("ec2 security group not found")
	}

	if name := ec2Sg["name"]; name != "test-webapp-ec2-sg" {
		t.Errorf("expected EC2 security group name 'test-webapp-ec2-sg', got %v", name)
	}

	// Check SSH ingress rule
	ingress, ok := ec2Sg["ingress"].([]interface{})
	if !ok || len(ingress) == 0 {
		t.Fatal("EC2 security group ingress rules not found")
	}

	sshRule := ingress[0].(map[string]interface{})
	if port := sshRule["from_port"]; port != float64(22) {
		t.Errorf("expected SSH from_port 22, got %v", port)
	}

	if port := sshRule["to_port"]; port != float64(22) {
		t.Errorf("expected SSH to_port 22, got %v", port)
	}

	// Check RDS security group
	rdsSg, ok := awsSg["rds"].(map[string]interface{})
	if !ok {
		t.Fatal("rds security group not found")
	}

	if name := rdsSg["name"]; name != "test-webapp-rds-sg" {
		t.Errorf("expected RDS security group name 'test-webapp-rds-sg', got %v", name)
	}

	// Check MySQL ingress rule
	rdsIngress, ok := rdsSg["ingress"].([]interface{})
	if !ok || len(rdsIngress) == 0 {
		t.Fatal("RDS security group ingress rules not found")
	}

	mysqlRule := rdsIngress[0].(map[string]interface{})
	if port := mysqlRule["from_port"]; port != float64(3306) {
		t.Errorf("expected MySQL from_port 3306, got %v", port)
	}
}

func TestRouteTableConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	resources, _ := tfConfig["resource"].(map[string]interface{})

	// Check route table exists
	awsRouteTable, ok := resources["aws_route_table"].(map[string]interface{})
	if !ok {
		t.Fatal("no route table resources found")
	}

	publicRt, ok := awsRouteTable["public"].(map[string]interface{})
	if !ok {
		t.Fatal("public route table not found")
	}

	if vpcId := publicRt["vpc_id"]; vpcId != "${aws_vpc.main.id}" {
		t.Errorf("expected route table vpc_id to reference VPC, got %v", vpcId)
	}

	// Check route exists
	awsRoute, ok := resources["aws_route"].(map[string]interface{})
	if !ok {
		t.Fatal("no route resources found")
	}

	publicRoute, ok := awsRoute["public"].(map[string]interface{})
	if !ok {
		t.Fatal("public route not found")
	}

	if destination := publicRoute["destination_cidr_block"]; destination != "0.0.0.0/0" {
		t.Errorf("expected route destination 0.0.0.0/0, got %v", destination)
	}

	if gatewayId := publicRoute["gateway_id"]; gatewayId != "${aws_internet_gateway.main.id}" {
		t.Errorf("expected route gateway_id to reference IGW, got %v", gatewayId)
	}

	// Check route table association
	awsRtAssoc, ok := resources["aws_route_table_association"].(map[string]interface{})
	if !ok {
		t.Fatal("no route table association resources found")
	}

	if _, ok := awsRtAssoc["public"]; !ok {
		t.Fatal("public route table association not found")
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

	webServer, ok := awsInstance["web_server"].(map[string]interface{})
	if !ok {
		t.Fatal("web_server instance not found")
	}

	if instanceType := webServer["instance_type"]; instanceType != "t3.micro" {
		t.Errorf("expected instance type 't3.micro', got %v", instanceType)
	}

	if associatePublicIp := webServer["associate_public_ip_address"]; associatePublicIp != true {
		t.Errorf("expected associate_public_ip_address to be true, got %v", associatePublicIp)
	}

	if subnetId := webServer["subnet_id"]; subnetId != "${aws_subnet.public.id}" {
		t.Errorf("expected subnet_id to reference public subnet, got %v", subnetId)
	}

	// Check tags
	tags, ok := webServer["tags"].(map[string]interface{})
	if !ok {
		t.Fatal("EC2 instance tags not found")
	}

	if name := tags["Name"]; name != "test-webapp-web-server" {
		t.Errorf("expected EC2 Name tag 'test-webapp-web-server', got %v", name)
	}

	if role := tags["Role"]; role != "WebServer" {
		t.Errorf("expected EC2 Role tag 'WebServer', got %v", role)
	}

	// Check user data is present
	if userData := webServer["user_data"]; userData == nil {
		t.Error("expected user_data to be present")
	}
}

func TestRDSConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	resources, _ := tfConfig["resource"].(map[string]interface{})

	// Check RDS instance exists
	awsDbInstance, ok := resources["aws_db_instance"].(map[string]interface{})
	if !ok {
		t.Fatal("no RDS instance resources found")
	}

	mainDb, ok := awsDbInstance["main"].(map[string]interface{})
	if !ok {
		t.Fatal("main RDS instance not found")
	}

	if engine := mainDb["engine"]; engine != "mysql" {
		t.Errorf("expected RDS engine 'mysql', got %v", engine)
	}

	if engineVersion := mainDb["engine_version"]; engineVersion != "8.0" {
		t.Errorf("expected RDS engine version '8.0', got %v", engineVersion)
	}

	if instanceClass := mainDb["instance_class"]; instanceClass != "db.t3.micro" {
		t.Errorf("expected RDS instance class 'db.t3.micro', got %v", instanceClass)
	}

	if dbName := mainDb["db_name"]; dbName != "webapp" {
		t.Errorf("expected RDS db_name 'webapp', got %v", dbName)
	}

	if username := mainDb["username"]; username != "testuser" {
		t.Errorf("expected RDS username 'testuser', got %v", username)
	}

	if storageEncrypted := mainDb["storage_encrypted"]; storageEncrypted != true {
		t.Errorf("expected RDS storage_encrypted to be true, got %v", storageEncrypted)
	}

	// Check DB subnet group exists
	awsDbSubnetGroup, ok := resources["aws_db_subnet_group"].(map[string]interface{})
	if !ok {
		t.Fatal("no DB subnet group resources found")
	}

	mainSubnetGroup, ok := awsDbSubnetGroup["main"].(map[string]interface{})
	if !ok {
		t.Fatal("main DB subnet group not found")
	}

	subnetIds, ok := mainSubnetGroup["subnet_ids"].([]interface{})
	if !ok || len(subnetIds) != 2 {
		t.Errorf("expected 2 subnet IDs in DB subnet group, got %v", subnetIds)
	}

	// Check DB parameter group exists
	awsDbParamGroup, ok := resources["aws_db_parameter_group"].(map[string]interface{})
	if !ok {
		t.Fatal("no DB parameter group resources found")
	}

	mainParamGroup, ok := awsDbParamGroup["main"].(map[string]interface{})
	if !ok {
		t.Fatal("main DB parameter group not found")
	}

	if family := mainParamGroup["family"]; family != "mysql8.0" {
		t.Errorf("expected DB parameter group family 'mysql8.0', got %v", family)
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

	terraformState, ok := awsS3["terraform_state"].(map[string]interface{})
	if !ok {
		t.Fatal("terraform_state bucket not found")
	}

	if bucket := terraformState["bucket"]; bucket != "test-webapp-terraform-state-test" {
		t.Errorf("expected bucket name 'test-webapp-terraform-state-test', got %v", bucket)
	}

	// Check bucket versioning
	awsS3Versioning, ok := resources["aws_s3_bucket_versioning"].(map[string]interface{})
	if !ok {
		t.Fatal("S3 versioning configuration not found")
	}

	versioning, ok := awsS3Versioning["terraform_state"].(map[string]interface{})
	if !ok {
		t.Fatal("terraform_state versioning configuration not found")
	}

	versioningConfig, ok := versioning["versioning_configuration"].(map[string]interface{})
	if !ok {
		t.Fatal("versioning configuration not found")
	}

	if status := versioningConfig["status"]; status != "Enabled" {
		t.Errorf("expected versioning status 'Enabled', got %v", status)
	}

	// Check encryption configuration
	awsS3Encryption, ok := resources["aws_s3_bucket_server_side_encryption_configuration"].(map[string]interface{})
	if !ok {
		t.Fatal("S3 encryption configuration not found")
	}

	encryption, ok := awsS3Encryption["terraform_state"].(map[string]interface{})
	if !ok {
		t.Fatal("terraform_state encryption configuration not found")
	}

	rules, ok := encryption["rule"].([]interface{})
	if !ok || len(rules) == 0 {
		t.Fatal("encryption rules not found")
	}

	rule := rules[0].(map[string]interface{})
	defaultConfig, ok := rule["apply_server_side_encryption_by_default"].(map[string]interface{})
	if !ok {
		t.Fatal("default encryption configuration not found")
	}

	if algorithm := defaultConfig["sse_algorithm"]; algorithm != "AES256" {
		t.Errorf("expected encryption algorithm 'AES256', got %v", algorithm)
	}

	// Check public access block
	awsS3Pab, ok := resources["aws_s3_bucket_public_access_block"].(map[string]interface{})
	if !ok {
		t.Fatal("S3 public access block not found")
	}

	pab, ok := awsS3Pab["terraform_state"].(map[string]interface{})
	if !ok {
		t.Fatal("terraform_state public access block configuration not found")
	}

	if block := pab["block_public_acls"]; block != true {
		t.Errorf("expected block_public_acls to be true, got %v", block)
	}

	if block := pab["block_public_policy"]; block != true {
		t.Errorf("expected block_public_policy to be true, got %v", block)
	}
}

func TestDataSourcesConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	// Check data sources exist
	dataSources, ok := tfConfig["data"].(map[string]interface{})
	if !ok {
		t.Fatal("no data sources found")
	}

	// Check availability zones data source
	awsAz, ok := dataSources["aws_availability_zones"].(map[string]interface{})
	if !ok {
		t.Fatal("aws_availability_zones data source not found")
	}

	available, ok := awsAz["available"].(map[string]interface{})
	if !ok {
		t.Fatal("available availability zones data source not found")
	}

	if state := available["state"]; state != "available" {
		t.Errorf("expected availability zones state 'available', got %v", state)
	}

	// Check AMI data source
	awsAmi, ok := dataSources["aws_ami"].(map[string]interface{})
	if !ok {
		t.Fatal("aws_ami data source not found")
	}

	amazonLinux, ok := awsAmi["amazon_linux"].(map[string]interface{})
	if !ok {
		t.Fatal("amazon_linux AMI data source not found")
	}

	if mostRecent := amazonLinux["most_recent"]; mostRecent != true {
		t.Errorf("expected most_recent to be true, got %v", mostRecent)
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

	awsProvider, ok := provider["aws"].(map[string]interface{})
	if !ok {
		t.Fatal("AWS provider not configured")
	}

	if region := awsProvider["region"]; region != "us-west-2" {
		t.Errorf("expected AWS region 'us-west-2', got %v", region)
	}

	// Check default tags
	defaultTags, ok := awsProvider["default_tags"].(map[string]interface{})
	if !ok {
		t.Fatal("default tags not configured")
	}

	tags, ok := defaultTags["tags"].(map[string]interface{})
	if !ok {
		t.Fatal("tags not found in default_tags")
	}

	if env := tags["Environment"]; env != "test" {
		t.Errorf("expected default Environment tag 'test', got %v", env)
	}

	if managedBy := tags["ManagedBy"]; managedBy != "CDKTF" {
		t.Errorf("expected default ManagedBy tag 'CDKTF', got %v", managedBy)
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
		"ec2_instance_id",
		"ec2_public_ip",
		"ec2_public_dns",
		"rds_endpoint",
		"rds_port",
		"s3_state_bucket",
		"database_name",
		"ssh_command",
	}

	for _, outputName := range requiredOutputs {
		if _, ok := outputs[outputName]; !ok {
			t.Errorf("required output '%s' not found", outputName)
		}
	}

	// Check specific output configurations
	vpcIdOutput := outputs["vpc_id"].(map[string]interface{})
	if value := vpcIdOutput["value"]; value != "${aws_vpc.main.id}" {
		t.Errorf("expected vpc_id output value '${aws_vpc.main.id}', got %v", value)
	}

	instanceIdOutput := outputs["ec2_instance_id"].(map[string]interface{})
	if value := instanceIdOutput["value"]; value != "${aws_instance.web_server.id}" {
		t.Errorf("expected ec2_instance_id output value '${aws_instance.web_server.id}', got %v", value)
	}
}

func TestBackendConfiguration(t *testing.T) {
	tfPath := synthStack(t, "TapStack")
	tfConfig := loadTerraformJSON(t, tfPath)

	// Check backend configuration
	terraform, ok := tfConfig["terraform"].(map[string]interface{})
	if !ok {
		t.Fatal("terraform configuration not found")
	}

	backend, ok := terraform["backend"].(map[string]interface{})
	if !ok {
		t.Fatal("backend configuration not found")
	}

	s3Backend, ok := backend["s3"].(map[string]interface{})
	if !ok {
		t.Fatal("S3 backend configuration not found")
	}

	if bucket := s3Backend["bucket"]; bucket != "test-bucket" {
		t.Errorf("expected backend bucket 'test-bucket', got %v", bucket)
	}

	if key := s3Backend["key"]; key != "prs/test/terraform.tfstate" {
		t.Errorf("expected backend key 'prs/test/terraform.tfstate', got %v", key)
	}

	if region := s3Backend["region"]; region != "us-east-1" {
		t.Errorf("expected backend region 'us-east-1', got %v", region)
	}

	if encrypt := s3Backend["encrypt"]; encrypt != true {
		t.Errorf("expected backend encrypt to be true, got %v", encrypt)
	}
}
