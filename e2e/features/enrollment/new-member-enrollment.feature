@enrollment @fixtures
Feature: New Member Enrollment
  As a prospective member browsing the site
  I want to enroll in an intro class

  Scenario: Unauthenticated user signs in from the dashboard and returns to the dashboard
    Given the enrollment test account is clean
    When I navigate to the dashboard
    Then I should be redirected to the Auth0 login page
    When I complete the Auth0 login
    Then I should be on the dashboard

  Scenario: Signed-in user with no profile must create a profile before enrolling
    Given the enrollment test account is clean
    When I navigate to the dashboard
    Then I should be redirected to the Auth0 login page
    When I complete the Auth0 login
    Then I should be asked to create my profile
    And I should not see dashboard enrollment options

  Scenario: User enrolls in an intro class as a guest user
    Given an existing intro class is available with 5 spots
    And I am on the home page
    When I select the first available intro class
    And I click "Enroll Now"
    And I click "Continue as Guest"
    Then I should see a popup titled "Create Your Profile"
    When I fill in the guest profile form with valid details
    And I click "Create Profile & Continue"
    Then I should be redirected to a checkout page
    When I complete the Square sandbox checkout
    Then I should be back on the home page
    And I wait for the enrollment to finish processing
    When I sign in as an admin
    And I navigate to the admin members page
    And I click the "All" status filter
    And I search for the test account
    Then I should see the test account in the results
    When I expand the test account details
    Then the Square Customer ID field should be populated
    And the member status should be "Enrolled"
    And the profile should be complete
    When I view the recent transactions
    Then I should see a transaction for the intro enrollment
    When I delete the test account
    And I confirm the deletion
    Then the test account should no longer appear in the results

  Scenario: Signed-in user with incomplete profile attempts to sign up on the front page, is redirected to the dashboard to complete profile and enrollment
    Given the enrollment test account is clean
    And an existing intro class is available with 5 spots
    And I am on the home page
    When I click "Sign In"
    Then I should be redirected to the Auth0 login page
    When I complete the Auth0 login
    Then I should be back on the home page
    When I select the first available intro class
    Then I should be asked to complete my profile before enrolling
    When I follow the complete profile prompt
    Then I should be on the dashboard
    When I create my profile
    Then I should be on the dashboard
    When I choose to sign up for an intro class from the dashboard
    And I select the first available intro class
    And I click "Enroll Now"
    Then I should be redirected to a checkout page
    When I complete the Square sandbox checkout
    Then I should be on the dashboard
    And I wait for the enrollment to finish processing
    Then I should see my intro class enrollment on the dashboard
    When I navigate to my payment history
    Then I should see the intro class payment in my payment history
    When I sign in as an admin
    And I navigate to the admin members page
    And I click the "All" status filter
    And I search for the test account
    Then I should see the test account in the results
    When I expand the test account details
    Then the Square Customer ID field should be populated
    And the member status should be "Enrolled"
    And the profile should be complete
    When I view the recent transactions
    Then I should see a transaction for the intro enrollment
    When I delete the test account
    And I confirm the deletion
    Then the test account should no longer appear in the results

  Scenario: User with a completed profile starts intro class enrollment while signed out, signs in, and completes checkout
    Given the enrollment test account has a completed profile
    And an existing intro class is available with 5 spots
    And I am on the home page
    When I select the first available intro class
    And I click "Enroll Now"
    And I click "Sign In to Continue"
    Then I should be redirected to the Auth0 login page
    When I complete the Auth0 login
    Then I should be redirected to a checkout page
    When I complete the Square sandbox checkout
    Then I should be on the dashboard
    And I wait for the enrollment to finish processing
    Then I should see my intro class enrollment on the dashboard
    When I navigate to my payment history
    Then I should see the intro class payment in my payment history
    When I sign in as an admin
    And I navigate to the admin members page
    And I click the "All" status filter
    And I search for the test account
    Then I should see the test account in the results
    When I expand the test account details
    Then the Square Customer ID field should be populated
    And the member status should be "Enrolled"
    And the profile should be complete
    When I view the recent transactions
    Then I should see a transaction for the intro enrollment
    When I delete the test account
    And I confirm the deletion
    Then the test account should no longer appear in the results

  Scenario: User chooses to enroll into an antro class from the front page, resumes pending enrollment after sign-in and completes checkout
    Given the enrollment test account is clean
    And an existing intro class is available with 5 spots
    And I am on the home page
    When I select the first available intro class
    And I click "Enroll Now"
    And I click "Sign In to Continue"
    Then I should be redirected to the Auth0 login page
    When I complete the Auth0 login
    Then I should be on the pending enrollment page
    When I complete my profile
    Then I should be redirected to a checkout page
    When I complete the Square sandbox checkout
    Then I should be on the dashboard
    And I wait for the enrollment to finish processing
    Then I should see my intro class enrollment on the dashboard
    When I navigate to my payment history
    Then I should see the intro class payment in my payment history
    When I sign in as an admin
    And I navigate to the admin members page
    And I click the "All" status filter
    And I search for the test account
    Then I should see the test account in the results
    When I expand the test account details
    Then the Square Customer ID field should be populated
    And the member status should be "Enrolled"
    And the profile should be complete
    When I view the recent transactions
    Then I should see a transaction for the intro enrollment
    When I delete the test account
    And I confirm the deletion
    Then the test account should no longer appear in the results
