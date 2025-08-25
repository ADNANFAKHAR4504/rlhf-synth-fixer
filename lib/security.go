package main

import (
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/securitygrouprule"
)

type SecurityResources struct {
	LambdaExecutionRole iamrole.IamRole
	SecurityGroups      map[string]securitygroup.SecurityGroup
}

func NewSecurityResources(stack *TapStack) *SecurityResources {
	resources := &SecurityResources{
		SecurityGroups: make(map[string]securitygroup.SecurityGroup),
	}

	// Lambda execution role
	resources.LambdaExecutionRole = iamrole.NewIamRole(stack.Stack, str("lambda-execution-role"), &iamrole.IamRoleConfig{
		Name: str(stack.Config.AppName + "-lambda-execution-role"),
		AssumeRolePolicy: str(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Principal": {
						"Service": "lambda.amazonaws.com"
					}
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-lambda-execution-role"),
		},
	})

	// Attach managed policies
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack.Stack, str("lambda-basic-execution"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      resources.LambdaExecutionRole.Name(),
		PolicyArn: str("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack.Stack, str("lambda-vpc-execution"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      resources.LambdaExecutionRole.Name(),
		PolicyArn: str("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"),
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack.Stack, str("lambda-xray-write"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      resources.LambdaExecutionRole.Name(),
		PolicyArn: str("arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"),
	})

	// Create security groups
	resources.createSecurityGroups(stack)

	return resources
}

func (s *SecurityResources) createSecurityGroups(stack *TapStack) {
	// Lambda security group
	s.SecurityGroups["lambda"] = securitygroup.NewSecurityGroup(stack.Stack, str("lambda-sg"), &securitygroup.SecurityGroupConfig{
		Name:        str(stack.Config.AppName + "-lambda-sg"),
		Description: str("Security group for Lambda functions"),
		VpcId:       stack.Networking.VPC.Id(),
		Tags: &map[string]*string{
			"Name": str(stack.Config.AppName + "-lambda-sg"),
		},
	})

	// Egress rules for Lambda (HTTPS outbound)
	securitygrouprule.NewSecurityGroupRule(stack.Stack, str("lambda-egress-https"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:              str("egress"),
		FromPort:          num(443),
		ToPort:            num(443),
		Protocol:          str("tcp"),
		CidrBlocks:        &[]*string{str("0.0.0.0/0")},
		SecurityGroupId:   s.SecurityGroups["lambda"].Id(),
		Description:       str("HTTPS outbound access"),
	})

	securitygrouprule.NewSecurityGroupRule(stack.Stack, str("lambda-egress-http"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:              str("egress"),
		FromPort:          num(80),
		ToPort:            num(80),
		Protocol:          str("tcp"),
		CidrBlocks:        &[]*string{str("0.0.0.0/0")},
		SecurityGroupId:   s.SecurityGroups["lambda"].Id(),
		Description:       str("HTTP outbound access"),
	})
}