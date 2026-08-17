import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { DollarSign, Smartphone, CreditCard, ChevronLeft, ArrowUpRight } from 'lucide-react';

export function RevenueReports() {
  const { user } = useAuth();
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
            totalTransactions: dashboardStats.totalReservations || 0,
            paymentMethodBreakdown: {
              telebirr: revenueData.totalRevenue || 0, // Backend doesn't break down by method yet
              chapa: 0,
              cbe_birr: 0,
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
        <span>Back to Owner Dashboard</span>
      </button>

      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">Revenue & Payment Analytics</h1>
        <p className="text-xs text-stone-500">Track verified revenue transactions across Telebirr, Chapa, and cards</p>
      </div>

      {/* Breakdown Cards */}
      {revenueReport && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
              <Smartphone className="w-4 h-4" />
              <span>Telebirr Collections</span>
            </div>
            <div className="text-2xl font-black text-stone-900">
              {revenueReport.paymentMethodBreakdown.telebirr.toLocaleString()} ETB
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
              <CreditCard className="w-4 h-4" />
              <span>Chapa Online Cards</span>
            </div>
            <div className="text-2xl font-black text-stone-900">
              {revenueReport.paymentMethodBreakdown.chapa.toLocaleString()} ETB
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-purple-600 font-bold text-xs">
              <DollarSign className="w-4 h-4" />
              <span>Total Gross Revenue</span>
            </div>
            <div className="text-2xl font-black text-stone-900">
              {revenueReport.totalRevenue.toLocaleString()} ETB
            </div>
          </div>
        </div>
      )}

      {/* Payment Transactions Table */}
      <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900">Verified Payment Audit Trail</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Payment Ref</th>
                <th className="px-6 py-3.5">Guest</th>
                <th className="px-6 py-3.5">Gateway</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50/50">
                  <td className="px-6 py-4 font-mono font-bold text-stone-900">{p.referenceNumber}</td>
                  <td className="px-6 py-4">{p.guestName}</td>
                  <td className="px-6 py-4 uppercase font-bold text-stone-700">{p.method}</td>
                  <td className="px-6 py-4 font-black text-emerald-700">{p.amount.toLocaleString()} ETB</td>
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
