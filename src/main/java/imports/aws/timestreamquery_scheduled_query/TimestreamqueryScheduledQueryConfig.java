package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.546Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryConfig")
@software.amazon.jsii.Jsii.Proxy(TimestreamqueryScheduledQueryConfig.Jsii$Proxy.class)
public interface TimestreamqueryScheduledQueryConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_role_arn TimestreamqueryScheduledQuery#execution_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#name TimestreamqueryScheduledQuery#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_string TimestreamqueryScheduledQuery#query_string}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getQueryString();

    /**
     * error_report_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_configuration TimestreamqueryScheduledQuery#error_report_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getErrorReportConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#kms_key_id TimestreamqueryScheduledQuery#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * last_run_summary block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#last_run_summary TimestreamqueryScheduledQuery#last_run_summary}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLastRunSummary() {
        return null;
    }

    /**
     * notification_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#notification_configuration TimestreamqueryScheduledQuery#notification_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNotificationConfiguration() {
        return null;
    }

    /**
     * recently_failed_runs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#recently_failed_runs TimestreamqueryScheduledQuery#recently_failed_runs}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRecentlyFailedRuns() {
        return null;
    }

    /**
     * schedule_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#schedule_configuration TimestreamqueryScheduledQuery#schedule_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getScheduleConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#tags TimestreamqueryScheduledQuery#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * target_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_configuration TimestreamqueryScheduledQuery#target_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTargetConfiguration() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#timeouts TimestreamqueryScheduledQuery#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamqueryScheduledQueryConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamqueryScheduledQueryConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamqueryScheduledQueryConfig> {
        java.lang.String executionRoleArn;
        java.lang.String name;
        java.lang.String queryString;
        java.lang.Object errorReportConfiguration;
        java.lang.String kmsKeyId;
        java.lang.Object lastRunSummary;
        java.lang.Object notificationConfiguration;
        java.lang.Object recentlyFailedRuns;
        java.lang.Object scheduleConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Object targetConfiguration;
        imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getExecutionRoleArn}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_role_arn TimestreamqueryScheduledQuery#execution_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder executionRoleArn(java.lang.String executionRoleArn) {
            this.executionRoleArn = executionRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#name TimestreamqueryScheduledQuery#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getQueryString}
         * @param queryString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_string TimestreamqueryScheduledQuery#query_string}. This parameter is required.
         * @return {@code this}
         */
        public Builder queryString(java.lang.String queryString) {
            this.queryString = queryString;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getErrorReportConfiguration}
         * @param errorReportConfiguration error_report_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_configuration TimestreamqueryScheduledQuery#error_report_configuration}
         * @return {@code this}
         */
        public Builder errorReportConfiguration(com.hashicorp.cdktf.IResolvable errorReportConfiguration) {
            this.errorReportConfiguration = errorReportConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getErrorReportConfiguration}
         * @param errorReportConfiguration error_report_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_configuration TimestreamqueryScheduledQuery#error_report_configuration}
         * @return {@code this}
         */
        public Builder errorReportConfiguration(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryErrorReportConfiguration> errorReportConfiguration) {
            this.errorReportConfiguration = errorReportConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#kms_key_id TimestreamqueryScheduledQuery#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getLastRunSummary}
         * @param lastRunSummary last_run_summary block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#last_run_summary TimestreamqueryScheduledQuery#last_run_summary}
         * @return {@code this}
         */
        public Builder lastRunSummary(com.hashicorp.cdktf.IResolvable lastRunSummary) {
            this.lastRunSummary = lastRunSummary;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getLastRunSummary}
         * @param lastRunSummary last_run_summary block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#last_run_summary TimestreamqueryScheduledQuery#last_run_summary}
         * @return {@code this}
         */
        public Builder lastRunSummary(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummary> lastRunSummary) {
            this.lastRunSummary = lastRunSummary;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getNotificationConfiguration}
         * @param notificationConfiguration notification_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#notification_configuration TimestreamqueryScheduledQuery#notification_configuration}
         * @return {@code this}
         */
        public Builder notificationConfiguration(com.hashicorp.cdktf.IResolvable notificationConfiguration) {
            this.notificationConfiguration = notificationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getNotificationConfiguration}
         * @param notificationConfiguration notification_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#notification_configuration TimestreamqueryScheduledQuery#notification_configuration}
         * @return {@code this}
         */
        public Builder notificationConfiguration(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryNotificationConfiguration> notificationConfiguration) {
            this.notificationConfiguration = notificationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getRecentlyFailedRuns}
         * @param recentlyFailedRuns recently_failed_runs block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#recently_failed_runs TimestreamqueryScheduledQuery#recently_failed_runs}
         * @return {@code this}
         */
        public Builder recentlyFailedRuns(com.hashicorp.cdktf.IResolvable recentlyFailedRuns) {
            this.recentlyFailedRuns = recentlyFailedRuns;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getRecentlyFailedRuns}
         * @param recentlyFailedRuns recently_failed_runs block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#recently_failed_runs TimestreamqueryScheduledQuery#recently_failed_runs}
         * @return {@code this}
         */
        public Builder recentlyFailedRuns(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryRecentlyFailedRuns> recentlyFailedRuns) {
            this.recentlyFailedRuns = recentlyFailedRuns;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getScheduleConfiguration}
         * @param scheduleConfiguration schedule_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#schedule_configuration TimestreamqueryScheduledQuery#schedule_configuration}
         * @return {@code this}
         */
        public Builder scheduleConfiguration(com.hashicorp.cdktf.IResolvable scheduleConfiguration) {
            this.scheduleConfiguration = scheduleConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getScheduleConfiguration}
         * @param scheduleConfiguration schedule_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#schedule_configuration TimestreamqueryScheduledQuery#schedule_configuration}
         * @return {@code this}
         */
        public Builder scheduleConfiguration(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryScheduleConfiguration> scheduleConfiguration) {
            this.scheduleConfiguration = scheduleConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#tags TimestreamqueryScheduledQuery#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getTargetConfiguration}
         * @param targetConfiguration target_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_configuration TimestreamqueryScheduledQuery#target_configuration}
         * @return {@code this}
         */
        public Builder targetConfiguration(com.hashicorp.cdktf.IResolvable targetConfiguration) {
            this.targetConfiguration = targetConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getTargetConfiguration}
         * @param targetConfiguration target_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#target_configuration TimestreamqueryScheduledQuery#target_configuration}
         * @return {@code this}
         */
        public Builder targetConfiguration(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTargetConfiguration> targetConfiguration) {
            this.targetConfiguration = targetConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#timeouts TimestreamqueryScheduledQuery#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getDependsOn}
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
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryConfig#getProvisioners}
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
         * @return a new instance of {@link TimestreamqueryScheduledQueryConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamqueryScheduledQueryConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamqueryScheduledQueryConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamqueryScheduledQueryConfig {
        private final java.lang.String executionRoleArn;
        private final java.lang.String name;
        private final java.lang.String queryString;
        private final java.lang.Object errorReportConfiguration;
        private final java.lang.String kmsKeyId;
        private final java.lang.Object lastRunSummary;
        private final java.lang.Object notificationConfiguration;
        private final java.lang.Object recentlyFailedRuns;
        private final java.lang.Object scheduleConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.lang.Object targetConfiguration;
        private final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTimeouts timeouts;
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
            this.executionRoleArn = software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.queryString = software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.errorReportConfiguration = software.amazon.jsii.Kernel.get(this, "errorReportConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lastRunSummary = software.amazon.jsii.Kernel.get(this, "lastRunSummary", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.notificationConfiguration = software.amazon.jsii.Kernel.get(this, "notificationConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.recentlyFailedRuns = software.amazon.jsii.Kernel.get(this, "recentlyFailedRuns", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scheduleConfiguration = software.amazon.jsii.Kernel.get(this, "scheduleConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.targetConfiguration = software.amazon.jsii.Kernel.get(this, "targetConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTimeouts.class));
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
            this.executionRoleArn = java.util.Objects.requireNonNull(builder.executionRoleArn, "executionRoleArn is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.queryString = java.util.Objects.requireNonNull(builder.queryString, "queryString is required");
            this.errorReportConfiguration = builder.errorReportConfiguration;
            this.kmsKeyId = builder.kmsKeyId;
            this.lastRunSummary = builder.lastRunSummary;
            this.notificationConfiguration = builder.notificationConfiguration;
            this.recentlyFailedRuns = builder.recentlyFailedRuns;
            this.scheduleConfiguration = builder.scheduleConfiguration;
            this.tags = builder.tags;
            this.targetConfiguration = builder.targetConfiguration;
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
        public final java.lang.String getExecutionRoleArn() {
            return this.executionRoleArn;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getQueryString() {
            return this.queryString;
        }

        @Override
        public final java.lang.Object getErrorReportConfiguration() {
            return this.errorReportConfiguration;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.Object getLastRunSummary() {
            return this.lastRunSummary;
        }

        @Override
        public final java.lang.Object getNotificationConfiguration() {
            return this.notificationConfiguration;
        }

        @Override
        public final java.lang.Object getRecentlyFailedRuns() {
            return this.recentlyFailedRuns;
        }

        @Override
        public final java.lang.Object getScheduleConfiguration() {
            return this.scheduleConfiguration;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.lang.Object getTargetConfiguration() {
            return this.targetConfiguration;
        }

        @Override
        public final imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryTimeouts getTimeouts() {
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

            data.set("executionRoleArn", om.valueToTree(this.getExecutionRoleArn()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("queryString", om.valueToTree(this.getQueryString()));
            if (this.getErrorReportConfiguration() != null) {
                data.set("errorReportConfiguration", om.valueToTree(this.getErrorReportConfiguration()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getLastRunSummary() != null) {
                data.set("lastRunSummary", om.valueToTree(this.getLastRunSummary()));
            }
            if (this.getNotificationConfiguration() != null) {
                data.set("notificationConfiguration", om.valueToTree(this.getNotificationConfiguration()));
            }
            if (this.getRecentlyFailedRuns() != null) {
                data.set("recentlyFailedRuns", om.valueToTree(this.getRecentlyFailedRuns()));
            }
            if (this.getScheduleConfiguration() != null) {
                data.set("scheduleConfiguration", om.valueToTree(this.getScheduleConfiguration()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTargetConfiguration() != null) {
                data.set("targetConfiguration", om.valueToTree(this.getTargetConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamqueryScheduledQueryConfig.Jsii$Proxy that = (TimestreamqueryScheduledQueryConfig.Jsii$Proxy) o;

            if (!executionRoleArn.equals(that.executionRoleArn)) return false;
            if (!name.equals(that.name)) return false;
            if (!queryString.equals(that.queryString)) return false;
            if (this.errorReportConfiguration != null ? !this.errorReportConfiguration.equals(that.errorReportConfiguration) : that.errorReportConfiguration != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.lastRunSummary != null ? !this.lastRunSummary.equals(that.lastRunSummary) : that.lastRunSummary != null) return false;
            if (this.notificationConfiguration != null ? !this.notificationConfiguration.equals(that.notificationConfiguration) : that.notificationConfiguration != null) return false;
            if (this.recentlyFailedRuns != null ? !this.recentlyFailedRuns.equals(that.recentlyFailedRuns) : that.recentlyFailedRuns != null) return false;
            if (this.scheduleConfiguration != null ? !this.scheduleConfiguration.equals(that.scheduleConfiguration) : that.scheduleConfiguration != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.targetConfiguration != null ? !this.targetConfiguration.equals(that.targetConfiguration) : that.targetConfiguration != null) return false;
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
            int result = this.executionRoleArn.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.queryString.hashCode());
            result = 31 * result + (this.errorReportConfiguration != null ? this.errorReportConfiguration.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.lastRunSummary != null ? this.lastRunSummary.hashCode() : 0);
            result = 31 * result + (this.notificationConfiguration != null ? this.notificationConfiguration.hashCode() : 0);
            result = 31 * result + (this.recentlyFailedRuns != null ? this.recentlyFailedRuns.hashCode() : 0);
            result = 31 * result + (this.scheduleConfiguration != null ? this.scheduleConfiguration.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.targetConfiguration != null ? this.targetConfiguration.hashCode() : 0);
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
