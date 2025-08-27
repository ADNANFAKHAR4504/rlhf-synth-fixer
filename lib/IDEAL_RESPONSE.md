package lib

import (
"github.com/aws/aws-cdk-go/awscdk/v2"
"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
"github.com/aws/constructs-go/constructs/v10"
"github.com/aws/jsii-runtime-go"
)

type TapStackProps struct {
awscdk.StackProps
}

func NewTapStack(scope constructs.Construct, id string, props \*TapStackProps) awscdk.Stack {
var sprops awscdk.StackProps
if props != nil {
sprops = props.StackProps
}
stack := awscdk.NewStack(scope, jsii.String(id), &sprops)

    awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String("Production"), nil)
    awscdk.Tags_Of(stack).Add(jsii.String("Department"), jsii.String("IT"), nil)

    vpc := awsec2.NewVpc(stack, jsii.String("ITProductionVPC"), &awsec2.VpcProps{
    	MaxAzs: jsii.Number(2),
    	SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
    		{
    			Name:       jsii.String("PublicSubnet"),
    			SubnetType: awsec2.SubnetType_PUBLIC,
    			CidrMask:   jsii.Number(24),
    		},
    		{
    			Name:       jsii.String("PrivateSubnet"),
    			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
    			CidrMask:   jsii.Number(24),
    		},
    	},
    	EnableDnsHostnames: jsii.Bool(true),
    	EnableDnsSupport:   jsii.Bool(true),
    	NatGateways:        jsii.Number(0),
    })

    webServerSG := awsec2.NewSecurityGroup(stack, jsii.String("WebServerSecurityGroup"), &awsec2.SecurityGroupProps{
    	Vpc:              vpc,
    	AllowAllOutbound: jsii.Bool(true),
    })

    webServerSG.AddIngressRule(
    	awsec2.Peer_AnyIpv4(),
    	awsec2.Port_Tcp(jsii.Number(443)),
    	jsii.String("Allow HTTPS from internet"),
    	jsii.Bool(false),
    )

    databaseSG := awsec2.NewSecurityGroup(stack, jsii.String("DatabaseSecurityGroup"), &awsec2.SecurityGroupProps{
    	Vpc:              vpc,
    	AllowAllOutbound: jsii.Bool(false),
    })

    databaseSG.AddIngressRule(
    	webServerSG,
    	awsec2.Port_Tcp(jsii.Number(5432)),
    	jsii.String("Allow PostgreSQL from web server only"),
    	jsii.Bool(false),
    )

    ec2Role := awsiam.NewRole(stack, jsii.String("WebServerRole"), &awsiam.RoleProps{
    	AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
    	ManagedPolicies: &[]awsiam.IManagedPolicy{
    		awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
    	},
    })

    amazonLinuxAmi := awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
    	CpuType: awsec2.AmazonLinuxCpuType_X86_64,
    })

    webServer := awsec2.NewInstance(stack, jsii.String("WebServerInstance"), &awsec2.InstanceProps{
    	InstanceType: awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
    	MachineImage: amazonLinuxAmi,
    	Vpc:          vpc,
    	VpcSubnets: &awsec2.SubnetSelection{
    		SubnetType: awsec2.SubnetType_PUBLIC,
    	},
    	SecurityGroup: webServerSG,
    	Role:          ec2Role,
    	UserData: awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{
    		Shebang: jsii.String("#!/bin/bash"),
    	}),
    })

    webServer.UserData().AddCommands(
    	jsii.String("yum update -y"),
    	jsii.String("yum install -y amazon-cloudwatch-agent"),
    )

    dbSubnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("DatabaseSubnetGroup"), &awsrds.SubnetGroupProps{
    	Vpc: vpc,
    	VpcSubnets: &awsec2.SubnetSelection{
    		SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
    	},
    })

    database := awsrds.NewDatabaseInstance(stack, jsii.String("PostgreSQLDatabase"), &awsrds.DatabaseInstanceProps{
    	Engine: awsrds.DatabaseInstanceEngine_Postgres(&awsrds.PostgresInstanceEngineProps{
    		Version: awsrds.PostgresEngineVersion_VER_15(),
    	}),
    	InstanceType: awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MICRO),
    	Vpc:          vpc,
    	SubnetGroup:  dbSubnetGroup,
    	SecurityGroups: &[]awsec2.ISecurityGroup{
    		databaseSG,
    	},
    	StorageEncrypted:           jsii.Bool(true),
    	DatabaseName:               jsii.String("production_db"),
    	Credentials:                awsrds.Credentials_FromGeneratedSecret(jsii.String("dbadmin"), &awsrds.CredentialsBaseOptions{}),
    	AllocatedStorage:           jsii.Number(20),
    	StorageType:                awsrds.StorageType_GP2,
    	BackupRetention:            awscdk.Duration_Days(jsii.Number(7)),
    	DeleteAutomatedBackups:     jsii.Bool(false),
    	DeletionProtection:         jsii.Bool(true),
    	MultiAz:                    jsii.Bool(false),
    	PreferredBackupWindow:      jsii.String("03:00-04:00"),
    	PreferredMaintenanceWindow: jsii.String("sun:04:00-sun:05:00"),
    })

    awscdk.NewCfnOutput(stack, jsii.String("VPCId"), &awscdk.CfnOutputProps{
    	Value: vpc.VpcId(),
    })

    awscdk.NewCfnOutput(stack, jsii.String("WebServerInstanceId"), &awscdk.CfnOutputProps{
    	Value: webServer.InstanceId(),
    })

    awscdk.NewCfnOutput(stack, jsii.String("WebServerPublicIP"), &awscdk.CfnOutputProps{
    	Value: webServer.InstancePublicIp(),
    })

    awscdk.NewCfnOutput(stack, jsii.String("DatabaseEndpoint"), &awscdk.CfnOutputProps{
    	Value: database.InstanceEndpoint().Hostname(),
    })

    awscdk.NewCfnOutput(stack, jsii.String("DatabaseIdentifier"), &awscdk.CfnOutputProps{
    	Value: database.InstanceIdentifier(),
    })

    awscdk.NewCfnOutput(stack, jsii.String("DatabaseSecretArn"), &awscdk.CfnOutputProps{
    	Value: database.Secret().SecretArn(),
    })

    return stack

}

````

```go
package main

import (
	"os"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	lib.NewTapStack(app, "TapStack", &lib.TapStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

func env() *awscdk.Environment {
	account := os.Getenv("CDK_DEFAULT_ACCOUNT")
	region := os.Getenv("CDK_DEFAULT_REGION")

	if region == "" {
		region = "us-east-1"
	}

	var accountPtr *string
	if account != "" {
		accountPtr = jsii.String(account)
	}

	return &awscdk.Environment{
		Account: accountPtr,
		Region:  jsii.String(region),
	}
}
````
