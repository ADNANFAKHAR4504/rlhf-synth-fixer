package imports.aws.appmesh_virtual_node;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.048Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appmeshVirtualNode.AppmeshVirtualNodeSpecServiceDiscoveryDns")
@software.amazon.jsii.Jsii.Proxy(AppmeshVirtualNodeSpecServiceDiscoveryDns.Jsii$Proxy.class)
public interface AppmeshVirtualNodeSpecServiceDiscoveryDns extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#hostname AppmeshVirtualNode#hostname}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHostname();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#ip_preference AppmeshVirtualNode#ip_preference}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpPreference() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#response_type AppmeshVirtualNode#response_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResponseType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppmeshVirtualNodeSpecServiceDiscoveryDns}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppmeshVirtualNodeSpecServiceDiscoveryDns}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppmeshVirtualNodeSpecServiceDiscoveryDns> {
        java.lang.String hostname;
        java.lang.String ipPreference;
        java.lang.String responseType;

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecServiceDiscoveryDns#getHostname}
         * @param hostname Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#hostname AppmeshVirtualNode#hostname}. This parameter is required.
         * @return {@code this}
         */
        public Builder hostname(java.lang.String hostname) {
            this.hostname = hostname;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecServiceDiscoveryDns#getIpPreference}
         * @param ipPreference Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#ip_preference AppmeshVirtualNode#ip_preference}.
         * @return {@code this}
         */
        public Builder ipPreference(java.lang.String ipPreference) {
            this.ipPreference = ipPreference;
            return this;
        }

        /**
         * Sets the value of {@link AppmeshVirtualNodeSpecServiceDiscoveryDns#getResponseType}
         * @param responseType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appmesh_virtual_node#response_type AppmeshVirtualNode#response_type}.
         * @return {@code this}
         */
        public Builder responseType(java.lang.String responseType) {
            this.responseType = responseType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppmeshVirtualNodeSpecServiceDiscoveryDns}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppmeshVirtualNodeSpecServiceDiscoveryDns build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppmeshVirtualNodeSpecServiceDiscoveryDns}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppmeshVirtualNodeSpecServiceDiscoveryDns {
        private final java.lang.String hostname;
        private final java.lang.String ipPreference;
        private final java.lang.String responseType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hostname = software.amazon.jsii.Kernel.get(this, "hostname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipPreference = software.amazon.jsii.Kernel.get(this, "ipPreference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.responseType = software.amazon.jsii.Kernel.get(this, "responseType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hostname = java.util.Objects.requireNonNull(builder.hostname, "hostname is required");
            this.ipPreference = builder.ipPreference;
            this.responseType = builder.responseType;
        }

        @Override
        public final java.lang.String getHostname() {
            return this.hostname;
        }

        @Override
        public final java.lang.String getIpPreference() {
            return this.ipPreference;
        }

        @Override
        public final java.lang.String getResponseType() {
            return this.responseType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("hostname", om.valueToTree(this.getHostname()));
            if (this.getIpPreference() != null) {
                data.set("ipPreference", om.valueToTree(this.getIpPreference()));
            }
            if (this.getResponseType() != null) {
                data.set("responseType", om.valueToTree(this.getResponseType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appmeshVirtualNode.AppmeshVirtualNodeSpecServiceDiscoveryDns"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppmeshVirtualNodeSpecServiceDiscoveryDns.Jsii$Proxy that = (AppmeshVirtualNodeSpecServiceDiscoveryDns.Jsii$Proxy) o;

            if (!hostname.equals(that.hostname)) return false;
            if (this.ipPreference != null ? !this.ipPreference.equals(that.ipPreference) : that.ipPreference != null) return false;
            return this.responseType != null ? this.responseType.equals(that.responseType) : that.responseType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hostname.hashCode();
            result = 31 * result + (this.ipPreference != null ? this.ipPreference.hashCode() : 0);
            result = 31 * result + (this.responseType != null ? this.responseType.hashCode() : 0);
            return result;
        }
    }
}
