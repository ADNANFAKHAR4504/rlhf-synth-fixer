package imports.aws.ec2_transit_gateway_connect_peer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.105Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TransitGatewayConnectPeer.Ec2TransitGatewayConnectPeerConfig")
@software.amazon.jsii.Jsii.Proxy(Ec2TransitGatewayConnectPeerConfig.Jsii$Proxy.class)
public interface Ec2TransitGatewayConnectPeerConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#inside_cidr_blocks Ec2TransitGatewayConnectPeer#inside_cidr_blocks}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInsideCidrBlocks();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#peer_address Ec2TransitGatewayConnectPeer#peer_address}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPeerAddress();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#transit_gateway_attachment_id Ec2TransitGatewayConnectPeer#transit_gateway_attachment_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayAttachmentId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#bgp_asn Ec2TransitGatewayConnectPeer#bgp_asn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBgpAsn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#id Ec2TransitGatewayConnectPeer#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#tags Ec2TransitGatewayConnectPeer#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#tags_all Ec2TransitGatewayConnectPeer#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#timeouts Ec2TransitGatewayConnectPeer#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_transit_gateway_connect_peer.Ec2TransitGatewayConnectPeerTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#transit_gateway_address Ec2TransitGatewayConnectPeer#transit_gateway_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayAddress() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2TransitGatewayConnectPeerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2TransitGatewayConnectPeerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2TransitGatewayConnectPeerConfig> {
        java.util.List<java.lang.String> insideCidrBlocks;
        java.lang.String peerAddress;
        java.lang.String transitGatewayAttachmentId;
        java.lang.String bgpAsn;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.ec2_transit_gateway_connect_peer.Ec2TransitGatewayConnectPeerTimeouts timeouts;
        java.lang.String transitGatewayAddress;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getInsideCidrBlocks}
         * @param insideCidrBlocks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#inside_cidr_blocks Ec2TransitGatewayConnectPeer#inside_cidr_blocks}. This parameter is required.
         * @return {@code this}
         */
        public Builder insideCidrBlocks(java.util.List<java.lang.String> insideCidrBlocks) {
            this.insideCidrBlocks = insideCidrBlocks;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getPeerAddress}
         * @param peerAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#peer_address Ec2TransitGatewayConnectPeer#peer_address}. This parameter is required.
         * @return {@code this}
         */
        public Builder peerAddress(java.lang.String peerAddress) {
            this.peerAddress = peerAddress;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getTransitGatewayAttachmentId}
         * @param transitGatewayAttachmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#transit_gateway_attachment_id Ec2TransitGatewayConnectPeer#transit_gateway_attachment_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder transitGatewayAttachmentId(java.lang.String transitGatewayAttachmentId) {
            this.transitGatewayAttachmentId = transitGatewayAttachmentId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getBgpAsn}
         * @param bgpAsn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#bgp_asn Ec2TransitGatewayConnectPeer#bgp_asn}.
         * @return {@code this}
         */
        public Builder bgpAsn(java.lang.String bgpAsn) {
            this.bgpAsn = bgpAsn;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#id Ec2TransitGatewayConnectPeer#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#tags Ec2TransitGatewayConnectPeer#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#tags_all Ec2TransitGatewayConnectPeer#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#timeouts Ec2TransitGatewayConnectPeer#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.ec2_transit_gateway_connect_peer.Ec2TransitGatewayConnectPeerTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getTransitGatewayAddress}
         * @param transitGatewayAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect_peer#transit_gateway_address Ec2TransitGatewayConnectPeer#transit_gateway_address}.
         * @return {@code this}
         */
        public Builder transitGatewayAddress(java.lang.String transitGatewayAddress) {
            this.transitGatewayAddress = transitGatewayAddress;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getDependsOn}
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
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConnectPeerConfig#getProvisioners}
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
         * @return a new instance of {@link Ec2TransitGatewayConnectPeerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2TransitGatewayConnectPeerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2TransitGatewayConnectPeerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2TransitGatewayConnectPeerConfig {
        private final java.util.List<java.lang.String> insideCidrBlocks;
        private final java.lang.String peerAddress;
        private final java.lang.String transitGatewayAttachmentId;
        private final java.lang.String bgpAsn;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.ec2_transit_gateway_connect_peer.Ec2TransitGatewayConnectPeerTimeouts timeouts;
        private final java.lang.String transitGatewayAddress;
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
            this.insideCidrBlocks = software.amazon.jsii.Kernel.get(this, "insideCidrBlocks", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.peerAddress = software.amazon.jsii.Kernel.get(this, "peerAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transitGatewayAttachmentId = software.amazon.jsii.Kernel.get(this, "transitGatewayAttachmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bgpAsn = software.amazon.jsii.Kernel.get(this, "bgpAsn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_transit_gateway_connect_peer.Ec2TransitGatewayConnectPeerTimeouts.class));
            this.transitGatewayAddress = software.amazon.jsii.Kernel.get(this, "transitGatewayAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.insideCidrBlocks = java.util.Objects.requireNonNull(builder.insideCidrBlocks, "insideCidrBlocks is required");
            this.peerAddress = java.util.Objects.requireNonNull(builder.peerAddress, "peerAddress is required");
            this.transitGatewayAttachmentId = java.util.Objects.requireNonNull(builder.transitGatewayAttachmentId, "transitGatewayAttachmentId is required");
            this.bgpAsn = builder.bgpAsn;
            this.id = builder.id;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.transitGatewayAddress = builder.transitGatewayAddress;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.util.List<java.lang.String> getInsideCidrBlocks() {
            return this.insideCidrBlocks;
        }

        @Override
        public final java.lang.String getPeerAddress() {
            return this.peerAddress;
        }

        @Override
        public final java.lang.String getTransitGatewayAttachmentId() {
            return this.transitGatewayAttachmentId;
        }

        @Override
        public final java.lang.String getBgpAsn() {
            return this.bgpAsn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
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
        public final imports.aws.ec2_transit_gateway_connect_peer.Ec2TransitGatewayConnectPeerTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getTransitGatewayAddress() {
            return this.transitGatewayAddress;
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

            data.set("insideCidrBlocks", om.valueToTree(this.getInsideCidrBlocks()));
            data.set("peerAddress", om.valueToTree(this.getPeerAddress()));
            data.set("transitGatewayAttachmentId", om.valueToTree(this.getTransitGatewayAttachmentId()));
            if (this.getBgpAsn() != null) {
                data.set("bgpAsn", om.valueToTree(this.getBgpAsn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
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
            if (this.getTransitGatewayAddress() != null) {
                data.set("transitGatewayAddress", om.valueToTree(this.getTransitGatewayAddress()));
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
            struct.set("fqn", om.valueToTree("aws.ec2TransitGatewayConnectPeer.Ec2TransitGatewayConnectPeerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2TransitGatewayConnectPeerConfig.Jsii$Proxy that = (Ec2TransitGatewayConnectPeerConfig.Jsii$Proxy) o;

            if (!insideCidrBlocks.equals(that.insideCidrBlocks)) return false;
            if (!peerAddress.equals(that.peerAddress)) return false;
            if (!transitGatewayAttachmentId.equals(that.transitGatewayAttachmentId)) return false;
            if (this.bgpAsn != null ? !this.bgpAsn.equals(that.bgpAsn) : that.bgpAsn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.transitGatewayAddress != null ? !this.transitGatewayAddress.equals(that.transitGatewayAddress) : that.transitGatewayAddress != null) return false;
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
            int result = this.insideCidrBlocks.hashCode();
            result = 31 * result + (this.peerAddress.hashCode());
            result = 31 * result + (this.transitGatewayAttachmentId.hashCode());
            result = 31 * result + (this.bgpAsn != null ? this.bgpAsn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.transitGatewayAddress != null ? this.transitGatewayAddress.hashCode() : 0);
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
