package imports.aws.evidently_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyProject.EvidentlyProjectDataDeliveryS3Destination")
@software.amazon.jsii.Jsii.Proxy(EvidentlyProjectDataDeliveryS3Destination.Jsii$Proxy.class)
public interface EvidentlyProjectDataDeliveryS3Destination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_project#bucket EvidentlyProject#bucket}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucket() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_project#prefix EvidentlyProject#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EvidentlyProjectDataDeliveryS3Destination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EvidentlyProjectDataDeliveryS3Destination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EvidentlyProjectDataDeliveryS3Destination> {
        java.lang.String bucket;
        java.lang.String prefix;

        /**
         * Sets the value of {@link EvidentlyProjectDataDeliveryS3Destination#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_project#bucket EvidentlyProject#bucket}.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyProjectDataDeliveryS3Destination#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_project#prefix EvidentlyProject#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EvidentlyProjectDataDeliveryS3Destination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EvidentlyProjectDataDeliveryS3Destination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EvidentlyProjectDataDeliveryS3Destination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EvidentlyProjectDataDeliveryS3Destination {
        private final java.lang.String bucket;
        private final java.lang.String prefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = builder.bucket;
            this.prefix = builder.prefix;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBucket() != null) {
                data.set("bucket", om.valueToTree(this.getBucket()));
            }
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.evidentlyProject.EvidentlyProjectDataDeliveryS3Destination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EvidentlyProjectDataDeliveryS3Destination.Jsii$Proxy that = (EvidentlyProjectDataDeliveryS3Destination.Jsii$Proxy) o;

            if (this.bucket != null ? !this.bucket.equals(that.bucket) : that.bucket != null) return false;
            return this.prefix != null ? this.prefix.equals(that.prefix) : that.prefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket != null ? this.bucket.hashCode() : 0;
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            return result;
        }
    }
}
