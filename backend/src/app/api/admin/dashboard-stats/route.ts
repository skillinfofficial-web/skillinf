import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const COLLECTION = 'SiteSettings';
const KEY = 'adminReadTimestamps';
const EPOCH = new Date(0);
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

type RangeKey = '7d' | '30d' | '90d' | 'all';

function parseRange(raw: string | null): RangeKey {
  if (raw === '7d' || raw === '30d' || raw === '90d' || raw === 'all') return raw;
  return '30d';
}

function toIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date(0).toISOString();
}

function getIstKeys(now: Date) {
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const istDateStr = istNow.toISOString().slice(0, 10); // YYYY-MM-DD in IST
  const istMonthStr = istDateStr.slice(0, 7);          // YYYY-MM in IST
  const todayStartUTC = new Date(`${istDateStr}T00:00:00.000+05:30`);
  return { istDateStr, istMonthStr, todayStartUTC };
}

function buildDailyDateList(todayStartUTC: Date, days: number): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayStartUTC.getTime() - i * DAY_MS);
    const ist = new Date(d.getTime() + IST_OFFSET_MS);
    const key = ist.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
    });
    result.push({ key, label });
  }
  return result;
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return ym;
  const d = new Date(Date.UTC(y, m - 1, 15));
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

async function getTimestamps(db: Awaited<ReturnType<typeof getDatabase>>) {
  const doc = await db.collection(COLLECTION).findOne({ key: KEY });
  return {
    registrations:   doc?.registrations   ? new Date(doc.registrations)   : EPOCH,
    linkedinPending: doc?.linkedinPending ? new Date(doc.linkedinPending) : EPOCH,
    eCertPending:    doc?.eCertPending    ? new Date(doc.eCertPending)    : EPOCH,
    physicalCert:    doc?.physicalCert    ? new Date(doc.physicalCert)    : EPOCH,
  };
}

