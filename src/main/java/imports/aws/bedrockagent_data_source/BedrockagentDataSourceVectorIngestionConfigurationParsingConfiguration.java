package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.169Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#parsing_strategy BedrockagentDataSource#parsing_strategy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getParsingStrategy();

    /**
     * bedrock_foundation_model_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#bedrock_foundation_model_configuration BedrockagentDataSource#bedrock_foundation_model_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBedrockFoundationModelConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration> {
        java.lang.String parsingStrategy;
        java.lang.Object bedrockFoundationModelConfiguration;

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration#getParsingStrategy}
         * @param parsingStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#parsing_strategy BedrockagentDataSource#parsing_strategy}. This parameter is required.
         * @return {@code this}
         */
        public Builder parsingStrategy(java.lang.String parsingStrategy) {
            this.parsingStrategy = parsingStrategy;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration#getBedrockFoundationModelConfiguration}
         * @param bedrockFoundationModelConfiguration bedrock_foundation_model_configuration block.
         *                                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#bedrock_foundation_model_configuration BedrockagentDataSource#bedrock_foundation_model_configuration}
         * @return {@code this}
         */
        public Builder bedrockFoundationModelConfiguration(com.hashicorp.cdktf.IResolvable bedrockFoundationModelConfiguration) {
            this.bedrockFoundationModelConfiguration = bedrockFoundationModelConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration#getBedrockFoundationModelConfiguration}
         * @param bedrockFoundationModelConfiguration bedrock_foundation_model_configuration block.
         *                                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#bedrock_foundation_model_configuration BedrockagentDataSource#bedrock_foundation_model_configuration}
         * @return {@code this}
         */
        public Builder bedrockFoundationModelConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration> bedrockFoundationModelConfiguration) {
            this.bedrockFoundationModelConfiguration = bedrockFoundationModelConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration {
        private final java.lang.String parsingStrategy;
        private final java.lang.Object bedrockFoundationModelConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.parsingStrategy = software.amazon.jsii.Kernel.get(this, "parsingStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bedrockFoundationModelConfiguration = software.amazon.jsii.Kernel.get(this, "bedrockFoundationModelConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.parsingStrategy = java.util.Objects.requireNonNull(builder.parsingStrategy, "parsingStrategy is required");
            this.bedrockFoundationModelConfiguration = builder.bedrockFoundationModelConfiguration;
        }

        @Override
        public final java.lang.String getParsingStrategy() {
            return this.parsingStrategy;
        }

        @Override
        public final java.lang.Object getBedrockFoundationModelConfiguration() {
            return this.bedrockFoundationModelConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("parsingStrategy", om.valueToTree(this.getParsingStrategy()));
            if (this.getBedrockFoundationModelConfiguration() != null) {
                data.set("bedrockFoundationModelConfiguration", om.valueToTree(this.getBedrockFoundationModelConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration.Jsii$Proxy that = (BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration.Jsii$Proxy) o;

            if (!parsingStrategy.equals(that.parsingStrategy)) return false;
            return this.bedrockFoundationModelConfiguration != null ? this.bedrockFoundationModelConfiguration.equals(that.bedrockFoundationModelConfiguration) : that.bedrockFoundationModelConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.parsingStrategy.hashCode();
            result = 31 * result + (this.bedrockFoundationModelConfiguration != null ? this.bedrockFoundationModelConfiguration.hashCode() : 0);
            return result;
        }
    }
}
