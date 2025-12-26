import React, { useState, useEffect } from "react";
import {
  Users, Search, Plus, Smartphone, LogOut,
  Pencil, Trash2, X, Phone, Fingerprint, Calendar, Hash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { getCustomers, addCustomer, updateCustomer, deleteCustomerApi, type CustomerData } from "../api";

const Dashboard = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState<CustomerData>({
    name: "",
    phone: "",
    cnic: "",
    model: "",
    emi: "",
    date: new Date().toISOString().split("T")[0],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getCustomers();
      setCustomers(res.data);
    } catch  {
      toast.error("Database not working!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCNICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); 
    if (value.length <= 13) {
      setFormData({ ...formData, cnic: value });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value.replace(/[^\d+]/g, "");

  if (value.startsWith("+")) {
    if (value.length <= 13) {
      setFormData({ ...formData, phone: value });
    }
  } else {
    const numeric = value.replace(/\D/g, "");
    if (numeric.length <= 11) {
      setFormData({ ...formData, phone: numeric });
    }
  }
};

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone || !formData.cnic || !formData.model) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.cnic.length !== 13) {
      toast.error("CNIC 13 digits ka hona chahiye");
      return;
    }

    try {
      if (editingId !== null) {
        await updateCustomer(editingId, formData);
        toast.success("Record updated successfully!");
      } else {
        await addCustomer(formData);
        toast.success("New customer added!");
      }
      loadData(); 
      closeModal();
    } catch  {
      toast.error("Server error");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      name: "", phone: "", cnic: "", model: "", emi: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const openEditModal = (customer: CustomerData) => {
    setFormData(customer);
    setEditingId(customer._id || null); 
    setIsModalOpen(true);
  };

  const deleteCustomer = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await deleteCustomerApi(id);
        toast.success("Record deleted");
        loadData(); 
      } catch  {
        toast.error("Not able to delete record");
      }
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.cnic.includes(searchQuery) ||
      c.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.emi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans antialiased text-gray-900">
      <Toaster position="top-right" reverseOrder={false} />

      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#14B8A6] p-2 rounded-xl shadow-md">
            <Smartphone className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800 text-lg leading-none">MobileHub</h1>
            <span className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase">Customer Manager</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors font-medium text-sm px-3 py-2 rounded-lg hover:bg-red-50"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>

      <main className="p-6 md:p-10 max-w-[1400px] mx-auto">
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1">Manage your shop purchases and customers</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 min-w-[240px] border-l-4 border-l-[#14B8A6]">
            <div className="bg-[#F0FDFA] p-3 rounded-xl"><Users className="text-[#14B8A6]" size={24} /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Customers</p>
              <h3 className="text-2xl font-black text-gray-800 leading-none mt-1">
                {loading ? "..." : customers.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search name, phone, CNIC, or EMI..."
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#14B8A6] outline-none text-sm transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto bg-[#14B8A6] hover:bg-[#0D9488] text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <Plus size={20} />
              <span>Add Customer</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b">Customer Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b">Phone Number</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b">CNIC Number</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b">Phone Model</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center border-b"> IMEI Number</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b">Purchase Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest text-right border-b">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400 animate-pulse">Loading data from backend...</td></tr>
                ) : filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-6 py-5 font-bold text-gray-800 text-sm">{c.name}</td>
                      <td className="px-6 py-5 text-sm text-gray-600 font-semibold">{c.phone}</td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-mono">{c.cnic}</td>
                      <td className="px-6 py-5 text-sm text-gray-600">{c.model}</td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-3 py-1 bg-teal-50 text-[#14B8A6] rounded-lg text-[10px] font-bold border border-teal-100 uppercase">{c.emi}</span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-500 font-medium">{c.date}</td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(c)} className="p-2 text-gray-400 hover:text-[#14B8A6] hover:bg-teal-50 rounded-xl transition-all"><Pencil size={16} /></button>
                          <button onClick={() => deleteCustomer(c._id!)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={7} className="px-6 py-20 text-center text-gray-400 text-sm italic">No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100">
            <div className="px-8 pt-8 pb-4 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{editingId ? "Edit Customer" : "Add New Customer"}</h3>
                <p className="text-sm text-gray-500 mt-1">Record will be saved to your custom backend.</p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-50 rounded-full transition-colors"><X size={20} className="text-gray-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2"><Users size={14} className="text-[#14B8A6]" /> Full Name</label>
                <input required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/10 text-sm" placeholder="e.g. Ahmed Khan" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2"><Fingerprint size={14} className="text-[#14B8A6]" /> CNIC Number</label>
                <input required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/10 text-sm" placeholder="e.g. 3610315149381" value={formData.cnic} onChange={handleCNICChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2"><Smartphone size={14} className="text-[#14B8A6]" /> Phone Model</label>
                  <input required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#14B8A6] text-sm" placeholder="iPhone 15 Pro" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2"><Hash size={14} className="text-[#14B8A6]" /> IMEI Number</label>
                  <input required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#14B8A6] text-sm" placeholder="IMEI-2024git init
" value={formData.emi} onChange={(e) => setFormData({ ...formData, emi: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2"><Phone size={14} className="text-[#14B8A6]" /> Phone Number</label>
                  <input required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#14B8A6] text-sm" placeholder="03126665011" value={formData.phone} onChange={handlePhoneChange} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2"><Calendar size={14} className="text-[#14B8A6]" /> Purchase Date</label>
                  <input type="date" required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#14B8A6] text-sm" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-6 py-3.5 border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-colors text-sm">Cancel</button>
                <button type="submit" className="flex-[1.5] px-6 py-3.5 bg-[#14B8A6] hover:bg-[#0D9488] text-white font-bold rounded-2xl shadow-lg shadow-teal-100 transition-all text-sm">{editingId ? "Update Record" : "Save Customer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;