package imports.aws.ami;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.923Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ami.AmiConfig")
@software.amazon.jsii.Jsii.Proxy(AmiConfig.Jsii$Proxy.class)
public interface AmiConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#name Ami#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#architecture Ami#architecture}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getArchitecture() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#boot_mode Ami#boot_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBootMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#deprecation_time Ami#deprecation_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeprecationTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#description Ami#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * ebs_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ebs_block_device Ami#ebs_block_device}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEbsBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ena_support Ami#ena_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnaSupport() {
        return null;
    }

    /**
     * ephemeral_block_device block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ephemeral_block_device Ami#ephemeral_block_device}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEphemeralBlockDevice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#id Ami#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#image_location Ami#image_location}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#imds_support Ami#imds_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImdsSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#kernel_id Ami#kernel_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKernelId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ramdisk_id Ami#ramdisk_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRamdiskId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#root_device_name Ami#root_device_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRootDeviceName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#sriov_net_support Ami#sriov_net_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSriovNetSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#tags Ami#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#tags_all Ami#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#timeouts Ami#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ami.AmiTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#tpm_support Ami#tpm_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTpmSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#uefi_data Ami#uefi_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUefiData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#virtualization_type Ami#virtualization_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVirtualizationType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AmiConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AmiConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AmiConfig> {
        java.lang.String name;
        java.lang.String architecture;
        java.lang.String bootMode;
        java.lang.String deprecationTime;
        java.lang.String description;
        java.lang.Object ebsBlockDevice;
        java.lang.Object enaSupport;
        java.lang.Object ephemeralBlockDevice;
        java.lang.String id;
        java.lang.String imageLocation;
        java.lang.String imdsSupport;
        java.lang.String kernelId;
        java.lang.String ramdiskId;
        java.lang.String rootDeviceName;
        java.lang.String sriovNetSupport;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.ami.AmiTimeouts timeouts;
        java.lang.String tpmSupport;
        java.lang.String uefiData;
        java.lang.String virtualizationType;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AmiConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#name Ami#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getArchitecture}
         * @param architecture Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#architecture Ami#architecture}.
         * @return {@code this}
         */
        public Builder architecture(java.lang.String architecture) {
            this.architecture = architecture;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getBootMode}
         * @param bootMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#boot_mode Ami#boot_mode}.
         * @return {@code this}
         */
        public Builder bootMode(java.lang.String bootMode) {
            this.bootMode = bootMode;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getDeprecationTime}
         * @param deprecationTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#deprecation_time Ami#deprecation_time}.
         * @return {@code this}
         */
        public Builder deprecationTime(java.lang.String deprecationTime) {
            this.deprecationTime = deprecationTime;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#description Ami#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getEbsBlockDevice}
         * @param ebsBlockDevice ebs_block_device block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ebs_block_device Ami#ebs_block_device}
         * @return {@code this}
         */
        public Builder ebsBlockDevice(com.hashicorp.cdktf.IResolvable ebsBlockDevice) {
            this.ebsBlockDevice = ebsBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getEbsBlockDevice}
         * @param ebsBlockDevice ebs_block_device block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ebs_block_device Ami#ebs_block_device}
         * @return {@code this}
         */
        public Builder ebsBlockDevice(java.util.List<? extends imports.aws.ami.AmiEbsBlockDevice> ebsBlockDevice) {
            this.ebsBlockDevice = ebsBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getEnaSupport}
         * @param enaSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ena_support Ami#ena_support}.
         * @return {@code this}
         */
        public Builder enaSupport(java.lang.Boolean enaSupport) {
            this.enaSupport = enaSupport;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getEnaSupport}
         * @param enaSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ena_support Ami#ena_support}.
         * @return {@code this}
         */
        public Builder enaSupport(com.hashicorp.cdktf.IResolvable enaSupport) {
            this.enaSupport = enaSupport;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getEphemeralBlockDevice}
         * @param ephemeralBlockDevice ephemeral_block_device block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ephemeral_block_device Ami#ephemeral_block_device}
         * @return {@code this}
         */
        public Builder ephemeralBlockDevice(com.hashicorp.cdktf.IResolvable ephemeralBlockDevice) {
            this.ephemeralBlockDevice = ephemeralBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getEphemeralBlockDevice}
         * @param ephemeralBlockDevice ephemeral_block_device block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ephemeral_block_device Ami#ephemeral_block_device}
         * @return {@code this}
         */
        public Builder ephemeralBlockDevice(java.util.List<? extends imports.aws.ami.AmiEphemeralBlockDevice> ephemeralBlockDevice) {
            this.ephemeralBlockDevice = ephemeralBlockDevice;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#id Ami#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getImageLocation}
         * @param imageLocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#image_location Ami#image_location}.
         * @return {@code this}
         */
        public Builder imageLocation(java.lang.String imageLocation) {
            this.imageLocation = imageLocation;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getImdsSupport}
         * @param imdsSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#imds_support Ami#imds_support}.
         * @return {@code this}
         */
        public Builder imdsSupport(java.lang.String imdsSupport) {
            this.imdsSupport = imdsSupport;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getKernelId}
         * @param kernelId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#kernel_id Ami#kernel_id}.
         * @return {@code this}
         */
        public Builder kernelId(java.lang.String kernelId) {
            this.kernelId = kernelId;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getRamdiskId}
         * @param ramdiskId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ramdisk_id Ami#ramdisk_id}.
         * @return {@code this}
         */
        public Builder ramdiskId(java.lang.String ramdiskId) {
            this.ramdiskId = ramdiskId;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getRootDeviceName}
         * @param rootDeviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#root_device_name Ami#root_device_name}.
         * @return {@code this}
         */
        public Builder rootDeviceName(java.lang.String rootDeviceName) {
            this.rootDeviceName = rootDeviceName;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getSriovNetSupport}
         * @param sriovNetSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#sriov_net_support Ami#sriov_net_support}.
         * @return {@code this}
         */
        public Builder sriovNetSupport(java.lang.String sriovNetSupport) {
            this.sriovNetSupport = sriovNetSupport;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#tags Ami#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#tags_all Ami#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#timeouts Ami#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.ami.AmiTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getTpmSupport}
         * @param tpmSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#tpm_support Ami#tpm_support}.
         * @return {@code this}
         */
        public Builder tpmSupport(java.lang.String tpmSupport) {
            this.tpmSupport = tpmSupport;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getUefiData}
         * @param uefiData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#uefi_data Ami#uefi_data}.
         * @return {@code this}
         */
        public Builder uefiData(java.lang.String uefiData) {
            this.uefiData = uefiData;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getVirtualizationType}
         * @param virtualizationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#virtualization_type Ami#virtualization_type}.
         * @return {@code this}
         */
        public Builder virtualizationType(java.lang.String virtualizationType) {
            this.virtualizationType = virtualizationType;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getDependsOn}
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
         * Sets the value of {@link AmiConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AmiConfig#getProvisioners}
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
         * @return a new instance of {@link AmiConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AmiConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AmiConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AmiConfig {
        private final java.lang.String name;
        private final java.lang.String architecture;
        private final java.lang.String bootMode;
        private final java.lang.String deprecationTime;
        private final java.lang.String description;
        private final java.lang.Object ebsBlockDevice;
        private final java.lang.Object enaSupport;
        private final java.lang.Object ephemeralBlockDevice;
        private final java.lang.String id;
        private final java.lang.String imageLocation;
        private final java.lang.String imdsSupport;
        private final java.lang.String kernelId;
        private final java.lang.String ramdiskId;
        private final java.lang.String rootDeviceName;
        private final java.lang.String sriovNetSupport;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.ami.AmiTimeouts timeouts;
        private final java.lang.String tpmSupport;
        private final java.lang.String uefiData;
        private final java.lang.String virtualizationType;
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
            this.architecture = software.amazon.jsii.Kernel.get(this, "architecture", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bootMode = software.amazon.jsii.Kernel.get(this, "bootMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deprecationTime = software.amazon.jsii.Kernel.get(this, "deprecationTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ebsBlockDevice = software.amazon.jsii.Kernel.get(this, "ebsBlockDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enaSupport = software.amazon.jsii.Kernel.get(this, "enaSupport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ephemeralBlockDevice = software.amazon.jsii.Kernel.get(this, "ephemeralBlockDevice", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageLocation = software.amazon.jsii.Kernel.get(this, "imageLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imdsSupport = software.amazon.jsii.Kernel.get(this, "imdsSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kernelId = software.amazon.jsii.Kernel.get(this, "kernelId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ramdiskId = software.amazon.jsii.Kernel.get(this, "ramdiskId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rootDeviceName = software.amazon.jsii.Kernel.get(this, "rootDeviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sriovNetSupport = software.amazon.jsii.Kernel.get(this, "sriovNetSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ami.AmiTimeouts.class));
            this.tpmSupport = software.amazon.jsii.Kernel.get(this, "tpmSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.uefiData = software.amazon.jsii.Kernel.get(this, "uefiData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.virtualizationType = software.amazon.jsii.Kernel.get(this, "virtualizationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.architecture = builder.architecture;
            this.bootMode = builder.bootMode;
            this.deprecationTime = builder.deprecationTime;
            this.description = builder.description;
            this.ebsBlockDevice = builder.ebsBlockDevice;
            this.enaSupport = builder.enaSupport;
            this.ephemeralBlockDevice = builder.ephemeralBlockDevice;
            this.id = builder.id;
            this.imageLocation = builder.imageLocation;
            this.imdsSupport = builder.imdsSupport;
            this.kernelId = builder.kernelId;
            this.ramdiskId = builder.ramdiskId;
            this.rootDeviceName = builder.rootDeviceName;
            this.sriovNetSupport = builder.sriovNetSupport;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.tpmSupport = builder.tpmSupport;
            this.uefiData = builder.uefiData;
            this.virtualizationType = builder.virtualizationType;
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
        public final java.lang.String getArchitecture() {
            return this.architecture;
        }

        @Override
        public final java.lang.String getBootMode() {
            return this.bootMode;
        }

        @Override
        public final java.lang.String getDeprecationTime() {
            return this.deprecationTime;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getEbsBlockDevice() {
            return this.ebsBlockDevice;
        }

        @Override
        public final java.lang.Object getEnaSupport() {
            return this.enaSupport;
        }

        @Override
        public final java.lang.Object getEphemeralBlockDevice() {
            return this.ephemeralBlockDevice;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getImageLocation() {
            return this.imageLocation;
        }

        @Override
        public final java.lang.String getImdsSupport() {
            return this.imdsSupport;
        }

        @Override
        public final java.lang.String getKernelId() {
            return this.kernelId;
        }

        @Override
        public final java.lang.String getRamdiskId() {
            return this.ramdiskId;
        }

        @Override
        public final java.lang.String getRootDeviceName() {
            return this.rootDeviceName;
        }

        @Override
        public final java.lang.String getSriovNetSupport() {
            return this.sriovNetSupport;
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
        public final imports.aws.ami.AmiTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getTpmSupport() {
            return this.tpmSupport;
        }

        @Override
        public final java.lang.String getUefiData() {
            return this.uefiData;
        }

        @Override
        public final java.lang.String getVirtualizationType() {
            return this.virtualizationType;
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
            if (this.getArchitecture() != null) {
                data.set("architecture", om.valueToTree(this.getArchitecture()));
            }
            if (this.getBootMode() != null) {
                data.set("bootMode", om.valueToTree(this.getBootMode()));
            }
            if (this.getDeprecationTime() != null) {
                data.set("deprecationTime", om.valueToTree(this.getDeprecationTime()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEbsBlockDevice() != null) {
                data.set("ebsBlockDevice", om.valueToTree(this.getEbsBlockDevice()));
            }
            if (this.getEnaSupport() != null) {
                data.set("enaSupport", om.valueToTree(this.getEnaSupport()));
            }
            if (this.getEphemeralBlockDevice() != null) {
                data.set("ephemeralBlockDevice", om.valueToTree(this.getEphemeralBlockDevice()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getImageLocation() != null) {
                data.set("imageLocation", om.valueToTree(this.getImageLocation()));
            }
            if (this.getImdsSupport() != null) {
                data.set("imdsSupport", om.valueToTree(this.getImdsSupport()));
            }
            if (this.getKernelId() != null) {
                data.set("kernelId", om.valueToTree(this.getKernelId()));
            }
            if (this.getRamdiskId() != null) {
                data.set("ramdiskId", om.valueToTree(this.getRamdiskId()));
            }
            if (this.getRootDeviceName() != null) {
                data.set("rootDeviceName", om.valueToTree(this.getRootDeviceName()));
            }
            if (this.getSriovNetSupport() != null) {
                data.set("sriovNetSupport", om.valueToTree(this.getSriovNetSupport()));
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
            if (this.getTpmSupport() != null) {
                data.set("tpmSupport", om.valueToTree(this.getTpmSupport()));
            }
            if (this.getUefiData() != null) {
                data.set("uefiData", om.valueToTree(this.getUefiData()));
            }
            if (this.getVirtualizationType() != null) {
                data.set("virtualizationType", om.valueToTree(this.getVirtualizationType()));
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
            struct.set("fqn", om.valueToTree("aws.ami.AmiConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AmiConfig.Jsii$Proxy that = (AmiConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.architecture != null ? !this.architecture.equals(that.architecture) : that.architecture != null) return false;
            if (this.bootMode != null ? !this.bootMode.equals(that.bootMode) : that.bootMode != null) return false;
            if (this.deprecationTime != null ? !this.deprecationTime.equals(that.deprecationTime) : that.deprecationTime != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.ebsBlockDevice != null ? !this.ebsBlockDevice.equals(that.ebsBlockDevice) : that.ebsBlockDevice != null) return false;
            if (this.enaSupport != null ? !this.enaSupport.equals(that.enaSupport) : that.enaSupport != null) return false;
            if (this.ephemeralBlockDevice != null ? !this.ephemeralBlockDevice.equals(that.ephemeralBlockDevice) : that.ephemeralBlockDevice != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.imageLocation != null ? !this.imageLocation.equals(that.imageLocation) : that.imageLocation != null) return false;
            if (this.imdsSupport != null ? !this.imdsSupport.equals(that.imdsSupport) : that.imdsSupport != null) return false;
            if (this.kernelId != null ? !this.kernelId.equals(that.kernelId) : that.kernelId != null) return false;
            if (this.ramdiskId != null ? !this.ramdiskId.equals(that.ramdiskId) : that.ramdiskId != null) return false;
            if (this.rootDeviceName != null ? !this.rootDeviceName.equals(that.rootDeviceName) : that.rootDeviceName != null) return false;
            if (this.sriovNetSupport != null ? !this.sriovNetSupport.equals(that.sriovNetSupport) : that.sriovNetSupport != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.tpmSupport != null ? !this.tpmSupport.equals(that.tpmSupport) : that.tpmSupport != null) return false;
            if (this.uefiData != null ? !this.uefiData.equals(that.uefiData) : that.uefiData != null) return false;
            if (this.virtualizationType != null ? !this.virtualizationType.equals(that.virtualizationType) : that.virtualizationType != null) return false;
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
            result = 31 * result + (this.architecture != null ? this.architecture.hashCode() : 0);
            result = 31 * result + (this.bootMode != null ? this.bootMode.hashCode() : 0);
            result = 31 * result + (this.deprecationTime != null ? this.deprecationTime.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.ebsBlockDevice != null ? this.ebsBlockDevice.hashCode() : 0);
            result = 31 * result + (this.enaSupport != null ? this.enaSupport.hashCode() : 0);
            result = 31 * result + (this.ephemeralBlockDevice != null ? this.ephemeralBlockDevice.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.imageLocation != null ? this.imageLocation.hashCode() : 0);
            result = 31 * result + (this.imdsSupport != null ? this.imdsSupport.hashCode() : 0);
            result = 31 * result + (this.kernelId != null ? this.kernelId.hashCode() : 0);
            result = 31 * result + (this.ramdiskId != null ? this.ramdiskId.hashCode() : 0);
            result = 31 * result + (this.rootDeviceName != null ? this.rootDeviceName.hashCode() : 0);
            result = 31 * result + (this.sriovNetSupport != null ? this.sriovNetSupport.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.tpmSupport != null ? this.tpmSupport.hashCode() : 0);
            result = 31 * result + (this.uefiData != null ? this.uefiData.hashCode() : 0);
            result = 31 * result + (this.virtualizationType != null ? this.virtualizationType.hashCode() : 0);
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
