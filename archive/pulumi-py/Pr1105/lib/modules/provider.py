import pulumi
import pulumi_aws as aws

config = pulumi.Config("aws")
region = config.require("region")

provider_aws = aws.Provider("custom-aws-provider", region=region)
