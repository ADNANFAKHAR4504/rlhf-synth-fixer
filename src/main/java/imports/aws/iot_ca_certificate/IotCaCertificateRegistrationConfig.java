package imports.aws.iot_ca_certificate;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.396Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotCaCertificate.IotCaCertificateRegistrationConfig")
@software.amazon.jsii.Jsii.Proxy(IotCaCertificateRegistrationConfig.Jsii$Proxy.class)
public interface IotCaCertificateRegistrationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_ca_certificate#role_arn IotCaCertificate#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_ca_certificate#template_body IotCaCertificate#template_body}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplateBody() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_ca_certificate#template_name IotCaCertificate#template_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplateName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IotCaCertificateRegistrationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IotCaCertificateRegistrationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IotCaCertificateRegistrationConfig> {
        java.lang.String roleArn;
        java.lang.String templateBody;
        java.lang.String templateName;

        /**
         * Sets the value of {@link IotCaCertificateRegistrationConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_ca_certificate#role_arn IotCaCertificate#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link IotCaCertificateRegistrationConfig#getTemplateBody}
         * @param templateBody Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_ca_certificate#template_body IotCaCertificate#template_body}.
         * @return {@code this}
         */
        public Builder templateBody(java.lang.String templateBody) {
            this.templateBody = templateBody;
            return this;
        }

        /**
         * Sets the value of {@link IotCaCertificateRegistrationConfig#getTemplateName}
         * @param templateName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_ca_certificate#template_name IotCaCertificate#template_name}.
         * @return {@code this}
         */
        public Builder templateName(java.lang.String templateName) {
            this.templateName = templateName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IotCaCertificateRegistrationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IotCaCertificateRegistrationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IotCaCertificateRegistrationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IotCaCertificateRegistrationConfig {
        private final java.lang.String roleArn;
        private final java.lang.String templateBody;
        private final java.lang.String templateName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.templateBody = software.amazon.jsii.Kernel.get(this, "templateBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.templateName = software.amazon.jsii.Kernel.get(this, "templateName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.roleArn = builder.roleArn;
            this.templateBody = builder.templateBody;
            this.templateName = builder.templateName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getTemplateBody() {
            return this.templateBody;
        }

        @Override
        public final java.lang.String getTemplateName() {
            return this.templateName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }
            if (this.getTemplateBody() != null) {
                data.set("templateBody", om.valueToTree(this.getTemplateBody()));
            }
            if (this.getTemplateName() != null) {
                data.set("templateName", om.valueToTree(this.getTemplateName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.iotCaCertificate.IotCaCertificateRegistrationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IotCaCertificateRegistrationConfig.Jsii$Proxy that = (IotCaCertificateRegistrationConfig.Jsii$Proxy) o;

            if (this.roleArn != null ? !this.roleArn.equals(that.roleArn) : that.roleArn != null) return false;
            if (this.templateBody != null ? !this.templateBody.equals(that.templateBody) : that.templateBody != null) return false;
            return this.templateName != null ? this.templateName.equals(that.templateName) : that.templateName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.roleArn != null ? this.roleArn.hashCode() : 0;
            result = 31 * result + (this.templateBody != null ? this.templateBody.hashCode() : 0);
            result = 31 * result + (this.templateName != null ? this.templateName.hashCode() : 0);
            return result;
        }
    }
}
