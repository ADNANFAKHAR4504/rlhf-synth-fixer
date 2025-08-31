package imports.aws.cloudfront_continuous_deployment_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.229Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontContinuousDeploymentPolicy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig.Jsii$Proxy.class)
public interface CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#idle_ttl CloudfrontContinuousDeploymentPolicy#idle_ttl}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getIdleTtl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#maximum_ttl CloudfrontContinuousDeploymentPolicy#maximum_ttl}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaximumTtl();

    /**
     * @return a {@link Builder} of {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig> {
        java.lang.Number idleTtl;
        java.lang.Number maximumTtl;

        /**
         * Sets the value of {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig#getIdleTtl}
         * @param idleTtl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#idle_ttl CloudfrontContinuousDeploymentPolicy#idle_ttl}. This parameter is required.
         * @return {@code this}
         */
        public Builder idleTtl(java.lang.Number idleTtl) {
            this.idleTtl = idleTtl;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig#getMaximumTtl}
         * @param maximumTtl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_continuous_deployment_policy#maximum_ttl CloudfrontContinuousDeploymentPolicy#maximum_ttl}. This parameter is required.
         * @return {@code this}
         */
        public Builder maximumTtl(java.lang.Number maximumTtl) {
            this.maximumTtl = maximumTtl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig {
        private final java.lang.Number idleTtl;
        private final java.lang.Number maximumTtl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.idleTtl = software.amazon.jsii.Kernel.get(this, "idleTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maximumTtl = software.amazon.jsii.Kernel.get(this, "maximumTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.idleTtl = java.util.Objects.requireNonNull(builder.idleTtl, "idleTtl is required");
            this.maximumTtl = java.util.Objects.requireNonNull(builder.maximumTtl, "maximumTtl is required");
        }

        @Override
        public final java.lang.Number getIdleTtl() {
            return this.idleTtl;
        }

        @Override
        public final java.lang.Number getMaximumTtl() {
            return this.maximumTtl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("idleTtl", om.valueToTree(this.getIdleTtl()));
            data.set("maximumTtl", om.valueToTree(this.getMaximumTtl()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontContinuousDeploymentPolicy.CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig.Jsii$Proxy that = (CloudfrontContinuousDeploymentPolicyTrafficConfigSingleWeightConfigSessionStickinessConfig.Jsii$Proxy) o;

            if (!idleTtl.equals(that.idleTtl)) return false;
            return this.maximumTtl.equals(that.maximumTtl);
        }

        @Override
        public final int hashCode() {
            int result = this.idleTtl.hashCode();
            result = 31 * result + (this.maximumTtl.hashCode());
            return result;
        }
    }
}
