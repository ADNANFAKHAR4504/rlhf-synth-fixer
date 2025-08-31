package imports.aws.data_aws_route;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route aws_route}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.830Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute.DataAwsRoute")
public class DataAwsRoute extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsRoute(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsRoute(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_route.DataAwsRoute.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route aws_route} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsRoute(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_route.DataAwsRouteConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsRoute resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsRoute to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsRoute that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsRoute to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_route.DataAwsRoute.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsRoute resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsRoute to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsRoute that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_route.DataAwsRoute.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_route.DataAwsRouteTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCarrierGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetCarrierGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCoreNetworkArn() {
        software.amazon.jsii.Kernel.call(this, "resetCoreNetworkArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDestinationCidrBlock() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationCidrBlock", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDestinationIpv6CidrBlock() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationIpv6CidrBlock", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDestinationPrefixListId() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationPrefixListId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEgressOnlyGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetEgressOnlyGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceId() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocalGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetLocalGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNatGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetNatGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkInterfaceId() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkInterfaceId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransitGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetTransitGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcPeeringConnectionId() {
        software.amazon.jsii.Kernel.call(this, "resetVpcPeeringConnectionId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_route.DataAwsRouteTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_route.DataAwsRouteTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCarrierGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "carrierGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCoreNetworkArnInput() {
        return software.amazon.jsii.Kernel.get(this, "coreNetworkArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationCidrBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationCidrBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationIpv6CidrBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationIpv6CidrBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationPrefixListIdInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationPrefixListIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEgressOnlyGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "egressOnlyGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "gatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocalGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "localGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNatGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "natGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNetworkInterfaceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRouteTableIdInput() {
        return software.amazon.jsii.Kernel.get(this, "routeTableIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcPeeringConnectionIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcPeeringConnectionIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCarrierGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "carrierGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCarrierGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "carrierGatewayId", java.util.Objects.requireNonNull(value, "carrierGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCoreNetworkArn() {
        return software.amazon.jsii.Kernel.get(this, "coreNetworkArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCoreNetworkArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "coreNetworkArn", java.util.Objects.requireNonNull(value, "coreNetworkArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationCidrBlock() {
        return software.amazon.jsii.Kernel.get(this, "destinationCidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationCidrBlock(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationCidrBlock", java.util.Objects.requireNonNull(value, "destinationCidrBlock is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationIpv6CidrBlock() {
        return software.amazon.jsii.Kernel.get(this, "destinationIpv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationIpv6CidrBlock(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationIpv6CidrBlock", java.util.Objects.requireNonNull(value, "destinationIpv6CidrBlock is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationPrefixListId() {
        return software.amazon.jsii.Kernel.get(this, "destinationPrefixListId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationPrefixListId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationPrefixListId", java.util.Objects.requireNonNull(value, "destinationPrefixListId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEgressOnlyGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "egressOnlyGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEgressOnlyGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "egressOnlyGatewayId", java.util.Objects.requireNonNull(value, "egressOnlyGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "gatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gatewayId", java.util.Objects.requireNonNull(value, "gatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceId() {
        return software.amazon.jsii.Kernel.get(this, "instanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceId", java.util.Objects.requireNonNull(value, "instanceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocalGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "localGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocalGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "localGatewayId", java.util.Objects.requireNonNull(value, "localGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNatGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "natGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNatGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "natGatewayId", java.util.Objects.requireNonNull(value, "natGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkInterfaceId() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNetworkInterfaceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "networkInterfaceId", java.util.Objects.requireNonNull(value, "networkInterfaceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRouteTableId() {
        return software.amazon.jsii.Kernel.get(this, "routeTableId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRouteTableId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "routeTableId", java.util.Objects.requireNonNull(value, "routeTableId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransitGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayId", java.util.Objects.requireNonNull(value, "transitGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcPeeringConnectionId() {
        return software.amazon.jsii.Kernel.get(this, "vpcPeeringConnectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcPeeringConnectionId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcPeeringConnectionId", java.util.Objects.requireNonNull(value, "vpcPeeringConnectionId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_route.DataAwsRoute}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_route.DataAwsRoute> {
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
        private final imports.aws.data_aws_route.DataAwsRouteConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_route.DataAwsRouteConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#route_table_id DataAwsRoute#route_table_id}.
         * <p>
         * @return {@code this}
         * @param routeTableId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#route_table_id DataAwsRoute#route_table_id}. This parameter is required.
         */
        public Builder routeTableId(final java.lang.String routeTableId) {
            this.config.routeTableId(routeTableId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#carrier_gateway_id DataAwsRoute#carrier_gateway_id}.
         * <p>
         * @return {@code this}
         * @param carrierGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#carrier_gateway_id DataAwsRoute#carrier_gateway_id}. This parameter is required.
         */
        public Builder carrierGatewayId(final java.lang.String carrierGatewayId) {
            this.config.carrierGatewayId(carrierGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#core_network_arn DataAwsRoute#core_network_arn}.
         * <p>
         * @return {@code this}
         * @param coreNetworkArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#core_network_arn DataAwsRoute#core_network_arn}. This parameter is required.
         */
        public Builder coreNetworkArn(final java.lang.String coreNetworkArn) {
            this.config.coreNetworkArn(coreNetworkArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#destination_cidr_block DataAwsRoute#destination_cidr_block}.
         * <p>
         * @return {@code this}
         * @param destinationCidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#destination_cidr_block DataAwsRoute#destination_cidr_block}. This parameter is required.
         */
        public Builder destinationCidrBlock(final java.lang.String destinationCidrBlock) {
            this.config.destinationCidrBlock(destinationCidrBlock);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#destination_ipv6_cidr_block DataAwsRoute#destination_ipv6_cidr_block}.
         * <p>
         * @return {@code this}
         * @param destinationIpv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#destination_ipv6_cidr_block DataAwsRoute#destination_ipv6_cidr_block}. This parameter is required.
         */
        public Builder destinationIpv6CidrBlock(final java.lang.String destinationIpv6CidrBlock) {
            this.config.destinationIpv6CidrBlock(destinationIpv6CidrBlock);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#destination_prefix_list_id DataAwsRoute#destination_prefix_list_id}.
         * <p>
         * @return {@code this}
         * @param destinationPrefixListId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#destination_prefix_list_id DataAwsRoute#destination_prefix_list_id}. This parameter is required.
         */
        public Builder destinationPrefixListId(final java.lang.String destinationPrefixListId) {
            this.config.destinationPrefixListId(destinationPrefixListId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#egress_only_gateway_id DataAwsRoute#egress_only_gateway_id}.
         * <p>
         * @return {@code this}
         * @param egressOnlyGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#egress_only_gateway_id DataAwsRoute#egress_only_gateway_id}. This parameter is required.
         */
        public Builder egressOnlyGatewayId(final java.lang.String egressOnlyGatewayId) {
            this.config.egressOnlyGatewayId(egressOnlyGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#gateway_id DataAwsRoute#gateway_id}.
         * <p>
         * @return {@code this}
         * @param gatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#gateway_id DataAwsRoute#gateway_id}. This parameter is required.
         */
        public Builder gatewayId(final java.lang.String gatewayId) {
            this.config.gatewayId(gatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#id DataAwsRoute#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#id DataAwsRoute#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#instance_id DataAwsRoute#instance_id}.
         * <p>
         * @return {@code this}
         * @param instanceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#instance_id DataAwsRoute#instance_id}. This parameter is required.
         */
        public Builder instanceId(final java.lang.String instanceId) {
            this.config.instanceId(instanceId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#local_gateway_id DataAwsRoute#local_gateway_id}.
         * <p>
         * @return {@code this}
         * @param localGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#local_gateway_id DataAwsRoute#local_gateway_id}. This parameter is required.
         */
        public Builder localGatewayId(final java.lang.String localGatewayId) {
            this.config.localGatewayId(localGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#nat_gateway_id DataAwsRoute#nat_gateway_id}.
         * <p>
         * @return {@code this}
         * @param natGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#nat_gateway_id DataAwsRoute#nat_gateway_id}. This parameter is required.
         */
        public Builder natGatewayId(final java.lang.String natGatewayId) {
            this.config.natGatewayId(natGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#network_interface_id DataAwsRoute#network_interface_id}.
         * <p>
         * @return {@code this}
         * @param networkInterfaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#network_interface_id DataAwsRoute#network_interface_id}. This parameter is required.
         */
        public Builder networkInterfaceId(final java.lang.String networkInterfaceId) {
            this.config.networkInterfaceId(networkInterfaceId);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#timeouts DataAwsRoute#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.data_aws_route.DataAwsRouteTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#transit_gateway_id DataAwsRoute#transit_gateway_id}.
         * <p>
         * @return {@code this}
         * @param transitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#transit_gateway_id DataAwsRoute#transit_gateway_id}. This parameter is required.
         */
        public Builder transitGatewayId(final java.lang.String transitGatewayId) {
            this.config.transitGatewayId(transitGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#vpc_peering_connection_id DataAwsRoute#vpc_peering_connection_id}.
         * <p>
         * @return {@code this}
         * @param vpcPeeringConnectionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#vpc_peering_connection_id DataAwsRoute#vpc_peering_connection_id}. This parameter is required.
         */
        public Builder vpcPeeringConnectionId(final java.lang.String vpcPeeringConnectionId) {
            this.config.vpcPeeringConnectionId(vpcPeeringConnectionId);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_route.DataAwsRoute}.
         */
        @Override
        public imports.aws.data_aws_route.DataAwsRoute build() {
            return new imports.aws.data_aws_route.DataAwsRoute(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
