package imports.aws.lexv2_models_slot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.796Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlot.Lexv2ModelsSlotValueElicitationSettingPromptSpecification")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotValueElicitationSettingPromptSpecification.Jsii$Proxy.class)
public interface Lexv2ModelsSlotValueElicitationSettingPromptSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#max_retries Lexv2ModelsSlot#max_retries}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxRetries();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#allow_interrupt Lexv2ModelsSlot#allow_interrupt}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowInterrupt() {
        return null;
    }

    /**
     * message_group block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#message_group Lexv2ModelsSlot#message_group}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMessageGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#message_selection_strategy Lexv2ModelsSlot#message_selection_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMessageSelectionStrategy() {
        return null;
    }

    /**
     * prompt_attempts_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#prompt_attempts_specification Lexv2ModelsSlot#prompt_attempts_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPromptAttemptsSpecification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotValueElicitationSettingPromptSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotValueElicitationSettingPromptSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotValueElicitationSettingPromptSpecification> {
        java.lang.Number maxRetries;
        java.lang.Object allowInterrupt;
        java.lang.Object messageGroup;
        java.lang.String messageSelectionStrategy;
        java.lang.Object promptAttemptsSpecification;

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSettingPromptSpecification#getMaxRetries}
         * @param maxRetries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#max_retries Lexv2ModelsSlot#max_retries}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxRetries(java.lang.Number maxRetries) {
            this.maxRetries = maxRetries;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSettingPromptSpecification#getAllowInterrupt}
         * @param allowInterrupt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#allow_interrupt Lexv2ModelsSlot#allow_interrupt}.
         * @return {@code this}
         */
        public Builder allowInterrupt(java.lang.Boolean allowInterrupt) {
            this.allowInterrupt = allowInterrupt;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSettingPromptSpecification#getAllowInterrupt}
         * @param allowInterrupt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#allow_interrupt Lexv2ModelsSlot#allow_interrupt}.
         * @return {@code this}
         */
        public Builder allowInterrupt(com.hashicorp.cdktf.IResolvable allowInterrupt) {
            this.allowInterrupt = allowInterrupt;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSettingPromptSpecification#getMessageGroup}
         * @param messageGroup message_group block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#message_group Lexv2ModelsSlot#message_group}
         * @return {@code this}
         */
        public Builder messageGroup(com.hashicorp.cdktf.IResolvable messageGroup) {
            this.messageGroup = messageGroup;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSettingPromptSpecification#getMessageGroup}
         * @param messageGroup message_group block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#message_group Lexv2ModelsSlot#message_group}
         * @return {@code this}
         */
        public Builder messageGroup(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingPromptSpecificationMessageGroup> messageGroup) {
            this.messageGroup = messageGroup;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSettingPromptSpecification#getMessageSelectionStrategy}
         * @param messageSelectionStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#message_selection_strategy Lexv2ModelsSlot#message_selection_strategy}.
         * @return {@code this}
         */
        public Builder messageSelectionStrategy(java.lang.String messageSelectionStrategy) {
            this.messageSelectionStrategy = messageSelectionStrategy;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSettingPromptSpecification#getPromptAttemptsSpecification}
         * @param promptAttemptsSpecification prompt_attempts_specification block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#prompt_attempts_specification Lexv2ModelsSlot#prompt_attempts_specification}
         * @return {@code this}
         */
        public Builder promptAttemptsSpecification(com.hashicorp.cdktf.IResolvable promptAttemptsSpecification) {
            this.promptAttemptsSpecification = promptAttemptsSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSettingPromptSpecification#getPromptAttemptsSpecification}
         * @param promptAttemptsSpecification prompt_attempts_specification block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#prompt_attempts_specification Lexv2ModelsSlot#prompt_attempts_specification}
         * @return {@code this}
         */
        public Builder promptAttemptsSpecification(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingPromptSpecificationPromptAttemptsSpecification> promptAttemptsSpecification) {
            this.promptAttemptsSpecification = promptAttemptsSpecification;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotValueElicitationSettingPromptSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotValueElicitationSettingPromptSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotValueElicitationSettingPromptSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotValueElicitationSettingPromptSpecification {
        private final java.lang.Number maxRetries;
        private final java.lang.Object allowInterrupt;
        private final java.lang.Object messageGroup;
        private final java.lang.String messageSelectionStrategy;
        private final java.lang.Object promptAttemptsSpecification;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxRetries = software.amazon.jsii.Kernel.get(this, "maxRetries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.allowInterrupt = software.amazon.jsii.Kernel.get(this, "allowInterrupt", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.messageGroup = software.amazon.jsii.Kernel.get(this, "messageGroup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.messageSelectionStrategy = software.amazon.jsii.Kernel.get(this, "messageSelectionStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.promptAttemptsSpecification = software.amazon.jsii.Kernel.get(this, "promptAttemptsSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxRetries = java.util.Objects.requireNonNull(builder.maxRetries, "maxRetries is required");
            this.allowInterrupt = builder.allowInterrupt;
            this.messageGroup = builder.messageGroup;
            this.messageSelectionStrategy = builder.messageSelectionStrategy;
            this.promptAttemptsSpecification = builder.promptAttemptsSpecification;
        }

        @Override
        public final java.lang.Number getMaxRetries() {
            return this.maxRetries;
        }

        @Override
        public final java.lang.Object getAllowInterrupt() {
            return this.allowInterrupt;
        }

        @Override
        public final java.lang.Object getMessageGroup() {
            return this.messageGroup;
        }

        @Override
        public final java.lang.String getMessageSelectionStrategy() {
            return this.messageSelectionStrategy;
        }

        @Override
        public final java.lang.Object getPromptAttemptsSpecification() {
            return this.promptAttemptsSpecification;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxRetries", om.valueToTree(this.getMaxRetries()));
            if (this.getAllowInterrupt() != null) {
                data.set("allowInterrupt", om.valueToTree(this.getAllowInterrupt()));
            }
            if (this.getMessageGroup() != null) {
                data.set("messageGroup", om.valueToTree(this.getMessageGroup()));
            }
            if (this.getMessageSelectionStrategy() != null) {
                data.set("messageSelectionStrategy", om.valueToTree(this.getMessageSelectionStrategy()));
            }
            if (this.getPromptAttemptsSpecification() != null) {
                data.set("promptAttemptsSpecification", om.valueToTree(this.getPromptAttemptsSpecification()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlot.Lexv2ModelsSlotValueElicitationSettingPromptSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotValueElicitationSettingPromptSpecification.Jsii$Proxy that = (Lexv2ModelsSlotValueElicitationSettingPromptSpecification.Jsii$Proxy) o;

            if (!maxRetries.equals(that.maxRetries)) return false;
            if (this.allowInterrupt != null ? !this.allowInterrupt.equals(that.allowInterrupt) : that.allowInterrupt != null) return false;
            if (this.messageGroup != null ? !this.messageGroup.equals(that.messageGroup) : that.messageGroup != null) return false;
            if (this.messageSelectionStrategy != null ? !this.messageSelectionStrategy.equals(that.messageSelectionStrategy) : that.messageSelectionStrategy != null) return false;
            return this.promptAttemptsSpecification != null ? this.promptAttemptsSpecification.equals(that.promptAttemptsSpecification) : that.promptAttemptsSpecification == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxRetries.hashCode();
            result = 31 * result + (this.allowInterrupt != null ? this.allowInterrupt.hashCode() : 0);
            result = 31 * result + (this.messageGroup != null ? this.messageGroup.hashCode() : 0);
            result = 31 * result + (this.messageSelectionStrategy != null ? this.messageSelectionStrategy.hashCode() : 0);
            result = 31 * result + (this.promptAttemptsSpecification != null ? this.promptAttemptsSpecification.hashCode() : 0);
            return result;
        }
    }
}
