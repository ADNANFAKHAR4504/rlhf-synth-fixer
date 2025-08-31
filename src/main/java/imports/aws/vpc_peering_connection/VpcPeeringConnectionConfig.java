package imports.aws.vpc_peering_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.608Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcPeeringConnection.VpcPeeringConnectionConfig")
@software.amazon.jsii.Jsii.Proxy(VpcPeeringConnectionConfig.Jsii$Proxy.class)
public interface VpcPeeringConnectionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#peer_vpc_id VpcPeeringConnection#peer_vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPeerVpcId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#vpc_id VpcPeeringConnection#vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcId();

    /**
     * accepter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#accepter VpcPeeringConnection#accepter}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpc_peering_connection.VpcPeeringConnectionAccepter getAccepter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#auto_accept VpcPeeringConnection#auto_accept}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoAccept() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#id VpcPeeringConnection#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#peer_owner_id VpcPeeringConnection#peer_owner_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPeerOwnerId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#peer_region VpcPeeringConnection#peer_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPeerRegion() {
        return null;
    }

    /**
     * requester block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#requester VpcPeeringConnection#requester}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpc_peering_connection.VpcPeeringConnectionRequester getRequester() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#tags VpcPeeringConnection#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#tags_all VpcPeeringConnection#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#timeouts VpcPeeringConnection#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpc_peering_connection.VpcPeeringConnectionTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcPeeringConnectionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcPeeringConnectionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcPeeringConnectionConfig> {
        java.lang.String peerVpcId;
        java.lang.String vpcId;
        imports.aws.vpc_peering_connection.VpcPeeringConnectionAccepter accepter;
        java.lang.Object autoAccept;
        java.lang.String id;
        java.lang.String peerOwnerId;
        java.lang.String peerRegion;
        imports.aws.vpc_peering_connection.VpcPeeringConnectionRequester requester;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.vpc_peering_connection.VpcPeeringConnectionTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getPeerVpcId}
         * @param peerVpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#peer_vpc_id VpcPeeringConnection#peer_vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder peerVpcId(java.lang.String peerVpcId) {
            this.peerVpcId = peerVpcId;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#vpc_id VpcPeeringConnection#vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getAccepter}
         * @param accepter accepter block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#accepter VpcPeeringConnection#accepter}
         * @return {@code this}
         */
        public Builder accepter(imports.aws.vpc_peering_connection.VpcPeeringConnectionAccepter accepter) {
            this.accepter = accepter;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getAutoAccept}
         * @param autoAccept Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#auto_accept VpcPeeringConnection#auto_accept}.
         * @return {@code this}
         */
        public Builder autoAccept(java.lang.Boolean autoAccept) {
            this.autoAccept = autoAccept;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getAutoAccept}
         * @param autoAccept Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#auto_accept VpcPeeringConnection#auto_accept}.
         * @return {@code this}
         */
        public Builder autoAccept(com.hashicorp.cdktf.IResolvable autoAccept) {
            this.autoAccept = autoAccept;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#id VpcPeeringConnection#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getPeerOwnerId}
         * @param peerOwnerId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#peer_owner_id VpcPeeringConnection#peer_owner_id}.
         * @return {@code this}
         */
        public Builder peerOwnerId(java.lang.String peerOwnerId) {
            this.peerOwnerId = peerOwnerId;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getPeerRegion}
         * @param peerRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#peer_region VpcPeeringConnection#peer_region}.
         * @return {@code this}
         */
        public Builder peerRegion(java.lang.String peerRegion) {
            this.peerRegion = peerRegion;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getRequester}
         * @param requester requester block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#requester VpcPeeringConnection#requester}
         * @return {@code this}
         */
        public Builder requester(imports.aws.vpc_peering_connection.VpcPeeringConnectionRequester requester) {
            this.requester = requester;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#tags VpcPeeringConnection#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#tags_all VpcPeeringConnection#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_peering_connection#timeouts VpcPeeringConnection#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.vpc_peering_connection.VpcPeeringConnectionTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getDependsOn}
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
         * Sets the value of {@link VpcPeeringConnectionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VpcPeeringConnectionConfig#getProvisioners}
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
         * @return a new instance of {@link VpcPeeringConnectionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcPeeringConnectionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcPeeringConnectionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcPeeringConnectionConfig {
        private final java.lang.String peerVpcId;
        private final java.lang.String vpcId;
        private final imports.aws.vpc_peering_connection.VpcPeeringConnectionAccepter accepter;
        private final java.lang.Object autoAccept;
        private final java.lang.String id;
        private final java.lang.String peerOwnerId;
        private final java.lang.String peerRegion;
        private final imports.aws.vpc_peering_connection.VpcPeeringConnectionRequester requester;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.vpc_peering_connection.VpcPeeringConnectionTimeouts timeouts;
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
            this.peerVpcId = software.amazon.jsii.Kernel.get(this, "peerVpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accepter = software.amazon.jsii.Kernel.get(this, "accepter", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_peering_connection.VpcPeeringConnectionAccepter.class));
            this.autoAccept = software.amazon.jsii.Kernel.get(this, "autoAccept", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.peerOwnerId = software.amazon.jsii.Kernel.get(this, "peerOwnerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.peerRegion = software.amazon.jsii.Kernel.get(this, "peerRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.requester = software.amazon.jsii.Kernel.get(this, "requester", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_peering_connection.VpcPeeringConnectionRequester.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_peering_connection.VpcPeeringConnectionTimeouts.class));
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
            this.peerVpcId = java.util.Objects.requireNonNull(builder.peerVpcId, "peerVpcId is required");
            this.vpcId = java.util.Objects.requireNonNull(builder.vpcId, "vpcId is required");
            this.accepter = builder.accepter;
            this.autoAccept = builder.autoAccept;
            this.id = builder.id;
            this.peerOwnerId = builder.peerOwnerId;
            this.peerRegion = builder.peerRegion;
            this.requester = builder.requester;
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
        public final java.lang.String getPeerVpcId() {
            return this.peerVpcId;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        public final imports.aws.vpc_peering_connection.VpcPeeringConnectionAccepter getAccepter() {
            return this.accepter;
        }

        @Override
        public final java.lang.Object getAutoAccept() {
            return this.autoAccept;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getPeerOwnerId() {
            return this.peerOwnerId;
        }

        @Override
        public final java.lang.String getPeerRegion() {
            return this.peerRegion;
        }

        @Override
        public final imports.aws.vpc_peering_connection.VpcPeeringConnectionRequester getRequester() {
            return this.requester;
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
        public final imports.aws.vpc_peering_connection.VpcPeeringConnectionTimeouts getTimeouts() {
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

            data.set("peerVpcId", om.valueToTree(this.getPeerVpcId()));
            data.set("vpcId", om.valueToTree(this.getVpcId()));
            if (this.getAccepter() != null) {
                data.set("accepter", om.valueToTree(this.getAccepter()));
            }
            if (this.getAutoAccept() != null) {
                data.set("autoAccept", om.valueToTree(this.getAutoAccept()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPeerOwnerId() != null) {
                data.set("peerOwnerId", om.valueToTree(this.getPeerOwnerId()));
            }
            if (this.getPeerRegion() != null) {
                data.set("peerRegion", om.valueToTree(this.getPeerRegion()));
            }
            if (this.getRequester() != null) {
                data.set("requester", om.valueToTree(this.getRequester()));
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
            struct.set("fqn", om.valueToTree("aws.vpcPeeringConnection.VpcPeeringConnectionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcPeeringConnectionConfig.Jsii$Proxy that = (VpcPeeringConnectionConfig.Jsii$Proxy) o;

            if (!peerVpcId.equals(that.peerVpcId)) return false;
            if (!vpcId.equals(that.vpcId)) return false;
            if (this.accepter != null ? !this.accepter.equals(that.accepter) : that.accepter != null) return false;
            if (this.autoAccept != null ? !this.autoAccept.equals(that.autoAccept) : that.autoAccept != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.peerOwnerId != null ? !this.peerOwnerId.equals(that.peerOwnerId) : that.peerOwnerId != null) return false;
            if (this.peerRegion != null ? !this.peerRegion.equals(that.peerRegion) : that.peerRegion != null) return false;
            if (this.requester != null ? !this.requester.equals(that.requester) : that.requester != null) return false;
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
            int result = this.peerVpcId.hashCode();
            result = 31 * result + (this.vpcId.hashCode());
            result = 31 * result + (this.accepter != null ? this.accepter.hashCode() : 0);
            result = 31 * result + (this.autoAccept != null ? this.autoAccept.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.peerOwnerId != null ? this.peerOwnerId.hashCode() : 0);
            result = 31 * result + (this.peerRegion != null ? this.peerRegion.hashCode() : 0);
            result = 31 * result + (this.requester != null ? this.requester.hashCode() : 0);
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
