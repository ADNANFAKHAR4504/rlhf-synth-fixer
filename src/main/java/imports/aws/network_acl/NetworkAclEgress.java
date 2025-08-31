package imports.aws.network_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.940Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkAcl.NetworkAclEgress")
@software.amazon.jsii.Jsii.Proxy(NetworkAclEgress.Jsii$Proxy.class)
public interface NetworkAclEgress extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#action NetworkAcl#action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#cidr_block NetworkAcl#cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#from_port NetworkAcl#from_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFromPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#icmp_code NetworkAcl#icmp_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIcmpCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#icmp_type NetworkAcl#icmp_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIcmpType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#ipv6_cidr_block NetworkAcl#ipv6_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#protocol NetworkAcl#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#rule_no NetworkAcl#rule_no}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRuleNo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#to_port NetworkAcl#to_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getToPort() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkAclEgress}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkAclEgress}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkAclEgress> {
        java.lang.String action;
        java.lang.String cidrBlock;
        java.lang.Number fromPort;
        java.lang.Number icmpCode;
        java.lang.Number icmpType;
        java.lang.String ipv6CidrBlock;
        java.lang.String protocol;
        java.lang.Number ruleNo;
        java.lang.Number toPort;

        /**
         * Sets the value of {@link NetworkAclEgress#getAction}
         * @param action Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#action NetworkAcl#action}.
         * @return {@code this}
         */
        public Builder action(java.lang.String action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclEgress#getCidrBlock}
         * @param cidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#cidr_block NetworkAcl#cidr_block}.
         * @return {@code this}
         */
        public Builder cidrBlock(java.lang.String cidrBlock) {
            this.cidrBlock = cidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclEgress#getFromPort}
         * @param fromPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#from_port NetworkAcl#from_port}.
         * @return {@code this}
         */
        public Builder fromPort(java.lang.Number fromPort) {
            this.fromPort = fromPort;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclEgress#getIcmpCode}
         * @param icmpCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#icmp_code NetworkAcl#icmp_code}.
         * @return {@code this}
         */
        public Builder icmpCode(java.lang.Number icmpCode) {
            this.icmpCode = icmpCode;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclEgress#getIcmpType}
         * @param icmpType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#icmp_type NetworkAcl#icmp_type}.
         * @return {@code this}
         */
        public Builder icmpType(java.lang.Number icmpType) {
            this.icmpType = icmpType;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclEgress#getIpv6CidrBlock}
         * @param ipv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#ipv6_cidr_block NetworkAcl#ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder ipv6CidrBlock(java.lang.String ipv6CidrBlock) {
            this.ipv6CidrBlock = ipv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclEgress#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#protocol NetworkAcl#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclEgress#getRuleNo}
         * @param ruleNo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#rule_no NetworkAcl#rule_no}.
         * @return {@code this}
         */
        public Builder ruleNo(java.lang.Number ruleNo) {
            this.ruleNo = ruleNo;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclEgress#getToPort}
         * @param toPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl#to_port NetworkAcl#to_port}.
         * @return {@code this}
         */
        public Builder toPort(java.lang.Number toPort) {
            this.toPort = toPort;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkAclEgress}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkAclEgress build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkAclEgress}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkAclEgress {
        private final java.lang.String action;
        private final java.lang.String cidrBlock;
        private final java.lang.Number fromPort;
        private final java.lang.Number icmpCode;
        private final java.lang.Number icmpType;
        private final java.lang.String ipv6CidrBlock;
        private final java.lang.String protocol;
        private final java.lang.Number ruleNo;
        private final java.lang.Number toPort;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cidrBlock = software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fromPort = software.amazon.jsii.Kernel.get(this, "fromPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.icmpCode = software.amazon.jsii.Kernel.get(this, "icmpCode", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.icmpType = software.amazon.jsii.Kernel.get(this, "icmpType", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ipv6CidrBlock = software.amazon.jsii.Kernel.get(this, "ipv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleNo = software.amazon.jsii.Kernel.get(this, "ruleNo", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.toPort = software.amazon.jsii.Kernel.get(this, "toPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = builder.action;
            this.cidrBlock = builder.cidrBlock;
            this.fromPort = builder.fromPort;
            this.icmpCode = builder.icmpCode;
            this.icmpType = builder.icmpType;
            this.ipv6CidrBlock = builder.ipv6CidrBlock;
            this.protocol = builder.protocol;
            this.ruleNo = builder.ruleNo;
            this.toPort = builder.toPort;
        }

        @Override
        public final java.lang.String getAction() {
            return this.action;
        }

        @Override
        public final java.lang.String getCidrBlock() {
            return this.cidrBlock;
        }

        @Override
        public final java.lang.Number getFromPort() {
            return this.fromPort;
        }

        @Override
        public final java.lang.Number getIcmpCode() {
            return this.icmpCode;
        }

        @Override
        public final java.lang.Number getIcmpType() {
            return this.icmpType;
        }

        @Override
        public final java.lang.String getIpv6CidrBlock() {
            return this.ipv6CidrBlock;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.Number getRuleNo() {
            return this.ruleNo;
        }

        @Override
        public final java.lang.Number getToPort() {
            return this.toPort;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAction() != null) {
                data.set("action", om.valueToTree(this.getAction()));
            }
            if (this.getCidrBlock() != null) {
                data.set("cidrBlock", om.valueToTree(this.getCidrBlock()));
            }
            if (this.getFromPort() != null) {
                data.set("fromPort", om.valueToTree(this.getFromPort()));
            }
            if (this.getIcmpCode() != null) {
                data.set("icmpCode", om.valueToTree(this.getIcmpCode()));
            }
            if (this.getIcmpType() != null) {
                data.set("icmpType", om.valueToTree(this.getIcmpType()));
            }
            if (this.getIpv6CidrBlock() != null) {
                data.set("ipv6CidrBlock", om.valueToTree(this.getIpv6CidrBlock()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }
            if (this.getRuleNo() != null) {
                data.set("ruleNo", om.valueToTree(this.getRuleNo()));
            }
            if (this.getToPort() != null) {
                data.set("toPort", om.valueToTree(this.getToPort()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkAcl.NetworkAclEgress"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkAclEgress.Jsii$Proxy that = (NetworkAclEgress.Jsii$Proxy) o;

            if (this.action != null ? !this.action.equals(that.action) : that.action != null) return false;
            if (this.cidrBlock != null ? !this.cidrBlock.equals(that.cidrBlock) : that.cidrBlock != null) return false;
            if (this.fromPort != null ? !this.fromPort.equals(that.fromPort) : that.fromPort != null) return false;
            if (this.icmpCode != null ? !this.icmpCode.equals(that.icmpCode) : that.icmpCode != null) return false;
            if (this.icmpType != null ? !this.icmpType.equals(that.icmpType) : that.icmpType != null) return false;
            if (this.ipv6CidrBlock != null ? !this.ipv6CidrBlock.equals(that.ipv6CidrBlock) : that.ipv6CidrBlock != null) return false;
            if (this.protocol != null ? !this.protocol.equals(that.protocol) : that.protocol != null) return false;
            if (this.ruleNo != null ? !this.ruleNo.equals(that.ruleNo) : that.ruleNo != null) return false;
            return this.toPort != null ? this.toPort.equals(that.toPort) : that.toPort == null;
        }

        @Override
        public final int hashCode() {
            int result = this.action != null ? this.action.hashCode() : 0;
            result = 31 * result + (this.cidrBlock != null ? this.cidrBlock.hashCode() : 0);
            result = 31 * result + (this.fromPort != null ? this.fromPort.hashCode() : 0);
            result = 31 * result + (this.icmpCode != null ? this.icmpCode.hashCode() : 0);
            result = 31 * result + (this.icmpType != null ? this.icmpType.hashCode() : 0);
            result = 31 * result + (this.ipv6CidrBlock != null ? this.ipv6CidrBlock.hashCode() : 0);
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            result = 31 * result + (this.ruleNo != null ? this.ruleNo.hashCode() : 0);
            result = 31 * result + (this.toPort != null ? this.toPort.hashCode() : 0);
            return result;
        }
    }
}
