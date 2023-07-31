# Define the output ZIP file name
$zipFileName = "LeafLLM.zip"

# Get the current directory path
$currentDirectory = Get-Location

# Delete the ZIP file if it already exists
if (Test-Path $zipFileName) {
    Remove-Item $zipFileName -Force
    Write-Host "Existing ZIP file '$zipFileName' deleted."
}

# Create an array of directories and files to exclude from the ZIP
$excludeItems = @(".idea", ".git", ".gitignore", "deploy.sh", "deploy.ps1")

# Get the files and folders in the current directory excluding the specified items
$itemsToZip = Get-ChildItem -Path $currentDirectory -Exclude $excludeItems

# Compress the items to a ZIP archive
Compress-Archive -Path $itemsToZip.FullName -DestinationPath $zipFileName

Write-Host "ZIP file created: $zipFileName"
