## tap-stack.go

```go
package main

import (
	"fmt"
	"os"
	"strconv"

	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsami"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/instance"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/networkacl"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

type TapStackConfig struct {
	Region          *string
	Environment     *string
	Project         *string
	Owner           *string
	CostCenter      *string
	VpcCidr         *string
	AllowedIpRanges []*string
}

func NewTapStack(scope cdktf.App, id *string, config *TapStackConfig) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, id)

	// Get environment suffix
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}
	environmentSuffix = fmt.Sprintf("cdktf-%s", environmentSuffix)

	// AWS Provider
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: config.Region,
		DefaultTags: &[]*provider.AwsProviderDefaultTags{
			{
				Tags: &map[string]*string{
					"Environment": config.Environment,
					"Project":     config.Project,
					"Owner":       config.Owner,
					"CostCenter":  config.CostCenter,
					"ManagedBy":   jsii.String("cdktf"),
				},
			},
		},
	})

	// S3 Backend for remote state
	stateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	if stateBucket == "" {
		stateBucket = "iac-rlhf-tf-states"
	}
	stateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")
	if stateBucketRegion == "" {
		stateBucketRegion = "us-east-1"
	}

	cdktf.NewS3Backend(stack, &cdktf.S3BackendConfig{
		Bucket:  jsii.String(stateBucket),
		Key:     jsii.String(fmt.Sprintf("%s/TapStack%s.tfstate", environmentSuffix, environmentSuffix)),
		Region:  jsii.String(stateBucketRegion),
		Encrypt: jsii.Bool(true),
	})

	// VPC
	vpcResource := vpc.NewVpc(stack, jsii.String("vpc"), &vpc.VpcConfig{
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
	subnets := make([]subnet.Subnet, 2)
	routeTables := make([]routetable.RouteTable, 2)

	for i := 0; i < 2; i++ {
		subnets[i] = subnet.NewSubnet(stack, jsii.String("public-subnet-"+strconv.Itoa(i+1)), &subnet.SubnetConfig{
			VpcId:            vpcResource.Id(),
			CidrBlock:        jsii.String("10.0." + strconv.Itoa(i) + ".0/24"),
			AvailabilityZone: jsii.String("us-west-2" + string(rune('a'+i))),
			Tags: &map[string]*string{
				"Name": jsii.String("dev-subnet-public-" + strconv.Itoa(i+1)),
			},
		})
	}

	// Internet Gateway
	igw := internetgateway.NewInternetGateway(stack, jsii.String("igw"), &internetgateway.InternetGatewayConfig{
		VpcId: vpcResource.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String("dev-igw"),
		},
	})

	// Route Tables and Associations
	for i := range subnets {
		routeTables[i] = routetable.NewRouteTable(stack, jsii.String("rt-"+strconv.Itoa(i+1)), &routetable.RouteTableConfig{
			VpcId: vpcResource.Id(),
			Route: &[]*routetable.RouteTableRoute{
				{
					CidrBlock: jsii.String("0.0.0.0/0"),
					GatewayId: igw.Id(),
				},
			},
			Tags: &map[string]*string{
				"Name": jsii.String("dev-rt-public-" + strconv.Itoa(i+1)),
			},
		})

		// Associate route table with subnet
		routetableassociation.NewRouteTableAssociation(stack, jsii.String("rta-"+strconv.Itoa(i+1)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     subnets[i].Id(),
			RouteTableId: routeTables[i].Id(),
		})
	}

	// NACLs
	networkacl.NewNetworkAcl(stack, jsii.String("nacl"), &networkacl.NetworkAclConfig{
		VpcId: vpcResource.Id(),
		Ingress: &[]*networkacl.NetworkAclIngress{
			{RuleNo: jsii.Number(100), Protocol: jsii.String("tcp"), FromPort: jsii.Number(80), ToPort: jsii.Number(80), Action: jsii.String("allow"), CidrBlock: jsii.String("0.0.0.0/0")},
			{RuleNo: jsii.Number(200), Protocol: jsii.String("tcp"), FromPort: jsii.Number(443), ToPort: jsii.Number(443), Action: jsii.String("allow"), CidrBlock: jsii.String("0.0.0.0/0")},
		},
		Egress: &[]*networkacl.NetworkAclEgress{
			{RuleNo: jsii.Number(100), Protocol: jsii.String("tcp"), FromPort: jsii.Number(80), ToPort: jsii.Number(80), Action: jsii.String("allow"), CidrBlock: jsii.String("0.0.0.0/0")},
			{RuleNo: jsii.Number(200), Protocol: jsii.String("tcp"), FromPort: jsii.Number(443), ToPort: jsii.Number(443), Action: jsii.String("allow"), CidrBlock: jsii.String("0.0.0.0/0")},
		},
	})

	// Security Group
	sg := securitygroup.NewSecurityGroup(stack, jsii.String("sg"), &securitygroup.SecurityGroupConfig{
		VpcId: vpcResource.Id(),
		Ingress: &[]*securitygroup.SecurityGroupIngress{
			{FromPort: jsii.Number(22), ToPort: jsii.Number(22), Protocol: jsii.String("tcp"), CidrBlocks: &config.AllowedIpRanges},
			{FromPort: jsii.Number(80), ToPort: jsii.Number(80), Protocol: jsii.String("tcp"), CidrBlocks: &[]*string{jsii.String("0.0.0.0/0")}},
			{FromPort: jsii.Number(443), ToPort: jsii.Number(443), Protocol: jsii.String("tcp"), CidrBlocks: &[]*string{jsii.String("0.0.0.0/0")}},
		},
	})

	// EC2 Instances
	ami := dataawsami.NewDataAwsAmi(stack, jsii.String("ami"), &dataawsami.DataAwsAmiConfig{
		MostRecent: jsii.Bool(true),
		Owners:     &[]*string{jsii.String("amazon")},
		Filter: &[]*dataawsami.DataAwsAmiFilter{
			{Name: jsii.String("name"), Values: &[]*string{jsii.String("amzn2-ami-hvm-*-x86_64-gp2")}},
		},
	})

	for i, subnetResource := range subnets {
		instance.NewInstance(stack, jsii.String("ec2-"+strconv.Itoa(i+1)), &instance.InstanceConfig{
			Ami:                      ami.Id(),
			InstanceType:             jsii.String("t2.micro"),
			SubnetId:                 subnetResource.Id(),
			KeyName:                  jsii.String("rlhf-iac-team2-key"),
			Monitoring:               jsii.Bool(true),
			VpcSecurityGroupIds:      &[]*string{sg.Id()},
			AssociatePublicIpAddress: jsii.Bool(true),
			Tags: &map[string]*string{
				"Name": jsii.String("dev-ec2-" + strconv.Itoa(i+1)),
			},
		})
	}

	// Output Variables
	cdktf.NewTerraformOutput(stack, jsii.String("vpcId"), &cdktf.TerraformOutputConfig{
		Value: vpcResource.Id(),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("subnetIds"), &cdktf.TerraformOutputConfig{
		Value: &[]*string{subnets[0].Id(), subnets[1].Id()},
	})

	return stack
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
```

## main.go

```go
// main.go
package main

import (
	"fmt"
	"os"

	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func main() {
	app := cdktf.NewApp(nil)

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	environmentSuffix = fmt.Sprintf("cdktf-%s", environmentSuffix)

	NewTapStack(app, jsii.String(fmt.Sprintf("TapStack%s", environmentSuffix)), &TapStackConfig{
		Region:          jsii.String("us-west-2"),
		Environment:     jsii.String("Development"),
		Project:         jsii.String("MyProject"),
		Owner:           jsii.String("devops-team"),
		CostCenter:      jsii.String("CC123"),
		VpcCidr:         jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{jsii.String("192.0.2.0/24")},
	})

	app.Synth()
}
```