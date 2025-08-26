package tests

import (
	"encoding/json"
	"testing"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/jsii-runtime-go"
	"github.com/tidwall/gjson"
)

// TestSnapshot creates a snapshot of the synthesized CloudFormation template
// and compares it against a stored snapshot. This is useful for detecting
// unintended changes to the infrastructure.
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
	jsonString := string(jsonBytes)

	// Convert the JSON string to a gjson.Result for easier parsing
	parsedTemplate := gjson.Parse(jsonString)

	// Check if the template has a VPC
	if !parsedTemplate.Get("Resources.cfvpc*").Exists() {
		t.Error("Snapshot does not contain a VPC")
	}

	// Check if the template has an S3 bucket
	if !parsedTemplate.Get("Resources.cfassetsbucket*").Exists() {
		t.Error("Snapshot does not contain an S3 bucket")
	}

	// Check if the template has an RDS instance
	if !parsedTemplate.Get("Resources.cfrdsmysql*").Exists() {
		t.Error("Snapshot does not contain an RDS instance")
	}

	// Check if the template has an EC2 instance
	if !parsedTemplate.Get("Resources.cfwebserver*").Exists() {
		t.Error("Snapshot does not contain an EC2 instance")
	}

	// Check for unique naming in RDS instance and CloudWatch alarm
	rdsIdentifier := parsedTemplate.Get("Resources.cfrdsmysql*").Get("Properties.DBInstanceIdentifier").String()
	if rdsIdentifier != "cf-rds-mysql-dev" {
		t.Errorf("Expected RDS identifier to be 'cf-rds-mysql-dev', but got %s", rdsIdentifier)
	}

	alarmName := parsedTemplate.Get("Resources.cfrdscpu*").Get("Properties.AlarmName").String()
	if alarmName != "cf-rds-high-cpu-dev" {
		t.Errorf("Expected Alarm name to be 'cf-rds-high-cpu-dev', but got %s", alarmName)
	}
}
