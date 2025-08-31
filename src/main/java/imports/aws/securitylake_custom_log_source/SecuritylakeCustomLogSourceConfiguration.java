package imports.aws.securitylake_custom_log_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.418Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeCustomLogSource.SecuritylakeCustomLogSourceConfiguration")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeCustomLogSourceConfiguration.Jsii$Proxy.class)
public interface SecuritylakeCustomLogSourceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * crawler_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#crawler_configuration SecuritylakeCustomLogSource#crawler_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCrawlerConfiguration() {
        return null;
    }

    /**
     * provider_identity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#provider_identity SecuritylakeCustomLogSource#provider_identity}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getProviderIdentity() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecuritylakeCustomLogSourceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeCustomLogSourceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeCustomLogSourceConfiguration> {
        java.lang.Object crawlerConfiguration;
        java.lang.Object providerIdentity;

        /**
         * Sets the value of {@link SecuritylakeCustomLogSourceConfiguration#getCrawlerConfiguration}
         * @param crawlerConfiguration crawler_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#crawler_configuration SecuritylakeCustomLogSource#crawler_configuration}
         * @return {@code this}
         */
        public Builder crawlerConfiguration(com.hashicorp.cdktf.IResolvable crawlerConfiguration) {
            this.crawlerConfiguration = crawlerConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeCustomLogSourceConfiguration#getCrawlerConfiguration}
         * @param crawlerConfiguration crawler_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#crawler_configuration SecuritylakeCustomLogSource#crawler_configuration}
         * @return {@code this}
         */
        public Builder crawlerConfiguration(java.util.List<? extends imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationCrawlerConfiguration> crawlerConfiguration) {
            this.crawlerConfiguration = crawlerConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeCustomLogSourceConfiguration#getProviderIdentity}
         * @param providerIdentity provider_identity block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#provider_identity SecuritylakeCustomLogSource#provider_identity}
         * @return {@code this}
         */
        public Builder providerIdentity(com.hashicorp.cdktf.IResolvable providerIdentity) {
            this.providerIdentity = providerIdentity;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeCustomLogSourceConfiguration#getProviderIdentity}
         * @param providerIdentity provider_identity block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_custom_log_source#provider_identity SecuritylakeCustomLogSource#provider_identity}
         * @return {@code this}
         */
        public Builder providerIdentity(java.util.List<? extends imports.aws.securitylake_custom_log_source.SecuritylakeCustomLogSourceConfigurationProviderIdentity> providerIdentity) {
            this.providerIdentity = providerIdentity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecuritylakeCustomLogSourceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeCustomLogSourceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeCustomLogSourceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeCustomLogSourceConfiguration {
        private final java.lang.Object crawlerConfiguration;
        private final java.lang.Object providerIdentity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.crawlerConfiguration = software.amazon.jsii.Kernel.get(this, "crawlerConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.providerIdentity = software.amazon.jsii.Kernel.get(this, "providerIdentity", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.crawlerConfiguration = builder.crawlerConfiguration;
            this.providerIdentity = builder.providerIdentity;
        }

        @Override
        public final java.lang.Object getCrawlerConfiguration() {
            return this.crawlerConfiguration;
        }

        @Override
        public final java.lang.Object getProviderIdentity() {
            return this.providerIdentity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCrawlerConfiguration() != null) {
                data.set("crawlerConfiguration", om.valueToTree(this.getCrawlerConfiguration()));
            }
            if (this.getProviderIdentity() != null) {
                data.set("providerIdentity", om.valueToTree(this.getProviderIdentity()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securitylakeCustomLogSource.SecuritylakeCustomLogSourceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeCustomLogSourceConfiguration.Jsii$Proxy that = (SecuritylakeCustomLogSourceConfiguration.Jsii$Proxy) o;

            if (this.crawlerConfiguration != null ? !this.crawlerConfiguration.equals(that.crawlerConfiguration) : that.crawlerConfiguration != null) return false;
            return this.providerIdentity != null ? this.providerIdentity.equals(that.providerIdentity) : that.providerIdentity == null;
        }

        @Override
        public final int hashCode() {
            int result = this.crawlerConfiguration != null ? this.crawlerConfiguration.hashCode() : 0;
            result = 31 * result + (this.providerIdentity != null ? this.providerIdentity.hashCode() : 0);
            return result;
        }
    }
}
