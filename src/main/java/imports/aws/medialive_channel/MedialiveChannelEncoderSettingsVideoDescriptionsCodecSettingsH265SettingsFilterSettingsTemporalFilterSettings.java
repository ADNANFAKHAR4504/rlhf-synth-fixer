package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.884Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#post_filter_sharpening MedialiveChannel#post_filter_sharpening}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPostFilterSharpening() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#strength MedialiveChannel#strength}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStrength() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings> {
        java.lang.String postFilterSharpening;
        java.lang.String strength;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings#getPostFilterSharpening}
         * @param postFilterSharpening Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#post_filter_sharpening MedialiveChannel#post_filter_sharpening}.
         * @return {@code this}
         */
        public Builder postFilterSharpening(java.lang.String postFilterSharpening) {
            this.postFilterSharpening = postFilterSharpening;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings#getStrength}
         * @param strength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#strength MedialiveChannel#strength}.
         * @return {@code this}
         */
        public Builder strength(java.lang.String strength) {
            this.strength = strength;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings {
        private final java.lang.String postFilterSharpening;
        private final java.lang.String strength;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.postFilterSharpening = software.amazon.jsii.Kernel.get(this, "postFilterSharpening", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.strength = software.amazon.jsii.Kernel.get(this, "strength", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.postFilterSharpening = builder.postFilterSharpening;
            this.strength = builder.strength;
        }

        @Override
        public final java.lang.String getPostFilterSharpening() {
            return this.postFilterSharpening;
        }

        @Override
        public final java.lang.String getStrength() {
            return this.strength;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPostFilterSharpening() != null) {
                data.set("postFilterSharpening", om.valueToTree(this.getPostFilterSharpening()));
            }
            if (this.getStrength() != null) {
                data.set("strength", om.valueToTree(this.getStrength()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettingsTemporalFilterSettings.Jsii$Proxy) o;

            if (this.postFilterSharpening != null ? !this.postFilterSharpening.equals(that.postFilterSharpening) : that.postFilterSharpening != null) return false;
            return this.strength != null ? this.strength.equals(that.strength) : that.strength == null;
        }

        @Override
        public final int hashCode() {
            int result = this.postFilterSharpening != null ? this.postFilterSharpening.hashCode() : 0;
            result = 31 * result + (this.strength != null ? this.strength.hashCode() : 0);
            return result;
        }
    }
}
