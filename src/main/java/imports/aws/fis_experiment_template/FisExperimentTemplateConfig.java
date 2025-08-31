package imports.aws.fis_experiment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.227Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fisExperimentTemplate.FisExperimentTemplateConfig")
@software.amazon.jsii.Jsii.Proxy(FisExperimentTemplateConfig.Jsii$Proxy.class)
public interface FisExperimentTemplateConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#action FisExperimentTemplate#action}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#description FisExperimentTemplate#description}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDescription();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#role_arn FisExperimentTemplate#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * stop_condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#stop_condition FisExperimentTemplate#stop_condition}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getStopCondition();

    /**
     * experiment_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#experiment_options FisExperimentTemplate#experiment_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateExperimentOptions getExperimentOptions() {
        return null;
    }

    /**
     * experiment_report_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#experiment_report_configuration FisExperimentTemplate#experiment_report_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfiguration getExperimentReportConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#id FisExperimentTemplate#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * log_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_configuration FisExperimentTemplate#log_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateLogConfiguration getLogConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#tags FisExperimentTemplate#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#tags_all FisExperimentTemplate#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#target FisExperimentTemplate#target}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTarget() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#timeouts FisExperimentTemplate#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fis_experiment_template.FisExperimentTemplateTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FisExperimentTemplateConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FisExperimentTemplateConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FisExperimentTemplateConfig> {
        java.lang.Object action;
        java.lang.String description;
        java.lang.String roleArn;
        java.lang.Object stopCondition;
        imports.aws.fis_experiment_template.FisExperimentTemplateExperimentOptions experimentOptions;
        imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfiguration experimentReportConfiguration;
        java.lang.String id;
        imports.aws.fis_experiment_template.FisExperimentTemplateLogConfiguration logConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object target;
        imports.aws.fis_experiment_template.FisExperimentTemplateTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getAction}
         * @param action action block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#action FisExperimentTemplate#action}
         * @return {@code this}
         */
        public Builder action(com.hashicorp.cdktf.IResolvable action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getAction}
         * @param action action block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#action FisExperimentTemplate#action}
         * @return {@code this}
         */
        public Builder action(java.util.List<? extends imports.aws.fis_experiment_template.FisExperimentTemplateAction> action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#description FisExperimentTemplate#description}. This parameter is required.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#role_arn FisExperimentTemplate#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getStopCondition}
         * @param stopCondition stop_condition block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#stop_condition FisExperimentTemplate#stop_condition}
         * @return {@code this}
         */
        public Builder stopCondition(com.hashicorp.cdktf.IResolvable stopCondition) {
            this.stopCondition = stopCondition;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getStopCondition}
         * @param stopCondition stop_condition block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#stop_condition FisExperimentTemplate#stop_condition}
         * @return {@code this}
         */
        public Builder stopCondition(java.util.List<? extends imports.aws.fis_experiment_template.FisExperimentTemplateStopCondition> stopCondition) {
            this.stopCondition = stopCondition;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getExperimentOptions}
         * @param experimentOptions experiment_options block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#experiment_options FisExperimentTemplate#experiment_options}
         * @return {@code this}
         */
        public Builder experimentOptions(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentOptions experimentOptions) {
            this.experimentOptions = experimentOptions;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getExperimentReportConfiguration}
         * @param experimentReportConfiguration experiment_report_configuration block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#experiment_report_configuration FisExperimentTemplate#experiment_report_configuration}
         * @return {@code this}
         */
        public Builder experimentReportConfiguration(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfiguration experimentReportConfiguration) {
            this.experimentReportConfiguration = experimentReportConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#id FisExperimentTemplate#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getLogConfiguration}
         * @param logConfiguration log_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#log_configuration FisExperimentTemplate#log_configuration}
         * @return {@code this}
         */
        public Builder logConfiguration(imports.aws.fis_experiment_template.FisExperimentTemplateLogConfiguration logConfiguration) {
            this.logConfiguration = logConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#tags FisExperimentTemplate#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#tags_all FisExperimentTemplate#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getTarget}
         * @param target target block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#target FisExperimentTemplate#target}
         * @return {@code this}
         */
        public Builder target(com.hashicorp.cdktf.IResolvable target) {
            this.target = target;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getTarget}
         * @param target target block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#target FisExperimentTemplate#target}
         * @return {@code this}
         */
        public Builder target(java.util.List<? extends imports.aws.fis_experiment_template.FisExperimentTemplateTarget> target) {
            this.target = target;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fis_experiment_template#timeouts FisExperimentTemplate#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.fis_experiment_template.FisExperimentTemplateTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getDependsOn}
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
         * Sets the value of {@link FisExperimentTemplateConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link FisExperimentTemplateConfig#getProvisioners}
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
         * @return a new instance of {@link FisExperimentTemplateConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FisExperimentTemplateConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FisExperimentTemplateConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FisExperimentTemplateConfig {
        private final java.lang.Object action;
        private final java.lang.String description;
        private final java.lang.String roleArn;
        private final java.lang.Object stopCondition;
        private final imports.aws.fis_experiment_template.FisExperimentTemplateExperimentOptions experimentOptions;
        private final imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfiguration experimentReportConfiguration;
        private final java.lang.String id;
        private final imports.aws.fis_experiment_template.FisExperimentTemplateLogConfiguration logConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object target;
        private final imports.aws.fis_experiment_template.FisExperimentTemplateTimeouts timeouts;
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
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stopCondition = software.amazon.jsii.Kernel.get(this, "stopCondition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.experimentOptions = software.amazon.jsii.Kernel.get(this, "experimentOptions", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentOptions.class));
            this.experimentReportConfiguration = software.amazon.jsii.Kernel.get(this, "experimentReportConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfiguration.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logConfiguration = software.amazon.jsii.Kernel.get(this, "logConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateLogConfiguration.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fis_experiment_template.FisExperimentTemplateTimeouts.class));
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
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.description = java.util.Objects.requireNonNull(builder.description, "description is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.stopCondition = java.util.Objects.requireNonNull(builder.stopCondition, "stopCondition is required");
            this.experimentOptions = builder.experimentOptions;
            this.experimentReportConfiguration = builder.experimentReportConfiguration;
            this.id = builder.id;
            this.logConfiguration = builder.logConfiguration;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.target = builder.target;
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
        public final java.lang.Object getAction() {
            return this.action;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Object getStopCondition() {
            return this.stopCondition;
        }

        @Override
        public final imports.aws.fis_experiment_template.FisExperimentTemplateExperimentOptions getExperimentOptions() {
            return this.experimentOptions;
        }

        @Override
        public final imports.aws.fis_experiment_template.FisExperimentTemplateExperimentReportConfiguration getExperimentReportConfiguration() {
            return this.experimentReportConfiguration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.fis_experiment_template.FisExperimentTemplateLogConfiguration getLogConfiguration() {
            return this.logConfiguration;
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
        public final java.lang.Object getTarget() {
            return this.target;
        }

        @Override
        public final imports.aws.fis_experiment_template.FisExperimentTemplateTimeouts getTimeouts() {
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

            data.set("action", om.valueToTree(this.getAction()));
            data.set("description", om.valueToTree(this.getDescription()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("stopCondition", om.valueToTree(this.getStopCondition()));
            if (this.getExperimentOptions() != null) {
                data.set("experimentOptions", om.valueToTree(this.getExperimentOptions()));
            }
            if (this.getExperimentReportConfiguration() != null) {
                data.set("experimentReportConfiguration", om.valueToTree(this.getExperimentReportConfiguration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLogConfiguration() != null) {
                data.set("logConfiguration", om.valueToTree(this.getLogConfiguration()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTarget() != null) {
                data.set("target", om.valueToTree(this.getTarget()));
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
            struct.set("fqn", om.valueToTree("aws.fisExperimentTemplate.FisExperimentTemplateConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FisExperimentTemplateConfig.Jsii$Proxy that = (FisExperimentTemplateConfig.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            if (!description.equals(that.description)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (!stopCondition.equals(that.stopCondition)) return false;
            if (this.experimentOptions != null ? !this.experimentOptions.equals(that.experimentOptions) : that.experimentOptions != null) return false;
            if (this.experimentReportConfiguration != null ? !this.experimentReportConfiguration.equals(that.experimentReportConfiguration) : that.experimentReportConfiguration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.logConfiguration != null ? !this.logConfiguration.equals(that.logConfiguration) : that.logConfiguration != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.target != null ? !this.target.equals(that.target) : that.target != null) return false;
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
            int result = this.action.hashCode();
            result = 31 * result + (this.description.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.stopCondition.hashCode());
            result = 31 * result + (this.experimentOptions != null ? this.experimentOptions.hashCode() : 0);
            result = 31 * result + (this.experimentReportConfiguration != null ? this.experimentReportConfiguration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.logConfiguration != null ? this.logConfiguration.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.target != null ? this.target.hashCode() : 0);
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
