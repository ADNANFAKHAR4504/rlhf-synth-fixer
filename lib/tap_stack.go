package main

import (
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	// "archive/zip"
	// "bytes"
	// "crypto/sha256"
	// "encoding/base64"
	// "fmt"
	// "os"
	// "path/filepath"

	// jsii "github.com/aws/jsii-runtime-go"
	// cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"

	// Force jsii subpackages into module graph for CI (since .gen is ignored by go mod tidy)
	// _ "github.com/aws/constructs-go/constructs/v10/jsii"
	// _ "github.com/hashicorp/terraform-cdk-go/cdktf/jsii"
	// logs "github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatchloggroup"
	// iampolicy "github.com/TuringGpt/iac-test-automations/.gen/aws/iampolicy"
	// s3 "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucket"
	// s3notif "github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketnotification"
)

// Minimal CDKTF app entrypoint.
// We avoid committing go.mod; CI initializes it and runs `go mod tidy`.
// func main() {
// 	app := cdktf.NewApp(nil)

// 	// Create an empty stack to allow synthesis to succeed
// 	_ = cdktf.NewTerraformStack(app, str("TapStack"))

// 	app.Synth()
// }

// func str(v string) *string { return &v }

// TapStackConfig holds configuration for the TAP stack
type TapStackConfig struct {
	ProjectName        string
	VPCCidr           string
	PublicSubnet1Cidr  string
	PublicSubnet2Cidr  string
	PrivateSubnet1Cidr string
	PrivateSubnet2Cidr string
}

// TapStack represents the main infrastructure stack
type TapStack struct {
	cdktf.TerraformStack
	Infrastructure *SecurityInfrastructure
}

// NewTapStack creates a new TAP stack with security-focused infrastructure
func NewTapStack(scope constructs.Construct, id string, config *TapStackConfig) *TapStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// Configure AWS Provider for us-west-2 region
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String("us-west-2"),
	})

	// Initialize infrastructure struct
	infrastructure := &SecurityInfrastructure{}

	// Create KMS Keys
	infrastructure.S3KMSKey, infrastructure.RDSKMSKey = CreateKMSKeys(stack, config.ProjectName)

	// Create IAM Roles with AWS Managed Policies
	infrastructure.LambdaRole, infrastructure.CloudTrailRole = CreateIAMRoles(stack, config.ProjectName)

	// Create S3 Buckets with KMS encryption and private access
	infrastructure.MainBucket, infrastructure.LogBucket, infrastructure.CloudTrailBucket = CreateS3Buckets(
		stack, 
		config.ProjectName, 
		infrastructure.S3KMSKey,
	)

	// Create VPC with public and private subnets across 2 AZs
	infrastructure.VPC, 
	infrastructure.PublicSubnet1, 
	infrastructure.PublicSubnet2, 
	infrastructure.PrivateSubnet1, 
	infrastructure.PrivateSubnet2, 
	infrastructure.InternetGateway, 
	infrastructure.NATGateway1, 
	infrastructure.NATGateway2 = CreateVPC(
		stack,
		config.ProjectName,
		config.VPCCidr,
		config.PublicSubnet1Cidr,
		config.PublicSubnet2Cidr,
		config.PrivateSubnet1Cidr,
		config.PrivateSubnet2Cidr,
	)

	// Create Security Groups
	infrastructure.LambdaSG, infrastructure.RDSSSG = CreateSecurityGroups(
		stack, 
		config.ProjectName, 
		infrastructure.VPC.Id(),
	)

	// Create RDS Instance with KMS encryption
	infrastructure.RDSInstance = CreateRDS(
		stack,
		config.ProjectName,
		infrastructure.PrivateSubnet1,
		infrastructure.PrivateSubnet2,
		infrastructure.RDSSSG,
		infrastructure.RDSKMSKey,
	)

	// Create Lambda Function with CloudWatch logging
	infrastructure.LambdaFunction = CreateLambda(
		stack,
		config.ProjectName,
		infrastructure.LambdaRole,
		infrastructure.LambdaSG,
		infrastructure.PrivateSubnet1,
		infrastructure.PrivateSubnet2,
	)

	// Create CloudTrail with multi-region logging
	infrastructure.CloudTrail = CreateCloudTrail(
		stack,
		config.ProjectName,
		infrastructure.CloudTrailBucket,
		infrastructure.S3KMSKey,
	)

	// Create stack outputs
	createOutputs(stack, config.ProjectName, infrastructure)

	return &TapStack{
		TerraformStack: stack,
		Infrastructure: infrastructure,
	}
}

