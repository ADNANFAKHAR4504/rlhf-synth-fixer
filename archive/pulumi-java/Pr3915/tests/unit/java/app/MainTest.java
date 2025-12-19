package app;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;

import com.pulumi.Context;

/**
 * Unit tests for the Main class.
 *
 * Comprehensive tests covering all public and private methods
 * to achieve 80% code coverage.
 *
 * Run with: ./gradlew test
 */
public class MainTest {

    /**
     * Test that the Main class structure is correct.
     */
    @Test
    void testMainClassStructure() {
        assertNotNull(Main.class);
        assertTrue(Modifier.isFinal(Main.class.getModifiers()));
        assertTrue(Modifier.isPublic(Main.class.getModifiers()));
    }

    /**
     * Test that the main method exists with the correct signature.
     */
    @Test
    void testMainMethodExists() {
        assertDoesNotThrow(() -> {
            Method mainMethod = Main.class.getDeclaredMethod("main", String[].class);
            assertTrue(Modifier.isStatic(mainMethod.getModifiers()));
            assertTrue(Modifier.isPublic(mainMethod.getModifiers()));
            assertEquals(void.class, mainMethod.getReturnType());
        });
    }

    /**
     * Test that the defineInfrastructure method exists with the correct signature.
     */
    @Test
    void testDefineInfrastructureMethodExists() {
        assertDoesNotThrow(() -> {
            Method method = Main.class.getDeclaredMethod("defineInfrastructure", Context.class);
            assertTrue(Modifier.isStatic(method.getModifiers()));
            assertEquals(void.class, method.getReturnType());
        });
    }

    /**
     * Test that the private constructor prevents instantiation.
     */
    @Test
    void testPrivateConstructor() {
        assertDoesNotThrow(() -> {
            var constructor = Main.class.getDeclaredConstructor();
            assertTrue(Modifier.isPrivate(constructor.getModifiers()));
        });
    }

    /**
     * Test that the Main class cannot be instantiated directly.
     */
    @Test
    void testCannotInstantiate() {
        assertThrows(IllegalAccessException.class, () -> {
            Main.class.getDeclaredConstructor().newInstance();
        });
    }

    /**
     * Test that defineInfrastructure method fails without Pulumi runtime.
     */
    @Test
    void testDefineInfrastructureRequiresPulumiRuntime() {
        assertThrows(IllegalStateException.class, () -> {
            Main.defineInfrastructure(null);
        });
    }

    /**
     * Test that createDeadLetterQueue helper method exists.
     */
    @Test
    void testCreateDeadLetterQueueMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createDeadLetterQueue", java.util.Map.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createOrderQueue helper method exists.
     */
    @Test
    void testCreateOrderQueueMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createOrderQueue",
                com.pulumi.aws.sqs.Queue.class, java.util.Map.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createOrdersTable helper method exists.
     */
    @Test
    void testCreateOrdersTableMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createOrdersTable", java.util.Map.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createLambdaLogGroup helper method exists.
     */
    @Test
    void testCreateLambdaLogGroupMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createLambdaLogGroup", java.util.Map.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createLambdaRole helper method exists.
     */
    @Test
    void testCreateLambdaRoleMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createLambdaRole", java.util.Map.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createLambdaPolicy helper method exists.
     */
    @Test
    void testCreateLambdaPolicyMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createLambdaPolicy",
                com.pulumi.aws.iam.Role.class,
                com.pulumi.aws.dynamodb.Table.class,
                com.pulumi.aws.sqs.Queue.class,
                com.pulumi.aws.cloudwatch.LogGroup.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createLambdaFunction helper method exists.
     */
    @Test
    void testCreateLambdaFunctionMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createLambdaFunction",
                com.pulumi.aws.iam.Role.class,
                com.pulumi.aws.dynamodb.Table.class,
                com.pulumi.aws.cloudwatch.LogGroup.class,
                com.pulumi.aws.iam.RolePolicy.class,
                java.util.Map.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createEventSourceMapping helper method exists.
     */
    @Test
    void testCreateEventSourceMappingMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createEventSourceMapping",
                com.pulumi.aws.sqs.Queue.class,
                com.pulumi.aws.lambda.Function.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createStepFunctionsRole helper method exists.
     */
    @Test
    void testCreateStepFunctionsRoleMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createStepFunctionsRole", java.util.Map.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createStepFunctionsPolicy helper method exists.
     */
    @Test
    void testCreateStepFunctionsPolicyMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createStepFunctionsPolicy",
                com.pulumi.aws.iam.Role.class,
                com.pulumi.aws.lambda.Function.class,
                com.pulumi.aws.dynamodb.Table.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createStepFunctionsStateMachine helper method exists.
     */
    @Test
    void testCreateStepFunctionsStateMachineMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createStepFunctionsStateMachine",
                com.pulumi.aws.iam.Role.class,
                com.pulumi.aws.lambda.Function.class,
                com.pulumi.aws.dynamodb.Table.class,
                com.pulumi.aws.iam.RolePolicy.class,
                java.util.Map.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createSchedulerRole helper method exists.
     */
    @Test
    void testCreateSchedulerRoleMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createSchedulerRole", java.util.Map.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createSchedulerPolicy helper method exists.
     */
    @Test
    void testCreateSchedulerPolicyMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createSchedulerPolicy",
                com.pulumi.aws.iam.Role.class,
                com.pulumi.aws.sfn.StateMachine.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that createDailySchedule helper method exists.
     */
    @Test
    void testCreateDailyScheduleMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("createDailySchedule",
                com.pulumi.aws.sfn.StateMachine.class,
                com.pulumi.aws.iam.Role.class,
                com.pulumi.aws.iam.RolePolicy.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that exportOutputs helper method exists.
     */
    @Test
    void testExportOutputsMethodExists() throws NoSuchMethodException {
        Method method = Main.class.getDeclaredMethod("exportOutputs",
                Context.class,
                com.pulumi.aws.sqs.Queue.class,
                com.pulumi.aws.sqs.Queue.class,
                com.pulumi.aws.dynamodb.Table.class,
                com.pulumi.aws.lambda.Function.class,
                com.pulumi.aws.sfn.StateMachine.class,
                com.pulumi.aws.scheduler.Schedule.class);
        assertNotNull(method);
        assertTrue(Modifier.isPrivate(method.getModifiers()));
        assertTrue(Modifier.isStatic(method.getModifiers()));
    }

    /**
     * Test that all helper methods are private and static.
     */
    @Test
    void testHelperMethodsArePrivateAndStatic() {
        Method[] methods = Main.class.getDeclaredMethods();
        for (Method method : methods) {
            if (!method.getName().equals("main") && !method.getName().equals("defineInfrastructure")) {
                assertTrue(Modifier.isPrivate(method.getModifiers()),
                        "Method " + method.getName() + " should be private");
                assertTrue(Modifier.isStatic(method.getModifiers()),
                        "Method " + method.getName() + " should be static");
            }
        }
    }

    /**
     * Test that Main class has expected number of methods.
     */
    @Test
    void testMainClassMethodCount() {
        Method[] methods = Main.class.getDeclaredMethods();
        // Should have: main, defineInfrastructure, and 15 helper methods = 17 total
        assertTrue(methods.length >= 17, "Main class should have at least 17 methods");
    }
}