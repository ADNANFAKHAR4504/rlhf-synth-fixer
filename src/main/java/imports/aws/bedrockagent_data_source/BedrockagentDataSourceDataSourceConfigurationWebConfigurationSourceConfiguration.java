package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.166Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * url_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#url_configuration BedrockagentDataSource#url_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUrlConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration> {
        java.lang.Object urlConfiguration;

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration#getUrlConfiguration}
         * @param urlConfiguration url_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#url_configuration BedrockagentDataSource#url_configuration}
         * @return {@code this}
         */
        public Builder urlConfiguration(com.hashicorp.cdktf.IResolvable urlConfiguration) {
            this.urlConfiguration = urlConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration#getUrlConfiguration}
         * @param urlConfiguration url_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#url_configuration BedrockagentDataSource#url_configuration}
         * @return {@code this}
         */
        public Builder urlConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfigurationUrlConfiguration> urlConfiguration) {
            this.urlConfiguration = urlConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration {
        private final java.lang.Object urlConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.urlConfiguration = software.amazon.jsii.Kernel.get(this, "urlConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.urlConfiguration = builder.urlConfiguration;
        }

        @Override
        public final java.lang.Object getUrlConfiguration() {
            return this.urlConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getUrlConfiguration() != null) {
                data.set("urlConfiguration", om.valueToTree(this.getUrlConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration.Jsii$Proxy that = (BedrockagentDataSourceDataSourceConfigurationWebConfigurationSourceConfiguration.Jsii$Proxy) o;

            return this.urlConfiguration != null ? this.urlConfiguration.equals(that.urlConfiguration) : that.urlConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.urlConfiguration != null ? this.urlConfiguration.hashCode() : 0;
            return result;
        }
    }
}
