package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.866Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAvailBlanking")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsAvailBlanking.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsAvailBlanking extends software.amazon.jsii.JsiiSerializable {

    /**
     * avail_blanking_image block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#avail_blanking_image MedialiveChannel#avail_blanking_image}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAvailBlankingAvailBlankingImage getAvailBlankingImage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#state MedialiveChannel#state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getState() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsAvailBlanking}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsAvailBlanking}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsAvailBlanking> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAvailBlankingAvailBlankingImage availBlankingImage;
        java.lang.String state;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAvailBlanking#getAvailBlankingImage}
         * @param availBlankingImage avail_blanking_image block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#avail_blanking_image MedialiveChannel#avail_blanking_image}
         * @return {@code this}
         */
        public Builder availBlankingImage(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAvailBlankingAvailBlankingImage availBlankingImage) {
            this.availBlankingImage = availBlankingImage;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAvailBlanking#getState}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#state MedialiveChannel#state}.
         * @return {@code this}
         */
        public Builder state(java.lang.String state) {
            this.state = state;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsAvailBlanking}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsAvailBlanking build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsAvailBlanking}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsAvailBlanking {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAvailBlankingAvailBlankingImage availBlankingImage;
        private final java.lang.String state;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.availBlankingImage = software.amazon.jsii.Kernel.get(this, "availBlankingImage", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAvailBlankingAvailBlankingImage.class));
            this.state = software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.availBlankingImage = builder.availBlankingImage;
            this.state = builder.state;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsAvailBlankingAvailBlankingImage getAvailBlankingImage() {
            return this.availBlankingImage;
        }

        @Override
        public final java.lang.String getState() {
            return this.state;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAvailBlankingImage() != null) {
                data.set("availBlankingImage", om.valueToTree(this.getAvailBlankingImage()));
            }
            if (this.getState() != null) {
                data.set("state", om.valueToTree(this.getState()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsAvailBlanking"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsAvailBlanking.Jsii$Proxy that = (MedialiveChannelEncoderSettingsAvailBlanking.Jsii$Proxy) o;

            if (this.availBlankingImage != null ? !this.availBlankingImage.equals(that.availBlankingImage) : that.availBlankingImage != null) return false;
            return this.state != null ? this.state.equals(that.state) : that.state == null;
        }

        @Override
        public final int hashCode() {
            int result = this.availBlankingImage != null ? this.availBlankingImage.hashCode() : 0;
            result = 31 * result + (this.state != null ? this.state.hashCode() : 0);
            return result;
        }
    }
}
