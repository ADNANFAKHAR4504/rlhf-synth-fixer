package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.175Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration.Jsii$Proxy.class)
public interface BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#credentials_secret_arn BedrockagentKnowledgeBase#credentials_secret_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCredentialsSecretArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#endpoint BedrockagentKnowledgeBase#endpoint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndpoint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#vector_index_name BedrockagentKnowledgeBase#vector_index_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVectorIndexName();

    /**
     * field_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#field_mapping BedrockagentKnowledgeBase#field_mapping}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFieldMapping() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration> {
        java.lang.String credentialsSecretArn;
        java.lang.String endpoint;
        java.lang.String vectorIndexName;
        java.lang.Object fieldMapping;

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration#getCredentialsSecretArn}
         * @param credentialsSecretArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#credentials_secret_arn BedrockagentKnowledgeBase#credentials_secret_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder credentialsSecretArn(java.lang.String credentialsSecretArn) {
            this.credentialsSecretArn = credentialsSecretArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration#getEndpoint}
         * @param endpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#endpoint BedrockagentKnowledgeBase#endpoint}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpoint(java.lang.String endpoint) {
            this.endpoint = endpoint;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration#getVectorIndexName}
         * @param vectorIndexName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#vector_index_name BedrockagentKnowledgeBase#vector_index_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder vectorIndexName(java.lang.String vectorIndexName) {
            this.vectorIndexName = vectorIndexName;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration#getFieldMapping}
         * @param fieldMapping field_mapping block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#field_mapping BedrockagentKnowledgeBase#field_mapping}
         * @return {@code this}
         */
        public Builder fieldMapping(com.hashicorp.cdktf.IResolvable fieldMapping) {
            this.fieldMapping = fieldMapping;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration#getFieldMapping}
         * @param fieldMapping field_mapping block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#field_mapping BedrockagentKnowledgeBase#field_mapping}
         * @return {@code this}
         */
        public Builder fieldMapping(java.util.List<? extends imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfigurationFieldMapping> fieldMapping) {
            this.fieldMapping = fieldMapping;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration {
        private final java.lang.String credentialsSecretArn;
        private final java.lang.String endpoint;
        private final java.lang.String vectorIndexName;
        private final java.lang.Object fieldMapping;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.credentialsSecretArn = software.amazon.jsii.Kernel.get(this, "credentialsSecretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpoint = software.amazon.jsii.Kernel.get(this, "endpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vectorIndexName = software.amazon.jsii.Kernel.get(this, "vectorIndexName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fieldMapping = software.amazon.jsii.Kernel.get(this, "fieldMapping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.credentialsSecretArn = java.util.Objects.requireNonNull(builder.credentialsSecretArn, "credentialsSecretArn is required");
            this.endpoint = java.util.Objects.requireNonNull(builder.endpoint, "endpoint is required");
            this.vectorIndexName = java.util.Objects.requireNonNull(builder.vectorIndexName, "vectorIndexName is required");
            this.fieldMapping = builder.fieldMapping;
        }

        @Override
        public final java.lang.String getCredentialsSecretArn() {
            return this.credentialsSecretArn;
        }

        @Override
        public final java.lang.String getEndpoint() {
            return this.endpoint;
        }

        @Override
        public final java.lang.String getVectorIndexName() {
            return this.vectorIndexName;
        }

        @Override
        public final java.lang.Object getFieldMapping() {
            return this.fieldMapping;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("credentialsSecretArn", om.valueToTree(this.getCredentialsSecretArn()));
            data.set("endpoint", om.valueToTree(this.getEndpoint()));
            data.set("vectorIndexName", om.valueToTree(this.getVectorIndexName()));
            if (this.getFieldMapping() != null) {
                data.set("fieldMapping", om.valueToTree(this.getFieldMapping()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration.Jsii$Proxy that = (BedrockagentKnowledgeBaseStorageConfigurationRedisEnterpriseCloudConfiguration.Jsii$Proxy) o;

            if (!credentialsSecretArn.equals(that.credentialsSecretArn)) return false;
            if (!endpoint.equals(that.endpoint)) return false;
            if (!vectorIndexName.equals(that.vectorIndexName)) return false;
            return this.fieldMapping != null ? this.fieldMapping.equals(that.fieldMapping) : that.fieldMapping == null;
        }

        @Override
        public final int hashCode() {
            int result = this.credentialsSecretArn.hashCode();
            result = 31 * result + (this.endpoint.hashCode());
            result = 31 * result + (this.vectorIndexName.hashCode());
            result = 31 * result + (this.fieldMapping != null ? this.fieldMapping.hashCode() : 0);
            return result;
        }
    }
}
