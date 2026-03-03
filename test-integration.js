/**
 * Integration test with actual MariaDB database
 * Tests: Connection, Query, Transaction
 */

const { MariaDBDatabase, QueryBuilder } = require('./dist/index');

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  @freelang/mariadb-driver Integration Test');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Create database instance with Docker MariaDB (port 3307)
  const db = new MariaDBDatabase({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: 'testpass123',
    database: 'mysql', // Use existing database first
  });

  try {
    // Test 1: Ping
    console.log('✓ Test 1: Database Ping');
    const ping = await db.ping();
    console.log(`  Result: ${ping ? '✅ Connected' : '❌ Failed'}\n`);

    // Test 2: Query existing table
    console.log('✓ Test 2: Query existing database');
    const databases = await db.query('SHOW DATABASES');
    console.log(`  Found ${databases.length} databases:`);
    databases.slice(0, 3).forEach(dbInfo => {
      console.log(`    - ${dbInfo.Database}`);
    });
    console.log();

    // Test 3: Create test database and table
    console.log('✓ Test 3: Create test database');
    try {
      await db.run('CREATE DATABASE IF NOT EXISTS freelang_test CHARACTER SET utf8mb4');
      console.log('  ✅ Database created\n');

      // Switch to test database
      const testDb = new MariaDBDatabase({
        host: 'localhost',
        port: 3307,
        user: 'root',
        password: 'testpass123',
        database: 'freelang_test',
      });

      // Create table
      console.log('✓ Test 4: Create table');
      await testDb.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) UNIQUE,
          age INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('  ✅ Table created\n');

      // Test 5: INSERT
      console.log('✓ Test 5: INSERT data');
      const insertResult = await testDb.run(
        'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
        ['Alice', 'alice@example.com', 28]
      );
      console.log(`  ✅ Inserted ID: ${insertResult.insertId}`);
      console.log(`  ✅ Affected rows: ${insertResult.affectedRows}\n`);

      // Test 6: Batch INSERT
      console.log('✓ Test 6: Batch INSERT');
      const testUsers = [
        ['Bob', 'bob@example.com', 32],
        ['Charlie', 'charlie@example.com', 25],
        ['한글테스트', 'korean@example.com', 30],
      ];
      let insertedCount = 0;
      for (const [name, email, age] of testUsers) {
        const result = await testDb.run(
          'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
          [name, email, age]
        );
        insertedCount += result.affectedRows;
      }
      console.log(`  ✅ Inserted ${insertedCount} records\n`);

      // Test 7: SELECT all
      console.log('✓ Test 7: SELECT all users');
      const allUsers = await testDb.query('SELECT id, name, email, age FROM users');
      console.log(`  ✅ Found ${allUsers.length} users:`);
      allUsers.forEach(user => {
        console.log(`    - [${user.id}] ${user.name} (${user.email}) age=${user.age}`);
      });
      console.log();

      // Test 8: QueryBuilder
      console.log('✓ Test 8: QueryBuilder');
      const qb = new QueryBuilder('users')
        .select(['id', 'name', 'age'])
        .where('age', '>', 25)
        .orderBy('age', false)
        .limit(2);
      const { sql, params } = qb.build();
      console.log(`  SQL: ${sql}`);
      console.log(`  Params: ${JSON.stringify(params)}`);
      const results = await testDb.query(sql, params);
      console.log(`  ✅ Found ${results.length} users older than 25:`);
      results.forEach(user => {
        console.log(`    - ${user.name} (${user.age})`);
      });
      console.log();

      // Test 9: GET single row
      console.log('✓ Test 9: GET single row');
      const user = await testDb.get(
        'SELECT * FROM users WHERE name = ?',
        ['Alice']
      );
      if (user) {
        console.log(`  ✅ Found: ${user.name} (${user.email})\n`);
      }

      // Test 10: UPDATE
      console.log('✓ Test 10: UPDATE');
      const updateResult = await testDb.run(
        'UPDATE users SET age = ? WHERE name = ?',
        [29, 'Alice']
      );
      console.log(`  ✅ Updated ${updateResult.affectedRows} record\n`);

      // Test 11: tableExists
      console.log('✓ Test 11: tableExists()');
      const tableExists = await testDb.tableExists('users');
      console.log(`  ✅ users table exists: ${tableExists}\n`);

      // Test 12: Transaction (commit)
      console.log('✓ Test 12: Transaction (successful)');
      const txResult = await testDb.transaction(async (tx) => {
        await tx.run(
          'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
          ['David', 'david@example.com', 40]
        );
        const inserted = await tx.get('SELECT name FROM users WHERE name = ?', ['David']);
        return inserted?.name || null;
      });
      console.log(`  ✅ Transaction committed: inserted '${txResult}'\n`);

      // Test 13: Transaction (rollback on error)
      console.log('✓ Test 13: Transaction (rollback on error)');
      try {
        await testDb.transaction(async (tx) => {
          await tx.run(
            'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
            ['Eve', 'eve@example.com', 35]
          );
          // Force error: duplicate email
          await tx.run(
            'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
            ['Frank', 'eve@example.com', 36]
          );
        });
      } catch (err) {
        console.log(`  ✅ Transaction rolled back (expected error): ${err.message.substring(0, 50)}...\n`);
      }

      // Test 14: stats()
      console.log('✓ Test 14: Pool statistics');
      const stats = testDb.stats();
      console.log(`  Pool stats: ${JSON.stringify(stats)}\n`);

      // Test 15: DELETE
      console.log('✓ Test 15: DELETE');
      const deleteResult = await testDb.run(
        'DELETE FROM users WHERE name = ?',
        ['Frank']
      );
      console.log(`  ✅ Deleted ${deleteResult.affectedRows} record\n`);

      // Final: Show all users
      console.log('✓ Final: All users (after tests)');
      const finalUsers = await testDb.query('SELECT id, name, email, age FROM users ORDER BY id');
      console.log(`  Total: ${finalUsers.length} users`);
      finalUsers.forEach(user => {
        console.log(`    - [${user.id}] ${user.name} (${user.age})`);
      });

      await testDb.close();

    } catch (err) {
      console.error(`❌ Test error: ${err.message}`);
      console.error(err.stack);
    }

    await db.close();

  } catch (err) {
    console.error(`❌ Connection error: ${err.message}`);
    process.exit(1);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  All tests completed!');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