// ── GET /api/admin/dashboard-stats?range=7d|30d|90d|all ──────────────────────
export async function GET(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const range = parseRange(req.nextUrl.searchParams.get('range'));
    const db = await getDatabase();
    const now = new Date();
    const ts = await getTimestamps(db);

    const { istDateStr, istMonthStr, todayStartUTC } = getIstKeys(now);
    const yesterdayStartUTC = new Date(todayStartUTC.getTime() - DAY_MS);
    const last24hUTC        = new Date(now.getTime() - DAY_MS);
    const sevenDaysUTC      = new Date(todayStartUTC.getTime() - 6 * DAY_MS);
    const thirtyDaysUTC     = new Date(todayStartUTC.getTime() - 29 * DAY_MS);

    const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : null;
    const rangeStartUTC = rangeDays ? new Date(todayStartUTC.getTime() - (rangeDays - 1) * DAY_MS) : null;
    const prevRangeStartUTC =
      rangeStartUTC && rangeDays ? new Date(rangeStartUTC.getTime() - rangeDays * DAY_MS) : null;

    const rangeFilterStage = rangeStartUTC
      ? [{ $match: { _createdAt: { $gte: rangeStartUTC } } }]
      : [];

    const tsFormat = range === 'all' ? '%Y-%m' : '%Y-%m-%d';
    const usersSeriesMatch = rangeStartUTC
      ? { _createdAt: { $gte: rangeStartUTC } }
      : { _createdAt: { $ne: null } };

    // ── Single $facet on users ────────────────────────────────────────────────
    const usersAggPromise = db.collection('users').aggregate([
      {
        $addFields: {
          _createdAt:   { $convert: { input: '$createdAt', to: 'date', onError: null, onNull: null } },
          _updatedAt:   { $convert: { input: '$updatedAt', to: 'date', onError: null, onNull: null } },
          _physRegAt:   { $convert: { input: '$physicalCertificate.registeredAt', to: 'date', onError: null, onNull: null } },
          _isLiVer:     { $in: ['$linkedinVerified', [true, 'approved']] },
          _isLiPend:    { $eq: ['$linkedinVerified', 'pending'] },
          _isStep1:     { $eq: ['$steps.step1', true] },
          _isStep2:     { $eq: ['$steps.step2', true] },
          _isStep3:     { $eq: ['$steps.step3', true] },
          _isStep4:     { $eq: ['$steps.step4', true] },
          _isECertPaid: { $eq: ['$paymentDone', true] },
          _isCertUnl:   { $eq: ['$certificateUnlocked', true] },
          _isPhysPaid:  { $eq: ['$physicalCertificate.paid', true] },
          _isWaJoined:  { $eq: ['$hasJoinedWhatsapp', true] },
          _isReferred:  {
            $and: [
              { $ne: ['$referredBy', null] },
              { $ne: ['$referredBy', ''] },
              { $gt: [{ $strLenCP: { $ifNull: ['$referredBy', ''] } }, 0] },
            ],
          },
        },
      },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                totalUsers:       { $sum: 1 },
                todaySignups:     { $sum: { $cond: [{ $and: [{ $ne: ['$_createdAt', null] }, { $gte: ['$_createdAt', todayStartUTC] }] }, 1, 0] } },
                yesterdaySignups: { $sum: { $cond: [{ $and: [{ $ne: ['$_createdAt', null] }, { $gte: ['$_createdAt', yesterdayStartUTC] }, { $lt: ['$_createdAt', todayStartUTC] }] }, 1, 0] } },
                last24hSignups:   { $sum: { $cond: [{ $and: [{ $ne: ['$_createdAt', null] }, { $gte: ['$_createdAt', last24hUTC] }] }, 1, 0] } },
                last7dSignups:    { $sum: { $cond: [{ $and: [{ $ne: ['$_createdAt', null] }, { $gte: ['$_createdAt', sevenDaysUTC] }] }, 1, 0] } },
                last30dSignups:   { $sum: { $cond: [{ $and: [{ $ne: ['$_createdAt', null] }, { $gte: ['$_createdAt', thirtyDaysUTC] }] }, 1, 0] } },
                rangeSignups:     rangeStartUTC
                  ? { $sum: { $cond: [{ $and: [{ $ne: ['$_createdAt', null] }, { $gte: ['$_createdAt', rangeStartUTC] }] }, 1, 0] } }
                  : { $sum: 1 },
                prevRangeSignups: prevRangeStartUTC && rangeStartUTC
                  ? { $sum: { $cond: [{ $and: [{ $ne: ['$_createdAt', null] }, { $gte: ['$_createdAt', prevRangeStartUTC] }, { $lt: ['$_createdAt', rangeStartUTC] }] }, 1, 0] } }
                  : { $sum: 0 },
                physicalToday:    { $sum: { $cond: [{ $and: [{ $eq: ['$_isPhysPaid', true] }, { $ne: ['$_physRegAt', null] }, { $gte: ['$_physRegAt', todayStartUTC] }] }, 1, 0] } },

                // Unread counts (since admin read timestamp)
                unreadRegistrations:   { $sum: { $cond: [{ $and: [{ $ne: ['$_createdAt', null] }, { $gt: ['$_createdAt', ts.registrations] }] }, 1, 0] } },
                unreadLinkedinPending: { $sum: { $cond: [{ $and: ['$_isLiPend', { $ne: ['$_updatedAt', null] }, { $gt: ['$_updatedAt', ts.linkedinPending] }] }, 1, 0] } },
                unreadECertPending:    { $sum: { $cond: [{ $and: ['$_isECertPaid', { $not: ['$_isCertUnl'] }, { $ne: ['$_updatedAt', null] }, { $gt: ['$_updatedAt', ts.eCertPending] }] }, 1, 0] } },
                unreadPhysicalCert:    { $sum: { $cond: [{ $and: ['$_isPhysPaid', { $ne: [{ $ifNull: ['$_physRegAt', '$_updatedAt'] }, null] }, { $gt: [{ $ifNull: ['$_physRegAt', '$_updatedAt'] }, ts.physicalCert] }] }, 1, 0] } },

                // All-time totals
                pendingLinkedin:  { $sum: { $cond: ['$_isLiPend', 1, 0] } },
                pendingECert:     { $sum: { $cond: [{ $and: ['$_isECertPaid', { $not: ['$_isCertUnl'] }] }, 1, 0] } },
                pendingPhysical:  { $sum: { $cond: ['$_isPhysPaid', 1, 0] } },
                linkedinVerified: { $sum: { $cond: ['$_isLiVer', 1, 0] } },
                certUnlocked:     { $sum: { $cond: ['$_isCertUnl', 1, 0] } },
                eCertPaid:        { $sum: { $cond: ['$_isECertPaid', 1, 0] } },
                physicalPaid:     { $sum: { $cond: ['$_isPhysPaid', 1, 0] } },
                whatsappJoined:   { $sum: { $cond: ['$_isWaJoined', 1, 0] } },
                referredUsers:    { $sum: { $cond: ['$_isReferred', 1, 0] } },
                referredStep1:    { $sum: { $cond: [{ $and: ['$_isReferred', '$_isStep1'] }, 1, 0] } },
                onlyRegistered:   {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $not: ['$_isLiVer'] },
                          { $not: ['$_isLiPend'] },
                          { $not: ['$_isStep1'] },
                          { $not: ['$_isStep2'] },
                          { $not: ['$_isStep3'] },
                          { $not: ['$_isStep4'] },
                          { $not: ['$_isECertPaid'] },
                          { $not: ['$_isPhysPaid'] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                step1: { $sum: { $cond: ['$_isStep1', 1, 0] } },
                step2: { $sum: { $cond: ['$_isStep2', 1, 0] } },
                step3: { $sum: { $cond: ['$_isStep3', 1, 0] } },
                step4: { $sum: { $cond: ['$_isStep4', 1, 0] } },
              },
            },
          ],
          uniqueStudents: [
            { $group: { _id: '$email' } },
            { $count: 'count' },
          ],
          rangeSummary: [
            ...rangeFilterStage,
            {
              $group: {
                _id: null,
                enrolled:       { $sum: 1 },
                liVerified:     { $sum: { $cond: ['$_isLiVer', 1, 0] } },
                liPending:      { $sum: { $cond: ['$_isLiPend', 1, 0] } },
                step1:          { $sum: { $cond: ['$_isStep1', 1, 0] } },
                step2:          { $sum: { $cond: ['$_isStep2', 1, 0] } },
                step3:          { $sum: { $cond: ['$_isStep3', 1, 0] } },
                step4:          { $sum: { $cond: ['$_isStep4', 1, 0] } },
                eCertPaid:      { $sum: { $cond: ['$_isECertPaid', 1, 0] } },
                certUnlocked:   { $sum: { $cond: ['$_isCertUnl', 1, 0] } },
                physicalPaid:   { $sum: { $cond: ['$_isPhysPaid', 1, 0] } },
                whatsappJoined: { $sum: { $cond: ['$_isWaJoined', 1, 0] } },
                referred:       { $sum: { $cond: ['$_isReferred', 1, 0] } },
              },
            },
          ],
          byDomain: [
            ...rangeFilterStage,
            {
              $group: {
                _id:          { $ifNull: ['$domain', 'Unspecified'] },
                total:        { $sum: 1 },
                liVerified:   { $sum: { $cond: ['$_isLiVer', 1, 0] } },
                step1:        { $sum: { $cond: ['$_isStep1', 1, 0] } },
                step4:        { $sum: { $cond: ['$_isStep4', 1, 0] } },
                eCertPaid:    { $sum: { $cond: ['$_isECertPaid', 1, 0] } },
                physicalPaid: { $sum: { $cond: ['$_isPhysPaid', 1, 0] } },
              },
            },
            { $sort: { total: -1 } },
          ],
          byCollege: [
            ...rangeFilterStage,
            {
              $addFields: {
                _collegeTrim: { $trim: { input: { $ifNull: ['$collegeUniversity', ''] } } },
              },
            },
            { $match: { _collegeTrim: { $ne: '' } } },
            {
              $group: {
                _id:       '$_collegeTrim',
                count:     { $sum: 1 },
                eCertPaid: { $sum: { $cond: ['$_isECertPaid', 1, 0] } },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 8 },
          ],
          collegeCoverage: [
            ...rangeFilterStage,
            {
              $group: {
                _id: null,
                withCollege: {
                  $sum: {
                    $cond: [
                      { $gt: [{ $strLenCP: { $trim: { input: { $ifNull: ['$collegeUniversity', ''] } } } }, 0] },
                      1,
                      0,
                    ],
                  },
                },
                total: { $sum: 1 },
              },
            },
          ],
          byDistrict: [
            { $match: { _isPhysPaid: true } },
            ...(rangeStartUTC
              ? [{ $match: { $expr: { $gte: [{ $ifNull: ['$_physRegAt', '$_createdAt'] }, rangeStartUTC] } } }]
              : []),
            {
              $addFields: {
                _distTrim: { $trim: { input: { $ifNull: ['$physicalCertificate.district', ''] } } },
              },
            },
            { $match: { _distTrim: { $ne: '' } } },
            { $group: { _id: '$_distTrim', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 },
          ],
          timeSeries: [
            { $match: usersSeriesMatch },
            {
              $group: {
                _id:     { $dateToString: { format: tsFormat, date: '$_createdAt', timezone: 'Asia/Kolkata' } },
                signups: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          recentRegistrations: [
            { $sort: { _createdAt: -1 } },
            { $limit: 12 },
            {
              $project: {
                name: 1, email: 1, domain: 1, collegeUniversity: 1,
                createdAt: 1, linkedinVerified: 1, steps: 1, paymentDone: 1,
              },
            },
          ],
          recentPhysicalOrders: [
            { $match: { _isPhysPaid: true, _physRegAt: { $ne: null } } },
            { $sort: { _physRegAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                name: 1, domain: 1,
                district: '$physicalCertificate.district',
                registeredAt: '$_physRegAt',
              },
            },
          ],
        },
      },
    ]).toArray();

    // ── Project reviews facet ─────────────────────────────────────────────────
    const reviewsAggPromise = db.collection('project_reviews').aggregate([
      {
        $addFields: {
          _createdAt: { $convert: { input: '$createdAt', to: 'date', onError: null, onNull: null } },
          _updatedAt: { $convert: { input: '$updatedAt', to: 'date', onError: null, onNull: null } },
        },
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                total:          { $sum: 1 },
                pending:        { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                approved:       { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                rejected:       { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                todaySubmitted: { $sum: { $cond: [{ $and: [{ $ne: ['$_createdAt', null] }, { $gte: ['$_createdAt', todayStartUTC] }] }, 1, 0] } },
                pendStep1:      { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'pending'] }, { $eq: ['$step', 1] }] }, 1, 0] } },
                pendStep2:      { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'pending'] }, { $eq: ['$step', 2] }] }, 1, 0] } },
                pendStep3:      { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'pending'] }, { $eq: ['$step', 3] }] }, 1, 0] } },
                pendStep4:      { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'pending'] }, { $eq: ['$step', 4] }] }, 1, 0] } },
              },
            },
          ],
          timeSeries: [
            { $match: usersSeriesMatch },
            {
              $group: {
                _id:         { $dateToString: { format: tsFormat, date: '$_createdAt', timezone: 'Asia/Kolkata' } },
                submissions: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          recent: [
            { $sort: { _updatedAt: -1, _createdAt: -1 } },
            { $limit: 8 },
            { $project: { name: 1, domain: 1, step: 1, status: 1, updatedAt: '$_updatedAt', createdAt: '$_createdAt' } },
          ],
        },
      },
    ]).toArray();

    // ── Secondary real-time collections ───────────────────────────────────────
    const [
      usersAggRes,
      reviewsAggRes,
      quizDocs,
      recentLinkedin,
      linkedinTodayCount,
      paymentConfigDoc,
      checkoutPayAgg,
      offerCodeDocs,
      emailAgg,
      domainsCount,
      companyInternshipsCount,
      batchesCount,
      openCareersCount,
      totalCareersCount,
      eventCertsCount,
      eventCertDownloadsCount,
      programsCount,
      projectsCount,
    ] = await Promise.all([
      usersAggPromise,
      reviewsAggPromise,
      db.collection('users')
        .find({ quizStatus: { $exists: true, $ne: null } }, { projection: { name: 1, domain: 1, quizStatus: 1 } })
        .toArray(),
      db.collection('linkedin_verify').find({}).sort({ updatedAt: -1 }).limit(6).toArray(),
      db.collection('linkedin_verify').countDocuments({ updatedAt: { $gte: todayStartUTC } }),
      db.collection('payment_config').findOne({ _id: 'prices' as unknown as import('mongodb').ObjectId }),
      db.collection('payment').aggregate([
        {
          $group: {
            _id: null,
            count:  { $sum: 1 },
            amount: { $sum: { $convert: { input: '$amount', to: 'double', onError: 0, onNull: 0 } } },
          },
        },
      ]).toArray(),
      db.collection('offerCodes')
        .find({}, { projection: { code: 1, label: 1, discountPercent: 1, active: 1, usedCount: 1, limitType: 1, maxCount: 1, endTime: 1 } })
        .sort({ usedCount: -1 })
        .toArray(),
      db.collection('email_logs').aggregate([
        {
          $group: {
            _id: null,
            totalAll:   { $sum: 1 },
            totalToday: { $sum: { $cond: [{ $eq: ['$istDate', istDateStr] }, 1, 0] } },
            totalMonth: { $sum: { $cond: [{ $eq: ['$istMonth', istMonthStr] }, 1, 0] } },
          },
        },
      ]).toArray(),
      db.collection('Domains').countDocuments({}),
      db.collection('CompanyInternships').countDocuments({}),
      db.collection('batches').countDocuments({}),
      db.collection('careers').countDocuments({ status: 'open' }),
      db.collection('careers').countDocuments({}),
      db.collection('event_certificates').countDocuments({}),
      db.collection('certificate_downloads').countDocuments({}),
      db.collection('programs').countDocuments({}),
      db.collection('projects').countDocuments({}),
    ]);

    const uFacet = usersAggRes[0] ?? {};
    const ov = uFacet.overview?.[0] ?? {};
    const totalUsers = (ov.totalUsers as number) ?? 0;
    const uniqueUsers = (uFacet.uniqueStudents?.[0]?.count as number) ?? 0;

    const rSum = uFacet.rangeSummary?.[0] ?? {};
    const revSummary = reviewsAggRes[0]?.summary?.[0] ?? {};

    // ── Quiz Analytics (across quizStatus.week_1..week_4) ─────────────────────
    const weekBuckets = [1, 2, 3, 4].map((w) => ({
      week: w,
      attempts: 0,
      usersTried: 0,
      passed: 0,
      failed: 0,
      scoreSum: 0,
    }));
    let quizTotalAttempts = 0;
    let quizAttemptsToday = 0;
    let quizPassedWeeksCount = 0;
    let quizFailedWeeksCount = 0;
    let quizScoreSum = 0;
    let quizWeekEntries = 0;

    interface QuizEvent { name: string; domain: string; week: number; passed: boolean; score: number; at: Date }
    const recentQuizEvents: QuizEvent[] = [];

    for (const doc of quizDocs) {
      const qs = doc.quizStatus as Record<string, {
        passed?: boolean; score?: number; attempts?: number; lastAttemptAt?: Date | string;
      }> | undefined;
      if (!qs) continue;
      for (const bucket of weekBuckets) {
        const wData = qs[`week_${bucket.week}`];
        if (!wData || typeof wData !== 'object') continue;
        const attempts = typeof wData.attempts === 'number' ? wData.attempts : 1;
        const score = typeof wData.score === 'number' ? wData.score : 0;
        const passed = wData.passed === true;

        bucket.usersTried += 1;
        bucket.attempts += attempts;
        bucket.scoreSum += score;
        if (passed) { bucket.passed += 1; quizPassedWeeksCount += 1; }
        else { bucket.failed += 1; quizFailedWeeksCount += 1; }

        quizTotalAttempts += attempts;
        quizScoreSum += score;
        quizWeekEntries += 1;

        if (wData.lastAttemptAt) {
          const dt = new Date(wData.lastAttemptAt);
          if (!isNaN(dt.getTime())) {
            if (dt >= todayStartUTC) quizAttemptsToday += 1;
            recentQuizEvents.push({
              name: (doc.name as string) || 'Student',
              domain: (doc.domain as string) || '',
              week: bucket.week,
              passed,
              score,
              at: dt,
            });
          }
        }
      }
    }

    recentQuizEvents.sort((a, b) => b.at.getTime() - a.at.getTime());

    const quizAnalytics = {
      uniqueStudentsAttempted: quizDocs.length,
      totalAttempts: quizTotalAttempts,
      attemptsToday: quizAttemptsToday,
      passedCount: quizPassedWeeksCount,
      failedCount: quizFailedWeeksCount,
      passRate: quizWeekEntries > 0 ? Math.round((quizPassedWeeksCount / quizWeekEntries) * 100) : 0,
      avgScore: quizWeekEntries > 0 ? Math.round(quizScoreSum / quizWeekEntries) : 0,
      byWeek: weekBuckets.map((b) => ({
        week: b.week,
        usersTried: b.usersTried,
        attempts: b.attempts,
        passed: b.passed,
        failed: b.failed,
        avgScore: b.usersTried > 0 ? Math.round(b.scoreSum / b.usersTried) : 0,
        passRate: b.usersTried > 0 ? Math.round((b.passed / b.usersTried) * 100) : 0,
      })),
    };

    // ── Revenue & Offer Codes ─────────────────────────────────────────────────
    const eCertPrice = (paymentConfigDoc?.eCertPrice as number) ?? 149;
    const eCertDiscount = (paymentConfigDoc?.eCertDiscount as number) ?? 0;
    const eCertNetPrice = eCertDiscount > 0 ? Math.max(1, Math.round(eCertPrice * (1 - eCertDiscount / 100))) : eCertPrice;

    const physicalCertPrice = (paymentConfigDoc?.physicalCertPrice as number) ?? 149;
    const physicalCertDiscount = (paymentConfigDoc?.physicalCertDiscount as number) ?? 0;
    const physicalNetPrice =
      physicalCertDiscount > 0 ? Math.max(1, Math.round(physicalCertPrice * (1 - physicalCertDiscount / 100))) : physicalCertPrice;

    const eCertPaidCount = (ov.eCertPaid as number) ?? 0;
    const physicalPaidCount = (ov.physicalPaid as number) ?? 0;
    const estimatedCertRevenue = eCertPaidCount * eCertNetPrice + physicalPaidCount * physicalNetPrice;

    const activeOfferCodes = offerCodeDocs.filter((c) => {
      if (c.active !== true) return false;
      if (c.limitType === 'time' && c.endTime && new Date(c.endTime as Date | string) <= now) return false;
      if (c.limitType === 'count' && typeof c.maxCount === 'number' && ((c.usedCount as number) ?? 0) >= c.maxCount) return false;
      return true;
    });

    const offerCodeRedemptions = offerCodeDocs.reduce((acc, c) => acc + ((c.usedCount as number) ?? 0), 0);
    const checkoutPayRow = checkoutPayAgg[0] ?? {};

    // ── Time-series alignment (zero-filled daily for 7d/30d/90d; monthly for all)
    const userSeriesMap = new Map<string, number>();
    for (const row of (uFacet.timeSeries ?? []) as { _id: string; signups: number }[]) {
      if (row._id) userSeriesMap.set(row._id, row.signups);
    }
    const subSeriesMap = new Map<string, number>();
    for (const row of (reviewsAggRes[0]?.timeSeries ?? []) as { _id: string; submissions: number }[]) {
      if (row._id) subSeriesMap.set(row._id, row.submissions);
    }

    let seriesPoints: { key: string; label: string; signups: number; submissions: number }[] = [];
    if (range !== 'all' && rangeDays) {
      const daysList = buildDailyDateList(todayStartUTC, rangeDays);
      seriesPoints = daysList.map(({ key, label }) => ({
        key,
        label,
        signups: userSeriesMap.get(key) ?? 0,
        submissions: subSeriesMap.get(key) ?? 0,
      }));
    } else {
      const keys = Array.from(
        new Set(Array.from(userSeriesMap.keys()).concat(Array.from(subSeriesMap.keys())))
      ).sort();
      seriesPoints = keys.map((key) => ({
        key,
        label: formatMonthLabel(key),
        signups: userSeriesMap.get(key) ?? 0,
        submissions: subSeriesMap.get(key) ?? 0,
      }));
    }

    // ── Unified Live Activity Feed ────────────────────────────────────────────
    interface ActivityItem {
      id: string;
      type: 'signup' | 'project' | 'linkedin' | 'physical' | 'quiz';
      title: string;
      detail: string;
      domain: string;
      status: string;
      at: string;
    }

    const recentRegsMapped = ((uFacet.recentRegistrations ?? []) as Record<string, unknown>[]).map((u) => {
      const st = (u.steps as Record<string, boolean>) ?? {};
      const stepsDone = ['step1', 'step2', 'step3', 'step4'].filter((k) => st[k] === true).length;
      return {
        id:               (u._id as { toString: () => string }).toString(),
        name:             (u.name as string) ?? '—',
        email:            (u.email as string) ?? '—',
        domain:           (u.domain as string) ?? '—',
        college:          (u.collegeUniversity as string) || null,
        createdAt:        toIso(u.createdAt),
        linkedinVerified: u.linkedinVerified as boolean | 'pending',
        stepsDone,
        eCertPaid:        u.paymentDone === true,
      };
    });

    const activityItems: ActivityItem[] = [
      ...recentRegsMapped.slice(0, 6).map((u) => ({
        id: `reg-${u.id}`,
        type: 'signup' as const,
        title: u.name,
        detail: `Enrolled in ${u.domain}`,
        domain: u.domain,
        status: 'enrolled',
        at: u.createdAt,
      })),
      ...((reviewsAggRes[0]?.recent ?? []) as Record<string, unknown>[]).map((r) => ({
        id: `rev-${(r._id as { toString: () => string }).toString()}`,
        type: 'project' as const,
        title: (r.name as string) ?? 'Student',
        detail: `Week ${r.step} project ${(r.status as string) ?? 'pending'}`,
        domain: (r.domain as string) ?? '',
        status: (r.status as string) ?? 'pending',
        at: toIso(r.updatedAt ?? r.createdAt),
      })),
      ...recentLinkedin.map((l) => ({
        id: `li-${l._id.toString()}`,
        type: 'linkedin' as const,
        title: (l.name as string) ?? 'Student',
        detail: `LinkedIn verification ${(l.status as string) ?? 'pending'}`,
        domain: (l.domain as string) ?? '',
        status: (l.status as string) ?? 'pending',
        at: toIso(l.updatedAt ?? l.createdAt),
      })),
      ...((uFacet.recentPhysicalOrders ?? []) as Record<string, unknown>[]).map((p) => ({
        id: `phys-${(p._id as { toString: () => string }).toString()}`,
        type: 'physical' as const,
        title: (p.name as string) ?? 'Student',
        detail: `Ordered physical cert (${(p.district as string) || 'India'})`,
        domain: (p.domain as string) ?? '',
        status: 'paid',
        at: toIso(p.registeredAt),
      })),
      ...recentQuizEvents.slice(0, 5).map((q, idx) => ({
        id: `quiz-${idx}-${q.at.getTime()}`,
        type: 'quiz' as const,
        title: q.name,
        detail: `Week ${q.week} quiz ${q.passed ? 'passed' : 'failed'} (${q.score}%)`,
        domain: q.domain,
        status: q.passed ? 'passed' : 'failed',
        at: q.at.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 15);

    const emailRow = emailAgg[0] ?? {};

    const payload = {
      success: true,
      meta: {
        serverTime: now.toISOString(),
        istDate: istDateStr,
        range,
        queryMs: Date.now() - startedAt,
      },
      realtimePulse: {
        signupsToday:      (ov.todaySignups as number) ?? 0,
        signupsYesterday:  (ov.yesterdaySignups as number) ?? 0,
        signupsLast24h:    (ov.last24hSignups as number) ?? 0,
        signupsLast7d:     (ov.last7dSignups as number) ?? 0,
        signupsLast30d:    (ov.last30dSignups as number) ?? 0,
        submissionsToday:  (revSummary.todaySubmitted as number) ?? 0,
        linkedinToday:     linkedinTodayCount,
        quizAttemptsToday,
        physicalToday:     (ov.physicalToday as number) ?? 0,
        emailsToday:       (emailRow.totalToday as number) ?? 0,
      },
      stats: {
        totalUsers,
        uniqueUsers,
        rangeSignups:     (ov.rangeSignups as number) ?? totalUsers,
        prevRangeSignups: rangeStartUTC ? ((ov.prevRangeSignups as number) ?? 0) : null,
        unread: {
          registrations:   (ov.unreadRegistrations as number) ?? 0,
          linkedinPending: (ov.unreadLinkedinPending as number) ?? 0,
          eCertPending:    (ov.unreadECertPending as number) ?? 0,
          physicalCert:    (ov.unreadPhysicalCert as number) ?? 0,
        },
        totals: {
          pendingLinkedin:       (ov.pendingLinkedin as number) ?? 0,
          pendingProjectReviews: (revSummary.pending as number) ?? 0,
          pendingECert:          (ov.pendingECert as number) ?? 0,
          pendingPhysical:       (ov.pendingPhysical as number) ?? 0,
          linkedinVerified:      (ov.linkedinVerified as number) ?? 0,
          certUnlocked:          (ov.certUnlocked as number) ?? 0,
          eCertPaid:             eCertPaidCount,
          physicalPaid:          physicalPaidCount,
          onlyRegistered:        (ov.onlyRegistered as number) ?? 0,
          whatsappJoined:        (ov.whatsappJoined as number) ?? 0,
          referredUsers:         (ov.referredUsers as number) ?? 0,
          referredStep1:         (ov.referredStep1 as number) ?? 0,
        },
        stepCompletion: {
          step1: (ov.step1 as number) ?? 0,
          step2: (ov.step2 as number) ?? 0,
          step3: (ov.step3 as number) ?? 0,
          step4: (ov.step4 as number) ?? 0,
        },
        lastRead: {
          registrations:   ts.registrations.toISOString(),
          linkedinPending: ts.linkedinPending.toISOString(),
          eCertPending:    ts.eCertPending.toISOString(),
          physicalCert:    ts.physicalCert.toISOString(),
        },
      },
      revenue: {
        eCertPrice,
        eCertDiscount,
        eCertNetPrice,
        physicalCertPrice,
        physicalCertDiscount,
        physicalNetPrice,
        eCertPaidCount,
        physicalPaidCount,
        estimatedCertRevenue,
        checkoutPaymentsCount:  (checkoutPayRow.count as number) ?? 0,
        checkoutPaymentsAmount: Math.round((checkoutPayRow.amount as number) ?? 0),
        offerCodesTotal:        offerCodeDocs.length,
        offerCodesActive:       activeOfferCodes.length,
        offerCodeRedemptions,
        topOfferCodes: offerCodeDocs.slice(0, 5).map((c) => ({
          code:            c.code as string,
          label:           (c.label as string) || null,
          discountPercent: c.discountPercent as number,
          usedCount:       (c.usedCount as number) ?? 0,
          active:          c.active === true,
        })),
      },
      funnel: {
        enrolled:       (rSum.enrolled as number) ?? 0,
        liVerified:     (rSum.liVerified as number) ?? 0,
        liPending:      (rSum.liPending as number) ?? 0,
        step1:          (rSum.step1 as number) ?? 0,
        step2:          (rSum.step2 as number) ?? 0,
        step3:          (rSum.step3 as number) ?? 0,
        step4:          (rSum.step4 as number) ?? 0,
        eCertPaid:      (rSum.eCertPaid as number) ?? 0,
        certUnlocked:   (rSum.certUnlocked as number) ?? 0,
        physicalPaid:   (rSum.physicalPaid as number) ?? 0,
        whatsappJoined: (rSum.whatsappJoined as number) ?? 0,
        referred:       (rSum.referred as number) ?? 0,
      },
      timeSeries: {
        granularity: range === 'all' ? ('month' as const) : ('day' as const),
        points: seriesPoints,
      },
      domainBreakdown: ((uFacet.byDomain ?? []) as Record<string, unknown>[]).map((d) => {
        const tot = (d.total as number) ?? 0;
        const s4 = (d.step4 as number) ?? 0;
        return {
          domain:         (d._id as string) || 'Unspecified',
          total:          tot,
          liVerified:     (d.liVerified as number) ?? 0,
          step1:          (d.step1 as number) ?? 0,
          step4:          s4,
          eCertPaid:      (d.eCertPaid as number) ?? 0,
          physicalPaid:   (d.physicalPaid as number) ?? 0,
          completionRate: tot > 0 ? Math.round((s4 / tot) * 100) : 0,
        };
      }),
      quizAnalytics,
      projectReviewsSummary: {
        total:          (revSummary.total as number) ?? 0,
        pending:        (revSummary.pending as number) ?? 0,
        approved:       (revSummary.approved as number) ?? 0,
        rejected:       (revSummary.rejected as number) ?? 0,
        todaySubmitted: (revSummary.todaySubmitted as number) ?? 0,
        pendingByStep: {
          step1: (revSummary.pendStep1 as number) ?? 0,
          step2: (revSummary.pendStep2 as number) ?? 0,
          step3: (revSummary.pendStep3 as number) ?? 0,
          step4: (revSummary.pendStep4 as number) ?? 0,
        },
      },
      audienceBreakdown: {
        topColleges: ((uFacet.byCollege ?? []) as Record<string, unknown>[]).map((c) => ({
          college:   c._id as string,
          count:     (c.count as number) ?? 0,
          eCertPaid: (c.eCertPaid as number) ?? 0,
        })),
        topDistricts: ((uFacet.byDistrict ?? []) as Record<string, unknown>[]).map((d) => ({
          district: d._id as string,
          count:    (d.count as number) ?? 0,
        })),
        withCollegeCount: (uFacet.collegeCoverage?.[0]?.withCollege as number) ?? 0,
        collegeTotal:     (uFacet.collegeCoverage?.[0]?.total as number) ?? 0,
      },
      emailStatus: {
        totalAll:     (emailRow.totalAll as number) ?? 0,
        totalToday:   (emailRow.totalToday as number) ?? 0,
        totalMonth:   (emailRow.totalMonth as number) ?? 0,
        dailyLimit:   100,
        monthlyLimit: 3000,
      },
      catalogHealth: {
        domainsCount,
        companyInternshipsCount,
        batchesCount,
        openCareersCount,
        totalCareersCount,
        eventCertsCount,
        eventCertDownloadsCount,
        programsCount,
        projectsCount,
      },
      recentRegistrations: recentRegsMapped,
      liveActivity: activityItems,
    };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/dashboard-stats]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}

// ── POST /api/admin/dashboard-stats — mark categories as read ────────────────
export async function POST(req: Request) {
  try {
    const { categories } = (await req.json()) as { categories: string[] };
    const now = new Date();
    const db = await getDatabase();

    const update: Record<string, Date> = {};
    for (const cat of categories) {
      if (['registrations', 'linkedinPending', 'eCertPending', 'physicalCert'].includes(cat)) {
        update[cat] = now;
      }
    }
    if (Object.keys(update).length === 0)
      return NextResponse.json({ success: false, message: 'No valid categories.' }, { status: 400 });

    await db.collection(COLLECTION).updateOne(
      { key: KEY },
      { $set: { key: KEY, ...update } },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/admin/dashboard-stats]', err);
    return NextResponse.json({ success: false, message: 'Server error.' }, { status: 500 });
  }
}
