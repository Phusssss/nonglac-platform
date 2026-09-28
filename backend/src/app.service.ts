import { Injectable } from '@nestjs/common';
import { DbService } from './db.service';

@Injectable()
export class AppService {
  constructor(private readonly db: DbService) {}

  async health() {
    const r = await this.db.query('SELECT NOW() AS now');
    return { ok: true, service: 'nonglac-farm-api', database: 'connected', now: r.rows[0].now };
  }

  async userByEmail(email: string) {
    const r = await this.db.query(
      'SELECT id,email,phone,password_hash,full_name,role,is_active FROM nl_users WHERE email=$1',
      [email],
    );
    return r.rows[0];
  }

  async userById(id: string) {
    const r = await this.db.query(
      'SELECT id,email,phone,full_name,role,is_active,created_at FROM nl_users WHERE id=$1',
      [id],
    );
    return r.rows[0];
  }

  async createUser(input: any) {
    const exists = await this.db.query('SELECT id FROM nl_users WHERE email=$1', [input.email]);
    if (exists.rows[0]) throw new Error('EMAIL_EXISTS');
    const id = crypto.randomUUID();
    const bcrypt = await import('bcrypt');
    const hash = await bcrypt.hash(input.password, 12);
    await this.db.query(
      "INSERT INTO nl_users(id,email,phone,password_hash,full_name,role) VALUES($1,$2,$3,$4,$5,'FARM_OWNER')",
      [id, input.email, input.phone || null, hash, input.fullName],
    );
    return this.userById(id);
  }

  async farms(ownerId: string) {
    const r = await this.db.query(
      "SELECT f.*,COUNT(DISTINCT e.id)::int AS entity_count,COUNT(DISTINCT a.id)::int AS activity_count " +
      "FROM nl_farms f LEFT JOIN nl_entities e ON e.farm_id=f.id LEFT JOIN nl_activities a ON a.farm_id=f.id " +
      "WHERE f.owner_id=$1 GROUP BY f.id ORDER BY f.created_at DESC",
      [ownerId],
    );
    return r.rows;
  }

  async createFarm(ownerId: string, body: any) {
    const id = crypto.randomUUID();
    await this.db.query(
      'INSERT INTO nl_farms(id,owner_id,code,name,address,latitude,longitude,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [id, ownerId, body.code, body.name, body.address || null, body.latitude || null, body.longitude || null, body.notes || null],
    );
    return this.farm(id, ownerId);
  }

  async farm(farmId: string, ownerId: string) {
    const r = await this.db.query('SELECT * FROM nl_farms WHERE id=$1 AND owner_id=$2', [farmId, ownerId]);
    if (!r.rows[0]) throw new Error('FARM_NOT_FOUND');
    return r.rows[0];
  }

  async tree(farmId: string, ownerId: string) {
    await this.farm(farmId, ownerId);
    const r = await this.db.query(
      'SELECT id,parent_id,type,code,name,latitude,longitude,status,depth FROM nl_entities WHERE farm_id=$1 ORDER BY depth,code',
      [farmId],
    );
    return r.rows;
  }

  async createEntity(farmId: string, ownerId: string, body: any) {
    await this.farm(farmId, ownerId);
    let depth = 1;
    if (body.parentId) {
      const p = await this.db.query('SELECT depth FROM nl_entities WHERE id=$1 AND farm_id=$2', [body.parentId, farmId]);
      if (!p.rows[0]) throw new Error('PARENT_NOT_FOUND');
      depth = Number(p.rows[0].depth) + 1;
    }
    const id = crypto.randomUUID();
    await this.db.query(
      'INSERT INTO nl_entities(id,farm_id,parent_id,type,code,name,latitude,longitude,depth,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [id, farmId, body.parentId || null, body.type, body.code, body.name, body.latitude || null, body.longitude || null, depth, body.metadata || {}],
    );
    await this.audit(ownerId, 'ENTITY', id, 'CREATE', null, body, 'Táº¡o thá»±c thá»ƒ');
    return (await this.db.query('SELECT * FROM nl_entities WHERE id=$1', [id])).rows[0];
  }

  async seasons(farmId: string, ownerId: string) {
    await this.farm(farmId, ownerId);
    return (await this.db.query(
      'SELECT s.*,e.name AS entity_name FROM nl_seasons s JOIN nl_entities e ON e.id=s.entity_id WHERE s.farm_id=$1 ORDER BY s.start_date DESC',
      [farmId],
    )).rows;
  }

