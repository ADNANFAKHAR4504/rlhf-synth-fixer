package imports.aws.cloudwatch_metric_stream;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.290Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchMetricStream.CloudwatchMetricStreamConfig")
@software.amazon.jsii.Jsii.Proxy(CloudwatchMetricStreamConfig.Jsii$Proxy.class)
public interface CloudwatchMetricStreamConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#firehose_arn CloudwatchMetricStream#firehose_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFirehoseArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#output_format CloudwatchMetricStream#output_format}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOutputFormat();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#role_arn CloudwatchMetricStream#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * exclude_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#exclude_filter CloudwatchMetricStream#exclude_filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExcludeFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#id CloudwatchMetricStream#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * include_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#include_filter CloudwatchMetricStream#include_filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeFilter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#include_linked_accounts_metrics CloudwatchMetricStream#include_linked_accounts_metrics}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIncludeLinkedAccountsMetrics() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#name CloudwatchMetricStream#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#name_prefix CloudwatchMetricStream#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * statistics_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#statistics_configuration CloudwatchMetricStream#statistics_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStatisticsConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#tags CloudwatchMetricStream#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#tags_all CloudwatchMetricStream#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#timeouts CloudwatchMetricStream#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_metric_stream.CloudwatchMetricStreamTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchMetricStreamConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchMetricStreamConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchMetricStreamConfig> {
        java.lang.String firehoseArn;
        java.lang.String outputFormat;
        java.lang.String roleArn;
        java.lang.Object excludeFilter;
        java.lang.String id;
        java.lang.Object includeFilter;
        java.lang.Object includeLinkedAccountsMetrics;
        java.lang.String name;
        java.lang.String namePrefix;
        java.lang.Object statisticsConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.cloudwatch_metric_stream.CloudwatchMetricStreamTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getFirehoseArn}
         * @param firehoseArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#firehose_arn CloudwatchMetricStream#firehose_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder firehoseArn(java.lang.String firehoseArn) {
            this.firehoseArn = firehoseArn;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getOutputFormat}
         * @param outputFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#output_format CloudwatchMetricStream#output_format}. This parameter is required.
         * @return {@code this}
         */
        public Builder outputFormat(java.lang.String outputFormat) {
            this.outputFormat = outputFormat;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#role_arn CloudwatchMetricStream#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getExcludeFilter}
         * @param excludeFilter exclude_filter block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#exclude_filter CloudwatchMetricStream#exclude_filter}
         * @return {@code this}
         */
        public Builder excludeFilter(com.hashicorp.cdktf.IResolvable excludeFilter) {
            this.excludeFilter = excludeFilter;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getExcludeFilter}
         * @param excludeFilter exclude_filter block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#exclude_filter CloudwatchMetricStream#exclude_filter}
         * @return {@code this}
         */
        public Builder excludeFilter(java.util.List<? extends imports.aws.cloudwatch_metric_stream.CloudwatchMetricStreamExcludeFilter> excludeFilter) {
            this.excludeFilter = excludeFilter;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#id CloudwatchMetricStream#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getIncludeFilter}
         * @param includeFilter include_filter block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#include_filter CloudwatchMetricStream#include_filter}
         * @return {@code this}
         */
        public Builder includeFilter(com.hashicorp.cdktf.IResolvable includeFilter) {
            this.includeFilter = includeFilter;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getIncludeFilter}
         * @param includeFilter include_filter block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#include_filter CloudwatchMetricStream#include_filter}
         * @return {@code this}
         */
        public Builder includeFilter(java.util.List<? extends imports.aws.cloudwatch_metric_stream.CloudwatchMetricStreamIncludeFilter> includeFilter) {
            this.includeFilter = includeFilter;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getIncludeLinkedAccountsMetrics}
         * @param includeLinkedAccountsMetrics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#include_linked_accounts_metrics CloudwatchMetricStream#include_linked_accounts_metrics}.
         * @return {@code this}
         */
        public Builder includeLinkedAccountsMetrics(java.lang.Boolean includeLinkedAccountsMetrics) {
            this.includeLinkedAccountsMetrics = includeLinkedAccountsMetrics;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getIncludeLinkedAccountsMetrics}
         * @param includeLinkedAccountsMetrics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#include_linked_accounts_metrics CloudwatchMetricStream#include_linked_accounts_metrics}.
         * @return {@code this}
         */
        public Builder includeLinkedAccountsMetrics(com.hashicorp.cdktf.IResolvable includeLinkedAccountsMetrics) {
            this.includeLinkedAccountsMetrics = includeLinkedAccountsMetrics;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#name CloudwatchMetricStream#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#name_prefix CloudwatchMetricStream#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getStatisticsConfiguration}
         * @param statisticsConfiguration statistics_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#statistics_configuration CloudwatchMetricStream#statistics_configuration}
         * @return {@code this}
         */
        public Builder statisticsConfiguration(com.hashicorp.cdktf.IResolvable statisticsConfiguration) {
            this.statisticsConfiguration = statisticsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getStatisticsConfiguration}
         * @param statisticsConfiguration statistics_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#statistics_configuration CloudwatchMetricStream#statistics_configuration}
         * @return {@code this}
         */
        public Builder statisticsConfiguration(java.util.List<? extends imports.aws.cloudwatch_metric_stream.CloudwatchMetricStreamStatisticsConfiguration> statisticsConfiguration) {
            this.statisticsConfiguration = statisticsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#tags CloudwatchMetricStream#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#tags_all CloudwatchMetricStream#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_metric_stream#timeouts CloudwatchMetricStream#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.cloudwatch_metric_stream.CloudwatchMetricStreamTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getDependsOn}
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
         * Sets the value of {@link CloudwatchMetricStreamConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchMetricStreamConfig#getProvisioners}
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
         * @return a new instance of {@link CloudwatchMetricStreamConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchMetricStreamConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchMetricStreamConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchMetricStreamConfig {
        private final java.lang.String firehoseArn;
        private final java.lang.String outputFormat;
        private final java.lang.String roleArn;
        private final java.lang.Object excludeFilter;
        private final java.lang.String id;
        private final java.lang.Object includeFilter;
        private final java.lang.Object includeLinkedAccountsMetrics;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.lang.Object statisticsConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.cloudwatch_metric_stream.CloudwatchMetricStreamTimeouts timeouts;
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
            this.firehoseArn = software.amazon.jsii.Kernel.get(this, "firehoseArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outputFormat = software.amazon.jsii.Kernel.get(this, "outputFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.excludeFilter = software.amazon.jsii.Kernel.get(this, "excludeFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.includeFilter = software.amazon.jsii.Kernel.get(this, "includeFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.includeLinkedAccountsMetrics = software.amazon.jsii.Kernel.get(this, "includeLinkedAccountsMetrics", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.statisticsConfiguration = software.amazon.jsii.Kernel.get(this, "statisticsConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_metric_stream.CloudwatchMetricStreamTimeouts.class));
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
            this.firehoseArn = java.util.Objects.requireNonNull(builder.firehoseArn, "firehoseArn is required");
            this.outputFormat = java.util.Objects.requireNonNull(builder.outputFormat, "outputFormat is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.excludeFilter = builder.excludeFilter;
            this.id = builder.id;
            this.includeFilter = builder.includeFilter;
            this.includeLinkedAccountsMetrics = builder.includeLinkedAccountsMetrics;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.statisticsConfiguration = builder.statisticsConfiguration;
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
        public final java.lang.String getFirehoseArn() {
            return this.firehoseArn;
        }

        @Override
        public final java.lang.String getOutputFormat() {
            return this.outputFormat;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Object getExcludeFilter() {
            return this.excludeFilter;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getIncludeFilter() {
            return this.includeFilter;
        }

        @Override
        public final java.lang.Object getIncludeLinkedAccountsMetrics() {
            return this.includeLinkedAccountsMetrics;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final java.lang.Object getStatisticsConfiguration() {
            return this.statisticsConfiguration;
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
        public final imports.aws.cloudwatch_metric_stream.CloudwatchMetricStreamTimeouts getTimeouts() {
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

            data.set("firehoseArn", om.valueToTree(this.getFirehoseArn()));
            data.set("outputFormat", om.valueToTree(this.getOutputFormat()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getExcludeFilter() != null) {
                data.set("excludeFilter", om.valueToTree(this.getExcludeFilter()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIncludeFilter() != null) {
                data.set("includeFilter", om.valueToTree(this.getIncludeFilter()));
            }
            if (this.getIncludeLinkedAccountsMetrics() != null) {
                data.set("includeLinkedAccountsMetrics", om.valueToTree(this.getIncludeLinkedAccountsMetrics()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getStatisticsConfiguration() != null) {
                data.set("statisticsConfiguration", om.valueToTree(this.getStatisticsConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.cloudwatchMetricStream.CloudwatchMetricStreamConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchMetricStreamConfig.Jsii$Proxy that = (CloudwatchMetricStreamConfig.Jsii$Proxy) o;

            if (!firehoseArn.equals(that.firehoseArn)) return false;
            if (!outputFormat.equals(that.outputFormat)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.excludeFilter != null ? !this.excludeFilter.equals(that.excludeFilter) : that.excludeFilter != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.includeFilter != null ? !this.includeFilter.equals(that.includeFilter) : that.includeFilter != null) return false;
            if (this.includeLinkedAccountsMetrics != null ? !this.includeLinkedAccountsMetrics.equals(that.includeLinkedAccountsMetrics) : that.includeLinkedAccountsMetrics != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.statisticsConfiguration != null ? !this.statisticsConfiguration.equals(that.statisticsConfiguration) : that.statisticsConfiguration != null) return false;
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
            int result = this.firehoseArn.hashCode();
            result = 31 * result + (this.outputFormat.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.excludeFilter != null ? this.excludeFilter.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.includeFilter != null ? this.includeFilter.hashCode() : 0);
            result = 31 * result + (this.includeLinkedAccountsMetrics != null ? this.includeLinkedAccountsMetrics.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.statisticsConfiguration != null ? this.statisticsConfiguration.hashCode() : 0);
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
