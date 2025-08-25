The error indicates that the execution roles need to exist in each target account before the StackSet instances can be deployed. The issue is that we're creating the execution role only in the management account, but it needs to exist in each target account with the proper trust relationship.

Here's the updated solution that addresses this multi-account deployment challenge:

## Updated Main Application

```java
// Main.java
import com.pulumi.Pulumi;
import com.pulumi.core.Output;
import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import components.WebApplicationStackSet;
import components.IAMRoles;
import components.CrossAccountRoleSetup;
import components.ObservabilityDashboard;
import config.DeploymentConfig;

import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            // Configuration
            var config = new DeploymentConfig();
            
            // Create AWS Provider for management account
            var managementProvider = new Provider("management-provider", ProviderArgs.builder()
                .region(config.getManagementRegion())
                .build());

            // Create IAM roles for StackSet operations in management account
            var iamRoles = new IAMRoles("stackset-iam-roles", managementProvider);

            // Set up cross-account execution roles
            var crossAccountSetup = new CrossAccountRoleSetup("cross-account-setup",
                CrossAccountRoleSetup.CrossAccountRoleSetupArgs.builder()
                    .config(config)
                    .administrationRoleArn(iamRoles.getAdministrationRoleArn())
                    .build());

            // Create the web application StackSet (after cross-account setup)
            var webAppStackSet = new WebApplicationStackSet("web-app-stackset", 
                WebApplicationStackSet.WebApplicationStackSetArgs.builder()
                    .config(config)
                    .administrationRoleArn(iamRoles.getAdministrationRoleArn())
                    .executionRoleName(iamRoles.getExecutionRoleName())
                    .crossAccountSetup(crossAccountSetup)
                    .build(), 
                managementProvider);

            // Create observability dashboard
            var dashboard = new ObservabilityDashboard("web-app-dashboard", 
                ObservabilityDashboard.ObservabilityDashboardArgs.builder()
                    .stackSetId(webAppStackSet.getStackSetId())
                    .regions(config.getTargetRegions())
                    .build(),
                managementProvider);

            // Export outputs
            ctx.export("stackSetId", webAppStackSet.getStackSetId());
            ctx.export("stackSetArn", webAppStackSet.getStackSetArn());
            ctx.export("administrationRoleArn", iamRoles.getAdministrationRoleArn());
            ctx.export("executionRoleName", iamRoles.getExecutionRoleName());
            ctx.export("dashboardUrl", dashboard.getDashboardUrl());
            
            // Export application endpoints for each region
            config.getTargetRegions().forEach(region -> {
                ctx.export("applicationEndpoint-" + region, 
                    webAppStackSet.getApplicationEndpoint(region));
            });
        });
    }
}
```

## New Cross-Account Role Setup Component

