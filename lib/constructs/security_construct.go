package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type SecurityConstructProps struct {
	Environment string
}

type SecurityConstruct struct {
	constructs.Construct
	LambdaRole awsiam.IRole
}

func NewSecurityConstruct(scope constructs.Construct, id string, props *SecurityConstructProps) *SecurityConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Create IAM role for Lambda function with least privilege
	lambdaRole := awsiam.NewRole(construct, jsii.String("LambdaExecutionRole"), &awsiam.RoleProps{
		RoleName:    jsii.String("proj-lambda-role-" + props.Environment),
		AssumedBy:   awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		Description: jsii.String("IAM role for Lambda function with least privilege access"),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaBasicExecutionRole")),
		},
	})

	// Inline policy for S3 access (read-only to specific bucket)
	s3Policy := awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
		Statements: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Effect: awsiam.Effect_ALLOW,
				Actions: &[]*string{
					jsii.String("s3:GetObject"),
					jsii.String("s3:GetObjectVersion"),
				},
				Resources: &[]*string{
					jsii.String("arn:aws:s3:::proj-s3-" + props.Environment + "/*"),
				},
			}),
		},
	})

	// Inline policy for DynamoDB access (write-only to specific table)
	dynamoPolicy := awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
		Statements: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Effect: awsiam.Effect_ALLOW,
				Actions: &[]*string{
					jsii.String("dynamodb:PutItem"),
					jsii.String("dynamodb:UpdateItem"),
				},
				Resources: &[]*string{
					jsii.String("arn:aws:dynamodb:us-east-1:*:table/proj-dynamodb-" + props.Environment),
				},
			}),
		},
	})

	// Attach inline policies to the role
	awsiam.NewPolicy(construct, jsii.String("S3AccessPolicy"), &awsiam.PolicyProps{
		PolicyName: jsii.String("proj-s3-access-policy-" + props.Environment),
		Document:   s3Policy,
		Roles:      &[]awsiam.IRole{lambdaRole},
	})

	awsiam.NewPolicy(construct, jsii.String("DynamoDBAccessPolicy"), &awsiam.PolicyProps{
		PolicyName: jsii.String("proj-dynamodb-access-policy-" + props.Environment),
		Document:   dynamoPolicy,
		Roles:      &[]awsiam.IRole{lambdaRole},
	})

	return &SecurityConstruct{
		Construct:  construct,
		LambdaRole: lambdaRole,
	}
}
