package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.305Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings.Jsii$Proxy.class)
public interface SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#assumable_role_arns SagemakerDomain#assumable_role_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAssumableRoleArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#execution_role_arns SagemakerDomain#execution_role_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExecutionRoleArns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings> {
        java.util.List<java.lang.String> assumableRoleArns;
        java.util.List<java.lang.String> executionRoleArns;

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings#getAssumableRoleArns}
         * @param assumableRoleArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#assumable_role_arns SagemakerDomain#assumable_role_arns}.
         * @return {@code this}
         */
        public Builder assumableRoleArns(java.util.List<java.lang.String> assumableRoleArns) {
            this.assumableRoleArns = assumableRoleArns;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings#getExecutionRoleArns}
         * @param executionRoleArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#execution_role_arns SagemakerDomain#execution_role_arns}.
         * @return {@code this}
         */
        public Builder executionRoleArns(java.util.List<java.lang.String> executionRoleArns) {
            this.executionRoleArns = executionRoleArns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings {
        private final java.util.List<java.lang.String> assumableRoleArns;
        private final java.util.List<java.lang.String> executionRoleArns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.assumableRoleArns = software.amazon.jsii.Kernel.get(this, "assumableRoleArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.executionRoleArns = software.amazon.jsii.Kernel.get(this, "executionRoleArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.assumableRoleArns = builder.assumableRoleArns;
            this.executionRoleArns = builder.executionRoleArns;
        }

        @Override
        public final java.util.List<java.lang.String> getAssumableRoleArns() {
            return this.assumableRoleArns;
        }

        @Override
        public final java.util.List<java.lang.String> getExecutionRoleArns() {
            return this.executionRoleArns;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAssumableRoleArns() != null) {
                data.set("assumableRoleArns", om.valueToTree(this.getAssumableRoleArns()));
            }
            if (this.getExecutionRoleArns() != null) {
                data.set("executionRoleArns", om.valueToTree(this.getExecutionRoleArns()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings.Jsii$Proxy that = (SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsEmrSettings.Jsii$Proxy) o;

            if (this.assumableRoleArns != null ? !this.assumableRoleArns.equals(that.assumableRoleArns) : that.assumableRoleArns != null) return false;
            return this.executionRoleArns != null ? this.executionRoleArns.equals(that.executionRoleArns) : that.executionRoleArns == null;
        }

        @Override
        public final int hashCode() {
            int result = this.assumableRoleArns != null ? this.assumableRoleArns.hashCode() : 0;
            result = 31 * result + (this.executionRoleArns != null ? this.executionRoleArns.hashCode() : 0);
            return result;
        }
    }
}
