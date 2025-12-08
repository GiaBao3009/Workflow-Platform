# TEMPORAL CORE CONCEPTS - Durable Execution & History Replay

## 🎯 VẤN ĐỀ CẦN GIẢI QUYẾT

**Scenario thực tế:**
```
Workflow: Process Order
1. Call API payment gateway (mất 2s)
2. Update database (mất 0.5s)
3. Send email confirmation (mất 1s)
4. Call shipping API (mất 3s)
```

**Vấn đề truyền thống:**
- Server crash ở step 3 → Mất hết state, phải chạy lại từ đầu
- Payment bị charge 2 lần ❌
- Database inconsistent ❌
- Không biết workflow đang ở đâu ❌

## ✨ TEMPORAL GIẢI QUYẾT NHƯ THẾ NÀO?

### 1. DURABLE EXECUTION (Thực thi Bền vững)

**Khái niệm:**
- Workflow code chạy như **normal function**
- Nhưng **state được lưu tự động** sau mỗi step
- **Server crash? Không sao!** Temporal tự động resume từ step cuối cùng

**Ví dụ code:**
```typescript
// Workflow code - Viết như sync code bình thường!
export async function processOrder(orderId: string) {
  // Step 1: Payment
  const paymentResult = await executePaymentActivity(orderId);
  // ← Temporal LƯU STATE Ở ĐÂY! Event: PaymentCompleted
  
  // Step 2: Update DB
  await updateDatabaseActivity(orderId, paymentResult);
  // ← Temporal LƯU STATE! Event: DatabaseUpdated
  
  // Step 3: Email
  await sendEmailActivity(orderId);
  // ← Temporal LƯU STATE! Event: EmailSent
  
  // !! SERVER CRASH Ở ĐÂY !!
  
  // Step 4: Shipping - KHI RESTART, BẮT ĐẦU TỪ ĐÂY!
  await callShippingActivity(orderId);
  // ← Temporal LƯU STATE! Event: ShippingScheduled
  
  return { success: true };
}
```

**Điều kỳ diệu:**
- Code viết **1 lần**, chạy như normal async/await
- Temporal tự động **checkpoint** sau mỗi activity
- Crash ở bất kỳ đâu → **Resume chính xác từ step tiếp theo**
- **KHÔNG BẠO GIỜ chạy lại** activity đã success!

### 2. EVENT SOURCING (Lưu Sự kiện)

**Temporal không lưu state trực tiếp, mà lưu HISTORY OF EVENTS:**

```
Workflow ID: order-12345
Events Timeline:
┌─────────────────────────────────────────────────┐
│ 1. WorkflowStarted                              │
│    - orderId: "12345"                           │
│    - timestamp: 2025-11-28T10:00:00Z            │
├─────────────────────────────────────────────────┤
│ 2. ActivityScheduled (executePayment)          │
│    - activityId: "payment-1"                    │
├─────────────────────────────────────────────────┤
│ 3. ActivityCompleted (executePayment)          │
│    - result: { transactionId: "tx-999" }       │
│    - duration: 2.1s                             │
├─────────────────────────────────────────────────┤
│ 4. ActivityScheduled (updateDatabase)          │
├─────────────────────────────────────────────────┤
│ 5. ActivityCompleted (updateDatabase)          │
│    - result: { updated: true }                  │
├─────────────────────────────────────────────────┤
│ 6. ActivityScheduled (sendEmail)               │
├─────────────────────────────────────────────────┤
│ 7. ActivityCompleted (sendEmail)               │
│    - result: { messageId: "email-456" }        │
├─────────────────────────────────────────────────┤
│ 8. !! WORKER CRASHED HERE !!                   │
├─────────────────────────────────────────────────┤
│ 9. WorkerRestarted                              │
│    - newWorkerId: "worker-002"                  │
├─────────────────────────────────────────────────┤
│ 10. ActivityScheduled (callShipping)           │
│     ← BẮT ĐẦU TỪ ĐÂY, KHÔNG CHẠY LẠI PAYMENT! │
├─────────────────────────────────────────────────┤
│ 11. ActivityCompleted (callShipping)           │
│     - result: { trackingId: "SHIP-789" }       │
├─────────────────────────────────────────────────┤
│ 12. WorkflowCompleted                           │
│     - finalResult: { success: true }            │
└─────────────────────────────────────────────────┘
```

### 3. HISTORY REPLAY (Phát lại Lịch sử)

**Đây là MAGIC CORE của Temporal!**

**Khi worker restart, Temporal làm gì?**

