package imports.aws.appmesh_mesh;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.026Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshMesh.AppmeshMeshSpecServiceDiscovery")
@software.amazon.jsii.Jsii.Proxy(AppmeshMeshSpecServiceDiscovery.Jsii$Proxy.class)
public interface AppmeshMeshSpecServiceDiscovery extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_mesh#ip_preference AppmeshMesh#ip_preference}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpPreference() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshMeshSpecServiceDiscovery}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshMeshSpecServiceDiscovery}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshMeshSpecServiceDiscovery> {
        java.lang.String ipPreference;

        /**
         * Sets the value of {@link AppmeshMeshSpecServiceDiscovery#getIpPreference}
         * @param ipPreference Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_mesh#ip_preference AppmeshMesh#ip_preference}.
         * @return {@code this}
         */
        public Builder ipPreference(java.lang.String ipPreference) {
            this.ipPreference = ipPreference;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshMeshSpecServiceDiscovery}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshMeshSpecServiceDiscovery build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshMeshSpecServiceDiscovery}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshMeshSpecServiceDiscovery {
        private final java.lang.String ipPreference;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ipPreference = software.amazon.jsii.Kernel.get(this, "ipPreference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ipPreference = builder.ipPreference;
        }

        @Override
        public final java.lang.String getIpPreference() {
            return this.ipPreference;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIpPreference() != null) {
                data.set("ipPreference", om.valueToTree(this.getIpPreference()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshMesh.AppmeshMeshSpecServiceDiscovery"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshMeshSpecServiceDiscovery.Jsii$Proxy that = (AppmeshMeshSpecServiceDiscovery.Jsii$Proxy) o;

            return this.ipPreference != null ? this.ipPreference.equals(that.ipPreference) : that.ipPreference == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ipPreference != null ? this.ipPreference.hashCode() : 0;
            return result;
        }
    }
}
