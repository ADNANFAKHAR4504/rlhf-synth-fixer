package imports.aws.launch_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.513Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchConfiguration.LaunchConfigurationConfig")
@software.amazon.jsii.Jsii.Proxy(LaunchConfigurationConfig.Jsii$Proxy.class)
public interface LaunchConfigurationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#image_id LaunchConfiguration#image_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getImageId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#instance_type LaunchConfiguration#instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#associate_public_ip_address LaunchConfiguration#associate_public_ip_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAssociatePublicIpAddress() {
        return null;
    }

    /**
     * ebs_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ebs_block_device LaunchConfiguration#ebs_block_device}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEbsBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ebs_optimized LaunchConfiguration#ebs_optimized}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEbsOptimized() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#enable_monitoring LaunchConfiguration#enable_monitoring}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableMonitoring() {
        return null;
    }

    /**
     * ephemeral_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ephemeral_block_device LaunchConfiguration#ephemeral_block_device}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEphemeralBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#iam_instance_profile LaunchConfiguration#iam_instance_profile}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamInstanceProfile() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#id LaunchConfiguration#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#key_name LaunchConfiguration#key_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyName() {
        return null;
    }

    /**
     * metadata_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#metadata_options LaunchConfiguration#metadata_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_configuration.LaunchConfigurationMetadataOptions getMetadataOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#name LaunchConfiguration#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#name_prefix LaunchConfiguration#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#placement_tenancy LaunchConfiguration#placement_tenancy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlacementTenancy() {
        return null;
    }

    /**
     * root_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#root_block_device LaunchConfiguration#root_block_device}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_configuration.LaunchConfigurationRootBlockDevice getRootBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#security_groups LaunchConfiguration#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#spot_price LaunchConfiguration#spot_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSpotPrice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#user_data LaunchConfiguration#user_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#user_data_base64 LaunchConfiguration#user_data_base64}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserDataBase64() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchConfigurationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchConfigurationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchConfigurationConfig> {
        java.lang.String imageId;
        java.lang.String instanceType;
        java.lang.Object associatePublicIpAddress;
        java.lang.Object ebsBlockDevice;
        java.lang.Object ebsOptimized;
        java.lang.Object enableMonitoring;
        java.lang.Object ephemeralBlockDevice;
        java.lang.String iamInstanceProfile;
        java.lang.String id;
        java.lang.String keyName;
        imports.aws.launch_configuration.LaunchConfigurationMetadataOptions metadataOptions;
        java.lang.String name;
        java.lang.String namePrefix;
        java.lang.String placementTenancy;
        imports.aws.launch_configuration.LaunchConfigurationRootBlockDevice rootBlockDevice;
        java.util.List<java.lang.String> securityGroups;
        java.lang.String spotPrice;
        java.lang.String userData;
        java.lang.String userDataBase64;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getImageId}
         * @param imageId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#image_id LaunchConfiguration#image_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder imageId(java.lang.String imageId) {
            this.imageId = imageId;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getInstanceType}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#instance_type LaunchConfiguration#instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder instanceType(java.lang.String instanceType) {
            this.instanceType = instanceType;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getAssociatePublicIpAddress}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#associate_public_ip_address LaunchConfiguration#associate_public_ip_address}.
         * @return {@code this}
         */
        public Builder associatePublicIpAddress(java.lang.Boolean associatePublicIpAddress) {
            this.associatePublicIpAddress = associatePublicIpAddress;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getAssociatePublicIpAddress}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#associate_public_ip_address LaunchConfiguration#associate_public_ip_address}.
         * @return {@code this}
         */
        public Builder associatePublicIpAddress(com.hashicorp.cdktf.IResolvable associatePublicIpAddress) {
            this.associatePublicIpAddress = associatePublicIpAddress;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getEbsBlockDevice}
         * @param ebsBlockDevice ebs_block_device block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ebs_block_device LaunchConfiguration#ebs_block_device}
         * @return {@code this}
         */
        public Builder ebsBlockDevice(com.hashicorp.cdktf.IResolvable ebsBlockDevice) {
            this.ebsBlockDevice = ebsBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getEbsBlockDevice}
         * @param ebsBlockDevice ebs_block_device block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ebs_block_device LaunchConfiguration#ebs_block_device}
         * @return {@code this}
         */
        public Builder ebsBlockDevice(java.util.List<? extends imports.aws.launch_configuration.LaunchConfigurationEbsBlockDevice> ebsBlockDevice) {
            this.ebsBlockDevice = ebsBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getEbsOptimized}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ebs_optimized LaunchConfiguration#ebs_optimized}.
         * @return {@code this}
         */
        public Builder ebsOptimized(java.lang.Boolean ebsOptimized) {
            this.ebsOptimized = ebsOptimized;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getEbsOptimized}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ebs_optimized LaunchConfiguration#ebs_optimized}.
         * @return {@code this}
         */
        public Builder ebsOptimized(com.hashicorp.cdktf.IResolvable ebsOptimized) {
            this.ebsOptimized = ebsOptimized;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getEnableMonitoring}
         * @param enableMonitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#enable_monitoring LaunchConfiguration#enable_monitoring}.
         * @return {@code this}
         */
        public Builder enableMonitoring(java.lang.Boolean enableMonitoring) {
            this.enableMonitoring = enableMonitoring;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getEnableMonitoring}
         * @param enableMonitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#enable_monitoring LaunchConfiguration#enable_monitoring}.
         * @return {@code this}
         */
        public Builder enableMonitoring(com.hashicorp.cdktf.IResolvable enableMonitoring) {
            this.enableMonitoring = enableMonitoring;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getEphemeralBlockDevice}
         * @param ephemeralBlockDevice ephemeral_block_device block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ephemeral_block_device LaunchConfiguration#ephemeral_block_device}
         * @return {@code this}
         */
        public Builder ephemeralBlockDevice(com.hashicorp.cdktf.IResolvable ephemeralBlockDevice) {
            this.ephemeralBlockDevice = ephemeralBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getEphemeralBlockDevice}
         * @param ephemeralBlockDevice ephemeral_block_device block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ephemeral_block_device LaunchConfiguration#ephemeral_block_device}
         * @return {@code this}
         */
        public Builder ephemeralBlockDevice(java.util.List<? extends imports.aws.launch_configuration.LaunchConfigurationEphemeralBlockDevice> ephemeralBlockDevice) {
            this.ephemeralBlockDevice = ephemeralBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getIamInstanceProfile}
         * @param iamInstanceProfile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#iam_instance_profile LaunchConfiguration#iam_instance_profile}.
         * @return {@code this}
         */
        public Builder iamInstanceProfile(java.lang.String iamInstanceProfile) {
            this.iamInstanceProfile = iamInstanceProfile;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#id LaunchConfiguration#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getKeyName}
         * @param keyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#key_name LaunchConfiguration#key_name}.
         * @return {@code this}
         */
        public Builder keyName(java.lang.String keyName) {
            this.keyName = keyName;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getMetadataOptions}
         * @param metadataOptions metadata_options block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#metadata_options LaunchConfiguration#metadata_options}
         * @return {@code this}
         */
        public Builder metadataOptions(imports.aws.launch_configuration.LaunchConfigurationMetadataOptions metadataOptions) {
            this.metadataOptions = metadataOptions;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#name LaunchConfiguration#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#name_prefix LaunchConfiguration#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getPlacementTenancy}
         * @param placementTenancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#placement_tenancy LaunchConfiguration#placement_tenancy}.
         * @return {@code this}
         */
        public Builder placementTenancy(java.lang.String placementTenancy) {
            this.placementTenancy = placementTenancy;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getRootBlockDevice}
         * @param rootBlockDevice root_block_device block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#root_block_device LaunchConfiguration#root_block_device}
         * @return {@code this}
         */
        public Builder rootBlockDevice(imports.aws.launch_configuration.LaunchConfigurationRootBlockDevice rootBlockDevice) {
            this.rootBlockDevice = rootBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#security_groups LaunchConfiguration#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getSpotPrice}
         * @param spotPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#spot_price LaunchConfiguration#spot_price}.
         * @return {@code this}
         */
        public Builder spotPrice(java.lang.String spotPrice) {
            this.spotPrice = spotPrice;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getUserData}
         * @param userData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#user_data LaunchConfiguration#user_data}.
         * @return {@code this}
         */
        public Builder userData(java.lang.String userData) {
            this.userData = userData;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getUserDataBase64}
         * @param userDataBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#user_data_base64 LaunchConfiguration#user_data_base64}.
         * @return {@code this}
         */
        public Builder userDataBase64(java.lang.String userDataBase64) {
            this.userDataBase64 = userDataBase64;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getDependsOn}
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
         * Sets the value of {@link LaunchConfigurationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LaunchConfigurationConfig#getProvisioners}
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
         * @return a new instance of {@link LaunchConfigurationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchConfigurationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchConfigurationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchConfigurationConfig {
        private final java.lang.String imageId;
        private final java.lang.String instanceType;
        private final java.lang.Object associatePublicIpAddress;
        private final java.lang.Object ebsBlockDevice;
        private final java.lang.Object ebsOptimized;
        private final java.lang.Object enableMonitoring;
        private final java.lang.Object ephemeralBlockDevice;
        private final java.lang.String iamInstanceProfile;
        private final java.lang.String id;
        private final java.lang.String keyName;
        private final imports.aws.launch_configuration.LaunchConfigurationMetadataOptions metadataOptions;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.lang.String placementTenancy;
        private final imports.aws.launch_configuration.LaunchConfigurationRootBlockDevice rootBlockDevice;
        private final java.util.List<java.lang.String> securityGroups;
        private final java.lang.String spotPrice;
        private final java.lang.String userData;
        private final java.lang.String userDataBase64;
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
            this.imageId = software.amazon.jsii.Kernel.get(this, "imageId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceType = software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.associatePublicIpAddress = software.amazon.jsii.Kernel.get(this, "associatePublicIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ebsBlockDevice = software.amazon.jsii.Kernel.get(this, "ebsBlockDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ebsOptimized = software.amazon.jsii.Kernel.get(this, "ebsOptimized", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableMonitoring = software.amazon.jsii.Kernel.get(this, "enableMonitoring", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ephemeralBlockDevice = software.amazon.jsii.Kernel.get(this, "ephemeralBlockDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.iamInstanceProfile = software.amazon.jsii.Kernel.get(this, "iamInstanceProfile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyName = software.amazon.jsii.Kernel.get(this, "keyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metadataOptions = software.amazon.jsii.Kernel.get(this, "metadataOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_configuration.LaunchConfigurationMetadataOptions.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.placementTenancy = software.amazon.jsii.Kernel.get(this, "placementTenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rootBlockDevice = software.amazon.jsii.Kernel.get(this, "rootBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.launch_configuration.LaunchConfigurationRootBlockDevice.class));
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.spotPrice = software.amazon.jsii.Kernel.get(this, "spotPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userData = software.amazon.jsii.Kernel.get(this, "userData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userDataBase64 = software.amazon.jsii.Kernel.get(this, "userDataBase64", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.imageId = java.util.Objects.requireNonNull(builder.imageId, "imageId is required");
            this.instanceType = java.util.Objects.requireNonNull(builder.instanceType, "instanceType is required");
            this.associatePublicIpAddress = builder.associatePublicIpAddress;
            this.ebsBlockDevice = builder.ebsBlockDevice;
            this.ebsOptimized = builder.ebsOptimized;
            this.enableMonitoring = builder.enableMonitoring;
            this.ephemeralBlockDevice = builder.ephemeralBlockDevice;
            this.iamInstanceProfile = builder.iamInstanceProfile;
            this.id = builder.id;
            this.keyName = builder.keyName;
            this.metadataOptions = builder.metadataOptions;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.placementTenancy = builder.placementTenancy;
            this.rootBlockDevice = builder.rootBlockDevice;
            this.securityGroups = builder.securityGroups;
            this.spotPrice = builder.spotPrice;
            this.userData = builder.userData;
            this.userDataBase64 = builder.userDataBase64;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getImageId() {
            return this.imageId;
        }

        @Override
        public final java.lang.String getInstanceType() {
            return this.instanceType;
        }

        @Override
        public final java.lang.Object getAssociatePublicIpAddress() {
            return this.associatePublicIpAddress;
        }

        @Override
        public final java.lang.Object getEbsBlockDevice() {
            return this.ebsBlockDevice;
        }

        @Override
        public final java.lang.Object getEbsOptimized() {
            return this.ebsOptimized;
        }

        @Override
        public final java.lang.Object getEnableMonitoring() {
            return this.enableMonitoring;
        }

        @Override
        public final java.lang.Object getEphemeralBlockDevice() {
            return this.ephemeralBlockDevice;
        }

        @Override
        public final java.lang.String getIamInstanceProfile() {
            return this.iamInstanceProfile;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKeyName() {
            return this.keyName;
        }

        @Override
        public final imports.aws.launch_configuration.LaunchConfigurationMetadataOptions getMetadataOptions() {
            return this.metadataOptions;
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
        public final java.lang.String getPlacementTenancy() {
            return this.placementTenancy;
        }

        @Override
        public final imports.aws.launch_configuration.LaunchConfigurationRootBlockDevice getRootBlockDevice() {
            return this.rootBlockDevice;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroups() {
            return this.securityGroups;
        }

        @Override
        public final java.lang.String getSpotPrice() {
            return this.spotPrice;
        }

        @Override
        public final java.lang.String getUserData() {
            return this.userData;
        }

        @Override
        public final java.lang.String getUserDataBase64() {
            return this.userDataBase64;
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

            data.set("imageId", om.valueToTree(this.getImageId()));
            data.set("instanceType", om.valueToTree(this.getInstanceType()));
            if (this.getAssociatePublicIpAddress() != null) {
                data.set("associatePublicIpAddress", om.valueToTree(this.getAssociatePublicIpAddress()));
            }
            if (this.getEbsBlockDevice() != null) {
                data.set("ebsBlockDevice", om.valueToTree(this.getEbsBlockDevice()));
            }
            if (this.getEbsOptimized() != null) {
                data.set("ebsOptimized", om.valueToTree(this.getEbsOptimized()));
            }
            if (this.getEnableMonitoring() != null) {
                data.set("enableMonitoring", om.valueToTree(this.getEnableMonitoring()));
            }
            if (this.getEphemeralBlockDevice() != null) {
                data.set("ephemeralBlockDevice", om.valueToTree(this.getEphemeralBlockDevice()));
            }
            if (this.getIamInstanceProfile() != null) {
                data.set("iamInstanceProfile", om.valueToTree(this.getIamInstanceProfile()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKeyName() != null) {
                data.set("keyName", om.valueToTree(this.getKeyName()));
            }
            if (this.getMetadataOptions() != null) {
                data.set("metadataOptions", om.valueToTree(this.getMetadataOptions()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getPlacementTenancy() != null) {
                data.set("placementTenancy", om.valueToTree(this.getPlacementTenancy()));
            }
            if (this.getRootBlockDevice() != null) {
                data.set("rootBlockDevice", om.valueToTree(this.getRootBlockDevice()));
            }
            if (this.getSecurityGroups() != null) {
                data.set("securityGroups", om.valueToTree(this.getSecurityGroups()));
            }
            if (this.getSpotPrice() != null) {
                data.set("spotPrice", om.valueToTree(this.getSpotPrice()));
            }
            if (this.getUserData() != null) {
                data.set("userData", om.valueToTree(this.getUserData()));
            }
            if (this.getUserDataBase64() != null) {
                data.set("userDataBase64", om.valueToTree(this.getUserDataBase64()));
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
            struct.set("fqn", om.valueToTree("aws.launchConfiguration.LaunchConfigurationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchConfigurationConfig.Jsii$Proxy that = (LaunchConfigurationConfig.Jsii$Proxy) o;

            if (!imageId.equals(that.imageId)) return false;
            if (!instanceType.equals(that.instanceType)) return false;
            if (this.associatePublicIpAddress != null ? !this.associatePublicIpAddress.equals(that.associatePublicIpAddress) : that.associatePublicIpAddress != null) return false;
            if (this.ebsBlockDevice != null ? !this.ebsBlockDevice.equals(that.ebsBlockDevice) : that.ebsBlockDevice != null) return false;
            if (this.ebsOptimized != null ? !this.ebsOptimized.equals(that.ebsOptimized) : that.ebsOptimized != null) return false;
            if (this.enableMonitoring != null ? !this.enableMonitoring.equals(that.enableMonitoring) : that.enableMonitoring != null) return false;
            if (this.ephemeralBlockDevice != null ? !this.ephemeralBlockDevice.equals(that.ephemeralBlockDevice) : that.ephemeralBlockDevice != null) return false;
            if (this.iamInstanceProfile != null ? !this.iamInstanceProfile.equals(that.iamInstanceProfile) : that.iamInstanceProfile != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.keyName != null ? !this.keyName.equals(that.keyName) : that.keyName != null) return false;
            if (this.metadataOptions != null ? !this.metadataOptions.equals(that.metadataOptions) : that.metadataOptions != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.placementTenancy != null ? !this.placementTenancy.equals(that.placementTenancy) : that.placementTenancy != null) return false;
            if (this.rootBlockDevice != null ? !this.rootBlockDevice.equals(that.rootBlockDevice) : that.rootBlockDevice != null) return false;
            if (this.securityGroups != null ? !this.securityGroups.equals(that.securityGroups) : that.securityGroups != null) return false;
            if (this.spotPrice != null ? !this.spotPrice.equals(that.spotPrice) : that.spotPrice != null) return false;
            if (this.userData != null ? !this.userData.equals(that.userData) : that.userData != null) return false;
            if (this.userDataBase64 != null ? !this.userDataBase64.equals(that.userDataBase64) : that.userDataBase64 != null) return false;
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
            int result = this.imageId.hashCode();
            result = 31 * result + (this.instanceType.hashCode());
            result = 31 * result + (this.associatePublicIpAddress != null ? this.associatePublicIpAddress.hashCode() : 0);
            result = 31 * result + (this.ebsBlockDevice != null ? this.ebsBlockDevice.hashCode() : 0);
            result = 31 * result + (this.ebsOptimized != null ? this.ebsOptimized.hashCode() : 0);
            result = 31 * result + (this.enableMonitoring != null ? this.enableMonitoring.hashCode() : 0);
            result = 31 * result + (this.ephemeralBlockDevice != null ? this.ephemeralBlockDevice.hashCode() : 0);
            result = 31 * result + (this.iamInstanceProfile != null ? this.iamInstanceProfile.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.keyName != null ? this.keyName.hashCode() : 0);
            result = 31 * result + (this.metadataOptions != null ? this.metadataOptions.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.placementTenancy != null ? this.placementTenancy.hashCode() : 0);
            result = 31 * result + (this.rootBlockDevice != null ? this.rootBlockDevice.hashCode() : 0);
            result = 31 * result + (this.securityGroups != null ? this.securityGroups.hashCode() : 0);
            result = 31 * result + (this.spotPrice != null ? this.spotPrice.hashCode() : 0);
            result = 31 * result + (this.userData != null ? this.userData.hashCode() : 0);
            result = 31 * result + (this.userDataBase64 != null ? this.userDataBase64.hashCode() : 0);
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
