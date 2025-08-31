package imports.aws.appmesh_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.033Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshRoute.AppmeshRouteSpecHttpRouteTimeout")
@software.amazon.jsii.Jsii.Proxy(AppmeshRouteSpecHttpRouteTimeout.Jsii$Proxy.class)
public interface AppmeshRouteSpecHttpRouteTimeout extends software.amazon.jsii.JsiiSerializable {

    /**
     * idle block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#idle AppmeshRoute#idle}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteTimeoutIdle getIdle() {
        return null;
    }

    /**
     * per_request block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#per_request AppmeshRoute#per_request}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteTimeoutPerRequest getPerRequest() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshRouteSpecHttpRouteTimeout}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshRouteSpecHttpRouteTimeout}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshRouteSpecHttpRouteTimeout> {
        imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteTimeoutIdle idle;
        imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteTimeoutPerRequest perRequest;

        /**
         * Sets the value of {@link AppmeshRouteSpecHttpRouteTimeout#getIdle}
         * @param idle idle block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#idle AppmeshRoute#idle}
         * @return {@code this}
         */
        public Builder idle(imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteTimeoutIdle idle) {
            this.idle = idle;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecHttpRouteTimeout#getPerRequest}
         * @param perRequest per_request block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#per_request AppmeshRoute#per_request}
         * @return {@code this}
         */
        public Builder perRequest(imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteTimeoutPerRequest perRequest) {
            this.perRequest = perRequest;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshRouteSpecHttpRouteTimeout}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshRouteSpecHttpRouteTimeout build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshRouteSpecHttpRouteTimeout}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshRouteSpecHttpRouteTimeout {
        private final imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteTimeoutIdle idle;
        private final imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteTimeoutPerRequest perRequest;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.idle = software.amazon.jsii.Kernel.get(this, "idle", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteTimeoutIdle.class));
            this.perRequest = software.amazon.jsii.Kernel.get(this, "perRequest", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteTimeoutPerRequest.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.idle = builder.idle;
            this.perRequest = builder.perRequest;
        }

        @Override
        public final imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteTimeoutIdle getIdle() {
            return this.idle;
        }

        @Override
        public final imports.aws.appmesh_route.AppmeshRouteSpecHttpRouteTimeoutPerRequest getPerRequest() {
            return this.perRequest;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIdle() != null) {
                data.set("idle", om.valueToTree(this.getIdle()));
            }
            if (this.getPerRequest() != null) {
                data.set("perRequest", om.valueToTree(this.getPerRequest()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshRoute.AppmeshRouteSpecHttpRouteTimeout"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshRouteSpecHttpRouteTimeout.Jsii$Proxy that = (AppmeshRouteSpecHttpRouteTimeout.Jsii$Proxy) o;

            if (this.idle != null ? !this.idle.equals(that.idle) : that.idle != null) return false;
            return this.perRequest != null ? this.perRequest.equals(that.perRequest) : that.perRequest == null;
        }

        @Override
        public final int hashCode() {
            int result = this.idle != null ? this.idle.hashCode() : 0;
            result = 31 * result + (this.perRequest != null ? this.perRequest.hashCode() : 0);
            return result;
        }
    }
}
