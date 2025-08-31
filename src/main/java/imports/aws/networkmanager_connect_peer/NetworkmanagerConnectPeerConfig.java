package imports.aws.networkmanager_connect_peer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.965Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkmanagerConnectPeer.NetworkmanagerConnectPeerConfig")
@software.amazon.jsii.Jsii.Proxy(NetworkmanagerConnectPeerConfig.Jsii$Proxy.class)
public interface NetworkmanagerConnectPeerConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#connect_attachment_id NetworkmanagerConnectPeer#connect_attachment_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConnectAttachmentId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#peer_address NetworkmanagerConnectPeer#peer_address}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPeerAddress();

    /**
     * bgp_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#bgp_options NetworkmanagerConnectPeer#bgp_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions getBgpOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#core_network_address NetworkmanagerConnectPeer#core_network_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCoreNetworkAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#id NetworkmanagerConnectPeer#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#inside_cidr_blocks NetworkmanagerConnectPeer#inside_cidr_blocks}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInsideCidrBlocks() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#subnet_arn NetworkmanagerConnectPeer#subnet_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubnetArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#tags NetworkmanagerConnectPeer#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#tags_all NetworkmanagerConnectPeer#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#timeouts NetworkmanagerConnectPeer#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkmanagerConnectPeerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkmanagerConnectPeerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkmanagerConnectPeerConfig> {
        java.lang.String connectAttachmentId;
        java.lang.String peerAddress;
        imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions bgpOptions;
        java.lang.String coreNetworkAddress;
        java.lang.String id;
        java.util.List<java.lang.String> insideCidrBlocks;
        java.lang.String subnetArn;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getConnectAttachmentId}
         * @param connectAttachmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#connect_attachment_id NetworkmanagerConnectPeer#connect_attachment_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder connectAttachmentId(java.lang.String connectAttachmentId) {
            this.connectAttachmentId = connectAttachmentId;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getPeerAddress}
         * @param peerAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#peer_address NetworkmanagerConnectPeer#peer_address}. This parameter is required.
         * @return {@code this}
         */
        public Builder peerAddress(java.lang.String peerAddress) {
            this.peerAddress = peerAddress;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getBgpOptions}
         * @param bgpOptions bgp_options block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#bgp_options NetworkmanagerConnectPeer#bgp_options}
         * @return {@code this}
         */
        public Builder bgpOptions(imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions bgpOptions) {
            this.bgpOptions = bgpOptions;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getCoreNetworkAddress}
         * @param coreNetworkAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#core_network_address NetworkmanagerConnectPeer#core_network_address}.
         * @return {@code this}
         */
        public Builder coreNetworkAddress(java.lang.String coreNetworkAddress) {
            this.coreNetworkAddress = coreNetworkAddress;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#id NetworkmanagerConnectPeer#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getInsideCidrBlocks}
         * @param insideCidrBlocks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#inside_cidr_blocks NetworkmanagerConnectPeer#inside_cidr_blocks}.
         * @return {@code this}
         */
        public Builder insideCidrBlocks(java.util.List<java.lang.String> insideCidrBlocks) {
            this.insideCidrBlocks = insideCidrBlocks;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getSubnetArn}
         * @param subnetArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#subnet_arn NetworkmanagerConnectPeer#subnet_arn}.
         * @return {@code this}
         */
        public Builder subnetArn(java.lang.String subnetArn) {
            this.subnetArn = subnetArn;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#tags NetworkmanagerConnectPeer#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#tags_all NetworkmanagerConnectPeer#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkmanager_connect_peer#timeouts NetworkmanagerConnectPeer#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getDependsOn}
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
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link NetworkmanagerConnectPeerConfig#getProvisioners}
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
         * @return a new instance of {@link NetworkmanagerConnectPeerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkmanagerConnectPeerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkmanagerConnectPeerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkmanagerConnectPeerConfig {
        private final java.lang.String connectAttachmentId;
        private final java.lang.String peerAddress;
        private final imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions bgpOptions;
        private final java.lang.String coreNetworkAddress;
        private final java.lang.String id;
        private final java.util.List<java.lang.String> insideCidrBlocks;
        private final java.lang.String subnetArn;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerTimeouts timeouts;
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
            this.connectAttachmentId = software.amazon.jsii.Kernel.get(this, "connectAttachmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.peerAddress = software.amazon.jsii.Kernel.get(this, "peerAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bgpOptions = software.amazon.jsii.Kernel.get(this, "bgpOptions", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions.class));
            this.coreNetworkAddress = software.amazon.jsii.Kernel.get(this, "coreNetworkAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.insideCidrBlocks = software.amazon.jsii.Kernel.get(this, "insideCidrBlocks", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnetArn = software.amazon.jsii.Kernel.get(this, "subnetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerTimeouts.class));
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
            this.connectAttachmentId = java.util.Objects.requireNonNull(builder.connectAttachmentId, "connectAttachmentId is required");
            this.peerAddress = java.util.Objects.requireNonNull(builder.peerAddress, "peerAddress is required");
            this.bgpOptions = builder.bgpOptions;
            this.coreNetworkAddress = builder.coreNetworkAddress;
            this.id = builder.id;
            this.insideCidrBlocks = builder.insideCidrBlocks;
            this.subnetArn = builder.subnetArn;
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
        public final java.lang.String getConnectAttachmentId() {
            return this.connectAttachmentId;
        }

        @Override
        public final java.lang.String getPeerAddress() {
            return this.peerAddress;
        }

        @Override
        public final imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerBgpOptions getBgpOptions() {
            return this.bgpOptions;
        }

        @Override
        public final java.lang.String getCoreNetworkAddress() {
            return this.coreNetworkAddress;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.List<java.lang.String> getInsideCidrBlocks() {
            return this.insideCidrBlocks;
        }

        @Override
        public final java.lang.String getSubnetArn() {
            return this.subnetArn;
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
        public final imports.aws.networkmanager_connect_peer.NetworkmanagerConnectPeerTimeouts getTimeouts() {
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

            data.set("connectAttachmentId", om.valueToTree(this.getConnectAttachmentId()));
            data.set("peerAddress", om.valueToTree(this.getPeerAddress()));
            if (this.getBgpOptions() != null) {
                data.set("bgpOptions", om.valueToTree(this.getBgpOptions()));
            }
            if (this.getCoreNetworkAddress() != null) {
                data.set("coreNetworkAddress", om.valueToTree(this.getCoreNetworkAddress()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInsideCidrBlocks() != null) {
                data.set("insideCidrBlocks", om.valueToTree(this.getInsideCidrBlocks()));
            }
            if (this.getSubnetArn() != null) {
                data.set("subnetArn", om.valueToTree(this.getSubnetArn()));
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
            struct.set("fqn", om.valueToTree("aws.networkmanagerConnectPeer.NetworkmanagerConnectPeerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkmanagerConnectPeerConfig.Jsii$Proxy that = (NetworkmanagerConnectPeerConfig.Jsii$Proxy) o;

            if (!connectAttachmentId.equals(that.connectAttachmentId)) return false;
            if (!peerAddress.equals(that.peerAddress)) return false;
            if (this.bgpOptions != null ? !this.bgpOptions.equals(that.bgpOptions) : that.bgpOptions != null) return false;
            if (this.coreNetworkAddress != null ? !this.coreNetworkAddress.equals(that.coreNetworkAddress) : that.coreNetworkAddress != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.insideCidrBlocks != null ? !this.insideCidrBlocks.equals(that.insideCidrBlocks) : that.insideCidrBlocks != null) return false;
            if (this.subnetArn != null ? !this.subnetArn.equals(that.subnetArn) : that.subnetArn != null) return false;
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
            int result = this.connectAttachmentId.hashCode();
            result = 31 * result + (this.peerAddress.hashCode());
            result = 31 * result + (this.bgpOptions != null ? this.bgpOptions.hashCode() : 0);
            result = 31 * result + (this.coreNetworkAddress != null ? this.coreNetworkAddress.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.insideCidrBlocks != null ? this.insideCidrBlocks.hashCode() : 0);
            result = 31 * result + (this.subnetArn != null ? this.subnetArn.hashCode() : 0);
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
