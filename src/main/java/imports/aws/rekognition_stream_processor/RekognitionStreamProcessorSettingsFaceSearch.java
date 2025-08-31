package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsFaceSearch")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorSettingsFaceSearch.Jsii$Proxy.class)
public interface RekognitionStreamProcessorSettingsFaceSearch extends software.amazon.jsii.JsiiSerializable {

    /**
     * The ID of a collection that contains faces that you want to search for.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#collection_id RekognitionStreamProcessor#collection_id}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCollectionId();

    /**
     * Minimum face match confidence score that must be met to return a result for a recognized face.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#face_match_threshold RekognitionStreamProcessor#face_match_threshold}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFaceMatchThreshold() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorSettingsFaceSearch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorSettingsFaceSearch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorSettingsFaceSearch> {
        java.lang.String collectionId;
        java.lang.Number faceMatchThreshold;

        /**
         * Sets the value of {@link RekognitionStreamProcessorSettingsFaceSearch#getCollectionId}
         * @param collectionId The ID of a collection that contains faces that you want to search for. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#collection_id RekognitionStreamProcessor#collection_id}
         * @return {@code this}
         */
        public Builder collectionId(java.lang.String collectionId) {
            this.collectionId = collectionId;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorSettingsFaceSearch#getFaceMatchThreshold}
         * @param faceMatchThreshold Minimum face match confidence score that must be met to return a result for a recognized face.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#face_match_threshold RekognitionStreamProcessor#face_match_threshold}
         * @return {@code this}
         */
        public Builder faceMatchThreshold(java.lang.Number faceMatchThreshold) {
            this.faceMatchThreshold = faceMatchThreshold;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorSettingsFaceSearch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorSettingsFaceSearch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorSettingsFaceSearch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorSettingsFaceSearch {
        private final java.lang.String collectionId;
        private final java.lang.Number faceMatchThreshold;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.collectionId = software.amazon.jsii.Kernel.get(this, "collectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.faceMatchThreshold = software.amazon.jsii.Kernel.get(this, "faceMatchThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.collectionId = java.util.Objects.requireNonNull(builder.collectionId, "collectionId is required");
            this.faceMatchThreshold = builder.faceMatchThreshold;
        }

        @Override
        public final java.lang.String getCollectionId() {
            return this.collectionId;
        }

        @Override
        public final java.lang.Number getFaceMatchThreshold() {
            return this.faceMatchThreshold;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("collectionId", om.valueToTree(this.getCollectionId()));
            if (this.getFaceMatchThreshold() != null) {
                data.set("faceMatchThreshold", om.valueToTree(this.getFaceMatchThreshold()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettingsFaceSearch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorSettingsFaceSearch.Jsii$Proxy that = (RekognitionStreamProcessorSettingsFaceSearch.Jsii$Proxy) o;

            if (!collectionId.equals(that.collectionId)) return false;
            return this.faceMatchThreshold != null ? this.faceMatchThreshold.equals(that.faceMatchThreshold) : that.faceMatchThreshold == null;
        }

        @Override
        public final int hashCode() {
            int result = this.collectionId.hashCode();
            result = 31 * result + (this.faceMatchThreshold != null ? this.faceMatchThreshold.hashCode() : 0);
            return result;
        }
    }
}
