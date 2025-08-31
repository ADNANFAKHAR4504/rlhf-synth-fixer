package imports.aws.vpclattice_resource_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.621Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeResourceConfiguration.VpclatticeResourceConfigurationConfig")
@software.amazon.jsii.Jsii.Proxy(VpclatticeResourceConfigurationConfig.Jsii$Proxy.class)
public interface VpclatticeResourceConfigurationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#name VpclatticeResourceConfiguration#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#allow_association_to_shareable_service_network VpclatticeResourceConfiguration#allow_association_to_shareable_service_network}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowAssociationToShareableServiceNetwork() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#port_ranges VpclatticeResourceConfiguration#port_ranges}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPortRanges() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#protocol VpclatticeResourceConfiguration#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * resource_configuration_definition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_configuration_definition VpclatticeResourceConfiguration#resource_configuration_definition}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getResourceConfigurationDefinition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_configuration_group_id VpclatticeResourceConfiguration#resource_configuration_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceConfigurationGroupId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_gateway_identifier VpclatticeResourceConfiguration#resource_gateway_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceGatewayIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#tags VpclatticeResourceConfiguration#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#timeouts VpclatticeResourceConfiguration#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#type VpclatticeResourceConfiguration#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeResourceConfigurationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeResourceConfigurationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeResourceConfigurationConfig> {
        java.lang.String name;
        java.lang.Object allowAssociationToShareableServiceNetwork;
        java.util.List<java.lang.String> portRanges;
        java.lang.String protocol;
        java.lang.Object resourceConfigurationDefinition;
        java.lang.String resourceConfigurationGroupId;
        java.lang.String resourceGatewayIdentifier;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationTimeouts timeouts;
        java.lang.String type;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#name VpclatticeResourceConfiguration#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getAllowAssociationToShareableServiceNetwork}
         * @param allowAssociationToShareableServiceNetwork Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#allow_association_to_shareable_service_network VpclatticeResourceConfiguration#allow_association_to_shareable_service_network}.
         * @return {@code this}
         */
        public Builder allowAssociationToShareableServiceNetwork(java.lang.Boolean allowAssociationToShareableServiceNetwork) {
            this.allowAssociationToShareableServiceNetwork = allowAssociationToShareableServiceNetwork;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getAllowAssociationToShareableServiceNetwork}
         * @param allowAssociationToShareableServiceNetwork Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#allow_association_to_shareable_service_network VpclatticeResourceConfiguration#allow_association_to_shareable_service_network}.
         * @return {@code this}
         */
        public Builder allowAssociationToShareableServiceNetwork(com.hashicorp.cdktf.IResolvable allowAssociationToShareableServiceNetwork) {
            this.allowAssociationToShareableServiceNetwork = allowAssociationToShareableServiceNetwork;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getPortRanges}
         * @param portRanges Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#port_ranges VpclatticeResourceConfiguration#port_ranges}.
         * @return {@code this}
         */
        public Builder portRanges(java.util.List<java.lang.String> portRanges) {
            this.portRanges = portRanges;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#protocol VpclatticeResourceConfiguration#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getResourceConfigurationDefinition}
         * @param resourceConfigurationDefinition resource_configuration_definition block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_configuration_definition VpclatticeResourceConfiguration#resource_configuration_definition}
         * @return {@code this}
         */
        public Builder resourceConfigurationDefinition(com.hashicorp.cdktf.IResolvable resourceConfigurationDefinition) {
            this.resourceConfigurationDefinition = resourceConfigurationDefinition;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getResourceConfigurationDefinition}
         * @param resourceConfigurationDefinition resource_configuration_definition block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_configuration_definition VpclatticeResourceConfiguration#resource_configuration_definition}
         * @return {@code this}
         */
        public Builder resourceConfigurationDefinition(java.util.List<? extends imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinition> resourceConfigurationDefinition) {
            this.resourceConfigurationDefinition = resourceConfigurationDefinition;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getResourceConfigurationGroupId}
         * @param resourceConfigurationGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_configuration_group_id VpclatticeResourceConfiguration#resource_configuration_group_id}.
         * @return {@code this}
         */
        public Builder resourceConfigurationGroupId(java.lang.String resourceConfigurationGroupId) {
            this.resourceConfigurationGroupId = resourceConfigurationGroupId;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getResourceGatewayIdentifier}
         * @param resourceGatewayIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_gateway_identifier VpclatticeResourceConfiguration#resource_gateway_identifier}.
         * @return {@code this}
         */
        public Builder resourceGatewayIdentifier(java.lang.String resourceGatewayIdentifier) {
            this.resourceGatewayIdentifier = resourceGatewayIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#tags VpclatticeResourceConfiguration#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#timeouts VpclatticeResourceConfiguration#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#type VpclatticeResourceConfiguration#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getDependsOn}
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
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeResourceConfigurationConfig#getProvisioners}
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
         * @return a new instance of {@link VpclatticeResourceConfigurationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeResourceConfigurationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeResourceConfigurationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeResourceConfigurationConfig {
        private final java.lang.String name;
        private final java.lang.Object allowAssociationToShareableServiceNetwork;
        private final java.util.List<java.lang.String> portRanges;
        private final java.lang.String protocol;
        private final java.lang.Object resourceConfigurationDefinition;
        private final java.lang.String resourceConfigurationGroupId;
        private final java.lang.String resourceGatewayIdentifier;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationTimeouts timeouts;
        private final java.lang.String type;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allowAssociationToShareableServiceNetwork = software.amazon.jsii.Kernel.get(this, "allowAssociationToShareableServiceNetwork", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.portRanges = software.amazon.jsii.Kernel.get(this, "portRanges", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceConfigurationDefinition = software.amazon.jsii.Kernel.get(this, "resourceConfigurationDefinition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.resourceConfigurationGroupId = software.amazon.jsii.Kernel.get(this, "resourceConfigurationGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceGatewayIdentifier = software.amazon.jsii.Kernel.get(this, "resourceGatewayIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationTimeouts.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.allowAssociationToShareableServiceNetwork = builder.allowAssociationToShareableServiceNetwork;
            this.portRanges = builder.portRanges;
            this.protocol = builder.protocol;
            this.resourceConfigurationDefinition = builder.resourceConfigurationDefinition;
            this.resourceConfigurationGroupId = builder.resourceConfigurationGroupId;
            this.resourceGatewayIdentifier = builder.resourceGatewayIdentifier;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.type = builder.type;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getAllowAssociationToShareableServiceNetwork() {
            return this.allowAssociationToShareableServiceNetwork;
        }

        @Override
        public final java.util.List<java.lang.String> getPortRanges() {
            return this.portRanges;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.Object getResourceConfigurationDefinition() {
            return this.resourceConfigurationDefinition;
        }

        @Override
        public final java.lang.String getResourceConfigurationGroupId() {
            return this.resourceConfigurationGroupId;
        }

        @Override
        public final java.lang.String getResourceGatewayIdentifier() {
            return this.resourceGatewayIdentifier;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
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

            data.set("name", om.valueToTree(this.getName()));
            if (this.getAllowAssociationToShareableServiceNetwork() != null) {
                data.set("allowAssociationToShareableServiceNetwork", om.valueToTree(this.getAllowAssociationToShareableServiceNetwork()));
            }
            if (this.getPortRanges() != null) {
                data.set("portRanges", om.valueToTree(this.getPortRanges()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }
            if (this.getResourceConfigurationDefinition() != null) {
                data.set("resourceConfigurationDefinition", om.valueToTree(this.getResourceConfigurationDefinition()));
            }
            if (this.getResourceConfigurationGroupId() != null) {
                data.set("resourceConfigurationGroupId", om.valueToTree(this.getResourceConfigurationGroupId()));
            }
            if (this.getResourceGatewayIdentifier() != null) {
                data.set("resourceGatewayIdentifier", om.valueToTree(this.getResourceGatewayIdentifier()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
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
            struct.set("fqn", om.valueToTree("aws.vpclatticeResourceConfiguration.VpclatticeResourceConfigurationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeResourceConfigurationConfig.Jsii$Proxy that = (VpclatticeResourceConfigurationConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.allowAssociationToShareableServiceNetwork != null ? !this.allowAssociationToShareableServiceNetwork.equals(that.allowAssociationToShareableServiceNetwork) : that.allowAssociationToShareableServiceNetwork != null) return false;
            if (this.portRanges != null ? !this.portRanges.equals(that.portRanges) : that.portRanges != null) return false;
            if (this.protocol != null ? !this.protocol.equals(that.protocol) : that.protocol != null) return false;
            if (this.resourceConfigurationDefinition != null ? !this.resourceConfigurationDefinition.equals(that.resourceConfigurationDefinition) : that.resourceConfigurationDefinition != null) return false;
            if (this.resourceConfigurationGroupId != null ? !this.resourceConfigurationGroupId.equals(that.resourceConfigurationGroupId) : that.resourceConfigurationGroupId != null) return false;
            if (this.resourceGatewayIdentifier != null ? !this.resourceGatewayIdentifier.equals(that.resourceGatewayIdentifier) : that.resourceGatewayIdentifier != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.allowAssociationToShareableServiceNetwork != null ? this.allowAssociationToShareableServiceNetwork.hashCode() : 0);
            result = 31 * result + (this.portRanges != null ? this.portRanges.hashCode() : 0);
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            result = 31 * result + (this.resourceConfigurationDefinition != null ? this.resourceConfigurationDefinition.hashCode() : 0);
            result = 31 * result + (this.resourceConfigurationGroupId != null ? this.resourceConfigurationGroupId.hashCode() : 0);
            result = 31 * result + (this.resourceGatewayIdentifier != null ? this.resourceGatewayIdentifier.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
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
