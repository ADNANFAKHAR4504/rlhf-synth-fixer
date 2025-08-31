package imports.aws.iot_domain_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.396Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotDomainConfiguration.IotDomainConfigurationAuthorizerConfig")
@software.amazon.jsii.Jsii.Proxy(IotDomainConfigurationAuthorizerConfig.Jsii$Proxy.class)
public interface IotDomainConfigurationAuthorizerConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#allow_authorizer_override IotDomainConfiguration#allow_authorizer_override}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowAuthorizerOverride() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#default_authorizer_name IotDomainConfiguration#default_authorizer_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultAuthorizerName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotDomainConfigurationAuthorizerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotDomainConfigurationAuthorizerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotDomainConfigurationAuthorizerConfig> {
        java.lang.Object allowAuthorizerOverride;
        java.lang.String defaultAuthorizerName;

        /**
         * Sets the value of {@link IotDomainConfigurationAuthorizerConfig#getAllowAuthorizerOverride}
         * @param allowAuthorizerOverride Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#allow_authorizer_override IotDomainConfiguration#allow_authorizer_override}.
         * @return {@code this}
         */
        public Builder allowAuthorizerOverride(java.lang.Boolean allowAuthorizerOverride) {
            this.allowAuthorizerOverride = allowAuthorizerOverride;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationAuthorizerConfig#getAllowAuthorizerOverride}
         * @param allowAuthorizerOverride Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#allow_authorizer_override IotDomainConfiguration#allow_authorizer_override}.
         * @return {@code this}
         */
        public Builder allowAuthorizerOverride(com.hashicorp.cdktf.IResolvable allowAuthorizerOverride) {
            this.allowAuthorizerOverride = allowAuthorizerOverride;
            return this;
        }

        /**
         * Sets the value of {@link IotDomainConfigurationAuthorizerConfig#getDefaultAuthorizerName}
         * @param defaultAuthorizerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#default_authorizer_name IotDomainConfiguration#default_authorizer_name}.
         * @return {@code this}
         */
        public Builder defaultAuthorizerName(java.lang.String defaultAuthorizerName) {
            this.defaultAuthorizerName = defaultAuthorizerName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotDomainConfigurationAuthorizerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotDomainConfigurationAuthorizerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotDomainConfigurationAuthorizerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotDomainConfigurationAuthorizerConfig {
        private final java.lang.Object allowAuthorizerOverride;
        private final java.lang.String defaultAuthorizerName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowAuthorizerOverride = software.amazon.jsii.Kernel.get(this, "allowAuthorizerOverride", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.defaultAuthorizerName = software.amazon.jsii.Kernel.get(this, "defaultAuthorizerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowAuthorizerOverride = builder.allowAuthorizerOverride;
            this.defaultAuthorizerName = builder.defaultAuthorizerName;
        }

        @Override
        public final java.lang.Object getAllowAuthorizerOverride() {
            return this.allowAuthorizerOverride;
        }

        @Override
        public final java.lang.String getDefaultAuthorizerName() {
            return this.defaultAuthorizerName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllowAuthorizerOverride() != null) {
                data.set("allowAuthorizerOverride", om.valueToTree(this.getAllowAuthorizerOverride()));
            }
            if (this.getDefaultAuthorizerName() != null) {
                data.set("defaultAuthorizerName", om.valueToTree(this.getDefaultAuthorizerName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotDomainConfiguration.IotDomainConfigurationAuthorizerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotDomainConfigurationAuthorizerConfig.Jsii$Proxy that = (IotDomainConfigurationAuthorizerConfig.Jsii$Proxy) o;

            if (this.allowAuthorizerOverride != null ? !this.allowAuthorizerOverride.equals(that.allowAuthorizerOverride) : that.allowAuthorizerOverride != null) return false;
            return this.defaultAuthorizerName != null ? this.defaultAuthorizerName.equals(that.defaultAuthorizerName) : that.defaultAuthorizerName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowAuthorizerOverride != null ? this.allowAuthorizerOverride.hashCode() : 0;
            result = 31 * result + (this.defaultAuthorizerName != null ? this.defaultAuthorizerName.hashCode() : 0);
            return result;
        }
    }
}
