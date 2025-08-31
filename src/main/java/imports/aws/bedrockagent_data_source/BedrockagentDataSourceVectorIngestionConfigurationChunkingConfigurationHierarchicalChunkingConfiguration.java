package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.167Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#overlap_tokens BedrockagentDataSource#overlap_tokens}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getOverlapTokens();

    /**
     * level_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#level_configuration BedrockagentDataSource#level_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLevelConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration> {
        java.lang.Number overlapTokens;
        java.lang.Object levelConfiguration;

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration#getOverlapTokens}
         * @param overlapTokens Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#overlap_tokens BedrockagentDataSource#overlap_tokens}. This parameter is required.
         * @return {@code this}
         */
        public Builder overlapTokens(java.lang.Number overlapTokens) {
            this.overlapTokens = overlapTokens;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration#getLevelConfiguration}
         * @param levelConfiguration level_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#level_configuration BedrockagentDataSource#level_configuration}
         * @return {@code this}
         */
        public Builder levelConfiguration(com.hashicorp.cdktf.IResolvable levelConfiguration) {
            this.levelConfiguration = levelConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration#getLevelConfiguration}
         * @param levelConfiguration level_configuration block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#level_configuration BedrockagentDataSource#level_configuration}
         * @return {@code this}
         */
        public Builder levelConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfigurationLevelConfiguration> levelConfiguration) {
            this.levelConfiguration = levelConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration {
        private final java.lang.Number overlapTokens;
        private final java.lang.Object levelConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.overlapTokens = software.amazon.jsii.Kernel.get(this, "overlapTokens", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.levelConfiguration = software.amazon.jsii.Kernel.get(this, "levelConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.overlapTokens = java.util.Objects.requireNonNull(builder.overlapTokens, "overlapTokens is required");
            this.levelConfiguration = builder.levelConfiguration;
        }

        @Override
        public final java.lang.Number getOverlapTokens() {
            return this.overlapTokens;
        }

        @Override
        public final java.lang.Object getLevelConfiguration() {
            return this.levelConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("overlapTokens", om.valueToTree(this.getOverlapTokens()));
            if (this.getLevelConfiguration() != null) {
                data.set("levelConfiguration", om.valueToTree(this.getLevelConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration.Jsii$Proxy that = (BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration.Jsii$Proxy) o;

            if (!overlapTokens.equals(that.overlapTokens)) return false;
            return this.levelConfiguration != null ? this.levelConfiguration.equals(that.levelConfiguration) : that.levelConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.overlapTokens.hashCode();
            result = 31 * result + (this.levelConfiguration != null ? this.levelConfiguration.hashCode() : 0);
            return result;
        }
    }
}
