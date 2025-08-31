package imports.aws.transfer_server;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.564Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferServer.TransferServerS3StorageOptions")
@software.amazon.jsii.Jsii.Proxy(TransferServerS3StorageOptions.Jsii$Proxy.class)
public interface TransferServerS3StorageOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#directory_listing_optimization TransferServer#directory_listing_optimization}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDirectoryListingOptimization() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferServerS3StorageOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferServerS3StorageOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferServerS3StorageOptions> {
        java.lang.String directoryListingOptimization;

        /**
         * Sets the value of {@link TransferServerS3StorageOptions#getDirectoryListingOptimization}
         * @param directoryListingOptimization Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#directory_listing_optimization TransferServer#directory_listing_optimization}.
         * @return {@code this}
         */
        public Builder directoryListingOptimization(java.lang.String directoryListingOptimization) {
            this.directoryListingOptimization = directoryListingOptimization;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferServerS3StorageOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferServerS3StorageOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferServerS3StorageOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferServerS3StorageOptions {
        private final java.lang.String directoryListingOptimization;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.directoryListingOptimization = software.amazon.jsii.Kernel.get(this, "directoryListingOptimization", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.directoryListingOptimization = builder.directoryListingOptimization;
        }

        @Override
        public final java.lang.String getDirectoryListingOptimization() {
            return this.directoryListingOptimization;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDirectoryListingOptimization() != null) {
                data.set("directoryListingOptimization", om.valueToTree(this.getDirectoryListingOptimization()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferServer.TransferServerS3StorageOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferServerS3StorageOptions.Jsii$Proxy that = (TransferServerS3StorageOptions.Jsii$Proxy) o;

            return this.directoryListingOptimization != null ? this.directoryListingOptimization.equals(that.directoryListingOptimization) : that.directoryListingOptimization == null;
        }

        @Override
        public final int hashCode() {
            int result = this.directoryListingOptimization != null ? this.directoryListingOptimization.hashCode() : 0;
            return result;
        }
    }
}
