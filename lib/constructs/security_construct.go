package constructs

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type SecurityConstructProps struct {
	Environment string
	Region      string
}

type SecurityConstruct struct {
	constructs.Construct
	vpc                 awsec2.Vpc
	lambdaSecurityGroup awsec2.SecurityGroup
	lambdaExecutionRole awsiam.Role
}

func NewSecurityConstruct(scope constructs.Construct, id *string, props *SecurityConstructProps) *SecurityConstruct {
	construct := constructs.NewConstruct(scope, id)

	envSuffix := fmt.Sprintf("-%s-%s", props.Environment, props.Region)

	// Create VPC with isolated subnets for Lambda
	vpc := awsec2.NewVpc(construct, jsii.String("TapVpc"), &awsec2.VpcProps{
		VpcName:            jsii.String(fmt.Sprintf("tap-vpc%s", envSuffix)),
		MaxAzs:             jsii.Number(2),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("private-subnet"),
				SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("public-subnet"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
		},
	})

	// VPC Endpoints for AWS services
	vpc.AddGatewayEndpoint(jsii.String("S3Endpoint"), &awsec2.GatewayVpcEndpointOptions{
		Service: awsec2.GatewayVpcEndpointAwsService_S3(),
	})

	vpc.AddInterfaceEndpoint(jsii.String("SNSEndpoint"), &awsec2.InterfaceVpcEndpointOptions{
		Service: awsec2.InterfaceVpcEndpointAwsService_SNS(),
		Subnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
	})

	vpc.AddInterfaceEndpoint(jsii.String("SQSEndpoint"), &awsec2.InterfaceVpcEndpointOptions{
		Service: awsec2.InterfaceVpcEndpointAwsService_SQS(),
		Subnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
	})

	// Security Group for Lambda
	lambdaSecurityGroup := awsec2.NewSecurityGroup(construct, jsii.String("LambdaSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		SecurityGroupName: jsii.String(fmt.Sprintf("tap-lambda-sg%s", envSuffix)),
		Description:       jsii.String("Security group for TAP Lambda functions"),
		AllowAllOutbound:  jsii.Bool(false),
	})

	// Allow HTTPS outbound for AWS API calls
	lambdaSecurityGroup.AddEgressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("HTTPS outbound for AWS APIs"),
		jsii.Bool(false),
	)

	// Lambda execution role with least privilege
	lambdaExecutionRole := awsiam.NewRole(construct, jsii.String("LambdaExecutionRole"), &awsiam.RoleProps{
		RoleName:  jsii.String(fmt.Sprintf("tap-lambda-execution-role%s", envSuffix)),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaVPCAccessExecutionRole")),
		},
		InlinePolicies: &map[string]awsiam.PolicyDocument{
			"TapLambdaPolicy": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
				Statements: &[]awsiam.PolicyStatement{
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("logs:CreateLogGroup"),
							jsii.String("logs:CreateLogStream"),
							jsii.String("logs:PutLogEvents"),
						},
						Resources: &[]*string{
							jsii.String(fmt.Sprintf("arn:aws:logs:%s:*:log-group:/aws/lambda/tap-handler%s:*", props.Region, envSuffix)),
						},
					}),
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("xray:PutTraceSegments"),
							jsii.String("xray:PutTelemetryRecords"),
						},
						Resources: &[]*string{jsii.String("*")},
					}),
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("sqs:SendMessage"),
							jsii.String("sqs:GetQueueAttributes"),
						},
						Resources: &[]*string{
							jsii.String(fmt.Sprintf("arn:aws:sqs:%s:*:tap-dlq%s", props.Region, envSuffix)),
						},
					}),
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("sns:Publish"),
						},
						Resources: &[]*string{
							jsii.String(fmt.Sprintf("arn:aws:sns:%s:*:tap-cross-region%s", props.Region, envSuffix)),
						},
					}),
				},
			}),
		},
	})

	return &SecurityConstruct{
		Construct:           construct,
		vpc:                 vpc,
		lambdaSecurityGroup: lambdaSecurityGroup,
		lambdaExecutionRole: lambdaExecutionRole,
	}
}

func (s *SecurityConstruct) Vpc() awsec2.Vpc {
	return s.vpc
}

func (s *SecurityConstruct) LambdaSecurityGroup() awsec2.SecurityGroup {
	return s.lambdaSecurityGroup
}

func (s *SecurityConstruct) LambdaExecutionRole() awsiam.Role {
	return s.lambdaExecutionRole
}