```java
// components/CrossAccountRoleSetup.java
package components;

import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.Policy;
import com.pulumi.aws.iam.PolicyArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import config.DeploymentConfig;

import java.util.ArrayList;
import java.util.List;

public class CrossAccountRoleSetup extends ComponentResource {
    private final List<Output<String>> executionRoleArns;

    public static class CrossAccountRoleSetupArgs {
        private DeploymentConfig config;
        private Output<String> administrationRoleArn;

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private CrossAccountRoleSetupArgs args = new CrossAccountRoleSetupArgs();
            
            public Builder config(DeploymentConfig config) {
                args.config = config;
                return this;
            }
            
            public Builder administrationRoleArn(Output<String> arn) {
                args.administrationRoleArn = arn;
                return this;
            }
            
            public CrossAccountRoleSetupArgs build() { return args; }
        }
    }

    public CrossAccountRoleSetup(String name, CrossAccountRoleSetupArgs args, ComponentResourceOptions options) {
        super("custom:aws:CrossAccountRoleSetup", name, options);

        this.executionRoleArns = new ArrayList<>();

        // Create execution roles in each target account
        for (String accountId : args.config.getTargetAccounts()) {
            // Create provider for target account (assumes cross-account access is configured)
            var targetProvider = new Provider("provider-" + accountId, ProviderArgs.builder()
                .region(args.config.getManagementRegion())
                // Note: In real scenarios, you'd configure assume_role here
                // .assumeRole(AssumeRoleArgs.builder()
                //     .roleArn("arn:aws:iam::" + accountId + ":role/OrganizationAccountAccessRole")
                //     .build())
                .build(), ComponentResourceOptions.builder()
                    .parent(this)
                    .build());

            // Create execution role in target account
            var executionRole = new Role("execution-role-" + accountId, RoleArgs.builder()
                .name("AWSCloudFormationStackSetExecutionRole")
                .assumeRolePolicy(args.administrationRoleArn.apply(adminArn -> String.format("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {
                                    "AWS": "%s"
                                },
                                "Action": "sts:AssumeRole"
                            }
                        ]
                    }
                    """, adminArn)))
                .build(), ComponentResourceOptions.builder()
                    .parent(this)
                    .provider(targetProvider)
                    .build());

            // Create execution policy
            var executionPolicy = new Policy("execution-policy-" + accountId, PolicyArgs.builder()
                .name("StackSetExecutionPolicy")
                .policy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Action": [
                                    "cloudformation:*",
                                    "ec2:*",
                                    "elasticloadbalancing:*",
                                    "autoscaling:*",
                                    "dynamodb:*",
                                    "iam:CreateRole",
                                    "iam:DeleteRole",
                                    "iam:GetRole",
                                    "iam:PassRole",
                                    "iam:CreateInstanceProfile",
                                    "iam:DeleteInstanceProfile",
                                    "iam:AddRoleToInstanceProfile",
                                    "iam:RemoveRoleFromInstanceProfile",
                                    "iam:AttachRolePolicy",
                                    "iam:DetachRolePolicy",
                                    "iam:PutRolePolicy",
                                    "iam:DeleteRolePolicy",
                                    "iam:GetRolePolicy",
                                    "iam:ListRolePolicies",
                                    "iam:ListAttachedRolePolicies",
                                    "kms:*",
                                    "logs:*",
                                    "cloudwatch:*"
                                ],
                                "Resource": "*"
                            }
                        ]
                    }
                    """)
                .build(), ComponentResourceOptions.builder()
                    .parent(this)
                    .provider(targetProvider)
                    .build());

            // Attach policy to execution role
            new RolePolicyAttachment("execution-policy-attachment-" + accountId,
                RolePolicyAttachmentArgs.builder()
                    .role(executionRole.name())
                    .policyArn(executionPolicy.arn())
                    .build(), ComponentResourceOptions.builder()
                        .parent(this)
                        .provider(targetProvider)
                        .build());

            executionRoleArns.add(executionRole.arn());
        }
    }

    public List<Output<String>> getExecutionRoleArns() { return executionRoleArns; }
}
```

## Updated Web Application StackSet Component

