package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.315Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultUserSettingsTensorBoardAppSettings.Jsii$Proxy.class)
public interface SagemakerDomainDefaultUserSettingsTensorBoardAppSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * default_resource_spec block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_resource_spec SagemakerDomain#default_resource_spec}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec getDefaultResourceSpec() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultUserSettingsTensorBoardAppSettings> {
        imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec defaultResourceSpec;

        /**
         * Sets the value of {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettings#getDefaultResourceSpec}
         * @param defaultResourceSpec default_resource_spec block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#default_resource_spec SagemakerDomain#default_resource_spec}
         * @return {@code this}
         */
        public Builder defaultResourceSpec(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec defaultResourceSpec) {
            this.defaultResourceSpec = defaultResourceSpec;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultUserSettingsTensorBoardAppSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultUserSettingsTensorBoardAppSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultUserSettingsTensorBoardAppSettings {
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec defaultResourceSpec;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultResourceSpec = software.amazon.jsii.Kernel.get(this, "defaultResourceSpec", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultResourceSpec = builder.defaultResourceSpec;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettingsDefaultResourceSpec getDefaultResourceSpec() {
            return this.defaultResourceSpec;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDefaultResourceSpec() != null) {
                data.set("defaultResourceSpec", om.valueToTree(this.getDefaultResourceSpec()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultUserSettingsTensorBoardAppSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultUserSettingsTensorBoardAppSettings.Jsii$Proxy that = (SagemakerDomainDefaultUserSettingsTensorBoardAppSettings.Jsii$Proxy) o;

            return this.defaultResourceSpec != null ? this.defaultResourceSpec.equals(that.defaultResourceSpec) : that.defaultResourceSpec == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultResourceSpec != null ? this.defaultResourceSpec.hashCode() : 0;
            return result;
        }
    }
}
