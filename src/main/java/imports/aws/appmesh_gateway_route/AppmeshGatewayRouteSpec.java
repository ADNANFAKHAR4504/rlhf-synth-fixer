package imports.aws.appmesh_gateway_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.021Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshGatewayRoute.AppmeshGatewayRouteSpec")
@software.amazon.jsii.Jsii.Proxy(AppmeshGatewayRouteSpec.Jsii$Proxy.class)
public interface AppmeshGatewayRouteSpec extends software.amazon.jsii.JsiiSerializable {

    /**
     * grpc_route block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#grpc_route AppmeshGatewayRoute#grpc_route}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecGrpcRoute getGrpcRoute() {
        return null;
    }

    /**
     * http2_route block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#http2_route AppmeshGatewayRoute#http2_route}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2Route getHttp2Route() {
        return null;
    }

    /**
     * http_route block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#http_route AppmeshGatewayRoute#http_route}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttpRoute getHttpRoute() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#priority AppmeshGatewayRoute#priority}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPriority() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshGatewayRouteSpec}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshGatewayRouteSpec}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshGatewayRouteSpec> {
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecGrpcRoute grpcRoute;
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2Route http2Route;
        imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttpRoute httpRoute;
        java.lang.Number priority;

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpec#getGrpcRoute}
         * @param grpcRoute grpc_route block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#grpc_route AppmeshGatewayRoute#grpc_route}
         * @return {@code this}
         */
        public Builder grpcRoute(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecGrpcRoute grpcRoute) {
            this.grpcRoute = grpcRoute;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpec#getHttp2Route}
         * @param http2Route http2_route block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#http2_route AppmeshGatewayRoute#http2_route}
         * @return {@code this}
         */
        public Builder http2Route(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2Route http2Route) {
            this.http2Route = http2Route;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpec#getHttpRoute}
         * @param httpRoute http_route block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#http_route AppmeshGatewayRoute#http_route}
         * @return {@code this}
         */
        public Builder httpRoute(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttpRoute httpRoute) {
            this.httpRoute = httpRoute;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshGatewayRouteSpec#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_gateway_route#priority AppmeshGatewayRoute#priority}.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshGatewayRouteSpec}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshGatewayRouteSpec build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshGatewayRouteSpec}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshGatewayRouteSpec {
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecGrpcRoute grpcRoute;
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2Route http2Route;
        private final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttpRoute httpRoute;
        private final java.lang.Number priority;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.grpcRoute = software.amazon.jsii.Kernel.get(this, "grpcRoute", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecGrpcRoute.class));
            this.http2Route = software.amazon.jsii.Kernel.get(this, "http2Route", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2Route.class));
            this.httpRoute = software.amazon.jsii.Kernel.get(this, "httpRoute", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttpRoute.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.grpcRoute = builder.grpcRoute;
            this.http2Route = builder.http2Route;
            this.httpRoute = builder.httpRoute;
            this.priority = builder.priority;
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecGrpcRoute getGrpcRoute() {
            return this.grpcRoute;
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttp2Route getHttp2Route() {
            return this.http2Route;
        }

        @Override
        public final imports.aws.appmesh_gateway_route.AppmeshGatewayRouteSpecHttpRoute getHttpRoute() {
            return this.httpRoute;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGrpcRoute() != null) {
                data.set("grpcRoute", om.valueToTree(this.getGrpcRoute()));
            }
            if (this.getHttp2Route() != null) {
                data.set("http2Route", om.valueToTree(this.getHttp2Route()));
            }
            if (this.getHttpRoute() != null) {
                data.set("httpRoute", om.valueToTree(this.getHttpRoute()));
            }
            if (this.getPriority() != null) {
                data.set("priority", om.valueToTree(this.getPriority()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshGatewayRoute.AppmeshGatewayRouteSpec"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshGatewayRouteSpec.Jsii$Proxy that = (AppmeshGatewayRouteSpec.Jsii$Proxy) o;

            if (this.grpcRoute != null ? !this.grpcRoute.equals(that.grpcRoute) : that.grpcRoute != null) return false;
            if (this.http2Route != null ? !this.http2Route.equals(that.http2Route) : that.http2Route != null) return false;
            if (this.httpRoute != null ? !this.httpRoute.equals(that.httpRoute) : that.httpRoute != null) return false;
            return this.priority != null ? this.priority.equals(that.priority) : that.priority == null;
        }

        @Override
        public final int hashCode() {
            int result = this.grpcRoute != null ? this.grpcRoute.hashCode() : 0;
            result = 31 * result + (this.http2Route != null ? this.http2Route.hashCode() : 0);
            result = 31 * result + (this.httpRoute != null ? this.httpRoute.hashCode() : 0);
            result = 31 * result + (this.priority != null ? this.priority.hashCode() : 0);
            return result;
        }
    }
}
