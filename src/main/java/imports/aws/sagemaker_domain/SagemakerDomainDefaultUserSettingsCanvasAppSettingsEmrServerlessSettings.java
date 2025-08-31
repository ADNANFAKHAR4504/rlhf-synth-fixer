package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.311Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings.Jsii$Proxy.class)
public interface SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#execution_role_arn SagemakerDomain#execution_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExecutionRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#status SagemakerDomain#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings> {
        java.lang.String executionRoleArn;
        java.lang.String status;

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings#getExecutionRoleArn}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#execution_role_arn SagemakerDomain#execution_role_arn}.
         * @return {@code this}
         */
        public Builder executionRoleArn(java.lang.String executionRoleArn) {
            this.executionRoleArn = executionRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#status SagemakerDomain#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings {
        private final java.lang.String executionRoleArn;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.executionRoleArn = software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.executionRoleArn = builder.executionRoleArn;
            this.status = builder.status;
        }

        @Override
        public final java.lang.String getExecutionRoleArn() {
            return this.executionRoleArn;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExecutionRoleArn() != null) {
                data.set("executionRoleArn", om.valueToTree(this.getExecutionRoleArn()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings.Jsii$Proxy that = (SagemakerDomainDefaultUserSettingsCanvasAppSettingsEmrServerlessSettings.Jsii$Proxy) o;

            if (this.executionRoleArn != null ? !this.executionRoleArn.equals(that.executionRoleArn) : that.executionRoleArn != null) return false;
            return this.status != null ? this.status.equals(that.status) : that.status == null;
        }

        @Override
        public final int hashCode() {
            int result = this.executionRoleArn != null ? this.executionRoleArn.hashCode() : 0;
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            return result;
        }
    }
}
