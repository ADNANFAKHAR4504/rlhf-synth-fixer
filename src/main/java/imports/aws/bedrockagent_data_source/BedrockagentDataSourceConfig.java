package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.159Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceConfig")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceConfig.Jsii$Proxy.class)
public interface BedrockagentDataSourceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#knowledge_base_id BedrockagentDataSource#knowledge_base_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKnowledgeBaseId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#name BedrockagentDataSource#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#data_deletion_policy BedrockagentDataSource#data_deletion_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataDeletionPolicy() {
        return null;
    }

    /**
     * data_source_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#data_source_configuration BedrockagentDataSource#data_source_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDataSourceConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#description BedrockagentDataSource#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * server_side_encryption_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#server_side_encryption_configuration BedrockagentDataSource#server_side_encryption_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getServerSideEncryptionConfiguration() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#timeouts BedrockagentDataSource#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_data_source.BedrockagentDataSourceTimeouts getTimeouts() {
        return null;
    }

    /**
     * vector_ingestion_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#vector_ingestion_configuration BedrockagentDataSource#vector_ingestion_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVectorIngestionConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceConfig> {
        java.lang.String knowledgeBaseId;
        java.lang.String name;
        java.lang.String dataDeletionPolicy;
        java.lang.Object dataSourceConfiguration;
        java.lang.String description;
        java.lang.Object serverSideEncryptionConfiguration;
        imports.aws.bedrockagent_data_source.BedrockagentDataSourceTimeouts timeouts;
        java.lang.Object vectorIngestionConfiguration;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getKnowledgeBaseId}
         * @param knowledgeBaseId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#knowledge_base_id BedrockagentDataSource#knowledge_base_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder knowledgeBaseId(java.lang.String knowledgeBaseId) {
            this.knowledgeBaseId = knowledgeBaseId;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#name BedrockagentDataSource#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getDataDeletionPolicy}
         * @param dataDeletionPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#data_deletion_policy BedrockagentDataSource#data_deletion_policy}.
         * @return {@code this}
         */
        public Builder dataDeletionPolicy(java.lang.String dataDeletionPolicy) {
            this.dataDeletionPolicy = dataDeletionPolicy;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getDataSourceConfiguration}
         * @param dataSourceConfiguration data_source_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#data_source_configuration BedrockagentDataSource#data_source_configuration}
         * @return {@code this}
         */
        public Builder dataSourceConfiguration(com.hashicorp.cdktf.IResolvable dataSourceConfiguration) {
            this.dataSourceConfiguration = dataSourceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getDataSourceConfiguration}
         * @param dataSourceConfiguration data_source_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#data_source_configuration BedrockagentDataSource#data_source_configuration}
         * @return {@code this}
         */
        public Builder dataSourceConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceDataSourceConfiguration> dataSourceConfiguration) {
            this.dataSourceConfiguration = dataSourceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#description BedrockagentDataSource#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getServerSideEncryptionConfiguration}
         * @param serverSideEncryptionConfiguration server_side_encryption_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#server_side_encryption_configuration BedrockagentDataSource#server_side_encryption_configuration}
         * @return {@code this}
         */
        public Builder serverSideEncryptionConfiguration(com.hashicorp.cdktf.IResolvable serverSideEncryptionConfiguration) {
            this.serverSideEncryptionConfiguration = serverSideEncryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getServerSideEncryptionConfiguration}
         * @param serverSideEncryptionConfiguration server_side_encryption_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#server_side_encryption_configuration BedrockagentDataSource#server_side_encryption_configuration}
         * @return {@code this}
         */
        public Builder serverSideEncryptionConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceServerSideEncryptionConfiguration> serverSideEncryptionConfiguration) {
            this.serverSideEncryptionConfiguration = serverSideEncryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#timeouts BedrockagentDataSource#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.bedrockagent_data_source.BedrockagentDataSourceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getVectorIngestionConfiguration}
         * @param vectorIngestionConfiguration vector_ingestion_configuration block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#vector_ingestion_configuration BedrockagentDataSource#vector_ingestion_configuration}
         * @return {@code this}
         */
        public Builder vectorIngestionConfiguration(com.hashicorp.cdktf.IResolvable vectorIngestionConfiguration) {
            this.vectorIngestionConfiguration = vectorIngestionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getVectorIngestionConfiguration}
         * @param vectorIngestionConfiguration vector_ingestion_configuration block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#vector_ingestion_configuration BedrockagentDataSource#vector_ingestion_configuration}
         * @return {@code this}
         */
        public Builder vectorIngestionConfiguration(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfiguration> vectorIngestionConfiguration) {
            this.vectorIngestionConfiguration = vectorIngestionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceConfig {
        private final java.lang.String knowledgeBaseId;
        private final java.lang.String name;
        private final java.lang.String dataDeletionPolicy;
        private final java.lang.Object dataSourceConfiguration;
        private final java.lang.String description;
        private final java.lang.Object serverSideEncryptionConfiguration;
        private final imports.aws.bedrockagent_data_source.BedrockagentDataSourceTimeouts timeouts;
        private final java.lang.Object vectorIngestionConfiguration;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.knowledgeBaseId = software.amazon.jsii.Kernel.get(this, "knowledgeBaseId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataDeletionPolicy = software.amazon.jsii.Kernel.get(this, "dataDeletionPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataSourceConfiguration = software.amazon.jsii.Kernel.get(this, "dataSourceConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverSideEncryptionConfiguration = software.amazon.jsii.Kernel.get(this, "serverSideEncryptionConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.bedrockagent_data_source.BedrockagentDataSourceTimeouts.class));
            this.vectorIngestionConfiguration = software.amazon.jsii.Kernel.get(this, "vectorIngestionConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.knowledgeBaseId = java.util.Objects.requireNonNull(builder.knowledgeBaseId, "knowledgeBaseId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.dataDeletionPolicy = builder.dataDeletionPolicy;
            this.dataSourceConfiguration = builder.dataSourceConfiguration;
            this.description = builder.description;
            this.serverSideEncryptionConfiguration = builder.serverSideEncryptionConfiguration;
            this.timeouts = builder.timeouts;
            this.vectorIngestionConfiguration = builder.vectorIngestionConfiguration;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getKnowledgeBaseId() {
            return this.knowledgeBaseId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getDataDeletionPolicy() {
            return this.dataDeletionPolicy;
        }

        @Override
        public final java.lang.Object getDataSourceConfiguration() {
            return this.dataSourceConfiguration;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getServerSideEncryptionConfiguration() {
            return this.serverSideEncryptionConfiguration;
        }

        @Override
        public final imports.aws.bedrockagent_data_source.BedrockagentDataSourceTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getVectorIngestionConfiguration() {
            return this.vectorIngestionConfiguration;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("knowledgeBaseId", om.valueToTree(this.getKnowledgeBaseId()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getDataDeletionPolicy() != null) {
                data.set("dataDeletionPolicy", om.valueToTree(this.getDataDeletionPolicy()));
            }
            if (this.getDataSourceConfiguration() != null) {
                data.set("dataSourceConfiguration", om.valueToTree(this.getDataSourceConfiguration()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getServerSideEncryptionConfiguration() != null) {
                data.set("serverSideEncryptionConfiguration", om.valueToTree(this.getServerSideEncryptionConfiguration()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVectorIngestionConfiguration() != null) {
                data.set("vectorIngestionConfiguration", om.valueToTree(this.getVectorIngestionConfiguration()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceConfig.Jsii$Proxy that = (BedrockagentDataSourceConfig.Jsii$Proxy) o;

            if (!knowledgeBaseId.equals(that.knowledgeBaseId)) return false;
            if (!name.equals(that.name)) return false;
            if (this.dataDeletionPolicy != null ? !this.dataDeletionPolicy.equals(that.dataDeletionPolicy) : that.dataDeletionPolicy != null) return false;
            if (this.dataSourceConfiguration != null ? !this.dataSourceConfiguration.equals(that.dataSourceConfiguration) : that.dataSourceConfiguration != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.serverSideEncryptionConfiguration != null ? !this.serverSideEncryptionConfiguration.equals(that.serverSideEncryptionConfiguration) : that.serverSideEncryptionConfiguration != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vectorIngestionConfiguration != null ? !this.vectorIngestionConfiguration.equals(that.vectorIngestionConfiguration) : that.vectorIngestionConfiguration != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.knowledgeBaseId.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.dataDeletionPolicy != null ? this.dataDeletionPolicy.hashCode() : 0);
            result = 31 * result + (this.dataSourceConfiguration != null ? this.dataSourceConfiguration.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.serverSideEncryptionConfiguration != null ? this.serverSideEncryptionConfiguration.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vectorIngestionConfiguration != null ? this.vectorIngestionConfiguration.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
