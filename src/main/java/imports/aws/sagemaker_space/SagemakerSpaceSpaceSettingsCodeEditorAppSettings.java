package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.341Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCodeEditorAppSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerSpaceSpaceSettingsCodeEditorAppSettings.Jsii$Proxy.class)
public interface SagemakerSpaceSpaceSettingsCodeEditorAppSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * default_resource_spec block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec getDefaultResourceSpec();

    /**
     * app_lifecycle_management block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_lifecycle_management SagemakerSpace#app_lifecycle_management}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement getAppLifecycleManagement() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerSpaceSpaceSettingsCodeEditorAppSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerSpaceSpaceSettingsCodeEditorAppSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerSpaceSpaceSettingsCodeEditorAppSettings> {
        imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec defaultResourceSpec;
        imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement appLifecycleManagement;

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettingsCodeEditorAppSettings#getDefaultResourceSpec}
         * @param defaultResourceSpec default_resource_spec block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#default_resource_spec SagemakerSpace#default_resource_spec}
         * @return {@code this}
         */
        public Builder defaultResourceSpec(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec defaultResourceSpec) {
            this.defaultResourceSpec = defaultResourceSpec;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSettingsCodeEditorAppSettings#getAppLifecycleManagement}
         * @param appLifecycleManagement app_lifecycle_management block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#app_lifecycle_management SagemakerSpace#app_lifecycle_management}
         * @return {@code this}
         */
        public Builder appLifecycleManagement(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement appLifecycleManagement) {
            this.appLifecycleManagement = appLifecycleManagement;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerSpaceSpaceSettingsCodeEditorAppSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerSpaceSpaceSettingsCodeEditorAppSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerSpaceSpaceSettingsCodeEditorAppSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerSpaceSpaceSettingsCodeEditorAppSettings {
        private final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec defaultResourceSpec;
        private final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement appLifecycleManagement;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultResourceSpec = software.amazon.jsii.Kernel.get(this, "defaultResourceSpec", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec.class));
            this.appLifecycleManagement = software.amazon.jsii.Kernel.get(this, "appLifecycleManagement", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultResourceSpec = java.util.Objects.requireNonNull(builder.defaultResourceSpec, "defaultResourceSpec is required");
            this.appLifecycleManagement = builder.appLifecycleManagement;
        }

        @Override
        public final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsDefaultResourceSpec getDefaultResourceSpec() {
            return this.defaultResourceSpec;
        }

        @Override
        public final imports.aws.sagemaker_space.SagemakerSpaceSpaceSettingsCodeEditorAppSettingsAppLifecycleManagement getAppLifecycleManagement() {
            return this.appLifecycleManagement;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("defaultResourceSpec", om.valueToTree(this.getDefaultResourceSpec()));
            if (this.getAppLifecycleManagement() != null) {
                data.set("appLifecycleManagement", om.valueToTree(this.getAppLifecycleManagement()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerSpace.SagemakerSpaceSpaceSettingsCodeEditorAppSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerSpaceSpaceSettingsCodeEditorAppSettings.Jsii$Proxy that = (SagemakerSpaceSpaceSettingsCodeEditorAppSettings.Jsii$Proxy) o;

            if (!defaultResourceSpec.equals(that.defaultResourceSpec)) return false;
            return this.appLifecycleManagement != null ? this.appLifecycleManagement.equals(that.appLifecycleManagement) : that.appLifecycleManagement == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultResourceSpec.hashCode();
            result = 31 * result + (this.appLifecycleManagement != null ? this.appLifecycleManagement.hashCode() : 0);
            return result;
        }
    }
}
