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

  useEffect(() => {
    if (formData.type === 'Sale') {
      const total = Number(formData.price) || 0;
      const paid = Number(formData.paidAmount) || 0;
      setFormData(prev => ({ ...prev, remainingAmount: (total - paid).toString() }));
    } else {
      setFormData(prev => ({ ...prev, paidAmount: "0", remainingAmount: "0" }));
    }
  }, [formData.price, formData.paidAmount, formData.type]);

  const totalSalesRs = customers.filter(c => c.type === 'Sale' || !c.type).reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  const totalPurchasesRs = customers.filter(c => c.type === 'Purchase').reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  const handleCNICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 13);
    setFormData(prev => ({ ...prev, cnic: val }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d+]/g, "");
    if (val.startsWith("+") ? val.length <= 13 : val.length <= 11) setFormData(prev => ({ ...prev, phone: val }));
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
        toast.success("Record Saved!");
        if (activeTab === 'Bill' && formData.type === 'Sale') setShowPrintPreview(formData);
      }
      loadData();
      setEditingId(null);
      if (activeTab === 'Bill') setActiveTab('Sales');
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

  const filteredData = (activeTab === 'Purchases' ? customers.filter(c => c.type === 'Purchase') : customers.filter(c => c.type === 'Sale' || !c.type)).filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.cnic.includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-slate-900 antialiased">
      <Toaster position="top-right" />
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-[#14B8A6] p-1.5 rounded-lg shadow-sm"><Smartphone className="text-white w-5 h-5" /></div>
          <div><h1 className="font-bold text-slate-800 text-base md:text-lg tracking-tight leading-none uppercase">MOBILE CITY</h1><span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest hidden md:block">Database System</span></div>
        </div>
        <button onClick={() => { localStorage.removeItem("isLoggedIn"); navigate("/login"); }} className="text-slate-500 hover:text-red-500 font-bold text-xs flex items-center gap-1.5 p-2 rounded-lg transition-all"><LogOut size={16} /><span className="hidden sm:block">Logout</span></button>
      </nav>

      <main className="p-4 md:p-6 max-w-[1400px] mx-auto">
        
        {/* STATS - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-teal-500 flex justify-between items-center">
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales</p><h3 className="text-xl font-black text-teal-600">Rs. {totalSalesRs.toLocaleString()}</h3></div>
            <ArrowUpRight className="text-teal-500 w-8 h-8 bg-teal-50 p-2 rounded-xl" />
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-l-4 border-l-orange-500 flex justify-between items-center">
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Purchases</p><h3 className="text-xl font-black text-orange-600">Rs. {totalPurchasesRs.toLocaleString()}</h3></div>
            <ArrowDownLeft className="text-orange-500 w-8 h-8 bg-orange-50 p-2 rounded-xl" />
          </div>
        </div>

        {/* TABS - Compact */}
        <div className="flex gap-1 mb-6 bg-slate-200/60 p-1 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('Sales')} className={`px-4 md:px-6 py-2 rounded-lg font-bold text-xs md:text-sm whitespace-nowrap transition-all ${activeTab === 'Sales' ? 'bg-white text-[#14B8A6] shadow-sm' : 'text-slate-500'}`}>Sales History</button>
          <button onClick={() => setActiveTab('Purchases')} className={`px-4 md:px-6 py-2 rounded-lg font-bold text-xs md:text-sm whitespace-nowrap transition-all ${activeTab === 'Purchases' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-500'}`}>Purchases</button>
          <button onClick={() => { setActiveTab('Bill'); setFormData(prev => ({...prev, type: 'Sale', price: "", paidAmount: "", remainingAmount: ""})); }} className={`px-4 md:px-6 py-2 rounded-lg font-bold text-xs md:text-sm whitespace-nowrap transition-all ${activeTab === 'Bill' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500'}`}>Create Bill</button>
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          
          {activeTab !== 'Bill' ? (
            <>
              <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
                <div className="relative w-full md:w-1/2">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
                  <input type="text" placeholder="Search records..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none text-sm transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                {activeTab === 'Purchases' && (
                  <button onClick={() => { setFormData(prev => ({...prev, type: 'Purchase', price: "", paidAmount: "0", remainingAmount: "0"})); setActiveTab('Bill'); }} className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md active:scale-95 w-full md:w-auto flex items-center justify-center gap-2"><Plus size={16}/> New Purchase</button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b">
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Handset</th>
                      <th className="px-4 py-3 text-center">IMEI/Serial</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      {activeTab === 'Sales' && (
                        <>
                          <th className="px-4 py-3 text-right text-teal-600">Paid</th>
                          <th className="px-4 py-3 text-right text-red-500">Balance</th>
                        </>
                      )}
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-300 animate-pulse text-sm">Syncing Database...</td></tr>
                    ) : filteredData.length > 0 ? (
                      filteredData.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-50/80 transition-all group">
                          <td className="px-4 py-4"><div className="flex flex-col"><span className="font-bold text-slate-800 text-sm">{c.name}</span><span className="text-[10px] text-slate-400 font-medium">{c.phone}</span></div></td>
                          <td className="px-4 py-4 text-xs font-bold text-slate-600 uppercase">{c.model}</td>
                          <td className="px-4 py-4 text-center"><span className={`px-2.5 py-1 rounded text-[9px] font-bold border uppercase ${c.type === 'Purchase' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-teal-50 text-teal-600 border-teal-200'}`}>{c.emi}</span></td>
                          <td className="px-4 py-4 text-right font-bold text-slate-900 text-sm">Rs. {Number(c.price || 0).toLocaleString()}</td>
                          {activeTab === 'Sales' && (
                            <>
                              <td className="px-4 py-4 text-right font-bold text-teal-600 text-sm">Rs. {Number(c.paidAmount || 0).toLocaleString()}</td>
                              <td className={`px-4 py-4 text-right font-bold text-sm ${Number(c.remainingAmount) > 0 ? 'text-red-500' : 'text-slate-300'}`}>Rs. {Number(c.remainingAmount || 0).toLocaleString()}</td>
                            </>
                          )}
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end gap-1">
                              {c.type === 'Sale' && <button onClick={() => setShowPrintPreview(c)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"><Printer size={15} /></button>}
                              <button onClick={() => { setFormData(c); setEditingId(c._id!); setActiveTab('Bill'); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
                              <button onClick={() => { if(window.confirm("Delete?")) deleteCustomerApi(c._id!).then(()=>loadData()); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={8} className="px-4 py-20 text-center text-slate-300 font-medium text-xs">NO RECORDS FOUND.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            /* COMPACT FORM VIEW - Responsive 2-Column */
            <div className="p-6 md:p-10 max-w-4xl mx-auto">
              <div className="mb-6 text-center">
                <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">NEW RECORD ENTRY</h3>
                <p className="text-slate-400 font-bold text-[10px] mt-1 tracking-widest">MOBILE CITY - SYSTEM</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit mx-auto border border-slate-200 shadow-inner mb-6">
                  <button type="button" onClick={() => setFormData(prev => ({...prev, type: 'Sale'}))} className={`px-8 py-2 rounded-lg font-bold text-xs transition-all ${formData.type === 'Sale' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>SALE BILL</button>
                  <button type="button" onClick={() => setFormData(prev => ({...prev, type: 'Purchase'}))} className={`px-8 py-2 rounded-lg font-bold text-xs transition-all ${formData.type === 'Purchase' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}>PURCHASE</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Customer Name</label>
                    <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none font-bold text-sm transition-all" placeholder="Enter Name" value={formData.name} onChange={e => setFormData(prev => ({...prev, name: e.target.value}))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Phone Number</label>
                    <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none font-bold text-sm" placeholder="03XXXXXXXXX" value={formData.phone} onChange={handlePhoneChange} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">CNIC (13 Digits)</label>
                    <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none font-bold text-sm" placeholder="36103XXXXXXXX" value={formData.cnic} onChange={handleCNICChange} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">IMEI / Serial</label>
                    <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none font-bold text-sm" placeholder="IMEI-XXXXXXXX" value={formData.emi} onChange={e => setFormData(prev => ({...prev, emi: e.target.value}))} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Mobile Model</label>
                    <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none font-bold text-sm uppercase" placeholder="e.g. iPhone 15 Pro Max" value={formData.model} onChange={e => setFormData(prev => ({...prev, model: e.target.value}))} />
                  </div>

                  <div className={`${formData.type === 'Sale' ? 'col-span-1' : 'col-span-1 sm:col-span-2'}`}>
                    <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Total Price (Rs)</label>
                    <input required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-black text-teal-600 text-lg shadow-sm" placeholder="0" value={formData.price} onChange={e => setFormData(prev => ({...prev, price: e.target.value.replace(/\D/g, "")}))} /></div>
                  </div>

                  {formData.type === 'Sale' && (
                    <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Cash Paid (Rs)</label>
                    <input required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-black text-teal-600 text-lg shadow-sm" placeholder="0" value={formData.paidAmount} onChange={e => setFormData(prev => ({...prev, paidAmount: e.target.value.replace(/\D/g, "")}))} /></div>
                  )}

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Transaction Date</label>
                    <input type="date" required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm" value={formData.date} onChange={e => setFormData(prev => ({...prev, date: e.target.value}))} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                   <button type="button" onClick={() => setActiveTab('Sales')} className="flex-1 py-3 border border-slate-300 text-slate-500 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Discard</button>
                   <button type="submit" className={`flex-[2] py-3 text-white font-black rounded-xl shadow-md text-xs uppercase tracking-widest active:scale-95 transition-all ${formData.type === 'Sale' ? 'bg-[#14B8A6] hover:bg-[#0d9488]' : 'bg-orange-500 hover:bg-orange-600'}`}>{formData.type === 'Sale' ? 'Save & Print Invoice' : 'Confirm Purchase'}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* BILL MODAL PREVIEW (Optimized for Screen & Print) */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 relative my-8">
            <button onClick={() => setShowPrintPreview(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-all"><X size={20} className="text-slate-400" /></button>
            
            <div id="bill-content" className="border border-slate-200 rounded-2xl p-6">
                <div className="flex justify-between items-start text-left mb-4">
                    <div><h1 className="text-2xl font-black text-slate-800 m-0 leading-tight">Mobile City</h1><p className="text-[9px] text-slate-400 font-bold uppercase m-0 tracking-tighter">Official Receipt</p></div>
                    <div className="text-right leading-tight"><p className="font-bold text-[11px] m-0">Hassnain Bhatti</p><p className="text-[10px] m-0 font-mono">0300-6322773</p></div>
                </div>
                <div className="space-y-2 text-left border-y py-4 my-4 border-slate-100">
                    <div className="flex justify-between text-[11px]"><span className="text-slate-400 font-bold uppercase">Date:</span> <span className="font-black">{showPrintPreview.date}</span></div>
                    <div className="flex justify-between text-[11px]"><span className="text-slate-400 font-bold uppercase">Customer:</span> <span className="font-black text-slate-800 uppercase">{showPrintPreview.name}</span></div>
                    <div className="flex justify-between text-[11px]"><span className="text-slate-400 font-bold uppercase">Handset:</span> <span className="font-black text-slate-700 uppercase">{showPrintPreview.model}</span></div>
                    <div className="flex justify-between text-[11px]"><span className="text-slate-400 font-bold uppercase">IMEI:</span> <span className="font-black text-slate-500 font-mono">{showPrintPreview.emi}</span></div>
                    
                    <div className="pt-3 space-y-1">
                      <div className="flex justify-between text-[11px]"><span className="font-bold text-slate-400 uppercase">Net Bill:</span> <span className="font-black">Rs. {Number(showPrintPreview.price).toLocaleString()}</span></div>
                      <div className="flex justify-between text-[11px]"><span className="font-bold text-slate-400 uppercase tracking-tighter">Cash Paid:</span> <span className="font-black text-teal-600">Rs. {Number(showPrintPreview.paidAmount || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between text-[11px] border-t pt-1 mt-1"><span className="font-bold text-slate-400 uppercase">Balance:</span> <span className="font-black text-red-500">Rs. {Number(showPrintPreview.remainingAmount || 0).toLocaleString()}</span></div>
                    </div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl flex justify-between items-center text-white shadow-sm">
                    <span className="font-black uppercase text-[9px] tracking-widest">Grand Total</span>
                    <span className="text-xl font-black tracking-tighter">Rs. {Number(showPrintPreview.price).toLocaleString()}</span>
                </div>
                <p className="text-[7px] text-slate-300 uppercase font-black mt-6 tracking-[0.3em] text-center italic">Thanks for shopping at Mobile City</p>
            </div>
            <div className="flex gap-2 mt-6">
                <button onClick={() => handlePrint(showPrintPreview)} className="flex-[2] py-3 bg-teal-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all">Print Invoice</button>
                <button onClick={() => setShowPrintPreview(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;