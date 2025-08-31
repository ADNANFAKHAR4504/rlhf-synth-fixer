package imports.aws.appstream_stack;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.062Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamStack.AppstreamStackStorageConnectors")
@software.amazon.jsii.Jsii.Proxy(AppstreamStackStorageConnectors.Jsii$Proxy.class)
public interface AppstreamStackStorageConnectors extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#connector_type AppstreamStack#connector_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConnectorType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#domains AppstreamStack#domains}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDomains() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#resource_identifier AppstreamStack#resource_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceIdentifier() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppstreamStackStorageConnectors}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppstreamStackStorageConnectors}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppstreamStackStorageConnectors> {
        java.lang.String connectorType;
        java.util.List<java.lang.String> domains;
        java.lang.String resourceIdentifier;

        /**
         * Sets the value of {@link AppstreamStackStorageConnectors#getConnectorType}
         * @param connectorType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#connector_type AppstreamStack#connector_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder connectorType(java.lang.String connectorType) {
            this.connectorType = connectorType;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackStorageConnectors#getDomains}
         * @param domains Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#domains AppstreamStack#domains}.
         * @return {@code this}
         */
        public Builder domains(java.util.List<java.lang.String> domains) {
            this.domains = domains;
            return this;
        }

        /**
         * Sets the value of {@link AppstreamStackStorageConnectors#getResourceIdentifier}
         * @param resourceIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#resource_identifier AppstreamStack#resource_identifier}.
         * @return {@code this}
         */
        public Builder resourceIdentifier(java.lang.String resourceIdentifier) {
            this.resourceIdentifier = resourceIdentifier;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppstreamStackStorageConnectors}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppstreamStackStorageConnectors build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppstreamStackStorageConnectors}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppstreamStackStorageConnectors {
        private final java.lang.String connectorType;
        private final java.util.List<java.lang.String> domains;
        private final java.lang.String resourceIdentifier;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.connectorType = software.amazon.jsii.Kernel.get(this, "connectorType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domains = software.amazon.jsii.Kernel.get(this, "domains", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.resourceIdentifier = software.amazon.jsii.Kernel.get(this, "resourceIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.connectorType = java.util.Objects.requireNonNull(builder.connectorType, "connectorType is required");
            this.domains = builder.domains;
            this.resourceIdentifier = builder.resourceIdentifier;
        }

        @Override
        public final java.lang.String getConnectorType() {
            return this.connectorType;
        }

        @Override
        public final java.util.List<java.lang.String> getDomains() {
            return this.domains;
        }

        @Override
        public final java.lang.String getResourceIdentifier() {
            return this.resourceIdentifier;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("connectorType", om.valueToTree(this.getConnectorType()));
            if (this.getDomains() != null) {
                data.set("domains", om.valueToTree(this.getDomains()));
            }
            if (this.getResourceIdentifier() != null) {
                data.set("resourceIdentifier", om.valueToTree(this.getResourceIdentifier()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appstreamStack.AppstreamStackStorageConnectors"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppstreamStackStorageConnectors.Jsii$Proxy that = (AppstreamStackStorageConnectors.Jsii$Proxy) o;

            if (!connectorType.equals(that.connectorType)) return false;
            if (this.domains != null ? !this.domains.equals(that.domains) : that.domains != null) return false;
            return this.resourceIdentifier != null ? this.resourceIdentifier.equals(that.resourceIdentifier) : that.resourceIdentifier == null;
        }

        @Override
        public final int hashCode() {
            int result = this.connectorType.hashCode();
            result = 31 * result + (this.domains != null ? this.domains.hashCode() : 0);
            result = 31 * result + (this.resourceIdentifier != null ? this.resourceIdentifier.hashCode() : 0);
            return result;
        }
    }
}
