package imports.aws.appstream_image_builder;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.060Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamImageBuilder.AppstreamImageBuilderAccessEndpoint")
@software.amazon.jsii.Jsii.Proxy(AppstreamImageBuilderAccessEndpoint.Jsii$Proxy.class)
public interface AppstreamImageBuilderAccessEndpoint extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#endpoint_type AppstreamImageBuilder#endpoint_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndpointType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#vpce_id AppstreamImageBuilder#vpce_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpceId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppstreamImageBuilderAccessEndpoint}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppstreamImageBuilderAccessEndpoint}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppstreamImageBuilderAccessEndpoint> {
        java.lang.String endpointType;
        java.lang.String vpceId;

        /**
         * Sets the value of {@link AppstreamImageBuilderAccessEndpoint#getEndpointType}
         * @param endpointType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#endpoint_type AppstreamImageBuilder#endpoint_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder endpointType(java.lang.String endpointType) {
            this.endpointType = endpointType;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamImageBuilderAccessEndpoint#getVpceId}
         * @param vpceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_image_builder#vpce_id AppstreamImageBuilder#vpce_id}.
         * @return {@code this}
         */
        public Builder vpceId(java.lang.String vpceId) {
            this.vpceId = vpceId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppstreamImageBuilderAccessEndpoint}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppstreamImageBuilderAccessEndpoint build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppstreamImageBuilderAccessEndpoint}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppstreamImageBuilderAccessEndpoint {
        private final java.lang.String endpointType;
        private final java.lang.String vpceId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.endpointType = software.amazon.jsii.Kernel.get(this, "endpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpceId = software.amazon.jsii.Kernel.get(this, "vpceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.endpointType = java.util.Objects.requireNonNull(builder.endpointType, "endpointType is required");
            this.vpceId = builder.vpceId;
        }

        @Override
        public final java.lang.String getEndpointType() {
            return this.endpointType;
        }

        @Override
        public final java.lang.String getVpceId() {
            return this.vpceId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("endpointType", om.valueToTree(this.getEndpointType()));
            if (this.getVpceId() != null) {
                data.set("vpceId", om.valueToTree(this.getVpceId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appstreamImageBuilder.AppstreamImageBuilderAccessEndpoint"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppstreamImageBuilderAccessEndpoint.Jsii$Proxy that = (AppstreamImageBuilderAccessEndpoint.Jsii$Proxy) o;

            if (!endpointType.equals(that.endpointType)) return false;
            return this.vpceId != null ? this.vpceId.equals(that.vpceId) : that.vpceId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.endpointType.hashCode();
            result = 31 * result + (this.vpceId != null ? this.vpceId.hashCode() : 0);
            return result;
        }
    }
}
