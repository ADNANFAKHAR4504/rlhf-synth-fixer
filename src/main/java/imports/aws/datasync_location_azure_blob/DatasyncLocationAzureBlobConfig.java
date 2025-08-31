package imports.aws.datasync_location_azure_blob;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.941Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationAzureBlob.DatasyncLocationAzureBlobConfig")
@software.amazon.jsii.Jsii.Proxy(DatasyncLocationAzureBlobConfig.Jsii$Proxy.class)
public interface DatasyncLocationAzureBlobConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#agent_arns DatasyncLocationAzureBlob#agent_arns}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAgentArns();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#authentication_type DatasyncLocationAzureBlob#authentication_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#container_url DatasyncLocationAzureBlob#container_url}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContainerUrl();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#access_tier DatasyncLocationAzureBlob#access_tier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessTier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#blob_type DatasyncLocationAzureBlob#blob_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBlobType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#id DatasyncLocationAzureBlob#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * sas_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#sas_configuration DatasyncLocationAzureBlob#sas_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datasync_location_azure_blob.DatasyncLocationAzureBlobSasConfiguration getSasConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#subdirectory DatasyncLocationAzureBlob#subdirectory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubdirectory() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#tags DatasyncLocationAzureBlob#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#tags_all DatasyncLocationAzureBlob#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncLocationAzureBlobConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncLocationAzureBlobConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncLocationAzureBlobConfig> {
        java.util.List<java.lang.String> agentArns;
        java.lang.String authenticationType;
        java.lang.String containerUrl;
        java.lang.String accessTier;
        java.lang.String blobType;
        java.lang.String id;
        imports.aws.datasync_location_azure_blob.DatasyncLocationAzureBlobSasConfiguration sasConfiguration;
        java.lang.String subdirectory;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getAgentArns}
         * @param agentArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#agent_arns DatasyncLocationAzureBlob#agent_arns}. This parameter is required.
         * @return {@code this}
         */
        public Builder agentArns(java.util.List<java.lang.String> agentArns) {
            this.agentArns = agentArns;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getAuthenticationType}
         * @param authenticationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#authentication_type DatasyncLocationAzureBlob#authentication_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder authenticationType(java.lang.String authenticationType) {
            this.authenticationType = authenticationType;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getContainerUrl}
         * @param containerUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#container_url DatasyncLocationAzureBlob#container_url}. This parameter is required.
         * @return {@code this}
         */
        public Builder containerUrl(java.lang.String containerUrl) {
            this.containerUrl = containerUrl;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getAccessTier}
         * @param accessTier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#access_tier DatasyncLocationAzureBlob#access_tier}.
         * @return {@code this}
         */
        public Builder accessTier(java.lang.String accessTier) {
            this.accessTier = accessTier;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getBlobType}
         * @param blobType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#blob_type DatasyncLocationAzureBlob#blob_type}.
         * @return {@code this}
         */
        public Builder blobType(java.lang.String blobType) {
            this.blobType = blobType;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#id DatasyncLocationAzureBlob#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getSasConfiguration}
         * @param sasConfiguration sas_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#sas_configuration DatasyncLocationAzureBlob#sas_configuration}
         * @return {@code this}
         */
        public Builder sasConfiguration(imports.aws.datasync_location_azure_blob.DatasyncLocationAzureBlobSasConfiguration sasConfiguration) {
            this.sasConfiguration = sasConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getSubdirectory}
         * @param subdirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#subdirectory DatasyncLocationAzureBlob#subdirectory}.
         * @return {@code this}
         */
        public Builder subdirectory(java.lang.String subdirectory) {
            this.subdirectory = subdirectory;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#tags DatasyncLocationAzureBlob#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#tags_all DatasyncLocationAzureBlob#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getDependsOn}
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
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobConfig#getProvisioners}
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
         * @return a new instance of {@link DatasyncLocationAzureBlobConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncLocationAzureBlobConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncLocationAzureBlobConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncLocationAzureBlobConfig {
        private final java.util.List<java.lang.String> agentArns;
        private final java.lang.String authenticationType;
        private final java.lang.String containerUrl;
        private final java.lang.String accessTier;
        private final java.lang.String blobType;
        private final java.lang.String id;
        private final imports.aws.datasync_location_azure_blob.DatasyncLocationAzureBlobSasConfiguration sasConfiguration;
        private final java.lang.String subdirectory;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.agentArns = software.amazon.jsii.Kernel.get(this, "agentArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.authenticationType = software.amazon.jsii.Kernel.get(this, "authenticationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.containerUrl = software.amazon.jsii.Kernel.get(this, "containerUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessTier = software.amazon.jsii.Kernel.get(this, "accessTier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.blobType = software.amazon.jsii.Kernel.get(this, "blobType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sasConfiguration = software.amazon.jsii.Kernel.get(this, "sasConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_azure_blob.DatasyncLocationAzureBlobSasConfiguration.class));
            this.subdirectory = software.amazon.jsii.Kernel.get(this, "subdirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.agentArns = java.util.Objects.requireNonNull(builder.agentArns, "agentArns is required");
            this.authenticationType = java.util.Objects.requireNonNull(builder.authenticationType, "authenticationType is required");
            this.containerUrl = java.util.Objects.requireNonNull(builder.containerUrl, "containerUrl is required");
            this.accessTier = builder.accessTier;
            this.blobType = builder.blobType;
            this.id = builder.id;
            this.sasConfiguration = builder.sasConfiguration;
            this.subdirectory = builder.subdirectory;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.util.List<java.lang.String> getAgentArns() {
            return this.agentArns;
        }

        @Override
        public final java.lang.String getAuthenticationType() {
            return this.authenticationType;
        }

        @Override
        public final java.lang.String getContainerUrl() {
            return this.containerUrl;
        }

        @Override
        public final java.lang.String getAccessTier() {
            return this.accessTier;
        }

        @Override
        public final java.lang.String getBlobType() {
            return this.blobType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.datasync_location_azure_blob.DatasyncLocationAzureBlobSasConfiguration getSasConfiguration() {
            return this.sasConfiguration;
        }

        @Override
        public final java.lang.String getSubdirectory() {
            return this.subdirectory;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
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

            data.set("agentArns", om.valueToTree(this.getAgentArns()));
            data.set("authenticationType", om.valueToTree(this.getAuthenticationType()));
            data.set("containerUrl", om.valueToTree(this.getContainerUrl()));
            if (this.getAccessTier() != null) {
                data.set("accessTier", om.valueToTree(this.getAccessTier()));
            }
            if (this.getBlobType() != null) {
                data.set("blobType", om.valueToTree(this.getBlobType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getSasConfiguration() != null) {
                data.set("sasConfiguration", om.valueToTree(this.getSasConfiguration()));
            }
            if (this.getSubdirectory() != null) {
                data.set("subdirectory", om.valueToTree(this.getSubdirectory()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.datasyncLocationAzureBlob.DatasyncLocationAzureBlobConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncLocationAzureBlobConfig.Jsii$Proxy that = (DatasyncLocationAzureBlobConfig.Jsii$Proxy) o;

            if (!agentArns.equals(that.agentArns)) return false;
            if (!authenticationType.equals(that.authenticationType)) return false;
            if (!containerUrl.equals(that.containerUrl)) return false;
            if (this.accessTier != null ? !this.accessTier.equals(that.accessTier) : that.accessTier != null) return false;
            if (this.blobType != null ? !this.blobType.equals(that.blobType) : that.blobType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.sasConfiguration != null ? !this.sasConfiguration.equals(that.sasConfiguration) : that.sasConfiguration != null) return false;
            if (this.subdirectory != null ? !this.subdirectory.equals(that.subdirectory) : that.subdirectory != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.agentArns.hashCode();
            result = 31 * result + (this.authenticationType.hashCode());
            result = 31 * result + (this.containerUrl.hashCode());
            result = 31 * result + (this.accessTier != null ? this.accessTier.hashCode() : 0);
            result = 31 * result + (this.blobType != null ? this.blobType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.sasConfiguration != null ? this.sasConfiguration.hashCode() : 0);
            result = 31 * result + (this.subdirectory != null ? this.subdirectory.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
