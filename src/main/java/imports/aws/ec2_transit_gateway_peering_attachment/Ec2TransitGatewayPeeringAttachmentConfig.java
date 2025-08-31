package imports.aws.ec2_transit_gateway_peering_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.111Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TransitGatewayPeeringAttachment.Ec2TransitGatewayPeeringAttachmentConfig")
@software.amazon.jsii.Jsii.Proxy(Ec2TransitGatewayPeeringAttachmentConfig.Jsii$Proxy.class)
public interface Ec2TransitGatewayPeeringAttachmentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#peer_region Ec2TransitGatewayPeeringAttachment#peer_region}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPeerRegion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#peer_transit_gateway_id Ec2TransitGatewayPeeringAttachment#peer_transit_gateway_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPeerTransitGatewayId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#transit_gateway_id Ec2TransitGatewayPeeringAttachment#transit_gateway_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#id Ec2TransitGatewayPeeringAttachment#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#options Ec2TransitGatewayPeeringAttachment#options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_transit_gateway_peering_attachment.Ec2TransitGatewayPeeringAttachmentOptions getOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#peer_account_id Ec2TransitGatewayPeeringAttachment#peer_account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPeerAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#tags Ec2TransitGatewayPeeringAttachment#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#tags_all Ec2TransitGatewayPeeringAttachment#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2TransitGatewayPeeringAttachmentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2TransitGatewayPeeringAttachmentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2TransitGatewayPeeringAttachmentConfig> {
        java.lang.String peerRegion;
        java.lang.String peerTransitGatewayId;
        java.lang.String transitGatewayId;
        java.lang.String id;
        imports.aws.ec2_transit_gateway_peering_attachment.Ec2TransitGatewayPeeringAttachmentOptions options;
        java.lang.String peerAccountId;
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
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getPeerRegion}
         * @param peerRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#peer_region Ec2TransitGatewayPeeringAttachment#peer_region}. This parameter is required.
         * @return {@code this}
         */
        public Builder peerRegion(java.lang.String peerRegion) {
            this.peerRegion = peerRegion;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getPeerTransitGatewayId}
         * @param peerTransitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#peer_transit_gateway_id Ec2TransitGatewayPeeringAttachment#peer_transit_gateway_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder peerTransitGatewayId(java.lang.String peerTransitGatewayId) {
            this.peerTransitGatewayId = peerTransitGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getTransitGatewayId}
         * @param transitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#transit_gateway_id Ec2TransitGatewayPeeringAttachment#transit_gateway_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder transitGatewayId(java.lang.String transitGatewayId) {
            this.transitGatewayId = transitGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#id Ec2TransitGatewayPeeringAttachment#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getOptions}
         * @param options options block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#options Ec2TransitGatewayPeeringAttachment#options}
         * @return {@code this}
         */
        public Builder options(imports.aws.ec2_transit_gateway_peering_attachment.Ec2TransitGatewayPeeringAttachmentOptions options) {
            this.options = options;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getPeerAccountId}
         * @param peerAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#peer_account_id Ec2TransitGatewayPeeringAttachment#peer_account_id}.
         * @return {@code this}
         */
        public Builder peerAccountId(java.lang.String peerAccountId) {
            this.peerAccountId = peerAccountId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#tags Ec2TransitGatewayPeeringAttachment#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_peering_attachment#tags_all Ec2TransitGatewayPeeringAttachment#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getDependsOn}
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
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayPeeringAttachmentConfig#getProvisioners}
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
         * @return a new instance of {@link Ec2TransitGatewayPeeringAttachmentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2TransitGatewayPeeringAttachmentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2TransitGatewayPeeringAttachmentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2TransitGatewayPeeringAttachmentConfig {
        private final java.lang.String peerRegion;
        private final java.lang.String peerTransitGatewayId;
        private final java.lang.String transitGatewayId;
        private final java.lang.String id;
        private final imports.aws.ec2_transit_gateway_peering_attachment.Ec2TransitGatewayPeeringAttachmentOptions options;
        private final java.lang.String peerAccountId;
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
            this.peerRegion = software.amazon.jsii.Kernel.get(this, "peerRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.peerTransitGatewayId = software.amazon.jsii.Kernel.get(this, "peerTransitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transitGatewayId = software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.options = software.amazon.jsii.Kernel.get(this, "options", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_transit_gateway_peering_attachment.Ec2TransitGatewayPeeringAttachmentOptions.class));
            this.peerAccountId = software.amazon.jsii.Kernel.get(this, "peerAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.peerRegion = java.util.Objects.requireNonNull(builder.peerRegion, "peerRegion is required");
            this.peerTransitGatewayId = java.util.Objects.requireNonNull(builder.peerTransitGatewayId, "peerTransitGatewayId is required");
            this.transitGatewayId = java.util.Objects.requireNonNull(builder.transitGatewayId, "transitGatewayId is required");
            this.id = builder.id;
            this.options = builder.options;
            this.peerAccountId = builder.peerAccountId;
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
        public final java.lang.String getPeerRegion() {
            return this.peerRegion;
        }

        @Override
        public final java.lang.String getPeerTransitGatewayId() {
            return this.peerTransitGatewayId;
        }

        @Override
        public final java.lang.String getTransitGatewayId() {
            return this.transitGatewayId;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.ec2_transit_gateway_peering_attachment.Ec2TransitGatewayPeeringAttachmentOptions getOptions() {
            return this.options;
        }

        @Override
        public final java.lang.String getPeerAccountId() {
            return this.peerAccountId;
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

            data.set("peerRegion", om.valueToTree(this.getPeerRegion()));
            data.set("peerTransitGatewayId", om.valueToTree(this.getPeerTransitGatewayId()));
            data.set("transitGatewayId", om.valueToTree(this.getTransitGatewayId()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOptions() != null) {
                data.set("options", om.valueToTree(this.getOptions()));
            }
            if (this.getPeerAccountId() != null) {
                data.set("peerAccountId", om.valueToTree(this.getPeerAccountId()));
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
            struct.set("fqn", om.valueToTree("aws.ec2TransitGatewayPeeringAttachment.Ec2TransitGatewayPeeringAttachmentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2TransitGatewayPeeringAttachmentConfig.Jsii$Proxy that = (Ec2TransitGatewayPeeringAttachmentConfig.Jsii$Proxy) o;

            if (!peerRegion.equals(that.peerRegion)) return false;
            if (!peerTransitGatewayId.equals(that.peerTransitGatewayId)) return false;
            if (!transitGatewayId.equals(that.transitGatewayId)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.options != null ? !this.options.equals(that.options) : that.options != null) return false;
            if (this.peerAccountId != null ? !this.peerAccountId.equals(that.peerAccountId) : that.peerAccountId != null) return false;
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
            int result = this.peerRegion.hashCode();
            result = 31 * result + (this.peerTransitGatewayId.hashCode());
            result = 31 * result + (this.transitGatewayId.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.options != null ? this.options.hashCode() : 0);
            result = 31 * result + (this.peerAccountId != null ? this.peerAccountId.hashCode() : 0);
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
