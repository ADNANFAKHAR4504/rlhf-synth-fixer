

package lib

import (
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/iamrole"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/iamrolepolicyattachment"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/lambdafunction"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucket"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketnotification"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/provider"
	logs "github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatchloggroup"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/iampolicy"
	constructs "github.com/hashicorp/terraform-cdk-go/constructs/v10"
)

type TapStack struct {
	cdktf.TerraformStack
}

func NewTapStack(scope constructs.Construct, id string) cdktf.TerraformStack {
	stack := &TapStack{}
	cdktf.NewTerraformStack(scope, &stack.TerraformStack, &id)

	awsProvider := provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String("us-east-1"),
	})

	logGroup := logs.NewCloudwatchLogGroup(stack, jsii.String("logs"), &logs.CloudwatchLogGroupConfig{
		Name: jsii.String("/aws/lambda/thumbnail-generator"),
	})

	lambdaRole := iamrole.NewIamRole(stack, jsii.String("lambdaRole"), &iamrole.IamRoleConfig{
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"Service": "lambda.amazonaws.com"},
				"Action": "sts:AssumeRole"
			}]
		}`),
	})

	policy := iampolicy.NewIamPolicy(stack, jsii.String("lambdaPolicy"), &iampolicy.IamPolicyConfig{
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{"Effect": "Allow", "Action": ["s3:GetObject", "s3:PutObject"], "Resource": "arn:aws:s3::::images/*"},
				{"Effect": "Allow", "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"], "Resource": "*"}
			]
		}`),
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("policyAttachment"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:   lambdaRole.Name(),
		PolicyArn: policy.Arn(),
	})

	bucket := s3bucket.NewS3Bucket(stack, jsii.String("bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String("images"),
	})

	lambdaFn := lambdafunction.NewLambdaFunction(stack, jsii.String("lambda"), &lambdafunction.LambdaFunctionConfig{
		Filename:     jsii.String("lambda/thumbnail.zip"),
		Handler:      jsii.String("index.handler"),
		Runtime:      jsii.String("nodejs14.x"),
		Role:         lambdaRole.Arn(),
		Environment: &lambdafunction.LambdaFunctionEnvironment{
			Variables: &map[string]*string{"LOG_LEVEL": jsii.String("INFO")},
		},
	})

	s3bucketnotification.NewS3BucketNotification(stack, jsii.String("notification"), &s3bucketnotification.S3BucketNotificationConfig{
		Bucket: bucket.Bucket(),
		LambdaFunction: &[]s3bucketnotification.S3BucketNotificationLambdaFunction{
			{
				Events:   &[]*string{jsii.String("s3:ObjectCreated:*")},
				FunctionArn: lambdaFn.Arn(),
			},
		},
	})

	return stack
}