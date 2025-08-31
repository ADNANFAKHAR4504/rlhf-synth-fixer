package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.868Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#black_frame_msec MedialiveChannel#black_frame_msec}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBlackFrameMsec() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_image_color MedialiveChannel#input_loss_image_color}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputLossImageColor() {
        return null;
    }

    /**
     * input_loss_image_slate block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_image_slate MedialiveChannel#input_loss_image_slate}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorInputLossImageSlate getInputLossImageSlate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_image_type MedialiveChannel#input_loss_image_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputLossImageType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#repeat_frame_msec MedialiveChannel#repeat_frame_msec}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRepeatFrameMsec() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior> {
        java.lang.Number blackFrameMsec;
        java.lang.String inputLossImageColor;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorInputLossImageSlate inputLossImageSlate;
        java.lang.String inputLossImageType;
        java.lang.Number repeatFrameMsec;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior#getBlackFrameMsec}
         * @param blackFrameMsec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#black_frame_msec MedialiveChannel#black_frame_msec}.
         * @return {@code this}
         */
        public Builder blackFrameMsec(java.lang.Number blackFrameMsec) {
            this.blackFrameMsec = blackFrameMsec;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior#getInputLossImageColor}
         * @param inputLossImageColor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_image_color MedialiveChannel#input_loss_image_color}.
         * @return {@code this}
         */
        public Builder inputLossImageColor(java.lang.String inputLossImageColor) {
            this.inputLossImageColor = inputLossImageColor;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior#getInputLossImageSlate}
         * @param inputLossImageSlate input_loss_image_slate block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_image_slate MedialiveChannel#input_loss_image_slate}
         * @return {@code this}
         */
        public Builder inputLossImageSlate(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorInputLossImageSlate inputLossImageSlate) {
            this.inputLossImageSlate = inputLossImageSlate;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior#getInputLossImageType}
         * @param inputLossImageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_image_type MedialiveChannel#input_loss_image_type}.
         * @return {@code this}
         */
        public Builder inputLossImageType(java.lang.String inputLossImageType) {
            this.inputLossImageType = inputLossImageType;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior#getRepeatFrameMsec}
         * @param repeatFrameMsec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#repeat_frame_msec MedialiveChannel#repeat_frame_msec}.
         * @return {@code this}
         */
        public Builder repeatFrameMsec(java.lang.Number repeatFrameMsec) {
            this.repeatFrameMsec = repeatFrameMsec;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior {
        private final java.lang.Number blackFrameMsec;
        private final java.lang.String inputLossImageColor;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorInputLossImageSlate inputLossImageSlate;
        private final java.lang.String inputLossImageType;
        private final java.lang.Number repeatFrameMsec;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.blackFrameMsec = software.amazon.jsii.Kernel.get(this, "blackFrameMsec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.inputLossImageColor = software.amazon.jsii.Kernel.get(this, "inputLossImageColor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputLossImageSlate = software.amazon.jsii.Kernel.get(this, "inputLossImageSlate", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorInputLossImageSlate.class));
            this.inputLossImageType = software.amazon.jsii.Kernel.get(this, "inputLossImageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.repeatFrameMsec = software.amazon.jsii.Kernel.get(this, "repeatFrameMsec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.blackFrameMsec = builder.blackFrameMsec;
            this.inputLossImageColor = builder.inputLossImageColor;
            this.inputLossImageSlate = builder.inputLossImageSlate;
            this.inputLossImageType = builder.inputLossImageType;
            this.repeatFrameMsec = builder.repeatFrameMsec;
        }

        @Override
        public final java.lang.Number getBlackFrameMsec() {
            return this.blackFrameMsec;
        }

        @Override
        public final java.lang.String getInputLossImageColor() {
            return this.inputLossImageColor;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehaviorInputLossImageSlate getInputLossImageSlate() {
            return this.inputLossImageSlate;
        }

        @Override
        public final java.lang.String getInputLossImageType() {
            return this.inputLossImageType;
        }

        @Override
        public final java.lang.Number getRepeatFrameMsec() {
            return this.repeatFrameMsec;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBlackFrameMsec() != null) {
                data.set("blackFrameMsec", om.valueToTree(this.getBlackFrameMsec()));
            }
            if (this.getInputLossImageColor() != null) {
                data.set("inputLossImageColor", om.valueToTree(this.getInputLossImageColor()));
            }
            if (this.getInputLossImageSlate() != null) {
                data.set("inputLossImageSlate", om.valueToTree(this.getInputLossImageSlate()));
            }
            if (this.getInputLossImageType() != null) {
                data.set("inputLossImageType", om.valueToTree(this.getInputLossImageType()));
            }
            if (this.getRepeatFrameMsec() != null) {
                data.set("repeatFrameMsec", om.valueToTree(this.getRepeatFrameMsec()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior.Jsii$Proxy that = (MedialiveChannelEncoderSettingsGlobalConfigurationInputLossBehavior.Jsii$Proxy) o;

            if (this.blackFrameMsec != null ? !this.blackFrameMsec.equals(that.blackFrameMsec) : that.blackFrameMsec != null) return false;
            if (this.inputLossImageColor != null ? !this.inputLossImageColor.equals(that.inputLossImageColor) : that.inputLossImageColor != null) return false;
            if (this.inputLossImageSlate != null ? !this.inputLossImageSlate.equals(that.inputLossImageSlate) : that.inputLossImageSlate != null) return false;
            if (this.inputLossImageType != null ? !this.inputLossImageType.equals(that.inputLossImageType) : that.inputLossImageType != null) return false;
            return this.repeatFrameMsec != null ? this.repeatFrameMsec.equals(that.repeatFrameMsec) : that.repeatFrameMsec == null;
        }

        @Override
        public final int hashCode() {
            int result = this.blackFrameMsec != null ? this.blackFrameMsec.hashCode() : 0;
            result = 31 * result + (this.inputLossImageColor != null ? this.inputLossImageColor.hashCode() : 0);
            result = 31 * result + (this.inputLossImageSlate != null ? this.inputLossImageSlate.hashCode() : 0);
            result = 31 * result + (this.inputLossImageType != null ? this.inputLossImageType.hashCode() : 0);
            result = 31 * result + (this.repeatFrameMsec != null ? this.repeatFrameMsec.hashCode() : 0);
            return result;
        }
    }
}
