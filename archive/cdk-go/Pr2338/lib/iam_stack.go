package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type IamStackProps struct {
	*awscdk.StackProps
	EnvironmentName string
}

type IamStack struct {
	awscdk.Stack
	Ec2Role         awsiam.Role
	InstanceProfile awsiam.InstanceProfile
}

func NewIamStack(scope constructs.Construct, id *string, props *IamStackProps) *IamStack {
	var sprops awscdk.StackProps
	if props.StackProps != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Create IAM role for EC2 instance following least privilege principle
	ec2Role := awsiam.NewRole(stack, jsii.String("EC2InstanceRole"), &awsiam.RoleProps{
		RoleName:    jsii.String("ProductionEC2InstanceRole"),
		AssumedBy:   awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		Description: jsii.String("IAM role for EC2 instance with minimal required permissions"),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			// Basic EC2 permissions for SSM Session Manager
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
		},
	})

	// Add custom inline policy for Secrets Manager access with least privilege
	secretsPolicy := awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
		Statements: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Effect: awsiam.Effect_ALLOW,
				Actions: &[]*string{
					jsii.String("secretsmanager:GetSecretValue"),
					jsii.String("secretsmanager:DescribeSecret"),
				},
				Resources: &[]*string{
					jsii.String("arn:aws:secretsmanager:us-east-1:*:secret:prod/database/credentials-*"),
					jsii.String("arn:aws:secretsmanager:us-east-1:*:secret:prod/app/config-*"),
				},
			}),
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Effect: awsiam.Effect_ALLOW,
				Actions: &[]*string{
					jsii.String("kms:Decrypt"),
				},
				Resources: &[]*string{
					jsii.String("arn:aws:kms:us-east-1:*:key/*"),
				},
				Conditions: &map[string]interface{}{
					"StringEquals": map[string]*string{
						"kms:ViaService": jsii.String("secretsmanager.us-east-1.amazonaws.com"),
					},
				},
			}),
		},
	})

	awsiam.NewPolicy(stack, jsii.String("SecretsManagerAccessPolicy"), &awsiam.PolicyProps{
		PolicyName: jsii.String("ProductionSecretsManagerAccess"),
		Document:   secretsPolicy,
		Roles:      &[]awsiam.IRole{ec2Role},
	})

	// Create instance profile
	instanceProfile := awsiam.NewInstanceProfile(stack, jsii.String("EC2InstanceProfile"), &awsiam.InstanceProfileProps{
		InstanceProfileName: jsii.String("ProductionEC2InstanceProfile"),
		Role:                ec2Role,
	})

	// Tag IAM resources
	awscdk.Tags_Of(ec2Role).Add(jsii.String("Environment"), jsii.String("Production"), nil)
	awscdk.Tags_Of(ec2Role).Add(jsii.String("Component"), jsii.String("IAM"), nil)

	return &IamStack{
		Stack:           stack,
		Ec2Role:         ec2Role,
		InstanceProfile: instanceProfile,
	}
}
