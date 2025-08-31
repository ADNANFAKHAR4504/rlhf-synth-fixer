package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * hls_input_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_input_settings MedialiveChannel#hls_input_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings getHlsInputSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#server_validation MedialiveChannel#server_validation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServerValidation() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings> {
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings hlsInputSettings;
        java.lang.String serverValidation;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings#getHlsInputSettings}
         * @param hlsInputSettings hls_input_settings block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#hls_input_settings MedialiveChannel#hls_input_settings}
         * @return {@code this}
         */
        public Builder hlsInputSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings hlsInputSettings) {
            this.hlsInputSettings = hlsInputSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings#getServerValidation}
         * @param serverValidation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#server_validation MedialiveChannel#server_validation}.
         * @return {@code this}
         */
        public Builder serverValidation(java.lang.String serverValidation) {
            this.serverValidation = serverValidation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings {
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings hlsInputSettings;
        private final java.lang.String serverValidation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hlsInputSettings = software.amazon.jsii.Kernel.get(this, "hlsInputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings.class));
            this.serverValidation = software.amazon.jsii.Kernel.get(this, "serverValidation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hlsInputSettings = builder.hlsInputSettings;
            this.serverValidation = builder.serverValidation;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettingsHlsInputSettings getHlsInputSettings() {
            return this.hlsInputSettings;
        }

        @Override
        public final java.lang.String getServerValidation() {
            return this.serverValidation;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHlsInputSettings() != null) {
                data.set("hlsInputSettings", om.valueToTree(this.getHlsInputSettings()));
            }
            if (this.getServerValidation() != null) {
                data.set("serverValidation", om.valueToTree(this.getServerValidation()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsInputSettingsNetworkInputSettings.Jsii$Proxy) o;

            if (this.hlsInputSettings != null ? !this.hlsInputSettings.equals(that.hlsInputSettings) : that.hlsInputSettings != null) return false;
            return this.serverValidation != null ? this.serverValidation.equals(that.serverValidation) : that.serverValidation == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hlsInputSettings != null ? this.hlsInputSettings.hashCode() : 0;
            result = 31 * result + (this.serverValidation != null ? this.serverValidation.hashCode() : 0);
            return result;
        }
    }
}
