package imports.aws.ec2_transit_gateway_connect;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect aws_ec2_transit_gateway_connect}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.105Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TransitGatewayConnect.Ec2TransitGatewayConnect")
public class Ec2TransitGatewayConnect extends com.hashicorp.cdktf.TerraformResource {

    protected Ec2TransitGatewayConnect(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2TransitGatewayConnect(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnect.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect aws_ec2_transit_gateway_connect} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Ec2TransitGatewayConnect(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnectConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Ec2TransitGatewayConnect resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2TransitGatewayConnect to import. This parameter is required.
     * @param importFromId The id of the existing Ec2TransitGatewayConnect that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Ec2TransitGatewayConnect to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnect.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Ec2TransitGatewayConnect resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2TransitGatewayConnect to import. This parameter is required.
     * @param importFromId The id of the existing Ec2TransitGatewayConnect that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnect.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnectTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetProtocol", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnectTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnectTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getTransitGatewayDefaultRouteTableAssociationInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayDefaultRouteTableAssociationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTransitGatewayDefaultRouteTablePropagationInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayDefaultRouteTablePropagationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransportAttachmentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transportAttachmentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProtocol() {
        return software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "protocol", java.util.Objects.requireNonNull(value, "protocol is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransitGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayId", java.util.Objects.requireNonNull(value, "transitGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransportAttachmentId() {
        return software.amazon.jsii.Kernel.get(this, "transportAttachmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransportAttachmentId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transportAttachmentId", java.util.Objects.requireNonNull(value, "transportAttachmentId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnect}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnect> {
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
        private final imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnectConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnectConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#transit_gateway_id Ec2TransitGatewayConnect#transit_gateway_id}.
         * <p>
         * @return {@code this}
         * @param transitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#transit_gateway_id Ec2TransitGatewayConnect#transit_gateway_id}. This parameter is required.
         */
        public Builder transitGatewayId(final java.lang.String transitGatewayId) {
            this.config.transitGatewayId(transitGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#transport_attachment_id Ec2TransitGatewayConnect#transport_attachment_id}.
         * <p>
         * @return {@code this}
         * @param transportAttachmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#transport_attachment_id Ec2TransitGatewayConnect#transport_attachment_id}. This parameter is required.
         */
        public Builder transportAttachmentId(final java.lang.String transportAttachmentId) {
            this.config.transportAttachmentId(transportAttachmentId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#id Ec2TransitGatewayConnect#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#id Ec2TransitGatewayConnect#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#protocol Ec2TransitGatewayConnect#protocol}.
         * <p>
         * @return {@code this}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#protocol Ec2TransitGatewayConnect#protocol}. This parameter is required.
         */
        public Builder protocol(final java.lang.String protocol) {
            this.config.protocol(protocol);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#tags Ec2TransitGatewayConnect#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#tags Ec2TransitGatewayConnect#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#tags_all Ec2TransitGatewayConnect#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#tags_all Ec2TransitGatewayConnect#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#timeouts Ec2TransitGatewayConnect#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnectTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#transit_gateway_default_route_table_association Ec2TransitGatewayConnect#transit_gateway_default_route_table_association}.
         * <p>
         * @return {@code this}
         * @param transitGatewayDefaultRouteTableAssociation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#transit_gateway_default_route_table_association Ec2TransitGatewayConnect#transit_gateway_default_route_table_association}. This parameter is required.
         */
        public Builder transitGatewayDefaultRouteTableAssociation(final java.lang.Boolean transitGatewayDefaultRouteTableAssociation) {
            this.config.transitGatewayDefaultRouteTableAssociation(transitGatewayDefaultRouteTableAssociation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#transit_gateway_default_route_table_association Ec2TransitGatewayConnect#transit_gateway_default_route_table_association}.
         * <p>
         * @return {@code this}
         * @param transitGatewayDefaultRouteTableAssociation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#transit_gateway_default_route_table_association Ec2TransitGatewayConnect#transit_gateway_default_route_table_association}. This parameter is required.
         */
        public Builder transitGatewayDefaultRouteTableAssociation(final com.hashicorp.cdktf.IResolvable transitGatewayDefaultRouteTableAssociation) {
            this.config.transitGatewayDefaultRouteTableAssociation(transitGatewayDefaultRouteTableAssociation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#transit_gateway_default_route_table_propagation Ec2TransitGatewayConnect#transit_gateway_default_route_table_propagation}.
         * <p>
         * @return {@code this}
         * @param transitGatewayDefaultRouteTablePropagation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#transit_gateway_default_route_table_propagation Ec2TransitGatewayConnect#transit_gateway_default_route_table_propagation}. This parameter is required.
         */
        public Builder transitGatewayDefaultRouteTablePropagation(final java.lang.Boolean transitGatewayDefaultRouteTablePropagation) {
            this.config.transitGatewayDefaultRouteTablePropagation(transitGatewayDefaultRouteTablePropagation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#transit_gateway_default_route_table_propagation Ec2TransitGatewayConnect#transit_gateway_default_route_table_propagation}.
         * <p>
         * @return {@code this}
         * @param transitGatewayDefaultRouteTablePropagation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_connect#transit_gateway_default_route_table_propagation Ec2TransitGatewayConnect#transit_gateway_default_route_table_propagation}. This parameter is required.
         */
        public Builder transitGatewayDefaultRouteTablePropagation(final com.hashicorp.cdktf.IResolvable transitGatewayDefaultRouteTablePropagation) {
            this.config.transitGatewayDefaultRouteTablePropagation(transitGatewayDefaultRouteTablePropagation);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnect}.
         */
        @Override
        public imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnect build() {
            return new imports.aws.ec2_transit_gateway_connect.Ec2TransitGatewayConnect(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
