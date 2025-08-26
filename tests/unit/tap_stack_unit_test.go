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
		DBInstanceClass: jsii.String("t3.small"),
		DBUsername:      jsii.String("testuser"),
		DBPassword:      jsii.String("testpassword"),
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
	jsonPath := synthStack(t, "TapStack")

	if _, err := os.Stat(jsonPath); err != nil {
		t.Errorf("Stack synthesis failed: cloudformation json not found at %s", jsonPath)
	}
}

func TestVPCConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TapStack")
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
