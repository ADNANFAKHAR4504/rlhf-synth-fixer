package imports.aws.alb_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.921Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.albTargetGroup.AlbTargetGroupTargetGroupHealth")
@software.amazon.jsii.Jsii.Proxy(AlbTargetGroupTargetGroupHealth.Jsii$Proxy.class)
public interface AlbTargetGroupTargetGroupHealth extends software.amazon.jsii.JsiiSerializable {

    /**
     * dns_failover block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#dns_failover AlbTargetGroup#dns_failover}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthDnsFailover getDnsFailover() {
        return null;
    }

    /**
     * unhealthy_state_routing block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#unhealthy_state_routing AlbTargetGroup#unhealthy_state_routing}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthUnhealthyStateRouting getUnhealthyStateRouting() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AlbTargetGroupTargetGroupHealth}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AlbTargetGroupTargetGroupHealth}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AlbTargetGroupTargetGroupHealth> {
        imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthDnsFailover dnsFailover;
        imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthUnhealthyStateRouting unhealthyStateRouting;

        /**
         * Sets the value of {@link AlbTargetGroupTargetGroupHealth#getDnsFailover}
         * @param dnsFailover dns_failover block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#dns_failover AlbTargetGroup#dns_failover}
         * @return {@code this}
         */
        public Builder dnsFailover(imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthDnsFailover dnsFailover) {
            this.dnsFailover = dnsFailover;
            return this;
        }

        /**
         * Sets the value of {@link AlbTargetGroupTargetGroupHealth#getUnhealthyStateRouting}
         * @param unhealthyStateRouting unhealthy_state_routing block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#unhealthy_state_routing AlbTargetGroup#unhealthy_state_routing}
         * @return {@code this}
         */
        public Builder unhealthyStateRouting(imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthUnhealthyStateRouting unhealthyStateRouting) {
            this.unhealthyStateRouting = unhealthyStateRouting;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AlbTargetGroupTargetGroupHealth}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AlbTargetGroupTargetGroupHealth build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AlbTargetGroupTargetGroupHealth}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AlbTargetGroupTargetGroupHealth {
        private final imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthDnsFailover dnsFailover;
        private final imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthUnhealthyStateRouting unhealthyStateRouting;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dnsFailover = software.amazon.jsii.Kernel.get(this, "dnsFailover", software.amazon.jsii.NativeType.forClass(imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthDnsFailover.class));
            this.unhealthyStateRouting = software.amazon.jsii.Kernel.get(this, "unhealthyStateRouting", software.amazon.jsii.NativeType.forClass(imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthUnhealthyStateRouting.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dnsFailover = builder.dnsFailover;
            this.unhealthyStateRouting = builder.unhealthyStateRouting;
        }

        @Override
        public final imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthDnsFailover getDnsFailover() {
            return this.dnsFailover;
        }

        @Override
        public final imports.aws.alb_target_group.AlbTargetGroupTargetGroupHealthUnhealthyStateRouting getUnhealthyStateRouting() {
            return this.unhealthyStateRouting;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDnsFailover() != null) {
                data.set("dnsFailover", om.valueToTree(this.getDnsFailover()));
            }
            if (this.getUnhealthyStateRouting() != null) {
                data.set("unhealthyStateRouting", om.valueToTree(this.getUnhealthyStateRouting()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.albTargetGroup.AlbTargetGroupTargetGroupHealth"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AlbTargetGroupTargetGroupHealth.Jsii$Proxy that = (AlbTargetGroupTargetGroupHealth.Jsii$Proxy) o;

            if (this.dnsFailover != null ? !this.dnsFailover.equals(that.dnsFailover) : that.dnsFailover != null) return false;
            return this.unhealthyStateRouting != null ? this.unhealthyStateRouting.equals(that.unhealthyStateRouting) : that.unhealthyStateRouting == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dnsFailover != null ? this.dnsFailover.hashCode() : 0;
            result = 31 * result + (this.unhealthyStateRouting != null ? this.unhealthyStateRouting.hashCode() : 0);
            return result;
        }
    }
}
