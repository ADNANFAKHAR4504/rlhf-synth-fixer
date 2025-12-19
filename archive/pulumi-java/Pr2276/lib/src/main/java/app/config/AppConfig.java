package app.config;

import com.pulumi.Config;
import com.pulumi.Context;

public class AppConfig {

    private final Config config;

    public AppConfig(final Context ctx) {
        this.config = ctx.config();
    }

    public String getDefaultEnvironment() {
        return config.require("environment");
    }

    public String getPrimaryRegion() {
        return config.require("primaryRegion");
    }

    public String getSecondaryRegion() {
        return config.require("secondaryRegion");
    }

    // Network
    public String getVpcCidrBlock() {
        return config.require("vpcCidrBlock");
    }

    public String getPublicSubnetPrimaryCidr() {
        return config.require("publicSubnetPrimaryCidr");
    }

    public String getPublicSubnetSecondaryCidr() {
        return config.require("publicSubnetSecondaryCidr");
    }

    public String getEc2AmiName() {
        return config.require("amiName");
    }

    public String getEc2InstanceType() {
        return config.require("instanceType");
    }

    public String getPrivateSubnetPrimaryCidr() {
        return config.require("privateSubnetPrimaryCidr");
    }

    public String getPrivateSubnetSecondaryCidr() {
        return config.require("privateSubnetSecondaryCidr");
    }

    public String getS3BucketNamePrefix() {
        return config.require("bucketNamePrefix");
    }

    public String getS3WebsiteIndexDocument() {
        return config.require("websiteIndexDocument");
    }

    public String getS3WebsiteErrorDocument() {
        return config.require("websiteErrorDocument");
    }

    public String getProjectName() {
        return config.require("projectName");
    }
}