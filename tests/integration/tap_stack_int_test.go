package tests

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
)

// TestSnapshot creates a snapshot of the synthesized CloudFormation template
// and validates the presence and properties of key resources without external dependencies.
func TestSnapshot(t *testing.T) {
	// GIVEN
	app := awscdk.NewApp(nil)
	stack := lib.NewTapStack(app, jsii.String("TestStack"), &lib.TapStackProps{
		StackProps: &awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String("123456789012"),
				Region:  jsii.String("us-east-1"),
			},
		},
		AllowedSSHIP:    jsii.String("10.0.0.0/32"),
		EC2InstanceType: jsii.String("t2.micro"),
		EC2KeyName:      jsii.String("test-key"),
		DBInstanceClass: jsii.String("t3.small"),
		DBUsername:      jsii.String("testuser"),
		DBPassword:      jsii.String("testpassword"),
	})

	// WHEN
	template := assertions.Template_FromStack(stack.Stack, nil)
	templateJson := template.ToJSON()

	// THEN
	// Convert the map to a JSON string
	jsonBytes, err := json.Marshal(templateJson)
	if err != nil {
		t.Fatalf("failed to marshal template to JSON: %v", err)
	}

	// Unmarshal the JSON into a map for inspection
	var parsedTemplate map[string]interface{}
	if err := json.Unmarshal(jsonBytes, &parsedTemplate); err != nil {
		t.Fatalf("failed to unmarshal template JSON: %v", err)
	}

	resources, ok := parsedTemplate["Resources"].(map[string]interface{})
	if !ok {
		t.Fatal("Template does not contain 'Resources' section")
	}

	// Helper function to find a resource by its logical ID prefix
	findResource := func(prefix string) (map[string]interface{}, bool) {
		for key, val := range resources {
			if strings.HasPrefix(key, prefix) {
				if resource, ok := val.(map[string]interface{}); ok {
					return resource, true
				}
			}
		}
		return nil, false
	}

	// Check if the template has a VPC
	if _, ok := findResource("cfvpc"); !ok {
		t.Error("Snapshot does not contain a VPC")
	}

	// Check if the template has an S3 bucket
	if _, ok := findResource("cfassetsbucket"); !ok {
		t.Error("Snapshot does not contain an S3 bucket")
	}

	// Check if the template has an RDS instance
	rdsResource, ok := findResource("cfrdsmysql")
	if !ok {
		t.Error("Snapshot does not contain an RDS instance")
	}

	// Check if the template has an EC2 instance
	if _, ok := findResource("cfwebserver"); !ok {
		t.Error("Snapshot does not contain an EC2 instance")
	}

	// Check for unique naming in RDS instance and CloudWatch alarm
	if props, ok := rdsResource["Properties"].(map[string]interface{}); ok {
		if rdsIdentifier, ok := props["DBInstanceIdentifier"].(string); ok {
			if rdsIdentifier != "cf-rds-mysql-dev" {
				t.Errorf("Expected RDS identifier to be 'cf-rds-mysql-dev', but got %s", rdsIdentifier)
			}
		} else {
			t.Error("RDS instance properties do not contain 'DBInstanceIdentifier'")
		}
	} else {
		t.Error("RDS resource does not have 'Properties'")
	}

	alarmResource, ok := findResource("cfrdscpu")
	if !ok {
		t.Error("Snapshot does not contain a CloudWatch Alarm")
	}
	if props, ok := alarmResource["Properties"].(map[string]interface{}); ok {
		if alarmName, ok := props["AlarmName"].(string); ok {
			if alarmName != "cf-rds-high-cpu-dev" {
				t.Errorf("Expected Alarm name to be 'cf-rds-high-cpu-dev', but got %s", alarmName)
			}
		} else {
			t.Error("CloudWatch Alarm properties do not contain 'AlarmName'")
		}
	} else {
		t.Error("CloudWatch Alarm resource does not have 'Properties'")
	}
}
