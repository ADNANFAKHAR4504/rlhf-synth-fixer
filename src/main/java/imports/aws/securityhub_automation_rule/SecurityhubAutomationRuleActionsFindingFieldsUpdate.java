package imports.aws.securityhub_automation_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.370Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdate")
@software.amazon.jsii.Jsii.Proxy(SecurityhubAutomationRuleActionsFindingFieldsUpdate.Jsii$Proxy.class)
public interface SecurityhubAutomationRuleActionsFindingFieldsUpdate extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#confidence SecurityhubAutomationRule#confidence}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getConfidence() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#criticality SecurityhubAutomationRule#criticality}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCriticality() {
        return null;
    }

    /**
     * note block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#note SecurityhubAutomationRule#note}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNote() {
        return null;
    }

    /**
     * related_findings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#related_findings SecurityhubAutomationRule#related_findings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRelatedFindings() {
        return null;
    }

    /**
     * severity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#severity SecurityhubAutomationRule#severity}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSeverity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#types SecurityhubAutomationRule#types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#user_defined_fields SecurityhubAutomationRule#user_defined_fields}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getUserDefinedFields() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#verification_state SecurityhubAutomationRule#verification_state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVerificationState() {
        return null;
    }

    /**
     * workflow block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#workflow SecurityhubAutomationRule#workflow}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWorkflow() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityhubAutomationRuleActionsFindingFieldsUpdate> {
        java.lang.Number confidence;
        java.lang.Number criticality;
        java.lang.Object note;
        java.lang.Object relatedFindings;
        java.lang.Object severity;
        java.util.List<java.lang.String> types;
        java.util.Map<java.lang.String, java.lang.String> userDefinedFields;
        java.lang.String verificationState;
        java.lang.Object workflow;

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getConfidence}
         * @param confidence Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#confidence SecurityhubAutomationRule#confidence}.
         * @return {@code this}
         */
        public Builder confidence(java.lang.Number confidence) {
            this.confidence = confidence;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getCriticality}
         * @param criticality Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#criticality SecurityhubAutomationRule#criticality}.
         * @return {@code this}
         */
        public Builder criticality(java.lang.Number criticality) {
            this.criticality = criticality;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getNote}
         * @param note note block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#note SecurityhubAutomationRule#note}
         * @return {@code this}
         */
        public Builder note(com.hashicorp.cdktf.IResolvable note) {
            this.note = note;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getNote}
         * @param note note block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#note SecurityhubAutomationRule#note}
         * @return {@code this}
         */
        public Builder note(java.util.List<? extends imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateNote> note) {
            this.note = note;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getRelatedFindings}
         * @param relatedFindings related_findings block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#related_findings SecurityhubAutomationRule#related_findings}
         * @return {@code this}
         */
        public Builder relatedFindings(com.hashicorp.cdktf.IResolvable relatedFindings) {
            this.relatedFindings = relatedFindings;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getRelatedFindings}
         * @param relatedFindings related_findings block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#related_findings SecurityhubAutomationRule#related_findings}
         * @return {@code this}
         */
        public Builder relatedFindings(java.util.List<? extends imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateRelatedFindings> relatedFindings) {
            this.relatedFindings = relatedFindings;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getSeverity}
         * @param severity severity block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#severity SecurityhubAutomationRule#severity}
         * @return {@code this}
         */
        public Builder severity(com.hashicorp.cdktf.IResolvable severity) {
            this.severity = severity;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getSeverity}
         * @param severity severity block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#severity SecurityhubAutomationRule#severity}
         * @return {@code this}
         */
        public Builder severity(java.util.List<? extends imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity> severity) {
            this.severity = severity;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getTypes}
         * @param types Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#types SecurityhubAutomationRule#types}.
         * @return {@code this}
         */
        public Builder types(java.util.List<java.lang.String> types) {
            this.types = types;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getUserDefinedFields}
         * @param userDefinedFields Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#user_defined_fields SecurityhubAutomationRule#user_defined_fields}.
         * @return {@code this}
         */
        public Builder userDefinedFields(java.util.Map<java.lang.String, java.lang.String> userDefinedFields) {
            this.userDefinedFields = userDefinedFields;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getVerificationState}
         * @param verificationState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#verification_state SecurityhubAutomationRule#verification_state}.
         * @return {@code this}
         */
        public Builder verificationState(java.lang.String verificationState) {
            this.verificationState = verificationState;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getWorkflow}
         * @param workflow workflow block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#workflow SecurityhubAutomationRule#workflow}
         * @return {@code this}
         */
        public Builder workflow(com.hashicorp.cdktf.IResolvable workflow) {
            this.workflow = workflow;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate#getWorkflow}
         * @param workflow workflow block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#workflow SecurityhubAutomationRule#workflow}
         * @return {@code this}
         */
        public Builder workflow(java.util.List<? extends imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdateWorkflow> workflow) {
            this.workflow = workflow;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityhubAutomationRuleActionsFindingFieldsUpdate build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityhubAutomationRuleActionsFindingFieldsUpdate}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityhubAutomationRuleActionsFindingFieldsUpdate {
        private final java.lang.Number confidence;
        private final java.lang.Number criticality;
        private final java.lang.Object note;
        private final java.lang.Object relatedFindings;
        private final java.lang.Object severity;
        private final java.util.List<java.lang.String> types;
        private final java.util.Map<java.lang.String, java.lang.String> userDefinedFields;
        private final java.lang.String verificationState;
        private final java.lang.Object workflow;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.confidence = software.amazon.jsii.Kernel.get(this, "confidence", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.criticality = software.amazon.jsii.Kernel.get(this, "criticality", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.note = software.amazon.jsii.Kernel.get(this, "note", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.relatedFindings = software.amazon.jsii.Kernel.get(this, "relatedFindings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.severity = software.amazon.jsii.Kernel.get(this, "severity", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.types = software.amazon.jsii.Kernel.get(this, "types", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.userDefinedFields = software.amazon.jsii.Kernel.get(this, "userDefinedFields", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.verificationState = software.amazon.jsii.Kernel.get(this, "verificationState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.workflow = software.amazon.jsii.Kernel.get(this, "workflow", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.confidence = builder.confidence;
            this.criticality = builder.criticality;
            this.note = builder.note;
            this.relatedFindings = builder.relatedFindings;
            this.severity = builder.severity;
            this.types = builder.types;
            this.userDefinedFields = builder.userDefinedFields;
            this.verificationState = builder.verificationState;
            this.workflow = builder.workflow;
        }

        @Override
        public final java.lang.Number getConfidence() {
            return this.confidence;
        }

        @Override
        public final java.lang.Number getCriticality() {
            return this.criticality;
        }

        @Override
        public final java.lang.Object getNote() {
            return this.note;
        }

        @Override
        public final java.lang.Object getRelatedFindings() {
            return this.relatedFindings;
        }

        @Override
        public final java.lang.Object getSeverity() {
            return this.severity;
        }

        @Override
        public final java.util.List<java.lang.String> getTypes() {
            return this.types;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getUserDefinedFields() {
            return this.userDefinedFields;
        }

        @Override
        public final java.lang.String getVerificationState() {
            return this.verificationState;
        }

        @Override
        public final java.lang.Object getWorkflow() {
            return this.workflow;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConfidence() != null) {
                data.set("confidence", om.valueToTree(this.getConfidence()));
            }
            if (this.getCriticality() != null) {
                data.set("criticality", om.valueToTree(this.getCriticality()));
            }
            if (this.getNote() != null) {
                data.set("note", om.valueToTree(this.getNote()));
            }
            if (this.getRelatedFindings() != null) {
                data.set("relatedFindings", om.valueToTree(this.getRelatedFindings()));
            }
            if (this.getSeverity() != null) {
                data.set("severity", om.valueToTree(this.getSeverity()));
            }
            if (this.getTypes() != null) {
                data.set("types", om.valueToTree(this.getTypes()));
            }
            if (this.getUserDefinedFields() != null) {
                data.set("userDefinedFields", om.valueToTree(this.getUserDefinedFields()));
            }
            if (this.getVerificationState() != null) {
                data.set("verificationState", om.valueToTree(this.getVerificationState()));
            }
            if (this.getWorkflow() != null) {
                data.set("workflow", om.valueToTree(this.getWorkflow()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdate"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityhubAutomationRuleActionsFindingFieldsUpdate.Jsii$Proxy that = (SecurityhubAutomationRuleActionsFindingFieldsUpdate.Jsii$Proxy) o;

            if (this.confidence != null ? !this.confidence.equals(that.confidence) : that.confidence != null) return false;
            if (this.criticality != null ? !this.criticality.equals(that.criticality) : that.criticality != null) return false;
            if (this.note != null ? !this.note.equals(that.note) : that.note != null) return false;
            if (this.relatedFindings != null ? !this.relatedFindings.equals(that.relatedFindings) : that.relatedFindings != null) return false;
            if (this.severity != null ? !this.severity.equals(that.severity) : that.severity != null) return false;
            if (this.types != null ? !this.types.equals(that.types) : that.types != null) return false;
            if (this.userDefinedFields != null ? !this.userDefinedFields.equals(that.userDefinedFields) : that.userDefinedFields != null) return false;
            if (this.verificationState != null ? !this.verificationState.equals(that.verificationState) : that.verificationState != null) return false;
            return this.workflow != null ? this.workflow.equals(that.workflow) : that.workflow == null;
        }

        @Override
        public final int hashCode() {
            int result = this.confidence != null ? this.confidence.hashCode() : 0;
            result = 31 * result + (this.criticality != null ? this.criticality.hashCode() : 0);
            result = 31 * result + (this.note != null ? this.note.hashCode() : 0);
            result = 31 * result + (this.relatedFindings != null ? this.relatedFindings.hashCode() : 0);
            result = 31 * result + (this.severity != null ? this.severity.hashCode() : 0);
            result = 31 * result + (this.types != null ? this.types.hashCode() : 0);
            result = 31 * result + (this.userDefinedFields != null ? this.userDefinedFields.hashCode() : 0);
            result = 31 * result + (this.verificationState != null ? this.verificationState.hashCode() : 0);
            result = 31 * result + (this.workflow != null ? this.workflow.hashCode() : 0);
            return result;
        }
    }
}
