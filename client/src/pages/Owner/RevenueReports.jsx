import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { DollarSign, Smartphone, CreditCard, ChevronLeft, ArrowUpRight } from 'lucide-react';

export function RevenueReports() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [guesthouseId, setGuesthouseId] = useState(null);

  const [payments, setPayments] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRevenue() {
      setLoading(true);
      try {
        // First get the owner's guesthouse
        const gh = await ApiService.getMyGuesthouse();
        if (gh) {
          setGuesthouseId(gh.id);
          // Use the dashboard API endpoints for real data
          const dashboardStats = await ApiService.getOwnerDashboardStats();
          const revenueData = await ApiService.getOwnerDashboardRevenue();
          const paymentsData = await ApiService.getOwnerDashboardRecentPayments();
          
          setPayments(paymentsData);
          setRevenueReport({
            totalRevenue: revenueData.totalRevenue || 0,
            commissionRevenue: revenueData.commissionRevenue || 0,
            ownerNetRevenue: revenueData.ownerNetRevenue ?? Math.max((revenueData.totalRevenue || 0) - (revenueData.commissionRevenue || 0), 0),
            totalTransactions: dashboardStats.totalReservations || 0,
            paymentMethodBreakdown: {
              telebirr: revenueData.breakdown?.telebirr || 0,
              chapa: revenueData.breakdown?.chapa || 0,
              card: revenueData.breakdown?.card || 0,
              bank_transfer: revenueData.breakdown?.bank_transfer || 0,
            },
          });
        } else {
          setGuesthouseId(null);
          setPayments([]);
          setRevenueReport(null);
        }
      } catch (err) {
        console.error('Error loading revenue reports:', err);
        setGuesthouseId(null);
        setPayments([]);
        setRevenueReport(null);
      } finally {
        setLoading(false);
      }
    }
    loadRevenue();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <button
        onClick={() => navigate('/owner')}
        className="flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>{t('Back to Owner Dashboard')}</span>
      </button>

      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">{t('Revenue & Payment Analytics')}</h1>
        <p className="text-xs text-stone-500">{t('Track verified revenue transactions across Telebirr, Chapa, and cards')}</p>
      </div>

      {/* Breakdown Cards */}
      {revenueReport && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: 'Telebirr Collections', amount: revenueReport.paymentMethodBreakdown.telebirr, icon: Smartphone, tone: 'text-blue-700' },
            { label: 'Chapa Online Cards', amount: revenueReport.paymentMethodBreakdown.chapa, icon: CreditCard, tone: 'text-emerald-700' },
            { label: 'Card Payments', amount: revenueReport.paymentMethodBreakdown.card, icon: CreditCard, tone: 'text-blue-700' },
            { label: 'Bank Transfers', amount: revenueReport.paymentMethodBreakdown.bank_transfer, icon: DollarSign, tone: 'text-stone-700' },
            { label: 'Total Gross Revenue', amount: revenueReport.totalRevenue, icon: DollarSign, tone: 'text-stone-900' },
            { label: 'Platform Commission', amount: revenueReport.commissionRevenue, icon: DollarSign, tone: 'text-amber-700' },
            { label: 'Owner Net Revenue', amount: revenueReport.ownerNetRevenue, icon: ArrowUpRight, tone: 'text-emerald-700' },
          ].map(({ label, amount, icon: Icon, tone }) => (
            <div key={label} className="space-y-2 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className={`flex items-center gap-2 text-xs font-bold ${tone}`}><Icon className="h-4 w-4" /><span>{t(label)}</span></div>
              <div className={`text-2xl font-black ${tone}`}>{Number(amount || 0).toLocaleString()} ETB</div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Transactions Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">{t('Verified Payment Audit Trail')}</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">{t('Payment Ref')}</th>
                <th className="px-6 py-3.5">{t('Guest')}</th>
                <th className="px-6 py-3.5">{t('Gateway')}</th>
                <th className="px-6 py-3.5 text-right">{t('Guest Payment')}</th>
                <th className="px-6 py-3.5 text-right">{t('Platform Commission')}</th>
                <th className="px-6 py-3.5 text-right">{t('Owner Net')}</th>
                <th className="px-6 py-3.5">{t('Status')}</th>
                <th className="px-6 py-3.5">{t('Date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/50">
                  <td className="px-6 py-4 font-mono font-bold text-stone-900">{p.referenceNumber}</td>
                  <td className="px-6 py-4">{p.guestName}</td>
                  <td className="px-6 py-4 uppercase font-bold text-stone-700">{p.method}</td>
                  <td className="px-6 py-4 text-right font-bold text-stone-800">{Number(p.amount || 0).toLocaleString()} ETB</td>
                  <td className="px-6 py-4 text-right font-semibold text-amber-700">{Number(p.commissionAmount || 0).toLocaleString()} ETB <span className="text-[10px] text-stone-500">({Number(p.commissionRate || 0)}%)</span></td>
                  <td className="px-6 py-4 text-right font-black text-emerald-700">{Number(p.ownerNetAmount ?? (Number(p.amount || 0) - Number(p.commissionAmount || 0))).toLocaleString()} ETB</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-stone-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
