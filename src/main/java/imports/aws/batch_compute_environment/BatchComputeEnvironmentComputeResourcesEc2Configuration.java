package imports.aws.batch_compute_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.128Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchComputeEnvironment.BatchComputeEnvironmentComputeResourcesEc2Configuration")
@software.amazon.jsii.Jsii.Proxy(BatchComputeEnvironmentComputeResourcesEc2Configuration.Jsii$Proxy.class)
public interface BatchComputeEnvironmentComputeResourcesEc2Configuration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#image_id_override BatchComputeEnvironment#image_id_override}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageIdOverride() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#image_type BatchComputeEnvironment#image_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BatchComputeEnvironmentComputeResourcesEc2Configuration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BatchComputeEnvironmentComputeResourcesEc2Configuration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BatchComputeEnvironmentComputeResourcesEc2Configuration> {
        java.lang.String imageIdOverride;
        java.lang.String imageType;

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResourcesEc2Configuration#getImageIdOverride}
         * @param imageIdOverride Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#image_id_override BatchComputeEnvironment#image_id_override}.
         * @return {@code this}
         */
        public Builder imageIdOverride(java.lang.String imageIdOverride) {
            this.imageIdOverride = imageIdOverride;
            return this;
        }

        /**
         * Sets the value of {@link BatchComputeEnvironmentComputeResourcesEc2Configuration#getImageType}
         * @param imageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/batch_compute_environment#image_type BatchComputeEnvironment#image_type}.
         * @return {@code this}
         */
        public Builder imageType(java.lang.String imageType) {
            this.imageType = imageType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BatchComputeEnvironmentComputeResourcesEc2Configuration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BatchComputeEnvironmentComputeResourcesEc2Configuration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BatchComputeEnvironmentComputeResourcesEc2Configuration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BatchComputeEnvironmentComputeResourcesEc2Configuration {
        private final java.lang.String imageIdOverride;
        private final java.lang.String imageType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.imageIdOverride = software.amazon.jsii.Kernel.get(this, "imageIdOverride", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.imageType = software.amazon.jsii.Kernel.get(this, "imageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.imageIdOverride = builder.imageIdOverride;
            this.imageType = builder.imageType;
        }

        @Override
        public final java.lang.String getImageIdOverride() {
            return this.imageIdOverride;
        }

        @Override
        public final java.lang.String getImageType() {
            return this.imageType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getImageIdOverride() != null) {
                data.set("imageIdOverride", om.valueToTree(this.getImageIdOverride()));
            }
            if (this.getImageType() != null) {
                data.set("imageType", om.valueToTree(this.getImageType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.batchComputeEnvironment.BatchComputeEnvironmentComputeResourcesEc2Configuration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BatchComputeEnvironmentComputeResourcesEc2Configuration.Jsii$Proxy that = (BatchComputeEnvironmentComputeResourcesEc2Configuration.Jsii$Proxy) o;

            if (this.imageIdOverride != null ? !this.imageIdOverride.equals(that.imageIdOverride) : that.imageIdOverride != null) return false;
            return this.imageType != null ? this.imageType.equals(that.imageType) : that.imageType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.imageIdOverride != null ? this.imageIdOverride.hashCode() : 0;
            result = 31 * result + (this.imageType != null ? this.imageType.hashCode() : 0);
            return result;
        }
    }
}
