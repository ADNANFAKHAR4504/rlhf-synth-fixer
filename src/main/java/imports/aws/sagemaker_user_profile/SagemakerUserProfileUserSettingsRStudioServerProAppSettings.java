package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.352Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsRStudioServerProAppSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerUserProfileUserSettingsRStudioServerProAppSettings.Jsii$Proxy.class)
public interface SagemakerUserProfileUserSettingsRStudioServerProAppSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#access_status SagemakerUserProfile#access_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccessStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#user_group SagemakerUserProfile#user_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserGroup() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerUserProfileUserSettingsRStudioServerProAppSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerUserProfileUserSettingsRStudioServerProAppSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerUserProfileUserSettingsRStudioServerProAppSettings> {
        java.lang.String accessStatus;
        java.lang.String userGroup;

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsRStudioServerProAppSettings#getAccessStatus}
         * @param accessStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#access_status SagemakerUserProfile#access_status}.
         * @return {@code this}
         */
        public Builder accessStatus(java.lang.String accessStatus) {
            this.accessStatus = accessStatus;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsRStudioServerProAppSettings#getUserGroup}
         * @param userGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#user_group SagemakerUserProfile#user_group}.
         * @return {@code this}
         */
        public Builder userGroup(java.lang.String userGroup) {
            this.userGroup = userGroup;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerUserProfileUserSettingsRStudioServerProAppSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerUserProfileUserSettingsRStudioServerProAppSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerUserProfileUserSettingsRStudioServerProAppSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerUserProfileUserSettingsRStudioServerProAppSettings {
        private final java.lang.String accessStatus;
        private final java.lang.String userGroup;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accessStatus = software.amazon.jsii.Kernel.get(this, "accessStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userGroup = software.amazon.jsii.Kernel.get(this, "userGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accessStatus = builder.accessStatus;
            this.userGroup = builder.userGroup;
        }

        @Override
        public final java.lang.String getAccessStatus() {
            return this.accessStatus;
        }

        @Override
        public final java.lang.String getUserGroup() {
            return this.userGroup;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAccessStatus() != null) {
                data.set("accessStatus", om.valueToTree(this.getAccessStatus()));
            }
            if (this.getUserGroup() != null) {
                data.set("userGroup", om.valueToTree(this.getUserGroup()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsRStudioServerProAppSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerUserProfileUserSettingsRStudioServerProAppSettings.Jsii$Proxy that = (SagemakerUserProfileUserSettingsRStudioServerProAppSettings.Jsii$Proxy) o;

            if (this.accessStatus != null ? !this.accessStatus.equals(that.accessStatus) : that.accessStatus != null) return false;
            return this.userGroup != null ? this.userGroup.equals(that.userGroup) : that.userGroup == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accessStatus != null ? this.accessStatus.hashCode() : 0;
            result = 31 * result + (this.userGroup != null ? this.userGroup.hashCode() : 0);
            return result;
        }
    }
}
