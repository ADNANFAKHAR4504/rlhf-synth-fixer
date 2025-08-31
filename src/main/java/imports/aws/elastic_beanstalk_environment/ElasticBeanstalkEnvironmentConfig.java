package imports.aws.elastic_beanstalk_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.167Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticBeanstalkEnvironment.ElasticBeanstalkEnvironmentConfig")
@software.amazon.jsii.Jsii.Proxy(ElasticBeanstalkEnvironmentConfig.Jsii$Proxy.class)
public interface ElasticBeanstalkEnvironmentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#application ElasticBeanstalkEnvironment#application}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApplication();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#name ElasticBeanstalkEnvironment#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#cname_prefix ElasticBeanstalkEnvironment#cname_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCnamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#description ElasticBeanstalkEnvironment#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#id ElasticBeanstalkEnvironment#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#platform_arn ElasticBeanstalkEnvironment#platform_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlatformArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#poll_interval ElasticBeanstalkEnvironment#poll_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPollInterval() {
        return null;
    }

    /**
     * setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#setting ElasticBeanstalkEnvironment#setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSetting() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#solution_stack_name ElasticBeanstalkEnvironment#solution_stack_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSolutionStackName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#tags ElasticBeanstalkEnvironment#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#tags_all ElasticBeanstalkEnvironment#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#template_name ElasticBeanstalkEnvironment#template_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplateName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#tier ElasticBeanstalkEnvironment#tier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#version_label ElasticBeanstalkEnvironment#version_label}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersionLabel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#wait_for_ready_timeout ElasticBeanstalkEnvironment#wait_for_ready_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWaitForReadyTimeout() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticBeanstalkEnvironmentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticBeanstalkEnvironmentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticBeanstalkEnvironmentConfig> {
        java.lang.String application;
        java.lang.String name;
        java.lang.String cnamePrefix;
        java.lang.String description;
        java.lang.String id;
        java.lang.String platformArn;
        java.lang.String pollInterval;
        java.lang.Object setting;
        java.lang.String solutionStackName;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String templateName;
        java.lang.String tier;
        java.lang.String versionLabel;
        java.lang.String waitForReadyTimeout;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getApplication}
         * @param application Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#application ElasticBeanstalkEnvironment#application}. This parameter is required.
         * @return {@code this}
         */
        public Builder application(java.lang.String application) {
            this.application = application;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#name ElasticBeanstalkEnvironment#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getCnamePrefix}
         * @param cnamePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#cname_prefix ElasticBeanstalkEnvironment#cname_prefix}.
         * @return {@code this}
         */
        public Builder cnamePrefix(java.lang.String cnamePrefix) {
            this.cnamePrefix = cnamePrefix;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#description ElasticBeanstalkEnvironment#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#id ElasticBeanstalkEnvironment#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getPlatformArn}
         * @param platformArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#platform_arn ElasticBeanstalkEnvironment#platform_arn}.
         * @return {@code this}
         */
        public Builder platformArn(java.lang.String platformArn) {
            this.platformArn = platformArn;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getPollInterval}
         * @param pollInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#poll_interval ElasticBeanstalkEnvironment#poll_interval}.
         * @return {@code this}
         */
        public Builder pollInterval(java.lang.String pollInterval) {
            this.pollInterval = pollInterval;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getSetting}
         * @param setting setting block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#setting ElasticBeanstalkEnvironment#setting}
         * @return {@code this}
         */
        public Builder setting(com.hashicorp.cdktf.IResolvable setting) {
            this.setting = setting;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getSetting}
         * @param setting setting block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#setting ElasticBeanstalkEnvironment#setting}
         * @return {@code this}
         */
        public Builder setting(java.util.List<? extends imports.aws.elastic_beanstalk_environment.ElasticBeanstalkEnvironmentSetting> setting) {
            this.setting = setting;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getSolutionStackName}
         * @param solutionStackName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#solution_stack_name ElasticBeanstalkEnvironment#solution_stack_name}.
         * @return {@code this}
         */
        public Builder solutionStackName(java.lang.String solutionStackName) {
            this.solutionStackName = solutionStackName;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#tags ElasticBeanstalkEnvironment#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#tags_all ElasticBeanstalkEnvironment#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getTemplateName}
         * @param templateName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#template_name ElasticBeanstalkEnvironment#template_name}.
         * @return {@code this}
         */
        public Builder templateName(java.lang.String templateName) {
            this.templateName = templateName;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getTier}
         * @param tier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#tier ElasticBeanstalkEnvironment#tier}.
         * @return {@code this}
         */
        public Builder tier(java.lang.String tier) {
            this.tier = tier;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getVersionLabel}
         * @param versionLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#version_label ElasticBeanstalkEnvironment#version_label}.
         * @return {@code this}
         */
        public Builder versionLabel(java.lang.String versionLabel) {
            this.versionLabel = versionLabel;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getWaitForReadyTimeout}
         * @param waitForReadyTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_environment#wait_for_ready_timeout ElasticBeanstalkEnvironment#wait_for_ready_timeout}.
         * @return {@code this}
         */
        public Builder waitForReadyTimeout(java.lang.String waitForReadyTimeout) {
            this.waitForReadyTimeout = waitForReadyTimeout;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getDependsOn}
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
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkEnvironmentConfig#getProvisioners}
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
         * @return a new instance of {@link ElasticBeanstalkEnvironmentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticBeanstalkEnvironmentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticBeanstalkEnvironmentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticBeanstalkEnvironmentConfig {
        private final java.lang.String application;
        private final java.lang.String name;
        private final java.lang.String cnamePrefix;
        private final java.lang.String description;
        private final java.lang.String id;
        private final java.lang.String platformArn;
        private final java.lang.String pollInterval;
        private final java.lang.Object setting;
        private final java.lang.String solutionStackName;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String templateName;
        private final java.lang.String tier;
        private final java.lang.String versionLabel;
        private final java.lang.String waitForReadyTimeout;
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
            this.application = software.amazon.jsii.Kernel.get(this, "application", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cnamePrefix = software.amazon.jsii.Kernel.get(this, "cnamePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.platformArn = software.amazon.jsii.Kernel.get(this, "platformArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pollInterval = software.amazon.jsii.Kernel.get(this, "pollInterval", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.setting = software.amazon.jsii.Kernel.get(this, "setting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.solutionStackName = software.amazon.jsii.Kernel.get(this, "solutionStackName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.templateName = software.amazon.jsii.Kernel.get(this, "templateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tier = software.amazon.jsii.Kernel.get(this, "tier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.versionLabel = software.amazon.jsii.Kernel.get(this, "versionLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.waitForReadyTimeout = software.amazon.jsii.Kernel.get(this, "waitForReadyTimeout", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.application = java.util.Objects.requireNonNull(builder.application, "application is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.cnamePrefix = builder.cnamePrefix;
            this.description = builder.description;
            this.id = builder.id;
            this.platformArn = builder.platformArn;
            this.pollInterval = builder.pollInterval;
            this.setting = builder.setting;
            this.solutionStackName = builder.solutionStackName;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.templateName = builder.templateName;
            this.tier = builder.tier;
            this.versionLabel = builder.versionLabel;
            this.waitForReadyTimeout = builder.waitForReadyTimeout;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getApplication() {
            return this.application;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getCnamePrefix() {
            return this.cnamePrefix;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getPlatformArn() {
            return this.platformArn;
        }

        @Override
        public final java.lang.String getPollInterval() {
            return this.pollInterval;
        }

        @Override
        public final java.lang.Object getSetting() {
            return this.setting;
        }

        @Override
        public final java.lang.String getSolutionStackName() {
            return this.solutionStackName;
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
        public final java.lang.String getTemplateName() {
            return this.templateName;
        }

        @Override
        public final java.lang.String getTier() {
            return this.tier;
        }

        @Override
        public final java.lang.String getVersionLabel() {
            return this.versionLabel;
        }

        @Override
        public final java.lang.String getWaitForReadyTimeout() {
            return this.waitForReadyTimeout;
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

            data.set("application", om.valueToTree(this.getApplication()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getCnamePrefix() != null) {
                data.set("cnamePrefix", om.valueToTree(this.getCnamePrefix()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPlatformArn() != null) {
                data.set("platformArn", om.valueToTree(this.getPlatformArn()));
            }
            if (this.getPollInterval() != null) {
                data.set("pollInterval", om.valueToTree(this.getPollInterval()));
            }
            if (this.getSetting() != null) {
                data.set("setting", om.valueToTree(this.getSetting()));
            }
            if (this.getSolutionStackName() != null) {
                data.set("solutionStackName", om.valueToTree(this.getSolutionStackName()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTemplateName() != null) {
                data.set("templateName", om.valueToTree(this.getTemplateName()));
            }
            if (this.getTier() != null) {
                data.set("tier", om.valueToTree(this.getTier()));
            }
            if (this.getVersionLabel() != null) {
                data.set("versionLabel", om.valueToTree(this.getVersionLabel()));
            }
            if (this.getWaitForReadyTimeout() != null) {
                data.set("waitForReadyTimeout", om.valueToTree(this.getWaitForReadyTimeout()));
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
            struct.set("fqn", om.valueToTree("aws.elasticBeanstalkEnvironment.ElasticBeanstalkEnvironmentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticBeanstalkEnvironmentConfig.Jsii$Proxy that = (ElasticBeanstalkEnvironmentConfig.Jsii$Proxy) o;

            if (!application.equals(that.application)) return false;
            if (!name.equals(that.name)) return false;
            if (this.cnamePrefix != null ? !this.cnamePrefix.equals(that.cnamePrefix) : that.cnamePrefix != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.platformArn != null ? !this.platformArn.equals(that.platformArn) : that.platformArn != null) return false;
            if (this.pollInterval != null ? !this.pollInterval.equals(that.pollInterval) : that.pollInterval != null) return false;
            if (this.setting != null ? !this.setting.equals(that.setting) : that.setting != null) return false;
            if (this.solutionStackName != null ? !this.solutionStackName.equals(that.solutionStackName) : that.solutionStackName != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.templateName != null ? !this.templateName.equals(that.templateName) : that.templateName != null) return false;
            if (this.tier != null ? !this.tier.equals(that.tier) : that.tier != null) return false;
            if (this.versionLabel != null ? !this.versionLabel.equals(that.versionLabel) : that.versionLabel != null) return false;
            if (this.waitForReadyTimeout != null ? !this.waitForReadyTimeout.equals(that.waitForReadyTimeout) : that.waitForReadyTimeout != null) return false;
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
            int result = this.application.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.cnamePrefix != null ? this.cnamePrefix.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.platformArn != null ? this.platformArn.hashCode() : 0);
            result = 31 * result + (this.pollInterval != null ? this.pollInterval.hashCode() : 0);
            result = 31 * result + (this.setting != null ? this.setting.hashCode() : 0);
            result = 31 * result + (this.solutionStackName != null ? this.solutionStackName.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.templateName != null ? this.templateName.hashCode() : 0);
            result = 31 * result + (this.tier != null ? this.tier.hashCode() : 0);
            result = 31 * result + (this.versionLabel != null ? this.versionLabel.hashCode() : 0);
            result = 31 * result + (this.waitForReadyTimeout != null ? this.waitForReadyTimeout.hashCode() : 0);
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
