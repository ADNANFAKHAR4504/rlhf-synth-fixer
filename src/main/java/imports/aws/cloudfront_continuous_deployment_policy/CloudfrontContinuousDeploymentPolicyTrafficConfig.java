package imports.aws.cloudfront_continuous_deployment_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.229Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontContinuousDeploymentPolicy.CloudfrontContinuousDeploymentPolicyTrafficConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontContinuousDeploymentPolicyTrafficConfig.Jsii$Proxy.class)
public interface CloudfrontContinuousDeploymentPolicyTrafficConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#type CloudfrontContinuousDeploymentPolicy#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * single_header_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#single_header_config CloudfrontContinuousDeploymentPolicy#single_header_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSingleHeaderConfig() {
        return null;
    }

    /**
     * single_weight_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#single_weight_config CloudfrontContinuousDeploymentPolicy#single_weight_config}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSingleWeightConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontContinuousDeploymentPolicyTrafficConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontContinuousDeploymentPolicyTrafficConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontContinuousDeploymentPolicyTrafficConfig> {
        java.lang.String type;
        java.lang.Object singleHeaderConfig;
        java.lang.Object singleWeightConfig;

        /**
         * Sets the value of {@link CloudfrontContinuousDeploymentPolicyTrafficConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#type CloudfrontContinuousDeploymentPolicy#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontContinuousDeploymentPolicyTrafficConfig#getSingleHeaderConfig}
         * @param singleHeaderConfig single_header_config block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#single_header_config CloudfrontContinuousDeploymentPolicy#single_header_config}
         * @return {@code this}
         */
        public Builder singleHeaderConfig(com.hashicorp.cdktf.IResolvable singleHeaderConfig) {
            this.singleHeaderConfig = singleHeaderConfig;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontContinuousDeploymentPolicyTrafficConfig#getSingleHeaderConfig}
         * @param singleHeaderConfig single_header_config block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#single_header_config CloudfrontContinuousDeploymentPolicy#single_header_config}
         * @return {@code this}
         */
        public Builder singleHeaderConfig(java.util.List<? extends imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleHeaderConfig> singleHeaderConfig) {
            this.singleHeaderConfig = singleHeaderConfig;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontContinuousDeploymentPolicyTrafficConfig#getSingleWeightConfig}
         * @param singleWeightConfig single_weight_config block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#single_weight_config CloudfrontContinuousDeploymentPolicy#single_weight_config}
         * @return {@code this}
         */
        public Builder singleWeightConfig(com.hashicorp.cdktf.IResolvable singleWeightConfig) {
            this.singleWeightConfig = singleWeightConfig;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontContinuousDeploymentPolicyTrafficConfig#getSingleWeightConfig}
         * @param singleWeightConfig single_weight_config block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#single_weight_config CloudfrontContinuousDeploymentPolicy#single_weight_config}
         * @return {@code this}
         */
        public Builder singleWeightConfig(java.util.List<? extends imports.aws.cloudfront_continuous_deployment_policy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfig> singleWeightConfig) {
            this.singleWeightConfig = singleWeightConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontContinuousDeploymentPolicyTrafficConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontContinuousDeploymentPolicyTrafficConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontContinuousDeploymentPolicyTrafficConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontContinuousDeploymentPolicyTrafficConfig {
        private final java.lang.String type;
        private final java.lang.Object singleHeaderConfig;
        private final java.lang.Object singleWeightConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.singleHeaderConfig = software.amazon.jsii.Kernel.get(this, "singleHeaderConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.singleWeightConfig = software.amazon.jsii.Kernel.get(this, "singleWeightConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.singleHeaderConfig = builder.singleHeaderConfig;
            this.singleWeightConfig = builder.singleWeightConfig;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Object getSingleHeaderConfig() {
            return this.singleHeaderConfig;
        }

        @Override
        public final java.lang.Object getSingleWeightConfig() {
            return this.singleWeightConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getSingleHeaderConfig() != null) {
                data.set("singleHeaderConfig", om.valueToTree(this.getSingleHeaderConfig()));
            }
            if (this.getSingleWeightConfig() != null) {
                data.set("singleWeightConfig", om.valueToTree(this.getSingleWeightConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontContinuousDeploymentPolicy.CloudfrontContinuousDeploymentPolicyTrafficConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontContinuousDeploymentPolicyTrafficConfig.Jsii$Proxy that = (CloudfrontContinuousDeploymentPolicyTrafficConfig.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.singleHeaderConfig != null ? !this.singleHeaderConfig.equals(that.singleHeaderConfig) : that.singleHeaderConfig != null) return false;
            return this.singleWeightConfig != null ? this.singleWeightConfig.equals(that.singleWeightConfig) : that.singleWeightConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.singleHeaderConfig != null ? this.singleHeaderConfig.hashCode() : 0);
            result = 31 * result + (this.singleWeightConfig != null ? this.singleWeightConfig.hashCode() : 0);
            return result;
        }
    }
}
