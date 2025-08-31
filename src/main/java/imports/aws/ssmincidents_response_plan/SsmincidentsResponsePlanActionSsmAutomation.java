package imports.aws.ssmincidents_response_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.516Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanActionSsmAutomation")
@software.amazon.jsii.Jsii.Proxy(SsmincidentsResponsePlanActionSsmAutomation.Jsii$Proxy.class)
public interface SsmincidentsResponsePlanActionSsmAutomation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#document_name SsmincidentsResponsePlan#document_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDocumentName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#role_arn SsmincidentsResponsePlan#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#document_version SsmincidentsResponsePlan#document_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDocumentVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#dynamic_parameters SsmincidentsResponsePlan#dynamic_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getDynamicParameters() {
        return null;
    }

    /**
     * parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#parameter SsmincidentsResponsePlan#parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParameter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#target_account SsmincidentsResponsePlan#target_account}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetAccount() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmincidentsResponsePlanActionSsmAutomation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmincidentsResponsePlanActionSsmAutomation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmincidentsResponsePlanActionSsmAutomation> {
        java.lang.String documentName;
        java.lang.String roleArn;
        java.lang.String documentVersion;
        java.util.Map<java.lang.String, java.lang.String> dynamicParameters;
        java.lang.Object parameter;
        java.lang.String targetAccount;

        /**
         * Sets the value of {@link SsmincidentsResponsePlanActionSsmAutomation#getDocumentName}
         * @param documentName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#document_name SsmincidentsResponsePlan#document_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder documentName(java.lang.String documentName) {
            this.documentName = documentName;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanActionSsmAutomation#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#role_arn SsmincidentsResponsePlan#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanActionSsmAutomation#getDocumentVersion}
         * @param documentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#document_version SsmincidentsResponsePlan#document_version}.
         * @return {@code this}
         */
        public Builder documentVersion(java.lang.String documentVersion) {
            this.documentVersion = documentVersion;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanActionSsmAutomation#getDynamicParameters}
         * @param dynamicParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#dynamic_parameters SsmincidentsResponsePlan#dynamic_parameters}.
         * @return {@code this}
         */
        public Builder dynamicParameters(java.util.Map<java.lang.String, java.lang.String> dynamicParameters) {
            this.dynamicParameters = dynamicParameters;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanActionSsmAutomation#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#parameter SsmincidentsResponsePlan#parameter}
         * @return {@code this}
         */
        public Builder parameter(com.hashicorp.cdktf.IResolvable parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanActionSsmAutomation#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#parameter SsmincidentsResponsePlan#parameter}
         * @return {@code this}
         */
        public Builder parameter(java.util.List<? extends imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanActionSsmAutomationParameter> parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanActionSsmAutomation#getTargetAccount}
         * @param targetAccount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#target_account SsmincidentsResponsePlan#target_account}.
         * @return {@code this}
         */
        public Builder targetAccount(java.lang.String targetAccount) {
            this.targetAccount = targetAccount;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmincidentsResponsePlanActionSsmAutomation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmincidentsResponsePlanActionSsmAutomation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmincidentsResponsePlanActionSsmAutomation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmincidentsResponsePlanActionSsmAutomation {
        private final java.lang.String documentName;
        private final java.lang.String roleArn;
        private final java.lang.String documentVersion;
        private final java.util.Map<java.lang.String, java.lang.String> dynamicParameters;
        private final java.lang.Object parameter;
        private final java.lang.String targetAccount;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.documentName = software.amazon.jsii.Kernel.get(this, "documentName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.documentVersion = software.amazon.jsii.Kernel.get(this, "documentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dynamicParameters = software.amazon.jsii.Kernel.get(this, "dynamicParameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.parameter = software.amazon.jsii.Kernel.get(this, "parameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.targetAccount = software.amazon.jsii.Kernel.get(this, "targetAccount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.documentName = java.util.Objects.requireNonNull(builder.documentName, "documentName is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.documentVersion = builder.documentVersion;
            this.dynamicParameters = builder.dynamicParameters;
            this.parameter = builder.parameter;
            this.targetAccount = builder.targetAccount;
        }

        @Override
        public final java.lang.String getDocumentName() {
            return this.documentName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getDocumentVersion() {
            return this.documentVersion;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getDynamicParameters() {
            return this.dynamicParameters;
        }

        @Override
        public final java.lang.Object getParameter() {
            return this.parameter;
        }

        @Override
        public final java.lang.String getTargetAccount() {
            return this.targetAccount;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("documentName", om.valueToTree(this.getDocumentName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getDocumentVersion() != null) {
                data.set("documentVersion", om.valueToTree(this.getDocumentVersion()));
            }
            if (this.getDynamicParameters() != null) {
                data.set("dynamicParameters", om.valueToTree(this.getDynamicParameters()));
            }
            if (this.getParameter() != null) {
                data.set("parameter", om.valueToTree(this.getParameter()));
            }
            if (this.getTargetAccount() != null) {
                data.set("targetAccount", om.valueToTree(this.getTargetAccount()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanActionSsmAutomation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmincidentsResponsePlanActionSsmAutomation.Jsii$Proxy that = (SsmincidentsResponsePlanActionSsmAutomation.Jsii$Proxy) o;

            if (!documentName.equals(that.documentName)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.documentVersion != null ? !this.documentVersion.equals(that.documentVersion) : that.documentVersion != null) return false;
            if (this.dynamicParameters != null ? !this.dynamicParameters.equals(that.dynamicParameters) : that.dynamicParameters != null) return false;
            if (this.parameter != null ? !this.parameter.equals(that.parameter) : that.parameter != null) return false;
            return this.targetAccount != null ? this.targetAccount.equals(that.targetAccount) : that.targetAccount == null;
        }

        @Override
        public final int hashCode() {
            int result = this.documentName.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.documentVersion != null ? this.documentVersion.hashCode() : 0);
            result = 31 * result + (this.dynamicParameters != null ? this.dynamicParameters.hashCode() : 0);
            result = 31 * result + (this.parameter != null ? this.parameter.hashCode() : 0);
            result = 31 * result + (this.targetAccount != null ? this.targetAccount.hashCode() : 0);
            return result;
        }
    }
}
