package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterest")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorRegionsOfInterest.Jsii$Proxy.class)
public interface RekognitionStreamProcessorRegionsOfInterest extends software.amazon.jsii.JsiiSerializable {

    /**
     * bounding_box block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#bounding_box RekognitionStreamProcessor#bounding_box}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestBoundingBox getBoundingBox() {
        return null;
    }

    /**
     * polygon block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#polygon RekognitionStreamProcessor#polygon}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPolygon() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorRegionsOfInterest}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorRegionsOfInterest}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorRegionsOfInterest> {
        imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestBoundingBox boundingBox;
        java.lang.Object polygon;

        /**
         * Sets the value of {@link RekognitionStreamProcessorRegionsOfInterest#getBoundingBox}
         * @param boundingBox bounding_box block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#bounding_box RekognitionStreamProcessor#bounding_box}
         * @return {@code this}
         */
        public Builder boundingBox(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestBoundingBox boundingBox) {
            this.boundingBox = boundingBox;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorRegionsOfInterest#getPolygon}
         * @param polygon polygon block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#polygon RekognitionStreamProcessor#polygon}
         * @return {@code this}
         */
        public Builder polygon(com.hashicorp.cdktf.IResolvable polygon) {
            this.polygon = polygon;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorRegionsOfInterest#getPolygon}
         * @param polygon polygon block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#polygon RekognitionStreamProcessor#polygon}
         * @return {@code this}
         */
        public Builder polygon(java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestPolygon> polygon) {
            this.polygon = polygon;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorRegionsOfInterest}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorRegionsOfInterest build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorRegionsOfInterest}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorRegionsOfInterest {
        private final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestBoundingBox boundingBox;
        private final java.lang.Object polygon;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.boundingBox = software.amazon.jsii.Kernel.get(this, "boundingBox", software.amazon.jsii.NativeType.forClass(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestBoundingBox.class));
            this.polygon = software.amazon.jsii.Kernel.get(this, "polygon", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.boundingBox = builder.boundingBox;
            this.polygon = builder.polygon;
        }

        @Override
        public final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestBoundingBox getBoundingBox() {
            return this.boundingBox;
        }

        @Override
        public final java.lang.Object getPolygon() {
            return this.polygon;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBoundingBox() != null) {
                data.set("boundingBox", om.valueToTree(this.getBoundingBox()));
            }
            if (this.getPolygon() != null) {
                data.set("polygon", om.valueToTree(this.getPolygon()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterest"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorRegionsOfInterest.Jsii$Proxy that = (RekognitionStreamProcessorRegionsOfInterest.Jsii$Proxy) o;

            if (this.boundingBox != null ? !this.boundingBox.equals(that.boundingBox) : that.boundingBox != null) return false;
            return this.polygon != null ? this.polygon.equals(that.polygon) : that.polygon == null;
        }

        @Override
        public final int hashCode() {
            int result = this.boundingBox != null ? this.boundingBox.hashCode() : 0;
            result = 31 * result + (this.polygon != null ? this.polygon.hashCode() : 0);
            return result;
        }
    }
}
