package imports.aws.lexv2_models_slot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.780Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlot.Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard.Jsii$Proxy.class)
public interface Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#title Lexv2ModelsSlot#title}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTitle();

    /**
     * button block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#button Lexv2ModelsSlot#button}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getButton() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#image_url Lexv2ModelsSlot#image_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImageUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#subtitle Lexv2ModelsSlot#subtitle}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSubtitle() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard> {
        java.lang.String title;
        java.lang.Object button;
        java.lang.String imageUrl;
        java.lang.String subtitle;

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard#getTitle}
         * @param title Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#title Lexv2ModelsSlot#title}. This parameter is required.
         * @return {@code this}
         */
        public Builder title(java.lang.String title) {
            this.title = title;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard#getButton}
         * @param button button block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#button Lexv2ModelsSlot#button}
         * @return {@code this}
         */
        public Builder button(com.hashicorp.cdktf.IResolvable button) {
            this.button = button;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard#getButton}
         * @param button button block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#button Lexv2ModelsSlot#button}
         * @return {@code this}
         */
        public Builder button(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCardButton> button) {
            this.button = button;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard#getImageUrl}
         * @param imageUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#image_url Lexv2ModelsSlot#image_url}.
         * @return {@code this}
         */
        public Builder imageUrl(java.lang.String imageUrl) {
            this.imageUrl = imageUrl;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard#getSubtitle}
         * @param subtitle Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#subtitle Lexv2ModelsSlot#subtitle}.
         * @return {@code this}
         */
        public Builder subtitle(java.lang.String subtitle) {
            this.subtitle = subtitle;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard {
        private final java.lang.String title;
        private final java.lang.Object button;
        private final java.lang.String imageUrl;
        private final java.lang.String subtitle;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.title = software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.button = software.amazon.jsii.Kernel.get(this, "button", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.imageUrl = software.amazon.jsii.Kernel.get(this, "imageUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subtitle = software.amazon.jsii.Kernel.get(this, "subtitle", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.title = java.util.Objects.requireNonNull(builder.title, "title is required");
            this.button = builder.button;
            this.imageUrl = builder.imageUrl;
            this.subtitle = builder.subtitle;
        }

        @Override
        public final java.lang.String getTitle() {
            return this.title;
        }

        @Override
        public final java.lang.Object getButton() {
            return this.button;
        }

        @Override
        public final java.lang.String getImageUrl() {
            return this.imageUrl;
        }

        @Override
        public final java.lang.String getSubtitle() {
            return this.subtitle;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("title", om.valueToTree(this.getTitle()));
            if (this.getButton() != null) {
                data.set("button", om.valueToTree(this.getButton()));
            }
            if (this.getImageUrl() != null) {
                data.set("imageUrl", om.valueToTree(this.getImageUrl()));
            }
            if (this.getSubtitle() != null) {
                data.set("subtitle", om.valueToTree(this.getSubtitle()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlot.Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard.Jsii$Proxy that = (Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingPromptSpecificationMessageGroupMessageImageResponseCard.Jsii$Proxy) o;

            if (!title.equals(that.title)) return false;
            if (this.button != null ? !this.button.equals(that.button) : that.button != null) return false;
            if (this.imageUrl != null ? !this.imageUrl.equals(that.imageUrl) : that.imageUrl != null) return false;
            return this.subtitle != null ? this.subtitle.equals(that.subtitle) : that.subtitle == null;
        }

        @Override
        public final int hashCode() {
            int result = this.title.hashCode();
            result = 31 * result + (this.button != null ? this.button.hashCode() : 0);
            result = 31 * result + (this.imageUrl != null ? this.imageUrl.hashCode() : 0);
            result = 31 * result + (this.subtitle != null ? this.subtitle.hashCode() : 0);
            return result;
        }
    }
}
