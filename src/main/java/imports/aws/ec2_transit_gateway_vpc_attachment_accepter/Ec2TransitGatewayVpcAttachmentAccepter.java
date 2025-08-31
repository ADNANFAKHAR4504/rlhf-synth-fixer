package imports.aws.ec2_transit_gateway_vpc_attachment_accepter;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter aws_ec2_transit_gateway_vpc_attachment_accepter}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.117Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TransitGatewayVpcAttachmentAccepter.Ec2TransitGatewayVpcAttachmentAccepter")
public class Ec2TransitGatewayVpcAttachmentAccepter extends com.hashicorp.cdktf.TerraformResource {

    protected Ec2TransitGatewayVpcAttachmentAccepter(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2TransitGatewayVpcAttachmentAccepter(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ec2_transit_gateway_vpc_attachment_accepter.Ec2TransitGatewayVpcAttachmentAccepter.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter aws_ec2_transit_gateway_vpc_attachment_accepter} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Ec2TransitGatewayVpcAttachmentAccepter(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ec2_transit_gateway_vpc_attachment_accepter.Ec2TransitGatewayVpcAttachmentAccepterConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Ec2TransitGatewayVpcAttachmentAccepter resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2TransitGatewayVpcAttachmentAccepter to import. This parameter is required.
     * @param importFromId The id of the existing Ec2TransitGatewayVpcAttachmentAccepter that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Ec2TransitGatewayVpcAttachmentAccepter to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_transit_gateway_vpc_attachment_accepter.Ec2TransitGatewayVpcAttachmentAccepter.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Ec2TransitGatewayVpcAttachmentAccepter resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2TransitGatewayVpcAttachmentAccepter to import. This parameter is required.
     * @param importFromId The id of the existing Ec2TransitGatewayVpcAttachmentAccepter that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_transit_gateway_vpc_attachment_accepter.Ec2TransitGatewayVpcAttachmentAccepter.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransitGatewayDefaultRouteTableAssociation() {
        software.amazon.jsii.Kernel.call(this, "resetTransitGatewayDefaultRouteTableAssociation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransitGatewayDefaultRouteTablePropagation() {
        software.amazon.jsii.Kernel.call(this, "resetTransitGatewayDefaultRouteTablePropagation", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getApplianceModeSupport() {
        return software.amazon.jsii.Kernel.get(this, "applianceModeSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsSupport() {
        return software.amazon.jsii.Kernel.get(this, "dnsSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpv6Support() {
        return software.amazon.jsii.Kernel.get(this, "ipv6Support", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSecurityGroupReferencingSupport() {
        return software.amazon.jsii.Kernel.get(this, "securityGroupReferencingSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcId() {
        return software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcOwnerId() {
        return software.amazon.jsii.Kernel.get(this, "vpcOwnerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayAttachmentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayAttachmentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTransitGatewayDefaultRouteTableAssociationInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayDefaultRouteTableAssociationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTransitGatewayDefaultRouteTablePropagationInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayDefaultRouteTablePropagationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayAttachmentId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayAttachmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransitGatewayAttachmentId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayAttachmentId", java.util.Objects.requireNonNull(value, "transitGatewayAttachmentId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTransitGatewayDefaultRouteTableAssociation() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayDefaultRouteTableAssociation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTransitGatewayDefaultRouteTableAssociation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayDefaultRouteTableAssociation", java.util.Objects.requireNonNull(value, "transitGatewayDefaultRouteTableAssociation is required"));
    }

    public void setTransitGatewayDefaultRouteTableAssociation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayDefaultRouteTableAssociation", java.util.Objects.requireNonNull(value, "transitGatewayDefaultRouteTableAssociation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTransitGatewayDefaultRouteTablePropagation() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayDefaultRouteTablePropagation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTransitGatewayDefaultRouteTablePropagation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayDefaultRouteTablePropagation", java.util.Objects.requireNonNull(value, "transitGatewayDefaultRouteTablePropagation is required"));
    }

    public void setTransitGatewayDefaultRouteTablePropagation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayDefaultRouteTablePropagation", java.util.Objects.requireNonNull(value, "transitGatewayDefaultRouteTablePropagation is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ec2_transit_gateway_vpc_attachment_accepter.Ec2TransitGatewayVpcAttachmentAccepter}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ec2_transit_gateway_vpc_attachment_accepter.Ec2TransitGatewayVpcAttachmentAccepter> {
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
        private final imports.aws.ec2_transit_gateway_vpc_attachment_accepter.Ec2TransitGatewayVpcAttachmentAccepterConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ec2_transit_gateway_vpc_attachment_accepter.Ec2TransitGatewayVpcAttachmentAccepterConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#transit_gateway_attachment_id Ec2TransitGatewayVpcAttachmentAccepter#transit_gateway_attachment_id}.
         * <p>
         * @return {@code this}
         * @param transitGatewayAttachmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#transit_gateway_attachment_id Ec2TransitGatewayVpcAttachmentAccepter#transit_gateway_attachment_id}. This parameter is required.
         */
        public Builder transitGatewayAttachmentId(final java.lang.String transitGatewayAttachmentId) {
            this.config.transitGatewayAttachmentId(transitGatewayAttachmentId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#id Ec2TransitGatewayVpcAttachmentAccepter#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#id Ec2TransitGatewayVpcAttachmentAccepter#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#tags Ec2TransitGatewayVpcAttachmentAccepter#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#tags Ec2TransitGatewayVpcAttachmentAccepter#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#tags_all Ec2TransitGatewayVpcAttachmentAccepter#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#tags_all Ec2TransitGatewayVpcAttachmentAccepter#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#transit_gateway_default_route_table_association Ec2TransitGatewayVpcAttachmentAccepter#transit_gateway_default_route_table_association}.
         * <p>
         * @return {@code this}
         * @param transitGatewayDefaultRouteTableAssociation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#transit_gateway_default_route_table_association Ec2TransitGatewayVpcAttachmentAccepter#transit_gateway_default_route_table_association}. This parameter is required.
         */
        public Builder transitGatewayDefaultRouteTableAssociation(final java.lang.Boolean transitGatewayDefaultRouteTableAssociation) {
            this.config.transitGatewayDefaultRouteTableAssociation(transitGatewayDefaultRouteTableAssociation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#transit_gateway_default_route_table_association Ec2TransitGatewayVpcAttachmentAccepter#transit_gateway_default_route_table_association}.
         * <p>
         * @return {@code this}
         * @param transitGatewayDefaultRouteTableAssociation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#transit_gateway_default_route_table_association Ec2TransitGatewayVpcAttachmentAccepter#transit_gateway_default_route_table_association}. This parameter is required.
         */
        public Builder transitGatewayDefaultRouteTableAssociation(final com.hashicorp.cdktf.IResolvable transitGatewayDefaultRouteTableAssociation) {
            this.config.transitGatewayDefaultRouteTableAssociation(transitGatewayDefaultRouteTableAssociation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#transit_gateway_default_route_table_propagation Ec2TransitGatewayVpcAttachmentAccepter#transit_gateway_default_route_table_propagation}.
         * <p>
         * @return {@code this}
         * @param transitGatewayDefaultRouteTablePropagation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#transit_gateway_default_route_table_propagation Ec2TransitGatewayVpcAttachmentAccepter#transit_gateway_default_route_table_propagation}. This parameter is required.
         */
        public Builder transitGatewayDefaultRouteTablePropagation(final java.lang.Boolean transitGatewayDefaultRouteTablePropagation) {
            this.config.transitGatewayDefaultRouteTablePropagation(transitGatewayDefaultRouteTablePropagation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#transit_gateway_default_route_table_propagation Ec2TransitGatewayVpcAttachmentAccepter#transit_gateway_default_route_table_propagation}.
         * <p>
         * @return {@code this}
         * @param transitGatewayDefaultRouteTablePropagation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment_accepter#transit_gateway_default_route_table_propagation Ec2TransitGatewayVpcAttachmentAccepter#transit_gateway_default_route_table_propagation}. This parameter is required.
         */
        public Builder transitGatewayDefaultRouteTablePropagation(final com.hashicorp.cdktf.IResolvable transitGatewayDefaultRouteTablePropagation) {
            this.config.transitGatewayDefaultRouteTablePropagation(transitGatewayDefaultRouteTablePropagation);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ec2_transit_gateway_vpc_attachment_accepter.Ec2TransitGatewayVpcAttachmentAccepter}.
         */
        @Override
        public imports.aws.ec2_transit_gateway_vpc_attachment_accepter.Ec2TransitGatewayVpcAttachmentAccepter build() {
            return new imports.aws.ec2_transit_gateway_vpc_attachment_accepter.Ec2TransitGatewayVpcAttachmentAccepter(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
