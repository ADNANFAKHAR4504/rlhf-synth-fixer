package imports.aws.dx_transit_virtual_interface;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.046Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dxTransitVirtualInterface.DxTransitVirtualInterfaceConfig")
@software.amazon.jsii.Jsii.Proxy(DxTransitVirtualInterfaceConfig.Jsii$Proxy.class)
public interface DxTransitVirtualInterfaceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#address_family DxTransitVirtualInterface#address_family}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAddressFamily();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#bgp_asn DxTransitVirtualInterface#bgp_asn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getBgpAsn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#connection_id DxTransitVirtualInterface#connection_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConnectionId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#dx_gateway_id DxTransitVirtualInterface#dx_gateway_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDxGatewayId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#name DxTransitVirtualInterface#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#vlan DxTransitVirtualInterface#vlan}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getVlan();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#amazon_address DxTransitVirtualInterface#amazon_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAmazonAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#bgp_auth_key DxTransitVirtualInterface#bgp_auth_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBgpAuthKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#customer_address DxTransitVirtualInterface#customer_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomerAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#id DxTransitVirtualInterface#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#mtu DxTransitVirtualInterface#mtu}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMtu() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#sitelink_enabled DxTransitVirtualInterface#sitelink_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSitelinkEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#tags DxTransitVirtualInterface#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#tags_all DxTransitVirtualInterface#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#timeouts DxTransitVirtualInterface#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dx_transit_virtual_interface.DxTransitVirtualInterfaceTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DxTransitVirtualInterfaceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DxTransitVirtualInterfaceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DxTransitVirtualInterfaceConfig> {
        java.lang.String addressFamily;
        java.lang.Number bgpAsn;
        java.lang.String connectionId;
        java.lang.String dxGatewayId;
        java.lang.String name;
        java.lang.Number vlan;
        java.lang.String amazonAddress;
        java.lang.String bgpAuthKey;
        java.lang.String customerAddress;
        java.lang.String id;
        java.lang.Number mtu;
        java.lang.Object sitelinkEnabled;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.dx_transit_virtual_interface.DxTransitVirtualInterfaceTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getAddressFamily}
         * @param addressFamily Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#address_family DxTransitVirtualInterface#address_family}. This parameter is required.
         * @return {@code this}
         */
        public Builder addressFamily(java.lang.String addressFamily) {
            this.addressFamily = addressFamily;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getBgpAsn}
         * @param bgpAsn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#bgp_asn DxTransitVirtualInterface#bgp_asn}. This parameter is required.
         * @return {@code this}
         */
        public Builder bgpAsn(java.lang.Number bgpAsn) {
            this.bgpAsn = bgpAsn;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getConnectionId}
         * @param connectionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#connection_id DxTransitVirtualInterface#connection_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder connectionId(java.lang.String connectionId) {
            this.connectionId = connectionId;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getDxGatewayId}
         * @param dxGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#dx_gateway_id DxTransitVirtualInterface#dx_gateway_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder dxGatewayId(java.lang.String dxGatewayId) {
            this.dxGatewayId = dxGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#name DxTransitVirtualInterface#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getVlan}
         * @param vlan Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#vlan DxTransitVirtualInterface#vlan}. This parameter is required.
         * @return {@code this}
         */
        public Builder vlan(java.lang.Number vlan) {
            this.vlan = vlan;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getAmazonAddress}
         * @param amazonAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#amazon_address DxTransitVirtualInterface#amazon_address}.
         * @return {@code this}
         */
        public Builder amazonAddress(java.lang.String amazonAddress) {
            this.amazonAddress = amazonAddress;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getBgpAuthKey}
         * @param bgpAuthKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#bgp_auth_key DxTransitVirtualInterface#bgp_auth_key}.
         * @return {@code this}
         */
        public Builder bgpAuthKey(java.lang.String bgpAuthKey) {
            this.bgpAuthKey = bgpAuthKey;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getCustomerAddress}
         * @param customerAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#customer_address DxTransitVirtualInterface#customer_address}.
         * @return {@code this}
         */
        public Builder customerAddress(java.lang.String customerAddress) {
            this.customerAddress = customerAddress;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#id DxTransitVirtualInterface#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getMtu}
         * @param mtu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#mtu DxTransitVirtualInterface#mtu}.
         * @return {@code this}
         */
        public Builder mtu(java.lang.Number mtu) {
            this.mtu = mtu;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getSitelinkEnabled}
         * @param sitelinkEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#sitelink_enabled DxTransitVirtualInterface#sitelink_enabled}.
         * @return {@code this}
         */
        public Builder sitelinkEnabled(java.lang.Boolean sitelinkEnabled) {
            this.sitelinkEnabled = sitelinkEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getSitelinkEnabled}
         * @param sitelinkEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#sitelink_enabled DxTransitVirtualInterface#sitelink_enabled}.
         * @return {@code this}
         */
        public Builder sitelinkEnabled(com.hashicorp.cdktf.IResolvable sitelinkEnabled) {
            this.sitelinkEnabled = sitelinkEnabled;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#tags DxTransitVirtualInterface#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#tags_all DxTransitVirtualInterface#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_transit_virtual_interface#timeouts DxTransitVirtualInterface#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.dx_transit_virtual_interface.DxTransitVirtualInterfaceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getDependsOn}
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
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DxTransitVirtualInterfaceConfig#getProvisioners}
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
         * @return a new instance of {@link DxTransitVirtualInterfaceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DxTransitVirtualInterfaceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DxTransitVirtualInterfaceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DxTransitVirtualInterfaceConfig {
        private final java.lang.String addressFamily;
        private final java.lang.Number bgpAsn;
        private final java.lang.String connectionId;
        private final java.lang.String dxGatewayId;
        private final java.lang.String name;
        private final java.lang.Number vlan;
        private final java.lang.String amazonAddress;
        private final java.lang.String bgpAuthKey;
        private final java.lang.String customerAddress;
        private final java.lang.String id;
        private final java.lang.Number mtu;
        private final java.lang.Object sitelinkEnabled;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.dx_transit_virtual_interface.DxTransitVirtualInterfaceTimeouts timeouts;
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
            this.addressFamily = software.amazon.jsii.Kernel.get(this, "addressFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bgpAsn = software.amazon.jsii.Kernel.get(this, "bgpAsn", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.connectionId = software.amazon.jsii.Kernel.get(this, "connectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dxGatewayId = software.amazon.jsii.Kernel.get(this, "dxGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vlan = software.amazon.jsii.Kernel.get(this, "vlan", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.amazonAddress = software.amazon.jsii.Kernel.get(this, "amazonAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bgpAuthKey = software.amazon.jsii.Kernel.get(this, "bgpAuthKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customerAddress = software.amazon.jsii.Kernel.get(this, "customerAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mtu = software.amazon.jsii.Kernel.get(this, "mtu", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sitelinkEnabled = software.amazon.jsii.Kernel.get(this, "sitelinkEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dx_transit_virtual_interface.DxTransitVirtualInterfaceTimeouts.class));
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
            this.addressFamily = java.util.Objects.requireNonNull(builder.addressFamily, "addressFamily is required");
            this.bgpAsn = java.util.Objects.requireNonNull(builder.bgpAsn, "bgpAsn is required");
            this.connectionId = java.util.Objects.requireNonNull(builder.connectionId, "connectionId is required");
            this.dxGatewayId = java.util.Objects.requireNonNull(builder.dxGatewayId, "dxGatewayId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.vlan = java.util.Objects.requireNonNull(builder.vlan, "vlan is required");
            this.amazonAddress = builder.amazonAddress;
            this.bgpAuthKey = builder.bgpAuthKey;
            this.customerAddress = builder.customerAddress;
            this.id = builder.id;
            this.mtu = builder.mtu;
            this.sitelinkEnabled = builder.sitelinkEnabled;
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
        public final java.lang.String getAddressFamily() {
            return this.addressFamily;
        }

        @Override
        public final java.lang.Number getBgpAsn() {
            return this.bgpAsn;
        }

        @Override
        public final java.lang.String getConnectionId() {
            return this.connectionId;
        }

        @Override
        public final java.lang.String getDxGatewayId() {
            return this.dxGatewayId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Number getVlan() {
            return this.vlan;
        }

        @Override
        public final java.lang.String getAmazonAddress() {
            return this.amazonAddress;
        }

        @Override
        public final java.lang.String getBgpAuthKey() {
            return this.bgpAuthKey;
        }

        @Override
        public final java.lang.String getCustomerAddress() {
            return this.customerAddress;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getMtu() {
            return this.mtu;
        }

        @Override
        public final java.lang.Object getSitelinkEnabled() {
            return this.sitelinkEnabled;
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
        public final imports.aws.dx_transit_virtual_interface.DxTransitVirtualInterfaceTimeouts getTimeouts() {
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

            data.set("addressFamily", om.valueToTree(this.getAddressFamily()));
            data.set("bgpAsn", om.valueToTree(this.getBgpAsn()));
            data.set("connectionId", om.valueToTree(this.getConnectionId()));
            data.set("dxGatewayId", om.valueToTree(this.getDxGatewayId()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("vlan", om.valueToTree(this.getVlan()));
            if (this.getAmazonAddress() != null) {
                data.set("amazonAddress", om.valueToTree(this.getAmazonAddress()));
            }
            if (this.getBgpAuthKey() != null) {
                data.set("bgpAuthKey", om.valueToTree(this.getBgpAuthKey()));
            }
            if (this.getCustomerAddress() != null) {
                data.set("customerAddress", om.valueToTree(this.getCustomerAddress()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMtu() != null) {
                data.set("mtu", om.valueToTree(this.getMtu()));
            }
            if (this.getSitelinkEnabled() != null) {
                data.set("sitelinkEnabled", om.valueToTree(this.getSitelinkEnabled()));
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
            struct.set("fqn", om.valueToTree("aws.dxTransitVirtualInterface.DxTransitVirtualInterfaceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DxTransitVirtualInterfaceConfig.Jsii$Proxy that = (DxTransitVirtualInterfaceConfig.Jsii$Proxy) o;

            if (!addressFamily.equals(that.addressFamily)) return false;
            if (!bgpAsn.equals(that.bgpAsn)) return false;
            if (!connectionId.equals(that.connectionId)) return false;
            if (!dxGatewayId.equals(that.dxGatewayId)) return false;
            if (!name.equals(that.name)) return false;
            if (!vlan.equals(that.vlan)) return false;
            if (this.amazonAddress != null ? !this.amazonAddress.equals(that.amazonAddress) : that.amazonAddress != null) return false;
            if (this.bgpAuthKey != null ? !this.bgpAuthKey.equals(that.bgpAuthKey) : that.bgpAuthKey != null) return false;
            if (this.customerAddress != null ? !this.customerAddress.equals(that.customerAddress) : that.customerAddress != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.mtu != null ? !this.mtu.equals(that.mtu) : that.mtu != null) return false;
            if (this.sitelinkEnabled != null ? !this.sitelinkEnabled.equals(that.sitelinkEnabled) : that.sitelinkEnabled != null) return false;
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
            int result = this.addressFamily.hashCode();
            result = 31 * result + (this.bgpAsn.hashCode());
            result = 31 * result + (this.connectionId.hashCode());
            result = 31 * result + (this.dxGatewayId.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.vlan.hashCode());
            result = 31 * result + (this.amazonAddress != null ? this.amazonAddress.hashCode() : 0);
            result = 31 * result + (this.bgpAuthKey != null ? this.bgpAuthKey.hashCode() : 0);
            result = 31 * result + (this.customerAddress != null ? this.customerAddress.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.mtu != null ? this.mtu.hashCode() : 0);
            result = 31 * result + (this.sitelinkEnabled != null ? this.sitelinkEnabled.hashCode() : 0);
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
