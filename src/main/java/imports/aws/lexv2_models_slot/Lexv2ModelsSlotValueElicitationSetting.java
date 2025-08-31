package imports.aws.lexv2_models_slot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.795Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlot.Lexv2ModelsSlotValueElicitationSetting")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotValueElicitationSetting.Jsii$Proxy.class)
public interface Lexv2ModelsSlotValueElicitationSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_constraint Lexv2ModelsSlot#slot_constraint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSlotConstraint();

    /**
     * default_value_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#default_value_specification Lexv2ModelsSlot#default_value_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDefaultValueSpecification() {
        return null;
    }

    /**
     * prompt_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#prompt_specification Lexv2ModelsSlot#prompt_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPromptSpecification() {
        return null;
    }

    /**
     * sample_utterance block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#sample_utterance Lexv2ModelsSlot#sample_utterance}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSampleUtterance() {
        return null;
    }

    /**
     * slot_resolution_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_resolution_setting Lexv2ModelsSlot#slot_resolution_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSlotResolutionSetting() {
        return null;
    }

    /**
     * wait_and_continue_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#wait_and_continue_specification Lexv2ModelsSlot#wait_and_continue_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWaitAndContinueSpecification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotValueElicitationSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotValueElicitationSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotValueElicitationSetting> {
        java.lang.String slotConstraint;
        java.lang.Object defaultValueSpecification;
        java.lang.Object promptSpecification;
        java.lang.Object sampleUtterance;
        java.lang.Object slotResolutionSetting;
        java.lang.Object waitAndContinueSpecification;

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSetting#getSlotConstraint}
         * @param slotConstraint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_constraint Lexv2ModelsSlot#slot_constraint}. This parameter is required.
         * @return {@code this}
         */
        public Builder slotConstraint(java.lang.String slotConstraint) {
            this.slotConstraint = slotConstraint;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSetting#getDefaultValueSpecification}
         * @param defaultValueSpecification default_value_specification block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#default_value_specification Lexv2ModelsSlot#default_value_specification}
         * @return {@code this}
         */
        public Builder defaultValueSpecification(com.hashicorp.cdktf.IResolvable defaultValueSpecification) {
            this.defaultValueSpecification = defaultValueSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSetting#getDefaultValueSpecification}
         * @param defaultValueSpecification default_value_specification block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#default_value_specification Lexv2ModelsSlot#default_value_specification}
         * @return {@code this}
         */
        public Builder defaultValueSpecification(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingDefaultValueSpecification> defaultValueSpecification) {
            this.defaultValueSpecification = defaultValueSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSetting#getPromptSpecification}
         * @param promptSpecification prompt_specification block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#prompt_specification Lexv2ModelsSlot#prompt_specification}
         * @return {@code this}
         */
        public Builder promptSpecification(com.hashicorp.cdktf.IResolvable promptSpecification) {
            this.promptSpecification = promptSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSetting#getPromptSpecification}
         * @param promptSpecification prompt_specification block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#prompt_specification Lexv2ModelsSlot#prompt_specification}
         * @return {@code this}
         */
        public Builder promptSpecification(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingPromptSpecification> promptSpecification) {
            this.promptSpecification = promptSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSetting#getSampleUtterance}
         * @param sampleUtterance sample_utterance block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#sample_utterance Lexv2ModelsSlot#sample_utterance}
         * @return {@code this}
         */
        public Builder sampleUtterance(com.hashicorp.cdktf.IResolvable sampleUtterance) {
            this.sampleUtterance = sampleUtterance;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSetting#getSampleUtterance}
         * @param sampleUtterance sample_utterance block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#sample_utterance Lexv2ModelsSlot#sample_utterance}
         * @return {@code this}
         */
        public Builder sampleUtterance(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSampleUtterance> sampleUtterance) {
            this.sampleUtterance = sampleUtterance;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSetting#getSlotResolutionSetting}
         * @param slotResolutionSetting slot_resolution_setting block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_resolution_setting Lexv2ModelsSlot#slot_resolution_setting}
         * @return {@code this}
         */
        public Builder slotResolutionSetting(com.hashicorp.cdktf.IResolvable slotResolutionSetting) {
            this.slotResolutionSetting = slotResolutionSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSetting#getSlotResolutionSetting}
         * @param slotResolutionSetting slot_resolution_setting block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_resolution_setting Lexv2ModelsSlot#slot_resolution_setting}
         * @return {@code this}
         */
        public Builder slotResolutionSetting(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting> slotResolutionSetting) {
            this.slotResolutionSetting = slotResolutionSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSetting#getWaitAndContinueSpecification}
         * @param waitAndContinueSpecification wait_and_continue_specification block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#wait_and_continue_specification Lexv2ModelsSlot#wait_and_continue_specification}
         * @return {@code this}
         */
        public Builder waitAndContinueSpecification(com.hashicorp.cdktf.IResolvable waitAndContinueSpecification) {
            this.waitAndContinueSpecification = waitAndContinueSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSetting#getWaitAndContinueSpecification}
         * @param waitAndContinueSpecification wait_and_continue_specification block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#wait_and_continue_specification Lexv2ModelsSlot#wait_and_continue_specification}
         * @return {@code this}
         */
        public Builder waitAndContinueSpecification(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotValueElicitationSettingWaitAndContinueSpecification> waitAndContinueSpecification) {
            this.waitAndContinueSpecification = waitAndContinueSpecification;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotValueElicitationSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotValueElicitationSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotValueElicitationSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotValueElicitationSetting {
        private final java.lang.String slotConstraint;
        private final java.lang.Object defaultValueSpecification;
        private final java.lang.Object promptSpecification;
        private final java.lang.Object sampleUtterance;
        private final java.lang.Object slotResolutionSetting;
        private final java.lang.Object waitAndContinueSpecification;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.slotConstraint = software.amazon.jsii.Kernel.get(this, "slotConstraint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultValueSpecification = software.amazon.jsii.Kernel.get(this, "defaultValueSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.promptSpecification = software.amazon.jsii.Kernel.get(this, "promptSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sampleUtterance = software.amazon.jsii.Kernel.get(this, "sampleUtterance", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.slotResolutionSetting = software.amazon.jsii.Kernel.get(this, "slotResolutionSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.waitAndContinueSpecification = software.amazon.jsii.Kernel.get(this, "waitAndContinueSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.slotConstraint = java.util.Objects.requireNonNull(builder.slotConstraint, "slotConstraint is required");
            this.defaultValueSpecification = builder.defaultValueSpecification;
            this.promptSpecification = builder.promptSpecification;
            this.sampleUtterance = builder.sampleUtterance;
            this.slotResolutionSetting = builder.slotResolutionSetting;
            this.waitAndContinueSpecification = builder.waitAndContinueSpecification;
        }

        @Override
        public final java.lang.String getSlotConstraint() {
            return this.slotConstraint;
        }

        @Override
        public final java.lang.Object getDefaultValueSpecification() {
            return this.defaultValueSpecification;
        }

        @Override
        public final java.lang.Object getPromptSpecification() {
            return this.promptSpecification;
        }

        @Override
        public final java.lang.Object getSampleUtterance() {
            return this.sampleUtterance;
        }

        @Override
        public final java.lang.Object getSlotResolutionSetting() {
            return this.slotResolutionSetting;
        }

        @Override
        public final java.lang.Object getWaitAndContinueSpecification() {
            return this.waitAndContinueSpecification;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("slotConstraint", om.valueToTree(this.getSlotConstraint()));
            if (this.getDefaultValueSpecification() != null) {
                data.set("defaultValueSpecification", om.valueToTree(this.getDefaultValueSpecification()));
            }
            if (this.getPromptSpecification() != null) {
                data.set("promptSpecification", om.valueToTree(this.getPromptSpecification()));
            }
            if (this.getSampleUtterance() != null) {
                data.set("sampleUtterance", om.valueToTree(this.getSampleUtterance()));
            }
            if (this.getSlotResolutionSetting() != null) {
                data.set("slotResolutionSetting", om.valueToTree(this.getSlotResolutionSetting()));
            }
            if (this.getWaitAndContinueSpecification() != null) {
                data.set("waitAndContinueSpecification", om.valueToTree(this.getWaitAndContinueSpecification()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlot.Lexv2ModelsSlotValueElicitationSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotValueElicitationSetting.Jsii$Proxy that = (Lexv2ModelsSlotValueElicitationSetting.Jsii$Proxy) o;

            if (!slotConstraint.equals(that.slotConstraint)) return false;
            if (this.defaultValueSpecification != null ? !this.defaultValueSpecification.equals(that.defaultValueSpecification) : that.defaultValueSpecification != null) return false;
            if (this.promptSpecification != null ? !this.promptSpecification.equals(that.promptSpecification) : that.promptSpecification != null) return false;
            if (this.sampleUtterance != null ? !this.sampleUtterance.equals(that.sampleUtterance) : that.sampleUtterance != null) return false;
            if (this.slotResolutionSetting != null ? !this.slotResolutionSetting.equals(that.slotResolutionSetting) : that.slotResolutionSetting != null) return false;
            return this.waitAndContinueSpecification != null ? this.waitAndContinueSpecification.equals(that.waitAndContinueSpecification) : that.waitAndContinueSpecification == null;
        }

        @Override
        public final int hashCode() {
            int result = this.slotConstraint.hashCode();
            result = 31 * result + (this.defaultValueSpecification != null ? this.defaultValueSpecification.hashCode() : 0);
            result = 31 * result + (this.promptSpecification != null ? this.promptSpecification.hashCode() : 0);
            result = 31 * result + (this.sampleUtterance != null ? this.sampleUtterance.hashCode() : 0);
            result = 31 * result + (this.slotResolutionSetting != null ? this.slotResolutionSetting.hashCode() : 0);
            result = 31 * result + (this.waitAndContinueSpecification != null ? this.waitAndContinueSpecification.hashCode() : 0);
            return result;
        }
    }
}