  async createSeason(farmId: string, ownerId: string, body: any) {
    await this.farm(farmId, ownerId);
    const id = crypto.randomUUID();
    await this.db.query(
      'INSERT INTO nl_seasons(id,farm_id,entity_id,name,crop_name,variety,start_date,expected_harvest_date,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [id, farmId, body.entityId, body.name, body.cropName, body.variety || null, body.startDate, body.expectedHarvestDate || null, body.status || 'IN_PROGRESS'],
    );
    await this.audit(ownerId, 'SEASON', id, 'CREATE', null, body, 'Táº¡o mÃ¹a vá»¥');
    return (await this.db.query('SELECT * FROM nl_seasons WHERE id=$1', [id])).rows[0];
  }

  async dashboard(farmId: string, ownerId: string) {
    await this.farm(farmId, ownerId);
    const [stats, latest, alerts, season] = await Promise.all([
      this.db.query(
        "SELECT COUNT(*)::int FILTER (WHERE started_at>=CURRENT_DATE) AS today_count," +
        "COUNT(*)::int FILTER (WHERE verification_status='PENDING') AS pending_count," +
        "COUNT(*)::int FILTER (WHERE created_at>=NOW()-INTERVAL '30 days') AS month_count," +
        "COALESCE(ROUND(AVG(CASE evidence_level WHEN 'AUTOMATED' THEN 1 WHEN 'DEVICE_SUPPORTED' THEN .9 WHEN 'EVIDENCE_SUPPORTED' THEN .75 ELSE .35 END)*100),0)::int AS confidence " +
        "FROM nl_activities WHERE farm_id=$1",
        [farmId],
      ),
      this.activities(farmId, ownerId, { limit: 8 }),
      this.db.query("SELECT id,type,severity,message,status,created_at FROM nl_alerts WHERE farm_id=$1 AND status='OPEN' ORDER BY created_at DESC LIMIT 6", [farmId]),
      this.db.query('SELECT id,name,crop_name,variety,start_date,expected_harvest_date,status FROM nl_seasons WHERE farm_id=$1 ORDER BY start_date DESC LIMIT 1', [farmId]),
    ]);
    return { stats: stats.rows[0], latestActivities: latest, alerts: alerts.rows, activeSeason: season.rows[0] || null };
  }

  async activities(farmId: string, ownerId: string, query: any = {}) {
    await this.farm(farmId, ownerId);
    const params: any[] = [farmId];
    const where = ['a.farm_id=$1'];
    if (query.type) { params.push(query.type); where.push('a.type=$' + params.length); }
    if (query.from) { params.push(query.from); where.push('a.started_at >= $' + params.length); }
    if (query.to) { params.push(query.to); where.push('a.started_at < ($' + params.length + "::date + INTERVAL '1 day')"); }
    const limit = Math.min(Number(query.limit || 50), 100);
    params.push(limit);
    const r = await this.db.query(
      'SELECT a.*,e.name AS entity_name,e.code AS entity_code,u.full_name AS performer,s.name AS season_name,' +
      '(SELECT COUNT(*)::int FROM nl_evidence ev WHERE ev.activity_id=a.id) AS evidence_count ' +
      'FROM nl_activities a JOIN nl_entities e ON e.id=a.target_entity_id JOIN nl_users u ON u.id=a.performed_by ' +
      'LEFT JOIN nl_seasons s ON s.id=a.season_id WHERE ' + where.join(' AND ') +
      ' ORDER BY a.started_at DESC LIMIT $' + params.length,
      params,
    );
    return r.rows;
  }

  async activity(activityId: string, ownerId: string) {
    const r = await this.db.query(
      'SELECT a.*,f.name AS farm_name,e.name AS entity_name,e.code AS entity_code,u.full_name AS performer,s.name AS season_name ' +
      'FROM nl_activities a JOIN nl_farms f ON f.id=a.farm_id JOIN nl_entities e ON e.id=a.target_entity_id JOIN nl_users u ON u.id=a.performed_by ' +
      'LEFT JOIN nl_seasons s ON s.id=a.season_id WHERE a.id=$1 AND f.owner_id=$2',
      [activityId, ownerId],
    );
    if (!r.rows[0]) throw new Error('ACTIVITY_NOT_FOUND');
    const evidence = await this.db.query('SELECT * FROM nl_evidence WHERE activity_id=$1 ORDER BY captured_at DESC', [activityId]);
    return { ...r.rows[0], evidence: evidence.rows };
  }

  async createActivity(farmId: string, ownerId: string, body: any) {
    await this.farm(farmId, ownerId);
    const id = crypto.randomUUID();
    await this.db.query(
      "INSERT INTO nl_activities(id,farm_id,target_entity_id,season_id,type,performed_by,started_at,ended_at,quantity,unit,notes,weather,source,evidence_level,verification_status) " +
      "VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'USER',$13,'PENDING')",
      [id,farmId,body.targetEntityId,body.seasonId||null,body.type,body.performedBy||ownerId,body.startedAt||new Date().toISOString(),
       body.endedAt||null,body.quantity||null,body.unit||null,body.notes||null,body.weather||{},body.evidenceLevel||'USER_REPORTED'],
    );
    await this.audit(ownerId, 'ACTIVITY', id, 'CREATE', null, body, 'Táº¡o nháº­t kÃ½ canh tÃ¡c');
    return this.activity(id, ownerId);
  }

