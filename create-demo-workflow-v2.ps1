# Delete old workflow and create new one with proper data
$userId = "user-demo-123"

Write-Host "Creating demo workflow with nodes and edges..." -ForegroundColor Cyan

# Step 1: Create workflow
$createBody = @{
    userId = $userId
    name = "Demo: HTTP → Email với Variables"
    description = "Workflow demo lấy data từ API và gửi email với variables"
    status = "draft"
    triggerType = "MANUAL"
    reactFlowData = @{
        nodes = @(
            @{
                id = "start"
                type = "input"
                data = @{ label = "🚀 Bắt Đầu" }
                position = @{ x = 250; y = 50 }
            }
        )
        edges = @()
        viewport = @{ x = 0; y = 0; zoom = 1 }
    }
} | ConvertTo-Json -Depth 10

$createResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/workflows" -Method POST -Body $createBody -ContentType "application/json"
$workflowId = $createResponse.workflow._id

Write-Host "✅ Workflow created with ID: $workflowId" -ForegroundColor Green

# Step 2: Update with full nodes and edges
$updateBody = @{
    reactFlowData = @{
        nodes = @(
            @{
                id = "start"
                type = "input"
                data = @{ label = "🚀 Bắt Đầu" }
                position = @{ x = 250; y = 50 }
            },
            @{
                id = "http-demo-1"
                type = "httpRequest"
                data = @{
                    label = "HTTP Request"
                    method = "GET"
                    url = "https://jsonplaceholder.typicode.com/users/1"
                }
                position = @{ x = 250; y = 180 }
            },
            @{
                id = "email-demo-1"
                type = "email"
                data = @{
                    label = "Gửi Email"
                    to = "demo@example.com"
                    subject = "User Info: {{http-demo-1.data.name}}"
                    body = "Xin chào,`n`nThông tin user:`n- Tên: {{http-demo-1.data.name}}`n- Email: {{http-demo-1.data.email}}`n- Công ty: {{http-demo-1.data.company.name}}`n`nTrân trọng"
                }
                position = @{ x = 250; y = 380 }
            }
        )
        edges = @(
            @{
                id = "e-start-http"
                source = "start"
                target = "http-demo-1"
            },
            @{
                id = "e-http-email"
                source = "http-demo-1"
                target = "email-demo-1"
            }
        )
        viewport = @{ x = 0; y = 0; zoom = 1 }
    }
} | ConvertTo-Json -Depth 10

Write-Host "Updating workflow with nodes and edges..." -ForegroundColor Cyan

$updateResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/workflows/$workflowId" -Method PUT -Body $updateBody -ContentType "application/json"

Write-Host ""
Write-Host "Demo workflow ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Workflow ID: $workflowId" -ForegroundColor Yellow
Write-Host "Name: Demo: HTTP → Email với Variables" -ForegroundColor Yellow
Write-Host "Workflow co 3 nodes:" -ForegroundColor White
Write-Host "  1. Start (start)" -ForegroundColor Gray
Write-Host "  2. HTTP Request -> Call API users/1" -ForegroundColor Gray
Write-Host "  3. Email -> Gui email voi data tu API" -ForegroundColor Gray
Write-Host ""
Write-Host "Variables duoc dung:" -ForegroundColor White
Write-Host "  - {{http-demo-1.data.name}}" -ForegroundColor Magenta
Write-Host "  - {{http-demo-1.data.email}}" -ForegroundColor Magenta
Write-Host "  - {{http-demo-1.data.company.name}}" -ForegroundColor Magenta
Write-Host ""
Write-Host "Refresh browser de xem workflow!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
