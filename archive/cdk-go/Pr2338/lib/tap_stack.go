package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
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
	// Infrastructure stacks
	VpcStack     *VpcStack
	IamStack     *IamStack
	SecretsStack *SecretsStack
	Ec2Stack     *Ec2Stack
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

	// Load configuration
	config := DefaultConfig()
	config.EnvironmentName = environmentSuffix

	// Get configurable instance type from context
	var instanceType string
	if instanceTypeContext := stack.Node().TryGetContext(jsii.String("instanceType")); instanceTypeContext != nil {
		instanceType = config.GetInstanceTypeFromContext(instanceTypeContext)
	} else {
		instanceType = config.InstanceType
	}

	// Create nested stacks for each resource type following dependency order

	// 1. VPC Stack - Foundation networking
	vpcStack := NewVpcStack(stack, jsii.String("VpcStack"), &VpcStackProps{
		StackProps:      &awscdk.StackProps{},
		EnvironmentName: environmentSuffix,
	})

	// 2. IAM Stack - Security roles and policies
	iamStack := NewIamStack(stack, jsii.String("IamStack"), &IamStackProps{
		StackProps:      &awscdk.StackProps{},
		EnvironmentName: environmentSuffix,
	})

	// 3. Secrets Stack - Secrets Manager and VPC endpoint
	secretsStack := NewSecretsStack(stack, jsii.String("SecretsStack"), &SecretsStackProps{
		StackProps:      &awscdk.StackProps{},
		Vpc:             vpcStack.Vpc,
		EnvironmentName: environmentSuffix,
	})

	// 4. EC2 Stack - Compute resources (depends on VPC, IAM, and Secrets)
	ec2Stack := NewEc2Stack(stack, jsii.String("Ec2Stack"), &Ec2StackProps{
		StackProps:      &awscdk.StackProps{},
		Vpc:             vpcStack.Vpc,
		PrivateSubnet:   vpcStack.PrivateSubnet,
		InstanceProfile: iamStack.InstanceProfile,
		InstanceType:    instanceType,
		EnvironmentName: environmentSuffix,
	})

	// Add dependencies to ensure proper deployment order
	secretsStack.Stack.AddDependency(vpcStack.Stack, nil)
	ec2Stack.Stack.AddDependency(vpcStack.Stack, nil)
	ec2Stack.Stack.AddDependency(iamStack.Stack, nil)
	ec2Stack.Stack.AddDependency(secretsStack.Stack, nil)

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
		VpcStack:          vpcStack,
		IamStack:          iamStack,
		SecretsStack:      secretsStack,
		Ec2Stack:          ec2Stack,
	}
}
