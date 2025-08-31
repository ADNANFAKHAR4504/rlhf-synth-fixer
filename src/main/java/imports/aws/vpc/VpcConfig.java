package imports.aws.vpc;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.589Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpc.VpcConfig")
@software.amazon.jsii.Jsii.Proxy(VpcConfig.Jsii$Proxy.class)
public interface VpcConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#assign_generated_ipv6_cidr_block Vpc#assign_generated_ipv6_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAssignGeneratedIpv6CidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#cidr_block Vpc#cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#enable_dns_hostnames Vpc#enable_dns_hostnames}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableDnsHostnames() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#enable_dns_support Vpc#enable_dns_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableDnsSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#enable_network_address_usage_metrics Vpc#enable_network_address_usage_metrics}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableNetworkAddressUsageMetrics() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#id Vpc#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#instance_tenancy Vpc#instance_tenancy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceTenancy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#ipv4_ipam_pool_id Vpc#ipv4_ipam_pool_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv4IpamPoolId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#ipv4_netmask_length Vpc#ipv4_netmask_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIpv4NetmaskLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#ipv6_cidr_block Vpc#ipv6_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#ipv6_cidr_block_network_border_group Vpc#ipv6_cidr_block_network_border_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlockNetworkBorderGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#ipv6_ipam_pool_id Vpc#ipv6_ipam_pool_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6IpamPoolId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#ipv6_netmask_length Vpc#ipv6_netmask_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIpv6NetmaskLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#tags Vpc#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#tags_all Vpc#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcConfig> {
        java.lang.Object assignGeneratedIpv6CidrBlock;
        java.lang.String cidrBlock;
        java.lang.Object enableDnsHostnames;
        java.lang.Object enableDnsSupport;
        java.lang.Object enableNetworkAddressUsageMetrics;
        java.lang.String id;
        java.lang.String instanceTenancy;
        java.lang.String ipv4IpamPoolId;
        java.lang.Number ipv4NetmaskLength;
        java.lang.String ipv6CidrBlock;
        java.lang.String ipv6CidrBlockNetworkBorderGroup;
        java.lang.String ipv6IpamPoolId;
        java.lang.Number ipv6NetmaskLength;
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
         * Sets the value of {@link VpcConfig#getAssignGeneratedIpv6CidrBlock}
         * @param assignGeneratedIpv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#assign_generated_ipv6_cidr_block Vpc#assign_generated_ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder assignGeneratedIpv6CidrBlock(java.lang.Boolean assignGeneratedIpv6CidrBlock) {
            this.assignGeneratedIpv6CidrBlock = assignGeneratedIpv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getAssignGeneratedIpv6CidrBlock}
         * @param assignGeneratedIpv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#assign_generated_ipv6_cidr_block Vpc#assign_generated_ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder assignGeneratedIpv6CidrBlock(com.hashicorp.cdktf.IResolvable assignGeneratedIpv6CidrBlock) {
            this.assignGeneratedIpv6CidrBlock = assignGeneratedIpv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getCidrBlock}
         * @param cidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#cidr_block Vpc#cidr_block}.
         * @return {@code this}
         */
        public Builder cidrBlock(java.lang.String cidrBlock) {
            this.cidrBlock = cidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getEnableDnsHostnames}
         * @param enableDnsHostnames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#enable_dns_hostnames Vpc#enable_dns_hostnames}.
         * @return {@code this}
         */
        public Builder enableDnsHostnames(java.lang.Boolean enableDnsHostnames) {
            this.enableDnsHostnames = enableDnsHostnames;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getEnableDnsHostnames}
         * @param enableDnsHostnames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#enable_dns_hostnames Vpc#enable_dns_hostnames}.
         * @return {@code this}
         */
        public Builder enableDnsHostnames(com.hashicorp.cdktf.IResolvable enableDnsHostnames) {
            this.enableDnsHostnames = enableDnsHostnames;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getEnableDnsSupport}
         * @param enableDnsSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#enable_dns_support Vpc#enable_dns_support}.
         * @return {@code this}
         */
        public Builder enableDnsSupport(java.lang.Boolean enableDnsSupport) {
            this.enableDnsSupport = enableDnsSupport;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getEnableDnsSupport}
         * @param enableDnsSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#enable_dns_support Vpc#enable_dns_support}.
         * @return {@code this}
         */
        public Builder enableDnsSupport(com.hashicorp.cdktf.IResolvable enableDnsSupport) {
            this.enableDnsSupport = enableDnsSupport;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getEnableNetworkAddressUsageMetrics}
         * @param enableNetworkAddressUsageMetrics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#enable_network_address_usage_metrics Vpc#enable_network_address_usage_metrics}.
         * @return {@code this}
         */
        public Builder enableNetworkAddressUsageMetrics(java.lang.Boolean enableNetworkAddressUsageMetrics) {
            this.enableNetworkAddressUsageMetrics = enableNetworkAddressUsageMetrics;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getEnableNetworkAddressUsageMetrics}
         * @param enableNetworkAddressUsageMetrics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#enable_network_address_usage_metrics Vpc#enable_network_address_usage_metrics}.
         * @return {@code this}
         */
        public Builder enableNetworkAddressUsageMetrics(com.hashicorp.cdktf.IResolvable enableNetworkAddressUsageMetrics) {
            this.enableNetworkAddressUsageMetrics = enableNetworkAddressUsageMetrics;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#id Vpc#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getInstanceTenancy}
         * @param instanceTenancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#instance_tenancy Vpc#instance_tenancy}.
         * @return {@code this}
         */
        public Builder instanceTenancy(java.lang.String instanceTenancy) {
            this.instanceTenancy = instanceTenancy;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getIpv4IpamPoolId}
         * @param ipv4IpamPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#ipv4_ipam_pool_id Vpc#ipv4_ipam_pool_id}.
         * @return {@code this}
         */
        public Builder ipv4IpamPoolId(java.lang.String ipv4IpamPoolId) {
            this.ipv4IpamPoolId = ipv4IpamPoolId;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getIpv4NetmaskLength}
         * @param ipv4NetmaskLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#ipv4_netmask_length Vpc#ipv4_netmask_length}.
         * @return {@code this}
         */
        public Builder ipv4NetmaskLength(java.lang.Number ipv4NetmaskLength) {
            this.ipv4NetmaskLength = ipv4NetmaskLength;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getIpv6CidrBlock}
         * @param ipv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#ipv6_cidr_block Vpc#ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder ipv6CidrBlock(java.lang.String ipv6CidrBlock) {
            this.ipv6CidrBlock = ipv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getIpv6CidrBlockNetworkBorderGroup}
         * @param ipv6CidrBlockNetworkBorderGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#ipv6_cidr_block_network_border_group Vpc#ipv6_cidr_block_network_border_group}.
         * @return {@code this}
         */
        public Builder ipv6CidrBlockNetworkBorderGroup(java.lang.String ipv6CidrBlockNetworkBorderGroup) {
            this.ipv6CidrBlockNetworkBorderGroup = ipv6CidrBlockNetworkBorderGroup;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getIpv6IpamPoolId}
         * @param ipv6IpamPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#ipv6_ipam_pool_id Vpc#ipv6_ipam_pool_id}.
         * @return {@code this}
         */
        public Builder ipv6IpamPoolId(java.lang.String ipv6IpamPoolId) {
            this.ipv6IpamPoolId = ipv6IpamPoolId;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getIpv6NetmaskLength}
         * @param ipv6NetmaskLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#ipv6_netmask_length Vpc#ipv6_netmask_length}.
         * @return {@code this}
         */
        public Builder ipv6NetmaskLength(java.lang.Number ipv6NetmaskLength) {
            this.ipv6NetmaskLength = ipv6NetmaskLength;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#tags Vpc#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc#tags_all Vpc#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getDependsOn}
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
         * Sets the value of {@link VpcConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VpcConfig#getProvisioners}
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
         * @return a new instance of {@link VpcConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcConfig {
        private final java.lang.Object assignGeneratedIpv6CidrBlock;
        private final java.lang.String cidrBlock;
        private final java.lang.Object enableDnsHostnames;
        private final java.lang.Object enableDnsSupport;
        private final java.lang.Object enableNetworkAddressUsageMetrics;
        private final java.lang.String id;
        private final java.lang.String instanceTenancy;
        private final java.lang.String ipv4IpamPoolId;
        private final java.lang.Number ipv4NetmaskLength;
        private final java.lang.String ipv6CidrBlock;
        private final java.lang.String ipv6CidrBlockNetworkBorderGroup;
        private final java.lang.String ipv6IpamPoolId;
        private final java.lang.Number ipv6NetmaskLength;
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
            this.assignGeneratedIpv6CidrBlock = software.amazon.jsii.Kernel.get(this, "assignGeneratedIpv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.cidrBlock = software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableDnsHostnames = software.amazon.jsii.Kernel.get(this, "enableDnsHostnames", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableDnsSupport = software.amazon.jsii.Kernel.get(this, "enableDnsSupport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableNetworkAddressUsageMetrics = software.amazon.jsii.Kernel.get(this, "enableNetworkAddressUsageMetrics", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceTenancy = software.amazon.jsii.Kernel.get(this, "instanceTenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv4IpamPoolId = software.amazon.jsii.Kernel.get(this, "ipv4IpamPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv4NetmaskLength = software.amazon.jsii.Kernel.get(this, "ipv4NetmaskLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ipv6CidrBlock = software.amazon.jsii.Kernel.get(this, "ipv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6CidrBlockNetworkBorderGroup = software.amazon.jsii.Kernel.get(this, "ipv6CidrBlockNetworkBorderGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6IpamPoolId = software.amazon.jsii.Kernel.get(this, "ipv6IpamPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6NetmaskLength = software.amazon.jsii.Kernel.get(this, "ipv6NetmaskLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.assignGeneratedIpv6CidrBlock = builder.assignGeneratedIpv6CidrBlock;
            this.cidrBlock = builder.cidrBlock;
            this.enableDnsHostnames = builder.enableDnsHostnames;
            this.enableDnsSupport = builder.enableDnsSupport;
            this.enableNetworkAddressUsageMetrics = builder.enableNetworkAddressUsageMetrics;
            this.id = builder.id;
            this.instanceTenancy = builder.instanceTenancy;
            this.ipv4IpamPoolId = builder.ipv4IpamPoolId;
            this.ipv4NetmaskLength = builder.ipv4NetmaskLength;
            this.ipv6CidrBlock = builder.ipv6CidrBlock;
            this.ipv6CidrBlockNetworkBorderGroup = builder.ipv6CidrBlockNetworkBorderGroup;
            this.ipv6IpamPoolId = builder.ipv6IpamPoolId;
            this.ipv6NetmaskLength = builder.ipv6NetmaskLength;
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
        public final java.lang.Object getAssignGeneratedIpv6CidrBlock() {
            return this.assignGeneratedIpv6CidrBlock;
        }

        @Override
        public final java.lang.String getCidrBlock() {
            return this.cidrBlock;
        }

        @Override
        public final java.lang.Object getEnableDnsHostnames() {
            return this.enableDnsHostnames;
        }

        @Override
        public final java.lang.Object getEnableDnsSupport() {
            return this.enableDnsSupport;
        }

        @Override
        public final java.lang.Object getEnableNetworkAddressUsageMetrics() {
            return this.enableNetworkAddressUsageMetrics;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInstanceTenancy() {
            return this.instanceTenancy;
        }

        @Override
        public final java.lang.String getIpv4IpamPoolId() {
            return this.ipv4IpamPoolId;
        }

        @Override
        public final java.lang.Number getIpv4NetmaskLength() {
            return this.ipv4NetmaskLength;
        }

        @Override
        public final java.lang.String getIpv6CidrBlock() {
            return this.ipv6CidrBlock;
        }

        @Override
        public final java.lang.String getIpv6CidrBlockNetworkBorderGroup() {
            return this.ipv6CidrBlockNetworkBorderGroup;
        }

        @Override
        public final java.lang.String getIpv6IpamPoolId() {
            return this.ipv6IpamPoolId;
        }

        @Override
        public final java.lang.Number getIpv6NetmaskLength() {
            return this.ipv6NetmaskLength;
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

            if (this.getAssignGeneratedIpv6CidrBlock() != null) {
                data.set("assignGeneratedIpv6CidrBlock", om.valueToTree(this.getAssignGeneratedIpv6CidrBlock()));
            }
            if (this.getCidrBlock() != null) {
                data.set("cidrBlock", om.valueToTree(this.getCidrBlock()));
            }
            if (this.getEnableDnsHostnames() != null) {
                data.set("enableDnsHostnames", om.valueToTree(this.getEnableDnsHostnames()));
            }
            if (this.getEnableDnsSupport() != null) {
                data.set("enableDnsSupport", om.valueToTree(this.getEnableDnsSupport()));
            }
            if (this.getEnableNetworkAddressUsageMetrics() != null) {
                data.set("enableNetworkAddressUsageMetrics", om.valueToTree(this.getEnableNetworkAddressUsageMetrics()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceTenancy() != null) {
                data.set("instanceTenancy", om.valueToTree(this.getInstanceTenancy()));
            }
            if (this.getIpv4IpamPoolId() != null) {
                data.set("ipv4IpamPoolId", om.valueToTree(this.getIpv4IpamPoolId()));
            }
            if (this.getIpv4NetmaskLength() != null) {
                data.set("ipv4NetmaskLength", om.valueToTree(this.getIpv4NetmaskLength()));
            }
            if (this.getIpv6CidrBlock() != null) {
                data.set("ipv6CidrBlock", om.valueToTree(this.getIpv6CidrBlock()));
            }
            if (this.getIpv6CidrBlockNetworkBorderGroup() != null) {
                data.set("ipv6CidrBlockNetworkBorderGroup", om.valueToTree(this.getIpv6CidrBlockNetworkBorderGroup()));
            }
            if (this.getIpv6IpamPoolId() != null) {
                data.set("ipv6IpamPoolId", om.valueToTree(this.getIpv6IpamPoolId()));
            }
            if (this.getIpv6NetmaskLength() != null) {
                data.set("ipv6NetmaskLength", om.valueToTree(this.getIpv6NetmaskLength()));
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
            struct.set("fqn", om.valueToTree("aws.vpc.VpcConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcConfig.Jsii$Proxy that = (VpcConfig.Jsii$Proxy) o;

            if (this.assignGeneratedIpv6CidrBlock != null ? !this.assignGeneratedIpv6CidrBlock.equals(that.assignGeneratedIpv6CidrBlock) : that.assignGeneratedIpv6CidrBlock != null) return false;
            if (this.cidrBlock != null ? !this.cidrBlock.equals(that.cidrBlock) : that.cidrBlock != null) return false;
            if (this.enableDnsHostnames != null ? !this.enableDnsHostnames.equals(that.enableDnsHostnames) : that.enableDnsHostnames != null) return false;
            if (this.enableDnsSupport != null ? !this.enableDnsSupport.equals(that.enableDnsSupport) : that.enableDnsSupport != null) return false;
            if (this.enableNetworkAddressUsageMetrics != null ? !this.enableNetworkAddressUsageMetrics.equals(that.enableNetworkAddressUsageMetrics) : that.enableNetworkAddressUsageMetrics != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceTenancy != null ? !this.instanceTenancy.equals(that.instanceTenancy) : that.instanceTenancy != null) return false;
            if (this.ipv4IpamPoolId != null ? !this.ipv4IpamPoolId.equals(that.ipv4IpamPoolId) : that.ipv4IpamPoolId != null) return false;
            if (this.ipv4NetmaskLength != null ? !this.ipv4NetmaskLength.equals(that.ipv4NetmaskLength) : that.ipv4NetmaskLength != null) return false;
            if (this.ipv6CidrBlock != null ? !this.ipv6CidrBlock.equals(that.ipv6CidrBlock) : that.ipv6CidrBlock != null) return false;
            if (this.ipv6CidrBlockNetworkBorderGroup != null ? !this.ipv6CidrBlockNetworkBorderGroup.equals(that.ipv6CidrBlockNetworkBorderGroup) : that.ipv6CidrBlockNetworkBorderGroup != null) return false;
            if (this.ipv6IpamPoolId != null ? !this.ipv6IpamPoolId.equals(that.ipv6IpamPoolId) : that.ipv6IpamPoolId != null) return false;
            if (this.ipv6NetmaskLength != null ? !this.ipv6NetmaskLength.equals(that.ipv6NetmaskLength) : that.ipv6NetmaskLength != null) return false;
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
            int result = this.assignGeneratedIpv6CidrBlock != null ? this.assignGeneratedIpv6CidrBlock.hashCode() : 0;
            result = 31 * result + (this.cidrBlock != null ? this.cidrBlock.hashCode() : 0);
            result = 31 * result + (this.enableDnsHostnames != null ? this.enableDnsHostnames.hashCode() : 0);
            result = 31 * result + (this.enableDnsSupport != null ? this.enableDnsSupport.hashCode() : 0);
            result = 31 * result + (this.enableNetworkAddressUsageMetrics != null ? this.enableNetworkAddressUsageMetrics.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceTenancy != null ? this.instanceTenancy.hashCode() : 0);
            result = 31 * result + (this.ipv4IpamPoolId != null ? this.ipv4IpamPoolId.hashCode() : 0);
            result = 31 * result + (this.ipv4NetmaskLength != null ? this.ipv4NetmaskLength.hashCode() : 0);
            result = 31 * result + (this.ipv6CidrBlock != null ? this.ipv6CidrBlock.hashCode() : 0);
            result = 31 * result + (this.ipv6CidrBlockNetworkBorderGroup != null ? this.ipv6CidrBlockNetworkBorderGroup.hashCode() : 0);
            result = 31 * result + (this.ipv6IpamPoolId != null ? this.ipv6IpamPoolId.hashCode() : 0);
            result = 31 * result + (this.ipv6NetmaskLength != null ? this.ipv6NetmaskLength.hashCode() : 0);
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
