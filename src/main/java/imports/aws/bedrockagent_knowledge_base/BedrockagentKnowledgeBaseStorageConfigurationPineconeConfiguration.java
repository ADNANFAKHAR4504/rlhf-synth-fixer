package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.174Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration.Jsii$Proxy.class)
public interface BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#connection_string BedrockagentKnowledgeBase#connection_string}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConnectionString();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#credentials_secret_arn BedrockagentKnowledgeBase#credentials_secret_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCredentialsSecretArn();

    /**
     * field_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#field_mapping BedrockagentKnowledgeBase#field_mapping}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFieldMapping() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#namespace BedrockagentKnowledgeBase#namespace}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamespace() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration> {
        java.lang.String connectionString;
        java.lang.String credentialsSecretArn;
        java.lang.Object fieldMapping;
        java.lang.String namespace;

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration#getConnectionString}
         * @param connectionString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#connection_string BedrockagentKnowledgeBase#connection_string}. This parameter is required.
         * @return {@code this}
         */
        public Builder connectionString(java.lang.String connectionString) {
            this.connectionString = connectionString;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration#getCredentialsSecretArn}
         * @param credentialsSecretArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#credentials_secret_arn BedrockagentKnowledgeBase#credentials_secret_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder credentialsSecretArn(java.lang.String credentialsSecretArn) {
            this.credentialsSecretArn = credentialsSecretArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration#getFieldMapping}
         * @param fieldMapping field_mapping block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#field_mapping BedrockagentKnowledgeBase#field_mapping}
         * @return {@code this}
         */
        public Builder fieldMapping(com.hashicorp.cdktf.IResolvable fieldMapping) {
            this.fieldMapping = fieldMapping;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration#getFieldMapping}
         * @param fieldMapping field_mapping block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#field_mapping BedrockagentKnowledgeBase#field_mapping}
         * @return {@code this}
         */
        public Builder fieldMapping(java.util.List<? extends imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationPineconeConfigurationFieldMapping> fieldMapping) {
            this.fieldMapping = fieldMapping;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration#getNamespace}
         * @param namespace Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#namespace BedrockagentKnowledgeBase#namespace}.
         * @return {@code this}
         */
        public Builder namespace(java.lang.String namespace) {
            this.namespace = namespace;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration {
        private final java.lang.String connectionString;
        private final java.lang.String credentialsSecretArn;
        private final java.lang.Object fieldMapping;
        private final java.lang.String namespace;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.connectionString = software.amazon.jsii.Kernel.get(this, "connectionString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.credentialsSecretArn = software.amazon.jsii.Kernel.get(this, "credentialsSecretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fieldMapping = software.amazon.jsii.Kernel.get(this, "fieldMapping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.namespace = software.amazon.jsii.Kernel.get(this, "namespace", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.connectionString = java.util.Objects.requireNonNull(builder.connectionString, "connectionString is required");
            this.credentialsSecretArn = java.util.Objects.requireNonNull(builder.credentialsSecretArn, "credentialsSecretArn is required");
            this.fieldMapping = builder.fieldMapping;
            this.namespace = builder.namespace;
        }

        @Override
        public final java.lang.String getConnectionString() {
            return this.connectionString;
        }

        @Override
        public final java.lang.String getCredentialsSecretArn() {
            return this.credentialsSecretArn;
        }

        @Override
        public final java.lang.Object getFieldMapping() {
            return this.fieldMapping;
        }

        @Override
        public final java.lang.String getNamespace() {
            return this.namespace;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("connectionString", om.valueToTree(this.getConnectionString()));
            data.set("credentialsSecretArn", om.valueToTree(this.getCredentialsSecretArn()));
            if (this.getFieldMapping() != null) {
                data.set("fieldMapping", om.valueToTree(this.getFieldMapping()));
            }
            if (this.getNamespace() != null) {
                data.set("namespace", om.valueToTree(this.getNamespace()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration.Jsii$Proxy that = (BedrockagentKnowledgeBaseStorageConfigurationPineconeConfiguration.Jsii$Proxy) o;

            if (!connectionString.equals(that.connectionString)) return false;
            if (!credentialsSecretArn.equals(that.credentialsSecretArn)) return false;
            if (this.fieldMapping != null ? !this.fieldMapping.equals(that.fieldMapping) : that.fieldMapping != null) return false;
            return this.namespace != null ? this.namespace.equals(that.namespace) : that.namespace == null;
        }

        @Override
        public final int hashCode() {
            int result = this.connectionString.hashCode();
            result = 31 * result + (this.credentialsSecretArn.hashCode());
            result = 31 * result + (this.fieldMapping != null ? this.fieldMapping.hashCode() : 0);
            result = 31 * result + (this.namespace != null ? this.namespace.hashCode() : 0);
            return result;
        }
    }
}
