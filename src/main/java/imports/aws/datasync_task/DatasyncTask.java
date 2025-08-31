package imports.aws.datasync_task;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task aws_datasync_task}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.949Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncTask.DatasyncTask")
public class DatasyncTask extends com.hashicorp.cdktf.TerraformResource {

    protected DatasyncTask(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatasyncTask(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.datasync_task.DatasyncTask.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task aws_datasync_task} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DatasyncTask(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DatasyncTask resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DatasyncTask to import. This parameter is required.
     * @param importFromId The id of the existing DatasyncTask that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DatasyncTask to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.datasync_task.DatasyncTask.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DatasyncTask resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DatasyncTask to import. This parameter is required.
     * @param importFromId The id of the existing DatasyncTask that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.datasync_task.DatasyncTask.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putExcludes(final @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskExcludes value) {
        software.amazon.jsii.Kernel.call(this, "putExcludes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIncludes(final @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskIncludes value) {
        software.amazon.jsii.Kernel.call(this, "putIncludes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOptions(final @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskOptions value) {
        software.amazon.jsii.Kernel.call(this, "putOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSchedule(final @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskSchedule value) {
        software.amazon.jsii.Kernel.call(this, "putSchedule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTaskReportConfig(final @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskTaskReportConfig value) {
        software.amazon.jsii.Kernel.call(this, "putTaskReportConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchLogGroupArn() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogGroupArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExcludes() {
        software.amazon.jsii.Kernel.call(this, "resetExcludes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludes() {
        software.amazon.jsii.Kernel.call(this, "resetIncludes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOptions() {
        software.amazon.jsii.Kernel.call(this, "resetOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSchedule() {
        software.amazon.jsii.Kernel.call(this, "resetSchedule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaskMode() {
        software.amazon.jsii.Kernel.call(this, "resetTaskMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaskReportConfig() {
        software.amazon.jsii.Kernel.call(this, "resetTaskReportConfig", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskExcludesOutputReference getExcludes() {
        return software.amazon.jsii.Kernel.get(this, "excludes", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskExcludesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskIncludesOutputReference getIncludes() {
        return software.amazon.jsii.Kernel.get(this, "includes", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskIncludesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskOptionsOutputReference getOptions() {
        return software.amazon.jsii.Kernel.get(this, "options", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskScheduleOutputReference getSchedule() {
        return software.amazon.jsii.Kernel.get(this, "schedule", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskScheduleOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskTaskReportConfigOutputReference getTaskReportConfig() {
        return software.amazon.jsii.Kernel.get(this, "taskReportConfig", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTaskReportConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCloudwatchLogGroupArnInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogGroupArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationLocationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationLocationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskExcludes getExcludesInput() {
        return software.amazon.jsii.Kernel.get(this, "excludesInput", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskExcludes.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskIncludes getIncludesInput() {
        return software.amazon.jsii.Kernel.get(this, "includesInput", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskIncludes.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskOptions getOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "optionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskSchedule getScheduleInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleInput", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskSchedule.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceLocationArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceLocationArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaskModeInput() {
        return software.amazon.jsii.Kernel.get(this, "taskModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskTaskReportConfig getTaskReportConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "taskReportConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTaskReportConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCloudwatchLogGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCloudwatchLogGroupArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cloudwatchLogGroupArn", java.util.Objects.requireNonNull(value, "cloudwatchLogGroupArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationLocationArn() {
        return software.amazon.jsii.Kernel.get(this, "destinationLocationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationLocationArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationLocationArn", java.util.Objects.requireNonNull(value, "destinationLocationArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceLocationArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceLocationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceLocationArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceLocationArn", java.util.Objects.requireNonNull(value, "sourceLocationArn is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskMode() {
        return software.amazon.jsii.Kernel.get(this, "taskMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaskMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taskMode", java.util.Objects.requireNonNull(value, "taskMode is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.datasync_task.DatasyncTask}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.datasync_task.DatasyncTask> {
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
        private final imports.aws.datasync_task.DatasyncTaskConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.datasync_task.DatasyncTaskConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#destination_location_arn DatasyncTask#destination_location_arn}.
         * <p>
         * @return {@code this}
         * @param destinationLocationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#destination_location_arn DatasyncTask#destination_location_arn}. This parameter is required.
         */
        public Builder destinationLocationArn(final java.lang.String destinationLocationArn) {
            this.config.destinationLocationArn(destinationLocationArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#source_location_arn DatasyncTask#source_location_arn}.
         * <p>
         * @return {@code this}
         * @param sourceLocationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#source_location_arn DatasyncTask#source_location_arn}. This parameter is required.
         */
        public Builder sourceLocationArn(final java.lang.String sourceLocationArn) {
            this.config.sourceLocationArn(sourceLocationArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#cloudwatch_log_group_arn DatasyncTask#cloudwatch_log_group_arn}.
         * <p>
         * @return {@code this}
         * @param cloudwatchLogGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#cloudwatch_log_group_arn DatasyncTask#cloudwatch_log_group_arn}. This parameter is required.
         */
        public Builder cloudwatchLogGroupArn(final java.lang.String cloudwatchLogGroupArn) {
            this.config.cloudwatchLogGroupArn(cloudwatchLogGroupArn);
            return this;
        }

        /**
         * excludes block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#excludes DatasyncTask#excludes}
         * <p>
         * @return {@code this}
         * @param excludes excludes block. This parameter is required.
         */
        public Builder excludes(final imports.aws.datasync_task.DatasyncTaskExcludes excludes) {
            this.config.excludes(excludes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#id DatasyncTask#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#id DatasyncTask#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * includes block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#includes DatasyncTask#includes}
         * <p>
         * @return {@code this}
         * @param includes includes block. This parameter is required.
         */
        public Builder includes(final imports.aws.datasync_task.DatasyncTaskIncludes includes) {
            this.config.includes(includes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#name DatasyncTask#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#name DatasyncTask#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#options DatasyncTask#options}
         * <p>
         * @return {@code this}
         * @param options options block. This parameter is required.
         */
        public Builder options(final imports.aws.datasync_task.DatasyncTaskOptions options) {
            this.config.options(options);
            return this;
        }

        /**
         * schedule block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#schedule DatasyncTask#schedule}
         * <p>
         * @return {@code this}
         * @param schedule schedule block. This parameter is required.
         */
        public Builder schedule(final imports.aws.datasync_task.DatasyncTaskSchedule schedule) {
            this.config.schedule(schedule);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags DatasyncTask#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags DatasyncTask#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags_all DatasyncTask#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags_all DatasyncTask#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_mode DatasyncTask#task_mode}.
         * <p>
         * @return {@code this}
         * @param taskMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_mode DatasyncTask#task_mode}. This parameter is required.
         */
        public Builder taskMode(final java.lang.String taskMode) {
            this.config.taskMode(taskMode);
            return this;
        }

        /**
         * task_report_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_report_config DatasyncTask#task_report_config}
         * <p>
         * @return {@code this}
         * @param taskReportConfig task_report_config block. This parameter is required.
         */
        public Builder taskReportConfig(final imports.aws.datasync_task.DatasyncTaskTaskReportConfig taskReportConfig) {
            this.config.taskReportConfig(taskReportConfig);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#timeouts DatasyncTask#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.datasync_task.DatasyncTaskTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.datasync_task.DatasyncTask}.
         */
        @Override
        public imports.aws.datasync_task.DatasyncTask build() {
            return new imports.aws.datasync_task.DatasyncTask(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
