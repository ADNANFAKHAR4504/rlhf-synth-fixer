package main

import (
	"fmt"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ssm"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func createParameterStoreParams(ctx *pulumi.Context, environmentSuffix string) ([]pulumi.StringOutput, error) {
	var params []pulumi.StringOutput

	// Database connection parameters
	dbHost, err := ssm.NewParameter(ctx, fmt.Sprintf("param-db-host-%s", environmentSuffix), &ssm.ParameterArgs{
		Name:  pulumi.Sprintf("/ecs/%s/database/host", environmentSuffix),
		Type:  pulumi.String("String"),
		Value: pulumi.String("db.example.com"),
		Tags: pulumi.StringMap{
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}
	params = append(params, dbHost.Name)

	dbName, err := ssm.NewParameter(ctx, fmt.Sprintf("param-db-name-%s", environmentSuffix), &ssm.ParameterArgs{
		Name:  pulumi.Sprintf("/ecs/%s/database/name", environmentSuffix),
		Type:  pulumi.String("String"),
		Value: pulumi.String("fintech_db"),
		Tags: pulumi.StringMap{
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}
	params = append(params, dbName.Name)

	// Application configuration
	appPort, err := ssm.NewParameter(ctx, fmt.Sprintf("param-app-port-%s", environmentSuffix), &ssm.ParameterArgs{
		Name:  pulumi.Sprintf("/ecs/%s/app/port", environmentSuffix),
		Type:  pulumi.String("String"),
		Value: pulumi.String("8080"),
		Tags: pulumi.StringMap{
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}
	params = append(params, appPort.Name)

	logLevel, err := ssm.NewParameter(ctx, fmt.Sprintf("param-log-level-%s", environmentSuffix), &ssm.ParameterArgs{
		Name:  pulumi.Sprintf("/ecs/%s/app/log-level", environmentSuffix),
		Type:  pulumi.String("String"),
		Value: pulumi.String("INFO"),
		Tags: pulumi.StringMap{
			"Environment": pulumi.String(environmentSuffix),
			"Service":     pulumi.String("ecs"),
			"Team":        pulumi.String("platform"),
		},
	})
	if err != nil {
		return nil, err
	}
	params = append(params, logLevel.Name)

	return params, nil
}
