package imports.aws.quicksight_dashboard;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.102Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDashboard.QuicksightDashboardConfig")
@software.amazon.jsii.Jsii.Proxy(QuicksightDashboardConfig.Jsii$Proxy.class)
public interface QuicksightDashboardConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_id QuicksightDashboard#dashboard_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDashboardId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#version_description QuicksightDashboard#version_description}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVersionDescription();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#aws_account_id QuicksightDashboard#aws_account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAwsAccountId() {
        return null;
    }

    /**
     * dashboard_publish_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_publish_options QuicksightDashboard#dashboard_publish_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions getDashboardPublishOptions() {
        return null;
    }

    /**
     * definition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#definition QuicksightDashboard#definition}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDefinition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#id QuicksightDashboard#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#parameters QuicksightDashboard#parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardParameters getParameters() {
        return null;
    }

    /**
     * permissions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#permissions QuicksightDashboard#permissions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPermissions() {
        return null;
    }

    /**
     * source_entity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#source_entity QuicksightDashboard#source_entity}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardSourceEntity getSourceEntity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags QuicksightDashboard#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags_all QuicksightDashboard#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#theme_arn QuicksightDashboard#theme_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getThemeArn() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#timeouts QuicksightDashboard#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDashboardConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDashboardConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDashboardConfig> {
        java.lang.String dashboardId;
        java.lang.String name;
        java.lang.String versionDescription;
        java.lang.String awsAccountId;
        imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions dashboardPublishOptions;
        java.lang.Object definition;
        java.lang.String id;
        imports.aws.quicksight_dashboard.QuicksightDashboardParameters parameters;
        java.lang.Object permissions;
        imports.aws.quicksight_dashboard.QuicksightDashboardSourceEntity sourceEntity;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String themeArn;
        imports.aws.quicksight_dashboard.QuicksightDashboardTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getDashboardId}
         * @param dashboardId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_id QuicksightDashboard#dashboard_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder dashboardId(java.lang.String dashboardId) {
            this.dashboardId = dashboardId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#name QuicksightDashboard#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getVersionDescription}
         * @param versionDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#version_description QuicksightDashboard#version_description}. This parameter is required.
         * @return {@code this}
         */
        public Builder versionDescription(java.lang.String versionDescription) {
            this.versionDescription = versionDescription;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getAwsAccountId}
         * @param awsAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#aws_account_id QuicksightDashboard#aws_account_id}.
         * @return {@code this}
         */
        public Builder awsAccountId(java.lang.String awsAccountId) {
            this.awsAccountId = awsAccountId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getDashboardPublishOptions}
         * @param dashboardPublishOptions dashboard_publish_options block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#dashboard_publish_options QuicksightDashboard#dashboard_publish_options}
         * @return {@code this}
         */
        public Builder dashboardPublishOptions(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions dashboardPublishOptions) {
            this.dashboardPublishOptions = dashboardPublishOptions;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getDefinition}
         * @param definition definition block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#definition QuicksightDashboard#definition}
         * @return {@code this}
         */
        public Builder definition(java.lang.Object definition) {
            this.definition = definition;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#id QuicksightDashboard#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getParameters}
         * @param parameters parameters block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#parameters QuicksightDashboard#parameters}
         * @return {@code this}
         */
        public Builder parameters(imports.aws.quicksight_dashboard.QuicksightDashboardParameters parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getPermissions}
         * @param permissions permissions block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#permissions QuicksightDashboard#permissions}
         * @return {@code this}
         */
        public Builder permissions(com.hashicorp.cdktf.IResolvable permissions) {
            this.permissions = permissions;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getPermissions}
         * @param permissions permissions block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#permissions QuicksightDashboard#permissions}
         * @return {@code this}
         */
        public Builder permissions(java.util.List<? extends imports.aws.quicksight_dashboard.QuicksightDashboardPermissions> permissions) {
            this.permissions = permissions;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getSourceEntity}
         * @param sourceEntity source_entity block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#source_entity QuicksightDashboard#source_entity}
         * @return {@code this}
         */
        public Builder sourceEntity(imports.aws.quicksight_dashboard.QuicksightDashboardSourceEntity sourceEntity) {
            this.sourceEntity = sourceEntity;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags QuicksightDashboard#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#tags_all QuicksightDashboard#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getThemeArn}
         * @param themeArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#theme_arn QuicksightDashboard#theme_arn}.
         * @return {@code this}
         */
        public Builder themeArn(java.lang.String themeArn) {
            this.themeArn = themeArn;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#timeouts QuicksightDashboard#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.quicksight_dashboard.QuicksightDashboardTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getDependsOn}
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
         * Sets the value of {@link QuicksightDashboardConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardConfig#getProvisioners}
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
         * @return a new instance of {@link QuicksightDashboardConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDashboardConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDashboardConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDashboardConfig {
        private final java.lang.String dashboardId;
        private final java.lang.String name;
        private final java.lang.String versionDescription;
        private final java.lang.String awsAccountId;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions dashboardPublishOptions;
        private final java.lang.Object definition;
        private final java.lang.String id;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardParameters parameters;
        private final java.lang.Object permissions;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardSourceEntity sourceEntity;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String themeArn;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardTimeouts timeouts;
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
            this.dashboardId = software.amazon.jsii.Kernel.get(this, "dashboardId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.versionDescription = software.amazon.jsii.Kernel.get(this, "versionDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.awsAccountId = software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dashboardPublishOptions = software.amazon.jsii.Kernel.get(this, "dashboardPublishOptions", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions.class));
            this.definition = software.amazon.jsii.Kernel.get(this, "definition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardParameters.class));
            this.permissions = software.amazon.jsii.Kernel.get(this, "permissions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceEntity = software.amazon.jsii.Kernel.get(this, "sourceEntity", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardSourceEntity.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.themeArn = software.amazon.jsii.Kernel.get(this, "themeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardTimeouts.class));
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
            this.dashboardId = java.util.Objects.requireNonNull(builder.dashboardId, "dashboardId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.versionDescription = java.util.Objects.requireNonNull(builder.versionDescription, "versionDescription is required");
            this.awsAccountId = builder.awsAccountId;
            this.dashboardPublishOptions = builder.dashboardPublishOptions;
            this.definition = builder.definition;
            this.id = builder.id;
            this.parameters = builder.parameters;
            this.permissions = builder.permissions;
            this.sourceEntity = builder.sourceEntity;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.themeArn = builder.themeArn;
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
        public final java.lang.String getDashboardId() {
            return this.dashboardId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getVersionDescription() {
            return this.versionDescription;
        }

        @Override
        public final java.lang.String getAwsAccountId() {
            return this.awsAccountId;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions getDashboardPublishOptions() {
            return this.dashboardPublishOptions;
        }

        @Override
        public final java.lang.Object getDefinition() {
            return this.definition;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardParameters getParameters() {
            return this.parameters;
        }

        @Override
        public final java.lang.Object getPermissions() {
            return this.permissions;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardSourceEntity getSourceEntity() {
            return this.sourceEntity;
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
        public final java.lang.String getThemeArn() {
            return this.themeArn;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardTimeouts getTimeouts() {
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

            data.set("dashboardId", om.valueToTree(this.getDashboardId()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("versionDescription", om.valueToTree(this.getVersionDescription()));
            if (this.getAwsAccountId() != null) {
                data.set("awsAccountId", om.valueToTree(this.getAwsAccountId()));
            }
            if (this.getDashboardPublishOptions() != null) {
                data.set("dashboardPublishOptions", om.valueToTree(this.getDashboardPublishOptions()));
            }
            if (this.getDefinition() != null) {
                data.set("definition", om.valueToTree(this.getDefinition()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getPermissions() != null) {
                data.set("permissions", om.valueToTree(this.getPermissions()));
            }
            if (this.getSourceEntity() != null) {
                data.set("sourceEntity", om.valueToTree(this.getSourceEntity()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getThemeArn() != null) {
                data.set("themeArn", om.valueToTree(this.getThemeArn()));
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
            struct.set("fqn", om.valueToTree("aws.quicksightDashboard.QuicksightDashboardConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDashboardConfig.Jsii$Proxy that = (QuicksightDashboardConfig.Jsii$Proxy) o;

            if (!dashboardId.equals(that.dashboardId)) return false;
            if (!name.equals(that.name)) return false;
            if (!versionDescription.equals(that.versionDescription)) return false;
            if (this.awsAccountId != null ? !this.awsAccountId.equals(that.awsAccountId) : that.awsAccountId != null) return false;
            if (this.dashboardPublishOptions != null ? !this.dashboardPublishOptions.equals(that.dashboardPublishOptions) : that.dashboardPublishOptions != null) return false;
            if (this.definition != null ? !this.definition.equals(that.definition) : that.definition != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            if (this.permissions != null ? !this.permissions.equals(that.permissions) : that.permissions != null) return false;
            if (this.sourceEntity != null ? !this.sourceEntity.equals(that.sourceEntity) : that.sourceEntity != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.themeArn != null ? !this.themeArn.equals(that.themeArn) : that.themeArn != null) return false;
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
            int result = this.dashboardId.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.versionDescription.hashCode());
            result = 31 * result + (this.awsAccountId != null ? this.awsAccountId.hashCode() : 0);
            result = 31 * result + (this.dashboardPublishOptions != null ? this.dashboardPublishOptions.hashCode() : 0);
            result = 31 * result + (this.definition != null ? this.definition.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.permissions != null ? this.permissions.hashCode() : 0);
            result = 31 * result + (this.sourceEntity != null ? this.sourceEntity.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.themeArn != null ? this.themeArn.hashCode() : 0);
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