  async addEvidence(activityId: string, ownerId: string, body: any) {
    const act: any = await this.activity(activityId, ownerId);
    const id = crypto.randomUUID();
    await this.db.query(
      'INSERT INTO nl_evidence(id,activity_id,type,media_url,latitude,longitude,captured_at,device_info,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [id,activityId,body.type||'PHOTO',body.mediaUrl||null,body.latitude||null,body.longitude||null,body.capturedAt||new Date().toISOString(),body.deviceInfo||{},body.metadata||{}],
    );
    if (act.verification_status === 'PENDING') {
      await this.db.query("UPDATE nl_activities SET evidence_level='EVIDENCE_SUPPORTED' WHERE id=$1", [activityId]);
    }
    await this.audit(ownerId, 'ACTIVITY', activityId, 'ADD_EVIDENCE', null, body, 'Bá»• sung báº±ng chá»©ng');
    return this.activity(activityId, ownerId);
  }

  async verify(activityId: string, ownerId: string, body: any) {
    const act: any = await this.activity(activityId, ownerId);
    await this.db.query(
      "UPDATE nl_activities SET verification_status='VERIFIED',verification_note=$2,verified_by=$3,verified_at=NOW() WHERE id=$1",
      [activityId,body.reason||null,ownerId],
    );
    await this.audit(ownerId, 'ACTIVITY', activityId, 'VERIFY',
      { verification_status: act.verification_status }, { verification_status: 'VERIFIED', reason: body.reason }, 'XÃ¡c minh nháº­t kÃ½');
    return this.activity(activityId, ownerId);
  }

  async audits(farmId: string, ownerId: string) {
    await this.farm(farmId, ownerId);
    return (await this.db.query(
      "SELECT l.*,u.full_name FROM nl_audit_logs l LEFT JOIN nl_users u ON u.id=l.user_id " +
      "WHERE (l.entity_type='FARM' AND l.entity_id=$1) OR l.entity_id IN (SELECT id FROM nl_activities WHERE farm_id=$1) " +
      "OR l.entity_id IN (SELECT id FROM nl_entities WHERE farm_id=$1) ORDER BY l.created_at DESC LIMIT 100",
      [farmId],
    )).rows;
  }

  async alerts(farmId: string, ownerId: string) {
    await this.farm(farmId, ownerId);
    return (await this.db.query(
      'SELECT a.*,c.notes AS activity_note FROM nl_alerts a LEFT JOIN nl_activities c ON c.id=a.activity_id WHERE a.farm_id=$1 ORDER BY a.created_at DESC LIMIT 100',
      [farmId],
    )).rows;
  }

  async resolveAlert(alertId: string, farmId: string, ownerId: string) {
    await this.farm(farmId, ownerId);
    await this.db.query("UPDATE nl_alerts SET status='RESOLVED',resolved_by=$2,resolved_at=NOW() WHERE id=$1 AND farm_id=$3", [alertId,ownerId,farmId]);
    return { ok: true };
  }

  async publicTrace(seasonId: string) {
    const season = await this.db.query(
      'SELECT s.id,s.name,s.crop_name,s.variety,s.start_date,s.expected_harvest_date,s.status,f.name AS farm_name,f.code AS farm_code,f.address,f.latitude,f.longitude ' +
      'FROM nl_seasons s JOIN nl_farms f ON f.id=s.farm_id WHERE s.id=$1',
      [seasonId],
    );
    if (!season.rows[0]) throw new Error('TRACE_NOT_FOUND');
    const activities = await this.db.query(
      'SELECT a.id,a.type,a.started_at,a.ended_at,a.quantity,a.unit,a.notes,e.name AS entity_name,e.code AS entity_code,' +
      '(SELECT json_agg(ev ORDER BY ev.captured_at DESC) FROM nl_evidence ev WHERE ev.activity_id=a.id) AS evidence ' +
      "FROM nl_activities a JOIN nl_entities e ON e.id=a.target_entity_id WHERE a.season_id=$1 AND a.verification_status='VERIFIED' ORDER BY a.started_at DESC",
      [seasonId],
    );
    return { season: season.rows[0], activities: activities.rows };
  }

  private async audit(userId: string, entityType: string, entityId: string, action: string, oldValue: any, newValue: any, reason: string) {
    await this.db.query(
      'INSERT INTO nl_audit_logs(id,user_id,entity_type,entity_id,action,old_value,new_value,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [crypto.randomUUID(),userId,entityType,entityId,action,oldValue||null,newValue||null,reason],
    );
  }
}
