package stack

import (
	"strings"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/dynamodb"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

func CreateTapStack(ctx *pulumi.Context) error {
	cfg := config.New(ctx, "")
	projectName := cfg.Get("projectName")
	if projectName == "" {
		projectName = "tap"
	}
	environment := cfg.Get("environment")
	if environment == "" {
		environment = "dev"
	}

	// For PR environments, also check stack name if environment doesn't start with "pr"
	stackName := ctx.Stack()
	isPREnv := strings.HasPrefix(environment, "pr") || strings.Contains(stackName, "pr")
	notificationEmail := cfg.Get("notificationEmail")
	if notificationEmail == "" {
		notificationEmail = "noreply@example.com"
	}
	vpcCidr := cfg.Get("vpcCidr")
	if vpcCidr == "" {
		vpcCidr = "10.0.0.0/16"
	}
	asgMinSize := cfg.GetInt("asgMinSize")
	if asgMinSize == 0 {
		asgMinSize = 2
	}
	asgMaxSize := cfg.GetInt("asgMaxSize")
	if asgMaxSize == 0 {
		asgMaxSize = 10
	}
	dbInstanceClass := cfg.Get("dbInstanceClass")
	if dbInstanceClass == "" {
		dbInstanceClass = "db.t3.micro"
	}

	tags := pulumi.StringMap{
		"Environment": pulumi.String(environment),
		"Project":     pulumi.String(projectName),
	}

	current, err := aws.GetCallerIdentity(ctx, nil, nil)
	if err != nil {
		return err
	}

	usEast1Provider, err := aws.NewProvider(ctx, "us-east-1", &aws.ProviderArgs{Region: pulumi.String("us-east-1")})
	if err != nil {
		return err
	}
	euWest1Provider, err := aws.NewProvider(ctx, "eu-west-1", &aws.ProviderArgs{Region: pulumi.String("eu-west-1")})
	if err != nil {
		return err
	}

	// DynamoDB Global Table in primary region. Do NOT include the primary region in Replicas.
	dynamoTable, err := dynamodb.NewTable(ctx, "global-table", &dynamodb.TableArgs{
		Name:        pulumi.Sprintf("%s-%s-global", projectName, environment),
		BillingMode: pulumi.String("PAY_PER_REQUEST"),
		Attributes: dynamodb.TableAttributeArray{
			&dynamodb.TableAttributeArgs{Name: pulumi.String("id"), Type: pulumi.String("S")},
		},
		HashKey: pulumi.String("id"),
		Replicas: dynamodb.TableReplicaTypeArray{
			&dynamodb.TableReplicaTypeArgs{RegionName: pulumi.String("eu-west-1")},
		},
		StreamEnabled:  pulumi.Bool(true),
		StreamViewType: pulumi.String("NEW_AND_OLD_IMAGES"),
		Tags:           tags,
	}, pulumi.Provider(usEast1Provider))
	if err != nil {
		return err
	}

	usEast1Infra, err := createRegionalInfra(ctx, "us-east-1", usEast1Provider, projectName, environment, vpcCidr, asgMinSize, asgMaxSize, dbInstanceClass, tags, current.AccountId, isPREnv)
	if err != nil {
		return err
	}
	euWest1Infra, err := createRegionalInfra(ctx, "eu-west-1", euWest1Provider, projectName, environment, vpcCidr, asgMinSize, asgMaxSize, dbInstanceClass, tags, current.AccountId, isPREnv)
	if err != nil {
		return err
	}

	if err := createS3Replication(ctx, usEast1Provider, euWest1Provider, usEast1Infra.DataBucketName, euWest1Infra.DataBucketName, projectName, environment, tags, current.AccountId); err != nil {
		return err
	}
	cfDomain, err := createCloudFront(ctx, usEast1Provider, usEast1Infra.DataBucketName, projectName, environment, tags, isPREnv)
	if err != nil {
		return err
	}
	if err := createMonitoring(ctx, usEast1Provider, euWest1Provider, projectName, environment, notificationEmail, tags, current.AccountId, isPREnv); err != nil {
		return err
	}

	ctx.Export("usEast1AlbDnsName", usEast1Infra.AlbDnsName)
	ctx.Export("euWest1AlbDnsName", euWest1Infra.AlbDnsName)
	ctx.Export("cloudfrontDomain", cfDomain)
	ctx.Export("usEast1DataBucket", usEast1Infra.DataBucketName)
	ctx.Export("usEast1LogBucket", usEast1Infra.LogBucketName)
	ctx.Export("euWest1DataBucket", euWest1Infra.DataBucketName)
	ctx.Export("euWest1LogBucket", euWest1Infra.LogBucketName)
	ctx.Export("dynamoTableName", dynamoTable.Name)
	ctx.Export("usEast1RdsEndpoint", usEast1Infra.RdsEndpoint)
	ctx.Export("euWest1RdsEndpoint", euWest1Infra.RdsEndpoint)
	ctx.Export("usEast1VpcId", usEast1Infra.VpcId)
	ctx.Export("euWest1VpcId", euWest1Infra.VpcId)
	return nil
}
