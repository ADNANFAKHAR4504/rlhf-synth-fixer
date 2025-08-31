package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.352Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsSpaceStorageSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerUserProfileUserSettingsSpaceStorageSettings.Jsii$Proxy.class)
public interface SagemakerUserProfileUserSettingsSpaceStorageSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * default_ebs_storage_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_ebs_storage_settings SagemakerUserProfile#default_ebs_storage_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings getDefaultEbsStorageSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerUserProfileUserSettingsSpaceStorageSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerUserProfileUserSettingsSpaceStorageSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerUserProfileUserSettingsSpaceStorageSettings> {
        imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings defaultEbsStorageSettings;

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsSpaceStorageSettings#getDefaultEbsStorageSettings}
         * @param defaultEbsStorageSettings default_ebs_storage_settings block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#default_ebs_storage_settings SagemakerUserProfile#default_ebs_storage_settings}
         * @return {@code this}
         */
        public Builder defaultEbsStorageSettings(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings defaultEbsStorageSettings) {
            this.defaultEbsStorageSettings = defaultEbsStorageSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerUserProfileUserSettingsSpaceStorageSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerUserProfileUserSettingsSpaceStorageSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerUserProfileUserSettingsSpaceStorageSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerUserProfileUserSettingsSpaceStorageSettings {
        private final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings defaultEbsStorageSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultEbsStorageSettings = software.amazon.jsii.Kernel.get(this, "defaultEbsStorageSettings", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultEbsStorageSettings = builder.defaultEbsStorageSettings;
        }

        @Override
        public final imports.aws.sagemaker_user_profile.SagemakerUserProfileUserSettingsSpaceStorageSettingsDefaultEbsStorageSettings getDefaultEbsStorageSettings() {
            return this.defaultEbsStorageSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDefaultEbsStorageSettings() != null) {
                data.set("defaultEbsStorageSettings", om.valueToTree(this.getDefaultEbsStorageSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsSpaceStorageSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerUserProfileUserSettingsSpaceStorageSettings.Jsii$Proxy that = (SagemakerUserProfileUserSettingsSpaceStorageSettings.Jsii$Proxy) o;

            return this.defaultEbsStorageSettings != null ? this.defaultEbsStorageSettings.equals(that.defaultEbsStorageSettings) : that.defaultEbsStorageSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultEbsStorageSettings != null ? this.defaultEbsStorageSettings.hashCode() : 0;
            return result;
        }
    }
}
