package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsbedrock"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	// "github.com/aws/aws-cdk-go/awscdk/v2/awssagemaker" // Uncomment when using SageMaker
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type AIStackProps struct {
	*awscdk.NestedStackProps
	EnvironmentSuffix *string
}

type AIStack struct {
	awscdk.NestedStack
}

func NewAIStack(scope constructs.Construct, id *string, props *AIStackProps) *AIStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props.NestedStackProps)

	// Get environment suffix with fallback
	envSuffix := "dev"
	if props != nil && props.EnvironmentSuffix != nil && *props.EnvironmentSuffix != "" {
		envSuffix = *props.EnvironmentSuffix
	}

	// IAM role for Bedrock access
	bedrockRole := awsiam.NewRole(nestedStack, jsii.String("BedrockAccessRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("bedrock.amazonaws.com"), nil),
		InlinePolicies: &map[string]awsiam.PolicyDocument{
			"BedrockInvokePolicy": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
				Statements: &[]awsiam.PolicyStatement{
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("bedrock:InvokeModel"),
							jsii.String("bedrock:InvokeModelWithResponseStream"),
						},
						Resources: &[]*string{
							jsii.String("arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-micro-v1:0"),
							jsii.String("arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0"),
							jsii.String("arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0"),
						},
					}),
				},
			}),
		},
	})

	// Bedrock Agent for AI capabilities
	awsbedrock.NewCfnAgent(nestedStack, jsii.String("BedrockAgent"), &awsbedrock.CfnAgentProps{
		AgentName:               jsii.String("tap-ai-agent-" + envSuffix),
		AgentResourceRoleArn:    bedrockRole.RoleArn(),
		FoundationModel:         jsii.String("amazon.nova-pro-v1:0"),
		Instruction:             jsii.String("You are an AI assistant for a multi-tier web application. Help users with application-related queries and provide intelligent responses."),
		Description:             jsii.String("AI agent for web application assistance"),
		IdleSessionTtlInSeconds: jsii.Number(1800),
	})

	// SageMaker execution role (will be used when SageMaker is enabled)
	_ = awsiam.NewRole(nestedStack, jsii.String("SageMakerExecutionRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("sagemaker.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSageMakerFullAccess")),
		},
	})

	// SageMaker resources commented out - these would require actual model data
	// To enable SageMaker endpoints:
	// 1. Upload your model artifacts to S3
	// 2. Update the ModelDataUrl with your S3 location
	// 3. Uncomment the code below

	/*
		model := awssagemaker.NewCfnModel(nestedStack, jsii.String("SageMakerModel"), &awssagemaker.CfnModelProps{
			ModelName: jsii.String("tap-ml-model-" + envSuffix),
			ExecutionRoleArn: sagemakerRole.RoleArn(),
			PrimaryContainer: &awssagemaker.CfnModel_ContainerDefinitionProperty{
				Image: jsii.String("763104351884.dkr.ecr.us-east-1.amazonaws.com/pytorch-inference:1.12.0-gpu-py38-cu113-ubuntu20.04-sagemaker"),
				ModelDataUrl: jsii.String("s3://your-bucket/path/to/model.tar.gz"), // Update this
			},
		})

		endpointConfig := awssagemaker.NewCfnEndpointConfig(nestedStack, jsii.String("SageMakerEndpointConfig"), &awssagemaker.CfnEndpointConfigProps{
			EndpointConfigName: jsii.String("tap-ml-endpoint-config-" + envSuffix),
			ProductionVariants: []awssagemaker.CfnEndpointConfig_ProductionVariantProperty{
				{
					ModelName: model.AttrModelName(),
					VariantName: jsii.String("primary"),
					InitialInstanceCount: jsii.Number(1),
					InstanceType: jsii.String("ml.t2.medium"),
					InitialVariantWeight: jsii.Number(1.0),
				},
			},
		})

		awssagemaker.NewCfnEndpoint(nestedStack, jsii.String("SageMakerEndpoint"), &awssagemaker.CfnEndpointProps{
			EndpointName: jsii.String("tap-ml-endpoint-" + envSuffix),
			EndpointConfigName: endpointConfig.AttrEndpointConfigName(),
		})
	*/

	// Create IAM role for AI services (placeholder for future EKS integration)
	_ = awsiam.NewRole(nestedStack, jsii.String("AIServiceRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("sagemaker.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonBedrockFullAccess")),
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSageMakerReadOnly")),
		},
	})

	return &AIStack{
		NestedStack: nestedStack,
	}
}
