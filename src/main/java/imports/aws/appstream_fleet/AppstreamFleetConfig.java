package imports.aws.appstream_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.059Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamFleet.AppstreamFleetConfig")
@software.amazon.jsii.Jsii.Proxy(AppstreamFleetConfig.Jsii$Proxy.class)
public interface AppstreamFleetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * compute_capacity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#compute_capacity AppstreamFleet#compute_capacity}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appstream_fleet.AppstreamFleetComputeCapacity getComputeCapacity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#instance_type AppstreamFleet#instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#name AppstreamFleet#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#description AppstreamFleet#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#disconnect_timeout_in_seconds AppstreamFleet#disconnect_timeout_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDisconnectTimeoutInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#display_name AppstreamFleet#display_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDisplayName() {
        return null;
    }

    /**
     * domain_join_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#domain_join_info AppstreamFleet#domain_join_info}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appstream_fleet.AppstreamFleetDomainJoinInfo getDomainJoinInfo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#enable_default_internet_access AppstreamFleet#enable_default_internet_access}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableDefaultInternetAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#fleet_type AppstreamFleet#fleet_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFleetType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#iam_role_arn AppstreamFleet#iam_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#id AppstreamFleet#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#idle_disconnect_timeout_in_seconds AppstreamFleet#idle_disconnect_timeout_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIdleDisconnectTimeoutInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#image_arn AppstreamFleet#image_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#image_name AppstreamFleet#image_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#max_sessions_per_instance AppstreamFleet#max_sessions_per_instance}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxSessionsPerInstance() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#max_user_duration_in_seconds AppstreamFleet#max_user_duration_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxUserDurationInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#stream_view AppstreamFleet#stream_view}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStreamView() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#tags AppstreamFleet#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#tags_all AppstreamFleet#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * vpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#vpc_config AppstreamFleet#vpc_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appstream_fleet.AppstreamFleetVpcConfig getVpcConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppstreamFleetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppstreamFleetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppstreamFleetConfig> {
        imports.aws.appstream_fleet.AppstreamFleetComputeCapacity computeCapacity;
        java.lang.String instanceType;
        java.lang.String name;
        java.lang.String description;
        java.lang.Number disconnectTimeoutInSeconds;
        java.lang.String displayName;
        imports.aws.appstream_fleet.AppstreamFleetDomainJoinInfo domainJoinInfo;
        java.lang.Object enableDefaultInternetAccess;
        java.lang.String fleetType;
        java.lang.String iamRoleArn;
        java.lang.String id;
        java.lang.Number idleDisconnectTimeoutInSeconds;
        java.lang.String imageArn;
        java.lang.String imageName;
        java.lang.Number maxSessionsPerInstance;
        java.lang.Number maxUserDurationInSeconds;
        java.lang.String streamView;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.appstream_fleet.AppstreamFleetVpcConfig vpcConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AppstreamFleetConfig#getComputeCapacity}
         * @param computeCapacity compute_capacity block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#compute_capacity AppstreamFleet#compute_capacity}
         * @return {@code this}
         */
        public Builder computeCapacity(imports.aws.appstream_fleet.AppstreamFleetComputeCapacity computeCapacity) {
            this.computeCapacity = computeCapacity;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#instance_type AppstreamFleet#instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#name AppstreamFleet#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#description AppstreamFleet#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getDisconnectTimeoutInSeconds}
         * @param disconnectTimeoutInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#disconnect_timeout_in_seconds AppstreamFleet#disconnect_timeout_in_seconds}.
         * @return {@code this}
         */
        public Builder disconnectTimeoutInSeconds(java.lang.Number disconnectTimeoutInSeconds) {
            this.disconnectTimeoutInSeconds = disconnectTimeoutInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getDisplayName}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#display_name AppstreamFleet#display_name}.
         * @return {@code this}
         */
        public Builder displayName(java.lang.String displayName) {
            this.displayName = displayName;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getDomainJoinInfo}
         * @param domainJoinInfo domain_join_info block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#domain_join_info AppstreamFleet#domain_join_info}
         * @return {@code this}
         */
        public Builder domainJoinInfo(imports.aws.appstream_fleet.AppstreamFleetDomainJoinInfo domainJoinInfo) {
            this.domainJoinInfo = domainJoinInfo;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getEnableDefaultInternetAccess}
         * @param enableDefaultInternetAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#enable_default_internet_access AppstreamFleet#enable_default_internet_access}.
         * @return {@code this}
         */
        public Builder enableDefaultInternetAccess(java.lang.Boolean enableDefaultInternetAccess) {
            this.enableDefaultInternetAccess = enableDefaultInternetAccess;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getEnableDefaultInternetAccess}
         * @param enableDefaultInternetAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#enable_default_internet_access AppstreamFleet#enable_default_internet_access}.
         * @return {@code this}
         */
        public Builder enableDefaultInternetAccess(com.hashicorp.cdktf.IResolvable enableDefaultInternetAccess) {
            this.enableDefaultInternetAccess = enableDefaultInternetAccess;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getFleetType}
         * @param fleetType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#fleet_type AppstreamFleet#fleet_type}.
         * @return {@code this}
         */
        public Builder fleetType(java.lang.String fleetType) {
            this.fleetType = fleetType;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getIamRoleArn}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#iam_role_arn AppstreamFleet#iam_role_arn}.
         * @return {@code this}
         */
        public Builder iamRoleArn(java.lang.String iamRoleArn) {
            this.iamRoleArn = iamRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#id AppstreamFleet#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getIdleDisconnectTimeoutInSeconds}
         * @param idleDisconnectTimeoutInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#idle_disconnect_timeout_in_seconds AppstreamFleet#idle_disconnect_timeout_in_seconds}.
         * @return {@code this}
         */
        public Builder idleDisconnectTimeoutInSeconds(java.lang.Number idleDisconnectTimeoutInSeconds) {
            this.idleDisconnectTimeoutInSeconds = idleDisconnectTimeoutInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getImageArn}
         * @param imageArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#image_arn AppstreamFleet#image_arn}.
         * @return {@code this}
         */
        public Builder imageArn(java.lang.String imageArn) {
            this.imageArn = imageArn;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getImageName}
         * @param imageName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#image_name AppstreamFleet#image_name}.
         * @return {@code this}
         */
        public Builder imageName(java.lang.String imageName) {
            this.imageName = imageName;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getMaxSessionsPerInstance}
         * @param maxSessionsPerInstance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#max_sessions_per_instance AppstreamFleet#max_sessions_per_instance}.
         * @return {@code this}
         */
        public Builder maxSessionsPerInstance(java.lang.Number maxSessionsPerInstance) {
            this.maxSessionsPerInstance = maxSessionsPerInstance;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getMaxUserDurationInSeconds}
         * @param maxUserDurationInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#max_user_duration_in_seconds AppstreamFleet#max_user_duration_in_seconds}.
         * @return {@code this}
         */
        public Builder maxUserDurationInSeconds(java.lang.Number maxUserDurationInSeconds) {
            this.maxUserDurationInSeconds = maxUserDurationInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getStreamView}
         * @param streamView Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#stream_view AppstreamFleet#stream_view}.
         * @return {@code this}
         */
        public Builder streamView(java.lang.String streamView) {
            this.streamView = streamView;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#tags AppstreamFleet#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#tags_all AppstreamFleet#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getVpcConfig}
         * @param vpcConfig vpc_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#vpc_config AppstreamFleet#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(imports.aws.appstream_fleet.AppstreamFleetVpcConfig vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getDependsOn}
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
         * Sets the value of {@link AppstreamFleetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamFleetConfig#getProvisioners}
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
         * @return a new instance of {@link AppstreamFleetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppstreamFleetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppstreamFleetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppstreamFleetConfig {
        private final imports.aws.appstream_fleet.AppstreamFleetComputeCapacity computeCapacity;
        private final java.lang.String instanceType;
        private final java.lang.String name;
        private final java.lang.String description;
        private final java.lang.Number disconnectTimeoutInSeconds;
        private final java.lang.String displayName;
        private final imports.aws.appstream_fleet.AppstreamFleetDomainJoinInfo domainJoinInfo;
        private final java.lang.Object enableDefaultInternetAccess;
        private final java.lang.String fleetType;
        private final java.lang.String iamRoleArn;
        private final java.lang.String id;
        private final java.lang.Number idleDisconnectTimeoutInSeconds;
        private final java.lang.String imageArn;
        private final java.lang.String imageName;
        private final java.lang.Number maxSessionsPerInstance;
        private final java.lang.Number maxUserDurationInSeconds;
        private final java.lang.String streamView;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.appstream_fleet.AppstreamFleetVpcConfig vpcConfig;
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
            this.computeCapacity = software.amazon.jsii.Kernel.get(this, "computeCapacity", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_fleet.AppstreamFleetComputeCapacity.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.disconnectTimeoutInSeconds = software.amazon.jsii.Kernel.get(this, "disconnectTimeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.displayName = software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainJoinInfo = software.amazon.jsii.Kernel.get(this, "domainJoinInfo", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_fleet.AppstreamFleetDomainJoinInfo.class));
            this.enableDefaultInternetAccess = software.amazon.jsii.Kernel.get(this, "enableDefaultInternetAccess", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fleetType = software.amazon.jsii.Kernel.get(this, "fleetType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamRoleArn = software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.idleDisconnectTimeoutInSeconds = software.amazon.jsii.Kernel.get(this, "idleDisconnectTimeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.imageArn = software.amazon.jsii.Kernel.get(this, "imageArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageName = software.amazon.jsii.Kernel.get(this, "imageName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxSessionsPerInstance = software.amazon.jsii.Kernel.get(this, "maxSessionsPerInstance", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxUserDurationInSeconds = software.amazon.jsii.Kernel.get(this, "maxUserDurationInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.streamView = software.amazon.jsii.Kernel.get(this, "streamView", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcConfig = software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_fleet.AppstreamFleetVpcConfig.class));
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
            this.computeCapacity = java.util.Objects.requireNonNull(builder.computeCapacity, "computeCapacity is required");
            this.instanceType = java.util.Objects.requireNonNull(builder.instanceType, "instanceType is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.description = builder.description;
            this.disconnectTimeoutInSeconds = builder.disconnectTimeoutInSeconds;
            this.displayName = builder.displayName;
            this.domainJoinInfo = builder.domainJoinInfo;
            this.enableDefaultInternetAccess = builder.enableDefaultInternetAccess;
            this.fleetType = builder.fleetType;
            this.iamRoleArn = builder.iamRoleArn;
            this.id = builder.id;
            this.idleDisconnectTimeoutInSeconds = builder.idleDisconnectTimeoutInSeconds;
            this.imageArn = builder.imageArn;
            this.imageName = builder.imageName;
            this.maxSessionsPerInstance = builder.maxSessionsPerInstance;
            this.maxUserDurationInSeconds = builder.maxUserDurationInSeconds;
            this.streamView = builder.streamView;
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
        public final imports.aws.appstream_fleet.AppstreamFleetComputeCapacity getComputeCapacity() {
            return this.computeCapacity;
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
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Number getDisconnectTimeoutInSeconds() {
            return this.disconnectTimeoutInSeconds;
        }

        @Override
        public final java.lang.String getDisplayName() {
            return this.displayName;
        }

        @Override
        public final imports.aws.appstream_fleet.AppstreamFleetDomainJoinInfo getDomainJoinInfo() {
            return this.domainJoinInfo;
        }

        @Override
        public final java.lang.Object getEnableDefaultInternetAccess() {
            return this.enableDefaultInternetAccess;
        }

        @Override
        public final java.lang.String getFleetType() {
            return this.fleetType;
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
        public final java.lang.Number getIdleDisconnectTimeoutInSeconds() {
            return this.idleDisconnectTimeoutInSeconds;
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
        public final java.lang.Number getMaxSessionsPerInstance() {
            return this.maxSessionsPerInstance;
        }

        @Override
        public final java.lang.Number getMaxUserDurationInSeconds() {
            return this.maxUserDurationInSeconds;
        }

        @Override
        public final java.lang.String getStreamView() {
            return this.streamView;
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
        public final imports.aws.appstream_fleet.AppstreamFleetVpcConfig getVpcConfig() {
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

            data.set("computeCapacity", om.valueToTree(this.getComputeCapacity()));
            data.set("instanceType", om.valueToTree(this.getInstanceType()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDisconnectTimeoutInSeconds() != null) {
                data.set("disconnectTimeoutInSeconds", om.valueToTree(this.getDisconnectTimeoutInSeconds()));
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
            if (this.getFleetType() != null) {
                data.set("fleetType", om.valueToTree(this.getFleetType()));
            }
            if (this.getIamRoleArn() != null) {
                data.set("iamRoleArn", om.valueToTree(this.getIamRoleArn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIdleDisconnectTimeoutInSeconds() != null) {
                data.set("idleDisconnectTimeoutInSeconds", om.valueToTree(this.getIdleDisconnectTimeoutInSeconds()));
            }
            if (this.getImageArn() != null) {
                data.set("imageArn", om.valueToTree(this.getImageArn()));
            }
            if (this.getImageName() != null) {
                data.set("imageName", om.valueToTree(this.getImageName()));
            }
            if (this.getMaxSessionsPerInstance() != null) {
                data.set("maxSessionsPerInstance", om.valueToTree(this.getMaxSessionsPerInstance()));
            }
            if (this.getMaxUserDurationInSeconds() != null) {
                data.set("maxUserDurationInSeconds", om.valueToTree(this.getMaxUserDurationInSeconds()));
            }
            if (this.getStreamView() != null) {
                data.set("streamView", om.valueToTree(this.getStreamView()));
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
            struct.set("fqn", om.valueToTree("aws.appstreamFleet.AppstreamFleetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppstreamFleetConfig.Jsii$Proxy that = (AppstreamFleetConfig.Jsii$Proxy) o;

            if (!computeCapacity.equals(that.computeCapacity)) return false;
            if (!instanceType.equals(that.instanceType)) return false;
            if (!name.equals(that.name)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.disconnectTimeoutInSeconds != null ? !this.disconnectTimeoutInSeconds.equals(that.disconnectTimeoutInSeconds) : that.disconnectTimeoutInSeconds != null) return false;
            if (this.displayName != null ? !this.displayName.equals(that.displayName) : that.displayName != null) return false;
            if (this.domainJoinInfo != null ? !this.domainJoinInfo.equals(that.domainJoinInfo) : that.domainJoinInfo != null) return false;
            if (this.enableDefaultInternetAccess != null ? !this.enableDefaultInternetAccess.equals(that.enableDefaultInternetAccess) : that.enableDefaultInternetAccess != null) return false;
            if (this.fleetType != null ? !this.fleetType.equals(that.fleetType) : that.fleetType != null) return false;
            if (this.iamRoleArn != null ? !this.iamRoleArn.equals(that.iamRoleArn) : that.iamRoleArn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.idleDisconnectTimeoutInSeconds != null ? !this.idleDisconnectTimeoutInSeconds.equals(that.idleDisconnectTimeoutInSeconds) : that.idleDisconnectTimeoutInSeconds != null) return false;
            if (this.imageArn != null ? !this.imageArn.equals(that.imageArn) : that.imageArn != null) return false;
            if (this.imageName != null ? !this.imageName.equals(that.imageName) : that.imageName != null) return false;
            if (this.maxSessionsPerInstance != null ? !this.maxSessionsPerInstance.equals(that.maxSessionsPerInstance) : that.maxSessionsPerInstance != null) return false;
            if (this.maxUserDurationInSeconds != null ? !this.maxUserDurationInSeconds.equals(that.maxUserDurationInSeconds) : that.maxUserDurationInSeconds != null) return false;
            if (this.streamView != null ? !this.streamView.equals(that.streamView) : that.streamView != null) return false;
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
            int result = this.computeCapacity.hashCode();
            result = 31 * result + (this.instanceType.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.disconnectTimeoutInSeconds != null ? this.disconnectTimeoutInSeconds.hashCode() : 0);
            result = 31 * result + (this.displayName != null ? this.displayName.hashCode() : 0);
            result = 31 * result + (this.domainJoinInfo != null ? this.domainJoinInfo.hashCode() : 0);
            result = 31 * result + (this.enableDefaultInternetAccess != null ? this.enableDefaultInternetAccess.hashCode() : 0);
            result = 31 * result + (this.fleetType != null ? this.fleetType.hashCode() : 0);
            result = 31 * result + (this.iamRoleArn != null ? this.iamRoleArn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.idleDisconnectTimeoutInSeconds != null ? this.idleDisconnectTimeoutInSeconds.hashCode() : 0);
            result = 31 * result + (this.imageArn != null ? this.imageArn.hashCode() : 0);
            result = 31 * result + (this.imageName != null ? this.imageName.hashCode() : 0);
            result = 31 * result + (this.maxSessionsPerInstance != null ? this.maxSessionsPerInstance.hashCode() : 0);
            result = 31 * result + (this.maxUserDurationInSeconds != null ? this.maxUserDurationInSeconds.hashCode() : 0);
            result = 31 * result + (this.streamView != null ? this.streamView.hashCode() : 0);
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
