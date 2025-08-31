package imports.aws.lb_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.538Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbTargetGroup.LbTargetGroupTargetHealthState")
@software.amazon.jsii.Jsii.Proxy(LbTargetGroupTargetHealthState.Jsii$Proxy.class)
public interface LbTargetGroupTargetHealthState extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#enable_unhealthy_connection_termination LbTargetGroup#enable_unhealthy_connection_termination}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnableUnhealthyConnectionTermination();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#unhealthy_draining_interval LbTargetGroup#unhealthy_draining_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUnhealthyDrainingInterval() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbTargetGroupTargetHealthState}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbTargetGroupTargetHealthState}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbTargetGroupTargetHealthState> {
        java.lang.Object enableUnhealthyConnectionTermination;
        java.lang.Number unhealthyDrainingInterval;

        /**
         * Sets the value of {@link LbTargetGroupTargetHealthState#getEnableUnhealthyConnectionTermination}
         * @param enableUnhealthyConnectionTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#enable_unhealthy_connection_termination LbTargetGroup#enable_unhealthy_connection_termination}. This parameter is required.
         * @return {@code this}
         */
        public Builder enableUnhealthyConnectionTermination(java.lang.Boolean enableUnhealthyConnectionTermination) {
            this.enableUnhealthyConnectionTermination = enableUnhealthyConnectionTermination;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupTargetHealthState#getEnableUnhealthyConnectionTermination}
         * @param enableUnhealthyConnectionTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#enable_unhealthy_connection_termination LbTargetGroup#enable_unhealthy_connection_termination}. This parameter is required.
         * @return {@code this}
         */
        public Builder enableUnhealthyConnectionTermination(com.hashicorp.cdktf.IResolvable enableUnhealthyConnectionTermination) {
            this.enableUnhealthyConnectionTermination = enableUnhealthyConnectionTermination;
            return this;
        }

        /**
         * Sets the value of {@link LbTargetGroupTargetHealthState#getUnhealthyDrainingInterval}
         * @param unhealthyDrainingInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_target_group#unhealthy_draining_interval LbTargetGroup#unhealthy_draining_interval}.
         * @return {@code this}
         */
        public Builder unhealthyDrainingInterval(java.lang.Number unhealthyDrainingInterval) {
            this.unhealthyDrainingInterval = unhealthyDrainingInterval;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LbTargetGroupTargetHealthState}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbTargetGroupTargetHealthState build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbTargetGroupTargetHealthState}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbTargetGroupTargetHealthState {
        private final java.lang.Object enableUnhealthyConnectionTermination;
        private final java.lang.Number unhealthyDrainingInterval;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enableUnhealthyConnectionTermination = software.amazon.jsii.Kernel.get(this, "enableUnhealthyConnectionTermination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.unhealthyDrainingInterval = software.amazon.jsii.Kernel.get(this, "unhealthyDrainingInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enableUnhealthyConnectionTermination = java.util.Objects.requireNonNull(builder.enableUnhealthyConnectionTermination, "enableUnhealthyConnectionTermination is required");
            this.unhealthyDrainingInterval = builder.unhealthyDrainingInterval;
        }

        @Override
        public final java.lang.Object getEnableUnhealthyConnectionTermination() {
            return this.enableUnhealthyConnectionTermination;
        }

        @Override
        public final java.lang.Number getUnhealthyDrainingInterval() {
            return this.unhealthyDrainingInterval;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enableUnhealthyConnectionTermination", om.valueToTree(this.getEnableUnhealthyConnectionTermination()));
            if (this.getUnhealthyDrainingInterval() != null) {
                data.set("unhealthyDrainingInterval", om.valueToTree(this.getUnhealthyDrainingInterval()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lbTargetGroup.LbTargetGroupTargetHealthState"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbTargetGroupTargetHealthState.Jsii$Proxy that = (LbTargetGroupTargetHealthState.Jsii$Proxy) o;

            if (!enableUnhealthyConnectionTermination.equals(that.enableUnhealthyConnectionTermination)) return false;
            return this.unhealthyDrainingInterval != null ? this.unhealthyDrainingInterval.equals(that.unhealthyDrainingInterval) : that.unhealthyDrainingInterval == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enableUnhealthyConnectionTermination.hashCode();
            result = 31 * result + (this.unhealthyDrainingInterval != null ? this.unhealthyDrainingInterval.hashCode() : 0);
            return result;
        }
    }
}