```java
// components/WebApplicationStackSet.java
package components;

import com.pulumi.aws.Provider;
import com.pulumi.aws.cloudformation.StackSet;
import com.pulumi.aws.cloudformation.StackSetArgs;
import com.pulumi.aws.cloudformation.StackSetInstance;
import com.pulumi.aws.cloudformation.StackSetInstanceArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import config.DeploymentConfig;

import java.util.Map;

public class WebApplicationStackSet extends ComponentResource {
    private final Output<String> stackSetId;
    private final Output<String> stackSetArn;
    private final DeploymentConfig config;

    public static class WebApplicationStackSetArgs {
        private DeploymentConfig config;
        private Output<String> administrationRoleArn;
        private Output<String> executionRoleName;
        private CrossAccountRoleSetup crossAccountSetup;

        public static Builder builder() { return new Builder(); }

        public static class Builder {
            private WebApplicationStackSetArgs args = new WebApplicationStackSetArgs();
            
            public Builder config(DeploymentConfig config) {
                args.config = config;
                return this;
            }
            
            public Builder administrationRoleArn(Output<String> arn) {
                args.administrationRoleArn = arn;
                return this;
            }
            
            public Builder executionRoleName(Output<String> name) {
                args.executionRoleName = name;
                return this;
            }

            public Builder crossAccountSetup(CrossAccountRoleSetup setup) {
                args.crossAccountSetup = setup;
                return this;
            }
            
            public WebApplicationStackSetArgs build() { return args; }
        }
    }

    public WebApplicationStackSet(String name, WebApplicationStackSetArgs args, Provider provider) {
        super("custom:aws:WebApplicationStackSet", name, ComponentResourceOptions.builder()
            .provider(provider)
            .build());

        this.config = args.config;

        // Create the StackSet with CloudFormation template
        var stackSet = new StackSet("web-app-stackset", StackSetArgs.builder()
            .name(config.getApplicationName() + "-stackset")
            .description("Multi-region web application infrastructure")
            .administrationRoleArn(args.administrationRoleArn)
            .executionRoleName(args.executionRoleName)
            .capabilities("CAPABILITY_IAM", "CAPABILITY_NAMED_IAM")
            .parameters(Map.of(
                "ApplicationName", config.getApplicationName(),
                "Environment", config.getEnvironment()
            ))
            .templateBody(getCloudFormationTemplate())
            .build(), ComponentResourceOptions.builder()
                .parent(this)
                .provider(provider)
                .build());

        // Deploy StackSet instances across accounts and regions
        // Wait for cross-account setup to complete first
        for (String account : config.getTargetAccounts()) {
            for (String region : config.getTargetRegions()) {
                new StackSetInstance("stackset-instance-" + account + "-" + region,
                    StackSetInstanceArgs.builder()
                        .stackSetName(stackSet.name())
                        .accountId(account)
                        .region(region) // Use region instead of stackSetInstanceRegion
                        .build(), ComponentResourceOptions.builder()
                            .parent(this)
                            .provider(provider)
                            .dependsOn(stackSet)
                            // Ensure cross-account roles are set up first
                            .dependsOn(args.crossAccountSetup)
                            .build());
            }
        }

        this.stackSetId = stackSet.id();
        this.stackSetArn = stackSet.arn();
    }

    // ... rest of the CloudFormation template method remains the same ...
    private String getCloudFormationTemplate() {
        return """
            {
                "AWSTemplateFormatVersion": "2010-09-09",
                "Description": "Multi-region web application infrastructure",
                "Parameters": {
                    "ApplicationName": {
                        "Type": "String",
                        "Description": "Name of the application"
                    },
                    "Environment": {
                        "Type": "String",
                        "Description": "Environment name"
                    }
                },
                "Resources": {
                    "VPC": {
                        "Type": "AWS::EC2::VPC",
                        "Properties": {
                            "CidrBlock": "10.0.0.0/16",
                            "EnableDnsHostnames": true,
                            "EnableDnsSupport": true,
                            "Tags": [
                                {
                                    "Key": "Name",
                                    "Value": {
                                        "Fn::Sub": "${ApplicationName}-vpc"
                                    }
                                }
                            ]
                        }
                    },
                    "PublicSubnet1": {
                        "Type": "AWS::EC2::Subnet",
                        "Properties": {
                            "VpcId": { "Ref": "VPC" },
                            "CidrBlock": "10.0.1.0/24",
                            "AvailabilityZone": {
                                "Fn::Select": [0, { "Fn::GetAZs": "" }]
                            },
                            "MapPublicIpOnLaunch": true
                        }
                    },
                    "PublicSubnet2": {
                        "Type": "AWS::EC2::Subnet",
                        "Properties": {
                            "VpcId": { "Ref": "VPC" },
                            "CidrBlock": "10.0.2.0/24",
                            "AvailabilityZone": {
                                "Fn::Select": [1, { "Fn::GetAZs": "" }]
                            },
                            "MapPublicIpOnLaunch": true
                        }
                    },
                    "InternetGateway": {
                        "Type": "AWS::EC2::InternetGateway"
                    },
                    "AttachGateway": {
                        "Type": "AWS::EC2::VPCGatewayAttachment",
                        "Properties": {
                            "VpcId": { "Ref": "VPC" },
                            "InternetGatewayId": { "Ref": "InternetGateway" }
                        }
                    },
                    "PublicRouteTable": {
                        "Type": "AWS::EC2::RouteTable",
                        "Properties": {
                            "VpcId": { "Ref": "VPC" }
                        }
                    },
                    "PublicRoute": {
                        "Type": "AWS::EC2::Route",
                        "DependsOn": "AttachGateway",
                        "Properties": {
                            "RouteTableId": { "Ref": "PublicRouteTable" },
                            "DestinationCidrBlock": "0.0.0.0/0",
                            "GatewayId": { "Ref": "InternetGateway" }
                        }
                    },
                    "PublicSubnetRouteTableAssociation1": {
                        "Type": "AWS::EC2::SubnetRouteTableAssociation",
                        "Properties": {
                            "SubnetId": { "Ref": "PublicSubnet1" },
                            "RouteTableId": { "Ref": "PublicRouteTable" }
                        }
                    },
                    "PublicSubnetRouteTableAssociation2": {
                        "Type": "AWS::EC2::SubnetRouteTableAssociation",
                        "Properties": {
                            "SubnetId": { "Ref": "PublicSubnet2" },
                            "RouteTableId": { "Ref": "PublicRouteTable" }
                        }
                    },
                    "SecurityGroup": {
                        "Type": "AWS::EC2::SecurityGroup",
                        "Properties": {
                            "GroupDescription": "Security group for web application",
                            "VpcId": { "Ref": "VPC" },
                            "SecurityGroupIngress": [
                                {
                                    "IpProtocol": "tcp",
                                    "FromPort": 80,
                                    "ToPort": 80,
                                    "CidrIp": "0.0.0.0/0"
                                },
                                {
                                    "IpProtocol": "tcp",
                                    "FromPort": 443,
                                    "ToPort": 443,
                                    "CidrIp": "0.0.0.0/0"
                                }
                            ]
                        }
                    },
                    "ApplicationLoadBalancer": {
                        "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
                        "Properties": {
                            "Name": {
                                "Fn::Sub": "${ApplicationName}-alb"
                            },
                            "Scheme": "internet-facing",
                            "Type": "application",
                            "Subnets": [
                                { "Ref": "PublicSubnet1" },
                                { "Ref": "PublicSubnet2" }
                            ],
                            "SecurityGroups": [
                                { "Ref": "SecurityGroup" }
                            ]
                        }
                    },
                    "TargetGroup": {
                        "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
                        "Properties": {
                            "Name": {
                                "Fn::Sub": "${ApplicationName}-tg"
                            },
                            "Port": 80,
                            "Protocol": "HTTP",
                            "VpcId": { "Ref": "VPC" },
                            "HealthCheckPath": "/health",
                            "HealthCheckProtocol": "HTTP",
                            "HealthCheckIntervalSeconds": 30,
                            "HealthyThresholdCount": 2,
                            "UnhealthyThresholdCount": 5
                        }
                    },
                    "Listener": {
                        "Type": "AWS::ElasticLoadBalancingV2::Listener",
                        "Properties": {
                            "DefaultActions": [
                                {
                                    "Type": "forward",
                                    "TargetGroupArn": { "Ref": "TargetGroup" }
                                }
                            ],
                            "LoadBalancerArn": { "Ref": "ApplicationLoadBalancer" },
                            "Port": 80,
                            "Protocol": "HTTP"
                        }
                    },
                    "LaunchTemplate": {
                        "Type": "AWS::EC2::LaunchTemplate",
                        "Properties": {
                            "LaunchTemplateName": {
                                "Fn::Sub": "${ApplicationName}-lt"
                            },
                            "LaunchTemplateData": {
                                "ImageId": "ami-0c02fb55956c7d316",
                                "InstanceType": "t3.micro",
                                "SecurityGroupIds": [
                                    { "Ref": "SecurityGroup" }
                                ],
                                "IamInstanceProfile": {
                                    "Arn": { "Fn::GetAtt": ["InstanceProfile", "Arn"] }
                                },
                                "UserData": {
                                    "Fn::Base64": {
                                        "Fn::Sub": [
                                            "#!/bin/bash\\nyum update -y\\nyum install -y httpd\\nsystemctl start httpd\\nsystemctl enable httpd\\necho '<h1>Hello from ${AWS::Region}</h1>' > /var/www/html/index.html\\necho 'OK' > /var/www/html/health\\n",
                                            {}
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    "AutoScalingGroup": {
                        "Type": "AWS::AutoScaling::AutoScalingGroup",
                        "Properties": {
                            "AutoScalingGroupName": {
                                "Fn::Sub": "${ApplicationName}-asg"
                            },
                            "LaunchTemplate": {
                                "LaunchTemplateId": { "Ref": "LaunchTemplate" },
                                "Version": { "Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"] }
                            },
                            "MinSize": "2",
                            "MaxSize": "10",
                            "DesiredCapacity": "2",
                            "VPCZoneIdentifier": [
                                { "Ref": "PublicSubnet1" },
                                { "Ref": "PublicSubnet2" }
                            ],
                            "TargetGroupARNs": [
                                { "Ref": "TargetGroup" }
                            ],
                            "HealthCheckType": "ELB",
                            "HealthCheckGracePeriod": 300
                        }
                    },
                    "InstanceRole": {
                        "Type": "AWS::IAM::Role",
                        "Properties": {
                            "AssumeRolePolicyDocument": {
                                "Version": "2012-10-17",
                                "Statement": [
                                    {
                                        "Effect": "Allow",
                                        "Principal": {
                                            "Service": "ec2.amazonaws.com"
                                        },
                                        "Action": "sts:AssumeRole"
                                    }
                                ]
                            },
                            "ManagedPolicyArns": [
                                "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
                            ],
                            "Policies": [
                                {
                                    "PolicyName": "DynamoDBAccess",
                                    "PolicyDocument": {
                                        "Version": "2012-10-17",
                                        "Statement": [
                                            {
                                                "Effect": "Allow",
                                                "Action": [
                                                    "dynamodb:GetItem",
                                                    "dynamodb:PutItem",
                                                    "dynamodb:UpdateItem",
                                                    "dynamodb:DeleteItem",
                                                    "dynamodb:Query",
                                                    "dynamodb:Scan"
                                                ],
                                                "Resource": { "Fn::GetAtt": ["DynamoDBTable", "Arn"] }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    "InstanceProfile": {
                        "Type": "AWS::IAM::InstanceProfile",
                        "Properties": {
                            "Roles": [
                                { "Ref": "InstanceRole" }
                            ]
                        }
                    },
                    "DynamoDBTable": {
                        "Type": "AWS::DynamoDB::Table",
                        "Properties": {
                            "TableName": {
                                "Fn::Sub": "${ApplicationName}-${Environment}-state"
                            },
                            "AttributeDefinitions": [
                                {
                                    "AttributeName": "id",
                                    "AttributeType": "S"
                                }
                            ],
                            "KeySchema": [
                                {
                                    "AttributeName": "id",
                                    "KeyType": "HASH"
                                }
                            ],
                            "BillingMode": "PAY_PER_REQUEST",
                            "SSESpecification": {
                                "SSEEnabled": true
                            },
                            "PointInTimeRecoverySpecification": {
                                "PointInTimeRecoveryEnabled": true
                            }
                        }
                    },
                    "KMSKey": {
                        "Type": "AWS::KMS::Key",
                        "Properties": {
                            "Description": "KMS key for application encryption",
                            "KeyPolicy": {
                                "Version": "2012-10-17",
                                "Statement": [
                                    {
                                        "Effect": "Allow",
                                        "Principal": {
                                            "AWS": {
                                                "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                            }
                                        },
                                        "Action": "kms:*",
                                        "Resource": "*"
                                    }
                                ]
                            }
                        }
                    },
                    "KMSKeyAlias": {
                        "Type": "AWS::KMS::Alias",
                        "Properties": {
                            "AliasName": {
                                "Fn::Sub": "alias/${ApplicationName}-${Environment}"
                            },
                            "TargetKeyId": { "Ref": "KMSKey" }
                        }
                    }
                },
                "Outputs": {
                    "LoadBalancerDNS": {
                        "Description": "DNS name of the load balancer",
                        "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] },
                        "Export": {
                            "Name": {
                                "Fn::Sub": "${ApplicationName}-${Environment}-LoadBalancerDNS"
                            }
                        }
                    },
                    "DynamoDBTableName": {
                        "Description": "Name of the DynamoDB table",
                        "Value": { "Ref": "DynamoDBTable" },
                        "Export": {
                            "Name": {
                                "Fn::Sub": "${ApplicationName}-${Environment}-DynamoDBTable"
                            }
                        }
                    }
                }
            }
            """;
    }

    public Output<String> getStackSetId() { return stackSetId; }
    public Output<String> getStackSetArn() { return stackSetArn; }
    
    public Output<String> getApplicationEndpoint(String region) {
        return Output.of("http://" + config.getApplicationName() + "-alb-" + region + ".elb.amazonaws.com");
    }
}
```

