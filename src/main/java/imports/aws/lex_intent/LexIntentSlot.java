package imports.aws.lex_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.543Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexIntent.LexIntentSlot")
@software.amazon.jsii.Jsii.Proxy(LexIntentSlot.Jsii$Proxy.class)
public interface LexIntentSlot extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#name LexIntent#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#slot_constraint LexIntent#slot_constraint}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSlotConstraint();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#slot_type LexIntent#slot_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSlotType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#description LexIntent#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#priority LexIntent#priority}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPriority() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#response_card LexIntent#response_card}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResponseCard() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#sample_utterances LexIntent#sample_utterances}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSampleUtterances() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#slot_type_version LexIntent#slot_type_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSlotTypeVersion() {
        return null;
    }

    /**
     * value_elicitation_prompt block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#value_elicitation_prompt LexIntent#value_elicitation_prompt}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentSlotValueElicitationPrompt getValueElicitationPrompt() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LexIntentSlot}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LexIntentSlot}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LexIntentSlot> {
        java.lang.String name;
        java.lang.String slotConstraint;
        java.lang.String slotType;
        java.lang.String description;
        java.lang.Number priority;
        java.lang.String responseCard;
        java.util.List<java.lang.String> sampleUtterances;
        java.lang.String slotTypeVersion;
        imports.aws.lex_intent.LexIntentSlotValueElicitationPrompt valueElicitationPrompt;

        /**
         * Sets the value of {@link LexIntentSlot#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#name LexIntent#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentSlot#getSlotConstraint}
         * @param slotConstraint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#slot_constraint LexIntent#slot_constraint}. This parameter is required.
         * @return {@code this}
         */
        public Builder slotConstraint(java.lang.String slotConstraint) {
            this.slotConstraint = slotConstraint;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentSlot#getSlotType}
         * @param slotType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#slot_type LexIntent#slot_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder slotType(java.lang.String slotType) {
            this.slotType = slotType;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentSlot#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#description LexIntent#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentSlot#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#priority LexIntent#priority}.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentSlot#getResponseCard}
         * @param responseCard Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#response_card LexIntent#response_card}.
         * @return {@code this}
         */
        public Builder responseCard(java.lang.String responseCard) {
            this.responseCard = responseCard;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentSlot#getSampleUtterances}
         * @param sampleUtterances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#sample_utterances LexIntent#sample_utterances}.
         * @return {@code this}
         */
        public Builder sampleUtterances(java.util.List<java.lang.String> sampleUtterances) {
            this.sampleUtterances = sampleUtterances;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentSlot#getSlotTypeVersion}
         * @param slotTypeVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#slot_type_version LexIntent#slot_type_version}.
         * @return {@code this}
         */
        public Builder slotTypeVersion(java.lang.String slotTypeVersion) {
            this.slotTypeVersion = slotTypeVersion;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentSlot#getValueElicitationPrompt}
         * @param valueElicitationPrompt value_elicitation_prompt block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#value_elicitation_prompt LexIntent#value_elicitation_prompt}
         * @return {@code this}
         */
        public Builder valueElicitationPrompt(imports.aws.lex_intent.LexIntentSlotValueElicitationPrompt valueElicitationPrompt) {
            this.valueElicitationPrompt = valueElicitationPrompt;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LexIntentSlot}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LexIntentSlot build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LexIntentSlot}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LexIntentSlot {
        private final java.lang.String name;
        private final java.lang.String slotConstraint;
        private final java.lang.String slotType;
        private final java.lang.String description;
        private final java.lang.Number priority;
        private final java.lang.String responseCard;
        private final java.util.List<java.lang.String> sampleUtterances;
        private final java.lang.String slotTypeVersion;
        private final imports.aws.lex_intent.LexIntentSlotValueElicitationPrompt valueElicitationPrompt;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.slotConstraint = software.amazon.jsii.Kernel.get(this, "slotConstraint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.slotType = software.amazon.jsii.Kernel.get(this, "slotType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.responseCard = software.amazon.jsii.Kernel.get(this, "responseCard", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sampleUtterances = software.amazon.jsii.Kernel.get(this, "sampleUtterances", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.slotTypeVersion = software.amazon.jsii.Kernel.get(this, "slotTypeVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.valueElicitationPrompt = software.amazon.jsii.Kernel.get(this, "valueElicitationPrompt", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentSlotValueElicitationPrompt.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.slotConstraint = java.util.Objects.requireNonNull(builder.slotConstraint, "slotConstraint is required");
            this.slotType = java.util.Objects.requireNonNull(builder.slotType, "slotType is required");
            this.description = builder.description;
            this.priority = builder.priority;
            this.responseCard = builder.responseCard;
            this.sampleUtterances = builder.sampleUtterances;
            this.slotTypeVersion = builder.slotTypeVersion;
            this.valueElicitationPrompt = builder.valueElicitationPrompt;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getSlotConstraint() {
            return this.slotConstraint;
        }

        @Override
        public final java.lang.String getSlotType() {
            return this.slotType;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final java.lang.String getResponseCard() {
            return this.responseCard;
        }

        @Override
        public final java.util.List<java.lang.String> getSampleUtterances() {
            return this.sampleUtterances;
        }

        @Override
        public final java.lang.String getSlotTypeVersion() {
            return this.slotTypeVersion;
        }

        @Override
        public final imports.aws.lex_intent.LexIntentSlotValueElicitationPrompt getValueElicitationPrompt() {
            return this.valueElicitationPrompt;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("slotConstraint", om.valueToTree(this.getSlotConstraint()));
            data.set("slotType", om.valueToTree(this.getSlotType()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getPriority() != null) {
                data.set("priority", om.valueToTree(this.getPriority()));
            }
            if (this.getResponseCard() != null) {
                data.set("responseCard", om.valueToTree(this.getResponseCard()));
            }
            if (this.getSampleUtterances() != null) {
                data.set("sampleUtterances", om.valueToTree(this.getSampleUtterances()));
            }
            if (this.getSlotTypeVersion() != null) {
                data.set("slotTypeVersion", om.valueToTree(this.getSlotTypeVersion()));
            }
            if (this.getValueElicitationPrompt() != null) {
                data.set("valueElicitationPrompt", om.valueToTree(this.getValueElicitationPrompt()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexIntent.LexIntentSlot"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LexIntentSlot.Jsii$Proxy that = (LexIntentSlot.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!slotConstraint.equals(that.slotConstraint)) return false;
            if (!slotType.equals(that.slotType)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.priority != null ? !this.priority.equals(that.priority) : that.priority != null) return false;
            if (this.responseCard != null ? !this.responseCard.equals(that.responseCard) : that.responseCard != null) return false;
            if (this.sampleUtterances != null ? !this.sampleUtterances.equals(that.sampleUtterances) : that.sampleUtterances != null) return false;
            if (this.slotTypeVersion != null ? !this.slotTypeVersion.equals(that.slotTypeVersion) : that.slotTypeVersion != null) return false;
            return this.valueElicitationPrompt != null ? this.valueElicitationPrompt.equals(that.valueElicitationPrompt) : that.valueElicitationPrompt == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.slotConstraint.hashCode());
            result = 31 * result + (this.slotType.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.priority != null ? this.priority.hashCode() : 0);
            result = 31 * result + (this.responseCard != null ? this.responseCard.hashCode() : 0);
            result = 31 * result + (this.sampleUtterances != null ? this.sampleUtterances.hashCode() : 0);
            result = 31 * result + (this.slotTypeVersion != null ? this.slotTypeVersion.hashCode() : 0);
            result = 31 * result + (this.valueElicitationPrompt != null ? this.valueElicitationPrompt.hashCode() : 0);
            return result;
        }
    }
}
