package imports.aws.ec2_traffic_mirror_session;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.103Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TrafficMirrorSession.Ec2TrafficMirrorSessionConfig")
@software.amazon.jsii.Jsii.Proxy(Ec2TrafficMirrorSessionConfig.Jsii$Proxy.class)
public interface Ec2TrafficMirrorSessionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#network_interface_id Ec2TrafficMirrorSession#network_interface_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNetworkInterfaceId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#session_number Ec2TrafficMirrorSession#session_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getSessionNumber();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#traffic_mirror_filter_id Ec2TrafficMirrorSession#traffic_mirror_filter_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTrafficMirrorFilterId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#traffic_mirror_target_id Ec2TrafficMirrorSession#traffic_mirror_target_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTrafficMirrorTargetId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#description Ec2TrafficMirrorSession#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#id Ec2TrafficMirrorSession#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#packet_length Ec2TrafficMirrorSession#packet_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPacketLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#tags Ec2TrafficMirrorSession#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#tags_all Ec2TrafficMirrorSession#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#virtual_network_id Ec2TrafficMirrorSession#virtual_network_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getVirtualNetworkId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2TrafficMirrorSessionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2TrafficMirrorSessionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2TrafficMirrorSessionConfig> {
        java.lang.String networkInterfaceId;
        java.lang.Number sessionNumber;
        java.lang.String trafficMirrorFilterId;
        java.lang.String trafficMirrorTargetId;
        java.lang.String description;
        java.lang.String id;
        java.lang.Number packetLength;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Number virtualNetworkId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getNetworkInterfaceId}
         * @param networkInterfaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#network_interface_id Ec2TrafficMirrorSession#network_interface_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder networkInterfaceId(java.lang.String networkInterfaceId) {
            this.networkInterfaceId = networkInterfaceId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getSessionNumber}
         * @param sessionNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#session_number Ec2TrafficMirrorSession#session_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder sessionNumber(java.lang.Number sessionNumber) {
            this.sessionNumber = sessionNumber;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getTrafficMirrorFilterId}
         * @param trafficMirrorFilterId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#traffic_mirror_filter_id Ec2TrafficMirrorSession#traffic_mirror_filter_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder trafficMirrorFilterId(java.lang.String trafficMirrorFilterId) {
            this.trafficMirrorFilterId = trafficMirrorFilterId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getTrafficMirrorTargetId}
         * @param trafficMirrorTargetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#traffic_mirror_target_id Ec2TrafficMirrorSession#traffic_mirror_target_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder trafficMirrorTargetId(java.lang.String trafficMirrorTargetId) {
            this.trafficMirrorTargetId = trafficMirrorTargetId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#description Ec2TrafficMirrorSession#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#id Ec2TrafficMirrorSession#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getPacketLength}
         * @param packetLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#packet_length Ec2TrafficMirrorSession#packet_length}.
         * @return {@code this}
         */
        public Builder packetLength(java.lang.Number packetLength) {
            this.packetLength = packetLength;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#tags Ec2TrafficMirrorSession#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#tags_all Ec2TrafficMirrorSession#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getVirtualNetworkId}
         * @param virtualNetworkId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_traffic_mirror_session#virtual_network_id Ec2TrafficMirrorSession#virtual_network_id}.
         * @return {@code this}
         */
        public Builder virtualNetworkId(java.lang.Number virtualNetworkId) {
            this.virtualNetworkId = virtualNetworkId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getDependsOn}
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
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TrafficMirrorSessionConfig#getProvisioners}
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
         * @return a new instance of {@link Ec2TrafficMirrorSessionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2TrafficMirrorSessionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2TrafficMirrorSessionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2TrafficMirrorSessionConfig {
        private final java.lang.String networkInterfaceId;
        private final java.lang.Number sessionNumber;
        private final java.lang.String trafficMirrorFilterId;
        private final java.lang.String trafficMirrorTargetId;
        private final java.lang.String description;
        private final java.lang.String id;
        private final java.lang.Number packetLength;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Number virtualNetworkId;
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
            this.networkInterfaceId = software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sessionNumber = software.amazon.jsii.Kernel.get(this, "sessionNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.trafficMirrorFilterId = software.amazon.jsii.Kernel.get(this, "trafficMirrorFilterId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.trafficMirrorTargetId = software.amazon.jsii.Kernel.get(this, "trafficMirrorTargetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.packetLength = software.amazon.jsii.Kernel.get(this, "packetLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.virtualNetworkId = software.amazon.jsii.Kernel.get(this, "virtualNetworkId", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.networkInterfaceId = java.util.Objects.requireNonNull(builder.networkInterfaceId, "networkInterfaceId is required");
            this.sessionNumber = java.util.Objects.requireNonNull(builder.sessionNumber, "sessionNumber is required");
            this.trafficMirrorFilterId = java.util.Objects.requireNonNull(builder.trafficMirrorFilterId, "trafficMirrorFilterId is required");
            this.trafficMirrorTargetId = java.util.Objects.requireNonNull(builder.trafficMirrorTargetId, "trafficMirrorTargetId is required");
            this.description = builder.description;
            this.id = builder.id;
            this.packetLength = builder.packetLength;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.virtualNetworkId = builder.virtualNetworkId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getNetworkInterfaceId() {
            return this.networkInterfaceId;
        }

        @Override
        public final java.lang.Number getSessionNumber() {
            return this.sessionNumber;
        }

        @Override
        public final java.lang.String getTrafficMirrorFilterId() {
            return this.trafficMirrorFilterId;
        }

        @Override
        public final java.lang.String getTrafficMirrorTargetId() {
            return this.trafficMirrorTargetId;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getPacketLength() {
            return this.packetLength;
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
        public final java.lang.Number getVirtualNetworkId() {
            return this.virtualNetworkId;
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

            data.set("networkInterfaceId", om.valueToTree(this.getNetworkInterfaceId()));
            data.set("sessionNumber", om.valueToTree(this.getSessionNumber()));
            data.set("trafficMirrorFilterId", om.valueToTree(this.getTrafficMirrorFilterId()));
            data.set("trafficMirrorTargetId", om.valueToTree(this.getTrafficMirrorTargetId()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPacketLength() != null) {
                data.set("packetLength", om.valueToTree(this.getPacketLength()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getVirtualNetworkId() != null) {
                data.set("virtualNetworkId", om.valueToTree(this.getVirtualNetworkId()));
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
            struct.set("fqn", om.valueToTree("aws.ec2TrafficMirrorSession.Ec2TrafficMirrorSessionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2TrafficMirrorSessionConfig.Jsii$Proxy that = (Ec2TrafficMirrorSessionConfig.Jsii$Proxy) o;

            if (!networkInterfaceId.equals(that.networkInterfaceId)) return false;
            if (!sessionNumber.equals(that.sessionNumber)) return false;
            if (!trafficMirrorFilterId.equals(that.trafficMirrorFilterId)) return false;
            if (!trafficMirrorTargetId.equals(that.trafficMirrorTargetId)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.packetLength != null ? !this.packetLength.equals(that.packetLength) : that.packetLength != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.virtualNetworkId != null ? !this.virtualNetworkId.equals(that.virtualNetworkId) : that.virtualNetworkId != null) return false;
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
            int result = this.networkInterfaceId.hashCode();
            result = 31 * result + (this.sessionNumber.hashCode());
            result = 31 * result + (this.trafficMirrorFilterId.hashCode());
            result = 31 * result + (this.trafficMirrorTargetId.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.packetLength != null ? this.packetLength.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.virtualNetworkId != null ? this.virtualNetworkId.hashCode() : 0);
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
