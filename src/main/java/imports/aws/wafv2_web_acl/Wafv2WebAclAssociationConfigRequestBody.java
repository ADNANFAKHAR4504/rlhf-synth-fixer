package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.670Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBody")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclAssociationConfigRequestBody.Jsii$Proxy.class)
public interface Wafv2WebAclAssociationConfigRequestBody extends software.amazon.jsii.JsiiSerializable {

    /**
     * api_gateway block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#api_gateway Wafv2WebAcl#api_gateway}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyApiGateway getApiGateway() {
        return null;
    }

    /**
     * app_runner_service block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#app_runner_service Wafv2WebAcl#app_runner_service}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerService getAppRunnerService() {
        return null;
    }

    /**
     * cloudfront block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cloudfront Wafv2WebAcl#cloudfront}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCloudfront getCloudfront() {
        return null;
    }

    /**
     * cognito_user_pool block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cognito_user_pool Wafv2WebAcl#cognito_user_pool}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool getCognitoUserPool() {
        return null;
    }

    /**
     * verified_access_instance block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#verified_access_instance Wafv2WebAcl#verified_access_instance}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance getVerifiedAccessInstance() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclAssociationConfigRequestBody}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclAssociationConfigRequestBody}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclAssociationConfigRequestBody> {
        imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyApiGateway apiGateway;
        imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerService appRunnerService;
        imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCloudfront cloudfront;
        imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool cognitoUserPool;
        imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance verifiedAccessInstance;

        /**
         * Sets the value of {@link Wafv2WebAclAssociationConfigRequestBody#getApiGateway}
         * @param apiGateway api_gateway block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#api_gateway Wafv2WebAcl#api_gateway}
         * @return {@code this}
         */
        public Builder apiGateway(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyApiGateway apiGateway) {
            this.apiGateway = apiGateway;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclAssociationConfigRequestBody#getAppRunnerService}
         * @param appRunnerService app_runner_service block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#app_runner_service Wafv2WebAcl#app_runner_service}
         * @return {@code this}
         */
        public Builder appRunnerService(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerService appRunnerService) {
            this.appRunnerService = appRunnerService;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclAssociationConfigRequestBody#getCloudfront}
         * @param cloudfront cloudfront block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cloudfront Wafv2WebAcl#cloudfront}
         * @return {@code this}
         */
        public Builder cloudfront(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCloudfront cloudfront) {
            this.cloudfront = cloudfront;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclAssociationConfigRequestBody#getCognitoUserPool}
         * @param cognitoUserPool cognito_user_pool block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#cognito_user_pool Wafv2WebAcl#cognito_user_pool}
         * @return {@code this}
         */
        public Builder cognitoUserPool(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool cognitoUserPool) {
            this.cognitoUserPool = cognitoUserPool;
            return this;
        }

        /**
         * Sets the value of {@link Wafv2WebAclAssociationConfigRequestBody#getVerifiedAccessInstance}
         * @param verifiedAccessInstance verified_access_instance block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#verified_access_instance Wafv2WebAcl#verified_access_instance}
         * @return {@code this}
         */
        public Builder verifiedAccessInstance(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance verifiedAccessInstance) {
            this.verifiedAccessInstance = verifiedAccessInstance;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclAssociationConfigRequestBody}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclAssociationConfigRequestBody build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclAssociationConfigRequestBody}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclAssociationConfigRequestBody {
        private final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyApiGateway apiGateway;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerService appRunnerService;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCloudfront cloudfront;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool cognitoUserPool;
        private final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance verifiedAccessInstance;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.apiGateway = software.amazon.jsii.Kernel.get(this, "apiGateway", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyApiGateway.class));
            this.appRunnerService = software.amazon.jsii.Kernel.get(this, "appRunnerService", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerService.class));
            this.cloudfront = software.amazon.jsii.Kernel.get(this, "cloudfront", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCloudfront.class));
            this.cognitoUserPool = software.amazon.jsii.Kernel.get(this, "cognitoUserPool", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool.class));
            this.verifiedAccessInstance = software.amazon.jsii.Kernel.get(this, "verifiedAccessInstance", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.apiGateway = builder.apiGateway;
            this.appRunnerService = builder.appRunnerService;
            this.cloudfront = builder.cloudfront;
            this.cognitoUserPool = builder.cognitoUserPool;
            this.verifiedAccessInstance = builder.verifiedAccessInstance;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyApiGateway getApiGateway() {
            return this.apiGateway;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyAppRunnerService getAppRunnerService() {
            return this.appRunnerService;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCloudfront getCloudfront() {
            return this.cloudfront;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyCognitoUserPool getCognitoUserPool() {
            return this.cognitoUserPool;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclAssociationConfigRequestBodyVerifiedAccessInstance getVerifiedAccessInstance() {
            return this.verifiedAccessInstance;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getApiGateway() != null) {
                data.set("apiGateway", om.valueToTree(this.getApiGateway()));
            }
            if (this.getAppRunnerService() != null) {
                data.set("appRunnerService", om.valueToTree(this.getAppRunnerService()));
            }
            if (this.getCloudfront() != null) {
                data.set("cloudfront", om.valueToTree(this.getCloudfront()));
            }
            if (this.getCognitoUserPool() != null) {
                data.set("cognitoUserPool", om.valueToTree(this.getCognitoUserPool()));
            }
            if (this.getVerifiedAccessInstance() != null) {
                data.set("verifiedAccessInstance", om.valueToTree(this.getVerifiedAccessInstance()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAcl.Wafv2WebAclAssociationConfigRequestBody"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclAssociationConfigRequestBody.Jsii$Proxy that = (Wafv2WebAclAssociationConfigRequestBody.Jsii$Proxy) o;

            if (this.apiGateway != null ? !this.apiGateway.equals(that.apiGateway) : that.apiGateway != null) return false;
            if (this.appRunnerService != null ? !this.appRunnerService.equals(that.appRunnerService) : that.appRunnerService != null) return false;
            if (this.cloudfront != null ? !this.cloudfront.equals(that.cloudfront) : that.cloudfront != null) return false;
            if (this.cognitoUserPool != null ? !this.cognitoUserPool.equals(that.cognitoUserPool) : that.cognitoUserPool != null) return false;
            return this.verifiedAccessInstance != null ? this.verifiedAccessInstance.equals(that.verifiedAccessInstance) : that.verifiedAccessInstance == null;
        }

        @Override
        public final int hashCode() {
            int result = this.apiGateway != null ? this.apiGateway.hashCode() : 0;
            result = 31 * result + (this.appRunnerService != null ? this.appRunnerService.hashCode() : 0);
            result = 31 * result + (this.cloudfront != null ? this.cloudfront.hashCode() : 0);
            result = 31 * result + (this.cognitoUserPool != null ? this.cognitoUserPool.hashCode() : 0);
            result = 31 * result + (this.verifiedAccessInstance != null ? this.verifiedAccessInstance.hashCode() : 0);
            return result;
        }
    }
}