```typescript
// ======== LƯỢT 1: CHẠY BẠO THƯỜNG ========
async function processOrder(orderId: string) {
  console.log('[Step 1] Starting payment...');
  const paymentResult = await executePaymentActivity(orderId);
  // → Activity THẬT SỰ CHẠY: Call API payment gateway
  // → Temporal ghi event: ActivityCompleted
  
  console.log('[Step 2] Updating database...');
  await updateDatabaseActivity(orderId, paymentResult);
  // → Activity THẬT SỰ CHẠY: INSERT vào database
  // → Temporal ghi event: ActivityCompleted
  
  console.log('[Step 3] Sending email...');
  await sendEmailActivity(orderId);
  // → Activity THẬT SỰ CHẠY: Gửi email qua SMTP
  // → Temporal ghi event: ActivityCompleted
  
  // !! CRASH Ở ĐÂY !!
}

// ======== LƯỢT 2: SAU KHI RESTART - HISTORY REPLAY ========
async function processOrder(orderId: string) {
  console.log('[Step 1] Starting payment...');
  const paymentResult = await executePaymentActivity(orderId);
  // → KHÔNG CHẠY ACTIVITY! Temporal trả về kết quả từ event history
  // → paymentResult = { transactionId: "tx-999" } (từ event #3)
  // → Code NHẢY QUA ngay lập tức, KHÔNG CÓ NETWORK CALL!
  
  console.log('[Step 2] Updating database...');
  await updateDatabaseActivity(orderId, paymentResult);
  // → KHÔNG CHẠY! Trả về kết quả từ event #5
  // → KHÔNG CÓ DATABASE QUERY!
  
  console.log('[Step 3] Sending email...');
  await sendEmailActivity(orderId);
  // → KHÔNG CHẠY! Trả về kết quả từ event #7
  // → KHÔNG GỬI EMAIL NỮA!
  
  console.log('[Step 4] Calling shipping API...');
  await callShippingActivity(orderId);
  // → ĐÂY LÀ STEP MỚI! Activity THẬT SỰ CHẠY!
  // → Call shipping API, ghi event mới
  
  return { success: true };
}
```

**KẾT QUẢ:**
- ✅ Payment chỉ charge **1 lần**
- ✅ Database chỉ update **1 lần**
- ✅ Email chỉ gửi **1 lần**
- ✅ Shipping API được call sau khi restart
- ✅ Workflow resume **chính xác từ bước bị dừng**

### 4. DETERMINISTIC EXECUTION (Thực thi Xác định)

**QUY TẮC VÀNG: Workflow code PHẢI deterministic!**

**❌ KHÔNG ĐƯỢC LÀM:**
```typescript
export async function badWorkflow() {
  // ❌ Random - Mỗi lần replay khác nhau!
  const randomId = Math.random();
  
  // ❌ Current time - Replay sẽ khác!
  const now = new Date();
  
  // ❌ Network call trực tiếp - Non-deterministic!
  const response = await fetch('https://api.com');
  
  // ❌ File I/O - Side effect!
  fs.writeFileSync('data.txt', 'hello');
}
```

**✅ ĐÚNG CÁCH:**
```typescript
export async function goodWorkflow() {
  // ✅ Use Activity cho network calls
  const response = await executeHttpActivity({ url: 'https://api.com' });
  
  // ✅ Use Activity cho random/time
  const randomId = await generateRandomIdActivity();
  const currentTime = await getCurrentTimeActivity();
  
  // ✅ Use Activity cho file I/O
  await writeFileActivity({ path: 'data.txt', content: 'hello' });
  
  // ✅ Pure logic trong workflow - OK!
  const total = response.data.reduce((sum, item) => sum + item.price, 0);
  
  return total;
}
```

**TẠI SAO?**
- Replay phải cho **kết quả giống hệt** mỗi lần
- Nếu code non-deterministic → Replay sai → Workflow corrupted!

### 5. ACTIVITIES vs WORKFLOWS

**WORKFLOW:**
- Pure orchestration logic
- Deterministic, có thể replay
- Không có side effects
- Chỉ schedule activities, không gọi API/DB

**ACTIVITY:**
- Thực thi side effects (API, DB, Email, File I/O)
- Non-deterministic OK
- Có retry, timeout
- Chạy 1 lần, kết quả được cache

**Diagram:**
```
┌─────────────────────────────────────────┐
│          WORKFLOW (Brain)               │
│  - Orchestration logic                  │
│  - Decision making                      │
│  - Deterministic                        │
│  - Can replay safely                    │
│                                         │
│  if (status === 200) {                  │
│    await sendSuccessEmail()  ────┐      │
│  } else {                        │      │
│    await sendErrorEmail()        │      │
│  }                               │      │
└──────────────────────────────────┼──────┘
                                   │
                     ┌─────────────▼──────────────┐
                     │   ACTIVITIES (Hands)       │
                     │  - API calls               │
                     │  - Database ops            │
                     │  - Email sending           │
                     │  - File operations         │
                     │  - Non-deterministic OK    │
                     └────────────────────────────┘
```

