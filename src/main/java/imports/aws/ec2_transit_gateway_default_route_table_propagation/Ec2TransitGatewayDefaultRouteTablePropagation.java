package imports.aws.ec2_transit_gateway_default_route_table_propagation;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_default_route_table_propagation aws_ec2_transit_gateway_default_route_table_propagation}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.109Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TransitGatewayDefaultRouteTablePropagation.Ec2TransitGatewayDefaultRouteTablePropagation")
public class Ec2TransitGatewayDefaultRouteTablePropagation extends com.hashicorp.cdktf.TerraformResource {

    protected Ec2TransitGatewayDefaultRouteTablePropagation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2TransitGatewayDefaultRouteTablePropagation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_default_route_table_propagation aws_ec2_transit_gateway_default_route_table_propagation} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Ec2TransitGatewayDefaultRouteTablePropagation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Ec2TransitGatewayDefaultRouteTablePropagation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2TransitGatewayDefaultRouteTablePropagation to import. This parameter is required.
     * @param importFromId The id of the existing Ec2TransitGatewayDefaultRouteTablePropagation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Ec2TransitGatewayDefaultRouteTablePropagation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Ec2TransitGatewayDefaultRouteTablePropagation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2TransitGatewayDefaultRouteTablePropagation to import. This parameter is required.
     * @param importFromId The id of the existing Ec2TransitGatewayDefaultRouteTablePropagation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagationTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOriginalDefaultRouteTableId() {
        return software.amazon.jsii.Kernel.get(this, "originalDefaultRouteTableId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagationTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagationTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayRouteTableIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayRouteTableIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransitGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayId", java.util.Objects.requireNonNull(value, "transitGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayRouteTableId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayRouteTableId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransitGatewayRouteTableId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayRouteTableId", java.util.Objects.requireNonNull(value, "transitGatewayRouteTableId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagation> {
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
        private final imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_default_route_table_propagation#transit_gateway_id Ec2TransitGatewayDefaultRouteTablePropagation#transit_gateway_id}.
         * <p>
         * @return {@code this}
         * @param transitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_default_route_table_propagation#transit_gateway_id Ec2TransitGatewayDefaultRouteTablePropagation#transit_gateway_id}. This parameter is required.
         */
        public Builder transitGatewayId(final java.lang.String transitGatewayId) {
            this.config.transitGatewayId(transitGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_default_route_table_propagation#transit_gateway_route_table_id Ec2TransitGatewayDefaultRouteTablePropagation#transit_gateway_route_table_id}.
         * <p>
         * @return {@code this}
         * @param transitGatewayRouteTableId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_default_route_table_propagation#transit_gateway_route_table_id Ec2TransitGatewayDefaultRouteTablePropagation#transit_gateway_route_table_id}. This parameter is required.
         */
        public Builder transitGatewayRouteTableId(final java.lang.String transitGatewayRouteTableId) {
            this.config.transitGatewayRouteTableId(transitGatewayRouteTableId);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_default_route_table_propagation#timeouts Ec2TransitGatewayDefaultRouteTablePropagation#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagationTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagation}.
         */
        @Override
        public imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagation build() {
            return new imports.aws.ec2_transit_gateway_default_route_table_propagation.Ec2TransitGatewayDefaultRouteTablePropagation(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
