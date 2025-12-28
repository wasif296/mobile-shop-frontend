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

  // --- AUTO CALCULATION ---
  useEffect(() => {
    if (formData.type === 'Sale') {
      const total = parseInt(formData.price) || 0;
      const paid = parseInt(formData.paidAmount) || 0;
      setFormData(prev => ({ ...prev, remainingAmount: (total - paid).toString() }));
    }
  }, [formData.price, formData.paidAmount, formData.type]);

  // --- STATS ---
  const salesRecords = customers.filter(c => c.type === 'Sale' || !c.type);
  const purchaseRecords = customers.filter(c => c.type === 'Purchase');
  const totalReceivedCash = salesRecords.reduce((acc, curr) => acc + (Number(curr.paidAmount) || 0), 0);
  const totalPurchaseCash = purchaseRecords.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

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
        toast.success("Record Updated!");
      } else {
        await addCustomer(formData);
        toast.success("Saved to MOBILE CITY Database!");
        if (activeTab === 'Bill' && formData.type === 'Sale') setShowPrintPreview(formData);
      }
      loadData();
      setEditingId(null);
      if (activeTab === 'Bill') setActiveTab('Sales');
      setFormData({ name: "", phone: "", cnic: "", model: "", emi: "", price: "", paidAmount: "", remainingAmount: "", type: 'Sale', date: new Date().toISOString().split('T')[0] });
    } catch { toast.error("Server Error!"); }
  };

  // --- THERMAL PRINT LOGIC ---
  const handlePrint = (c: CustomerData) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>MOBILE CITY - BILL</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 5mm; margin: 0; color: #000; }
            .header { text-align: left; position: relative; margin-bottom: 20px; }
            .shop-name { font-size: 26px; font-weight: 900; margin: 0; text-transform: uppercase; }
            .owner-info { text-align: right; margin-top: -35px; }
            .owner-name { font-weight: bold; font-size: 14px; margin: 0; }
            .invoice-title { text-align: center; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 5px 0; margin: 15px 0; font-weight: bold; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
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
          <div class="row"><span>Date: ${c.date}</span></div>
          <div class="row"><b>Customer:</b> ${c.name}</div>
          <div class="row"><b>Cell No:</b> ${c.phone}</div>
          <div style="border-bottom: 1px solid #000; margin: 10px 0;"></div>
          <div class="row"><span>Item: ${c.model}</span></div>
          <div class="row"><span>IMEI: ${c.emi}</span></div>
          <div class="total-box">
            <div class="row"><span>Total Bill:</span> <span>Rs. ${Number(c.price).toLocaleString()}</span></div>
            <div class="row"><span>Paid Amount:</span> <span>Rs. ${Number(c.paidAmount).toLocaleString()}</span></div>
            <div class="row"><span>Remaining Balance:</span> <span>Rs. ${Number(c.remainingAmount).toLocaleString()}</span></div>
            <div class="row grand-total"><span>Current Total:</span> <span>Rs. ${Number(c.paidAmount).toLocaleString()}</span></div>
          </div>
          <div class="footer"><p>THANK YOU FOR YOUR BUSINESS</p></div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredData = (activeTab === 'Purchases' ? purchaseRecords : salesRecords).filter(c => {
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.cnic.includes(q) || c.model.toLowerCase().includes(q) || c.emi.includes(q);
  });

  return (
    <div className="min-h-screen bg-[#F3F4F6] font-sans text-slate-900 antialiased">
      <Toaster position="top-right" />
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-[#14B8A6] p-1.5 rounded-lg shadow-sm"><Smartphone className="text-white w-5 h-5" /></div>
          <h1 className="font-black text-slate-800 text-lg uppercase tracking-tighter">MOBILE CITY</h1>
        </div>
        <button onClick={() => { localStorage.removeItem("isLoggedIn"); navigate("/login"); }} className="text-slate-400 hover:text-red-500 font-bold text-xs flex items-center gap-2 px-3 py-2 rounded-lg transition-all"><LogOut size={16} />Logout</button>
      </nav>

      <main className="p-4 md:p-6 max-w-[1600px] mx-auto">
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border-l-8 border-teal-500 flex justify-between items-center">
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sales Received</p><h3 className="text-2xl font-black text-teal-600">Rs. {totalReceivedCash.toLocaleString()}</h3></div>
            <ArrowUpRight className="text-teal-500 w-10 h-10 bg-teal-50 p-2 rounded-xl" />
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border-l-8 border-orange-500 flex justify-between items-center">
            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Purchases Amount</p><h3 className="text-2xl font-black text-orange-600">Rs. {totalPurchaseCash.toLocaleString()}</h3></div>
            <ArrowDownLeft className="text-orange-500 w-10 h-10 bg-orange-50 p-2 rounded-xl" />
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-6 bg-slate-200/60 p-1 rounded-xl w-fit">
          <button onClick={() => setActiveTab('Sales')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'Sales' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'}`}>Sales History</button>
          <button onClick={() => setActiveTab('Purchases')} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'Purchases' ? 'bg-white text-orange-500 shadow-sm' : 'text-slate-500'}`}>Purchases History</button>
          <button onClick={() => { setActiveTab('Bill'); setFormData(prev => ({...prev, type: 'Sale', price: "", paidAmount: "", remainingAmount: ""})); }} className={`px-5 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'Bill' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500'}`}>Create Bill / Entry</button>
        </div>

        {/* CONTENT */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
          {activeTab !== 'Bill' ? (
            <div className="overflow-x-auto">
              <div className="p-4 border-b border-slate-100"><input type="text" placeholder="Search in Mobile City..." className="w-full md:w-1/2 pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">CNIC</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3 text-center">IMEI/Serial</th>
                    <th className="px-4 py-3 text-right">Total Bill</th>
                    {activeTab === 'Sales' && <><th className="px-4 py-3 text-right text-teal-600">Paid Amount</th><th className="px-4 py-3 text-right text-red-500">Remaining Balance</th></>}
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (<tr><td colSpan={10} className="p-12 text-center text-slate-300">Syncing...</td></tr>) : filteredData.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50 transition-all group">
                      <td className="px-4 py-4 font-bold text-sm">{c.name}</td>
                      <td className="px-4 py-4 text-xs">{c.phone}</td>
                      <td className="px-4 py-4 text-xs font-mono">{c.cnic}</td>
                      <td className="px-4 py-4 text-xs uppercase font-bold text-slate-500">{c.model}</td>
                      <td className="px-4 py-4 text-center font-bold text-[10px] uppercase">{c.emi}</td>
                      <td className="px-4 py-4 text-right font-bold">Rs. {Number(c.price || 0).toLocaleString()}</td>
                      {activeTab === 'Sales' && <><td className="px-4 py-4 text-right font-bold text-teal-600">Rs. {Number(c.paidAmount || 0).toLocaleString()}</td><td className="px-4 py-4 text-right font-bold text-red-500">Rs. {Number(c.remainingAmount || 0).toLocaleString()}</td></>}
                      <td className="px-4 py-4 text-right flex justify-end gap-1.5">
                        {c.type === 'Sale' && <button onClick={() => setShowPrintPreview(c)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"><Printer size={15} /></button>}
                        <button onClick={() => { setFormData(c); setEditingId(c._id!); setActiveTab('Bill'); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Pencil size={15} /></button>
                        <button onClick={() => { if(window.confirm("Delete?")) deleteCustomerApi(c._id!).then(()=>loadData()); }} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 max-w-4xl mx-auto">
              <div className="flex justify-center gap-3 p-1.5 bg-slate-100 rounded-xl w-fit mx-auto mb-10 border shadow-inner">
                <button type="button" onClick={() => setFormData({...formData, type: 'Sale'})} className={`px-10 py-2.5 rounded-lg font-bold text-xs transition-all ${formData.type === 'Sale' ? 'bg-white text-teal-600 shadow' : 'text-slate-400'}`}>SALE BILL</button>
                <button type="button" onClick={() => setFormData({...formData, type: 'Purchase'})} className={`px-10 py-2.5 rounded-lg font-bold text-xs transition-all ${formData.type === 'Purchase' ? 'bg-white text-orange-600 shadow' : 'text-slate-400'}`}>PURCHASE</button>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-8 rounded-3xl border">
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Name</label>
                <input required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Phone</label>
                <input required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm" value={formData.phone} onChange={handlePhoneChange} /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">CNIC</label>
                <input required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm" value={formData.cnic} onChange={handleCNICChange} /></div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">IMEI / Serial</label>
                <input required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm" value={formData.emi} onChange={e => setFormData({...formData, emi: e.target.value})} /></div>
                <div className="space-y-1 md:col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Model</label>
                <input required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm uppercase" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} /></div>
                
                <div className={`${formData.type === 'Sale' ? 'col-span-1' : 'col-span-2'}`}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Total Bill (Rs)</label>
                  <input required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-teal-600 text-lg shadow-inner outline-none" value={formData.price} onChange={e => handleNumericInput('price', e.target.value)} />
                </div>
                {formData.type === 'Sale' && (
                  <div className="col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Paid Amount (Rs)</label>
                    <input required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-black text-teal-600 text-lg shadow-inner outline-none" value={formData.paidAmount} onChange={e => handleNumericInput('paidAmount', e.target.value)} />
                  </div>
                )}
                {formData.type === 'Sale' && (
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 font-black">Remaining Balance (Rs)</label>
                    <input readOnly className="w-full px-4 py-3 bg-red-50 border border-red-100 rounded-xl font-black text-red-500 text-lg outline-none cursor-not-allowed" value={formData.remainingAmount} />
                  </div>
                )}
                <button type="submit" className={`col-span-2 py-4 text-white font-black rounded-xl shadow-lg uppercase text-xs tracking-widest active:scale-95 transition-all ${formData.type === 'Sale' ? 'bg-[#14B8A6] hover:bg-[#0d9488]' : 'bg-orange-500 hover:bg-orange-600'}`}>
                  {formData.type === 'Sale' ? 'Save & Print Bill' : 'Save Purchase entry'}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* BILL MODAL PREVIEW (Your Screenshot Match) */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 relative shadow-2xl overflow-hidden border-[12px] border-white/5">
            <button onClick={() => setShowPrintPreview(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={20}/></button>
            <div className="border border-slate-100 rounded-2xl p-6 text-center shadow-inner">
                <div className="flex justify-between items-start text-left mb-6">
                    <div><h1 className="text-3xl font-black text-slate-800 m-0 tracking-tight">Mobile City</h1><p className="text-[9px] text-slate-400 font-bold uppercase m-0 tracking-widest">Official Receipt</p></div>
                    <div className="text-right leading-tight font-sans"><p className="font-bold text-[11px] m-0">Hassnain Bhatti</p><p className="text-[10px] m-0 text-slate-400">0300-6322773</p></div>
                </div>

                <div className="space-y-3 text-left text-[11px] border-y py-6 my-4 border-slate-50">
                    <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">Date:</span> <span className="font-black text-slate-700">{showPrintPreview.date}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">Customer:</span> <span className="font-black text-slate-800 uppercase">{showPrintPreview.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">Model:</span> <span className="font-black text-slate-700 uppercase">{showPrintPreview.model}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">IMEI:</span> <span className="font-black text-slate-500 font-mono">{showPrintPreview.emi}</span></div>
                    
                    <div className="pt-4 space-y-1.5">
                        <div className="flex justify-between text-slate-500 border-b border-slate-50 pb-1"><span>Total Bill:</span> <span className="font-bold text-slate-800">Rs. {Number(showPrintPreview.price).toLocaleString()}</span></div>
                        <div className="flex justify-between text-teal-600 font-bold"><span>Paid Amount:</span> <span>Rs. {Number(showPrintPreview.paidAmount).toLocaleString()}</span></div>
                        <div className="flex justify-between text-red-500 font-bold pt-1"><span>Remaining Balance:</span> <span>Rs. {Number(showPrintPreview.remainingAmount).toLocaleString()}</span></div>
                    </div>
                </div>
                
                {/* BLACK BAR BOX */}
                <div className="bg-slate-900 p-5 rounded-2xl flex justify-between items-center text-white shadow-xl">
                    <span className="font-bold uppercase text-[9px] tracking-widest">Total Paid</span>
                    <span className="text-2xl font-black tracking-tighter">Rs. {Number(showPrintPreview.paidAmount).toLocaleString()}</span>
                </div>
                <p className="text-[7px] text-slate-300 uppercase font-black mt-8 tracking-[0.3em] text-center italic">Thanks for shopping at Mobile City</p>
            </div>
            <div className="flex gap-2 mt-6">
                <button onClick={() => handlePrint(showPrintPreview)} className="flex-[2] py-4 bg-teal-600 text-white rounded-xl font-bold text-xs uppercase shadow-xl hover:bg-teal-700 active:scale-95 transition-all">Print Receipt</button>
                <button onClick={() => setShowPrintPreview(null)} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-xl font-bold text-xs uppercase hover:bg-slate-100">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;