// createOutputs creates Terraform outputs for important resource identifiers
func createOutputs(stack cdktf.TerraformStack, projectName string, infra *SecurityInfrastructure) {
	// VPC Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("vpc_id"), &cdktf.TerraformOutputConfig{
		Value:       infra.VPC.Id(),
		Description: jsii.String("ID of the VPC"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("public_subnet_1_id"), &cdktf.TerraformOutputConfig{
		Value:       infra.PublicSubnet1.Id(),
		Description: jsii.String("ID of the first public subnet"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("public_subnet_2_id"), &cdktf.TerraformOutputConfig{
		Value:       infra.PublicSubnet2.Id(),
		Description: jsii.String("ID of the second public subnet"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("private_subnet_1_id"), &cdktf.TerraformOutputConfig{
		Value:       infra.PrivateSubnet1.Id(),
		Description: jsii.String("ID of the first private subnet"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("private_subnet_2_id"), &cdktf.TerraformOutputConfig{
		Value:       infra.PrivateSubnet2.Id(),
		Description: jsii.String("ID of the second private subnet"),
	})

	// S3 Bucket Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("main_bucket_name"), &cdktf.TerraformOutputConfig{
		Value:       infra.MainBucket.Id(),
		Description: jsii.String("Name of the main S3 bucket"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("log_bucket_name"), &cdktf.TerraformOutputConfig{
		Value:       infra.LogBucket.Id(),
		Description: jsii.String("Name of the log S3 bucket"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_bucket_name"), &cdktf.TerraformOutputConfig{
		Value:       infra.CloudTrailBucket.Id(),
		Description: jsii.String("Name of the CloudTrail S3 bucket"),
	})

	// IAM Role Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("lambda_role_arn"), &cdktf.TerraformOutputConfig{
		Value:       infra.LambdaRole.Arn(),
		Description: jsii.String("ARN of the Lambda execution role"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_role_arn"), &cdktf.TerraformOutputConfig{
		Value:       infra.CloudTrailRole.Arn(),
		Description: jsii.String("ARN of the CloudTrail service role"),
	})

	// RDS Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("rds_endpoint"), &cdktf.TerraformOutputConfig{
		Value:       infra.RDSInstance.Endpoint(),
		Description: jsii.String("RDS instance endpoint"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_port"), &cdktf.TerraformOutputConfig{
		Value:       infra.RDSInstance.Port(),
		Description: jsii.String("RDS instance port"),
	})

	// Lambda Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("lambda_function_name"), &cdktf.TerraformOutputConfig{
		Value:       infra.LambdaFunction.FunctionName(),
		Description: jsii.String("Name of the Lambda function"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("lambda_function_arn"), &cdktf.TerraformOutputConfig{
		Value:       infra.LambdaFunction.Arn(),
		Description: jsii.String("ARN of the Lambda function"),
	})

	// CloudTrail Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_arn"), &cdktf.TerraformOutputConfig{
		Value:       infra.CloudTrail.Arn(),
		Description: jsii.String("ARN of the CloudTrail"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_name"), &cdktf.TerraformOutputConfig{
		Value:       infra.CloudTrail.Name(),
		Description: jsii.String("Name of the CloudTrail"),
	})

	// KMS Key Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("s3_kms_key_id"), &cdktf.TerraformOutputConfig{
		Value:       infra.S3KMSKey.KeyId(),
		Description: jsii.String("ID of the S3 KMS key"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_kms_key_arn"), &cdktf.TerraformOutputConfig{
		Value:       infra.S3KMSKey.Arn(),
		Description: jsii.String("ARN of the S3 KMS key"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_kms_key_id"), &cdktf.TerraformOutputConfig{
		Value:       infra.RDSKMSKey.KeyId(),
		Description: jsii.String("ID of the RDS KMS key"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_kms_key_arn"), &cdktf.TerraformOutputConfig{
		Value:       infra.RDSKMSKey.Arn(),
		Description: jsii.String("ARN of the RDS KMS key"),
	})

	// Security Group Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("lambda_security_group_id"), &cdktf.TerraformOutputConfig{
		Value:       infra.LambdaSG.Id(),
		Description: jsii.String("ID of the Lambda security group"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_security_group_id"), &cdktf.TerraformOutputConfig{
		Value:       infra.RDSSSG.Id(),
		Description: jsii.String("ID of the RDS security group"),
	})
}

// Main function to demonstrate usage
func main() {
	app := cdktf.NewApp(nil)

	// Configuration for the stack
	config := &TapStackConfig{
		ProjectName:        "security-project",
		VPCCidr:           "10.0.0.0/16",
		PublicSubnet1Cidr:  "10.0.1.0/24",
		PublicSubnet2Cidr:  "10.0.2.0/24",
		PrivateSubnet1Cidr: "10.0.10.0/24",
		PrivateSubnet2Cidr: "10.0.20.0/24",
	}

}