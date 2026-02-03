/**
 * Test: Does attendance flow from mobile (simulated) to MySQL?
 * 1. Login -> get JWT
 * 2. POST /api/attendance/mark (like the app)
 * 3. GET /api/attendance/report -> check if record appears
 */
const BASE = 'http://localhost:3000';

async function main() {
  console.log('1. Login...');
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@demo.com', password: 'admin123' }),
  });
  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, await loginRes.text());
    process.exit(1);
  }
  const { token } = await loginRes.json();
  console.log('   OK, got token');

  const now = Math.floor(Date.now() / 1000);
  const body = {
    zoneId: 'zone-1',
    siteId: '1',
    type: 'IN',
    latitude: 12.34,
    longitude: 56.78,
    accuracy: 10,
    timestamp: now,
  };

  console.log('2. POST /api/attendance/mark (simulate mobile app)...');
  const markRes = await fetch(`${BASE}/api/attendance/mark`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!markRes.ok) {
    console.error('Mark failed:', markRes.status, await markRes.text());
    process.exit(1);
  }
  console.log('   OK, mark accepted');

  console.log('3. GET /api/attendance/report (check MySQL)...');
  const reportRes = await fetch(`${BASE}/api/attendance/report`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!reportRes.ok) {
    console.error('Report failed:', reportRes.status, await reportRes.text());
    process.exit(1);
  }
  const report = await reportRes.json();
  const count = report.data?.length ?? 0;
  const hasToday = report.data?.some(
    (r) => r.checkInTime && new Date(r.checkInTime).getTime() / 1000 >= now - 60
  );
  console.log('   OK, report rows:', count);
  if (count > 0) {
    console.log('   Sample:', JSON.stringify(report.data[0], null, 2));
  }
  console.log('');
  console.log(count > 0 ? 'Result: Attendance data IS flowing to MySQL.' : 'Result: No data in report (seed may not have run or date filter).');
  if (hasToday) console.log('Result: Today\'s mark is present in MySQL.');

  // 4. Send OUT (check-out) so last_out_time gets set
  const outTime = now + 3600; // 1 hour later
  const outBody = { ...body, type: 'OUT', timestamp: outTime };
  console.log('\n4. POST /api/attendance/mark type=OUT (check-out)...');
  const outRes = await fetch(`${BASE}/api/attendance/mark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(outBody),
  });
  if (!outRes.ok) {
    console.error('Mark OUT failed:', outRes.status, await outRes.text());
    return;
  }
  console.log('   OK, check-out accepted');

  console.log('5. GET /api/attendance/report again (verify last_out_time)...');
  const report2Res = await fetch(`${BASE}/api/attendance/report`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const report2 = await report2Res.json();
  const todayRow = report2.data?.find((r) => r.employeeId === '1');
  if (todayRow) {
    console.log('   checkInTime:', todayRow.checkInTime);
    console.log('   checkOutTime:', todayRow.checkOutTime);
    console.log('   totalMinutes:', todayRow.totalMinutes);
    if (todayRow.checkOutTime) {
      console.log('\nResult: last_out_time IS set in MySQL after sending OUT.');
    } else {
      console.log('\nResult: checkOutTime still missing - server OUT logic may need check.');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
