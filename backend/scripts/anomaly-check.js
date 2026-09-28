const { Pool } = require('pg');

async function run() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    const q = await pool.query(
      "SELECT a.id,a.farm_id,a.type,e.name AS entity_name FROM nl_activities a JOIN nl_entities e ON e.id=a.target_entity_id WHERE a.created_at < NOW()-INTERVAL '24 hours' AND a.verification_status='PENDING' AND NOT EXISTS (SELECT 1 FROM nl_evidence ev WHERE ev.activity_id=a.id) AND a.type IN ('PESTICIDE','FERTILIZATION','HARVEST')",
    );
    for (const row of q.rows) {
      await pool.query(
        "INSERT INTO nl_alerts(id,farm_id,activity_id,type,severity,message) VALUES($1,$2,$3,$4,'HIGH',$5) ON CONFLICT(activity_id,type,status) DO NOTHING",
        [crypto.randomUUID(), row.farm_id, row.id, 'MISSING_EVIDENCE', 'Nhật ký ' + row.type + ' tại ' + row.entity_name + ' đã quá 24 giờ nhưng chưa có bằng chứng.'],
      );
    }
    console.log('Anomaly check complete. scanned=' + q.rowCount);
  } finally {
    await pool.end();
  }
}
run().catch((e) => { console.error(e); process.exit(1); });