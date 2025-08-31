package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.167Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#max_tokens BedrockagentDataSource#max_tokens}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxTokens();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#overlap_percentage BedrockagentDataSource#overlap_percentage}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getOverlapPercentage();

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration> {
        java.lang.Number maxTokens;
        java.lang.Number overlapPercentage;

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration#getMaxTokens}
         * @param maxTokens Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#max_tokens BedrockagentDataSource#max_tokens}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxTokens(java.lang.Number maxTokens) {
            this.maxTokens = maxTokens;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration#getOverlapPercentage}
         * @param overlapPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#overlap_percentage BedrockagentDataSource#overlap_percentage}. This parameter is required.
         * @return {@code this}
         */
        public Builder overlapPercentage(java.lang.Number overlapPercentage) {
            this.overlapPercentage = overlapPercentage;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration {
        private final java.lang.Number maxTokens;
        private final java.lang.Number overlapPercentage;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxTokens = software.amazon.jsii.Kernel.get(this, "maxTokens", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.overlapPercentage = software.amazon.jsii.Kernel.get(this, "overlapPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxTokens = java.util.Objects.requireNonNull(builder.maxTokens, "maxTokens is required");
            this.overlapPercentage = java.util.Objects.requireNonNull(builder.overlapPercentage, "overlapPercentage is required");
        }

        @Override
        public final java.lang.Number getMaxTokens() {
            return this.maxTokens;
        }

        @Override
        public final java.lang.Number getOverlapPercentage() {
            return this.overlapPercentage;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxTokens", om.valueToTree(this.getMaxTokens()));
            data.set("overlapPercentage", om.valueToTree(this.getOverlapPercentage()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration.Jsii$Proxy that = (BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration.Jsii$Proxy) o;

            if (!maxTokens.equals(that.maxTokens)) return false;
            return this.overlapPercentage.equals(that.overlapPercentage);
        }

        @Override
        public final int hashCode() {
            int result = this.maxTokens.hashCode();
            result = 31 * result + (this.overlapPercentage.hashCode());
            return result;
        }
    }
}
