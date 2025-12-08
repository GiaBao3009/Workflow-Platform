# Create Demo Workflow with Variables
$body = @{
    userId = "user-demo-123"
    name = "Demo: HTTP → Email với Variables"
    description = "Workflow demo lấy data từ API và gửi email"
    status = "draft"
    triggerType = "MANUAL"
    reactFlowData = @{
        nodes = @(
            @{
                id = "start"
                type = "input"
                data = @{
                    label = "🚀 Bắt Đầu"
                }
                position = @{
                    x = 250
                    y = 50
                }
            },
            @{
                id = "http-demo-1"
                type = "httpRequest"
                data = @{
                    label = "HTTP Request"
                    method = "GET"
                    url = "https://jsonplaceholder.typicode.com/users/1"
                }
                position = @{
                    x = 250
                    y = 150
                }
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
                position = @{
                    x = 250
                    y = 300
                }
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
    }
} | ConvertTo-Json -Depth 10

Write-Host "Creating demo workflow..." -ForegroundColor Cyan

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/workflows" -Method POST -Body $body -ContentType "application/json"

Write-Host "✅ Demo workflow created!" -ForegroundColor Green
Write-Host "Workflow ID: $($response.workflow._id)" -ForegroundColor Yellow
Write-Host "Name: $($response.workflow.name)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Mở frontend tại http://localhost:3001 để xem workflow demo!" -ForegroundColor Cyan
