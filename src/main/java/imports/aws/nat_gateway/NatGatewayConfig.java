package imports.aws.nat_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.928Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.natGateway.NatGatewayConfig")
@software.amazon.jsii.Jsii.Proxy(NatGatewayConfig.Jsii$Proxy.class)
public interface NatGatewayConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#subnet_id NatGateway#subnet_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSubnetId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#allocation_id NatGateway#allocation_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAllocationId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#connectivity_type NatGateway#connectivity_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectivityType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#id NatGateway#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#private_ip NatGateway#private_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateIp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#secondary_allocation_ids NatGateway#secondary_allocation_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecondaryAllocationIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#secondary_private_ip_address_count NatGateway#secondary_private_ip_address_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSecondaryPrivateIpAddressCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#secondary_private_ip_addresses NatGateway#secondary_private_ip_addresses}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecondaryPrivateIpAddresses() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#tags NatGateway#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#tags_all NatGateway#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#timeouts NatGateway#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.nat_gateway.NatGatewayTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NatGatewayConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NatGatewayConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NatGatewayConfig> {
        java.lang.String subnetId;
        java.lang.String allocationId;
        java.lang.String connectivityType;
        java.lang.String id;
        java.lang.String privateIp;
        java.util.List<java.lang.String> secondaryAllocationIds;
        java.lang.Number secondaryPrivateIpAddressCount;
        java.util.List<java.lang.String> secondaryPrivateIpAddresses;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.nat_gateway.NatGatewayTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link NatGatewayConfig#getSubnetId}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#subnet_id NatGateway#subnet_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetId(java.lang.String subnetId) {
            this.subnetId = subnetId;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getAllocationId}
         * @param allocationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#allocation_id NatGateway#allocation_id}.
         * @return {@code this}
         */
        public Builder allocationId(java.lang.String allocationId) {
            this.allocationId = allocationId;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getConnectivityType}
         * @param connectivityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#connectivity_type NatGateway#connectivity_type}.
         * @return {@code this}
         */
        public Builder connectivityType(java.lang.String connectivityType) {
            this.connectivityType = connectivityType;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#id NatGateway#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getPrivateIp}
         * @param privateIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#private_ip NatGateway#private_ip}.
         * @return {@code this}
         */
        public Builder privateIp(java.lang.String privateIp) {
            this.privateIp = privateIp;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getSecondaryAllocationIds}
         * @param secondaryAllocationIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#secondary_allocation_ids NatGateway#secondary_allocation_ids}.
         * @return {@code this}
         */
        public Builder secondaryAllocationIds(java.util.List<java.lang.String> secondaryAllocationIds) {
            this.secondaryAllocationIds = secondaryAllocationIds;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getSecondaryPrivateIpAddressCount}
         * @param secondaryPrivateIpAddressCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#secondary_private_ip_address_count NatGateway#secondary_private_ip_address_count}.
         * @return {@code this}
         */
        public Builder secondaryPrivateIpAddressCount(java.lang.Number secondaryPrivateIpAddressCount) {
            this.secondaryPrivateIpAddressCount = secondaryPrivateIpAddressCount;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getSecondaryPrivateIpAddresses}
         * @param secondaryPrivateIpAddresses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#secondary_private_ip_addresses NatGateway#secondary_private_ip_addresses}.
         * @return {@code this}
         */
        public Builder secondaryPrivateIpAddresses(java.util.List<java.lang.String> secondaryPrivateIpAddresses) {
            this.secondaryPrivateIpAddresses = secondaryPrivateIpAddresses;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#tags NatGateway#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#tags_all NatGateway#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/nat_gateway#timeouts NatGateway#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.nat_gateway.NatGatewayTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getDependsOn}
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
         * Sets the value of {@link NatGatewayConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link NatGatewayConfig#getProvisioners}
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
         * @return a new instance of {@link NatGatewayConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NatGatewayConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NatGatewayConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NatGatewayConfig {
        private final java.lang.String subnetId;
        private final java.lang.String allocationId;
        private final java.lang.String connectivityType;
        private final java.lang.String id;
        private final java.lang.String privateIp;
        private final java.util.List<java.lang.String> secondaryAllocationIds;
        private final java.lang.Number secondaryPrivateIpAddressCount;
        private final java.util.List<java.lang.String> secondaryPrivateIpAddresses;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.nat_gateway.NatGatewayTimeouts timeouts;
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
            this.allocationId = software.amazon.jsii.Kernel.get(this, "allocationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectivityType = software.amazon.jsii.Kernel.get(this, "connectivityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.privateIp = software.amazon.jsii.Kernel.get(this, "privateIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secondaryAllocationIds = software.amazon.jsii.Kernel.get(this, "secondaryAllocationIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.secondaryPrivateIpAddressCount = software.amazon.jsii.Kernel.get(this, "secondaryPrivateIpAddressCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.secondaryPrivateIpAddresses = software.amazon.jsii.Kernel.get(this, "secondaryPrivateIpAddresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.nat_gateway.NatGatewayTimeouts.class));
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
            this.allocationId = builder.allocationId;
            this.connectivityType = builder.connectivityType;
            this.id = builder.id;
            this.privateIp = builder.privateIp;
            this.secondaryAllocationIds = builder.secondaryAllocationIds;
            this.secondaryPrivateIpAddressCount = builder.secondaryPrivateIpAddressCount;
            this.secondaryPrivateIpAddresses = builder.secondaryPrivateIpAddresses;
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
        public final java.lang.String getSubnetId() {
            return this.subnetId;
        }

        @Override
        public final java.lang.String getAllocationId() {
            return this.allocationId;
        }

        @Override
        public final java.lang.String getConnectivityType() {
            return this.connectivityType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getPrivateIp() {
            return this.privateIp;
        }

        @Override
        public final java.util.List<java.lang.String> getSecondaryAllocationIds() {
            return this.secondaryAllocationIds;
        }

        @Override
        public final java.lang.Number getSecondaryPrivateIpAddressCount() {
            return this.secondaryPrivateIpAddressCount;
        }

        @Override
        public final java.util.List<java.lang.String> getSecondaryPrivateIpAddresses() {
            return this.secondaryPrivateIpAddresses;
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
        public final imports.aws.nat_gateway.NatGatewayTimeouts getTimeouts() {
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

            data.set("subnetId", om.valueToTree(this.getSubnetId()));
            if (this.getAllocationId() != null) {
                data.set("allocationId", om.valueToTree(this.getAllocationId()));
            }
            if (this.getConnectivityType() != null) {
                data.set("connectivityType", om.valueToTree(this.getConnectivityType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPrivateIp() != null) {
                data.set("privateIp", om.valueToTree(this.getPrivateIp()));
            }
            if (this.getSecondaryAllocationIds() != null) {
                data.set("secondaryAllocationIds", om.valueToTree(this.getSecondaryAllocationIds()));
            }
            if (this.getSecondaryPrivateIpAddressCount() != null) {
                data.set("secondaryPrivateIpAddressCount", om.valueToTree(this.getSecondaryPrivateIpAddressCount()));
            }
            if (this.getSecondaryPrivateIpAddresses() != null) {
                data.set("secondaryPrivateIpAddresses", om.valueToTree(this.getSecondaryPrivateIpAddresses()));
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
            struct.set("fqn", om.valueToTree("aws.natGateway.NatGatewayConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NatGatewayConfig.Jsii$Proxy that = (NatGatewayConfig.Jsii$Proxy) o;

            if (!subnetId.equals(that.subnetId)) return false;
            if (this.allocationId != null ? !this.allocationId.equals(that.allocationId) : that.allocationId != null) return false;
            if (this.connectivityType != null ? !this.connectivityType.equals(that.connectivityType) : that.connectivityType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.privateIp != null ? !this.privateIp.equals(that.privateIp) : that.privateIp != null) return false;
            if (this.secondaryAllocationIds != null ? !this.secondaryAllocationIds.equals(that.secondaryAllocationIds) : that.secondaryAllocationIds != null) return false;
            if (this.secondaryPrivateIpAddressCount != null ? !this.secondaryPrivateIpAddressCount.equals(that.secondaryPrivateIpAddressCount) : that.secondaryPrivateIpAddressCount != null) return false;
            if (this.secondaryPrivateIpAddresses != null ? !this.secondaryPrivateIpAddresses.equals(that.secondaryPrivateIpAddresses) : that.secondaryPrivateIpAddresses != null) return false;
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
            int result = this.subnetId.hashCode();
            result = 31 * result + (this.allocationId != null ? this.allocationId.hashCode() : 0);
            result = 31 * result + (this.connectivityType != null ? this.connectivityType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.privateIp != null ? this.privateIp.hashCode() : 0);
            result = 31 * result + (this.secondaryAllocationIds != null ? this.secondaryAllocationIds.hashCode() : 0);
            result = 31 * result + (this.secondaryPrivateIpAddressCount != null ? this.secondaryPrivateIpAddressCount.hashCode() : 0);
            result = 31 * result + (this.secondaryPrivateIpAddresses != null ? this.secondaryPrivateIpAddresses.hashCode() : 0);
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
