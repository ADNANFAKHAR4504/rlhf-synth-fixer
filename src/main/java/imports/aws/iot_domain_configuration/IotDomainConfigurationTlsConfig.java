package imports.aws.iot_domain_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.397Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotDomainConfiguration.IotDomainConfigurationTlsConfig")
@software.amazon.jsii.Jsii.Proxy(IotDomainConfigurationTlsConfig.Jsii$Proxy.class)
public interface IotDomainConfigurationTlsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#security_policy IotDomainConfiguration#security_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecurityPolicy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotDomainConfigurationTlsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotDomainConfigurationTlsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotDomainConfigurationTlsConfig> {
        java.lang.String securityPolicy;

        /**
         * Sets the value of {@link IotDomainConfigurationTlsConfig#getSecurityPolicy}
         * @param securityPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_domain_configuration#security_policy IotDomainConfiguration#security_policy}.
         * @return {@code this}
         */
        public Builder securityPolicy(java.lang.String securityPolicy) {
            this.securityPolicy = securityPolicy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotDomainConfigurationTlsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotDomainConfigurationTlsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotDomainConfigurationTlsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotDomainConfigurationTlsConfig {
        private final java.lang.String securityPolicy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.securityPolicy = software.amazon.jsii.Kernel.get(this, "securityPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.securityPolicy = builder.securityPolicy;
        }

        @Override
        public final java.lang.String getSecurityPolicy() {
            return this.securityPolicy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSecurityPolicy() != null) {
                data.set("securityPolicy", om.valueToTree(this.getSecurityPolicy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotDomainConfiguration.IotDomainConfigurationTlsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotDomainConfigurationTlsConfig.Jsii$Proxy that = (IotDomainConfigurationTlsConfig.Jsii$Proxy) o;

            return this.securityPolicy != null ? this.securityPolicy.equals(that.securityPolicy) : that.securityPolicy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.securityPolicy != null ? this.securityPolicy.hashCode() : 0;
            return result;
        }
    }
}
