package imports.aws.dx_hosted_public_virtual_interface;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.042Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dxHostedPublicVirtualInterface.DxHostedPublicVirtualInterfaceConfig")
@software.amazon.jsii.Jsii.Proxy(DxHostedPublicVirtualInterfaceConfig.Jsii$Proxy.class)
public interface DxHostedPublicVirtualInterfaceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#address_family DxHostedPublicVirtualInterface#address_family}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAddressFamily();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#bgp_asn DxHostedPublicVirtualInterface#bgp_asn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getBgpAsn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#connection_id DxHostedPublicVirtualInterface#connection_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConnectionId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#name DxHostedPublicVirtualInterface#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#owner_account_id DxHostedPublicVirtualInterface#owner_account_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOwnerAccountId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#route_filter_prefixes DxHostedPublicVirtualInterface#route_filter_prefixes}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRouteFilterPrefixes();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#vlan DxHostedPublicVirtualInterface#vlan}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getVlan();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#amazon_address DxHostedPublicVirtualInterface#amazon_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAmazonAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#bgp_auth_key DxHostedPublicVirtualInterface#bgp_auth_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBgpAuthKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#customer_address DxHostedPublicVirtualInterface#customer_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomerAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#id DxHostedPublicVirtualInterface#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#timeouts DxHostedPublicVirtualInterface#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dx_hosted_public_virtual_interface.DxHostedPublicVirtualInterfaceTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DxHostedPublicVirtualInterfaceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DxHostedPublicVirtualInterfaceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DxHostedPublicVirtualInterfaceConfig> {
        java.lang.String addressFamily;
        java.lang.Number bgpAsn;
        java.lang.String connectionId;
        java.lang.String name;
        java.lang.String ownerAccountId;
        java.util.List<java.lang.String> routeFilterPrefixes;
        java.lang.Number vlan;
        java.lang.String amazonAddress;
        java.lang.String bgpAuthKey;
        java.lang.String customerAddress;
        java.lang.String id;
        imports.aws.dx_hosted_public_virtual_interface.DxHostedPublicVirtualInterfaceTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getAddressFamily}
         * @param addressFamily Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#address_family DxHostedPublicVirtualInterface#address_family}. This parameter is required.
         * @return {@code this}
         */
        public Builder addressFamily(java.lang.String addressFamily) {
            this.addressFamily = addressFamily;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getBgpAsn}
         * @param bgpAsn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#bgp_asn DxHostedPublicVirtualInterface#bgp_asn}. This parameter is required.
         * @return {@code this}
         */
        public Builder bgpAsn(java.lang.Number bgpAsn) {
            this.bgpAsn = bgpAsn;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getConnectionId}
         * @param connectionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#connection_id DxHostedPublicVirtualInterface#connection_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder connectionId(java.lang.String connectionId) {
            this.connectionId = connectionId;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#name DxHostedPublicVirtualInterface#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getOwnerAccountId}
         * @param ownerAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#owner_account_id DxHostedPublicVirtualInterface#owner_account_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder ownerAccountId(java.lang.String ownerAccountId) {
            this.ownerAccountId = ownerAccountId;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getRouteFilterPrefixes}
         * @param routeFilterPrefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#route_filter_prefixes DxHostedPublicVirtualInterface#route_filter_prefixes}. This parameter is required.
         * @return {@code this}
         */
        public Builder routeFilterPrefixes(java.util.List<java.lang.String> routeFilterPrefixes) {
            this.routeFilterPrefixes = routeFilterPrefixes;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getVlan}
         * @param vlan Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#vlan DxHostedPublicVirtualInterface#vlan}. This parameter is required.
         * @return {@code this}
         */
        public Builder vlan(java.lang.Number vlan) {
            this.vlan = vlan;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getAmazonAddress}
         * @param amazonAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#amazon_address DxHostedPublicVirtualInterface#amazon_address}.
         * @return {@code this}
         */
        public Builder amazonAddress(java.lang.String amazonAddress) {
            this.amazonAddress = amazonAddress;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getBgpAuthKey}
         * @param bgpAuthKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#bgp_auth_key DxHostedPublicVirtualInterface#bgp_auth_key}.
         * @return {@code this}
         */
        public Builder bgpAuthKey(java.lang.String bgpAuthKey) {
            this.bgpAuthKey = bgpAuthKey;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getCustomerAddress}
         * @param customerAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#customer_address DxHostedPublicVirtualInterface#customer_address}.
         * @return {@code this}
         */
        public Builder customerAddress(java.lang.String customerAddress) {
            this.customerAddress = customerAddress;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#id DxHostedPublicVirtualInterface#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_hosted_public_virtual_interface#timeouts DxHostedPublicVirtualInterface#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.dx_hosted_public_virtual_interface.DxHostedPublicVirtualInterfaceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getDependsOn}
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
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DxHostedPublicVirtualInterfaceConfig#getProvisioners}
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
         * @return a new instance of {@link DxHostedPublicVirtualInterfaceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DxHostedPublicVirtualInterfaceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DxHostedPublicVirtualInterfaceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DxHostedPublicVirtualInterfaceConfig {
        private final java.lang.String addressFamily;
        private final java.lang.Number bgpAsn;
        private final java.lang.String connectionId;
        private final java.lang.String name;
        private final java.lang.String ownerAccountId;
        private final java.util.List<java.lang.String> routeFilterPrefixes;
        private final java.lang.Number vlan;
        private final java.lang.String amazonAddress;
        private final java.lang.String bgpAuthKey;
        private final java.lang.String customerAddress;
        private final java.lang.String id;
        private final imports.aws.dx_hosted_public_virtual_interface.DxHostedPublicVirtualInterfaceTimeouts timeouts;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ownerAccountId = software.amazon.jsii.Kernel.get(this, "ownerAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routeFilterPrefixes = software.amazon.jsii.Kernel.get(this, "routeFilterPrefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vlan = software.amazon.jsii.Kernel.get(this, "vlan", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.amazonAddress = software.amazon.jsii.Kernel.get(this, "amazonAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bgpAuthKey = software.amazon.jsii.Kernel.get(this, "bgpAuthKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customerAddress = software.amazon.jsii.Kernel.get(this, "customerAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dx_hosted_public_virtual_interface.DxHostedPublicVirtualInterfaceTimeouts.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.ownerAccountId = java.util.Objects.requireNonNull(builder.ownerAccountId, "ownerAccountId is required");
            this.routeFilterPrefixes = java.util.Objects.requireNonNull(builder.routeFilterPrefixes, "routeFilterPrefixes is required");
            this.vlan = java.util.Objects.requireNonNull(builder.vlan, "vlan is required");
            this.amazonAddress = builder.amazonAddress;
            this.bgpAuthKey = builder.bgpAuthKey;
            this.customerAddress = builder.customerAddress;
            this.id = builder.id;
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
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getOwnerAccountId() {
            return this.ownerAccountId;
        }

        @Override
        public final java.util.List<java.lang.String> getRouteFilterPrefixes() {
            return this.routeFilterPrefixes;
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
        public final imports.aws.dx_hosted_public_virtual_interface.DxHostedPublicVirtualInterfaceTimeouts getTimeouts() {
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
            data.set("name", om.valueToTree(this.getName()));
            data.set("ownerAccountId", om.valueToTree(this.getOwnerAccountId()));
            data.set("routeFilterPrefixes", om.valueToTree(this.getRouteFilterPrefixes()));
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
            struct.set("fqn", om.valueToTree("aws.dxHostedPublicVirtualInterface.DxHostedPublicVirtualInterfaceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DxHostedPublicVirtualInterfaceConfig.Jsii$Proxy that = (DxHostedPublicVirtualInterfaceConfig.Jsii$Proxy) o;

            if (!addressFamily.equals(that.addressFamily)) return false;
            if (!bgpAsn.equals(that.bgpAsn)) return false;
            if (!connectionId.equals(that.connectionId)) return false;
            if (!name.equals(that.name)) return false;
            if (!ownerAccountId.equals(that.ownerAccountId)) return false;
            if (!routeFilterPrefixes.equals(that.routeFilterPrefixes)) return false;
            if (!vlan.equals(that.vlan)) return false;
            if (this.amazonAddress != null ? !this.amazonAddress.equals(that.amazonAddress) : that.amazonAddress != null) return false;
            if (this.bgpAuthKey != null ? !this.bgpAuthKey.equals(that.bgpAuthKey) : that.bgpAuthKey != null) return false;
            if (this.customerAddress != null ? !this.customerAddress.equals(that.customerAddress) : that.customerAddress != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
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
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.ownerAccountId.hashCode());
            result = 31 * result + (this.routeFilterPrefixes.hashCode());
            result = 31 * result + (this.vlan.hashCode());
            result = 31 * result + (this.amazonAddress != null ? this.amazonAddress.hashCode() : 0);
            result = 31 * result + (this.bgpAuthKey != null ? this.bgpAuthKey.hashCode() : 0);
            result = 31 * result + (this.customerAddress != null ? this.customerAddress.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
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
