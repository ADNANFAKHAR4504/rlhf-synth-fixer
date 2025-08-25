// src/main/java/com/company/infrastructure/security/IamStack.java
package com.company.infrastructure.security;

import com.company.infrastructure.config.InfrastructureConfig;
import com.company.infrastructure.utils.TagUtils;
import com.pulumi.aws.iam.*;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;

public class IamStack extends ComponentResource {
    private final Role lambdaExecutionRole;
    private final Role configServiceRole;
    private final Role cloudTrailRole;
    
    public IamStack(String name, InfrastructureConfig config) {
        super("custom:security:IamStack", name, ComponentResourceOptions.builder().build());
        
        var tags = TagUtils.getStandardTags(config, "security", "iam");
        
        // Lambda Execution Role
        this.lambdaExecutionRole = new Role(config.getResourceName("role", "lambda-execution"), RoleArgs.builder()
            .assumeRolePolicy("""
                {
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
                }
                """)
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Attach managed policies to Lambda role
        new RolePolicyAttachment(config.getResourceName("rpa", "lambda-basic"), RolePolicyAttachmentArgs.builder()
            .role(lambdaExecutionRole.name())
            .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new RolePolicyAttachment(config.getResourceName("rpa", "lambda-vpc"), RolePolicyAttachmentArgs.builder()
            .role(lambdaExecutionRole.name())
            .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole")
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // AWS Config Service Role
        this.configServiceRole = new Role(config.getResourceName("role", "config-service"), RoleArgs.builder()
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "config.amazonaws.com"
                            }
                        }
                    ]
                }
                """)
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Attach managed policy to Config role
        new RolePolicyAttachment(config.getResourceName("rpa", "config-service"), RolePolicyAttachmentArgs.builder()
            .role(configServiceRole.name())
            .policyArn("arn:aws:iam::aws:policy/service-role/ConfigRole")
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // CloudTrail Service Role (if needed for CloudWatch Logs)
        this.cloudTrailRole = new Role(config.getResourceName("role", "cloudtrail"), RoleArgs.builder()
            .assumeRolePolicy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            }
                        }
                    ]
                }
                """)
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
        
        // Custom policy for CloudTrail to write to CloudWatch Logs
        var cloudTrailLogsPolicy = new Policy(config.getResourceName("policy", "cloudtrail-logs"), PolicyArgs.builder()
            .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogGroups",
                                "logs:DescribeLogStreams"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """)
            .tags(tags)
            .build(), ComponentResourceOptions.builder().parent(this).build());
            
        new RolePolicyAttachment(config.getResourceName("rpa", "cloudtrail-logs"), RolePolicyAttachmentArgs.builder()
            .role(cloudTrailRole.name())
            .policyArn(cloudTrailLogsPolicy.arn())
            .build(), ComponentResourceOptions.builder().parent(this).build());
    }
    
    public Role getLambdaExecutionRole() { return lambdaExecutionRole; }
    public Role getConfigServiceRole() { return configServiceRole; }
    public Role getCloudTrailRole() { return cloudTrailRole; }
}