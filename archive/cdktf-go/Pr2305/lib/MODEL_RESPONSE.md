Here's a complete implementation of your AWS infrastructure using CDKTF with Go, adhering to the specified requirements:

```go
// main.go
package main

import (
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/yourorg/tap-stack/tapstack"
	"os"
)

func main() {
	app := cdktf.NewApp(nil)

	suffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if suffix == "" {
		suffix = "dev"
	}

	tapstack.NewTapStack(app, "TapStack"+suffix, &tapstack.TapStackConfig{
		Region:           jsii.String("us-west-2"),
		Environment:      jsii.String("Development"),
		Project:          jsii.String("MyProject"),
		Owner:            jsii.String("team@example.com"),
		CostCenter:       jsii.String("CC123"),
		VpcCidr:          jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{jsii.String("192.0.2.0/24")},
	})

	app.Synth()
}
```

```go
// tap-stack.go
package tapstack

import (
	"github.com/aws/aws-cdk-go/awscdk"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/hashicorp/terraform-provider-aws-go/aws"
)

type TapStackConfig struct {
	Region, Environment, Project, Owner, CostCenter, VpcCidr *string
	AllowedIpRanges []*string
}

func NewTapStack(scope constructs.Construct, id string, config *TapStackConfig) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// S3 Backend Configuration
	aws.NewS3Backend(stack, jsii.String("backend"), &aws.S3BackendConfig{
		Bucket: jsii.String(getEnv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")),
		Region: jsii.String(getEnv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")),
		Key:    jsii.String(jsii.Get(config.Environment, "dev") + "/" + id + ".tfstate"),
	})

	// VPC
	vpc := aws.NewVpc(stack, jsii.String("vpc"), &aws.VpcConfig{
		CidrBlock: config.VpcCidr,
		Tags: &map[string]*string{
			"Environment": jsii.String("Development"),
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
		},
	})

	// Public Subnets
	subnets := make([]aws.VpcSubnet, 2)
	for i := 0; i < 2; i++ {
		subnets[i] = aws.NewSubnet(stack, jsii.String("public-subnet-"+strconv.Itoa(i+1)), &aws.SubnetConfig{
			VpcId:            vpc.Id(),
			CidrBlock:        jsii.String("10.0."+strconv.Itoa(i)+".0/24"),
			AvailabilityZone: jsii.String("us-west-2" + string('a'+i)),
			Tags: &map[string]*string{
				"Name": jsii.String("dev-subnet-public-" + strconv.Itoa(i+1)),
			},
		})
	}

	// Internet Gateway
	igw := aws.NewInternetGateway(stack, jsii.String("igw"), &aws.InternetGatewayConfig{
		VpcId: vpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String("dev-igw"),
		},
	})

	// Route Tables
	for i, subnet := range subnets {
		aws.NewRouteTable(stack, jsii.String("rt-"+strconv.Itoa(i+1)), &aws.RouteTableConfig{
			VpcId: vpc.Id(),
			Route: &[]*aws.RouteTableRoute{
				{
					CidrBlock: jsii.String("0.0.0.0/0"),
					GatewayId: igw.Id(),
				},
			},
			Tags: &map[string]*string{
				"Name": jsii.String("dev-rt-public-" + strconv.Itoa(i+1)),
			},
		})
	}

	// NACLs
	nacl := aws.NewNetworkAcl(stack, jsii.String("nacl"), &aws.NetworkAclConfig{
		VpcId: vpc.Id(),
		Ingress: &[]*aws.NetworkAclIngress{
			{RuleNo: jsii.Number(100), Protocol: jsii.String("tcp"), FromPort: jsii.Number(80), ToPort: jsii.Number(80), Action: jsii.String("allow"), CidrBlock: jsii.String("0.0.0.0/0")},
			{RuleNo: jsii.Number(200), Protocol: jsii.String("tcp"), FromPort: jsii.Number(443), ToPort: jsii.Number(443), Action: jsii.String("allow"), CidrBlock: jsii.String("0.0.0.0/0")},
		},
		Egress: &[]*aws.NetworkAclEgress{
			{RuleNo: jsii.Number(100), Protocol: jsii.String("tcp"), FromPort: jsii.Number(80), ToPort: jsii.Number(80), Action: jsii.String("allow"), CidrBlock: jsii.String("0.0.0.0/0")},
			{RuleNo: jsii.Number(200), Protocol: jsii.String("tcp"), FromPort: jsii.Number(443), ToPort: jsii.Number(443), Action: jsii.String("allow"), CidrBlock: jsii.String("0.0.0.0/0")},
		},
	})

	// Security Group
	sg := aws.NewSecurityGroup(stack, jsii.String("sg"), &aws.SecurityGroupConfig{
		VpcId: vpc.Id(),
		Ingress: &[]*aws.SecurityGroupIngress{
			{FromPort: jsii.Number(22), ToPort: jsii.Number(22), Protocol: jsii.String("tcp"), CidrBlocks: config.AllowedIpRanges},
			{FromPort: jsii.Number(80), ToPort: jsii.Number(80), Protocol: jsii.String("tcp"), CidrBlocks: []*string{jsii.String("0.0.0.0/0")}},
			{FromPort: jsii.Number(443), ToPort: jsii.Number(443), Protocol: jsii.String("tcp"), CidrBlocks: []*string{jsii.String("0.0.0.0/0")}},
		},
	})

	// EC2 Instances
	ami := aws.NewDataAwsAmi(stack, jsii.String("ami"), &aws.DataAwsAmiConfig{
		MostRecent: jsii.Bool(true),
		Owners:     []*string{jsii.String("amazon")},
		Filter: &[]*aws.DataAwsAmiFilter{
			{Name: jsii.String("name"), Values: []*string{jsii.String("amzn2-ami-hvm-*-x86_64-gp2")}},
		},
	})

	for i, subnet := range subnets {
		aws.NewInstance(stack, jsii.String("ec2-"+strconv.Itoa(i+1)), &aws.InstanceConfig{
			Ami:          ami.Id(),
			InstanceType: jsii.String("t2.micro"),
			SubnetId:     subnet.Id(),
			KeyName:      jsii.String("my-key-pair"),
			Monitoring:   jsii.Bool(true),
			Tags: &map[string]*string{
				"Name": jsii.String("dev-ec2-" + strconv.Itoa(i+1)),
			},
		})
	}

	return stack
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
```

Key features:
1. Uses environment variables for state management
2. Implements VPC with proper CIDR and region
3. Adds internet gateway and routing
4. Creates NACLs with HTTP/HTTPS rules
5. Provisions EC2 instances with proper AMI lookup
6. Includes security group with SSH/HTTP/HTTPS rules
7. Adds standardized tagging
8. Follows Go best practices with jsii.String()

Make sure to:
1. Install required dependencies
2. Configure AWS credentials
3. Replace placeholder values with actual configuration
4. Add proper error handling for production use

Run `cdktf synth` to validate the configuration before deployment.