package imports.aws.data_aws_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.831Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRoute.DataAwsRouteConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsRouteConfig.Jsii$Proxy.class)
public interface DataAwsRouteConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#route_table_id DataAwsRoute#route_table_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRouteTableId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#carrier_gateway_id DataAwsRoute#carrier_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCarrierGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#core_network_arn DataAwsRoute#core_network_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCoreNetworkArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#destination_cidr_block DataAwsRoute#destination_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDestinationCidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#destination_ipv6_cidr_block DataAwsRoute#destination_ipv6_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDestinationIpv6CidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#destination_prefix_list_id DataAwsRoute#destination_prefix_list_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDestinationPrefixListId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#egress_only_gateway_id DataAwsRoute#egress_only_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEgressOnlyGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#gateway_id DataAwsRoute#gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#id DataAwsRoute#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#instance_id DataAwsRoute#instance_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#local_gateway_id DataAwsRoute#local_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocalGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#nat_gateway_id DataAwsRoute#nat_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNatGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#network_interface_id DataAwsRoute#network_interface_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetworkInterfaceId() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#timeouts DataAwsRoute#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.data_aws_route.DataAwsRouteTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#transit_gateway_id DataAwsRoute#transit_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#vpc_peering_connection_id DataAwsRoute#vpc_peering_connection_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcPeeringConnectionId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsRouteConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsRouteConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsRouteConfig> {
        java.lang.String routeTableId;
        java.lang.String carrierGatewayId;
        java.lang.String coreNetworkArn;
        java.lang.String destinationCidrBlock;
        java.lang.String destinationIpv6CidrBlock;
        java.lang.String destinationPrefixListId;
        java.lang.String egressOnlyGatewayId;
        java.lang.String gatewayId;
        java.lang.String id;
        java.lang.String instanceId;
        java.lang.String localGatewayId;
        java.lang.String natGatewayId;
        java.lang.String networkInterfaceId;
        imports.aws.data_aws_route.DataAwsRouteTimeouts timeouts;
        java.lang.String transitGatewayId;
        java.lang.String vpcPeeringConnectionId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsRouteConfig#getRouteTableId}
         * @param routeTableId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#route_table_id DataAwsRoute#route_table_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder routeTableId(java.lang.String routeTableId) {
            this.routeTableId = routeTableId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getCarrierGatewayId}
         * @param carrierGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#carrier_gateway_id DataAwsRoute#carrier_gateway_id}.
         * @return {@code this}
         */
        public Builder carrierGatewayId(java.lang.String carrierGatewayId) {
            this.carrierGatewayId = carrierGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getCoreNetworkArn}
         * @param coreNetworkArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#core_network_arn DataAwsRoute#core_network_arn}.
         * @return {@code this}
         */
        public Builder coreNetworkArn(java.lang.String coreNetworkArn) {
            this.coreNetworkArn = coreNetworkArn;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getDestinationCidrBlock}
         * @param destinationCidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#destination_cidr_block DataAwsRoute#destination_cidr_block}.
         * @return {@code this}
         */
        public Builder destinationCidrBlock(java.lang.String destinationCidrBlock) {
            this.destinationCidrBlock = destinationCidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getDestinationIpv6CidrBlock}
         * @param destinationIpv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#destination_ipv6_cidr_block DataAwsRoute#destination_ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder destinationIpv6CidrBlock(java.lang.String destinationIpv6CidrBlock) {
            this.destinationIpv6CidrBlock = destinationIpv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getDestinationPrefixListId}
         * @param destinationPrefixListId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#destination_prefix_list_id DataAwsRoute#destination_prefix_list_id}.
         * @return {@code this}
         */
        public Builder destinationPrefixListId(java.lang.String destinationPrefixListId) {
            this.destinationPrefixListId = destinationPrefixListId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getEgressOnlyGatewayId}
         * @param egressOnlyGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#egress_only_gateway_id DataAwsRoute#egress_only_gateway_id}.
         * @return {@code this}
         */
        public Builder egressOnlyGatewayId(java.lang.String egressOnlyGatewayId) {
            this.egressOnlyGatewayId = egressOnlyGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getGatewayId}
         * @param gatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#gateway_id DataAwsRoute#gateway_id}.
         * @return {@code this}
         */
        public Builder gatewayId(java.lang.String gatewayId) {
            this.gatewayId = gatewayId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#id DataAwsRoute#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getInstanceId}
         * @param instanceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#instance_id DataAwsRoute#instance_id}.
         * @return {@code this}
         */
        public Builder instanceId(java.lang.String instanceId) {
            this.instanceId = instanceId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getLocalGatewayId}
         * @param localGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#local_gateway_id DataAwsRoute#local_gateway_id}.
         * @return {@code this}
         */
        public Builder localGatewayId(java.lang.String localGatewayId) {
            this.localGatewayId = localGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getNatGatewayId}
         * @param natGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#nat_gateway_id DataAwsRoute#nat_gateway_id}.
         * @return {@code this}
         */
        public Builder natGatewayId(java.lang.String natGatewayId) {
            this.natGatewayId = natGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getNetworkInterfaceId}
         * @param networkInterfaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#network_interface_id DataAwsRoute#network_interface_id}.
         * @return {@code this}
         */
        public Builder networkInterfaceId(java.lang.String networkInterfaceId) {
            this.networkInterfaceId = networkInterfaceId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#timeouts DataAwsRoute#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.data_aws_route.DataAwsRouteTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getTransitGatewayId}
         * @param transitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#transit_gateway_id DataAwsRoute#transit_gateway_id}.
         * @return {@code this}
         */
        public Builder transitGatewayId(java.lang.String transitGatewayId) {
            this.transitGatewayId = transitGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getVpcPeeringConnectionId}
         * @param vpcPeeringConnectionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/route#vpc_peering_connection_id DataAwsRoute#vpc_peering_connection_id}.
         * @return {@code this}
         */
        public Builder vpcPeeringConnectionId(java.lang.String vpcPeeringConnectionId) {
            this.vpcPeeringConnectionId = vpcPeeringConnectionId;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getDependsOn}
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
         * Sets the value of {@link DataAwsRouteConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRouteConfig#getProvisioners}
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
         * @return a new instance of {@link DataAwsRouteConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsRouteConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsRouteConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsRouteConfig {
        private final java.lang.String routeTableId;
        private final java.lang.String carrierGatewayId;
        private final java.lang.String coreNetworkArn;
        private final java.lang.String destinationCidrBlock;
        private final java.lang.String destinationIpv6CidrBlock;
        private final java.lang.String destinationPrefixListId;
        private final java.lang.String egressOnlyGatewayId;
        private final java.lang.String gatewayId;
        private final java.lang.String id;
        private final java.lang.String instanceId;
        private final java.lang.String localGatewayId;
        private final java.lang.String natGatewayId;
        private final java.lang.String networkInterfaceId;
        private final imports.aws.data_aws_route.DataAwsRouteTimeouts timeouts;
        private final java.lang.String transitGatewayId;
        private final java.lang.String vpcPeeringConnectionId;
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
            this.routeTableId = software.amazon.jsii.Kernel.get(this, "routeTableId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.carrierGatewayId = software.amazon.jsii.Kernel.get(this, "carrierGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.coreNetworkArn = software.amazon.jsii.Kernel.get(this, "coreNetworkArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationCidrBlock = software.amazon.jsii.Kernel.get(this, "destinationCidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationIpv6CidrBlock = software.amazon.jsii.Kernel.get(this, "destinationIpv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationPrefixListId = software.amazon.jsii.Kernel.get(this, "destinationPrefixListId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.egressOnlyGatewayId = software.amazon.jsii.Kernel.get(this, "egressOnlyGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.gatewayId = software.amazon.jsii.Kernel.get(this, "gatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceId = software.amazon.jsii.Kernel.get(this, "instanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localGatewayId = software.amazon.jsii.Kernel.get(this, "localGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.natGatewayId = software.amazon.jsii.Kernel.get(this, "natGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkInterfaceId = software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_route.DataAwsRouteTimeouts.class));
            this.transitGatewayId = software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcPeeringConnectionId = software.amazon.jsii.Kernel.get(this, "vpcPeeringConnectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.routeTableId = java.util.Objects.requireNonNull(builder.routeTableId, "routeTableId is required");
            this.carrierGatewayId = builder.carrierGatewayId;
            this.coreNetworkArn = builder.coreNetworkArn;
            this.destinationCidrBlock = builder.destinationCidrBlock;
            this.destinationIpv6CidrBlock = builder.destinationIpv6CidrBlock;
            this.destinationPrefixListId = builder.destinationPrefixListId;
            this.egressOnlyGatewayId = builder.egressOnlyGatewayId;
            this.gatewayId = builder.gatewayId;
            this.id = builder.id;
            this.instanceId = builder.instanceId;
            this.localGatewayId = builder.localGatewayId;
            this.natGatewayId = builder.natGatewayId;
            this.networkInterfaceId = builder.networkInterfaceId;
            this.timeouts = builder.timeouts;
            this.transitGatewayId = builder.transitGatewayId;
            this.vpcPeeringConnectionId = builder.vpcPeeringConnectionId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getRouteTableId() {
            return this.routeTableId;
        }

        @Override
        public final java.lang.String getCarrierGatewayId() {
            return this.carrierGatewayId;
        }

        @Override
        public final java.lang.String getCoreNetworkArn() {
            return this.coreNetworkArn;
        }

        @Override
        public final java.lang.String getDestinationCidrBlock() {
            return this.destinationCidrBlock;
        }

        @Override
        public final java.lang.String getDestinationIpv6CidrBlock() {
            return this.destinationIpv6CidrBlock;
        }

        @Override
        public final java.lang.String getDestinationPrefixListId() {
            return this.destinationPrefixListId;
        }

        @Override
        public final java.lang.String getEgressOnlyGatewayId() {
            return this.egressOnlyGatewayId;
        }

        @Override
        public final java.lang.String getGatewayId() {
            return this.gatewayId;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInstanceId() {
            return this.instanceId;
        }

        @Override
        public final java.lang.String getLocalGatewayId() {
            return this.localGatewayId;
        }

        @Override
        public final java.lang.String getNatGatewayId() {
            return this.natGatewayId;
        }

        @Override
        public final java.lang.String getNetworkInterfaceId() {
            return this.networkInterfaceId;
        }

        @Override
        public final imports.aws.data_aws_route.DataAwsRouteTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getTransitGatewayId() {
            return this.transitGatewayId;
        }

        @Override
        public final java.lang.String getVpcPeeringConnectionId() {
            return this.vpcPeeringConnectionId;
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

            data.set("routeTableId", om.valueToTree(this.getRouteTableId()));
            if (this.getCarrierGatewayId() != null) {
                data.set("carrierGatewayId", om.valueToTree(this.getCarrierGatewayId()));
            }
            if (this.getCoreNetworkArn() != null) {
                data.set("coreNetworkArn", om.valueToTree(this.getCoreNetworkArn()));
            }
            if (this.getDestinationCidrBlock() != null) {
                data.set("destinationCidrBlock", om.valueToTree(this.getDestinationCidrBlock()));
            }
            if (this.getDestinationIpv6CidrBlock() != null) {
                data.set("destinationIpv6CidrBlock", om.valueToTree(this.getDestinationIpv6CidrBlock()));
            }
            if (this.getDestinationPrefixListId() != null) {
                data.set("destinationPrefixListId", om.valueToTree(this.getDestinationPrefixListId()));
            }
            if (this.getEgressOnlyGatewayId() != null) {
                data.set("egressOnlyGatewayId", om.valueToTree(this.getEgressOnlyGatewayId()));
            }
            if (this.getGatewayId() != null) {
                data.set("gatewayId", om.valueToTree(this.getGatewayId()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceId() != null) {
                data.set("instanceId", om.valueToTree(this.getInstanceId()));
            }
            if (this.getLocalGatewayId() != null) {
                data.set("localGatewayId", om.valueToTree(this.getLocalGatewayId()));
            }
            if (this.getNatGatewayId() != null) {
                data.set("natGatewayId", om.valueToTree(this.getNatGatewayId()));
            }
            if (this.getNetworkInterfaceId() != null) {
                data.set("networkInterfaceId", om.valueToTree(this.getNetworkInterfaceId()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTransitGatewayId() != null) {
                data.set("transitGatewayId", om.valueToTree(this.getTransitGatewayId()));
            }
            if (this.getVpcPeeringConnectionId() != null) {
                data.set("vpcPeeringConnectionId", om.valueToTree(this.getVpcPeeringConnectionId()));
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
            struct.set("fqn", om.valueToTree("aws.dataAwsRoute.DataAwsRouteConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsRouteConfig.Jsii$Proxy that = (DataAwsRouteConfig.Jsii$Proxy) o;

            if (!routeTableId.equals(that.routeTableId)) return false;
            if (this.carrierGatewayId != null ? !this.carrierGatewayId.equals(that.carrierGatewayId) : that.carrierGatewayId != null) return false;
            if (this.coreNetworkArn != null ? !this.coreNetworkArn.equals(that.coreNetworkArn) : that.coreNetworkArn != null) return false;
            if (this.destinationCidrBlock != null ? !this.destinationCidrBlock.equals(that.destinationCidrBlock) : that.destinationCidrBlock != null) return false;
            if (this.destinationIpv6CidrBlock != null ? !this.destinationIpv6CidrBlock.equals(that.destinationIpv6CidrBlock) : that.destinationIpv6CidrBlock != null) return false;
            if (this.destinationPrefixListId != null ? !this.destinationPrefixListId.equals(that.destinationPrefixListId) : that.destinationPrefixListId != null) return false;
            if (this.egressOnlyGatewayId != null ? !this.egressOnlyGatewayId.equals(that.egressOnlyGatewayId) : that.egressOnlyGatewayId != null) return false;
            if (this.gatewayId != null ? !this.gatewayId.equals(that.gatewayId) : that.gatewayId != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceId != null ? !this.instanceId.equals(that.instanceId) : that.instanceId != null) return false;
            if (this.localGatewayId != null ? !this.localGatewayId.equals(that.localGatewayId) : that.localGatewayId != null) return false;
            if (this.natGatewayId != null ? !this.natGatewayId.equals(that.natGatewayId) : that.natGatewayId != null) return false;
            if (this.networkInterfaceId != null ? !this.networkInterfaceId.equals(that.networkInterfaceId) : that.networkInterfaceId != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.transitGatewayId != null ? !this.transitGatewayId.equals(that.transitGatewayId) : that.transitGatewayId != null) return false;
            if (this.vpcPeeringConnectionId != null ? !this.vpcPeeringConnectionId.equals(that.vpcPeeringConnectionId) : that.vpcPeeringConnectionId != null) return false;
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
            int result = this.routeTableId.hashCode();
            result = 31 * result + (this.carrierGatewayId != null ? this.carrierGatewayId.hashCode() : 0);
            result = 31 * result + (this.coreNetworkArn != null ? this.coreNetworkArn.hashCode() : 0);
            result = 31 * result + (this.destinationCidrBlock != null ? this.destinationCidrBlock.hashCode() : 0);
            result = 31 * result + (this.destinationIpv6CidrBlock != null ? this.destinationIpv6CidrBlock.hashCode() : 0);
            result = 31 * result + (this.destinationPrefixListId != null ? this.destinationPrefixListId.hashCode() : 0);
            result = 31 * result + (this.egressOnlyGatewayId != null ? this.egressOnlyGatewayId.hashCode() : 0);
            result = 31 * result + (this.gatewayId != null ? this.gatewayId.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceId != null ? this.instanceId.hashCode() : 0);
            result = 31 * result + (this.localGatewayId != null ? this.localGatewayId.hashCode() : 0);
            result = 31 * result + (this.natGatewayId != null ? this.natGatewayId.hashCode() : 0);
            result = 31 * result + (this.networkInterfaceId != null ? this.networkInterfaceId.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.transitGatewayId != null ? this.transitGatewayId.hashCode() : 0);
            result = 31 * result + (this.vpcPeeringConnectionId != null ? this.vpcPeeringConnectionId.hashCode() : 0);
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
