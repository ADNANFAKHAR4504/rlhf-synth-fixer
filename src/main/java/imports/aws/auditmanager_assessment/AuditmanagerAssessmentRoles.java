package imports.aws.auditmanager_assessment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.086Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.auditmanagerAssessment.AuditmanagerAssessmentRoles")
@software.amazon.jsii.Jsii.Proxy(AuditmanagerAssessmentRoles.Jsii$Proxy.class)
public interface AuditmanagerAssessmentRoles extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_assessment#role_arn AuditmanagerAssessment#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_assessment#role_type AuditmanagerAssessment#role_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleType();

    /**
     * @return a {@link Builder} of {@link AuditmanagerAssessmentRoles}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AuditmanagerAssessmentRoles}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AuditmanagerAssessmentRoles> {
        java.lang.String roleArn;
        java.lang.String roleType;

        /**
         * Sets the value of {@link AuditmanagerAssessmentRoles#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_assessment#role_arn AuditmanagerAssessment#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link AuditmanagerAssessmentRoles#getRoleType}
         * @param roleType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/auditmanager_assessment#role_type AuditmanagerAssessment#role_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleType(java.lang.String roleType) {
            this.roleType = roleType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AuditmanagerAssessmentRoles}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AuditmanagerAssessmentRoles build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AuditmanagerAssessmentRoles}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AuditmanagerAssessmentRoles {
        private final java.lang.String roleArn;
        private final java.lang.String roleType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleType = software.amazon.jsii.Kernel.get(this, "roleType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.roleType = java.util.Objects.requireNonNull(builder.roleType, "roleType is required");
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getRoleType() {
            return this.roleType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("roleType", om.valueToTree(this.getRoleType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.auditmanagerAssessment.AuditmanagerAssessmentRoles"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AuditmanagerAssessmentRoles.Jsii$Proxy that = (AuditmanagerAssessmentRoles.Jsii$Proxy) o;

            if (!roleArn.equals(that.roleArn)) return false;
            return this.roleType.equals(that.roleType);
        }

        @Override
        public final int hashCode() {
            int result = this.roleArn.hashCode();
            result = 31 * result + (this.roleType.hashCode());
            return result;
        }
    }
}
