//go:build !integration
// +build !integration

package lib_test

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"
)

// synthStack synthesizes the stack to a temp outdir and returns the cdk json path
func synthStack(t *testing.T, stackId string) string {
	t.Helper()

	// Force a clean output location per test
	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdk.out")

	app := awscdk.NewApp(&awscdk.AppProps{Outdir: jsii.String(outdir)})
	lib.NewTapStack(app, jsii.String(stackId), &lib.TapStackProps{
		StackProps: &awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String("123456789012"),
				Region:  jsii.String("us-east-1"),
			},
		},
		AllowedSSHIP:    jsii.String("10.0.0.0/32"),
		EC2InstanceType: jsii.String("t2.micro"),
	})
	assembly := app.Synth(nil)
	stack := assembly.GetStackByName(&stackId)
	template := stack.Template()
	templateJson, err := json.Marshal(template)
	if err != nil {
		t.Fatalf("failed to marshal template to json: %v", err)
	}

	jsonPath := filepath.Join(outdir, "template.json")
	err = os.WriteFile(jsonPath, templateJson, 0644)
	if err != nil {
		t.Fatalf("failed to write template to file: %v", err)
	}

	return jsonPath
}

// loadCloudFormationJSON loads and parses the synthesized CloudFormation JSON
func loadCloudFormationJSON(t *testing.T, path string) map[string]interface{} {
	t.Helper()

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read cloudformation json: %v", err)
	}

	var cfConfig map[string]interface{}
	if err := json.Unmarshal(data, &cfConfig); err != nil {
		t.Fatalf("failed to parse cloudformation json: %v", err)
	}

	return cfConfig
}

func TestStackSynthesis(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")

	if _, err := os.Stat(jsonPath); err != nil {
		t.Errorf("Stack synthesis failed: cloudformation json not found at %s", jsonPath)
	}
}

func TestVPCConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources, ok := cfConfig["Resources"].(map[string]interface{})
	if !ok {
		t.Fatal("no resources found in cloudformation config")
	}

	var vpc map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::EC2::VPC" {
			vpc = res
			break
		}
	}

	if vpc == nil {
		t.Fatal("no VPC resource found")
	}

	properties, ok := vpc["Properties"].(map[string]interface{})
	if !ok {
		t.Fatal("VPC properties not found")
	}

	if cidr := properties["CidrBlock"]; cidr != "10.0.0.0/16" {
		t.Errorf("expected VPC CIDR block 10.0.0.0/16, got %v", cidr)
	}

	if enableDns := properties["EnableDnsHostnames"]; enableDns != true {
		t.Errorf("expected enable_dns_hostnames to be true, got %v", enableDns)
	}
}

func TestSubnetsConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources, _ := cfConfig["Resources"].(map[string]interface{})
	var subnets []map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::EC2::Subnet" {
			subnets = append(subnets, res)
		}
	}

	if len(subnets) != 4 {
		t.Errorf("expected 4 subnets, got %d", len(subnets))
	}
}

func TestSecurityGroupConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources, _ := cfConfig["Resources"].(map[string]interface{})
	var ec2Sg map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::EC2::SecurityGroup" {
			properties, _ := res["Properties"].(map[string]interface{})
			if properties["GroupDescription"] == "Security group for EC2 web server" {
				ec2Sg = res
				break
			}
		}
	}

	if ec2Sg == nil {
		t.Fatal("EC2 security group not found")
	}

	properties, _ := ec2Sg["Properties"].(map[string]interface{})
	ingress, _ := properties["SecurityGroupIngress"].([]interface{})
	if len(ingress) != 3 {
		t.Errorf("expected 3 ingress rules, got %d", len(ingress))
	}
}

func TestS3BucketConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources, _ := cfConfig["Resources"].(map[string]interface{})
	var buckets []map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::S3::Bucket" {
			buckets = append(buckets, res)
		}
	}

	if len(buckets) != 2 {
		t.Errorf("expected 2 S3 buckets, got %d", len(buckets))
	}
}

func TestIAMConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources, _ := cfConfig["Resources"].(map[string]interface{})
	var role map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::IAM::Role" {
			properties, _ := res["Properties"].(map[string]interface{})
			if properties["RoleName"] == "cf-ec2-role" {
				role = res
				break
			}
		}
	}

	if role == nil {
		t.Fatal("IAM role not found")
	}
}

func TestEC2InstanceConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources, _ := cfConfig["Resources"].(map[string]interface{})
	var instance map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::EC2::Instance" {
			instance = res
			break
		}
	}

	if instance == nil {
		t.Fatal("EC2 instance not found")
	}

	properties, _ := instance["Properties"].(map[string]interface{})
	if instanceType := properties["InstanceType"]; instanceType != "t2.micro" {
		t.Errorf("expected instance type t2.micro, got %v", instanceType)
	}
}

func TestRDSInstanceConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources, _ := cfConfig["Resources"].(map[string]interface{})
	var rds map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::RDS::DBInstance" {
			rds = res
			break
		}
	}

	if rds == nil {
		t.Fatal("RDS instance not found")
	}

	properties, _ := rds["Properties"].(map[string]interface{})
	if dbClass := properties["DBInstanceClass"]; dbClass != "db.t3.small" {
		t.Errorf("expected DB instance class db.t3.small, got %v", dbClass)
	}
}

func TestCloudWatchAlarmConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources, _ := cfConfig["Resources"].(map[string]interface{})
	var alarm map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::CloudWatch::Alarm" {
			alarm = res
			break
		}
	}

	if alarm == nil {
		t.Fatal("CloudWatch alarm not found")
	}

	properties, _ := alarm["Properties"].(map[string]interface{})
	if threshold := properties["Threshold"]; threshold != float64(75) {
		t.Errorf("expected threshold 75, got %v", threshold)
	}
}
