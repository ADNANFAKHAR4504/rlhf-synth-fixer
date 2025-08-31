package imports.aws.dx_bgp_peer;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer aws_dx_bgp_peer}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.033Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dxBgpPeer.DxBgpPeer")
public class DxBgpPeer extends com.hashicorp.cdktf.TerraformResource {

    protected DxBgpPeer(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DxBgpPeer(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.dx_bgp_peer.DxBgpPeer.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer aws_dx_bgp_peer} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DxBgpPeer(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.dx_bgp_peer.DxBgpPeerConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DxBgpPeer resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DxBgpPeer to import. This parameter is required.
     * @param importFromId The id of the existing DxBgpPeer that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DxBgpPeer to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dx_bgp_peer.DxBgpPeer.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DxBgpPeer resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DxBgpPeer to import. This parameter is required.
     * @param importFromId The id of the existing DxBgpPeer that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dx_bgp_peer.DxBgpPeer.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.dx_bgp_peer.DxBgpPeerTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAmazonAddress() {
        software.amazon.jsii.Kernel.call(this, "resetAmazonAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBgpAuthKey() {
        software.amazon.jsii.Kernel.call(this, "resetBgpAuthKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomerAddress() {
        software.amazon.jsii.Kernel.call(this, "resetCustomerAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsDevice() {
        return software.amazon.jsii.Kernel.get(this, "awsDevice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBgpPeerId() {
        return software.amazon.jsii.Kernel.get(this, "bgpPeerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBgpStatus() {
        return software.amazon.jsii.Kernel.get(this, "bgpStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dx_bgp_peer.DxBgpPeerTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dx_bgp_peer.DxBgpPeerTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAddressFamilyInput() {
        return software.amazon.jsii.Kernel.get(this, "addressFamilyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAmazonAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "amazonAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBgpAsnInput() {
        return software.amazon.jsii.Kernel.get(this, "bgpAsnInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBgpAuthKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "bgpAuthKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "customerAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVirtualInterfaceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "virtualInterfaceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAddressFamily() {
        return software.amazon.jsii.Kernel.get(this, "addressFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAddressFamily(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "addressFamily", java.util.Objects.requireNonNull(value, "addressFamily is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAmazonAddress() {
        return software.amazon.jsii.Kernel.get(this, "amazonAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAmazonAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "amazonAddress", java.util.Objects.requireNonNull(value, "amazonAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBgpAsn() {
        return software.amazon.jsii.Kernel.get(this, "bgpAsn", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBgpAsn(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bgpAsn", java.util.Objects.requireNonNull(value, "bgpAsn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBgpAuthKey() {
        return software.amazon.jsii.Kernel.get(this, "bgpAuthKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBgpAuthKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bgpAuthKey", java.util.Objects.requireNonNull(value, "bgpAuthKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerAddress() {
        return software.amazon.jsii.Kernel.get(this, "customerAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomerAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customerAddress", java.util.Objects.requireNonNull(value, "customerAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVirtualInterfaceId() {
        return software.amazon.jsii.Kernel.get(this, "virtualInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVirtualInterfaceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "virtualInterfaceId", java.util.Objects.requireNonNull(value, "virtualInterfaceId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.dx_bgp_peer.DxBgpPeer}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.dx_bgp_peer.DxBgpPeer> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.dx_bgp_peer.DxBgpPeerConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.dx_bgp_peer.DxBgpPeerConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#address_family DxBgpPeer#address_family}.
         * <p>
         * @return {@code this}
         * @param addressFamily Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#address_family DxBgpPeer#address_family}. This parameter is required.
         */
        public Builder addressFamily(final java.lang.String addressFamily) {
            this.config.addressFamily(addressFamily);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#bgp_asn DxBgpPeer#bgp_asn}.
         * <p>
         * @return {@code this}
         * @param bgpAsn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#bgp_asn DxBgpPeer#bgp_asn}. This parameter is required.
         */
        public Builder bgpAsn(final java.lang.Number bgpAsn) {
            this.config.bgpAsn(bgpAsn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#virtual_interface_id DxBgpPeer#virtual_interface_id}.
         * <p>
         * @return {@code this}
         * @param virtualInterfaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#virtual_interface_id DxBgpPeer#virtual_interface_id}. This parameter is required.
         */
        public Builder virtualInterfaceId(final java.lang.String virtualInterfaceId) {
            this.config.virtualInterfaceId(virtualInterfaceId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#amazon_address DxBgpPeer#amazon_address}.
         * <p>
         * @return {@code this}
         * @param amazonAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#amazon_address DxBgpPeer#amazon_address}. This parameter is required.
         */
        public Builder amazonAddress(final java.lang.String amazonAddress) {
            this.config.amazonAddress(amazonAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#bgp_auth_key DxBgpPeer#bgp_auth_key}.
         * <p>
         * @return {@code this}
         * @param bgpAuthKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#bgp_auth_key DxBgpPeer#bgp_auth_key}. This parameter is required.
         */
        public Builder bgpAuthKey(final java.lang.String bgpAuthKey) {
            this.config.bgpAuthKey(bgpAuthKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#customer_address DxBgpPeer#customer_address}.
         * <p>
         * @return {@code this}
         * @param customerAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#customer_address DxBgpPeer#customer_address}. This parameter is required.
         */
        public Builder customerAddress(final java.lang.String customerAddress) {
            this.config.customerAddress(customerAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#id DxBgpPeer#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#id DxBgpPeer#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_bgp_peer#timeouts DxBgpPeer#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.dx_bgp_peer.DxBgpPeerTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.dx_bgp_peer.DxBgpPeer}.
         */
        @Override
        public imports.aws.dx_bgp_peer.DxBgpPeer build() {
            return new imports.aws.dx_bgp_peer.DxBgpPeer(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
