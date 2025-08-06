def test_integration():
    """
    Deploys the stack, checks the ALB endpoint, and destroys the stack.
    """
    try:
        print("--- Selecting Pulumi Stack ---")
        run_command(f"pulumi stack select {STACK_NAME} --create")

        print("--- Deploying Infrastructure ---")
        run_command("pulumi up --yes --skip-preview")

        print("--- Checking Target Group Health ---")
        run_command("aws elbv2 describe-target-health --target-group-arn $(pulumi stack output target_group_arn --json)")

        print("--- Fetching ALB DNS Name ---")
        alb_dns_json = run_command("pulumi stack output alb_dns_name --json")
        alb_dns = json.loads(alb_dns_json)
        url = f"http://{alb_dns}"
        
        print(f"--- Testing URL: {url} ---")
        
        max_retries = 30  # Increased from 16
        response = None
        for i in range(max_retries):
            try:
                response = requests.get(url, timeout=10)
                print(f"Attempt {i+1}/{max_retries}: Got status code {response.status_code}")
                if response.status_code == 200:
                    print("✅ Website is up and running!")
                    break
            except requests.exceptions.RequestException as e:
                print(f"Attempt {i+1}/{max_retries}: Connection failed ({e})...")
            
            if i < max_retries - 1:
                time.sleep(30)  # Increased from 15
                
        if response:
            print("Final response headers:", response.headers)
            print("Final response content:", response.text[:500])  # First 500 chars
            
        assert response is not None, "No response received after all attempts"
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
        assert "Dual-Stack Web App" in response.text
        
        print("✅ Integration Test Passed!")

    finally:
        print("--- Destroying Infrastructure ---")
        run_command("pulumi destroy --yes --skip-preview")