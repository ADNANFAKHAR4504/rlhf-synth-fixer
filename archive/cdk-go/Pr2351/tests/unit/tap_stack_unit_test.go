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
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// synthStack synthesizes the stack to a temp outdir and returns the cdk json path
func synthStack(t *testing.T, stackId string) string {
	t.Helper()

	tmpDir := t.TempDir()
	outdir := filepath.Join(tmpDir, "cdk.out")

	app := awscdk.NewApp(&awscdk.AppProps{Outdir: jsii.String(outdir)})
	lib.NewTapStack(app, stackId, &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String("123456789012"),
				Region:  jsii.String("us-east-1"),
			},
		},
	})
	assembly := app.Synth(nil)
	stacks := *assembly.Stacks()
	require.Len(t, stacks, 1, "expected exactly one stack to be synthesized")
	stack := stacks[0]
	template := stack.Template()
	templateJson, err := json.Marshal(template)
	require.NoError(t, err, "failed to marshal template to json")

	jsonPath := filepath.Join(outdir, "template.json")
	err = os.WriteFile(jsonPath, templateJson, 0644)
	require.NoError(t, err, "failed to write template to file")

	return jsonPath
}

// loadCloudFormationJSON loads and parses the synthesized CloudFormation JSON
func loadCloudFormationJSON(t *testing.T, path string) map[string]interface{} {
	t.Helper()

	data, err := os.ReadFile(path)
	require.NoError(t, err, "failed to read cloudformation json")

	var cfConfig map[string]interface{}
	err = json.Unmarshal(data, &cfConfig)
	require.NoError(t, err, "failed to parse cloudformation json")

	return cfConfig
}

func TestStackSynthesis(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	_, err := os.Stat(jsonPath)
	assert.NoError(t, err, "Stack synthesis failed: cloudformation json not found")
}

func TestVPCConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources := cfConfig["Resources"].(map[string]interface{})
	var vpc map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::EC2::VPC" {
			vpc = res
			break
		}
	}
	require.NotNil(t, vpc, "no VPC resource found")

	properties := vpc["Properties"].(map[string]interface{})
	assert.Equal(t, true, properties["EnableDnsHostnames"], "expected EnableDnsHostnames to be true")
	assert.Equal(t, true, properties["EnableDnsSupport"], "expected EnableDnsSupport to be true")
}

func TestSubnetsConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources := cfConfig["Resources"].(map[string]interface{})
	var subnets []map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::EC2::Subnet" {
			subnets = append(subnets, res)
		}
	}
	assert.Len(t, subnets, 4, "expected 4 subnets")
}

func TestSecurityGroupConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources := cfConfig["Resources"].(map[string]interface{})
	var ec2Sg map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::EC2::SecurityGroup" {
			properties := res["Properties"].(map[string]interface{})
			if properties["GroupDescription"] == "Security group for web server - HTTPS only" {
				ec2Sg = res
				break
			}
		}
	}
	require.NotNil(t, ec2Sg, "EC2 security group not found")

	properties := ec2Sg["Properties"].(map[string]interface{})
	ingress := properties["SecurityGroupIngress"].([]interface{})
	assert.Len(t, ingress, 1, "expected 1 ingress rule for web server SG")
}

func TestS3BucketConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources := cfConfig["Resources"].(map[string]interface{})
	var buckets []map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::S3::Bucket" {
			buckets = append(buckets, res)
		}
	}
	assert.Len(t, buckets, 0, "expected 0 S3 buckets as CloudTrail is disabled")
}

func TestCloudTrailConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources := cfConfig["Resources"].(map[string]interface{})
	var trail map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::CloudTrail::Trail" {
			trail = res
			break
		}
	}
	assert.Nil(t, trail, "expected no CloudTrail resource to be created")
}

func TestIAMConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources := cfConfig["Resources"].(map[string]interface{})
	var roleCount int
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::IAM::Role" {
			roleCount++
		}
	}
	assert.True(t, roleCount > 0, "expected at least one IAM role")
}

func TestEC2InstanceConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources := cfConfig["Resources"].(map[string]interface{})
	var instance map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::EC2::Instance" {
			instance = res
			break
		}
	}
	require.NotNil(t, instance, "EC2 instance not found")

	properties := instance["Properties"].(map[string]interface{})
	assert.Equal(t, "t3.micro", properties["InstanceType"], "expected instance type t3.micro")
}

func TestRDSInstanceConfiguration(t *testing.T) {
	jsonPath := synthStack(t, "TestStack")
	cfConfig := loadCloudFormationJSON(t, jsonPath)

	resources := cfConfig["Resources"].(map[string]interface{})
	var rds map[string]interface{}
	for _, resource := range resources {
		res := resource.(map[string]interface{})
		if res["Type"] == "AWS::RDS::DBInstance" {
			rds = res
			break
		}
	}
	require.NotNil(t, rds, "RDS instance not found")

	properties := rds["Properties"].(map[string]interface{})
	assert.Equal(t, true, properties["StorageEncrypted"], "expected RDS storage to be encrypted")
	assert.Equal(t, "db.t3.micro", properties["DBInstanceClass"], "expected DB instance class db.t3.micro")
}
