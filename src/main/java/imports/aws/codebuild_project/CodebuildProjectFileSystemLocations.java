package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectFileSystemLocations")
@software.amazon.jsii.Jsii.Proxy(CodebuildProjectFileSystemLocations.Jsii$Proxy.class)
public interface CodebuildProjectFileSystemLocations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#identifier CodebuildProject#identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#location CodebuildProject#location}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#mount_options CodebuildProject#mount_options}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMountOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#mount_point CodebuildProject#mount_point}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMountPoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#type CodebuildProject#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildProjectFileSystemLocations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildProjectFileSystemLocations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildProjectFileSystemLocations> {
        java.lang.String identifier;
        java.lang.String location;
        java.lang.String mountOptions;
        java.lang.String mountPoint;
        java.lang.String type;

        /**
         * Sets the value of {@link CodebuildProjectFileSystemLocations#getIdentifier}
         * @param identifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#identifier CodebuildProject#identifier}.
         * @return {@code this}
         */
        public Builder identifier(java.lang.String identifier) {
            this.identifier = identifier;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectFileSystemLocations#getLocation}
         * @param location Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#location CodebuildProject#location}.
         * @return {@code this}
         */
        public Builder location(java.lang.String location) {
            this.location = location;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectFileSystemLocations#getMountOptions}
         * @param mountOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#mount_options CodebuildProject#mount_options}.
         * @return {@code this}
         */
        public Builder mountOptions(java.lang.String mountOptions) {
            this.mountOptions = mountOptions;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectFileSystemLocations#getMountPoint}
         * @param mountPoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#mount_point CodebuildProject#mount_point}.
         * @return {@code this}
         */
        public Builder mountPoint(java.lang.String mountPoint) {
            this.mountPoint = mountPoint;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectFileSystemLocations#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#type CodebuildProject#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildProjectFileSystemLocations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildProjectFileSystemLocations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildProjectFileSystemLocations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildProjectFileSystemLocations {
        private final java.lang.String identifier;
        private final java.lang.String location;
        private final java.lang.String mountOptions;
        private final java.lang.String mountPoint;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.identifier = software.amazon.jsii.Kernel.get(this, "identifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.location = software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mountOptions = software.amazon.jsii.Kernel.get(this, "mountOptions", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mountPoint = software.amazon.jsii.Kernel.get(this, "mountPoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.identifier = builder.identifier;
            this.location = builder.location;
            this.mountOptions = builder.mountOptions;
            this.mountPoint = builder.mountPoint;
            this.type = builder.type;
        }

        @Override
        public final java.lang.String getIdentifier() {
            return this.identifier;
        }

        @Override
        public final java.lang.String getLocation() {
            return this.location;
        }

        @Override
        public final java.lang.String getMountOptions() {
            return this.mountOptions;
        }

        @Override
        public final java.lang.String getMountPoint() {
            return this.mountPoint;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIdentifier() != null) {
                data.set("identifier", om.valueToTree(this.getIdentifier()));
            }
            if (this.getLocation() != null) {
                data.set("location", om.valueToTree(this.getLocation()));
            }
            if (this.getMountOptions() != null) {
                data.set("mountOptions", om.valueToTree(this.getMountOptions()));
            }
            if (this.getMountPoint() != null) {
                data.set("mountPoint", om.valueToTree(this.getMountPoint()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildProject.CodebuildProjectFileSystemLocations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildProjectFileSystemLocations.Jsii$Proxy that = (CodebuildProjectFileSystemLocations.Jsii$Proxy) o;

            if (this.identifier != null ? !this.identifier.equals(that.identifier) : that.identifier != null) return false;
            if (this.location != null ? !this.location.equals(that.location) : that.location != null) return false;
            if (this.mountOptions != null ? !this.mountOptions.equals(that.mountOptions) : that.mountOptions != null) return false;
            if (this.mountPoint != null ? !this.mountPoint.equals(that.mountPoint) : that.mountPoint != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.identifier != null ? this.identifier.hashCode() : 0;
            result = 31 * result + (this.location != null ? this.location.hashCode() : 0);
            result = 31 * result + (this.mountOptions != null ? this.mountOptions.hashCode() : 0);
            result = 31 * result + (this.mountPoint != null ? this.mountPoint.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
