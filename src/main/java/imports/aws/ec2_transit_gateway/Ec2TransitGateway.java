package imports.aws.ec2_transit_gateway;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway aws_ec2_transit_gateway}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.104Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TransitGateway.Ec2TransitGateway")
public class Ec2TransitGateway extends com.hashicorp.cdktf.TerraformResource {

    protected Ec2TransitGateway(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2TransitGateway(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ec2_transit_gateway.Ec2TransitGateway.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway aws_ec2_transit_gateway} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public Ec2TransitGateway(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.ec2_transit_gateway.Ec2TransitGatewayConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway aws_ec2_transit_gateway} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public Ec2TransitGateway(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a Ec2TransitGateway resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2TransitGateway to import. This parameter is required.
     * @param importFromId The id of the existing Ec2TransitGateway that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Ec2TransitGateway to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_transit_gateway.Ec2TransitGateway.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Ec2TransitGateway resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2TransitGateway to import. This parameter is required.
     * @param importFromId The id of the existing Ec2TransitGateway that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_transit_gateway.Ec2TransitGateway.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.ec2_transit_gateway.Ec2TransitGatewayTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAmazonSideAsn() {
        software.amazon.jsii.Kernel.call(this, "resetAmazonSideAsn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoAcceptSharedAttachments() {
        software.amazon.jsii.Kernel.call(this, "resetAutoAcceptSharedAttachments", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultRouteTableAssociation() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultRouteTableAssociation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultRouteTablePropagation() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultRouteTablePropagation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDnsSupport() {
        software.amazon.jsii.Kernel.call(this, "resetDnsSupport", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMulticastSupport() {
        software.amazon.jsii.Kernel.call(this, "resetMulticastSupport", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupReferencingSupport() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupReferencingSupport", software.amazon.jsii.NativeType.VOID);
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

    public void resetTransitGatewayCidrBlocks() {
        software.amazon.jsii.Kernel.call(this, "resetTransitGatewayCidrBlocks", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpnEcmpSupport() {
        software.amazon.jsii.Kernel.call(this, "resetVpnEcmpSupport", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociationDefaultRouteTableId() {
        return software.amazon.jsii.Kernel.get(this, "associationDefaultRouteTableId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwnerId() {
        return software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPropagationDefaultRouteTableId() {
        return software.amazon.jsii.Kernel.get(this, "propagationDefaultRouteTableId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_transit_gateway.Ec2TransitGatewayTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_transit_gateway.Ec2TransitGatewayTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAmazonSideAsnInput() {
        return software.amazon.jsii.Kernel.get(this, "amazonSideAsnInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoAcceptSharedAttachmentsInput() {
        return software.amazon.jsii.Kernel.get(this, "autoAcceptSharedAttachmentsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultRouteTableAssociationInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultRouteTableAssociationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultRouteTablePropagationInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultRouteTablePropagationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDnsSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "dnsSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMulticastSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "multicastSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSecurityGroupReferencingSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "securityGroupReferencingSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTransitGatewayCidrBlocksInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "transitGatewayCidrBlocksInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpnEcmpSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "vpnEcmpSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAmazonSideAsn() {
        return software.amazon.jsii.Kernel.get(this, "amazonSideAsn", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAmazonSideAsn(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "amazonSideAsn", java.util.Objects.requireNonNull(value, "amazonSideAsn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoAcceptSharedAttachments() {
        return software.amazon.jsii.Kernel.get(this, "autoAcceptSharedAttachments", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoAcceptSharedAttachments(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoAcceptSharedAttachments", java.util.Objects.requireNonNull(value, "autoAcceptSharedAttachments is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultRouteTableAssociation() {
        return software.amazon.jsii.Kernel.get(this, "defaultRouteTableAssociation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultRouteTableAssociation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultRouteTableAssociation", java.util.Objects.requireNonNull(value, "defaultRouteTableAssociation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultRouteTablePropagation() {
        return software.amazon.jsii.Kernel.get(this, "defaultRouteTablePropagation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultRouteTablePropagation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultRouteTablePropagation", java.util.Objects.requireNonNull(value, "defaultRouteTablePropagation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsSupport() {
        return software.amazon.jsii.Kernel.get(this, "dnsSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDnsSupport(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dnsSupport", java.util.Objects.requireNonNull(value, "dnsSupport is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMulticastSupport() {
        return software.amazon.jsii.Kernel.get(this, "multicastSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMulticastSupport(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "multicastSupport", java.util.Objects.requireNonNull(value, "multicastSupport is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityGroupReferencingSupport() {
        return software.amazon.jsii.Kernel.get(this, "securityGroupReferencingSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSecurityGroupReferencingSupport(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupReferencingSupport", java.util.Objects.requireNonNull(value, "securityGroupReferencingSupport is required"));
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTransitGatewayCidrBlocks() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "transitGatewayCidrBlocks", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTransitGatewayCidrBlocks(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayCidrBlocks", java.util.Objects.requireNonNull(value, "transitGatewayCidrBlocks is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpnEcmpSupport() {
        return software.amazon.jsii.Kernel.get(this, "vpnEcmpSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpnEcmpSupport(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpnEcmpSupport", java.util.Objects.requireNonNull(value, "vpnEcmpSupport is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ec2_transit_gateway.Ec2TransitGateway}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ec2_transit_gateway.Ec2TransitGateway> {
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
        private imports.aws.ec2_transit_gateway.Ec2TransitGatewayConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#amazon_side_asn Ec2TransitGateway#amazon_side_asn}.
         * <p>
         * @return {@code this}
         * @param amazonSideAsn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#amazon_side_asn Ec2TransitGateway#amazon_side_asn}. This parameter is required.
         */
        public Builder amazonSideAsn(final java.lang.Number amazonSideAsn) {
            this.config().amazonSideAsn(amazonSideAsn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#auto_accept_shared_attachments Ec2TransitGateway#auto_accept_shared_attachments}.
         * <p>
         * @return {@code this}
         * @param autoAcceptSharedAttachments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#auto_accept_shared_attachments Ec2TransitGateway#auto_accept_shared_attachments}. This parameter is required.
         */
        public Builder autoAcceptSharedAttachments(final java.lang.String autoAcceptSharedAttachments) {
            this.config().autoAcceptSharedAttachments(autoAcceptSharedAttachments);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#default_route_table_association Ec2TransitGateway#default_route_table_association}.
         * <p>
         * @return {@code this}
         * @param defaultRouteTableAssociation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#default_route_table_association Ec2TransitGateway#default_route_table_association}. This parameter is required.
         */
        public Builder defaultRouteTableAssociation(final java.lang.String defaultRouteTableAssociation) {
            this.config().defaultRouteTableAssociation(defaultRouteTableAssociation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#default_route_table_propagation Ec2TransitGateway#default_route_table_propagation}.
         * <p>
         * @return {@code this}
         * @param defaultRouteTablePropagation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#default_route_table_propagation Ec2TransitGateway#default_route_table_propagation}. This parameter is required.
         */
        public Builder defaultRouteTablePropagation(final java.lang.String defaultRouteTablePropagation) {
            this.config().defaultRouteTablePropagation(defaultRouteTablePropagation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#description Ec2TransitGateway#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#description Ec2TransitGateway#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config().description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#dns_support Ec2TransitGateway#dns_support}.
         * <p>
         * @return {@code this}
         * @param dnsSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#dns_support Ec2TransitGateway#dns_support}. This parameter is required.
         */
        public Builder dnsSupport(final java.lang.String dnsSupport) {
            this.config().dnsSupport(dnsSupport);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#id Ec2TransitGateway#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#id Ec2TransitGateway#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#multicast_support Ec2TransitGateway#multicast_support}.
         * <p>
         * @return {@code this}
         * @param multicastSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#multicast_support Ec2TransitGateway#multicast_support}. This parameter is required.
         */
        public Builder multicastSupport(final java.lang.String multicastSupport) {
            this.config().multicastSupport(multicastSupport);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#security_group_referencing_support Ec2TransitGateway#security_group_referencing_support}.
         * <p>
         * @return {@code this}
         * @param securityGroupReferencingSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#security_group_referencing_support Ec2TransitGateway#security_group_referencing_support}. This parameter is required.
         */
        public Builder securityGroupReferencingSupport(final java.lang.String securityGroupReferencingSupport) {
            this.config().securityGroupReferencingSupport(securityGroupReferencingSupport);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#tags Ec2TransitGateway#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#tags Ec2TransitGateway#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#tags_all Ec2TransitGateway#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#tags_all Ec2TransitGateway#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#timeouts Ec2TransitGateway#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.ec2_transit_gateway.Ec2TransitGatewayTimeouts timeouts) {
            this.config().timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#transit_gateway_cidr_blocks Ec2TransitGateway#transit_gateway_cidr_blocks}.
         * <p>
         * @return {@code this}
         * @param transitGatewayCidrBlocks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#transit_gateway_cidr_blocks Ec2TransitGateway#transit_gateway_cidr_blocks}. This parameter is required.
         */
        public Builder transitGatewayCidrBlocks(final java.util.List<java.lang.String> transitGatewayCidrBlocks) {
            this.config().transitGatewayCidrBlocks(transitGatewayCidrBlocks);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#vpn_ecmp_support Ec2TransitGateway#vpn_ecmp_support}.
         * <p>
         * @return {@code this}
         * @param vpnEcmpSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#vpn_ecmp_support Ec2TransitGateway#vpn_ecmp_support}. This parameter is required.
         */
        public Builder vpnEcmpSupport(final java.lang.String vpnEcmpSupport) {
            this.config().vpnEcmpSupport(vpnEcmpSupport);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ec2_transit_gateway.Ec2TransitGateway}.
         */
        @Override
        public imports.aws.ec2_transit_gateway.Ec2TransitGateway build() {
            return new imports.aws.ec2_transit_gateway.Ec2TransitGateway(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.ec2_transit_gateway.Ec2TransitGatewayConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.ec2_transit_gateway.Ec2TransitGatewayConfig.Builder();
            }
            return this.config;
        }
    }
}
