package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.056Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceObservabilityConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApprunnerServiceObservabilityConfiguration.Jsii$Proxy.class)
public interface ApprunnerServiceObservabilityConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#observability_enabled ApprunnerService#observability_enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getObservabilityEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#observability_configuration_arn ApprunnerService#observability_configuration_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getObservabilityConfigurationArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerServiceObservabilityConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerServiceObservabilityConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerServiceObservabilityConfiguration> {
        java.lang.Object observabilityEnabled;
        java.lang.String observabilityConfigurationArn;

        /**
         * Sets the value of {@link ApprunnerServiceObservabilityConfiguration#getObservabilityEnabled}
         * @param observabilityEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#observability_enabled ApprunnerService#observability_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder observabilityEnabled(java.lang.Boolean observabilityEnabled) {
            this.observabilityEnabled = observabilityEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceObservabilityConfiguration#getObservabilityEnabled}
         * @param observabilityEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#observability_enabled ApprunnerService#observability_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder observabilityEnabled(com.hashicorp.cdktf.IResolvable observabilityEnabled) {
            this.observabilityEnabled = observabilityEnabled;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerServiceObservabilityConfiguration#getObservabilityConfigurationArn}
         * @param observabilityConfigurationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_service#observability_configuration_arn ApprunnerService#observability_configuration_arn}.
         * @return {@code this}
         */
        public Builder observabilityConfigurationArn(java.lang.String observabilityConfigurationArn) {
            this.observabilityConfigurationArn = observabilityConfigurationArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerServiceObservabilityConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerServiceObservabilityConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerServiceObservabilityConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerServiceObservabilityConfiguration {
        private final java.lang.Object observabilityEnabled;
        private final java.lang.String observabilityConfigurationArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.observabilityEnabled = software.amazon.jsii.Kernel.get(this, "observabilityEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.observabilityConfigurationArn = software.amazon.jsii.Kernel.get(this, "observabilityConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.observabilityEnabled = java.util.Objects.requireNonNull(builder.observabilityEnabled, "observabilityEnabled is required");
            this.observabilityConfigurationArn = builder.observabilityConfigurationArn;
        }

        @Override
        public final java.lang.Object getObservabilityEnabled() {
            return this.observabilityEnabled;
        }

        @Override
        public final java.lang.String getObservabilityConfigurationArn() {
            return this.observabilityConfigurationArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("observabilityEnabled", om.valueToTree(this.getObservabilityEnabled()));
            if (this.getObservabilityConfigurationArn() != null) {
                data.set("observabilityConfigurationArn", om.valueToTree(this.getObservabilityConfigurationArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerService.ApprunnerServiceObservabilityConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerServiceObservabilityConfiguration.Jsii$Proxy that = (ApprunnerServiceObservabilityConfiguration.Jsii$Proxy) o;

            if (!observabilityEnabled.equals(that.observabilityEnabled)) return false;
            return this.observabilityConfigurationArn != null ? this.observabilityConfigurationArn.equals(that.observabilityConfigurationArn) : that.observabilityConfigurationArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.observabilityEnabled.hashCode();
            result = 31 * result + (this.observabilityConfigurationArn != null ? this.observabilityConfigurationArn.hashCode() : 0);
            return result;
        }
    }
}
