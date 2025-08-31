package imports.aws.s3_control_storage_lens_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.286Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationExclude")
@software.amazon.jsii.Jsii.Proxy(S3ControlStorageLensConfigurationStorageLensConfigurationExclude.Jsii$Proxy.class)
public interface S3ControlStorageLensConfigurationStorageLensConfigurationExclude extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#buckets S3ControlStorageLensConfiguration#buckets}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getBuckets() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#regions S3ControlStorageLensConfiguration#regions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlStorageLensConfigurationStorageLensConfigurationExclude}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlStorageLensConfigurationStorageLensConfigurationExclude}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlStorageLensConfigurationStorageLensConfigurationExclude> {
        java.util.List<java.lang.String> buckets;
        java.util.List<java.lang.String> regions;

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationExclude#getBuckets}
         * @param buckets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#buckets S3ControlStorageLensConfiguration#buckets}.
         * @return {@code this}
         */
        public Builder buckets(java.util.List<java.lang.String> buckets) {
            this.buckets = buckets;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationExclude#getRegions}
         * @param regions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#regions S3ControlStorageLensConfiguration#regions}.
         * @return {@code this}
         */
        public Builder regions(java.util.List<java.lang.String> regions) {
            this.regions = regions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlStorageLensConfigurationStorageLensConfigurationExclude}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlStorageLensConfigurationStorageLensConfigurationExclude build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlStorageLensConfigurationStorageLensConfigurationExclude}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlStorageLensConfigurationStorageLensConfigurationExclude {
        private final java.util.List<java.lang.String> buckets;
        private final java.util.List<java.lang.String> regions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.buckets = software.amazon.jsii.Kernel.get(this, "buckets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.regions = software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.buckets = builder.buckets;
            this.regions = builder.regions;
        }

        @Override
        public final java.util.List<java.lang.String> getBuckets() {
            return this.buckets;
        }

        @Override
        public final java.util.List<java.lang.String> getRegions() {
            return this.regions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBuckets() != null) {
                data.set("buckets", om.valueToTree(this.getBuckets()));
            }
            if (this.getRegions() != null) {
                data.set("regions", om.valueToTree(this.getRegions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationExclude"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlStorageLensConfigurationStorageLensConfigurationExclude.Jsii$Proxy that = (S3ControlStorageLensConfigurationStorageLensConfigurationExclude.Jsii$Proxy) o;

            if (this.buckets != null ? !this.buckets.equals(that.buckets) : that.buckets != null) return false;
            return this.regions != null ? this.regions.equals(that.regions) : that.regions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.buckets != null ? this.buckets.hashCode() : 0;
            result = 31 * result + (this.regions != null ? this.regions.hashCode() : 0);
            return result;
        }
    }
}
