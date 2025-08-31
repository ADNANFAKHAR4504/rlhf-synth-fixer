package imports.aws.networkmanager_connect_peer;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer aws_networkmanager_connect_peer}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.964Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkmanagerConnectPeer.NetworkmanagerConnectPeer")
public class NetworkmanagerConnectPeer extends com.hashicorp.cdktf.TerraformResource {

    protected NetworkmanagerConnectPeer(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected NetworkmanagerConnectPeer(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeer.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer aws_networkmanager_connect_peer} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public NetworkmanagerConnectPeer(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a NetworkmanagerConnectPeer resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the NetworkmanagerConnectPeer to import. This parameter is required.
     * @param importFromId The id of the existing NetworkmanagerConnectPeer that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the NetworkmanagerConnectPeer to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeer.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a NetworkmanagerConnectPeer resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the NetworkmanagerConnectPeer to import. This parameter is required.
     * @param importFromId The id of the existing NetworkmanagerConnectPeer that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeer.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putBgpOptions(final @org.jetbrains.annotations.NotNull imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions value) {
        software.amazon.jsii.Kernel.call(this, "putBgpOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBgpOptions() {
        software.amazon.jsii.Kernel.call(this, "resetBgpOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCoreNetworkAddress() {
        software.amazon.jsii.Kernel.call(this, "resetCoreNetworkAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInsideCidrBlocks() {
        software.amazon.jsii.Kernel.call(this, "resetInsideCidrBlocks", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetArn() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetArn", software.amazon.jsii.NativeType.VOID);
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

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptionsOutputReference getBgpOptions() {
        return software.amazon.jsii.Kernel.get(this, "bgpOptions", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerConfigurationList getConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "configuration", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectPeerId() {
        return software.amazon.jsii.Kernel.get(this, "connectPeerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCoreNetworkId() {
        return software.amazon.jsii.Kernel.get(this, "coreNetworkId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEdgeLocation() {
        return software.amazon.jsii.Kernel.get(this, "edgeLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getState() {
        return software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions getBgpOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "bgpOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectAttachmentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "connectAttachmentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCoreNetworkAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "coreNetworkAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInsideCidrBlocksInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "insideCidrBlocksInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPeerAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "peerAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubnetArnInput() {
        return software.amazon.jsii.Kernel.get(this, "subnetArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectAttachmentId() {
        return software.amazon.jsii.Kernel.get(this, "connectAttachmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectAttachmentId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectAttachmentId", java.util.Objects.requireNonNull(value, "connectAttachmentId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCoreNetworkAddress() {
        return software.amazon.jsii.Kernel.get(this, "coreNetworkAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCoreNetworkAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "coreNetworkAddress", java.util.Objects.requireNonNull(value, "coreNetworkAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInsideCidrBlocks() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "insideCidrBlocks", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setInsideCidrBlocks(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "insideCidrBlocks", java.util.Objects.requireNonNull(value, "insideCidrBlocks is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPeerAddress() {
        return software.amazon.jsii.Kernel.get(this, "peerAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPeerAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "peerAddress", java.util.Objects.requireNonNull(value, "peerAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubnetArn() {
        return software.amazon.jsii.Kernel.get(this, "subnetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubnetArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subnetArn", java.util.Objects.requireNonNull(value, "subnetArn is required"));
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

    /**
     * A fluent builder for {@link imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeer}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeer> {
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
        private final imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#connect_attachment_id NetworkmanagerConnectPeer#connect_attachment_id}.
         * <p>
         * @return {@code this}
         * @param connectAttachmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#connect_attachment_id NetworkmanagerConnectPeer#connect_attachment_id}. This parameter is required.
         */
        public Builder connectAttachmentId(final java.lang.String connectAttachmentId) {
            this.config.connectAttachmentId(connectAttachmentId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#peer_address NetworkmanagerConnectPeer#peer_address}.
         * <p>
         * @return {@code this}
         * @param peerAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#peer_address NetworkmanagerConnectPeer#peer_address}. This parameter is required.
         */
        public Builder peerAddress(final java.lang.String peerAddress) {
            this.config.peerAddress(peerAddress);
            return this;
        }

        /**
         * bgp_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#bgp_options NetworkmanagerConnectPeer#bgp_options}
         * <p>
         * @return {@code this}
         * @param bgpOptions bgp_options block. This parameter is required.
         */
        public Builder bgpOptions(final imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions bgpOptions) {
            this.config.bgpOptions(bgpOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#core_network_address NetworkmanagerConnectPeer#core_network_address}.
         * <p>
         * @return {@code this}
         * @param coreNetworkAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#core_network_address NetworkmanagerConnectPeer#core_network_address}. This parameter is required.
         */
        public Builder coreNetworkAddress(final java.lang.String coreNetworkAddress) {
            this.config.coreNetworkAddress(coreNetworkAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#id NetworkmanagerConnectPeer#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#id NetworkmanagerConnectPeer#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#inside_cidr_blocks NetworkmanagerConnectPeer#inside_cidr_blocks}.
         * <p>
         * @return {@code this}
         * @param insideCidrBlocks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#inside_cidr_blocks NetworkmanagerConnectPeer#inside_cidr_blocks}. This parameter is required.
         */
        public Builder insideCidrBlocks(final java.util.List<java.lang.String> insideCidrBlocks) {
            this.config.insideCidrBlocks(insideCidrBlocks);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#subnet_arn NetworkmanagerConnectPeer#subnet_arn}.
         * <p>
         * @return {@code this}
         * @param subnetArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#subnet_arn NetworkmanagerConnectPeer#subnet_arn}. This parameter is required.
         */
        public Builder subnetArn(final java.lang.String subnetArn) {
            this.config.subnetArn(subnetArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#tags NetworkmanagerConnectPeer#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#tags NetworkmanagerConnectPeer#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#tags_all NetworkmanagerConnectPeer#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#tags_all NetworkmanagerConnectPeer#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#timeouts NetworkmanagerConnectPeer#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeer}.
         */
        @Override
        public imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeer build() {
            return new imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeer(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
