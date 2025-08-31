package imports.aws.bedrockagent_knowledge_base;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.175Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration")
@software.amazon.jsii.Jsii.Proxy(BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration.Jsii$Proxy.class)
public interface BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#credentials_secret_arn BedrockagentKnowledgeBase#credentials_secret_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCredentialsSecretArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#database_name BedrockagentKnowledgeBase#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#resource_arn BedrockagentKnowledgeBase#resource_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#table_name BedrockagentKnowledgeBase#table_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableName();

    /**
     * field_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#field_mapping BedrockagentKnowledgeBase#field_mapping}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFieldMapping() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration> {
        java.lang.String credentialsSecretArn;
        java.lang.String databaseName;
        java.lang.String resourceArn;
        java.lang.String tableName;
        java.lang.Object fieldMapping;

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration#getCredentialsSecretArn}
         * @param credentialsSecretArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#credentials_secret_arn BedrockagentKnowledgeBase#credentials_secret_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder credentialsSecretArn(java.lang.String credentialsSecretArn) {
            this.credentialsSecretArn = credentialsSecretArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#database_name BedrockagentKnowledgeBase#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration#getResourceArn}
         * @param resourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#resource_arn BedrockagentKnowledgeBase#resource_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceArn(java.lang.String resourceArn) {
            this.resourceArn = resourceArn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration#getTableName}
         * @param tableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#table_name BedrockagentKnowledgeBase#table_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableName(java.lang.String tableName) {
            this.tableName = tableName;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration#getFieldMapping}
         * @param fieldMapping field_mapping block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#field_mapping BedrockagentKnowledgeBase#field_mapping}
         * @return {@code this}
         */
        public Builder fieldMapping(com.hashicorp.cdktf.IResolvable fieldMapping) {
            this.fieldMapping = fieldMapping;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration#getFieldMapping}
         * @param fieldMapping field_mapping block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_knowledge_base#field_mapping BedrockagentKnowledgeBase#field_mapping}
         * @return {@code this}
         */
        public Builder fieldMapping(java.util.List<? extends imports.aws.bedrockagent_knowledge_base.BedrockagentKnowledgeBaseStorageConfigurationRdsConfigurationFieldMapping> fieldMapping) {
            this.fieldMapping = fieldMapping;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration {
        private final java.lang.String credentialsSecretArn;
        private final java.lang.String databaseName;
        private final java.lang.String resourceArn;
        private final java.lang.String tableName;
        private final java.lang.Object fieldMapping;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.credentialsSecretArn = software.amazon.jsii.Kernel.get(this, "credentialsSecretArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceArn = software.amazon.jsii.Kernel.get(this, "resourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableName = software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fieldMapping = software.amazon.jsii.Kernel.get(this, "fieldMapping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.credentialsSecretArn = java.util.Objects.requireNonNull(builder.credentialsSecretArn, "credentialsSecretArn is required");
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.resourceArn = java.util.Objects.requireNonNull(builder.resourceArn, "resourceArn is required");
            this.tableName = java.util.Objects.requireNonNull(builder.tableName, "tableName is required");
            this.fieldMapping = builder.fieldMapping;
        }

        @Override
        public final java.lang.String getCredentialsSecretArn() {
            return this.credentialsSecretArn;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getResourceArn() {
            return this.resourceArn;
        }

        @Override
        public final java.lang.String getTableName() {
            return this.tableName;
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
            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            data.set("resourceArn", om.valueToTree(this.getResourceArn()));
            data.set("tableName", om.valueToTree(this.getTableName()));
            if (this.getFieldMapping() != null) {
                data.set("fieldMapping", om.valueToTree(this.getFieldMapping()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentKnowledgeBase.BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration.Jsii$Proxy that = (BedrockagentKnowledgeBaseStorageConfigurationRdsConfiguration.Jsii$Proxy) o;

            if (!credentialsSecretArn.equals(that.credentialsSecretArn)) return false;
            if (!databaseName.equals(that.databaseName)) return false;
            if (!resourceArn.equals(that.resourceArn)) return false;
            if (!tableName.equals(that.tableName)) return false;
            return this.fieldMapping != null ? this.fieldMapping.equals(that.fieldMapping) : that.fieldMapping == null;
        }

        @Override
        public final int hashCode() {
            int result = this.credentialsSecretArn.hashCode();
            result = 31 * result + (this.databaseName.hashCode());
            result = 31 * result + (this.resourceArn.hashCode());
            result = 31 * result + (this.tableName.hashCode());
            result = 31 * result + (this.fieldMapping != null ? this.fieldMapping.hashCode() : 0);
            return result;
        }
    }
}
