```java
// Main.java
package app;

import app.components.CrossAccountRoleSetup;
import app.components.IAMRoles;
import app.components.ObservabilityDashboard;
import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.Provider;
import app.config.DeploymentConfig;
import app.components.WebApplicationStackSet;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.resources.ComponentResourceOptions;

/**
 * Main class for Java Pulumi infrastructure as code.
 * <p>
 * This class demonstrates how to create AWS infrastructure using Pulumi's Java SDK.
 *
 * @version 1.0
 * @since 1.0
 */
public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    /**
     * Main entry point for the Pulumi program.
     * <p>
     * This method defines the infrastructure resources to be created.
     * Pulumi will execute this code to determine what resources to create,
     * update, or delete based on the current state.
     *
     * @param args Command line arguments (not used in this example)
     */
    public static void main(String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    /**
     * Defines the infrastructure resources to be created.
     * <p>
     * This method is separated from main() to make it easier to test
     * and to follow best practices for Pulumi Java programs.
     *
     * @param ctx The Pulumi context for exporting outputs
     */
    static void defineInfrastructure(Context ctx) {

        var config = new DeploymentConfig(ctx);

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
                        .build(), ComponentResourceOptions.Empty);

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
    }
}
```

```java
// config/DeploymentConfig.java
package app.config;


import com.pulumi.Context;

import java.util.List;
import java.util.Map;

public class DeploymentConfig {
    private final String managementRegion;
    private final List<String> targetRegions;
    private final List<String> targetAccounts;
    private final String applicationName;
    private final String environment;
    private final Map<String, String> tags;

    public DeploymentConfig(Context ctx) {

        var config = ctx.config();

        this.managementRegion = config.get("managementRegion").orElse("us-east-1");

        this.targetRegions = config.getObject("targetRegions", String[].class)
                .map(List::of)
                .orElse(List.of("us-east-1", "us-west-2", "eu-west-1"));

        this.targetAccounts = config.getObject("targetAccounts", String[].class)
                .map(List::of)
                .orElse(List.of("123456789012", "123456789013"));

        this.applicationName = config.get("applicationName").orElse("multi-region-web-app");
        this.environment = config.get("environment").orElse("production");

        this.tags = Map.of(
                "Application", applicationName,
                "Environment", environment,
                "ManagedBy", "Pulumi",
                "Project", "MultiRegionWebApp"
        );
    }

    public String getManagementRegion() {
        return managementRegion;
    }

    public List<String> getTargetRegions() {
        return targetRegions;
    }

    public List<String> getTargetAccounts() {
        return targetAccounts;
    }

    public String getApplicationName() {
        return applicationName;
    }

    public String getEnvironment() {
        return environment;
    }

    public Map<String, String> getTags() {
        return tags;
    }
}
```

```java
// components/IAMRoles.java
package app.components;

import com.pulumi.aws.Provider;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.Policy;
import com.pulumi.aws.iam.PolicyArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.core.Either;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

public class IAMRoles extends ComponentResource {
    private final Output<String> administrationRoleArn;
    private final Output<String> executionRoleName;

    public IAMRoles(String name, Provider provider) {
        super("custom:aws:IAMRoles", name, ComponentResourceOptions.builder()
                .provider(provider)
                .build());

        // StackSet Administration Role
        var administrationRole = new Role("stackset-administration-role", RoleArgs.builder()
                .name("AWSCloudFormationStackSetAdministrationRole")
                .assumeRolePolicy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Principal": {
                                        "Service": "cloudformation.amazonaws.com"
                                    },
                                    "Action": "sts:AssumeRole"
                                }
                            ]
                        }
                        """)
                .build(), CustomResourceOptions.builder().parent(this).provider(provider)
                .build());

        // Create custom policy for StackSet administration
        var administrationPolicy = new Policy("stackset-administration-policy", PolicyArgs.builder()
                .name("StackSetAdministrationPolicy")
                .description("Policy for CloudFormation StackSet administration")
                .policy("""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "sts:AssumeRole"
                                    ],
                                    "Resource": [
                                        "arn:aws:iam::*:role/AWSCloudFormationStackSetExecutionRole"
                                    ]
                                }
                            ]
                        }
                        """)
                .build(), CustomResourceOptions.builder().parent(this).provider(provider).build());

        // Attach custom policy to administration role
        new RolePolicyAttachment("stackset-admin-policy-attachment",
                RolePolicyAttachmentArgs.builder()
                        .role(administrationRole.name())
                        .policyArn(administrationPolicy.arn())
                        .build(), CustomResourceOptions.builder().parent(this).provider(provider).build());

        // StackSet Execution Role (to be created in target accounts)
        var executionRole = new Role("stackset-execution-role", RoleArgs.builder()
                .name("AWSCloudFormationStackSetExecutionRole")
                .assumeRolePolicy(administrationRole.arn().applyValue(adminArn -> Either.ofLeft(String.format("""
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
                        """, adminArn))))
                .build(), CustomResourceOptions.builder().parent(this).provider(provider)
                .build());

        // Create custom policy for StackSet execution
        var executionPolicy = new Policy("stackset-execution-policy", PolicyArgs.builder()
                .name("StackSetExecutionPolicy")
                .description("Policy for CloudFormation StackSet execution")
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
                .build(), CustomResourceOptions.builder().parent(this).provider(provider).build());

        // Attach custom policy to execution role
        new RolePolicyAttachment("stackset-exec-policy-attachment",
                RolePolicyAttachmentArgs.builder()
                        .role(executionRole.name())
                        .policyArn(executionPolicy.arn())
                        .build(), CustomResourceOptions.builder().parent(this).provider(provider)
                .build());

        this.administrationRoleArn = administrationRole.arn();
        this.executionRoleName = executionRole.name();
    }

    public Output<String> getAdministrationRoleArn() {
        return administrationRoleArn;
    }

    public Output<String> getExecutionRoleName() {
        return executionRoleName;
    }
}
```

