package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.522Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateNetworkInterfaces")
@software.amazon.jsii.Jsii.Proxy(LaunchTemplateNetworkInterfaces.Jsii$Proxy.class)
public interface LaunchTemplateNetworkInterfaces extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#associate_carrier_ip_address LaunchTemplate#associate_carrier_ip_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAssociateCarrierIpAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#associate_public_ip_address LaunchTemplate#associate_public_ip_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAssociatePublicIpAddress() {
        return null;
    }

    /**
     * connection_tracking_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#connection_tracking_specification LaunchTemplate#connection_tracking_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification getConnectionTrackingSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#delete_on_termination LaunchTemplate#delete_on_termination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeleteOnTermination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#description LaunchTemplate#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#device_index LaunchTemplate#device_index}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDeviceIndex() {
        return null;
    }

    /**
     * ena_srd_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ena_srd_specification LaunchTemplate#ena_srd_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecification getEnaSrdSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#interface_type LaunchTemplate#interface_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInterfaceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv4_address_count LaunchTemplate#ipv4_address_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIpv4AddressCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv4_addresses LaunchTemplate#ipv4_addresses}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv4Addresses() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv4_prefix_count LaunchTemplate#ipv4_prefix_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIpv4PrefixCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv4_prefixes LaunchTemplate#ipv4_prefixes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv4Prefixes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv6_address_count LaunchTemplate#ipv6_address_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIpv6AddressCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv6_addresses LaunchTemplate#ipv6_addresses}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6Addresses() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv6_prefix_count LaunchTemplate#ipv6_prefix_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIpv6PrefixCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv6_prefixes LaunchTemplate#ipv6_prefixes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6Prefixes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#network_card_index LaunchTemplate#network_card_index}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNetworkCardIndex() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#network_interface_id LaunchTemplate#network_interface_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetworkInterfaceId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#primary_ipv6 LaunchTemplate#primary_ipv6}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrimaryIpv6() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#private_ip_address LaunchTemplate#private_ip_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateIpAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#security_groups LaunchTemplate#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#subnet_id LaunchTemplate#subnet_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchTemplateNetworkInterfaces}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchTemplateNetworkInterfaces}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchTemplateNetworkInterfaces> {
        java.lang.String associateCarrierIpAddress;
        java.lang.String associatePublicIpAddress;
        imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification connectionTrackingSpecification;
        java.lang.String deleteOnTermination;
        java.lang.String description;
        java.lang.Number deviceIndex;
        imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecification enaSrdSpecification;
        java.lang.String interfaceType;
        java.lang.Number ipv4AddressCount;
        java.util.List<java.lang.String> ipv4Addresses;
        java.lang.Number ipv4PrefixCount;
        java.util.List<java.lang.String> ipv4Prefixes;
        java.lang.Number ipv6AddressCount;
        java.util.List<java.lang.String> ipv6Addresses;
        java.lang.Number ipv6PrefixCount;
        java.util.List<java.lang.String> ipv6Prefixes;
        java.lang.Number networkCardIndex;
        java.lang.String networkInterfaceId;
        java.lang.String primaryIpv6;
        java.lang.String privateIpAddress;
        java.util.List<java.lang.String> securityGroups;
        java.lang.String subnetId;

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getAssociateCarrierIpAddress}
         * @param associateCarrierIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#associate_carrier_ip_address LaunchTemplate#associate_carrier_ip_address}.
         * @return {@code this}
         */
        public Builder associateCarrierIpAddress(java.lang.String associateCarrierIpAddress) {
            this.associateCarrierIpAddress = associateCarrierIpAddress;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getAssociatePublicIpAddress}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#associate_public_ip_address LaunchTemplate#associate_public_ip_address}.
         * @return {@code this}
         */
        public Builder associatePublicIpAddress(java.lang.String associatePublicIpAddress) {
            this.associatePublicIpAddress = associatePublicIpAddress;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getConnectionTrackingSpecification}
         * @param connectionTrackingSpecification connection_tracking_specification block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#connection_tracking_specification LaunchTemplate#connection_tracking_specification}
         * @return {@code this}
         */
        public Builder connectionTrackingSpecification(imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification connectionTrackingSpecification) {
            this.connectionTrackingSpecification = connectionTrackingSpecification;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getDeleteOnTermination}
         * @param deleteOnTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#delete_on_termination LaunchTemplate#delete_on_termination}.
         * @return {@code this}
         */
        public Builder deleteOnTermination(java.lang.String deleteOnTermination) {
            this.deleteOnTermination = deleteOnTermination;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#description LaunchTemplate#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getDeviceIndex}
         * @param deviceIndex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#device_index LaunchTemplate#device_index}.
         * @return {@code this}
         */
        public Builder deviceIndex(java.lang.Number deviceIndex) {
            this.deviceIndex = deviceIndex;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getEnaSrdSpecification}
         * @param enaSrdSpecification ena_srd_specification block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ena_srd_specification LaunchTemplate#ena_srd_specification}
         * @return {@code this}
         */
        public Builder enaSrdSpecification(imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecification enaSrdSpecification) {
            this.enaSrdSpecification = enaSrdSpecification;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getInterfaceType}
         * @param interfaceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#interface_type LaunchTemplate#interface_type}.
         * @return {@code this}
         */
        public Builder interfaceType(java.lang.String interfaceType) {
            this.interfaceType = interfaceType;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getIpv4AddressCount}
         * @param ipv4AddressCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv4_address_count LaunchTemplate#ipv4_address_count}.
         * @return {@code this}
         */
        public Builder ipv4AddressCount(java.lang.Number ipv4AddressCount) {
            this.ipv4AddressCount = ipv4AddressCount;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getIpv4Addresses}
         * @param ipv4Addresses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv4_addresses LaunchTemplate#ipv4_addresses}.
         * @return {@code this}
         */
        public Builder ipv4Addresses(java.util.List<java.lang.String> ipv4Addresses) {
            this.ipv4Addresses = ipv4Addresses;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getIpv4PrefixCount}
         * @param ipv4PrefixCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv4_prefix_count LaunchTemplate#ipv4_prefix_count}.
         * @return {@code this}
         */
        public Builder ipv4PrefixCount(java.lang.Number ipv4PrefixCount) {
            this.ipv4PrefixCount = ipv4PrefixCount;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getIpv4Prefixes}
         * @param ipv4Prefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv4_prefixes LaunchTemplate#ipv4_prefixes}.
         * @return {@code this}
         */
        public Builder ipv4Prefixes(java.util.List<java.lang.String> ipv4Prefixes) {
            this.ipv4Prefixes = ipv4Prefixes;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getIpv6AddressCount}
         * @param ipv6AddressCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv6_address_count LaunchTemplate#ipv6_address_count}.
         * @return {@code this}
         */
        public Builder ipv6AddressCount(java.lang.Number ipv6AddressCount) {
            this.ipv6AddressCount = ipv6AddressCount;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getIpv6Addresses}
         * @param ipv6Addresses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv6_addresses LaunchTemplate#ipv6_addresses}.
         * @return {@code this}
         */
        public Builder ipv6Addresses(java.util.List<java.lang.String> ipv6Addresses) {
            this.ipv6Addresses = ipv6Addresses;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getIpv6PrefixCount}
         * @param ipv6PrefixCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv6_prefix_count LaunchTemplate#ipv6_prefix_count}.
         * @return {@code this}
         */
        public Builder ipv6PrefixCount(java.lang.Number ipv6PrefixCount) {
            this.ipv6PrefixCount = ipv6PrefixCount;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getIpv6Prefixes}
         * @param ipv6Prefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ipv6_prefixes LaunchTemplate#ipv6_prefixes}.
         * @return {@code this}
         */
        public Builder ipv6Prefixes(java.util.List<java.lang.String> ipv6Prefixes) {
            this.ipv6Prefixes = ipv6Prefixes;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getNetworkCardIndex}
         * @param networkCardIndex Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#network_card_index LaunchTemplate#network_card_index}.
         * @return {@code this}
         */
        public Builder networkCardIndex(java.lang.Number networkCardIndex) {
            this.networkCardIndex = networkCardIndex;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getNetworkInterfaceId}
         * @param networkInterfaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#network_interface_id LaunchTemplate#network_interface_id}.
         * @return {@code this}
         */
        public Builder networkInterfaceId(java.lang.String networkInterfaceId) {
            this.networkInterfaceId = networkInterfaceId;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getPrimaryIpv6}
         * @param primaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#primary_ipv6 LaunchTemplate#primary_ipv6}.
         * @return {@code this}
         */
        public Builder primaryIpv6(java.lang.String primaryIpv6) {
            this.primaryIpv6 = primaryIpv6;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getPrivateIpAddress}
         * @param privateIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#private_ip_address LaunchTemplate#private_ip_address}.
         * @return {@code this}
         */
        public Builder privateIpAddress(java.lang.String privateIpAddress) {
            this.privateIpAddress = privateIpAddress;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#security_groups LaunchTemplate#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfaces#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#subnet_id LaunchTemplate#subnet_id}.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LaunchTemplateNetworkInterfaces}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchTemplateNetworkInterfaces build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchTemplateNetworkInterfaces}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchTemplateNetworkInterfaces {
        private final java.lang.String associateCarrierIpAddress;
        private final java.lang.String associatePublicIpAddress;
        private final imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification connectionTrackingSpecification;
        private final java.lang.String deleteOnTermination;
        private final java.lang.String description;
        private final java.lang.Number deviceIndex;
        private final imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecification enaSrdSpecification;
        private final java.lang.String interfaceType;
        private final java.lang.Number ipv4AddressCount;
        private final java.util.List<java.lang.String> ipv4Addresses;
        private final java.lang.Number ipv4PrefixCount;
        private final java.util.List<java.lang.String> ipv4Prefixes;
        private final java.lang.Number ipv6AddressCount;
        private final java.util.List<java.lang.String> ipv6Addresses;
        private final java.lang.Number ipv6PrefixCount;
        private final java.util.List<java.lang.String> ipv6Prefixes;
        private final java.lang.Number networkCardIndex;
        private final java.lang.String networkInterfaceId;
        private final java.lang.String primaryIpv6;
        private final java.lang.String privateIpAddress;
        private final java.util.List<java.lang.String> securityGroups;
        private final java.lang.String subnetId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.associateCarrierIpAddress = software.amazon.jsii.Kernel.get(this, "associateCarrierIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.associatePublicIpAddress = software.amazon.jsii.Kernel.get(this, "associatePublicIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectionTrackingSpecification = software.amazon.jsii.Kernel.get(this, "connectionTrackingSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification.class));
            this.deleteOnTermination = software.amazon.jsii.Kernel.get(this, "deleteOnTermination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceIndex = software.amazon.jsii.Kernel.get(this, "deviceIndex", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.enaSrdSpecification = software.amazon.jsii.Kernel.get(this, "enaSrdSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecification.class));
            this.interfaceType = software.amazon.jsii.Kernel.get(this, "interfaceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv4AddressCount = software.amazon.jsii.Kernel.get(this, "ipv4AddressCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ipv4Addresses = software.amazon.jsii.Kernel.get(this, "ipv4Addresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.ipv4PrefixCount = software.amazon.jsii.Kernel.get(this, "ipv4PrefixCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ipv4Prefixes = software.amazon.jsii.Kernel.get(this, "ipv4Prefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.ipv6AddressCount = software.amazon.jsii.Kernel.get(this, "ipv6AddressCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ipv6Addresses = software.amazon.jsii.Kernel.get(this, "ipv6Addresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.ipv6PrefixCount = software.amazon.jsii.Kernel.get(this, "ipv6PrefixCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ipv6Prefixes = software.amazon.jsii.Kernel.get(this, "ipv6Prefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.networkCardIndex = software.amazon.jsii.Kernel.get(this, "networkCardIndex", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.networkInterfaceId = software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.primaryIpv6 = software.amazon.jsii.Kernel.get(this, "primaryIpv6", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.privateIpAddress = software.amazon.jsii.Kernel.get(this, "privateIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnetId = software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.associateCarrierIpAddress = builder.associateCarrierIpAddress;
            this.associatePublicIpAddress = builder.associatePublicIpAddress;
            this.connectionTrackingSpecification = builder.connectionTrackingSpecification;
            this.deleteOnTermination = builder.deleteOnTermination;
            this.description = builder.description;
            this.deviceIndex = builder.deviceIndex;
            this.enaSrdSpecification = builder.enaSrdSpecification;
            this.interfaceType = builder.interfaceType;
            this.ipv4AddressCount = builder.ipv4AddressCount;
            this.ipv4Addresses = builder.ipv4Addresses;
            this.ipv4PrefixCount = builder.ipv4PrefixCount;
            this.ipv4Prefixes = builder.ipv4Prefixes;
            this.ipv6AddressCount = builder.ipv6AddressCount;
            this.ipv6Addresses = builder.ipv6Addresses;
            this.ipv6PrefixCount = builder.ipv6PrefixCount;
            this.ipv6Prefixes = builder.ipv6Prefixes;
            this.networkCardIndex = builder.networkCardIndex;
            this.networkInterfaceId = builder.networkInterfaceId;
            this.primaryIpv6 = builder.primaryIpv6;
            this.privateIpAddress = builder.privateIpAddress;
            this.securityGroups = builder.securityGroups;
            this.subnetId = builder.subnetId;
        }

        @Override
        public final java.lang.String getAssociateCarrierIpAddress() {
            return this.associateCarrierIpAddress;
        }

        @Override
        public final java.lang.String getAssociatePublicIpAddress() {
            return this.associatePublicIpAddress;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateNetworkInterfacesConnectionTrackingSpecification getConnectionTrackingSpecification() {
            return this.connectionTrackingSpecification;
        }

        @Override
        public final java.lang.String getDeleteOnTermination() {
            return this.deleteOnTermination;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Number getDeviceIndex() {
            return this.deviceIndex;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecification getEnaSrdSpecification() {
            return this.enaSrdSpecification;
        }

        @Override
        public final java.lang.String getInterfaceType() {
            return this.interfaceType;
        }

        @Override
        public final java.lang.Number getIpv4AddressCount() {
            return this.ipv4AddressCount;
        }

        @Override
        public final java.util.List<java.lang.String> getIpv4Addresses() {
            return this.ipv4Addresses;
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
        public final java.lang.Number getIpv6PrefixCount() {
            return this.ipv6PrefixCount;
        }

        @Override
        public final java.util.List<java.lang.String> getIpv6Prefixes() {
            return this.ipv6Prefixes;
        }

        @Override
        public final java.lang.Number getNetworkCardIndex() {
            return this.networkCardIndex;
        }

        @Override
        public final java.lang.String getNetworkInterfaceId() {
            return this.networkInterfaceId;
        }

        @Override
        public final java.lang.String getPrimaryIpv6() {
            return this.primaryIpv6;
        }

        @Override
        public final java.lang.String getPrivateIpAddress() {
            return this.privateIpAddress;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroups() {
            return this.securityGroups;
        }

        @Override
        public final java.lang.String getSubnetId() {
            return this.subnetId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAssociateCarrierIpAddress() != null) {
                data.set("associateCarrierIpAddress", om.valueToTree(this.getAssociateCarrierIpAddress()));
            }
            if (this.getAssociatePublicIpAddress() != null) {
                data.set("associatePublicIpAddress", om.valueToTree(this.getAssociatePublicIpAddress()));
            }
            if (this.getConnectionTrackingSpecification() != null) {
                data.set("connectionTrackingSpecification", om.valueToTree(this.getConnectionTrackingSpecification()));
            }
            if (this.getDeleteOnTermination() != null) {
                data.set("deleteOnTermination", om.valueToTree(this.getDeleteOnTermination()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDeviceIndex() != null) {
                data.set("deviceIndex", om.valueToTree(this.getDeviceIndex()));
            }
            if (this.getEnaSrdSpecification() != null) {
                data.set("enaSrdSpecification", om.valueToTree(this.getEnaSrdSpecification()));
            }
            if (this.getInterfaceType() != null) {
                data.set("interfaceType", om.valueToTree(this.getInterfaceType()));
            }
            if (this.getIpv4AddressCount() != null) {
                data.set("ipv4AddressCount", om.valueToTree(this.getIpv4AddressCount()));
            }
            if (this.getIpv4Addresses() != null) {
                data.set("ipv4Addresses", om.valueToTree(this.getIpv4Addresses()));
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
            if (this.getIpv6PrefixCount() != null) {
                data.set("ipv6PrefixCount", om.valueToTree(this.getIpv6PrefixCount()));
            }
            if (this.getIpv6Prefixes() != null) {
                data.set("ipv6Prefixes", om.valueToTree(this.getIpv6Prefixes()));
            }
            if (this.getNetworkCardIndex() != null) {
                data.set("networkCardIndex", om.valueToTree(this.getNetworkCardIndex()));
            }
            if (this.getNetworkInterfaceId() != null) {
                data.set("networkInterfaceId", om.valueToTree(this.getNetworkInterfaceId()));
            }
            if (this.getPrimaryIpv6() != null) {
                data.set("primaryIpv6", om.valueToTree(this.getPrimaryIpv6()));
            }
            if (this.getPrivateIpAddress() != null) {
                data.set("privateIpAddress", om.valueToTree(this.getPrivateIpAddress()));
            }
            if (this.getSecurityGroups() != null) {
                data.set("securityGroups", om.valueToTree(this.getSecurityGroups()));
            }
            if (this.getSubnetId() != null) {
                data.set("subnetId", om.valueToTree(this.getSubnetId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.launchTemplate.LaunchTemplateNetworkInterfaces"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchTemplateNetworkInterfaces.Jsii$Proxy that = (LaunchTemplateNetworkInterfaces.Jsii$Proxy) o;

            if (this.associateCarrierIpAddress != null ? !this.associateCarrierIpAddress.equals(that.associateCarrierIpAddress) : that.associateCarrierIpAddress != null) return false;
            if (this.associatePublicIpAddress != null ? !this.associatePublicIpAddress.equals(that.associatePublicIpAddress) : that.associatePublicIpAddress != null) return false;
            if (this.connectionTrackingSpecification != null ? !this.connectionTrackingSpecification.equals(that.connectionTrackingSpecification) : that.connectionTrackingSpecification != null) return false;
            if (this.deleteOnTermination != null ? !this.deleteOnTermination.equals(that.deleteOnTermination) : that.deleteOnTermination != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.deviceIndex != null ? !this.deviceIndex.equals(that.deviceIndex) : that.deviceIndex != null) return false;
            if (this.enaSrdSpecification != null ? !this.enaSrdSpecification.equals(that.enaSrdSpecification) : that.enaSrdSpecification != null) return false;
            if (this.interfaceType != null ? !this.interfaceType.equals(that.interfaceType) : that.interfaceType != null) return false;
            if (this.ipv4AddressCount != null ? !this.ipv4AddressCount.equals(that.ipv4AddressCount) : that.ipv4AddressCount != null) return false;
            if (this.ipv4Addresses != null ? !this.ipv4Addresses.equals(that.ipv4Addresses) : that.ipv4Addresses != null) return false;
            if (this.ipv4PrefixCount != null ? !this.ipv4PrefixCount.equals(that.ipv4PrefixCount) : that.ipv4PrefixCount != null) return false;
            if (this.ipv4Prefixes != null ? !this.ipv4Prefixes.equals(that.ipv4Prefixes) : that.ipv4Prefixes != null) return false;
            if (this.ipv6AddressCount != null ? !this.ipv6AddressCount.equals(that.ipv6AddressCount) : that.ipv6AddressCount != null) return false;
            if (this.ipv6Addresses != null ? !this.ipv6Addresses.equals(that.ipv6Addresses) : that.ipv6Addresses != null) return false;
            if (this.ipv6PrefixCount != null ? !this.ipv6PrefixCount.equals(that.ipv6PrefixCount) : that.ipv6PrefixCount != null) return false;
            if (this.ipv6Prefixes != null ? !this.ipv6Prefixes.equals(that.ipv6Prefixes) : that.ipv6Prefixes != null) return false;
            if (this.networkCardIndex != null ? !this.networkCardIndex.equals(that.networkCardIndex) : that.networkCardIndex != null) return false;
            if (this.networkInterfaceId != null ? !this.networkInterfaceId.equals(that.networkInterfaceId) : that.networkInterfaceId != null) return false;
            if (this.primaryIpv6 != null ? !this.primaryIpv6.equals(that.primaryIpv6) : that.primaryIpv6 != null) return false;
            if (this.privateIpAddress != null ? !this.privateIpAddress.equals(that.privateIpAddress) : that.privateIpAddress != null) return false;
            if (this.securityGroups != null ? !this.securityGroups.equals(that.securityGroups) : that.securityGroups != null) return false;
            return this.subnetId != null ? this.subnetId.equals(that.subnetId) : that.subnetId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.associateCarrierIpAddress != null ? this.associateCarrierIpAddress.hashCode() : 0;
            result = 31 * result + (this.associatePublicIpAddress != null ? this.associatePublicIpAddress.hashCode() : 0);
            result = 31 * result + (this.connectionTrackingSpecification != null ? this.connectionTrackingSpecification.hashCode() : 0);
            result = 31 * result + (this.deleteOnTermination != null ? this.deleteOnTermination.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.deviceIndex != null ? this.deviceIndex.hashCode() : 0);
            result = 31 * result + (this.enaSrdSpecification != null ? this.enaSrdSpecification.hashCode() : 0);
            result = 31 * result + (this.interfaceType != null ? this.interfaceType.hashCode() : 0);
            result = 31 * result + (this.ipv4AddressCount != null ? this.ipv4AddressCount.hashCode() : 0);
            result = 31 * result + (this.ipv4Addresses != null ? this.ipv4Addresses.hashCode() : 0);
            result = 31 * result + (this.ipv4PrefixCount != null ? this.ipv4PrefixCount.hashCode() : 0);
            result = 31 * result + (this.ipv4Prefixes != null ? this.ipv4Prefixes.hashCode() : 0);
            result = 31 * result + (this.ipv6AddressCount != null ? this.ipv6AddressCount.hashCode() : 0);
            result = 31 * result + (this.ipv6Addresses != null ? this.ipv6Addresses.hashCode() : 0);
            result = 31 * result + (this.ipv6PrefixCount != null ? this.ipv6PrefixCount.hashCode() : 0);
            result = 31 * result + (this.ipv6Prefixes != null ? this.ipv6Prefixes.hashCode() : 0);
            result = 31 * result + (this.networkCardIndex != null ? this.networkCardIndex.hashCode() : 0);
            result = 31 * result + (this.networkInterfaceId != null ? this.networkInterfaceId.hashCode() : 0);
            result = 31 * result + (this.primaryIpv6 != null ? this.primaryIpv6.hashCode() : 0);
            result = 31 * result + (this.privateIpAddress != null ? this.privateIpAddress.hashCode() : 0);
            result = 31 * result + (this.securityGroups != null ? this.securityGroups.hashCode() : 0);
            result = 31 * result + (this.subnetId != null ? this.subnetId.hashCode() : 0);
            return result;
        }
    }
}
