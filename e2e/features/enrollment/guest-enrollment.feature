@enrollment
Feature: Guest Enrollment
  As a prospective member browsing the site
  I want to start enrolling in an intro class without creating an account
  So that I can quickly complete my enrollment as a guest

  Scenario: Unauthenticated user selects a class and is offered sign-in or guest options
    Given I am on the home page
    When I select the first available intro class
    And I click "Enroll Now"
    Then I should see a popup titled "Sign In or Continue as Guest"
    And I should see a "Sign In to Continue" button
    And I should see a "Continue as Guest" button

  Scenario: Guest enrolls, admin verifies the record, and admin cleans up the test user
    Given I am on the home page
    When I select the first available intro class
    And I click "Enroll Now"
    And I click "Continue as Guest"
    Then I should see a popup titled "Create Your Profile"
    When I fill in the guest profile form with valid details
    And I click "Create Profile & Continue"
    Then I should be redirected to a checkout page
    When I complete the Square sandbox checkout
    Then I should be back on the home page
    When I sign in as an admin
    And I navigate to the admin members page
    And I click the "All" status filter
    And I search for the test guest
    Then I should see the test guest in the results
    When I delete the test guest
    And I confirm the deletion
    Then the test guest should no longer appear in the results