```java
// components/WebApplicationStackSet.java
package app.components;

import com.pulumi.aws.Provider;
import com.pulumi.aws.cloudformation.StackSet;
import com.pulumi.aws.cloudformation.StackSetArgs;
import com.pulumi.aws.cloudformation.StackSetInstance;
import com.pulumi.aws.cloudformation.StackSetInstanceArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import app.config.DeploymentConfig;
import com.pulumi.resources.CustomResourceOptions;

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

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final WebApplicationStackSetArgs args = new WebApplicationStackSetArgs();

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

            public WebApplicationStackSetArgs build() {
                return args;
            }
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
                .build(), CustomResourceOptions.builder().parent(this).provider(provider).build());

        // Deploy StackSet instances across accounts and regions
        // Wait for cross-account setup to complete first
        for (String account : config.getTargetAccounts()) {
            for (String region : config.getTargetRegions()) {
                new StackSetInstance("stackset-instance-" + account + "-" + region,
                        StackSetInstanceArgs.builder()
                                .stackSetName(stackSet.name())
                                .accountId(account)
                                .stackSetInstanceRegion(region) // Use region instead of stackSetInstanceRegion
                                .build(), CustomResourceOptions.builder().parent(this).provider(provider)
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

    public Output<String> getStackSetId() {
        return stackSetId;
    }

    public Output<String> getStackSetArn() {
        return stackSetArn;
    }

    public Output<String> getApplicationEndpoint(String region) {
        return Output.of("http://" + config.getApplicationName() + "-alb-" + region + ".elb.amazonaws.com");
    }
}
```

