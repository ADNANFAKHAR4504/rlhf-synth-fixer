package imports.aws.appmesh_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.026Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshRoute.AppmeshRouteSpecGrpcRouteAction")
@software.amazon.jsii.Jsii.Proxy(AppmeshRouteSpecGrpcRouteAction.Jsii$Proxy.class)
public interface AppmeshRouteSpecGrpcRouteAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * weighted_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#weighted_target AppmeshRoute#weighted_target}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getWeightedTarget();

    /**
     * @return a {@link Builder} of {@link AppmeshRouteSpecGrpcRouteAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshRouteSpecGrpcRouteAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshRouteSpecGrpcRouteAction> {
        java.lang.Object weightedTarget;

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteAction#getWeightedTarget}
         * @param weightedTarget weighted_target block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#weighted_target AppmeshRoute#weighted_target}
         * @return {@code this}
         */
        public Builder weightedTarget(com.hashicorp.cdktf.IResolvable weightedTarget) {
            this.weightedTarget = weightedTarget;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteAction#getWeightedTarget}
         * @param weightedTarget weighted_target block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#weighted_target AppmeshRoute#weighted_target}
         * @return {@code this}
         */
        public Builder weightedTarget(java.util.List<? extends imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteActionWeightedTarget> weightedTarget) {
            this.weightedTarget = weightedTarget;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshRouteSpecGrpcRouteAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshRouteSpecGrpcRouteAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshRouteSpecGrpcRouteAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshRouteSpecGrpcRouteAction {
        private final java.lang.Object weightedTarget;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.weightedTarget = software.amazon.jsii.Kernel.get(this, "weightedTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.weightedTarget = java.util.Objects.requireNonNull(builder.weightedTarget, "weightedTarget is required");
        }

        @Override
        public final java.lang.Object getWeightedTarget() {
            return this.weightedTarget;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("weightedTarget", om.valueToTree(this.getWeightedTarget()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshRoute.AppmeshRouteSpecGrpcRouteAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshRouteSpecGrpcRouteAction.Jsii$Proxy that = (AppmeshRouteSpecGrpcRouteAction.Jsii$Proxy) o;

            return this.weightedTarget.equals(that.weightedTarget);
        }

        @Override
        public final int hashCode() {
            int result = this.weightedTarget.hashCode();
            return result;
        }
    }
}
