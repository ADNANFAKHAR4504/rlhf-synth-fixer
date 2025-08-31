package imports.aws.route_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.237Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.routeTable.RouteTableRoute")
@software.amazon.jsii.Jsii.Proxy(RouteTableRoute.Jsii$Proxy.class)
public interface RouteTableRoute extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#carrier_gateway_id RouteTable#carrier_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCarrierGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#cidr_block RouteTable#cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#core_network_arn RouteTable#core_network_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCoreNetworkArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#destination_prefix_list_id RouteTable#destination_prefix_list_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDestinationPrefixListId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#egress_only_gateway_id RouteTable#egress_only_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEgressOnlyGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#gateway_id RouteTable#gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#ipv6_cidr_block RouteTable#ipv6_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#local_gateway_id RouteTable#local_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocalGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#nat_gateway_id RouteTable#nat_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNatGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#network_interface_id RouteTable#network_interface_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetworkInterfaceId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#transit_gateway_id RouteTable#transit_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#vpc_endpoint_id RouteTable#vpc_endpoint_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcEndpointId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#vpc_peering_connection_id RouteTable#vpc_peering_connection_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcPeeringConnectionId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RouteTableRoute}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RouteTableRoute}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RouteTableRoute> {
        java.lang.String carrierGatewayId;
        java.lang.String cidrBlock;
        java.lang.String coreNetworkArn;
        java.lang.String destinationPrefixListId;
        java.lang.String egressOnlyGatewayId;
        java.lang.String gatewayId;
        java.lang.String ipv6CidrBlock;
        java.lang.String localGatewayId;
        java.lang.String natGatewayId;
        java.lang.String networkInterfaceId;
        java.lang.String transitGatewayId;
        java.lang.String vpcEndpointId;
        java.lang.String vpcPeeringConnectionId;

        /**
         * Sets the value of {@link RouteTableRoute#getCarrierGatewayId}
         * @param carrierGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#carrier_gateway_id RouteTable#carrier_gateway_id}.
         * @return {@code this}
         */
        public Builder carrierGatewayId(java.lang.String carrierGatewayId) {
            this.carrierGatewayId = carrierGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link RouteTableRoute#getCidrBlock}
         * @param cidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#cidr_block RouteTable#cidr_block}.
         * @return {@code this}
         */
        public Builder cidrBlock(java.lang.String cidrBlock) {
            this.cidrBlock = cidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link RouteTableRoute#getCoreNetworkArn}
         * @param coreNetworkArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#core_network_arn RouteTable#core_network_arn}.
         * @return {@code this}
         */
        public Builder coreNetworkArn(java.lang.String coreNetworkArn) {
            this.coreNetworkArn = coreNetworkArn;
            return this;
        }

        /**
         * Sets the value of {@link RouteTableRoute#getDestinationPrefixListId}
         * @param destinationPrefixListId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#destination_prefix_list_id RouteTable#destination_prefix_list_id}.
         * @return {@code this}
         */
        public Builder destinationPrefixListId(java.lang.String destinationPrefixListId) {
            this.destinationPrefixListId = destinationPrefixListId;
            return this;
        }

        /**
         * Sets the value of {@link RouteTableRoute#getEgressOnlyGatewayId}
         * @param egressOnlyGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#egress_only_gateway_id RouteTable#egress_only_gateway_id}.
         * @return {@code this}
         */
        public Builder egressOnlyGatewayId(java.lang.String egressOnlyGatewayId) {
            this.egressOnlyGatewayId = egressOnlyGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link RouteTableRoute#getGatewayId}
         * @param gatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#gateway_id RouteTable#gateway_id}.
         * @return {@code this}
         */
        public Builder gatewayId(java.lang.String gatewayId) {
            this.gatewayId = gatewayId;
            return this;
        }

        /**
         * Sets the value of {@link RouteTableRoute#getIpv6CidrBlock}
         * @param ipv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#ipv6_cidr_block RouteTable#ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder ipv6CidrBlock(java.lang.String ipv6CidrBlock) {
            this.ipv6CidrBlock = ipv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link RouteTableRoute#getLocalGatewayId}
         * @param localGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#local_gateway_id RouteTable#local_gateway_id}.
         * @return {@code this}
         */
        public Builder localGatewayId(java.lang.String localGatewayId) {
            this.localGatewayId = localGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link RouteTableRoute#getNatGatewayId}
         * @param natGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#nat_gateway_id RouteTable#nat_gateway_id}.
         * @return {@code this}
         */
        public Builder natGatewayId(java.lang.String natGatewayId) {
            this.natGatewayId = natGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link RouteTableRoute#getNetworkInterfaceId}
         * @param networkInterfaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#network_interface_id RouteTable#network_interface_id}.
         * @return {@code this}
         */
        public Builder networkInterfaceId(java.lang.String networkInterfaceId) {
            this.networkInterfaceId = networkInterfaceId;
            return this;
        }

        /**
         * Sets the value of {@link RouteTableRoute#getTransitGatewayId}
         * @param transitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#transit_gateway_id RouteTable#transit_gateway_id}.
         * @return {@code this}
         */
        public Builder transitGatewayId(java.lang.String transitGatewayId) {
            this.transitGatewayId = transitGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link RouteTableRoute#getVpcEndpointId}
         * @param vpcEndpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#vpc_endpoint_id RouteTable#vpc_endpoint_id}.
         * @return {@code this}
         */
        public Builder vpcEndpointId(java.lang.String vpcEndpointId) {
            this.vpcEndpointId = vpcEndpointId;
            return this;
        }

        /**
         * Sets the value of {@link RouteTableRoute#getVpcPeeringConnectionId}
         * @param vpcPeeringConnectionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route_table#vpc_peering_connection_id RouteTable#vpc_peering_connection_id}.
         * @return {@code this}
         */
        public Builder vpcPeeringConnectionId(java.lang.String vpcPeeringConnectionId) {
            this.vpcPeeringConnectionId = vpcPeeringConnectionId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RouteTableRoute}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RouteTableRoute build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RouteTableRoute}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RouteTableRoute {
        private final java.lang.String carrierGatewayId;
        private final java.lang.String cidrBlock;
        private final java.lang.String coreNetworkArn;
        private final java.lang.String destinationPrefixListId;
        private final java.lang.String egressOnlyGatewayId;
        private final java.lang.String gatewayId;
        private final java.lang.String ipv6CidrBlock;
        private final java.lang.String localGatewayId;
        private final java.lang.String natGatewayId;
        private final java.lang.String networkInterfaceId;
        private final java.lang.String transitGatewayId;
        private final java.lang.String vpcEndpointId;
        private final java.lang.String vpcPeeringConnectionId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.carrierGatewayId = software.amazon.jsii.Kernel.get(this, "carrierGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cidrBlock = software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.coreNetworkArn = software.amazon.jsii.Kernel.get(this, "coreNetworkArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationPrefixListId = software.amazon.jsii.Kernel.get(this, "destinationPrefixListId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.egressOnlyGatewayId = software.amazon.jsii.Kernel.get(this, "egressOnlyGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.gatewayId = software.amazon.jsii.Kernel.get(this, "gatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6CidrBlock = software.amazon.jsii.Kernel.get(this, "ipv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localGatewayId = software.amazon.jsii.Kernel.get(this, "localGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.natGatewayId = software.amazon.jsii.Kernel.get(this, "natGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkInterfaceId = software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transitGatewayId = software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcEndpointId = software.amazon.jsii.Kernel.get(this, "vpcEndpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcPeeringConnectionId = software.amazon.jsii.Kernel.get(this, "vpcPeeringConnectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.carrierGatewayId = builder.carrierGatewayId;
            this.cidrBlock = builder.cidrBlock;
            this.coreNetworkArn = builder.coreNetworkArn;
            this.destinationPrefixListId = builder.destinationPrefixListId;
            this.egressOnlyGatewayId = builder.egressOnlyGatewayId;
            this.gatewayId = builder.gatewayId;
            this.ipv6CidrBlock = builder.ipv6CidrBlock;
            this.localGatewayId = builder.localGatewayId;
            this.natGatewayId = builder.natGatewayId;
            this.networkInterfaceId = builder.networkInterfaceId;
            this.transitGatewayId = builder.transitGatewayId;
            this.vpcEndpointId = builder.vpcEndpointId;
            this.vpcPeeringConnectionId = builder.vpcPeeringConnectionId;
        }

        @Override
        public final java.lang.String getCarrierGatewayId() {
            return this.carrierGatewayId;
        }

        @Override
        public final java.lang.String getCidrBlock() {
            return this.cidrBlock;
        }

        @Override
        public final java.lang.String getCoreNetworkArn() {
            return this.coreNetworkArn;
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
        public final java.lang.String getIpv6CidrBlock() {
            return this.ipv6CidrBlock;
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
        public final java.lang.String getTransitGatewayId() {
            return this.transitGatewayId;
        }

        @Override
        public final java.lang.String getVpcEndpointId() {
            return this.vpcEndpointId;
        }

        @Override
        public final java.lang.String getVpcPeeringConnectionId() {
            return this.vpcPeeringConnectionId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCarrierGatewayId() != null) {
                data.set("carrierGatewayId", om.valueToTree(this.getCarrierGatewayId()));
            }
            if (this.getCidrBlock() != null) {
                data.set("cidrBlock", om.valueToTree(this.getCidrBlock()));
            }
            if (this.getCoreNetworkArn() != null) {
                data.set("coreNetworkArn", om.valueToTree(this.getCoreNetworkArn()));
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
            if (this.getIpv6CidrBlock() != null) {
                data.set("ipv6CidrBlock", om.valueToTree(this.getIpv6CidrBlock()));
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
            if (this.getTransitGatewayId() != null) {
                data.set("transitGatewayId", om.valueToTree(this.getTransitGatewayId()));
            }
            if (this.getVpcEndpointId() != null) {
                data.set("vpcEndpointId", om.valueToTree(this.getVpcEndpointId()));
            }
            if (this.getVpcPeeringConnectionId() != null) {
                data.set("vpcPeeringConnectionId", om.valueToTree(this.getVpcPeeringConnectionId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.routeTable.RouteTableRoute"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RouteTableRoute.Jsii$Proxy that = (RouteTableRoute.Jsii$Proxy) o;

            if (this.carrierGatewayId != null ? !this.carrierGatewayId.equals(that.carrierGatewayId) : that.carrierGatewayId != null) return false;
            if (this.cidrBlock != null ? !this.cidrBlock.equals(that.cidrBlock) : that.cidrBlock != null) return false;
            if (this.coreNetworkArn != null ? !this.coreNetworkArn.equals(that.coreNetworkArn) : that.coreNetworkArn != null) return false;
            if (this.destinationPrefixListId != null ? !this.destinationPrefixListId.equals(that.destinationPrefixListId) : that.destinationPrefixListId != null) return false;
            if (this.egressOnlyGatewayId != null ? !this.egressOnlyGatewayId.equals(that.egressOnlyGatewayId) : that.egressOnlyGatewayId != null) return false;
            if (this.gatewayId != null ? !this.gatewayId.equals(that.gatewayId) : that.gatewayId != null) return false;
            if (this.ipv6CidrBlock != null ? !this.ipv6CidrBlock.equals(that.ipv6CidrBlock) : that.ipv6CidrBlock != null) return false;
            if (this.localGatewayId != null ? !this.localGatewayId.equals(that.localGatewayId) : that.localGatewayId != null) return false;
            if (this.natGatewayId != null ? !this.natGatewayId.equals(that.natGatewayId) : that.natGatewayId != null) return false;
            if (this.networkInterfaceId != null ? !this.networkInterfaceId.equals(that.networkInterfaceId) : that.networkInterfaceId != null) return false;
            if (this.transitGatewayId != null ? !this.transitGatewayId.equals(that.transitGatewayId) : that.transitGatewayId != null) return false;
            if (this.vpcEndpointId != null ? !this.vpcEndpointId.equals(that.vpcEndpointId) : that.vpcEndpointId != null) return false;
            return this.vpcPeeringConnectionId != null ? this.vpcPeeringConnectionId.equals(that.vpcPeeringConnectionId) : that.vpcPeeringConnectionId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.carrierGatewayId != null ? this.carrierGatewayId.hashCode() : 0;
            result = 31 * result + (this.cidrBlock != null ? this.cidrBlock.hashCode() : 0);
            result = 31 * result + (this.coreNetworkArn != null ? this.coreNetworkArn.hashCode() : 0);
            result = 31 * result + (this.destinationPrefixListId != null ? this.destinationPrefixListId.hashCode() : 0);
            result = 31 * result + (this.egressOnlyGatewayId != null ? this.egressOnlyGatewayId.hashCode() : 0);
            result = 31 * result + (this.gatewayId != null ? this.gatewayId.hashCode() : 0);
            result = 31 * result + (this.ipv6CidrBlock != null ? this.ipv6CidrBlock.hashCode() : 0);
            result = 31 * result + (this.localGatewayId != null ? this.localGatewayId.hashCode() : 0);
            result = 31 * result + (this.natGatewayId != null ? this.natGatewayId.hashCode() : 0);
            result = 31 * result + (this.networkInterfaceId != null ? this.networkInterfaceId.hashCode() : 0);
            result = 31 * result + (this.transitGatewayId != null ? this.transitGatewayId.hashCode() : 0);
            result = 31 * result + (this.vpcEndpointId != null ? this.vpcEndpointId.hashCode() : 0);
            result = 31 * result + (this.vpcPeeringConnectionId != null ? this.vpcPeeringConnectionId.hashCode() : 0);
            return result;
        }
    }
}
