package imports.aws.datasync_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.950Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncTask.DatasyncTaskConfig")
@software.amazon.jsii.Jsii.Proxy(DatasyncTaskConfig.Jsii$Proxy.class)
public interface DatasyncTaskConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#destination_location_arn DatasyncTask#destination_location_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestinationLocationArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#source_location_arn DatasyncTask#source_location_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceLocationArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#cloudwatch_log_group_arn DatasyncTask#cloudwatch_log_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCloudwatchLogGroupArn() {
        return null;
    }

    /**
     * excludes block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#excludes DatasyncTask#excludes}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskExcludes getExcludes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#id DatasyncTask#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * includes block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#includes DatasyncTask#includes}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskIncludes getIncludes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#name DatasyncTask#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#options DatasyncTask#options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskOptions getOptions() {
        return null;
    }

    /**
     * schedule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#schedule DatasyncTask#schedule}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskSchedule getSchedule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags DatasyncTask#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags_all DatasyncTask#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_mode DatasyncTask#task_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTaskMode() {
        return null;
    }

    /**
     * task_report_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_report_config DatasyncTask#task_report_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskTaskReportConfig getTaskReportConfig() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#timeouts DatasyncTask#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncTaskConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncTaskConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncTaskConfig> {
        java.lang.String destinationLocationArn;
        java.lang.String sourceLocationArn;
        java.lang.String cloudwatchLogGroupArn;
        imports.aws.datasync_task.DatasyncTaskExcludes excludes;
        java.lang.String id;
        imports.aws.datasync_task.DatasyncTaskIncludes includes;
        java.lang.String name;
        imports.aws.datasync_task.DatasyncTaskOptions options;
        imports.aws.datasync_task.DatasyncTaskSchedule schedule;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String taskMode;
        imports.aws.datasync_task.DatasyncTaskTaskReportConfig taskReportConfig;
        imports.aws.datasync_task.DatasyncTaskTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DatasyncTaskConfig#getDestinationLocationArn}
         * @param destinationLocationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#destination_location_arn DatasyncTask#destination_location_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder destinationLocationArn(java.lang.String destinationLocationArn) {
            this.destinationLocationArn = destinationLocationArn;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getSourceLocationArn}
         * @param sourceLocationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#source_location_arn DatasyncTask#source_location_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceLocationArn(java.lang.String sourceLocationArn) {
            this.sourceLocationArn = sourceLocationArn;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getCloudwatchLogGroupArn}
         * @param cloudwatchLogGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#cloudwatch_log_group_arn DatasyncTask#cloudwatch_log_group_arn}.
         * @return {@code this}
         */
        public Builder cloudwatchLogGroupArn(java.lang.String cloudwatchLogGroupArn) {
            this.cloudwatchLogGroupArn = cloudwatchLogGroupArn;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getExcludes}
         * @param excludes excludes block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#excludes DatasyncTask#excludes}
         * @return {@code this}
         */
        public Builder excludes(imports.aws.datasync_task.DatasyncTaskExcludes excludes) {
            this.excludes = excludes;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#id DatasyncTask#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getIncludes}
         * @param includes includes block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#includes DatasyncTask#includes}
         * @return {@code this}
         */
        public Builder includes(imports.aws.datasync_task.DatasyncTaskIncludes includes) {
            this.includes = includes;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#name DatasyncTask#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getOptions}
         * @param options options block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#options DatasyncTask#options}
         * @return {@code this}
         */
        public Builder options(imports.aws.datasync_task.DatasyncTaskOptions options) {
            this.options = options;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getSchedule}
         * @param schedule schedule block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#schedule DatasyncTask#schedule}
         * @return {@code this}
         */
        public Builder schedule(imports.aws.datasync_task.DatasyncTaskSchedule schedule) {
            this.schedule = schedule;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags DatasyncTask#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#tags_all DatasyncTask#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getTaskMode}
         * @param taskMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_mode DatasyncTask#task_mode}.
         * @return {@code this}
         */
        public Builder taskMode(java.lang.String taskMode) {
            this.taskMode = taskMode;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getTaskReportConfig}
         * @param taskReportConfig task_report_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#task_report_config DatasyncTask#task_report_config}
         * @return {@code this}
         */
        public Builder taskReportConfig(imports.aws.datasync_task.DatasyncTaskTaskReportConfig taskReportConfig) {
            this.taskReportConfig = taskReportConfig;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#timeouts DatasyncTask#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.datasync_task.DatasyncTaskTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getDependsOn}
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
         * Sets the value of {@link DatasyncTaskConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskConfig#getProvisioners}
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
         * @return a new instance of {@link DatasyncTaskConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncTaskConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncTaskConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncTaskConfig {
        private final java.lang.String destinationLocationArn;
        private final java.lang.String sourceLocationArn;
        private final java.lang.String cloudwatchLogGroupArn;
        private final imports.aws.datasync_task.DatasyncTaskExcludes excludes;
        private final java.lang.String id;
        private final imports.aws.datasync_task.DatasyncTaskIncludes includes;
        private final java.lang.String name;
        private final imports.aws.datasync_task.DatasyncTaskOptions options;
        private final imports.aws.datasync_task.DatasyncTaskSchedule schedule;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String taskMode;
        private final imports.aws.datasync_task.DatasyncTaskTaskReportConfig taskReportConfig;
        private final imports.aws.datasync_task.DatasyncTaskTimeouts timeouts;
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
            this.destinationLocationArn = software.amazon.jsii.Kernel.get(this, "destinationLocationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceLocationArn = software.amazon.jsii.Kernel.get(this, "sourceLocationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cloudwatchLogGroupArn = software.amazon.jsii.Kernel.get(this, "cloudwatchLogGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.excludes = software.amazon.jsii.Kernel.get(this, "excludes", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskExcludes.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includes = software.amazon.jsii.Kernel.get(this, "includes", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskIncludes.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.options = software.amazon.jsii.Kernel.get(this, "options", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskOptions.class));
            this.schedule = software.amazon.jsii.Kernel.get(this, "schedule", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskSchedule.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.taskMode = software.amazon.jsii.Kernel.get(this, "taskMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.taskReportConfig = software.amazon.jsii.Kernel.get(this, "taskReportConfig", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTaskReportConfig.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTimeouts.class));
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
            this.destinationLocationArn = java.util.Objects.requireNonNull(builder.destinationLocationArn, "destinationLocationArn is required");
            this.sourceLocationArn = java.util.Objects.requireNonNull(builder.sourceLocationArn, "sourceLocationArn is required");
            this.cloudwatchLogGroupArn = builder.cloudwatchLogGroupArn;
            this.excludes = builder.excludes;
            this.id = builder.id;
            this.includes = builder.includes;
            this.name = builder.name;
            this.options = builder.options;
            this.schedule = builder.schedule;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.taskMode = builder.taskMode;
            this.taskReportConfig = builder.taskReportConfig;
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
        public final java.lang.String getDestinationLocationArn() {
            return this.destinationLocationArn;
        }

        @Override
        public final java.lang.String getSourceLocationArn() {
            return this.sourceLocationArn;
        }

        @Override
        public final java.lang.String getCloudwatchLogGroupArn() {
            return this.cloudwatchLogGroupArn;
        }

        @Override
        public final imports.aws.datasync_task.DatasyncTaskExcludes getExcludes() {
            return this.excludes;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.datasync_task.DatasyncTaskIncludes getIncludes() {
            return this.includes;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.datasync_task.DatasyncTaskOptions getOptions() {
            return this.options;
        }

        @Override
        public final imports.aws.datasync_task.DatasyncTaskSchedule getSchedule() {
            return this.schedule;
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
        public final java.lang.String getTaskMode() {
            return this.taskMode;
        }

        @Override
        public final imports.aws.datasync_task.DatasyncTaskTaskReportConfig getTaskReportConfig() {
            return this.taskReportConfig;
        }

        @Override
        public final imports.aws.datasync_task.DatasyncTaskTimeouts getTimeouts() {
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

            data.set("destinationLocationArn", om.valueToTree(this.getDestinationLocationArn()));
            data.set("sourceLocationArn", om.valueToTree(this.getSourceLocationArn()));
            if (this.getCloudwatchLogGroupArn() != null) {
                data.set("cloudwatchLogGroupArn", om.valueToTree(this.getCloudwatchLogGroupArn()));
            }
            if (this.getExcludes() != null) {
                data.set("excludes", om.valueToTree(this.getExcludes()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIncludes() != null) {
                data.set("includes", om.valueToTree(this.getIncludes()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getOptions() != null) {
                data.set("options", om.valueToTree(this.getOptions()));
            }
            if (this.getSchedule() != null) {
                data.set("schedule", om.valueToTree(this.getSchedule()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTaskMode() != null) {
                data.set("taskMode", om.valueToTree(this.getTaskMode()));
            }
            if (this.getTaskReportConfig() != null) {
                data.set("taskReportConfig", om.valueToTree(this.getTaskReportConfig()));
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
            struct.set("fqn", om.valueToTree("aws.datasyncTask.DatasyncTaskConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncTaskConfig.Jsii$Proxy that = (DatasyncTaskConfig.Jsii$Proxy) o;

            if (!destinationLocationArn.equals(that.destinationLocationArn)) return false;
            if (!sourceLocationArn.equals(that.sourceLocationArn)) return false;
            if (this.cloudwatchLogGroupArn != null ? !this.cloudwatchLogGroupArn.equals(that.cloudwatchLogGroupArn) : that.cloudwatchLogGroupArn != null) return false;
            if (this.excludes != null ? !this.excludes.equals(that.excludes) : that.excludes != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.includes != null ? !this.includes.equals(that.includes) : that.includes != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.options != null ? !this.options.equals(that.options) : that.options != null) return false;
            if (this.schedule != null ? !this.schedule.equals(that.schedule) : that.schedule != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.taskMode != null ? !this.taskMode.equals(that.taskMode) : that.taskMode != null) return false;
            if (this.taskReportConfig != null ? !this.taskReportConfig.equals(that.taskReportConfig) : that.taskReportConfig != null) return false;
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
            int result = this.destinationLocationArn.hashCode();
            result = 31 * result + (this.sourceLocationArn.hashCode());
            result = 31 * result + (this.cloudwatchLogGroupArn != null ? this.cloudwatchLogGroupArn.hashCode() : 0);
            result = 31 * result + (this.excludes != null ? this.excludes.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.includes != null ? this.includes.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.options != null ? this.options.hashCode() : 0);
            result = 31 * result + (this.schedule != null ? this.schedule.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.taskMode != null ? this.taskMode.hashCode() : 0);
            result = 31 * result + (this.taskReportConfig != null ? this.taskReportConfig.hashCode() : 0);
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
