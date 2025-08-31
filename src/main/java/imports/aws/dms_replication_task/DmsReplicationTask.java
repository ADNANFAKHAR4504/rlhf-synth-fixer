package imports.aws.dms_replication_task;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task aws_dms_replication_task}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.016Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsReplicationTask.DmsReplicationTask")
public class DmsReplicationTask extends com.hashicorp.cdktf.TerraformResource {

    protected DmsReplicationTask(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DmsReplicationTask(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.dms_replication_task.DmsReplicationTask.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task aws_dms_replication_task} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DmsReplicationTask(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.dms_replication_task.DmsReplicationTaskConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DmsReplicationTask resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DmsReplicationTask to import. This parameter is required.
     * @param importFromId The id of the existing DmsReplicationTask that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DmsReplicationTask to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dms_replication_task.DmsReplicationTask.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DmsReplicationTask resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DmsReplicationTask to import. This parameter is required.
     * @param importFromId The id of the existing DmsReplicationTask that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dms_replication_task.DmsReplicationTask.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetCdcStartPosition() {
        software.amazon.jsii.Kernel.call(this, "resetCdcStartPosition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCdcStartTime() {
        software.amazon.jsii.Kernel.call(this, "resetCdcStartTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplicationTaskSettings() {
        software.amazon.jsii.Kernel.call(this, "resetReplicationTaskSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetResourceIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartReplicationTask() {
        software.amazon.jsii.Kernel.call(this, "resetStartReplicationTask", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicationTaskArn() {
        return software.amazon.jsii.Kernel.get(this, "replicationTaskArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCdcStartPositionInput() {
        return software.amazon.jsii.Kernel.get(this, "cdcStartPositionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCdcStartTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "cdcStartTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMigrationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "migrationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplicationInstanceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationInstanceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplicationTaskIdInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationTaskIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplicationTaskSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationTaskSettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceEndpointArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceEndpointArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStartReplicationTaskInput() {
        return software.amazon.jsii.Kernel.get(this, "startReplicationTaskInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCdcStartPosition() {
        return software.amazon.jsii.Kernel.get(this, "cdcStartPosition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCdcStartPosition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cdcStartPosition", java.util.Objects.requireNonNull(value, "cdcStartPosition is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCdcStartTime() {
        return software.amazon.jsii.Kernel.get(this, "cdcStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCdcStartTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cdcStartTime", java.util.Objects.requireNonNull(value, "cdcStartTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMigrationType() {
        return software.amazon.jsii.Kernel.get(this, "migrationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMigrationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "migrationType", java.util.Objects.requireNonNull(value, "migrationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicationInstanceArn() {
        return software.amazon.jsii.Kernel.get(this, "replicationInstanceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplicationInstanceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replicationInstanceArn", java.util.Objects.requireNonNull(value, "replicationInstanceArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicationTaskId() {
        return software.amazon.jsii.Kernel.get(this, "replicationTaskId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplicationTaskId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replicationTaskId", java.util.Objects.requireNonNull(value, "replicationTaskId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicationTaskSettings() {
        return software.amazon.jsii.Kernel.get(this, "replicationTaskSettings", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplicationTaskSettings(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replicationTaskSettings", java.util.Objects.requireNonNull(value, "replicationTaskSettings is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getStartReplicationTask() {
        return software.amazon.jsii.Kernel.get(this, "startReplicationTask", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setStartReplicationTask(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "startReplicationTask", java.util.Objects.requireNonNull(value, "startReplicationTask is required"));
    }

    public void setStartReplicationTask(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "startReplicationTask", java.util.Objects.requireNonNull(value, "startReplicationTask is required"));
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
     * A fluent builder for {@link imports.aws.dms_replication_task.DmsReplicationTask}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.dms_replication_task.DmsReplicationTask> {
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
        private final imports.aws.dms_replication_task.DmsReplicationTaskConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.dms_replication_task.DmsReplicationTaskConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#migration_type DmsReplicationTask#migration_type}.
         * <p>
         * @return {@code this}
         * @param migrationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#migration_type DmsReplicationTask#migration_type}. This parameter is required.
         */
        public Builder migrationType(final java.lang.String migrationType) {
            this.config.migrationType(migrationType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#replication_instance_arn DmsReplicationTask#replication_instance_arn}.
         * <p>
         * @return {@code this}
         * @param replicationInstanceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#replication_instance_arn DmsReplicationTask#replication_instance_arn}. This parameter is required.
         */
        public Builder replicationInstanceArn(final java.lang.String replicationInstanceArn) {
            this.config.replicationInstanceArn(replicationInstanceArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#replication_task_id DmsReplicationTask#replication_task_id}.
         * <p>
         * @return {@code this}
         * @param replicationTaskId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#replication_task_id DmsReplicationTask#replication_task_id}. This parameter is required.
         */
        public Builder replicationTaskId(final java.lang.String replicationTaskId) {
            this.config.replicationTaskId(replicationTaskId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#source_endpoint_arn DmsReplicationTask#source_endpoint_arn}.
         * <p>
         * @return {@code this}
         * @param sourceEndpointArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#source_endpoint_arn DmsReplicationTask#source_endpoint_arn}. This parameter is required.
         */
        public Builder sourceEndpointArn(final java.lang.String sourceEndpointArn) {
            this.config.sourceEndpointArn(sourceEndpointArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#table_mappings DmsReplicationTask#table_mappings}.
         * <p>
         * @return {@code this}
         * @param tableMappings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#table_mappings DmsReplicationTask#table_mappings}. This parameter is required.
         */
        public Builder tableMappings(final java.lang.String tableMappings) {
            this.config.tableMappings(tableMappings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#target_endpoint_arn DmsReplicationTask#target_endpoint_arn}.
         * <p>
         * @return {@code this}
         * @param targetEndpointArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#target_endpoint_arn DmsReplicationTask#target_endpoint_arn}. This parameter is required.
         */
        public Builder targetEndpointArn(final java.lang.String targetEndpointArn) {
            this.config.targetEndpointArn(targetEndpointArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#cdc_start_position DmsReplicationTask#cdc_start_position}.
         * <p>
         * @return {@code this}
         * @param cdcStartPosition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#cdc_start_position DmsReplicationTask#cdc_start_position}. This parameter is required.
         */
        public Builder cdcStartPosition(final java.lang.String cdcStartPosition) {
            this.config.cdcStartPosition(cdcStartPosition);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#cdc_start_time DmsReplicationTask#cdc_start_time}.
         * <p>
         * @return {@code this}
         * @param cdcStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#cdc_start_time DmsReplicationTask#cdc_start_time}. This parameter is required.
         */
        public Builder cdcStartTime(final java.lang.String cdcStartTime) {
            this.config.cdcStartTime(cdcStartTime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#id DmsReplicationTask#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#id DmsReplicationTask#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#replication_task_settings DmsReplicationTask#replication_task_settings}.
         * <p>
         * @return {@code this}
         * @param replicationTaskSettings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#replication_task_settings DmsReplicationTask#replication_task_settings}. This parameter is required.
         */
        public Builder replicationTaskSettings(final java.lang.String replicationTaskSettings) {
            this.config.replicationTaskSettings(replicationTaskSettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#resource_identifier DmsReplicationTask#resource_identifier}.
         * <p>
         * @return {@code this}
         * @param resourceIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#resource_identifier DmsReplicationTask#resource_identifier}. This parameter is required.
         */
        public Builder resourceIdentifier(final java.lang.String resourceIdentifier) {
            this.config.resourceIdentifier(resourceIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#start_replication_task DmsReplicationTask#start_replication_task}.
         * <p>
         * @return {@code this}
         * @param startReplicationTask Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#start_replication_task DmsReplicationTask#start_replication_task}. This parameter is required.
         */
        public Builder startReplicationTask(final java.lang.Boolean startReplicationTask) {
            this.config.startReplicationTask(startReplicationTask);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#start_replication_task DmsReplicationTask#start_replication_task}.
         * <p>
         * @return {@code this}
         * @param startReplicationTask Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#start_replication_task DmsReplicationTask#start_replication_task}. This parameter is required.
         */
        public Builder startReplicationTask(final com.hashicorp.cdktf.IResolvable startReplicationTask) {
            this.config.startReplicationTask(startReplicationTask);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#tags DmsReplicationTask#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#tags DmsReplicationTask#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#tags_all DmsReplicationTask#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_replication_task#tags_all DmsReplicationTask#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.dms_replication_task.DmsReplicationTask}.
         */
        @Override
        public imports.aws.dms_replication_task.DmsReplicationTask build() {
            return new imports.aws.dms_replication_task.DmsReplicationTask(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
