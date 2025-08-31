package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.867Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsCaptionDescriptions")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsCaptionDescriptions.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsCaptionDescriptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_selector_name MedialiveChannel#caption_selector_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCaptionSelectorName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name MedialiveChannel#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#accessibility MedialiveChannel#accessibility}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessibility() {
        return null;
    }

    /**
     * destination_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destination_settings MedialiveChannel#destination_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettings getDestinationSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_code MedialiveChannel#language_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLanguageCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_description MedialiveChannel#language_description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLanguageDescription() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsCaptionDescriptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsCaptionDescriptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsCaptionDescriptions> {
        java.lang.String captionSelectorName;
        java.lang.String name;
        java.lang.String accessibility;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettings destinationSettings;
        java.lang.String languageCode;
        java.lang.String languageDescription;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsCaptionDescriptions#getCaptionSelectorName}
         * @param captionSelectorName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_selector_name MedialiveChannel#caption_selector_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder captionSelectorName(java.lang.String captionSelectorName) {
            this.captionSelectorName = captionSelectorName;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsCaptionDescriptions#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name MedialiveChannel#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsCaptionDescriptions#getAccessibility}
         * @param accessibility Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#accessibility MedialiveChannel#accessibility}.
         * @return {@code this}
         */
        public Builder accessibility(java.lang.String accessibility) {
            this.accessibility = accessibility;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsCaptionDescriptions#getDestinationSettings}
         * @param destinationSettings destination_settings block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destination_settings MedialiveChannel#destination_settings}
         * @return {@code this}
         */
        public Builder destinationSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettings destinationSettings) {
            this.destinationSettings = destinationSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsCaptionDescriptions#getLanguageCode}
         * @param languageCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_code MedialiveChannel#language_code}.
         * @return {@code this}
         */
        public Builder languageCode(java.lang.String languageCode) {
            this.languageCode = languageCode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsCaptionDescriptions#getLanguageDescription}
         * @param languageDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#language_description MedialiveChannel#language_description}.
         * @return {@code this}
         */
        public Builder languageDescription(java.lang.String languageDescription) {
            this.languageDescription = languageDescription;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsCaptionDescriptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsCaptionDescriptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsCaptionDescriptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsCaptionDescriptions {
        private final java.lang.String captionSelectorName;
        private final java.lang.String name;
        private final java.lang.String accessibility;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettings destinationSettings;
        private final java.lang.String languageCode;
        private final java.lang.String languageDescription;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.captionSelectorName = software.amazon.jsii.Kernel.get(this, "captionSelectorName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessibility = software.amazon.jsii.Kernel.get(this, "accessibility", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationSettings = software.amazon.jsii.Kernel.get(this, "destinationSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettings.class));
            this.languageCode = software.amazon.jsii.Kernel.get(this, "languageCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.languageDescription = software.amazon.jsii.Kernel.get(this, "languageDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.captionSelectorName = java.util.Objects.requireNonNull(builder.captionSelectorName, "captionSelectorName is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.accessibility = builder.accessibility;
            this.destinationSettings = builder.destinationSettings;
            this.languageCode = builder.languageCode;
            this.languageDescription = builder.languageDescription;
        }

        @Override
        public final java.lang.String getCaptionSelectorName() {
            return this.captionSelectorName;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getAccessibility() {
            return this.accessibility;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsCaptionDescriptionsDestinationSettings getDestinationSettings() {
            return this.destinationSettings;
        }

        @Override
        public final java.lang.String getLanguageCode() {
            return this.languageCode;
        }

        @Override
        public final java.lang.String getLanguageDescription() {
            return this.languageDescription;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("captionSelectorName", om.valueToTree(this.getCaptionSelectorName()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getAccessibility() != null) {
                data.set("accessibility", om.valueToTree(this.getAccessibility()));
            }
            if (this.getDestinationSettings() != null) {
                data.set("destinationSettings", om.valueToTree(this.getDestinationSettings()));
            }
            if (this.getLanguageCode() != null) {
                data.set("languageCode", om.valueToTree(this.getLanguageCode()));
            }
            if (this.getLanguageDescription() != null) {
                data.set("languageDescription", om.valueToTree(this.getLanguageDescription()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsCaptionDescriptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsCaptionDescriptions.Jsii$Proxy that = (MedialiveChannelEncoderSettingsCaptionDescriptions.Jsii$Proxy) o;

            if (!captionSelectorName.equals(that.captionSelectorName)) return false;
            if (!name.equals(that.name)) return false;
            if (this.accessibility != null ? !this.accessibility.equals(that.accessibility) : that.accessibility != null) return false;
            if (this.destinationSettings != null ? !this.destinationSettings.equals(that.destinationSettings) : that.destinationSettings != null) return false;
            if (this.languageCode != null ? !this.languageCode.equals(that.languageCode) : that.languageCode != null) return false;
            return this.languageDescription != null ? this.languageDescription.equals(that.languageDescription) : that.languageDescription == null;
        }

        @Override
        public final int hashCode() {
            int result = this.captionSelectorName.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.accessibility != null ? this.accessibility.hashCode() : 0);
            result = 31 * result + (this.destinationSettings != null ? this.destinationSettings.hashCode() : 0);
            result = 31 * result + (this.languageCode != null ? this.languageCode.hashCode() : 0);
            result = 31 * result + (this.languageDescription != null ? this.languageDescription.hashCode() : 0);
            return result;
        }
    }
}
