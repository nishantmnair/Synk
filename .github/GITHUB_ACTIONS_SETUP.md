# GitHub Actions CI/CD Setup

This project uses GitHub Actions to automatically run tests on every push and pull request.

## Workflows

### Backend Tests (`.github/workflows/backend-tests.yml`)
- Runs on every push/PR to `main` and `develop` branches
- Sets up PostgreSQL and Redis services
- Installs Python dependencies
- Runs Django migrations
- Executes pytest with coverage reporting
- Uploads coverage to Codecov

**Triggers on changes to:**
- `backend/**` files
- This workflow file itself

### Frontend Tests (`.github/workflows/frontend-tests.yml`)
- Runs on every push/PR to `main` and `develop` branches
- Sets up Node.js environment
- Installs npm dependencies
- Runs linter (continues on error)
- Executes vitest with coverage
- Uploads coverage to Codecov

**Triggers on changes to:**
- `frontend/**` files
- This workflow file itself

### Main CI Workflow (`.github/workflows/ci.yml`)
- Orchestrates both backend and frontend workflows
- Runs on every push/PR to `main` and `develop`
- Provides overall status check

## Setup Instructions

The workflows are already configured and will start running automatically when you push to GitHub. No additional setup required!

### Optional Enhancements

1. **Codecov Integration** (for coverage reports):
   - Workflows already upload coverage to Codecov
   - Create a free account at [codecov.io](https://codecov.io)
   - Link your GitHub repository

2. **Branch Protection Rules**:
   - Go to GitHub repo Settings → Branches
   - Add rule for `main` branch
   - Require status checks to pass before merging
   - Select "All tests passed" as required check

3. **Notifications**:
   - GitHub will notify you of workflow failures by default
   - Configure additional notifications in GitHub settings

## Test Requirements

### Backend
- Python 3.12+
- PostgreSQL 15 (provided by GitHub Actions)
- Redis 7 (provided by GitHub Actions)
- All dependencies in `backend/requirements.txt`

### Frontend
- Node.js 18+
- All dependencies in `frontend/package.json`

## Viewing Results

1. Go to the **Actions** tab in your GitHub repository
2. Click on a workflow run to see details
3. Check individual job logs for test output
4. Coverage reports are uploaded to Codecov (if configured)

## Troubleshooting

If tests fail in GitHub Actions but pass locally:

1. **Check environment variables**: Some env vars might be missing
2. **Check service connectivity**: Database/Redis URLs might differ
3. **View full logs**: Click on failed job to see detailed error messages
4. **Match Python/Node versions**: Ensure you're using the same versions locally

## Current Test Status

- **Backend**: 48 tests passing
- **Frontend**: 41 tests passing
- **Total**: 89 tests in CI/CD pipeline

## Modifying Workflows

To change test behavior, edit the workflow files in `.github/workflows/`:
- Add environment variables
- Change Python/Node versions
- Modify service configurations
- Add additional test steps

Changes to workflow files take effect on the next push.
