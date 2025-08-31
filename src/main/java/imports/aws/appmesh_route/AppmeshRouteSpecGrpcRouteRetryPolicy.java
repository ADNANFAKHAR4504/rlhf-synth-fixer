package imports.aws.appmesh_route;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.029Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshRoute.AppmeshRouteSpecGrpcRouteRetryPolicy")
@software.amazon.jsii.Jsii.Proxy(AppmeshRouteSpecGrpcRouteRetryPolicy.Jsii$Proxy.class)
public interface AppmeshRouteSpecGrpcRouteRetryPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#max_retries AppmeshRoute#max_retries}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxRetries();

    /**
     * per_retry_timeout block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#per_retry_timeout AppmeshRoute#per_retry_timeout}
     */
    @org.jetbrains.annotations.NotNull imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteRetryPolicyPerRetryTimeout getPerRetryTimeout();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#grpc_retry_events AppmeshRoute#grpc_retry_events}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGrpcRetryEvents() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#http_retry_events AppmeshRoute#http_retry_events}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHttpRetryEvents() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#tcp_retry_events AppmeshRoute#tcp_retry_events}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTcpRetryEvents() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshRouteSpecGrpcRouteRetryPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshRouteSpecGrpcRouteRetryPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshRouteSpecGrpcRouteRetryPolicy> {
        java.lang.Number maxRetries;
        imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteRetryPolicyPerRetryTimeout perRetryTimeout;
        java.util.List<java.lang.String> grpcRetryEvents;
        java.util.List<java.lang.String> httpRetryEvents;
        java.util.List<java.lang.String> tcpRetryEvents;

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteRetryPolicy#getMaxRetries}
         * @param maxRetries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#max_retries AppmeshRoute#max_retries}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxRetries(java.lang.Number maxRetries) {
            this.maxRetries = maxRetries;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteRetryPolicy#getPerRetryTimeout}
         * @param perRetryTimeout per_retry_timeout block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#per_retry_timeout AppmeshRoute#per_retry_timeout}
         * @return {@code this}
         */
        public Builder perRetryTimeout(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteRetryPolicyPerRetryTimeout perRetryTimeout) {
            this.perRetryTimeout = perRetryTimeout;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteRetryPolicy#getGrpcRetryEvents}
         * @param grpcRetryEvents Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#grpc_retry_events AppmeshRoute#grpc_retry_events}.
         * @return {@code this}
         */
        public Builder grpcRetryEvents(java.util.List<java.lang.String> grpcRetryEvents) {
            this.grpcRetryEvents = grpcRetryEvents;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteRetryPolicy#getHttpRetryEvents}
         * @param httpRetryEvents Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#http_retry_events AppmeshRoute#http_retry_events}.
         * @return {@code this}
         */
        public Builder httpRetryEvents(java.util.List<java.lang.String> httpRetryEvents) {
            this.httpRetryEvents = httpRetryEvents;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshRouteSpecGrpcRouteRetryPolicy#getTcpRetryEvents}
         * @param tcpRetryEvents Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_route#tcp_retry_events AppmeshRoute#tcp_retry_events}.
         * @return {@code this}
         */
        public Builder tcpRetryEvents(java.util.List<java.lang.String> tcpRetryEvents) {
            this.tcpRetryEvents = tcpRetryEvents;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshRouteSpecGrpcRouteRetryPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshRouteSpecGrpcRouteRetryPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshRouteSpecGrpcRouteRetryPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshRouteSpecGrpcRouteRetryPolicy {
        private final java.lang.Number maxRetries;
        private final imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteRetryPolicyPerRetryTimeout perRetryTimeout;
        private final java.util.List<java.lang.String> grpcRetryEvents;
        private final java.util.List<java.lang.String> httpRetryEvents;
        private final java.util.List<java.lang.String> tcpRetryEvents;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxRetries = software.amazon.jsii.Kernel.get(this, "maxRetries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.perRetryTimeout = software.amazon.jsii.Kernel.get(this, "perRetryTimeout", software.amazon.jsii.NativeType.forClass(imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteRetryPolicyPerRetryTimeout.class));
            this.grpcRetryEvents = software.amazon.jsii.Kernel.get(this, "grpcRetryEvents", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.httpRetryEvents = software.amazon.jsii.Kernel.get(this, "httpRetryEvents", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tcpRetryEvents = software.amazon.jsii.Kernel.get(this, "tcpRetryEvents", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxRetries = java.util.Objects.requireNonNull(builder.maxRetries, "maxRetries is required");
            this.perRetryTimeout = java.util.Objects.requireNonNull(builder.perRetryTimeout, "perRetryTimeout is required");
            this.grpcRetryEvents = builder.grpcRetryEvents;
            this.httpRetryEvents = builder.httpRetryEvents;
            this.tcpRetryEvents = builder.tcpRetryEvents;
        }

        @Override
        public final java.lang.Number getMaxRetries() {
            return this.maxRetries;
        }

        @Override
        public final imports.aws.appmesh_route.AppmeshRouteSpecGrpcRouteRetryPolicyPerRetryTimeout getPerRetryTimeout() {
            return this.perRetryTimeout;
        }

        @Override
        public final java.util.List<java.lang.String> getGrpcRetryEvents() {
            return this.grpcRetryEvents;
        }

        @Override
        public final java.util.List<java.lang.String> getHttpRetryEvents() {
            return this.httpRetryEvents;
        }

        @Override
        public final java.util.List<java.lang.String> getTcpRetryEvents() {
            return this.tcpRetryEvents;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxRetries", om.valueToTree(this.getMaxRetries()));
            data.set("perRetryTimeout", om.valueToTree(this.getPerRetryTimeout()));
            if (this.getGrpcRetryEvents() != null) {
                data.set("grpcRetryEvents", om.valueToTree(this.getGrpcRetryEvents()));
            }
            if (this.getHttpRetryEvents() != null) {
                data.set("httpRetryEvents", om.valueToTree(this.getHttpRetryEvents()));
            }
            if (this.getTcpRetryEvents() != null) {
                data.set("tcpRetryEvents", om.valueToTree(this.getTcpRetryEvents()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshRoute.AppmeshRouteSpecGrpcRouteRetryPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshRouteSpecGrpcRouteRetryPolicy.Jsii$Proxy that = (AppmeshRouteSpecGrpcRouteRetryPolicy.Jsii$Proxy) o;

            if (!maxRetries.equals(that.maxRetries)) return false;
            if (!perRetryTimeout.equals(that.perRetryTimeout)) return false;
            if (this.grpcRetryEvents != null ? !this.grpcRetryEvents.equals(that.grpcRetryEvents) : that.grpcRetryEvents != null) return false;
            if (this.httpRetryEvents != null ? !this.httpRetryEvents.equals(that.httpRetryEvents) : that.httpRetryEvents != null) return false;
            return this.tcpRetryEvents != null ? this.tcpRetryEvents.equals(that.tcpRetryEvents) : that.tcpRetryEvents == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxRetries.hashCode();
            result = 31 * result + (this.perRetryTimeout.hashCode());
            result = 31 * result + (this.grpcRetryEvents != null ? this.grpcRetryEvents.hashCode() : 0);
            result = 31 * result + (this.httpRetryEvents != null ? this.httpRetryEvents.hashCode() : 0);
            result = 31 * result + (this.tcpRetryEvents != null ? this.tcpRetryEvents.hashCode() : 0);
            return result;
        }
    }
}
