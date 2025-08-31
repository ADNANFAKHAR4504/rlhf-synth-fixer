package imports.aws.auditmanager_assessment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.086Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.auditmanagerAssessment.AuditmanagerAssessmentScope")
@software.amazon.jsii.Jsii.Proxy(AuditmanagerAssessmentScope.Jsii$Proxy.class)
public interface AuditmanagerAssessmentScope extends software.amazon.jsii.JsiiSerializable {

    /**
     * aws_accounts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_assessment#aws_accounts AuditmanagerAssessment#aws_accounts}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAwsAccounts() {
        return null;
    }

    /**
     * aws_services block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_assessment#aws_services AuditmanagerAssessment#aws_services}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAwsServices() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AuditmanagerAssessmentScope}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AuditmanagerAssessmentScope}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AuditmanagerAssessmentScope> {
        java.lang.Object awsAccounts;
        java.lang.Object awsServices;

        /**
         * Sets the value of {@link AuditmanagerAssessmentScope#getAwsAccounts}
         * @param awsAccounts aws_accounts block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_assessment#aws_accounts AuditmanagerAssessment#aws_accounts}
         * @return {@code this}
         */
        public Builder awsAccounts(com.hashicorp.cdktf.IResolvable awsAccounts) {
            this.awsAccounts = awsAccounts;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerAssessmentScope#getAwsAccounts}
         * @param awsAccounts aws_accounts block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_assessment#aws_accounts AuditmanagerAssessment#aws_accounts}
         * @return {@code this}
         */
        public Builder awsAccounts(java.util.List<? extends imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsAccounts> awsAccounts) {
            this.awsAccounts = awsAccounts;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerAssessmentScope#getAwsServices}
         * @param awsServices aws_services block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_assessment#aws_services AuditmanagerAssessment#aws_services}
         * @return {@code this}
         */
        public Builder awsServices(com.hashicorp.cdktf.IResolvable awsServices) {
            this.awsServices = awsServices;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerAssessmentScope#getAwsServices}
         * @param awsServices aws_services block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_assessment#aws_services AuditmanagerAssessment#aws_services}
         * @return {@code this}
         */
        public Builder awsServices(java.util.List<? extends imports.aws.auditmanager_assessment.AuditmanagerAssessmentScopeAwsServices> awsServices) {
            this.awsServices = awsServices;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AuditmanagerAssessmentScope}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AuditmanagerAssessmentScope build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AuditmanagerAssessmentScope}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AuditmanagerAssessmentScope {
        private final java.lang.Object awsAccounts;
        private final java.lang.Object awsServices;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.awsAccounts = software.amazon.jsii.Kernel.get(this, "awsAccounts", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.awsServices = software.amazon.jsii.Kernel.get(this, "awsServices", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.awsAccounts = builder.awsAccounts;
            this.awsServices = builder.awsServices;
        }

        @Override
        public final java.lang.Object getAwsAccounts() {
            return this.awsAccounts;
        }

        @Override
        public final java.lang.Object getAwsServices() {
            return this.awsServices;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAwsAccounts() != null) {
                data.set("awsAccounts", om.valueToTree(this.getAwsAccounts()));
            }
            if (this.getAwsServices() != null) {
                data.set("awsServices", om.valueToTree(this.getAwsServices()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.auditmanagerAssessment.AuditmanagerAssessmentScope"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AuditmanagerAssessmentScope.Jsii$Proxy that = (AuditmanagerAssessmentScope.Jsii$Proxy) o;

            if (this.awsAccounts != null ? !this.awsAccounts.equals(that.awsAccounts) : that.awsAccounts != null) return false;
            return this.awsServices != null ? this.awsServices.equals(that.awsServices) : that.awsServices == null;
        }

        @Override
        public final int hashCode() {
            int result = this.awsAccounts != null ? this.awsAccounts.hashCode() : 0;
            result = 31 * result + (this.awsServices != null ? this.awsServices.hashCode() : 0);
            return result;
        }
    }
}
