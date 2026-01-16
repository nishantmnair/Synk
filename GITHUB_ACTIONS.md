# GitHub Actions CI/CD

## Test Workflow

Automated tests run on **every push to any branch** and **every pull request**.

### Workflow File

Location: `.github/workflows/test.yml`

### What it Does

1. **Frontend Tests Job**
   - Runs on Ubuntu latest
   - Node.js 20 with npm caching
   - Installs dependencies from `frontend/package-lock.json`
   - Runs tests with coverage (90% minimum required)
   - Uploads coverage reports to Codecov

2. **Backend Tests Job**
   - Runs on Ubuntu latest
   - Python 3.11 with pip caching
   - PostgreSQL 15 service (for testing)
   - Installs dependencies from `backend/requirements.txt`
   - Runs database migrations
   - Runs tests with coverage (90% minimum required)
   - Uploads coverage reports to Codecov

3. **All Tests Status Job**
   - Verifies both frontend and backend tests passed
   - Fails if any tests failed
   - Shows summary of test results

### Trigger Events

```yaml
on:
  push:
    branches: ['**']  # All branches
  pull_request:
    branches: ['**']  # PRs to any branch
```

### Requirements

- ✅ **Zero failures** - All tests must pass
- ✅ **90% coverage** - Coverage must be ≥ 90%
- ✅ **All branches** - Runs on every push

### Status Badge

The workflow shows:
- ✅ **Green checkmark** = All tests passed
- ❌ **Red X** = Tests failed or coverage < 90%

### Viewing Results

1. Go to your GitHub repository
2. Click on **"Actions"** tab
3. Select the workflow run
4. View test results and coverage reports

### Coverage Reports

Coverage reports are:
- Displayed in the workflow output
- Uploaded to Codecov (if configured)
- Available as XML files in artifacts

### Environment Variables

Backend tests use:
- `DB_HOST=localhost` (PostgreSQL service)
- `DB_NAME=synk_db`
- `DB_USER=postgres`
- `DB_PASSWORD=postgres`
- `SECRET_KEY=test-secret-key-for-ci`
- `DEBUG=True`

### Database Setup

PostgreSQL service is automatically:
- Started before backend tests
- Health-checked before migrations
- Available at `localhost:5432`
- Tear-down after tests complete

### Dependencies Caching

Both frontend and backend use dependency caching:
- **Frontend**: npm cache based on `package-lock.json`
- **Backend**: pip cache based on `requirements.txt`

This speeds up workflow runs significantly.

### Failure Behavior

If tests fail:
- Workflow fails with exit code 1
- Status badge shows ❌
- Detailed error messages in logs
- Pull requests blocked (if branch protection enabled)

### Success Behavior

If all tests pass:
- Workflow passes with exit code 0
- Status badge shows ✅
- Coverage reports uploaded
- Ready to merge (if PR)

## Setup

The workflow is automatically configured when you push `.github/workflows/test.yml` to your repository.

No additional setup required!

## Customization

To modify the workflow:
1. Edit `.github/workflows/test.yml`
2. Push changes
3. Workflow automatically runs on the next push

## Troubleshooting

### Tests fail in CI but pass locally
- Check environment variables
- Verify database connection
- Check dependency versions match

### Coverage below 90%
- Add more tests
- Check coverage reports to see what's missing
- Ensure all code paths are tested

### Workflow doesn't run
- Check `.github/workflows/test.yml` exists
- Verify YAML syntax is valid
- Check GitHub Actions is enabled for the repository
