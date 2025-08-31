package imports.aws.sagemaker_user_profile;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.350Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings.Jsii$Proxy.class)
public interface SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_timeout_in_minutes SagemakerUserProfile#idle_timeout_in_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIdleTimeoutInMinutes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_management SagemakerUserProfile#lifecycle_management}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLifecycleManagement() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#max_idle_timeout_in_minutes SagemakerUserProfile#max_idle_timeout_in_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxIdleTimeoutInMinutes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#min_idle_timeout_in_minutes SagemakerUserProfile#min_idle_timeout_in_minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinIdleTimeoutInMinutes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings> {
        java.lang.Number idleTimeoutInMinutes;
        java.lang.String lifecycleManagement;
        java.lang.Number maxIdleTimeoutInMinutes;
        java.lang.Number minIdleTimeoutInMinutes;

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings#getIdleTimeoutInMinutes}
         * @param idleTimeoutInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#idle_timeout_in_minutes SagemakerUserProfile#idle_timeout_in_minutes}.
         * @return {@code this}
         */
        public Builder idleTimeoutInMinutes(java.lang.Number idleTimeoutInMinutes) {
            this.idleTimeoutInMinutes = idleTimeoutInMinutes;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings#getLifecycleManagement}
         * @param lifecycleManagement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#lifecycle_management SagemakerUserProfile#lifecycle_management}.
         * @return {@code this}
         */
        public Builder lifecycleManagement(java.lang.String lifecycleManagement) {
            this.lifecycleManagement = lifecycleManagement;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings#getMaxIdleTimeoutInMinutes}
         * @param maxIdleTimeoutInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#max_idle_timeout_in_minutes SagemakerUserProfile#max_idle_timeout_in_minutes}.
         * @return {@code this}
         */
        public Builder maxIdleTimeoutInMinutes(java.lang.Number maxIdleTimeoutInMinutes) {
            this.maxIdleTimeoutInMinutes = maxIdleTimeoutInMinutes;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings#getMinIdleTimeoutInMinutes}
         * @param minIdleTimeoutInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_user_profile#min_idle_timeout_in_minutes SagemakerUserProfile#min_idle_timeout_in_minutes}.
         * @return {@code this}
         */
        public Builder minIdleTimeoutInMinutes(java.lang.Number minIdleTimeoutInMinutes) {
            this.minIdleTimeoutInMinutes = minIdleTimeoutInMinutes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings {
        private final java.lang.Number idleTimeoutInMinutes;
        private final java.lang.String lifecycleManagement;
        private final java.lang.Number maxIdleTimeoutInMinutes;
        private final java.lang.Number minIdleTimeoutInMinutes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.idleTimeoutInMinutes = software.amazon.jsii.Kernel.get(this, "idleTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.lifecycleManagement = software.amazon.jsii.Kernel.get(this, "lifecycleManagement", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxIdleTimeoutInMinutes = software.amazon.jsii.Kernel.get(this, "maxIdleTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minIdleTimeoutInMinutes = software.amazon.jsii.Kernel.get(this, "minIdleTimeoutInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.idleTimeoutInMinutes = builder.idleTimeoutInMinutes;
            this.lifecycleManagement = builder.lifecycleManagement;
            this.maxIdleTimeoutInMinutes = builder.maxIdleTimeoutInMinutes;
            this.minIdleTimeoutInMinutes = builder.minIdleTimeoutInMinutes;
        }

        @Override
        public final java.lang.Number getIdleTimeoutInMinutes() {
            return this.idleTimeoutInMinutes;
        }

        @Override
        public final java.lang.String getLifecycleManagement() {
            return this.lifecycleManagement;
        }

        @Override
        public final java.lang.Number getMaxIdleTimeoutInMinutes() {
            return this.maxIdleTimeoutInMinutes;
        }

        @Override
        public final java.lang.Number getMinIdleTimeoutInMinutes() {
            return this.minIdleTimeoutInMinutes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIdleTimeoutInMinutes() != null) {
                data.set("idleTimeoutInMinutes", om.valueToTree(this.getIdleTimeoutInMinutes()));
            }
            if (this.getLifecycleManagement() != null) {
                data.set("lifecycleManagement", om.valueToTree(this.getLifecycleManagement()));
            }
            if (this.getMaxIdleTimeoutInMinutes() != null) {
                data.set("maxIdleTimeoutInMinutes", om.valueToTree(this.getMaxIdleTimeoutInMinutes()));
            }
            if (this.getMinIdleTimeoutInMinutes() != null) {
                data.set("minIdleTimeoutInMinutes", om.valueToTree(this.getMinIdleTimeoutInMinutes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerUserProfile.SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings.Jsii$Proxy that = (SagemakerUserProfileUserSettingsJupyterLabAppSettingsAppLifecycleManagementIdleSettings.Jsii$Proxy) o;

            if (this.idleTimeoutInMinutes != null ? !this.idleTimeoutInMinutes.equals(that.idleTimeoutInMinutes) : that.idleTimeoutInMinutes != null) return false;
            if (this.lifecycleManagement != null ? !this.lifecycleManagement.equals(that.lifecycleManagement) : that.lifecycleManagement != null) return false;
            if (this.maxIdleTimeoutInMinutes != null ? !this.maxIdleTimeoutInMinutes.equals(that.maxIdleTimeoutInMinutes) : that.maxIdleTimeoutInMinutes != null) return false;
            return this.minIdleTimeoutInMinutes != null ? this.minIdleTimeoutInMinutes.equals(that.minIdleTimeoutInMinutes) : that.minIdleTimeoutInMinutes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.idleTimeoutInMinutes != null ? this.idleTimeoutInMinutes.hashCode() : 0;
            result = 31 * result + (this.lifecycleManagement != null ? this.lifecycleManagement.hashCode() : 0);
            result = 31 * result + (this.maxIdleTimeoutInMinutes != null ? this.maxIdleTimeoutInMinutes.hashCode() : 0);
            result = 31 * result + (this.minIdleTimeoutInMinutes != null ? this.minIdleTimeoutInMinutes.hashCode() : 0);
            return result;
        }
    }
}
