import { sql } from '../_lib/db.js'
import { setCorsHeaders } from '../_lib/cors.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = requireAuth(req, res)
  if (!user) return

  const { form, animals = [], companions = [] } = req.body

  if (!form) return res.status(400).json({ error: 'Form data required' })
  if (!form.diveSiteName?.trim()) return res.status(400).json({ error: 'Dive site name is required' })
  if (!form.country?.trim())      return res.status(400).json({ error: 'Country is required' })
  if (!form.diveDate)              return res.status(400).json({ error: 'Dive date is required' })

  try {
    // ── Insert dive log ────────────────────────────────────────────────────────
    const [log] = await sql`
      INSERT INTO dive_logs (
        user_id, title, dive_site_id, dive_site_name, country,
        dive_date, entry_time, exit_time, entry_type,
        max_depth_m, avg_depth_m, duration_min,
        surface_interval_min, pressure_start_bar, pressure_end_bar,
        water_type, body_of_water,
        air_temp_c, water_temp_surface_c, water_temp_bottom_c,
        visibility, visibility_m, current,
        wetsuit_type, weight_kg, weight_feeling,
        gear_hood, gear_gloves, gear_boots, gear_torch,
        gear_camera, gear_computer, gear_scooter,
        cylinder_material, cylinder_volume_l, gas_mixture, gas_o2_percent,
        notes,
        site_rating, site_review,
        shop_name, shop_rating, shop_review,
        divemaster_name, divemaster_rating, divemaster_review,
        privacy
      ) VALUES (
        ${user.sub},
        ${form.title?.trim() || null},
        ${form.diveSiteId || null},
        ${form.diveSiteName.trim()},
        ${form.country.trim()},
        ${form.diveDate},
        ${form.entryTime || null},
        ${form.exitTime  || null},
        ${form.entryType || null},
        ${form.maxDepthM    ? parseFloat(form.maxDepthM)    : null},
        ${form.avgDepthM    ? parseFloat(form.avgDepthM)    : null},
        ${form.durationMin  ? parseInt(form.durationMin)    : null},
        ${form.surfaceIntervalMin ? parseInt(form.surfaceIntervalMin) : null},
        ${form.pressureStartBar   ? parseInt(form.pressureStartBar)   : null},
        ${form.pressureEndBar     ? parseInt(form.pressureEndBar)     : null},
        ${form.waterType      || null},
        ${form.bodyOfWater    || null},
        ${form.airTempC           ? parseFloat(form.airTempC)           : null},
        ${form.waterTempSurfaceC  ? parseFloat(form.waterTempSurfaceC)  : null},
        ${form.waterTempBottomC   ? parseFloat(form.waterTempBottomC)   : null},
        ${form.visibility     || null},
        ${form.visibilityM    ? parseFloat(form.visibilityM)    : null},
        ${form.current        || null},
        ${form.wetsuitType    || null},
        ${form.weightKg       ? parseFloat(form.weightKg)       : null},
        ${form.weightFeeling  || null},
        ${form.gearHood     ?? false},
        ${form.gearGloves   ?? false},
        ${form.gearBoots    ?? false},
        ${form.gearTorch    ?? false},
        ${form.gearCamera   ?? false},
        ${form.gearComputer ?? false},
        ${form.gearScooter  ?? false},
        ${form.cylinderMaterial  || null},
        ${form.cylinderVolumeL   ? parseInt(form.cylinderVolumeL)   : null},
        ${form.gasMixture        || null},
        ${form.gasO2Percent      ? parseInt(form.gasO2Percent)      : null},
        ${form.notes?.trim()     || null},
        ${form.siteRating        ? parseInt(form.siteRating)        : null},
        ${form.siteReview?.trim()          || null},
        ${form.shopName?.trim()            || null},
        ${form.shopRating        ? parseInt(form.shopRating)        : null},
        ${form.shopReview?.trim()          || null},
        ${form.divemasterName?.trim()      || null},
        ${form.divemasterRating  ? parseInt(form.divemasterRating)  : null},
        ${form.divemasterReview?.trim()    || null},
        ${form.privacy           || 'public'}
      )
      RETURNING id, created_at AS "createdAt"
    `

    // ── Insert animals ─────────────────────────────────────────────────────────
    if (animals.length > 0) {
      await Promise.all(animals.map((a) => sql`
        INSERT INTO dive_log_animals (dive_log_id, species_id, custom_name, count, photo_url)
        VALUES (
          ${log.id},
          ${a.speciesId  || null},
          ${a.customName?.trim() || null},
          ${a.count      || 1},
          ${a.photoUrl   || null}
        )
      `))
    }

    // ── Insert companions ──────────────────────────────────────────────────────
    if (companions.length > 0) {
      await Promise.all(companions.map((c) => sql`
        INSERT INTO dive_log_companions (dive_log_id, user_id, name, role, verified)
        VALUES (
          ${log.id},
          ${c.userId   || null},
          ${c.name.trim()},
          ${c.role     || 'buddy'},
          ${c.verified ?? false}
        )
      `))
    }

    // ── Increment site visit count ─────────────────────────────────────────────
    if (form.diveSiteId) {
      await sql`
        UPDATE dive_sites
        SET visit_count = visit_count + 1
        WHERE id = ${form.diveSiteId}
      `
    }

    return res.status(201).json({ logId: log.id, createdAt: log.createdAt })
  } catch (err) {
    console.error('dive-logs create error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
