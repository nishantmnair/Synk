# GitHub Actions Workflows

## Test Workflow (`.github/workflows/test.yml`)

This workflow runs on **every push** to **any branch** and **every pull request**.

### What it does:

1. **Frontend Tests**
   - Sets up Node.js 20
   - Installs dependencies from `frontend/package-lock.json`
   - Runs tests with coverage (90% minimum required)
   - Uploads coverage to Codecov

2. **Backend Tests**
   - Sets up Python 3.11
   - Starts PostgreSQL service
   - Installs dependencies from `backend/requirements.txt`
   - Runs database migrations
   - Runs tests with coverage (90% minimum required)
   - Uploads coverage to Codecov

3. **Status Check**
   - Verifies both frontend and backend tests passed
   - Fails the workflow if any tests fail

### Requirements:

- ✅ **Zero failures** - All tests must pass
- ✅ **90% coverage** - Coverage must be ≥ 90% or tests fail
- ✅ **All branches** - Runs on every push to any branch

### Badge Status:

The workflow will show:
- ✅ Green checkmark = All tests passed
- ❌ Red X = Tests failed or coverage below 90%

### Viewing Results:

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Select the workflow run
4. View test results and coverage reports

### Coverage Reports:

Coverage reports are automatically uploaded to Codecov (if configured) or can be viewed in the workflow artifacts.
