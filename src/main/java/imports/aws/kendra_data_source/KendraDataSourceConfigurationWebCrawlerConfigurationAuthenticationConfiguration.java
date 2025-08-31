package imports.aws.kendra_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.430Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration.Jsii$Proxy.class)
public interface KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * basic_authentication block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#basic_authentication KendraDataSource#basic_authentication}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBasicAuthentication() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration> {
        java.lang.Object basicAuthentication;

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration#getBasicAuthentication}
         * @param basicAuthentication basic_authentication block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#basic_authentication KendraDataSource#basic_authentication}
         * @return {@code this}
         */
        public Builder basicAuthentication(com.hashicorp.cdktf.IResolvable basicAuthentication) {
            this.basicAuthentication = basicAuthentication;
            return this;
        }

        /**
         * Sets the value of {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration#getBasicAuthentication}
         * @param basicAuthentication basic_authentication block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_data_source#basic_authentication KendraDataSource#basic_authentication}
         * @return {@code this}
         */
        public Builder basicAuthentication(java.util.List<? extends imports.aws.kendra_data_source.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfigurationBasicAuthentication> basicAuthentication) {
            this.basicAuthentication = basicAuthentication;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration {
        private final java.lang.Object basicAuthentication;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.basicAuthentication = software.amazon.jsii.Kernel.get(this, "basicAuthentication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.basicAuthentication = builder.basicAuthentication;
        }

        @Override
        public final java.lang.Object getBasicAuthentication() {
            return this.basicAuthentication;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBasicAuthentication() != null) {
                data.set("basicAuthentication", om.valueToTree(this.getBasicAuthentication()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraDataSource.KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration.Jsii$Proxy that = (KendraDataSourceConfigurationWebCrawlerConfigurationAuthenticationConfiguration.Jsii$Proxy) o;

            return this.basicAuthentication != null ? this.basicAuthentication.equals(that.basicAuthentication) : that.basicAuthentication == null;
        }

        @Override
        public final int hashCode() {
            int result = this.basicAuthentication != null ? this.basicAuthentication.hashCode() : 0;
            return result;
        }
    }
}
