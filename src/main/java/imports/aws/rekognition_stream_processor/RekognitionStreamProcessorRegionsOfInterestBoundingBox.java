package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestBoundingBox")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorRegionsOfInterestBoundingBox.Jsii$Proxy.class)
public interface RekognitionStreamProcessorRegionsOfInterestBoundingBox extends software.amazon.jsii.JsiiSerializable {

    /**
     * Height of the bounding box as a ratio of the overall image height.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#height RekognitionStreamProcessor#height}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHeight() {
        return null;
    }

    /**
     * Left coordinate of the bounding box as a ratio of overall image width.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#left RekognitionStreamProcessor#left}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getLeft() {
        return null;
    }

    /**
     * Top coordinate of the bounding box as a ratio of overall image height.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#top RekognitionStreamProcessor#top}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTop() {
        return null;
    }

    /**
     * Width of the bounding box as a ratio of the overall image width.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#width RekognitionStreamProcessor#width}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWidth() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorRegionsOfInterestBoundingBox}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorRegionsOfInterestBoundingBox}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorRegionsOfInterestBoundingBox> {
        java.lang.Number height;
        java.lang.Number left;
        java.lang.Number top;
        java.lang.Number width;

        /**
         * Sets the value of {@link RekognitionStreamProcessorRegionsOfInterestBoundingBox#getHeight}
         * @param height Height of the bounding box as a ratio of the overall image height.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#height RekognitionStreamProcessor#height}
         * @return {@code this}
         */
        public Builder height(java.lang.Number height) {
            this.height = height;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorRegionsOfInterestBoundingBox#getLeft}
         * @param left Left coordinate of the bounding box as a ratio of overall image width.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#left RekognitionStreamProcessor#left}
         * @return {@code this}
         */
        public Builder left(java.lang.Number left) {
            this.left = left;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorRegionsOfInterestBoundingBox#getTop}
         * @param top Top coordinate of the bounding box as a ratio of overall image height.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#top RekognitionStreamProcessor#top}
         * @return {@code this}
         */
        public Builder top(java.lang.Number top) {
            this.top = top;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorRegionsOfInterestBoundingBox#getWidth}
         * @param width Width of the bounding box as a ratio of the overall image width.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#width RekognitionStreamProcessor#width}
         * @return {@code this}
         */
        public Builder width(java.lang.Number width) {
            this.width = width;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorRegionsOfInterestBoundingBox}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorRegionsOfInterestBoundingBox build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorRegionsOfInterestBoundingBox}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorRegionsOfInterestBoundingBox {
        private final java.lang.Number height;
        private final java.lang.Number left;
        private final java.lang.Number top;
        private final java.lang.Number width;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.height = software.amazon.jsii.Kernel.get(this, "height", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.left = software.amazon.jsii.Kernel.get(this, "left", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.top = software.amazon.jsii.Kernel.get(this, "top", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.width = software.amazon.jsii.Kernel.get(this, "width", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.height = builder.height;
            this.left = builder.left;
            this.top = builder.top;
            this.width = builder.width;
        }

        @Override
        public final java.lang.Number getHeight() {
            return this.height;
        }

        @Override
        public final java.lang.Number getLeft() {
            return this.left;
        }

        @Override
        public final java.lang.Number getTop() {
            return this.top;
        }

        @Override
        public final java.lang.Number getWidth() {
            return this.width;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHeight() != null) {
                data.set("height", om.valueToTree(this.getHeight()));
            }
            if (this.getLeft() != null) {
                data.set("left", om.valueToTree(this.getLeft()));
            }
            if (this.getTop() != null) {
                data.set("top", om.valueToTree(this.getTop()));
            }
            if (this.getWidth() != null) {
                data.set("width", om.valueToTree(this.getWidth()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestBoundingBox"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorRegionsOfInterestBoundingBox.Jsii$Proxy that = (RekognitionStreamProcessorRegionsOfInterestBoundingBox.Jsii$Proxy) o;

            if (this.height != null ? !this.height.equals(that.height) : that.height != null) return false;
            if (this.left != null ? !this.left.equals(that.left) : that.left != null) return false;
            if (this.top != null ? !this.top.equals(that.top) : that.top != null) return false;
            return this.width != null ? this.width.equals(that.width) : that.width == null;
        }

        @Override
        public final int hashCode() {
            int result = this.height != null ? this.height.hashCode() : 0;
            result = 31 * result + (this.left != null ? this.left.hashCode() : 0);
            result = 31 * result + (this.top != null ? this.top.hashCode() : 0);
            result = 31 * result + (this.width != null ? this.width.hashCode() : 0);
            return result;
        }
    }
}
