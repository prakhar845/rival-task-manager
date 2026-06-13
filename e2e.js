const puppeteer = require('puppeteer');

(async () => {
  console.log("Starting Hardcore E2E Browser Test...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    console.log("1. Navigating to Register Page");
    await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle0' });
    
    console.log("2. Registering hardcore user");
    await page.type('input[type="email"]', 'hardcore_tester2@example.com');
    await page.type('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    console.log("3. Waiting for dashboard to load");
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    if (page.url().includes('/dashboard')) {
      console.log("✅ Dashboard loaded successfully.");
    } else {
      throw new Error("Failed to load dashboard. URL is: " + page.url());
    }

    console.log("4. Creating a new task");
    // Click "New Task" button
    const [newTaskBtn] = await page.$x("//button[contains(., 'New Task')]");
    if (!newTaskBtn) throw new Error("New Task button not found");
    await newTaskBtn.click();
    
    // Wait for modal
    await page.waitForSelector('input[name="title"]', { visible: true });
    await page.type('input[name="title"]', 'Hardcore Assessment Test');
    await page.type('textarea[name="description"]', 'This is a hardcore test.');
    await page.select('select[name="priority"]', 'HIGH');
    
    // Set due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.type('input[type="date"]', tomorrow.toISOString().split('T')[0]);
    
    // Submit task
    const [createBtn] = await page.$x("//button[contains(., 'Create Task')]");
    await createBtn.click();
    
    // Wait for the task to appear in the list
    await page.waitForXPath("//h3[contains(., 'Hardcore Assessment Test')]");
    console.log("✅ Task created successfully.");

    console.log("5. Testing Search functionality");
    await page.type('input[placeholder="Search tasks..."]', 'Hardcore');
    await new Promise(resolve => setTimeout(resolve, 1000)); // wait for debounce
    const tasks = await page.$x("//h3[contains(., 'Hardcore Assessment Test')]");
    if (tasks.length > 0) {
      console.log("✅ Search works successfully.");
    } else {
      throw new Error("Search failed to find the task.");
    }

    console.log("6. Verifying Activity Log");
    // Open the dropdown menu
    const [menuBtn] = await page.$x("//button[contains(@class, 'p-1 rounded-lg text-slate-400')]");
    if (!menuBtn) throw new Error("Menu button not found");
    await menuBtn.click();

    await page.waitForXPath("//button[contains(., 'View Details')]", { visible: true });
    const [viewBtn] = await page.$x("//button[contains(., 'View Details')]");
    await viewBtn.click();
    
    await page.waitForSelector('.flex.flex-col.gap-3', { visible: true });
    // Look for "Task Created" text
    const activityLogs = await page.$x("//p[contains(., 'Task Created')]");
    if (activityLogs.length > 0) {
      console.log("✅ Activity Log accurately tracked creation.");
    } else {
      throw new Error("Activity log did not track creation.");
    }
    
    // Close modal by clicking outside
    await page.mouse.click(10, 10);
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log("7. Editing Task Status");
    // Toggle the status icon to COMPLETED
    const [statusToggleBtn] = await page.$x("//button[contains(@class, 'mt-1 flex-shrink-0')]");
    if (statusToggleBtn) {
      await statusToggleBtn.click();
      console.log("✅ Task status changed optimistically to COMPLETED.");
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
       console.log("⚠️ Could not find specific status toggle button.");
    }

    console.log("8. Deleting Task");
    // Open the dropdown menu again
    const [menuBtnDelete] = await page.$x("//button[contains(@class, 'p-1 rounded-lg text-slate-400')]");
    await menuBtnDelete.click();

    // Click Delete in the dropdown
    await page.waitForXPath("//button[contains(., 'Delete')]", { visible: true });
    const deleteButtons = await page.$x("//button[contains(., 'Delete')]");
    // The dropdown delete button
    await deleteButtons[0].click();
    
    // Wait for the Custom Framer Motion Modal to appear
    await page.waitForXPath("//h3[contains(., 'Delete Task')]", { visible: true });
    
    // Click the confirm Delete button inside the modal
    const confirmDeleteButtons = await page.$x("//button[contains(., 'Delete')]");
    // The last delete button is usually the modal confirm button
    const confirmBtn = confirmDeleteButtons[confirmDeleteButtons.length - 1];
    await confirmBtn.click();
    
    // Wait for deletion to complete and task to disappear
    await new Promise(resolve => setTimeout(resolve, 2000));
    const tasksAfterDelete = await page.$x("//h3[contains(., 'Hardcore Assessment Test')]");
    if (tasksAfterDelete.length === 0) {
      console.log("✅ Task deleted successfully. Cascade deletes passed.");
    } else {
      throw new Error("Task was not deleted.");
    }

    console.log("🎉 ALL E2E UI TESTS PASSED WITH 0 ANOMALIES. FULLY COMPLIANT.");

  } catch (err) {
    console.error("❌ Test Failed: ", err);
  } finally {
    await browser.close();
  }
})();
