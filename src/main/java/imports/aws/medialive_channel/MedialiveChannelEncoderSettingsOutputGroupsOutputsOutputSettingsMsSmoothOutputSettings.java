package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.880Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#h265_packaging_type MedialiveChannel#h265_packaging_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getH265PackagingType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name_modifier MedialiveChannel#name_modifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNameModifier() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings> {
        java.lang.String h265PackagingType;
        java.lang.String nameModifier;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings#getH265PackagingType}
         * @param h265PackagingType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#h265_packaging_type MedialiveChannel#h265_packaging_type}.
         * @return {@code this}
         */
        public Builder h265PackagingType(java.lang.String h265PackagingType) {
            this.h265PackagingType = h265PackagingType;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings#getNameModifier}
         * @param nameModifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name_modifier MedialiveChannel#name_modifier}.
         * @return {@code this}
         */
        public Builder nameModifier(java.lang.String nameModifier) {
            this.nameModifier = nameModifier;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings {
        private final java.lang.String h265PackagingType;
        private final java.lang.String nameModifier;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.h265PackagingType = software.amazon.jsii.Kernel.get(this, "h265PackagingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nameModifier = software.amazon.jsii.Kernel.get(this, "nameModifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.h265PackagingType = builder.h265PackagingType;
            this.nameModifier = builder.nameModifier;
        }

        @Override
        public final java.lang.String getH265PackagingType() {
            return this.h265PackagingType;
        }

        @Override
        public final java.lang.String getNameModifier() {
            return this.nameModifier;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getH265PackagingType() != null) {
                data.set("h265PackagingType", om.valueToTree(this.getH265PackagingType()));
            }
            if (this.getNameModifier() != null) {
                data.set("nameModifier", om.valueToTree(this.getNameModifier()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsMsSmoothOutputSettings.Jsii$Proxy) o;

            if (this.h265PackagingType != null ? !this.h265PackagingType.equals(that.h265PackagingType) : that.h265PackagingType != null) return false;
            return this.nameModifier != null ? this.nameModifier.equals(that.nameModifier) : that.nameModifier == null;
        }

        @Override
        public final int hashCode() {
            int result = this.h265PackagingType != null ? this.h265PackagingType.hashCode() : 0;
            result = 31 * result + (this.nameModifier != null ? this.nameModifier.hashCode() : 0);
            return result;
        }
    }
}
