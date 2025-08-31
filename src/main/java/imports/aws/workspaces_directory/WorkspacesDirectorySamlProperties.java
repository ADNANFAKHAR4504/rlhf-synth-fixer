package imports.aws.workspaces_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.687Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspacesDirectory.WorkspacesDirectorySamlProperties")
@software.amazon.jsii.Jsii.Proxy(WorkspacesDirectorySamlProperties.Jsii$Proxy.class)
public interface WorkspacesDirectorySamlProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#relay_state_parameter_name WorkspacesDirectory#relay_state_parameter_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRelayStateParameterName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#status WorkspacesDirectory#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_access_url WorkspacesDirectory#user_access_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserAccessUrl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspacesDirectorySamlProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspacesDirectorySamlProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspacesDirectorySamlProperties> {
        java.lang.String relayStateParameterName;
        java.lang.String status;
        java.lang.String userAccessUrl;

        /**
         * Sets the value of {@link WorkspacesDirectorySamlProperties#getRelayStateParameterName}
         * @param relayStateParameterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#relay_state_parameter_name WorkspacesDirectory#relay_state_parameter_name}.
         * @return {@code this}
         */
        public Builder relayStateParameterName(java.lang.String relayStateParameterName) {
            this.relayStateParameterName = relayStateParameterName;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectorySamlProperties#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#status WorkspacesDirectory#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectorySamlProperties#getUserAccessUrl}
         * @param userAccessUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#user_access_url WorkspacesDirectory#user_access_url}.
         * @return {@code this}
         */
        public Builder userAccessUrl(java.lang.String userAccessUrl) {
            this.userAccessUrl = userAccessUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorkspacesDirectorySamlProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspacesDirectorySamlProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspacesDirectorySamlProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspacesDirectorySamlProperties {
        private final java.lang.String relayStateParameterName;
        private final java.lang.String status;
        private final java.lang.String userAccessUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.relayStateParameterName = software.amazon.jsii.Kernel.get(this, "relayStateParameterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userAccessUrl = software.amazon.jsii.Kernel.get(this, "userAccessUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.relayStateParameterName = builder.relayStateParameterName;
            this.status = builder.status;
            this.userAccessUrl = builder.userAccessUrl;
        }

        @Override
        public final java.lang.String getRelayStateParameterName() {
            return this.relayStateParameterName;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final java.lang.String getUserAccessUrl() {
            return this.userAccessUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRelayStateParameterName() != null) {
                data.set("relayStateParameterName", om.valueToTree(this.getRelayStateParameterName()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }
            if (this.getUserAccessUrl() != null) {
                data.set("userAccessUrl", om.valueToTree(this.getUserAccessUrl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.workspacesDirectory.WorkspacesDirectorySamlProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspacesDirectorySamlProperties.Jsii$Proxy that = (WorkspacesDirectorySamlProperties.Jsii$Proxy) o;

            if (this.relayStateParameterName != null ? !this.relayStateParameterName.equals(that.relayStateParameterName) : that.relayStateParameterName != null) return false;
            if (this.status != null ? !this.status.equals(that.status) : that.status != null) return false;
            return this.userAccessUrl != null ? this.userAccessUrl.equals(that.userAccessUrl) : that.userAccessUrl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.relayStateParameterName != null ? this.relayStateParameterName.hashCode() : 0;
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            result = 31 * result + (this.userAccessUrl != null ? this.userAccessUrl.hashCode() : 0);
            return result;
        }
    }
}