## 🔥 PRACTICAL EXAMPLES

### Example 1: E-commerce Order Processing

```typescript
// ============ WORKFLOW ============
export async function processOrderWorkflow(order: Order) {
  // Step 1: Validate inventory
  const inventory = await checkInventoryActivity(order.items);
  
  if (!inventory.available) {
    await sendOutOfStockEmailActivity(order.customerId);
    return { status: 'out_of_stock' };
  }
  
  // Step 2: Process payment
  const payment = await processPaymentActivity({
    customerId: order.customerId,
    amount: order.total,
  });
  
  if (payment.failed) {
    await sendPaymentFailedEmailActivity(order.customerId);
    return { status: 'payment_failed' };
  }
  
  // Step 3: Reserve inventory
  await reserveInventoryActivity(order.items);
  
  // Step 4: Create shipping label
  const shipping = await createShippingLabelActivity(order);
  
  // Step 5: Send confirmation
  await sendOrderConfirmationActivity({
    customerId: order.customerId,
    orderId: order.id,
    trackingNumber: shipping.trackingNumber,
  });
  
  return { status: 'success', trackingNumber: shipping.trackingNumber };
}

// ============ ACTIVITIES ============
export async function processPaymentActivity(data: PaymentData) {
  // Gọi Stripe API - có thể fail, có thể retry
  const stripe = new Stripe(process.env.STRIPE_KEY);
  try {
    const charge = await stripe.charges.create({
      amount: data.amount * 100,
      currency: 'usd',
      customer: data.customerId,
    });
    return { success: true, transactionId: charge.id };
  } catch (error) {
    return { failed: true, error: error.message };
  }
}
```

**Kịch bản crash:**
1. Inventory checked ✅
2. Payment processed ✅ (Stripe charged)
3. **CRASH trước khi reserve inventory**
4. Worker restart
5. **Replay workflow:**
   - Inventory check: Return cached result (không call lại)
   - Payment: Return cached result (Stripe KHÔNG charge lại!)
   - Reserve inventory: **Bắt đầu từ đây** ✅
6. Hoàn thành workflow

### Example 2: Data Pipeline với Retry

```typescript
export async function dataPipelineWorkflow(config: PipelineConfig) {
  // Step 1: Fetch từ source API (có thể fail nhiều lần)
  const rawData = await fetchDataActivity({ url: config.sourceUrl });
  // Temporal tự retry nếu network timeout
  
  // Step 2: Transform data
  const transformed = await transformDataActivity(rawData);
  
  // Step 3: Validate
  const validation = await validateDataActivity(transformed);
  
  if (!validation.valid) {
    await sendValidationErrorEmailActivity(validation.errors);
    throw new Error('Validation failed');
  }
  
  // Step 4: Upload to destination
  await uploadDataActivity({
    data: transformed,
    destination: config.destinationUrl,
  });
  
  // Step 5: Archive source
  await archiveSourceDataActivity({ url: config.sourceUrl });
  
  return { recordsProcessed: transformed.length };
}
```

**Retry config trong Activity:**
```typescript
const { fetchDataActivity } = proxyActivities({
  startToCloseTimeout: '5 minutes',
  retry: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumInterval: '1 minute',
    maximumAttempts: 10,
  },
});
```

**Khi fetchDataActivity timeout:**
- Lần 1: Fail sau 5 min → Retry sau 1s
- Lần 2: Fail → Retry sau 2s
- Lần 3: Fail → Retry sau 4s
- Lần 4: Fail → Retry sau 8s
- ...
- Lần 10: Fail → Workflow failed

**Nhưng nếu crash giữa chừng:**
- Worker restart
- Temporal replay workflow
- fetchDataActivity tiếp tục retry từ attempt cuối cùng!

## 🎯 APPLY VÀO DỰ ÁN CỦA BẠN

### 1. Workflow Hiện Tại

```typescript
// hello-temporal/src/workflows.ts
export async function executeWorkflow(
  workflowId: string,
  activities: TemporalActivityConfig[]
) {
  const results: Record<string, any> = {};

  for (const activity of sortedActivities) {
    // Mỗi activity là 1 checkpoint!
    // Temporal tự động lưu state sau mỗi activity complete
    
    switch (activity.nodeType) {
      case 'HTTP_REQUEST':
        result = await executeHttpRequestActivity(config, context);
        // ← CHECKPOINT! Nếu crash sau đây, sẽ bắt đầu từ activity tiếp theo
        break;
        
      case 'DATABASE':
        result = await executeDatabaseActivity(config, context);
        // ← CHECKPOINT!
        break;
        
      case 'EMAIL':
        result = await sendEmailActivity(config, context);
        // ← CHECKPOINT!
        break;
    }
    
    results[activity.nodeId] = result;
  }
  
  return results;
}
```

