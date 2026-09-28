import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResultRow } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
  });

  async onModuleInit() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    const schema = readFileSync(join(process.cwd(), 'schema.sql'), 'utf8');
    await this.pool.query(schema);
    await this.seed();
  }

  async query<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []) {
    return this.pool.query<T>(sql, params);
  }

  async onModuleDestroy() { await this.pool.end(); }

  private async seed() {
    const u = await this.pool.query('SELECT id FROM nl_users WHERE email=$1', ['demo@nonglac.vn']);
    let userId = u.rows[0]?.id;
    if (!userId) {
      userId = crypto.randomUUID();
      const hash = await bcrypt.hash('nonglac123', 12);
      await this.pool.query(
        'INSERT INTO nl_users(id,email,phone,password_hash,full_name,role) VALUES($1,$2,$3,$4,$5,$6)',
        [userId, 'demo@nonglac.vn', '0900000000', hash, 'Người quản lý Nông Lạc', 'FARM_OWNER'],
      );
    }
    const f = await this.pool.query('SELECT id FROM nl_farms WHERE code=$1', ['DL-A01']);
    let farmId = f.rows[0]?.id;
    if (!farmId) {
      farmId = crypto.randomUUID();
      await this.pool.query(
        'INSERT INTO nl_farms(id,owner_id,code,name,address,latitude,longitude) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [farmId, userId, 'DL-A01', 'Nông Lạc Đà Lạt A01', 'Đà Lạt, Lâm Đồng', 11.9404, 108.4583],
      );
      await this.seedTree(farmId);
    }
    const s = await this.pool.query(
      'SELECT id FROM nl_seasons WHERE farm_id=$1 AND name=$2',
      [farmId, 'Vụ cà phê Arabica 2026'],
    );
    if (!s.rows[0]) {
      const b = await this.pool.query('SELECT id FROM nl_entities WHERE farm_id=$1 AND code=$2', [farmId, 'B01']);
      const seasonId = crypto.randomUUID();
      await this.pool.query(
        'INSERT INTO nl_seasons(id,farm_id,entity_id,name,crop_name,variety,start_date,expected_harvest_date,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [seasonId, farmId, b.rows[0].id, 'Vụ cà phê Arabica 2026', 'Cà phê Arabica', 'Catimor', '2026-01-10', '2026-12-20', 'IN_PROGRESS'],
      );
      await this.seedActivities(farmId, seasonId, userId);
    }
  }

  private async seedTree(farmId: string) {
    const ids = {
      zone: crypto.randomUUID(), field: crypto.randomUUID(),
      bed: crypto.randomUUID(), row: crypto.randomUUID(),
    };
    const rows = [
      [ids.zone, null, 'ZONE', 'Z01', 'Khu A', 1],
      [ids.field, ids.zone, 'FIELD', 'F01', 'Thửa cà phê 01', 2],
      [ids.bed, ids.field, 'BED', 'B01', 'Luống B01', 3],
      [ids.row, ids.bed, 'ROW', 'R01', 'Hàng R01', 4],
    ];
    for (const r of rows) {
      await this.pool.query(
        'INSERT INTO nl_entities(id,farm_id,parent_id,type,code,name,latitude,longitude,depth) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [r[0], farmId, r[1], r[2], r[3], r[4], 11.9405, 108.4584, r[5]],
      );
    }
    for (let i = 1; i <= 6; i++) {
      await this.pool.query(
        'INSERT INTO nl_entities(id,farm_id,parent_id,type,code,name,latitude,longitude,depth) VALUES($1,$2,$3,$4,$5,$6,$7,$8,5)',
        [crypto.randomUUID(), farmId, ids.row, 'PLANT', 'C' + String(i).padStart(3, '0'), 'Cây ' + i, 11.9405 + i / 100000, 108.4584 + i / 100000],
      );
    }
  }

  private async seedActivities(farmId: string, seasonId: string, userId: string) {
    const bed = await this.pool.query('SELECT id FROM nl_entities WHERE farm_id=$1 AND code=$2', [farmId, 'B01']);
    const row = await this.pool.query('SELECT id FROM nl_entities WHERE farm_id=$1 AND code=$2', [farmId, 'R01']);
    const samples: any[] = [
      ['IRRIGATION', 'Tưới nhỏ giọt', 420, 'lít', 1, 'VERIFIED', 'EVIDENCE_SUPPORTED'],
      ['FERTILIZATION', 'Bón phân hữu cơ', 18, 'kg', 3, 'VERIFIED', 'EVIDENCE_SUPPORTED'],
      ['INSPECTION', 'Kiểm tra sinh trưởng', null, null, 6, 'PENDING', 'USER_REPORTED'],
      ['HARVEST', 'Theo dõi quả chín', 12, 'kg', 9, 'PENDING', 'EVIDENCE_SUPPORTED'],
    ];
    for (const x of samples) {
      const id = crypto.randomUUID();
      await this.pool.query(
        'INSERT INTO nl_activities(id,farm_id,target_entity_id,season_id,type,performed_by,started_at,quantity,unit,notes,source,evidence_level,verification_status) VALUES($1,$2,$3,$4,$5,$6,NOW()-($7 || $8)::interval,$9,$10,$11,$12,$13,$14)',
        [id, farmId, x[0] === 'INSPECTION' ? row.rows[0].id : bed.rows[0].id, seasonId, x[0], userId, String(x[4]), ' days', x[2], x[3], x[1], 'USER', x[6], x[5]],
      );
      if (x[5] === 'VERIFIED') {
        await this.pool.query(
          "INSERT INTO nl_evidence(id,activity_id,type,media_url,latitude,longitude,captured_at) VALUES($1,$2,'PHOTO',$3,$4,$5,NOW()-INTERVAL '1 day')",
          [crypto.randomUUID(), id, 'https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=900&q=80', 11.9405, 108.4584],
        );
      }
    }
  }
}