package imports.aws.datasync_location_azure_blob;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.944Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationAzureBlob.DatasyncLocationAzureBlobSasConfiguration")
@software.amazon.jsii.Jsii.Proxy(DatasyncLocationAzureBlobSasConfiguration.Jsii$Proxy.class)
public interface DatasyncLocationAzureBlobSasConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#token DatasyncLocationAzureBlob#token}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getToken();

    /**
     * @return a {@link Builder} of {@link DatasyncLocationAzureBlobSasConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncLocationAzureBlobSasConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncLocationAzureBlobSasConfiguration> {
        java.lang.String token;

        /**
         * Sets the value of {@link DatasyncLocationAzureBlobSasConfiguration#getToken}
         * @param token Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_azure_blob#token DatasyncLocationAzureBlob#token}. This parameter is required.
         * @return {@code this}
         */
        public Builder token(java.lang.String token) {
            this.token = token;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncLocationAzureBlobSasConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncLocationAzureBlobSasConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncLocationAzureBlobSasConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncLocationAzureBlobSasConfiguration {
        private final java.lang.String token;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.token = software.amazon.jsii.Kernel.get(this, "token", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.token = java.util.Objects.requireNonNull(builder.token, "token is required");
        }

        @Override
        public final java.lang.String getToken() {
            return this.token;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("token", om.valueToTree(this.getToken()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncLocationAzureBlob.DatasyncLocationAzureBlobSasConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncLocationAzureBlobSasConfiguration.Jsii$Proxy that = (DatasyncLocationAzureBlobSasConfiguration.Jsii$Proxy) o;

            return this.token.equals(that.token);
        }

        @Override
        public final int hashCode() {
            int result = this.token.hashCode();
            return result;
        }
    }
}
