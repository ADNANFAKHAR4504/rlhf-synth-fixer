package app.constructs;

import app.config.Config;
import software.constructs.Construct;

import java.util.List;
import java.util.Map;

public class BaseConstruct extends Construct {

    private final Config config;

    public BaseConstruct(final Construct scope, final String id) {
        super(scope, id);
        this.config = Config.defaultConfig();
    }

    protected Map<String, String> mergeTags(final Map<String, String> additionalTags) {
        return config.mergeWithTags(additionalTags);
    }

    protected String getEnvironment() {
        return config.environment();
    }

    protected String projectName() {
        return config.projectName();
    }

    protected String getVpcCidrBlock() {
        return config.vpcCidrBlock();
    }

    protected List<String> getPublicSubnetCidrs() {
        return config.publicSubnetCidrs();
    }

    protected List<String> getPrivateSubnetCidrs() {
        return config.privateSubnetCidrs();
    }

    protected String getContainerImage() {
        return config.containerImage();
    }

    protected Integer getLambdaMemory() {
        return config.lambdaMemory();
    }

    protected Integer getKinesisShards() {
        return config.kinesisShards();
    }

    protected String getResourcePrefix() {
        return String.format("%s-%s", config.projectName(), config.environment());
    }

    protected Map<String, String> getTags() {
        return config.tags();
    }
}
