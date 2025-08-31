package imports.aws.dms_replication_config;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config aws_dms_replication_config}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.014Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsReplicationConfig.DmsReplicationConfig")
public class DmsReplicationConfig extends com.hashicorp.cdktf.TerraformResource {

    protected DmsReplicationConfig(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DmsReplicationConfig(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.dms_replication_config.DmsReplicationConfig.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config aws_dms_replication_config} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DmsReplicationConfig(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.dms_replication_config.DmsReplicationConfigConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DmsReplicationConfig resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DmsReplicationConfig to import. This parameter is required.
     * @param importFromId The id of the existing DmsReplicationConfig that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DmsReplicationConfig to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dms_replication_config.DmsReplicationConfig.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DmsReplicationConfig resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DmsReplicationConfig to import. This parameter is required.
     * @param importFromId The id of the existing DmsReplicationConfig that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dms_replication_config.DmsReplicationConfig.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putComputeConfig(final @org.jetbrains.annotations.NotNull imports.aws.dms_replication_config.DmsReplicationConfigComputeConfig value) {
        software.amazon.jsii.Kernel.call(this, "putComputeConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.dms_replication_config.DmsReplicationConfigTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplicationSettings() {
        software.amazon.jsii.Kernel.call(this, "resetReplicationSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetResourceIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartReplication() {
        software.amazon.jsii.Kernel.call(this, "resetStartReplication", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupplementalSettings() {
        software.amazon.jsii.Kernel.call(this, "resetSupplementalSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dms_replication_config.DmsReplicationConfigComputeConfigOutputReference getComputeConfig() {
        return software.amazon.jsii.Kernel.get(this, "computeConfig", software.amazon.jsii.NativeType.forClass(imports.aws.dms_replication_config.DmsReplicationConfigComputeConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dms_replication_config.DmsReplicationConfigTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dms_replication_config.DmsReplicationConfigTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dms_replication_config.DmsReplicationConfigComputeConfig getComputeConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "computeConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.dms_replication_config.DmsReplicationConfigComputeConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplicationConfigIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationConfigIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplicationSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationSettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplicationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceEndpointArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceEndpointArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStartReplicationInput() {
        return software.amazon.jsii.Kernel.get(this, "startReplicationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSupplementalSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "supplementalSettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTableMappingsInput() {
        return software.amazon.jsii.Kernel.get(this, "tableMappingsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetEndpointArnInput() {
        return software.amazon.jsii.Kernel.get(this, "targetEndpointArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicationConfigIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "replicationConfigIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplicationConfigIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replicationConfigIdentifier", java.util.Objects.requireNonNull(value, "replicationConfigIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicationSettings() {
        return software.amazon.jsii.Kernel.get(this, "replicationSettings", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplicationSettings(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replicationSettings", java.util.Objects.requireNonNull(value, "replicationSettings is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicationType() {
        return software.amazon.jsii.Kernel.get(this, "replicationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplicationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replicationType", java.util.Objects.requireNonNull(value, "replicationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "resourceIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceIdentifier", java.util.Objects.requireNonNull(value, "resourceIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceEndpointArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceEndpointArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceEndpointArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceEndpointArn", java.util.Objects.requireNonNull(value, "sourceEndpointArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getStartReplication() {
        return software.amazon.jsii.Kernel.get(this, "startReplication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setStartReplication(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "startReplication", java.util.Objects.requireNonNull(value, "startReplication is required"));
    }

    public void setStartReplication(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "startReplication", java.util.Objects.requireNonNull(value, "startReplication is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSupplementalSettings() {
        return software.amazon.jsii.Kernel.get(this, "supplementalSettings", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSupplementalSettings(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "supplementalSettings", java.util.Objects.requireNonNull(value, "supplementalSettings is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTableMappings() {
        return software.amazon.jsii.Kernel.get(this, "tableMappings", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTableMappings(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tableMappings", java.util.Objects.requireNonNull(value, "tableMappings is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetEndpointArn() {
        return software.amazon.jsii.Kernel.get(this, "targetEndpointArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetEndpointArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetEndpointArn", java.util.Objects.requireNonNull(value, "targetEndpointArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.dms_replication_config.DmsReplicationConfig}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.dms_replication_config.DmsReplicationConfig> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.dms_replication_config.DmsReplicationConfigConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.dms_replication_config.DmsReplicationConfigConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * compute_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#compute_config DmsReplicationConfig#compute_config}
         * <p>
         * @return {@code this}
         * @param computeConfig compute_config block. This parameter is required.
         */
        public Builder computeConfig(final imports.aws.dms_replication_config.DmsReplicationConfigComputeConfig computeConfig) {
            this.config.computeConfig(computeConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_config_identifier DmsReplicationConfig#replication_config_identifier}.
         * <p>
         * @return {@code this}
         * @param replicationConfigIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_config_identifier DmsReplicationConfig#replication_config_identifier}. This parameter is required.
         */
        public Builder replicationConfigIdentifier(final java.lang.String replicationConfigIdentifier) {
            this.config.replicationConfigIdentifier(replicationConfigIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_type DmsReplicationConfig#replication_type}.
         * <p>
         * @return {@code this}
         * @param replicationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_type DmsReplicationConfig#replication_type}. This parameter is required.
         */
        public Builder replicationType(final java.lang.String replicationType) {
            this.config.replicationType(replicationType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#source_endpoint_arn DmsReplicationConfig#source_endpoint_arn}.
         * <p>
         * @return {@code this}
         * @param sourceEndpointArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#source_endpoint_arn DmsReplicationConfig#source_endpoint_arn}. This parameter is required.
         */
        public Builder sourceEndpointArn(final java.lang.String sourceEndpointArn) {
            this.config.sourceEndpointArn(sourceEndpointArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#table_mappings DmsReplicationConfig#table_mappings}.
         * <p>
         * @return {@code this}
         * @param tableMappings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#table_mappings DmsReplicationConfig#table_mappings}. This parameter is required.
         */
        public Builder tableMappings(final java.lang.String tableMappings) {
            this.config.tableMappings(tableMappings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#target_endpoint_arn DmsReplicationConfig#target_endpoint_arn}.
         * <p>
         * @return {@code this}
         * @param targetEndpointArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#target_endpoint_arn DmsReplicationConfig#target_endpoint_arn}. This parameter is required.
         */
        public Builder targetEndpointArn(final java.lang.String targetEndpointArn) {
            this.config.targetEndpointArn(targetEndpointArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#id DmsReplicationConfig#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#id DmsReplicationConfig#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_settings DmsReplicationConfig#replication_settings}.
         * <p>
         * @return {@code this}
         * @param replicationSettings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#replication_settings DmsReplicationConfig#replication_settings}. This parameter is required.
         */
        public Builder replicationSettings(final java.lang.String replicationSettings) {
            this.config.replicationSettings(replicationSettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#resource_identifier DmsReplicationConfig#resource_identifier}.
         * <p>
         * @return {@code this}
         * @param resourceIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#resource_identifier DmsReplicationConfig#resource_identifier}. This parameter is required.
         */
        public Builder resourceIdentifier(final java.lang.String resourceIdentifier) {
            this.config.resourceIdentifier(resourceIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#start_replication DmsReplicationConfig#start_replication}.
         * <p>
         * @return {@code this}
         * @param startReplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#start_replication DmsReplicationConfig#start_replication}. This parameter is required.
         */
        public Builder startReplication(final java.lang.Boolean startReplication) {
            this.config.startReplication(startReplication);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#start_replication DmsReplicationConfig#start_replication}.
         * <p>
         * @return {@code this}
         * @param startReplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#start_replication DmsReplicationConfig#start_replication}. This parameter is required.
         */
        public Builder startReplication(final com.hashicorp.cdktf.IResolvable startReplication) {
            this.config.startReplication(startReplication);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#supplemental_settings DmsReplicationConfig#supplemental_settings}.
         * <p>
         * @return {@code this}
         * @param supplementalSettings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#supplemental_settings DmsReplicationConfig#supplemental_settings}. This parameter is required.
         */
        public Builder supplementalSettings(final java.lang.String supplementalSettings) {
            this.config.supplementalSettings(supplementalSettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#tags DmsReplicationConfig#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#tags DmsReplicationConfig#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#tags_all DmsReplicationConfig#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#tags_all DmsReplicationConfig#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_config#timeouts DmsReplicationConfig#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.dms_replication_config.DmsReplicationConfigTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.dms_replication_config.DmsReplicationConfig}.
         */
        @Override
        public imports.aws.dms_replication_config.DmsReplicationConfig build() {
            return new imports.aws.dms_replication_config.DmsReplicationConfig(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
