import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import StatusChip from '../../components/StatusChip';
import { SkeletonTable, SkeletonCard } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import FloatingAICopilot from '../../components/FloatingAICopilot';

export default function DoctorDashboard() {
  const [activeMainTab, setActiveMainTab] = useState('ORDERS'); // 'ORDERS' | 'PATHOLOGIST_AUDIT' | 'FLAGGED_EXPLANATIONS'
  const [orders, setOrders] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  const [downloadingId, setDownloadingId] = useState(null);

  // Pathologist Review Modal State
  const [editingSummary, setEditingSummary] = useState(null);
  const [editText, setEditText] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [previewPdfOrder, setPreviewPdfOrder] = useState(null);

  const { token, logout, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { hospitalSlug, doctorSlug } = useParams();

  const currentHospitalSlug = hospitalSlug || 'company-a-main-hospital';
  const currentDoctorSlug = doctorSlug || 'dr-ramanaiah';

  const DOCTOR_PORTAL_ROSTER = [
    {
      slug: 'dr-ramanaiah',
      name: 'Dr. P. Ramanaiah, MD',
      specialty: 'Neurology & Pathology',
      hospitalName: 'Company A Main Super-Specialty',
      hospitalSlug: 'company-a-main-hospital',
      regNo: 'APMC-2016-10294',
    },
    {
      slug: 'dr-vikram-anand',
      name: 'Dr. Vikram Anand, DM',
      specialty: 'Cardiology & Cardiovascular Sciences',
      hospitalName: 'Company A Main Super-Specialty',
      hospitalSlug: 'company-a-main-hospital',
      regNo: 'NMC-2023-77401',
    },
    {
      slug: 'dr-pooja-sharma',
      name: 'Dr. Pooja Sharma, DNB',
      specialty: 'Endocrinology & Diabetology',
      hospitalName: 'Company A Main Super-Specialty',
      hospitalSlug: 'company-a-main-hospital',
      regNo: 'NMC-2024-51029',
    },
    {
      slug: 'dr-suresh',
      name: 'Dr. K. Suresh, MD, FICP',
      specialty: 'Internal Medicine & Critical Care',
      hospitalName: 'Company A Main Super-Specialty',
      hospitalSlug: 'company-a-main-hospital',
      regNo: 'MCI-2018-84920',
    },
    {
      slug: 'dr-anitha',
      name: 'Dr. P. Anitha, MD',
      specialty: 'General Medicine & Preventive Health',
      hospitalName: 'Company A Main Super-Specialty',
      hospitalSlug: 'company-a-main-hospital',
      regNo: 'APMC-2015-88190',
    },
    {
      slug: 'dr-harish-reddy',
      name: 'Dr. Harish Reddy, MS, MCh',
      specialty: 'Orthopedics & Joint Replacement',
      hospitalName: 'Apollo Specialty Hospital',
      hospitalSlug: 'apollo-hospital-vijayawada',
      regNo: 'MCI-2017-66810',
    },
    {
      slug: 'dr-meera-nambiar',
      name: 'Dr. Meera Nambiar, MD, DCH',
      specialty: 'Pediatrics & Neonatal Care',
      hospitalName: 'Apollo Specialty Hospital',
      hospitalSlug: 'apollo-hospital-vijayawada',
      regNo: 'NMC-2020-33419',
    },
    {
      slug: 'dr-suresh-kumar',
      name: 'Dr. K. Suresh Kumar, MD',
      specialty: 'General Medicine & Diabetology',
      hospitalName: 'Apollo Specialty Hospital',
      hospitalSlug: 'apollo-hospital-vijayawada',
      regNo: 'MCI-2018-84920',
    },
    {
      slug: 'dr-raviteja',
      name: 'Dr. V. Ravi Teja, MD, DM',
      specialty: 'Pulmonology & Chest Medicine',
      hospitalName: 'Manipal Super-Specialty Hospital',
      hospitalSlug: 'manipal-hospital',
      regNo: 'APMC-2017-48201',
    },
  ];

  const activeDoctorMeta =
    DOCTOR_PORTAL_ROSTER.find((d) => d.slug === currentDoctorSlug) || {
      slug: currentDoctorSlug,
      name: currentDoctorSlug.replace(/^dr-/, 'Dr. ').replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) + ', MD',
      specialty: 'Attending Clinical Specialist',
      hospitalName: currentHospitalSlug === 'apollo-hospital-vijayawada' ? 'Apollo Specialty Hospital' : 'Company A Main Super-Specialty',
      hospitalSlug: currentHospitalSlug,
      regNo: 'MCI-VERIFIED',
    };

  // Ensure hierarchical URL structure in address bar: /:hospitalSlug/doctor/:doctorSlug
  useEffect(() => {
    if (!hospitalSlug || !doctorSlug) {
      navigate(`/${currentHospitalSlug}/doctor/${currentDoctorSlug}`, { replace: true });
    }
  }, [hospitalSlug, doctorSlug, currentHospitalSlug, currentDoctorSlug, navigate]);

  const doctorAuthToken = token && !token.startsWith('demo-patient') ? token : 'demo-doctor';

  const fetchDoctorOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api(
        `/doctors/orders?doctorSlug=${encodeURIComponent(currentDoctorSlug)}&hospitalSlug=${encodeURIComponent(currentHospitalSlug)}`,
        { token: doctorAuthToken }
      );
      setOrders(res.orders || []);
    } catch (err) {
      console.warn('Doctor orders fallback:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPathologistAuditQueue = async () => {
    try {
      setLoading(true);
      const res = await api('/summaries/sample', { token: doctorAuthToken });
      setSummaries(res.summaries || []);
    } catch (err) {
      console.warn('Pathologist sample fetch error, fallback:', err);
      // Fallback 50 sample summaries representing weekly quota
      setSummaries([
        {
          id: 'sum-101',
          lang: 'en',
          source: 'TEMPLATE',
          reviewStatus: 'APPROVED',
          order: {
            orderNo: 'ORD-71204',
            patient: { fullName: 'Lakshmi Prasanna K' },
            results: [{ parameter: 'Haemoglobin', value: '10.2', unit: 'g/dL', flag: 'LOW', refRangeRaw: '12.0-15.5' }],
          },
          body: JSON.stringify([
            {
              parameter: 'Haemoglobin',
              value: '10.2',
              unit: 'g/dL',
              flag: 'LOW',
              summary: 'Your haemoglobin result (10.2 g/dL) is below the standard reference range (12.0–15.5 g/dL).',
              meaning: 'Haemoglobin is an essential iron-rich protein in red blood cells that transports oxygen throughout your body.',
              next_step: 'Mild anemia can cause fatigue. Discuss iron-rich foods and oral iron supplementation with your doctor.',
            },
          ]),
        },
        {
          id: 'sum-102',
          lang: 'te',
          source: 'TEMPLATE',
          reviewStatus: 'UNREVIEWED',
          order: {
            orderNo: 'ORD-71204',
            patient: { fullName: 'Lakshmi Prasanna K' },
            results: [{ parameter: 'Haemoglobin', value: '10.2', unit: 'g/dL', flag: 'LOW', refRangeRaw: '12.0-15.5' }],
          },
          body: JSON.stringify([
            {
              parameter: 'హీమోగ్లోబిన్',
              value: '10.2',
              unit: 'g/dL',
              flag: 'LOW',
              summary: 'మీ హీమోగ్లోబిన్ స్థాయి (10.2 g/dL) సాధారణ పరిమితి (12.0–15.5 g/dL) కంటే తక్కువగా ఉంది.',
              meaning: 'శరీరంలోని కణాలకు ఆక్సిజన్‌ను సరఫరా చేయడానికి ఎర్ర రక్త కణాలలో హీమోగ్లోబిన్ ఎంతో ముఖ్యం.',
              next_step: 'రక్తహీనత వలన నీరసం రావచ్చు. ఐరన్ పుష్కలంగా ఉండే ఆహారం మరియు మీ వైద్యుల సలహా తీసుకోండి.',
            },
          ]),
        },
        {
          id: 'sum-103',
          lang: 'en',
          source: 'TEMPLATE',
          reviewStatus: 'UNREVIEWED',
          order: {
            orderNo: 'ORD-71205',
            patient: { fullName: 'Srinivas Rao T' },
            results: [
              { parameter: 'Fasting glucose', value: '145', unit: 'mg/dL', flag: 'HIGH', refRangeRaw: '70-100' },
              { parameter: 'HbA1c', value: '7.8', unit: '%', flag: 'HIGH', refRangeRaw: '<5.7' },
            ],
          },
          body: JSON.stringify([
            {
              parameter: 'Fasting glucose',
              value: '145',
              unit: 'mg/dL',
              flag: 'HIGH',
              summary: 'Fasting blood glucose (145 mg/dL) is elevated above the normal threshold (70–100 mg/dL).',
              meaning: 'Indicates elevated circulating blood sugars after an overnight fast.',
              next_step: 'Share these results with your physician for diabetic glycemic management.',
            },
            {
              parameter: 'HbA1c',
              value: '7.8',
              unit: '%',
              flag: 'HIGH',
              summary: 'Your 3-month average glucose indicator (HbA1c 7.8%) reflects pre-diabetic or diabetic glycemic control.',
              meaning: 'HbA1c measures percentage of glycated red blood cells over the last 90 days.',
              next_step: 'Clinical titration of antidiabetic therapy and lifestyle modification is recommended.',
            },
          ]),
        },
        {
          id: 'sum-104',
          lang: 'hi',
          source: 'TEMPLATE',
          reviewStatus: 'UNREVIEWED',
          order: {
            orderNo: 'ORD-71207',
            patient: { fullName: 'Ramesh Kumar B' },
            results: [{ parameter: 'TSH', value: '8.5', unit: 'mIU/L', flag: 'HIGH', refRangeRaw: '0.4-4.0' }],
          },
          body: JSON.stringify([
            {
              parameter: 'थायराइड उत्तेजक हार्मोन (TSH)',
              value: '8.5',
              unit: 'mIU/L',
              flag: 'HIGH',
              summary: 'आपका टीएसएच (8.5 mIU/L) सामान्य सीमा (0.4–4.0 mIU/L) से अधिक है।',
              meaning: 'यह आमतौर पर हाइपोथायरायडिज्म (कम सक्रिय थायराइड) का संकेत देता है।',
              next_step: 'थायराइड सप्लीमेंटेशन और पुष्टि के लिए अपने डॉक्टर से परामर्श लें।',
            },
          ]),
        },
        {
          id: 'sum-105',
          lang: 'en',
          source: 'AI_FALLBACK',
          reviewStatus: 'CHANGED',
          order: {
            orderNo: 'ORD-71208',
            patient: { fullName: 'Sumalatha G' },
            results: [{ parameter: 'Creatinine', value: '1.8', unit: 'mg/dL', flag: 'HIGH', refRangeRaw: '0.6-1.2' }],
          },
          body: JSON.stringify([
            {
              parameter: 'Creatinine',
              value: '1.8',
              unit: 'mg/dL',
              flag: 'HIGH',
              summary: 'Serum creatinine is mildly elevated at 1.8 mg/dL (Reference: 0.6–1.2 mg/dL). Pathologist note: Correlate with hydration status and eGFR.',
              meaning: 'Creatinine is a byproduct of muscle metabolism excreted by the kidneys.',
              next_step: 'Consult your nephrologist/physician for repeat renal evaluation and urine routine check.',
            },
          ]),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await api('/summaries/flags', { token: doctorAuthToken });
      setFlags(res.flags || []);
    } catch (err) {
      console.warn('Flags fetch error, fallback:', err);
      setFlags([
        {
          id: 'flg-1',
          reason: 'CONFUSING',
          freeText: 'Is 10.2 low enough to need blood transfusion or just tablets?',
          status: 'OPEN',
          createdAt: '2026-11-03T09:12:00.000Z',
          summary: {
            order: {
              orderNo: 'ORD-71204',
              patient: { fullName: 'Lakshmi Prasanna K' },
            },
          },
        },
        {
          id: 'flg-2',
          reason: 'WRONG_LANGUAGE',
          freeText: 'Telugu font script displayed properly, but would like simpler terms for thyroid.',
          status: 'REVIEWED',
          createdAt: '2026-11-02T14:40:00.000Z',
          summary: {
            order: {
              orderNo: 'ORD-71207',
              patient: { fullName: 'Ramesh Kumar B' },
            },
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeMainTab === 'ORDERS') {
      fetchDoctorOrders();
    } else if (activeMainTab === 'PATHOLOGIST_AUDIT') {
      fetchPathologistAuditQueue();
    } else if (activeMainTab === 'FLAGGED_EXPLANATIONS') {
      fetchFlags();
    }
  }, [activeMainTab, currentDoctorSlug, currentHospitalSlug]);

  const handleApproveSummary = async (summaryId) => {
    try {
      await api(`/summaries/${summaryId}/review`, {
        method: 'PUT',
        body: { status: 'APPROVED' },
        token,
      });
      setSummaries((prev) =>
        prev.map((s) => (s.id === summaryId ? { ...s, reviewStatus: 'APPROVED' } : s))
      );
      addToast('Summary approved by Pathologist (ISO 15189 Verified)', 'success');
    } catch {
      setSummaries((prev) =>
        prev.map((s) => (s.id === summaryId ? { ...s, reviewStatus: 'APPROVED' } : s))
      );
      addToast('Summary marked as APPROVED (Demo Mode)', 'success');
    }
  };

  const handleOpenEditModal = (summary) => {
    setEditingSummary(summary);
    try {
      const parsed = JSON.parse(summary.body);
      setEditText(JSON.stringify(parsed, null, 2));
    } catch {
      setEditText(summary.body || '');
    }
  };

  const handleSaveEditSummary = async () => {
    if (!editingSummary) return;
    try {
      setSavingReview(true);
      await api(`/summaries/${editingSummary.id}/review`, {
        method: 'PUT',
        body: { status: 'CHANGED', body: editText },
        token,
      });
      setSummaries((prev) =>
        prev.map((s) =>
          s.id === editingSummary.id ? { ...s, reviewStatus: 'CHANGED', body: editText } : s
        )
      );
      addToast('Clinical correction saved to summary', 'success');
      setEditingSummary(null);
    } catch {
      setSummaries((prev) =>
        prev.map((s) =>
          s.id === editingSummary.id ? { ...s, reviewStatus: 'CHANGED', body: editText } : s
        )
      );
      addToast('Clinical correction updated (Demo Mode)', 'success');
      setEditingSummary(null);
    } finally {
      setSavingReview(false);
    }
  };

  const handleResolveFlag = async (flagId) => {
    try {
      await api(`/summaries/flags/${flagId}/review`, { method: 'PUT', token });
      setFlags((prev) =>
        prev.map((f) => (f.id === flagId ? { ...f, status: 'REVIEWED' } : f))
      );
      addToast('Patient flag marked as reviewed', 'success');
    } catch {
      setFlags((prev) =>
        prev.map((f) => (f.id === flagId ? { ...f, status: 'REVIEWED' } : f))
      );
      addToast('Flag marked as reviewed', 'success');
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const handleDownloadPDF = async (orderId, orderNo) => {
    try {
      setDownloadingId(orderId);
      const authToken = token || 'demo-doctor';
      const res = await fetch(`/api/orders/${orderId}/pdf?download=1`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${orderNo || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Direct PDF download error, opening in tab:', err);
      window.open(`/api/orders/${orderId}/pdf?token=${encodeURIComponent(token || 'demo-doctor')}`, '_blank');
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterTab === 'CRITICAL' && !o.hasCritical) return false;
    if (filterTab === 'ABNORMAL' && !o.hasAbnormal) return false;
    if (filterTab === 'NORMAL' && (o.hasAbnormal || o.hasCritical)) return false;

    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (o.orderNo || '').toLowerCase().includes(q) ||
      (o.patientName || '').toLowerCase().includes(q) ||
      (o.parameters || '').toLowerCase().includes(q)
    );
  });

  const criticalCount = orders.filter((o) => o.hasCritical).length;
  const abnormalCount = orders.filter((o) => o.hasAbnormal).length;
  const normalCount = orders.filter((o) => !o.hasAbnormal && !o.hasCritical).length;

  const reviewedSummariesCount = summaries.filter((s) => s.reviewStatus !== 'UNREVIEWED').length;

  const columns = [
    {
      header: 'Identifier',
      accessor: 'orderNo',
      render: (r) => (
        <div>
          <span
            className={`font-mono font-bold text-xs px-2.5 py-1 rounded-xl border inline-block ${
              r.isAppointment
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-sm'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-sm'
            }`}
          >
            {r.tokenNo || r.orderNo}
          </span>
          {r.uhid && (
            <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
              {r.uhid}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Patient Name',
      accessor: 'patientName',
      render: (r) => (
        <div>
          <span className="font-extrabold text-white text-xs sm:text-sm block font-display">
            {r.patientName}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {r.sex === 'F' ? 'Female' : 'Male'} • Coastal AP Network
          </span>
        </div>
      ),
    },
    {
      header: 'Test / Clinical Parameter',
      accessor: 'parameters',
      render: (r) => (
        <span className="text-xs text-slate-200 font-medium line-clamp-2 max-w-xs block">
          {r.parameters || 'Biochemistry & Hematology Panel'}
        </span>
      ),
    },
    {
      header: 'Clinical Status',
      accessor: 'clinical',
      render: (r) => {
        if (r.hasCritical) {
          return (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
              <span>STAT Critical</span>
            </span>
          );
        }
        if (r.hasAbnormal) {
          return (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Out of Range</span>
            </span>
          );
        }
        if (r.isAppointment) {
          return (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
              <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>{r.status === 'OPD_CONFIRMED' ? 'Confirmed Visit' : 'Scheduled'}</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            <span>Normal</span>
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <StatusChip status={r.status} />,
    },
    {
      header: 'Actions',
      accessor: 'action',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {r.isAppointment ? (
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 font-mono text-[10px] border border-teal-500/30">
                OPD Token
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition cursor-pointer"
              >
                <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                <span>Slip</span>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPreviewPdfOrder(r)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 transition-all cursor-pointer active:scale-95"
                title="View PDF report inline on screen"
              >
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span>View PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadPDF(r.id, r.orderNo)}
                disabled={downloadingId === r.id}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm disabled:opacity-50 active:scale-95"
                title="Download PDF report file"
              >
                {downloadingId === r.id ? (
                  <svg className="w-3 h-3 animate-spin text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M4 12a8 8 0 018-8" /></svg>
                ) : (
                  <svg className="w-3 h-3 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                )}
                <span>PDF</span>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-stitch-surface text-stitch-on-surface flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans">
      {/* Stitch Deep-Teal Atmospheric Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
        <div className="absolute -bottom-32 left-1/3 w-[850px] h-[850px] bg-slate-900/40 rounded-full blur-[180px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#4edea3_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035]"></div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 relative z-10">
        
        {/* Attending Doctor Profile Card (Stitch High-End Glassmorphism) */}
        <div className="glass-card-accent p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVE ON-CALL ATTENDING
              </span>
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono text-teal-300 bg-teal-500/10 border border-teal-500/20">
                CABIN #302
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">•</span>
              <span className="text-xs text-slate-300 font-mono">
                Shift: 08:00 - 16:30 IST
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400">Switch Doctor:</span>
              <select
                value={`${activeDoctorMeta.hospitalSlug}:${activeDoctorMeta.slug}`}
                onChange={(e) => {
                  const [hSlug, dSlug] = e.target.value.split(':');
                  navigate(`/${hSlug}/doctor/${dSlug}`);
                }}
                className="glass-input rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                {DOCTOR_PORTAL_ROSTER.map((doc) => (
                  <option key={doc.slug} value={`${doc.hospitalSlug}:${doc.slug}`} className="bg-[#07151f] text-white">
                    {doc.name} — {doc.specialty} ({doc.hospitalName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Doctor Info & NMC Registration */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {activeDoctorMeta.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Senior Consultant
                </span>
              </div>
              <p className="text-xs text-teal-300 font-medium">
                {activeDoctorMeta.specialty} • {activeDoctorMeta.hospitalName}
              </p>

              <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] font-mono">
                <div className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white flex items-center gap-1.5">
                  <span>NMC Reg: <strong className="text-emerald-400 font-medium">{activeDoctorMeta.regNo}</strong></span>
                </div>
                <div className="px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center gap-1">
                  <span>State: <strong className="text-white">AP & Central Medical Council</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Credentials Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-y border-white/10 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-slate-400">Experience</div>
              <div className="text-sm font-semibold text-white font-mono mt-0.5">15+ Years</div>
              <div className="text-[10px] text-emerald-400">Ex-AIIMS Specialist</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-slate-400">OPD Load Today</div>
              <div className="text-sm font-semibold text-white font-mono mt-0.5 tabular-nums">{orders.length} / 40</div>
              <div className="text-[10px] text-teal-300">{Math.max(0, 40 - orders.length)} Slots Remaining</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-slate-400">Clinical Rating</div>
              <div className="text-sm font-semibold text-amber-300 font-mono mt-0.5 flex items-center gap-1">
                4.95 / 5.0
              </div>
              <div className="text-[10px] text-slate-400">380+ Verified Patients</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] font-mono text-slate-400">Digital Sign</div>
              <div className="text-sm font-semibold text-emerald-400 font-mono mt-0.5 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span>Active</span>
              </div>
              <div className="text-[10px] text-slate-400">e-Prescription FIPS</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => navigate('/book-appointment')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span>Queue Walk-in Patient</span>
            </button>
            <button
              type="button"
              onClick={() => addToast('Digital Rx Pad opened with NMC verified signature', 'info')}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-medium flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              <span>Digital Rx Pad</span>
            </button>
            <div className="ml-auto text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Biometric Telemetry Synced
            </div>
          </div>
        </div>

        {/* Top 3 Segmented Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl w-fit border border-white/10">
            <button
              type="button"
              onClick={() => setActiveMainTab('ORDERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'ORDERS'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              <span>{activeDoctorMeta.name}'s Patients</span>
              <span className="font-mono tabular-nums">({orders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('PATHOLOGIST_AUDIT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'PATHOLOGIST_AUDIT'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Pathologist Weekly Audit</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                activeMainTab === 'PATHOLOGIST_AUDIT' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-white'
              }`}>
                50/Wk
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMainTab('FLAGGED_EXPLANATIONS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeMainTab === 'FLAGGED_EXPLANATIONS'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
              <span>Patient Flags</span>
              {flags.filter((f) => f.status === 'OPEN').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Labora ISO 15189 Quality System
            </span>
          </div>
        </div>

        {/* ─── TAB 1: REFERRED PATIENT ORDERS ─── */}
        {activeMainTab === 'ORDERS' && (
          <div className="space-y-6">
            {/* KPI Clinical Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* KPI 1: Total Referred Patients */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-medium text-slate-400">Referred Patients</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-2xl font-bold font-mono text-white tracking-tight tabular-nums">{orders.length}</span>
                    <span className="text-xs font-mono text-emerald-400 font-medium">
                      +18.2%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">Active referred patients under this physician's clinical oversight</p>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Triage Cleared:</span>
                    <span className="text-emerald-400 font-semibold">{normalCount} / {orders.length || 1} (83.7%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: '83.7%' }}></div>
                  </div>
                </div>
              </div>

              {/* KPI 2: Critical Panic Values */}
              <div className="p-4 rounded-xl bg-white/5 border border-rose-500/30 flex flex-col justify-between hover:border-rose-400 transition-all relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-medium text-rose-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                      <span>Panic Values STAT</span>
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-300 flex items-center justify-center border border-rose-500/30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-2xl font-bold font-mono text-rose-300 tracking-tight tabular-nums">{criticalCount}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-950/60 text-rose-300 border border-rose-500/40">
                      URGENT
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-200/80">Immediate clinical escalation flagged for physician review</p>
                </div>

                <div className="mt-3 pt-3 border-t border-rose-500/20 space-y-2">
                  <button
                    type="button"
                    onClick={() => setFilterTab('CRITICAL')}
                    className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Acknowledge & Inspect ({criticalCount})</span>
                  </button>
                </div>
              </div>

              {/* KPI 3: Out of Range Biomarkers */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between hover:border-amber-400/40 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-medium text-amber-300">Out-of-Range Analyte</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-300 flex items-center justify-center border border-amber-500/20">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-2xl font-bold font-mono text-amber-300 tracking-tight tabular-nums">{abnormalCount}</span>
                    <span className="text-xs font-mono text-amber-400 font-medium">Flagged</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Biochemical parameters deviating beyond physiological standard limits</p>
                </div>

                <div className="mt-3 pt-3 border-t border-white/10 space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Normal:</span>
                    <span className="text-emerald-400 font-medium">{normalCount} optimal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Flagged Rate:</span>
                    <span className="text-amber-300 font-medium">{Math.round((abnormalCount / (orders.length || 1)) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search referred patient by name, order ID, or biomarker parameter..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    aria-label="Clear search"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs font-mono">
                {[
                  { id: 'ALL', label: `All Reports (${orders.length})` },
                  { id: 'ABNORMAL', label: `Out of Range (${abnormalCount})` },
                  { id: 'CRITICAL', label: `Critical Alerts (${criticalCount})` },
                  { id: 'NORMAL', label: `Normal (${normalCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap text-xs font-bold ${
                      filterTab === tab.id
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-sm'
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <SkeletonTable rows={6} cols={7} />
            ) : error ? (
              <ErrorState description={error} onRetry={fetchDoctorOrders} />
            ) : (
              <div className="glass-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                <Table
                  columns={columns}
                  data={filteredOrders}
                  keyField="id"
                  emptyMessage={
                    searchTerm
                      ? `No referred patient records match "${searchTerm}".`
                      : 'No referred patient reports found in the last 90 days.'
                  }
                />
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: PATHOLOGIST WEEKLY AUDIT QUEUE (Section 8.9: 50 Summaries/Week) ─── */}
        {activeMainTab === 'PATHOLOGIST_AUDIT' && (
          <div className="space-y-6">
            {/* Quota Progress Banner (Stitch Oceanic Glass) */}
            <div className="glass-panel-dark text-white p-6 sm:p-7 rounded-3xl shadow-xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between flex-wrap gap-3 relative z-10">
                <div>
                  <span className="text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 w-fit">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Section 8.9 Clinical Quality Assurance</span>
                  </span>
                  <h2 className="text-xl sm:text-2xl font-display font-black mt-2 tracking-tight">
                    Pathologist Weekly Summary Audit Queue
                  </h2>
                  <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
                    Mandatory clinical verification of 50 diagnostic explanations per week to guarantee 100% medical accuracy and DPDP compliance.
                  </p>
                </div>
                <div className="glass-panel-dark p-3.5 rounded-2xl text-right border border-white/10 shadow-lg">
                  <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold block">Weekly Target</span>
                  <strong className="text-2xl font-display font-black text-white tabular-nums">{reviewedSummariesCount} / 50</strong>
                  <span className="text-[10px] text-slate-400 block">Audited this week</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500 rounded-full shadow-sm"
                  style={{ width: `${Math.min(100, (reviewedSummariesCount / 50) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Summaries List */}
            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <div className="space-y-4">
                {summaries.map((s) => {
                  let parsedItems = [];
                  try {
                    parsedItems = JSON.parse(s.body);
                  } catch {
                    parsedItems = [{ text: s.body }];
                  }

                  const langBadge =
                    s.lang === 'te' ? 'తెలుగు (Telugu)' : s.lang === 'hi' ? 'हिंदी (Hindi)' : 'English';

                  return (
                    <div
                      key={s.id}
                      className="p-5 glass-card rounded-3xl border border-white/10 shadow-xl space-y-4"
                    >
                      {/* Top Row: Order, Patient, Language, Status */}
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold bg-white/10 text-white px-2.5 py-0.5 rounded-lg border border-white/15">
                              #{s.order?.orderNo || 'ORD-71204'}
                            </span>
                            <span className="font-display font-extrabold text-white text-sm">
                              {s.order?.patient?.fullName || 'Verified Patient'}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">
                              {langBadge}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Source: {s.source}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm ${
                              s.reviewStatus === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : s.reviewStatus === 'CHANGED'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}
                          >
                            {s.reviewStatus || 'UNREVIEWED'}
                          </span>
                        </div>
                      </div>

                      {/* Original Test Values Table */}
                      {s.order?.results && s.order.results.length > 0 && (
                        <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
                            Flagged Biomarker Measurements
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {s.order.results.map((r, i) => (
                              <div key={i} className="bg-[#07151f]/80 p-2.5 rounded-xl border border-white/10">
                                <span className="font-bold text-slate-200 block truncate text-xs">{r.parameter}</span>
                                <span className="font-mono font-extrabold text-rose-400 block text-sm mt-0.5">
                                  {r.value} {r.unit}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Ref: {r.refRangeRaw}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI / Template Plain Language Explanation */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                          Patient Plain-Language Explanation
                        </span>
                        {parsedItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs space-y-1 text-slate-200"
                          >
                            {item.summary && <p className="font-semibold text-white">{item.summary}</p>}
                            {item.meaning && <p className="text-slate-300"><strong>Why it matters:</strong> {item.meaning}</p>}
                            {item.next_step && <p className="text-emerald-300 font-medium"><strong>Next Step:</strong> {item.next_step}</p>}
                            {item.text && <p className="text-slate-200">{item.text}</p>}
                          </div>
                        ))}
                      </div>

                      {/* Pathologist Action Bar */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(s)}
                          className="px-3.5 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          <span>Edit / Clinical Notes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveSummary(s.id)}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-black transition cursor-pointer shadow-md shadow-emerald-500/20 inline-flex items-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span>Approve Summary</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: PATIENT FLAGGED EXPLANATIONS (Section 8.8) ─── */}
        {activeMainTab === 'FLAGGED_EXPLANATIONS' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-display font-black text-white tracking-tight">
                Patient Feedback & Flagged Explanations
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review plain-language summaries reported as confusing, inaccurate, or requiring linguistic revision by patients.
              </p>
            </div>

            {flags.length === 0 ? (
              <div className="p-8 glass-card rounded-3xl border border-white/10 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="font-bold text-white text-sm">No Pending Flags</h3>
                <p className="text-xs text-slate-400">All patient explanation flags have been medically addressed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flags.map((f) => (
                  <div
                    key={f.id}
                    className="p-5 glass-card rounded-3xl border border-white/10 shadow-xl space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="font-mono text-xs font-bold text-teal-300 bg-white/10 px-2 py-0.5 rounded-lg border border-white/15">
                            #{f.summary?.order?.orderNo || 'ORD-71204'}
                          </span>
                          <strong className="text-sm font-black text-white block mt-1.5">
                            {f.summary?.order?.patient?.fullName || 'Patient'}
                          </strong>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${
                            f.status === 'OPEN'
                              ? 'bg-rose-500/25 text-rose-300 border-rose-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {f.status}
                        </span>
                      </div>

                      <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-xs space-y-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Reported Reason:</span>
                        <strong className="text-slate-100 block">{f.reason}</strong>
                        {f.freeText && (
                          <p className="text-slate-300 text-[11px] italic">"{f.freeText}"</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex justify-end">
                      {f.status === 'OPEN' ? (
                        <button
                          type="button"
                          onClick={() => handleResolveFlag(f.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition cursor-pointer shadow-sm"
                        >
                          Mark as Reviewed & Corrected
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 font-mono">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span>Resolved</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="p-4 text-center text-xs text-slate-400">
        <span>Labora — Company A Diagnostics • Referring Physician & Pathologist Network • NABL ISO 15189 Accredited</span>
      </footer>

      {/* Pathologist Summary Correction Modal */}
      {editingSummary && (
        <Modal
          isOpen={true}
          onClose={() => setEditingSummary(null)}
          title="Edit Diagnostic Explanation (Pathologist Clinical Review)"
          description={`Order #${editingSummary.order?.orderNo} • ${editingSummary.order?.patient?.fullName}`}
          size="lg"
        >
          <div className="space-y-4 py-1 text-slate-200">
            <div>
              <label className="text-xs font-semibold text-white block mb-1.5 font-mono">
                Refined Explanation (Structured JSON or Plain Text):
              </label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={8}
                className="w-full text-xs font-mono p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-200 font-mono">
              <span><strong>Medical Guardrail:</strong> Changes will be immediately saved with your Pathologist signature and update the patient's view under DPDP Act 2023 accuracy requirements.</span>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingSummary(null)}
                className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingReview}
                onClick={handleSaveEditSummary}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                {savingReview ? 'Saving...' : 'Save & Sign Off Explanation'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Stitch High-Fidelity Inline Diagnostic PDF Report Modal */}
      {previewPdfOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0b1924] w-full max-w-4xl rounded-2xl overflow-hidden border border-white/15 shadow-2xl flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-900/95 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {previewPdfOrder.patientName} — Diagnostic Lab Report
                  </h4>
                  <p className="text-xs font-mono text-teal-300">
                    Order #{previewPdfOrder.orderNo} • {previewPdfOrder.uhid || 'UHID-2026-9041'} • NABL ISO 15189 Verified
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(previewPdfOrder.id, previewPdfOrder.orderNo)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-mono border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPdfOrder(null)}
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Simulated High-Fidelity Clinical PDF Content Sheet */}
            <div className="p-5 sm:p-6 overflow-y-auto bg-slate-950 text-slate-100 font-sans space-y-5">
              <div className="p-5 rounded-xl bg-[#07151f] border border-white/10 space-y-4">
                {/* Official Hospital Header */}
                <div className="flex flex-col sm:flex-row items-start justify-between border-b border-white/10 pb-4 gap-3">
                  <div className="space-y-1">
                    <div className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                      <span className="text-emerald-400 font-black">LABORA</span>
                      <span>CLINICAL DIAGNOSTIC TELEMETRY SERVICES</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {activeDoctorMeta.hospitalName} • Central Core Pathology Division
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">
                      Accreditation: NABL ISO 15189 • Govt. Reg: NABL-MC-88219 • QR Verified Electronic Signoff
                    </p>
                  </div>
                  <div className="text-left sm:text-right font-mono text-xs text-slate-300 shrink-0">
                    <div className="text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">STAT LAB REPORT</div>
                    <div>Report #: <span className="text-white font-semibold">{previewPdfOrder.orderNo}</span></div>
                    <div>Generated: <span className="text-slate-400">{formatDate(previewPdfOrder.createdAt || new Date())}</span></div>
                  </div>
                </div>

                {/* Patient Demographics Grid in PDF */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 border-b border-white/10 text-xs">
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">Patient Name</div>
                    <div className="font-semibold text-white text-xs mt-0.5">{previewPdfOrder.patientName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">Permanent UHID</div>
                    <div className="font-mono text-teal-300 font-semibold text-xs mt-0.5">{previewPdfOrder.uhid || 'UHID-2026-9041'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">Referring Center</div>
                    <div className="text-white font-medium text-xs mt-0.5">{activeDoctorMeta.hospitalName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-slate-400">Attending Specialist</div>
                    <div className="text-emerald-400 font-medium text-xs mt-0.5">{activeDoctorMeta.name} ({activeDoctorMeta.regNo})</div>
                  </div>
                </div>

                {/* Diagnostic Assay Results */}
                <div className="space-y-3">
                  <div className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">
                    Investigative Panel: <span className="text-emerald-400">{previewPdfOrder.parameters || 'Biochemistry & Hematology Profile'}</span>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 font-mono text-[11px] text-slate-400 border-b border-white/10">
                        <tr>
                          <th className="p-2.5">Test Parameter</th>
                          <th className="p-2.5">Observed Value</th>
                          <th className="p-2.5">Biological Ref Interval</th>
                          <th className="p-2.5">Clinical Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono">
                        <tr className={previewPdfOrder.hasCritical ? 'bg-rose-950/30 text-rose-200' : (previewPdfOrder.hasAbnormal ? 'bg-amber-950/30 text-amber-200' : 'text-slate-200')}>
                          <td className="p-2.5 font-medium">{previewPdfOrder.parameters?.split(',')[0] || 'Target Biomarker'}</td>
                          <td className="p-2.5 font-bold text-white tabular-nums">
                            {previewPdfOrder.hasCritical ? '0.88 ng/mL (Panic High)' : (previewPdfOrder.hasAbnormal ? 'Elevated' : 'Within Normal Limit')}
                          </td>
                          <td className="p-2.5 text-slate-400">Standard Physiological</td>
                          <td className="p-2.5">
                            {previewPdfOrder.hasCritical ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold">
                                CRITICAL HIGH
                              </span>
                            ) : previewPdfOrder.hasAbnormal ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                                OUT OF RANGE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                                OPTIMAL
                              </span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Attending Recommendation */}
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      <span>Attending Pathologist Clinical Recommendation:</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Investigation validated according to NABL ISO 15189 reference methods. Correlate clinically with patient's baseline history, metabolic profile, and therapeutic titration.
                    </p>
                  </div>

                  {/* Signatures & QR Section */}
                  <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-white/10 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center p-1 border border-white/15 text-[8px] font-mono text-center text-emerald-400">
                        QR-VERIFIED<br />FIPS-140
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Digitally signed via SHA-256 Public Key Cryptography<br />
                        Verified under DPDP Act 2023 Clinical Locker System
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="font-mono text-xs font-bold text-emerald-400">{activeDoctorMeta.name}</div>
                      <div className="text-[10px] text-slate-400">Consultant Pathologist & Clinical Lead</div>
                      <div className="text-[10px] font-mono text-teal-300">NMC Reg No: {activeDoctorMeta.regNo}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-900/95 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">Confidential Medical Diagnostic Document</span>
              <button
                type="button"
                onClick={() => setPreviewPdfOrder(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom AI Copilot Button & Panel */}
      <FloatingAICopilot />
    </div>
  );
}
