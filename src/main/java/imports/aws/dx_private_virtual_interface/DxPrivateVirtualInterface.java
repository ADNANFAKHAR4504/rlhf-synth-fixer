package imports.aws.dx_private_virtual_interface;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface aws_dx_private_virtual_interface}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.044Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dxPrivateVirtualInterface.DxPrivateVirtualInterface")
public class DxPrivateVirtualInterface extends com.hashicorp.cdktf.TerraformResource {

    protected DxPrivateVirtualInterface(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DxPrivateVirtualInterface(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterface.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface aws_dx_private_virtual_interface} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DxPrivateVirtualInterface(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterfaceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DxPrivateVirtualInterface resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DxPrivateVirtualInterface to import. This parameter is required.
     * @param importFromId The id of the existing DxPrivateVirtualInterface that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DxPrivateVirtualInterface to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterface.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DxPrivateVirtualInterface resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DxPrivateVirtualInterface to import. This parameter is required.
     * @param importFromId The id of the existing DxPrivateVirtualInterface that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterface.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterfaceTimeouts value) {
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

    public void resetDxGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetDxGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMtu() {
        software.amazon.jsii.Kernel.call(this, "resetMtu", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSitelinkEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetSitelinkEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpnGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetVpnGatewayId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAmazonSideAsn() {
        return software.amazon.jsii.Kernel.get(this, "amazonSideAsn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsDevice() {
        return software.amazon.jsii.Kernel.get(this, "awsDevice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getJumboFrameCapable() {
        return software.amazon.jsii.Kernel.get(this, "jumboFrameCapable", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterfaceTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterfaceTimeoutsOutputReference.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectionIdInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "customerAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDxGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "dxGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMtuInput() {
        return software.amazon.jsii.Kernel.get(this, "mtuInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSitelinkEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "sitelinkEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getVlanInput() {
        return software.amazon.jsii.Kernel.get(this, "vlanInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpnGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpnGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionId() {
        return software.amazon.jsii.Kernel.get(this, "connectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectionId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectionId", java.util.Objects.requireNonNull(value, "connectionId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerAddress() {
        return software.amazon.jsii.Kernel.get(this, "customerAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomerAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customerAddress", java.util.Objects.requireNonNull(value, "customerAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDxGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "dxGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDxGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dxGatewayId", java.util.Objects.requireNonNull(value, "dxGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMtu() {
        return software.amazon.jsii.Kernel.get(this, "mtu", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMtu(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "mtu", java.util.Objects.requireNonNull(value, "mtu is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSitelinkEnabled() {
        return software.amazon.jsii.Kernel.get(this, "sitelinkEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSitelinkEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "sitelinkEnabled", java.util.Objects.requireNonNull(value, "sitelinkEnabled is required"));
    }

    public void setSitelinkEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "sitelinkEnabled", java.util.Objects.requireNonNull(value, "sitelinkEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVlan() {
        return software.amazon.jsii.Kernel.get(this, "vlan", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setVlan(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "vlan", java.util.Objects.requireNonNull(value, "vlan is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpnGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "vpnGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpnGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpnGatewayId", java.util.Objects.requireNonNull(value, "vpnGatewayId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterface}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterface> {
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
        private final imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterfaceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterfaceConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#address_family DxPrivateVirtualInterface#address_family}.
         * <p>
         * @return {@code this}
         * @param addressFamily Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#address_family DxPrivateVirtualInterface#address_family}. This parameter is required.
         */
        public Builder addressFamily(final java.lang.String addressFamily) {
            this.config.addressFamily(addressFamily);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#bgp_asn DxPrivateVirtualInterface#bgp_asn}.
         * <p>
         * @return {@code this}
         * @param bgpAsn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#bgp_asn DxPrivateVirtualInterface#bgp_asn}. This parameter is required.
         */
        public Builder bgpAsn(final java.lang.Number bgpAsn) {
            this.config.bgpAsn(bgpAsn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#connection_id DxPrivateVirtualInterface#connection_id}.
         * <p>
         * @return {@code this}
         * @param connectionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#connection_id DxPrivateVirtualInterface#connection_id}. This parameter is required.
         */
        public Builder connectionId(final java.lang.String connectionId) {
            this.config.connectionId(connectionId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#name DxPrivateVirtualInterface#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#name DxPrivateVirtualInterface#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#vlan DxPrivateVirtualInterface#vlan}.
         * <p>
         * @return {@code this}
         * @param vlan Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#vlan DxPrivateVirtualInterface#vlan}. This parameter is required.
         */
        public Builder vlan(final java.lang.Number vlan) {
            this.config.vlan(vlan);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#amazon_address DxPrivateVirtualInterface#amazon_address}.
         * <p>
         * @return {@code this}
         * @param amazonAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#amazon_address DxPrivateVirtualInterface#amazon_address}. This parameter is required.
         */
        public Builder amazonAddress(final java.lang.String amazonAddress) {
            this.config.amazonAddress(amazonAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#bgp_auth_key DxPrivateVirtualInterface#bgp_auth_key}.
         * <p>
         * @return {@code this}
         * @param bgpAuthKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#bgp_auth_key DxPrivateVirtualInterface#bgp_auth_key}. This parameter is required.
         */
        public Builder bgpAuthKey(final java.lang.String bgpAuthKey) {
            this.config.bgpAuthKey(bgpAuthKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#customer_address DxPrivateVirtualInterface#customer_address}.
         * <p>
         * @return {@code this}
         * @param customerAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#customer_address DxPrivateVirtualInterface#customer_address}. This parameter is required.
         */
        public Builder customerAddress(final java.lang.String customerAddress) {
            this.config.customerAddress(customerAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#dx_gateway_id DxPrivateVirtualInterface#dx_gateway_id}.
         * <p>
         * @return {@code this}
         * @param dxGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#dx_gateway_id DxPrivateVirtualInterface#dx_gateway_id}. This parameter is required.
         */
        public Builder dxGatewayId(final java.lang.String dxGatewayId) {
            this.config.dxGatewayId(dxGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#id DxPrivateVirtualInterface#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#id DxPrivateVirtualInterface#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#mtu DxPrivateVirtualInterface#mtu}.
         * <p>
         * @return {@code this}
         * @param mtu Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#mtu DxPrivateVirtualInterface#mtu}. This parameter is required.
         */
        public Builder mtu(final java.lang.Number mtu) {
            this.config.mtu(mtu);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#sitelink_enabled DxPrivateVirtualInterface#sitelink_enabled}.
         * <p>
         * @return {@code this}
         * @param sitelinkEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#sitelink_enabled DxPrivateVirtualInterface#sitelink_enabled}. This parameter is required.
         */
        public Builder sitelinkEnabled(final java.lang.Boolean sitelinkEnabled) {
            this.config.sitelinkEnabled(sitelinkEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#sitelink_enabled DxPrivateVirtualInterface#sitelink_enabled}.
         * <p>
         * @return {@code this}
         * @param sitelinkEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#sitelink_enabled DxPrivateVirtualInterface#sitelink_enabled}. This parameter is required.
         */
        public Builder sitelinkEnabled(final com.hashicorp.cdktf.IResolvable sitelinkEnabled) {
            this.config.sitelinkEnabled(sitelinkEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#tags DxPrivateVirtualInterface#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#tags DxPrivateVirtualInterface#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#tags_all DxPrivateVirtualInterface#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#tags_all DxPrivateVirtualInterface#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#timeouts DxPrivateVirtualInterface#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterfaceTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#vpn_gateway_id DxPrivateVirtualInterface#vpn_gateway_id}.
         * <p>
         * @return {@code this}
         * @param vpnGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dx_private_virtual_interface#vpn_gateway_id DxPrivateVirtualInterface#vpn_gateway_id}. This parameter is required.
         */
        public Builder vpnGatewayId(final java.lang.String vpnGatewayId) {
            this.config.vpnGatewayId(vpnGatewayId);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterface}.
         */
        @Override
        public imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterface build() {
            return new imports.aws.dx_private_virtual_interface.DxPrivateVirtualInterface(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
