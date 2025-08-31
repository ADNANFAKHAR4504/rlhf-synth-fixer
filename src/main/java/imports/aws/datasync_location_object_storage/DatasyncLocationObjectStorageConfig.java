package imports.aws.datasync_location_object_storage;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.948Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationObjectStorage.DatasyncLocationObjectStorageConfig")
@software.amazon.jsii.Jsii.Proxy(DatasyncLocationObjectStorageConfig.Jsii$Proxy.class)
public interface DatasyncLocationObjectStorageConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#agent_arns DatasyncLocationObjectStorage#agent_arns}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAgentArns();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#bucket_name DatasyncLocationObjectStorage#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#server_hostname DatasyncLocationObjectStorage#server_hostname}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServerHostname();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#access_key DatasyncLocationObjectStorage#access_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#id DatasyncLocationObjectStorage#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#secret_key DatasyncLocationObjectStorage#secret_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#server_certificate DatasyncLocationObjectStorage#server_certificate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServerCertificate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#server_port DatasyncLocationObjectStorage#server_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getServerPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#server_protocol DatasyncLocationObjectStorage#server_protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServerProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#subdirectory DatasyncLocationObjectStorage#subdirectory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubdirectory() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#tags DatasyncLocationObjectStorage#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#tags_all DatasyncLocationObjectStorage#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncLocationObjectStorageConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncLocationObjectStorageConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncLocationObjectStorageConfig> {
        java.util.List<java.lang.String> agentArns;
        java.lang.String bucketName;
        java.lang.String serverHostname;
        java.lang.String accessKey;
        java.lang.String id;
        java.lang.String secretKey;
        java.lang.String serverCertificate;
        java.lang.Number serverPort;
        java.lang.String serverProtocol;
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
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getAgentArns}
         * @param agentArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#agent_arns DatasyncLocationObjectStorage#agent_arns}. This parameter is required.
         * @return {@code this}
         */
        public Builder agentArns(java.util.List<java.lang.String> agentArns) {
            this.agentArns = agentArns;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#bucket_name DatasyncLocationObjectStorage#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getServerHostname}
         * @param serverHostname Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#server_hostname DatasyncLocationObjectStorage#server_hostname}. This parameter is required.
         * @return {@code this}
         */
        public Builder serverHostname(java.lang.String serverHostname) {
            this.serverHostname = serverHostname;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getAccessKey}
         * @param accessKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#access_key DatasyncLocationObjectStorage#access_key}.
         * @return {@code this}
         */
        public Builder accessKey(java.lang.String accessKey) {
            this.accessKey = accessKey;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#id DatasyncLocationObjectStorage#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getSecretKey}
         * @param secretKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#secret_key DatasyncLocationObjectStorage#secret_key}.
         * @return {@code this}
         */
        public Builder secretKey(java.lang.String secretKey) {
            this.secretKey = secretKey;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getServerCertificate}
         * @param serverCertificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#server_certificate DatasyncLocationObjectStorage#server_certificate}.
         * @return {@code this}
         */
        public Builder serverCertificate(java.lang.String serverCertificate) {
            this.serverCertificate = serverCertificate;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getServerPort}
         * @param serverPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#server_port DatasyncLocationObjectStorage#server_port}.
         * @return {@code this}
         */
        public Builder serverPort(java.lang.Number serverPort) {
            this.serverPort = serverPort;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getServerProtocol}
         * @param serverProtocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#server_protocol DatasyncLocationObjectStorage#server_protocol}.
         * @return {@code this}
         */
        public Builder serverProtocol(java.lang.String serverProtocol) {
            this.serverProtocol = serverProtocol;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getSubdirectory}
         * @param subdirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#subdirectory DatasyncLocationObjectStorage#subdirectory}.
         * @return {@code this}
         */
        public Builder subdirectory(java.lang.String subdirectory) {
            this.subdirectory = subdirectory;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#tags DatasyncLocationObjectStorage#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_object_storage#tags_all DatasyncLocationObjectStorage#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getDependsOn}
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
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationObjectStorageConfig#getProvisioners}
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
         * @return a new instance of {@link DatasyncLocationObjectStorageConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncLocationObjectStorageConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncLocationObjectStorageConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncLocationObjectStorageConfig {
        private final java.util.List<java.lang.String> agentArns;
        private final java.lang.String bucketName;
        private final java.lang.String serverHostname;
        private final java.lang.String accessKey;
        private final java.lang.String id;
        private final java.lang.String secretKey;
        private final java.lang.String serverCertificate;
        private final java.lang.Number serverPort;
        private final java.lang.String serverProtocol;
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
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverHostname = software.amazon.jsii.Kernel.get(this, "serverHostname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessKey = software.amazon.jsii.Kernel.get(this, "accessKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretKey = software.amazon.jsii.Kernel.get(this, "secretKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverCertificate = software.amazon.jsii.Kernel.get(this, "serverCertificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverPort = software.amazon.jsii.Kernel.get(this, "serverPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.serverProtocol = software.amazon.jsii.Kernel.get(this, "serverProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.serverHostname = java.util.Objects.requireNonNull(builder.serverHostname, "serverHostname is required");
            this.accessKey = builder.accessKey;
            this.id = builder.id;
            this.secretKey = builder.secretKey;
            this.serverCertificate = builder.serverCertificate;
            this.serverPort = builder.serverPort;
            this.serverProtocol = builder.serverProtocol;
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
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getServerHostname() {
            return this.serverHostname;
        }

        @Override
        public final java.lang.String getAccessKey() {
            return this.accessKey;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getSecretKey() {
            return this.secretKey;
        }

        @Override
        public final java.lang.String getServerCertificate() {
            return this.serverCertificate;
        }

        @Override
        public final java.lang.Number getServerPort() {
            return this.serverPort;
        }

        @Override
        public final java.lang.String getServerProtocol() {
            return this.serverProtocol;
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
            data.set("bucketName", om.valueToTree(this.getBucketName()));
            data.set("serverHostname", om.valueToTree(this.getServerHostname()));
            if (this.getAccessKey() != null) {
                data.set("accessKey", om.valueToTree(this.getAccessKey()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getSecretKey() != null) {
                data.set("secretKey", om.valueToTree(this.getSecretKey()));
            }
            if (this.getServerCertificate() != null) {
                data.set("serverCertificate", om.valueToTree(this.getServerCertificate()));
            }
            if (this.getServerPort() != null) {
                data.set("serverPort", om.valueToTree(this.getServerPort()));
            }
            if (this.getServerProtocol() != null) {
                data.set("serverProtocol", om.valueToTree(this.getServerProtocol()));
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
            struct.set("fqn", om.valueToTree("aws.datasyncLocationObjectStorage.DatasyncLocationObjectStorageConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncLocationObjectStorageConfig.Jsii$Proxy that = (DatasyncLocationObjectStorageConfig.Jsii$Proxy) o;

            if (!agentArns.equals(that.agentArns)) return false;
            if (!bucketName.equals(that.bucketName)) return false;
            if (!serverHostname.equals(that.serverHostname)) return false;
            if (this.accessKey != null ? !this.accessKey.equals(that.accessKey) : that.accessKey != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.secretKey != null ? !this.secretKey.equals(that.secretKey) : that.secretKey != null) return false;
            if (this.serverCertificate != null ? !this.serverCertificate.equals(that.serverCertificate) : that.serverCertificate != null) return false;
            if (this.serverPort != null ? !this.serverPort.equals(that.serverPort) : that.serverPort != null) return false;
            if (this.serverProtocol != null ? !this.serverProtocol.equals(that.serverProtocol) : that.serverProtocol != null) return false;
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
            result = 31 * result + (this.bucketName.hashCode());
            result = 31 * result + (this.serverHostname.hashCode());
            result = 31 * result + (this.accessKey != null ? this.accessKey.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.secretKey != null ? this.secretKey.hashCode() : 0);
            result = 31 * result + (this.serverCertificate != null ? this.serverCertificate.hashCode() : 0);
            result = 31 * result + (this.serverPort != null ? this.serverPort.hashCode() : 0);
            result = 31 * result + (this.serverProtocol != null ? this.serverProtocol.hashCode() : 0);
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