**Điều này có nghĩa:**
- User chạy workflow: HTTP → Database → Email
- HTTP success, Database success, **Crash trước Email**
- Worker restart
- **Temporal replay workflow:**
  - HTTP: Return cached result (không call API lại!)
  - Database: Return cached result (không query DB lại!)
  - Email: **Chạy thật từ đây!**

### 2. Cải Thiện với Error Handling

```typescript
// Thêm retry cho từng activity type
const {
  executeHttpRequestActivity,
  executeDatabaseActivity,
  sendEmailActivity,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    initialInterval: '1s',
    backoffCoefficient: 2,
    maximumInterval: '1 minute',
    maximumAttempts: 3, // Retry 3 lần
  },
});

export async function executeWorkflow(...) {
  const results = {};
  
  for (const activity of sortedActivities) {
    try {
      // Activity tự động retry nếu fail
      result = await executeActivity(config, context);
      results[activity.nodeId] = {
        status: 'success',
        data: result,
      };
    } catch (error) {
      // Sau 3 lần retry vẫn fail
      results[activity.nodeId] = {
        status: 'failed',
        error: error.message,
      };
      
      // Có thể continue hoặc throw
      if (activity.stopOnError) {
        throw error; // Stop workflow
      }
    }
  }
  
  return results;
}
```

### 3. Long-Running Workflows

```typescript
export async function weeklyReportWorkflow() {
  // Chạy mỗi tuần, collect data từ nhiều nguồn
  
  // Monday: Fetch sales data
  const salesData = await fetchSalesActivity();
  
  // Tuesday: Fetch customer data
  await sleep('1 day'); // Temporal timer - deterministic!
  const customerData = await fetchCustomerActivity();
  
  // Wednesday: Fetch inventory
  await sleep('1 day');
  const inventoryData = await fetchInventoryActivity();
  
  // Thursday: Generate report
  await sleep('1 day');
  const report = await generateReportActivity({
    sales: salesData,
    customers: customerData,
    inventory: inventoryData,
  });
  
  // Friday: Send report
  await sleep('1 day');
  await sendReportEmailActivity(report);
  
  return { reportId: report.id };
}
```

**Điều kỳ diệu:**
- Workflow chạy suốt 5 ngày!
- Server restart bất kỳ lúc nào → Temporal resume
- Không bị duplicate data fetch
- Không bị gửi email 2 lần

## 📊 SO SÁNH VỚI APPROACHES KHÁC

### Traditional Approach (Queue-based)
```
[API] → [Queue] → [Worker 1] → [Queue] → [Worker 2] → [Queue] → [Worker 3]
        ↓                        ↓                      ↓
      DB State              DB State                DB State
```
- **Vấn đề:**
  - Phải tự manage state trong DB
  - Retry logic phức tạp
  - Khó debug (state ở nhiều nơi)
  - Race conditions

### Temporal Approach
```
[API] → [Temporal Workflow]
          ↓
        History Events (Temporal Server)
          ↓
        Worker executes & Temporal auto-checkpoints
```
- **Ưu điểm:**
  - Code như sync
  - Auto retry, auto resume
  - State consistency guaranteed
  - Full history audit trail

## 💡 BEST PRACTICES

1. **Always use Activities cho side effects**
2. **Keep Workflows deterministic**
3. **Use proper retry policies**
4. **Monitor Temporal UI** (http://localhost:8080)
5. **Test workflow replay** bằng cách restart worker

## 🚀 NEXT LEVEL

Sau khi hiểu core concepts, bạn có thể:
1. Implement **Saga pattern** (compensating transactions)
2. **Child workflows** (workflow gọi workflow khác)
3. **Signals** (external events trigger workflow changes)
4. **Queries** (query workflow state while running)
5. **Continue-as-new** (infinite workflows)

---

**TÓM LẠI:**
- **Durable Execution** = Code chạy như bình thường nhưng state được lưu tự động
- **History Replay** = Khi restart, Temporal "phát lại" workflow từ events đã lưu
- **Activities** = Nơi duy nhất làm side effects
- **Workflows** = Pure orchestration logic, có thể replay an toàn

**Magic formula: Write once, run reliably forever!** ✨
