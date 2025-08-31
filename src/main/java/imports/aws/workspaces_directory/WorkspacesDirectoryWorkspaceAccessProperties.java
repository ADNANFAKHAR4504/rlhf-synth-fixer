package imports.aws.workspaces_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.687Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspacesDirectory.WorkspacesDirectoryWorkspaceAccessProperties")
@software.amazon.jsii.Jsii.Proxy(WorkspacesDirectoryWorkspaceAccessProperties.Jsii$Proxy.class)
public interface WorkspacesDirectoryWorkspaceAccessProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_android WorkspacesDirectory#device_type_android}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeAndroid() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_chromeos WorkspacesDirectory#device_type_chromeos}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeChromeos() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_ios WorkspacesDirectory#device_type_ios}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeIos() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_linux WorkspacesDirectory#device_type_linux}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeLinux() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_osx WorkspacesDirectory#device_type_osx}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeOsx() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_web WorkspacesDirectory#device_type_web}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeWeb() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_windows WorkspacesDirectory#device_type_windows}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeWindows() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_zeroclient WorkspacesDirectory#device_type_zeroclient}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeviceTypeZeroclient() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspacesDirectoryWorkspaceAccessProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspacesDirectoryWorkspaceAccessProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspacesDirectoryWorkspaceAccessProperties> {
        java.lang.String deviceTypeAndroid;
        java.lang.String deviceTypeChromeos;
        java.lang.String deviceTypeIos;
        java.lang.String deviceTypeLinux;
        java.lang.String deviceTypeOsx;
        java.lang.String deviceTypeWeb;
        java.lang.String deviceTypeWindows;
        java.lang.String deviceTypeZeroclient;

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceAccessProperties#getDeviceTypeAndroid}
         * @param deviceTypeAndroid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_android WorkspacesDirectory#device_type_android}.
         * @return {@code this}
         */
        public Builder deviceTypeAndroid(java.lang.String deviceTypeAndroid) {
            this.deviceTypeAndroid = deviceTypeAndroid;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceAccessProperties#getDeviceTypeChromeos}
         * @param deviceTypeChromeos Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_chromeos WorkspacesDirectory#device_type_chromeos}.
         * @return {@code this}
         */
        public Builder deviceTypeChromeos(java.lang.String deviceTypeChromeos) {
            this.deviceTypeChromeos = deviceTypeChromeos;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceAccessProperties#getDeviceTypeIos}
         * @param deviceTypeIos Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_ios WorkspacesDirectory#device_type_ios}.
         * @return {@code this}
         */
        public Builder deviceTypeIos(java.lang.String deviceTypeIos) {
            this.deviceTypeIos = deviceTypeIos;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceAccessProperties#getDeviceTypeLinux}
         * @param deviceTypeLinux Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_linux WorkspacesDirectory#device_type_linux}.
         * @return {@code this}
         */
        public Builder deviceTypeLinux(java.lang.String deviceTypeLinux) {
            this.deviceTypeLinux = deviceTypeLinux;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceAccessProperties#getDeviceTypeOsx}
         * @param deviceTypeOsx Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_osx WorkspacesDirectory#device_type_osx}.
         * @return {@code this}
         */
        public Builder deviceTypeOsx(java.lang.String deviceTypeOsx) {
            this.deviceTypeOsx = deviceTypeOsx;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceAccessProperties#getDeviceTypeWeb}
         * @param deviceTypeWeb Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_web WorkspacesDirectory#device_type_web}.
         * @return {@code this}
         */
        public Builder deviceTypeWeb(java.lang.String deviceTypeWeb) {
            this.deviceTypeWeb = deviceTypeWeb;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceAccessProperties#getDeviceTypeWindows}
         * @param deviceTypeWindows Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_windows WorkspacesDirectory#device_type_windows}.
         * @return {@code this}
         */
        public Builder deviceTypeWindows(java.lang.String deviceTypeWindows) {
            this.deviceTypeWindows = deviceTypeWindows;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryWorkspaceAccessProperties#getDeviceTypeZeroclient}
         * @param deviceTypeZeroclient Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#device_type_zeroclient WorkspacesDirectory#device_type_zeroclient}.
         * @return {@code this}
         */
        public Builder deviceTypeZeroclient(java.lang.String deviceTypeZeroclient) {
            this.deviceTypeZeroclient = deviceTypeZeroclient;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorkspacesDirectoryWorkspaceAccessProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspacesDirectoryWorkspaceAccessProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspacesDirectoryWorkspaceAccessProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspacesDirectoryWorkspaceAccessProperties {
        private final java.lang.String deviceTypeAndroid;
        private final java.lang.String deviceTypeChromeos;
        private final java.lang.String deviceTypeIos;
        private final java.lang.String deviceTypeLinux;
        private final java.lang.String deviceTypeOsx;
        private final java.lang.String deviceTypeWeb;
        private final java.lang.String deviceTypeWindows;
        private final java.lang.String deviceTypeZeroclient;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deviceTypeAndroid = software.amazon.jsii.Kernel.get(this, "deviceTypeAndroid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceTypeChromeos = software.amazon.jsii.Kernel.get(this, "deviceTypeChromeos", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceTypeIos = software.amazon.jsii.Kernel.get(this, "deviceTypeIos", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceTypeLinux = software.amazon.jsii.Kernel.get(this, "deviceTypeLinux", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceTypeOsx = software.amazon.jsii.Kernel.get(this, "deviceTypeOsx", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceTypeWeb = software.amazon.jsii.Kernel.get(this, "deviceTypeWeb", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceTypeWindows = software.amazon.jsii.Kernel.get(this, "deviceTypeWindows", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deviceTypeZeroclient = software.amazon.jsii.Kernel.get(this, "deviceTypeZeroclient", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deviceTypeAndroid = builder.deviceTypeAndroid;
            this.deviceTypeChromeos = builder.deviceTypeChromeos;
            this.deviceTypeIos = builder.deviceTypeIos;
            this.deviceTypeLinux = builder.deviceTypeLinux;
            this.deviceTypeOsx = builder.deviceTypeOsx;
            this.deviceTypeWeb = builder.deviceTypeWeb;
            this.deviceTypeWindows = builder.deviceTypeWindows;
            this.deviceTypeZeroclient = builder.deviceTypeZeroclient;
        }

        @Override
        public final java.lang.String getDeviceTypeAndroid() {
            return this.deviceTypeAndroid;
        }

        @Override
        public final java.lang.String getDeviceTypeChromeos() {
            return this.deviceTypeChromeos;
        }

        @Override
        public final java.lang.String getDeviceTypeIos() {
            return this.deviceTypeIos;
        }

        @Override
        public final java.lang.String getDeviceTypeLinux() {
            return this.deviceTypeLinux;
        }

        @Override
        public final java.lang.String getDeviceTypeOsx() {
            return this.deviceTypeOsx;
        }

        @Override
        public final java.lang.String getDeviceTypeWeb() {
            return this.deviceTypeWeb;
        }

        @Override
        public final java.lang.String getDeviceTypeWindows() {
            return this.deviceTypeWindows;
        }

        @Override
        public final java.lang.String getDeviceTypeZeroclient() {
            return this.deviceTypeZeroclient;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDeviceTypeAndroid() != null) {
                data.set("deviceTypeAndroid", om.valueToTree(this.getDeviceTypeAndroid()));
            }
            if (this.getDeviceTypeChromeos() != null) {
                data.set("deviceTypeChromeos", om.valueToTree(this.getDeviceTypeChromeos()));
            }
            if (this.getDeviceTypeIos() != null) {
                data.set("deviceTypeIos", om.valueToTree(this.getDeviceTypeIos()));
            }
            if (this.getDeviceTypeLinux() != null) {
                data.set("deviceTypeLinux", om.valueToTree(this.getDeviceTypeLinux()));
            }
            if (this.getDeviceTypeOsx() != null) {
                data.set("deviceTypeOsx", om.valueToTree(this.getDeviceTypeOsx()));
            }
            if (this.getDeviceTypeWeb() != null) {
                data.set("deviceTypeWeb", om.valueToTree(this.getDeviceTypeWeb()));
            }
            if (this.getDeviceTypeWindows() != null) {
                data.set("deviceTypeWindows", om.valueToTree(this.getDeviceTypeWindows()));
            }
            if (this.getDeviceTypeZeroclient() != null) {
                data.set("deviceTypeZeroclient", om.valueToTree(this.getDeviceTypeZeroclient()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.workspacesDirectory.WorkspacesDirectoryWorkspaceAccessProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspacesDirectoryWorkspaceAccessProperties.Jsii$Proxy that = (WorkspacesDirectoryWorkspaceAccessProperties.Jsii$Proxy) o;

            if (this.deviceTypeAndroid != null ? !this.deviceTypeAndroid.equals(that.deviceTypeAndroid) : that.deviceTypeAndroid != null) return false;
            if (this.deviceTypeChromeos != null ? !this.deviceTypeChromeos.equals(that.deviceTypeChromeos) : that.deviceTypeChromeos != null) return false;
            if (this.deviceTypeIos != null ? !this.deviceTypeIos.equals(that.deviceTypeIos) : that.deviceTypeIos != null) return false;
            if (this.deviceTypeLinux != null ? !this.deviceTypeLinux.equals(that.deviceTypeLinux) : that.deviceTypeLinux != null) return false;
            if (this.deviceTypeOsx != null ? !this.deviceTypeOsx.equals(that.deviceTypeOsx) : that.deviceTypeOsx != null) return false;
            if (this.deviceTypeWeb != null ? !this.deviceTypeWeb.equals(that.deviceTypeWeb) : that.deviceTypeWeb != null) return false;
            if (this.deviceTypeWindows != null ? !this.deviceTypeWindows.equals(that.deviceTypeWindows) : that.deviceTypeWindows != null) return false;
            return this.deviceTypeZeroclient != null ? this.deviceTypeZeroclient.equals(that.deviceTypeZeroclient) : that.deviceTypeZeroclient == null;
        }

        @Override
        public final int hashCode() {
            int result = this.deviceTypeAndroid != null ? this.deviceTypeAndroid.hashCode() : 0;
            result = 31 * result + (this.deviceTypeChromeos != null ? this.deviceTypeChromeos.hashCode() : 0);
            result = 31 * result + (this.deviceTypeIos != null ? this.deviceTypeIos.hashCode() : 0);
            result = 31 * result + (this.deviceTypeLinux != null ? this.deviceTypeLinux.hashCode() : 0);
            result = 31 * result + (this.deviceTypeOsx != null ? this.deviceTypeOsx.hashCode() : 0);
            result = 31 * result + (this.deviceTypeWeb != null ? this.deviceTypeWeb.hashCode() : 0);
            result = 31 * result + (this.deviceTypeWindows != null ? this.deviceTypeWindows.hashCode() : 0);
            result = 31 * result + (this.deviceTypeZeroclient != null ? this.deviceTypeZeroclient.hashCode() : 0);
            return result;
        }
    }
}
