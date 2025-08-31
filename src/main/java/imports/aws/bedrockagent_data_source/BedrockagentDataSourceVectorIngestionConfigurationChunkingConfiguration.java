package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.166Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration.Jsii$Proxy.class)
public interface BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#chunking_strategy BedrockagentDataSource#chunking_strategy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getChunkingStrategy();

    /**
     * fixed_size_chunking_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#fixed_size_chunking_configuration BedrockagentDataSource#fixed_size_chunking_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFixedSizeChunkingConfiguration() {
        return null;
    }

    /**
     * hierarchical_chunking_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#hierarchical_chunking_configuration BedrockagentDataSource#hierarchical_chunking_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHierarchicalChunkingConfiguration() {
        return null;
    }

    /**
     * semantic_chunking_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#semantic_chunking_configuration BedrockagentDataSource#semantic_chunking_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSemanticChunkingConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration> {
        java.lang.String chunkingStrategy;
        java.lang.Object fixedSizeChunkingConfiguration;
        java.lang.Object hierarchicalChunkingConfiguration;
        java.lang.Object semanticChunkingConfiguration;

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration#getChunkingStrategy}
         * @param chunkingStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#chunking_strategy BedrockagentDataSource#chunking_strategy}. This parameter is required.
         * @return {@code this}
         */
        public Builder chunkingStrategy(java.lang.String chunkingStrategy) {
            this.chunkingStrategy = chunkingStrategy;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration#getFixedSizeChunkingConfiguration}
         * @param fixedSizeChunkingConfiguration fixed_size_chunking_configuration block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#fixed_size_chunking_configuration BedrockagentDataSource#fixed_size_chunking_configuration}
         * @return {@code this}
         */
        public Builder fixedSizeChunkingConfiguration(com.hashicorp.cdktf.IResolvable fixedSizeChunkingConfiguration) {
            this.fixedSizeChunkingConfiguration = fixedSizeChunkingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration#getFixedSizeChunkingConfiguration}
         * @param fixedSizeChunkingConfiguration fixed_size_chunking_configuration block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#fixed_size_chunking_configuration BedrockagentDataSource#fixed_size_chunking_configuration}
         * @return {@code this}
         */
        public Builder fixedSizeChunkingConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationFixedSizeChunkingConfiguration> fixedSizeChunkingConfiguration) {
            this.fixedSizeChunkingConfiguration = fixedSizeChunkingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration#getHierarchicalChunkingConfiguration}
         * @param hierarchicalChunkingConfiguration hierarchical_chunking_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#hierarchical_chunking_configuration BedrockagentDataSource#hierarchical_chunking_configuration}
         * @return {@code this}
         */
        public Builder hierarchicalChunkingConfiguration(com.hashicorp.cdktf.IResolvable hierarchicalChunkingConfiguration) {
            this.hierarchicalChunkingConfiguration = hierarchicalChunkingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration#getHierarchicalChunkingConfiguration}
         * @param hierarchicalChunkingConfiguration hierarchical_chunking_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#hierarchical_chunking_configuration BedrockagentDataSource#hierarchical_chunking_configuration}
         * @return {@code this}
         */
        public Builder hierarchicalChunkingConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationHierarchicalChunkingConfiguration> hierarchicalChunkingConfiguration) {
            this.hierarchicalChunkingConfiguration = hierarchicalChunkingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration#getSemanticChunkingConfiguration}
         * @param semanticChunkingConfiguration semantic_chunking_configuration block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#semantic_chunking_configuration BedrockagentDataSource#semantic_chunking_configuration}
         * @return {@code this}
         */
        public Builder semanticChunkingConfiguration(com.hashicorp.cdktf.IResolvable semanticChunkingConfiguration) {
            this.semanticChunkingConfiguration = semanticChunkingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration#getSemanticChunkingConfiguration}
         * @param semanticChunkingConfiguration semantic_chunking_configuration block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#semantic_chunking_configuration BedrockagentDataSource#semantic_chunking_configuration}
         * @return {@code this}
         */
        public Builder semanticChunkingConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfigurationSemanticChunkingConfiguration> semanticChunkingConfiguration) {
            this.semanticChunkingConfiguration = semanticChunkingConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration {
        private final java.lang.String chunkingStrategy;
        private final java.lang.Object fixedSizeChunkingConfiguration;
        private final java.lang.Object hierarchicalChunkingConfiguration;
        private final java.lang.Object semanticChunkingConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.chunkingStrategy = software.amazon.jsii.Kernel.get(this, "chunkingStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fixedSizeChunkingConfiguration = software.amazon.jsii.Kernel.get(this, "fixedSizeChunkingConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.hierarchicalChunkingConfiguration = software.amazon.jsii.Kernel.get(this, "hierarchicalChunkingConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.semanticChunkingConfiguration = software.amazon.jsii.Kernel.get(this, "semanticChunkingConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.chunkingStrategy = java.util.Objects.requireNonNull(builder.chunkingStrategy, "chunkingStrategy is required");
            this.fixedSizeChunkingConfiguration = builder.fixedSizeChunkingConfiguration;
            this.hierarchicalChunkingConfiguration = builder.hierarchicalChunkingConfiguration;
            this.semanticChunkingConfiguration = builder.semanticChunkingConfiguration;
        }

        @Override
        public final java.lang.String getChunkingStrategy() {
            return this.chunkingStrategy;
        }

        @Override
        public final java.lang.Object getFixedSizeChunkingConfiguration() {
            return this.fixedSizeChunkingConfiguration;
        }

        @Override
        public final java.lang.Object getHierarchicalChunkingConfiguration() {
            return this.hierarchicalChunkingConfiguration;
        }

        @Override
        public final java.lang.Object getSemanticChunkingConfiguration() {
            return this.semanticChunkingConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("chunkingStrategy", om.valueToTree(this.getChunkingStrategy()));
            if (this.getFixedSizeChunkingConfiguration() != null) {
                data.set("fixedSizeChunkingConfiguration", om.valueToTree(this.getFixedSizeChunkingConfiguration()));
            }
            if (this.getHierarchicalChunkingConfiguration() != null) {
                data.set("hierarchicalChunkingConfiguration", om.valueToTree(this.getHierarchicalChunkingConfiguration()));
            }
            if (this.getSemanticChunkingConfiguration() != null) {
                data.set("semanticChunkingConfiguration", om.valueToTree(this.getSemanticChunkingConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration.Jsii$Proxy that = (BedrockagentDataSourceVectorIngestionConfigurationChunkingConfiguration.Jsii$Proxy) o;

            if (!chunkingStrategy.equals(that.chunkingStrategy)) return false;
            if (this.fixedSizeChunkingConfiguration != null ? !this.fixedSizeChunkingConfiguration.equals(that.fixedSizeChunkingConfiguration) : that.fixedSizeChunkingConfiguration != null) return false;
            if (this.hierarchicalChunkingConfiguration != null ? !this.hierarchicalChunkingConfiguration.equals(that.hierarchicalChunkingConfiguration) : that.hierarchicalChunkingConfiguration != null) return false;
            return this.semanticChunkingConfiguration != null ? this.semanticChunkingConfiguration.equals(that.semanticChunkingConfiguration) : that.semanticChunkingConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.chunkingStrategy.hashCode();
            result = 31 * result + (this.fixedSizeChunkingConfiguration != null ? this.fixedSizeChunkingConfiguration.hashCode() : 0);
            result = 31 * result + (this.hierarchicalChunkingConfiguration != null ? this.hierarchicalChunkingConfiguration.hashCode() : 0);
            result = 31 * result + (this.semanticChunkingConfiguration != null ? this.semanticChunkingConfiguration.hashCode() : 0);
            return result;
        }
    }
}
