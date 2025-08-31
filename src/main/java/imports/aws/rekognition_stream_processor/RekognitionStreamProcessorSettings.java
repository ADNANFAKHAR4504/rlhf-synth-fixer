package imports.aws.rekognition_stream_processor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettings")
@software.amazon.jsii.Jsii.Proxy(RekognitionStreamProcessorSettings.Jsii$Proxy.class)
public interface RekognitionStreamProcessorSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * connected_home block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#connected_home RekognitionStreamProcessor#connected_home}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConnectedHome() {
        return null;
    }

    /**
     * face_search block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#face_search RekognitionStreamProcessor#face_search}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFaceSearch() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RekognitionStreamProcessorSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RekognitionStreamProcessorSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RekognitionStreamProcessorSettings> {
        java.lang.Object connectedHome;
        java.lang.Object faceSearch;

        /**
         * Sets the value of {@link RekognitionStreamProcessorSettings#getConnectedHome}
         * @param connectedHome connected_home block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#connected_home RekognitionStreamProcessor#connected_home}
         * @return {@code this}
         */
        public Builder connectedHome(com.hashicorp.cdktf.IResolvable connectedHome) {
            this.connectedHome = connectedHome;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorSettings#getConnectedHome}
         * @param connectedHome connected_home block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#connected_home RekognitionStreamProcessor#connected_home}
         * @return {@code this}
         */
        public Builder connectedHome(java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorSettingsConnectedHome> connectedHome) {
            this.connectedHome = connectedHome;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorSettings#getFaceSearch}
         * @param faceSearch face_search block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#face_search RekognitionStreamProcessor#face_search}
         * @return {@code this}
         */
        public Builder faceSearch(com.hashicorp.cdktf.IResolvable faceSearch) {
            this.faceSearch = faceSearch;
            return this;
        }

        /**
         * Sets the value of {@link RekognitionStreamProcessorSettings#getFaceSearch}
         * @param faceSearch face_search block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#face_search RekognitionStreamProcessor#face_search}
         * @return {@code this}
         */
        public Builder faceSearch(java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorSettingsFaceSearch> faceSearch) {
            this.faceSearch = faceSearch;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RekognitionStreamProcessorSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RekognitionStreamProcessorSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RekognitionStreamProcessorSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RekognitionStreamProcessorSettings {
        private final java.lang.Object connectedHome;
        private final java.lang.Object faceSearch;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.connectedHome = software.amazon.jsii.Kernel.get(this, "connectedHome", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.faceSearch = software.amazon.jsii.Kernel.get(this, "faceSearch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.connectedHome = builder.connectedHome;
            this.faceSearch = builder.faceSearch;
        }

        @Override
        public final java.lang.Object getConnectedHome() {
            return this.connectedHome;
        }

        @Override
        public final java.lang.Object getFaceSearch() {
            return this.faceSearch;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConnectedHome() != null) {
                data.set("connectedHome", om.valueToTree(this.getConnectedHome()));
            }
            if (this.getFaceSearch() != null) {
                data.set("faceSearch", om.valueToTree(this.getFaceSearch()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rekognitionStreamProcessor.RekognitionStreamProcessorSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RekognitionStreamProcessorSettings.Jsii$Proxy that = (RekognitionStreamProcessorSettings.Jsii$Proxy) o;

            if (this.connectedHome != null ? !this.connectedHome.equals(that.connectedHome) : that.connectedHome != null) return false;
            return this.faceSearch != null ? this.faceSearch.equals(that.faceSearch) : that.faceSearch == null;
        }

        @Override
        public final int hashCode() {
            int result = this.connectedHome != null ? this.connectedHome.hashCode() : 0;
            result = 31 * result + (this.faceSearch != null ? this.faceSearch.hashCode() : 0);
            return result;
        }
    }
}
