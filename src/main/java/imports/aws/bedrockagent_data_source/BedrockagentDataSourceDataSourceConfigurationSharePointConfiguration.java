package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.164Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * crawler_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#crawler_configuration BedrockagentDataSource#crawler_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCrawlerConfiguration() {
        return null;
    }

    /**
     * source_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#source_configuration BedrockagentDataSource#source_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSourceConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration> {
        java.lang.Object crawlerConfiguration;
        java.lang.Object sourceConfiguration;

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration#getCrawlerConfiguration}
         * @param crawlerConfiguration crawler_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#crawler_configuration BedrockagentDataSource#crawler_configuration}
         * @return {@code this}
         */
        public Builder crawlerConfiguration(com.hashicorp.cdktf.IResolvable crawlerConfiguration) {
            this.crawlerConfiguration = crawlerConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration#getCrawlerConfiguration}
         * @param crawlerConfiguration crawler_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#crawler_configuration BedrockagentDataSource#crawler_configuration}
         * @return {@code this}
         */
        public Builder crawlerConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationCrawlerConfiguration> crawlerConfiguration) {
            this.crawlerConfiguration = crawlerConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration#getSourceConfiguration}
         * @param sourceConfiguration source_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#source_configuration BedrockagentDataSource#source_configuration}
         * @return {@code this}
         */
        public Builder sourceConfiguration(com.hashicorp.cdktf.IResolvable sourceConfiguration) {
            this.sourceConfiguration = sourceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration#getSourceConfiguration}
         * @param sourceConfiguration source_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#source_configuration BedrockagentDataSource#source_configuration}
         * @return {@code this}
         */
        public Builder sourceConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfigurationSharePointConfigurationSourceConfiguration> sourceConfiguration) {
            this.sourceConfiguration = sourceConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration {
        private final java.lang.Object crawlerConfiguration;
        private final java.lang.Object sourceConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.crawlerConfiguration = software.amazon.jsii.Kernel.get(this, "crawlerConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceConfiguration = software.amazon.jsii.Kernel.get(this, "sourceConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.crawlerConfiguration = builder.crawlerConfiguration;
            this.sourceConfiguration = builder.sourceConfiguration;
        }

        @Override
        public final java.lang.Object getCrawlerConfiguration() {
            return this.crawlerConfiguration;
        }

        @Override
        public final java.lang.Object getSourceConfiguration() {
            return this.sourceConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCrawlerConfiguration() != null) {
                data.set("crawlerConfiguration", om.valueToTree(this.getCrawlerConfiguration()));
            }
            if (this.getSourceConfiguration() != null) {
                data.set("sourceConfiguration", om.valueToTree(this.getSourceConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration.Jsii$Proxy that = (BedrockagentDataSourceDataSourceConfigurationSharePointConfiguration.Jsii$Proxy) o;

            if (this.crawlerConfiguration != null ? !this.crawlerConfiguration.equals(that.crawlerConfiguration) : that.crawlerConfiguration != null) return false;
            return this.sourceConfiguration != null ? this.sourceConfiguration.equals(that.sourceConfiguration) : that.sourceConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.crawlerConfiguration != null ? this.crawlerConfiguration.hashCode() : 0;
            result = 31 * result + (this.sourceConfiguration != null ? this.sourceConfiguration.hashCode() : 0);
            return result;
        }
    }
}
