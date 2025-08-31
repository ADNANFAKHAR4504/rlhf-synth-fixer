package imports.aws.appmesh_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.030Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshRoute.AppmeshRouteSpecHttp2Route")
@software.amazon.jsii.Jsii.Proxy(AppmeshRouteSpecHttp2Route.Jsii$Proxy.class)
public interface AppmeshRouteSpecHttp2Route extends software.amazon.jsii.JsiiSerializable {

    /**
     * action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#action AppmeshRoute#action}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteAction getAction();

    /**
     * match block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#match AppmeshRoute#match}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteMatch getMatch();

    /**
     * retry_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#retry_policy AppmeshRoute#retry_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteRetryPolicy getRetryPolicy() {
        return null;
    }

    /**
     * timeout block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#timeout AppmeshRoute#timeout}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteTimeout getTimeout() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshRouteSpecHttp2Route}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshRouteSpecHttp2Route}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshRouteSpecHttp2Route> {
        imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteAction action;
        imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteMatch match;
        imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteRetryPolicy retryPolicy;
        imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteTimeout timeout;

        /**
         * Sets the value of {@link AppmeshRouteSpecHttp2Route#getAction}
         * @param action action block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#action AppmeshRoute#action}
         * @return {@code this}
         */
        public Builder action(imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteAction action) {
            this.action = action;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecHttp2Route#getMatch}
         * @param match match block. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#match AppmeshRoute#match}
         * @return {@code this}
         */
        public Builder match(imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteMatch match) {
            this.match = match;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecHttp2Route#getRetryPolicy}
         * @param retryPolicy retry_policy block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#retry_policy AppmeshRoute#retry_policy}
         * @return {@code this}
         */
        public Builder retryPolicy(imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteRetryPolicy retryPolicy) {
            this.retryPolicy = retryPolicy;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecHttp2Route#getTimeout}
         * @param timeout timeout block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#timeout AppmeshRoute#timeout}
         * @return {@code this}
         */
        public Builder timeout(imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteTimeout timeout) {
            this.timeout = timeout;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshRouteSpecHttp2Route}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshRouteSpecHttp2Route build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshRouteSpecHttp2Route}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshRouteSpecHttp2Route {
        private final imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteAction action;
        private final imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteMatch match;
        private final imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteRetryPolicy retryPolicy;
        private final imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteTimeout timeout;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.action = software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteAction.class));
            this.match = software.amazon.jsii.Kernel.get(this, "match", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteMatch.class));
            this.retryPolicy = software.amazon.jsii.Kernel.get(this, "retryPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteRetryPolicy.class));
            this.timeout = software.amazon.jsii.Kernel.get(this, "timeout", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteTimeout.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.action = java.util.Objects.requireNonNull(builder.action, "action is required");
            this.match = java.util.Objects.requireNonNull(builder.match, "match is required");
            this.retryPolicy = builder.retryPolicy;
            this.timeout = builder.timeout;
        }

        @Override
        public final imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteAction getAction() {
            return this.action;
        }

        @Override
        public final imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteMatch getMatch() {
            return this.match;
        }

        @Override
        public final imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteRetryPolicy getRetryPolicy() {
            return this.retryPolicy;
        }

        @Override
        public final imports.aws.appmesh_route.AppmeshRouteSpecHttp2RouteTimeout getTimeout() {
            return this.timeout;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("action", om.valueToTree(this.getAction()));
            data.set("match", om.valueToTree(this.getMatch()));
            if (this.getRetryPolicy() != null) {
                data.set("retryPolicy", om.valueToTree(this.getRetryPolicy()));
            }
            if (this.getTimeout() != null) {
                data.set("timeout", om.valueToTree(this.getTimeout()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshRoute.AppmeshRouteSpecHttp2Route"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshRouteSpecHttp2Route.Jsii$Proxy that = (AppmeshRouteSpecHttp2Route.Jsii$Proxy) o;

            if (!action.equals(that.action)) return false;
            if (!match.equals(that.match)) return false;
            if (this.retryPolicy != null ? !this.retryPolicy.equals(that.retryPolicy) : that.retryPolicy != null) return false;
            return this.timeout != null ? this.timeout.equals(that.timeout) : that.timeout == null;
        }

        @Override
        public final int hashCode() {
            int result = this.action.hashCode();
            result = 31 * result + (this.match.hashCode());
            result = 31 * result + (this.retryPolicy != null ? this.retryPolicy.hashCode() : 0);
            result = 31 * result + (this.timeout != null ? this.timeout.hashCode() : 0);
            return result;
        }
    }
}