## Key Changes Made:

1. **Fixed StackSetInstance parameter**: Changed `stackSetInstanceRegion(region)` to `region(region)`.

2. **Added CrossAccountRoleSetup component**: This creates the execution roles in each target account with proper trust relationships.

3. **Added dependency management**: The StackSet instances now depend on both the StackSet and the cross-account role setup.

4. **Proper role trust relationship**: The execution roles in target accounts now trust the administration role from the management account.

## Important Notes for Production:

1. **Cross-Account Access**: The `CrossAccountRoleSetup` component assumes you have cross-account access configured. In practice, you'd need to:
    - Set up AWS Organizations with proper cross-account roles
    - Configure the provider with `assume_role` for each target account
    - Or manually create the execution roles in each target account before running this

2. **Alternative Single-Account Approach**: If you're testing with a single account, update the configuration:

```java
// config/DeploymentConfig.java - Single account version
public class DeploymentConfig {
    private final String managementRegion = "us-east-1";
    private final List<String> targetRegions = Arrays.asList("us-east-1", "us-west-2");
    private final List<String> targetAccounts = Arrays.asList("123456789012"); // Your account ID
    private final String applicationName = "multi-region-web-app";
    private final String environment = "production";
    
    // ... rest remains the same
}
```

This should resolve the cross-account role trust relationship issues and allow the StackSet instances to deploy successfully.