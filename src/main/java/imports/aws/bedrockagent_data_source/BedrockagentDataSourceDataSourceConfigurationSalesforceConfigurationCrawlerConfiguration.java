package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.163Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * filter_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#filter_configuration BedrockagentDataSource#filter_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFilterConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration> {
        java.lang.Object filterConfiguration;

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration#getFilterConfiguration}
         * @param filterConfiguration filter_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#filter_configuration BedrockagentDataSource#filter_configuration}
         * @return {@code this}
         */
        public Builder filterConfiguration(com.hashicorp.cdktf.IResolvable filterConfiguration) {
            this.filterConfiguration = filterConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration#getFilterConfiguration}
         * @param filterConfiguration filter_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#filter_configuration BedrockagentDataSource#filter_configuration}
         * @return {@code this}
         */
        public Builder filterConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfigurationFilterConfiguration> filterConfiguration) {
            this.filterConfiguration = filterConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration {
        private final java.lang.Object filterConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.filterConfiguration = software.amazon.jsii.Kernel.get(this, "filterConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.filterConfiguration = builder.filterConfiguration;
        }

        @Override
        public final java.lang.Object getFilterConfiguration() {
            return this.filterConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFilterConfiguration() != null) {
                data.set("filterConfiguration", om.valueToTree(this.getFilterConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration.Jsii$Proxy that = (BedrockagentDataSourceDataSourceConfigurationSalesforceConfigurationCrawlerConfiguration.Jsii$Proxy) o;

            return this.filterConfiguration != null ? this.filterConfiguration.equals(that.filterConfiguration) : that.filterConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.filterConfiguration != null ? this.filterConfiguration.hashCode() : 0;
            return result;
        }
    }
}
