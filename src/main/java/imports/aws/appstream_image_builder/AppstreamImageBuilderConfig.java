package imports.aws.appstream_image_builder;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.060Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamImageBuilder.AppstreamImageBuilderConfig")
@software.amazon.jsii.Jsii.Proxy(AppstreamImageBuilderConfig.Jsii$Proxy.class)
public interface AppstreamImageBuilderConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#instance_type AppstreamImageBuilder#instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#name AppstreamImageBuilder#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * access_endpoint block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#access_endpoint AppstreamImageBuilder#access_endpoint}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAccessEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#appstream_agent_version AppstreamImageBuilder#appstream_agent_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAppstreamAgentVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#description AppstreamImageBuilder#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#display_name AppstreamImageBuilder#display_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDisplayName() {
        return null;
    }

    /**
     * domain_join_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#domain_join_info AppstreamImageBuilder#domain_join_info}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appstream_image_builder.AppstreamImageBuilderDomainJoinInfo getDomainJoinInfo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#enable_default_internet_access AppstreamImageBuilder#enable_default_internet_access}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableDefaultInternetAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#iam_role_arn AppstreamImageBuilder#iam_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#id AppstreamImageBuilder#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#image_arn AppstreamImageBuilder#image_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#image_name AppstreamImageBuilder#image_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#tags AppstreamImageBuilder#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#tags_all AppstreamImageBuilder#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * vpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#vpc_config AppstreamImageBuilder#vpc_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appstream_image_builder.AppstreamImageBuilderVpcConfig getVpcConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppstreamImageBuilderConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppstreamImageBuilderConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppstreamImageBuilderConfig> {
        java.lang.String instanceType;
        java.lang.String name;
        java.lang.Object accessEndpoint;
        java.lang.String appstreamAgentVersion;
        java.lang.String description;
        java.lang.String displayName;
        imports.aws.appstream_image_builder.AppstreamImageBuilderDomainJoinInfo domainJoinInfo;
        java.lang.Object enableDefaultInternetAccess;
        java.lang.String iamRoleArn;
        java.lang.String id;
        java.lang.String imageArn;
        java.lang.String imageName;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.appstream_image_builder.AppstreamImageBuilderVpcConfig vpcConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#instance_type AppstreamImageBuilder#instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#name AppstreamImageBuilder#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getAccessEndpoint}
         * @param accessEndpoint access_endpoint block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#access_endpoint AppstreamImageBuilder#access_endpoint}
         * @return {@code this}
         */
        public Builder accessEndpoint(com.hashicorp.cdktf.IResolvable accessEndpoint) {
            this.accessEndpoint = accessEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getAccessEndpoint}
         * @param accessEndpoint access_endpoint block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#access_endpoint AppstreamImageBuilder#access_endpoint}
         * @return {@code this}
         */
        public Builder accessEndpoint(java.util.List<? extends imports.aws.appstream_image_builder.AppstreamImageBuilderAccessEndpoint> accessEndpoint) {
            this.accessEndpoint = accessEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getAppstreamAgentVersion}
         * @param appstreamAgentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#appstream_agent_version AppstreamImageBuilder#appstream_agent_version}.
         * @return {@code this}
         */
        public Builder appstreamAgentVersion(java.lang.String appstreamAgentVersion) {
            this.appstreamAgentVersion = appstreamAgentVersion;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#description AppstreamImageBuilder#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getDisplayName}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#display_name AppstreamImageBuilder#display_name}.
         * @return {@code this}
         */
        public Builder displayName(java.lang.String displayName) {
            this.displayName = displayName;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getDomainJoinInfo}
         * @param domainJoinInfo domain_join_info block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#domain_join_info AppstreamImageBuilder#domain_join_info}
         * @return {@code this}
         */
        public Builder domainJoinInfo(imports.aws.appstream_image_builder.AppstreamImageBuilderDomainJoinInfo domainJoinInfo) {
            this.domainJoinInfo = domainJoinInfo;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getEnableDefaultInternetAccess}
         * @param enableDefaultInternetAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#enable_default_internet_access AppstreamImageBuilder#enable_default_internet_access}.
         * @return {@code this}
         */
        public Builder enableDefaultInternetAccess(java.lang.Boolean enableDefaultInternetAccess) {
            this.enableDefaultInternetAccess = enableDefaultInternetAccess;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getEnableDefaultInternetAccess}
         * @param enableDefaultInternetAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#enable_default_internet_access AppstreamImageBuilder#enable_default_internet_access}.
         * @return {@code this}
         */
        public Builder enableDefaultInternetAccess(com.hashicorp.cdktf.IResolvable enableDefaultInternetAccess) {
            this.enableDefaultInternetAccess = enableDefaultInternetAccess;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getIamRoleArn}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#iam_role_arn AppstreamImageBuilder#iam_role_arn}.
         * @return {@code this}
         */
        public Builder iamRoleArn(java.lang.String iamRoleArn) {
            this.iamRoleArn = iamRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#id AppstreamImageBuilder#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getImageArn}
         * @param imageArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#image_arn AppstreamImageBuilder#image_arn}.
         * @return {@code this}
         */
        public Builder imageArn(java.lang.String imageArn) {
            this.imageArn = imageArn;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getImageName}
         * @param imageName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#image_name AppstreamImageBuilder#image_name}.
         * @return {@code this}
         */
        public Builder imageName(java.lang.String imageName) {
            this.imageName = imageName;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#tags AppstreamImageBuilder#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#tags_all AppstreamImageBuilder#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getVpcConfig}
         * @param vpcConfig vpc_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#vpc_config AppstreamImageBuilder#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(imports.aws.appstream_image_builder.AppstreamImageBuilderVpcConfig vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getDependsOn}
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
         * Sets the value of {@link AppstreamImageBuilderConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderConfig#getProvisioners}
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
         * @return a new instance of {@link AppstreamImageBuilderConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppstreamImageBuilderConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppstreamImageBuilderConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppstreamImageBuilderConfig {
        private final java.lang.String instanceType;
        private final java.lang.String name;
        private final java.lang.Object accessEndpoint;
        private final java.lang.String appstreamAgentVersion;
        private final java.lang.String description;
        private final java.lang.String displayName;
        private final imports.aws.appstream_image_builder.AppstreamImageBuilderDomainJoinInfo domainJoinInfo;
        private final java.lang.Object enableDefaultInternetAccess;
        private final java.lang.String iamRoleArn;
        private final java.lang.String id;
        private final java.lang.String imageArn;
        private final java.lang.String imageName;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.appstream_image_builder.AppstreamImageBuilderVpcConfig vpcConfig;
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
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessEndpoint = software.amazon.jsii.Kernel.get(this, "accessEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.appstreamAgentVersion = software.amazon.jsii.Kernel.get(this, "appstreamAgentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.displayName = software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainJoinInfo = software.amazon.jsii.Kernel.get(this, "domainJoinInfo", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_image_builder.AppstreamImageBuilderDomainJoinInfo.class));
            this.enableDefaultInternetAccess = software.amazon.jsii.Kernel.get(this, "enableDefaultInternetAccess", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.iamRoleArn = software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageArn = software.amazon.jsii.Kernel.get(this, "imageArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageName = software.amazon.jsii.Kernel.get(this, "imageName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcConfig = software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_image_builder.AppstreamImageBuilderVpcConfig.class));
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
            this.instanceType = java.util.Objects.requireNonNull(builder.instanceType, "instanceType is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.accessEndpoint = builder.accessEndpoint;
            this.appstreamAgentVersion = builder.appstreamAgentVersion;
            this.description = builder.description;
            this.displayName = builder.displayName;
            this.domainJoinInfo = builder.domainJoinInfo;
            this.enableDefaultInternetAccess = builder.enableDefaultInternetAccess;
            this.iamRoleArn = builder.iamRoleArn;
            this.id = builder.id;
            this.imageArn = builder.imageArn;
            this.imageName = builder.imageName;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.vpcConfig = builder.vpcConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getAccessEndpoint() {
            return this.accessEndpoint;
        }

        @Override
        public final java.lang.String getAppstreamAgentVersion() {
            return this.appstreamAgentVersion;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getDisplayName() {
            return this.displayName;
        }

        @Override
        public final imports.aws.appstream_image_builder.AppstreamImageBuilderDomainJoinInfo getDomainJoinInfo() {
            return this.domainJoinInfo;
        }

        @Override
        public final java.lang.Object getEnableDefaultInternetAccess() {
            return this.enableDefaultInternetAccess;
        }

        @Override
        public final java.lang.String getIamRoleArn() {
            return this.iamRoleArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getImageArn() {
            return this.imageArn;
        }

        @Override
        public final java.lang.String getImageName() {
            return this.imageName;
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
        public final imports.aws.appstream_image_builder.AppstreamImageBuilderVpcConfig getVpcConfig() {
            return this.vpcConfig;
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

            data.set("instanceType", om.valueToTree(this.getInstanceType()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getAccessEndpoint() != null) {
                data.set("accessEndpoint", om.valueToTree(this.getAccessEndpoint()));
            }
            if (this.getAppstreamAgentVersion() != null) {
                data.set("appstreamAgentVersion", om.valueToTree(this.getAppstreamAgentVersion()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDisplayName() != null) {
                data.set("displayName", om.valueToTree(this.getDisplayName()));
            }
            if (this.getDomainJoinInfo() != null) {
                data.set("domainJoinInfo", om.valueToTree(this.getDomainJoinInfo()));
            }
            if (this.getEnableDefaultInternetAccess() != null) {
                data.set("enableDefaultInternetAccess", om.valueToTree(this.getEnableDefaultInternetAccess()));
            }
            if (this.getIamRoleArn() != null) {
                data.set("iamRoleArn", om.valueToTree(this.getIamRoleArn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getImageArn() != null) {
                data.set("imageArn", om.valueToTree(this.getImageArn()));
            }
            if (this.getImageName() != null) {
                data.set("imageName", om.valueToTree(this.getImageName()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getVpcConfig() != null) {
                data.set("vpcConfig", om.valueToTree(this.getVpcConfig()));
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
            struct.set("fqn", om.valueToTree("aws.appstreamImageBuilder.AppstreamImageBuilderConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppstreamImageBuilderConfig.Jsii$Proxy that = (AppstreamImageBuilderConfig.Jsii$Proxy) o;

            if (!instanceType.equals(that.instanceType)) return false;
            if (!name.equals(that.name)) return false;
            if (this.accessEndpoint != null ? !this.accessEndpoint.equals(that.accessEndpoint) : that.accessEndpoint != null) return false;
            if (this.appstreamAgentVersion != null ? !this.appstreamAgentVersion.equals(that.appstreamAgentVersion) : that.appstreamAgentVersion != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.displayName != null ? !this.displayName.equals(that.displayName) : that.displayName != null) return false;
            if (this.domainJoinInfo != null ? !this.domainJoinInfo.equals(that.domainJoinInfo) : that.domainJoinInfo != null) return false;
            if (this.enableDefaultInternetAccess != null ? !this.enableDefaultInternetAccess.equals(that.enableDefaultInternetAccess) : that.enableDefaultInternetAccess != null) return false;
            if (this.iamRoleArn != null ? !this.iamRoleArn.equals(that.iamRoleArn) : that.iamRoleArn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.imageArn != null ? !this.imageArn.equals(that.imageArn) : that.imageArn != null) return false;
            if (this.imageName != null ? !this.imageName.equals(that.imageName) : that.imageName != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.vpcConfig != null ? !this.vpcConfig.equals(that.vpcConfig) : that.vpcConfig != null) return false;
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
            int result = this.instanceType.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.accessEndpoint != null ? this.accessEndpoint.hashCode() : 0);
            result = 31 * result + (this.appstreamAgentVersion != null ? this.appstreamAgentVersion.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.displayName != null ? this.displayName.hashCode() : 0);
            result = 31 * result + (this.domainJoinInfo != null ? this.domainJoinInfo.hashCode() : 0);
            result = 31 * result + (this.enableDefaultInternetAccess != null ? this.enableDefaultInternetAccess.hashCode() : 0);
            result = 31 * result + (this.iamRoleArn != null ? this.iamRoleArn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.imageArn != null ? this.imageArn.hashCode() : 0);
            result = 31 * result + (this.imageName != null ? this.imageName.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.vpcConfig != null ? this.vpcConfig.hashCode() : 0);
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
