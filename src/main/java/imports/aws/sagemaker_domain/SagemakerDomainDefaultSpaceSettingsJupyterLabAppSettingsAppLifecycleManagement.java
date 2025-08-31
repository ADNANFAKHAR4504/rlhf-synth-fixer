package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.305Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement.Jsii$Proxy.class)
public interface SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement extends software.amazon.jsii.JsiiSerializable {

    /**
     * idle_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#idle_settings SagemakerDomain#idle_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings getIdleSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement> {
        imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings idleSettings;

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement#getIdleSettings}
         * @param idleSettings idle_settings block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#idle_settings SagemakerDomain#idle_settings}
         * @return {@code this}
         */
        public Builder idleSettings(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings idleSettings) {
            this.idleSettings = idleSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement {
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings idleSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.idleSettings = software.amazon.jsii.Kernel.get(this, "idleSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.idleSettings = builder.idleSettings;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings getIdleSettings() {
            return this.idleSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIdleSettings() != null) {
                data.set("idleSettings", om.valueToTree(this.getIdleSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement.Jsii$Proxy that = (SagemakerDomainDefaultSpaceSettingsJupyterLabAppSettingsAppLifecycleManagement.Jsii$Proxy) o;

            return this.idleSettings != null ? this.idleSettings.equals(that.idleSettings) : that.idleSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.idleSettings != null ? this.idleSettings.hashCode() : 0;
            return result;
        }
    }
}
