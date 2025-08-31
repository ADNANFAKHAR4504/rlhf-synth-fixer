package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.874Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#static_key_value MedialiveChannel#static_key_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStaticKeyValue();

    /**
     * key_provider_server block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#key_provider_server MedialiveChannel#key_provider_server}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettingsKeyProviderServer getKeyProviderServer() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings> {
        java.lang.String staticKeyValue;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettingsKeyProviderServer keyProviderServer;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings#getStaticKeyValue}
         * @param staticKeyValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#static_key_value MedialiveChannel#static_key_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder staticKeyValue(java.lang.String staticKeyValue) {
            this.staticKeyValue = staticKeyValue;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings#getKeyProviderServer}
         * @param keyProviderServer key_provider_server block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#key_provider_server MedialiveChannel#key_provider_server}
         * @return {@code this}
         */
        public Builder keyProviderServer(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettingsKeyProviderServer keyProviderServer) {
            this.keyProviderServer = keyProviderServer;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings {
        private final java.lang.String staticKeyValue;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettingsKeyProviderServer keyProviderServer;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.staticKeyValue = software.amazon.jsii.Kernel.get(this, "staticKeyValue", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyProviderServer = software.amazon.jsii.Kernel.get(this, "keyProviderServer", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettingsKeyProviderServer.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.staticKeyValue = java.util.Objects.requireNonNull(builder.staticKeyValue, "staticKeyValue is required");
            this.keyProviderServer = builder.keyProviderServer;
        }

        @Override
        public final java.lang.String getStaticKeyValue() {
            return this.staticKeyValue;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettingsKeyProviderServer getKeyProviderServer() {
            return this.keyProviderServer;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("staticKeyValue", om.valueToTree(this.getStaticKeyValue()));
            if (this.getKeyProviderServer() != null) {
                data.set("keyProviderServer", om.valueToTree(this.getKeyProviderServer()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsStaticKeySettings.Jsii$Proxy) o;

            if (!staticKeyValue.equals(that.staticKeyValue)) return false;
            return this.keyProviderServer != null ? this.keyProviderServer.equals(that.keyProviderServer) : that.keyProviderServer == null;
        }

        @Override
        public final int hashCode() {
            int result = this.staticKeyValue.hashCode();
            result = 31 * result + (this.keyProviderServer != null ? this.keyProviderServer.hashCode() : 0);
            return result;
        }
    }
}