```java
// components/ObservabilityDashboard.java
package app.components;

import com.pulumi.aws.Provider;
import com.pulumi.aws.cloudwatch.Dashboard;
import com.pulumi.aws.cloudwatch.DashboardArgs;
import com.pulumi.aws.cloudwatch.LogGroup;
import com.pulumi.aws.cloudwatch.LogGroupArgs;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

import java.util.List;
import java.util.Objects;

public class ObservabilityDashboard extends ComponentResource {
    private final Output<String> dashboardUrl;

    public static class ObservabilityDashboardArgs {
        private Output<String> stackSetId;
        private List<String> regions;

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final ObservabilityDashboardArgs args = new ObservabilityDashboardArgs();

            public Builder stackSetId(Output<String> stackSetId) {
                args.stackSetId = stackSetId;
                return this;
            }

            public Builder regions(List<String> regions) {
                args.regions = regions;
                return this;
            }

            public ObservabilityDashboardArgs build() {
                return args;
            }
        }
    }

    public ObservabilityDashboard(String name, ObservabilityDashboardArgs args, Provider provider) {
        super("custom:aws:ObservabilityDashboard", name, ComponentResourceOptions.builder()
                .provider(provider)
                .build());

        // Create log group for application logs
        var logGroup = new LogGroup("web-app-logs", LogGroupArgs.builder()
                .name("/aws/web-application/logs")
                .retentionInDays(30)
                .build(), CustomResourceOptions.builder()
                .parent(this)
                .provider(provider)
                .build());

        // Create CloudWatch dashboard
        var dashboard = new Dashboard("web-app-dashboard", DashboardArgs.builder()
                .dashboardName("WebApplication-MultiRegion-Dashboard")
                .dashboardBody(createDashboardBody(args.regions))
                .build(), CustomResourceOptions.builder()
                .parent(this)
                .provider(provider)
                .build());

        this.dashboardUrl = Output.tuple(
                provider.region(),
                dashboard.dashboardArn(),
                dashboard.dashboardName()
        ).applyValue(values -> {
            assert Objects.requireNonNull(values.t1).isPresent();
            var region = values.t1;
            var dashboardName = (values.t3 != null && !values.t3.isEmpty()) ? values.t3 : "";

            return String.format(
                    "https://console.aws.amazon.com/cloudwatch/home?region=%s#dashboards:name=%s",
                    region, dashboardName
            );
        });
    }

    private String createDashboardBody(List<String> regions) {
        StringBuilder widgets = new StringBuilder();
        widgets.append("\"widgets\": [");

        // Add widgets for each region
        for (int i = 0; i < regions.size(); i++) {
            String region = regions.get(i);
            if (i > 0) widgets.append(",");

            widgets.append(String.format("""
                    {
                        "type": "metric",
                        "x": %d,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "app/multi-region-web-app-alb"],
                                [".", "TargetResponseTime", ".", "."],
                                ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", "multi-region-web-app-asg"]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "%s",
                            "title": "Application Metrics - %s"
                        }
                    }
                    """, (i % 2) * 12, region, region));
        }

        widgets.append("]");

        return String.format("""
                {
                    %s
                }
                """, widgets.toString());
    }

    public Output<String> getDashboardUrl() {
        return dashboardUrl;
    }
}
```

```java
// components/CrossAccountRoleSetup.java
package app.components;

import com.pulumi.aws.Provider;
import com.pulumi.aws.ProviderArgs;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.Policy;
import com.pulumi.aws.iam.PolicyArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.core.Either;
import com.pulumi.core.Output;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import app.config.DeploymentConfig;
import com.pulumi.resources.CustomResourceOptions;

import java.util.ArrayList;
import java.util.List;

public class CrossAccountRoleSetup extends ComponentResource {
    private final List<Output<String>> executionRoleArns;

    public static class CrossAccountRoleSetupArgs {
        private DeploymentConfig config;
        private Output<String> administrationRoleArn;

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private final CrossAccountRoleSetupArgs args = new CrossAccountRoleSetupArgs();

            public Builder config(DeploymentConfig config) {
                args.config = config;
                return this;
            }

            public Builder administrationRoleArn(Output<String> arn) {
                args.administrationRoleArn = arn;
                return this;
            }

            public CrossAccountRoleSetupArgs build() {
                return args;
            }
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
                    .build(), CustomResourceOptions.builder().parent(this).build());

            // Create execution role in target account
            var executionRole = new Role("execution-role-" + accountId, RoleArgs.builder()
                    .name("AWSCloudFormationStackSetExecutionRole-" + accountId)
                    .assumeRolePolicy(args.administrationRoleArn.applyValue(adminArn -> Either.ofLeft(String.format("""
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
                            """, adminArn))))
                    .build(), CustomResourceOptions.builder().parent(this).provider(targetProvider)
                    .build());

            // Create execution policy
            var executionPolicy = new Policy("execution-policy-" + accountId, PolicyArgs.builder()
                    .name("StackSetExecutionPolicy-" + accountId)
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
                    .build(), CustomResourceOptions.builder().parent(this).provider(targetProvider)
                    .build());

            // Attach policy to execution role
            new RolePolicyAttachment("execution-policy-attachment-" + accountId,
                    RolePolicyAttachmentArgs.builder()
                            .role(executionRole.name())
                            .policyArn(executionPolicy.arn())
                            .build(), CustomResourceOptions.builder().parent(this).provider(targetProvider)
                    .build());

            executionRoleArns.add(executionRole.arn());
        }
    }

    public List<Output<String>> getExecutionRoleArns() {
        return executionRoleArns;
    }
}
```
