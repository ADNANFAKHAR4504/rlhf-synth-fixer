package imports.aws.fsx_file_cache;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.245Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxFileCache.FsxFileCacheLustreConfigurationMetadataConfiguration")
@software.amazon.jsii.Jsii.Proxy(FsxFileCacheLustreConfigurationMetadataConfiguration.Jsii$Proxy.class)
public interface FsxFileCacheLustreConfigurationMetadataConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#storage_capacity FsxFileCache#storage_capacity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getStorageCapacity();

    /**
     * @return a {@link Builder} of {@link FsxFileCacheLustreConfigurationMetadataConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxFileCacheLustreConfigurationMetadataConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxFileCacheLustreConfigurationMetadataConfiguration> {
        java.lang.Number storageCapacity;

        /**
         * Sets the value of {@link FsxFileCacheLustreConfigurationMetadataConfiguration#getStorageCapacity}
         * @param storageCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_file_cache#storage_capacity FsxFileCache#storage_capacity}. This parameter is required.
         * @return {@code this}
         */
        public Builder storageCapacity(java.lang.Number storageCapacity) {
            this.storageCapacity = storageCapacity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxFileCacheLustreConfigurationMetadataConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxFileCacheLustreConfigurationMetadataConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxFileCacheLustreConfigurationMetadataConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxFileCacheLustreConfigurationMetadataConfiguration {
        private final java.lang.Number storageCapacity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.storageCapacity = software.amazon.jsii.Kernel.get(this, "storageCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.storageCapacity = java.util.Objects.requireNonNull(builder.storageCapacity, "storageCapacity is required");
        }

        @Override
        public final java.lang.Number getStorageCapacity() {
            return this.storageCapacity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("storageCapacity", om.valueToTree(this.getStorageCapacity()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxFileCache.FsxFileCacheLustreConfigurationMetadataConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxFileCacheLustreConfigurationMetadataConfiguration.Jsii$Proxy that = (FsxFileCacheLustreConfigurationMetadataConfiguration.Jsii$Proxy) o;

            return this.storageCapacity.equals(that.storageCapacity);
        }

        @Override
        public final int hashCode() {
            int result = this.storageCapacity.hashCode();
            return result;
        }
    }
}
