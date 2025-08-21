package main

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"

	jsii "github.com/aws/jsii-runtime-go"
	cdktf "github.com/hashicorp/terraform-cdk-go/cdktf"

	logs "github.com/TuringGpt/iac-test-automations/aws/cloudwatchloggroup"
	iampolicy "github.com/TuringGpt/iac-test-automations/aws/iampolicy"
	iamrole "github.com/TuringGpt/iac-test-automations/aws/iamrole"
	iampolattach "github.com/TuringGpt/iac-test-automations/aws/iamrolepolicyattachment"
	lambda "github.com/TuringGpt/iac-test-automations/aws/lambdafunction"
	lambdaperm "github.com/TuringGpt/iac-test-automations/aws/lambdapermission"
	awscdktf "github.com/TuringGpt/iac-test-automations/aws/provider"
	s3 "github.com/TuringGpt/iac-test-automations/aws/s3bucket"
	s3notif "github.com/TuringGpt/iac-test-automations/aws/s3bucketnotification"
	s3pab "github.com/TuringGpt/iac-test-automations/aws/s3bucketpublicaccessblock"
	s3enc "github.com/TuringGpt/iac-test-automations/aws/s3bucketserversideencryptionconfiguration"
	s3ver "github.com/TuringGpt/iac-test-automations/aws/s3bucketversioning"
)

// BuildApp constructs the CDKTF app and stack with the serverless image processing stack (no VPC).
func BuildApp() cdktf.App {
	app := cdktf.NewApp(nil)
	stack := cdktf.NewTerraformStack(app, str("TapStack"))

	// Region via env (defaults used in stack builder if empty)
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}

	// Build serverless resources on this stack (defined in serverless_stack.go)
	BuildServerlessImageStack(stack, region)

	return app
}

// Minimal CDKTF app entrypoint.
// We avoid committing go.mod; CI initializes it and runs `go mod tidy`.
func main() {
	app := BuildApp()
	app.Synth()
}

func str(v string) *string { return &v }

