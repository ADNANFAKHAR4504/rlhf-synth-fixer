package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.883Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#max_cll MedialiveChannel#max_cll}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxCll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#max_fall MedialiveChannel#max_fall}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxFall() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings> {
        java.lang.Number maxCll;
        java.lang.Number maxFall;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings#getMaxCll}
         * @param maxCll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#max_cll MedialiveChannel#max_cll}.
         * @return {@code this}
         */
        public Builder maxCll(java.lang.Number maxCll) {
            this.maxCll = maxCll;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings#getMaxFall}
         * @param maxFall Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#max_fall MedialiveChannel#max_fall}.
         * @return {@code this}
         */
        public Builder maxFall(java.lang.Number maxFall) {
            this.maxFall = maxFall;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings {
        private final java.lang.Number maxCll;
        private final java.lang.Number maxFall;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxCll = software.amazon.jsii.Kernel.get(this, "maxCll", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxFall = software.amazon.jsii.Kernel.get(this, "maxFall", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxCll = builder.maxCll;
            this.maxFall = builder.maxFall;
        }

        @Override
        public final java.lang.Number getMaxCll() {
            return this.maxCll;
        }

        @Override
        public final java.lang.Number getMaxFall() {
            return this.maxFall;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaxCll() != null) {
                data.set("maxCll", om.valueToTree(this.getMaxCll()));
            }
            if (this.getMaxFall() != null) {
                data.set("maxFall", om.valueToTree(this.getMaxFall()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettingsHdr10Settings.Jsii$Proxy) o;

            if (this.maxCll != null ? !this.maxCll.equals(that.maxCll) : that.maxCll != null) return false;
            return this.maxFall != null ? this.maxFall.equals(that.maxFall) : that.maxFall == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxCll != null ? this.maxCll.hashCode() : 0;
            result = 31 * result + (this.maxFall != null ? this.maxFall.hashCode() : 0);
            return result;
        }
    }
}
