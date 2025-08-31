package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.304Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainConfig.Jsii$Proxy.class)
public interface SagemakerDomainConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#auth_mode SagemakerDomain#auth_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthMode();

    /**
     * default_user_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_user_settings SagemakerDomain#default_user_settings}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettings getDefaultUserSettings();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#domain_name SagemakerDomain#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#subnet_ids SagemakerDomain#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#vpc_id SagemakerDomain#vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#app_network_access_type SagemakerDomain#app_network_access_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAppNetworkAccessType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#app_security_group_management SagemakerDomain#app_security_group_management}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAppSecurityGroupManagement() {
        return null;
    }

    /**
     * default_space_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_space_settings SagemakerDomain#default_space_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettings getDefaultSpaceSettings() {
        return null;
    }

    /**
     * domain_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#domain_settings SagemakerDomain#domain_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDomainSettings getDomainSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#id SagemakerDomain#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#kms_key_id SagemakerDomain#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * retention_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#retention_policy SagemakerDomain#retention_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainRetentionPolicy getRetentionPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#tag_propagation SagemakerDomain#tag_propagation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTagPropagation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#tags SagemakerDomain#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#tags_all SagemakerDomain#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainConfig> {
        java.lang.String authMode;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettings defaultUserSettings;
        java.lang.String domainName;
        java.util.List<java.lang.String> subnetIds;
        java.lang.String vpcId;
        java.lang.String appNetworkAccessType;
        java.lang.String appSecurityGroupManagement;
        imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettings defaultSpaceSettings;
        imports.aws.sagemaker_domain.SagemakerDomainDomainSettings domainSettings;
        java.lang.String id;
        java.lang.String kmsKeyId;
        imports.aws.sagemaker_domain.SagemakerDomainRetentionPolicy retentionPolicy;
        java.lang.String tagPropagation;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SagemakerDomainConfig#getAuthMode}
         * @param authMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#auth_mode SagemakerDomain#auth_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder authMode(java.lang.String authMode) {
            this.authMode = authMode;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getDefaultUserSettings}
         * @param defaultUserSettings default_user_settings block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_user_settings SagemakerDomain#default_user_settings}
         * @return {@code this}
         */
        public Builder defaultUserSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettings defaultUserSettings) {
            this.defaultUserSettings = defaultUserSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#domain_name SagemakerDomain#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#subnet_ids SagemakerDomain#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#vpc_id SagemakerDomain#vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getAppNetworkAccessType}
         * @param appNetworkAccessType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#app_network_access_type SagemakerDomain#app_network_access_type}.
         * @return {@code this}
         */
        public Builder appNetworkAccessType(java.lang.String appNetworkAccessType) {
            this.appNetworkAccessType = appNetworkAccessType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getAppSecurityGroupManagement}
         * @param appSecurityGroupManagement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#app_security_group_management SagemakerDomain#app_security_group_management}.
         * @return {@code this}
         */
        public Builder appSecurityGroupManagement(java.lang.String appSecurityGroupManagement) {
            this.appSecurityGroupManagement = appSecurityGroupManagement;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getDefaultSpaceSettings}
         * @param defaultSpaceSettings default_space_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_space_settings SagemakerDomain#default_space_settings}
         * @return {@code this}
         */
        public Builder defaultSpaceSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettings defaultSpaceSettings) {
            this.defaultSpaceSettings = defaultSpaceSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getDomainSettings}
         * @param domainSettings domain_settings block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#domain_settings SagemakerDomain#domain_settings}
         * @return {@code this}
         */
        public Builder domainSettings(imports.aws.sagemaker_domain.SagemakerDomainDomainSettings domainSettings) {
            this.domainSettings = domainSettings;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#id SagemakerDomain#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#kms_key_id SagemakerDomain#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getRetentionPolicy}
         * @param retentionPolicy retention_policy block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#retention_policy SagemakerDomain#retention_policy}
         * @return {@code this}
         */
        public Builder retentionPolicy(imports.aws.sagemaker_domain.SagemakerDomainRetentionPolicy retentionPolicy) {
            this.retentionPolicy = retentionPolicy;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getTagPropagation}
         * @param tagPropagation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#tag_propagation SagemakerDomain#tag_propagation}.
         * @return {@code this}
         */
        public Builder tagPropagation(java.lang.String tagPropagation) {
            this.tagPropagation = tagPropagation;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#tags SagemakerDomain#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#tags_all SagemakerDomain#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getDependsOn}
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
         * Sets the value of {@link SagemakerDomainConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainConfig#getProvisioners}
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
         * @return a new instance of {@link SagemakerDomainConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainConfig {
        private final java.lang.String authMode;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettings defaultUserSettings;
        private final java.lang.String domainName;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.String vpcId;
        private final java.lang.String appNetworkAccessType;
        private final java.lang.String appSecurityGroupManagement;
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettings defaultSpaceSettings;
        private final imports.aws.sagemaker_domain.SagemakerDomainDomainSettings domainSettings;
        private final java.lang.String id;
        private final java.lang.String kmsKeyId;
        private final imports.aws.sagemaker_domain.SagemakerDomainRetentionPolicy retentionPolicy;
        private final java.lang.String tagPropagation;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.authMode = software.amazon.jsii.Kernel.get(this, "authMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultUserSettings = software.amazon.jsii.Kernel.get(this, "defaultUserSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettings.class));
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.appNetworkAccessType = software.amazon.jsii.Kernel.get(this, "appNetworkAccessType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.appSecurityGroupManagement = software.amazon.jsii.Kernel.get(this, "appSecurityGroupManagement", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultSpaceSettings = software.amazon.jsii.Kernel.get(this, "defaultSpaceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettings.class));
            this.domainSettings = software.amazon.jsii.Kernel.get(this, "domainSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDomainSettings.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.retentionPolicy = software.amazon.jsii.Kernel.get(this, "retentionPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainRetentionPolicy.class));
            this.tagPropagation = software.amazon.jsii.Kernel.get(this, "tagPropagation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.authMode = java.util.Objects.requireNonNull(builder.authMode, "authMode is required");
            this.defaultUserSettings = java.util.Objects.requireNonNull(builder.defaultUserSettings, "defaultUserSettings is required");
            this.domainName = java.util.Objects.requireNonNull(builder.domainName, "domainName is required");
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.vpcId = java.util.Objects.requireNonNull(builder.vpcId, "vpcId is required");
            this.appNetworkAccessType = builder.appNetworkAccessType;
            this.appSecurityGroupManagement = builder.appSecurityGroupManagement;
            this.defaultSpaceSettings = builder.defaultSpaceSettings;
            this.domainSettings = builder.domainSettings;
            this.id = builder.id;
            this.kmsKeyId = builder.kmsKeyId;
            this.retentionPolicy = builder.retentionPolicy;
            this.tagPropagation = builder.tagPropagation;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAuthMode() {
            return this.authMode;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettings getDefaultUserSettings() {
            return this.defaultUserSettings;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        public final java.lang.String getAppNetworkAccessType() {
            return this.appNetworkAccessType;
        }

        @Override
        public final java.lang.String getAppSecurityGroupManagement() {
            return this.appSecurityGroupManagement;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettings getDefaultSpaceSettings() {
            return this.defaultSpaceSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDomainSettings getDomainSettings() {
            return this.domainSettings;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainRetentionPolicy getRetentionPolicy() {
            return this.retentionPolicy;
        }

        @Override
        public final java.lang.String getTagPropagation() {
            return this.tagPropagation;
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

            data.set("authMode", om.valueToTree(this.getAuthMode()));
            data.set("defaultUserSettings", om.valueToTree(this.getDefaultUserSettings()));
            data.set("domainName", om.valueToTree(this.getDomainName()));
            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            data.set("vpcId", om.valueToTree(this.getVpcId()));
            if (this.getAppNetworkAccessType() != null) {
                data.set("appNetworkAccessType", om.valueToTree(this.getAppNetworkAccessType()));
            }
            if (this.getAppSecurityGroupManagement() != null) {
                data.set("appSecurityGroupManagement", om.valueToTree(this.getAppSecurityGroupManagement()));
            }
            if (this.getDefaultSpaceSettings() != null) {
                data.set("defaultSpaceSettings", om.valueToTree(this.getDefaultSpaceSettings()));
            }
            if (this.getDomainSettings() != null) {
                data.set("domainSettings", om.valueToTree(this.getDomainSettings()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getRetentionPolicy() != null) {
                data.set("retentionPolicy", om.valueToTree(this.getRetentionPolicy()));
            }
            if (this.getTagPropagation() != null) {
                data.set("tagPropagation", om.valueToTree(this.getTagPropagation()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainConfig.Jsii$Proxy that = (SagemakerDomainConfig.Jsii$Proxy) o;

            if (!authMode.equals(that.authMode)) return false;
            if (!defaultUserSettings.equals(that.defaultUserSettings)) return false;
            if (!domainName.equals(that.domainName)) return false;
            if (!subnetIds.equals(that.subnetIds)) return false;
            if (!vpcId.equals(that.vpcId)) return false;
            if (this.appNetworkAccessType != null ? !this.appNetworkAccessType.equals(that.appNetworkAccessType) : that.appNetworkAccessType != null) return false;
            if (this.appSecurityGroupManagement != null ? !this.appSecurityGroupManagement.equals(that.appSecurityGroupManagement) : that.appSecurityGroupManagement != null) return false;
            if (this.defaultSpaceSettings != null ? !this.defaultSpaceSettings.equals(that.defaultSpaceSettings) : that.defaultSpaceSettings != null) return false;
            if (this.domainSettings != null ? !this.domainSettings.equals(that.domainSettings) : that.domainSettings != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.retentionPolicy != null ? !this.retentionPolicy.equals(that.retentionPolicy) : that.retentionPolicy != null) return false;
            if (this.tagPropagation != null ? !this.tagPropagation.equals(that.tagPropagation) : that.tagPropagation != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.authMode.hashCode();
            result = 31 * result + (this.defaultUserSettings.hashCode());
            result = 31 * result + (this.domainName.hashCode());
            result = 31 * result + (this.subnetIds.hashCode());
            result = 31 * result + (this.vpcId.hashCode());
            result = 31 * result + (this.appNetworkAccessType != null ? this.appNetworkAccessType.hashCode() : 0);
            result = 31 * result + (this.appSecurityGroupManagement != null ? this.appSecurityGroupManagement.hashCode() : 0);
            result = 31 * result + (this.defaultSpaceSettings != null ? this.defaultSpaceSettings.hashCode() : 0);
            result = 31 * result + (this.domainSettings != null ? this.domainSettings.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.retentionPolicy != null ? this.retentionPolicy.hashCode() : 0);
            result = 31 * result + (this.tagPropagation != null ? this.tagPropagation.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