// BuildServerlessImageStack provisions an S3 + Lambda solution with S3 event notifications, no VPC.
func BuildServerlessImageStack(stack cdktf.TerraformStack, region string) {
	// Provider
	awscdktf.NewAwsProvider(stack, str("aws"), &awscdktf.AwsProviderConfig{Region: &region})

	// S3 bucket
	bucket := s3.NewS3Bucket(stack, str("ImageBucket"), &s3.S3BucketConfig{
		BucketPrefix: str("serverless-image-processing"),
		ForceDestroy: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        str("ServerlessImageProcessingBucket"),
			"Environment": str("Production"),
		},
	})

	// Versioning (use escape hatch)
	ver := s3ver.NewS3BucketVersioningA(stack, str("ImageBucketVersioning"), &s3ver.S3BucketVersioningAConfig{
		Bucket: bucket.Id(),
	})
	ver.AddOverride(str("versioning_configuration"), map[string]interface{}{
		"status": "Enabled",
	})

	// Block public access
	s3pab.NewS3BucketPublicAccessBlock(stack, str("ImageBucketPublicAccessBlock"), &s3pab.S3BucketPublicAccessBlockConfig{
		Bucket:                bucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// SSE (use escape hatch)
	enc := s3enc.NewS3BucketServerSideEncryptionConfigurationA(stack, str("ImageBucketEncryption"), &s3enc.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: bucket.Id(),
	})
	enc.AddOverride(str("rule"), []map[string]interface{}{
		{
			"apply_server_side_encryption_by_default": map[string]interface{}{
				"sse_algorithm": "AES256",
			},
			"bucket_key_enabled": true,
		},
	})

	// Log group
	lg := logs.NewCloudwatchLogGroup(stack, str("LambdaLogGroup"), &logs.CloudwatchLogGroupConfig{
		Name:            str("/aws/lambda/image-thumbnail-processor"),
		RetentionInDays: jsii.Number(30),
		Tags: &map[string]*string{
			"Name":               str("ImageThumbnailProcessorLogs"),
			"SecurityMonitoring": str("enabled"),
			"DataClassification": str("internal"),
		},
	})

	// IAM Role
	assume := `{"Version":"2012-10-17","Statement":[{"Action":"sts:AssumeRole","Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"}}]}`
	role := iamrole.NewIamRole(stack, str("LambdaExecutionRole"), &iamrole.IamRoleConfig{
		Name:               str("image-thumbnail-processor-role"),
		AssumeRolePolicy:   str(assume),
		MaxSessionDuration: jsii.Number(3600),
		Tags: &map[string]*string{
			"Name":                      str("ImageThumbnailProcessorRole"),
			"SecurityLevel":             str("enhanced"),
			"PrincipleOfLeastPrivilege": str("enforced"),
		},
	})

	// Custom IAM Policy
	policyDoc := fmt.Sprintf(`{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["s3:GetObject","s3:GetObjectVersion"],"Resource":"%s/*","Condition":{"StringNotEquals":{"s3:prefix":"thumbnails/"}}},{"Effect":"Allow","Action":["s3:PutObject","s3:PutObjectAcl"],"Resource":["%s/thumbnails/*","%s/errors/*"]},{"Effect":"Allow","Action":["s3:GetObjectAttributes"],"Resource":"%s/*"},{"Effect":"Allow","Action":["logs:CreateLogStream","logs:PutLogEvents"],"Resource":["%s","%s:*"]}]}`,
		*bucket.Arn(), *bucket.Arn(), *bucket.Arn(), *bucket.Arn(), *lg.Arn(), *lg.Arn())

	pol := iampolicy.NewIamPolicy(stack, str("LambdaS3CloudWatchPolicy"), &iampolicy.IamPolicyConfig{
		Name:        str("image-thumbnail-processor-policy"),
		Description: str("Policy for Lambda to access S3 and CloudWatch with least privilege"),
		Policy:      str(policyDoc),
	})

	iampolattach.NewIamRolePolicyAttachment(stack, str("LambdaS3CloudWatchPolicyAttachment"), &iampolattach.IamRolePolicyAttachmentConfig{
		Role:      role.Name(),
		PolicyArn: pol.Arn(),
	})

	// Lambda code written to temp zip
	code := minimalLambdaCode()
	tmpDir := os.TempDir()
	zipPath := filepath.Join(tmpDir, "lambda_function.zip")
	_ = os.WriteFile(zipPath, []byte(code.zipBytes), 0600)

	fn := lambda.NewLambdaFunction(stack, str("ImageThumbnailProcessor"), &lambda.LambdaFunctionConfig{
		FunctionName:                 str("image-thumbnail-processor"),
		Runtime:                      str("python3.12"),
		Handler:                      str("lambda_function.lambda_handler"),
		Role:                         role.Arn(),
		Filename:                     str(zipPath),
		SourceCodeHash:               str(base64.StdEncoding.EncodeToString([]byte(code.zipBytes))),
		Timeout:                      jsii.Number(30),
		MemorySize:                   jsii.Number(256),
		ReservedConcurrentExecutions: jsii.Number(10),
		Environment: &lambda.LambdaFunctionEnvironment{
			Variables: &map[string]*string{
				"BUCKET_NAME":    bucket.Id(),
				"PROCESSOR_TYPE": str("metadata-only"),
				"MAX_FILE_SIZE":  str("104857600"),
				"LOG_LEVEL":      str("INFO"),
			},
		},
		DependsOn: &[]cdktf.ITerraformDependable{lg, role, pol},
		Tags: &map[string]*string{
			"Name":          str("ImageMetadataProcessor"),
			"Environment":   str("Production"),
			"ProcessorType": str("metadata-only"),
			"SecurityLevel": str("enhanced"),
		},
	})

	lambdaperm.NewLambdaPermission(stack, str("S3InvokeLambdaPermission"), &lambdaperm.LambdaPermissionConfig{
		StatementId:  str("AllowExecutionFromS3Bucket"),
		Action:       str("lambda:InvokeFunction"),
		FunctionName: fn.FunctionName(),
		Principal:    str("s3.amazonaws.com"),
		SourceArn:    bucket.Arn(),
		DependsOn:    &[]cdktf.ITerraformDependable{fn},
	})

	notif := s3notif.NewS3BucketNotification(stack, str("S3BucketNotification"), &s3notif.S3BucketNotificationConfig{
		Bucket:    bucket.Id(),
		DependsOn: &[]cdktf.ITerraformDependable{fn},
	})
	// escape hatch: add lambda trigger
	notif.AddOverride(str("lambda_function"), []map[string]interface{}{
		{
			"lambda_function_arn": fmt.Sprintf("${%s.arn}", *fn.Fqn()),
			"events":              []string{"s3:ObjectCreated:*"},
		},
	})

	// Outputs
	cdktf.NewTerraformOutput(stack, str("bucket_name"), &cdktf.TerraformOutputConfig{Value: bucket.Id()})
	cdktf.NewTerraformOutput(stack, str("lambda_function_name"), &cdktf.TerraformOutputConfig{Value: fn.FunctionName()})
	cdktf.NewTerraformOutput(stack, str("lambda_function_arn"), &cdktf.TerraformOutputConfig{Value: fn.Arn()})
}

type embeddedZip struct{ zipBytes string }

func minimalLambdaCode() embeddedZip {
	return embeddedZip{zipBytes: "PK\x03\x04MINIMAL"}
}
