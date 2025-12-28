import React, { useState, useEffect } from "react";
import { 
  Users, Search, Plus, Smartphone, LogOut, Pencil, Trash2, X, 
  Phone, Fingerprint, Calendar, Hash, Printer, Banknote, Wallet,
  ArrowUpRight, ArrowDownLeft, FileText, ShoppingBag, CreditCard
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { getCustomers, addCustomer, updateCustomer, deleteCustomerApi, type CustomerData } from "../api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Sales' | 'Purchases' | 'Bill'>('Sales');
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState<CustomerData | null>(null);

  const [formData, setFormData] = useState<CustomerData>({
    name: "", phone: "", cnic: "", model: "", emi: "", price: "",
    paidAmount: "", remainingAmount: "",
    type: 'Sale', date: new Date().toISOString().split('T')[0],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getCustomers();
      setCustomers(res.data);
    } catch { toast.error("Database connection failed!"); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // --- AUTO CALCULATION (Only for Sales) ---
  useEffect(() => {
    if (formData.type === 'Sale') {
      const total = Number(formData.price) || 0;
      const paid = Number(formData.paidAmount) || 0;
      const remaining = total - paid;
      setFormData(prev => ({ ...prev, remainingAmount: remaining.toString() }));
    } else {
      // Purchase ke liye baki fields 0 rakhein
      setFormData(prev => ({ ...prev, paidAmount: "0", remainingAmount: "0" }));
    }
  }, [formData.price, formData.paidAmount, formData.type]);

  // --- STATS ---
  const salesRecords = customers.filter(c => c.type === 'Sale' || !c.type);
  const purchaseRecords = customers.filter(c => c.type === 'Purchase');
  const totalSalesRs = salesRecords.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const totalPurchasesRs = purchaseRecords.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  // --- HANDLERS ---
  const handleCNICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 13);
    setFormData(prev => ({ ...prev, cnic: val }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d+]/g, "");
    if (val.startsWith("+") ? val.length <= 13 : val.length <= 11) setFormData(prev => ({ ...prev, phone: val }));
  };

  const handleNumericInput = (field: keyof CustomerData, value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    setFormData(prev => ({ ...prev, [field]: cleanValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.cnic.length !== 13) return toast.error("CNIC must be 13 digits");
    try {
      if (editingId) {
        await updateCustomer(editingId, formData);
        toast.success("Updated!");
      } else {
        await addCustomer(formData);
        toast.success(`Record added to ${formData.type}s`);
        if (activeTab === 'Bill' && formData.type === 'Sale') setShowPrintPreview(formData);
      }
      loadData();
      setEditingId(null);
      if (activeTab === 'Bill') setActiveTab(formData.type === 'Sale' ? 'Sales' : 'Purchases');
      setFormData({ name: "", phone: "", cnic: "", model: "", emi: "", price: "", paidAmount: "", remainingAmount: "", type: 'Sale', date: new Date().toISOString().split('T')[0] });
    } catch { toast.error("Action Failed!"); }
  };

  const handlePrint = (c: CustomerData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>MOBILE CITY - INVOICE</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 5mm; margin: 0; color: #000; }
            .header { text-align: left; position: relative; margin-bottom: 20px; }
            .shop-name { font-size: 26px; font-weight: 900; margin: 0; letter-spacing: -1px; }
            .owner-info { text-align: right; margin-top: -35px; }
            .owner-name { font-weight: bold; font-size: 14px; margin: 0; }
            .invoice-title { text-align: center; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 0; margin: 15px 0; font-weight: bold; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { border-bottom: 1px solid #000; text-align: left; font-size: 11px; }
            td { padding: 5px 0; font-size: 11px; }
            .total-box { border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; }
            .grand-total { font-size: 16px; font-weight: 900; border-top: 2px solid #000; margin-top: 5px; padding-top: 5px; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="shop-name">Mobile City</h1>
            <div class="owner-info">
              <p class="owner-name">Hassnain Bhatti</p>
              <p style="font-size:11px; margin:0;">0300-6322773</p>
            </div>
          </div>
          <div class="invoice-title">INVOICE</div>
          <div class="row"><span><b>Date:</b> ${c.date}</span> <span><b>Inv#:</b> ${c._id?.slice(-5).toUpperCase() || '0001'}</span></div>
          <div class="row"><b>Customer:</b> ${c.name}</div>
          <div class="row"><b>Cell No:</b> ${c.phone}</div>
          <table>
            <thead><tr><th>Sold Item</th><th style="text-align:right">Price</th></tr></thead>
            <tbody>
              <tr><td>${c.model}<br/><small>${c.emi}</small></td><td style="text-align:right">${Number(c.price).toLocaleString()}</td></tr>
            </tbody>
          </table>
          <div class="total-box">
            <div class="row"><span>Net Total:</span> <span>${Number(c.price).toLocaleString()}</span></div>
            ${c.type === 'Sale' ? `
              <div class="row"><span>Cash Paid:</span> <span>${Number(c.paidAmount || 0).toLocaleString()}</span></div>
              <div class="row"><span>Remaining:</span> <span>${Number(c.remainingAmount || 0).toLocaleString()}</span></div>
            ` : ''}
            <div class="row grand-total"><span>Current Total:</span> <span>Rs. ${Number(c.price).toLocaleString()}</span></div>
          </div>
          <div class="footer"><p>THANK YOU FOR YOUR BUSINESS</p><p>Mobile City - Sahiwal Road</p></div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredData = (activeTab === 'Purchases' ? purchaseRecords : salesRecords).filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.cnic.includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-slate-900 antialiased">
      <Toaster position="top-right" />
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#14B8A6] p-2 rounded-xl shadow-lg shadow-teal-100"><Smartphone className="text-white w-6 h-6" /></div>
          <div><h1 className="font-black text-slate-800 text-xl tracking-tighter uppercase">MOBILE CITY</h1><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest tracking-tighter">Shop Manager</span></div>
        </div>
        <button onClick={() => { localStorage.removeItem("isLoggedIn"); navigate("/login"); }} className="text-slate-400 hover:text-red-500 font-bold text-sm flex items-center gap-2"><LogOut size={18} />Logout</button>
      </nav>

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
        
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-8 border-teal-500 flex justify-between items-center group hover:shadow-md transition-all">
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sales</p><h3 className="text-2xl font-black text-teal-600 mt-1">Rs. {totalSalesRs.toLocaleString()}</h3></div>
            <ArrowUpRight className="text-teal-500 w-10 h-10 bg-teal-50 p-2 rounded-2xl" />
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-8 border-orange-500 flex justify-between items-center group hover:shadow-md transition-all">
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Purchases</p><h3 className="text-2xl font-black text-orange-600 mt-1">Rs. {totalPurchasesRs.toLocaleString()}</h3></div>
            <ArrowDownLeft className="text-orange-500 w-10 h-10 bg-orange-50 p-2 rounded-2xl" />
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-l-8 border-blue-500 flex justify-between items-center group hover:shadow-md transition-all">
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customers</p><h3 className="text-2xl font-black text-blue-600 mt-1">{salesRecords.length}</h3></div>
            <Users className="text-blue-500 w-10 h-10 bg-blue-50 p-2 rounded-2xl" />
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-2xl w-fit border shadow-inner">
          <button onClick={() => setActiveTab('Sales')} className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'Sales' ? 'bg-white text-teal-600 shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}><ShoppingBag size={18} className="inline mr-2"/> Sales History</button>
          <button onClick={() => setActiveTab('Purchases')} className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'Purchases' ? 'bg-white text-orange-500 shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}><ArrowDownLeft size={18} className="inline mr-2"/> Purchase History</button>
          <button onClick={() => { setActiveTab('Bill'); setFormData(prev => ({...prev, type: 'Sale', price: "", paidAmount: "", remainingAmount: ""})); }} className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'Bill' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}><FileText size={18} className="inline mr-2"/> Create Bill / Entry</button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
          {activeTab !== 'Bill' ? (
            <>
              <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 justify-between items-center">
                <div className="relative w-full md:w-1/2">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                  <input type="text" placeholder="Search by name, phone or CNIC..." className="w-full pl-14 pr-6 py-4.5 bg-slate-50 border-none rounded-3xl focus:bg-white focus:ring-2 focus:ring-[#14B8A6] outline-none font-bold text-slate-600 shadow-inner transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                {activeTab === 'Purchases' && (
                  <button onClick={() => { setFormData(prev => ({...prev, type: 'Purchase', price: "", paidAmount: "0", remainingAmount: "0"})); setActiveTab('Bill'); }} className="bg-orange-500 text-white px-8 py-5 rounded-3xl font-black flex items-center gap-2 shadow-xl active:scale-95 transition-all"><Plus size={20}/> New Purchase</button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                      <th className="px-8 py-6">Customer</th>
                      <th className="px-6 py-6">Handset</th>
                      <th className="px-6 py-6 text-center">IMEI/Serial</th>
                      <th className="px-6 py-6 text-right">Price (PKR)</th>
                      {/* Only Sales tab shows Paid/Remaining */}
                      {activeTab === 'Sales' && (
                        <>
                          <th className="px-6 py-6 text-right text-teal-600">Paid</th>
                          <th className="px-6 py-6 text-right text-red-500">Balance</th>
                        </>
                      )}
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan={8} className="px-8 py-24 text-center font-black text-slate-200 animate-pulse text-2xl uppercase tracking-widest">Loading Database...</td></tr>
                    ) : filteredData.length > 0 ? (
                      filteredData.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-50 transition-all group">
                          <td className="px-8 py-7 font-black text-slate-800 uppercase text-sm">{c.name}<br/><span className="text-[10px] font-bold text-slate-300 font-mono tracking-tighter">{c.cnic}</span></td>
                          <td className="px-6 py-7 font-black text-slate-500 uppercase text-xs">{c.model}</td>
                          <td className="px-6 py-7 text-center"><span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-wider ${c.type === 'Purchase' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-teal-50 text-teal-600 border-teal-100'}`}>{c.emi}</span></td>
                          <td className="px-6 py-7 text-right font-black text-slate-900 text-lg">Rs. {Number(c.price || 0).toLocaleString()}</td>
                          {activeTab === 'Sales' && (
                            <>
                              <td className="px-6 py-7 text-right font-bold text-teal-600">Rs. {Number(c.paidAmount || 0).toLocaleString()}</td>
                              <td className={`px-6 py-7 text-right font-bold ${Number(c.remainingAmount) > 0 ? 'text-red-500' : 'text-slate-400'}`}>Rs. {Number(c.remainingAmount || 0).toLocaleString()}</td>
                            </>
                          )}
                          <td className="px-8 py-7 text-right">
                            <div className="flex justify-end gap-2">
                              {c.type === 'Sale' && <button onClick={() => setShowPrintPreview(c)} className="p-3 text-[#14B8A6] bg-teal-50 hover:bg-[#14B8A6] hover:text-white rounded-2xl transition-all shadow-sm"><Printer size={18} /></button>}
                              <button onClick={() => { setFormData(c); setEditingId(c._id!); setActiveTab('Bill'); }} className="p-3 text-blue-500 bg-blue-50 hover:bg-blue-500 hover:text-white rounded-2xl transition-all shadow-sm"><Pencil size={18} /></button>
                              <button onClick={() => { if(window.confirm("Delete record?")) deleteCustomerApi(c._id!).then(()=>loadData()); }} className="p-3 text-red-400 bg-red-50 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={8} className="px-8 py-32 text-center text-slate-300 font-bold uppercase tracking-widest text-lg">Empty Records</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* CREATE FORM */
            <div className="p-10 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4">
              <div className="mb-12 text-center">
                <h3 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">MOBILE CITY</h3>
                <p className="text-slate-400 font-bold tracking-[0.4em] text-[10px] mt-2 uppercase underline decoration-teal-500 decoration-4 underline-offset-8">New {formData.type} Entry</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8 bg-slate-50/50 p-10 rounded-[3rem] border border-slate-100 shadow-inner">
                <div className="flex justify-center gap-6 p-2 bg-slate-200/50 rounded-[2rem] w-fit mx-auto border-2 border-white shadow-sm mb-10">
                  <button type="button" onClick={() => setFormData(prev => ({...prev, type: 'Sale'}))} className={`px-16 py-4 rounded-[1.5rem] font-black text-sm transition-all ${formData.type === 'Sale' ? 'bg-white text-teal-600 shadow-xl' : 'text-slate-400'}`}>SALE BILL</button>
                  <button type="button" onClick={() => setFormData(prev => ({...prev, type: 'Purchase'}))} className={`px-16 py-4 rounded-[1.5rem] font-black text-sm transition-all ${formData.type === 'Purchase' ? 'bg-white text-orange-600 shadow-xl' : 'text-slate-400'}`}>PURCHASE</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 flex items-center gap-2"><Users size={14}/> Name</label>
                  <input required className="w-full px-8 py-6 bg-white border-2 border-transparent rounded-3xl focus:border-teal-500 outline-none font-bold text-lg shadow-sm" placeholder="Enter Name" value={formData.name} onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} /></div>
                  
                  <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 flex items-center gap-2"><Phone size={14}/> Phone Number</label>
                  <input required className="w-full px-8 py-6 bg-white border-2 border-transparent rounded-3xl focus:border-teal-500 outline-none font-bold text-lg shadow-sm" placeholder="03XXXXXXXXX" value={formData.phone} onChange={handlePhoneChange} /></div>

                  <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 flex items-center gap-2"><Fingerprint size={14}/> CNIC (13 Digits)</label>
                  <input required className="w-full px-8 py-6 bg-white border-2 border-transparent rounded-3xl focus:border-teal-500 outline-none font-bold text-lg shadow-sm" placeholder="36103XXXXXXXX" value={formData.cnic} onChange={handleCNICChange} /></div>

                  <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 flex items-center gap-2"><Hash size={14}/> IMEI / Serial Number</label>
                  <input required className="w-full px-8 py-6 bg-white border-2 border-transparent rounded-3xl focus:border-teal-500 outline-none font-bold text-lg shadow-sm" placeholder="IMEI-XXXXXXXX" value={formData.emi} onChange={e => setFormData(prev => ({...prev, emi: e.target.value}))} /></div>

                  <div className="space-y-3 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 flex items-center gap-2"><Smartphone size={14}/> Mobile Model</label>
                  <input required className="w-full px-8 py-6 bg-white border-2 border-transparent rounded-3xl focus:border-teal-500 outline-none font-bold text-lg shadow-sm uppercase" placeholder="e.g. iPhone 15 Pro Max" value={formData.model} onChange={e => setFormData(prev => ({...prev, model: e.target.value}))} /></div>

                  {/* PRICE SECTION (Condition-wise) */}
                  <div className={`${formData.type === 'Sale' ? 'col-span-1' : 'col-span-2'}`}>
                    <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 flex items-center gap-2"><CreditCard size={14}/> Total Price (Rs)</label>
                    <input required className={`w-full px-8 py-6 border-2 border-transparent rounded-3xl focus:bg-white focus:border-teal-500 outline-none font-black text-teal-600 text-2xl shadow-sm ${formData.type === 'Sale' ? 'bg-teal-50' : 'bg-orange-50 text-orange-600'}`} placeholder="0" value={formData.price} onChange={e => handleNumericInput('price', e.target.value)} /></div>
                  </div>

                  {/* Only show Paid/Remaining for Sales */}
                  {formData.type === 'Sale' && (
                    <>
                      <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 flex items-center gap-2"><Banknote size={14}/> Cash Paid (Rs)</label>
                      <input required className="w-full px-8 py-6 bg-teal-50 border-2 border-transparent rounded-3xl focus:bg-white focus:border-teal-500 outline-none font-black text-teal-600 text-2xl shadow-sm" placeholder="0" value={formData.paidAmount} onChange={e => handleNumericInput('paidAmount', e.target.value)} /></div>

                      <div className="space-y-3 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-4 flex items-center gap-2"><Wallet size={14}/> Remaining Balance (Rs)</label>
                      <input readOnly className="w-full px-8 py-6 bg-red-50 border-2 border-transparent rounded-3xl font-black text-red-500 text-2xl shadow-sm outline-none cursor-not-allowed" value={formData.remainingAmount} /></div>
                    </>
                  )}

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 flex items-center gap-2"><Calendar size={14}/> Transaction Date</label>
                    <input type="date" required className="w-full px-8 py-6 bg-white border-2 border-transparent rounded-3xl focus:border-teal-500 outline-none font-bold shadow-sm" value={formData.date} onChange={e => setFormData(prev => ({...prev, date: e.target.value}))} />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 pt-10">
                   <button type="button" onClick={() => setActiveTab('Sales')} className="flex-1 py-6 border-4 border-white bg-slate-200 text-slate-500 font-black rounded-3xl uppercase tracking-widest text-xs shadow-sm hover:bg-slate-300">Discard</button>
                   <button type="submit" className={`flex-[2] py-6 text-white font-black rounded-3xl shadow-2xl uppercase tracking-widest text-sm active:scale-95 transition-all ${formData.type === 'Sale' ? 'bg-[#14B8A6] shadow-teal-200 hover:bg-[#0d9488]' : 'bg-orange-500 shadow-orange-200 hover:bg-orange-600'}`}>{formData.type === 'Sale' ? 'Save & Print Invoice' : 'Confirm Purchase entry'}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* BILL MODAL PREVIEW */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-2xl z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[4rem] w-full max-w-lg shadow-2xl p-12 relative border-[16px] border-teal-500/5">
            <button onClick={() => setShowPrintPreview(null)} className="absolute top-10 right-10 p-3 hover:bg-slate-100 rounded-full transition-all"><X size={28} className="text-slate-400" /></button>
            <div className="border-4 border-slate-50 rounded-[3rem] p-10 text-center">
                <div className="flex justify-between items-start text-left mb-6">
                    <div><h1 className="text-3xl font-black text-slate-800 m-0 leading-tight">Mobile City</h1><p className="text-[10px] text-slate-400 font-bold uppercase m-0">Official Receipt</p></div>
                    <div className="text-right"><p className="font-bold text-sm m-0">Hassnain Bhatti</p><p className="text-[11px] m-0">0300-6322773</p></div>
                </div>
                <div className="space-y-4 text-left border-y py-6 my-6 border-slate-100">
                    <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">Date:</span> <span className="font-black">{showPrintPreview.date}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">Customer:</span> <span className="font-black text-slate-800 uppercase">{showPrintPreview.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">Handset:</span> <span className="font-black text-slate-700 uppercase">{showPrintPreview.model}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">IMEI:</span> <span className="font-black text-slate-500 font-mono text-sm">{showPrintPreview.emi}</span></div>
                    
                    <div className="pt-4 space-y-2">
                      <div className="flex justify-between text-xs"><span className="font-bold text-slate-400">Total Bill:</span> <span className="font-black">Rs. {Number(showPrintPreview.price).toLocaleString()}</span></div>
                      <div className="flex justify-between text-xs"><span className="font-bold text-slate-400">Cash Paid:</span> <span className="font-black text-teal-600">Rs. {Number(showPrintPreview.paidAmount || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between text-xs border-t pt-2"><span className="font-bold text-slate-400">Remaining Balance:</span> <span className="font-black text-red-500">Rs. {Number(showPrintPreview.remainingAmount || 0).toLocaleString()}</span></div>
                    </div>
                </div>
                <div className="bg-teal-600 p-8 rounded-[2.5rem] flex justify-between items-center text-white shadow-2xl">
                    <span className="font-black uppercase text-[10px]">Net Total:</span>
                    <span className="text-4xl font-black tracking-tighter">Rs. {Number(showPrintPreview.price).toLocaleString()}</span>
                </div>
            </div>
            <div className="flex gap-6 mt-12">
                <button onClick={() => handlePrint(showPrintPreview)} className="flex-[2] py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase shadow-xl active:scale-95">Print System Receipt</button>
                <button onClick={() => setShowPrintPreview(null)} className="flex-1 py-6 bg-slate-100 text-slate-400 rounded-[1.5rem] font-black text-xs uppercase hover:bg-slate-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;