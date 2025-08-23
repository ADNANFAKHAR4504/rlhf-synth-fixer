package main

import (
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		config := InfrastructureConfig{
			Environment:        "production",
			Regions:            []string{"us-east-1", "us-west-2", "eu-west-1"},
			InstanceType:       "t3.medium",
			DBInstanceClass:    "db.t3.micro",
			DBAllocatedStorage: 20,
			BackupRetention:    7,
			MultiAZ:            true,
			EnableInsights:     true,
		}

		infrastructure := NewMultiRegionInfrastructure(ctx, config)
		return infrastructure.Deploy()
	})
}
