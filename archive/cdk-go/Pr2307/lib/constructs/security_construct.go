package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type SecurityConstructProps struct {
	Environment string
}

type SecurityConstruct struct {
	constructs.Construct
	LambdaRole    awsiam.IRole
	AlertingTopic awssns.ITopic
	VPC           awsec2.IVpc
	VPCEndpoints  map[string]awsec2.IVpcEndpoint
}

func NewSecurityConstruct(scope constructs.Construct, id string, props *SecurityConstructProps) *SecurityConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Create SNS topic for alerting
	alertingTopic := awssns.NewTopic(construct, jsii.String("AlertingTopic"), &awssns.TopicProps{
		TopicName:   jsii.String("proj-alerts-" + props.Environment),
		DisplayName: jsii.String("TAP Infrastructure Alerts"),
	})

	// Create VPC for private endpoints
	vpc := awsec2.NewVpc(construct, jsii.String("VPC"), &awsec2.VpcProps{
		VpcName:            jsii.String("proj-vpc-" + props.Environment),
		MaxAzs:             jsii.Number(2),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("Private"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("Public"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
		},
	})

	// Create VPC endpoints for private service access
	vpcEndpoints := make(map[string]awsec2.IVpcEndpoint)

	// S3 Gateway endpoint
	vpcEndpoints["s3"] = awsec2.NewGatewayVpcEndpoint(construct, jsii.String("S3Endpoint"), &awsec2.GatewayVpcEndpointProps{
		Vpc:     vpc,
		Service: awsec2.GatewayVpcEndpointAwsService_S3(),
	})

	// DynamoDB Gateway endpoint
	vpcEndpoints["dynamodb"] = awsec2.NewGatewayVpcEndpoint(construct, jsii.String("DynamoDBEndpoint"), &awsec2.GatewayVpcEndpointProps{
		Vpc:     vpc,
		Service: awsec2.GatewayVpcEndpointAwsService_DYNAMODB(),
	})

	// CloudWatch Logs Interface endpoint
	vpcEndpoints["logs"] = awsec2.NewInterfaceVpcEndpoint(construct, jsii.String("LogsEndpoint"), &awsec2.InterfaceVpcEndpointProps{
		Vpc:               vpc,
		Service:           awsec2.InterfaceVpcEndpointAwsService_CLOUDWATCH_LOGS(),
		PrivateDnsEnabled: jsii.Bool(true),
	})

	// Enhanced Lambda role with VPC and X-Ray permissions
	lambdaRole := awsiam.NewRole(construct, jsii.String("LambdaExecutionRole"), &awsiam.RoleProps{
		RoleName:    jsii.String("proj-lambda-role-" + props.Environment),
		AssumedBy:   awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		Description: jsii.String("Enhanced IAM role for Lambda with VPC and X-Ray access"),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaVPCAccessExecutionRole")),
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AWSXRayDaemonWriteAccess")),
		},
	})

	// Enhanced inline policies
	enhancedS3Policy := awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
		Statements: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Effect: awsiam.Effect_ALLOW,
				Actions: &[]*string{
					jsii.String("s3:GetObject"),
					jsii.String("s3:GetObjectVersion"),
					jsii.String("s3:GetObjectAttributes"),
				},
				Resources: &[]*string{
					jsii.String("arn:aws:s3:::proj-s3-" + props.Environment + "/*"),
				},
				Conditions: &map[string]interface{}{
					"Bool": map[string]interface{}{
						"aws:SecureTransport": "true",
					},
				},
			}),
		},
	})

	enhancedDynamoPolicy := awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
		Statements: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Effect: awsiam.Effect_ALLOW,
				Actions: &[]*string{
					jsii.String("dynamodb:PutItem"),
					jsii.String("dynamodb:UpdateItem"),
					jsii.String("dynamodb:ConditionCheckItem"),
				},
				Resources: &[]*string{
					jsii.String("arn:aws:dynamodb:us-east-1:*:table/proj-dynamodb-" + props.Environment),
				},
			}),
		},
	})

	// Attach enhanced policies
	awsiam.NewPolicy(construct, jsii.String("EnhancedS3AccessPolicy"), &awsiam.PolicyProps{
		PolicyName: jsii.String("proj-enhanced-s3-policy-" + props.Environment),
		Document:   enhancedS3Policy,
		Roles:      &[]awsiam.IRole{lambdaRole},
	})

	awsiam.NewPolicy(construct, jsii.String("EnhancedDynamoDBAccessPolicy"), &awsiam.PolicyProps{
		PolicyName: jsii.String("proj-enhanced-dynamodb-policy-" + props.Environment),
		Document:   enhancedDynamoPolicy,
		Roles:      &[]awsiam.IRole{lambdaRole},
	})

	return &SecurityConstruct{
		Construct:     construct,
		LambdaRole:    lambdaRole,
		AlertingTopic: alertingTopic,
		VPC:           vpc,
		VPCEndpoints:  vpcEndpoints,
	}
}
