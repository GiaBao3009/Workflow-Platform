Write-Host "`nMONGODB CONNECTED!" -ForegroundColor Green

# Tao workflow moi
$workflow = @{
    userId = "user-demo-123"
    name = "Test MongoDB Persistence"
    description = "Workflow nay se ton tai sau khi restart"
    status = "draft"
    triggerType = "MANUAL"
    reactFlowData = @{
        nodes = @(
            @{
                id = "start"
                type = "input"
                data = @{ label = "Start" }
                position = @{ x = 100; y = 100 }
            },
            @{
                id = "http-persist-1"
                type = "httpRequest"
                data = @{
                    label = "HTTP Request"
                    url = "https://jsonplaceholder.typicode.com/users/1"
                    method = "GET"
                }
                position = @{ x = 300; y = 100 }
            }
        )
        edges = @(
            @{
                id = "e1"
                source = "start"
                target = "http-persist-1"
            }
        )
    }
} | ConvertTo-Json -Depth 10

Write-Host "`nCreating workflow in MongoDB..." -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/workflows" -Method POST -Body $workflow -ContentType "application/json"
Write-Host "Created workflow ID: $($response.workflow._id)" -ForegroundColor Green
Write-Host "Name: $($response.workflow.name)" -ForegroundColor White

# Lay danh sach workflows
Write-Host "`nFetching workflows from MongoDB..." -ForegroundColor Cyan
$workflows = Invoke-RestMethod -Uri "http://localhost:3001/api/workflows?userId=user-demo-123" -Method GET
Write-Host "Found $($workflows.total) workflow(s) in database" -ForegroundColor Green
$workflows.workflows | ForEach-Object { Write-Host "   - $($_.name) [$($_._id)]" -ForegroundColor White }

Write-Host "`nData is now stored in MongoDB Atlas!" -ForegroundColor Magenta
Write-Host "Restart backend and workflows will still be there" -ForegroundColor Yellow
