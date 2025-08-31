package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestPolygon")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorRegionsOfInterestPolygon.Jsii$Proxy.class)
public interface RekognitionStreamProcessorRegionsOfInterestPolygon extends software.amazon.jsii.JsiiSerializable {

    /**
     * The value of the X coordinate for a point on a Polygon.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#x RekognitionStreamProcessor#x}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getX() {
        return null;
    }

    /**
     * The value of the Y coordinate for a point on a Polygon.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#y RekognitionStreamProcessor#y}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getY() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorRegionsOfInterestPolygon}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorRegionsOfInterestPolygon}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorRegionsOfInterestPolygon> {
        java.lang.Number x;
        java.lang.Number y;

        /**
         * Sets the value of {@link RekognitionStreamProcessorRegionsOfInterestPolygon#getX}
         * @param x The value of the X coordinate for a point on a Polygon.
         *          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#x RekognitionStreamProcessor#x}
         * @return {@code this}
         */
        public Builder x(java.lang.Number x) {
            this.x = x;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorRegionsOfInterestPolygon#getY}
         * @param y The value of the Y coordinate for a point on a Polygon.
         *          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#y RekognitionStreamProcessor#y}
         * @return {@code this}
         */
        public Builder y(java.lang.Number y) {
            this.y = y;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorRegionsOfInterestPolygon}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorRegionsOfInterestPolygon build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorRegionsOfInterestPolygon}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorRegionsOfInterestPolygon {
        private final java.lang.Number x;
        private final java.lang.Number y;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.x = software.amazon.jsii.Kernel.get(this, "x", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.y = software.amazon.jsii.Kernel.get(this, "y", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.x = builder.x;
            this.y = builder.y;
        }

        @Override
        public final java.lang.Number getX() {
            return this.x;
        }

        @Override
        public final java.lang.Number getY() {
            return this.y;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getX() != null) {
                data.set("x", om.valueToTree(this.getX()));
            }
            if (this.getY() != null) {
                data.set("y", om.valueToTree(this.getY()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorRegionsOfInterestPolygon"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorRegionsOfInterestPolygon.Jsii$Proxy that = (RekognitionStreamProcessorRegionsOfInterestPolygon.Jsii$Proxy) o;

            if (this.x != null ? !this.x.equals(that.x) : that.x != null) return false;
            return this.y != null ? this.y.equals(that.y) : that.y == null;
        }

        @Override
        public final int hashCode() {
            int result = this.x != null ? this.x.hashCode() : 0;
            result = 31 * result + (this.y != null ? this.y.hashCode() : 0);
            return result;
        }
    }
}
