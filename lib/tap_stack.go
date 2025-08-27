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

	// Create networking stack
	networkingStack := NewNetworkingStack(stack, jsii.String("Networking"+environmentSuffix), &NetworkingStackProps{
		NestedStackProps:  &awscdk.NestedStackProps{},
		EnvironmentSuffix: jsii.String(environmentSuffix),
	})

	// Create security stack
	securityStack := NewSecurityStack(stack, jsii.String("Security"+environmentSuffix), &SecurityStackProps{
		NestedStackProps:  &awscdk.NestedStackProps{},
		EnvironmentSuffix: jsii.String(environmentSuffix),
		Vpc:               networkingStack.Vpc,
	})

	// Create storage stack
	storageStack := NewStorageStack(stack, jsii.String("Storage"+environmentSuffix), &StorageStackProps{
		NestedStackProps:      &awscdk.NestedStackProps{},
		EnvironmentSuffix:     jsii.String(environmentSuffix),
		Vpc:                   networkingStack.Vpc,
		DatabaseSecurityGroup: securityStack.DatabaseSecurityGroup,
	})

	// Create compute stack
	computeStack := NewComputeStack(stack, jsii.String("Compute"+environmentSuffix), &ComputeStackProps{
		NestedStackProps:  &awscdk.NestedStackProps{},
		EnvironmentSuffix: jsii.String(environmentSuffix),
		Vpc:               networkingStack.Vpc,
		EksSecurityGroup:  securityStack.EksSecurityGroup,
	})

	// Create AI/ML stack
	_ = NewAIStack(stack, jsii.String("AI"+environmentSuffix), &AIStackProps{
		NestedStackProps:  &awscdk.NestedStackProps{},
		EnvironmentSuffix: jsii.String(environmentSuffix),
	})

	// Create monitoring stack
	NewMonitoringStack(stack, jsii.String("Monitoring"+environmentSuffix), &MonitoringStackProps{
		NestedStackProps:  &awscdk.NestedStackProps{},
		EnvironmentSuffix: jsii.String(environmentSuffix),
		Database:          storageStack.Database,
		LoadBalancer:      computeStack.LoadBalancer,
	})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
