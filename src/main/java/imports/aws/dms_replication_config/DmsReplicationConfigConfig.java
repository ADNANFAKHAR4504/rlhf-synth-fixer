package imports.aws.dms_replication_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.015Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsReplicationConfig.DmsReplicationConfigConfig")
@software.amazon.jsii.Jsii.Proxy(DmsReplicationConfigConfig.Jsii$Proxy.class)
public interface DmsReplicationConfigConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * compute_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#compute_config DmsReplicationConfig#compute_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.dms_replication_config.DmsReplicationConfigComputeConfig getComputeConfig();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_config_identifier DmsReplicationConfig#replication_config_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReplicationConfigIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_type DmsReplicationConfig#replication_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReplicationType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#source_endpoint_arn DmsReplicationConfig#source_endpoint_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceEndpointArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#table_mappings DmsReplicationConfig#table_mappings}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableMappings();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#target_endpoint_arn DmsReplicationConfig#target_endpoint_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetEndpointArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#id DmsReplicationConfig#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_settings DmsReplicationConfig#replication_settings}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReplicationSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#resource_identifier DmsReplicationConfig#resource_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#start_replication DmsReplicationConfig#start_replication}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStartReplication() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#supplemental_settings DmsReplicationConfig#supplemental_settings}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSupplementalSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#tags DmsReplicationConfig#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#tags_all DmsReplicationConfig#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#timeouts DmsReplicationConfig#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dms_replication_config.DmsReplicationConfigTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DmsReplicationConfigConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DmsReplicationConfigConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DmsReplicationConfigConfig> {
        imports.aws.dms_replication_config.DmsReplicationConfigComputeConfig computeConfig;
        java.lang.String replicationConfigIdentifier;
        java.lang.String replicationType;
        java.lang.String sourceEndpointArn;
        java.lang.String tableMappings;
        java.lang.String targetEndpointArn;
        java.lang.String id;
        java.lang.String replicationSettings;
        java.lang.String resourceIdentifier;
        java.lang.Object startReplication;
        java.lang.String supplementalSettings;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.dms_replication_config.DmsReplicationConfigTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getComputeConfig}
         * @param computeConfig compute_config block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#compute_config DmsReplicationConfig#compute_config}
         * @return {@code this}
         */
        public Builder computeConfig(imports.aws.dms_replication_config.DmsReplicationConfigComputeConfig computeConfig) {
            this.computeConfig = computeConfig;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getReplicationConfigIdentifier}
         * @param replicationConfigIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_config_identifier DmsReplicationConfig#replication_config_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder replicationConfigIdentifier(java.lang.String replicationConfigIdentifier) {
            this.replicationConfigIdentifier = replicationConfigIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getReplicationType}
         * @param replicationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_type DmsReplicationConfig#replication_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder replicationType(java.lang.String replicationType) {
            this.replicationType = replicationType;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getSourceEndpointArn}
         * @param sourceEndpointArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#source_endpoint_arn DmsReplicationConfig#source_endpoint_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceEndpointArn(java.lang.String sourceEndpointArn) {
            this.sourceEndpointArn = sourceEndpointArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getTableMappings}
         * @param tableMappings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#table_mappings DmsReplicationConfig#table_mappings}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableMappings(java.lang.String tableMappings) {
            this.tableMappings = tableMappings;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getTargetEndpointArn}
         * @param targetEndpointArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#target_endpoint_arn DmsReplicationConfig#target_endpoint_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetEndpointArn(java.lang.String targetEndpointArn) {
            this.targetEndpointArn = targetEndpointArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#id DmsReplicationConfig#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getReplicationSettings}
         * @param replicationSettings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_settings DmsReplicationConfig#replication_settings}.
         * @return {@code this}
         */
        public Builder replicationSettings(java.lang.String replicationSettings) {
            this.replicationSettings = replicationSettings;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getResourceIdentifier}
         * @param resourceIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#resource_identifier DmsReplicationConfig#resource_identifier}.
         * @return {@code this}
         */
        public Builder resourceIdentifier(java.lang.String resourceIdentifier) {
            this.resourceIdentifier = resourceIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getStartReplication}
         * @param startReplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#start_replication DmsReplicationConfig#start_replication}.
         * @return {@code this}
         */
        public Builder startReplication(java.lang.Boolean startReplication) {
            this.startReplication = startReplication;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getStartReplication}
         * @param startReplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#start_replication DmsReplicationConfig#start_replication}.
         * @return {@code this}
         */
        public Builder startReplication(com.hashicorp.cdktf.IResolvable startReplication) {
            this.startReplication = startReplication;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getSupplementalSettings}
         * @param supplementalSettings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#supplemental_settings DmsReplicationConfig#supplemental_settings}.
         * @return {@code this}
         */
        public Builder supplementalSettings(java.lang.String supplementalSettings) {
            this.supplementalSettings = supplementalSettings;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#tags DmsReplicationConfig#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#tags_all DmsReplicationConfig#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#timeouts DmsReplicationConfig#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.dms_replication_config.DmsReplicationConfigTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getDependsOn}
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
         * Sets the value of {@link DmsReplicationConfigConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DmsReplicationConfigConfig#getProvisioners}
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
         * @return a new instance of {@link DmsReplicationConfigConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DmsReplicationConfigConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DmsReplicationConfigConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DmsReplicationConfigConfig {
        private final imports.aws.dms_replication_config.DmsReplicationConfigComputeConfig computeConfig;
        private final java.lang.String replicationConfigIdentifier;
        private final java.lang.String replicationType;
        private final java.lang.String sourceEndpointArn;
        private final java.lang.String tableMappings;
        private final java.lang.String targetEndpointArn;
        private final java.lang.String id;
        private final java.lang.String replicationSettings;
        private final java.lang.String resourceIdentifier;
        private final java.lang.Object startReplication;
        private final java.lang.String supplementalSettings;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.dms_replication_config.DmsReplicationConfigTimeouts timeouts;
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
            this.computeConfig = software.amazon.jsii.Kernel.get(this, "computeConfig", software.amazon.jsii.NativeType.forClass(imports.aws.dms_replication_config.DmsReplicationConfigComputeConfig.class));
            this.replicationConfigIdentifier = software.amazon.jsii.Kernel.get(this, "replicationConfigIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationType = software.amazon.jsii.Kernel.get(this, "replicationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceEndpointArn = software.amazon.jsii.Kernel.get(this, "sourceEndpointArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableMappings = software.amazon.jsii.Kernel.get(this, "tableMappings", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetEndpointArn = software.amazon.jsii.Kernel.get(this, "targetEndpointArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationSettings = software.amazon.jsii.Kernel.get(this, "replicationSettings", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceIdentifier = software.amazon.jsii.Kernel.get(this, "resourceIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startReplication = software.amazon.jsii.Kernel.get(this, "startReplication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.supplementalSettings = software.amazon.jsii.Kernel.get(this, "supplementalSettings", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dms_replication_config.DmsReplicationConfigTimeouts.class));
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
            this.computeConfig = java.util.Objects.requireNonNull(builder.computeConfig, "computeConfig is required");
            this.replicationConfigIdentifier = java.util.Objects.requireNonNull(builder.replicationConfigIdentifier, "replicationConfigIdentifier is required");
            this.replicationType = java.util.Objects.requireNonNull(builder.replicationType, "replicationType is required");
            this.sourceEndpointArn = java.util.Objects.requireNonNull(builder.sourceEndpointArn, "sourceEndpointArn is required");
            this.tableMappings = java.util.Objects.requireNonNull(builder.tableMappings, "tableMappings is required");
            this.targetEndpointArn = java.util.Objects.requireNonNull(builder.targetEndpointArn, "targetEndpointArn is required");
            this.id = builder.id;
            this.replicationSettings = builder.replicationSettings;
            this.resourceIdentifier = builder.resourceIdentifier;
            this.startReplication = builder.startReplication;
            this.supplementalSettings = builder.supplementalSettings;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.dms_replication_config.DmsReplicationConfigComputeConfig getComputeConfig() {
            return this.computeConfig;
        }

        @Override
        public final java.lang.String getReplicationConfigIdentifier() {
            return this.replicationConfigIdentifier;
        }

        @Override
        public final java.lang.String getReplicationType() {
            return this.replicationType;
        }

        @Override
        public final java.lang.String getSourceEndpointArn() {
            return this.sourceEndpointArn;
        }

        @Override
        public final java.lang.String getTableMappings() {
            return this.tableMappings;
        }

        @Override
        public final java.lang.String getTargetEndpointArn() {
            return this.targetEndpointArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getReplicationSettings() {
            return this.replicationSettings;
        }

        @Override
        public final java.lang.String getResourceIdentifier() {
            return this.resourceIdentifier;
        }

        @Override
        public final java.lang.Object getStartReplication() {
            return this.startReplication;
        }

        @Override
        public final java.lang.String getSupplementalSettings() {
            return this.supplementalSettings;
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
        public final imports.aws.dms_replication_config.DmsReplicationConfigTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("computeConfig", om.valueToTree(this.getComputeConfig()));
            data.set("replicationConfigIdentifier", om.valueToTree(this.getReplicationConfigIdentifier()));
            data.set("replicationType", om.valueToTree(this.getReplicationType()));
            data.set("sourceEndpointArn", om.valueToTree(this.getSourceEndpointArn()));
            data.set("tableMappings", om.valueToTree(this.getTableMappings()));
            data.set("targetEndpointArn", om.valueToTree(this.getTargetEndpointArn()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getReplicationSettings() != null) {
                data.set("replicationSettings", om.valueToTree(this.getReplicationSettings()));
            }
            if (this.getResourceIdentifier() != null) {
                data.set("resourceIdentifier", om.valueToTree(this.getResourceIdentifier()));
            }
            if (this.getStartReplication() != null) {
                data.set("startReplication", om.valueToTree(this.getStartReplication()));
            }
            if (this.getSupplementalSettings() != null) {
                data.set("supplementalSettings", om.valueToTree(this.getSupplementalSettings()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.dmsReplicationConfig.DmsReplicationConfigConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DmsReplicationConfigConfig.Jsii$Proxy that = (DmsReplicationConfigConfig.Jsii$Proxy) o;

            if (!computeConfig.equals(that.computeConfig)) return false;
            if (!replicationConfigIdentifier.equals(that.replicationConfigIdentifier)) return false;
            if (!replicationType.equals(that.replicationType)) return false;
            if (!sourceEndpointArn.equals(that.sourceEndpointArn)) return false;
            if (!tableMappings.equals(that.tableMappings)) return false;
            if (!targetEndpointArn.equals(that.targetEndpointArn)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.replicationSettings != null ? !this.replicationSettings.equals(that.replicationSettings) : that.replicationSettings != null) return false;
            if (this.resourceIdentifier != null ? !this.resourceIdentifier.equals(that.resourceIdentifier) : that.resourceIdentifier != null) return false;
            if (this.startReplication != null ? !this.startReplication.equals(that.startReplication) : that.startReplication != null) return false;
            if (this.supplementalSettings != null ? !this.supplementalSettings.equals(that.supplementalSettings) : that.supplementalSettings != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.computeConfig.hashCode();
            result = 31 * result + (this.replicationConfigIdentifier.hashCode());
            result = 31 * result + (this.replicationType.hashCode());
            result = 31 * result + (this.sourceEndpointArn.hashCode());
            result = 31 * result + (this.tableMappings.hashCode());
            result = 31 * result + (this.targetEndpointArn.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.replicationSettings != null ? this.replicationSettings.hashCode() : 0);
            result = 31 * result + (this.resourceIdentifier != null ? this.resourceIdentifier.hashCode() : 0);
            result = 31 * result + (this.startReplication != null ? this.startReplication.hashCode() : 0);
            result = 31 * result + (this.supplementalSettings != null ? this.supplementalSettings.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
