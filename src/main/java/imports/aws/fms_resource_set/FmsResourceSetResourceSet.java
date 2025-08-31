package imports.aws.fms_resource_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.237Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fmsResourceSet.FmsResourceSetResourceSet")
@software.amazon.jsii.Jsii.Proxy(FmsResourceSetResourceSet.Jsii$Proxy.class)
public interface FmsResourceSetResourceSet extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_resource_set#name FmsResourceSet#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_resource_set#description FmsResourceSet#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_resource_set#resource_set_status FmsResourceSet#resource_set_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceSetStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_resource_set#resource_type_list FmsResourceSet#resource_type_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getResourceTypeList() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_resource_set#update_token FmsResourceSet#update_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUpdateToken() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FmsResourceSetResourceSet}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FmsResourceSetResourceSet}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FmsResourceSetResourceSet> {
        java.lang.String name;
        java.lang.String description;
        java.lang.String resourceSetStatus;
        java.util.List<java.lang.String> resourceTypeList;
        java.lang.String updateToken;

        /**
         * Sets the value of {@link FmsResourceSetResourceSet#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_resource_set#name FmsResourceSet#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link FmsResourceSetResourceSet#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_resource_set#description FmsResourceSet#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link FmsResourceSetResourceSet#getResourceSetStatus}
         * @param resourceSetStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_resource_set#resource_set_status FmsResourceSet#resource_set_status}.
         * @return {@code this}
         */
        public Builder resourceSetStatus(java.lang.String resourceSetStatus) {
            this.resourceSetStatus = resourceSetStatus;
            return this;
        }

        /**
         * Sets the value of {@link FmsResourceSetResourceSet#getResourceTypeList}
         * @param resourceTypeList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_resource_set#resource_type_list FmsResourceSet#resource_type_list}.
         * @return {@code this}
         */
        public Builder resourceTypeList(java.util.List<java.lang.String> resourceTypeList) {
            this.resourceTypeList = resourceTypeList;
            return this;
        }

        /**
         * Sets the value of {@link FmsResourceSetResourceSet#getUpdateToken}
         * @param updateToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_resource_set#update_token FmsResourceSet#update_token}.
         * @return {@code this}
         */
        public Builder updateToken(java.lang.String updateToken) {
            this.updateToken = updateToken;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FmsResourceSetResourceSet}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FmsResourceSetResourceSet build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FmsResourceSetResourceSet}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FmsResourceSetResourceSet {
        private final java.lang.String name;
        private final java.lang.String description;
        private final java.lang.String resourceSetStatus;
        private final java.util.List<java.lang.String> resourceTypeList;
        private final java.lang.String updateToken;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceSetStatus = software.amazon.jsii.Kernel.get(this, "resourceSetStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceTypeList = software.amazon.jsii.Kernel.get(this, "resourceTypeList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.updateToken = software.amazon.jsii.Kernel.get(this, "updateToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.description = builder.description;
            this.resourceSetStatus = builder.resourceSetStatus;
            this.resourceTypeList = builder.resourceTypeList;
            this.updateToken = builder.updateToken;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getResourceSetStatus() {
            return this.resourceSetStatus;
        }

        @Override
        public final java.util.List<java.lang.String> getResourceTypeList() {
            return this.resourceTypeList;
        }

        @Override
        public final java.lang.String getUpdateToken() {
            return this.updateToken;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getResourceSetStatus() != null) {
                data.set("resourceSetStatus", om.valueToTree(this.getResourceSetStatus()));
            }
            if (this.getResourceTypeList() != null) {
                data.set("resourceTypeList", om.valueToTree(this.getResourceTypeList()));
            }
            if (this.getUpdateToken() != null) {
                data.set("updateToken", om.valueToTree(this.getUpdateToken()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fmsResourceSet.FmsResourceSetResourceSet"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FmsResourceSetResourceSet.Jsii$Proxy that = (FmsResourceSetResourceSet.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.resourceSetStatus != null ? !this.resourceSetStatus.equals(that.resourceSetStatus) : that.resourceSetStatus != null) return false;
            if (this.resourceTypeList != null ? !this.resourceTypeList.equals(that.resourceTypeList) : that.resourceTypeList != null) return false;
            return this.updateToken != null ? this.updateToken.equals(that.updateToken) : that.updateToken == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.resourceSetStatus != null ? this.resourceSetStatus.hashCode() : 0);
            result = 31 * result + (this.resourceTypeList != null ? this.resourceTypeList.hashCode() : 0);
            result = 31 * result + (this.updateToken != null ? this.updateToken.hashCode() : 0);
            return result;
        }
    }
}
