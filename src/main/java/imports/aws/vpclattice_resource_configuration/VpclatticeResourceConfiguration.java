package imports.aws.vpclattice_resource_configuration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration aws_vpclattice_resource_configuration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.621Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeResourceConfiguration.VpclatticeResourceConfiguration")
public class VpclatticeResourceConfiguration extends com.hashicorp.cdktf.TerraformResource {

    protected VpclatticeResourceConfiguration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpclatticeResourceConfiguration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfiguration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration aws_vpclattice_resource_configuration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public VpclatticeResourceConfiguration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a VpclatticeResourceConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VpclatticeResourceConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing VpclatticeResourceConfiguration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the VpclatticeResourceConfiguration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a VpclatticeResourceConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VpclatticeResourceConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing VpclatticeResourceConfiguration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putResourceConfigurationDefinition(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinition>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinition> __cast_cd4240 = (java.util.List<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinition>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinition __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResourceConfigurationDefinition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllowAssociationToShareableServiceNetwork() {
        software.amazon.jsii.Kernel.call(this, "resetAllowAssociationToShareableServiceNetwork", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPortRanges() {
        software.amazon.jsii.Kernel.call(this, "resetPortRanges", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetProtocol", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceConfigurationDefinition() {
        software.amazon.jsii.Kernel.call(this, "resetResourceConfigurationDefinition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceConfigurationGroupId() {
        software.amazon.jsii.Kernel.call(this, "resetResourceConfigurationGroupId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceGatewayIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetResourceGatewayIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionList getResourceConfigurationDefinition() {
        return software.amazon.jsii.Kernel.get(this, "resourceConfigurationDefinition", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinitionList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAllowAssociationToShareableServiceNetworkInput() {
        return software.amazon.jsii.Kernel.get(this, "allowAssociationToShareableServiceNetworkInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPortRangesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "portRangesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceConfigurationDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceConfigurationDefinitionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceConfigurationGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceConfigurationGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourceGatewayIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceGatewayIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAllowAssociationToShareableServiceNetwork() {
        return software.amazon.jsii.Kernel.get(this, "allowAssociationToShareableServiceNetwork", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAllowAssociationToShareableServiceNetwork(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "allowAssociationToShareableServiceNetwork", java.util.Objects.requireNonNull(value, "allowAssociationToShareableServiceNetwork is required"));
    }

    public void setAllowAssociationToShareableServiceNetwork(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "allowAssociationToShareableServiceNetwork", java.util.Objects.requireNonNull(value, "allowAssociationToShareableServiceNetwork is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPortRanges() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "portRanges", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPortRanges(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "portRanges", java.util.Objects.requireNonNull(value, "portRanges is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProtocol() {
        return software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "protocol", java.util.Objects.requireNonNull(value, "protocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceConfigurationGroupId() {
        return software.amazon.jsii.Kernel.get(this, "resourceConfigurationGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceConfigurationGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceConfigurationGroupId", java.util.Objects.requireNonNull(value, "resourceConfigurationGroupId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceGatewayIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "resourceGatewayIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourceGatewayIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourceGatewayIdentifier", java.util.Objects.requireNonNull(value, "resourceGatewayIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfiguration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfiguration> {
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
        private final imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#name VpclatticeResourceConfiguration#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#name VpclatticeResourceConfiguration#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#allow_association_to_shareable_service_network VpclatticeResourceConfiguration#allow_association_to_shareable_service_network}.
         * <p>
         * @return {@code this}
         * @param allowAssociationToShareableServiceNetwork Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#allow_association_to_shareable_service_network VpclatticeResourceConfiguration#allow_association_to_shareable_service_network}. This parameter is required.
         */
        public Builder allowAssociationToShareableServiceNetwork(final java.lang.Boolean allowAssociationToShareableServiceNetwork) {
            this.config.allowAssociationToShareableServiceNetwork(allowAssociationToShareableServiceNetwork);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#allow_association_to_shareable_service_network VpclatticeResourceConfiguration#allow_association_to_shareable_service_network}.
         * <p>
         * @return {@code this}
         * @param allowAssociationToShareableServiceNetwork Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#allow_association_to_shareable_service_network VpclatticeResourceConfiguration#allow_association_to_shareable_service_network}. This parameter is required.
         */
        public Builder allowAssociationToShareableServiceNetwork(final com.hashicorp.cdktf.IResolvable allowAssociationToShareableServiceNetwork) {
            this.config.allowAssociationToShareableServiceNetwork(allowAssociationToShareableServiceNetwork);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#port_ranges VpclatticeResourceConfiguration#port_ranges}.
         * <p>
         * @return {@code this}
         * @param portRanges Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#port_ranges VpclatticeResourceConfiguration#port_ranges}. This parameter is required.
         */
        public Builder portRanges(final java.util.List<java.lang.String> portRanges) {
            this.config.portRanges(portRanges);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#protocol VpclatticeResourceConfiguration#protocol}.
         * <p>
         * @return {@code this}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#protocol VpclatticeResourceConfiguration#protocol}. This parameter is required.
         */
        public Builder protocol(final java.lang.String protocol) {
            this.config.protocol(protocol);
            return this;
        }

        /**
         * resource_configuration_definition block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_configuration_definition VpclatticeResourceConfiguration#resource_configuration_definition}
         * <p>
         * @return {@code this}
         * @param resourceConfigurationDefinition resource_configuration_definition block. This parameter is required.
         */
        public Builder resourceConfigurationDefinition(final com.hashicorp.cdktf.IResolvable resourceConfigurationDefinition) {
            this.config.resourceConfigurationDefinition(resourceConfigurationDefinition);
            return this;
        }
        /**
         * resource_configuration_definition block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_configuration_definition VpclatticeResourceConfiguration#resource_configuration_definition}
         * <p>
         * @return {@code this}
         * @param resourceConfigurationDefinition resource_configuration_definition block. This parameter is required.
         */
        public Builder resourceConfigurationDefinition(final java.util.List<? extends imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationResourceConfigurationDefinition> resourceConfigurationDefinition) {
            this.config.resourceConfigurationDefinition(resourceConfigurationDefinition);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_configuration_group_id VpclatticeResourceConfiguration#resource_configuration_group_id}.
         * <p>
         * @return {@code this}
         * @param resourceConfigurationGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_configuration_group_id VpclatticeResourceConfiguration#resource_configuration_group_id}. This parameter is required.
         */
        public Builder resourceConfigurationGroupId(final java.lang.String resourceConfigurationGroupId) {
            this.config.resourceConfigurationGroupId(resourceConfigurationGroupId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_gateway_identifier VpclatticeResourceConfiguration#resource_gateway_identifier}.
         * <p>
         * @return {@code this}
         * @param resourceGatewayIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#resource_gateway_identifier VpclatticeResourceConfiguration#resource_gateway_identifier}. This parameter is required.
         */
        public Builder resourceGatewayIdentifier(final java.lang.String resourceGatewayIdentifier) {
            this.config.resourceGatewayIdentifier(resourceGatewayIdentifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#tags VpclatticeResourceConfiguration#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#tags VpclatticeResourceConfiguration#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#timeouts VpclatticeResourceConfiguration#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfigurationTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#type VpclatticeResourceConfiguration#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_resource_configuration#type VpclatticeResourceConfiguration#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfiguration}.
         */
        @Override
        public imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfiguration build() {
            return new imports.aws.vpclattice_resource_configuration.VpclatticeResourceConfiguration(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
