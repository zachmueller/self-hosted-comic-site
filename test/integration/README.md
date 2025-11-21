# Integration Tests

This directory contains integration tests for the Lambda functions that interact with DynamoDB.

## Prerequisites

### 1. DynamoDB Local

Integration tests require DynamoDB Local to be running on port 8000.

#### Installation

**Using Docker (Recommended):**
```bash
docker pull amazon/dynamodb-local
docker run -p 8000:8000 amazon/dynamodb-local
```

**Using Java JAR:**
```bash
# Download DynamoDB Local
wget https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz
tar -xzf dynamodb_local_latest.tar.gz
cd dynamodb_local_latest

# Run DynamoDB Local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000
```

#### Verify DynamoDB Local is Running

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000 --region us-east-1
```

You should see an empty tables list or tables from previous test runs.

### 2. Install Dependencies

```bash
cd test/integration
npm install
```

## Running Tests

### Run All Integration Tests

```bash
npm test
```

### Watch Mode (Auto-run on file changes)

```bash
npm run test:watch
```

### UI Mode (Interactive test runner)

```bash
npm run test:ui
```

## Test Structure

### Test Files

- `api.test.ts` - Integration tests for all Lambda function handlers

### Test Setup

Each test suite:
1. Creates test DynamoDB tables (ComicsTable-Test, ConfigTable-Test)
2. Populates test data from fixtures
3. Runs tests against Lambda handlers
4. Cleans up tables after tests

### Test Coverage

**GetComics (READER-001, READER-002):**
- Pagination logic
- Tag filtering
- Empty results
- Invalid parameters

**GetComic (READER-003):**
- Comic retrieval
- Relationship resolution
- Missing comic handling
- Invalid slug

**SearchComicTitles (READER-007):**
- Prefix matching
- Case-insensitive search
- Empty query handling
- Result limits

**ProcessUpload (UPLOAD-010):**
- Metadata validation
- Bidirectional relationship creation
- Invalid data handling
- Missing required fields

**GeneratePresignedUrl (UPLOAD-009):**
- Authentication validation
- File validation (type, size, extension)
- Presigned URL generation
- Invalid file handling

**GetConfig (CONFIG-002):**
- Config retrieval
- Default values
- Missing config handling

**UpdateConfig (CONFIG-003):**
- Config updates
- Validation
- Authentication
- Invalid updates

## Test Data

Tests use the following test tables:
- `ComicsTable-Test` - Test comics with relationships
- `ConfigTable-Test` - Test site configuration

Test data includes:
- Comics with caption references: `[[Referenced Comic]]`
- Comics with series relationships
- Comics with tag relationships
- Valid and invalid configurations

## Troubleshooting

### DynamoDB Local not running

**Error:** `ECONNREFUSED 127.0.0.1:8000`

**Solution:** Start DynamoDB Local before running tests:
```bash
docker run -p 8000:8000 amazon/dynamodb-local
```

### Port 8000 already in use

**Error:** `address already in use`

**Solution:** Stop other processes using port 8000:
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>
```

### Tests timing out

**Error:** `Test timed out after 30000ms`

**Solution:** 
- Ensure DynamoDB Local is running and responsive
- Check network connectivity to localhost:8000
- Increase timeout in vitest.config.ts if needed

### Table already exists

**Error:** `ResourceInUseException: Table already exists`

**Solution:** Tables are created fresh for each test run. If tests fail midway, tables may not be cleaned up. Restart DynamoDB Local to clear all tables:
```bash
# Stop and restart Docker container
docker stop <container-id>
docker run -p 8000:8000 amazon/dynamodb-local
```

## Constitutional Compliance

Integration tests validate:

**Cost-Conscious:**
- Efficient query patterns (GSI usage, pagination)
- Minimal DynamoDB RCU/WCU usage
- Query filtering over scan operations

**Artist-First:**
- Upload workflow validation prioritized
- Relationship creation tested thoroughly
- Error messages validated for clarity

**Serverless-First:**
- Tests use DynamoDB (managed service)
- No server infrastructure required
- Lambda function handlers tested in isolation

## Adding New Tests

When adding new Lambda functions:

1. Create test data fixtures
2. Add test suite to `api.test.ts`
3. Test success paths
4. Test error handling
5. Test authentication (if required)
6. Test validation (if applicable)
7. Verify constitutional compliance

## CI/CD Integration

These tests should run in CI/CD pipelines with DynamoDB Local:

```yaml
# Example GitHub Actions
- name: Start DynamoDB Local
  run: docker run -d -p 8000:8000 amazon/dynamodb-local

- name: Run Integration Tests
  run: |
    cd test/integration
    npm install
    npm test
```

## Performance Considerations

- Tests create/delete tables for each suite
- Use `beforeAll` / `afterAll` for table lifecycle
- Mock S3 operations (presigned URL generation)
- Tests run in ~10-30 seconds total

## Next Steps

After integration tests pass:
1. Run E2E tests (TEST-005)
2. Run cross-device tests (TEST-006)
3. Run performance tests (TEST-007)
4. Validate constitutional compliance (TEST-008)
5. Monitor actual costs (TEST-009)
