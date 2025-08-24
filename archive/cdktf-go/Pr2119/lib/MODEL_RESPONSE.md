```go
package lib

import (
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/iampolicy"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/iamrole"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/lambdafunction"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucket"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/s3bucketnotification"
	logs "github.com/TuringGpt/iac-test-automations/.gen/aws/cloudwatchloggroup"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/provider"
	"github.com/TuringGpt/iac-test-automations/.gen/aws/iamrolepolicyattachment"
	constructs "github.com/hashicorp/terraform-cdk-go/constructs/v10"
)

type TapStack struct {
	cdktf.TerraformStack
}

func NewTapStack(scope constructs.Construct, id string) cdktf.TerraformStack {
stack := &TapStack{}
cdktf.NewTerraformStack(scope, &stack.TerraformStack, &id)

    // AWS Provider
    awsProvider := provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
    	Region: jsii.String("us-east-1"),
    })

    // S3 Bucket
    bucket := s3bucket.NewS3Bucket(stack, jsii.String("ImageBucket"), &s3bucket.S3BucketConfig{
    	Bucket: jsii.String("image-bucket-cdktf"),
    })

    // CloudWatch Log Group
    logGroup := logs.NewCloudwatchLogGroup(stack, jsii.String("LambdaLogs"), &logs.CloudwatchLogGroupConfig{
    	Name: jsii.String("/aws/lambda/thumbnail-generator"),
    })

    // IAM Role
    lambdaRole := iamrole.NewIamRole(stack, jsii.String("LambdaRole"), &iamrole.IamRoleConfig{
    	AssumeRolePolicy: jsii.String(`{
    		"Version": "2012-10-17",
    		"Statement": [{
    			"Effect": "Allow",
    			"Principal": {"Service": "lambda.amazonaws.com"},
    			"Action": "sts:AssumeRole"
    		}]
    	}`),
    })

    // IAM Policy
    lambdaPolicy := iampolicy.NewIamPolicy(stack, jsii.String("LambdaPolicy"), &iampolicy.IamPolicyConfig{
    	Policy: jsii.String(`{
    		"Version": "2012-10-17",
    		"Statement": [{
    			"Effect": "Allow",
    			"Action": [
    				"s3:GetObject",
    				"s3:PutObject",
    				"logs:CreateLogGroup",
    				"logs:CreateLogStream",
    				"logs:PutLogEvents"
    			],
    			"Resource": [
    				"arn:aws:s3::::image-bucket-cdktf/*",
    				"arn:aws:logs:*:*:*"
    			]
    		}]
    	}`),
    })

    // Attach policy to role
    iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("RolePolicyAttachment"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
    	Role:  lambdaRole.Name(),
    	PolicyArn: lambdaPolicy.Arn(),
    })

    // Lambda Function
    lambdaFunc := lambdafunction.NewLambdaFunction(stack, jsii.String("ThumbnailGenerator"), &lambdafunction.LambdaFunctionConfig{
    	Filename:     jsii.String("lambda/thumbnail.zip"),
    	Handler:      jsii.String("index.handler"),
    	Runtime:      jsii.String("go1.x"),
    	Role:         lambdaRole.Arn(),
    	Environment: &lambdafunction.LambdaFunctionEnvironment{
    		Variables: &map[string]*string{
    			"BUCKET_NAME": bucket.Bucket(),
    		},
    	},
    })

    // S3 Bucket Notification
    s3bucketnotification.NewS3BucketNotification(stack, jsii.String("BucketNotification"), &s3bucketnotification.S3BucketNotificationConfig{
    	Bucket: bucket.Bucket(),
    	LambdaFunction: &s3bucketnotification.S3BucketNotificationLambdaFunction{
    		Events: jsii.Strings("s3:ObjectCreated:*"),
    		LambdaFunctionArn: lambdaFunc.Arn(),
    	},
    	DependsOn: &[]cdktf.ITerraformDependable{
    		lambdaFunc.Node().DefaultChild(),
    	},
    })

    // Add explicit permission for S3 to invoke Lambda
    lambdaFunc.AddPermission(jsii.String("AllowS3Invoke"), &lambdafunction.LambdaFunctionPermissionConfig{
    	Principal: jsii.String("s3.amazonaws.com"),
    	Action:    jsii.String("lambda:InvokeFunction"),
    	SourceArn: bucket.Arn(),
    })

    return stack

}
```
