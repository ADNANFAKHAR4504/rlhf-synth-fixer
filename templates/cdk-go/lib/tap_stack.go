package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	// "github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
//
// This struct extends the base awscdk.StackProps with additional
// environment-specific configuration options.
type TapStackProps struct {
	*awscdk.StackProps
	// EnvironmentSuffix is an optional suffix to identify the
	// deployment environment (e.g., 'dev', 'prod').
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the Tap project.
//
// This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
// It determines the environment suffix from the provided properties,
// CDK context, or defaults to 'dev'.
//
// Note:
//   - Do NOT create AWS resources directly in this stack.
//   - Instead, instantiate separate stacks for each resource type within this stack.
type TapStack struct {
	awscdk.Stack
	// EnvironmentSuffix stores the environment suffix used for resource naming and configuration.
	EnvironmentSuffix *string
}

// NewTapStack creates a new instance of TapStack.
//
// Args:
//
//	scope: The parent construct.
//	id: The unique identifier for this stack.
//	props: Optional properties for configuring the stack, including environment suffix.
//
// Returns:
//
//	A new TapStack instance.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Get environment suffix from props, context, or use 'dev' as default
	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	// Create separate stacks for each resource type
	// Create the S3 stack as a nested stack

	// ! DO not create resources directly in this stack.
	// ! Instead, instantiate separate stacks for each resource type.

	// Example S3 bucket creation (commented out - implement in nested stack)
	// bucketName := fmt.Sprintf("tap-bucket-%s", environmentSuffix)
	// awss3.NewBucket(stack, jsii.String("TapBucket"), &awss3.BucketProps{
	//     BucketName: jsii.String(bucketName),
	//     Versioned:  jsii.Bool(true),
	//     RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	//     AutoDeleteObjects: jsii.Bool(true),
	//     BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
	//     Encryption: awss3.BucketEncryption_S3_MANAGED,
	// })

	// Example nested stack structure:
	// type NestedS3Stack struct {
	//     awscdk.NestedStack
	//     Bucket awss3.Bucket
	// }
	//
	// func NewNestedS3Stack(scope constructs.Construct, id *string, props *awscdk.NestedStackProps) *NestedS3Stack {
	//     nestedStack := awscdk.NewNestedStack(scope, id, props)
	//
	//     bucket := awss3.NewBucket(nestedStack, jsii.String("Resource"), &awss3.BucketProps{
	//         BucketName: jsii.String(fmt.Sprintf("tap-bucket-%s", environmentSuffix)),
	//         // ... other properties
	//     })
	//
	//     return &NestedS3Stack{
	//         NestedStack: nestedStack,
	//         Bucket:     bucket,
	//     }
	// }
	//
	// s3Stack := NewNestedS3Stack(stack, jsii.String("S3Stack"+environmentSuffix), &awscdk.NestedStackProps{})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
