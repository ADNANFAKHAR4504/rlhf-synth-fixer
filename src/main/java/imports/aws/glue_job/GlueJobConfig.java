package imports.aws.glue_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.296Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueJob.GlueJobConfig")
@software.amazon.jsii.Jsii.Proxy(GlueJobConfig.Jsii$Proxy.class)
public interface GlueJobConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * command block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#command GlueJob#command}
     */
    @org.jetbrains.annotations.NotNull imports.aws.glue_job.GlueJobCommand getCommand();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#name GlueJob#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#role_arn GlueJob#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#connections GlueJob#connections}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getConnections() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#default_arguments GlueJob#default_arguments}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getDefaultArguments() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#description GlueJob#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#execution_class GlueJob#execution_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExecutionClass() {
        return null;
    }

    /**
     * execution_property block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#execution_property GlueJob#execution_property}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_job.GlueJobExecutionProperty getExecutionProperty() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#glue_version GlueJob#glue_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGlueVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#id GlueJob#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#job_run_queuing_enabled GlueJob#job_run_queuing_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getJobRunQueuingEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#maintenance_window GlueJob#maintenance_window}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMaintenanceWindow() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#max_capacity GlueJob#max_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#max_retries GlueJob#max_retries}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxRetries() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#non_overridable_arguments GlueJob#non_overridable_arguments}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getNonOverridableArguments() {
        return null;
    }

    /**
     * notification_property block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#notification_property GlueJob#notification_property}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_job.GlueJobNotificationProperty getNotificationProperty() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#number_of_workers GlueJob#number_of_workers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNumberOfWorkers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#security_configuration GlueJob#security_configuration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecurityConfiguration() {
        return null;
    }

    /**
     * source_control_details block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#source_control_details GlueJob#source_control_details}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_job.GlueJobSourceControlDetails getSourceControlDetails() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#tags GlueJob#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#tags_all GlueJob#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#timeout GlueJob#timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#worker_type GlueJob#worker_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWorkerType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueJobConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueJobConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueJobConfig> {
        imports.aws.glue_job.GlueJobCommand command;
        java.lang.String name;
        java.lang.String roleArn;
        java.util.List<java.lang.String> connections;
        java.util.Map<java.lang.String, java.lang.String> defaultArguments;
        java.lang.String description;
        java.lang.String executionClass;
        imports.aws.glue_job.GlueJobExecutionProperty executionProperty;
        java.lang.String glueVersion;
        java.lang.String id;
        java.lang.Object jobRunQueuingEnabled;
        java.lang.String maintenanceWindow;
        java.lang.Number maxCapacity;
        java.lang.Number maxRetries;
        java.util.Map<java.lang.String, java.lang.String> nonOverridableArguments;
        imports.aws.glue_job.GlueJobNotificationProperty notificationProperty;
        java.lang.Number numberOfWorkers;
        java.lang.String securityConfiguration;
        imports.aws.glue_job.GlueJobSourceControlDetails sourceControlDetails;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Number timeout;
        java.lang.String workerType;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link GlueJobConfig#getCommand}
         * @param command command block. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#command GlueJob#command}
         * @return {@code this}
         */
        public Builder command(imports.aws.glue_job.GlueJobCommand command) {
            this.command = command;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#name GlueJob#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#role_arn GlueJob#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getConnections}
         * @param connections Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#connections GlueJob#connections}.
         * @return {@code this}
         */
        public Builder connections(java.util.List<java.lang.String> connections) {
            this.connections = connections;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getDefaultArguments}
         * @param defaultArguments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#default_arguments GlueJob#default_arguments}.
         * @return {@code this}
         */
        public Builder defaultArguments(java.util.Map<java.lang.String, java.lang.String> defaultArguments) {
            this.defaultArguments = defaultArguments;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#description GlueJob#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getExecutionClass}
         * @param executionClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#execution_class GlueJob#execution_class}.
         * @return {@code this}
         */
        public Builder executionClass(java.lang.String executionClass) {
            this.executionClass = executionClass;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getExecutionProperty}
         * @param executionProperty execution_property block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#execution_property GlueJob#execution_property}
         * @return {@code this}
         */
        public Builder executionProperty(imports.aws.glue_job.GlueJobExecutionProperty executionProperty) {
            this.executionProperty = executionProperty;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getGlueVersion}
         * @param glueVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#glue_version GlueJob#glue_version}.
         * @return {@code this}
         */
        public Builder glueVersion(java.lang.String glueVersion) {
            this.glueVersion = glueVersion;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#id GlueJob#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getJobRunQueuingEnabled}
         * @param jobRunQueuingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#job_run_queuing_enabled GlueJob#job_run_queuing_enabled}.
         * @return {@code this}
         */
        public Builder jobRunQueuingEnabled(java.lang.Boolean jobRunQueuingEnabled) {
            this.jobRunQueuingEnabled = jobRunQueuingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getJobRunQueuingEnabled}
         * @param jobRunQueuingEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#job_run_queuing_enabled GlueJob#job_run_queuing_enabled}.
         * @return {@code this}
         */
        public Builder jobRunQueuingEnabled(com.hashicorp.cdktf.IResolvable jobRunQueuingEnabled) {
            this.jobRunQueuingEnabled = jobRunQueuingEnabled;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getMaintenanceWindow}
         * @param maintenanceWindow Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#maintenance_window GlueJob#maintenance_window}.
         * @return {@code this}
         */
        public Builder maintenanceWindow(java.lang.String maintenanceWindow) {
            this.maintenanceWindow = maintenanceWindow;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getMaxCapacity}
         * @param maxCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#max_capacity GlueJob#max_capacity}.
         * @return {@code this}
         */
        public Builder maxCapacity(java.lang.Number maxCapacity) {
            this.maxCapacity = maxCapacity;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getMaxRetries}
         * @param maxRetries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#max_retries GlueJob#max_retries}.
         * @return {@code this}
         */
        public Builder maxRetries(java.lang.Number maxRetries) {
            this.maxRetries = maxRetries;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getNonOverridableArguments}
         * @param nonOverridableArguments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#non_overridable_arguments GlueJob#non_overridable_arguments}.
         * @return {@code this}
         */
        public Builder nonOverridableArguments(java.util.Map<java.lang.String, java.lang.String> nonOverridableArguments) {
            this.nonOverridableArguments = nonOverridableArguments;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getNotificationProperty}
         * @param notificationProperty notification_property block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#notification_property GlueJob#notification_property}
         * @return {@code this}
         */
        public Builder notificationProperty(imports.aws.glue_job.GlueJobNotificationProperty notificationProperty) {
            this.notificationProperty = notificationProperty;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getNumberOfWorkers}
         * @param numberOfWorkers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#number_of_workers GlueJob#number_of_workers}.
         * @return {@code this}
         */
        public Builder numberOfWorkers(java.lang.Number numberOfWorkers) {
            this.numberOfWorkers = numberOfWorkers;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getSecurityConfiguration}
         * @param securityConfiguration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#security_configuration GlueJob#security_configuration}.
         * @return {@code this}
         */
        public Builder securityConfiguration(java.lang.String securityConfiguration) {
            this.securityConfiguration = securityConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getSourceControlDetails}
         * @param sourceControlDetails source_control_details block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#source_control_details GlueJob#source_control_details}
         * @return {@code this}
         */
        public Builder sourceControlDetails(imports.aws.glue_job.GlueJobSourceControlDetails sourceControlDetails) {
            this.sourceControlDetails = sourceControlDetails;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#tags GlueJob#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#tags_all GlueJob#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getTimeout}
         * @param timeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#timeout GlueJob#timeout}.
         * @return {@code this}
         */
        public Builder timeout(java.lang.Number timeout) {
            this.timeout = timeout;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getWorkerType}
         * @param workerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_job#worker_type GlueJob#worker_type}.
         * @return {@code this}
         */
        public Builder workerType(java.lang.String workerType) {
            this.workerType = workerType;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getDependsOn}
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
         * Sets the value of {@link GlueJobConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link GlueJobConfig#getProvisioners}
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
         * @return a new instance of {@link GlueJobConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueJobConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueJobConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueJobConfig {
        private final imports.aws.glue_job.GlueJobCommand command;
        private final java.lang.String name;
        private final java.lang.String roleArn;
        private final java.util.List<java.lang.String> connections;
        private final java.util.Map<java.lang.String, java.lang.String> defaultArguments;
        private final java.lang.String description;
        private final java.lang.String executionClass;
        private final imports.aws.glue_job.GlueJobExecutionProperty executionProperty;
        private final java.lang.String glueVersion;
        private final java.lang.String id;
        private final java.lang.Object jobRunQueuingEnabled;
        private final java.lang.String maintenanceWindow;
        private final java.lang.Number maxCapacity;
        private final java.lang.Number maxRetries;
        private final java.util.Map<java.lang.String, java.lang.String> nonOverridableArguments;
        private final imports.aws.glue_job.GlueJobNotificationProperty notificationProperty;
        private final java.lang.Number numberOfWorkers;
        private final java.lang.String securityConfiguration;
        private final imports.aws.glue_job.GlueJobSourceControlDetails sourceControlDetails;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Number timeout;
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
            this.command = software.amazon.jsii.Kernel.get(this, "command", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobCommand.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connections = software.amazon.jsii.Kernel.get(this, "connections", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.defaultArguments = software.amazon.jsii.Kernel.get(this, "defaultArguments", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.executionClass = software.amazon.jsii.Kernel.get(this, "executionClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.executionProperty = software.amazon.jsii.Kernel.get(this, "executionProperty", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobExecutionProperty.class));
            this.glueVersion = software.amazon.jsii.Kernel.get(this, "glueVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.jobRunQueuingEnabled = software.amazon.jsii.Kernel.get(this, "jobRunQueuingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.maintenanceWindow = software.amazon.jsii.Kernel.get(this, "maintenanceWindow", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxCapacity = software.amazon.jsii.Kernel.get(this, "maxCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxRetries = software.amazon.jsii.Kernel.get(this, "maxRetries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.nonOverridableArguments = software.amazon.jsii.Kernel.get(this, "nonOverridableArguments", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.notificationProperty = software.amazon.jsii.Kernel.get(this, "notificationProperty", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobNotificationProperty.class));
            this.numberOfWorkers = software.amazon.jsii.Kernel.get(this, "numberOfWorkers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.securityConfiguration = software.amazon.jsii.Kernel.get(this, "securityConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceControlDetails = software.amazon.jsii.Kernel.get(this, "sourceControlDetails", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobSourceControlDetails.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeout = software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.command = java.util.Objects.requireNonNull(builder.command, "command is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.connections = builder.connections;
            this.defaultArguments = builder.defaultArguments;
            this.description = builder.description;
            this.executionClass = builder.executionClass;
            this.executionProperty = builder.executionProperty;
            this.glueVersion = builder.glueVersion;
            this.id = builder.id;
            this.jobRunQueuingEnabled = builder.jobRunQueuingEnabled;
            this.maintenanceWindow = builder.maintenanceWindow;
            this.maxCapacity = builder.maxCapacity;
            this.maxRetries = builder.maxRetries;
            this.nonOverridableArguments = builder.nonOverridableArguments;
            this.notificationProperty = builder.notificationProperty;
            this.numberOfWorkers = builder.numberOfWorkers;
            this.securityConfiguration = builder.securityConfiguration;
            this.sourceControlDetails = builder.sourceControlDetails;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeout = builder.timeout;
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
        public final imports.aws.glue_job.GlueJobCommand getCommand() {
            return this.command;
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
        public final java.util.List<java.lang.String> getConnections() {
            return this.connections;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getDefaultArguments() {
            return this.defaultArguments;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getExecutionClass() {
            return this.executionClass;
        }

        @Override
        public final imports.aws.glue_job.GlueJobExecutionProperty getExecutionProperty() {
            return this.executionProperty;
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
        public final java.lang.Object getJobRunQueuingEnabled() {
            return this.jobRunQueuingEnabled;
        }

        @Override
        public final java.lang.String getMaintenanceWindow() {
            return this.maintenanceWindow;
        }

        @Override
        public final java.lang.Number getMaxCapacity() {
            return this.maxCapacity;
        }

        @Override
        public final java.lang.Number getMaxRetries() {
            return this.maxRetries;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getNonOverridableArguments() {
            return this.nonOverridableArguments;
        }

        @Override
        public final imports.aws.glue_job.GlueJobNotificationProperty getNotificationProperty() {
            return this.notificationProperty;
        }

        @Override
        public final java.lang.Number getNumberOfWorkers() {
            return this.numberOfWorkers;
        }

        @Override
        public final java.lang.String getSecurityConfiguration() {
            return this.securityConfiguration;
        }

        @Override
        public final imports.aws.glue_job.GlueJobSourceControlDetails getSourceControlDetails() {
            return this.sourceControlDetails;
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
        public final java.lang.Number getTimeout() {
            return this.timeout;
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

            data.set("command", om.valueToTree(this.getCommand()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getConnections() != null) {
                data.set("connections", om.valueToTree(this.getConnections()));
            }
            if (this.getDefaultArguments() != null) {
                data.set("defaultArguments", om.valueToTree(this.getDefaultArguments()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getExecutionClass() != null) {
                data.set("executionClass", om.valueToTree(this.getExecutionClass()));
            }
            if (this.getExecutionProperty() != null) {
                data.set("executionProperty", om.valueToTree(this.getExecutionProperty()));
            }
            if (this.getGlueVersion() != null) {
                data.set("glueVersion", om.valueToTree(this.getGlueVersion()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getJobRunQueuingEnabled() != null) {
                data.set("jobRunQueuingEnabled", om.valueToTree(this.getJobRunQueuingEnabled()));
            }
            if (this.getMaintenanceWindow() != null) {
                data.set("maintenanceWindow", om.valueToTree(this.getMaintenanceWindow()));
            }
            if (this.getMaxCapacity() != null) {
                data.set("maxCapacity", om.valueToTree(this.getMaxCapacity()));
            }
            if (this.getMaxRetries() != null) {
                data.set("maxRetries", om.valueToTree(this.getMaxRetries()));
            }
            if (this.getNonOverridableArguments() != null) {
                data.set("nonOverridableArguments", om.valueToTree(this.getNonOverridableArguments()));
            }
            if (this.getNotificationProperty() != null) {
                data.set("notificationProperty", om.valueToTree(this.getNotificationProperty()));
            }
            if (this.getNumberOfWorkers() != null) {
                data.set("numberOfWorkers", om.valueToTree(this.getNumberOfWorkers()));
            }
            if (this.getSecurityConfiguration() != null) {
                data.set("securityConfiguration", om.valueToTree(this.getSecurityConfiguration()));
            }
            if (this.getSourceControlDetails() != null) {
                data.set("sourceControlDetails", om.valueToTree(this.getSourceControlDetails()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeout() != null) {
                data.set("timeout", om.valueToTree(this.getTimeout()));
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
            struct.set("fqn", om.valueToTree("aws.glueJob.GlueJobConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueJobConfig.Jsii$Proxy that = (GlueJobConfig.Jsii$Proxy) o;

            if (!command.equals(that.command)) return false;
            if (!name.equals(that.name)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.connections != null ? !this.connections.equals(that.connections) : that.connections != null) return false;
            if (this.defaultArguments != null ? !this.defaultArguments.equals(that.defaultArguments) : that.defaultArguments != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.executionClass != null ? !this.executionClass.equals(that.executionClass) : that.executionClass != null) return false;
            if (this.executionProperty != null ? !this.executionProperty.equals(that.executionProperty) : that.executionProperty != null) return false;
            if (this.glueVersion != null ? !this.glueVersion.equals(that.glueVersion) : that.glueVersion != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.jobRunQueuingEnabled != null ? !this.jobRunQueuingEnabled.equals(that.jobRunQueuingEnabled) : that.jobRunQueuingEnabled != null) return false;
            if (this.maintenanceWindow != null ? !this.maintenanceWindow.equals(that.maintenanceWindow) : that.maintenanceWindow != null) return false;
            if (this.maxCapacity != null ? !this.maxCapacity.equals(that.maxCapacity) : that.maxCapacity != null) return false;
            if (this.maxRetries != null ? !this.maxRetries.equals(that.maxRetries) : that.maxRetries != null) return false;
            if (this.nonOverridableArguments != null ? !this.nonOverridableArguments.equals(that.nonOverridableArguments) : that.nonOverridableArguments != null) return false;
            if (this.notificationProperty != null ? !this.notificationProperty.equals(that.notificationProperty) : that.notificationProperty != null) return false;
            if (this.numberOfWorkers != null ? !this.numberOfWorkers.equals(that.numberOfWorkers) : that.numberOfWorkers != null) return false;
            if (this.securityConfiguration != null ? !this.securityConfiguration.equals(that.securityConfiguration) : that.securityConfiguration != null) return false;
            if (this.sourceControlDetails != null ? !this.sourceControlDetails.equals(that.sourceControlDetails) : that.sourceControlDetails != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeout != null ? !this.timeout.equals(that.timeout) : that.timeout != null) return false;
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
            int result = this.command.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.connections != null ? this.connections.hashCode() : 0);
            result = 31 * result + (this.defaultArguments != null ? this.defaultArguments.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.executionClass != null ? this.executionClass.hashCode() : 0);
            result = 31 * result + (this.executionProperty != null ? this.executionProperty.hashCode() : 0);
            result = 31 * result + (this.glueVersion != null ? this.glueVersion.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.jobRunQueuingEnabled != null ? this.jobRunQueuingEnabled.hashCode() : 0);
            result = 31 * result + (this.maintenanceWindow != null ? this.maintenanceWindow.hashCode() : 0);
            result = 31 * result + (this.maxCapacity != null ? this.maxCapacity.hashCode() : 0);
            result = 31 * result + (this.maxRetries != null ? this.maxRetries.hashCode() : 0);
            result = 31 * result + (this.nonOverridableArguments != null ? this.nonOverridableArguments.hashCode() : 0);
            result = 31 * result + (this.notificationProperty != null ? this.notificationProperty.hashCode() : 0);
            result = 31 * result + (this.numberOfWorkers != null ? this.numberOfWorkers.hashCode() : 0);
            result = 31 * result + (this.securityConfiguration != null ? this.securityConfiguration.hashCode() : 0);
            result = 31 * result + (this.sourceControlDetails != null ? this.sourceControlDetails.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeout != null ? this.timeout.hashCode() : 0);
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
