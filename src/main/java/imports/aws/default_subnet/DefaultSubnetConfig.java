package imports.aws.default_subnet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.984Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.defaultSubnet.DefaultSubnetConfig")
@software.amazon.jsii.Jsii.Proxy(DefaultSubnetConfig.Jsii$Proxy.class)
public interface DefaultSubnetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#availability_zone DefaultSubnet#availability_zone}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZone();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#assign_ipv6_address_on_creation DefaultSubnet#assign_ipv6_address_on_creation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAssignIpv6AddressOnCreation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#customer_owned_ipv4_pool DefaultSubnet#customer_owned_ipv4_pool}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomerOwnedIpv4Pool() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_dns64 DefaultSubnet#enable_dns64}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableDns64() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_aaaa_record_on_launch DefaultSubnet#enable_resource_name_dns_aaaa_record_on_launch}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableResourceNameDnsAaaaRecordOnLaunch() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_a_record_on_launch DefaultSubnet#enable_resource_name_dns_a_record_on_launch}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableResourceNameDnsARecordOnLaunch() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#force_destroy DefaultSubnet#force_destroy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceDestroy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#id DefaultSubnet#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#ipv6_cidr_block DefaultSubnet#ipv6_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#ipv6_native DefaultSubnet#ipv6_native}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIpv6Native() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_customer_owned_ip_on_launch DefaultSubnet#map_customer_owned_ip_on_launch}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMapCustomerOwnedIpOnLaunch() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_public_ip_on_launch DefaultSubnet#map_public_ip_on_launch}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMapPublicIpOnLaunch() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#private_dns_hostname_type_on_launch DefaultSubnet#private_dns_hostname_type_on_launch}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateDnsHostnameTypeOnLaunch() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#tags DefaultSubnet#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#tags_all DefaultSubnet#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#timeouts DefaultSubnet#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.default_subnet.DefaultSubnetTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DefaultSubnetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DefaultSubnetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DefaultSubnetConfig> {
        java.lang.String availabilityZone;
        java.lang.Object assignIpv6AddressOnCreation;
        java.lang.String customerOwnedIpv4Pool;
        java.lang.Object enableDns64;
        java.lang.Object enableResourceNameDnsAaaaRecordOnLaunch;
        java.lang.Object enableResourceNameDnsARecordOnLaunch;
        java.lang.Object forceDestroy;
        java.lang.String id;
        java.lang.String ipv6CidrBlock;
        java.lang.Object ipv6Native;
        java.lang.Object mapCustomerOwnedIpOnLaunch;
        java.lang.Object mapPublicIpOnLaunch;
        java.lang.String privateDnsHostnameTypeOnLaunch;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.default_subnet.DefaultSubnetTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DefaultSubnetConfig#getAvailabilityZone}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#availability_zone DefaultSubnet#availability_zone}. This parameter is required.
         * @return {@code this}
         */
        public Builder availabilityZone(java.lang.String availabilityZone) {
            this.availabilityZone = availabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getAssignIpv6AddressOnCreation}
         * @param assignIpv6AddressOnCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#assign_ipv6_address_on_creation DefaultSubnet#assign_ipv6_address_on_creation}.
         * @return {@code this}
         */
        public Builder assignIpv6AddressOnCreation(java.lang.Boolean assignIpv6AddressOnCreation) {
            this.assignIpv6AddressOnCreation = assignIpv6AddressOnCreation;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getAssignIpv6AddressOnCreation}
         * @param assignIpv6AddressOnCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#assign_ipv6_address_on_creation DefaultSubnet#assign_ipv6_address_on_creation}.
         * @return {@code this}
         */
        public Builder assignIpv6AddressOnCreation(com.hashicorp.cdktf.IResolvable assignIpv6AddressOnCreation) {
            this.assignIpv6AddressOnCreation = assignIpv6AddressOnCreation;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getCustomerOwnedIpv4Pool}
         * @param customerOwnedIpv4Pool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#customer_owned_ipv4_pool DefaultSubnet#customer_owned_ipv4_pool}.
         * @return {@code this}
         */
        public Builder customerOwnedIpv4Pool(java.lang.String customerOwnedIpv4Pool) {
            this.customerOwnedIpv4Pool = customerOwnedIpv4Pool;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getEnableDns64}
         * @param enableDns64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_dns64 DefaultSubnet#enable_dns64}.
         * @return {@code this}
         */
        public Builder enableDns64(java.lang.Boolean enableDns64) {
            this.enableDns64 = enableDns64;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getEnableDns64}
         * @param enableDns64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_dns64 DefaultSubnet#enable_dns64}.
         * @return {@code this}
         */
        public Builder enableDns64(com.hashicorp.cdktf.IResolvable enableDns64) {
            this.enableDns64 = enableDns64;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getEnableResourceNameDnsAaaaRecordOnLaunch}
         * @param enableResourceNameDnsAaaaRecordOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_aaaa_record_on_launch DefaultSubnet#enable_resource_name_dns_aaaa_record_on_launch}.
         * @return {@code this}
         */
        public Builder enableResourceNameDnsAaaaRecordOnLaunch(java.lang.Boolean enableResourceNameDnsAaaaRecordOnLaunch) {
            this.enableResourceNameDnsAaaaRecordOnLaunch = enableResourceNameDnsAaaaRecordOnLaunch;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getEnableResourceNameDnsAaaaRecordOnLaunch}
         * @param enableResourceNameDnsAaaaRecordOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_aaaa_record_on_launch DefaultSubnet#enable_resource_name_dns_aaaa_record_on_launch}.
         * @return {@code this}
         */
        public Builder enableResourceNameDnsAaaaRecordOnLaunch(com.hashicorp.cdktf.IResolvable enableResourceNameDnsAaaaRecordOnLaunch) {
            this.enableResourceNameDnsAaaaRecordOnLaunch = enableResourceNameDnsAaaaRecordOnLaunch;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getEnableResourceNameDnsARecordOnLaunch}
         * @param enableResourceNameDnsARecordOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_a_record_on_launch DefaultSubnet#enable_resource_name_dns_a_record_on_launch}.
         * @return {@code this}
         */
        public Builder enableResourceNameDnsARecordOnLaunch(java.lang.Boolean enableResourceNameDnsARecordOnLaunch) {
            this.enableResourceNameDnsARecordOnLaunch = enableResourceNameDnsARecordOnLaunch;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getEnableResourceNameDnsARecordOnLaunch}
         * @param enableResourceNameDnsARecordOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#enable_resource_name_dns_a_record_on_launch DefaultSubnet#enable_resource_name_dns_a_record_on_launch}.
         * @return {@code this}
         */
        public Builder enableResourceNameDnsARecordOnLaunch(com.hashicorp.cdktf.IResolvable enableResourceNameDnsARecordOnLaunch) {
            this.enableResourceNameDnsARecordOnLaunch = enableResourceNameDnsARecordOnLaunch;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#force_destroy DefaultSubnet#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(java.lang.Boolean forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getForceDestroy}
         * @param forceDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#force_destroy DefaultSubnet#force_destroy}.
         * @return {@code this}
         */
        public Builder forceDestroy(com.hashicorp.cdktf.IResolvable forceDestroy) {
            this.forceDestroy = forceDestroy;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#id DefaultSubnet#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getIpv6CidrBlock}
         * @param ipv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#ipv6_cidr_block DefaultSubnet#ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder ipv6CidrBlock(java.lang.String ipv6CidrBlock) {
            this.ipv6CidrBlock = ipv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getIpv6Native}
         * @param ipv6Native Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#ipv6_native DefaultSubnet#ipv6_native}.
         * @return {@code this}
         */
        public Builder ipv6Native(java.lang.Boolean ipv6Native) {
            this.ipv6Native = ipv6Native;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getIpv6Native}
         * @param ipv6Native Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#ipv6_native DefaultSubnet#ipv6_native}.
         * @return {@code this}
         */
        public Builder ipv6Native(com.hashicorp.cdktf.IResolvable ipv6Native) {
            this.ipv6Native = ipv6Native;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getMapCustomerOwnedIpOnLaunch}
         * @param mapCustomerOwnedIpOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_customer_owned_ip_on_launch DefaultSubnet#map_customer_owned_ip_on_launch}.
         * @return {@code this}
         */
        public Builder mapCustomerOwnedIpOnLaunch(java.lang.Boolean mapCustomerOwnedIpOnLaunch) {
            this.mapCustomerOwnedIpOnLaunch = mapCustomerOwnedIpOnLaunch;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getMapCustomerOwnedIpOnLaunch}
         * @param mapCustomerOwnedIpOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_customer_owned_ip_on_launch DefaultSubnet#map_customer_owned_ip_on_launch}.
         * @return {@code this}
         */
        public Builder mapCustomerOwnedIpOnLaunch(com.hashicorp.cdktf.IResolvable mapCustomerOwnedIpOnLaunch) {
            this.mapCustomerOwnedIpOnLaunch = mapCustomerOwnedIpOnLaunch;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getMapPublicIpOnLaunch}
         * @param mapPublicIpOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_public_ip_on_launch DefaultSubnet#map_public_ip_on_launch}.
         * @return {@code this}
         */
        public Builder mapPublicIpOnLaunch(java.lang.Boolean mapPublicIpOnLaunch) {
            this.mapPublicIpOnLaunch = mapPublicIpOnLaunch;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getMapPublicIpOnLaunch}
         * @param mapPublicIpOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#map_public_ip_on_launch DefaultSubnet#map_public_ip_on_launch}.
         * @return {@code this}
         */
        public Builder mapPublicIpOnLaunch(com.hashicorp.cdktf.IResolvable mapPublicIpOnLaunch) {
            this.mapPublicIpOnLaunch = mapPublicIpOnLaunch;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getPrivateDnsHostnameTypeOnLaunch}
         * @param privateDnsHostnameTypeOnLaunch Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#private_dns_hostname_type_on_launch DefaultSubnet#private_dns_hostname_type_on_launch}.
         * @return {@code this}
         */
        public Builder privateDnsHostnameTypeOnLaunch(java.lang.String privateDnsHostnameTypeOnLaunch) {
            this.privateDnsHostnameTypeOnLaunch = privateDnsHostnameTypeOnLaunch;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#tags DefaultSubnet#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#tags_all DefaultSubnet#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/default_subnet#timeouts DefaultSubnet#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.default_subnet.DefaultSubnetTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getDependsOn}
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
         * Sets the value of {@link DefaultSubnetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DefaultSubnetConfig#getProvisioners}
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
         * @return a new instance of {@link DefaultSubnetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DefaultSubnetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DefaultSubnetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DefaultSubnetConfig {
        private final java.lang.String availabilityZone;
        private final java.lang.Object assignIpv6AddressOnCreation;
        private final java.lang.String customerOwnedIpv4Pool;
        private final java.lang.Object enableDns64;
        private final java.lang.Object enableResourceNameDnsAaaaRecordOnLaunch;
        private final java.lang.Object enableResourceNameDnsARecordOnLaunch;
        private final java.lang.Object forceDestroy;
        private final java.lang.String id;
        private final java.lang.String ipv6CidrBlock;
        private final java.lang.Object ipv6Native;
        private final java.lang.Object mapCustomerOwnedIpOnLaunch;
        private final java.lang.Object mapPublicIpOnLaunch;
        private final java.lang.String privateDnsHostnameTypeOnLaunch;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.default_subnet.DefaultSubnetTimeouts timeouts;
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
            this.availabilityZone = software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.assignIpv6AddressOnCreation = software.amazon.jsii.Kernel.get(this, "assignIpv6AddressOnCreation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.customerOwnedIpv4Pool = software.amazon.jsii.Kernel.get(this, "customerOwnedIpv4Pool", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableDns64 = software.amazon.jsii.Kernel.get(this, "enableDns64", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableResourceNameDnsAaaaRecordOnLaunch = software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsAaaaRecordOnLaunch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableResourceNameDnsARecordOnLaunch = software.amazon.jsii.Kernel.get(this, "enableResourceNameDnsARecordOnLaunch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.forceDestroy = software.amazon.jsii.Kernel.get(this, "forceDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6CidrBlock = software.amazon.jsii.Kernel.get(this, "ipv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6Native = software.amazon.jsii.Kernel.get(this, "ipv6Native", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.mapCustomerOwnedIpOnLaunch = software.amazon.jsii.Kernel.get(this, "mapCustomerOwnedIpOnLaunch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.mapPublicIpOnLaunch = software.amazon.jsii.Kernel.get(this, "mapPublicIpOnLaunch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.privateDnsHostnameTypeOnLaunch = software.amazon.jsii.Kernel.get(this, "privateDnsHostnameTypeOnLaunch", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.default_subnet.DefaultSubnetTimeouts.class));
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
            this.availabilityZone = java.util.Objects.requireNonNull(builder.availabilityZone, "availabilityZone is required");
            this.assignIpv6AddressOnCreation = builder.assignIpv6AddressOnCreation;
            this.customerOwnedIpv4Pool = builder.customerOwnedIpv4Pool;
            this.enableDns64 = builder.enableDns64;
            this.enableResourceNameDnsAaaaRecordOnLaunch = builder.enableResourceNameDnsAaaaRecordOnLaunch;
            this.enableResourceNameDnsARecordOnLaunch = builder.enableResourceNameDnsARecordOnLaunch;
            this.forceDestroy = builder.forceDestroy;
            this.id = builder.id;
            this.ipv6CidrBlock = builder.ipv6CidrBlock;
            this.ipv6Native = builder.ipv6Native;
            this.mapCustomerOwnedIpOnLaunch = builder.mapCustomerOwnedIpOnLaunch;
            this.mapPublicIpOnLaunch = builder.mapPublicIpOnLaunch;
            this.privateDnsHostnameTypeOnLaunch = builder.privateDnsHostnameTypeOnLaunch;
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
        public final java.lang.String getAvailabilityZone() {
            return this.availabilityZone;
        }

        @Override
        public final java.lang.Object getAssignIpv6AddressOnCreation() {
            return this.assignIpv6AddressOnCreation;
        }

        @Override
        public final java.lang.String getCustomerOwnedIpv4Pool() {
            return this.customerOwnedIpv4Pool;
        }

        @Override
        public final java.lang.Object getEnableDns64() {
            return this.enableDns64;
        }

        @Override
        public final java.lang.Object getEnableResourceNameDnsAaaaRecordOnLaunch() {
            return this.enableResourceNameDnsAaaaRecordOnLaunch;
        }

        @Override
        public final java.lang.Object getEnableResourceNameDnsARecordOnLaunch() {
            return this.enableResourceNameDnsARecordOnLaunch;
        }

        @Override
        public final java.lang.Object getForceDestroy() {
            return this.forceDestroy;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIpv6CidrBlock() {
            return this.ipv6CidrBlock;
        }

        @Override
        public final java.lang.Object getIpv6Native() {
            return this.ipv6Native;
        }

        @Override
        public final java.lang.Object getMapCustomerOwnedIpOnLaunch() {
            return this.mapCustomerOwnedIpOnLaunch;
        }

        @Override
        public final java.lang.Object getMapPublicIpOnLaunch() {
            return this.mapPublicIpOnLaunch;
        }

        @Override
        public final java.lang.String getPrivateDnsHostnameTypeOnLaunch() {
            return this.privateDnsHostnameTypeOnLaunch;
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
        public final imports.aws.default_subnet.DefaultSubnetTimeouts getTimeouts() {
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

            data.set("availabilityZone", om.valueToTree(this.getAvailabilityZone()));
            if (this.getAssignIpv6AddressOnCreation() != null) {
                data.set("assignIpv6AddressOnCreation", om.valueToTree(this.getAssignIpv6AddressOnCreation()));
            }
            if (this.getCustomerOwnedIpv4Pool() != null) {
                data.set("customerOwnedIpv4Pool", om.valueToTree(this.getCustomerOwnedIpv4Pool()));
            }
            if (this.getEnableDns64() != null) {
                data.set("enableDns64", om.valueToTree(this.getEnableDns64()));
            }
            if (this.getEnableResourceNameDnsAaaaRecordOnLaunch() != null) {
                data.set("enableResourceNameDnsAaaaRecordOnLaunch", om.valueToTree(this.getEnableResourceNameDnsAaaaRecordOnLaunch()));
            }
            if (this.getEnableResourceNameDnsARecordOnLaunch() != null) {
                data.set("enableResourceNameDnsARecordOnLaunch", om.valueToTree(this.getEnableResourceNameDnsARecordOnLaunch()));
            }
            if (this.getForceDestroy() != null) {
                data.set("forceDestroy", om.valueToTree(this.getForceDestroy()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpv6CidrBlock() != null) {
                data.set("ipv6CidrBlock", om.valueToTree(this.getIpv6CidrBlock()));
            }
            if (this.getIpv6Native() != null) {
                data.set("ipv6Native", om.valueToTree(this.getIpv6Native()));
            }
            if (this.getMapCustomerOwnedIpOnLaunch() != null) {
                data.set("mapCustomerOwnedIpOnLaunch", om.valueToTree(this.getMapCustomerOwnedIpOnLaunch()));
            }
            if (this.getMapPublicIpOnLaunch() != null) {
                data.set("mapPublicIpOnLaunch", om.valueToTree(this.getMapPublicIpOnLaunch()));
            }
            if (this.getPrivateDnsHostnameTypeOnLaunch() != null) {
                data.set("privateDnsHostnameTypeOnLaunch", om.valueToTree(this.getPrivateDnsHostnameTypeOnLaunch()));
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
            struct.set("fqn", om.valueToTree("aws.defaultSubnet.DefaultSubnetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DefaultSubnetConfig.Jsii$Proxy that = (DefaultSubnetConfig.Jsii$Proxy) o;

            if (!availabilityZone.equals(that.availabilityZone)) return false;
            if (this.assignIpv6AddressOnCreation != null ? !this.assignIpv6AddressOnCreation.equals(that.assignIpv6AddressOnCreation) : that.assignIpv6AddressOnCreation != null) return false;
            if (this.customerOwnedIpv4Pool != null ? !this.customerOwnedIpv4Pool.equals(that.customerOwnedIpv4Pool) : that.customerOwnedIpv4Pool != null) return false;
            if (this.enableDns64 != null ? !this.enableDns64.equals(that.enableDns64) : that.enableDns64 != null) return false;
            if (this.enableResourceNameDnsAaaaRecordOnLaunch != null ? !this.enableResourceNameDnsAaaaRecordOnLaunch.equals(that.enableResourceNameDnsAaaaRecordOnLaunch) : that.enableResourceNameDnsAaaaRecordOnLaunch != null) return false;
            if (this.enableResourceNameDnsARecordOnLaunch != null ? !this.enableResourceNameDnsARecordOnLaunch.equals(that.enableResourceNameDnsARecordOnLaunch) : that.enableResourceNameDnsARecordOnLaunch != null) return false;
            if (this.forceDestroy != null ? !this.forceDestroy.equals(that.forceDestroy) : that.forceDestroy != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipv6CidrBlock != null ? !this.ipv6CidrBlock.equals(that.ipv6CidrBlock) : that.ipv6CidrBlock != null) return false;
            if (this.ipv6Native != null ? !this.ipv6Native.equals(that.ipv6Native) : that.ipv6Native != null) return false;
            if (this.mapCustomerOwnedIpOnLaunch != null ? !this.mapCustomerOwnedIpOnLaunch.equals(that.mapCustomerOwnedIpOnLaunch) : that.mapCustomerOwnedIpOnLaunch != null) return false;
            if (this.mapPublicIpOnLaunch != null ? !this.mapPublicIpOnLaunch.equals(that.mapPublicIpOnLaunch) : that.mapPublicIpOnLaunch != null) return false;
            if (this.privateDnsHostnameTypeOnLaunch != null ? !this.privateDnsHostnameTypeOnLaunch.equals(that.privateDnsHostnameTypeOnLaunch) : that.privateDnsHostnameTypeOnLaunch != null) return false;
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
            int result = this.availabilityZone.hashCode();
            result = 31 * result + (this.assignIpv6AddressOnCreation != null ? this.assignIpv6AddressOnCreation.hashCode() : 0);
            result = 31 * result + (this.customerOwnedIpv4Pool != null ? this.customerOwnedIpv4Pool.hashCode() : 0);
            result = 31 * result + (this.enableDns64 != null ? this.enableDns64.hashCode() : 0);
            result = 31 * result + (this.enableResourceNameDnsAaaaRecordOnLaunch != null ? this.enableResourceNameDnsAaaaRecordOnLaunch.hashCode() : 0);
            result = 31 * result + (this.enableResourceNameDnsARecordOnLaunch != null ? this.enableResourceNameDnsARecordOnLaunch.hashCode() : 0);
            result = 31 * result + (this.forceDestroy != null ? this.forceDestroy.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipv6CidrBlock != null ? this.ipv6CidrBlock.hashCode() : 0);
            result = 31 * result + (this.ipv6Native != null ? this.ipv6Native.hashCode() : 0);
            result = 31 * result + (this.mapCustomerOwnedIpOnLaunch != null ? this.mapCustomerOwnedIpOnLaunch.hashCode() : 0);
            result = 31 * result + (this.mapPublicIpOnLaunch != null ? this.mapPublicIpOnLaunch.hashCode() : 0);
            result = 31 * result + (this.privateDnsHostnameTypeOnLaunch != null ? this.privateDnsHostnameTypeOnLaunch.hashCode() : 0);
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
