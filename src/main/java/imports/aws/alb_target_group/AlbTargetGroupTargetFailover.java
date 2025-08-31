package imports.aws.alb_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.921Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.albTargetGroup.AlbTargetGroupTargetFailover")
@software.amazon.jsii.Jsii.Proxy(AlbTargetGroupTargetFailover.Jsii$Proxy.class)
public interface AlbTargetGroupTargetFailover extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#on_deregistration AlbTargetGroup#on_deregistration}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOnDeregistration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#on_unhealthy AlbTargetGroup#on_unhealthy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOnUnhealthy();

    /**
     * @return a {@link Builder} of {@link AlbTargetGroupTargetFailover}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AlbTargetGroupTargetFailover}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AlbTargetGroupTargetFailover> {
        java.lang.String onDeregistration;
        java.lang.String onUnhealthy;

        /**
         * Sets the value of {@link AlbTargetGroupTargetFailover#getOnDeregistration}
         * @param onDeregistration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#on_deregistration AlbTargetGroup#on_deregistration}. This parameter is required.
         * @return {@code this}
         */
        public Builder onDeregistration(java.lang.String onDeregistration) {
            this.onDeregistration = onDeregistration;
            return this;
        }

        /**
         * Sets the value of {@link AlbTargetGroupTargetFailover#getOnUnhealthy}
         * @param onUnhealthy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_target_group#on_unhealthy AlbTargetGroup#on_unhealthy}. This parameter is required.
         * @return {@code this}
         */
        public Builder onUnhealthy(java.lang.String onUnhealthy) {
            this.onUnhealthy = onUnhealthy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AlbTargetGroupTargetFailover}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AlbTargetGroupTargetFailover build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AlbTargetGroupTargetFailover}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AlbTargetGroupTargetFailover {
        private final java.lang.String onDeregistration;
        private final java.lang.String onUnhealthy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.onDeregistration = software.amazon.jsii.Kernel.get(this, "onDeregistration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.onUnhealthy = software.amazon.jsii.Kernel.get(this, "onUnhealthy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.onDeregistration = java.util.Objects.requireNonNull(builder.onDeregistration, "onDeregistration is required");
            this.onUnhealthy = java.util.Objects.requireNonNull(builder.onUnhealthy, "onUnhealthy is required");
        }

        @Override
        public final java.lang.String getOnDeregistration() {
            return this.onDeregistration;
        }

        @Override
        public final java.lang.String getOnUnhealthy() {
            return this.onUnhealthy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("onDeregistration", om.valueToTree(this.getOnDeregistration()));
            data.set("onUnhealthy", om.valueToTree(this.getOnUnhealthy()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.albTargetGroup.AlbTargetGroupTargetFailover"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AlbTargetGroupTargetFailover.Jsii$Proxy that = (AlbTargetGroupTargetFailover.Jsii$Proxy) o;

            if (!onDeregistration.equals(that.onDeregistration)) return false;
            return this.onUnhealthy.equals(that.onUnhealthy);
        }

        @Override
        public final int hashCode() {
            int result = this.onDeregistration.hashCode();
            result = 31 * result + (this.onUnhealthy.hashCode());
            return result;
        }
    }
}
