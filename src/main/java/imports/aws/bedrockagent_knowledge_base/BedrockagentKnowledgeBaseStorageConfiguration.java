package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.174Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentKnowledgeBaseStorageConfiguration.Jsii$Proxy.class)
public interface BedrockagentKnowledgeBaseStorageConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#type BedrockagentKnowledgeBase#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * opensearch_serverless_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#opensearch_serverless_configuration BedrockagentKnowledgeBase#opensearch_serverless_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getOpensearchServerlessConfiguration() {
        return null;
    }

    /**
     * pinecone_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#pinecone_configuration BedrockagentKnowledgeBase#pinecone_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPineconeConfiguration() {
        return null;
    }

    /**
     * rds_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#rds_configuration BedrockagentKnowledgeBase#rds_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRdsConfiguration() {
        return null;
    }

    /**
     * redis_enterprise_cloud_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#redis_enterprise_cloud_configuration BedrockagentKnowledgeBase#redis_enterprise_cloud_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRedisEnterpriseCloudConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentKnowledgeBaseStorageConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentKnowledgeBaseStorageConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentKnowledgeBaseStorageConfiguration> {
        java.lang.String type;
        java.lang.Object opensearchServerlessConfiguration;
        java.lang.Object pineconeConfiguration;
        java.lang.Object rdsConfiguration;
        java.lang.Object redisEnterpriseCloudConfiguration;

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfiguration#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#type BedrockagentKnowledgeBase#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfiguration#getOpensearchServerlessConfiguration}
         * @param opensearchServerlessConfiguration opensearch_serverless_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#opensearch_serverless_configuration BedrockagentKnowledgeBase#opensearch_serverless_configuration}
         * @return {@code this}
         */
        public Builder opensearchServerlessConfiguration(com.hashicorp.cdktf.IResolvable opensearchServerlessConfiguration) {
            this.opensearchServerlessConfiguration = opensearchServerlessConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfiguration#getOpensearchServerlessConfiguration}
         * @param opensearchServerlessConfiguration opensearch_serverless_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#opensearch_serverless_configuration BedrockagentKnowledgeBase#opensearch_serverless_configuration}
         * @return {@code this}
         */
        public Builder opensearchServerlessConfiguration(java.util.List<? extends imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationOpensearchServerlessConfiguration> opensearchServerlessConfiguration) {
            this.opensearchServerlessConfiguration = opensearchServerlessConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfiguration#getPineconeConfiguration}
         * @param pineconeConfiguration pinecone_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#pinecone_configuration BedrockagentKnowledgeBase#pinecone_configuration}
         * @return {@code this}
         */
        public Builder pineconeConfiguration(com.hashicorp.cdktf.IResolvable pineconeConfiguration) {
            this.pineconeConfiguration = pineconeConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfiguration#getPineconeConfiguration}
         * @param pineconeConfiguration pinecone_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#pinecone_configuration BedrockagentKnowledgeBase#pinecone_configuration}
         * @return {@code this}
         */
        public Builder pineconeConfiguration(java.util.List<? extends imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration> pineconeConfiguration) {
            this.pineconeConfiguration = pineconeConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfiguration#getRdsConfiguration}
         * @param rdsConfiguration rds_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#rds_configuration BedrockagentKnowledgeBase#rds_configuration}
         * @return {@code this}
         */
        public Builder rdsConfiguration(com.hashicorp.cdktf.IResolvable rdsConfiguration) {
            this.rdsConfiguration = rdsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfiguration#getRdsConfiguration}
         * @param rdsConfiguration rds_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#rds_configuration BedrockagentKnowledgeBase#rds_configuration}
         * @return {@code this}
         */
        public Builder rdsConfiguration(java.util.List<? extends imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration> rdsConfiguration) {
            this.rdsConfiguration = rdsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfiguration#getRedisEnterpriseCloudConfiguration}
         * @param redisEnterpriseCloudConfiguration redis_enterprise_cloud_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#redis_enterprise_cloud_configuration BedrockagentKnowledgeBase#redis_enterprise_cloud_configuration}
         * @return {@code this}
         */
        public Builder redisEnterpriseCloudConfiguration(com.hashicorp.cdktf.IResolvable redisEnterpriseCloudConfiguration) {
            this.redisEnterpriseCloudConfiguration = redisEnterpriseCloudConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfiguration#getRedisEnterpriseCloudConfiguration}
         * @param redisEnterpriseCloudConfiguration redis_enterprise_cloud_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#redis_enterprise_cloud_configuration BedrockagentKnowledgeBase#redis_enterprise_cloud_configuration}
         * @return {@code this}
         */
        public Builder redisEnterpriseCloudConfiguration(java.util.List<? extends imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration> redisEnterpriseCloudConfiguration) {
            this.redisEnterpriseCloudConfiguration = redisEnterpriseCloudConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentKnowledgeBaseStorageConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentKnowledgeBaseStorageConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentKnowledgeBaseStorageConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentKnowledgeBaseStorageConfiguration {
        private final java.lang.String type;
        private final java.lang.Object opensearchServerlessConfiguration;
        private final java.lang.Object pineconeConfiguration;
        private final java.lang.Object rdsConfiguration;
        private final java.lang.Object redisEnterpriseCloudConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.opensearchServerlessConfiguration = software.amazon.jsii.Kernel.get(this, "opensearchServerlessConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.pineconeConfiguration = software.amazon.jsii.Kernel.get(this, "pineconeConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.rdsConfiguration = software.amazon.jsii.Kernel.get(this, "rdsConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.redisEnterpriseCloudConfiguration = software.amazon.jsii.Kernel.get(this, "redisEnterpriseCloudConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.opensearchServerlessConfiguration = builder.opensearchServerlessConfiguration;
            this.pineconeConfiguration = builder.pineconeConfiguration;
            this.rdsConfiguration = builder.rdsConfiguration;
            this.redisEnterpriseCloudConfiguration = builder.redisEnterpriseCloudConfiguration;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Object getOpensearchServerlessConfiguration() {
            return this.opensearchServerlessConfiguration;
        }

        @Override
        public final java.lang.Object getPineconeConfiguration() {
            return this.pineconeConfiguration;
        }

        @Override
        public final java.lang.Object getRdsConfiguration() {
            return this.rdsConfiguration;
        }

        @Override
        public final java.lang.Object getRedisEnterpriseCloudConfiguration() {
            return this.redisEnterpriseCloudConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getOpensearchServerlessConfiguration() != null) {
                data.set("opensearchServerlessConfiguration", om.valueToTree(this.getOpensearchServerlessConfiguration()));
            }
            if (this.getPineconeConfiguration() != null) {
                data.set("pineconeConfiguration", om.valueToTree(this.getPineconeConfiguration()));
            }
            if (this.getRdsConfiguration() != null) {
                data.set("rdsConfiguration", om.valueToTree(this.getRdsConfiguration()));
            }
            if (this.getRedisEnterpriseCloudConfiguration() != null) {
                data.set("redisEnterpriseCloudConfiguration", om.valueToTree(this.getRedisEnterpriseCloudConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentKnowledgeBaseStorageConfiguration.Jsii$Proxy that = (BedrockagentKnowledgeBaseStorageConfiguration.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.opensearchServerlessConfiguration != null ? !this.opensearchServerlessConfiguration.equals(that.opensearchServerlessConfiguration) : that.opensearchServerlessConfiguration != null) return false;
            if (this.pineconeConfiguration != null ? !this.pineconeConfiguration.equals(that.pineconeConfiguration) : that.pineconeConfiguration != null) return false;
            if (this.rdsConfiguration != null ? !this.rdsConfiguration.equals(that.rdsConfiguration) : that.rdsConfiguration != null) return false;
            return this.redisEnterpriseCloudConfiguration != null ? this.redisEnterpriseCloudConfiguration.equals(that.redisEnterpriseCloudConfiguration) : that.redisEnterpriseCloudConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.opensearchServerlessConfiguration != null ? this.opensearchServerlessConfiguration.hashCode() : 0);
            result = 31 * result + (this.pineconeConfiguration != null ? this.pineconeConfiguration.hashCode() : 0);
            result = 31 * result + (this.rdsConfiguration != null ? this.rdsConfiguration.hashCode() : 0);
            result = 31 * result + (this.redisEnterpriseCloudConfiguration != null ? this.redisEnterpriseCloudConfiguration.hashCode() : 0);
            return result;
        }
    }
}
