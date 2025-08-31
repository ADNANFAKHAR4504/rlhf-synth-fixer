package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.166Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceVectorIngestionConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceVectorIngestionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * chunking_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#chunking_configuration BedrockagentDataSource#chunking_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getChunkingConfiguration() {
        return null;
    }

    /**
     * custom_transformation_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#custom_transformation_configuration BedrockagentDataSource#custom_transformation_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomTransformationConfiguration() {
        return null;
    }

    /**
     * parsing_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#parsing_configuration BedrockagentDataSource#parsing_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParsingConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceVectorIngestionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceVectorIngestionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceVectorIngestionConfiguration> {
        java.lang.Object chunkingConfiguration;
        java.lang.Object customTransformationConfiguration;
        java.lang.Object parsingConfiguration;

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfiguration#getChunkingConfiguration}
         * @param chunkingConfiguration chunking_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#chunking_configuration BedrockagentDataSource#chunking_configuration}
         * @return {@code this}
         */
        public Builder chunkingConfiguration(com.hashicorp.cdktf.IResolvable chunkingConfiguration) {
            this.chunkingConfiguration = chunkingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfiguration#getChunkingConfiguration}
         * @param chunkingConfiguration chunking_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#chunking_configuration BedrockagentDataSource#chunking_configuration}
         * @return {@code this}
         */
        public Builder chunkingConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration> chunkingConfiguration) {
            this.chunkingConfiguration = chunkingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfiguration#getCustomTransformationConfiguration}
         * @param customTransformationConfiguration custom_transformation_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#custom_transformation_configuration BedrockagentDataSource#custom_transformation_configuration}
         * @return {@code this}
         */
        public Builder customTransformationConfiguration(com.hashicorp.cdktf.IResolvable customTransformationConfiguration) {
            this.customTransformationConfiguration = customTransformationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfiguration#getCustomTransformationConfiguration}
         * @param customTransformationConfiguration custom_transformation_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#custom_transformation_configuration BedrockagentDataSource#custom_transformation_configuration}
         * @return {@code this}
         */
        public Builder customTransformationConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfiguration> customTransformationConfiguration) {
            this.customTransformationConfiguration = customTransformationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfiguration#getParsingConfiguration}
         * @param parsingConfiguration parsing_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#parsing_configuration BedrockagentDataSource#parsing_configuration}
         * @return {@code this}
         */
        public Builder parsingConfiguration(com.hashicorp.cdktf.IResolvable parsingConfiguration) {
            this.parsingConfiguration = parsingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfiguration#getParsingConfiguration}
         * @param parsingConfiguration parsing_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#parsing_configuration BedrockagentDataSource#parsing_configuration}
         * @return {@code this}
         */
        public Builder parsingConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationParsingConfiguration> parsingConfiguration) {
            this.parsingConfiguration = parsingConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceVectorIngestionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceVectorIngestionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceVectorIngestionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceVectorIngestionConfiguration {
        private final java.lang.Object chunkingConfiguration;
        private final java.lang.Object customTransformationConfiguration;
        private final java.lang.Object parsingConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.chunkingConfiguration = software.amazon.jsii.Kernel.get(this, "chunkingConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customTransformationConfiguration = software.amazon.jsii.Kernel.get(this, "customTransformationConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.parsingConfiguration = software.amazon.jsii.Kernel.get(this, "parsingConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.chunkingConfiguration = builder.chunkingConfiguration;
            this.customTransformationConfiguration = builder.customTransformationConfiguration;
            this.parsingConfiguration = builder.parsingConfiguration;
        }

        @Override
        public final java.lang.Object getChunkingConfiguration() {
            return this.chunkingConfiguration;
        }

        @Override
        public final java.lang.Object getCustomTransformationConfiguration() {
            return this.customTransformationConfiguration;
        }

        @Override
        public final java.lang.Object getParsingConfiguration() {
            return this.parsingConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getChunkingConfiguration() != null) {
                data.set("chunkingConfiguration", om.valueToTree(this.getChunkingConfiguration()));
            }
            if (this.getCustomTransformationConfiguration() != null) {
                data.set("customTransformationConfiguration", om.valueToTree(this.getCustomTransformationConfiguration()));
            }
            if (this.getParsingConfiguration() != null) {
                data.set("parsingConfiguration", om.valueToTree(this.getParsingConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceVectorIngestionConfiguration.Jsii$Proxy that = (BedrockagentDataSourceVectorIngestionConfiguration.Jsii$Proxy) o;

            if (this.chunkingConfiguration != null ? !this.chunkingConfiguration.equals(that.chunkingConfiguration) : that.chunkingConfiguration != null) return false;
            if (this.customTransformationConfiguration != null ? !this.customTransformationConfiguration.equals(that.customTransformationConfiguration) : that.customTransformationConfiguration != null) return false;
            return this.parsingConfiguration != null ? this.parsingConfiguration.equals(that.parsingConfiguration) : that.parsingConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.chunkingConfiguration != null ? this.chunkingConfiguration.hashCode() : 0;
            result = 31 * result + (this.customTransformationConfiguration != null ? this.customTransformationConfiguration.hashCode() : 0);
            result = 31 * result + (this.parsingConfiguration != null ? this.parsingConfiguration.hashCode() : 0);
            return result;
        }
    }
}
