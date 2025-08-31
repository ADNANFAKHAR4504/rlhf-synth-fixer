package imports.aws.efs_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.142Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.efsFileSystem.EfsFileSystemConfig")
@software.amazon.jsii.Jsii.Proxy(EfsFileSystemConfig.Jsii$Proxy.class)
public interface EfsFileSystemConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#availability_zone_name EfsFileSystem#availability_zone_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#creation_token EfsFileSystem#creation_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCreationToken() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#encrypted EfsFileSystem#encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#id EfsFileSystem#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#kms_key_id EfsFileSystem#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * lifecycle_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#lifecycle_policy EfsFileSystem#lifecycle_policy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLifecyclePolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#performance_mode EfsFileSystem#performance_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPerformanceMode() {
        return null;
    }

    /**
     * protection block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#protection EfsFileSystem#protection}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.efs_file_system.EfsFileSystemProtection getProtection() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#provisioned_throughput_in_mibps EfsFileSystem#provisioned_throughput_in_mibps}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getProvisionedThroughputInMibps() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#tags EfsFileSystem#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#tags_all EfsFileSystem#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#throughput_mode EfsFileSystem#throughput_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getThroughputMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EfsFileSystemConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EfsFileSystemConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EfsFileSystemConfig> {
        java.lang.String availabilityZoneName;
        java.lang.String creationToken;
        java.lang.Object encrypted;
        java.lang.String id;
        java.lang.String kmsKeyId;
        java.lang.Object lifecyclePolicy;
        java.lang.String performanceMode;
        imports.aws.efs_file_system.EfsFileSystemProtection protection;
        java.lang.Number provisionedThroughputInMibps;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String throughputMode;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EfsFileSystemConfig#getAvailabilityZoneName}
         * @param availabilityZoneName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#availability_zone_name EfsFileSystem#availability_zone_name}.
         * @return {@code this}
         */
        public Builder availabilityZoneName(java.lang.String availabilityZoneName) {
            this.availabilityZoneName = availabilityZoneName;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getCreationToken}
         * @param creationToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#creation_token EfsFileSystem#creation_token}.
         * @return {@code this}
         */
        public Builder creationToken(java.lang.String creationToken) {
            this.creationToken = creationToken;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#encrypted EfsFileSystem#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(java.lang.Boolean encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#encrypted EfsFileSystem#encrypted}.
         * @return {@code this}
         */
        public Builder encrypted(com.hashicorp.cdktf.IResolvable encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#id EfsFileSystem#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#kms_key_id EfsFileSystem#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getLifecyclePolicy}
         * @param lifecyclePolicy lifecycle_policy block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#lifecycle_policy EfsFileSystem#lifecycle_policy}
         * @return {@code this}
         */
        public Builder lifecyclePolicy(com.hashicorp.cdktf.IResolvable lifecyclePolicy) {
            this.lifecyclePolicy = lifecyclePolicy;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getLifecyclePolicy}
         * @param lifecyclePolicy lifecycle_policy block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#lifecycle_policy EfsFileSystem#lifecycle_policy}
         * @return {@code this}
         */
        public Builder lifecyclePolicy(java.util.List<? extends imports.aws.efs_file_system.EfsFileSystemLifecyclePolicy> lifecyclePolicy) {
            this.lifecyclePolicy = lifecyclePolicy;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getPerformanceMode}
         * @param performanceMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#performance_mode EfsFileSystem#performance_mode}.
         * @return {@code this}
         */
        public Builder performanceMode(java.lang.String performanceMode) {
            this.performanceMode = performanceMode;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getProtection}
         * @param protection protection block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#protection EfsFileSystem#protection}
         * @return {@code this}
         */
        public Builder protection(imports.aws.efs_file_system.EfsFileSystemProtection protection) {
            this.protection = protection;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getProvisionedThroughputInMibps}
         * @param provisionedThroughputInMibps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#provisioned_throughput_in_mibps EfsFileSystem#provisioned_throughput_in_mibps}.
         * @return {@code this}
         */
        public Builder provisionedThroughputInMibps(java.lang.Number provisionedThroughputInMibps) {
            this.provisionedThroughputInMibps = provisionedThroughputInMibps;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#tags EfsFileSystem#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#tags_all EfsFileSystem#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getThroughputMode}
         * @param throughputMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#throughput_mode EfsFileSystem#throughput_mode}.
         * @return {@code this}
         */
        public Builder throughputMode(java.lang.String throughputMode) {
            this.throughputMode = throughputMode;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getDependsOn}
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
         * Sets the value of {@link EfsFileSystemConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemConfig#getProvisioners}
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
         * @return a new instance of {@link EfsFileSystemConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EfsFileSystemConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EfsFileSystemConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EfsFileSystemConfig {
        private final java.lang.String availabilityZoneName;
        private final java.lang.String creationToken;
        private final java.lang.Object encrypted;
        private final java.lang.String id;
        private final java.lang.String kmsKeyId;
        private final java.lang.Object lifecyclePolicy;
        private final java.lang.String performanceMode;
        private final imports.aws.efs_file_system.EfsFileSystemProtection protection;
        private final java.lang.Number provisionedThroughputInMibps;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String throughputMode;
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
            this.availabilityZoneName = software.amazon.jsii.Kernel.get(this, "availabilityZoneName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.creationToken = software.amazon.jsii.Kernel.get(this, "creationToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encrypted = software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lifecyclePolicy = software.amazon.jsii.Kernel.get(this, "lifecyclePolicy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.performanceMode = software.amazon.jsii.Kernel.get(this, "performanceMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protection = software.amazon.jsii.Kernel.get(this, "protection", software.amazon.jsii.NativeType.forClass(imports.aws.efs_file_system.EfsFileSystemProtection.class));
            this.provisionedThroughputInMibps = software.amazon.jsii.Kernel.get(this, "provisionedThroughputInMibps", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.throughputMode = software.amazon.jsii.Kernel.get(this, "throughputMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.availabilityZoneName = builder.availabilityZoneName;
            this.creationToken = builder.creationToken;
            this.encrypted = builder.encrypted;
            this.id = builder.id;
            this.kmsKeyId = builder.kmsKeyId;
            this.lifecyclePolicy = builder.lifecyclePolicy;
            this.performanceMode = builder.performanceMode;
            this.protection = builder.protection;
            this.provisionedThroughputInMibps = builder.provisionedThroughputInMibps;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.throughputMode = builder.throughputMode;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAvailabilityZoneName() {
            return this.availabilityZoneName;
        }

        @Override
        public final java.lang.String getCreationToken() {
            return this.creationToken;
        }

        @Override
        public final java.lang.Object getEncrypted() {
            return this.encrypted;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.Object getLifecyclePolicy() {
            return this.lifecyclePolicy;
        }

        @Override
        public final java.lang.String getPerformanceMode() {
            return this.performanceMode;
        }

        @Override
        public final imports.aws.efs_file_system.EfsFileSystemProtection getProtection() {
            return this.protection;
        }

        @Override
        public final java.lang.Number getProvisionedThroughputInMibps() {
            return this.provisionedThroughputInMibps;
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
        public final java.lang.String getThroughputMode() {
            return this.throughputMode;
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

            if (this.getAvailabilityZoneName() != null) {
                data.set("availabilityZoneName", om.valueToTree(this.getAvailabilityZoneName()));
            }
            if (this.getCreationToken() != null) {
                data.set("creationToken", om.valueToTree(this.getCreationToken()));
            }
            if (this.getEncrypted() != null) {
                data.set("encrypted", om.valueToTree(this.getEncrypted()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getLifecyclePolicy() != null) {
                data.set("lifecyclePolicy", om.valueToTree(this.getLifecyclePolicy()));
            }
            if (this.getPerformanceMode() != null) {
                data.set("performanceMode", om.valueToTree(this.getPerformanceMode()));
            }
            if (this.getProtection() != null) {
                data.set("protection", om.valueToTree(this.getProtection()));
            }
            if (this.getProvisionedThroughputInMibps() != null) {
                data.set("provisionedThroughputInMibps", om.valueToTree(this.getProvisionedThroughputInMibps()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getThroughputMode() != null) {
                data.set("throughputMode", om.valueToTree(this.getThroughputMode()));
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
            struct.set("fqn", om.valueToTree("aws.efsFileSystem.EfsFileSystemConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EfsFileSystemConfig.Jsii$Proxy that = (EfsFileSystemConfig.Jsii$Proxy) o;

            if (this.availabilityZoneName != null ? !this.availabilityZoneName.equals(that.availabilityZoneName) : that.availabilityZoneName != null) return false;
            if (this.creationToken != null ? !this.creationToken.equals(that.creationToken) : that.creationToken != null) return false;
            if (this.encrypted != null ? !this.encrypted.equals(that.encrypted) : that.encrypted != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.lifecyclePolicy != null ? !this.lifecyclePolicy.equals(that.lifecyclePolicy) : that.lifecyclePolicy != null) return false;
            if (this.performanceMode != null ? !this.performanceMode.equals(that.performanceMode) : that.performanceMode != null) return false;
            if (this.protection != null ? !this.protection.equals(that.protection) : that.protection != null) return false;
            if (this.provisionedThroughputInMibps != null ? !this.provisionedThroughputInMibps.equals(that.provisionedThroughputInMibps) : that.provisionedThroughputInMibps != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.throughputMode != null ? !this.throughputMode.equals(that.throughputMode) : that.throughputMode != null) return false;
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
            int result = this.availabilityZoneName != null ? this.availabilityZoneName.hashCode() : 0;
            result = 31 * result + (this.creationToken != null ? this.creationToken.hashCode() : 0);
            result = 31 * result + (this.encrypted != null ? this.encrypted.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.lifecyclePolicy != null ? this.lifecyclePolicy.hashCode() : 0);
            result = 31 * result + (this.performanceMode != null ? this.performanceMode.hashCode() : 0);
            result = 31 * result + (this.protection != null ? this.protection.hashCode() : 0);
            result = 31 * result + (this.provisionedThroughputInMibps != null ? this.provisionedThroughputInMibps.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.throughputMode != null ? this.throughputMode.hashCode() : 0);
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
