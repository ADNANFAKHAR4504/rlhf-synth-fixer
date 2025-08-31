package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.167Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#breakpoint_percentile_threshold BedrockagentDataSource#breakpoint_percentile_threshold}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getBreakpointPercentileThreshold();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#buffer_size BedrockagentDataSource#buffer_size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getBufferSize();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#max_token BedrockagentDataSource#max_token}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxToken();

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration> {
        java.lang.Number breakpointPercentileThreshold;
        java.lang.Number bufferSize;
        java.lang.Number maxToken;

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration#getBreakpointPercentileThreshold}
         * @param breakpointPercentileThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#breakpoint_percentile_threshold BedrockagentDataSource#breakpoint_percentile_threshold}. This parameter is required.
         * @return {@code this}
         */
        public Builder breakpointPercentileThreshold(java.lang.Number breakpointPercentileThreshold) {
            this.breakpointPercentileThreshold = breakpointPercentileThreshold;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration#getBufferSize}
         * @param bufferSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#buffer_size BedrockagentDataSource#buffer_size}. This parameter is required.
         * @return {@code this}
         */
        public Builder bufferSize(java.lang.Number bufferSize) {
            this.bufferSize = bufferSize;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration#getMaxToken}
         * @param maxToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#max_token BedrockagentDataSource#max_token}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxToken(java.lang.Number maxToken) {
            this.maxToken = maxToken;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration {
        private final java.lang.Number breakpointPercentileThreshold;
        private final java.lang.Number bufferSize;
        private final java.lang.Number maxToken;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.breakpointPercentileThreshold = software.amazon.jsii.Kernel.get(this, "breakpointPercentileThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.bufferSize = software.amazon.jsii.Kernel.get(this, "bufferSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxToken = software.amazon.jsii.Kernel.get(this, "maxToken", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.breakpointPercentileThreshold = java.util.Objects.requireNonNull(builder.breakpointPercentileThreshold, "breakpointPercentileThreshold is required");
            this.bufferSize = java.util.Objects.requireNonNull(builder.bufferSize, "bufferSize is required");
            this.maxToken = java.util.Objects.requireNonNull(builder.maxToken, "maxToken is required");
        }

        @Override
        public final java.lang.Number getBreakpointPercentileThreshold() {
            return this.breakpointPercentileThreshold;
        }

        @Override
        public final java.lang.Number getBufferSize() {
            return this.bufferSize;
        }

        @Override
        public final java.lang.Number getMaxToken() {
            return this.maxToken;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("breakpointPercentileThreshold", om.valueToTree(this.getBreakpointPercentileThreshold()));
            data.set("bufferSize", om.valueToTree(this.getBufferSize()));
            data.set("maxToken", om.valueToTree(this.getMaxToken()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration.Jsii$Proxy that = (BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration.Jsii$Proxy) o;

            if (!breakpointPercentileThreshold.equals(that.breakpointPercentileThreshold)) return false;
            if (!bufferSize.equals(that.bufferSize)) return false;
            return this.maxToken.equals(that.maxToken);
        }

        @Override
        public final int hashCode() {
            int result = this.breakpointPercentileThreshold.hashCode();
            result = 31 * result + (this.bufferSize.hashCode());
            result = 31 * result + (this.maxToken.hashCode());
            return result;
        }
    }
}
