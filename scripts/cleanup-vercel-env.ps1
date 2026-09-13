# Temporary script: clean up Vercel environment variables for edwin-leathers.
# 1) Removes unused / demo / cache-corrupting vars from all environments.
# 2) Adds the definitive value set (from the owner's config notes) to
#    production, preview and development.
# Safe to re-run: rm errors on missing vars are ignored, add is idempotent-ish.
$ErrorActionPreference = "Continue"
Set-Location D:\edwin-leathers
$results = @()

function Remove-EnvVar([string]$name) {
  $removed = $false
  foreach ($e in @("production", "preview", "development")) {
    $out = cmd /c "npx vercel env rm $name $e --yes 2>&1"
    if ($LASTEXITCODE -eq 0) { $removed = $true }
  }
  $script:results += if ($removed) { "REMOVED  $name" } else { "NOTFOUND $name" }
}

# ── 1. Remove unnecessary variables ──
$killList = @(
  "NEXT_PUBLIC_API_URL",              # unused in code
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",    # demo placeholder G-DEMO123456
  "NEXT_PUBLIC_SENTRY_DSN",           # demo placeholder, unused
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",      # unused in code (had trailing space)
  "SENTRY_DSN",                       # no Sentry account configured
  "SENTRY_AUTH_TOKEN",                # unused in code
  "ERROR_REPORT_REPO",                # optional GitHub error dispatch, unused
  "ERROR_REPORT_TOKEN",
  "ERROR_REPORT_MIN_INTERVAL_MS",
  "SUPERADMIN_EMAIL",                 # unused in code
  "TURBO_CACHE",                      # Turbopack remote cache - CORRUPTED
  "TURBO_REMOTE_ONLY",                # forces use of the corrupted cache
  "TURBO_DOWNLOAD_LOCAL_ENABLED",
  "TURBO_RUN_SUMMARY",
  "NX_DAEMON",                        # nx not used
  "SITE_URL",                         # redundant, CLIENT_URL covers it
  "PORT",                             # Vercel manages its own
  "NODE_ENV",                         # Vercel sets it automatically
  "APP_ENV",                          # redundant fallback
  "DEMO_MODE",                        # must be false in production (default)
  "RAZORPAY_TEST_KEY_ID",             # redundant (generic keys cover test mode)
  "RAZORPAY_TEST_KEY_SECRET",
  "RAZORPAY_TEST_WEBHOOK_SECRET"
)
foreach ($k in $killList) { Remove-EnvVar $k }

# ── 2. Add the definitive values to all environments ──
$values = [ordered]@{
  "MONGODB_URI"                    = "mongodb+srv://supportedwinleather_db_user:rYY6rAJt1JsbKhti@cluster0.puv29j6.mongodb.net/?appName=Cluster0"
  "BACKOFFICE_DB_NAME"             = "edwin-backoffice"
  "CLOUDINARY_CLOUD_NAME"          = "z7o6zvqo"
  "CLOUDINARY_API_KEY"             = "789697427655279"
  "CLOUDINARY_API_SECRET"          = "ZwjC9s2Mu8O7qQmrS7HbFuF1LZI"
  "RAZORPAY_KEY_ID"                = "rzp_test_TPtEyMkZ4rkCkq"
  "RAZORPAY_KEY_SECRET"            = "dKmWjRyBzG0PAEDZVcmB1rSD"
  "RAZORPAY_WEBHOOK_SECRET"        = "PAetWlvO9gttlIxWqeo8CbMc9fCDT2eIoolg87W0"
  "RAZORPAY_LIVE_KEY_ID"           = "rzp_live_TYqCKmILw49mAC"
  "RAZORPAY_LIVE_KEY_SECRET"       = "c41xlZcty0epyxk8qQqKVf13"
  "RAZORPAY_LIVE_WEBHOOK_SECRET"   = 'fPO:Wi`v5VeFImpJ3j0-v'
  "GMAIL_USER"                     = "Support.edwinleather@gmail.com"
  "GMAIL_APP_PASSWORD"             = "uhxqeuhvkvncgblp"
  "EMAIL_FROM"                     = "Edwin Leathers <Support.edwinleather@gmail.com>"
  "GOOGLE_CLIENT_ID"               = "1000026087780-cuuob7qtu334bc6m4jn61s70v3gs5dud.apps.googleusercontent.com"
  "NEXT_PUBLIC_GOOGLE_CLIENT_ID"   = "1000026087780-cuuob7qtu334bc6m4jn61s70v3gs5dud.apps.googleusercontent.com"
  "CLIENT_URL"                     = "https://edwinleather.com"
  "NEXT_PUBLIC_SITE_URL"           = "https://edwinleather.com"
}

function Add-EnvVar([string]$name, [string]$value) {
  $added = 0
  foreach ($e in @("production", "preview", "development")) {
    # rm first so add never collides with an existing value
    cmd /c "npx vercel env rm $name $e --yes 2>&1" | Out-Null
    $out = $value | cmd /c "npx vercel env add $name $e 2>&1"
    if ($LASTEXITCODE -eq 0) { $added++ }
  }
  $script:results += "ADDED($added/3) $name"
}

foreach ($k in $values.Keys) { Add-EnvVar $k $values[$k] }

# ── 3. Report ──
$results | Sort-Object | Out-File -FilePath D:\edwin-leathers\vercel-env-cleanup.log -Encoding utf8
cmd /c "npx vercel env ls 2>&1" | Out-File -FilePath D:\edwin-leathers\vercel-env-final.log -Encoding utf8
Write-Output "DONE"
