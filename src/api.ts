import axios from "axios"; 

export interface CustomerData {
  _id?: string; 
  name: string;
  phone: string;
  cnic: string;
  model: string;
  emi: string;
  date: string;
}

const API_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Login API
export const loginUser = (credentials: { email: string; password?: string }) =>
  api.post("/auth/login", credentials);

// Customer CRUD APIs
export const getCustomers = () => api.get<CustomerData[]>("/customers");
export const addCustomer = (data: CustomerData) => api.post("/customers", data);
export const updateCustomer = (id: string, data: CustomerData) => api.put(`/customers/${id}`, data);
export const deleteCustomerApi = (id: string) => api.delete(`/customers/${id}`);

export default api;