package imports.aws.network_interface;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.941Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkInterface.NetworkInterfaceConfig")
@software.amazon.jsii.Jsii.Proxy(NetworkInterfaceConfig.Jsii$Proxy.class)
public interface NetworkInterfaceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#subnet_id NetworkInterface#subnet_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSubnetId();

    /**
     * attachment block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#attachment NetworkInterface#attachment}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAttachment() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#description NetworkInterface#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#enable_primary_ipv6 NetworkInterface#enable_primary_ipv6}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnablePrimaryIpv6() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#id NetworkInterface#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#interface_type NetworkInterface#interface_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInterfaceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv4_prefix_count NetworkInterface#ipv4_prefix_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIpv4PrefixCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv4_prefixes NetworkInterface#ipv4_prefixes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv4Prefixes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_count NetworkInterface#ipv6_address_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIpv6AddressCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_addresses NetworkInterface#ipv6_addresses}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6Addresses() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_list NetworkInterface#ipv6_address_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6AddressList() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_list_enabled NetworkInterface#ipv6_address_list_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIpv6AddressListEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_prefix_count NetworkInterface#ipv6_prefix_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIpv6PrefixCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_prefixes NetworkInterface#ipv6_prefixes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6Prefixes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip NetworkInterface#private_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateIp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip_list NetworkInterface#private_ip_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPrivateIpList() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip_list_enabled NetworkInterface#private_ip_list_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPrivateIpListEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ips NetworkInterface#private_ips}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPrivateIps() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ips_count NetworkInterface#private_ips_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPrivateIpsCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#security_groups NetworkInterface#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#source_dest_check NetworkInterface#source_dest_check}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSourceDestCheck() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#tags NetworkInterface#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#tags_all NetworkInterface#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkInterfaceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkInterfaceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkInterfaceConfig> {
        java.lang.String subnetId;
        java.lang.Object attachment;
        java.lang.String description;
        java.lang.Object enablePrimaryIpv6;
        java.lang.String id;
        java.lang.String interfaceType;
        java.lang.Number ipv4PrefixCount;
        java.util.List<java.lang.String> ipv4Prefixes;
        java.lang.Number ipv6AddressCount;
        java.util.List<java.lang.String> ipv6Addresses;
        java.util.List<java.lang.String> ipv6AddressList;
        java.lang.Object ipv6AddressListEnabled;
        java.lang.Number ipv6PrefixCount;
        java.util.List<java.lang.String> ipv6Prefixes;
        java.lang.String privateIp;
        java.util.List<java.lang.String> privateIpList;
        java.lang.Object privateIpListEnabled;
        java.util.List<java.lang.String> privateIps;
        java.lang.Number privateIpsCount;
        java.util.List<java.lang.String> securityGroups;
        java.lang.Object sourceDestCheck;
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
         * Sets the value of {@link NetworkInterfaceConfig#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#subnet_id NetworkInterface#subnet_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getAttachment}
         * @param attachment attachment block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#attachment NetworkInterface#attachment}
         * @return {@code this}
         */
        public Builder attachment(com.hashicorp.cdktf.IResolvable attachment) {
            this.attachment = attachment;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getAttachment}
         * @param attachment attachment block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#attachment NetworkInterface#attachment}
         * @return {@code this}
         */
        public Builder attachment(java.util.List<? extends imports.aws.network_interface.NetworkInterfaceAttachment> attachment) {
            this.attachment = attachment;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#description NetworkInterface#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getEnablePrimaryIpv6}
         * @param enablePrimaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#enable_primary_ipv6 NetworkInterface#enable_primary_ipv6}.
         * @return {@code this}
         */
        public Builder enablePrimaryIpv6(java.lang.Boolean enablePrimaryIpv6) {
            this.enablePrimaryIpv6 = enablePrimaryIpv6;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getEnablePrimaryIpv6}
         * @param enablePrimaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#enable_primary_ipv6 NetworkInterface#enable_primary_ipv6}.
         * @return {@code this}
         */
        public Builder enablePrimaryIpv6(com.hashicorp.cdktf.IResolvable enablePrimaryIpv6) {
            this.enablePrimaryIpv6 = enablePrimaryIpv6;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#id NetworkInterface#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getInterfaceType}
         * @param interfaceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#interface_type NetworkInterface#interface_type}.
         * @return {@code this}
         */
        public Builder interfaceType(java.lang.String interfaceType) {
            this.interfaceType = interfaceType;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getIpv4PrefixCount}
         * @param ipv4PrefixCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv4_prefix_count NetworkInterface#ipv4_prefix_count}.
         * @return {@code this}
         */
        public Builder ipv4PrefixCount(java.lang.Number ipv4PrefixCount) {
            this.ipv4PrefixCount = ipv4PrefixCount;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getIpv4Prefixes}
         * @param ipv4Prefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv4_prefixes NetworkInterface#ipv4_prefixes}.
         * @return {@code this}
         */
        public Builder ipv4Prefixes(java.util.List<java.lang.String> ipv4Prefixes) {
            this.ipv4Prefixes = ipv4Prefixes;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getIpv6AddressCount}
         * @param ipv6AddressCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_count NetworkInterface#ipv6_address_count}.
         * @return {@code this}
         */
        public Builder ipv6AddressCount(java.lang.Number ipv6AddressCount) {
            this.ipv6AddressCount = ipv6AddressCount;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getIpv6Addresses}
         * @param ipv6Addresses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_addresses NetworkInterface#ipv6_addresses}.
         * @return {@code this}
         */
        public Builder ipv6Addresses(java.util.List<java.lang.String> ipv6Addresses) {
            this.ipv6Addresses = ipv6Addresses;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getIpv6AddressList}
         * @param ipv6AddressList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_list NetworkInterface#ipv6_address_list}.
         * @return {@code this}
         */
        public Builder ipv6AddressList(java.util.List<java.lang.String> ipv6AddressList) {
            this.ipv6AddressList = ipv6AddressList;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getIpv6AddressListEnabled}
         * @param ipv6AddressListEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_list_enabled NetworkInterface#ipv6_address_list_enabled}.
         * @return {@code this}
         */
        public Builder ipv6AddressListEnabled(java.lang.Boolean ipv6AddressListEnabled) {
            this.ipv6AddressListEnabled = ipv6AddressListEnabled;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getIpv6AddressListEnabled}
         * @param ipv6AddressListEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_address_list_enabled NetworkInterface#ipv6_address_list_enabled}.
         * @return {@code this}
         */
        public Builder ipv6AddressListEnabled(com.hashicorp.cdktf.IResolvable ipv6AddressListEnabled) {
            this.ipv6AddressListEnabled = ipv6AddressListEnabled;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getIpv6PrefixCount}
         * @param ipv6PrefixCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_prefix_count NetworkInterface#ipv6_prefix_count}.
         * @return {@code this}
         */
        public Builder ipv6PrefixCount(java.lang.Number ipv6PrefixCount) {
            this.ipv6PrefixCount = ipv6PrefixCount;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getIpv6Prefixes}
         * @param ipv6Prefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#ipv6_prefixes NetworkInterface#ipv6_prefixes}.
         * @return {@code this}
         */
        public Builder ipv6Prefixes(java.util.List<java.lang.String> ipv6Prefixes) {
            this.ipv6Prefixes = ipv6Prefixes;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getPrivateIp}
         * @param privateIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip NetworkInterface#private_ip}.
         * @return {@code this}
         */
        public Builder privateIp(java.lang.String privateIp) {
            this.privateIp = privateIp;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getPrivateIpList}
         * @param privateIpList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip_list NetworkInterface#private_ip_list}.
         * @return {@code this}
         */
        public Builder privateIpList(java.util.List<java.lang.String> privateIpList) {
            this.privateIpList = privateIpList;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getPrivateIpListEnabled}
         * @param privateIpListEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip_list_enabled NetworkInterface#private_ip_list_enabled}.
         * @return {@code this}
         */
        public Builder privateIpListEnabled(java.lang.Boolean privateIpListEnabled) {
            this.privateIpListEnabled = privateIpListEnabled;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getPrivateIpListEnabled}
         * @param privateIpListEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ip_list_enabled NetworkInterface#private_ip_list_enabled}.
         * @return {@code this}
         */
        public Builder privateIpListEnabled(com.hashicorp.cdktf.IResolvable privateIpListEnabled) {
            this.privateIpListEnabled = privateIpListEnabled;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getPrivateIps}
         * @param privateIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ips NetworkInterface#private_ips}.
         * @return {@code this}
         */
        public Builder privateIps(java.util.List<java.lang.String> privateIps) {
            this.privateIps = privateIps;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getPrivateIpsCount}
         * @param privateIpsCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#private_ips_count NetworkInterface#private_ips_count}.
         * @return {@code this}
         */
        public Builder privateIpsCount(java.lang.Number privateIpsCount) {
            this.privateIpsCount = privateIpsCount;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#security_groups NetworkInterface#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getSourceDestCheck}
         * @param sourceDestCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#source_dest_check NetworkInterface#source_dest_check}.
         * @return {@code this}
         */
        public Builder sourceDestCheck(java.lang.Boolean sourceDestCheck) {
            this.sourceDestCheck = sourceDestCheck;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getSourceDestCheck}
         * @param sourceDestCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#source_dest_check NetworkInterface#source_dest_check}.
         * @return {@code this}
         */
        public Builder sourceDestCheck(com.hashicorp.cdktf.IResolvable sourceDestCheck) {
            this.sourceDestCheck = sourceDestCheck;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#tags NetworkInterface#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_interface#tags_all NetworkInterface#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getDependsOn}
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
         * Sets the value of {@link NetworkInterfaceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link NetworkInterfaceConfig#getProvisioners}
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
         * @return a new instance of {@link NetworkInterfaceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkInterfaceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkInterfaceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkInterfaceConfig {
        private final java.lang.String subnetId;
        private final java.lang.Object attachment;
        private final java.lang.String description;
        private final java.lang.Object enablePrimaryIpv6;
        private final java.lang.String id;
        private final java.lang.String interfaceType;
        private final java.lang.Number ipv4PrefixCount;
        private final java.util.List<java.lang.String> ipv4Prefixes;
        private final java.lang.Number ipv6AddressCount;
        private final java.util.List<java.lang.String> ipv6Addresses;
        private final java.util.List<java.lang.String> ipv6AddressList;
        private final java.lang.Object ipv6AddressListEnabled;
        private final java.lang.Number ipv6PrefixCount;
        private final java.util.List<java.lang.String> ipv6Prefixes;
        private final java.lang.String privateIp;
        private final java.util.List<java.lang.String> privateIpList;
        private final java.lang.Object privateIpListEnabled;
        private final java.util.List<java.lang.String> privateIps;
        private final java.lang.Number privateIpsCount;
        private final java.util.List<java.lang.String> securityGroups;
        private final java.lang.Object sourceDestCheck;
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
            this.subnetId = software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.attachment = software.amazon.jsii.Kernel.get(this, "attachment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enablePrimaryIpv6 = software.amazon.jsii.Kernel.get(this, "enablePrimaryIpv6", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.interfaceType = software.amazon.jsii.Kernel.get(this, "interfaceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv4PrefixCount = software.amazon.jsii.Kernel.get(this, "ipv4PrefixCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ipv4Prefixes = software.amazon.jsii.Kernel.get(this, "ipv4Prefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.ipv6AddressCount = software.amazon.jsii.Kernel.get(this, "ipv6AddressCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ipv6Addresses = software.amazon.jsii.Kernel.get(this, "ipv6Addresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.ipv6AddressList = software.amazon.jsii.Kernel.get(this, "ipv6AddressList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.ipv6AddressListEnabled = software.amazon.jsii.Kernel.get(this, "ipv6AddressListEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ipv6PrefixCount = software.amazon.jsii.Kernel.get(this, "ipv6PrefixCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ipv6Prefixes = software.amazon.jsii.Kernel.get(this, "ipv6Prefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.privateIp = software.amazon.jsii.Kernel.get(this, "privateIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.privateIpList = software.amazon.jsii.Kernel.get(this, "privateIpList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.privateIpListEnabled = software.amazon.jsii.Kernel.get(this, "privateIpListEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.privateIps = software.amazon.jsii.Kernel.get(this, "privateIps", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.privateIpsCount = software.amazon.jsii.Kernel.get(this, "privateIpsCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.sourceDestCheck = software.amazon.jsii.Kernel.get(this, "sourceDestCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.subnetId = java.util.Objects.requireNonNull(builder.subnetId, "subnetId is required");
            this.attachment = builder.attachment;
            this.description = builder.description;
            this.enablePrimaryIpv6 = builder.enablePrimaryIpv6;
            this.id = builder.id;
            this.interfaceType = builder.interfaceType;
            this.ipv4PrefixCount = builder.ipv4PrefixCount;
            this.ipv4Prefixes = builder.ipv4Prefixes;
            this.ipv6AddressCount = builder.ipv6AddressCount;
            this.ipv6Addresses = builder.ipv6Addresses;
            this.ipv6AddressList = builder.ipv6AddressList;
            this.ipv6AddressListEnabled = builder.ipv6AddressListEnabled;
            this.ipv6PrefixCount = builder.ipv6PrefixCount;
            this.ipv6Prefixes = builder.ipv6Prefixes;
            this.privateIp = builder.privateIp;
            this.privateIpList = builder.privateIpList;
            this.privateIpListEnabled = builder.privateIpListEnabled;
            this.privateIps = builder.privateIps;
            this.privateIpsCount = builder.privateIpsCount;
            this.securityGroups = builder.securityGroups;
            this.sourceDestCheck = builder.sourceDestCheck;
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
        public final java.lang.String getSubnetId() {
            return this.subnetId;
        }

        @Override
        public final java.lang.Object getAttachment() {
            return this.attachment;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Object getEnablePrimaryIpv6() {
            return this.enablePrimaryIpv6;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInterfaceType() {
            return this.interfaceType;
        }

        @Override
        public final java.lang.Number getIpv4PrefixCount() {
            return this.ipv4PrefixCount;
        }

        @Override
        public final java.util.List<java.lang.String> getIpv4Prefixes() {
            return this.ipv4Prefixes;
        }

        @Override
        public final java.lang.Number getIpv6AddressCount() {
            return this.ipv6AddressCount;
        }

        @Override
        public final java.util.List<java.lang.String> getIpv6Addresses() {
            return this.ipv6Addresses;
        }

        @Override
        public final java.util.List<java.lang.String> getIpv6AddressList() {
            return this.ipv6AddressList;
        }

        @Override
        public final java.lang.Object getIpv6AddressListEnabled() {
            return this.ipv6AddressListEnabled;
        }

        @Override
        public final java.lang.Number getIpv6PrefixCount() {
            return this.ipv6PrefixCount;
        }

        @Override
        public final java.util.List<java.lang.String> getIpv6Prefixes() {
            return this.ipv6Prefixes;
        }

        @Override
        public final java.lang.String getPrivateIp() {
            return this.privateIp;
        }

        @Override
        public final java.util.List<java.lang.String> getPrivateIpList() {
            return this.privateIpList;
        }

        @Override
        public final java.lang.Object getPrivateIpListEnabled() {
            return this.privateIpListEnabled;
        }

        @Override
        public final java.util.List<java.lang.String> getPrivateIps() {
            return this.privateIps;
        }

        @Override
        public final java.lang.Number getPrivateIpsCount() {
            return this.privateIpsCount;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroups() {
            return this.securityGroups;
        }

        @Override
        public final java.lang.Object getSourceDestCheck() {
            return this.sourceDestCheck;
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

            data.set("subnetId", om.valueToTree(this.getSubnetId()));
            if (this.getAttachment() != null) {
                data.set("attachment", om.valueToTree(this.getAttachment()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getEnablePrimaryIpv6() != null) {
                data.set("enablePrimaryIpv6", om.valueToTree(this.getEnablePrimaryIpv6()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInterfaceType() != null) {
                data.set("interfaceType", om.valueToTree(this.getInterfaceType()));
            }
            if (this.getIpv4PrefixCount() != null) {
                data.set("ipv4PrefixCount", om.valueToTree(this.getIpv4PrefixCount()));
            }
            if (this.getIpv4Prefixes() != null) {
                data.set("ipv4Prefixes", om.valueToTree(this.getIpv4Prefixes()));
            }
            if (this.getIpv6AddressCount() != null) {
                data.set("ipv6AddressCount", om.valueToTree(this.getIpv6AddressCount()));
            }
            if (this.getIpv6Addresses() != null) {
                data.set("ipv6Addresses", om.valueToTree(this.getIpv6Addresses()));
            }
            if (this.getIpv6AddressList() != null) {
                data.set("ipv6AddressList", om.valueToTree(this.getIpv6AddressList()));
            }
            if (this.getIpv6AddressListEnabled() != null) {
                data.set("ipv6AddressListEnabled", om.valueToTree(this.getIpv6AddressListEnabled()));
            }
            if (this.getIpv6PrefixCount() != null) {
                data.set("ipv6PrefixCount", om.valueToTree(this.getIpv6PrefixCount()));
            }
            if (this.getIpv6Prefixes() != null) {
                data.set("ipv6Prefixes", om.valueToTree(this.getIpv6Prefixes()));
            }
            if (this.getPrivateIp() != null) {
                data.set("privateIp", om.valueToTree(this.getPrivateIp()));
            }
            if (this.getPrivateIpList() != null) {
                data.set("privateIpList", om.valueToTree(this.getPrivateIpList()));
            }
            if (this.getPrivateIpListEnabled() != null) {
                data.set("privateIpListEnabled", om.valueToTree(this.getPrivateIpListEnabled()));
            }
            if (this.getPrivateIps() != null) {
                data.set("privateIps", om.valueToTree(this.getPrivateIps()));
            }
            if (this.getPrivateIpsCount() != null) {
                data.set("privateIpsCount", om.valueToTree(this.getPrivateIpsCount()));
            }
            if (this.getSecurityGroups() != null) {
                data.set("securityGroups", om.valueToTree(this.getSecurityGroups()));
            }
            if (this.getSourceDestCheck() != null) {
                data.set("sourceDestCheck", om.valueToTree(this.getSourceDestCheck()));
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
            struct.set("fqn", om.valueToTree("aws.networkInterface.NetworkInterfaceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkInterfaceConfig.Jsii$Proxy that = (NetworkInterfaceConfig.Jsii$Proxy) o;

            if (!subnetId.equals(that.subnetId)) return false;
            if (this.attachment != null ? !this.attachment.equals(that.attachment) : that.attachment != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.enablePrimaryIpv6 != null ? !this.enablePrimaryIpv6.equals(that.enablePrimaryIpv6) : that.enablePrimaryIpv6 != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.interfaceType != null ? !this.interfaceType.equals(that.interfaceType) : that.interfaceType != null) return false;
            if (this.ipv4PrefixCount != null ? !this.ipv4PrefixCount.equals(that.ipv4PrefixCount) : that.ipv4PrefixCount != null) return false;
            if (this.ipv4Prefixes != null ? !this.ipv4Prefixes.equals(that.ipv4Prefixes) : that.ipv4Prefixes != null) return false;
            if (this.ipv6AddressCount != null ? !this.ipv6AddressCount.equals(that.ipv6AddressCount) : that.ipv6AddressCount != null) return false;
            if (this.ipv6Addresses != null ? !this.ipv6Addresses.equals(that.ipv6Addresses) : that.ipv6Addresses != null) return false;
            if (this.ipv6AddressList != null ? !this.ipv6AddressList.equals(that.ipv6AddressList) : that.ipv6AddressList != null) return false;
            if (this.ipv6AddressListEnabled != null ? !this.ipv6AddressListEnabled.equals(that.ipv6AddressListEnabled) : that.ipv6AddressListEnabled != null) return false;
            if (this.ipv6PrefixCount != null ? !this.ipv6PrefixCount.equals(that.ipv6PrefixCount) : that.ipv6PrefixCount != null) return false;
            if (this.ipv6Prefixes != null ? !this.ipv6Prefixes.equals(that.ipv6Prefixes) : that.ipv6Prefixes != null) return false;
            if (this.privateIp != null ? !this.privateIp.equals(that.privateIp) : that.privateIp != null) return false;
            if (this.privateIpList != null ? !this.privateIpList.equals(that.privateIpList) : that.privateIpList != null) return false;
            if (this.privateIpListEnabled != null ? !this.privateIpListEnabled.equals(that.privateIpListEnabled) : that.privateIpListEnabled != null) return false;
            if (this.privateIps != null ? !this.privateIps.equals(that.privateIps) : that.privateIps != null) return false;
            if (this.privateIpsCount != null ? !this.privateIpsCount.equals(that.privateIpsCount) : that.privateIpsCount != null) return false;
            if (this.securityGroups != null ? !this.securityGroups.equals(that.securityGroups) : that.securityGroups != null) return false;
            if (this.sourceDestCheck != null ? !this.sourceDestCheck.equals(that.sourceDestCheck) : that.sourceDestCheck != null) return false;
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
            int result = this.subnetId.hashCode();
            result = 31 * result + (this.attachment != null ? this.attachment.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.enablePrimaryIpv6 != null ? this.enablePrimaryIpv6.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.interfaceType != null ? this.interfaceType.hashCode() : 0);
            result = 31 * result + (this.ipv4PrefixCount != null ? this.ipv4PrefixCount.hashCode() : 0);
            result = 31 * result + (this.ipv4Prefixes != null ? this.ipv4Prefixes.hashCode() : 0);
            result = 31 * result + (this.ipv6AddressCount != null ? this.ipv6AddressCount.hashCode() : 0);
            result = 31 * result + (this.ipv6Addresses != null ? this.ipv6Addresses.hashCode() : 0);
            result = 31 * result + (this.ipv6AddressList != null ? this.ipv6AddressList.hashCode() : 0);
            result = 31 * result + (this.ipv6AddressListEnabled != null ? this.ipv6AddressListEnabled.hashCode() : 0);
            result = 31 * result + (this.ipv6PrefixCount != null ? this.ipv6PrefixCount.hashCode() : 0);
            result = 31 * result + (this.ipv6Prefixes != null ? this.ipv6Prefixes.hashCode() : 0);
            result = 31 * result + (this.privateIp != null ? this.privateIp.hashCode() : 0);
            result = 31 * result + (this.privateIpList != null ? this.privateIpList.hashCode() : 0);
            result = 31 * result + (this.privateIpListEnabled != null ? this.privateIpListEnabled.hashCode() : 0);
            result = 31 * result + (this.privateIps != null ? this.privateIps.hashCode() : 0);
            result = 31 * result + (this.privateIpsCount != null ? this.privateIpsCount.hashCode() : 0);
            result = 31 * result + (this.securityGroups != null ? this.securityGroups.hashCode() : 0);
            result = 31 * result + (this.sourceDestCheck != null ? this.sourceDestCheck.hashCode() : 0);
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
