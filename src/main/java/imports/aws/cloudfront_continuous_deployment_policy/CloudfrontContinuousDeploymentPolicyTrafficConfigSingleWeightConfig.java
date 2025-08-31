package imports.aws.cloudfront_continuous_deployment_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.229Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontContinuousDeploymentPolicy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig.Jsii$Proxy.class)
public interface CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#weight CloudfrontContinuousDeploymentPolicy#weight}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getWeight();

    /**
     * session_stickiness_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#session_stickiness_config CloudfrontContinuousDeploymentPolicy#session_stickiness_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSessionStickinessConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig> {
        java.lang.Number weight;
        java.lang.Object sessionStickinessConfig;

        /**
         * Sets the value of {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig#getWeight}
         * @param weight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#weight CloudfrontContinuousDeploymentPolicy#weight}. This parameter is required.
         * @return {@code this}
         */
        public Builder weight(java.lang.Number weight) {
            this.weight = weight;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig#getSessionStickinessConfig}
         * @param sessionStickinessConfig session_stickiness_config block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#session_stickiness_config CloudfrontContinuousDeploymentPolicy#session_stickiness_config}
         * @return {@code this}
         */
        public Builder sessionStickinessConfig(com.hashicorp.cdktf.IResolvable sessionStickinessConfig) {
            this.sessionStickinessConfig = sessionStickinessConfig;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig#getSessionStickinessConfig}
         * @param sessionStickinessConfig session_stickiness_config block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#session_stickiness_config CloudfrontContinuousDeploymentPolicy#session_stickiness_config}
         * @return {@code this}
         */
        public Builder sessionStickinessConfig(java.util.List<? extends imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig> sessionStickinessConfig) {
            this.sessionStickinessConfig = sessionStickinessConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig {
        private final java.lang.Number weight;
        private final java.lang.Object sessionStickinessConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.weight = software.amazon.jsii.Kernel.get(this, "weight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sessionStickinessConfig = software.amazon.jsii.Kernel.get(this, "sessionStickinessConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.weight = java.util.Objects.requireNonNull(builder.weight, "weight is required");
            this.sessionStickinessConfig = builder.sessionStickinessConfig;
        }

        @Override
        public final java.lang.Number getWeight() {
            return this.weight;
        }

        @Override
        public final java.lang.Object getSessionStickinessConfig() {
            return this.sessionStickinessConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("weight", om.valueToTree(this.getWeight()));
            if (this.getSessionStickinessConfig() != null) {
                data.set("sessionStickinessConfig", om.valueToTree(this.getSessionStickinessConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontContinuousDeploymentPolicy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig.Jsii$Proxy that = (CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig.Jsii$Proxy) o;

            if (!weight.equals(that.weight)) return false;
            return this.sessionStickinessConfig != null ? this.sessionStickinessConfig.equals(that.sessionStickinessConfig) : that.sessionStickinessConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.weight.hashCode();
            result = 31 * result + (this.sessionStickinessConfig != null ? this.sessionStickinessConfig.hashCode() : 0);
            return result;
        }
    }
}
