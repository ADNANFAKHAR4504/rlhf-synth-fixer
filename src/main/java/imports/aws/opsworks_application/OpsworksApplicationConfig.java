package imports.aws.opsworks_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.000Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksApplication.OpsworksApplicationConfig")
@software.amazon.jsii.Jsii.Proxy(OpsworksApplicationConfig.Jsii$Proxy.class)
public interface OpsworksApplicationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#name OpsworksApplication#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#stack_id OpsworksApplication#stack_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStackId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#type OpsworksApplication#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * app_source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#app_source OpsworksApplication#app_source}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAppSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#auto_bundle_on_deploy OpsworksApplication#auto_bundle_on_deploy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAutoBundleOnDeploy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#aws_flow_ruby_settings OpsworksApplication#aws_flow_ruby_settings}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAwsFlowRubySettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#data_source_arn OpsworksApplication#data_source_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataSourceArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#data_source_database_name OpsworksApplication#data_source_database_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataSourceDatabaseName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#data_source_type OpsworksApplication#data_source_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataSourceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#description OpsworksApplication#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#document_root OpsworksApplication#document_root}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDocumentRoot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#domains OpsworksApplication#domains}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDomains() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#enable_ssl OpsworksApplication#enable_ssl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableSsl() {
        return null;
    }

    /**
     * environment block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#environment OpsworksApplication#environment}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnvironment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#id OpsworksApplication#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#rails_env OpsworksApplication#rails_env}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRailsEnv() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#short_name OpsworksApplication#short_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getShortName() {
        return null;
    }

    /**
     * ssl_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#ssl_configuration OpsworksApplication#ssl_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSslConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpsworksApplicationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpsworksApplicationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpsworksApplicationConfig> {
        java.lang.String name;
        java.lang.String stackId;
        java.lang.String type;
        java.lang.Object appSource;
        java.lang.String autoBundleOnDeploy;
        java.lang.String awsFlowRubySettings;
        java.lang.String dataSourceArn;
        java.lang.String dataSourceDatabaseName;
        java.lang.String dataSourceType;
        java.lang.String description;
        java.lang.String documentRoot;
        java.util.List<java.lang.String> domains;
        java.lang.Object enableSsl;
        java.lang.Object environment;
        java.lang.String id;
        java.lang.String railsEnv;
        java.lang.String shortName;
        java.lang.Object sslConfiguration;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#name OpsworksApplication#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getStackId}
         * @param stackId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#stack_id OpsworksApplication#stack_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder stackId(java.lang.String stackId) {
            this.stackId = stackId;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#type OpsworksApplication#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getAppSource}
         * @param appSource app_source block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#app_source OpsworksApplication#app_source}
         * @return {@code this}
         */
        public Builder appSource(com.hashicorp.cdktf.IResolvable appSource) {
            this.appSource = appSource;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getAppSource}
         * @param appSource app_source block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#app_source OpsworksApplication#app_source}
         * @return {@code this}
         */
        public Builder appSource(java.util.List<? extends imports.aws.opsworks_application.OpsworksApplicationAppSource> appSource) {
            this.appSource = appSource;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getAutoBundleOnDeploy}
         * @param autoBundleOnDeploy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#auto_bundle_on_deploy OpsworksApplication#auto_bundle_on_deploy}.
         * @return {@code this}
         */
        public Builder autoBundleOnDeploy(java.lang.String autoBundleOnDeploy) {
            this.autoBundleOnDeploy = autoBundleOnDeploy;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getAwsFlowRubySettings}
         * @param awsFlowRubySettings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#aws_flow_ruby_settings OpsworksApplication#aws_flow_ruby_settings}.
         * @return {@code this}
         */
        public Builder awsFlowRubySettings(java.lang.String awsFlowRubySettings) {
            this.awsFlowRubySettings = awsFlowRubySettings;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getDataSourceArn}
         * @param dataSourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#data_source_arn OpsworksApplication#data_source_arn}.
         * @return {@code this}
         */
        public Builder dataSourceArn(java.lang.String dataSourceArn) {
            this.dataSourceArn = dataSourceArn;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getDataSourceDatabaseName}
         * @param dataSourceDatabaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#data_source_database_name OpsworksApplication#data_source_database_name}.
         * @return {@code this}
         */
        public Builder dataSourceDatabaseName(java.lang.String dataSourceDatabaseName) {
            this.dataSourceDatabaseName = dataSourceDatabaseName;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getDataSourceType}
         * @param dataSourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#data_source_type OpsworksApplication#data_source_type}.
         * @return {@code this}
         */
        public Builder dataSourceType(java.lang.String dataSourceType) {
            this.dataSourceType = dataSourceType;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#description OpsworksApplication#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getDocumentRoot}
         * @param documentRoot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#document_root OpsworksApplication#document_root}.
         * @return {@code this}
         */
        public Builder documentRoot(java.lang.String documentRoot) {
            this.documentRoot = documentRoot;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getDomains}
         * @param domains Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#domains OpsworksApplication#domains}.
         * @return {@code this}
         */
        public Builder domains(java.util.List<java.lang.String> domains) {
            this.domains = domains;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getEnableSsl}
         * @param enableSsl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#enable_ssl OpsworksApplication#enable_ssl}.
         * @return {@code this}
         */
        public Builder enableSsl(java.lang.Boolean enableSsl) {
            this.enableSsl = enableSsl;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getEnableSsl}
         * @param enableSsl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#enable_ssl OpsworksApplication#enable_ssl}.
         * @return {@code this}
         */
        public Builder enableSsl(com.hashicorp.cdktf.IResolvable enableSsl) {
            this.enableSsl = enableSsl;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getEnvironment}
         * @param environment environment block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#environment OpsworksApplication#environment}
         * @return {@code this}
         */
        public Builder environment(com.hashicorp.cdktf.IResolvable environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getEnvironment}
         * @param environment environment block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#environment OpsworksApplication#environment}
         * @return {@code this}
         */
        public Builder environment(java.util.List<? extends imports.aws.opsworks_application.OpsworksApplicationEnvironment> environment) {
            this.environment = environment;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#id OpsworksApplication#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getRailsEnv}
         * @param railsEnv Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#rails_env OpsworksApplication#rails_env}.
         * @return {@code this}
         */
        public Builder railsEnv(java.lang.String railsEnv) {
            this.railsEnv = railsEnv;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getShortName}
         * @param shortName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#short_name OpsworksApplication#short_name}.
         * @return {@code this}
         */
        public Builder shortName(java.lang.String shortName) {
            this.shortName = shortName;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getSslConfiguration}
         * @param sslConfiguration ssl_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#ssl_configuration OpsworksApplication#ssl_configuration}
         * @return {@code this}
         */
        public Builder sslConfiguration(com.hashicorp.cdktf.IResolvable sslConfiguration) {
            this.sslConfiguration = sslConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getSslConfiguration}
         * @param sslConfiguration ssl_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#ssl_configuration OpsworksApplication#ssl_configuration}
         * @return {@code this}
         */
        public Builder sslConfiguration(java.util.List<? extends imports.aws.opsworks_application.OpsworksApplicationSslConfiguration> sslConfiguration) {
            this.sslConfiguration = sslConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getDependsOn}
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
         * Sets the value of {@link OpsworksApplicationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksApplicationConfig#getProvisioners}
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
         * @return a new instance of {@link OpsworksApplicationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpsworksApplicationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpsworksApplicationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpsworksApplicationConfig {
        private final java.lang.String name;
        private final java.lang.String stackId;
        private final java.lang.String type;
        private final java.lang.Object appSource;
        private final java.lang.String autoBundleOnDeploy;
        private final java.lang.String awsFlowRubySettings;
        private final java.lang.String dataSourceArn;
        private final java.lang.String dataSourceDatabaseName;
        private final java.lang.String dataSourceType;
        private final java.lang.String description;
        private final java.lang.String documentRoot;
        private final java.util.List<java.lang.String> domains;
        private final java.lang.Object enableSsl;
        private final java.lang.Object environment;
        private final java.lang.String id;
        private final java.lang.String railsEnv;
        private final java.lang.String shortName;
        private final java.lang.Object sslConfiguration;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stackId = software.amazon.jsii.Kernel.get(this, "stackId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.appSource = software.amazon.jsii.Kernel.get(this, "appSource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.autoBundleOnDeploy = software.amazon.jsii.Kernel.get(this, "autoBundleOnDeploy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.awsFlowRubySettings = software.amazon.jsii.Kernel.get(this, "awsFlowRubySettings", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataSourceArn = software.amazon.jsii.Kernel.get(this, "dataSourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataSourceDatabaseName = software.amazon.jsii.Kernel.get(this, "dataSourceDatabaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataSourceType = software.amazon.jsii.Kernel.get(this, "dataSourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.documentRoot = software.amazon.jsii.Kernel.get(this, "documentRoot", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domains = software.amazon.jsii.Kernel.get(this, "domains", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.enableSsl = software.amazon.jsii.Kernel.get(this, "enableSsl", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.environment = software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.railsEnv = software.amazon.jsii.Kernel.get(this, "railsEnv", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.shortName = software.amazon.jsii.Kernel.get(this, "shortName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sslConfiguration = software.amazon.jsii.Kernel.get(this, "sslConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.stackId = java.util.Objects.requireNonNull(builder.stackId, "stackId is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.appSource = builder.appSource;
            this.autoBundleOnDeploy = builder.autoBundleOnDeploy;
            this.awsFlowRubySettings = builder.awsFlowRubySettings;
            this.dataSourceArn = builder.dataSourceArn;
            this.dataSourceDatabaseName = builder.dataSourceDatabaseName;
            this.dataSourceType = builder.dataSourceType;
            this.description = builder.description;
            this.documentRoot = builder.documentRoot;
            this.domains = builder.domains;
            this.enableSsl = builder.enableSsl;
            this.environment = builder.environment;
            this.id = builder.id;
            this.railsEnv = builder.railsEnv;
            this.shortName = builder.shortName;
            this.sslConfiguration = builder.sslConfiguration;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getStackId() {
            return this.stackId;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Object getAppSource() {
            return this.appSource;
        }

        @Override
        public final java.lang.String getAutoBundleOnDeploy() {
            return this.autoBundleOnDeploy;
        }

        @Override
        public final java.lang.String getAwsFlowRubySettings() {
            return this.awsFlowRubySettings;
        }

        @Override
        public final java.lang.String getDataSourceArn() {
            return this.dataSourceArn;
        }

        @Override
        public final java.lang.String getDataSourceDatabaseName() {
            return this.dataSourceDatabaseName;
        }

        @Override
        public final java.lang.String getDataSourceType() {
            return this.dataSourceType;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getDocumentRoot() {
            return this.documentRoot;
        }

        @Override
        public final java.util.List<java.lang.String> getDomains() {
            return this.domains;
        }

        @Override
        public final java.lang.Object getEnableSsl() {
            return this.enableSsl;
        }

        @Override
        public final java.lang.Object getEnvironment() {
            return this.environment;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getRailsEnv() {
            return this.railsEnv;
        }

        @Override
        public final java.lang.String getShortName() {
            return this.shortName;
        }

        @Override
        public final java.lang.Object getSslConfiguration() {
            return this.sslConfiguration;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("stackId", om.valueToTree(this.getStackId()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getAppSource() != null) {
                data.set("appSource", om.valueToTree(this.getAppSource()));
            }
            if (this.getAutoBundleOnDeploy() != null) {
                data.set("autoBundleOnDeploy", om.valueToTree(this.getAutoBundleOnDeploy()));
            }
            if (this.getAwsFlowRubySettings() != null) {
                data.set("awsFlowRubySettings", om.valueToTree(this.getAwsFlowRubySettings()));
            }
            if (this.getDataSourceArn() != null) {
                data.set("dataSourceArn", om.valueToTree(this.getDataSourceArn()));
            }
            if (this.getDataSourceDatabaseName() != null) {
                data.set("dataSourceDatabaseName", om.valueToTree(this.getDataSourceDatabaseName()));
            }
            if (this.getDataSourceType() != null) {
                data.set("dataSourceType", om.valueToTree(this.getDataSourceType()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDocumentRoot() != null) {
                data.set("documentRoot", om.valueToTree(this.getDocumentRoot()));
            }
            if (this.getDomains() != null) {
                data.set("domains", om.valueToTree(this.getDomains()));
            }
            if (this.getEnableSsl() != null) {
                data.set("enableSsl", om.valueToTree(this.getEnableSsl()));
            }
            if (this.getEnvironment() != null) {
                data.set("environment", om.valueToTree(this.getEnvironment()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getRailsEnv() != null) {
                data.set("railsEnv", om.valueToTree(this.getRailsEnv()));
            }
            if (this.getShortName() != null) {
                data.set("shortName", om.valueToTree(this.getShortName()));
            }
            if (this.getSslConfiguration() != null) {
                data.set("sslConfiguration", om.valueToTree(this.getSslConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.opsworksApplication.OpsworksApplicationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpsworksApplicationConfig.Jsii$Proxy that = (OpsworksApplicationConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!stackId.equals(that.stackId)) return false;
            if (!type.equals(that.type)) return false;
            if (this.appSource != null ? !this.appSource.equals(that.appSource) : that.appSource != null) return false;
            if (this.autoBundleOnDeploy != null ? !this.autoBundleOnDeploy.equals(that.autoBundleOnDeploy) : that.autoBundleOnDeploy != null) return false;
            if (this.awsFlowRubySettings != null ? !this.awsFlowRubySettings.equals(that.awsFlowRubySettings) : that.awsFlowRubySettings != null) return false;
            if (this.dataSourceArn != null ? !this.dataSourceArn.equals(that.dataSourceArn) : that.dataSourceArn != null) return false;
            if (this.dataSourceDatabaseName != null ? !this.dataSourceDatabaseName.equals(that.dataSourceDatabaseName) : that.dataSourceDatabaseName != null) return false;
            if (this.dataSourceType != null ? !this.dataSourceType.equals(that.dataSourceType) : that.dataSourceType != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.documentRoot != null ? !this.documentRoot.equals(that.documentRoot) : that.documentRoot != null) return false;
            if (this.domains != null ? !this.domains.equals(that.domains) : that.domains != null) return false;
            if (this.enableSsl != null ? !this.enableSsl.equals(that.enableSsl) : that.enableSsl != null) return false;
            if (this.environment != null ? !this.environment.equals(that.environment) : that.environment != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.railsEnv != null ? !this.railsEnv.equals(that.railsEnv) : that.railsEnv != null) return false;
            if (this.shortName != null ? !this.shortName.equals(that.shortName) : that.shortName != null) return false;
            if (this.sslConfiguration != null ? !this.sslConfiguration.equals(that.sslConfiguration) : that.sslConfiguration != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.stackId.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.appSource != null ? this.appSource.hashCode() : 0);
            result = 31 * result + (this.autoBundleOnDeploy != null ? this.autoBundleOnDeploy.hashCode() : 0);
            result = 31 * result + (this.awsFlowRubySettings != null ? this.awsFlowRubySettings.hashCode() : 0);
            result = 31 * result + (this.dataSourceArn != null ? this.dataSourceArn.hashCode() : 0);
            result = 31 * result + (this.dataSourceDatabaseName != null ? this.dataSourceDatabaseName.hashCode() : 0);
            result = 31 * result + (this.dataSourceType != null ? this.dataSourceType.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.documentRoot != null ? this.documentRoot.hashCode() : 0);
            result = 31 * result + (this.domains != null ? this.domains.hashCode() : 0);
            result = 31 * result + (this.enableSsl != null ? this.enableSsl.hashCode() : 0);
            result = 31 * result + (this.environment != null ? this.environment.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.railsEnv != null ? this.railsEnv.hashCode() : 0);
            result = 31 * result + (this.shortName != null ? this.shortName.hashCode() : 0);
            result = 31 * result + (this.sslConfiguration != null ? this.sslConfiguration.hashCode() : 0);
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
