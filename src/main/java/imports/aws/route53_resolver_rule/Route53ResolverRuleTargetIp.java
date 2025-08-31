package imports.aws.route53_resolver_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.234Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53ResolverRule.Route53ResolverRuleTargetIp")
@software.amazon.jsii.Jsii.Proxy(Route53ResolverRuleTargetIp.Jsii$Proxy.class)
public interface Route53ResolverRuleTargetIp extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_resolver_rule#ip Route53ResolverRule#ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_resolver_rule#ipv6 Route53ResolverRule#ipv6}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_resolver_rule#port Route53ResolverRule#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_resolver_rule#protocol Route53ResolverRule#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53ResolverRuleTargetIp}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53ResolverRuleTargetIp}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53ResolverRuleTargetIp> {
        java.lang.String ip;
        java.lang.String ipv6;
        java.lang.Number port;
        java.lang.String protocol;

        /**
         * Sets the value of {@link Route53ResolverRuleTargetIp#getIp}
         * @param ip Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_resolver_rule#ip Route53ResolverRule#ip}.
         * @return {@code this}
         */
        public Builder ip(java.lang.String ip) {
            this.ip = ip;
            return this;
        }

        /**
         * Sets the value of {@link Route53ResolverRuleTargetIp#getIpv6}
         * @param ipv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_resolver_rule#ipv6 Route53ResolverRule#ipv6}.
         * @return {@code this}
         */
        public Builder ipv6(java.lang.String ipv6) {
            this.ipv6 = ipv6;
            return this;
        }

        /**
         * Sets the value of {@link Route53ResolverRuleTargetIp#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_resolver_rule#port Route53ResolverRule#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link Route53ResolverRuleTargetIp#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53_resolver_rule#protocol Route53ResolverRule#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Route53ResolverRuleTargetIp}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53ResolverRuleTargetIp build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53ResolverRuleTargetIp}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53ResolverRuleTargetIp {
        private final java.lang.String ip;
        private final java.lang.String ipv6;
        private final java.lang.Number port;
        private final java.lang.String protocol;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ip = software.amazon.jsii.Kernel.get(this, "ip", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6 = software.amazon.jsii.Kernel.get(this, "ipv6", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ip = builder.ip;
            this.ipv6 = builder.ipv6;
            this.port = builder.port;
            this.protocol = builder.protocol;
        }

        @Override
        public final java.lang.String getIp() {
            return this.ip;
        }

        @Override
        public final java.lang.String getIpv6() {
            return this.ipv6;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIp() != null) {
                data.set("ip", om.valueToTree(this.getIp()));
            }
            if (this.getIpv6() != null) {
                data.set("ipv6", om.valueToTree(this.getIpv6()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.route53ResolverRule.Route53ResolverRuleTargetIp"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53ResolverRuleTargetIp.Jsii$Proxy that = (Route53ResolverRuleTargetIp.Jsii$Proxy) o;

            if (this.ip != null ? !this.ip.equals(that.ip) : that.ip != null) return false;
            if (this.ipv6 != null ? !this.ipv6.equals(that.ipv6) : that.ipv6 != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            return this.protocol != null ? this.protocol.equals(that.protocol) : that.protocol == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ip != null ? this.ip.hashCode() : 0;
            result = 31 * result + (this.ipv6 != null ? this.ipv6.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            return result;
        }
    }
}
