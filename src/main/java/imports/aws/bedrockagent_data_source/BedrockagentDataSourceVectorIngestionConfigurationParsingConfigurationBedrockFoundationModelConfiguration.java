package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.169Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#model_arn BedrockagentDataSource#model_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getModelArn();

    /**
     * parsing_prompt block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#parsing_prompt BedrockagentDataSource#parsing_prompt}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParsingPrompt() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration> {
        java.lang.String modelArn;
        java.lang.Object parsingPrompt;

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration#getModelArn}
         * @param modelArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#model_arn BedrockagentDataSource#model_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder modelArn(java.lang.String modelArn) {
            this.modelArn = modelArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration#getParsingPrompt}
         * @param parsingPrompt parsing_prompt block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#parsing_prompt BedrockagentDataSource#parsing_prompt}
         * @return {@code this}
         */
        public Builder parsingPrompt(com.hashicorp.cdktf.IResolvable parsingPrompt) {
            this.parsingPrompt = parsingPrompt;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration#getParsingPrompt}
         * @param parsingPrompt parsing_prompt block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#parsing_prompt BedrockagentDataSource#parsing_prompt}
         * @return {@code this}
         */
        public Builder parsingPrompt(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfigurationParsingPrompt> parsingPrompt) {
            this.parsingPrompt = parsingPrompt;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration {
        private final java.lang.String modelArn;
        private final java.lang.Object parsingPrompt;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.modelArn = software.amazon.jsii.Kernel.get(this, "modelArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parsingPrompt = software.amazon.jsii.Kernel.get(this, "parsingPrompt", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.modelArn = java.util.Objects.requireNonNull(builder.modelArn, "modelArn is required");
            this.parsingPrompt = builder.parsingPrompt;
        }

        @Override
        public final java.lang.String getModelArn() {
            return this.modelArn;
        }

        @Override
        public final java.lang.Object getParsingPrompt() {
            return this.parsingPrompt;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("modelArn", om.valueToTree(this.getModelArn()));
            if (this.getParsingPrompt() != null) {
                data.set("parsingPrompt", om.valueToTree(this.getParsingPrompt()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration.Jsii$Proxy that = (BedrockagentDataSourceVectorIngestionConfigurationParsingConfigurationBedrockFoundationModelConfiguration.Jsii$Proxy) o;

            if (!modelArn.equals(that.modelArn)) return false;
            return this.parsingPrompt != null ? this.parsingPrompt.equals(that.parsingPrompt) : that.parsingPrompt == null;
        }

        @Override
        public final int hashCode() {
            int result = this.modelArn.hashCode();
            result = 31 * result + (this.parsingPrompt != null ? this.parsingPrompt.hashCode() : 0);
            return result;
        }
    }
}
