package imports.aws.glue_dev_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.295Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueDevEndpoint.GlueDevEndpointConfig")
@software.amazon.jsii.Jsii.Proxy(GlueDevEndpointConfig.Jsii$Proxy.class)
public interface GlueDevEndpointConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#name GlueDevEndpoint#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#role_arn GlueDevEndpoint#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#arguments GlueDevEndpoint#arguments}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getArguments() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#extra_jars_s3_path GlueDevEndpoint#extra_jars_s3_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExtraJarsS3Path() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#extra_python_libs_s3_path GlueDevEndpoint#extra_python_libs_s3_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExtraPythonLibsS3Path() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#glue_version GlueDevEndpoint#glue_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGlueVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#id GlueDevEndpoint#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#number_of_nodes GlueDevEndpoint#number_of_nodes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfNodes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#number_of_workers GlueDevEndpoint#number_of_workers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfWorkers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#public_key GlueDevEndpoint#public_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPublicKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#public_keys GlueDevEndpoint#public_keys}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPublicKeys() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#security_configuration GlueDevEndpoint#security_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecurityConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#security_group_ids GlueDevEndpoint#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#subnet_id GlueDevEndpoint#subnet_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#tags GlueDevEndpoint#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#tags_all GlueDevEndpoint#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#worker_type GlueDevEndpoint#worker_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWorkerType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueDevEndpointConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueDevEndpointConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueDevEndpointConfig> {
        java.lang.String name;
        java.lang.String roleArn;
        java.util.Map<java.lang.String, java.lang.String> arguments;
        java.lang.String extraJarsS3Path;
        java.lang.String extraPythonLibsS3Path;
        java.lang.String glueVersion;
        java.lang.String id;
        java.lang.Number numberOfNodes;
        java.lang.Number numberOfWorkers;
        java.lang.String publicKey;
        java.util.List<java.lang.String> publicKeys;
        java.lang.String securityConfiguration;
        java.util.List<java.lang.String> securityGroupIds;
        java.lang.String subnetId;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String workerType;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#name GlueDevEndpoint#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#role_arn GlueDevEndpoint#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getArguments}
         * @param arguments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#arguments GlueDevEndpoint#arguments}.
         * @return {@code this}
         */
        public Builder arguments(java.util.Map<java.lang.String, java.lang.String> arguments) {
            this.arguments = arguments;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getExtraJarsS3Path}
         * @param extraJarsS3Path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#extra_jars_s3_path GlueDevEndpoint#extra_jars_s3_path}.
         * @return {@code this}
         */
        public Builder extraJarsS3Path(java.lang.String extraJarsS3Path) {
            this.extraJarsS3Path = extraJarsS3Path;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getExtraPythonLibsS3Path}
         * @param extraPythonLibsS3Path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#extra_python_libs_s3_path GlueDevEndpoint#extra_python_libs_s3_path}.
         * @return {@code this}
         */
        public Builder extraPythonLibsS3Path(java.lang.String extraPythonLibsS3Path) {
            this.extraPythonLibsS3Path = extraPythonLibsS3Path;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getGlueVersion}
         * @param glueVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#glue_version GlueDevEndpoint#glue_version}.
         * @return {@code this}
         */
        public Builder glueVersion(java.lang.String glueVersion) {
            this.glueVersion = glueVersion;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#id GlueDevEndpoint#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getNumberOfNodes}
         * @param numberOfNodes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#number_of_nodes GlueDevEndpoint#number_of_nodes}.
         * @return {@code this}
         */
        public Builder numberOfNodes(java.lang.Number numberOfNodes) {
            this.numberOfNodes = numberOfNodes;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getNumberOfWorkers}
         * @param numberOfWorkers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#number_of_workers GlueDevEndpoint#number_of_workers}.
         * @return {@code this}
         */
        public Builder numberOfWorkers(java.lang.Number numberOfWorkers) {
            this.numberOfWorkers = numberOfWorkers;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getPublicKey}
         * @param publicKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#public_key GlueDevEndpoint#public_key}.
         * @return {@code this}
         */
        public Builder publicKey(java.lang.String publicKey) {
            this.publicKey = publicKey;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getPublicKeys}
         * @param publicKeys Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#public_keys GlueDevEndpoint#public_keys}.
         * @return {@code this}
         */
        public Builder publicKeys(java.util.List<java.lang.String> publicKeys) {
            this.publicKeys = publicKeys;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getSecurityConfiguration}
         * @param securityConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#security_configuration GlueDevEndpoint#security_configuration}.
         * @return {@code this}
         */
        public Builder securityConfiguration(java.lang.String securityConfiguration) {
            this.securityConfiguration = securityConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#security_group_ids GlueDevEndpoint#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#subnet_id GlueDevEndpoint#subnet_id}.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#tags GlueDevEndpoint#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#tags_all GlueDevEndpoint#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getWorkerType}
         * @param workerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_dev_endpoint#worker_type GlueDevEndpoint#worker_type}.
         * @return {@code this}
         */
        public Builder workerType(java.lang.String workerType) {
            this.workerType = workerType;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getDependsOn}
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
         * Sets the value of {@link GlueDevEndpointConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link GlueDevEndpointConfig#getProvisioners}
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
         * @return a new instance of {@link GlueDevEndpointConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueDevEndpointConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueDevEndpointConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueDevEndpointConfig {
        private final java.lang.String name;
        private final java.lang.String roleArn;
        private final java.util.Map<java.lang.String, java.lang.String> arguments;
        private final java.lang.String extraJarsS3Path;
        private final java.lang.String extraPythonLibsS3Path;
        private final java.lang.String glueVersion;
        private final java.lang.String id;
        private final java.lang.Number numberOfNodes;
        private final java.lang.Number numberOfWorkers;
        private final java.lang.String publicKey;
        private final java.util.List<java.lang.String> publicKeys;
        private final java.lang.String securityConfiguration;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.lang.String subnetId;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String workerType;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.arguments = software.amazon.jsii.Kernel.get(this, "arguments", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.extraJarsS3Path = software.amazon.jsii.Kernel.get(this, "extraJarsS3Path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.extraPythonLibsS3Path = software.amazon.jsii.Kernel.get(this, "extraPythonLibsS3Path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.glueVersion = software.amazon.jsii.Kernel.get(this, "glueVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.numberOfNodes = software.amazon.jsii.Kernel.get(this, "numberOfNodes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.numberOfWorkers = software.amazon.jsii.Kernel.get(this, "numberOfWorkers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.publicKey = software.amazon.jsii.Kernel.get(this, "publicKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.publicKeys = software.amazon.jsii.Kernel.get(this, "publicKeys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityConfiguration = software.amazon.jsii.Kernel.get(this, "securityConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnetId = software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.workerType = software.amazon.jsii.Kernel.get(this, "workerType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.arguments = builder.arguments;
            this.extraJarsS3Path = builder.extraJarsS3Path;
            this.extraPythonLibsS3Path = builder.extraPythonLibsS3Path;
            this.glueVersion = builder.glueVersion;
            this.id = builder.id;
            this.numberOfNodes = builder.numberOfNodes;
            this.numberOfWorkers = builder.numberOfWorkers;
            this.publicKey = builder.publicKey;
            this.publicKeys = builder.publicKeys;
            this.securityConfiguration = builder.securityConfiguration;
            this.securityGroupIds = builder.securityGroupIds;
            this.subnetId = builder.subnetId;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.workerType = builder.workerType;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getArguments() {
            return this.arguments;
        }

        @Override
        public final java.lang.String getExtraJarsS3Path() {
            return this.extraJarsS3Path;
        }

        @Override
        public final java.lang.String getExtraPythonLibsS3Path() {
            return this.extraPythonLibsS3Path;
        }

        @Override
        public final java.lang.String getGlueVersion() {
            return this.glueVersion;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getNumberOfNodes() {
            return this.numberOfNodes;
        }

        @Override
        public final java.lang.Number getNumberOfWorkers() {
            return this.numberOfWorkers;
        }

        @Override
        public final java.lang.String getPublicKey() {
            return this.publicKey;
        }

        @Override
        public final java.util.List<java.lang.String> getPublicKeys() {
            return this.publicKeys;
        }

        @Override
        public final java.lang.String getSecurityConfiguration() {
            return this.securityConfiguration;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.lang.String getSubnetId() {
            return this.subnetId;
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
        public final java.lang.String getWorkerType() {
            return this.workerType;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getArguments() != null) {
                data.set("arguments", om.valueToTree(this.getArguments()));
            }
            if (this.getExtraJarsS3Path() != null) {
                data.set("extraJarsS3Path", om.valueToTree(this.getExtraJarsS3Path()));
            }
            if (this.getExtraPythonLibsS3Path() != null) {
                data.set("extraPythonLibsS3Path", om.valueToTree(this.getExtraPythonLibsS3Path()));
            }
            if (this.getGlueVersion() != null) {
                data.set("glueVersion", om.valueToTree(this.getGlueVersion()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getNumberOfNodes() != null) {
                data.set("numberOfNodes", om.valueToTree(this.getNumberOfNodes()));
            }
            if (this.getNumberOfWorkers() != null) {
                data.set("numberOfWorkers", om.valueToTree(this.getNumberOfWorkers()));
            }
            if (this.getPublicKey() != null) {
                data.set("publicKey", om.valueToTree(this.getPublicKey()));
            }
            if (this.getPublicKeys() != null) {
                data.set("publicKeys", om.valueToTree(this.getPublicKeys()));
            }
            if (this.getSecurityConfiguration() != null) {
                data.set("securityConfiguration", om.valueToTree(this.getSecurityConfiguration()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }
            if (this.getSubnetId() != null) {
                data.set("subnetId", om.valueToTree(this.getSubnetId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getWorkerType() != null) {
                data.set("workerType", om.valueToTree(this.getWorkerType()));
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
            struct.set("fqn", om.valueToTree("aws.glueDevEndpoint.GlueDevEndpointConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueDevEndpointConfig.Jsii$Proxy that = (GlueDevEndpointConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.arguments != null ? !this.arguments.equals(that.arguments) : that.arguments != null) return false;
            if (this.extraJarsS3Path != null ? !this.extraJarsS3Path.equals(that.extraJarsS3Path) : that.extraJarsS3Path != null) return false;
            if (this.extraPythonLibsS3Path != null ? !this.extraPythonLibsS3Path.equals(that.extraPythonLibsS3Path) : that.extraPythonLibsS3Path != null) return false;
            if (this.glueVersion != null ? !this.glueVersion.equals(that.glueVersion) : that.glueVersion != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.numberOfNodes != null ? !this.numberOfNodes.equals(that.numberOfNodes) : that.numberOfNodes != null) return false;
            if (this.numberOfWorkers != null ? !this.numberOfWorkers.equals(that.numberOfWorkers) : that.numberOfWorkers != null) return false;
            if (this.publicKey != null ? !this.publicKey.equals(that.publicKey) : that.publicKey != null) return false;
            if (this.publicKeys != null ? !this.publicKeys.equals(that.publicKeys) : that.publicKeys != null) return false;
            if (this.securityConfiguration != null ? !this.securityConfiguration.equals(that.securityConfiguration) : that.securityConfiguration != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.subnetId != null ? !this.subnetId.equals(that.subnetId) : that.subnetId != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.workerType != null ? !this.workerType.equals(that.workerType) : that.workerType != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.arguments != null ? this.arguments.hashCode() : 0);
            result = 31 * result + (this.extraJarsS3Path != null ? this.extraJarsS3Path.hashCode() : 0);
            result = 31 * result + (this.extraPythonLibsS3Path != null ? this.extraPythonLibsS3Path.hashCode() : 0);
            result = 31 * result + (this.glueVersion != null ? this.glueVersion.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.numberOfNodes != null ? this.numberOfNodes.hashCode() : 0);
            result = 31 * result + (this.numberOfWorkers != null ? this.numberOfWorkers.hashCode() : 0);
            result = 31 * result + (this.publicKey != null ? this.publicKey.hashCode() : 0);
            result = 31 * result + (this.publicKeys != null ? this.publicKeys.hashCode() : 0);
            result = 31 * result + (this.securityConfiguration != null ? this.securityConfiguration.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.subnetId != null ? this.subnetId.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.workerType != null ? this.workerType.hashCode() : 0);
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
